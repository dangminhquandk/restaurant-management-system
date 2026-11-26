# HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM)

> **Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) — Trường CNTT&TT, Đại học Bách khoa Hà Nội  
> **Giảng viên hướng dẫn:** TS. Nguyễn Nhất Hải  
> **Phương pháp phát triển:** Agile / Scrum (4 Sprint — 8 tuần)  
> **Mô hình kiến trúc:** Layered Architecture (Controller – Service – Repository) + Event-Driven (WebSocket STOMP)  
> **Baseline hiện tại:** `v0.1.0-srs` *(Sprint 1 — Yêu cầu & Quản lý dự án/SCM)*

---

## 1. Thành viên Nhóm 1 & Phân công Công việc

| STT | Họ và tên | MSSV | Vai trò CNPM | Nhiệm vụ kỹ thuật chính |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Đặng Minh Quân** | `202416323` | **Project Manager / Scrum Master** | • Thiết kế CSDL (ERD, DDL 3NF) & Quản lý tiến độ Sprint<br>• Backend (Spring Boot): Quản lý bàn (`@Version` Optimistic Locking), tạo đơn gọi món & kênh WebSocket STOMP báo bếp |
| **2** | **Đào Trần Hoàng Hải** | `202416190` | **UI/UX Lead** *(Figma & Usability Eval)* | • Phân tích người dùng/tác vụ, Wireframe → Style Guide → Figma Prototype & Khảo sát đánh giá UI<br>• Frontend (ReactJS + TS): Màn hình Thu ngân/Phục vụ (POS) & Màn hình Bếp (KDS) |
| **3** | **Vũ Tuấn Anh** | `202416635` | **Configuration Manager** *(SCM, Git, Docker, CI)* | • Quản lý cấu hình, nhánh Git, CI/CD & Đóng gói Docker Compose<br>• Backend Auth/JWT/RBAC & Phân hệ Quản trị (Admin API + Admin Portal CRUD) |
| **4** | **Bùi Đại Nghĩa** | `202416302` | **QA & Documentation Lead** *(Test Plan, RTM, Maintenance)* | • Xây dựng SRS/RTM, Test Plan (White-box/Black-box) & Biểu quản lý bảo trì<br>• Module thanh toán VietQR động (NAPAS EMVCo CRC16) & API/UI Thống kê doanh thu *(kiểm thử chéo bởi thành viên khác)* |

---

## 2. Kiến trúc Hệ thống & Công nghệ Sử dụng

Hệ thống được tổ chức theo mô hình **Modular Monolith phân tầng (Layered Architecture)** kết hợp **Event-Driven (WebSocket STOMP)**, áp dụng các nguyên lý **SOLID**, **High Cohesion – Loose Coupling**, và 3 Design Patterns cốt lõi:
- **Strategy Pattern:** Đóng gói các phương thức thanh toán (`CashPaymentStrategy`, `VietQRPaymentStrategy`) bảo đảm nguyên lý Open-Closed (OCP).
- **Observer / Pub-Sub Pattern:** Phát sự kiện đơn hàng mới, cập nhật chế biến và trạng thái hết món qua STOMP Broker.
- **State Pattern:** Ràng buộc chuyển đổi trạng thái hợp lệ cho Bàn ăn (`AVAILABLE → OCCUPIED → WAITING_PAYMENT → CLEANING`) và Món KDS (`PENDING → COOKING → READY → SERVED/CANCELLED`).

**Tech Stack:**
- **Backend:** Java 17+, Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security + JWT, Spring WebSocket / STOMP), JUnit 5 + Mockito + JaCoCo.
- **Frontend:** ReactJS (TypeScript, Vite, TailwindCSS), `@stomp/stompjs`, Vitest, ESLint + Prettier.
- **Database:** PostgreSQL 16 (chuẩn hóa 3NF, ràng buộc ACID, cột `version` cho Optimistic Locking).
- **DevOps & SCM:** Docker, Docker Compose, GitHub Actions CI, Git Flow tối giản.

---

## 3. Phạm vi Nghiệp vụ (MoSCoW)

Hệ thống phục vụ 4 nhóm tác nhân tại nhà hàng phục vụ tại chỗ (Dine-in, quy mô 20–50 bàn): **Phục vụ/Thu ngân**, **Bếp/Bar**, **Quản lý/Chủ quán**, và **Khách hàng**.

### Must-Have (Phạm vi cam kết bàn giao)
1. **Xác thực & Phân quyền (Auth/RBAC):** Đăng nhập JWT, phân quyền theo vai trò (`ADMIN`, `STAFF`, `KITCHEN`).
2. **Sơ đồ Bàn & POS (Point of Sale):** Hiển thị trạng thái bàn thời gian thực theo khu vực; mở bàn có **Optimistic Locking (`@Version`)** chống mở trùng; gọi món kèm ghi chú khẩu vị; chuyển/gộp bàn.
3. **Màn hình Bếp (KDS) Real-time:** Nhận đơn qua WebSocket STOMP (< 1s), sắp xếp FIFO, phát âm thanh + nháy viền cảnh báo món mới, cập nhật trạng thái 2 chiều, tự động reconnect khi rớt mạng LAN, và **đồng bộ khóa món "Hết món" tức thì** sang POS.
4. **Thanh toán & VietQR động:** Thanh toán tiền mặt hoặc sinh mã **VietQR động chuẩn NAPAS EMVCo (CRC16-CCITT)** theo đúng số tiền và mã đơn hàng.
5. **Quản trị & Báo cáo (Admin):** CRUD Danh mục, Món ăn (bật/tắt trạng thái còn món), Bàn, Nhân viên; thống kê doanh thu theo ngày/ca và Top 10 món bán chạy.
6. **Triển khai:** Khởi chạy toàn bộ hệ thống bằng 1 lệnh `docker compose up` kèm dữ liệu mẫu (`seed.sql`).

### Should-Have / Could-Have / Won't-Have
- **Should-Have:** Xem/in hóa đơn tạm tính & hóa đơn thanh toán; tra cứu lịch sử hóa đơn; Audit Log cho thao tác nhạy cảm (hủy món, đổi giá, xác nhận thanh toán).
- **Could-Have *(chỉ làm nếu dư thời gian Sprint 4)*:** Mã giảm giá (Voucher) đơn giản, tách hóa đơn lẻ theo món.
- **Won't-Have *(ngoài phạm vi IT3180)*:** Tích điểm thành viên (Membership/Loyalty), đa chi nhánh (Multi-tenant), quản lý kho nguyên liệu, chấm công khuôn mặt, webhook ngân hàng tự động đối soát số dư thật.

---

## 4. Cấu trúc Repository & Bộ Hồ sơ Kỹ nghệ Phần mềm

```text
restaurant-management-system/
├── .github/                       # Templates (User Story, Bug, CR, PR Checklist) & CI Workflow
├── docs/
│   ├── 01-project-management/     # Kế hoạch QLDA, WBS, Risk-RMMM, Product Backlog, Kế hoạch SCM
│   ├── 02-requirements/           # Đặc tả yêu cầu SRS v1.0 (DFD, UML, FSM, ERD, RTM)
│   ├── 03-design/                 # Tài liệu thiết kế SDD (Kiến trúc, Patterns, DDL, UI/UX Eval)
│   ├── 04-testing-qa/             # Kế hoạch kiểm thử STP (White-box CFG, Black-box, Bảo trì)
│   └── 05-presentations/          # Báo cáo đề xuất đề tài, Slide outline & Kịch bản thuyết trình
├── backend/                       # Mã nguồn Backend Spring Boot 3 (khởi tạo từ Sprint 2)
├── frontend/                      # Mã nguồn Frontend ReactJS + TS (khởi tạo từ Sprint 2)
├── .env.example                   # Mẫu biến môi trường cho DB, Backend, Frontend
├── CHANGELOG.md                   # Lịch sử phiên bản & Baselines
├── LICENSE
└── README.md
```

**Liên kết nhanh tài liệu Sprint 1:**
- [Kế hoạch Quản lý Dự án & Rủi ro (WBS, Gantt, RMMM)](docs/01-project-management/PROJECT_MANAGEMENT_PLAN.md)
- [Product Backlog & Sprint 1 Backlog](docs/01-project-management/PRODUCT_BACKLOG.md)
- [Kế hoạch Quản lý Cấu hình Phần mềm (SCM Plan)](docs/01-project-management/SCM_PLAN.md)
- [Đặc tả Yêu cầu Phần mềm (SRS v1.0 & RTM)](docs/02-requirements/SRS_v1.0.md)

---

## 5. Quy trình Quản lý Cấu hình (Git Workflow)

- **Nhánh chính:** `main` (chỉ chứa bản phát hành/Baseline ổn định), `develop` (tích hợp tính năng).
- **Nhánh làm việc:** `feature/<ma-us>-<mo-ta>`, `fix/<ma-bug>-<mo-ta>`, `docs/<noi-dung>`.
- **Commit Convention:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` (theo Conventional Commits).
- **Quy tắc Pull Request:** Mọi thay đổi vào `develop` hoặc `main` phải qua PR kèm **Code Review Checklist** và được ít nhất 1 thành viên khác review trước khi merge.

---

## 6. Hướng dẫn Cài đặt & Khởi chạy (Dự kiến từ Sprint 2)

```bash
# 1. Clone kho mã nguồn
git clone https://github.com/dangminhquandk/restaurant-management-system.git
cd restaurant-management-system

# 2. Tạo file cấu hình môi trường
cp .env.example .env

# 3. Khởi chạy toàn bộ hệ thống bằng Docker Compose (sau khi khởi tạo backend/ & frontend/)
docker compose up -d --build
```
