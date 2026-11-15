-- Migration 0005: Examination, Integrity Events, CMS Word, 29 Emails, Tickets, Maintenance & Appendix A Storage Quotas
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_integrity_session ON exam_integrity_events(session_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_cms_slug ON cms_pages(slug, status);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_storage_quotas_target ON storage_quotas(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_owner ON storage_files(owner_type, owner_user_id, owner_org_id);
CREATE INDEX IF NOT EXISTS idx_storage_logs_actor ON storage_access_logs(actor_user_id, created_at);
