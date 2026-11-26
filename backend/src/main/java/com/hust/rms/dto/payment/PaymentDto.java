package com.hust.rms.dto.payment;

import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.domain.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentDto(
        Long id,
        Long orderId,
        String orderCode,
        PaymentMethod method,
        BigDecimal amount,
        BigDecimal amountReceived,
        BigDecimal changeAmount,
        String qrPayload,
        PaymentStatus status,
        Instant paidAt,
        String cashierName
) {
}
