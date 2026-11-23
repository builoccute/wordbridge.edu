# WORD BRIDGE

Website học tiếng Trung và tiếng Anh, giao diện VI/EN. Tệp vào của Worker là `src/index.js`. Wrangler phục vụ tài sản từ `public/`, truy cập D1 qua `DB` và đọc học liệu R2 qua `R2`.

## Chạy trên máy cá nhân

Cần Node.js 22.12 trở lên, npm và Python 3. Chạy tại thư mục có `package.json`.

```sh
npm ci
npm run build
npm test
npm run dev:local
```

Mở http://localhost:8787. Server phát triển dùng SQLite từ các migration và R2 trong bộ nhớ. Biến `WB_LOCAL_DB` cho phép chọn đường dẫn SQLite mới. Giữ database thử nghiệm bên ngoài thư mục bàn giao. Build chạy Wrangler ở chế độ dry-run. Các bài kiểm thử tự tạo database riêng.

Để kiểm tra Chromium, cài Python Playwright bằng `python3 -m pip install playwright`, cài trình duyệt bằng `python3 -m playwright install chromium`, rồi chạy `npm run test:e2e`. Có thể đặt `CHROME_BIN` tới Chromium có sẵn. Kịch bản chạy trên cổng 8799 với tài khoản và bộ xác thực ảo cục bộ.

## Cloudflare

Tên Worker trong ZIP là `wordbridge-edu`. D1 `word` mang ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771`, bucket R2 là `word`, ASSETS dùng `./public`. Cron chạy mỗi 15 phút. Kiểm tra migrations của bản sạch bằng `npm run db:migrate:local`. Để chạy workerd trên máy có hỗ trợ, dùng `npm run dev` sau khi áp dụng migration local. Dùng một bộ binding staging riêng cho nghiệm thu trước khi chuyển phiên bản.

Đối chiếu phiên bản Worker và binding được gắn với từng hostname trong Dashboard. ZIP hiện cấu hình `APP_BASE_URL=https://wordbridge.io.vn`, RP ID là `wordbridge.io.vn`. Cookie phiên được tạo theo host. Liên kết email và origin WebAuthn dùng APP_BASE_URL. Cần chốt host sau khi xem cấu hình thực tế của apex và www. Bản sửa không thêm quy tắc chuyển hướng.

Đặt `TOKEN_PEPPER`, `RESEND_API_KEY`, `EMAIL_WEBHOOK_SECRET` bằng Workers Secrets. Duy trì pepper hiện có khi nâng cấp. Đặt `EMAIL_PROVIDER=resend` khi đã xác nhận tên miền gửi của nhà cung cấp. Địa chỉ gửi trong mã nguồn dùng `wordbridge.vn`; cần đối chiếu quyền sở hữu, DNS và webhook trước khi gửi thật. Các trạng thái gửi được lưu qua EmailService. Khi dịch vụ thư chưa hoạt động, luồng đăng ký có thể tạo tài khoản chờ xác minh.

## Dữ liệu và hoàn tác

Migration 0014 tạo các view chỉ đọc cho học liệu được phát hành. Bản ghi cũ và khóa ngoại được giữ trong bảng gốc. Migration 0015 tạo bảng ôn tập và đưa bảng ghi chú bài học ra khỏi đường xử lý request. Với D1 hiện hữu, so sánh lịch sử migration theo **tên tệp đầy đủ**, đặc biệt các tệp lịch sử trùng tiền tố số. Migration lịch sử 0013 có thao tác gỡ vai trò Exam. Cần đối chiếu trước khi áp dụng lên dữ liệu đã có.

Trước thay đổi production, chủ dự án phê duyệt cửa sổ bảo trì, xuất bản sao D1, lưu an toàn và phục hồi thử vào database tách biệt. Lệnh sao lưu là `npx wrangler d1 export word --remote --output=word-backup.sql`; giữ bản xuất ngoài thư mục public. Xem SQL hoàn tác trong `database/rollbacks/`. Khi hoàn tác 0014, ngừng phiên bản Worker phụ thuộc vào view trước khi gỡ view. Giữ bảng 0015 để bảo toàn tiến độ mới ghi. Cần tiếp tục chặn các đường quản trị và việc phát hành tiếng Nga trong mọi phiên bản khôi phục.

## Cấu trúc bản thu gọn

Mã nguồn Worker nằm trong src/index.js, gộp theo module với chú thích đường dẫn nguồn và giữ tên hàm. Chỉnh sửa trực tiếp file này. Các ca kiểm thử nằm trong tests/release.test.mjs. Các URL dữ liệu chuyên ngành vẫn dùng tên miền kiến thức tương ứng; Worker đọc bộ dữ liệu từ một trong ba tệp JSON nhóm. Giữ nguyên tên đầy đủ và thứ tự của 19 migration.

docs/ACCEPTANCE.md tập hợp báo cáo nghiệm thu RC, sự cố 1101, route và kiểm kê đầu vào. docs/UI-REFERENCE-MAP.md liên kết 22 ảnh gốc trong docs/reference-images với trang tương ứng.
