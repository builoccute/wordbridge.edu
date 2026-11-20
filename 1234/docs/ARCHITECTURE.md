# Kiến trúc Phần mềm WORD BRIDGE (V3.0)

## 1. Tổng quan kiến trúc phân lớp
WORD BRIDGE áp dụng kiến trúc **Multi-page SSR + REST API** chạy trên Cloudflare Workers (ES Modules, `nodejs_compat`), tách bạch hoàn toàn các tầng:
- **Presentation (`src/layouts/`, `src/pages/`, `public/`)**: Render HTML độc lập cho 85+ route theo Sitemap Mục 8, Design System CSS responsive 360px–1920px và Client JS tăng cường.
- **API Layer (`src/api/router.js`)**: REST API `/api/v1/*`, validation đầu vào, phân trang, lọc, mã lỗi chuẩn JSON và OpenAPI 3.1 (`/api/v1/openapi.json`).
- **Application & Domain Services (`src/services/`, `src/modules/`)**:
  - `auth-service.js`: Đăng ký 8 trường, xác minh email 1 lần, phiên bảo mật, Passkey WebAuthn, RBAC 9 vai trò.
  - `email-service.js`: Tự động hóa email theo sự kiện, idempotency, retry có giới hạn, webhook trạng thái thật.
  - `student-benefit-service.js`: 03 tháng PERSONAL PLUS duy nhất qua email trường cấp.
  - `jobs-service.js`: Tác vụ nền Cron & kiểm soát ngưỡng lỗi liên tiếp.
  - `dictionary-service.js`, `audio-service.js`, `practice-service.js`, `examination-service.js`, `learner-meet-service.js`, `intelligence-service.js` (15 hệ thống), `admin-service.js`.
- **Data Access & Storage (`database/migrations/`, `storage/r2-adapter.js`)**: Cloudflare D1 (`word`, ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771`) và Cloudflare R2 (`word`).

## 2. Ranh giới kiến trúc bất biến
- Không dồn các module vào trang chủ `/`.
- Khóa cứng 3 ngôn ngữ (`zh`, `en`, `ru`) ở cả SQL `CHECK` constraint, Backend validator và UI; chuyên ngành chỉ cho `zh` và `en`.
- Không có bất kỳ module, bảng hoặc API cấp chứng chỉ nào.
- Learner Meet tuyệt đối không có chat, gửi tệp, chia sẻ màn hình hay ghi âm/ghi hình.
- PDF Reader (`https://reader.wordbridge.vn/`) là ứng dụng độc lập, không tích hợp vào Header/Footer chính.
