package com.hust.rms.dto.kds;

import com.hust.rms.domain.enums.OrderItemStatus;
import java.time.Instant;

/**
 * HUST IT3180 RMS — Dòng món trên bảng điều phối bếp KDS sắp xếp FIFO (FR-12..14).
 */
public record KdsItemDto(
        Long id,
        Long orderId,
        String orderCode,
        Long tableId,
        String tableName,
        String areaName,
        Long menuItemId,
        String menuItemName,
        Integer batchNo,
        Integer quantity,
        String note,
        OrderItemStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
