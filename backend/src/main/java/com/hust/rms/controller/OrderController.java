package com.hust.rms.controller;

import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.order.*;
import com.hust.rms.service.OrderService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint cho Đơn gọi món tại bàn & Lịch sử hóa đơn (FR-09, FR-10, FR-18).
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
}
