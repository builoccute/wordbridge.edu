# WORD BRIDGE — Danh mục 20 Ảnh Giao Diện Tham Chiếu (WB-UI-20)

- **Nguồn ảnh:** `ẢNH GIAO DIỆN WED.zip` (22 mục nén gồm 2 thư mục và 20 tệp WebP nguyên bản)
- **Tổng số ảnh:** 20/20 ảnh WebP hợp lệ, giữ nguyên tên tệp gốc, không ghi đè.
- **Quy tắc điều chỉnh bắt buộc:** Xóa toàn bộ nội dung tiếng Nga (ảnh 03, 10, 18, 20), giữ bộ màu nhận diện `#146466`, `#C92F1C`, `#5AABA9`, `#E2E2C4`, chuẩn hóa Contact (ảnh 09: CSKH / Trung tâm Trợ giúp / Phản hồi & góp ý, không thời gian CSKH, không từ Support), tách biệt lỗi phiên ứng dụng (401) với Cloudflare 1101 (ảnh 04).

| STT | Tệp ảnh gốc | Kích thước | Màn hình | Route | Trạng thái | Điều chỉnh sản phẩm |
|---:|---|---|---|---|---|---|
| 01 | `06977332-dfc2-43a0-b934-9e92b35a661b.webp` | 1536×1024 | Đăng ký tài khoản cá nhân | `/register` | Đã triển khai | Tích hợp xác nhận phiên bản Điều khoản (không tick sẵn) & thông báo quyền riêng tư. |
| 02 | `0997827c-36f7-4c75-92e7-ef57d85438ef.webp` | 1536×1024 | Flashcard luyện nghe | `/flashcards/listening` | Đã triển khai | Kết nối TTS Adapter (/api/v1/speech/tts); hiển thị trạng thái NOT_CONFIGURED nếu chưa có key, không dùng thanh âm thanh giả. |
| 03 | `1.webp` | 1536×1024 | Trang tổng quan hệ thống Học ngoại ngữ | `/learning` | Đã triển khai | ĐÃ XÓA nút tiếng Nga và thẻ tiếng Nga; chỉ hiển thị Trung (zh) và Anh (en). |
| 04 | `10b74828-ff36-4c0a-8898-17cdb5330215.webp` | 1536×1024 | Màn hình phiên đăng nhập không hợp lệ | `/session-invalid` | Đã triển khai | Dùng HTTP 401 đúng chuẩn ứng dụng; tách biệt rõ với mã Cloudflare Worker 1101. |
| 05 | `13938f31-e73c-467a-a418-d42ffeff88b4.webp` | 1536×1024 | Trang học tiếng Trung | `/learning/chinese` | Đã triển khai | Dữ liệu tiếng Trung chuẩn Unicode, có liên kết kỹ năng và bài luyện tập. |
| 06 | `17bc9b8f-1ab4-45fc-90c3-9307fef231b2.webp` | 1536×1024 | Flashcard luyện nói | `/flashcards/speaking` | Đã triển khai | Kết nối /api/v1/skills/speaking/sessions; không tự tạo điểm giả khi chưa có API provider. |
| 07 | `2dd71cfe-23ff-448d-a117-e005258bff92.webp` | 1536×1024 | Phòng luyện phát âm | `/skills/pronunciation` | Đã triển khai | Kết nối /api/v1/pronunciation/assessments; báo rõ NOT_CONFIGURED nếu thiếu provider. |
| 08 | `3d872cea-efb1-4bca-a30d-7b69cc09a184.webp` | 1536×1024 | Trang học tiếng Anh | `/learning/english` | Đã triển khai | Nội dung riêng biệt tiếng Anh, không trộn dữ liệu tiếng Trung. |
| 09 | `7799e61d-b053-4e04-bc16-fb1032a33777.webp` | 1774×887 | Trang Liên hệ WORD BRIDGE | `/contact` | Đã triển khai | Không có mục thời gian CSKH; không dùng từ Support; bắt buộc /login?next=%2Fcontact&intent=contact.send. |
| 10 | `91a75d4b-7368-416b-824b-9ac975cc869f.webp` | 1536×1024 | Flashcard từ vựng | `/vocabulary/flashcards` | Đã triển khai | ĐÃ THAY nội dung tiếng Nga trong ảnh cũ bằng từ vựng tiếng Trung & tiếng Anh. |
| 11 | `97ef5e7e-f74a-4314-be56-5d7bb63be732.webp` | 1561×1008 | Trung tâm kỹ năng ngôn ngữ | `/learning/skills` | Đã triển khai | Mọi thẻ đều có đường dẫn và API dữ liệu học tập thực từ D1. |
| 12 | `982d57e5-0fe8-422d-b6ef-1c45ad24f866.webp` | 1536×1024 | Trang lỗi 404 | `/404 (fallback)` | Đã triển khai | Trả đúng HTTP 404 thực tế từ server, không trả 200 giả. |
| 13 | `a59490db-db2e-437c-be99-43df2adc5045.webp` | 1536×1024 | Flashcard luyện viết | `/flashcards/writing` | Đã triển khai | Kết nối /api/v1/skills/writing/submissions; không tự ghi đè bài gốc của người dùng. |
| 14 | `bf314f5d-a92b-481d-a6e1-6420e814ec08.webp` | 1584×993 | Trang Ngoại ngữ chuyên ngành ứng dụng | `/specialized` | Đã triển khai | Hiển thị số thuật ngữ động theo dữ liệu thực đã xuất bản, không khai khống. |
| 15 | `c117b636-23df-4d08-a0b8-b3ce12ee9c96.webp` | 1844×853 | Trang đăng nhập | `/login` | Đã triển khai | Hỗ trợ 6 phương thức; nút OAuth chỉ kích hoạt khi Workers Secrets đã cấu hình. |
| 16 | `d5c5a2db-f997-48a2-ad30-465e07d515a9.webp` | 1536×1024 | Flashcard ngữ pháp | `/flashcards/grammar` | Đã triển khai | Tách riêng bộ lọc ngữ pháp tiếng Trung (zh) và tiếng Anh (en). |
| 17 | `dab8613b-70f4-4f79-b15d-a80aaa864845.webp` | 1536×1024 | Flashcard từ vựng tiếng Trung | `/vocabulary/flashcards?lang=zh` | Đã triển khai | Đảm bảo chuẩn UTF-8 tiếng Trung & dấu thanh Pinyin. |
| 18 | `e32795f0-4a88-4777-994e-1a9d497961e9.webp` | 1905×826 | Cổng Luyện Tập Kỹ năng và Chuyên ngành | `/practice` | Đã triển khai | ĐÃ SỬA tiêu đề thành Trung – Anh, xóa hoàn toàn tiếng Nga. |
| 19 | `ef24f52e-f59b-4792-becd-1b61461d8631.webp` | 1536×1024 | Bộ trang lỗi hệ thống | `/help/errors` | Đã triển khai | Mỗi trang lỗi thực trả đúng HTTP status, kèm Request ID, không lộ stack trace. |
| 20 | `efb5b4a1-e974-4d7c-9c68-e2e3f55ef354.webp` | 1024×1536 | Trung tâm Trợ giúp WORD BRIDGE | `/help` | Đã triển khai | ĐÃ SỬA FAQ chỉ còn 2 ngôn ngữ Trung – Anh; dùng CSKH thay vì Support. |
