PRAGMA foreign_keys = ON;

-- Core identity and access
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone TEXT NOT NULL, full_name TEXT NOT NULL, username TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active', plan TEXT NOT NULL DEFAULT 'personal_free',
  email_verified_at TEXT, phone_verified_at TEXT, date_of_birth TEXT,
  guardian_consent_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '', avatar_key TEXT, languages_json TEXT NOT NULL DEFAULT '[]',
  level TEXT NOT NULL DEFAULT '', goals_json TEXT NOT NULL DEFAULT '[]',
  interests_json TEXT NOT NULL DEFAULT '[]', privacy TEXT NOT NULL DEFAULT 'private',
  contact_discovery INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_hash TEXT NOT NULL, user_agent TEXT, ip_hash TEXT, expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, purpose TEXT NOT NULL, expires_at TEXT NOT NULL,
  used_at TEXT, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY, provider TEXT NOT NULL, verifier TEXT NOT NULL,
  redirect_path TEXT NOT NULL DEFAULT '/', expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, hits INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(blocker_id,blocked_id),
  CHECK(blocker_id <> blocked_id)
);

-- Learning, practice and progress
CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY, name_vi TEXT NOT NULL, native_name TEXT NOT NULL,
  script_hint TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS practice_sets (
  id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code), skill TEXT NOT NULL,
  title TEXT NOT NULL, level TEXT NOT NULL DEFAULT 'A1', topic TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS practice_results (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id TEXT REFERENCES practice_sets(id), language_code TEXT NOT NULL, skill TEXT NOT NULL,
  score REAL NOT NULL, correct_count INTEGER NOT NULL DEFAULT 0, total_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0, details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vocabulary_decks (
  id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code), name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vocabulary_cards (
  id TEXT PRIMARY KEY, deck_id TEXT NOT NULL REFERENCES vocabulary_decks(id) ON DELETE CASCADE,
  term TEXT NOT NULL, pronunciation TEXT NOT NULL DEFAULT '', meaning TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '', audio_key TEXT, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS vocabulary_reviews (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES vocabulary_cards(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL CHECK(quality BETWEEN 0 AND 5), reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS learning_goals (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL, weekly_minutes INTEGER NOT NULL DEFAULT 60,
  target_days INTEGER NOT NULL DEFAULT 5, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,language_code)
);

-- Private storage and community resources
CREATE TABLE IF NOT EXISTS file_objects (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private', scan_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), file_id TEXT REFERENCES file_objects(id),
  title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', language_code TEXT,
  category TEXT NOT NULL DEFAULT 'other', visibility TEXT NOT NULL DEFAULT 'private',
  status TEXT NOT NULL DEFAULT 'pending', copyright_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS resource_favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,resource_id)
);
CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES users(id), receiver_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(sender_id,receiver_id),
  CHECK(sender_id <> receiver_id)
);
CREATE TABLE IF NOT EXISTS friendships (
  user_low TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_low,user_high), CHECK(user_low < user_high)
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public', status TEXT NOT NULL DEFAULT 'published',
  group_id TEXT, org_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reactions (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'like', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(post_id,user_id)
);
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', language_code TEXT, visibility TEXT NOT NULL DEFAULT 'public',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active',
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(group_id,user_id)
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'direct', title TEXT,
  created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TEXT, joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
  reply_to TEXT REFERENCES messages(id), attachment_file_id TEXT REFERENCES file_objects(id),
  status TEXT NOT NULL DEFAULT 'sent', edited_at TEXT, recalled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL REFERENCES users(id), target_type TEXT NOT NULL,
  target_id TEXT NOT NULL, reason TEXT NOT NULL, details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open', assigned_to TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT
);

-- Organizations and applications
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
  short_name TEXT NOT NULL DEFAULT '', org_type TEXT NOT NULL, legal_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending', member_limit INTEGER NOT NULL DEFAULT 30,
  profile_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organization_applications (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), applicant_id TEXT NOT NULL REFERENCES users(id),
  application_json TEXT NOT NULL DEFAULT '{}', signature_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending', reviewer_id TEXT REFERENCES users(id),
  review_note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS organization_members (
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(org_id,user_id)
);
CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member', token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', expires_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Plans, billing and promotions
CREATE TABLE IF NOT EXISTS plans (
  code TEXT PRIMARY KEY, name_vi TEXT NOT NULL, amount_vnd INTEGER NOT NULL,
  billing_period TEXT NOT NULL, member_limit INTEGER, features_json TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), org_id TEXT REFERENCES organizations(id),
  plan_code TEXT NOT NULL REFERENCES plans(code), status TEXT NOT NULL DEFAULT 'trial',
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, auto_renew INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), subscription_id TEXT REFERENCES subscriptions(id),
  order_code TEXT NOT NULL UNIQUE, plan_code TEXT NOT NULL REFERENCES plans(code),
  amount_vnd INTEGER NOT NULL, transfer_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at TEXT
);
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES payment_orders(id),
  provider TEXT NOT NULL DEFAULT 'manual', provider_ref TEXT UNIQUE,
  amount_vnd INTEGER NOT NULL, payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', verified_by TEXT REFERENCES users(id),
  verified_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES payment_orders(id),
  amount_vnd INTEGER NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested',
  requested_by TEXT NOT NULL REFERENCES users(id), reviewed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS discount_campaigns (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL, discount_value INTEGER NOT NULL,
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
  rules_json TEXT NOT NULL DEFAULT '{}', created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), points INTEGER NOT NULL,
  reason TEXT NOT NULL, reference_id TEXT, created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS aid_applications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), program TEXT NOT NULL,
  evidence_key TEXT, details_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id TEXT REFERENCES users(id), review_note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Examination and integrity
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  language_code TEXT NOT NULL, starts_at TEXT, ends_at TEXT, duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', settings_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), language_code TEXT NOT NULL,
  question_type TEXT NOT NULL, prompt TEXT NOT NULL, options_json TEXT NOT NULL DEFAULT '[]',
  answer_json TEXT NOT NULL, explanation TEXT NOT NULL DEFAULT '', topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium', points REAL NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_questions (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES question_bank(id), sort_order INTEGER NOT NULL,
  points REAL NOT NULL, PRIMARY KEY(exam_id,question_id)
);
CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES exams(id), user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'in_progress', started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL, submitted_at TEXT, answers_json TEXT NOT NULL DEFAULT '{}',
  score REAL, max_score REAL, version_snapshot_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_answers (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES question_bank(id), answer_json TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(attempt_id,question_id)
);
CREATE TABLE IF NOT EXISTS anti_cheat_events (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'info', payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS exam_appeals (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id),
  user_id TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', reviewer_id TEXT REFERENCES users(id),
  decision TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS proctor_actions (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES exam_attempts(id),
  actor_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, reason TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications, support, email, CMS, administration and maintenance
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  href TEXT, read_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, in_app INTEGER NOT NULL DEFAULT 1, email INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(user_id,category)
);
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), ticket_code TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', assigned_to TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_replies (
  id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
  internal_note INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cms_pages (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, body_html TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
  seo_json TEXT NOT NULL DEFAULT '{}', updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at TEXT
);
CREATE TABLE IF NOT EXISTS cms_revisions (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, title TEXT NOT NULL, body_html TEXT NOT NULL,
  status TEXT NOT NULL, editor_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cms_menus (
  id TEXT PRIMARY KEY, menu_key TEXT NOT NULL, items_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS service_status (
  service_key TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL DEFAULT '', updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS maintenance_windows (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, reason TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all', service_keys_json TEXT NOT NULL DEFAULT '[]',
  starts_at TEXT NOT NULL, ends_at TEXT, notice_text TEXT NOT NULL DEFAULT '',
  notice_days INTEGER NOT NULL DEFAULT 3, status TEXT NOT NULL DEFAULT 'scheduled',
  created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL,
  target_type TEXT, target_id TEXT, ip_hash TEXT, details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS email_templates (
  code TEXT PRIMARY KEY, subject TEXT NOT NULL, html_body TEXT NOT NULL,
  text_body TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY, recipient TEXT NOT NULL, reply_to TEXT, template_code TEXT,
  subject TEXT NOT NULL, html_body TEXT NOT NULL, payload_json TEXT NOT NULL DEFAULT '{}',
  dedupe_key TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT, provider_ref TEXT, last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at TEXT
);
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY, queue_id TEXT REFERENCES email_queue(id), recipient_hash TEXT NOT NULL,
  status TEXT NOT NULL, provider TEXT NOT NULL, provider_ref TEXT, error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), feature TEXT NOT NULL,
  model TEXT NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_practice_results_user_date ON practice_results(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_language_skill ON practice_sets(language_code,skill,status);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(status,visibility,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id,created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at);
CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(status,visibility,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempt_user ON exam_attempts(user_id,exam_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_attempt ON anti_cheat_events(attempt_id,created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read_at,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status,next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_org_apps_status ON organization_applications(status,created_at);

INSERT OR IGNORE INTO languages(code,name_vi,native_name,script_hint,sort_order) VALUES
('zh','Tiếng Trung','中文','Han',1),('en','Tiếng Anh','English','Latin',2),
('ko','Tiếng Hàn','한국어','Hangul',3),('ja','Tiếng Nhật','日本語','Kana + Kanji',4),
('ru','Tiếng Nga','Русский','Cyrillic',5);
INSERT OR IGNORE INTO plans(code,name_vi,amount_vnd,billing_period,member_limit,features_json,sort_order) VALUES
('personal_free','Personal Free',0,'lifetime',1,'["Thực hành cơ bản","Hồ sơ cá nhân","Cộng đồng công khai","Thống kê cơ bản"]',1),
('personal_plus_month','Personal Plus tháng',129000,'month',1,'["Thực hành mở rộng","Bộ từ vựng","Lưu nội dung","Thống kê nâng cao"]',2),
('personal_plus_year','Personal Plus năm',1000000,'year',1,'["Thực hành mở rộng","Bộ từ vựng","Lưu nội dung","Thống kê nâng cao"]',3),
('org_plus_month','Organization Plus tháng',350000,'month',30,'["Không gian tổ chức","Tối đa 30 thành viên","Quản lý thành viên","Báo cáo cơ bản"]',4),
('org_plus_year','Organization Plus năm',3500000,'year',30,'["Không gian tổ chức","Tối đa 30 thành viên","Nhận diện tổ chức","Báo cáo mở rộng"]',5);
INSERT OR IGNORE INTO service_status(service_key,enabled,message) VALUES
('learning',1,''),('connect',1,''),('community',1,''),('organizations',1,''),
('resources',1,''),('payments',1,''),('exams',1,''),('chat',1,'');

-- Current administrative units (commune-level rows are imported from the official source dataset).
CREATE TABLE IF NOT EXISTS address_units (
  code TEXT PRIMARY KEY,
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'commune', active INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT NOT NULL DEFAULT '2025-07-01',
  source_name TEXT NOT NULL DEFAULT 'QĐ 19/2025/QĐ-TTg',
  FOREIGN KEY(province_code) REFERENCES address_provinces(code)
);
CREATE TABLE IF NOT EXISTS address_provinces (
  code TEXT PRIMARY KEY, name TEXT NOT NULL, unit_type TEXT NOT NULL,
  valid_from TEXT NOT NULL DEFAULT '2025-07-01'
);
CREATE INDEX IF NOT EXISTS idx_address_units_province ON address_units(province_code,name);
CREATE TABLE IF NOT EXISTS system_integrations (
  integration_key TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'not_configured',
  public_config_json TEXT NOT NULL DEFAULT '{}', last_checked_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO address_provinces(code,name,unit_type) VALUES
('01','Thành phố Hà Nội','city'),('04','Tỉnh Cao Bằng','province'),('08','Tỉnh Tuyên Quang','province'),
('11','Tỉnh Điện Biên','province'),('12','Tỉnh Lai Châu','province'),('14','Tỉnh Sơn La','province'),
('15','Tỉnh Lào Cai','province'),('19','Tỉnh Thái Nguyên','province'),('20','Tỉnh Lạng Sơn','province'),
('22','Tỉnh Quảng Ninh','province'),('24','Tỉnh Bắc Ninh','province'),('25','Tỉnh Phú Thọ','province'),
('31','Thành phố Hải Phòng','city'),('33','Tỉnh Hưng Yên','province'),('37','Tỉnh Ninh Bình','province'),
('38','Tỉnh Thanh Hóa','province'),('40','Tỉnh Nghệ An','province'),('42','Tỉnh Hà Tĩnh','province'),
('44','Tỉnh Quảng Trị','province'),('46','Thành phố Huế','city'),('48','Thành phố Đà Nẵng','city'),
('51','Tỉnh Quảng Ngãi','province'),('52','Tỉnh Gia Lai','province'),('56','Tỉnh Khánh Hòa','province'),
('66','Tỉnh Đắk Lắk','province'),('68','Tỉnh Lâm Đồng','province'),('75','Tỉnh Đồng Nai','province'),
('79','Thành phố Hồ Chí Minh','city'),('80','Tỉnh Tây Ninh','province'),('82','Tỉnh Đồng Tháp','province'),
('86','Tỉnh Vĩnh Long','province'),('91','Tỉnh An Giang','province'),('92','Thành phố Cần Thơ','city'),('96','Tỉnh Cà Mau','province');
