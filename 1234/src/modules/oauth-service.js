// src/modules/oauth-service.js
// WORD BRIDGE V4.2.0 — 6-Method Auth: OAuth2 Provider Adapter (Google, Facebook, Microsoft, Apple)
// Strictly NEVER simulates OAuth login when client ID / secret are not configured in Workers Secrets.

export const OAUTH_PROVIDERS = Object.freeze({
  google: {
    id: "google",
    label: "Google",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile"
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email",
    scope: "email public_profile"
  },
  microsoft: {
    id: "microsoft",
    label: "Microsoft",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    scope: "openid email profile User.Read"
  },
  apple: {
    id: "apple",
    label: "Apple",
    clientIdEnv: "APPLE_CLIENT_ID",
    clientSecretEnv: "APPLE_CLIENT_SECRET",
    authUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    userInfoUrl: null,
    scope: "name email"
  }
});

export class OAuthService {
  constructor(db, authService, env = {}, helpers = {}) {
    this.db = db;
    this.authService = authService;
    this.env = env;
    this.randomTokenHex = helpers.randomTokenHex;
    this.sha256Hex = helpers.sha256Hex;
    this.generateId = helpers.generateId;
    this.baseUrl = String(env.APP_BASE_URL || "https://wordbridge.io.vn").replace(/\/+$/, "");
  }

  getProviderStatus(providerId) {
    const cfg = OAUTH_PROVIDERS[providerId];
    if (!cfg) return null;
    const hasClientId = Boolean(this.env[cfg.clientIdEnv]);
    const hasClientSecret = Boolean(this.env[cfg.clientSecretEnv]);
    return {
      provider: cfg.id,
      label: cfg.label,
      configured: hasClientId && hasClientSecret,
      status: hasClientId && hasClientSecret ? "CONFIGURED" : "NOT_CONFIGURED",
      redirectUri: `${this.baseUrl}/api/v1/auth/oauth/${cfg.id}/callback`,
      requiredSecrets: [cfg.clientIdEnv, cfg.clientSecretEnv]
    };
  }

  listAllProvidersStatus() {
    return Object.keys(OAUTH_PROVIDERS).map((id) => this.getProviderStatus(id));
  }

  async createAuthorizationStart(providerId, redirectTo = "/my-learning") {
    const cfg = OAUTH_PROVIDERS[providerId];
    if (!cfg) return { ok: false, status: 404, error: "Nhà cung cấp đăng nhập không được hỗ trợ." };
    const st = this.getProviderStatus(providerId);
    if (!st.configured) {
      return {
        ok: false,
        status: 503,
        code: "OAUTH_NOT_CONFIGURED",
        error: `Đăng nhập bằng ${cfg.label} chưa được cấu hình Workers Secrets (${cfg.clientIdEnv}, ${cfg.clientSecretEnv}).`,
        providerStatus: st
      };
    }
    const rawState = this.randomTokenHex(24);
    const stateHash = await this.sha256Hex(rawState, this.env.TOKEN_PEPPER || "");
    const safeNext = typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/my-learning";
    await this.db.prepare(
      `INSERT INTO wb_oauth_states (id, provider, state_hash, redirect_to, expires_at)
       VALUES (?, ?, ?, ?, datetime('now', '+10 minutes'))`
    ).bind(this.generateId("oas"), providerId, stateHash, safeNext).run();

    const params = new URLSearchParams({
      client_id: this.env[cfg.clientIdEnv],
      redirect_uri: st.redirectUri,
      response_type: "code",
      scope: cfg.scope,
      state: rawState
    });
    if (providerId === "apple") params.set("response_mode", "form_post");
    return { ok: true, status: 200, authorizationUrl: `${cfg.authUrl}?${params.toString()}`, state: rawState };
  }

  async consumeState(providerId, rawState) {
    if (!rawState) return null;
    const stateHash = await this.sha256Hex(rawState, this.env.TOKEN_PEPPER || "");
    return this.db.prepare(
      `UPDATE wb_oauth_states SET consumed_at = datetime('now')
       WHERE provider = ? AND state_hash = ? AND consumed_at IS NULL AND expires_at > datetime('now')
       RETURNING id, redirect_to`
    ).bind(providerId, stateHash).first();
  }

  async completeOAuthIdentity({ providerId, providerUserId, email, fullName }, requestMeta = {}) {
    if (!providerUserId || !email) {
      return { ok: false, status: 400, error: "Nhà cung cấp OAuth không trả về đủ định danh và email." };
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingLink = await this.db.prepare(
      "SELECT * FROM wb_oauth_identities WHERE provider = ? AND provider_user_id = ?"
    ).bind(providerId, String(providerUserId)).first();

    let accountId = existingLink?.account_id || null;
    let requiresPhoneVerification = existingLink ? existingLink.phone_verified_after_oauth !== 1 : true;

    if (!accountId) {
      const existingAcc = await this.db.prepare("SELECT id, status, phone_number FROM wb_accounts WHERE email = ?").bind(normalizedEmail).first();
      if (existingAcc) {
        if (existingAcc.status !== "active") {
          return { ok: false, status: 403, error: "Tài khoản liên kết hiện không ở trạng thái hoạt động." };
        }
        accountId = existingAcc.id;
      } else {
        accountId = this.generateId("acc");
        await this.db.prepare(
          `INSERT INTO wb_accounts (id, email, password_hash, full_name, date_of_birth, phone_number, school_name, workplace_name, account_type, email_verified, email_verified_at, status)
           VALUES (?, ?, '', ?, '', '', '', '', 'personal', 1, datetime('now'), 'active')`
        ).bind(accountId, normalizedEmail, String(fullName || normalizedEmail.split("@")[0]).slice(0, 120)).run();
        await this.db.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run();
        await this.db.prepare(
          "INSERT OR IGNORE INTO wb_entitlements (id, account_id, plan_code, source, storage_quota_bytes) VALUES (?, ?, 'PERSONAL_FREE', 'oauth', 1073741824)"
        ).bind(this.generateId("ent"), accountId).run();
      }
      await this.db.prepare(
        `INSERT OR IGNORE INTO wb_oauth_identities (id, account_id, provider, provider_user_id, provider_email, phone_verified_after_oauth)
         VALUES (?, ?, ?, ?, ?, 0)`
      ).bind(this.generateId("oai"), accountId, providerId, String(providerUserId), normalizedEmail).run();
    }

    const session = await this.authService.createSession(accountId, requestMeta);
    await this.authService.recordAudit(accountId, "auth.oauth_login", "wb_oauth_identities", providerId, requestMeta.ipAddress, {
      provider: providerId,
      requiresPhoneVerification
    });
    return { ok: true, accountId, session, requiresPhoneVerification };
  }

  async verifyPostOAuthPhone(accountId, phoneNumber, ipAddress = null) {
    const clean = String(phoneNumber || "").replace(/[^\d+]/g, "");
    if (clean.length < 9 || clean.length > 15) {
      return { ok: false, status: 400, error: "Số điện thoại không hợp lệ (cần từ 9 đến 15 chữ số)." };
    }
    await this.db.prepare("UPDATE wb_accounts SET phone_number = ?, updated_at = datetime('now') WHERE id = ?").bind(clean, accountId).run();
    await this.db.prepare("UPDATE wb_oauth_identities SET phone_verified_after_oauth = 1 WHERE account_id = ?").bind(accountId).run();
    await this.authService.recordAudit(accountId, "auth.oauth_phone_verified", "wb_accounts", accountId, ipAddress, {});
    return { ok: true, message: "Đã xác nhận số điện thoại cho tài khoản đăng nhập OAuth." };
  }
}
