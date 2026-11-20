/**
 * WORD BRIDGE — 100% Vietnamese Administration & Operations Service (Section 73–76)
 */

import { ADMIN_CENTERS, RBAC_ROLES } from '../../config/constants.js';
import { generateId } from '../../utils/crypto.js';

export class AdminService {
  constructor(db, authService, jobsService) {
    this.db = db;
    this.authService = authService;
    this.jobsService = jobsService;
  }

  async getDashboardMetrics() {
    const [accounts, programs, weeks, lessons, dictEntries, exams, emailEvents, auditLogs, jobs] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_accounts').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_programs').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_weeks').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_lessons').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_dictionary_entries').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_examinations').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_email_events').first(),
      this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_audit_logs').first(),
      this.db.prepare('SELECT * FROM wb_background_jobs ORDER BY job_name ASC').all(),
    ]);

    return {
      counts: {
        accounts: accounts?.cnt || 0,
        programs: programs?.cnt || 0,
        weeks: weeks?.cnt || 0,
        lessons: lessons?.cnt || 0,
        dictionaryEntries: dictEntries?.cnt || 0,
        examinations: exams?.cnt || 0,
        emailEvents: emailEvents?.cnt || 0,
        auditLogs: auditLogs?.cnt || 0,
      },
      centers: ADMIN_CENTERS,
      roles: RBAC_ROLES,
      jobs: jobs.results || [],
    };
  }

  async assignRole(actor, targetAccountId, roleCode, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'rbac:manage')) {
      return { ok: false, status: 403, error: 'Bạn không có quyền phân vai trò quản trị (yêu cầu quyền rbac:manage).' };
    }
    const role = await this.db.prepare('SELECT id, code, name_vi FROM wb_roles WHERE code = ?').bind(roleCode).first();
    if (!role) return { ok: false, status: 404, error: 'Vai trò không tồn tại.' };

    await this.db
      .prepare('INSERT OR IGNORE INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, ?, ?)')
      .bind(targetAccountId, role.id, actor.accountId)
      .run();

    await this.authService.recordAudit(actor.accountId, 'rbac.role_assigned', 'wb_account_roles', targetAccountId, ipAddress, { roleCode });
    return { ok: true, role };
  }

  async toggleBackgroundJob(actor, jobName, action, ipAddress = null) {
    if (!this.authService.hasPermission(actor, 'infrastructure:manage')) {
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

  async updateContentStatus(actor, tableName, itemId, newStatus, ipAddress = null) {
    const allowedTables = new Set(['wb_programs', 'wb_curricula', 'wb_courses', 'wb_lessons', 'wb_dictionary_entries']);
    const allowedStatuses = new Set(['draft', 'in_review', 'editing', 'approved', 'published', 'archived']);
    if (!allowedTables.has(tableName) || !allowedStatuses.has(newStatus)) {
      return { ok: false, status: 400, error: 'Bảng hoặc trạng thái duyệt học thuật không hợp lệ.' };
    }
    if (newStatus === 'published' && !this.authService.hasPermission(actor, 'curriculum:publish')) {
      return { ok: false, status: 403, error: 'Bạn không có quyền phát hành nội dung học thuật chính thức.' };
    }
    await this.db
      .prepare(`UPDATE ${tableName} SET review_status = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(newStatus, itemId)
      .run();
    await this.authService.recordAudit(actor.accountId, 'academic.status_updated', tableName, itemId, ipAddress, { newStatus });
    return { ok: true, tableName, itemId, newStatus };
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
      variables: { senderName, ticketId, subject },
    });

    return { ok: true, ticketId, emailStatus: emailRes.status };
  }
}
