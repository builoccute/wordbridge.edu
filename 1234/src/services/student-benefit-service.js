/**
 * WORD BRIDGE — Student Benefit Service (Section 59)
 * - 3 months Thành viên free, strictly ONE TIME ONLY per account & school email
 * - ONLY accepted verification: school-issued student email (NO ID cards, NO certificates, NO alternative docs)
 * - Automatic expiration check downgrading to Thành viên FREE if no paid subscription
 */

import { generateId, randomTokenHex, sha256Hex } from '../utils/crypto.js';
import { isAcademicSchoolEmail } from '../utils/validation.js';
import { PLANS } from '../config/constants.js';

export class StudentBenefitService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = env.APP_BASE_URL || 'https://www.wordbridge.vn';
    this.tokenPepper = env.TOKEN_PEPPER || '';
  }

  async requestVerification(accountId, { schoolEmail, verificationMethod = 'school_email_only' }) {
    if (verificationMethod !== 'school_email_only') {
      return {
        ok: false,
        status: 400,
        error: 'Chính sách sinh viên WORD BRIDGE chỉ chấp nhận xác minh duy nhất qua email sinh viên do trường cấp. Không nhận ảnh thẻ sinh viên, giấy xác nhận hay hồ sơ thay thế.',
      };
    }

    const normalized = String(schoolEmail || '').trim().toLowerCase();
    if (!isAcademicSchoolEmail(normalized)) {
      return {
        ok: false,
        status: 400,
        error: 'Địa chỉ email không thuộc tên miền giáo dục hợp lệ do trường cấp (ví dụ: @*.edu.vn, @*.edu, @*.ac.*).',
      };
    }

    const existingAccountBenefit = await this.db
      .prepare('SELECT id, status FROM wb_student_benefits WHERE account_id = ?')
      .bind(accountId)
      .first();
    if (existingAccountBenefit) {
      return {
        ok: false,
        status: 409,
        error: 'Tài khoản này đã đăng ký hoặc đã sử dụng quyền lợi sinh viên (chỉ áp dụng một lần duy nhất).',
      };
    }

    const existingSchoolEmail = await this.db
      .prepare('SELECT id FROM wb_student_benefits WHERE school_email = ?')
      .bind(normalized)
      .first();
    if (existingSchoolEmail) {
      return {
        ok: false,
        status: 409,
        error: 'Email sinh viên này đã được sử dụng cho quyền lợi sinh viên trước đó.',
      };
    }

    const benefitId = generateId('stu');
    await this.db
      .prepare(`
        INSERT INTO wb_student_benefits (id, account_id, school_email, verification_method, status)
        VALUES (?, ?, ?, 'school_email_only', 'pending')
      `)
      .bind(benefitId, accountId, normalized)
      .run();

    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    await this.db
      .prepare(`
        INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at)
        VALUES (?, ?, ?, 'student_email_verification', ?, datetime('now', '+24 hours'))
      `)
      .bind(generateId('stok'), accountId, tokenHash, normalized)
      .run();

    const verifyUrl = `${this.baseUrl}/account/student-benefit?verify_token=${rawToken}`;
    await this.emailService.sendEventEmail({
      eventType: 'StudentVerificationRequested',
      templateKey: 'verify_email',
      recipientEmail: normalized,
      accountId,
      idempotencyKey: `student_verify:${benefitId}`,
      variables: {
        ctaUrl: verifyUrl,
        expiresMinutes: 1440,
        subjectOverride: 'Xác minh email sinh viên WORD BRIDGE (03 tháng Thành viên)',
      },
    });

    return {
      ok: true,
      benefitId,
      ...(this.env.EXPOSE_TEST_TOKENS === 'true' ? { verificationToken: rawToken } : {}),
    };
  }

  async confirmStudentEmail(rawToken) {
    const tokenHash = await sha256Hex(rawToken || '', this.tokenPepper);
    const tok = await this.db
      .prepare(`
        SELECT id, account_id, target_value, expires_at, consumed_at
        FROM wb_verification_tokens
        WHERE token_hash = ? AND token_type = 'student_email_verification'
      `)
      .bind(tokenHash)
      .first();

    if (!tok || tok.consumed_at) {
      return { ok: false, status: 400, error: 'Liên kết xác minh email sinh viên không hợp lệ hoặc đã dùng.' };
    }

    await this.db
      .prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ?")
      .bind(tok.id)
      .run();

    await this.db
      .prepare(`
        UPDATE wb_student_benefits
        SET status = 'active', activated_at = datetime('now'), expires_at = datetime('now', '+3 months'), updated_at = datetime('now')
        WHERE account_id = ? AND school_email = ?
      `)
      .bind(tok.account_id, tok.target_value)
      .run();

    const benefit = await this.db
      .prepare('SELECT id, school_email, expires_at FROM wb_student_benefits WHERE account_id = ?')
      .bind(tok.account_id)
      .first();

    await this.db
      .prepare(`
        UPDATE wb_entitlements
        SET plan_code = 'PERSONAL_PLUS', source = 'student_benefit',
            storage_quota_bytes = ?, starts_at = datetime('now'), expires_at = ?, updated_at = datetime('now')
        WHERE account_id = ?
      `)
      .bind(PLANS.PERSONAL_PLUS.storageQuotaBytes, benefit.expires_at, tok.account_id)
      .run();

    const account = await this.db.prepare('SELECT email FROM wb_accounts WHERE id = ?').bind(tok.account_id).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: 'StudentBenefitActivated',
        templateKey: 'student_benefit_activated',
        recipientEmail: account.email,
        accountId: tok.account_id,
        idempotencyKey: `student_activated:${benefit.id}`,
        variables: { schoolEmail: benefit.school_email, expiresAt: benefit.expires_at, ctaUrl: `${this.baseUrl}/account/subscription` },
      });
    }

    return { ok: true, benefit };
  }

  async processExpiredBenefits() {
    const expiredRows = await this.db
      .prepare(`
        SELECT sb.id, sb.account_id, sb.school_email, a.email
        FROM wb_student_benefits sb
        JOIN wb_accounts a ON a.id = sb.account_id
        JOIN wb_entitlements e ON e.account_id = sb.account_id
        WHERE sb.status = 'active'
          AND datetime(sb.expires_at) <= datetime('now')
          AND e.source = 'student_benefit'
      `)
      .all();

    let downgraded = 0;
    for (const row of expiredRows.results || []) {
      await this.db
        .prepare("UPDATE wb_student_benefits SET status = 'expired', expired_notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
        .bind(row.id)
        .run();

      await this.db
        .prepare(`
          UPDATE wb_entitlements
          SET plan_code = 'PERSONAL_FREE', source = 'default',
              storage_quota_bytes = ?, expires_at = NULL, updated_at = datetime('now')
          WHERE account_id = ?
        `)
        .bind(PLANS.PERSONAL_FREE.storageQuotaBytes, row.account_id)
        .run();

      await this.emailService.sendEventEmail({
        eventType: 'StudentBenefitExpired',
        templateKey: 'student_benefit_expired',
        recipientEmail: row.email,
        accountId: row.account_id,
        idempotencyKey: `student_expired:${row.id}`,
        variables: { ctaUrl: `${this.baseUrl}/account/subscription` },
      });
      downgraded += 1;
    }
    return { downgraded };
  }
}
