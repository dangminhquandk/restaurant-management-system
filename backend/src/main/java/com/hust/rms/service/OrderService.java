package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.common.exception.UnprocessableEntityException;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.order.AddOrderItemsRequest;
import com.hust.rms.dto.order.OrderDto;
import com.hust.rms.dto.order.OrderItemDto;
import com.hust.rms.dto.order.OrderItemRequest;
import com.hust.rms.dto.order.OrderSummaryDto;
import com.hust.rms.event.OrderItemsChangedEvent;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.MenuItemRepository;
import com.hust.rms.repository.OrderRepository;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates POS order queries, multi-batch item additions, historical price snapshots, and total recalculation.
 */
@Service
public class OrderService {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderRepository orderRepository;
    private final DiningTableRepository diningTableRepository;
    private final MenuItemRepository menuItemRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(
            OrderRepository orderRepository,
            DiningTableRepository diningTableRepository,
            MenuItemRepository menuItemRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.diningTableRepository = diningTableRepository;
        this.menuItemRepository = menuItemRepository;
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
