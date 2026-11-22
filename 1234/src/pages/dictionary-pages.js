import { SPECIALIZED_VOCAB_DOMAINS } from './public-pages.js';
import { memoryState } from '../modules/dictionary/dictionary-service.js';
/**
 * WORD BRIDGE — Dictionary & Personal Vocabulary / SRS Pages (Section 8.3)
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl, OFFICIAL_LANGUAGES } from '../config/constants.js';
import { escapeHtml, normalizeLanguageCode, htmlResponse, redirectResponse } from '../utils/http.js';

function safeJson(value, fallback = []) { try { return JSON.parse(value || ''); } catch { return fallback; } }



export async function renderDictionaryPage({ services, user, url, languageSlug = '' }) {
  const q = url.searchParams.get('q') || '';
  if (!user && [...url.searchParams].some(([key,value]) => key !== 'locale' && value.trim())) return redirectResponse(signInUrl(url.pathname + url.search, 'dictionary.search'));
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

  const res = await services.dictionary.search({q,language:langCode,level,domain,limit:36});
  res.entries = Array.isArray(res.entries) ? res.entries : [];
  res.total = Number(res.total || 0);
  const langLabel = langCode ? OFFICIAL_LANGUAGES[langCode]?.nameVi : 'Đa ngôn ngữ (Trung – Anh – Nga)';

  const contentHtml = `
    <section class="wb-learning-landing"><p class="wb-eyebrow">DICTIONARY · LANGUAGE INTELLIGENCE</p><h1><span>Từ điển</span> <span>${escapeHtml(langLabel)}</span></h1><p>Reference workspace cho meaning, pronunciation, context và bridge sang học tập. Dictionary không phải My Vocabulary hay Flashcard.</p></section>
    <nav class="wb-skill-strip" aria-label="Dictionary languages"><a href="/dictionary" ${!langCode ? 'aria-current="page"' : ''}>Tất cả</a><a href="/dictionary/chinese" ${langCode === 'zh' ? 'aria-current="page"' : ''}>Tiếng Trung</a><a href="/dictionary/english" ${langCode === 'en' ? 'aria-current="page"' : ''}>Tiếng Anh</a><a href="/dictionary/russian" ${langCode === 'ru' ? 'aria-current="page"' : ''}>Tiếng Nga</a></nav>
    <div class="wb-reference-layout"><aside class="wb-reference-filters"><h2>Tra cứu</h2><form method="GET" action="${languageSlug ? `/dictionary/${escapeHtml(languageSlug)}` : '/dictionary'}" class="wb-form" ${user ? '' : 'data-auth-intent="dictionary.search"'}><label class="wb-field"><span>Từ khóa</span><input class="wb-input" type="search" name="q" value="${escapeHtml(q)}" placeholder="Từ gốc, Pinyin/IPA, nghĩa, ví dụ..." /></label><label class="wb-field"><span>Trình độ</span><input class="wb-input" name="level" value="${escapeHtml(level)}" placeholder="HSK 1, A1..." /></label><button type="submit" class="wb-btn wb-btn-primary">Tra cứu</button>${q || level ? `<a href="${languageSlug ? `/dictionary/${escapeHtml(languageSlug)}` : '/dictionary'}" class="wb-btn wb-btn-ghost">Xóa bộ lọc</a>` : ''}</form>${user ? '<hr/><h3>Dữ liệu cá nhân</h3><a href="/vocabulary/notebook">My Vocabulary</a><br/><a href="/vocabulary/flashcards">Flashcard</a><br/><a href="/vocabulary/review">Review</a>' : `<hr/><p class="wb-muted">Tra cứu có tương tác yêu cầu đăng nhập theo quy tắc sign-in-to-do.</p>`}</aside>
      <section class="wb-reference-results" aria-live="polite"><div class="wb-reference-toolbar"><p><strong>${res.total}</strong> mục từ khớp dữ liệu công bố.</p>${user ? '<a href="/my-knowledge" class="wb-btn wb-btn-outline wb-btn-sm">My Knowledge</a>' : ''}</div>
      ${res.entries.length ? `<div class="wb-dictionary-list">${res.entries.map((e) => `<article><div><p class="wb-eyebrow">${escapeHtml(e.language_code.toUpperCase())} · ${escapeHtml(e.level_ref)} · ${escapeHtml(e.part_of_speech)}</p><h2><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[e.language_code].slug)}/${escapeHtml(e.slug)}" data-learning-content>${escapeHtml(e.headword)}</a></h2><p><span class="wb-phonetic">${escapeHtml(e.phonetic)}</span>${e.ipa_or_pinyin ? ` · ${escapeHtml(e.ipa_or_pinyin)}` : ''}</p><p data-learning-content>${escapeHtml(e.meaning_vi)}</p></div><div class="wb-practice-actions"><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[e.language_code].slug)}/${escapeHtml(e.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở entry</a>${user ? `<button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-save-vocab="${escapeHtml(e.id)}">Add to Learning</button>` : `<a href="${signInUrl(url.pathname + url.search,'dictionary.save')}" class="wb-btn wb-btn-ghost wb-btn-sm">Đăng nhập để lưu</a>`}</div></article>`).join('')}</div>` : `<div class="wb-empty-state"><h2>${q ? 'Không tìm thấy mục từ phù hợp' : 'Nhập từ khóa để tra cứu'}</h2><p>${q ? 'Không có dữ liệu giả được tạo để lấp kết quả.' : 'Bạn có thể xem cấu trúc Dictionary công khai; thao tác tra cứu yêu cầu đăng nhập.'}</p><a href="/learning" class="wb-btn wb-btn-outline">Khám phá học tập</a></div>`}</section>
    </div>`;

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
  const personal=user ? await services.dictionary.db.prepare('SELECT * FROM wb_vocabulary_notebook WHERE account_id=? AND entry_id=?').bind(user.accountId,entry.id).first() : null;
  const examples = safeJson(entry.examples_json,[]);
  const lang = OFFICIAL_LANGUAGES[entry.language_code];

  const collocations = safeJson(entry.collocations_json, []);
  const synonyms = safeJson(entry.synonyms_json, []);
  const antonyms = safeJson(entry.antonyms_json, []);
  const forms = safeJson(entry.inflections_json, {});
  const contextual = safeJson(entry.contextual_meanings_json, []);
  const related = Array.isArray(entry.related) ? entry.related : [];
  const list = (value) => Array.isArray(value) && value.length ? `<ul>${value.map((item) => `<li>${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('')}</ul>` : '<p class="wb-muted">Chưa có dữ liệu đã xác minh.</p>';
  const contentHtml = `
    <article class="wb-dictionary-workspace">
      <header class="wb-entry-header"><p class="wb-eyebrow">${escapeHtml(lang.nameVi)} · ${escapeHtml(entry.level_ref)} · ${escapeHtml(entry.part_of_speech)}</p><h1 data-learning-content>${escapeHtml(entry.headword)}</h1><p class="wb-entry-pronunciation"><span class="wb-phonetic">${escapeHtml(entry.phonetic)}</span>${entry.ipa_or_pinyin ? ` <span>${escapeHtml(entry.ipa_or_pinyin)}</span>` : ''}${entry.tone_pattern ? ` · <span>Thanh điệu ${escapeHtml(entry.tone_pattern)}</span>` : ''}${entry.stress_pattern ? ` · <span>Trọng âm ${escapeHtml(entry.stress_pattern)}</span>` : ''}</p><div class="wb-practice-actions">${entry.audio_asset_id && user ? `<audio controls preload="none" src="/api/v1/audio/${encodeURIComponent(entry.audio_asset_id)}/stream"></audio>` : ''}${user ? `<button type="button" class="wb-btn wb-btn-primary" data-save-vocab="${escapeHtml(entry.id)}">Add to Learning</button>` : `<a href="${signInUrl(`/dictionary/${lang.slug}/${entry.slug}`,'dictionary.save')}" class="wb-btn wb-btn-primary">Đăng nhập để Add to Learning</a>`}</div></header>
      ${personal ? `<p><span class="wb-badge">${memoryState(personal)}</span> · <a href="/vocabulary/review">Ôn tập</a> <time>${escapeHtml(personal.next_review_at)}</time></p>` : ''}
      <div class="wb-entry-grid"><section><h2>Meaning & senses</h2><p><strong>Nghĩa tiếng Việt:</strong> ${escapeHtml(entry.meaning_vi)}</p>${entry.target_definition ? `<p><strong>Định nghĩa ngôn ngữ đích:</strong> ${escapeHtml(entry.target_definition)}</p>` : ''}${contextual.length ? `<h3>Contextual meanings</h3>${list(contextual)}` : ''}<p><strong>Register:</strong> ${escapeHtml(entry.register || 'neutral')} · <strong>Topic:</strong> ${escapeHtml(entry.topic || 'general')}</p>${entry.specialized_domain ? `<p><strong>Specialized usage:</strong> ${SPECIALIZED_VOCAB_DOMAINS.some(d=>d.slug===entry.specialized_domain) ? `<a href="/specialized/${encodeURIComponent(entry.specialized_domain)}">${escapeHtml(entry.specialized_domain)}</a>` : escapeHtml(entry.specialized_domain)}</p>` : ''}</section>
      ${examples.length ? `<section><h2>Examples</h2><ul>${examples.map(ex => `<li>${escapeHtml(ex.text || ex.sentence || ex)} ${escapeHtml(ex.vi || '')}</li>`).join('')}</ul></section>` : ''}
      ${[['Collocations',collocations],['Synonyms',synonyms],['Antonyms',antonyms],['Idioms',safeJson(entry.idioms_json,[])],['Word family',safeJson(entry.word_family_json,[])]].filter(([,values])=>values.length).map(([label,values])=>`<section><h2>${label}</h2>${list(values)}</section>`).join('')}
      ${Object.keys(forms||{}).length ? `<section><h2>Word forms</h2><dl>${Object.entries(forms).map(([k,v])=>`<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd>`).join('')}</dl></section>` : ''}
      ${related.length ? `<section><h2>Related knowledge</h2><ul>${related.map(r=>`<li><a href="/dictionary/${lang.slug}/${encodeURIComponent(r.slug)}" data-learning-content>${escapeHtml(r.headword)}</a></li>`).join('')}</ul></section>` : ''}</div>
      <footer class="wb-entry-source"><p><span>Nguồn</span> · ${escapeHtml(entry.source_name || 'WORD BRIDGE')}${entry.license_terms ? ` · ${escapeHtml(entry.license_terms)}` : ''} · <span>Phiên bản</span> ${escapeHtml(entry.data_version)}</p></footer>
    </article>
    <section class="wb-next-action"><h2>Bridge</h2>${user ? '<a href="/vocabulary/flashcards" class="wb-btn wb-btn-primary">Flashcard</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Review</a><a href="/practice/vocabulary" class="wb-btn wb-btn-outline">Practice Vocabulary</a>' : `<a href="${signInUrl(`/dictionary/${lang.slug}/${entry.slug}`,'dictionary.learn')}" class="wb-btn wb-btn-primary">Đăng nhập để học mục từ này</a>`}<a href="/learning/path" class="wb-btn wb-btn-outline">Learning Path</a></section>`;

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

function flashcardPrompt(item, studyMode) {
  const examples = safeJson(item.examples_json, []);
  const collocations = safeJson(item.collocations_json, []);
  const contextual = safeJson(item.contextual_meanings_json, []);
  if (studyMode === 'reverse') return { front: item.meaning_vi, back: `${item.headword}${item.phonetic ? ` · ${item.phonetic}` : ''}`, label: 'Reverse Recall' };
  if (studyMode === 'listening' && item.audio_asset_id) return { front: 'Nghe audio và nhớ lại từ/cụm từ.', back: `${item.headword} · ${item.meaning_vi}`, label: 'Listening', audio: item.audio_asset_id };
  if (studyMode === 'collocation' && collocations.length) return { front: String(collocations[0]), back: `${item.headword} · ${item.meaning_vi}`, label: 'Collocation' };
  if (studyMode === 'context' && (examples.length || contextual.length)) return { front: String(examples[0]?.sentence || examples[0]?.text || contextual[0]?.context || contextual[0]), back: `${item.headword} · ${item.meaning_vi}`, label: 'Context' };
  if (studyMode === 'specialized' && item.specialized_domain) return { front: `${item.headword} · ${item.specialized_domain}`, back: item.meaning_vi, label: 'Specialized' };
  return { front: item.headword, back: `${item.phonetic ? `${item.phonetic} · ` : ''}${item.meaning_vi}`, label: 'Recognition' };
}

export async function renderVocabularyPage({ db, user, mode = 'notebook', url = null }) {
  if (!user) return redirectResponse(signInUrl('/vocabulary/' + mode + (url?.search || ''), 'vocabulary.review'));
  const requestedStudyMode = String(url?.searchParams?.get('mode') || 'recognition').toLowerCase();
  const allowedModes = new Set(['recognition','reverse','listening','collocation','context','specialized']);
  const studyMode = allowedModes.has(requestedStudyMode) ? requestedStudyMode : 'recognition';
  const dueOnly = mode === 'review';
  const items = (await db.prepare(`
    SELECT n.*, d.headword, d.phonetic, d.meaning_vi, d.language_code, d.slug,
           (SELECT a.id FROM wb_audio_assets a WHERE a.id=d.audio_asset_id AND a.review_status='published') AS audio_asset_id, d.examples_json, d.collocations_json, d.contextual_meanings_json, d.specialized_domain
    FROM wb_vocabulary_notebook n
    JOIN wb_dictionary_entries d ON d.id = n.entry_id
    WHERE n.account_id = ? ${dueOnly ? "AND datetime(n.next_review_at) <= datetime('now')" : ''}
    ORDER BY n.next_review_at ASC
  `).bind(user.accountId).all()).results || [];

  const titles = { notebook: 'My Vocabulary', sets: 'Bộ từ vựng cá nhân', flashcards: 'Flashcard', review: 'Review' };
  const isStudy = mode === 'flashcards' || mode === 'review';
  const availableModes = {
    recognition: true,
    reverse: true,
    listening: items.some((it) => it.audio_asset_id),
    collocation: items.some((it) => safeJson(it.collocations_json, []).length),
    context: items.some((it) => safeJson(it.examples_json, []).length || safeJson(it.contextual_meanings_json, []).length),
    specialized: items.some((it) => it.specialized_domain),
  };
  const effectiveStudyMode = availableModes[studyMode] ? studyMode : 'recognition';
  const modeLinks = Object.entries({ recognition:'Recognition', reverse:'Reverse Recall', listening:'Listening', collocation:'Collocation', context:'Context', specialized:'Specialized' })
    .map(([key,label]) => availableModes[key] ? `<a href="/vocabulary/${mode}?mode=${key}" class="wb-chip ${effectiveStudyMode===key?'is-active':''}">${label}</a>` : '').join('');

  const prompts=items.map(it=>({it,prompt:flashcardPrompt(it,effectiveStudyMode)}))
    .filter(({prompt})=>effectiveStudyMode==='recognition' || prompt.label!=='Recognition');
  const studyCards = prompts.map(({it,prompt}, n) => {
    const audio = prompt.audio ? `<audio controls preload="none" src="/api/v1/audio/${encodeURIComponent(prompt.audio)}/stream" aria-label="Audio flashcard"></audio>` : '';
    return `<section class="wb-study-card wb-studio" data-wb-study-card ${n ? 'hidden' : ''} aria-label="Flashcard ${n + 1} / ${prompts.length}">
      <p class="wb-eyebrow"><span>${escapeHtml(prompt.label)}</span> · <span>${escapeHtml(memoryState(it))}</span> · ${n + 1} / ${prompts.length}</p>
      <div class="wb-study-surface" tabindex="0" role="group" aria-label="${escapeHtml(it.headword)}">${audio}<p data-learning-content class="wb-study-prompt" data-wb-front>${escapeHtml(prompt.front)}</p><div data-wb-back hidden><p data-learning-content class="wb-study-answer">${escapeHtml(prompt.back)}</p></div></div>
      <div class="wb-study-controls"><button type="button" class="wb-btn wb-btn-outline" data-wb-reveal aria-expanded="false">Lật thẻ — Space</button><button type="button" class="wb-btn wb-btn-ghost" data-wb-study-prev ${n===0?'disabled':''}>Thẻ trước</button><button type="button" class="wb-btn wb-btn-ghost" data-wb-study-next ${n>=prompts.length-1?'disabled':''}>Thẻ tiếp theo</button></div>
      <form data-api-endpoint="/api/v1/vocabulary/review" data-wb-review-form class="wb-review-rating" hidden><input name="expectedReview" type="hidden" value="${escapeHtml(it.last_reviewed_at || '')}"/><input name="notebookItemId" type="hidden" value="${escapeHtml(it.id)}"/><input name="quality" type="hidden" value="3"/><p>Đánh giá trí nhớ — chỉ cập nhật sau khi server xác nhận.</p><div class="wb-study-controls"><button type="button" data-wb-grade="1" class="wb-btn wb-btn-outline">1 · Chưa nhớ</button><button type="button" data-wb-grade="3" class="wb-btn wb-btn-outline">2 · Khó</button><button type="button" data-wb-grade="4" class="wb-btn wb-btn-outline">3 · Nhớ</button><button type="button" data-wb-grade="5" class="wb-btn wb-btn-primary">4 · Rất chắc</button></div><div data-form-status aria-live="polite"></div></form>
    </section>`;
  }).join('');

  const list = items.map((it) => `<article class="wb-knowledge-row"><div><p class="wb-eyebrow">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(memoryState(it))}</p><h2 data-learning-content>${escapeHtml(it.headword)}</h2><p data-learning-content>${escapeHtml(it.meaning_vi)}</p></div><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[it.language_code].slug)}/${escapeHtml(it.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở Dictionary</a></article>`).join('');
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">MEMORY & KNOWLEDGE</p><h1>${titles[mode] || titles.notebook}</h1><p>Dictionary = tra cứu · My Vocabulary = dữ liệu cá nhân · Flashcard = phương pháp luyện · Review = lịch ôn SRS.</p></section>
    <nav class="wb-filter-strip" aria-label="Vocabulary tools"><a href="/vocabulary/notebook">My Vocabulary</a><a href="/vocabulary/sets">Sets</a><a href="/vocabulary/flashcards">Flashcard</a><a href="/vocabulary/review">Review</a></nav>
    ${isStudy && items.length ? `<div class="wb-mode-strip" aria-label="Flashcard modes">${modeLinks}</div><p class="wb-muted">Các mode cùng đọc một Knowledge Object; mode không có evidence trong dữ liệu sẽ không xuất hiện.</p><div data-wb-study-deck>${studyCards}</div>` : items.length ? `<div class="wb-knowledge-list">${list}</div>` : `<section class="wb-empty-state"><h2>${dueOnly ? 'Không có mục đến hạn ôn' : 'Chưa có mục từ cá nhân'}</h2><p>${dueOnly ? 'Review chỉ hiển thị mục có next_review_at đã đến hạn; không hard-code review due.' : 'Mở Dictionary và thêm mục từ thật để bắt đầu xây My Vocabulary.'}</p><a href="/dictionary" class="wb-btn wb-btn-primary">Mở Dictionary</a></section>`}
    <section class="wb-next-action"><h2>Bridge</h2><a href="/practice/vocabulary" class="wb-btn wb-btn-outline">Practice Vocabulary</a><a href="/my-knowledge" class="wb-btn wb-btn-outline">My Knowledge</a></section>`;

  return htmlResponse(renderPublicPage({ title: titles[mode] || titles.notebook, currentPath: `/vocabulary/${mode}`, breadcrumbs: [{ label: 'Dictionary', href: '/dictionary' }, { label: titles[mode] || titles.notebook }], user, contentHtml }));
}
