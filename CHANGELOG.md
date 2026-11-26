# Changelog

Tất cả các thay đổi quan trọng và 5 mốc **Đường cơ sở (Baseline)** của dự án *Hệ thống Quản lý Nhà hàng Thực tế (IT3180 — Nhóm 1)* được ghi nhận tại tệp này theo chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và đánh số phiên bản theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — Baseline `BL-05` (Final Production Release — Sprint 4)
### Added
- **Kiểm thử Hộp trắng & Cổng độ phủ cứng (`NFR-06`):** Cấu hình `jacoco:check` trong `backend/pom.xml` bắt buộc `LINE >= 80%` và `BRANCH >= 75%`; bổ sung các bộ kiểm thử phủ nhánh nâng độ phủ thực tế tầng `com.hust.rms.service` lên **97.7% Line / 90.8% Branch** và `domain.state`, `domain.payment` đạt **100.0% Line / 100.0% Branch** (`61` JUnit 5 tests + `14` Vitest tests = `75` tests tự động xanh 100%).
- **Đóng gói 1-Click Docker Stack (`NFR-07`):** Bổ sung Multi-stage `backend/Dockerfile` (non-root `rms:rms`, `/actuator/health`), `frontend/Dockerfile` + `frontend/nginx.conf` (SPA fallback + Reverse Proxy `/api/` & WebSocket Upgrade `/ws`) và `docker-compose.yml` (`name: rms`).
- **Hồ sơ QA, Bảo trì & Bảo vệ cuối kỳ:** Hoàn thiện `docs/04-testing-qa/STP_v1.0.md` (3 CFG hộp trắng, EP/BVA, Decision Table, 45 ca kiểm thử), `docs/04-testing-qa/MAINTENANCE_LOG.md` (biểu 6 cột chuẩn Chương 9), `docs/05-presentations/DEFENSE_PLAYBOOK_QNA.md`, ảnh chụp E2E thực tế tại `docs/05-presentations/screenshots/` và báo cáo tổng kết `docs/05-presentations/Bao_cao_BTL_IT3180_Nhom1_Final.docx`.

### Changed (Refactoring — Chương 8)
- **PR `#8` (`refactor/ch08-extract-order-code-generator`):** Tách thành phần `OrderCodeGenerator` khỏi `TableService` đạt độ kết dính đơn chức năng (*Functional Cohesion*) mà không làm thay đổi hành vi nghiệp vụ bên ngoài.
- **PR `#9` (`refactor/ch08-extract-pos-cart-hook`):** Tách custom hook `usePosCart` khỏi `OrderPadPage.tsx` kèm kiểm thử đơn vị độc lập `usePosCart.test.ts`.

---

## [0.9.0-rc] — Baseline `BL-04` (Release Candidate — Sprint 3, PR `#6`)
### Added
- **Điều phối Bếp Thời gian thực (KDS & WebSocket STOMP):** Cấu hình STOMP Broker `/ws` (heartbeat `10s/10s`, xác thực JWT frame `CONNECT`), `StompBroadcastListener` (`AFTER_COMMIT`), giao diện nền tối `KdsBoardPage` (FIFO, đồng hồ chờ SLA, chuông Web Audio, ngăn kéo **Báo Hết Món** khóa món `< 1s` trên POS).
- **Nghiệp vụ Bàn nâng cao & RBAC Hủy món:** API & Modal Chuyển bàn (`transferTable`), Gộp bàn ACID (`mergeTables` có sắp thứ tự khóa chống Deadlock), và quy tắc hủy món theo Bảng quyết định (`STAFF` chặn `403` khi `COOKING`, `ADMIN` bắt buộc nhập lý do kèm vết `AUDIT_LOGS`).
- **Thanh toán Strategy Pattern & VietQR Động NAPAS 247:** Cài đặt `Crc16Util` (`0x1021`), `EmvCoVietQrBuilder`, `VietQRPaymentStrategy`, `CashPaymentStrategy`, giao diện `PaymentModal` (`QRCodeSVG`), phiếu in nhiệt `@media print` (`PrintableReceipt`) và tra cứu lịch sử hóa đơn (`OrderHistoryPage`).
- **Báo cáo Doanh thu & Cấu hình Quản trị:** Thống kê doanh thu theo múi giờ `Asia/Ho_Chi_Minh`, biểu đồ Top 10 món bán chạy, cập nhật nóng BIN/STK VietQR và bảng Nhật ký kiểm toán trên `AdminDashboardPage`.

---

## [0.3.0-alpha] — Baseline `BL-03` (Core Alpha — Sprint 2, PR `#4`)
### Added
- **Backend Core (Spring Boot 3.3.5):** Khởi tạo Flyway migrations `V1__init_schema.sql` & `V2__seed_data.sql`, xác thực Stateless JWT + BCrypt, CRUD Khu vực / Danh mục / Thực đơn (xóa mềm `deleted_at`, tìm kiếm không dấu) / Bàn / Nhân sự (bảo vệ `ADMIN` cuối cùng), mở bàn có `@Version` Optimistic Locking (kiểm thử 5 luồng đồng thời `TableConcurrencyIntegrationTest`) và gọi món theo lượt (`batch_no`).
- **Frontend Core (React 18 + TypeScript + Tailwind):** Thiết lập hệ thống thiết kế *Tactile Bistro Command*, trang đăng nhập nhanh 1 chạm (`LoginPage`), sơ đồ bàn 4 màu (`FloorMapPage`), màn hình gọi món $\le 3$ chạm (`OrderPadPage`) và các trang quản trị CRUD.

---

## [0.2.0-design] — Baseline `BL-02` (Design Baseline — Đầu Sprint 2, PR `#2`)
### Added
- Hoàn thiện Hồ sơ Thiết kế Phần mềm `docs/03-design/SDD_v1.0.md`, 4 bản ghi quyết định kiến trúc (`ADR-0001..0004`), lược đồ vật lý PostgreSQL 3NF `schema.sql` + `seed.sql` và báo cáo thiết kế & đánh giá giao diện `UI_UX_EVALUATION.md`.

---

## [0.1.0-srs] — Baseline `BL-01` (Requirements & SCM Baseline — Sprint 1)
### Added
- Chuẩn hóa kho lưu trữ Git, mẫu Issue/PR, GitHub Actions `ci.yml`, `PROJECT_MANAGEMENT_PLAN.md`, `PRODUCT_BACKLOG.md`, `SCM_PLAN.md` và Đặc tả Yêu cầu Phần mềm `SRS_v1.0.md` (22 FR, 8 NFR, 6 Use Case, DFD 0/1, Sequence, FSM, Activity, ERD, RTM).
