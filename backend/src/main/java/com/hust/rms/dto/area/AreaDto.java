package com.hust.rms.dto.area;

public record AreaDto(
        Long id,
        String name,
        Integer displayOrder,
        String description
) {
}
