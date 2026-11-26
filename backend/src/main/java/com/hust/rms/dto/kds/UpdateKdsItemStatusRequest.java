package com.hust.rms.dto.kds;

import com.hust.rms.domain.enums.OrderItemStatus;
import jakarta.validation.constraints.NotNull;

/**
 * HUST IT3180 RMS — Yêu cầu chuyển trạng thái chế biến món trên KDS (FR-13).
 */
public record UpdateKdsItemStatusRequest(
        @NotNull(message = "Trạng thái đích không được để trống")
        OrderItemStatus status
) {
}
