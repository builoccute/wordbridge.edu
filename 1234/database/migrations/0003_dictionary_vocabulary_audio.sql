-- ============================================================================
-- Migration 0003: Dictionary, Vocabulary Sources, Personal Vocabulary Notebook,
-- Flashcard Sets, Spaced Repetition (SRS) & Audio Metadata (R2-backed)
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_vocabulary_sources (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  owner_org TEXT NOT NULL,
  license_terms TEXT NOT NULL,
  allowed_scope TEXT NOT NULL,
  attribution_text TEXT NOT NULL,
  accessed_date TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified_open', 'original_word_bridge', 'pending_license', 'restricted_no_copy')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_dictionary_entries (
  id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  slug TEXT NOT NULL,
  headword TEXT NOT NULL,
  normalized_headword TEXT NOT NULL,
  phonetic TEXT NOT NULL,
  ipa_or_pinyin TEXT,
  tone_pattern TEXT,
  stress_pattern TEXT,
  part_of_speech TEXT NOT NULL,
  noun_gender TEXT,
  inflections_json TEXT DEFAULT '{}',
  meaning_vi TEXT NOT NULL,
  target_definition TEXT NOT NULL,
  contextual_meanings_json TEXT DEFAULT '[]',
  examples_json TEXT NOT NULL DEFAULT '[]',
  synonyms_json TEXT DEFAULT '[]',
  antonyms_json TEXT DEFAULT '[]',
  word_family_json TEXT DEFAULT '[]',
  collocations_json TEXT DEFAULT '[]',
  idioms_json TEXT DEFAULT '[]',
  radicals_or_structure TEXT,
  register TEXT DEFAULT 'neutral',
  topic TEXT DEFAULT 'general',
  level_ref TEXT NOT NULL,
  specialized_domain TEXT,
  audio_asset_id TEXT,
  source_id TEXT REFERENCES wb_vocabulary_sources(id),
  editorial_note TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'approved', 'published')),
  data_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(language_code, slug),
  CHECK (NOT (specialized_domain IS NOT NULL AND language_code = 'ru'))
);

CREATE INDEX IF NOT EXISTS idx_wb_dict_lang_norm ON wb_dictionary_entries(language_code, normalized_headword);
CREATE INDEX IF NOT EXISTS idx_wb_dict_topic_level ON wb_dictionary_entries(language_code, level_ref, topic);

CREATE TABLE IF NOT EXISTS wb_audio_assets (
  id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  r2_object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  voice_label TEXT NOT NULL,
  accent_variant TEXT,
  transcript_text TEXT,
  sync_segments_json TEXT DEFAULT '[]',
  copyright_status TEXT NOT NULL DEFAULT 'original_word_bridge',
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'approved', 'published')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_vocabulary_sets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_vocabulary_notebook (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL REFERENCES wb_dictionary_entries(id) ON DELETE CASCADE,
  set_id TEXT REFERENCES wb_vocabulary_sets(id) ON DELETE SET NULL,
  group_name TEXT DEFAULT 'Mặc định',
  tags_json TEXT DEFAULT '[]',
  personal_note TEXT DEFAULT '',
  mastery_status TEXT NOT NULL DEFAULT 'new' CHECK (mastery_status IN ('new', 'learning', 'reviewing', 'mastered')),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_wb_notebook_review ON wb_vocabulary_notebook(account_id, next_review_at);

CREATE TABLE IF NOT EXISTS wb_grammar_topics (
  id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES wb_languages(code),
  slug TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  level_ref TEXT NOT NULL,
  explanation_vi TEXT NOT NULL,
  structure_formula TEXT NOT NULL,
  examples_json TEXT NOT NULL,
  common_errors_json TEXT DEFAULT '[]',
  review_status TEXT NOT NULL DEFAULT 'published',
  UNIQUE(language_code, slug)
);
