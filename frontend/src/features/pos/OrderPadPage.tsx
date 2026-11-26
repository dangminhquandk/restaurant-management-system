import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Minus,
  Plus,
  Receipt,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { floorApi } from '../../api/floorApi';
import { kdsApi } from '../../api/kdsApi';
import { menuApi } from '../../api/menuApi';
import { orderApi } from '../../api/orderApi';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { OrderItemStatusBadge, OrderStatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import type {
  CategoryDto,
  DiningTableDto,
  MenuItemDto,
  OrderDto,
  OrderItemDto,
} from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd, matchesViSearch } from '../../utils/format';

interface CartBatchLine {
  menuItemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string;
}

interface LocationState {
  prefetchedOrder?: OrderDto;
}

export function OrderPadPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const numericTableId = Number(tableId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const prefetchedOrder = (location.state as LocationState | null)?.prefetchedOrder;

  const [order, setOrder] = useState<OrderDto | null>(() =>
    prefetchedOrder && prefetchedOrder.tableId === numericTableId ? prefetchedOrder : null
  );
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartBatchLine[]>([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [requestingPayment, setRequestingPayment] = useState(false);

  // Cancel item modal state
  const [cancellingItem, setCancellingItem] = useState<OrderItemDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Transfer table modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState<DiningTableDto[]>([]);
  const [targetTableId, setTargetTableId] = useState<number | ''>('');
  const [transferLoading, setTransferLoading] = useState(false);

  const loadOrderAndMenu = useCallback(async () => {
    if (!Number.isFinite(numericTableId) || numericTableId <= 0) {
      setPageError('Mã bàn không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);
    try {
      const [categoryList, itemList, activeOrder] = await Promise.all([
        menuApi.listCategories(true),
        menuApi.listMenuItems(),
        orderApi.getActiveOrderByTable(numericTableId),
      ]);
      setCategories([...categoryList].sort((a, b) => a.displayOrder - b.displayOrder));
      setMenuItems(itemList);
      setOrder(activeOrder);
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không tìm thấy đơn đang mở cho bàn này. Vui lòng quay lại sơ đồ bàn.'
      );
      setPageError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [numericTableId]);

  useEffect(() => {
    void loadOrderAndMenu();
  }, [loadOrderAndMenu]);

  const refreshMenuCatalog = useCallback(async () => {
    try {
      const freshMenu = await menuApi.listMenuItems();
      setMenuItems(freshMenu);
    } catch {
      // Non-fatal catalog sync
    }
  }, []);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategoryId !== 'ALL' && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        return (
          matchesViSearch(item.name, searchQuery) ||
          matchesViSearch(item.categoryName, searchQuery)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  const cartQtyByMenuId = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of cart) {
      map.set(line.menuItemId, line.quantity);
    }
    return map;
  }, [cart]);

  const menuAvailabilityMap = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const item of menuItems) {
      map.set(item.id, item.isAvailable);
    }
    return map;
  }, [menuItems]);

  const newBatchSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const handleTapMenuItem = (item: MenuItemDto) => {
    if (!item.isAvailable) return;
    setSubmitError(null);
    setCart((prev) => {
      const existingIdx = prev.findIndex((line) => line.menuItemId === item.id);
      if (existingIdx >= 0) {
        return prev.map((line, idx) =>
          idx === existingIdx
            ? { ...line, quantity: Math.min(99, line.quantity + 1) }
            : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          note: '',
        },
      ];
    });
  };

  const handleChangeCartQty = (menuItemId: number, delta: number) => {
    setSubmitError(null);
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: Math.min(99, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const handleChangeCartNote = (menuItemId: number, note: string) => {
    setCart((prev) =>
      prev.map((line) => (line.menuItemId === menuItemId ? { ...line, note } : line))
    );
  };

  const handleSendBatchToKitchen = async () => {
    if (!order || cart.length === 0) return;
    setSubmittingBatch(true);
    setSubmitError(null);

    try {
      const updatedOrder = await orderApi.addItems(order.id, {
        items: cart.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          note: line.note.trim() ? line.note.trim() : null,
        })),
      });
      setOrder(updatedOrder);
      setCart([]);
      showToast({
        title: 'Đã gửi bếp thành công',
        message: `Đơn ${updatedOrder.orderCode} đã cập nhật lượt gọi món mới.`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(
        error,
        'Không thể gửi món xuống bếp. Vui lòng kiểm tra tình trạng món.'
      );
      setSubmitError(parsed.message);
      showToast({
        title: parsed.status === 422 ? 'Có món vừa tạm hết (422)' : 'Lỗi gửi bếp',
        message: parsed.message,
        variant: 'error',
      });
      if (parsed.status === 422) {
        await refreshMenuCatalog();
      }
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!order) return;
    setRequestingPayment(true);
    try {
      const updated = await orderApi.requestPayment(order.id);
      setOrder(updated);
      showToast({
        message: `Bàn ${order.tableName} đã chuyển sang trạng thái Chờ thanh toán.`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể chuyển trạng thái chờ thanh toán.');
      showToast({ title: 'Thao tác thất bại', message: parsed.message, variant: 'error' });
    } finally {
      setRequestingPayment(false);
    }
  };

  const handleMarkItemServed = async (item: OrderItemDto) => {
    if (!order) return;
    try {
      await kdsApi.updateItemStatus(item.id, { status: 'SERVED' });
      const refreshed = await orderApi.getOrder(order.id);
      setOrder(refreshed);
      showToast({
        message: `Đã đánh dấu phục vụ: ${item.menuItemName}.`,
        variant: 'success',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể cập nhật trạng thái lên món.');
      showToast({ message: parsed.message, variant: 'error' });
    }
  };

  const handleConfirmCancelItem = async () => {
    if (!order || !cancellingItem) return;
    setCancelLoading(true);
    try {
      const updated = await orderApi.cancelItem(order.id, cancellingItem.id, {
        reason: cancelReason.trim() || undefined,
      });
      setOrder(updated);
      setCancellingItem(null);
      setCancelReason('');
      showToast({
        message: `Đã hủy món ${cancellingItem.menuItemName}.`,
        variant: 'info',
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể hủy món này.');
      showToast({ title: 'Không thể hủy món', message: parsed.message, variant: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  const openTransferDialog = async () => {
    setTransferModalOpen(true);
    try {
      const tables = await floorApi.listTables();
      const free = tables.filter((t) => t.status === 'AVAILABLE' && t.id !== numericTableId);
      setAvailableTables(free);
      setTargetTableId(free[0]?.id ?? '');
    } catch (error) {
      const parsed = parseApiError(error, 'Không tải được danh sách bàn trống.');
      showToast({ message: parsed.message, variant: 'error' });
    }
  };

  const handleConfirmTransfer = async () => {
    if (!order || !targetTableId) return;
    setTransferLoading(true);
    try {
      const movedOrder = await floorApi.transferTable(numericTableId, {
        targetTableId: Number(targetTableId),
      });
      setTransferModalOpen(false);
      showToast({
        message: `Đã chuyển đơn ${movedOrder.orderCode} sang bàn ${movedOrder.tableName}.`,
        variant: 'success',
      });
      navigate(`/pos/orders/${movedOrder.tableId}`, {
        replace: true,
        state: { prefetchedOrder: movedOrder },
      });
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể chuyển bàn.');
      showToast({ title: 'Lỗi chuyển bàn', message: parsed.message, variant: 'error' });
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[620px] animate-pulse rounded-2xl border border-stone-200 bg-white lg:col-span-7" />
        <div className="h-[620px] animate-pulse rounded-2xl border border-stone-200 bg-white lg:col-span-5" />
      </div>
    );
  }

  if (pageError || !order) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-tactile">
        <p className="text-lg font-extrabold text-stone-900">
          {pageError || 'Không tìm thấy đơn hàng đang mở'}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Bàn có thể đã được đóng hóa đơn hoặc chuyển sang bàn khác.
        </p>
        <button
          type="button"
          onClick={() => navigate('/pos/tables')}
          className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-bistro px-5 text-sm font-bold text-white hover:bg-bistro-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay về sơ đồ bàn</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* LEFT COLUMN: 3-Tap Menu Selection Pad */}
      <section
        aria-label="Thực đơn chọn món"
        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile sm:p-5 lg:col-span-7 space-y-4"
      >
        {/* Top Back + Instant Vietnamese Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate('/pos/tables')}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-4 text-sm font-bold text-stone-800 transition hover:bg-stone-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Sơ đồ bàn</span>
          </button>

          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm món ăn"
              placeholder="Tìm món không dấu (vd: pho bo, bun cha, nem ran)..."
              className="block min-h-[48px] w-full rounded-xl border border-stone-300 bg-stone-50/60 pl-10 pr-10 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-bistro focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2 top-1/2 inline-flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Danh mục thực đơn"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategoryId === 'ALL'}
            onClick={() => setSelectedCategoryId('ALL')}
            className={`inline-flex min-h-[48px] shrink-0 items-center rounded-xl px-4 text-sm font-bold transition ${
              selectedCategoryId === 'ALL'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Tất cả món
          </button>
          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`inline-flex min-h-[48px] shrink-0 items-center rounded-xl px-4 text-sm font-bold transition ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Tactile Menu Item Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 py-12 text-center">
            <p className="text-sm font-bold text-stone-700">
              Không tìm thấy món ăn phù hợp từ khóa &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMenuItems.map((item) => {
              const qtyInCart = cartQtyByMenuId.get(item.id) ?? 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.isAvailable}
                  onClick={() => handleTapMenuItem(item)}
                  className={`group relative flex min-h-[120px] flex-col justify-between rounded-2xl border p-4 text-left transition ${
                    !item.isAvailable
                      ? 'cursor-not-allowed border-stone-200 bg-stone-100/80 opacity-65'
                      : qtyInCart > 0
                        ? 'border-bistro bg-orange-50/40 ring-1 ring-bistro shadow-sm'
                        : 'border-stone-200 bg-white hover:border-bistro/60 hover:shadow-tactile'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        {item.categoryName}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold leading-snug text-stone-900">
                        {item.name}
                      </h3>
                    </div>

                    {!item.isAvailable ? (
                      <span className="shrink-0 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                        Tạm hết
                      </span>
                    ) : qtyInCart > 0 ? (
                      <span className="inline-flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-full bg-bistro px-2 text-xs font-extrabold text-white tabular-nums">
                        +{qtyInCart}
                      </span>
                    ) : null}
                  </div>

                  {item.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-stone-500">{item.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-base font-extrabold text-stone-900 tabular-nums">
                      {formatVnd(item.price)}
                    </span>
                    {item.isAvailable && (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700 transition group-hover:bg-bistro group-hover:text-white">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* RIGHT COLUMN: Active Order & New Batch Cart */}
      <aside
        aria-label="Chi tiết đơn bàn và giỏ gọi thêm"
        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-tactile sm:p-5 lg:sticky lg:top-20 lg:col-span-5 space-y-4"
      >
        {/* Order Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900">Bàn {order.tableName}</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-0.5 text-xs font-medium text-stone-500">
              {order.areaName} • Mã đơn:{' '}
              <span className="font-bold text-stone-700">{order.orderCode}</span> • Phục vụ:{' '}
              {order.staffName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void openTransferDialog()}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Chuyển bàn</span>
          </button>
        </div>

        {/* Previously Submitted Kitchen Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Món đã gửi bếp ({order.items.length})
            </h3>
          </div>

          {order.items.length === 0 ? (
            <p className="rounded-xl bg-stone-50 px-3.5 py-3 text-xs font-medium text-stone-500">
              Chưa có món nào được gửi xuống bếp. Chạm vào món bên trái để thêm.
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {order.items.map((item) => {
                const canCancel =
                  item.status === 'PENDING' ||
                  (item.status === 'COOKING' && user?.role === 'ADMIN');
                const canMarkServed = item.status === 'READY';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 text-sm ${
                      item.status === 'CANCELLED'
                        ? 'border-stone-200 bg-stone-50 opacity-60'
                        : 'border-stone-200 bg-stone-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[11px] font-bold text-stone-700">
                            Lượt #{item.batchNo}
                          </span>
                          <span className="font-bold text-stone-900 tabular-nums">
                            {item.quantity}× {item.menuItemName}
                          </span>
                        </div>
                        {item.note && (
                          <p className="mt-1 text-xs font-semibold text-amber-800">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <OrderItemStatusBadge status={item.status} />
                        <span className="text-xs font-bold text-stone-700 tabular-nums">
                          {formatVnd(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {(canCancel || canMarkServed) && (
                      <div className="mt-2 flex items-center justify-end gap-2 border-t border-stone-200/70 pt-2">
                        {canMarkServed && (
                          <button
                            type="button"
                            onClick={() => void handleMarkItemServed(item)}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Đã lên món</span>
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingItem(item);
                              setCancelReason('');
                            }}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Hủy món</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Batch Cart */}
        <div className="border-t border-stone-200 pt-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-bistro">
              Giỏ gọi thêm (Lượt mới • {cart.reduce((acc, l) => acc + l.quantity, 0)} phần)
            </h3>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs font-semibold text-stone-500 underline hover:text-rose-600"
              >
                Xóa giỏ tạm
              </button>
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-l-4 border-rose-200 border-l-rose-600 bg-rose-50 p-3 text-xs font-semibold text-rose-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-5 text-center text-xs font-medium text-stone-500">
              Chưa chọn món mới. Chạm vào thẻ món ăn bên trái để thêm ngay (+1).
            </div>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {cart.map((line) => {
                const stillAvailable = menuAvailabilityMap.get(line.menuItemId) ?? true;
                return (
                  <div
                    key={line.menuItemId}
                    className={`rounded-xl border p-3 space-y-2.5 ${
                      stillAvailable
                        ? 'border-orange-200/80 bg-orange-50/30'
                        : 'border-rose-300 bg-rose-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900">{line.name}</p>
                        <p className="text-xs font-semibold text-stone-600 tabular-nums">
                          {formatVnd(line.unitPrice)} / phần • Tổng:{' '}
                          <span className="font-bold text-stone-900">
                            {formatVnd(line.unitPrice * line.quantity)}
                          </span>
                        </p>
                        {!stillAvailable && (
                          <p className="mt-0.5 text-xs font-bold text-rose-700">
                            Món này vừa tạm hết — vui lòng giảm về 0 trước khi gửi bếp.
                          </p>
                        )}
                      </div>

                      {/* [-][qty][+] Fitts's Law >= 48x48px Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChangeCartQty(line.menuItemId, -1)}
                          aria-label={`Giảm số lượng ${line.name}`}
                          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 shadow-sm transition hover:bg-stone-100"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="min-w-[32px] text-center text-base font-extrabold text-stone-900 tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={!stillAvailable}
                          onClick={() => handleChangeCartQty(line.menuItemId, 1)}
                          aria-label={`Tăng số lượng ${line.name}`}
                          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 shadow-sm transition hover:bg-stone-100 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={line.note}
                      onChange={(e) => handleChangeCartNote(line.menuItemId, e.target.value)}
                      aria-label={`Ghi chú cho ${line.name}`}
                      placeholder="Ghi chú khẩu vị: Ít cay, không hành..."
                      className="block min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:border-bistro focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totals & Primary Actions */}
        <div className="border-t border-stone-200 pt-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between text-stone-600">
              <span>Đã gọi trước đó:</span>
              <span className="font-bold tabular-nums">{formatVnd(order.totalAmount)}</span>
            </div>
            {cart.length > 0 && (
              <div className="flex items-center justify-between text-bistro">
                <span className="font-semibold">Tạm tính lượt mới:</span>
                <span className="font-extrabold tabular-nums">+{formatVnd(newBatchSubtotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 text-base font-extrabold text-stone-900">
              <span>Tổng cộng dự kiến:</span>
              <span className="text-lg tabular-nums">
                {formatVnd(order.totalAmount + newBatchSubtotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={cart.length === 0 || submittingBatch}
              onClick={() => void handleSendBatchToKitchen()}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-bistro px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-bistro-hover disabled:opacity-50 sm:col-span-2"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{submittingBatch ? 'Đang gửi xuống bếp...' : 'Gửi bếp ngay'}</span>
            </button>

            {order.items.some((i) => i.status !== 'CANCELLED') && (
              <button
                type="button"
                disabled={requestingPayment || cart.length > 0}
                onClick={() => void handleRequestPayment()}
                title={
                  cart.length > 0
                    ? 'Vui lòng gửi bếp hoặc xóa giỏ tạm trước khi báo thanh toán'
                    : undefined
                }
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-100 disabled:opacity-50 sm:col-span-2"
              >
                <Receipt className="h-4 w-4" aria-hidden="true" />
                <span>
                  {requestingPayment ? 'Đang chuyển trạng thái...' : 'Báo chờ thanh toán'}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Cancel Order Item Modal */}
      <ConfirmDialog
        open={Boolean(cancellingItem)}
        title={`Hủy món "${cancellingItem?.menuItemName ?? ''}"?`}
        description="Thao tác hủy món sẽ cập nhật lại tổng tiền hóa đơn và lưu vết nhật ký kiểm toán."
        confirmLabel="Xác nhận hủy món"
        loading={cancelLoading}
        onConfirm={() => void handleConfirmCancelItem()}
        onCancel={() => setCancellingItem(null)}
      >
        <label className="block text-xs font-bold text-stone-700">
          Lý do hủy món {cancellingItem?.status === 'COOKING' ? '(Bắt buộc)' : '(Tùy chọn)'}
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ví dụ: Khách đổi món, nhập nhầm số lượng..."
            className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5 text-sm font-normal text-stone-900 focus:border-bistro focus:outline-none"
          />
        </label>
      </ConfirmDialog>

      {/* Transfer Table Modal */}
      <ConfirmDialog
        open={transferModalOpen}
        title={`Chuyển bàn ${order.tableName} sang bàn trống khác`}
        description="Toàn bộ đơn hàng hiện tại sẽ được chuyển nguyên vẹn sang bàn đích."
        confirmLabel="Thực hiện chuyển bàn"
        variant="primary"
        loading={transferLoading}
        onConfirm={() => void handleConfirmTransfer()}
        onCancel={() => setTransferModalOpen(false)}
      >
        {availableTables.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">
            Hiện không còn bàn trống nào để chuyển sang.
          </p>
        ) : (
          <label className="block text-xs font-bold text-stone-700">
            Chọn bàn đích còn trống
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
        )}
      </ConfirmDialog>
    </div>
  );
}
