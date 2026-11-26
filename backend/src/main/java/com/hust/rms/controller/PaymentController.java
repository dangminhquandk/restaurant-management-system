package com.hust.rms.controller;

import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import com.hust.rms.dto.payment.PaymentDto;
import com.hust.rms.dto.payment.VietQrPreviewDto;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint xem trước VietQR động và chốt thanh toán hóa đơn (FR-16, FR-17).
 */
@RestController
@RequestMapping("/api/v1/orders/{id}/payments")
public class PaymentController {

    private final PaymentService paymentSvc;

    public PaymentController(PaymentService paymentSvc) {
        this.paymentSvc = paymentSvc;
    }

    @PostMapping("/vietqr-preview")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public VietQrPreviewDto generateDynamicVietQr(@PathVariable Long id) {
        return paymentSvc.previewVietQr(id);
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public PaymentDto settleOrderInvoice(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmPaymentRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return paymentSvc.confirmPayment(id, payload, actor);
    }
}
