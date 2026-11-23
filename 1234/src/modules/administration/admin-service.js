/**
 * WORD BRIDGE V4.1 — Unified Super Admin & Operations Service (/quan-tri)
 * Strict Backend RBAC, Real Cloudflare D1 & R2 Queries, Mandatory Audit Logging,
 * Zero Fake Data, Zero Exam References, Anti-Self-Elevation Guardrails.
 */

import { RBAC_ROLES, ADMIN_ROLE_CODES } from '../../config/constants.js';
const ADMIN_CENTERS = Object.freeze([
  { id: 'overview', nameVi: 'Tổng quan' },
  { id: 'accounts', nameVi: 'Tài khoản' },
  { id: 'staff', nameVi: 'Nhân sự & Phân quyền' },
  { id: 'academic', nameVi: 'Học thuật & Nội dung' },
  { id: 'data', nameVi: 'Dữ liệu & Lưu trữ' },
  { id: 'security', nameVi: 'Bảo mật & Kiểm toán' },
  { id: 'operations', nameVi: 'Vận hành & Hỗ trợ' },
]);
import { generateId } from '../../utils/crypto.js';

export class AdminService {
  constructor(db, authService, jobsService, r2Service = null, emailService = null) {
    this.db = db;
    this.authService = authService;
    this.jobsService = jobsService;
    this.r2Service = r2Service;
    this.emailService = emailService;
  }

  // ---- 1. OVERVIEW DASHBOARD ----
  async getDashboardMetrics() {
    const [
      accountsTotal,
      accountsActive,
      accountsVerified,
      accountsLocked,
      activeSessions,
      programs,
      curricula,
      courses,
      weeks,
      lessons,
      dictEntries,
      practiceExercises,
      practiceResults,
      readerDocs,
      supportOpen,
      supportTotal,
      emailEvents,
      emailFailed,
      auditLogsCount,
      recentAudits,
      jobs,
      configRows,
    ] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_accounts').first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts WHERE status = 'active'").first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_accounts WHERE email_verified = 1').first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts WHERE status != 'active' OR (locked_until IS NOT NULL AND datetime(locked_until) > datetime('now'))").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_sessions WHERE revoked_at IS NULL AND datetime(expires_at) > datetime('now')").first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_programs').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_curricula').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_courses').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_weeks').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_lessons').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_dictionary_entries').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_practice_exercises').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_practice_results').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_reader_documents').first().catch(() => ({ cnt: 0 })),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_support_requests WHERE status IN ('open', 'in_progress')").first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_support_requests').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_email_events').first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_email_events WHERE delivery_status IN ('FAILED', 'BOUNCED', 'BLOCKED_UNCONFIGURED')").first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_audit_logs').first(),
      this.db.prepare(`
        SELECT l.id, l.action, l.resource_type, l.resource_id, l.ip_address, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        ORDER BY l.created_at DESC
        LIMIT 15
      `).all(),
      this.db.prepare('SELECT * FROM wb_background_jobs ORDER BY job_name ASC').all(),
      this.db.prepare('SELECT config_key, config_value FROM wb_platform_config').all().catch(() => ({ results: [] })),
    ]);

    const configMap = {};
    for (const row of configRows.results || []) {
      configMap[row.config_key] = row.config_value;
    }

    const alerts = [];
    if ((accountsLocked?.cnt || 0) > 0) {
      alerts.push({ level: 'warn', message: `Có ${accountsLocked.cnt} tài khoản đang bị khóa hoặc chưa kích hoạt.` });
    }
    if ((supportOpen?.cnt || 0) > 0) {
      alerts.push({ level: 'info', message: `Có ${supportOpen.cnt} yêu cầu hỗ trợ đang chờ xử lý.` });
    }
    if ((emailFailed?.cnt || 0) > 0) {
      alerts.push({ level: 'warn', message: `Có ${emailFailed.cnt} email ở trạng thái lỗi / chưa cấu hình provider.` });
    }
    const erroredJobs = (jobs.results || []).filter((j) => j.status === 'error');
    if (erroredJobs.length > 0) {
      alerts.push({ level: 'error', message: `Có ${erroredJobs.length} tác vụ nền gặp lỗi cần kiểm tra.` });
    }
    if (configMap['site.maintenance_mode'] === 'true') {
      alerts.push({ level: 'error', message: 'Chế độ bảo trì (Maintenance Mode) đang BẬT.' });
    }

    return {
      counts: {
        accounts: accountsTotal?.cnt || 0,
        accountsActive: accountsActive?.cnt || 0,
        accountsVerified: accountsVerified?.cnt || 0,
        accountsLocked: accountsLocked?.cnt || 0,
        activeSessions: activeSessions?.cnt || 0,
        programs: programs?.cnt || 0,
        curricula: curricula?.cnt || 0,
        courses: courses?.cnt || 0,
        weeks: weeks?.cnt || 0,
        lessons: lessons?.cnt || 0,
        dictionaryEntries: dictEntries?.cnt || 0,
        practiceExercises: practiceExercises?.cnt || 0,
        practiceResults: practiceResults?.cnt || 0,
        readerDocuments: readerDocs?.cnt || 0,
        supportOpen: supportOpen?.cnt || 0,
        supportTotal: supportTotal?.cnt || 0,
        emailEvents: emailEvents?.cnt || 0,
        emailFailed: emailFailed?.cnt || 0,
        auditLogs: auditLogsCount?.cnt || 0,
      },
      health: {
        d1Connected: true,
        r2Connected: Boolean(this.r2Service && this.r2Service.isAvailable()),
        maintenanceMode: configMap['site.maintenance_mode'] === 'true',
      },
      alerts,
      recentAudits: recentAudits.results || [],
      centers: ADMIN_CENTERS,
      roles: RBAC_ROLES,
      jobs: jobs.results || [],
    };
  }

  // ---- 2. ACCOUNTS MANAGEMENT ----
  async listAccounts(actor, { q = '', status = '', verified = '', limit = 50, offset = 0 } = {}) {
    if (!this.authService.hasPermission(actor, 'accounts:view')) {
      return { ok: false, status: 403, error: 'Thiếu quyền accounts:view.' };
    }
    const clauses = [];
    const params = [];
    if (q) {
      clauses.push('(LOWER(a.email) LIKE ? OR LOWER(a.full_name) LIKE ? OR a.phone_number LIKE ?)');
      const pat = `%${String(q).trim().toLowerCase()}%`;
      params.push(pat, pat, pat);
    }
    if (status) {
      clauses.push('a.status = ?');
      params.push(status);
    }
    if (verified === '1' || verified === '0') {
      clauses.push('a.email_verified = ?');
      params.push(Number(verified));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);

    const rows = (await this.db
      .prepare(`
        SELECT a.id, a.email, a.full_name, a.phone_number, a.school_name, a.workplace_name,
               a.email_verified, a.status, a.failed_login_attempts, a.locked_until, a.created_at,
               (SELECT GROUP_CONCAT(r.code, ',') FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = a.id) AS roles_csv,
               (SELECT COUNT(*) FROM wb_sessions s WHERE s.account_id = a.id AND s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now')) AS active_sessions
        FROM wb_accounts a
        ${where}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(...params, safeLimit, safeOffset)
      .all()).results || [];

    return { ok: true, accounts: rows };
  }

  async updateAccountStatus(actor, targetAccountId, action, reason = '', ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'accounts:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền accounts:manage.' };
    }
    if (targetAccountId === actor.accountId && (action === 'lock' || action === 'suspend')) {
      return { ok: false, status: 400, error: 'Không thể tự khóa tài khoản quản trị đang đăng nhập.' };
    }
    const target = await this.db.prepare('SELECT id, email, status FROM wb_accounts WHERE id = ?').bind(targetAccountId).first();
    if (!target) return { ok: false, status: 404, error: 'Không tìm thấy tài khoản.' };

    // Protect super_admin from non-super_admin modifications
    const targetSuper = await this.db
      .prepare("SELECT 1 AS is_sa FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = ? AND r.code = 'super_admin'")
      .bind(targetAccountId)
      .first();
    if (targetSuper && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: 'Chỉ Super Admin mới có quyền thay đổi trạng thái của Super Admin khác.' };
    }

    if (action === 'lock' || action === 'suspend') {
      await this.db.prepare("UPDATE wb_accounts SET status = 'suspended', updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, 'admin.account_locked', 'wb_accounts', targetAccountId, ipAddress, { reason });
      return { ok: true, accountId: targetAccountId, status: 'suspended' };
    }
    if (action === 'unlock' || action === 'activate') {
      await this.db.prepare("UPDATE wb_accounts SET status = 'active', failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, 'admin.account_unlocked', 'wb_accounts', targetAccountId, ipAddress, { reason });
      return { ok: true, accountId: targetAccountId, status: 'active' };
    }
    if (action === 'verify_email') {
      await this.db.prepare("UPDATE wb_accounts SET email_verified = 1, email_verified_at = datetime('now'), status = CASE WHEN status = 'pending_verification' THEN 'active' ELSE status END, updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, 'admin.account_email_verified', 'wb_accounts', targetAccountId, ipAddress, {});
      return { ok: true, accountId: targetAccountId, emailVerified: 1 };
    }
    if (action === 'revoke_sessions') {
      await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, 'admin.sessions_revoked', 'wb_sessions', targetAccountId, ipAddress, {});
      return { ok: true, accountId: targetAccountId, sessionsRevoked: true };
    }
    return { ok: false, status: 400, error: 'Hành động tài khoản không hợp lệ.' };
  }

  // ---- 3. STAFF & RBAC MANAGEMENT (ANTI-SELF-ELEVATION) ----
  async listStaffAndRoles(actor) {
    if (!this.authService.hasPermission(actor, 'rbac:manage') && !this.authService.hasPermission(actor, 'accounts:view')) {
      return { ok: false, status: 403, error: 'Thiếu quyền xem nhân sự và phân quyền.' };
    }
    const [roles, staff] = await Promise.all([
      this.db.prepare('SELECT id, code, name_vi, description_vi FROM wb_roles ORDER BY code ASC').all(),
      this.db.prepare(`
        SELECT a.id, a.email, a.full_name, a.status, r.code AS role_code, r.name_vi AS role_name, ar.granted_at, ar.granted_by
        FROM wb_account_roles ar
        JOIN wb_accounts a ON a.id = ar.account_id
        JOIN wb_roles r ON r.id = ar.role_id
        ORDER BY r.code, a.email
      `).all(),
    ]);
    return { ok: true, roles: roles.results || [], staff: staff.results || [] };
  }

  async assignRole(actor, targetAccountId, roleCode, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'rbac:manage')) {
      return { ok: false, status: 403, error: 'Bạn không có quyền phân vai trò quản trị (yêu cầu quyền rbac:manage).' };
    }
    if (!ADMIN_ROLE_CODES.has(roleCode)) {
      return { ok: false, status: 400, error: `Vai trò không hợp lệ hoặc đã ngừng sử dụng: ${roleCode}` };
    }
    // STRICT ANTI-SELF-ELEVATION GUARDRAIL
    if (targetAccountId === actor.accountId) {
      return { ok: false, status: 403, error: 'Không cho phép tự cấp quyền hoặc tự nâng quyền cho chính mình.' };
    }
    if (roleCode === 'super_admin' && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: 'Chỉ Super Admin mới được phép cấp vai trò super_admin.' };
    }

    const target = await this.db.prepare('SELECT id FROM wb_accounts WHERE id = ?').bind(targetAccountId).first();
    if (!target) return { ok: false, status: 404, error: 'Tài khoản mục tiêu không tồn tại.' };

    const role = await this.db.prepare('SELECT id, code, name_vi FROM wb_roles WHERE code = ?').bind(roleCode).first();
    if (!role) return { ok: false, status: 404, error: 'Vai trò không tồn tại trong cơ sở dữ liệu.' };

    await this.db
      .prepare('INSERT OR IGNORE INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, ?, ?)')
      .bind(targetAccountId, role.id, actor.accountId)
      .run();

    await this.authService.recordAudit(actor.accountId, 'rbac.role_assigned', 'wb_account_roles', targetAccountId, ipAddress, { roleCode });
    return { ok: true, role };
  }

  async revokeRole(actor, targetAccountId, roleCode, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'rbac:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền rbac:manage.' };
    }
    if (roleCode === 'super_admin' && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: 'Chỉ Super Admin mới có quyền thu hồi vai trò super_admin.' };
    }
    if (targetAccountId === actor.accountId && roleCode === 'super_admin') {
      return { ok: false, status: 400, error: 'Không thể tự thu hồi vai trò Super Admin của chính mình.' };
    }
    const role = await this.db.prepare('SELECT id, code FROM wb_roles WHERE code = ?').bind(roleCode).first();
    if (!role) return { ok: false, status: 404, error: 'Vai trò không tồn tại.' };

    await this.db.prepare('DELETE FROM wb_account_roles WHERE account_id = ? AND role_id = ?').bind(targetAccountId, role.id).run();
    await this.authService.recordAudit(actor.accountId, 'rbac.role_revoked', 'wb_account_roles', targetAccountId, ipAddress, { roleCode });
    return { ok: true, accountId: targetAccountId, roleCode };
  }

  // ---- 4. ACADEMIC & CONTENT MANAGEMENT ----
  async getAcademicOverview(actor) {
    const canView = this.authService.hasPermission(actor, 'curriculum:create')
      || this.authService.hasPermission(actor, 'curriculum:review')
      || this.authService.hasPermission(actor, 'curriculum:publish')
      || this.authService.hasPermission(actor, 'reader:manage');
    if (!canView) return { ok: false, status: 403, error: 'Thiếu quyền quản trị học thuật.' };

    const [languages, programs, courses, lessons, exercises, dictEntries, grammarTopics, readerDocs] = await Promise.all([
      this.db.prepare('SELECT * FROM wb_languages ORDER BY code').all(),
      this.db.prepare('SELECT id, code, slug, name_vi, language_code, program_type, review_status FROM wb_programs ORDER BY language_code, code LIMIT 50').all(),
      this.db.prepare('SELECT id, slug, title_vi, language_code, total_weeks, review_status FROM wb_courses ORDER BY language_code, slug LIMIT 50').all(),
      this.db.prepare('SELECT id, slug, title_vi, language_code, level_ref, review_status FROM wb_lessons ORDER BY language_code, id LIMIT 60').all(),
      this.db.prepare('SELECT id, title_vi, language_code, skill, level_ref FROM wb_practice_exercises ORDER BY language_code, skill LIMIT 50').all(),
      this.db.prepare('SELECT id, headword, language_code, level_ref, specialized_domain, review_status FROM wb_dictionary_entries ORDER BY created_at DESC LIMIT 40').all(),
      this.db.prepare('SELECT id, title_vi, language_code, level_ref, review_status FROM wb_grammar_topics ORDER BY language_code, id LIMIT 40').all(),
      this.db.prepare('SELECT id, slug, title_vi, language_code, category, level_ref, review_status FROM wb_reader_documents ORDER BY updated_at DESC LIMIT 40').all().catch(() => ({ results: [] })),
    ]);

    return {
      ok: true,
      languages: languages.results || [],
      programs: programs.results || [],
      courses: courses.results || [],
      lessons: lessons.results || [],
      exercises: exercises.results || [],
      dictionaryEntries: dictEntries.results || [],
      grammarTopics: grammarTopics.results || [],
      readerDocuments: readerDocs.results || [],
    };
  }

  async updateContentStatus(actor, tableName, itemId, newStatus, ipAddress = null) {
    const allowedTables = new Set([
      'wb_programs', 'wb_curricula', 'wb_courses', 'wb_lessons',
      'wb_dictionary_entries', 'wb_grammar_topics', 'wb_practice_exercises', 'wb_reader_documents',
    ]);
    const allowedStatuses = new Set(['draft', 'in_review', 'editing', 'approved', 'published', 'archived']);
    if (!allowedTables.has(tableName) || !allowedStatuses.has(newStatus)) {
      return { ok: false, status: 400, error: 'Bảng hoặc trạng thái duyệt học thuật không hợp lệ.' };
    }
    if (newStatus === 'published' && !this.authService.hasPermission(actor, 'curriculum:publish')) {
      return { ok: false, status: 403, error: 'Bạn không có quyền phát hành nội dung học thuật chính thức (yêu cầu curriculum:publish).' };
    }
    if (!this.authService.hasPermission(actor, 'curriculum:review') && !this.authService.hasPermission(actor, 'curriculum:create')) {
      return { ok: false, status: 403, error: 'Thiếu quyền cập nhật trạng thái học thuật.' };
    }
    await this.db
      .prepare(`UPDATE ${tableName} SET review_status = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(newStatus, itemId)
      .run();
    await this.authService.recordAudit(actor.accountId, 'academic.status_updated', tableName, itemId, ipAddress, { newStatus });
    return { ok: true, tableName, itemId, newStatus };
  }

  // ---- 5. DATA & STORAGE (D1 & R2) ----
  async getDataAndStorageStatus(actor) {
    if (!this.authService.hasPermission(actor, 'data:manage') && !this.authService.hasPermission(actor, 'infrastructure:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền quản trị dữ liệu và lưu trữ.' };
    }
    const tables = [
      'wb_accounts', 'wb_sessions', 'wb_programs', 'wb_lessons', 'wb_dictionary_entries',
      'wb_vocabulary_notebook', 'wb_practice_exercises', 'wb_practice_results',
      'wb_reader_documents', 'wb_support_requests', 'wb_email_events', 'wb_audit_logs',
    ];
    const tableStats = [];
    for (const t of tables) {
      const row = await this.db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).first().catch(() => ({ cnt: -1 }));
      tableStats.push({ table: t, rows: row?.cnt ?? 0 });
    }

    let r2Status = { connected: false, objects: [], note: 'R2 bucket binding chưa được gắn trong môi trường hiện tại.' };
    if (this.r2Service && this.r2Service.isAvailable()) {
      try {
        const listed = await this.r2Service.listPrefix('', 50);
        r2Status = {
          connected: true,
          objects: (listed?.objects || []).map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
          note: 'Đã kết nối Cloudflare R2 bucket `word`.',
        };
      } catch (err) {
        r2Status = { connected: false, objects: [], note: `Lỗi truy vấn R2: ${err.message}` };
      }
    }

    const snapshots = (await this.db
      .prepare('SELECT * FROM wb_db_snapshots ORDER BY created_at DESC LIMIT 15')
      .all().catch(() => ({ results: [] }))).results || [];

    return { ok: true, d1: { connected: true, tables: tableStats }, r2: r2Status, snapshots };
  }

  async runIntegrityCheckOrBackup(actor, snapshotType = 'integrity_check', ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'data:manage') && !this.authService.hasPermission(actor, 'infrastructure:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền sao lưu / kiểm tra toàn vẹn dữ liệu.' };
    }
    const allowedTypes = new Set(['integrity_check', 'logical_d1_summary', 'r2_inventory']);
    if (!allowedTypes.has(snapshotType)) {
      return { ok: false, status: 400, error: 'Loại tác vụ dữ liệu không hợp lệ.' };
    }

    const id = generateId('snp');
    let summary = {};
    let r2Key = null;

    if (snapshotType === 'integrity_check') {
      const check = await this.db.prepare('PRAGMA integrity_check').first().catch(() => ({ integrity_check: 'unknown' }));
      const fkCheck = await this.db.prepare('PRAGMA foreign_key_check').all().catch(() => ({ results: [] }));
      summary = {
        integrityCheck: check?.integrity_check || Object.values(check || {})[0] || 'ok',
        foreignKeyViolations: (fkCheck.results || []).length,
        checkedAt: new Date().toISOString(),
      };
    } else if (snapshotType === 'logical_d1_summary') {
      const status = await this.getDataAndStorageStatus(actor);
      summary = { tables: status.d1.tables, exportedAt: new Date().toISOString() };
      if (this.r2Service && this.r2Service.isAvailable()) {
        const key = `backups/${id}.json`;
        await this.r2Service.uploadObject({
          key,
          body: JSON.stringify(summary, null, 2),
          contentType: 'application/json',
          visibility: 'private',
          uploadedBy: actor.accountId,
        });
        r2Key = key;
      }
    } else {
      const status = await this.getDataAndStorageStatus(actor);
      summary = { r2Connected: status.r2.connected, objectCount: status.r2.objects.length, checkedAt: new Date().toISOString() };
    }

    await this.db
      .prepare('INSERT INTO wb_db_snapshots (id, snapshot_type, created_by, status, r2_object_key, summary_json) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, snapshotType, actor.accountId, 'completed', r2Key, JSON.stringify(summary))
      .run();

    await this.authService.recordAudit(actor.accountId, `data.${snapshotType}`, 'wb_db_snapshots', id, ipAddress, { r2Key });
    return { ok: true, snapshotId: id, snapshotType, r2ObjectKey: r2Key, summary };
  }

  // ---- 6. SECURITY & AUDIT ----
  async getSecurityOverview(actor) {
    if (!this.authService.hasPermission(actor, 'audit:view') && !this.authService.hasPermission(actor, 'security:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền xem bảo mật và nhật ký kiểm toán.' };
    }
    const [loginLogs, adminLogs, activeSessions, anomalies, policyRows] = await Promise.all([
      this.db.prepare(`
        SELECT l.id, l.action, l.ip_address, l.metadata_json, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        WHERE l.action LIKE 'auth.%'
        ORDER BY l.created_at DESC
        LIMIT 30
      `).all(),
      this.db.prepare(`
        SELECT l.id, l.action, l.resource_type, l.resource_id, l.ip_address, l.metadata_json, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        WHERE l.action NOT LIKE 'auth.%'
        ORDER BY l.created_at DESC
        LIMIT 40
      `).all(),
      this.db.prepare(`
        SELECT s.id, s.account_id, a.email, s.ip_address, s.user_agent, s.created_at, s.expires_at
        FROM wb_sessions s
        JOIN wb_accounts a ON a.id = s.account_id
        WHERE s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now')
        ORDER BY s.created_at DESC
        LIMIT 30
      `).all(),
      this.db.prepare(`
        SELECT id, email, status, failed_login_attempts, locked_until
        FROM wb_accounts
        WHERE failed_login_attempts >= 3 OR (locked_until IS NOT NULL AND datetime(locked_until) > datetime('now'))
        ORDER BY failed_login_attempts DESC
        LIMIT 20
      `).all(),
      this.db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key LIKE 'security.%'").all().catch(() => ({ results: [] })),
    ]);

    return {
      ok: true,
      loginLogs: loginLogs.results || [],
      adminLogs: adminLogs.results || [],
      activeSessions: activeSessions.results || [],
      anomalies: anomalies.results || [],
      securityConfig: policyRows.results || [],
    };
  }

  async revokeSessionByAdmin(actor, sessionId, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'security:manage') && !this.authService.hasPermission(actor, 'accounts:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền thu hồi phiên đăng nhập.' };
    }
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE id = ?").bind(sessionId).run();
    await this.authService.recordAudit(actor.accountId, 'security.session_revoked', 'wb_sessions', sessionId, ipAddress, {});
    return { ok: true, sessionId };
  }

  // ---- 7. OPERATIONS (EMAIL, NOTIFICATIONS, SUPPORT, JOBS, CONFIG, MAINTENANCE) ----
  async getOperationsOverview(actor) {
    const canOp = this.authService.hasPermission(actor, 'operations:manage')
      || this.authService.hasPermission(actor, 'infrastructure:manage')
      || this.authService.hasPermission(actor, 'support:manage');
    if (!canOp) return { ok: false, status: 403, error: 'Thiếu quyền quản trị vận hành.' };

    const [tickets, emails, notifications, jobs, configs] = await Promise.all([
      this.db.prepare('SELECT * FROM wb_support_requests ORDER BY created_at DESC LIMIT 40').all(),
      this.db.prepare('SELECT id, event_type, template_key, recipient_email, delivery_status, provider_name, created_at FROM wb_email_events ORDER BY created_at DESC LIMIT 30').all(),
      this.db.prepare('SELECT * FROM wb_notifications ORDER BY created_at DESC LIMIT 20').all().catch(() => ({ results: [] })),
      this.db.prepare('SELECT * FROM wb_background_jobs ORDER BY job_name ASC').all(),
      this.db.prepare('SELECT * FROM wb_platform_config ORDER BY config_key ASC').all().catch(() => ({ results: [] })),
    ]);

    return {
      ok: true,
      tickets: tickets.results || [],
      emails: emails.results || [],
      notifications: notifications.results || [],
      jobs: jobs.results || [],
      configs: configs.results || [],
    };
  }

  async updatePlatformConfig(actor, configKey, configValue, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'operations:manage') && !this.authService.hasPermission(actor, 'infrastructure:manage') && !this.authService.hasPermission(actor, 'security:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền cập nhật cấu hình hệ thống.' };
    }
    const allowedKeys = new Set([
      'site.maintenance_mode',
      'site.maintenance_message',
      'site.announcement_banner',
      'security.max_login_attempts',
      'security.lockout_minutes',
    ]);
    if (!allowedKeys.has(configKey)) {
      return { ok: false, status: 400, error: `Khóa cấu hình không được phép: ${configKey}` };
    }
    if (configKey.startsWith('security.') && !this.authService.hasPermission(actor, 'security:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền security:manage để thay đổi cấu hình bảo mật.' };
    }

    const cleanVal = String(configValue ?? '').trim().slice(0, 500);
    await this.db
      .prepare(`
        INSERT INTO wb_platform_config (config_key, config_value, description_vi, updated_by, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_by = excluded.updated_by, updated_at = datetime('now')
      `)
      .bind(configKey, cleanVal, `Cập nhật từ /quan-tri`, actor.accountId)
      .run();

    await this.authService.recordAudit(actor.accountId, 'operations.config_updated', 'wb_platform_config', configKey, ipAddress, { configValue: cleanVal });
    return { ok: true, configKey, configValue: cleanVal };
  }

  async createNotification(actor, { accountId = null, titleVi, bodyVi, category = 'announcement' }, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'operations:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền operations:manage.' };
    }
    const title = String(titleVi || '').trim();
    const body = String(bodyVi || '').trim();
    if (!title || !body) return { ok: false, status: 400, error: 'Thiếu tiêu đề hoặc nội dung thông báo.' };

    const id = generateId('ntf');
    await this.db
      .prepare('INSERT INTO wb_notifications (id, account_id, title_vi, body_vi, category, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, accountId || null, title, body, category, actor.accountId)
      .run();
    await this.authService.recordAudit(actor.accountId, 'operations.notification_created', 'wb_notifications', id, ipAddress, { category });
    return { ok: true, notificationId: id };
  }

  async replySupportTicket(actor, ticketId, { replyBody = '', newStatus = 'in_progress' }, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'support:manage')) {
      return { ok: false, status: 403, error: 'Thiếu quyền support:manage.' };
    }
    const ticket = await this.db.prepare('SELECT * FROM wb_support_requests WHERE id = ?').bind(ticketId).first();
    if (!ticket) return { ok: false, status: 404, error: 'Không tìm thấy yêu cầu hỗ trợ.' };

    const allowedStatuses = new Set(['open', 'in_progress', 'resolved', 'closed']);
    const statusToSet = allowedStatuses.has(newStatus) ? newStatus : ticket.status;
    const cleanReply = String(replyBody || '').trim();

    let replyId = null;
    if (cleanReply) {
      replyId = generateId('rep');
      await this.db
        .prepare('INSERT INTO wb_support_replies (id, ticket_id, author_account_id, author_name, author_role, reply_body) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(replyId, ticketId, actor.accountId, actor.fullName || actor.email, actor.roles[0] || 'support_admin', cleanReply)
        .run();

      if (this.emailService) {
        await this.emailService.sendEventEmail({
          eventType: 'SupportTicketReplied',
          templateKey: 'support_response',
          recipientEmail: ticket.sender_email,
          accountId: ticket.account_id || null,
          idempotencyKey: `support_reply:${replyId}`,
          variables: { replyBody: cleanReply, ctaUrl: `${this.authService.baseUrl}/help` },
        });
      }
    }

    await this.db
      .prepare("UPDATE wb_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(statusToSet, ticketId)
      .run();

    await this.authService.recordAudit(actor.accountId, 'support.ticket_updated', 'wb_support_requests', ticketId, ipAddress, { status: statusToSet, hasReply: Boolean(cleanReply) });
    return { ok: true, ticketId, replyId, status: statusToSet };
  }

  async toggleBackgroundJob(actor, jobName, action, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'infrastructure:manage') && !this.authService.hasPermission(actor, 'operations:manage')) {
      return { ok: false, status: 403, error: 'Bạn không có quyền điều khiển tác vụ nền.' };
    }
    if (action === 'run') {
      const res = await this.jobsService.runJob(jobName);
      await this.authService.recordAudit(actor.accountId, 'jobs.manual_run', 'wb_background_jobs', jobName, ipAddress, res);
      return { ok: true, result: res };
    }
    const newStatus = action === 'pause' ? 'paused' : 'active';
    await this.db
      .prepare("UPDATE wb_background_jobs SET status = ?, consecutive_failures = 0, updated_at = datetime('now') WHERE job_name = ?")
      .bind(newStatus, jobName)
      .run();
    await this.authService.recordAudit(actor.accountId, `jobs.${action}`, 'wb_background_jobs', jobName, ipAddress, { newStatus });
    return { ok: true, jobName, status: newStatus };
  }

  async createSupportOrContactTicket(payload, emailService) {
    const type = payload.requestType === 'contact_partnership' ? 'contact_partnership' : 'support';
    const senderName = String(payload.senderName || '').trim();
    const senderEmail = String(payload.senderEmail || '').trim().toLowerCase();
    const subject = String(payload.subject || '').trim();
    const messageBody = String(payload.messageBody || '').trim();

    if (!senderName || !senderEmail || !subject || messageBody.length < 10) {
      return { ok: false, status: 400, error: 'Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung tối thiểu 10 ký tự.' };
    }

    const ticketId = generateId(type === 'support' ? 'cskh' : 'cnt');
    await this.db
      .prepare(`
        INSERT INTO wb_support_requests (id, request_type, account_id, sender_name, sender_email, subject, message_body)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(ticketId, type, payload.accountId || null, senderName, senderEmail, subject, messageBody)
      .run();

    const emailRes = await emailService.sendEventEmail({
      eventType: type === 'support' ? 'SupportRequestCreated' : 'ContactRequestCreated',
      templateKey: type === 'support' ? 'support_request_confirmation' : 'contact_partnership_confirmation',
      recipientEmail: senderEmail,
      accountId: payload.accountId || null,
      idempotencyKey: `ticket_confirm:${ticketId}`,
      variables: { senderName, ticketId, subject, ctaUrl: `${this.authService.baseUrl}/help` },
    });

    return { ok: true, ticketId, emailStatus: emailRes.status };
  }

  async listUserSupportTickets(accountId) {
    const tickets = (await this.db
      .prepare('SELECT * FROM wb_support_requests WHERE account_id = ? ORDER BY created_at DESC LIMIT 30')
      .bind(accountId)
      .all()).results || [];

    const out = [];
    for (const t of tickets) {
      const replies = (await this.db
        .prepare('SELECT id, author_name, author_role, reply_body, created_at FROM wb_support_replies WHERE ticket_id = ? ORDER BY created_at ASC')
        .bind(t.id)
        .all().catch(() => ({ results: [] }))).results || [];
      out.push({ ...t, replies });
    }
    return out;
  }
}
