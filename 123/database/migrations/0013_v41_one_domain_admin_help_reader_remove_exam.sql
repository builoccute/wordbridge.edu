-- ============================================================================
-- Migration 0013: WORD BRIDGE V4.1 — One Domain, Unified Super Admin (/quan-tri),
-- Real Help Center (/help), Real Reader Library (/reader), and Safe Exam Removal
-- SAFETY: NON-DESTRUCTIVE ARCHIVE FIRST. NEVER DROPS USER ACCOUNTS OR PRACTICE.
-- Rollback script: database/rollbacks/0013_v41_rollback.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. SAFE ARCHIVE OF EXAM TABLES BEFORE DECOMMISSIONING (NO DATA LOSS)
CREATE TABLE IF NOT EXISTS wb_archive_examinations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  language_code TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  framework_reference TEXT NOT NULL,
  level_ref TEXT NOT NULL,
  skills_json TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  instructions_vi TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  scoring_scale_json TEXT NOT NULL,
  passing_threshold REAL NOT NULL,
  disclaimer_vi TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wb_archive_examination_attempts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  examination_id TEXT NOT NULL,
  status TEXT NOT NULL,
  draft_answers_json TEXT NOT NULL,
  submitted_answers_json TEXT,
  score REAL,
  max_score REAL,
  score_percent REAL,
  result_breakdown_json TEXT,
  started_at TEXT NOT NULL,
  last_saved_at TEXT NOT NULL,
  submitted_at TEXT,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO wb_archive_examinations (
  id, slug, language_code, title_vi, framework_reference, level_ref, skills_json, topic,
  duration_minutes, instructions_vi, question_ids_json, scoring_scale_json, passing_threshold,
  disclaimer_vi, review_status, created_at
)
SELECT id, slug, language_code, title_vi, framework_reference, level_ref, skills_json, topic,
       duration_minutes, instructions_vi, question_ids_json, scoring_scale_json, passing_threshold,
       disclaimer_vi, review_status, created_at
FROM wb_examinations;

INSERT OR IGNORE INTO wb_archive_examination_attempts (
  id, account_id, examination_id, status, draft_answers_json, submitted_answers_json,
  score, max_score, score_percent, result_breakdown_json, started_at, last_saved_at, submitted_at
)
SELECT id, account_id, examination_id, status, draft_answers_json, submitted_answers_json,
       score, max_score, score_percent, result_breakdown_json, started_at, last_saved_at, submitted_at
FROM wb_examination_attempts;

-- Remove exam_admin role & exam:manage permission from active RBAC
DELETE FROM wb_role_permissions WHERE role_id = 'role_exam_admin' OR permission_id = 'perm_exam_manage';
DELETE FROM wb_account_roles WHERE role_id = 'role_exam_admin';
DELETE FROM wb_roles WHERE code = 'exam_admin';
DELETE FROM wb_permissions WHERE code = 'exam:manage';

-- Ensure granular permissions exist for unified /quan-tri
INSERT OR IGNORE INTO wb_permissions (id, code, resource, action, description_vi) VALUES
  ('perm_accounts_manage', 'accounts:manage', 'accounts', 'manage', 'Khóa, mở khóa, cập nhật trạng thái xác minh và thu hồi phiên tài khoản'),
  ('perm_security_manage', 'security:manage', 'security', 'manage', 'Quản trị cấu hình bảo vệ hệ thống, phiên và kiểm soát truy cập'),
  ('perm_data_manage', 'data:manage', 'data', 'manage', 'Quản trị D1, R2, sao lưu, khôi phục và kiểm tra tính toàn vẹn'),
  ('perm_operations_manage', 'operations:manage', 'operations', 'manage', 'Quản trị email, thông báo, cấu hình hệ thống và chế độ bảo trì'),
  ('perm_reader_manage', 'reader:manage', 'reader', 'manage', 'Quản trị tài liệu trong Thư viện đọc /reader');

INSERT OR IGNORE INTO wb_role_permissions (role_id, permission_id) VALUES
  ('role_super_admin', 'perm_accounts_manage'),
  ('role_super_admin', 'perm_security_manage'),
  ('role_super_admin', 'perm_data_manage'),
  ('role_super_admin', 'perm_operations_manage'),
  ('role_super_admin', 'perm_reader_manage'),
  ('role_platform_admin', 'perm_accounts_manage'),
  ('role_platform_admin', 'perm_operations_manage'),
  ('role_academic_admin', 'perm_reader_manage'),
  ('role_editor', 'perm_reader_manage'),
  ('role_data_admin', 'perm_data_manage'),
  ('role_security_admin', 'perm_security_manage'),
  ('role_security_admin', 'perm_accounts_manage');

-- 2. REAL READER LIBRARY TABLES (/reader)
CREATE TABLE IF NOT EXISTS wb_reader_documents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  subtitle_vi TEXT DEFAULT '',
  language_code TEXT NOT NULL CHECK (language_code IN ('zh', 'en', 'ru')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'specialized', 'guide', 'grammar', 'dialogue')),
  specialized_domain_slug TEXT,
  level_ref TEXT NOT NULL DEFAULT 'Cơ bản',
  summary_vi TEXT NOT NULL DEFAULT '',
  content_text TEXT NOT NULL DEFAULT '',
  vocabulary_notes_json TEXT NOT NULL DEFAULT '[]',
  r2_object_key TEXT,
  content_type TEXT NOT NULL DEFAULT 'text/plain',
  page_count INTEGER NOT NULL DEFAULT 1,
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  author_name TEXT NOT NULL DEFAULT 'Ban Biên soạn WORD BRIDGE',
  review_status TEXT NOT NULL DEFAULT 'published' CHECK (review_status IN ('draft', 'in_review', 'approved', 'published', 'archived')),
  created_by TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_reader_docs_lang ON wb_reader_documents(language_code, review_status);

CREATE TABLE IF NOT EXISTS wb_reader_progress (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES wb_accounts(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES wb_reader_documents(id) ON DELETE CASCADE,
  current_section INTEGER NOT NULL DEFAULT 1,
  progress_percent REAL NOT NULL DEFAULT 0,
  bookmarked INTEGER NOT NULL DEFAULT 0,
  personal_notes TEXT NOT NULL DEFAULT '',
  last_read_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(account_id, document_id)
);

-- 3. SUPPORT TICKET REPLIES (/help + /quan-tri/operations)
CREATE TABLE IF NOT EXISTS wb_support_replies (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES wb_support_requests(id) ON DELETE CASCADE,
  author_account_id TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'support',
  reply_body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wb_support_replies_ticket ON wb_support_replies(ticket_id, created_at);

-- 4. SYSTEM & USER NOTIFICATIONS (/quan-tri/operations)
CREATE TABLE IF NOT EXISTS wb_notifications (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES wb_accounts(id) ON DELETE CASCADE,
  title_vi TEXT NOT NULL,
  body_vi TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'security', 'learning', 'support', 'announcement')),
  is_read INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. D1 / R2 LOGICAL BACKUP & INTEGRITY SNAPSHOTS (/quan-tri/data)
CREATE TABLE IF NOT EXISTS wb_db_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_type TEXT NOT NULL DEFAULT 'logical_d1_summary' CHECK (snapshot_type IN ('logical_d1_summary', 'integrity_check', 'r2_inventory')),
  created_by TEXT REFERENCES wb_accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  r2_object_key TEXT,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. UNIFIED ONE-DOMAIN PLATFORM CONFIG & CLEANUP OF OLD DOMAIN URLS
UPDATE wb_vocabulary_sources
SET source_url = REPLACE(source_url, 'https://www.wordbridge.vn', 'https://wordbridge.io.vn')
WHERE source_url LIKE 'https://www.wordbridge.vn%';

INSERT OR IGNORE INTO wb_platform_config (config_key, config_value, description_vi) VALUES
  ('site.domain', 'https://wordbridge.io.vn', 'Tên miền chính duy nhất của nền tảng WORD BRIDGE'),
  ('site.maintenance_mode', 'false', 'Bật/tắt chế độ bảo trì toàn hệ thống (true/false)'),
  ('site.maintenance_message', 'Hệ thống WORD BRIDGE đang bảo trì nâng cấp. Vui lòng quay lại sau ít phút.', 'Thông báo hiển thị khi bật chế độ bảo trì'),
  ('site.announcement_banner', '', 'Thanh thông báo toàn trang (để trống nếu không hiển thị)'),
  ('security.max_login_attempts', '5', 'Số lần nhập sai mật khẩu tối đa trước khi tạm khóa'),
  ('security.lockout_minutes', '15', 'Thời gian tạm khóa tài khoản (phút) sau khi đăng nhập sai nhiều lần');

-- 7. SEED REAL ACADEMIC READER DOCUMENTS (ZH / EN / RU)
INSERT OR IGNORE INTO wb_reader_documents (
  id, slug, title_vi, subtitle_vi, language_code, category, specialized_domain_slug, level_ref,
  summary_vi, content_text, vocabulary_notes_json, page_count, estimated_minutes, review_status
) VALUES
(
  'rdoc_zh_01',
  'zh-hsk1-daily-greetings-dialogue',
  'Hội thoại thực tế Tiếng Trung: Chào hỏi & Làm quen trong công việc',
  'Tiếng Trung nền tảng (HSK 1–2) · Đọc hiểu song ngữ có phiên âm Pinyin',
  'zh', 'dialogue', NULL, 'HSK 1–2',
  'Đoạn hội thoại thực tế giới thiệu bản thân, chào hỏi đồng nghiệp và trao đổi thông tin liên hệ cơ bản bằng tiếng Trung.',
  'Đoạn 1 — Chào hỏi lần đầu:
A: 你好！请问您贵姓？(Nǐ hǎo! Qǐngwèn nín guìxìng?)
   Xin chào! Xin hỏi quý danh của anh/chị là gì ạ?
B: 你好！我姓阮，叫阮明安。我是越南工程师。(Nǐ hǎo! Wǒ xìng Ruǎn, jiào Ruǎn Míng''ān. Wǒ shì Yuènán gōngchéngshī.)
   Xin chào! Tôi họ Nguyễn, tên là Nguyễn Minh An. Tôi là kỹ sư người Việt Nam.

Đoạn 2 — Trao đổi công việc:
A: 很高兴认识你！你在哪个部门工作？(Hěn gāoxìng rènshi nǐ! Nǐ zài nǎge bùmén gōngzuò?)
   Rất vui được làm quen với bạn! Bạn làm việc ở bộ phận nào?
B: 我在技术部工作。这是我的名片。(Wǒ zài jìshùbù gōngzuò. Zhè shì wǒ de míngpiàn.)
   Tôi làm việc ở bộ phận kỹ thuật. Đây là danh thiếp của tôi.

Ghi chú ngữ pháp trọng tâm:
- 您贵姓 (nín guìxìng) dùng trong tình huống trang trọng khi hỏi họ người đối diện.
- Trợ từ kết cấu 的 (de) biểu thị quan hệ sở hữu: 我的名片 (danh thiếp của tôi).',
  '[{"term":"请问 (qǐngwèn)","meaning":"xin hỏi"},{"term":"工程师 (gōngchéngshī)","meaning":"kỹ sư"},{"term":"部门 (bùmén)","meaning":"bộ phận, phòng ban"},{"term":"名片 (míngpiàn)","meaning":"danh thiếp"}]',
  2, 8, 'published'
),
(
  'rdoc_en_01',
  'en-specialized-incident-report-reading',
  'Đọc hiểu Tiếng Anh chuyên ngành CNTT: Báo cáo sự cố hệ thống (Incident Report)',
  'Tiếng Anh chuyên ngành CNTT & Cloud (CEFR B1–B2)',
  'en', 'specialized', 'it-cloud', 'CEFR B1–B2',
  'Tài liệu mẫu phân tích cấu trúc báo cáo sự cố kỹ thuật thực tế: Tóm tắt sự cố, Nguyên nhân gốc (Root Cause) và Biện pháp khắc phục.',
  'Section 1 — Executive Summary:
On November 12 at 08:15 UTC, the primary API gateway experienced elevated latency for 14 minutes due to a misconfigured connection pool limit after a routine deployment. No customer data was lost.

Section 2 — Root Cause Analysis:
During the scheduled rollout, the database connection threshold was lowered from 200 to 40 concurrent sockets. Under peak morning traffic, queued requests exceeded the timeout window and returned HTTP 503 responses.

Section 3 — Preventive Actions:
1. Enforce automated pre-deployment configuration validation in CI.
2. Add latency threshold alerts when p95 response time exceeds 400 ms for 2 consecutive minutes.
3. Document rollback commands directly in the service runbook.',
  '[{"term":"elevated latency","meaning":"độ trễ tăng cao"},{"term":"connection pool","meaning":"nhóm kết nối cơ sở dữ liệu tái sử dụng"},{"term":"root cause analysis","meaning":"phân tích nguyên nhân gốc rễ"},{"term":"rollback","meaning":"hoàn tác về phiên bản ổn định trước đó"}]',
  3, 12, 'published'
),
(
  'rdoc_zh_02',
  'zh-specialized-logistics-bill-of-lading',
  'Đọc hiểu Tiếng Trung chuyên ngành Logistics: Vận đơn đường biển (海运提单)',
  'Tiếng Trung chuyên ngành Logistics & Xuất nhập khẩu (HSK 3–4)',
  'zh', 'specialized', 'logistics', 'HSK 3–4',
  'Hướng dẫn đọc các mục cốt lõi trên vận đơn đường biển tiếng Trung và các mẫu câu xác nhận chứng từ với đối tác vận tải.',
  'Đoạn 1 — Các trường cốt lõi trên vận đơn (海运提单 - Hǎiyùn Tídān):
- 托运人 (Tuōyùnrén): Người gửi hàng (Shipper)
- 收货人 (Shōuhuòrén): Người nhận hàng (Consignee)
- 装货港 (Zhuānghuògǎng): Cảng xếp hàng (Port of Loading)
- 卸货港 (Xièhuògǎng): Cảng dỡ hàng (Port of Discharge)

Đoạn 2 — Mẫu thư xác nhận chứng từ:
请核对随附的海运提单草稿。如无异议，请于今日下午五点前确认，以便我们安排出正本提单。
(Qǐng héduì suífù de hǎiyùn tídān cǎogǎo. Rú wú yìyì, qǐng yú jīnrì xiàwǔ wǔdiǎn qián quèrèn, yǐbiàn wǒmen ānpái chū zhèngběn tídān.)
Vui lòng đối chiếu bản nháp vận đơn đính kèm. Nếu không có ý kiến điều chỉnh, xin xác nhận trước 17:00 hôm nay để chúng tôi phát hành vận đơn gốc.',
  '[{"term":"海运提单 (hǎiyùn tídān)","meaning":"vận đơn đường biển"},{"term":"核对 (héduì)","meaning":"đối chiếu, kiểm tra"},{"term":"草稿 (cǎogǎo)","meaning":"bản nháp"},{"term":"正本 (zhèngběn)","meaning":"bản gốc"}]',
  2, 10, 'published'
),
(
  'rdoc_ru_01',
  'ru-torfl-teu-university-life',
  'Đọc hiểu Tiếng Nga nền tảng: Một ngày tại trường đại học (Мой день в университете)',
  'Tiếng Nga nền tảng (TORFL ТЭУ) · Trọng âm & Cách 6 (Giới cách)',
  'ru', 'general', NULL, 'TORFL ТЭУ',
  'Bài đọc ngắn tiếng Nga có giải thích trọng âm và cấu trúc Cách 6 chỉ địa điểm (в университете, в библиотеке).',
  'Текст — Мой день в университете:
Меня зовут Анна. Я учусь в университете в Москве. Утром я завтракаю дома, а потом еду на занятия на метро.
В девять часов начинается лекция по русскому языку. После лекции я часто занимаюсь в библиотеке и читаю новые тексты. Вечером я повторяю слова и делаю домашнее задание.

Ghi chú ngữ pháp trọng tâm:
- Giới từ "в" + Cách 6 (Предложный падеж) trả lời câu hỏi Где? (Ở đâu?): в университете (ở trường đại học), в библиотеке (ở thư viện), в Москве (ở Moscow).
- Lưu ý giảm âm nguyên âm "о" không mang trọng âm đọc gần giống "а" (trong "Москва", "потом").',
  '[{"term":"университет","meaning":"trường đại học"},{"term":"библиотека","meaning":"thư viện"},{"term":"лекция","meaning":"bài giảng"},{"term":"домашнее задание","meaning":"bài tập về nhà"}]',
  2, 10, 'published'
);
