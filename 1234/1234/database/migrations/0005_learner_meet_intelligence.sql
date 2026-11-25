-- ============================================================================
-- Migration 0005: Learner Meet (Operational Metadata ONLY — NO chat, NO files,
-- NO recording, NO screen share) & 15 Language Intelligence Systems
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_learner_meet_sessions (
  id TEXT PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL UNIQUE,
  host_account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  mode TEXT NOT NULL CHECK (mode IN ('one_to_one', 'group')),
  topic_vi TEXT NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants >= 2 AND max_participants <= 8),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  webrtc_provider TEXT NOT NULL DEFAULT 'unconfigured',
  recording_disabled INTEGER NOT NULL DEFAULT 1 CHECK (recording_disabled = 1),
  chat_disabled INTEGER NOT NULL DEFAULT 1 CHECK (chat_disabled = 1),
  screen_share_disabled INTEGER NOT NULL DEFAULT 1 CHECK (screen_share_disabled = 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS wb_learner_meet_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES wb_learner_meet_sessions(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT,
  connection_state TEXT NOT NULL DEFAULT 'joined',
  UNIQUE(session_id, account_id, joined_at)
);

-- 15 Language Intelligence Systems Results & History
CREATE TABLE IF NOT EXISTS wb_intelligence_runs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  system_slug TEXT NOT NULL CHECK (system_slug IN (
    'language-dna', 'language-transfer-lab', 'knowledge-to-language',
    'real-world-simulator', 'language-error-genome', 'meaning-equivalence',
    'language-timeline', 'pronunciation-lab', 'knowledge-graph',
    'personal-corpus', 'context-reconstruction', 'comprehension-depth',
    'learning-recovery', 'language-quality', 'language-observatory'
  )),
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  input_json TEXT NOT NULL,
  output_json TEXT NOT NULL,
  methodology_note TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('deterministic_data', 'rule_based_heuristic', 'pending_external_ai')),
  technical_limits TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'blocked_provider', 'failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (NOT (system_slug = 'knowledge-to-language' AND language_code = 'ru'))
);

CREATE INDEX IF NOT EXISTS idx_wb_intel_account_sys ON wb_intelligence_runs(account_id, system_slug, created_at);
