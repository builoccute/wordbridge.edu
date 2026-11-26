# WORD BRIDGE MASTER DATA — VERSION 0.8.0 (UPGRADED)

Gói dữ liệu này nâng cấp từ `WORD-BRIDGE-MASTER-DATA-2026` (v0.7.0) với nguyên tắc **bảo toàn 100% dữ liệu học liệu hợp lệ gốc** và bổ sung các cấu phần còn thiếu:

## 1. Dữ liệu gốc được bảo toàn nguyên vẹn
- `vocabulary/`: 726 mục từ vựng (`REVIEW_REQUIRED`)
- `examples/`: 770 câu ví dụ song ngữ
- `reading/`, `listening/`, `speaking/`, `writing/`: 16 bản ghi mỗi kỹ năng
- `grammar/`: 51 chủ điểm ngữ pháp
- `pronunciation/`: 33 chủ điểm phát âm
- `exercises/`: 64 bài tập thực hành
- `assessments/`: 14 bộ đánh giá năng lực (không cấp chứng chỉ)
- `lessons/`: 40 bài học tích hợp
- `specialties/domains.json`: 40 lĩnh vực chuyên môn

## 2. Dữ liệu & Schema bổ sung mới ở phiên bản 0.8.0
- `flashcards/flashcards-001.json` .. `flashcards-004.json`: **2.000 thẻ Flashcard độc lập** (`FC-0001`..`FC-2000`, `deck_scope: "FLASHCARD_ONLY"`, 0 trùng lặp với 726 từ vựng gốc, phủ đủ 40/40 lĩnh vực).
- `courses/courses-001.json`: **8 khóa học tự học độc lập** (4 Tiếng Anh theo CEFR A1–B2, 4 Tiếng Trung giản thể theo HSK 1–4+), 16 chương, 32 bài học, 64 hoạt động liên kết trực tiếp ID học liệu thật.
- `audio/audio-manifest.json`: **49 liên kết tài nguyên âm thanh** cho 16 Listening + 33 Pronunciation (`TEXT_SCRIPT_ONLY`, `allow_playback_button: false`, sẵn khóa R2 bucket `word`).
- `schemas/`: bổ sung `flashcards.schema.json`, `courses.schema.json`, `audio-bindings.schema.json`.
