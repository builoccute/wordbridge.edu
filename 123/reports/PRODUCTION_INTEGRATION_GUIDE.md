# HƯỚNG DẪN TÍCH HỢP PRODUCTION — WORD BRIDGE (Cloudflare Worker `wordbridge-edu`)

> **Trạng thái triển khai Production hiện tại:** `BLOCKED – PRODUCTION SOURCE NOT PROVIDED`
> Gói nguồn đầu vào chỉ chứa gói nâng cấp v0.8.0 (`frontend/`, `data/`, `migrations/`, `reports/`), **chưa chứa repository production** của `https://www.wordbridge.io.vn/`.

## 1. Danh sách tệp Production bắt buộc cần người dùng cung cấp để hoàn tất tích hợp thật
Để tích hợp trực tiếp vào hệ thống đang chạy (không tạo Worker mới, không thay thế Backend/Auth/Passkeys/RBAC/D1/R2), cần cung cấp:
1. Toàn bộ thư mục `src/` (bao gồm `src/index.js`, router API, middleware xác thực, Passkeys, RBAC, truy vấn D1/R2).
2. Toàn bộ thư mục `public/` (HTML/CSS/JS, header/footer dùng chung của `/`, `/login`, `/practice`, `/dictionary`, `/flashcards`, `/reader`).
3. Tệp `wrangler.toml` (đã loại bỏ toàn bộ secrets/tokens).
4. Schema D1 hiện tại của database `word` (kết quả `SELECT sql FROM sqlite_master WHERE type='table';` và `SELECT * FROM d1_migrations;`).
5. Cấu trúc lưu trữ object trong R2 bucket `word` (nếu đã có âm thanh thực tế).

## 2. Quy trình tích hợp an toàn khi đã có repository Production
### Bước 1: Sao lưu D1 & kiểm tra schema hiện tại
```bash
npx wrangler d1 export word --remote --output=backup_word_before_upgrade.sql
npx wrangler d1 execute word --remote --file=migrations/diagnostics/002_diagnostics_dictionary_and_specialty.sql
```
Kiểm tra kết quả `d1_migrations` để chắc chắn tên `20261127_001_wordbridge_learning_upgrade.sql` không trùng tên hoặc thứ tự với bất kỳ migration cũ nào.

### Bước 2: Chạy Migration tương thích ngược trên Staging/Local trước khi chạy Production
```bash
# Kiểm thử local/staging trước
npx wrangler d1 execute word --local --file=migrations/20261127_001_wordbridge_learning_upgrade.sql
# Chỉ chạy remote sau khi staging đạt 100% kiểm thử
npx wrangler d1 execute word --remote --file=migrations/20261127_001_wordbridge_learning_upgrade.sql
```
> **Lưu ý:** Thư mục `migrations/rollbacks/` và `migrations/diagnostics/` được tách riêng để `wrangler d1 migrations apply` không bao giờ tự chạy nhầm rollback.

### Bước 3: Gắn route API học tập vào `src/index.js` hiện có (bảo toàn Auth/Passkey/RBAC)
1. Sao chép 2 tệp trong `integration/` vào `src/learning/`:
   - `integration/worker-learning-routes.js` → `src/learning/worker-learning-routes.js`
   - `integration/dictionary-and-specialty-fix.js` → `src/learning/dictionary-and-specialty-fix.js`
2. Trong `src/index.js`, tại nhánh `fetch(request, env, ctx)`, gắn route `/api/wb/*` **sau** middleware xác thực hiện có:
```js
import { handleWordBridgeLearningApi } from "./learning/worker-learning-routes.js";

if (url.pathname.startsWith("/api/wb/")) {
  const authUser = await getExistingAuthenticatedUser(request, env); // Dùng hàm auth/Passkey hiện có
  return handleWordBridgeLearningApi(request, env, authUser);
}
```
3. Áp dụng `buildDictionaryWhereClause`, `normalizeSaveVocabPayload`, và `stripInternalUiLabels` từ `dictionary-and-specialty-fix.js` vào các endpoint từ điển & lưu thuật ngữ hiện có (không đổi `REVIEW_REQUIRED` sang `PUBLISHED` hàng loạt, không xóa dữ liệu).

### Bước 4: Tích hợp giao diện & học liệu vào `public/`
1. Sao chép `frontend/styles/wordbridge.css`, `frontend/js/api-adapter.js`, `frontend/js/app.js` vào `public/learning/` (hoặc cấu trúc asset hiện tại của `public/`).
2. Sao chép thư mục `data/` vào `public/data/` (hoặc nạp vào D1/R2 bucket `word`).
3. Nhúng `api-adapter.js` và `app.js` vào trang học tập của website chính (`/practice` hoặc `/learning`), cấu hình `window.WB_CONFIG = { apiBase: "/api/wb", dataBase: "/data/" }`. Không yêu cầu người dùng sang tên miền độc lập.
4. Khi tải tệp âm thanh MP3 thực tế lên R2 bucket `word`, cập nhật `audio_url`, `asset_status = 'AUDIO_READY'` và `allow_playback_button = 1` trong `wb_audio_asset_bindings` / `data/audio/audio-manifest.json`.

### Bước 5: Kiểm thử trên `wrangler dev` / Staging trước khi deploy
```bash
npx wrangler dev
# Kiểm thử đầy đủ đăng nhập, lưu tiến độ, tải lại trang, đăng xuất/đăng nhập lại, kiểm tra cô lập user_id
npm run deploy
```
