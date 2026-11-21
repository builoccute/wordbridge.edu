/**
 * WORD BRIDGE — Dictionary & Personal Vocabulary / SRS Pages (Section 8.3)
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { OFFICIAL_LANGUAGES } from '../config/constants.js';
import { escapeHtml, normalizeLanguageCode } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

export async function renderDictionaryPage({ services, user, url, languageSlug = '' }) {
  const q = url.searchParams.get('q') || '';
  const level = url.searchParams.get('level') || '';
  const domain = url.searchParams.get('domain') || '';
  const langCode = languageSlug ? normalizeLanguageCode(languageSlug) : (url.searchParams.get('language') || '');

  if (languageSlug && !langCode) {
    return htmlResponse(renderPublicPage({
      title: 'Từ điển không hỗ trợ',
      currentPath: `/dictionary/${languageSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">WORD BRIDGE chỉ hỗ trợ từ điển Tiếng Trung, Tiếng Anh và Tiếng Nga.</div>',
    }), 404);
  }

  let res = { entries: [], total: 0 };
  try {
    res = await services.dictionary.search({ q, language: langCode, level, domain, limit: 36 });
  } catch {
    res = { entries: [], total: 0 };
  }
  if (!res.entries || !res.entries.length) {
    const builtin = [
      { id: 'd1', slug: 'bill-of-lading', language_code: 'en', headword: 'Bill of Lading (B/L)', phonetic: '/bɪl əv ˈleɪdɪŋ/', part_of_speech: 'noun', level_ref: 'B2', specialized_domain: 'logistics', meaning_vi: 'Vận đơn đường biển — chứng từ sở hữu hàng hóa và hợp đồng vận tải.', attribution_label: 'WORD BRIDGE Specialized Corpus' },
      { id: 'd2', slug: 'demurrage', language_code: 'en', headword: 'Demurrage', phonetic: '/dɪˈmʌrɪdʒ/', part_of_speech: 'noun', level_ref: 'C1', specialized_domain: 'logistics', meaning_vi: 'Phí lưu bãi container quá thời hạn miễn phí tại cảng.', attribution_label: 'WORD BRIDGE Specialized Corpus' },
      { id: 'd3', slug: 'xinyongzheng', language_code: 'zh', headword: '信用证', phonetic: 'xìnyòngzhèng', part_of_speech: 'noun', level_ref: 'HSK 5', specialized_domain: 'import-export', meaning_vi: 'Thư tín dụng (L/C) trong thanh toán xuất nhập khẩu.', attribution_label: 'WORD BRIDGE Specialized Corpus' },
      { id: 'd4', slug: 'buke-kangli', language_code: 'zh', headword: '不可抗力', phonetic: 'bùkě kànglì', part_of_speech: 'noun', level_ref: 'HSK 5', specialized_domain: 'business', meaning_vi: 'Điều khoản bất khả kháng (Force Majeure) trong hợp đồng.', attribution_label: 'WORD BRIDGE Specialized Corpus' },
      { id: 'd5', slug: 'gongcha', language_code: 'zh', headword: '公差', phonetic: 'gōngchā', part_of_speech: 'noun', level_ref: 'HSK 5', specialized_domain: 'mechanical-engineering', meaning_vi: 'Dung sai kỹ thuật trên bản vẽ cơ khí.', attribution_label: 'WORD BRIDGE Specialized Corpus' },
      { id: 'd6', slug: 'russkiy-yazyk', language_code: 'ru', headword: 'русский язык', phonetic: '/ˈruskʲɪj jɪˈzɨk/', part_of_speech: 'phrase', level_ref: 'A1', specialized_domain: '', meaning_vi: 'Tiếng Nga (ngôn ngữ Nga tổng quát).', attribution_label: 'WORD BRIDGE General Corpus' },
    ];
    res.entries = builtin.filter((it) => (!langCode || it.language_code === langCode) && (!q || it.headword.toLowerCase().includes(q.toLowerCase()) || it.meaning_vi.toLowerCase().includes(q.toLowerCase())));
    res.total = res.entries.length;
  }
  const langLabel = langCode ? OFFICIAL_LANGUAGES[langCode]?.nameVi : 'Đa ngôn ngữ (Trung – Anh – Nga)';

  const contentHtml = `
    <h1>Từ điển ${escapeHtml(langLabel)}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả</a>
      <a href="/dictionary/chinese" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Trung (zh)</a>
      <a href="/dictionary/english" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Anh (en)</a>
      <a href="/dictionary/russian" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Nga (ru)</a>
      <a href="/vocabulary/notebook" class="wb-btn wb-btn-primary wb-btn-sm">Sổ từ vựng cá nhân</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost wb-btn-sm">Flashcard</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-ghost wb-btn-sm">Ôn tập SRS</a>
    </div>

    <form method="GET" action="${languageSlug ? `/dictionary/${escapeHtml(languageSlug)}` : '/dictionary'}" class="wb-card" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input class="wb-input" style="flex:1;min-width:220px;" name="q" value="${escapeHtml(q)}" placeholder="Tìm theo từ gốc, Pinyin/IPA, nghĩa tiếng Việt, ví dụ..." />
      <input class="wb-input" style="width:160px;" name="level" value="${escapeHtml(level)}" placeholder="Trình độ (HSK 1, A1...)" />
      <button type="submit" class="wb-btn wb-btn-primary">Tra cứu</button>
    </form>

    <p class="wb-muted">Hiển thị ${res.entries.length} / ${res.total} mục từ công bố (chỉ sử dụng dữ liệu tự biên soạn & nguồn được cấp phép hợp pháp).</p>
    <div class="wb-grid-3">
      ${res.entries.map((e) => `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <span class="wb-badge">${escapeHtml(e.language_code.toUpperCase())} · ${escapeHtml(e.level_ref)}</span>
            ${e.specialized_domain ? `<span class="wb-badge wb-badge-ok">${escapeHtml(e.specialized_domain)}</span>` : ''}
          </div>
          <h3 style="margin:10px 0 4px;"><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[e.language_code].slug)}/${escapeHtml(e.slug)}">${escapeHtml(e.headword)}</a></h3>
          <div style="margin-bottom:6px;"><span class="wb-phonetic">${escapeHtml(e.phonetic)}</span> <span class="wb-muted" style="font-size:0.84rem;">${escapeHtml(e.part_of_speech)}</span></div>
          <p style="margin:0 0 12px;">${escapeHtml(e.meaning_vi)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[e.language_code].slug)}/${escapeHtml(e.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Chi tiết mục từ</a>
            ${user ? `<button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-save-vocab="${escapeHtml(e.id)}">+ Lưu sổ từ</button>` : '<a href="https://portal.wordbridge.io.vn/login" class="wb-btn wb-btn-ghost wb-btn-sm">Đăng nhập để lưu</a>'}
          </div>
        </article>`).join('') || '<div class="wb-alert wb-alert-info">Không tìm thấy mục từ phù hợp với từ khóa.</div>'}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: `Từ điển ${langLabel}`,
    currentPath: languageSlug ? `/dictionary/${languageSlug}` : '/dictionary',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Từ điển', href: '/dictionary' }, ...(languageSlug ? [{ label: langLabel }] : [])],
    user,
    contentHtml,
  }));
}

export async function renderDictionaryEntryPage({ services, user, languageSlug, entrySlug }) {
  const entry = await services.dictionary.getEntry(languageSlug, entrySlug);
  if (!entry) {
    return htmlResponse(renderPublicPage({
      title: 'Không tìm thấy mục từ',
      currentPath: `/dictionary/${languageSlug}/${entrySlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">Mục từ không tồn tại trong kho từ điển đã công bố.</div>',
    }), 404);
  }
  const examples = JSON.parse(entry.examples_json || '[]');
  const lang = OFFICIAL_LANGUAGES[entry.language_code];

  const contentHtml = `
    <div class="wb-card">
      <span class="wb-badge">${escapeHtml(lang.nameVi)} · ${escapeHtml(entry.level_ref)} · ${escapeHtml(entry.part_of_speech)}</span>
      <div class="wb-headword" style="margin-top:10px;">${escapeHtml(entry.headword)}</div>
      <div style="margin:8px 0 14px;">
        <span class="wb-phonetic">${escapeHtml(entry.phonetic)}</span>
        ${entry.tone_pattern ? `<span class="wb-badge" style="margin-left:6px;">Thanh điệu: ${escapeHtml(entry.tone_pattern)}</span>` : ''}
        ${entry.stress_pattern ? `<span class="wb-badge" style="margin-left:6px;">Trọng âm: ${escapeHtml(entry.stress_pattern)}</span>` : ''}
        ${entry.noun_gender ? `<span class="wb-badge" style="margin-left:6px;">Giống: ${escapeHtml(entry.noun_gender)}</span>` : ''}
      </div>
      <p><strong>Nghĩa tiếng Việt:</strong> ${escapeHtml(entry.meaning_vi)}</p>
      <p><strong>Định nghĩa ngôn ngữ đích:</strong> ${escapeHtml(entry.target_definition)}</p>
      ${entry.radicals_or_structure ? `<p><strong>Cấu tạo chữ / Bộ thủ:</strong> ${escapeHtml(entry.radicals_or_structure)}</p>` : ''}
      <h3>Ví dụ ứng dụng</h3>
      <ul>
        ${examples.map((ex) => `<li><strong>${escapeHtml(ex.text)}</strong> — ${escapeHtml(ex.vi || '')}</li>`).join('')}
      </ul>
      <p class="wb-muted" style="font-size:0.84rem;margin-top:14px;">Nguồn bản quyền: ${escapeHtml(entry.source_name || 'WORD BRIDGE')} (${escapeHtml(entry.license_terms || '')}) · Phiên bản ${escapeHtml(entry.data_version)}</p>
      <div style="margin-top:14px;">
        ${user ? `<button type="button" class="wb-btn wb-btn-primary" data-save-vocab="${escapeHtml(entry.id)}">Lưu vào Sổ từ vựng cá nhân</button>` : '<a href="https://portal.wordbridge.io.vn/login" class="wb-btn wb-btn-primary">Đăng nhập để lưu từ & luyện Flashcard</a>'}
      </div>
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: `${entry.headword} — Từ điển ${lang.nameVi}`,
    currentPath: `/dictionary/${lang.slug}/${entry.slug}`,
    breadcrumbs: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Từ điển', href: '/dictionary' },
      { label: lang.nameVi, href: `/dictionary/${lang.slug}` },
      { label: entry.headword },
    ],
    user,
    contentHtml,
  }));
}

export async function renderVocabularyPage({ db, user, mode = 'notebook' }) {
  if (!user) return redirectResponse('https://portal.wordbridge.io.vn/login');
  const items = (await db.prepare(`
    SELECT n.*, d.headword, d.phonetic, d.meaning_vi, d.language_code, d.slug
    FROM wb_vocabulary_notebook n
    JOIN wb_dictionary_entries d ON d.id = n.entry_id
    WHERE n.account_id = ?
    ORDER BY n.next_review_at ASC
  `).bind(user.accountId).all()).results || [];

  const titles = {
    notebook: 'Sổ từ vựng cá nhân',
    sets: 'Bộ từ vựng cá nhân',
    flashcards: 'Luyện Flashcard',
    review: 'Ôn tập từ vựng ngắt quãng (SM-2)',
  };

  const contentHtml = `
    <h1>${titles[mode] || titles.notebook}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/vocabulary/notebook" class="wb-btn wb-btn-outline wb-btn-sm">Sổ từ vựng</a>
      <a href="/vocabulary/sets" class="wb-btn wb-btn-outline wb-btn-sm">Bộ từ vựng</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-outline wb-btn-sm">Flashcard</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-primary wb-btn-sm">Ôn tập SRS</a>
    </div>
    ${items.length
      ? `<div class="wb-grid-2">${items.map((it) => `
          <article class="wb-card">
            <span class="wb-badge">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(it.mastery_status)} · Chu kỳ ${it.interval_days} ngày</span>
            <h3 style="margin-top:8px;">${escapeHtml(it.headword)} <span class="wb-phonetic">${escapeHtml(it.phonetic)}</span></h3>
            <p>${escapeHtml(it.meaning_vi)}</p>
            <form data-api-endpoint="/api/v1/vocabulary/review" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <input type="hidden" name="notebookItemId" value="${escapeHtml(it.id)}" />
              <select name="quality" class="wb-select" style="width:auto;">
                <option value="5">Nhớ rất rõ (5)</option>
                <option value="4">Nhớ tốt (4)</option>
                <option value="3">Nhớ chậm (3)</option>
                <option value="1">Quên — ôn lại (1)</option>
              </select>
              <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Cập nhật SRS</button>
              <div data-form-status></div>
            </form>
          </article>`).join('')}</div>`
      : '<div class="wb-alert wb-alert-info">Sổ từ vựng của bạn đang trống. Hãy tra cứu và lưu mục từ tại <a href="/dictionary">/dictionary</a>.</div>'}
  `;

  return htmlResponse(renderPublicPage({
    title: titles[mode] || titles.notebook,
    currentPath: `/vocabulary/${mode}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Từ điển', href: '/dictionary' }, { label: titles[mode] }],
    user,
    contentHtml,
  }));
}
