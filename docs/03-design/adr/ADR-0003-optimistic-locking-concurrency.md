# ADR-0003: Kiểm soát Tranh chấp Đồng thời bằng Khóa Lạc quan (`@Version` Optimistic Locking)

## Status
Accepted — Baseline `BL-02` (`v0.2.0-design`)

## Context
Trong giờ cao điểm, nhiều nhân viên phục vụ cầm tablet cùng nhìn sơ đồ bàn. Tình huống tranh chấp kinh điển (`UC-02`, `FR-05`, `NFR-02`):
- Phục vụ A và Phục vụ B cùng thấy `Bàn T1-05` đang `AVAILABLE` (`version = 3`) và bấm **"Mở bàn"** gần như cùng một thời điểm.
- Nếu không có cơ chế kiểm soát đồng thời, hệ thống sẽ tạo ra **2 đơn `OPEN` trùng lặp trên cùng 1 bàn** hoặc ghi đè trạng thái của nhau. Tương tự, hai thu ngân có thể bấm xác nhận thanh toán trùng trên cùng một hóa đơn.

## Decision Drivers
- **Độ chính xác tuyệt đối (Zero Lost Update / Zero Duplicate Open Order):** 100% xung đột phải bị chặn ở tầng CSDL/ORM.
- **Hiệu năng đọc cao:** Sơ đồ bàn được đọc thường xuyên hơn rất nhiều so với tần suất ghi mở bàn.
- **Phản hồi rõ ràng cho người dùng cuối:** Trả mã chuẩn HTTP `409 Conflict` để giao diện POS tự động tải lại trạng thái mới nhất.

## Considered Options

### Option 1: Khóa Lạc quan (Optimistic Locking) với cột `version` (`@Version` JPA) + Kiểm tra `expectedVersion`
- **Ưu điểm:** Không giữ khóa dòng trong CSDL khi người dùng đang xem màn hình; câu lệnh SQL `UPDATE dining_tables SET status = 'OCCUPIED', version = version + 1 WHERE id = ? AND version = ?` nguyên tử ở cấp engine PostgreSQL; thông lượng đọc tối đa; hỗ trợ kiểm tra cả xung đột giữa thời điểm render UI (`expectedVersion` trong DTO) lẫn xung đột mili-giây tại DB.
- **Nhược điểm:** Yêu cầu phía client xử lý mã lỗi `409 Conflict` và làm mới dữ liệu.

### Option 2: Khóa Bi quan (Pessimistic Write Lock — `SELECT ... FOR UPDATE`)
- **Ưu điểm:** Xếp hàng tuần tự các transaction tại CSDL.
- **Nhược điểm:** Chỉ khóa trong phạm vi tích tắc của HTTP request sau (người đến sau chờ khóa nhả ra rồi sẽ thấy bàn đã `OCCUPIED` và vẫn bị từ chối), nhưng lại làm tăng nguy cơ nghẽn kết nối / deadlock khi gộp nhiều bàn cùng lúc.

### Option 3: Đồng bộ hóa trên bộ nhớ JVM (`synchronized` / `ReentrantLock`)
- **Ưu điểm:** Dễ viết trong Java thuần.
- **Nhược điểm:** Phá vỡ khả năng mở rộng nhiều instance Backend và không bảo vệ dữ liệu ở tầng CSDL.

## Decision
Chọn **Option 1: Áp dụng `@Version` (`version BIGINT NOT NULL DEFAULT 0`) trên cả hai bảng `dining_tables` và `orders`, kết hợp truyền `expectedVersion` trong yêu cầu mở bàn (`POST /api/v1/tables/{id}/open`) và thêm ràng buộc chỉ mục duy nhất một phần (hoặc kiểm tra nghiệp vụ trong transaction) để đảm bảo mỗi bàn chỉ có tối đa 1 đơn `OPEN`**.

## Consequences
### Tích cực
- Khi bắn đồng thời `N` luồng mở cùng một bàn trống, chính xác **1 luồng thành công (`200 OK`)** và **`N - 1` luồng nhận `409 Conflict`** thông qua `GlobalExceptionHandler` bắt `ObjectOptimisticLockingFailureException` / `TableConflictException`.
- Dễ dàng kiểm chứng định lượng bằng Integration Test đa luồng (`CountDownLatch` + `ExecutorService`).

### Tiêu cực & Biện pháp Giảm thiểu
- Khi gộp nhiều bàn (`FR-07`), để tránh deadlock khóa dòng thứ cấp khi cập nhật nhiều bản ghi `dining_tables`, `OrderService` luôn sắp xếp danh sách `tableId` tăng dần trước khi cập nhật.
