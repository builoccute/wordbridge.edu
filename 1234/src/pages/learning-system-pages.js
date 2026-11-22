import { memoryState } from '../modules/dictionary/dictionary-service.js';
/**
 * WORD BRIDGE V4 — evidence-based learning-system pages.
 * No schema changes: these views project existing curriculum, notebook, progress,
 * practice and intelligence evidence into the V4 learning product model.
 */
import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml, htmlResponse, redirectResponse } from '../utils/http.js';
import { SPECIALIZED_VOCAB_DOMAINS } from './public-pages.js';

const SKILLS = Object.freeze({
  vocabulary: { vi: 'Từ vựng', en: 'Vocabulary', route: '/practice/vocabulary' },
  grammar: { vi: 'Ngữ pháp', en: 'Grammar', route: '/practice/grammar' },
  listening: { vi: 'Nghe', en: 'Listening', route: '/practice/listening' },
  speaking: { vi: 'Nói', en: 'Speaking', route: '/practice/speaking' },
  pronunciation: { vi: 'Phát âm', en: 'Pronunciation', route: '/practice/speaking' },
  reading: { vi: 'Đọc', en: 'Reading', route: '/practice/reading' },
  writing: { vi: 'Viết', en: 'Writing', route: '/practice/writing' },
});

function safeJson(value, fallback = null) {
  try { return JSON.parse(value ?? ''); } catch { return fallback; }
}
function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}
export async function renderGlobalSearchPage({ db, user, url }) {
  const q = String(url.searchParams.get('q') || '').trim();
  const category = String(url.searchParams.get('category') || 'all');
  if (q && !user) return redirectResponse(signInUrl(`${url.pathname}${url.search}`, 'global.search', url.searchParams.get('locale') || ''));

  const results = { dictionary: [], learning: [], practice: [], specialized: [] };
  let error = '';
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    try {
      const tasks = [];
      if (category === 'all' || category === 'dictionary') tasks.push(db.prepare(`
        SELECT language_code, slug, headword AS title, meaning_vi AS summary, level_ref
        FROM wb_dictionary_entries
        WHERE review_status='published' AND (lower(headword) LIKE ? OR lower(meaning_vi) LIKE ? OR lower(phonetic) LIKE ?)
        ORDER BY headword LIMIT 20`).bind(like, like, like).all().then(r => { results.dictionary = r.results || []; }));
      if (category === 'all' || category === 'learning') tasks.push(db.prepare(`
        SELECT 'lesson' kind, l.slug, l.title_vi AS title, '' AS summary, l.language_code, l.level_ref
        FROM wb_lessons l
        WHERE l.review_status='published' AND lower(l.title_vi) LIKE ?
        UNION ALL
        SELECT 'course' kind, c.slug, c.title_vi AS title, c.summary_vi AS summary, c.language_code, COALESCE(pl.framework_ref,'') AS level_ref
        FROM wb_courses c LEFT JOIN wb_program_levels pl ON pl.id=c.level_id
        WHERE c.review_status='published' AND (lower(c.title_vi) LIKE ? OR lower(c.summary_vi) LIKE ?)
        LIMIT 20`).bind(like, like, like).all().then(r => { results.learning = r.results || []; }));
      if (category === 'all' || category === 'practice') tasks.push(db.prepare(`
        SELECT slug, title_vi AS title, instructions_vi AS summary, language_code, skill, level_ref
        FROM wb_practice_exercises
        WHERE lower(title_vi) LIKE ? OR lower(instructions_vi) LIKE ? OR lower(topic) LIKE ?
        ORDER BY skill, title_vi LIMIT 20`).bind(like, like, like).all().then(r => { results.practice = r.results || []; }));
      await Promise.all(tasks);
      if (category === 'all' || category === 'specialized') {
        results.specialized = SPECIALIZED_VOCAB_DOMAINS.filter(d => `${d.nameVi} ${d.sample}`.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
      }
    } catch (err) {
      error = 'SEARCH_UNAVAILABLE';
    }
  }

  const total = Object.values(results).reduce((n, rows) => n + rows.length, 0);
  const group = (title, rows, render) => rows.length ? `<section class="wb-search-group"><h2>${title} <span class="wb-badge">${rows.length}</span></h2><div class="wb-search-results">${rows.map(render).join('')}</div></section>` : '';
  const contentHtml = `
    <section class="wb-learning-landing"><p class="wb-eyebrow" data-i18n="search.eyebrow">SEARCH · DISCOVER · BRIDGE</p><h1 data-i18n="search.title">Tìm kiếm WORD BRIDGE</h1><p data-i18n="search.intro">Tìm mục từ, bài học, hoạt động luyện tập và môi trường chuyên ngành từ dữ liệu đang có.</p></section>
    <form method="GET" action="/search" role="search" class="wb-search-shell" data-wb-search-form ${user ? '' : 'data-auth-intent="global.search"'}>
      <label class="wb-sr-only" for="wb-global-search" data-i18n="search.label">Từ khóa tìm kiếm</label>
      <input id="wb-global-search" class="wb-input" type="search" name="q" value="${escapeHtml(q)}" autocomplete="off" placeholder="Tìm từ, bài học, kỹ năng, chuyên ngành..." data-i18n-placeholder="search.placeholder" />
      <label class="wb-sr-only" for="wb-search-category" data-i18n="search.category">Nhóm kết quả</label>
      <select id="wb-search-category" class="wb-select" name="category">
        <option value="all" ${category === 'all' ? 'selected' : ''}>Tất cả</option><option value="dictionary" ${category === 'dictionary' ? 'selected' : ''}>Từ điển</option><option value="learning" ${category === 'learning' ? 'selected' : ''}>Học</option><option value="practice" ${category === 'practice' ? 'selected' : ''}>Luyện tập</option><option value="specialized" ${category === 'specialized' ? 'selected' : ''}>Chuyên ngành</option>
      </select>
      <button class="wb-btn wb-btn-primary" type="submit" data-i18n="search.submit">Tìm kiếm</button>
      ${q ? '<a class="wb-btn wb-btn-ghost" href="/search" data-i18n="search.clear">Xóa từ khóa</a>' : ''}
    </form>
    ${!q ? `<section class="wb-empty-state"><h2 data-i18n="search.emptyTitle">Bắt đầu bằng một từ khóa</h2><p data-i18n="search.emptyBody">Kết quả chỉ được tạo từ dữ liệu thật hiện có. WORD BRIDGE không tạo kết quả tìm kiếm giả.</p></section>` : ''}
    ${error ? `<section class="wb-alert wb-alert-error" role="alert"><strong data-i18n="search.errorTitle">Không thể tải kết quả tìm kiếm.</strong> <span data-i18n="search.errorBody">Hãy thử lại; không có kết quả giả được thay thế.</span></section>` : ''}
    ${q && !error && !total ? `<section class="wb-empty-state"><h2 data-i18n="search.noResults">Không tìm thấy kết quả phù hợp</h2><p data-i18n="search.noResultsBody">Thử từ khóa ngắn hơn hoặc đổi nhóm kết quả.</p><a href="/learning" class="wb-btn wb-btn-outline" data-i18n="search.explore">Khám phá học tập</a></section>` : ''}
    ${group('Từ điển', results.dictionary, r => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.level_ref)}</p><h3><a href="/dictionary/${r.language_code === 'zh' ? 'chinese' : r.language_code === 'ru' ? 'russian' : 'english'}/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary)}</p></article>`)}
    ${group('Học tập', results.learning, r => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.level_ref)}</p><h3><a href="/${r.kind === 'course' ? 'courses' : 'lessons'}/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary || '')}</p></article>`)}
    ${group('Luyện tập', results.practice, r => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.skill)} · ${escapeHtml(r.level_ref)}</p><h3><a href="/practice/${escapeHtml(r.skill)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary || '')}</p></article>`)}
    ${group('Chuyên ngành', results.specialized, r => `<article><p class="wb-eyebrow">SPECIALIZED · ${r.count.toLocaleString('vi-VN')} terms</p><h3><a href="/specialized/${escapeHtml(r.slug)}">${escapeHtml(r.nameVi)}</a></h3><p>${escapeHtml(r.sample)}</p></article>`)}
  `;
  return htmlResponse(renderPublicPage({ title: q ? `Tìm kiếm: ${q}` : 'Tìm kiếm', currentPath: '/search', breadcrumbs: [{ label: 'Tìm kiếm' }], user, contentHtml }));
}

export async function renderLearningPathPage({ db, user }) {
  const courses = (await db.prepare(`SELECT c.id,c.slug,c.title_vi,c.language_code,c.summary_vi,COALESCE(pl.framework_ref,'') AS level_ref,COALESCE(pl.sort_order,999) AS sort_order FROM wb_courses c LEFT JOIN wb_program_levels pl ON pl.id=c.level_id WHERE c.review_status='published' ORDER BY c.language_code,COALESCE(pl.sort_order,999),c.title_vi`).all()).results || [];
  const weeks = (await db.prepare(`SELECT id, course_id, slug, week_number, topic_vi, required_knowledge, sessions_count FROM wb_weeks ORDER BY course_id, week_number`).all()).results || [];
  let progress = [];
  if (user) progress = (await db.prepare(`SELECT course_id, lesson_id, status, score_percent, updated_at FROM wb_learner_progress WHERE account_id=? ORDER BY updated_at DESC`).bind(user.accountId).all()).results || [];
  const lessons = (await db.prepare("SELECT l.id,w.course_id FROM wb_lessons l JOIN wb_weeks w ON w.id=l.week_id WHERE l.review_status='published'").all()).results;
  const completedLessons=new Set(progress.filter(p=>p.status==='completed').map(p=>p.lesson_id));
  const paths = courses.map((course, i) => {
    const nodes=lessons.filter(l=>l.course_id===course.id);
    const ids=new Set(nodes.map(l=>l.id));
    const activity=progress.filter(p=>p.course_id===course.id || ids.has(p.lesson_id));
    const p=activity[0];
    const needsReview=activity.some(row=>row.status==='in_progress' && row.score_percent!=null && row.score_percent<70);
    const state = nodes.length && nodes.every(l=>completedLessons.has(l.id)) ? 'completed'
      : needsReview ? 'review-needed' : activity.some(row=>row.status!=='not_started') ? 'active' : 'not-started';
    const courseWeeks = weeks.filter(w => w.course_id === course.id);
    return `<article class="wb-path-step ${state}" aria-label="${escapeHtml(course.title_vi)}">
      <div class="wb-path-marker" aria-hidden="true">${i + 1}</div><div class="wb-path-body"><p class="wb-eyebrow">${escapeHtml(course.language_code.toUpperCase())} · ${escapeHtml(course.level_ref)} · ${courseWeeks.length} <span>Tuần</span></p><h2><a href="/courses/${escapeHtml(course.slug)}" data-learning-content>${escapeHtml(course.title_vi)}</a></h2><p data-learning-content>${escapeHtml(course.summary_vi || '')}</p><div class="wb-path-meta"><span class="wb-badge">${state === 'completed' ? 'Hoàn thành' : state === 'review-needed' ? 'Cần ôn lại' : state === 'active' ? 'Đang học' : 'Chưa bắt đầu'}</span>${p?.score_percent != null ? `<span class="wb-badge">Evidence ${pct(p.score_percent)}%</span>` : ''}<a class="wb-btn wb-btn-outline wb-btn-sm" href="/courses/${escapeHtml(course.slug)}/curriculum">Mở lộ trình</a></div></div>
    </article>`;
  }).join('');
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">LEARNING PATH</p><h1>Lộ trình học tập</h1><p>${user ? 'Trạng thái chỉ phản ánh tiến độ đã lưu trong hệ thống.' : 'Bạn có thể xem cấu trúc lộ trình công khai; đăng nhập khi muốn bắt đầu và lưu tiến độ.'}</p></section><div class="wb-path">${paths || '<div class="wb-empty-state"><h2>Chưa có lộ trình đã phát hành</h2><p>Không có progression giả được tạo.</p></div>'}</div><section class="wb-next-action"><h2>Bước tiếp theo</h2><a class="wb-btn wb-btn-primary" href="${user ? '/practice' : signInUrl('/learning/path', 'learning.start')}">${user ? 'Luyện kỹ năng từ lộ trình' : 'Đăng nhập để bắt đầu'}</a></section>`;
  return htmlResponse(renderPublicPage({ title: 'Lộ trình học tập', currentPath: '/learning/path', breadcrumbs: [{ label: 'Học', href: '/learning' }, { label: 'Lộ trình' }], user, contentHtml }));
}

export async function renderSkillCenterPage({ db, user, skill = '' }) {
  const meta = SKILLS[skill];
  if (!meta) return htmlResponse(renderPublicPage({ title: 'Kỹ năng không tồn tại', currentPath: `/skills/${skill}`, user, contentHtml: '<section class="wb-alert wb-alert-error"><h1>Kỹ năng không tồn tại</h1><a href="/learning/skills">Xem Trung tâm kỹ năng</a></section>' }), 404);
  const dbSkill = skill === 'pronunciation' ? 'speaking' : skill;
  const exercises = (await db.prepare(`SELECT id, slug, language_code, skill, title_vi, level_ref, topic, instructions_vi FROM wb_practice_exercises WHERE skill=? ORDER BY language_code, level_ref, title_vi`).bind(dbSkill).all()).results || [];
  const questions = (await db.prepare(`SELECT id, language_code, skill, question_type, level_ref, topic, prompt_text, audio_asset_id, auto_gradable FROM wb_question_bank WHERE skill=? AND review_status='published' ORDER BY language_code, level_ref LIMIT 20`).bind(dbSkill).all()).results || [];
  const references = skill === 'pronunciation' ? (await db.prepare("SELECT headword,ipa_or_pinyin,stress_pattern,tone_pattern,language_code,slug FROM wb_dictionary_entries WHERE review_status='published' AND coalesce(ipa_or_pinyin,'') != '' ORDER BY language_code,headword LIMIT 12").all()).results : [];
  const personal = user && skill !== 'pronunciation' ? await db.prepare('SELECT count(*) count,max(submitted_at) latest FROM wb_practice_results WHERE account_id=? AND skill=?').bind(user.accountId,skill).first() : null;
  const specialPron = skill === 'pronunciation';
  const contentHtml = `<section class="wb-skill-intro"><p class="wb-eyebrow">SKILL CENTER · ${escapeHtml(meta.en.toUpperCase())}</p><h1>${escapeHtml(meta.vi)}</h1><p>${specialPron ? 'Phát âm được tách khỏi Speaking ở cấp product model. Chỉ hiển thị IPA/audio và workflow ghi âm khi dữ liệu hoặc trình duyệt hỗ trợ; không tạo điểm phát âm AI giả.' : 'Khám phá nội dung đã phát hành và chuyển sang studio luyện tập phù hợp với kỹ năng này.'}</p></section>
    <nav class="wb-skill-strip" aria-label="Bảy kỹ năng">${Object.entries(SKILLS).map(([key, item]) => `<a href="/skills/${key}" ${key === skill ? 'aria-current="page"' : ''}>${escapeHtml(item.vi)}</a>`).join('')}</nav>
    ${specialPron ? `<section class="wb-pronunciation-lab"><div><h2>Reference & self-recording</h2><ul>${references.map(r => `<li><a href="/dictionary/${({en:'english',zh:'chinese',ru:'russian'})[r.language_code]}/${encodeURIComponent(r.slug)}" data-learning-content>${escapeHtml(r.headword)}</a> · ${escapeHtml(r.ipa_or_pinyin)} ${escapeHtml(r.stress_pattern || r.tone_pattern || '')}</li>`).join('')}</ul><p>WORD BRIDGE hiện có metadata phiên âm trong Dictionary và có thể dùng ghi âm cục bộ để tự nghe lại. Backend hiện không có phoneme-level scoring được chứng minh.</p><a href="/dictionary" class="wb-btn wb-btn-outline">Mở Dictionary có IPA/Pinyin</a></div>${user ? '<div><button class="wb-btn wb-btn-primary" type="button" data-wb-record-toggle>Ghi âm</button><button type="button" class="wb-btn" data-wb-record-retry>Ghi lại</button><p data-wb-record-status class="wb-muted" role="status">Chưa ghi âm.</p><audio id="wb-local-playback" controls hidden></audio></div>' : `<a class="wb-btn wb-btn-primary" href="${signInUrl('/skills/pronunciation', 'pronunciation.record')}">Đăng nhập để ghi âm</a>`}</section>` : ''}
    <section><h2>Nội dung đã phát hành</h2>${exercises.length ? `<div class="wb-activity-list">${exercises.map(e => `<article><div><p class="wb-eyebrow">${escapeHtml(e.language_code.toUpperCase())} · ${escapeHtml(e.level_ref)} · ${escapeHtml(e.topic)}</p><h3 data-learning-content>${escapeHtml(e.title_vi)}</h3><p data-learning-content>${escapeHtml(e.instructions_vi)}</p></div><a href="${meta.route}" class="wb-btn wb-btn-outline wb-btn-sm">Mở studio</a></article>`).join('')}</div>` : '<div class="wb-empty-state"><h3>Chưa có exercise riêng cho kỹ năng này</h3><p>Presentation vẫn dùng dữ liệu thật; không tạo exercise giả.</p></div>'}</section>
    ${personal?.count ? `<section><h2>Hoạt động gần đây</h2><p>${Number(personal.count)} · <time>${escapeHtml(personal.latest)}</time></p><a href="/practice/history">Practice Insights</a></section>` : ''}
    <section><h2>Question evidence</h2><p class="wb-muted">${questions.length} câu hỏi đã phát hành cho skill mapping hiện tại.</p>${questions.length ? `<div class="wb-evidence-chips">${questions.map(q => `<span>${escapeHtml(q.language_code.toUpperCase())} · ${escapeHtml(q.question_type)} · ${escapeHtml(q.level_ref)}</span>`).join('')}</div>` : ''}</section>
    <section class="wb-next-action"><h2>Bridge</h2><a href="${meta.route}" class="wb-btn wb-btn-primary">Đi tới Practice Studio</a><a href="/my-knowledge" class="wb-btn wb-btn-outline">Xem kiến thức cá nhân</a></section>`;
  return htmlResponse(renderPublicPage({ title: `${meta.vi} — Skill Center`, currentPath: `/skills/${skill}`, breadcrumbs: [{ label: 'Học', href: '/learning' }, { label: 'Kỹ năng', href: '/learning/skills' }, { label: meta.vi }], user, contentHtml }));
}

export async function renderKnowledgePage({ db, user }) {
  if (!user) return redirectResponse(signInUrl('/my-knowledge', 'knowledge.view'));
  const [notebookRes, progressRes, practiceRes] = await Promise.all([
    db.prepare(`SELECT n.*, d.headword, d.meaning_vi, d.language_code, d.part_of_speech FROM wb_vocabulary_notebook n JOIN wb_dictionary_entries d ON d.id=n.entry_id WHERE n.account_id=? ORDER BY n.next_review_at ASC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT p.*, l.title_vi, l.language_code, l.level_ref FROM wb_learner_progress p LEFT JOIN wb_lessons l ON l.id=p.lesson_id WHERE p.account_id=? ORDER BY p.updated_at DESC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT skill, score, max_score, grading_status, submitted_at FROM wb_practice_results WHERE account_id=? ORDER BY submitted_at DESC LIMIT 100`).bind(user.accountId).all(),
  ]);
  const notebook = notebookRes.results || [], progress = progressRes.results || [], practice = practiceRes.results || [];
  const due = notebook.filter(n => new Date(n.next_review_at).getTime() <= Date.now()).length;
  const mastered = notebook.filter(n => n.mastery_status === 'mastered' && n.repetitions>=4).length;
  const completed = progress.filter(p => p.status === 'completed').length;
  const skillStats = Object.keys(SKILLS).filter(s => s !== 'pronunciation').map(skill => {
    const rows = practice.filter(r => r.skill === skill && r.grading_status === 'auto_graded' && Number(r.max_score) > 0 && r.score != null);
    const avg = rows.length ? Math.round(rows.reduce((n, r) => n + Number(r.score) / Number(r.max_score) * 100, 0) / rows.length) : null;
    return { skill, avg, count: rows.length };
  });
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">MY KNOWLEDGE · EVIDENCE ONLY</p><h1>My Knowledge</h1><p>Bản đồ dưới đây chỉ tổng hợp evidence đã lưu; chiều nào chưa đo được sẽ không được suy đoán.</p></section>
    <div class="wb-metric-row"><div><strong>${notebook.length}</strong><span>Mục từ đang học</span></div><div><strong>${mastered}</strong><span>Mastered theo notebook</span></div><div><strong>${due}</strong><span>Review due</span></div><div><strong>${completed}</strong><span>Bài học hoàn thành</span></div></div>
    <section><h2>Receptive / productive evidence</h2><div class="wb-skill-meter-list">${skillStats.map(s => `<article><div><strong>${escapeHtml(SKILLS[s.skill].vi)}</strong><span>${s.count ? `${s.count} lượt có điểm` : 'Chưa có evidence'}</span></div><div class="wb-progress" aria-label="${s.avg == null ? 'Chưa đo' : `${s.avg}%`}"><span style="width:${s.avg ?? 0}%"></span></div><strong>${s.avg == null ? '—' : `${s.avg}%`}</strong></article>`).join('')}</div></section>
    <section><h2>Knowledge objects gần đây</h2>${notebook.length ? `<div class="wb-knowledge-list">${notebook.slice(0, 30).map(n => `<article><div><p class="wb-eyebrow">${escapeHtml(n.language_code.toUpperCase())} · ${escapeHtml(n.part_of_speech || '')}</p><h3 data-learning-content>${escapeHtml(n.headword)}</h3><p data-learning-content>${escapeHtml(n.meaning_vi)}</p></div><div><span class="wb-badge">${memoryState(n)}</span><p class="wb-muted"><span>Ngày ôn tiếp theo</span> <time>${escapeHtml(n.next_review_at)}</time></p></div></article>`).join('')}</div>` : '<div class="wb-empty-state"><h3>Chưa có knowledge evidence</h3><p>Lưu một mục từ từ Dictionary hoặc hoàn thành một bài học để bắt đầu tạo evidence.</p><a class="wb-btn wb-btn-primary" href="/dictionary">Mở Dictionary</a></div>'}</section>
    <section class="wb-next-action"><h2>Next meaningful action</h2>${due ? '<a href="/vocabulary/review" class="wb-btn wb-btn-primary">Ôn các mục đến hạn</a>' : '<a href="/practice" class="wb-btn wb-btn-primary">Luyện kỹ năng</a>'}<a href="/my-mistakes" class="wb-btn wb-btn-outline">Xem My Mistakes</a></section>`;
  return htmlResponse(renderPublicPage({ title: 'My Knowledge', currentPath: '/my-knowledge', breadcrumbs: [{ label: 'Học', href: '/learning' }, { label: 'My Knowledge' }], user, contentHtml }));
}

export async function renderMistakesPage({ db, user }) {
  if (!user) return redirectResponse(signInUrl('/my-mistakes', 'mistakes.view'));
  const [practiceRes, lessonRes, intelRes] = await Promise.all([
    db.prepare(`SELECT r.id, r.skill, r.answers_json, r.feedback_json, r.score, r.max_score, r.grading_status, r.submitted_at, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id=r.exercise_id WHERE r.account_id=? ORDER BY r.submitted_at DESC,r.rowid DESC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT s.id, s.breakdown_json, s.submitted_at, l.title_vi FROM wb_lesson_submissions s LEFT JOIN wb_lessons l ON l.id=s.lesson_id WHERE s.account_id=? ORDER BY s.submitted_at DESC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT id, output_json, methodology_note, confidence_level, technical_limits, created_at FROM wb_intelligence_runs WHERE account_id=? AND system_slug='language-error-genome' ORDER BY created_at DESC LIMIT 20`).bind(user.accountId).all(),
  ]);
  const mistakes = [];
  for (const row of lessonRes.results || []) {
    const breakdown = safeJson(row.breakdown_json, []);
    for (const item of Array.isArray(breakdown) ? breakdown : []) if (item && item.correct === false) mistakes.push({ source: row.title_vi || 'Lesson', skill: 'lesson', prompt: item.prompt || '', expected: item.expected || '', given: item.given || '', explanation: item.explanationVi || '', at: row.submitted_at, lifecycle: 'Detected' });
  }
  const latestGrade = new Map();
  for (const row of practiceRes.results || []) {
    const feedback = safeJson(row.feedback_json, {});
    const details = Array.isArray(feedback) ? feedback : Array.isArray(feedback?.breakdown) ? feedback.breakdown : Array.isArray(feedback?.items) ? feedback.items : [];
    for (const item of details) {
      if (!item || typeof (item.correct ?? item.isCorrect)!=='boolean') continue;
      if (item.questionId && !latestGrade.has(item.questionId)) latestGrade.set(item.questionId,item.correct ?? item.isCorrect);
      if (item.correct === false || item.isCorrect === false) mistakes.push({ source: row.title_vi || 'Practice', skill: row.skill, prompt: item.prompt || item.question || '', expected: item.expected || item.correctAnswer || '', given: item.given || item.answer || safeJson(row.answers_json,{})[item.questionId] || '', explanation: item.explanation || item.explanationVi || '', at: row.submitted_at, lifecycle: latestGrade.get(item.questionId)===true ? 'Correct on retest' : 'Detected' });
    }
  }
  mistakes.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const patterns = (intelRes.results || []).map(r => ({ ...r, output: safeJson(r.output_json, {}) }));
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">MY MISTAKES · EVIDENCE LIFECYCLE</p><h1>My Mistakes</h1><p>Detected → Understood → Practising → Retested → Resolved. Source hiện chỉ đủ để xác nhận lỗi detected và các phân tích đã được backend lưu; WORD BRIDGE không suy đoán lifecycle còn lại.</p></section>
    ${mistakes.length ? `<div class="wb-mistake-inbox">${mistakes.slice(0, 50).map(m => `<article><div><p class="wb-eyebrow">${escapeHtml(m.skill.toUpperCase())} · ${escapeHtml(m.at || '')}</p><h3>${escapeHtml(m.source)}</h3><p>${escapeHtml(m.prompt)}</p>${m.given ? `<p><strong>Đã trả lời:</strong> ${escapeHtml(m.given)}</p>` : ''}${m.expected ? `<p><strong>Evidence đáp án:</strong> ${escapeHtml(m.expected)}</p>` : ''}${m.explanation ? `<p class="wb-muted">${escapeHtml(m.explanation)}</p>` : ''}</div><div><span class="wb-badge wb-badge-red">${m.lifecycle}</span><a href="/practice/${m.skill === 'lesson' ? '' : escapeHtml(m.skill)}" class="wb-btn wb-btn-outline wb-btn-sm">Targeted practice</a></div></article>`).join('')}</div>` : '<div class="wb-empty-state"><h2>Chưa có lỗi được ghi nhận</h2><p>Không có Mistake DNA giả. Hãy hoàn thành bài có chấm điểm để tạo evidence.</p><a href="/practice" class="wb-btn wb-btn-primary">Mở Practice</a></div>'}
    <section><h2>Pattern evidence</h2>${patterns.length ? `<div class="wb-activity-list">${patterns.map(p => `<article><div><p class="wb-eyebrow">${escapeHtml(p.confidence_level)} · ${escapeHtml(p.created_at)}</p><h3>Language Error Genome run</h3><p>${escapeHtml(p.methodology_note || '')}</p><p class="wb-muted">${escapeHtml(p.technical_limits || '')}</p></div></article>`).join('')}</div>` : '<div class="wb-alert wb-alert-info">Chưa có đủ backend evidence để hiển thị pattern lỗi.</div>'}</section>
    <section class="wb-next-action"><h2>Bridge</h2><a href="/practice" class="wb-btn wb-btn-primary">Luyện lại theo kỹ năng</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Ôn kiến thức</a></section>`;
  return htmlResponse(renderPublicPage({ title: 'My Mistakes', currentPath: '/my-mistakes', breadcrumbs: [{ label: 'Luyện tập', href: '/practice' }, { label: 'My Mistakes' }], user, contentHtml }));
}

export function renderSkillCenterHub({ user }) {
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">SKILL CENTER · 7 SYSTEMS</p><h1>Trung tâm kỹ năng</h1><p>Mỗi kỹ năng có presentation và bridge riêng. Nội dung luyện tập chỉ xuất hiện khi source có exercise hoặc question evidence thật.</p></section>
    <div class="wb-skill-hub">${Object.entries(SKILLS).map(([key, item]) => `<a href="/skills/${key}"><span class="wb-eyebrow">${escapeHtml(item.en.toUpperCase())}</span><strong>${escapeHtml(item.vi)}</strong><span>Xem workflow →</span></a>`).join('')}</div>
    <section class="wb-next-action"><h2>Practice & review</h2><a href="/practice" class="wb-btn wb-btn-primary">Mở Practice Center</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Ôn tập</a></section>`;
  return htmlResponse(renderPublicPage({ title: 'Trung tâm kỹ năng', currentPath: '/learning/skills', breadcrumbs: [{ label: 'Học', href: '/learning' }, { label: 'Kỹ năng' }], user, contentHtml }));
}

export { SKILLS };
