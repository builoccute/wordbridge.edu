-- ============================================================================
-- Migration 0001: Core Accounts, Profiles, Auth, OAuth, Passkeys, Sessions,
-- RBAC (9 Roles), Entitlements & Student Benefit (3 months, school email only)
-- Database: Cloudflare D1 `word` (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE. NO DELETE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  school_name TEXT NOT NULL,
  workplace_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'personal' CHECK (account_type = 'personal'),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  email_verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'restricted', 'suspended', 'deleted')),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_accounts_email ON wb_accounts(email);
CREATE INDEX IF NOT EXISTS idx_wb_accounts_status ON wb_accounts(status);

CREATE TABLE IF NOT EXISTS wb_profiles (
  account_id TEXT PRIMARY KEY REFERENCES wb_accounts(id) ON DELETE CASCADE,
  avatar_r2_key TEXT,
  bio TEXT DEFAULT '',
  preferred_ui_language TEXT NOT NULL DEFAULT 'vi',
  target_languages_json TEXT NOT NULL DEFAULT '["en"]',
  daily_study_goal_minutes INTEGER NOT NULL DEFAULT 20,
  notification_preferences_json TEXT NOT NULL DEFAULT '{"lesson_completed":true,"review_due":true,"exam_results":true,"security_alerts":true,"marketing":false}',
  privacy_settings_json TEXT NOT NULL DEFAULT '{"profile_visibility":"private","learning_analytics_opt_in":true}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_verification_tokens (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'password_reset', 'email_change', 'student_email_verification', 'oauth_link_confirm')),
  target_value TEXT,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_verification_tokens_account ON wb_verification_tokens(account_id, token_type);
CREATE INDEX IF NOT EXISTS idx_wb_verification_tokens_expires ON wb_verification_tokens(expires_at);

CREATE TABLE IF NOT EXISTS wb_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_sessions_account ON wb_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_wb_sessions_expires ON wb_sessions(expires_at);

CREATE TABLE IF NOT EXISTS wb_oauth_identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'microsoft', 'apple')),
  provider_subject TEXT NOT NULL,
  provider_email TEXT,
  provider_email_verified INTEGER NOT NULL DEFAULT 0,
  linked_confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_subject)
);

CREATE TABLE IF NOT EXISTS wb_passkeys (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key_cose TEXT NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  display_name TEXT NOT NULL,
  transports_json TEXT DEFAULT '[]',
  revoked_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_passkeys_account ON wb_passkeys(account_id);

-- RBAC: 9 Official Roles (no default admin assignment)
CREATE TABLE IF NOT EXISTS wb_roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'review', 'approve', 'publish', 'delete', 'manage')),
  description_vi TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wb_role_permissions (
  role_id TEXT NOT NULL REFERENCES wb_roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES wb_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS wb_account_roles (
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES wb_roles(id) ON DELETE CASCADE,
  granted_by TEXT REFERENCES wb_accounts(id),
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, role_id)
);

-- Entitlements & Student Benefit (PERSONAL FREE / PERSONAL PLUS only)
CREATE TABLE IF NOT EXISTS wb_entitlements (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES wb_accounts(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'PERSONAL_FREE' CHECK (plan_code IN ('PERSONAL_FREE', 'PERSONAL_PLUS')),
  source TEXT NOT NULL DEFAULT 'default' CHECK (source IN ('default', 'paid_subscription', 'student_benefit')),
  storage_quota_bytes INTEGER NOT NULL DEFAULT 1073741824,
  starts_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_student_benefits (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES wb_accounts(id) ON DELETE CASCADE,
  school_email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  verification_method TEXT NOT NULL DEFAULT 'school_email_only' CHECK (verification_method = 'school_email_only'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'converted_paid')),
  activated_at TEXT,
  expires_at TEXT,
  expiring_notified_at TEXT,
  expired_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
