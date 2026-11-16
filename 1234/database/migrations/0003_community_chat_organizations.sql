-- Migration 0003: Connections, Friends, Chat, Community, Groups & Organizations
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_lang ON community_posts(language_code, created_at);
CREATE INDEX IF NOT EXISTS idx_org_apps_status ON org_applications(status, created_at);
