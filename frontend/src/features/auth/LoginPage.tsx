import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ChefHat,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { parseApiError } from '../../utils/errors';
import { getHomeRouteForRole } from '../../utils/navigation';

interface DemoAccount {
  label: string;
  subtitle: string;
  username: string;
  password: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Quản lý (admin)',
    subtitle: 'Thực đơn, Khu vực & Bàn, Nhân sự',
    username: 'admin',
    password: 'admin123',
    badgeColor: 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950',
    icon: ShieldCheck,
  },
  {
    label: 'Phục vụ (staff1)',
    subtitle: 'Sơ đồ bàn & Gọi món POS 3 chạm',
    username: 'staff1',
    password: 'staff123',
    badgeColor: 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950',
    icon: UserCheck,
  },
  {
    label: 'Đầu bếp (kitchen1)',
    subtitle: 'Màn hình Điều phối Bếp KDS',
    username: 'kitchen1',
    password: 'kitchen123',
    badgeColor: 'border-sky-300 bg-sky-50/70 hover:bg-sky-100/80 text-sky-950',
    icon: ChefHat,
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const performLogin = async (targetUsername: string, targetPassword: string) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login({
        username: targetUsername.trim(),
        password: targetPassword,
      });
      navigate(getHomeRouteForRole(loggedInUser.role), { replace: true });
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Tên đăng nhập hoặc mật khẩu không chính xác, hoặc tài khoản đã bị khóa.'
      );
      setErrorMessage(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    await performLogin(username, password);
  };

  const handleDemoQuickLogin = async (demo: DemoAccount) => {
    setUsername(demo.username);
    setPassword(demo.password);
    await performLogin(demo.username, demo.password);
  };

  return (
    <div className="bistro-editorial-bg flex min-h-screen flex-col justify-center px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-tactile-hover lg:grid-cols-12">
        {/* Left Editorial Bistro Column */}
        <section className="relative flex flex-col justify-between bg-stone-900 p-8 text-stone-100 lg:col-span-5 lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-bistro px-3.5 py-2 text-white shadow-sm">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-extrabold uppercase tracking-widest">
                IT3180 • HUST Bistro
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Nhà Hàng Bách Khoa Bistro
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">
              Hệ thống điều hành phục vụ tại bàn (POS), điều phối bếp thời gian thực (KDS) và quản
              trị thực đơn chuẩn công thái học ca trực 8 giờ.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-stone-800 pt-6 text-xs text-stone-300">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Chuẩn tương tác chạm</span>
              <span className="font-bold text-amber-400">Fitts&apos;s Law ≥ 48×48px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Kiểm soát mở trùng bàn</span>
              <span className="font-bold text-emerald-400">Optimistic Lock @Version</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400"> Luồng gọi món tiêu chuẩn</span>
              <span className="font-bold text-stone-100">≤ 3 chạm xuống bếp</span>
            </div>
          </div>
        </section>

        {/* Right Command Login Form */}
        <section className="p-6 sm:p-8 lg:col-span-7 lg:p-10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">Đăng nhập ca làm việc</h2>
              <p className="mt-1 text-sm text-stone-600">
                Nhập tài khoản nhân sự hoặc chọn nhanh vai trò Demo bên dưới.
              </p>
            </div>
            <KeyRound className="hidden h-7 w-7 text-bistro sm:block" aria-hidden="true" />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-l-4 border-rose-200 border-l-rose-600 bg-rose-50/80 p-4 text-sm font-medium text-rose-900"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-bold text-stone-800"
              >
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: staff1, kitchen1, admin"
                disabled={submitting}
                className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-bistro focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-bold text-stone-800"
              >
                Mật khẩu
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu ca trực"
                disabled={submitting}
                className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-bistro focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-bistro px-6 text-base font-bold text-white shadow-sm transition hover:bg-bistro-hover disabled:opacity-60"
            >
              {submitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </button>
          </form>

          {/* 1-Click Quick Demo Role Buttons */}
          <div className="mt-8 border-t border-stone-200 pt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              <Sparkles className="h-4 w-4 text-bistro" aria-hidden="true" />
              <span>Đăng nhập nhanh 1 chạm (Demo IT3180)</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((demo) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.username}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDemoQuickLogin(demo)}
                    className={`flex min-h-[60px] flex-col items-start justify-center rounded-xl border px-3.5 py-2.5 text-left transition disabled:opacity-60 ${demo.badgeColor}`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-extrabold">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {demo.label}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-[11px] font-medium opacity-80">
                      {demo.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
