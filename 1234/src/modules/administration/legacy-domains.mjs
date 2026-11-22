import { generateId, sanitizeText } from '../../utils/security.mjs';

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

/**
 * WORD BRIDGE — Standalone PDF Reader SSO Bridge Adapter
 * Target App: https://reader.wordbridge.io.vn/
 *
 * Enforces Section II (6):
 * - Uses central account/SSO system with WORD BRIDGE.
 * - NEVER appears in Header, Footer, or Homepage of WORD BRIDGE.
 * - Does NOT rebuild PDF Reader inside the main website.
 * - Only activates real SSO token exchange when technical credentials (`PDF_READER_SSO_ENABLED=true`
 *   and `PDF_READER_SSO_SHARED_SECRET`) are configured.
 */

export function getPdfReaderSsoStatus(env = {}) {
  const enabled = String(env.PDF_READER_SSO_ENABLED || 'false').toLowerCase() === 'true';
  const hasSecret = Boolean(env.PDF_READER_SSO_SHARED_SECRET && env.PDF_READER_SSO_SHARED_SECRET.length >= 16);
  const ready = enabled && hasSecret;

  return {
    targetApplicationUrl: env.PDF_READER_SSO_URL || 'https://reader.wordbridge.io.vn/',
    includedInHeader: false,
    includedInFooter: false,
    includedOnHomepage: false,
    status: ready ? 'CONFIGURED' : 'BLOCKED_MISSING_SSO_TECHNICAL_SPEC',
    messageVi: ready
      ? 'Cầu nối SSO với ứng dụng độc lập reader.wordbridge.io.vn đã sẵn sàng.'
      : 'Cầu nối SSO cho https://reader.wordbridge.io.vn/ đã được xây dựng ở trạng thái chờ cấu hình kỹ thuật (Nhóm B - Cần bổ sung PDF_READER_SSO_SHARED_SECRET và thông số callback từ ứng dụng độc lập).',
  };
}

/**
 * WORD BRIDGE — Learner Meet Service (1-1 & Group Live Audio/Video Practice)
 *
 * Enforces Section IV (14.3, 14.4) and Section VIII (25):
 * - Allows: 1-1 practice, group practice, create session, join session, participant
 *   management, live audio, live video, mic toggle, camera toggle, connection state
 *   handling, leave session, end session.
 * - Strictly PROHIBITS:
 *   - NO text chat, NO messaging, NO file transfer, NO comments, NO chat attachments.
 *   - NO audio recording, NO video recording, NO Record button, NO recording archive,
 *     NO screen sharing, NO session content storage, NO AI training or ad targeting.
 * - Stores minimal operational metadata ONLY (join timestamp, leave timestamp, connection state).
 * - Explicitly displays the mandatory privacy notice that the platform does not actively
 *   record or store session content, without falsely claiming it can prevent external
 *   hardware/third-party device recording by users.
 */



export const LEARNER_MEET_PRIVACY_DISCLOSURE_VI =
  'THÔNG BÁO QUYỀN RIÊNG TƯ LEARNER MEET: Hệ thống WORD BRIDGE không chủ động ghi âm, ghi hình, không có tính năng chat văn bản, không chia sẻ màn hình và tuyệt đối không lưu trữ nội dung âm thanh/hình ảnh của phiên thực hành hay sử dụng cho huấn luyện AI/quảng cáo. Hệ thống chỉ ghi nhận metadata vận hành tối thiểu (thời điểm tham gia, rời phiên và trạng thái kết nối kỹ thuật). Lưu ý: Nền tảng không thể ngăn chặn việc người tham gia khác tự ý ghi lại bằng thiết bị phần cứng hoặc phần mềm bên ngoài của họ; vui lòng chỉ chia sẻ thông tin phù hợp khi thực hành.';

export const LEARNER_MEET_POLICY_ENFORCEMENT = Object.freeze({
  supportsOneOnOne: true,
  supportsGroup: true,
  supportsLiveAudio: true,
  supportsLiveVideo: true,
  supportsMicToggle: true,
  supportsCameraToggle: true,
  chatAllowed: false,
  fileSharingAllowed: false,
  recordingAllowed: false,
  screenSharingAllowed: false,
  aiTrainingAllowed: false,
  storesSessionMediaContent: false,
});

export function assertProhibitedLearnerMeetAction(actionType) {
  const forbidden = new Set([
    'SEND_CHAT_MESSAGE',
    'UPLOAD_CHAT_FILE',
    'START_RECORDING',
    'STOP_RECORDING',
    'DOWNLOAD_RECORDING',
    'START_SCREEN_SHARE',
  ]);
  if (forbidden.has(String(actionType || '').toUpperCase())) {
    return {
      allowed: false,
      status: 403,
      errorVi:
        'Hành động bị từ chối theo quy định kiến trúc sản phẩm (PHẦN IV Mục 14.3 & 14.4): Learner Meet chỉ hỗ trợ âm thanh và video trực tiếp; tuyệt đối không có chat văn bản, gửi tệp, chia sẻ màn hình hoặc ghi âm/ghi hình.',
    };
  }
  return { allowed: true };
}

export function createLearnerMeetSessionRecord({ hostAccountId, languageCode = 'en', mode = 'ONE_ON_ONE', topicTitle = '', levelCode = 'B1', maxParticipants = 2 }) {
  if (!['zh', 'en', 'ru'].includes(languageCode)) {
    throw new Error('Ngôn ngữ thực hành Learner Meet chỉ hỗ trợ Tiếng Trung (zh), Tiếng Anh (en) hoặc Tiếng Nga (ru).');
  }
  const normalizedMode = mode === 'GROUP' ? 'GROUP' : 'ONE_ON_ONE';
  const cap = normalizedMode === 'ONE_ON_ONE' ? 2 : Math.min(12, Math.max(3, Number(maxParticipants || 6)));
  const now = new Date().toISOString();

  return {
    id: generateId('meet'),
    room_code: `WB-${languageCode.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    host_account_id: hostAccountId,
    language_code: languageCode,
    mode: normalizedMode,
    topic_title: sanitizeText(topicTitle || 'Phiên thực hành phản xạ hội thoại', 140),
    level_code: sanitizeText(levelCode, 30),
    max_participants: cap,
    status: 'LIVE',
    chat_disabled: 1,
    recording_disabled: 1,
    screenshare_disabled: 1,
    privacy_disclosure_vi: LEARNER_MEET_PRIVACY_DISCLOSURE_VI,
    started_at: now,
    ended_at: null,
    created_at: now,
  };
}
