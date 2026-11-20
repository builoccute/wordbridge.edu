# Tài liệu API WORD BRIDGE (`/api/v1/*`)

Tài liệu OpenAPI 3.1 động có sẵn tại `GET /api/v1/openapi.json`.

| Method | Endpoint | Xác thực | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/health` | Công khai | Kiểm tra kết nối D1 và trạng thái tích hợp |
| GET | `/api/v1/languages` | Công khai | Trả về 3 ngôn ngữ chính thức (`zh`, `en`, `ru`) |
| GET | `/api/v1/programs` | Công khai | Lọc chương trình theo ngôn ngữ/loại (chặn `ja`/`ko` và chuyên ngành `ru`) |
| GET | `/api/v1/dictionary/search` | Công khai | Tra cứu từ điển theo từ khóa, ngôn ngữ, trình độ, từ loại, chủ đề, ngành |
| GET | `/api/v1/specialized/domains` | Công khai | Danh sách chuyên ngành (`zh`, `en`; trả 400 nếu truyền `ru`) |
| POST | `/api/v1/support/tickets` | Công khai | Gửi yêu cầu CSKH (`cskh@`) hoặc Liên hệ hợp tác (`contact@`) |
| POST | `/api/v1/auth/register` | Công khai | Đăng ký cá nhân 8 trường bắt buộc + tạo token xác minh email 1 lần |
| POST | `/api/v1/auth/verify-email` | Công khai | Xác minh token 1 lần + tự động tạo phiên đăng nhập |
| POST | `/api/v1/auth/login` | Công khai | Đăng nhập + chống brute-force (khóa 15 phút sau 5 lần sai) |
| POST | `/api/v1/auth/logout` | Đăng nhập | Thu hồi phiên hiện tại & xóa cookie |
| POST | `/api/v1/auth/forgot-password` | Công khai | Gửi liên kết khôi phục mật khẩu |
| GET | `/api/v1/auth/me` | Đăng nhập | Lấy thông tin tài khoản, gói và vai trò RBAC |
| POST | `/api/v1/account/passkeys` | Đăng nhập | Đăng ký WebAuthn Passkey (chỉ credential ID & public key COSE) |
| POST | `/api/v1/student-benefit/request` | Đăng nhập | Yêu cầu xác minh sinh viên (chỉ chấp nhận `school_email_only`) |
| POST | `/api/v1/student-benefit/confirm` | Công khai | Kích hoạt 03 tháng PERSONAL PLUS một lần duy nhất |
| POST | `/api/v1/learning/progress` | Đăng nhập | Ghi nhận tiến độ & hoàn thành bài học |
| GET/POST | `/api/v1/vocabulary/notebook` | Đăng nhập | Xem/lưu từ vào sổ cá nhân |
| POST | `/api/v1/vocabulary/review` | Đăng nhập | Cập nhật lịch ôn tập ngắt quãng SM-2 |
| POST | `/api/v1/practice/submit` | Đăng nhập | Nộp bài luyện tập 4 kỹ năng (không chấm điểm giả cho tự luận) |
| POST | `/api/v1/examinations/start` | Đăng nhập | Bắt đầu lượt khảo thí |
| PUT | `/api/v1/examination-attempts/:id/draft` | Đăng nhập | Lưu nháp câu trả lời tự động |
| POST | `/api/v1/examination-attempts/:id/submit` | Đăng nhập | Nộp bài & chấm điểm (`certificateIssued: false`) |
| POST | `/api/v1/learner-meet/sessions` | Đăng nhập | Tạo phiên Learner Meet (khóa chat/ghi hình) |
| POST | `/api/v1/learner-meet/join` | Đăng nhập | Tham gia phiên bằng mã phiên |
| POST | `/api/v1/intelligence/:slug/run` | Đăng nhập | Chạy 1 trong 15 hệ thống trí tuệ ngôn ngữ và lưu lịch sử D1 |
| POST | `/api/v1/webhooks/email` | Provider | Cập nhật trạng thái gửi email thật (`DELIVERED`, `BOUNCED`, `COMPLAINED`) |
| GET | `/api/v1/admin/dashboard` | RBAC Admin | Chỉ số vận hành & 7 trung tâm quản trị |
| POST | `/api/v1/admin/roles/assign` | `rbac:manage` | Gán vai trò RBAC + ghi audit log |
| POST | `/api/v1/admin/jobs/action` | `infrastructure:manage` | Chạy/tạm dừng/kích hoạt tác vụ nền |
