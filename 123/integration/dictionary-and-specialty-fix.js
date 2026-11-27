/**
 * WORD BRIDGE — Production Bug Fixes Helper Module
 * Addresses Section X:
 *   1. Dictionary "0 / 0 mục từ công bố" query logic (without blindly mutating REVIEW_REQUIRED -> PUBLISHED)
 *   2. Specialty term save error: "Thiếu entryId hoặc thông tin thuật ngữ chuyên ngành (domain, term)"
 *   3. Stripping internal labels from public UI strings without deleting underlying dictionary data.
 */

/**
 * Fix 1: Build safe dictionary status filter.
 * Root cause in production: imported entries carry status = 'REVIEW_REQUIRED' or 'VALIDATED_STRUCTURE'
 * while legacy SQL queries hard-coded `WHERE status = 'PUBLISHED'`, causing 0 / 0 results.
 * Never mutate REVIEW_REQUIRED -> PUBLISHED in D1 just to hide the issue; instead, allow explicit
 * visibility statuses configured by the application while keeping FLASHCARD_ONLY strictly excluded.
 */
export function buildDictionaryWhereClause({ query = "", domainId = null, allowReviewRequired = true } = {}) {
  const clauses = ["(deck_scope IS NULL OR deck_scope != 'FLASHCARD_ONLY')"];
  const params = [];

  if (allowReviewRequired) {
    clauses.push("UPPER(TRIM(status)) IN ('PUBLISHED', 'EXPERT_REVIEWED', 'VALIDATED_STRUCTURE', 'REVIEW_REQUIRED')");
  } else {
    clauses.push("UPPER(TRIM(status)) = 'PUBLISHED'");
  }

  if (domainId !== null && domainId !== undefined && domainId !== "" && domainId !== "all") {
    clauses.push("domain = ?");
    params.push(Number(domainId));
  }

  const q = String(query || "").trim();
  if (q) {
    clauses.push("(LOWER(en) LIKE ? OR zh LIKE ? OR LOWER(pinyin) LIKE ? OR LOWER(vi) LIKE ?)");
    const like = `%${q.toLowerCase()}%`;
    params.push(like, `%${q}%`, like, like);
  }

  return { whereSql: clauses.join(" AND "), params };
}

/**
 * Fix 2: Normalize save-vocabulary / save-specialty-term payload.
 * Accepts legacy and new field names (`entryId` | `id` | `vocab_id`, `term` | `en` | `zh`,
 * `domain` | `domain_id` | `specialty_vi`) and derives a deterministic fallback entryId when
 * saving a valid specialty (domain + term) pair so the API never falsely rejects valid terms.
 */
export function normalizeSaveVocabPayload(body = {}) {
  const term = String(body.term || body.en || body.zh || "").trim();
  const domainId = body.domain !== undefined && body.domain !== null && body.domain !== ""
    ? Number(body.domain)
    : (body.domain_id !== undefined ? Number(body.domain_id) : 1);
  const domainName = String(body.domainName || body.specialty_vi || (typeof body.domain === "string" ? body.domain : "")).trim();
  let entryId = String(body.entryId || body.id || body.vocab_id || "").trim();

  if (!entryId && term && (domainId || domainName)) {
    const slug = term.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
    entryId = `SPEC-D${domainId || 0}-${slug}`;
  }

  if (!entryId || !term) {
    return {
      valid: false,
      error: "Thiếu entryId hoặc thông tin thuật ngữ chuyên ngành (domain, term)."
    };
  }

  return {
    valid: true,
    entryId,
    term,
    zh: String(body.zh || ""),
    pinyin: String(body.pinyin || ""),
    ipa: String(body.ipa || ""),
    vi: String(body.vi || ""),
    domainId: Number.isFinite(domainId) ? domainId : 1,
    domainName,
    setName: String(body.setName || "Học hàng ngày").trim() || "Học hàng ngày"
  };
}

/**
 * Fix 3: Strip forbidden internal curation labels from public UI text ONLY.
 * Underlying database rows remain 100% intact.
 */
const INTERNAL_LABEL_PATTERNS = [
  /Excel\s*gốc/gi,
  /Biên\s*soạn\s*mở\s*rộng\s*\(\+1\.?000\s*từ\)/gi,
  /Biên\s*soạn\s*mới\s*trong\s*bộ\s*dữ\s*liệu\s*này/gi,
  /Hiển\s*thị\s*0\s*\/\s*0\s*mục\s*từ\s*công\s*bố/gi
];

export function stripInternalUiLabels(text) {
  let out = String(text || "");
  for (const rx of INTERNAL_LABEL_PATTERNS) {
    out = out.replace(rx, "");
  }
  return out.replace(/\s{2,}/g, " ").trim();
}
