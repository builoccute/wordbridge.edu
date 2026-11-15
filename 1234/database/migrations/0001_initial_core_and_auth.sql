-- Migration 0001: Users, Sessions, OAuth Links, Email OTPs, Roles & Audit Logs
PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_email ON email_otps(email, purpose);
