import { crypto } from '../config/runtime.js';
import { PASSWORD_POLICY, ALLOWED_OAUTH_PROVIDERS, RBAC_ROLES } from '../config/constants.js';
import { getOAuthProvidersStatus } from '../config/env.js';

/**
 * DỊCH VỤ XÁC THỰC, TÀI KHOẢN, OAUTH 2.0 THỰC TẾ & QUẢN TRỊ VIÊN RIÊNG BIỆT (PHẦN XVIII & XXIII.1)
 * - Tách biệt phiên thành viên (user_sessions) và phiên Quản trị viên (admin_sessions).
 * - Không tự động cấp quyền Admin cho tài khoản đăng ký đầu tiên.
 * - Tích hợp quy trình khởi tạo Admin đầu tiên an toàn phía máy chủ và mã bảo vệ băm PBKDF2.
 * - Hỗ trợ OAuth 2.0 có kiểm tra state chống CSRF và xác minh chính chủ trước khi liên kết.
 */
class AuthService {
  constructor(db, emailAdapter) {
    this.db = db;
    this.emailAdapter = emailAdapter;
  }

  validatePasswordPolicy(password, confirmPassword = null) {
    const pwd = String(password || '');
    const issues = [];
    if (pwd.length < PASSWORD_POLICY.MIN_LENGTH) {
      issues.push(`Mật khẩu phải có tối thiểu ${PASSWORD_POLICY.MIN_LENGTH} ký tự (hiện có ${pwd.length} ký tự).`);
    }
    const upperMatches = pwd.match(PASSWORD_POLICY.UPPERCASE_REGEX) || [];
    if (upperMatches.length < PASSWORD_POLICY.MIN_UPPERCASE) {
      issues.push(`Mật khẩu phải có ít nhất 0${PASSWORD_POLICY.MIN_UPPERCASE} chữ cái viết hoa.`);
    }
    const specialMatches = pwd.match(PASSWORD_POLICY.SPECIAL_CHAR_REGEX) || [];
    if (specialMatches.length < PASSWORD_POLICY.MIN_SPECIAL_CHARS) {
      issues.push(`Mật khẩu phải có ít nhất 0${PASSWORD_POLICY.MIN_SPECIAL_CHARS} ký tự đặc biệt (hiện có ${specialMatches.length}).`);
    }
    if (confirmPassword !== null && pwd !== String(confirmPassword)) {
      issues.push('Xác nhận mật khẩu không trùng khớp.');
    }
    let strength = 'Yếu';
    if (issues.length === 0) {
      strength = pwd.length >= 18 && specialMatches.length >= 4 ? 'Rất mạnh' : 'Mạnh';
    } else if (pwd.length >= 10) {
      strength = 'Trung bình';
    }
    return {
      valid: issues.length === 0,
      strength,
      issues
    };
  }

  hashPassword(password, salt = null) {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(String(password), usedSalt, 100000, 64, 'sha512').toString('hex');
    return { salt: usedSalt, hash };
  }

  verifyPassword(password, storedHash, storedSalt) {
    if (!storedHash || !storedSalt) return false;
    const { hash } = this.hashPassword(password, storedSalt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(String(storedHash || ''), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  issueEmailOtp({ email, userId = null, purpose = 'register', fullName = 'Thành viên' }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const recentCountRow = this.db.get(
      `SELECT COUNT(*) AS cnt FROM email_otps WHERE email = ? AND created_at > datetime('now', '-2 minutes')`,
      [cleanEmail]
    );
    if (recentCountRow && recentCountRow.cnt >= 5) {
      throw new Error('Bạn đã yêu cầu gửi mã OTP quá nhanh. Vui lòng đợi ít phút trước khi thử lại.');
    }

    const rawOtp = String(crypto.randomInt(100000, 999999));
    const otpHash = crypto.createHash('sha256').update(`${cleanEmail}:${purpose}:${rawOtp}`).digest('hex');
    const id = 'otp_' + crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    this.db.run(
      `INSERT INTO email_otps (id, email, user_id, purpose, otp_hash, attempts, max_attempts, used, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 5, 0, ?, ?)`,
      [id, cleanEmail, userId, purpose, otpHash, expiresAt, now.toISOString()]
    );

    let templateSlug = 'register-otp.html';
    if (purpose === 'login') templateSlug = 'login-otp.html';
    else if (purpose === 'reset_password') templateSlug = 'reset-password.html';

    this.emailAdapter.enqueueEmail({
      templateSlug,
      toEmail: cleanEmail,
      variables: {
        full_name: fullName,
        otp_code: rawOtp,
        token: rawOtp,
        ref_code: id.toUpperCase()
      },
      idempotencyKey: `otp_${id}`
    });

    return {
      otp_id: id,
      expires_at: expiresAt,
      _test_only_otp: process.env.NODE_ENV === 'test' ? rawOtp : undefined
    };
  }

  verifyEmailOtp({ email, purpose, otpCode }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const record = this.db.get(
      `SELECT * FROM email_otps WHERE email = ? AND purpose = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, purpose]
    );
    if (!record) {
      throw new Error('Không tìm thấy mã OTP hợp lệ hoặc mã đã được sử dụng.');
    }
    if (new Date(record.expires_at) < new Date()) {
      throw new Error('Mã OTP đã hết hạn.');
    }
    if (record.attempts >= record.max_attempts) {
      throw new Error('Mã OTP đã bị vô hiệu hóa do nhập sai quá số lần cho phép.');
    }
    const candidateHash = crypto.createHash('sha256').update(`${cleanEmail}:${purpose}:${String(otpCode).trim()}`).digest('hex');
    if (candidateHash !== record.otp_hash) {
      this.db.run(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?`, [record.id]);
      throw new Error(`Mã OTP không chính xác. Còn ${record.max_attempts - record.attempts - 1} lần thử.`);
    }
    this.db.run(`UPDATE email_otps SET used = 1 WHERE id = ?`, [record.id]);
    return { verified: true, otp_id: record.id };
  }

  createSession({ userId, deviceName = 'Trình duyệt Web', ipAddress = '127.0.0.1', userAgent = '' }) {
    const rawToken = 'wbs_' + crypto.randomBytes(28).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const sessionId = 'ses_' + crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    this.db.run(
      `INSERT INTO user_sessions (id, user_id, token_hash, device_name, ip_address, user_agent, is_revoked, expires_at, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [sessionId, userId, tokenHash, deviceName, ipAddress, userAgent, expiresAt, now.toISOString(), now.toISOString()]
    );
    return { session_id: sessionId, token: rawToken, expires_at: expiresAt };
  }

  revokeCurrentSession(rawToken) {
    if (!rawToken) return { revoked: false };
    const tokenHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex');
    this.db.run(`UPDATE user_sessions SET is_revoked = 1 WHERE token_hash = ?`, [tokenHash]);
    this.db.run(`UPDATE admin_sessions SET is_revoked = 1 WHERE token_hash = ?`, [tokenHash]);
    return { revoked: true };
  }

  authenticateToken(rawToken) {
    if (!rawToken) return null;
    const tokenStr = String(rawToken).trim();
    const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');

    if (tokenStr.startsWith('wbadm_')) {
      const admSession = this.db.get(
        `SELECT * FROM admin_sessions WHERE token_hash = ? AND is_revoked = 0`,
        [tokenHash]
      );
      if (!admSession) return null;
      if (new Date(admSession.expires_at) < new Date()) return null;
      const user = this.db.get(`SELECT * FROM users WHERE id = ?`, [admSession.admin_user_id]);
      if (!user || user.status !== 'active') return null;
      return { user, session: admSession, isAdminSession: true };
    }

    const session = this.db.get(
      `SELECT * FROM user_sessions WHERE token_hash = ? AND is_revoked = 0`,
      [tokenHash]
    );
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) return null;
    const user = this.db.get(`SELECT * FROM users WHERE id = ?`, [session.user_id]);
    if (!user || user.status !== 'active') return null;
    return { user, session, isAdminSession: false };
  }

  /**
   * PHẦN XVIII: Khởi tạo tài khoản Quản trị viên đầu tiên an toàn phía máy chủ.
   * Không tự động cấp quyền Admin cho tài khoản đăng ký đầu tiên.
   */
  ensureAdminSecurityState() {
    let row = this.db.get(`SELECT * FROM admin_security_state WHERE id = 'singleton'`);
    if (!row) {
      const nowIso = new Date().toISOString();
      this.db.run(
        `INSERT INTO admin_security_state (id, first_admin_bootstrapped, security_code_hash, security_code_salt, failed_attempts, locked_until, updated_at)
         VALUES ('singleton', 0, '', '', 0, NULL, ?)`,
        [nowIso]
      );
      row = this.db.get(`SELECT * FROM admin_security_state WHERE id = 'singleton'`);
    }
    return row;
  }

  bootstrapFirstAdmin({ full_name, email, phone, password, security_code, bootstrap_secret, role = 'super_admin' }, clientMeta = {}) {
    const state = this.ensureAdminSecurityState();
    const existingAdmin = this.db.get(
      `SELECT id FROM users WHERE role IN ('super_admin', 'system_admin') LIMIT 1`
    );
    if (state.first_admin_bootstrapped || existingAdmin) {
      const err = new Error('Tài khoản Quản trị viên đầu tiên đã được khởi tạo trước đó. Không cho phép tự chiếm quyền công khai.');
      err.statusCode = 403;
      throw err;
    }

    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET || '';
    if (!expectedSecret || String(bootstrap_secret || '') !== expectedSecret) {
      this.db.run(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
         VALUES (?, NULL, 'guest', 'admin_bootstrap_denied', 'admin_security', 'singleton', ?, ?, ?)`,
        [
          'aud_' + crypto.randomBytes(8).toString('hex'),
          clientMeta.ipAddress || '127.0.0.1',
          JSON.stringify({ reason: 'Invalid or unconfigured ADMIN_BOOTSTRAP_SECRET' }),
          new Date().toISOString()
        ]
      );
      const err = new Error('Mã thiết lập bảo mật máy chủ (ADMIN_BOOTSTRAP_SECRET) không hợp lệ hoặc chưa được cấu hình trên máy chủ.');
      err.statusCode = 403;
      throw err;
    }

    const pwdCheck = this.validatePasswordPolicy(password, password);
    if (!pwdCheck.valid) {
      throw new Error(pwdCheck.issues.join(' '));
    }
    if (!security_code || String(security_code).trim().length < 10) {
      throw new Error('Mã bảo vệ Quản trị viên phải có tối thiểu 10 ký tự và không dùng mã mặc định dễ đoán.');
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const { salt: pwdSalt, hash: pwdHash } = this.hashPassword(password);
    const { salt: codeSalt, hash: codeHash } = this.hashPassword(String(security_code).trim());
    const nowIso = new Date().toISOString();

    let adminUser = this.db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    const validAdminRole = RBAC_ROLES[role]?.isAdmin ? role : 'super_admin';

    if (!adminUser) {
      const adminId = 'usr_adm_' + crypto.randomBytes(6).toString('hex');
      const uname = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') + '_admin';
      this.db.run(
        `INSERT INTO users (
          id, full_name, username, email, phone, phone_verified, email_verified,
          password_hash, password_salt, role, plan_code, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, 'personal_plus_yearly', 'active', ?, ?)`,
        [
          adminId,
          String(full_name || 'Quản trị viên Hệ thống').trim(),
          uname,
          cleanEmail,
          String(phone || '0988504210').trim(),
          pwdHash,
          pwdSalt,
          validAdminRole,
          nowIso,
          nowIso
        ]
      );
      adminUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [adminId]);
    } else {
      this.db.run(
        `UPDATE users SET role = ?, password_hash = ?, password_salt = ?, email_verified = 1, updated_at = ? WHERE id = ?`,
        [validAdminRole, pwdHash, pwdSalt, nowIso, adminUser.id]
      );
      adminUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [adminUser.id]);
    }

    this.db.run(
      `UPDATE admin_security_state
       SET first_admin_bootstrapped = 1, security_code_hash = ?, security_code_salt = ?, failed_attempts = 0, locked_until = NULL, updated_at = ?
       WHERE id = 'singleton'`,
      [codeHash, codeSalt, nowIso]
    );

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'admin_first_bootstrapped', 'users', ?, ?, ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        adminUser.id,
        adminUser.role,
        adminUser.id,
        clientMeta.ipAddress || '127.0.0.1',
        JSON.stringify({ email: adminUser.email, role: adminUser.role }),
        nowIso
      ]
    );

    return {
      bootstrapped: true,
      admin_user: {
        id: adminUser.id,
        full_name: adminUser.full_name,
        email: adminUser.email,
        role: adminUser.role
      }
    };
  }

  /**
   * PHẦN XVIII: Đăng nhập Quản trị viên riêng biệt (/quan-tri/dang-nhap -> POST /api/admin/auth/login)
   * - Kiểm tra giới hạn lượt thử, khóa tạm thời khi dò mã, ghi nhật ký truy cập và cảnh báo bảo mật.
   * - Cấp phiên Admin riêng (wbadm_...).
   */
  loginAdmin({ email, password, security_code = '' }, clientMeta = {}) {
    const state = this.ensureAdminSecurityState();
    const now = new Date();
    const nowIso = now.toISOString();
    const ip = clientMeta.ipAddress || '127.0.0.1';

    if (state.locked_until && new Date(state.locked_until) > now) {
      const err = new Error(`Cổng đăng nhập Quản trị đang tạm khóa chống dò mã đến ${state.locked_until}.`);
      err.statusCode = 429;
      throw err;
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = this.db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [cleanEmail, cleanEmail]);

    const recordFailure = (reason) => {
      const attempts = (state.failed_attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000).toISOString() : null;
      this.db.run(
        `UPDATE admin_security_state SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = 'singleton'`,
        [attempts, lockedUntil, nowIso]
      );
      this.db.run(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
         VALUES (?, ?, 'guest', 'admin_login_failed', 'admin_portal', ?, ?, ?, ?)`,
        [
          'aud_' + crypto.randomBytes(8).toString('hex'),
          user ? user.id : null,
          cleanEmail,
          ip,
          JSON.stringify({ reason, attempts, locked_until: lockedUntil }),
          nowIso
        ]
      );
      if (attempts >= 3 && user) {
        this.emailAdapter.enqueueEmail({
          templateSlug: 'security-alert.html',
          toEmail: user.email,
          variables: {
            full_name: user.full_name,
            event_name: 'Phát hiện nhiều lần đăng nhập hoặc dò mã Quản trị thất bại',
            ip_address: ip,
            ref_code: 'SEC-ADM-' + Date.now()
          }
        });
      }
    };

    if (!user || user.status !== 'active') {
      recordFailure('Account not found or inactive');
      const err = new Error('Thông tin xác thực Quản trị viên không chính xác.');
      err.statusCode = 401;
      throw err;
    }

    const roleSpec = RBAC_ROLES[user.role];
    if (!roleSpec || !roleSpec.isAdmin) {
      recordFailure('Non-admin account attempted admin portal login');
      const err = new Error('Tài khoản thành viên thông thường không được phép đăng nhập vào Cổng Quản trị hệ thống.');
      err.statusCode = 403;
      throw err;
    }

    if (!this.verifyPassword(password, user.password_hash, user.password_salt)) {
      recordFailure('Invalid password');
      const err = new Error('Thông tin xác thực Quản trị viên không chính xác.');
      err.statusCode = 401;
      throw err;
    }

    if (state.security_code_hash && state.security_code_salt) {
      if (!this.verifyPassword(String(security_code || '').trim(), state.security_code_hash, state.security_code_salt)) {
        recordFailure('Invalid admin security code');
        const err = new Error('Mã bảo vệ Quản trị viên không chính xác.');
        err.statusCode = 401;
        throw err;
      }
    }

    this.db.run(
      `UPDATE admin_security_state SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = 'singleton'`,
      [nowIso]
    );

    const rawAdminToken = 'wbadm_' + crypto.randomBytes(28).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawAdminToken).digest('hex');
    const admSesId = 'admses_' + crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();

    this.db.run(
      `INSERT INTO admin_sessions (id, admin_user_id, role, token_hash, ip_address, user_agent, is_revoked, expires_at, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [admSesId, user.id, user.role, tokenHash, ip, clientMeta.userAgent || '', expiresAt, nowIso, nowIso]
    );

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'admin_login_success', 'admin_portal', ?, ?, ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        user.id,
        user.role,
        admSesId,
        ip,
        JSON.stringify({ session_id: admSesId, role_name: roleSpec.name }),
        nowIso
      ]
    );

    return {
      admin_user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
        role_name_vi: roleSpec.name
      },
      admin_session: {
        session_id: admSesId,
        token: rawAdminToken,
        expires_at: expiresAt
      }
    };
  }

  /**
   * PHẦN XXI.9 & XXIII.1: Tích hợp luồng OAuth 2.0 thực tế (Google, Facebook, Microsoft, Apple)
   */
  initiateOAuthFlow({ provider, redirectUri = 'https://wordbridge.io.vn/api/auth/oauth/callback', userId = null }, workerEnv = null) {
    const cleanProvider = String(provider || '').toLowerCase();
    if (!ALLOWED_OAUTH_PROVIDERS.includes(cleanProvider)) {
      throw new Error(`Nhà cung cấp '${provider}' không nằm trong danh mục hỗ trợ (Chỉ hỗ trợ Google, Facebook, Microsoft, Apple).`);
    }
    const statusMap = getOAuthProvidersStatus(workerEnv);
    const provInfo = statusMap[cleanProvider];

    const state = 'oastate_' + crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

    this.db.run(
      `INSERT INTO oauth_states (state, provider, code_verifier, redirect_uri, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [state, cleanProvider, codeVerifier, redirectUri, userId, expiresAt, now.toISOString()]
    );

    const envSource = workerEnv || process.env;
    const clientIdMap = {
      google: envSource.GOOGLE_CLIENT_ID,
      facebook: envSource.FACEBOOK_CLIENT_ID,
      microsoft: envSource.MICROSOFT_CLIENT_ID,
      apple: envSource.APPLE_CLIENT_ID
    };
    const clientId = clientIdMap[cleanProvider] || '';

    let authorizationUrl = null;
    if (provInfo.configured && clientId) {
      const challenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      });
      authorizationUrl = `${provInfo.auth_endpoint}?${params.toString()}`;
    }

    return {
      provider: cleanProvider,
      provider_name: provInfo.name,
      configured: provInfo.configured,
      state,
      redirect_uri: redirectUri,
      authorization_url: authorizationUrl,
      message: provInfo.configured
        ? `Đang chuyển hướng xác thực OAuth 2.0 tới ${provInfo.name}.`
        : `Nhà cung cấp ${provInfo.name} chưa được cấu hình Client ID/Secret trong biến môi trường máy chủ; vui lòng sử dụng đăng nhập bằng Email và mật khẩu hoặc cấu hình khóa OAuth.`
    };
  }

  completeOAuthCallback({ state, provider, provider_user_id, provider_email, full_name = 'Thành viên OAuth', ownership_verified = false }, clientMeta = {}) {
    const stateRow = this.db.get(`SELECT * FROM oauth_states WHERE state = ?`, [String(state || '')]);
    if (!stateRow) {
      throw new Error('Trạng thái phiên OAuth (state) không hợp lệ hoặc không tồn tại.');
    }
    if (new Date(stateRow.expires_at) < new Date()) {
      this.db.run(`DELETE FROM oauth_states WHERE state = ?`, [stateRow.state]);
      throw new Error('Phiên xác thực OAuth đã hết hạn.');
    }
    const cleanProvider = String(provider || stateRow.provider).toLowerCase();
    if (!ALLOWED_OAUTH_PROVIDERS.includes(cleanProvider)) {
      throw new Error('Nhà cung cấp OAuth không được hỗ trợ.');
    }
    this.db.run(`DELETE FROM oauth_states WHERE state = ?`, [stateRow.state]);

    const cleanEmail = String(provider_email || '').trim().toLowerCase();
    if (!cleanEmail || !provider_user_id) {
      throw new Error('Thiếu thông tin định danh tài khoản từ nhà cung cấp OAuth.');
    }

    const existingLink = this.db.get(
      `SELECT * FROM oauth_links WHERE provider = ? AND provider_user_id = ?`,
      [cleanProvider, String(provider_user_id)]
    );

    if (existingLink) {
      const linkedUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [existingLink.user_id]);
      if (!linkedUser || linkedUser.status !== 'active') {
        throw new Error('Tài khoản liên kết hiện đang bị khóa hoặc không hoạt động.');
      }
      const session = this.createSession({
        userId: linkedUser.id,
        deviceName: `OAuth (${cleanProvider.toUpperCase()})`,
        ipAddress: clientMeta.ipAddress || '127.0.0.1',
        userAgent: clientMeta.userAgent || ''
      });
      return { user: linkedUser, session, is_new_user: false };
    }

    const existingUser = this.db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    if (existingUser) {
      if (!ownership_verified) {
        throw new Error('Email này đã tồn tại trên hệ thống. Để bảo mật, vui lòng xác minh chính chủ bằng mật khẩu hoặc mã OTP trước khi liên kết OAuth.');
      }
      this.linkOAuthAccount({
        userId: existingUser.id,
        provider: cleanProvider,
        providerUserId: String(provider_user_id),
        providerEmail: cleanEmail,
        ownershipVerified: true
      });
      const session = this.createSession({
        userId: existingUser.id,
        deviceName: `OAuth (${cleanProvider.toUpperCase()})`,
        ipAddress: clientMeta.ipAddress || '127.0.0.1',
        userAgent: clientMeta.userAgent || ''
      });
      return { user: existingUser, session, is_new_user: false, linked: true };
    }

    throw new Error('Tài khoản chưa đăng ký hồ sơ trên WORD BRIDGE. Vui lòng hoàn tất đăng ký tài khoản với số điện thoại định danh và điều khoản sử dụng trước khi liên kết OAuth.');
  }

  linkOAuthAccount({ userId, provider, providerUserId, providerEmail, ownershipVerified = false }) {
    const cleanProvider = String(provider || '').toLowerCase();
    if (!ALLOWED_OAUTH_PROVIDERS.includes(cleanProvider)) {
      throw new Error(`Phương thức đăng nhập liên kết '${provider}' không được hỗ trợ (Chỉ hỗ trợ Google, Facebook, Microsoft, Apple; không hỗ trợ Zalo).`);
    }
    if (!ownershipVerified) {
      throw new Error('Tài khoản liên kết phải được xác minh chính chủ qua Email OTP hoặc mật khẩu trước khi gộp vào hồ sơ chung.');
    }
    const id = 'oa_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO oauth_links (id, user_id, provider, provider_user_id, provider_email, ownership_verified, verified_at, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, userId, cleanProvider, providerUserId, providerEmail, now, now]
    );
    return { id, provider: cleanProvider, ownership_verified: true };
  }
}

export { AuthService };
export default { AuthService };
