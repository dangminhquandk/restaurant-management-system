package com.hust.rms.dto.area;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaUpsertRequest(
        @NotBlank(message = "Tên khu vực không được để trống")
        @Size(max = 100, message = "Tên khu vực tối đa 100 ký tự")
        String name,
        Integer displayOrder,
        @Size(max = 255, message = "Mô tả tối đa 255 ký tự")
        String description
) {
}
