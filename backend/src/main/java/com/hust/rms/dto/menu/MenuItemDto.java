package com.hust.rms.dto.menu;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public record MenuItemDto(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        BigDecimal price,
        String imageUrl,
        String description,
        @JsonProperty("isAvailable") boolean isAvailable
) {
}
