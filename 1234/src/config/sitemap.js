/**
 * WORD BRIDGE — Canonical Multi-Page Sitemap Registry (Section 8)
 */

export const PUBLIC_HEADER_NAV = Object.freeze([
  { label: 'Trang chủ', href: '/' },
  { label: 'Học ngoại ngữ', href: '/learning' },
  { label: 'Từ điển', href: '/dictionary' },
  { label: 'Luyện tập', href: '/practice' },
  { label: 'Khảo thí', href: '/examinations' },
  { label: 'Ngoại ngữ chuyên ngành', href: '/specialized' },
  { label: 'Learner Meet', href: '/learner-meet' },
  { label: 'Giới thiệu', href: '/about' },
]);

export const PUBLIC_FOOTER_SECTIONS = Object.freeze([
  {
    title: 'Khám phá',
    links: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Giới thiệu', href: '/about' },
      { label: 'Học ngoại ngữ', href: '/learning' },
      { label: 'Ngoại ngữ chuyên ngành', href: '/specialized' },
    ],
  },
  {
    title: 'Học tập',
    links: [
      { label: 'Từ điển', href: '/dictionary' },
      { label: 'Luyện tập', href: '/practice' },
      { label: 'Khảo thí', href: '/examinations' },
      { label: 'Learner Meet', href: '/learner-meet' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm trợ giúp', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Liên hệ hỗ trợ', href: '/contact' },
    ],
  },
  {
    title: 'Chính sách',
    links: [
      { label: 'Điều khoản sử dụng', href: '/policies/terms' },
      { label: 'Chính sách quyền riêng tư', href: '/policies/privacy' },
      { label: 'Chính sách bảo vệ dữ liệu', href: '/policies/data-protection' },
      { label: 'Chính sách sử dụng nền tảng', href: '/policies/platform-usage' },
    ],
  },
]);

export const ADMIN_NAV_GROUPS = Object.freeze([
  {
    groupVi: 'Quản trị nền tảng',
    items: [
      { label: 'Bảng điều khiển', href: '/admin' },
      { label: 'Tài khoản', href: '/admin/accounts' },
      { label: 'Vai trò (RBAC)', href: '/admin/roles' },
      { label: 'Phân quyền chi tiết', href: '/admin/permissions' },
      { label: 'Quản lý ngôn ngữ', href: '/admin/languages' },
      { label: 'Cấu hình nền tảng', href: '/admin/settings' },
    ],
  },
  {
    groupVi: 'Quản trị học thuật',
    items: [
      { label: 'Chương trình', href: '/admin/programs' },
      { label: 'Giáo trình', href: '/admin/curricula' },
      { label: 'Khóa học', href: '/admin/courses' },
      { label: 'Học phần', href: '/admin/modules' },
      { label: 'Tuần học', href: '/admin/weeks' },
      { label: 'Bài học', href: '/admin/lessons' },
      { label: 'Học liệu & Âm thanh', href: '/admin/resources' },
      { label: 'Từ vựng', href: '/admin/vocabulary' },
      { label: 'Ngữ pháp', href: '/admin/grammar' },
      { label: 'Từ điển', href: '/admin/dictionary' },
    ],
  },
  {
    groupVi: 'Luyện tập & Khảo thí',
    items: [
      { label: 'Bài luyện tập', href: '/admin/practice' },
      { label: 'Ngân hàng câu hỏi', href: '/admin/question-bank' },
      { label: 'Khảo thí', href: '/admin/examinations' },
      { label: 'Learner Meet', href: '/admin/learner-meet' },
    ],
  },
  {
    groupVi: 'Trí tuệ ngôn ngữ',
    items: [
      { label: '15 Hệ thống trí tuệ', href: '/admin/language-intelligence' },
    ],
  },
  {
    groupVi: 'Bảo mật & Vận hành',
    items: [
      { label: 'Hệ thống Email tự động', href: '/admin/email' },
      { label: 'Nhật ký kiểm toán', href: '/admin/audit-logs' },
      { label: 'Hạ tầng D1/R2 & Tác vụ nền', href: '/admin/infrastructure' },
    ],
  },
]);
