package com.hust.rms;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.dto.auth.*;
import com.hust.rms.dto.table.OpenTableRequest;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.OrderRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

/**
 * HUST IT3180 RMS — Kiểm thử đa luồng Khóa lạc quan @Version khi 5 phục vụ mở cùng 1 bàn (FR-05, NFR-02).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class TableConcurrencyIntegrationTest {

    @Autowired
    private TestRestTemplate restClient;

    @Autowired
    private DiningTableRepository tableRepo;

    @Autowired
    private OrderRepository orderRepo;

    @Test
    @DisplayName("TC-09..10 (NFR-02): 5 luồng bắn song song mở bàn T1-02 -> đúng 1 luồng 200 OK và 4 luồng 409 Conflict")
    void fiveConcurrentOpenRequestsAllowExactlyOneWinner() throws Exception {
        ResponseEntity<LoginResponse> authResp = restClient.postForEntity(
                "/api/v1/auth/login",
                new LoginRequest("staff1", "staff123"),
                LoginResponse.class
        );
        assertEquals(HttpStatus.OK, authResp.getStatusCode());
        String jwt = authResp.getBody().accessToken();

        DiningTable target = tableRepo.findAll().stream()
                .filter(t -> "T1-02".equals(t.getName()))
                .findFirst()
                .orElseThrow();
        Long initialVersion = target.getVersion();

        int workerCount = 5;
        ExecutorService pool = Executors.newFixedThreadPool(workerCount);
        CountDownLatch readyGate = new CountDownLatch(workerCount);
        CountDownLatch fireGate = new CountDownLatch(1);

        List<Future<Integer>> outcomes = new ArrayList<>();
        for (int i = 0; i < workerCount; i++) {
            outcomes.add(pool.submit(() -> {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(jwt);
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<OpenTableRequest> req = new HttpEntity<>(new OpenTableRequest(initialVersion), headers);
                readyGate.countDown();
                fireGate.await(5, TimeUnit.SECONDS);
                ResponseEntity<String> res = restClient.postForEntity(
                        "/api/v1/tables/" + target.getId() + "/open",
                        req,
                        String.class
                );
                return res.getStatusCode().value();
            }));
        }

        readyGate.await(5, TimeUnit.SECONDS);
        fireGate.countDown();

        int okCount = 0;
        int conflictCount = 0;
        for (Future<Integer> f : outcomes) {
            int status = f.get(10, TimeUnit.SECONDS);
            if (status == 200) {
                okCount++;
            } else if (status == 409) {
                conflictCount++;
            }
        }
        pool.shutdownNow();

        assertEquals(1, okCount, "Phải có đúng 1 request mở bàn thành công (200 OK)");
        assertEquals(4, conflictCount, "4 request đồng thời còn lại phải nhận 409 Conflict");
        long openOrdersForTable = orderRepo.findByStatusAndTableIdIn(OrderStatus.OPEN, List.of(target.getId())).size();
        assertEquals(1L, openOrdersForTable, "Chỉ được tồn tại duy nhất 1 đơn OPEN cho bàn T1-02");
    }
}
