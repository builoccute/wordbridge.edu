-- ============================================================================
-- WORD BRIDGE — Cloudflare D1 Migration 20261127_001 (Backward-Compatible)
-- Target D1 Database: word (ID: ce84cc48-6d49-409b-b45a-13ba3bc4a771)
-- Purpose: Add independent self-study courses, isolated 2,000-card Flashcard/SRS,
--          My Mistakes, Practice Insights, Audio Asset Bindings,
--          Writing Submissions, and Personal Vocabulary Bookmarks.
-- Safety:
--   1. Strictly prefixed `wb_*`; DOES NOT alter or drop any legacy tables
--      (users, auth, passkeys, rbac, dictionary, specialties).
--   2. Every user-owned table enforces `user_id TEXT NOT NULL` and indexes by
--      `user_id` so API handlers strictly isolate per-account data.
--   3. Rollback script is isolated in `migrations/rollbacks/` so `wrangler d1
--      migrations apply` can NEVER accidentally execute rollback SQL.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Self-Study Courses Catalog
CREATE TABLE IF NOT EXISTS wb_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'zh-CN')),
  proficiency_scale TEXT NOT NULL,
  scale_note_vi TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  entry_level TEXT NOT NULL,
  target_level TEXT NOT NULL,
  target_audience TEXT,
  estimated_hours REAL NOT NULL DEFAULT 10,
  delivery_mode TEXT NOT NULL DEFAULT 'SELF_STUDY' CHECK (delivery_mode = 'SELF_STUDY'),
  certificate_issued INTEGER NOT NULL DEFAULT 0 CHECK (certificate_issued = 0),
  status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED'
    CHECK (status IN ('DRAFT', 'REVIEW_REQUIRED', 'VALIDATED_STRUCTURE', 'EXPERT_REVIEWED', 'PUBLISHED')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_courses_lang_status ON wb_courses (language, status);

-- 2. User Course Enrollment & Lesson/Activity Progress
CREATE TABLE IF NOT EXISTS wb_user_course_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES wb_courses(id) ON DELETE CASCADE,
  current_chapter_id TEXT,
  current_lesson_id TEXT,
  completed_lessons_json TEXT NOT NULL DEFAULT '[]',
  completed_activities_json TEXT NOT NULL DEFAULT '[]',
  chapter_scores_json TEXT NOT NULL DEFAULT '{}',
  completion_percent REAL NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_wb_course_prog_user ON wb_user_course_progress (user_id, last_accessed_at DESC);

-- 3. Dedicated 2,000 Flashcard Deck (STRICTLY ISOLATED from public dictionary)
CREATE TABLE IF NOT EXISTS wb_flashcard_deck_items (
  id TEXT PRIMARY KEY,
  en TEXT NOT NULL,
  zh TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  ipa TEXT NOT NULL,
  vi TEXT NOT NULL,
  pos TEXT NOT NULL,
  example_en TEXT NOT NULL,
  example_zh TEXT NOT NULL,
  example_pinyin TEXT NOT NULL,
  example_vi TEXT NOT NULL,
  topic TEXT NOT NULL,
  domain_id INTEGER NOT NULL,
  level_en TEXT NOT NULL,
  level_zh TEXT NOT NULL,
  deck_scope TEXT NOT NULL DEFAULT 'FLASHCARD_ONLY' CHECK (deck_scope = 'FLASHCARD_ONLY'),
  status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED'
    CHECK (status IN ('DRAFT', 'REVIEW_REQUIRED', 'VALIDATED_STRUCTURE', 'EXPERT_REVIEWED', 'PUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_fc_domain_level ON wb_flashcard_deck_items (domain_id, level_en, level_zh);

-- 4. User Flashcard SRS Scheduling (SM-2, per user)
CREATE TABLE IF NOT EXISTS wb_user_flashcard_srs (
  user_id TEXT NOT NULL,
  flashcard_id TEXT NOT NULL REFERENCES wb_flashcard_deck_items(id) ON DELETE CASCADE,
  known_state TEXT NOT NULL DEFAULT 'NEW' CHECK (known_state IN ('NEW', 'LEARNING', 'KNOWN', 'REVIEW_AGAIN')),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT,
  last_reviewed_at TEXT,
  PRIMARY KEY (user_id, flashcard_id)
);
CREATE INDEX IF NOT EXISTS idx_wb_fc_srs_due ON wb_user_flashcard_srs (user_id, next_review_at);

-- 5. My Mistakes (Real learner mistakes only — never seeded with fake data)
CREATE TABLE IF NOT EXISTS wb_user_mistakes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('vocabulary', 'grammar', 'reading', 'listening', 'writing', 'pronunciation', 'speaking', 'exercises', 'assessments', 'lessons')),
  source_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'zh', 'en-zh')),
  prompt_excerpt TEXT NOT NULL,
  user_answer TEXT,
  expected_answer TEXT,
  explanation_vi TEXT,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  resolved INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_mistakes_user_open ON wb_user_mistakes (user_id, resolved, last_seen_at DESC);

-- 6. Practice Insights Sessions (Real activity log — drives stats/trends)
CREATE TABLE IF NOT EXISTS wb_user_practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('listening', 'speaking', 'reading', 'writing', 'pronunciation', 'grammar', 'exercises', 'assessments', 'lessons', 'flashcard', 'course')),
  source_id TEXT NOT NULL,
  title TEXT,
  language TEXT NOT NULL,
  domain_id INTEGER,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  score REAL,
  max_score REAL,
  completed INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_sessions_user_time ON wb_user_practice_sessions (user_id, created_at DESC);

-- 7. Audio Asset Bindings (Links Listening/Pronunciation/Speaking records to R2 bucket 'word')
CREATE TABLE IF NOT EXISTS wb_audio_asset_bindings (
  binding_id TEXT PRIMARY KEY,
  module TEXT NOT NULL CHECK (module IN ('listening', 'pronunciation', 'speaking')),
  source_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'zh')),
  asset_status TEXT NOT NULL DEFAULT 'TEXT_SCRIPT_ONLY' CHECK (asset_status IN ('TEXT_SCRIPT_ONLY', 'AUDIO_READY', 'TTS_VERIFIED')),
  audio_url TEXT,
  r2_object_key TEXT NOT NULL,
  duration_seconds INTEGER,
  allow_playback_button INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module, source_id)
);

-- 8. User Writing Drafts & Submissions (Per-user outline & essay persistence)
CREATE TABLE IF NOT EXISTS wb_user_writing_submissions (
  user_id TEXT NOT NULL,
  writing_id TEXT NOT NULL,
  outline_text TEXT NOT NULL DEFAULT '',
  draft_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, writing_id)
);
CREATE INDEX IF NOT EXISTS idx_wb_writing_user ON wb_user_writing_submissions (user_id, updated_at DESC);

-- 9. User Saved Vocabulary & Specialty Terms (Normalized entryId + domain + term)
CREATE TABLE IF NOT EXISTS wb_user_vocab_bookmarks (
  user_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  term TEXT NOT NULL,
  zh TEXT DEFAULT '',
  pinyin TEXT DEFAULT '',
  ipa TEXT DEFAULT '',
  vi TEXT DEFAULT '',
  domain_id INTEGER NOT NULL DEFAULT 1,
  domain_name TEXT NOT NULL DEFAULT '',
  set_name TEXT NOT NULL DEFAULT 'Học hàng ngày',
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, entry_id)
);
CREATE INDEX IF NOT EXISTS idx_wb_vocab_user_set ON wb_user_vocab_bookmarks (user_id, set_name, saved_at DESC);
