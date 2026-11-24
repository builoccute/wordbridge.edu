-- ============================================================================
-- WORD BRIDGE V4.2.0 — Migration 0016
-- Admin PIN & Session, Legal Policy Versioning & Consents, Privacy Requests,
-- OAuth 6-Method Auth State, Language API Providers/Usage/Jobs,
-- 4-Skill + Pronunciation Persistence, and 100 Specialized Domains Catalog
-- Strictly additive & idempotent (preserves all historical migrations 0001-0015)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Admin 6-digit PIN (per-account salted hash, lockout, reset workflow)
CREATE TABLE IF NOT EXISTS wb_admin_pins (
  account_id TEXT PRIMARY KEY REFERENCES wb_accounts(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  must_reset INTEGER NOT NULL DEFAULT 0,
  reset_token_hash TEXT,
  reset_token_expires_at TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Time-limited Admin Sessions (created ONLY after valid Auth + RBAC + 6-digit PIN)
CREATE TABLE IF NOT EXISTS wb_admin_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  parent_session_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_admin_sessions_account ON wb_admin_sessions(account_id, revoked_at, expires_at);

-- 3. Legal Policy Documents & Versioning (Terms of Use, Privacy Policy, etc.)
CREATE TABLE IF NOT EXISTS wb_policy_documents (
  slug TEXT PRIMARY KEY,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  current_version TEXT NOT NULL DEFAULT '1.0',
  effective_date TEXT,
  operator_name TEXT,
  privacy_email TEXT,
  support_email TEXT,
  legal_email TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_policy_versions (
  id TEXT PRIMARY KEY,
  policy_slug TEXT NOT NULL REFERENCES wb_policy_documents(slug) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','in_review','approved','published','archived')),
  change_level TEXT NOT NULL DEFAULT 'minor' CHECK(change_level IN ('typo','minor','major')),
  summary_vi TEXT NOT NULL DEFAULT '',
  content_vi TEXT NOT NULL,
  content_en TEXT NOT NULL DEFAULT '',
  effective_date TEXT,
  created_by TEXT,
  reviewed_by TEXT,
  approved_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(policy_slug, version)
);
CREATE INDEX IF NOT EXISTS idx_wb_policy_versions_slug_status ON wb_policy_versions(policy_slug, status);

-- 4. User Policy Acceptance & Granular Data Processing Consents
CREATE TABLE IF NOT EXISTS wb_user_policy_consents (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_effective_date TEXT,
  acceptance_status TEXT NOT NULL CHECK(acceptance_status IN ('accepted','notified','withdrawn','declined')),
  consent_purpose TEXT NOT NULL DEFAULT 'account_agreement',
  source TEXT NOT NULL DEFAULT 'web',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_user_policy_consents_account ON wb_user_policy_consents(account_id, policy_type, consent_purpose);

-- 5. User Privacy Rights Requests (Law 91/2025/QH15 & Decree 356/2025/ND-CP)
CREATE TABLE IF NOT EXISTS wb_privacy_requests (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK(request_type IN ('access','rectify','delete','withdraw_consent','restrict_processing','export')),
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','in_progress','awaiting_user','resolved','closed')),
  details TEXT NOT NULL DEFAULT '',
  resolution_note TEXT NOT NULL DEFAULT '',
  handled_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_privacy_requests_account ON wb_privacy_requests(account_id, status);

-- 6. OAuth2 State & Linked Identities (Google, Facebook, Microsoft, Apple)
CREATE TABLE IF NOT EXISTS wb_oauth_states (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft','apple')),
  state_hash TEXT NOT NULL UNIQUE,
  redirect_to TEXT NOT NULL DEFAULT '/my-learning',
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_oauth_identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft','apple')),
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  phone_verified_after_oauth INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_wb_oauth_identities_account ON wb_oauth_identities(account_id);

-- 7. Language API Provider Registry, Usage Tracking & Async Jobs
CREATE TABLE IF NOT EXISTS wb_api_providers (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL CHECK(service_type IN ('tts','stt','pronunciation','writing','translation','ocr','language_detection','dictionary','intelligence')),
  provider_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_fallback INTEGER NOT NULL DEFAULT 0,
  config_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED' CHECK(config_status IN ('NOT_CONFIGURED','CONFIGURED','DEGRADED','DISABLED')),
  daily_quota_limit INTEGER NOT NULL DEFAULT 1000,
  monthly_quota_limit INTEGER NOT NULL DEFAULT 25000,
  data_region TEXT NOT NULL DEFAULT 'unverified',
  retention_policy TEXT NOT NULL DEFAULT 'minimal',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(service_type, provider_code)
);

CREATE TABLE IF NOT EXISTS wb_api_usage_logs (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  service_type TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  request_id TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  input_units INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd REAL,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_api_usage_logs_service_time ON wb_api_usage_logs(service_type, created_at);

CREATE TABLE IF NOT EXISTS wb_api_jobs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','completed','failed')),
  input_ref TEXT,
  result_json TEXT,
  error_reason TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_api_jobs_account_status ON wb_api_jobs(account_id, status);

-- 8. 4-Skill + Pronunciation Assessment Persistence
CREATE TABLE IF NOT EXISTS wb_reading_attempts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  document_id TEXT,
  language_code TEXT NOT NULL CHECK(language_code IN ('zh','en')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','graded')),
  answers_json TEXT NOT NULL DEFAULT '{}',
  comprehension_layers_json TEXT NOT NULL DEFAULT '{}',
  score REAL,
  feedback_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_wb_reading_attempts_account ON wb_reading_attempts(account_id, created_at);

CREATE TABLE IF NOT EXISTS wb_listening_attempts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  task_id TEXT,
  language_code TEXT NOT NULL CHECK(language_code IN ('zh','en')),
  transcript_hidden INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','graded')),
  answers_json TEXT NOT NULL DEFAULT '{}',
  score REAL,
  error_analysis_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_wb_listening_attempts_account ON wb_listening_attempts(account_id, created_at);

CREATE TABLE IF NOT EXISTS wb_speaking_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK(language_code IN ('zh','en')),
  target_text TEXT NOT NULL,
  target_phonetic TEXT NOT NULL DEFAULT '',
  r2_audio_key TEXT,
  audio_content_type TEXT,
  audio_size_bytes INTEGER NOT NULL DEFAULT 0,
  retain_long_term INTEGER NOT NULL DEFAULT 0,
  audio_expires_at TEXT,
  transcript_text TEXT,
  evaluation_status TEXT NOT NULL DEFAULT 'created' CHECK(evaluation_status IN ('created','audio_uploaded','transcribed','evaluated','provider_not_configured','failed')),
  evaluation_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_speaking_sessions_account ON wb_speaking_sessions(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wb_speaking_sessions_expiry ON wb_speaking_sessions(audio_expires_at, retain_long_term);

CREATE TABLE IF NOT EXISTS wb_pronunciation_assessments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  speaking_session_id TEXT REFERENCES wb_speaking_sessions(id) ON DELETE SET NULL,
  language_code TEXT NOT NULL CHECK(language_code IN ('zh','en')),
  target_text TEXT NOT NULL,
  provider_code TEXT NOT NULL DEFAULT 'unconfigured',
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK(status IN ('not_configured','completed','failed')),
  overall_score REAL,
  pronunciation_score REAL,
  fluency_score REAL,
  accuracy_score REAL,
  completeness_score REAL,
  word_results_json TEXT NOT NULL DEFAULT '[]',
  phoneme_results_json TEXT NOT NULL DEFAULT '[]',
  improvement_guide_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_pronunciation_account ON wb_pronunciation_assessments(account_id, created_at);

CREATE TABLE IF NOT EXISTS wb_writing_submissions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK(language_code IN ('zh','en')),
  prompt_title TEXT NOT NULL DEFAULT '',
  original_content TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','evaluated')),
  evaluation_json TEXT NOT NULL DEFAULT '{}',
  rubric_score REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_writing_submissions_account ON wb_writing_submissions(account_id, updated_at);

-- 9. 100 Specialized Domains Catalog (Item 100 split into 4 independent domains = 103 rows)
CREATE TABLE IF NOT EXISTS wb_specialized_domains_catalog (
  slug TEXT PRIMARY KEY,
  category_code TEXT NOT NULL,
  category_name_vi TEXT NOT NULL,
  item_number INTEGER NOT NULL,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  target_terms_en INTEGER NOT NULL DEFAULT 500,
  target_terms_zh INTEGER NOT NULL DEFAULT 500,
  published_terms_en INTEGER NOT NULL DEFAULT 0,
  published_terms_zh INTEGER NOT NULL DEFAULT 0,
  dataset_slug TEXT,
  status TEXT NOT NULL DEFAULT 'cataloged' CHECK(status IN ('cataloged','in_progress','published')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wb_spec_domains_cat ON wb_specialized_domains_catalog(category_code, item_number);

-- Seed baseline API Provider Adapter Registry (strictly NOT_CONFIGURED until secrets are set)
INSERT OR IGNORE INTO wb_api_providers (id, service_type, provider_code, display_name, is_primary, is_fallback, config_status, data_region, retention_policy) VALUES
  ('prov_tts_azure', 'tts', 'azure_speech', 'Azure AI Speech TTS', 1, 0, 'NOT_CONFIGURED', 'configurable', 'zero_default_r2_cache_optional'),
  ('prov_tts_google', 'tts', 'google_cloud_tts', 'Google Cloud Text-to-Speech', 0, 1, 'NOT_CONFIGURED', 'configurable', 'zero_default'),
  ('prov_stt_openai', 'stt', 'openai_whisper', 'OpenAI Whisper / Audio API', 1, 0, 'NOT_CONFIGURED', 'us_global', 'minimal_temp_delete'),
  ('prov_stt_azure', 'stt', 'azure_speech_stt', 'Azure AI Speech STT', 0, 1, 'NOT_CONFIGURED', 'configurable', 'minimal_temp_delete'),
  ('prov_pron_azure', 'pronunciation', 'azure_pronunciation', 'Azure Pronunciation Assessment', 1, 0, 'NOT_CONFIGURED', 'configurable', 'minimal_temp_delete'),
  ('prov_writ_llm', 'writing', 'writing_evaluator_api', 'Writing Evaluation Provider Adapter', 1, 0, 'NOT_CONFIGURED', 'configurable', 'user_draft_only'),
  ('prov_trans_api', 'translation', 'translation_provider_api', 'Translation Provider Adapter', 1, 0, 'NOT_CONFIGURED', 'configurable', 'zero_user_data_storage'),
  ('prov_ocr_api', 'ocr', 'document_ocr_api', 'Document OCR Provider Adapter', 1, 0, 'NOT_CONFIGURED', 'configurable', 'private_user_only'),
  ('prov_dict_local', 'dictionary', 'wordbridge_d1_lexicon', 'WORD BRIDGE D1 Lexicon & Terminology', 1, 0, 'CONFIGURED', 'cloudflare_d1', 'catalog_published');

-- Seed baseline Legal Policy Documents (staging defaults; production requires verified operator metadata)
INSERT OR IGNORE INTO wb_policy_documents (slug, title_vi, title_en, current_version, effective_date, operator_name, privacy_email, support_email, legal_email) VALUES
  ('terms', 'Điều khoản sử dụng', 'Terms of Use', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('privacy', 'Chính sách quyền riêng tư', 'Privacy Policy', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('data-protection', 'Chính sách bảo vệ dữ liệu cá nhân', 'Personal Data Protection Policy', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('cookies', 'Chính sách Cookie', 'Cookie Policy', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('community', 'Quy tắc sử dụng cộng đồng', 'Community Usage Guidelines', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('account-safety', 'Hướng dẫn an toàn tài khoản', 'Account Safety Guide', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('data-deletion', 'Quy trình gửi yêu cầu xóa dữ liệu', 'Data Deletion Request Process', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('violation-report', 'Quy trình báo cáo vi phạm', 'Violation Reporting Process', '1.0', NULL, NULL, NULL, NULL, NULL),
  ('complaints', 'Hướng dẫn xử lý khiếu nại', 'Complaint Handling Guide', '1.0', NULL, NULL, NULL, NULL, NULL);
