/**
 * WORD BRIDGE — 100% Vietnamese Administration Console Pages (V3.2 — Section 58)
 * Every single one of the 24 /admin/* routes queries and displays its OWN dedicated D1 data table.
 */

import { renderAdminPage } from '../layouts/site-layout.js';
import { ADMIN_CENTERS, RBAC_ROLES, INTELLIGENCE_SYSTEMS } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

const ADMIN_ROUTE_TITLES = {
  '': 'Bảng điều khiển quản trị',
  accounts: 'Quản lý tài khoản người dùng',
  roles: 'Quản lý vai trò (RBAC)',
  permissions: 'Ma trận phân quyền chi tiết',
  languages: 'Trung tâm đa ngôn ngữ (Trung – Anh – Nga)',
  programs: 'Quản lý chương trình học (CMS)',
  curricula: 'Quản lý giáo trình',
  courses: 'Quản lý khóa học',
  modules: 'Quản lý học phần',
  weeks: 'Quản lý tuần học (20 thành phần)',
  lessons: 'Trung tâm biên tập học liệu & Bài học',
  resources: 'Quản lý học liệu & Âm thanh R2',
  vocabulary: 'Quản lý kho từ vựng & Sổ từ',
  grammar: 'Quản lý ngữ pháp',
  dictionary: 'Trung tâm chất lượng ngôn ngữ & Từ điển',
  practice: 'Quản lý bài luyện tập',
  'question-bank': 'Quản lý ngân hàng câu hỏi',
  examinations: 'Trung tâm quản trị khảo thí',
  'learner-meet': 'Giám sát Learner Meet (Metadata)',
  'language-intelligence': 'Trung tâm trí tuệ học tập (Trạng thái 15 Hệ thống)',
  email: 'Quản trị hệ thống Email tự động',
  'audit-logs': 'Trung tâm bảo mật & Nhật ký kiểm toán',
  infrastructure: 'Trung tâm vận hành hạ tầng (D1/R2 & Tác vụ nền)',
  settings: 'Cấu hình nền tảng WORD BRIDGE',
};

const INTEL_STATUS_LABELS_VI = {
  active: 'Đang hoạt động',
  unconfigured: 'Chưa cấu hình',
  paused: 'Tạm ngừng',
  error: 'Lỗi',
  not_implemented: 'Chưa triển khai',
};

function renderSimpleTable(headers, rows, emptyText = 'Chưa có bản ghi dữ liệu.') {
  return `
    <div class="wb-table-wrap">
      <table class="wb-table">
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.length
            ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
            : `<tr><td colspan="${headers.length}">${escapeHtml(emptyText)}</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

export async function renderAdminRoute({ db, services, user, subPath = '' }) {
  if (!user) return redirectResponse('https://portal.wordbridge.io.vn/login');
  if (!services.auth.hasAnyAdminRole(user)) {
    return htmlResponse('<h1>403 — Không có quyền truy cập khu vực quản trị WORD BRIDGE.</h1><p>Vai trò quản trị phải được cấp hợp lệ thông qua hệ thống phân quyền RBAC.</p><a href="/">Về trang chủ</a>', 403);
  }

  const title = ADMIN_ROUTE_TITLES[subPath];
  if (!title) {
    return htmlResponse(renderAdminPage({ title: 'Không tìm thấy trang quản trị', currentPath: `/admin/${subPath}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Đường dẫn quản trị không tồn tại.</div>' }), 404);
  }

  let contentHtml = '';
  if (subPath === '') {
    const metrics = await services.admin.getDashboardMetrics();
    contentHtml = `
      <div class="wb-grid">
        <div class="wb-card"><div class="wb-muted">Tài khoản cá nhân</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.accounts}</div></div>
        <div class="wb-card"><div class="wb-muted">Chương trình học</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.programs}</div></div>
        <div class="wb-card"><div class="wb-muted">Tuần giáo trình</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.weeks}</div></div>
        <div class="wb-card"><div class="wb-muted">Bài học thực tế</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.lessons}</div></div>
        <div class="wb-card"><div class="wb-muted">Mục từ từ điển</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.dictionaryEntries}</div></div>
        <div class="wb-card"><div class="wb-muted">Nhật ký kiểm toán</div><div style="font-size:1.8rem;font-weight:800;color:#146466;">${metrics.counts.auditLogs}</div></div>
      </div>
      <h2 style="margin-top:26px;color:#146466;">Bảy trung tâm quản trị chuyên sâu</h2>
      <div class="wb-grid-3">${ADMIN_CENTERS.map((c) => `<div class="wb-card"><h3>${escapeHtml(c.nameVi)}</h3><a href="${c.route}" class="wb-btn wb-btn-outline wb-btn-sm">Truy cập trung tâm</a></div>`).join('')}</div>`;
  } else if (subPath === 'accounts') {
    const rows = (await db.prepare('SELECT id, full_name, email, school_name, workplace_name, status, email_verified, created_at FROM wb_accounts ORDER BY created_at DESC LIMIT 50').all()).results || [];
    contentHtml = renderSimpleTable(['Họ và tên', 'Email', 'Trường học', 'Nơi làm việc', 'Xác minh', 'Trạng thái'], rows.map((r) => [escapeHtml(r.full_name), escapeHtml(r.email), escapeHtml(r.school_name), escapeHtml(r.workplace_name), r.email_verified ? 'Đã xác minh' : 'Chưa', `<span class="wb-badge">${escapeHtml(r.status)}</span>`]));
  } else if (subPath === 'languages') {
    const rows = (await db.prepare('SELECT * FROM wb_languages ORDER BY code').all()).results || [];
    contentHtml = renderSimpleTable(['Mã', 'Tên ngôn ngữ', 'Học chuyên ngành', 'Khung quy chiếu', 'Hệ chữ viết'], rows.map((r) => [`<code>${escapeHtml(r.code)}</code>`, escapeHtml(r.name_vi), r.has_specialized ? 'Có' : 'Không (khóa cứng)', escapeHtml(r.proficiency_framework), escapeHtml(r.script_system)]));
  } else if (subPath === 'programs') {
    const programs = (await db.prepare('SELECT id, code, name_vi, language_code, program_type, review_status, version FROM wb_programs ORDER BY language_code, code').all()).results || [];
    contentHtml = `
      <div class="wb-card" style="margin-bottom:20px;">
        <h3>Tạo mới chương trình học (CMS Học thuật — RBAC)</h3>
        <form class="wb-form" data-api-endpoint="/api/v1/admin/programs">
          <div class="wb-field"><label>Mã chương trình</label><input class="wb-input" name="code" required /></div>
          <div class="wb-field"><label>Đường dẫn (slug)</label><input class="wb-input" name="slug" required /></div>
          <div class="wb-field"><label>Tên chương trình</label><input class="wb-input" name="nameVi" required /></div>
          <div class="wb-field"><label>Ngôn ngữ</label><select class="wb-select" name="languageCode"><option value="zh">Tiếng Trung (zh)</option><option value="en">Tiếng Anh (en)</option><option value="ru">Tiếng Nga (ru)</option></select></div>
          <div class="wb-field"><label>Loại chương trình</label><select class="wb-select" name="programType"><option value="foundation">Nền tảng</option><option value="general">Tổng quát</option><option value="specialized">Chuyên ngành (chỉ Trung & Anh)</option></select></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary">Tạo bản nháp chương trình</button>
        </form>
      </div>
      ${renderSimpleTable(['Mã', 'Tên chương trình', 'Ngôn ngữ', 'Loại', 'Trạng thái duyệt'], programs.map((p) => [`<code>${escapeHtml(p.code)}</code>`, escapeHtml(p.name_vi), escapeHtml(p.language_code.toUpperCase()), escapeHtml(p.program_type), `<span class="wb-badge">${escapeHtml(p.review_status)}</span>`]))}`;
  } else if (subPath === 'curricula') {
    const rows = (await db.prepare('SELECT code, title_vi, version, review_status, academic_approval_note FROM wb_curricula ORDER BY code').all()).results || [];
    contentHtml = renderSimpleTable(['Mã giáo trình', 'Tên giáo trình', 'Phiên bản', 'Trạng thái', 'Ghi chú duyệt'], rows.map((r) => [`<code>${escapeHtml(r.code)}</code>`, escapeHtml(r.title_vi), escapeHtml(r.version), `<span class="wb-badge">${escapeHtml(r.review_status)}</span>`, escapeHtml(r.academic_approval_note || '')]));
  } else if (subPath === 'courses') {
    const rows = (await db.prepare('SELECT slug, title_vi, language_code, total_weeks, sessions_per_week, review_status FROM wb_courses ORDER BY language_code, slug').all()).results || [];
    contentHtml = renderSimpleTable(['Khóa học', 'Ngôn ngữ', 'Số tuần', 'Buổi/tuần', 'Trạng thái'], rows.map((r) => [`<a href="/courses/${escapeHtml(r.slug)}">${escapeHtml(r.title_vi)}</a>`, escapeHtml(r.language_code.toUpperCase()), String(r.total_weeks), String(r.sessions_per_week), `<span class="wb-badge">${escapeHtml(r.review_status)}</span>`]));
  } else if (subPath === 'modules') {
    const rows = (await db.prepare('SELECT m.slug, m.title_vi, c.title_vi AS course_title, m.sort_order FROM wb_modules m JOIN wb_courses c ON c.id = m.course_id ORDER BY c.slug, m.sort_order').all()).results || [];
    contentHtml = renderSimpleTable(['Học phần', 'Thuộc khóa học', 'Thứ tự'], rows.map((r) => [`<a href="/modules/${escapeHtml(r.slug)}">${escapeHtml(r.title_vi)}</a>`, escapeHtml(r.course_title), String(r.sort_order)]));
  } else if (subPath === 'weeks') {
    const rows = (await db.prepare('SELECT slug, week_number, name_vi, topic_vi, sessions_count FROM wb_weeks ORDER BY slug LIMIT 50').all()).results || [];
    contentHtml = renderSimpleTable(['Tuần', 'Tên tuần', 'Chủ đề', 'Số buổi'], rows.map((r) => [String(r.week_number), `<a href="/weeks/${escapeHtml(r.slug)}">${escapeHtml(r.name_vi)}</a>`, escapeHtml(r.topic_vi), String(r.sessions_count)]));
  } else if (subPath === 'lessons') {
    const rows = (await db.prepare('SELECT slug, title_vi, language_code, level_ref, version, review_status FROM wb_lessons ORDER BY language_code, slug LIMIT 60').all()).results || [];
    contentHtml = renderSimpleTable(['Bài học', 'Ngôn ngữ', 'Trình độ', 'Phiên bản', 'Trạng thái'], rows.map((r) => [`<a href="/lessons/${escapeHtml(r.slug)}">${escapeHtml(r.title_vi)}</a>`, escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.level_ref), escapeHtml(r.version), `<span class="wb-badge">${escapeHtml(r.review_status)}</span>`]));
  } else if (subPath === 'resources') {
    const resRows = (await db.prepare('SELECT title_vi, language_code, resource_type, r2_object_key, visibility FROM wb_learning_resources LIMIT 40').all()).results || [];
    const audRows = (await db.prepare('SELECT id, language_code, r2_object_key, voice_label, review_status FROM wb_audio_assets').all()).results || [];
    contentHtml = `<h2>Tài nguyên Âm thanh R2</h2>${renderSimpleTable(['Mã', 'Ngôn ngữ', 'R2 Object Key', 'Giọng đọc', 'Trạng thái'], audRows.map((a) => [`<code>${escapeHtml(a.id)}</code>`, escapeHtml(a.language_code.toUpperCase()), `<code>${escapeHtml(a.r2_object_key)}</code>`, escapeHtml(a.voice_label), `<span class="wb-badge">${escapeHtml(a.review_status)}</span>`]))}<h2 style="margin-top:20px;">Học liệu bài học</h2>${renderSimpleTable(['Tên học liệu', 'Ngôn ngữ', 'Loại', 'R2 Key', 'Quyền'], resRows.map((r) => [escapeHtml(r.title_vi), escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.resource_type), `<code>${escapeHtml(r.r2_object_key || '')}</code>`, escapeHtml(r.visibility)]))}`;
  } else if (subPath === 'vocabulary' || subPath === 'dictionary') {
    const rows = (await db.prepare('SELECT language_code, headword, phonetic, meaning_vi, level_ref, specialized_domain, review_status FROM wb_dictionary_entries ORDER BY language_code, headword LIMIT 60').all()).results || [];
    contentHtml = renderSimpleTable(['Ngôn ngữ', 'Từ gốc', 'Phiên âm', 'Nghĩa tiếng Việt', 'Trình độ / Ngành', 'Trạng thái'], rows.map((r) => [escapeHtml(r.language_code.toUpperCase()), `<strong>${escapeHtml(r.headword)}</strong>`, `<code>${escapeHtml(r.phonetic)}</code>`, escapeHtml(r.meaning_vi), escapeHtml(r.specialized_domain || r.level_ref), `<span class="wb-badge">${escapeHtml(r.review_status)}</span>`]));
  } else if (subPath === 'grammar') {
    const rows = (await db.prepare('SELECT language_code, title_vi, level_ref, structure_formula, review_status FROM wb_grammar_topics ORDER BY language_code').all()).results || [];
    contentHtml = renderSimpleTable(['Ngôn ngữ', 'Chủ điểm ngữ pháp', 'Trình độ', 'Công thức', 'Trạng thái'], rows.map((r) => [escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.title_vi), escapeHtml(r.level_ref), `<code>${escapeHtml(r.structure_formula)}</code>`, escapeHtml(r.review_status)]));
  } else if (subPath === 'practice') {
    const rows = (await db.prepare('SELECT slug, title_vi, language_code, skill, level_ref FROM wb_practice_exercises ORDER BY language_code, skill').all()).results || [];
    contentHtml = renderSimpleTable(['Bài luyện tập', 'Ngôn ngữ', 'Kỹ năng', 'Trình độ'], rows.map((r) => [escapeHtml(r.title_vi), escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.skill), escapeHtml(r.level_ref)]));
  } else if (subPath === 'question-bank') {
    const rows = (await db.prepare('SELECT id, language_code, skill, question_type, level_ref, max_score, auto_gradable FROM wb_question_bank ORDER BY language_code').all()).results || [];
    contentHtml = renderSimpleTable(['Mã câu', 'Ngôn ngữ', 'Kỹ năng', 'Dạng câu hỏi', 'Trình độ', 'Chấm tự động'], rows.map((r) => [`<code>${escapeHtml(r.id)}</code>`, escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.skill), escapeHtml(r.question_type), escapeHtml(r.level_ref), r.auto_gradable ? 'Có' : 'Chấm rubric']));
  } else if (subPath === 'examinations') {
    const rows = (await db.prepare('SELECT slug, title_vi, language_code, framework_reference, duration_minutes, passing_threshold FROM wb_examinations ORDER BY language_code').all()).results || [];
    contentHtml = `<div class="wb-alert wb-alert-warn">Khảo thí tham chiếu — khóa cứng chính sách không cấp chứng chỉ.</div>` + renderSimpleTable(['Đề khảo thí', 'Ngôn ngữ', 'Khung tham chiếu', 'Thời lượng', 'Ngưỡng'], rows.map((r) => [`<a href="/examinations/${escapeHtml(r.slug)}">${escapeHtml(r.title_vi)}</a>`, escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.framework_reference), `${r.duration_minutes} phút`, `${r.passing_threshold}%`]));
  } else if (subPath === 'learner-meet') {
    const rows = (await db.prepare('SELECT session_code, language_code, mode, topic_vi, status, created_at FROM wb_learner_meet_sessions ORDER BY created_at DESC LIMIT 30').all()).results || [];
    contentHtml = `<div class="wb-alert wb-alert-info">Chỉ lưu metadata vận hành tối thiểu; tuyệt đối không ghi âm/ghi hình hoặc chat văn bản.</div>` + renderSimpleTable(['Mã phiên', 'Ngôn ngữ', 'Chế độ', 'Chủ đề', 'Trạng thái', 'Tạo lúc'], rows.map((r) => [`<code>${escapeHtml(r.session_code)}</code>`, escapeHtml(r.language_code.toUpperCase()), escapeHtml(r.mode), escapeHtml(r.topic_vi), escapeHtml(r.status), escapeHtml(r.created_at)]), 'Chưa có phiên Learner Meet nào.');
  } else if (subPath === 'language-intelligence') {
    const statuses = (await db.prepare('SELECT * FROM wb_intelligence_status').all()).results || [];
    const statusMap = new Map(statuses.map((s) => [s.system_slug, s]));
    contentHtml = renderSimpleTable(['Mã', 'Tên hệ thống', 'Phạm vi', 'Trạng thái vận hành', 'Ghi chú quản trị'], INTELLIGENCE_SYSTEMS.map((s) => {
      const st = statusMap.get(s.slug);
      const code = st?.operational_status || 'active';
      return [escapeHtml(s.code), `<strong>${escapeHtml(s.nameVi)}</strong>`, escapeHtml(s.languages.join(', ').toUpperCase()), `<span class="wb-badge">${escapeHtml(INTEL_STATUS_LABELS_VI[code] || code)}</span>`, escapeHtml(st?.admin_note_vi || '')];
    }));
  } else if (subPath === 'roles' || subPath === 'permissions') {
    const perms = (await db.prepare('SELECT * FROM wb_permissions ORDER BY resource, action').all()).results || [];
    contentHtml = `<div class="wb-grid-3" style="margin-bottom:20px;">${RBAC_ROLES.map((r) => `<div class="wb-card"><h3>${escapeHtml(r.nameVi)}</h3><p class="wb-muted" style="font-size:0.88rem;">Mã: ${escapeHtml(r.code)}</p><p style="margin:0;">${escapeHtml(r.descriptionVi)}</p></div>`).join('')}</div>` + renderSimpleTable(['Mã quyền', 'Tài nguyên', 'Hành động', 'Mô tả'], perms.map((p) => [`<code>${escapeHtml(p.code)}</code>`, escapeHtml(p.resource), escapeHtml(p.action), escapeHtml(p.description_vi)]));
  } else if (subPath === 'email') {
    const events = (await db.prepare('SELECT * FROM wb_email_events ORDER BY created_at DESC LIMIT 30').all()).results || [];
    contentHtml = renderSimpleTable(['Sự kiện', 'Mẫu', 'Người gửi', 'Người nhận', 'Trạng thái', 'Thời gian'], events.map((e) => [escapeHtml(e.event_type), escapeHtml(e.template_key), escapeHtml(e.sender_address), escapeHtml(e.recipient_email), `<span class="wb-badge">${escapeHtml(e.delivery_status)}</span>`, escapeHtml(e.created_at)]), 'Chưa có sự kiện email nào.');
  } else if (subPath === 'audit-logs') {
    const logs = (await db.prepare('SELECT * FROM wb_audit_logs ORDER BY created_at DESC LIMIT 40').all()).results || [];
    contentHtml = renderSimpleTable(['Thời gian', 'Tác nhân', 'Hành động', 'Tài nguyên', 'IP'], logs.map((l) => [escapeHtml(l.created_at), escapeHtml(l.actor_account_id || 'Hệ thống'), escapeHtml(l.action), `${escapeHtml(l.resource_type)} (${escapeHtml(l.resource_id || '')})`, escapeHtml(l.ip_address || '')]), 'Chưa có bản ghi kiểm toán.');
  } else if (subPath === 'infrastructure') {
    const jobs = (await db.prepare('SELECT * FROM wb_background_jobs ORDER BY job_name').all()).results || [];
    contentHtml = `<div class="wb-grid-2" style="margin-bottom:20px;"><div class="wb-card"><h3>Cloudflare D1</h3><p>Database: <strong>word</strong> · ID: <code>ce84cc48-6d49-409b-b45a-13ba3bc4a771</code></p></div><div class="wb-card"><h3>Cloudflare R2</h3><p>Bucket: <strong>word</strong> · Không lưu bản ghi Learner Meet.</p></div></div>` + renderSimpleTable(['Tên tác vụ', 'Mục tiêu', 'Lịch chạy', 'Trạng thái', 'Lần chạy gần nhất'], jobs.map((j) => [`<strong>${escapeHtml(j.job_name)}</strong>`, escapeHtml(j.objective_vi), `<code>${escapeHtml(j.schedule_expr)}</code>`, escapeHtml(j.status), escapeHtml(j.last_run_at || 'Chưa chạy')]));
  } else {
    const cfg = (await db.prepare('SELECT * FROM wb_platform_config ORDER BY config_key').all()).results || [];
    contentHtml = renderSimpleTable(['Khóa cấu hình', 'Giá trị', 'Mô tả'], cfg.map((c) => [`<code>${escapeHtml(c.config_key)}</code>`, escapeHtml(c.config_value), escapeHtml(c.description_vi)]));
  }

  return htmlResponse(renderAdminPage({ title, currentPath: subPath ? `/admin/${subPath}` : '/admin', user, contentHtml }));
}
