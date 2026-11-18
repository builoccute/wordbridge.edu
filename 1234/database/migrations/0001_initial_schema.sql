-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- Project: WORD BRIDGE (https://www.wordbridge.vn/)
-- Database: Cloudflare D1 - word (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
-- Policy: Safe Additive Migration ONLY. NO DROP TABLE. NO DELETE DATA.
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    checksum TEXT NOT NULL
);

-- 2. Personal Accounts & Authentication (No Organization Accounts Allowed)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    email_verified_at TEXT,
    account_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (account_status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'PENDING_DELETION')),
    profile_completed INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(account_status);

-- 3. Personal Profiles (Mandatory Separate School & Workplace Fields)
CREATE TABLE IF NOT EXISTS profiles (
    account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    school_name TEXT NOT NULL,
    workplace_name TEXT NOT NULL,
    ui_language TEXT NOT NULL DEFAULT 'vi' CHECK (ui_language IN ('vi', 'en', 'zh', 'ru')),
    primary_learning_language TEXT NOT NULL DEFAULT 'en' CHECK (primary_learning_language IN ('zh', 'en', 'ru')),
    avatar_r2_key TEXT,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_profiles_learning_lang ON profiles(primary_learning_language);

-- 4. Email Verification & Password Recovery Tokens (Link-based, No OTP)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    purpose TEXT NOT NULL DEFAULT 'EMAIL_VERIFY' CHECK (purpose IN ('EMAIL_VERIFY', 'PASSWORD_RESET', 'STUDENT_EMAIL_VERIFY')),
    target_email TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_account ON email_verification_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_hash ON email_verification_tokens(token_hash);

-- 5. Linked OAuth Identities (Google, Facebook, Microsoft, Apple - No Auto-Merge by Email)
CREATE TABLE IF NOT EXISTS oauth_identities (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'microsoft', 'apple')),
    provider_user_id TEXT NOT NULL,
    provider_email TEXT,
    provider_email_verified INTEGER NOT NULL DEFAULT 0,
    linked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_used_at TEXT,
    UNIQUE(provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_account ON oauth_identities(account_id);

-- 6. WebAuthn / FIDO2 Passkeys (Stores Public Key & Credential Metadata ONLY, Zero Biometrics/PINs)
CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key_spki TEXT NOT NULL,
    cose_algorithm INTEGER NOT NULL DEFAULT -7,
    sign_count INTEGER NOT NULL DEFAULT 0,
    friendly_name TEXT NOT NULL,
    transports_json TEXT NOT NULL DEFAULT '["internal","hybrid"]',
    aaguid TEXT,
    revoked INTEGER NOT NULL DEFAULT 0,
    revoked_at TEXT,
    last_used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_passkeys_account ON passkeys(account_id);

-- 7. Sessions & Devices Management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    csrf_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_label TEXT,
    auth_method TEXT NOT NULL DEFAULT 'password' CHECK (auth_method IN ('password', 'email_verification', 'oauth', 'passkey')),
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    revoked_at TEXT,
    last_active_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- 8. RBAC Roles & Permissions (9 Official Admin Roles + Learner/Instructor)
CREATE TABLE IF NOT EXISTS roles (
    code TEXT PRIMARY KEY,
    name_vi TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    is_admin_role INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS permissions (
    code TEXT PRIMARY KEY,
    module_vi TEXT NOT NULL,
    description_vi TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
    permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS account_roles (
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
    granted_by TEXT REFERENCES accounts(id),
    approval_note TEXT,
    granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    PRIMARY KEY (account_id, role_code)
);
CREATE INDEX IF NOT EXISTS idx_account_roles_account ON account_roles(account_id);

-- 9. Security Events, Account Recovery & Deletion Requests, and Audit Logs
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    ip_address TEXT,
    user_agent TEXT,
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_security_events_account ON security_events(account_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);

CREATE TABLE IF NOT EXISTS account_lifecycle_requests (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('ACCOUNT_DELETION', 'ACCOUNT_RECOVERY', 'DATA_EXPORT')),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
    processed_by TEXT REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    before_json TEXT,
    after_json TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 10. Languages & Academic Hierarchy (Chinese, English, Russian ONLY)
CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY CHECK (code IN ('zh', 'en', 'ru')),
    name_vi TEXT NOT NULL,
    native_name TEXT NOT NULL,
    supports_general INTEGER NOT NULL DEFAULT 1,
    supports_specialized INTEGER NOT NULL DEFAULT 0,
    proficiency_framework TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS learning_programs (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    slug TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    title_native TEXT NOT NULL,
    program_group TEXT NOT NULL CHECK (program_group IN ('FOUNDATION', 'GENERAL', 'COMMUNICATION', 'ACADEMIC', 'SELF_STUDY', 'SPECIALIZED')),
    level_code TEXT NOT NULL,
    cefr_reference TEXT,
    specialized_domain TEXT,
    description_vi TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_programs_lang ON learning_programs(language_code, program_group);

CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES learning_programs(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    syllabus_summary_vi TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    curriculum_id TEXT NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    slug TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    title_target TEXT NOT NULL,
    level_code TEXT NOT NULL,
    is_specialized INTEGER NOT NULL DEFAULT 0,
    specialized_field TEXT,
    estimated_hours INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_courses_lang ON courses(language_code, is_specialized);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    slug TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    title_target TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    objectives_json TEXT NOT NULL DEFAULT '[]',
    vocabulary_json TEXT NOT NULL DEFAULT '[]',
    grammar_json TEXT NOT NULL DEFAULT '[]',
    new_knowledge_html TEXT NOT NULL DEFAULT '',
    examples_json TEXT NOT NULL DEFAULT '[]',
    context_dialogue_json TEXT NOT NULL DEFAULT '[]',
    listening_section_json TEXT NOT NULL DEFAULT '{}',
    speaking_section_json TEXT NOT NULL DEFAULT '{}',
    reading_section_json TEXT NOT NULL DEFAULT '{}',
    writing_section_json TEXT NOT NULL DEFAULT '{}',
    media_assets_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    published_by TEXT REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, order_index);

-- 11. Learning Resources & R2 Object Metadata
CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
    language_code TEXT NOT NULL REFERENCES languages(code),
    r2_object_key TEXT NOT NULL UNIQUE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'PDF', 'DOCUMENT', 'INTERACTIVE')),
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED', 'PRIVATE')),
    checksum_sha256 TEXT,
    uploaded_by TEXT REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_resources_r2_key ON learning_resources(r2_object_key);

-- 12. Dictionary, Vocabulary, Flashcards & Spaced Repetition
CREATE TABLE IF NOT EXISTS dictionary_entries (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    headword TEXT NOT NULL,
    phonetic TEXT NOT NULL,
    audio_r2_key TEXT,
    part_of_speech TEXT NOT NULL,
    meaning_vi TEXT NOT NULL,
    definition_target TEXT NOT NULL,
    examples_json TEXT NOT NULL DEFAULT '[]',
    usage_context TEXT NOT NULL DEFAULT '',
    synonyms_json TEXT NOT NULL DEFAULT '[]',
    antonyms_json TEXT NOT NULL DEFAULT '[]',
    word_family_json TEXT NOT NULL DEFAULT '[]',
    collocations_json TEXT NOT NULL DEFAULT '[]',
    radicals_stroke_json TEXT DEFAULT '{}',
    is_specialized INTEGER NOT NULL DEFAULT 0,
    specialized_domain TEXT,
    level_code TEXT NOT NULL,
    is_public_preview INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_dict_lang_headword ON dictionary_entries(language_code, headword);
CREATE INDEX IF NOT EXISTS idx_dict_specialized ON dictionary_entries(language_code, is_specialized);

CREATE TABLE IF NOT EXISTS grammar_entries (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    code TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    structure_formula TEXT NOT NULL,
    explanation_vi TEXT NOT NULL,
    examples_json TEXT NOT NULL DEFAULT '[]',
    common_mistakes_json TEXT NOT NULL DEFAULT '[]',
    level_code TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS personal_vocabulary (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    dictionary_entry_id TEXT NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    deck_name TEXT NOT NULL DEFAULT 'Sổ từ vựng mặc định',
    personal_note TEXT DEFAULT '',
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(account_id, dictionary_entry_id)
);
CREATE INDEX IF NOT EXISTS idx_personal_vocab_review ON personal_vocabulary(account_id, next_review_at);

-- 13. Four-Skills Practice & Interactive Exercises
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
    language_code TEXT NOT NULL REFERENCES languages(code),
    skill_type TEXT NOT NULL CHECK (skill_type IN ('LISTENING', 'SPEAKING', 'READING', 'WRITING', 'VOCABULARY', 'GRAMMAR', 'SITUATIONAL')),
    exercise_format TEXT NOT NULL CHECK (exercise_format IN ('MULTIPLE_CHOICE', 'FILL_BLANK', 'PRONUNCIATION', 'DICTATION', 'READING_COMP', 'WRITING_PROMPT', 'ROLEPLAY')),
    level_code TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    options_json TEXT NOT NULL DEFAULT '[]',
    correct_answer_json TEXT NOT NULL DEFAULT '{}',
    explanation_vi TEXT NOT NULL DEFAULT '',
    rubric_json TEXT NOT NULL DEFAULT '{}',
    is_public_view INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_exercises_lang_skill ON exercises(language_code, skill_type);

CREATE TABLE IF NOT EXISTS exercise_submissions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    user_response_json TEXT NOT NULL,
    score_percent REAL NOT NULL DEFAULT 0,
    is_correct INTEGER NOT NULL DEFAULT 0,
    feedback_json TEXT NOT NULL DEFAULT '{}',
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_exercise_sub_account ON exercise_submissions(account_id, submitted_at);

-- 14. Examinations & Question Bank (Strictly NO Certificates)
CREATE TABLE IF NOT EXISTS question_bank (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    skill_type TEXT NOT NULL CHECK (skill_type IN ('LISTENING', 'SPEAKING', 'READING', 'WRITING', 'LEXIS_GRAMMAR')),
    level_code TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('SINGLE_CHOICE', 'MULTI_CHOICE', 'CLOZE', 'MATCHING', 'WRITING_TASK', 'SPEAKING_TASK')),
    stem_text TEXT NOT NULL,
    media_r2_key TEXT,
    choices_json TEXT NOT NULL DEFAULT '[]',
    answer_key_json TEXT NOT NULL DEFAULT '{}',
    points REAL NOT NULL DEFAULT 1.0,
    difficulty REAL NOT NULL DEFAULT 0.5,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_qbank_filter ON question_bank(language_code, skill_type, level_code);

CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    code TEXT NOT NULL UNIQUE,
    title_vi TEXT NOT NULL,
    standard_ref TEXT NOT NULL,
    level_code TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    passing_score_percent REAL NOT NULL DEFAULT 66.0,
    question_ids_json TEXT NOT NULL DEFAULT '[]',
    sections_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    total_score REAL NOT NULL,
    max_score REAL NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    skill_breakdown_json TEXT NOT NULL DEFAULT '{}',
    answers_json TEXT NOT NULL DEFAULT '{}',
    diagnostic_summary_vi TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_exam_results_account ON exam_results(account_id, submitted_at);

-- 15. Learner Progress Tracking
CREATE TABLE IF NOT EXISTS learner_progress (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
    completion_status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (completion_status IN ('IN_PROGRESS', 'COMPLETED')),
    mastery_score REAL NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(account_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_account ON learner_progress(account_id, language_code);

-- 16. Learner Meet Operational Metadata ONLY (Strictly NO Chat, NO Recording, NO Content Storage)
CREATE TABLE IF NOT EXISTS learner_meet_sessions (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL UNIQUE,
    host_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    mode TEXT NOT NULL CHECK (mode IN ('ONE_ON_ONE', 'GROUP')),
    topic_title TEXT NOT NULL,
    level_code TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 2 CHECK (max_participants BETWEEN 2 AND 12),
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED')),
    chat_disabled INTEGER NOT NULL DEFAULT 1 CHECK (chat_disabled = 1),
    recording_disabled INTEGER NOT NULL DEFAULT 1 CHECK (recording_disabled = 1),
    screenshare_disabled INTEGER NOT NULL DEFAULT 1 CHECK (screenshare_disabled = 1),
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS learner_meet_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES learner_meet_sessions(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    left_at TEXT,
    connection_state TEXT NOT NULL DEFAULT 'CONNECTED' CHECK (connection_state IN ('CONNECTING', 'CONNECTED', 'RECONNECTING', 'DISCONNECTED')),
    mic_enabled INTEGER NOT NULL DEFAULT 1,
    camera_enabled INTEGER NOT NULL DEFAULT 1,
    technical_diagnostics_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_meet_participants_session ON learner_meet_participants(session_id);

-- 17. Subscriptions, Quotas & Student 3-Month Personal Plus Policy
CREATE TABLE IF NOT EXISTS subscription_entitlements (
    account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL DEFAULT 'PERSONAL_FREE' CHECK (plan_code IN ('PERSONAL_FREE', 'PERSONAL_PLUS')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'DOWNGRADED')),
    is_student_benefit INTEGER NOT NULL DEFAULT 0,
    student_edu_email TEXT UNIQUE,
    student_verified_at TEXT,
    student_benefit_claimed_once INTEGER NOT NULL DEFAULT 0,
    starts_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    expires_at TEXT,
    quota_usage_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_sub_student_email ON subscription_entitlements(student_edu_email);

-- 18. Email Delivery Outbox & Logs (Supports 3 Official Addresses & Reply-To Policy)
CREATE TABLE IF NOT EXISTS email_records (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    template_code TEXT NOT NULL,
    from_address TEXT NOT NULL,
    reply_to_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('QUEUED', 'SENT', 'BLOCKED_MISSING_CREDENTIALS', 'FAILED')),
    provider_name TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    provider_message_id TEXT,
    error_detail TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 19. Notifications & Platform Configuration
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('ACCOUNT', 'SECURITY', 'LEARNING', 'EXAM', 'SYSTEM')),
    title_vi TEXT NOT NULL,
    body_vi TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS platform_configurations (
    config_key TEXT PRIMARY KEY,
    config_value_json TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    updated_by TEXT REFERENCES accounts(id),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
