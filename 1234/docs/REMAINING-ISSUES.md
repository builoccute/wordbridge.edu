# DANH MỤC ĐẦU VÀO CÒN THIẾU & VẤN ĐỀ CẦN CẤU HÌNH TIẾP (`docs/REMAINING-ISSUES.md`)

Theo đúng nguyên tắc phân loại tại **PHẦN XVIII (Mục 66 – 68)** và **PHẦN XXI (Mục 76)**, dưới đây là bảng phân định minh bạch giữa các hạng mục đã hoàn thiện 100% trong mã nguồn (**Nhóm A**) và các hạng mục phụ thuộc đầu vào bên ngoài (**Nhóm B & Nhóm C**):

## 1. Nhóm B — Đã xây dựng hoàn chỉnh Adapter & Giao diện, chờ cấu hình Credentials thực tế (`BLOCKED` bởi thông tin dịch vụ ngoài)

| Hạng mục | Trạng thái Mã nguồn | Trạng thái Vận hành ngoài | Việc cần thực hiện để kích hoạt Production |
| :--- | :--- | :--- | :--- |
| **1. Dịch vụ gửi Email thực tế** | `VERIFIED` (Đã có `EmailDeliveryAdapter` & 11 mẫu HTML/PlainText) | `BLOCKED` (Thiếu `EMAIL_PROVIDER` & `EMAIL_API_KEY`) | Đăng ký tài khoản Resend/SMTP, cấu hình SPF/DKIM/DMARC cho `wordbridge.vn` và nạp `wrangler secret put EMAIL_API_KEY`. |
| **2. OAuth 4 Nhà cung cấp (Google, Facebook, Microsoft, Apple)** | `VERIFIED` (Đã có luồng callback, chặn gộp email tự động & nhắc bổ sung hồ sơ) | `BLOCKED` (Thiếu Client ID & Client Secret) | Khởi tạo ứng dụng OAuth trên Google Cloud, Meta, Microsoft Entra ID, Apple Developer và nạp biến môi trường. |
| **3. Nhà cung cấp WebRTC cho Learner Meet** | `VERIFIED` (Đã có quản lý phòng, bật/tắt mic/cam, khóa chat & ghi âm) | `BLOCKED` (Thiếu `LEARNER_MEET_API_KEY` / LiveKit hoặc Cloudflare Realtime) | Nạp khóa kết nối WebRTC SFU vào biến môi trường Worker. |
| **4. Kết nối SSO với PDF Reader độc lập (`reader.wordbridge.vn`)** | `VERIFIED` (Đã có `getPdfReaderSsoStatus` tách biệt khỏi Header/Footer/Trang chủ) | `BLOCKED` (Thiếu tài liệu kỹ thuật SSO & `PDF_READER_SSO_SHARED_SECRET`) | Cung cấp thông số kỹ thuật SSO của ứng dụng `reader.wordbridge.vn` và bật `PDF_READER_SSO_ENABLED=true`. |

## 2. Nhóm C — Cần Tài nguyên Thương hiệu & Học thuật Chính thức từ Chủ sở hữu

| Hạng mục | Trạng thái hiện tại trong Repository | Hành động khi nhận được tài nguyên chính thức |
| :--- | :--- | :--- |
| **1. File Logo SVG gốc chính thức** | Đang dùng vị trí tích hợp `[data-logo-slot]` kèm Wordmark chữ tạm thời đúng màu `#146466` và `#C92F1C` (Tuyệt đối không dùng logo AI tự vẽ hay PNG). | Đặt file vector gốc vào `public/branding/word-bridge-official-logo.svg` và tải lên R2 key `branding/word-bridge-official-logo.svg`. |
| **2. Kho nội dung học thuật, từ điển & ngân hàng câu hỏi quy mô lớn** | Đã khởi tạo cấu trúc bảng D1 chuẩn hóa và bộ dữ liệu hạt giống (Seed Catalog) chuẩn học thuật cho cả 3 ngôn ngữ Trung – Anh – Nga. | Sử dụng **Trung tâm biên tập học liệu** và **Trung tâm quản trị khảo thí** để nhập liệu hàng loạt từ nguồn học thuật chính thức đã thẩm định. |
| **3. Văn bản pháp lý chính thức của 4 trang Chính sách** | Đã tạo cấu trúc trang và các điều khoản cốt lõi theo đúng quy định sản phẩm. | Cập nhật văn bản pháp lý đã được bộ phận pháp chế phê duyệt. |
