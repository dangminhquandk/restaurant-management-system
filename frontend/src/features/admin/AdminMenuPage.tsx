import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react';
import { menuApi } from '../../api/menuApi';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../store/ToastContext';
import type {
  CategoryDto,
  MenuItemDto,
  UpsertCategoryRequest,
  UpsertMenuItemRequest,
} from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd, matchesViSearch } from '../../utils/format';

type ActiveTab = 'ITEMS' | 'CATEGORIES';

export function AdminMenuPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ITEMS');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Menu Items
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<number | 'ALL'>('ALL');
  const [filterAvailability, setFilterAvailability] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>(
    'ALL'
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Menu Item Form Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDto | null>(null);
  const [itemForm, setItemForm] = useState<UpsertMenuItemRequest>({
    categoryId: 0,
    name: '',
    price: 45000,
    imageUrl: '',
    description: '',
    isAvailable: true,
  });
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItemDto | null>(null);
  const [deletingItemBusy, setDeletingItemBusy] = useState(false);

  // Category Form Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [catForm, setCatForm] = useState<UpsertCategoryRequest>({
    name: '',
    displayOrder: 1,
    isActive: true,
  });
  const [catFormError, setCatFormError] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDto | null>(null);
  const [deletingCatBusy, setDeletingCatBusy] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [catList, itemList] = await Promise.all([
        menuApi.listCategories(false),
        menuApi.listMenuItems(),
      ]);
      setCategories([...catList].sort((a, b) => a.displayOrder - b.displayOrder));
      setMenuItems(itemList);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể tải dữ liệu thực đơn.');
      showToast({ title: 'Lỗi tải thực đơn', message: parsed.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (filterCategoryId !== 'ALL' && item.categoryId !== filterCategoryId) return false;
      if (filterAvailability === 'AVAILABLE' && !item.isAvailable) return false;
      if (filterAvailability === 'UNAVAILABLE' && item.isAvailable) return false;
      if (searchQuery.trim() && !matchesViSearch(item.name, searchQuery)) return false;
      return true;
    });
  }, [menuItems, filterCategoryId, filterAvailability, searchQuery]);

  // --- Menu Item Handlers ---
  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemFormError(null);
    setItemForm({
      categoryId: categories[0]?.id ?? 0,
      name: '',
      price: 55000,
      imageUrl: '',
      description: '',
      isAvailable: true,
    });
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItemDto) => {
    setEditingItem(item);
    setItemFormError(null);
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl ?? '',
      description: item.description ?? '',
      isAvailable: item.isAvailable,
    });
    setItemModalOpen(true);
  };

  const handleSaveMenuItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemForm.name.trim()) {
      setItemFormError('Tên món ăn không được để trống.');
      return;
    }
    if (!itemForm.categoryId) {
      setItemFormError('Vui lòng chọn danh mục cho món ăn.');
      return;
    }
    if (!Number.isFinite(itemForm.price) || itemForm.price < 0) {
      setItemFormError('Đơn giá phải lớn hơn hoặc bằng 0 ₫.');
      return;
    }

    setSavingItem(true);
    setItemFormError(null);
    const payload: UpsertMenuItemRequest = {
      categoryId: Number(itemForm.categoryId),
      name: itemForm.name.trim(),
      price: Math.round(itemForm.price),
      imageUrl: itemForm.imageUrl?.trim() ? itemForm.imageUrl.trim() : null,
      description: itemForm.description?.trim() ? itemForm.description.trim() : null,
      isAvailable: itemForm.isAvailable,
    };

    try {
      if (editingItem) {
        const updated = await menuApi.updateMenuItem(editingItem.id, payload);
        setMenuItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
        showToast({ message: `Đã cập nhật món "${updated.name}".`, variant: 'success' });
      } else {
        const created = await menuApi.createMenuItem(payload);
        setMenuItems((prev) => [created, ...prev]);
        showToast({ message: `Đã thêm món "${created.name}".`, variant: 'success' });
      }
      setItemModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu món ăn.');
      setItemFormError(parsed.message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItemDto) => {
    setTogglingId(item.id);
    try {
      const updated = await menuApi.toggleAvailability(item.id, {
        isAvailable: !item.isAvailable,
      });
      setMenuItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      showToast({
        message: `"${updated.name}" → ${updated.isAvailable ? 'Còn món' : 'Tạm hết'}.`,
        variant: updated.isAvailable ? 'success' : 'warning',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể đổi trạng thái phục vụ của món.');
      showToast({ title: 'Lỗi cập nhật', message: parsed.message, variant: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;
    setDeletingItemBusy(true);
    try {
      await menuApi.deleteMenuItem(deletingItem.id);
      setMenuItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      showToast({ message: `Đã xóa mềm món "${deletingItem.name}".`, variant: 'info' });
      setDeletingItem(null);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể xóa món ăn.');
      showToast({ title: 'Lỗi xóa món', message: parsed.message, variant: 'error' });
    } finally {
      setDeletingItemBusy(false);
    }
  };

  // --- Category Handlers ---
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCatFormError(null);
    setCatForm({
      name: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setCatFormError(null);
    setCatForm({
      name: cat.name,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!catForm.name.trim()) {
      setCatFormError('Tên danh mục không được để trống.');
      return;
    }

    setSavingCat(true);
    setCatFormError(null);
    const payload: UpsertCategoryRequest = {
      name: catForm.name.trim(),
      displayOrder: Number(catForm.displayOrder) || 0,
      isActive: catForm.isActive,
    };

    try {
      if (editingCategory) {
        const updated = await menuApi.updateCategory(editingCategory.id, payload);
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
        showToast({ message: `Đã cập nhật danh mục "${updated.name}".`, variant: 'success' });
      } else {
        const created = await menuApi.createCategory(payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder)
        );
        showToast({ message: `Đã tạo danh mục "${created.name}".`, variant: 'success' });
      }
      setCatModalOpen(false);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể lưu danh mục.');
      setCatFormError(parsed.message);
    } finally {
      setSavingCat(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeletingCatBusy(true);
    try {
      await menuApi.deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showToast({ message: `Đã xóa danh mục "${deletingCategory.name}".`, variant: 'info' });
      setDeletingCategory(null);
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không thể xóa danh mục đang chứa món ăn.'
      );
      showToast({ title: 'Không thể xóa danh mục', message: parsed.message, variant: 'error' });
      setDeletingCategory(null);
    } finally {
      setDeletingCatBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Quản trị Thực đơn & Danh mục
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Cập nhật giá bán, thêm món mới và bật/tắt trạng thái Còn món / Tạm hết tức thì.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Chế độ quản trị thực đơn"
            className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-tactile"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ITEMS'}
              onClick={() => setActiveTab('ITEMS')}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                activeTab === 'ITEMS'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
              <span>Món ăn ({menuItems.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'CATEGORIES'}
              onClick={() => setActiveTab('CATEGORIES')}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                activeTab === 'CATEGORIES'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              <span>Danh mục ({categories.length})</span>
            </button>
          </div>

          {activeTab === 'ITEMS' ? (
            <button
              type="button"
              onClick={openCreateItemModal}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white shadow-sm transition hover:bg-bistro-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Thêm món mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateCategoryModal}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-4 text-sm font-bold text-white shadow-sm transition hover:bg-bistro-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Thêm danh mục</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'ITEMS' ? (
        <section className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm món trong thực đơn"
                placeholder="Tìm món không dấu (vd: pho bo, lau thai)..."
                className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/50 pl-10 pr-4 text-sm text-stone-900 focus:border-bistro focus:bg-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={filterCategoryId}
                onChange={(e) =>
                  setFilterCategoryId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                aria-label="Lọc theo danh mục"
                className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 focus:border-bistro focus:outline-none"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterAvailability}
                onChange={(e) =>
                  setFilterAvailability(
                    e.target.value as 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
                  )
                }
                aria-label="Lọc trạng thái phục vụ"
                className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 focus:border-bistro focus:outline-none"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="AVAILABLE">Đang còn món</option>
                <option value="UNAVAILABLE">Đang tạm hết</option>
              </select>
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-4 py-3.5">Món ăn</th>
                    <th className="px-4 py-3.5">Danh mục</th>
                    <th className="px-4 py-3.5 text-right">Đơn giá</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái phục vụ (1 chạm)</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                        Đang tải thực đơn...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                        Không có món ăn nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/70">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-stone-900">{item.name}</div>
                          {item.description && (
                            <div className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-stone-900 tabular-nums">
                          {formatVnd(item.price)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            disabled={togglingId === item.id}
                            onClick={() => void handleToggleAvailability(item)}
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition disabled:opacity-50 ${
                              item.isAvailable
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            {item.isAvailable ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span>Còn món</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-rose-600" />
                                <span>Tạm hết</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(item)}
                              aria-label={`Sửa món ${item.name}`}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              aria-label={`Xóa món ${item.name}`}
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
          </div>
        </section>
      ) : (
        /* Categories Management Table */
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-tactile">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-xs font-extrabold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3.5">Thứ tự</th>
                  <th className="px-4 py-3.5">Tên danh mục</th>
                  <th className="px-4 py-3.5">Trạng thái hiển thị</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                      Chưa có danh mục nào.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3.5 font-bold text-stone-700 tabular-nums">
                        #{cat.displayOrder}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-stone-900">{cat.name}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                            cat.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-stone-200 bg-stone-100 text-stone-600'
                          }`}
                        >
                          {cat.isActive ? 'Đang hiển thị POS' : 'Đang ẩn'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
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
      )}

      {/* Create/Edit Menu Item Modal */}
      {itemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-item-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="menu-item-modal-title" className="text-lg font-extrabold text-stone-900">
                {editingItem ? `Chỉnh sửa món "${editingItem.name}"` : 'Thêm món ăn mới'}
              </h2>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                aria-label="Đóng biểu mẫu món ăn"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {itemFormError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {itemFormError}
              </div>
            )}

            <form onSubmit={handleSaveMenuItem} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-stone-700 sm:col-span-2">
                  Tên món ăn *
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ví dụ: Phở Bò Tái Lăn"
                    className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 focus:border-bistro focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-bold text-stone-700">
                  Danh mục *
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, categoryId: Number(e.target.value) }))
                    }
                    className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-900 focus:border-bistro focus:outline-none"
                  >
                    <option value={0} disabled>
                      -- Chọn danh mục --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-stone-700">
                  Đơn giá (VNĐ) *
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={itemForm.price}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, price: Number(e.target.value) }))
                    }
                    className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-bold text-stone-900 tabular-nums focus:border-bistro focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-bold text-stone-700 sm:col-span-2">
                  Mô tả thành phần
                  <input
                    type="text"
                    value={itemForm.description ?? ''}
                    onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Ví dụ: Nước dùng xương bò hầm 12h, bánh phở tươi..."
                    className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-normal text-stone-900 focus:border-bistro focus:outline-none"
                  />
                </label>
              </div>

              <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={itemForm.isAvailable}
                  onChange={(e) => setItemForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-bistro focus:ring-bistro"
                />
                <span>Món đang sẵn sàng phục vụ (Còn món)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  {savingItem ? 'Đang lưu...' : 'Lưu món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Category Modal */}
      {catModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="category-modal-title" className="text-lg font-extrabold text-stone-900">
                {editingCategory ? `Sửa danh mục "${editingCategory.name}"` : 'Thêm danh mục mới'}
              </h2>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                aria-label="Đóng biểu mẫu danh mục"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {catFormError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
              >
                {catFormError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-stone-700">
                Tên danh mục *
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Món chính, Lẩu, Đồ uống"
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-900 focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                Thứ tự hiển thị
                <input
                  type="number"
                  value={catForm.displayOrder}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))
                  }
                  className="mt-1 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-bold text-stone-900 tabular-nums focus:border-bistro focus:outline-none"
                />
              </label>

              <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-bistro focus:ring-bistro"
                />
                <span>Hiển thị trên màn hình gọi món POS</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="inline-flex min-h-[48px] items-center rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover disabled:opacity-50"
                >
                  {savingCat ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft-Delete Menu Item Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingItem)}
        title={`Xóa món "${deletingItem?.name ?? ''}"?`}
        description="Món ăn sẽ được đánh dấu xóa mềm để ẩn khỏi thực đơn hiện tại nhưng vẫn bảo toàn lịch sử hóa đơn cũ."
        confirmLabel="Xác nhận xóa món"
        loading={deletingItemBusy}
        onConfirm={() => void handleConfirmDeleteItem()}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title={`Xóa danh mục "${deletingCategory?.name ?? ''}"?`}
        description="Chỉ có thể xóa danh mục chưa gắn với món ăn nào."
        confirmLabel="Xóa danh mục"
        loading={deletingCatBusy}
        onConfirm={() => void handleConfirmDeleteCategory()}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
