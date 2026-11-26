package com.hust.rms.dto.order;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OrderItemRequest(
        @NotNull(message = "menuItemId không được để trống")
        Long menuItemId,
        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        @Max(value = 99, message = "Số lượng tối đa mỗi dòng là 99")
        Integer quantity,
        @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
        String note
) {
}
