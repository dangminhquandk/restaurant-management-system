import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Eye, Printer, RefreshCw, X } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { OrderItemStatusBadge, OrderStatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../store/ToastContext';
import type { OrderDto, OrderStatus, OrderSummaryDto, PaymentMethod } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatDateTimeVi, formatVnd } from '../../utils/format';
import { PrintableReceipt } from './PrintableReceipt';

function formatIsoDateOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function OrderHistoryPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [fromDate, setFromDate] = useState(() => formatIsoDateOffset(-7));
  const [toDate, setToDate] = useState(() => formatIsoDateOffset(0));
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      showToast({
        title: 'Khoảng ngày không hợp lệ',
        message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
        variant: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const list = await orderApi.listOrders({
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setOrders(list);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải danh sách lịch sử hóa đơn.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter, methodFilter, showToast]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleOpenOrderDetail = async (orderId: number) => {
    setDetailLoadingId(orderId);
    try {
      const detail = await orderApi.getOrder(orderId);
      setSelectedOrder(detail);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải chi tiết hóa đơn.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <>
      <div className="no-print space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              Lịch sử Đơn hàng & Hóa đơn
            </h1>
            <p className="mt-0.5 text-sm text-stone-600">
              Đối soát hóa đơn theo ngày, phương thức thanh toán (Tiền mặt / VietQR) và in lại phiếu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 shadow-tactile hover:bg-stone-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Tải lại danh sách</span>
          </button>
        </div>

        {/* Filter Bar */}
        <section
          aria-label="Bộ lọc lịch sử hóa đơn"
          className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block text-xs font-bold text-stone-600">
            Từ ngày
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
            />
          </label>

          <label className="block text-xs font-bold text-stone-600">
            Đến ngày
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
            />
          </label>

          <label className="block text-xs font-bold text-stone-600">
            Trạng thái đơn
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              aria-label="Lọc trạng thái đơn"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="OPEN">Đang mở (OPEN)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </label>

          <label className="block text-xs font-bold text-stone-600">
            Phương thức thanh toán
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')}
              aria-label="Lọc phương thức thanh toán"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
            >
              <option value="">Mọi phương thức</option>
              <option value="VIETQR">VietQR NAPAS 247</option>
              <option value="CASH">Tiền mặt (CASH)</option>
            </select>
          </label>
        </section>

        {/* Invoices Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3.5">Mã hóa đơn</th>
                  <th className="px-4 py-3.5">Bàn</th>
                  <th className="px-4 py-3.5">Phục vụ</th>
                  <th className="px-4 py-3.5">Giờ mở / đóng</th>
                  <th className="px-4 py-3.5">Phương thức TT</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Tổng tiền</th>
                  <th className="px-4 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-stone-500">
                      Đang tải lịch sử hóa đơn...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-stone-500">
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
                        <div>Mở: {formatDateTimeVi(ord.createdAt)}</div>
                        {ord.closedAt && (
                          <div className="text-stone-500">
                            Đóng: {formatDateTimeVi(ord.closedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-stone-700">
                        {ord.paymentMethod === 'VIETQR'
                          ? 'VietQR'
                          : ord.paymentMethod === 'CASH'
                            ? 'Tiền mặt'
                            : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={ord.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-stone-900 tabular-nums">
                        {formatVnd(ord.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={detailLoadingId === ord.id}
                          onClick={() => void handleOpenOrderDetail(ord.id)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-800 hover:bg-stone-50"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{detailLoadingId === ord.id ? '...' : 'Xem / In'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Detail & Re-Print Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-modal-title"
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                <div>
                  <h2 id="order-detail-modal-title" className="text-lg font-extrabold text-stone-900">
                    Chi tiết Hóa đơn {selectedOrder.orderCode}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Bàn {selectedOrder.tableName} ({selectedOrder.areaName}) • Phục vụ:{' '}
                    {selectedOrder.staffName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Đóng chi tiết hóa đơn"
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-bold text-stone-900 tabular-nums">
                        {item.quantity}× {item.menuItemName}
                      </span>
                      {item.note && (
                        <p className="text-xs text-amber-800">Ghi chú: {item.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderItemStatusBadge status={item.status} />
                      <span className="font-bold text-stone-900 tabular-nums">
                        {formatVnd(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm space-y-1">
                <div className="flex justify-between font-extrabold text-stone-900">
                  <span>Tổng thanh toán:</span>
                  <span className="tabular-nums">{formatVnd(selectedOrder.totalAmount)}</span>
                </div>
                {selectedOrder.payment && (
                  <>
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Phương thức:</span>
                      <span className="font-bold">{selectedOrder.payment.method}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Khách đưa / Tiền thừa:</span>
                      <span className="tabular-nums">
                        {formatVnd(selectedOrder.payment.amountReceived)} /{' '}
                        {formatVnd(selectedOrder.payment.changeAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Thu ngân:</span>
                      <span>{selectedOrder.payment.cashierName}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>In lại hóa đơn</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && <PrintableReceipt order={selectedOrder} />}
    </>
  );
}
