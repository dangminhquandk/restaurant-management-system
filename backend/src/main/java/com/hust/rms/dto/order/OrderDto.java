package com.hust.rms.dto.order;

import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.dto.payment.PaymentDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        Long id,
        String orderCode,
        Long tableId,
        String tableName,
        String areaName,
        Long staffId,
        String staffName,
        OrderStatus status,
        BigDecimal totalAmount,
        Long version,
        Instant createdAt,
        Instant closedAt,
        List<OrderItemDto> items,
        PaymentDto payment
) {
}
