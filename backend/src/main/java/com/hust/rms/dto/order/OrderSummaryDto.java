package com.hust.rms.dto.order;

import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderSummaryDto(
        Long id,
        String orderCode,
        String tableName,
        String staffName,
        OrderStatus status,
        BigDecimal totalAmount,
        PaymentMethod paymentMethod,
        Instant createdAt,
        Instant closedAt
) {
}
