# WORD BRIDGE

> **Where Languages Bring People Together.**
> Website chính thức: [https://www.wordbridge.vn/](https://www.wordbridge.vn/)

WORD BRIDGE là nền tảng học tập, tra cứu từ điển, luyện tập bốn kỹ năng, khảo thí tham chiếu, thực hành trực tiếp và phân tích năng lực ngoại ngữ theo kiến trúc **Multi-page Website** trên **Cloudflare Workers**, **Cloudflare D1 (`word`)** và **Cloudflare R2 (`word`)**.

## 1. Mục tiêu & Phạm vi sản phẩm
- **Ba ngôn ngữ học tập chính thức**:
  - **Tiếng Trung (`zh`)**: Học tổng quát (tham chiếu HSK 1–6 & HSK 7–9) + Học chuyên ngành.
  - **Tiếng Anh (`en`)**: Học tổng quát (tham chiếu CEFR A1–C2, IELTS/TOEFL/Cambridge) + Học chuyên ngành.
  - **Tiếng Nga (`ru`)**: Học tổng quát (tham chiếu TORFL/ТРКИ: ТЭУ, ТБУ, ТРКИ-I đến ТРКИ-IV) — **không mở chuyên ngành Tiếng Nga**.
  - Tuyệt đối không xây dựng tiếng Nhật (`ja`) hoặc tiếng Hàn (`ko`) ở mọi tầng (Database `CHECK`, Backend, API, Frontend, CMS, Admin).
- **Giới hạn sản phẩm cứng**:
  - Không mạng xã hội, không nhắn tin tự do.
  - **Learner Meet**: chỉ âm thanh & video (1–1 hoặc nhóm); tuyệt đối không chat văn bản, không gửi tệp, không chia sẻ màn hình, không ghi âm/ghi hình từ nền tảng.
  - **Khảo thí**: tuyệt đối không cấp chứng chỉ dưới mọi hình thức.
  - **Tài khoản**: chỉ tài khoản cá nhân (`PERSONAL FREE` / `PERSONAL PLUS`), phân quyền quản trị bằng RBAC 9 vai trò. Chính sách sinh viên: miễn phí 03 tháng `PERSONAL PLUS` một lần duy nhất, chỉ xác minh bằng email sinh viên do trường cấp.
  - **PDF Reader độc lập** (`https://reader.wordbridge.vn/`): không đưa vào Header/Footer/trang chủ WORD BRIDGE.

## 2. Kiến trúc Multi-page Website & Sitemap
Mỗi mục trên thanh điều hướng mở một trang độc lập với URL riêng, `<title>` riêng, breadcrumb riêng, SEO metadata riêng và kết nối dữ liệu backend thực tế. Trang chủ (`/`) chỉ đóng vai trò giới thiệu thương hiệu và điều hướng. Chi tiết toàn bộ 85+ route xem tại [`docs/MULTI-PAGE-SITEMAP.md`](docs/MULTI-PAGE-SITEMAP.md).

## 3. Tech Stack
- **Runtime**: Cloudflare Workers (ES Modules, `compatibility_flags = ["nodejs_compat"]`).
- **Database**: Cloudflare D1 — `word` (Database ID: `ce84cc48-6d49-409b-b45a-13ba3bc4a771`).
- **Object Storage**: Cloudflare R2 — bucket `word`.
- **Frontend**: Multi-Page SSR HTML + Design System CSS (`#146466` Deep Teal, `#C92F1C` Vermilion Red, `#5AABA9` Aqua, `#E2E2C4` Warm Ivory) + Progressive Client JS.
- **Security**: Web Crypto `PBKDF2-SHA256` (100,000 vòng), `SHA-256` token băm, cookie `HttpOnly; SameSite=Lax; Secure`, CSRF, CSP, RBAC 9 vai trò, Audit Log.
- **Testing**: `node --test` trên SQLite3 thật + Worker `fetch` harness.

## 4. Cấu trúc thư mục
```text
WORD-BRIDGE/
├── src/                  # Worker entry, config, utils, layouts, services, API router, pages & 9 domain modules
├── public/               # Design System CSS, Client JS, Branding/Logo SVG slot
├── database/             # 8 D1 migrations an toàn (không DROP TABLE) & tài liệu schema
├── storage/              # Cloudflare R2 adapter (bucket `word`)
├── email/                # Base layout HTML+Text, 30 templates bắt buộc & tài liệu DNS SPF/DKIM/DMARC
├── tests/                # Unit, Integration (D1 SQLite & Multi-page Navigation) và E2E
├── scripts/              # Local dev server, D1 backup/restore, seed generator
├── docs/                 # 18 tài liệu đặc tả, nghiên cứu, kiến trúc, bảo mật & báo cáo kiểm thử
├── .github/workflows/    # CI & Deploy pipelines
├── wrangler.toml         # Cấu hình Cloudflare Workers/D1/R2
├── .env.example          # Mẫu biến môi trường (không chứa secrets)
└── package.json
```

## 5. Yêu cầu môi trường & Cài đặt
- Node.js `>= 18.18.0`, Python `3.10+` (cho bộ kiểm thử SQLite3 cục bộ), Wrangler `4.x` khi triển khai Cloudflare.
- Không cần cài đặt runtime dependency nặng để chạy thử hoặc kiểm thử cục bộ.

```bash
# Kiểm tra cú pháp
npm run lint:check

# Chạy toàn bộ bộ kiểm thử tự động (Unit + Integration + E2E)
npm test

# Chạy máy chủ phát triển cục bộ (SQLite3 D1 shim)
npm run dev:local
# Mở http://localhost:8787
```

## 6. Cấu hình Environment Variables, D1, R2, Email, OAuth & Learner Meet
Sao chép `.env.example` và cấu hình secrets trên Cloudflare bằng `wrangler secret put <NAME>`:
- **D1 (`word`)**: Áp dụng migrations an toàn bằng `npm run db:migrate:local` trước khi chạy `npm run db:migrate:remote`. **Tuyệt đối không `DROP TABLE` hoặc thay đổi Database ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771`.**
- **R2 (`word`)**: Tự động kiểm soát tiền tố key hợp lệ và chặn mọi bản ghi Learner Meet.
- **Email**: 3 kênh chính thức (`noreply@wordbridge.vn` với `Reply-To: cskh@wordbridge.vn`, `cskh@wordbridge.vn`, `contact@wordbridge.vn`). Xem [`docs/EMAIL-SPECIFICATION.md`](docs/EMAIL-SPECIFICATION.md) và [`email/documentation/DOMAIN-AUTH-DNS.md`](email/documentation/DOMAIN-AUTH-DNS.md).
- **OAuth & Learner Meet**: Sẵn sàng adapter cho Google/Facebook/Microsoft/Apple và LiveKit WebRTC; ở trạng thái `BLOCKED` cho đến khi cấu hình credentials (xem [`docs/REMAINING-ISSUES.md`](docs/REMAINING-ISSUES.md)).

## 7. Đưa lên GitHub & Triển khai Cloudflare
1. Giải nén `WORD-BRIDGE-GITHUB-READY.zip`, khởi tạo `git init`, kiểm tra `.gitignore` và đẩy lên repository GitHub.
2. Cấu hình GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Chạy workflow `.github/workflows/ci.yml` để xác nhận kiểm thử xanh, sau đó kích hoạt `.github/workflows/deploy.yml` (hoặc chạy `npx wrangler deploy`).

## 8. Troubleshooting
- **Lỗi `EMAIL_PROVIDER=unconfigured`**: Bình thường khi chưa nạp `RESEND_API_KEY`; hệ thống ghi nhận trạng thái `BLOCKED_UNCONFIGURED` trong `wb_email_events` và không giả mạo `DELIVERED`.
- **Truy cập `/admin` bị 403**: Tài khoản mới không có quyền quản trị mặc định; cần gán vai trò RBAC hợp lệ qua bảng `wb_account_roles` hoặc tài khoản `Super Admin`.
- **Chi tiết toàn bộ tài liệu**: Xem thư mục [`docs/`](docs/).
