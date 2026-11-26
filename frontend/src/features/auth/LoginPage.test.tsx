import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../api/authApi';
import { AUTH_TOKEN_KEY } from '../../api/client';
import { AuthProvider } from '../../store/AuthContext';
import { LoginPage } from './LoginPage';

vi.mock('../../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

function renderLoginWithRoutes() {
  return render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pos/tables" element={<div>POS Floor Map Screen</div>} />
          <Route path="/admin/menu" element={<div>Admin Menu Screen</div>} />
          <Route path="/kds" element={<div>KDS Board Screen</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login inputs and 1-click quick demo role buttons', () => {
    renderLoginWithRoutes();

    expect(screen.getByText('Nhà Hàng Bách Khoa Bistro')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quản lý \(admin\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Phục vụ \(staff1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đầu bếp \(kitchen1\)/i })).toBeInTheDocument();
  });

  it('logs in via Quick Demo Staff button and redirects to /pos/tables', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken: 'jwt-staff-token',
      tokenType: 'Bearer',
      expiresInMs: 28800000,
      user: {
        id: 2,
        username: 'staff1',
        fullName: 'Đào Trần Hoàng Hải',
        role: 'STAFF',
      },
    });

    renderLoginWithRoutes();

    await user.click(screen.getByRole('button', { name: /Phục vụ \(staff1\)/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        username: 'staff1',
        password: 'staff123',
      });
    });

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-staff-token');
    expect(await screen.findByText('POS Floor Map Screen')).toBeInTheDocument();
  });

  it('redirects ADMIN role to /admin/menu and displays 401 backend error cleanly', async () => {
    const user = userEvent.setup();
    const unauthorizedError = new axios.AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: {
        timestamp: '2026-11-26T09:00:00Z',
        status: 401,
        error: 'UNAUTHORIZED',
        code: 'INVALID_CREDENTIALS',
        message: 'Tài khoản hoặc mật khẩu không đúng.',
        path: '/api/v1/auth/login',
      },
    });

    vi.mocked(authApi.login).mockRejectedValueOnce(unauthorizedError);

    renderLoginWithRoutes();

    await user.type(screen.getByLabelText('Tên đăng nhập'), 'wronguser');
    await user.type(screen.getByLabelText('Mật khẩu'), 'badpass');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập hệ thống' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tài khoản hoặc mật khẩu không đúng.'
    );

    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken: 'jwt-admin-token',
      tokenType: 'Bearer',
      expiresInMs: 28800000,
      user: {
        id: 1,
        username: 'admin',
        fullName: 'Đặng Minh Quân',
        role: 'ADMIN',
      },
    });

    await user.click(screen.getByRole('button', { name: /Quản lý \(admin\)/i }));
    expect(await screen.findByText('Admin Menu Screen')).toBeInTheDocument();
  });
});
