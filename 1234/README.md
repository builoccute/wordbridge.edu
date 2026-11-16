# WORD BRIDGE — Nền tảng Thực hành và Kết nối Cộng đồng Ngoại ngữ (2026–2027)

> **Slogan:** *Where Languages Bring People Together.*  
> **Tên miền chính thức:** `https://wordbridge.io.vn`  
> **Bốn trụ cột cốt lõi:** `LEARN` • `CONNECT` • `COMMUNITY` • `GROW`  
> **Năm ngôn ngữ mục tiêu:** Tiếng Trung (`zh`) • Tiếng Anh (`en`) • Tiếng Hàn (`ko`) • Tiếng Nhật (`ja`) • Tiếng Nga (`ru`)

## 1. Tổng quan Kiến trúc Hệ thống

**WORD BRIDGE** vận hành trên kiến trúc hợp nhất giữa **Cloudflare Workers** (`src/worker.js` theo cấu hình `wrangler.toml`) và **Node.js HTTP Server** (`src/server.js`) thông qua bộ điều phối nghiệp vụ trung tâm `dispatchApiRequest`:

- **Cơ sở dữ liệu chính thức:** **Cloudflare D1** (`binding = "DB"`, `database_name = "word"`, `database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771"`), tương thích đồng bộ với SQLite WAL (`node:sqlite`) khi chạy локал/kiểm thử tự động và hỗ trợ đồng bộ snapshot hai chiều qua `database.adapter.js`.
- **Lưu trữ đối tượng chính thức:** **Cloudflare R2** (`binding = "R2"`, `bucket_name = "word"`), kiểm tra chữ ký tệp thực tế (Magic Bytes), khóa đối tượng chống đoán đường dẫn, kiểm soát quyền truy cập theo tài khoản/tổ chức và quản lý hạn mức dung lượng theo chu kỳ tháng (`Asia/Ho_Chi_Minh`).
- **Dịch vụ Email giao dịch:** **Resend API** (`https://api.resend.com/emails`), người gửi mặc định `WORD BRIDGE – Email tự động từ hệ thống <noreply@wordbridge.io.vn>`, chỉ đánh dấu `sent` (`Đã gửi`) sau khi nhận phản hồi xác nhận `id` (`provider_id`) từ Resend.
- **Bảo mật & Quản trị:**
  - Tách biệt hoàn toàn phiên người dùng (`sessions`) và phiên Quản trị viên (`admin_sessions`) tại cổng riêng `/quan-tri/dang-nhap`.
  - Không lưu trữ token nhạy cảm trong `localStorage` (sử dụng cookie `HttpOnly; SameSite=Lax` kết hợp bộ nhớ phiên tạm thời).
  - Bảo vệ đầy đủ các API trên cả `src/server.js` và `src/worker.js` bằng RBAC, CSRF token, Rate Limiting và nhật ký kiểm toán (`audit_logs`).

## 2. Bảng Giá & Hạn Mức Lưu Trữ Đã Phê Duyệt

| Mã gói | Tên gói hiển thị (Tiếng Việt) | Giá niêm yết | Hạn mức lưu trữ mặc định | Quyền lợi & Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `personal_free` | **Người Dùng bản Miễn Phí** | `0 đồng` | `1 GB / tài khoản` | Học 05 ngôn ngữ, bài tập cơ bản, kết nối & cộng đồng cơ bản |
| `personal_plus_monthly` | **Người Dùng bản Plus – Tháng** | `129.000 đồng / tháng` | `5 GB / tài khoản` | Dùng thử 07 ngày cho tài khoản mới; mở khóa toàn bộ công cụ luyện tập, AI & thống kê sâu |
| `personal_plus_yearly` | **Người Dùng bản Plus – Năm** | `1.000.000 đồng / năm` | `5 GB / tài khoản` | Tiết kiệm chi phí năm; đầy đủ quyền lợi Personal Plus |
| `org_plus_monthly` | **Tổ Chức Plus – Tháng** | `350.000 đồng / tháng` | `50 GB / tổ chức / tháng` | Dùng chung toàn tổ chức, tối đa 30 thành viên (dùng thử 14 ngày tối đa 10 thành viên) |
| `org_plus_yearly` | **Tổ Chức Plus – Năm** | `3.500.000 đồng / năm` | `120 GB / tổ chức / tháng` | Dùng chung toàn tổ chức, tối đa 30 thành viên, chu kỳ hạn mức làm mới ngày 01 hằng tháng |

*Ghi chú bảo vệ hạn mức:* Biến môi trường `MONTHLY_QUOTA_GB` chỉ đóng vai trò giá trị tham chiếu dự phòng cấp hệ thống (`override_plan_quotas = false`), **tuyệt đối không ghi đè** hạn mức mặc định riêng của từng gói dịch vụ (`1 GB`, `5 GB`, `50 GB`, `120 GB`).

## 3. Cấu Trúc Thư Mục Mã Nguồn

```text
word_bridge/
├── database/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0005_upgrade_2026_2027.sql
│   │   └── 0006_upgrade_2026_full_features.sql
│   ├── seeds/
│   │   └── 01_reference_data.sql
│   └── schema.sql
├── docs/
│   ├── ARCHITECTURE_AND_ADMIN_GUIDE.md
│   └── TEST_AND_ACCEPTANCE_REPORT.md
├── scripts/
│   ├── backup.js
│   ├── migrate.js
│   ├── restore.js
│   ├── seed.js
│   └── verify-system.js
├── src/
│   ├── adapters/
│   │   ├── ai.adapter.js
│   │   ├── database.adapter.js
│   │   ├── email.adapter.js
│   │   └── storage.adapter.js
│   ├── config/
│   │   ├── constants.js
│   │   └── env.js
│   ├── frontend/
│   │   ├── assets/
│   │   ├── css/
│   │   │   ├── design-system.css
│   │   │   └── layouts-responsive.css
│   │   ├── js/
│   │   │   ├── app-core.js
│   │   │   ├── i18n-locales.js
│   │   │   ├── views-admin-cms.js
│   │   │   ├── views-commerce-exam.js
│   │   │   ├── views-community-org.js
│   │   │   ├── views-learning.js
│   │   │   └── views-public-auth.js
│   │   └── index.html
│   ├── modules/
│   │   ├── admin.module.js
│   │   ├── cms.module.js
│   │   ├── community.module.js
│   │   ├── connections.module.js
│   │   ├── exam.module.js
│   │   ├── learning.module.js
│   │   ├── organizations.module.js
│   │   ├── payment.module.js
│   │   ├── progress.module.js
│   │   └── users.module.js
│   ├── security/
│   │   ├── auth.service.js
│   │   ├── crypto.utils.js
│   │   ├── rate-limiter.js
│   │   └── rbac.middleware.js
│   ├── utils/
│   │   ├── http.utils.js
│   │   └── validator.js
│   ├── app.js
│   ├── server.js
│   └── worker.js
├── tests/
│   └── full-system.test.js
├── .env.example
├── package.json
├── README.md
└── wrangler.toml
```

## 4. Hướng Dẫn Chạy Cục Bộ & Kiểm Thử

```bash
# 1. Khởi tạo cấu trúc bảng & nạp dữ liệu chuẩn (05 ngôn ngữ, gói dịch vụ, học liệu, bài thi, tin tức)
npm run setup

# 2. Chạy toàn bộ bộ kiểm thử tự động (10 phân hệ + kiểm thử hồi quy Server & Worker)
npm test

# 3. Chạy kịch bản xác minh toàn vẹn hệ thống (DB Integrity, Quota, RBAC, Giao diện)
npm run verify

# 4. Khởi động máy chủ phát triển cục bộ
npm start
```

## 5. Triển Khai Cloudflare Workers, D1 & R2

Xem hướng dẫn chi tiết từng bước trong [`docs/ARCHITECTURE_AND_ADMIN_GUIDE.md`](docs/ARCHITECTURE_AND_ADMIN_GUIDE.md) và báo cáo kiểm thử nghiệm thu trong [`docs/TEST_AND_ACCEPTANCE_REPORT.md`](docs/TEST_AND_ACCEPTANCE_REPORT.md).

## 6. Thông Tin Liên Hệ Chính Thức

- **Email hệ thống tự động:** `noreply@wordbridge.io.vn`
- **Liên hệ chính thức & chung:** `wordbridge.education@gmail.com`
- **Chăm sóc khách hàng & Hỗ trợ:** `cskh@wordbridge.io.vn`
- **Hợp tác & Truyền thông:** `contact@wordbridge.io.vn`
- **Nhóm sáng lập:** Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như
