import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Lock, Plus, Search, Unlock, UserPlus, X } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../store/ToastContext';
import type { Role, UserDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatDateTimeVi, matchesViSearch } from '../../utils/format';
import { getRoleDisplayLabel } from '../../utils/navigation';

const ROLE_BADGE_STYLE: Record<Role, string> = {
  ADMIN: 'border-amber-300 bg-amber-50 text-amber-900',
  STAFF: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  KITCHEN: 'border-sky-200 bg-sky-50 text-sky-800',
};

export function AdminUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  // Create / Edit User Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải danh sách tài khoản nhân sự.');
      showToast({ title: 'Lỗi tải nhân sự', message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (
        searchQuery.trim() &&
        !matchesViSearch(u.fullName, searchQuery) &&
        !matchesViSearch(u.username, searchQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setRole('STAFF');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (user: UserDto) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setPassword('');
    setRole(user.role);
    setIsActive(user.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setFormError('Tên đăng nhập và Họ tên không được để trống.');
      return;
    }
    if (!editingUser && password.length < 6) {
      setFormError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingUser) {
        const updated = await adminApi.updateUser(editingUser.id, {
          username: username.trim(),
          fullName: fullName.trim(),
          role,
          isActive,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast({ message: `Đã cập nhật nhân sự "${updated.fullName}".`, variant: 'success' });
      } else {
        const created = await adminApi.createUser({
          username: username.trim(),
          password,
          fullName: fullName.trim(),
          role,
          isActive,
        });
        setUsers((prev) => [created, ...prev]);
        showToast({ message: `Đã tạo tài khoản "${created.username}".`, variant: 'success' });
      }
      setModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu thông tin tài khoản.');
      setFormError(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (target: UserDto) => {
    setTogglingUserId(target.id);
    try {
      const updated = await adminApi.updateUserStatus(target.id, {
        isActive: !target.isActive,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast({
        message: `Tài khoản "${updated.username}" đã ${
          updated.isActive ? 'được mở khóa' : 'bị khóa'
        }.`,
        variant: updated.isActive ? 'success' : 'warning',
      });
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không thể khóa tài khoản Quản lý hoạt động cuối cùng.'
      );
      showToast({ title: 'Thao tác bị từ chối', message: parsed.message, variant: 'error' });
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Quản trị Tài khoản Nhân sự
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Phân quyền theo vai trò (Quản lý, Phục vụ, Đầu bếp) và khóa nhanh tài khoản nghỉ ca.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white shadow-sm hover:bg-bistro-hover"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Tạo tài khoản mới</span>
        </button>
      </div>

      {/* Search & Role Filter */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile sm:grid-cols-12">
        <div className="relative sm:col-span-8">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm nhân sự"
            placeholder="Tìm theo họ tên hoặc username..."
            className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/50 pl-10 pr-4 text-sm text-stone-900 focus:border-bistro focus:bg-white focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
            aria-label="Lọc theo vai trò"
            className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 focus:border-bistro focus:outline-none"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản lý (ADMIN)</option>
            <option value="STAFF">Phục vụ / Thu ngân (STAFF)</option>
            <option value="KITCHEN">Đầu bếp (KITCHEN)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-3.5">Nhân sự</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Vai trò RBAC</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                    Không tìm thấy nhân sự phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((account) => (
                  <tr key={account.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3.5 font-bold text-stone-900">{account.fullName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-700">
                      {account.username}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          ROLE_BADGE_STYLE[account.role]
                        }`}
                      >
                        {getRoleDisplayLabel(account.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-600 tabular-nums">
                      {formatDateTimeVi(account.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          account.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                      >
                        {account.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(account)}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          disabled={togglingUserId === account.id}
                          onClick={() => void handleToggleUserStatus(account)}
                          className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 text-xs font-bold transition disabled:opacity-50 ${
                            account.isActive
                              ? 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {account.isActive ? (
                            <>
                              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="user-modal-title" className="text-lg font-extrabold text-stone-900">
                {editingUser
                  ? `Cập nhật nhân sự "${editingUser.username}"`
                  : 'Tạo tài khoản nhân sự mới'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Đóng biểu mẫu nhân sự"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-stone-700">
                Tên đăng nhập (Username) *
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: staff3, kitchen2"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 disabled:bg-stone-100 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Họ và tên nhân viên *
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Vai trò phân quyền *
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
                >
                  <option value="STAFF">Phục vụ / Thu ngân (STAFF)</option>
                  <option value="KITCHEN">Đầu bếp / Pha chế (KITCHEN)</option>
                  <option value="ADMIN">Quản lý nhà hàng (ADMIN)</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-stone-700">
                {editingUser ? 'Đặt lại mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Tối thiểu 6 ký tự'}
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-bistro focus:ring-bistro"
                />
                <span>Cho phép đăng nhập hệ thống</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu tài khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
