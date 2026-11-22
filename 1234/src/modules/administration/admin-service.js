import { ADMIN_CENTERS, RBAC_ROLES } from '../../config/constants.js';
import { generateId } from '../../utils/crypto.js';

/**
 * WORD BRIDGE — 100% Vietnamese Administration & Operations Service (Section 73–76)
 */




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

/**
 * WORD BRIDGE — Operational Automation & Background Jobs Service (V3.1)
 * Actually re-dispatches RETRYING emails via EmailService.retryQueuedEvent().
 */

export class JobsService {
  constructor(db, emailService, studentBenefitService) {
    this.db = db;
    this.emailService = emailService;
    this.studentBenefitService = studentBenefitService;
  }

  async runJob(jobName) {
    const job = await this.db
      .prepare('SELECT * FROM wb_background_jobs WHERE job_name = ?')
      .bind(jobName)
      .first();

    if (!job) {
      throw new Error(`Không tìm thấy tác vụ nền: ${jobName}`);
    }
    if (job.status === 'paused') {
      return { skipped: true, reason: 'Tác vụ đang tạm dừng.' };
    }
    if (job.consecutive_failures >= job.max_consecutive_failures) {
      return { skipped: true, reason: 'Tác vụ đã chạm ngưỡng lỗi liên tiếp và tự động dừng để tránh vòng lặp vô hạn.' };
    }

    try {
      let summary = {};
      if (jobName === 'student_benefit_expiration_sync') {
        summary = await this.studentBenefitService.processExpiredBenefits();
      } else if (jobName === 'cleanup_expired_tokens_and_sessions') {
        const resTokens = await this.db
          .prepare("DELETE FROM wb_verification_tokens WHERE datetime(expires_at) < datetime('now', '-7 days')")
          .run();
        const resSessions = await this.db
          .prepare("DELETE FROM wb_sessions WHERE datetime(expires_at) < datetime('now', '-30 days')")
          .run();
        const resStates = await this.db
          .prepare("DELETE FROM wb_oauth_states WHERE datetime(expires_at) < datetime('now', '-1 days')")
          .run();
        const resChallenges = await this.db
          .prepare("DELETE FROM wb_webauthn_challenges WHERE datetime(expires_at) < datetime('now', '-1 days')")
          .run();
        summary = {
          cleanedTokens: resTokens.meta?.changes || 0,
          cleanedSessions: resSessions.meta?.changes || 0,
          cleanedOAuthStates: resStates.meta?.changes || 0,
          cleanedWebAuthnChallenges: resChallenges.meta?.changes || 0,
        };
      } else if (jobName === 'email_retry_dispatcher') {
        const pending = await this.db
          .prepare(`
            SELECT id FROM wb_email_events
            WHERE delivery_status = 'RETRYING'
              AND (next_retry_at IS NULL OR datetime(next_retry_at) <= datetime('now'))
            LIMIT 25
          `)
          .all();
        const outcomes = [];
        for (const item of pending.results || []) {
          outcomes.push(await this.emailService.retryQueuedEvent(item.id));
        }
        summary = {
          processedCount: outcomes.length,
          succeededCount: outcomes.filter((o) => o.ok).length,
          outcomes,
        };
      } else if (jobName === 'system_health_monitor') {
        const dbCheck = await this.db.prepare('SELECT COUNT(*) AS cnt FROM wb_languages').first();
        summary = { languagesCount: dbCheck?.cnt || 0, status: 'healthy' };
      } else {
        summary = { note: 'Tác vụ đã chạy kiểm tra trạng thái chuẩn.' };
      }

      await this.db
        .prepare(`
          UPDATE wb_background_jobs
          SET last_run_at = datetime('now'), last_result_status = 'success',
              last_error = NULL, consecutive_failures = 0, updated_at = datetime('now')
          WHERE job_name = ?
        `)
        .bind(jobName)
        .run();

      return { ok: true, jobName, summary };
    } catch (err) {
      const nextFailures = (job.consecutive_failures || 0) + 1;
      const nextStatus = nextFailures >= job.max_consecutive_failures ? 'error' : job.status;
      await this.db
        .prepare(`
          UPDATE wb_background_jobs
          SET last_run_at = datetime('now'), last_result_status = 'failed',
              last_error = ?, consecutive_failures = ?, status = ?, updated_at = datetime('now')
          WHERE job_name = ?
        `)
        .bind(String(err.message).slice(0, 500), nextFailures, nextStatus, jobName)
        .run();
      return { ok: false, jobName, error: err.message };
    }
  }

  async runScheduledSweep() {
    const jobs = [
      'student_benefit_expiration_sync',
      'cleanup_expired_tokens_and_sessions',
      'email_retry_dispatcher',
      'system_health_monitor',
    ];
    const results = [];
    for (const j of jobs) {
      results.push(await this.runJob(j));
    }
    return results;
  }
}
