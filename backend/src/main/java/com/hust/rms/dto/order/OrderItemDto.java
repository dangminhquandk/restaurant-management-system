package com.hust.rms.dto.order;

import com.hust.rms.domain.enums.OrderItemStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderItemDto(
        Long id,
        Long orderId,
        Long menuItemId,
        String menuItemName,
        Integer batchNo,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        String note,
        OrderItemStatus status,
        String cancelReason,
        Instant createdAt,
        Instant updatedAt
) {
}
