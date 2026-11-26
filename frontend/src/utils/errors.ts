import axios from 'axios';
import type { ErrorResponse } from '../types/api';

export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
}

export function parseApiError(
  error: unknown,
  fallbackMessage = 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ErrorResponse> | undefined;
    return {
      status: error.response?.status ?? data?.status,
      code: data?.code,
      message:
        typeof data?.message === 'string' && data.message.trim().length > 0
          ? data.message
          : fallbackMessage,
    };
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return { message: error.message };
  }
  return { message: fallbackMessage };
}
