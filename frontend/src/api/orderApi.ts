import { apiClient } from './client';
import type {
  AddOrderItemsRequest,
  CancelOrderItemRequest,
  ConfirmPaymentRequest,
  OrderDto,
  OrderStatus,
  OrderSummaryDto,
  PaymentDto,
  PaymentMethod,
  VietQrPreviewDto,
} from '../types/api';

export interface ListOrdersParams {
  status?: OrderStatus;
  from?: string;
  to?: string;
  method?: PaymentMethod;
}

export const orderApi = {
  async getActiveOrderByTable(tableId: number): Promise<OrderDto> {
    const { data } = await apiClient.get<OrderDto>(`/tables/${tableId}/active-order`);
    return data;
  },

  async listOrders(params?: ListOrdersParams): Promise<OrderSummaryDto[]> {
    const { data } = await apiClient.get<OrderSummaryDto[]>('/orders', { params });
    return data;
  },

  async getOrder(id: number): Promise<OrderDto> {
    const { data } = await apiClient.get<OrderDto>(`/orders/${id}`);
    return data;
  },

  async addItems(orderId: number, payload: AddOrderItemsRequest): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(`/orders/${orderId}/items`, payload);
    return data;
  },

  async cancelItem(
    orderId: number,
    itemId: number,
    payload?: CancelOrderItemRequest
  ): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(
      `/orders/${orderId}/items/${itemId}/cancel`,
      payload ?? {}
    );
    return data;
  },

  async requestPayment(orderId: number): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(`/orders/${orderId}/request-payment`);
    return data;
  },

  async previewVietQr(orderId: number): Promise<VietQrPreviewDto> {
    const { data } = await apiClient.post<VietQrPreviewDto>(
      `/orders/${orderId}/payments/vietqr-preview`
    );
    return data;
  },

  async confirmPayment(orderId: number, payload: ConfirmPaymentRequest): Promise<PaymentDto> {
    const { data } = await apiClient.post<PaymentDto>(
      `/orders/${orderId}/payments/confirm`,
      payload
    );
    return data;
  },
};
