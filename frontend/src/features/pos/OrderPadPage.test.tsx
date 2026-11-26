import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { menuApi } from '../../api/menuApi';
import { orderApi } from '../../api/orderApi';
import { AuthProvider } from '../../store/AuthContext';
import { ToastProvider } from '../../store/ToastContext';
import type { CategoryDto, MenuItemDto, OrderDto } from '../../types/api';
import { OrderPadPage } from './OrderPadPage';

vi.mock('../../api/menuApi', () => ({
  menuApi: {
    listCategories: vi.fn(),
    listMenuItems: vi.fn(),
  },
}));

vi.mock('../../api/orderApi', () => ({
  orderApi: {
    getActiveOrderByTable: vi.fn(),
    addItems: vi.fn(),
    cancelItem: vi.fn(),
    requestPayment: vi.fn(),
    getOrder: vi.fn(),
  },
}));

const MOCK_CATEGORIES: CategoryDto[] = [
  { id: 1, name: 'Món chính', displayOrder: 1, isActive: true },
  { id: 2, name: 'Đồ uống', displayOrder: 2, isActive: true },
];

const MOCK_MENU: MenuItemDto[] = [
  {
    id: 10,
    categoryId: 1,
    categoryName: 'Món chính',
    name: 'Phở Bò Tái Lăn',
    price: 65000,
    imageUrl: null,
    description: 'Bò tươi xào lăn thơm gừng tỏi',
    isAvailable: true,
  },
  {
    id: 11,
    categoryId: 1,
    categoryName: 'Món chính',
    name: 'Bún Chả Hà Nội',
    price: 60000,
    imageUrl: null,
    description: 'Chả nướng than hoa',
    isAvailable: false,
  },
];

const MOCK_ORDER: OrderDto = {
  id: 501,
  orderCode: 'ORD-20261126-0501',
  tableId: 1,
  tableName: 'T1-01',
  areaName: 'Tầng 1',
  staffId: 2,
  staffName: 'Đào Trần Hoàng Hải',
  status: 'OPEN',
  totalAmount: 0,
  version: 0,
  createdAt: '2026-11-26T09:15:00Z',
  closedAt: null,
  items: [],
  payment: null,
};

describe('OrderPadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports accent-insensitive search, blocks unavailable items, and submits batch with notes', async () => {
    const user = userEvent.setup();
    vi.mocked(menuApi.listCategories).mockResolvedValueOnce(MOCK_CATEGORIES);
    vi.mocked(menuApi.listMenuItems).mockResolvedValueOnce(MOCK_MENU);
    vi.mocked(orderApi.getActiveOrderByTable).mockResolvedValueOnce(MOCK_ORDER);
    vi.mocked(orderApi.addItems).mockResolvedValueOnce({
      ...MOCK_ORDER,
      totalAmount: 130000,
      items: [
        {
          id: 900,
          menuItemId: 10,
          menuItemName: 'Phở Bò Tái Lăn',
          batchNo: 1,
          quantity: 2,
          unitPrice: 65000,
          note: 'Ít cay, không hành',
          status: 'PENDING',
          createdAt: '2026-11-26T09:16:00Z',
        },
      ],
    });

    render(
      <MemoryRouter
        initialEntries={['/pos/orders/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/pos/orders/:tableId" element={<OrderPadPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Phở Bò Tái Lăn')).toBeInTheDocument();

    // Unavailable item must be disabled with "Tạm hết" badge
    const unavailableCard = screen.getByRole('button', { name: /Bún Chả Hà Nội/i });
    expect(unavailableCard).toBeDisabled();
    expect(screen.getByText('Tạm hết')).toBeInTheDocument();

    // Accent-insensitive Vietnamese search: "pho bo" matches "Phở Bò Tái Lăn"
    await user.type(screen.getByLabelText('Tìm kiếm món ăn'), 'pho bo');
    expect(screen.getByText('Phở Bò Tái Lăn')).toBeInTheDocument();
    expect(screen.queryByText('Bún Chả Hà Nội')).not.toBeInTheDocument();

    // Tap twice to add 2 bowls + enter note + submit to kitchen
    const phoCard = screen.getByRole('button', { name: /Phở Bò Tái Lăn/i });
    await user.click(phoCard);
    await user.click(phoCard);

    const noteInput = screen.getByLabelText('Ghi chú cho Phở Bò Tái Lăn');
    await user.type(noteInput, 'Ít cay, không hành');

    await user.click(screen.getByRole('button', { name: /Gửi bếp ngay/i }));

    await waitFor(() => {
      expect(orderApi.addItems).toHaveBeenCalledWith(501, {
        items: [
          {
            menuItemId: 10,
            quantity: 2,
            note: 'Ít cay, không hành',
          },
        ],
      });
    });

    expect(await screen.findByText('2× Phở Bò Tái Lăn')).toBeInTheDocument();
  });
});
