import { apiClient } from './client';
import type { AuthUserDto, LoginRequest, LoginResponse } from '../types/api';

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async me(): Promise<AuthUserDto> {
    const { data } = await apiClient.get<AuthUserDto>('/auth/me');
    return data;
  },
};
