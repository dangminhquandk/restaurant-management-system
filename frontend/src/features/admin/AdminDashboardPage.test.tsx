import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { ToastProvider } from '../../store/ToastContext';
import type { RevenueReportDto, SystemSettingsDto } from '../../types/api';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getRevenueReport: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    listAuditLogs: vi.fn(),
  },
}));

const MOCK_REVENUE_REPORT: RevenueReportDto = {
  from: '2026-11-20',
  to: '2026-11-26',
  totalRevenue: 12500000,
  paidOrderCount: 42,
  cashRevenue: 5000000,
  vietqrRevenue: 7500000,
  dailySeries: [
    { date: '2026-11-25', revenue: 5200000, orderCount: 18 },
    { date: '2026-11-26', revenue: 7300000, orderCount: 24 },
  ],
  topItems: [
    {
      menuItemId: 10,
      menuItemName: 'Phở Bò Tái Lăn',
      categoryName: 'Món chính',
      totalQuantity: 85,
      totalRevenue: 5525000,
    },
    {
      menuItemId: 12,
      menuItemName: 'Lẩu Thái Hải Sản',
      categoryName: 'Lẩu',
      totalQuantity: 20,
      totalRevenue: 6900000,
    },
  ],
};

const MOCK_SETTINGS: SystemSettingsDto = {
  restaurantName: 'Nhà Hàng Bách Khoa Bistro',
  vietqrBankBin: '970415',
  vietqrAccountNumber: '113366668888',
  vietqrAccountName: 'NHA HANG DEMO IT3180',
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders revenue KPIs, Top 10 best-selling dishes, and updates VietQR settings', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getRevenueReport).mockResolvedValueOnce(MOCK_REVENUE_REPORT);
    vi.mocked(adminApi.getSettings).mockResolvedValueOnce(MOCK_SETTINGS);
    vi.mocked(adminApi.updateSettings).mockImplementation(async (payload) => payload);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AdminDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );

    // Revenue KPIs & Top 10 best-selling dishes
    expect(await screen.findByText('12.500.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('42 đơn')).toBeInTheDocument();
    expect(screen.getByText('7.500.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('5.000.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Lăn')).toBeInTheDocument();
    expect(screen.getByText('85 phần')).toBeInTheDocument();

    // Switch to VietQR Settings tab and update bank BIN & account number
    await user.click(screen.getByRole('tab', { name: /Cấu hình VietQR/i }));

    const bankBinInput = await screen.findByLabelText('Mã BIN Ngân hàng');
    expect(bankBinInput).toHaveValue('970415');

    await user.clear(bankBinInput);
    await user.type(bankBinInput, '970436');

    const accountInput = screen.getByLabelText('Số tài khoản thụ hưởng');
    await user.clear(accountInput);
    await user.type(accountInput, '9988776655');

    await user.click(screen.getByRole('button', { name: /Lưu cấu hình VietQR/i }));

    await waitFor(() => {
      expect(adminApi.updateSettings).toHaveBeenCalledWith({
        restaurantName: 'Nhà Hàng Bách Khoa Bistro',
        vietqrBankBin: '970436',
        vietqrAccountNumber: '9988776655',
        vietqrAccountName: 'NHA HANG DEMO IT3180',
      });
    });

    expect(await screen.findByText('Đã lưu cấu hình VietQR')).toBeInTheDocument();
  });
});
