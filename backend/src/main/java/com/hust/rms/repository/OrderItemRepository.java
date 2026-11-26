package com.hust.rms.repository;

import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.OrderStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdOrderByCreatedAtAscIdAsc(Long orderId);

    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.order o
            JOIN FETCH o.table t
            JOIN FETCH t.area
            JOIN FETCH oi.menuItem
            WHERE o.status = :orderStatus
              AND oi.status IN :statuses
            ORDER BY oi.createdAt ASC, oi.id ASC
            """)
    List<OrderItem> findKdsQueueItems(
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("statuses") Collection<OrderItemStatus> statuses
    );

    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.order o
            JOIN FETCH o.table t
            JOIN FETCH t.area
            JOIN FETCH oi.menuItem
            WHERE oi.id = :id
            """)
    Optional<OrderItem> findDetailById(@Param("id") Long id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE OrderItem oi
            SET oi.order = :targetOrder,
                oi.batchNo = :batchNo,
                oi.updatedAt = :updatedAt
            WHERE oi.id IN :itemIds
            """)
    int reassignItemsToOrder(
            @Param("targetOrder") Order targetOrder,
            @Param("batchNo") Integer batchNo,
            @Param("updatedAt") Instant updatedAt,
            @Param("itemIds") Collection<Long> itemIds
    );

    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.menuItem m
            JOIN FETCH m.category
            WHERE oi.order.id IN :orderIds
              AND oi.status <> :excludedStatus
            """)
    List<OrderItem> findActiveItemsWithCategoryByOrderIds(
            @Param("orderIds") Collection<Long> orderIds,
            @Param("excludedStatus") OrderItemStatus excludedStatus
    );
}

