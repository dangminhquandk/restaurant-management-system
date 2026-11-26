import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { orderApi } from '../../api/orderApi';
import { ToastProvider } from '../../store/ToastContext';
import type { OrderDto, PaymentDto, VietQrPreviewDto } from '../../types/api';
import { PaymentModal } from './PaymentModal';

vi.mock('../../api/orderApi', () => ({
  orderApi: {
    previewVietQr: vi.fn(),
    confirmPayment: vi.fn(),
  },
}));

const MOCK_ORDER: OrderDto = {
  id: 88,
  orderCode: 'ORD-20261126-0088',
  tableId: 1,
  tableName: 'T1-01',
  areaName: 'Tầng 1',
  staffId: 2,
  staffName: 'Đào Trần Hoàng Hải',
  status: 'OPEN',
  totalAmount: 485000,
  version: 2,
  createdAt: '2026-11-26T10:00:00Z',
  closedAt: null,
  items: [
    {
      id: 1,
      menuItemId: 10,
      menuItemName: 'Lẩu Thái Hải Sản',
      batchNo: 1,
      quantity: 1,
      unitPrice: 485000,
      note: null,
      status: 'SERVED',
      createdAt: '2026-11-26T10:01:00Z',
    },
  ],
  payment: null,
};

const MOCK_VIETQR_PREVIEW: VietQrPreviewDto = {
  orderId: 88,
  orderCode: 'ORD-20261126-0088',
  amount: 485000,
  bankBin: '970415',
  accountNumber: '113366668888',
  accountName: 'NHA HANG DEMO IT3180',
  addInfo: 'THANHTOAN ORD-20261126-0088',
  qrPayload:
    '00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454064850005802VN5920NHA HANG DEMO IT31806006HA NOI62310827THANHTOAN ORD-20261126-00886304A1B2',
};

describe('PaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic VietQR SVG preview with exact amount & EMVCo payload, calculates cash change, and confirms payment', async () => {
    const user = userEvent.setup();
    const onPaymentCompleted = vi.fn();
    const onPrintReceipt = vi.fn();

    vi.mocked(orderApi.previewVietQr).mockResolvedValueOnce(MOCK_VIETQR_PREVIEW);

    const completedCashPayment: PaymentDto = {
      id: 500,
      orderId: 88,
      orderCode: 'ORD-20261126-0088',
      method: 'CASH',
      amount: 485000,
      amountReceived: 500000,
      changeAmount: 15000,
      qrPayload: null,
      status: 'COMPLETED',
      paidAt: '2026-11-26T10:35:00Z',
      cashierName: 'Đào Trần Hoàng Hải',
    };
    vi.mocked(orderApi.confirmPayment).mockResolvedValueOnce(completedCashPayment);

    render(
      <ToastProvider>
        <PaymentModal
          open={true}
          order={MOCK_ORDER}
          onClose={vi.fn()}
          onPaymentCompleted={onPaymentCompleted}
          onPrintReceipt={onPrintReceipt}
        />
      </ToastProvider>
    );

    // Loads VietQR preview automatically and renders SVG QR code + bank info
    await waitFor(() => {
      expect(orderApi.previewVietQr).toHaveBeenCalledWith(88);
    });
    const qrContainer = await screen.findByTestId('vietqr-svg-container');
    expect(qrContainer.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('113366668888')).toBeInTheDocument();
    expect(screen.getByText('THANHTOAN ORD-20261126-0088')).toBeInTheDocument();
    expect(screen.getAllByText('485.000 ₫').length).toBeGreaterThanOrEqual(2);

    // Switch to Cash tab, pick 500.000 ₫ denomination, verify 15.000 ₫ change
    await user.click(screen.getByRole('tab', { name: /Tiền mặt \(CASH\)/i }));
    await user.click(screen.getByRole('button', { name: '500.000 ₫' }));

    expect(screen.getByTestId('cash-change-amount')).toHaveTextContent('15.000 ₫');

    await user.click(screen.getByRole('button', { name: /Xác nhận thanh toán tiền mặt/i }));

    await waitFor(() => {
      expect(orderApi.confirmPayment).toHaveBeenCalledWith(88, {
        method: 'CASH',
        amountReceived: 500000,
      });
    });

    expect(onPaymentCompleted).toHaveBeenCalledWith(completedCashPayment);
  });
});
