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
