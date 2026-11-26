# ADR-0004: Sinh Mã Thanh Toán VietQR Động Chuẩn NAPAS EMVCo (CRC16-CCITT) Kết Hợp Cấu Hình Động

## Status
Accepted — Baseline `BL-02` (`v0.2.0-design`)

## Context
Yêu cầu `FR-17` và `NFR-08` đặt mục tiêu tự động hóa thanh toán chuyển khoản tại bàn thông qua mã **VietQR động**: khi khách dùng bất kỳ ứng dụng Mobile Banking nào tại Việt Nam quét mã, ứng dụng phải tự động nhận diện đúng ngân hàng thụ hưởng, số tài khoản, **số tiền chính xác của hóa đơn** và **nội dung tham chiếu mã đơn hàng** mà nhân viên không phải nhập tay. Đồng thời, kho mã nguồn công khai trên GitHub không được chứa thông tin tài khoản cá nhân nhạy cảm hay phụ thuộc vào API trả phí bên ngoài.

## Decision Drivers
- **Tuân thủ chuẩn quốc gia:** Tương thích 100% với đặc tả **NAPAS 247 / EMVCo Merchant-Presented QR Code**.
- **Hoạt động độc lập (Zero External API Dependency):** Sinh chuỗi QR ngay tại Backend với độ trễ `< 5 ms`, hoạt động ngay cả khi nhà hàng mất kết nối Internet ra ngoài (khách vẫn dùng 4G trên điện thoại để quét).
- **An toàn SCM & Linh hoạt khi Bảo vệ Đồ án:** Mặc định dùng tài khoản giả lập hợp lệ trong `.env.example` / `seed.sql`, nhưng cho phép Quản lý (`ADMIN`) cập nhật `BIN + Số tài khoản + Tên chủ TK` ngay trên giao diện trước buổi bảo vệ trong 5 giây để quét thử bằng app ngân hàng thật.
- **Mở rộng linh hoạt theo SOLID (`Bai 07_1` P58):** Dễ bổ sung phương thức thanh toán mới mà không sửa code lõi của `PaymentService`.

## Considered Options

### Option 1: Tự cài đặt Bộ sinh Chuỗi EMVCo TLV + CRC-16/CCITT-FALSE trong `VietQRPaymentStrategy` (Strategy Pattern) + Bảng `system_settings`
- **Ưu điểm:** Không phụ thuộc dịch vụ ngoài (như img.vietqr.io); kiểm soát 100% thuật toán TLV và mã kiểm lỗi `CRC-16/CCITT-FALSE` (đa thức `0x1021`, khởi tạo `0xFFFF`) — cực kỳ giá trị để kiểm thử hộp trắng (White-box Testing Chương 9) và trình bày trước hội đồng; render trực tiếp thành SVG sắc nét trên Frontend.
- **Nhược điểm:** Thu ngân vẫn cần bấm nút **"Xác nhận đã nhận tiền"** sau khi khách chuyển khoản (do không nối webhook ngân hàng doanh nghiệp).

### Option 2: Nhúng URL ảnh từ dịch vụ bên thứ ba (`https://img.vietqr.io/image/...`)
- **Ưu điểm:** Không cần tự viết bộ ghép chuỗi TLV.
- **Nhược điểm:** Lệ thuộc hoàn toàn vào kết nối Internet và uptime của bên thứ ba; hàm lượng kỹ thuật thấp, không chứng minh được hiểu biết về cấu trúc chuẩn EMVCo/CRC16.

### Option 3: Tích hợp cổng thanh toán thương mại có Webhook (PayOS / Casso / SePay)
- **Ưu điểm:** Tự động chốt đơn khi biến động số dư.
- **Nhược điểm:** Đòi hỏi đăng ký tài khoản thật, lộ khóa bí mật hoặc cần tunnel public (ngrok) khi demo tại phòng học, nằm ngoài phạm vi đã chốt trong `SRS_v1.0.md` Mục 1.2.

## Decision
Chọn **Option 1**:
1. Tổ chức phân hệ thanh toán theo **Strategy Pattern**: giao diện `PaymentStrategy` với hai cài đặt `CashPaymentStrategy` và `VietQRPaymentStrategy`.
2. Xây dựng bộ tạo payload EMVCo chuẩn NAPAS (`GUID = A000000727`, Service Code = `QRIBFTTA`, Currency = `704`, Country = `VN`, Dynamic Point of Initiation = `12`) đi kèm tiện ích `Crc16Util` tính checksum 4 ký tự Hex hoa.
3. Lưu cấu hình `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NUMBER`, `VIETQR_ACCOUNT_NAME` trong bảng `system_settings` (khởi tạo từ biến môi trường `.env` / `seed.sql`) và cung cấp màn hình cấu hình cho `ADMIN`.

## Consequences
### Tích cực
- Minh chứng trọn vẹn nguyên lý **Open-Closed Principle (OCP)** & **Dependency Inversion Principle (DIP)** (`Bai 07_1` P58).
- Khi bảo vệ trước giảng viên, nhóm có thể dùng nguyên cấu hình mặc định hoặc nhập STK thật trên trang Admin để quét thực tế ngay tại lớp mà không lộ dữ liệu cá nhân lên Git.
