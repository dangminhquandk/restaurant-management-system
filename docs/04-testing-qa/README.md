# TÀI LIỆU ĐẢM BẢO CHẤT LƯỢNG, KIỂM THỬ & BẢO TRÌ (QA — SPRINT 2–4)

> **Học phần:** IT3180 — Chương 8 (Xây dựng & Code Review) & Chương 9 (Đảm bảo Chất lượng & Bảo trì)  
> **Mốc Baseline mục tiêu:** Chạy song song từ Sprint 2 (`BL-03`) và đóng băng cuối Sprint 4 (`BL-05: v1.0.0`)  
> **Chủ trì:** Bùi Đại Nghĩa *(QA Lead)* — Nguyên tắc bắt buộc: **Người viết test / kiểm thử độc lập với tác giả viết module đó** (`Bai 09` P11).

---

## Danh mục Hồ sơ Sẽ Bàn giao tại Thư mục này

1. **`STP_v1.0.md` — Kế hoạch & Kết quả Kiểm thử Phần mềm (Software Test Plan):**
   - **Mô hình V&V 4 mức (`Bai 09` P5–7):** Kiểm thử đơn vị (JUnit 5 / Vitest) → Kiểm thử tích hợp (Spring `MockMvc` / WebSocket STOMP / Concurrency) → Kiểm thử hệ thống (E2E POS–KDS–VietQR) → Kiểm thử xác nhận (nghiệm thu theo `SRS_v1.0.md`).
   - **Kiểm thử Hộp trắng (`Bai 09` P13–27):**
     - Vẽ **Đồ thị Luồng Điều khiển (Control Flow Graph — CFG)** cho tối thiểu 3 hàm nghiệp vụ cốt lõi:
       1. `TableService.openTable()` (kiểm soát trạng thái & Optimistic Locking).
       2. `OrderItemStateMachine.transition()` (ràng buộc chuyển trạng thái món KDS).
       3. `PaymentService.calculateAndSettle()` (tính tổng tiền, kiểm tra điều kiện thanh toán).
     - Bảng ca kiểm thử chứng minh **Statement Coverage** và **Branch Coverage** kèm ảnh/số liệu báo cáo **JaCoCo (mục tiêu ≥ 75% cho tầng Service)**.
   - **Kiểm thử Hộp đen (`Bai 09` P28–35):**
     - **Phân vùng tương đương (Equivalence Partitioning) & Giá trị biên (BVA):** Giá món ăn (`< 0`, `0`, `> 0`), số lượng gọi món (`0`, `1`, `99`), khoảng ngày báo cáo.
     - **Bảng quyết định (Decision Table):** Quy tắc hủy món theo 2 điều kiện `(Trạng thái món: PENDING / COOKING / READY) × (Vai trò: STAFF / ADMIN)` và quy tắc xóa bàn `(Đang có khách / Trống)`.
     - **Kiểm thử Chuyển đổi Trạng thái (State Transition Testing):** Kiểm thử toàn bộ cung hợp lệ và cung cấm trên máy trạng thái `DINING_TABLES` và `ORDER_ITEMS`.
2. **`MAINTENANCE_LOG.md` — Kế hoạch Bảo trì & Biểu Quản lý Bảo trì (`Bai 09` P41–52):**
   - Kế hoạch bảo trì theo 4 hình thái: **Tu chỉnh** (sửa bug), **Thích nghi** (cập nhật môi trường Docker/PostgreSQL/trình duyệt), **Cải tiến** (mở rộng voucher/tách bill), **Phòng ngừa** (refactoring & tối ưu query).
   - **Biểu quản lý bảo trì & sửa lỗi** đúng chuẩn mẫu `Bai 09` P48 gồm 6 cột bắt buộc: *Ngày tháng/giờ, Nguyên nhân, Tóm tắt cách khắc phục, Chi tiết khắc phục & Hiệu ứng làn sóng (Regression check), Người làm bảo trì, Số công*.
3. **Bằng chứng Code Review & Refactoring (`Bai 08` P33–45):**
   - Tổng hợp danh sách các Pull Request có thực hiện **Code Review Checklist** và ít nhất 2–3 PR `refactor:` kèm minh chứng toàn bộ unit/integration test vẫn pass sau refactoring.
