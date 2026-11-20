/**
 * WORD BRIDGE — Practice & Examination Center Dedicated Pages (V3.1 — Section 3)
 * Dedicated pages for: /practice/results/:resultId, /examination-attempts/:attemptId,
 * /examination-results/:resultId, /examinations/history. STRICTLY NO CERTIFICATES.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { OFFICIAL_LANGUAGES } from '../config/constants.js';
import { escapeHtml, normalizeLanguageCode } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

const SKILL_LABELS = {
  listening: 'Luyện nghe (Listening)',
  speaking: 'Luyện nói (Speaking)',
  reading: 'Luyện đọc (Reading)',
  writing: 'Luyện viết (Writing)',
  vocabulary: 'Luyện từ vựng',
  grammar: 'Luyện ngữ pháp',
};

export async function renderPracticePage({ services, user, skill = '' }) {
  const exercises = await services.practice.listExercises({ skill });
  const heading = skill ? (SKILL_LABELS[skill] || 'Luyện tập') : 'Trung tâm Luyện tập Bốn Kỹ Năng';
  const contentHtml = `
    <h1>${escapeHtml(heading)}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/practice" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả</a>
      <a href="/practice/listening" class="wb-btn wb-btn-outline wb-btn-sm">Nghe</a>
      <a href="/practice/speaking" class="wb-btn wb-btn-outline wb-btn-sm">Nói</a>
      <a href="/practice/reading" class="wb-btn wb-btn-outline wb-btn-sm">Đọc</a>
      <a href="/practice/writing" class="wb-btn wb-btn-outline wb-btn-sm">Viết</a>
      <a href="/practice/vocabulary" class="wb-btn wb-btn-outline wb-btn-sm">Từ vựng</a>
      <a href="/practice/grammar" class="wb-btn wb-btn-outline wb-btn-sm">Ngữ pháp</a>
      <a href="/practice/history" class="wb-btn wb-btn-primary wb-btn-sm">Lịch sử luyện tập</a>
    </div>
    ${skill === 'speaking' ? '<div class="wb-alert wb-alert-warn">Chấm điểm phát âm tự động (ASR) hiện đang BLOCKED_UNCONFIGURED. Hệ thống hỗ trợ nghe mẫu, chủ động bật micro và tự luyện; không giả lập điểm phát âm.</div>' : ''}
    <div class="wb-grid-2">
      ${exercises.map((ex) => `
        <article class="wb-card">
          <span class="wb-badge">${escapeHtml(ex.language_code.toUpperCase())} · ${escapeHtml(ex.skill)} · ${escapeHtml(ex.level_ref)}</span>
          <h3 style="margin-top:10px;">${escapeHtml(ex.title_vi)}</h3>
          <p class="wb-muted">${escapeHtml(ex.instructions_vi)}</p>
          <p style="font-size:0.85rem;"><strong>Tiêu chí chấm:</strong> ${escapeHtml(ex.rubric_summary_vi)}</p>
          ${user
            ? `<form data-api-endpoint="/api/v1/practice/submit" data-render-json="pr-out-${escapeHtml(ex.id)}">
                <input type="hidden" name="exerciseId" value="${escapeHtml(ex.id)}" />
                <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Nộp bài & Xem chấm điểm</button>
                <div data-form-status></div>
              </form><pre id="pr-out-${escapeHtml(ex.id)}" style="font-size:0.78rem;overflow:auto;"></pre>`
            : '<a href="/login" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập để làm & nộp bài</a>'}
        </article>`).join('') || '<div class="wb-alert wb-alert-info">Chưa có bài luyện tập công bố cho bộ lọc này.</div>'}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath: skill ? `/practice/${skill}` : '/practice',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Luyện tập', href: '/practice' }, ...(skill ? [{ label: heading }] : [])],
    user,
    contentHtml,
  }));
}

export async function renderPracticeHistoryPage({ db, user }) {
  if (!user) return redirectResponse('/login');
  const rows = (await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.account_id = ? ORDER BY r.submitted_at DESC LIMIT 30').bind(user.accountId).all()).results || [];
  const contentHtml = `
    <h1>Lịch sử luyện tập</h1>
    ${rows.length
      ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Bài tập</th><th>Kỹ năng</th><th>Điểm</th><th>Trạng thái chấm</th><th>Chi tiết</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.title_vi || r.exercise_id)}</td><td>${escapeHtml(r.skill)}</td><td>${r.score ?? 'Chờ chấm'} / ${r.max_score}</td><td>${escapeHtml(r.grading_status)}</td><td><a href="/practice/results/${escapeHtml(r.id)}">Xem kết quả</a></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="wb-alert wb-alert-info">Bạn chưa có kết quả luyện tập nào.</div>'}
  `;
  return htmlResponse(renderPublicPage({ title: 'Lịch sử luyện tập', currentPath: '/practice/history', breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Luyện tập', href: '/practice' }, { label: 'Lịch sử' }], user, contentHtml }));
}

export async function renderPracticeResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse('/login');
  const row = await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.id = ? AND r.account_id = ?').bind(resultId, user.accountId).first();
  if (!row) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy kết quả', currentPath: `/practice/results/${resultId}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy kết quả luyện tập thuộc tài khoản của bạn.</div>' }), 404);
  const feedback = JSON.parse(row.feedback_json || '[]');
  const contentHtml = `
    <h1>Kết quả luyện tập: ${escapeHtml(row.title_vi || row.exercise_id)}</h1>
    <div class="wb-card" style="margin-bottom:18px;">
      <p><strong>Kỹ năng:</strong> ${escapeHtml(row.skill)} · <strong>Điểm:</strong> ${row.score ?? 'Chờ chấm rubric'} / ${row.max_score} · <strong>Trạng thái:</strong> ${escapeHtml(row.grading_status)}</p>
      <p class="wb-muted">Thời điểm nộp: ${escapeHtml(row.submitted_at)}</p>
    </div>
    <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã câu</th><th>Kết quả</th><th>Điểm</th><th>Giải thích / Ghi chú</th></tr></thead><tbody>
      ${feedback.map((f) => `<tr><td>${escapeHtml(f.questionId)}</td><td>${f.graded ? (f.correct ? 'Đúng' : 'Sai') : 'Chờ chấm'}</td><td>${f.earned ?? '-'}/${f.maxScore ?? '-'}</td><td>${escapeHtml(f.explanationVi || f.noteVi || '')}</td></tr>`).join('')}
    </tbody></table></div>
  `;
  return htmlResponse(renderPublicPage({ title: `Kết quả luyện tập ${row.id}`, currentPath: `/practice/results/${resultId}`, breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Luyện tập', href: '/practice' }, { label: 'Kết quả' }], user, contentHtml }));
}

export async function renderExaminationsHub({ db, user, languageSlug = '' }) {
  const code = languageSlug ? normalizeLanguageCode(languageSlug) : '';
  if (languageSlug && !code) return htmlResponse(renderPublicPage({ title: 'Không hỗ trợ', currentPath: `/examinations/${languageSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Khảo thí chỉ hỗ trợ Tiếng Trung, Tiếng Anh và Tiếng Nga.</div>' }), 404);
  const exams = code
    ? (await db.prepare("SELECT * FROM wb_examinations WHERE language_code = ? AND review_status = 'published'").bind(code).all()).results || []
    : (await db.prepare("SELECT * FROM wb_examinations WHERE review_status = 'published' ORDER BY language_code").all()).results || [];
  const heading = code ? `Khảo thí ${OFFICIAL_LANGUAGES[code].nameVi}` : 'Trung tâm Khảo thí WORD BRIDGE';
  const contentHtml = `
    <h1>${escapeHtml(heading)}</h1>
    <div class="wb-alert wb-alert-warn"><strong>Lưu ý học thuật:</strong> Các bài khảo thí chỉ mang tính tham chiếu HSK, CEFR và TORFL/ТРКИ. WORD BRIDGE <strong>không cấp bất kỳ loại chứng chỉ nào</strong>.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/examinations" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả</a>
      <a href="/examinations/chinese" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Trung (HSK)</a>
      <a href="/examinations/english" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Anh (CEFR)</a>
      <a href="/examinations/russian" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Nga (TORFL)</a>
      <a href="/examinations/history" class="wb-btn wb-btn-primary wb-btn-sm">Lịch sử khảo thí</a>
    </div>
    <div class="wb-grid-3">
      ${exams.map((ex) => `
        <article class="wb-card">
          <span class="wb-badge">${escapeHtml(ex.framework_reference)} · ${ex.duration_minutes} phút</span>
          <h3 style="margin-top:10px;"><a href="/examinations/${escapeHtml(ex.slug)}">${escapeHtml(ex.title_vi)}</a></h3>
          <p class="wb-muted">${escapeHtml(ex.instructions_vi)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="/examinations/${escapeHtml(ex.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Chi tiết đề thi</a>
            <a href="/examinations/${escapeHtml(ex.slug)}/instructions" class="wb-btn wb-btn-primary wb-btn-sm">Hướng dẫn làm bài</a>
          </div>
        </article>`).join('')}
    </div>
  `;
  return htmlResponse(renderPublicPage({ title: heading, currentPath: languageSlug ? `/examinations/${languageSlug}` : '/examinations', breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }], user, contentHtml }));
}

export async function renderExamDetailPage({ db, user, examSlug, isInstructions = false }) {
  const exam = await db.prepare('SELECT * FROM wb_examinations WHERE slug = ?').bind(examSlug).first();
  if (!exam) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy đề thi', currentPath: `/examinations/${examSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Đề khảo thí không tồn tại.</div>' }), 404);
  const contentHtml = `
    <span class="wb-badge">${escapeHtml(exam.framework_reference)} · ${exam.duration_minutes} phút · Ngưỡng tham chiếu: ${exam.passing_threshold}%</span>
    <h1>${escapeHtml(isInstructions ? `Hướng dẫn làm bài: ${exam.title_vi}` : exam.title_vi)}</h1>
    <div class="wb-card">
      <p>${escapeHtml(exam.instructions_vi)}</p>
      <div class="wb-alert wb-alert-warn">${escapeHtml(exam.disclaimer_vi)}</div>
      ${user
        ? `<form data-api-endpoint="/api/v1/examinations/start" data-redirect-attempt>
            <input type="hidden" name="examSlug" value="${escapeHtml(exam.slug)}" />
            <button type="submit" class="wb-btn wb-btn-primary">Bắt đầu làm bài ngay</button>
            <div data-form-status></div>
          </form>`
        : '<a href="/login" class="wb-btn wb-btn-primary">Đăng nhập để bắt đầu làm bài</a>'}
    </div>
  `;
  return htmlResponse(renderPublicPage({ title: exam.title_vi, currentPath: isInstructions ? `/examinations/${exam.slug}/instructions` : `/examinations/${exam.slug}`, breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }, { label: exam.title_vi }], user, contentHtml }));
}

/**
 * Section 3 Repair: Dedicated Exam Attempt Page (/examination-attempts/:attemptId)
 */
export async function renderExamAttemptPage({ db, user, attemptId }) {
  if (!user) return redirectResponse('/login');
  const attempt = await db.prepare('SELECT * FROM wb_examination_attempts WHERE id = ? AND account_id = ?').bind(attemptId, user.accountId).first();
  if (!attempt) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy lượt thi', currentPath: `/examination-attempts/${attemptId}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy lượt làm bài thuộc tài khoản của bạn.</div>' }), 404);
  if (attempt.status !== 'in_progress') return redirectResponse(`/examination-results/${attempt.id}`);

  const exam = await db.prepare('SELECT * FROM wb_examinations WHERE id = ?').bind(attempt.examination_id).first();
  const qIds = JSON.parse(exam.question_ids_json || '[]');
  const draft = JSON.parse(attempt.draft_answers_json || '{}');
  const questions = [];
  for (const qId of qIds) {
    const q = await db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first();
    if (q) questions.push(q);
  }

  const contentHtml = `
    <span class="wb-badge">Đang làm bài · Thời lượng: ${exam.duration_minutes} phút · Lưu nháp gần nhất: ${escapeHtml(attempt.last_saved_at)}</span>
    <h1>Làm bài khảo thí: ${escapeHtml(exam.title_vi)}</h1>
    <div class="wb-alert wb-alert-warn">${escapeHtml(exam.disclaimer_vi)}</div>
    <form class="wb-form wb-card" data-api-endpoint="/api/v1/examination-attempts/${escapeHtml(attempt.id)}/submit" data-redirect-exam-result>
      ${questions.map((q, idx) => {
        const opts = JSON.parse(q.options_json || '[]');
        const saved = draft[q.id] || '';
        return `
          <div class="wb-field">
            <label>Câu ${idx + 1} (${q.max_score} điểm): ${escapeHtml(q.prompt_text)}</label>
            ${opts.length
              ? `<select class="wb-select" name="answer_${escapeHtml(q.id)}"><option value="">-- Chọn đáp án --</option>${opts.map((o) => `<option value="${escapeHtml(o)}" ${saved === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>`
              : `<textarea class="wb-textarea" name="answer_${escapeHtml(q.id)}" rows="4">${escapeHtml(saved)}</textarea>`}
          </div>`;
      }).join('')}
      <div data-form-status></div>
      <button type="submit" class="wb-btn wb-btn-primary">Nộp bài & Chấm điểm</button>
    </form>
  `;
  return htmlResponse(renderPublicPage({ title: `Làm bài: ${exam.title_vi}`, currentPath: `/examination-attempts/${attempt.id}`, breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }, { label: 'Làm bài' }], user, contentHtml }));
}

/**
 * Section 3 Repair: Dedicated Exam Result & Review Page (/examination-results/:resultId)
 */
export async function renderExamResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse('/login');
  const attempt = await db.prepare('SELECT a.*, e.title_vi, e.framework_reference, e.passing_threshold, e.disclaimer_vi FROM wb_examination_attempts a JOIN wb_examinations e ON e.id = a.examination_id WHERE a.id = ? AND a.account_id = ?').bind(resultId, user.accountId).first();
  if (!attempt) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy kết quả khảo thí', currentPath: `/examination-results/${resultId}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy kết quả khảo thí thuộc tài khoản của bạn.</div>' }), 404);
  const breakdown = JSON.parse(attempt.result_breakdown_json || '[]');

  const contentHtml = `
    <span class="wb-badge">${escapeHtml(attempt.framework_reference)} · Trạng thái: ${escapeHtml(attempt.status)}</span>
    <h1>Kết quả khảo thí: ${escapeHtml(attempt.title_vi)}</h1>
    <div class="wb-alert wb-alert-warn">${escapeHtml(attempt.disclaimer_vi)} (certificateIssued: false)</div>
    <div class="wb-card" style="margin-bottom:18px;">
      <p><strong>Điểm số:</strong> ${attempt.score ?? '-'} / ${attempt.max_score ?? '-'} (${attempt.score_percent ?? 0}%)</p>
      <p><strong>Ngưỡng tham chiếu:</strong> ${attempt.passing_threshold}% · <strong>Nộp lúc:</strong> ${escapeHtml(attempt.submitted_at || '')}</p>
    </div>
    <h2>Xem lại từng câu & Giải thích</h2>
    <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã câu</th><th>Kết quả</th><th>Điểm</th><th>Giải thích</th></tr></thead><tbody>
      ${breakdown.map((b) => `<tr><td>${escapeHtml(b.questionId)}</td><td><span class="wb-badge ${b.correct ? 'wb-badge-ok' : 'wb-badge-red'}">${b.correct ? 'Đúng' : 'Sai / Chờ chấm'}</span></td><td>${b.earned ?? 0}/${b.maxScore ?? 0}</td><td>${escapeHtml(b.explanationVi || b.noteVi || '')}</td></tr>`).join('')}
    </tbody></table></div>
    <div style="margin-top:16px;"><a href="/examinations/history" class="wb-btn wb-btn-outline wb-btn-sm">Xem lịch sử khảo thí</a></div>
  `;
  return htmlResponse(renderPublicPage({ title: `Kết quả: ${attempt.title_vi}`, currentPath: `/examination-results/${resultId}`, breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }, { label: 'Kết quả' }], user, contentHtml }));
}

/**
 * Section 3 Repair: Dedicated Exam History Page (/examinations/history)
 */
export async function renderExamHistoryPage({ db, user }) {
  if (!user) return redirectResponse('/login');
  const rows = (await db.prepare('SELECT a.*, e.title_vi, e.framework_reference FROM wb_examination_attempts a JOIN wb_examinations e ON e.id = a.examination_id WHERE a.account_id = ? ORDER BY a.started_at DESC LIMIT 30').bind(user.accountId).all()).results || [];
  const contentHtml = `
    <h1>Lịch sử khảo thí cá nhân</h1>
    ${rows.length
      ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Đề khảo thí</th><th>Khung tham chiếu</th><th>Trạng thái</th><th>Điểm</th><th>Thao tác</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.title_vi)}</td><td>${escapeHtml(r.framework_reference)}</td><td>${escapeHtml(r.status)}</td><td>${r.score_percent !== null ? `${r.score_percent}%` : '-'}</td><td>${r.status === 'in_progress' ? `<a href="/examination-attempts/${escapeHtml(r.id)}" class="wb-btn wb-btn-primary wb-btn-sm">Tiếp tục làm bài</a>` : `<a href="/examination-results/${escapeHtml(r.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem kết quả</a>`}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="wb-alert wb-alert-info">Bạn chưa tham gia lượt khảo thí nào. Khám phá đề thi tại <a href="/examinations">/examinations</a>.</div>'}
  `;
  return htmlResponse(renderPublicPage({ title: 'Lịch sử khảo thí', currentPath: '/examinations/history', breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Khảo thí', href: '/examinations' }, { label: 'Lịch sử' }], user, contentHtml }));
}
