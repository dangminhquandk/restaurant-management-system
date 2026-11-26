package com.hust.rms.repository;

import com.hust.rms.domain.entity.OrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdOrderByCreatedAtAscIdAsc(Long orderId);
}
