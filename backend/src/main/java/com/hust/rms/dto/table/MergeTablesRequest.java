package com.hust.rms.dto.table;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * HUST IT3180 RMS — Yêu cầu gộp ACID nhiều bàn nguồn về một bàn đích (FR-07).
 */
public record MergeTablesRequest(
        @NotEmpty(message = "Danh sách bàn nguồn không được rỗng")
        List<@NotNull(message = "Mã bàn nguồn không hợp lệ") Long> sourceTableIds,

        @NotNull(message = "Mã bàn đích không được để trống")
        Long targetTableId
) {
}
