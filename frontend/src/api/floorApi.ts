import { apiClient } from './client';
import type {
  AreaDto,
  DiningTableDto,
  MergeTablesRequest,
  OpenTableRequest,
  OpenTableResponse,
  OrderDto,
  TransferTableRequest,
  UpsertAreaRequest,
  UpsertDiningTableRequest,
} from '../types/api';

export const floorApi = {
  async listAreas(): Promise<AreaDto[]> {
    const { data } = await apiClient.get<AreaDto[]>('/areas');
    return data;
  },

  async createArea(payload: UpsertAreaRequest): Promise<AreaDto> {
    const { data } = await apiClient.post<AreaDto>('/areas', payload);
    return data;
  },

  async updateArea(id: number, payload: UpsertAreaRequest): Promise<AreaDto> {
    const { data } = await apiClient.put<AreaDto>(`/areas/${id}`, payload);
    return data;
  },

  async deleteArea(id: number): Promise<void> {
    await apiClient.delete(`/areas/${id}`);
  },

  async listTables(areaId?: number): Promise<DiningTableDto[]> {
    const { data } = await apiClient.get<DiningTableDto[]>('/tables', {
      params: areaId ? { areaId } : undefined,
    });
    return data;
  },

  async createTable(payload: UpsertDiningTableRequest): Promise<DiningTableDto> {
    const { data } = await apiClient.post<DiningTableDto>('/tables', payload);
    return data;
  },

  async updateTable(id: number, payload: UpsertDiningTableRequest): Promise<DiningTableDto> {
    const { data } = await apiClient.put<DiningTableDto>(`/tables/${id}`, payload);
    return data;
  },

  async deleteTable(id: number): Promise<void> {
    await apiClient.delete(`/tables/${id}`);
  },

  async openTable(id: number, payload: OpenTableRequest): Promise<OpenTableResponse> {
    const { data } = await apiClient.post<OpenTableResponse>(`/tables/${id}/open`, payload);
    return data;
  },

  async cleanTable(id: number): Promise<DiningTableDto> {
    const { data } = await apiClient.post<DiningTableDto>(`/tables/${id}/clean`);
    return data;
  },

  async transferTable(id: number, payload: TransferTableRequest): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(`/tables/${id}/transfer`, payload);
    return data;
  },

  async mergeTables(payload: MergeTablesRequest): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>('/tables/merge', payload);
    return data;
  },
};
