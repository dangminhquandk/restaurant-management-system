package com.hust.rms.dto.table;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TableUpsertRequest(
        @NotNull(message = "Mã khu vực không được để trống")
        Long areaId,
        @NotBlank(message = "Tên bàn không được để trống")
        @Size(max = 50, message = "Tên bàn tối đa 50 ký tự")
        String name,
        @NotNull(message = "Sức chứa không được để trống")
        @Min(value = 1, message = "Sức chứa tối thiểu là 1")
        @Max(value = 30, message = "Sức chứa tối đa là 30")
        Integer capacity
) {
}
