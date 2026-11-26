package com.hust.rms.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * HUST IT3180 RMS — Báo cáo tổng hợp doanh thu, cơ cấu phương thức thanh toán và Top 10 món (FR-22).
 */
public record RevenueReportDto(
        LocalDate from,
        LocalDate to,
        BigDecimal totalRevenue,
        long paidOrderCount,
        BigDecimal cashRevenue,
        BigDecimal vietqrRevenue,
        List<DailyRevenuePointDto> dailySeries,
        List<TopSellingItemDto> topItems
) {
}
