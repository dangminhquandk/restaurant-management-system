package com.hust.rms.dto.table;

import jakarta.validation.constraints.NotNull;

public record OpenTableRequest(
        @NotNull(message = "expectedVersion không được để trống")
        Long expectedVersion
) {
}
