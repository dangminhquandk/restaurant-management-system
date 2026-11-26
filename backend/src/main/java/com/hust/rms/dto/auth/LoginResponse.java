package com.hust.rms.dto.auth;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInMs,
        AuthUserSummaryDto user
) {
}
