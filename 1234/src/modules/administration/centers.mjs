/**
 * WORD BRIDGE — Vietnamese Administration System (100% Vietnamese UI Labels)
 * Enforces Section X (32, 33, 34, 35):
 * - All labels, menus, statuses, and notifications in Administration use Vietnamese.
 * - 5 Module Groups (A-E) + 7 Specialized Administration Centers.
 * - 9 Admin RBAC Roles with mandatory audit logging on every role change.
 * - Zero certificate modules, zero social network modules, zero organization accounts.
 */

export const ADMIN_MODULE_GROUPS_VI = Object.freeze([
  {
    groupCode: 'A',
    groupTitleVi: 'A. Quản trị nền tảng',
    modules: [
      { id: 'dashboard', titleVi: '1. Bảng điều khiển tổng quan', statusVi: 'Đang hoạt động' },
      { id: 'accounts', titleVi: '2. Quản lý tài khoản cá nhân', statusVi: 'Đang hoạt động' },
      { id: 'rbac', titleVi: '3. Phân quyền vai trò (RBAC)', statusVi: 'Đang hoạt động' },
      { id: 'languages', titleVi: '4. Quản lý ngôn ngữ (Trung – Anh – Nga)', statusVi: 'Đang hoạt động' },
      { id: 'platform-config', titleVi: '5. Cấu hình nền tảng & Gói dịch vụ', statusVi: 'Đang hoạt động' },
    ],
  },
  {
    groupCode: 'B',
    groupTitleVi: 'B. Quản trị học thuật',
    modules: [
      { id: 'programs', titleVi: '1. Chương trình học', statusVi: 'Đang hoạt động' },
      { id: 'curricula', titleVi: '2. Giáo trình', statusVi: 'Đang hoạt động' },
      { id: 'courses', titleVi: '3. Khóa học', statusVi: 'Đang hoạt động' },
      { id: 'lessons', titleVi: '4. Bài học & Phiên bản', statusVi: 'Đang hoạt động' },
      { id: 'pathways', titleVi: '5. Lộ trình học tập', statusVi: 'Đang hoạt động' },
      { id: 'resources', titleVi: '6. Học liệu đa phương tiện', statusVi: 'Đang hoạt động' },
      { id: 'dictionary', titleVi: '7. Từ điển & Kho từ vựng', statusVi: 'Đang hoạt động' },
      { id: 'grammar', titleVi: '8. Ngữ pháp hệ thống', statusVi: 'Đang hoạt động' },
      { id: 'specialized', titleVi: '9. Ngoại ngữ chuyên ngành (Trung & Anh)', statusVi: 'Đang hoạt động' },
    ],
  },
  {
    groupCode: 'C',
    groupTitleVi: 'C. Luyện tập và khảo thí',
    modules: [
      { id: 'practice', titleVi: '1. Quản lý bài tập luyện bốn kỹ năng', statusVi: 'Đang hoạt động' },
      { id: 'question-bank', titleVi: '2. Ngân hàng câu hỏi', statusVi: 'Đang hoạt động' },
      { id: 'exams', titleVi: '3. Quản lý bài thi', statusVi: 'Đang hoạt động' },
      { id: 'competency-eval', titleVi: '4. Đánh giá năng lực (Không cấp chứng chỉ)', statusVi: 'Đang hoạt động' },
      { id: 'learner-meet-ops', titleVi: '5. Vận hành Learner Meet (Chỉ metadata kỹ thuật)', statusVi: 'Đang hoạt động' },
    ],
  },
  {
    groupCode: 'D',
    groupTitleVi: 'D. Trí tuệ ngôn ngữ',
    modules: [
      { id: 'fifteen-systems', titleVi: '1. Quản lý và giám sát 15 hệ thống khác biệt', statusVi: 'Đang hoạt động' },
    ],
  },
  {
    groupCode: 'E',
    groupTitleVi: 'E. Bảo mật và vận hành',
    modules: [
      { id: 'security-audit', titleVi: '1. Bảo mật và kiểm toán', statusVi: 'Đang hoạt động' },
      { id: 'infrastructure-data', titleVi: '2. Hạ tầng và dữ liệu (Cloudflare D1 & R2)', statusVi: 'Đang hoạt động' },
    ],
  },
]);

export const SEVEN_ADMIN_CENTERS_VI = Object.freeze([
  {
    id: 'center-editorial',
    number: 1,
    nameVi: 'Trung tâm biên tập học liệu',
    responsibilityVi: 'Tạo mới, chỉnh sửa, xem trước, duyệt, phát hành và quản lý phiên bản bài học, từ điển, ngữ pháp.',
    requiredRoles: ['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'CONTENT_EDITOR', 'MODERATOR'],
  },
  {
    id: 'center-examination',
    number: 2,
    nameVi: 'Trung tâm quản trị khảo thí',
    responsibilityVi: 'Quản lý ngân hàng câu hỏi Trung – Anh – Nga, cấu hình thời gian đề thi, chấm điểm và phân tích phổ điểm (Tuyệt đối không cấp chứng chỉ).',
    requiredRoles: ['SUPER_ADMIN', 'EXAM_ADMIN'],
  },
  {
    id: 'center-intelligence',
    number: 3,
    nameVi: 'Trung tâm trí tuệ học tập',
    responsibilityVi: 'Giám sát thuật toán, tham số vận hành và trạng thái AI adapter của 15 hệ thống trí tuệ ngôn ngữ.',
    requiredRoles: ['SUPER_ADMIN', 'DATA_ADMIN', 'ACADEMIC_ADMIN'],
  },
  {
    id: 'center-multilingual',
    number: 4,
    nameVi: 'Trung tâm đa ngôn ngữ',
    responsibilityVi: 'Kiểm soát chuẩn mực ngôn ngữ Trung (HSK), Anh (CEFR), Nga (ТРКИ) và ngăn chặn mở nhầm chuyên ngành tiếng Nga.',
    requiredRoles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'ACADEMIC_ADMIN'],
  },
  {
    id: 'center-quality',
    number: 5,
    nameVi: 'Trung tâm chất lượng ngôn ngữ',
    responsibilityVi: 'Kiểm duyệt độ chính xác phiên âm Pinyin/IPA/Cyrillic, ngữ cảnh ví dụ và chuẩn hóa học liệu chuyên ngành.',
    requiredRoles: ['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'MODERATOR'],
  },
  {
    id: 'center-security-audit',
    number: 6,
    nameVi: 'Trung tâm bảo mật và kiểm toán',
    responsibilityVi: 'Theo dõi nhật ký kiểm toán RBAC, cảnh báo đăng nhập bất thường, bảo vệ chống Brute-force/CSRF/SQLi và yêu cầu xóa tài khoản.',
    requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
  },
  {
    id: 'center-infrastructure',
    number: 7,
    nameVi: 'Trung tâm vận hành hạ tầng',
    responsibilityVi: 'Giám sát Cloudflare D1 (`word`), R2 (`word`), kiểm tra tệp mồ côi, trạng thái Email Adapter và sao lưu phục hồi.',
    requiredRoles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'DATA_ADMIN'],
  },
]);

export const NINE_ADMIN_ROLES_VI = Object.freeze([
  { code: 'SUPER_ADMIN', nameVi: 'Super Admin', descriptionVi: 'Toàn quyền quản trị hệ thống và phê duyệt cấp quyền RBAC' },
  { code: 'PLATFORM_ADMIN', nameVi: 'Quản trị nền tảng', descriptionVi: 'Quản trị cấu hình nền tảng, ngôn ngữ và tài khoản' },
  { code: 'ACADEMIC_ADMIN', nameVi: 'Quản trị học thuật', descriptionVi: 'Quản trị chương trình, giáo trình, khóa học và lộ trình' },
  { code: 'CONTENT_EDITOR', nameVi: 'Biên tập viên', descriptionVi: 'Biên tập nội dung bài học, từ điển, ngữ pháp và bài tập' },
  { code: 'MODERATOR', nameVi: 'Kiểm duyệt viên', descriptionVi: 'Kiểm duyệt nội dung xuất bản và giám sát phiên thực hành' },
  { code: 'EXAM_ADMIN', nameVi: 'Quản trị khảo thí', descriptionVi: 'Quản trị ngân hàng câu hỏi và đề thi đánh giá năng lực' },
  { code: 'DATA_ADMIN', nameVi: 'Quản trị dữ liệu', descriptionVi: 'Quản trị dữ liệu D1, R2, sao lưu và 15 hệ thống trí tuệ ngôn ngữ' },
  { code: 'SECURITY_ADMIN', nameVi: 'Quản trị bảo mật', descriptionVi: 'Quản trị bảo mật, phiên đăng nhập và nhật ký kiểm toán' },
  { code: 'SUPPORT_ADMIN', nameVi: 'Quản trị hỗ trợ', descriptionVi: 'Quản trị hỗ trợ học viên và chính sách sinh viên' },
]);
