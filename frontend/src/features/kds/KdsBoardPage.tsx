import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  PackageX,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { kdsApi } from '../../api/kdsApi';
import { menuApi } from '../../api/menuApi';
import { orderApi } from '../../api/orderApi';
import { useSoundAlert } from '../../hooks/useSoundAlert';
import { useStompSubscription } from '../../store/RealtimeContext';
import { useToast } from '../../store/ToastContext';
import type {
  KdsItemDto,
  KdsOrderStompEvent,
  MenuAvailabilityStompEvent,
  MenuItemDto,
  OrderItemStatus,
} from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatElapsedSince, formatVnd, matchesViSearch } from '../../utils/format';

type QueueFilter = 'ALL' | 'PENDING' | 'COOKING' | 'READY';

function getSlaBadgeStyle(createdAt: string, nowMs: number): {
  badgeClass: string;
  labelSuffix: string;
} {
  const createdMs = new Date(createdAt).getTime();
  const elapsedMinutes = Number.isNaN(createdMs)
    ? 0
    : Math.max(0, (nowMs - createdMs) / 60000);

  if (elapsedMinutes >= 10) {
    return {
      badgeClass: 'border-rose-500 bg-rose-500/25 text-rose-200 animate-pulse',
      labelSuffix: ' • Quá SLA',
    };
  }
  if (elapsedMinutes >= 5) {
    return {
      badgeClass: 'border-amber-400/70 bg-amber-500/20 text-amber-300',
      labelSuffix: '',
    };
  }
  return {
    badgeClass: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
    labelSuffix: '',
  };
}

export function KdsBoardPage() {
  const { showToast } = useToast();
  const { soundEnabled, toggleSound, playChime } = useSoundAlert();

  const [items, setItems] = useState<KdsItemDto[]>([]);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());

  // Cancel item dialog state
  const [cancellingItem, setCancellingItem] = useState<KdsItemDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Quick Out-of-Stock Drawer state (FR-15)
  const [outOfStockDrawerOpen, setOutOfStockDrawerOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);
  const [togglingMenuId, setTogglingMenuId] = useState<number | null>(null);

  const sortFifo = useCallback((list: KdsItemDto[]): KdsItemDto[] => {
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, []);

  const loadQueue = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await kdsApi.listItems();
        setItems(sortFifo(data));
      } catch (error) {
        if (!silent) {
          const parsed = parseApiError(error, 'Không thể tải hàng đợi chế biến KDS.');
          showToast({ title: 'Lỗi tải KDS', message: parsed.message, variant: 'error' });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast, sortFifo]
  );

  useEffect(() => {
    void loadQueue(false);
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [loadQueue]);

  const markTicketHighlighted = useCallback((ids: number[]) => {
    if (ids.length === 0) return;
    setHighlightedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, 4000);
  }, []);

  // Subscribe live to /topic/kds/orders + auto-resync on STOMP reconnect
  useStompSubscription<KdsOrderStompEvent>(
    '/topic/kds/orders',
    (event) => {
      if (event?.eventType === 'ORDER_ITEMS_ADDED') {
        playChime();
        const addedIds = event.items?.map((i) => i.id) ?? [];
        markTicketHighlighted(addedIds);
        showToast({
          title: `Đơn mới — Bàn ${event.tableName}`,
          message: `Mã đơn ${event.orderCode} vừa gửi món xuống bếp.`,
          variant: 'info',
        });
      }
      void loadQueue(true);
    },
    () => {
      void loadQueue(true);
    }
  );

  // Sync out-of-stock drawer live when /topic/menu/availability fires
  useStompSubscription<MenuAvailabilityStompEvent>('/topic/menu/availability', (event) => {
    if (!event?.menuItemId) return;
    setMenuItems((prev) =>
      prev.map((m) =>
        m.id === event.menuItemId ? { ...m, isAvailable: event.isAvailable } : m
      )
    );
  });

  const openOutOfStockDrawer = async () => {
    setOutOfStockDrawerOpen(true);
    setMenuLoading(true);
    try {
      const list = await menuApi.listMenuItems();
      setMenuItems(list);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải danh mục món ăn.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setMenuLoading(false);
    }
  };

  const handleToggleAvailability = async (dish: MenuItemDto) => {
    setTogglingMenuId(dish.id);
    try {
      const updated = await menuApi.toggleAvailability(dish.id, {
        isAvailable: !dish.isAvailable,
      });
      setMenuItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast({
        title: updated.isAvailable ? 'Đã mở bán lại trên POS' : 'Đã khóa món tức thì trên POS',
        message: `${updated.name}: ${updated.isAvailable ? 'Còn món' : 'Tạm hết'}`,
        variant: updated.isAvailable ? 'success' : 'warning',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể đổi trạng thái phục vụ.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setTogglingMenuId(null);
    }
  };

  const handleAdvanceStatus = async (
    item: KdsItemDto,
    target: 'COOKING' | 'READY' | 'SERVED'
  ) => {
    setBusyId(item.id);
    try {
      const updated = await kdsApi.updateItemStatus(item.id, { status: target });
      setItems((prev) => {
        if (target === 'SERVED') {
          return prev.filter((it) => it.id !== item.id);
        }
        return prev.map((it) => (it.id === item.id ? { ...it, ...updated, status: target } : it));
      });
      showToast({
        message:
          target === 'COOKING'
            ? `Bắt đầu nấu: ${item.quantity}x ${item.menuItemName} (Bàn ${item.tableName})`
            : target === 'READY'
              ? `Hoàn tất món: ${item.quantity}x ${item.menuItemName} — Đã báo phục vụ!`
              : `Đã lên món cho Bàn ${item.tableName}`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể cập nhật trạng thái món.');
      showToast({ message: parsed.message, variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmCancelTicket = async () => {
    if (!cancellingItem) return;
    if (cancellingItem.status === 'COOKING' && !cancelReason.trim()) {
      showToast({
        message: 'Vui lòng nhập lý do hủy đối với món đang chế biến.',
        variant: 'warning',
      });
      return;
    }
    setCancelLoading(true);
    try {
      await orderApi.cancelItem(cancellingItem.orderId, cancellingItem.id, {
        reason: cancelReason.trim() || 'Bếp báo hủy món',
      });
      setItems((prev) => prev.filter((it) => it.id !== cancellingItem.id));
      showToast({
        message: `Đã hủy món ${cancellingItem.menuItemName} (Bàn ${cancellingItem.tableName}).`,
        variant: 'info',
      });
      setCancellingItem(null);
      setCancelReason('');
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể hủy món từ KDS.');
      showToast({ title: 'Không thể hủy món', message: parsed.message, variant: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  const counts = useMemo(() => {
    const map: Record<OrderItemStatus, number> = {
      PENDING: 0,
      COOKING: 0,
      READY: 0,
      SERVED: 0,
      CANCELLED: 0,
    };
    for (const item of items) {
      map[item.status] += 1;
    }
    return map;
  }, [items]);

  const visibleItems = useMemo(() => {
    const active = items.filter(
      (i) => i.status === 'PENDING' || i.status === 'COOKING' || i.status === 'READY'
    );
    if (queueFilter === 'ALL') return active;
    return active.filter((i) => i.status === queueFilter);
  }, [items, queueFilter]);

  const filteredDrawerMenu = useMemo(
    () =>
      menuItems.filter(
        (m) => matchesViSearch(m.name, menuSearch) || matchesViSearch(m.categoryName, menuSearch)
      ),
    [menuItems, menuSearch]
  );

  return (
    <div className="space-y-5 text-slate-100">
      {/* KDS Top Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-kds-card p-4 shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            KDS Bếp Trung Tâm — Hàng Đợi FIFO
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-bold sm:text-sm">
            <span className="text-slate-300">
              Chờ nấu:{' '}
              <strong className="text-amber-400 tabular-nums">{counts.PENDING}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Đang nấu:{' '}
              <strong className="text-orange-400 tabular-nums">{counts.COOKING}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Chờ bưng:{' '}
              <strong className="text-emerald-400 tabular-nums">{counts.READY}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
              soundEnabled
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? (
              <Bell className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <BellOff className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Chuông: {soundEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={() => void openOutOfStockDrawer()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-500/60 bg-amber-500/15 px-4 text-sm font-extrabold text-amber-300 transition hover:bg-amber-500/25"
          >
            <PackageX className="h-4 w-4" aria-hidden="true" />
            <span>Báo Hết Món</span>
          </button>

          <button
            type="button"
            onClick={() => void loadQueue(false)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-bold text-slate-100 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Queue Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Lọc trạng thái bếp">
        {(
          [
            { key: 'ALL', label: `Tất cả (${counts.PENDING + counts.COOKING + counts.READY})` },
            { key: 'PENDING', label: `Chờ nấu (${counts.PENDING})` },
            { key: 'COOKING', label: `Đang nấu (${counts.COOKING})` },
            { key: 'READY', label: `Sẵn sàng ra món (${counts.READY})` },
          ] as const
        ).map((tab) => {
          const selected = queueFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setQueueFilter(tab.key)}
              className={`inline-flex min-h-[48px] items-center rounded-xl px-4 text-sm font-extrabold transition ${
                selected
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'border border-slate-800 bg-slate-900/90 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ticket Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-kds-card"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-kds-card/70 p-14 text-center">
          <p className="text-lg font-extrabold text-white">
            Không có thẻ món nào trong bộ lọc hiện tại
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Đơn gọi món mới từ POS sẽ tự động đổ về đây trong &lt; 1 giây kèm chuông báo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => {
            const isHighlighted = highlightedIds.has(item.id);
            const sla = getSlaBadgeStyle(item.createdAt, nowMs);

            const borderStyle = isHighlighted
              ? 'border-emerald-400 ring-2 ring-amber-400 animate-pulse'
              : item.status === 'READY'
                ? 'border-emerald-500/80'
                : item.status === 'COOKING'
                  ? 'border-amber-500/80'
                  : 'border-slate-700';

            return (
              <article
                key={item.id}
                aria-label={`Thẻ bếp Bàn ${item.tableName} - ${item.menuItemName}`}
                className={`flex flex-col justify-between rounded-2xl border bg-kds-card p-5 shadow-lg transition ${borderStyle}`}
              >
                <div>
                  {/* Ticket Header: Table, Area, Batch & Live 1s SLA Timer */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-extrabold text-white">
                          BÀN {item.tableName}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                          Lượt #{item.batchNo}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {item.areaName} • Đơn: {item.orderCode}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold tabular-nums ${sla.badgeClass}`}
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {formatElapsedSince(item.createdAt, nowMs)}
                        {sla.labelSuffix}
                      </span>
                    </span>
                  </div>

                  {/* Dish Title (>= 20px Bold High-Contrast) */}
                  <p className="mt-4 text-xl font-extrabold leading-snug text-white tabular-nums">
                    {item.quantity}× {item.menuItemName}
                  </p>

                  {/* Prominent Amber Spice / Allergy Note Callout */}
                  {item.note && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-400/80 bg-amber-500/15 px-3.5 py-2.5 text-sm font-extrabold text-amber-300">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                        aria-hidden="true"
                      />
                      <span>Ghi chú: {item.note}</span>
                    </div>
                  )}
                </div>

                {/* 1-Tap Progression & Cancel Controls (Fitts's Law >= 48px) */}
                <div className="mt-5 flex items-center gap-2 border-t border-slate-800 pt-3.5">
                  {item.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleAdvanceStatus(item, 'COOKING')}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      <span>Bắt đầu nấu</span>
                    </button>
                  )}

                  {item.status === 'COOKING' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleAdvanceStatus(item, 'READY')}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Hoàn tất (Báo phục vụ)</span>
                    </button>
                  )}

                  {item.status === 'READY' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleAdvanceStatus(item, 'SERVED')}
                      className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Đã phục vụ</span>
                    </button>
                  )}

                  {(item.status === 'PENDING' || item.status === 'COOKING') && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => {
                        setCancellingItem(item);
                        setCancelReason('');
                      }}
                      aria-label={`Hủy món ${item.menuItemName}`}
                      className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 text-xs font-bold text-rose-300 transition hover:bg-rose-900/70 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick Out-of-Stock Slide-over Drawer (FR-15) */}
      {outOfStockDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kds-oos-drawer-title"
        >
          <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-900 p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 id="kds-oos-drawer-title" className="text-lg font-extrabold text-white">
                  Báo Hết Món Khẩn Cấp (Khóa POS &lt; 1s)
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Chạm để khóa hoặc mở bán lại món ăn trên toàn bộ máy tính bảng phục vụ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOutOfStockDrawerOpen(false)}
                aria-label="Đóng bảng báo hết món"
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                aria-label="Tìm nhanh món cần báo hết"
                placeholder="Gõ tên món không dấu: pho bo, bun cha..."
                className="block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 text-sm font-medium text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {menuLoading ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Đang tải danh sách thực đơn...
                </p>
              ) : filteredDrawerMenu.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Không tìm thấy món phù hợp.
                </p>
              ) : (
                filteredDrawerMenu.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/70 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">{dish.name}</p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        {dish.categoryName} • {formatVnd(dish.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={togglingMenuId === dish.id}
                      onClick={() => void handleToggleAvailability(dish)}
                      aria-label={`Đổi trạng thái ${dish.name}`}
                      className={`inline-flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-extrabold transition disabled:opacity-50 ${
                        dish.isAvailable
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'border-rose-500/60 bg-rose-500/25 text-rose-200 hover:bg-rose-500/35'
                      }`}
                    >
                      {dish.isAvailable ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>Còn món</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Tạm hết</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dark KDS Cancel Ticket Dialog */}
      {cancellingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kds-cancel-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <h2 id="kds-cancel-title" className="text-lg font-extrabold text-white">
              Hủy món &ldquo;{cancellingItem.menuItemName}&rdquo; (Bàn {cancellingItem.tableName})?
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Nhập lý do hủy món để thông báo cho nhân viên phục vụ và ghi nhận nhật ký kiểm toán.
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ví dụ: Hết nguyên liệu đột xuất, khách báo hủy..."
              className="mt-4 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                className="inline-flex min-h-[48px] items-center rounded-xl border border-slate-700 px-4 text-sm font-bold text-slate-300 hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => void handleConfirmCancelTicket()}
                className="inline-flex min-h-[48px] items-center rounded-xl bg-rose-600 px-5 text-sm font-extrabold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy món'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
