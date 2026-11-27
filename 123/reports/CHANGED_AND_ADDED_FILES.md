# DANH SÁCH TỆP THAY ĐỔI, BỔ SUNG & BẢO TOÀN (v0.8.0 → FINAL-2026)

## 1. Tệp mã nguồn Frontend đã sửa / bổ sung
- `frontend/index.html` *(Sửa)* — Chuẩn hóa header 4 nhóm điều hướng, nhãn trạng thái đồng bộ trung thực (`#wb-sync-badge`), nhúng `api-adapter.js` và `app.js`, khôi phục footer chuẩn WORD BRIDGE.
- `frontend/styles/wordbridge.css` *(Sửa)* — Thiết kế hệ thống bố cục riêng cho từng kỹ năng (Listening strip+grid, Speaking Studio role banner, Reading Editorial Split + focus mode, Writing 2-column desk, Pronunciation Phonetics Lab), responsive 4 mốc màn hình.
- `frontend/js/api-adapter.js` *(Thêm mới)* — Lớp đồng bộ tài khoản D1 production (`/api/wb/*`) kết hợp fallback `localStorage` trung thực (`LOCAL_ONLY_NO_API` vs `SYNCED_ACCOUNT`).
- `frontend/js/app.js` *(Sửa)* — Khắc phục 10 lỗi v0.8.0, tải đủ 40 bài học tích hợp và 770 ví dụ, hoàn thiện 4 nhóm điều hướng, MediaRecorder 7 trạng thái kèm đồng hồ đếm giây, bộ từ vựng, lịch sử & khôi phục phiên Flashcard/SRS, xu hướng theo ngày ở Practice Insights, lưu thuật ngữ chuyên ngành.
- `wordbridge-learning-hub.html` *(Cập nhật đồng bộ)* — Đóng gói lại từ `frontend/` mới + toàn bộ `data/` (gồm 40 lessons và 770 examples) để kiểm thử cục bộ nhanh.

## 2. Tệp tích hợp Production Cloudflare Worker (Thêm mới)
- `integration/worker-learning-routes.js` *(Thêm mới)* — Router `/api/wb/*` gắn vào `src/index.js` hiện có, bảo toàn Auth/Passkey/RBAC, cô lập dữ liệu theo `authUser.id`.
- `integration/dictionary-and-specialty-fix.js` *(Thêm mới)* — Các hàm vá lỗi Từ điển `0/0`, chuẩn hóa payload lưu thuật ngữ chuyên ngành và lọc nhãn nội bộ khỏi UI.

## 3. Tệp Database Migration (Cơ cấu lại an toàn)
- `migrations/20261127_001_wordbridge_learning_upgrade.sql` *(Thay thế `001_wordbridge_learning_upgrade.sql`)* — Mở rộng thành 9 bảng `wb_*` (thêm `wb_user_writing_submissions` và `wb_user_vocab_bookmarks`), tương thích ngược 100%.
- `migrations/rollbacks/20261127_001_rollback.sql` *(Di chuyển từ `migrations/001_rollback.sql`)* — Tách khỏi thư mục migration chính để tránh rủi ro `wrangler d1 migrations apply` chạy nhầm.
- `migrations/diagnostics/002_diagnostics_dictionary_and_specialty.sql` *(Di chuyển từ `migrations/002_diagnostics_dictionary_and_specialty.sql`)* — Tách script chẩn đoán chỉ đọc sang thư mục riêng.

## 4. Hệ thống báo cáo & hướng dẫn (Sửa / Bổ sung)
- `README.md` *(Sửa)* — Tách rõ 3 trạng thái nghiệm thu.
- `reports/DATA_AUDIT_REPORT.md` *(Sửa)* — Đính chính 2 ảnh Speaking/Writing riêng biệt, tách báo cáo phần mềm khỏi bảng tiến độ học liệu chưa hoàn thành.
- `reports/TEST_AND_QA_REPORT.md` *(Sửa)* — Bổ sung bảng trạng thái Phần XIII và kết quả kiểm thử Chromium/SQLite/Node ESM thực tế.
- `reports/PRODUCTION_INTEGRATION_GUIDE.md` *(Thay thế `RUN_AND_INTEGRATION_GUIDE.md`)* — Hướng dẫn tích hợp chi tiết vào Cloudflare Worker `wordbridge-edu`.
- `reports/ROLLBACK_GUIDE.md` *(Thêm mới)* — Quy trình rollback D1 và Worker an toàn.
- `reports/FIXED_BUGS.md` *(Thêm mới)* — Danh sách 10 lỗi thực tế đã khắc phục từ v0.8.0.
- `reports/OPEN_ISSUES_AND_BLOCKERS.md` *(Thêm mới)* — Danh sách lỗi còn tồn tại và điều kiện đang chặn triển khai production.
- `reports/CHANGED_AND_ADDED_FILES.md` *(Sửa)* — Tệp này.
- `manifest-upgrade.json` *(Cập nhật)* — Cập nhật toàn bộ SHA-256 cho gói bàn giao cuối cùng.

## 5. Dữ liệu được bảo toàn nguyên vẹn 100% (Không thay đổi)
- Toàn bộ 69 tệp trong thư mục `data/` (726 Vocabulary, 770 Examples, 2.000 Flashcards `FLASHCARD_ONLY`, 8 Courses, 16 Listening, 16 Speaking, 16 Reading, 16 Writing, 33 Pronunciation, 51 Grammar, 64 Exercises, 14 Assessments, 40 Lessons, 40 Specialties, 49 Audio Manifest, 14 JSON Schema, báo cáo và checkpoint gốc) giữ nguyên từng byte (khớp 100% SHA-256).
