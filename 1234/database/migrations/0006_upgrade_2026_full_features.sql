-- Migration 0006: Admin Portal Isolation, OAuth PKCE States, Placement Assessments, Learning Roadmaps, News & Org Tasks
PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_placement_user_lang ON placement_assessments(user_id, language_code);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_lang ON learning_roadmaps(user_id, language_code);
CREATE INDEX IF NOT EXISTS idx_saved_learning_user ON saved_learning_items(user_id, language_code, item_type);
CREATE INDEX IF NOT EXISTS idx_news_status_cat ON news_articles(status, category, published_at);
CREATE INDEX IF NOT EXISTS idx_org_join_req ON org_join_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_org_tasks_org ON org_tasks(org_id, status);
