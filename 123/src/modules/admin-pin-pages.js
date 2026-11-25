// src/modules/admin-pin-pages.js
// WORD BRIDGE V4.2.0 — Trung tâm Quản trị (/quan-tri) 100% Tiếng Việt
// + Khóa PIN 6 chữ số riêng từng tài khoản (PBKDF2-SHA256 + salt, khóa tạm thời, audit log, phiên quản trị có thời hạn & CSRF)

const ADMIN_SESSION_TTL_SECONDS = 30 * 60; // 30 phút
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

export function buildAdminSessionCookie(rawToken, isSecure = true, maxAge = ADMIN_SESSION_TTL_SECONDS) {
  const parts = [
    `wb_admin_session=${rawToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`
  ];
  if (isSecure) parts.push("Secure");
  return parts.join("; ");
}

export function clearAdminSessionCookie(isSecure = true) {
  return buildAdminSessionCookie("", isSecure, 0);
}

export class AdminPinService {
  constructor(db, authService, env = {}, helpers = {}) {
    this.db = db;
    this.authService = authService;
    this.env = env;
    this.hashPassword = helpers.hashPassword;
    this.verifyPassword = helpers.verifyPassword;
    this.randomTokenHex = helpers.randomTokenHex;
    this.sha256Hex = helpers.sha256Hex;
    this.generateId = helpers.generateId;
    this.timingSafeEqual = helpers.timingSafeEqual;
  }

  validatePinFormat(pin) {
    return typeof pin === "string" && /^\d{6}$/.test(pin);
  }

  async getPinStatus(accountId) {
    const row = await this.db.prepare(
      "SELECT account_id, failed_attempts, locked_until, must_reset, updated_at FROM wb_admin_pins WHERE account_id = ?"
    ).bind(accountId).first();
    if (!row) return { configured: false, locked: false, mustReset: false, failedAttempts: 0 };
    let locked = false;
    if (row.locked_until) {
      const check = await this.db.prepare("SELECT CASE WHEN datetime(?) > datetime('now') THEN 1 ELSE 0 END AS is_locked").bind(row.locked_until).first();
      locked = check?.is_locked === 1;
    }
    return {
      configured: true,
      locked,
      lockedUntil: locked ? row.locked_until : null,
      mustReset: row.must_reset === 1,
      failedAttempts: row.failed_attempts || 0,
      updatedAt: row.updated_at
    };
  }

  async setOrUpdatePin(actor, { pin, confirmPin, currentPassword = null, targetAccountId = null }, ipAddress = null) {
    if (!this.validatePinFormat(pin) || pin !== confirmPin) {
      return { ok: false, status: 400, error: "Mã PIN phải gồm đúng 6 chữ số (0–9) và khớp với ô xác nhận." };
    }
    if (/^(\d)\1{5}$/.test(pin) || ["123456", "654321", "012345"].includes(pin)) {
      return { ok: false, status: 400, error: "Mã PIN quá đơn giản. Vui lòng chọn 6 chữ số an toàn hơn." };
    }
    const accountId = targetAccountId && actor.roles?.includes("super_admin") ? targetAccountId : actor.accountId;
    const existing = await this.db.prepare("SELECT account_id FROM wb_admin_pins WHERE account_id = ?").bind(accountId).first();
    if (existing && accountId === actor.accountId && currentPassword !== null) {
      const acc = await this.db.prepare("SELECT password_hash FROM wb_accounts WHERE id = ?").bind(accountId).first();
      if (!acc || !(await this.verifyPassword(currentPassword, acc.password_hash))) {
        return { ok: false, status: 401, error: "Mật khẩu tài khoản xác minh danh tính không chính xác." };
      }
    }
    const pinHash = await this.hashPassword(`wb-admin-pin:${accountId}:${pin}`);
    await this.db.prepare(
      `INSERT INTO wb_admin_pins (account_id, pin_hash, failed_attempts, locked_until, must_reset, updated_by, updated_at)
       VALUES (?, ?, 0, NULL, 0, ?, datetime('now'))
       ON CONFLICT(account_id) DO UPDATE SET pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = NULL, must_reset = 0, updated_by = excluded.updated_by, updated_at = datetime('now')`
    ).bind(accountId, pinHash, actor.accountId).run();
    await this.authService.recordAudit(actor.accountId, existing ? "admin.pin_updated" : "admin.pin_initialized", "wb_admin_pins", accountId, ipAddress, {
      bySuperAdmin: accountId !== actor.accountId
    });
    return { ok: true, message: "Đã thiết lập mã PIN 6 chữ số an toàn." };
  }

  async markPinForResetBySuperAdmin(actor, targetAccountId, ipAddress = null) {
    if (!actor.roles?.includes("super_admin")) {
      return { ok: false, status: 403, error: "Chỉ Super Admin mới có quyền yêu cầu đặt lại PIN quản trị." };
    }
    await this.db.prepare(
      "UPDATE wb_admin_pins SET must_reset = 1, failed_attempts = 0, locked_until = NULL, updated_by = ?, updated_at = datetime('now') WHERE account_id = ?"
    ).bind(actor.accountId, targetAccountId).run();
    await this.db.prepare("UPDATE wb_admin_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(targetAccountId).run();
    await this.authService.recordAudit(actor.accountId, "admin.pin_reset_forced", "wb_admin_pins", targetAccountId, ipAddress, {});
    return { ok: true, message: "Đã thu hồi phiên quản trị và yêu cầu tài khoản đặt lại PIN 6 chữ số." };
  }

  async verifyPinAndCreateAdminSession(user, pin, requestMeta = {}) {
    if (!user || !this.authService.hasAnyAdminRole(user)) {
      return { ok: false, status: 403, error: "Tài khoản không có quyền truy cập Trung tâm Quản trị." };
    }
    if (!this.validatePinFormat(pin)) {
      return { ok: false, status: 400, error: "Vui lòng nhập đúng mã PIN gồm 6 chữ số." };
    }
    const row = await this.db.prepare("SELECT * FROM wb_admin_pins WHERE account_id = ?").bind(user.accountId).first();
    if (!row) {
      return { ok: false, status: 409, code: "PIN_NOT_SET", error: "Tài khoản quản trị chưa thiết lập mã PIN 6 chữ số." };
    }
    if (row.must_reset === 1) {
      return { ok: false, status: 409, code: "PIN_RESET_REQUIRED", error: "Tài khoản cần đặt lại mã PIN 6 chữ số mới trước khi tiếp tục." };
    }
    if (row.locked_until) {
      const lockCheck = await this.db.prepare("SELECT CASE WHEN datetime(?) > datetime('now') THEN 1 ELSE 0 END AS is_locked").bind(row.locked_until).first();
      if (lockCheck?.is_locked === 1) {
        await this.authService.recordAudit(user.accountId, "admin.pin_attempt_while_locked", "wb_admin_pins", user.accountId, requestMeta.ipAddress, {});
        return { ok: false, status: 429, error: `Mã PIN tạm thời bị khóa do nhập sai quá ${MAX_PIN_ATTEMPTS} lần. Vui lòng thử lại sau ${PIN_LOCKOUT_MINUTES} phút.` };
      }
    }
    const valid = await this.verifyPassword(`wb-admin-pin:${user.accountId}:${pin}`, row.pin_hash);
    if (!valid) {
      const attempts = (row.failed_attempts || 0) + 1;
      const shouldLock = attempts >= MAX_PIN_ATTEMPTS;
      await this.db.prepare(
        `UPDATE wb_admin_pins SET failed_attempts = ?, locked_until = CASE WHEN ? = 1 THEN datetime('now', '+${PIN_LOCKOUT_MINUTES} minutes') ELSE NULL END, updated_at = datetime('now') WHERE account_id = ?`
      ).bind(attempts, shouldLock ? 1 : 0, user.accountId).run();
      await this.authService.recordAudit(user.accountId, shouldLock ? "admin.pin_locked" : "admin.pin_failed", "wb_admin_pins", user.accountId, requestMeta.ipAddress, {
        attempts,
        locked: shouldLock
      });
      return {
        ok: false,
        status: shouldLock ? 429 : 401,
        error: shouldLock
          ? `Bạn đã nhập sai mã PIN ${MAX_PIN_ATTEMPTS} lần. Quyền truy cập quản trị tạm khóa trong ${PIN_LOCKOUT_MINUTES} phút.`
          : `Mã PIN 6 chữ số không chính xác (còn ${Math.max(0, MAX_PIN_ATTEMPTS - attempts)} lần thử).`
      };
    }

    await this.db.prepare("UPDATE wb_admin_pins SET failed_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE account_id = ?").bind(user.accountId).run();
    const rawToken = this.randomTokenHex(32);
    const tokenHash = await this.sha256Hex(rawToken, this.env.TOKEN_PEPPER || "");
    const csrfToken = this.randomTokenHex(24);
    const adminSessionId = this.generateId("adms");
    await this.db.prepare(
      `INSERT INTO wb_admin_sessions (id, account_id, parent_session_id, token_hash, csrf_token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+${Math.floor(ADMIN_SESSION_TTL_SECONDS / 60)} minutes'))`
    ).bind(adminSessionId, user.accountId, user.sessionId, tokenHash, csrfToken, requestMeta.ipAddress || null, (requestMeta.userAgent || "").slice(0, 200)).run();
    await this.authService.recordAudit(user.accountId, "admin.pin_verified", "wb_admin_sessions", adminSessionId, requestMeta.ipAddress, {});
    return { ok: true, adminSessionId, rawToken, csrfToken, expiresInSeconds: ADMIN_SESSION_TTL_SECONDS };
  }

  async authenticateAdminSession(user, rawAdminToken) {
    if (!user || !rawAdminToken || !this.authService.hasAnyAdminRole(user)) return null;
    const tokenHash = await this.sha256Hex(rawAdminToken, this.env.TOKEN_PEPPER || "");
    const row = await this.db.prepare(
      `SELECT id, account_id, parent_session_id, csrf_token, expires_at
       FROM wb_admin_sessions
       WHERE token_hash = ? AND account_id = ? AND parent_session_id = ? AND revoked_at IS NULL AND expires_at > datetime('now')`
    ).bind(tokenHash, user.accountId, user.sessionId).first();
    return row || null;
  }

  async revokeAdminSession(rawAdminToken, accountId, ipAddress = null) {
    if (rawAdminToken) {
      const tokenHash = await this.sha256Hex(rawAdminToken, this.env.TOKEN_PEPPER || "");
      await this.db.prepare("UPDATE wb_admin_sessions SET revoked_at = datetime('now') WHERE token_hash = ?").bind(tokenHash).run();
    } else if (accountId) {
      await this.db.prepare("UPDATE wb_admin_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(accountId).run();
    }
    if (accountId) {
      await this.authService.recordAudit(accountId, "admin.session_locked", "wb_admin_sessions", accountId, ipAddress, {});
    }
    return { ok: true };
  }

  async listActiveAdminSessions() {
    const res = await this.db.prepare(
      `SELECT s.id, s.account_id, a.email, a.full_name, s.ip_address, s.user_agent, s.created_at, s.expires_at
       FROM wb_admin_sessions s
       LEFT JOIN wb_accounts a ON a.id = s.account_id
       WHERE s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now')
       ORDER BY s.created_at DESC LIMIT 30`
    ).all().catch(() => ({ results: [] }));
    return res.results || [];
  }

  async revokeAdminSessionById(actor, adminSessionId, ipAddress = null) {
    if (!actor || !this.authService.hasAnyAdminRole(actor)) {
      return { ok: false, status: 403, error: "Không có quyền thu hồi phiên quản trị." };
    }
    if (!adminSessionId) return { ok: false, status: 400, error: "Thiếu mã phiên quản trị." };
    await this.db.prepare("UPDATE wb_admin_sessions SET revoked_at = datetime('now') WHERE id = ?").bind(adminSessionId).run();
    await this.authService.recordAudit(actor.accountId, "admin.session_revoked", "wb_admin_sessions", adminSessionId, ipAddress, {});
    return { ok: true, message: "Đã thu hồi phiên quản trị." };
  }
}

const ADMIN_NAV_ITEMS = [
  ["/quan-tri", "1. Tổng quan hệ thống"],
  ["/quan-tri/tai-khoan", "2. Quản lý tài khoản"],
  ["/quan-tri/nhan-su", "3. Nhân sự & Phân quyền"],
  ["/quan-tri/hoc-thuat", "4. Trung tâm học thuật"],
  ["/quan-tri/thu-vien", "5. Trung tâm thư viện"],
  ["/quan-tri/luyen-tap", "6. Trung tâm luyện tập"],
  ["/quan-tri/api", "7. Quản trị API & Tích hợp"],
  ["/quan-tri/du-lieu", "8. Dữ liệu & Lưu trữ"],
  ["/quan-tri/bao-mat", "9. Bảo mật & Kiểm toán"],
  ["/quan-tri/ho-tro", "10. Vận hành & Hỗ trợ"],
  ["/quan-tri/chinh-sach", "11. Chính sách & Pháp lý"],
  ["/quan-tri/email", "12. Email Center — Quản lý Email"]
];



export function renderAdminBootstrapPage({ escapeHtml, prefillUser = null }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Khởi tạo Quản trị tối cao đầu tiên — WORD BRIDGE</title>
  <link rel="icon" type="image/png" href="/branding/favicon.png" />
  <link rel="stylesheet" href="/styles/design-system.css?v=5.3.0" />
</head>
<body class="wb-admin-auth-body">
  <main class="wb-admin-auth-card" style="max-width:500px;">
    <div class="wb-admin-auth-brand">
      <div class="wb-admin-auth-shield" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
      </div>
      <span class="wb-admin-auth-tag">KHỞI TẠO HỆ THỐNG LẦN ĐẦU · SUPER ADMIN</span>
      <h1>Khởi tạo Quản trị WORD BRIDGE</h1>
      <p>Hệ thống chưa có tài khoản quản trị tối cao. Người đầu tiên truy cập cổng quản trị thực hiện thiết lập mã PIN 6 chữ số và khởi tạo tài khoản Super Admin (chỉ thực hiện duy nhất 01 lần).</p>
    </div>

    <div class="wb-boot-steps" aria-label="Tiến trình khởi tạo">
      <div id="wb-boot-ind-1" class="wb-boot-step active">Bước 1 · Mã PIN 6 chữ số</div>
      <div id="wb-boot-ind-2" class="wb-boot-step">Bước 2 · Tài khoản Super Admin</div>
    </div>

    <form id="wb-admin-bootstrap-form" class="wb-form" data-api-endpoint="/api/v1/admin/bootstrap" data-redirect-to="/quan-tri">
      <div id="wb-boot-step-1" style="display:grid;gap:14px;">
        <div class="wb-field">
          <label for="boot-pin">Mã PIN quản trị 6 chữ số đầu tiên *</label>
          <input id="boot-pin" class="wb-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" name="pin" placeholder="••••••" required autocomplete="off" style="letter-spacing:0.35em;font-size:1.25rem;text-align:center;" />
        </div>
        <div class="wb-field">
          <label for="boot-pin-confirm">Xác nhận mã PIN 6 chữ số *</label>
          <input id="boot-pin-confirm" class="wb-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" name="confirmPin" placeholder="••••••" required autocomplete="off" style="letter-spacing:0.35em;font-size:1.25rem;text-align:center;" />
        </div>
        <div id="wb-boot-step1-err" class="wb-alert wb-alert-error" hidden></div>
        <button type="button" id="wb-boot-next" class="wb-btn wb-btn-primary wb-btn-block wb-btn-lg">Tiếp tục sang Bước 2 →</button>
      </div>

      <div id="wb-boot-step-2" style="display:grid;gap:14px;" hidden>
        <div class="wb-field">
          <label for="boot-name">Họ và tên Quản trị viên tối cao *</label>
          <input id="boot-name" class="wb-input" name="fullName" value="${escapeHtml(prefillUser?.fullName || "")}" placeholder="Nhập họ và tên" required />
        </div>
        <div class="wb-field">
          <label for="boot-email">Email quản trị tối cao *</label>
          <input id="boot-email" class="wb-input" type="email" name="email" value="${escapeHtml(prefillUser?.email || "")}" placeholder="admin@wordbridge.io.vn" required autocomplete="username" />
        </div>
        <div class="wb-field">
          <label for="boot-password">Mật khẩu quản trị (tối thiểu 10 ký tự gồm hoa, thường, số) *</label>
          <div class="wb-input-wrap">
            <input id="boot-password" class="wb-input wb-input-has-toggle" type="password" name="password" placeholder="Nhập mật khẩu mạnh" required autocomplete="new-password" />
            <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="boot-password" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
          </div>
        </div>
        <div class="wb-field">
          <label for="boot-confirm-password">Xác nhận mật khẩu quản trị *</label>
          <div class="wb-input-wrap">
            <input id="boot-confirm-password" class="wb-input wb-input-has-toggle" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required autocomplete="new-password" />
            <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="boot-confirm-password" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
          </div>
        </div>
        <div data-form-status></div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;">
          <button type="button" id="wb-boot-prev" class="wb-btn wb-btn-outline">← Quay lại</button>
          <button type="submit" class="wb-btn wb-btn-primary wb-btn-lg">Hoàn tất &amp; Mở Quản trị</button>
        </div>
      </div>
    </form>

    <div class="wb-admin-auth-foot">
      <span>Sau khi hoàn tất, trang khởi tạo sẽ tự động khóa vĩnh viễn.</span>
      <a href="/">← Quay về trang công khai</a>
    </div>
  </main>
  <script src="/scripts/app.js?v=5.3.0" defer></script>
</body>
</html>`;
}

export function renderAdminLoginPage({ escapeHtml, notice = "" }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Đăng nhập Hệ thống Quản trị — WORD BRIDGE</title>
  <link rel="icon" type="image/png" href="/branding/favicon.png" />
  <link rel="stylesheet" href="/styles/design-system.css?v=5.3.0" />
</head>
<body class="wb-admin-auth-body">
  <main class="wb-admin-auth-card">
    <div class="wb-admin-auth-brand">
      <div class="wb-admin-auth-shield" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
      </div>
      <span class="wb-admin-auth-tag">CỔNG QUẢN TRỊ ĐỘC LẬP · WORD BRIDGE</span>
      <h1>Đăng nhập Quản trị viên</h1>
      <p>Khu vực dành riêng cho nhân sự được cấp quyền RBAC. Sau khi xác thực tài khoản, hệ thống yêu cầu bước xác minh mã PIN quản trị 6 chữ số độc lập.</p>
    </div>

    ${notice ? `<div class="wb-alert wb-alert-warn" style="margin-bottom:16px;">${escapeHtml(notice)}</div>` : ""}

    <form class="wb-form" data-api-endpoint="/api/v1/admin/auth/login" data-redirect-to="/quan-tri">
      <div class="wb-field">
        <label for="admin-email">Email quản trị *</label>
        <div class="wb-input-wrap">
          <span class="wb-input-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span>
          <input id="admin-email" class="wb-input wb-input-has-icon" type="email" name="email" placeholder="Nhập email tài khoản quản trị" required autocomplete="username" />
        </div>
      </div>
      <div class="wb-field">
        <label for="admin-password">Mật khẩu *</label>
        <div class="wb-input-wrap">
          <span class="wb-input-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
          <input id="admin-password" class="wb-input wb-input-has-icon wb-input-has-toggle" type="password" name="password" placeholder="Nhập mật khẩu quản trị" required autocomplete="current-password" />
          <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="admin-password" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <div data-form-status></div>
      <button type="submit" class="wb-btn wb-btn-primary wb-btn-block wb-btn-lg">Xác thực &amp; Chuyển bước PIN quản trị</button>
    </form>

    <div class="wb-admin-auth-foot">
      <span>Tài khoản học viên thông thường không được phép truy cập cổng này.</span>
      <a href="/login">Chuyển tới trang đăng nhập người học →</a>
    </div>
  </main>
  <script src="/scripts/app.js?v=5.3.0" defer></script>
</body>
</html>`;
}

export function renderAdminPinLockPage({ user, pinStatus, escapeHtml }) {
  const needsSetup = !pinStatus.configured || pinStatus.mustReset;
  const heading = needsSetup ? "Thiết lập mã PIN quản trị 6 chữ số" : "Xác minh mã PIN quản trị 6 chữ số";
  const subtitle = needsSetup
    ? "Tài khoản quản trị cần thiết lập mã PIN 6 chữ số riêng (được mã hóa băm có muối tại máy chủ) trước khi mở Trung tâm Quản trị."
    : "Nhập mã PIN 6 chữ số riêng của tài khoản bạn để mở phiên làm việc tại Trung tâm Quản trị WORD BRIDGE.";
  const formHtml = needsSetup
    ? `<form class="wb-form" data-api-endpoint="/api/v1/admin/pin/setup" data-redirect-to="/quan-tri">
        <div class="wb-field"><label for="pin-new">Mã PIN 6 chữ số *</label><input id="pin-new" class="wb-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" name="pin" placeholder="Nhập 6 chữ số" required autocomplete="off" /></div>
        <div class="wb-field"><label for="pin-confirm">Xác nhận mã PIN 6 chữ số *</label><input id="pin-confirm" class="wb-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" name="confirmPin" placeholder="Nhập lại 6 chữ số" required autocomplete="off" /></div>
        ${pinStatus.configured ? '<div class="wb-field"><label for="pin-pwd">Mật khẩu tài khoản xác minh danh tính *</label><input id="pin-pwd" class="wb-input" type="password" name="currentPassword" required autocomplete="current-password" /></div>' : ""}
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-block">Lưu mã PIN và tiếp tục</button>
      </form>`
    : `<form class="wb-form" data-api-endpoint="/api/v1/admin/pin/verify" data-redirect-to="/quan-tri">
        <div class="wb-field"><label for="pin-verify">Mã PIN 6 chữ số *</label><input id="pin-verify" class="wb-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" name="pin" placeholder="••••••" required autofocus autocomplete="one-time-code" style="letter-spacing:0.4em;font-size:1.3rem;text-align:center;" /></div>
        ${pinStatus.locked ? `<div class="wb-alert wb-alert-error">Mã PIN tạm khóa đến ${escapeHtml(pinStatus.lockedUntil || "hết thời gian chờ")} do nhập sai quá số lần quy định.</div>` : ""}
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-block" ${pinStatus.locked ? "disabled" : ""}>Xác minh PIN &amp; Mở bảng điều khiển</button>
      </form>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken || "")}" />
  <meta name="csrf-token" content="${escapeHtml(user.csrfToken || "")}" />
  <title>${escapeHtml(heading)} — Quản trị WORD BRIDGE</title>
  <link rel="stylesheet" href="/styles/design-system.css?v=5.3.0" />
</head>
<body style="background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <main class="wb-card" style="max-width:460px;width:100%;padding:28px;">
    <div style="text-align:center;margin-bottom:18px;">
      <span class="wb-badge">Trung tâm Quản trị WORD BRIDGE</span>
      <h1 style="color:var(--wb-teal);font-size:1.35rem;margin:10px 0 6px;">${escapeHtml(heading)}</h1>
      <p class="wb-muted" style="font-size:0.92rem;margin:0;">${escapeHtml(subtitle)}</p>
    </div>
    <p style="font-size:0.86rem;background:#f8fafc;padding:10px 12px;border-radius:8px;margin:0 0 16px;">
      Tài khoản: <strong>${escapeHtml(user.email)}</strong><br/>
      Vai trò RBAC: <code>${escapeHtml((user.roles || []).join(", "))}</code>
    </p>
    ${formHtml}
    <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:0.86rem;">
      <a href="/">Về trang công khai</a>
      <form class="wb-form" data-api-endpoint="/api/v1/admin/auth/logout" data-redirect-to="/quan-tri/dang-nhap" style="margin:0;">
        <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Đăng xuất quản trị</button>
      </form>
    </div>
  </main>
  <script src="/scripts/app.js?v=5.3.0" defer></script>
</body>
</html>`;
}

export async function renderAdminCenterHtml({ section = "", user, adminSession, services, db, escapeHtml }) {
  const currentPath = section ? `/quan-tri/${section}` : "/quan-tri";
  const navHtml = ADMIN_NAV_ITEMS.map(([href, label]) =>
    `<a href="${href}" class="wb-btn wb-btn-sm ${href === currentPath ? "wb-btn-primary" : "wb-btn-outline"}" style="justify-content:flex-start;text-align:left;">${escapeHtml(label)}</a>`
  ).join("");

  let bodyHtml = "";
  let pageTitle = "Tổng quan hệ thống";

  if (!section) {
    const metrics = await services.admin.getDashboardMetrics();
    const apiCount = (await db.prepare("SELECT COUNT(*) AS cnt FROM wb_api_usage_logs").first().catch(() => ({ cnt: 0 })))?.cnt || 0;
    const providerRows = (await db.prepare("SELECT service_type, provider_code, config_status FROM wb_api_providers ORDER BY service_type").all().catch(() => ({ results: [] }))).results || [];
    bodyHtml = `
      <div class="wb-grid-4">
        <div class="wb-card"><span class="wb-muted">Tổng tài khoản</span><strong style="font-size:1.8rem;display:block;color:var(--wb-teal);">${metrics.accounts?.total || 0}</strong><small>Hoạt động: ${metrics.accounts?.active || 0}</small></div>
        <div class="wb-card"><span class="wb-muted">Học liệu đã xuất bản</span><strong style="font-size:1.8rem;display:block;color:var(--wb-teal);">${metrics.academic?.lessons || 0}</strong><small>Khóa học: ${metrics.academic?.courses || 0} · Từ điển: ${metrics.academic?.dictionary || 0}</small></div>
        <div class="wb-card"><span class="wb-muted">Thư viện &amp; Luyện tập</span><strong style="font-size:1.8rem;display:block;color:var(--wb-teal);">${metrics.reader?.documents || 0} / ${metrics.practice?.submissions || 0}</strong><small>Tài liệu Reader / Lượt nộp bài</small></div>
        <div class="wb-card"><span class="wb-muted">Lượt gọi API &amp; Bảo mật</span><strong style="font-size:1.8rem;display:block;color:var(--wb-red);">${apiCount}</strong><small>Phiếu CSKH mở: ${metrics.support?.openTickets || 0}</small></div>
      </div>
      <div class="wb-card" style="margin-top:16px;">
        <h2 style="margin-top:0;color:var(--wb-teal);">Trạng thái cấu hình nhà cung cấp API</h2>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Trạng thái</th></tr></thead><tbody>
          ${providerRows.map((p) => `<tr><td><code>${escapeHtml(p.service_type)}</code></td><td>${escapeHtml(p.provider_code)}</td><td><span class="wb-badge">${escapeHtml(p.config_status)}</span></td></tr>`).join("")}
        </tbody></table></div>
      </div>`;
  } else if (section === "tai-khoan") {
    pageTitle = "Quản lý tài khoản";
    const list = await services.admin.listAccounts(user, { limit: 30 });
    bodyHtml = `
      <div class="wb-card">
        <h2 style="margin-top:0;color:var(--wb-teal);">Danh sách thành viên (${list.accounts?.length || 0})</h2>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Họ tên</th><th>Email</th><th>Xác minh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
          ${(list.accounts || []).map((a) => `<tr>
            <td>${escapeHtml(a.full_name)}</td><td>${escapeHtml(a.email)}</td>
            <td>${a.email_verified ? "Đã xác minh" : "Chưa xác minh"}</td>
            <td><code>${escapeHtml(a.status)}</code></td>
            <td>
              <form class="wb-form" data-api-endpoint="/api/v1/admin/accounts/status" data-reload-on-success="true" style="display:inline-flex;gap:6px;">
                <input type="hidden" name="accountId" value="${escapeHtml(a.id)}" />
                <input type="hidden" name="action" value="${a.status === "suspended" ? "unlock" : "suspend"}" />
                <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">${a.status === "suspended" ? "Mở khóa" : "Tạm khóa"}</button>
              </form>
            </td>
          </tr>`).join("")}
        </tbody></table></div>
      </div>`;
  } else if (section === "nhan-su") {
    pageTitle = "Quản lý nhân sự và phân quyền";
    const staff = await services.admin.listStaffAndRoles(user);
    bodyHtml = `
      <div class="wb-card">
        <h2 style="margin-top:0;color:var(--wb-teal);">Danh sách vai trò RBAC (8 vai trò)</h2>
        <p class="wb-muted">super_admin · platform_admin · academic_admin · editor · reviewer · support_admin · data_admin · security_admin</p>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Nhân sự</th><th>Email</th><th>Vai trò</th><th>Trạng thái PIN</th></tr></thead><tbody>
          ${(staff.staff || []).map((s) => `<tr><td>${escapeHtml(s.full_name)}</td><td>${escapeHtml(s.email)}</td><td><code>${escapeHtml(s.role_code)}</code></td><td>Quản lý trạng thái (không hiển thị PIN)</td></tr>`).join("")}
        </tbody></table></div>
      </div>`;
  } else if (section === "hoc-thuat") {
    pageTitle = "Trung tâm học thuật";
    const ov = await services.admin.getAcademicOverview(user);
    bodyHtml = `<div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Học liệu Trung – Anh đang quản lý</h2>
      <p>Chương trình: <strong>${ov.programs?.length || 0}</strong> · Khóa học: <strong>${ov.courses?.length || 0}</strong> · Bài học: <strong>${ov.lessons?.length || 0}</strong></p>
      <p class="wb-muted">Quy tắc kiểm duyệt: Biên tập viên (Editor) không được tự phê duyệt và xuất bản nội dung do chính mình soạn thảo.</p></div>`;
  } else if (section === "thu-vien") {
    pageTitle = "Trung tâm thư viện";
    const docs = (await db.prepare("SELECT id, slug, title_vi, language_code, cefr_or_hsk_level, review_status FROM wb_reader_documents ORDER BY created_at DESC LIMIT 30").all().catch(() => ({ results: [] }))).results || [];
    bodyHtml = `<div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Danh sách tài liệu Thư viện đọc (${docs.length})</h2>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Tiêu đề</th><th>Ngôn ngữ</th><th>Trình độ</th><th>Trạng thái</th></tr></thead><tbody>
        ${docs.map((d) => `<tr><td>${escapeHtml(d.title_vi)}</td><td><code>${escapeHtml(d.language_code)}</code></td><td>${escapeHtml(d.cefr_or_hsk_level || "")}</td><td><code>${escapeHtml(d.review_status)}</code></td></tr>`).join("")}
      </tbody></table></div></div>`;
  } else if (section === "luyen-tap") {
    pageTitle = "Trung tâm luyện tập";
    const exs = (await db.prepare("SELECT id, slug, title_vi, language_code, skill_type FROM wb_practice_exercises ORDER BY id DESC LIMIT 30").all().catch(() => ({ results: [] }))).results || [];
    bodyHtml = `<div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Ngân hàng bài luyện tập (${exs.length})</h2>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Bài luyện tập</th><th>Ngôn ngữ</th><th>Kỹ năng</th></tr></thead><tbody>
        ${exs.map((e) => `<tr><td>${escapeHtml(e.title_vi)}</td><td><code>${escapeHtml(e.language_code)}</code></td><td>${escapeHtml(e.skill_type)}</td></tr>`).join("")}
      </tbody></table></div></div>`;
  } else if (section === "api") {
    pageTitle = "Quản trị API và tích hợp";
    const providers = (await db.prepare("SELECT * FROM wb_api_providers ORDER BY service_type, is_primary DESC").all().catch(() => ({ results: [] }))).results || [];
    const logs = (await db.prepare("SELECT service_type, provider_code, status_code, latency_ms, error_code, created_at FROM wb_api_usage_logs ORDER BY created_at DESC LIMIT 20").all().catch(() => ({ results: [] }))).results || [];
    bodyHtml = `
      <div class="wb-card">
        <h2 style="margin-top:0;color:var(--wb-teal);">Danh mục nhà cung cấp &amp; Hạn mức (Không hiển thị API Key)</h2>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Trạng thái cấu hình</th><th>Hạn mức ngày</th><th>Vùng dữ liệu</th><th>Lưu trữ</th></tr></thead><tbody>
          ${providers.map((p) => `<tr><td><code>${escapeHtml(p.service_type)}</code></td><td>${escapeHtml(p.display_name)}</td><td><span class="wb-badge">${escapeHtml(p.config_status)}</span></td><td>${p.daily_quota_limit}</td><td>${escapeHtml(p.data_region)}</td><td>${escapeHtml(p.retention_policy)}</td></tr>`).join("")}
        </tbody></table></div>
      </div>
      <div class="wb-card" style="margin-top:16px;">
        <h3 style="margin-top:0;color:var(--wb-teal);">Nhật ký sử dụng API gần đây (${logs.length})</h3>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Thời điểm</th><th>Dịch vụ</th><th>Nhà cung cấp</th><th>HTTP</th><th>Độ trễ (ms)</th><th>Mã lỗi</th></tr></thead><tbody>
          ${logs.map((l) => `<tr><td>${escapeHtml(l.created_at)}</td><td>${escapeHtml(l.service_type)}</td><td>${escapeHtml(l.provider_code)}</td><td>${l.status_code}</td><td>${l.latency_ms}</td><td>${escapeHtml(l.error_code || "—")}</td></tr>`).join("") || '<tr><td colspan="6">Chưa có lượt gọi API nào được ghi nhận.</td></tr>'}
        </tbody></table></div>
      </div>`;
  } else if (section === "du-lieu") {
    pageTitle = "Dữ liệu và lưu trữ";
    const st = await services.admin.getDataAndStorageStatus(user);
    bodyHtml = `<div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Trạng thái Cloudflare D1 &amp; R2</h2>
      <p>Cơ sở dữ liệu D1: <code>word</code> · Bucket R2: <code>word</code> (${st.r2?.available ? "Đã kết nối" : "Chưa gắn binding"})</p>
      <form class="wb-form" data-api-endpoint="/api/v1/admin/data/snapshot"><input type="hidden" name="snapshotType" value="integrity_check" /><div data-form-status></div><button type="submit" class="wb-btn wb-btn-primary">Chạy kiểm tra toàn vẹn dữ liệu</button></form></div>`;
  } else if (section === "bao-mat") {
    pageTitle = "Bảo mật và kiểm toán";
    const sec = await services.admin.getSecurityOverview(user);
    const adminSessions = await services.adminPin.listActiveAdminSessions();
    bodyHtml = `
      <div class="wb-card" style="margin-bottom:16px;">
        <h2 style="margin-top:0;color:var(--wb-teal);">Phiên quản trị đang hoạt động (${adminSessions.length})</h2>
        <p class="wb-muted">Các phiên quản trị (<code>wb_admin_session</code>) được tách biệt hoàn toàn với phiên học viên và có thời hạn riêng.</p>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã phiên</th><th>Quản trị viên</th><th>IP</th><th>Hết hạn</th><th>Thao tác</th></tr></thead><tbody>
          ${adminSessions.map((s) => `<tr><td><code>${escapeHtml(s.id)}</code></td><td>${escapeHtml(s.email || s.account_id)}</td><td>${escapeHtml(s.ip_address || "—")}</td><td>${escapeHtml(s.expires_at)}</td><td>${s.id === adminSession?.id ? '<span class="wb-badge">Phiên hiện tại</span>' : `<form class="wb-form" data-api-endpoint="/api/v1/admin/security/revoke-admin-session" data-reload-on-success="true" style="margin:0;"><input type="hidden" name="adminSessionId" value="${escapeHtml(s.id)}" /><button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Thu hồi</button></form>`}</td></tr>`).join("") || '<tr><td colspan="5">Không có phiên quản trị khác đang hoạt động.</td></tr>'}
        </tbody></table></div>
      </div>
      <div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Nhật ký kiểm toán &amp; Bảo mật PIN</h2>
      <p>Phiên người dùng hoạt động: <strong>${sec.activeSessions?.length || 0}</strong> · Phiên quản trị: <strong>${adminSessions.length}</strong> · Passkeys hoạt động: <strong>${sec.passkeysCount || 0}</strong></p>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Thời điểm</th><th>Hành động</th><th>Tài nguyên</th><th>IP</th></tr></thead><tbody>
        ${(sec.auditLogs || []).slice(0, 25).map((a) => `<tr><td>${escapeHtml(a.created_at)}</td><td><code>${escapeHtml(a.action)}</code></td><td>${escapeHtml(a.resource_type)}</td><td>${escapeHtml(a.ip_address || "—")}</td></tr>`).join("")}
      </tbody></table></div></div>`;
  } else if (section === "ho-tro") {
    pageTitle = "Vận hành và hỗ trợ";
    const ops = await services.admin.getOperationsOverview(user);
    bodyHtml = `<div class="wb-card"><h2 style="margin-top:0;color:var(--wb-teal);">Phiếu CSKH &amp; Liên hệ (${ops.supportTickets?.length || 0})</h2>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã phiếu</th><th>Người gửi</th><th>Tiêu đề</th><th>Trạng thái</th></tr></thead><tbody>
        ${(ops.supportTickets || []).slice(0, 20).map((t) => `<tr><td><code>${escapeHtml(t.id)}</code></td><td>${escapeHtml(t.sender_email || "")}</td><td>${escapeHtml(t.subject || "")}</td><td><code>${escapeHtml(t.status)}</code></td></tr>`).join("") || '<tr><td colspan="4">Chưa có phiếu hỗ trợ.</td></tr>'}
      </tbody></table></div></div>`;
  } else if (section === "chinh-sach") {
    pageTitle = "Quản lý chính sách và pháp lý";
    const docs = (await db.prepare("SELECT * FROM wb_policy_documents ORDER BY slug").all().catch(() => ({ results: [] }))).results || [];
    const consentStats = (await db.prepare("SELECT policy_type, policy_version, COUNT(DISTINCT account_id) AS users FROM wb_user_policy_consents WHERE acceptance_status='accepted' GROUP BY policy_type, policy_version").all().catch(() => ({ results: [] }))).results || [];
    bodyHtml = `
      <div class="wb-card">
        <h2 style="margin-top:0;color:var(--wb-teal);">Quản lý phiên bản Điều khoản &amp; Chính sách quyền riêng tư</h2>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã chính sách</th><th>Tiêu đề</th><th>Phiên bản</th><th>Ngày hiệu lực</th><th>Đơn vị vận hành</th></tr></thead><tbody>
          ${docs.map((d) => `<tr><td><code>${escapeHtml(d.slug)}</code></td><td>${escapeHtml(d.title_vi)}</td><td>${escapeHtml(d.current_version)}</td><td>${escapeHtml(d.effective_date || "—")}</td><td>${escapeHtml(d.operator_name || "WORD BRIDGE")}</td></tr>`).join("")}
        </tbody></table></div>
        <h3 style="margin-top:18px;color:var(--wb-teal);">Thống kê tài khoản đã xác nhận từng phiên bản</h3>
        <ul>${consentStats.map((c) => `<li><code>${escapeHtml(c.policy_type)}</code> v${escapeHtml(c.policy_version)}: <strong>${c.users}</strong> tài khoản</li>`).join("") || "<li>Chưa có lượt xác nhận mới.</li>"}</ul>
      </div>`;
  } else if (section === "email" || section.startsWith("email/")) {
    pageTitle = "EMAIL CENTER — Trung tâm Quản lý Email";
    const subTab = section === "email/tu-dong-hoa" ? "automation"
      : section === "email/thong-ke" ? "stats"
      : section === "email/smtp" ? "smtp"
      : "templates";
    const catalog = services.email.getEmailCatalog ? services.email.getEmailCatalog() : [];
    const overridesRows = (await db.prepare("SELECT template_key, custom_subject, custom_title, custom_body, updated_at FROM wb_email_templates").all().catch(() => ({ results: [] }))).results || [];
    const overrideMap = new Map(overridesRows.map((r) => [r.template_key, r]));
    const autoRows = (await db.prepare("SELECT event_key, enabled, updated_at FROM wb_email_automations").all().catch(() => ({ results: [] }))).results || [];
    const autoMap = new Map(autoRows.map((r) => [r.event_key, r.enabled === 1]));
    const emailEvents = (await db.prepare("SELECT id, event_type, template_key, sender_address, recipient_email, subject, delivery_status, provider_name, last_error, created_at FROM wb_email_events ORDER BY created_at DESC LIMIT 40").all().catch(() => ({ results: [] }))).results || [];
    const statTotal = emailEvents.length;
    const statSent = emailEvents.filter((e) => ["SENT", "ACCEPTED", "DELIVERED"].includes(e.delivery_status)).length;
    const statPending = emailEvents.filter((e) => ["QUEUED", "RETRYING"].includes(e.delivery_status)).length;
    const statFailed = emailEvents.filter((e) => ["FAILED", "BOUNCED", "COMPLAINED", "BLOCKED_UNCONFIGURED"].includes(e.delivery_status)).length;
    const cfgRows = (await db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key LIKE 'email.%'").all().catch(() => ({ results: [] }))).results || [];
    const cfgMap = Object.fromEntries(cfgRows.map((r) => [r.config_key, r.config_value]));

    const tabsNav = `
      <div class="wb-email-center-tabs">
        <a href="/quan-tri/email" class="wb-btn wb-btn-sm ${subTab === "templates" ? "wb-btn-primary" : "wb-btn-outline"}">1. Mẫu email (${catalog.length})</a>
        <a href="/quan-tri/email/tu-dong-hoa" class="wb-btn wb-btn-sm ${subTab === "automation" ? "wb-btn-primary" : "wb-btn-outline"}">2. Tự động hóa</a>
        <a href="/quan-tri/email/thong-ke" class="wb-btn wb-btn-sm ${subTab === "stats" ? "wb-btn-primary" : "wb-btn-outline"}">3. Thống kê gửi thư</a>
        <a href="/quan-tri/email/smtp" class="wb-btn wb-btn-sm ${subTab === "smtp" ? "wb-btn-primary" : "wb-btn-outline"}">4. Cấu hình SMTP</a>
      </div>`;

    if (subTab === "automation") {
      const grouped = catalog.reduce((acc, item) => { (acc[item.groupTitle] ||= []).push(item); return acc; }, {});
      bodyHtml = `
        ${tabsNav}
        <div class="wb-card" style="margin-bottom:16px;border-left:4px solid var(--wb-red);">
          <h3 style="margin:0 0 8px;color:var(--wb-red);">Quy tắc chống làm phiền — Những email KHÔNG gửi tự động</h3>
          <ul style="margin:0;padding-left:20px;font-size:0.9rem;">
            <li>Không gửi email mỗi khi người dùng mở bài học.</li>
            <li>Không gửi email cho từng lần tra cứu từ điển.</li>
            <li>Không gửi email sau mỗi thao tác lưu từ vựng.</li>
            <li>Không gửi quảng cáo hoặc nội dung tiếp thị khi chưa có sự đồng ý rõ ràng.</li>
            <li>Không gửi báo cáo học tập khi người dùng đã tắt tùy chọn nhận thông báo học tập.</li>
          </ul>
        </div>
        ${Object.entries(grouped).map(([grp, items]) => `
          <div class="wb-card" style="margin-bottom:16px;">
            <h3 style="margin:0 0 12px;color:var(--wb-teal);">${escapeHtml(grp)}</h3>
            <div class="wb-table-wrap"><table class="wb-table">
              <thead><tr><th>STT</th><th>Email tự động</th><th>Thời điểm gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                ${items.map((it, idx) => {
                  const isOn = autoMap.has(it.key) ? autoMap.get(it.key) : it.defaultEnabled !== false;
                  return `<tr>
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHtml(it.nameVi)}</strong><br/><code style="font-size:0.76rem;">${escapeHtml(it.key)}</code></td>
                    <td>${escapeHtml(it.triggerVi)}</td>
                    <td><span class="wb-badge">${isOn ? "Đang bật" : "Đã tắt"}</span></td>
                    <td>
                      <form class="wb-form" data-api-endpoint="/api/v1/admin/email/automations" data-reload-on-success="true" style="margin:0;">
                        <input type="hidden" name="eventKey" value="${escapeHtml(it.key)}" />
                        <input type="hidden" name="enabled" value="${isOn ? "0" : "1"}" />
                        <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">${isOn ? "Tắt sự kiện" : "Bật sự kiện"}</button>
                      </form>
                    </td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table></div>
          </div>`).join("")}`;
    } else if (subTab === "stats") {
      bodyHtml = `
        ${tabsNav}
        <div class="wb-grid-4" style="margin-bottom:16px;">
          <div class="wb-card" style="margin:0;"><span class="wb-muted">Tổng thư ghi nhận</span><strong style="display:block;font-size:1.7rem;color:var(--wb-teal);">${statTotal}</strong></div>
          <div class="wb-card" style="margin:0;"><span class="wb-muted">Đã gửi / Tiếp nhận</span><strong style="display:block;font-size:1.7rem;color:#117A4B;">${statSent}</strong></div>
          <div class="wb-card" style="margin:0;"><span class="wb-muted">Đang chờ / Thử lại</span><strong style="display:block;font-size:1.7rem;color:#B45309;">${statPending}</strong></div>
          <div class="wb-card" style="margin:0;"><span class="wb-muted">Thất bại / Chưa cấu hình</span><strong style="display:block;font-size:1.7rem;color:#C92F1C;">${statFailed}</strong></div>
        </div>
        <div class="wb-card" style="margin-bottom:16px;">
          <h3 style="margin:0 0 10px;color:var(--wb-teal);">Gửi thử mẫu Email HTML từ noreply@wordbridge.io.vn</h3>
          <form class="wb-form" data-api-endpoint="/api/v1/admin/email/test" data-reload-on-success="true">
            <div class="wb-grid-2">
              <div class="wb-field"><label>Email người nhận *</label><input class="wb-input" type="email" name="recipientEmail" value="${escapeHtml(user.email)}" required /></div>
              <div class="wb-field"><label>Chọn mẫu email *</label>
                <select class="wb-select" name="templateKey">
                  ${catalog.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.nameVi)} (${escapeHtml(c.key)})</option>`).join("")}
                </select>
              </div>
            </div>
            <div data-form-status></div>
            <div><button type="submit" class="wb-btn wb-btn-primary">Gửi email kiểm thử</button></div>
          </form>
        </div>
        <div class="wb-card">
          <h3 style="margin:0 0 12px;color:var(--wb-teal);">Nhật ký gửi thư gần đây (${emailEvents.length})</h3>
          <div class="wb-table-wrap"><table class="wb-table">
            <thead><tr><th>Thời gian</th><th>Người gửi</th><th>Người nhận</th><th>Mẫu / Tiêu đề</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              ${emailEvents.map((e) => `<tr>
                <td style="white-space:nowrap;">${escapeHtml(e.created_at)}</td>
                <td><code>${escapeHtml(e.sender_address)}</code></td>
                <td>${escapeHtml(e.recipient_email)}</td>
                <td><strong>${escapeHtml(e.subject)}</strong><br/><span class="wb-muted" style="font-size:0.78rem;">${escapeHtml(e.template_key)}${e.last_error ? ` · ${escapeHtml(e.last_error.slice(0, 90))}` : ""}</span></td>
                <td><span class="wb-badge">${escapeHtml(e.delivery_status)}</span></td>
                <td>${["FAILED", "RETRYING", "BLOCKED_UNCONFIGURED", "QUEUED"].includes(e.delivery_status) ? `<form class="wb-form" data-api-endpoint="/api/v1/admin/email/retry" data-reload-on-success="true" style="margin:0;"><input type="hidden" name="eventId" value="${escapeHtml(e.id)}" /><button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Gửi lại</button></form>` : "—"}</td>
              </tr>`).join("") || '<tr><td colspan="6" style="text-align:center;padding:18px;">Chưa có bản ghi gửi email nào.</td></tr>'}
            </tbody>
          </table></div>
        </div>`;
    } else if (subTab === "smtp") {
      const senderAddr = cfgMap["email.sender_address"] || "noreply@wordbridge.io.vn";
      const replyToAddr = cfgMap["email.reply_to"] || "support@wordbridge.io.vn";
      const providerMode = cfgMap["email.provider"] || services.email.providerName || "unconfigured";
      const smtpHost = cfgMap["email.smtp_host"] || "smtp.wordbridge.io.vn";
      const smtpPort = cfgMap["email.smtp_port"] || "587";
      const smtpTls = cfgMap["email.smtp_tls"] || "STARTTLS";
      const domainVerified = cfgMap["email.domain_verified"] || "pending_dns";
      bodyHtml = `
        ${tabsNav}
        <div class="wb-grid-2">
          <form class="wb-card wb-form" data-api-endpoint="/api/v1/admin/email/config" data-reload-on-success="true">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">Cấu hình Máy chủ &amp; Địa chỉ gửi thư</h3>
            <p class="wb-muted" style="margin:0 0 12px;">Địa chỉ gửi mặc định bắt buộc là <code>noreply@wordbridge.io.vn</code>. Khóa bí mật (<code>RESEND_API_KEY</code>, <code>EMAIL_WEBHOOK_SECRET</code>) được lưu an toàn qua Cloudflare Workers Secrets, không lưu văn bản thuần trong D1.</p>
            <div class="wb-field"><label>Địa chỉ gửi (From) *</label><input class="wb-input" type="email" name="senderAddress" value="${escapeHtml(senderAddr)}" required /></div>
            <div class="wb-field"><label>Địa chỉ phản hồi (Reply-To) *</label><input class="wb-input" type="email" name="replyTo" value="${escapeHtml(replyToAddr)}" required /></div>
            <div class="wb-field"><label>Nhà cung cấp gửi thư</label>
              <select class="wb-select" name="provider">
                <option value="resend" ${providerMode === "resend" ? "selected" : ""}>Resend API (Khuyên dùng cho Cloudflare Workers)</option>
                <option value="smtp_relay" ${providerMode === "smtp_relay" ? "selected" : ""}>SMTP Relay / MailChannels</option>
                <option value="unconfigured" ${providerMode === "unconfigured" ? "selected" : ""}>Chưa kích hoạt gửi ra ngoài (Ghi hàng đợi D1)</option>
              </select>
            </div>
            <div class="wb-grid-2">
              <div class="wb-field"><label>SMTP Host</label><input class="wb-input" name="smtpHost" value="${escapeHtml(smtpHost)}" /></div>
              <div class="wb-field"><label>SMTP Port</label><input class="wb-input" name="smtpPort" value="${escapeHtml(smtpPort)}" /></div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-field"><label>Mã hóa truyền tải</label>
                <select class="wb-select" name="smtpTls">
                  <option value="STARTTLS" ${smtpTls === "STARTTLS" ? "selected" : ""}>STARTTLS (587)</option>
                  <option value="SSL_TLS" ${smtpTls === "SSL_TLS" ? "selected" : ""}>SSL/TLS (465)</option>
                </select>
              </div>
              <div class="wb-field"><label>Xác thực tên miền (SPF/DKIM/DMARC)</label>
                <select class="wb-select" name="domainVerified">
                  <option value="verified" ${domainVerified === "verified" ? "selected" : ""}>Đã xác thực DNS wordbridge.io.vn</option>
                  <option value="pending_dns" ${domainVerified !== "verified" ? "selected" : ""}>Chờ xác thực bản ghi DNS</option>
                </select>
              </div>
            </div>
            <div data-form-status></div>
            <button type="submit" class="wb-btn wb-btn-primary">Lưu cấu hình SMTP &amp; Email</button>
          </form>
          <div class="wb-card">
            <h3 style="margin:0 0 10px;color:var(--wb-teal);">Bản ghi DNS &amp; Secrets bắt buộc</h3>
            <ul style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:0.88rem;">
              <li><strong>Tên miền gửi thư:</strong> <code>wordbridge.io.vn</code> (Địa chỉ gửi: <code>noreply@wordbridge.io.vn</code>)</li>
              <li><strong>SPF:</strong> <code>v=spf1 include:_spf.resend.com ~all</code></li>
              <li><strong>DKIM:</strong> Khóa chữ ký từ nhà cung cấp email (Resend / SMTP) gắn tại Cloudflare DNS</li>
              <li><strong>DMARC:</strong> <code>v=DMARC1; p=quarantine; rua=mailto:postmaster@wordbridge.io.vn</code></li>
              <li><strong>Cloudflare Workers Secrets:</strong> Chạy <code>npx wrangler secret put RESEND_API_KEY</code> và đặt <code>EMAIL_PROVIDER=resend</code> trong Dashboard.</li>
            </ul>
          </div>
        </div>`;
    } else {
      const firstTpl = catalog[0] || { key: "welcome_registered", nameVi: "Chào mừng đến WORD BRIDGE", subject: "", title: "" };
      const firstOv = overrideMap.get(firstTpl.key);
      const grouped = catalog.reduce((acc, item) => { (acc[item.groupTitle] ||= []).push(item); return acc; }, {});
      bodyHtml = `
        ${tabsNav}
        <div class="wb-card" id="wb-email-preview-card" style="margin-bottom:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <span class="wb-badge">GIAO DIỆN HTML EMAIL TRỰC TIẾP · noreply@wordbridge.io.vn</span>
              <h3 id="wb-email-preview-title" style="margin:6px 0 0;color:var(--wb-teal);">${escapeHtml(firstTpl.nameVi)}</h3>
            </div>
          </div>
          <div class="wb-grid-2" style="align-items:start;">
            <iframe id="wb-email-preview-frame" class="wb-email-preview-frame" title="Xem trước mẫu Email HTML" src="/api/v1/admin/email/preview?key=${encodeURIComponent(firstTpl.key)}"></iframe>
            <form class="wb-form" data-api-endpoint="/api/v1/admin/email/templates" data-reload-on-success="true">
              <h4 style="margin:0;color:var(--wb-teal);">Tùy chỉnh nội dung mẫu email</h4>
              <input id="wb-email-edit-key" type="hidden" name="templateKey" value="${escapeHtml(firstTpl.key)}" />
              <div class="wb-field"><label>Tiêu đề thư (Subject) *</label><input id="wb-email-edit-subject" class="wb-input" name="customSubject" value="${escapeHtml(firstOv?.custom_subject || firstTpl.subject)}" required /></div>
              <div class="wb-field"><label>Tiêu đề trong thân HTML *</label><input id="wb-email-edit-title" class="wb-input" name="customTitle" value="${escapeHtml(firstOv?.custom_title || firstTpl.title)}" required /></div>
              <div class="wb-field"><label>Đoạn mở đầu / Ghi chú bổ sung (tùy chọn)</label><textarea id="wb-email-edit-body" class="wb-textarea" name="customBody" rows="4" placeholder="Để trống để dùng nội dung chuẩn theo sự kiện...">${escapeHtml(firstOv?.custom_body || "")}</textarea></div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Lưu mẫu email HTML</button>
            </form>
          </div>
        </div>
        ${Object.entries(grouped).map(([grp, items]) => `
          <div class="wb-card" style="margin-bottom:16px;">
            <h3 style="margin:0 0 12px;color:var(--wb-teal);">${escapeHtml(grp)} (${items.length} mẫu)</h3>
            <div class="wb-table-wrap"><table class="wb-table">
              <thead><tr><th>STT</th><th>Mẫu email</th><th>Thời điểm gửi</th><th>Tiêu đề thư</th><th>Xem &amp; Sửa</th></tr></thead>
              <tbody>
                ${items.map((it, idx) => {
                  const ov = overrideMap.get(it.key);
                  return `<tr>
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHtml(it.nameVi)}</strong><br/><code style="font-size:0.76rem;">${escapeHtml(it.key)}</code></td>
                    <td>${escapeHtml(it.triggerVi)}</td>
                    <td>${escapeHtml(ov?.custom_subject || it.subject)}</td>
                    <td><button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-email-preview="${escapeHtml(it.key)}" data-tpl-name="${escapeHtml(it.nameVi)}" data-tpl-subject="${escapeHtml(ov?.custom_subject || it.subject)}" data-tpl-title="${escapeHtml(ov?.custom_title || it.title)}" data-tpl-body="${escapeHtml(ov?.custom_body || "")}">Xem HTML</button></td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table></div>
          </div>`).join("")}`;
    }
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken || "")}" />
  <meta name="csrf-token" content="${escapeHtml(user.csrfToken || "")}" />
  <meta name="admin-csrf-token" content="${escapeHtml(adminSession?.csrf_token || "")}" />
  <title>${escapeHtml(pageTitle)} — Trung tâm Quản trị WORD BRIDGE</title>
  <link rel="stylesheet" href="/styles/design-system.css?v=5.3.0" />
</head>
<body style="background:#f8fafc;margin:0;">
  <header style="background:var(--wb-teal);color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
    <div><strong>WORD BRIDGE — Trung tâm Quản trị</strong> <span style="opacity:0.85;font-size:0.86rem;">(${escapeHtml(user.email)} · ${escapeHtml((user.roles || []).join(", "))})</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <form class="wb-form" data-api-endpoint="/api/v1/admin/pin/lock" data-redirect-to="/quan-tri" style="margin:0;">
        <button type="submit" class="wb-btn wb-btn-sm" style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.4);">Khóa màn hình PIN</button>
      </form>
      <form class="wb-form" data-api-endpoint="/api/v1/admin/auth/logout" data-redirect-to="/quan-tri/dang-nhap" style="margin:0;">
        <button type="submit" class="wb-btn wb-btn-sm" style="background:#C92F1C;color:#fff;border:none;">Đăng xuất quản trị</button>
      </form>
      <a href="/" class="wb-btn wb-btn-sm" style="background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.28);">Trang công khai</a>
    </div>
  </header>
  <div class="wb-admin-shell">
    <aside style="display:flex;flex-direction:column;gap:6px;">${navHtml}</aside>
    <main>
      <h1 style="margin:0 0 16px;color:var(--wb-teal);">${escapeHtml(pageTitle)}</h1>
      ${bodyHtml}
    </main>
  </div>
  <script src="/scripts/app.js?v=5.3.0" defer></script>
</body>
</html>`;
}
