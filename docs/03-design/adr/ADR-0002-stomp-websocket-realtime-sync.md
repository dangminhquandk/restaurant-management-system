# ADR-0002: Đồng bộ Thời gian thực POS ↔ KDS bằng WebSocket STOMP & Transactional Events

## Status
Accepted — Baseline `BL-02` (`v0.2.0-design`)

## Context
Bài toán cốt lõi của đề tài là xóa bỏ độ trễ 3–5 phút của phiếu order giấy và tình trạng lệch pha thông tin giữa Sảnh (`POS`) và Bếp (`KDS`):
- Khi phục vụ gửi đơn (`FR-12`), màn hình KDS phải nhận thẻ món kèm âm thanh trong `< 1.000 ms` (`NFR-01`).
- Khi bếp bấm `READY` (`FR-14`) hoặc gạt công tắc `Tạm hết món` (`FR-15`), toàn bộ máy POS đang mở phải nhận cập nhật tức thì.
- Khi mạng Wi-Fi nội bộ chập chờn (`NFR-04`), client phải phát hiện mất kết nối trong `≤ 5 giây`, giữ nguyên giỏ món đang chọn và tự động đồng bộ lại khi có mạng.

## Decision Drivers
- **Độ trễ thấp hai chiều (`< 1s` p95 trên LAN).**
- **Không phát thông báo "ma" (Phantom Notifications):** Tuyệt đối không đẩy đơn xuống bếp nếu transaction lưu CSDL bị lỗi/rollback.
- **Cơ chế định tuyến theo chủ đề (Pub/Sub Topic Routing):** Tách riêng luồng sự kiện cho Bếp (`/topic/kds/orders`), Sơ đồ bàn (`/topic/tables`), Thực đơn (`/topic/menu/availability`) và Thông báo phục vụ (`/topic/pos/notifications`).
- **Hỗ trợ Heartbeat & Auto-reconnect chuẩn hóa.**

## Considered Options

### Option 1: WebSocket kết hợp giao thức con STOMP + `@TransactionalEventListener(AFTER_COMMIT)`
- **Ưu điểm:** Kết nối TCP song công (full-duplex) bền vững; giao thức STOMP hỗ trợ sẵn cơ chế `SUBSCRIBE` theo topic và `Heartbeat (10s/10s)`; tích hợp nguyên bản với Spring Security & `SimpMessagingTemplate`; kết hợp `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` đảm bảo chỉ phát gói tin sau khi PostgreSQL đã commit thành công.
- **Nhược điểm:** Cần cấu hình proxy `Upgrade: websocket` trên Nginx và xử lý đồng bộ lại snapshot REST khi reconnect.

### Option 2: HTTP Short Polling (gọi REST API lặp lại mỗi 2–3 giây)
- **Ưu điểm:** Dễ cài đặt nhất, không cần duy trì kết nối mở.
- **Nhược điểm:** Độ trễ trung bình 1.5–3 giây (vi phạm ngưỡng `< 1s` của `NFR-01`); tạo hàng trăm request dư thừa mỗi phút ngay cả khi không có đơn mới (`Bai 06_2`, kịch bản phản biện).

### Option 3: Server-Sent Events (SSE)
- **Ưu điểm:** Nhẹ, chạy trên HTTP chuẩn, hỗ trợ đẩy 1 chiều Server → Client.
- **Nhược điểm:** Chỉ truyền một chiều, thiếu chuẩn định tuyến multi-topic kèm heartbeat hai chiều đồng nhất như STOMP broker của Spring.

## Decision
Chọn **Option 1: Spring WebSocket với Simple In-Memory STOMP Broker (`/ws`), cấu hình Heartbeat `10.000 ms / 10.000 ms`, xác thực JWT tại pha `CONNECT`, và phát sự kiện thông qua `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`**.

## Consequences
### Tích cực
- Độ trễ thực tế trong mạng LAN đạt `20–150 ms` (vượt xa yêu cầu `< 1.000 ms`).
- Tách rời hoàn toàn logic nghiệp vụ (`OrderService`, `MenuService`) khỏi tầng truyền thông (`StompBroadcastListener`) — minh chứng điển hình cho **Observer / Pub-Sub Pattern** và nguyên lý **Open-Closed / Single Responsibility**.

### Tiêu cực & Biện pháp Giảm thiểu
- **Mất gói tin trong lúc rớt mạng tạm thời:** Khi `@stomp/stompjs` trên React phát hiện kết nối khôi phục (`onConnect` sau lần đứt), client tự động gọi lại REST snapshot (`/api/v1/kds/orders`, `/api/v1/tables`, `/api/v1/menu-items`) để hội tụ trạng thái 100% với PostgreSQL (`RSK-01`).
