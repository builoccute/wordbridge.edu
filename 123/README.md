# WORD BRIDGE — GÓI NÂNG CẤP TOÀN DIỆN (2026 · v0.8.0)

## Mở dùng ngay (không cần cài đặt)
- Nhấp đúp tệp `wordbridge-learning-hub.html` ngay tại thư mục gốc để mở ứng dụng học tập WORD BRIDGE mới với đầy đủ dữ liệu thật (8 khóa học, 16x4 kỹ năng, 51 ngữ pháp, 33 phát âm, 64 bài tập, 14 đánh giá, 726 từ điển, 2.000 Flashcards SRS, 40 lĩnh vực).
- Hoặc chạy `python3 -m http.server 8080` tại thư mục này và mở `http://localhost:8080/frontend/index.html` để thử đầy đủ tính năng ghi âm Micro (`MediaRecorder`).

## Cấu trúc gói bàn giao (khác biệt so với ZIP gốc 59 tệp)
1. `wordbridge-learning-hub.html` — Ứng dụng học tập chạy độc lập (1 tệp duy nhất).
2. `frontend/` — Mã nguồn giao diện tách module (`index.html`, `styles/wordbridge.css`, `js/app.js`).
3. `data/` — Toàn bộ dữ liệu gốc được bảo toàn + bổ sung mới:
   - `data/flashcards/` — **2.000 Flashcards mới** (`flashcards-001..004.json`, tách biệt khỏi từ điển).
   - `data/courses/courses-001.json` — **8 Khóa học tự học** (EN CEFR + ZH-CN HSK).
   - `data/audio/audio-manifest.json` — **49 liên kết âm thanh R2** (`TEXT_SCRIPT_ONLY`).
   - `data/schemas/` — thêm 3 schema mới (`flashcards`, `courses`, `audio-bindings`).
   - `data/manifest.json` & `data/progress.json` — cập nhật lên **v0.8.0** (giữ bản sao gốc tại `data/manifest-v0.7.0-original.json`).
4. `migrations/` — 3 tệp SQL cho Cloudflare D1 (`001_wordbridge_learning_upgrade.sql`, `001_rollback.sql`, `002_diagnostics_dictionary_and_specialty.sql`).
5. `reports/` — 4 báo cáo kiểm định dữ liệu, kiểm thử, danh sách thay đổi và hướng dẫn tích hợp Cloudflare Worker.
6. `manifest-upgrade.json` — Bảng kiểm kê SHA-256 toàn bộ gói bàn giao.
