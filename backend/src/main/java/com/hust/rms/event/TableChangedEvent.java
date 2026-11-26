package com.hust.rms.event;

import com.hust.rms.domain.enums.TableStatus;
import java.time.Instant;

public record TableChangedEvent(
        String eventType,
        Long tableId,
        TableStatus status,
        Instant timestamp
) {
    public static TableChangedEvent updated(Long tableId, TableStatus status) {
        return new TableChangedEvent("TABLE_UPDATED", tableId, status, Instant.now());
    }
}
