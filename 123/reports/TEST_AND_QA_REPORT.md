# BÁO CÁO KIỂM THỬ & XÁC MINH KỸ THUẬT — WORD BRIDGE

## 1. Phạm vi kiểm thử thực tế
Do môi trường làm việc không chứa mã nguồn repository production của Cloudflare Worker `wordbridge-edu` (`src/index.js`, `./public`, cấu hình `wrangler.toml`, D1 database thực tế), quá trình kiểm thử được thực hiện đầy đủ trên **gói nâng cấp dữ liệu + giao diện học tập hoàn chỉnh** đã xây dựng:
1. Kiểm định tĩnh cú pháp JavaScript (`node --check frontend/js/app.js`).
2. Kiểm định tính toàn vẹn HTML/DOM/handler bằng `check_web_app.py` trên bản ứng dụng chạy độc lập (`wordbridge-learning-hub.html`).
3. Kiểm định toàn vẹn dữ liệu, JSON Schema (`jsonschema`), hash SHA-256 và tham chiếu chéo bằng Python.
4. Kiểm định quét chuỗi nội bộ bị cấm trên giao diện công khai.
5. Kiểm tra kết xuất giao diện trực quan trên trình duyệt (qua trình kết xuất ảnh HTML).

## 2. Kết quả kiểm thử chi tiết

| Hạng mục kiểm thử | Kết quả | Chi tiết xác minh |
| :--- | :--- | :--- |
| Bảo toàn 59 tệp ZIP gốc | **ĐẠT (59/59)** | 100% khớp SHA-256 từng byte so với gói gốc. |
| Schema 11 nhóm gốc + 3 schema mới | **ĐẠT (0 lỗi)** | Toàn bộ 14 JSON Schema kiểm định thành công bằng `jsonschema`. |
| 2.000 Flashcards mới | **ĐẠT** | Đúng 2.000 thẻ, 0 trùng nội bộ, 0 trùng với 726 từ gốc, 40/40 lĩnh vực, `FLASHCARD_ONLY`. |
| 8 Khóa học tự học độc lập | **ĐẠT** | 8 khóa, 16 chương, 32 bài học, 64 hoạt động; 0 tham chiếu ID gãy. |
| Audio Asset Bindings | **ĐẠT** | 49 liên kết (16 Listening + 33 Pronunciation), `audio_url: null`, `allow_playback_button: false`, 0 URL giả. |
| Cú pháp JavaScript (`node --check`) | **ĐẠT** | 0 lỗi cú pháp trên `frontend/js/app.js`. |
| Kiểm tra DOM & Handler (`check_web_app.py`) | **ĐẠT** | `OK: no issues found.` — không có nút chết, ID trùng hoặc API bị chặn. |
| Quét nhãn nội bộ bị cấm | **ĐẠT (0 phát hiện)** | Không tồn tại `Excel gốc`, `Biên soạn mở rộng (+1.000 từ)`, `0 / 0 mục từ công bố` trên toàn bộ giao diện công khai. |
| Kiểm thử trình duyệt trực tiếp trên `wordbridge.io.vn` | **CHƯA THỰC HIỆN ĐƯỢC** | Chưa có mã nguồn repo gốc và quyền triển khai lên Cloudflare Worker `wordbridge-edu`. Cần người dùng cung cấp repo để áp dụng bản vá và kiểm thử trực tiếp trên staging/production. |

## 3. Xác minh các quy tắc bắt buộc (Phần XIX)
- **Speaking & Micro State Machine:** Quản lý đầy đủ 7 trạng thái `IDLE`, `REQUESTING_PERMISSION`, `RECORDING`, `STOPPED`, `PLAYING`, `ERROR`, `PERMISSION_DENIED`. Chỉ hiển thị `"Đang ghi âm thực tế..."` khi `MediaRecorder.state === "recording"`.
- **Writing Studio:** Loại bỏ hoàn toàn mẫu thẻ từ vựng + textarea; cung cấp quy trình lập dàn ý → trình soạn thảo có bộ đếm từ/ký tự thời gian thực → lưu nháp `localStorage` → nộp bài → tự kiểm tra tiêu chí & bài mẫu kèm giải thích + lỗi thường gặp.
- **Listening & Pronunciation:** Hiển thị trung thực trạng thái `TEXT_SCRIPT_ONLY`, ẩn nút phát âm giả khi chưa gắn tệp âm thanh R2.
- **My Mistakes & Practice Insights:** Khởi tạo trống hoàn toàn (không chèn lỗi giả hay biểu đồ phần trăm giả); chỉ ghi nhận từ các lượt nộp bài thực tế của người học.
- **Khóa học & Đánh giá:** Không tạo video giả, không tạo lớp học giáo viên, không cấp chứng chỉ (`certificate_issued: false`).
