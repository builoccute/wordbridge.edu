# DANH SÁCH TỆP BẢO TOÀN, THAY ĐỔI VÀ BỔ SUNG

## 1. Dữ liệu gốc được bảo toàn nguyên vẹn (59 tệp)
Toàn bộ 59 tệp từ `WORD-BRIDGE-MASTER-DATA-2026 (1).zip` được giữ nguyên 100% tại `data/` (không xóa, không ghi đè, giữ nguyên `REVIEW_REQUIRED`).

## 2. Tệp dữ liệu & Schema bổ sung mới
- `data/schemas/flashcards.schema.json` — JSON Schema cho bộ 2.000 Flashcard độc lập.
- `data/schemas/courses.schema.json` — JSON Schema cho hệ thống Khóa học tự học phân cấp.
- `data/schemas/audio-bindings.schema.json` — JSON Schema liên kết tài nguyên âm thanh R2.
- `data/flashcards/flashcards-001.json` .. `flashcards-004.json` — 2.000 thẻ Flashcard mới (4 tệp × 500 thẻ, `FLASHCARD_ONLY`).
- `data/courses/courses-001.json` — 8 khóa học tự học (4 Tiếng Anh CEFR, 4 Tiếng Trung giản thể HSK) liên kết học liệu thật.
- `data/audio/audio-manifest.json` — 49 bản ghi liên kết âm thanh (trạng thái trung thực `TEXT_SCRIPT_ONLY`).
- `manifest-upgrade.json` — Manifest tổng hợp kèm SHA-256 cho toàn bộ gói bàn giao nâng cấp.

## 3. Migration & Chẩn đoán Cloudflare D1
- `migrations/001_wordbridge_learning_upgrade.sql` — Tạo mới các bảng `wb_courses`, `wb_user_course_progress`, `wb_flashcard_deck_items`, `wb_user_flashcard_srs`, `wb_user_mistakes`, `wb_user_practice_sessions`, `wb_audio_asset_bindings` (tương thích ngược, không động vào bảng cũ).
- `migrations/001_rollback.sql` — Khôi phục an toàn nếu cần gỡ migration.
- `migrations/002_diagnostics_dictionary_and_specialty.sql` — Truy vấn chẩn đoán lỗi `0 / 0 mục từ công bố` và hướng dẫn vá mapping `entryId` / `domain` / `term`.

## 4. Giao diện học tập thiết kế mới (Drop-in Frontend)
- `frontend/index.html` — Cấu trúc điều hướng 5 nhóm gọn gàng, tối giản.
- `frontend/styles/wordbridge.css` — Hệ thống giao diện chuẩn màu thương hiệu (`#146466`, `#C92F1C`, `#5AABA9`, `#E2E2C4`) và responsive (Desktop, Tablet, Mobile).
- `frontend/js/app.js` — Toàn bộ 17 nhóm chức năng: Trung tâm học tập, Khóa học, Listening, Speaking (MediaRecorder state machine), Reading, Writing Studio, Pronunciation tách riêng, Grammar, Exercises, Assessments, Dictionary, My Vocabulary & Sets, Flashcard 2.000 & SRS, My Mistakes, Practice Insights, 40 Chuyên ngành.

## 5. Báo cáo & Hướng dẫn bàn giao
- `reports/DATA_AUDIT_REPORT.md`
- `reports/TEST_AND_QA_REPORT.md`
- `reports/CHANGED_AND_ADDED_FILES.md`
- `reports/RUN_AND_INTEGRATION_GUIDE.md`
