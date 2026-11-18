# NHẬT KÝ PHÁT TRIỂN DỰ ÁN (`docs/CHANGELOG.md`)

## [1.0.0] — 2026-11-18 (Greenfield Master Build & Delivery)
### Added
- Khởi tạo mới hoàn toàn từ con số 0 toàn bộ cấu trúc mã nguồn **WORD BRIDGE** (`https://www.wordbridge.vn/`).
- Hoàn thành nghiên cứu chuyên sâu 50 website quốc tế trong `docs/50-WEBSITE-RESEARCH.md`.
- Thiết kế và kiểm thử 4 bản migration SQL an toàn cho **Cloudflare D1 (`word`, ID: `ce84cc48-6d49-409b-b45a-13ba3bc4a771`)** gồm 35 bảng dữ liệu chuẩn hóa, không dùng `DROP TABLE`.
- Xây dựng tầng tích hợp **Cloudflare R2 (`word`)** với 11 tiền tố chuẩn, phân tách tệp công khai/riêng tư, quét tệp mồ côi và chặn lưu bản ghi Learner Meet.
- Xây dựng hệ thống xác thực cá nhân: Đăng ký 8 trường bắt buộc (tách biệt Trường học và Nơi làm việc), xác minh liên kết email tự động đăng nhập (không dùng OTP), OAuth 4 nhà cung cấp, WebAuthn/FIDO2 Passkey và Trung tâm bảo mật.
- Triển khai chính sách hỗ trợ sinh viên: 03 tháng Personal Plus miễn phí một lần duy nhất qua email trường cấp (`.edu`).
- Xây dựng đầy đủ 10 phân hệ cốt lõi, **15 Hệ thống Trí tuệ Ngôn ngữ khác biệt**, **Hệ thống Quản trị 100% Tiếng Việt** (5 nhóm phân hệ A–E, 7 trung tâm chuyên sâu, 9 vai trò RBAC) và **11 mẫu Email HTML/PlainText** (3 địa chỉ chính thức, quy tắc `Reply-To: cskh@wordbridge.vn`, không dùng PNG logo).
- Hoàn tất bộ kiểm thử tự động `14/14 PASS` (Unit, Integration, Security, E2E).
