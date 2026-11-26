package com.hust.rms.domain.payment;

import com.hust.rms.common.util.EmvCoVietQrBuilder;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import com.hust.rms.dto.payment.VietQrPreviewDto;
import com.hust.rms.dto.setting.SystemSettingsDto;
import com.hust.rms.service.SettingService;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/**
 * HUST IT3180 RMS — Chiến lược thanh toán VietQR động chuẩn NAPAS 247 EMVCo TLV + CRC16 (FR-17).
 */
@Component
public class VietQRPaymentStrategy implements PaymentStrategy {

    private final SettingService settingSvc;

    public VietQRPaymentStrategy(SettingService settingSvc) {
        this.settingSvc = settingSvc;
    }

    @Override
    public PaymentMethod method() {
        return PaymentMethod.VIETQR;
    }

    public VietQrPreviewDto buildDynamicPayload(Order order) {
        SystemSettingsDto cfg = settingSvc.getSettings();
        String addInfo = "THANHTOAN " + order.getOrderCode();
        String merchantName = EmvCoVietQrBuilder.normalizeAccountName(cfg.vietqrAccountName());
        String qrPayload = EmvCoVietQrBuilder.buildDynamicVietQr(
                cfg.vietqrBankBin(),
                cfg.vietqrAccountNumber(),
                merchantName,
                order.getTotalAmount(),
                addInfo
        );
        return new VietQrPreviewDto(
                order.getId(),
                order.getOrderCode(),
                order.getTotalAmount(),
                cfg.vietqrBankBin(),
                cfg.vietqrAccountNumber(),
                merchantName,
                addInfo,
                qrPayload
        );
    }

    @Override
    public PaymentComputation process(Order order, ConfirmPaymentRequest req) {
        VietQrPreviewDto preview = buildDynamicPayload(order);
        BigDecimal total = order.getTotalAmount();
        return new PaymentComputation(total, total, BigDecimal.ZERO, preview.qrPayload());
    }
}
