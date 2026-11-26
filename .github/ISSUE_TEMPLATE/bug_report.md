---
name: Bug Report
about: Báo cáo lỗi phần mềm (gắn với quy trình QA & Bảo trì - Chương 9)
title: "[BUG-XX] <Mô tả ngắn gọn hiện tượng lỗi (Failure)>"
labels: bug
assignees: ''
---

## 1. Phân loại & Liên kết
- **Mức độ nghiêm trọng (Severity):** `Critical` | `High` | `Medium` | `Low`
- **Loại bảo trì (nếu sau phát hành):** `Tu chỉnh (Corrective)` | `Thích nghi` | `Cải tiến` | `Phòng ngừa`
- **Liên kết Yêu cầu / Test Case:** `FR-XX` / `TC-XX`
- **Người phát hiện (QA/Tester ≠ Tác giả code):** `@username`

## 2. Mô tả Lỗi (Failure vs Fault)
- **Hiện tượng quan sát được (Actual Behavior):**
- **Kết quả mong đợi theo đặc tả (Expected Behavior):**

## 3. Các bước tái hiện (Steps to Reproduce)
1. Đăng nhập với vai trò `...`
2. Thực hiện thao tác `...`
3. Dữ liệu đầu vào cụ thể: `...`

## 4. Môi trường & Bằng chứng
- **Branch / Commit / Release:** `develop` / `<commit-hash>`
- **Trình duyệt / Thiết bị / Docker log:**
- **Ảnh chụp màn hình / Stack trace:**

## 5. Đánh giá Hiệu ứng Làn sóng (Regression Impact)
- [ ] Đã xác định các mô-đun liên quan cần kiểm thử hồi quy sau khi sửa.
- [ ] Đã thêm test case tự động chống tái phát lỗi này.
