'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

class UsersModule {
  constructor(db, authService, emailAdapter) {
    this.db = db;
    this.authService = authService;
    this.emailAdapter = emailAdapter;
  }

  registerPersonalAccount(body, clientMeta = {}) {
    const {
      full_name,
      username,
      email,
      phone,
      password,
      confirm_password,
      accept_terms,
      accept_privacy,
      is_minor = false,
      guardian_consent = false,
      learning_languages = ['en'],
      proficiency_level = 'A1',
      learning_goals = 'Rèn luyện phản xạ giao tiếp hàng ngày'
    } = body || {};

    if (!full_name || String(full_name).trim().length < 2) {
      throw new Error('Vui lòng nhập Họ và tên hợp lệ.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Địa chỉ Email không hợp lệ.');
    }
    const cleanPhone = String(phone || '').replace(/\s+/g, '');
    if (!/^(\+84|0)[35789]\d{8}$/.test(cleanPhone)) {
      throw new Error('Số điện thoại là thông tin hồ sơ bắt buộc và phải đúng định dạng di động Việt Nam.');
    }
    if (!accept_terms || !accept_privacy) {
      throw new Error('Bạn phải đồng ý Điều khoản sử dụng và Chính sách dữ liệu cá nhân để đăng ký.');
    }
    if (is_minor && !guardian_consent) {
      throw new Error('Người dùng chưa thành niên cần xác nhận sự đồng ý của phụ huynh hoặc người giám hộ.');
    }

    const pwdCheck = this.authService.validatePasswordPolicy(password, confirm_password);
    if (!pwdCheck.valid) {
      throw new Error(pwdCheck.issues.join(' '));
    }

    const cleanUsername = String(username || cleanEmail.split('@')[0] + '_' + crypto.randomBytes(2).toString('hex'))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const existing = this.db.get('SELECT id FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanUsername]);
    if (existing) {
      throw new Error('Email hoặc tên người dùng đã tồn tại trên hệ thống WORD BRIDGE.');
    }

    const { salt, hash } = this.authService.hashPassword(password);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const nowIso = now.toISOString();

    // PHẦN 16.3: Tài khoản cá nhân mới được dùng thử Personal Plus 07 ngày
    const trialEnds = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    const defaultPrivacy = {
      show_email: false,
      show_phone: false,
      show_location: false,
      allow_stranger_messages: false,
      profile_visibility: is_minor ? 'members_only' : 'public',
      online_status: true
    };

    this.db.run(
      `INSERT INTO users (
        id, full_name, username, email, phone, phone_verified, email_verified,
        password_hash, password_salt, bio, learning_languages, proficiency_level,
        learning_goals, interests, available_hours, privacy_settings, is_minor,
        guardian_consent, role, plan_code, ai_daily_used, ai_usage_date, status,
        mfa_enabled, failed_login_attempts, locked_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'personal_plus_monthly', 0, ?, 'active', 0, 0, NULL, ?, ?)`,
      [
        userId,
        String(full_name).trim(),
        cleanUsername,
        cleanEmail,
        cleanPhone,
        hash,
        salt,
        'Thành viên cộng đồng thực hành ngoại ngữ WORD BRIDGE.',
        JSON.stringify(Array.isArray(learning_languages) ? learning_languages : ['en']),
        proficiency_level,
        learning_goals,
        JSON.stringify(['Giao tiếp', 'Từ vựng', 'Đọc hiểu']),
        '19:00 - 21:00',
        JSON.stringify(defaultPrivacy),
        is_minor ? 1 : 0,
        guardian_consent ? 1 : 0,
        nowIso.slice(0, 10),
        nowIso,
        nowIso
      ]
    );

    // Khởi tạo gói dùng thử 07 ngày Personal Plus
    const subId = 'sub_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT INTO subscriptions (id, user_id, org_id, plan_code, status, auto_renew, started_at, expires_at, history_json, created_at)
       VALUES (?, ?, NULL, 'personal_plus_monthly', 'trial', 0, ?, ?, ?, ?)`,
      [
        subId,
        userId,
        nowIso,
        trialEnds,
        JSON.stringify([{ action: 'trial_started', plan: 'personal_plus_monthly', days: 7, at: nowIso }]),
        nowIso
      ]
    );

    // Khởi tạo tài khoản điểm thành viên thân thiết (Loyalty)
    const refCode = 'WB' + cleanUsername.slice(0, 4).toUpperCase() + crypto.randomInt(1000, 9999);
    this.db.run(
      `INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points, tier, referral_code, referred_by_code, updated_at)
       VALUES (?, 50, 50, 'Cơ bản', ?, '', ?)`,
      [userId, refCode, nowIso]
    );

    // Gửi email chào mừng & xác minh email từ noreply@wordbridge.io.vn
    this.emailAdapter.enqueueEmail({
      templateSlug: 'welcome.html',
      toEmail: cleanEmail,
      variables: { full_name: String(full_name).trim(), ref_code: userId.toUpperCase() }
    });
    const otpInfo = this.authService.issueEmailOtp({
      email: cleanEmail,
      userId,
      purpose: 'register',
      fullName: String(full_name).trim()
    });

    const session = this.authService.createSession({
      userId,
      deviceName: clientMeta.deviceName || 'Web Browser',
      ipAddress: clientMeta.ipAddress || '127.0.0.1',
      userAgent: clientMeta.userAgent || ''
    });

    return {
      user: this.sanitizeUserForSelf(this.db.get('SELECT * FROM users WHERE id = ?', [userId])),
      session,
      trial: { plan_code: 'personal_plus_monthly', trial_days: 7, expires_at: trialEnds },
      otp_verification: otpInfo
    };
  }

  login(body, clientMeta = {}) {
    const { email, password } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = this.db.get('SELECT * FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanEmail]);
    if (!user) {
      throw new Error('Thông tin đăng nhập không chính xác.');
    }
    if (user.status === 'locked') {
      throw new Error('Tài khoản đang bị tạm khóa. Vui lòng liên hệ CSKH tại cskh@wordbridge.io.vn.');
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error(`Tài khoản đang bị tạm khóa chống dò mật khẩu đến ${user.locked_until}.`);
    }

    const ok = this.authService.verifyPassword(password, user.password_hash, user.password_salt);
    if (!ok) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      this.db.run(
        `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`,
        [attempts, lockedUntil, user.id]
      );
      throw new Error('Thông tin đăng nhập không chính xác.');
    }

    this.db.run(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`, [user.id]);
    const session = this.authService.createSession({
      userId: user.id,
      deviceName: clientMeta.deviceName || 'Web Browser',
      ipAddress: clientMeta.ipAddress || '127.0.0.1',
      userAgent: clientMeta.userAgent || ''
    });

    this.emailAdapter.enqueueEmail({
      templateSlug: 'login-alert.html',
      toEmail: user.email,
      variables: {
        full_name: user.full_name,
        device_name: clientMeta.deviceName || 'Web Browser',
        ip_address: clientMeta.ipAddress || '127.0.0.1',
        ref_code: session.session_id.toUpperCase()
      }
    });

    return {
      user: this.sanitizeUserForSelf(user),
      session
    };
  }

  changePassword(user, { current_password, new_password, confirm_password }) {
    requireAuth(user);
    const fullUser = this.db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    if (!this.authService.verifyPassword(current_password, fullUser.password_hash, fullUser.password_salt)) {
      throw new Error('Mật khẩu hiện tại không chính xác.');
    }
    const check = this.authService.validatePasswordPolicy(new_password, confirm_password);
    if (!check.valid) {
      throw new Error(check.issues.join(' '));
    }
    const { salt, hash } = this.authService.hashPassword(new_password);
    const now = new Date().toISOString();
    this.db.run(`UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?`, [
      hash,
      salt,
      now,
      user.id
    ]);
    this.emailAdapter.enqueueEmail({
      templateSlug: 'password-changed.html',
      toEmail: fullUser.email,
      variables: { full_name: fullUser.full_name, ref_code: 'PWD-' + Date.now() }
    });
    return { updated: true, password_strength: check.strength };
  }

  updateProfile(user, body) {
    requireAuth(user);
    const current = this.db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    const currentPrivacy = JSON.parse(current.privacy_settings || '{}');
    const updatedPrivacy = Object.assign({}, currentPrivacy, body.privacy_settings || {});
    // Bảo vệ người chưa thành niên: Không cho bật công khai vị trí hoặc số điện thoại
    if (current.is_minor) {
      updatedPrivacy.show_phone = false;
      updatedPrivacy.show_location = false;
    }

    const fullName = body.full_name ? String(body.full_name).trim() : current.full_name;
    const bio = body.bio !== undefined ? String(body.bio).trim() : current.bio;
    const learningLangs = body.learning_languages
      ? JSON.stringify(body.learning_languages)
      : current.learning_languages;
    const level = body.proficiency_level || current.proficiency_level;
    const goals = body.learning_goals || current.learning_goals;
    const interests = body.interests ? JSON.stringify(body.interests) : current.interests;
    const hours = body.available_hours || current.available_hours;
    const now = new Date().toISOString();

    this.db.run(
      `UPDATE users
       SET full_name = ?, bio = ?, learning_languages = ?, proficiency_level = ?,
           learning_goals = ?, interests = ?, available_hours = ?, privacy_settings = ?, updated_at = ?
       WHERE id = ?`,
      [fullName, bio, learningLangs, level, goals, interests, hours, JSON.stringify(updatedPrivacy), now, user.id]
    );

    this.emailAdapter.enqueueEmail({
      templateSlug: 'account-update.html',
      toEmail: current.email,
      variables: { full_name: fullName, ref_code: 'PROF-' + Date.now() }
    });

    return this.sanitizeUserForSelf(this.db.get('SELECT * FROM users WHERE id = ?', [user.id]));
  }

  revokeOtherSessions(user, currentSessionId) {
    requireAuth(user);
    this.db.run(
      `UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ? AND id != ?`,
      [user.id, currentSessionId || '']
    );
    this.emailAdapter.enqueueEmail({
      templateSlug: 'logout-alert.html',
      toEmail: user.email,
      variables: { full_name: user.full_name, ref_code: 'SES-REVOKE-' + Date.now() }
    });
    return { revoked_others: true };
  }

  sanitizeUserForSelf(row) {
    if (!row) return null;
    return {
      id: row.id,
      full_name: row.full_name,
      username: row.username,
      email: row.email,
      phone: row.phone,
      phone_verified: Boolean(row.phone_verified),
      email_verified: Boolean(row.email_verified),
      avatar_url: row.avatar_url,
      bio: row.bio,
      learning_languages: JSON.parse(row.learning_languages || '["en"]'),
      proficiency_level: row.proficiency_level,
      learning_goals: row.learning_goals,
      interests: JSON.parse(row.interests || '[]'),
      available_hours: row.available_hours,
      privacy_settings: JSON.parse(row.privacy_settings || '{}'),
      is_minor: Boolean(row.is_minor),
      role: row.role,
      plan_code: row.plan_code,
      status: row.status,
      created_at: row.created_at
    };
  }

  sanitizeUserForPublic(row) {
    if (!row) return null;
    const privacy = JSON.parse(row.privacy_settings || '{}');
    return {
      id: row.id,
      full_name: row.full_name,
      username: row.username,
      avatar_url: row.avatar_url,
      bio: row.bio,
      learning_languages: JSON.parse(row.learning_languages || '["en"]'),
      proficiency_level: row.proficiency_level,
      learning_goals: row.learning_goals,
      interests: JSON.parse(row.interests || '[]'),
      available_hours: row.available_hours,
      email: privacy.show_email ? row.email : undefined,
      // Không bao giờ công khai vị trí chính xác hoặc tự động công khai SĐT
      phone: undefined,
      exact_location: undefined
    };
  }
}

module.exports = { UsersModule };
