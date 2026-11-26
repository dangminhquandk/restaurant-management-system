package com.hust.rms.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record MenuAvailabilityChangedEvent(
        String eventType,
        Long menuItemId,
        String menuItemName,
        @JsonProperty("isAvailable") boolean isAvailable,
        Instant timestamp
) {
    public static MenuAvailabilityChangedEvent of(Long menuItemId, String menuItemName, boolean isAvailable) {
        return new MenuAvailabilityChangedEvent(
                "MENU_AVAILABILITY_CHANGED",
                menuItemId,
                menuItemName,
                isAvailable,
                Instant.now()
        );
    }
}
