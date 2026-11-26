import { useEffect, useState } from 'react';
import { ArrowLeftRight, GitMerge, X } from 'lucide-react';
import { floorApi } from '../../api/floorApi';
import { useToast } from '../../store/ToastContext';
import type { DiningTableDto, OrderDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd } from '../../utils/format';

interface TableTransferMergeModalProps {
  open: boolean;
  currentTableId: number;
  currentTableName: string;
  onClose: () => void;
  onOrderTransferred: (movedOrder: OrderDto) => void;
  onOrdersMerged: (mergedOrder: OrderDto) => void;
}

export function TableTransferMergeModal({
  open,
  currentTableId,
  currentTableName,
  onClose,
  onOrderTransferred,
  onOrdersMerged,
}: TableTransferMergeModalProps) {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'TRANSFER' | 'MERGE'>('TRANSFER');
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [targetTableId, setTargetTableId] = useState<number | ''>('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedSourceIds([]);
    floorApi
      .listTables()
      .then((list) => {
        setTables(list);
        const firstAvailable = list.find(
          (t) => t.status === 'AVAILABLE' && t.id !== currentTableId
        );
        setTargetTableId(firstAvailable?.id ?? '');
      })
      .catch((error) => {
        const parsed = parseApiError(error, 'Không thể tải danh sách bàn.');
        showToast({ message: parsed.message, variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [open, currentTableId, showToast]);

  if (!open) return null;

  const availableTables = tables.filter(
    (t) => t.status === 'AVAILABLE' && t.id !== currentTableId
  );
  const mergeCandidateTables = tables.filter(
    (t) =>
      (t.status === 'OCCUPIED' || t.status === 'WAITING_PAYMENT') && t.id !== currentTableId
  );

  const toggleSourceTable = (id: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTransfer = async () => {
    if (!targetTableId) return;
    setSubmitting(true);
    try {
      const moved = await floorApi.transferTable(currentTableId, {
        targetTableId: Number(targetTableId),
      });
      showToast({
        message: `Đã chuyển đơn sang bàn ${moved.tableName}.`,
        variant: 'success',
      });
      onOrderTransferred(moved);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể chuyển bàn.');
      showToast({ title: 'Lỗi chuyển bàn', message: parsed.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMerge = async () => {
    if (selectedSourceIds.length === 0) return;
    setSubmitting(true);
    try {
      const merged = await floorApi.mergeTables({
        sourceTableIds: selectedSourceIds,
        targetTableId: currentTableId,
      });
      showToast({
        message: `Đã gộp toàn bộ món về bàn ${merged.tableName}.`,
        variant: 'success',
      });
      onOrdersMerged(merged);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể gộp bàn.');
      showToast({ title: 'Lỗi gộp bàn', message: parsed.message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-merge-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="transfer-merge-title" className="text-lg font-extrabold text-stone-900">
            Chuyển / Gộp bàn — Bàn {currentTableName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại chuyển gộp bàn"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'TRANSFER'}
            onClick={() => setMode('TRANSFER')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
              mode === 'TRANSFER'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            <span>Chuyển sang bàn trống</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'MERGE'}
            onClick={() => setMode('MERGE')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
              mode === 'MERGE'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <GitMerge className="h-4 w-4" aria-hidden="true" />
            <span>Gộp bàn đang phục vụ</span>
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-stone-500">Đang tải sơ đồ bàn...</p>
          ) : mode === 'TRANSFER' ? (
            availableTables.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-900">
                Hiện không còn bàn trống nào để chuyển sang.
              </p>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-stone-700">
                  Chọn bàn đích (AVAILABLE)
                  <select
                    value={targetTableId}
                    onChange={(e) => setTargetTableId(Number(e.target.value))}
                    className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
                  >
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.areaName} ({t.capacity} ghế)
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !targetTableId}
                    onClick={() => void handleTransfer()}
                    className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                  >
                    {submitting ? 'Đang chuyển...' : 'Xác nhận chuyển bàn'}
                  </button>
                </div>
              </div>
            )
          ) : mergeCandidateTables.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-900">
              Không có bàn đang phục vụ nào khác để gộp vào Bàn {currentTableName}.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-medium text-stone-600">
                Chọn các bàn nguồn cần gộp toàn bộ món và tổng tiền về{' '}
                <strong>Bàn {currentTableName}</strong> (bàn nguồn sẽ tự động giải phóng):
              </p>

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {mergeCandidateTables.map((t) => {
                  const checked = selectedSourceIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex min-h-[52px] cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 transition ${
                        checked
                          ? 'border-bistro bg-orange-50/50'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSourceTable(t.id)}
                          className="h-4 w-4 rounded border-stone-300 text-bistro focus:ring-bistro"
                        />
                        <span>
                          <span className="block text-sm font-extrabold text-stone-900">
                            Bàn {t.name} ({t.areaName})
                          </span>
                          <span className="block text-xs text-stone-500">
                            {t.activeOrderCode ?? 'Đơn đang mở'}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-extrabold text-stone-900 tabular-nums">
                        {formatVnd(t.activeOrderTotal ?? 0)}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submitting || selectedSourceIds.length === 0}
                  onClick={() => void handleMerge()}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  {submitting
                    ? 'Đang gộp bàn...'
                    : `Gộp ${selectedSourceIds.length} bàn về ${currentTableName}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
