-- ============================================================================
-- Rollback 0014: Restore archived Russian catalog statuses if ever authorized
-- ============================================================================

PRAGMA foreign_keys = ON;

UPDATE wb_languages
SET is_active = COALESCE(
  (SELECT is_active FROM wb_archive_ru_languages WHERE wb_archive_ru_languages.code = wb_languages.code),
  1
)
WHERE code = 'ru';

UPDATE wb_programs
SET review_status = COALESCE(
  (SELECT previous_status FROM wb_archive_ru_programs WHERE wb_archive_ru_programs.id = wb_programs.id),
  'published'
)
WHERE language_code = 'ru';

UPDATE wb_courses
SET review_status = 'published'
WHERE language_code = 'ru' AND review_status = 'archived';

UPDATE wb_lessons
SET review_status = 'published'
WHERE language_code = 'ru' AND review_status = 'archived';

UPDATE wb_dictionary_entries
SET review_status = COALESCE(
  (SELECT previous_status FROM wb_archive_ru_dictionary WHERE wb_archive_ru_dictionary.id = wb_dictionary_entries.id),
  'published'
)
WHERE language_code = 'ru';

UPDATE wb_reader_documents
SET review_status = COALESCE(
  (SELECT previous_status FROM wb_archive_ru_reader_documents WHERE wb_archive_ru_reader_documents.id = wb_reader_documents.id),
  'published'
)
WHERE language_code = 'ru';

UPDATE wb_practice_exercises
SET is_public_preview = 1
WHERE language_code = 'ru';

INSERT OR REPLACE INTO wb_platform_config (config_key, config_value, description_vi, updated_at) VALUES
  ('product.languages', 'zh,en,ru', 'Khôi phục phạm vi ngôn ngữ ban đầu', datetime('now'));
