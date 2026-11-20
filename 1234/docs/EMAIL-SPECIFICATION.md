# Đặc tả Hệ thống Email Tự động & Xác thực Tên miền

## 1. Ba địa chỉ chính thức
- `noreply@wordbridge.vn` (Reply-To: `cskh@wordbridge.vn`): Email tự động hệ thống.
- `cskh@wordbridge.vn` (Reply-To: `cskh@wordbridge.vn`): Chăm sóc khách hàng & hỗ trợ.
- `contact@wordbridge.vn` (Reply-To: `contact@wordbridge.vn`): Liên hệ & hợp tác.

## 2. Đầy đủ 30 mẫu email bắt buộc (`email/templates/registry.js`)
Mọi mẫu đều sinh đồng thời bản **HTML responsive** và **Plain Text fallback**, dùng wordmark HTML/text chuẩn màu thương hiệu khi chưa có SVG gốc hoặc khi email client không hỗ trợ SVG (tuyệt đối không thay bằng PNG).

## 3. Tự động hóa, Idempotency & Trạng thái thật
- Chống gửi trùng bằng `idempotency_key` (`UNIQUE` trong `wb_email_events`).
- Tách bạch trạng thái: `QUEUED`, `SENT`, `ACCEPTED`, `DELIVERED` (chỉ khi webhook xác nhận), `BOUNCED`, `FAILED`, `COMPLAINED`, `RETRYING`, `BLOCKED_UNCONFIGURED`.

## 4. Yêu cầu cấu hình DNS (Chờ thực hiện khi có quyền DNS `wordbridge.vn`)
- **SPF**: Bản ghi TXT khai báo máy chủ gửi hợp lệ cho `wordbridge.vn` và subdomain `send.wordbridge.vn`.
- **DKIM**: Cặp khóa RSA/Ed25519 do nhà cung cấp email (ví dụ Resend) cấp.
- **DMARC**: `_dmarc.wordbridge.vn` bắt đầu bằng `p=none; rua=mailto:postmaster@wordbridge.vn` trước khi nâng lên `p=quarantine` / `p=reject`.
- **Return-Path & Bounce**: Cấu hình bản ghi MX trên Custom Return-Path để nhận bounce tự động.
- *Lưu ý*: Không tự tạo giá trị DNS giả; trạng thái xác thực tên miền hiện là `BLOCKED`.
