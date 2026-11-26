import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getHomeRouteForRole, getRoleDisplayLabel } from '../../utils/navigation';

export function ForbiddenPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const homePath = isAuthenticated && user ? getHomeRouteForRole(user.role) : '/login';

  return (
    <div className="bistro-editorial-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-tactile-hover">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-rose-600">
          Mã lỗi HTTP 403
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-stone-900">
          Không đủ quyền truy cập phân hệ này
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {user ? (
            <>
              Tài khoản <strong>{user.fullName}</strong> hiện có vai trò{' '}
              <strong>{getRoleDisplayLabel(user.role)}</strong> nên không được phép thao tác trên
              trang bạn vừa yêu cầu.
            </>
          ) : (
            'Phiên đăng nhập hiện tại không có quyền truy cập vào khu vực này.'
          )}
        </p>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(homePath, { replace: true })}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-6 text-sm font-bold text-white shadow-sm transition hover:bg-bistro-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Quay về màn hình chính</span>
          </button>
        </div>
      </div>
    </div>
  );
}
