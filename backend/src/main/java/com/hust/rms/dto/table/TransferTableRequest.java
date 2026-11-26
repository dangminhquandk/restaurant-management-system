package com.hust.rms.dto.table;

import jakarta.validation.constraints.NotNull;

/**
 * HUST IT3180 RMS — Yêu cầu chuyển toàn bộ đơn đang mở sang bàn trống khác (FR-06).
 */
public record TransferTableRequest(
        @NotNull(message = "Mã bàn đích không được để trống")
        Long targetTableId
) {
}
