/**
 * WORD BRIDGE — Canonical Product Constants & Hard Boundaries
 * Enforces Master Specification V3.0 decisions across Backend, API, Frontend & Admin.
 */

export const BRAND = Object.freeze({
  name: 'WORD BRIDGE',
  tagline: 'Where Languages Bring People Together.',
  websiteUrl: 'https://www.wordbridge.vn',
  pdfReaderUrl: 'https://reader.wordbridge.vn',
  copyright: '© 2026 WORD BRIDGE. All rights reserved.',
  colors: {
    deepTeal: '#146466',
    vermilionRed: '#C92F1C',
    aqua: '#5AABA9',
    warmIvory: '#E2E2C4',
  },
});

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

export const SPECIALIZED_DOMAINS = Object.freeze([
  { slug: 'logistics', nameVi: 'Logistics', languages: ['zh', 'en'] },
  { slug: 'business', nameVi: 'Thương mại', languages: ['zh'] },
  { slug: 'import-export', nameVi: 'Xuất nhập khẩu', languages: ['zh', 'en'] },
  { slug: 'it-cloud', nameVi: 'Công nghệ thông tin và Cloud', languages: ['en'] },
  { slug: 'mechanical-engineering', nameVi: 'Cơ khí', languages: ['zh', 'en'] },
  { slug: 'electrical-electronics', nameVi: 'Điện – điện tử', languages: ['zh', 'en'] },
  { slug: 'automotive', nameVi: 'Ô tô', languages: ['en'] },
  { slug: 'economics-tourism', nameVi: 'Kinh tế – du lịch', languages: ['en'] },
  { slug: 'graphic-design', nameVi: 'Thiết kế đồ họa', languages: ['en'] },
  { slug: 'healthcare', nameVi: 'Điều dưỡng – y dược', languages: ['en'] },
]);

export const RBAC_ROLES = Object.freeze([
  { code: 'super_admin', nameVi: 'Super Admin', descriptionVi: 'Toàn quyền quản trị hệ thống, phân quyền và cấu hình lõi.' },
  { code: 'platform_admin', nameVi: 'Quản trị nền tảng', descriptionVi: 'Quản lý tài khoản, ngôn ngữ, cấu hình vận hành nền tảng.' },
  { code: 'academic_admin', nameVi: 'Quản trị học thuật', descriptionVi: 'Quản lý chương trình, giáo trình, khóa học, từ điển và chuyên ngành.' },
  { code: 'editor', nameVi: 'Biên tập viên', descriptionVi: 'Soạn thảo và cập nhật học liệu, bài học, từ vựng và ngữ pháp.' },
  { code: 'reviewer', nameVi: 'Kiểm duyệt viên', descriptionVi: 'Rà soát, hiệu đính và phê duyệt học thuật trước khi phát hành.' },
  { code: 'exam_admin', nameVi: 'Quản trị khảo thí', descriptionVi: 'Quản lý ngân hàng câu hỏi, đề thi, thang điểm và kết quả khảo thí.' },
  { code: 'data_admin', nameVi: 'Quản trị dữ liệu', descriptionVi: 'Theo dõi D1, R2, sao lưu, phục hồi và tính toàn vẹn dữ liệu.' },
  { code: 'security_admin', nameVi: 'Quản trị bảo mật', descriptionVi: 'Quản lý nhật ký kiểm toán, phiên đăng nhập, khóa tài khoản và cảnh báo.' },
  { code: 'support_admin', nameVi: 'Quản trị hỗ trợ', descriptionVi: 'Tiếp nhận và phản hồi yêu cầu CSKH, hỗ trợ người học và liên hệ.' },
]);

export const PLANS = Object.freeze({
  PERSONAL_FREE: {
    code: 'PERSONAL_FREE',
    nameVi: 'Thành viên FREE',
    storageQuotaBytes: 1073741824, // 1 GB/account (verified from prior decision)
    priceStatus: 'Miễn phí',
  },
  PERSONAL_PLUS: {
    code: 'PERSONAL_PLUS',
    nameVi: 'Thành viên',
    storageQuotaBytes: 5368709120, // 5 GB/account (verified from prior decision)
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
  { id: 'editorial', nameVi: 'Trung tâm biên tập học liệu', route: '/admin/lessons' },
  { id: 'examination', nameVi: 'Trung tâm quản trị khảo thí', route: '/admin/examinations' },
  { id: 'intelligence', nameVi: 'Trung tâm trí tuệ học tập', route: '/admin/language-intelligence' },
  { id: 'multilingual', nameVi: 'Trung tâm đa ngôn ngữ', route: '/admin/languages' },
  { id: 'quality', nameVi: 'Trung tâm chất lượng ngôn ngữ', route: '/admin/dictionary' },
  { id: 'security', nameVi: 'Trung tâm bảo mật và kiểm toán', route: '/admin/audit-logs' },
  { id: 'infrastructure', nameVi: 'Trung tâm vận hành hạ tầng', route: '/admin/infrastructure' },
]);
