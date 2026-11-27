-- ============================================================================
-- WORD BRIDGE — Read-Only Diagnostic Queries for Production D1 (`word`)
-- IMPORTANT: Kept in `migrations/diagnostics/` (OUTSIDE main `migrations/`).
-- Run manually ONLY after backing up D1:
--   npx wrangler d1 export word --remote --output=backup_word.sql
--   npx wrangler d1 execute word --remote --file=migrations/diagnostics/002_diagnostics_dictionary_and_specialty.sql
-- ============================================================================

-- 1. Inspect existing tables & indexes (do NOT guess table names)
SELECT name, type FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY type, name;

-- 2. Check Cloudflare D1 migration history (prevent migration name collision)
SELECT * FROM d1_migrations ORDER BY id DESC LIMIT 20;

-- 3. Template diagnostics for BUG 1 ("Hiển thị 0 / 0 mục từ công bố")
--    Uncomment and replace <DICT_TABLE> with the exact table name from Step 1:
-- SELECT status, COUNT(*) AS cnt FROM <DICT_TABLE> GROUP BY status;
-- SELECT language, COUNT(*) AS cnt FROM <DICT_TABLE> GROUP BY language;
-- SELECT COUNT(*) AS total_rows FROM <DICT_TABLE>;
