/**
 * WORD BRIDGE V4.1 — Real Integrated Reader Service (/reader)
 * Backed by Cloudflare D1 (`wb_reader_documents`, `wb_reader_progress`) and optional Cloudflare R2 (`reader/*`).
 */

import { generateId } from '../../utils/crypto.js';
import { assertOfficialLanguage, assertSpecializedLanguage } from '../../utils/validation.js';

export class ReaderService {
  constructor(db, r2Service = null) {
    this.db = db;
    this.r2Service = r2Service;
  }

  async listDocuments({ language = '', category = '', q = '', includeDrafts = false } = {}) {
    const clauses = [];
    const params = [];
    if (!includeDrafts) {
      clauses.push("review_status = 'published'");
    }
    if (language && ['zh', 'en', 'ru'].includes(language)) {
      clauses.push('language_code = ?');
      params.push(language);
    }
    if (category && ['general', 'specialized', 'guide', 'grammar', 'dialogue'].includes(category)) {
      clauses.push('category = ?');
      params.push(category);
    }
    if (q) {
      clauses.push('(LOWER(title_vi) LIKE ? OR LOWER(summary_vi) LIKE ? OR LOWER(content_text) LIKE ?)');
      const pat = `%${String(q).trim().toLowerCase()}%`;
      params.push(pat, pat, pat);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await this.db
      .prepare(`SELECT * FROM wb_reader_documents ${where} ORDER BY updated_at DESC, id ASC`)
      .bind(...params)
      .all();
    return res.results || [];
  }

  async getDocumentBySlug(slug, accountId = null) {
    const doc = await this.db
      .prepare("SELECT * FROM wb_reader_documents WHERE slug = ? AND review_status = 'published'")
      .bind(slug)
      .first();
    if (!doc) return null;

    let progress = null;
    if (accountId) {
      progress = await this.db
        .prepare('SELECT * FROM wb_reader_progress WHERE account_id = ? AND document_id = ?')
        .bind(accountId, doc.id)
        .first();
    }
    return { doc, progress };
  }

  async saveProgress(accountId, { documentId, currentSection = 1, progressPercent = 0, bookmarked = false, personalNotes = '' }) {
    if (!documentId) return { ok: false, status: 400, error: 'Thiếu documentId.' };
    const doc = await this.db.prepare("SELECT id FROM wb_reader_documents WHERE id = ? AND review_status = 'published'").bind(documentId).first();
    if (!doc) return { ok: false, status: 404, error: 'Tài liệu không tồn tại.' };

    const safePercent = Math.max(0, Math.min(100, Number(progressPercent) || 0));
    const safeSection = Math.max(1, Number(currentSection) || 1);
    const safeBookmark = bookmarked ? 1 : 0;
    const safeNotes = String(personalNotes || '').slice(0, 4000);

    await this.db
      .prepare(`
        INSERT INTO wb_reader_progress (id, account_id, document_id, current_section, progress_percent, bookmarked, personal_notes, last_read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(account_id, document_id) DO UPDATE SET
          current_section = excluded.current_section,
          progress_percent = excluded.progress_percent,
          bookmarked = excluded.bookmarked,
          personal_notes = excluded.personal_notes,
          last_read_at = datetime('now')
      `)
      .bind(generateId('rpr'), accountId, documentId, safeSection, safePercent, safeBookmark, safeNotes)
      .run();

    return { ok: true, documentId, currentSection: safeSection, progressPercent: safePercent, bookmarked: Boolean(safeBookmark) };
  }

  async createDocument(actor, payload) {
    const titleVi = String(payload.titleVi || '').trim();
    const contentText = String(payload.contentText || '').trim();
    const category = String(payload.category || 'general').trim();
    if (!titleVi || contentText.length < 20) {
      return { ok: false, status: 400, error: 'Tiêu đề và nội dung tài liệu (tối thiểu 20 ký tự) là bắt buộc.' };
    }
    const lang = category === 'specialized'
      ? assertSpecializedLanguage(payload.languageCode || 'en')
      : assertOfficialLanguage(payload.languageCode || 'en');

    const id = generateId('rdoc');
    const rawSlug = String(payload.slug || titleVi)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || id;
    const slug = `${rawSlug}-${id.slice(-4)}`;

    await this.db
      .prepare(`
        INSERT INTO wb_reader_documents (
          id, slug, title_vi, subtitle_vi, language_code, category, specialized_domain_slug,
          level_ref, summary_vi, content_text, vocabulary_notes_json, r2_object_key,
          estimated_minutes, author_name, review_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        slug,
        titleVi,
        String(payload.subtitleVi || '').trim(),
        lang,
        ['general', 'specialized', 'guide', 'grammar', 'dialogue'].includes(category) ? category : 'general',
        payload.specializedDomainSlug || null,
        String(payload.levelRef || 'Cơ bản').trim(),
        String(payload.summaryVi || titleVi).trim(),
        contentText,
        typeof payload.vocabularyNotesJson === 'string' ? payload.vocabularyNotesJson : JSON.stringify(payload.vocabularyNotes || []),
        payload.r2ObjectKey || null,
        Math.max(1, Number(payload.estimatedMinutes || 10)),
        actor.fullName || 'Ban Biên soạn WORD BRIDGE',
        payload.reviewStatus === 'published' ? 'published' : 'draft',
        actor.accountId
      )
      .run();

    return { ok: true, documentId: id, slug };
  }
}
