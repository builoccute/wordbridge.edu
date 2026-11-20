# Changelog — WORD BRIDGE

## [3.2.0] - 2026-11-20
### Fixed & Added
- **Giáo trình 108 buổi & 108 bài học thực chất (Mục 12)**: Tạo migration an toàn `0012_v32_real_curriculum_content.sql` (0 `DROP TABLE`) thay thế 100% chuỗi mẫu `Từ trọng tâm ...` bằng từ vựng, cấu trúc ngữ pháp và ví dụ thực tế khớp 36 chủ đề Trung–Anh–Nga. Kiểm thử xác nhận 0 bản ghi placeholder còn sót.
- **SSO Assertion Issuer cho PDF Reader (Mục 52 & 64)**: Thêm `POST /api/v1/sso/reader/issue` (xác thực + CSRF) phát hành assertion ký HMAC-SHA256 đầy đủ `iss`, `aud`, `sub`, `email`, `fullName`, `iat`, `exp`, `jti`, `nonce` (`503 BLOCKED_UNCONFIGURED` khi thiếu secret).
- **24 Trang Quản trị D1 riêng biệt (Mục 58)**: Nâng cấp `src/pages/admin-pages.js` để toàn bộ 24 route `/admin/*` truy vấn và hiển thị bảng dữ liệu D1 riêng biệt bằng 100% tiếng Việt.
- **Kiểm thử mở rộng**: 19/19 test cases PASS (`npm test`).

## [3.1.0] - 2026-11-20
- Khắc phục CSRF backend, loại bỏ điểm 100% giả ở bài học, Webhook HMAC-SHA256 + anti-replay, Email retry thật, OAuth state/nonce, WebAuthn Passkey, Ownership isolation, trang chi tiết Học phần/Kết quả bài học/Khảo thí, HTML5 `<audio>` player và cân đối từ điển 358 mục từ.

## [3.0.0] - 2026-11-19
- Khởi tạo Greenfield Multi-page Website WORD BRIDGE trên Cloudflare Workers, D1 (`word`) và R2 (`word`).
