package com.hust.rms.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * HUST IT3180 RMS — Điểm dữ liệu doanh thu theo từng ngày phục vụ (FR-22).
 */
public record DailyRevenuePointDto(
        LocalDate date,
        BigDecimal revenue,
        long orderCount
) {
}
