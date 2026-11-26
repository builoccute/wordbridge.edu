# BÁO CÁO KIỂM ĐỊNH DỮ LIỆU — WORD BRIDGE (2026)

## 1. Kết quả kiểm tra gói ZIP gốc (`WORD-BRIDGE-MASTER-DATA-2026 (1).zip`)
- **Tổng số tệp thực tế:** 59 tệp (57 tệp liệt kê trong `manifest.json -> file_inventory` + 2 tệp siêu dữ liệu `README.md` và `manifest.json`).
- **Đối chiếu Hash SHA-256 & số bản ghi:** **57/57 khớp 100%**, 0 tệp thiếu, 0 sai lệch hash, 0 sai lệch số lượng bản ghi.
- **Kiểm định JSON Schema (`jsonschema`):** **0 lỗi schema** trên toàn bộ 11 nhóm học liệu có schema gốc.
- **Bảo toàn dữ liệu gốc:** Toàn bộ 59 tệp gốc được giữ nguyên từng byte (59/59 SHA-256 trùng khớp 100% trong gói nâng cấp tại thư mục `data/`). Không xóa, không ghi đè, không tự nâng trạng thái `REVIEW_REQUIRED` sang `EXPERT_REVIEWED` hoặc `PUBLISHED`.

## 2. Kiểm đếm chi tiết từng nhóm dữ liệu gốc

| Nhóm dữ liệu | Số bản ghi | Phân bổ ngôn ngữ | Trạng thái | Ghi chú kiểm định |
| :--- | ---: | :--- | :--- | :--- |
| Từ vựng (`vocabulary`) | 726 | Song ngữ EN – ZH – VI | `REVIEW_REQUIRED` | 725 từ EN duy nhất; `vacancy` xuất hiện hợp lệ ở 2 lĩnh vực khác nhau (7: Nhân sự `空缺职位` và 30: Du lịch `空房`). 0 trường bắt buộc bị thiếu. |
| Câu ví dụ (`examples`) | 770 | `en-zh`: 770 | `REVIEW_REQUIRED` | 0 `focus_vocabulary_id` mồ côi (100% tham chiếu khớp `vocabulary`). |
| Reading (`reading`) | 16 | EN: 8, ZH: 8 | `REVIEW_REQUIRED` | Đầy đủ văn bản, câu hỏi trắc nghiệm, đáp án, giải thích, từ vựng & ngữ pháp. |
| Listening (`listening`) | 16 | EN: 8, ZH: 8 | `REVIEW_REQUIRED` | 16/16 có `audio_asset_status: "TEXT_SCRIPT_ONLY"` (chưa có tệp audio thực tế). |
| Speaking (`speaking`) | 16 | EN: 8, ZH: 8 | `REVIEW_REQUIRED` | Đầy đủ tình huống, vai nói, câu hỏi gợi ý, hội thoại mẫu, tiêu chí tự đánh giá. |
| Writing (`writing`) | 16 | EN: 8, ZH: 8 | `REVIEW_REQUIRED` | Đầy đủ bối cảnh, đề bài, yêu cầu nội dung, dung lượng gợi ý, bài mẫu, tiêu chí & lỗi thường gặp. |
| Grammar (`grammar`) | 51 | EN: 25, ZH: 26 | `REVIEW_REQUIRED` | Đầy đủ quy tắc, cấu trúc, ví dụ, lỗi thường gặp và nhiệm vụ thực hành. |
| Pronunciation (`pronunciation`) | 33 | EN: 16, ZH: 17 | `REVIEW_REQUIRED` | Chưa gắn tệp audio mẫu thực tế; cần gắn qua `audio/audio-manifest.json`. |
| Exercises (`exercises`) | 64 | EN: 32, ZH: 32 | `REVIEW_REQUIRED` | Đa dạng dạng bài, 0 lỗi schema. |
| Assessments (`assessments`) | 14 | EN: 7, ZH: 7 | `REVIEW_REQUIRED` | Có tiêu chí chấm điểm và thang điểm cụ thể, không gắn chức năng cấp chứng chỉ. |
| Bài học tích hợp (`lessons`) | 40 | EN: 20, ZH: 20 | `REVIEW_REQUIRED` | Liên kết đa kỹ năng, 0 lỗi schema. |
| Lĩnh vực chuyên môn (`specialties`) | 40 | Tiếng Việt | Hoàn chỉnh cấu trúc | Đủ 40 lĩnh vực `id: 1..40` khớp hoàn toàn trường `domain` ở các module. |

## 3. Các vấn đề phát hiện và xử lý
1. **Nhãn cấp độ tiếng Trung trong dữ liệu gốc:** Các bản ghi tiếng Trung trong ZIP gốc hiện dùng ký hiệu `A1–C2` ở trường `level`. Để bảo toàn 100% dữ liệu gốc mà không vi phạm quy tắc phân cấp tiếng Trung, gói nâng cấp giữ nguyên tệp gốc, đồng thời áp dụng chuẩn **HSK 1–5** (có ghi chú `scale_note_vi` rõ ràng, không gán nhãn CEFR thiếu căn cứ) cho toàn bộ 4 khóa học tiếng Trung mới và 2.000 Flashcard mới.
2. **Hai ảnh giao diện đính kèm:** Hai tệp ảnh người dùng gửi có cùng giá trị MD5 (`d91488707c787ca3e2a2730e298c19ab`, đều chụp màn hình trang `Luyện Viết (Writing)` với thẻ từ vựng `account` / `account for` kèm textarea và nút `Xem câu mẫu chuẩn`). Dù thiếu ảnh chụp thực tế của trang Speaking, toàn bộ lỗi mô tả cho cả hai trang Speaking và Writing tại Phần III đều đã được khắc phục triệt để trong giao diện mới.
3. **Trạng thái âm thanh Listening & Pronunciation:** 100% bài nghe gốc đang ở trạng thái `TEXT_SCRIPT_ONLY`. Đã tạo `data/audio/audio-manifest.json` (49 bản ghi liên kết với khóa R2 `audio/<module>/<lang>/<id>.mp3`, `audio_url: null`, `allow_playback_button: false`) để sẵn sàng bổ sung âm thanh sau này mà không tạo nút phát âm giả.

## 4. Dữ liệu bổ sung mới trong gói nâng cấp
- **2.000 Flashcard mới (`data/flashcards/flashcards-001.json` .. `flashcards-004.json`):**
  - Đúng **2.000 thẻ** (4 tệp × 500 thẻ), mã `FC-0001` đến `FC-2000`.
  - **0 trùng lặp nội bộ**, **0 trùng lặp** với 726 mục từ vựng gốc.
  - Phủ đủ **40/40 lĩnh vực**, đủ 5 từ loại (`noun`: 920, `verb`: 493, `adjective`: 399, `adverb`: 146, `phrase`: 42), đủ CEFR A1–C1 và HSK 1–5.
  - Gắn cờ bắt buộc `deck_scope: "FLASHCARD_ONLY"` và `status: "REVIEW_REQUIRED"`, hoàn toàn tách biệt khỏi từ điển công khai.
  - **Không bổ sung 1.000 thuật ngữ chuyên ngành** theo đúng yêu cầu.
- **Hệ thống Khóa học tự học độc lập (`data/courses/courses-001.json`):**
  - **8 khóa học thực tế** (4 Tiếng Anh theo CEFR A1–B2, 4 Tiếng Trung giản thể theo HSK 1–4+), 16 chương, 32 bài học, 64 hoạt động kỹ năng.
  - **0 tham chiếu gãy:** 100% ID hoạt động, bài tập và bài đánh giá cuối chương liên kết trực tiếp tới bản ghi có thật trong gói dữ liệu.
  - Đạt **0 lỗi** trên `schemas/courses.schema.json`.
