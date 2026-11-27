# DANH SÁCH LỖI CÒN TỒN TẠI & ĐIỀU KIỆN ĐANG CHẶN TRIỂN KHAI PRODUCTION

## 1. Điều kiện đang chặn triển khai Production (`BLOCKED – PRODUCTION SOURCE NOT PROVIDED`)
Toàn bộ hạng mục tích hợp và triển khai lên website thật `https://www.wordbridge.io.vn/` hiện đang ở trạng thái **BLOCKED** do các điều kiện sau chưa được cung cấp trong phiên làm việc:
1. **Thiếu mã nguồn repository Cloudflare Worker `wordbridge-edu`:** Chưa có thư mục `src/` (entry point `src/index.js`, API router, middleware xác thực, Passkeys, RBAC, truy vấn D1/R2 hiện tại).
2. **Thiếu thư mục `public/` của website đang chạy:** Chưa có mã nguồn các trang công khai và header/footer dùng chung đang hiển thị trên `wordbridge.io.vn`.
3. **Thiếu cấu hình `wrangler.toml` (đã ẩn secrets) và Schema D1 thực tế:** Chưa có danh sách bảng & cột thực tế của D1 database `word` và bảng `d1_migrations` để kiểm tra tương thích khóa ngoại và sửa trực tiếp câu truy vấn gây lỗi `0 / 0 mục từ công bố` trên API thật.
4. **Không có quyền triển khai Staging/Production:** Không có quyền chạy `npx wrangler d1 execute`, `npx wrangler dev` trên môi trường Cloudflare thật hoặc `npm run deploy`.

## 2. Lỗi / Hạn chế còn tồn tại (đã ghi nhận trung thực)
1. **Đồng bộ tài khoản đa thiết bị (D1 Sync):** Mã nguồn `frontend/js/api-adapter.js` và `integration/worker-learning-routes.js` đã sẵn sàng (`IMPLEMENTED`), nhưng **chưa thể kiểm thử đồng bộ thật trên tài khoản đăng nhập / đăng xuất / đăng nhập lại ở môi trường production** cho đến khi ghép vào Worker thật. Khi chạy cục bộ, tiến độ lưu tại `localStorage` và hiển thị rõ nhãn `Chế độ cục bộ (chưa kết nối D1)`.
2. **Tệp âm thanh thực tế cho Listening (16 bài) và Pronunciation (33 bài):** Toàn bộ 49 bản ghi trong `data/audio/audio-manifest.json` đang ở trạng thái `TEXT_SCRIPT_ONLY` (`audio_url: null`, `allow_playback_button: false`). Cần tải tệp MP3 thực tế lên R2 bucket `word` và cập nhật manifest/bảng `wb_audio_asset_bindings` để bật trình phát âm thanh.
3. **Lỗi Từ điển `0/0` và Lưu thuật ngữ trên API production thật:** Đã sửa triệt để trên frontend và cung cấp module vá chuẩn `integration/dictionary-and-specialty-fix.js`, nhưng **chưa áp dụng được lên endpoint thật của `wordbridge.io.vn`** do thiếu `src/index.js` và schema bảng từ điển production.
4. **Kho học liệu quy mô lớn chưa hoàn thành:** Các mục tiêu kho dữ liệu cũ (40.000 từ vựng, 100.000 ví dụ, 5.000 bài mỗi kỹ năng, 1.000.000 bài học) vẫn giữ nguyên trạng thái **Chưa hoàn thành** theo đúng hiện trạng dữ liệu thực tế; toàn bộ học liệu mới vẫn giữ trạng thái `REVIEW_REQUIRED` chờ chuyên gia ngôn ngữ duyệt.
