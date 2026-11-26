import { apiClient } from './client';
import type {
  CategoryDto,
  MenuItemDto,
  ToggleAvailabilityRequest,
  UpsertCategoryRequest,
  UpsertMenuItemRequest,
} from '../types/api';

export interface ListMenuItemsParams {
  categoryId?: number;
  search?: string;
  availableOnly?: boolean;
}

export const menuApi = {
  async listCategories(activeOnly = false): Promise<CategoryDto[]> {
    const { data } = await apiClient.get<CategoryDto[]>('/categories', {
      params: { activeOnly },
    });
    return data;
  },

  async createCategory(payload: UpsertCategoryRequest): Promise<CategoryDto> {
    const { data } = await apiClient.post<CategoryDto>('/categories', payload);
    return data;
  },

  async updateCategory(id: number, payload: UpsertCategoryRequest): Promise<CategoryDto> {
    const { data } = await apiClient.put<CategoryDto>(`/categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async listMenuItems(params?: ListMenuItemsParams): Promise<MenuItemDto[]> {
    const { data } = await apiClient.get<MenuItemDto[]>('/menu-items', { params });
    return data;
  },

  async createMenuItem(payload: UpsertMenuItemRequest): Promise<MenuItemDto> {
    const { data } = await apiClient.post<MenuItemDto>('/menu-items', payload);
    return data;
  },

  async updateMenuItem(id: number, payload: UpsertMenuItemRequest): Promise<MenuItemDto> {
    const { data } = await apiClient.put<MenuItemDto>(`/menu-items/${id}`, payload);
    return data;
  },

  async deleteMenuItem(id: number): Promise<void> {
    await apiClient.delete(`/menu-items/${id}`);
  },

  async toggleAvailability(id: number, payload: ToggleAvailabilityRequest): Promise<MenuItemDto> {
    const { data } = await apiClient.patch<MenuItemDto>(`/menu-items/${id}/availability`, payload);
    return data;
  },
};
