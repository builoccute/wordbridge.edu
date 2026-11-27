-- ============================================================================
-- WORD BRIDGE — Rollback for Migration 20261127_001
-- IMPORTANT: Kept in `migrations/rollbacks/` (OUTSIDE main `migrations/`) so
--            `wrangler d1 migrations apply` NEVER runs this automatically.
-- Safety: Only drops `wb_*` tables created by Migration 20261127_001.
--         Leaves ALL legacy tables (auth, passkeys, RBAC, dictionary) untouched.
-- ============================================================================

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS wb_user_vocab_bookmarks;
DROP TABLE IF EXISTS wb_user_writing_submissions;
DROP TABLE IF EXISTS wb_audio_asset_bindings;
DROP TABLE IF EXISTS wb_user_practice_sessions;
DROP TABLE IF EXISTS wb_user_mistakes;
DROP TABLE IF EXISTS wb_user_flashcard_srs;
DROP TABLE IF EXISTS wb_flashcard_deck_items;
DROP TABLE IF EXISTS wb_user_course_progress;
DROP TABLE IF EXISTS wb_courses;

PRAGMA foreign_keys = ON;
