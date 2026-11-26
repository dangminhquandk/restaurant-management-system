package com.hust.rms.dto.table;

import com.hust.rms.domain.enums.TableStatus;
import java.math.BigDecimal;

public record DiningTableDto(
        Long id,
        Long areaId,
        String areaName,
        String name,
        Integer capacity,
        TableStatus status,
        Long version,
        Long activeOrderId,
        String activeOrderCode,
        BigDecimal activeOrderTotal
) {
}
