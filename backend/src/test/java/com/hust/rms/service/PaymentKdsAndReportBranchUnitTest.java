package com.hust.rms.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.*;
import com.hust.rms.domain.enums.*;
import com.hust.rms.domain.payment.*;
import com.hust.rms.domain.state.*;
import com.hust.rms.dto.kds.UpdateKdsItemStatusRequest;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import com.hust.rms.dto.report.RevenueReportDto;
import com.hust.rms.repository.*;
import com.hust.rms.security.RmsUserPrincipal;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * HUST IT3180 RMS — Kiểm thử hộp trắng phủ nhánh cho CashPaymentStrategy, PaymentService, KdsService và ReportService.
 */
class PaymentKdsAndReportBranchUnitTest {

    private static RmsUserPrincipal principalOf(Long id, String username, Role role) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPasswordHash("pw");
        u.setFullName(username);
        u.setRole(role);
        u.setIsActive(true);
        return RmsUserPrincipal.fromUser(u);
    }

    @Test
    @DisplayName("CashPaymentStrategy & PaymentService: phủ toàn bộ nhánh tiền mặt thiếu/null, đơn 0 đồng và đơn đã đóng")
    void paymentStrategyAndServiceAllBranches() {
        CashPaymentStrategy cashStrategy = new CashPaymentStrategy();
        Order order = new Order();
        order.setId(1L);
        order.setOrderCode("ORD-20260515-0001");
        order.setStatus(OrderStatus.OPEN);
        order.setTotalAmount(BigDecimal.valueOf(120000));

        assertThatThrownBy(() -> cashStrategy.process(order, null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> cashStrategy.process(order, new ConfirmPaymentRequest(PaymentMethod.CASH, null)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> cashStrategy.process(order, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.valueOf(100000))))
                .isInstanceOf(BadRequestException.class);
        assertThat(cashStrategy.process(order, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.valueOf(150000))).changeAmount())
                .isEqualByComparingTo(BigDecimal.valueOf(30000));

        VietQRPaymentStrategy vietQr = mock(VietQRPaymentStrategy.class);
        when(vietQr.method()).thenReturn(PaymentMethod.VIETQR);
        OrderRepository orderRepo = mock(OrderRepository.class);
        PaymentRepository paymentRepo = mock(PaymentRepository.class);
        DiningTableRepository tableRepo = mock(DiningTableRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        AuditLogService auditSvc = mock(AuditLogService.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);

        // Construct PaymentService with only CASH registered to test UNSUPPORTED_PAYMENT_METHOD branch too
        PaymentService paymentSvcOnlyCash = new PaymentService(
                List.of(cashStrategy), vietQr, orderRepo, paymentRepo, tableRepo, userRepo,
                new TableStateMachine(), auditSvc, publisher
        );
        RmsUserPrincipal cashier = principalOf(2L, "staff1", Role.STAFF);

        when(orderRepo.findDetailById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentSvcOnlyCash.previewVietQr(404L))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> paymentSvcOnlyCash.confirmPayment(404L, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.TEN), cashier))
                .isInstanceOf(ResourceNotFoundException.class);

        Order emptyOpenOrder = new Order();
        emptyOpenOrder.setId(2L);
        emptyOpenOrder.setStatus(OrderStatus.OPEN);
        when(orderRepo.findDetailById(2L)).thenReturn(Optional.of(emptyOpenOrder));
        when(paymentRepo.findByOrderId(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentSvcOnlyCash.previewVietQr(2L))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> paymentSvcOnlyCash.confirmPayment(2L, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.TEN), cashier))
                .isInstanceOf(BadRequestException.class);

        Order paidOrder = new Order();
        paidOrder.setId(3L);
        paidOrder.setStatus(OrderStatus.PAID);
        when(orderRepo.findDetailById(3L)).thenReturn(Optional.of(paidOrder));
        assertThatThrownBy(() -> paymentSvcOnlyCash.previewVietQr(3L))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> paymentSvcOnlyCash.confirmPayment(3L, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.TEN), cashier))
                .isInstanceOf(ConflictException.class);

        Category cat = new Category();
        cat.setId(1L);
        cat.setName("Món chính");
        MenuItem dish = new MenuItem();
        dish.setId(10L);
        dish.setCategory(cat);
        dish.setName("Bún chả");
        OrderItem line = new OrderItem();
        line.setId(100L);
        line.setMenuItem(dish);
        line.setQuantity(2);
        line.setUnitPrice(BigDecimal.valueOf(60000));
        line.setStatus(OrderItemStatus.SERVED);
        order.addItem(line);

        when(orderRepo.findDetailById(1L)).thenReturn(Optional.of(order));
        when(paymentRepo.findByOrderId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentSvcOnlyCash.confirmPayment(1L, new ConfirmPaymentRequest(PaymentMethod.VIETQR, null), cashier))
                .isInstanceOf(BadRequestException.class);

        when(userRepo.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentSvcOnlyCash.confirmPayment(
                1L, new ConfirmPaymentRequest(PaymentMethod.CASH, BigDecimal.valueOf(120000)), cashier))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("KdsService & ReportService: phủ toàn bộ nhánh quyền KDS, giới hạn ngày >366 và AuditLog limit")
    void kdsAndReportServiceAllBranches() {
        OrderItemRepository itemRepo = mock(OrderItemRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        KdsService kdsSvc = new KdsService(itemRepo, new OrderItemStateMachine(), publisher);

        RmsUserPrincipal staffActor = principalOf(2L, "staff1", Role.STAFF);

        when(itemRepo.findDetailById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(404L, new UpdateKdsItemStatusRequest(OrderItemStatus.COOKING), staffActor))
                .isInstanceOf(ResourceNotFoundException.class);

        Order closedOrder = new Order();
        closedOrder.setId(1L);
        closedOrder.setStatus(OrderStatus.PAID);
        OrderItem itemOnClosed = new OrderItem();
        itemOnClosed.setId(10L);
        itemOnClosed.setOrder(closedOrder);
        itemOnClosed.setStatus(OrderItemStatus.PENDING);
        when(itemRepo.findDetailById(10L)).thenReturn(Optional.of(itemOnClosed));
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(10L, new UpdateKdsItemStatusRequest(OrderItemStatus.COOKING), staffActor))
                .isInstanceOf(BadRequestException.class);

        closedOrder.setStatus(OrderStatus.OPEN);
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(10L, new UpdateKdsItemStatusRequest(OrderItemStatus.CANCELLED), staffActor))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(10L, new UpdateKdsItemStatusRequest(OrderItemStatus.PENDING), staffActor))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(10L, new UpdateKdsItemStatusRequest(OrderItemStatus.COOKING), staffActor))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> kdsSvc.advanceItemStatus(10L, new UpdateKdsItemStatusRequest(OrderItemStatus.READY), staffActor))
                .isInstanceOf(ForbiddenOperationException.class);

        // ReportService edge branches
        PaymentRepository paymentRepo = mock(PaymentRepository.class);
        AuditLogRepository auditRepo = mock(AuditLogRepository.class);
        ReportService reportSvc = new ReportService(paymentRepo, itemRepo, auditRepo);

        assertThatThrownBy(() -> reportSvc.buildRevenueReport(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 5, 1)))
                .isInstanceOf(BadRequestException.class);

        when(paymentRepo.findCompletedPaidOrdersInWindow(any(), any(), any(), any())).thenReturn(List.of());
        RevenueReportDto defaultWindow = reportSvc.buildRevenueReport(null, null);
        assertThat(defaultWindow.paidOrderCount()).isZero();

        RevenueReportDto wideWindow = reportSvc.buildRevenueReport(LocalDate.of(2024, 1, 1), LocalDate.of(2026, 1, 1));
        assertThat(wideWindow.dailySeries()).isEmpty();

        assertThatThrownBy(() -> reportSvc.listAuditLogs(0)).isInstanceOf(BadRequestException.class);

        AuditLog anonymousEntry = new AuditLog();
        anonymousEntry.setId(1L);
        anonymousEntry.setAction("SYSTEM_BOOT");
        anonymousEntry.setTargetType("SYSTEM");
        anonymousEntry.setCreatedAt(Instant.now());
        when(auditRepo.findRecentWithActor(any())).thenReturn(List.of(anonymousEntry));
        assertThat(reportSvc.listAuditLogs(999)).hasSize(1);
    }
}
