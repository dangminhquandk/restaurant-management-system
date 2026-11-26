package com.hust.rms.controller;

import com.hust.rms.dto.kds.KdsItemDto;
import com.hust.rms.dto.kds.UpdateKdsItemStatusRequest;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.KdsService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint cho Màn hình Điều phối Bếp KDS (FR-12..14, UC-07).
 */
@RestController
@RequestMapping("/api/v1/kds/items")
public class KdsController {

    private final KdsService kdsSvc;

    public KdsController(KdsService kdsSvc) {
        this.kdsSvc = kdsSvc;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('KITCHEN','STAFF','ADMIN')")
    public List<KdsItemDto> fetchFifoKitchenQueue() {
        return kdsSvc.listActiveQueue();
    }

    @PatchMapping("/{itemId}/status")
    @PreAuthorize("hasAnyRole('KITCHEN','STAFF','ADMIN')")
    public KdsItemDto transitionKitchenItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateKdsItemStatusRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return kdsSvc.advanceItemStatus(itemId, payload, actor);
    }
}
