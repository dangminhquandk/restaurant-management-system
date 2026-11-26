package com.hust.rms.repository;

import com.hust.rms.domain.entity.Payment;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order o
            WHERE p.status = :paymentStatus
              AND o.status = :orderStatus
              AND p.paidAt >= :fromInstant
              AND p.paidAt < :toExclusive
            ORDER BY p.paidAt ASC, p.id ASC
            """)
    List<Payment> findCompletedPaidOrdersInWindow(
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("fromInstant") Instant fromInstant,
            @Param("toExclusive") Instant toExclusive
    );
}

