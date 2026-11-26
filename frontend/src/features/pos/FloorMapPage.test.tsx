import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { floorApi } from '../../api/floorApi';
import { ToastProvider } from '../../store/ToastContext';
import type { AreaDto, DiningTableDto } from '../../types/api';
import { FloorMapPage } from './FloorMapPage';

vi.mock('../../api/floorApi', () => ({
  floorApi: {
    listAreas: vi.fn(),
    listTables: vi.fn(),
    openTable: vi.fn(),
    cleanTable: vi.fn(),
  },
}));

const MOCK_AREAS: AreaDto[] = [
  { id: 1, name: 'Tầng 1', displayOrder: 1, description: 'Sảnh chính' },
  { id: 2, name: 'Sân vườn', displayOrder: 2, description: 'Ngoài trời' },
];

const INITIAL_TABLES: DiningTableDto[] = [
  {
    id: 1,
    areaId: 1,
    areaName: 'Tầng 1',
    name: 'T1-01',
    capacity: 4,
    status: 'OCCUPIED',
    version: 2,
    activeOrderId: 101,
    activeOrderCode: 'ORD-20261126-0001',
    activeOrderTotal: 485000,
  },
  {
    id: 2,
    areaId: 1,
    areaName: 'Tầng 1',
    name: 'T1-02',
    capacity: 4,
    status: 'AVAILABLE',
    version: 5,
    activeOrderId: null,
    activeOrderCode: null,
    activeOrderTotal: null,
  },
  {
    id: 3,
    areaId: 2,
    areaName: 'Sân vườn',
    name: 'SV-01',
    capacity: 6,
    status: 'CLEANING',
    version: 1,
    activeOrderId: null,
    activeOrderCode: null,
    activeOrderTotal: null,
  },
];

function renderFloorMap() {
  return render(
    <MemoryRouter
      initialEntries={['/pos/tables']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        <Routes>
          <Route path="/pos/tables" element={<FloorMapPage />} />
          <Route path="/pos/orders/:tableId" element={<div>Order Pad Destination</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('FloorMapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic areas, status summary counts, and navigates on opening an AVAILABLE table', async () => {
    const user = userEvent.setup();
    vi.mocked(floorApi.listAreas).mockResolvedValueOnce(MOCK_AREAS);
    vi.mocked(floorApi.listTables).mockResolvedValueOnce(INITIAL_TABLES);
    vi.mocked(floorApi.openTable).mockResolvedValueOnce({
      table: { ...INITIAL_TABLES[1], status: 'OCCUPIED', version: 6 },
      order: {
        id: 102,
        orderCode: 'ORD-20261126-0002',
        tableId: 2,
        tableName: 'T1-02',
        areaName: 'Tầng 1',
        staffId: 2,
        staffName: 'Đào Trần Hoàng Hải',
        status: 'OPEN',
        totalAmount: 0,
        version: 0,
        createdAt: '2026-11-26T09:10:00Z',
        closedAt: null,
        items: [],
        payment: null,
      },
    });

    renderFloorMap();

    expect(await screen.findByText('T1-01')).toBeInTheDocument();
    expect(screen.getByText('485.000 ₫')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tầng 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sân vườn/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mở bàn T1-02' }));

    await waitFor(() => {
      expect(floorApi.openTable).toHaveBeenCalledWith(2, { expectedVersion: 5 });
    });

    expect(await screen.findByText('Order Pad Destination')).toBeInTheDocument();
  });

  it('handles 409 Conflict when opening a table concurrently by displaying conflict alert and reloading tables', async () => {
    const user = userEvent.setup();
    vi.mocked(floorApi.listAreas).mockResolvedValueOnce(MOCK_AREAS);
    vi.mocked(floorApi.listTables)
      .mockResolvedValueOnce(INITIAL_TABLES)
      .mockResolvedValueOnce([
        INITIAL_TABLES[0],
        {
          ...INITIAL_TABLES[1],
          status: 'OCCUPIED',
          version: 6,
          activeOrderId: 109,
          activeOrderCode: 'ORD-20261126-0099',
          activeOrderTotal: 130000,
        },
        INITIAL_TABLES[2],
      ]);

    const conflictError = new axios.AxiosError('Conflict', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: {
        timestamp: '2026-11-26T09:30:00Z',
        status: 409,
        error: 'CONFLICT',
        code: 'TABLE_VERSION_CONFLICT',
        message: 'Bàn vừa được nhân viên khác mở. Đã làm mới sơ đồ bàn.',
        path: '/api/v1/tables/2/open',
      },
    });
    vi.mocked(floorApi.openTable).mockRejectedValueOnce(conflictError);

    renderFloorMap();

    const openBtn = await screen.findByRole('button', { name: 'Mở bàn T1-02' });
    await user.click(openBtn);

    // Must display prominent conflict message and reload GET /api/v1/tables automatically
    const alerts = await screen.findAllByRole('alert');
    expect(
      alerts.some((el) =>
        el.textContent?.includes('Bàn vừa được nhân viên khác mở. Đã làm mới sơ đồ bàn.')
      )
    ).toBe(true);

    await waitFor(() => {
      expect(floorApi.listTables).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('ORD-20261126-0099')).toBeInTheDocument();
    expect(screen.getByText('130.000 ₫')).toBeInTheDocument();
  });
});
