# WORD BRIDGE — Official Branding & Logo SVG Slot

## Trạng thái hiện tại (Mục 62)
- `logo-reference.jpg`: Tệp ảnh raster tham chiếu do chủ dự án cung cấp (dùng để tham khảo bố cục quyển sách mở kết hợp cây cầu, `WORD` màu Deep Teal `#146466`, `BRIDGE` màu Vermilion Red `#C92F1C`, tagline `Where Languages Bring People Together.`).
- **Tệp SVG vector gốc chính thức (`word-bridge-logo.svg`)**: `PENDING / BLOCKED` — chưa nhận tệp vector SVG gốc.
- **Nguyên tắc tuân thủ**:
  - Website và Email sử dụng wordmark HTML/text chuẩn thương hiệu cho đến khi tệp `word-bridge-logo.svg` gốc được đưa vào thư mục này.
  - Tuyệt đối không tự vẽ lại logo rồi tuyên bố là logo gốc; không rasterize SVG thành PNG làm tài sản logo chính.
  - Khi nhận tệp SVG gốc: đặt tại `public/branding/word-bridge-logo.svg`, kiểm tra `viewBox` hợp lệ, giữ nguyên tỷ lệ (`max-width`, `height: auto`, `object-fit: contain`), và cấu hình biến `LOGO_SVG_STATUS="active"`.
