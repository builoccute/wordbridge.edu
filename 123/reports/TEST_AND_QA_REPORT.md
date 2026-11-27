# BÁO CÁO KIỂM THỬ & NGHIỆM THU TRUNG THỰC — WORD BRIDGE (v0.9.1-final-2026)

## 1. Bảng trạng thái tiến độ theo quy chuẩn (Phần XIII)
Phân biệt nghiêm ngặt 3 trạng thái: **(1) Đã xây dựng trong mã nguồn**, **(2) Đã tích hợp vào website thật**, **(3) Đã triển khai & kiểm thử production**.

| Hạng mục | Mã nguồn | Tích hợp website thật | Kiểm thử cục bộ / Full-stack SQLite | Nghiệm thu Production |
| :--- | :--- | :--- | :--- | :--- |
| Giao diện & Điều hướng 4 nhóm | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium 4 màn hình) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Listening (16 bài, `TEXT_SCRIPT_ONLY`) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E + API D1) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Speaking Studio + MediaRecorder 7 trạng thái | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Reading (Editorial Split + Focus mode) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Writing Studio (2 cột + bộ đếm từ + bài mẫu) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E + API D1) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Pronunciation Lab (33 bài, độc lập) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Grammar (51), Exercises (64), Assessments (14) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Khóa học (8 khóa, 16 chương, 32 bài, 40 lessons) | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E + D1 Seed) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Flashcard 2.000 thẻ (`FLASHCARD_ONLY`) & SRS | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E + D1 Seed/SRS) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| My Mistakes, Practice Insights, Lịch sử học tập | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Chromium E2E + API D1) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Sửa lỗi Từ điển 0/0 & Lưu thuật ngữ chuyên ngành | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Unit + Chromium E2E + API D1) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| D1 Migration (9 bảng `wb_*`), Seed SQL & Rollback | `IMPLEMENTED` | `BLOCKED` | `TESTED` (SQLite3 UP + Seed + ROLLBACK) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |
| Worker API `/api/wb/*` & Cô lập tài khoản `user_id` | `IMPLEMENTED` | `BLOCKED` | `TESTED` (Full-stack SQLite đa người dùng) | `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` |

## 2. Kết quả kiểm thử thực tế đã chạy (0 lỗi)
### A. Kiểm thử Full-Stack Worker API + SQLite D1 đa tài khoản
- **Sinh & nạp Seed D1 (`migrations/seeds/seed_wb_catalog_d1.sql`):** **PASS** — Nạp thành công 8 khóa học (`wb_courses`), 2.000 Flashcard (`wb_flashcard_deck_items`, 100% `FLASHCARD_ONLY`), 49 audio bindings (`wb_audio_asset_bindings`, 100% `TEXT_SCRIPT_ONLY`, `audio_url IS NULL`).
- **Luồng đa tài khoản (`User A → Đăng xuất → User B → Đăng nhập lại User A`):** **PASS**
  - Yêu cầu chưa xác thực trả đúng `401`.
  - `User A` đăng nhập → ghi tiến độ khóa học (`CRS-EN-001`), SRS Flashcard (`FC-0001`), phiên Listening (`LS-00001`), lỗi vào My Mistakes, bản nháp Writing (`WR-00001`), và lưu thuật ngữ chuyên ngành không có `entryId` (tự chuẩn hóa `SPEC-D32-bill-of-lading`).
  - Chuyển sang `User B` → xác minh `User B` nhận `0` bản ghi của `User A` và không thể sửa/đóng lỗi của `User A`.
  - Đăng nhập lại `User A` → toàn bộ dữ liệu học tập còn nguyên vẹn 100% từ SQLite D1.
- **SQLite3 Rollback (`migrations/rollbacks/20261127_001_rollback.sql`):** **PASS** — Xóa sạch 9 bảng `wb_*`, giữ nguyên vẹn bảng `legacy_users`.

### B. Kiểm thử Trình duyệt thật (Headless Chromium / Selenium CDP)
- **16/16 kịch bản đạt (0 lỗi JS `SEVERE`, 0 nhãn nội bộ bị cấm):** Tải trang + nhãn đồng bộ trung thực, Khóa học + Breadcrumb, Listening (không nút audio giả, hiện đủ `explanation_vi`), Speaking Studio + MediaRecorder `IDLE`, Reading Editorial Split + Focus mode, Writing Studio + bộ đếm từ + bài mẫu, Pronunciation Lab + 40 bài học tích hợp, Từ điển (726 mục từ, không mất focus khi gõ), Lưu thuật ngữ Chuyên ngành, Flashcard 2.000 thẻ + hàng đợi SRS, My Mistakes + Practice Insights + Lịch sử học tập.
- **Đa màn hình (0 tràn ngang):** Desktop `1440×900` (`1425 <= 1440`), Laptop `1280×800` (`1265 <= 1280`), Tablet `768×1024` (`753 <= 768`), Mobile `390×844` (`375 <= 390`).
- **Bảo toàn dữ liệu gốc (`data/`):** **PASS** — 69/69 tệp gốc khớp SHA-256 từng byte.

## 3. Hạng mục đang bị chặn (Trung thực)
- **Triển khai trực tiếp lên `https://www.wordbridge.io.vn/`:** `BLOCKED – PRODUCTION SOURCE NOT PROVIDED` do người dùng không cung cấp mã nguồn repository `wordbridge-edu` (`src/`, `public/`, `wrangler.toml`) và môi trường không có quyền deploy lên tài khoản Cloudflare của người dùng. Toàn bộ phần mã nguồn, migration, seed SQL và module tích hợp đã được hoàn thiện tối đa và kiểm thử full-stack cục bộ để bạn dán thẳng vào repository khi triển khai.
