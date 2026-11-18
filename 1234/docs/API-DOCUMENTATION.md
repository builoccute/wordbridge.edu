# TÀI LIỆU KỸ THUẬT API WORD BRIDGE (`docs/API-DOCUMENTATION.md`)

## 1. Quy ước Chung & Bảo mật API
- **Base URL:** `https://www.wordbridge.vn/api`
- **Định dạng dữ liệu:** `application/json; charset=utf-8`
- **Xác thực:** Sử dụng `Authorization: Bearer <sessionToken>` hoặc Cookie `wb_session` (`HttpOnly; Secure; SameSite=Lax`) kèm header `X-CSRF-Token`.
- **Nguyên tắc Công khai xem – Đăng nhập mới được sử dụng (PHẦN IV Mục 13):**
  - Khách chưa đăng nhập chỉ gọi được các endpoint công khai (`/api/health`, `/api/public/catalog`).
  - Mọi thao tác bắt đầu bài học, tra cứu từ điển tương tác, lưu từ vựng, làm bài tập, làm bài thi, tham gia Learner Meet và chạy 15 hệ thống trí tuệ ngôn ngữ đều kiểm tra phiên đăng nhập hợp lệ tại Backend (trả về `401 Unauthorized` nếu chưa đăng nhập).

## 2. Danh mục Endpoint Chi tiết

### A. Công khai & Sức khỏe Hệ thống
- `GET /api/health`: Kiểm tra trạng thái hoạt động, kết nối D1 `word`, R2 `word`, 3 ngôn ngữ hỗ trợ và các tính năng bị cấm.
- `GET /api/public/catalog?lang=zh|en|ru`: Lấy danh mục công khai (chương trình, khóa học, bài học xem trước, mục từ điển công khai, đề bài tập, thông tin kỳ thi và danh sách 15 hệ thống khác biệt).

### B. Tài khoản Cá nhân, Xác thực, OAuth, Passkey & Trung tâm Bảo mật
- `POST /api/auth/register`: Đăng ký tài khoản cá nhân với **8 trường bắt buộc** (`fullName`, `dateOfBirth`, `phoneNumber`, `email`, `password`, `confirmPassword`, `schoolName`, `workplaceName`). Tạo tài khoản `PENDING_VERIFICATION` và phát hành liên kết xác minh email (Không dùng OTP). Từ chối mọi yêu cầu tạo tài khoản tổ chức.
- `GET|POST /api/auth/verify-email?token=<token>`: Xác minh liên kết email hợp lệ, chuyển trạng thái tài khoản sang `ACTIVE` và **tự động đăng nhập** trả về `sessionToken` + `Set-Cookie`.
- `POST /api/auth/login`: Đăng nhập bằng email & mật khẩu. Khóa bảo vệ chống dò mật khẩu (Brute-force lockout 15 phút) sau 5 lần nhập sai liên tiếp (`423 Locked`).
- `POST /api/auth/oauth/callback`: Xác thực liên kết Google, Facebook, Microsoft, Apple. **Không tự động liên kết tài khoản chỉ vì trùng email** (`409 Conflict`). Yêu cầu bổ sung các trường hồ sơ bắt buộc còn thiếu sau khi xác thực. Không yêu cầu OTP số điện thoại.
- `POST /api/account/profile/complete`: Hoàn tất hoặc cập nhật hồ sơ cá nhân (bắt buộc tách riêng Trường học và Nơi làm việc).
- `GET /api/account/security-center`: Truy xuất toàn bộ dữ liệu Trung tâm bảo mật (hồ sơ, gói dịch vụ, danh sách Passkey, tài khoản OAuth liên kết, phiên đăng nhập thiết bị, lịch sử sự kiện bảo mật và trạng thái SSO PDF Reader).
- `POST /api/account/passkeys`: Đăng ký khóa bảo mật WebAuthn/FIDO2 (chỉ nhận `credentialId` và `publicKeySpki`, từ chối mọi trường dữ liệu sinh trắc học hoặc private key).
- `PATCH /api/account/passkeys/:id`: Đổi tên gợi nhớ của Passkey (có kiểm tra quyền sở hữu chống IDOR).
- `DELETE /api/account/passkeys/:id`: Thu hồi một Passkey cụ thể (có kiểm tra quyền sở hữu chống IDOR).
- `POST /api/account/deletion-request`: Gửi yêu cầu xóa tài khoản cá nhân và dữ liệu liên quan.

### C. Gói Dịch vụ & Chính sách Hỗ trợ Sinh viên 03 Tháng
- `POST /api/subscription/student-benefit`: Kích hoạt gói **Personal Plus miễn phí 03 tháng** (hưởng 1 lần duy nhất) khi xác minh bằng email sinh viên do trường cấp (`.edu.vn`, `.edu`, `.ac.*`). Từ chối tuyệt đối việc tải ảnh thẻ sinh viên hoặc giấy tờ thay thế.

### D. Học tập, Từ điển, Luyện tập, Khảo thí & Learner Meet (Yêu cầu Đăng nhập)
- `POST /api/learning/lessons/start`: Bắt đầu bài học và ghi nhận tiến độ vào bảng `learner_progress`.
- `GET /api/dictionary/search?q=<keyword>&lang=zh|en|ru&specialized=0|1`: Tra cứu từ điển đa ngôn ngữ và thuật ngữ chuyên ngành Trung – Anh (trả về lỗi `400` nếu truy vấn chuyên ngành tiếng Nga).
- `POST /api/dictionary/vocabulary/save`: Lưu từ vựng vào sổ từ cá nhân và tính toán chu kỳ ôn tập ngắt quãng SM-2 (`next_review_at`).
- `POST /api/practice/exercises/submit`: Nộp bài tập luyện 4 kỹ năng (Listening, Speaking, Reading, Writing), chấm điểm tự động và lưu lịch sử.
- `POST /api/examinations/submit`: Nộp bài thi khảo thí (HSK, CEFR, TORFL/ТРКИ), chấm điểm theo phân môn và trả về báo cáo chẩn đoán năng lực (`certificate_issued: false`).
- `GET /api/learner-meet/rooms`: Lấy danh sách phòng thực hành trực tiếp kèm tuyên bố quyền riêng tư.
- `POST /api/learner-meet/rooms`: Tạo phiên thực hành 1–1 hoặc Nhóm bằng âm thanh/video trực tiếp.
- `POST /api/learner-meet/action`: Thực hiện thao tác trong phiên (`JOIN_SESSION`, `TOGGLE_MIC`, `TOGGLE_CAMERA`, `LEAVE_SESSION`, `END_SESSION`). Mọi thao tác bị cấm (`SEND_CHAT_MESSAGE`, `UPLOAD_CHAT_FILE`, `START_RECORDING`, `START_SCREEN_SHARE`) bị chặn với mã `403 Forbidden`.

### E. 15 Hệ thống Trí tuệ Ngôn ngữ Khác biệt
- `GET /api/language-intelligence/systems`: Danh mục cấu hình và trạng thái của 15 hệ thống.
- `POST /api/language-intelligence/evaluate/:slug`: Thực thi tính toán cho từng hệ thống từ #1 (`language-dna`) đến #15 (`personal-language-observatory`).

### F. Lưu trữ Cloudflare R2 & Quản trị Tiếng Việt (RBAC)
- `POST /api/storage/upload`: Kiểm tra tiền tố, MIME type, kích thước và tải tệp lên R2 bucket `word`.
- `GET /api/storage/object?key=<objectKey>`: Kiểm tra quyền truy cập (`PUBLIC`, `AUTHENTICATED`, `PRIVATE`) và truy xuất đối tượng R2.
- `GET /api/admin/overview`: Bảng điều khiển quản trị tiếng Việt, 5 nhóm phân hệ, 7 trung tâm chuyên sâu, số liệu thời gian thực và báo cáo quét tệp mồ côi R2.
- `POST /api/admin/rbac/assign`: Cấp quyền RBAC (chỉ dành cho `SUPER_ADMIN` và `SECURITY_ADMIN`) kèm ghi nhật ký kiểm toán bắt buộc vào `audit_logs`.
- `POST /api/admin/editorial/lessons`: Tạo mới, cập nhật và phát hành phiên bản bài học tại Trung tâm biên tập học liệu.
- `POST /api/admin/infrastructure/backup`: Tạo bản chụp sao lưu (Backup Manifest) cho D1 và R2.
