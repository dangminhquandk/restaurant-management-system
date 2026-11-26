package com.hust.rms.event;

import com.hust.rms.dto.order.OrderItemDto;
import java.time.Instant;
import java.util.List;

public record OrderItemsChangedEvent(
        String eventType,
        Long orderId,
        String orderCode,
        Long tableId,
        String tableName,
        List<OrderItemDto> items,
        Instant timestamp
) {
}
