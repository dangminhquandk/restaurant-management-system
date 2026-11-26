package com.hust.rms.dto.auth;

import com.hust.rms.domain.enums.Role;

public record AuthUserSummaryDto(
        Long id,
        String username,
        String fullName,
        Role role
) {
}
