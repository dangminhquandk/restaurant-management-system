// ============================================================================
// FROZEN API & DTO CONTRACT — SDD_v1.0.md Section 5.1 & 5.2
// ============================================================================

export type Role = 'ADMIN' | 'STAFF' | 'KITCHEN';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'WAITING_PAYMENT' | 'CLEANING';

export type OrderStatus = 'OPEN' | 'PAID' | 'CANCELLED';

export type OrderItemStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'VIETQR';

export type PaymentStatus = 'COMPLETED' | 'VOIDED';

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
}

// --- Auth & Users ---
export interface AuthUserDto {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUserDto;
}

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface UpdateUserRequest {
  username: string;
  password?: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

// --- Areas & Dining Tables ---
export interface AreaDto {
  id: number;
  name: string;
  displayOrder: number;
  description: string | null;
}

export interface UpsertAreaRequest {
  name: string;
  displayOrder: number;
  description?: string | null;
}

export interface DiningTableDto {
  id: number;
  areaId: number;
  areaName: string;
  name: string;
  capacity: number;
  status: TableStatus;
  version: number;
  activeOrderId: number | null;
  activeOrderCode: string | null;
  activeOrderTotal: number | null;
}

export interface UpsertDiningTableRequest {
  areaId: number;
  name: string;
  capacity: number;
}

export interface OpenTableRequest {
  expectedVersion: number;
}

export interface OpenTableResponse {
  table: DiningTableDto;
  order: OrderDto;
}

export interface TransferTableRequest {
  targetTableId: number;
}

export interface MergeTablesRequest {
  sourceTableIds: number[];
  targetTableId: number;
}

// --- Categories & Menu Items ---
export interface CategoryDto {
  id: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpsertCategoryRequest {
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItemDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  isAvailable: boolean;
}

export interface UpsertMenuItemRequest {
  categoryId: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  isAvailable: boolean;
}

export interface ToggleAvailabilityRequest {
  isAvailable: boolean;
}

// --- Orders, Order Items & Payments ---
export interface OrderItemDto {
  id: number;
  menuItemId: number;
  menuItemName: string;
  batchNo: number;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  note: string | null;
  status: OrderItemStatus;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentDto {
  id: number;
  orderId: number;
  orderCode: string;
  method: PaymentMethod;
  amount: number;
  amountReceived: number;
  changeAmount: number;
  qrPayload: string | null;
  status: PaymentStatus;
  paidAt: string;
  cashierName: string;
}

export interface OrderDto {
  id: number;
  orderCode: string;
  tableId: number;
  tableName: string;
  areaName: string;
  staffId: number;
  staffName: string;
  status: OrderStatus;
  totalAmount: number;
  version: number;
  createdAt: string;
  closedAt: string | null;
  items: OrderItemDto[];
  payment: PaymentDto | null;
}

export interface OrderSummaryDto {
  id: number;
  orderCode: string;
  tableName: string;
  staffName: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  closedAt: string | null;
}

export interface AddOrderItemInput {
  menuItemId: number;
  quantity: number;
  note?: string | null;
}

export interface AddOrderItemsRequest {
  items: AddOrderItemInput[];
}

export interface CancelOrderItemRequest {
  reason?: string;
}

export interface VietQrPreviewDto {
  orderId: number;
  orderCode: string;
  amount: number;
  bankBin: string;
  accountNumber: string;
  accountName: string;
  addInfo: string;
  qrPayload: string;
}

export interface ConfirmPaymentRequest {
  method: PaymentMethod;
  amountReceived?: number;
}

// --- KDS ---
export interface KdsItemDto {
  id: number;
  orderId: number;
  orderCode: string;
  tableId: number;
  tableName: string;
  areaName: string;
  menuItemId: number;
  menuItemName: string;
  batchNo: number;
  quantity: number;
  note: string | null;
  status: OrderItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateKdsItemStatusRequest {
  status: 'COOKING' | 'READY' | 'SERVED';
}

// --- Admin Settings, Reports & Audit Logs ---
export interface SystemSettingsDto {
  restaurantName: string;
  vietqrBankBin: string;
  vietqrAccountNumber: string;
  vietqrAccountName: string;
}

export interface DailyRevenuePointDto {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopMenuItemReportDto {
  menuItemId: number;
  menuItemName: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface RevenueReportDto {
  from: string;
  to: string;
  totalRevenue: number;
  paidOrderCount: number;
  cashRevenue: number;
  vietqrRevenue: number;
  dailySeries: DailyRevenuePointDto[];
  topItems: TopMenuItemReportDto[];
}

export interface AuditLogDto {
  id: number;
  actorUsername: string;
  actorFullName: string;
  action: string;
  targetType: string;
  targetId: number | null;
  detail: string | null;
  createdAt: string;
}

// --- WebSocket STOMP Event Payloads (SDD_v1.0.md Section 5.3) ---
export type StompConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface TableStompEvent {
  eventType: string;
  tableId: number;
  status: TableStatus;
  timestamp: string;
}

export interface KdsOrderStompEvent {
  eventType: 'ORDER_ITEMS_ADDED' | 'ITEM_STATUS_CHANGED' | 'ITEM_CANCELLED' | string;
  orderId: number;
  orderCode: string;
  tableId?: number;
  tableName: string;
  items?: KdsItemDto[];
  timestamp: string;
}

export interface PosNotificationStompEvent {
  eventType: 'ITEM_READY' | string;
  orderId: number;
  orderCode: string;
  tableId: number;
  tableName: string;
  itemId: number;
  menuItemName: string;
  quantity: number;
  message: string;
  timestamp: string;
}

export interface MenuAvailabilityStompEvent {
  eventType: 'MENU_AVAILABILITY_CHANGED' | string;
  menuItemId: number;
  menuItemName: string;
  isAvailable: boolean;
  timestamp: string;
}

