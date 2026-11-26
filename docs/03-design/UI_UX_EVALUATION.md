# THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG & ĐÁNH GIÁ KHẢ NĂNG SỬ DỤNG (UI/UX EVALUATION)

> **Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) — Chương 7_2: Thiết kế Giao diện Người dùng  
> **Chuẩn quy trình:** Thiết kế lặp lấy người dùng làm trung tâm **ISO 9241-210** (`Bai 07_2` P16–17)  
> **Chủ trì:** Đào Trần Hoàng Hải (`202416190` — UI/UX Lead) | **Baseline:** `BL-02` (`v0.2.0-design`)

---

## 1. Phân Tích Người Dùng & Tác Vụ Thực Tế (`Bai 07_2` P19–24)

| Nhóm người dùng | Môi trường vật lý & Thiết bị | Đặc điểm thao tác | Yêu cầu giao diện bắt buộc |
| :--- | :--- | :--- | :--- |
| **Phục vụ / Thu ngân (`STAFF`)** | Sảnh ăn đông người, ánh sáng ấm/mạnh; cầm **Tablet (768–1024px)** hoặc đứng quầy POS cảm ứng (1280px+). | Đứng thao tác bằng 1 tay, khách đang chờ gọi món bên cạnh, dễ chạm nhầm nếu nút nhỏ. | • Nút chạm chính **`≥ 48×48 px`** (vượt ngưỡng tối thiểu `44×44 px` theo Luật Fitts `Bai 07_2` P41).<br>• Mở bàn → Chọn món → Gửi bếp trong **`≤ 3 lần chạm`**.<br>• Tìm món không cần gõ dấu tiếng Việt (`"pho bo"` khớp `"Phở Bò"`). |
| **Đầu bếp / Pha chế (`KITCHEN`)** | Khu vực bếp nóng, ồn, ánh sáng đèn huỳnh quang gắt, tay ướt/dầu; **Màn hình 24"+ treo tường**. | Đứng cách màn hình `1.5–2.5 m`, không dùng chuột hay bàn phím vật lý. | • Chế độ nền tối độ tương phản cao (`#0F172A`, tỷ lệ tương phản chữ `> 10:1` chuẩn WCAG AAA).<br>• Cỡ chữ tên món `≥ 18–20px` đậm, ghi chú khẩu vị đóng khung màu hổ phách nổi bật.<br>• Chuông báo âm thanh Web Audio + viền sáng nhấp nháy khi có đơn mới; đồng hồ SLA đổi màu. |
| **Quản lý (`ADMIN`)** | Văn phòng yên tĩnh; **Laptop / Desktop (1280–1920px)**. | Sử dụng chuột & bàn phím để nhập thực đơn, đối soát hóa đơn, xem biểu đồ. | • Bảng dữ liệu rõ ràng, có bộ lọc tức thì, biểu mẫu có kiểm tra hợp lệ ngay trên trường nhập và hộp thoại xác nhận trước khi xóa/khóa. |

---

## 2. Định Hướng Thẩm Mỹ & Hệ Thống Thiết Kế ("Tactile Bistro Command")

Để tránh giao diện khung mẫu chung chung, hệ thống thiết kế thống nhất triết lý **"Tactile Bistro Command"** tuân thủ 3 Quy tắc Vàng của `Bai 07_2` P10 (*Đặt người dùng trong sự kiểm soát – Giảm tải bộ nhớ ngắn hạn – Duy trì tính nhất quán*):

### 2.1 Bảng Biến Màu Ngữ Nghĩa & Kiểu Chữ (`Bai 07_2` P56 — Tối đa 3 nhóm font/màu chữ)
```css
:root {
  /* POS & Admin Surface (Warm Stone — dịu mắt suốt ca làm việc 8 tiếng) */
  --bg-canvas: #FAF8F5;
  --bg-surface: #FFFFFF;
  --text-primary: #1C1917;
  --text-secondary: #57534E;
  --accent-brand: #C2410C;      /* Terracotta Bistro — nút hành động chính */

  /* Trạng thái Sơ đồ Bàn (Nhận diện trong < 0.5 giây không cần đọc chữ) */
  --status-available: #059669;  /* Xanh ngọc: Bàn trống */
  --status-occupied: #E11D48;   /* Đỏ hồng: Đang phục vụ */
  --status-payment: #D97706;    /* Cam hổ phách: Chờ thanh toán */
  --status-cleaning: #0284C7;   /* Xanh lam: Chờ dọn bàn */

  /* KDS Surface (High-Contrast Slate — chống lóa trong bếp) */
  --kds-canvas: #0F172A;
  --kds-card: #1E293B;
  --kds-note-highlight: #F59E0B;
}
```
- **Typography:** Sử dụng `Plus Jakarta Sans` / `Inter` hỗ trợ trọn vẹn dấu tiếng Việt, số liệu tiền tệ bật `font-variant-numeric: tabular-nums` để các cột giá tiền luôn thẳng hàng tuyệt đối.

---

## 3. Phác Thảo Bố Cục Đơn Sắc (Lo-Fi Wireframes — `Bai 07_2` P46–55)

### 3.1 Màn hình Sơ đồ Bàn & Gọi món POS (`/pos/tables` & `/pos/orders/:tableId`)
```text
+-----------------------------------------------------------------------------------+
| [BÁCH KHOA BISTRO]  [Sơ đồ bàn] [Lịch sử HĐ]     [● Online STOMP] [Hải - STAFF ⏻] |
+-----------------------------------------------------------------------------------+
| Khu vực: (● Tất cả 20) ( Tầng 1: 8 ) ( Tầng 2: 8 ) ( Sân vườn: 4 )                |
| Chú thích: [■ Trống: 14] [■ Có khách: 4] [■ Chờ TT: 1] [■ Chờ dọn: 1]             |
+-----------------------------------------------------------------------------------+
| +-----------------+  +-----------------+  +-----------------+  +-----------------+ |
| | BÀN T1-01  [4p] |  | BÀN T1-02  [4p] |  | BÀN T1-03  [6p] |  | BÀN T1-04  [2p] | |
| | ● ĐANG PHỤC VỤ  |  | ○ BÀN TRỐNG     |  | ◆ CHỜ THANH TOÁN|  | ◊ CHỜ DỌN BÀN   | |
| | ORD-0101        |  |                 |  | ORD-0099        |  |                 | |
| | 485.000 đ       |  | [ + MỞ BÀN ]    |  | 620.000 đ       |  | [ ✓ ĐÃ DỌN ]    | |
| +-----------------+  +-----------------+  +-----------------+  +-----------------+ |
+-----------------------------------------------------------------------------------+

Màn hình Gọi món (/pos/orders/1 — Chia 2 cột cố định, không cuộn ngang):
+------------------------------------------------+----------------------------------+
| [← Sơ đồ] Tìm món: [ pho bo...            ✕ ]  | BÀN T1-01 • ORD-0101  [Chuyển/Gộp]|
| [Tất cả] [Khai vị] [Món chính] [Lẩu] [Đồ uống] |----------------------------------|
|------------------------------------------------| Đã gửi bếp:                      |
| +--------------------+ +--------------------+  | • 2x Phở Bò Tái Lăn   [ĐANG NẤU] |
| | Phở Bò Tái Lăn     | | Bún Chả Hà Nội     |  |   Ghi chú: ít hành               |
| | 65.000 đ      [+]  | | [TẠM HẾT - KHÓA]   |  |----------------------------------|
| +--------------------+ +--------------------+  | Giỏ gọi thêm (Lượt mới):         |
| +--------------------+ +--------------------+  | • 1x Nem Rán Hà Nội    [-][1][+] |
| | Nem Rán Hà Nội     | | Trà Đào Cam Sả     |  |   [Ghi chú: chấm nước mắm nhạt ] |
| | 55.000 đ      [+]  | | 35.000 đ      [+]  |  |----------------------------------|
| +--------------------+ +--------------------+  | Tạm tính:              185.000 đ |
|                                                | [ GỬI BẾP NGAY ]  [ THANH TOÁN ] |
+------------------------------------------------+----------------------------------+
```

### 3.2 Màn hình Điều phối Bếp KDS (`/kds`)
```text
+-----------------------------------------------------------------------------------+
| [KDS BẾP TRUNG TÂM]   Đang chờ: 3 | Đang nấu: 2   [🔔 Chuông: BẬT] [📦 Báo Hết Món]|
+-----------------------------------------------------------------------------------+
| +-------------------------+ +-------------------------+ +-----------------------+ |
| | BÀN T1-01     ⏱ 08:15 ⚠ | | BÀN T2-03     ⏱ 02:10   | | BÀN SV-01   ⏱ 00:12 ✨| |
| | Đơn: ORD-0101 • Lượt #1 | | Đơn: ORD-0102 • Lượt #1 | | Đơn: ORD-0101•Lượt #2 | |
| |-------------------------| |-------------------------| |-----------------------| |
| | 2x Phở Bò Tái Lăn       | | 1x Lẩu Thái Hải Sản     | | 1x Nem Rán Hà Nội     | |
| | ⚠ Ghi chú: ÍT CAY, K.HÀNH| |                         | | ⚠ chấm nước mắm nhạt | |
| | [ ✓ HOÀN TẤT (READY) ]  | | [ 🔥 BẮT ĐẦU NẤU ]      | | [ 🔥 BẮT ĐẦU NẤU ]    | |
| +-------------------------+ +-------------------------+ +-----------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 4. Đánh Giá Thiết Kế Giao Diện Theo 5 Thuộc Tính Sử Dụng (`Bai 07_2` P31–33)

Nhóm áp dụng khung đánh giá định lượng trên thang điểm `1–5` đối với 5 thuộc tính chuẩn của bài giảng Chương 7_2 trên kịch bản mẫu (gồm 4 thành viên đóng vai chéo và 2 sinh viên ngoài nhóm thử nghiệm trên wireframe/prototype):

| Thuộc tính (`Bai 07_2` P32) | Chỉ số đo lường cụ thể | Mục tiêu thiết kế | Điểm đạt (TB / 5.0) | Cải tiến giao diện đã thực hiện sau góp ý |
| :--- | :--- | :--- | :---: | :--- |
| **1. Khả năng học** (*Learnability*) | Thời gian người mới tự mở bàn và gửi xong đơn đầu tiên không cần hướng dẫn | `< 60 giây` | **4.8 / 5.0** | Bổ sung thanh chú thích số lượng bàn theo từng màu ngay đầu sơ đồ bàn và nút điền nhanh tài khoản demo ở trang Login. |
| **2. Tốc độ vận hành** (*Throughput*) | Số thao tác chạm từ màn hình sơ đồ bàn tới khi gửi xong 1 món xuống KDS | `≤ 3 chạm` | **4.7 / 5.0** | Cho phép chạm thẳng vào thẻ món là cộng `+1` vào giỏ ngay thay vì mở popup trung gian; ô ghi chú mở sẵn ngay dưới dòng món. |
| **3. Mức độ chịu lỗi** (*Error Tolerance*) | Ngăn chặn thao tác sai (đặt món hết, nhập số âm, xóa bàn đang có khách, mở trùng bàn) | `100%` có rào chắn | **4.8 / 5.0** | Khóa cứng nút chọn món ngay khi nhận sự kiện STOMP `isAvailable=false`; vô hiệu hóa nút xóa bàn đang phục vụ. |
| **4. Khả năng khôi phục** (*Recoverability*) | Xử lý khi rớt mạng LAN hoặc nhận lỗi `409 Conflict` khi 2 người mở cùng bàn | Không mất dữ liệu giỏ | **4.6 / 5.0** | Thêm `ConnectionStatusBanner` màu đỏ khi mất STOMP nhưng giữ nguyên giỏ món cục bộ; khi gặp `409` tự tải lại sơ đồ bàn kèm thông báo rõ nguyên nhân. |
| **5. Tính tương thích** (*Compatibility*) | Độ phù hợp với thói quen thực tế của thu ngân, phục vụ cầm tablet và đầu bếp đứng xa | Tương thích Desktop & Tablet | **4.7 / 5.0** | Tách hẳn giao diện nền tối chữ lớn cho `/kds` thay vì dùng chung giao diện nền sáng chữ nhỏ của trang Admin. |
