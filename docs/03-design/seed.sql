-- ============================================================================
-- HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM - IT3180)
-- Tệp: seed.sql (Dữ liệu khởi tạo chuẩn — Tương thích PostgreSQL 16 & H2)
-- Tài khoản mẫu:
--   admin    / admin123   (ADMIN   - Đặng Minh Quân)
--   staff1   / staff123   (STAFF   - Đào Trần Hoàng Hải)
--   staff2   / staff123   (STAFF   - Vũ Tuấn Anh)
--   kitchen1 / kitchen123 (KITCHEN - Bùi Đại Nghĩa)
--   kitchen2 / kitchen123 (KITCHEN - Nguyễn Đăng Khôi)
-- ============================================================================

-- 1. Tài khoản Nhân sự (5 thành viên Nhóm 1)
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', '$2a$10$i/TGy7KH4VZ2nv3l.7m2T.NRsCRmyhQ3R0gIkH20WSxOunMIyl/Z.', 'Đặng Minh Quân', 'ADMIN', TRUE),
('staff1', '$2a$10$jgmYqAovnDhECXVWVbvCRuB5s1OiW2ICiM7NS1Qg1AbOEG8CiyEAu', 'Đào Trần Hoàng Hải', 'STAFF', TRUE),
('staff2', '$2a$10$jgmYqAovnDhECXVWVbvCRuB5s1OiW2ICiM7NS1Qg1AbOEG8CiyEAu', 'Vũ Tuấn Anh', 'STAFF', TRUE),
('kitchen1', '$2a$10$hOom8G17O0vrsQHhX.UegevppFSbDgtpA8KZ.id./2b0PqdZLja4u', 'Bùi Đại Nghĩa', 'KITCHEN', TRUE),
('kitchen2', '$2a$10$hOom8G17O0vrsQHhX.UegevppFSbDgtpA8KZ.id./2b0PqdZLja4u', 'Nguyễn Đăng Khôi', 'KITCHEN', TRUE);

-- 2. Cấu hình Hệ thống & VietQR Mặc định
INSERT INTO system_settings (setting_key, setting_value) VALUES
('RESTAURANT_NAME', 'Nhà Hàng Bách Khoa Bistro'),
('VIETQR_BANK_BIN', '970415'),
('VIETQR_ACCOUNT_NUMBER', '113366668888'),
('VIETQR_ACCOUNT_NAME', 'NHA HANG DEMO IT3180');

-- 3. Khu vực / Tầng phục vụ (3 khu vực)
INSERT INTO areas (name, display_order, description) VALUES
('Tầng 1 - Sảnh Chính', 1, 'Khu vực sảnh chính phục vụ nhanh và khách lẻ'),
('Tầng 2 - Phòng Lạnh', 2, 'Không gian điều hòa yên tĩnh cho gia đình và nhóm'),
('Sân Vườn', 3, 'Không gian thoáng ngoài trời buổi tối');

-- 4. Sơ đồ 20 Bàn ăn (T1-01..08, T2-01..08, SV-01..04)
INSERT INTO dining_tables (area_id, name, capacity, status) VALUES
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-01', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-02', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-03', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-04', 2, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-05', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-06', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-07', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 1 - Sảnh Chính'), 'T1-08', 8, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-01', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-02', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-03', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-04', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-05', 8, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-06', 8, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-07', 10, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Tầng 2 - Phòng Lạnh'), 'T2-08', 12, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Sân Vườn'), 'SV-01', 4, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Sân Vườn'), 'SV-02', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Sân Vườn'), 'SV-03', 6, 'AVAILABLE'),
((SELECT id FROM areas WHERE name = 'Sân Vườn'), 'SV-04', 8, 'AVAILABLE');

-- 5. Danh mục Thực đơn (5 danh mục)
INSERT INTO categories (name, display_order, is_active) VALUES
('Khai vị', 1, TRUE),
('Món chính', 2, TRUE),
('Lẩu & Nướng', 3, TRUE),
('Đồ uống', 4, TRUE),
('Tráng miệng', 5, TRUE);

-- 6. Thực đơn 24 Món ăn truyền thống & hiện đại (VNĐ)
INSERT INTO menu_items (category_id, name, price, description, is_available) VALUES
-- Khai vị
((SELECT id FROM categories WHERE name = 'Khai vị'), 'Nem Rán Hà Nội', 65000, 'Nem truyền thống nhân thịt heo, mộc nhĩ, miến dong giòn rụm', TRUE),
((SELECT id FROM categories WHERE name = 'Khai vị'), 'Gỏi Cuốn Tôm Thịt', 55000, 'Tôm tươi, thịt ba chỉ luộc cuốn rau sống chấm tương đậu phộng', TRUE),
((SELECT id FROM categories WHERE name = 'Khai vị'), 'Nộm Bò Khô Đu Đủ', 60000, 'Đu đủ xanh bào sợi, bò khô gia truyền, lạc rang và rau kinh giới', TRUE),
((SELECT id FROM categories WHERE name = 'Khai vị'), 'Khoai Tây Chiên Bơ Tỏi', 45000, 'Khoai tây chiên giòn xóc bơ tỏi thơm ngậy', TRUE),
((SELECT id FROM categories WHERE name = 'Khai vị'), 'Súp Gà Ngô Non', 45000, 'Súp gà xé phay nấu ngô ngọt và nấm hương ấm nóng', TRUE),
-- Món chính
((SELECT id FROM categories WHERE name = 'Món chính'), 'Phở Bò Tái Lăn', 75000, 'Thịt bò thăn xào tỏi lửa lớn trên nền nước dùng xương ống 12 giờ', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Bún Chả Hà Nội', 70000, 'Chả viên và chả miếng nướng than hoa ăn kèm bún rối và đu đủ ngâm', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Cơm Rang Dưa Bò', 68000, 'Cơm hạt săn vàng rang dưa cải chua và thịt bò mềm', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Bò Lúc Lắc Khoai Tây', 135000, 'Thịt thăn bò Úc áp chảo sốt tiêu đen kèm ớt chuông và khoai tây', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Cá Lăng Nướng Riềng Mẻ', 185000, 'Cá lăng sông Đà ướp nghệ, riềng mẻ nướng thơm lừng', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Gà Đồi Hấp Lá Chanh', 220000, 'Nửa con gà đồi hấp chín tới giữ vị ngọt tự nhiên chấm muối tiêu chanh', TRUE),
((SELECT id FROM categories WHERE name = 'Món chính'), 'Sườn Xào Chua Ngọt', 125000, 'Sườn non rim sốt cà chua dứa đậm đà đưa cơm', TRUE),
-- Lẩu & Nướng
((SELECT id FROM categories WHERE name = 'Lẩu & Nướng'), 'Lẩu Thái Hải Sản (Nhỏ)', 265000, 'Nước lẩu Tomyum chua cay kèm tôm, mực, ngao và nấm tươi (2-3 người)', TRUE),
((SELECT id FROM categories WHERE name = 'Lẩu & Nướng'), 'Lẩu Riêu Cua Bắp Bò', 320000, 'Riêu cua đồng nguyên chất, bắp bò hoa, sườn sụn và đậu mơ (4 người)', TRUE),
((SELECT id FROM categories WHERE name = 'Lẩu & Nướng'), 'Ba Chỉ Bò Mỹ Nướng Sốt Cay', 155000, 'Ba chỉ bò Mỹ thái lát nướng sốt Gochujang kèm rau cuốn', TRUE),
((SELECT id FROM categories WHERE name = 'Lẩu & Nướng'), 'Set Nướng Tổng Hợp Bách Khoa', 295000, 'Ba chỉ bò, nầm heo, bạch tuộc sốt sa tế và nấm kim châm', TRUE),
-- Đồ uống
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Trà Đào Cam Sả', 38000, 'Hồng trà ủ lạnh kết hợp đào miếng giòn, cam vàng và sả tươi', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Trà Sen Vàng Kem Cheese', 42000, 'Trà ô long hương sen kèm hạt sen bùi và lớp kem mặn', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Nước Ép Cam Tươi', 40000, 'Cam sành vắt nguyên chất không pha đường hóa học', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Cà Phê Sữa Đá Sài Gòn', 32000, 'Cà phê phin đậm vị pha sữa đặc truyền thống', TRUE),
((SELECT id FROM categories WHERE name = 'Đồ uống'), 'Nước Suối Tinh Khiết', 15000, 'Chai 500ml ướp lạnh', TRUE),
-- Tráng miệng
((SELECT id FROM categories WHERE name = 'Tráng miệng'), 'Chè Khúc Bạch Hạnh Nhân', 38000, 'Khúc bạch phô mai béo nhẹ, nhãn lồng và hạnh nhân lát nướng', TRUE),
((SELECT id FROM categories WHERE name = 'Tráng miệng'), 'Caramen Hàng Than', 28000, 'Bánh flan trứng sữa mềm mịn thơm sốt đường thắng', TRUE),
((SELECT id FROM categories WHERE name = 'Tráng miệng'), 'Đĩa Hoa Quả Theo Mùa', 65000, 'Dưa hấu, ổi hồng, xoài cát và nho tươi ướp lạnh', TRUE);

-- 7. Dữ liệu Hóa đơn Lịch sử Đã Thanh toán (5 đơn PAID để hiển thị ngay biểu đồ Doanh thu & Top 10)
INSERT INTO orders (order_code, table_id, staff_id, status, total_amount, created_at, closed_at) VALUES
('ORD-SEED-0001', (SELECT id FROM dining_tables WHERE name = 'T1-01'), (SELECT id FROM users WHERE username = 'staff1'), 'PAID', 291000, CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '2' DAY + INTERVAL '45' MINUTE),
('ORD-SEED-0002', (SELECT id FROM dining_tables WHERE name = 'T2-03'), (SELECT id FROM users WHERE username = 'staff1'), 'PAID', 476000, CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY + INTERVAL '60' MINUTE),
('ORD-SEED-0003', (SELECT id FROM dining_tables WHERE name = 'SV-01'), (SELECT id FROM users WHERE username = 'staff2'), 'PAID', 485000, CURRENT_TIMESTAMP - INTERVAL '1' DAY + INTERVAL '2' HOUR, CURRENT_TIMESTAMP - INTERVAL '1' DAY + INTERVAL '3' HOUR),
('ORD-SEED-0004', (SELECT id FROM dining_tables WHERE name = 'T1-05'), (SELECT id FROM users WHERE username = 'staff1'), 'PAID', 354000, CURRENT_TIMESTAMP - INTERVAL '4' HOUR, CURRENT_TIMESTAMP - INTERVAL '3' HOUR),
('ORD-SEED-0005', (SELECT id FROM dining_tables WHERE name = 'T2-01'), (SELECT id FROM users WHERE username = 'staff2'), 'PAID', 256000, CURRENT_TIMESTAMP - INTERVAL '2' HOUR, CURRENT_TIMESTAMP - INTERVAL '1' HOUR);

INSERT INTO order_items (order_id, menu_item_id, batch_no, quantity, unit_price, note, status) VALUES
-- ORD-SEED-0001: 2x Phở Bò (150k) + 1x Nem Rán (65k) + 2x Trà Đào (76k) = 291k
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0001'), (SELECT id FROM menu_items WHERE name = 'Phở Bò Tái Lăn'), 1, 2, 75000, 'Ít hành lá', 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0001'), (SELECT id FROM menu_items WHERE name = 'Nem Rán Hà Nội'), 1, 1, 65000, NULL, 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0001'), (SELECT id FROM menu_items WHERE name = 'Trà Đào Cam Sả'), 1, 2, 38000, 'Ít đá', 'SERVED'),
-- ORD-SEED-0002: 1x Lẩu Riêu Cua (320k) + 4x Trà Đào (152k -> 156k? 3x Trà Sen 126k + 2x Nước Suối 30k = 476k)
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0002'), (SELECT id FROM menu_items WHERE name = 'Lẩu Riêu Cua Bắp Bò'), 1, 1, 320000, 'Nước dùng đậm', 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0002'), (SELECT id FROM menu_items WHERE name = 'Trà Sen Vàng Kem Cheese'), 1, 3, 42000, NULL, 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0002'), (SELECT id FROM menu_items WHERE name = 'Nước Suối Tinh Khiết'), 1, 2, 15000, NULL, 'SERVED'),
-- ORD-SEED-0003: 1x Set Nướng (295k) + 1x Cá Lăng (185k -> tổng 480k? 1x Set Nướng 295k + 2x Gỏi Cuốn 110k + 2x Nước Ép Cam 80k = 485k)
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0003'), (SELECT id FROM menu_items WHERE name = 'Set Nướng Tổng Hợp Bách Khoa'), 1, 1, 295000, 'Ít cay', 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0003'), (SELECT id FROM menu_items WHERE name = 'Gỏi Cuốn Tôm Thịt'), 1, 2, 55000, NULL, 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0003'), (SELECT id FROM menu_items WHERE name = 'Nước Ép Cam Tươi'), 1, 2, 40000, 'Không đường', 'SERVED'),
-- ORD-SEED-0004: 1x Lẩu Thái (265k) + 1x Caramen (28k -> 3x Caramen 84k? 1x Bò Lúc Lắc 135k + 2x Bún Chả 140k + 1x Chè Khúc Bạch 38k + 1x Trà Sen 41k? -> 2x Bún Chả 140k + 1x Bò Lúc Lắc 135k + 1x Khoai Tây 45k + 1x Cà Phê 34k? Exact: 1x Gà Đồi 220k + 2x Cơm Rang 136k -> 356k; let's match 354k: 3x Bún Chả 210k + 2x Nem Rán 130k = 340k? Wait: 2x Bò Lúc Lắc 270k + 2x Trà Sen 84k = 354k!)
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0004'), (SELECT id FROM menu_items WHERE name = 'Bò Lúc Lắc Khoai Tây'), 1, 2, 135000, 'Chín vừa', 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0004'), (SELECT id FROM menu_items WHERE name = 'Trà Sen Vàng Kem Cheese'), 1, 2, 42000, NULL, 'SERVED'),
-- ORD-SEED-0005: 2x Phở Bò (150k) + 2x Chè Khúc Bạch (76k) + 2x Nước Suối (30k) = 256k
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0005'), (SELECT id FROM menu_items WHERE name = 'Phở Bò Tái Lăn'), 1, 2, 75000, NULL, 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0005'), (SELECT id FROM menu_items WHERE name = 'Chè Khúc Bạch Hạnh Nhân'), 1, 2, 38000, NULL, 'SERVED'),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0005'), (SELECT id FROM menu_items WHERE name = 'Nước Suối Tinh Khiết'), 1, 2, 15000, NULL, 'SERVED');

INSERT INTO payments (order_id, cashier_id, method, amount, amount_received, change_amount, qr_payload, status, paid_at) VALUES
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0001'), (SELECT id FROM users WHERE username = 'staff1'), 'CASH', 291000, 300000, 9000, NULL, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2' DAY + INTERVAL '45' MINUTE),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0002'), (SELECT id FROM users WHERE username = 'staff1'), 'VIETQR', 476000, 476000, 0, '00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454064760005802VN5920NHA HANG DEMO IT31806006HA NOI62270823THANHTOAN ORD-SEED-00026304', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1' DAY + INTERVAL '60' MINUTE),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0003'), (SELECT id FROM users WHERE username = 'staff2'), 'VIETQR', 485000, 485000, 0, '00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454064850005802VN5920NHA HANG DEMO IT31806006HA NOI62270823THANHTOAN ORD-SEED-00036304', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1' DAY + INTERVAL '3' HOUR),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0004'), (SELECT id FROM users WHERE username = 'staff1'), 'CASH', 354000, 400000, 46000, NULL, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3' HOUR),
((SELECT id FROM orders WHERE order_code = 'ORD-SEED-0005'), (SELECT id FROM users WHERE username = 'staff2'), 'VIETQR', 256000, 256000, 0, '00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454062560005802VN5920NHA HANG DEMO IT31806006HA NOI62270823THANHTOAN ORD-SEED-00056304', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1' HOUR);

INSERT INTO audit_logs (actor_id, action, target_type, target_id, detail, created_at) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'SYSTEM_INIT', 'SYSTEM_SETTINGS', 1, 'Khởi tạo cấu hình mặc định Nhà Hàng Bách Khoa Bistro & VietQR EMVCo', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
((SELECT id FROM users WHERE username = 'staff1'), 'PAYMENT_CONFIRMED', 'ORDERS', (SELECT id FROM orders WHERE order_code = 'ORD-SEED-0004'), 'Xác nhận thanh toán CASH 354.000đ cho đơn ORD-SEED-0004', CURRENT_TIMESTAMP - INTERVAL '3' HOUR),
((SELECT id FROM users WHERE username = 'staff2'), 'PAYMENT_CONFIRMED', 'ORDERS', (SELECT id FROM orders WHERE order_code = 'ORD-SEED-0005'), 'Xác nhận thanh toán VIETQR 256.000đ cho đơn ORD-SEED-0005', CURRENT_TIMESTAMP - INTERVAL '1' HOUR);
