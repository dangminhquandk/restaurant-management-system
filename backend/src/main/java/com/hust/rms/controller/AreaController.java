package com.hust.rms.controller;

import com.hust.rms.dto.area.*;
import com.hust.rms.service.AreaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint quản lý Khu vực / Tầng nhà hàng (FR-04, FR-21).
 */
@RestController
@RequestMapping("/api/v1/areas")
public class AreaController {

    private final AreaService areaSvc;

    public AreaController(AreaService areaSvc) {
        this.areaSvc = areaSvc;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public List<AreaDto> fetchDiningAreas() {
        return areaSvc.listAreas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AreaDto registerDiningArea(@Valid @RequestBody AreaUpsertRequest payload) {
        return areaSvc.createArea(payload);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AreaDto modifyDiningArea(@PathVariable Long id, @Valid @RequestBody AreaUpsertRequest payload) {
        return areaSvc.updateArea(id, payload);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void removeDiningArea(@PathVariable Long id) {
        areaSvc.deleteArea(id);
    }
}
