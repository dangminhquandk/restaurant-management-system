package com.hust.rms.service;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.enums.*;
import com.hust.rms.domain.state.OrderItemStateMachine;
import com.hust.rms.domain.state.TableStateMachine;
import com.hust.rms.dto.order.*;
import com.hust.rms.event.OrderItemsChangedEvent;
import com.hust.rms.event.TableChangedEvent;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.MenuItemRepository;
import com.hust.rms.repository.OrderRepository;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Điều phối gọi món theo đợt, hủy món theo quyền RBAC và yêu cầu thanh toán (FR-09..11, UC-05).
 */
@Service
public class OrderService {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderRepository orderRepository;
    private final DiningTableRepository diningTableRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderItemStateMachine itemStateMachine;
    private final TableStateMachine tableStateMachine;
    private final AuditLogService auditLogSvc;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(
            OrderRepository orderRepository,
            DiningTableRepository diningTableRepository,
            MenuItemRepository menuItemRepository,
            OrderItemStateMachine itemStateMachine,
            TableStateMachine tableStateMachine,
            AuditLogService auditLogSvc,
            ApplicationEventPublisher eventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.diningTableRepository = diningTableRepository;
        this.menuItemRepository = menuItemRepository;
        this.itemStateMachine = itemStateMachine;
        this.tableStateMachine = tableStateMachine;
        this.auditLogSvc = auditLogSvc;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public OrderDto getActiveOrderByTable(Long tableId) {
        if (!diningTableRepository.existsById(tableId)) {
            throw new ResourceNotFoundException("TABLE_NOT_FOUND", "Không tìm thấy bàn ăn.");
        }
        Order order = orderRepository.findActiveDetailByTableId(tableId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ACTIVE_ORDER_NOT_FOUND",
                        "Bàn hiện chưa có đơn phục vụ đang mở."
                ));
        return DtoMapper.toOrderDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderSummaryDto> listOrders(
            OrderStatus status,
            LocalDate from,
            LocalDate to,
            PaymentMethod method
    ) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("INVALID_DATE_RANGE", "Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        }
        Instant fromInstant = from != null ? from.atStartOfDay(RESTAURANT_ZONE).toInstant() : null;
        Instant toExclusive = to != null ? to.plusDays(1).atStartOfDay(RESTAURANT_ZONE).toInstant() : null;
        return orderRepository.findOrderSummaries(status, fromInstant, toExclusive, method).stream()
                .map(DtoMapper::toOrderSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        return DtoMapper.toOrderDto(order);
    }

    @Transactional
    public OrderDto addItemsToOrder(Long orderId, AddOrderItemsRequest request) {
        Order order = orderRepository.findDetailById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new ConflictException("ORDER_NOT_OPEN", "Chỉ có thể thêm món vào đơn hàng đang mở.");
        }

        Map<Long, MenuItem> menuMap = loadAndValidateMenuItems(request.items());
        int nextBatchNo = order.getItems().stream()
                .mapToInt(OrderItem::getBatchNo)
                .max()
                .orElse(0) + 1;

        List<OrderItem> newlyAdded = new ArrayList<>();
        for (OrderItemRequest itemReq : request.items()) {
            MenuItem menuItem = menuMap.get(itemReq.menuItemId());
            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setBatchNo(nextBatchNo);
            orderItem.setQuantity(itemReq.quantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            orderItem.setNote(itemReq.note());
            orderItem.setStatus(OrderItemStatus.PENDING);
            order.addItem(orderItem);
            newlyAdded.add(orderItem);
        }

        order.setTotalAmount(recalculateTotalAmount(order));
        Order saved = orderRepository.saveAndFlush(order);

        List<OrderItemDto> addedDtos = newlyAdded.stream()
                .map(DtoMapper::toOrderItemDto)
                .toList();
        eventPublisher.publishEvent(new OrderItemsChangedEvent(
                "ORDER_ITEMS_ADDED",
                saved.getId(),
                saved.getOrderCode(),
                saved.getTable().getId(),
                saved.getTable().getName(),
                addedDtos,
                Instant.now()
        ));
        return DtoMapper.toOrderDto(saved);
    }

    @Transactional
    public OrderDto cancelOrderItem(
            Long orderId,
            Long itemId,
            CancelOrderItemRequest req,
            RmsUserPrincipal actor
    ) {
        Order order = orderRepository.findDetailById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new ConflictException("ORDER_NOT_OPEN", "Không thể hủy món trên đơn hàng đã đóng.");
        }

        OrderItem targetItem = order.getItems().stream()
                .filter(i -> Objects.equals(i.getId(), itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ORDER_ITEM_NOT_FOUND",
                        "Không tìm thấy dòng món trong đơn hàng."
                ));

        OrderItemStatus previousStatus = targetItem.getStatus();
        String rawReason = req != null ? req.reason() : null;
        itemStateMachine.validateTransition(previousStatus, OrderItemStatus.CANCELLED, actor.getRole(), rawReason);

        String normalizedReason = (rawReason != null && !rawReason.isBlank()) ? rawReason.trim() : null;
        Instant now = Instant.now();
        targetItem.setStatus(OrderItemStatus.CANCELLED);
        targetItem.setCancelReason(normalizedReason);
        targetItem.setUpdatedAt(now);

        order.setTotalAmount(recalculateTotalAmount(order));
        Order saved = orderRepository.saveAndFlush(order);

        if (previousStatus == OrderItemStatus.COOKING) {
            auditLogSvc.logCurrentActor(
                    "ORDER_ITEM_CANCELLED_COOKING",
                    "ORDER_ITEMS",
                    targetItem.getId(),
                    String.format("Hủy món đang chế biến '%s' (x%d) tại đơn %s — Lý do: %s",
                            targetItem.getMenuItem().getName(),
                            targetItem.getQuantity(),
                            saved.getOrderCode(),
                            normalizedReason)
            );
        }

        eventPublisher.publishEvent(new OrderItemsChangedEvent(
                "ITEM_CANCELLED",
                saved.getId(),
                saved.getOrderCode(),
                saved.getTable().getId(),
                saved.getTable().getName(),
                List.of(DtoMapper.toOrderItemDto(targetItem)),
                now
        ));
        return DtoMapper.toOrderDto(saved);
    }

    @Transactional
    public OrderDto requestPayment(Long orderId) {
        Order order = orderRepository.findDetailById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BadRequestException("ORDER_NOT_OPEN", "Chỉ có thể yêu cầu thanh toán cho đơn đang mở.");
        }

        DiningTable table = order.getTable();
        if (table.getStatus() != TableStatus.WAITING_PAYMENT) {
            tableStateMachine.validateTransition(table.getStatus(), TableStatus.WAITING_PAYMENT);
            table.setStatus(TableStatus.WAITING_PAYMENT);
            diningTableRepository.saveAndFlush(table);
        }

        eventPublisher.publishEvent(TableChangedEvent.updated(table.getId(), TableStatus.WAITING_PAYMENT));
        return DtoMapper.toOrderDto(order);
    }

    public static BigDecimal recalculateTotalAmount(Order order) {
        return order.getItems().stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<Long, MenuItem> loadAndValidateMenuItems(List<OrderItemRequest> requests) {
        Set<Long> requestedIds = requests.stream()
                .map(OrderItemRequest::menuItemId)
                .collect(Collectors.toSet());
        Map<Long, MenuItem> menuMap = menuItemRepository.findAllById(requestedIds).stream()
                .collect(Collectors.toMap(MenuItem::getId, Function.identity()));

        for (OrderItemRequest req : requests) {
            MenuItem item = menuMap.get(req.menuItemId());
            if (item == null) {
                throw new ResourceNotFoundException(
                        "MENU_ITEM_NOT_FOUND",
                        "Không tìm thấy món ăn có mã " + req.menuItemId()
                );
            }
            if (item.getDeletedAt() != null || !Boolean.TRUE.equals(item.getIsAvailable())) {
                throw new UnprocessableEntityException(
                        "MENU_ITEM_UNAVAILABLE",
                        String.format("Món '%s' hiện tạm hết hoặc đã ngừng phục vụ.", item.getName())
                );
            }
        }
        return menuMap;
    }
}

