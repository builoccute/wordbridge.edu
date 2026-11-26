-- ============================================================================
-- WORD BRIDGE — Rollback for Migration 001
-- Only drops newly added wb_* tables; leaves all legacy tables untouched.
-- ============================================================================

DROP TABLE IF EXISTS wb_audio_asset_bindings;
DROP TABLE IF EXISTS wb_user_practice_sessions;
DROP TABLE IF EXISTS wb_user_mistakes;
DROP TABLE IF EXISTS wb_user_flashcard_srs;
DROP TABLE IF EXISTS wb_flashcard_deck_items;
DROP TABLE IF EXISTS wb_user_course_progress;
DROP TABLE IF EXISTS wb_courses;
