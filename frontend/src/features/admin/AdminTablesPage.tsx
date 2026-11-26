import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, MapPin, Plus, Trash2, Users, X } from 'lucide-react';
import { floorApi } from '../../api/floorApi';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableStatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../store/ToastContext';
import type {
  AreaDto,
  DiningTableDto,
  UpsertAreaRequest,
  UpsertDiningTableRequest,
} from '../../types/api';
import { parseApiError } from '../../utils/errors';

export function AdminTablesPage() {
  const { showToast } = useToast();

  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Area Modal
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDto | null>(null);
  const [areaForm, setAreaForm] = useState<UpsertAreaRequest>({
    name: '',
    displayOrder: 1,
    description: '',
  });
  const [areaFormError, setAreaFormError] = useState<string | null>(null);
  const [savingArea, setSavingArea] = useState(false);
  const [deletingArea, setDeletingArea] = useState<AreaDto | null>(null);
  const [deletingAreaBusy, setDeletingAreaBusy] = useState(false);

  // Table Modal
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTableDto | null>(null);
  const [tableForm, setTableForm] = useState<UpsertDiningTableRequest>({
    areaId: 0,
    name: '',
    capacity: 4,
  });
  const [tableFormError, setTableFormError] = useState<string | null>(null);
  const [savingTable, setSavingTable] = useState(false);
  const [deletingTable, setDeletingTable] = useState<DiningTableDto | null>(null);
  const [deletingTableBusy, setDeletingTableBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [areaList, tableList] = await Promise.all([
        floorApi.listAreas(),
        floorApi.listTables(),
      ]);
      setAreas([...areaList].sort((a, b) => a.displayOrder - b.displayOrder));
      setTables(tableList);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải cấu hình khu vực và bàn ăn.');
      showToast({ title: 'Lỗi tải dữ liệu', message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTables = useMemo(() => {
    if (selectedAreaId === 'ALL') return tables;
    return tables.filter((t) => t.areaId === selectedAreaId);
  }, [tables, selectedAreaId]);

  // --- Area CRUD ---
  const openCreateArea = () => {
    setEditingArea(null);
    setAreaFormError(null);
    setAreaForm({ name: '', displayOrder: areas.length + 1, description: '' });
    setAreaModalOpen(true);
  };

  const openEditArea = (area: AreaDto) => {
    setEditingArea(area);
    setAreaFormError(null);
    setAreaForm({
      name: area.name,
      displayOrder: area.displayOrder,
      description: area.description ?? '',
    });
    setAreaModalOpen(true);
  };

  const handleSaveArea = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!areaForm.name.trim()) {
      setAreaFormError('Tên khu vực không được để trống.');
      return;
    }
    setSavingArea(true);
    setAreaFormError(null);
    const payload: UpsertAreaRequest = {
      name: areaForm.name.trim(),
      displayOrder: Number(areaForm.displayOrder) || 0,
      description: areaForm.description?.trim() ? areaForm.description.trim() : null,
    };

    try {
      if (editingArea) {
        const updated = await floorApi.updateArea(editingArea.id, payload);
        setAreas((prev) =>
          prev
            .map((a) => (a.id === updated.id ? updated : a))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
        setTables((prev) =>
          prev.map((t) => (t.areaId === updated.id ? { ...t, areaName: updated.name } : t))
        );
        showToast({ message: `Đã cập nhật khu vực "${updated.name}".`, variant: 'success' });
      } else {
        const created = await floorApi.createArea(payload);
        setAreas((prev) =>
          [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder)
        );
        showToast({ message: `Đã thêm khu vực "${created.name}".`, variant: 'success' });
      }
      setAreaModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu khu vực.');
      setAreaFormError(parsed.message);
    } finally {
      setSavingArea(false);
    }
  };

  const handleConfirmDeleteArea = async () => {
    if (!deletingArea) return;
    setDeletingAreaBusy(true);
    try {
      await floorApi.deleteArea(deletingArea.id);
      setAreas((prev) => prev.filter((a) => a.id !== deletingArea.id));
      if (selectedAreaId === deletingArea.id) setSelectedAreaId('ALL');
      showToast({ message: `Đã xóa khu vực "${deletingArea.name}".`, variant: 'info' });
      setDeletingArea(null);
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không thể xóa khu vực đang chứa bàn ăn.'
      );
      showToast({ title: 'Không thể xóa khu vực (409)', message: parsed.message, variant: 'error' });
      setDeletingArea(null);
    } finally {
      setDeletingAreaBusy(false);
    }
  };

  // --- Dining Table CRUD ---
  const openCreateTable = () => {
    setEditingTable(null);
    setTableFormError(null);
    setTableForm({
      areaId:
        selectedAreaId !== 'ALL' ? selectedAreaId : (areas[0]?.id ?? 0),
      name: '',
      capacity: 4,
    });
    setTableModalOpen(true);
  };

  const openEditTable = (table: DiningTableDto) => {
    setEditingTable(table);
    setTableFormError(null);
    setTableForm({
      areaId: table.areaId,
      name: table.name,
      capacity: table.capacity,
    });
    setTableModalOpen(true);
  };

  const handleSaveTable = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tableForm.name.trim()) {
      setTableFormError('Mã / Tên bàn không được để trống.');
      return;
    }
    if (!tableForm.areaId) {
      setTableFormError('Vui lòng chọn khu vực cho bàn ăn.');
      return;
    }
    if (tableForm.capacity < 1 || tableForm.capacity > 30) {
      setTableFormError('Sức chứa ghế ngồi phải từ 1 đến 30 ghế.');
      return;
    }

    setSavingTable(true);
    setTableFormError(null);
    const payload: UpsertDiningTableRequest = {
      areaId: Number(tableForm.areaId),
      name: tableForm.name.trim(),
      capacity: Number(tableForm.capacity),
    };

    try {
      if (editingTable) {
        const updated = await floorApi.updateTable(editingTable.id, payload);
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showToast({ message: `Đã cập nhật bàn "${updated.name}".`, variant: 'success' });
      } else {
        const created = await floorApi.createTable(payload);
        setTables((prev) => [...prev, created]);
        showToast({ message: `Đã thêm bàn "${created.name}".`, variant: 'success' });
      }
      setTableModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu thông tin bàn ăn.');
      setTableFormError(parsed.message);
    } finally {
      setSavingTable(false);
    }
  };

  const handleConfirmDeleteTable = async () => {
    if (!deletingTable) return;
    setDeletingTableBusy(true);
    try {
      await floorApi.deleteTable(deletingTable.id);
      setTables((prev) => prev.filter((t) => t.id !== deletingTable.id));
      showToast({ message: `Đã xóa bàn "${deletingTable.name}".`, variant: 'info' });
      setDeletingTable(null);
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không thể xóa bàn đang có khách phục vụ hoặc chờ thanh toán.'
      );
      showToast({
        title: parsed.status === 409 ? 'Bàn đang phục vụ (409 Conflict)' : 'Không thể xóa bàn',
        message: parsed.message,
        variant: 'error',
      });
      setDeletingTable(null);
    } finally {
      setDeletingTableBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Quản trị Khu vực & Sơ đồ Bàn
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Thiết lập tầng/sảnh phục vụ và sức chứa từng bàn. Bàn đang có khách được bảo vệ chống xóa nhầm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateArea}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 shadow-tactile hover:bg-stone-50"
          >
            <MapPin className="h-4 w-4 text-bistro" aria-hidden="true" />
            <span>Thêm khu vực</span>
          </button>

          <button
            type="button"
            onClick={openCreateTable}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white shadow-sm hover:bg-bistro-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm bàn ăn</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Areas Panel */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-600">
              Khu vực phục vụ ({areas.length})
            </h2>
            {selectedAreaId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedAreaId('ALL')}
                className="text-xs font-bold text-bistro underline"
              >
                Xem tất cả bàn
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-stone-500">Đang tải khu vực...</p>
          ) : areas.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Chưa có khu vực nào.</p>
          ) : (
            <div className="space-y-2.5">
              {areas.map((area) => {
                const tableCount = tables.filter((t) => t.areaId === area.id).length;
                const isSelected = selectedAreaId === area.id;
                return (
                  <div
                    key={area.id}
                    className={`rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-bistro bg-orange-50/40'
                        : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAreaId((prev) => (prev === area.id ? 'ALL' : area.id))
                        }
                        className="text-left flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500 tabular-nums">
                            #{area.displayOrder}
                          </span>
                          <span className="text-base font-extrabold text-stone-900">
                            {area.name}
                          </span>
                        </div>
                        {area.description && (
                          <p className="mt-0.5 text-xs text-stone-600">{area.description}</p>
                        )}
                        <p className="mt-1.5 text-xs font-bold text-bistro tabular-nums">
                          {tableCount} bàn trực thuộc
                        </p>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditArea(area)}
                          aria-label={`Sửa khu vực ${area.name}`}
                          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingArea(area)}
                          aria-label={`Xóa khu vực ${area.name}`}
                          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Dining Tables Table */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3.5">Mã bàn</th>
                  <th className="px-4 py-3.5">Khu vực</th>
                  <th className="px-4 py-3.5">Sức chứa</th>
                  <th className="px-4 py-3.5">Trạng thái hiện tại</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                      Đang tải danh sách bàn...
                    </td>
                  </tr>
                ) : filteredTables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                      Chưa có bàn ăn nào trong khu vực đã chọn.
                    </td>
                  </tr>
                ) : (
                  filteredTables.map((table) => (
                    <tr key={table.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3.5 font-extrabold text-stone-900">{table.name}</td>
                      <td className="px-4 py-3.5 text-stone-700">{table.areaName}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 tabular-nums">
                          <Users className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                          {table.capacity} ghế
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <TableStatusBadge status={table.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditTable(table)}
                            aria-label={`Sửa bàn ${table.name}`}
                            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTable(table)}
                            aria-label={`Xóa bàn ${table.name}`}
                            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Upsert Area Modal */}
      {areaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="area-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="area-modal-title" className="text-lg font-extrabold text-stone-900">
                {editingArea ? `Sửa khu vực "${editingArea.name}"` : 'Thêm khu vực mới'}
              </h2>
              <button
                type="button"
                onClick={() => setAreaModalOpen(false)}
                aria-label="Đóng biểu mẫu khu vực"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {areaFormError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {areaFormError}
              </div>
            )}

            <form onSubmit={handleSaveArea} className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-stone-700">
                Tên khu vực / tầng *
                <input
                  type="text"
                  required
                  value={areaForm.name}
                  onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Tầng 1, Tầng 2, Sân vườn"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Thứ tự hiển thị tab
                <input
                  type="number"
                  value={areaForm.displayOrder}
                  onChange={(e) =>
                    setAreaForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))
                  }
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-bold text-stone-900 tabular-nums focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Mô tả
                <input
                  type="text"
                  value={areaForm.description ?? ''}
                  onChange={(e) => setAreaForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ví dụ: Khu sảnh điều hòa trung tâm"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-normal text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAreaModalOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingArea}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  {savingArea ? 'Đang lưu...' : 'Lưu khu vực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upsert Table Modal */}
      {tableModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="table-modal-title" className="text-lg font-extrabold text-stone-900">
                {editingTable ? `Sửa bàn "${editingTable.name}"` : 'Thêm bàn ăn mới'}
              </h2>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                aria-label="Đóng biểu mẫu bàn ăn"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {tableFormError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {tableFormError}
              </div>
            )}

            <form onSubmit={handleSaveTable} className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-stone-700">
                Khu vực trực thuộc *
                <select
                  value={tableForm.areaId}
                  onChange={(e) =>
                    setTableForm((f) => ({ ...f, areaId: Number(e.target.value) }))
                  }
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
                >
                  <option value={0} disabled>
                    -- Chọn khu vực --
                  </option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Mã / Tên bàn hiển thị *
                <input
                  type="text"
                  required
                  value={tableForm.name}
                  onChange={(e) => setTableForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: T1-09, SV-05"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-bold text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Sức chứa (1 – 30 ghế) *
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={tableForm.capacity}
                  onChange={(e) =>
                    setTableForm((f) => ({ ...f, capacity: Number(e.target.value) }))
                  }
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-bold text-stone-900 tabular-nums focus:border-bistro focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTable}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  {savingTable ? 'Đang lưu...' : 'Lưu bàn ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Area Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingArea)}
        title={`Xóa khu vực "${deletingArea?.name ?? ''}"?`}
        description="Hệ thống sẽ từ chối xóa nếu khu vực vẫn còn bàn ăn trực thuộc."
        confirmLabel="Xác nhận xóa"
        loading={deletingAreaBusy}
        onConfirm={() => void handleConfirmDeleteArea()}
        onCancel={() => setDeletingArea(null)}
      />

      {/* Delete Table Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingTable)}
        title={`Xóa bàn "${deletingTable?.name ?? ''}"?`}
        description="Nếu bàn đang có khách phục vụ hoặc chờ thanh toán, hệ thống sẽ chặn thao tác xóa (409 Conflict) để bảo vệ đơn hàng."
        confirmLabel="Xóa bàn ăn"
        loading={deletingTableBusy}
        onConfirm={() => void handleConfirmDeleteTable()}
        onCancel={() => setDeletingTable(null)}
      />
    </div>
  );
}
