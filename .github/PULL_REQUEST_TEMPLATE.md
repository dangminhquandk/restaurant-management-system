## 1. Mô tả Pull Request
- **Liên kết Issue / User Story / Bug:** Closes `#<issue-number>` (`US-XX` / `FR-XX`)
- **Loại thay đổi:** `feat` | `fix` | `docs` | `refactor` | `test` | `chore`
- **Tóm tắt ngắn gọn thay đổi:**

## 2. Tự kiểm tra của Tác giả (Self-Check)
- [ ] Đã kiểm tra thay đổi khớp với đặc tả trong `SRS_v1.0.md` / `SDD`.
- [ ] Không chứa bí mật cấu hình (`.env`, API key, mật khẩu thật), file rác (`.DS_Store`, `desktop.ini`) hoặc dead code.
- [ ] Đã chạy kiểm thử cục bộ và tất cả test cases đều pass.
- [ ] Nếu thay đổi thuộc loại `refactor:`, xác nhận không làm thay đổi hành vi chức năng và giữ nguyên/tăng độ phủ test.

## 3. Code Review Checklist (Dành cho Reviewer - Chương 8 IT3180)
> **Nguyên tắc bắt buộc:** Người review và người kiểm thử phải khác tác giả viết code (`Bai 08` P42, `Bai 09` P11).

- [ ] **Tính rõ ràng & Quy ước mã nguồn:** Đặt tên biến/hàm gợi nhớ, đúng chuẩn Java/TS; có Javadoc/TSDoc cho hàm/lớp public mới.
- [ ] **Tính mô-đun & Độ phức tạp:** Mỗi hàm đơn mục tiêu, ngắn gọn, số tham số < 6 (`Bai 08` P27); không trùng lặp logic.
- [ ] **Chất lượng thiết kế:** Tuân thủ Layered Architecture, High Cohesion – Loose Coupling, không vi phạm SOLID.
- [ ] **Toàn vẹn & Bảo mật:** Kiểm tra phân quyền RBAC, xử lý ngoại lệ rõ ràng, đảm bảo concurrency (`@Version`) nếu đụng bảng `DINING_TABLES`/`ORDERS`.
- [ ] **Kiểm thử & Hiệu ứng làn sóng (Regression):** Đã xem xét ảnh hưởng tới các module khác; test unit/integration đầy đủ.
