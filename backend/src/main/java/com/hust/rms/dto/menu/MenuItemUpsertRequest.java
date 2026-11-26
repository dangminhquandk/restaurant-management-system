package com.hust.rms.dto.menu;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record MenuItemUpsertRequest(
        @NotNull(message = "Mã danh mục không được để trống")
        Long categoryId,
        @NotBlank(message = "Tên món ăn không được để trống")
        @Size(max = 150, message = "Tên món ăn tối đa 150 ký tự")
        String name,
        @NotNull(message = "Giá bán không được để trống")
        @DecimalMin(value = "0", inclusive = true, message = "Giá bán không được âm")
        BigDecimal price,
        @Size(max = 500, message = "URL ảnh tối đa 500 ký tự")
        String imageUrl,
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,
        @JsonProperty("isAvailable") Boolean isAvailable
) {
}
