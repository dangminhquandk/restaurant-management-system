import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CreditCard, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../store/ToastContext';
import type { RevenueReportDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd } from '../../utils/format';

function getTodayDateString(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AdminDashboardPage() {
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState(() => getTodayDateString(-7));
  const [toDate, setToDate] = useState(() => getTodayDateString(0));
  const [report, setReport] = useState<RevenueReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRevenueReport(fromDate, toDate);
      setReport(data);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải báo cáo doanh thu.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Báo cáo Doanh thu & Vận hành
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Tổng hợp doanh thu thực thu từ các hóa đơn đã thanh toán theo khoảng ngày.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="Từ ngày"
            className="min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800"
          />
          <span className="text-sm font-bold text-stone-500">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="Đến ngày"
            className="min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800"
          />
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white hover:bg-bistro-hover"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Thống kê</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng doanh thu</span>
            <TrendingUp className="h-5 w-5 text-bistro" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
            {loading ? '...' : formatVnd(report?.totalRevenue ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Số đơn hoàn tất</span>
            <BarChart3 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
            {loading ? '...' : `${report?.paidOrderCount ?? 0} đơn`}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tiền mặt (CASH)</span>
            <Wallet className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
            {loading ? '...' : formatVnd(report?.cashRevenue ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-tactile">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chuyển khoản VietQR</span>
            <CreditCard className="h-5 w-5 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-900 tabular-nums">
            {loading ? '...' : formatVnd(report?.vietqrRevenue ?? 0)}
          </p>
        </div>
      </div>

      {/* Top Items Table */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-base font-extrabold text-stone-900">
            Món bán chạy nhất trong kỳ
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-3">Món ăn</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-right">Số lượng bán</th>
                <th className="px-4 py-3 text-right">Doanh thu đóng góp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {!report || report.topItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                    Chưa có dữ liệu món bán chạy trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                report.topItems.map((item) => (
                  <tr key={item.menuItemId}>
                    <td className="px-4 py-3 font-bold text-stone-900">{item.menuItemName}</td>
                    <td className="px-4 py-3 text-stone-600">{item.categoryName}</td>
                    <td className="px-4 py-3 text-right font-bold text-stone-800 tabular-nums">
                      {item.totalQuantity} phần
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-stone-900 tabular-nums">
                      {formatVnd(item.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
