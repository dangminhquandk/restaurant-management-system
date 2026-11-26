package com.hust.rms.dto.payment;

import java.math.BigDecimal;

/**
 * HUST IT3180 RMS — Dữ liệu hiển thị mã VietQR EMVCo động cho hóa đơn tại quầy POS (FR-17).
 */
public record VietQrPreviewDto(
        Long orderId,
        String orderCode,
        BigDecimal amount,
        String bankBin,
        String accountNumber,
        String accountName,
        String addInfo,
        String qrPayload
) {
}
