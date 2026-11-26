package com.hust.rms.service;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.Role;
import com.hust.rms.domain.state.OrderItemStateMachine;
import com.hust.rms.dto.kds.KdsItemDto;
import com.hust.rms.dto.kds.UpdateKdsItemStatusRequest;
import com.hust.rms.event.OrderItemsChangedEvent;
import com.hust.rms.repository.OrderItemRepository;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.mapper.DtoMapper;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Điều phối hàng đợi bếp KDS theo FIFO và phát thông báo món nấu xong (FR-12..14, UC-07).
 */
@Service
public class KdsService {

    private static final Set<OrderItemStatus> ACTIVE_KDS_STATUSES = EnumSet.of(
            OrderItemStatus.PENDING,
            OrderItemStatus.COOKING,
            OrderItemStatus.READY
    );

    private final OrderItemRepository orderItemRepo;
    private final OrderItemStateMachine itemStateMachine;
    private final ApplicationEventPublisher eventPublisher;

    public KdsService(
            OrderItemRepository orderItemRepo,
            OrderItemStateMachine itemStateMachine,
            ApplicationEventPublisher eventPublisher
    ) {
        this.orderItemRepo = orderItemRepo;
        this.itemStateMachine = itemStateMachine;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<KdsItemDto> listActiveQueue() {
        return orderItemRepo.findKdsQueueItems(OrderStatus.OPEN, ACTIVE_KDS_STATUSES).stream()
                .map(DtoMapper::toKdsItemDto)
                .toList();
    }

    @Transactional
    public KdsItemDto advanceItemStatus(
            Long itemId,
            UpdateKdsItemStatusRequest req,
            RmsUserPrincipal actor
    ) {
        OrderItem item = orderItemRepo.findDetailById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ORDER_ITEM_NOT_FOUND",
                        "Không tìm thấy món gọi trên bảng bếp KDS."
                ));

        Order order = item.getOrder();
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BadRequestException(
                    "ORDER_NOT_OPEN",
                    "Đơn hàng đã đóng, không thể cập nhật trạng thái chế biến."
            );
        }

        OrderItemStatus target = req.status();
        if (target == OrderItemStatus.CANCELLED || target == OrderItemStatus.PENDING) {
            throw new InvalidStateTransitionException(
                    "INVALID_KDS_TARGET_STATUS",
                    "Endpoint KDS chỉ cho phép chuyển sang COOKING, READY hoặc SERVED."
            );
        }

        if ((target == OrderItemStatus.COOKING || target == OrderItemStatus.READY)
                && actor.getRole() == Role.STAFF) {
            throw new ForbiddenOperationException(
                    "KDS_COOKING_ROLE_REQUIRED",
                    "Chỉ nhân viên bếp hoặc quản trị viên mới được chuyển món sang COOKING/READY."
            );
        }

        itemStateMachine.validateTransition(item.getStatus(), target, actor.getRole(), null);

        Instant now = Instant.now();
        item.setStatus(target);
        item.setUpdatedAt(now);
        OrderItem saved = orderItemRepo.saveAndFlush(item);

        eventPublisher.publishEvent(new OrderItemsChangedEvent(
                "ITEM_STATUS_CHANGED",
                order.getId(),
                order.getOrderCode(),
                order.getTable().getId(),
                order.getTable().getName(),
                List.of(DtoMapper.toOrderItemDto(saved)),
                now
        ));
        return DtoMapper.toKdsItemDto(saved);
    }
}
