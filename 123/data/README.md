# WORD BRIDGE Master Data 2026 — đợt biên soạn đang tiếp diễn

Dữ liệu gồm tiếng Anh, Trung giản thể và giải thích tiếng Việt. Các thư mục chứa JSON dạng mảng, chia shard tối đa 100 bản ghi. manifest.json ghi SHA-256 và số bản ghi từng tệp. Schema riêng cho từng loại nằm trong schemas/.

Trạng thái nghiệm thu toàn bộ là INCOMPLETE. Trạng thái nội dung từng bản ghi là REVIEW_REQUIRED, cần người có chuyên môn đối chiếu IPA, Pinyin, thuật ngữ, bản dịch và độ tự nhiên trước khi công bố. Hai shard cũ 10.000 mục chưa được cung cấp để kiểm tra trùng lặp. ID mới bắt đầu từ WB5-10001; chỉ những mục mới, phân biệt được theo cặp Anh–Trung, mới được tính. Bản ghi trùng cặp được liệt kê tại validation/duplicate-report.json. Câu ví dụ, bài tập và bài tự đánh giá là nhóm độc lập; không tính vào số bài học. Bài nghe hiện chỉ có kịch bản văn bản, không có tài sản âm thanh.

Nguồn trong bản ghi ghi nguồn biên soạn mới, không ngụ ý đã tham khảo hay thẩm định từ điển bên ngoài. Tham chiếu để thiết kế tiêu chí là thang CEFR của Hội đồng châu Âu và bảng ký hiệu của International Phonetic Association, không sao chép nội dung từ các trang này.

- CEFR https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- IPA https://www.internationalphoneticassociation.org/content/chart

Đọc reports/final-acceptance-report.json để xem chỉ tiêu thực đạt và còn thiếu.
