package com.hust.rms.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "isActive không được để trống")
        @JsonProperty("isActive") Boolean isActive
) {
}
