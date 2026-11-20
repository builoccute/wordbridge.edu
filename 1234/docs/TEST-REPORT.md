# Báo cáo Kiểm thử & Ma trận Trạng thái Nghiệm thu WORD BRIDGE V3.2

- **Ngày thực thi**: 2026-11-20 | **Lệnh**: `npm test` | **Kết quả**: **19 / 19 PASS (0 FAIL)**

| Nhóm kiểm thử | Tệp | Kết quả | Xác minh thực tế |
| :--- | :--- | :--- | :--- |
| Unit — Phạm vi & R2 | `tests/unit/language-scope.test.js` | **TESTED (5/5)** | Khóa `zh/en/ru`, chặn `ja/ko` & chuyên ngành `ru`, chặn R2 Learner Meet recording, 8 trường đăng ký, email sinh viên |
| Unit — Email 30 mẫu | `tests/unit/email-templates.test.js` | **TESTED (3/3)** | 30 mẫu HTML+Text, wordmark không PNG, đúng `noreply@`/`cskh@`/`contact@`, idempotency |
| Unit — Bảo mật V3.1/V3.2 | `tests/unit/security-csrf-webhook.test.js` | **TESTED (3/3)** | CSRF (403/201), Webhook HMAC + anti-replay (503/401/200), chấm bài học tại backend không giả 100% |
| Integration — D1 12 Migrations | `tests/integration/migrations-d1.test.js` | **TESTED (1/1)** | 12 migrations an toàn (0 `DROP TABLE`), 108 buổi, 115 bài học, 358 mục từ cân đối |
| Integration — Multi-page | `tests/integration/multipage-navigation.test.js` | **TESTED (1/1)** | 55+ route có `<title>` riêng, 0 link `#`, 0 PDF Reader ở Header/Footer |
| Integration — OAuth/Passkey/Ownership | `tests/integration/oauth-passkey-ownership.test.js` | **TESTED (3/3)** | OAuth state/nonce, Passkey WebAuthn challenge/verify/revoke, Ownership 403 |
| Integration — V3.2 Curriculum & SSO | `tests/integration/v32-curriculum-and-sso.test.js` | **TESTED (2/2)** | 0 placeholder trong 108 buổi & 108 bài học, đủ 24 route `/admin/*` D1 riêng, SSO Issuer `iss`/`aud`/`sub`/`jti`/`nonce` |
| E2E — Toàn trình | `tests/e2e/user-journeys.test.js` | **TESTED (1/1)** | Toàn trình có CSRF: Học phần, Audio `<audio>`, Kết quả bài học, Làm bài & Kết quả khảo thí (`certificateIssued: false`), CMS RBAC |

## Trạng thái các hạng mục phụ thuộc (Mục 73 & 75)
- `BLOCKED`: Logo SVG gốc, Resend/SMTP API key & DNS SPF/DKIM/DMARC, OAuth credentials, LiveKit WebRTC credentials, ASR provider, Audio gốc R2 production, SSO production credentials, Cloudflare production deploy.
- `IN DEVELOPMENT`: Nghiên cứu 1.000 website (25 website đã xác minh công khai; 975 mục còn lại ghi trung thực là `NOT STARTED`).
