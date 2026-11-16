/**
 * HẰNG SỐ KIẾN TRÚC, THƯƠNG HIỆU & HẠN MỨC DUNG LƯỢNG WORD BRIDGE (2026–2027)
 * Kiến trúc triển khai thống nhất:
 * - Tên miền chính thức duy nhất: https://wordbridge.io.vn
 * - Hạ tầng sản xuất: Cloudflare Workers (wordbridge) + Cloudflare D1 (binding DB, database "word") + Cloudflare R2 (binding R2, bucket "word")
 * - Không đặt biến giới hạn GB toàn hệ thống để ghi đè quyền lợi từng gói dịch vụ
 * - Hạn mức mặc định cố định theo gói đã duyệt:
 *   + Người Dùng bản Miễn Phí (personal_free): 1 GB / tài khoản
 *   + Người Dùng bản Plus – Tháng (personal_plus_monthly): 5 GB / tài khoản
 *   + Người Dùng bản Plus – Năm (personal_plus_yearly): 5 GB / tài khoản
 *   + Dùng thử Tổ chức 14 ngày (org_trial): 50 GB / tổ chức / tháng (tối đa 10 thành viên)
 *   + Tổ Chức Plus – Tháng (org_plus_monthly): 50 GB / tổ chức / tháng (tối đa 30 thành viên)
 *   + Tổ Chức Plus – Năm (org_plus_yearly): 120 GB / tổ chức / tháng (tối đa 30 thành viên)
 */

const BRAND = {
  NAME: 'WORD BRIDGE',
  SLOGAN: 'Where Languages Bring People Together.',
  CANONICAL_DOMAIN: 'wordbridge.io.vn',
  CANONICAL_ORIGIN: 'https://wordbridge.io.vn',
  EXAM_SYSTEM_NAME: 'HỆ THỐNG KHẢO THÍ WORD BRIDGE',
  CMS_SYSTEM_NAME: 'TRUNG TÂM NỘI DUNG WORD BRIDGE',
  PILLARS: ['LEARN', 'CONNECT', 'COMMUNITY', 'GROW'],
  COLORS: {
    DEEP_TEAL: '#146466',
    VERMILION_RED: '#C92F1C',
    LIGHT_TEAL: '#5AABA9',
    WARM_IVORY: '#E2E2C4'
  }
};

const GB_BYTES = 1024 * 1024 * 1024; // 1,073,741,824 bytes
const TB_BYTES = 1024 * GB_BYTES;    // 1,099,511,627,776 bytes

// HẠN MỨC DUNG LƯỢNG THEO GÓI (BẢO VỆ TUYỆT ĐỐI, KHÔNG ĐỂ MONTHLY_QUOTA_GB GHI ĐÈ)
const PLAN_DEFAULT_QUOTAS = Object.freeze({
  personal_free: Object.freeze({
    quota_bytes: 1 * GB_BYTES,
    quota_label: '1 GB / tài khoản',
    target_type: 'personal',
    max_members: 1,
    is_monthly_cycle: false,
    carryover_unused: false
  }),
  personal_plus_monthly: Object.freeze({
    quota_bytes: 5 * GB_BYTES,
    quota_label: '5 GB / tài khoản',
    target_type: 'personal',
    max_members: 1,
    is_monthly_cycle: false,
    carryover_unused: false
  }),
  personal_plus_yearly: Object.freeze({
    quota_bytes: 5 * GB_BYTES,
    quota_label: '5 GB / tài khoản',
    target_type: 'personal',
    max_members: 1,
    is_monthly_cycle: false,
    carryover_unused: false
  }),
  org_trial: Object.freeze({
    quota_bytes: 50 * GB_BYTES,
    quota_label: '50 GB / tổ chức / tháng (Dùng thử 14 ngày)',
    target_type: 'organization',
    max_members: 10,
    is_monthly_cycle: true,
    multiply_by_members: false,
    carryover_unused: false
  }),
  org_plus_monthly: Object.freeze({
    quota_bytes: 50 * GB_BYTES,
    quota_label: '50 GB / tổ chức / tháng',
    target_type: 'organization',
    max_members: 30,
    is_monthly_cycle: true,
    multiply_by_members: false,
    carryover_unused: false
  }),
  org_plus_yearly: Object.freeze({
    quota_bytes: 120 * GB_BYTES,
    quota_label: '120 GB / tổ chức / tháng',
    target_type: 'organization',
    max_members: 30,
    is_monthly_cycle: true,
    multiply_by_members: false,
    carryover_unused: false
  })
});

const STORAGE_QUOTA_POLICY = {
  GLOBAL_WEBSITE_FIXED_LIMIT_BYTES: null,
  OVERRIDE_PLAN_QUOTAS_BY_ENV: false,
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  MONTHLY_RESET_DAY: 1,
  GB_BYTES,
  TB_BYTES,
  PLAN_DEFAULTS: PLAN_DEFAULT_QUOTAS
};

// 04 ĐỊA CHỈ EMAIL CHÍNH THỨC CỦA WORD BRIDGE
const EMAIL_ADDRESSES = {
  SYSTEM_NOREPLY: 'noreply@wordbridge.io.vn',
  SYSTEM_SENDER_NAME: 'WORD BRIDGE – Email tự động từ hệ thống',
  OFFICIAL_CONTACT: 'wordbridge.education@gmail.com',
  CUSTOMER_SUPPORT: 'cskh@wordbridge.io.vn',
  PARTNERSHIP_MEDIA: 'contact@wordbridge.io.vn'
};

// DANH MỤC ROUTE CHÍNH THỨC TRÊN MỘT TÊN MIỀN DUY NHẤT (KHÔNG CÓ /su-kien)
const OFFICIAL_ROUTES = [
  { path: '/', title: 'Trang chủ WORD BRIDGE', auth: false },
  { path: '/gioi-thieu', title: 'Giới thiệu nền tảng', auth: false },
  { path: '/kham-pha', title: 'Khám phá nền tảng', auth: false },
  { path: '/ngon-ngu', title: 'Khám phá 05 ngôn ngữ', auth: false },
  { path: '/hoc-tap', title: 'Trung tâm học tập', auth: false },
  { path: '/hoc-tap/nghe', title: 'Luyện nghe', auth: false },
  { path: '/hoc-tap/tu-vung', title: 'Từ vựng và Flashcard', auth: false },
  { path: '/hoc-tap/sap-xep-cau', title: 'Sắp xếp câu', auth: false },
  { path: '/hoc-tap/doc-hieu', title: 'Đọc hiểu', auth: false },
  { path: '/hoc-tap/kiem-tra-trinh-do', title: 'Kiểm tra trình độ và Lộ trình', auth: false },
  { path: '/tien-do', title: 'Theo dõi tiến độ', auth: true },
  { path: '/tai-nguyen', title: 'Thư viện tài nguyên', auth: false },
  { path: '/ket-noi', title: 'Tìm bạn thực hành', auth: true },
  { path: '/ban-be', title: 'Danh sách bạn học', auth: true },
  { path: '/tin-nhan', title: 'Chat và Nhắn tin', auth: true },
  { path: '/cong-dong', title: 'Bảng tin cộng đồng', auth: false },
  { path: '/cong-dong/to-chuc', title: 'Khám phá tổ chức', auth: false },
  { path: '/cong-dong/clb', title: 'Câu lạc bộ ngoại ngữ', auth: false },
  { path: '/cong-dong/doi', title: 'Đội thực hành', auth: false },
  { path: '/cong-dong/nhom', title: 'Nhóm thực hành', auth: false },
  { path: '/khong-gian-cua-toi', title: 'Tổ chức và Cộng đồng của tôi', auth: true, memberOnly: true },
  { path: '/to-chuc', title: 'Không gian Quản lý Tổ chức', auth: true, orgManagerOnly: true },
  { path: '/tin-tuc', title: 'Tin tức và Cập nhật', auth: false },
  { path: '/tim-kiem', title: 'Tìm kiếm toàn nền tảng', auth: false },
  { path: '/dich-vu', title: 'Gói thành viên và Hỗ trợ', auth: false },
  { path: '/goi-dich-vu', title: 'Gói thành viên và Hỗ trợ', auth: false },
  { path: '/thanh-toan', title: 'Thanh toán và Đối soát QR', auth: true },
  { path: '/thanh-toan/lich-su', title: 'Lịch sử giao dịch', auth: true },
  { path: '/hoa-don', title: 'Hóa đơn dịch vụ', auth: true },
  { path: '/dang-nhap', title: 'Đăng nhập', auth: false },
  { path: '/dang-ky', title: 'Đăng ký tài khoản', auth: false },
  { path: '/dang-ky-to-chuc', title: 'Đăng ký tổ chức', auth: false },
  { path: '/ho-so', title: 'Hồ sơ cá nhân', auth: true },
  { path: '/thong-bao', title: 'Thông báo của tôi', auth: true },
  { path: '/cai-dat', title: 'Cài đặt tài khoản', auth: true },
  { path: '/khao-thi', title: 'Khảo Thí', auth: false },
  { path: '/ho-tro', title: 'Trung tâm trợ giúp', auth: false },
  { path: '/phap-ly', title: 'Điều khoản và Quyền riêng tư', auth: false },
  { path: '/quan-tri/dang-nhap', title: 'Đăng nhập Quản trị Hệ thống', auth: false, adminPortal: true },
  { path: '/quan-tri', title: 'Bảng điều khiển Quản trị', auth: true, adminOnly: true },
  { path: '/quan-tri/luu-tru', title: 'Quản lý Dung lượng và Hạ tầng', auth: true, adminOnly: true },
  { path: '/quan-tri/cms', title: 'Quản lý Nội dung và Tin tức', auth: true, adminOnly: true },
  { path: '/quan-tri/email', title: 'Quản lý Email Hệ thống', auth: true, adminOnly: true },
  { path: '/quan-tri/bao-tri', title: 'Quản lý Bảo trì Hệ thống', auth: true, adminOnly: true }
];

// QUY CHUẨN MẬT KHẨU BẮT BUỘC
const PASSWORD_POLICY = {
  MIN_LENGTH: 15,
  MIN_UPPERCASE: 1,
  MIN_SPECIAL_CHARS: 3,
  SPECIAL_CHAR_REGEX: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g,
  UPPERCASE_REGEX: /[A-Z]/g
};

// PHƯƠNG THỨC ĐĂNG NHẬP LIÊN KẾT (KHÔNG CÓ ZALO)
const ALLOWED_OAUTH_PROVIDERS = ['google', 'facebook', 'microsoft', 'apple'];

// VAI TRÒ TRONG TỔ CHỨC (PHẦN XI.4 - TÁCH BIỆT 6 VAI TRÒ)
const ORG_ROLES = {
  owner: { name: 'Chủ sở hữu tổ chức', canManageOrg: true, canManageMembers: true, canAssignTasks: true },
  head: { name: 'Chủ sở hữu tổ chức', canManageOrg: true, canManageMembers: true, canAssignTasks: true },
  manager: { name: 'Người quản lý', canManageOrg: true, canManageMembers: true, canAssignTasks: true },
  executive: { name: 'Ban điều hành', canManageOrg: true, canManageMembers: true, canAssignTasks: true },
  coordinator: { name: 'Điều phối viên', canManageOrg: true, canManageMembers: false, canAssignTasks: true },
  group_leader: { name: 'Người phụ trách nhóm', canManageOrg: true, canManageMembers: false, canAssignTasks: true },
  member: { name: 'Thành viên', canManageOrg: false, canManageMembers: false, canAssignTasks: false }
};

// VAI TRÒ RBAC TOÀN HỆ THỐNG (PHẦN XVIII.2)
const RBAC_ROLES = {
  super_admin: {
    name: 'Quản trị viên Cấp cao',
    isAdmin: true,
    permissions: ['*']
  },
  system_admin: {
    name: 'Quản trị viên Hệ thống',
    isAdmin: true,
    permissions: ['admin.view', 'system.manage', 'storage.manage', 'maintenance.manage', 'email.manage', 'security.manage', 'backup.manage']
  },
  member_admin: {
    name: 'Quản trị viên Thành viên',
    isAdmin: true,
    permissions: ['admin.view', 'users.manage', 'sessions.manage', 'support_programs.review', 'storage.manage']
  },
  learning_admin: {
    name: 'Quản trị viên Học tập',
    isAdmin: true,
    permissions: ['admin.view', 'learning.manage', 'resources.manage', 'ai.manage']
  },
  community_admin: {
    name: 'Quản trị viên Cộng đồng',
    isAdmin: true,
    permissions: ['admin.view', 'community.manage', 'groups.manage', 'moderation.manage']
  },
  org_admin: {
    name: 'Quản trị viên Tổ chức',
    isAdmin: true,
    permissions: ['admin.view', 'organizations.manage', 'org_applications.review', 'storage.manage']
  },
  exam_admin: {
    name: 'Quản trị viên Khảo thí',
    isAdmin: true,
    permissions: ['admin.view', 'exam.manage', 'question_bank.manage', 'proctor.manage', 'appeals.manage']
  },
  finance_admin: {
    name: 'Quản trị viên Tài chính',
    isAdmin: true,
    permissions: ['admin.view', 'plans.manage', 'payments.reconcile', 'promotions.manage', 'refunds.manage', 'invoices.manage', 'support_programs.review']
  },
  content_manager: {
    name: 'Quản trị viên Nội dung',
    isAdmin: true,
    permissions: ['admin.view', 'cms.manage', 'cms.publish', 'news.manage', 'resources.manage']
  },
  moderator: {
    name: 'Kiểm duyệt viên',
    isAdmin: true,
    permissions: ['admin.view', 'moderation.manage', 'reports.resolve']
  },
  cskh: {
    name: 'Chăm sóc Khách hàng',
    isAdmin: true,
    permissions: ['admin.view', 'tickets.manage', 'users.view_basic']
  },
  org_owner: {
    name: 'Đại diện Tổ chức',
    isAdmin: false,
    permissions: ['org.workspace.manage']
  },
  user: {
    name: 'Thành viên Cá nhân',
    isAdmin: false,
    permissions: ['profile.self', 'learning.use', 'community.use', 'exam.take']
  }
};

// BẢNG GIÁ GÓI DỊCH VỤ TIÊU CHUẨN HOÀN TOÀN BẰNG TIẾNG VIỆT (PHẦN XV.1 & XV.2)
const SERVICE_PLANS = [
  {
    code: 'personal_free',
    name: 'Người Dùng bản Miễn Phí',
    target_type: 'personal',
    billing_cycle: 'free',
    price_vnd: 0,
    max_members: 1,
    trial_days: 0,
    default_storage_gb: 1,
    default_storage_bytes: 1 * GB_BYTES,
    ai_daily_limit: 5,
    features: [
      'Hạn mức dung lượng lưu trữ: 1 GB/tài khoản',
      'Thực hành 05 ngôn ngữ và 04 công cụ rèn luyện cốt lõi',
      'Hồ sơ cá nhân cơ bản và bảo vệ quyền riêng tư',
      'Tham gia cộng đồng công khai và tìm bạn thực hành',
      'Trợ lý AI ngữ cảnh (05 lượt hỗ trợ/ngày)'
    ]
  },
  {
    code: 'personal_plus_monthly',
    name: 'Người Dùng bản Plus – Tháng',
    target_type: 'personal',
    billing_cycle: 'monthly',
    price_vnd: 129000,
    max_members: 1,
    trial_days: 7,
    default_storage_gb: 5,
    default_storage_bytes: 5 * GB_BYTES,
    ai_daily_limit: 50,
    features: [
      'Hạn mức dung lượng lưu trữ: 5 GB/tài khoản (Hết gói chuyển về 1 GB, không xóa dữ liệu cũ)',
      'Dùng thử miễn phí 07 ngày cho tài khoản cá nhân mới',
      'Thực hành mở rộng toàn bộ chủ đề, cấp độ và lộ trình 05 ngôn ngữ',
      'Tạo không giới hạn bộ từ vựng cá nhân, ôn tập ngắt quãng và lưu nội dung yêu thích',
      'Trợ lý AI ngữ cảnh mở rộng (50 lượt hỗ trợ/ngày)'
    ]
  },
  {
    code: 'personal_plus_yearly',
    name: 'Người Dùng bản Plus – Năm',
    target_type: 'personal',
    billing_cycle: 'yearly',
    price_vnd: 1000000,
    max_members: 1,
    trial_days: 7,
    default_storage_gb: 5,
    default_storage_bytes: 5 * GB_BYTES,
    ai_daily_limit: 60,
    features: [
      'Hạn mức dung lượng lưu trữ: 5 GB/tài khoản suốt chu kỳ năm',
      'Tiết kiệm 548.000 đồng so với thanh toán từng tháng',
      'Toàn bộ quyền lợi Người Dùng bản Plus và lộ trình chuyên sâu',
      'Hỗ trợ ưu tiên từ bộ phận Chăm sóc khách hàng'
    ]
  },
  {
    code: 'org_plus_monthly',
    name: 'Tổ Chức Plus – Tháng',
    target_type: 'organization',
    billing_cycle: 'monthly',
    price_vnd: 350000,
    max_members: 30,
    trial_days: 14,
    default_storage_gb: 50,
    default_storage_bytes: 50 * GB_BYTES,
    ai_daily_limit: 100,
    features: [
      'Hạn mức dung lượng dùng chung: 50 GB/tổ chức/tháng (Không nhân theo số thành viên, làm mới bộ đếm ngày 01 hằng tháng)',
      'Tối đa 30 thành viên (Dùng thử 14 ngày tối đa 10 thành viên)',
      'Không gian quản lý tổ chức riêng, phân quyền 06 vai trò và nhóm nội bộ',
      'Giao nhiệm vụ, quản lý tài liệu nội bộ và báo cáo thực hành thành viên'
    ]
  },
  {
    code: 'org_plus_yearly',
    name: 'Tổ Chức Plus – Năm',
    target_type: 'organization',
    billing_cycle: 'yearly',
    price_vnd: 3500000,
    max_members: 30,
    trial_days: 14,
    default_storage_gb: 120,
    default_storage_bytes: 120 * GB_BYTES,
    ai_daily_limit: 120,
    features: [
      'Hạn mức dung lượng dùng chung: 120 GB/tổ chức/tháng (Không nhân theo số thành viên, làm mới bộ đếm ngày 01 hằng tháng)',
      'Tối đa 30 thành viên (Hỗ trợ mở rộng theo nhu cầu thực tế)',
      'Tùy chỉnh nhận diện thương hiệu tổ chức mở rộng và báo cáo chuyên sâu',
      'Hỗ trợ kỹ thuật ưu tiên (Tiết kiệm 700.000 đồng/năm)'
    ]
  }
];

const ADDON_GROUPS = [
  { code: 'addon_branding', number: 1, name: 'Nhận diện tổ chức mở rộng', base_price_vnd: 150000 },
  { code: 'addon_analytics', number: 2, name: 'Báo cáo chuyên sâu và xuất dữ liệu', base_price_vnd: 200000 },
  { code: 'addon_storage', number: 3, name: 'Mở rộng dung lượng và quản lý tài nguyên', base_price_vnd: 120000 },
  { code: 'addon_scale_ops', number: 4, name: 'Công cụ quản lý hoạt động quy mô lớn', base_price_vnd: 250000 },
  { code: 'addon_setup', number: 5, name: 'Hỗ trợ thiết lập và cấu hình triển khai', base_price_vnd: 300000 },
  { code: 'addon_integration', number: 6, name: 'Tích hợp kết nối hệ thống bên ngoài', base_price_vnd: 400000 }
];

export { BRAND, GB_BYTES, TB_BYTES, PLAN_DEFAULT_QUOTAS, STORAGE_QUOTA_POLICY, EMAIL_ADDRESSES, OFFICIAL_ROUTES, PASSWORD_POLICY, ALLOWED_OAUTH_PROVIDERS, ORG_ROLES, RBAC_ROLES, SERVICE_PLANS, ADDON_GROUPS };
export default { BRAND, GB_BYTES, TB_BYTES, PLAN_DEFAULT_QUOTAS, STORAGE_QUOTA_POLICY, EMAIL_ADDRESSES, OFFICIAL_ROUTES, PASSWORD_POLICY, ALLOWED_OAUTH_PROVIDERS, ORG_ROLES, RBAC_ROLES, SERVICE_PLANS, ADDON_GROUPS };
