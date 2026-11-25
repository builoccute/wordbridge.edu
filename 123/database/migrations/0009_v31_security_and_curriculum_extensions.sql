-- ============================================================================
-- Migration 0009: V3.1 Security, OAuth States, WebAuthn Challenges,
-- Webhook Replay Protection, Lesson Answer Persistence & 15 Intelligence Admin
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'microsoft', 'apple')),
  nonce TEXT NOT NULL,
  redirect_path TEXT NOT NULL DEFAULT '/my-learning',
  account_id TEXT REFERENCES wb_accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_webauthn_challenges (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES wb_accounts(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL UNIQUE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_verified INTEGER NOT NULL DEFAULT 1 CHECK (signature_verified = 1),
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_lesson_submissions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES wb_lessons(id) ON DELETE CASCADE,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN (
    'opened', 'in_progress', 'content_completed', 'submitted', 'graded', 'passed'
  )),
  answers_json TEXT NOT NULL DEFAULT '{}',
  breakdown_json TEXT NOT NULL DEFAULT '[]',
  score REAL,
  max_score REAL,
  score_percent REAL,
  skills_assessed_json TEXT NOT NULL DEFAULT '[]',
  improvement_notes_vi TEXT DEFAULT '',
  next_recommendation_vi TEXT DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_lesson_sub_acc ON wb_lesson_submissions(account_id, lesson_id, submitted_at);

CREATE TABLE IF NOT EXISTS wb_intelligence_status (
  system_slug TEXT PRIMARY KEY,
  operational_status TEXT NOT NULL DEFAULT 'active' CHECK (operational_status IN (
    'active', 'unconfigured', 'paused', 'error', 'not_implemented'
  )),
  ai_adapter_required INTEGER NOT NULL DEFAULT 0,
  admin_note_vi TEXT DEFAULT '',
  updated_by TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
