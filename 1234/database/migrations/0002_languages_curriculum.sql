-- ============================================================================
-- Migration 0002: Languages (STRICTLY zh, en, ru ONLY), Programs, Levels,
-- Curricula, Courses, Modules, Weeks (20 mandatory fields), Sessions,
-- Lessons (12 components), Resources & Learner Progress
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_languages (
  code TEXT PRIMARY KEY CHECK (code IN ('zh', 'en', 'ru')),
  name_vi TEXT NOT NULL,
  native_name TEXT NOT NULL,
  has_general INTEGER NOT NULL DEFAULT 1 CHECK (has_general = 1),
  has_specialized INTEGER NOT NULL CHECK (
    (code IN ('zh', 'en') AND has_specialized = 1) OR
    (code = 'ru' AND has_specialized = 0)
  ),
  proficiency_framework TEXT NOT NULL,
  script_system TEXT NOT NULL,
  phonetic_system TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_programs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  program_type TEXT NOT NULL CHECK (program_type IN ('foundation', 'general', 'communication', 'academic', 'guided_self_study', 'specialized')),
  specialized_domain_slug TEXT,
  entry_level TEXT NOT NULL,
  target_level TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  prerequisites TEXT NOT NULL,
  total_modules INTEGER NOT NULL DEFAULT 1,
  total_weeks INTEGER NOT NULL DEFAULT 12,
  sessions_per_week INTEGER NOT NULL DEFAULT 3,
  estimated_hours INTEGER NOT NULL DEFAULT 36,
  overall_objectives TEXT NOT NULL,
  learning_outcomes TEXT NOT NULL,
  focus_skills_json TEXT NOT NULL DEFAULT '["listening","speaking","reading","writing"]',
  assessment_methods TEXT NOT NULL,
  completion_criteria TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'editing', 'approved', 'published', 'archived')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  author_name TEXT NOT NULL,
  reviewer_name TEXT,
  reference_sources TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (NOT (program_type = 'specialized' AND language_code = 'ru'))
);

CREATE INDEX IF NOT EXISTS idx_wb_programs_lang ON wb_programs(language_code, program_type);

CREATE TABLE IF NOT EXISTS wb_program_levels (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES wb_programs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  framework_ref TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  objectives TEXT NOT NULL,
  UNIQUE(program_id, slug)
);

CREATE TABLE IF NOT EXISTS wb_curricula (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES wb_programs(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'editing', 'approved', 'published', 'archived')),
  academic_approval_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_courses (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES wb_programs(id) ON DELETE CASCADE,
  curriculum_id TEXT NOT NULL REFERENCES wb_curricula(id) ON DELETE CASCADE,
  level_id TEXT REFERENCES wb_program_levels(id),
  slug TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  summary_vi TEXT NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 12,
  sessions_per_week INTEGER NOT NULL DEFAULT 3,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'editing', 'approved', 'published', 'archived')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES wb_courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  objectives_vi TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every week strictly carries all 20 required fields from Section 17
CREATE TABLE IF NOT EXISTS wb_weeks (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES wb_modules(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES wb_courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  week_number INTEGER NOT NULL,
  name_vi TEXT NOT NULL,
  topic_vi TEXT NOT NULL,
  week_objectives TEXT NOT NULL,
  learning_outcomes TEXT NOT NULL,
  required_knowledge TEXT NOT NULL,
  core_vocabulary_json TEXT NOT NULL,
  core_grammar_json TEXT NOT NULL,
  pronunciation_phonetics TEXT NOT NULL,
  listening_content TEXT NOT NULL,
  speaking_content TEXT NOT NULL,
  reading_content TEXT NOT NULL,
  writing_content TEXT NOT NULL,
  application_scenario TEXT NOT NULL,
  study_materials_json TEXT NOT NULL,
  audio_refs_json TEXT NOT NULL,
  exercises_json TEXT NOT NULL,
  weekly_test_spec TEXT NOT NULL,
  passing_criteria TEXT NOT NULL,
  review_assignment TEXT NOT NULL,
  next_week_prep TEXT NOT NULL,
  sessions_count INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_weeks_course ON wb_weeks(course_id, week_number);

CREATE TABLE IF NOT EXISTS wb_study_sessions (
  id TEXT PRIMARY KEY,
  week_id TEXT NOT NULL REFERENCES wb_weeks(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  position_in_week INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  objectives TEXT NOT NULL,
  new_knowledge TEXT NOT NULL,
  vocabulary_json TEXT NOT NULL,
  grammar_json TEXT NOT NULL,
  pronunciation_notes TEXT NOT NULL,
  examples_json TEXT NOT NULL,
  materials_json TEXT NOT NULL,
  media_refs_json TEXT DEFAULT '[]',
  activities_json TEXT NOT NULL,
  short_exercises_json TEXT NOT NULL,
  comprehension_check_json TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  self_study_homework TEXT NOT NULL,
  completion_condition TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wb_lessons (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES wb_study_sessions(id) ON DELETE SET NULL,
  week_id TEXT NOT NULL REFERENCES wb_weeks(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  level_ref TEXT NOT NULL,
  is_public_preview INTEGER NOT NULL DEFAULT 1,
  components_json TEXT NOT NULL,
  author_name TEXT NOT NULL,
  reviewer_name TEXT,
  reference_sources TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'editing', 'approved', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_learning_resources (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES wb_lessons(id) ON DELETE SET NULL,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  title_vi TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'audio', 'video', 'worksheet', 'template', 'reference')),
  r2_object_key TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'authenticated', 'private')),
  copyright_status TEXT NOT NULL DEFAULT 'original_word_bridge',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_learner_progress (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES wb_programs(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES wb_courses(id) ON DELETE CASCADE,
  week_id TEXT REFERENCES wb_weeks(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES wb_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score_percent REAL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_wb_progress_account ON wb_learner_progress(account_id, status);
