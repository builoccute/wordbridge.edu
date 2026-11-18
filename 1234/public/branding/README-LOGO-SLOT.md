# Vị trí Tích hợp Logo Chính thức WORD BRIDGE (`public/branding/`)

Theo đúng quy định tại **PHẦN XI – Mục 37** và **PHẦN XII – Mục 46**:
1. Logo WORD BRIDGE chính thức gồm:
   - Biểu tượng quyển sách mở kết hợp cây cầu.
   - Chữ **WORD** màu Deep Teal (`#146466`).
   - Chữ **BRIDGE** màu Vermilion Red (`#C92F1C`).
   - Tagline: `"Where Languages Bring People Together."`
2. Hiện tại file vector SVG gốc của logo chính thức thuộc nhóm **Đầu vào chưa có (Nhóm C)**.
3. Hệ thống tuân thủ nghiêm ngặt yêu cầu:
   - **Tuyệt đối không tự vẽ lại bằng AI** hoặc thay thế bằng logo giả mạo.
   - **Tuyệt đối không sử dụng PNG cho logo email.**
   - Đã bố trí vị trí tích hợp `[data-logo-slot="official-svg-pending"]` trên Header và `[data-logo-slot="official-svg-slot"]` trong 11 mẫu Email HTML, sử dụng wordmark chữ chuẩn màu thương hiệu kèm phương án dự phòng HTML/text.
   - Khi nhận được file `word-bridge-official-logo.svg` chính thức, chỉ cần đặt vào thư mục `public/branding/word-bridge-official-logo.svg` và tải lên R2 object key `branding/word-bridge-official-logo.svg`.
