import { crypto } from '../config/runtime.js';
import { RBAC_ROLES } from '../config/constants.js';
import { requireAuth } from '../security/rbac.middleware.js';

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

    // PHẦN XVIII: Không tự động cấp quyền Admin cho tài khoản đăng ký đầu tiên (luôn là 'user')
    const trialEnds = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    const defaultPrivacy = {
      show_email: false,
      show_phone: false,
      show_location: false,
      allow_stranger_messages: false,
      profile_visibility: is_minor ? 'members_only' : 'public',
      online_status: true,
      native_or_support_languages: ['vi'],
      practice_mode: 'Trực tuyến qua tin nhắn và bài tập nhóm',
      study_preferences: 'Thực hành phản xạ ngắn mỗi ngày'
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

    // Khởi tạo gói dùng thử 07 ngày Người Dùng bản Plus
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

    // Khởi tạo cài đặt nhận thông báo mặc định
    this.db.run(
      `INSERT OR IGNORE INTO notification_preferences (
        user_id, in_app_enabled, email_system, email_transaction, email_organization,
        email_connection, email_community, email_security, study_reminder_enabled, updated_at
      ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, ?)`,
      [userId, nowIso]
    );

    // Tạo thông báo chào mừng trong website
    this.createNotification({
      userId,
      category: 'system',
      title: 'Chào mừng bạn đến với WORD BRIDGE',
      message: 'Tài khoản của bạn đã được kích hoạt 07 ngày trải nghiệm Người Dùng bản Plus. Hãy bắt đầu bài đánh giá trình độ hoặc thực hành ngay!',
      linkUrl: '/hoc-tap'
    });

    // Khởi tạo tài khoản điểm thành viên thân thiết
    const refCode = 'WB' + cleanUsername.slice(0, 4).toUpperCase() + crypto.randomInt(1000, 9999);
    this.db.run(
      `INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points, tier, referral_code, referred_by_code, updated_at)
       VALUES (?, 50, 50, 'Cơ bản', ?, '', ?)`,
      [userId, refCode, nowIso]
    );

    // Đưa email chào mừng và OTP xác minh vào hàng đợi
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
      deviceName: clientMeta.deviceName || 'Trình duyệt Web',
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
      throw new Error('Tài khoản đang bị tạm khóa. Vui lòng liên hệ bộ phận Chăm sóc khách hàng tại cskh@wordbridge.io.vn.');
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
      deviceName: clientMeta.deviceName || 'Trình duyệt Web',
      ipAddress: clientMeta.ipAddress || '127.0.0.1',
      userAgent: clientMeta.userAgent || ''
    });

    this.emailAdapter.enqueueEmail({
      templateSlug: 'login-alert.html',
      toEmail: user.email,
      variables: {
        full_name: user.full_name,
        device_name: clientMeta.deviceName || 'Trình duyệt Web',
        ip_address: clientMeta.ipAddress || '127.0.0.1',
        ref_code: session.session_id.toUpperCase()
      }
    });

    return {
      user: this.sanitizeUserForSelf(user),
      session
    };
  }

  requestPasswordReset({ email }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = this.db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản gắn với địa chỉ email này.');
    }
    const otpInfo = this.authService.issueEmailOtp({
      email: cleanEmail,
      userId: user.id,
      purpose: 'reset_password',
      fullName: user.full_name
    });
    return {
      ok: true,
      email: cleanEmail,
      message: 'Mã xác thực khôi phục mật khẩu đã được tạo và đưa vào hàng đợi gửi email.',
      otp_verification: otpInfo
    };
  }

  resetPasswordWithOtp({ email, otp_code, new_password, confirm_password }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = this.db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản cần khôi phục mật khẩu.');
    }
    this.authService.verifyEmailOtp({
      email: cleanEmail,
      purpose: 'reset_password',
      otpCode: otp_code
    });
    const pwdCheck = this.authService.validatePasswordPolicy(new_password, confirm_password);
    if (!pwdCheck.valid) {
      throw new Error(pwdCheck.issues.join(' '));
    }
    const { salt, hash } = this.authService.hashPassword(new_password);
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE users SET password_hash = ?, password_salt = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
      [hash, salt, nowIso, user.id]
    );
    // Thu hồi các phiên cũ sau khi đặt lại mật khẩu
    this.db.run(`UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ?`, [user.id]);

    this.emailAdapter.enqueueEmail({
      templateSlug: 'password-changed.html',
      toEmail: user.email,
      variables: { full_name: user.full_name, ref_code: 'PWDRESET-' + Date.now() }
    });
    return { reset: true, password_strength: pwdCheck.strength };
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
    if (body.native_or_support_languages) {
      updatedPrivacy.native_or_support_languages = Array.isArray(body.native_or_support_languages)
        ? body.native_or_support_languages
        : [String(body.native_or_support_languages)];
    }
    if (body.practice_mode) {
      updatedPrivacy.practice_mode = String(body.practice_mode).trim();
    }
    if (body.study_preferences) {
      updatedPrivacy.study_preferences = String(body.study_preferences).trim();
    }
    // Bảo vệ người chưa thành niên & người dùng: Không bao giờ bật công khai vị trí chính xác hoặc tự động công khai SĐT
    updatedPrivacy.show_location = false;
    if (current.is_minor) {
      updatedPrivacy.show_phone = false;
      updatedPrivacy.show_email = false;
    }

    const fullName = body.full_name ? String(body.full_name).trim() : current.full_name;
    const bio = body.bio !== undefined ? String(body.bio).trim() : current.bio;
    const learningLangs = body.learning_languages
      ? JSON.stringify(Array.isArray(body.learning_languages) ? body.learning_languages : [body.learning_languages])
      : current.learning_languages;
    const level = body.proficiency_level || current.proficiency_level;
    const goals = body.learning_goals || current.learning_goals;
    const interests = body.interests
      ? JSON.stringify(Array.isArray(body.interests) ? body.interests : String(body.interests).split(',').map(s => s.trim()).filter(Boolean))
      : current.interests;
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

  listUserSessions(user, currentSessionId = '') {
    requireAuth(user);
    const rows = this.db.query(
      `SELECT id, device_name, ip_address, user_agent, is_revoked, expires_at, created_at, last_active_at
       FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    );
    return rows.map(r => ({
      ...r,
      is_current: r.id === currentSessionId,
      is_revoked: Boolean(r.is_revoked)
    }));
  }

  revokeSessionById(user, sessionId) {
    requireAuth(user);
    this.db.run(
      `UPDATE user_sessions SET is_revoked = 1 WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );
    return { revoked: true, session_id: sessionId };
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

  getNotificationPreferences(user) {
    requireAuth(user);
    let pref = this.db.get(`SELECT * FROM notification_preferences WHERE user_id = ?`, [user.id]);
    if (!pref) {
      const nowIso = new Date().toISOString();
      this.db.run(
        `INSERT INTO notification_preferences (
          user_id, in_app_enabled, email_system, email_transaction, email_organization,
          email_connection, email_community, email_security, study_reminder_enabled, updated_at
        ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, ?)`,
        [user.id, nowIso]
      );
      pref = this.db.get(`SELECT * FROM notification_preferences WHERE user_id = ?`, [user.id]);
    }
    return {
      user_id: pref.user_id,
      in_app_enabled: Boolean(pref.in_app_enabled),
      email_system: Boolean(pref.email_system),
      email_transaction: Boolean(pref.email_transaction),
      email_organization: Boolean(pref.email_organization),
      email_connection: Boolean(pref.email_connection),
      email_community: Boolean(pref.email_community),
      email_security: true, // Thông báo bảo mật thiết yếu luôn bật
      study_reminder_enabled: Boolean(pref.study_reminder_enabled),
      updated_at: pref.updated_at
    };
  }

  updateNotificationPreferences(user, body = {}) {
    requireAuth(user);
    const current = this.getNotificationPreferences(user);
    const nowIso = new Date().toISOString();
    const next = {
      in_app_enabled: body.in_app_enabled !== undefined ? (body.in_app_enabled ? 1 : 0) : (current.in_app_enabled ? 1 : 0),
      email_system: body.email_system !== undefined ? (body.email_system ? 1 : 0) : (current.email_system ? 1 : 0),
      email_transaction: body.email_transaction !== undefined ? (body.email_transaction ? 1 : 0) : (current.email_transaction ? 1 : 0),
      email_organization: body.email_organization !== undefined ? (body.email_organization ? 1 : 0) : (current.email_organization ? 1 : 0),
      email_connection: body.email_connection !== undefined ? (body.email_connection ? 1 : 0) : (current.email_connection ? 1 : 0),
      email_community: body.email_community !== undefined ? (body.email_community ? 1 : 0) : (current.email_community ? 1 : 0),
      email_security: 1,
      study_reminder_enabled: body.study_reminder_enabled !== undefined ? (body.study_reminder_enabled ? 1 : 0) : (current.study_reminder_enabled ? 1 : 0)
    };
    this.db.run(
      `UPDATE notification_preferences
       SET in_app_enabled = ?, email_system = ?, email_transaction = ?, email_organization = ?,
           email_connection = ?, email_community = ?, email_security = 1, study_reminder_enabled = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        next.in_app_enabled,
        next.email_system,
        next.email_transaction,
        next.email_organization,
        next.email_connection,
        next.email_community,
        next.study_reminder_enabled,
        nowIso,
        user.id
      ]
    );
    return this.getNotificationPreferences(user);
  }

  createNotification({ userId, category = 'system', title, message, linkUrl = '/' }) {
    if (!userId || !title) return null;
    const id = 'ntf_' + crypto.randomBytes(8).toString('hex');
    const nowIso = new Date().toISOString();
    this.db.run(
      `INSERT INTO notifications (id, user_id, category, title, message, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, category, String(title).trim(), String(message || '').trim(), linkUrl, nowIso]
    );
    return this.db.get(`SELECT * FROM notifications WHERE id = ?`, [id]);
  }

  listNotifications(user) {
    requireAuth(user);
    return this.db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 40`,
      [user.id]
    ).map(n => ({ ...n, is_read: Boolean(n.is_read) }));
  }

  markNotificationRead(user, { notification_id = null, mark_all = false } = {}) {
    requireAuth(user);
    if (mark_all) {
      this.db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [user.id]);
    } else if (notification_id) {
      this.db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [notification_id, user.id]);
    }
    return { ok: true, notifications: this.listNotifications(user) };
  }

  sanitizeUserForSelf(row) {
    if (!row) return null;
    const privacy = JSON.parse(row.privacy_settings || '{}');
    const planLabelMap = {
      personal_free: 'Người Dùng bản Miễn Phí',
      personal_plus_monthly: 'Người Dùng bản Plus – Tháng',
      personal_plus_yearly: 'Người Dùng bản Plus – Năm',
      org_plus_monthly: 'Tổ Chức Plus – Tháng',
      org_plus_yearly: 'Tổ Chức Plus – Năm'
    };
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
      native_or_support_languages: privacy.native_or_support_languages || ['vi'],
      practice_mode: privacy.practice_mode || 'Trực tuyến qua tin nhắn và bài tập nhóm',
      study_preferences: privacy.study_preferences || 'Thực hành phản xạ ngắn mỗi ngày',
      privacy_settings: privacy,
      is_minor: Boolean(row.is_minor),
      role: row.role,
      role_name_vi: RBAC_ROLES[row.role]?.name || 'Thành viên Cá nhân',
      plan_code: row.plan_code,
      plan_name_vi: planLabelMap[row.plan_code] || row.plan_code,
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
      native_or_support_languages: privacy.native_or_support_languages || ['vi'],
      proficiency_level: row.proficiency_level,
      learning_goals: row.learning_goals,
      interests: JSON.parse(row.interests || '[]'),
      available_hours: row.available_hours,
      practice_mode: privacy.practice_mode || 'Trực tuyến qua tin nhắn và bài tập nhóm',
      study_preferences: privacy.study_preferences || 'Thực hành phản xạ ngắn mỗi ngày',
      // Không bao giờ tự động công khai email, số điện thoại hoặc vị trí chính xác
      email: undefined,
      phone: undefined,
      exact_location: undefined
    };
  }
}

export { UsersModule };
export default { UsersModule };
