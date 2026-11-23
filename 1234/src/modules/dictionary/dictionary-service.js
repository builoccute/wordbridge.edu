/**
 * WORD BRIDGE V4 — Dictionary, Vocabulary Sets, Notebook & SM-2 Spaced Repetition Service
 * - Single Knowledge Object linking Dictionary <-> Specialized Datasets <-> Notebook <-> Flashcard <-> Review <-> My Knowledge
 * - Strict SM-2 validation (422 on invalid quality), optimistic concurrency (409 on stale review), honest DB failure (503)
 * - Strict account_id ownership on all personal vocabulary operations
 */

import { generateId } from '../../utils/crypto.js';
import { normalizeLanguageCode, assertOfficialLanguage } from '../../utils/validation.js';

export function memoryState(item) {
  if (!item) return 'new';
  const reps = Number(item.repetitions || 0);
  if (item.mastery_status === 'mastered' && reps >= 4) return 'mastered';
  if (reps >= 2 || item.mastery_status === 'reviewing') return 'reviewing';
  if (reps >= 1 || item.mastery_status === 'learning') return 'learning';
  return 'new';
}

export class DictionaryService {
  constructor(db) {
    this.db = db;
  }

  async search({ q = '', language = '', level = '', pos = '', topic = '', domain = '', limit = 30, offset = 0 } = {}) {
    const clauses = ["review_status = 'published'", "language_code IN ('zh', 'en')"];
    const params = [];

    if (language) {
      const normLang = normalizeLanguageCode(language);
      if (!normLang) {
        return { entries: [], total: 0, error: 'Ngôn ngữ tra cứu chỉ hỗ trợ Tiếng Trung (zh) và Tiếng Anh (en).' };
      }
      clauses.push('language_code = ?');
      params.push(normLang);
    }
    if (level) {
      clauses.push('level_ref = ?');
      params.push(level);
    }
    if (pos) {
      clauses.push('part_of_speech LIKE ?');
      params.push(`%${pos}%`);
    }
    if (topic) {
      clauses.push('topic LIKE ?');
      params.push(`%${topic}%`);
    }
    if (domain) {
      clauses.push('specialized_domain = ?');
      params.push(domain);
    }
    if (q && q.trim()) {
      const like = `%${q.trim().toLowerCase()}%`;
      clauses.push(`(
        LOWER(headword) LIKE ? OR
        LOWER(normalized_headword) LIKE ? OR
        LOWER(phonetic) LIKE ? OR
        LOWER(COALESCE(ipa_or_pinyin, '')) LIKE ? OR
        LOWER(meaning_vi) LIKE ? OR
        LOWER(target_definition) LIKE ? OR
        LOWER(examples_json) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const whereSql = clauses.join(' AND ');
    const countRow = await this.db
      .prepare(`SELECT COUNT(*) AS total FROM wb_dictionary_entries WHERE ${whereSql}`)
      .bind(...params)
      .first();

    const rows = await this.db
      .prepare(`
        SELECT id, language_code, slug, headword, phonetic, ipa_or_pinyin, tone_pattern,
               stress_pattern, part_of_speech, noun_gender, meaning_vi, target_definition,
               topic, level_ref, specialized_domain, audio_asset_id, collocations_json,
               synonyms_json, antonyms_json, examples_json
        FROM wb_dictionary_entries
        WHERE ${whereSql}
        ORDER BY CASE WHEN LOWER(headword) = LOWER(?) THEN 0 ELSE 1 END, headword ASC
        LIMIT ? OFFSET ?
      `)
      .bind(...params, q.trim(), Math.min(Number(limit) || 30, 100), Number(offset) || 0)
      .all();

    return {
      entries: rows.results || [],
      total: countRow?.total || 0,
    };
  }

  async getEntry(languageInput, entrySlug) {
    const lang = normalizeLanguageCode(languageInput);
    if (!lang) return null;
    const entry = await this.db
      .prepare(`
        SELECT d.*, s.source_name, s.source_url, s.license_terms, s.attribution_text
        FROM wb_dictionary_entries d
        LEFT JOIN wb_vocabulary_sources s ON s.id = d.source_id
        WHERE d.language_code = ? AND d.slug = ?
      `)
      .bind(lang, entrySlug)
      .first();
    if (!entry) return null;

    const related = await this.db
      .prepare(`
        SELECT slug, headword, phonetic, meaning_vi, level_ref
        FROM wb_dictionary_entries
        WHERE language_code = ? AND topic = ? AND id != ?
        LIMIT 6
      `)
      .bind(lang, entry.topic, entry.id)
      .all();

    return { ...entry, related: related.results || [] };
  }

  /**
   * Ensure a specialized term from the 12 published JSON datasets has a canonical Knowledge Object
   * in wb_dictionary_entries so Dictionary, Notebook, Flashcard, Review, and My Knowledge share one source of truth.
   */
  async ensureSpecializedEntry({ domain, termNumber, wordObj, domainLanguage = 'en' }) {
    const lang = normalizeLanguageCode(domainLanguage) || 'en';
    const safeDomain = String(domain).replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const num = Number(termNumber);
    const entryId = `spec_${safeDomain}_${num}`;
    const slug = `term-${safeDomain}-${num}`;

    const existing = await this.db
      .prepare('SELECT id, slug FROM wb_dictionary_entries WHERE id = ? OR (language_code = ? AND slug = ?)')
      .bind(entryId, lang, slug)
      .first();
    if (existing) return existing.id;

    const headword = String(wordObj.w || '').trim();
    const phonetic = String(wordObj.i || '').trim() || '-';
    const pos = String(wordObj.p || 'term').trim();
    const meaningVi = String(wordObj.m || '').trim();
    const topic = String(wordObj.t || safeDomain).trim();

    await this.db
      .prepare(`
        INSERT OR IGNORE INTO wb_dictionary_entries (
          id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin,
          part_of_speech, meaning_vi, target_definition, topic, level_ref,
          specialized_domain, review_status, data_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Specialized', ?, 'published', '4.0.0')
      `)
      .bind(
        entryId, lang, slug, headword, headword.toLowerCase(), phonetic, phonetic,
        pos, meaningVi, `${headword} (${topic})`, topic, safeDomain
      )
      .run();

    return entryId;
  }

  async saveToNotebook(accountId, payload = {}, { resolveSpecializedTerm } = {}) {
    let entryId = payload.entryId;
    const setId = payload.setId || null;
    const groupName = String(payload.groupName || 'Mặc định').trim().slice(0, 80);
    const tags = Array.isArray(payload.tags) ? payload.tags : [];
    const personalNote = String(payload.personalNote || '').trim().slice(0, 1000);

    // Support direct save of specialized dataset terms: { domain: 'cat-got-kim-loai', term: 1 }
    if (!entryId && payload.domain && payload.term != null && typeof resolveSpecializedTerm === 'function') {
      const resolved = await resolveSpecializedTerm(payload.domain, Number(payload.term));
      if (!resolved) {
        return { ok: false, status: 404, error: 'Không tìm thấy thuật ngữ chuyên ngành yêu cầu.' };
      }
      entryId = await this.ensureSpecializedEntry({
        domain: payload.domain,
        termNumber: Number(payload.term),
        wordObj: resolved.word,
        domainLanguage: resolved.language || 'en',
      });
    }

    if (!entryId) {
      return { ok: false, status: 400, error: 'Thiếu entryId hoặc thông tin thuật ngữ chuyên ngành (domain, term).' };
    }

    const entry = await this.db.prepare('SELECT id FROM wb_dictionary_entries WHERE id = ?').bind(entryId).first();
    if (!entry) return { ok: false, status: 404, error: 'Mục từ không tồn tại.' };

    if (setId) {
      const setRow = await this.db.prepare('SELECT id FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?').bind(setId, accountId).first();
      if (!setRow) return { ok: false, status: 403, error: 'Bộ từ vựng không tồn tại hoặc không thuộc tài khoản của bạn.' };
    }

    const existing = await this.db
      .prepare('SELECT id FROM wb_vocabulary_notebook WHERE account_id = ? AND entry_id = ?')
      .bind(accountId, entryId)
      .first();

    if (existing) {
      await this.db
        .prepare('UPDATE wb_vocabulary_notebook SET group_name = ?, tags_json = ?, personal_note = ?, set_id = COALESCE(?, set_id) WHERE id = ?')
        .bind(groupName, JSON.stringify(tags), personalNote, setId, existing.id)
        .run();
      return { ok: true, id: existing.id, entryId, updated: true };
    }

    const id = generateId('nb');
    await this.db
      .prepare(`
        INSERT INTO wb_vocabulary_notebook (id, account_id, entry_id, set_id, group_name, tags_json, personal_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, accountId, entryId, setId, groupName, JSON.stringify(tags), personalNote)
      .run();
    return { ok: true, id, entryId, updated: false };
  }

  async updateNotebookItem(accountId, notebookItemId, { setId, groupName, tags, personalNote } = {}) {
    const existing = await this.db
      .prepare('SELECT * FROM wb_vocabulary_notebook WHERE id = ? AND account_id = ?')
      .bind(notebookItemId, accountId)
      .first();
    if (!existing) return { ok: false, status: 404, error: 'Không tìm thấy mục từ trong sổ cá nhân.' };

    if (setId) {
      const setRow = await this.db.prepare('SELECT id FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?').bind(setId, accountId).first();
      if (!setRow) return { ok: false, status: 403, error: 'Bộ từ vựng không thuộc tài khoản của bạn.' };
    }

    await this.db
      .prepare(`
        UPDATE wb_vocabulary_notebook
        SET set_id = ?, group_name = ?, tags_json = ?, personal_note = ?
        WHERE id = ? AND account_id = ?
      `)
      .bind(
        setId !== undefined ? (setId || null) : existing.set_id,
        groupName !== undefined ? String(groupName).trim().slice(0, 80) : existing.group_name,
        tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : existing.tags_json,
        personalNote !== undefined ? String(personalNote).trim().slice(0, 1000) : existing.personal_note,
        notebookItemId,
        accountId
      )
      .run();

    return { ok: true, id: notebookItemId };
  }

  async listSets(accountId) {
    const rows = await this.db
      .prepare(`
        SELECT s.*, COUNT(n.id) AS card_count,
               SUM(CASE WHEN datetime(n.next_review_at) <= datetime('now') THEN 1 ELSE 0 END) AS due_count
        FROM wb_vocabulary_sets s
        LEFT JOIN wb_vocabulary_notebook n ON n.set_id = s.id AND n.account_id = s.account_id
        WHERE s.account_id = ?
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `)
      .bind(accountId)
      .all();
    return rows.results || [];
  }

  async createSet(accountId, { title, description = '', languageCode = 'en' } = {}) {
    const cleanTitle = String(title || '').trim().slice(0, 120);
    if (!cleanTitle) return { ok: false, status: 422, error: 'Tên bộ thẻ Flashcard không được để trống.' };
    let lang;
    try {
      lang = assertOfficialLanguage(languageCode);
    } catch (err) {
      return { ok: false, status: 400, error: err.message };
    }
    const id = generateId('vset');
    await this.db
      .prepare('INSERT INTO wb_vocabulary_sets (id, account_id, language_code, title, description) VALUES (?, ?, ?, ?, ?)')
      .bind(id, accountId, lang, cleanTitle, String(description || '').trim().slice(0, 500))
      .run();
    return { ok: true, id, title: cleanTitle, languageCode: lang };
  }

  async updateSet(accountId, setId, { title, description } = {}) {
    const existing = await this.db.prepare('SELECT * FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?').bind(setId, accountId).first();
    if (!existing) return { ok: false, status: 404, error: 'Không tìm thấy bộ thẻ thuộc tài khoản của bạn.' };
    const cleanTitle = title !== undefined ? String(title).trim().slice(0, 120) : existing.title;
    if (!cleanTitle) return { ok: false, status: 422, error: 'Tên bộ thẻ không được để trống.' };
    const cleanDesc = description !== undefined ? String(description).trim().slice(0, 500) : existing.description;
    await this.db
      .prepare("UPDATE wb_vocabulary_sets SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND account_id = ?")
      .bind(cleanTitle, cleanDesc, setId, accountId)
      .run();
    return { ok: true, id: setId, title: cleanTitle };
  }

  async deleteSet(accountId, setId) {
    const existing = await this.db.prepare('SELECT id FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?').bind(setId, accountId).first();
    if (!existing) return { ok: false, status: 404, error: 'Không tìm thấy bộ thẻ thuộc tài khoản của bạn.' };
    await this.db.prepare('DELETE FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?').bind(setId, accountId).run();
    return { ok: true };
  }

  async reviewFlashcard(accountId, notebookItemId, quality, { expectedReview } = {}) {
    // Strict SM-2 quality validation: integer 0..5 ONLY
    const rawQ = Number(quality);
    if (!Number.isInteger(rawQ) || rawQ < 0 || rawQ > 5) {
      return { ok: false, status: 422, error: 'Giá trị đánh giá trí nhớ (quality) phải là số nguyên từ 0 đến 5.' };
    }
    const q = rawQ;

    const item = await this.db
      .prepare('SELECT * FROM wb_vocabulary_notebook WHERE id = ? AND account_id = ?')
      .bind(notebookItemId, accountId)
      .first();
    if (!item) return { ok: false, status: 404, error: 'Không tìm thấy mục từ trong sổ cá nhân.' };

    // Optimistic concurrency / stale review conflict detection
    if (expectedReview !== undefined) {
      const currentStamp = String(item.last_reviewed_at || '');
      if (currentStamp !== String(expectedReview || '')) {
        return {
          ok: false,
          status: 409,
          code: 'STALE_REVIEW_CONFLICT',
          error: 'Lượt ôn này đã được cập nhật trước đó. Vui lòng tải lại hàng đợi để tránh ghi đè.',
        };
      }
    }

    let repetitions = item.repetitions || 0;
    let easeFactor = item.ease_factor || 2.5;
    let intervalDays = item.interval_days || 1;

    if (q < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      if (repetitions === 0) intervalDays = 1;
      else if (repetitions === 1) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * easeFactor);
      repetitions += 1;
    }

    easeFactor = Math.max(1.3, Number((easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2)));
    const masteryStatus = repetitions >= 4 ? 'mastered' : repetitions >= 2 ? 'reviewing' : 'learning';

    try {
      await this.db
        .prepare(`
          UPDATE wb_vocabulary_notebook
          SET repetitions = ?, ease_factor = ?, interval_days = ?, mastery_status = ?,
              last_reviewed_at = datetime('now'),
              next_review_at = datetime('now', '+' || ? || ' days')
          WHERE id = ? AND account_id = ?
        `)
        .bind(repetitions, easeFactor, intervalDays, masteryStatus, intervalDays, item.id, accountId)
        .run();
    } catch {
      return {
        ok: false,
        status: 503,
        code: 'STORAGE_UNAVAILABLE',
        error: 'Không thể lưu kết quả ôn tập vào máy chủ lúc này. Kết quả chưa được ghi nhận; hãy thử lại.',
      };
    }

    const updated = await this.db
      .prepare('SELECT last_reviewed_at, next_review_at FROM wb_vocabulary_notebook WHERE id = ?')
      .bind(item.id)
      .first();

    return {
      ok: true,
      repetitions,
      easeFactor,
      intervalDays,
      masteryStatus,
      lastReviewedAt: updated?.last_reviewed_at || null,
      nextReviewAt: updated?.next_review_at || null,
    };
  }
}
