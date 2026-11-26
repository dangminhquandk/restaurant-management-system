# HỒ SƠ ĐẢM BẢO CHẤT LƯỢNG, KIỂM THỬ & BẢO TRÌ PHẦN MỀM (QA — BL-05: v1.0.0)

> **Học phần:** IT3180 — Chương 8 (Xây dựng & Tái cấu trúc Mã nguồn) & Chương 9 (Đảm bảo Chất lượng & Bảo trì)  
> **Mốc Baseline bàn giao:** `BL-05 (v1.0.0)` — Đã nghiệm thu tự động trên CI & Docker E2E  
> **Chủ trì:** Bùi Đại Nghĩa *(QA Lead)* — Tuân thủ nguyên tắc kiểm thử chéo độc lập với tác giả viết module (`Bai 09` trang 11).

---

## Danh mục Tài liệu Đã Bàn giao Chính thức

1. **[STP_v1.0.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/04-testing-qa/STP_v1.0.md) — Kế hoạch & Báo cáo Kết quả Kiểm thử Phần mềm (Software Test Plan & Report):**
   - Chiến lược V&V 4 mức: Unit Testing (JUnit 5 + Mockito, Vitest) → Integration Testing (MockMvc, Optimistic Locking 5 luồng, STOMP Latency `< 1s`) → System E2E Testing (Docker + Chrome thật) → Validation Testing (đối chiếu 100% `FR-01..22` và `NFR-01..08`).
   - **Kiểm thử Hộp trắng (`Bai 09` P13–27):** Đồ thị luồng điều khiển (**CFG**), độ phức tạp Cyclomatic $V(G)$ và tập đường đi cơ sở cho 3 hàm cốt lõi (`TableService.openTable`, `OrderItemStateMachine.validateTransition`, `PaymentService.confirmPayment`).
   - **Số liệu độ phủ JaCoCo thực tế (`jacoco:check` enforced):**
     - `com.hust.rms.domain.state`: **100.0% Line (`39/39`)**, **100.0% Branch (`32/32`)**
     - `com.hust.rms.domain.payment`: **100.0% Line (`28/28`)**, **100.0% Branch (`6/6`)**
     - `com.hust.rms.service`: **97.7% Line (`823/842`)**, **90.8% Branch (`227/250`)**
   - **Kiểm thử Hộp đen (`Bai 09` P28–35):** Phân vùng tương đương (EP), Giá trị biên (BVA), Bảng quyết định (Decision Table) và Kiểm thử chuyển đổi trạng thái (State Transition) với **45 ca kiểm thử thực thi đạt `100% PASS`**.

2. **[MAINTENANCE_LOG.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/04-testing-qa/MAINTENANCE_LOG.md) — Kế hoạch Bảo trì & Biểu Quản lý Bảo trì (`Bai 09` P41–52):**
   - Chiến lược bảo trì theo 4 hình thái (Tu chỉnh, Thích nghi, Hoàn thiện, Phòng ngừa).
   - Bằng chứng tái cấu trúc mã nguồn Chương 8 qua 2 PR độc lập (`PR #8` & `PR #9`) bảo toàn 100% hành vi nghiệp vụ.
   - Biểu quản lý bảo trì thực tế đủ **6 cột bắt buộc** theo đúng mẫu bài giảng `Bai 09` trang 48.
