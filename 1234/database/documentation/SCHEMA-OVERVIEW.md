# Thiết kế Cơ sở Dữ liệu Cloudflare D1 (`word`)

- **Database Name**: `word`
- **Database ID**: `ce84cc48-6d49-409b-b45a-13ba3bc4a771`
- **Nguyên tắc an toàn**: Toàn bộ 8 migration chỉ dùng `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT OR IGNORE`. **Cấm tuyệt đối `DROP TABLE` hoặc xóa dữ liệu hiện có.**

## Danh sách Migrations
1. `0001_core_accounts_rbac.sql`: `wb_accounts` (8 trường đăng ký, `account_type = 'personal'`), `wb_profiles`, `wb_verification_tokens`, `wb_sessions`, `wb_oauth_identities`, `wb_passkeys`, `wb_roles`, `wb_permissions`, `wb_role_permissions`, `wb_account_roles`, `wb_entitlements`, `wb_student_benefits`.
2. `0002_languages_curriculum.sql`: `wb_languages` (`CHECK (code IN ('zh','en','ru'))`, `ru` buộc `has_specialized = 0`), `wb_programs`, `wb_program_levels`, `wb_curricula`, `wb_courses`, `wb_modules`, `wb_weeks` (đủ 20 trường bắt buộc), `wb_study_sessions`, `wb_lessons`, `wb_learning_resources`, `wb_learner_progress`.
3. `0003_dictionary_vocabulary_audio.sql`: `wb_vocabulary_sources`, `wb_dictionary_entries`, `wb_audio_assets`, `wb_vocabulary_sets`, `wb_vocabulary_notebook` (SM-2 SRS), `wb_grammar_topics`.
4. `0004_practice_examinations.sql`: `wb_question_bank` (12 dạng câu hỏi), `wb_practice_exercises`, `wb_practice_results`, `wb_examinations` (không bảng chứng chỉ), `wb_examination_attempts`.
5. `0005_learner_meet_intelligence.sql`: `wb_learner_meet_sessions` (chỉ metadata, khóa `recording_disabled = 1`, `chat_disabled = 1`, `screen_share_disabled = 1`), `wb_learner_meet_participants`, `wb_intelligence_runs` (15 hệ thống, cấm `knowledge-to-language` với `ru`).
6. `0006_email_automation_jobs_audit.sql`: `wb_email_events`, `wb_email_delivery_logs`, `wb_support_requests`, `wb_background_jobs`, `wb_audit_logs`, `wb_platform_config`.
7. `0007_seed_academic_baseline.sql`: Dữ liệu nền tảng chuẩn (3 ngôn ngữ, 9 vai trò RBAC, 5 chương trình, 36 tuần giáo trình, 13 mục từ cốt lõi, ngữ pháp, ngân hàng câu hỏi, đề khảo thí, tác vụ nền).
8. `0008_seed_specialized_vocab_user_dataset.sql`: 225 thuật ngữ tiếng Anh chuyên ngành trích xuất trực tiếp từ bộ dữ liệu `FILE TỪ VỰNG.zip` do chủ dự án cung cấp.
