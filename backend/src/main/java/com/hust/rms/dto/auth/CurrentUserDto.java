package com.hust.rms.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hust.rms.domain.enums.Role;

public record CurrentUserDto(
        Long id,
        String username,
        String fullName,
        Role role,
        @JsonProperty("isActive") boolean isActive
) {
}
