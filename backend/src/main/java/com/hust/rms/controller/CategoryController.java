package com.hust.rms.controller;

import com.hust.rms.dto.menu.*;
import com.hust.rms.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint quản lý Danh mục món ăn (FR-19, UC-11).
 */
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categorySvc;

    public CategoryController(CategoryService categorySvc) {
        this.categorySvc = categorySvc;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public List<CategoryDto> fetchMenuCategories(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return categorySvc.listCategories(activeOnly);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryDto registerMenuCategory(@Valid @RequestBody CategoryUpsertRequest payload) {
        return categorySvc.createCategory(payload);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryDto modifyMenuCategory(@PathVariable Long id, @Valid @RequestBody CategoryUpsertRequest payload) {
        return categorySvc.updateCategory(id, payload);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void removeMenuCategory(@PathVariable Long id) {
        categorySvc.deleteCategory(id);
    }
}
