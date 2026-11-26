import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { floorApi } from '../../api/floorApi';
import { TableStatusBadge } from '../../components/StatusBadge';
import { useStompSubscription } from '../../store/RealtimeContext';
import { useToast } from '../../store/ToastContext';
import type { AreaDto, DiningTableDto, TableStatus, TableStompEvent } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd } from '../../utils/format';

const STATUS_SUMMARY_PILLS: {
  status: TableStatus;
  label: string;
  pillClass: string;
  activeRingClass: string;
  dotClass: string;
}[] = [
  {
    status: 'AVAILABLE',
    label: 'Bàn trống',
    pillClass: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    activeRingClass: 'ring-2 ring-emerald-600',
    dotClass: 'bg-emerald-600',
  },
  {
    status: 'OCCUPIED',
    label: 'Đang phục vụ',
    pillClass: 'border-rose-200 bg-rose-50/90 text-rose-900',
    activeRingClass: 'ring-2 ring-rose-600',
    dotClass: 'bg-rose-600',
  },
  {
    status: 'WAITING_PAYMENT',
    label: 'Chờ thanh toán',
    pillClass: 'border-amber-300 bg-amber-50/90 text-amber-950',
    activeRingClass: 'ring-2 ring-amber-600',
    dotClass: 'bg-amber-600',
  },
  {
    status: 'CLEANING',
    label: 'Chờ dọn',
    pillClass: 'border-sky-200 bg-sky-50/90 text-sky-900',
    activeRingClass: 'ring-2 ring-sky-600',
    dotClass: 'bg-sky-600',
  },
];

const CARD_ACCENT_CLASS: Record<TableStatus, string> = {
  AVAILABLE: 'border-l-4 border-l-emerald-600 border-stone-200 hover:border-emerald-300',
  OCCUPIED: 'border-l-4 border-l-rose-600 border-rose-200/80 hover:border-rose-300',
  WAITING_PAYMENT: 'border-l-4 border-l-amber-500 border-amber-200 hover:border-amber-400',
  CLEANING: 'border-l-4 border-l-sky-600 border-sky-200/80 hover:border-sky-300',
};

export function FloorMapPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTableId, setBusyTableId] = useState<number | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadTablesOnly = useCallback(async () => {
    const freshTables = await floorApi.listTables();
    setTables(freshTables);
  }, []);

  const loadFloorData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [areaList, tableList] = await Promise.all([
        floorApi.listAreas(),
        floorApi.listTables(),
      ]);
      const sortedAreas = [...areaList].sort((a, b) => a.displayOrder - b.displayOrder);
      setAreas(sortedAreas);
      setTables(tableList);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải sơ đồ bàn từ máy chủ.');
      setLoadError(parsed.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFloorData(false);
  }, [loadFloorData]);

  // Live STOMP Floor Map sync + automatic snapshot refresh on reconnect (NFR-01, NFR-04)
  useStompSubscription<TableStompEvent>(
    '/topic/tables',
    () => {
      void reloadTablesOnly().catch(() => undefined);
    },
    () => {
      void loadFloorData(true);
    }
  );

  const areaScopedTables = useMemo(() => {
    if (selectedAreaId === 'ALL') return tables;
    return tables.filter((table) => table.areaId === selectedAreaId);
  }, [tables, selectedAreaId]);

  const statusCounts = useMemo(() => {
    const counts: Record<TableStatus, number> = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      WAITING_PAYMENT: 0,
      CLEANING: 0,
    };
    for (const table of areaScopedTables) {
      counts[table.status] += 1;
    }
    return counts;
  }, [areaScopedTables]);

  const filteredTables = useMemo(() => {
    if (selectedStatus === 'ALL') return areaScopedTables;
    return areaScopedTables.filter((table) => table.status === selectedStatus);
  }, [areaScopedTables, selectedStatus]);

  const handleOpenTable = async (table: DiningTableDto) => {
    setConflictBanner(null);
    setBusyTableId(table.id);
    try {
      const response = await floorApi.openTable(table.id, {
        expectedVersion: table.version,
      });
      navigate(`/pos/orders/${table.id}`, {
        state: { prefetchedOrder: response.order },
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Bàn vừa được nhân viên khác mở');
      if (parsed.status === 409) {
        const conflictMsg = parsed.message || 'Bàn vừa được nhân viên khác mở';
        setConflictBanner(conflictMsg);
        showToast({
          title: 'Xung đột mở bàn (409 Conflict)',
          message: conflictMsg,
          variant: 'warning',
        });
        try {
          await reloadTablesOnly();
        } catch {
          // Keep conflict banner visible even if background refresh fails
        }
      } else {
        showToast({
          title: 'Không thể mở bàn',
          message: parsed.message,
          variant: 'error',
        });
      }
    } finally {
      setBusyTableId(null);
    }
  };

  const handleCleanTable = async (table: DiningTableDto) => {
    setBusyTableId(table.id);
    try {
      const updated = await floorApi.cleanTable(table.id);
      setTables((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast({
        message: `Đã xác nhận dọn sạch bàn ${table.name}.`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể cập nhật trạng thái dọn bàn.');
      showToast({
        title: 'Lỗi cập nhật bàn',
        message: parsed.message,
        variant: 'error',
      });
      await reloadTablesOnly();
    } finally {
      setBusyTableId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Sơ đồ bàn phục vụ
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Chạm mở bàn để tạo đơn mới hoặc chọn bàn đang phục vụ để gọi thêm món.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFloorData(true)}
          disabled={refreshing || loading}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 shadow-tactile transition hover:bg-stone-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin text-bistro' : 'text-stone-600'}`}
            aria-hidden="true"
          />
          <span>Làm mới sơ đồ</span>
        </button>
      </div>

      {/* 409 Optimistic Lock Conflict Banner */}
      {conflictBanner && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-l-4 border-amber-300 border-l-amber-600 bg-amber-50 p-4 text-amber-950 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-extrabold">Đồng bộ xung đột mở bàn (HTTP 409)</p>
              <p className="mt-0.5 text-sm font-medium">{conflictBanner}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConflictBanner(null)}
            aria-label="Đóng cảnh báo xung đột"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-amber-800 hover:bg-amber-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900"
        >
          {loadError}
        </div>
      )}

      {/* Area Tabs & Live Status Count Summary Pills */}
      <section
        aria-label="Bộ lọc khu vực và trạng thái bàn"
        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile space-y-4"
      >
        {/* Area Tabs */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Khu vực phục vụ">
          <button
            type="button"
            role="tab"
            aria-selected={selectedAreaId === 'ALL'}
            onClick={() => setSelectedAreaId('ALL')}
            className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              selectedAreaId === 'ALL'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                selectedAreaId === 'ALL' ? 'bg-stone-700 text-stone-100' : 'bg-white text-stone-700'
              }`}
            >
              {tables.length}
            </span>
          </button>

          {areas.map((area) => {
            const countInArea = tables.filter((t) => t.areaId === area.id).length;
            const isSelected = selectedAreaId === area.id;
            return (
              <button
                key={area.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedAreaId(area.id)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{area.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                    isSelected ? 'bg-stone-700 text-stone-100' : 'bg-white text-stone-700'
                  }`}
                >
                  {countInArea}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Summary Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-stone-100">
          {STATUS_SUMMARY_PILLS.map((pill) => {
            const isSelected = selectedStatus === pill.status;
            const count = statusCounts[pill.status];
            return (
              <button
                key={pill.status}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedStatus((prev) => (prev === pill.status ? 'ALL' : pill.status))
                }
                className={`inline-flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                  pill.pillClass
                } ${isSelected ? pill.activeRingClass : 'opacity-95 hover:opacity-100'}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${pill.dotClass}`} aria-hidden="true" />
                <span>{pill.label}:</span>
                <span className="tabular-nums font-extrabold">{count}</span>
              </button>
            );
          })}

          {selectedStatus !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-xs font-bold text-stone-600 underline hover:text-stone-900"
            >
              Bỏ lọc trạng thái
            </button>
          )}
        </div>
      </section>

      {/* Table Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="min-h-[168px] animate-pulse rounded-2xl border border-stone-200 bg-white p-5"
            />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-base font-bold text-stone-800">
            Không có bàn ăn nào khớp bộ lọc hiện tại.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Hãy chuyển sang khu vực khác hoặc đặt lại bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => {
            const isBusy = busyTableId === table.id;
            const isActiveOrderTable =
              table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT';

            return (
              <article
                key={table.id}
                aria-label={`Bàn ${table.name}`}
                onClick={() => {
                  if (isActiveOrderTable && !isBusy) {
                    navigate(`/pos/orders/${table.id}`);
                  }
                }}
                className={`flex min-h-[172px] flex-col justify-between rounded-2xl border bg-white p-4 shadow-tactile transition ${
                  CARD_ACCENT_CLASS[table.status]
                } ${isActiveOrderTable ? 'cursor-pointer hover:shadow-tactile-hover' : ''}`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-stone-500">{table.areaName}</span>
                    <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
                      {table.name}
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 tabular-nums">
                    <Users className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                    {table.capacity} ghế
                  </span>
                </div>

                {/* Middle Status & Order Info */}
                <div className="my-3 space-y-2">
                  <TableStatusBadge status={table.status} />

                  {isActiveOrderTable && (
                    <div className="flex items-baseline justify-between rounded-xl bg-stone-50 px-3 py-2 border border-stone-200/70">
                      <span className="text-xs font-bold text-stone-600 truncate">
                        {table.activeOrderCode || 'Đơn đang mở'}
                      </span>
                      <span className="text-base font-extrabold text-stone-900 tabular-nums">
                        {formatVnd(table.activeOrderTotal ?? 0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tactile Action Footer (Fitts's Law >= 48px) */}
                <div>
                  {table.status === 'AVAILABLE' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleOpenTable(table);
                      }}
                      aria-label={`Mở bàn ${table.name}`}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white shadow-sm transition hover:bg-bistro-hover disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>{isBusy ? 'Đang mở bàn...' : 'Mở bàn'}</span>
                    </button>
                  )}

                  {isActiveOrderTable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pos/orders/${table.id}`);
                      }}
                      aria-label={`Xem đơn bàn ${table.name}`}
                      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                        table.status === 'WAITING_PAYMENT'
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <span>
                        {table.status === 'WAITING_PAYMENT'
                          ? 'Mở đơn / Thanh toán'
                          : 'Gọi thêm / Chi tiết'}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}

                  {table.status === 'CLEANING' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCleanTable(table);
                      }}
                      aria-label={`Đã dọn sạch ${table.name}`}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <CheckCircle2 className="h-4 w-4 hidden" aria-hidden="true" />
                      <span>{isBusy ? 'Đang cập nhật...' : 'Đã dọn sạch'}</span>
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
