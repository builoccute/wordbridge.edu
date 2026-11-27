# BÁO CÁO KIỂM ĐỊNH DỮ LIỆU & TIẾN ĐỘ HỌC LIỆU — WORD BRIDGE (2026)

## 1. Kiểm toán tính toàn vẹn gói nguồn v0.8.0
- **Kiểm tra CRC tệp ZIP gốc (`WORD-BRIDGE-UPGRADE-PACKAGE-2026 (1).zip`):** `unzip -t` đạt **0 lỗi CRC** trên toàn bộ tệp nén.
- **Đối chiếu SHA-256 theo `manifest-upgrade.json`:** **81/81 tệp khớp 100%**, 0 tệp thiếu, 0 sai lệch hash.
- **Bảo toàn dữ liệu gốc:** Toàn bộ thư mục `data/` (học liệu gốc + 2.000 Flashcard + 8 Khóa học + 14 Schema + 49 Audio Manifest) được giữ nguyên từng byte. Không xóa dữ liệu, không ghi đè, không tự ý nâng `REVIEW_REQUIRED` sang `PUBLISHED` hoặc `EXPERT_REVIEWED`, không bổ sung 1.000 thuật ngữ chuyên ngành, không tạo dữ liệu giả.

## 2. Tách biệt bắt buộc: Tiến độ kho học liệu (Dữ liệu) vs Hoàn thiện phần mềm
> **Tuyên bố trung thực:** Việc sửa giao diện, sửa lỗi frontend và chuẩn bị tích hợp production **KHÔNG** làm thay đổi trạng thái chưa hoàn thành của các chỉ tiêu kho học liệu lớn dưới đây. Chỉ thay đổi trạng thái khi có dữ liệu thực tế được kiểm chứng.

| Nhóm học liệu | Mục tiêu cũ | Hiện có thực tế | Trạng thái kho dữ liệu | Trạng thái kiểm định |
| :--- | ---: | ---: | :--- | :--- |
| Từ vựng (`vocabulary`) | 40.000 | 726 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (0 ID trùng) |
| Câu ví dụ (`examples`) | 100.000 | 770 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (100% khớp `focus_vocabulary_id`) |
| Reading | 5.000 | 16 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (8 EN, 8 ZH) |
| Listening | 5.000 | 16 | **Chưa hoàn thành** | `REVIEW_REQUIRED`, `TEXT_SCRIPT_ONLY` (8 EN, 8 ZH) |
| Speaking | 5.000 | 16 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (8 EN, 8 ZH) |
| Writing | 5.000 | 16 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (8 EN, 8 ZH) |
| Bài học độc lập / tích hợp (`lessons`) | 1.000.000 | 40 | **Chưa hoàn thành** | `REVIEW_REQUIRED` (20 EN, 20 ZH) |
| Lĩnh vực chuyên ngành (`specialties`) | 40 | 40 | **Hoàn thành** | Đủ 40 lĩnh vực `id: 1..40` |

### Các nhóm học liệu mở rộng hiện có trong gói (tách biệt với bảng mục tiêu trên)
| Nhóm dữ liệu | Số lượng thực tế | Phạm vi & Trạng thái | Ghi chú kiểm định |
| :--- | ---: | :--- | :--- |
| Flashcard (`flashcards-001..004.json`) | 2.000 | `FLASHCARD_ONLY`, `REVIEW_REQUIRED` | 0 ID trùng (`FC-0001..2000`), 0 trùng tiếng Anh với 726 từ vựng gốc, đủ EN/ZH/Pinyin/IPA/VI/Ví dụ/Cấp độ/Chủ đề. Không trộn vào từ điển công khai. |
| Khóa học (`courses-001.json`) | 8 khóa học | `SELF_STUDY`, `certificate_issued: false` | 16 chương, 32 bài học, 64 hoạt động; **0 tham chiếu ID gãy**. |
| Pronunciation (`pronunciation-001.json`) | 33 | `REVIEW_REQUIRED`, `TEXT_SCRIPT_ONLY` | 16 EN, 17 ZH. |
| Grammar (`grammar-001.json`) | 51 | `REVIEW_REQUIRED` | 25 EN, 26 ZH. |
| Exercises (`exercises-001.json`) | 64 | `REVIEW_REQUIRED` | 32 EN, 32 ZH. |
| Assessments (`assessments-001.json`) | 14 | `REVIEW_REQUIRED`, không cấp chứng chỉ | 7 EN, 7 ZH. |
| Audio Manifest (`audio-manifest.json`) | 49 | `TEXT_SCRIPT_ONLY`, `audio_url: null` | 16 Listening + 33 Pronunciation; `allow_playback_button: false`, 0 URL giả. |

## 3. Đính chính quan trọng về hai lỗi giao diện tham chiếu trước đó
Bản báo cáo cũ của v0.8.0 đã ghi sai rằng hai ảnh tham chiếu là cùng một ảnh. Ghi nhận chính xác hai lỗi riêng biệt đã được xử lý triệt để trong giao diện mới:
1. **Lỗi trang Speaking:** Giao diện luyện nói cũ bị trình bày giống danh sách thuật ngữ chuyên ngành → Đã thay bằng **Speaking Studio** chuyên biệt (tình huống, vai nói, câu hỏi gợi ý, cụm từ hỗ trợ, buồng ghi âm MediaRecorder 7 trạng thái, hội thoại mẫu đối chiếu và tiêu chí tự đánh giá).
2. **Lỗi trang Writing:** Giao diện luyện viết cũ bị biến thành danh sách từ vựng kèm ô textarea dịch từng từ → Đã thay bằng **Writing Studio** 2 cột (đề bài, bối cảnh, yêu cầu bắt buộc, lập dàn ý, trình soạn thảo có bộ đếm từ/ký tự, lưu nháp, nộp bài, tiêu chí tự đánh giá, lỗi thường gặp và bài mẫu kèm giải thích).
