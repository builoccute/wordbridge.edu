-- Rollback for 0016_v42_admin_pin_policies_language_api_domains.sql
-- Only run after taking a verified D1 backup and stopping Worker versions dependent on V4.2 tables.
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS wb_specialized_domains_catalog;
DROP TABLE IF EXISTS wb_writing_submissions;
DROP TABLE IF EXISTS wb_pronunciation_assessments;
DROP TABLE IF EXISTS wb_speaking_sessions;
DROP TABLE IF EXISTS wb_listening_attempts;
DROP TABLE IF EXISTS wb_reading_attempts;
DROP TABLE IF EXISTS wb_api_jobs;
DROP TABLE IF EXISTS wb_api_usage_logs;
DROP TABLE IF EXISTS wb_api_providers;
DROP TABLE IF EXISTS wb_oauth_identities;
DROP TABLE IF EXISTS wb_oauth_states;
DROP TABLE IF EXISTS wb_privacy_requests;
DROP TABLE IF EXISTS wb_user_policy_consents;
DROP TABLE IF EXISTS wb_policy_versions;
DROP TABLE IF EXISTS wb_policy_documents;
DROP TABLE IF EXISTS wb_admin_sessions;
DROP TABLE IF EXISTS wb_admin_pins;
PRAGMA foreign_keys = ON;
