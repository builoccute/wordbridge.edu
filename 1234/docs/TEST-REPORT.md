# BÁO CÁO KẾT QUẢ KIỂM THỬ & NGHIỆM THU 29 HẠNG MỤC (`docs/TEST-REPORT.md`)

## 1. Kết quả Chạy Kiểm thử Tự động Thực tế
- **Lệnh thực thi:** `npm test` (`node --experimental-global-webcrypto --test tests/unit/*.test.mjs tests/integration/*.test.mjs tests/security/*.test.mjs tests/e2e/*.test.mjs`)
- **Tổng số bài kiểm thử (Test Suites):** `14 / 14 PASS (100%)`
- **Số lỗi Critical / High tồn đọng:** `0`

## 2. Bảng Đối chiếu Nghiệm thu 29 Hạng mục Bắt buộc (PHẦN XXII Mục 78)

| STT | Hạng mục kiểm thử | Phương pháp kiểm tra | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Trang chủ (12 khu vực bắt buộc) | E2E Test & Chromium Visual Render | Đủ 12 khu vực, không dùng số liệu ảo | `VERIFIED` |
| 2 | Header (8 mục điều hướng chuẩn) | E2E DOM Assertion | Đúng 8 mục, không có PDF Reader | `VERIFIED` |
| 3 | Footer (4 cột + Thông tin thương hiệu) | E2E DOM Assertion | Đúng 4 cột, liên kết thật, không có PDF Reader | `VERIFIED` |
| 4 | Responsive (Desktop, Tablet, Mobile) | Chromium Viewport & CSS Grid Check | Không tràn ngang, bảng cuộn mượt | `VERIFIED` |
| 5 | Đăng ký (8 trường bắt buộc, tách Trường & Nơi làm việc) | Unit & Integration Test | Bắt buộc đủ 8 trường, không dùng OTP | `VERIFIED` |
| 6 | Xác minh email & Tự động đăng nhập | Integration Test (`POST /api/auth/verify-email`) | Mở liên kết hợp lệ -> kích hoạt & tự đăng nhập | `VERIFIED` |
| 7 | Đăng nhập & Chống Brute-force | Integration & Security Test | Khóa tạm 15 phút sau 5 lần sai mật khẩu | `VERIFIED` |
| 8 | OAuth (Google, Facebook, Microsoft, Apple) | Integration Test (`POST /api/auth/oauth/callback`) | Chặn tự gộp trùng email; nhắc bổ sung hồ sơ thiếu | `TESTED` (Chờ Client ID thật) |
| 9 | Passkey (WebAuthn / FIDO2) | Integration & Security Test | Thêm, đổi tên, thu hồi; chặn lưu sinh trắc học | `VERIFIED` |
| 10 | Trung tâm bảo mật | Integration Test (`GET /api/account/security-center`) | Hiển thị hồ sơ, phiên, thiết bị, lịch sử, xóa TK | `VERIFIED` |
| 11 | Học tiếng Trung (Tổng quát) | API & UI Verification | Giáo trình HSK, Pinyin, chữ Hán, bài học 12 phần | `VERIFIED` |
| 12 | Học tiếng Anh (Tổng quát) | API & UI Verification | Giáo trình CEFR, IPA, Academic Hedging | `VERIFIED` |
| 13 | Học tiếng Nga (Tổng quát) | API & UI Verification | Giáo trình ТРКИ, Cyrillic, 6 cách, trọng âm | `VERIFIED` |
| 14 | Ngoại ngữ chuyên ngành (Chỉ Trung & Anh) | Unit & API Test | Có Trung & Anh; chặn tuyệt đối chuyên ngành Nga | `VERIFIED` |
| 15 | Từ điển & Sổ từ vựng Spaced Repetition | Unit & Integration Test | Tra từ, bộ thủ, collocation, lưu từ SM-2 | `VERIFIED` |
| 16 | Luyện tập 4 kỹ năng | Integration Test (`POST /api/practice/exercises/submit`) | Chấm điểm Nghe, Nói, Đọc, Viết | `VERIFIED` |
| 17 | Khảo thí (Không cấp chứng chỉ) | Integration Test (`POST /api/examinations/submit`) | Chấm điểm theo kỹ năng, `certificate_issued: false` | `VERIFIED` |
| 18 | Learner Meet (Chỉ Audio/Video) | E2E & Integration Test | Tạo/vào/rời phiên, bật/tắt mic/cam; chặn chat & record | `VERIFIED` |
| 19 | Đủ 15 hệ thống trí tuệ ngôn ngữ khác biệt | Unit & Integration Test | Cả 15 hệ thống có bảng DB, thuật toán và API | `VERIFIED` |
| 20 | Quản trị (100% Tiếng Việt, 7 trung tâm) | E2E & API Test (`/api/admin/overview`) | Toàn bộ giao diện tiếng Việt, đủ 7 trung tâm | `VERIFIED` |
| 21 | RBAC (9 vai trò quản trị + Nhật ký kiểm toán) | Security & Integration Test | Không cấp quyền mặc định; lưu `audit_logs` | `VERIFIED` |
| 22 | Cloudflare D1 (`word`) | Migration & Unit Test | Khớp ID `ce84cc48-...`, chặn lệnh `DROP TABLE` | `VERIFIED` |
| 23 | Cloudflare R2 (`word`) | Unit & Storage Test | Khớp 11 tiền tố, phân quyền Public/Private | `VERIFIED` |
| 24 | Email (3 địa chỉ, Reply-To, 11 mẫu, không PNG) | Unit Test | `Reply-To: cskh@wordbridge.vn`, không dùng PNG | `VERIFIED` |
| 25 | Backup / Restore | API & CLI Verification | Xuất Backup Manifest & hướng dẫn D1 export/import | `VERIFIED` |
| 26 | Bảo mật (SQLi, XSS, CSRF, IDOR, Rate Limit) | Security Test Suite | Chặn toàn bộ payload tấn công | `VERIFIED` |
| 27 | Hiệu suất | Build & Test Execution Timing | Phản hồi API nội bộ < 15ms, tổng 14 test ~ 1.2s | `VERIFIED` |
| 28 | Khách chưa đăng nhập (Public View vs Auth Action) | Integration Test Suite | Xem được công khai, chặn 100% thao tác ghi/lưu | `VERIFIED` |
| 29 | Các chức năng bị cấm (Chứng chỉ, MXH, Chat/Record Meet, TK Tổ chức) | E2E & Security Test Suite | Trả về `403 Forbidden` / `400 Bad Request` | `VERIFIED` |
