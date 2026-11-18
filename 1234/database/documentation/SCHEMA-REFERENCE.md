# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU CLOUDFLARE D1 (`docs/DATABASE.md`)

## 1. Thông tin Định danh Cơ sở Dữ liệu
- **Tên Database:** `word`
- **Database ID:** `ce84cc48-6d49-409b-b45a-13ba3bc4a771`
- **Cloudflare Dashboard:** `https://dash.cloudflare.com/6028ea7100116ba19b3c6b9590c45768/workers/d1`
- **Nguyên tắc Bảo toàn Dữ liệu:**
  1. Sử dụng đúng database `word` đã cung cấp, không tạo database thay thế.
  2. Tuyệt đối **KHÔNG sử dụng `DROP TABLE`**, `TRUNCATE TABLE` hoặc xóa dữ liệu hiện có.
  3. Toàn bộ các bản migration trong `database/migrations/` đều sử dụng `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` và `INSERT OR IGNORE`.
  4. Mọi truy vấn dữ liệu bắt buộc đi qua Prepared Statements tham số hóa.

## 2. Sơ đồ Quan hệ Thực thể (ERD Tổng quát)

```
[accounts] 1 ──── 1 [profiles] (Tách biệt bắt buộc school_name & workplace_name)
    │
    ├──── * [email_verification_tokens] (Liên kết xác minh email - Không OTP)
    ├──── * [oauth_identities] (Google, Facebook, Microsoft, Apple - Không tự gộp trùng email)
    ├──── * [passkeys] (WebAuthn/FIDO2 Public Key & Credential ID - Không lưu sinh trắc học)
    ├──── * [sessions] (Quản lý phiên, thiết bị & CSRF token)
    ├──── * [account_roles] * ──── 1 [roles] 1 ──── * [role_permissions] * ──── 1 [permissions]
    ├──── 1 [subscription_entitlements] (Personal Free / Personal Plus & Chính sách Sinh viên 03 tháng)
    ├──── * [personal_vocabulary] * ──── 1 [dictionary_entries]
    ├──── * [exercise_submissions] * ──── 1 [exercises]
    ├──── * [exam_results] * ──── 1 [exams] (Tuyệt đối không có bảng hay trường cấp chứng chỉ)
    ├──── * [learner_progress] * ──── 1 [lessons] * ──── 1 [courses] * ──── 1 [curricula] * ──── 1 [learning_programs] * ──── 1 [languages]
    ├──── * [learner_meet_participants] * ──── 1 [learner_meet_sessions] (Chỉ lưu metadata tham gia/rời phiên, cấm chat/ghi âm)
    └──── * [15 Bảng Hệ thống Trí tuệ Ngôn ngữ: li_language_dna_profiles ... li_observatory_reports]
```

## 3. Danh mục 35 Bảng Dữ liệu trong Cloudflare D1 (`word`)

### Nhóm 1: Tài khoản Cá nhân, Xác thực, Passkey & RBAC
1. `schema_migrations`: Lưu phiên bản migration (`version` PK, `name`, `applied_at`, `checksum`).
2. `accounts`: Tài khoản cá nhân (`id` PK, `email` UNIQUE, `password_hash`, `password_salt`, `email_verified`, `account_status`, `profile_completed`, `failed_login_attempts`, `locked_until`).
3. `profiles`: Hồ sơ cá nhân (`account_id` PK/FK, `full_name`, `date_of_birth`, `phone_number`, `school_name`, `workplace_name`, `ui_language`, `primary_learning_language`).
4. `email_verification_tokens`: Liên kết xác minh email & đặt lại mật khẩu (`id` PK, `account_id` FK, `token_hash` UNIQUE, `purpose`, `expires_at`, `consumed_at`).
5. `oauth_identities`: Liên kết OAuth (`id` PK, `account_id` FK, `provider`, `provider_user_id`, UNIQUE(`provider`, `provider_user_id`)).
6. `passkeys`: Khóa bảo mật WebAuthn/FIDO2 (`id` PK, `account_id` FK, `credential_id` UNIQUE, `public_key_spki`, `friendly_name`, `sign_count`, `revoked`).
7. `sessions`: Phiên đăng nhập (`id` PK, `account_id` FK, `token_hash` UNIQUE, `csrf_token`, `ip_address`, `user_agent`, `device_label`, `auth_method`, `expires_at`, `revoked`).
8. `roles`: 9 vai trò quản trị + Người hướng dẫn + Người học (`code` PK, `name_vi`, `description_vi`, `is_admin_role`).
9. `permissions`: Danh mục quyền hệ thống (`code` PK, `module_vi`, `description_vi`).
10. `role_permissions`: Ánh xạ vai trò – quyền (`role_code` FK, `permission_code` FK).
11. `account_roles`: Phân quyền tài khoản (`account_id` FK, `role_code` FK, `granted_by`, `approval_note`).
12. `security_events`: Nhật ký sự kiện bảo mật (`id` PK, `account_id` FK, `event_type`, `severity`, `ip_address`, `details_json`).
13. `account_lifecycle_requests`: Yêu cầu khôi phục/xóa tài khoản (`id` PK, `account_id` FK, `request_type`, `status`).
14. `audit_logs`: Nhật ký kiểm toán thay đổi RBAC và quản trị (`id` PK, `actor_account_id` FK, `action`, `target_type`, `target_id`, `before_json`, `after_json`).

### Nhóm 2: Học thuật, Từ điển, Luyện tập, Khảo thí & Learner Meet
15. `languages`: Ba ngôn ngữ chính thức (`code` PK CHECK `IN ('zh','en','ru')`, `name_vi`, `supports_general`, `supports_specialized`).
16. `learning_programs`: Chương trình học (`id` PK, `language_code` FK, `program_group`, `level_code`, `specialized_domain`, `status`, `version`).
17. `curricula`: Giáo trình (`id` PK, `program_id` FK, `code` UNIQUE, `title_vi`).
18. `courses`: Khóa học (`id` PK, `curriculum_id` FK, `language_code` FK, `is_specialized`, `specialized_field`).
19. `lessons`: Bài học 12 thành phần (`id` PK, `course_id` FK, `language_code` FK, `objectives_json`, `vocabulary_json`, `grammar_json`, `new_knowledge_html`, `examples_json`, `context_dialogue_json`, `listening_section_json`, `speaking_section_json`, `reading_section_json`, `writing_section_json`, `media_assets_json`, `status`, `version`).
20. `learning_resources`: Metadata học liệu lưu trên R2 (`id` PK, `lesson_id` FK, `r2_object_key` UNIQUE, `resource_type`, `mime_type`, `size_bytes`, `visibility`, `checksum_sha256`).
21. `dictionary_entries`: Mục từ điển & thuật ngữ chuyên ngành (`id` PK, `language_code` FK, `headword`, `phonetic`, `part_of_speech`, `meaning_vi`, `definition_target`, `synonyms_json`, `antonyms_json`, `word_family_json`, `collocations_json`, `radicals_stroke_json`, `is_specialized`).
22. `grammar_entries`: Chủ điểm ngữ pháp (`id` PK, `language_code` FK, `code` UNIQUE, `title_vi`, `structure_formula`, `explanation_vi`).
23. `personal_vocabulary`: Sổ từ vựng cá nhân & Spaced Repetition (`id` PK, `account_id` FK, `dictionary_entry_id` FK, `ease_factor`, `interval_days`, `repetitions`, `next_review_at`).
24. `exercises`: Bài tập luyện 4 kỹ năng (`id` PK, `lesson_id` FK, `language_code` FK, `skill_type`, `exercise_format`, `prompt_text`, `options_json`, `correct_answer_json`, `rubric_json`).
25. `exercise_submissions`: Kết quả làm bài tập (`id` PK, `account_id` FK, `exercise_id` FK, `score_percent`, `is_correct`, `feedback_json`).
26. `question_bank`: Ngân hàng câu hỏi khảo thí (`id` PK, `language_code` FK, `skill_type`, `level_code`, `question_type`, `stem_text`, `choices_json`, `answer_key_json`, `points`).
27. `exams`: Đề thi đánh giá năng lực (`id` PK, `language_code` FK, `code` UNIQUE, `title_vi`, `standard_ref`, `duration_minutes`, `passing_score_percent`).
28. `exam_results`: Kết quả khảo thí (`id` PK, `account_id` FK, `exam_id` FK, `total_score`, `percentage`, `passed`, `skill_breakdown_json`, `diagnostic_summary_vi`).
29. `learner_progress`: Tiến độ học tập (`id` PK, `account_id` FK, `language_code` FK, `lesson_id` FK, `completion_status`, `mastery_score`, `time_spent_seconds`).
30. `learner_meet_sessions`: Metadata phòng Learner Meet (`id` PK, `room_code` UNIQUE, `host_account_id` FK, `mode`, `chat_disabled` CHECK `= 1`, `recording_disabled` CHECK `= 1`, `screenshare_disabled` CHECK `= 1`).
31. `learner_meet_participants`: Metadata thời điểm tham gia/rời phiên (`id` PK, `session_id` FK, `account_id` FK, `joined_at`, `left_at`, `connection_state`, `mic_enabled`, `camera_enabled`).
32. `subscription_entitlements`: Gói dịch vụ & Chính sách sinh viên 03 tháng (`account_id` PK/FK, `plan_code`, `is_student_benefit`, `student_edu_email` UNIQUE, `student_benefit_claimed_once`, `expires_at`).
33. `email_records`: Nhật ký giao dịch email (`id` PK, `template_code`, `from_address`, `reply_to_address`, `to_address`, `delivery_status`).
34. `notifications` & `platform_configurations`: Thông báo nội bộ và cấu hình hệ thống.

### Nhóm 3: 16 Bảng Chuyên biệt của 15 Hệ thống Trí tuệ Ngôn ngữ (`0002_language_intelligence_15_systems.sql`)
- `language_intelligence_systems` (Bảng đăng ký 15 hệ thống) và 15 bảng dữ liệu tương ứng từ `li_language_dna_profiles` (#1) đến `li_observatory_reports` (#15).

## 4. Hướng dẫn Kiểm tra Schema, Chạy Migration, Sao lưu (Backup) & Phục hồi (Restore)

```bash
# 1. Kiểm tra danh sách bảng hiện có trên D1 database `word` trước khi chạy migration:
npx wrangler d1 execute word --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 2. Áp dụng migration an toàn trên môi trường local:
npm run db:migrate:local

# 3. Sao lưu (Export Backup) toàn bộ D1 database `word` trước khi nâng cấp production:
npx wrangler d1 export word --remote --output=./backups/word-d1-backup-$(date +%Y%m%d).sql

# 4. Áp dụng migration lên D1 `word` remote:
npm run db:migrate:prod

# 5. Phục hồi (Restore) từ file SQL backup khi cần thiết:
npx wrangler d1 execute word --remote --file=./backups/word-d1-backup-YYYYMMDD.sql
```
