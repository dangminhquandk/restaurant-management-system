# Slide 1: Hệ Thống Quản Lý Nhà Hàng Thực Tế
## Báo cáo Khởi tạo & Đặc tả Đề tài — Học phần Nhập môn Công nghệ Phần mềm (IT3180)
- Giảng viên hướng dẫn: TS. Nguyễn Nhất Hải
- Nhóm sinh viên thực hiện:
  - Đặng Minh Quân (Nhóm trưởng) - MSSV: 202416323
  - Đào Trần Hoàng Hải - MSSV: 202416190
  - Vũ Tuấn Anh - MSSV: 202416635
  - Bùi Đại Nghĩa - MSSV: 202416302
  - Nguyễn Đăng Khôi - MSSV: 202416535

---

# Slide 2: Thực Trạng & Khó Khăn Của Nhà Hàng Truyền Thống
## 3 Nút Thắt Lớn Trong Giờ Cao Điểm
- **Quy trình Order giấy thủ công:** Mất 3 - 5 phút để chuyển phiếu gọi món xuống bếp, chữ viết tay vội dễ nhầm lẫn hoặc sót ghi chú món.
- **Lệch pha thông tin giữa Bếp và Sảnh:** Bếp hết món nhưng phục vụ vẫn nhận đơn; món nấu xong nguội trên quầy vì không báo kịp cho phục vụ.
- **Thanh toán chậm & Khó đối soát:** Dễ nhầm lẫn tiền mặt, khách chờ đối soát chuyển khoản lâu, quản lý không nắm bắt được doanh thu tức thời.

---

# Slide 3: Mục Tiêu Đề Tài & Hướng Giải Quyết
## Số Hóa Quy Trình Vận Hành Từ Bàn Ăn Đến Nhà Bếp
- **Đồng bộ thời gian thực (Zero-delay):** Đơn gọi tại bàn lập tức chuyển xuống bếp trong vòng dưới 1 giây.
- **Trực quan hóa sơ đồ bàn:** Nhận biết tức thì trạng thái bàn trống, bàn đang có khách, bàn chờ dọn dẹp.
- **Tự động hóa thanh toán:** Tạo mã VietQR động chuẩn xác theo từng hóa đơn, khách quét mã thanh toán ngay tại bàn.
- **Tối ưu chi phí vận hành:** Loại bỏ hoàn toàn máy in bill giấy truyền thống, thay bằng màn hình tương tác thông minh.

---

# Slide 4: Các Tác Nhân Sử Dụng Hệ Thống
## Phục Vụ 4 Nhóm Đối Tượng Trong Nhà Hàng
- **Thu ngân & Phục vụ bàn:** Mở bàn, gọi món, ghi chú khẩu vị theo yêu cầu của khách và in hóa đơn tạm tính.
- **Nhân viên Bếp & Bar:** Nhận đơn tức thì theo thứ tự ưu tiên, chuyển trạng thái từ đang nấu sang hoàn thành.
- **Chủ quán & Quản lý:** Quản lý danh mục thực đơn, điều chỉnh giá món, xem biểu đồ thống kê doanh thu theo ngày/ca.
- **Khách hàng:** Quét mã VietQR chuyển khoản chính xác số tiền, nhận diện trạng thái thanh toán thành công.

---

# Slide 5: Các Phân Hệ Chức Năng Cốt Lõi
## 4 Trụ Cột Nghiệp Vụ Của Hệ Thống
- **Phân hệ Sơ đồ bàn & POS:** Hiển thị trực quan trạng thái từng bàn theo màu sắc, hỗ trợ tìm kiếm món ăn nhanh và ghi chú chi tiết.
- **Phân hệ Màn hình Bếp (KDS):** Hiển thị danh sách món cần chế biến theo thời gian thực, có chuông báo và nháy sáng khi có món mới.
- **Phân hệ Thanh toán VietQR:** Tự động tạo mã QR chứa đúng số tiền đơn hàng, hỗ trợ cả tiền mặt lẫn chuyển khoản.
- **Phân hệ Quản trị (Admin):** Quản lý thực đơn, phân quyền nhân viên và xuất báo cáo thống kê trực quan.

---

# Slide 6: Yêu Cầu Phi Chức Năng & Điểm Nhấn Kỹ Thuật
## Đảm Bảo Tốc Độ, Tính Toàn Vẹn & Trải Nghiệm Mượt Mà
- **Đồng bộ Real-time qua WebSocket:** Ứng dụng giao thức STOMP giúp kết nối sảnh và bếp tức thời với độ trễ dưới 1 giây, tiết kiệm băng thông.
- **Kiểm soát xung đột dữ liệu:** Xử lý khóa dữ liệu an toàn, ngăn chặn việc hai nhân viên mở trùng một bàn hoặc gọi trùng đơn.
- **Giao diện tối ưu tốc độ (Zero-delay UI):** Thiết kế nút bấm lớn, bố cục rõ ràng, hỗ trợ cảm ứng trên máy tính bảng chỉ với 3 thao tác chạm.
- **Tính sẵn sàng và ổn định:** Hệ thống hoạt động liên tục, tự động kết nối lại khi mạng nội bộ chập chờn.

---

# Slide 7: Kiến Trúc Hệ Thống & Lựa Chọn Công Nghệ
## Mô Hình Phân Tầng Hiện Đại & Chuẩn Doanh Nghiệp
- **Frontend (Giao diện người dùng):** ReactJS, TypeScript, Vite và TailwindCSS — Giao diện nhẹ, mượt mà trên trình duyệt và máy tính bảng.
- **Backend (Xử lý nghiệp vụ):** Java 17 và Spring Boot 3 — Cung cấp RESTful API, bảo mật Spring Security và kênh WebSocket STOMP.
- **Cơ sở dữ liệu:** PostgreSQL — Thiết kế chuẩn hóa 3NF, đảm bảo toàn vẹn giao dịch và an toàn dữ liệu hóa đơn.
- **Đóng gói & Triển khai:** Docker và Docker Compose — Khởi chạy toàn bộ hệ thống dễ dàng trên mọi môi trường chỉ với 1 câu lệnh.

---

# Slide 8: Kế Hoạch Triển Khai Theo Phương Pháp Agile
## Lộ Trình 4 Sprint Kéo Dài Trong 8 Tuần
- **Sprint 1 (Tuần 1 - 2) - Khảo sát & Thiết kế:** Soạn thảo tài liệu đặc tả SRS v1.0, thiết kế CSDL (sơ đồ ERD) và vẽ mẫu giao diện trên Figma.
- **Sprint 2 (Tuần 3 - 4) - Xây dựng Khung nền tảng:** Khởi tạo CSDL, làm chức năng đăng nhập, API sơ đồ bàn và trang Admin quản lý món.
- **Sprint 3 (Tuần 5 - 6) - Bếp Real-time & Thanh toán:** Tích hợp WebSocket báo bếp tức thời, tạo mã VietQR động và API thống kê doanh thu.
- **Sprint 4 (Tuần 7 - 8) - Kiểm thử & Đóng gói:** Viết kịch bản kiểm thử, sửa lỗi, đóng gói bằng Docker và hoàn thiện báo cáo đồ án môn học.

---

# Slide 9: Phân Công Công Việc Trong Nhóm
## Phân Chia Nhiệm Vụ Rõ Người Rõ Việc Cho 5 Thành Viên
- **Đặng Minh Quân (Nhóm trưởng):** Thiết kế cơ sở dữ liệu (ERD), lập trình Backend quản lý bàn & đơn hàng, làm socket báo bếp, quản lý tiến độ chung.
- **Đào Trần Hoàng Hải:** Thiết kế giao diện trên Figma, lập trình Frontend màn hình thu ngân và màn hình hiển thị trong bếp, kết nối API.
- **Vũ Tuấn Anh:** Lập trình trang quản trị Admin (quản lý món/nhân viên), viết các API phục vụ quản trị, cấu hình Docker chạy hệ thống.
- **Bùi Đại Nghĩa:** Chủ trì đặc tả SRS, xây dựng bộ kiểm thử tự động độc lập (JUnit 5 / JaCoCo / Vitest), biểu bảo trì và tổng hợp báo cáo đồ án.
- **Nguyễn Đăng Khôi:** Phối hợp đặc tả nghiệp vụ, lập trình thanh toán quét mã VietQR động EMVCo, in hóa đơn & thống kê doanh thu.

---

# Slide 10: Kết Quả Kỳ Vọng & Lời Cảm Ơn
## Sản Phẩm Bàn Giao Cuối Kỳ & Phiên Hỏi Đáp
- **Ứng dụng Web hoàn chỉnh:** Hoạt động thực tế trên máy tính bảng và desktop với đầy đủ phân hệ Thu ngân, Bếp và Quản trị.
- **Bộ tài liệu kỹ thuật chuẩn mực:** Đặc tả yêu cầu phần mềm (SRS), tài liệu thiết kế CSDL và kịch bản kiểm thử chi tiết.
- **Mã nguồn hoàn chỉnh:** Đóng gói Docker chạy ngay lập tức, lưu trữ công khai trên GitHub.
- **Lời cảm ơn:** Chân thành cảm ơn Thầy/Cô và các bạn đã lắng nghe. Nhóm sẵn sàng nhận câu hỏi và góp ý từ Thầy/Cô!
