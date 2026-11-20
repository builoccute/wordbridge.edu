# Danh mục Đầu vào Chưa có & Hạng mục BLOCKED (Phần XXIV)

Tài liệu này liệt kê trung thực toàn bộ các hạng mục Nhóm B (cấu hình sau) và Nhóm C (tài nguyên chính thức) hiện đang ở trạng thái `BLOCKED`, chưa được giả mạo hoạt động:

## Nhóm B — Chuẩn bị trước, cấu hình sau (`BLOCKED`)
1. **Email Provider & DNS**: Chưa có `RESEND_API_KEY` (hoặc SMTP relay) và quyền cấu hình DNS cho `SPF`, `DKIM`, `DMARC` của tên miền `wordbridge.vn`. Do đó chưa thể kiểm thử hiển thị thực tế trên hộp thư Gmail/Outlook/Apple Mail.
2. **OAuth Credentials**: Chưa có Client ID/Secret cho Google, Facebook, Microsoft, Apple Sign-In.
3. **Learner Meet WebRTC Provider**: Chưa cấu hình `LIVEKIT_WS_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` và chưa có phê duyệt chi phí dịch vụ bên thứ ba.
4. **PDF Reader SSO**: Chưa có tài liệu và credential tích hợp SSO với `https://reader.wordbridge.vn/`.
5. **ASR / Speech Pronunciation & External AI Adapters**: Chưa có nhà cung cấp ASR/AI được phê duyệt chi phí; hệ thống hiển thị trạng thái trung thực và tuyệt đối không giả lập điểm phát âm hay điểm viết tự luận.
6. **Cloudflare Production Deploy**: Chưa có `CLOUDFLARE_API_TOKEN` để áp dụng migration lên D1 remote và chạy `wrangler deploy`.

## Nhóm C — Cần tài nguyên chính thức (`BLOCKED`)
1. **Logo SVG vector gốc**: Hiện mới có ảnh raster tham chiếu `public/branding/logo-reference.jpg`. Website và Email đang dùng wordmark HTML/text chuẩn thương hiệu và sẵn sàng thay tệp `word-bridge-logo.svg` ngay khi có file gốc.
2. **Audio phát âm gốc chính thức**: Cần thu âm/cấp phép và tải lên Cloudflare R2 (`audio/`), gắn metadata vào `wb_audio_assets`.
3. **Nội dung học thuật & Ngân hàng câu hỏi mở rộng**: Đã xây dựng khung giáo trình 36 tuần + 238 mục từ điển + bài tập/đề thi nền tảng; cần Hội đồng học thuật tiếp tục biên soạn và duyệt mở rộng các cấp độ cao hơn (HSK 2–9, CEFR A2–C2, TORFL ТБУ–ТРКИ-IV).
4. **Bảng giá thương mại `PERSONAL PLUS`**: Chưa xác nhận mức giá chính thức nên không tự bịa giá.
5. **Văn bản pháp lý cuối cùng**: 4 trang chính sách (`/policies/*`) hiện là bản khung dự thảo chờ duyệt pháp lý.
6. **Nghiên cứu 1.000 website**: Đã khảo sát có bằng chứng 15 nền tảng lõi (2026-11-19); cần tiếp tục hoàn thiện 985 mục còn lại trong `docs/WEBSITE-RESEARCH-INDEX.csv` (hiện ghi trung thực là `NOT STARTED`).
