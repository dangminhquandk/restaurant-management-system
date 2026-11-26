package com.hust.rms.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hust.rms.domain.enums.Role;
import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String fullName,
        Role role,
        @JsonProperty("isActive") boolean isActive,
        Instant createdAt
) {
}
