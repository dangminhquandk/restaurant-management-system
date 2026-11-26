# HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM)

> **Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) — Trường CNTT&TT, Đại học Bách khoa Hà Nội  
> **Giảng viên hướng dẫn:** TS. Nguyễn Nhất Hải  
> **Phương pháp phát triển:** Agile / Scrum (4 Sprint — 8 tuần) kết hợp 5 Đường cơ sở SCM cứng  
> **Mô hình kiến trúc:** Modular Monolith phân tầng (Controller – Service – Domain – Repository) + Event-Driven (WebSocket STOMP)  
> **Phiên bản phát hành hiện tại:** `v1.0.0` *(Baseline `BL-05` — Final Production Release)*

---

## 1. Thành viên Nhóm 1 & Phân công Trách nhiệm

| STT | Họ và tên | MSSV | Vai trò CNPM | Nhiệm vụ kỹ thuật & Hồ sơ phụ trách |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Đặng Minh Quân** | `202416323` | **Project Manager / Scrum Master** | • Lập kế hoạch dự án (`PROJECT_MANAGEMENT_PLAN.md`), Product Backlog & thiết kế CSDL 3NF (`schema.sql`)<br>• Backend: Sơ đồ bàn (`@Version` Optimistic Locking), Chuyển/Gộp bàn ACID, Máy trạng thái & WebSocket STOMP (`/ws`) |
| **2** | **Đào Trần Hoàng Hải** | `202416190` | **UI/UX Lead** *(Design & Usability)* | • Phân tích tác vụ, Style Guide *Tactile Bistro Command* & Khảo sát đánh giá giao diện (`UI_UX_EVALUATION.md`)<br>• Frontend (React 18 + TS): Màn hình Sơ đồ bàn, Gọi món POS $\le 3$ chạm (`usePosCart`) & Màn hình Bếp KDS |
| **3** | **Vũ Tuấn Anh** | `202416635` | **Configuration Manager** *(SCM, CI/CD, Docker)* | • Kế hoạch quản lý cấu hình (`SCM_PLAN.md`), GitHub Actions CI 3-job & Đóng gói Multi-stage Docker Compose<br>• Backend/Frontend: Xác thực JWT/BCrypt, phân quyền RBAC & Phân hệ Quản trị Thực đơn / Bàn / Nhân sự |
| **4** | **Bùi Đại Nghĩa** | `202416302` | **QA & Documentation Lead** *(Testing & Maintenance)* | • Đặc tả `SRS_v1.0.md` (RTM), Kế hoạch kiểm thử `STP_v1.0.md` (White-box CFG / Black-box) & `MAINTENANCE_LOG.md`<br>• Module thanh toán **VietQR động chuẩn NAPAS EMVCo (CRC16-CCITT)**, Báo cáo doanh thu & Nhật ký kiểm toán |

---

## 2. Kiến trúc Kỹ thuật & Điểm nhấn Công nghệ

Hệ thống tuân thủ nguyên lý **SOLID**, **High Cohesion – Loose Coupling**, và hiện thực hóa 3 mẫu thiết kế (Design Patterns) trọng tâm:
- **State Pattern (`TableStateMachine`, `OrderItemStateMachine`):** Ràng buộc chặt chẽ đồ thị chuyển trạng thái của Bàn ăn (`AVAILABLE → OCCUPIED → WAITING_PAYMENT → CLEANING`) và Món chế biến (`PENDING → COOKING → READY → SERVED / CANCELLED`) kèm phân quyền hủy món theo vai trò.
- **Strategy Pattern (`PaymentStrategy`):** Đóng gói thuật toán thanh toán tiền mặt (`CashPaymentStrategy`) và sinh mã **VietQR động chuẩn EMVCo TLV + CRC-16/CCITT-FALSE (`0x1021`)** (`VietQRPaymentStrategy`), đảm bảo nguyên lý *Open-Closed (OCP)*.
- **Observer / Pub-Sub Pattern (`@TransactionalEventListener(AFTER_COMMIT)` + STOMP):** Phát tin thời gian thực (`< 1s`) tới `/topic/tables`, `/topic/kds/orders`, `/topic/pos/notifications`, `/topic/menu/availability` chỉ sau khi giao dịch PostgreSQL đã commit bền vững.

| Tầng công nghệ | Chi tiết giải pháp sử dụng |
| :--- | :--- |
| **Backend** | Java 17 bytecode, Spring Boot 3.3.5 (Web, Data JPA, Security + Stateless JWT HS256, WebSocket STOMP, Actuator), Flyway, SpringDoc OpenAPI 3 |
| **Frontend** | React 18.3, TypeScript 5.6, Vite 5.4, TailwindCSS 3.4, `@stomp/stompjs` (10s heartbeat + auto-reconnect resync), `qrcode.react` |
| **Database** | PostgreSQL 16 (chuẩn hóa 3NF gồm 10 bảng, chỉ mục một phần chống trùng đơn mở, cột `version` cho Optimistic Locking) |
| **QA & DevOps** | JUnit 5 + Mockito (`61` tests, cổng cứng `jacoco:check`: **97.7% Line / 90.8% Branch** tầng Service), Vitest (`14` tests), GitHub Actions CI, Multi-stage Docker Compose |

---

## 3. Cấu trúc Kho Mã nguồn & Bộ Hồ sơ Kỹ nghệ Phần mềm

```text
restaurant-management-system/
├── .github/                              # Issue/PR Templates (Code Review Checklist) & CI Pipeline (ci.yml)
├── backend/                              # Spring Boot 3.3 Backend + Flyway V1/V2 + Multi-stage Dockerfile
├── frontend/                             # React 18 + TS + Tailwind Frontend + Nginx Reverse Proxy Dockerfile
├── docs/
│   ├── 01-project-management/            # Kế hoạch QLDA (WBS, Gantt, RMMM), Product Backlog, Kế hoạch SCM
│   ├── 02-requirements/                  # Đặc tả yêu cầu SRS v1.0 (22 FR, 8 NFR, 6 UC, DFD, Sequence, FSM, ERD, RTM)
│   ├── 03-design/                        # Thiết kế SDD v1.0, 4 ADRs, DDL schema.sql, seed.sql, Đánh giá UI/UX
│   ├── 04-testing-qa/                    # Kế hoạch & Kết quả kiểm thử STP v1.0 (CFG, JaCoCo, 45 TCs) & Nhật ký bảo trì
│   └── 05-presentations/                 # Báo cáo BTL hoàn chỉnh (.docx), Ảnh chụp E2E thực tế & Cẩm nang vấn đáp
├── docker-compose.yml                    # Điều phối 1-click toàn bộ 3 container (postgres + backend + frontend)
├── .env.example                          # Mẫu biến môi trường chuẩn hóa
├── CHANGELOG.md                          # Lịch sử phiên bản qua 5 mốc Baseline (v0.1.0-srs -> v1.0.0)
└── README.md
```

### Danh mục Hồ sơ Kỹ nghệ Phần mềm Chính thức
- **Quản lý dự án & Cấu hình:** [PROJECT_MANAGEMENT_PLAN.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/01-project-management/PROJECT_MANAGEMENT_PLAN.md) • [PRODUCT_BACKLOG.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/01-project-management/PRODUCT_BACKLOG.md) • [SCM_PLAN.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/01-project-management/SCM_PLAN.md)
- **Phân tích yêu cầu:** [SRS_v1.0.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/02-requirements/SRS_v1.0.md)
- **Thiết kế hệ thống & Giao diện:** [SDD_v1.0.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/03-design/SDD_v1.0.md) • [schema.sql](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/03-design/schema.sql) • [UI_UX_EVALUATION.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/03-design/UI_UX_EVALUATION.md)
- **Kiểm thử & Bảo trì:** [STP_v1.0.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/04-testing-qa/STP_v1.0.md) • [MAINTENANCE_LOG.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/04-testing-qa/MAINTENANCE_LOG.md)
- **Báo cáo tổng kết & Vấn đáp:** [Bao_cao_BTL_IT3180_Nhom1_Final.docx](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/05-presentations/Bao_cao_BTL_IT3180_Nhom1_Final.docx) • [DEFENSE_PLAYBOOK_QNA.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/05-presentations/DEFENSE_PLAYBOOK_QNA.md)

---

## 4. Hướng dẫn Khởi chạy Nhanh bằng 1 Lệnh Docker Compose (`NFR-07`)

```bash
# 1. Sao chép tệp biến môi trường (tùy chỉnh POSTGRES_PORT / SERVER_PORT nếu cổng 5432 hoặc 8080 trên máy đang bận)
cp .env.example .env

# 2. Dựng và khởi chạy toàn bộ PostgreSQL 16 + Backend Spring Boot + Frontend Nginx (kèm Flyway seed data tự động)
docker compose -p rms up -d --build --wait

# 3. Kiểm tra trạng thái healthy của cả 3 dịch vụ
docker compose -p rms ps
```

- **Giao diện Web (POS / KDS / Admin):** `http://localhost:3000`
- **Tài liệu OpenAPI / Swagger UI:** `http://localhost:8080/swagger-ui.html` *(hoặc cổng `SERVER_PORT` cấu hình trong `.env`)*

### Tài khoản Dữ liệu Mẫu (`V2__seed_data.sql`)

| Vai trò | Tên đăng nhập | Mật khẩu | Màn hình điều hướng mặc định |
| :--- | :---: | :---: | :--- |
| **Quản trị viên (`ADMIN`)** | `admin` | `admin123` | `/admin/menu` & `/admin/dashboard` |
| **Thu ngân / Phục vụ (`STAFF`)** | `staff1` / `staff2` | `staff123` | `/pos/tables` & `/pos/orders/:tableId` |
| **Nhân viên Bếp (`KITCHEN`)** | `kitchen1` | `kitchen123` | `/kds` *(Dark KDS Board)* |

---

## 5. Chạy Kiểm thử & Kiểm tra Độ phủ Độc lập ở Máy Cục bộ

```bash
# Backend: Chạy toàn bộ 61 bài kiểm thử JUnit 5 + kiểm tra cổng cứng JaCoCo (Line >= 80%, Branch >= 75%)
cd backend && ./mvnw -B clean verify

# Frontend: Kiểm tra ESLint + 14 bài kiểm thử Vitest + đóng gói TypeScript/Vite
cd frontend && npm run lint && npm test -- --run && npm run build
```
