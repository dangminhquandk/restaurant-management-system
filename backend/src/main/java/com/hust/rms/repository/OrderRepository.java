package com.hust.rms.repository;

import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.table.id IN :tableIds")
    List<Order> findByStatusAndTableIdIn(
            @Param("status") OrderStatus status,
            @Param("tableIds") Collection<Long> tableIds
    );

    @Query("""
            SELECT DISTINCT o FROM Order o
            JOIN FETCH o.table t
            JOIN FETCH t.area
            JOIN FETCH o.staff
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.menuItem
            LEFT JOIN FETCH o.payment p
            LEFT JOIN FETCH p.cashier
            WHERE o.id = :id
            """)
    Optional<Order> findDetailById(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT o FROM Order o
            JOIN FETCH o.table t
            JOIN FETCH t.area
            JOIN FETCH o.staff
            LEFT JOIN FETCH o.items i
            LEFT JOIN FETCH i.menuItem
            LEFT JOIN FETCH o.payment p
            LEFT JOIN FETCH p.cashier
            WHERE t.id = :tableId
              AND o.status = com.hust.rms.domain.enums.OrderStatus.OPEN
            """)
    Optional<Order> findActiveDetailByTableId(@Param("tableId") Long tableId);

    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.table
            JOIN FETCH o.staff
            LEFT JOIN FETCH o.payment p
            WHERE o.createdAt >= :fromInstant
              AND o.createdAt < :toExclusive
            ORDER BY o.createdAt DESC, o.id DESC
            """)
    List<Order> findOrderSummariesInWindow(
            @Param("fromInstant") Instant fromInstant,
            @Param("toExclusive") Instant toExclusive
    );

    Optional<Order> findByOrderCode(String orderCode);

    boolean existsByOrderCode(String orderCode);

    boolean existsByTableId(Long tableId);

    boolean existsByTableIdAndStatus(Long tableId, OrderStatus status);

    long countByTableIdAndStatus(Long tableId, OrderStatus status);
}
