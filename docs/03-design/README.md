# TÀI LIỆU THIẾT KẾ PHẦN MỀM & GIAO DIỆN (DESIGN — SPRINT 2)

> **Học phần:** IT3180 — Chương 7_1 (Thiết kế Phần mềm) & Chương 7_2 (Thiết kế Giao diện Người dùng)  
> **Mốc Baseline mục tiêu:** `BL-02` (`v0.2.0-design`, Sprint 2 — Tuần 3)  
> **Chủ trì:** Đặng Minh Quân *(Kiến trúc & Dữ liệu)*, Đào Trần Hoàng Hải *(UI/UX & Đánh giá)*

---

## Danh mục Hồ sơ Sẽ Bàn giao tại Thư mục này

1. **`SDD_v1.0.md` — Tài liệu Thiết kế Hệ thống (Software Design Description):**
   - **Thiết kế Kiến trúc (`Bai 07_1` P40–52):** Sơ đồ Layered Architecture (Controller – Service – Repository – Data) + Event-Driven WebSocket STOMP; bảng phân tích đánh đổi (*Trade-off Analysis*) giải thích vì sao chọn Modular Monolith thay vì Microservices và STOMP thay vì HTTP Polling.
   - **Nguyên lý Thiết kế & Design Patterns (`Bai 07_1` P21–25, P58, P73–77):**
     - Chứng minh High Cohesion – Loose Coupling và nguyên lý SOLID (OCP, DIP, SRP, ISP).
     - Chi tiết thiết kế 3 Design Patterns: **Strategy Pattern** (`CashPaymentStrategy`, `VietQRPaymentStrategy`), **Observer / Pub-Sub** (STOMP events), và **State Pattern** (chuyển trạng thái Bàn & Món KDS).
   - **Thiết kế Chi tiết Lớp (`Bai 07_1` P32–33, P56):** Class Diagram phân loại rõ Entity, Boundary (Controller/DTO), Control (Service).
   - **Thiết kế Dữ liệu 3NF (`Bai 07_1` P69–70):** Mô hình dữ liệu logic → vật lý, **Data Dictionary** đầy đủ từng cột, ràng buộc khóa ngoại, chỉ mục (Index) và cột `version` cho Optimistic Locking.
   - **Sơ đồ Triển khai (Deployment Diagram — `Bai 07_1` P61):** Cấu trúc Docker containers (PostgreSQL, Spring Boot, Nginx/React) trong mạng nội bộ LAN của nhà hàng.
2. **`schema.sql` & `seed.sql`:** Script khởi tạo bảng chuẩn PostgreSQL 16 và dữ liệu mẫu (3 khu vực, 20 bàn, 4 danh mục, 20+ món ăn, tài khoản mẫu cho 3 vai trò).
3. **`UI_UX_EVALUATION.md` (`Bai 07_2` P16–56):**
   - Quy trình lặp ISO 9241-210: Phân tích người dùng & tác vụ → Phác thảo Wireframe đơn sắc (Lo-Fi) → Style Guide (màu sắc, typography, nút ≥ 44×44 px theo Luật Fitts) → Figma Hi-Fi Prototype.
   - Báo cáo **Khảo sát Đánh giá UI** (tối thiểu 5–10 người thử nghiệm) theo đúng 5 thuộc tính sử dụng của `Bai 07_2` P32 (*Khả năng học, Tốc độ vận hành, Chịu lỗi, Khả năng khôi phục, Tương thích*) kèm các cải tiến UI sau đánh giá.
