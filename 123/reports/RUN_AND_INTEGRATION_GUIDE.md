# HƯỚNG DẪN CHẠY, TÍCH HỢP VÀ DANH SÁCH MÃ NGUỒN CẦN CUNG CẤP

## 1. Lưu ý quan trọng về hiện trạng mã nguồn website (Phần XVII)
Gói đầu vào `WORD-BRIDGE-MASTER-DATA-2026 (1).zip` chỉ chứa học liệu JSON, schema và báo cáo; **không chứa mã nguồn repository Cloudflare Worker `wordbridge-edu`**.
Vì vậy, chúng tôi **không tuyên bố đã chỉnh sửa hay triển khai trực tiếp lên `https://www.wordbridge.io.vn/`**.

Để áp dụng bản nâng cấp này trực tiếp vào mã nguồn production (bảo toàn 100% Backend, API, Auth, Passkey, RBAC và D1 hiện có), vui lòng cung cấp các thành phần sau từ repository của bạn:
1. `src/index.js` (hoặc toàn bộ thư mục `src/` chứa router API, truy vấn D1 cho Dictionary, Specialty Vocabulary, Practice, Auth/RBAC).
2. `wrangler.toml` (ẩn hoặc lược bỏ secrets/tokens).
3. Thư mục `public/` (các trang HTML/CSS/JS hiện tại của `/practice`, `/dictionary`, `/flashcards`, `/reader`, header/footer dùng chung).
4. Schema SQL hiện tại của Cloudflare D1 database `word` (kết quả chạy `SELECT sql FROM sqlite_master WHERE type='table';`) để xử lý dứt điểm lỗi `Hiển thị 0 / 0 mục từ công bố` và lỗi `Thiếu entryId` trực tiếp trên API thật.

## 2. Cách chạy kiểm thử cục bộ gói giao diện bàn giao
1. Giải nén `WORD-BRIDGE-UPGRADE-PACKAGE-2026.zip`.
2. Mở terminal tại thư mục gốc sau khi giải nén và chạy máy chủ HTTP tĩnh:
   ```bash
   python3 -m http.server 8080
   ```
3. Mở trình duyệt tại: `http://localhost:8080/frontend/index.html`
   (Cần chạy qua `http://localhost` để tính năng ghi âm Micro `MediaRecorder` và `fetch('../data/...')` hoạt động đầy đủ theo chính sách bảo mật trình duyệt).

## 3. Hướng dẫn tích hợp vào Cloudflare Worker `wordbridge-edu`
1. **Chạy D1 Migration (tương thích ngược):**
   ```bash
   npx wrangler d1 execute word --remote --file=migrations/001_wordbridge_learning_upgrade.sql
   ```
2. **Chẩn đoán 2 lỗi dữ liệu production:**
   - Chạy các câu lệnh trong `migrations/002_diagnostics_dictionary_and_specialty.sql` để kiểm tra giá trị cột `status` thực tế trong bảng từ điển (nguyên nhân phổ biến nhất gây `0 / 0 mục từ công bố` là bản ghi đang ở `REVIEW_REQUIRED` trong khi truy vấn lọc cứng `WHERE status = 'PUBLISHED'`).
   - Chuẩn hóa payload lưu thuật ngữ chuyên ngành tại endpoint lưu từ để chấp nhận `entryId || id` và tự suy xuất `domain`, `term` từ bản ghi gốc.
3. **Tích hợp giao diện & học liệu:**
   - Sao chép `frontend/styles/wordbridge.css`, `frontend/js/app.js` và thư mục `data/` vào `./public/` (hoặc đồng bộ JSON vào D1/R2 bucket `word`).
   - Khi bổ sung tệp âm thanh MP3 thực tế cho Listening/Pronunciation lên R2 bucket `word`, cập nhật `audio_url`, `asset_status = 'AUDIO_READY'` và `allow_playback_button = true` trong `data/audio/audio-manifest.json` (hoặc bảng `wb_audio_asset_bindings`).
4. **Kiểm thử trước khi triển khai:**
   - Chạy `npx wrangler dev` để kiểm tra thực tế mọi luồng (Listening, Speaking Micro, Reading, Writing, Pronunciation, Courses, Dictionary, Flashcard SRS, My Mistakes, Practice Insights) trên Desktop/Tablet/Mobile trước khi chạy `npm run deploy`.
