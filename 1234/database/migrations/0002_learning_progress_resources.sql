-- Migration 0002: 5 Languages, 4 Practice Tools, Progress, Vocabulary & Resources
CREATE INDEX IF NOT EXISTS idx_exercises_lang_tool ON practice_exercises(language_code, tool_type);
CREATE INDEX IF NOT EXISTS idx_attempts_user_date ON practice_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vocab_user_lang ON vocabulary_items(user_id, language_code);
CREATE INDEX IF NOT EXISTS idx_resources_scope ON resources(access_scope, language_code);
