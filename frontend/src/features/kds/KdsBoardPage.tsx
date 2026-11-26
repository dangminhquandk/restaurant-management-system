import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Flame, RefreshCw } from 'lucide-react';
import { kdsApi } from '../../api/kdsApi';
import { useToast } from '../../store/ToastContext';
import type { KdsItemDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatElapsedSince } from '../../utils/format';

export function KdsBoardPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<KdsItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kdsApi.listItems();
      setItems(data);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải hàng đợi chế biến KDS.');
      showToast({ title: 'Lỗi tải KDS', message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadQueue();
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [loadQueue]);

  const handleAdvanceStatus = async (item: KdsItemDto, target: 'COOKING' | 'READY') => {
    setBusyId(item.id);
    try {
      const updated = await kdsApi.updateItemStatus(item.id, { status: target });
      setItems((prev) =>
        target === 'READY'
          ? prev.filter((it) => it.id !== updated.id)
          : prev.map((it) => (it.id === updated.id ? updated : it))
      );
      showToast({
        message:
          target === 'COOKING'
            ? `Bắt đầu nấu: ${item.quantity}x ${item.menuItemName} (${item.tableName})`
            : `Đã nấu xong: ${item.quantity}x ${item.menuItemName} (${item.tableName})`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể cập nhật trạng thái món.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const cookingCount = items.filter((i) => i.status === 'COOKING').length;

  return (
    <div className="space-y-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-kds-card p-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Màn hình Điều phối Bếp trung tâm (KDS)
          </h1>
          <p className="mt-0.5 text-sm text-slate-300">
            Hàng đợi FIFO chống lóa • Đang chờ:{' '}
            <strong className="text-amber-400 tabular-nums">{pendingCount}</strong> • Đang nấu:{' '}
            <strong className="text-emerald-400 tabular-nums">{cookingCount}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQueue()}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-bold text-slate-100 hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Làm mới hàng đợi</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-kds-card"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-kds-card/70 p-14 text-center">
          <p className="text-lg font-extrabold text-white">
            Hiện không có món nào đang chờ trong hàng đợi bếp
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Các lượt gọi món từ máy tính bảng POS sẽ hiển thị tại đây theo thứ tự FIFO.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const isCooking = item.status === 'COOKING';
            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-lg ${
                  isCooking
                    ? 'border-amber-500/70 bg-kds-card'
                    : 'border-slate-700 bg-kds-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-lg font-extrabold text-white">
                        Bàn {item.tableName}
                      </span>
                      <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                        Lượt #{item.batchNo}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-amber-400 tabular-nums">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatElapsedSince(item.createdAt, nowMs)}
                    </span>
                  </div>

                  <p className="mt-3 text-xl font-extrabold text-white tabular-nums">
                    {item.quantity}× {item.menuItemName}
                  </p>

                  {item.note && (
                    <div className="mt-3 rounded-xl border border-amber-500/60 bg-amber-500/15 px-3.5 py-2 text-sm font-bold text-amber-300">
                      Lưu ý khẩu vị: {item.note}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleAdvanceStatus(item, 'COOKING')}
                      className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      <span>Bắt đầu nấu</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleAdvanceStatus(item, 'READY')}
                      className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Hoàn tất (Báo phục vụ)</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
