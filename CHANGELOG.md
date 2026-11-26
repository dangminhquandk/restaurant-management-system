# Changelog

Tất cả các thay đổi quan trọng và các mốc **Đường cơ sở (Baseline)** của dự án *Hệ thống Quản lý Nhà hàng Thực tế (IT3180 - Nhóm 1)* được ghi nhận tại tệp này theo chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và đánh số phiên bản theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (`MAJOR.MINOR.PATCH[-stage]`).

## [Unreleased] - Sprint 1 (Tuần 1 - 2)
### Added
- Chuẩn hóa cấu trúc kho lưu trữ theo quy trình Quản lý Cấu hình Phần mềm (SCM):
  - Khôi phục `README.md` và `LICENSE` tại thư mục gốc, bổ sung `.env.example` và `CHANGELOG.md`.
  - Thiết lập `.github/ISSUE_TEMPLATE/` (`user_story.md`, `bug_report.md`, `change_request.md`), `PULL_REQUEST_TEMPLATE.md` (kèm Code Review Checklist), và GitHub Actions `ci.yml`.
  - Loại trừ học liệu nội bộ (`Slide/`, `Tài liệu/`), môi trường ảo (`.venv/`), tệp rác OS và bản xuất PDF dung lượng lớn khỏi Git qua `.gitignore`.
- Hoàn thiện bộ tài liệu Quản lý Dự án & SCM tại `docs/01-project-management/`:
  - `PROJECT_MANAGEMENT_PLAN.md` (WBS, Ước lượng, Gantt, Task Network, Risk Register & RMMM).
  - `PRODUCT_BACKLOG.md` (Epics, 22 User Stories chuẩn MoSCoW, Sprint 1 Backlog, Burndown).
  - `SCM_PLAN.md` (Danh mục SCI, 5 Baselines, Git Flow, Change Control Process).
- Hoàn thiện Đặc tả Yêu cầu Phần mềm `docs/02-requirements/SRS_v1.0.md` (22 FR, 8 NFR định lượng, 6 Use Case đặc tả chi tiết, DFD 0/1, Sequence, State FSM, Activity, Swimlane, ERD, Navigation Map, RTM).
- Khởi tạo khung tài liệu Thiết kế (`docs/03-design/README.md`) và Kiểm thử/Bảo trì (`docs/04-testing-qa/README.md`).

### Changed
- Sắp xếp tài liệu đề xuất & thuyết trình vào `docs/05-presentations/` và đồng bộ tên GVHD (`TS. Nguyễn Nhất Hải`), phạm vi MoSCoW, phân vai 4 thành viên.

---

## Lộ trình Các mốc Baseline Dự kiến

| Phiên bản / Tag | Mốc Baseline | Sprint | Nội dung đóng băng chính |
| :--- | :--- | :---: | :--- |
| `v0.1.0-srs` | `BL-01` (Requirements Baseline) | Sprint 1 | Chốt `PROJECT_MANAGEMENT_PLAN.md`, `SCM_PLAN.md`, `PRODUCT_BACKLOG.md`, `SRS_v1.0.md` |
| `v0.2.0-design` | `BL-02` (Design Baseline) | Sprint 2 | Chốt `SDD_v1.0.md`, DDL 3NF, Figma Prototype & Khảo sát đánh giá UI |
| `v0.3.0-alpha` | `BL-03` (Core Alpha) | Sprint 2 | Chạy được DB PostgreSQL, JWT/RBAC, sơ đồ bàn POS, Admin CRUD cơ bản |
| `v0.9.0-rc` | `BL-04` (Release Candidate) | Sprint 3 | Đủ WebSocket STOMP KDS, đồng bộ hết món, VietQR EMVCo, báo cáo doanh thu |
| `v1.0.0` | `BL-05` (Final Release) | Sprint 4 | Hoàn tất kiểm thử White-box/Black-box, JaCoCo, Docker Compose 1-click & Bảo vệ |
