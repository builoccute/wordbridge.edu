/**
 * WORD BRIDGE V4 — Six-Skill Practice Center, Insights & Examination Discovery
 * - ZERO fake fallback exercises (ex_fallback_*)
 * - ZERO guest recorder (data-wb-record-toggle only for authenticated users)
 * - Real published audio assets with segment sync & dictation for Listening
 * - Real Reading passages (<blockquote>), real Practice Insights (weekly + per-skill)
 * - Examination discovery & honest handoff to exam.wordbridge.io.vn
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { ECOSYSTEM, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

const SKILL_LABELS = {
  listening: 'Luyện Nghe (Listening)',
  speaking: 'Luyện Nói (Speaking)',
  reading: 'Luyện Đọc (Reading)',
  writing: 'Luyện Viết (Writing)',
  vocabulary: 'Luyện Từ Vựng',
  grammar: 'Luyện Ngữ Pháp',
};

function safeJson(raw, fallback = []) {
  try { return JSON.parse(raw || ''); } catch { return fallback; }
}

export async function renderPracticePage({ services, db, user, skill = '' }) {
  let exercises = [];
  try {
    exercises = await services.practice.listExercises({ skill });
  } catch {
    exercises = [];
  }

  // Load real questions for each exercise from wb_question_bank
  const exercisesWithQuestions = [];
  for (const ex of exercises) {
    const qIds = safeJson(ex.question_ids_json, []);
    const questions = [];
    if (db && Array.isArray(qIds)) {
      for (const qId of qIds) {
        const q = await db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first().catch(() => null);
        if (q) questions.push(q);
      }
    }
    exercisesWithQuestions.push({ ...ex, questions });
  }

  // Load published listening audio assets if on listening skill
  let publishedAudio = [];
  if (skill === 'listening' && db) {
    try {
      publishedAudio = (await db.prepare("SELECT * FROM wb_audio_assets WHERE review_status = 'published' ORDER BY created_at DESC LIMIT 10").all()).results || [];
    } catch {
      publishedAudio = [];
    }
  }

  // Load published reading lessons/passages if on reading skill
  let readingPassages = [];
  if (skill === 'reading' && db) {
    try {
      const rows = (await db.prepare("SELECT id, slug, title_vi, language_code, level_ref, components_json FROM wb_lessons WHERE review_status = 'published' LIMIT 6").all()).results || [];
      readingPassages = rows.map((r) => {
        const comp = safeJson(r.components_json, {});
        return { ...r, readingText: comp.reading || '' };
      }).filter((r) => r.readingText);
    } catch {
      readingPassages = [];
    }
  }

  const heading = skill ? (SKILL_LABELS[skill] || 'Cổng Luyện Tập') : 'Cổng Luyện Tập Kỹ Năng & Chuyên Ngành';
  const currentPath = skill ? `/practice/${skill}` : '/practice';

  const listeningStudioHtml = skill === 'listening' ? `
    <section class="wb-card" style="margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Phòng luyện Nghe & Chép chính tả</h2>
      ${publishedAudio.length
        ? publishedAudio.map((a) => {
            const segments = safeJson(a.sync_segments_json, []);
            return `
              <div class="wb-audio-player" data-wb-audio style="margin-bottom:14px;">
                <strong>${escapeHtml(a.voice_label || 'Audio R2')} · ${escapeHtml(a.language_code.toUpperCase())}</strong>
                ${user
                  ? `<audio controls preload="none" style="width:100%;" src="/api/v1/audio/${escapeHtml(a.id)}/stream"></audio>
                     <div class="wb-audio-controls">
                       <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-audio-action="play">Phát</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="pause">Tạm dừng</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="replay">Phát lại</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="back">-5s</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="forward">+5s</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="loop">Lặp: Tắt</button>
                       <span class="wb-muted">Tốc độ: <strong data-speed-label>1.0x</strong></span>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="0.75">0.75x</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1">1.0x</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.25">1.25x</button>
                     </div>`
                  : `<p class="wb-muted">Đăng nhập để phát audio luyện nghe từ R2.</p><a href="${escapeHtml(signInUrl('/practice/listening', 'audio.listen'))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để nghe</a>`}
                ${a.transcript_text ? `<p style="margin:8px 0;" data-learning-content>${escapeHtml(a.transcript_text)}</p>` : ''}
                ${segments.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;">${segments.map((s) => `<button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-audio-segment-start="${Number(s.startMs || 0)}" data-audio-segment-end="${Number(s.endMs || 0)}">▶ ${escapeHtml(s.text || '')}</button>`).join('')}</div>` : ''}
                <div style="margin-top:10px;">
                  <label><strong>Chép chính tả</strong></label>
                  <textarea class="wb-textarea" rows="2" placeholder="Nghe từng câu và gõ lại nội dung bạn nghe được..."></textarea>
                </div>
                <div data-audio-status class="wb-muted" style="font-size:0.84rem;">Audio được phát trực tiếp từ asset đã đăng ký; transcript chỉ hiển thị khi source có dữ liệu.</div>
              </div>`;
          }).join('')
        : '<div class="wb-alert wb-alert-info">Chưa có bài Nghe đã phát hành có tệp audio xác minh. Hệ thống không tạo audio giả.</div>'}
    </section>` : '';

  const speakingStudioHtml = skill === 'speaking' ? `
    <section class="wb-card wb-recorder-studio" style="border-left:4px solid var(--wb-aqua);margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Tự luyện Nói & Phát âm qua Micro</h2>
      <p class="wb-muted">Backend hiện không cung cấp pronunciation score đã được chứng minh. Recording chỉ dùng để tự nghe lại; hệ thống không tạo điểm phát âm AI giả.</p>
      ${user
        ? `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
             <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-record-toggle>Ghi âm</button>
             <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-record-retry>Ghi lại</button>
             <span data-wb-record-status class="wb-muted" role="status">Chưa ghi âm.</span>
           </div>
           <audio id="wb-local-playback" controls hidden style="margin-top:10px;max-width:100%;"></audio>`
        : `<a href="${escapeHtml(signInUrl('/practice/speaking', 'speaking.record'))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để ghi âm</a>`}
    </section>` : '';

  const readingStudioHtml = skill === 'reading' ? `
    <section class="wb-card" style="margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Đoạn đọc học thuật đã xuất bản</h2>
      ${readingPassages.length
        ? readingPassages.slice(0, 3).map((p) => `
            <article style="margin-bottom:14px;">
              <p class="wb-eyebrow">${escapeHtml(p.language_code.toUpperCase())} · ${escapeHtml(p.level_ref)}</p>
              <h3><a href="/lessons/${escapeHtml(p.slug)}">${escapeHtml(p.title_vi)}</a></h3>
              <blockquote>${escapeHtml(p.readingText)}</blockquote>
            </article>`).join('')
        : '<blockquote>Chọn bài học trong giáo trình để đọc văn bản gốc và tra từ trực tiếp.</blockquote>'}
    </section>` : '';

  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">CỔNG LUYỆN TẬP · TRUNG – ANH – NGA</span>
      <h1>${escapeHtml(heading)}</h1>
      <p>Thực hành bài tập theo từng kỹ năng từ dữ liệu đã xuất bản. ${skill ? `Route này chỉ render exercise có skill ${escapeHtml(skill)}; không trộn nội dung từ kỹ năng khác.` : ''}</p>
    </section>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/practice" class="wb-btn ${!skill ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Tất cả</a>
      <a href="/practice/listening" class="wb-btn ${skill === 'listening' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Nghe</a>
      <a href="/practice/speaking" class="wb-btn ${skill === 'speaking' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Nói</a>
      <a href="/practice/reading" class="wb-btn ${skill === 'reading' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Đọc</a>
      <a href="/practice/writing" class="wb-btn ${skill === 'writing' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Viết</a>
      <a href="/practice/vocabulary" class="wb-btn ${skill === 'vocabulary' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Từ vựng</a>
      <a href="/practice/grammar" class="wb-btn ${skill === 'grammar' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Ngữ pháp</a>
      <a href="/my-mistakes" class="wb-btn wb-btn-ghost wb-btn-sm">My Mistakes</a>
      <a href="/practice/history" class="wb-btn wb-btn-ghost wb-btn-sm">Practice Insights</a>
    </div>

    ${listeningStudioHtml}
    ${speakingStudioHtml}
    ${readingStudioHtml}

    <div class="wb-grid-2">
      ${exercisesWithQuestions.map((ex) => `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span class="wb-badge">${escapeHtml(String(ex.language_code || 'en').toUpperCase())} · ${escapeHtml(ex.skill)} · ${escapeHtml(ex.level_ref)}</span>
          </div>
          <h3 style="margin:10px 0 6px;color:var(--wb-teal);" data-learning-content>${escapeHtml(ex.title_vi)}</h3>
          <p class="wb-muted" style="margin:0 0 8px;">${escapeHtml(ex.instructions_vi)}</p>
          <p style="font-size:0.84rem;margin:0 0 12px;"><strong>Tiêu chí đánh giá:</strong> ${escapeHtml(ex.rubric_summary_vi)}</p>
          ${user
            ? `<form class="wb-form" data-api-endpoint="/api/v1/practice/submit" data-render-json="pr-out-${escapeHtml(ex.id)}">
                <input type="hidden" name="exerciseId" value="${escapeHtml(ex.id)}" />
                ${ex.questions.map((q) => {
                  const opts = safeJson(q.options_json, []);
                  return `
                    <div class="wb-field">
                      <label data-learning-content><strong>Đề bài:</strong> ${escapeHtml(q.prompt_text)}</label>
                      ${opts.length
                        ? `<div style="display:grid;gap:6px;">${opts.map((opt) => `<label style="display:flex;gap:8px;align-items:center;font-size:0.88rem;"><input type="radio" name="answer_${escapeHtml(q.id)}" value="${escapeHtml(opt)}" /> <span>${escapeHtml(opt)}</span></label>`).join('')}</div>`
                        : `<textarea class="wb-textarea" name="answer_${escapeHtml(q.id)}" data-wb-counter="cnt-${escapeHtml(ex.id)}-${escapeHtml(q.id)}" placeholder="Nhập bài làm của bạn tại đây..."></textarea><div id="cnt-${escapeHtml(ex.id)}-${escapeHtml(q.id)}" class="wb-muted" style="font-size:0.8rem;">Số từ: 0 · Hán tự: 0 · Tổng ký tự: 0</div>`}
                    </div>`;
                }).join('')}
                <div data-form-status></div>
                <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Nộp bài & Xem kết quả</button>
              </form><div id="pr-out-${escapeHtml(ex.id)}" style="margin-top:10px;"></div>`
            : `<a href="${escapeHtml(signInUrl(currentPath, `practice.${skill || 'all'}`))}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập để làm & nộp bài</a>`}
        </article>`).join('') || '<div class="wb-alert wb-alert-info">Chưa có bài luyện tập đã xác thực cho kỹ năng này. Không có bài tập giả được tạo.</div>'}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Cổng Luyện Tập', href: '/practice' }, ...(skill ? [{ label: heading }] : [])],
    user,
    contentHtml,
  }));
}

export async function renderPracticeHistoryPage({ db, user }) {
  if (!user) return redirectResponse(signInUrl('/practice/history', 'practice.history'));
  const rows = (await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.account_id = ? ORDER BY r.submitted_at DESC, r.rowid DESC LIMIT 50').bind(user.accountId).all()).results || [];

  const gradedRows = rows.filter((r) => r.grading_status === 'auto_graded' && Number(r.max_score) > 0 && r.score != null);
  const avgAccuracy = gradedRows.length
    ? Math.round(gradedRows.reduce((sum, r) => sum + (Number(r.score) / Number(r.max_score)) * 100, 0) / gradedRows.length)
    : null;

  const bySkill = {};
  const byWeek = {};
  for (const r of rows) {
    const sk = r.skill || 'other';
    bySkill[sk] = bySkill[sk] || { total: 0, graded: 0, pctSum: 0 };
    bySkill[sk].total += 1;
    if (r.grading_status === 'auto_graded' && Number(r.max_score) > 0 && r.score != null) {
      bySkill[sk].graded += 1;
      bySkill[sk].pctSum += (Number(r.score) / Number(r.max_score)) * 100;
    }
    const dayKey = String(r.submitted_at || '').slice(0, 10) || 'Hôm nay';
    byWeek[dayKey] = (byWeek[dayKey] || 0) + 1;
  }

  return htmlResponse(renderPublicPage({
    title: 'Practice Insights & Lịch sử luyện tập',
    currentPath: '/practice/history',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Cổng Luyện Tập', href: '/practice' }, { label: 'Insights' }],
    user,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Practice Insights & Lịch sử luyện tập (${rows.length})</h1>
      <p class="wb-muted">Insights chỉ được tính từ kết quả practice đã lưu trong backend (không suy đoán thời lượng học khi chưa có dữ liệu đo thực tế).</p>
      <div class="wb-metric-row" style="margin-bottom:18px;">
        <div><strong>${rows.length}</strong><span>Tổng lượt luyện tập</span></div>
        <div><strong>${avgAccuracy !== null ? `${avgAccuracy}%` : '—'}</strong><span>Tỷ lệ chính xác trung bình</span></div>
        <div><strong>${Object.keys(bySkill).length}</strong><span>Skills có evidence</span></div>
      </div>
      <div class="wb-grid-2" style="margin-bottom:18px;">
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Hoạt động theo tuần</h2>
          ${Object.keys(byWeek).length
            ? `<ul>${Object.entries(byWeek).map(([d, cnt]) => `<li><strong>${escapeHtml(d)}</strong>: ${cnt} lượt nộp</li>`).join('')}</ul>`
            : '<p class="wb-muted">Chưa có dữ liệu hoạt động theo tuần.</p>'}
        </section>
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Hoạt động theo kỹ năng</h2>
          ${Object.keys(bySkill).length
            ? `<ul>${Object.entries(bySkill).map(([sk, st]) => `<li><strong>${escapeHtml(sk.toUpperCase())}</strong>: ${st.total} lượt · ${st.graded ? `${Math.round(st.pctSum / st.graded)}%` : 'Chờ chấm theo rubric'}</li>`).join('')}</ul>`
            : '<p class="wb-muted">Chưa có dữ liệu theo kỹ năng.</p>'}
        </section>
      </div>
      <div class="wb-card"><div class="wb-table-wrap"><table class="wb-table">
        <thead><tr><th>Mã kết quả</th><th>Bài tập</th><th>Điểm</th><th>Trạng thái</th><th>Thời gian</th><th>Chi tiết</th></tr></thead>
        <tbody>${rows.map((r) => {
          const pctLabel = r.score != null && Number(r.max_score) > 0 ? `${Math.round((Number(r.score) / Number(r.max_score)) * 100)}%` : 'Chờ đánh giá theo rubric';
          return `<tr><td><code>${escapeHtml(r.id)}</code></td><td>${escapeHtml(r.title_vi || r.exercise_id)}</td><td><strong>${pctLabel}</strong></td><td><span class="wb-badge">${escapeHtml(r.grading_status)}</span></td><td>${escapeHtml(r.submitted_at)}</td><td><a href="/practice/results/${escapeHtml(r.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem</a></td></tr>`;
        }).join('') || '<tr><td colspan="6">Bạn chưa có bài nộp nào.</td></tr>'}</tbody>
      </table></div></div>`,
  }));
}

export async function renderPracticeResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse(signInUrl(`/practice/results/${resultId}`, 'practice.result'));
  const r = await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.id = ? AND r.account_id = ?').bind(resultId, user.accountId).first();
  if (!r) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy kết quả', user, contentHtml: '<div class="wb-alert wb-alert-error">Kết quả không tồn tại hoặc không thuộc tài khoản hiện tại.</div>' }), 404);

  const feedback = safeJson(r.feedback_json, []);
  const pctLabel = r.score != null && Number(r.max_score) > 0 ? `${Math.round((Number(r.score) / Number(r.max_score)) * 100)}% (${r.score}/${r.max_score})` : 'Chờ đánh giá theo rubric';

  return htmlResponse(renderPublicPage({
    title: 'Kết quả luyện tập',
    currentPath: '/practice/history',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Cổng Luyện Tập', href: '/practice' }, { label: 'Kết quả' }],
    user,
    contentHtml: `
      <div class="wb-card">
        <h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(r.title_vi || r.exercise_id)}</h1>
        <p><strong>Điểm đạt được:</strong> ${escapeHtml(pctLabel)} · <strong>Trạng thái:</strong> <span class="wb-badge">${escapeHtml(r.grading_status)}</span></p>
        ${Array.isArray(feedback) && feedback.length ? `
          <h3>Chi tiết câu trả lời</h3>
          <ul>${feedback.map((f) => `<li><strong>${escapeHtml(f.prompt || f.questionId)}</strong> — ${f.graded ? (f.correct ? 'Đúng' : 'Cần cải thiện') : escapeHtml(f.noteVi || 'Chờ chấm')}${f.explanationVi ? ` · ${escapeHtml(f.explanationVi)}` : ''}</li>`).join('')}</ul>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
          <a href="/practice/${escapeHtml(r.skill || '')}" class="wb-btn wb-btn-primary wb-btn-sm">Luyện lại kỹ năng</a>
          <a href="/my-mistakes" class="wb-btn wb-btn-outline wb-btn-sm">Xem My Mistakes</a>
          <a href="/practice/history" class="wb-btn wb-btn-ghost wb-btn-sm">Practice Insights</a>
        </div>
      </div>`,
  }));
}

export async function renderExaminationsHub({ db, user, languageSlug = '' }) {
  let exams = [];
  try {
    exams = (await db.prepare('SELECT * FROM wb_examinations ORDER BY language_code, slug').all()).results || [];
  } catch {
    exams = [];
  }
  const codeMap = { chinese: 'zh', english: 'en', russian: 'ru' };
  const filterCode = codeMap[languageSlug] || '';
  const filtered = filterCode ? exams.filter((e) => e.language_code === filterCode) : exams;

  return htmlResponse(renderPublicPage({
    title: 'Khảo thí Năng lực',
    currentPath: '/examinations',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí' }],
    user,
    contentHtml: `
      <section class="wb-hero">
        <span class="wb-badge wb-badge-red">ĐÁNH GIÁ NĂNG LỰC NGOẠI NGỮ</span>
        <h1>Trung Tâm Khảo Thí Tham Chiếu</h1>
        <p>Miền 1 chỉ hiển thị metadata đánh giá đã phát hành và chuyển giao sang Cổng Khảo Thí (${escapeHtml(ECOSYSTEM.exam)}). Kết quả chỉ mang tính tham chiếu, không phải chứng chỉ.</p>
        <div style="margin-top:12px;">
          ${user
            ? `<a data-wb-handoff href="${escapeHtml(ECOSYSTEM.exam)}/" class="wb-btn wb-btn-accent">Mở Cổng Khảo Thí Trực Tuyến</a>`
            : `<a href="${escapeHtml(signInUrl('/examinations', 'exam.start'))}" class="wb-btn wb-btn-accent">Đăng nhập để bắt đầu đánh giá</a>`}
        </div>
      </section>
      <div class="wb-grid-2">
        ${filtered.map((ex) => `
          <article class="wb-card">
            <span class="wb-badge">${escapeHtml(ex.language_code.toUpperCase())} · ${escapeHtml(ex.level_ref)}</span>
            <h3 style="margin:10px 0 6px;color:var(--wb-teal);">${escapeHtml(ex.title_vi)}</h3>
            <p class="wb-muted">${escapeHtml(ex.instructions_vi || '')}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <a href="/examinations/${escapeHtml(ex.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem mô tả</a>
              ${user
                ? `<a data-wb-handoff href="${escapeHtml(ECOSYSTEM.exam)}/" class="wb-btn wb-btn-primary wb-btn-sm">Tiếp tục tại Cổng Khảo thí</a>`
                : `<a href="${escapeHtml(signInUrl(`/examinations/${ex.slug}`, 'exam.start'))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để dự thi</a>`}
            </div>
          </article>`).join('') || `<div class="wb-card"><p>Chưa có assessment đã phát hành trong dữ liệu hiện tại. Bạn vẫn có thể xem các kỳ thi khả dụng tại <a href="${escapeHtml(ECOSYSTEM.exam)}/">Cổng Khảo Thí Năng Lực</a>.</p></div>`}
      </div>`,
  }));
}

export async function renderExamDetailPage({ db, user, examSlug }) {
  const ex = await db.prepare('SELECT * FROM wb_examinations WHERE slug = ?').bind(examSlug).first().catch(() => null);
  if (!ex) {
    return htmlResponse(renderPublicPage({
      title: 'Không tìm thấy đánh giá',
      currentPath: `/examinations/${examSlug}`,
      user,
      contentHtml: `<div class="wb-alert wb-alert-info">Không tìm thấy assessment đã phát hành. Vui lòng xem các kỳ thi đang mở tại <a href="${escapeHtml(ECOSYSTEM.exam)}/">exam.wordbridge.io.vn</a>.</div>`,
    }), 404);
  }
  return htmlResponse(renderPublicPage({
    title: ex.title_vi,
    currentPath: `/examinations/${ex.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }, { label: ex.title_vi }],
    user,
    contentHtml: `
      <div class="wb-card">
        <span class="wb-badge">${escapeHtml(ex.language_code.toUpperCase())} · ${escapeHtml(ex.level_ref)} · ${Number(ex.duration_minutes || 0)} phút</span>
        <h1 style="margin-top:10px;color:var(--wb-teal);">${escapeHtml(ex.title_vi)}</h1>
        <p>${escapeHtml(ex.instructions_vi || '')}</p>
        <div class="wb-alert wb-alert-warn"><strong>Lưu ý:</strong> Kết quả chỉ mang tính tham chiếu năng lực học tập, không phải chứng chỉ chính thức.</div>
        ${user
          ? `<a data-wb-handoff href="${escapeHtml(ECOSYSTEM.exam)}/" class="wb-btn wb-btn-accent">Mở Cổng Khảo Thí Trực Tuyến</a>`
          : `<a href="${escapeHtml(signInUrl(`/examinations/${ex.slug}`, 'exam.start'))}" class="wb-btn wb-btn-accent">Đăng nhập để bắt đầu đánh giá</a>`}
      </div>`,
  }));
}

export async function renderExamAttemptPage({ user }) {
  return redirectResponse(user ? `${ECOSYSTEM.exam}/` : signInUrl('/examinations', 'exam.attempt'));
}
export async function renderExamResultPage({ user }) {
  return redirectResponse(user ? `${ECOSYSTEM.exam}/tra-cuu` : signInUrl('/examinations', 'exam.result'));
}
export async function renderExamHistoryPage({ user }) {
  return redirectResponse(user ? `${ECOSYSTEM.exam}/my-exams` : signInUrl('/examinations', 'exam.history'));
}
