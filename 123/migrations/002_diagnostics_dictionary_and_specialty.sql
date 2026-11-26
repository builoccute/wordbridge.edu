-- ============================================================================
-- WORD BRIDGE — Diagnostic Queries for Known Production Bugs
-- Run on Cloudflare D1 (`npx wrangler d1 execute word --remote --file=...`)
-- ============================================================================

-- BUG 1: "Hiển thị 0 / 0 mục từ công bố" in Multilingual Dictionary
-- Root-cause checklist:
--   (a) Status filter mismatch: records imported with status = 'REVIEW_REQUIRED'
--       or 'DRAFT' while API filters strictly WHERE status = 'PUBLISHED' (or 'published').
--   (b) Case-sensitivity / whitespace mismatch in status or language columns.
--   (c) Empty join with domains/specialties table when domain is stored as integer vs name.
-- Inspect actual tables and status distribution first:
SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;

-- Example diagnostic (adapt table name to actual dictionary table in src/index.js):
-- SELECT status, COUNT(*) AS cnt FROM dictionary_entries GROUP BY status;
-- SELECT language, COUNT(*) AS cnt FROM dictionary_entries GROUP BY language;

-- BUG 2: "Thiếu entryId hoặc thông tin thuật ngữ chuyên ngành (domain, term)"
-- Root-cause checklist:
--   When saving a specialty term to My Vocabulary, frontend sends payload missing
--   `entryId` (or sends `id` while API expects `entryId`, or sends integer `domain`
--   without resolving `term`/`domain_name`).
--   Fix in API handler & frontend adapter:
--     const entryId = body.entryId || body.id || body.vocab_id;
--     const term = body.term || body.en || body.zh;
--     const domain = body.domain || body.specialty_vi || String(body.domain_id || '');
--   Validate non-empty (entryId || (domain && term)) and return 400 with clear field names.
