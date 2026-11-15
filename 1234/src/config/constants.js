'use strict';

/**
 * HẰNG SỐ KIẾN TRÚC, THƯƠNG HIỆU & HẠN MỨC DUNG LƯỢNG WORD BRIDGE (2026/2027)
 * Quyết định kiến trúc cuối cùng & Phụ lục A:
 * - Một website duy nhất tại https://wordbridge.io.vn
 * - Hạ tầng độc lập: Database PostgreSQL tự quản lý & Máy chủ Storage riêng (KHÔNG dùng Cloudflare D1/R2)
 * - Không đặt giới hạn GB cố định chung cho toàn website
 * - Hạn mức mặc định theo gói: Personal Free 1 GB, Personal Plus 5 GB,
 *   Organization Plus Tháng 50 GB/tháng (tối đa 30 thành viên),
 *   Organization Plus Năm 120 GB/tháng (tối đa 30 thành viên)
 * - Chu kỳ tháng của Organization Plus làm mới ngày 01 hàng tháng theo múi giờ Asia/Ho_Chi_Minh (không xóa dữ liệu)
 * - Cấu hình riêng do Admin đặt tại /quan-tri/luu-tru có hiệu lực ưu tiên cao hơn mặc định của gói
 */

const BRAND = {
  NAME: 'WORD BRIDGE',
  SLOGAN: 'Where Languages Bring People Together.',
  CANONICAL_DOMAIN: 'wordbridge.io.vn',
  CANONICAL_ORIGIN: 'https://wordbridge.io.vn',
  EXAM_SYSTEM_NAME: 'HỆ THỐNG KHẢO THÍ WORD BRIDGE',
  CMS_SYSTEM_NAME: 'WORD BRIDGE CMS',
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

// PHỤ LỤC A (MỤC A2, A3, A4): CẤU HÌNH HẠN MỨC DUNG LƯỢNG MẶC ĐỊNH THEO GÓI
const STORAGE_QUOTA_POLICY = {
  GLOBAL_WEBSITE_FIXED_LIMIT_BYTES: null, // Không đặt giới hạn GB cố định chung cho toàn bộ website (A2)
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  MONTHLY_RESET_DAY: 1,
  GB_BYTES,
  TB_BYTES,
  PLAN_DEFAULTS: {
    personal_free: {
      quota_bytes: 1 * GB_BYTES,
      quota_label: '1 GB / tài khoản',
      target_type: 'personal',
      is_monthly_cycle: false,
      carryover_unused: false
    },
    personal_plus_monthly: {
      quota_bytes: 5 * GB_BYTES,
      quota_label: '5 GB / tài khoản',
      target_type: 'personal',
      is_monthly_cycle: false,
      carryover_unused: false
    },
    personal_plus_yearly: {
      quota_bytes: 5 * GB_BYTES,
      quota_label: '5 GB / tài khoản',
      target_type: 'personal',
      is_monthly_cycle: false,
      carryover_unused: false
    },
    org_trial: {
      quota_bytes: 50 * GB_BYTES,
      quota_label: '50 GB / tháng (Dùng thử Tổ chức)',
      target_type: 'organization',
      max_members: 10,
      is_monthly_cycle: true,
      multiply_by_members: false,
      carryover_unused: false
    },
    org_plus_monthly: {
      quota_bytes: 50 * GB_BYTES,
      quota_label: '50 GB / tháng (Quản lý tập trung toàn tổ chức)',
      target_type: 'organization',
      max_members: 30,
      is_monthly_cycle: true,
      multiply_by_members: false,
      carryover_unused: false
    },
    org_plus_yearly: {
      quota_bytes: 120 * GB_BYTES,
      quota_label: '120 GB / tháng (Quản lý tập trung toàn tổ chức)',
      target_type: 'organization',
      max_members: 30,
      is_monthly_cycle: true,
      multiply_by_members: false,
      carryover_unused: false
    }
  }
};

// PHẦN 21: 04 ĐỊA CHỈ EMAIL CHÍNH THỨC CỦA WORD BRIDGE
const EMAIL_ADDRESSES = {
  SYSTEM_NOREPLY: 'noreply@wordbridge.io.vn',
  SYSTEM_SENDER_NAME: 'WORD BRIDGE – Email tự động từ hệ thống',
  OFFICIAL_CONTACT: 'wordbridge.education@gmail.com',
  CUSTOMER_SUPPORT: 'cskh@wordbridge.io.vn',
  PARTNERSHIP_MEDIA: 'contact@wordbridge.io.vn'
};

// PHẦN 03.2 & PHỤ LỤC A5: DANH MỤC ROUTE CHÍNH THỨC TRÊN MỘT TÊN MIỀN DUY NHẤT (KHÔNG CÓ /su-kien)
const OFFICIAL_ROUTES = [
  { path: '/', title: 'Trang chủ WORD BRIDGE', auth: false },
  { path: '/gioi-thieu', title: 'Giới thiệu', auth: false },
  { path: '/kham-pha', title: 'Khám phá nền tảng', auth: false },
  { path: '/ngon-ngu', title: 'Khám phá ngôn ngữ', auth: false },
  { path: '/hoc-tap', title: 'Trung tâm học tập', auth: false },
  { path: '/hoc-tap/nghe', title: 'Nghe điền từ', auth: false },
  { path: '/hoc-tap/tu-vung', title: 'Từ vựng', auth: false },
  { path: '/hoc-tap/sap-xep-cau', title: 'Sắp xếp câu', auth: false },
  { path: '/hoc-tap/doc-hieu', title: 'Đọc hiểu', auth: false },
  { path: '/tien-do', title: 'Theo dõi tiến độ', auth: true },
  { path: '/tai-nguyen', title: 'Thư viện tài nguyên', auth: false },
  { path: '/ket-noi', title: 'Tìm bạn thực hành', auth: true },
  { path: '/ban-be', title: 'Bạn bè', auth: true },
  { path: '/tin-nhan', title: 'Chat và tin nhắn', auth: true },
  { path: '/cong-dong', title: 'Cộng đồng', auth: false },
  { path: '/cong-dong/to-chuc', title: 'Khám phá tổ chức', auth: false },
  { path: '/cong-dong/clb', title: 'Câu lạc bộ', auth: false },
  { path: '/cong-dong/doi', title: 'Đội', auth: false },
  { path: '/cong-dong/nhom', title: 'Nhóm', auth: false },
  { path: '/khong-gian-cua-toi', title: 'Tổ chức và cộng đồng của tôi', auth: true },
  { path: '/to-chuc', title: 'Không gian quản lý tổ chức', auth: true },
  { path: '/dich-vu', title: 'Dịch vụ', auth: false },
  { path: '/goi-dich-vu', title: 'Gói thành viên', auth: false },
  { path: '/thanh-toan', title: 'Thanh toán', auth: true },
  { path: '/thanh-toan/lich-su', title: 'Lịch sử giao dịch', auth: true },
  { path: '/hoa-don', title: 'Hóa đơn', auth: true },
  { path: '/dang-nhap', title: 'Đăng nhập', auth: false },
  { path: '/dang-ky', title: 'Đăng ký cá nhân', auth: false },
  { path: '/dang-ky-to-chuc', title: 'Đăng ký tổ chức', auth: false },
  { path: '/ho-so', title: 'Hồ sơ', auth: true },
  { path: '/thong-bao', title: 'Thông báo', auth: true },
  { path: '/cai-dat', title: 'Cài đặt', auth: true },
  { path: '/khao-thi', title: 'Hệ Thống Khảo Thí WORD BRIDGE', auth: false },
  { path: '/ho-tro', title: 'Trung tâm trợ giúp', auth: false },
  { path: '/phap-ly', title: 'Chính sách và điều khoản', auth: false },
  { path: '/quan-tri', title: 'Trung tâm quản trị', auth: true, adminOnly: true },
  { path: '/quan-tri/luu-tru', title: 'Quản trị Hạ tầng Lưu trữ & Hạn mức Dung lượng', auth: true, adminOnly: true },
  { path: '/quan-tri/cms', title: 'WORD BRIDGE CMS – Soạn thảo & Chỉnh sửa Website', auth: true, adminOnly: true },
  { path: '/quan-tri/email', title: 'Trung tâm Quản lý Email', auth: true, adminOnly: true },
  { path: '/quan-tri/bao-tri', title: 'Trung tâm Bảo trì & Điều khiển Đóng/Mở Website', auth: true, adminOnly: true }
];

// PHẦN 07.3: QUY CHUẨN MẬT KHẨU BẮT BUỘC
const PASSWORD_POLICY = {
  MIN_LENGTH: 15,
  MIN_UPPERCASE: 1,
  MIN_SPECIAL_CHARS: 3,
  SPECIAL_CHAR_REGEX: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g,
  UPPERCASE_REGEX: /[A-Z]/g
};

// PHẦN 07.2: PHƯƠNG THỨC ĐĂNG NHẬP LIÊN KẾT (KHÔNG CÓ ZALO)
const ALLOWED_OAUTH_PROVIDERS = ['google', 'facebook', 'microsoft', 'apple'];

// PHẦN 24.9 & PHỤ LỤC A5: 11 VAI TRÒ RBAC TOÀN HỆ THỐNG + QUYỀN QUẢN LÝ LƯU TRỮ
const RBAC_ROLES = {
  super_admin: {
    name: 'Super Admin',
    permissions: ['*']
  },
  system_admin: {
    name: 'Quản trị hệ thống',
    permissions: ['admin.view', 'system.manage', 'storage.manage', 'maintenance.manage', 'email.manage', 'security.manage', 'backup.manage']
  },
  member_admin: {
    name: 'Quản trị thành viên',
    permissions: ['admin.view', 'users.manage', 'sessions.manage', 'support_programs.review', 'storage.manage']
  },
  learning_admin: {
    name: 'Quản trị học tập',
    permissions: ['admin.view', 'learning.manage', 'resources.manage', 'ai.manage']
  },
  community_admin: {
    name: 'Quản trị cộng đồng',
    permissions: ['admin.view', 'community.manage', 'groups.manage', 'moderation.manage']
  },
  org_admin: {
    name: 'Quản trị tổ chức',
    permissions: ['admin.view', 'organizations.manage', 'org_applications.review', 'storage.manage']
  },
  exam_admin: {
    name: 'Quản trị khảo thí',
    permissions: ['admin.view', 'exam.manage', 'question_bank.manage', 'proctor.manage', 'appeals.manage']
  },
  finance_admin: {
    name: 'Quản trị tài chính',
    permissions: ['admin.view', 'plans.manage', 'payments.reconcile', 'promotions.manage', 'refunds.manage', 'invoices.manage']
  },
  content_manager: {
    name: 'Quản lý nội dung',
    permissions: ['admin.view', 'cms.manage', 'cms.publish', 'resources.manage']
  },
  moderator: {
    name: 'Kiểm duyệt',
    permissions: ['admin.view', 'moderation.manage', 'reports.resolve']
  },
  cskh: {
    name: 'CSKH',
    permissions: ['admin.view', 'tickets.manage', 'users.view_basic']
  },
  org_owner: {
    name: 'Đại diện Tổ chức',
    permissions: ['org.workspace.manage']
  },
  user: {
    name: 'Thành viên cá nhân',
    permissions: ['profile.self', 'learning.use', 'community.use', 'exam.take']
  }
};

// PHẦN 16 & PHỤ LỤC A3: CẤU HÌNH GÓI DỊCH VỤ & HẠN MỨC DUNG LƯỢNG MẶC ĐỊNH
const SERVICE_PLANS = [
  {
    code: 'personal_free',
    name: 'Personal Free (Người Dùng Bản Miễn Phí)',
    target_type: 'personal',
    billing_cycle: 'free',
    price_vnd: 0,
    max_members: 1,
    trial_days: 0,
    default_storage_gb: 1,
    default_storage_bytes: 1 * GB_BYTES,
    ai_daily_limit: 5,
    features: [
      'Hạn mức lưu trữ mặc định: 1 GB / tài khoản (Có thể được Admin điều chỉnh riêng)',
      'Thực hành cơ bản 05 ngôn ngữ và 04 công cụ rèn luyện',
      'Hồ sơ cá nhân cơ bản & bảo vệ quyền riêng tư',
      'Tham gia cộng đồng công khai & tìm bạn thực hành',
      'Trợ lý AI ngữ cảnh (05 lượt hỗ trợ/ngày)'
    ]
  },
  {
    code: 'personal_plus_monthly',
    name: 'Personal Plus Tháng (Người Dùng Bản Plus)',
    target_type: 'personal',
    billing_cycle: 'monthly',
    price_vnd: 129000,
    max_members: 1,
    trial_days: 7,
    default_storage_gb: 5,
    default_storage_bytes: 5 * GB_BYTES,
    ai_daily_limit: 50,
    features: [
      'Hạn mức lưu trữ mặc định: 5 GB / tài khoản (Hết gói chuyển về 1 GB, không tự động xóa dữ liệu cũ)',
      'Dùng thử miễn phí 07 ngày cho tài khoản cá nhân mới',
      'Thực hành mở rộng toàn bộ chủ đề & cấp độ 05 ngôn ngữ',
      'Tạo không giới hạn bộ từ vựng cá nhân & lưu nội dung yêu thích',
      'Trợ lý AI ngữ cảnh mở rộng (50 lượt hỗ trợ/ngày)'
    ]
  },
  {
    code: 'personal_plus_yearly',
    name: 'Personal Plus Năm (Tiết kiệm 548.000đ/năm)',
    target_type: 'personal',
    billing_cycle: 'yearly',
    price_vnd: 1000000,
    max_members: 1,
    trial_days: 7,
    default_storage_gb: 5,
    default_storage_bytes: 5 * GB_BYTES,
    ai_daily_limit: 60,
    features: [
      'Hạn mức lưu trữ mặc định: 5 GB / tài khoản suốt chu kỳ năm',
      'Tiết kiệm 548.000 đồng so với thanh toán từng tháng',
      'Ưu tiên truy cập kho học liệu & đề luyện khảo thí',
      'Hỗ trợ ưu tiên từ bộ phận Chăm sóc khách hàng'
    ]
  },
  {
    code: 'org_plus_monthly',
    name: 'Organization Plus Tháng (Tổ Chức Bản Plus)',
    target_type: 'organization',
    billing_cycle: 'monthly',
    price_vnd: 350000,
    max_members: 30,
    trial_days: 14,
    default_storage_gb: 50,
    default_storage_bytes: 50 * GB_BYTES,
    ai_daily_limit: 100,
    features: [
      'Hạn mức lưu trữ tập trung: 50 GB / tháng cho toàn tổ chức (Không nhân theo số thành viên, làm mới ngày 01 hàng tháng)',
      'Tối đa 30 thành viên (Dùng thử 14 ngày tối đa 10 thành viên)',
      'Không gian tổ chức riêng, cấp tài khoản & phân quyền thành viên',
      'Tổ chức thử thách, lịch sinh hoạt nội bộ & kho tài nguyên đơn vị'
    ]
  },
  {
    code: 'org_plus_yearly',
    name: 'Organization Plus Năm (Tiết kiệm 700.000đ/năm)',
    target_type: 'organization',
    billing_cycle: 'yearly',
    price_vnd: 3500000,
    max_members: 30,
    trial_days: 14,
    default_storage_gb: 120,
    default_storage_bytes: 120 * GB_BYTES,
    ai_daily_limit: 120,
    features: [
      'Hạn mức lưu trữ tập trung: 120 GB / tháng cho toàn tổ chức (Không nhân theo số thành viên, làm mới ngày 01 hàng tháng)',
      'Tối đa 30 thành viên (Hỗ trợ nâng cấp 60, 100, >100 theo báo giá)',
      'Tùy chỉnh nhận diện thương hiệu tổ chức mở rộng & báo cáo chuyên sâu',
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

module.exports = {
  BRAND,
  GB_BYTES,
  TB_BYTES,
  STORAGE_QUOTA_POLICY,
  EMAIL_ADDRESSES,
  OFFICIAL_ROUTES,
  PASSWORD_POLICY,
  ALLOWED_OAUTH_PROVIDERS,
  RBAC_ROLES,
  SERVICE_PLANS,
  ADDON_GROUPS
};
