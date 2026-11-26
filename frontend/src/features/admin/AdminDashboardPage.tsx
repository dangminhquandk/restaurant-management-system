import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  CreditCard,
  FileSearch,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Settings,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../store/ToastContext';
import type { AuditLogDto, RevenueReportDto, SystemSettingsDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatDateTimeVi, formatVnd, matchesViSearch } from '../../utils/format';

export type DashboardSectionTab = 'ANALYTICS' | 'SETTINGS' | 'AUDIT';

interface AdminDashboardPageProps {
  initialTab?: DashboardSectionTab;
}

function getIsoDateOffset(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AdminDashboardPage({ initialTab = 'ANALYTICS' }: AdminDashboardPageProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DashboardSectionTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // --- Analytics State ---
  const [fromDate, setFromDate] = useState(() => getIsoDateOffset(-6));
  const [toDate, setToDate] = useState(() => getIsoDateOffset(0));
  const [activePreset, setActivePreset] = useState<'TODAY' | '7D' | '30D' | 'CUSTOM'>('7D');
  const [report, setReport] = useState<RevenueReportDto | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // --- System & VietQR Settings State ---
  const [settingsForm, setSettingsForm] = useState<SystemSettingsDto>({
    restaurantName: 'Nhà Hàng Bách Khoa Bistro',
    vietqrBankBin: '970415',
    vietqrAccountNumber: '',
    vietqrAccountName: '',
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  const loadRevenueReport = useCallback(
    async (targetFrom: string, targetTo: string) => {
      if (targetFrom > targetTo) {
        showToast({
          title: 'Khoảng thời gian không hợp lệ',
          message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.',
          variant: 'warning',
        });
        return;
      }
      setLoadingReport(true);
      try {
        const data = await adminApi.getRevenueReport(targetFrom, targetTo);
        setReport(data);
      } catch (error) {
        const parsed = parseApiError(error, 'Không thể tải báo cáo doanh thu.');
        showToast({ message: parsed.message, variant: 'error' });
      } finally {
        setLoadingReport(false);
      }
    },
    [showToast]
  );

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setSettingsError(null);
    try {
      const data = await adminApi.getSettings();
      setSettingsForm(data);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải cấu hình hệ thống & VietQR.');
      setSettingsError(parsed.message);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const logs = await adminApi.listAuditLogs(100);
      setAuditLogs(logs);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải nhật ký kiểm toán.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setLoadingAudit(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadRevenueReport(fromDate, toDate);
  }, [fromDate, toDate, loadRevenueReport]);

  useEffect(() => {
    if (activeTab === 'SETTINGS') {
      void loadSettings();
    } else if (activeTab === 'AUDIT') {
      void loadAuditLogs();
    }
  }, [activeTab, loadSettings, loadAuditLogs]);

  const applyDatePreset = (preset: 'TODAY' | '7D' | '30D') => {
    setActivePreset(preset);
    const today = getIsoDateOffset(0);
    if (preset === 'TODAY') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === '7D') {
      setFromDate(getIsoDateOffset(-6));
      setToDate(today);
    } else {
      setFromDate(getIsoDateOffset(-29));
      setToDate(today);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settingsForm.restaurantName.trim()) {
      setSettingsError('Tên nhà hàng không được để trống.');
      return;
    }
    if (!/^\d{6}$/.test(settingsForm.vietqrBankBin.trim())) {
      setSettingsError('Mã BIN ngân hàng NAPAS phải gồm đúng 6 chữ số (vd: 970415).');
      return;
    }
    if (!settingsForm.vietqrAccountNumber.trim() || !settingsForm.vietqrAccountName.trim()) {
      setSettingsError('Số tài khoản và Tên chủ tài khoản thụ hưởng không được để trống.');
      return;
    }

    setSavingSettings(true);
    setSettingsError(null);
    try {
      const saved = await adminApi.updateSettings({
        restaurantName: settingsForm.restaurantName.trim(),
        vietqrBankBin: settingsForm.vietqrBankBin.trim(),
        vietqrAccountNumber: settingsForm.vietqrAccountNumber.trim(),
        vietqrAccountName: settingsForm.vietqrAccountName.trim().toUpperCase(),
      });
      setSettingsForm(saved);
      showToast({
        title: 'Đã lưu cấu hình VietQR',
        message: 'Mọi hóa đơn VietQR mới sẽ áp dụng thông tin tài khoản thụ hưởng vừa cập nhật.',
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu cấu hình hệ thống.');
      setSettingsError(parsed.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const totalRev = report?.totalRevenue ?? 0;
  const vietqrPct = totalRev > 0 ? Math.round(((report?.vietqrRevenue ?? 0) / totalRev) * 100) : 0;
  const cashPct = totalRev > 0 ? 100 - vietqrPct : 0;

  const maxDailyRevenue = useMemo(() => {
    if (!report || report.dailySeries.length === 0) return 1;
    return Math.max(1, ...report.dailySeries.map((d) => d.revenue));
  }, [report]);

  const maxTopItemQty = useMemo(() => {
    if (!report || report.topItems.length === 0) return 1;
    return Math.max(1, ...report.topItems.map((i) => i.totalQuantity));
  }, [report]);

  const distinctAuditActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action))).sort();
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
      if (auditSearch.trim()) {
        return (
          matchesViSearch(log.actorFullName, auditSearch) ||
          matchesViSearch(log.actorUsername, auditSearch) ||
          matchesViSearch(log.action, auditSearch) ||
          matchesViSearch(log.detail, auditSearch)
        );
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearch]);

  return (
    <div className="space-y-5">
      {/* Header & Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Trung tâm Thống kê, Cấu hình VietQR & Kiểm toán
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Giám sát doanh thu thực thu, Top 10 món chủ lực, cấu hình ngân hàng NAPAS 247 và nhật ký an toàn.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Phân mục quản trị hệ thống"
          className="inline-flex flex-wrap rounded-2xl border border-stone-200 bg-white p-1 shadow-tactile"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ANALYTICS'}
            onClick={() => setActiveTab('ANALYTICS')}
            className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'ANALYTICS'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span>Doanh thu & Top 10</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SETTINGS'}
            onClick={() => setActiveTab('SETTINGS')}
            className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'SETTINGS'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>Cấu hình VietQR</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'AUDIT'}
            onClick={() => setActiveTab('AUDIT')}
            className={`inline-flex min-h-[46px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === 'AUDIT'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            <span>Nhật ký Kiểm toán</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS & TOP 10 */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-5">
          {/* Date Presets & Custom Range */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'TODAY', label: 'Hôm nay' },
                  { id: '7D', label: '7 ngày qua' },
                  { id: '30D', label: '30 ngày qua' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyDatePreset(preset.id)}
                  className={`inline-flex min-h-[48px] items-center rounded-xl px-4 text-xs font-extrabold transition ${
                    activePreset === preset.id
                      ? 'bg-bistro text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setActivePreset('CUSTOM');
                  setFromDate(e.target.value);
                }}
                aria-label="Từ ngày"
                className="min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800"
              />
              <span className="text-sm font-bold text-stone-400">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setActivePreset('CUSTOM');
                  setToDate(e.target.value);
                }}
                aria-label="Đến ngày"
                className="min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800"
              />
              <button
                type="button"
                onClick={() => void loadRevenueReport(fromDate, toDate)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Làm mới</span>
              </button>
            </div>
          </section>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tổng doanh thu</span>
                <TrendingUp className="h-5 w-5 text-bistro" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
                {loadingReport ? '...' : formatVnd(report?.totalRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Kỳ: {fromDate} → {toDate}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Số hóa đơn đã thanh toán
                </span>
                <BarChart3 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
                {loadingReport ? '...' : `${report?.paidOrderCount ?? 0} đơn`}
              </p>
              <p className="mt-1 text-xs text-stone-500">Chỉ tính hóa đơn trạng thái PAID</p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Doanh thu VietQR</span>
                <CreditCard className="h-5 w-5 text-sky-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
                {loadingReport ? '...' : formatVnd(report?.vietqrRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs font-semibold text-sky-700 tabular-nums">
                Tỷ trọng: {vietqrPct}% tổng thu
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Doanh thu Tiền mặt
                </span>
                <Wallet className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
                {loadingReport ? '...' : formatVnd(report?.cashRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700 tabular-nums">
                Tỷ trọng: {cashPct}% tổng thu
              </p>
            </div>
          </div>

          {/* Visual Payment Split Bar */}
          {totalRev > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>Tỷ lệ phương thức thanh toán</span>
                <span className="tabular-nums">
                  VietQR {vietqrPct}% • Tiền mặt {cashPct}%
                </span>
              </div>
              <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  style={{ width: `${vietqrPct}%` }}
                  className="bg-sky-600 transition-all"
                  title={`VietQR: ${vietqrPct}%`}
                />
                <div
                  style={{ width: `${cashPct}%` }}
                  className="bg-amber-500 transition-all"
                  title={`Tiền mặt: ${cashPct}%`}
                />
              </div>
            </div>
          )}

          {/* Two-Column Analytics Grid: Daily Revenue Chart & Top 10 Dishes */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Daily Revenue Bar Chart */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile lg:col-span-7">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-base font-extrabold text-stone-900">
                  Biểu đồ Doanh thu theo ngày
                </h2>
                <span className="text-xs font-semibold text-stone-500">Đơn vị: VNĐ</span>
              </div>

              {!report || report.dailySeries.length === 0 ? (
                <div className="py-16 text-center text-sm text-stone-500">
                  Chưa có phát sinh doanh thu trong khoảng ngày đã chọn.
                </div>
              ) : (
                <div className="mt-5 flex h-64 items-end gap-2.5 overflow-x-auto pb-2 pt-6">
                  {report.dailySeries.map((point) => {
                    const heightPct = Math.max(
                      6,
                      Math.round((point.revenue / maxDailyRevenue) * 100)
                    );
                    const shortDate = point.date.slice(5);
                    return (
                      <div
                        key={point.date}
                        className="flex min-w-[56px] flex-1 flex-col items-center gap-1.5"
                      >
                        <span className="text-[10px] font-bold text-stone-700 tabular-nums">
                          {point.revenue > 0 ? formatVnd(point.revenue) : '0 ₫'}
                        </span>
                        <div className="flex h-44 w-full items-end justify-center rounded-xl bg-stone-100/80 p-1">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full rounded-lg bg-bistro transition-all hover:bg-bistro-hover"
                            title={`${point.date}: ${formatVnd(point.revenue)} (${point.orderCount} đơn)`}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-stone-800 tabular-nums">
                          {shortDate}
                        </span>
                        <span className="text-[10px] font-medium text-stone-500 tabular-nums">
                          {point.orderCount} đơn
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Top 10 Best-Selling Dishes */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile lg:col-span-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-bistro" aria-hidden="true" />
                  <h2 className="text-base font-extrabold text-stone-900">
                    Top 10 Món Bán Chạy Nhất
                  </h2>
                </div>
              </div>

              {!report || report.topItems.length === 0 ? (
                <div className="py-16 text-center text-sm text-stone-500">
                  Chưa có dữ liệu món bán chạy trong kỳ này.
                </div>
              ) : (
                <div className="mt-4 space-y-3.5">
                  {report.topItems.slice(0, 10).map((item, idx) => {
                    const widthPct = Math.max(
                      8,
                      Math.round((item.totalQuantity / maxTopItemQty) * 100)
                    );
                    return (
                      <div key={item.menuItemId} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[11px] font-extrabold text-white tabular-nums">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-stone-900">{item.menuItemName}</span>
                            <span className="ml-1.5 text-xs text-stone-500">
                              ({item.categoryName})
                            </span>
                          </div>
                          <div className="shrink-0 text-right tabular-nums">
                            <span className="font-extrabold text-bistro">
                              {item.totalQuantity} phần
                            </span>
                            <span className="ml-2 text-xs font-bold text-stone-700">
                              {formatVnd(item.totalRevenue)}
                            </span>
                          </div>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="h-full rounded-full bg-bistro"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: VIETQR & SYSTEM SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-tactile">
          <div className="flex items-start gap-3 border-b border-stone-200 pb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-bistro">
              <QrCode className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">
                Cấu hình Nhà hàng & Tài khoản VietQR Động (EMVCo NAPAS 247)
              </h2>
              <p className="mt-0.5 text-xs text-stone-600">
                Thông tin dưới đây được dùng trực tiếp để sinh chuỗi EMVCo TLV và tính mã kiểm tra CRC16-CCITT cho mọi hóa đơn QR động.
              </p>
            </div>
          </div>

          {settingsError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900"
            >
              {settingsError}
            </div>
          )}

          {loadingSettings ? (
            <p className="py-10 text-center text-sm text-stone-500">
              Đang tải cấu hình hệ thống...
            </p>
          ) : (
            <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-stone-700">
                Tên nhà hàng hiển thị trên Hóa đơn *
                <input
                  type="text"
                  required
                  aria-label="Tên nhà hàng"
                  value={settingsForm.restaurantName}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, restaurantName: e.target.value }))
                  }
                  className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-stone-700">
                  Mã BIN Ngân hàng (6 chữ số) *
                  <input
                    type="text"
                    required
                    maxLength={6}
                    aria-label="Mã BIN Ngân hàng"
                    value={settingsForm.vietqrBankBin}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, vietqrBankBin: e.target.value }))
                    }
                    placeholder="Ví dụ: 970415 (VietinBank), 970436 (VCB)"
                    className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 font-mono text-sm font-bold text-stone-900 focus:border-bistro focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-bold text-stone-700">
                  Số tài khoản thụ hưởng *
                  <input
                    type="text"
                    required
                    aria-label="Số tài khoản thụ hưởng"
                    value={settingsForm.vietqrAccountNumber}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, vietqrAccountNumber: e.target.value }))
                    }
                    placeholder="Ví dụ: 113366668888"
                    className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 font-mono text-sm font-bold text-stone-900 focus:border-bistro focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-stone-700">
                Tên chủ tài khoản thụ hưởng (In hoa không dấu) *
                <input
                  type="text"
                  required
                  aria-label="Tên chủ tài khoản"
                  value={settingsForm.vietqrAccountName}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, vietqrAccountName: e.target.value }))
                  }
                  placeholder="Ví dụ: NHA HANG DEMO IT3180"
                  className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 font-mono text-sm font-bold uppercase text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-xl bg-bistro px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-bistro-hover disabled:opacity-50"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>{savingSettings ? 'Đang lưu...' : 'Lưu cấu hình VietQR'}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile sm:grid-cols-12">
            <div className="relative sm:col-span-7">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                aria-label="Tìm kiếm nhật ký kiểm toán"
                placeholder="Tìm theo người thực hiện, mã đơn, lý do hủy món..."
                className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/50 pl-10 pr-4 text-sm text-stone-900 focus:border-bistro focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                aria-label="Lọc loại hành động kiểm toán"
                className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 focus:border-bistro focus:outline-none"
              >
                <option value="ALL">Mọi hành động</option>
                {distinctAuditActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => void loadAuditLogs()}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Tải lại</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-4 py-3.5">Thời điểm</th>
                    <th className="px-4 py-3.5">Nhân sự thực hiện</th>
                    <th className="px-4 py-3.5">Mã hành động</th>
                    <th className="px-4 py-3.5">Đối tượng</th>
                    <th className="px-4 py-3.5">Chi tiết lưu vết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                        Đang tải nhật ký kiểm toán...
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                        Không có bản ghi kiểm toán nào khớp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/70">
                        <td className="px-4 py-3.5 text-xs text-stone-600 tabular-nums whitespace-nowrap">
                          {formatDateTimeVi(log.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-stone-900">{log.actorFullName}</div>
                          <div className="font-mono text-xs text-stone-500">
                            @{log.actorUsername}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md border border-stone-300 bg-stone-100 px-2 py-0.5 font-mono text-xs font-bold text-stone-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-stone-700">
                          {log.targetType}
                          {log.targetId ? ` #${log.targetId}` : ''}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-700">
                          {log.detail ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
