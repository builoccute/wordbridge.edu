/**
 * WORD BRIDGE — Authentication, Session, Password Reset, Profile,
 * WebAuthn/FIDO2 Passkey & Strict Backend RBAC Service (V4.1 One Domain)
 */

import { generateId, hashPassword, verifyPassword, randomTokenHex, sha256Hex } from '../utils/crypto.js';
import { validateRegistrationPayload, validateEmail, validatePasswordStrength } from '../utils/validation.js';
import { PLANS, ADMIN_ROLE_CODES, BRAND } from '../config/constants.js';

export class AuthService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = String(env.APP_BASE_URL || BRAND.websiteUrl).replace(/\/+$/, '');
    this.tokenPepper = env.TOKEN_PEPPER || '';
  }

  async getSecurityPolicy() {
    let maxAttempts = 5;
    let lockoutMinutes = 15;
    try {
      const rows = (await this.db
        .prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key IN ('security.max_login_attempts', 'security.lockout_minutes')")
        .all()).results || [];
      for (const r of rows) {
        if (r.config_key === 'security.max_login_attempts') {
          const v = Number(r.config_value);
          if (Number.isFinite(v) && v >= 3 && v <= 20) maxAttempts = v;
        }
        if (r.config_key === 'security.lockout_minutes') {
          const v = Number(r.config_value);
          if (Number.isFinite(v) && v >= 1 && v <= 1440) lockoutMinutes = v;
        }
      }
    } catch {
      // Fallback to safe defaults if table is unavailable
    }
    return { maxAttempts, lockoutMinutes };
  }

  async register(payload, requestMeta = {}) {
    const check = validateRegistrationPayload(payload);
    if (!check.valid) return { ok: false, status: 400, errors: check.errors };
    const { fullName, dateOfBirth, phoneNumber, email, password, schoolName, workplaceName } = check.data;

    const existing = await this.db.prepare('SELECT id FROM wb_accounts WHERE email = ?').bind(email).first();
    if (existing) {
      return { ok: false, status: 409, errors: ['Địa chỉ email này đã được đăng ký tài khoản WORD BRIDGE.'] };
    }

    const accountId = generateId('acc');
    const passwordHash = await hashPassword(password);

    await this.db
      .prepare(`
        INSERT INTO wb_accounts (
          id, email, password_hash, full_name, date_of_birth,
          phone_number, school_name, workplace_name, account_type,
          email_verified, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'personal', 0, 'pending_verification')
      `)
      .bind(accountId, email, passwordHash, fullName, dateOfBirth, phoneNumber, schoolName, workplaceName)
      .run();

    await this.db.prepare('INSERT INTO wb_profiles (account_id) VALUES (?)').bind(accountId).run();
    await this.db
      .prepare("INSERT INTO wb_entitlements (id, account_id, plan_code, source, storage_quota_bytes) VALUES (?, ?, 'PERSONAL_FREE', 'default', ?)")
      .bind(generateId('ent'), accountId, PLANS.PERSONAL_FREE.storageQuotaBytes)
      .run();

    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    await this.db
      .prepare(`
        INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at)
        VALUES (?, ?, ?, 'email_verification', ?, datetime('now', '+30 minutes'))
      `)
      .bind(generateId('tok'), accountId, tokenHash, email)
      .run();

    const verifyUrl = `${this.baseUrl}/verify-email?token=${rawToken}`;
    const emailResult = await this.emailService.sendEventEmail({
      eventType: 'UserRegistered',
      templateKey: 'verify_email',
      recipientEmail: email,
      accountId,
      idempotencyKey: `verify_email:${accountId}`,
      variables: { fullName, ctaUrl: verifyUrl, expiresMinutes: 30 },
    });

    await this.recordAudit(accountId, 'account.registered', 'wb_accounts', accountId, requestMeta.ipAddress, {
      emailVerificationStatus: emailResult.status,
    });

    return {
      ok: true,
      status: 201,
      accountId,
      emailStatus: emailResult.status,
      ...(this.env.EXPOSE_TEST_TOKENS === 'true' ? { verificationToken: rawToken } : {}),
    };
  }

  async verifyEmailToken(rawToken, requestMeta = {}) {
    if (!rawToken || typeof rawToken !== 'string') {
      return { ok: false, status: 400, error: 'Thiếu mã xác minh email.' };
    }
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    const tok = await this.db
      .prepare("SELECT id, account_id, expires_at, consumed_at FROM wb_verification_tokens WHERE token_hash = ? AND token_type = 'email_verification'")
      .bind(tokenHash)
      .first();

    if (!tok) return { ok: false, status: 400, error: 'Liên kết xác minh không hợp lệ.' };
    if (tok.consumed_at) return { ok: false, status: 400, error: 'Liên kết xác minh đã được sử dụng.' };

    const expiredCheck = await this.db
      .prepare("SELECT CASE WHEN datetime(?) < datetime('now') THEN 1 ELSE 0 END AS is_expired")
      .bind(tok.expires_at)
      .first();
    if (expiredCheck?.is_expired === 1) {
      return { ok: false, status: 400, error: 'Liên kết xác minh đã hết hạn. Vui lòng yêu cầu gửi lại.' };
    }

    await this.db.prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ?").bind(tok.id).run();
    await this.db
      .prepare("UPDATE wb_accounts SET email_verified = 1, email_verified_at = datetime('now'), status = 'active', updated_at = datetime('now') WHERE id = ?")
      .bind(tok.account_id)
      .run();

    const account = await this.db.prepare('SELECT id, email, full_name FROM wb_accounts WHERE id = ?').bind(tok.account_id).first();
    await this.emailService.sendEventEmail({
      eventType: 'EmailVerified',
      templateKey: 'welcome_registered',
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `welcome:${account.id}`,
      variables: { fullName: account.full_name, ctaUrl: `${this.baseUrl}/my-learning` },
    });

    const session = await this.createSession(account.id, requestMeta);
    await this.recordAudit(account.id, 'account.email_verified', 'wb_accounts', account.id, requestMeta.ipAddress, {});
    return { ok: true, account, session };
  }

  async login({ email, password }, requestMeta = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!validateEmail(normalizedEmail) || !password) {
      return { ok: false, status: 400, error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
    }

    const account = await this.db
      .prepare('SELECT id, email, password_hash, full_name, email_verified, status, failed_login_attempts, locked_until FROM wb_accounts WHERE email = ?')
      .bind(normalizedEmail)
      .first();

    if (!account) return { ok: false, status: 401, error: 'Email hoặc mật khẩu không chính xác.' };

    if (account.locked_until) {
      const lockCheck = await this.db
        .prepare("SELECT CASE WHEN datetime(?) > datetime('now') THEN 1 ELSE 0 END AS locked")
        .bind(account.locked_until)
        .first();
      if (lockCheck?.locked === 1) {
        return { ok: false, status: 429, error: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.' };
      }
    }

    const validPwd = await verifyPassword(password, account.password_hash);
    if (!validPwd) {
      const { maxAttempts, lockoutMinutes } = await this.getSecurityPolicy();
      const attempts = (account.failed_login_attempts || 0) + 1;
      const shouldLock = attempts >= maxAttempts;
      await this.db
        .prepare(`UPDATE wb_accounts SET failed_login_attempts = ?, locked_until = CASE WHEN ? = 1 THEN datetime('now', '+${lockoutMinutes} minutes') ELSE NULL END, updated_at = datetime('now') WHERE id = ?`)
        .bind(attempts, shouldLock ? 1 : 0, account.id)
        .run();
      await this.recordAudit(account.id, 'auth.login_failed', 'wb_accounts', account.id, requestMeta.ipAddress, {
        attempts,
        locked: shouldLock,
      });
      return { ok: false, status: 401, error: 'Email hoặc mật khẩu không chính xác.' };
    }

    if (account.email_verified !== 1) return { ok: false, status: 403, error: 'Tài khoản chưa xác minh email.' };
    if (account.status !== 'active') return { ok: false, status: 403, error: 'Tài khoản hiện không ở trạng thái hoạt động.' };

    await this.db.prepare("UPDATE wb_accounts SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(account.id).run();
    const session = await this.createSession(account.id, requestMeta);

    await this.emailService.sendEventEmail({
      eventType: 'NewLoginDetected',
      templateKey: 'new_login_detected',
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `login:${session.sessionId}`,
      variables: {
        timestamp: new Date().toISOString(),
        userAgent: requestMeta.userAgent || 'Trình duyệt web',
        ipAddress: requestMeta.ipAddress || 'ẩn',
        ctaUrl: `${this.baseUrl}/account/sessions`,
      },
    });

    await this.recordAudit(account.id, 'auth.login', 'wb_sessions', session.sessionId, requestMeta.ipAddress, {
      userAgent: (requestMeta.userAgent || '').slice(0, 120),
    });
    return { ok: true, account: { id: account.id, email: account.email, fullName: account.full_name }, session };
  }

  async createSession(accountId, requestMeta = {}) {
    const rawSessionToken = randomTokenHex(32);
    const sessionTokenHash = await sha256Hex(rawSessionToken, this.tokenPepper);
    const csrfToken = randomTokenHex(24);
    const sessionId = generateId('ses');

    await this.db
      .prepare(`
        INSERT INTO wb_sessions (id, account_id, session_token_hash, csrf_token, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
      `)
      .bind(sessionId, accountId, sessionTokenHash, csrfToken, requestMeta.ipAddress || null, (requestMeta.userAgent || '').slice(0, 255))
      .run();

    return { sessionId, rawSessionToken, csrfToken };
  }

  async authenticateSession(rawSessionToken) {
    if (!rawSessionToken) return null;
    const tokenHash = await sha256Hex(rawSessionToken, this.tokenPepper);
    const row = await this.db
      .prepare(`
        SELECT s.id AS session_id, s.csrf_token, s.account_id,
               a.email, a.full_name, a.status, a.email_verified,
               a.school_name, a.workplace_name, a.phone_number, a.date_of_birth,
               e.plan_code, e.storage_quota_bytes, e.expires_at AS plan_expires_at
        FROM wb_sessions s
        JOIN wb_accounts a ON a.id = s.account_id
        LEFT JOIN wb_entitlements e ON e.account_id = a.id
        WHERE s.session_token_hash = ?
          AND s.revoked_at IS NULL
          AND datetime(s.expires_at) > datetime('now')
          AND a.status = 'active'
      `)
      .bind(tokenHash)
      .first();

    if (!row) return null;

    const rolesResult = await this.db
      .prepare('SELECT r.code, r.name_vi FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = ?')
      .bind(row.account_id)
      .all();

    const permsResult = await this.db
      .prepare('SELECT DISTINCT p.code FROM wb_account_roles ar JOIN wb_role_permissions rp ON rp.role_id = ar.role_id JOIN wb_permissions p ON p.id = rp.permission_id WHERE ar.account_id = ?')
      .bind(row.account_id)
      .all();

    return {
      sessionId: row.session_id,
      csrfToken: row.csrf_token,
      accountId: row.account_id,
      email: row.email,
      fullName: row.full_name,
      schoolName: row.school_name,
      workplaceName: row.workplace_name,
      phoneNumber: row.phone_number,
      dateOfBirth: row.date_of_birth,
      planCode: row.plan_code || 'PERSONAL_FREE',
      storageQuotaBytes: row.storage_quota_bytes || PLANS.PERSONAL_FREE.storageQuotaBytes,
      planExpiresAt: row.plan_expires_at,
      roles: (rolesResult.results || []).map((r) => r.code),
      roleLabels: (rolesResult.results || []).map((r) => r.name_vi),
      permissions: new Set((permsResult.results || []).map((p) => p.code)),
    };
  }

  isSuperAdmin(user) {
    return Boolean(user && Array.isArray(user.roles) && user.roles.includes('super_admin'));
  }

  hasPermission(user, permissionCode) {
    if (!user || !Array.isArray(user.roles)) return false;
    if (user.roles.includes('super_admin')) return true;
    return Boolean(user.permissions && typeof user.permissions.has === 'function' && user.permissions.has(permissionCode));
  }

  /**
   * STRICT ADMIN ROLE CHECK:
   * Only returns true when the user holds an explicitly recognized administrative role
   * from ADMIN_ROLE_CODES (never treats arbitrary non-admin roles as admin).
   */
  hasAnyAdminRole(user) {
    if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return false;
    return user.roles.some((roleCode) => ADMIN_ROLE_CODES.has(roleCode));
  }

  async revokeSession(sessionId, actorAccountId, ipAddress = null) {
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE id = ? AND account_id = ?").bind(sessionId, actorAccountId).run();
    await this.recordAudit(actorAccountId, 'auth.session_revoked', 'wb_sessions', sessionId, ipAddress, {});
  }

  async requestPasswordReset(email, ipAddress = null) {
    const normalized = String(email || '').trim().toLowerCase();
    const account = await this.db.prepare('SELECT id, email, full_name FROM wb_accounts WHERE email = ?').bind(normalized).first();
    if (!account) return { ok: true };

    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    const tokenId = generateId('rst');
    await this.db
      .prepare("INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at) VALUES (?, ?, ?, 'password_reset', ?, datetime('now', '+30 minutes'))")
      .bind(tokenId, account.id, tokenHash, account.email)
      .run();

    await this.emailService.sendEventEmail({
      eventType: 'PasswordResetRequested',
      templateKey: 'password_reset',
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `pwd_reset:${tokenId}`,
      variables: { email: account.email, ctaUrl: `${this.baseUrl}/reset-password?token=${rawToken}`, expiresMinutes: 30 },
    });
    await this.recordAudit(account.id, 'auth.password_reset_requested', 'wb_accounts', account.id, ipAddress, {});
    return { ok: true, ...(this.env.EXPOSE_TEST_TOKENS === 'true' ? { resetToken: rawToken } : {}) };
  }

  async resetPassword({ token, newPassword, confirmPassword }, requestMeta = {}) {
    if (!token || typeof token !== 'string') {
      return { ok: false, status: 400, error: 'Thiếu mã đặt lại mật khẩu.' };
    }
    if (!newPassword || newPassword !== confirmPassword) {
      return { ok: false, status: 400, error: 'Mật khẩu xác nhận không khớp.' };
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { ok: false, status: 400, error: strength.error };
    }

    const tokenHash = await sha256Hex(token, this.tokenPepper);
    const tok = await this.db
      .prepare("SELECT id, account_id, expires_at, consumed_at FROM wb_verification_tokens WHERE token_hash = ? AND token_type = 'password_reset'")
      .bind(tokenHash)
      .first();

    if (!tok) return { ok: false, status: 400, error: 'Liên kết đặt lại mật khẩu không hợp lệ.' };
    if (tok.consumed_at) return { ok: false, status: 400, error: 'Liên kết đặt lại mật khẩu đã được sử dụng.' };

    const expiredCheck = await this.db
      .prepare("SELECT CASE WHEN datetime(?) < datetime('now') THEN 1 ELSE 0 END AS is_expired")
      .bind(tok.expires_at)
      .first();
    if (expiredCheck?.is_expired === 1) {
      return { ok: false, status: 400, error: 'Liên kết đặt lại mật khẩu đã hết hạn.' };
    }

    const passwordHash = await hashPassword(newPassword);
    await this.db.prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ?").bind(tok.id).run();
    await this.db
      .prepare("UPDATE wb_accounts SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?")
      .bind(passwordHash, tok.account_id)
      .run();
    await this.db
      .prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL")
      .bind(tok.account_id)
      .run();

    const account = await this.db.prepare('SELECT id, email FROM wb_accounts WHERE id = ?').bind(tok.account_id).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: 'PasswordChanged',
        templateKey: 'password_changed',
        recipientEmail: account.email,
        accountId: account.id,
        idempotencyKey: `pwd_changed:${tok.id}`,
        variables: { timestamp: new Date().toISOString(), ctaUrl: `${this.baseUrl}/account/security` },
      });
    }

    await this.recordAudit(tok.account_id, 'auth.password_reset_completed', 'wb_accounts', tok.account_id, requestMeta.ipAddress, {});
    return { ok: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  async updateProfile(accountId, payload, ipAddress = null) {
    const fullName = String(payload.fullName || '').trim();
    const phoneNumber = String(payload.phoneNumber || '').trim();
    const schoolName = String(payload.schoolName || '').trim();
    const workplaceName = String(payload.workplaceName || '').trim();
    const dateOfBirth = String(payload.dateOfBirth || '').trim();

    if (fullName.length < 2) {
      return { ok: false, status: 400, error: 'Họ và tên phải có tối thiểu 2 ký tự.' };
    }
    if (!phoneNumber || !schoolName || !workplaceName) {
      return { ok: false, status: 400, error: 'Số điện thoại, Trường học và Nơi làm việc không được để trống.' };
    }

    await this.db
      .prepare(`
        UPDATE wb_accounts
        SET full_name = ?, phone_number = ?, school_name = ?, workplace_name = ?,
            date_of_birth = CASE WHEN ? != '' THEN ? ELSE date_of_birth END,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(fullName, phoneNumber, schoolName, workplaceName, dateOfBirth, dateOfBirth, accountId)
      .run();

    await this.recordAudit(accountId, 'account.profile_updated', 'wb_accounts', accountId, ipAddress, {});
    return { ok: true, message: 'Đã cập nhật hồ sơ cá nhân.' };
  }

  async changePassword(accountId, { currentPassword, newPassword, confirmPassword }, ipAddress = null) {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      return { ok: false, status: 400, error: 'Vui lòng nhập mật khẩu hiện tại và xác nhận mật khẩu mới khớp nhau.' };
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { ok: false, status: 400, error: strength.error };
    }
    const account = await this.db.prepare('SELECT id, email, password_hash FROM wb_accounts WHERE id = ?').bind(accountId).first();
    if (!account) return { ok: false, status: 404, error: 'Tài khoản không tồn tại.' };
    const valid = await verifyPassword(currentPassword, account.password_hash);
    if (!valid) return { ok: false, status: 401, error: 'Mật khẩu hiện tại không chính xác.' };

    const newHash = await hashPassword(newPassword);
    await this.db.prepare("UPDATE wb_accounts SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(newHash, accountId).run();
    await this.emailService.sendEventEmail({
      eventType: 'PasswordChanged',
      templateKey: 'password_changed',
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `pwd_chg:${accountId}:${Date.now()}`,
      variables: { timestamp: new Date().toISOString(), ctaUrl: `${this.baseUrl}/account/security` },
    });
    await this.recordAudit(accountId, 'auth.password_changed', 'wb_accounts', accountId, ipAddress, {});
    return { ok: true, message: 'Đổi mật khẩu thành công.' };
  }

  // ---- WebAuthn / FIDO2 Passkeys ----
  async createPasskeyRegistrationOptions(account) {
    const challenge = randomTokenHex(32);
    const id = generateId('wac');
    await this.db
      .prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'registration', datetime('now', '+5 minutes'))")
      .bind(id, account.accountId, challenge)
      .run();

    const existing = (await this.db.prepare('SELECT credential_id FROM wb_passkeys WHERE account_id = ? AND revoked_at IS NULL').bind(account.accountId).all()).results || [];
    return {
      ok: true,
      challengeId: id,
      publicKey: {
        challenge,
        rp: { id: this.env.WEBAUTHN_RP_ID || 'wordbridge.io.vn', name: this.env.WEBAUTHN_RP_NAME || 'WORD BRIDGE' },
        user: { id: account.accountId, name: account.email, displayName: account.fullName },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        excludeCredentials: existing.map((c) => ({ id: c.credential_id, type: 'public-key' })),
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
        timeout: 60000,
      },
    };
  }

  async verifyAndStorePasskeyRegistration(accountId, { challenge, credentialId, publicKeyCose, displayName, transports = [] }, ipAddress = null) {
    if (!challenge || !credentialId || !publicKeyCose || !displayName) {
      return { ok: false, status: 400, error: 'Thiếu challenge, credentialId, publicKeyCose hoặc tên Passkey.' };
    }
    const chRow = await this.db
      .prepare("SELECT * FROM wb_webauthn_challenges WHERE challenge = ? AND account_id = ? AND challenge_type = 'registration'")
      .bind(challenge, accountId)
      .first();
    if (!chRow || chRow.consumed_at) {
      return { ok: false, status: 400, error: 'WebAuthn challenge không hợp lệ hoặc đã sử dụng.' };
    }
    await this.db.prepare("UPDATE wb_webauthn_challenges SET consumed_at = datetime('now') WHERE id = ?").bind(chRow.id).run();

    const id = generateId('pk');
    await this.db
      .prepare('INSERT INTO wb_passkeys (id, account_id, credential_id, public_key_cose, sign_count, display_name, transports_json) VALUES (?, ?, ?, ?, 0, ?, ?)')
      .bind(id, accountId, credentialId, publicKeyCose, String(displayName).slice(0, 80), JSON.stringify(transports))
      .run();

    const account = await this.db.prepare('SELECT email FROM wb_accounts WHERE id = ?').bind(accountId).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: 'PasskeyAdded',
        templateKey: 'passkey_added',
        recipientEmail: account.email,
        accountId,
        idempotencyKey: `passkey_add:${id}`,
        variables: { passkeyName: displayName, ctaUrl: `${this.baseUrl}/account/passkeys` },
      });
    }
    await this.recordAudit(accountId, 'auth.passkey_added', 'wb_passkeys', id, ipAddress, { displayName });
    return { ok: true, passkeyId: id };
  }

  async createPasskeyAuthOptions(accountId = null) {
    const challenge = randomTokenHex(32);
    const id = generateId('wac');
    await this.db
      .prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'authentication', datetime('now', '+5 minutes'))")
      .bind(id, accountId, challenge)
      .run();
    return {
      ok: true,
      challengeId: id,
      publicKey: {
        challenge,
        rpId: this.env.WEBAUTHN_RP_ID || 'wordbridge.io.vn',
        userVerification: 'preferred',
        timeout: 60000,
      },
    };
  }

  async verifyPasskeyAssertion({ challenge, credentialId, newSignCount = 1 }, requestMeta = {}) {
    const chRow = await this.db
      .prepare("SELECT * FROM wb_webauthn_challenges WHERE challenge = ? AND challenge_type = 'authentication'")
      .bind(challenge || '')
      .first();
    if (!chRow || chRow.consumed_at) {
      return { ok: false, status: 400, error: 'WebAuthn authentication challenge không hợp lệ hoặc đã dùng.' };
    }
    const pk = await this.db
      .prepare('SELECT * FROM wb_passkeys WHERE credential_id = ? AND revoked_at IS NULL')
      .bind(credentialId || '')
      .first();
    if (!pk) return { ok: false, status: 404, error: 'Passkey không tồn tại hoặc đã bị thu hồi.' };
    if (Number(newSignCount) <= pk.sign_count && pk.sign_count > 0) {
      return { ok: false, status: 401, error: 'Phát hiện bất thường signCount (nghi ngờ nhân bản khóa).' };
    }

    await this.db.prepare("UPDATE wb_webauthn_challenges SET consumed_at = datetime('now') WHERE id = ?").bind(chRow.id).run();
    await this.db.prepare("UPDATE wb_passkeys SET sign_count = ?, last_used_at = datetime('now') WHERE id = ?").bind(Number(newSignCount), pk.id).run();

    const session = await this.createSession(pk.account_id, requestMeta);
    await this.recordAudit(pk.account_id, 'auth.passkey_login', 'wb_passkeys', pk.id, requestMeta.ipAddress, {});
    return { ok: true, accountId: pk.account_id, session };
  }

  async revokePasskey(accountId, passkeyId, ipAddress = null) {
    const pk = await this.db.prepare('SELECT id, display_name FROM wb_passkeys WHERE id = ? AND account_id = ?').bind(passkeyId, accountId).first();
    if (!pk) return { ok: false, status: 404, error: 'Không tìm thấy passkey thuộc tài khoản của bạn.' };
    await this.db.prepare("UPDATE wb_passkeys SET revoked_at = datetime('now') WHERE id = ?").bind(passkeyId).run();

    const account = await this.db.prepare('SELECT email FROM wb_accounts WHERE id = ?').bind(accountId).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: 'PasskeyRevoked',
        templateKey: 'passkey_revoked',
        recipientEmail: account.email,
        accountId,
        idempotencyKey: `passkey_rev:${passkeyId}`,
        variables: { passkeyName: pk.display_name, ctaUrl: `${this.baseUrl}/account/passkeys` },
      });
    }
    await this.recordAudit(accountId, 'auth.passkey_revoked', 'wb_passkeys', passkeyId, ipAddress, {});
    return { ok: true };
  }

  async recordAudit(actorAccountId, action, resourceType, resourceId, ipAddress = null, metadata = {}) {
    await this.db
      .prepare('INSERT INTO wb_audit_logs (id, actor_account_id, action, resource_type, resource_id, ip_address, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(generateId('aud'), actorAccountId, action, resourceType, resourceId, ipAddress, JSON.stringify(metadata))
      .run();
  }
}
