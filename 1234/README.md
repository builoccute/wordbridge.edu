# WORD BRIDGE — Where Languages Bring People Together.

- **Tên dự án:** WORD BRIDGE
- **Thông điệp thương hiệu:** *Where Languages Bring People Together.*
- **Website chính:** [https://www.wordbridge.vn/](https://www.wordbridge.vn/)
- **Ứng dụng PDF Reader độc lập (Chỉ kết nối SSO khi có cấu hình):** `https://reader.wordbridge.vn/`
- **Cloudflare D1 Database:** `word` (`ce84cc48-6d49-409b-b45a-13ba3bc4a771`)
- **Cloudflare R2 Bucket:** `word` (Default Storage Class)

---

## 1. Giới thiệu Dự án & Phạm vi Ngôn ngữ
**WORD BRIDGE** là nền tảng học tập, thực hành, khảo thí và phân tích năng lực ngoại ngữ trực tuyến được xây dựng mới hoàn toàn từ con số 0 (Greenfield Development), tập trung vào ba ngôn ngữ:
1. **Tiếng Trung (`zh`)**: Học tổng quát (**Có**) | Học chuyên ngành (**Có**).
2. **Tiếng Anh (`en`)**: Học tổng quát (**Có**) | Học chuyên ngành (**Có**).
3. **Tiếng Nga (`ru`)**: Học tổng quát (**Có**) | Học chuyên ngành (**Không**).

*(Hệ thống tuyệt đối không xây dựng tiếng Nhật hoặc tiếng Hàn, không cấp chứng chỉ, không có mạng xã hội, không có chat hay ghi âm/ghi hình trong Learner Meet, và không có tài khoản tổ chức).*

## 2. Công nghệ Sử dụng (Tech Stack)
- **Runtime & API:** Cloudflare Workers (ES Modules `src/worker.mjs`)
- **Database:** Cloudflare D1 (`word`) với 100% truy vấn tham số hóa (Prepared Statements)
- **Object Storage:** Cloudflare R2 (`word`) với 11 tiền tố chuẩn và kiểm soát quyền truy cập
- **Frontend & UI:** SSR HTML5 + Hydrated ES Module Client + Custom Design System CSS (`#146466`, `#C92F1C`, `#5AABA9`, `#E2E2C4`)
- **Bảo mật:** `PBKDF2-SHA256` (100.000 vòng), WebAuthn/FIDO2 Passkey, OAuth 2.0, CSRF, XSS, SQLi Guard, Brute-force Lockout, Rate Limiting, RBAC 9 vai trò quản trị
- **Kiểm thử:** Node.js Native Test Runner (`Unit`, `Integration`, `Security`, `E2E`)

## 3. Yêu cầu Môi trường & Cài đặt Local
- **Node.js:** `>= 18.0.0` (Khuyến nghị Node.js 20 LTS)
- **Wrangler CLI:** `>= 3.80.0` (Khi triển khai lên Cloudflare)

```bash
# 1. Sao chép file biến môi trường mẫu
cp .env.example .dev.vars

# 2. Chạy bản build kiểm tra tài nguyên và SQL migrations
npm run build

# 3. Chạy máy chủ phát triển tại local (http://localhost:8787)
npm run dev

# 4. Chạy toàn bộ bộ kiểm thử tự động (Unit, Integration, Security, E2E)
npm test
```

## 4. Cấu hình Cloudflare D1, R2 & Migrations
Cấu hình kết nối đã được định nghĩa sẵn trong `wrangler.toml`:
- **D1 Binding (`DB`):** Kết nối tới database `word` (`ce84cc48-6d49-409b-b45a-13ba3bc4a771`), thư mục migrations `database/migrations/`.
- **R2 Binding (`STORAGE`):** Kết nối tới bucket `word`.

```bash
# Kiểm tra các bảng hiện có trên D1 trước khi chạy migration
npm run db:inspect

# Chạy migration trên môi trường local
npm run db:migrate:local

# Chạy migration an toàn (không DROP TABLE) trên môi trường remote
npm run db:migrate:prod
```

## 5. Quy trình 13 Bước Đưa lên GitHub & Triển khai Cloudflare
1. Giải nén file `WORD-BRIDGE-GITHUB-READY.zip`.
2. Tạo GitHub repository mới trên tài khoản của bạn.
3. Đẩy toàn bộ mã nguồn lên nhánh `main` (`git init && git add . && git commit -m "Initial commit" && git push`).
4. Cấu hình `CLOUDFLARE_API_TOKEN` và `CLOUDFLARE_ACCOUNT_ID` trong GitHub Actions Secrets.
5. Đăng nhập Cloudflare (`npx wrangler login`).
6. Kiểm tra cấu hình D1 database `word` (`ce84cc48-6d49-409b-b45a-13ba3bc4a771`).
7. Kiểm tra cấu hình R2 bucket `word`.
8. Thực thi `npm run db:migrate:prod`.
9. Thực thi `npm run build`.
10. Thực thi `npm test` (Đảm bảo 14/14 bài kiểm thử đạt `PASS`).
11. Triển khai môi trường Staging (`npm run deploy:staging`).
12. Kiểm thử nghiệm thu trên Staging.
13. Triển khai môi trường Production (`npm run deploy:production`).

## 6. Danh mục Tài liệu Kỹ thuật Đính kèm
- `docs/50-WEBSITE-RESEARCH.md`: Báo cáo nghiên cứu thực tế 50 website quốc tế.
- `docs/ARCHITECTURE.md`: Kiến trúc tổng thể hệ thống và sơ đồ luồng dữ liệu.
- `docs/DATABASE.md`: Tài liệu schema 35 bảng D1, ERD, ràng buộc và quy trình Backup/Restore.
- `docs/API-DOCUMENTATION.md`: Đặc tả chi tiết toàn bộ REST API và quy tắc phân quyền.
- `docs/SECURITY.md`: Kiến trúc bảo mật, quyền riêng tư và hướng dẫn SPF/DKIM/DMARC.
- `docs/DEPLOYMENT.md`: Hướng dẫn triển khai GitHub Actions, Cloudflare và Rollback.
- `docs/OPERATIONS.md`: Sổ tay vận hành 7 trung tâm quản trị tiếng Việt và quét tệp mồ côi R2.
- `docs/TEST-REPORT.md`: Báo cáo kiểm thử thực tế 29 hạng mục nghiệm thu.
- `docs/REMAINING-ISSUES.md`: Danh mục các đầu vào Nhóm B & Nhóm C cần cấu hình tiếp.
- `docs/CHANGELOG.md`: Nhật ký phiên bản.
