/**
 * WORD BRIDGE V4.1 — Real Integrated Reader Library Pages (/reader, /reader/:slug)
 * Backed by D1 (`wb_reader_documents`, `wb_reader_progress`) and optional R2 files.
 * Zero subdomain handoffs; real document reading, vocabulary notes, progress & bookmarks.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

const LANG_LABELS = { zh: 'Tiếng Trung', en: 'Tiếng Anh', ru: 'Tiếng Nga' };
const CAT_LABELS = { general: 'Tổng quát', specialized: 'Chuyên ngành', dialogue: 'Hội thoại', guide: 'Hướng dẫn', grammar: 'Ngữ pháp' };

function safeJson(str, fallback = []) {
  try {
    return JSON.parse(str || '');
  } catch {
    return fallback;
  }
}

export async function renderReaderLibraryPage({ services, user, url, runtime = null }) {
  const language = url?.searchParams?.get('language') || '';
  const category = url?.searchParams?.get('category') || '';
  const q = url?.searchParams?.get('q') || '';

  const docs = await services.reader.listDocuments({ language, category, q });

  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">THƯ VIỆN ĐỌC TÍCH HỢP</span>
      <h1>Thư Viện Đọc Tài Liệu WORD BRIDGE</h1>
      <p>Đọc trực tiếp bài đọc học thuật, hội thoại mẫu và tài liệu ngoại ngữ chuyên ngành (Tiếng Trung, Tiếng Anh, Tiếng Nga) kèm bảng chú giải thuật ngữ và lưu tiến độ đọc cá nhân.</p>
    </section>

    <form method="GET" action="/reader" class="wb-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div class="wb-field" style="margin:0;flex:1;min-width:180px;">
        <label>Tìm kiếm tài liệu</label>
        <input class="wb-input" name="q" value="${escapeHtml(q)}" placeholder="Nhập từ khóa tiêu đề hoặc nội dung..." />
      </div>
      <div class="wb-field" style="margin:0;min-width:150px;">
        <label>Ngôn ngữ</label>
        <select class="wb-select" name="language">
          <option value="">Tất cả ngôn ngữ</option>
          <option value="zh" ${language === 'zh' ? 'selected' : ''}>Tiếng Trung (ZH)</option>
          <option value="en" ${language === 'en' ? 'selected' : ''}>Tiếng Anh (EN)</option>
          <option value="ru" ${language === 'ru' ? 'selected' : ''}>Tiếng Nga (RU)</option>
        </select>
      </div>
      <div class="wb-field" style="margin:0;min-width:150px;">
        <label>Phân loại</label>
        <select class="wb-select" name="category">
          <option value="">Tất cả</option>
          <option value="general" ${category === 'general' ? 'selected' : ''}>Tổng quát</option>
          <option value="specialized" ${category === 'specialized' ? 'selected' : ''}>Chuyên ngành</option>
          <option value="dialogue" ${category === 'dialogue' ? 'selected' : ''}>Hội thoại</option>
          <option value="grammar" ${category === 'grammar' ? 'selected' : ''}>Ngữ pháp</option>
          <option value="guide" ${category === 'guide' ? 'selected' : ''}>Hướng dẫn</option>
        </select>
      </div>
      <button type="submit" class="wb-btn wb-btn-primary">Lọc tài liệu</button>
    </form>

    <div class="wb-grid-2" style="margin-top:16px;">
      ${docs.map((d) => `
        <article class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
              <span class="wb-badge">${escapeHtml(LANG_LABELS[d.language_code] || d.language_code)}</span>
              <span class="wb-badge wb-badge-aqua">${escapeHtml(CAT_LABELS[d.category] || d.category)}</span>
              <span class="wb-badge">${escapeHtml(d.level_ref)}</span>
            </div>
            <h3 style="margin:6px 0;color:var(--wb-teal);">${escapeHtml(d.title_vi)}</h3>
            <p class="wb-muted" style="font-size:0.9rem;">${escapeHtml(d.summary_vi)}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap;">
            <span class="wb-muted" style="font-size:0.82rem;">${Number(d.estimated_minutes || 10)} phút đọc · ${escapeHtml(d.author_name || 'WORD BRIDGE')}</span>
            <a href="/reader/${escapeHtml(d.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Đọc tài liệu</a>
          </div>
        </article>`).join('') || '<div class="wb-card"><p class="wb-muted">Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.</p></div>'}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: 'Thư viện đọc — WORD BRIDGE Reader',
    currentPath: '/reader',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Thư viện đọc' }],
    user,
    runtime,
    contentHtml,
  }));
}

export async function renderReaderDocumentPage({ services, user, slug, runtime = null }) {
  const result = await services.reader.getDocumentBySlug(slug, user?.accountId || null);
  if (!result) {
    return htmlResponse(renderPublicPage({
      title: 'Không tìm thấy tài liệu',
      currentPath: `/reader/${slug}`,
      breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Thư viện đọc', href: '/reader' }, { label: 'Không tìm thấy' }],
      user,
      runtime,
      contentHtml: '<div class="wb-alert wb-alert-error">Tài liệu không tồn tại hoặc chưa được xuất bản.</div><a href="/reader" class="wb-btn wb-btn-outline">Quay lại Thư viện đọc</a>',
    }), 404);
  }

  const { doc, progress } = result;
  const vocabNotes = safeJson(doc.vocabulary_notes_json, []);
  const paragraphs = String(doc.content_text || '').split(/\n{2,}/).filter((p) => p.trim());

  const progressFormHtml = user
    ? `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/reader/progress">
        <h3 style="margin-top:0;color:var(--wb-teal);">Tiến độ đọc & Ghi chú cá nhân</h3>
        <input type="hidden" name="documentId" value="${escapeHtml(doc.id)}" />
        <div class="wb-grid-2">
          <div class="wb-field">
            <label>Mức hoàn thành (%)</label>
            <input class="wb-input" type="number" name="progressPercent" min="0" max="100" value="${Number(progress?.progress_percent || 0)}" />
          </div>
          <div class="wb-field">
            <label>Đánh dấu (Bookmark)</label>
            <select class="wb-select" name="bookmarked">
              <option value="false" ${!progress?.bookmarked ? 'selected' : ''}>Chưa đánh dấu</option>
              <option value="true" ${progress?.bookmarked ? 'selected' : ''}>Đã đánh dấu để đọc lại</option>
            </select>
          </div>
        </div>
        <div class="wb-field">
          <label>Ghi chú cá nhân cho tài liệu này</label>
          <textarea class="wb-input" name="personalNotes" rows="3" placeholder="Ghi lại cấu trúc hay hoặc từ vựng cần ôn...">${escapeHtml(progress?.personal_notes || '')}</textarea>
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Lưu tiến độ & ghi chú</button>
      </form>`
    : `
      <div class="wb-alert wb-alert-info">
        <a href="${escapeHtml(signInUrl(`/reader/${doc.slug}`, 'reader.save'))}">Đăng nhập</a> để lưu tiến độ đọc, đánh dấu tài liệu và ghi chú cá nhân vào tài khoản WORD BRIDGE.
      </div>`;

  const fileAttachmentHtml = doc.r2_object_key
    ? `<div class="wb-alert wb-alert-info" style="margin-bottom:14px;">Tài liệu có tệp đính kèm trong R2: <a href="/api/v1/reader/documents/${escapeHtml(doc.id)}/file" class="wb-btn wb-btn-outline wb-btn-sm" target="_blank" rel="noopener">Mở / Tải tệp đính kèm</a></div>`
    : '';

  const contentHtml = `
    <article class="wb-card">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="wb-badge">${escapeHtml(LANG_LABELS[doc.language_code] || doc.language_code)}</span>
        <span class="wb-badge wb-badge-aqua">${escapeHtml(CAT_LABELS[doc.category] || doc.category)}</span>
        <span class="wb-badge">${escapeHtml(doc.level_ref)}</span>
        <span class="wb-badge">${Number(doc.estimated_minutes || 10)} phút đọc</span>
      </div>
      <h1 style="margin:6px 0;color:var(--wb-teal);">${escapeHtml(doc.title_vi)}</h1>
      ${doc.subtitle_vi ? `<p class="wb-muted" style="margin-top:0;">${escapeHtml(doc.subtitle_vi)}</p>` : ''}
      ${fileAttachmentHtml}
      <div class="wb-reader-body" style="line-height:1.8;font-size:1.03rem;margin-top:16px;">
        ${paragraphs.map((p) => `<p style="white-space:pre-line;margin:0 0 14px;">${escapeHtml(p)}</p>`).join('')}
      </div>
    </article>

    ${vocabNotes.length > 0 ? `
      <section class="wb-card">
        <h3 style="margin-top:0;color:var(--wb-teal);">Chú giải từ vựng & thuật ngữ trọng tâm</h3>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead><tr><th>Thuật ngữ / Cụm từ</th><th>Nghĩa tiếng Việt</th></tr></thead>
            <tbody>
              ${vocabNotes.map((v) => `<tr><td><strong>${escapeHtml(v.term || '')}</strong></td><td>${escapeHtml(v.meaning || '')}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>` : ''}

    ${progressFormHtml}

    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
      <a href="/reader" class="wb-btn wb-btn-outline wb-btn-sm">← Quay lại Thư viện đọc</a>
      <a href="/dictionary" class="wb-btn wb-btn-ghost wb-btn-sm">Tra Từ điển</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost wb-btn-sm">Ôn Flashcards</a>
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: doc.title_vi,
    currentPath: `/reader/${doc.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Thư viện đọc', href: '/reader' }, { label: doc.title_vi }],
    user,
    runtime,
    contentHtml,
  }));
}
