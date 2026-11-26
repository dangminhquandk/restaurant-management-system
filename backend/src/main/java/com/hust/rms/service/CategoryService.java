package com.hust.rms.service;

import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.domain.entity.Category;
import com.hust.rms.dto.menu.CategoryDto;
import com.hust.rms.dto.menu.CategoryUpsertRequest;
import com.hust.rms.repository.CategoryRepository;
import com.hust.rms.repository.MenuItemRepository;
import com.hust.rms.service.mapper.DtoMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages menu categories and prevents duplicate names or deleting categories with dishes.
 */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    public CategoryService(CategoryRepository categoryRepository, MenuItemRepository menuItemRepository) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories(boolean activeOnly) {
        List<Category> categories = activeOnly
                ? categoryRepository.findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc()
                : categoryRepository.findAllByOrderByDisplayOrderAscIdAsc();
        return categories.stream()
                .map(DtoMapper::toCategoryDto)
                .toList();
    }

    @Transactional
    public CategoryDto createCategory(CategoryUpsertRequest request) {
        String normalizedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ConflictException("CATEGORY_NAME_DUPLICATE", "Tên danh mục đã tồn tại.");
        }
        Category category = new Category();
        category.setName(normalizedName);
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        category.setIsActive(request.isActive() != null ? request.isActive() : Boolean.TRUE);
        return DtoMapper.toCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryUpsertRequest request) {
        Category category = findCategoryOrThrow(id);
        String normalizedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ConflictException("CATEGORY_NAME_DUPLICATE", "Tên danh mục đã tồn tại.");
        }
        category.setName(normalizedName);
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.isActive() != null) {
            category.setIsActive(request.isActive());
        }
        return DtoMapper.toCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryOrThrow(id);
        if (menuItemRepository.existsByCategoryId(id)) {
            throw new ConflictException(
                    "CATEGORY_HAS_ITEMS",
                    "Không thể xóa danh mục đã chứa món ăn."
            );
        }
        categoryRepository.delete(category);
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục."));
    }
}
