package com.hust.rms.domain.payment;

import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;

/**
 * HUST IT3180 RMS — Mẫu thiết kế GoF Strategy tách biệt thuật toán thanh toán theo OCP/DIP (SDD 3.2).
 */
public interface PaymentStrategy {

    PaymentMethod method();

    PaymentComputation process(Order order, ConfirmPaymentRequest req);
}
