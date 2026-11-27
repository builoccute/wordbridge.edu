# DANH SÁCH LỖI ĐÃ SỬA TỪ GÓI V0.8.0

1. **Mất giải thích đáp án & lỗi `undefined` ở Listening và Reading (`frontend/js/app.js`):**
   - *Nguyên nhân trong v0.8.0:* Mã nguồn đọc `q.explanation` trong khi dữ liệu chuẩn dùng `q.explanation_vi`, khiến phản hồi câu hỏi bị trống giải thích và `My Mistakes` lưu `undefined`.
   - *Khắc phục:* Đổi sang `q.explanation_vi || q.explanation || ""` và bổ sung tô màu trực quan đáp án đúng/sai (`.correct` / `.wrong`).
2. **Mất focus ô tìm kiếm Từ điển sau mỗi ký tự (`frontend/js/app.js`):**
   - *Nguyên nhân trong v0.8.0:* Sự kiện `input` trên `#wb-dict-search` gọi `renderMain()`, phá hủy và tạo lại toàn bộ DOM làm mất con trỏ nhập liệu.
   - *Khắc phục:* Tách `buildDictionaryResultsHtml()` để chỉ cập nhật vùng `#wb-dict-results`, giữ nguyên con trỏ và tốc độ gõ mượt.
3. **Không tải 40 bài học tích hợp (`lessons-001.json`) và 770 câu ví dụ (`examples-001..010.json`):**
   - *Nguyên nhân trong v0.8.0:* `loadModularData()` bỏ sót 11 tệp JSON này, khiến mọi hoạt động loại `lessons` bên trong 8 khóa học bấm vào chỉ hiện toast chết.
   - *Khắc phục:* Tải đầy đủ 40 bài học tích hợp và 770 câu ví dụ, xây dựng giao diện `Bài học tích hợp`, gắn breadcrumb quay lại khóa học và đánh dấu hoàn thành hoạt động.
4. **Dùng chung một bố cục `.wb-workspace` cho tất cả kỹ năng:**
   - *Khắc phục:* Thiết kế bố cục chuyên biệt cho từng kỹ năng: Listening (dải chọn bài + sân khấu nghe/kịch bản + cột câu hỏi), Speaking (Speaking Studio + banner vai nói + buồng ghi âm MediaRecorder), Reading (Editorial Split + cỡ chữ A-/A+ + chế độ tập trung), Writing (Writer's Desk 2 cột), Pronunciation (Phonetics Lab + bộ lọc nhóm âm).
5. **Thiếu các mục điều hướng theo yêu cầu Phần V.2:**
   - *Khắc phục:* Chuẩn hóa đúng 4 nhóm điều hướng chính và đầy đủ mục con: Trung tâm học tập (Tổng quan, Tiếp tục học, Khóa học của tôi, Lộ trình), Luyện tập (Nghe, Nói, Đọc, Viết, Phát âm, Ngữ pháp, Bài tập, Đánh giá, Bài học tích hợp), Từ vựng (Từ điển, Sổ từ cá nhân, Bộ từ vựng, Flashcard, Ôn tập SRS, Chuyên ngành), Theo dõi học tập (My Mistakes, Practice Insights, Lịch sử học tập).
6. **MediaRecorder ở Pronunciation thiếu đủ 7 trạng thái & không kiểm tra `audioBindings`:**
   - *Khắc phục:* Hợp nhất dùng chung thành phần `renderRecorderBooth()` quản lý đầy đủ 7 trạng thái (`IDLE`, `REQUESTING_PERMISSION`, `RECORDING`, `STOPPED`, `PLAYING`, `ERROR`, `PERMISSION_DENIED`) kèm đồng hồ đếm giây thực tế và kiểm tra `audioBindings` cho cả Listening và Pronunciation.
7. **Trang Chuyên ngành không có nút Lưu thuật ngữ & Bộ từ vựng chưa lọc/chọn được:**
   - *Khắc phục:* Thêm nút `Lưu từ` dùng payload chuẩn hóa (`entryId`, `term`, `domain`, `domainName`, `setName`) ngay trên trang Chuyên ngành; cho phép chọn bộ từ khi lưu và lọc Sổ từ cá nhân theo từng bộ từ.
8. **Chưa tách bạch trạng thái đồng bộ tài khoản D1 với lưu cục bộ `localStorage`:**
   - *Khắc phục:* Bổ sung `frontend/js/api-adapter.js` tự dò `/api/wb/me`, hiển thị trung thực trạng thái `Chế độ cục bộ (chưa kết nối D1)` khi chạy offline/localhost và chỉ chuyển `Đã đồng bộ` khi có phiên tài khoản thật trên Worker; bổ sung lưu vị trí phiên & lịch sử ôn Flashcard.
9. **Nguy cơ chạy nhầm `001_rollback.sql` trong thư mục `migrations/`:**
   - *Khắc phục:* Tách `migrations/rollbacks/20261127_001_rollback.sql` và `migrations/diagnostics/002_diagnostics_dictionary_and_specialty.sql` ra khỏi thư mục `migrations/` gốc; bổ sung 2 bảng `wb_user_writing_submissions` và `wb_user_vocab_bookmarks` trong `migrations/20261127_001_wordbridge_learning_upgrade.sql`.
10. **Sai sót trong báo cáo `DATA_AUDIT_REPORT.md` của v0.8.0:**
    - *Khắc phục:* Đính chính hai lỗi riêng biệt của Speaking và Writing (không ghi là cùng một ảnh), tách bạch báo cáo tiến độ phần mềm với bảng tiến độ học liệu chưa hoàn thành.
