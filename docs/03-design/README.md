# TÀI LIỆU THIẾT KẾ PHẦN MỀM & GIAO DIỆN (DESIGN — BASELINE BL-02)

> **Học phần:** IT3180 — Chương 7_1 (Thiết kế Phần mềm) & Chương 7_2 (Thiết kế Giao diện Người dùng)  
> **Mốc Baseline:** `BL-02` (`v0.2.0-design` — Đã hoàn thành)  
> **Chủ trì:** Đặng Minh Quân *(Kiến trúc & Dữ liệu)*, Đào Trần Hoàng Hải *(UI/UX & Đánh giá)*

---

## Danh mục Hồ sơ Đã Bàn Giao tại Thư mục này

1. **[SDD_v1.0.md](SDD_v1.0.md) — Tài liệu Thiết kế Hệ thống (Software Design Description):**
   - Kiến trúc Modular Monolith Phân lớp kết hợp Event-Driven WebSocket STOMP.
   - Phân tích lớp **Boundary – Control – Entity** và sơ đồ lớp chi tiết cho **3 Design Patterns** (*Strategy*, *State*, *Observer/Pub-Sub*).
   - Từ điển dữ liệu 6 cột chuẩn báo cáo Bách Khoa cho toàn bộ 10 bảng CSDL 3NF.
   - **Hợp đồng REST API (`/api/v1/**`) và Kênh STOMP (`/ws`, `/topic/**`) khóa cứng** làm chuẩn tích hợp giữa Backend & Frontend.
2. **Bộ Bản ghi Quyết định Kiến trúc (`adr/`):**
   - [ADR-0001: Modular Monolith Phân tầng vs. Microservices](adr/ADR-0001-modular-monolith-layered-architecture.md)
   - [ADR-0002: Đồng bộ Real-time WebSocket STOMP & Transactional Events](adr/ADR-0002-stomp-websocket-realtime-sync.md)
   - [ADR-0003: Kiểm soát đồng thời bằng Khóa lạc quan `@Version`](adr/ADR-0003-optimistic-locking-concurrency.md)
   - [ADR-0004: Sinh mã VietQR động chuẩn NAPAS EMVCo (CRC16-CCITT)](adr/ADR-0004-vietqr-emvco-dynamic-payload.md)
3. **[schema.sql](schema.sql) & [seed.sql](seed.sql):**
   - Lược đồ 10 bảng chuẩn 3NF tương thích PostgreSQL 16 & H2, kèm dữ liệu mẫu (4 tài khoản phân quyền, 3 khu vực, 20 bàn, 5 danh mục, 24 món ăn, 5 hóa đơn lịch sử).
4. **[UI_UX_EVALUATION.md](UI_UX_EVALUATION.md):**
   - Phân tích người dùng/tác vụ, hệ thống thiết kế *"Tactile Bistro Command"*, Wireframe Lo-Fi POS & KDS, và kết quả đánh giá 5 thuộc tính sử dụng theo `Bai 07_2` P32.
