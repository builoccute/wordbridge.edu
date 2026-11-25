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
  ["/quan-tri/chinh-sach", "11. Chính sách & Pháp lý"]
];


export function renderAdminLoginPage({ escapeHtml, notice = "" }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Đăng nhập Hệ thống Quản trị — WORD BRIDGE</title>
  <link rel="icon" type="image/png" href="/branding/favicon.png" />
  <link rel="stylesheet" href="/styles/design-system.css" />
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
  <script src="/scripts/app.js" defer></script>
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
  <link rel="stylesheet" href="/styles/design-system.css" />
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
  <script src="/scripts/app.js" defer></script>
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
  <link rel="stylesheet" href="/styles/design-system.css" />
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
  <script src="/scripts/app.js" defer></script>
</body>
</html>`;
}
