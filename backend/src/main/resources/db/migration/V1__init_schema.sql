-- ============================================================================
-- HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM - IT3180)
-- Tệp: schema.sql (Chuẩn hóa mức 3NF — Tương thích PostgreSQL 16 & H2 Mode PG)
-- Baseline: BL-02 (v0.2.0-design)
-- ============================================================================

-- 1. Bảng Người dùng & Phân quyền RBAC (USERS)
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'STAFF', 'KITCHEN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);

-- 2. Bảng Khu vực / Tầng phục vụ (AREAS)
CREATE TABLE areas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Bàn ăn — Có cột version cho Khóa lạc quan @Version (DINING_TABLES)
CREATE TABLE dining_tables (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    area_id BIGINT NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name VARCHAR(50) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 30),
    status VARCHAR(25) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'WAITING_PAYMENT', 'CLEANING')),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dining_tables_area_id ON dining_tables(area_id);
CREATE INDEX idx_dining_tables_status ON dining_tables(status);

-- 4. Bảng Danh mục Thực đơn (CATEGORIES)
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Món ăn — Hỗ trợ Xóa mềm deleted_at & Khóa hết món tức thì (MENU_ITEMS)
CREATE TABLE menu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12, 0) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    description VARCHAR(500),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- 6. Bảng Đơn hàng tại bàn — Có cột version cho Khóa lạc quan @Version (ORDERS)
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    table_id BIGINT NOT NULL REFERENCES dining_tables(id) ON DELETE RESTRICT,
    staff_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'PAID', 'CANCELLED')),
    total_amount NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_staff_id ON orders(staff_id);
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);

-- 7. Bảng Chi tiết Món trong Đơn — Lưu snapshot unit_price & trạng thái KDS (ORDER_ITEMS)
CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    batch_no INTEGER NOT NULL DEFAULT 1 CHECK (batch_no >= 1),
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    unit_price NUMERIC(12, 0) NOT NULL CHECK (unit_price >= 0),
    note VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED')),
    cancel_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_order_items_kds_queue ON order_items(status, created_at);

-- 8. Bảng Giao dịch Thanh toán — Hỗ trợ CASH & VIETQR EMVCo (PAYMENTS)
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    cashier_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    method VARCHAR(20) NOT NULL
        CHECK (method IN ('CASH', 'VIETQR')),
    amount NUMERIC(12, 0) NOT NULL CHECK (amount > 0),
    amount_received NUMERIC(12, 0) NOT NULL CHECK (amount_received >= amount),
    change_amount NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
    qr_payload TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
        CHECK (status IN ('COMPLETED', 'VOIDED')),
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_cashier_id ON payments(cashier_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- 9. Bảng Nhật ký Kiểm toán Hệ thống (AUDIT_LOGS)
CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 10. Bảng Cấu hình Hệ thống & VietQR Động (SYSTEM_SETTINGS)
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
