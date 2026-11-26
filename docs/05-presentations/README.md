# HỒ SƠ BÁO CÁO TỔNG KẾT, MINH HỌA E2E & BẢO VỆ ĐỒ ÁN (BL-05: v1.0.0)

> **Học phần:** IT3180 — Nhập môn Công nghệ Phần mềm | **GVHD:** TS. Nguyễn Nhất Hải  
> **Đề tài:** Hệ thống Quản lý Nhà hàng Thực tế (*Restaurant Management System — Nhóm 1*)

---

## Danh mục Tệp Bàn giao tại Thư mục này

1. **[Bao_cao_BTL_IT3180_Nhom1_Final.docx](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/05-presentations/Bao_cao_BTL_IT3180_Nhom1_Final.docx)** — Báo cáo Bài tập lớn hoàn chỉnh theo đúng khung **7 chương chuẩn Trường CNTT&TT – ĐH Bách khoa Hà Nội**, tích hợp đầy đủ:
   - Trang bìa, Lời nói đầu, Bảng phân công & đánh giá 5 thành viên (`20%`/người).
   - Khảo sát nghiệp vụ, phạm vi MoSCoW, kế hoạch Agile/Scrum 4 Sprint, quản lý rủi ro RMMM & 5 mốc Baseline SCM.
   - Đặc tả yêu cầu `SRS v1.0` (22 FR, 8 NFR định lượng, hộp đặc tả Use Case chi tiết).
   - Phân tích lớp `Boundary – Control – Entity`, Máy trạng thái hữu hạn và chuẩn hóa CSDL `3NF`.
   - Thiết kế kiến trúc phân tầng, 4 quyết định `ADR`, 3 mẫu thiết kế GoF (`Strategy`, `State`, `Observer`), Từ điển dữ liệu **6 cột** cho cả 10 bảng PostgreSQL và thiết kế giao diện *Tactile Bistro Command*.
   - Thống kê xây dựng, tái cấu trúc Chương 8 (`PR #8`, `PR #9`) và **8 hình chụp giao diện thực tế** từ hệ thống Docker.
   - Kết quả kiểm thử hộp trắng JaCoCo (**97.7% Line / 90.8% Branch**), hộp đen và Biểu quản lý bảo trì **6 cột** chuẩn Chương 9.
   - Hướng dẫn cài đặt 1 lệnh `docker compose -p rms up -d --build` và hướng dẫn sử dụng theo vai trò.

2. **[DEFENSE_PLAYBOOK_QNA.md](file:///Users/quandkh/Documents/Learning%20Hub/restaurant-management-system/docs/05-presentations/DEFENSE_PLAYBOOK_QNA.md)** — Cẩm nang bảo vệ vấn đáp cuối kỳ:
   - Bản đồ quyền sở hữu mã nguồn tới mức `file:symbol:line` cho từng thành viên (`Đặng Minh Quân`, `Đào Trần Hoàng Hải`, `Vũ Tuấn Anh`, `Bùi Đại Nghĩa`, `Nguyễn Đăng Khôi`).
   - Kịch bản trình diễn trực tiếp 5 phút và bộ **15 câu hỏi phản biện chuyên sâu** kèm đáp án gãy gọn.

3. **Thư mục `screenshots/`** — Bộ 8 ảnh chụp màn hình thực tế (`1440px`) trích xuất trực tiếp từ phiên kiểm thử E2E trên `http://localhost:3000`:
   - `01_login_page.png` — Giao diện đăng nhập & chuyển nhanh tài khoản Demo.
   - `02_pos_floor_map.png` — Sơ đồ bàn thời gian thực 3 khu vực / 20 bàn.
   - `03_pos_order_pad.png` — Màn hình gọi món POS kèm ghi chú `"Ít cay, không hành"`.
   - `04_kds_board.png` — Màn hình điều phối bếp KDS nền tối sắp xếp FIFO.
   - `05_kds_out_of_stock.png` — Ngăn kéo Báo Hết Món khẩn cấp khóa POS `< 1s`.
   - `06_pos_vietqr_modal.png` — Hộp thoại thanh toán sinh mã **VietQR động NAPAS 247** (`178.000 ₫`, CRC16 `E986`).
   - `07_admin_dashboard.png` — Biểu đồ thống kê doanh thu & Top 10 món bán chạy.
   - `08_admin_audit_logs.png` — Nhật ký kiểm toán ghi nhận `PAYMENT_CONFIRMED` & `MENU_AVAILABILITY_CHANGED`.
