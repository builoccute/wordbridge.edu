/**
 * WORD BRIDGE — Learning, Dedicated Module Page, Weeks, Real Audio Lesson &
 * Dedicated Lesson Result Page (V3.1 — Section 3, 4, 7, 14)
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { OFFICIAL_LANGUAGES } from '../config/constants.js';
import { escapeHtml, normalizeLanguageCode } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

export async function renderLearningHub({ db, user }) {
  const programs = (await db.prepare("SELECT * FROM wb_programs WHERE review_status = 'published' ORDER BY language_code, code").all()).results || [];
  const cards = programs.map((p) => `
    <article class="wb-card">
      <span class="wb-badge">${escapeHtml(p.language_code.toUpperCase())} · ${escapeHtml(p.program_type)}</span>
      <h3 style="margin-top:10px;"><a href="/programs/${escapeHtml(p.slug)}">${escapeHtml(p.name_vi)}</a></h3>
      <p class="wb-muted" style="font-size:0.9rem;">Đầu vào: ${escapeHtml(p.entry_level)} → Mục tiêu: ${escapeHtml(p.target_level)}</p>
      <p style="font-size:0.88rem;">${p.total_weeks} tuần · ${p.sessions_per_week} buổi/tuần · ~${p.estimated_hours} giờ</p>
      <a href="/programs/${escapeHtml(p.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chi tiết chương trình</a>
    </article>`).join('');

  const contentHtml = `
    <h1>Hệ thống Học ngoại ngữ WORD BRIDGE</h1>
    <p class="wb-muted">Kiến trúc 11 cấp: Ngôn ngữ → Chương trình → Trình độ → Giáo trình → Học phần → Tuần → Buổi học → Bài học → Bài tập → Đánh giá → Tiến độ.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 24px;">
      <a href="/learning/chinese" class="wb-btn wb-btn-primary wb-btn-sm">Tiếng Trung (zh)</a>
      <a href="/learning/english" class="wb-btn wb-btn-primary wb-btn-sm">Tiếng Anh (en)</a>
      <a href="/learning/russian" class="wb-btn wb-btn-primary wb-btn-sm">Tiếng Nga (ru)</a>
      <a href="/my-learning" class="wb-btn wb-btn-outline wb-btn-sm">Lộ trình cá nhân</a>
    </div>
    <div class="wb-grid-3">${cards || '<div class="wb-alert wb-alert-info">Chưa có chương trình được phát hành.</div>'}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Học ngoại ngữ',
    currentPath: '/learning',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ' }],
    user,
    contentHtml,
  }));
}

export async function renderLanguageLearningPage({ db, user, languageSlug }) {
  const code = normalizeLanguageCode(languageSlug);
  if (!code) {
    return htmlResponse(renderPublicPage({
      title: 'Ngôn ngữ không hỗ trợ',
      currentPath: `/learning/${languageSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">WORD BRIDGE chỉ hỗ trợ 3 ngôn ngữ chính thức: Tiếng Trung, Tiếng Anh và Tiếng Nga. Không hỗ trợ tiếng Nhật hoặc tiếng Hàn.</div>',
    }), 404);
  }
  const lang = OFFICIAL_LANGUAGES[code];
  const programs = (await db.prepare('SELECT * FROM wb_programs WHERE language_code = ? ORDER BY code').bind(code).all()).results || [];
  const courses = (await db.prepare('SELECT * FROM wb_courses WHERE language_code = ? ORDER BY slug').bind(code).all()).results || [];

  const contentHtml = `
    <h1>Học ${escapeHtml(lang.nameVi)} (${escapeHtml(lang.nativeName)})</h1>
    <div class="wb-card wb-card-warm" style="margin-bottom:20px;">
      <p style="margin:0 0 6px;"><strong>Hệ quy chiếu:</strong> ${escapeHtml(lang.framework)}</p>
      <p style="margin:0 0 6px;"><strong>Chữ viết:</strong> ${escapeHtml(lang.scriptSystem)}</p>
      <p style="margin:0;"><strong>Ngữ âm & trọng tâm:</strong> ${escapeHtml(lang.phoneticSystem)}</p>
    </div>
    <h2>Chương trình học</h2>
    <div class="wb-grid-2" style="margin-bottom:24px;">
      ${programs.map((p) => `<article class="wb-card"><h3><a href="/programs/${escapeHtml(p.slug)}">${escapeHtml(p.name_vi)}</a></h3><p class="wb-muted">${escapeHtml(p.overall_objectives)}</p><a href="/programs/${escapeHtml(p.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chương trình</a></article>`).join('')}
    </div>
    <h2>Khóa học & Giáo trình theo tuần</h2>
    <div class="wb-grid-2">
      ${courses.map((c) => `
        <article class="wb-card">
          <h3><a href="/courses/${escapeHtml(c.slug)}">${escapeHtml(c.title_vi)}</a></h3>
          <p class="wb-muted">${escapeHtml(c.summary_vi)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="/courses/${escapeHtml(c.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Chi tiết khóa học</a>
            <a href="/courses/${escapeHtml(c.slug)}/curriculum" class="wb-btn wb-btn-outline wb-btn-sm">Xem giáo trình</a>
          </div>
        </article>`).join('')}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Học ${lang.nameVi}`,
    currentPath: `/learning/${lang.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: lang.nameVi }],
    user,
    contentHtml,
  }));
}

export async function renderProgramDetailPage({ db, user, programSlug }) {
  const program = await db.prepare('SELECT * FROM wb_programs WHERE slug = ?').bind(programSlug).first();
  if (!program) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy chương trình', currentPath: `/programs/${programSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy chương trình học yêu cầu.</div>' }), 404);
  }
  const levels = (await db.prepare('SELECT * FROM wb_program_levels WHERE program_id = ? ORDER BY sort_order').bind(program.id).all()).results || [];
  const courses = (await db.prepare('SELECT * FROM wb_courses WHERE program_id = ?').bind(program.id).all()).results || [];

  const contentHtml = `
    <span class="wb-badge">${escapeHtml(program.code)} · Phiên bản ${escapeHtml(program.version)}</span>
    <h1>${escapeHtml(program.name_vi)}</h1>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Thông tin học thuật</h3>
        <ul>
          <li><strong>Đầu vào → Mục tiêu:</strong> ${escapeHtml(program.entry_level)} → ${escapeHtml(program.target_level)}</li>
          <li><strong>Đối tượng:</strong> ${escapeHtml(program.target_audience)}</li>
          <li><strong>Điều kiện tiên quyết:</strong> ${escapeHtml(program.prerequisites)}</li>
          <li><strong>Thời lượng:</strong> ${program.total_modules} học phần · ${program.total_weeks} tuần · ${program.sessions_per_week} buổi/tuần (~${program.estimated_hours} giờ)</li>
          <li><strong>Đánh giá:</strong> ${escapeHtml(program.assessment_methods)}</li>
          <li><strong>Tiêu chí hoàn thành:</strong> ${escapeHtml(program.completion_criteria)}</li>
        </ul>
      </div>
      <div class="wb-card">
        <h3>Mục tiêu & Chuẩn đầu ra</h3>
        <p>${escapeHtml(program.overall_objectives)}</p>
        <p><strong>Chuẩn đầu ra:</strong> ${escapeHtml(program.learning_outcomes)}</p>
      </div>
    </div>
    <h2 style="margin-top:24px;">Cấp độ & Khóa học thuộc chương trình</h2>
    <div class="wb-grid-2">
      ${levels.map((lv) => `<div class="wb-card"><h3><a href="/programs/${escapeHtml(program.slug)}/levels/${escapeHtml(lv.slug)}">${escapeHtml(lv.name_vi)}</a></h3><p>${escapeHtml(lv.objectives)}</p></div>`).join('')}
      ${courses.map((c) => `<div class="wb-card"><h3><a href="/courses/${escapeHtml(c.slug)}">${escapeHtml(c.title_vi)}</a></h3><p>${escapeHtml(c.summary_vi)}</p><a href="/courses/${escapeHtml(c.slug)}/curriculum" class="wb-btn wb-btn-primary wb-btn-sm">Mở giáo trình theo tuần</a></div>`).join('')}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: program.name_vi,
    currentPath: `/programs/${program.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: program.name_vi }],
    user,
    contentHtml,
  }));
}

export async function renderCourseCurriculumPage({ db, user, courseSlug, showCurriculumOnly = false }) {
  const course = await db.prepare('SELECT * FROM wb_courses WHERE slug = ?').bind(courseSlug).first();
  if (!course) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy khóa học', currentPath: `/courses/${courseSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Khóa học không tồn tại.</div>' }), 404);
  }
  const modules = (await db.prepare('SELECT * FROM wb_modules WHERE course_id = ? ORDER BY sort_order').bind(course.id).all()).results || [];
  const weeks = (await db.prepare('SELECT * FROM wb_weeks WHERE course_id = ? ORDER BY week_number').bind(course.id).all()).results || [];

  const contentHtml = `
    <h1>${escapeHtml(showCurriculumOnly ? `Giáo trình: ${course.title_vi}` : course.title_vi)}</h1>
    <p class="wb-muted">${escapeHtml(course.summary_vi)}</p>
    <div style="margin:12px 0 20px;">
      ${modules.map((m) => `<a href="/modules/${escapeHtml(m.slug)}" class="wb-btn wb-btn-outline wb-btn-sm" style="margin-right:8px;">Mở học phần: ${escapeHtml(m.title_vi)}</a>`).join('')}
    </div>
    <div class="wb-table-wrap">
      <table class="wb-table">
        <thead><tr><th>Tuần</th><th>Chủ đề</th><th>Kiến thức trọng tâm</th><th>Số buổi</th><th>Trang chi tiết</th></tr></thead>
        <tbody>
          ${weeks.map((w) => `<tr><td><strong>Tuần ${String(w.week_number).padStart(2, '0')}</strong></td><td>${escapeHtml(w.topic_vi)}</td><td>${escapeHtml(w.required_knowledge)}</td><td>${w.sessions_count} buổi</td><td><a href="/weeks/${escapeHtml(w.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở tuần học</a></td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: showCurriculumOnly ? `Giáo trình ${course.title_vi}` : course.title_vi,
    currentPath: showCurriculumOnly ? `/courses/${course.slug}/curriculum` : `/courses/${course.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: course.title_vi }],
    user,
    contentHtml,
  }));
}

/**
 * Section 3 Repair: Dedicated Module Page showing ONLY that module's data,
 * weeks, sessions count, lessons, resources, objectives, prerequisites & learner progress.
 */
export async function renderModuleDetailPage({ db, user, moduleSlug }) {
  const mod = await db.prepare(`
    SELECT m.*, c.title_vi AS course_title, c.slug AS course_slug, p.prerequisites AS program_prerequisites
    FROM wb_modules m
    JOIN wb_courses c ON c.id = m.course_id
    JOIN wb_programs p ON p.id = c.program_id
    WHERE m.slug = ?
  `).bind(moduleSlug).first();

  if (!mod) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy học phần', currentPath: `/modules/${moduleSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Học phần không tồn tại.</div>' }), 404);
  }

  const weeks = (await db.prepare('SELECT * FROM wb_weeks WHERE module_id = ? ORDER BY week_number').bind(mod.id).all()).results || [];
  const weekIds = weeks.map((w) => w.id);
  const lessons = weekIds.length
    ? (await db.prepare(`SELECT id, week_id, slug, title_vi FROM wb_lessons WHERE week_id IN (${weekIds.map(() => '?').join(',')}) ORDER BY slug`).bind(...weekIds).all()).results || []
    : [];
  const resources = lessons.length
    ? (await db.prepare(`SELECT id, lesson_id, title_vi, resource_type FROM wb_learning_resources WHERE lesson_id IN (${lessons.slice(0, 50).map(() => '?').join(',')}) LIMIT 20`).bind(...lessons.slice(0, 50).map((l) => l.id)).all()).results || []
    : [];

  let completedLessonIds = new Set();
  if (user && lessons.length) {
    const prg = (await db.prepare("SELECT lesson_id FROM wb_learner_progress WHERE account_id = ? AND status = 'completed'").bind(user.accountId).all()).results || [];
    completedLessonIds = new Set(prg.map((r) => r.lesson_id));
  }

  const completedInMod = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPct = lessons.length ? Math.round((completedInMod / lessons.length) * 100) : 0;

  const contentHtml = `
    <span class="wb-badge">Học phần #${mod.sort_order} · Thuộc khóa: ${escapeHtml(mod.course_title)}</span>
    <h1>${escapeHtml(mod.title_vi)}</h1>
    <div class="wb-grid-2" style="margin-bottom:20px;">
      <div class="wb-card">
        <h3>Mục tiêu & Điều kiện tiên quyết học phần</h3>
        <p><strong>Mục tiêu riêng:</strong> ${escapeHtml(mod.objectives_vi)}</p>
        <p><strong>Điều kiện tiên quyết:</strong> ${escapeHtml(mod.program_prerequisites)}</p>
        <p><strong>Quy mô học phần:</strong> ${weeks.length} tuần · ${lessons.length} bài học · ${resources.length} học liệu mẫu</p>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Tiến độ cá nhân trong học phần</h3>
        ${user
          ? `<p>Đã hoàn thành <strong>${completedInMod} / ${lessons.length}</strong> bài học (${progressPct}%).</p>`
          : '<p class="wb-muted">Đăng nhập tài khoản cá nhân để theo dõi tiến độ riêng của học phần này.</p><a href="/login" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>'}
      </div>
    </div>
    <h2>Danh sách tuần thuộc học phần</h2>
    <div class="wb-table-wrap">
      <table class="wb-table">
        <thead><tr><th>Tuần</th><th>Chủ đề</th><th>Số buổi</th><th>Số bài học</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead>
        <tbody>
          ${weeks.map((w) => {
            const wLessons = lessons.filter((l) => l.week_id === w.id);
            const wDone = wLessons.filter((l) => completedLessonIds.has(l.id)).length;
            const statusLabel = !user ? 'Công khai xem' : (wLessons.length && wDone === wLessons.length ? 'Hoàn thành' : wDone > 0 ? 'Đang học' : 'Chưa bắt đầu');
            return `<tr><td><strong>Tuần ${String(w.week_number).padStart(2, '0')}</strong></td><td>${escapeHtml(w.topic_vi)}</td><td>${w.sessions_count} buổi</td><td>${wLessons.length} bài</td><td><span class="wb-badge">${statusLabel}</span></td><td><a href="/weeks/${escapeHtml(w.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở tuần</a></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Học phần: ${mod.title_vi}`,
    currentPath: `/modules/${mod.slug}`,
    breadcrumbs: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Học ngoại ngữ', href: '/learning' },
      { label: mod.course_title, href: `/courses/${mod.course_slug}` },
      { label: mod.title_vi },
    ],
    user,
    contentHtml,
  }));
}

export async function renderWeekDetailPage({ db, user, weekSlug }) {
  const week = await db.prepare('SELECT * FROM wb_weeks WHERE slug = ?').bind(weekSlug).first();
  if (!week) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy tuần học', currentPath: `/weeks/${weekSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Tuần học không tồn tại.</div>' }), 404);
  }
  const sessions = (await db.prepare('SELECT * FROM wb_study_sessions WHERE week_id = ? ORDER BY position_in_week').bind(week.id).all()).results || [];
  const lessons = (await db.prepare('SELECT id, session_id, slug, title_vi, level_ref FROM wb_lessons WHERE week_id = ? ORDER BY slug').bind(week.id).all()).results || [];
  const vocab = JSON.parse(week.core_vocabulary_json || '[]');
  const grammar = JSON.parse(week.core_grammar_json || '[]');
  const materials = JSON.parse(week.study_materials_json || '[]');
  const exercises = JSON.parse(week.exercises_json || '[]');

  const contentHtml = `
    <span class="wb-badge">Tuần ${String(week.week_number).padStart(2, '0')} · ${sessions.length || week.sessions_count} buổi học thực tế</span>
    <h1>${escapeHtml(week.name_vi)}</h1>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Mục tiêu, Chuẩn đầu ra & Kiến thức</h3>
        <p><strong>Chủ đề:</strong> ${escapeHtml(week.topic_vi)}</p>
        <p><strong>Mục tiêu tuần:</strong> ${escapeHtml(week.week_objectives)}</p>
        <p><strong>Chuẩn đầu ra:</strong> ${escapeHtml(week.learning_outcomes)}</p>
        <p><strong>Kiến thức cần đạt:</strong> ${escapeHtml(week.required_knowledge)}</p>
        <p><strong>Phát âm & âm vị:</strong> ${escapeHtml(week.pronunciation_phonetics)}</p>
      </div>
      <div class="wb-card">
        <h3>Từ vựng & Ngữ pháp trọng tâm</h3>
        <p><strong>Từ vựng:</strong> ${vocab.map((v) => `<span class="wb-badge" style="margin:2px;">${escapeHtml(v)}</span>`).join('')}</p>
        <ul>${grammar.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
        <p><strong>Tình huống ứng dụng:</strong> ${escapeHtml(week.application_scenario)}</p>
      </div>
    </div>
    <div class="wb-grid-2" style="margin-top:18px;">
      <div class="wb-card">
        <h3>Nội dung bốn kỹ năng</h3>
        <ul>
          <li><strong>Nghe:</strong> ${escapeHtml(week.listening_content)}</li>
          <li><strong>Nói:</strong> ${escapeHtml(week.speaking_content)}</li>
          <li><strong>Đọc:</strong> ${escapeHtml(week.reading_content)}</li>
          <li><strong>Viết:</strong> ${escapeHtml(week.writing_content)}</li>
        </ul>
      </div>
      <div class="wb-card">
        <h3>Học liệu, Kiểm tra tuần & Chuẩn bị</h3>
        <ul>
          <li><strong>Tài liệu:</strong> ${escapeHtml(materials.join(', '))}</li>
          <li><strong>Bài tập:</strong> ${escapeHtml(exercises.join(', '))}</li>
          <li><strong>Bài kiểm tra tuần:</strong> ${escapeHtml(week.weekly_test_spec)}</li>
          <li><strong>Tiêu chí đạt:</strong> ${escapeHtml(week.passing_criteria)}</li>
          <li><strong>Bài ôn tập:</strong> ${escapeHtml(week.review_assignment)}</li>
          <li><strong>Chuẩn bị tuần kế tiếp:</strong> ${escapeHtml(week.next_week_prep)}</li>
        </ul>
      </div>
    </div>
    <h2 style="margin-top:24px;">Các buổi học & Bài học trong tuần (${lessons.length} bài)</h2>
    <div class="wb-grid-3">
      ${lessons.map((l) => `<article class="wb-card"><h3><a href="/lessons/${escapeHtml(l.slug)}">${escapeHtml(l.title_vi)}</a></h3><p class="wb-muted">Trình độ: ${escapeHtml(l.level_ref)}</p><a href="/lessons/${escapeHtml(l.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Mở bài học</a></article>`).join('')}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: week.name_vi,
    currentPath: `/weeks/${week.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: week.name_vi }],
    user,
    contentHtml,
  }));
}

export async function renderLessonDetailPage({ db, user, lessonSlug }) {
  const lesson = await db.prepare('SELECT * FROM wb_lessons WHERE slug = ?').bind(lessonSlug).first();
  if (!lesson) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy bài học', currentPath: `/lessons/${lessonSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Bài học không tồn tại.</div>' }), 404);
  }
  const c = JSON.parse(lesson.components_json || '{}');
  const audioAsset = await db.prepare('SELECT * FROM wb_audio_assets WHERE language_code = ? LIMIT 1').bind(lesson.language_code).first();
  const segments = audioAsset ? JSON.parse(audioAsset.sync_segments_json || '[]') : [];
  const checkQIds = Array.isArray(c.checkQuestionIds) ? c.checkQuestionIds : [];
  const questions = [];
  for (const qid of checkQIds) {
    const q = await db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qid).first();
    if (q) questions.push(q);
  }

  // Real HTML5 <audio> player (Section 7)
  const audioPlayerHtml = `
    <div class="wb-audio-player" data-wb-audio style="margin-bottom:18px;">
      <strong>Trình phát âm thanh bài học (${escapeHtml(audioAsset ? audioAsset.voice_label : 'Audio R2')})</strong>
      <audio controls preload="none" style="width:100%;" src="${audioAsset ? `/api/v1/audio/${escapeHtml(audioAsset.id)}/stream` : ''}"></audio>
      <div class="wb-audio-controls">
        <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-audio-action="play">Phát</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="pause">Tạm dừng</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="stop">Dừng</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="replay">Phát lại</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="back">-5s</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="forward">+5s</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="loop">Lặp: Tắt</button>
        <span class="wb-muted">Tốc độ: <strong data-speed-label>1.0x</strong></span>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="0.75">0.75x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1">1.0x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.25">1.25x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.5">1.5x</button>
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-mic-check>Bật micro tự luyện đọc</button>
      </div>
      ${segments.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${segments.map((s) => `<button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-audio-segment-start="${s.startMs}">▶ ${escapeHtml(s.text)}</button>`).join('')}</div>` : ''}
      <div data-audio-status class="wb-muted" style="font-size:0.84rem;">Trạng thái tệp audio R2: ${escapeHtml(audioAsset?.review_status || 'pending_upload')} (không dùng URL giả).</div>
      <div id="wb-mic-status" class="wb-muted" style="font-size:0.84rem;">Micro chỉ bật khi bạn chủ động nhấn nút. Hệ thống không giả lập điểm phát âm.</div>
    </div>`;

  // Section 14: ZERO hardcoded scorePercent=100! Backend evaluates real answers or marks content_completed.
  const quizFields = questions.map((q) => {
    const opts = JSON.parse(q.options_json || '[]');
    return `
      <div class="wb-field">
        <label>${escapeHtml(q.prompt_text)}</label>
        <select class="wb-select" name="answer_${escapeHtml(q.id)}">
          <option value="">-- Chọn đáp án --</option>
          ${opts.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
      </div>`;
  }).join('');

  const actionBlock = user
    ? `
      <form class="wb-card wb-card-warm wb-form" data-api-endpoint="/api/v1/learning/progress" data-redirect-to="/lessons/${escapeHtml(lesson.slug)}/result">
        <input type="hidden" name="lessonId" value="${escapeHtml(lesson.id)}" />
        <h3>Kiểm tra mức hiểu & Ghi nhận hoàn thành</h3>
        <p class="wb-muted" style="font-size:0.88rem;margin:0;">Điểm số được tính hoàn toàn tại backend từ câu trả lời thực tế. Nếu bài chỉ đọc nội dung, hệ thống ghi nhận trạng thái hoàn thành nội dung (không gán điểm 100% giả).</p>
        ${quizFields}
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Nộp kiểm tra & Xem trang kết quả bài học</button>
      </form>`
    : `<div class="wb-alert wb-alert-info">Bạn đang xem trước nội dung bài học công khai. <a href="/login">Đăng nhập</a> để làm kiểm tra và lưu tiến độ cá nhân.</div>`;

  const contentHtml = `
    <span class="wb-badge">${escapeHtml(lesson.language_code.toUpperCase())} · ${escapeHtml(lesson.level_ref)} · v${escapeHtml(lesson.version)}</span>
    <h1>${escapeHtml(lesson.title_vi)}</h1>
    ${audioPlayerHtml}
    <div class="wb-grid-2">
      <div class="wb-card"><h3>1. Mục tiêu & Kiến thức</h3><p>${escapeHtml(c.objectives || '')}</p><p>${escapeHtml(c.coreKnowledge || '')}</p></div>
      <div class="wb-card"><h3>2. Phiên âm & Phát âm</h3><p>${escapeHtml(c.phonetics || '')}</p></div>
      <div class="wb-card"><h3>3. Nghe & Nói</h3><p><strong>Listening:</strong> ${escapeHtml(c.listening || '')}</p><p><strong>Speaking:</strong> ${escapeHtml(c.speaking || '')}</p></div>
      <div class="wb-card"><h3>4. Đọc & Viết</h3><p><strong>Reading:</strong> ${escapeHtml(c.reading || '')}</p><p><strong>Writing:</strong> ${escapeHtml(c.writing || '')}</p></div>
    </div>
    <div style="margin-top:20px;">${actionBlock}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: lesson.title_vi,
    currentPath: `/lessons/${lesson.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: lesson.title_vi }],
    user,
    contentHtml,
  }));
}

/**
 * Section 3 Repair: Dedicated Lesson Result Page (/lessons/:lessonSlug/result)
 */
export async function renderLessonResultPage({ db, user, lessonSlug }) {
  if (!user) return redirectResponse('/login');
  const lesson = await db.prepare('SELECT * FROM wb_lessons WHERE slug = ?').bind(lessonSlug).first();
  if (!lesson) {
    return htmlResponse(renderPublicPage({ title: 'Không tìm thấy bài học', currentPath: `/lessons/${lessonSlug}/result`, user, contentHtml: '<div class="wb-alert wb-alert-error">Bài học không tồn tại.</div>' }), 404);
  }
  const sub = await db.prepare('SELECT * FROM wb_lesson_submissions WHERE account_id = ? AND lesson_id = ? ORDER BY submitted_at DESC LIMIT 1').bind(user.accountId, lesson.id).first();
  if (!sub) {
    return htmlResponse(renderPublicPage({
      title: `Kết quả: ${lesson.title_vi}`,
      currentPath: `/lessons/${lesson.slug}/result`,
      breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: lesson.title_vi, href: `/lessons/${lesson.slug}` }, { label: 'Kết quả bài học' }],
      user,
      contentHtml: `<h1>Kết quả bài học: ${escapeHtml(lesson.title_vi)}</h1><div class="wb-alert wb-alert-info">Bạn chưa có lượt nộp hoặc hoàn thành nào cho bài học này. <a href="/lessons/${escapeHtml(lesson.slug)}">Quay lại bài học</a>.</div>`,
    }));
  }

  const breakdown = JSON.parse(sub.breakdown_json || '[]');
  const skills = JSON.parse(sub.skills_assessed_json || '[]');
  const correctCount = breakdown.filter((b) => b.correct).length;
  const incorrectCount = breakdown.filter((b) => !b.correct).length;

  const contentHtml = `
    <span class="wb-badge">Trạng thái: ${escapeHtml(sub.lifecycle_status)} · Thời điểm: ${escapeHtml(sub.submitted_at)}</span>
    <h1>Kết quả bài học: ${escapeHtml(lesson.title_vi)}</h1>
    <div class="wb-grid-2" style="margin-bottom:20px;">
      <div class="wb-card">
        <h3>Tổng hợp đánh giá từ backend</h3>
        <p><strong>Điểm số:</strong> ${sub.score_percent !== null ? `${sub.score}/${sub.max_score} (${sub.score_percent}%)` : 'Không có câu chấm điểm — Ghi nhận hoàn thành nội dung đọc'}</p>
        <p><strong>Phần đúng / Phần sai:</strong> ${correctCount} đúng · ${incorrectCount} sai</p>
        <p><strong>Kỹ năng đánh giá:</strong> ${escapeHtml(skills.join(', '))}</p>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Cải thiện & Đề xuất tiếp theo</h3>
        <p><strong>Nội dung cần cải thiện:</strong> ${escapeHtml(sub.improvement_notes_vi)}</p>
        <p><strong>Đề xuất tiếp theo:</strong> ${escapeHtml(sub.next_recommendation_vi)}</p>
      </div>
    </div>
    ${breakdown.length ? `
      <h2>Chi tiết câu trả lời & Giải thích</h2>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Câu hỏi</th><th>Trả lời của bạn</th><th>Đáp án đúng</th><th>Kết quả</th><th>Giải thích</th></tr></thead><tbody>
        ${breakdown.map((b) => `<tr><td>${escapeHtml(b.prompt)}</td><td>${escapeHtml(b.given)}</td><td>${escapeHtml(b.expected)}</td><td><span class="wb-badge ${b.correct ? 'wb-badge-ok' : 'wb-badge-red'}">${b.correct ? 'Đúng' : 'Sai'}</span></td><td>${escapeHtml(b.explanationVi)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
    <div style="margin-top:18px;display:flex;gap:10px;">
      <a href="/lessons/${escapeHtml(lesson.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem lại bài học</a>
      <a href="/practice" class="wb-btn wb-btn-primary wb-btn-sm">Luyện tập mở rộng</a>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Kết quả bài học: ${lesson.title_vi}`,
    currentPath: `/lessons/${lesson.slug}/result`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Học ngoại ngữ', href: '/learning' }, { label: lesson.title_vi, href: `/lessons/${lesson.slug}` }, { label: 'Kết quả' }],
    user,
    contentHtml,
  }));
}

export async function renderMyLearningPage({ db, user, subPath = '' }) {
  if (!user) return redirectResponse('/login');
  const progress = (await db.prepare(`
    SELECT p.*, l.title_vi AS lesson_title, l.slug AS lesson_slug
    FROM wb_learner_progress p
    LEFT JOIN wb_lessons l ON l.id = p.lesson_id
    WHERE p.account_id = ?
    ORDER BY p.updated_at DESC LIMIT 30
  `).bind(user.accountId).all()).results || [];

  const title = subPath === 'history' ? 'Lịch sử học tập' : subPath === 'vocabulary' ? 'Từ vựng cá nhân' : 'Lộ trình cá nhân';
  const contentHtml = `
    <h1>${title}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/my-learning" class="wb-btn wb-btn-outline wb-btn-sm">Tổng quan lộ trình</a>
      <a href="/my-learning/history" class="wb-btn wb-btn-outline wb-btn-sm">Lịch sử học tập</a>
      <a href="/my-learning/vocabulary" class="wb-btn wb-btn-outline wb-btn-sm">Từ vựng cá nhân</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-primary wb-btn-sm">Ôn tập SRS ngay</a>
    </div>
    ${progress.length
      ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Bài học</th><th>Trạng thái</th><th>Điểm</th><th>Kết quả chi tiết</th></tr></thead><tbody>${progress.map((r) => `<tr><td><a href="/lessons/${escapeHtml(r.lesson_slug || '')}">${escapeHtml(r.lesson_title || r.lesson_id)}</a></td><td>${escapeHtml(r.status)}</td><td>${r.score_percent !== null ? `${r.score_percent}%` : 'Hoàn thành nội dung'}</td><td><a href="/lessons/${escapeHtml(r.lesson_slug || '')}/result">Xem kết quả</a></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="wb-alert wb-alert-info">Bạn chưa có tiến độ học tập nào được ghi nhận. Hãy mở một bài học tại <a href="/learning">/learning</a> để bắt đầu.</div>'}
  `;
  return htmlResponse(renderPublicPage({
    title,
    currentPath: subPath ? `/my-learning/${subPath}` : '/my-learning',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Lộ trình cá nhân', href: '/my-learning' }],
    user,
    contentHtml,
  }));
}
