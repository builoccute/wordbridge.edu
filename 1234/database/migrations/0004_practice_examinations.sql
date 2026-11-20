-- ============================================================================
-- Migration 0004: Practice 4 Skills + Vocabulary/Grammar, Question Bank &
-- Examinations (STRICTLY NO CERTIFICATES OF ANY KIND)
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_question_bank (
  id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  skill TEXT NOT NULL CHECK (skill IN ('listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar')),
  question_type TEXT NOT NULL CHECK (question_type IN (
    'single_choice', 'multiple_choice', 'fill_blank', 'matching',
    'sentence_order', 'true_false', 'reading_comprehension',
    'listening_comprehension', 'essay', 'speaking_prompt',
    'analytical', 'situational'
  )),
  level_ref TEXT NOT NULL,
  topic TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  options_json TEXT DEFAULT '[]',
  correct_answer_json TEXT,
  rubric_json TEXT,
  explanation_vi TEXT NOT NULL,
  audio_asset_id TEXT REFERENCES wb_audio_assets(id),
  max_score REAL NOT NULL DEFAULT 1.0,
  auto_gradable INTEGER NOT NULL DEFAULT 1 CHECK (auto_gradable IN (0, 1)),
  review_status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_qbank_filter ON wb_question_bank(language_code, skill, level_ref);

CREATE TABLE IF NOT EXISTS wb_practice_exercises (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  skill TEXT NOT NULL CHECK (skill IN ('listening', 'speaking', 'reading', 'writing', 'vocabulary', 'grammar')),
  title_vi TEXT NOT NULL,
  level_ref TEXT NOT NULL,
  topic TEXT NOT NULL,
  instructions_vi TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  rubric_summary_vi TEXT NOT NULL,
  is_public_preview INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_practice_results (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES wb_practice_exercises(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  skill TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  score REAL,
  max_score REAL NOT NULL,
  grading_status TEXT NOT NULL CHECK (grading_status IN ('auto_graded', 'pending_manual_review', 'partially_graded')),
  feedback_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_practice_results_acc ON wb_practice_results(account_id, submitted_at);

-- Examinations: strictly assessment & practice reference ONLY — NO certificate tables/columns
CREATE TABLE IF NOT EXISTS wb_examinations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  title_vi TEXT NOT NULL,
  framework_reference TEXT NOT NULL,
  level_ref TEXT NOT NULL,
  skills_json TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  instructions_vi TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  scoring_scale_json TEXT NOT NULL,
  passing_threshold REAL NOT NULL DEFAULT 60.0,
  disclaimer_vi TEXT NOT NULL DEFAULT 'WORD BRIDGE không phải đơn vị tổ chức thi chính thức và không cấp bất kỳ loại chứng chỉ nào.',
  review_status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_examination_attempts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  examination_id TEXT NOT NULL REFERENCES wb_examinations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'pending_manual_review')),
  draft_answers_json TEXT NOT NULL DEFAULT '{}',
  submitted_answers_json TEXT,
  score REAL,
  max_score REAL,
  score_percent REAL,
  result_breakdown_json TEXT DEFAULT '{}',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_wb_exam_attempts_acc ON wb_examination_attempts(account_id, started_at);
