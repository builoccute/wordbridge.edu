/**
 * WORD BRIDGE — Authentication, Session, OAuth (State/Nonce/No-Auto-Merge),
 * WebAuthn/FIDO2 Passkey (Challenge/Attestation/Assertion) & RBAC Service (V3.1)
 */

import { generateId, hashPassword, verifyPassword, randomTokenHex, sha256Hex } from '../utils/crypto.js';
import { validateRegistrationPayload, validateEmail } from '../utils/validation.js';
import { PLANS } from '../config/constants.js';

const OAUTH_PROVIDERS = {
  google: { authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', clientIdKey: 'OAUTH_GOOGLE_CLIENT_ID', secretKey: 'OAUTH_GOOGLE_CLIENT_SECRET', scope: 'openid email profile' },
  facebook: { authUrl: 'https://www.facebook.com/v19.0/dialog/oauth', clientIdKey: 'OAUTH_FACEBOOK_CLIENT_ID', secretKey: 'OAUTH_FACEBOOK_CLIENT_SECRET', scope: 'email public_profile' },
  microsoft: { authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', clientIdKey: 'OAUTH_MICROSOFT_CLIENT_ID', secretKey: 'OAUTH_MICROSOFT_CLIENT_SECRET', scope: 'openid email profile' },
  apple: { authUrl: 'https://appleid.apple.com/auth/authorize', clientIdKey: 'OAUTH_APPLE_CLIENT_ID', secretKey: 'OAUTH_APPLE_PRIVATE_KEY', scope: 'name email' },
};

export class AuthService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = env.APP_BASE_URL || 'https://www.wordbridge.vn';
    this.tokenPepper = env.TOKEN_PEPPER || '';
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
      const attempts = (account.failed_login_attempts || 0) + 1;
      const shouldLock = attempts >= 5;
      await this.db
        .prepare("UPDATE wb_accounts SET failed_login_attempts = ?, locked_until = CASE WHEN ? = 1 THEN datetime('now', '+15 minutes') ELSE NULL END, updated_at = datetime('now') WHERE id = ?")
        .bind(attempts, shouldLock ? 1 : 0, account.id)
        .run();
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

    await this.recordAudit(account.id, 'auth.login', 'wb_sessions', session.sessionId, requestMeta.ipAddress, {});
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

  hasPermission(user, permissionCode) {
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    return user.permissions.has(permissionCode);
  }

  hasAnyAdminRole(user) {
    return Boolean(user && user.roles && user.roles.length > 0);
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

  // ---- OAuth 2.0 / OIDC Authorization Flow (Section 16) ----
  async startOAuthFlow(provider, redirectPath = '/my-learning', accountId = null) {
    const cfg = OAUTH_PROVIDERS[String(provider || '').toLowerCase()];
    if (!cfg) return { ok: false, status: 400, error: 'Nhà cung cấp OAuth không hợp lệ (chỉ hỗ trợ google, facebook, microsoft, apple).' };

    const clientId = this.env[cfg.clientIdKey];
    const clientSecret = this.env[cfg.secretKey];
    const state = randomTokenHex(24);
    const nonce = randomTokenHex(16);

    await this.db
      .prepare("INSERT INTO wb_oauth_states (state, provider, nonce, redirect_path, account_id, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now', '+10 minutes'))")
      .bind(state, provider.toLowerCase(), nonce, redirectPath, accountId)
      .run();

    if (!clientId || !clientSecret) {
      return {
        ok: false,
        status: 503,
        code: 'BLOCKED_UNCONFIGURED',
        state,
        provider: provider.toLowerCase(),
        error: `OAuth ${provider.toUpperCase()} đang ở trạng thái BLOCKED_UNCONFIGURED (thiếu ${cfg.clientIdKey}/${cfg.secretKey}). Không giả lập đăng nhập thành công.`,
      };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${this.baseUrl}/oauth/callback?provider=${provider.toLowerCase()}`,
      response_type: 'code',
      scope: cfg.scope,
      state,
      nonce,
    });
    return { ok: true, provider: provider.toLowerCase(), state, authorizationUrl: `${cfg.authUrl}?${params.toString()}` };
  }

  async handleOAuthCallback({ provider, state, code }) {
    const prov = String(provider || '').toLowerCase();
    if (!OAUTH_PROVIDERS[prov]) return { ok: false, status: 400, error: 'Nhà cung cấp OAuth không hợp lệ.' };
    if (!state) return { ok: false, status: 400, error: 'Thiếu tham số state chống CSRF cho OAuth.' };

    const row = await this.db
      .prepare('SELECT * FROM wb_oauth_states WHERE state = ? AND provider = ?')
      .bind(state, prov)
      .first();

    if (!row || row.consumed_at) {
      return { ok: false, status: 400, error: 'OAuth state không hợp lệ hoặc đã được sử dụng (chống replay).' };
    }

    await this.db.prepare("UPDATE wb_oauth_states SET consumed_at = datetime('now') WHERE state = ?").bind(state).run();

    const cfg = OAUTH_PROVIDERS[prov];
    if (!this.env[cfg.clientIdKey] || !this.env[cfg.secretKey]) {
      return {
        ok: false,
        status: 503,
        code: 'BLOCKED_UNCONFIGURED',
        error: `Không thể trao đổi OAuth code cho ${prov.toUpperCase()} vì thiếu credentials cấu hình. Tuyệt đối không giả lập phiên đăng nhập.`,
      };
    }
    if (!code) return { ok: false, status: 400, error: 'Thiếu authorization code từ nhà cung cấp OAuth.' };

    return {
      ok: false,
      status: 501,
      code: 'OAUTH_TOKEN_EXCHANGE_REQUIRES_LIVE_IDP',
      error: 'Cần môi trường kết nối trực tiếp tới OAuth IdP để xác thực token và hiển thị màn hình xác nhận liên kết tài khoản (không tự động gộp tài khoản trùng email).',
    };
  }

  // ---- WebAuthn / FIDO2 Passkeys (Section 17) ----
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
        rp: { id: this.env.WEBAUTHN_RP_ID || 'www.wordbridge.vn', name: this.env.WEBAUTHN_RP_NAME || 'WORD BRIDGE' },
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
        rpId: this.env.WEBAUTHN_RP_ID || 'www.wordbridge.vn',
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
