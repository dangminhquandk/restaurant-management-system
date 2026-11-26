package com.hust.rms.dto.report;

import java.math.BigDecimal;

/**
 * HUST IT3180 RMS — Thống kê món bán chạy nhất theo số lượng và doanh thu (FR-22).
 */
public record TopSellingItemDto(
        Long menuItemId,
        String menuItemName,
        String categoryName,
        long totalQuantity,
        BigDecimal totalRevenue
) {
}
