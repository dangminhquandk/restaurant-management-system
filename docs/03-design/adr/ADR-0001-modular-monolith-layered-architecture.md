# ADR-0001: Áp dụng Kiến trúc Modular Monolith Phân tầng (Layered Architecture)

## Status
Accepted — Baseline `BL-02` (`v0.2.0-design`)

## Context
Hệ thống Quản lý Nhà hàng Thực tế (IT3180) phục vụ quy trình vận hành tại chỗ (*Dine-in*, quy mô 20–50 bàn) trong mạng nội bộ LAN của một nhà hàng đơn lẻ, bao gồm 3 giao diện nghiệp vụ (`POS`, `KDS`, `Admin Portal`). Nhóm phát triển gồm **5 sinh viên** thực hiện trong **8 tuần (4 Sprint)**, cần đảm bảo:
- Tính toàn vẹn giao dịch ACID tuyệt đối khi mở bàn, gộp bàn và thanh toán hóa đơn (`NFR-02`).
- Độ trễ truyền sự kiện đơn hàng từ POS xuống KDS `< 1.000 ms` (`NFR-01`).
- Đóng gói và khởi chạy toàn bộ hệ thống chỉ bằng 1 câu lệnh `docker compose up` (`NFR-07`).
- Dễ kiểm thử đơn vị/tích hợp để đạt ngưỡng `≥ 75%` Branch Coverage trên tầng nghiệp vụ (`NFR-06`).

## Decision Drivers
- **Độ phức tạp vận hành thấp:** Khởi chạy nhanh trên máy cá nhân của sinh viên và giảng viên chấm bài.
- **Giao dịch cơ sở dữ liệu cục bộ (Local ACID Transactions):** Tránh độ phức tạp của giao dịch phân tán (Saga / 2PC) khi gộp bàn hoặc chốt thanh toán.
- **Ranh giới mô-đun rõ ràng (`High Cohesion – Loose Coupling`, `Bai 07_1` P73–77):** Cho phép 5 thành viên làm việc song song mà ít xung đột Git.
- **Phù hợp quy mô tài nguyên:** Toàn bộ tải đồng thời của nhà hàng 50 bàn (`~10–30` thiết bị kết nối LAN) nằm gọn trong khả năng xử lý của một tiến trình JVM duy nhất.

## Considered Options

### Option 1: Modular Monolith Phân tầng (Spring Boot Layered + Internal Domain Events)
- **Ưu điểm:** Triển khai đơn giản (1 container Backend + 1 PostgreSQL + 1 Nginx Frontend); `@Transactional` đảm bảo ACID nguyên khối; truyền sự kiện nội bộ qua `ApplicationEventPublisher` sang STOMP Broker cực nhanh (`< 50 ms` trong LAN); dễ cấu hình JaCoCo và kiểm thử tích hợp.
- **Nhược điểm:** Không thể mở rộng ngang từng phân hệ độc lập (ví dụ tách riêng cụm server KDS và cụm Payment), đòi hỏi kỷ luật chia package để tránh phụ thuộc vòng.

### Option 2: Microservices (Tách riêng Auth Service, Order Service, KDS Service, Payment Service)
- **Ưu điểm:** Cô lập lỗi và mở rộng độc lập từng dịch vụ ở quy mô chuỗi hàng nghìn nhà hàng.
- **Nhược điểm:** Phát sinh chi phí hạ tầng lớn (API Gateway, Service Discovery, Message Broker ngoài như Kafka/RabbitMQ, 5–6 containers ngốn RAM); mất tính ACID trực tiếp giữa `ORDERS`, `DINING_TABLES` và `PAYMENTS`; vượt quá ngân sách 340 giờ công của nhóm 4 người (`RSK-03`, `RSK-05`).

### Option 3: Monolith Nguyên khối Không Tách Lớp (Script / Fat Controller)
- **Ưu điểm:** Viết nhanh ở vài chức năng CRUD đầu tiên.
- **Nhược điểm:** Vi phạm nghiêm trọng nguyên lý `Separation of Concerns` và `SOLID` (`Bai 07_1` P17, P58); không thể viết Unit Test độc lập cho logic nghiệp vụ với Mockito.

## Decision
Chọn **Option 1: Modular Monolith theo Kiến trúc Phân tầng (Layered Architecture: `Controller → Service → Domain (State/Strategy) → Repository → PostgreSQL`) kết hợp Event-Driven nội bộ (`Spring Events + WebSocket STOMP`)**.

## Consequences
### Tích cực
- Đảm bảo 100% giao dịch mở bàn, chuyển/gộp bàn và thanh toán chạy trong một transaction PostgreSQL ACID duy nhất.
- Thời gian khởi động toàn hệ thống trên Docker Compose giảm xuống `< 60 giây`, tốn ít hơn `1 GB` RAM.
- Phân tách rõ các lớp **Boundary (`controller`, `dto`) – Control (`service`) – Entity (`domain/entity`)**, khớp trực tiếp chuẩn thiết kế hướng đối tượng của học phần IT3180 (`Bai 07_1` P32–33).

### Tiêu cực & Biện pháp Giảm thiểu
- **Nguy cơ gọi chéo lộn xộn giữa các Service:** Khắc phục bằng quy ước chỉ giao tiếp qua public interface của `Service` hoặc phát sự kiện `ApplicationEvent` cho tác vụ phụ trợ (broadcast STOMP, ghi Audit Log).
