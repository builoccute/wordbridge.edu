/**
 * WORD BRIDGE V4.1 — Supreme Administration Center (/quan-tri)
 * Real Backend-Connected Super Admin & RBAC Control Plane on wordbridge.io.vn/quan-tri
 * 7 Subsystems: Overview, Accounts, Staff & RBAC, Academic, Data & Storage (D1/R2), Security, Operations.
 * Zero fake data, strict server-side auth & RBAC verification.
 */

import { renderAdminPage } from '../layouts/site-layout.js';
import { ADMIN_CENTERS, RBAC_ROLES, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

function renderAdminNav(activeId) {
  return `
    <nav aria-label="Phân hệ quản trị" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding:12px;background:var(--wb-surface-alt, #f4f8f8);border-radius:10px;border:1px solid var(--wb-border, #d8e5e5);">
      ${ADMIN_CENTERS.map((c) => `
        <a href="${escapeHtml(c.route)}" class="wb-btn wb-btn-sm ${c.id === activeId ? 'wb-btn-primary' : 'wb-btn-outline'}">${escapeHtml(c.nameVi)}</a>
      `).join('')}
    </nav>`;
}

export async function renderQuanTriPage({ services, user, section = 'overview', url, runtime = null }) {
  const currentPath = section === 'overview' ? '/quan-tri' : `/quan-tri/${section}`;
  if (!user) {
    return redirectResponse(signInUrl(currentPath, 'admin.access'));
  }
  if (!services.auth.hasAnyAdminRole(user)) {
    return htmlResponse(renderAdminPage({
      title: '403 — Không có quyền quản trị',
      currentPath,
      user,
      runtime,
      contentHtml: `
        <section class="wb-alert wb-alert-error" role="alert">
          <h1>403 — Truy cập bị từ chối</h1>
          <p>Tài khoản <strong>${escapeHtml(user.email)}</strong> không có vai trò quản trị được cấp phép để truy cập Trung tâm Quản trị Tối cao <code>/quan-tri</code>.</p>
          <a href="/" class="wb-btn wb-btn-outline">Quay về trang chủ</a>
        </section>`,
    }), 403);
  }

  const roleHeader = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
      <div>
        <span class="wb-badge wb-badge-red">TRUNG TÂM QUẢN TRỊ TỐI CAO · wordbridge.io.vn/quan-tri</span>
        <h1 style="margin:6px 0 0;color:var(--wb-teal);">Điều hành Nền tảng WORD BRIDGE</h1>
      </div>
      <div class="wb-muted" style="font-size:0.86rem;">
        Quản trị viên: <strong>${escapeHtml(user.fullName)}</strong> · Vai trò: <code>${escapeHtml(user.roles.join(', '))}</code>
      </div>
    </div>
    ${renderAdminNav(section)}`;

  let bodyHtml = '';
  let pageTitle = 'Trung tâm Quản trị Tối cao';

  if (section === 'overview') {
    const m = await services.admin.getDashboardMetrics();
    const c = m.counts;
    bodyHtml = `
      <div class="wb-grid-4">
        <div class="wb-card"><div class="wb-muted">Tổng tài khoản</div><div style="font-size:1.7rem;font-weight:800;color:var(--wb-teal);">${c.accounts}</div><div class="wb-muted" style="font-size:0.8rem;">Hoạt động: ${c.accountsActive} · Đã xác minh: ${c.accountsVerified}</div></div>
        <div class="wb-card"><div class="wb-muted">Phiên đang hoạt động</div><div style="font-size:1.7rem;font-weight:800;color:var(--wb-teal);">${c.activeSessions}</div><div class="wb-muted" style="font-size:0.8rem;">Tài khoản khóa/chờ: ${c.accountsLocked}</div></div>
        <div class="wb-card"><div class="wb-muted">Học liệu thực tế (D1)</div><div style="font-size:1.7rem;font-weight:800;color:var(--wb-teal);">${c.lessons} bài</div><div class="wb-muted" style="font-size:0.8rem;">${c.programs} CT · ${c.courses} khóa · ${c.dictionaryEntries} từ · ${c.readerDocuments} tài liệu Reader</div></div>
        <div class="wb-card"><div class="wb-muted">Luyện tập & Hỗ trợ</div><div style="font-size:1.7rem;font-weight:800;color:var(--wb-teal);">${c.practiceResults} bài nộp</div><div class="wb-muted" style="font-size:0.8rem;">${c.practiceExercises} bài luyện · ${c.supportOpen}/${c.supportTotal} yêu cầu hỗ trợ mở</div></div>
      </div>

      <div class="wb-grid-2" style="margin-top:16px;">
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Sức khỏe hệ thống</h2>
          <ul>
            <li><strong>Cloudflare D1:</strong> ${m.health.d1Connected ? 'Đã kết nối' : 'Mất kết nối'}</li>
            <li><strong>Cloudflare R2 (bucket word):</strong> ${m.health.r2Connected ? 'Đã kết nối' : 'Chưa gắn binding (môi trường cục bộ)'}</li>
            <li><strong>Chế độ bảo trì:</strong> ${m.health.maintenanceMode ? '<span class="wb-badge wb-badge-red">ĐANG BẬT</span>' : '<span class="wb-badge">Bình thường</span>'}</li>
            <li><strong>Email hệ thống:</strong> ${c.emailEvents} sự kiện (${c.emailFailed} lỗi/chưa cấu hình)</li>
          </ul>
        </section>
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Cảnh báo vận hành (${m.alerts.length})</h2>
          ${m.alerts.length === 0
            ? '<p class="wb-muted">Không có cảnh báo vận hành nào.</p>'
            : `<ul>${m.alerts.map((a) => `<li><strong>[${escapeHtml(a.level.toUpperCase())}]</strong> ${escapeHtml(a.message)}</li>`).join('')}</ul>`}
        </section>
      </div>

      <section class="wb-card" style="margin-top:16px;">
        <h2 style="margin-top:0;color:var(--wb-teal);">Nhật ký kiểm toán mới nhất (${c.auditLogs} bản ghi)</h2>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Tài nguyên</th><th>IP</th></tr></thead>
            <tbody>
              ${m.recentAudits.map((a) => `<tr><td>${escapeHtml(a.created_at)}</td><td>${escapeHtml(a.actor_email || 'Hệ thống')}</td><td><code>${escapeHtml(a.action)}</code></td><td>${escapeHtml(a.resource_type)} (${escapeHtml(a.resource_id || '')})</td><td>${escapeHtml(a.ip_address || '')}</td></tr>`).join('') || '<tr><td colspan="5">Chưa có nhật ký nào.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>`;
  } else if (section === 'accounts') {
    pageTitle = 'Quản trị Tài khoản';
    const q = url?.searchParams?.get('q') || '';
    const status = url?.searchParams?.get('status') || '';
    const res = await services.admin.listAccounts(user, { q, status });
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      bodyHtml = `
        <form method="GET" action="/quan-tri/accounts" class="wb-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
          <div class="wb-field" style="margin:0;flex:1;min-width:200px;"><label>Tìm kiếm email / họ tên / SĐT</label><input class="wb-input" name="q" value="${escapeHtml(q)}" /></div>
          <div class="wb-field" style="margin:0;min-width:160px;"><label>Trạng thái</label>
            <select class="wb-select" name="status">
              <option value="">Tất cả</option>
              <option value="active" ${status === 'active' ? 'selected' : ''}>Hoạt động</option>
              <option value="suspended" ${status === 'suspended' ? 'selected' : ''}>Đang khóa</option>
              <option value="pending_verification" ${status === 'pending_verification' ? 'selected' : ''}>Chờ xác minh</option>
            </select>
          </div>
          <button type="submit" class="wb-btn wb-btn-primary">Lọc</button>
        </form>

        <section class="wb-card" style="margin-top:14px;">
          <h2 style="margin-top:0;color:var(--wb-teal);">Danh sách tài khoản (${res.accounts.length})</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead><tr><th>ID / Email</th><th>Họ tên</th><th>Xác minh</th><th>Trạng thái</th><th>Phiên</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
              <tbody>
                ${res.accounts.map((a) => `
                  <tr>
                    <td><code>${escapeHtml(a.id)}</code><br/>${escapeHtml(a.email)}</td>
                    <td>${escapeHtml(a.full_name)}</td>
                    <td>${a.email_verified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                    <td><span class="wb-badge">${escapeHtml(a.status)}</span></td>
                    <td>${Number(a.active_sessions || 0)}</td>
                    <td><code>${escapeHtml(a.roles_csv || 'member')}</code></td>
                    <td>
                      <form class="wb-form" style="display:inline-flex;gap:6px;flex-wrap:wrap;" data-api-endpoint="/api/v1/admin/accounts/status" data-reload-on-success="true">
                        <input type="hidden" name="accountId" value="${escapeHtml(a.id)}" />
                        <select class="wb-select wb-btn-sm" name="action" style="width:auto;">
                          <option value="lock">Khóa tài khoản</option>
                          <option value="unlock">Mở khóa</option>
                          <option value="verify_email">Xác minh email</option>
                          <option value="revoke_sessions">Thu hồi phiên</option>
                        </select>
                        <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Thực thi</button>
                        <span data-form-status></span>
                      </form>
                    </td>
                  </tr>`).join('') || '<tr><td colspan="7">Không có tài khoản nào.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>`;
    }
  } else if (section === 'staff') {
    pageTitle = 'Nhân sự & Phân quyền RBAC';
    const res = await services.admin.listStaffAndRoles(user);
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      bodyHtml = `
        <div class="wb-grid-2">
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Cấp vai trò quản trị</h2>
            <p class="wb-muted">Không cho phép tự nâng quyền. Chỉ Super Admin mới có thể cấp vai trò <code>super_admin</code>.</p>
            <form class="wb-form" data-api-endpoint="/api/v1/admin/roles/assign" data-reload-on-success="true">
              <div class="wb-field"><label>Account ID mục tiêu *</label><input class="wb-input" name="accountId" placeholder="acc_..." required /></div>
              <div class="wb-field"><label>Vai trò *</label>
                <select class="wb-select" name="roleCode">
                  ${RBAC_ROLES.map((r) => `<option value="${escapeHtml(r.code)}">${escapeHtml(r.nameVi)} (${escapeHtml(r.code)})</option>`).join('')}
                </select>
              </div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Cấp vai trò</button>
            </form>
          </section>
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">8 Vai trò quản trị hệ thống</h2>
            <ul>${RBAC_ROLES.map((r) => `<li><strong>${escapeHtml(r.nameVi)}</strong> (<code>${escapeHtml(r.code)}</code>): ${escapeHtml(r.descriptionVi)}</li>`).join('')}</ul>
          </section>
        </div>
        <section class="wb-card" style="margin-top:16px;">
          <h2 style="margin-top:0;color:var(--wb-teal);">Danh sách nhân sự đã phân quyền (${res.staff.length})</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>Cấp lúc</th><th>Thao tác</th></tr></thead>
              <tbody>
                ${res.staff.map((s) => `
                  <tr>
                    <td><code>${escapeHtml(s.id)}</code><br/>${escapeHtml(s.email)}</td>
                    <td>${escapeHtml(s.full_name)}</td>
                    <td><span class="wb-badge">${escapeHtml(s.role_name)} (${escapeHtml(s.role_code)})</span></td>
                    <td>${escapeHtml(s.granted_at)}</td>
                    <td>
                      <form class="wb-form" data-api-endpoint="/api/v1/admin/roles/revoke" data-reload-on-success="true">
                        <input type="hidden" name="accountId" value="${escapeHtml(s.id)}" />
                        <input type="hidden" name="roleCode" value="${escapeHtml(s.role_code)}" />
                        <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Thu hồi</button>
                        <span data-form-status></span>
                      </form>
                    </td>
                  </tr>`).join('') || '<tr><td colspan="5">Chưa có nhân sự nào được phân quyền.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>`;
    }
  } else if (section === 'academic') {
    pageTitle = 'Quản trị Học thuật & Nội dung';
    const res = await services.admin.getAcademicOverview(user);
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      bodyHtml = `
        <div class="wb-grid-2">
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Thêm tài liệu Thư viện Đọc (/reader)</h2>
            <form class="wb-form" data-api-endpoint="/api/v1/admin/reader/documents" data-reload-on-success="true">
              <div class="wb-field"><label>Tiêu đề *</label><input class="wb-input" name="titleVi" required /></div>
              <div class="wb-grid-2">
                <div class="wb-field"><label>Ngôn ngữ</label><select class="wb-select" name="languageCode"><option value="zh">Tiếng Trung (zh)</option><option value="en">Tiếng Anh (en)</option><option value="ru">Tiếng Nga (ru)</option></select></div>
                <div class="wb-field"><label>Phân loại</label><select class="wb-select" name="category"><option value="general">Tổng quát</option><option value="specialized">Chuyên ngành</option><option value="dialogue">Hội thoại</option><option value="grammar">Ngữ pháp</option></select></div>
              </div>
              <div class="wb-field"><label>Trình độ tham chiếu</label><input class="wb-input" name="levelRef" value="Cơ bản" /></div>
              <div class="wb-field"><label>Nội dung tài liệu *</label><textarea class="wb-input" name="contentText" rows="4" required></textarea></div>
              <div class="wb-field"><label>Trạng thái</label><select class="wb-select" name="reviewStatus"><option value="published">Xuất bản ngay</option><option value="draft">Bản nháp</option></select></div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Lưu tài liệu Reader</button>
            </form>
          </section>
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Quy mô học thuật trong D1</h2>
            <ul>
              <li><strong>Ngôn ngữ:</strong> ${res.languages.map((l) => `${l.name_vi} (${l.code})`).join(', ')}</li>
              <li><strong>Chương trình:</strong> ${res.programs.length}</li>
              <li><strong>Khóa học:</strong> ${res.courses.length}</li>
              <li><strong>Bài học hiển thị:</strong> ${res.lessons.length}</li>
              <li><strong>Bài luyện tập (Practice):</strong> ${res.exercises.length}</li>
              <li><strong>Tài liệu Reader:</strong> ${res.readerDocuments.length}</li>
            </ul>
          </section>
        </div>
        <section class="wb-card" style="margin-top:16px;">
          <h2 style="margin-top:0;color:var(--wb-teal);">Kiểm duyệt & Xuất bản Chương trình / Tài liệu</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead><tr><th>ID</th><th>Tên chương trình</th><th>Ngôn ngữ</th><th>Loại</th><th>Trạng thái</th></tr></thead>
              <tbody>
                ${res.programs.map((p) => `<tr><td><code>${escapeHtml(p.id)}</code></td><td>${escapeHtml(p.name_vi)}</td><td>${escapeHtml(p.language_code.toUpperCase())}</td><td>${escapeHtml(p.program_type)}</td><td><span class="wb-badge">${escapeHtml(p.review_status)}</span></td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>`;
    }
  } else if (section === 'data') {
    pageTitle = 'Quản trị Dữ liệu & Lưu trữ (D1 / R2)';
    const res = await services.admin.getDataAndStorageStatus(user);
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      bodyHtml = `
        <div class="wb-grid-2">
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Cloudflare D1 — Thống kê bảng thực tế</h2>
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead><tr><th>Bảng D1</th><th>Số bản ghi</th></tr></thead>
                <tbody>${res.d1.tables.map((t) => `<tr><td><code>${escapeHtml(t.table)}</code></td><td><strong>${t.rows}</strong></td></tr>`).join('')}</tbody>
              </table>
            </div>
          </section>
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Cloudflare R2 & Tác vụ Sao lưu / Toàn vẹn</h2>
            <p><strong>Trạng thái R2:</strong> ${escapeHtml(res.r2.note)} (${res.r2.objects.length} đối tượng)</p>
            <form class="wb-form" data-api-endpoint="/api/v1/admin/data/snapshot" data-reload-on-success="true">
              <div class="wb-field"><label>Chọn tác vụ dữ liệu</label>
                <select class="wb-select" name="snapshotType">
                  <option value="integrity_check">Kiểm tra tính toàn vẹn D1 (PRAGMA integrity_check)</option>
                  <option value="logical_d1_summary">Tạo bản sao lưu logic D1 (lưu R2 nếu có)</option>
                  <option value="r2_inventory">Kiểm kê kho lưu trữ R2</option>
                </select>
              </div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Chạy tác vụ ngay</button>
            </form>
            <h3 style="margin-top:16px;">Lịch sử kiểm tra & sao lưu (${res.snapshots.length})</h3>
            <ul>${res.snapshots.map((s) => `<li><code>${escapeHtml(s.id)}</code> · <strong>${escapeHtml(s.snapshot_type)}</strong> · ${escapeHtml(s.status)} · ${escapeHtml(s.created_at)}</li>`).join('') || '<li class="wb-muted">Chưa có bản ghi sao lưu nào.</li>'}</ul>
          </section>
        </div>`;
    }
  } else if (section === 'security') {
    pageTitle = 'Quản trị Bảo mật & Kiểm toán';
    const res = await services.admin.getSecurityOverview(user);
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      bodyHtml = `
        <div class="wb-grid-2">
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Cảnh báo hành vi bất thường (${res.anomalies.length})</h2>
            ${res.anomalies.length === 0
              ? '<p class="wb-muted">Không phát hiện tài khoản đăng nhập sai bất thường.</p>'
              : `<ul>${res.anomalies.map((a) => `<li><strong>${escapeHtml(a.email)}</strong> — Sai ${a.failed_login_attempts} lần · Khóa đến: ${escapeHtml(a.locked_until || 'Không')}</li>`).join('')}</ul>`}
          </section>
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Phiên đăng nhập đang hoạt động (${res.activeSessions.length})</h2>
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead><tr><th>Email</th><th>IP</th><th>Hết hạn</th><th>Thu hồi</th></tr></thead>
                <tbody>
                  ${res.activeSessions.map((s) => `
                    <tr>
                      <td>${escapeHtml(s.email)}</td>
                      <td>${escapeHtml(s.ip_address || '')}</td>
                      <td>${escapeHtml(s.expires_at)}</td>
                      <td>
                        <form class="wb-form" data-api-endpoint="/api/v1/admin/security/revoke-session" data-reload-on-success="true">
                          <input type="hidden" name="sessionId" value="${escapeHtml(s.id)}" />
                          <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Thu hồi</button>
                        </form>
                      </td>
                    </tr>`).join('') || '<tr><td colspan="4">Không có phiên hoạt động.</td></tr>'}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <section class="wb-card" style="margin-top:16px;">
          <h2 style="margin-top:0;color:var(--wb-teal);">Nhật ký đăng nhập & Bảo mật (${res.loginLogs.length})</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Hành động</th><th>IP</th></tr></thead>
              <tbody>${res.loginLogs.map((l) => `<tr><td>${escapeHtml(l.created_at)}</td><td>${escapeHtml(l.actor_email || 'Ẩn danh')}</td><td><code>${escapeHtml(l.action)}</code></td><td>${escapeHtml(l.ip_address || '')}</td></tr>`).join('') || '<tr><td colspan="4">Chưa có nhật ký đăng nhập.</td></tr>'}</tbody>
            </table>
          </div>
        </section>`;
    }
  } else if (section === 'operations') {
    pageTitle = 'Quản trị Vận hành, Hỗ trợ & Bảo trì';
    const res = await services.admin.getOperationsOverview(user);
    if (!res.ok) {
      bodyHtml = `<div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div>`;
    } else {
      const cfgMap = Object.fromEntries(res.configs.map((c) => [c.config_key, c.config_value]));
      bodyHtml = `
        <div class="wb-grid-2">
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Cấu hình hệ thống & Chế độ bảo trì</h2>
            <form class="wb-form" data-api-endpoint="/api/v1/admin/config" data-reload-on-success="true">
              <div class="wb-field"><label>Khóa cấu hình</label>
                <select class="wb-select" name="configKey">
                  <option value="site.maintenance_mode">Chế độ bảo trì (true/false) — Hiện tại: ${escapeHtml(cfgMap['site.maintenance_mode'] || 'false')}</option>
                  <option value="site.maintenance_message">Thông báo bảo trì</option>
                  <option value="site.announcement_banner">Thanh thông báo toàn trang</option>
                </select>
              </div>
              <div class="wb-field"><label>Giá trị mới</label><input class="wb-input" name="configValue" placeholder="true / false hoặc nội dung thông báo" required /></div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Lưu cấu hình</button>
            </form>
          </section>
          <section class="wb-card">
            <h2 style="margin-top:0;color:var(--wb-teal);">Tác vụ nền (${res.jobs.length})</h2>
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead><tr><th>Tác vụ</th><th>Trạng thái</th><th>Chạy gần nhất</th><th>Thao tác</th></tr></thead>
                <tbody>
                  ${res.jobs.map((j) => `
                    <tr>
                      <td><code>${escapeHtml(j.job_name)}</code></td>
                      <td><span class="wb-badge">${escapeHtml(j.status)}</span></td>
                      <td>${escapeHtml(j.last_run_at || 'Chưa chạy')}</td>
                      <td>
                        <form class="wb-form" style="display:inline-flex;gap:4px;" data-api-endpoint="/api/v1/admin/jobs/action" data-reload-on-success="true">
                          <input type="hidden" name="jobName" value="${escapeHtml(j.job_name)}" />
                          <input type="hidden" name="action" value="run" />
                          <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Chạy</button>
                        </form>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section class="wb-card" style="margin-top:16px;">
          <h2 style="margin-top:0;color:var(--wb-teal);">Yêu cầu hỗ trợ & Liên hệ (${res.tickets.length})</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead><tr><th>Mã / Người gửi</th><th>Tiêu đề & Nội dung</th><th>Trạng thái</th><th>Phản hồi trực tiếp</th></tr></thead>
              <tbody>
                ${res.tickets.map((t) => `
                  <tr>
                    <td><code>${escapeHtml(t.id)}</code><br/>${escapeHtml(t.sender_name)}<br/><span class="wb-muted">${escapeHtml(t.sender_email)}</span></td>
                    <td><strong>${escapeHtml(t.subject)}</strong><br/>${escapeHtml(t.message_body)}</td>
                    <td><span class="wb-badge">${escapeHtml(t.status)}</span></td>
                    <td>
                      <form class="wb-form" data-api-endpoint="/api/v1/admin/support/reply" data-reload-on-success="true">
                        <input type="hidden" name="ticketId" value="${escapeHtml(t.id)}" />
                        <input class="wb-input" name="replyBody" placeholder="Nhập nội dung phản hồi..." style="margin-bottom:6px;" />
                        <select class="wb-select wb-btn-sm" name="newStatus" style="margin-bottom:6px;">
                          <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>Đang xử lý</option>
                          <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Đã giải quyết</option>
                          <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Đóng yêu cầu</option>
                        </select>
                        <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Gửi phản hồi</button>
                        <span data-form-status></span>
                      </form>
                    </td>
                  </tr>`).join('') || '<tr><td colspan="4">Chưa có yêu cầu hỗ trợ nào.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>`;
    }
  } else {
    bodyHtml = `<div class="wb-alert wb-alert-warn">Phân hệ quản trị không tồn tại. Vui lòng chọn một phân hệ từ thanh điều hướng trên.</div>`;
  }

  return htmlResponse(renderAdminPage({
    title: pageTitle,
    currentPath,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Quản trị', href: '/quan-tri' }, ...(section !== 'overview' ? [{ label: pageTitle }] : [])],
    user,
    runtime,
    contentHtml: `${roleHeader}${bodyHtml}`,
  }));
}
