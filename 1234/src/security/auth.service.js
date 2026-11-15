'use strict';
const crypto = require('crypto');
const { PASSWORD_POLICY, ALLOWED_OAUTH_PROVIDERS } = require('../config/constants');

/**
 * DỊCH VỤ XÁC THỰC, MẬT KHẨU >= 15 KÝ TỰ, EMAIL OTP & PHIÊN (PHẦN 07)
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
    const { hash } = this.hashPassword(password, storedSalt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(String(storedHash || ''), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  issueEmailOtp({ email, userId = null, purpose = 'register', fullName = 'Thành viên' }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    // Giới hạn gửi lặp chống spam OTP
    const recentCountRow = this.db.get(
      `SELECT COUNT(*) AS cnt FROM email_otps WHERE email = ? AND created_at > datetime('now', '-2 minutes')`,
      [cleanEmail]
    );
    if (recentCountRow && recentCountRow.cnt >= 3) {
      throw new Error('Bạn đã yêu cầu gửi OTP quá nhanh. Vui lòng đợi ít phút trước khi thử lại.');
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

    const templateSlug = purpose === 'login' ? 'login-otp.html' : 'register-otp.html';
    this.emailAdapter.enqueueEmail({
      templateSlug,
      toEmail: cleanEmail,
      variables: {
        full_name: fullName,
        otp_code: rawOtp,
        ref_code: id.toUpperCase()
      },
      idempotencyKey: `otp_${id}`
    });

    // Lưu ý: Không lưu OTP đang hoạt động vào log công khai
    return {
      otp_id: id,
      expires_at: expiresAt,
      // Chỉ trả về mã thử nghiệm nội bộ khi chạy bộ kiểm thử tự động NODE_ENV === 'test'
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
      throw new Error('Mã OTP đã bị vô hiệu hóa do nhập sai quá số lần cho phép (Chống dò OTP).');
    }
    const candidateHash = crypto.createHash('sha256').update(`${cleanEmail}:${purpose}:${String(otpCode).trim()}`).digest('hex');
    if (candidateHash !== record.otp_hash) {
      this.db.run(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?`, [record.id]);
      throw new Error(`Mã OTP không chính xác. Còn ${record.max_attempts - record.attempts - 1} lần thử.`);
    }
    this.db.run(`UPDATE email_otps SET used = 1 WHERE id = ?`, [record.id]);
    return { verified: true, otp_id: record.id };
  }

  createSession({ userId, deviceName = 'Web Browser', ipAddress = '127.0.0.1', userAgent = '' }) {
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

  authenticateToken(rawToken) {
    if (!rawToken) return null;
    const tokenHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex');
    const session = this.db.get(
      `SELECT * FROM user_sessions WHERE token_hash = ? AND is_revoked = 0`,
      [tokenHash]
    );
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) return null;
    const user = this.db.get(`SELECT * FROM users WHERE id = ?`, [session.user_id]);
    if (!user || user.status !== 'active') return null;
    return { user, session };
  }

  linkOAuthAccount({ userId, provider, providerUserId, providerEmail, ownershipVerified = false }) {
    const cleanProvider = String(provider || '').toLowerCase();
    if (!ALLOWED_OAUTH_PROVIDERS.includes(cleanProvider)) {
      throw new Error(`Phương thức đăng nhập liên kết '${provider}' không được hỗ trợ (Chỉ hỗ trợ Google, Facebook, Microsoft, Apple; không hỗ trợ Zalo).`);
    }
    if (!ownershipVerified) {
      throw new Error('Tài khoản liên kết phải được xác minh chính chủ qua Email OTP hoặc mật khẩu trước khi gộp vào hồ sơ chung (Không tự động gộp chỉ vì trùng tên).');
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

module.exports = { AuthService };
