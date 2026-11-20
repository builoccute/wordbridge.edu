# Hướng dẫn Triển khai Cloudflare Workers, D1 & R2

## 1. Kiểm tra trước khi triển khai
- Xác nhận `wrangler.toml` gắn đúng:
  - D1 `database_name = "word"`, `database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771"`.
  - R2 `bucket_name = "word"`.
- Chạy `npm test` đảm bảo 100% kiểm thử đạt.

## 2. Sao lưu D1 trước khi chạy migration
```bash
bash scripts/d1-backup.sh ./backups
```

## 3. Áp dụng Migration an toàn
```bash
# Kiểm thử cục bộ trước
npm run db:migrate:local

# Áp dụng lên D1 production `word` (chỉ CREATE TABLE IF NOT EXISTS / INSERT OR IGNORE)
npm run db:migrate:remote
```

## 4. Nạp Secrets (không bao giờ lưu vào Git)
```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put CSRF_SECRET
npx wrangler secret put TOKEN_PEPPER
npx wrangler secret put RESEND_API_KEY
```

## 5. Deploy Worker
```bash
npm run deploy
```

## 6. Trạng thái triển khai hiện tại
- **DEPLOYED**: `NOT STARTED` (cần `CLOUDFLARE_API_TOKEN` và quyền triển khai tài khoản Cloudflare của chủ dự án).
