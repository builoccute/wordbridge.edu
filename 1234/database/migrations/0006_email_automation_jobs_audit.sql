-- ============================================================================
-- Migration 0006: Email Automation, Delivery Logs, Support/Contact Tickets,
-- Background Jobs, Audit Logs & Platform Configuration
-- SAFETY: STRICTLY NON-DESTRUCTIVE. NO DROP TABLE.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wb_email_events (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  template_key TEXT NOT NULL,
  template_version TEXT NOT NULL DEFAULT '1.0.0',
  sender_address TEXT NOT NULL CHECK (sender_address IN ('noreply@wordbridge.vn', 'cskh@wordbridge.vn', 'contact@wordbridge.vn')),
  reply_to_address TEXT NOT NULL CHECK (reply_to_address IN ('cskh@wordbridge.vn', 'contact@wordbridge.vn')),
  recipient_email TEXT NOT NULL,
  account_id TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  variables_json TEXT NOT NULL DEFAULT '{}',
  delivery_status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (delivery_status IN (
    'QUEUED', 'SENT', 'ACCEPTED', 'DELIVERED', 'BOUNCED', 'FAILED', 'COMPLAINED', 'RETRYING', 'BLOCKED_UNCONFIGURED'
  )),
  provider_name TEXT NOT NULL DEFAULT 'unconfigured',
  provider_message_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_email_status ON wb_email_events(delivery_status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_wb_email_recipient ON wb_email_events(recipient_email, created_at);

CREATE TABLE IF NOT EXISTS wb_email_delivery_logs (
  id TEXT PRIMARY KEY,
  email_event_id TEXT NOT NULL REFERENCES wb_email_events(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  provider_payload_json TEXT DEFAULT '{}',
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_support_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('support', 'contact_partnership')),
  account_id TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_background_jobs (
  job_name TEXT PRIMARY KEY,
  objective_vi TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cron', 'event', 'manual')),
  schedule_expr TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run_at TEXT,
  last_result_status TEXT,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  max_consecutive_failures INTEGER NOT NULL DEFAULT 5,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_audit_logs (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_audit_created ON wb_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_wb_audit_actor ON wb_audit_logs(actor_account_id, action);

CREATE TABLE IF NOT EXISTS wb_platform_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  updated_by TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
