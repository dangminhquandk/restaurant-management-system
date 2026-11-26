import type { OrderItemStatus, OrderStatus, TableStatus } from '../types/api';

const TABLE_STATUS_CONFIG: Record<
  TableStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  AVAILABLE: {
    label: 'Bàn trống',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  OCCUPIED: {
    label: 'Đang phục vụ',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-600',
  },
  WAITING_PAYMENT: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-600',
  },
  CLEANING: {
    label: 'Chờ dọn',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-600',
  },
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const config = TABLE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${config.badgeClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

const ITEM_STATUS_CONFIG: Record<OrderItemStatus, { label: string; badgeClass: string }> = {
  PENDING: {
    label: 'Chờ bếp',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
  },
  COOKING: {
    label: 'Đang nấu',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  READY: {
    label: 'Sẵn sàng ra món',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  SERVED: {
    label: 'Đã phục vụ',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 line-through',
  },
};

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const config = ITEM_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; badgeClass: string }> = {
  OPEN: {
    label: 'Đang mở',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  PAID: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}
