package com.hust.rms.service;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.Payment;
import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.*;
import com.hust.rms.domain.payment.PaymentComputation;
import com.hust.rms.domain.payment.PaymentStrategy;
import com.hust.rms.domain.payment.VietQRPaymentStrategy;
import com.hust.rms.domain.state.TableStateMachine;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import com.hust.rms.dto.payment.PaymentDto;
import com.hust.rms.dto.payment.VietQrPreviewDto;
import com.hust.rms.event.TableChangedEvent;
import com.hust.rms.repository.*;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Dịch vụ chốt thanh toán hóa đơn ACID áp dụng Strategy Pattern (FR-16, FR-17).
 */
@Service
public class PaymentService {

    private final Map<PaymentMethod, PaymentStrategy> strategies;
    private final VietQRPaymentStrategy vietQrStrategy;
    private final OrderRepository orderRepo;
    private final PaymentRepository paymentRepo;
    private final DiningTableRepository tableRepo;
    private final UserRepository userRepo;
    private final TableStateMachine tableStateMachine;
    private final AuditLogService auditLogSvc;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentService(
            List<PaymentStrategy> strategyList,
            VietQRPaymentStrategy vietQrStrategy,
            OrderRepository orderRepo,
            PaymentRepository paymentRepo,
            DiningTableRepository tableRepo,
            UserRepository userRepo,
            TableStateMachine tableStateMachine,
            AuditLogService auditLogSvc,
            ApplicationEventPublisher eventPublisher
    ) {
        Map<PaymentMethod, PaymentStrategy> registry = new EnumMap<>(PaymentMethod.class);
        for (PaymentStrategy s : strategyList) {
            registry.put(s.method(), s);
        }
        this.strategies = Map.copyOf(registry);
        this.vietQrStrategy = vietQrStrategy;
        this.orderRepo = orderRepo;
        this.paymentRepo = paymentRepo;
        this.tableRepo = tableRepo;
        this.userRepo = userRepo;
        this.tableStateMachine = tableStateMachine;
        this.auditLogSvc = auditLogSvc;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public VietQrPreviewDto previewVietQr(Long orderId) {
        Order order = orderRepo.findDetailById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new ConflictException("ORDER_NOT_OPEN", "Đơn hàng đã thanh toán hoặc đã đóng.");
        }
        BigDecimal total = OrderService.recalculateTotalAmount(order);
        order.setTotalAmount(total);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("EMPTY_ORDER_AMOUNT", "Không thể sinh VietQR cho đơn hàng 0 đồng.");
        }
        return vietQrStrategy.buildDynamicPayload(order);
    }

    @Transactional
    public PaymentDto confirmPayment(Long orderId, ConfirmPaymentRequest req, RmsUserPrincipal actor) {
        Order order = orderRepo.findDetailById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));
        if (order.getStatus() != OrderStatus.OPEN || paymentRepo.findByOrderId(orderId).isPresent()) {
            throw new ConflictException("ORDER_ALREADY_PAID", "Đơn hàng đã được thanh toán hoặc đã đóng.");
        }

        BigDecimal total = OrderService.recalculateTotalAmount(order);
        order.setTotalAmount(total);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("EMPTY_ORDER_AMOUNT", "Không thể xác nhận thanh toán cho đơn 0 đồng.");
        }

        PaymentStrategy strategy = strategies.get(req.method());
        if (strategy == null) {
            throw new BadRequestException("UNSUPPORTED_PAYMENT_METHOD", "Phương thức thanh toán chưa được hỗ trợ.");
        }
        PaymentComputation comp = strategy.process(order, req);

        User cashier = userRepo.findById(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy thu ngân."));

        Instant paidNow = Instant.now();
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setCashier(cashier);
        payment.setMethod(req.method());
        payment.setAmount(comp.amount());
        payment.setAmountReceived(comp.amountReceived());
        payment.setChangeAmount(comp.changeAmount());
        payment.setQrPayload(comp.qrPayload());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(paidNow);
        Payment savedPayment = paymentRepo.saveAndFlush(payment);

        order.setStatus(OrderStatus.PAID);
        order.setClosedAt(paidNow);
        order.setPayment(savedPayment);
        orderRepo.saveAndFlush(order);

        DiningTable table = order.getTable();
        tableStateMachine.validateTransition(table.getStatus(), TableStatus.CLEANING);
        table.setStatus(TableStatus.CLEANING);
        tableRepo.saveAndFlush(table);

        auditLogSvc.log(
                cashier,
                "PAYMENT_CONFIRMED",
                "ORDERS",
                order.getId(),
                String.format("Xác nhận thanh toán %s %sđ cho đơn %s (Bàn %s)",
                        req.method(), comp.amount().toPlainString(), order.getOrderCode(), table.getName())
        );

        eventPublisher.publishEvent(TableChangedEvent.updated(table.getId(), TableStatus.CLEANING));
        return DtoMapper.toPaymentDto(savedPayment);
    }
}
