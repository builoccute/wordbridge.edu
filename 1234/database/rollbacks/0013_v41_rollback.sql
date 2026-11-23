-- ============================================================================
-- Rollback Script for Migration 0013 (Manual execution only — NOT auto-applied)
-- Restores exam_admin/exam:manage RBAC entries and Exam rows from archive tables.
-- ============================================================================
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO wb_roles (id, code, name_vi, description_vi) VALUES
  ('role_exam_admin', 'exam_admin', 'Quản trị khảo thí', 'Khôi phục từ rollback 0013');

INSERT OR IGNORE INTO wb_permissions (id, code, resource, action, description_vi) VALUES
  ('perm_exam_manage', 'exam:manage', 'examinations', 'manage', 'Khôi phục từ rollback 0013');

INSERT OR IGNORE INTO wb_role_permissions (role_id, permission_id) VALUES
  ('role_super_admin', 'perm_exam_manage'),
  ('role_exam_admin', 'perm_exam_manage');

INSERT OR IGNORE INTO wb_examinations (
  id, slug, language_code, title_vi, framework_reference, level_ref, skills_json, topic,
  duration_minutes, instructions_vi, question_ids_json, scoring_scale_json, passing_threshold,
  disclaimer_vi, review_status, created_at
)
SELECT id, slug, language_code, title_vi, framework_reference, level_ref, skills_json, topic,
       duration_minutes, instructions_vi, question_ids_json, scoring_scale_json, passing_threshold,
       disclaimer_vi, review_status, created_at
FROM wb_archive_examinations;

INSERT OR IGNORE INTO wb_examination_attempts (
  id, account_id, examination_id, status, draft_answers_json, submitted_answers_json,
  score, max_score, score_percent, result_breakdown_json, started_at, last_saved_at, submitted_at
)
SELECT id, account_id, examination_id, status, draft_answers_json, submitted_answers_json,
       score, max_score, score_percent, result_breakdown_json, started_at, last_saved_at, submitted_at
FROM wb_archive_examination_attempts;
