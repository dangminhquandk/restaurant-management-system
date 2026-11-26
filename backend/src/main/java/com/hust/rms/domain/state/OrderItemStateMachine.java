package com.hust.rms.domain.state;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ForbiddenOperationException;
import com.hust.rms.common.exception.InvalidStateTransitionException;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.Role;
import org.springframework.stereotype.Component;

/**
 * State Machine governing valid lifecycle transitions and RBAC cancellation rules for {@link OrderItemStatus}.
 */
@Component
public class OrderItemStateMachine {

    public void validateTransition(
            OrderItemStatus current,
            OrderItemStatus target,
            Role actorRole,
            String reason
    ) {
        if (target == OrderItemStatus.CANCELLED) {
            validateCancellation(current, actorRole, reason);
            return;
        }
        boolean allowed = switch (current) {
            case PENDING -> target == OrderItemStatus.COOKING;
            case COOKING -> target == OrderItemStatus.READY;
            case READY -> target == OrderItemStatus.SERVED;
            case SERVED, CANCELLED -> false;
        };
        if (!allowed) {
            throw new InvalidStateTransitionException(
                    "INVALID_ORDER_ITEM_TRANSITION",
                    String.format("Không thể chuyển trạng thái món từ %s sang %s.", current, target)
            );
        }
    }

    private void validateCancellation(OrderItemStatus current, Role actorRole, String reason) {
        if (current == OrderItemStatus.READY || current == OrderItemStatus.SERVED || current == OrderItemStatus.CANCELLED) {
            throw new InvalidStateTransitionException(
                    "CANNOT_CANCEL_ITEM",
                    "Không thể hủy món đã nấu xong, đã phục vụ hoặc đã hủy."
            );
        }
        if (current == OrderItemStatus.COOKING) {
            if (actorRole == Role.STAFF) {
                throw new ForbiddenOperationException(
                        "STAFF_CANNOT_CANCEL_COOKING_ITEM",
                        "Nhân viên phục vụ không được tự ý hủy món bếp đang chế biến."
                );
            }
            if (reason == null || reason.isBlank()) {
                throw new BadRequestException(
                        "CANCEL_REASON_REQUIRED",
                        "Bắt buộc nhập lý do khi hủy món đang chế biến."
                );
            }
        }
    }
}
