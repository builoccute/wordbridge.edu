# WORD BRIDGE V4.2

Nền tảng học tập, tra cứu từ điển, luyện tập 7 kỹ năng, ngoại ngữ chuyên ngành và thư viện đọc cho **Tiếng Trung (中文)** và **Tiếng Anh (English)** trên một tên miền thống nhất (`https://wordbridge.io.vn`), vận hành bằng **Cloudflare Workers**, **Cloudflare D1**, **Cloudflare R2** và **Static Assets**.

## Phạm vi sản phẩm V4.2
- **Hai ngôn ngữ học tập chính thức:** Tiếng Trung (`zh`) và Tiếng Anh (`en`). Tiếng Nga đã được ngừng phát hành an toàn và lưu trữ bằng migration không phá hủy (`0014`).
- **Không có cổng quản trị công khai:** Mọi đường dẫn `/quan-tri*` và `/admin*` bị chặn công khai (`404`, không chuyển hướng, không lộ cấu trúc). Các nghiệp vụ backend quản trị (`/api/v1/admin/*`) được tách bạch hoàn toàn sau xác thực phiên, RBAC và CSRF.
- **Không có phân hệ Exam / cấp chứng chỉ / OAuth mạng xã hội.**
- **Bảng màu Design System:** Deep Teal `#146466`, Vermilion Red `#C92F1C`, Aqua `#5AABA9`, Warm Ivory `#E2E2C4`.

## Hướng dẫn chạy Local
Yêu cầu: Node.js `>= 18.18.0` và Python 3 (cho SQLite test shim).

```bash
# 1. Kiểm tra cú pháp & preflight build
npm run lint:check
npm run build

# 2. Chạy toàn bộ bộ kiểm thử tự động (34 tests)
npm test

# 3. Chạy server local (Node) hoặc Wrangler dev
npm run dev:local
# hoặc khi có wrangler:
npm run db:migrate:local
npm run dev
```

## Hướng dẫn cấu hình & triển khai Cloudflare
1. Kiểm tra `wrangler.toml`:
   - Entrypoint: `main = "src/index.js"`
   - Static Assets: `[assets] directory = "./public", binding = "ASSETS"`
   - D1 Database: `binding = "DB"`, `database_name = "word"`, `database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771"`
   - R2 Bucket: `binding = "R2"`, `bucket_name = "word"`
   - `compatibility_flags = ["nodejs_compat"]`
2. Thiết lập secrets (không commit vào git):
   ```bash
   wrangler secret put SESSION_SECRET
   wrangler secret put CSRF_SECRET
   wrangler secret put EMAIL_API_KEY
   ```
3. Sao lưu D1 trước khi chạy migration 0014 lên production:
   ```bash
   ./scripts/d1-backup.sh
   npm run db:migrate:remote
   # Nếu cần khôi phục: dùng database/rollbacks/0014_v42_rollback.sql
   ```
4. Triển khai Worker:
   ```bash
   npm run build && npm run deploy
   ```

## Tài liệu nghiệm thu & kỹ thuật
- `docs/UI-REFERENCE-MAP.md` — Bảng ánh xạ 22 ảnh giao diện tham chiếu.
- `docs/CLOUDFLARE-1101-INCIDENT-REPORT.md` — Báo cáo điều tra & khắc phục lỗi Cloudflare 1101.
- `docs/PRODUCTION-READINESS-AND-HANDOFF.md` — Danh sách route, báo cáo kiểm thử và các hạng mục cần đầu vào production.
