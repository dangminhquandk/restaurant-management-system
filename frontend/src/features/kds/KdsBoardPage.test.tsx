import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { kdsApi } from '../../api/kdsApi';
import { menuApi } from '../../api/menuApi';
import { ToastProvider } from '../../store/ToastContext';
import type { KdsItemDto, MenuItemDto } from '../../types/api';
import { KdsBoardPage } from './KdsBoardPage';

vi.mock('../../api/kdsApi', () => ({
  kdsApi: {
    listItems: vi.fn(),
    updateItemStatus: vi.fn(),
  },
}));

vi.mock('../../api/menuApi', () => ({
  menuApi: {
    listMenuItems: vi.fn(),
    toggleAvailability: vi.fn(),
  },
}));

const MOCK_KDS_TICKETS: KdsItemDto[] = [
  {
    id: 701,
    orderId: 101,
    orderCode: 'ORD-20261126-0101',
    tableId: 1,
    tableName: 'T1-01',
    areaName: 'Tầng 1',
    menuItemId: 10,
    menuItemName: 'Phở Bò Tái Lăn',
    batchNo: 1,
    quantity: 2,
    note: 'Ít cay, không hành',
    status: 'COOKING',
    createdAt: new Date(Date.now() - 180000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 702,
    orderId: 102,
    orderCode: 'ORD-20261126-0102',
    tableId: 3,
    tableName: 'T2-01',
    areaName: 'Tầng 2',
    menuItemId: 15,
    menuItemName: 'Lẩu Thái Hải Sản',
    batchNo: 1,
    quantity: 1,
    note: null,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 45000).toISOString(),
    updatedAt: new Date(Date.now() - 45000).toISOString(),
  },
];

const MOCK_DRAWER_MENU: MenuItemDto[] = [
  {
    id: 10,
    categoryId: 1,
    categoryName: 'Món chính',
    name: 'Phở Bò Tái Lăn',
    price: 65000,
    imageUrl: null,
    description: null,
    isAvailable: true,
  },
];

describe('KdsBoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FIFO tickets with spice notes, transitions COOKING -> READY, and toggles Out-of-Stock', async () => {
    const user = userEvent.setup();
    vi.mocked(kdsApi.listItems).mockResolvedValueOnce(MOCK_KDS_TICKETS);
    vi.mocked(kdsApi.updateItemStatus).mockResolvedValueOnce({
      ...MOCK_KDS_TICKETS[0],
      status: 'READY',
    });
    vi.mocked(menuApi.listMenuItems).mockResolvedValueOnce(MOCK_DRAWER_MENU);
    vi.mocked(menuApi.toggleAvailability).mockResolvedValueOnce({
      ...MOCK_DRAWER_MENU[0],
      isAvailable: false,
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <KdsBoardPage />
        </ToastProvider>
      </MemoryRouter>
    );

    // Renders FIFO items & prominent spice note callout
    expect(await screen.findByText('2× Phở Bò Tái Lăn')).toBeInTheDocument();
    expect(screen.getByText('Ghi chú: Ít cay, không hành')).toBeInTheDocument();
    expect(screen.getByText('1× Lẩu Thái Hải Sản')).toBeInTheDocument();

    // Advance COOKING -> READY
    await user.click(screen.getByRole('button', { name: /Hoàn tất \(Báo phục vụ\)/i }));

    await waitFor(() => {
      expect(kdsApi.updateItemStatus).toHaveBeenCalledWith(701, { status: 'READY' });
    });

    // Ticket now displays "Đã phục vụ" progression button
    expect(await screen.findByRole('button', { name: /Đã phục vụ/i })).toBeInTheDocument();

    // Open Quick Out-of-Stock Drawer ("Báo Hết Món") and lock dish
    await user.click(screen.getByRole('button', { name: /Báo Hết Món/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const toggleBtn = await screen.findByRole('button', {
      name: 'Đổi trạng thái Phở Bò Tái Lăn',
    });
    await user.click(toggleBtn);

    await waitFor(() => {
      expect(menuApi.toggleAvailability).toHaveBeenCalledWith(10, { isAvailable: false });
    });

    expect(await screen.findByText('Tạm hết')).toBeInTheDocument();
  });
});
