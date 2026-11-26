package com.hust.rms.domain.payment;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/**
 * HUST IT3180 RMS — Chiến lược thanh toán Tiền mặt: kiểm tra tiền khách đưa và tính tiền thừa (FR-16).
 */
@Component
public class CashPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethod method() {
        return PaymentMethod.CASH;
    }

    @Override
    public PaymentComputation process(Order order, ConfirmPaymentRequest req) {
        BigDecimal total = order.getTotalAmount();
        if (req == null || req.amountReceived() == null || req.amountReceived().compareTo(total) < 0) {
            throw new BadRequestException(
                    "INSUFFICIENT_CASH_RECEIVED",
                    "Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền hóa đơn."
            );
        }
        BigDecimal change = req.amountReceived().subtract(total);
        return new PaymentComputation(total, req.amountReceived(), change, null);
    }
}
