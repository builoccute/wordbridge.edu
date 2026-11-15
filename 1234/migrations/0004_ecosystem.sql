PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS conversations (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'direct', title TEXT,
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conversation_members (
 conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'member', joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
 attachment_key TEXT, edited_at TEXT, deleted_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS friendships (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,friend_id), CHECK(user_id <> friend_id)
);
CREATE TABLE IF NOT EXISTS resource_favorites (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,resource_id)
);
CREATE TABLE IF NOT EXISTS resource_access (
 resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 granted_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(resource_id,user_id)
);
CREATE TABLE IF NOT EXISTS resource_uploads (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
 resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
 object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
 checksum TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organization_reviews (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 reviewer_id TEXT NOT NULL REFERENCES users(id), decision TEXT NOT NULL,
 note TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cms_revisions (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL REFERENCES cms_pages(slug) ON DELETE CASCADE,
 title TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL,
 editor_id TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS invoices (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
 transaction_id TEXT REFERENCES payment_transactions(id), invoice_code TEXT NOT NULL UNIQUE,
 amount_vnd INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'issued',
 issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS refunds (
 id TEXT PRIMARY KEY, transaction_id TEXT NOT NULL REFERENCES payment_transactions(id),
 amount_vnd INTEGER NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested',
 requested_by TEXT NOT NULL REFERENCES users(id), reviewed_by TEXT REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_replies (
 id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS email_logs (
 id TEXT PRIMARY KEY, queue_id TEXT REFERENCES email_queue(id),
 recipient_hash TEXT NOT NULL, status TEXT NOT NULL, provider_ref TEXT,
 error_code TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS idempotency_keys (
 key TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), response_json TEXT NOT NULL,
 expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_question_bank (
 id TEXT PRIMARY KEY, language TEXT NOT NULL, question_type TEXT NOT NULL,
 topic TEXT, level TEXT, points REAL NOT NULL DEFAULT 1,
 question_json TEXT NOT NULL, answer_json TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft',
 created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_proctors (
 exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id), assigned_by TEXT REFERENCES users(id),
 PRIMARY KEY(exam_id,user_id)
);
CREATE TABLE IF NOT EXISTS exam_evidence (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
 event_id TEXT REFERENCES anti_cheat_events(id), object_key TEXT,
 note TEXT DEFAULT '', reviewed_by TEXT REFERENCES users(id),
 review_status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_time_extensions (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id),
 seconds INTEGER NOT NULL, reason TEXT NOT NULL, granted_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS service_status (
 service_key TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1,
 message TEXT DEFAULT '', updated_by TEXT REFERENCES users(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(status,created_at);
CREATE INDEX IF NOT EXISTS idx_resource_owner ON resources(owner_id,created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status,next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_slug ON cms_revisions(slug,created_at DESC);
