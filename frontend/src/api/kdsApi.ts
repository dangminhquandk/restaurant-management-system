import { apiClient } from './client';
import type { KdsItemDto, UpdateKdsItemStatusRequest } from '../types/api';

export const kdsApi = {
  async listItems(): Promise<KdsItemDto[]> {
    const { data } = await apiClient.get<KdsItemDto[]>('/kds/items');
    return data;
  },

  async updateItemStatus(
    itemId: number,
    payload: UpdateKdsItemStatusRequest
  ): Promise<KdsItemDto> {
    const { data } = await apiClient.patch<KdsItemDto>(`/kds/items/${itemId}/status`, payload);
    return data;
  },
};
