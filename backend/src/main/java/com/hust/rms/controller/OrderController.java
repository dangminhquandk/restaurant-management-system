package com.hust.rms.controller;

import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.order.*;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.OrderService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint cho Đơn gọi món tại bàn, Hủy món & Yêu cầu thanh toán (FR-09..11, FR-18).
 */
@RestController
public class OrderController {

    private final OrderService orderSvc;

    public OrderController(OrderService orderSvc) {
        this.orderSvc = orderSvc;
    }

    @GetMapping("/api/v1/tables/{tableId}/active-order")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OrderDto lookupActiveTableOrder(@PathVariable Long tableId) {
        return orderSvc.getActiveOrderByTable(tableId);
    }

    @GetMapping("/api/v1/orders")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public List<OrderSummaryDto> filterOrderHistory(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) PaymentMethod method
    ) {
        return orderSvc.listOrders(status, from, to, method);
    }

    @GetMapping("/api/v1/orders/{id}")
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public OrderDto fetchOrderDetails(@PathVariable Long id) {
        return orderSvc.getOrderById(id);
    }

    @PostMapping("/api/v1/orders/{id}/items")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OrderDto submitKitchenBatch(@PathVariable Long id, @Valid @RequestBody AddOrderItemsRequest payload) {
        return orderSvc.addItemsToOrder(id, payload);
    }

    @PostMapping("/api/v1/orders/{id}/items/{itemId}/cancel")
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public OrderDto cancelDispatchedItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody(required = false) CancelOrderItemRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return orderSvc.cancelOrderItem(id, itemId, payload, actor);
    }

    @PostMapping("/api/v1/orders/{id}/request-payment")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OrderDto signalWaitingPayment(@PathVariable Long id) {
        return orderSvc.requestPayment(id);
    }
}

