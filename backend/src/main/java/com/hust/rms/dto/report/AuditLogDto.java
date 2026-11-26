package com.hust.rms.dto.report;

import java.time.Instant;

/**
 * HUST IT3180 RMS — Bản ghi nhật ký kiểm toán thao tác nhạy cảm (FR-03, US-20).
 */
public record AuditLogDto(
        Long id,
        String actorUsername,
        String actorFullName,
        String action,
        String targetType,
        Long targetId,
        String detail,
        Instant createdAt
) {
}
