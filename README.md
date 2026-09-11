# HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM)

> **Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) - Đại học Bách khoa Hà Nội
> **Phương pháp phát triển:** Agile / Scrum
> **Mô hình kiến trúc:** Phân tầng MVC (Model - View - Controller)

---

## 1. Nhóm Thực hiện & Phân công Trách nhiệm

Dự án được vận hành bởi nhóm 3 thành viên với cơ cấu chức danh và trách nhiệm chéo (Cross-functional team) nhằm đảm bảo tính liên tục của project:

## 1. Thành viên nhóm & Phân công công việc

| STT | Họ và tên | MSSV | Vai trò | Nhiệm vụ chính phụ trách |
| :---: | :--- | :---: | :--- | :--- |
| **1** | Đặng Minh Quân | `202416323` | Trưởng nhóm | • Thiết kế CSDL (ERD, SQL migration)<br>• Viết Backend (Spring Boot): API Quản lý bàn, Order, WebSocket đồng bộ Bếp<br>• Quản lý repo Git và điều phối tiến độ |
| **2** | Đào Trần Hoàng Hải | `2024xxxx` | Thành viên | • Thiết kế giao diện (Figma)<br>• Viết Frontend (ReactJS): Giao diện POS Thu ngân & Màn hình Bếp (KDS)<br>• Tích hợp API và WebSocket phía Client |
| **3** | Nguyễn Đại Nghĩa | `2024xxxx` | Thành viên | • Phát triển mô-đun Thanh toán VietQR & Thống kê doanh thu<br>• Viết kịch bản kiểm thử (Test cases) và thực hiện test chức năng<br>• Tổng hợp Báo cáo đồ án và làm Slide bảo vệ |

---

## 2. Kiến trúc Hệ thống & Công nghệ Sử dụng

Hệ thống được thiết kế theo mẫu kiến trúc tách bạch mối quan tâm (Separation of Concerns):

* **Backend:** Java 17+, Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security, Spring WebSocket / STOMP).
* **Frontend:** ReactJS (TypeScript, Vite, TailwindCSS / Ant Design).
* **Database:** PostgreSQL (Mô hình CSDL quan hệ chuẩn hóa 3NF).
* **Real-time Sync:** WebSocket đảm bảo độ trễ đồng bộ trạng thái đơn hàng < 1s.
* **DevOps & Môi trường:** Docker, Docker Compose.

---

## 3. Các Phân hệ Nghiệp vụ Cốt lõi (Core Feature Modules)

Hệ thống đáp ứng 4 nhóm tác nhân (Actors): Khách hàng, Thu ngân/Phục vụ, Bếp/Bar và Quản lý:

1. **Phân hệ Bàn & POS (Point of Sale):**
   * Hiển thị trạng thái sơ đồ bàn thời gian thực (Trống, Đang ăn, Đã đặt, Cần dọn).
   * Tạo đơn gọi món tại bàn, hỗ trợ ghi chú khẩu vị (ít cay, không hành), chuyển order tức thì xuống bếp.
2. **Phân hệ Màn hình Bếp (Kitchen Display System - KDS):**
   * Nhận dữ liệu real-time từ sảnh qua WebSocket, sắp xếp đơn theo thứ tự ưu tiên (FIFO).
   * Cập nhật trạng thái chế biến: *Chờ làm* $\rightarrow$ *Đang nấu* $\rightarrow$ *Hoàn tất*.
   * Phát tín hiệu âm thanh cảnh báo khi có món mới phát sinh.
3. **Phân hệ Thanh toán & Nghiệp vụ Mở rộng:**
   * Tách/gộp hóa đơn linh hoạt, áp dụng voucher giảm giá, tích điểm thành viên.
   * Tự động tạo mã thanh toán VietQR động kèm nội dung đơn hàng.
4. **Phân hệ Quản trị & Báo cáo Doanh thu:**
   * Quản lý danh mục món ăn (Menu), bật/tắt trạng thái món tạm hết.
   * Báo cáo thống kê doanh thu theo ngày/ca và biểu đồ Top 10 món bán chạy.

---

## 4. Hướng dẫn Cài đặt & Chạy Cục bộ (Local Development)

### Yêu cầu tiên quyết
* Git installed
* Docker & Docker Compose
* JDK 17+ & Maven 3.8+
* Node.js 18+ & npm/yarn

### Các bước khởi chạy

**Bước 1: Clone kho mã nguồn**
```bash
git clone [https://github.com/dangminhquandk/restaurant-management-system.git](https://github.com/dangminhquandk/restaurant-management-system.git)
cd restaurant-management-system
