/**
 * WORD BRIDGE — Cổng Luyện Tập & Khảo Thí Tham Chiếu
 * Có nội dung thực tế cho mọi kỹ năng (Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp),
 * không bao giờ trả 404 hay hiển thị từ ngữ kỹ thuật nội bộ.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

const SKILL_LABELS = {
  listening: 'Luyện Nghe (Listening)',
  speaking: 'Luyện Nói (Speaking)',
  reading: 'Luyện Đọc (Reading)',
  writing: 'Luyện Viết (Writing)',
  vocabulary: 'Luyện Từ Vựng Chuyên Ngành',
  grammar: 'Luyện Ngữ Pháp Ứng Dụng',
};

const FALLBACK_EXERCISES = [
  {
    id: 'ex_fallback_en_read',
    language_code: 'en',
    skill: 'reading',
    level_ref: 'B1–B2',
    title_vi: 'Đọc hiểu chứng từ Vận đơn đường biển (Bill of Lading)',
    instructions_vi: 'Đọc câu trích dẫn từ vận đơn quốc tế và chọn phương án diễn giải chính xác nhất.',
    rubric_summary_vi: 'Hiểu đúng vai trò sở hữu hàng hóa và nghĩa vụ giao nhận.',
    sample_prompt: '"Clean On Board Bill of Lading confirms that the cargo was loaded in apparent good order and condition." — Cụm từ "Clean On Board" thể hiện điều gì?',
    sample_options: [
      'A. Hàng hóa đã xếp lên tàu trong tình trạng bên ngoài nguyên vẹn, không ghi chú hư hỏng',
      'B. Tàu đã được vệ sinh khoang hàng trước khi khởi hành',
      'C. Cước phí vận tải biển đã được miễn giảm hoàn toàn',
    ],
  },
  {
    id: 'ex_fallback_zh_vocab',
    language_code: 'zh',
    skill: 'vocabulary',
    level_ref: 'HSK 4–5',
    title_vi: 'Thuật ngữ Đàm phán Thương mại & Thanh toán (信用证 · 不可抗力)',
    instructions_vi: 'Phân biệt chính xác thuật ngữ hợp đồng tiếng Trung để tránh nhầm lẫn nghĩa đời thường.',
    rubric_summary_vi: 'Nhận diện chuẩn thuật ngữ thanh toán và điều khoản miễn trách.',
    sample_prompt: 'Trong hợp đồng ngoại thương, điều khoản "不可抗力 (bùkě kànglì)" tương ứng với nội dung nào?',
    sample_options: [
      'A. Điều khoản bất khả kháng (Force Majeure)',
      'B. Điều khoản phạt giao hàng chậm',
      'C. Điều khoản chiết khấu thanh toán sớm',
    ],
  },
  {
    id: 'ex_fallback_en_write',
    language_code: 'en',
    skill: 'writing',
    level_ref: 'B1',
    title_vi: 'Viết Email xác nhận thông quan & lịch tàu (ETD)',
    instructions_vi: 'Soạn thảo đoạn phản hồi chuyên nghiệp (60–100 từ) gửi đối tác nhập khẩu.',
    rubric_summary_vi: 'Đầy đủ số vận đơn, lịch ETD rõ ràng, văn phong lịch sự và chuẩn thuật ngữ.',
    sample_prompt: 'Hãy viết email ngắn thông báo lô hàng container WB-2026 đã thông quan và dự kiến khởi hành vào thứ Sáu.',
    sample_options: [],
  },
  {
    id: 'ex_fallback_ru_grammar',
    language_code: 'ru',
    skill: 'grammar',
    level_ref: 'A2–B1',
    title_vi: 'Cấu trúc cách trong giao tiếp Tiếng Nga tổng quát',
    instructions_vi: 'Chọn biến thể danh từ đúng ngữ cảnh giao tiếp hằng ngày.',
    rubric_summary_vi: 'Chia đúng cách 4 (Đối cách) và cách 6 (Giới cách).',
    sample_prompt: 'Hoàn thành câu: "Мы изучаем русский ___ каждый день."',
    sample_options: ['A. язык', 'B. языка', 'C. языком'],
  },
];

export async function renderPracticePage({ services, user, skill = '' }) {
  let exercises = [];
  try {
    exercises = await services.practice.listExercises({ skill });
  } catch {
    exercises = [];
  }
  if (!exercises.length) {
    exercises = skill
      ? FALLBACK_EXERCISES.filter((e) => e.skill === skill)
      : FALLBACK_EXERCISES;
    if (!exercises.length) exercises = FALLBACK_EXERCISES;
  }

  const heading = skill ? (SKILL_LABELS[skill] || 'Cổng Luyện Tập') : 'Cổng Luyện Tập Kỹ Năng & Chuyên Ngành';
  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">CỔNG LUYỆN TẬP · TRUNG – ANH – NGA</span>
      <h1>${escapeHtml(heading)}</h1>
      <p>Thực hành bài tập theo từng kỹ năng với bộ câu hỏi chuyên ngành, chấm đáp án tự động cho trắc nghiệm, bộ đếm từ trực tiếp cho bài viết và công cụ thu âm tự luyện đọc.</p>
    </section>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/practice" class="wb-btn ${!skill ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Tất cả</a>
      <a href="/practice/listening" class="wb-btn ${skill === 'listening' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Nghe</a>
      <a href="/practice/speaking" class="wb-btn ${skill === 'speaking' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Nói</a>
      <a href="/practice/reading" class="wb-btn ${skill === 'reading' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Đọc</a>
      <a href="/practice/writing" class="wb-btn ${skill === 'writing' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Viết</a>
      <a href="/practice/vocabulary" class="wb-btn ${skill === 'vocabulary' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Từ vựng</a>
      <a href="/practice/grammar" class="wb-btn ${skill === 'grammar' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-btn-sm">Ngữ pháp</a>
      <a href="/dictionary" class="wb-btn wb-btn-ghost wb-btn-sm">Từ điển & Flashcard</a>
      <a href="/practice/history" class="wb-btn wb-btn-ghost wb-btn-sm">Lịch sử luyện tập</a>
    </div>

    ${skill === 'speaking' ? `
      <div class="wb-card" style="border-left:4px solid var(--wb-aqua);">
        <h3 style="margin-top:0;color:var(--wb-teal);">Tự luyện phát âm qua Micro</h3>
        <p class="wb-muted">Bạn có thể bật micro để tự ghi âm và nghe lại giọng đọc của mình đối chiếu với mẫu phát âm chuẩn.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-record-toggle>Ghi âm tự luyện đọc</button>
          <audio id="wb-local-playback" controls style="display:none;max-width:100%;"></audio>
        </div>
      </div>` : ''}

    <div class="wb-grid-2">
      ${exercises.map((ex) => `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span class="wb-badge">${escapeHtml(String(ex.language_code || 'en').toUpperCase())} · ${escapeHtml(ex.skill)} · ${escapeHtml(ex.level_ref)}</span>
          </div>
          <h3 style="margin:10px 0 6px;color:var(--wb-teal);">${escapeHtml(ex.title_vi)}</h3>
          <p class="wb-muted" style="margin:0 0 8px;">${escapeHtml(ex.instructions_vi)}</p>
          ${ex.sample_prompt ? `<div style="background:var(--wb-surface-2);padding:10px 12px;border-radius:8px;margin-bottom:10px;font-size:0.9rem;"><strong>Đề bài:</strong> ${escapeHtml(ex.sample_prompt)}</div>` : ''}
          <p style="font-size:0.84rem;margin:0 0 12px;"><strong>Tiêu chí đánh giá:</strong> ${escapeHtml(ex.rubric_summary_vi)}</p>
          ${user
            ? `<form class="wb-form" data-api-endpoint="/api/v1/practice/submit" data-render-json="pr-out-${escapeHtml(ex.id)}">
                <input type="hidden" name="exerciseId" value="${escapeHtml(ex.id)}" />
                ${ex.sample_options?.length
                  ? `<div style="display:grid;gap:6px;">${ex.sample_options.map((opt, idx) => `<label style="display:flex;gap:8px;align-items:center;font-size:0.88rem;"><input type="radio" name="answer_q1" value="${String.fromCharCode(65 + idx)}" /> <span>${escapeHtml(opt)}</span></label>`).join('')}</div>`
                  : `<textarea class="wb-textarea" name="answer_text" data-wb-counter="cnt-${escapeHtml(ex.id)}" placeholder="Nhập bài làm của bạn tại đây..."></textarea><div id="cnt-${escapeHtml(ex.id)}" class="wb-muted" style="font-size:0.8rem;">Số từ: 0 · Hán tự: 0 · Tổng ký tự: 0</div>`}
                <div data-form-status></div>
                <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Nộp bài & Xem kết quả</button>
              </form><div id="pr-out-${escapeHtml(ex.id)}" style="margin-top:10px;"></div>`
            : `<a href="https://portal.wordbridge.io.vn/login?next=${encodeURIComponent(`https://wordbridge.io.vn/practice${skill ? `/${skill}` : ''}`)}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập để làm & nộp bài</a>`}
        </article>`).join('')}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath: skill ? `/practice/${skill}` : '/practice',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Cổng Luyện Tập', href: '/practice' }, ...(skill ? [{ label: heading }] : [])],
    user,
    contentHtml,
  }));
}

export async function renderPracticeHistoryPage({ db, user }) {
  if (!user) return redirectResponse('https://portal.wordbridge.io.vn/login?next=https://wordbridge.io.vn/practice/history');
  const rows = (await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.account_id = ? ORDER BY r.submitted_at DESC LIMIT 30').bind(user.accountId).all()).results || [];
  return htmlResponse(renderPublicPage({
    title: 'Lịch sử luyện tập',
    currentPath: '/practice/history',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Cổng Luyện Tập', href: '/practice' }, { label: 'Lịch sử' }],
    user,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Lịch sử luyện tập cá nhân (${rows.length})</h1>
      <div class="wb-card"><div class="wb-table-wrap"><table class="wb-table">
        <thead><tr><th>Bài tập</th><th>Điểm</th><th>Trạng thái</th><th>Thời gian</th><th>Chi tiết</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.title_vi || r.exercise_id)}</td><td><strong>${r.score_percent}%</strong></td><td><span class="wb-badge">${escapeHtml(r.grading_status)}</span></td><td>${escapeHtml(r.submitted_at)}</td><td><a href="/practice/results/${escapeHtml(r.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem</a></td></tr>`).join('') || '<tr><td colspan="5">Bạn chưa có bài nộp nào.</td></tr>'}</tbody>
      </table></div></div>`,
  }));
}

export async function renderPracticeResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse('https://portal.wordbridge.io.vn/login');
  const r = await db.prepare('SELECT r.*, e.title_vi FROM wb_practice_results r LEFT JOIN wb_practice_exercises e ON e.id = r.exercise_id WHERE r.id = ? AND r.account_id = ?').bind(resultId, user.accountId).first();
  if (!r) return htmlResponse(renderPublicPage({ title: 'Không tìm thấy kết quả', user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy kết quả bài tập.</div>' }), 404);
  return htmlResponse(renderPublicPage({
    title: 'Kết quả luyện tập',
    currentPath: '/practice/history',
    user,
    contentHtml: `<div class="wb-card"><h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(r.title_vi || r.exercise_id)}</h1><p><strong>Điểm đạt được:</strong> ${r.score_percent}% · <strong>Trạng thái:</strong> ${escapeHtml(r.grading_status)}</p><a href="/practice" class="wb-btn wb-btn-primary wb-btn-sm">Quay lại Cổng Luyện Tập</a></div>`,
  }));
}

export async function renderExaminationsHub({ db, user, languageSlug = '' }) {
  let exams = [];
  try {
    exams = (await db.prepare('SELECT * FROM wb_examinations ORDER BY language_code, code').all()).results || [];
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
        <p>Đánh giá năng lực Tiếng Trung (HSK), Tiếng Anh (CEFR) và Tiếng Nga (TORFL) — hoặc tham gia kỳ thi chính thức tại <a href="https://exam.wordbridge.io.vn/" style="color:#fff;text-decoration:underline;">exam.wordbridge.io.vn</a>.</p>
      </section>
      <div class="wb-grid-2">
        ${filtered.map((ex) => `
          <article class="wb-card">
            <span class="wb-badge">${escapeHtml(ex.language_code.toUpperCase())} · ${escapeHtml(ex.level_ref)}</span>
            <h3 style="margin:10px 0 6px;color:var(--wb-teal);">${escapeHtml(ex.title_vi)}</h3>
            <p class="wb-muted">${escapeHtml(ex.description_vi || '')}</p>
            <a href="/examinations/${escapeHtml(ex.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Xem chi tiết đề thi</a>
          </article>`).join('') || '<div class="wb-card"><p>Bạn có thể truy cập trực tiếp <a href="https://exam.wordbridge.io.vn/">Cổng Khảo Thí Năng Lực</a> để xem các kỳ thi đang mở.</p></div>'}
      </div>`,
  }));
}

export async function renderExamDetailPage({ db, user, examSlug }) {
  const ex = await db.prepare('SELECT * FROM wb_examinations WHERE slug = ?').bind(examSlug).first().catch(() => null);
  if (!ex) return htmlResponse(renderPublicPage({ title: 'Khảo thí', user, contentHtml: '<div class="wb-alert wb-alert-info">Đề thi đang được cập nhật. Vui lòng xem các kỳ thi đang mở tại <a href="https://exam.wordbridge.io.vn/">exam.wordbridge.io.vn</a>.</div>' }));
  return htmlResponse(renderPublicPage({
    title: ex.title_vi,
    currentPath: '/examinations',
    user,
    contentHtml: `<div class="wb-card"><h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(ex.title_vi)}</h1><p>${escapeHtml(ex.description_vi || '')}</p><a href="https://exam.wordbridge.io.vn/" class="wb-btn wb-btn-accent">Mở Cổng Khảo Thí Trực Tuyến</a></div>`,
  }));
}

export async function renderExamAttemptPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/' : 'https://portal.wordbridge.io.vn/login');
}
export async function renderExamResultPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/tra-cuu' : 'https://portal.wordbridge.io.vn/login');
}
export async function renderExamHistoryPage({ user }) {
  return redirectResponse(user ? 'https://exam.wordbridge.io.vn/my-exams' : 'https://portal.wordbridge.io.vn/login');
}
