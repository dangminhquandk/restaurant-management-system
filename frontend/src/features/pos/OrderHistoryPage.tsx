import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../store/ToastContext';
import type { OrderStatus, OrderSummaryDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatDateTimeVi, formatVnd } from '../../utils/format';

export function OrderHistoryPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await orderApi.listOrders({
        status: statusFilter || undefined,
      });
      setOrders(list);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải danh sách lịch sử hóa đơn.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Lịch sử Đơn hàng & Hóa đơn
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Tra cứu các hóa đơn đã mở, đã thanh toán và đối soát ca thu ngân.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            aria-label="Lọc trạng thái đơn"
            className="min-h-[48px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 focus:border-bistro focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở (OPEN)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50"
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
                <th className="px-4 py-3.5">Mã hóa đơn</th>
                <th className="px-4 py-3.5">Bàn</th>
                <th className="px-4 py-3.5">Phục vụ</th>
                <th className="px-4 py-3.5">Giờ mở</th>
                <th className="px-4 py-3.5">Phương thức TT</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                    Đang tải lịch sử hóa đơn...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                    <ClipboardList className="mx-auto mb-2 h-7 w-7 text-stone-400" />
                    Chưa có hóa đơn nào khớp điều kiện tra cứu.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-stone-900">
                      {ord.orderCode}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-stone-800">{ord.tableName}</td>
                    <td className="px-4 py-3.5 text-stone-700">{ord.staffName}</td>
                    <td className="px-4 py-3.5 text-xs text-stone-600 tabular-nums">
                      {formatDateTimeVi(ord.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-stone-700">
                      {ord.paymentMethod ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-stone-900 tabular-nums">
                      {formatVnd(ord.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
