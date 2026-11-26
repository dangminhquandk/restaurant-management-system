import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  LogOut,
  MapPin,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { useSoundAlert } from '../hooks/useSoundAlert';
import { useAuth } from '../store/AuthContext';
import { useRealtime, useStompSubscription } from '../store/RealtimeContext';
import { useToast } from '../store/ToastContext';
import type { PosNotificationStompEvent, Role } from '../types/api';
import { getHomeRouteForRole, getRoleDisplayLabel } from '../utils/navigation';
import { ConnectionStatusBadge, ConnectionStatusBanner } from './ConnectionStatusBanner';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/pos/tables',
    label: 'Sơ đồ bàn',
    icon: LayoutGrid,
    roles: ['STAFF', 'ADMIN'],
  },
  {
    to: '/pos/history',
    label: 'Lịch sử HĐ',
    icon: ClipboardList,
    roles: ['STAFF', 'ADMIN'],
  },
  {
    to: '/kds',
    label: 'Bếp KDS',
    icon: ChefHat,
    roles: ['KITCHEN', 'ADMIN'],
  },
  {
    to: '/admin/menu',
    label: 'Thực đơn',
    icon: UtensilsCrossed,
    roles: ['ADMIN'],
  },
  {
    to: '/admin/tables',
    label: 'Khu vực & Bàn',
    icon: MapPin,
    roles: ['ADMIN'],
  },
  {
    to: '/admin/users',
    label: 'Nhân sự',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    to: '/admin/dashboard',
    label: 'Thống kê & Cấu hình',
    icon: BarChart3,
    roles: ['ADMIN'],
  },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { connectionState } = useRealtime();
  const { showToast } = useToast();
  const { playChime } = useSoundAlert();
  const navigate = useNavigate();
  const location = useLocation();

  const isKdsMode = location.pathname.startsWith('/kds');
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  // Real-time POS notification when Kitchen marks a dish READY (FR-14)
  useStompSubscription<PosNotificationStompEvent>('/topic/pos/notifications', (payload) => {
    if (!user || user.role === 'KITCHEN') return;
    if (payload?.eventType === 'ITEM_READY' || payload?.message) {
      playChime();
      showToast({
        title: `Món sẵn sàng phục vụ — Bàn ${payload.tableName}`,
        message:
          payload.message ||
          `Bàn ${payload.tableName}: ${payload.quantity}x ${payload.menuItemName} đã nấu xong!`,
        variant: 'success',
      });
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isKdsMode ? 'bg-kds-canvas text-slate-100' : 'bg-canvas text-ink-primary'
      }`}
    >
      <header
        className={`no-print sticky top-0 z-30 border-b backdrop-blur-md ${
          isKdsMode
            ? 'border-slate-800 bg-slate-900/95 text-slate-100'
            : 'border-stone-200/90 bg-white/95 text-stone-900'
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(getHomeRouteForRole(user?.role))}
              className="group flex min-h-[48px] items-center gap-3 rounded-xl px-2 text-left transition"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bistro text-white shadow-sm transition group-hover:bg-bistro-hover">
                <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span
                  className={`block text-sm font-extrabold uppercase tracking-wider ${
                    isKdsMode ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  Bách Khoa Bistro
                </span>
                <span
                  className={`block text-xs font-medium ${
                    isKdsMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  Tactile Bistro Command
                </span>
              </span>
            </button>
          </div>

          <nav
            aria-label="Điều hướng phân hệ"
            className="order-3 flex w-full items-center gap-1.5 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:pb-0"
          >
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => {
                    if (isKdsMode) {
                      return `inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`;
                    }
                    return `inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-bistro text-white shadow-sm'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`;
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="order-2 flex items-center gap-2.5 lg:order-3">
            <div className="hidden xl:block">
              <ConnectionStatusBadge state={connectionState} dark={isKdsMode} />
            </div>

            {user && (
              <div
                className={`hidden sm:flex flex-col items-end rounded-xl border px-3 py-1.5 text-right ${
                  isKdsMode
                    ? 'border-slate-700 bg-slate-800/80'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    isKdsMode ? 'text-slate-100' : 'text-stone-900'
                  }`}
                >
                  {user.fullName}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isKdsMode ? 'text-amber-400' : 'text-bistro'
                  }`}
                >
                  {getRoleDisplayLabel(user.role)} ({user.username})
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Đăng xuất"
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition ${
                isKdsMode
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-rose-950 hover:border-rose-700 hover:text-rose-200'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <ConnectionStatusBanner state={connectionState} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
