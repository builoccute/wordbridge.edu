# HƯỚNG DẪN ROLLBACK — WORD BRIDGE

## 1. Nguyên tắc an toàn Rollback
- Toàn bộ bảng mới của gói nâng cấp đều mang tiền tố `wb_*` (9 bảng).
- Không có bất kỳ bảng cũ nào (`users`, `auth`, `passkeys`, `rbac`, `dictionary`, `specialties`) bị sửa cấu trúc hoặc xóa.
- Tệp rollback nằm độc lập tại `migrations/rollbacks/20261127_001_rollback.sql`, **tách khỏi** thư mục `migrations/` gốc để tránh chạy nhầm.

## 2. Quy trình Rollback Cơ sở dữ liệu (Cloudflare D1)
1. **Sao lưu trạng thái hiện tại trước khi rollback:**
   ```bash
   npx wrangler d1 export word --remote --output=backup_word_before_rollback.sql
   ```
2. **Kiểm tra trên local/staging trước:**
   ```bash
   npx wrangler d1 execute word --local --file=migrations/rollbacks/20261127_001_rollback.sql
   ```
3. **Thực thi rollback trên remote (khi đã phê duyệt):**
   ```bash
   npx wrangler d1 execute word --remote --file=migrations/rollbacks/20261127_001_rollback.sql
   ```
4. **Xác minh các bảng legacy còn nguyên vẹn:**
   ```bash
   npx wrangler d1 execute word --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
   ```

## 3. Rollback Mã nguồn Cloudflare Worker & Giao diện
1. Gỡ nhánh `if (url.pathname.startsWith("/api/wb/"))` trong `src/index.js` hoặc khôi phục phiên bản Worker trước đó qua Cloudflare Dashboard (`Workers & Pages → wordbridge-edu → Deployments → Rollback`).
2. Xác minh lại trang chủ `/`, `/login` (Passkey), `/dictionary` và `/reader` hoạt động bình thường.
