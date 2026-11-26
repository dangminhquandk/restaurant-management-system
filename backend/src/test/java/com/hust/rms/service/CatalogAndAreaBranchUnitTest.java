package com.hust.rms.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.*;
import com.hust.rms.dto.area.*;
import com.hust.rms.dto.menu.*;
import com.hust.rms.repository.*;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * HUST IT3180 RMS — Kiểm thử đơn vị phủ nhánh cho AreaService, CategoryService và MenuService (Chương 9).
 */
class CatalogAndAreaBranchUnitTest {

    @Test
    @DisplayName("AreaService: phủ toàn bộ nhánh thêm/sửa/xóa khu vực và bắt lỗi trùng tên hoặc còn bàn")
    void areaServiceAllBranches() {
        AreaRepository areaRepo = mock(AreaRepository.class);
        DiningTableRepository tableRepo = mock(DiningTableRepository.class);
        AreaService areaSvc = new AreaService(areaRepo, tableRepo);

        Area sample = new Area();
        sample.setId(1L);
        sample.setName("Tầng 1");
        sample.setDisplayOrder(1);
        when(areaRepo.findAllByOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(sample));
        assertThat(areaSvc.listAreas()).hasSize(1);

        when(areaRepo.existsByNameIgnoreCase("Tầng 1")).thenReturn(true);
        assertThatThrownBy(() -> areaSvc.createArea(new AreaUpsertRequest(" Tầng 1 ", 1, null)))
                .isInstanceOf(ConflictException.class);

        when(areaRepo.existsByNameIgnoreCase("Sân thượng")).thenReturn(false);
        when(areaRepo.save(any(Area.class))).thenAnswer(inv -> {
            Area a = inv.getArgument(0);
            a.setId(2L);
            return a;
        });
        AreaDto createdDefaultOrder = areaSvc.createArea(new AreaUpsertRequest(" Sân thượng ", null, "Thoáng mát"));
        assertThat(createdDefaultOrder.displayOrder()).isZero();
        AreaDto createdExplicitOrder = areaSvc.createArea(new AreaUpsertRequest("Sân thượng", 5, null));
        assertThat(createdExplicitOrder.displayOrder()).isEqualTo(5);

        when(areaRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> areaSvc.updateArea(99L, new AreaUpsertRequest("VIP", 2, null)))
                .isInstanceOf(ResourceNotFoundException.class);

        when(areaRepo.findById(1L)).thenReturn(Optional.of(sample));
        when(areaRepo.existsByNameIgnoreCaseAndIdNot("VIP", 1L)).thenReturn(true);
        assertThatThrownBy(() -> areaSvc.updateArea(1L, new AreaUpsertRequest("VIP", 2, null)))
                .isInstanceOf(ConflictException.class);

        when(areaRepo.existsByNameIgnoreCaseAndIdNot("Phòng VIP", 1L)).thenReturn(false);
        assertThat(areaSvc.updateArea(1L, new AreaUpsertRequest("Phòng VIP", null, "Riêng tư")).displayOrder())
                .isEqualTo(1);
        assertThat(areaSvc.updateArea(1L, new AreaUpsertRequest("Phòng VIP", 3, "Riêng tư")).displayOrder())
                .isEqualTo(3);

        when(tableRepo.existsByAreaId(1L)).thenReturn(true);
        assertThatThrownBy(() -> areaSvc.deleteArea(1L)).isInstanceOf(ConflictException.class);

        when(tableRepo.existsByAreaId(1L)).thenReturn(false);
        areaSvc.deleteArea(1L);
        verify(areaRepo).delete(sample);
    }

    @Test
    @DisplayName("CategoryService: phủ toàn bộ nhánh lọc activeOnly, thêm/sửa/xóa danh mục và ràng buộc món")
    void categoryServiceAllBranches() {
        CategoryRepository catRepo = mock(CategoryRepository.class);
        MenuItemRepository itemRepo = mock(MenuItemRepository.class);
        CategoryService catSvc = new CategoryService(catRepo, itemRepo);

        Category cat = new Category();
        cat.setId(10L);
        cat.setName("Khai vị");
        cat.setDisplayOrder(1);
        cat.setIsActive(true);

        when(catRepo.findAllByIsActiveTrueOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(cat));
        when(catRepo.findAllByOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(cat));
        assertThat(catSvc.listCategories(true)).hasSize(1);
        assertThat(catSvc.listCategories(false)).hasSize(1);

        when(catRepo.existsByNameIgnoreCase("Khai vị")).thenReturn(true);
        assertThatThrownBy(() -> catSvc.createCategory(new CategoryUpsertRequest(" Khai vị ", 1, true)))
                .isInstanceOf(ConflictException.class);

        when(catRepo.existsByNameIgnoreCase("Đồ uống")).thenReturn(false);
        when(catRepo.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(11L);
            return c;
        });
        CategoryDto c1 = catSvc.createCategory(new CategoryUpsertRequest(" Đồ uống ", null, null));
        assertThat(c1.displayOrder()).isZero();
        assertThat(c1.isActive()).isTrue();
        CategoryDto c2 = catSvc.createCategory(new CategoryUpsertRequest("Đồ uống", 4, false));
        assertThat(c2.displayOrder()).isEqualTo(4);
        assertThat(c2.isActive()).isFalse();

        when(catRepo.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> catSvc.deleteCategory(404L)).isInstanceOf(ResourceNotFoundException.class);

        when(catRepo.findById(10L)).thenReturn(Optional.of(cat));
        when(catRepo.existsByNameIgnoreCaseAndIdNot("Trùng", 10L)).thenReturn(true);
        assertThatThrownBy(() -> catSvc.updateCategory(10L, new CategoryUpsertRequest("Trùng", 2, true)))
                .isInstanceOf(ConflictException.class);

        when(catRepo.existsByNameIgnoreCaseAndIdNot("Món nướng", 10L)).thenReturn(false);
        catSvc.updateCategory(10L, new CategoryUpsertRequest("Món nướng", null, null));
        CategoryDto updated = catSvc.updateCategory(10L, new CategoryUpsertRequest("Món nướng", 7, false));
        assertThat(updated.displayOrder()).isEqualTo(7);
        assertThat(updated.isActive()).isFalse();

        when(itemRepo.existsByCategoryId(10L)).thenReturn(true);
        assertThatThrownBy(() -> catSvc.deleteCategory(10L)).isInstanceOf(ConflictException.class);

        when(itemRepo.existsByCategoryId(10L)).thenReturn(false);
        catSvc.deleteCategory(10L);
        verify(catRepo).delete(cat);
    }

    @Test
    @DisplayName("MenuService: phủ toàn bộ nhánh giá BVA (<0, 0, >0), tìm kiếm không dấu, xóa mềm và khóa món")
    void menuServiceAllBranches() {
        MenuItemRepository menuRepo = mock(MenuItemRepository.class);
        CategoryRepository catRepo = mock(CategoryRepository.class);
        AuditLogService auditSvc = mock(AuditLogService.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        MenuService menuSvc = new MenuService(menuRepo, catRepo, auditSvc, publisher);

        Category cat = new Category();
        cat.setId(1L);
        cat.setName("Phở & Bún");

        MenuItem pho = new MenuItem();
        pho.setId(50L);
        pho.setCategory(cat);
        pho.setName("Phở bò tái chín");
        pho.setPrice(BigDecimal.valueOf(65000));
        pho.setIsAvailable(true);

        when(menuRepo.findActiveItems(null, false)).thenReturn(List.of(pho));
        when(menuRepo.findActiveItems(1L, true)).thenReturn(List.of(pho));
        assertThat(menuSvc.listMenuItems(null, "pho bo", null)).hasSize(1);
        assertThat(menuSvc.listMenuItems(1L, "lau thai", true)).isEmpty();

        assertThatThrownBy(() -> menuSvc.createMenuItem(
                new MenuItemUpsertRequest(1L, "Món lỗi", BigDecimal.valueOf(-1), null, null, true)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> menuSvc.createMenuItem(
                new MenuItemUpsertRequest(1L, "Món lỗi", null, null, null, true)))
                .isInstanceOf(BadRequestException.class);

        when(catRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> menuSvc.createMenuItem(
                new MenuItemUpsertRequest(99L, "Nước lọc", BigDecimal.ZERO, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);

        when(catRepo.findById(1L)).thenReturn(Optional.of(cat));
        when(menuRepo.saveAndFlush(any(MenuItem.class))).thenAnswer(inv -> {
            MenuItem m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(51L);
            }
            return m;
        });
        MenuItemDto freeWater = menuSvc.createMenuItem(
                new MenuItemUpsertRequest(1L, " Trà đá miễn phí ", BigDecimal.ZERO, null, "BVA = 0", null));
        assertThat(freeWater.isAvailable()).isTrue();
        assertThat(freeWater.price()).isEqualByComparingTo(BigDecimal.ZERO);

        when(menuRepo.findActiveByIdWithCategory(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> menuSvc.softDeleteMenuItem(404L))
                .isInstanceOf(ResourceNotFoundException.class);

        when(menuRepo.findActiveByIdWithCategory(50L)).thenReturn(Optional.of(pho));
        menuSvc.updateMenuItem(50L, new MenuItemUpsertRequest(1L, "Phở bò đặc biệt", BigDecimal.valueOf(75000), null, null, null));
        MenuItemDto updated = menuSvc.updateMenuItem(
                50L, new MenuItemUpsertRequest(1L, "Phở bò đặc biệt", BigDecimal.valueOf(75000), null, null, false));
        assertThat(updated.isAvailable()).isFalse();

        MenuItemDto toggledOn = menuSvc.updateAvailability(50L, new MenuItemAvailabilityRequest(true));
        assertThat(toggledOn.isAvailable()).isTrue();
        menuSvc.softDeleteMenuItem(50L);
        assertThat(pho.getDeletedAt()).isNotNull();
    }
}
