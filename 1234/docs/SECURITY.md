# TÀI LIỆU KIẾN TRÚC BẢO MẬT & QUYỀN RIÊNG TƯ (`docs/SECURITY.md`)

## 1. Các Cơ chế Bảo mật Ứng dụng Đã Triển khai Thực tế
1. **Password Hashing:** Sử dụng thuật toán `PBKDF2-SHA256` với `100.000` vòng lặp và muối ngẫu nhiên (`16 bytes` CSPRNG) riêng biệt cho từng tài khoản; so sánh chuỗi băm bằng thuật toán thời gian hằng số (`timingSafeEqualHex`) chống tấn công đo thời gian (Timing Attack).
2. **Session & Cookie Protection:** Phiên đăng nhập sử dụng token ngẫu nhiên `256-bit` (chỉ lưu bản băm `SHA-256` trong DB), thiết lập cookie `HttpOnly; Secure; SameSite=Lax; Path=/`.
3. **CSRF Protection:** Mỗi phiên sinh một `csrf_token` riêng biệt; các yêu cầu thay đổi dữ liệu sử dụng xác thực cookie bắt buộc đính kèm header `X-CSRF-Token` khớp với phiên.
4. **XSS Protection:** Toàn bộ dữ liệu hiển thị qua SSR hoặc mẫu Email đều đi qua hàm `escapeHtml` và `sanitizeText` loại bỏ thẻ `<script>`, `javascript:` URI và các thuộc tính sự kiện `on*`. Thiết lập header `Content-Security-Policy` nghiêm ngặt.
5. **SQL Injection Protection:** 100% truy vấn Cloudflare D1 sử dụng Prepared Statements (`.prepare(sql).bind(...params)`) kết hợp bộ lọc `detectSqlInjectionPattern` chặn sớm các chuỗi tấn công `UNION SELECT`, `DROP TABLE`, `' OR '1'='1` tại tầng API Router.
6. **Rate Limiting & Brute-Force Protection:** Giới hạn tần suất theo cửa sổ trượt trên từng IP/Endpoint (`20 req/phút` cho `/api/auth/*`, `120 req/phút` cho API chung). Tự động khóa tạm thời tài khoản `15 phút` (`HTTP 423 Locked`) sau `5` lần nhập sai mật khẩu liên tiếp.
7. **Authorization tại Backend & Chống IDOR:** Kiểm tra quyền truy cập và quyền sở hữu dữ liệu (`account_id`) trên mọi thao tác Passkey, hồ sơ, tiến độ và tệp R2 riêng tư. Không cấp bất kỳ vai trò quản trị nào mặc định khi đăng ký.
8. **Bảo mật WebAuthn / FIDO2 Passkey:** Hệ thống chỉ lưu trữ `credential_id` và khóa công khai `public_key_spki`. Từ chối ngay lập tức (`HTTP 400`) nếu client gửi bất kỳ trường dữ liệu sinh trắc học, vân tay, khuôn mặt, mã PIN hay khóa bí mật nào.
9. **Quyền riêng tư Learner Meet:** Khóa cứng ở cấp độ schema và API đối với tính năng chat, gửi tệp, chia sẻ màn hình và ghi âm/ghi hình. Không bao giờ sử dụng dữ liệu phiên Learner Meet cho huấn luyện AI hay quảng cáo.

## 2. Cấu hình Bảo mật Email (SPF, DKIM, DMARC) cho `wordbridge.vn`
Khi kết nối tên miền `wordbridge.vn` với nhà cung cấp dịch vụ gửi email giao dịch (ví dụ Resend hoặc Cloudflare Email Routing), quản trị viên hạ tầng cần thiết lập các bản ghi DNS sau:

```dns
; 1. Bản ghi SPF (Chỉ cho phép máy chủ gửi thư được ủy quyền)
wordbridge.vn.  IN  TXT  "v=spf1 include:_spf.resend.com include:_spf.mx.cloudflare.net ~all"

; 2. Bản ghi DKIM (Ký số xác thực toàn vẹn nội dung thư)
resend._domainkey.wordbridge.vn.  IN  TXT  "p=<PUBLIC_KEY_CUA_NHA_CUNG_CAP_EMAIL>"

; 3. Bản ghi DMARC (Chính sách kiểm soát giả mạo tên miền & nhận báo cáo)
_dmarc.wordbridge.vn.  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:cskh@wordbridge.vn; ruf=mailto:cskh@wordbridge.vn; pct=100; adkim=s; aspf=s"
```
