package com.hust.rms.dto.order;

import jakarta.validation.constraints.Size;

/**
 * HUST IT3180 RMS — Dữ liệu lý do hủy món gọi tại bàn / bếp (FR-11).
 */
public record CancelOrderItemRequest(
        @Size(max = 255, message = "Lý do hủy tối đa 255 ký tự")
        String reason
) {
}
