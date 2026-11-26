package com.hust.rms.controller;

import com.hust.rms.dto.menu.*;
import com.hust.rms.service.MenuService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint Thực đơn món ăn, Xóa mềm & Bật/tắt Hết món (FR-08, FR-15, FR-20).
 */
@RestController
@RequestMapping("/api/v1/menu-items")
public class MenuItemController {

    private final MenuService menuSvc;

    public MenuItemController(MenuService menuSvc) {
        this.menuSvc = menuSvc;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public List<MenuItemDto> searchDishes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean availableOnly
    ) {
        return menuSvc.listMenuItems(categoryId, search, availableOnly);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public MenuItemDto createDish(@Valid @RequestBody MenuItemUpsertRequest payload) {
        return menuSvc.createMenuItem(payload);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MenuItemDto editDish(@PathVariable Long id, @Valid @RequestBody MenuItemUpsertRequest payload) {
        return menuSvc.updateMenuItem(id, payload);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void archiveDish(@PathVariable Long id) {
        menuSvc.softDeleteMenuItem(id);
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('KITCHEN','ADMIN')")
    public MenuItemDto switchDishAvailability(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemAvailabilityRequest payload
    ) {
        return menuSvc.updateAvailability(id, payload);
    }
}
