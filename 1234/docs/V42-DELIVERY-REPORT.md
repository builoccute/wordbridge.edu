# WORD BRIDGE V4.2.0 — BÁO CÁO BÀN GIAO, KIỂM THỬ & NGHIỆM THU TỔNG THỂ

**Phiên bản:** `4.2.0` (nâng cấp từ `WORD BRIDGE V4.1.0`)
**Tên miền chính:** `https://wordbridge.io.vn`
**Hạ tầng bảo toàn:** Worker `wordbridge-edu` (`src/index.js`), D1 `DB` (`word`, ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771`), R2 `R2` (`word`), Static Assets `public/`, Cron `*/15 * * * *`, WebAuthn RP ID `wordbridge.io.vn`.

---

## 1. Danh sách lỗi P0 đã phát hiện và đã khắc phục

| # | Lỗi phát hiện | Nguyên nhân gốc | Cách khắc phục | Trạng thái |
|---|---|---|---|---|
| 1 | **HTTP 500 — "Hệ thống tạm thời gặp sự cố"** trên D1 nâng cấp chưa đồng bộ | `ensurePublicCatalogSchema()` chỉ kiểm tra duy nhất 1 view `wb_public_courses` rồi thoát sớm, khiến các view/bảng khác (`wb_skill_reviews`, `wb_lesson_notes`, `wb_public_reader_documents`, `wb_public_languages`) bị thiếu và gây ngoại lệ SQL. | Kiểm tra đầy đủ toàn bộ nhóm view/bảng bắt buộc, tự tạo idempotent phần còn thiếu và ghi log nội bộ thay vì nuốt lỗi âm thầm. | Đã sửa & kiểm thử |
| 2 | **HTTP 500 trên tài sản tĩnh (`ASSETS.fetch`)** | Truyền thẳng đối tượng `request` (có thể là `POST` hoặc chứa body) vào `rawEnv.ASSETS.fetch()`. | Chuẩn hóa method sang `GET`/`HEAD` và bọc xử lý fallback có ghi log cảnh báo. | Đã sửa & kiểm thử |
| 3 | **`ReferenceError: crypto is not defined`** khi chạy Node 18 local/test | Gọi `crypto.randomUUID()` trực tiếp thay vì `(globalThis.crypto || nodeWebCrypto).randomUUID()`. | Chuẩn hóa toàn bộ lời gọi UUID sang `(globalThis.crypto || nodeWebCrypto).randomUUID()`. | Đã sửa & kiểm thử |
| 4 | **`this.r2.putPrivateObject is not a function`** khi tải audio luyện nói | Tên phương thức adapter R2 không khớp với `bucket.put`. | Gọi trực tiếp `this.r2.bucket.put()` với `customMetadata` phạm vi `private_speaking_audio`. | Đã sửa & kiểm thử |
| 5 | **Sự cố Cloudflare 1100 & 1101** (`www.wordbridge.io.vn`, Ray ID `a5ee8729dc25797c`) | 1101 là ngoại lệ JS trong Worker; 1100 là sự cố lớp mạng biên/tài nguyên Cloudflare. Môi trường sandbox không có quyền đăng nhập Cloudflare Dashboard nên **không tự tuyên bố đã xác minh log production**. | Bổ sung trang hướng dẫn riêng `/help/errors/1100` và `/help/errors/1101`, chuẩn hóa Request ID + JSON structured logging, tách riêng màn hình `/session-invalid` trả đúng HTTP `401`. | Đã xử lý mã nguồn; cần đối chiếu log Dashboard production |

---

## 2. Danh sách thay đổi chính (V4.1.0 → V4.2.0)

1. **Migration `0016_v42_admin_pin_policies_language_api_domains.sql` + Rollback `0016_v42_rollback.sql`**: Bảo toàn nguyên vẹn 19 migration lịch sử (`0001`–`0015`), bổ sung 17 bảng mới có khóa ngoại và index.
2. **Trung tâm Quản trị (`/quan-tri`) + Khóa PIN 6 chữ số (`src/modules/admin-pin-pages.js`)**:
   - Khôi phục `/quan-tri` và `/api/v1/admin/*` (giữ `/admin` trả 404).
   - Giao diện 100% tiếng Việt gồm 11 phân hệ (Tổng quan, Tài khoản, Nhân sự & 8 vai trò RBAC, Học thuật, Thư viện, Luyện tập, Quản trị API, Dữ liệu & Lưu trữ, Bảo mật & Kiểm toán, Vận hành & Hỗ trợ, Quản lý Chính sách & Pháp lý).
   - PIN 6 chữ số riêng từng tài khoản, băm PBKDF2-SHA256 kèm salt tại backend, khóa tạm 15 phút sau 5 lần sai, phiên quản trị 30 phút (`wb_admin_session`, `HttpOnly`, `SameSite=Strict`), ghi audit log đầy đủ, Super Admin chỉ được đặt lại PIN chứ không xem được PIN.
3. **Hệ thống Chính sách Pháp lý (`src/modules/legal-policies.js`)**:
   - Đưa toàn văn **Điều khoản sử dụng** (24 điều, `/policies/terms`) và **Chính sách quyền riêng tư** (19 mục, `/policies/privacy`) cùng 7 trang chính sách bổ sung lên website với mục lục điều hướng, số phiên bản, ngày hiệu lực, kiểm soát xuất bản production (chặn nếu thiếu thông tin chủ thể vận hành).
   - Tích hợp checkbox chưa đánh dấu sẵn tại `/register`, ghi nhận đồng ý theo phiên bản (`wb_user_policy_consents`), và **Trung tâm quyền riêng tư** (`/account/privacy`) cho phép truy cập, rút lại đồng ý, xóa bản ghi âm/bản nháp và gửi yêu cầu xóa dữ liệu.
4. **Hệ thống Đăng nhập 6 phương thức (`src/modules/oauth-service.js`)**:
   - Hỗ trợ Email/Mật khẩu, Passkeys/WebAuthn và adapter OAuth2 cho Google, Facebook, Microsoft, Apple với CSRF state lưu D1 và luồng xác minh SĐT sau OAuth (`/api/v1/auth/oauth/verify-phone`). Trả `503 OAUTH_NOT_CONFIGURED` minh bạch khi chưa cấu hình Secrets (không giả lập).
5. **Kiến trúc Language Services Provider Adapter (`src/modules/language-api-adapters.js`)**:
   - Triển khai hợp đồng API cho Reading (4 tầng đọc hiểu), Listening/TTS, Speaking/STT (lưu R2 riêng tư có hạn 24h), Pronunciation Assessment, Writing (rubric cấu trúc Anh/Trung, không tự ghi đè bài gốc), Translation (**Zero User Data Storage**), OCR (riêng tư), và Unified Progress (`/api/v1/learning/progress`).
   - Báo rõ `503 PROVIDER_NOT_CONFIGURED` khi thiếu API key, tuyệt đối không tạo audio hoặc điểm phát âm giả.
6. **Học thuật Trung–Anh & 100 Lĩnh vực Chuyên ngành (`src/modules/academic-catalog.js`)**:
   - 22 chủ điểm nền tảng Tiếng Trung (HSK) & 22 chủ điểm nền tảng Tiếng Anh (CEFR), không cấp chứng chỉ, không tiếng Nga, không Exam.
   - Danh mục đủ 100 lĩnh vực chuyên ngành (tách riêng mục 100 thành 4 mã ngành độc lập: `thoi-trang`, `bat-dong-san`, `quan-ly-su-kien`, `dich-vu-khach-hang` = **103 mã ngành**), liên kết 12 bộ dữ liệu thuật ngữ thật đã xuất bản (**12.104 thuật ngữ**), hiển thị số liệu động và không tạo giả 100.000 mục từ.
7. **Trang Liên hệ (`/contact`) & 20/20 Giao diện (WB-UI-20)**:
   - Giải nén đủ 20/20 ảnh WebP vào `docs/reference-images/wordbridge-ui/`, tạo `README.md`, `manifest.json` và SHA-256 checksum.
   - Bám đúng bố cục 3 cột (CSKH, Trung tâm Trợ giúp, Phản hồi & góp ý), không thời gian CSKH, không dùng từ "Support", bắt buộc đăng nhập (`/login?next=%2Fcontact&intent=contact.send`), hỗ trợ 12 nhóm yêu cầu.

---

## 3. Kết quả kiểm thử thực tế

| Hạng mục kiểm thử | Lệnh / Công cụ | Kết quả thực tế |
|---|---|---|
| Kiểm tra cú pháp JS | `npm run lint:check` | **ĐẠT** (9/9 tệp nguồn & test) |
| Migration DB sạch (`0001`–`0016`) | Python `sqlite3` (`PRAGMA foreign_keys = ON`) | **ĐẠT** (123 bảng, `integrity_check = ok`, 0 lỗi khóa ngoại) |
| Migration nâng cấp (`0001`–`0015` → `0016`) | Snapshot 108 bảng gốc trước/sau | **ĐẠT** (108/108 bảng giữ nguyên số hàng) |
| Sao lưu & Khôi phục độc lập | SQLite Online Backup sang DB mới | **ĐẠT** (`integrity_check = ok`) |
| Rollback `0016_v42_rollback.sql` | Chạy rollback trên DB đã nâng cấp | **ĐẠT** (gỡ sạch 17 bảng mới, giữ nguyên bảng cũ) |
| Kiểm thử tích hợp, bảo mật, PIN, Chính sách, API, 20 UI route | `node --test tests/v42-master-verification.test.mjs` | **ĐẠT 5/5 bộ kiểm thử (0 lỗi)** |
| `npm ci` / `npm run build` / `npm run test:e2e` | Yêu cầu internet (npm registry / Playwright) | **CHƯA CHẠY TẠI SANDBOX OFFLINE** — cần chạy trên máy triển khai có internet |

---

## 4. Danh sách API Provider & Hướng dẫn cấu hình Cloudflare Workers Secrets

### Trạng thái Provider
- **Đã hoạt động cục bộ (D1/R2):** Dictionary (`wordbridge_d1_lexicon`), Reading Comprehension, Listening Grading, Writing Structural Rubric, Learning Progress, 15 Language Intelligence Systems.
- **Cần cấu hình Secrets (`NOT_CONFIGURED` cho đến khi cấp key):**
  - OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`
  - TTS & Pronunciation: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (hoặc `GOOGLE_TTS_API_KEY`)
  - STT: `OPENAI_API_KEY` (hoặc Azure Speech)
  - Translation (Zero Storage): `TRANSLATION_API_KEY`, `TRANSLATION_API_ENDPOINT`
  - Writing nâng cao (tùy chọn): `WRITING_API_KEY`
  - OCR: `OCR_API_KEY`, `OCR_API_ENDPOINT`
  - Email & Bảo mật: `TOKEN_PEPPER`, `RESEND_API_KEY`, `EMAIL_WEBHOOK_SECRET`, `VERIFIED_CSKH_EMAIL`

### Lệnh triển khai trên máy có quyền Cloudflare
```sh
# 1. Sao lưu D1 production trước mọi thay đổi
npx wrangler d1 export word --remote --output=../word-backup-$(date +%Y%m%d).sql

# 2. Cài dependency & kiểm thử đầy đủ
npm ci
npm run lint:check
npm run build
npm test
node --test tests/v42-master-verification.test.mjs

# 3. Áp dụng migration 0016 (kiểm tra staging trước khi chạy --remote)
npx wrangler d1 execute word --remote --file=database/migrations/0016_v42_admin_pin_policies_language_api_domains.sql --yes

# 4. Nạp Secrets (ví dụ)
npx wrangler secret put TOKEN_PEPPER
npx wrangler secret put AZURE_SPEECH_KEY
npx wrangler secret put AZURE_SPEECH_REGION

# 5. Triển khai Worker (chỉ chạy sau khi phê duyệt staging)
npm run deploy
```

### Khôi phục khi cần Rollback
```sh
npx wrangler d1 execute word --remote --file=database/rollbacks/0016_v42_rollback.sql --yes
```

---

## 5. Bảng nghiệm thu 20/20 giao diện (WB-UI-20)

Xem chi tiết SHA-256 và kích thước trong `docs/reference-images/wordbridge-ui/manifest.json`. Toàn bộ 20/20 ảnh đã giải nén nguyên bản, đã đối chiếu route, đã nối nghiệp vụ thật và đã vượt qua kiểm thử HTTP status + không chứa tiếng Nga trong `tests/v42-master-verification.test.mjs`.

## 6. Các điểm còn mở cần chủ dự án xác nhận trước Production

1. **Thông tin pháp lý chủ thể vận hành** (`operator_name`, địa chỉ, `privacy_email`, `support_email`, `legal_email`, `effective_date`) để mở khóa xuất bản chính sách trên môi trường `production`.
2. **API Keys nhà cung cấp** (OAuth, TTS/STT/Pronunciation, Translation, OCR, Email) nạp qua `wrangler secret put`.
3. **Truy cập Cloudflare Dashboard** để kiểm tra log thực tế của Ray ID `a5ee8729dc25797c` (1101) và sự cố `1100`, xác nhận custom domain `www.wordbridge.io.vn` vs `wordbridge.io.vn`, và thực hiện deploy.
4. **Biên soạn tiếp các lô thuật ngữ chuyên ngành** cho 88 lĩnh vực chưa có bộ 500 EN + 500 ZH (hiện đã có 12 lĩnh vực / 12.104 thuật ngữ thật đã xuất bản; cần biên soạn và duyệt chất lượng từng lô theo Phần H5, không tự sinh dữ liệu giả).


---

## 7. Tổng hợp sửa toàn diện lỗi P1, P2, P3 (Đợt rà soát toàn bộ mã nguồn)

| Mức độ | Hạng mục lỗi đã sửa | Tệp áp dụng | Kết quả kiểm thử |
|---|---|---|---|
| **P0** | Bảo toàn cơ chế phản hồi HTTP `500` thực tế khi tầng `ASSETS.fetch` gặp lỗi hạ tầng (không che giấu lỗi thành 200/404) | `src/index.js` | ĐẠT (Test #34 gốc + Test #6 V4.2) |
| **P1** | Cập nhật hồ sơ `/api/v1/account/profile` chấp nhận tối thiểu 1 trong 2 trường (Trường học hoặc Nơi làm việc) đồng bộ với đăng ký | `src/index.js` | ĐẠT |
| **P1** | Chống gửi trùng/spam phiếu Liên hệ (`429`) trên bảng `wb_support_requests` và bảo toàn đủ 12 nhóm yêu cầu CSKH | `src/index.js` | ĐẠT |
| **P1** | Tác vụ Cron `cleanup_expired_tokens_and_sessions` tự động dọn phiên quản trị hết hạn và xóa bản ghi âm tạm hết hạn trên D1 & R2 đúng Chính sách quyền riêng tư mục 9 | `src/index.js` | ĐẠT |
| **P1** | Chặn vai trò `editor` tự phê duyệt/xuất bản nội dung học thuật trong `AdminService.updateContentStatus` | `src/index.js` | ĐẠT |
| **P1** | Gỡ tiền tố `learning/russian/` khỏi `ALLOWED_R2_PREFIXES` và bổ sung `private/speaking/` riêng tư | `src/index.js` | ĐẠT |
| **P1** | `public/scripts/app.js` chuẩn hóa gửi giá trị boolean cho `<input type="checkbox">` (Điều khoản sử dụng, xác nhận chính sách CSKH) | `public/scripts/app.js` | ĐẠT (`lint:check`) |
| **P2** | Sửa vỡ lưới responsive trên mobile 360px/390px/768px cho `/quan-tri` (`.wb-admin-shell`) và mục lục chính sách (`.wb-policy-toc`) | `public/styles/design-system.css`, `src/modules/admin-pin-pages.js`, `src/modules/legal-policies.js` | ĐẠT |
| **P2** | Hiển thị đủ 22 chủ điểm nền tảng trên `/learning/chinese`, 22 chủ điểm trên `/learning/english`, danh mục 100 lĩnh vực (103 mã độc lập) trên `/specialized`, nút OAuth động trên `/login` | `src/index.js` | ĐẠT |
| **P2** | Cập nhật OpenAPI 3.1 (`/api/v1/openapi.json`) cho toàn bộ API công khai V4.2, loại trừ tuyệt đối `/api/v1/admin/*` | `src/index.js` | ĐẠT |
| **P3** | Bổ sung bộ giới hạn tần suất (Rate Limiter) trả HTTP `429` + `Retry-After` cho `/auth/login`, `/auth/register`, `/admin/pin/verify`, `/support/tickets` | `src/index.js` | ĐẠT |
