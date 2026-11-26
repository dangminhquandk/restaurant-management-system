package com.hust.rms;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.dto.auth.LoginRequest;
import com.hust.rms.dto.auth.LoginResponse;
import com.hust.rms.dto.kds.KdsItemDto;
import com.hust.rms.dto.kds.UpdateKdsItemStatusRequest;
import com.hust.rms.dto.menu.MenuItemAvailabilityRequest;
import com.hust.rms.dto.menu.MenuItemDto;
import com.hust.rms.dto.order.AddOrderItemsRequest;
import com.hust.rms.dto.order.OrderDto;
import com.hust.rms.dto.order.OrderItemRequest;
import com.hust.rms.dto.table.OpenTableRequest;
import com.hust.rms.dto.table.OpenTableResponse;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.MenuItemRepository;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.lang.NonNull;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestClient;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

/**
 * HUST IT3180 RMS — Kiểm thử tích hợp kênh WebSocket STOMP thực tế và đo độ trễ < 1000 ms (FR-12, FR-14, FR-15, NFR-01).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketStompLatencyIntegrationTest {

    @LocalServerPort
    private int serverPort;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DiningTableRepository tableRepo;

    @Autowired
    private MenuItemRepository dishRepo;

    private RestClient http;

    private record StompCapture(Map<String, Object> body, long receivedAtNano) {
    }

    @BeforeEach
    void initHttpClient() {
        this.http = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory())
                .baseUrl("http://localhost:" + serverPort)
                .build();
    }

    @Test
    @DisplayName("NFR-01: Kết nối STOMP ws://localhost:{port}/ws nhận sự kiện KDS, Chuông POS và Khóa món với độ trễ < 1000 ms")
    void stompTopicsDeliverKdsPosNotificationAndMenuAvailabilityUnderOneSecond() throws Exception {
        String staffJwt = obtainJwt("staff1", "staff123");
        String kitchenJwt = obtainJwt("kitchen1", "kitchen123");

        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter jacksonConverter = new MappingJackson2MessageConverter();
        jacksonConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(jacksonConverter);

        BlockingQueue<StompCapture> kdsEvents = new LinkedBlockingQueue<>();
        BlockingQueue<StompCapture> posAlerts = new LinkedBlockingQueue<>();
        BlockingQueue<StompCapture> menuEvents = new LinkedBlockingQueue<>();

        WebSocketHttpHeaders wsHeaders = new WebSocketHttpHeaders();
        wsHeaders.setOrigin("http://localhost:5173");
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + kitchenJwt);

        String wsUrl = "ws://localhost:" + serverPort + "/ws";
        StompSession session = stompClient
                .connectAsync(wsUrl, wsHeaders, connectHeaders, new StompSessionHandlerAdapter() {
                })
                .get(5, TimeUnit.SECONDS);

        MenuItem caramen = dishRepo.findAll().stream()
                .filter(m -> "Caramen Hàng Than".equals(m.getName()))
                .findFirst()
                .orElseThrow();

        try {
            session.subscribe("/topic/kds/orders", buildHandler(kdsEvents));
            session.subscribe("/topic/pos/notifications", buildHandler(posAlerts));
            session.subscribe("/topic/menu/availability", buildHandler(menuEvents));

            // Đợi SimpleBroker đăng ký xong 3 subscription trong bộ nhớ trước khi kích hoạt REST
            Thread.sleep(150);

            DiningTable sv02 = tableRepo.findAll().stream()
                    .filter(t -> "SV-02".equals(t.getName()))
                    .findFirst()
                    .orElseThrow();
            MenuItem phoBo = dishRepo.findAll().stream()
                    .filter(m -> "Phở Bò Tái Lăn".equals(m.getName()))
                    .findFirst()
                    .orElseThrow();

            ResponseEntity<OpenTableResponse> openResp = http.post()
                    .uri("/api/v1/tables/{id}/open", sv02.getId())
                    .headers(h -> h.setBearerAuth(staffJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new OpenTableRequest(sv02.getVersion()))
                    .retrieve()
                    .toEntity(OpenTableResponse.class);
            assertEquals(HttpStatus.OK, openResp.getStatusCode());
            Long orderId = openResp.getBody().order().id();

            // 1. Gửi món từ POS -> đo độ trễ nhận trên /topic/kds/orders
            AddOrderItemsRequest batchReq = new AddOrderItemsRequest(
                    List.of(new OrderItemRequest(phoBo.getId(), 2, "Không hành tây"))
            );
            long tAddStart = System.nanoTime();
            ResponseEntity<OrderDto> addResp = http.post()
                    .uri("/api/v1/orders/{id}/items", orderId)
                    .headers(h -> h.setBearerAuth(staffJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(batchReq)
                    .retrieve()
                    .toEntity(OrderDto.class);
            assertEquals(HttpStatus.CREATED, addResp.getStatusCode());
            Long itemId = addResp.getBody().items().get(0).id();

            StompCapture kdsAdded = kdsEvents.poll(2, TimeUnit.SECONDS);
            assertNotNull(kdsAdded, "Phải nhận được frame STOMP trên /topic/kds/orders khi gửi món");
            long addLatencyMs = TimeUnit.NANOSECONDS.toMillis(kdsAdded.receivedAtNano() - tAddStart);
            assertEquals("ORDER_ITEMS_ADDED", kdsAdded.body().get("eventType"));
            assertEquals(orderId.intValue(), ((Number) kdsAdded.body().get("orderId")).intValue());
            assertTrue(addLatencyMs < 1000L, "Độ trễ KDS vượt ngưỡng 1000ms: " + addLatencyMs + "ms");

            // 2. Bếp chuyển PENDING -> COOKING -> READY -> đo độ trễ /topic/kds/orders & /topic/pos/notifications
            ResponseEntity<KdsItemDto> cookingResp = http.patch()
                    .uri("/api/v1/kds/items/{itemId}/status", itemId)
                    .headers(h -> h.setBearerAuth(kitchenJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new UpdateKdsItemStatusRequest(OrderItemStatus.COOKING))
                    .retrieve()
                    .toEntity(KdsItemDto.class);
            assertEquals(HttpStatus.OK, cookingResp.getStatusCode());
            StompCapture kdsCooking = kdsEvents.poll(2, TimeUnit.SECONDS);
            assertNotNull(kdsCooking);
            assertEquals("ITEM_STATUS_CHANGED", kdsCooking.body().get("eventType"));

            long tReadyStart = System.nanoTime();
            ResponseEntity<KdsItemDto> readyResp = http.patch()
                    .uri("/api/v1/kds/items/{itemId}/status", itemId)
                    .headers(h -> h.setBearerAuth(kitchenJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new UpdateKdsItemStatusRequest(OrderItemStatus.READY))
                    .retrieve()
                    .toEntity(KdsItemDto.class);
            assertEquals(HttpStatus.OK, readyResp.getStatusCode());

            StompCapture kdsReady = kdsEvents.poll(2, TimeUnit.SECONDS);
            StompCapture posReadyAlert = posAlerts.poll(2, TimeUnit.SECONDS);
            assertNotNull(kdsReady, "KDS phải nhận được cập nhật READY");
            assertNotNull(posReadyAlert, "POS phải nhận được thông báo ITEM_READY");

            long readyNotifLatencyMs = TimeUnit.NANOSECONDS.toMillis(posReadyAlert.receivedAtNano() - tReadyStart);
            assertEquals("ITEM_READY", posReadyAlert.body().get("eventType"));
            assertEquals("Bàn SV-02: 2x Phở Bò Tái Lăn đã nấu xong!", posReadyAlert.body().get("message"));
            assertTrue(readyNotifLatencyMs < 1000L, "Độ trễ thông báo món chín vượt 1000ms: " + readyNotifLatencyMs + "ms");

            // 3. Bếp báo tạm hết món -> đo độ trễ /topic/menu/availability
            long tMenuStart = System.nanoTime();
            ResponseEntity<MenuItemDto> availResp = http.patch()
                    .uri("/api/v1/menu-items/{id}/availability", caramen.getId())
                    .headers(h -> h.setBearerAuth(kitchenJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new MenuItemAvailabilityRequest(false))
                    .retrieve()
                    .toEntity(MenuItemDto.class);
            assertEquals(HttpStatus.OK, availResp.getStatusCode());

            StompCapture menuBroadcast = menuEvents.poll(2, TimeUnit.SECONDS);
            assertNotNull(menuBroadcast, "Các máy POS phải nhận được sự kiện MENU_AVAILABILITY_CHANGED");
            long menuLatencyMs = TimeUnit.NANOSECONDS.toMillis(menuBroadcast.receivedAtNano() - tMenuStart);
            assertEquals("MENU_AVAILABILITY_CHANGED", menuBroadcast.body().get("eventType"));
            assertEquals(caramen.getId().intValue(), ((Number) menuBroadcast.body().get("menuItemId")).intValue());
            assertEquals(Boolean.FALSE, menuBroadcast.body().get("isAvailable"));
            assertTrue(menuLatencyMs < 1000L, "Độ trễ khóa món vượt ngưỡng 1000ms: " + menuLatencyMs + "ms");
        } finally {
            // Khôi phục trạng thái còn món cho các ca kiểm thử sau
            http.patch()
                    .uri("/api/v1/menu-items/{id}/availability", caramen.getId())
                    .headers(h -> h.setBearerAuth(kitchenJwt))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new MenuItemAvailabilityRequest(true))
                    .retrieve()
                    .toBodilessEntity();
            if (session.isConnected()) {
                session.disconnect();
            }
            stompClient.stop();
        }
    }

    private String obtainJwt(String username, String password) {
        ResponseEntity<LoginResponse> resp = http.post()
                .uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest(username, password))
                .retrieve()
                .toEntity(LoginResponse.class);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        return resp.getBody().accessToken();
    }

    private static StompFrameHandler buildHandler(BlockingQueue<StompCapture> sink) {
        return new StompFrameHandler() {
            @Override
            @NonNull
            public Type getPayloadType(@NonNull StompHeaders headers) {
                return Map.class;
            }

            @Override
            @SuppressWarnings("unchecked")
            public void handleFrame(@NonNull StompHeaders headers, Object payload) {
                sink.offer(new StompCapture((Map<String, Object>) payload, System.nanoTime()));
            }
        };
    }
}
