/**
 * WORD BRIDGE V4 — Dictionary, Vocabulary Sets, 6-Mode Flashcard & SM-2 Review Pages
 * - Auth Gate enforced on interactive search/audio/save actions
 * - Single Knowledge Object linking Dictionary, Specialized Terms, Notebook, Flashcards & Review
 * - 6 Study Modes: recognition, reverse, listening, collocation, context, specialized
 * - Honest SM-2 due queue + real backend memory statistics
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { OFFICIAL_LANGUAGES, signInUrl } from '../config/constants.js';
import { memoryState } from '../modules/dictionary/dictionary-service.js';
import { escapeHtml, normalizeLanguageCode } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

function safeJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function renderDictionaryPage({ services, user, url, languageSlug = '' }) {
  const q = (url.searchParams.get('q') || '').trim();
  const level = (url.searchParams.get('level') || '').trim();
  const domain = (url.searchParams.get('domain') || '').trim();
  const locale = url.searchParams.get('locale') || '';
  const langCode = languageSlug ? normalizeLanguageCode(languageSlug) : (url.searchParams.get('language') || '');

  // Auth Gate: interactive dictionary lookup requires sign-in with safe return URL
  if (!user && (q || level || domain)) {
    const returnPath = `${url.pathname}${url.search}`;
    return redirectResponse(signInUrl(returnPath, 'dictionary.search', locale));
  }

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

  const langLabel = langCode ? OFFICIAL_LANGUAGES[langCode]?.nameVi : 'Đa ngôn ngữ (Trung – Anh – Nga)';
  const currentPath = languageSlug ? `/dictionary/${languageSlug}` : '/dictionary';

  const contentHtml = `
    <h1>Từ điển ${escapeHtml(langLabel)}</h1>
    <p class="wb-muted">Dictionary = tra cứu · My Vocabulary = dữ liệu cá nhân · Flashcard = phương pháp luyện · Review = lịch ôn SRS.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả</a>
      <a href="/dictionary/chinese" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Trung (zh)</a>
      <a href="/dictionary/english" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Anh (en)</a>
      <a href="/dictionary/russian" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Nga (ru)</a>
      <a href="/vocabulary/notebook" class="wb-btn wb-btn-primary wb-btn-sm">Sổ từ vựng cá nhân</a>
      <a href="/vocabulary/sets" class="wb-btn wb-btn-ghost wb-btn-sm">Bộ từ vựng</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost wb-btn-sm">Flashcard</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-ghost wb-btn-sm">Ôn tập SRS</a>
    </div>

    <form method="GET" action="${escapeHtml(currentPath)}" class="wb-card" ${user ? '' : 'data-auth-intent="dictionary.search"'} style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input class="wb-input" style="flex:1;min-width:220px;" name="q" value="${escapeHtml(q)}" placeholder="Tìm theo từ gốc, Pinyin/IPA, nghĩa tiếng Việt, ví dụ..." />
      <input class="wb-input" style="width:160px;" name="level" value="${escapeHtml(level)}" placeholder="Trình độ (HSK 1, A1...)" />
      <button type="submit" class="wb-btn wb-btn-primary">Tra cứu</button>
    </form>

    <p class="wb-muted">Hiển thị ${res.entries.length} / ${res.total} mục từ công bố.</p>
    <div class="wb-grid-3">
      ${res.entries.map((e) => {
        const entryHref = `/dictionary/${OFFICIAL_LANGUAGES[e.language_code].slug}/${e.slug}`;
        return `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <span class="wb-badge">${escapeHtml(e.language_code.toUpperCase())} · ${escapeHtml(e.level_ref)}</span>
            ${e.specialized_domain ? `<span class="wb-badge wb-badge-ok">${escapeHtml(e.specialized_domain)}</span>` : ''}
          </div>
          <h3 style="margin:10px 0 4px;"><a href="${escapeHtml(entryHref)}" data-learning-content>${escapeHtml(e.headword)}</a></h3>
          <div style="margin-bottom:6px;"><span class="wb-phonetic">${escapeHtml(e.phonetic)}</span> <span class="wb-muted" style="font-size:0.84rem;">${escapeHtml(e.part_of_speech)}</span></div>
          <p style="margin:0 0 12px;" data-learning-content>${escapeHtml(e.meaning_vi)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="${escapeHtml(entryHref)}" class="wb-btn wb-btn-outline wb-btn-sm">Chi tiết mục từ</a>
            ${user
              ? `<button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-save-vocab="${escapeHtml(e.id)}">+ Lưu sổ từ</button>
                 <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${escapeHtml(e.headword)}" data-wb-lang="${escapeHtml(e.language_code)}">Nghe phát âm</button>`
              : `<a href="${escapeHtml(signInUrl(entryHref, 'dictionary.save'))}" class="wb-btn wb-btn-ghost wb-btn-sm">Đăng nhập để lưu</a>`}
          </div>
        </article>`;
      }).join('') || '<div class="wb-alert wb-alert-info">Không tìm thấy mục từ phù hợp với từ khóa.</div>'}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: `Từ điển ${langLabel}`,
    currentPath,
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
  const examples = safeJsonArray(entry.examples_json);
  const collocations = safeJsonArray(entry.collocations_json);
  const synonyms = safeJsonArray(entry.synonyms_json);
  const antonyms = safeJsonArray(entry.antonyms_json);
  const lang = OFFICIAL_LANGUAGES[entry.language_code];
  const entryPath = `/dictionary/${lang.slug}/${entry.slug}`;

  const contentHtml = `
    <div class="wb-card">
      <span class="wb-badge">${escapeHtml(lang.nameVi)} · ${escapeHtml(entry.level_ref)} · ${escapeHtml(entry.part_of_speech)}</span>
      ${entry.specialized_domain ? `<span class="wb-badge wb-badge-ok" style="margin-left:6px;">${escapeHtml(entry.specialized_domain)}</span>` : ''}
      <div class="wb-headword" style="margin-top:10px;" data-learning-content>${escapeHtml(entry.headword)}</div>
      <div style="margin:8px 0 14px;">
        <span class="wb-phonetic">${escapeHtml(entry.phonetic)}</span>
        ${entry.ipa_or_pinyin && entry.ipa_or_pinyin !== entry.phonetic ? `<span class="wb-badge" style="margin-left:6px;">IPA/Pinyin: ${escapeHtml(entry.ipa_or_pinyin)}</span>` : ''}
        ${entry.tone_pattern ? `<span class="wb-badge" style="margin-left:6px;">Thanh điệu: ${escapeHtml(entry.tone_pattern)}</span>` : ''}
        ${entry.stress_pattern ? `<span class="wb-badge" style="margin-left:6px;">Trọng âm: ${escapeHtml(entry.stress_pattern)}</span>` : ''}
        ${entry.noun_gender ? `<span class="wb-badge" style="margin-left:6px;">Giống: ${escapeHtml(entry.noun_gender)}</span>` : ''}
      </div>
      <p><strong>Nghĩa tiếng Việt:</strong> <span data-learning-content>${escapeHtml(entry.meaning_vi)}</span></p>
      <p><strong>Định nghĩa ngôn ngữ đích:</strong> <span data-learning-content>${escapeHtml(entry.target_definition)}</span></p>
      ${entry.radicals_or_structure ? `<p><strong>Cấu tạo chữ / Bộ thủ:</strong> ${escapeHtml(entry.radicals_or_structure)}</p>` : ''}
      ${collocations.length ? `<p><strong>Collocations:</strong> ${collocations.map((c) => `<span class="wb-badge" style="margin:2px;">${escapeHtml(typeof c === 'string' ? c : c.text || '')}</span>`).join('')}</p>` : ''}
      ${synonyms.length ? `<p><strong>Từ đồng nghĩa:</strong> ${escapeHtml(synonyms.join(', '))}</p>` : ''}
      ${antonyms.length ? `<p><strong>Từ trái nghĩa:</strong> ${escapeHtml(antonyms.join(', '))}</p>` : ''}
      ${examples.length ? `<h3>Ví dụ ứng dụng</h3><ul>${examples.map((ex) => `<li><strong data-learning-content>${escapeHtml(ex.text || ex)}</strong>${ex.vi ? ` — ${escapeHtml(ex.vi)}` : ''}</li>`).join('')}</ul>` : ''}
      <p class="wb-muted" style="font-size:0.84rem;margin-top:14px;">Nguồn bản quyền: ${escapeHtml(entry.source_name || 'WORD BRIDGE')} (${escapeHtml(entry.license_terms || 'Original')}) · Phiên bản ${escapeHtml(entry.data_version || '4.0.0')}</p>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        ${user
          ? `<button type="button" class="wb-btn wb-btn-primary" data-save-vocab="${escapeHtml(entry.id)}">Lưu vào Sổ từ vựng cá nhân</button>
             ${entry.audio_asset_id ? `<audio controls preload="none" src="/api/v1/audio/${escapeHtml(entry.audio_asset_id)}/stream"></audio>` : ''}
             <button type="button" class="wb-btn wb-btn-outline" data-wb-tts="${escapeHtml(entry.headword)}" data-wb-lang="${escapeHtml(entry.language_code)}">Nghe phát âm</button>
             <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost">Mở Flashcard</a>`
          : `<a href="${escapeHtml(signInUrl(entryPath, 'dictionary.study'))}" class="wb-btn wb-btn-primary">Đăng nhập để nghe phát âm & lưu Flashcard</a>`}
      </div>
    </div>
    ${entry.related?.length ? `
      <section style="margin-top:20px;">
        <h2>Từ liên quan</h2>
        <div class="wb-grid-3">${entry.related.map((r) => `<article class="wb-card"><h3><a href="/dictionary/${escapeHtml(lang.slug)}/${escapeHtml(r.slug)}">${escapeHtml(r.headword)}</a></h3><p class="wb-muted">${escapeHtml(r.phonetic)} · ${escapeHtml(r.meaning_vi)}</p></article>`).join('')}</div>
      </section>` : ''}
  `;

  return htmlResponse(renderPublicPage({
    title: `${entry.headword} — Từ điển ${lang.nameVi}`,
    currentPath: entryPath,
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

const STUDY_MODES = Object.freeze([
  { id: 'recognition', label: 'Recognition', desc: 'Nhìn từ, nhớ nghĩa' },
  { id: 'reverse', label: 'Reverse Recall', desc: 'Nhìn nghĩa, nhớ từ gốc' },
  { id: 'listening', label: 'Listening', desc: 'Nghe từ, nhận diện nghĩa' },
  { id: 'collocation', label: 'Collocation', desc: 'Học theo kết hợp từ' },
  { id: 'context', label: 'Context', desc: 'Nhận diện trong ngữ cảnh' },
  { id: 'specialized', label: 'Specialized', desc: 'Thuật ngữ chuyên ngành' },
]);

function filterCardsForStudyMode(items, studyMode) {
  switch (studyMode) {
    case 'specialized':
      return items.filter((it) => Boolean(it.specialized_domain));
    case 'collocation':
      return items.filter((it) => safeJsonArray(it.collocations_json).length > 0);
    case 'context':
      return items.filter((it) => safeJsonArray(it.examples_json).length > 0);
    case 'listening':
      return items.filter((it) => Boolean(it.audio_asset_id || it.phonetic));
    default:
      return items;
  }
}

export async function renderVocabularyPage({ db, user, mode = 'notebook', url = null }) {
  const currentPath = `/vocabulary/${mode}`;
  if (!user) return redirectResponse(signInUrl(currentPath, `vocabulary.${mode}`));

  const studyMode = url?.searchParams?.get('mode') || 'recognition';
  const filterSet = url?.searchParams?.get('set') || '';
  const filterStatus = url?.searchParams?.get('status') || '';
  const filterQ = (url?.searchParams?.get('q') || '').trim().toLowerCase();

  const [allItemsRes, setsRes] = await Promise.all([
    db.prepare(`
      SELECT n.*, d.headword, d.phonetic, d.ipa_or_pinyin, d.meaning_vi, d.target_definition,
             d.language_code, d.slug, d.level_ref, d.topic, d.specialized_domain,
             d.part_of_speech, d.audio_asset_id, d.collocations_json, d.examples_json
      FROM wb_vocabulary_notebook n
      JOIN wb_dictionary_entries d ON d.id = n.entry_id
      WHERE n.account_id = ?
      ORDER BY n.next_review_at ASC, n.created_at DESC
    `).bind(user.accountId).all(),
    db.prepare(`
      SELECT s.*, COUNT(n.id) AS card_count
      FROM wb_vocabulary_sets s
      LEFT JOIN wb_vocabulary_notebook n ON n.set_id = s.id AND n.account_id = s.account_id
      WHERE s.account_id = ?
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `).bind(user.accountId).all(),
  ]);

  const allItems = allItemsRes.results || [];
  const sets = setsRes.results || [];
  const nowMs = Date.now();

  // Real backend memory metrics
  const stats = {
    total: allItems.length,
    newCount: allItems.filter((it) => memoryState(it) === 'new').length,
    learning: allItems.filter((it) => memoryState(it) === 'learning').length,
    reviewing: allItems.filter((it) => memoryState(it) === 'reviewing').length,
    mastered: allItems.filter((it) => memoryState(it) === 'mastered').length,
    due: allItems.filter((it) => new Date(it.next_review_at).getTime() <= nowMs).length,
    overdue: allItems.filter((it) => new Date(it.next_review_at).getTime() < nowMs - 86400000).length,
  };

  let items = allItems;
  if (filterSet) items = items.filter((it) => it.set_id === filterSet);
  if (filterStatus) items = items.filter((it) => memoryState(it) === filterStatus);
  if (filterQ) {
    items = items.filter((it) =>
      `${it.headword} ${it.meaning_vi} ${it.phonetic} ${it.topic || ''} ${it.personal_note || ''}`.toLowerCase().includes(filterQ)
    );
  }

  const titles = {
    notebook: 'Sổ từ vựng cá nhân',
    sets: 'Bộ từ vựng cá nhân',
    flashcards: 'Luyện Flashcard thông minh',
    review: 'Ôn tập từ vựng ngắt quãng (SM-2)',
  };

  const navBar = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/vocabulary/notebook" class="wb-btn ${mode === 'notebook' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Sổ từ vựng (${stats.total})</a>
      <a href="/vocabulary/sets" class="wb-btn ${mode === 'sets' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Bộ từ vựng (${sets.length})</a>
      <a href="/vocabulary/flashcards" class="wb-btn ${mode === 'flashcards' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Flashcard</a>
      <a href="/vocabulary/review" class="wb-btn ${mode === 'review' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Ôn tập SRS (${stats.due} đến hạn)</a>
      <a href="/my-knowledge" class="wb-btn wb-btn-ghost wb-btn-sm">My Knowledge</a>
    </div>
    <div class="wb-metric-row" style="margin-bottom:18px;">
      <div><strong>${stats.total}</strong><span>Tổng số từ</span></div>
      <div><strong>${stats.newCount}</strong><span>Từ mới</span></div>
      <div><strong>${stats.learning + stats.reviewing}</strong><span>Đang học / Ôn</span></div>
      <div><strong>${stats.mastered}</strong><span>Đã nhớ (Mastered)</span></div>
      <div><strong>${stats.due}</strong><span>Đến hạn ôn (${stats.overdue} quá hạn)</span></div>
    </div>
  `;

  let bodyHtml = '';

  if (mode === 'sets') {
    bodyHtml = `
      <div class="wb-grid-2">
        <form class="wb-card wb-form" data-api-endpoint="/api/v1/vocabulary/sets" data-redirect-to="/vocabulary/sets">
          <h3 style="margin-top:0;color:var(--wb-teal);">Tạo bộ Flashcard mới</h3>
          <div class="wb-field"><label>Tên bộ thẻ *</label><input class="wb-input" name="title" required placeholder="VD: Thuật ngữ Cơ khí tuần 1" /></div>
          <div class="wb-field"><label>Ngôn ngữ</label><select class="wb-select" name="languageCode"><option value="en">Tiếng Anh (EN)</option><option value="zh">Tiếng Trung (ZH)</option><option value="ru">Tiếng Nga (RU)</option></select></div>
          <div class="wb-field"><label>Mô tả</label><textarea class="wb-textarea" name="description" rows="2" placeholder="Chủ đề, trình độ hoặc mục tiêu ôn tập..."></textarea></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Tạo bộ thẻ</button>
        </form>
        <div class="wb-card">
          <h3 style="margin-top:0;color:var(--wb-teal);">Danh sách bộ thẻ (${sets.length})</h3>
          ${sets.length
            ? sets.map((s) => `
              <div style="border-bottom:1px solid var(--wb-border);padding:10px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                <div>
                  <strong>${escapeHtml(s.title)}</strong> <span class="wb-badge">${escapeHtml(s.language_code.toUpperCase())} · ${Number(s.card_count || 0)} thẻ</span>
                  ${s.description ? `<p class="wb-muted" style="margin:4px 0 0;font-size:0.84rem;">${escapeHtml(s.description)}</p>` : ''}
                </div>
                <div style="display:flex;gap:6px;">
                  <a href="/vocabulary/flashcards?set=${escapeHtml(s.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Học bộ này</a>
                  <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-delete-set="${escapeHtml(s.id)}">Xóa</button>
                </div>
              </div>`).join('')
            : '<p class="wb-muted">Bạn chưa tạo bộ thẻ nào. Tạo bộ thẻ đầu tiên để phân nhóm từ vựng theo chủ đề hoặc chuyên ngành.</p>'}
        </div>
      </div>
    `;
  } else if (mode === 'flashcards' || mode === 'review') {
    const basePool = mode === 'review'
      ? items.filter((it) => new Date(it.next_review_at).getTime() <= nowMs)
      : items;
    const activeDeck = filterCardsForStudyMode(basePool, studyMode);

    // Only show study mode buttons that have supporting evidence in the learner's vocabulary
    const availableModes = STUDY_MODES.filter((m) => m.id === 'recognition' || m.id === 'reverse' || filterCardsForStudyMode(basePool, m.id).length > 0);
    const modeBar = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;" aria-label="Chế độ học Flashcard">
        ${availableModes.map((m) => `<a href="/vocabulary/${mode}?mode=${m.id}${filterSet ? `&set=${encodeURIComponent(filterSet)}` : ''}" class="wb-btn ${studyMode === m.id ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm" title="${escapeHtml(m.desc)}">${escapeHtml(m.label)}</a>`).join('')}
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-shuffle>Xáo trộn</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-restart>Học lại</button>
      </div>
    `;

    if (!activeDeck.length) {
      bodyHtml = `
        ${modeBar}
        <div class="wb-alert wb-alert-info">
          ${mode === 'review'
            ? 'Không có mục đến hạn ôn. Review chỉ hiển thị mục có next_review_at đã đến hạn; không hard-code review due.'
            : 'Chưa có thẻ phù hợp cho chế độ này. Hãy tra cứu và lưu mục từ tại <a href="/dictionary">/dictionary</a> hoặc <a href="/specialized">/specialized</a>.'}
        </div>
      `;
    } else {
      bodyHtml = `
        ${modeBar}
        <p class="wb-muted" style="font-size:0.86rem;">Phím tắt: <strong>Space</strong> lật thẻ · <strong>← / →</strong> chuyển thẻ · <strong>1–4</strong> đánh giá trí nhớ · Vuốt trái/phải trên thiết bị cảm ứng.</p>
        <div data-wb-study-deck data-study-mode="${escapeHtml(studyMode)}" data-total-cards="${activeDeck.length}">
          <div class="wb-muted" data-wb-deck-progress style="margin-bottom:10px;">Thẻ 1 / ${activeDeck.length} · Chế độ: <strong>${escapeHtml(studyMode)}</strong></div>
          ${activeDeck.map((it, idx) => {
            const collocs = safeJsonArray(it.collocations_json);
            const examples = safeJsonArray(it.examples_json);
            let frontPrompt = `<h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p class="wb-phonetic">${escapeHtml(it.phonetic)}</p>`;
            if (studyMode === 'reverse') {
              frontPrompt = `<p class="wb-eyebrow">REVERSE RECALL</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.meaning_vi)}</h2>`;
            } else if (studyMode === 'listening') {
              frontPrompt = `<p class="wb-eyebrow">LISTENING MODE</p><p>Nghe phát âm và nhớ lại từ gốc cùng nghĩa tiếng Việt.</p>`;
            } else if (studyMode === 'collocation') {
              frontPrompt = `<p class="wb-eyebrow">COLLOCATION</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p>${collocs.map((c) => escapeHtml(typeof c === 'string' ? c : c.text || '')).join(' · ')}</p>`;
            } else if (studyMode === 'context') {
              const ex0 = examples[0];
              frontPrompt = `<p class="wb-eyebrow">CONTEXT</p><p data-learning-content>${escapeHtml(typeof ex0 === 'string' ? ex0 : ex0?.text || it.target_definition || it.headword)}</p>`;
            } else if (studyMode === 'specialized') {
              frontPrompt = `<p class="wb-eyebrow">SPECIALIZED · ${escapeHtml(it.specialized_domain || '')}</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p class="wb-phonetic">${escapeHtml(it.phonetic)}</p>`;
            }

            return `
              <article class="wb-card wb-study-surface" data-wb-study-card data-card-index="${idx}" ${idx > 0 ? 'hidden' : ''}>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                  <span class="wb-badge">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(memoryState(it))} · Chu kỳ ${it.interval_days} ngày</span>
                  <div style="display:flex;gap:6px;">
                    ${it.audio_asset_id ? `<audio controls preload="none" src="/api/v1/audio/${escapeHtml(it.audio_asset_id)}/stream" style="height:30px;"></audio>` : ''}
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${escapeHtml(it.headword)}" data-wb-lang="${escapeHtml(it.language_code)}">Nghe phát âm</button>
                  </div>
                </div>
                <div data-wb-front>
                  ${frontPrompt}
                  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-reveal>Lật thẻ — Space</button>
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-prev>Thẻ trước</button>
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-next>Thẻ tiếp theo</button>
                  </div>
                </div>
                <div data-wb-back hidden style="margin-top:14px;padding-top:14px;border-top:1px solid var(--wb-border);">
                  <p><strong>Từ gốc:</strong> <span data-learning-content>${escapeHtml(it.headword)}</span> <span class="wb-phonetic">${escapeHtml(it.phonetic)}</span></p>
                  <p><strong>Nghĩa:</strong> <span data-learning-content>${escapeHtml(it.meaning_vi)}</span></p>
                  ${it.target_definition ? `<p class="wb-muted" data-learning-content>${escapeHtml(it.target_definition)}</p>` : ''}
                  ${it.personal_note ? `<p><strong>Ghi chú cá nhân:</strong> ${escapeHtml(it.personal_note)}</p>` : ''}
                </div>
                <form data-wb-review-form data-api-endpoint="/api/v1/vocabulary/review" hidden style="margin-top:14px;">
                  <input type="hidden" name="notebookItemId" value="${escapeHtml(it.id)}" />
                  <input type="hidden" name="expectedReview" value="${escapeHtml(it.last_reviewed_at || '')}" />
                  <input type="hidden" name="quality" value="4" />
                  <p class="wb-muted" style="font-size:0.84rem;margin:0 0 8px;">Đánh giá trí nhớ — chỉ cập nhật sau khi server xác nhận (phím 1–4):</p>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-grade="1">1 · Chưa nhớ</button>
                    <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-grade="2">2 · Khó</button>
                    <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-grade="4">3 · Nhớ</button>
                    <button type="button" class="wb-btn wb-btn-accent wb-btn-sm" data-wb-grade="5">4 · Rất chắc</button>
                  </div>
                  <div data-form-status style="margin-top:8px;"></div>
                </form>
              </article>`;
          }).join('')}
        </div>
      `;
    }
  } else {
    // Notebook mode: search, filter by set & mastery status, personal notes, delete
    bodyHtml = `
      <form method="GET" action="/vocabulary/notebook" class="wb-card" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;">
        <input class="wb-input" style="flex:1;min-width:180px;" name="q" value="${escapeHtml(filterQ)}" placeholder="Tìm trong sổ từ cá nhân..." />
        <select class="wb-select" name="status" style="width:auto;">
          <option value="">Tất cả trạng thái</option>
          <option value="new" ${filterStatus === 'new' ? 'selected' : ''}>Từ mới</option>
          <option value="learning" ${filterStatus === 'learning' ? 'selected' : ''}>Đang học</option>
          <option value="reviewing" ${filterStatus === 'reviewing' ? 'selected' : ''}>Đang ôn</option>
          <option value="mastered" ${filterStatus === 'mastered' ? 'selected' : ''}>Đã nhớ</option>
        </select>
        ${sets.length ? `<select class="wb-select" name="set" style="width:auto;"><option value="">Tất cả bộ thẻ</option>${sets.map((s) => `<option value="${escapeHtml(s.id)}" ${filterSet === s.id ? 'selected' : ''}>${escapeHtml(s.title)}</option>`).join('')}</select>` : ''}
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Lọc</button>
        <a href="/api/v1/vocabulary/export" class="wb-btn wb-btn-outline wb-btn-sm">Xuất CSV</a>
      </form>
      ${items.length
        ? `<div class="wb-grid-2">${items.map((it) => `
            <article class="wb-card">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                <span class="wb-badge">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(memoryState(it))} · Chu kỳ ${it.interval_days} ngày</span>
                <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-delete-vocab="${escapeHtml(it.id)}">Xóa</button>
              </div>
              <h3 style="margin-top:8px;"><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[it.language_code].slug)}/${escapeHtml(it.slug)}" data-learning-content>${escapeHtml(it.headword)}</a> <span class="wb-phonetic">${escapeHtml(it.phonetic)}</span></h3>
              <p data-learning-content>${escapeHtml(it.meaning_vi)}</p>
              <p class="wb-muted" style="font-size:0.82rem;">Ôn tiếp theo: <time>${escapeHtml(it.next_review_at)}</time> · Lặp lại: ${it.repetitions} · EF: ${it.ease_factor}</p>
            </article>`).join('')}</div>`
        : '<div class="wb-alert wb-alert-info">Sổ từ vựng của bạn đang trống. Hãy tra cứu và lưu mục từ tại <a href="/dictionary">/dictionary</a>.</div>'}
    `;
  }

  return htmlResponse(renderPublicPage({
    title: titles[mode] || titles.notebook,
    currentPath,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Từ điển', href: '/dictionary' }, { label: titles[mode] }],
    user,
    contentHtml: `<h1>${titles[mode] || titles.notebook}</h1>${navBar}${bodyHtml}`,
  }));
}
