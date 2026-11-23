-- ============================================================================
-- Migration 0014: WORD BRIDGE V4.2 — Bilingual ZH/EN Scope (Safe Russian Archive)
-- SAFETY RULES:
--   1. NON-DESTRUCTIVE ARCHIVE FIRST. ZERO `DROP TABLE`.
--   2. NEVER deletes user accounts (`wb_accounts`) or personal learning history.
--   3. Safely unpublishes/deactivates Russian (`ru`) catalog items respecting CHECK constraints.
-- Rollback script: database/rollbacks/0014_v42_rollback.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Create non-destructive archive tables for Russian catalog records
CREATE TABLE IF NOT EXISTS wb_archive_ru_languages (
  code TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active INTEGER NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_archive_ru_programs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  language_code TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_archive_ru_dictionary (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  language_code TEXT NOT NULL,
  headword TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_archive_ru_reader_documents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  language_code TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Snapshot current Russian catalog state before deactivating
INSERT OR IGNORE INTO wb_archive_ru_languages (code, name_vi, native_name, is_active)
SELECT code, name_vi, native_name, is_active
FROM wb_languages WHERE code = 'ru';

INSERT OR IGNORE INTO wb_archive_ru_programs (id, slug, language_code, name_vi, previous_status)
SELECT id, slug, language_code, name_vi, review_status
FROM wb_programs WHERE language_code = 'ru';

INSERT OR IGNORE INTO wb_archive_ru_dictionary (id, slug, language_code, headword, previous_status)
SELECT id, slug, language_code, headword, review_status
FROM wb_dictionary_entries WHERE language_code = 'ru';

INSERT OR IGNORE INTO wb_archive_ru_reader_documents (id, slug, language_code, title_vi, previous_status)
SELECT id, slug, language_code, title_vi, review_status
FROM wb_reader_documents WHERE language_code = 'ru';

-- 3. Safely deactivate Russian from active public product (NO DELETE, NO DROP TABLE)
UPDATE wb_languages
SET is_active = 0
WHERE code = 'ru';

UPDATE wb_programs
SET review_status = 'archived'
WHERE language_code = 'ru' AND review_status != 'archived';

UPDATE wb_courses
SET review_status = 'archived'
WHERE language_code = 'ru' AND review_status != 'archived';

UPDATE wb_lessons
SET review_status = 'archived'
WHERE language_code = 'ru' AND review_status != 'archived';

UPDATE wb_dictionary_entries
SET review_status = 'draft'
WHERE language_code = 'ru' AND review_status = 'published';

UPDATE wb_reader_documents
SET review_status = 'archived'
WHERE language_code = 'ru' AND review_status != 'archived';

UPDATE wb_practice_exercises
SET is_public_preview = 0
WHERE language_code = 'ru';

-- 4. Update platform config metadata for bilingual scope
INSERT OR REPLACE INTO wb_platform_config (config_key, config_value, description_vi, updated_at) VALUES
  ('product.languages', 'zh,en', 'Phạm vi ngôn ngữ công khai chính thức (Trung – Anh)', datetime('now')),
  ('product.public_admin_enabled', 'false', 'Tắt hoàn toàn cổng quản trị công khai trên website', datetime('now'));
