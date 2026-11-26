package com.hust.rms.domain.payment;

import java.math.BigDecimal;

/**
 * HUST IT3180 RMS — Kết quả tính toán của chiến lược thanh toán trước khi lưu giao dịch ACID.
 */
public record PaymentComputation(
        BigDecimal amount,
        BigDecimal amountReceived,
        BigDecimal changeAmount,
        String qrPayload
) {
}
