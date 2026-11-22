/**
 * WORD BRIDGE — Dictionary, Vocabulary Notebook & SM-2 Spaced Repetition Service
 * Section 26–30 Compliance
 */

import { generateId } from '../../utils/crypto.js';
import { normalizeLanguageCode } from '../../utils/http.js';

export function memoryState(item, now=Date.now()) {
  const raw=String(item.next_review_at || '');
  const dueAt=Date.parse(/^\d{4}-\d\d-\d\d \d\d:/.test(raw) ? raw.replace(' ','T')+'Z' : raw);
  if (Number.isFinite(dueAt) && dueAt<=now) return 'Review Due';
  if (item.mastery_status==='mastered' && item.repetitions>=4) return 'Mastered';
  if (item.repetitions>=2) return 'Recognized';
  return item.last_reviewed_at || item.repetitions>0 ? 'Learning' : 'New';
}

export class DictionaryService {
  constructor(db) {
    this.db = db;
  }

  async search({ q = '', language = '', level = '', pos = '', topic = '', domain = '', limit = 30, offset = 0 } = {}) {
    const clauses = ["review_status = 'published'"];
    const params = [];

    if (language) {
      const normLang = normalizeLanguageCode(language);
      if (!normLang) {
        return { entries: [], total: 0, error: 'Ngôn ngữ tra cứu không thuộc phạm vi Trung – Anh – Nga.' };
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
               topic, level_ref, specialized_domain, audio_asset_id
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
        WHERE d.language_code = ? AND d.slug = ? AND d.review_status='published'
      `)
      .bind(lang, entrySlug)
      .first();
    if (!entry) return null;

    const related = await this.db
      .prepare(`
        SELECT slug, headword, phonetic, meaning_vi, level_ref
        FROM wb_dictionary_entries
        WHERE language_code = ? AND topic = ? AND id != ? AND review_status='published'
        LIMIT 6
      `)
      .bind(lang, entry.topic, entry.id)
      .all();

    return { ...entry, related: related.results || [] };
  }

  async saveToNotebook(accountId, { entryId, setId = null, groupName = 'Mặc định', tags = [], personalNote = '' }) {
    const entry = await this.db.prepare("SELECT id FROM wb_dictionary_entries WHERE id = ? AND review_status='published'").bind(entryId).first();
    if (!entry) return { ok: false, status: 404, error: 'Mục từ không tồn tại.' };

    const existing = await this.db
      .prepare('SELECT id FROM wb_vocabulary_notebook WHERE account_id = ? AND entry_id = ?')
      .bind(accountId, entryId)
      .first();

    if (setId && !await this.db.prepare('SELECT id FROM wb_vocabulary_sets WHERE id=? AND account_id=?').bind(setId,accountId).first()) return {ok:false,status:404,error:'Không tìm thấy bộ từ.'};
    if (existing && !setId && !personalNote && !tags.length && groupName === 'Mặc định') return {ok:true,id:existing.id,updated:false};
    if (existing) {
      await this.db
        .prepare('UPDATE wb_vocabulary_notebook SET group_name = ?, tags_json = ?, personal_note = ?, set_id = ? WHERE id = ?')
        .bind(groupName, JSON.stringify(tags), personalNote, setId, existing.id)
        .run();
      return { ok: true, id: existing.id, updated: true };
    }

    const id = generateId('nb');
    await this.db
      .prepare(`
        INSERT INTO wb_vocabulary_notebook (id, account_id, entry_id, set_id, group_name, tags_json, personal_note)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(account_id,entry_id) DO NOTHING
      `)
      .bind(id, accountId, entryId, setId, groupName, JSON.stringify(tags), personalNote)
      .run();
    const stored=await this.db.prepare('SELECT id FROM wb_vocabulary_notebook WHERE account_id=? AND entry_id=?').bind(accountId,entryId).first();
    if (!stored) return {ok:false,status:503,error:'Không thể lưu mục từ.'};
    return { ok:true,id:stored.id,updated:false };
  }

  async reviewFlashcard(accountId, notebookItemId, quality, expectedReview) {
    // SM-2 Spaced Repetition Algorithm (quality 0..5)
    const q = Number(quality);
    if (quality == null || quality === '' || !Number.isInteger(q) || q < 0 || q > 5) return { ok:false, status:422, error:'Đánh giá không hợp lệ.' };
    const item = await this.db
      .prepare('SELECT * FROM wb_vocabulary_notebook WHERE id = ? AND account_id = ?')
      .bind(notebookItemId, accountId)
      .first();
    if (!item) return { ok: false, status: 404, error: 'Không tìm thấy mục từ trong sổ cá nhân.' };

    if (expectedReview !== undefined && expectedReview !== (item.last_reviewed_at || '')) return {ok:false,status:409,error:'Thẻ đã được cập nhật. Hãy tải lại.'};
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

    const saved = await this.db
      .prepare(`
        UPDATE wb_vocabulary_notebook
        SET repetitions = ?, ease_factor = ?, interval_days = ?, mastery_status = ?,
            last_reviewed_at = strftime('%Y-%m-%d %H:%M:%f','now'),
            next_review_at = datetime('now', '+' || ? || ' days')
        WHERE id = ? AND account_id = ? AND repetitions = ? AND last_reviewed_at IS ?
      `)
      .bind(repetitions, easeFactor, intervalDays, masteryStatus, intervalDays, item.id, accountId, item.repetitions, item.last_reviewed_at)
      .run();

    if (saved.success === false || saved.meta?.changes === 0) return { ok:false, status:409, error:'Không thể cập nhật thẻ. Hãy tải lại.' };
    return { ok: true, repetitions, easeFactor, intervalDays, masteryStatus };
  }
}
