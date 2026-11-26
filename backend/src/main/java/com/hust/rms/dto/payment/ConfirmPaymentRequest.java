package com.hust.rms.dto.payment;

import com.hust.rms.domain.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * HUST IT3180 RMS — Yêu cầu thu ngân chốt thanh toán Tiền mặt hoặc VietQR (FR-16, FR-17).
 */
public record ConfirmPaymentRequest(
        @NotNull(message = "Phương thức thanh toán không được để trống")
        PaymentMethod method,

        BigDecimal amountReceived
) {
}
