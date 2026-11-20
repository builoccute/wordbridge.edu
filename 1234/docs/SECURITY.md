# Kiến trúc Bảo mật WORD BRIDGE

1. **Mật khẩu**: Băm bằng `PBKDF2-SHA256` (100,000 vòng, salt ngẫu nhiên 16 byte trên mỗi tài khoản). Tuyệt đối không lưu mật khẩu thuần và không ghi vào log.
2. **Phiên đăng nhập & Cookie**: Token ngẫu nhiên 32 byte lưu dạng băm `SHA-256` trong `wb_sessions`; cookie đặt cờ `HttpOnly; SameSite=Lax; Secure`; mỗi phiên đi kèm `csrf_token` riêng và có thể thu hồi tức thì.
3. **Chống Brute-force**: Khóa tạm thời 15 phút sau 5 lần đăng nhập sai liên tiếp.
4. **Xác minh Email & Khôi phục mật khẩu**: Token dùng một lần (`consumed_at`), có hạn 30 phút, băm `SHA-256` kèm `TOKEN_PEPPER`. Không dùng OTP cho đăng ký.
5. **OAuth (Google/Facebook/Microsoft/Apple)**: Không tự động gộp tài khoản trùng email khi chưa xác minh quyền sở hữu và xác nhận từ người dùng.
6. **Passkey (WebAuthn/FIDO2)**: Chỉ lưu `credential_id` và `public_key_cose`. Tuyệt đối không thu thập vân tay, khuôn mặt, PIN hay private key.
7. **HTTP Security Headers**: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
8. **Chống SQL Injection & XSS**: 100% truy vấn D1 dùng parameterized `.prepare().bind(...)`; toàn bộ đầu ra HTML đi qua `escapeHtml()`.
9. **Kiểm soát RBAC & Audit Log**: Mọi quyền quản trị kiểm tra tại backend; mọi hành động quan trọng ghi vào `wb_audit_logs`.
