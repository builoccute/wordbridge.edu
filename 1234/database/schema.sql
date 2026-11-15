-- ============================================================================
-- WORD BRIDGE - FULL DATABASE SCHEMA (Self-Managed PostgreSQL & Local SQL Engine - Zero Cloudflare D1/R2)
-- Kiến trúc: Một cơ sở dữ liệu thống nhất cho toàn bộ hệ sinh thái tại
-- https://wordbridge.io.vn
-- ============================================================================
PRAGMA foreign_keys = ON;

-- 1. HỆ THỐNG TÀI KHOẢN, XÁC THỰC & PHÂN QUYỀN (PHẦN 07 & 24.9)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    phone_verified INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    learning_languages TEXT NOT NULL DEFAULT '["en"]',
    proficiency_level TEXT NOT NULL DEFAULT 'A1',
    learning_goals TEXT NOT NULL DEFAULT 'Giao tiếp thực tế hàng ngày',
    interests TEXT NOT NULL DEFAULT '["Giao lưu ngôn ngữ"]',
    available_hours TEXT NOT NULL DEFAULT '19:00 - 21:00',
    privacy_settings TEXT NOT NULL DEFAULT '{"show_email":false,"show_phone":false,"show_location":false,"allow_stranger_messages":false,"profile_visibility":"public","online_status":true}',
    is_minor INTEGER NOT NULL DEFAULT 0,
    guardian_consent INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'user',
    plan_code TEXT NOT NULL DEFAULT 'personal_free',
    ai_daily_used INTEGER NOT NULL DEFAULT 0,
    ai_usage_date TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL DEFAULT 'Web Browser',
    ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
    user_agent TEXT NOT NULL DEFAULT '',
    is_revoked INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- google | facebook | microsoft | apple (Không có Zalo)
    provider_user_id TEXT NOT NULL,
    provider_email TEXT NOT NULL,
    ownership_verified INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    user_id TEXT DEFAULT NULL,
    purpose TEXT NOT NULL, -- register | login | reset_password | link_oauth | change_email
    otp_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    used INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    permissions_json TEXT NOT NULL
);

-- 2. TRUNG TÂM HỌC TẬP, 5 NGÔN NGỮ, 4 CÔNG CỤ THỰC HÀNH & TRỢ LÝ AI (PHẦN 08 & 09)
CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY, -- zh, en, ko, ja, ru
    name_vi TEXT NOT NULL,
    native_name TEXT NOT NULL,
    script_system TEXT NOT NULL,
    levels_json TEXT NOT NULL,
    font_family TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS practice_exercises (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL,
    tool_type TEXT NOT NULL, -- listening | vocabulary | sentence | reading
    level TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    content_json TEXT NOT NULL,
    answer_json TEXT NOT NULL,
    explanation TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL,
    FOREIGN KEY (language_code) REFERENCES languages(code)
);

CREATE TABLE IF NOT EXISTS practice_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    tool_type TEXT NOT NULL,
    submitted_json TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES practice_exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vocabulary_sets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    term TEXT NOT NULL,
    pronunciation TEXT NOT NULL,
    meaning_vi TEXT NOT NULL,
    example_sentence TEXT NOT NULL,
    example_translation TEXT DEFAULT '',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    mastery_level INTEGER NOT NULL DEFAULT 0, -- 0..5
    last_reviewed_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (set_id) REFERENCES vocabulary_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    target_title TEXT NOT NULL,
    target_sessions_per_week INTEGER NOT NULL DEFAULT 5,
    current_sessions INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_assistant_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exercise_id TEXT DEFAULT NULL,
    language_code TEXT NOT NULL,
    assist_type TEXT NOT NULL, -- context | vocabulary | hint | structure | reading
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. THƯ VIỆN TÀI NGUYÊN & BẢN QUYỀN (PHẦN 10)
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    uploader_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- pdf | text | vocab_set | audio | image | practice | reference | support_file
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    access_scope TEXT NOT NULL DEFAULT 'public', -- public | personal | group | organization | member | plus_only
    owner_group_id TEXT DEFAULT NULL,
    owner_org_id TEXT DEFAULT NULL,
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    moderation_status TEXT NOT NULL DEFAULT 'approved', -- pending | approved | rejected | copyright_hold
    favorite_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resource_favorites (
    user_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS copyright_reports (
    id TEXT PRIMARY KEY,
    resource_id TEXT DEFAULT NULL,
    post_id TEXT DEFAULT NULL,
    reporter_id TEXT NOT NULL,
    report_type TEXT NOT NULL, -- copyright | spam | harassment | minor_safety | inappropriate
    reason TEXT NOT NULL,
    evidence_note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- pending | reviewing | resolved | dismissed
    handled_by TEXT DEFAULT NULL,
    resolution_note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    resolved_at TEXT DEFAULT NULL
);

-- 4. KẾT NỐI BẠN HỌC, BẠN BÈ & CHAT (PHẦN 11 & 12)
CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    addressee_id TEXT NOT NULL,
    match_note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | canceled | blocked
    is_following INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    conv_type TEXT NOT NULL DEFAULT 'direct', -- direct | group
    title TEXT DEFAULT '',
    topic TEXT DEFAULT '',
    creator_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    member_role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
    joined_at TEXT NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    msg_type TEXT NOT NULL DEFAULT 'text', -- text | image | file | voice
    content TEXT NOT NULL,
    attachment_url TEXT DEFAULT '',
    reply_to_id TEXT DEFAULT NULL,
    forwarded_from_id TEXT DEFAULT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_recalled INTEGER NOT NULL DEFAULT 0,
    delivery_status TEXT NOT NULL DEFAULT 'sent', -- sent | delivered | read
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 5. CỘNG ĐỒNG, NHÓM, TỔ CHỨC & ĐĂNG KÝ XÉT DUYỆT (PHẦN 13, 14, 15)
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    topic_tag TEXT NOT NULL,
    group_id TEXT DEFAULT NULL,
    org_id TEXT DEFAULT NULL,
    visibility TEXT NOT NULL DEFAULT 'public', -- public | members | group | organization
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT DEFAULT '',
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    moderation_status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_groups (
    id TEXT PRIMARY KEY,
    group_category TEXT NOT NULL DEFAULT 'nhom', -- clb | doi | nhom
    name TEXT NOT NULL,
    language_code TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    org_id TEXT DEFAULT NULL,
    privacy TEXT NOT NULL DEFAULT 'public',
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- leader | moderator | member
    participation_score INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_activities (
    id TEXT PRIMARY KEY,
    group_id TEXT DEFAULT NULL,
    org_id TEXT DEFAULT NULL,
    activity_kind TEXT NOT NULL DEFAULT 'challenge', -- challenge | schedule | task
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    schedule_time TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    org_type_form INTEGER NOT NULL, -- 1 (Chưa có pháp nhân độc lập) | 2 (Có pháp nhân độc lập)
    unit_category TEXT NOT NULL, -- Tổ chức | Câu lạc bộ | Đội | Nhóm | Doanh nghiệp | Trường học | Khác
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    field_of_activity TEXT NOT NULL,
    founded_date TEXT NOT NULL,
    website TEXT DEFAULT '',
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    social_links_json TEXT NOT NULL,
    introduction TEXT NOT NULL,
    history TEXT NOT NULL,
    mission TEXT NOT NULL,
    vision TEXT NOT NULL,
    main_activities TEXT NOT NULL,
    member_scale TEXT NOT NULL,
    operation_scope TEXT NOT NULL,
    province_code TEXT NOT NULL,
    province_name TEXT NOT NULL,
    commune_code TEXT NOT NULL,
    commune_name TEXT NOT NULL,
    address_detail TEXT NOT NULL,
    legal_code TEXT DEFAULT '',
    legal_lookup_json TEXT DEFAULT '{}',
    has_legal_sponsor INTEGER NOT NULL DEFAULT 0,
    legal_sponsor_json TEXT DEFAULT '{}',
    founder_name TEXT NOT NULL,
    head_name TEXT NOT NULL,
    representative_json TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    plan_code TEXT NOT NULL DEFAULT 'org_trial',
    max_members INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'active', -- pending | approved | active | suspended
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_applications (
    id TEXT PRIMARY KEY,
    application_code TEXT NOT NULL UNIQUE,
    applicant_user_id TEXT NOT NULL,
    form_type INTEGER NOT NULL, -- 1 | 2
    section_i_org_json TEXT NOT NULL,
    section_ii_rep_json TEXT NOT NULL,
    section_iii_confirm_json TEXT NOT NULL,
    signature_method TEXT NOT NULL, -- digital_cert | upload_image | direct_draw
    signature_data TEXT NOT NULL,
    signature_history_json TEXT NOT NULL DEFAULT '[]',
    signed_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Chờ xét duyệt',
    -- Chưa gửi | Đã gửi | Chờ xét duyệt | Yêu cầu bổ sung | Đã phê duyệt | Từ chối | Đã kích hoạt | Tạm đình chỉ
    review_note TEXT DEFAULT '',
    reviewed_by TEXT DEFAULT NULL,
    reviewed_at TEXT DEFAULT NULL,
    approved_org_id TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    org_role TEXT NOT NULL DEFAULT 'member', -- head | executive | coordinator | member
    title TEXT NOT NULL DEFAULT 'Thành viên',
    permissions_json TEXT NOT NULL DEFAULT '["view_org","join_activities"]',
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TEXT NOT NULL,
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- 6. DỊCH VỤ, GÓI THÀNH VIÊN, HỖ TRỢ, THANH TOÁN QR & KHUYẾN MÃI (PHẦN 16, 17, 18)
CREATE TABLE IF NOT EXISTS service_plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL, -- personal | organization | addon
    billing_cycle TEXT NOT NULL, -- free | monthly | yearly | custom
    price_vnd INTEGER NOT NULL,
    max_members INTEGER NOT NULL DEFAULT 1,
    trial_days INTEGER NOT NULL DEFAULT 0,
    features_json TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT DEFAULT NULL,
    plan_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- trial | active | paused | canceled | expired
    auto_renew INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    history_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_program_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT DEFAULT NULL,
    program_type TEXT NOT NULL, -- nonprofit_30 | community_access | student_plus | hardship_support
    student_edu_email TEXT DEFAULT '',
    supporting_info_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | expired
    granted_months INTEGER NOT NULL DEFAULT 3,
    budget_allocated_vnd INTEGER NOT NULL DEFAULT 0,
    reviewed_by TEXT DEFAULT NULL,
    review_note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- percent | fixed
    discount_value INTEGER NOT NULL,
    max_discount_vnd INTEGER NOT NULL DEFAULT 500000,
    applicable_plans_json TEXT NOT NULL DEFAULT '["all"]',
    max_uses INTEGER NOT NULL DEFAULT 100,
    used_count INTEGER NOT NULL DEFAULT 0,
    per_user_limit INTEGER NOT NULL DEFAULT 1,
    budget_limit_vnd INTEGER NOT NULL DEFAULT 10000000,
    budget_used_vnd INTEGER NOT NULL DEFAULT 0,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    user_id TEXT PRIMARY KEY,
    points_balance INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'Cơ bản', -- Cơ bản | Bạc | Vàng | Kim cương
    referral_code TEXT NOT NULL UNIQUE,
    referred_by_code TEXT DEFAULT '',
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    delta_points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_orders (
    id TEXT PRIMARY KEY,
    order_code TEXT NOT NULL UNIQUE,
    transaction_code TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    org_id TEXT DEFAULT NULL,
    plan_code TEXT NOT NULL,
    base_amount_vnd INTEGER NOT NULL,
    discount_amount_vnd INTEGER NOT NULL DEFAULT 0,
    final_amount_vnd INTEGER NOT NULL,
    paid_amount_vnd INTEGER NOT NULL DEFAULT 0,
    promo_code TEXT DEFAULT '',
    transfer_content TEXT NOT NULL UNIQUE,
    qr_payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending | paid | underpaid | overpaid | wrong_content | expired | refunded | canceled
    verification_source TEXT DEFAULT '', -- bank_webhook | payment_gateway | manual_reconcile
    verified_by TEXT DEFAULT NULL,
    verified_at TEXT DEFAULT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_tax_code TEXT DEFAULT '',
    items_json TEXT NOT NULL,
    total_vnd INTEGER NOT NULL,
    issued_at TEXT NOT NULL
);

-- 7. HỆ THỐNG KHẢO THÍ WORD BRIDGE & CHỐNG GIAN LẬN (/khao-thi - PHẦN 19 & 20)
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    language_code TEXT NOT NULL,
    level TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    pass_score INTEGER NOT NULL DEFAULT 60,
    total_score INTEGER NOT NULL DEFAULT 100,
    require_camera INTEGER NOT NULL DEFAULT 0,
    require_mic INTEGER NOT NULL DEFAULT 0,
    shuffle_questions INTEGER NOT NULL DEFAULT 1,
    shuffle_options INTEGER NOT NULL DEFAULT 1,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    question_type TEXT NOT NULL,
    -- single_choice | multiple_choice | true_false | fill_blank | matching | ordering | essay
    topic TEXT NOT NULL,
    level TEXT NOT NULL,
    prompt TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_answer_json TEXT NOT NULL,
    explanation TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_registrations (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    candidate_code TEXT NOT NULL UNIQUE,
    device_checked INTEGER NOT NULL DEFAULT 0,
    camera_consented INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'registered', -- registered | in_exam | submitted | graded | published
    registered_at TEXT NOT NULL,
    UNIQUE(exam_id, user_id)
);

CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL UNIQUE,
    exam_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    paper_version_code TEXT NOT NULL,
    question_order_json TEXT NOT NULL,
    answers_json TEXT NOT NULL DEFAULT '{}',
    flagged_questions_json TEXT NOT NULL DEFAULT '[]',
    server_started_at TEXT NOT NULL,
    server_deadline_at TEXT NOT NULL,
    extra_seconds_granted INTEGER NOT NULL DEFAULT 0,
    submitted_at TEXT DEFAULT NULL,
    auto_saved_at TEXT NOT NULL,
    score INTEGER DEFAULT NULL,
    risk_level TEXT NOT NULL DEFAULT 'Thấp', -- Thấp | Trung bình | Cao | Nghiêm trọng
    session_status TEXT NOT NULL DEFAULT 'active', -- active | locked | submitted | graded
    proctor_note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS exam_integrity_events (
    id TEXT PRIMARY KEY,
    event_code TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    -- tab_switch | blur | visibility_hidden | fullscreen_exit | copy_paste | network_drop | duplicate_session | proctor_flag
    risk_level TEXT NOT NULL DEFAULT 'Thấp',
    description TEXT NOT NULL,
    evidence_json TEXT NOT NULL DEFAULT '{}',
    resolution_status TEXT NOT NULL DEFAULT 'recorded', -- recorded | verified | cleared | escalated
    handled_by TEXT DEFAULT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_appeals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    explanation_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | reviewing | resolved | rejected
    resolution_note TEXT DEFAULT '',
    handled_by TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    resolved_at TEXT DEFAULT NULL
);

-- 8. CMS WORD, EMAIL 29 MẪU, THÔNG BÁO, HỖ TRỢ & BẢO TRÌ (PHẦN 21, 22, 23, 25, 26)
CREATE TABLE IF NOT EXISTS cms_pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    page_group TEXT NOT NULL DEFAULT 'public', -- public | header | footer | menu | policy | faq | service
    html_content TEXT NOT NULL,
    blocks_json TEXT NOT NULL DEFAULT '[]',
    seo_title TEXT NOT NULL,
    seo_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published', -- draft | pending_review | published | unpublished
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_page_versions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    html_content TEXT NOT NULL,
    blocks_json TEXT NOT NULL,
    editor_id TEXT NOT NULL,
    change_note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_templates (
    slug TEXT PRIMARY KEY,
    template_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    from_address TEXT NOT NULL,
    reply_to_address TEXT NOT NULL,
    is_essential INTEGER NOT NULL DEFAULT 0,
    subject_template TEXT NOT NULL,
    html_layout TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_queue (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    template_slug TEXT NOT NULL,
    to_email TEXT NOT NULL,
    from_email TEXT NOT NULL,
    reply_to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    rendered_html TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued | sent | provider_unconfigured | failed
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    processed_at TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT DEFAULT '/',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL, -- account | learning | community | organization | payment | exam | security
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT DEFAULT '',
    assigned_email TEXT NOT NULL DEFAULT 'cskh@wordbridge.io.vn',
    status TEXT NOT NULL DEFAULT 'Mới tiếp nhận',
    -- Mới tiếp nhận | Đang xử lý | Chờ người dùng | Đã giải quyết | Đã đóng
    rating INTEGER DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_state (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'active',
    -- active | maintenance_all | suspended | maintenance_module | emergency
    title TEXT NOT NULL DEFAULT 'Hệ thống hoạt động bình thường',
    reason TEXT NOT NULL DEFAULT '',
    notice_content TEXT NOT NULL DEFAULT '',
    affected_modules_json TEXT NOT NULL DEFAULT '[]',
    advance_notice_days INTEGER NOT NULL DEFAULT 3,
    scheduled_start TEXT DEFAULT NULL,
    scheduled_end TEXT DEFAULT NULL,
    responsible_person TEXT NOT NULL DEFAULT 'Ban Quản trị Kỹ thuật WORD BRIDGE',
    pre_check_json TEXT NOT NULL DEFAULT '{}',
    post_check_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT DEFAULT NULL,
    actor_role TEXT DEFAULT 'guest',
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

-- 9. PHỤ LỤC A: HẠ TẦNG STORAGE ĐỘC LẬP, QUẢN LÝ HẠN MỨC (GB/TB) & CHU KỲ THÁNG (/quan-tri/luu-tru)
CREATE TABLE IF NOT EXISTS storage_quotas (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL, -- personal | organization
    target_id TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    default_quota_bytes INTEGER NOT NULL,
    admin_custom_quota_bytes INTEGER DEFAULT NULL,
    is_unlimited INTEGER NOT NULL DEFAULT 0,
    total_stored_bytes INTEGER NOT NULL DEFAULT 0,
    cycle_month TEXT NOT NULL DEFAULT '2026-11',
    cycle_used_bytes INTEGER NOT NULL DEFAULT 0,
    is_monthly_cycle INTEGER NOT NULL DEFAULT 0,
    quota_reached_at TEXT DEFAULT NULL,
    over_quota_blocked INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    UNIQUE(target_type, target_id)
);

CREATE TABLE IF NOT EXISTS storage_quota_cycles (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    cycle_month TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    effective_quota_bytes INTEGER NOT NULL,
    closing_cycle_used_bytes INTEGER NOT NULL,
    total_persistent_stored_bytes INTEGER NOT NULL,
    job_status TEXT NOT NULL DEFAULT 'completed', -- completed | failed
    reset_at TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS storage_quota_history (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL, -- set_custom | set_unlimited | remove_custom | plan_change | monthly_reset
    previous_custom_bytes INTEGER DEFAULT NULL,
    new_custom_bytes INTEGER DEFAULT NULL,
    previous_unlimited INTEGER NOT NULL DEFAULT 0,
    new_unlimited INTEGER NOT NULL DEFAULT 0,
    unit_input TEXT DEFAULT '',
    changed_by TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);

-- Lưu metadata tệp; tuyệt đối KHÔNG lưu nội dung tệp lớn dạng Base64 trong Database (Mục A9)
CREATE TABLE IF NOT EXISTS storage_files (
    id TEXT PRIMARY KEY,
    storage_key TEXT NOT NULL UNIQUE,
    owner_type TEXT NOT NULL, -- personal | organization
    owner_user_id TEXT DEFAULT NULL,
    owner_org_id TEXT DEFAULT NULL,
    uploaded_by_user_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    access_scope TEXT NOT NULL DEFAULT 'private',
    status TEXT NOT NULL DEFAULT 'active', -- active | deleted
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS storage_access_logs (
    id TEXT PRIMARY KEY,
    file_id TEXT DEFAULT NULL,
    actor_user_id TEXT NOT NULL,
    owner_type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    action TEXT NOT NULL, -- upload | download | delete | blocked_over_quota | cross_access_denied
    size_bytes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS infrastructure_nodes (
    node_id TEXT PRIMARY KEY,
    node_role TEXT NOT NULL, -- postgres_primary | dedicated_storage_primary | backup_vault
    node_name TEXT NOT NULL,
    provisioned_bytes INTEGER NOT NULL,
    used_bytes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unprovisioned_dev_mode',
    expansion_ready INTEGER NOT NULL DEFAULT 1,
    last_health_check_at TEXT NOT NULL
);
