# Tài liệu Vận hành & Tự động hóa (Operations)

## 1. Tác vụ nền tự động (Cloudflare Cron Triggers)
- `student_benefit_expiration_sync` (`0 1 * * *`): Kiểm tra quyền lợi sinh viên 03 tháng hết hạn, tự động hạ về `PERSONAL FREE` nếu chưa có gói trả phí và gửi email `student_benefit_expired`.
- `email_retry_dispatcher` (`*/15 * * * *`): Xử lý hàng đợi email trạng thái `RETRYING` với exponential backoff và giới hạn `max_retries = 3`.
- `cleanup_expired_tokens_and_sessions` (`0 1 * * *`): Dọn token và phiên quá hạn.
- `system_health_monitor` (`*/15 * * * *`): Giám sát sức khỏe kết nối D1.
- Mọi tác vụ có cơ chế tự dừng khi `consecutive_failures >= max_consecutive_failures` (5 lần), tránh chạy vô hạn.

## 2. Sao lưu & Phục hồi D1 (`word`)
- Sao lưu định kỳ: `bash scripts/d1-backup.sh ./backups`
- Phục hồi có kiểm soát: `bash scripts/d1-restore.sh ./backups/<file>.sql --local` (tự động chặn nếu tệp chứa `DROP TABLE`).

## 3. Bảy Trung tâm Quản trị Chuyên sâu (100% tiếng Việt)
1. Trung tâm biên tập học liệu (`/admin/lessons`)
2. Trung tâm quản trị khảo thí (`/admin/examinations`)
3. Trung tâm trí tuệ học tập (`/admin/language-intelligence`)
4. Trung tâm đa ngôn ngữ (`/admin/languages`)
5. Trung tâm chất lượng ngôn ngữ (`/admin/dictionary`)
6. Trung tâm bảo mật và kiểm toán (`/admin/audit-logs`)
7. Trung tâm vận hành hạ tầng (`/admin/infrastructure`)
