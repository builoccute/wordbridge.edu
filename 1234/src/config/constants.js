/**
 * WORD BRIDGE — Canonical Product Constants, Unified Single-Domain Contracts & Hard Boundaries
 * One Domain — One Platform: https://wordbridge.io.vn (Admin: https://wordbridge.io.vn/quan-tri)
 * Exam module completely removed; Practice, Learning, Dictionary, Reader, Help, Admin unified.
 */

export const BRAND = Object.freeze({
  name: 'WORD BRIDGE',
  tagline: 'Where Languages Bring People Together.',
  websiteUrl: 'https://wordbridge.io.vn',
  adminUrl: 'https://wordbridge.io.vn/quan-tri',
  readerPath: '/reader',
  helpPath: '/help',
  copyright: '© 2026 WORD BRIDGE. All rights reserved.',
  colors: {
    deepTeal: '#146466',
    vermilionRed: '#C92F1C',
    aqua: '#5AABA9',
    warmIvory: '#E2E2C4',
  },
});

export const ECOSYSTEM = Object.freeze({
  main: 'https://wordbridge.io.vn',
});

export const ALLOWED_RETURN_ORIGINS = Object.freeze([
  ECOSYSTEM.main,
]);

export function normalizeUiLocale(locale) {
  return String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'vi';
}

export const TRANSLATIONS = Object.freeze({
  vi: Object.freeze({
    siteTitle: 'WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh – Nga',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    search: 'Tìm kiếm',
    learning: 'Học tập',
    practice: 'Cổng Luyện Tập',
    dictionary: 'Từ điển',
    specialized: 'Chuyên ngành',
    reader: 'Thư viện đọc',
    help: 'Trung tâm trợ giúp',
    authGateTitle: 'Đăng nhập để tiếp tục',
    authGateBody: 'Hành động này cần tài khoản. Sau đăng nhập, WORD BRIDGE sẽ quay lại trang hiện tại với intent an toàn.',
  }),
  en: Object.freeze({
    siteTitle: 'WORD BRIDGE — Chinese, English & Russian Language Platform',
    login: 'Sign in',
    register: 'Register',
    logout: 'Sign out',
    search: 'Search',
    learning: 'Learning',
    practice: 'Practice Center',
    dictionary: 'Dictionary',
    specialized: 'Specialized',
    reader: 'Reader Library',
    help: 'Help Center',
    authGateTitle: 'Sign in to continue',
    authGateBody: 'This action requires an account. After sign-in, WORD BRIDGE returns to the current page with a safe intent.',
  }),
});

export function safeReturnUrl(input = '/', baseOrigin = ECOSYSTEM.main) {
  const fallback = '/';
  const raw = String(input || '').trim();
  if (!raw) return fallback;
  try {
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      const parsed = new URL(raw, baseOrigin);
      if (parsed.origin === baseOrigin) return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return fallback;
    }
    const parsed = new URL(raw);
    if (ALLOWED_RETURN_ORIGINS.includes(parsed.origin)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function signInUrl(nextPath = '/', intent = '', locale = '') {
  const safeNext = safeReturnUrl(nextPath, ECOSYSTEM.main);
  const params = new URLSearchParams();
  params.set('next', safeNext);
  if (intent) params.set('intent', String(intent));
  if (locale) params.set('locale', normalizeUiLocale(locale));
  return `/login?${params.toString()}`;
}

export const OFFICIAL_LANGUAGES = Object.freeze({
  zh: {
    code: 'zh',
    slug: 'chinese',
    nameVi: 'Tiếng Trung',
    nativeName: '中文',
    hasGeneral: true,
    hasSpecialized: true,
    framework: 'HSK 1–6 & HSK 7–9',
    scriptSystem: 'Chữ Hán giản thể (và phồn thể theo chương trình)',
    phoneticSystem: 'Pinyin, 4 thanh điệu + thanh nhẹ, bộ thủ',
  },
  en: {
    code: 'en',
    slug: 'english',
    nameVi: 'Tiếng Anh',
    nativeName: 'English',
    hasGeneral: true,
    hasSpecialized: true,
    framework: 'CEFR A1–C2 (tham chiếu IELTS, TOEFL, Cambridge)',
    scriptSystem: 'Chữ Latin',
    phoneticSystem: 'IPA, trọng âm từ, trọng âm câu, ngữ điệu',
  },
  ru: {
    code: 'ru',
    slug: 'russian',
    nameVi: 'Tiếng Nga',
    nativeName: 'Русский язык',
    hasGeneral: true,
    hasSpecialized: false, // TUYỆT ĐỐI KHÔNG MỞ CHUYÊN NGÀNH TIẾNG NGA
    framework: 'TORFL / ТРКИ (ТЭУ, ТБУ, ТРКИ-I đến ТРКИ-IV)',
    scriptSystem: 'Bảng chữ cái Cyrillic',
    phoneticSystem: 'Trọng âm, biến âm, 6 cách danh từ, cặp thể động từ',
  },
});

export const ALLOWED_LANGUAGE_CODES = Object.freeze(['zh', 'en', 'ru']);
export const SPECIALIZED_LANGUAGE_CODES = Object.freeze(['zh', 'en']);

/**
 * 12 real specialized terminology datasets in public/data/vocab/ (12,104 verified entries)
 * Strictly English & Chinese scope — ZERO Russian specialized datasets.
 */
export const SPECIALIZED_VOCAB_DATASETS = Object.freeze([
  { slug: 'ke-toan-doanh-nghiep', nameVi: 'Kế toán Doanh nghiệp', languages: ['en'], count: 1000, sample: 'balance sheet, general ledger, accounts payable, audit trail' },
  { slug: 'quan-tri-mang-may-tinh', nameVi: 'Quản trị Mạng Máy tính', languages: ['en'], count: 1000, sample: 'subnet mask, firewall, routing table, packet loss' },
  { slug: 'cong-nghe-o-to', nameVi: 'Công nghệ Ô tô', languages: ['en'], count: 1000, sample: 'internal combustion engine, turbocharger, ABS, crankshaft' },
  { slug: 'ky-thuat-may-lanh-dhkk', nameVi: 'Kỹ thuật Máy lạnh & ĐHKK', languages: ['en'], count: 1000, sample: 'compressor, evaporator, refrigerant, condenser' },
  { slug: 'sua-chua-lap-rap-may-tinh', nameVi: 'Sửa chữa & Lắp ráp Máy tính', languages: ['en'], count: 1012, sample: 'motherboard, BIOS/UEFI, thermal paste, power supply unit' },
  { slug: 'thiet-ke-do-hoa', nameVi: 'Thiết kế Đồ họa', languages: ['en'], count: 1017, sample: 'typography, vector graphics, color palette, kerning' },
  { slug: 'dien-cong-nghiep', nameVi: 'Điện Công nghiệp', languages: ['en'], count: 1012, sample: 'circuit breaker, transformer, three-phase motor, contactor' },
  { slug: 'dien-tu-cong-nghiep', nameVi: 'Điện tử Công nghiệp', languages: ['en'], count: 1015, sample: 'microcontroller, oscilloscope, rectifier, printed circuit board' },
  { slug: 'co-dien-tu', nameVi: 'Cơ Điện tử', languages: ['en'], count: 1023, sample: 'PLC, actuator, pneumatic cylinder, servo motor' },
  { slug: 'cat-got-kim-loai', nameVi: 'Cắt gọt Kim loại', languages: ['en'], count: 1005, sample: 'metal cutting, machining, CNC lathe, milling cutter' },
  { slug: 'nguoi-sua-chua-may-cong-cu', nameVi: 'Nguội Sửa chữa Máy công cụ', languages: ['en'], count: 1013, sample: 'bench work, micrometer, spindle alignment, backlash' },
  { slug: 'bao-tri-thiet-bi-co-dien', nameVi: 'Bảo trì Thiết bị Cơ điện', languages: ['en'], count: 1007, sample: 'preventive maintenance, bearing lubrication, vibration analysis, downtime' },
]);

export const SPECIALIZED_DOMAINS = Object.freeze([
  ...SPECIALIZED_VOCAB_DATASETS,
  { slug: 'logistics', nameVi: 'Logistics', languages: ['zh', 'en'], count: 0, sample: 'bill of lading, demurrage, 海运提单' },
  { slug: 'business', nameVi: 'Thương mại', languages: ['zh'], count: 0, sample: '不可抗力, 合同条款' },
  { slug: 'import-export', nameVi: 'Xuất nhập khẩu', languages: ['zh', 'en'], count: 0, sample: '信用证, commercial invoice, packing list' },
  { slug: 'it-cloud', nameVi: 'Công nghệ thông tin và Cloud', languages: ['en'], count: 0, sample: 'cloud infrastructure, API gateway' },
  { slug: 'mechanical-engineering', nameVi: 'Cơ khí', languages: ['zh', 'en'], count: 0, sample: '公差, tolerance' },
  { slug: 'electrical-electronics', nameVi: 'Điện – điện tử', languages: ['zh', 'en'], count: 0, sample: 'circuit, voltage' },
  { slug: 'automotive', nameVi: 'Ô tô', languages: ['en'], count: 0, sample: 'powertrain, chassis' },
  { slug: 'economics-tourism', nameVi: 'Kinh tế – du lịch', languages: ['en'], count: 0, sample: 'hospitality, itinerary' },
  { slug: 'graphic-design', nameVi: 'Thiết kế đồ họa (D1)', languages: ['en'], count: 0, sample: 'layout, composition' },
  { slug: 'healthcare', nameVi: 'Điều dưỡng – y dược', languages: ['en'], count: 0, sample: 'vital signs, clinical care' },
]);

/**
 * 8 Active Administrative Roles (exam_admin removed completely)
 */
export const RBAC_ROLES = Object.freeze([
  { code: 'super_admin', nameVi: 'Super Admin', descriptionVi: 'Toàn quyền quản trị tối cao toàn nền tảng, phân quyền và cấu hình lõi.' },
  { code: 'platform_admin', nameVi: 'Quản trị viên', descriptionVi: 'Quản lý tài khoản, ngôn ngữ, cấu hình vận hành nền tảng.' },
  { code: 'academic_admin', nameVi: 'Quản trị học thuật', descriptionVi: 'Quản lý chương trình, giáo trình, khóa học, bài học, từ điển và chuyên ngành.' },
  { code: 'editor', nameVi: 'Biên tập viên', descriptionVi: 'Soạn thảo và cập nhật học liệu, bài học, tài liệu Reader, từ vựng và ngữ pháp.' },
  { code: 'reviewer', nameVi: 'Kiểm duyệt viên', descriptionVi: 'Rà soát, hiệu đính và phê duyệt học thuật trước khi phát hành.' },
  { code: 'support_admin', nameVi: 'Nhân sự hỗ trợ', descriptionVi: 'Tiếp nhận, phản hồi và quản lý yêu cầu hỗ trợ người học và liên hệ.' },
  { code: 'data_admin', nameVi: 'Quản trị dữ liệu', descriptionVi: 'Theo dõi Cloudflare D1, R2, sao lưu, khôi phục và kiểm tra tính toàn vẹn dữ liệu.' },
  { code: 'security_admin', nameVi: 'Quản trị bảo mật', descriptionVi: 'Quản lý nhật ký đăng nhập, nhật ký kiểm toán, phiên đăng nhập và bảo vệ hệ thống.' },
]);

export const ADMIN_ROLE_CODES = Object.freeze(new Set(RBAC_ROLES.map((r) => r.code)));

export const PLANS = Object.freeze({
  PERSONAL_FREE: {
    code: 'PERSONAL_FREE',
    nameVi: 'Thành viên FREE',
    storageQuotaBytes: 1073741824, // 1 GB/account
    priceStatus: 'Miễn phí',
  },
  PERSONAL_PLUS: {
    code: 'PERSONAL_PLUS',
    nameVi: 'Thành viên',
    storageQuotaBytes: 5368709120, // 5 GB/account
    priceStatus: 'BLOCKED — Chờ xác nhận bảng giá chính thức',
    studentBenefitMonths: 3,
    studentBenefitVerification: 'school_email_only',
  },
});

export const INTELLIGENCE_SYSTEMS = Object.freeze([
  { slug: 'language-dna', code: 'INT-01', nameVi: 'Language DNA', descriptionVi: 'Bản đồ năng lực ngôn ngữ nhiều chiều (từ vựng, ngữ pháp, ngữ âm, ngữ dụng, độ trôi chảy, độ hiểu sâu).', languages: ['zh', 'en', 'ru'] },
  { slug: 'language-transfer-lab', code: 'INT-02', nameVi: 'Language Transfer Lab', descriptionVi: 'Phân tích chuyển giao tích cực và tiêu cực giữa tiếng Việt với tiếng Trung, tiếng Anh và tiếng Nga.', languages: ['zh', 'en', 'ru'] },
  { slug: 'knowledge-to-language', code: 'INT-03', nameVi: 'Knowledge-to-Language', descriptionVi: 'Học kiến thức chuyên ngành bằng ngoại ngữ (chỉ áp dụng tiếng Trung và tiếng Anh).', languages: ['zh', 'en'] },
  { slug: 'real-world-simulator', code: 'INT-04', nameVi: 'Real-World Language Simulator', descriptionVi: 'Mô phỏng tình huống giao tiếp nhiều bước, nhiều lựa chọn và nhiều kết quả.', languages: ['zh', 'en', 'ru'] },
  { slug: 'language-error-genome', code: 'INT-05', nameVi: 'Language Error Genome', descriptionVi: 'Phân tích nguyên nhân gốc của lỗi lặp lại (thanh điệu tiếng Trung, cách danh từ tiếng Nga, cấu trúc tiếng Anh).', languages: ['zh', 'en', 'ru'] },
  { slug: 'meaning-equivalence', code: 'INT-06', nameVi: 'Meaning Equivalence Engine', descriptionVi: 'Phân tích tương đương ý nghĩa, sắc thái, văn phong và ngữ cảnh giữa tiếng Việt và ba ngôn ngữ học tập.', languages: ['zh', 'en', 'ru'] },
  { slug: 'language-timeline', code: 'INT-07', nameVi: 'Language Timeline', descriptionVi: 'Theo dõi tiến bộ theo thời gian, kỹ năng, kết quả và khả năng duy trì kiến thức.', languages: ['zh', 'en', 'ru'] },
  { slug: 'pronunciation-lab', code: 'INT-08', nameVi: 'Universal Pronunciation Lab', descriptionVi: 'Đánh giá phát âm theo đặc trưng âm vị của tiếng Trung, tiếng Anh và tiếng Nga.', languages: ['zh', 'en', 'ru'] },
  { slug: 'knowledge-graph', code: 'INT-09', nameVi: 'Multi-Language Knowledge Graph', descriptionVi: 'Đồ thị tri thức liên kết khái niệm, từ vựng và ngữ pháp giữa ba ngôn ngữ.', languages: ['zh', 'en', 'ru'] },
  { slug: 'personal-corpus', code: 'INT-10', nameVi: 'Personal Language Corpus', descriptionVi: 'Kho ngữ liệu cá nhân, hỗ trợ phân tích từ vựng, cấu trúc và lỗi ngôn ngữ.', languages: ['zh', 'en', 'ru'] },
  { slug: 'context-reconstruction', code: 'INT-11', nameVi: 'Context Reconstruction', descriptionVi: 'Tái dựng bối cảnh, ý định giao tiếp, vai vế, sắc thái và ngữ dụng.', languages: ['zh', 'en', 'ru'] },
  { slug: 'comprehension-depth', code: 'INT-12', nameVi: 'Comprehension Depth Test', descriptionVi: 'Đánh giá bốn tầng hiểu: Literal, Inferential, Pragmatic, Critical.', languages: ['zh', 'en', 'ru'] },
  { slug: 'learning-recovery', code: 'INT-13', nameVi: 'Learning Recovery System', descriptionVi: 'Phát hiện kiến thức có nguy cơ quên và đề xuất kế hoạch ôn tập.', languages: ['zh', 'en', 'ru'] },
  { slug: 'language-quality', code: 'INT-14', nameVi: 'Language Quality Benchmark', descriptionVi: 'Đánh giá độ chính xác, tự nhiên, mạch lạc và phù hợp văn phong.', languages: ['zh', 'en', 'ru'] },
  { slug: 'language-observatory', code: 'INT-15', nameVi: 'Personal Language Observatory', descriptionVi: 'Trung tâm tổng hợp kết quả và đề xuất bước học tiếp theo.', languages: ['zh', 'en', 'ru'] },
]);

export const ADMIN_CENTERS = Object.freeze([
  { id: 'overview', nameVi: 'Tổng quan', route: '/quan-tri' },
  { id: 'accounts', nameVi: 'Tài khoản', route: '/quan-tri/accounts' },
  { id: 'staff', nameVi: 'Nhân sự & Phân quyền', route: '/quan-tri/staff' },
  { id: 'academic', nameVi: 'Học thuật & Nội dung', route: '/quan-tri/academic' },
  { id: 'data', nameVi: 'Dữ liệu & Lưu trữ', route: '/quan-tri/data' },
  { id: 'security', nameVi: 'Bảo mật & Kiểm toán', route: '/quan-tri/security' },
  { id: 'operations', nameVi: 'Vận hành & Hỗ trợ', route: '/quan-tri/operations' },
]);
