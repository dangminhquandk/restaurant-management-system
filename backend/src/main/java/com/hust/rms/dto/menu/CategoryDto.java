package com.hust.rms.dto.menu;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CategoryDto(
        Long id,
        String name,
        Integer displayOrder,
        @JsonProperty("isActive") boolean isActive
) {
}
