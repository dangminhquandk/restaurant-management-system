package com.hust.rms.dto.menu;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record MenuItemAvailabilityRequest(
        @NotNull(message = "Trạng thái phục vụ không được để trống")
        @JsonProperty("isAvailable") Boolean isAvailable
) {
}
