package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.common.util.VietnameseTextNormalizer;
import com.hust.rms.domain.entity.Category;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.dto.menu.MenuItemAvailabilityRequest;
import com.hust.rms.dto.menu.MenuItemDto;
import com.hust.rms.dto.menu.MenuItemUpsertRequest;
import com.hust.rms.event.MenuAvailabilityChangedEvent;
import com.hust.rms.repository.CategoryRepository;
import com.hust.rms.repository.MenuItemRepository;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages menu items, Vietnamese accent-insensitive search, soft deletion, and real-time out-of-stock toggles.
 */
@Service
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    public MenuService(
            MenuItemRepository menuItemRepository,
            CategoryRepository categoryRepository,
            AuditLogService auditLogService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.menuItemRepository = menuItemRepository;
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<MenuItemDto> listMenuItems(Long categoryId, String search, Boolean availableOnly) {
        boolean filterAvailable = Boolean.TRUE.equals(availableOnly);
        List<MenuItem> items = menuItemRepository.findActiveItems(categoryId, filterAvailable);
        return items.stream()
                .filter(item -> VietnameseTextNormalizer.containsNormalized(item.getName(), search))
                .map(DtoMapper::toMenuItemDto)
                .toList();
    }

    @Transactional
    public MenuItemDto createMenuItem(MenuItemUpsertRequest request) {
        validatePriceNonNegative(request.price());
        Category category = findCategoryOrThrow(request.categoryId());

        MenuItem item = new MenuItem();
        item.setCategory(category);
        item.setName(request.name().trim());
        item.setPrice(request.price());
        item.setImageUrl(request.imageUrl());
        item.setDescription(request.description());
        item.setIsAvailable(request.isAvailable() != null ? request.isAvailable() : Boolean.TRUE);
        MenuItem saved = menuItemRepository.saveAndFlush(item);

        auditLogService.logCurrentActor(
                "MENU_ITEM_CREATED",
                "MENU_ITEMS",
                saved.getId(),
                String.format("Tạo món mới '%s' với giá %sđ", saved.getName(), saved.getPrice().toPlainString())
        );
        return DtoMapper.toMenuItemDto(saved);
    }

    @Transactional
    public MenuItemDto updateMenuItem(Long id, MenuItemUpsertRequest request) {
        validatePriceNonNegative(request.price());
        MenuItem item = findActiveMenuItemOrThrow(id);
        Category category = findCategoryOrThrow(request.categoryId());

        BigDecimal previousPrice = item.getPrice();
        item.setCategory(category);
        item.setName(request.name().trim());
        item.setPrice(request.price());
        item.setImageUrl(request.imageUrl());
        item.setDescription(request.description());
        if (request.isAvailable() != null) {
            item.setIsAvailable(request.isAvailable());
        }
        MenuItem saved = menuItemRepository.saveAndFlush(item);

        auditLogService.logCurrentActor(
                "MENU_ITEM_UPDATED",
                "MENU_ITEMS",
                saved.getId(),
                String.format(
                        "Cập nhật món '%s' (giá cũ: %sđ -> giá mới: %sđ)",
                        saved.getName(),
                        previousPrice.toPlainString(),
                        saved.getPrice().toPlainString()
                )
        );
        return DtoMapper.toMenuItemDto(saved);
    }

    @Transactional
    public void softDeleteMenuItem(Long id) {
        MenuItem item = findActiveMenuItemOrThrow(id);
        item.setDeletedAt(Instant.now());
        item.setIsAvailable(Boolean.FALSE);
        menuItemRepository.saveAndFlush(item);

        auditLogService.logCurrentActor(
                "MENU_ITEM_SOFT_DELETED",
                "MENU_ITEMS",
                item.getId(),
                String.format("Xóa mềm món '%s' để bảo toàn lịch sử hóa đơn", item.getName())
        );
    }

    @Transactional
    public MenuItemDto updateAvailability(Long id, MenuItemAvailabilityRequest request) {
        MenuItem item = findActiveMenuItemOrThrow(id);
        boolean nextAvailable = Boolean.TRUE.equals(request.isAvailable());
        item.setIsAvailable(nextAvailable);
        MenuItem saved = menuItemRepository.saveAndFlush(item);

        auditLogService.logCurrentActor(
                "MENU_AVAILABILITY_CHANGED",
                "MENU_ITEMS",
                saved.getId(),
                String.format("Đổi trạng thái phục vụ món '%s' thành %s", saved.getName(), nextAvailable)
        );
        eventPublisher.publishEvent(MenuAvailabilityChangedEvent.of(
                saved.getId(),
                saved.getName(),
                nextAvailable
        ));
        return DtoMapper.toMenuItemDto(saved);
    }

    private void validatePriceNonNegative(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("INVALID_PRICE", "Giá món ăn không được nhỏ hơn 0.");
        }
    }

    private MenuItem findActiveMenuItemOrThrow(Long id) {
        return menuItemRepository.findActiveByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("MENU_ITEM_NOT_FOUND", "Không tìm thấy món ăn."));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục."));
    }
}
