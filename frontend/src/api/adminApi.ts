import { apiClient } from './client';
import type {
  AuditLogDto,
  CreateUserRequest,
  RevenueReportDto,
  SystemSettingsDto,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserDto,
} from '../types/api';

export const adminApi = {
  async listUsers(): Promise<UserDto[]> {
    const { data } = await apiClient.get<UserDto[]>('/admin/users');
    return data;
  },

  async createUser(payload: CreateUserRequest): Promise<UserDto> {
    const { data } = await apiClient.post<UserDto>('/admin/users', payload);
    return data;
  },

  async updateUser(id: number, payload: UpdateUserRequest): Promise<UserDto> {
    const { data } = await apiClient.put<UserDto>(`/admin/users/${id}`, payload);
    return data;
  },

  async updateUserStatus(id: number, payload: UpdateUserStatusRequest): Promise<UserDto> {
    const { data } = await apiClient.patch<UserDto>(`/admin/users/${id}/status`, payload);
    return data;
  },

  async getSettings(): Promise<SystemSettingsDto> {
    const { data } = await apiClient.get<SystemSettingsDto>('/admin/settings');
    return data;
  },

  async updateSettings(payload: SystemSettingsDto): Promise<SystemSettingsDto> {
    const { data } = await apiClient.put<SystemSettingsDto>('/admin/settings', payload);
    return data;
  },

  async getRevenueReport(from: string, to: string): Promise<RevenueReportDto> {
    const { data } = await apiClient.get<RevenueReportDto>('/admin/reports/revenue', {
      params: { from, to },
    });
    return data;
  },

  async listAuditLogs(limit = 100): Promise<AuditLogDto[]> {
    const { data } = await apiClient.get<AuditLogDto[]>('/admin/audit-logs', {
      params: { limit },
    });
    return data;
  },
};
