# HƯỚNG DẪN TRIỂN KHAI GITHUB & CLOUDFLARE (`docs/DEPLOYMENT.md`)

## 1. Quy trình 13 Bước Đưa Mã nguồn lên GitHub & Triển khai (PHẦN XX Mục 73)

1. **Bước 1 – Giải nén gói bàn giao:**
   ```bash
   unzip WORD-BRIDGE-GITHUB-READY.zip -d ./word-bridge-workspace
   cd ./word-bridge-workspace/WORD-BRIDGE
   ```
2. **Bước 2 – Tạo GitHub Repository mới:**
   Truy cập GitHub và khởi tạo một repository trống (Private hoặc Public tùy chính sách nội bộ), ví dụ: `https://github.com/<your-account>/word-bridge.git`.
3. **Bước 3 – Đưa mã nguồn lên GitHub Repository:**
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat: initial greenfield build of WORD BRIDGE platform"
   git remote add origin https://github.com/<your-account>/word-bridge.git
   git push -u origin main
   ```
4. **Bước 4 – Cấu hình GitHub Secrets và Variables (Quyền tối thiểu, không lộ khóa công khai):**
   Trong `Settings → Secrets and variables → Actions` của GitHub repository, thêm:
   - `CLOUDFLARE_ACCOUNT_ID`: `6028ea7100116ba19b3c6b9590c45768`
   - `CLOUDFLARE_API_TOKEN`: API Token có quyền tối thiểu (`Workers Scripts:Edit`, `D1:Edit`, `R2:Edit`, `Workers Routes:Edit`).
5. **Bước 5 – Kết nối Cloudflare Wrangler tại máy quản trị:**
   ```bash
   npx wrangler login
   npx wrangler whoami
   ```
6. **Bước 6 – Kiểm tra kết nối Cloudflare D1 (`word`):**
   Database `word` (`ce84cc48-6d49-409b-b45a-13ba3bc4a771`) đã được khai báo sẵn trong `wrangler.toml`. Kiểm tra schema hiện tại:
   ```bash
   npx wrangler d1 execute word --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
   ```
7. **Bước 7 – Kiểm tra kết nối Cloudflare R2 (`word`):**
   Bucket `word` đã được gắn với binding `STORAGE` trong `wrangler.toml`:
   ```bash
   npx wrangler r2 bucket list
   ```
8. **Bước 8 – Chạy Database Migrations an toàn (Không `DROP TABLE`):**
   ```bash
   npm run db:migrate:local
   npm run db:migrate:prod
   ```
9. **Bước 9 – Chạy Build sản phẩm:**
   ```bash
   npm run build
   ```
10. **Bước 10 – Chạy toàn bộ Kiểm thử Tự động:**
    ```bash
    npm test
    ```
11. **Bước 11 – Triển khai môi trường Staging:**
    ```bash
    npm run deploy:staging
    ```
12. **Bước 12 – Kiểm thử nghiệm thu trên Staging:**
    Kiểm tra `/api/health`, luồng đăng ký 8 trường, xác minh email, 10 phân hệ và 15 hệ thống trí tuệ ngôn ngữ trên URL staging.
13. **Bước 13 – Triển khai môi trường Production (`www.wordbridge.vn`):**
    ```bash
    # Thiết lập các biến bí mật trên Cloudflare Production
    npx wrangler secret put SESSION_SECRET --env production
    npx wrangler secret put CSRF_SECRET --env production
    npm run deploy:production
    ```

## 2. Quy trình Rollback An toàn khi có Sự cố
```bash
# Xem danh sách các phiên bản Worker đã triển khai gần nhất:
npx wrangler deployments list --env production

# Rollback tức thời về phiên bản ổn định liền trước:
npx wrangler rollback --env production
```
