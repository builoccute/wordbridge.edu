import { LegalPolicyService, renderFullPolicyHtml } from "./modules/legal-policies.js";
import { OAuthService } from "./modules/oauth-service.js";
import { AdminPinService, buildAdminSessionCookie, clearAdminSessionCookie, renderAdminBootstrapPage, renderAdminLoginPage, renderAdminPinLockPage, renderAdminCenterHtml } from "./modules/admin-pin-pages.js";
import { LanguageServicesAdapter } from "./modules/language-api-adapters.js";
import { CHINESE_FOUNDATION_22, ENGLISH_FOUNDATION_22, SPECIALIZED_100_DOMAINS, CONTACT_CATEGORIES_12, renderContactPageV42, renderSessionInvalidContent, renderErrorSystemHubHtml, renderErrorWaveSvg } from "./modules/academic-catalog.js";
import { searchVocabV5, getVocabV5EntryById, toDictionaryNotebookPayload } from "./modules/vocab-v5-service.js";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });


function safeJsonParse(raw, fallback = null) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(String(raw)); } catch { return fallback; }
}

// src/config/constants.js
var BRAND = Object.freeze({
  name: "WORD BRIDGE",
  tagline: "Where Languages Bring People Together.",
  websiteUrl: "https://wordbridge.io.vn",
  readerPath: "/reader",
  helpPath: "/help",
  copyright: "© 2026 WORD BRIDGE. All rights reserved.",
  colors: {
    deepTeal: "#146466",
    vermilionRed: "#C92F1C",
    aqua: "#5AABA9",
    warmIvory: "#E2E2C4"
  }
});
var ECOSYSTEM = Object.freeze({
  main: "https://wordbridge.io.vn"
});
var ALLOWED_RETURN_ORIGINS = Object.freeze([
  ECOSYSTEM.main
]);
function normalizeUiLocale(locale) {
  return String(locale || "").trim().toLowerCase() === "en" ? "en" : "vi";
}
__name(normalizeUiLocale, "normalizeUiLocale");
var TRANSLATIONS = Object.freeze({
  vi: Object.freeze({
    siteTitle: "WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh",
    login: "Đăng nhập",
    register: "Đăng ký",
    logout: "Đăng xuất",
    search: "Tìm kiếm",
    learning: "Học tập",
    practice: "Cổng Luyện Tập",
    dictionary: "Từ điển",
    specialized: "Chuyên ngành",
    reader: "Thư viện đọc",
    help: "Trung tâm trợ giúp",
    authGateTitle: "Đăng nhập để tiếp tục",
    authGateBody: "Hành động này cần tài khoản. Sau đăng nhập, WORD BRIDGE sẽ quay lại trang hiện tại."
  }),
  en: Object.freeze({
    siteTitle: "WORD BRIDGE — Chinese, English Language Platform",
    login: "Sign in",
    register: "Register",
    logout: "Sign out",
    search: "Search",
    learning: "Learning",
    practice: "Practice Center",
    dictionary: "Dictionary",
    specialized: "Specialized",
    reader: "Reader Library",
    help: "Help Center",
    authGateTitle: "Sign in to continue",
    authGateBody: "This action requires an account. After sign-in, WORD BRIDGE returns to the current page with a safe intent."
  })
});
function safeReturnUrl(input = "/", baseOrigin = ECOSYSTEM.main) {
  const fallback = "/";
  const raw = String(input || "").trim();
  if (!raw) return fallback;
  try {
    if (raw.startsWith("/") && !raw.startsWith("//")) {
      const parsed2 = new URL(raw, baseOrigin);
      if (parsed2.origin === baseOrigin) return `${parsed2.pathname}${parsed2.search}${parsed2.hash}`;
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
__name(safeReturnUrl, "safeReturnUrl");
function signInUrl(nextPath = "/", intent = "", locale = "") {
  const safeNext = safeReturnUrl(nextPath, ECOSYSTEM.main);
  const params = new URLSearchParams();
  params.set("next", safeNext);
  if (intent) params.set("intent", String(intent));
  if (locale) params.set("locale", normalizeUiLocale(locale));
  return `/login?${params.toString()}`;
}
__name(signInUrl, "signInUrl");
var OFFICIAL_LANGUAGES = Object.freeze({
  zh: {
    code: "zh",
    slug: "chinese",
    nameVi: "Tiếng Trung",
    nativeName: "中文",
    hasGeneral: true,
    hasSpecialized: true,
    framework: "HSK 1–6 & HSK 7–9",
    scriptSystem: "Chữ Hán giản thể (và phồn thể theo chương trình)",
    phoneticSystem: "Pinyin, 4 thanh điệu + thanh nhẹ, bộ thủ"
  },
  en: {
    code: "en",
    slug: "english",
    nameVi: "Tiếng Anh",
    nativeName: "English",
    hasGeneral: true,
    hasSpecialized: true,
    framework: "CEFR A1–C2 (tham chiếu IELTS, TOEFL, Cambridge)",
    scriptSystem: "Chữ Latin",
    phoneticSystem: "IPA, trọng âm từ, trọng âm câu, ngữ điệu"
  }
});
var ALLOWED_LANGUAGE_CODES = Object.freeze(["zh", "en"]);
var SPECIALIZED_LANGUAGE_CODES = Object.freeze(["zh", "en"]);
var SPECIALIZED_VOCAB_DATASETS = Object.freeze([
  { slug: "ke-toan-doanh-nghiep", nameVi: "Kế toán Doanh nghiệp", languages: ["en", "zh"], count: 3000, enCount: 1500, zhCount: 1500, authoredCount: 1000, sample: "balance sheet, general ledger, 合并资产负债表, audit trail" },
  { slug: "quan-tri-mang-may-tinh", nameVi: "Quản trị Mạng Máy tính", languages: ["en", "zh"], count: 3000, enCount: 1500, zhCount: 1500, authoredCount: 1000, sample: "subnet mask, firewall, 边界网关路由, zero-trust segmentation" },
  { slug: "cong-nghe-o-to", nameVi: "Công nghệ Ô tô", languages: ["en", "zh"], count: 3000, enCount: 1500, zhCount: 1500, authoredCount: 1000, sample: "internal combustion engine, BMS, 动力电池管理系统, ABS" },
  { slug: "ky-thuat-may-lanh-dhkk", nameVi: "Kỹ thuật Máy lạnh & ĐHKK", languages: ["en", "zh"], count: 3000, enCount: 1500, zhCount: 1500, authoredCount: 1000, sample: "refrigeration cycle, VRF, 离心式冷水机组, ASHRAE" },
  { slug: "sua-chua-lap-rap-may-tinh", nameVi: "Sửa chữa & Lắp ráp Máy tính", languages: ["en", "zh"], count: 3012, enCount: 1512, zhCount: 1500, authoredCount: 1000, sample: "motherboard, BIOS/UEFI, 供电调节模块VRM, NVMe" },
  { slug: "thiet-ke-do-hoa", nameVi: "Thiết kế Đồ họa", languages: ["en", "zh"], count: 3017, enCount: 1517, zhCount: 1500, authoredCount: 1000, sample: "typography, design tokens, 国际色彩配置文件, WCAG" },
  { slug: "dien-cong-nghiep", nameVi: "Điện Công nghiệp", languages: ["en", "zh"], count: 3012, enCount: 1512, zhCount: 1500, authoredCount: 1000, sample: "circuit breaker, VFD, 中压真空断路器, LOTO" },
  { slug: "dien-tu-cong-nghiep", nameVi: "Điện tử Công nghiệp", languages: ["en", "zh"], count: 3015, enCount: 1515, zhCount: 1500, authoredCount: 1000, sample: "microcontroller, SiC MOSFET, 电磁兼容屏蔽设计, FPGA" },
  { slug: "co-dien-tu", nameVi: "Cơ Điện tử", languages: ["en", "zh"], count: 3023, enCount: 1523, zhCount: 1500, authoredCount: 1000, sample: "PLC, EtherCAT, 六轴关节工业机器人, Digital Twin" },
  { slug: "cat-got-kim-loai", nameVi: "Cắt gọt Kim loại", languages: ["en", "zh"], count: 3005, enCount: 1505, zhCount: 1500, authoredCount: 1000, sample: "metal cutting, GD&T, 五轴联动数控铣削, CMM" },
  { slug: "nguoi-sua-chua-may-cong-cu", nameVi: "Nguội Sửa chữa Máy công cụ", languages: ["en", "zh"], count: 3013, enCount: 1513, zhCount: 1500, authoredCount: 1000, sample: "bench work, ISO 230, 激光干涉仪螺距误差补偿, backlash" },
  { slug: "bao-tri-thiet-bi-co-dien", nameVi: "Bảo trì Thiết bị Cơ điện", languages: ["en", "zh"], count: 3007, enCount: 1507, zhCount: 1500, authoredCount: 1000, sample: "preventive maintenance, RCM, 快速傅里叶振动频谱, ISO 55000" }
]);
var SPECIALIZED_EXTRA_DATASETS = Object.freeze([
  { slug: "logistics", nameVi: "Logistics", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "bill of lading, demurrage, 提单, 滞期费" },
  { slug: "business", nameVi: "Thương mại", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "commercial contract, 不可抗力条款, NDA" },
  { slug: "import-export", nameVi: "Xuất nhập khẩu", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "letter of credit, 信用证, commercial invoice" },
  { slug: "it-cloud", nameVi: "Công nghệ thông tin và Cloud", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "cloud-native, 云原生架构, API gateway" },
  { slug: "mechanical-engineering", nameVi: "Cơ khí", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "mechanical tolerance, 机械加工公差, FEA" },
  { slug: "electrical-electronics", nameVi: "Điện – điện tử", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "three-phase transformer, 三相电力变压器, PCB" },
  { slug: "automotive", nameVi: "Ô tô", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "powertrain, 动力总成架构, ABS, ECU" },
  { slug: "economics-tourism", nameVi: "Kinh tế – du lịch", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "GDP, 宏观经济指标, occupancy rate, MICE" },
  { slug: "graphic-design", nameVi: "Thiết kế Đồ họa (Mở rộng)", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "visual hierarchy, 视觉层级, WCAG, CMYK" },
  { slug: "healthcare", nameVi: "Điều dưỡng – y dược", languages: ["zh", "en"], count: 1000, enCount: 500, zhCount: 500, sample: "vital signs, 生命体征监测, SpO2, GMP" }
]);
var SPECIALIZED_DOMAINS = Object.freeze([
  ...SPECIALIZED_VOCAB_DATASETS,
  ...SPECIALIZED_EXTRA_DATASETS
]);
var RBAC_ROLES = Object.freeze([
  { code: "super_admin", nameVi: "Super Admin", descriptionVi: "Toàn quyền quản trị tối cao toàn nền tảng, phân quyền và cấu hình lõi." },
  { code: "platform_admin", nameVi: "Quản trị viên", descriptionVi: "Quản lý tài khoản, ngôn ngữ, cấu hình vận hành nền tảng." },
  { code: "academic_admin", nameVi: "Quản trị học thuật", descriptionVi: "Quản lý chương trình, giáo trình, khóa học, bài học, từ điển và chuyên ngành." },
  { code: "editor", nameVi: "Biên tập viên", descriptionVi: "Soạn thảo và cập nhật học liệu, bài học, tài liệu Reader, từ vựng và ngữ pháp." },
  { code: "reviewer", nameVi: "Kiểm duyệt viên", descriptionVi: "Rà soát, hiệu đính và phê duyệt học thuật trước khi phát hành." },
  { code: "support_admin", nameVi: "Nhân sự hỗ trợ", descriptionVi: "Tiếp nhận, phản hồi và quản lý yêu cầu hỗ trợ người học và liên hệ." },
  { code: "data_admin", nameVi: "Quản trị dữ liệu", descriptionVi: "Theo dõi Cloudflare D1, R2, sao lưu, khôi phục và kiểm tra tính toàn vẹn dữ liệu." },
  { code: "security_admin", nameVi: "Quản trị bảo mật", descriptionVi: "Quản lý nhật ký đăng nhập, nhật ký kiểm toán, phiên đăng nhập và bảo vệ hệ thống." }
]);
var ADMIN_ROLE_CODES = Object.freeze(new Set(RBAC_ROLES.map((r) => r.code)));
var PLANS = Object.freeze({
  PERSONAL_FREE: {
    code: "PERSONAL_FREE",
    nameVi: "Thành viên FREE",
    storageQuotaBytes: 1073741824,
    // 1 GB/account
    priceStatus: "Miễn phí"
  },
  PERSONAL_PLUS: {
    code: "PERSONAL_PLUS",
    nameVi: "Thành viên",
    storageQuotaBytes: 5368709120,
    // 5 GB/account
    priceStatus: "BLOCKED — Chờ xác nhận bảng giá chính thức",
    studentBenefitMonths: 3,
    studentBenefitVerification: "school_email_only"
  }
});
var INTELLIGENCE_SYSTEMS = Object.freeze([
  { slug: "language-dna", code: "INT-01", nameVi: "Language DNA", descriptionVi: "Bản đồ năng lực ngôn ngữ nhiều chiều (từ vựng, ngữ pháp, ngữ âm, ngữ dụng, độ trôi chảy, độ hiểu sâu).", languages: ["zh", "en"] },
  { slug: "language-transfer-lab", code: "INT-02", nameVi: "Language Transfer Lab", descriptionVi: "Phân tích chuyển giao tích cực và tiêu cực giữa tiếng Việt với tiếng Trung, tiếng Anh.", languages: ["zh", "en"] },
  { slug: "knowledge-to-language", code: "INT-03", nameVi: "Knowledge-to-Language", descriptionVi: "Học kiến thức chuyên ngành bằng ngoại ngữ (chỉ áp dụng tiếng Trung và tiếng Anh).", languages: ["zh", "en"] },
  { slug: "real-world-simulator", code: "INT-04", nameVi: "Real-World Language Simulator", descriptionVi: "Mô phỏng tình huống giao tiếp nhiều bước, nhiều lựa chọn và nhiều kết quả.", languages: ["zh", "en"] },
  { slug: "language-error-genome", code: "INT-05", nameVi: "Language Error Genome", descriptionVi: "Phân tích nguyên nhân gốc của lỗi lặp lại (thanh điệu tiếng Trung, cấu trúc tiếng Anh).", languages: ["zh", "en"] },
  { slug: "meaning-equivalence", code: "INT-06", nameVi: "Meaning Equivalence Engine", descriptionVi: "Phân tích tương đương ý nghĩa, sắc thái, văn phong và ngữ cảnh giữa tiếng Việt và hai ngôn ngữ học tập.", languages: ["zh", "en"] },
  { slug: "language-timeline", code: "INT-07", nameVi: "Language Timeline", descriptionVi: "Theo dõi tiến bộ theo thời gian, kỹ năng, kết quả và khả năng duy trì kiến thức.", languages: ["zh", "en"] },
  { slug: "pronunciation-lab", code: "INT-08", nameVi: "Universal Pronunciation Lab", descriptionVi: "Đánh giá phát âm theo đặc trưng âm vị của tiếng Trung, tiếng Anh.", languages: ["zh", "en"] },
  { slug: "knowledge-graph", code: "INT-09", nameVi: "Multi-Language Knowledge Graph", descriptionVi: "Đồ thị tri thức liên kết khái niệm, từ vựng và ngữ pháp giữa hai ngôn ngữ.", languages: ["zh", "en"] },
  { slug: "personal-corpus", code: "INT-10", nameVi: "Personal Language Corpus", descriptionVi: "Kho ngữ liệu cá nhân, hỗ trợ phân tích từ vựng, cấu trúc và lỗi ngôn ngữ.", languages: ["zh", "en"] },
  { slug: "context-reconstruction", code: "INT-11", nameVi: "Context Reconstruction", descriptionVi: "Tái dựng bối cảnh, ý định giao tiếp, vai vế, sắc thái và ngữ dụng.", languages: ["zh", "en"] },
  { slug: "comprehension-depth", code: "INT-12", nameVi: "Comprehension Depth Test", descriptionVi: "Đánh giá bốn tầng hiểu: Literal, Inferential, Pragmatic, Critical.", languages: ["zh", "en"] },
  { slug: "learning-recovery", code: "INT-13", nameVi: "Learning Recovery System", descriptionVi: "Phát hiện kiến thức có nguy cơ quên và đề xuất kế hoạch ôn tập.", languages: ["zh", "en"] },
  { slug: "language-quality", code: "INT-14", nameVi: "Language Quality Benchmark", descriptionVi: "Đánh giá độ chính xác, tự nhiên, mạch lạc và phù hợp văn phong.", languages: ["zh", "en"] },
  { slug: "language-observatory", code: "INT-15", nameVi: "Personal Language Observatory", descriptionVi: "Trung tâm tổng hợp kết quả và đề xuất bước học tiếp theo.", languages: ["zh", "en"] }
]);
var ADMIN_CENTERS = Object.freeze([
  { id: "overview", nameVi: "Tổng quan", route: "/quan-tri" },
  { id: "accounts", nameVi: "Tài khoản", route: "/quan-tri/accounts" },
  { id: "staff", nameVi: "Nhân sự & Phân quyền", route: "/quan-tri/staff" },
  { id: "academic", nameVi: "Học thuật & Nội dung", route: "/quan-tri/academic" },
  { id: "data", nameVi: "Dữ liệu & Lưu trữ", route: "/quan-tri/data" },
  { id: "security", nameVi: "Bảo mật & Kiểm toán", route: "/quan-tri/security" },
  { id: "operations", nameVi: "Vận hành & Hỗ trợ", route: "/quan-tri/operations" }
]);

// src/utils/validation.js
function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");
function normalizeLanguageCode(input) {
  if (!input) return null;
  const map = {
    zh: "zh",
    chinese: "zh",
    "tieng-trung": "zh",
    en: "en",
    english: "en",
    "tieng-anh": "en"
  };
  const key = String(input).trim().toLowerCase();
  return Object.hasOwn(map, key) ? map[key] : null;
}
__name(normalizeLanguageCode, "normalizeLanguageCode");
function assertOfficialLanguage(code) {
  const normalized = normalizeLanguageCode(code);
  if (!normalized || !ALLOWED_LANGUAGE_CODES.includes(normalized)) {
    throw new Error("Ngôn ngữ không thuộc phạm vi chính thức của WORD BRIDGE (chỉ hỗ trợ Tiếng Trung [zh], Tiếng Anh [en]).");
  }
  return normalized;
}
__name(assertOfficialLanguage, "assertOfficialLanguage");
function assertSpecializedLanguage(code) {
  const normalized = assertOfficialLanguage(code);
  if (!SPECIALIZED_LANGUAGE_CODES.includes(normalized)) {
    throw new Error("Ngoại ngữ chuyên ngành chỉ áp dụng cho Tiếng Trung (zh) và Tiếng Anh (en).");
  }
  return normalized;
}
__name(assertSpecializedLanguage, "assertSpecializedLanguage");
function validateEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) && trimmed.length <= 254;
}
__name(validateEmail, "validateEmail");
function isAcademicSchoolEmail(email) {
  if (!validateEmail(email)) return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  const consumerDomains = /* @__PURE__ */ new Set([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "live.com",
    "msn.com",
    "zoho.com"
  ]);
  if (consumerDomains.has(domain)) return false;
  return domain.endsWith(".edu") || domain.endsWith(".edu.vn") || domain.includes(".edu.") || domain.endsWith(".ac.uk") || domain.endsWith(".ac.jp") || domain.endsWith(".ac.vn") || domain.includes(".ac.") || domain.endsWith(".university") || domain.includes("student.") || domain.includes("sv.");
}
__name(isAcademicSchoolEmail, "isAcademicSchoolEmail");
function validateRegistrationPayload(payload) {
  const errors = [];
  const fullName = String(payload?.fullName ?? "").trim();
  const dateOfBirth = String(payload?.dateOfBirth ?? "").trim();
  const phoneNumber = String(payload?.phoneNumber ?? "").trim();
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const password = String(payload?.password ?? "");
  const confirmPassword = String(payload?.confirmPassword ?? "");
  const schoolName = String(payload?.schoolName ?? "").trim();
  const workplaceName = String(payload?.workplaceName ?? "").trim();
  if (fullName.length < 2 || fullName.length > 120) errors.push("Họ và tên phải từ 2 đến 120 ký tự.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) errors.push("Ngày sinh phải đúng định dạng YYYY-MM-DD.");
  if (!/^[0-9+\-\s()]{8,20}$/.test(phoneNumber)) errors.push("Số điện thoại không hợp lệ (8–20 ký tự số).");
  if (!validateEmail(email)) errors.push("Địa chỉ email không hợp lệ.");
  if (password.length < 10) errors.push("Mật khẩu phải có tối thiểu 10 ký tự.");
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push("Mật khẩu phải gồm chữ hoa, chữ thường và chữ số.");
  }
  if (password !== confirmPassword) errors.push("Xác nhận mật khẩu không khớp.");
  if (schoolName.length < 2 && workplaceName.length < 2) errors.push("Vui lòng cung cấp ít nhất một thông tin (tối thiểu 2 ký tự): Trường học hoặc Nơi làm việc / tổ chức.");
  return {
    valid: errors.length === 0,
    errors,
    data: { fullName, dateOfBirth, phoneNumber, email, password, schoolName, workplaceName }
  };
}
__name(validateRegistrationPayload, "validateRegistrationPayload");
function validatePasswordStrength(password) {
  const pwd = String(password || "");
  if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    return {
      valid: false,
      error: "Mật khẩu phải có tối thiểu 10 ký tự gồm chữ hoa, chữ thường và chữ số."
    };
  }
  return { valid: true };
}
__name(validatePasswordStrength, "validatePasswordStrength");

// src/utils/http.js
var SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
});
function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}
__name(htmlResponse, "htmlResponse");
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(code, message, status = 400, details = void 0) {
  return jsonResponse({
    ok: false,
    error: { code, message, ...details ? { details } : {} }
  }, status);
}
__name(errorResponse, "errorResponse");
function redirectResponse(location, status = 302, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}
__name(redirectResponse, "redirectResponse");
function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      try {
        cookies[k] = decodeURIComponent(v);
      } catch {
        cookies[k] = v;
      }
    }
  }
  return cookies;
}
__name(parseCookies, "parseCookies");
function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 7, isSecure = true) {
  const parts = [
    `wb_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isSecure) parts.push("Secure");
  return parts.join("; ");
}
__name(buildSessionCookie, "buildSessionCookie");
function clearSessionCookie(isSecure = true) {
  return buildSessionCookie("", 0, isSecure);
}
__name(clearSessionCookie, "clearSessionCookie");

// src/layouts/site-layout.js
var NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  reader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 1.9"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
var PUBLIC_NAV_ITEMS = [
  { label: "Trang chủ", href: "/", icon: NAV_ICONS.home },
  { label: "Học tập", href: "/learning", icon: NAV_ICONS.learn },
  { label: "Thư viện đọc", href: "/reader", icon: NAV_ICONS.reader },
  { label: "Cổng Luyện Tập", href: "/practice", icon: NAV_ICONS.practice },
  { label: "Trung Tâm Trợ Giúp", href: "/help", icon: NAV_ICONS.help }
];
function renderBrandLogo() {
  return `<a href="/" class="wb-brand" aria-label="${escapeHtml(BRAND.name)}">
    <img src="/branding/logo-wordbridge.svg" alt="${escapeHtml(BRAND.name)}" style="height:44px;width:auto;border-radius:6px;" />
  </a>`;
}
__name(renderBrandLogo, "renderBrandLogo");
function renderPublicPage({
  title,
  description = "",
  currentPath = "/",
  breadcrumbs = [],
  user = null,
  contentHtml = "",
  runtime = null
}) {
  const s = runtime?.settings || {};
  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}" />` : "";
  const banner = runtime?.site?.announcement_banner ? `<div class="wb-banner">${escapeHtml(runtime.site.announcement_banner)}</div>` : "";
  const navHtml = PUBLIC_NAV_ITEMS.map((item) => {
    const active = currentPath === item.href || (item.href !== "/" && !item.href.startsWith("http") && currentPath.startsWith(item.href)) || (item.href === "/learning" && /^\/(?:skills|vocabulary|my-knowledge|my-learning|courses|programs|weeks|lessons)(?:\/|$)/.test(currentPath)) || (item.href === "/practice" && currentPath === "/my-mistakes");
    return `<a href="${escapeHtml(item.href)}" class="${active ? "active" : ""}">${item.icon}<span>${escapeHtml(item.label)}</span></a>`;
  }).join("");
  const crumbHtml = breadcrumbs.length ? `<nav aria-label="Breadcrumb" style="font-size:0.84rem;margin-bottom:14px;color:var(--wb-text-muted);">${breadcrumbs.map((c, i) => c.href && i < breadcrumbs.length - 1 ? `<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a> › ` : `<span>${escapeHtml(c.label)}</span>`).join("")}</nav>` : "";
  const loginHref = signInUrl(currentPath.startsWith("http") ? "/" : currentPath, "header.login");
  const authActions = user ? `
       <a href="/profile" class="wb-btn wb-btn-outline wb-btn-sm wb-hide-mobile">${escapeHtml(user.fullName || user.email)}</a>
       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-logout>Đăng xuất</button>` : `
       <a href="${escapeHtml(loginHref)}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>
       <a href="/register" class="wb-btn wb-btn-accent wb-btn-sm wb-hide-mobile">Đăng ký</a>`;
  const footerSlogan = s.footer_slogan || "WORD BRIDGE – Kết nối tri thức, mở rộng thế giới ngôn ngữ";
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | ${escapeHtml(BRAND.name)}</title>
  <meta name="description" content="${escapeHtml(description || "WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh thống nhất tại wordbridge.io.vn.")}" />
  <link rel="canonical" href="${escapeHtml(BRAND.websiteUrl)}${escapeHtml(currentPath.startsWith("/") ? currentPath : "/")}" />
  <link rel="icon" type="image/png" href="/branding/favicon.png" />
  ${csrfMeta}
  <meta name="wb-build" content="v5.3.0-17screens-emailcenter" />
  <link rel="stylesheet" href="/styles/design-system.css?v=5.3.0" />
</head>
<body data-wb-authenticated="${user ? "true" : "false"}">
  ${banner}
  <header class="wb-header">
    <div class="wb-container wb-header-inner">
      ${renderBrandLogo()}
      <nav class="wb-nav" id="wb-main-nav" aria-label="Điều hướng chính">${navHtml}</nav>
      <div class="wb-header-actions">
        ${authActions}
        <button type="button" class="wb-menu-toggle" data-wb-menu-toggle aria-label="Mở menu">${NAV_ICONS.menu}</button>
      </div>
    </div>
  </header>
  <main class="wb-main">
    <div class="wb-container">
      ${crumbHtml}
      <div id="wb-global-status" role="status" aria-live="polite"></div>
      ${contentHtml}
    </div>
  </main>
  <footer class="wb-footer-v4">
    <div class="wb-container">
      <div class="wb-footer-v4-grid">
        <div>
          <div class="wb-footer-logo-pill">
            <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" />
          </div>
          <p style="font-size:0.88rem;margin:0 0 10px;color:#E2F6F6;">Nền tảng học ngôn ngữ và kết nối người học toàn cầu</p>
          <div style="width:42px;height:3px;background:#CB0203;border-radius:2px;margin-bottom:10px;"></div>
          <div class="wb-footer-lang-pills">
            <span class="wb-footer-lang-pill"><strong style="color:#FF6B6B;">ZH</strong> Tiếng Trung</span>
            <span class="wb-footer-lang-pill"><strong style="color:#63B3FF;">EN</strong> Tiếng Anh</span>
          </div>
        </div>

        <div class="wb-footer-col">
          <h4>Học tập & Chương trình</h4>
          <ul>
            <li><a href="/learning">› Chương trình học</a></li>
            <li><a href="/learning/path">› Lộ trình học tập</a></li>
            <li><a href="/specialized">› Ngoại ngữ Chuyên ngành</a></li>
            <li><a href="/reader">› Thư Viện Đọc</a></li>
            <li><a href="/dictionary">› Từ điển Ngôn ngữ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Luyện tập & Kết nối</h4>
          <ul>
            <li><a href="/practice">› Cổng Luyện Tập</a></li>
            <li><a href="/vocabulary/flashcards">› Flashcards & Ôn tập</a></li>
            <li><a href="/my-knowledge">› My Knowledge</a></li>
            <li><a href="/intelligence">› Trí tuệ Ngôn ngữ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Hỗ trợ & Thông tin</h4>
          <ul>
            <li><a href="/help">› Trung Tâm Trợ Giúp</a></li>
            <li><a href="/faq">› Câu hỏi thường gặp</a></li>
            <li><a href="/about">› Giới thiệu nền tảng</a></li>
            <li><a href="/contact">› Liên hệ hỗ trợ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col"><h4>Chính sách</h4><ul><li><a href="/policies/terms">Điều khoản sử dụng</a></li><li><a href="/policies/privacy">Quyền riêng tư</a></li></ul></div>
      </div>

      <div class="wb-footer-glow-art">
        <img src="/branding/footer-glow-book.jpg" alt="WORD BRIDGE Global Knowledge" />
      </div>
    </div>

    <div class="wb-footer-bottom-bar">
      <div class="wb-container wb-footer-bottom-inner">
        <div><span style="color:#3DA2A0;font-weight:900;margin-right:8px;">|</span><strong>${escapeHtml(footerSlogan)}</strong></div>
        <div style="opacity:0.85;">© 2026 WORD BRIDGE. All rights reserved.</div>
      </div>
    </div>
  </footer>

  <dialog id="wb-auth-gate" class="wb-auth-gate" aria-labelledby="wb-auth-gate-title">
    <div class="wb-card" style="margin:0;max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;">
        <h3 id="wb-auth-gate-title" style="margin:0;color:var(--wb-teal);">Đăng nhập để tiếp tục</h3>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm wb-dialog-close" data-wb-auth-gate-close aria-label="Đóng">${NAV_ICONS.close}</button>
      </div>
      <p id="wb-auth-gate-message" class="wb-muted" style="margin:0 0 16px;">Hành động này cần tài khoản. Sau đăng nhập, WORD BRIDGE sẽ quay lại trang hiện tại.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-auth-gate-close>Hủy</button>
        <a id="wb-auth-gate-cta" href="${escapeHtml(loginHref)}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập ngay</a>
      </div>
    </div>
  </dialog>

  <div id="wb-toast-root" aria-live="polite"></div>
  <script src="/scripts/i18n.js?v=5.3.0" defer></script>
  <script src="/scripts/app.js?v=5.3.0" defer></script>
</body>
</html>`;
}
__name(renderPublicPage, "renderPublicPage");

// src/pages/skill-cards.js
var cardSkills = Object.freeze({ grammar: "Ngữ pháp", listening: "Nghe", speaking: "Nói", reading: "Đọc", writing: "Viết" });
async function renderSkillCards({ db, user, skill, url }) {
  const language = url.searchParams.get("language") === "en" ? "en" : "zh";
  const path = "/flashcards/" + skill;
  const rows = ({ results: await safeQueryAll(db, `SELECT l.id,l.slug,l.title_vi,l.components_json,r.remembered,r.response_text
    FROM wb_public_lessons l LEFT JOIN wb_skill_reviews r ON r.lesson_id=l.id AND r.account_id=? AND r.skill=?
    WHERE l.language_code=? ORDER BY l.slug`, [user?.accountId || "", skill, language]) }).results;
  const review = url.searchParams.get("review") === "1";
  const cards = rows.filter((r) => !review || r.remembered !== 1).map((row) => {
    const parts = safeJsonParse(row.components_json, {});
    const prompt = [parts[skill]].flat().filter((x) => typeof x === "string").join(" · ");
    const example = Array.isArray(parts.examples) ? parts.examples.find((x) => typeof x === "string") || "" : "";
    return { row, prompt, example };
  }).filter((card) => card.prompt);
  const page = Math.min(cards.length, Math.max(1, parseInt(url.searchParams.get("card"), 10) || 1));
  const item = cards[page - 1];
  const link = /* @__PURE__ */ __name((i) => path + "?language=" + language + "&amp;card=" + i + (review ? "&amp;review=1" : ""), "link");
  const login = escapeHtml(signInUrl(url.pathname + url.search, "flashcards.study"));
  const microphone = skill === "speaking" ? '<button type="button" class="wb-btn wb-btn-outline" data-wb-record-toggle>Ghi âm</button><p data-wb-record-status role="status"></p><audio id="wb-local-playback" controls hidden></audio>' : "";
  const face = item ? `<article class="wb-study-card">
    <header><span class="wb-badge">${cardSkills[skill]}</span><span>${page} / ${cards.length}</span></header>
    <h2>${escapeHtml(item.prompt)}</h2>
    ${user ? `<details><summary>Xem ví dụ trong bài học</summary><p data-learning-content>${escapeHtml(item.example || item.row.title_vi)}</p></details>
    ${["listening", "speaking"].includes(skill) && item.example ? `<button type="button" class="wb-btn wb-btn-outline" data-wb-tts="${escapeHtml(item.example.split(" — ")[0])}" data-wb-lang="${language}">Nghe mẫu</button>` : ""}${microphone}
    <form class="wb-form" data-api-endpoint="/api/v1/flashcards/review">
    <input type="hidden" name="lessonId" value="${escapeHtml(item.row.id)}"><input type="hidden" name="skill" value="${skill}">
    ${["writing", "reading", "listening"].includes(skill) ? `<label>Bài làm của bạn<textarea class="wb-textarea" name="responseText" maxlength="4000">${escapeHtml(item.row.response_text)}</textarea></label>` : ""}
    <label>Mức ghi nhớ<select name="remembered" class="wb-select"><option value="0">Cần ôn lại</option><option value="1" ${item.row.remembered === 1 ? "selected" : ""}>Đã nhớ</option></select></label>
    <button class="wb-btn wb-btn-primary">Lưu tiến độ</button><p role="status" data-form-status></p></form>` : `<a class="wb-btn wb-btn-primary" href="${login}">Đăng nhập để luyện tập</a>`}
    <a href="/lessons/${encodeURIComponent(item.row.slug)}">${escapeHtml(item.row.title_vi)}</a>
    <nav>${page > 1 ? `<a href="${link(page - 1)}">← Thẻ trước</a>` : ""}${page < cards.length ? `<a href="${link(page + 1)}">Thẻ tiếp →</a>` : ""}</nav></article>` : '<p class="wb-card">Mục này hiện chưa có thẻ phù hợp.</p>';
  const contentHtml = `<h1>Flashcard · ${cardSkills[skill]}</h1><nav class="wb-skill-strip"><a href="${path}?language=zh">Tiếng Trung</a><a href="${path}?language=en">Tiếng Anh</a>${user ? `<a href="${path}?language=${language}&amp;review=1">Ôn tập</a>` : ""}</nav>${face}`;
  return htmlResponse(renderPublicPage({ title: "Flashcard · " + cardSkills[skill], currentPath: path, user, contentHtml }));
}
__name(renderSkillCards, "renderSkillCards");

// src/config/sitemap.js
var PUBLIC_HEADER_NAV = Object.freeze([
  { label: "Trang chủ", href: "/" },
  { label: "Học ngoại ngữ", href: "/learning" },
  { label: "Từ điển", href: "/dictionary" },
  { label: "Luyện tập", href: "/practice" },
  { label: "Ngoại ngữ chuyên ngành", href: "/specialized" },
  { label: "Learner Meet", href: "/learner-meet" },
  { label: "Giới thiệu", href: "/about" }
]);
var PUBLIC_FOOTER_SECTIONS = Object.freeze([
  {
    title: "Khám phá",
    links: [
      { label: "Trang chủ", href: "/" },
      { label: "Giới thiệu", href: "/about" },
      { label: "Học ngoại ngữ", href: "/learning" },
      { label: "Ngoại ngữ chuyên ngành", href: "/specialized" }
    ]
  },
  {
    title: "Học tập",
    links: [
      { label: "Từ điển", href: "/dictionary" },
      { label: "Luyện tập", href: "/practice" },
      { label: "Learner Meet", href: "/learner-meet" }
    ]
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: "/help" },
      { label: "FAQ", href: "/faq" },
      { label: "Liên hệ hỗ trợ", href: "/contact" }
    ]
  },
  {
    title: "Chính sách",
    links: [
      { label: "Điều khoản sử dụng", href: "/policies/terms" },
      { label: "Chính sách quyền riêng tư", href: "/policies/privacy" },
      { label: "Chính sách bảo vệ dữ liệu", href: "/policies/data-protection" },
      { label: "Chính sách sử dụng nền tảng", href: "/policies/platform-usage" }
    ]
  }
]);
var SITEMAP_PATHS = [.../* @__PURE__ */ new Set([
  ...PUBLIC_HEADER_NAV.map((item) => item.href),
  ...PUBLIC_FOOTER_SECTIONS.flatMap((section) => section.links.map((item) => item.href)),
  "/learning/chinese",
  "/learning/english",
  "/learning/path",
  "/learning/skills",
  "/reader",
  "/vocabulary/flashcards",
  ...["grammar", "listening", "speaking", "reading", "writing"].map((skill) => "/flashcards/" + skill),
  ...["vocabulary", "grammar", "listening", "speaking", "pronunciation", "reading", "writing"].map((skill) => "/skills/" + skill)
])];

// email/layouts/base-layout.js
function escapeEmailHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeEmailHtml, "escapeEmailHtml");
function renderEmailLogoHeader({ officialSvgUrl = null } = {}) {
  if (officialSvgUrl) {
    return `
      <div style="padding:4px 0;">
        <img src="${escapeEmailHtml(officialSvgUrl)}" alt="WORD BRIDGE — Where Languages Bring People Together." width="200" style="display:block;max-width:200px;height:auto;border:0;outline:none;text-decoration:none;" />
        <noscript>
          <span style="font-size:22px;font-weight:800;letter-spacing:0.04em;color:#146466;">WORD</span>
          <span style="font-size:22px;font-weight:800;letter-spacing:0.04em;color:#C92F1C;"> BRIDGE</span>
        </noscript>
      </div>`;
  }
  return `
    <div style="padding:4px 0;line-height:1.2;">
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:0.04em;">
        <span style="color:#146466;">WORD</span> <span style="color:#C92F1C;">BRIDGE</span>
      </div>
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#146466;margin-top:4px;">
        Where Languages Bring People Together.
      </div>
    </div>`;
}
__name(renderEmailLogoHeader, "renderEmailLogoHeader");
function renderEmailLayout({
  title,
  categoryBadge = "WORD BRIDGE",
  preheader = "",
  bodyHtml,
  bodyText,
  ctaLabel = null,
  ctaUrl = null,
  senderAddress = "noreply@wordbridge.io.vn",
  replyToAddress = "support@wordbridge.io.vn",
  officialSvgUrl = null
}) {
  const isNoReply = senderAddress === "noreply@wordbridge.io.vn" || senderAddress === "noreply@wordbridge.vn";
  const supportNoteHtml = isNoReply
    ? `Email này được gửi tự động từ <strong>${escapeEmailHtml(senderAddress)}</strong>. Nếu cần hỗ trợ, vui lòng liên hệ qua <a href="https://wordbridge.io.vn/help" style="color:#146466;font-weight:600;">Trung Tâm Trợ Giúp</a> hoặc phản hồi tới <a href="mailto:${escapeEmailHtml(replyToAddress)}" style="color:#146466;font-weight:600;">${escapeEmailHtml(replyToAddress)}</a>.`
    : `Bạn có thể phản hồi trực tiếp tới <a href="mailto:${escapeEmailHtml(replyToAddress)}" style="color:#146466;font-weight:600;">${escapeEmailHtml(replyToAddress)}</a> để được đội ngũ WORD BRIDGE hỗ trợ.`;
  const supportNoteText = isNoReply
    ? `Email nay duoc gui tu dong tu ${senderAddress}. Can ho tro vui long truy cap https://wordbridge.io.vn/help hoac lien he ${replyToAddress}`
    : `Ban co the phan hoi truc tiep toi: ${replyToAddress}`;
  const ctaBlockHtml = ctaLabel && ctaUrl ? `<div style="margin:26px 0 18px;text-align:left;">
        <a href="${escapeEmailHtml(ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#0d5c5f 0%,#146466 100%);background-color:#146466;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;box-shadow:0 4px 12px rgba(20,100,102,0.22);">
          ${escapeEmailHtml(ctaLabel)} →
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#52606D;word-break:break-all;">
          Nếu nút không hiển thị, sao chép đường dẫn sau vào trình duyệt:<br/>
          <a href="${escapeEmailHtml(ctaUrl)}" style="color:#146466;">${escapeEmailHtml(ctaUrl)}</a>
        </p>
      </div>` : "";
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeEmailHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#EDF5F5;font-family:'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#0D1F22;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeEmailHtml(preheader || title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#EDF5F5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;background-color:#FFFFFF;border-radius:18px;border:1px solid #D2E6E5;overflow:hidden;box-shadow:0 10px 28px rgba(3,82,87,0.08);">
          <tr>
            <td style="padding:26px 32px;background:linear-gradient(125deg,#073d40 0%,#146466 65%,#1c8284 100%);background-color:#146466;border-bottom:4px solid #C92F1C;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.32);color:#E6F9FA;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeEmailHtml(categoryBadge)}</span>
                    <div style="margin-top:12px;font-size:24px;font-weight:900;letter-spacing:0.04em;color:#FFFFFF;">WORD <span style="color:#FFB4A9;">BRIDGE</span></div>
                    <div style="margin-top:3px;font-size:12px;color:#CBEFEF;">Where Languages Bring People Together.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;color:#0D4E51;font-weight:800;">${escapeEmailHtml(title)}</h1>
              <div style="font-size:15px;line-height:1.7;color:#1F2933;">
                ${bodyHtml}
              </div>
              ${ctaBlockHtml}
              <div style="margin-top:24px;padding:14px 16px;background-color:#F3FAFA;border:1px solid #D5ECEA;border-left:4px solid #146466;border-radius:10px;font-size:13px;line-height:1.6;color:#274B4D;">
                <strong>Cam kết tôn trọng người học:</strong> WORD BRIDGE chỉ gửi email cần thiết về tài khoản, bảo mật, hỗ trợ hoặc lịch học bạn đã bật. Bạn có thể quản lý tùy chọn nhận thư bất cứ lúc nào tại <a href="https://wordbridge.io.vn/account/preferences" style="color:#146466;font-weight:700;">Tùy chọn nền tảng</a>.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background-color:#F6FAFA;border-top:1px solid #DFECEC;font-size:12px;line-height:1.65;color:#4B6366;">
              <p style="margin:0 0 8px;">${supportNoteHtml}</p>
              <p style="margin:0 0 4px;"><strong>WORD BRIDGE</strong> · Nền tảng học tập và thực hành ngoại ngữ Trung – Anh</p>
              <p style="margin:0;">Website: <a href="https://wordbridge.io.vn/" style="color:#146466;font-weight:600;">https://wordbridge.io.vn/</a> · Email gửi: <code>${escapeEmailHtml(senderAddress)}</code></p>
              <p style="margin:8px 0 0;color:#6E8588;">© 2026 WORD BRIDGE. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = [
    "WORD BRIDGE — Where Languages Bring People Together.",
    "====================================================",
    title,
    "",
    bodyText,
    ctaLabel && ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : "",
    "",
    "----------------------------------------------------",
    supportNoteText,
    "Website: https://wordbridge.io.vn/",
    "© 2026 WORD BRIDGE. All rights reserved."
  ].filter(Boolean).join("\n");
  return { html, text };
}
__name(renderEmailLayout, "renderEmailLayout");

// email/templates/registry.js — Configured for noreply@wordbridge.io.vn
var EMAIL_CHANNELS = Object.freeze({
  SYSTEM: {
    from: "WORD BRIDGE <noreply@wordbridge.io.vn>",
    senderAddress: "noreply@wordbridge.io.vn",
    replyTo: "support@wordbridge.io.vn"
  },
  CSKH: {
    from: "WORD BRIDGE Hỗ trợ <noreply@wordbridge.io.vn>",
    senderAddress: "noreply@wordbridge.io.vn",
    replyTo: "cskh@wordbridge.io.vn"
  },
  CONTACT: {
    from: "WORD BRIDGE <noreply@wordbridge.io.vn>",
    senderAddress: "noreply@wordbridge.io.vn",
    replyTo: "contact@wordbridge.io.vn"
  }
});
var TEMPLATE_SPECS = [
  // I. Email tài khoản và đăng ký (7)
  { key: "welcome_registered", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Chào mừng đến WORD BRIDGE", triggerVi: "Sau khi đăng ký thành công", version: "2.0.0", channel: "SYSTEM", subject: "Chào mừng bạn đến với WORD BRIDGE", title: "Chào mừng đến WORD BRIDGE", ctaLabel: "Bắt đầu hành trình học tập", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.fullName || "bạn"}, chào mừng bạn gia nhập WORD BRIDGE. Bạn đã sẵn sàng khám phá lộ trình học Tiếng Trung và Tiếng Anh, từ điển chuyên ngành và thư viện đọc học thuật trong cùng một không gian học tập.`, "summary") },
  { key: "verify_email", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Xác minh địa chỉ email", triggerVi: "Khi tạo tài khoản", version: "2.0.0", channel: "SYSTEM", subject: "Xác minh địa chỉ email tài khoản WORD BRIDGE", title: "Xác minh địa chỉ email của bạn", ctaLabel: "Xác minh email ngay", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.fullName || "bạn"}, vui lòng nhấn nút bên dưới để xác minh địa chỉ email cho tài khoản WORD BRIDGE. Liên kết có hiệu lực một lần trong ${v.expiresMinutes || 30} phút.`, "summary") },
  { key: "registration_completed", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Thông báo đăng ký tài khoản thành công", triggerVi: "Sau khi hoàn tất đăng ký", version: "2.0.0", channel: "SYSTEM", subject: "Đăng ký tài khoản WORD BRIDGE thành công", title: "Tài khoản của bạn đã sẵn sàng", ctaLabel: "Vào không gian học tập", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.fullName || "bạn"}, tài khoản WORD BRIDGE (${v.email || ""}) đã hoàn tất đăng ký và được kích hoạt thành công.`, "summary") },
  { key: "password_reset", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Yêu cầu đặt lại mật khẩu", triggerVi: "Khi người dùng yêu cầu", version: "2.0.0", channel: "SYSTEM", subject: "Yêu cầu đặt lại mật khẩu WORD BRIDGE", title: "Khôi phục mật khẩu tài khoản", ctaLabel: "Đặt lại mật khẩu", summary: /* @__PURE__ */ __name((v) => `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${v.email || ""}. Liên kết chỉ sử dụng một lần và hết hạn sau ${v.expiresMinutes || 30} phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`, "summary") },
  { key: "password_changed", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Thông báo thay đổi mật khẩu", triggerVi: "Sau khi đổi mật khẩu", version: "2.0.0", channel: "SYSTEM", subject: "Mật khẩu WORD BRIDGE của bạn đã được thay đổi", title: "Xác nhận thay đổi mật khẩu", ctaLabel: "Kiểm tra bảo mật tài khoản", summary: /* @__PURE__ */ __name((v) => `Mật khẩu tài khoản WORD BRIDGE của bạn vừa được thay đổi thành công lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()}. Nếu bạn không thực hiện thao tác này, hãy đặt lại mật khẩu ngay.`, "summary") },
  { key: "email_changed", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Thông báo cập nhật email", triggerVi: "Khi thay đổi địa chỉ email", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo cập nhật địa chỉ email WORD BRIDGE", title: "Cập nhật địa chỉ email tài khoản", ctaLabel: "Kiểm tra hồ sơ cá nhân", summary: /* @__PURE__ */ __name((v) => `Địa chỉ email liên kết với tài khoản WORD BRIDGE vừa có yêu cầu cập nhật sang ${v.newEmail || "địa chỉ mới"}. Vui lòng xác nhận hoặc liên hệ hỗ trợ nếu không phải bạn thực hiện.`, "summary") },
  { key: "profile_updated", group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Thông báo cập nhật hồ sơ", triggerVi: "Khi có thay đổi quan trọng", version: "2.0.0", channel: "SYSTEM", subject: "Hồ sơ cá nhân WORD BRIDGE đã được cập nhật", title: "Cập nhật thông tin hồ sơ", ctaLabel: "Xem hồ sơ cá nhân", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.fullName || "bạn"}, thông tin quan trọng trên hồ sơ cá nhân WORD BRIDGE của bạn vừa được cập nhật lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()}.`, "summary") },

  // II. Email bảo mật và đăng nhập (7)
  { key: "new_login_detected", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Cảnh báo đăng nhập từ thiết bị mới", triggerVi: "Khi phát hiện đăng nhập mới", version: "2.0.0", channel: "SYSTEM", subject: "Cảnh báo đăng nhập từ thiết bị mới — WORD BRIDGE", title: "Phát hiện đăng nhập từ thiết bị mới", ctaLabel: "Kiểm tra thiết bị & phiên", summary: /* @__PURE__ */ __name((v) => `Tài khoản của bạn vừa đăng nhập lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()} từ thiết bị ${v.userAgent || "Trình duyệt web"} (IP: ${v.ipAddress || "được ẩn"}). Nếu không phải bạn, hãy thu hồi phiên và đổi mật khẩu ngay.`, "summary") },
  { key: "logout_notice", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Thông báo đăng xuất", triggerVi: "Khi có sự kiện đăng xuất cần thông báo", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo đăng xuất tài khoản WORD BRIDGE", title: "Xác nhận đăng xuất phiên làm việc", ctaLabel: "Xem lịch sử đăng nhập", summary: /* @__PURE__ */ __name((v) => `Phiên làm việc trên tài khoản WORD BRIDGE của bạn đã được đăng xuất an toàn lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()}.`, "summary") },
  { key: "passkey_added", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Thông báo thêm Passkey", triggerVi: "Khi đăng ký Passkey mới", version: "2.0.0", channel: "SYSTEM", subject: "Passkey mới đã được thêm vào tài khoản WORD BRIDGE", title: "Đã thêm Passkey (WebAuthn) mới", ctaLabel: "Quản lý Passkey", summary: /* @__PURE__ */ __name((v) => `Passkey "${v.passkeyName || "Thiết bị cá nhân"}" đã được đăng ký thành công qua chuẩn WebAuthn/FIDO2. WORD BRIDGE không lưu dữ liệu sinh trắc học của thiết bị.`, "summary") },
  { key: "passkey_revoked", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Thông báo xóa Passkey", triggerVi: "Khi Passkey bị xóa", version: "2.0.0", channel: "SYSTEM", subject: "Passkey đã được xóa khỏi tài khoản WORD BRIDGE", title: "Đã xóa / thu hồi Passkey", ctaLabel: "Xem danh sách Passkey", summary: /* @__PURE__ */ __name((v) => `Passkey "${v.passkeyName || "Thiết bị"}" đã bị xóa khỏi tài khoản WORD BRIDGE và không còn dùng để đăng nhập được nữa.`, "summary") },
  { key: "security_alert", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Cảnh báo hoạt động bất thường", triggerVi: "Khi hệ thống phát hiện dấu hiệu đáng ngờ", version: "2.0.0", channel: "SYSTEM", subject: "Cảnh báo hoạt động bất thường trên tài khoản WORD BRIDGE", title: "Cảnh báo hoạt động bất thường", ctaLabel: "Mở Bảo mật tài khoản", summary: /* @__PURE__ */ __name((v) => `Hệ thống phát hiện dấu hiệu bất thường: ${v.detail || "Nhiều lần đăng nhập sai hoặc truy cập đáng ngờ"}. Hãy kiểm tra lịch sử đăng nhập và cập nhật mật khẩu ngay.`, "summary") },
  { key: "session_revoked", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Thông báo đăng xuất tất cả phiên", triggerVi: "Khi người dùng thực hiện thao tác", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo đăng xuất các phiên đăng nhập WORD BRIDGE", title: "Đã đăng xuất các phiên khác", ctaLabel: "Quản lý thiết bị & phiên", summary: /* @__PURE__ */ __name((v) => `Tài khoản WORD BRIDGE của bạn vừa thực hiện đăng xuất ${v.revokedCount ? `${v.revokedCount} phiên khác` : "phiên đăng nhập từ xa"} lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()}.`, "summary") },
  { key: "security_settings_changed", group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Cảnh báo thay đổi thông tin bảo mật", triggerVi: "Khi thông tin bảo mật được cập nhật", version: "2.0.0", channel: "SYSTEM", subject: "Thông tin bảo mật WORD BRIDGE vừa được cập nhật", title: "Cảnh báo thay đổi thiết lập bảo mật", ctaLabel: "Kiểm tra bảo mật", summary: /* @__PURE__ */ __name((v) => `Thiết lập bảo mật trên tài khoản của bạn vừa có thay đổi: ${v.detail || "Cập nhật phương thức bảo vệ tài khoản"}. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay.`, "summary") },

  // III. Email học tập (6 — tôn trọng tuyệt đối tùy chọn nhận thông báo học tập)
  { key: "vocabulary_review_reminder", group: "learning", groupTitle: "III. Email học tập", nameVi: "Nhắc nhở ôn tập từ vựng", triggerVi: "Khi có từ đến hạn ôn SRS", optInPreference: "lesson_completed", version: "2.0.0", channel: "SYSTEM", subject: "Nhắc nhở ôn tập từ vựng đến hạn trên WORD BRIDGE", title: "Từ vựng đến hạn ôn tập SRS", ctaLabel: "Ôn tập từ vựng ngay", summary: /* @__PURE__ */ __name((v) => `Bạn hiện có ${v.dueCount || 0} mục từ trong Sổ từ vựng cá nhân đã đến chu kỳ ôn tập ngắt quãng. Dành vài phút ôn lại để duy trì trí nhớ dài hạn.`, "summary") },
  { key: "study_schedule_reminder", group: "learning", groupTitle: "III. Email học tập", nameVi: "Nhắc nhở học tập", triggerVi: "Theo lịch người dùng thiết lập", optInPreference: "lesson_completed", version: "2.0.0", channel: "SYSTEM", subject: "Nhắc lịch học hôm nay trên WORD BRIDGE", title: "Đến giờ học ngoại ngữ theo lịch", ctaLabel: "Tiếp tục bài học", summary: /* @__PURE__ */ __name((v) => `Đã đến giờ học theo mục tiêu ${v.goalMinutes || 20} phút/ngày của bạn trên WORD BRIDGE.`, "summary") },
  { key: "learning_activity_report", group: "learning", groupTitle: "III. Email học tập", nameVi: "Báo cáo hoạt động học tập", triggerVi: "Theo tuần hoặc tháng nếu người dùng đăng ký", optInPreference: "lesson_completed", version: "2.0.0", channel: "SYSTEM", subject: "Báo cáo hoạt động học tập định kỳ — WORD BRIDGE", title: "Báo cáo hoạt động học tập của bạn", ctaLabel: "Xem Dữ liệu học tập", summary: /* @__PURE__ */ __name((v) => `Tổng hợp hoạt động học tập ${v.periodLabel || "trong tuần qua"}: ${v.lessonsCompleted || 0} bài học và ${v.practiceCount || 0} bài luyện tập đã hoàn thành.`, "summary") },
  { key: "learning_progress_summary", group: "learning", groupTitle: "III. Email học tập", nameVi: "Tổng kết tiến độ học tập", triggerVi: "Theo chu kỳ đã chọn", optInPreference: "lesson_completed", version: "2.0.0", channel: "SYSTEM", subject: "Tổng kết tiến độ học tập — WORD BRIDGE", title: "Tổng kết tiến độ theo chu kỳ", ctaLabel: "Xem tiến độ chi tiết", summary: /* @__PURE__ */ __name((v) => `Chúc mừng bạn đã duy trì tiến độ học tập trên WORD BRIDGE. Mở Dữ liệu học tập để xem chi tiết kỹ năng đã cải thiện.`, "summary") },
  { key: "content_recommendation", group: "learning", groupTitle: "III. Email học tập", nameVi: "Gợi ý nội dung học tập", triggerVi: "Khi có nội dung phù hợp (chỉ gửi khi bật đề xuất)", optInPreference: "marketing", defaultEnabled: false, version: "2.0.0", channel: "SYSTEM", subject: "Gợi ý nội dung học tập phù hợp trên WORD BRIDGE", title: "Nội dung gợi ý dành cho bạn", ctaLabel: "Khám phá học liệu", summary: /* @__PURE__ */ __name((v) => `WORD BRIDGE vừa có nội dung phù hợp với mục tiêu của bạn: ${v.contentTitle || "Chủ điểm luyện tập Trung – Anh mới"}.`, "summary") },
  { key: "learning_path_continue", group: "learning", groupTitle: "III. Email học tập", nameVi: "Nhắc tiếp tục lộ trình", triggerVi: "Khi người dùng bật tính năng nhắc nhở", optInPreference: "lesson_completed", version: "2.0.0", channel: "SYSTEM", subject: "Tiếp tục lộ trình học tập của bạn trên WORD BRIDGE", title: "Tiếp tục hành trình ngoại ngữ", ctaLabel: "Mở Lộ trình học tập", summary: /* @__PURE__ */ __name((v) => `Lộ trình ${v.programTitle || "Tiếng Trung – Tiếng Anh"} của bạn đang sẵn sàng cho bài học tiếp theo.`, "summary") },

  // IV. Email quyền lợi và hỗ trợ (6)
  { key: "support_request_confirmation", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Xác nhận gửi yêu cầu hỗ trợ", triggerVi: "Khi gửi biểu mẫu hỗ trợ", version: "2.0.0", channel: "CSKH", subject: "Xác nhận đã gửi yêu cầu hỗ trợ — WORD BRIDGE", title: "Đã nhận yêu cầu hỗ trợ của bạn", ctaLabel: "Theo dõi yêu cầu hỗ trợ", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.senderName || "bạn"}, WORD BRIDGE đã ghi nhận yêu cầu mã #${v.ticketId || ""} với tiêu đề "${v.subject || ""}".`, "summary") },
  { key: "support_ticket_received", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Thông báo tiếp nhận yêu cầu", triggerVi: "Khi bộ phận hỗ trợ tiếp nhận", version: "2.0.0", channel: "CSKH", subject: "Bộ phận hỗ trợ WORD BRIDGE đã tiếp nhận yêu cầu của bạn", title: "Yêu cầu hỗ trợ đang được xử lý", ctaLabel: "Xem trạng thái phiếu", summary: /* @__PURE__ */ __name((v) => `Yêu cầu hỗ trợ mã #${v.ticketId || ""} của bạn đã được chuyên viên CSKH WORD BRIDGE tiếp nhận và đang kiểm tra.`, "summary") },
  { key: "support_response", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Thông báo phản hồi hỗ trợ", triggerVi: "Khi có câu trả lời", version: "2.0.0", channel: "CSKH", subject: "Phản hồi từ đội ngũ hỗ trợ WORD BRIDGE", title: "Phản hồi yêu cầu hỗ trợ", ctaLabel: "Xem phản hồi chi tiết", summary: /* @__PURE__ */ __name((v) => v.replyBody || "Đội ngũ CSKH WORD BRIDGE đã gửi phản hồi cho yêu cầu hỗ trợ của bạn.", "summary") },
  { key: "student_benefit_submitted", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Xác nhận gửi yêu cầu xác minh sinh viên", triggerVi: "Khi gửi hồ sơ", version: "2.0.0", channel: "SYSTEM", subject: "Xác nhận yêu cầu xác minh sinh viên WORD BRIDGE", title: "Đã tiếp nhận yêu cầu xác minh sinh viên", ctaLabel: "Xem Quyền lợi sinh viên", summary: /* @__PURE__ */ __name((v) => `Chúng tôi đã nhận được yêu cầu xác minh email sinh viên (${v.schoolEmail || ""}). Vui lòng kiểm tra liên kết xác minh để kích hoạt quyền lợi 03 tháng.`, "summary") },
  { key: "student_benefit_activated", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Thông báo kết quả xác minh", triggerVi: "Khi có kết quả", version: "2.0.0", channel: "SYSTEM", subject: "Kết quả xác minh quyền lợi sinh viên WORD BRIDGE", title: "Kết quả xác minh quyền lợi sinh viên", ctaLabel: "Mở Quyền lợi sinh viên", summary: /* @__PURE__ */ __name((v) => `Email sinh viên ${v.schoolEmail || ""} đã được xác minh thành công. Quyền lợi sinh viên 03 tháng của bạn có hiệu lực đến ngày ${v.expiresAt || "theo thông báo tài khoản"}.`, "summary") },
  { key: "policy_change_notice", group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Thông báo cập nhật chính sách", triggerVi: "Khi chính sách quan trọng thay đổi", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo cập nhật chính sách nền tảng WORD BRIDGE", title: "Cập nhật chính sách nền tảng", ctaLabel: "Xem chi tiết chính sách", summary: /* @__PURE__ */ __name((v) => `WORD BRIDGE cập nhật ${v.policyName || "chính sách nền tảng"} nhằm nâng cao minh bạch và bảo vệ quyền lợi người học.`, "summary") },

  // V. Email thông báo nền tảng (6)
  { key: "platform_new_feature", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo tính năng mới", triggerVi: "Khi phát hành tính năng mới", optInPreference: "security_alerts", version: "2.0.0", channel: "SYSTEM", subject: "Tính năng mới trên nền tảng WORD BRIDGE", title: "Khám phá tính năng mới trên WORD BRIDGE", ctaLabel: "Trải nghiệm ngay", summary: /* @__PURE__ */ __name((v) => v.detail || "WORD BRIDGE vừa ra mắt tính năng học tập mới giúp bạn rèn luyện Tiếng Trung và Tiếng Anh hiệu quả hơn.", "summary") },
  { key: "platform_system_upgrade", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo nâng cấp hệ thống", triggerVi: "Khi nâng cấp hạ tầng / phiên bản", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo nâng cấp hệ thống WORD BRIDGE", title: "Nâng cấp hiệu năng và bảo mật hệ thống", ctaLabel: "Truy cập WORD BRIDGE", summary: /* @__PURE__ */ __name((v) => v.detail || "WORD BRIDGE đã hoàn tất nâng cấp hệ thống nhằm cải thiện tốc độ truy cập và độ ổn định dữ liệu.", "summary") },
  { key: "maintenance_notice", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo bảo trì theo lịch", triggerVi: "Trước khung giờ bảo trì định kỳ", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo bảo trì theo lịch hệ thống WORD BRIDGE", title: "Lịch bảo trì định kỳ hệ thống", ctaLabel: "Xem Trung Tâm Trợ Giúp", summary: /* @__PURE__ */ __name((v) => `Hệ thống WORD BRIDGE dự kiến bảo trì trong khung giờ ${v.window || "theo thông báo vận hành"} để bảo dưỡng hạ tầng an toàn.`, "summary") },
  { key: "system_error_notice", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo gián đoạn dịch vụ", triggerVi: "Khi xảy ra sự cố gián đoạn kỹ thuật", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo gián đoạn dịch vụ — WORD BRIDGE", title: "Thông báo khắc phục gián đoạn dịch vụ", ctaLabel: "Theo dõi cập nhật", summary: /* @__PURE__ */ __name((v) => `Hệ thống ghi nhận gián đoạn dịch vụ tạm thời: ${v.detail || "Đội ngũ kỹ thuật đang khẩn trương xử lý và khôi phục"}.`, "summary") },
  { key: "platform_terms_updated", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo cập nhật điều khoản sử dụng", triggerVi: "Khi cập nhật Điều khoản sử dụng", version: "2.0.0", channel: "SYSTEM", subject: "Cập nhật Điều khoản sử dụng WORD BRIDGE", title: "Cập nhật Điều khoản sử dụng", ctaLabel: "Đọc Điều khoản sử dụng", summary: /* @__PURE__ */ __name((v) => "WORD BRIDGE đã cập nhật Điều khoản sử dụng trên hệ thống. Vui lòng xem lại nội dung chi tiết tại trang Điều khoản sử dụng.", "summary") },
  { key: "platform_privacy_updated", group: "platform", groupTitle: "V. Email thông báo nền tảng", nameVi: "Thông báo cập nhật chính sách quyền riêng tư", triggerVi: "Khi cập nhật Chính sách quyền riêng tư", version: "2.0.0", channel: "SYSTEM", subject: "Cập nhật Chính sách quyền riêng tư WORD BRIDGE", title: "Cập nhật Chính sách quyền riêng tư", ctaLabel: "Đọc Chính sách quyền riêng tư", summary: /* @__PURE__ */ __name((v) => "WORD BRIDGE đã cập nhật Chính sách quyền riêng tư nhằm bảo vệ dữ liệu cá nhân của bạn minh bạch hơn.", "summary") },

  // Legacy compatibility templates (hidden from main 32 catalog but callable by existing workflows)
  { key: "student_benefit_expiring", legacy: true, group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Nhắc hạn quyền lợi sinh viên", triggerVi: "Trước khi hết hạn 03 tháng", version: "2.0.0", channel: "SYSTEM", subject: "Quyền lợi sinh viên sắp kết thúc — WORD BRIDGE", title: "Nhắc hạn quyền lợi sinh viên", ctaLabel: "Xem Quyền lợi sinh viên", summary: /* @__PURE__ */ __name((v) => `Quyền lợi sinh viên của bạn sẽ kết thúc vào ngày ${v.expiresAt || ""}.`, "summary") },
  { key: "student_benefit_expired", legacy: true, group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Kết thúc quyền lợi sinh viên", triggerVi: "Khi hết hạn 03 tháng", version: "2.0.0", channel: "SYSTEM", subject: "Quyền lợi sinh viên đã kết thúc — WORD BRIDGE", title: "Chuyển đổi về gói tiêu chuẩn", ctaLabel: "Xem tài khoản", summary: /* @__PURE__ */ __name((v) => "Thời hạn 03 tháng quyền lợi sinh viên đã kết thúc. Tài khoản của bạn tiếp tục học bình thường trên gói miễn phí.", "summary") },
  { key: "contact_partnership_confirmation", legacy: true, group: "support", groupTitle: "IV. Email quyền lợi và hỗ trợ", nameVi: "Xác nhận liên hệ hợp tác", triggerVi: "Khi gửi biểu mẫu liên hệ", version: "2.0.0", channel: "CONTACT", subject: "WORD BRIDGE đã tiếp nhận thông tin liên hệ", title: "Xác nhận tiếp nhận liên hệ", ctaLabel: "Truy cập WORD BRIDGE", summary: /* @__PURE__ */ __name((v) => `Xin chào ${v.senderName || "bạn"}, WORD BRIDGE đã tiếp nhận thông điệp "${v.subject || ""}" của bạn.`, "summary") },
  { key: "account_notice", legacy: true, group: "account", groupTitle: "I. Email tài khoản và đăng ký", nameVi: "Thông báo tài khoản", triggerVi: "Thông báo hệ thống", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo về tài khoản WORD BRIDGE", title: "Thông báo tài khoản", ctaLabel: "Xem tài khoản", summary: /* @__PURE__ */ __name((v) => v.message || "Tài khoản WORD BRIDGE của bạn có thông báo mới.", "summary") },
  { key: "course_notice", legacy: true, group: "learning", groupTitle: "III. Email học tập", nameVi: "Thông báo khóa học", triggerVi: "Cập nhật khóa học", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo cập nhật khóa học — WORD BRIDGE", title: "Thông báo khóa học", ctaLabel: "Mở khóa học", summary: /* @__PURE__ */ __name((v) => `Khóa học ${v.courseTitle || ""} có cập nhật nội dung mới.`, "summary") },
  { key: "practice_result_notice", legacy: true, group: "learning", groupTitle: "III. Email học tập", nameVi: "Kết quả luyện tập", triggerVi: "Ghi nhận kết quả", version: "2.0.0", channel: "SYSTEM", subject: "Kết quả bài luyện tập trên WORD BRIDGE", title: "Đã ghi nhận kết quả luyện tập", ctaLabel: "Xem kết quả", summary: /* @__PURE__ */ __name((v) => `Bạn đã hoàn thành bài luyện tập "${v.exerciseTitle || ""}" (${v.gradingStatus || "đã chấm"}).`, "summary") },
  { key: "learner_meet_session_notice", legacy: true, group: "learning", groupTitle: "III. Email học tập", nameVi: "Thông báo Learner Meet", triggerVi: "Khi tạo phiên Learner Meet", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo phiên thực hành Learner Meet", title: "Thông tin phiên Learner Meet", ctaLabel: "Mở danh sách phiên", summary: /* @__PURE__ */ __name((v) => `Phiên thực hành "${v.topic || ""}" (Mã: ${v.sessionCode || ""}) đã được tạo.`, "summary") },
  { key: "account_restricted_notice", legacy: true, group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Tạm giới hạn tài khoản", triggerVi: "Khi tài khoản bị giới hạn", version: "2.0.0", channel: "SYSTEM", subject: "Thông báo tạm giới hạn tài khoản WORD BRIDGE", title: "Tài khoản bị giới hạn tạm thời", ctaLabel: "Liên hệ hỗ trợ", summary: /* @__PURE__ */ __name((v) => `Tài khoản của bạn tạm thời bị giới hạn do: ${v.reason || "yêu cầu xác minh bảo mật"}.`, "summary") },
  { key: "account_recovered_notice", legacy: true, group: "security", groupTitle: "II. Email bảo mật và đăng nhập", nameVi: "Khôi phục tài khoản", triggerVi: "Khi khôi phục tài khoản", version: "2.0.0", channel: "SYSTEM", subject: "Tài khoản WORD BRIDGE đã được khôi phục", title: "Khôi phục tài khoản thành công", ctaLabel: "Đăng nhập ngay", summary: /* @__PURE__ */ __name((v) => `Tài khoản của bạn đã được khôi phục an toàn lúc ${v.timestamp || (/* @__PURE__ */ new Date()).toISOString()}.`, "summary") }
];
var EMAIL_TEMPLATE_MAP = new Map(TEMPLATE_SPECS.map((t) => [t.key, t]));
var EMAIL_TEMPLATE_KEYS = TEMPLATE_SPECS.map((t) => t.key);
function renderEmailTemplate(templateKey, variables = {}, options = {}) {
  const spec = EMAIL_TEMPLATE_MAP.get(templateKey);
  if (!spec) {
    throw new Error(`Email template không tồn tại: ${templateKey}`);
  }
  const channel = EMAIL_CHANNELS[spec.channel] || EMAIL_CHANNELS.SYSTEM;
  const senderAddress = options.senderAddress || channel.senderAddress;
  const replyTo = options.replyTo || channel.replyTo;
  const from = `WORD BRIDGE <${senderAddress}>`;
  const summaryText = options.customBody && options.customBody.trim() ? options.customBody.trim() : spec.summary(variables);
  const titleText = options.customTitle && options.customTitle.trim() ? options.customTitle.trim() : spec.title;
  const subjectText = variables.subjectOverride || (options.customSubject && options.customSubject.trim()) || spec.subject;
  const extraHtml = variables.extraHtml || "";
  const bodyHtml = `<p style="margin:0 0 14px;">${escapeEmailHtml(summaryText)}</p>${extraHtml}`;
  const rendered = renderEmailLayout({
    title: titleText,
    categoryBadge: spec.groupTitle || "WORD BRIDGE",
    preheader: summaryText.slice(0, 110),
    bodyHtml,
    bodyText: summaryText,
    ctaLabel: variables.ctaUrl ? variables.ctaLabel || spec.ctaLabel : spec.ctaLabel,
    ctaUrl: variables.ctaUrl || "https://wordbridge.io.vn/",
    senderAddress,
    replyToAddress: replyTo,
    officialSvgUrl: options.officialSvgUrl || null
  });
  return {
    templateKey: spec.key,
    templateVersion: spec.version,
    from,
    senderAddress,
    replyTo,
    subject: subjectText,
    html: rendered.html,
    text: rendered.text
  };
}
__name(renderEmailTemplate, "renderEmailTemplate");

// src/utils/crypto.js
import { webcrypto as nodeWebCrypto } from "node:crypto";
var webCrypto = globalThis.crypto || nodeWebCrypto;
var encoder = new TextEncoder();
function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
__name(fromHex, "fromHex");
function randomTokenHex(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  webCrypto.getRandomValues(bytes);
  return toHex(bytes);
}
__name(randomTokenHex, "randomTokenHex");
function generateId(prefix = "wb") {
  return `${prefix}_${webCrypto.randomUUID().replace(/-/g, "")}`;
}
__name(generateId, "generateId");
async function sha256Hex(input, pepper = "") {
  const data = encoder.encode(`${input}${pepper}`);
  const digest = await webCrypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}
__name(sha256Hex, "sha256Hex");
async function hmacSha256Hex(secret, message) {
  const key = await webCrypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await webCrypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(sig);
}
__name(hmacSha256Hex, "hmacSha256Hex");
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
var PBKDF2_ITERATIONS = 1e5;
async function hashPassword(password) {
  const salt = new Uint8Array(16);
  webCrypto.getRandomValues(salt);
  const keyMaterial = await webCrypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const iterations = PBKDF2_ITERATIONS;
  const derived = await webCrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(derived)}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1000 || iterations > PBKDF2_ITERATIONS) return false;
  try {
    const salt = fromHex(parts[2]);
    if (!salt || salt.length < 8) return false;
    const expectedHex = parts[3];
    const keyMaterial = await webCrypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derived = await webCrypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return timingSafeEqual(toHex(derived), expectedHex);
  } catch {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");

// src/services/email-service.js
var EmailService = class {
  static {
    __name(this, "EmailService");
  }
  constructor(db, env = {}) {
    this.db = db;
    this.env = env;
    this.providerName = env.EMAIL_PROVIDER || "unconfigured";
  }
  getEmailCatalog() {
    return TEMPLATE_SPECS.filter((t) => !t.legacy).map((t) => ({
      key: t.key,
      group: t.group,
      groupTitle: t.groupTitle,
      nameVi: t.nameVi,
      triggerVi: t.triggerVi,
      subject: t.subject,
      title: t.title,
      defaultEnabled: t.defaultEnabled !== false
    }));
  }
  async loadEmailRuntimeConfig() {
    const rows = (await this.db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key LIKE 'email.%'").all().catch(() => ({ results: [] }))).results || [];
    const map = Object.fromEntries(rows.map((r) => [r.config_key, r.config_value]));
    return {
      senderAddress: map["email.sender_address"] || "noreply@wordbridge.io.vn",
      replyTo: map["email.reply_to"] || "support@wordbridge.io.vn",
      provider: map["email.provider"] || this.providerName || "unconfigured"
    };
  }
  async shouldSkipByPolicy(templateKey, accountId) {
    // Section VI guardrails: never auto-email on lesson open, dictionary lookup, or vocab save
    if (["lesson_opened", "dictionary_lookup", "vocab_saved"].includes(templateKey)) {
      return "BLOCKED_ANTI_SPAM_POLICY";
    }
    const autoRow = await this.db.prepare("SELECT enabled FROM wb_email_automations WHERE event_key = ?").bind(templateKey).first().catch(() => null);
    if (autoRow && autoRow.enabled === 0) return "DISABLED_BY_ADMIN";
    const spec = EMAIL_TEMPLATE_MAP.get(templateKey);
    if (spec?.optInPreference && accountId) {
      const prof = await this.db.prepare("SELECT notification_preferences_json FROM wb_profiles WHERE account_id = ?").bind(accountId).first().catch(() => null);
      const prefs = safeJsonParse(prof?.notification_preferences_json, {});
      if (spec.optInPreference === "marketing" && prefs.marketing !== true) return "SKIPPED_NO_MARKETING_OPTIN";
      if (spec.optInPreference === "lesson_completed" && prefs.lesson_completed === false) return "SKIPPED_USER_OPTED_OUT";
    }
    return null;
  }
  async sendEventEmail({
    eventType,
    templateKey,
    recipientEmail,
    accountId = null,
    variables = {},
    idempotencyKey,
    forceSend = false
  }) {
    if (!idempotencyKey) {
      throw new Error("idempotencyKey là bắt buộc để chống gửi trùng email.");
    }
    if (!forceSend) {
      const skipReason = await this.shouldSkipByPolicy(templateKey, accountId);
      if (skipReason) {
        return { deduplicated: false, skipped: true, status: skipReason, provider: this.providerName };
      }
    }
    const existing = await this.db.prepare("SELECT id, delivery_status, provider_message_id FROM wb_email_events WHERE idempotency_key = ?").bind(idempotencyKey).first().catch(() => null);
    if (existing) {
      return {
        deduplicated: true,
        eventId: existing.id,
        status: existing.delivery_status,
        providerMessageId: existing.provider_message_id
      };
    }
    const cfg = await this.loadEmailRuntimeConfig();
    const ov = await this.db.prepare("SELECT custom_subject, custom_title, custom_body FROM wb_email_templates WHERE template_key = ?").bind(templateKey).first().catch(() => null);
    const rendered = renderEmailTemplate(templateKey, variables, {
      officialSvgUrl: this.env.OFFICIAL_LOGO_SVG_URL || null,
      senderAddress: cfg.senderAddress,
      replyTo: cfg.replyTo,
      customSubject: ov?.custom_subject || "",
      customTitle: ov?.custom_title || "",
      customBody: ov?.custom_body || ""
    });
    const eventId = generateId("eml");
    const insertEventSql = `
        INSERT INTO wb_email_events (
          id, idempotency_key, event_type, template_key, template_version,
          sender_address, reply_to_address, recipient_email, account_id,
          subject, variables_json, delivery_status, provider_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', ?)
      `;
    try {
      await this.db.prepare(insertEventSql).bind(
        eventId, idempotencyKey, eventType, rendered.templateKey, rendered.templateVersion,
        rendered.senderAddress, rendered.replyTo, recipientEmail.toLowerCase(), accountId,
        rendered.subject, JSON.stringify(variables), cfg.provider
      ).run();
    } catch (chkErr) {
      // Fallback if remote D1 still has legacy 0006 CHECK constraint for wordbridge.vn
      if (/CHECK constraint failed/i.test(String(chkErr?.message || ""))) {
        await this.db.prepare(insertEventSql).bind(
          eventId, idempotencyKey, eventType, rendered.templateKey, rendered.templateVersion,
          "noreply@wordbridge.vn", "cskh@wordbridge.vn", recipientEmail.toLowerCase(), accountId,
          rendered.subject, JSON.stringify(variables), cfg.provider
        ).run().catch(() => {});
      } else {
        throw chkErr;
      }
    }
    await this.recordDeliveryLog(eventId, "QUEUED", { eventType, templateKey });
    const dispatchResult = await this.dispatchToProvider({
      eventId,
      from: rendered.from,
      replyTo: rendered.replyTo,
      to: recipientEmail.toLowerCase(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
    return {
      deduplicated: false,
      eventId,
      status: dispatchResult.status,
      provider: this.providerName,
      providerMessageId: dispatchResult.providerMessageId || null,
      renderedPreview: {
        from: rendered.from,
        replyTo: rendered.replyTo,
        subject: rendered.subject
      }
    };
  }
  async retryQueuedEvent(eventId) {
    const row = await this.db.prepare("SELECT * FROM wb_email_events WHERE id = ?").bind(eventId).first();
    if (!row) return { ok: false, error: "Không tìm thấy email event." };
    if (row.retry_count >= row.max_retries) {
      await this.db.prepare("UPDATE wb_email_events SET delivery_status = 'FAILED', next_retry_at = NULL, updated_at = datetime('now') WHERE id = ?").bind(eventId).run();
      return { ok: false, status: "FAILED", reason: "Đã chạm giới hạn số lần thử lại." };
    }
    const vars = safeJsonParse(row.variables_json, {});
    const rendered = renderEmailTemplate(row.template_key, vars, {
      officialSvgUrl: this.env.OFFICIAL_LOGO_SVG_URL || null
    });
    const res = await this.dispatchToProvider({
      eventId: row.id,
      from: rendered.from,
      replyTo: rendered.replyTo,
      to: row.recipient_email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
    return { ok: res.status === "ACCEPTED", eventId: row.id, status: res.status };
  }
  async dispatchToProvider({ eventId, from, replyTo, to, subject, html, text }) {
    if (this.providerName === "unconfigured" || this.providerName === "resend" && !this.env.RESEND_API_KEY) {
      const reason = "Nhà cung cấp email chưa được cấu hình (EMAIL_PROVIDER=unconfigured hoặc thiếu RESEND_API_KEY). Không giả mạo trạng thái DELIVERED.";
      await this.db.prepare(`
          UPDATE wb_email_events
          SET delivery_status = 'BLOCKED_UNCONFIGURED', last_error = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(reason, eventId).run();
      await this.recordDeliveryLog(eventId, "BLOCKED_UNCONFIGURED", { reason });
      return { status: "BLOCKED_UNCONFIGURED", reason };
    }
    if (this.providerName === "resend") {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html, text })
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.message || `Resend HTTP ${res.status}`);
        }
        const providerMessageId = payload.id || null;
        await this.db.prepare(`
            UPDATE wb_email_events
            SET delivery_status = 'ACCEPTED', provider_message_id = ?, next_retry_at = NULL, last_error = NULL, updated_at = datetime('now')
            WHERE id = ?
          `).bind(providerMessageId, eventId).run();
        await this.recordDeliveryLog(eventId, "ACCEPTED", payload);
        return { status: "ACCEPTED", providerMessageId };
      } catch (err) {
        return this.markRetryOrFail(eventId, err.message);
      }
    }
    return this.markRetryOrFail(eventId, `Email provider không được hỗ trợ: ${this.providerName}`);
  }
  async markRetryOrFail(eventId, errorMessage) {
    const row = await this.db.prepare("SELECT retry_count, max_retries FROM wb_email_events WHERE id = ?").bind(eventId).first();
    const nextRetry = (row?.retry_count || 0) + 1;
    const maxRetries = row?.max_retries || 3;
    const isFinalFailure = nextRetry > maxRetries;
    const newStatus = isFinalFailure ? "FAILED" : "RETRYING";
    const backoffMinutes = Math.pow(2, nextRetry) * 5;
    await this.db.prepare(`
        UPDATE wb_email_events
        SET delivery_status = ?, retry_count = ?, last_error = ?,
            next_retry_at = CASE WHEN ? = 'RETRYING' THEN datetime('now', '+' || ? || ' minutes') ELSE NULL END,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(newStatus, nextRetry, String(errorMessage).slice(0, 500), newStatus, backoffMinutes, eventId).run();
    await this.recordDeliveryLog(eventId, newStatus, { error: errorMessage, retryCount: nextRetry });
    return { status: newStatus, error: errorMessage };
  }
  /**
   * Section 18: Signed Webhook Verification + Anti-Replay + Idempotency
   * Expected headers: X-WB-Webhook-Id, X-WB-Webhook-Timestamp (unix sec), X-WB-Signature (hex HMAC-SHA256 of `${timestamp}.${rawBody}`)
   */
  async verifyAndHandleWebhook({ rawBody, signature, timestamp, webhookEventId }) {
    const secret = this.env.EMAIL_WEBHOOK_SECRET;
    if (!secret) {
      return {
        ok: false,
        status: 503,
        code: "BLOCKED_UNCONFIGURED",
        error: "EMAIL_WEBHOOK_SECRET chưa được cấu hình. Từ chối cập nhật trạng thái email từ webhook chưa xác thực."
      };
    }
    if (!signature || !timestamp || !webhookEventId) {
      return { ok: false, status: 401, code: "WEBHOOK_SIGNATURE_MISSING", error: "Thiếu chữ ký, timestamp hoặc mã sự kiện webhook." };
    }
    const tsNum = Number(timestamp);
    const nowSec = Math.floor(Date.now() / 1e3);
    if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > 300) {
      return { ok: false, status: 401, code: "WEBHOOK_REPLAY_EXPIRED", error: "Timestamp webhook không hợp lệ hoặc vượt ngưỡng chống replay (300 giây)." };
    }
    const expectedSig = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
    if (!timingSafeEqual(String(signature).trim().toLowerCase(), expectedSig)) {
      return { ok: false, status: 401, code: "WEBHOOK_SIGNATURE_INVALID", error: "Chữ ký HMAC-SHA256 webhook không hợp lệ." };
    }
    const seen = await this.db.prepare("SELECT event_id FROM wb_webhook_events WHERE event_id = ?").bind(webhookEventId).first();
    if (seen) {
      return { ok: true, status: 200, deduplicated: true, message: "Sự kiện webhook đã được xử lý trước đó." };
    }
    const body = safeJsonParse(rawBody, {});
    const webhookEventType = body.type || body.webhookEventType;
    const providerMessageId = body.data?.email_id || body.providerMessageId;
    await this.db.prepare("INSERT INTO wb_webhook_events (event_id, provider, event_type, signature_verified) VALUES (?, ?, ?, 1)").bind(webhookEventId, this.providerName, String(webhookEventType || "unknown")).run();
    const statusMap = {
      "email.sent": "SENT",
      "email.delivered": "DELIVERED",
      "email.bounced": "BOUNCED",
      "email.complained": "COMPLAINED",
      "email.delivery_delayed": "RETRYING"
    };
    const mapped = statusMap[webhookEventType];
    if (!mapped) {
      return { ok: true, status: 200, ignored: true, reason: `Sự kiện webhook không ánh xạ: ${webhookEventType}` };
    }
    const eventRow = await this.db.prepare("SELECT id FROM wb_email_events WHERE provider_message_id = ?").bind(providerMessageId).first();
    if (!eventRow) {
      return { ok: true, status: 200, ignored: true, reason: "Không tìm thấy email_event tương ứng." };
    }
    await this.db.prepare("UPDATE wb_email_events SET delivery_status = ?, updated_at = datetime('now') WHERE id = ?").bind(mapped, eventRow.id).run();
    await this.recordDeliveryLog(eventRow.id, mapped, { webhookEventId, webhookEventType });
    return { ok: true, status: 200, updated: true, eventId: eventRow.id, deliveryStatus: mapped };
  }
  async recordDeliveryLog(emailEventId, status, payload = {}) {
    await this.db.prepare(`
        INSERT INTO wb_email_delivery_logs (id, email_event_id, status, provider_payload_json)
        VALUES (?, ?, ?, ?)
      `).bind(generateId("elg"), emailEventId, status, JSON.stringify(payload)).run();
  }
};

// src/services/auth-service.js
import { verifyRegistrationResponse, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { Buffer as Buffer2 } from "node:buffer";
var AuthService = class {
  static {
    __name(this, "AuthService");
  }
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = String(env.APP_BASE_URL || BRAND.websiteUrl).replace(/\/+$/, "");
    this.tokenPepper = env.TOKEN_PEPPER || "";
  }
  async getSecurityPolicy() {
    let maxAttempts = 5;
    let lockoutMinutes = 15;
    try {
      const rows = (await this.db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key IN ('security.max_login_attempts', 'security.lockout_minutes')").all()).results || [];
      for (const r of rows) {
        if (r.config_key === "security.max_login_attempts") {
          const v = Number(r.config_value);
          if (Number.isFinite(v) && v >= 3 && v <= 20) maxAttempts = v;
        }
        if (r.config_key === "security.lockout_minutes") {
          const v = Number(r.config_value);
          if (Number.isFinite(v) && v >= 1 && v <= 1440) lockoutMinutes = v;
        }
      }
    } catch {
    }
    return { maxAttempts, lockoutMinutes };
  }
  async ensureAuthCoreTables() {
    const ddls = [
      "CREATE TABLE IF NOT EXISTS wb_accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT, full_name TEXT NOT NULL, date_of_birth TEXT NOT NULL DEFAULT '', phone_number TEXT NOT NULL DEFAULT '', school_name TEXT NOT NULL DEFAULT '', workplace_name TEXT NOT NULL DEFAULT '', account_type TEXT NOT NULL DEFAULT 'personal', email_verified INTEGER NOT NULL DEFAULT 0, email_verified_at TEXT, status TEXT NOT NULL DEFAULT 'pending_verification', failed_login_attempts INTEGER NOT NULL DEFAULT 0, locked_until TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_profiles (account_id TEXT PRIMARY KEY, avatar_r2_key TEXT, bio TEXT DEFAULT '', preferred_ui_language TEXT NOT NULL DEFAULT 'vi', target_languages_json TEXT NOT NULL DEFAULT '[\"en\"]', daily_study_goal_minutes INTEGER NOT NULL DEFAULT 20, notification_preferences_json TEXT NOT NULL DEFAULT '{}', privacy_settings_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_entitlements (id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE, plan_code TEXT NOT NULL DEFAULT 'PERSONAL_FREE', source TEXT NOT NULL DEFAULT 'default', storage_quota_bytes INTEGER NOT NULL DEFAULT 1073741824, starts_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT, auto_renew INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_verification_tokens (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, token_type TEXT NOT NULL, target_value TEXT, expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_sessions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, session_token_hash TEXT NOT NULL UNIQUE, csrf_token TEXT NOT NULL, ip_address TEXT, user_agent TEXT, expires_at TEXT NOT NULL, revoked_at TEXT, last_active_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_email_events (id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, event_type TEXT NOT NULL, template_key TEXT NOT NULL, template_version TEXT NOT NULL DEFAULT '1.0.0', sender_address TEXT NOT NULL, reply_to_address TEXT NOT NULL, recipient_email TEXT NOT NULL, account_id TEXT, subject TEXT NOT NULL, variables_json TEXT NOT NULL DEFAULT '{}', delivery_status TEXT NOT NULL DEFAULT 'QUEUED', provider_name TEXT NOT NULL DEFAULT 'unconfigured', provider_message_id TEXT, retry_count INTEGER NOT NULL DEFAULT 0, max_retries INTEGER NOT NULL DEFAULT 3, next_retry_at TEXT, last_error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_email_delivery_logs (id TEXT PRIMARY KEY, email_event_id TEXT NOT NULL, status TEXT NOT NULL, provider_payload_json TEXT DEFAULT '{}', recorded_at TEXT NOT NULL DEFAULT (datetime('now')))",
      "CREATE TABLE IF NOT EXISTS wb_audit_logs (id TEXT PRIMARY KEY, actor_account_id TEXT, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT, ip_address TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')))"
    ];
    for (const ddl of ddls) {
      await this.db.prepare(ddl).run().catch(() => {});
    }
    const extraAccountCols = [
      "ALTER TABLE wb_accounts ADD COLUMN date_of_birth TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE wb_accounts ADD COLUMN phone_number TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE wb_accounts ADD COLUMN school_name TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE wb_accounts ADD COLUMN workplace_name TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE wb_accounts ADD COLUMN account_type TEXT NOT NULL DEFAULT 'personal'",
      "ALTER TABLE wb_accounts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE wb_accounts ADD COLUMN email_verified_at TEXT",
      "ALTER TABLE wb_accounts ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE wb_accounts ADD COLUMN locked_until TEXT"
    ];
    for (const alter of extraAccountCols) {
      await this.db.prepare(alter).run().catch(() => {});
    }
  }
  async register(payload, requestMeta = {}) {
    const check = validateRegistrationPayload(payload);
    if (!check.valid) return { ok: false, status: 400, errors: check.errors };
    const { fullName, dateOfBirth, phoneNumber, email, password, schoolName, workplaceName } = check.data;
    let existing = null;
    try {
      existing = await this.db.prepare("SELECT id FROM wb_accounts WHERE email = ?").bind(email).first();
    } catch {
      await this.ensureAuthCoreTables();
      existing = await this.db.prepare("SELECT id FROM wb_accounts WHERE email = ?").bind(email).first();
    }
    if (existing) {
      return { ok: false, status: 409, errors: ["Địa chỉ email này đã được đăng ký tài khoản WORD BRIDGE."] };
    }
    const accountId = generateId("acc");
    const passwordHash = await hashPassword(password);
    const insertAccountSql = `
        INSERT INTO wb_accounts (
          id, email, password_hash, full_name, date_of_birth,
          phone_number, school_name, workplace_name, account_type,
          email_verified, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'personal', 0, 'pending_verification')
      `;
    try {
      await this.db.prepare(insertAccountSql).bind(accountId, email, passwordHash, fullName, dateOfBirth, phoneNumber, schoolName, workplaceName).run();
    } catch (err) {
      if (/UNIQUE constraint failed/i.test(String(err?.message || ""))) {
        return { ok: false, status: 409, errors: ["Địa chỉ email này đã được đăng ký tài khoản WORD BRIDGE."] };
      }
      await this.ensureAuthCoreTables();
      await this.db.prepare(insertAccountSql).bind(accountId, email, passwordHash, fullName, dateOfBirth, phoneNumber, schoolName, workplaceName).run();
    }
    await this.db.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run().catch(async () => {
      await this.ensureAuthCoreTables();
      await this.db.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run().catch(() => {});
    });
    await this.db.prepare("INSERT OR IGNORE INTO wb_entitlements (id, account_id, plan_code, source, storage_quota_bytes) VALUES (?, ?, 'PERSONAL_FREE', 'default', ?)").bind(generateId("ent"), accountId, PLANS.PERSONAL_FREE.storageQuotaBytes).run().catch(() => {});
    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    await this.db.prepare(`
        INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at)
        VALUES (?, ?, ?, 'email_verification', ?, datetime('now', '+30 minutes'))
      `).bind(generateId("tok"), accountId, tokenHash, email).run().catch(async () => {
      await this.ensureAuthCoreTables();
      await this.db.prepare(`
          INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at)
          VALUES (?, ?, ?, 'email_verification', ?, datetime('now', '+30 minutes'))
        `).bind(generateId("tok"), accountId, tokenHash, email).run().catch(() => {});
    });
    const verifyUrl = `${this.baseUrl}/verify-email?token=${rawToken}`;
    let emailResult = { status: "BLOCKED_UNCONFIGURED" };
    try {
      emailResult = await this.emailService.sendEventEmail({
        eventType: "UserRegistered",
        templateKey: "verify_email",
        recipientEmail: email,
        accountId,
        idempotencyKey: `verify_email:${accountId}`,
        variables: { fullName, ctaUrl: verifyUrl, expiresMinutes: 30 }
      });
    } catch (mailErr) {
      console.warn("[WB-REGISTER] sendEventEmail fallback:", String(mailErr?.message || mailErr).slice(0, 160));
    }
    await this.recordAudit(accountId, "account.registered", "wb_accounts", accountId, requestMeta.ipAddress, {
      emailVerificationStatus: emailResult.status
    }).catch(() => {});
    let autoSession = null;
    if (emailResult.status !== "ACCEPTED" && this.env.ENVIRONMENT !== "test") {
      await this.db.prepare("UPDATE wb_accounts SET email_verified = 1, email_verified_at = datetime('now'), status = 'active', updated_at = datetime('now') WHERE id = ?").bind(accountId).run().catch(async () => {
        await this.db.prepare("UPDATE wb_accounts SET email_verified = 1, status = 'active', updated_at = datetime('now') WHERE id = ?").bind(accountId).run().catch(() => {});
      });
      try {
        autoSession = await this.createSession(accountId, requestMeta);
      } catch {
        await this.ensureAuthCoreTables();
        autoSession = await this.createSession(accountId, requestMeta);
      }
    }
    return {
      ok: true,
      status: 201,
      accountId,
      emailStatus: emailResult.status,
      ...(autoSession ? { session: autoSession, redirectTo: "/my-learning" } : {}),
      message: emailResult.status === "ACCEPTED"
        ? "Tài khoản đã được tạo. Vui lòng kiểm tra email xác minh."
        : autoSession
          ? "Đăng ký thành công! Đang chuyển tới không gian học tập của bạn..."
          : "Tài khoản đã được tạo. Vui lòng kiểm tra hướng dẫn xác minh tài khoản.",
      ...this.env.ENVIRONMENT === "test" && this.env.EXPOSE_TEST_TOKENS === "true" ? { verificationToken: rawToken } : {}
    };
  }
  async verifyEmailToken(rawToken, requestMeta = {}) {
    if (!rawToken || typeof rawToken !== "string") {
      return { ok: false, status: 400, error: "Thiếu mã xác minh email." };
    }
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    const tok = await this.db.prepare("SELECT id, account_id, expires_at, consumed_at FROM wb_verification_tokens WHERE token_hash = ? AND token_type = 'email_verification'").bind(tokenHash).first();
    if (!tok) return { ok: false, status: 400, error: "Liên kết xác minh không hợp lệ." };
    if (tok.consumed_at) return { ok: false, status: 400, error: "Liên kết xác minh đã được sử dụng." };
    const expiredCheck = await this.db.prepare("SELECT CASE WHEN datetime(?) < datetime('now') THEN 1 ELSE 0 END AS is_expired").bind(tok.expires_at).first();
    if (expiredCheck?.is_expired === 1) {
      return { ok: false, status: 400, error: "Liên kết xác minh đã hết hạn. Vui lòng yêu cầu gửi lại." };
    }
    const claimed = await this.db.prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ? AND consumed_at IS NULL AND expires_at > datetime('now')").bind(tok.id).run();
    if (!claimed.meta.changes) return { ok: false, status: 400, error: "Liên kết đã hết hạn hoặc đã được sử dụng." };
    await this.db.prepare("UPDATE wb_accounts SET email_verified = 1, email_verified_at = datetime('now'), status = 'active', updated_at = datetime('now') WHERE id = ?").bind(tok.account_id).run();
    const account = await this.db.prepare("SELECT id, email, full_name FROM wb_accounts WHERE id = ?").bind(tok.account_id).first();
    await this.emailService.sendEventEmail({
      eventType: "EmailVerified",
      templateKey: "welcome_registered",
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `welcome:${account.id}`,
      variables: { fullName: account.full_name, ctaUrl: `${this.baseUrl}/my-learning` }
    });
    const session = await this.createSession(account.id, requestMeta);
    await this.recordAudit(account.id, "account.email_verified", "wb_accounts", account.id, requestMeta.ipAddress, {});
    return { ok: true, account, session };
  }
  async login({ email, password }, requestMeta = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!validateEmail(normalizedEmail) || !password) {
      return { ok: false, status: 400, error: "Vui lòng nhập đầy đủ email và mật khẩu." };
    }
    const account = await this.db.prepare("SELECT id, email, password_hash, full_name, email_verified, status, failed_login_attempts, locked_until FROM wb_accounts WHERE email = ?").bind(normalizedEmail).first();
    if (!account) return { ok: false, status: 401, error: "Email hoặc mật khẩu không chính xác." };
    if (account.locked_until) {
      const lockCheck = await this.db.prepare("SELECT CASE WHEN datetime(?) > datetime('now') THEN 1 ELSE 0 END AS locked").bind(account.locked_until).first();
      if (lockCheck?.locked === 1) {
        return { ok: false, status: 429, error: "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau." };
      }
    }
    const validPwd = await verifyPassword(password, account.password_hash);
    if (!validPwd) {
      const { maxAttempts, lockoutMinutes } = await this.getSecurityPolicy();
      const attempts = (account.failed_login_attempts || 0) + 1;
      const shouldLock = attempts >= maxAttempts;
      await this.db.prepare(`UPDATE wb_accounts SET failed_login_attempts = ?, locked_until = CASE WHEN ? = 1 THEN datetime('now', '+${lockoutMinutes} minutes') ELSE NULL END, updated_at = datetime('now') WHERE id = ?`).bind(attempts, shouldLock ? 1 : 0, account.id).run();
      await this.recordAudit(account.id, "auth.login_failed", "wb_accounts", account.id, requestMeta.ipAddress, {
        attempts,
        locked: shouldLock
      });
      return { ok: false, status: 401, error: "Email hoặc mật khẩu không chính xác." };
    }
    if (account.email_verified !== 1) return { ok: false, status: 403, error: "Tài khoản chưa xác minh email." };
    if (account.status !== "active") return { ok: false, status: 403, error: "Tài khoản hiện không ở trạng thái hoạt động." };
    await this.db.prepare("UPDATE wb_accounts SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(account.id).run();
    const session = await this.createSession(account.id, requestMeta);
    await this.emailService.sendEventEmail({
      eventType: "NewLoginDetected",
      templateKey: "new_login_detected",
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `login:${session.sessionId}`,
      variables: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userAgent: requestMeta.userAgent || "Trình duyệt web",
        ipAddress: requestMeta.ipAddress || "ẩn",
        ctaUrl: `${this.baseUrl}/account/sessions`
      }
    });
    await this.recordAudit(account.id, "auth.login", "wb_sessions", session.sessionId, requestMeta.ipAddress, {
      userAgent: (requestMeta.userAgent || "").slice(0, 120)
    });
    return { ok: true, account: { id: account.id, email: account.email, fullName: account.full_name }, session };
  }
  async createSession(accountId, requestMeta = {}) {
    const rawSessionToken = randomTokenHex(32);
    const sessionTokenHash = await sha256Hex(rawSessionToken, this.tokenPepper);
    const csrfToken = randomTokenHex(24);
    const sessionId = generateId("ses");
    await this.db.prepare(`
        INSERT INTO wb_sessions (id, account_id, session_token_hash, csrf_token, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
      `).bind(sessionId, accountId, sessionTokenHash, csrfToken, requestMeta.ipAddress || null, (requestMeta.userAgent || "").slice(0, 255)).run();
    return { sessionId, rawSessionToken, csrfToken };
  }
  async authenticateSession(rawSessionToken) {
    if (!rawSessionToken) return null;
    try {
      const tokenHash = await sha256Hex(rawSessionToken, this.tokenPepper);
      let row = null;
      try {
        row = await this.db.prepare(`
        SELECT s.id AS session_id, s.csrf_token, s.account_id,
               a.email, a.full_name, a.status, a.email_verified,
               a.school_name, a.workplace_name, a.phone_number, a.date_of_birth,
               a.created_at AS account_created_at, a.updated_at AS account_updated_at,
               e.plan_code, e.storage_quota_bytes, e.expires_at AS plan_expires_at
        FROM wb_sessions s
        JOIN wb_accounts a ON a.id = s.account_id
        LEFT JOIN wb_entitlements e ON e.account_id = a.id
        WHERE s.session_token_hash = ?
          AND s.revoked_at IS NULL
          AND datetime(s.expires_at) > datetime('now')
          AND a.status = 'active'
      `).bind(tokenHash).first();
      } catch {
        row = await this.db.prepare(`
        SELECT s.id AS session_id, s.csrf_token, s.account_id,
               a.email, a.full_name, a.status, a.email_verified,
               e.plan_code, e.storage_quota_bytes, e.expires_at AS plan_expires_at
        FROM wb_sessions s
        JOIN wb_accounts a ON a.id = s.account_id
        LEFT JOIN wb_entitlements e ON e.account_id = a.id
        WHERE s.session_token_hash = ?
          AND s.revoked_at IS NULL
          AND datetime(s.expires_at) > datetime('now')
          AND a.status = 'active'
      `).bind(tokenHash).first();
      }
      if (!row) return null;
      const rolesResult = await this.db.prepare("SELECT r.code, r.name_vi FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = ?").bind(row.account_id).all();
      const permsResult = await this.db.prepare("SELECT DISTINCT p.code FROM wb_account_roles ar JOIN wb_role_permissions rp ON rp.role_id = ar.role_id JOIN wb_permissions p ON p.id = rp.permission_id WHERE ar.account_id = ?").bind(row.account_id).all();
      return {
      sessionId: row.session_id,
      csrfToken: row.csrf_token,
      accountId: row.account_id,
      email: row.email,
      fullName: row.full_name,
      schoolName: row.school_name,
      workplaceName: row.workplace_name,
      phoneNumber: row.phone_number,
      dateOfBirth: row.date_of_birth,
      createdAt: row.account_created_at || null,
      updatedAt: row.account_updated_at || null,
      planCode: row.plan_code || "PERSONAL_FREE",
      storageQuotaBytes: row.storage_quota_bytes || PLANS.PERSONAL_FREE.storageQuotaBytes,
      planExpiresAt: row.plan_expires_at,
        roles: (rolesResult.results || []).map((r) => r.code),
        roleLabels: (rolesResult.results || []).map((r) => r.name_vi),
        permissions: new Set((permsResult.results || []).map((p) => p.code))
      };
    } catch {
      return null;
    }
  }
  isSuperAdmin(user) {
    return Boolean(user && Array.isArray(user.roles) && user.roles.includes("super_admin"));
  }
  hasPermission(user, permissionCode) {
    if (!user || !Array.isArray(user.roles)) return false;
    if (user.roles.includes("super_admin")) return true;
    return Boolean(user.permissions && typeof user.permissions.has === "function" && user.permissions.has(permissionCode));
  }
  /**
   * STRICT ADMIN ROLE CHECK:
   * Only returns true when the user holds an explicitly recognized administrative role
   * from ADMIN_ROLE_CODES (never treats arbitrary non-admin roles as admin).
   */
  hasAnyAdminRole(user) {
    if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return false;
    return user.roles.some((roleCode) => ADMIN_ROLE_CODES.has(roleCode));
  }
  async revokeSession(sessionId, actorAccountId, ipAddress = null) {
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE id = ? AND account_id = ?").bind(sessionId, actorAccountId).run();
    await this.recordAudit(actorAccountId, "auth.session_revoked", "wb_sessions", sessionId, ipAddress, {});
  }
  async logoutSession(sessionId, actorAccountId, ipAddress = null) {
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE id = ? AND account_id = ?").bind(sessionId, actorAccountId).run();
    await this.recordAudit(actorAccountId, "auth.logout", "wb_sessions", sessionId, ipAddress, {});
  }
  async revokeOtherSessions(currentSessionId, actorAccountId, ipAddress = null) {
    const res = await this.db.prepare(
      "UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND id != ? AND revoked_at IS NULL"
    ).bind(actorAccountId, currentSessionId).run();
    const revokedCount = Number(res?.meta?.changes || 0);
    await this.recordAudit(actorAccountId, "auth.sessions_revoked_others", "wb_sessions", currentSessionId, ipAddress, { revokedCount });
    if (revokedCount > 0) {
      const accRow = await this.db.prepare("SELECT email FROM wb_accounts WHERE id = ?").bind(actorAccountId).first().catch(() => null);
      if (accRow?.email) {
        await this.emailService.sendEventEmail({
          eventType: "SessionsRevokedAll",
          templateKey: "session_revoked",
          recipientEmail: accRow.email,
          accountId: actorAccountId,
          idempotencyKey: `sess_rev_oth:${actorAccountId}:${Date.now()}`,
          variables: { revokedCount, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ctaUrl: `${this.baseUrl}/account/sessions` }
        }).catch(() => {});
      }
    }
    return { ok: true, revokedCount, message: revokedCount > 0 ? `Đã đăng xuất ${revokedCount} phiên khác.` : "Không có phiên đăng nhập nào khác đang hoạt động." };
  }
  async loginAdmin({ email, password }, requestMeta = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!validateEmail(normalizedEmail) || !password) {
      return { ok: false, status: 400, error: "Vui lòng nhập đầy đủ email và mật khẩu quản trị." };
    }
    const account = await this.db.prepare(
      "SELECT id, email, password_hash, full_name, email_verified, status, failed_login_attempts, locked_until FROM wb_accounts WHERE email = ?"
    ).bind(normalizedEmail).first();
    if (!account) {
      return { ok: false, status: 401, error: "Thông tin đăng nhập quản trị không chính xác." };
    }
    if (account.locked_until) {
      const lockCheck = await this.db.prepare("SELECT CASE WHEN datetime(?) > datetime('now') THEN 1 ELSE 0 END AS locked").bind(account.locked_until).first();
      if (lockCheck?.locked === 1) {
        return { ok: false, status: 429, error: "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau." };
      }
    }
    const validPwd = await verifyPassword(password, account.password_hash);
    if (!validPwd) {
      const { maxAttempts, lockoutMinutes } = await this.getSecurityPolicy();
      const attempts = (account.failed_login_attempts || 0) + 1;
      const shouldLock = attempts >= maxAttempts;
      await this.db.prepare(`UPDATE wb_accounts SET failed_login_attempts = ?, locked_until = CASE WHEN ? = 1 THEN datetime('now', '+${lockoutMinutes} minutes') ELSE NULL END, updated_at = datetime('now') WHERE id = ?`).bind(attempts, shouldLock ? 1 : 0, account.id).run();
      await this.recordAudit(account.id, "admin.login_failed", "wb_accounts", account.id, requestMeta.ipAddress, { attempts, locked: shouldLock });
      return { ok: false, status: 401, error: "Thông tin đăng nhập quản trị không chính xác." };
    }
    if (account.email_verified !== 1 || account.status !== "active") {
      return { ok: false, status: 403, error: "Tài khoản hiện không đủ điều kiện đăng nhập quản trị." };
    }
    const rolesResult = await this.db.prepare(
      "SELECT r.code FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = ?"
    ).bind(account.id).all().catch(() => ({ results: [] }));
    const roles = (rolesResult.results || []).map((r) => r.code);
    if (!this.hasAnyAdminRole({ roles })) {
      await this.recordAudit(account.id, "admin.login_denied_non_admin", "wb_accounts", account.id, requestMeta.ipAddress, {});
      return { ok: false, status: 403, error: "Tài khoản này không có quyền truy cập hệ thống quản trị. Vui lòng đăng nhập tại cổng người học." };
    }
    await this.db.prepare("UPDATE wb_accounts SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(account.id).run();
    const session = await this.createSession(account.id, requestMeta);
    await this.recordAudit(account.id, "admin.login_password_verified", "wb_sessions", session.sessionId, requestMeta.ipAddress, {
      userAgent: (requestMeta.userAgent || "").slice(0, 120)
    });
    return { ok: true, account: { id: account.id, email: account.email, fullName: account.full_name }, session };
  }
  async getUserPreferences(accountId) {
    const defaults = {
      theme: "light",
      language: "vi",
      fontSize: "md",
      lineHeight: "normal",
      notifyLearning: true,
      notifyPlatform: true,
      notifyRecommendations: false,
      syncEnabled: true
    };
    const row = await this.db.prepare(
      "SELECT preferred_ui_language, notification_preferences_json, privacy_settings_json FROM wb_profiles WHERE account_id = ?"
    ).bind(accountId).first().catch(() => null);
    if (!row) return defaults;
    const notif = safeJsonParse(row.notification_preferences_json, {});
    const priv = safeJsonParse(row.privacy_settings_json, {});
    return {
      theme: ["light", "dark", "auto"].includes(priv.ui_theme) ? priv.ui_theme : defaults.theme,
      language: row.preferred_ui_language === "en" ? "en" : "vi",
      fontSize: ["sm", "md", "lg"].includes(priv.font_size) ? priv.font_size : defaults.fontSize,
      lineHeight: ["compact", "normal", "relaxed"].includes(priv.line_height) ? priv.line_height : defaults.lineHeight,
      notifyLearning: typeof notif.lesson_completed === "boolean" ? notif.lesson_completed : defaults.notifyLearning,
      notifyPlatform: typeof notif.security_alerts === "boolean" ? notif.security_alerts : defaults.notifyPlatform,
      notifyRecommendations: typeof notif.marketing === "boolean" ? notif.marketing : defaults.notifyRecommendations,
      syncEnabled: typeof priv.sync_enabled === "boolean" ? priv.sync_enabled : defaults.syncEnabled
    };
  }
  async updateUserPreferences(accountId, payload, ipAddress = null) {
    const theme = ["light", "dark", "auto"].includes(payload?.theme) ? payload.theme : "light";
    const language = payload?.language === "en" ? "en" : "vi";
    const fontSize = ["sm", "md", "lg"].includes(payload?.fontSize) ? payload.fontSize : "md";
    const lineHeight = ["compact", "normal", "relaxed"].includes(payload?.lineHeight) ? payload.lineHeight : "normal";
    const notifyLearning = Boolean(payload?.notifyLearning);
    const notifyPlatform = Boolean(payload?.notifyPlatform);
    const notifyRecommendations = Boolean(payload?.notifyRecommendations);
    const syncEnabled = Boolean(payload?.syncEnabled);

    await this.db.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run().catch(async () => {
      await this.ensureAuthCoreTables();
      await this.db.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run().catch(() => {});
    });
    const cur = await this.db.prepare("SELECT notification_preferences_json, privacy_settings_json FROM wb_profiles WHERE account_id = ?").bind(accountId).first().catch(() => null);
    const notif = { ...safeJsonParse(cur?.notification_preferences_json, {}), lesson_completed: notifyLearning, review_due: notifyLearning, security_alerts: notifyPlatform, marketing: notifyRecommendations };
    const priv = { ...safeJsonParse(cur?.privacy_settings_json, {}), ui_theme: theme, font_size: fontSize, line_height: lineHeight, sync_enabled: syncEnabled };
    await this.db.prepare(
      "UPDATE wb_profiles SET preferred_ui_language = ?, notification_preferences_json = ?, privacy_settings_json = ?, updated_at = datetime('now') WHERE account_id = ?"
    ).bind(language, JSON.stringify(notif), JSON.stringify(priv), accountId).run();
    await this.recordAudit(accountId, "account.preferences_updated", "wb_profiles", accountId, ipAddress, { theme, fontSize, lineHeight });
    return {
      ok: true,
      message: "Đã lưu tùy chọn nền tảng thành công.",
      preferences: { theme, language, fontSize, lineHeight, notifyLearning, notifyPlatform, notifyRecommendations, syncEnabled }
    };
  }
  async clearLearningData(accountId, ipAddress = null) {
    const tables = [
      "wb_learner_progress",
      "wb_lesson_submissions",
      "wb_practice_results",
      "wb_reader_progress",
      "wb_skill_reviews",
      "wb_lesson_notes",
      "wb_reading_attempts",
      "wb_listening_attempts"
    ];
    for (const tbl of tables) {
      await this.db.prepare(`DELETE FROM ${tbl} WHERE account_id = ?`).bind(accountId).run().catch(() => {});
    }
    await this.recordAudit(accountId, "account.learning_data_cleared", "wb_accounts", accountId, ipAddress, {});
    return { ok: true, message: "Đã xóa toàn bộ dữ liệu học tập của bạn. Thông tin tài khoản và bảo mật được giữ nguyên." };
  }
  async requestPasswordReset(email, ipAddress = null) {
    const normalized = String(email || "").trim().toLowerCase();
    const account = await this.db.prepare("SELECT id, email, full_name FROM wb_accounts WHERE email = ?").bind(normalized).first();
    if (!account) return { ok: true };
    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    const tokenId = generateId("rst");
    await this.db.prepare("INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at) VALUES (?, ?, ?, 'password_reset', ?, datetime('now', '+30 minutes'))").bind(tokenId, account.id, tokenHash, account.email).run();
    await this.emailService.sendEventEmail({
      eventType: "PasswordResetRequested",
      templateKey: "password_reset",
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `pwd_reset:${tokenId}`,
      variables: { email: account.email, ctaUrl: `${this.baseUrl}/reset-password?token=${rawToken}`, expiresMinutes: 30 }
    });
    await this.recordAudit(account.id, "auth.password_reset_requested", "wb_accounts", account.id, ipAddress, {});
    return { ok: true, ...this.env.ENVIRONMENT === "test" && this.env.EXPOSE_TEST_TOKENS === "true" ? { resetToken: rawToken } : {} };
  }
  async resetPassword({ token, newPassword, confirmPassword }, requestMeta = {}) {
    if (!token || typeof token !== "string") {
      return { ok: false, status: 400, error: "Thiếu mã đặt lại mật khẩu." };
    }
    if (!newPassword || newPassword !== confirmPassword) {
      return { ok: false, status: 400, error: "Mật khẩu xác nhận không khớp." };
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { ok: false, status: 400, error: strength.error };
    }
    const tokenHash = await sha256Hex(token, this.tokenPepper);
    const tok = await this.db.prepare("SELECT id, account_id, expires_at, consumed_at FROM wb_verification_tokens WHERE token_hash = ? AND token_type = 'password_reset'").bind(tokenHash).first();
    if (!tok) return { ok: false, status: 400, error: "Liên kết đặt lại mật khẩu không hợp lệ." };
    if (tok.consumed_at) return { ok: false, status: 400, error: "Liên kết đặt lại mật khẩu đã được sử dụng." };
    const expiredCheck = await this.db.prepare("SELECT CASE WHEN datetime(?) < datetime('now') THEN 1 ELSE 0 END AS is_expired").bind(tok.expires_at).first();
    if (expiredCheck?.is_expired === 1) {
      return { ok: false, status: 400, error: "Liên kết đặt lại mật khẩu đã hết hạn." };
    }
    const passwordHash = await hashPassword(newPassword);
    const claimed = await this.db.prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ? AND consumed_at IS NULL AND expires_at > datetime('now')").bind(tok.id).run();
    if (!claimed.meta.changes) return { ok: false, status: 400, error: "Liên kết đã hết hạn hoặc đã được sử dụng." };
    await this.db.prepare("UPDATE wb_accounts SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, tok.account_id).run();
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(tok.account_id).run();
    const account = await this.db.prepare("SELECT id, email FROM wb_accounts WHERE id = ?").bind(tok.account_id).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: "PasswordChanged",
        templateKey: "password_changed",
        recipientEmail: account.email,
        accountId: account.id,
        idempotencyKey: `pwd_changed:${tok.id}`,
        variables: { timestamp: (/* @__PURE__ */ new Date()).toISOString(), ctaUrl: `${this.baseUrl}/account/security` }
      });
    }
    await this.recordAudit(tok.account_id, "auth.password_reset_completed", "wb_accounts", tok.account_id, requestMeta.ipAddress, {});
    return { ok: true, message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." };
  }
  async updateProfile(accountId, payload, ipAddress = null) {
    const fullName = String(payload.fullName || "").trim();
    const phoneNumber = String(payload.phoneNumber || "").trim();
    const schoolName = String(payload.schoolName || "").trim();
    const workplaceName = String(payload.workplaceName || "").trim();
    const dateOfBirth = String(payload.dateOfBirth || "").trim();
    if (fullName.length < 2) {
      return { ok: false, status: 400, error: "Họ và tên phải có tối thiểu 2 ký tự." };
    }
    if (!phoneNumber || (!schoolName && !workplaceName)) {
      return { ok: false, status: 400, error: "Số điện thoại và ít nhất một trong hai thông tin (Trường học hoặc Nơi làm việc) không được để trống." };
    }
    await this.db.prepare(`
        UPDATE wb_accounts
        SET full_name = ?, phone_number = ?, school_name = ?, workplace_name = ?,
            date_of_birth = CASE WHEN ? != '' THEN ? ELSE date_of_birth END,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(fullName, phoneNumber, schoolName, workplaceName, dateOfBirth, dateOfBirth, accountId).run();
    await this.recordAudit(accountId, "account.profile_updated", "wb_accounts", accountId, ipAddress, {});
    const accRow = await this.db.prepare("SELECT email FROM wb_accounts WHERE id = ?").bind(accountId).first().catch(() => null);
    if (accRow?.email) {
      await this.emailService.sendEventEmail({
        eventType: "ProfileUpdated",
        templateKey: "profile_updated",
        recipientEmail: accRow.email,
        accountId,
        idempotencyKey: `prof_upd:${accountId}:${Date.now()}`,
        variables: { fullName, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ctaUrl: `${this.baseUrl}/profile` }
      }).catch(() => {});
    }
    return { ok: true, message: "Đã cập nhật hồ sơ cá nhân." };
  }
  async changePassword(accountId, { currentPassword, newPassword, confirmPassword }, ipAddress = null) {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      return { ok: false, status: 400, error: "Vui lòng nhập mật khẩu hiện tại và xác nhận mật khẩu mới khớp nhau." };
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { ok: false, status: 400, error: strength.error };
    }
    const account = await this.db.prepare("SELECT id, email, password_hash FROM wb_accounts WHERE id = ?").bind(accountId).first();
    if (!account) return { ok: false, status: 404, error: "Tài khoản không tồn tại." };
    const valid = await verifyPassword(currentPassword, account.password_hash);
    if (!valid) return { ok: false, status: 401, error: "Mật khẩu hiện tại không chính xác." };
    const newHash = await hashPassword(newPassword);
    await this.db.prepare("UPDATE wb_accounts SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(newHash, accountId).run();
    await this.emailService.sendEventEmail({
      eventType: "PasswordChanged",
      templateKey: "password_changed",
      recipientEmail: account.email,
      accountId: account.id,
      idempotencyKey: `pwd_chg:${accountId}:${Date.now()}`,
      variables: { timestamp: (/* @__PURE__ */ new Date()).toISOString(), ctaUrl: `${this.baseUrl}/account/security` }
    });
    await this.recordAudit(accountId, "auth.password_changed", "wb_accounts", accountId, ipAddress, {});
    return { ok: true, message: "Đổi mật khẩu thành công." };
  }
  // ---- WebAuthn / FIDO2 Passkeys ----
  async ensurePasskeyTables() {
    await this.db.prepare("CREATE TABLE IF NOT EXISTS wb_passkeys (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, credential_id TEXT NOT NULL UNIQUE, public_key_cose TEXT NOT NULL, sign_count INTEGER NOT NULL DEFAULT 0, display_name TEXT NOT NULL, transports_json TEXT DEFAULT '[]', revoked_at TEXT, last_used_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))").run();
    await this.db.prepare("CREATE TABLE IF NOT EXISTS wb_webauthn_challenges (id TEXT PRIMARY KEY, account_id TEXT, challenge TEXT NOT NULL UNIQUE, challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')), expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))").run();
  }
  async createPasskeyRegistrationOptions(account) {
    const challenge = randomTokenHex(32);
    const id = generateId("wac");
    try {
      await this.db.prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'registration', datetime('now', '+5 minutes'))").bind(id, account.accountId, challenge).run();
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await this.ensurePasskeyTables();
      await this.db.prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'registration', datetime('now', '+5 minutes'))").bind(id, account.accountId, challenge).run();
    }
    const existing = (await this.db.prepare("SELECT credential_id FROM wb_passkeys WHERE account_id = ? AND revoked_at IS NULL").bind(account.accountId).all()).results || [];
    return {
      ok: true,
      challengeId: id,
      publicKey: {
        challenge,
        rp: { id: this.env.WEBAUTHN_RP_ID || "wordbridge.io.vn", name: this.env.WEBAUTHN_RP_NAME || "WORD BRIDGE" },
        user: { id: Buffer2.from(account.accountId).toString("base64url"), name: account.email, displayName: account.fullName },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        excludeCredentials: existing.map((c) => ({ id: c.credential_id, type: "public-key" })),
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
        timeout: 6e4
      }
    };
  }
  async consumeChallenge(id, accountId, type) {
    return this.db.prepare(`
      UPDATE wb_webauthn_challenges SET consumed_at=datetime('now')
      WHERE id=? AND account_id IS ? AND challenge_type=? AND consumed_at IS NULL
        AND expires_at > datetime('now') RETURNING challenge
    `).bind(id, accountId, type).first();
  }
  async verifyAndStorePasskeyRegistration(accountId, { challengeId, credential, displayName }, ipAddress = null) {
    const failure2 = { ok: false, status: 400, error: "Vui lòng bắt đầu lại thao tác thêm Passkey." };
    if (!challengeId || !credential) return failure2;
    const row = await this.consumeChallenge(challengeId, accountId, "registration");
    if (!row) return failure2;
    let verified;
    try {
      verified = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: row.challenge,
        expectedOrigin: this.baseUrl,
        expectedRPID: this.env.WEBAUTHN_RP_ID || "wordbridge.io.vn",
        requireUserVerification: true
      });
    } catch {
      return failure2;
    }
    if (!verified.verified) return failure2;
    const key = verified.registrationInfo.credential;
    const id = generateId("pk");
    displayName = String(displayName || "Passkey").slice(0, 80);
    await this.db.prepare(`INSERT INTO wb_passkeys (id, account_id, credential_id, public_key_cose, sign_count, display_name, transports_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
      id,
      accountId,
      key.id,
      "verified:" + Buffer2.from(key.publicKey).toString("base64url"),
      key.counter,
      displayName,
      JSON.stringify(key.transports || [])
    ).run();
    const account = await this.db.prepare("SELECT email FROM wb_accounts WHERE id = ?").bind(accountId).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: "PasskeyAdded",
        templateKey: "passkey_added",
        recipientEmail: account.email,
        accountId,
        idempotencyKey: `passkey_add:${id}`,
        variables: { passkeyName: displayName, ctaUrl: `${this.baseUrl}/account/passkeys` }
      });
    }
    await this.recordAudit(accountId, "auth.passkey_added", "wb_passkeys", id, ipAddress, { displayName });
    return { ok: true, passkeyId: id };
  }
  async createPasskeyAuthOptions(accountId = null) {
    const challenge = randomTokenHex(32);
    const id = generateId("wac");
    try {
      await this.db.prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'authentication', datetime('now', '+5 minutes'))").bind(id, accountId, challenge).run();
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      await this.ensurePasskeyTables();
      await this.db.prepare("INSERT INTO wb_webauthn_challenges (id, account_id, challenge, challenge_type, expires_at) VALUES (?, ?, ?, 'authentication', datetime('now', '+5 minutes'))").bind(id, accountId, challenge).run();
    }
    return {
      ok: true,
      challengeId: id,
      publicKey: {
        challenge,
        rpId: this.env.WEBAUTHN_RP_ID || "wordbridge.io.vn",
        userVerification: "required",
        timeout: 6e4
      }
    };
  }
  async verifyPasskeyAssertion({ challengeId, credential }, requestMeta = {}) {
    const failure2 = { ok: false, status: 401, error: "Không thể xác minh Passkey. Bạn có thể đăng nhập bằng mật khẩu." };
    if (!challengeId || !credential?.id) return failure2;
    const row = await this.consumeChallenge(challengeId, null, "authentication");
    if (!row) return failure2;
    const pk = await this.db.prepare(`SELECT k.* FROM wb_passkeys k JOIN wb_accounts a ON a.id=k.account_id
      WHERE k.credential_id=? AND k.revoked_at IS NULL AND a.status='active' AND a.email_verified=1
      AND (a.locked_until IS NULL OR a.locked_until <= datetime('now'))`).bind(credential.id).first();
    if (!pk?.public_key_cose?.startsWith("verified:")) return failure2;
    let verified;
    try {
      verified = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: row.challenge,
        expectedOrigin: this.baseUrl,
        expectedRPID: this.env.WEBAUTHN_RP_ID || "wordbridge.io.vn",
        requireUserVerification: true,
        credential: { id: pk.credential_id, counter: pk.sign_count, publicKey: Buffer2.from(pk.public_key_cose.slice(9), "base64url") }
      });
    } catch {
      return failure2;
    }
    if (!verified.verified) return failure2;
    const updated = await this.db.prepare(`UPDATE wb_passkeys SET sign_count=?, last_used_at=datetime('now')
      WHERE id=? AND sign_count=? AND revoked_at IS NULL`).bind(verified.authenticationInfo.newCounter, pk.id, pk.sign_count).run();
    if (!updated.meta.changes) return failure2;
    const session = await this.createSession(pk.account_id, requestMeta);
    await this.recordAudit(pk.account_id, "auth.passkey_login", "wb_passkeys", pk.id, requestMeta.ipAddress, {});
    return { ok: true, accountId: pk.account_id, session };
  }
  async revokePasskey(accountId, passkeyId, ipAddress = null) {
    const pk = await this.db.prepare("SELECT id, display_name FROM wb_passkeys WHERE id = ? AND account_id = ?").bind(passkeyId, accountId).first();
    if (!pk) return { ok: false, status: 404, error: "Không tìm thấy passkey thuộc tài khoản của bạn." };
    await this.db.prepare("UPDATE wb_passkeys SET revoked_at = datetime('now') WHERE id = ?").bind(passkeyId).run();
    const account = await this.db.prepare("SELECT email FROM wb_accounts WHERE id = ?").bind(accountId).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: "PasskeyRevoked",
        templateKey: "passkey_revoked",
        recipientEmail: account.email,
        accountId,
        idempotencyKey: `passkey_rev:${passkeyId}`,
        variables: { passkeyName: pk.display_name, ctaUrl: `${this.baseUrl}/account/passkeys` }
      });
    }
    await this.recordAudit(accountId, "auth.passkey_revoked", "wb_passkeys", passkeyId, ipAddress, {});
    return { ok: true };
  }
  async recordAudit(actorAccountId, action, resourceType, resourceId, ipAddress = null, metadata = {}) {
    try {
      await this.db.prepare("INSERT INTO wb_audit_logs (id, actor_account_id, action, resource_type, resource_id, ip_address, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(generateId("aud"), actorAccountId, action, resourceType, resourceId, ipAddress, JSON.stringify(metadata)).run();
    } catch (err) {
      if (!isMissingTableError(err)) console.warn("[WB-AUDIT]", String(err?.message || err).slice(0, 120));
    }
  }
};

// src/services/student-benefit-service.js
var StudentBenefitService = class {
  static {
    __name(this, "StudentBenefitService");
  }
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = env.APP_BASE_URL || "https://wordbridge.io.vn";
    this.tokenPepper = env.TOKEN_PEPPER || "";
  }
  async requestVerification(accountId, { schoolEmail, verificationMethod = "school_email_only" }) {
    if (verificationMethod !== "school_email_only") {
      return {
        ok: false,
        status: 400,
        error: "Chính sách sinh viên WORD BRIDGE chỉ chấp nhận xác minh duy nhất qua email sinh viên do trường cấp. Không nhận ảnh thẻ sinh viên, giấy xác nhận hay hồ sơ thay thế."
      };
    }
    const normalized = String(schoolEmail || "").trim().toLowerCase();
    if (!isAcademicSchoolEmail(normalized)) {
      return {
        ok: false,
        status: 400,
        error: "Địa chỉ email không thuộc tên miền giáo dục hợp lệ do trường cấp (ví dụ: @*.edu.vn, @*.edu, @*.ac.*)."
      };
    }
    const existingAccountBenefit = await this.db.prepare("SELECT id, status FROM wb_student_benefits WHERE account_id = ?").bind(accountId).first();
    if (existingAccountBenefit) {
      return {
        ok: false,
        status: 409,
        error: "Tài khoản này đã đăng ký hoặc đã sử dụng quyền lợi sinh viên (chỉ áp dụng một lần duy nhất)."
      };
    }
    const existingSchoolEmail = await this.db.prepare("SELECT id FROM wb_student_benefits WHERE school_email = ?").bind(normalized).first();
    if (existingSchoolEmail) {
      return {
        ok: false,
        status: 409,
        error: "Email sinh viên này đã được sử dụng cho quyền lợi sinh viên trước đó."
      };
    }
    const benefitId = generateId("stu");
    await this.db.prepare(`
        INSERT INTO wb_student_benefits (id, account_id, school_email, verification_method, status)
        VALUES (?, ?, ?, 'school_email_only', 'pending')
      `).bind(benefitId, accountId, normalized).run();
    const rawToken = randomTokenHex(32);
    const tokenHash = await sha256Hex(rawToken, this.tokenPepper);
    await this.db.prepare(`
        INSERT INTO wb_verification_tokens (id, account_id, token_hash, token_type, target_value, expires_at)
        VALUES (?, ?, ?, 'student_email_verification', ?, datetime('now', '+24 hours'))
      `).bind(generateId("stok"), accountId, tokenHash, normalized).run();
    const verifyUrl = `${this.baseUrl}/account/student-benefit?verify_token=${rawToken}`;
    await this.emailService.sendEventEmail({
      eventType: "StudentVerificationRequested",
      templateKey: "verify_email",
      recipientEmail: normalized,
      accountId,
      idempotencyKey: `student_verify:${benefitId}`,
      variables: {
        ctaUrl: verifyUrl,
        expiresMinutes: 1440,
        subjectOverride: "Xác minh email sinh viên WORD BRIDGE (03 tháng Thành viên)"
      }
    });
    return {
      ok: true,
      benefitId,
      ...this.env.ENVIRONMENT === "test" && this.env.EXPOSE_TEST_TOKENS === "true" ? { verificationToken: rawToken } : {}
    };
  }
  async confirmStudentEmail(rawToken) {
    const tokenHash = await sha256Hex(rawToken || "", this.tokenPepper);
    const tok = await this.db.prepare(`
        SELECT id, account_id, target_value, expires_at, consumed_at
        FROM wb_verification_tokens
        WHERE token_hash = ? AND token_type = 'student_email_verification'
      `).bind(tokenHash).first();
    if (!tok || tok.consumed_at) {
      return { ok: false, status: 400, error: "Liên kết xác minh email sinh viên không hợp lệ hoặc đã dùng." };
    }
    await this.db.prepare("UPDATE wb_verification_tokens SET consumed_at = datetime('now') WHERE id = ?").bind(tok.id).run();
    await this.db.prepare(`
        UPDATE wb_student_benefits
        SET status = 'active', activated_at = datetime('now'), expires_at = datetime('now', '+3 months'), updated_at = datetime('now')
        WHERE account_id = ? AND school_email = ?
      `).bind(tok.account_id, tok.target_value).run();
    const benefit = await this.db.prepare("SELECT id, school_email, expires_at FROM wb_student_benefits WHERE account_id = ?").bind(tok.account_id).first();
    await this.db.prepare(`
        UPDATE wb_entitlements
        SET plan_code = 'PERSONAL_PLUS', source = 'student_benefit',
            storage_quota_bytes = ?, starts_at = datetime('now'), expires_at = ?, updated_at = datetime('now')
        WHERE account_id = ?
      `).bind(PLANS.PERSONAL_PLUS.storageQuotaBytes, benefit.expires_at, tok.account_id).run();
    const account = await this.db.prepare("SELECT email FROM wb_accounts WHERE id = ?").bind(tok.account_id).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: "StudentBenefitActivated",
        templateKey: "student_benefit_activated",
        recipientEmail: account.email,
        accountId: tok.account_id,
        idempotencyKey: `student_activated:${benefit.id}`,
        variables: { schoolEmail: benefit.school_email, expiresAt: benefit.expires_at, ctaUrl: `${this.baseUrl}/account/subscription` }
      });
    }
    return { ok: true, benefit };
  }
  async processExpiredBenefits() {
    const expiredRows = await this.db.prepare(`
        SELECT sb.id, sb.account_id, sb.school_email, a.email
        FROM wb_student_benefits sb
        JOIN wb_accounts a ON a.id = sb.account_id
        JOIN wb_entitlements e ON e.account_id = sb.account_id
        WHERE sb.status = 'active'
          AND datetime(sb.expires_at) <= datetime('now')
          AND e.source = 'student_benefit'
      `).all();
    let downgraded = 0;
    for (const row of expiredRows.results || []) {
      await this.db.prepare("UPDATE wb_student_benefits SET status = 'expired', expired_notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(row.id).run();
      await this.db.prepare(`
          UPDATE wb_entitlements
          SET plan_code = 'PERSONAL_FREE', source = 'default',
              storage_quota_bytes = ?, expires_at = NULL, updated_at = datetime('now')
          WHERE account_id = ?
        `).bind(PLANS.PERSONAL_FREE.storageQuotaBytes, row.account_id).run();
      await this.emailService.sendEventEmail({
        eventType: "StudentBenefitExpired",
        templateKey: "student_benefit_expired",
        recipientEmail: row.email,
        accountId: row.account_id,
        idempotencyKey: `student_expired:${row.id}`,
        variables: { ctaUrl: `${this.baseUrl}/account/subscription` }
      });
      downgraded += 1;
    }
    return { downgraded };
  }
};

// src/services/jobs-service.js
var JobsService = class {
  static {
    __name(this, "JobsService");
  }
  constructor(db, emailService, studentBenefitService, r2Service = null) {
    this.db = db;
    this.emailService = emailService;
    this.studentBenefitService = studentBenefitService;
    this.r2Service = r2Service;
  }
  async runJob(jobName) {
    const job = await this.db.prepare("SELECT * FROM wb_background_jobs WHERE job_name = ?").bind(jobName).first();
    if (!job) {
      throw new Error(`Không tìm thấy tác vụ nền: ${jobName}`);
    }
    if (job.status === "paused") {
      return { skipped: true, reason: "Tác vụ đang tạm dừng." };
    }
    if (job.consecutive_failures >= job.max_consecutive_failures) {
      return { skipped: true, reason: "Tác vụ đã chạm ngưỡng lỗi liên tiếp và tự động dừng để tránh vòng lặp vô hạn." };
    }
    try {
      let summary = {};
      if (jobName === "student_benefit_expiration_sync") {
        summary = await this.studentBenefitService.processExpiredBenefits();
      } else if (jobName === "cleanup_expired_tokens_and_sessions") {
        const resTokens = await this.db.prepare("DELETE FROM wb_verification_tokens WHERE datetime(expires_at) < datetime('now', '-7 days')").run();
        const resSessions = await this.db.prepare("DELETE FROM wb_sessions WHERE datetime(expires_at) < datetime('now', '-30 days')").run();
        const resStates = await this.db.prepare("DELETE FROM wb_oauth_states WHERE datetime(expires_at) < datetime('now', '-1 days')").run();
        const resChallenges = await this.db.prepare("DELETE FROM wb_webauthn_challenges WHERE datetime(expires_at) < datetime('now', '-1 days')").run();
        const resAdminSess = await this.db.prepare("DELETE FROM wb_admin_sessions WHERE datetime(expires_at) < datetime('now')").run().catch(() => ({ meta: { changes: 0 } }));
        let cleanedTempAudio = 0;
        try {
          const expiredAudio = (await this.db.prepare(
            "SELECT id, r2_audio_key FROM wb_speaking_sessions WHERE retain_long_term = 0 AND r2_audio_key IS NOT NULL AND audio_expires_at IS NOT NULL AND datetime(audio_expires_at) <= datetime('now') LIMIT 50"
          ).all()).results || [];
          for (const row of expiredAudio) {
            if (this.r2Service?.isAvailable() && this.r2Service.bucket?.delete) {
              await this.r2Service.bucket.delete(row.r2_audio_key).catch(() => {});
            }
            await this.db.prepare("UPDATE wb_speaking_sessions SET r2_audio_key = NULL, updated_at = datetime('now') WHERE id = ?").bind(row.id).run();
            cleanedTempAudio++;
          }
        } catch {}
        summary = {
          cleanedTokens: resTokens.meta?.changes || 0,
          cleanedSessions: resSessions.meta?.changes || 0,
          cleanedOAuthStates: resStates.meta?.changes || 0,
          cleanedWebAuthnChallenges: resChallenges.meta?.changes || 0,
          cleanedAdminSessions: resAdminSess.meta?.changes || 0,
          cleanedTempAudio
        };
      } else if (jobName === "email_retry_dispatcher") {
        const pending = await this.db.prepare(`
            SELECT id FROM wb_email_events
            WHERE delivery_status = 'RETRYING'
              AND (next_retry_at IS NULL OR datetime(next_retry_at) <= datetime('now'))
            LIMIT 25
          `).all();
        const outcomes = [];
        for (const item of pending.results || []) {
          outcomes.push(await this.emailService.retryQueuedEvent(item.id));
        }
        summary = {
          processedCount: outcomes.length,
          succeededCount: outcomes.filter((o) => o.ok).length,
          outcomes
        };
      } else if (jobName === "system_health_monitor") {
        const dbCheck = await this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_languages").first();
        summary = { languagesCount: dbCheck?.cnt || 0, status: "healthy" };
      } else {
        summary = { note: "Tác vụ đã chạy kiểm tra trạng thái chuẩn." };
      }
      await this.db.prepare(`
          UPDATE wb_background_jobs
          SET last_run_at = datetime('now'), last_result_status = 'success',
              last_error = NULL, consecutive_failures = 0, updated_at = datetime('now')
          WHERE job_name = ?
        `).bind(jobName).run();
      return { ok: true, jobName, summary };
    } catch (err) {
      const nextFailures = (job.consecutive_failures || 0) + 1;
      const nextStatus = nextFailures >= job.max_consecutive_failures ? "error" : job.status;
      await this.db.prepare(`
          UPDATE wb_background_jobs
          SET last_run_at = datetime('now'), last_result_status = 'failed',
              last_error = ?, consecutive_failures = ?, status = ?, updated_at = datetime('now')
          WHERE job_name = ?
        `).bind(String(err.message).slice(0, 500), nextFailures, nextStatus, jobName).run();
      return { ok: false, jobName, error: err.message };
    }
  }
  async runScheduledSweep() {
    const jobs = [
      "student_benefit_expiration_sync",
      "cleanup_expired_tokens_and_sessions",
      "email_retry_dispatcher",
      "system_health_monitor"
    ];
    const results = [];
    for (const j of jobs) {
      results.push(await this.runJob(j));
    }
    return results;
  }
};

// storage/r2-adapter.js
var ALLOWED_R2_PREFIXES = Object.freeze([
  "branding/",
  "learning/chinese/",
  "learning/english/",
  "private/speaking/",
  "specialized/chinese/",
  "specialized/english/",
  "dictionary/",
  "audio/",
  "video/",
  "exercises/",
  "reader/",
  "user-content/",
  "system-assets/",
  "backups/"
]);
var FORBIDDEN_R2_PATTERNS = [
  /^specialized\/russian\//i,
  /^learning\/(japanese|korean)\//i,
  /^specialized\/(japanese|korean)\//i,
  /^examinations\//i,
  /learner-meet.*record/i,
  /recordings?\//i,
  /\.\./
];
var ALLOWED_CONTENT_TYPES = /* @__PURE__ */ new Set([
  "image/svg+xml",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/json",
  "text/plain",
  "text/markdown",
  "text/vtt"
]);
var MAX_UPLOAD_BYTES_DEFAULT = 25 * 1024 * 1024;
function validateObjectKey(key) {
  if (typeof key !== "string" || !key.trim()) {
    return { valid: false, error: "Object key không hợp lệ." };
  }
  const normalized = key.trim().replace(/^\/+/, "");
  for (const pattern of FORBIDDEN_R2_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        valid: false,
        error: `Object key bị từ chối theo chính sách phạm vi/quyền riêng tư WORD BRIDGE: ${normalized}`
      };
    }
  }
  const hasAllowedPrefix = ALLOWED_R2_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!hasAllowedPrefix) {
    return {
      valid: false,
      error: `Object key phải bắt đầu bằng một trong các tiền tố chuẩn: ${ALLOWED_R2_PREFIXES.join(", ")}`
    };
  }
  return { valid: true, key: normalized };
}
__name(validateObjectKey, "validateObjectKey");
var R2StorageService = class {
  static {
    __name(this, "R2StorageService");
  }
  constructor(r2Bucket) {
    this.bucket = r2Bucket;
  }
  isAvailable() {
    return Boolean(this.bucket);
  }
  ensureAvailable() {
    if (!this.bucket) {
      throw new Error("R2 bucket `word` chưa được gắn binding trong môi trường hiện tại.");
    }
  }
  async uploadObject({ key, body, contentType, visibility = "private", uploadedBy = "system", maxBytes = MAX_UPLOAD_BYTES_DEFAULT }) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new Error(`Content-Type không được phép: ${contentType}`);
    }
    const byteLength = body instanceof ArrayBuffer ? body.byteLength : body instanceof Uint8Array ? body.byteLength : typeof body === "string" ? new TextEncoder().encode(body).byteLength : 0;
    if (byteLength <= 0 || byteLength > maxBytes) {
      throw new Error(`Dung lượng tệp (${byteLength} bytes) vượt quá giới hạn cho phép (${maxBytes} bytes).`);
    }
    await this.bucket.put(keyCheck.key, body, {
      httpMetadata: { contentType },
      customMetadata: {
        visibility,
        uploadedBy,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        platform: "WORD_BRIDGE"
      }
    });
    return {
      key: keyCheck.key,
      contentType,
      size: byteLength,
      visibility
    };
  }
  async getObject(key, { allowPrivate = false } = {}) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    const obj = await this.bucket.get(keyCheck.key);
    if (!obj) return null;
    const visibility = obj.customMetadata?.visibility || "private";
    if (visibility === "private" && !allowPrivate) {
      throw new Error("Không có quyền truy cập đối tượng riêng tư trong R2.");
    }
    return obj;
  }
  async deleteObject(key) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    if (typeof this.bucket.delete === "function") {
      await this.bucket.delete(keyCheck.key);
    }
    return { deleted: true, key: keyCheck.key };
  }
  async listPrefix(prefix = "", limit = 100) {
    this.ensureAvailable();
    if (!prefix) {
      return this.bucket.list({ limit });
    }
    const keyCheck = validateObjectKey(prefix.endsWith("/") ? prefix : `${prefix}/`);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    return this.bucket.list({ prefix: keyCheck.key, limit });
  }
};

// src/modules/dictionary/dictionary-service.js
function memoryState(item) {
  if (!item) return "new";
  const reps = Number(item.repetitions || 0);
  if (item.mastery_status === "mastered" && reps >= 4) return "mastered";
  if (reps >= 2 || item.mastery_status === "reviewing") return "reviewing";
  if (reps >= 1 || item.mastery_status === "learning") return "learning";
  return "new";
}
__name(memoryState, "memoryState");
var DictionaryService = class {
  static {
    __name(this, "DictionaryService");
  }
  constructor(db) {
    this.db = db;
  }
  async search({ q = "", language = "", level = "", pos = "", topic = "", domain = "", limit = 30, offset = 0 } = {}) {
    const clauses = ["review_status = 'published'"];
    const params = [];
    if (language) {
      const normLang = normalizeLanguageCode(language);
      if (!normLang) {
        return { entries: [], total: 0, error: "Ngôn ngữ tra cứu không thuộc phạm vi Trung – Anh." };
      }
      clauses.push("language_code = ?");
      params.push(normLang);
    }
    if (level) {
      clauses.push("level_ref = ?");
      params.push(level);
    }
    if (pos) {
      clauses.push("part_of_speech LIKE ?");
      params.push(`%${pos}%`);
    }
    if (topic) {
      clauses.push("topic LIKE ?");
      params.push(`%${topic}%`);
    }
    if (domain) {
      clauses.push("specialized_domain = ?");
      params.push(domain);
    }
    if (q && q.trim()) {
      const like = `%${q.trim().toLowerCase()}%`;
      clauses.push(`(
        LOWER(headword) LIKE ? OR
        LOWER(normalized_headword) LIKE ? OR
        LOWER(phonetic) LIKE ? OR
        LOWER(COALESCE(ipa_or_pinyin, '')) LIKE ? OR
        LOWER(meaning_vi) LIKE ? OR
        LOWER(target_definition) LIKE ? OR
        LOWER(examples_json) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }
    const whereSql = clauses.join(" AND ");
    const countRow = await this.db.prepare(`SELECT COUNT(*) AS total FROM wb_public_dictionary_entries WHERE ${whereSql}`).bind(...params).first();
    const rows = await this.db.prepare(`
        SELECT id, language_code, slug, headword, phonetic, ipa_or_pinyin, tone_pattern,
               stress_pattern, part_of_speech, noun_gender, meaning_vi, target_definition,
               topic, level_ref, specialized_domain, audio_asset_id, collocations_json,
               synonyms_json, antonyms_json, examples_json
        FROM wb_public_dictionary_entries
        WHERE ${whereSql}
        ORDER BY CASE WHEN LOWER(headword) = LOWER(?) THEN 0 ELSE 1 END, headword ASC
        LIMIT ? OFFSET ?
      `).bind(...params, q.trim(), Math.min(Number(limit) || 30, 100), Number(offset) || 0).all();
    return {
      entries: rows.results || [],
      total: countRow?.total || 0
    };
  }
  async getEntry(languageInput, entrySlug) {
    const lang = normalizeLanguageCode(languageInput);
    if (!lang) return null;
    const entry = await this.db.prepare(`
        SELECT d.*, s.source_name, s.source_url, s.license_terms, s.attribution_text
        FROM wb_public_dictionary_entries d
        LEFT JOIN wb_vocabulary_sources s ON s.id = d.source_id
        WHERE d.language_code = ? AND d.slug = ?
      `).bind(lang, entrySlug).first();
    if (!entry) return null;
    const related = await this.db.prepare(`
        SELECT slug, headword, phonetic, meaning_vi, level_ref
        FROM wb_public_dictionary_entries
        WHERE language_code = ? AND topic = ? AND id != ?
        LIMIT 6
      `).bind(lang, entry.topic, entry.id).all();
    return { ...entry, related: related.results || [] };
  }
  /**
   * Ensure a specialized term from the 12 published JSON datasets has a canonical Knowledge Object
   * in wb_dictionary_entries so Dictionary, Notebook, Flashcard, Review, and My Knowledge share one source of truth.
   */
  async ensureSpecializedEntry({ domain, termNumber, wordObj, domainLanguage = "en" }) {
    const lang = normalizeLanguageCode(domainLanguage) || "en";
    const safeDomain = String(domain).replace(/[^a-z0-9-]/gi, "").toLowerCase();
    const num = Number(termNumber);
    const entryId = `spec_${safeDomain}_${num}`;
    const slug = `term-${safeDomain}-${num}`;
    const existing = await this.db.prepare("SELECT id, slug FROM wb_public_dictionary_entries WHERE id = ? OR (language_code = ? AND slug = ?)").bind(entryId, lang, slug).first();
    if (existing) return existing.id;
    const headword = String(wordObj.w || "").trim();
    const phonetic = String(wordObj.i || "").trim() || "-";
    const pos = String(wordObj.p || "term").trim();
    const meaningVi = String(wordObj.m || "").trim();
    const topic = String(wordObj.t || safeDomain).trim();
    await this.db.prepare(`
        INSERT OR IGNORE INTO wb_dictionary_entries (
          id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin,
          part_of_speech, meaning_vi, target_definition, topic, level_ref,
          specialized_domain, review_status, data_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Specialized', ?, 'published', '4.0.0')
      `).bind(
      entryId,
      lang,
      slug,
      headword,
      headword.toLowerCase(),
      phonetic,
      phonetic,
      pos,
      meaningVi,
      `${headword} (${topic})`,
      topic,
      safeDomain
    ).run();
    return entryId;
  }
  async saveToNotebook(accountId, payload = {}, { resolveSpecializedTerm } = {}) {
    let entryId = payload.entryId;
    const setId = payload.setId || null;
    const groupName = String(payload.groupName || "Mặc định").trim().slice(0, 80);
    const tags = Array.isArray(payload.tags) ? payload.tags : [];
    const personalNote = String(payload.personalNote || "").trim().slice(0, 1e3);
    if (!entryId && payload.domain && payload.term != null && typeof resolveSpecializedTerm === "function") {
      const resolved = await resolveSpecializedTerm(payload.domain, Number(payload.term));
      if (!resolved) {
        return { ok: false, status: 404, error: "Không tìm thấy thuật ngữ chuyên ngành yêu cầu." };
      }
      entryId = await this.ensureSpecializedEntry({
        domain: payload.domain,
        termNumber: Number(payload.term),
        wordObj: resolved.word,
        domainLanguage: resolved.language || "en"
      });
    }
    if (!entryId) {
      return { ok: false, status: 400, error: "Thiếu entryId hoặc thông tin thuật ngữ chuyên ngành (domain, term)." };
    }
    const entry = await this.db.prepare("SELECT id FROM wb_public_dictionary_entries WHERE id = ?").bind(entryId).first();
    if (!entry) return { ok: false, status: 404, error: "Mục từ không tồn tại." };
    if (setId) {
      const setRow = await this.db.prepare("SELECT id FROM wb_public_vocabulary_sets WHERE id = ? AND account_id = ?").bind(setId, accountId).first();
      if (!setRow) return { ok: false, status: 403, error: "Bộ từ vựng không tồn tại hoặc không thuộc tài khoản của bạn." };
    }
    const existing = await this.db.prepare("SELECT id FROM wb_public_vocabulary_notebook WHERE account_id = ? AND entry_id = ?").bind(accountId, entryId).first();
    if (existing) {
      await this.db.prepare("UPDATE wb_vocabulary_notebook SET group_name = ?, tags_json = ?, personal_note = ?, set_id = COALESCE(?, set_id) WHERE id = ?").bind(groupName, JSON.stringify(tags), personalNote, setId, existing.id).run();
      return { ok: true, id: existing.id, entryId, updated: true };
    }
    const id = generateId("nb");
    await this.db.prepare(`
        INSERT INTO wb_vocabulary_notebook (id, account_id, entry_id, set_id, group_name, tags_json, personal_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, accountId, entryId, setId, groupName, JSON.stringify(tags), personalNote).run();
    return { ok: true, id, entryId, updated: false };
  }
  async updateNotebookItem(accountId, notebookItemId, { setId, groupName, tags, personalNote } = {}) {
    const existing = await this.db.prepare("SELECT * FROM wb_public_vocabulary_notebook WHERE id = ? AND account_id = ?").bind(notebookItemId, accountId).first();
    if (!existing) return { ok: false, status: 404, error: "Không tìm thấy mục từ trong sổ cá nhân." };
    if (setId) {
      const setRow = await this.db.prepare("SELECT id FROM wb_public_vocabulary_sets WHERE id = ? AND account_id = ?").bind(setId, accountId).first();
      if (!setRow) return { ok: false, status: 403, error: "Bộ từ vựng không thuộc tài khoản của bạn." };
    }
    await this.db.prepare(`
        UPDATE wb_vocabulary_notebook
        SET set_id = ?, group_name = ?, tags_json = ?, personal_note = ?
        WHERE id = ? AND account_id = ?
      `).bind(
      setId !== void 0 ? setId || null : existing.set_id,
      groupName !== void 0 ? String(groupName).trim().slice(0, 80) : existing.group_name,
      tags !== void 0 ? JSON.stringify(Array.isArray(tags) ? tags : []) : existing.tags_json,
      personalNote !== void 0 ? String(personalNote).trim().slice(0, 1e3) : existing.personal_note,
      notebookItemId,
      accountId
    ).run();
    return { ok: true, id: notebookItemId };
  }
  async listSets(accountId) {
    const rows = await this.db.prepare(`
        SELECT s.*, COUNT(n.id) AS card_count,
               SUM(CASE WHEN datetime(n.next_review_at) <= datetime('now') THEN 1 ELSE 0 END) AS due_count
        FROM wb_public_vocabulary_sets s
        LEFT JOIN wb_public_vocabulary_notebook n ON n.set_id = s.id AND n.account_id = s.account_id
        WHERE s.account_id = ?
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `).bind(accountId).all();
    return rows.results || [];
  }
  async createSet(accountId, { title, description = "", languageCode = "en" } = {}) {
    const cleanTitle = String(title || "").trim().slice(0, 120);
    if (!cleanTitle) return { ok: false, status: 422, error: "Tên bộ thẻ Flashcard không được để trống." };
    let lang;
    try {
      lang = assertOfficialLanguage(languageCode);
    } catch (err) {
      return { ok: false, status: 400, error: err.message };
    }
    const id = generateId("vset");
    await this.db.prepare("INSERT INTO wb_vocabulary_sets (id, account_id, language_code, title, description) VALUES (?, ?, ?, ?, ?)").bind(id, accountId, lang, cleanTitle, String(description || "").trim().slice(0, 500)).run();
    return { ok: true, id, title: cleanTitle, languageCode: lang };
  }
  async updateSet(accountId, setId, { title, description } = {}) {
    const existing = await this.db.prepare("SELECT * FROM wb_public_vocabulary_sets WHERE id = ? AND account_id = ?").bind(setId, accountId).first();
    if (!existing) return { ok: false, status: 404, error: "Không tìm thấy bộ thẻ thuộc tài khoản của bạn." };
    const cleanTitle = title !== void 0 ? String(title).trim().slice(0, 120) : existing.title;
    if (!cleanTitle) return { ok: false, status: 422, error: "Tên bộ thẻ không được để trống." };
    const cleanDesc = description !== void 0 ? String(description).trim().slice(0, 500) : existing.description;
    await this.db.prepare("UPDATE wb_vocabulary_sets SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND account_id = ?").bind(cleanTitle, cleanDesc, setId, accountId).run();
    return { ok: true, id: setId, title: cleanTitle };
  }
  async deleteSet(accountId, setId) {
    const existing = await this.db.prepare("SELECT id FROM wb_public_vocabulary_sets WHERE id = ? AND account_id = ?").bind(setId, accountId).first();
    if (!existing) return { ok: false, status: 404, error: "Không tìm thấy bộ thẻ thuộc tài khoản của bạn." };
    await this.db.prepare("DELETE FROM wb_vocabulary_sets WHERE id = ? AND account_id = ?").bind(setId, accountId).run();
    return { ok: true };
  }
  async reviewFlashcard(accountId, notebookItemId, quality, { expectedReview } = {}) {
    const rawQ = Number(quality);
    if (!Number.isInteger(rawQ) || rawQ < 0 || rawQ > 5) {
      return { ok: false, status: 422, error: "Giá trị đánh giá trí nhớ (quality) phải là số nguyên từ 0 đến 5." };
    }
    const q = rawQ;
    const item = await this.db.prepare("SELECT * FROM wb_public_vocabulary_notebook WHERE id = ? AND account_id = ?").bind(notebookItemId, accountId).first();
    if (!item) return { ok: false, status: 404, error: "Không tìm thấy mục từ trong sổ cá nhân." };
    if (expectedReview !== void 0) {
      const currentStamp = String(item.last_reviewed_at || "");
      if (currentStamp !== String(expectedReview || "")) {
        return {
          ok: false,
          status: 409,
          code: "STALE_REVIEW_CONFLICT",
          error: "Lượt ôn này đã được cập nhật trước đó. Vui lòng tải lại hàng đợi để tránh ghi đè."
        };
      }
    }
    let repetitions = item.repetitions || 0;
    let easeFactor = item.ease_factor || 2.5;
    let intervalDays = item.interval_days || 1;
    if (q < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      if (repetitions === 0) intervalDays = 1;
      else if (repetitions === 1) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * easeFactor);
      repetitions += 1;
    }
    easeFactor = Math.max(1.3, Number((easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2)));
    const masteryStatus = repetitions >= 4 ? "mastered" : repetitions >= 2 ? "reviewing" : "learning";
    try {
      await this.db.prepare(`
          UPDATE wb_vocabulary_notebook
          SET repetitions = ?, ease_factor = ?, interval_days = ?, mastery_status = ?,
              last_reviewed_at = datetime('now'),
              next_review_at = datetime('now', '+' || ? || ' days')
          WHERE id = ? AND account_id = ?
        `).bind(repetitions, easeFactor, intervalDays, masteryStatus, intervalDays, item.id, accountId).run();
    } catch {
      return {
        ok: false,
        status: 503,
        code: "STORAGE_UNAVAILABLE",
        error: "Không thể lưu kết quả ôn tập vào máy chủ lúc này. Kết quả chưa được ghi nhận; hãy thử lại."
      };
    }
    const updated = await this.db.prepare("SELECT last_reviewed_at, next_review_at FROM wb_public_vocabulary_notebook WHERE id = ?").bind(item.id).first();
    return {
      ok: true,
      repetitions,
      easeFactor,
      intervalDays,
      masteryStatus,
      lastReviewedAt: updated?.last_reviewed_at || null,
      nextReviewAt: updated?.next_review_at || null
    };
  }
};

// src/modules/audio/audio-service.js
var SUPPORTED_PLAYBACK_SPEEDS = Object.freeze([0.75, 1, 1.25, 1.5]);
var AudioService = class {
  static {
    __name(this, "AudioService");
  }
  constructor(db, r2Service, env = {}) {
    this.db = db;
    this.r2Service = r2Service;
    this.env = env;
  }
  getAsrCapabilityStatus() {
    const provider = this.env.ASR_PROVIDER || "browser-native";
    if (provider === "browser-native" || provider === "unconfigured" || !this.env.ASR_API_KEY) {
      return {
        supported: true,
        status: "READY",
        provider: "browser-native",
        messageVi: "Sẵn sàng nghe âm thanh mẫu (0.75x–1.5x), thu âm trực tiếp trên trình duyệt và nghe lại để tự đánh giá phát âm."
      };
    }
    return { supported: true, status: "CONFIGURED", provider };
  }
  async listAssets({ language = "", limit = 50 } = {}) {
    if (language) {
      const norm = assertOfficialLanguage(language);
      const res2 = await this.db.prepare("SELECT * FROM wb_public_audio_assets WHERE language_code = ? ORDER BY created_at DESC LIMIT ?").bind(norm, limit).all();
      return res2.results || [];
    }
    const res = await this.db.prepare("SELECT * FROM wb_public_audio_assets ORDER BY created_at DESC LIMIT ?").bind(limit).all();
    return res.results || [];
  }
  async registerAudioAsset({
    languageCode,
    r2ObjectKey,
    contentType,
    fileSizeBytes,
    durationMs,
    voiceLabel,
    accentVariant = "",
    transcriptText = "",
    syncSegments = [],
    copyrightStatus = "original_word_bridge"
  }) {
    const lang = assertOfficialLanguage(languageCode);
    const id = generateId("aud");
    await this.db.prepare(`
        INSERT INTO wb_audio_assets (
          id, language_code, r2_object_key, content_type, file_size_bytes,
          duration_ms, voice_label, accent_variant, transcript_text,
          sync_segments_json, copyright_status, review_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `).bind(
      id,
      lang,
      r2ObjectKey,
      contentType,
      fileSizeBytes,
      durationMs,
      voiceLabel,
      accentVariant,
      transcriptText,
      JSON.stringify(syncSegments),
      copyrightStatus
    ).run();
    return { id, languageCode: lang, r2ObjectKey };
  }
};

// src/modules/practice/practice-service.js
var PracticeService = class {
  static {
    __name(this, "PracticeService");
  }
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
  }
  async listExercises({ skill = "", language = "" } = {}) {
    const clauses = [];
    const params = [];
    if (skill) {
      clauses.push("skill = ?");
      params.push(skill);
    }
    if (language) {
      clauses.push("language_code = ?");
      params.push(language);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const res = await this.db.prepare(`SELECT * FROM wb_public_practice_exercises ${whereSql} ORDER BY created_at DESC`).bind(...params).all();
    return res.results || [];
  }
  async submitPractice(accountId, exerciseId, answers = {}) {
    const exercise = await this.db.prepare("SELECT * FROM wb_public_practice_exercises WHERE id = ?").bind(exerciseId).first();
    if (!exercise) return { ok: false, status: 404, error: "Không tìm thấy bài luyện tập." };
    const safeAnswers = answers && typeof answers === "object" ? answers : {};
    const questionIds = safeJsonParse(exercise.question_ids_json, []);
    const hasNonEmpty = questionIds.length ? questionIds.some((qId) => {
      const val = safeAnswers[qId];
      return Array.isArray(val) ? val.length > 0 : String(val ?? "").trim().length > 0;
    }) : Object.values(safeAnswers).some((val) => Array.isArray(val) ? val.length > 0 : String(val ?? "").trim().length > 0);
    if (!hasNonEmpty) {
      return { ok: false, status: 422, error: "Vui lòng nhập hoặc chọn câu trả lời hợp lệ trước khi nộp bài." };
    }
    let autoScore = 0;
    let maxScore = 0;
    let hasManualItems = false;
    const itemFeedback = [];
    for (const qId of questionIds) {
      const q = await this.db.prepare("SELECT * FROM wb_public_question_bank WHERE id = ?").bind(qId).first();
      if (!q) continue;
      maxScore += q.max_score;
      const userAns = safeAnswers[qId];
      if (q.auto_gradable === 1 && q.correct_answer_json) {
        const expected = safeJsonParse(q.correct_answer_json, {});
        const isCorrect = Array.isArray(expected) ? Array.isArray(userAns) && JSON.stringify([...expected].sort()) === JSON.stringify([...userAns].sort()) : String(userAns ?? "").trim().toLowerCase() === String(expected).trim().toLowerCase();
        if (isCorrect) autoScore += q.max_score;
        itemFeedback.push({
          questionId: qId,
          prompt: q.prompt_text,
          given: userAns ?? "",
          expected,
          graded: true,
          correct: isCorrect,
          earned: isCorrect ? q.max_score : 0,
          maxScore: q.max_score,
          explanationVi: q.explanation_vi
        });
      } else {
        hasManualItems = true;
        itemFeedback.push({
          questionId: qId,
          prompt: q.prompt_text,
          given: userAns ?? "",
          graded: false,
          noteVi: "Câu hỏi tự luận/nói cần đánh giá chuyên sâu theo rubric; hệ thống không tự tạo điểm giả.",
          rubric: q.rubric_json ? safeJsonParse(q.rubric_json, {}) : null
        });
      }
    }
    const hasGraded = itemFeedback.some((f) => f.graded);
    const gradingStatus = hasManualItems ? hasGraded ? "partially_graded" : "pending_manual_review" : "auto_graded";
    const finalScore = hasManualItems && !hasGraded ? null : autoScore;
    const resultId = generateId("pr");
    await this.db.prepare(`
        INSERT INTO wb_practice_results (
          id, account_id, exercise_id, language_code, skill,
          answers_json, score, max_score, grading_status, feedback_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
      resultId,
      accountId,
      exercise.id,
      exercise.language_code,
      exercise.skill,
      JSON.stringify(safeAnswers),
      finalScore,
      maxScore,
      gradingStatus,
      JSON.stringify(itemFeedback)
    ).run();
    return { ok: true, resultId, score: finalScore, maxScore, gradingStatus, feedback: itemFeedback };
  }
};

// src/modules/reader/reader-service.js
var ReaderService = class {
  static {
    __name(this, "ReaderService");
  }
  constructor(db, r2Service = null, libraryLoader = null) {
    this.db = db;
    this.r2Service = r2Service;
    this.libraryLoader = libraryLoader;
  }
  async getBuiltInArticles() {
    if (typeof this.libraryLoader !== "function") return [];
    try {
      const lib = await this.libraryLoader();
      return Array.isArray(lib?.articles) ? lib.articles : [];
    } catch {
      return [];
    }
  }
  normalizeBuiltInDoc(a) {
    return {
      id: a.id,
      slug: a.slug,
      title_vi: a.title_vi,
      subtitle_vi: a.subtitle_vi || "",
      language_code: a.language_code,
      category: a.category || "specialized",
      domain_group_code: a.domain_group_code || "",
      domain_group_vi: a.domain_group_vi || "",
      specialized_domain_slug: a.specialized_domain_slug || null,
      sub_field_index: a.sub_field_index || null,
      sub_field_vi: a.sub_field_vi || "",
      level_ref: a.level_ref || "B2",
      summary_vi: a.summary_vi || "",
      content_text: a.content_text || "",
      vocabulary_notes_json: JSON.stringify(a.vocabulary_notes || []),
      references: Array.isArray(a.references) ? a.references : [],
      r2_object_key: null,
      estimated_minutes: Number(a.estimated_minutes || 12),
      author_name: a.author_name || "Hội đồng Học thuật WORD BRIDGE",
      review_status: "published",
      source_origin: "builtin_web_library"
    };
  }
  async listDocumentsPaginated({ language = "", category = "", domainGroup = "", q = "", page = 1, limit = 24, includeDrafts = false } = {}) {
    if (language && !["zh", "en"].includes(language)) {
      return { items: [], total: 0, page: 1, totalPages: 1, stats: { totalAll: 0, zhCount: 0, enCount: 0 } };
    }
    const d1Docs = await this.listD1Documents({ language, category, q, includeDrafts });
    const builtInRaw = await this.getBuiltInArticles();
    const d1Slugs = new Set(d1Docs.map((d) => d.slug));
    const builtInAll = builtInRaw.filter((a) => !d1Slugs.has(a.slug));
    const totalAll = d1Docs.length + builtInAll.length;
    const zhCount = d1Docs.filter((d) => d.language_code === "zh").length + builtInAll.filter((a) => a.language_code === "zh").length;
    const enCount = d1Docs.filter((d) => d.language_code === "en").length + builtInAll.filter((a) => a.language_code === "en").length;

    const qLower = String(q || "").trim().toLowerCase();
    const filteredBuiltIn = builtInAll.filter((a) => {
      if (language && a.language_code !== language) return false;
      if (category && ["general", "specialized", "guide", "grammar", "dialogue"].includes(category) && (a.category || "specialized") !== category) return false;
      if (domainGroup && a.domain_group_code !== domainGroup) return false;
      if (qLower) {
        const hay = `${a.title_vi || ""} ${a.subtitle_vi || ""} ${a.summary_vi || ""} ${a.sub_field_vi || ""} ${a.domain_group_vi || ""}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    }).map((a) => this.normalizeBuiltInDoc(a));

    const filteredD1 = domainGroup ? [] : d1Docs;
    const merged = [...filteredBuiltIn, ...filteredD1];
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 24));
    const total = merged.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(totalPages, Math.max(1, Number(page) || 1));
    const start = (safePage - 1) * safeLimit;
    return {
      items: merged.slice(start, start + safeLimit),
      total,
      page: safePage,
      totalPages,
      stats: { totalAll, zhCount, enCount }
    };
  }
  async listD1Documents({ language = "", category = "", q = "", includeDrafts = false } = {}) {
    try {
      const clauses = [];
      const params = [];
      if (!includeDrafts) clauses.push("review_status = 'published'");
      if (language) { clauses.push("language_code = ?"); params.push(language); }
      if (category && ["general", "specialized", "guide", "grammar", "dialogue"].includes(category)) {
        clauses.push("category = ?"); params.push(category);
      }
      if (q) {
        clauses.push("(LOWER(title_vi) LIKE ? OR LOWER(summary_vi) LIKE ? OR LOWER(content_text) LIKE ?)");
        const pat = `%${String(q).trim().toLowerCase()}%`;
        params.push(pat, pat, pat);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const res = await this.db.prepare(`SELECT * FROM ${includeDrafts ? "wb_reader_documents" : "wb_public_reader_documents"} ${where} ORDER BY updated_at DESC, id ASC`).bind(...params).all();
      return res.results || [];
    } catch {
      return [];
    }
  }
  async listDocuments({ language = "", category = "", domainGroup = "", q = "", page = 1, limit = 50, includeDrafts = false } = {}) {
    const res = await this.listDocumentsPaginated({ language, category, domainGroup, q, page, limit, includeDrafts });
    return res.items;
  }
  async getDocumentByIdOrSlug(idOrSlug) {
    let doc = null;
    try {
      doc = await this.db.prepare("SELECT * FROM wb_public_reader_documents WHERE (id = ? OR slug = ?) AND review_status = 'published'").bind(idOrSlug, idOrSlug).first();
    } catch {
      doc = null;
    }
    if (doc) return doc;
    const builtIn = await this.getBuiltInArticles();
    const hit = builtIn.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
    return hit ? this.normalizeBuiltInDoc(hit) : null;
  }
  async getDocumentBySlug(slug, accountId = null) {
    const doc = await this.getDocumentByIdOrSlug(slug);
    if (!doc) return null;
    let progress = null;
    if (accountId) {
      try {
        progress = await this.db.prepare("SELECT * FROM wb_reader_progress WHERE account_id = ? AND document_id = ?").bind(accountId, doc.id).first();
      } catch {
        progress = null;
      }
    }
    return { doc, progress };
  }
  async saveProgress(accountId, { documentId, currentSection = 1, progressPercent = 0, bookmarked = false, personalNotes = "" }) {
    if (!documentId) return { ok: false, status: 400, error: "Thiếu documentId." };
    let doc = await this.db.prepare("SELECT id FROM wb_public_reader_documents WHERE id = ? AND review_status = 'published'").bind(documentId).first().catch(() => null);
    if (!doc) {
      const builtIn = await this.getDocumentByIdOrSlug(documentId);
      if (!builtIn) return { ok: false, status: 404, error: "Tài liệu không tồn tại." };
      // Ensure lightweight row exists in wb_reader_documents for FK integrity
      await this.db.prepare(`
        INSERT OR IGNORE INTO wb_reader_documents (
          id, slug, title_vi, subtitle_vi, language_code, category, specialized_domain_slug,
          level_ref, summary_vi, content_text, vocabulary_notes_json, r2_object_key,
          estimated_minutes, author_name, review_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'published')
      `).bind(
        builtIn.id, builtIn.slug, builtIn.title_vi, builtIn.subtitle_vi || "", builtIn.language_code,
        builtIn.category || "specialized", builtIn.specialized_domain_slug || null, builtIn.level_ref || "B2",
        builtIn.summary_vi || builtIn.title_vi, builtIn.content_text || "", builtIn.vocabulary_notes_json || "[]",
        builtIn.estimated_minutes || 10, builtIn.author_name || "Hội đồng Học thuật WORD BRIDGE"
      ).run().catch(() => {});
      doc = { id: builtIn.id };
    }
    const safePercent = Math.max(0, Math.min(100, Number(progressPercent) || 0));
    const safeSection = Math.max(1, Number(currentSection) || 1);
    const safeBookmark = bookmarked ? 1 : 0;
    const safeNotes = String(personalNotes || "").slice(0, 4e3);
    await this.db.prepare(`
        INSERT INTO wb_reader_progress (id, account_id, document_id, current_section, progress_percent, bookmarked, personal_notes, last_read_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(account_id, document_id) DO UPDATE SET
          current_section = excluded.current_section,
          progress_percent = excluded.progress_percent,
          bookmarked = excluded.bookmarked,
          personal_notes = excluded.personal_notes,
          last_read_at = datetime('now')
      `).bind(generateId("rpr"), accountId, doc.id, safeSection, safePercent, safeBookmark, safeNotes).run();
    return { ok: true, documentId: doc.id, currentSection: safeSection, progressPercent: safePercent, bookmarked: Boolean(safeBookmark) };
  }
  async createDocument(actor, payload) {
    const titleVi = String(payload.titleVi || "").trim();
    const contentText = String(payload.contentText || "").trim();
    const category = String(payload.category || "general").trim();
    if (!titleVi || contentText.length < 20) {
      return { ok: false, status: 400, error: "Tiêu đề và nội dung tài liệu (tối thiểu 20 ký tự) là bắt buộc." };
    }
    const lang = category === "specialized" ? assertSpecializedLanguage(payload.languageCode || "en") : assertOfficialLanguage(payload.languageCode || "en");
    const id = generateId("rdoc");
    const rawSlug = String(payload.slug || titleVi).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || id;
    const slug = `${rawSlug}-${id.slice(-4)}`;
    await this.db.prepare(`
        INSERT INTO wb_reader_documents (
          id, slug, title_vi, subtitle_vi, language_code, category, specialized_domain_slug,
          level_ref, summary_vi, content_text, vocabulary_notes_json, r2_object_key,
          estimated_minutes, author_name, review_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
      id,
      slug,
      titleVi,
      String(payload.subtitleVi || "").trim(),
      lang,
      ["general", "specialized", "guide", "grammar", "dialogue"].includes(category) ? category : "general",
      payload.specializedDomainSlug || null,
      String(payload.levelRef || "Cơ bản").trim(),
      String(payload.summaryVi || titleVi).trim(),
      contentText,
      typeof payload.vocabularyNotesJson === "string" ? payload.vocabularyNotesJson : JSON.stringify(payload.vocabularyNotes || []),
      payload.r2ObjectKey || null,
      Math.max(1, Number(payload.estimatedMinutes || 10)),
      actor.fullName || "Ban Biên soạn WORD BRIDGE",
      payload.reviewStatus === "published" ? "published" : "draft",
      actor.accountId
    ).run();
    return { ok: true, documentId: id, slug };
  }
};

// src/modules/learner-meet/learner-meet-service.js
var LEARNER_MEET_DISCLAIMER_VI = "Phòng thực hành giao tiếp trực tiếp tập trung vào âm thanh và hình ảnh.";
var LearnerMeetService = class {
  static {
    __name(this, "LearnerMeetService");
  }
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.provider = env.LEARNER_MEET_PROVIDER || "unconfigured";
  }
  getProviderStatus() {
    if (this.provider === "unconfigured" || !this.env.LIVEKIT_WS_URL || !this.env.LIVEKIT_API_KEY) {
      return {
        ready: true,
        status: "READY",
        provider: "browser-media",
        noteVi: "Phòng thực hành đã sẵn sàng. Bạn có thể kiểm tra Micro & Camera, chọn chủ đề hội thoại và luyện giao tiếp cùng người học."
      };
    }
    return { ready: true, status: "CONFIGURED", provider: this.provider };
  }
  async createSession(hostAccountId, { languageCode, mode = "one_to_one", topicVi, maxParticipants = 2 }) {
    const lang = assertOfficialLanguage(languageCode);
    const validMode = mode === "group" ? "group" : "one_to_one";
    const cap = validMode === "one_to_one" ? 2 : Math.max(2, Math.min(8, Number(maxParticipants) || 4));
    const topic = String(topicVi || "").trim();
    if (topic.length < 3) {
      return { ok: false, status: 400, error: "Chủ đề thực hành phải có tối thiểu 3 ký tự." };
    }
    const id = generateId("lm");
    const sessionCode = `WB-${randomTokenHex(3).toUpperCase()}`;
    const roomId = `room_${randomTokenHex(6)}`;
    await this.db.prepare(`
        INSERT INTO wb_learner_meet_sessions (
          id, session_code, room_id, host_account_id, language_code, mode,
          topic_vi, max_participants, status, webrtc_provider,
          recording_disabled, chat_disabled, screen_share_disabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1, 1, 1)
      `).bind(id, sessionCode, roomId, hostAccountId, lang, validMode, topic, cap, this.provider).run();
    await this.db.prepare("INSERT INTO wb_learner_meet_participants (id, session_id, account_id, connection_state) VALUES (?, ?, ?, ?)").bind(generateId("lmp"), id, hostAccountId, "joined").run();
    return {
      ok: true,
      session: {
        id,
        sessionCode,
        roomId,
        languageCode: lang,
        mode: validMode,
        topicVi: topic,
        maxParticipants: cap,
        capabilities: {
          audio: true,
          video: true,
          chat: false,
          fileTransfer: false,
          screenShare: false,
          recording: false
        },
        providerStatus: this.getProviderStatus(),
        disclaimerVi: LEARNER_MEET_DISCLAIMER_VI
      }
    };
  }
  async joinSession(accountId, sessionCode) {
    const session = await this.db.prepare("SELECT * FROM wb_public_learner_meet_sessions WHERE session_code = ? AND status IN ('scheduled', 'active')").bind(String(sessionCode || "").trim().toUpperCase()).first();
    if (!session) return { ok: false, status: 404, error: "Phiên Learner Meet không tồn tại hoặc đã kết thúc." };
    const activeCount = await this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_learner_meet_participants WHERE session_id = ? AND left_at IS NULL").bind(session.id).first();
    if ((activeCount?.cnt || 0) >= session.max_participants) {
      return { ok: false, status: 409, error: "Phiên thực hành đã đủ số lượng người tham gia tối đa." };
    }
    await this.db.prepare("INSERT INTO wb_learner_meet_participants (id, session_id, account_id, connection_state) VALUES (?, ?, ?, ?)").bind(generateId("lmp"), session.id, accountId, "joined").run();
    return {
      ok: true,
      roomId: session.room_id,
      session,
      providerStatus: this.getProviderStatus(),
      disclaimerVi: LEARNER_MEET_DISCLAIMER_VI
    };
  }
  async endSession(accountId, sessionId) {
    const session = await this.db.prepare("SELECT * FROM wb_public_learner_meet_sessions WHERE id = ? AND host_account_id = ?").bind(sessionId, accountId).first();
    if (!session) return { ok: false, status: 404, error: "Không tìm thấy phiên hoặc bạn không phải chủ phiên." };
    await this.db.prepare("UPDATE wb_learner_meet_sessions SET status = 'ended', ended_at = datetime('now') WHERE id = ?").bind(sessionId).run();
    await this.db.prepare("UPDATE wb_learner_meet_participants SET left_at = datetime('now'), connection_state = 'left' WHERE session_id = ? AND left_at IS NULL").bind(sessionId).run();
    return { ok: true };
  }
};

// src/modules/intelligence/intelligence-service.js
var SYSTEM_SPEC_MAP = new Map(INTELLIGENCE_SYSTEMS.map((s) => [s.slug, s]));
var IntelligenceService = class {
  static {
    __name(this, "IntelligenceService");
  }
  constructor(db, env = {}) {
    this.db = db;
    this.env = env;
  }
  async listHistory(accountId, systemSlug = null, limit = 20) {
    try {
      if (systemSlug) {
        const res2 = await this.db.prepare("SELECT * FROM wb_public_intelligence_runs WHERE account_id = ? AND system_slug = ? ORDER BY created_at DESC LIMIT ?").bind(accountId, systemSlug, limit).all();
        return res2.results || [];
      }
      const res = await this.db.prepare("SELECT * FROM wb_public_intelligence_runs WHERE account_id = ? ORDER BY created_at DESC LIMIT ?").bind(accountId, limit).all();
      return res.results || [];
    } catch {
      return [];
    }
  }
  async executeSystem(accountId, systemSlug, { languageCode = "en", inputText = "", scenario = "", domain = "" } = {}) {
    const spec = SYSTEM_SPEC_MAP.get(systemSlug);
    if (!spec) {
      return { ok: false, status: 404, error: `Hệ thống trí tuệ không tồn tại: ${systemSlug}` };
    }
    const lang = systemSlug === "knowledge-to-language" ? assertSpecializedLanguage(languageCode) : assertOfficialLanguage(languageCode);
    const [progressStats, vocabStats, practiceStats, lessonCheckStats] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) AS completed, AVG(score_percent) AS avg_score FROM wb_public_learner_progress WHERE account_id = ?').bind(accountId).first(),
      this.db.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN mastery_status = "mastered" THEN 1 ELSE 0 END) AS mastered, SUM(CASE WHEN datetime(next_review_at) <= datetime("now") THEN 1 ELSE 0 END) AS due FROM wb_public_vocabulary_notebook WHERE account_id = ?').bind(accountId).first(),
      this.db.prepare("SELECT COUNT(*) AS total, AVG(CASE WHEN max_score > 0 AND score IS NOT NULL THEN (score * 100.0 / max_score) END) AS avg_pct FROM wb_public_practice_results WHERE account_id = ? AND language_code = ?").bind(accountId, lang).first(),
      this.db.prepare("SELECT COUNT(*) AS total, AVG(score_percent) AS avg_pct FROM wb_public_lesson_submissions WHERE account_id = ? AND score_percent IS NOT NULL").bind(accountId).first()
    ]);
    const cleanText = String(inputText || "").trim();
    const tokens = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
    const uniqueTokens = new Set(tokens.map((t) => t.toLowerCase()));
    let output = {};
    let methodology = "";
    let confidence = "deterministic_data";
    let technicalLimits = "Kết quả được tổng hợp trực tiếp từ dữ liệu bài học, bài luyện tập và sổ từ vựng thực tế của bạn.";
    switch (systemSlug) {
      case "language-dna": {
        const vocabRatio = vocabStats?.total ? Math.round((vocabStats.mastered || 0) / vocabStats.total * 100) : 0;
        const practicePct = Math.round(practiceStats?.avg_pct || 0);
        const lessonCheckPct = Math.round(lessonCheckStats?.avg_pct || progressStats?.avg_score || 0);
        const combinedComprehension = practicePct > 0 && lessonCheckPct > 0 ? Math.round((practicePct + lessonCheckPct) / 2) : lessonCheckPct || practicePct;
        output = {
          dimensions: {
            vocabulary: vocabRatio,
            grammar: practicePct,
            phonetics: 0,
            // Honest: requires ASR integration
            pragmatics: lessonCheckPct,
            fluency: practiceStats?.total ? Math.min(100, practiceStats.total * 10) : 0,
            comprehensionDepth: combinedComprehension
          },
          dataPointsCount: (progressStats?.total || 0) + (vocabStats?.total || 0) + (practiceStats?.total || 0) + (lessonCheckStats?.total || 0)
        };
        methodology = "Tổng hợp trực tiếp tỷ lệ thành thạo từ vựng, điểm trung bình bài luyện tập và kết quả kiểm tra kiến thức trong bài học của bạn.";
        technicalLimits = "Chiều Ngữ âm (phonetics) giữ mức 0 cho đến khi tích hợp nhà cung cấp ASR chính thức.";
        break;
      }
      case "language-transfer-lab": {
        const transferRules = {
          zh: {
            positive: ["Tương đồng từ vựng Hán–Việt giúp nhận diện nghĩa gốc nhanh", "Cấu trúc SVO cơ bản gần với tiếng Việt"],
            negative: ["Dễ nhầm thanh điệu tiếng Trung với 6 thanh tiếng Việt", "Đảo ngược vị trí định ngữ (tiếng Trung đặt trước danh từ, tiếng Việt đặt sau)"]
          },
          en: {
            positive: ["Hệ chữ viết Latin quen thuộc với người học Việt Nam", "Cấu trúc chủ–vị–tân (SVO) tương đồng ở câu đơn"],
            negative: ["Thiếu biến đổi thì động từ và số nhiều trong tiếng Việt dẫn tới quên chia động từ/-s/-ed", "Bỏ sót âm cuối (ending sounds) và trọng âm từ"]
          }
        };
        output = { sourceLanguage: "vi", targetLanguage: lang, analysis: transferRules[lang], sampleChecked: cleanText || null };
        methodology = "Áp dụng bảng đối chiếu ngôn ngữ học tương phản (Contrastive Linguistics) Việt – Trung / Anh.";
        confidence = "rule_based_heuristic";
        break;
      }
      case "knowledge-to-language": {
        const terms = await this.db.prepare("SELECT headword, phonetic, meaning_vi, specialized_domain FROM wb_public_dictionary_entries WHERE language_code = ? AND specialized_domain IS NOT NULL LIMIT 10").bind(lang).all();
        output = { languageCode: lang, domainFilter: domain || "all", matchedTerms: terms.results || [] };
        methodology = "Tra cứu kho thuật ngữ chuyên ngành Tiếng Trung và Tiếng Anh.";
        break;
      }
      case "real-world-simulator": {
        const scenarios = {
          zh: ["Đàm phán điều khoản vận đơn (海运提单) với đối tác logistics", "Hỏi đường và đặt món ăn tại Thượng Hải"],
          en: ["Trình bày sự cố hệ thống Cloud với khách hàng quốc tế", "Trao đổi chứng từ xuất nhập khẩu (Commercial Invoice & Packing List)"]
        };
        output = {
          selectedScenario: scenario || scenarios[lang][0],
          availableScenarios: scenarios[lang],
          steps: [
            { step: 1, prompt: "Mở đầu đúng vai vế và mục đích giao tiếp." },
            { step: 2, prompt: "Trình bày thông tin cốt lõi và xác nhận hiểu đúng." },
            { step: 3, prompt: "Đề xuất hành động tiếp theo và kết thúc lịch sự." }
          ],
          learnerInputReceived: cleanText || null
        };
        methodology = "Kịch bản giao tiếp cấu trúc 3 bước theo chuẩn tình huống thực tế của từng ngôn ngữ.";
        confidence = "rule_based_heuristic";
        break;
      }
      case "language-error-genome": {
        const recentFailed = await this.db.prepare("SELECT skill, feedback_json, submitted_at FROM wb_public_practice_results WHERE account_id = ? AND language_code = ? ORDER BY submitted_at DESC LIMIT 10").bind(accountId, lang).all();
        output = {
          analyzedSubmissions: (recentFailed.results || []).length,
          focusCategories: lang === "zh" ? ["Thanh điệu & biến điệu", "Trật tự định ngữ + 的", "Lượng từ"] : lang === "en" ? ["Chia thì & hòa hợp chủ-vị", "Giới từ & Collocation", "Âm cuối & trọng âm"] : ["6 cách danh từ", "Giống danh từ", "Cặp thể động từ"],
          note: (recentFailed.results || []).length === 0 ? "Chưa có đủ bài nộp luyện tập để trích xuất mẫu lỗi lặp lại cá nhân." : "Đã đối chiếu lịch sử nộp bài luyện tập của bạn."
        };
        methodology = "Phân nhóm lỗi từ lịch sử `wb_practice_results` theo đặc trưng hình thái/cú pháp của từng ngôn ngữ.";
        break;
      }
      case "meaning-equivalence": {
        output = {
          inputText: cleanText || "(Chưa nhập câu cần đối chiếu)",
          targetLanguage: lang,
          registerGuide: ["Trang trọng (Formal)", "Trung tính (Neutral)", "Thân mật (Informal)"],
          warning: "WORD BRIDGE phân tích sắc thái ngữ dụng học tập; không đóng vai trò máy dịch tự động thay thế công cụ dịch thuật độc lập."
        };
        methodology = "Phân tích khung sắc thái và thanh vực (register) đối chiếu tiếng Việt – ngôn ngữ đích.";
        confidence = "rule_based_heuristic";
        break;
      }
      case "language-timeline": {
        const timeline = await this.db.prepare("SELECT status, score_percent, updated_at FROM wb_public_learner_progress WHERE account_id = ? ORDER BY updated_at DESC LIMIT 20").bind(accountId).all();
        output = {
          events: timeline.results || [],
          completedLessons: progressStats?.completed || 0,
          dueVocabularyCount: vocabStats?.due || 0
        };
        methodology = "Trích xuất chuỗi thời gian thực từ bảng `wb_learner_progress` và `wb_vocabulary_notebook`.";
        break;
      }
      case "pronunciation-lab": {
        output = {
          languageCode: lang,
          assessment: "Tự đối chiếu với phát âm mẫu.",
          phoneticChecklist: lang === "zh" ? ["Thanh 1 (ngang cao)", "Thanh 2 (lên)", "Thanh 3 (xuống-lên)", "Thanh 4 (xuống dứt khoát)", "Thanh nhẹ"] : ["Nguyên âm dài/ngắn", "Phụ âm cuối /t, d, s, z/", "Trọng âm từ", "Âm nối (connected speech)"]
        };
        methodology = "Cung cấp khung kiểm tra âm vị chuẩn theo ngôn ngữ; chỉ chấm điểm tự động khi có ASR provider thật.";
        confidence = "rule_based_heuristic";
        break;
      }
      case "knowledge-graph": {
        const nodes = await this.db.prepare('SELECT language_code, headword, meaning_vi, topic FROM wb_public_dictionary_entries WHERE review_status = "published" LIMIT 18').all();
        output = {
          nodesCount: (nodes.results || []).length,
          conceptClusters: (nodes.results || []).reduce((acc, r) => {
            acc[r.topic] = acc[r.topic] || [];
            acc[r.topic].push({ lang: r.language_code, headword: r.headword, meaningVi: r.meaning_vi });
            return acc;
          }, {})
        };
        methodology = "Liên kết các mục từ thực tế từ `wb_dictionary_entries` theo chủ đề chung giữa Tiếng Trung, Tiếng Anh.";
        break;
      }
      case "personal-corpus": {
        output = {
          tokenCount: tokens.length,
          uniqueTokenCount: uniqueTokens.size,
          lexicalDiversityRatio: tokens.length ? Number((uniqueTokens.size / tokens.length).toFixed(3)) : 0,
          savedVocabularyCount: vocabStats?.total || 0
        };
        methodology = "Thống kê độ đa dạng từ vựng trực tiếp từ văn bản bạn cung cấp và sổ từ vựng cá nhân.";
        break;
      }
      case "context-reconstruction": {
        output = {
          inputExcerpt: cleanText.slice(0, 300),
          pragmaticAxes: {
            speakerRole: "Cần xác định vai vế (đồng nghiệp / cấp trên / đối tác / khách hàng)",
            communicativeIntent: cleanText.includes("?") ? "Hỏi thông tin / Xác nhận" : "Trình bày / Đề nghị",
            formalityEstimate: cleanText.length > 80 ? "Trung tính đến Trang trọng" : "Ngắn gọn / Trực tiếp"
          }
        };
        methodology = "Phân tích dấu hiệu hình thức câu và khung vai vế ngữ dụng học.";
        confidence = "rule_based_heuristic";
        break;
      }
      case "comprehension-depth": {
        const practiceAvg = Math.round(practiceStats?.avg_pct || 0);
        const lessonCheckAvg = Math.round(lessonCheckStats?.avg_pct || 0);
        output = {
          fourLevels: [
            { level: "Literal", labelVi: "Hiểu nghĩa đen", description: "Xác định sự kiện, số liệu và thông tin hiển ngôn." },
            { level: "Inferential", labelVi: "Hiểu suy luận", description: "Kết nối chi tiết ngầm định giữa các câu." },
            { level: "Pragmatic", labelVi: "Hiểu ngữ dụng", description: "Nhận diện thái độ, mục đích và sắc thái người nói/viết." },
            { level: "Critical", labelVi: "Hiểu phản biện", description: "Đánh giá lập luận, bằng chứng và tính hợp lý." }
          ],
          recentPracticeAveragePercent: practiceAvg,
          recentLessonCheckAveragePercent: lessonCheckAvg
        };
        methodology = "Đánh giá theo khung 4 tầng đọc/nghe hiểu học thuật kết hợp dữ liệu luyện tập và kiểm tra kiến thức của bạn.";
        break;
      }
      case "learning-recovery": {
        const dueItems = await this.db.prepare(`
            SELECT n.id, d.headword, d.meaning_vi, d.language_code, n.next_review_at, n.interval_days
            FROM wb_public_vocabulary_notebook n
            JOIN wb_public_dictionary_entries d ON d.id = n.entry_id
            WHERE n.account_id = ? AND datetime(n.next_review_at) <= datetime('now')
            ORDER BY n.next_review_at ASC
            LIMIT 15
          `).bind(accountId).all();
        output = {
          atRiskCount: (dueItems.results || []).length,
          recommendedRecoveryQueue: dueItems.results || []
        };
        methodology = "Tổng hợp các mục từ cần ôn tập trong sổ từ vựng cá nhân của bạn.";
        break;
      }
      case "language-quality": {
        const sentenceCount = cleanText ? cleanText.split(/[.!?。！？]+/).filter((s) => s.trim()).length : 0;
        output = {
          wordCount: tokens.length,
          sentenceCount,
          avgWordsPerSentence: sentenceCount ? Number((tokens.length / sentenceCount).toFixed(1)) : 0,
          criteria: ["Độ chính xác ngữ pháp", "Độ tự nhiên collocation", "Tính mạch lạc đoạn văn", "Phù hợp văn phong"],
          honestNotice: "Các chỉ số cấu trúc được tính trực tiếp; chấm điểm tự nhiên chuyên sâu cần bộ đánh giá biên tập hoặc AI adapter đã duyệt."
        };
        methodology = "Đo chỉ số cấu trúc văn bản thực tế và đối chiếu bộ 4 tiêu chí chất lượng ngôn ngữ.";
        break;
      }
      case "language-observatory": {
        output = {
          summary: {
            lessonsCompleted: progressStats?.completed || 0,
            lessonChecksCompleted: lessonCheckStats?.total || 0,
            vocabularyTotal: vocabStats?.total || 0,
            vocabularyMastered: vocabStats?.mastered || 0,
            vocabularyDueForReview: vocabStats?.due || 0,
            practiceAttempts: practiceStats?.total || 0
          },
          nextRecommendedAction: (vocabStats?.due || 0) > 0 ? "Ưu tiên ôn tập các mục từ quá hạn tại /vocabulary/review." : "Tiếp tục tuần học kế tiếp trong lộ trình tại /my-learning."
        };
        methodology = "Tổng hợp toàn bộ chỉ số học tập thực tế (Bài học, Kiểm tra, Từ vựng, Luyện tập) của bạn.";
        break;
      }
    }
    const runId = generateId("int");
    const intelInsertSql = `
        INSERT INTO wb_intelligence_runs (
          id, account_id, system_slug, language_code, input_json, output_json,
          methodology_note, confidence_level, technical_limits, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `;
    try {
      await this.db.prepare(intelInsertSql).bind(
        runId, accountId, systemSlug, lang,
        JSON.stringify({ languageCode: lang, inputText: cleanText.slice(0, 1e3), scenario, domain }),
        JSON.stringify(output), methodology, confidence, technicalLimits
      ).run();
    } catch (intelErr) {
      if (!isMissingTableError(intelErr)) throw intelErr;
      await this.db.prepare("CREATE TABLE IF NOT EXISTS wb_intelligence_runs (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, system_slug TEXT NOT NULL, language_code TEXT NOT NULL DEFAULT 'en', input_json TEXT NOT NULL, output_json TEXT NOT NULL, methodology_note TEXT NOT NULL, confidence_level TEXT NOT NULL, technical_limits TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed', created_at TEXT NOT NULL DEFAULT (datetime('now')))").run().catch(() => {});
      await this.db.prepare("CREATE VIEW IF NOT EXISTS wb_public_intelligence_runs AS SELECT * FROM wb_intelligence_runs WHERE language_code IN ('zh','en')").run().catch(() => {});
      await this.db.prepare(intelInsertSql).bind(
        runId, accountId, systemSlug, lang,
        JSON.stringify({ languageCode: lang, inputText: cleanText.slice(0, 1e3), scenario, domain }),
        JSON.stringify(output), methodology, confidence, technicalLimits
      ).run();
    }
    if (false) await this.db.prepare(intelInsertSql).bind(
      runId,
      accountId,
      systemSlug,
      lang,
      JSON.stringify({ languageCode: lang, inputText: cleanText.slice(0, 1e3), scenario, domain }),
      JSON.stringify(output),
      methodology,
      confidence,
      technicalLimits
    ).run();
    return {
      ok: true,
      runId,
      system: spec,
      languageCode: lang,
      output,
      methodology,
      confidence,
      technicalLimits
    };
  }
};

// src/modules/administration/admin-service.js
var AdminService = class {
  static {
    __name(this, "AdminService");
  }
  constructor(db, authService, jobsService, r2Service = null, emailService = null) {
    this.db = db;
    this.authService = authService;
    this.jobsService = jobsService;
    this.r2Service = r2Service;
    this.emailService = emailService;
  }
  // ---- 1. OVERVIEW DASHBOARD ----
  async getDashboardMetrics() {
    const [
      accountsTotal,
      accountsActive,
      accountsVerified,
      accountsLocked,
      activeSessions,
      programs,
      curricula,
      courses,
      weeks,
      lessons,
      dictEntries,
      practiceExercises,
      practiceResults,
      readerDocs,
      supportOpen,
      supportTotal,
      emailEvents,
      emailFailed,
      auditLogsCount,
      recentAudits,
      jobs,
      configRows
    ] = await Promise.all([
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts WHERE status = 'active'").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts WHERE email_verified = 1").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_accounts WHERE status != 'active' OR (locked_until IS NOT NULL AND datetime(locked_until) > datetime('now'))").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_sessions WHERE revoked_at IS NULL AND datetime(expires_at) > datetime('now')").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_programs").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_curricula").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_courses").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_weeks").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_lessons").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_dictionary_entries").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_practice_exercises").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_practice_results").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_reader_documents").first().catch(() => ({ cnt: 0 })),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_support_requests WHERE status IN ('open', 'in_progress')").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_support_requests").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_email_events").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_email_events WHERE delivery_status IN ('FAILED', 'BOUNCED', 'BLOCKED_UNCONFIGURED')").first(),
      this.db.prepare("SELECT COUNT(*) AS cnt FROM wb_audit_logs").first(),
      this.db.prepare(`
        SELECT l.id, l.action, l.resource_type, l.resource_id, l.ip_address, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        ORDER BY l.created_at DESC
        LIMIT 15
      `).all(),
      this.db.prepare("SELECT * FROM wb_background_jobs ORDER BY job_name ASC").all(),
      this.db.prepare("SELECT config_key, config_value FROM wb_platform_config").all().catch(() => ({ results: [] }))
    ]);
    const configMap = {};
    for (const row of configRows.results || []) {
      configMap[row.config_key] = row.config_value;
    }
    const alerts = [];
    if ((accountsLocked?.cnt || 0) > 0) {
      alerts.push({ level: "warn", message: `Có ${accountsLocked.cnt} tài khoản đang bị khóa hoặc chưa kích hoạt.` });
    }
    if ((supportOpen?.cnt || 0) > 0) {
      alerts.push({ level: "info", message: `Có ${supportOpen.cnt} yêu cầu hỗ trợ đang chờ xử lý.` });
    }
    if ((emailFailed?.cnt || 0) > 0) {
      alerts.push({ level: "warn", message: `Có ${emailFailed.cnt} email ở trạng thái lỗi / chưa cấu hình provider.` });
    }
    const erroredJobs = (jobs.results || []).filter((j) => j.status === "error");
    if (erroredJobs.length > 0) {
      alerts.push({ level: "error", message: `Có ${erroredJobs.length} tác vụ nền gặp lỗi cần kiểm tra.` });
    }
    if (configMap["site.maintenance_mode"] === "true") {
      alerts.push({ level: "error", message: "Chế độ bảo trì (Maintenance Mode) đang BẬT." });
    }
    return {
      counts: {
        accounts: accountsTotal?.cnt || 0,
        accountsActive: accountsActive?.cnt || 0,
        accountsVerified: accountsVerified?.cnt || 0,
        accountsLocked: accountsLocked?.cnt || 0,
        activeSessions: activeSessions?.cnt || 0,
        programs: programs?.cnt || 0,
        curricula: curricula?.cnt || 0,
        courses: courses?.cnt || 0,
        weeks: weeks?.cnt || 0,
        lessons: lessons?.cnt || 0,
        dictionaryEntries: dictEntries?.cnt || 0,
        practiceExercises: practiceExercises?.cnt || 0,
        practiceResults: practiceResults?.cnt || 0,
        readerDocuments: readerDocs?.cnt || 0,
        supportOpen: supportOpen?.cnt || 0,
        supportTotal: supportTotal?.cnt || 0,
        emailEvents: emailEvents?.cnt || 0,
        emailFailed: emailFailed?.cnt || 0,
        auditLogs: auditLogsCount?.cnt || 0
      },
      health: {
        d1Connected: true,
        r2Connected: Boolean(this.r2Service && this.r2Service.isAvailable()),
        maintenanceMode: configMap["site.maintenance_mode"] === "true"
      },
      alerts,
      recentAudits: recentAudits.results || [],
      centers: ADMIN_CENTERS,
      roles: RBAC_ROLES,
      jobs: jobs.results || []
    };
  }
  // ---- 2. ACCOUNTS MANAGEMENT ----
  async listAccounts(actor, { q = "", status = "", verified = "", limit = 50, offset = 0 } = {}) {
    if (!this.authService.hasPermission(actor, "accounts:view")) {
      return { ok: false, status: 403, error: "Thiếu quyền accounts:view." };
    }
    const clauses = [];
    const params = [];
    if (q) {
      clauses.push("(LOWER(a.email) LIKE ? OR LOWER(a.full_name) LIKE ? OR a.phone_number LIKE ?)");
      const pat = `%${String(q).trim().toLowerCase()}%`;
      params.push(pat, pat, pat);
    }
    if (status) {
      clauses.push("a.status = ?");
      params.push(status);
    }
    if (verified === "1" || verified === "0") {
      clauses.push("a.email_verified = ?");
      params.push(Number(verified));
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);
    const rows = (await this.db.prepare(`
        SELECT a.id, a.email, a.full_name, a.phone_number, a.school_name, a.workplace_name,
               a.email_verified, a.status, a.failed_login_attempts, a.locked_until, a.created_at,
               (SELECT GROUP_CONCAT(r.code, ',') FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = a.id) AS roles_csv,
               (SELECT COUNT(*) FROM wb_sessions s WHERE s.account_id = a.id AND s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now')) AS active_sessions
        FROM wb_accounts a
        ${where}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, safeLimit, safeOffset).all()).results || [];
    return { ok: true, accounts: rows };
  }
  async updateAccountStatus(actor, targetAccountId, action, reason = "", ipAddress = null) {
    if (!this.authService.hasPermission(actor, "accounts:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền accounts:manage." };
    }
    if (targetAccountId === actor.accountId && (action === "lock" || action === "suspend")) {
      return { ok: false, status: 400, error: "Không thể tự khóa tài khoản quản trị đang đăng nhập." };
    }
    const target = await this.db.prepare("SELECT id, email, status FROM wb_accounts WHERE id = ?").bind(targetAccountId).first();
    if (!target) return { ok: false, status: 404, error: "Không tìm thấy tài khoản." };
    const targetSuper = await this.db.prepare("SELECT 1 AS is_sa FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE ar.account_id = ? AND r.code = 'super_admin'").bind(targetAccountId).first();
    if (targetSuper && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: "Chỉ Super Admin mới có quyền thay đổi trạng thái của Super Admin khác." };
    }
    if (action === "lock" || action === "suspend") {
      await this.db.prepare("UPDATE wb_accounts SET status = 'suspended', updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, "admin.account_locked", "wb_accounts", targetAccountId, ipAddress, { reason });
      return { ok: true, accountId: targetAccountId, status: "suspended" };
    }
    if (action === "unlock" || action === "activate") {
      await this.db.prepare("UPDATE wb_accounts SET status = 'active', failed_login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, "admin.account_unlocked", "wb_accounts", targetAccountId, ipAddress, { reason });
      return { ok: true, accountId: targetAccountId, status: "active" };
    }
    if (action === "verify_email") {
      await this.db.prepare("UPDATE wb_accounts SET email_verified = 1, email_verified_at = datetime('now'), status = CASE WHEN status = 'pending_verification' THEN 'active' ELSE status END, updated_at = datetime('now') WHERE id = ?").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, "admin.account_email_verified", "wb_accounts", targetAccountId, ipAddress, {});
      return { ok: true, accountId: targetAccountId, emailVerified: 1 };
    }
    if (action === "revoke_sessions") {
      await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE account_id = ? AND revoked_at IS NULL").bind(targetAccountId).run();
      await this.authService.recordAudit(actor.accountId, "admin.sessions_revoked", "wb_sessions", targetAccountId, ipAddress, {});
      return { ok: true, accountId: targetAccountId, sessionsRevoked: true };
    }
    return { ok: false, status: 400, error: "Hành động tài khoản không hợp lệ." };
  }
  // ---- 3. STAFF & RBAC MANAGEMENT (ANTI-SELF-ELEVATION) ----
  async listStaffAndRoles(actor) {
    if (!this.authService.hasPermission(actor, "rbac:manage") && !this.authService.hasPermission(actor, "accounts:view")) {
      return { ok: false, status: 403, error: "Thiếu quyền xem nhân sự và phân quyền." };
    }
    const [roles, staff] = await Promise.all([
      this.db.prepare("SELECT id, code, name_vi, description_vi FROM wb_roles ORDER BY code ASC").all(),
      this.db.prepare(`
        SELECT a.id, a.email, a.full_name, a.status, r.code AS role_code, r.name_vi AS role_name, ar.granted_at, ar.granted_by
        FROM wb_account_roles ar
        JOIN wb_accounts a ON a.id = ar.account_id
        JOIN wb_roles r ON r.id = ar.role_id
        ORDER BY r.code, a.email
      `).all()
    ]);
    return { ok: true, roles: roles.results || [], staff: staff.results || [] };
  }
  async assignRole(actor, targetAccountId, roleCode, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "rbac:manage")) {
      return { ok: false, status: 403, error: "Bạn không có quyền phân vai trò quản trị (yêu cầu quyền rbac:manage)." };
    }
    if (!ADMIN_ROLE_CODES.has(roleCode)) {
      return { ok: false, status: 400, error: `Vai trò không hợp lệ hoặc đã ngừng sử dụng: ${roleCode}` };
    }
    if (targetAccountId === actor.accountId) {
      return { ok: false, status: 403, error: "Không cho phép tự cấp quyền hoặc tự nâng quyền cho chính mình." };
    }
    if (roleCode === "super_admin" && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: "Chỉ Super Admin mới được phép cấp vai trò super_admin." };
    }
    const target = await this.db.prepare("SELECT id FROM wb_accounts WHERE id = ?").bind(targetAccountId).first();
    if (!target) return { ok: false, status: 404, error: "Tài khoản mục tiêu không tồn tại." };
    const role = await this.db.prepare("SELECT id, code, name_vi FROM wb_roles WHERE code = ?").bind(roleCode).first();
    if (!role) return { ok: false, status: 404, error: "Vai trò không tồn tại trong cơ sở dữ liệu." };
    await this.db.prepare("INSERT OR IGNORE INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, ?, ?)").bind(targetAccountId, role.id, actor.accountId).run();
    await this.authService.recordAudit(actor.accountId, "rbac.role_assigned", "wb_account_roles", targetAccountId, ipAddress, { roleCode });
    return { ok: true, role };
  }
  async revokeRole(actor, targetAccountId, roleCode, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "rbac:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền rbac:manage." };
    }
    if (roleCode === "super_admin" && !this.authService.isSuperAdmin(actor)) {
      return { ok: false, status: 403, error: "Chỉ Super Admin mới có quyền thu hồi vai trò super_admin." };
    }
    if (targetAccountId === actor.accountId && roleCode === "super_admin") {
      return { ok: false, status: 400, error: "Không thể tự thu hồi vai trò Super Admin của chính mình." };
    }
    const role = await this.db.prepare("SELECT id, code FROM wb_roles WHERE code = ?").bind(roleCode).first();
    if (!role) return { ok: false, status: 404, error: "Vai trò không tồn tại." };
    await this.db.prepare("DELETE FROM wb_account_roles WHERE account_id = ? AND role_id = ?").bind(targetAccountId, role.id).run();
    await this.authService.recordAudit(actor.accountId, "rbac.role_revoked", "wb_account_roles", targetAccountId, ipAddress, { roleCode });
    return { ok: true, accountId: targetAccountId, roleCode };
  }
  // ---- 4. ACADEMIC & CONTENT MANAGEMENT ----
  async getAcademicOverview(actor) {
    const canView = this.authService.hasPermission(actor, "curriculum:create") || this.authService.hasPermission(actor, "curriculum:review") || this.authService.hasPermission(actor, "curriculum:publish") || this.authService.hasPermission(actor, "reader:manage");
    if (!canView) return { ok: false, status: 403, error: "Thiếu quyền quản trị học thuật." };
    const [languages, programs, courses, lessons, exercises, dictEntries, grammarTopics, readerDocs] = await Promise.all([
      this.db.prepare("SELECT * FROM wb_languages ORDER BY code").all(),
      this.db.prepare("SELECT id, code, slug, name_vi, language_code, program_type, review_status FROM wb_programs ORDER BY language_code, code LIMIT 50").all(),
      this.db.prepare("SELECT id, slug, title_vi, language_code, total_weeks, review_status FROM wb_courses ORDER BY language_code, slug LIMIT 50").all(),
      this.db.prepare("SELECT id, slug, title_vi, language_code, level_ref, review_status FROM wb_lessons ORDER BY language_code, id LIMIT 60").all(),
      this.db.prepare("SELECT id, title_vi, language_code, skill, level_ref FROM wb_practice_exercises ORDER BY language_code, skill LIMIT 50").all(),
      this.db.prepare("SELECT id, headword, language_code, level_ref, specialized_domain, review_status FROM wb_dictionary_entries ORDER BY created_at DESC LIMIT 40").all(),
      this.db.prepare("SELECT id, title_vi, language_code, level_ref, review_status FROM wb_grammar_topics ORDER BY language_code, id LIMIT 40").all(),
      this.db.prepare("SELECT id, slug, title_vi, language_code, category, level_ref, review_status FROM wb_reader_documents ORDER BY updated_at DESC LIMIT 40").all().catch(() => ({ results: [] }))
    ]);
    return {
      ok: true,
      languages: languages.results || [],
      programs: programs.results || [],
      courses: courses.results || [],
      lessons: lessons.results || [],
      exercises: exercises.results || [],
      dictionaryEntries: dictEntries.results || [],
      grammarTopics: grammarTopics.results || [],
      readerDocuments: readerDocs.results || []
    };
  }
  async updateContentStatus(actor, tableName, itemId, newStatus, ipAddress = null) {
    const allowedTables = /* @__PURE__ */ new Set([
      "wb_programs",
      "wb_curricula",
      "wb_courses",
      "wb_lessons",
      "wb_dictionary_entries",
      "wb_grammar_topics",
      "wb_practice_exercises",
      "wb_reader_documents"
    ]);
    const allowedStatuses = /* @__PURE__ */ new Set(["draft", "in_review", "editing", "approved", "published", "archived"]);
    if (!allowedTables.has(tableName) || !allowedStatuses.has(newStatus)) {
      return { ok: false, status: 400, error: "Bảng hoặc trạng thái duyệt học thuật không hợp lệ." };
    }
    if (newStatus === "published" && !this.authService.hasPermission(actor, "curriculum:publish")) {
      return { ok: false, status: 403, error: "Bạn không có quyền phát hành nội dung học thuật chính thức (yêu cầu curriculum:publish)." };
    }
    if ((newStatus === "approved" || newStatus === "published") && !this.authService.hasPermission(actor, "curriculum:review") && !actor.roles?.includes("super_admin")) {
      return { ok: false, status: 403, error: "Biên tập viên (Editor) không được tự phê duyệt hoặc xuất bản nội dung do chính mình biên soạn." };
    }
    if (!this.authService.hasPermission(actor, "curriculum:review") && !this.authService.hasPermission(actor, "curriculum:create")) {
      return { ok: false, status: 403, error: "Thiếu quyền cập nhật trạng thái học thuật." };
    }
    await this.db.prepare(`UPDATE ${tableName} SET review_status = ?, updated_at = datetime('now') WHERE id = ?`).bind(newStatus, itemId).run();
    await this.authService.recordAudit(actor.accountId, "academic.status_updated", tableName, itemId, ipAddress, { newStatus });
    return { ok: true, tableName, itemId, newStatus };
  }
  // ---- 5. DATA & STORAGE (D1 & R2) ----
  async getDataAndStorageStatus(actor) {
    if (!this.authService.hasPermission(actor, "data:manage") && !this.authService.hasPermission(actor, "infrastructure:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền quản trị dữ liệu và lưu trữ." };
    }
    const tables = [
      "wb_accounts",
      "wb_sessions",
      "wb_programs",
      "wb_lessons",
      "wb_dictionary_entries",
      "wb_vocabulary_notebook",
      "wb_practice_exercises",
      "wb_practice_results",
      "wb_reader_documents",
      "wb_support_requests",
      "wb_email_events",
      "wb_audit_logs"
    ];
    const tableStats = [];
    for (const t of tables) {
      const row = await this.db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).first().catch(() => ({ cnt: -1 }));
      tableStats.push({ table: t, rows: row?.cnt ?? 0 });
    }
    let r2Status = { connected: false, objects: [], note: "R2 bucket binding chưa được gắn trong môi trường hiện tại." };
    if (this.r2Service && this.r2Service.isAvailable()) {
      try {
        const listed = await this.r2Service.listPrefix("", 50);
        r2Status = {
          connected: true,
          objects: (listed?.objects || []).map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
          note: "Đã kết nối Cloudflare R2 bucket `word`."
        };
      } catch (err) {
        r2Status = { connected: false, objects: [], note: `Lỗi truy vấn R2: ${err.message}` };
      }
    }
    const snapshots = (await this.db.prepare("SELECT * FROM wb_db_snapshots ORDER BY created_at DESC LIMIT 15").all().catch(() => ({ results: [] }))).results || [];
    return { ok: true, d1: { connected: true, tables: tableStats }, r2: r2Status, snapshots };
  }
  async runIntegrityCheckOrBackup(actor, snapshotType = "integrity_check", ipAddress = null) {
    if (!this.authService.hasPermission(actor, "data:manage") && !this.authService.hasPermission(actor, "infrastructure:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền sao lưu / kiểm tra toàn vẹn dữ liệu." };
    }
    const allowedTypes = /* @__PURE__ */ new Set(["integrity_check", "logical_d1_summary", "r2_inventory"]);
    if (!allowedTypes.has(snapshotType)) {
      return { ok: false, status: 400, error: "Loại tác vụ dữ liệu không hợp lệ." };
    }
    const id = generateId("snp");
    let summary = {};
    let r2Key = null;
    if (snapshotType === "integrity_check") {
      const check = await this.db.prepare("PRAGMA integrity_check").first().catch(() => ({ integrity_check: "unknown" }));
      const fkCheck = await this.db.prepare("PRAGMA foreign_key_check").all().catch(() => ({ results: [] }));
      summary = {
        integrityCheck: check?.integrity_check || Object.values(check || {})[0] || "ok",
        foreignKeyViolations: (fkCheck.results || []).length,
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } else if (snapshotType === "logical_d1_summary") {
      const status = await this.getDataAndStorageStatus(actor);
      summary = { tables: status.d1.tables, exportedAt: (/* @__PURE__ */ new Date()).toISOString() };
      if (this.r2Service && this.r2Service.isAvailable()) {
        const key = `backups/${id}.json`;
        await this.r2Service.uploadObject({
          key,
          body: JSON.stringify(summary, null, 2),
          contentType: "application/json",
          visibility: "private",
          uploadedBy: actor.accountId
        });
        r2Key = key;
      }
    } else {
      const status = await this.getDataAndStorageStatus(actor);
      summary = { r2Connected: status.r2.connected, objectCount: status.r2.objects.length, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
    }
    await this.db.prepare("INSERT INTO wb_db_snapshots (id, snapshot_type, created_by, status, r2_object_key, summary_json) VALUES (?, ?, ?, ?, ?, ?)").bind(id, snapshotType, actor.accountId, "completed", r2Key, JSON.stringify(summary)).run();
    await this.authService.recordAudit(actor.accountId, `data.${snapshotType}`, "wb_db_snapshots", id, ipAddress, { r2Key });
    return { ok: true, snapshotId: id, snapshotType, r2ObjectKey: r2Key, summary };
  }
  // ---- 6. SECURITY & AUDIT ----
  async getSecurityOverview(actor) {
    if (!this.authService.hasPermission(actor, "audit:view") && !this.authService.hasPermission(actor, "security:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền xem bảo mật và nhật ký kiểm toán." };
    }
    const [loginLogs, adminLogs, activeSessions, anomalies, policyRows] = await Promise.all([
      this.db.prepare(`
        SELECT l.id, l.action, l.ip_address, l.metadata_json, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        WHERE l.action LIKE 'auth.%'
        ORDER BY l.created_at DESC
        LIMIT 30
      `).all(),
      this.db.prepare(`
        SELECT l.id, l.action, l.resource_type, l.resource_id, l.ip_address, l.metadata_json, l.created_at, a.email AS actor_email
        FROM wb_audit_logs l
        LEFT JOIN wb_accounts a ON a.id = l.actor_account_id
        WHERE l.action NOT LIKE 'auth.%'
        ORDER BY l.created_at DESC
        LIMIT 40
      `).all(),
      this.db.prepare(`
        SELECT s.id, s.account_id, a.email, s.ip_address, s.user_agent, s.created_at, s.expires_at
        FROM wb_sessions s
        JOIN wb_accounts a ON a.id = s.account_id
        WHERE s.revoked_at IS NULL AND datetime(s.expires_at) > datetime('now')
        ORDER BY s.created_at DESC
        LIMIT 30
      `).all(),
      this.db.prepare(`
        SELECT id, email, status, failed_login_attempts, locked_until
        FROM wb_accounts
        WHERE failed_login_attempts >= 3 OR (locked_until IS NOT NULL AND datetime(locked_until) > datetime('now'))
        ORDER BY failed_login_attempts DESC
        LIMIT 20
      `).all(),
      this.db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key LIKE 'security.%'").all().catch(() => ({ results: [] }))
    ]);
    return {
      ok: true,
      loginLogs: loginLogs.results || [],
      adminLogs: adminLogs.results || [],
      activeSessions: activeSessions.results || [],
      anomalies: anomalies.results || [],
      securityConfig: policyRows.results || []
    };
  }
  async revokeSessionByAdmin(actor, sessionId, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "security:manage") && !this.authService.hasPermission(actor, "accounts:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền thu hồi phiên đăng nhập." };
    }
    await this.db.prepare("UPDATE wb_sessions SET revoked_at = datetime('now') WHERE id = ?").bind(sessionId).run();
    await this.authService.recordAudit(actor.accountId, "security.session_revoked", "wb_sessions", sessionId, ipAddress, {});
    return { ok: true, sessionId };
  }
  // ---- 7. OPERATIONS (EMAIL, NOTIFICATIONS, SUPPORT, JOBS, CONFIG, MAINTENANCE) ----
  async getOperationsOverview(actor) {
    const canOp = this.authService.hasPermission(actor, "operations:manage") || this.authService.hasPermission(actor, "infrastructure:manage") || this.authService.hasPermission(actor, "support:manage");
    if (!canOp) return { ok: false, status: 403, error: "Thiếu quyền quản trị vận hành." };
    const [tickets, emails, notifications, jobs, configs] = await Promise.all([
      this.db.prepare("SELECT * FROM wb_support_requests ORDER BY created_at DESC LIMIT 40").all(),
      this.db.prepare("SELECT id, event_type, template_key, recipient_email, delivery_status, provider_name, created_at FROM wb_email_events ORDER BY created_at DESC LIMIT 30").all(),
      this.db.prepare("SELECT * FROM wb_notifications ORDER BY created_at DESC LIMIT 20").all().catch(() => ({ results: [] })),
      this.db.prepare("SELECT * FROM wb_background_jobs ORDER BY job_name ASC").all(),
      this.db.prepare("SELECT * FROM wb_platform_config ORDER BY config_key ASC").all().catch(() => ({ results: [] }))
    ]);
    return {
      ok: true,
      tickets: tickets.results || [],
      emails: emails.results || [],
      notifications: notifications.results || [],
      jobs: jobs.results || [],
      configs: configs.results || []
    };
  }
  async updatePlatformConfig(actor, configKey, configValue, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "operations:manage") && !this.authService.hasPermission(actor, "infrastructure:manage") && !this.authService.hasPermission(actor, "security:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền cập nhật cấu hình hệ thống." };
    }
    const allowedKeys = /* @__PURE__ */ new Set([
      "site.maintenance_mode",
      "site.maintenance_message",
      "site.announcement_banner",
      "security.max_login_attempts",
      "security.lockout_minutes"
    ]);
    if (!allowedKeys.has(configKey)) {
      return { ok: false, status: 400, error: `Khóa cấu hình không được phép: ${configKey}` };
    }
    if (configKey.startsWith("security.") && !this.authService.hasPermission(actor, "security:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền security:manage để thay đổi cấu hình bảo mật." };
    }
    const cleanVal = String(configValue ?? "").trim().slice(0, 500);
    await this.db.prepare(`
        INSERT INTO wb_platform_config (config_key, config_value, description_vi, updated_by, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_by = excluded.updated_by, updated_at = datetime('now')
      `).bind(configKey, cleanVal, `Cập nhật từ /quan-tri`, actor.accountId).run();
    await this.authService.recordAudit(actor.accountId, "operations.config_updated", "wb_platform_config", configKey, ipAddress, { configValue: cleanVal });
    return { ok: true, configKey, configValue: cleanVal };
  }
  async createNotification(actor, { accountId = null, titleVi, bodyVi, category = "announcement" }, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "operations:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền operations:manage." };
    }
    const title = String(titleVi || "").trim();
    const body = String(bodyVi || "").trim();
    if (!title || !body) return { ok: false, status: 400, error: "Thiếu tiêu đề hoặc nội dung thông báo." };
    const id = generateId("ntf");
    await this.db.prepare("INSERT INTO wb_notifications (id, account_id, title_vi, body_vi, category, created_by) VALUES (?, ?, ?, ?, ?, ?)").bind(id, accountId || null, title, body, category, actor.accountId).run();
    await this.authService.recordAudit(actor.accountId, "operations.notification_created", "wb_notifications", id, ipAddress, { category });
    return { ok: true, notificationId: id };
  }
  async replySupportTicket(actor, ticketId, { replyBody = "", newStatus = "in_progress" }, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "support:manage")) {
      return { ok: false, status: 403, error: "Thiếu quyền support:manage." };
    }
    const ticket = await this.db.prepare("SELECT * FROM wb_support_requests WHERE id = ?").bind(ticketId).first();
    if (!ticket) return { ok: false, status: 404, error: "Không tìm thấy yêu cầu hỗ trợ." };
    const allowedStatuses = /* @__PURE__ */ new Set(["open", "in_progress", "resolved", "closed"]);
    const statusToSet = allowedStatuses.has(newStatus) ? newStatus : ticket.status;
    const cleanReply = String(replyBody || "").trim();
    let replyId = null;
    if (cleanReply) {
      replyId = generateId("rep");
      await this.db.prepare("INSERT INTO wb_support_replies (id, ticket_id, author_account_id, author_name, author_role, reply_body) VALUES (?, ?, ?, ?, ?, ?)").bind(replyId, ticketId, actor.accountId, actor.fullName || actor.email, actor.roles[0] || "support_admin", cleanReply).run();
      if (this.emailService) {
        await this.emailService.sendEventEmail({
          eventType: "SupportTicketReplied",
          templateKey: "support_response",
          recipientEmail: ticket.sender_email,
          accountId: ticket.account_id || null,
          idempotencyKey: `support_reply:${replyId}`,
          variables: { replyBody: cleanReply, ctaUrl: `${this.authService.baseUrl}/help` }
        });
      }
    }
    await this.db.prepare("UPDATE wb_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(statusToSet, ticketId).run();
    await this.authService.recordAudit(actor.accountId, "support.ticket_updated", "wb_support_requests", ticketId, ipAddress, { status: statusToSet, hasReply: Boolean(cleanReply) });
    return { ok: true, ticketId, replyId, status: statusToSet };
  }
  async toggleBackgroundJob(actor, jobName, action, ipAddress = null) {
    if (!this.authService.hasPermission(actor, "infrastructure:manage") && !this.authService.hasPermission(actor, "operations:manage")) {
      return { ok: false, status: 403, error: "Bạn không có quyền điều khiển tác vụ nền." };
    }
    if (action === "run") {
      const res = await this.jobsService.runJob(jobName);
      await this.authService.recordAudit(actor.accountId, "jobs.manual_run", "wb_background_jobs", jobName, ipAddress, res);
      return { ok: true, result: res };
    }
    const newStatus = action === "pause" ? "paused" : "active";
    await this.db.prepare("UPDATE wb_background_jobs SET status = ?, consecutive_failures = 0, updated_at = datetime('now') WHERE job_name = ?").bind(newStatus, jobName).run();
    await this.authService.recordAudit(actor.accountId, `jobs.${action}`, "wb_background_jobs", jobName, ipAddress, { newStatus });
    return { ok: true, jobName, status: newStatus };
  }
  async createSupportOrContactTicket(payload, emailService) {
    const rawCat = String(payload.requestType || "support").trim();
    const catMap = Object.fromEntries(CONTACT_CATEGORIES_12);
    const type = rawCat === "contact_partnership" || rawCat === "partnership_development" ? "contact_partnership" : "support";
    const senderName = String(payload.senderName || "").trim();
    const senderEmail = String(payload.senderEmail || "").trim().toLowerCase();
    const rawSubject = String(payload.subject || "").trim();
    const subject = catMap[rawCat] && !rawSubject.startsWith("[") ? `[${catMap[rawCat]}] ${rawSubject}` : rawSubject;
    const messageBody = String(payload.messageBody || "").trim();
    if (!senderName || !senderEmail || !rawSubject || messageBody.length < 10) {
      return { ok: false, status: 400, error: "Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung tối thiểu 10 ký tự." };
    }
    const recentDup = await this.db.prepare(
      "SELECT id FROM wb_support_requests WHERE sender_email = ? AND subject = ? AND created_at > datetime('now', '-5 minutes') LIMIT 1"
    ).bind(senderEmail, subject).first().catch(() => null);
    if (recentDup) {
      return { ok: false, status: 429, error: "Bạn vừa gửi một yêu cầu trùng lặp. Vui lòng chờ vài phút trước khi gửi lại." };
    }
    const ticketId = generateId(type === "support" ? "cskh" : "cnt");
    await this.db.prepare(`
        INSERT INTO wb_support_requests (id, request_type, account_id, sender_name, sender_email, subject, message_body)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(ticketId, type, payload.accountId || null, senderName, senderEmail, subject, messageBody).run();
    const emailRes = await emailService.sendEventEmail({
      eventType: type === "support" ? "SupportRequestCreated" : "ContactRequestCreated",
      templateKey: type === "support" ? "support_request_confirmation" : "contact_partnership_confirmation",
      recipientEmail: senderEmail,
      accountId: payload.accountId || null,
      idempotencyKey: `ticket_confirm:${ticketId}`,
      variables: { senderName, ticketId, subject, ctaUrl: `${this.authService.baseUrl}/help` }
    });
    return { ok: true, ticketId, emailStatus: emailRes.status };
  }
  async listUserSupportTickets(accountId) {
    const tickets = (await this.db.prepare("SELECT * FROM wb_support_requests WHERE account_id = ? ORDER BY created_at DESC LIMIT 30").bind(accountId).all()).results || [];
    const out = [];
    for (const t of tickets) {
      const replies = (await this.db.prepare("SELECT id, author_name, author_role, reply_body, created_at FROM wb_support_replies WHERE ticket_id = ? ORDER BY created_at ASC").bind(t.id).all().catch(() => ({ results: [] }))).results || [];
      out.push({ ...t, replies });
    }
    return out;
  }
};

// src/api/router.js
async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(readJsonBody, "readJsonBody");
function requireAuth(user) {
  if (!user) return errorResponse("UNAUTHORIZED", "Hành động này yêu cầu đăng nhập tài khoản WORD BRIDGE.", 401);
  return null;
}
__name(requireAuth, "requireAuth");
function requireCsrf(request, user, parsedBody = {}) {
  const headerToken = request.headers.get("X-CSRF-Token") || parsedBody?._csrf || "";
  if (!user?.csrfToken || !headerToken || !timingSafeEqual(String(headerToken), String(user.csrfToken))) {
    return errorResponse("CSRF_INVALID", "Thiếu hoặc sai mã bảo vệ CSRF (X-CSRF-Token). Yêu cầu bị từ chối tại backend.", 403);
  }
  return null;
}
__name(requireCsrf, "requireCsrf");

var RATE_LIMIT_BUCKETS = new Map();
function checkRateLimit(key, maxReqs = 30, windowMs = 60000) {
  const now = Date.now();
  const list = (RATE_LIMIT_BUCKETS.get(key) || []).filter((ts) => now - ts < windowMs);
  if (list.length >= maxReqs) {
    RATE_LIMIT_BUCKETS.set(key, list);
    return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  RATE_LIMIT_BUCKETS.set(key, list);
  if (RATE_LIMIT_BUCKETS.size > 5000) RATE_LIMIT_BUCKETS.clear();
  return { allowed: true };
}

async function handleApiRequest(request, url, ctx) {
  const { services, user, env, db: ctxDb, loadVocabJson: loadVocabJson2 } = ctx;
  const apiDb = ctxDb || env.DB;
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const ipAddress = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const userAgent = request.headers.get("User-Agent") || "Unknown";
  const isSecure = url.protocol === "https:";
  if (method === "POST" && env.ENVIRONMENT !== "test" && (path === "/api/v1/auth/login" || path === "/api/v1/admin/auth/login" || path === "/api/v1/auth/register" || path === "/api/v1/admin/pin/verify" || path === "/api/v1/support/tickets")) {
    const rl = checkRateLimit(`${ipAddress}:${path}`, path === "/api/v1/support/tickets" ? 15 : 40, 60000);
    if (!rl.allowed) {
      return jsonResponse({ ok: false, error: { code: "RATE_LIMITED", message: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau." } }, 429, { "Retry-After": String(rl.retryAfterSec) });
    }
  }
  if (path.includes("certificate")) {
    return errorResponse("FEATURE_PROHIBITED", "WORD BRIDGE không cung cấp chức năng cấp chứng chỉ dưới mọi hình thức.", 404);
  }
  if (path.startsWith("/api/v1/examinations") || path.startsWith("/api/v1/examination-attempts") || path.startsWith("/api/v1/examination-results")) {
    return errorResponse("EXAM_MODULE_REMOVED", "Phân hệ Exam đã được loại bỏ hoàn toàn khỏi WORD BRIDGE. Vui lòng sử dụng Cổng Luyện Tập (/practice).", 410);
  }
  if (path === "/api/v1/sso/reader/issue") {
    return errorResponse("SUBDOMAIN_REMOVED", "Thư viện đọc đã được tích hợp trực tiếp tại /reader trên wordbridge.io.vn.", 410);
  }
  if (path === "/api/v1/health" && method === "GET") {
    let langCount = null;
    let dbStatus = "connected";
    let schemaHint = void 0;
    try {
      langCount = await apiDb.prepare("SELECT COUNT(*) AS cnt FROM wb_public_languages").first();
    } catch {
      dbStatus = "schema_incomplete";
      schemaHint = "Run npm run db:fix:remote to apply D1 migrations 0001-0015";
    }
    return jsonResponse({
      ok: dbStatus === "connected",
      service: "WORD BRIDGE API",
      version: "5.3.0",
      domain: BRAND.websiteUrl,
      database: { name: "word", status: dbStatus, officialLanguages: langCount?.cnt || 0, ...schemaHint ? { hint: schemaHint } : {} },
      buildTag: "v5.3.0-17screens-emailcenter-bootstrap",
      storage: { bucket: "word", status: services.r2.isAvailable() ? "connected" : "unbound" },
      emailProvider: env.EMAIL_PROVIDER || "unconfigured",
      learnerMeetProvider: env.LEARNER_MEET_PROVIDER || "unconfigured",
      csrfProtection: "enforced",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (path === "/api/v1/openapi.json" && method === "GET") {
    return jsonResponse({
      openapi: "3.1.0",
      info: { title: "WORD BRIDGE Unified API", version: "4.2.1" },
      servers: [{ url: `${BRAND.websiteUrl}/api/v1` }],
      paths: {
        "/health": { get: { summary: "Health & D1/R2 status" } },
        "/auth/register": { post: { summary: "Đăng ký tài khoản Email/Mật khẩu" } },
        "/auth/login": { post: { summary: "Đăng nhập tài khoản" } },
        "/auth/reset-password": { post: { summary: "Đặt lại mật khẩu bằng token một lần" } },
        "/dictionary/search": { get: { summary: "Tra cứu từ điển (yêu cầu đăng nhập)" } },
        "/specialized/terms": { get: { summary: "Tra cứu 22 bộ thuật ngữ chuyên ngành (46.104 từ)" } },
        "/practice/bank": { get: { summary: "Ngân hàng luyện tập >10.000 ngôn từ (Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp)" } },
        "/reader/documents": { get: { summary: "Danh sách tài liệu Thư viện đọc (/reader)" } },
        "/reader/progress": { post: { summary: "Lưu tiến độ đọc & ghi chú cá nhân" } },
        "/auth/providers": { get: { summary: "Trạng thái 6 phương thức đăng nhập (Email, Passkey, OAuth)" } },
        "/auth/oauth/{provider}/start": { get: { summary: "Khởi tạo OAuth2 (Google, Facebook, Microsoft, Apple) khi đã cấu hình" } },
        "/auth/oauth/verify-phone": { post: { summary: "Xác minh số điện thoại sau đăng nhập OAuth" } },
        "/specialized/catalog-100": { get: { summary: "Danh mục 100 lĩnh vực chuyên ngành (103 mã độc lập) & 44 chủ điểm nền tảng" } },
        "/language-services/status": { get: { summary: "Trạng thái cấu hình các nhà cung cấp API ngôn ngữ" } },
        "/reader/documents/{id}": { get: { summary: "Chi tiết tài liệu Thư viện đọc" } },
        "/skills/reading/attempts": { post: { summary: "Tạo phiên đọc hiểu 4 tầng" } },
        "/skills/reading/attempts/{id}/submit": { post: { summary: "Chấm bài đọc hiểu 4 tầng" } },
        "/speech/tts": { post: { summary: "Chuyển văn bản thành giọng nói TTS (Trung/Anh)" } },
        "/skills/listening/attempts": { post: { summary: "Tạo phiên luyện nghe" } },
        "/skills/listening/attempts/{id}/submit": { post: { summary: "Chấm bài nghe & phân tích lỗi" } },
        "/skills/speaking/sessions": { post: { summary: "Tạo phiên luyện nói (lưu tạm tối đa 24h)" } },
        "/skills/speaking/sessions/{id}/audio": { post: { summary: "Tải bản ghi âm riêng tư lên R2" } },
        "/skills/speaking/sessions/{id}/transcribe": { post: { summary: "Chuyển giọng nói thành văn bản STT" } },
        "/skills/speaking/sessions/{id}/evaluate": { post: { summary: "Đánh giá bài nói" } },
        "/pronunciation/assessments": { post: { summary: "Đánh giá phát âm độc lập (Trung/Anh)" } },
        "/skills/writing/submissions": { post: { summary: "Lưu bản nháp bài viết theo phiên bản" } },
        "/skills/writing/submissions/{id}/evaluate": { post: { summary: "Đánh giá bài viết theo tiêu chí (không ghi đè bài gốc)" } },
        "/translation/translate": { post: { summary: "Dịch thuật hai chiều Trung–Anh–Việt (Zero User Data Storage)" } },
        "/ocr/extract": { post: { summary: "Trích xuất văn bản OCR tài liệu riêng tư" } },
        "/learning/progress": { get: { summary: "Tổng hợp tiến độ học tập 4 kỹ năng, khóa học & từ vựng" } },
        "/privacy/requests": { get: { summary: "Danh sách yêu cầu quyền riêng tư" }, post: { summary: "Gửi yêu cầu truy cập/sửa/xóa/rút đồng ý dữ liệu" } },
        "/privacy/consents": { get: { summary: "Lịch sử xác nhận chính sách & đồng ý" }, post: { summary: "Ghi nhận trạng thái đồng ý theo phiên bản" } },
        "/support/tickets": { get: { summary: "Theo dõi yêu cầu CSKH cá nhân" }, post: { summary: "Gửi yêu cầu CSKH / Liên hệ 12 nhóm" } },
        "/practice/submit": { post: { summary: "Nộp bài luyện tập 6 kỹ năng" } }
      }
    });
  }
  const audioStreamMatch = path.match(/^\/api\/v1\/audio\/([^/]+)\/stream$/);
  if (audioStreamMatch && method === "GET") {
    if (!user) return errorResponse("UNAUTHORIZED", "Cần đăng nhập tài khoản WORD BRIDGE để nghe phát âm và audio học tập.", 401);
    const asset = await apiDb.prepare("SELECT * FROM wb_public_audio_assets WHERE id = ?").bind(audioStreamMatch[1]).first();
    if (!asset || asset.review_status !== "published") {
      return errorResponse("AUDIO_NOT_FOUND", "Không tìm thấy bản ghi âm thanh đã xuất bản.", 404);
    }
    try {
      const obj = await services.r2.getObject(asset.r2_object_key, { allowPrivate: true });
      if (!obj) {
        return errorResponse("AUDIO_ASSET_PENDING_UPLOAD", "Tệp audio chính thức chưa được tải lên R2 bucket `word`.", 404);
      }
      return new Response(obj.body, {
        status: 200,
        headers: { "Content-Type": asset.content_type || "audio/mpeg", "Accept-Ranges": "bytes" }
      });
    } catch (err) {
      throw err;
    }
  }
  if (path === "/api/v1/reader/documents" && method === "GET") {
    const res = await services.reader.listDocumentsPaginated({
      language: url.searchParams.get("language") || "",
      category: url.searchParams.get("category") || "",
      domainGroup: url.searchParams.get("domainGroup") || "",
      q: url.searchParams.get("q") || "",
      page: Number(url.searchParams.get("page") || 1),
      limit: Number(url.searchParams.get("limit") || 24)
    });
    return jsonResponse({
      ok: true,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
      stats: res.stats,
      documents: res.items
    });
  }
  const readerFileMatch = path.match(/^\/api\/v1\/reader\/documents\/([^/]+)\/file$/);
  if (readerFileMatch && method === "GET") {
    if (!user) return errorResponse("UNAUTHORIZED", "Cần đăng nhập để tải tệp tài liệu Reader.", 401);
    const doc = await apiDb.prepare("SELECT * FROM wb_public_reader_documents WHERE id = ? AND review_status = 'published'").bind(readerFileMatch[1]).first();
    if (!doc || !doc.r2_object_key) {
      return errorResponse("READER_FILE_NOT_FOUND", "Tài liệu không có tệp đính kèm trong R2.", 404);
    }
    try {
      const obj = await services.r2.getObject(doc.r2_object_key, { allowPrivate: true });
      if (!obj) return errorResponse("READER_FILE_MISSING", "Không tìm thấy tệp trong R2 bucket `word`.", 404);
      return new Response(obj.body, {
        status: 200,
        headers: { "Content-Type": doc.content_type || "application/pdf" }
      });
    } catch (err) {
      throw err;
    }
  }
  if (path === "/api/v1/languages" && method === "GET") {
    return jsonResponse({ ok: true, languages: Object.values(OFFICIAL_LANGUAGES) });
  }
  if (path === "/api/v1/programs" && method === "GET") {
    const langParam = url.searchParams.get("language");
    const typeParam = url.searchParams.get("type");
    try {
      const clauses = [];
      const params = [];
      if (langParam) {
        const norm = typeParam === "specialized" ? assertSpecializedLanguage(langParam) : assertOfficialLanguage(langParam);
        clauses.push("language_code = ?");
        params.push(norm);
      }
      if (typeParam) {
        clauses.push("program_type = ?");
        params.push(typeParam);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const res = await apiDb.prepare(`SELECT * FROM wb_public_programs ${where} ORDER BY language_code, code`).bind(...params).all();
      return jsonResponse({ ok: true, programs: res.results || [] });
    } catch (err) {
      return errorResponse("INVALID_LANGUAGE_SCOPE", err.message, 400);
    }
  }
  if (path === "/api/v1/dictionary/search" && method === "GET") {
    if (!user) return errorResponse("UNAUTHORIZED", "Cần đăng nhập để sử dụng tìm kiếm từ điển tương tác.", 401);
    const result = await services.dictionary.search({
      q: url.searchParams.get("q") || "",
      language: url.searchParams.get("language") || "",
      level: url.searchParams.get("level") || "",
      pos: url.searchParams.get("pos") || "",
      topic: url.searchParams.get("topic") || "",
      domain: url.searchParams.get("domain") || "",
      limit: Number(url.searchParams.get("limit") || 30),
      offset: Number(url.searchParams.get("offset") || 0)
    });
    if (result.error) return errorResponse("INVALID_LANGUAGE_SCOPE", result.error, 400);
    return jsonResponse({ ok: true, ...result });
  }
  if (path === "/api/v1/practice/bank" && method === "GET") {
    const skill = String(url.searchParams.get("skill") || "all").trim().toLowerCase();
    const lang = String(url.searchParams.get("lang") || "").trim().toLowerCase();
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const shardNames = ["digital-business", "industrial", "mechanical"];
    const pool = [];
    for (const sname of shardNames) {
      const res = await loadStaticAsset(`/data/vocab/${sname}.json`, request, url, env);
      if (res && res.ok) {
        const obj = await res.json();
        for (const [domSlug, domData] of Object.entries(obj)) {
          const words = Array.isArray(domData?.words) ? domData.words : [];
          for (let i = 0; i < words.length; i++) {
            const w = words[i];
            if (lang && (w.l || "en") !== lang) continue;
            if (q && !`${w.w || ""} ${w.m || ""} ${w.t || ""} ${domData.nameVi || ""}`.toLowerCase().includes(q)) continue;
            pool.push({ domSlug, domName: domData.nameVi || domSlug, ...w });
          }
        }
      }
    }
    const grammarPatterns = [
      { l: "en", w: "Passive voice in technical specs", i: "/ˈpæsɪv vɔɪs/", m: "Câu bị động mô tả quy trình kỹ thuật (is + V-ed/V3)", ex: "The circuit breaker is inspected before energization.", t: "Ngữ pháp Kỹ thuật EN" },
      { l: "en", w: "Conditional Type 1 (Safety)", i: "/kənˈdɪʃənl/", m: "Câu điều kiện loại 1 diễn đạt cảnh báo vận hành (If + S + V, S + must/will + V)", ex: "If pressure exceeds 6 bar, the relief valve will open.", t: "Ngữ pháp Điều kiện EN" },
      { l: "en", w: "Relative clauses with 'which/that'", i: "/ˈrelətɪv klɔːz/", m: "Mệnh đề quan hệ xác định thông số thiết bị", ex: "The sensor that measures vibration connects to the PLC.", t: "Mệnh đề Quan hệ EN" },
      { l: "zh", w: "把字句 (Câu chữ 把)", i: "bǎ zì jù", m: "Cấu trúc xử lý đối tượng: Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả", ex: "请把电源总开关关闭后再检修。", t: "Ngữ pháp HSK 3-6" },
      { l: "zh", w: "被字句 (Câu bị động chữ 被)", i: "bèi zì jù", m: "Câu bị động: Đối tượng + 被 + Chủ thể + Động từ + Thành phần khác", ex: "故障模块已经被工程师更换了。", t: "Ngữ pháp HSK 3-6" },
      { l: "zh", w: "依据…进行… (Theo chuẩn... tiến hành...)", i: "yījù... jìnxíng...", m: "Cấu trúc văn bản quy chuẩn chuyên ngành", ex: "请依据国际标准进行质量检验。", t: "Ngữ pháp Văn bản ZH" }
    ];
    let items = [];
    if (skill === "reading") {
      const lib = await loadReaderLibrary(request, url, env);
      const arts = Array.isArray(lib?.articles) ? lib.articles : [];
      const filteredArts = arts.filter((a) => (!lang || a.language_code === lang) && (!q || `${a.title_vi} ${a.summary_vi}`.toLowerCase().includes(q)));
      const total = filteredArts.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const slice = filteredArts.slice((safePage - 1) * limit, safePage * limit).map((a, idx) => ({
        id: a.id,
        skill: "reading",
        lang: a.language_code,
        level: a.level_ref,
        domain: a.domain_group_vi,
        prompt: a.title_vi,
        phonetic: a.sub_field_vi,
        answer: a.summary_vi,
        slug: a.slug,
        sample: (a.content_text || "").slice(0, 320) + "...",
        idx: (safePage - 1) * limit + idx + 1
      }));
      return jsonResponse({ ok: true, skill, total, bankWordsTotal: pool.length + arts.length, page: safePage, totalPages, items: slice });
    }
    const total = pool.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const slice = pool.slice(start, start + limit).map((item, idx) => {
      const n = start + idx;
      const distractors = [
        pool[(n + 7) % pool.length]?.m || "quy trình kiểm định",
        pool[(n + 23) % pool.length]?.m || "thiết bị đo lường",
        pool[(n + 59) % pool.length]?.m || "báo cáo vận hành"
      ];
      const options = [item.m, ...distractors].sort((a, b) => a.localeCompare(b));
      const g = grammarPatterns[n % grammarPatterns.length];
      return {
        id: `pb-${item.domSlug}-${item.n}`,
        skill,
        lang: item.l || "en",
        domain: item.domName,
        topic: item.t || "",
        word: item.w,
        phonetic: item.i || "",
        meaning: item.m,
        example: item.ex || (item.l === "zh" ? `请在${item.domName}中正确使用“${item.w}”。` : `Verify ${item.w} in ${item.domName}.`),
        grammarHint: `${g.w}: ${g.m}`,
        options,
        answer: item.m
      };
    });
    return jsonResponse({ ok: true, skill, total, bankWordsTotal: pool.length, page: safePage, totalPages, items: slice });
  }

  if (path === "/api/v1/specialized/domains" && method === "GET") {
    const langParam = url.searchParams.get("language");
    if (langParam) {
      try {
        const norm = assertSpecializedLanguage(langParam);
        return jsonResponse({ ok: true, domains: SPECIALIZED_DOMAINS.filter((d) => d.languages.includes(norm)) });
      } catch (err) {
        return errorResponse("SPECIALIZED_LANGUAGE_FORBIDDEN", err.message, 400);
      }
    }
    return jsonResponse({ ok: true, domains: SPECIALIZED_DOMAINS });
  }
  if (path === "/api/v1/specialized/terms" && method === "GET") {
    const domain = String(url.searchParams.get("domain") || "").trim().toLowerCase();
    const lang = String(url.searchParams.get("lang") || "").trim().toLowerCase();
    const srcFilter = String(url.searchParams.get("src") || "").trim().toLowerCase();
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const topic = String(url.searchParams.get("topic") || "").trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const dataset = typeof loadVocabJson2 === "function" ? await loadVocabJson2(domain) : null;
    if (!dataset || !Array.isArray(dataset.words)) {
      return errorResponse("DOMAIN_NOT_FOUND", `Không tìm thấy bộ thuật ngữ chuyên ngành: ${domain}`, 404);
    }
    let words = dataset.words;
    if (lang === "en" || lang === "zh") words = words.filter((w) => (w.l || "en") === lang);
    if (srcFilter === "excel" || srcFilter === "wb_v43") words = words.filter((w) => (w.src || "excel") === srcFilter);
    if (topic) words = words.filter((w) => String(w.t || "").toLowerCase().includes(topic));
    if (q) words = words.filter((w) => `${w.w || ""} ${w.m || ""} ${w.i || ""} ${w.t || ""} ${w.ex || ""}`.toLowerCase().includes(q));
    const total = words.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const topics = lang === "zh" ? (dataset.topicsZh || dataset.topics || []) : lang === "en" ? (dataset.topicsEn || dataset.topics || []) : (dataset.topics || []);
    return jsonResponse({
      ok: true,
      domain: dataset.slug,
      nameVi: dataset.nameVi,
      language: dataset.language,
      languages: dataset.languages || ["en", "zh"],
      enCount: dataset.enCount || 0,
      zhCount: dataset.zhCount || 0,
      authoredTotalCount: dataset.authoredTotalCount || 1000,
      page: safePage,
      totalPages,
      total,
      topics,
      words: words.slice(start, start + limit)
    });
  }
  if (path === "/api/v1/vocab-v5/stats" && method === "GET") {
    const v5 = await loadVocabV5Data(request, url, env);
    if (!v5) return errorResponse("VOCAB_V5_UNAVAILABLE", "Chưa có dữ liệu từ vựng V5.0 được xuất bản.", 503);
    return jsonResponse({ ok: true, ...v5.index });
  }
  if (path === "/api/v1/vocab-v5/search" && method === "GET") {
    const v5 = await loadVocabV5Data(request, url, env);
    if (!v5) return errorResponse("VOCAB_V5_UNAVAILABLE", "Chưa có dữ liệu từ vựng V5.0 được xuất bản.", 503);
    const result = searchVocabV5(v5.entries, {
      q: url.searchParams.get("q") || "",
      lang: url.searchParams.get("lang") || "",
      domain: url.searchParams.get("domain") || "",
      topic: url.searchParams.get("topic") || "",
      pos: url.searchParams.get("pos") || "",
      level: url.searchParams.get("level") || "",
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 50
    });
    return jsonResponse(result);
  }
  if (path.startsWith("/api/v1/vocab-v5/entry/") && method === "GET") {
    const v5 = await loadVocabV5Data(request, url, env);
    if (!v5) return errorResponse("VOCAB_V5_UNAVAILABLE", "Chưa có dữ liệu từ vựng V5.0 được xuất bản.", 503);
    const entryId = decodeURIComponent(path.slice("/api/v1/vocab-v5/entry/".length));
    const entry = getVocabV5EntryById(v5.entries, entryId);
    if (!entry) return errorResponse("ENTRY_NOT_FOUND", `Không tìm thấy mục từ V5.0: ${entryId}`, 404);
    return jsonResponse({ ok: true, entry });
  }
  if (path === "/api/v1/vocab-v5/save" && method === "POST") {
    if (!user) return errorResponse("AUTH_REQUIRED", "Vui lòng đăng nhập để lưu từ vào sổ từ vựng cá nhân.", 401);
    const v5 = await loadVocabV5Data(request, url, env);
    if (!v5) return errorResponse("VOCAB_V5_UNAVAILABLE", "Chưa có dữ liệu từ vựng V5.0 được xuất bản.", 503);
    const bodyV5 = await readJsonBody(request);
    const entry = getVocabV5EntryById(v5.entries, bodyV5.id || bodyV5.entryId);
    if (!entry) return errorResponse("ENTRY_NOT_FOUND", "Không tìm thấy mục từ V5.0 đã xuất bản.", 404);
    const mapped = toDictionaryNotebookPayload(entry);
    const saved = await services.dictionary.saveToNotebook(user.accountId, {
      entryId: mapped.id,
      groupName: bodyV5.groupName || entry.topic,
      tags: Array.isArray(bodyV5.tags) ? bodyV5.tags : [entry.domain, entry.level],
      personalNote: bodyV5.personalNote || `${entry.ipa} | ${entry.pinyin} — ${entry.meaningVi}`,
      setId: bodyV5.setId || null
    }, {
      resolveSpecializedTerm: async () => mapped
    });
    return jsonResponse({ ok: true, saved, entryId: entry.id, notebookEntryId: mapped.id });
  }
  if (path === "/api/v1/webhooks/email" && method === "POST") {
    const rawBody = await request.text();
    const res = await services.email.verifyAndHandleWebhook({
      rawBody,
      signature: request.headers.get("X-WB-Signature") || request.headers.get("svix-signature"),
      timestamp: request.headers.get("X-WB-Webhook-Timestamp") || request.headers.get("svix-timestamp"),
      webhookEventId: request.headers.get("X-WB-Webhook-Id") || request.headers.get("svix-id")
    });
    if (!res.ok) return errorResponse(res.code || "WEBHOOK_ERROR", res.error, res.status);
    return jsonResponse(res, res.status);
  }
  if (path === "/api/v1/auth/register" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.register(body2, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("REGISTRATION_FAILED", res.errors.join(" "), res.status, res.errors);
    if (body2.termsAccepted && res.accountId) {
      await services.legal.recordConsent(res.accountId, { policyType: "terms", policyVersion: "1.0", acceptanceStatus: "accepted", consentPurpose: "account_agreement", source: "register" }).catch(() => {});
      await services.legal.recordConsent(res.accountId, { policyType: "privacy", policyVersion: "1.0", acceptanceStatus: "notified", consentPurpose: "privacy_notice", source: "register" }).catch(() => {});
    }
    if (res.session) {
      const { session, ...safeRes } = res;
      return jsonResponse(
        { ...safeRes, csrfToken: session.csrfToken },
        201,
        { "Set-Cookie": buildSessionCookie(session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
      );
    }
    return jsonResponse(res, 201);
  }
  if (path === "/api/v1/auth/verify-email" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.verifyEmailToken(body2.token, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("VERIFICATION_FAILED", res.error, res.status);
    return jsonResponse(
      { ok: true, account: res.account, csrfToken: res.session.csrfToken },
      200,
      { "Set-Cookie": buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }
  if (path === "/api/v1/auth/login" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.login(body2, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("LOGIN_FAILED", res.error, res.status);
    return jsonResponse(
      { ok: true, account: res.account, csrfToken: res.session.csrfToken },
      200,
      { "Set-Cookie": buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }
  if (path === "/api/v1/admin/auth/login" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.loginAdmin(body2, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("ADMIN_LOGIN_FAILED", res.error, res.status);
    return jsonResponse(
      { ok: true, account: res.account, csrfToken: res.session.csrfToken, redirectTo: "/quan-tri", message: "Xác thực tài khoản quản trị thành công. Chuyển sang bước mã PIN..." },
      200,
      { "Set-Cookie": buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }
  if (path === "/api/v1/admin/bootstrap" && method === "POST") {
    const body2 = await readJsonBody(request);
    await services.auth.ensureAuthCoreTables();
    const existingSa = await apiDb.prepare(
      "SELECT COUNT(*) AS cnt FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE r.code = 'super_admin'"
    ).first().catch(() => ({ cnt: 0 }));
    if (Number(existingSa?.cnt || 0) > 0) {
      return errorResponse("BOOTSTRAP_LOCKED", "Hệ thống đã có tài khoản Quản trị tối cao. Chức năng khởi tạo lần đầu đã bị khóa vĩnh viễn.", 409);
    }
    const pin = String(body2.pin || "").trim();
    const confirmPin = String(body2.confirmPin || "").trim();
    if (!/^\d{6}$/.test(pin) || pin !== confirmPin) {
      return errorResponse("INVALID_PIN", "Mã PIN phải gồm đúng 6 chữ số (0–9) và khớp với ô xác nhận.", 400);
    }
    if (/^(\d)\1{5}$/.test(pin) || ["123456", "654321", "012345"].includes(pin)) {
      return errorResponse("WEAK_PIN", "Mã PIN quá đơn giản. Vui lòng chọn 6 chữ số an toàn hơn.", 400);
    }
    const fullName = String(body2.fullName || "").trim();
    const email = String(body2.email || "").trim().toLowerCase();
    const password = String(body2.password || "");
    const confirmPassword = String(body2.confirmPassword || "");
    if (fullName.length < 2) return errorResponse("VALIDATION_ERROR", "Vui lòng nhập họ và tên quản trị viên (tối thiểu 2 ký tự).", 400);
    if (!validateEmail(email)) return errorResponse("VALIDATION_ERROR", "Địa chỉ email quản trị không hợp lệ.", 400);
    if (password !== confirmPassword) return errorResponse("VALIDATION_ERROR", "Mật khẩu xác nhận không khớp.", 400);
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) return errorResponse("WEAK_PASSWORD", pwCheck.error, 400);

    // Ensure super_admin role exists in wb_roles
    for (const r of RBAC_ROLES) {
      await apiDb.prepare("INSERT OR IGNORE INTO wb_roles (id, code, name_vi, description_vi) VALUES (?, ?, ?, ?)").bind(`role_${r.code}`, r.code, r.nameVi, r.descriptionVi).run().catch(() => {});
    }
    const saRole = await apiDb.prepare("SELECT id FROM wb_roles WHERE code = 'super_admin'").first();
    const roleId = saRole?.id || "role_super_admin";
    const pwdHash = await hashPassword(password);
    let existingAcc = await apiDb.prepare("SELECT id FROM wb_accounts WHERE email = ?").bind(email).first().catch(() => null);
    let accountId = existingAcc?.id;
    if (accountId) {
      await apiDb.prepare("UPDATE wb_accounts SET full_name = ?, password_hash = ?, email_verified = 1, email_verified_at = datetime('now'), status = 'active', updated_at = datetime('now') WHERE id = ?").bind(fullName, pwdHash, accountId).run();
    } else {
      accountId = generateId("acc");
      await apiDb.prepare(
        "INSERT INTO wb_accounts (id, email, password_hash, full_name, date_of_birth, phone_number, school_name, workplace_name, account_type, email_verified, email_verified_at, status) VALUES (?, ?, ?, ?, '1990-01-01', '0000000000', 'WORD BRIDGE', 'WORD BRIDGE Admin', 'personal', 1, datetime('now'), 'active')"
      ).bind(accountId, email, pwdHash, fullName).run();
      await apiDb.prepare("INSERT OR IGNORE INTO wb_profiles (account_id) VALUES (?)").bind(accountId).run().catch(() => {});
      await apiDb.prepare("INSERT OR IGNORE INTO wb_entitlements (id, account_id, plan_code, source, storage_quota_bytes) VALUES (?, ?, 'PERSONAL_FREE', 'default', ?)").bind(generateId("ent"), accountId, PLANS.PERSONAL_FREE.storageQuotaBytes).run().catch(() => {});
    }
    await apiDb.prepare("INSERT OR IGNORE INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, ?, ?)").bind(accountId, roleId, accountId).run();

    const session = await services.auth.createSession(accountId, { ipAddress, userAgent });
    const adminActor = { accountId, email, fullName, sessionId: session.sessionId, roles: ["super_admin"] };
    const pinSetup = await services.adminPin.setOrUpdatePin(adminActor, { pin, confirmPin }, ipAddress);
    if (!pinSetup.ok) return errorResponse("PIN_SETUP_ERROR", pinSetup.error, pinSetup.status);
    const unlocked = await services.adminPin.verifyPinAndCreateAdminSession(adminActor, pin, { ipAddress, userAgent });
    if (!unlocked.ok) return errorResponse("ADMIN_SESSION_ERROR", unlocked.error, unlocked.status);

    await services.auth.recordAudit(accountId, "admin.bootstrap_initialized", "wb_accounts", accountId, ipAddress, { email });
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS });
    headers.append("Set-Cookie", buildSessionCookie(session.rawSessionToken, 60 * 60 * 24 * 7, isSecure));
    headers.append("Set-Cookie", buildAdminSessionCookie(unlocked.rawToken, isSecure));
    return new Response(JSON.stringify({
      ok: true,
      message: "Khởi tạo mã PIN 6 số và tài khoản Quản trị tối cao thành công! Đang mở Trung tâm Quản trị...",
      redirectTo: "/quan-tri",
      csrfToken: session.csrfToken
    }), { status: 201, headers });
  }
  if (path === "/api/v1/auth/forgot-password" && method === "POST") {
    const body2 = await readJsonBody(request);
    return jsonResponse(await services.auth.requestPasswordReset(body2.email, ipAddress));
  }
  if (path === "/api/v1/auth/reset-password" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.resetPassword(body2, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("PASSWORD_RESET_FAILED", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/student-benefit/confirm" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.studentBenefit.confirmStudentEmail(body2.token);
    if (!res.ok) return errorResponse("STUDENT_BENEFIT_CONFIRM_FAILED", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/auth/providers" && method === "GET") {
    return jsonResponse({
      ok: true,
      methods: [
        { id: "email_password", label: "Email & Mật khẩu", status: "CONFIGURED" },
        { id: "passkey", label: "Passkeys / WebAuthn", status: "CONFIGURED" },
        ...services.oauth.listAllProvidersStatus().map((p) => ({ id: p.provider, label: p.label, status: p.status, requiredSecrets: p.requiredSecrets }))
      ]
    });
  }
  const oauthStartMatch = path.match(/^\/api\/v1\/auth\/oauth\/(google|facebook|microsoft|apple)\/start$/);
  if (oauthStartMatch && method === "GET") {
    const res = await services.oauth.createAuthorizationStart(oauthStartMatch[1], url.searchParams.get("next") || "/my-learning");
    if (!res.ok) return errorResponse(res.code || "OAUTH_ERROR", res.error, res.status, res.providerStatus);
    return jsonResponse(res, 200);
  }
  const oauthCbMatch = path.match(/^\/api\/v1\/auth\/oauth\/(google|facebook|microsoft|apple)\/callback$/);
  if (oauthCbMatch && (method === "GET" || method === "POST")) {
    const providerId = oauthCbMatch[1];
    const st = services.oauth.getProviderStatus(providerId);
    if (!st?.configured) return errorResponse("OAUTH_NOT_CONFIGURED", `Nhà cung cấp ${providerId} chưa được cấu hình Workers Secrets.`, 503);
    const state = url.searchParams.get("state") || "";
    const consumed = await services.oauth.consumeState(providerId, state);
    if (!consumed) return errorResponse("OAUTH_STATE_INVALID", "Mã state chống CSRF không hợp lệ hoặc đã hết hạn.", 400);
    return errorResponse("OAUTH_CODE_EXCHANGE_PENDING", "Đã xác minh state CSRF. Vui lòng hoàn tất trao đổi mã ủy quyền OAuth với endpoint nhà cung cấp thực tế.", 501);
  }
  if (path === "/api/v1/specialized/catalog-100" && method === "GET") {
    return jsonResponse({
      ok: true,
      totalTaxonomyItems: 100,
      independentDomainKeys: SPECIALIZED_100_DOMAINS.length,
      domains: SPECIALIZED_100_DOMAINS,
      foundationTopics: { zh: CHINESE_FOUNDATION_22, en: ENGLISH_FOUNDATION_22 }
    });
  }
  if (path === "/api/v1/language-services/status" && method === "GET") {
    return jsonResponse({ ok: true, providers: services.languageApi.getProviderInventory() });
  }
  const readerDocGetMatch = path.match(/^\/api\/v1\/reader\/documents\/([^/]+)$/);
  if (readerDocGetMatch && method === "GET") {
    const doc = await services.reader.getDocumentByIdOrSlug(readerDocGetMatch[1]);
    if (!doc) return errorResponse("NOT_FOUND", "Không tìm thấy tài liệu trong Thư viện đọc.", 404);
    return jsonResponse({ ok: true, document: doc });
  }
  if (path === "/api/v1/account/passkeys/authenticate/options" && method === "POST") {
    return jsonResponse(await services.auth.createPasskeyAuthOptions(null));
  }
  if (path === "/api/v1/account/passkeys/authenticate/verify" && method === "POST") {
    const body2 = await readJsonBody(request);
    const res = await services.auth.verifyPasskeyAssertion(body2, { ipAddress, userAgent });
    if (!res.ok) return errorResponse("PASSKEY_AUTH_FAILED", res.error, res.status);
    return jsonResponse(
      { ok: true, accountId: res.accountId, csrfToken: res.session.csrfToken },
      200,
      { "Set-Cookie": buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }
  const authErr = requireAuth(user);
  if (authErr) return authErr;
  let body = {};
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    body = await readJsonBody(request);
    const csrfErr = requireCsrf(request, user, body);
    if (csrfErr) return csrfErr;
  }
  if (path === "/api/v1/flashcards/review" && method === "POST") {
    const { skill, lessonId, remembered, responseText = "" } = body;
    if (!["grammar", "listening", "speaking", "reading", "writing"].includes(skill) || !["0", "1"].includes(String(remembered)) || typeof lessonId !== "string" || typeof responseText !== "string" || responseText.length > 4e3) {
      return errorResponse("INVALID_REVIEW", "Vui lòng kiểm tra nội dung ôn tập.", 422);
    }
    const lesson = await apiDb.prepare("SELECT id FROM wb_public_lessons WHERE id=?").bind(lessonId).first();
    if (!lesson) return errorResponse("NOT_FOUND", "Bài học hiện chưa khả dụng.", 404);
    await apiDb.prepare(`INSERT INTO wb_skill_reviews(account_id,lesson_id,skill,remembered,response_text)
      VALUES(?,?,?,?,?) ON CONFLICT(account_id,lesson_id,skill) DO UPDATE SET remembered=excluded.remembered,
      response_text=excluded.response_text,updated_at=CURRENT_TIMESTAMP`).bind(user.accountId, lesson.id, skill, Number(remembered), responseText).run();
    return jsonResponse({ ok: true, message: "Đã lưu tiến độ ôn tập." });
  }
  if (path === "/api/v1/support/tickets" && method === "GET") {
    const tickets = await services.admin.listUserSupportTickets(user.accountId);
    return jsonResponse({ ok: true, tickets });
  }
  if (path === "/api/v1/support/tickets" && method === "POST") {
    const res = await services.admin.createSupportOrContactTicket({ ...body, accountId: user.accountId }, services.email);
    if (!res.ok) return errorResponse("VALIDATION_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  if (path === "/api/v1/reader/progress" && method === "POST") {
    const res = await services.reader.saveProgress(user.accountId, {
      documentId: body.documentId,
      currentSection: body.currentSection,
      progressPercent: body.progressPercent,
      bookmarked: body.bookmarked === true || body.bookmarked === "true",
      personalNotes: body.personalNotes
    });
    if (!res.ok) return errorResponse("READER_PROGRESS_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/account/profile" && (method === "POST" || method === "PATCH")) {
    const res = await services.auth.updateProfile(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse("PROFILE_UPDATE_FAILED", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/account/change-password" && method === "POST") {
    const res = await services.auth.changePassword(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse("PASSWORD_CHANGE_FAILED", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/account/sessions/revoke" && method === "POST") {
    if (!body.sessionId) return errorResponse("VALIDATION_ERROR", "Thiếu sessionId.", 400);
    await services.auth.revokeSession(body.sessionId, user.accountId, ipAddress);
    return jsonResponse({ ok: true, sessionId: body.sessionId, message: "Đã đăng xuất phiên đăng nhập." });
  }
  if (path === "/api/v1/account/sessions/revoke-others" && method === "POST") {
    const res = await services.auth.revokeOtherSessions(user.sessionId, user.accountId, ipAddress);
    return jsonResponse(res);
  }
  if (path === "/api/v1/account/preferences" && method === "GET") {
    const preferences = await services.auth.getUserPreferences(user.accountId);
    return jsonResponse({ ok: true, preferences });
  }
  if (path === "/api/v1/account/preferences" && (method === "POST" || method === "PATCH")) {
    const res = await services.auth.updateUserPreferences(user.accountId, body, ipAddress);
    return jsonResponse(res);
  }
  if (path === "/api/v1/account/learning-data/export" && method === "GET") {
    const format = String(url.searchParams.get("format") || "csv").toLowerCase();
    const lessons = (await apiDb.prepare(
      `SELECT lp.status, lp.score_percent, lp.time_spent_seconds, lp.updated_at, l.title_vi, l.language_code
       FROM wb_learner_progress lp LEFT JOIN wb_lessons l ON l.id = lp.lesson_id
       WHERE lp.account_id = ? ORDER BY lp.updated_at DESC LIMIT 500`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const practices = (await apiDb.prepare(
      `SELECT pr.skill, pr.language_code, pr.score, pr.max_score, pr.submitted_at, pe.title_vi
       FROM wb_practice_results pr LEFT JOIN wb_practice_exercises pe ON pe.id = pr.exercise_id
       WHERE pr.account_id = ? ORDER BY pr.submitted_at DESC LIMIT 500`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const readings = (await apiDb.prepare(
      `SELECT rp.progress_percent, rp.bookmarked, rp.last_read_at, rd.title_vi, rd.language_code
       FROM wb_reader_progress rp LEFT JOIN wb_reader_documents rd ON rd.id = rp.document_id
       WHERE rp.account_id = ? ORDER BY rp.last_read_at DESC LIMIT 500`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    if (format === "json") {
      return new Response(JSON.stringify({
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        accountEmail: user.email,
        fullName: user.fullName,
        lessons,
        practices,
        readings
      }, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="wordbridge-learning-data.json"',
          ...SECURITY_HEADERS
        }
      });
    }
    if (format === "html" || format === "pdf") {
      const htmlReport = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>Báo cáo dữ liệu học tập — WORD BRIDGE</title><style>body{font-family:Segoe UI,Arial,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#0d1f22}h1,h2{color:#146466}table{width:100%;border-collapse:collapse;margin:12px 0 24px;font-size:14px}th,td{border:1px solid #d5e4e5;padding:8px;text-align:left}th{background:#f0f6f6}</style></head><body><h1>Báo cáo dữ liệu học tập WORD BRIDGE</h1><p>Học viên: <strong>${escapeHtml(user.fullName || user.email)}</strong> (${escapeHtml(user.email)}) · Xuất lúc: ${escapeHtml((/* @__PURE__ */ new Date()).toISOString())}</p><h2>Bài học (${lessons.length})</h2><table><thead><tr><th>Bài học</th><th>Ngôn ngữ</th><th>Trạng thái</th><th>Điểm (%)</th><th>Thời gian (giây)</th><th>Cập nhật</th></tr></thead><tbody>${lessons.map((r) => `<tr><td>${escapeHtml(r.title_vi || "Bài học")}</td><td>${escapeHtml(r.language_code || "—")}</td><td>${escapeHtml(r.status || "—")}</td><td>${r.score_percent ?? "—"}</td><td>${r.time_spent_seconds || 0}</td><td>${escapeHtml(r.updated_at || "—")}</td></tr>`).join("") || '<tr><td colspan="6">Chưa có dữ liệu bài học.</td></tr>'}</tbody></table><h2>Bài luyện tập (${practices.length})</h2><table><thead><tr><th>Bài luyện tập</th><th>Kỹ năng</th><th>Ngôn ngữ</th><th>Điểm</th><th>Thời điểm</th></tr></thead><tbody>${practices.map((r) => `<tr><td>${escapeHtml(r.title_vi || "Bài luyện tập")}</td><td>${escapeHtml(r.skill || "—")}</td><td>${escapeHtml(r.language_code || "—")}</td><td>${r.score ?? 0}/${r.max_score ?? 0}</td><td>${escapeHtml(r.submitted_at || "—")}</td></tr>`).join("") || '<tr><td colspan="5">Chưa có dữ liệu luyện tập.</td></tr>'}</tbody></table><h2>Tài liệu đã đọc (${readings.length})</h2><table><thead><tr><th>Tài liệu</th><th>Ngôn ngữ</th><th>Tiến độ</th><th>Đọc gần nhất</th></tr></thead><tbody>${readings.map((r) => `<tr><td>${escapeHtml(r.title_vi || "Tài liệu")}</td><td>${escapeHtml(r.language_code || "—")}</td><td>${r.progress_percent ?? 0}%</td><td>${escapeHtml(r.last_read_at || "—")}</td></tr>`).join("") || '<tr><td colspan="4">Chưa có dữ liệu đọc.</td></tr>'}</tbody></table></body></html>`;
      return new Response(htmlReport, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": 'attachment; filename="wordbridge-learning-report.html"',
          ...SECURITY_HEADERS
        }
      });
    }
    const escCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      "loai,tieu_de,ngon_ngu,trang_thai_hoac_ky_nang,ket_qua,thoi_diem",
      ...lessons.map((r) => [escCsv("Bai hoc"), escCsv(r.title_vi || "Bài học"), escCsv(r.language_code || ""), escCsv(r.status || ""), escCsv(r.score_percent ?? ""), escCsv(r.updated_at || "")].join(",")),
      ...practices.map((r) => [escCsv("Luyen tap"), escCsv(r.title_vi || "Bài luyện tập"), escCsv(r.language_code || ""), escCsv(r.skill || ""), escCsv(`${r.score ?? 0}/${r.max_score ?? 0}`), escCsv(r.submitted_at || "")].join(",")),
      ...readings.map((r) => [escCsv("Thu vien doc"), escCsv(r.title_vi || "Tài liệu"), escCsv(r.language_code || ""), escCsv("reading"), escCsv(`${r.progress_percent ?? 0}%`), escCsv(r.last_read_at || "")].join(","))
    ];
    return new Response("\uFEFF" + rows.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="wordbridge-learning-data.csv"',
        ...SECURITY_HEADERS
      }
    });
  }
  if (path === "/api/v1/account/learning-data/clear" && method === "POST") {
    if (body.confirmClear !== "DELETE_LEARNING_DATA") {
      return errorResponse("CONFIRMATION_REQUIRED", "Vui lòng xác nhận trước khi xóa dữ liệu học tập.", 400);
    }
    const res = await services.auth.clearLearningData(user.accountId, ipAddress);
    return jsonResponse(res);
  }
  if (path === "/api/v1/auth/logout" && method === "POST") {
    const cookiesLogout = parseCookies(request);
    if (cookiesLogout.wb_admin_session) {
      await services.adminPin.revokeAdminSession(cookiesLogout.wb_admin_session, user.accountId, ipAddress).catch(() => {});
    }
    await services.auth.logoutSession(user.sessionId, user.accountId, ipAddress);
    const outHeaders = new Headers({ "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS });
    outHeaders.append("Set-Cookie", clearSessionCookie(isSecure));
    outHeaders.append("Set-Cookie", clearAdminSessionCookie(isSecure));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: outHeaders });
  }
  if (path === "/api/v1/auth/me" && method === "GET") {
    return jsonResponse({
      ok: true,
      user: {
        accountId: user.accountId,
        email: user.email,
        fullName: user.fullName,
        schoolName: user.schoolName,
        workplaceName: user.workplaceName,
        planCode: user.planCode,
        storageQuotaBytes: user.storageQuotaBytes,
        roles: user.roles,
        isAdmin: services.auth.hasAnyAdminRole(user),
        csrfToken: user.csrfToken
      }
    });
  }
  if (path === "/api/v1/account/passkeys/register/options" && method === "POST") {
    return jsonResponse(await services.auth.createPasskeyRegistrationOptions(user));
  }
  if (path === "/api/v1/account/passkeys/register/verify" && method === "POST") {
    const res = await services.auth.verifyAndStorePasskeyRegistration(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse("PASSKEY_REGISTER_FAILED", res.error, res.status);
    return jsonResponse(res, 201);
  }
  const pkDelMatch = path.match(/^\/api\/v1\/account\/passkeys\/([^/]+)$/);
  if (pkDelMatch && method === "DELETE") {
    const res = await services.auth.revokePasskey(user.accountId, pkDelMatch[1], ipAddress);
    if (!res.ok) return errorResponse("PASSKEY_REVOKE_FAILED", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/student-benefit/request" && method === "POST") {
    const res = await services.studentBenefit.requestVerification(user.accountId, body);
    if (!res.ok) return errorResponse("STUDENT_BENEFIT_REJECTED", res.error, res.status);
    return jsonResponse(res, 201);
  }
  if (path === "/api/v1/learning/progress" && method === "POST") {
    if (!body.lessonId) return errorResponse("VALIDATION_ERROR", "Thiếu lessonId.", 400);
    const lesson = await apiDb.prepare("SELECT * FROM wb_public_lessons WHERE id = ?").bind(body.lessonId).first();
    if (!lesson) return errorResponse("LESSON_NOT_FOUND", "Bài học không tồn tại.", 404);
    const comp = safeJsonParse(lesson.components_json, {});
    const checkQIds = Array.isArray(comp.checkQuestionIds) ? comp.checkQuestionIds : [];
    const submittedAnswers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const hasAnswers = Object.keys(submittedAnswers).length > 0;
    let score = null;
    let maxScore = null;
    let scorePercent = null;
    let lifecycleStatus = "content_completed";
    let progressStatus = "completed";
    const breakdown = [];
    if (checkQIds.length > 0 && hasAnswers) {
      let earned = 0;
      let total = 0;
      for (const qId of checkQIds) {
        const q = await apiDb.prepare("SELECT * FROM wb_public_question_bank WHERE id = ?").bind(qId).first();
        if (!q || q.auto_gradable !== 1 || !q.correct_answer_json) continue;
        total += q.max_score;
        const expected = safeJsonParse(q.correct_answer_json, {});
        const given = submittedAnswers[qId];
        const correct = String(given ?? "").trim().toLowerCase() === String(expected).trim().toLowerCase();
        if (correct) earned += q.max_score;
        breakdown.push({
          questionId: qId,
          prompt: q.prompt_text,
          given: given ?? "",
          expected,
          correct,
          explanationVi: q.explanation_vi
        });
      }
      if (total > 0) {
        score = earned;
        maxScore = total;
        scorePercent = Number((earned / total * 100).toFixed(2));
        lifecycleStatus = scorePercent >= 70 ? "passed" : "graded";
        progressStatus = scorePercent >= 70 ? "completed" : "in_progress";
      }
    } else if (body.action === "open") {
      lifecycleStatus = "opened";
      progressStatus = "in_progress";
    } else {
      lifecycleStatus = "content_completed";
      progressStatus = "completed";
      scorePercent = null;
    }
    const subId = generateId("lsub");
    await apiDb.prepare(`
        INSERT INTO wb_lesson_submissions (
          id, account_id, lesson_id, lifecycle_status, answers_json, breakdown_json,
          score, max_score, score_percent, skills_assessed_json, improvement_notes_vi, next_recommendation_vi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
      subId,
      user.accountId,
      lesson.id,
      lifecycleStatus,
      JSON.stringify(submittedAnswers),
      JSON.stringify(breakdown),
      score,
      maxScore,
      scorePercent,
      JSON.stringify(["reading", "vocabulary", "grammar"]),
      scorePercent !== null && scorePercent < 70 ? "Cần ôn lại phần từ vựng và cấu trúc ngữ pháp trọng tâm của bài trước khi chuyển buổi tiếp theo." : "Đã ghi nhận tiến độ bài học từ backend (không dùng điểm mặc định phía client).",
      "Ôn tập flashcard tại /vocabulary/review hoặc làm bài luyện tập tại /practice."
    ).run();
    const existing = await apiDb.prepare("SELECT id FROM wb_public_learner_progress WHERE account_id = ? AND lesson_id = ?").bind(user.accountId, lesson.id).first();
    if (existing) {
      await apiDb.prepare(`
          UPDATE wb_learner_progress
          SET status = ?, score_percent = ?,
              time_spent_seconds = time_spent_seconds + ?,
              completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(progressStatus, scorePercent, Number(body.timeSpentSeconds || 0), progressStatus, existing.id).run();
    } else {
      await apiDb.prepare(`
          INSERT INTO wb_learner_progress (id, account_id, week_id, lesson_id, status, score_percent, time_spent_seconds, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END)
        `).bind(generateId("prg"), user.accountId, lesson.week_id, lesson.id, progressStatus, scorePercent, Number(body.timeSpentSeconds || 0), progressStatus).run();
    }
    return jsonResponse({
      ok: true,
      submissionId: subId,
      lifecycleStatus,
      progressStatus,
      score,
      maxScore,
      scorePercent,
      breakdown
    }, 201);
  }
  if (path === "/api/v1/vocabulary/sets" && method === "GET") {
    const sets = await services.dictionary.listSets(user.accountId);
    return jsonResponse({ ok: true, sets });
  }
  if (path === "/api/v1/vocabulary/sets" && method === "POST") {
    const res = await services.dictionary.createSet(user.accountId, body);
    if (!res.ok) return errorResponse("SET_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  const setMatch = path.match(/^\/api\/v1\/vocabulary\/sets\/([^/]+)$/);
  if (setMatch && method === "PATCH") {
    const res = await services.dictionary.updateSet(user.accountId, setMatch[1], body);
    if (!res.ok) return errorResponse("SET_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  if (setMatch && method === "DELETE") {
    const res = await services.dictionary.deleteSet(user.accountId, setMatch[1]);
    if (!res.ok) return errorResponse("SET_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/vocabulary/notebook" && method === "GET") {
    const rows = await apiDb.prepare("SELECT n.*, d.headword, d.phonetic, d.meaning_vi, d.language_code, d.slug, d.specialized_domain FROM wb_public_vocabulary_notebook n JOIN wb_public_dictionary_entries d ON d.id = n.entry_id WHERE n.account_id = ? ORDER BY n.created_at DESC").bind(user.accountId).all();
    return jsonResponse({ ok: true, items: rows.results || [] });
  }
  if (path === "/api/v1/vocabulary/notebook" && method === "POST") {
    const resolveSpecializedTerm = /* @__PURE__ */ __name(async (domain, termNum) => {
      if (typeof loadVocabJson2 !== "function") return null;
      const dataset = await loadVocabJson2(domain);
      if (!dataset || !Array.isArray(dataset.words)) return null;
      const word = dataset.words.find((w) => Number(w.n) === Number(termNum)) || dataset.words[Number(termNum) - 1];
      if (!word) return null;
      return { word, language: dataset.language || "en" };
    }, "resolveSpecializedTerm");
    const res = await services.dictionary.saveToNotebook(user.accountId, body, { resolveSpecializedTerm });
    if (!res.ok) return errorResponse("NOTEBOOK_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  const nbItemMatch = path.match(/^\/api\/v1\/vocabulary\/notebook\/([^/]+)$/);
  if (nbItemMatch && method === "PATCH") {
    const res = await services.dictionary.updateNotebookItem(user.accountId, nbItemMatch[1], body);
    if (!res.ok) return errorResponse("NOTEBOOK_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  if (nbItemMatch && method === "DELETE") {
    const existing = await apiDb.prepare("SELECT id, account_id FROM wb_public_vocabulary_notebook WHERE id = ?").bind(nbItemMatch[1]).first();
    if (!existing) return errorResponse("NOT_FOUND", "Không tìm thấy mục từ.", 404);
    if (existing.account_id !== user.accountId) return errorResponse("FORBIDDEN", "Bạn không có quyền xóa dữ liệu của tài khoản khác.", 403);
    await apiDb.prepare("DELETE FROM wb_vocabulary_notebook WHERE id = ?").bind(existing.id).run();
    return jsonResponse({ ok: true });
  }
  if (path === "/api/v1/vocabulary/review" && method === "POST") {
    const res = await services.dictionary.reviewFlashcard(user.accountId, body.notebookItemId, body.quality, {
      expectedReview: body.expectedReview
    });
    if (!res.ok) return errorResponse(res.code || "SRS_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  if (path === "/api/v1/practice/submit" && method === "POST") {
    const res = await services.practice.submitPractice(user.accountId, body.exerciseId, body.answers);
    if (!res.ok) return errorResponse("PRACTICE_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  const prGetMatch = path.match(/^\/api\/v1\/practice\/results\/([^/]+)$/);
  if (prGetMatch && method === "GET") {
    const row = await apiDb.prepare("SELECT * FROM wb_public_practice_results WHERE id = ?").bind(prGetMatch[1]).first();
    if (!row) return errorResponse("NOT_FOUND", "Không tìm thấy kết quả luyện tập.", 404);
    if (row.account_id !== user.accountId && !services.auth.hasAnyAdminRole(user)) {
      return errorResponse("FORBIDDEN", "Không có quyền xem kết quả của người dùng khác.", 403);
    }
    return jsonResponse({ ok: true, result: row });
  }
  if (path.startsWith("/api/v1/learner-meet/") && /(chat|message|record|screen-share|file)/i.test(path)) {
    return errorResponse("LEARNER_MEET_PROHIBITED", "Learner Meet tuyệt đối không hỗ trợ chat văn bản, gửi tệp, chia sẻ màn hình hoặc ghi âm/ghi hình.", 403);
  }
  if (path === "/api/v1/learner-meet/sessions" && method === "POST") {
    try {
      const res = await services.learnerMeet.createSession(user.accountId, body);
      if (!res.ok) return errorResponse("LEARNER_MEET_ERROR", res.error, res.status);
      return jsonResponse(res, 201);
    } catch (err) {
      return errorResponse("INVALID_LANGUAGE_SCOPE", err.message, 400);
    }
  }
  if (path === "/api/v1/learner-meet/join" && method === "POST") {
    const res = await services.learnerMeet.joinSession(user.accountId, body.sessionCode);
    if (!res.ok) return errorResponse("LEARNER_MEET_JOIN_ERROR", res.error, res.status);
    return jsonResponse(res);
  }
  const intelMatch = path.match(/^\/api\/v1\/intelligence\/([a-z0-9-]+)\/run$/);
  if (intelMatch && method === "POST") {
    try {
      const res = await services.intelligence.executeSystem(user.accountId, intelMatch[1], body);
      if (!res.ok) return errorResponse("INTELLIGENCE_ERROR", res.error, res.status);
      return jsonResponse(res);
    } catch (err) {
      return errorResponse("INVALID_LANGUAGE_SCOPE", err.message, 400);
    }
  }
  if (path === "/api/v1/auth/oauth/verify-phone" && method === "POST") {
    const res = await services.oauth.verifyPostOAuthPhone(user.accountId, body.phoneNumber, ipAddress);
    if (!res.ok) return errorResponse("VALIDATION_ERROR", res.error, res.status);
    return jsonResponse(res, 200);
  }
  if (path === "/api/v1/privacy/requests" && method === "GET") {
    return jsonResponse({ ok: true, requests: await services.legal.listUserPrivacyRequests(user.accountId) });
  }
  if (path === "/api/v1/privacy/requests" && method === "POST") {
    const res = await services.legal.createPrivacyRequest(user.accountId, body);
    if (!res.ok) return errorResponse("VALIDATION_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  if (path === "/api/v1/privacy/consents" && method === "GET") {
    return jsonResponse({ ok: true, consents: await services.legal.listUserConsents(user.accountId) });
  }
  if (path === "/api/v1/privacy/consents" && method === "POST") {
    const res = await services.legal.recordConsent(user.accountId, body);
    if (!res.ok) return errorResponse("VALIDATION_ERROR", res.error, res.status);
    return jsonResponse(res, 201);
  }
  const delRecMatch = path.match(/^\/api\/v1\/privacy\/recordings\/([^/]+)$/);
  if (delRecMatch && method === "DELETE") {
    const row = await apiDb.prepare("SELECT id, r2_audio_key FROM wb_speaking_sessions WHERE id = ? AND account_id = ?").bind(delRecMatch[1], user.accountId).first();
    if (!row) return errorResponse("NOT_FOUND", "Không tìm thấy bản ghi âm của bạn.", 404);
    if (row.r2_audio_key && services.r2?.isAvailable()) await services.r2.deleteObject(row.r2_audio_key).catch(() => {});
    await apiDb.prepare("DELETE FROM wb_speaking_sessions WHERE id = ? AND account_id = ?").bind(row.id, user.accountId).run();
    return jsonResponse({ ok: true, message: "Đã xóa bản ghi âm khỏi tài khoản và bộ nhớ lưu trữ." });
  }
  const delWrtMatch = path.match(/^\/api\/v1\/privacy\/writings\/([^/]+)$/);
  if (delWrtMatch && method === "DELETE") {
    await apiDb.prepare("DELETE FROM wb_writing_submissions WHERE id = ? AND account_id = ?").bind(delWrtMatch[1], user.accountId).run();
    return jsonResponse({ ok: true, message: "Đã xóa bài viết cá nhân." });
  }
  // ---- F1-F9 Language Services API Endpoints ----
  const reqId = (globalThis.crypto || nodeWebCrypto).randomUUID();
  if (path === "/api/v1/learning/progress" && method === "GET") {
    return jsonResponse(await services.languageApi.getUnifiedProgress(user.accountId));
  }
  if (path === "/api/v1/skills/reading/attempts" && method === "POST") {
    const res = await services.languageApi.createReadingAttempt(user.accountId, body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("READING_ERROR", res.error, res.status);
  }
  const readSubMatch = path.match(/^\/api\/v1\/skills\/reading\/attempts\/([^/]+)\/submit$/);
  if (readSubMatch && method === "POST") {
    const res = await services.languageApi.submitReadingAttempt(user.accountId, readSubMatch[1], body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("READING_ERROR", res.error, res.status);
  }
  if (path === "/api/v1/speech/tts" && method === "POST") {
    const res = await services.languageApi.synthesizeTts(user.accountId, body, reqId);
    if (!res.ok) return errorResponse(res.code || "TTS_ERROR", res.error, res.status, { providerStatus: res.providerStatus });
    return new Response(res.audioBuffer, { status: 200, headers: { "Content-Type": res.contentType, "X-Request-Id": reqId, ...SECURITY_HEADERS } });
  }
  if (path === "/api/v1/skills/listening/attempts" && method === "POST") {
    const res = await services.languageApi.createListeningAttempt(user.accountId, body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("LISTENING_ERROR", res.error, res.status);
  }
  const listSubMatch = path.match(/^\/api\/v1\/skills\/listening\/attempts\/([^/]+)\/submit$/);
  if (listSubMatch && method === "POST") {
    const res = await services.languageApi.submitListeningAttempt(user.accountId, listSubMatch[1], body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("LISTENING_ERROR", res.error, res.status);
  }
  if (path === "/api/v1/skills/speaking/sessions" && method === "POST") {
    const res = await services.languageApi.createSpeakingSession(user.accountId, body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("SPEAKING_ERROR", res.error, res.status);
  }
  const spkAudioMatch = path.match(/^\/api\/v1\/skills\/speaking\/sessions\/([^/]+)\/audio$/);
  if (spkAudioMatch && method === "POST") {
    const raw = body.audioBase64 ? Uint8Array.from(atob(String(body.audioBase64)), (c) => c.charCodeAt(0)) : new Uint8Array(0);
    const res = await services.languageApi.attachSpeakingAudio(user.accountId, spkAudioMatch[1], { audioBytes: raw, contentType: body.contentType || "audio/webm" });
    return res.ok ? jsonResponse(res, res.status) : errorResponse("SPEAKING_AUDIO_ERROR", res.error, res.status);
  }
  const spkTransMatch = path.match(/^\/api\/v1\/skills\/speaking\/sessions\/([^/]+)\/transcribe$/);
  if (spkTransMatch && method === "POST") {
    const res = await services.languageApi.transcribeSpeakingSession(user.accountId, spkTransMatch[1], reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse(res.code || "STT_ERROR", res.error, res.status);
  }
  const spkEvalMatch = path.match(/^\/api\/v1\/skills\/speaking\/sessions\/([^/]+)\/evaluate$/);
  if (spkEvalMatch && method === "POST") {
    const sess = await apiDb.prepare("SELECT language_code, target_text FROM wb_speaking_sessions WHERE id = ? AND account_id = ?").bind(spkEvalMatch[1], user.accountId).first();
    if (!sess) return errorResponse("NOT_FOUND", "Không tìm thấy phiên luyện nói.", 404);
    const res = await services.languageApi.evaluatePronunciation(user.accountId, { speakingSessionId: spkEvalMatch[1], languageCode: sess.language_code, targetText: sess.target_text }, reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse(res.code || "SPEAKING_EVAL_ERROR", res.error, res.status, res);
  }
  if (path === "/api/v1/pronunciation/assessments" && method === "POST") {
    const res = await services.languageApi.evaluatePronunciation(user.accountId, body, reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse(res.code || "PRONUNCIATION_ERROR", res.error, res.status, res);
  }
  if (path === "/api/v1/skills/writing/submissions" && method === "POST") {
    const res = await services.languageApi.saveWritingSubmission(user.accountId, body);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("WRITING_ERROR", res.error, res.status);
  }
  const wrtEvalMatch = path.match(/^\/api\/v1\/skills\/writing\/submissions\/([^/]+)\/evaluate$/);
  if (wrtEvalMatch && method === "POST") {
    const res = await services.languageApi.evaluateWritingSubmission(user.accountId, wrtEvalMatch[1], reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse("WRITING_EVAL_ERROR", res.error, res.status);
  }
  if (path === "/api/v1/translation/translate" && method === "POST") {
    const res = await services.languageApi.translateText(user.accountId, body, reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse(res.code || "TRANSLATION_ERROR", res.error, res.status, res);
  }
  if (path === "/api/v1/ocr/extract" && method === "POST") {
    const res = await services.languageApi.runOcr(user.accountId, body, reqId);
    return res.ok ? jsonResponse(res, res.status) : errorResponse(res.code || "OCR_ERROR", res.error, res.status, res);
  }
  if (path.startsWith("/api/v1/admin/")) {
    if (!services.auth.hasAnyAdminRole(user)) {
      return errorResponse("FORBIDDEN", "Tài khoản của bạn không có vai trò quản trị RBAC.", 403);
    }
    if (path === "/api/v1/admin/pin/setup" && method === "POST") {
      const res = await services.adminPin.setOrUpdatePin(user, body, ipAddress);
      if (!res.ok) return errorResponse("ADMIN_PIN_SETUP_FAILED", res.error, res.status);
      const unlocked = await services.adminPin.verifyPinAndCreateAdminSession(user, body.pin, { ipAddress, userAgent });
      if (!unlocked.ok) return jsonResponse(res, 200);
      return jsonResponse(
        { ok: true, message: res.message, adminCsrfToken: unlocked.csrfToken, redirectTo: "/quan-tri" },
        200,
        { "Set-Cookie": buildAdminSessionCookie(unlocked.rawToken, isSecure) }
      );
    }
    if (path === "/api/v1/admin/pin/verify" && method === "POST") {
      const res = await services.adminPin.verifyPinAndCreateAdminSession(user, body.pin, { ipAddress, userAgent });
      if (!res.ok) return errorResponse(res.code || "ADMIN_PIN_INVALID", res.error, res.status);
      return jsonResponse(
        { ok: true, message: "Xác minh mã PIN 6 chữ số thành công.", adminCsrfToken: res.csrfToken, redirectTo: "/quan-tri" },
        200,
        { "Set-Cookie": buildAdminSessionCookie(res.rawToken, isSecure) }
      );
    }
    if (path === "/api/v1/admin/pin/lock" && method === "POST") {
      const cookies2 = parseCookies(request);
      await services.adminPin.revokeAdminSession(cookies2.wb_admin_session, user.accountId, ipAddress);
      return jsonResponse({ ok: true, message: "Đã khóa phiên Trung tâm Quản trị." }, 200, { "Set-Cookie": clearAdminSessionCookie(isSecure) });
    }
    if (path === "/api/v1/admin/auth/logout" && method === "POST") {
      const cookies2 = parseCookies(request);
      await services.adminPin.revokeAdminSession(cookies2.wb_admin_session, user.accountId, ipAddress).catch(() => {});
      await services.auth.logoutSession(user.sessionId, user.accountId, ipAddress).catch(() => {});
      await services.auth.recordAudit(user.accountId, "admin.logout", "wb_admin_sessions", user.accountId, ipAddress, {});
      const outHeaders = new Headers({ "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS });
      outHeaders.append("Set-Cookie", clearAdminSessionCookie(isSecure));
      outHeaders.append("Set-Cookie", clearSessionCookie(isSecure));
      return new Response(JSON.stringify({ ok: true, message: "Đã đăng xuất khỏi hệ thống quản trị.", redirectTo: "/quan-tri/dang-nhap" }), { status: 200, headers: outHeaders });
    }
    const cookies2 = parseCookies(request);
    const adminSession = await services.adminPin.authenticateAdminSession(user, cookies2.wb_admin_session);
    if (!adminSession) {
      return errorResponse("ADMIN_PIN_REQUIRED", "Bắt buộc xác minh mã PIN 6 chữ số hợp lệ trước khi gọi API quản trị.", 403);
    }
    if (path === "/api/v1/admin/pin/force-reset" && method === "POST") {
      const res = await services.adminPin.markPinForResetBySuperAdmin(user, body.targetAccountId, ipAddress);
      return res.ok ? jsonResponse(res) : errorResponse("FORBIDDEN", res.error, res.status);
    }
    if (path === "/api/v1/admin/policies/draft" && method === "POST") {
      const res = await services.legal.createPolicyDraft(user, body);
      return res.ok ? jsonResponse(res, 201) : errorResponse("POLICY_DRAFT_ERROR", res.error, res.status);
    }
    if (path === "/api/v1/admin/policies/transition" && method === "POST") {
      const res = await services.legal.transitionPolicyVersion(user, body.versionId, body.action);
      return res.ok ? jsonResponse(res) : errorResponse("POLICY_TRANSITION_ERROR", res.error, res.status);
    }
    if (!services.auth.hasAnyAdminRole(user)) {
      return errorResponse("FORBIDDEN", "Tài khoản của bạn không có vai trò quản trị được cấp phép.", 403);
    }
    if (path === "/api/v1/admin/dashboard" && method === "GET") {
      const metrics = await services.admin.getDashboardMetrics();
      return jsonResponse({ ok: true, metrics, plans: PLANS, intelligenceCount: INTELLIGENCE_SYSTEMS.length });
    }
    if (path === "/api/v1/admin/accounts" && method === "GET") {
      const res = await services.admin.listAccounts(user, {
        q: url.searchParams.get("q") || "",
        status: url.searchParams.get("status") || "",
        verified: url.searchParams.get("verified") || "",
        limit: url.searchParams.get("limit") || 50,
        offset: url.searchParams.get("offset") || 0
      });
      if (!res.ok) return errorResponse("RBAC_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/accounts/status" && (method === "POST" || method === "PATCH")) {
      const res = await services.admin.updateAccountStatus(user, body.accountId, body.action, body.reason || "", ipAddress);
      if (!res.ok) return errorResponse("ACCOUNT_ADMIN_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/staff" && method === "GET") {
      const res = await services.admin.listStaffAndRoles(user);
      if (!res.ok) return errorResponse("RBAC_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/roles/assign" && method === "POST") {
      const res = await services.admin.assignRole(user, body.accountId, body.roleCode, ipAddress);
      if (!res.ok) return errorResponse("RBAC_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/roles/revoke" && method === "POST") {
      const res = await services.admin.revokeRole(user, body.accountId, body.roleCode, ipAddress);
      if (!res.ok) return errorResponse("RBAC_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/academic" && method === "GET") {
      const res = await services.admin.getAcademicOverview(user);
      if (!res.ok) return errorResponse("ACADEMIC_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/reader/documents" && method === "POST") {
      if (!services.auth.hasPermission(user, "reader:manage") && !services.auth.hasPermission(user, "curriculum:create")) {
        return errorResponse("FORBIDDEN", "Thiếu quyền reader:manage hoặc curriculum:create.", 403);
      }
      try {
        const res = await services.reader.createDocument(user, body);
        if (!res.ok) return errorResponse("READER_CREATE_ERROR", res.error, res.status);
        await services.auth.recordAudit(user.accountId, "reader.document_created", "wb_reader_documents", res.documentId, ipAddress, { slug: res.slug });
        return jsonResponse(res, 201);
      } catch (err) {
        return errorResponse("READER_CREATE_ERROR", err.message, 400);
      }
    }
    if (path === "/api/v1/admin/data/status" && method === "GET") {
      const res = await services.admin.getDataAndStorageStatus(user);
      if (!res.ok) return errorResponse("DATA_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/data/snapshot" && method === "POST") {
      const res = await services.admin.runIntegrityCheckOrBackup(user, body.snapshotType || "integrity_check", ipAddress);
      if (!res.ok) return errorResponse("DATA_SNAPSHOT_ERROR", res.error, res.status);
      return jsonResponse(res, 201);
    }
    if (path === "/api/v1/admin/security" && method === "GET") {
      const res = await services.admin.getSecurityOverview(user);
      if (!res.ok) return errorResponse("SECURITY_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/security/revoke-session" && method === "POST") {
      const res = await services.admin.revokeSessionByAdmin(user, body.sessionId, ipAddress);
      if (!res.ok) return errorResponse("SECURITY_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/security/revoke-admin-session" && method === "POST") {
      const res = await services.adminPin.revokeAdminSessionById(user, body.adminSessionId, ipAddress);
      if (!res.ok) return errorResponse("SECURITY_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/email/preview" && method === "GET") {
      const key = String(url.searchParams.get("key") || "welcome_registered");
      const cfg = await services.email.loadEmailRuntimeConfig();
      const ov = await apiDb.prepare("SELECT custom_subject, custom_title, custom_body FROM wb_email_templates WHERE template_key = ?").bind(key).first().catch(() => null);
      const rendered = renderEmailTemplate(EMAIL_TEMPLATE_MAP.has(key) ? key : "welcome_registered", {
        fullName: user.fullName || "Học viên WORD BRIDGE",
        email: user.email,
        ctaUrl: "https://wordbridge.io.vn/my-learning",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ticketId: "WB-2026-001",
        subject: "Yêu cầu hỗ trợ mẫu",
        schoolEmail: "sinhvien@university.edu.vn",
        dueCount: 12,
        goalMinutes: 20
      }, {
        senderAddress: cfg.senderAddress,
        replyTo: cfg.replyTo,
        customSubject: ov?.custom_subject || "",
        customTitle: ov?.custom_title || "",
        customBody: ov?.custom_body || ""
      });
      return new Response(rendered.html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN"
        }
      });
    }
    if (path === "/api/v1/admin/email/templates" && method === "POST") {
      const key = String(body.templateKey || "").trim();
      if (!EMAIL_TEMPLATE_MAP.has(key)) return errorResponse("NOT_FOUND", "Mẫu email không tồn tại.", 404);
      const customSubject = String(body.customSubject || "").trim().slice(0, 220);
      const customTitle = String(body.customTitle || "").trim().slice(0, 220);
      const customBody = String(body.customBody || "").trim().slice(0, 2000);
      await apiDb.prepare(
        `INSERT INTO wb_email_templates (template_key, custom_subject, custom_title, custom_body, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(template_key) DO UPDATE SET custom_subject=excluded.custom_subject, custom_title=excluded.custom_title, custom_body=excluded.custom_body, updated_by=excluded.updated_by, updated_at=datetime('now')`
      ).bind(key, customSubject, customTitle, customBody, user.accountId).run();
      await services.auth.recordAudit(user.accountId, "admin.email_template_updated", "wb_email_templates", key, ipAddress, {});
      return jsonResponse({ ok: true, message: "Đã lưu giao diện và nội dung mẫu email HTML." });
    }
    if (path === "/api/v1/admin/email/automations" && method === "POST") {
      const eventKey = String(body.eventKey || "").trim();
      if (!EMAIL_TEMPLATE_MAP.has(eventKey)) return errorResponse("NOT_FOUND", "Sự kiện email không tồn tại.", 404);
      const enabled = String(body.enabled) === "1" || body.enabled === true ? 1 : 0;
      await apiDb.prepare(
        `INSERT INTO wb_email_automations (event_key, enabled, updated_by, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(event_key) DO UPDATE SET enabled=excluded.enabled, updated_by=excluded.updated_by, updated_at=datetime('now')`
      ).bind(eventKey, enabled, user.accountId).run();
      await services.auth.recordAudit(user.accountId, "admin.email_automation_toggled", "wb_email_automations", eventKey, ipAddress, { enabled });
      return jsonResponse({ ok: true, message: enabled ? "Đã bật sự kiện gửi email tự động." : "Đã tắt sự kiện gửi email tự động." });
    }
    if (path === "/api/v1/admin/email/config" && method === "POST") {
      const senderAddress = String(body.senderAddress || "noreply@wordbridge.io.vn").trim().toLowerCase();
      const replyTo = String(body.replyTo || "support@wordbridge.io.vn").trim().toLowerCase();
      if (!validateEmail(senderAddress) || !validateEmail(replyTo)) {
        return errorResponse("VALIDATION_ERROR", "Địa chỉ email gửi hoặc email phản hồi không hợp lệ.", 400);
      }
      const pairs = [
        ["email.sender_address", senderAddress, "Địa chỉ gửi email chính thức"],
        ["email.reply_to", replyTo, "Địa chỉ email phản hồi"],
        ["email.provider", String(body.provider || "unconfigured").trim(), "Nhà cung cấp gửi email"],
        ["email.smtp_host", String(body.smtpHost || "smtp.wordbridge.io.vn").trim(), "Máy chủ SMTP"],
        ["email.smtp_port", String(body.smtpPort || "587").trim(), "Cổng SMTP"],
        ["email.smtp_tls", String(body.smtpTls || "STARTTLS").trim(), "Chuẩn mã hóa SMTP"],
        ["email.domain_verified", String(body.domainVerified || "pending_dns").trim(), "Trạng thái xác thực DNS"]
      ];
      for (const [k, v, desc] of pairs) {
        await apiDb.prepare(
          `INSERT INTO wb_platform_config (config_key, config_value, description_vi, updated_by, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value, updated_by=excluded.updated_by, updated_at=datetime('now')`
        ).bind(k, v, desc, user.accountId).run();
      }
      await services.auth.recordAudit(user.accountId, "admin.email_config_updated", "wb_platform_config", "email", ipAddress, { senderAddress });
      return jsonResponse({ ok: true, message: "Đã lưu cấu hình SMTP & địa chỉ gửi thư." });
    }
    if (path === "/api/v1/admin/email/test" && method === "POST") {
      const recipientEmail = String(body.recipientEmail || user.email || "").trim().toLowerCase();
      const templateKey = String(body.templateKey || "welcome_registered").trim();
      if (!validateEmail(recipientEmail)) return errorResponse("VALIDATION_ERROR", "Email người nhận không hợp lệ.", 400);
      const res = await services.email.sendEventEmail({
        eventType: "AdminTestEmail",
        templateKey: EMAIL_TEMPLATE_MAP.has(templateKey) ? templateKey : "welcome_registered",
        recipientEmail,
        accountId: user.accountId,
        idempotencyKey: `admin_test:${user.accountId}:${Date.now()}`,
        variables: { fullName: user.fullName || "Quản trị viên", email: recipientEmail, ctaUrl: "https://wordbridge.io.vn/" },
        forceSend: true
      });
      return jsonResponse({ ok: true, result: res, message: `Đã xử lý gửi thử email (${res.status}).` });
    }
    if (path === "/api/v1/admin/email/retry" && method === "POST") {
      if (!body.eventId) return errorResponse("VALIDATION_ERROR", "Thiếu eventId.", 400);
      const res = await services.email.retryQueuedEvent(body.eventId);
      return jsonResponse({ ok: true, ...res, message: `Đã thử gửi lại email (${res.status || "hoàn tất"}).` });
    }
    if (path === "/api/v1/admin/operations" && method === "GET") {
      const res = await services.admin.getOperationsOverview(user);
      if (!res.ok) return errorResponse("OPERATIONS_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/config" && (method === "POST" || method === "PATCH")) {
      const res = await services.admin.updatePlatformConfig(user, body.configKey, body.configValue, ipAddress);
      if (!res.ok) return errorResponse("CONFIG_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/notifications" && method === "POST") {
      const res = await services.admin.createNotification(user, body, ipAddress);
      if (!res.ok) return errorResponse("NOTIFICATION_ERROR", res.error, res.status);
      return jsonResponse(res, 201);
    }
    if (path === "/api/v1/admin/support/reply" && method === "POST") {
      const res = await services.admin.replySupportTicket(user, body.ticketId, body, ipAddress);
      if (!res.ok) return errorResponse("SUPPORT_REPLY_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/jobs/action" && method === "POST") {
      const res = await services.admin.toggleBackgroundJob(user, body.jobName, body.action, ipAddress);
      if (!res.ok) return errorResponse("JOB_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/content/status" && method === "PATCH") {
      const res = await services.admin.updateContentStatus(user, body.tableName, body.itemId, body.newStatus, ipAddress);
      if (!res.ok) return errorResponse("CMS_STATUS_ERROR", res.error, res.status);
      return jsonResponse(res);
    }
    if (path === "/api/v1/admin/programs" && method === "POST") {
      if (!services.auth.hasPermission(user, "curriculum:create")) {
        return errorResponse("FORBIDDEN", "Thiếu quyền curriculum:create.", 403);
      }
      try {
        const lang = body.programType === "specialized" ? assertSpecializedLanguage(body.languageCode) : assertOfficialLanguage(body.languageCode);
        const id = generateId("prg");
        await apiDb.prepare(`
            INSERT INTO wb_programs (id, code, slug, name_vi, language_code, program_type, entry_level, target_level, target_audience, prerequisites, total_modules, total_weeks, sessions_per_week, estimated_hours, overall_objectives, learning_outcomes, assessment_methods, completion_criteria, review_status, author_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
          `).bind(
          id,
          String(body.code || id).toUpperCase(),
          String(body.slug || id).toLowerCase(),
          String(body.nameVi || "").trim(),
          lang,
          body.programType || "general",
          body.entryLevel || "Cơ bản",
          body.targetLevel || "Trung cấp",
          body.targetAudience || "Người học WORD BRIDGE",
          body.prerequisites || "Không yêu cầu",
          Number(body.totalModules || 1),
          Number(body.totalWeeks || 12),
          Number(body.sessionsPerWeek || 3),
          Number(body.estimatedHours || 36),
          body.overallObjectives || "Mục tiêu học thuật",
          body.learningOutcomes || "Chuẩn đầu ra học thuật",
          body.assessmentMethods || "Kiểm tra tuần",
          body.completionCriteria || "Đạt >= 70%",
          user.fullName
        ).run();
        await services.auth.recordAudit(user.accountId, "cms.program_created", "wb_programs", id, ipAddress, { lang });
        return jsonResponse({ ok: true, programId: id, reviewStatus: "draft" }, 201);
      } catch (err) {
        return errorResponse("CMS_CREATE_ERROR", err.message, 400);
      }
    }
    if (path === "/api/v1/admin/intelligence/status" && method === "PATCH") {
      if (!services.auth.hasPermission(user, "operations:manage") && !services.auth.hasPermission(user, "infrastructure:manage")) {
        return errorResponse("FORBIDDEN", "Thiếu quyền cập nhật trạng thái Intelligence Systems.", 403);
      }
      const allowed = /* @__PURE__ */ new Set(["active", "unconfigured", "paused", "error", "not_implemented"]);
      if (!allowed.has(body.operationalStatus)) {
        return errorResponse("VALIDATION_ERROR", "Trạng thái vận hành không hợp lệ.", 400);
      }
      await apiDb.prepare("UPDATE wb_intelligence_status SET operational_status = ?, admin_note_vi = COALESCE(?, admin_note_vi), updated_by = ?, updated_at = datetime('now') WHERE system_slug = ?").bind(body.operationalStatus, body.adminNoteVi ?? null, user.accountId, body.systemSlug).run();
      await services.auth.recordAudit(user.accountId, "intelligence.status_updated", "wb_intelligence_status", body.systemSlug, ipAddress, { operationalStatus: body.operationalStatus });
      return jsonResponse({ ok: true, systemSlug: body.systemSlug, operationalStatus: body.operationalStatus });
    }
  }
  return errorResponse("NOT_FOUND", `API endpoint không tồn tại: ${method} ${path}`, 404);
}
__name(handleApiRequest, "handleApiRequest");

// src/services/quantri-client.js
function renderMaintenancePage(site) {
  const message = site?.maintenance_message || "WORD BRIDGE đang bảo trì. Vui lòng quay lại sau ít phút.";
  return htmlResponse(renderPublicPage({ title: "Bảo trì hệ thống", contentHtml: `
    <section class="wb-error-state"><strong>503</strong><h1>Đang bảo trì hệ thống</h1>
    <p>${escapeHtml(message)}</p><a class="wb-btn wb-btn-outline" href="/help">Trợ giúp</a></section>` }), 503, { "Retry-After": "300" });
}
__name(renderMaintenancePage, "renderMaintenancePage");

// src/pages/features-page.js
var FALSE_FRIENDS_SAMPLES = [
  { term: "Demurrage (EN · Logistics)", common: "Thường bị nhầm là hư hỏng hàng hóa (Damage)", specialized: "Phí lưu bãi container quá thời hạn miễn phí tại cảng." },
  { term: "Execution (EN · Hợp đồng)", common: "Nghĩa phổ thông: thi hành / xử lý", specialized: "Ký kết chính thức và đưa hợp đồng vào hiệu lực pháp lý." },
  { term: "信用证 xìnyòngzhèng (ZH · Xuất nhập khẩu)", common: 'Dễ hiểu nhầm là "giấy chứng nhận uy tín"', specialized: "Thư tín dụng ngân hàng (Letter of Credit — L/C)." },
  { term: "公差 gōngchā (ZH · Cơ khí)", common: "Nghĩa phổ thông: đi công tác", specialized: "Dung sai kỹ thuật (Tolerance) trên bản vẽ cơ khí." }
];
var CORE_CAPABILITIES = [
  ["Lộ trình học chuyên ngành 36 tuần", "Theo dõi tiến độ từng học phần, đánh dấu hoàn thành bài học và lưu ghi chú cá nhân.", "/learning"],
  ["Từ điển & Bẫy nghĩa Chuyên ngành", "Tra cứu Pinyin, IPA, đối chiếu thuật ngữ 10 lĩnh vực và lưu vào sổ từ cá nhân.", "/dictionary"],
  ["Flashcard tương tác & Ôn tập ngắt quãng", "Lật thẻ ghi nhớ hai mặt, phân loại bộ từ vựng và tự động lên lịch ôn ngắt quãng.", "/vocabulary/flashcards"],
  ["Âm thanh & Tự luyện phát âm", "Điều chỉnh tốc độ 0.75x–1.5x, nghe từng câu và tự thu âm giọng đọc đối chiếu.", "/practice/speaking"],
  ["Cổng Luyện Tập 6 kỹ năng", "Bài tập Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp có chấm đáp án & bộ đếm từ.", "/practice"],
  ["Learner Meet trực tuyến", "Phòng thực hành hội thoại âm thanh và hình ảnh tập trung, không gây xao nhãng.", "/learner-meet"],
  ["15 Công cụ Phân tích Ngôn ngữ", "Phân tích cấu trúc câu, sắc thái, văn phong học thuật và lưu lịch sử tra cứu.", "/intelligence"],
  ["Thư viện Đọc tài liệu trực tuyến", "Đọc giáo trình, hội thoại mẫu và tài liệu chuyên ngành kèm ghi chú từ vựng trực tiếp tại /reader.", "/reader"]
];
function renderFeaturesPage({ user, runtime }) {
  const html = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">CÔNG CỤ HỌC TẬP CHUYÊN NGÀNH</span>
      <h1>Hệ Sinh Thái Học Ngoại Ngữ Chuyên Ngành Toàn Diện</h1>
      <p>Kết hợp phương pháp ghi nhớ khoa học với chiều sâu thuật ngữ nghề nghiệp Trung – Anh (10 nhóm ngành).</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="/specialized" class="wb-btn wb-btn-accent">Khám phá 10 Chuyên ngành</a>
        <a href="/practice" class="wb-btn wb-btn-ghost">Vào Cổng Luyện Tập</a>
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Cảnh báo "Bẫy nghĩa Chuyên ngành" (False Friends)</h2>
      <div class="wb-grid-2">
        ${FALSE_FRIENDS_SAMPLES.map((f) => `
          <article class="wb-card" style="margin:0;border-left:4px solid var(--wb-red);">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">${escapeHtml(f.term)}</h3>
            <p class="wb-muted" style="margin:0 0 6px;"><strong>Dễ nhầm (đời thường):</strong> ${escapeHtml(f.common)}</p>
            <p style="margin:0;"><strong>Nghĩa chuyên ngành chuẩn:</strong> ${escapeHtml(f.specialized)}</p>
          </article>`).join("")}
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Các phân hệ học tập & thực hành</h2>
      <div class="wb-grid-2">
        ${CORE_CAPABILITIES.map(([title, desc, href]) => `
          <article class="wb-card" style="margin:0;">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">${escapeHtml(title)}</h3>
            <p class="wb-muted" style="margin:0 0 12px;">${escapeHtml(desc)}</p>
            <a href="${escapeHtml(href)}" class="wb-btn wb-btn-outline wb-btn-sm">Truy cập</a>
          </article>`).join("")}
      </div>
    </section>
  `;
  return htmlResponse(renderPublicPage({
    title: "Công cụ Học tập Chuyên ngành",
    currentPath: "/features",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Công cụ học tập" }],
    user,
    runtime,
    contentHtml: html
  }));
}
__name(renderFeaturesPage, "renderFeaturesPage");

// src/pages/public-pages.js
var SPECIALIZED_VOCAB_DOMAINS = SPECIALIZED_VOCAB_DATASETS;
async function renderHomePage({ db, user, runtime = null }) {
  let courses = [];
  try {
    courses = (await db.prepare(`SELECT language_code,title_vi,slug,summary_vi FROM
    (SELECT *,row_number() OVER (PARTITION BY language_code ORDER BY slug) AS position FROM wb_public_courses)
    WHERE position=1 ORDER BY language_code DESC`).all()).results || [];
  } catch {
    try {
      courses = (await db.prepare(`SELECT language_code,title_vi,slug,summary_vi FROM
      (SELECT *,row_number() OVER (PARTITION BY language_code ORDER BY slug) AS position FROM wb_courses WHERE language_code IN ('zh','en') AND review_status='published')
      WHERE position=1 ORDER BY language_code DESC`).all()).results || [];
    } catch {
      courses = [];
    }
  }
  const s = runtime?.settings || {};
  const heroBadge = s.hero_badge || "Nền tảng học ngôn ngữ Trung – Anh";
  const heroTitle = s.hero_title || "WORD BRIDGE";
  const heroTagline = s.brand_tagline || "Where Languages Bring People Together.";
  const heroSubtitle = s.hero_subtitle || "Nền tảng học tập, tra cứu từ điển, luyện tập ngôn ngữ chuyên ngành, thư viện đọc và kết nối người học thống nhất trên một tên miền duy nhất wordbridge.io.vn.";
  const contentHtml = `
    <section class="wb-home-hero-stage" aria-label="Giới thiệu WORD BRIDGE">
      <div class="wb-home-hero-banner">
        <img class="wb-home-hero-bg" src="/branding/hero-home.jpg" alt="WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh" />
        <div class="wb-home-hero-scrim" aria-hidden="true"></div>
        <div class="wb-home-hero-content">
          <div class="wb-home-hero-pill">${escapeHtml(heroBadge)}</div>
          <h1 class="wb-home-hero-title">
            <span class="wb-title-word">WORD</span>
            <span class="wb-title-bridge">BRIDGE<svg class="wb-bridge-swoosh" viewBox="0 0 260 22" fill="none" aria-hidden="true"><path d="M4 16C74 4 176 2 254 11" stroke="#E63225" stroke-width="5" stroke-linecap="round"/><path d="M160 15C198 11 232 10 256 12" stroke="#FF6B5B" stroke-width="2.2" stroke-linecap="round"/></svg></span>
          </h1>
          <p class="wb-home-hero-tagline">${escapeHtml(heroTagline)}</p>
          <p class="wb-home-hero-desc">Nền tảng học tập, tra cứu từ điển, luyện tập ngôn ngữ chuyên ngành, thư viện đọc và kết nối người học thống nhất trên một tên miền duy nhất <strong>wordbridge.io.vn.</strong></p>
          <div class="wb-home-hero-ctas">
            <a href="/learning" class="wb-btn wb-home-cta-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              <span>Khám phá Học tập</span>
            </a>
            <a href="/reader" class="wb-btn wb-home-cta-glass">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span>Mở Thư Viện Đọc</span>
            </a>
            ${user
              ? '<a href="/my-learning" class="wb-btn wb-home-cta-red"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg><span>Vào lộ trình của tôi</span></a>'
              : '<a href="/register" class="wb-btn wb-home-cta-red"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg><span>Đăng ký tài khoản miễn phí</span></a>'}
          </div>
        </div>
      </div>

      <div class="wb-lang-cards-v2" aria-label="Hai hệ thống ngôn ngữ">
        <a href="/learning/chinese" class="wb-lang-card-v2 wb-lang-card-zh">
          <img class="wb-lang-card-bg" src="/branding/card-zh.jpg" alt="Tiếng Trung (中文)" />
          <div class="wb-lang-card-overlay"></div>
          <div class="wb-lang-card-content">
            <span class="wb-lang-pill wb-lang-pill-zh">ZH</span>
            <h3>Tiếng Trung<br /><span>(中文)</span></h3>
            <p class="wb-lang-sub">Học &nbsp;·&nbsp; Giao tiếp &nbsp;·&nbsp; Ứng dụng</p>
            <span class="wb-lang-btn">Xem chương trình <span aria-hidden="true">→</span></span>
          </div>
        </a>
        <a href="/learning/english" class="wb-lang-card-v2 wb-lang-card-en">
          <img class="wb-lang-card-bg" src="/branding/card-en.jpg" alt="Tiếng Anh (English)" />
          <div class="wb-lang-card-overlay"></div>
          <div class="wb-lang-card-content">
            <span class="wb-lang-pill wb-lang-pill-en">EN</span>
            <h3>Tiếng Anh<br /><span>(English)</span></h3>
            <p class="wb-lang-sub">Học &nbsp;·&nbsp; Giao tiếp &nbsp;·&nbsp; Ứng dụng</p>
            <span class="wb-lang-btn">Xem chương trình <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </div>
    </section>

    ${courses.length ? `<section><h2>Khóa học nổi bật</h2><div class="wb-grid-2">${courses.map((course) => `<article class="wb-card"><span class="wb-badge">${course.language_code === "zh" ? "Tiếng Trung" : "Tiếng Anh"}</span><h3><a href="/courses/${encodeURIComponent(course.slug)}">${escapeHtml(course.title_vi)}</a></h3><p>${escapeHtml(course.summary_vi)}</p></article>`).join("")}</div></section>` : ""}
    <section class="wb-value-strip" aria-label="Điểm nổi bật WORD BRIDGE">
      <div class="wb-value-item">
        <span class="wb-value-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
        <div><strong>2 Ngôn ngữ trọng tâm</strong><span>Trung · Anh</span></div>
      </div>
      <div class="wb-value-item">
        <span class="wb-value-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></span>
        <div><strong>Học tập đa dạng</strong><span>Từ điển · Luyện tập · Đọc hiểu</span></div>
      </div>
      <div class="wb-value-item">
        <span class="wb-value-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <div><strong>Cộng đồng học tập</strong><span>Kết nối · Giao lưu · Chia sẻ</span></div>
      </div>
      <div class="wb-value-item">
        <span class="wb-value-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
        <div><strong>An toàn & Tôn trọng</strong><span>Môi trường học tập lành mạnh</span></div>
      </div>
      <div class="wb-value-item">
        <span class="wb-value-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg></span>
        <div><strong>Miễn phí cơ bản</strong><span>Tiếp cận dễ dàng, linh hoạt</span></div>
      </div>
    </section>

    <section class="wb-spec-home-section">
      <div class="wb-spec-home-head">
        <div>
          <h2 class="wb-section-title-accent">Ngoại ngữ Chuyên ngành Ứng dụng</h2>
          <p class="wb-muted" style="margin:6px 0 0;">Hệ thống thuật ngữ, mẫu câu thực chiến và tình huống nghề nghiệp cho Tiếng Trung và Tiếng Anh.</p>
        </div>
        <a href="/specialized" class="wb-btn wb-btn-outline wb-btn-pill">Khám phá chuyên ngành →</a>
      </div>
      <div class="wb-spec-home-grid">
        ${SPECIALIZED_VOCAB_DOMAINS.map((d) => `
          <a href="/specialized/${escapeHtml(d.slug)}" class="wb-spec-home-card">
            <strong>${escapeHtml(d.nameVi)}</strong>
            <span class="wb-red-bar" aria-hidden="true"></span>
            <span class="wb-spec-home-meta">${d.count.toLocaleString("vi-VN")} thuật ngữ · Mẫu câu · Tình huống</span>
          </a>`).join("")}
      </div>
    </section>

    <section class="wb-grid-4 wb-feature-cards-row">
      <article class="wb-feature-card"><h3>Từ điển & Flashcards</h3><span class="wb-red-bar" aria-hidden="true"></span><p class="wb-muted">Tra cứu đa ngữ, lưu sổ từ vựng cá nhân và ôn tập ghi nhớ ngắt quãng khoa học.</p><a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm wb-btn-pill">Mở Từ điển →</a></article>
      <article class="wb-feature-card"><h3>Cổng Luyện Tập</h3><span class="wb-red-bar" aria-hidden="true"></span><p class="wb-muted">Thực hành Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp chuyên sâu.</p><a href="/practice" class="wb-btn wb-btn-outline wb-btn-sm wb-btn-pill">Vào Luyện Tập →</a></article>
      <article class="wb-feature-card"><h3>Thư Viện Đọc</h3><span class="wb-red-bar" aria-hidden="true"></span><p class="wb-muted">Đọc giáo trình và tài liệu chuyên ngành trực tiếp kèm chú giải thuật ngữ.</p><a href="/reader" class="wb-btn wb-btn-outline wb-btn-sm wb-btn-pill">Mở Thư Viện →</a></article>
      <article class="wb-feature-card"><h3>Trí tuệ Ngôn ngữ</h3><span class="wb-red-bar" aria-hidden="true"></span><p class="wb-muted">Phân tích Language DNA, độ hiểu bài và tiến độ học tập từ dữ liệu thực tế.</p><a href="/intelligence" class="wb-btn wb-btn-outline wb-btn-sm wb-btn-pill">Khám phá phân tích →</a></article>
    </section>
  `;
  return htmlResponse(renderPublicPage({
    title: "Trang chủ",
    currentPath: "/",
    user,
    runtime,
    contentHtml
  }));
}
__name(renderHomePage, "renderHomePage");
function renderAboutPage({ user, runtime = null }) {
  return htmlResponse(renderPublicPage({
    title: "Giới thiệu WORD BRIDGE",
    currentPath: "/about",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Giới thiệu" }],
    user,
    runtime,
    contentHtml: `
      <section class="wb-specialized-hero" style="margin-bottom:24px;">
        <div class="wb-specialized-hero-copy">
          <span class="wb-eyebrow">Giới thiệu nền tảng</span>
          <h1 style="margin-bottom:8px;">WORD BRIDGE</h1>
          <p style="font-size:1.08rem;font-style:italic;color:#c7ecec;margin-bottom:10px;">Where Languages Bring People Together.</p>
          <p style="font-size:1.15rem;font-weight:700;color:#ffffff;margin:0;">Học ngôn ngữ. Mở rộng tri thức. Ứng dụng vào thực tế.</p>
        </div>
        <aside class="wb-specialized-scope">
          <span class="wb-badge wb-badge-aqua">Địa chỉ chính thức</span>
          <strong>wordbridge.io.vn</strong>
          <p>Tiếng Trung &amp; Tiếng Anh trong cùng một hệ thống học tập thống nhất.</p>
        </aside>
      </section>

      <article class="wb-card" style="padding:28px 30px;line-height:1.78;">
        <p style="margin-top:0;font-size:1.02rem;"><strong>WORD BRIDGE</strong> là nền tảng học tập và thực hành ngoại ngữ, tập trung vào tiếng Trung và tiếng Anh. Nền tảng được xây dựng để người học không chỉ tiếp cận kiến thức ngôn ngữ mà còn có thể tra cứu thuật ngữ, đọc tài liệu, tìm hiểu kiến thức chuyên ngành và rèn luyện khả năng sử dụng ngoại ngữ trong những bối cảnh cụ thể.</p>
        <p style="font-size:1.02rem;">Tại WORD BRIDGE, các hoạt động học tập được kết nối trong cùng một hệ thống: từ chương trình học theo cấp độ, từ điển và dữ liệu thuật ngữ song ngữ, đến thư viện đọc học thuật và những công cụ hỗ trợ đánh giá, củng cố năng lực ngôn ngữ. Qua đó, người học có thêm cơ sở để chủ động lựa chọn nội dung, xác định kiến thức cần cải thiện và từng bước đưa ngoại ngữ vào học tập cũng như công việc.</p>

        <hr style="border:none;border-top:1px solid var(--wb-border);margin:24px 0;" />

        <h2 style="margin:0 0 12px;color:var(--wb-teal);font-size:1.35rem;">Tất cả trong một không gian học tập</h2>
        <p style="font-size:1.02rem;">WORD BRIDGE vận hành tại địa chỉ chính thức <a href="https://wordbridge.io.vn" style="font-weight:700;color:var(--wb-teal);">wordbridge.io.vn</a>. Với một tài khoản thành viên, người dùng có thể truy cập các chức năng được cung cấp trên nền tảng và quản lý thông tin học tập trong cùng một hệ thống.</p>
        <p style="font-size:1.02rem;">Dù bắt đầu từ việc học một chủ điểm, tra cứu một thuật ngữ hay đọc một tài liệu chuyên ngành, người dùng đều có thể tiếp tục hành trình học tập ngay trên WORD BRIDGE mà không cần chuyển đổi giữa nhiều website riêng lẻ.</p>

        <blockquote style="margin:24px 0 4px;padding:16px 20px;border-left:4px solid var(--wb-teal);background:var(--wb-teal-soft);border-radius:0 12px 12px 0;color:var(--wb-teal-dark);font-weight:700;font-size:1.05rem;">
          WORD BRIDGE – Không chỉ học một ngôn ngữ, mà còn học cách sử dụng ngôn ngữ để tiếp cận thế giới tri thức.
        </blockquote>
      </article>`
  }));
}
__name(renderAboutPage, "renderAboutPage");
function renderFaqPage({ user, runtime = null }) {
  const faqs = [
    ["WORD BRIDGE hỗ trợ những ngôn ngữ nào?", "Nền tảng tập trung đào tạo Tiếng Trung, Tiếng Anh (nền tảng và chuyên ngành)."],
    ["Quy trình đăng ký tài khoản thành viên như thế nào?", "Tại trang /register, bạn điền đầy đủ thông tin cá nhân bắt buộc và xác minh qua liên kết email một lần (không dùng OTP)."],
    ["Tôi có thể đọc tài liệu và luyện tập kỹ năng ở đâu?", "Bạn có thể truy cập trực tiếp Thư Viện Đọc (/reader), Cổng Luyện Tập (/practice) và Trung Tâm Trợ Giúp (/help) bằng cùng một tài khoản trên wordbridge.io.vn."]
  ];
  return htmlResponse(renderPublicPage({
    title: "Câu hỏi thường gặp",
    currentPath: "/faq",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Câu hỏi thường gặp" }],
    user,
    runtime,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Câu hỏi thường gặp</h1>
      <div class="wb-grid-2">${faqs.map(([q, a]) => `<article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(q)}</h3><p style="margin-bottom:0;">${escapeHtml(a)}</p></article>`).join("")}</div>
      <div style="margin-top:16px;"><a href="/help" class="wb-btn wb-btn-primary">Mở Trung Tâm Trợ Giúp</a></div>`
  }));
}
__name(renderFaqPage, "renderFaqPage");
function renderContactPage({ user, runtime = null, env = {} }) {
  return htmlResponse(renderPublicPage({
    title: "Liên hệ WORD BRIDGE",
    currentPath: "/contact",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Liên hệ" }],
    user,
    runtime,
    contentHtml: renderContactPageV42({ user, runtime, env, signInUrl, escapeHtml })
  }));
}
__name(renderContactPage, "renderContactPage");
async function renderPolicyPage({ services, user, policySlug, runtime = null }) {
  const slug = policySlug === "platform-usage" ? "community" : policySlug;
  const meta = services?.legal ? await services.legal.getPolicyMetadata(slug) : { doc: null, latestPublished: null };
  const rendered = renderFullPolicyHtml({ policySlug: slug, docMeta: meta.doc, latestPublished: meta.latestPublished, escapeHtml });
  if (!rendered) {
    return htmlResponse(renderPublicPage({
      title: "Không tìm thấy trang chính sách",
      currentPath: `/policies/${policySlug}`,
      user,
      runtime,
      contentHtml: `<section class="wb-error-state"><strong>404</strong><h1>Không tìm thấy trang chính sách</h1><p>Đường dẫn chính sách không tồn tại.</p><a class="wb-btn wb-btn-primary" href="/policies/terms">Điều khoản sử dụng</a> <a class="wb-btn wb-btn-outline" href="/policies/privacy">Chính sách quyền riêng tư</a></section>`
    }), 404);
  }
  return htmlResponse(renderPublicPage({
    title: rendered.title,
    currentPath: `/policies/${slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: rendered.title }],
    user,
    runtime,
    contentHtml: rendered.html
  }));
}
__name(renderPolicyPage, "renderPolicyPage");

// src/pages/help-pages.js
var HELP_GUIDES = [
  {
    id: "getting-started",
    title: "1. Hướng dẫn sử dụng WORD BRIDGE",
    summary: "Toàn bộ nền tảng vận hành trên một tên miền duy nhất wordbridge.io.vn cho 2 ngôn ngữ: Tiếng Trung, Tiếng Anh.",
    steps: [
      "Đăng ký tài khoản cá nhân tại /register và xác minh email qua liên kết một lần.",
      "Chọn ngôn ngữ học tập tại /learning (Tiếng Trung, Tiếng Anh) và xem lộ trình tại /learning/path.",
      "Lưu từ vựng mới vào Sổ từ vựng (/vocabulary/notebook) và ôn tập ngắt quãng tại /vocabulary/flashcards."
    ]
  },
  {
    id: "account",
    title: "2. Hướng dẫn tài khoản & bảo mật",
    summary: "Quản lý đăng nhập bằng Email/Mật khẩu, đặt lại mật khẩu, hồ sơ cá nhân và khóa bảo mật Passkey.",
    steps: [
      "Đăng nhập tại /login, quên mật khẩu tại /forgot-password và đặt lại mật khẩu tại /reset-password.",
      "Cập nhật thông tin cá nhân, đổi mật khẩu và quản lý phiên đăng nhập tại /profile hoặc /account.",
      "Kiểm tra và thu hồi các phiên đăng nhập cũ tại /account/sessions để bảo vệ tài khoản."
    ]
  },
  {
    id: "learning",
    title: "3. Hướng dẫn học tập & lộ trình",
    summary: "Cấu trúc giáo trình chuẩn hóa theo Tuần học, Buổi học và Bài học có kiểm tra mức độ hiểu bài.",
    steps: [
      "Truy cập /learning để chọn chương trình nền tảng hoặc chuyên ngành (Tiếng Trung & Tiếng Anh).",
      "Ghi chú trực tiếp ngay trong từng bài học và nộp bài kiểm tra kiến thức cuối bài để hệ thống ghi nhận tiến độ thật.",
      "Theo dõi lịch sử học tập và các lỗi cần ôn lại tại /my-learning, /my-knowledge và /my-mistakes."
    ]
  },
  {
    id: "practice",
    title: "4. Hướng dẫn luyện tập 6 kỹ năng",
    summary: "Cổng Luyện Tập (/practice) hỗ trợ Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp.",
    steps: [
      "Chọn kỹ năng muốn luyện tập tại /practice (listening, speaking, reading, writing, vocabulary, grammar).",
      "Nộp bài để hệ thống chấm tự động (trắc nghiệm/điền từ) hoặc lưu rubric đánh giá cho bài tự luận/nói.",
      "Xem biểu đồ tiến bộ và phân tích điểm yếu tại /practice/history."
    ]
  },
  {
    id: "tools",
    title: "5. Hướng dẫn sử dụng công cụ",
    summary: "Từ điển đa ngữ, Ngoại ngữ chuyên ngành (12 bộ dữ liệu), Thư viện đọc (/reader), Learner Meet và 15 hệ thống Trí tuệ Ngôn ngữ.",
    steps: [
      "Tra cứu Từ điển (/dictionary) và 12.104+ thuật ngữ chuyên ngành (/specialized), lưu 1 chạm vào Flashcards.",
      "Đọc tài liệu mẫu và chuyên ngành trực tiếp tại /reader, lưu tiến độ đọc và ghi chú cá nhân.",
      "Tham gia phòng giao tiếp tập trung tại /learner-meet (không chat văn bản, không ghi hình) và phân tích năng lực tại /intelligence."
    ]
  }
];
var HELP_FAQS = [
  ["WORD BRIDGE hỗ trợ những ngôn ngữ nào?", "WORD BRIDGE hỗ trợ chính thức Tiếng Trung, Tiếng Anh (nền tảng & chuyên ngành)."],
  ["Tại sao tôi không thấy nút đăng nhập Google hay Facebook?", "WORD BRIDGE sử dụng hệ thống tài khoản nội bộ tập trung bằng Email/Mật khẩu và Passkey WebAuthn để đảm bảo bảo mật và thống nhất dữ liệu."],
  ["Dữ liệu luyện tập và sổ từ vựng của tôi được lưu ở đâu?", "Toàn bộ tiến độ học tập, bài luyện tập, sổ từ vựng, ghi chú đọc tài liệu và yêu cầu hỗ trợ được lưu trữ an toàn và đồng bộ theo tài khoản WORD BRIDGE của bạn."],
  ["Tôi có thể theo dõi tiến độ xử lý yêu cầu hỗ trợ không?", "Có. Sau khi đăng nhập và gửi yêu cầu hỗ trợ tại trang /help này, bạn có thể theo dõi trạng thái (open / in_progress / resolved / closed) và phản hồi của đội ngũ hỗ trợ ngay bên dưới."]
];
var STATUS_LABELS = {
  open: "Đã tiếp nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng"
};
async function renderHelpCenterPage({ services, user, runtime = null }) {
  const userTickets = user ? await services.admin.listUserSupportTickets(user.accountId) : [];
  const ticketFormHtml = user ? `
      <form class="wb-form" data-api-endpoint="/api/v1/support/tickets" data-reload-on-success="true">
        <input type="hidden" name="requestType" value="support" />
        <div class="wb-grid-2">
          <div class="wb-field"><label>Họ và tên *</label><input class="wb-input" name="senderName" value="${escapeHtml(user.fullName || "")}" required /></div>
          <div class="wb-field"><label>Email liên hệ *</label><input class="wb-input" type="email" name="senderEmail" value="${escapeHtml(user.email || "")}" required /></div>
        </div>
        <div class="wb-field"><label>Tiêu đề yêu cầu *</label><input class="wb-input" name="subject" placeholder="Ví dụ: Hỗ trợ xác minh tài khoản hoặc lỗi phát audio" required /></div>
        <div class="wb-field"><label>Nội dung chi tiết (tối thiểu 10 ký tự) *</label><textarea class="wb-input" name="messageBody" rows="4" required placeholder="Mô tả rõ vấn đề bạn gặp phải..."></textarea></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu hỗ trợ</button>
      </form>` : `
      <div class="wb-alert wb-alert-info">
        Vui lòng <a href="${escapeHtml(signInUrl("/help", "help.ticket"))}">đăng nhập tài khoản WORD BRIDGE</a> để gửi yêu cầu hỗ trợ và theo dõi trạng thái xử lý trực tuyến.
      </div>`;
  const trackingHtml = user ? `
      <section class="wb-card" id="my-tickets">
        <h2 style="margin-top:0;color:var(--wb-teal);">Theo dõi yêu cầu hỗ trợ của bạn (${userTickets.length})</h2>
        ${userTickets.length === 0 ? '<p class="wb-muted">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>' : userTickets.map((t) => `
            <article class="wb-card" style="margin:12px 0;border-left:4px solid var(--wb-teal);">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <strong>#${escapeHtml(t.id)} — ${escapeHtml(t.subject)}</strong>
                <span class="wb-badge">${escapeHtml(STATUS_LABELS[t.status] || t.status)}</span>
              </div>
              <p style="margin:8px 0;">${escapeHtml(t.message_body)}</p>
              <div class="wb-muted" style="font-size:0.82rem;">Gửi lúc: ${escapeHtml(t.created_at)}</div>
              ${t.replies && t.replies.length > 0 ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--wb-border);">
                  <strong>Phản hồi từ đội ngũ hỗ trợ:</strong>
                  ${t.replies.map((r) => `
                    <div style="margin-top:6px;padding:8px 10px;background:var(--wb-surface-alt, #f6f9f9);border-radius:6px;">
                      <div style="font-size:0.82rem;font-weight:700;color:var(--wb-teal);">${escapeHtml(r.author_name)} · ${escapeHtml(r.created_at)}</div>
                      <div>${escapeHtml(r.reply_body)}</div>
                    </div>`).join("")}
                </div>` : ""}
            </article>`).join("")}
      </section>` : "";
  const contentHtml = `
    <section class="wb-hero-teal-banner">
      <div>
        <span class="wb-hero-pill">HƯỚNG DẪN &amp; HỖ TRỢ</span>
        <h1>Trung Tâm Trợ Giúp WORD BRIDGE</h1>
        <svg class="wb-swoosh-red-left" viewBox="0 0 160 12" fill="none"><path d="M4 9C52 2 108 2 156 7" stroke="#C92F1C" stroke-width="4" stroke-linecap="round"/></svg>
        <p>Hướng dẫn sử dụng, giải đáp thắc mắc và hỗ trợ kỹ thuật. Giúp bạn học tập, luyện tập và kết nối cộng đồng ngôn ngữ Trung – Anh trên WORD BRIDGE một cách hiệu quả, an toàn và thuận tiện.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="#guides" class="wb-btn wb-home-cta-white">Xem hướng dẫn ›</a>
          <a href="#support-form" class="wb-btn wb-home-cta-glass">Gửi yêu cầu hỗ trợ</a>
          ${user ? '<a href="#my-tickets" class="wb-btn wb-home-cta-glass">Yêu cầu của tôi</a>' : '<a href="/contact" class="wb-btn wb-home-cta-glass">Liên hệ CSKH</a>'}
        </div>
      </div>
      <div style="text-align:center;" aria-hidden="true">
        <svg viewBox="0 0 200 150" width="180" fill="none"><rect x="36" y="72" width="110" height="28" rx="6" fill="#5AABA9"/><rect x="28" y="100" width="124" height="30" rx="6" fill="#C92F1C"/><rect x="44" y="22" width="54" height="44" rx="10" fill="#fff"/><text x="64" y="53" fill="#146466" font-size="28" font-weight="900">?</text><rect x="112" y="34" width="56" height="36" rx="10" fill="#e6f5f5"/><circle cx="128" cy="52" r="3" fill="#146466"/><circle cx="140" cy="52" r="3" fill="#146466"/><circle cx="152" cy="52" r="3" fill="#146466"/></svg>
      </div>
    </section>

    <section id="guides" style="margin-top:20px;">
      <div id="help-guides" class="wb-section-bar"><h2>Hướng dẫn sử dụng theo phân hệ</h2></div>
      <p class="wb-muted" style="margin:0 0 16px;">Hướng dẫn sử dụng đầy đủ các phân hệ học tập, tài khoản, luyện tập, thư viện đọc và hệ thống tiếp nhận — theo dõi yêu cầu hỗ trợ trực tiếp tại wordbridge.io.vn/help.</p>
      <div class="wb-grid-2">
        ${HELP_GUIDES.map((g) => `
          <article class="wb-card" id="${escapeHtml(g.id)}">
            <h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(g.title)}</h3>
            <p class="wb-muted">${escapeHtml(g.summary)}</p>
            <ol style="padding-left:20px;margin:0;">
              ${g.steps.map((s) => `<li style="margin-bottom:6px;">${escapeHtml(s)}</li>`).join("")}
            </ol>
          </article>`).join("")}
      </div>
    </section>

    <p><a href="/help/errors">Tra cứu mã lỗi</a></p>
    <section id="faq" style="margin-top:20px;">
      <h2 style="color:var(--wb-teal);">Câu hỏi thường gặp (FAQ)</h2>
      <div class="wb-grid-2">
        ${HELP_FAQS.map(([q, a]) => `
          <details class="wb-card"><summary>${escapeHtml(q)}</summary>
            <p style="margin-bottom:0;">${escapeHtml(a)}</p>
          </details>`).join("")}
      </div>
    </section>

    <section class="wb-card" id="support-form" style="margin-top:20px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Gửi yêu cầu hỗ trợ trực tiếp</h2>
      <p class="wb-muted">Bạn có thể theo dõi phản hồi của bộ phận Hỗ trợ WORD BRIDGE trong tài khoản của mình.</p>
      ${ticketFormHtml}
    </section>

    ${trackingHtml}
  `;
  return htmlResponse(renderPublicPage({
    title: "Trung Tâm Trợ Giúp",
    currentPath: "/help",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Trung Tâm Trợ Giúp" }],
    user,
    runtime,
    contentHtml
  }));
}
__name(renderHelpCenterPage, "renderHelpCenterPage");

// src/pages/reader-pages.js
var LANG_LABELS = { zh: "Tiếng Trung", en: "Tiếng Anh" };
var CAT_LABELS = { general: "Tổng quát", specialized: "Chuyên ngành", dialogue: "Hội thoại", guide: "Hướng dẫn", grammar: "Ngữ pháp" };
function safeJson(str, fallback = []) {
  try {
    return safeJsonParse(str || "", {});
  } catch {
    return fallback;
  }
}
__name(safeJson, "safeJson");
var READER_DOMAIN_GROUPS = Object.freeze([
  ["economics_finance", "Kinh tế, kinh doanh và tài chính"],
  ["trade_logistics", "Thương mại, logistics và chuỗi cung ứng"],
  ["marketing_media_design", "Marketing, truyền thông và thiết kế"],
  ["it_data", "Công nghệ thông tin và dữ liệu"],
  ["management_org", "Quản lý và quản trị tổ chức"],
  ["education_society", "Giáo dục, ngôn ngữ và xã hội"],
  ["engineering_manufacturing", "Kỹ thuật và sản xuất"],
  ["science_health", "Khoa học, môi trường và sức khỏe"],
  ["services_social", "Dịch vụ và các lĩnh vực xã hội"]
]);
async function renderReaderLibraryPage({ services, user, url, runtime = null }) {
  const language = url?.searchParams?.get("language") || "";
  const category = url?.searchParams?.get("category") || "";
  const domainGroup = url?.searchParams?.get("domainGroup") || "";
  const q = url?.searchParams?.get("q") || "";
  const page = Math.max(1, Number(url?.searchParams?.get("page") || 1));
  const result = await services.reader.listDocumentsPaginated({ language, category, domainGroup, q, page, limit: 24 }).catch(() => ({
    items: [], total: 0, page: 1, totalPages: 1, stats: { totalAll: 0, zhCount: 0, enCount: 0 }
  }));
  const docs = result.items || [];
  const hasNextPage = result.page < result.totalPages;
  const buildPageHref = (p) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (language) sp.set("language", language);
    if (category) sp.set("category", category);
    if (domainGroup) sp.set("domainGroup", domainGroup);
    sp.set("page", String(p));
    return `/reader?${sp.toString()}`;
  };
  const contentHtml = `
    <section class="wb-hero-teal-banner">
      <div>
        <span class="wb-hero-pill">THƯ VIỆN ĐỌC HỌC THUẬT</span>
        <h1>Thư Viện Đọc Học Thuật WORD BRIDGE</h1>
        <p>Khám phá và tra cứu các tài liệu học thuật chọn lọc, bao gồm báo cáo nghiên cứu, bài viết học thuật, tài liệu chuyên ngành và nhiều nguồn tham khảo đa lĩnh vực bằng hai ngôn ngữ: Tiếng Trung và Tiếng Anh.</p>
        <div class="wb-teal-meta-row">
          <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/></svg> Học thuật</span>
          <span style="opacity:0.45;">|</span>
          <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg> Chuyên ngành</span>
          <span style="opacity:0.45;">|</span>
          <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg> Đa ngôn ngữ</span>
        </div>
      </div>
      <div style="text-align:center;" aria-hidden="true">
        <svg viewBox="0 0 260 150" width="230" fill="none">
          <path d="M120 14 L224 22 L212 124 L108 116 Z" fill="#ffffff" opacity="0.96"/>
          <path d="M134 38 H206 M132 52 H204 M130 66 H198 M128 80 H190 M126 94 H176" stroke="#b9dcd9" stroke-width="4" stroke-linecap="round"/>
          <path d="M22 104 L118 94 L146 108 L50 120 Z" fill="#09484b"/><path d="M50 120 L146 108 L146 122 L50 134 Z" fill="#e9f6f5"/>
          <path d="M26 84 L122 74 L150 88 L54 100 Z" fill="#178784"/><path d="M54 100 L150 88 L150 100 L54 112 Z" fill="#ffffff"/>
          <circle cx="192" cy="90" r="24" fill="#d9f4f2" fill-opacity="0.72" stroke="#0b4d50" stroke-width="5"/>
          <line x1="210" y1="108" x2="228" y2="128" stroke="#0b4d50" stroke-width="7" stroke-linecap="round"/>
        </svg>
      </div>
    </section>

    <form method="GET" action="/reader" class="wb-reader-filter-card">
      <div class="wb-field" style="margin:0;">
        <label for="reader-q">Tìm theo từ khóa</label>
        <input id="reader-q" class="wb-input" name="q" value="${escapeHtml(q)}" placeholder="Nhập từ khóa, chủ đề, tác giả hoặc mã tài liệu..." />
      </div>
      <div class="wb-field" style="margin:0;">
        <label for="reader-lang">Ngôn ngữ</label>
        <select id="reader-lang" class="wb-select" name="language">
          <option value="">Tất cả</option>
          <option value="zh" ${language === "zh" ? "selected" : ""}>Tiếng Trung</option>
          <option value="en" ${language === "en" ? "selected" : ""}>Tiếng Anh</option>
        </select>
      </div>
      <div class="wb-field" style="margin:0;">
        <label for="reader-domain">Nhóm chuyên ngành</label>
        <select id="reader-domain" class="wb-select" name="domainGroup">
          <option value="">Tất cả chuyên ngành</option>
          ${READER_DOMAIN_GROUPS.map(([code, label]) => `<option value="${code}" ${domainGroup === code ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="submit" class="wb-btn wb-btn-primary">Lọc tài liệu</button>
        ${(q || language || category || domainGroup) ? '<a href="/reader" class="wb-btn wb-btn-outline">Xóa lọc</a>' : ""}
      </div>
    </form>

    <div class="wb-grid-2" style="margin-top:18px;">
      ${docs.map((d) => `
        <article class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;margin:0;">
          <div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
              <span class="wb-badge">${escapeHtml(LANG_LABELS[d.language_code] || d.language_code)}</span>
              <span class="wb-badge wb-badge-aqua">${escapeHtml(d.domain_group_vi || CAT_LABELS[d.category] || d.category)}</span>
              <span class="wb-badge">${escapeHtml(d.level_ref)}</span>
            </div>
            <h3 style="margin:6px 0;color:var(--wb-teal);">${escapeHtml(d.title_vi)}</h3>
            <p class="wb-muted" style="font-size:0.9rem;">${escapeHtml(d.summary_vi)}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap;">
            <span class="wb-muted" style="font-size:0.82rem;">${Number(d.estimated_minutes || 10)} phút đọc trực tiếp · ${escapeHtml(d.author_name || "WORD BRIDGE")}</span>
            <a href="/reader/${escapeHtml(d.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Đọc trực tiếp →</a>
          </div>
        </article>`).join("") || '<div class="wb-vocab-empty-panel" style="grid-column:1/-1;"><h3>Không tìm thấy tài liệu phù hợp</h3><p>Hãy thử đổi từ khóa, ngôn ngữ hoặc nhóm chuyên ngành khác.</p><a href="/reader" class="wb-btn wb-btn-outline wb-btn-sm">Đặt lại bộ lọc</a></div>'}
    </div>

    ${(result.page > 1 || hasNextPage) ? `
    <div style="display:flex;justify-content:center;gap:10px;align-items:center;margin-top:20px;flex-wrap:wrap;">
      ${result.page > 1 ? `<a href="${escapeHtml(buildPageHref(result.page - 1))}" class="wb-btn wb-btn-outline wb-btn-sm">← Trang trước</a>` : ""}
      <span class="wb-badge">Trang ${result.page}</span>
      ${hasNextPage ? `<a href="${escapeHtml(buildPageHref(result.page + 1))}" class="wb-btn wb-btn-primary wb-btn-sm">Trang sau →</a>` : ""}
    </div>` : ""}
  `;
  return htmlResponse(renderPublicPage({
    title: "Thư viện đọc — WORD BRIDGE Reader",
    currentPath: "/reader",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Thư viện đọc" }],
    user,
    runtime,
    contentHtml
  }));
}
__name(renderReaderLibraryPage, "renderReaderLibraryPage");
async function renderReaderDocumentPage({ services, user, slug, runtime = null }) {
  const result = await services.reader.getDocumentBySlug(slug, user?.accountId || null);
  if (!result) {
    return htmlResponse(renderPublicPage({
      title: "Không tìm thấy tài liệu",
      currentPath: `/reader/${slug}`,
      breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Thư viện đọc", href: "/reader" }, { label: "Không tìm thấy" }],
      user,
      runtime,
      contentHtml: '<div class="wb-alert wb-alert-error">Tài liệu không tồn tại hoặc chưa được xuất bản.</div><a href="/reader" class="wb-btn wb-btn-outline">Quay lại Thư viện đọc</a>'
    }), 404);
  }
  const { doc, progress } = result;
  const vocabNotes = safeJson(doc.vocabulary_notes_json, []);
  const paragraphs = String(doc.content_text || "").split(/\n{2,}/).filter((p) => p.trim());
  const progressFormHtml = user ? `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/reader/progress">
        <h3 style="margin-top:0;color:var(--wb-teal);">Tiến độ đọc & Ghi chú cá nhân</h3>
        <input type="hidden" name="documentId" value="${escapeHtml(doc.id)}" />
        <div class="wb-grid-2">
          <div class="wb-field">
            <label>Mức hoàn thành (%)</label>
            <input class="wb-input" type="number" name="progressPercent" min="0" max="100" value="${Number(progress?.progress_percent || 0)}" />
          </div>
          <div class="wb-field">
            <label>Đánh dấu (Bookmark)</label>
            <select class="wb-select" name="bookmarked">
              <option value="false" ${!progress?.bookmarked ? "selected" : ""}>Chưa đánh dấu</option>
              <option value="true" ${progress?.bookmarked ? "selected" : ""}>Đã đánh dấu để đọc lại</option>
            </select>
          </div>
        </div>
        <div class="wb-field">
          <label>Ghi chú cá nhân cho tài liệu này</label>
          <textarea class="wb-input" name="personalNotes" rows="3" placeholder="Ghi lại cấu trúc hay hoặc từ vựng cần ôn...">${escapeHtml(progress?.personal_notes || "")}</textarea>
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Lưu tiến độ & ghi chú</button>
      </form>` : `
      <div class="wb-alert wb-alert-info">
        <a href="${escapeHtml(signInUrl(`/reader/${doc.slug}`, "reader.save"))}">Đăng nhập</a> để lưu tiến độ đọc, đánh dấu tài liệu và ghi chú cá nhân vào tài khoản WORD BRIDGE.
      </div>`;
  const refsHtml = Array.isArray(doc.references) && doc.references.length > 0 ? `
      <section class="wb-card">
        <h3 style="margin-top:0;color:var(--wb-teal);">Nguồn tham chiếu khoa học, khảo thí & tiêu chuẩn quốc tế</h3>
        <ul style="margin:0;padding-left:20px;line-height:1.7;">
          ${doc.references.map((r) => `<li><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--wb-teal);font-weight:600;">${escapeHtml(r.name)} ↗</a></li>`).join("")}
        </ul>
      </section>` : "";
  const ttsSample = paragraphs.slice(0, 2).join(" ").slice(0, 600);
  const contentHtml = `
    <article class="wb-card">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
        <span class="wb-badge">${escapeHtml(LANG_LABELS[doc.language_code] || doc.language_code)}</span>
        <span class="wb-badge wb-badge-aqua">${escapeHtml(doc.domain_group_vi || CAT_LABELS[doc.category] || doc.category)}</span>
        <span class="wb-badge">${escapeHtml(doc.level_ref)}</span>
        <span class="wb-badge">${Number(doc.estimated_minutes || 10)} phút đọc trực tiếp tại web</span>
        <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-tts="${escapeHtml(ttsSample)}" data-wb-lang="${doc.language_code === "zh" ? "zh" : "en"}">🔊 Nghe đọc mẫu (${doc.language_code.toUpperCase()})</button>
      </div>
      <h1 style="margin:6px 0;color:var(--wb-teal);">${escapeHtml(doc.title_vi)}</h1>
      ${doc.subtitle_vi ? `<p class="wb-muted" style="margin-top:0;">${escapeHtml(doc.subtitle_vi)}</p>` : ""}
      <div class="wb-reader-body" style="line-height:1.85;font-size:1.04rem;margin-top:16px;">
        ${paragraphs.map((p) => `<p style="white-space:pre-line;margin:0 0 14px;">${escapeHtml(p)}</p>`).join("")}
      </div>
    </article>
    ${refsHtml}

    ${vocabNotes.length > 0 ? `
      <section class="wb-card">
        <h3 style="margin-top:0;color:var(--wb-teal);">Chú giải từ vựng & thuật ngữ trọng tâm</h3>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead><tr><th>Thuật ngữ / Cụm từ</th><th>Nghĩa tiếng Việt</th></tr></thead>
            <tbody>
              ${vocabNotes.map((v) => `<tr><td><strong>${escapeHtml(v.term || "")}</strong></td><td>${escapeHtml(v.meaning || "")}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>` : ""}

    ${progressFormHtml}

    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
      <a href="/reader" class="wb-btn wb-btn-outline wb-btn-sm">← Quay lại Thư viện đọc</a>
      <a href="/dictionary" class="wb-btn wb-btn-ghost wb-btn-sm">Tra Từ điển</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost wb-btn-sm">Ôn Flashcards</a>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: doc.title_vi,
    currentPath: `/reader/${doc.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Thư viện đọc", href: "/reader" }, { label: doc.title_vi }],
    user,
    runtime,
    contentHtml
  }));
}
__name(renderReaderDocumentPage, "renderReaderDocumentPage");

// src/pages/learning-pages.js
async function renderLearningHub({ db, user }) {
  let programs = [];
  try {
    programs = await safeQueryAll(db, "SELECT * FROM wb_public_programs ORDER BY language_code, code");
  } catch {
    try {
      programs = (await db.prepare("SELECT * FROM wb_programs WHERE language_code IN ('zh','en') AND review_status='published' ORDER BY language_code, code").all()).results || [];
    } catch {
      programs = [];
    }
  }
  let recentPractice = [];
  let dueCount = 0;
  if (user && db) {
    try {
      recentPractice = await safeQueryAll(db, "SELECT id, skill, score, max_score, grading_status, submitted_at FROM wb_public_practice_results WHERE account_id = ? ORDER BY submitted_at DESC LIMIT 5", [user.accountId]);
      const dueRow = await db.prepare("SELECT COUNT(*) AS cnt FROM wb_public_vocabulary_notebook WHERE account_id = ? AND datetime(next_review_at) <= datetime('now')").bind(user.accountId).first();
      dueCount = dueRow?.cnt || 0;
    } catch {}
  }
  const cards = programs.map((p) => `
    <article class="wb-card" style="margin:0;">
      <span class="wb-badge">${escapeHtml(p.language_code.toUpperCase())} · ${escapeHtml(p.program_type)}</span>
      <h3 style="margin-top:10px;"><a href="/programs/${escapeHtml(p.slug)}">${escapeHtml(p.name_vi)}</a></h3>
      <p class="wb-muted" style="font-size:0.9rem;">Đầu vào: ${escapeHtml(p.entry_level)} → Mục tiêu: ${escapeHtml(p.target_level)}</p>
      <p style="font-size:0.88rem;">${p.total_weeks} tuần · ${p.sessions_per_week} buổi/tuần · ~${p.estimated_hours} giờ</p>
      <a href="/programs/${escapeHtml(p.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chi tiết chương trình →</a>
    </article>`).join("");

  const hubHeroArt = `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">
    <path d="M0 132 Q72 82 155 112 T340 94 L340 160 L0 160 Z" fill="#9cd8cd" fill-opacity="0.45"/>
    <circle cx="252" cy="72" r="46" fill="#63c5b4" fill-opacity="0.55" stroke="#0f7c6b" stroke-width="3"/>
    <ellipse cx="252" cy="72" rx="22" ry="46" stroke="#0f7c6b" stroke-width="2.4"/>
    <line x1="206" y1="72" x2="298" y2="72" stroke="#0f7c6b" stroke-width="2.4"/>
    <path d="M214 52 Q252 62 290 52 M214 92 Q252 82 290 92" stroke="#0f7c6b" stroke-width="2"/>
    <g transform="translate(88,68)">
      <path d="M12 46 L112 36 L142 50 L42 62 Z" fill="#0d6960"/><path d="M42 62 L142 50 L142 64 L42 76 Z" fill="#eef9f7"/>
      <path d="M16 24 L116 14 L146 28 L46 40 Z" fill="#179484"/><path d="M46 40 L146 28 L146 42 L46 54 Z" fill="#ffffff"/>
      <path d="M76 16 C76 4 76 -4 76 -12" stroke="#188d73" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="62" cy="-10" rx="15" ry="7.5" transform="rotate(28 62 -10)" fill="#2da77f"/>
      <ellipse cx="90" cy="-14" rx="16" ry="8" transform="rotate(-28 90 -14)" fill="#4ac094"/>
    </g>
  </svg>`;

  const contentHtml = `
    <section class="wb-mint-hero">
      <div class="wb-mint-hero-grid">
        <div class="wb-mint-hero-copy">
          <span class="wb-mint-eyebrow">HỆ THỐNG HỌC NGOẠI NGỮ</span>
          <h1><span style="color:#146466;">WORD</span> <span style="color:#C92F1C;">BRIDGE</span></h1>
          <p>Lộ trình học tập bài bản theo từng ngôn ngữ (Tiếng Trung – Tiếng Anh), kỹ năng và chuyên ngành ứng dụng.</p>
        </div>
        <div class="wb-mint-hero-art">${hubHeroArt}</div>
      </div>
    </section>

    <nav class="wb-practice-tabs" aria-label="Điều hướng phân hệ học tập" style="margin-bottom:20px;">
      <a href="/learning/chinese" class="wb-practice-tab active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a14 14 0 0 1 0 18"/></svg><span>Tiếng Trung (ZH)</span></a>
      <a href="/learning/english" class="wb-practice-tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a14 14 0 0 0 0 18"/></svg><span>Tiếng Anh (EN)</span></a>
      <a href="/learning/path" class="wb-practice-tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19 10 5M14 5l6 14M12 6v2M12 12v2M12 18v2"/></svg><span>Lộ trình học tập</span></a>
      <a href="/learning/skills" class="wb-practice-tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/></svg><span>Trung tâm kỹ năng</span></a>
      <a href="/my-knowledge" class="wb-practice-tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg><span>My Knowledge</span></a>
      <a href="/my-learning" class="wb-practice-tab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg><span>Lộ trình cá nhân</span></a>
    </nav>

    <section class="wb-lh-card">
      <div class="wb-lh-head">
        <div class="wb-lh-title-bar">
          <h2>Learning Home · Hoạt động gần đây</h2>
          <p class="wb-muted" style="margin:0;">${user ? `Từ đến hạn ôn: <strong>${dueCount}</strong> · <a href="/vocabulary/review" style="color:var(--wb-teal);font-weight:700;">Ôn tập SRS ngay</a>` : `Khám phá cấu trúc chương trình và lộ trình học. <a href="${escapeHtml(signInUrl("/learning", "learning.start"))}" style="color:var(--wb-teal);font-weight:700;">Đăng nhập để lưu tiến độ</a>`}</p>
        </div>
        <div class="wb-lh-quick-pills">
          <a href="/learning/path">Lịch học</a>
          <a href="${user ? "/account/learning-data" : "/my-learning"}">Tiến độ học</a>
          <a href="/learning/skills">Mục tiêu học</a>
        </div>
      </div>

      ${recentPractice.length ? `
        <div class="wb-activity-list">
          ${recentPractice.map((r) => `<div class="wb-activity-item"><div class="wb-activity-left"><span class="wb-sc-mint-pill">${escapeHtml(r.skill)}</span><a href="/practice/results/${escapeHtml(r.id)}" style="font-weight:700;">Kết quả luyện tập #${escapeHtml(r.id.slice(0, 12))}</a></div><span class="wb-activity-time">${escapeHtml(r.grading_status || "")} · ${escapeHtml(r.submitted_at || "")}</span></div>`).join("")}
        </div>` : `
        <div style="text-align:center;padding:20px 12px 12px;">
          <svg viewBox="0 0 88 64" width="84" fill="none" aria-hidden="true"><path d="M12 22 C26 14 38 16 44 26 C50 16 62 14 76 22 L70 54 C58 46 48 48 44 54 C40 48 30 46 18 54 Z" fill="#ffffff" stroke="#148c7b" stroke-width="3"/><line x1="44" y1="26" x2="44" y2="54" stroke="#148c7b" stroke-width="2.5"/><path d="M22 30 H36 M22 38 H34 M52 30 H66 M52 38 H64" stroke="#7fd1c2" stroke-width="2.8" stroke-linecap="round"/></svg>
          <h3 style="margin:10px 0 6px;font-size:1.22rem;">Chưa có hoạt động luyện tập gần đây.</h3>
          <p class="wb-muted" style="margin:0 0 16px;">Hãy bắt đầu học hoặc ôn tập theo lộ trình của bạn.</p>
          <a href="${user ? "/learning/path" : escapeHtml(signInUrl("/learning", "learning.start"))}" class="wb-btn wb-btn-primary">▶ Bắt đầu học ngay</a>
        </div>`}
    </section>

    <div class="wb-grid-3">${cards || '<div class="wb-alert wb-alert-info">Chưa có chương trình được phát hành.</div>'}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: "Học ngoại ngữ",
    currentPath: "/learning",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ" }],
    user,
    contentHtml
  }));
}
__name(renderLearningHub, "renderLearningHub");
function renderLanguageHeroArt(code) {
  if (code === "zh") {
    return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">
      <path d="M0 132 Q65 82 145 112 T340 94 L340 160 L0 160 Z" fill="#9cd8cd" fill-opacity="0.45"/>
      <path d="M30 144 Q135 96 245 124 T340 112 L340 160 L30 160 Z" fill="#52b2a4" fill-opacity="0.4"/>
      <g fill="#2b8f83" fill-opacity="0.55">
        <path d="M98 46 L118 32 L138 46 Z"/>
        <rect x="104" y="46" width="28" height="10"/>
        <path d="M92 64 L118 52 L144 64 Z"/>
        <rect x="100" y="64" width="36" height="12"/>
        <path d="M86 84 L118 72 L150 84 Z"/>
        <rect x="96" y="84" width="44" height="22"/>
      </g>
      <path d="M188 18 C236 30 282 28 334 6" stroke="#5b3e2b" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M242 22 C264 36 286 42 314 34" stroke="#5b3e2b" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="222" cy="24" r="7" fill="#fffaf7"/><circle cx="222" cy="24" r="2.2" fill="#e59a7a"/>
      <circle cx="256" cy="22" r="8" fill="#fffaf7"/><circle cx="256" cy="22" r="2.4" fill="#e59a7a"/>
      <circle cx="290" cy="16" r="7" fill="#fffaf7"/><circle cx="290" cy="16" r="2.2" fill="#e59a7a"/>
      <circle cx="278" cy="40" r="6.5" fill="#fffaf7"/><circle cx="278" cy="40" r="2" fill="#e59a7a"/>
      <g transform="translate(152,74)">
        <path d="M18 48 L124 38 L156 54 L50 66 Z" fill="#0d6960"/>
        <path d="M18 48 L50 66 L50 80 L18 62 Z" fill="#0a4f49"/>
        <path d="M50 66 L156 54 L156 68 L50 80 Z" fill="#f2faf8"/>
        <path d="M26 24 L132 14 L164 30 L58 42 Z" fill="#179485"/>
        <path d="M26 24 L58 42 L58 54 L26 36 Z" fill="#0f7066"/>
        <path d="M58 42 L164 30 L164 42 L58 54 Z" fill="#ffffff"/>
      </g>
    </svg>`;
  }
  return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">
    <path d="M0 134 Q75 84 155 112 T340 94 L340 160 L0 160 Z" fill="#9cd8cd" fill-opacity="0.45"/>
    <path d="M25 146 Q140 98 255 124 T340 112 L340 160 L25 160 Z" fill="#52b2a4" fill-opacity="0.4"/>
    <path d="M255 32 C282 14 312 10 336 2" stroke="#1f7f67" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="278" cy="18" rx="12" ry="6" transform="rotate(-24 278 18)" fill="#4cb58a"/>
    <ellipse cx="305" cy="14" rx="11" ry="5.5" transform="rotate(-18 305 14)" fill="#2f9a73"/>
    <ellipse cx="322" cy="24" rx="10" ry="5" transform="rotate(14 322 24)" fill="#5cc79a"/>
    <g transform="translate(132,68)">
      <path d="M62 56 L168 46 L196 60 L90 72 Z" fill="#0e6a60"/>
      <path d="M90 72 L196 60 L196 74 L90 86 Z" fill="#edf8f6"/>
      <path d="M20 42 C52 24 88 28 110 46 C132 28 168 24 196 40 L176 74 C150 58 124 60 110 74 C96 60 66 58 38 74 Z" fill="#ffffff" stroke="#b9dfd8" stroke-width="1.6"/>
      <path d="M110 46 L110 74" stroke="#8bc8be" stroke-width="2"/>
      <path d="M44 46 Q74 38 96 50 M48 56 Q76 48 96 58 M124 50 Q148 38 176 46 M124 58 Q148 48 172 56" stroke="#c8e5e0" stroke-width="2" stroke-linecap="round"/>
    </g>
  </svg>`;
}
function renderTopic22Icon(code, no) {
  const zhBadges = {
    1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v0M8 8v8M12 5v14M16 8v8M20 12v0" stroke-linecap="round"/></svg>',
    2: 'pīn',
    3: 'b',
    4: 'ā',
    5: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14c2.5-6 5.5-6 8 0s5.5 6 8 0" stroke-linecap="round"/></svg>',
    6: '字',
    7: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><rect x="14" y="14" width="6" height="6" rx="1.2"/></svg>',
    8: '汉',
    9: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg>',
    10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></svg>',
    11: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>',
    12: '{ }',
    13: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="13" x2="18" y2="13"/><line x1="4" y1="18" x2="14" y2="18"/></svg>',
    14: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 19h5a4 4 0 0 0-3-3.8"/></svg>',
    15: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/></svg>',
    16: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>',
    17: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
    18: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    19: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10h16M6 10v8M18 10v8M3 18h18M5 10l7-5 7 5"/></svg>',
    20: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    21: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    22: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>'
  };
  const enBadges = {
    1: zhBadges[1],
    2: 'IPA',
    3: 'Aa',
    4: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12c3-4 6-4 8-2 2-2 5-2 8 2-3 4-6 5-8 5s-5-1-8-5z"/></svg>',
    5: 'T',
    6: zhBadges[11],
    7: zhBadges[5],
    8: zhBadges[16],
    9: 'Aa]',
    10: zhBadges[9],
    11: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8 16 16 8"/></svg>',
    12: '&lt;/&gt;',
    13: zhBadges[17],
    14: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    15: zhBadges[17],
    16: zhBadges[18],
    17: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    18: zhBadges[14],
    19: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    20: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    21: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
    22: zhBadges[22]
  };
  return (code === "zh" ? zhBadges[no] : enBadges[no]) || String(no);
}
async function renderLanguageLearningPage({ db, user, languageSlug }) {
  const code = normalizeLanguageCode(languageSlug);
  if (!code) {
    return htmlResponse(renderPublicPage({
      title: "Ngôn ngữ không hỗ trợ",
      currentPath: `/learning/${languageSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">WORD BRIDGE chỉ hỗ trợ 2 ngôn ngữ chính thức: Tiếng Trung, Tiếng Anh. Không hỗ trợ tiếng Nhật hoặc tiếng Hàn.</div>'
    }), 404);
  }
  const lang = OFFICIAL_LANGUAGES[code];
  const [programRows, courseRows, weekRows] = await Promise.all([
    db.prepare("SELECT * FROM wb_public_programs WHERE language_code=? ORDER BY code").bind(code).all(),
    db.prepare("SELECT * FROM wb_public_courses WHERE language_code=? ORDER BY slug").bind(code).all(),
    db.prepare(`SELECT w.slug,w.week_number,w.topic_vi,c.title_vi FROM wb_public_weeks w JOIN wb_public_courses c ON c.id=w.course_id
      WHERE c.language_code=? ORDER BY w.week_number,c.title_vi`).bind(code).all()
  ]);
  const programs = programRows.results || [];
  const courses = courseRows.results || [];
  const weeks = weekRows.results || [];
  const topics22 = lang.code === "zh" ? CHINESE_FOUNDATION_22 : ENGLISH_FOUNDATION_22;
  const frameworkBadge = lang.code === "zh" ? "HSK 1 – 6" : "CEFR A1 – C2";
  const uniqueWeeks = [...new Set(weeks.map((w) => w.week_number))];

  const contentHtml = `
    <div data-wb-lang-tabs-root>
      <section class="wb-mint-hero">
        <div class="wb-mint-hero-grid">
          <div class="wb-mint-hero-copy">
            <h1>Học ${escapeHtml(lang.nameVi)} (${escapeHtml(lang.nativeName)})</h1>
            <div class="wb-lang-meta-list">
              <div class="wb-lang-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3"/></svg>
                <div><strong>Hệ quy chiếu:</strong> ${escapeHtml(lang.framework)}</div>
              </div>
              <div class="wb-lang-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>
                <div><strong>Chữ viết:</strong> ${escapeHtml(lang.scriptSystem)}</div>
              </div>
              <div class="wb-lang-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h10M10 5v3m-3 0c0 5 3 8 7 10m-1-10c-1 4-4 7-8 10"/><path d="M15 19l3-8 3 8m-5-2h4"/></svg>
                <div><strong>Ngữ âm &amp; trọng tâm:</strong> ${escapeHtml(lang.phoneticSystem)}</div>
              </div>
            </div>
          </div>
          <div class="wb-mint-hero-art">${renderLanguageHeroArt(lang.code)}</div>
        </div>
      </section>

      <div class="wb-lang-tabs" role="tablist" aria-label="Phân mục học ${escapeHtml(lang.nameVi)}">
        <button type="button" class="wb-lang-tab-btn active" role="tab" aria-selected="true" data-wb-lang-tab="programs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg>
          <span>Chương trình học</span>
        </button>
        <button type="button" class="wb-lang-tab-btn" role="tab" aria-selected="false" data-wb-lang-tab="weeks">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>
          <span>Giáo trình theo tuần${uniqueWeeks.length ? ` (${uniqueWeeks.length})` : ""}</span>
        </button>
        <button type="button" class="wb-lang-tab-btn" role="tab" aria-selected="false" data-wb-lang-tab="courses">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>
          <span>Khóa học${courses.length ? ` (${courses.length})` : ""}</span>
        </button>
      </div>

      <section data-wb-lang-panel="programs">
        <div class="wb-topics22-card">
          <div class="wb-topics22-head">
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <div class="wb-sc-card-ico" style="width:42px;height:42px;"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg></div>
              <div>
                <h2 style="margin:0 0 4px;font-size:1.3rem;color:var(--wb-text);">Khung 22 chủ điểm nền tảng (${lang.code === "zh" ? "tham chiếu HSK" : "tham chiếu CEFR"})</h2>
                <p class="wb-muted" style="margin:0;">Chương trình học thuật chuẩn hóa cho ${escapeHtml(lang.nameVi)}, không cấp chứng chỉ hay văn bằng chính thức.</p>
              </div>
            </div>
            <span class="wb-topics22-badge">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <span>${frameworkBadge}</span>
            </span>
          </div>
          <div class="wb-topics22-grid">
            ${topics22.map((t) => `
              <div class="wb-topic22-item">
                <div class="wb-topic22-ico" aria-hidden="true">${renderTopic22Icon(lang.code, t.no)}</div>
                <div class="wb-topic22-meta">
                  <strong>${t.no}. ${escapeHtml(t.titleVi)}</strong>
                  <span class="wb-topic22-lvl">${escapeHtml(t.level)}</span>
                </div>
              </div>`).join("")}
          </div>
        </div>

        ${programs.length ? `
        <div class="wb-lp-card" style="margin-top:20px;">
          <h2 style="margin:0 0 14px;color:var(--wb-teal);font-size:1.2rem;">Chương trình đào tạo đã phát hành (${programs.length})</h2>
          <div class="wb-grid-2">
            ${programs.map((p) => `<article class="wb-card" style="margin:0;"><h3 style="margin:0 0 6px;"><a href="/programs/${escapeHtml(p.slug)}">${escapeHtml(p.name_vi)}</a></h3><p class="wb-muted" style="margin:0 0 12px;">${escapeHtml(p.overall_objectives || "")}</p><a href="/programs/${escapeHtml(p.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chương trình →</a></article>`).join("")}
          </div>
        </div>` : ""}
      </section>

      <section data-wb-lang-panel="weeks" hidden>
        <div class="wb-lp-card">
          <h2 style="margin:0 0 14px;color:var(--wb-teal);">Giáo trình theo tuần (${escapeHtml(lang.nameVi)})</h2>
          ${uniqueWeeks.length
            ? `<div class="wb-week-list">${uniqueWeeks.map((n) => `<details open><summary>Tuần ${n}</summary><ul style="margin:8px 0 0;padding-left:18px;">${weeks.filter((w) => w.week_number === n).map((w) => `<li style="margin-bottom:6px;"><a href="/weeks/${encodeURIComponent(w.slug)}">${escapeHtml(w.title_vi)} · ${escapeHtml(w.topic_vi)}</a></li>`).join("")}</ul></details>`).join("")}</div>`
            : '<p class="wb-muted" style="margin:0;">Giáo trình theo tuần đang được cập nhật.</p>'}
        </div>
      </section>

      <section data-wb-lang-panel="courses" hidden>
        <div class="wb-lp-card">
          <h2 style="margin:0 0 14px;color:var(--wb-teal);">Khóa học ${escapeHtml(lang.nameVi)} (${courses.length})</h2>
          ${courses.length ? `
          <div class="wb-grid-2">
            ${courses.map((c) => `
              <article class="wb-card" style="margin:0;">
                <h3 style="margin:0 0 6px;"><a href="/courses/${escapeHtml(c.slug)}">${escapeHtml(c.title_vi)}</a></h3>
                <p class="wb-muted" style="margin:0 0 14px;">${escapeHtml(c.summary_vi || "")}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <a href="/courses/${escapeHtml(c.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Chi tiết khóa học</a>
                  <a href="/courses/${escapeHtml(c.slug)}/curriculum" class="wb-btn wb-btn-outline wb-btn-sm">Xem giáo trình</a>
                </div>
              </article>`).join("")}
          </div>` : '<p class="wb-muted" style="margin:0;">Chưa có khóa học được phát hành cho ngôn ngữ này.</p>'}
        </div>
      </section>
    </div>`;

  return htmlResponse(renderPublicPage({
    title: `Học ${lang.nameVi}`,
    currentPath: `/learning/${lang.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: lang.nameVi }],
    user,
    contentHtml
  }));
}
__name(renderLanguageLearningPage, "renderLanguageLearningPage");
async function renderProgramDetailPage({ db, user, programSlug }) {
  const program = await db.prepare("SELECT * FROM wb_public_programs WHERE slug = ?").bind(programSlug).first();
  if (!program) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy chương trình", currentPath: `/programs/${programSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Không tìm thấy chương trình học yêu cầu.</div>' }), 404);
  }
  const levels = (await db.prepare("SELECT * FROM wb_program_levels WHERE program_id = ? ORDER BY sort_order").bind(program.id).all()).results || [];
  const courses = (await db.prepare("SELECT * FROM wb_public_courses WHERE program_id = ?").bind(program.id).all()).results || [];
  const contentHtml = `
    <span class="wb-badge">${escapeHtml(program.code)} · Phiên bản ${escapeHtml(program.version)}</span>
    <h1>${escapeHtml(program.name_vi)}</h1>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Thông tin học thuật</h3>
        <ul>
          <li><strong>Đầu vào → Mục tiêu:</strong> ${escapeHtml(program.entry_level)} → ${escapeHtml(program.target_level)}</li>
          <li><strong>Đối tượng:</strong> ${escapeHtml(program.target_audience)}</li>
          <li><strong>Điều kiện tiên quyết:</strong> ${escapeHtml(program.prerequisites)}</li>
          <li><strong>Thời lượng:</strong> ${program.total_modules} học phần · ${program.total_weeks} tuần · ${program.sessions_per_week} buổi/tuần (~${program.estimated_hours} giờ)</li>
          <li><strong>Đánh giá:</strong> ${escapeHtml(program.assessment_methods)}</li>
          <li><strong>Tiêu chí hoàn thành:</strong> ${escapeHtml(program.completion_criteria)}</li>
        </ul>
      </div>
      <div class="wb-card">
        <h3>Mục tiêu & Chuẩn đầu ra</h3>
        <p>${escapeHtml(program.overall_objectives)}</p>
        <p><strong>Chuẩn đầu ra:</strong> ${escapeHtml(program.learning_outcomes)}</p>
      </div>
    </div>
    <h2 style="margin-top:24px;">Cấp độ & Khóa học thuộc chương trình</h2>
    <div class="wb-grid-2">
      ${levels.map((lv) => `<div class="wb-card"><h3><a href="/programs/${escapeHtml(program.slug)}/levels/${escapeHtml(lv.slug)}">${escapeHtml(lv.name_vi)}</a></h3><p>${escapeHtml(lv.objectives)}</p></div>`).join("")}
      ${courses.map((c) => `<div class="wb-card"><h3><a href="/courses/${escapeHtml(c.slug)}">${escapeHtml(c.title_vi)}</a></h3><p>${escapeHtml(c.summary_vi)}</p><a href="/courses/${escapeHtml(c.slug)}/curriculum" class="wb-btn wb-btn-primary wb-btn-sm">Mở giáo trình theo tuần</a></div>`).join("")}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: program.name_vi,
    currentPath: `/programs/${program.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: program.name_vi }],
    user,
    contentHtml
  }));
}
__name(renderProgramDetailPage, "renderProgramDetailPage");
async function renderCourseCurriculumPage({ db, user, courseSlug, showCurriculumOnly = false }) {
  const course = await db.prepare("SELECT * FROM wb_public_courses WHERE slug = ?").bind(courseSlug).first();
  if (!course) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy khóa học", currentPath: `/courses/${courseSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Khóa học không tồn tại.</div>' }), 404);
  }
  const modules = (await db.prepare("SELECT * FROM wb_public_modules WHERE course_id = ? ORDER BY sort_order").bind(course.id).all()).results || [];
  const weeks = (await db.prepare("SELECT * FROM wb_public_weeks WHERE course_id = ? ORDER BY week_number").bind(course.id).all()).results || [];
  const contentHtml = `
    <h1>${escapeHtml(showCurriculumOnly ? `Giáo trình: ${course.title_vi}` : course.title_vi)}</h1>
    <p class="wb-muted">${escapeHtml(course.summary_vi)}</p>
    <div style="margin:12px 0 20px;">
      ${modules.map((m) => `<a href="/modules/${escapeHtml(m.slug)}" class="wb-btn wb-btn-outline wb-btn-sm" style="margin-right:8px;">Mở học phần: ${escapeHtml(m.title_vi)}</a>`).join("")}
    </div>
    <div class="wb-table-wrap">
      <table class="wb-table">
        <thead><tr><th>Tuần</th><th>Chủ đề</th><th>Kiến thức trọng tâm</th><th>Số buổi</th><th>Trang chi tiết</th></tr></thead>
        <tbody>
          ${weeks.map((w) => `<tr><td><strong>Tuần ${String(w.week_number).padStart(2, "0")}</strong></td><td>${escapeHtml(w.topic_vi)}</td><td>${escapeHtml(w.required_knowledge)}</td><td>${w.sessions_count} buổi</td><td><a href="/weeks/${escapeHtml(w.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở tuần học</a></td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: showCurriculumOnly ? `Giáo trình ${course.title_vi}` : course.title_vi,
    currentPath: showCurriculumOnly ? `/courses/${course.slug}/curriculum` : `/courses/${course.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: course.title_vi }],
    user,
    contentHtml
  }));
}
__name(renderCourseCurriculumPage, "renderCourseCurriculumPage");
async function renderModuleDetailPage({ db, user, moduleSlug }) {
  const mod = await db.prepare(`
    SELECT m.*, c.title_vi AS course_title, c.slug AS course_slug, p.prerequisites AS program_prerequisites
    FROM wb_public_modules m
    JOIN wb_public_courses c ON c.id = m.course_id
    JOIN wb_public_programs p ON p.id = c.program_id
    WHERE m.slug = ?
  `).bind(moduleSlug).first();
  if (!mod) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy học phần", currentPath: `/modules/${moduleSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Học phần không tồn tại.</div>' }), 404);
  }
  const weeks = (await db.prepare("SELECT * FROM wb_public_weeks WHERE module_id = ? ORDER BY week_number").bind(mod.id).all()).results || [];
  const weekIds = weeks.map((w) => w.id);
  const lessons = weekIds.length ? (await db.prepare(`SELECT id, week_id, slug, title_vi FROM wb_public_lessons WHERE week_id IN (${weekIds.map(() => "?").join(",")}) ORDER BY slug`).bind(...weekIds).all()).results || [] : [];
  const resources = lessons.length ? (await db.prepare(`SELECT id, lesson_id, title_vi, resource_type FROM wb_public_learning_resources WHERE lesson_id IN (${lessons.slice(0, 50).map(() => "?").join(",")}) LIMIT 20`).bind(...lessons.slice(0, 50).map((l) => l.id)).all()).results || [] : [];
  let completedLessonIds = /* @__PURE__ */ new Set();
  if (user && lessons.length) {
    const prg = (await db.prepare("SELECT lesson_id FROM wb_public_learner_progress WHERE account_id = ? AND status = 'completed'").bind(user.accountId).all()).results || [];
    completedLessonIds = new Set(prg.map((r) => r.lesson_id));
  }
  const completedInMod = lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPct = lessons.length ? Math.round(completedInMod / lessons.length * 100) : 0;
  const contentHtml = `
    <span class="wb-badge">Học phần #${mod.sort_order} · Thuộc khóa: ${escapeHtml(mod.course_title)}</span>
    <h1>${escapeHtml(mod.title_vi)}</h1>
    <div class="wb-grid-2" style="margin-bottom:20px;">
      <div class="wb-card">
        <h3>Mục tiêu & Điều kiện tiên quyết học phần</h3>
        <p><strong>Mục tiêu riêng:</strong> ${escapeHtml(mod.objectives_vi)}</p>
        <p><strong>Điều kiện tiên quyết:</strong> ${escapeHtml(mod.program_prerequisites)}</p>
        <p><strong>Quy mô học phần:</strong> ${weeks.length} tuần · ${lessons.length} bài học · ${resources.length} học liệu mẫu</p>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Tiến độ cá nhân trong học phần</h3>
        ${user ? `<p>Đã hoàn thành <strong>${completedInMod} / ${lessons.length}</strong> bài học (${progressPct}%).</p>` : '<p class="wb-muted">Đăng nhập tài khoản cá nhân để theo dõi tiến độ riêng của học phần này.</p><a href="/login" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>'}
      </div>
    </div>
    <h2>Danh sách tuần thuộc học phần</h2>
    <div class="wb-table-wrap">
      <table class="wb-table">
        <thead><tr><th>Tuần</th><th>Chủ đề</th><th>Số buổi</th><th>Số bài học</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead>
        <tbody>
          ${weeks.map((w) => {
    const wLessons = lessons.filter((l) => l.week_id === w.id);
    const wDone = wLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const statusLabel = !user ? "Công khai xem" : wLessons.length && wDone === wLessons.length ? "Hoàn thành" : wDone > 0 ? "Đang học" : "Chưa bắt đầu";
    return `<tr><td><strong>Tuần ${String(w.week_number).padStart(2, "0")}</strong></td><td>${escapeHtml(w.topic_vi)}</td><td>${w.sessions_count} buổi</td><td>${wLessons.length} bài</td><td><span class="wb-badge">${statusLabel}</span></td><td><a href="/weeks/${escapeHtml(w.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở tuần</a></td></tr>`;
  }).join("")}
        </tbody>
      </table>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Học phần: ${mod.title_vi}`,
    currentPath: `/modules/${mod.slug}`,
    breadcrumbs: [
      { label: "Trang chủ", href: "/" },
      { label: "Học ngoại ngữ", href: "/learning" },
      { label: mod.course_title, href: `/courses/${mod.course_slug}` },
      { label: mod.title_vi }
    ],
    user,
    contentHtml
  }));
}
__name(renderModuleDetailPage, "renderModuleDetailPage");
async function renderWeekDetailPage({ db, user, weekSlug }) {
  const week = await db.prepare("SELECT * FROM wb_public_weeks WHERE slug = ?").bind(weekSlug).first();
  if (!week) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy tuần học", currentPath: `/weeks/${weekSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Tuần học không tồn tại.</div>' }), 404);
  }
  const sessions = (await db.prepare("SELECT * FROM wb_study_sessions WHERE week_id = ? ORDER BY position_in_week").bind(week.id).all()).results || [];
  const lessons = (await db.prepare("SELECT id, session_id, slug, title_vi, level_ref FROM wb_public_lessons WHERE week_id = ? ORDER BY slug").bind(week.id).all()).results || [];
  const vocab = safeJsonParse(week.core_vocabulary_json, []);
  const grammar = safeJsonParse(week.core_grammar_json, []);
  const materials = safeJsonParse(week.study_materials_json, []);
  const exercises = safeJsonParse(week.exercises_json, []);
  const contentHtml = `
    <span class="wb-badge">Tuần ${String(week.week_number).padStart(2, "0")} · ${sessions.length || week.sessions_count} buổi học thực tế</span>
    <h1>${escapeHtml(week.name_vi)}</h1>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Mục tiêu, Chuẩn đầu ra & Kiến thức</h3>
        <p><strong>Chủ đề:</strong> ${escapeHtml(week.topic_vi)}</p>
        <p><strong>Mục tiêu tuần:</strong> ${escapeHtml(week.week_objectives)}</p>
        <p><strong>Chuẩn đầu ra:</strong> ${escapeHtml(week.learning_outcomes)}</p>
        <p><strong>Kiến thức cần đạt:</strong> ${escapeHtml(week.required_knowledge)}</p>
        <p><strong>Phát âm & âm vị:</strong> ${escapeHtml(week.pronunciation_phonetics)}</p>
      </div>
      <div class="wb-card">
        <h3>Từ vựng & Ngữ pháp trọng tâm</h3>
        <p><strong>Từ vựng:</strong> ${vocab.map((v) => `<span class="wb-badge" style="margin:2px;">${escapeHtml(v)}</span>`).join("")}</p>
        <ul>${grammar.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
        <p><strong>Tình huống ứng dụng:</strong> ${escapeHtml(week.application_scenario)}</p>
      </div>
    </div>
    <div class="wb-grid-2" style="margin-top:18px;">
      <div class="wb-card">
        <h3>Nội dung bốn kỹ năng</h3>
        <ul>
          <li><strong>Nghe:</strong> ${escapeHtml(week.listening_content)}</li>
          <li><strong>Nói:</strong> ${escapeHtml(week.speaking_content)}</li>
          <li><strong>Đọc:</strong> ${escapeHtml(week.reading_content)}</li>
          <li><strong>Viết:</strong> ${escapeHtml(week.writing_content)}</li>
        </ul>
      </div>
      <div class="wb-card">
        <h3>Học liệu, Kiểm tra tuần & Chuẩn bị</h3>
        <ul>
          <li><strong>Tài liệu:</strong> ${escapeHtml(materials.join(", "))}</li>
          <li><strong>Bài tập:</strong> ${escapeHtml(exercises.join(", "))}</li>
          <li><strong>Bài kiểm tra tuần:</strong> ${escapeHtml(week.weekly_test_spec)}</li>
          <li><strong>Tiêu chí đạt:</strong> ${escapeHtml(week.passing_criteria)}</li>
          <li><strong>Bài ôn tập:</strong> ${escapeHtml(week.review_assignment)}</li>
          <li><strong>Chuẩn bị tuần kế tiếp:</strong> ${escapeHtml(week.next_week_prep)}</li>
        </ul>
      </div>
    </div>
    <h2 style="margin-top:24px;">Các buổi học & Bài học trong tuần (${lessons.length} bài)</h2>
    <div class="wb-grid-3">
      ${lessons.map((l) => `<article class="wb-card"><h3><a href="/lessons/${escapeHtml(l.slug)}">${escapeHtml(l.title_vi)}</a></h3><p class="wb-muted">Trình độ: ${escapeHtml(l.level_ref)}</p><a href="/lessons/${escapeHtml(l.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Mở bài học</a></article>`).join("")}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: week.name_vi,
    currentPath: `/weeks/${week.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: week.name_vi }],
    user,
    contentHtml
  }));
}
__name(renderWeekDetailPage, "renderWeekDetailPage");
async function renderLessonDetailPage({ db, user, lessonSlug }) {
  const lesson = await db.prepare("SELECT * FROM wb_public_lessons WHERE slug = ?").bind(lessonSlug).first();
  if (!lesson) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy bài học", currentPath: `/lessons/${lessonSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Bài học không tồn tại.</div>' }), 404);
  }
  const c = safeJsonParse(lesson.components_json, {});
  const audioAsset = await db.prepare("SELECT a.* FROM wb_public_audio_assets a JOIN wb_public_learning_resources r ON r.r2_object_key=a.r2_object_key WHERE r.lesson_id=? LIMIT 1").bind(lesson.id).first();
  const segments = audioAsset ? safeJsonParse(audioAsset.sync_segments_json, []) : [];
  const checkQIds = Array.isArray(c.checkQuestionIds) ? c.checkQuestionIds : [];
  const questions = [];
  for (const qid of checkQIds) {
    const q = await db.prepare("SELECT * FROM wb_public_question_bank WHERE id = ?").bind(qid).first();
    if (q) questions.push(q);
  }
  const audioPlayerHtml = `
    <div class="wb-audio-player" data-wb-audio style="margin-bottom:18px;">
      <strong>Trình phát âm thanh bài học (${escapeHtml(audioAsset ? audioAsset.voice_label : "Âm thanh bài học")})</strong>
      <audio controls preload="none" style="width:100%;" src="${audioAsset ? `/api/v1/audio/${escapeHtml(audioAsset.id)}/stream` : ""}"></audio>
      <div class="wb-audio-controls">
        <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-audio-action="play">Phát</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="pause">Tạm dừng</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="stop">Dừng</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="replay">Phát lại</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="back">-5s</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="forward">+5s</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="loop">Lặp: Tắt</button>
        <span class="wb-muted">Tốc độ: <strong data-speed-label>1.0x</strong></span>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="0.75">0.75x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1">1.0x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.25">1.25x</button>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.5">1.5x</button>
        <a class="wb-btn wb-btn-outline wb-btn-sm" href="/skills/pronunciation">Luyện ghi âm</a>
      </div>
      ${segments.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${segments.map((s) => `<button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-audio-segment-start="${s.startMs}">▶ ${escapeHtml(s.text)}</button>`).join("")}</div>` : ""}
      <div data-audio-status class="wb-muted" style="font-size:0.84rem;">Chọn tốc độ phát phù hợp với bạn.</div>
      <div id="wb-mic-status" class="wb-muted" style="font-size:0.84rem;">Micro chỉ bật khi bạn chủ động nhấn nút.</div>
    </div>`;
  const quizFields = questions.map((q) => {
    const opts = safeJsonParse(q.options_json, []);
    return `
      <div class="wb-field">
        <label>${escapeHtml(q.prompt_text)}</label>
        <select class="wb-select" name="answer_${escapeHtml(q.id)}">
          <option value="">-- Chọn đáp án --</option>
          ${opts.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
        </select>
      </div>`;
  }).join("");
  const actionBlock = user ? `
      <form class="wb-card wb-card-warm wb-form" data-api-endpoint="/api/v1/learning/progress" data-redirect-to="/lessons/${escapeHtml(lesson.slug)}/result">
        <input type="hidden" name="lessonId" value="${escapeHtml(lesson.id)}" />
        <h3>Kiểm tra mức hiểu & Ghi nhận hoàn thành</h3>
        <p class="wb-muted" style="font-size:0.88rem;margin:0;">Điểm số được tính hoàn toàn tại backend từ câu trả lời thực tế. Nếu bài chỉ đọc nội dung, hệ thống ghi nhận trạng thái hoàn thành nội dung (không gán điểm 100% giả).</p>
        ${quizFields}
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Nộp kiểm tra & Xem trang kết quả bài học</button>
      </form>` : `<div class="wb-alert wb-alert-info">Bạn đang xem trước nội dung bài học công khai. <a href="/login">Đăng nhập</a> để làm kiểm tra và lưu tiến độ cá nhân.</div>`;
  const contentHtml = `
    <span class="wb-badge">${escapeHtml(lesson.language_code.toUpperCase())} · ${escapeHtml(lesson.level_ref)} · v${escapeHtml(lesson.version)}</span>
    <h1>${escapeHtml(lesson.title_vi)}</h1>
    ${!audioAsset ? '<p class="wb-muted">Âm thanh của bài học đang được cập nhật.</p>' : user ? audioPlayerHtml : '<a href="/login" class="wb-btn wb-btn-outline">Đăng nhập để nghe</a>'}
    <div class="wb-grid-2">
      <div class="wb-card"><h3>1. Mục tiêu & Kiến thức</h3><p>${escapeHtml(c.objectives || "")}</p><p>${escapeHtml(c.coreKnowledge || "")}</p></div>
      <div class="wb-card"><h3>2. Phiên âm & Phát âm</h3><p>${escapeHtml(c.phonetics || "")}</p></div>
      <div class="wb-card"><h3>3. Nghe & Nói</h3><p><strong>Listening:</strong> ${escapeHtml(c.listening || "")}</p><p><strong>Speaking:</strong> ${escapeHtml(c.speaking || "")}</p></div>
      <div class="wb-card"><h3>4. Đọc & Viết</h3><p><strong>Reading:</strong> ${escapeHtml(c.reading || "")}</p><p><strong>Writing:</strong> ${escapeHtml(c.writing || "")}</p></div>
    </div>
    <div style="margin-top:20px;">${actionBlock}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: lesson.title_vi,
    currentPath: `/lessons/${lesson.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: lesson.title_vi }],
    user,
    contentHtml
  }));
}
__name(renderLessonDetailPage, "renderLessonDetailPage");
async function renderLessonResultPage({ db, user, lessonSlug }) {
  if (!user) return redirectResponse("/login");
  const lesson = await db.prepare("SELECT * FROM wb_public_lessons WHERE slug = ?").bind(lessonSlug).first();
  if (!lesson) {
    return htmlResponse(renderPublicPage({ title: "Không tìm thấy bài học", currentPath: `/lessons/${lessonSlug}/result`, user, contentHtml: '<div class="wb-alert wb-alert-error">Bài học không tồn tại.</div>' }), 404);
  }
  const sub = await db.prepare("SELECT * FROM wb_public_lesson_submissions WHERE account_id = ? AND lesson_id = ? ORDER BY submitted_at DESC LIMIT 1").bind(user.accountId, lesson.id).first();
  if (!sub) {
    return htmlResponse(renderPublicPage({
      title: `Kết quả: ${lesson.title_vi}`,
      currentPath: `/lessons/${lesson.slug}/result`,
      breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: lesson.title_vi, href: `/lessons/${lesson.slug}` }, { label: "Kết quả bài học" }],
      user,
      contentHtml: `<h1>Kết quả bài học: ${escapeHtml(lesson.title_vi)}</h1><div class="wb-alert wb-alert-info">Bạn chưa có lượt nộp hoặc hoàn thành nào cho bài học này. <a href="/lessons/${escapeHtml(lesson.slug)}">Quay lại bài học</a>.</div>`
    }));
  }
  const breakdown = safeJsonParse(sub.breakdown_json, []);
  const skills = safeJsonParse(sub.skills_assessed_json, []);
  const correctCount = breakdown.filter((b) => b.correct).length;
  const incorrectCount = breakdown.filter((b) => !b.correct).length;
  const contentHtml = `
    <span class="wb-badge">Trạng thái: ${escapeHtml(sub.lifecycle_status)} · Thời điểm: ${escapeHtml(sub.submitted_at)}</span>
    <h1>Kết quả bài học: ${escapeHtml(lesson.title_vi)}</h1>
    <div class="wb-grid-2" style="margin-bottom:20px;">
      <div class="wb-card">
        <h3>Tổng hợp đánh giá từ backend</h3>
        <p><strong>Điểm số:</strong> ${sub.score_percent !== null ? `${sub.score}/${sub.max_score} (${sub.score_percent}%)` : "Không có câu chấm điểm — Ghi nhận hoàn thành nội dung đọc"}</p>
        <p><strong>Phần đúng / Phần sai:</strong> ${correctCount} đúng · ${incorrectCount} sai</p>
        <p><strong>Kỹ năng đánh giá:</strong> ${escapeHtml(skills.join(", "))}</p>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Cải thiện & Đề xuất tiếp theo</h3>
        <p><strong>Nội dung cần cải thiện:</strong> ${escapeHtml(sub.improvement_notes_vi)}</p>
        <p><strong>Đề xuất tiếp theo:</strong> ${escapeHtml(sub.next_recommendation_vi)}</p>
      </div>
    </div>
    ${breakdown.length ? `
      <h2>Chi tiết câu trả lời & Giải thích</h2>
      <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Câu hỏi</th><th>Trả lời của bạn</th><th>Đáp án đúng</th><th>Kết quả</th><th>Giải thích</th></tr></thead><tbody>
        ${breakdown.map((b) => `<tr><td>${escapeHtml(b.prompt)}</td><td>${escapeHtml(b.given)}</td><td>${escapeHtml(b.expected)}</td><td><span class="wb-badge ${b.correct ? "wb-badge-ok" : "wb-badge-red"}">${b.correct ? "Đúng" : "Sai"}</span></td><td>${escapeHtml(b.explanationVi)}</td></tr>`).join("")}
      </tbody></table></div>` : ""}
    <div style="margin-top:18px;display:flex;gap:10px;">
      <a href="/lessons/${escapeHtml(lesson.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem lại bài học</a>
      <a href="/practice" class="wb-btn wb-btn-primary wb-btn-sm">Luyện tập mở rộng</a>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Kết quả bài học: ${lesson.title_vi}`,
    currentPath: `/lessons/${lesson.slug}/result`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học ngoại ngữ", href: "/learning" }, { label: lesson.title_vi, href: `/lessons/${lesson.slug}` }, { label: "Kết quả" }],
    user,
    contentHtml
  }));
}
__name(renderLessonResultPage, "renderLessonResultPage");
async function renderMyLearningPage({ db, user, subPath = "" }) {
  if (!user) return redirectResponse("/login");
  const progress = (await db.prepare(`
    SELECT p.*, l.title_vi AS lesson_title, l.slug AS lesson_slug
    FROM wb_public_learner_progress p
    LEFT JOIN wb_public_lessons l ON l.id = p.lesson_id
    WHERE p.account_id = ?
    ORDER BY p.updated_at DESC LIMIT 30
  `).bind(user.accountId).all()).results || [];
  const title = subPath === "history" ? "Lịch sử học tập" : subPath === "vocabulary" ? "Từ vựng cá nhân" : "Lộ trình cá nhân";
  const contentHtml = `
    <h1>${title}</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      <a href="/my-learning" class="wb-btn wb-btn-outline wb-btn-sm">Tổng quan lộ trình</a>
      <a href="/my-learning/history" class="wb-btn wb-btn-outline wb-btn-sm">Lịch sử học tập</a>
      <a href="/my-learning/vocabulary" class="wb-btn wb-btn-outline wb-btn-sm">Từ vựng cá nhân</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-primary wb-btn-sm">Ôn tập SRS ngay</a>
    </div>
    ${progress.length ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Bài học</th><th>Trạng thái</th><th>Điểm</th><th>Kết quả chi tiết</th></tr></thead><tbody>${progress.map((r) => `<tr><td><a href="/lessons/${escapeHtml(r.lesson_slug || "")}">${escapeHtml(r.lesson_title || r.lesson_id)}</a></td><td>${escapeHtml(r.status)}</td><td>${r.score_percent !== null ? `${r.score_percent}%` : "Hoàn thành nội dung"}</td><td><a href="/lessons/${escapeHtml(r.lesson_slug || "")}/result">Xem kết quả</a></td></tr>`).join("")}</tbody></table></div>` : '<div class="wb-alert wb-alert-info">Bạn chưa có tiến độ học tập nào được ghi nhận. Hãy mở một bài học tại <a href="/learning">/learning</a> để bắt đầu.</div>'}
  `;
  return htmlResponse(renderPublicPage({
    title,
    currentPath: subPath ? `/my-learning/${subPath}` : "/my-learning",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Lộ trình cá nhân", href: "/my-learning" }],
    user,
    contentHtml
  }));
}
__name(renderMyLearningPage, "renderMyLearningPage");

// src/pages/learning-system-pages.js
var SKILLS = Object.freeze({
  vocabulary: { vi: "Từ vựng", en: "Vocabulary", route: "/practice/vocabulary" },
  grammar: { vi: "Ngữ pháp", en: "Grammar", route: "/practice/grammar" },
  listening: { vi: "Nghe", en: "Listening", route: "/practice/listening" },
  speaking: { vi: "Nói", en: "Speaking", route: "/practice/speaking" },
  pronunciation: { vi: "Phát âm", en: "Pronunciation", route: "/practice/speaking" },
  reading: { vi: "Đọc", en: "Reading", route: "/practice/reading" },
  writing: { vi: "Viết", en: "Writing", route: "/practice/writing" }
});
function safeJson2(value, fallback = null) {
  try {
    return safeJsonParse(value ?? "", {});
  } catch {
    return fallback;
  }
}
__name(safeJson2, "safeJson");
function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}
__name(pct, "pct");
async function renderGlobalSearchPage({ db, user, url }) {
  const q = String(url.searchParams.get("q") || "").trim();
  const category = String(url.searchParams.get("category") || "all");
  if (q && !user) return redirectResponse(signInUrl(`${url.pathname}${url.search}`, "global.search", url.searchParams.get("locale") || ""));
  const results = { dictionary: [], learning: [], practice: [], specialized: [] };
  let error = "";
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    try {
      const tasks = [];
      if (category === "all" || category === "dictionary") tasks.push(db.prepare(`
        SELECT language_code, slug, headword AS title, meaning_vi AS summary, level_ref
        FROM wb_public_dictionary_entries
        WHERE review_status='published' AND (lower(headword) LIKE ? OR lower(meaning_vi) LIKE ? OR lower(phonetic) LIKE ?)
        ORDER BY headword LIMIT 20`).bind(like, like, like).all().then((r) => {
        results.dictionary = r.results || [];
      }));
      if (category === "all" || category === "learning") tasks.push(db.prepare(`
        SELECT 'lesson' kind, l.slug, l.title_vi AS title, '' AS summary, l.language_code, l.level_ref
        FROM wb_public_lessons l
        WHERE l.review_status='published' AND lower(l.title_vi) LIKE ?
        UNION ALL
        SELECT 'course' kind, c.slug, c.title_vi AS title, c.summary_vi AS summary, c.language_code, COALESCE(pl.framework_ref,'') AS level_ref
        FROM wb_public_courses c LEFT JOIN wb_program_levels pl ON pl.id=c.level_id
        WHERE c.review_status='published' AND (lower(c.title_vi) LIKE ? OR lower(c.summary_vi) LIKE ?)
        LIMIT 20`).bind(like, like, like).all().then((r) => {
        results.learning = r.results || [];
      }));
      if (category === "all" || category === "practice") tasks.push(db.prepare(`
        SELECT slug, title_vi AS title, instructions_vi AS summary, language_code, skill, level_ref
        FROM wb_public_practice_exercises
        WHERE lower(title_vi) LIKE ? OR lower(instructions_vi) LIKE ? OR lower(topic) LIKE ?
        ORDER BY skill, title_vi LIMIT 20`).bind(like, like, like).all().then((r) => {
        results.practice = r.results || [];
      }));
      await Promise.all(tasks);
      if (category === "all" || category === "specialized") {
        results.specialized = SPECIALIZED_VOCAB_DOMAINS.filter((d) => `${d.nameVi} ${d.sample}`.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
      }
    } catch (err) {
      error = "SEARCH_UNAVAILABLE";
    }
  }
  const total = Object.values(results).reduce((n, rows) => n + rows.length, 0);
  const group = /* @__PURE__ */ __name((title, rows, render) => rows.length ? `<section class="wb-search-group"><h2>${title} <span class="wb-badge">${rows.length}</span></h2><div class="wb-search-results">${rows.map(render).join("")}</div></section>` : "", "group");
  const contentHtml = `
    <section class="wb-learning-landing"><p class="wb-eyebrow" data-i18n="search.eyebrow">SEARCH · DISCOVER · BRIDGE</p><h1 data-i18n="search.title">Tìm kiếm WORD BRIDGE</h1><p data-i18n="search.intro">Tìm mục từ, bài học, hoạt động luyện tập và môi trường chuyên ngành từ dữ liệu đang có.</p></section>
    <form method="GET" action="/search" role="search" class="wb-search-shell" data-wb-search-form ${user ? "" : 'data-auth-intent="global.search"'}>
      <label class="wb-sr-only" for="wb-global-search" data-i18n="search.label">Từ khóa tìm kiếm</label>
      <input id="wb-global-search" class="wb-input" type="search" name="q" value="${escapeHtml(q)}" autocomplete="off" placeholder="Tìm từ, bài học, kỹ năng, chuyên ngành..." data-i18n-placeholder="search.placeholder" />
      <label class="wb-sr-only" for="wb-search-category" data-i18n="search.category">Nhóm kết quả</label>
      <select id="wb-search-category" class="wb-select" name="category">
        <option value="all" ${category === "all" ? "selected" : ""}>Tất cả</option><option value="dictionary" ${category === "dictionary" ? "selected" : ""}>Từ điển</option><option value="learning" ${category === "learning" ? "selected" : ""}>Học</option><option value="practice" ${category === "practice" ? "selected" : ""}>Luyện tập</option><option value="specialized" ${category === "specialized" ? "selected" : ""}>Chuyên ngành</option>
      </select>
      <button class="wb-btn wb-btn-primary" type="submit" data-i18n="search.submit">Tìm kiếm</button>
      ${q ? '<a class="wb-btn wb-btn-ghost" href="/search" data-i18n="search.clear">Xóa từ khóa</a>' : ""}
    </form>
    ${!q ? `<section class="wb-empty-state"><h2 data-i18n="search.emptyTitle">Bắt đầu bằng một từ khóa</h2><p data-i18n="search.emptyBody">Nhập từ khóa hoặc chọn một nhóm nội dung.</p></section>` : ""}
    ${error ? `<section class="wb-alert wb-alert-error" role="alert"><strong data-i18n="search.errorTitle">Không thể tải kết quả tìm kiếm.</strong> <span data-i18n="search.errorBody">Vui lòng thử lại sau.</span></section>` : ""}
    ${q && !error && !total ? `<section class="wb-empty-state"><h2 data-i18n="search.noResults">Không tìm thấy kết quả phù hợp</h2><p data-i18n="search.noResultsBody">Thử từ khóa ngắn hơn hoặc đổi nhóm kết quả.</p><a href="/learning" class="wb-btn wb-btn-outline" data-i18n="search.explore">Khám phá học tập</a></section>` : ""}
    ${group("Từ điển", results.dictionary, (r) => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.level_ref)}</p><h3><a href="/dictionary/${r.language_code === "zh" ? "chinese" : "english"}/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary)}</p></article>`)}
    ${group("Học tập", results.learning, (r) => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.level_ref)}</p><h3><a href="/${r.kind === "course" ? "courses" : "lessons"}/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary || "")}</p></article>`)}
    ${group("Luyện tập", results.practice, (r) => `<article><p class="wb-eyebrow">${escapeHtml(r.language_code.toUpperCase())} · ${escapeHtml(r.skill)} · ${escapeHtml(r.level_ref)}</p><h3><a href="/practice/${escapeHtml(r.skill)}">${escapeHtml(r.title)}</a></h3><p>${escapeHtml(r.summary || "")}</p></article>`)}
    ${group("Chuyên ngành", results.specialized, (r) => `<article><p class="wb-eyebrow">SPECIALIZED · ${r.count.toLocaleString("vi-VN")} terms</p><h3><a href="/specialized/${escapeHtml(r.slug)}">${escapeHtml(r.nameVi)}</a></h3><p>${escapeHtml(r.sample)}</p></article>`)}
  `;
  return htmlResponse(renderPublicPage({ title: q ? `Tìm kiếm: ${q}` : "Tìm kiếm", currentPath: "/search", breadcrumbs: [{ label: "Tìm kiếm" }], user, contentHtml }));
}
__name(renderGlobalSearchPage, "renderGlobalSearchPage");
function renderLearningPathHeroArt() {
  return `<svg viewBox="0 0 340 130" fill="none" aria-hidden="true">
    <path d="M0 118 Q72 60 155 96 T340 62 L340 130 L0 130 Z" fill="#9cd8cd" fill-opacity="0.48"/>
    <path d="M40 128 Q145 72 245 96 T340 80 L340 130 L40 130 Z" fill="#46ab9b" fill-opacity="0.5"/>
    <path d="M98 130 C138 112 108 94 176 86 C230 80 202 58 262 42" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.92"/>
    <path d="M98 130 C138 112 108 94 176 86 C230 80 202 58 262 42" stroke="#bce8df" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>
    <g stroke="#0c7766" stroke-width="2">
      <line x1="138" y1="96" x2="138" y2="76"/><path d="M138 76 L154 81 L138 86 Z" fill="#ffffff"/>
      <line x1="210" y1="74" x2="210" y2="54"/><path d="M210 54 L226 59 L210 64 Z" fill="#ffffff"/>
      <line x1="262" y1="42" x2="262" y2="14"/><path d="M262 14 L286 22 L262 30 Z" fill="#10937e"/>
    </g>
    <ellipse cx="292" cy="118" rx="18" ry="8" transform="rotate(-24 292 118)" fill="#2a8d6d"/>
    <ellipse cx="320" cy="112" rx="16" ry="7" transform="rotate(-38 320 112)" fill="#4cb58a"/>
  </svg>`;
}
function renderLearningPathEmptySvg() {
  return `<svg viewBox="0 0 280 155" width="250" fill="none" aria-hidden="true">
    <ellipse cx="140" cy="126" rx="115" ry="18" fill="#d7f2ec" opacity="0.7"/>
    <path d="M40 94 Q55 34 115 36 Q142 12 184 36 Q238 34 242 94 Z" fill="#dff5f0" opacity="0.75"/>
    <g transform="translate(36,64)">
      <path d="M10 38 L88 28 L114 42 L36 54 Z" fill="#0d6960"/>
      <path d="M10 38 L36 54 L36 66 L10 50 Z" fill="#084b45"/>
      <path d="M36 54 L114 42 L114 54 L36 66 Z" fill="#f0faf8"/>
      <path d="M14 18 L92 8 L118 22 L40 34 Z" fill="#189887"/>
      <path d="M14 18 L40 34 L40 46 L14 30 Z" fill="#0e7266"/>
      <path d="M40 34 L118 22 L118 34 L40 46 Z" fill="#ffffff"/>
      <path d="M64 16 C64 4 64 -4 64 -10" stroke="#188d73" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="52" cy="-8" rx="14" ry="7" transform="rotate(28 52 -8)" fill="#2da77f"/>
      <ellipse cx="77" cy="-12" rx="15" ry="7.5" transform="rotate(-28 77 -12)" fill="#4ac094"/>
    </g>
    <path d="M150 114 C172 114 186 116 196 106 C206 96 200 84 226 84" stroke="#0f7c6b" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round"/>
    <circle cx="182" cy="96" r="10" fill="#ffffff" stroke="#0f7c6b" stroke-width="2.4"/><circle cx="182" cy="95" r="3" fill="#0f7c6b"/>
    <line x1="230" y1="84" x2="230" y2="44" stroke="#0f7c6b" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M230 44 L256 53 L230 62 Z" fill="#108c78"/>
  </svg>`;
}
async function renderLearningPathPage({ db, user }) {
  const courses = await safeQueryAll(db, `SELECT c.id,c.slug,c.title_vi,c.language_code,c.summary_vi,COALESCE(pl.framework_ref,'') AS level_ref,COALESCE(pl.sort_order,999) AS sort_order FROM wb_public_courses c LEFT JOIN wb_program_levels pl ON pl.id=c.level_id WHERE c.review_status='published' ORDER BY c.language_code,COALESCE(pl.sort_order,999),c.title_vi`);
  const weeks = await safeQueryAll(db, `SELECT id, course_id, slug, week_number, topic_vi, required_knowledge, sessions_count FROM wb_public_weeks ORDER BY course_id, week_number`);
  let progress = [];
  if (user) progress = await safeQueryAll(db, `SELECT course_id, lesson_id, status, score_percent, updated_at FROM wb_public_learner_progress WHERE account_id=? ORDER BY updated_at DESC`, [user.accountId]);
  const lessons = (await db.prepare("SELECT l.id,w.course_id FROM wb_public_lessons l JOIN wb_public_weeks w ON w.id=l.week_id WHERE l.review_status='published'").all()).results || [];
  const completedLessons = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lesson_id));
  const paths = courses.map((course, i) => {
    const nodes = lessons.filter((l) => l.course_id === course.id);
    const ids = new Set(nodes.map((l) => l.id));
    const activity = progress.filter((p2) => p2.course_id === course.id || ids.has(p2.lesson_id));
    const p = activity[0];
    const needsReview = activity.some((row) => row.status === "in_progress" && row.score_percent != null && row.score_percent < 70);
    const state = nodes.length && nodes.every((l) => completedLessons.has(l.id)) ? "completed" : needsReview ? "review-needed" : activity.some((row) => row.status !== "not_started") ? "active" : "not-started";
    const courseWeeks = weeks.filter((w) => w.course_id === course.id);
    const stateLabel = state === "completed" ? "Hoàn thành" : state === "review-needed" ? "Cần ôn lại" : state === "active" ? "Đang học" : "Chưa bắt đầu";
    return `<article class="wb-path-step ${state}" aria-label="${escapeHtml(course.title_vi)}">
      <div class="wb-path-marker" aria-hidden="true">${i + 1}</div>
      <div class="wb-path-body">
        <p class="wb-mint-eyebrow" style="margin-bottom:4px;">${escapeHtml(course.language_code.toUpperCase())}${course.level_ref ? ` · ${escapeHtml(course.level_ref)}` : ""} · ${courseWeeks.length} Tuần</p>
        <h2><a href="/courses/${escapeHtml(course.slug)}" data-learning-content>${escapeHtml(course.title_vi)}</a></h2>
        <p data-learning-content>${escapeHtml(course.summary_vi || "")}</p>
        <div class="wb-path-meta">
          <span class="wb-sc-mint-pill">${stateLabel}</span>
          ${p?.score_percent != null ? `<span class="wb-badge">Kết quả ${pct(p.score_percent)}%</span>` : ""}
          <a class="wb-btn wb-btn-outline wb-btn-sm" href="/courses/${escapeHtml(course.slug)}/curriculum">Mở lộ trình →</a>
        </div>
      </div>
    </article>`;
  }).join("");

  const startHref = user ? "/practice" : signInUrl("/learning/path", "learning.start");
  const contentHtml = `
    <section class="wb-mint-hero">
      <div class="wb-mint-hero-grid">
        <div class="wb-mint-hero-copy">
          <span class="wb-mint-eyebrow">LEARNING PATH</span>
          <h1>Lộ trình học tập</h1>
          <p>${user ? "Trang theo dõi và cá nhân hóa tiến độ học tập thực tế của bạn trên WORD BRIDGE." : "Trang theo dõi và cá nhân hóa tiến độ học tập của bạn trên WORD BRIDGE. Đăng nhập để lưu tiến độ."}</p>
        </div>
        <div class="wb-mint-hero-art">${renderLearningPathHeroArt()}</div>
      </div>
    </section>

    <section class="wb-lp-card">
      ${paths ? `<div class="wb-path">${paths}</div>` : `
      <div class="wb-lp-empty-hero">
        <div style="display:flex;justify-content:center;">${renderLearningPathEmptySvg()}</div>
        <div>
          <h2>Chưa có lộ trình đã phát hành</h2>
          <p>Hiện bạn chưa có lộ trình học tập nào. Hãy khám phá chương trình học để bắt đầu hành trình ngoại ngữ của mình.</p>
          <a href="${user ? "/learning" : startHref}" class="wb-btn wb-btn-primary">+ Tạo lộ trình mới</a>
        </div>
      </div>`}
    </section>

    <section class="wb-lp-card wb-next-action">
      <div class="wb-sc-card-head">
        <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg></div>
        <div>
          <h2>Bước tiếp theo</h2>
          <p>Hãy thiết lập lộ trình để bắt đầu học tập hiệu quả hơn.</p>
        </div>
      </div>
      <div class="wb-lp-steps-row">
        <div class="wb-lp-step-box">
          <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg></div>
          <div><strong>Xác định mục tiêu</strong><p>Chọn ngôn ngữ và mục tiêu học tập của bạn.</p></div>
        </div>
        <div class="wb-lp-step-arrow" aria-hidden="true">›</div>
        <div class="wb-lp-step-box">
          <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="8" x2="20" y2="8"/><circle cx="9" cy="8" r="2.2" fill="currentColor"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="15" cy="16" r="2.2" fill="currentColor"/></svg></div>
          <div><strong>Thiết lập lộ trình</strong><p>Hệ thống gợi ý chương trình phù hợp với trình độ và mục tiêu.</p></div>
        </div>
        <div class="wb-lp-step-arrow" aria-hidden="true">›</div>
        <div class="wb-lp-step-box">
          <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <div><strong>Bắt đầu học tập</strong><p>Theo dõi tiến độ, hoàn thành bài học và đạt mục tiêu.</p></div>
        </div>
      </div>
      <div style="text-align:center;">
        <a class="wb-btn wb-btn-primary wb-btn-lg" href="${startHref}">${user ? "Luyện kỹ năng từ lộ trình" : "Lập lộ trình học tập cá nhân"}</a>
      </div>
    </section>`;

  return htmlResponse(renderPublicPage({
    title: "Lộ trình học tập",
    currentPath: "/learning/path",
    breadcrumbs: [{ label: "Học tập", href: "/learning" }, { label: "Lộ trình học tập" }],
    user,
    contentHtml
  }));
}
__name(renderLearningPathPage, "renderLearningPathPage");

var SKILL_ICONS = Object.freeze({
  vocabulary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
  grammar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg>',
  listening: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/></svg>',
  speaking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>',
  pronunciation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  reading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
  writing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>'
});
var SKILL_COPY = Object.freeze({
  vocabulary: { topicSub: "Các chủ đề từ vựng đã phát hành trên hệ thống.", fcSub: "Ôn tập từ vựng theo ngữ cảnh", studioSub: "Luyện từ vựng theo chủ đề và cấp độ", knowSub: "Theo dõi tiến độ và vốn từ cá nhân" },
  grammar: { topicSub: "Các chủ đề ngữ pháp hiện có trên hệ thống.", fcSub: "Ôn tập nhanh kiến thức trọng tâm", studioSub: "Luyện tập chuyên sâu theo chủ đề", knowSub: "Theo dõi mức độ nắm vững và gợi ý ôn tập" },
  listening: { topicSub: "Các chủ đề luyện nghe hiện có trên hệ thống.", fcSub: "Ôn tập từ vựng theo ngữ cảnh nghe", studioSub: "Luyện nghe theo chủ đề và cấp độ", knowSub: "Theo dõi tiến độ và năng lực nghe" },
  speaking: { topicSub: "Các chủ đề luyện nói hiện có trên hệ thống.", fcSub: "Ôn tập từ vựng theo chủ đề nói", studioSub: "Luyện nói theo tình huống thực tế", knowSub: "Theo dõi tiến độ và năng lực nói" },
  pronunciation: { topicSub: "Danh sách bài học phát âm đã có trên hệ thống.", fcSub: "Ôn tập phiên âm trọng tâm", studioSub: "Luyện phát âm theo chủ đề và cấp độ", knowSub: "Theo dõi tiến độ và điểm phát âm" },
  reading: { topicSub: "Các chủ đề luyện đọc đã có trên hệ thống.", fcSub: "Ôn tập từ vựng theo ngữ cảnh đọc", studioSub: "Luyện đọc hiểu theo chủ đề và cấp độ", knowSub: "Theo dõi tiến độ và kết quả luyện đọc" },
  writing: { topicSub: "Các chủ đề luyện viết đã có trên hệ thống.", fcSub: "Ôn tập từ vựng theo chủ đề viết", studioSub: "Luyện viết theo chủ đề và cấp độ", knowSub: "Theo dõi tiến độ và kỹ năng viết" }
});
function renderSkillHeroArt(skill) {
  const waves = '<path d="M0 132 Q65 86 145 112 T340 94 L340 160 L0 160 Z" fill="#9bd8cc" fill-opacity="0.45"/><path d="M32 146 Q140 96 250 124 T340 112 L340 160 L32 160 Z" fill="#44aa9b" fill-opacity="0.4"/>';
  if (skill === "listening") {
    return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">${waves}
      <g stroke="#5ec9b6" stroke-width="5" stroke-linecap="round" opacity="0.65"><line x1="68" y1="62" x2="68" y2="86"/><line x1="82" y1="48" x2="82" y2="100"/><line x1="96" y1="36" x2="96" y2="112"/><line x1="110" y1="52" x2="110" y2="96"/><line x1="274" y1="52" x2="274" y2="96"/><line x1="288" y1="38" x2="288" y2="108"/><line x1="302" y1="58" x2="302" y2="88"/></g>
      <path d="M116 116 L246 98 L286 118 L156 138 Z" fill="#0d6f64"/><path d="M116 116 L156 138 L156 154 L116 132 Z" fill="#085049"/><path d="M156 138 L286 118 L286 134 L156 154 Z" fill="#eef9f7"/>
      <path d="M154 90 C154 34 246 34 246 90" stroke="#0d7a6c" stroke-width="11" stroke-linecap="round"/>
      <rect x="136" y="72" width="28" height="44" rx="14" fill="#179484"/><rect x="234" y="72" width="28" height="44" rx="14" fill="#46c2aa"/>
    </svg>`;
  }
  if (skill === "grammar") {
    return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">${waves}
      <ellipse cx="282" cy="24" rx="14" ry="6" transform="rotate(-22 282 24)" fill="#4cb58a"/><ellipse cx="308" cy="36" rx="13" ry="6" transform="rotate(12 308 36)" fill="#2e9973"/>
      <path d="M98 112 L236 94 L276 114 L138 134 Z" fill="#0d6960"/><path d="M98 112 L138 134 L138 152 L98 130 Z" fill="#084e47"/><path d="M138 134 L276 114 L276 132 L138 152 Z" fill="#ffffff"/>
      <path d="M114 78 L236 62 L274 82 L152 98 Z" fill="#169282"/><path d="M114 78 L152 98 L152 114 L114 94 Z" fill="#0d6e62"/><path d="M152 98 L274 82 L274 98 L152 114 Z" fill="#eff9f7"/>
      <rect x="164" y="102" width="11" height="36" rx="2" fill="#43b98e"/>
      <text x="150" y="84" fill="#ffffff" font-size="13" font-weight="800" transform="rotate(-7 150 84)">GRAMMAR</text>
    </svg>`;
  }
  if (skill === "speaking" || skill === "pronunciation") {
    const bubbleText = skill === "pronunciation" ? "/ə/" : "• • •";
    return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">${waves}
      <g stroke="#29a792" stroke-width="4.5" stroke-linecap="round" opacity="0.72"><line x1="78" y1="68" x2="78" y2="88"/><line x1="92" y1="54" x2="92" y2="102"/><line x1="106" y1="42" x2="106" y2="114"/><line x1="120" y1="58" x2="120" y2="98"/><line x1="134" y1="66" x2="134" y2="90"/></g>
      <rect x="218" y="20" width="70" height="38" rx="19" fill="#0f8d78"/><path d="M228 54 L216 66 L242 56 Z" fill="#0f8d78"/>
      <text x="253" y="45" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="800">${bubbleText}</text>
      <rect x="164" y="34" width="38" height="62" rx="19" fill="#148d7e"/><path d="M152 74 C152 104 214 104 214 74" stroke="#0d685e" stroke-width="5" stroke-linecap="round"/><line x1="183" y1="102" x2="183" y2="124" stroke="#0d685e" stroke-width="6"/><ellipse cx="183" cy="126" rx="24" ry="7" fill="#0b554d"/>
      <path d="M214 114 L304 102 L326 114 L236 128 Z" fill="#179484"/><path d="M236 128 L326 114 L326 128 L236 142 Z" fill="#ffffff"/>
    </svg>`;
  }
  if (skill === "writing") {
    return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">${waves}
      <g transform="translate(106,18)">
        <rect x="12" y="16" width="106" height="118" rx="14" fill="#ffffff" stroke="#8fd2c5" stroke-width="3"/>
        <path d="M28 16 V6 M48 16 V6 M68 16 V6 M88 16 V6 M104 16 V6" stroke="#138777" stroke-width="4" stroke-linecap="round"/>
        <path d="M30 46 H98 M30 64 H92 M30 82 H96 M30 100 H84" stroke="#cce7e2" stroke-width="4" stroke-linecap="round"/>
        <path d="M116 32 L138 44 L98 112 L78 118 L82 98 Z" fill="#0f8675"/>
      </g>
      <path d="M222 108 L308 98 L330 112 L244 124 Z" fill="#148b7c"/><path d="M244 124 L330 112 L330 126 L244 138 Z" fill="#ffffff"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 340 160" fill="none" aria-hidden="true">${waves}
    <g transform="translate(96,42)">
      <path d="M116 74 L210 62 L236 76 L142 90 Z" fill="#0d6960"/><path d="M142 90 L236 76 L236 90 L142 104 Z" fill="#eff9f7"/>
      <path d="M14 48 C50 22 96 26 122 50 C148 26 194 22 222 44 L198 92 C168 70 138 72 122 92 C106 72 72 70 38 92 Z" fill="#ffffff" stroke="#9ad6ca" stroke-width="2.4"/>
      <path d="M122 50 L122 92" stroke="#62bba9" stroke-width="2.5"/>
      <path d="M52 52 Q84 42 108 58 M54 66 Q86 56 108 72 M136 58 Q162 42 194 52 M136 72 Q162 56 190 66" stroke="#c8e7e1" stroke-width="2.8" stroke-linecap="round"/>
    </g>
  </svg>`;
}
function renderSkillCenterEmblem(skill) {
  if (skill === "listening") return '<svg viewBox="0 0 80 68" width="76" fill="none" aria-hidden="true"><path d="M16 40 A24 24 0 0 1 64 40" stroke="#0d8573" stroke-width="6" stroke-linecap="round"/><rect x="8" y="34" width="12" height="24" rx="6" fill="#2cc2a6"/><rect x="60" y="34" width="12" height="24" rx="6" fill="#2cc2a6"/><g stroke="#0e7d6c" stroke-width="3.2" stroke-linecap="round"><line x1="28" y1="38" x2="28" y2="50"/><line x1="34" y1="32" x2="34" y2="56"/><line x1="40" y1="26" x2="40" y2="62"/><line x1="46" y1="32" x2="46" y2="56"/><line x1="52" y1="38" x2="52" y2="50"/></g></svg>';
  if (skill === "speaking") return '<svg viewBox="0 0 80 68" width="76" fill="none" aria-hidden="true"><rect x="30" y="8" width="20" height="32" rx="10" fill="#23b399"/><path d="M22 30 C22 48 58 48 58 30" stroke="#0d7a6b" stroke-width="4" stroke-linecap="round"/><line x1="40" y1="45" x2="40" y2="58" stroke="#0d7a6b" stroke-width="4"/><line x1="28" y1="58" x2="52" y2="58" stroke="#0d7a6b" stroke-width="4" stroke-linecap="round"/><path d="M12 22 C8 28 8 36 12 42 M68 22 C72 28 72 36 68 42" stroke="#5cc9b6" stroke-width="3" stroke-linecap="round"/></svg>';
  if (skill === "writing") return '<svg viewBox="0 0 80 68" width="76" fill="none" aria-hidden="true"><rect x="14" y="10" width="42" height="50" rx="8" fill="#ffffff" stroke="#189885" stroke-width="3"/><path d="M22 24 H46 M22 34 H46 M22 44 H38" stroke="#8fd4c7" stroke-width="3" stroke-linecap="round"/><path d="M58 18 L68 26 L48 50 L39 52 L41 42 Z" fill="#138d7b"/></svg>';
  if (skill === "reading" || skill === "vocabulary") return '<svg viewBox="0 0 80 68" width="76" fill="none" aria-hidden="true"><path d="M8 22 C22 14 34 16 40 26 C46 16 58 14 72 22 L66 56 C54 48 44 50 40 56 C36 50 26 48 14 56 Z" fill="#ffffff" stroke="#148c7b" stroke-width="3"/><line x1="40" y1="26" x2="40" y2="56" stroke="#148c7b" stroke-width="2.5"/></svg>';
  if (skill === "pronunciation") return '<svg viewBox="0 0 80 64" width="78" fill="none" aria-hidden="true"><path d="M12 38 L58 30 L72 38 L26 48 Z" fill="#0d6d62"/><path d="M26 48 L72 38 L72 48 L26 58 Z" fill="#e8f7f4"/><path d="M16 24 L62 16 L74 24 L28 34 Z" fill="#199685"/><path d="M28 34 L74 24 L74 33 L28 43 Z" fill="#ffffff"/></svg>';
  return '<svg viewBox="0 0 80 68" width="76" fill="none" aria-hidden="true"><rect x="18" y="10" width="44" height="50" rx="8" fill="#ffffff" stroke="#148c7b" stroke-width="3"/><rect x="30" y="4" width="20" height="10" rx="4" fill="#148c7b"/><path d="M26 26 L30 30 L37 23 M26 38 L30 42 L37 35 M26 50 L30 54 L37 47" stroke="#199c88" stroke-width="2.6" stroke-linecap="round"/><path d="M42 27 H54 M42 39 H54 M42 51 H52" stroke="#9ad7cc" stroke-width="3" stroke-linecap="round"/></svg>';
}
function renderQuestionEmptySvg() {
  return '<svg viewBox="0 0 88 68" width="84" fill="none" aria-hidden="true"><rect x="10" y="16" width="52" height="40" rx="9" fill="#e6f7f3" stroke="#9ad7cc" stroke-width="2.4"/><path d="M20 28 H46 M20 36 H48 M20 44 H40" stroke="#6ec5b5" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="24" r="15" fill="#5ec2b0"/><text x="62" y="30" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="800">?</text></svg>';
}

async function renderSkillCenterPage({ db, user, skill = "" }) {
  const meta = Object.hasOwn(SKILLS, skill) && SKILLS[skill];
  if (!meta) return htmlResponse(renderPublicPage({ title: "Kỹ năng không tồn tại", currentPath: `/skills/${skill}`, user, contentHtml: '<section class="wb-alert wb-alert-error"><h1>Kỹ năng không tồn tại</h1><a href="/learning/skills">Xem Trung tâm kỹ năng</a></section>' }), 404);
  const dbSkill = skill === "pronunciation" ? "speaking" : skill;
  const exercises = await safeQueryAll(db, `SELECT id, slug, language_code, skill, title_vi, level_ref, topic, instructions_vi FROM wb_public_practice_exercises WHERE skill=? ORDER BY language_code, level_ref, title_vi`, [dbSkill]);
  const questions = await safeQueryAll(db, `SELECT id, language_code, skill, question_type, level_ref, topic, prompt_text, audio_asset_id, auto_gradable FROM wb_public_question_bank WHERE skill=? AND review_status='published' ORDER BY language_code, level_ref LIMIT 20`, [dbSkill]);
  const references = skill === "pronunciation" ? ((await db.prepare("SELECT headword,ipa_or_pinyin,stress_pattern,tone_pattern,language_code,slug FROM wb_public_dictionary_entries WHERE review_status='published' AND coalesce(ipa_or_pinyin,'') != '' ORDER BY language_code,headword LIMIT 12").all()).results || []) : [];
  const personal = user && skill !== "pronunciation" ? await db.prepare("SELECT count(*) count,max(submitted_at) latest FROM wb_public_practice_results WHERE account_id=? AND skill=?").bind(user.accountId, skill).first().catch(() => null) : null;
  const specialPron = skill === "pronunciation";
  const copy = SKILL_COPY[skill] || SKILL_COPY.vocabulary;

  const groupedTopics = [];
  const topicCounter = new Map();
  for (const ex of exercises) {
    const key = ex.topic || ex.title_vi || "Chủ đề luyện tập";
    if (!topicCounter.has(key)) {
      const entry = { topic: key, count: 0, level: ex.level_ref || "" };
      topicCounter.set(key, entry);
      groupedTopics.push(entry);
    }
    topicCounter.get(key).count += 1;
  }

  const skillStripHtml = `
    <nav class="wb-skill-strip" aria-label="Bảy kỹ năng">
      ${Object.entries(SKILLS).map(([key, item]) => `<a href="/skills/${key}" ${key === skill ? 'aria-current="page"' : ""}>${SKILL_ICONS[key] || ""}<span>${escapeHtml(item.vi)}</span></a>`).join("")}
    </nav>`;

  const questionsCardHtml = `
    <section class="wb-sc-card">
      <div class="wb-sc-card-head">
        <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg></div>
        <div>
          <h2>Câu hỏi luyện tập</h2>
          <p>${questions.length} câu hỏi đã phát hành cho skill mapping hiện tại.</p>
        </div>
      </div>
      ${questions.length ? `
        <div class="wb-evidence-chips">
          ${questions.slice(0, 12).map((q) => `<span>${escapeHtml(q.language_code.toUpperCase())} · ${escapeHtml(q.question_type)} · ${escapeHtml(q.level_ref)}</span>`).join("")}
        </div>
        <a href="${meta.route}" class="wb-sc-view-all">Làm bài trong Practice Studio →</a>` : `
        <div class="wb-sc-q-empty">
          ${renderQuestionEmptySvg()}
          <h3>Chưa có câu hỏi luyện tập</h3>
          <p>Hệ thống sẽ bổ sung câu hỏi trong thời gian tới.</p>
        </div>`}
    </section>`;

  let mainGridHtml = "";
  if (specialPron) {
    mainGridHtml = `
      <div class="wb-sc-grid-3">
        <section class="wb-sc-card wb-pronunciation-lab">
          <div class="wb-sc-card-head">
            <div class="wb-sc-card-ico">${SKILL_ICONS.listening}</div>
            <div>
              <h2>Nghe mẫu và ghi âm</h2>
              <p>Bản ghi của bạn có thể phát lại ngay trên thiết bị.</p>
            </div>
          </div>
          <a href="/dictionary" class="wb-pron-dict-link">
            <span style="display:inline-flex;align-items:center;gap:8px;">${SKILL_ICONS.pronunciation}<span>Mở Dictionary có IPA/Pinyin</span></span>
            <span aria-hidden="true">↗</span>
          </a>
          ${user ? `
            <div class="wb-pron-controls">
              <button class="wb-btn wb-btn-primary wb-btn-sm" type="button" data-wb-record-toggle>Ghi âm</button>
              <button class="wb-btn wb-btn-ghost wb-btn-sm" type="button" data-wb-record-retry>Ghi lại</button>
            </div>
            <div class="wb-pron-wave-stage">
              <div class="wb-pron-wave-row">
                <svg viewBox="0 0 46 28" width="44" fill="none" aria-hidden="true"><g stroke="#5ec7b5" stroke-width="3" stroke-linecap="round"><line x1="6" y1="10" x2="6" y2="18"/><line x1="14" y1="6" x2="14" y2="22"/><line x1="22" y1="3" x2="22" y2="25"/><line x1="30" y1="7" x2="30" y2="21"/><line x1="38" y1="11" x2="38" y2="17"/></g></svg>
                <div class="wb-pron-mic-circle" aria-hidden="true">${SKILL_ICONS.pronunciation}</div>
                <svg viewBox="0 0 46 28" width="44" fill="none" aria-hidden="true"><g stroke="#5ec7b5" stroke-width="3" stroke-linecap="round"><line x1="8" y1="11" x2="8" y2="17"/><line x1="16" y1="7" x2="16" y2="21"/><line x1="24" y1="3" x2="24" y2="25"/><line x1="32" y1="6" x2="32" y2="22"/><line x1="40" y1="10" x2="40" y2="18"/></g></svg>
              </div>
              <p data-wb-record-status class="wb-muted" role="status" style="margin:0;">Chưa ghi âm.</p>
              <audio id="wb-local-playback" controls hidden style="width:100%;margin-top:4px;"></audio>
            </div>` : `
            <div class="wb-pron-wave-stage">
              <div class="wb-pron-mic-circle" aria-hidden="true">${SKILL_ICONS.pronunciation}</div>
              <p class="wb-muted" style="margin:0;">Đăng nhập để ghi âm và đối chiếu giọng đọc của bạn.</p>
              <a class="wb-btn wb-btn-primary wb-btn-sm" href="${signInUrl("/skills/pronunciation", "pronunciation.record")}">Đăng nhập để ghi âm</a>
            </div>`}
          ${references.length ? `
            <details>
              <summary style="font-size:0.86rem;">Mẫu phiên âm IPA / Pinyin (${references.length} mục từ)</summary>
              <ul class="wb-pron-ref-list">
                ${references.map((r) => `<li><div><a href="/dictionary/${{ en: "english", zh: "chinese" }[r.language_code]}/${encodeURIComponent(r.slug)}" data-learning-content style="font-weight:700;">${escapeHtml(r.headword)}</a> <span class="wb-muted">${escapeHtml(r.ipa_or_pinyin)}</span></div><button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-lang="${escapeHtml(r.language_code)}" data-wb-tts="${escapeHtml(r.headword)}">Nghe mẫu</button></li>`).join("")}
              </ul>
            </details>` : ""}
        </section>

        <section class="wb-sc-card">
          <div class="wb-sc-card-head">
            <div class="wb-sc-card-ico">${SKILL_ICONS.reading}</div>
            <div>
              <h2>Nội dung đã phát hành</h2>
              <p>${escapeHtml(copy.topicSub)}</p>
            </div>
          </div>
          ${exercises.length ? `
            <div class="wb-sc-topic-list">
              ${exercises.slice(0, 5).map((e) => `<a href="${meta.route}" class="wb-sc-topic-row"><div class="wb-sc-topic-left">${SKILL_ICONS.pronunciation}<span class="wb-sc-topic-title" data-learning-content>${escapeHtml(e.title_vi)}</span></div><div class="wb-sc-topic-right"><span class="wb-sc-mint-pill">${escapeHtml(e.level_ref || e.language_code.toUpperCase())}</span><span>›</span></div></a>`).join("")}
            </div>
            <a href="${meta.route}" class="wb-sc-view-all">Xem tất cả nội dung →</a>` : `
            <div class="wb-sc-center-box">
              ${renderSkillCenterEmblem("pronunciation")}
              <h3>Mục này hiện chưa có bài tập</h3>
              <p>Nội dung đang được cập nhật.</p>
            </div>`}
        </section>

        ${questionsCardHtml}
      </div>`;
  } else {
    const featuredEx = exercises[0] || null;
    mainGridHtml = `
      <div class="wb-sc-grid-3">
        <section class="wb-sc-card">
          <div class="wb-sc-card-head">
            <div class="wb-sc-card-ico">${SKILL_ICONS[skill] || SKILL_ICONS.reading}</div>
            <div>
              <h2>Nội dung đã phát hành</h2>
              <p>${escapeHtml(copy.topicSub)}</p>
            </div>
          </div>
          ${groupedTopics.length ? `
            <div class="wb-sc-topic-list">
              ${groupedTopics.slice(0, 5).map((g) => `<a href="${meta.route}" class="wb-sc-topic-row"><div class="wb-sc-topic-left">${SKILL_ICONS[skill] || SKILL_ICONS.reading}<span class="wb-sc-topic-title">${escapeHtml(g.topic)}</span></div><div class="wb-sc-topic-right"><span class="wb-sc-mint-pill">${g.count} bài</span><span>›</span></div></a>`).join("")}
            </div>` : `
            <p class="wb-muted" style="margin:6px 0;">Chưa có chủ đề bài tập nào được xuất bản trong mục này.</p>`}
          <a href="${meta.route}" class="wb-sc-view-all">Xem tất cả nội dung →</a>
        </section>

        <section class="wb-sc-card">
          <div class="wb-sc-center-box">
            ${renderSkillCenterEmblem(skill)}
            ${featuredEx ? `
              <span class="wb-sc-mint-pill">${escapeHtml(featuredEx.language_code.toUpperCase())}${featuredEx.level_ref ? ` · ${escapeHtml(featuredEx.level_ref)}` : ""} · ${exercises.length} bài tập</span>
              <h3 data-learning-content>${escapeHtml(featuredEx.title_vi)}</h3>
              <p data-learning-content>${escapeHtml(featuredEx.instructions_vi || "Mở Practice Studio để bắt đầu luyện tập bài này.")}</p>
              <a href="${meta.route}" class="wb-btn wb-btn-primary wb-btn-sm" style="margin-top:6px;">Mở studio luyện tập →</a>
            ` : `
              <h3>Mục này hiện chưa có bài tập</h3>
              <p>Nội dung đang được cập nhật. Vui lòng quay lại sau.</p>
            `}
            ${personal?.count ? `<div class="wb-muted" style="font-size:0.8rem;margin-top:8px;">Hoạt động gần đây: <strong>${Number(personal.count)}</strong> lượt · <a href="/practice/history">Practice Insights</a></div>` : ""}
          </div>
        </section>

        ${questionsCardHtml}
      </div>`;
  }

  const contentHtml = `
    <section class="wb-mint-hero wb-skill-intro">
      <div class="wb-mint-hero-grid">
        <div class="wb-mint-hero-copy">
          <span class="wb-mint-eyebrow">SKILL CENTER · ${escapeHtml(meta.en.toUpperCase())}</span>
          <h1>${escapeHtml(meta.vi)}</h1>
          <p>${specialPron ? "Nghe mẫu, xem phiên âm rồi ghi lại giọng đọc của bạn để đối chiếu." : "Khám phá nội dung đã phát hành và chuyển sang studio luyện tập phù hợp với kỹ năng này."}</p>
        </div>
        <div class="wb-mint-hero-art">${renderSkillHeroArt(skill)}</div>
      </div>
      ${skillStripHtml}
    </section>

    ${mainGridHtml}

    <section class="wb-sc-bottom-bar wb-next-action">
      <div class="wb-sc-bottom-intro">
        <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <div>
          <h2>Luyện tập</h2>
          <p>Chọn hình thức luyện tập phù hợp với mục tiêu của bạn.</p>
        </div>
      </div>
      <div class="wb-sc-bottom-actions">
        ${specialPron ? "" : `
        <a class="wb-sc-cta-tile" href="${skill === "vocabulary" ? "/vocabulary/flashcards" : "/flashcards/" + skill}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="4" width="14" height="16" rx="2"/><path d="M8 2h10a2 2 0 0 1 2 2v14"/></svg>
          <div><strong>Mở Flashcard</strong><span>${escapeHtml(copy.fcSub)}</span></div>
        </a>`}
        <a class="wb-sc-cta-tile primary" href="${meta.route}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="12" rx="2"/><polygon points="10 8 15 10 10 12 10 8" fill="currentColor"/><line x1="8" y1="20" x2="16" y2="20"/></svg>
          <div><strong>Đi tới Practice Studio</strong><span>${escapeHtml(copy.studioSub)}</span></div>
        </a>
        <a class="wb-sc-cta-tile" href="/my-knowledge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <div><strong>Xem kiến thức cá nhân</strong><span>${escapeHtml(copy.knowSub)}</span></div>
        </a>
      </div>
    </section>`;

  return htmlResponse(renderPublicPage({
    title: `${meta.vi} — Skill Center`,
    currentPath: `/skills/${skill}`,
    breadcrumbs: [{ label: "Học tập", href: "/learning" }, { label: "Kỹ năng", href: "/learning/skills" }, { label: meta.vi }],
    user,
    contentHtml
  }));
}
__name(renderSkillCenterPage, "renderSkillCenterPage");
async function renderKnowledgePage({ db, user }) {
  if (!user) return redirectResponse(signInUrl("/my-knowledge", "knowledge.view"));
  const [notebookRes, progressRes, practiceRes] = await Promise.all([
    db.prepare(`SELECT n.*, d.headword, d.meaning_vi, d.language_code, d.part_of_speech FROM wb_public_vocabulary_notebook n JOIN wb_public_dictionary_entries d ON d.id=n.entry_id WHERE n.account_id=? ORDER BY n.next_review_at ASC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT p.*, l.title_vi, l.language_code, l.level_ref FROM wb_public_learner_progress p LEFT JOIN wb_public_lessons l ON l.id=p.lesson_id WHERE p.account_id=? ORDER BY p.updated_at DESC LIMIT 100`).bind(user.accountId).all(),
    db.prepare(`SELECT skill, score, max_score, grading_status, submitted_at FROM wb_public_practice_results WHERE account_id=? ORDER BY submitted_at DESC LIMIT 100`).bind(user.accountId).all()
  ]);
  const notebook = notebookRes.results || [], progress = progressRes.results || [], practice = practiceRes.results || [];
  const due = notebook.filter((n) => new Date(n.next_review_at).getTime() <= Date.now()).length;
  const mastered = notebook.filter((n) => n.mastery_status === "mastered" && n.repetitions >= 4).length;
  const completed = progress.filter((p) => p.status === "completed").length;
  const skillStats = Object.keys(SKILLS).filter((s) => s !== "pronunciation").map((skill) => {
    const rows = practice.filter((r) => r.skill === skill && r.grading_status === "auto_graded" && Number(r.max_score) > 0 && r.score != null);
    const avg = rows.length ? Math.round(rows.reduce((n, r) => n + Number(r.score) / Number(r.max_score) * 100, 0) / rows.length) : null;
    return { skill, avg, count: rows.length };
  });
  const contentHtml = `<section class="wb-learning-landing"><p class="wb-eyebrow">MY KNOWLEDGE · EVIDENCE ONLY</p><h1>My Knowledge</h1><p>Bản đồ dưới đây chỉ tổng hợp evidence đã lưu; chiều nào chưa đo được sẽ không được suy đoán.</p></section>
    <div class="wb-metric-row"><div><strong>${notebook.length}</strong><span>Mục từ đang học</span></div><div><strong>${mastered}</strong><span>Mastered theo notebook</span></div><div><strong>${due}</strong><span>Review due</span></div><div><strong>${completed}</strong><span>Bài học hoàn thành</span></div></div>
    <section><h2>Receptive / productive evidence</h2><div class="wb-skill-meter-list">${skillStats.map((s) => `<article><div><strong>${escapeHtml(SKILLS[s.skill].vi)}</strong><span>${s.count ? `${s.count} lượt có điểm` : "Chưa có evidence"}</span></div><div class="wb-progress" aria-label="${s.avg == null ? "Chưa đo" : `${s.avg}%`}"><span style="width:${s.avg ?? 0}%"></span></div><strong>${s.avg == null ? "—" : `${s.avg}%`}</strong></article>`).join("")}</div></section>
    <section><h2>Knowledge objects gần đây</h2>${notebook.length ? `<div class="wb-knowledge-list">${notebook.slice(0, 30).map((n) => `<article><div><p class="wb-eyebrow">${escapeHtml(n.language_code.toUpperCase())} · ${escapeHtml(n.part_of_speech || "")}</p><h3 data-learning-content>${escapeHtml(n.headword)}</h3><p data-learning-content>${escapeHtml(n.meaning_vi)}</p></div><div><span class="wb-badge">${memoryState(n)}</span><p class="wb-muted"><span>Ngày ôn tiếp theo</span> <time>${escapeHtml(n.next_review_at)}</time></p></div></article>`).join("")}</div>` : '<div class="wb-empty-state"><h3>Chưa có knowledge evidence</h3><p>Lưu một mục từ từ Dictionary hoặc hoàn thành một bài học để bắt đầu tạo evidence.</p><a class="wb-btn wb-btn-primary" href="/dictionary">Mở Dictionary</a></div>'}</section>
    <section class="wb-next-action"><h2>Next meaningful action</h2>${due ? '<a href="/vocabulary/review" class="wb-btn wb-btn-primary">Ôn các mục đến hạn</a>' : '<a href="/practice" class="wb-btn wb-btn-primary">Luyện kỹ năng</a>'}<a href="/my-mistakes" class="wb-btn wb-btn-outline">Xem My Mistakes</a></section>`;
  return htmlResponse(renderPublicPage({ title: "My Knowledge", currentPath: "/my-knowledge", breadcrumbs: [{ label: "Học", href: "/learning" }, { label: "My Knowledge" }], user, contentHtml }));
}
__name(renderKnowledgePage, "renderKnowledgePage");
async function renderMistakesPage({ db, user }) {
  if (!user) return redirectResponse(signInUrl("/my-mistakes", "mistakes.view"));
  const [practiceRes, lessonRes, intelRes] = await Promise.all([
    db.prepare(`SELECT r.id, r.skill, r.answers_json, r.feedback_json, r.score, r.max_score, r.grading_status, r.submitted_at, e.title_vi FROM wb_public_practice_results r LEFT JOIN wb_public_practice_exercises e ON e.id=r.exercise_id WHERE r.account_id=? ORDER BY r.submitted_at DESC,r.result_order DESC LIMIT 100`).bind(user.accountId).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT s.id, s.breakdown_json, s.submitted_at, l.title_vi FROM wb_public_lesson_submissions s JOIN wb_public_lessons l ON l.id=s.lesson_id WHERE s.account_id=? ORDER BY s.submitted_at DESC LIMIT 100`).bind(user.accountId).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT id, output_json, methodology_note, confidence_level, technical_limits, created_at FROM wb_public_intelligence_runs WHERE account_id=? AND system_slug='language-error-genome' ORDER BY created_at DESC LIMIT 20`).bind(user.accountId).all().catch(() => ({ results: [] }))
  ]);
  const mistakes = [];
  for (const row of lessonRes.results || []) {
    const breakdown = safeJson2(row.breakdown_json, []);
    for (const item of Array.isArray(breakdown) ? breakdown : []) if (item && item.correct === false) mistakes.push({ source: row.title_vi || "Lesson", skill: "lesson", prompt: item.prompt || "", expected: item.expected || "", given: item.given || "", explanation: item.explanationVi || "", at: row.submitted_at, lifecycle: "Detected" });
  }
  const latestGrade = /* @__PURE__ */ new Map();
  for (const row of practiceRes.results || []) {
    const feedback = safeJson2(row.feedback_json, {});
    const details = Array.isArray(feedback) ? feedback : Array.isArray(feedback?.breakdown) ? feedback.breakdown : Array.isArray(feedback?.items) ? feedback.items : [];
    for (const item of details) {
      if (!item || typeof (item.correct ?? item.isCorrect) !== "boolean") continue;
      if (item.questionId && !latestGrade.has(item.questionId)) latestGrade.set(item.questionId, item.correct ?? item.isCorrect);
      if (item.correct === false || item.isCorrect === false) mistakes.push({ source: row.title_vi || "Practice", skill: row.skill, prompt: item.prompt || item.question || "", expected: item.expected || item.correctAnswer || "", given: item.given || item.answer || safeJson2(row.answers_json, {})[item.questionId] || "", explanation: item.explanation || item.explanationVi || "", at: row.submitted_at, lifecycle: latestGrade.get(item.questionId) === true ? "Correct on retest" : "Detected" });
    }
  }
  mistakes.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const patterns = (intelRes.results || []).map((r) => ({ ...r, output: safeJson2(r.output_json, {}) }));

  const mistakesHeroArt = `<svg viewBox="0 0 320 150" fill="none" aria-hidden="true">
    <path d="M0 128 Q80 78 170 108 T320 92 L320 150 L0 150 Z" fill="#9cd8cd" fill-opacity="0.45"/>
    <path d="M196 106 L288 94 L310 108 L218 122 Z" fill="#0d6960"/><path d="M218 122 L310 108 L310 122 L218 136 Z" fill="#ffffff"/>
    <rect x="116" y="14" width="112" height="114" rx="14" fill="#ffffff" stroke="#8fd2c5" stroke-width="2.8"/>
    <rect x="134" y="34" width="18" height="18" rx="4" stroke="#0f8373" stroke-width="2.2"/><path d="M138 43 l3 3 6-6" stroke="#0f8373" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="134" y="62" width="18" height="18" rx="4" stroke="#d97706" stroke-width="2.2"/><path d="M139 67 l8 8 M147 67 l-8 8" stroke="#d97706" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="134" y="90" width="18" height="18" rx="4" stroke="#9ad4ca" stroke-width="2.2"/>
    <path d="M162 43 H210 M162 71 H206 M162 99 H196" stroke="#cde7e2" stroke-width="4" stroke-linecap="round"/>
    <circle cx="198" cy="86" r="24" fill="#e6f7f4" fill-opacity="0.7" stroke="#0d7a6b" stroke-width="4.5"/>
    <line x1="216" y1="104" x2="236" y2="126" stroke="#0d7a6b" stroke-width="6.5" stroke-linecap="round"/>
  </svg>`;

  const contentHtml = `
    <section class="wb-mint-hero wb-learning-landing">
      <div class="wb-mint-hero-grid">
        <div class="wb-mint-hero-copy">
          <span class="wb-mint-eyebrow">MY MISTAKES · EVIDENCE LIFECYCLE</span>
          <h1>My Mistakes</h1>
          <p>Detected → Understood → Practising → Retested → Resolved. Hệ thống chỉ ghi nhận các lỗi đã phát hiện và phân tích được lưu từ quá trình luyện tập thực tế của bạn.</p>
        </div>
        <div class="wb-mint-hero-art">${mistakesHeroArt}</div>
      </div>
      <div class="wb-lifecycle-strip" aria-label="Vòng đời khắc phục lỗi">
        <div class="wb-lifecycle-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div><strong>Detected</strong><span>Phát hiện</span></div></div>
        <span class="wb-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="wb-lifecycle-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg><div><strong>Understood</strong><span>Hiểu nguyên nhân</span></div></div>
        <span class="wb-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="wb-lifecycle-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11v11h-11z"/><path d="M3 12h3.5M17.5 12H21"/></svg><div><strong>Practising</strong><span>Luyện tập</span></div></div>
        <span class="wb-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="wb-lifecycle-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg><div><strong>Retested</strong><span>Kiểm tra lại</span></div></div>
        <span class="wb-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="wb-lifecycle-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg><div><strong>Resolved</strong><span>Đã khắc phục</span></div></div>
      </div>
    </section>

    <div class="wb-mistakes-grid">
      <section class="wb-sc-card">
        ${mistakes.length ? `
          <div class="wb-sc-card-head">
            <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg></div>
            <div><h2>Danh sách lỗi đã ghi nhận (${mistakes.length})</h2><p>Ôn tập trực tiếp các câu chưa chính xác để củng cố kiến thức.</p></div>
          </div>
          <div class="wb-mistake-inbox">
            ${mistakes.slice(0, 50).map((m) => `
              <article class="wb-mistake-item">
                <div style="min-width:0;flex:1;">
                  <span class="wb-mint-eyebrow" style="margin-bottom:4px;">${escapeHtml(m.skill.toUpperCase())} · ${escapeHtml(m.at || "")}</span>
                  <h3 style="margin:0 0 4px;font-size:1rem;">${escapeHtml(m.source)}</h3>
                  <p style="margin:0 0 6px;">${escapeHtml(m.prompt)}</p>
                  ${m.given ? `<p style="margin:0 0 4px;font-size:0.86rem;"><strong>Đã trả lời:</strong> ${escapeHtml(m.given)}</p>` : ""}
                  ${m.expected ? `<p style="margin:0 0 4px;font-size:0.86rem;"><strong>Đáp án chuẩn:</strong> ${escapeHtml(m.expected)}</p>` : ""}
                  ${m.explanation ? `<p class="wb-muted" style="margin:0;font-size:0.84rem;">${escapeHtml(m.explanation)}</p>` : ""}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                  <span class="wb-badge wb-badge-red">${escapeHtml(m.lifecycle)}</span>
                  <a href="/practice/${m.skill === "lesson" ? "" : escapeHtml(m.skill)}" class="wb-btn wb-btn-outline wb-btn-sm">Luyện lại</a>
                </div>
              </article>`).join("")}
          </div>` : `
          <div class="wb-vocab-empty-split" style="padding:10px 4px;">
            <div>
              <div class="wb-sc-card-head" style="margin-bottom:10px;">
                <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
                <div><h2>Chưa có lỗi được ghi nhận</h2></div>
              </div>
              <p class="wb-muted" style="margin:0 0 18px;">Hoàn thành một bài luyện tập để xem lại câu trả lời, phân tích lỗi và gợi ý cải thiện.</p>
              <a href="/practice" class="wb-btn wb-btn-primary">▶ Mở Practice</a>
            </div>
            <div style="text-align:center;" aria-hidden="true">
              <svg viewBox="0 0 210 130" width="195" fill="none">
                <rect x="24" y="16" width="126" height="82" rx="10" fill="#ffffff" stroke="#146466" stroke-width="3"/>
                <path d="M8 100 H168 L160 112 H16 Z" fill="#146466"/>
                <path d="M44 40 H94 M44 54 H86 M44 68 H78" stroke="#c3e5e0" stroke-width="4" stroke-linecap="round"/>
                <circle cx="118" cy="54" r="18" fill="#199684"/><polyline points="110 54 116 60 127 48" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M126 96 L186 88 L200 98 L140 108 Z" fill="#189886"/><path d="M140 108 L200 98 L200 108 L140 118 Z" fill="#eaf8f6"/>
              </svg>
            </div>
          </div>`}
      </section>

      <section class="wb-sc-card">
        <div class="wb-sc-card-head">
          <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 3 8 12 13 21 8 12 3"/><polyline points="3 13 12 18 21 13"/><polyline points="3 17 12 22 21 17"/></svg></div>
          <div>
            <h2>Pattern evidence</h2>
            <p>Tổng hợp các mẫu lỗi thường gặp trong quá trình luyện tập.</p>
          </div>
        </div>
        ${patterns.length ? `
          <div class="wb-activity-list">
            ${patterns.map((p) => `<div style="padding:10px 0;border-bottom:1px solid var(--wb-border);"><span class="wb-mint-eyebrow">${escapeHtml(p.confidence_level)} · ${escapeHtml(p.created_at)}</span><strong style="display:block;margin-bottom:4px;">Language Error Genome</strong><p style="margin:0 0 4px;font-size:0.86rem;">${escapeHtml(p.methodology_note || "")}</p><p class="wb-muted" style="margin:0;font-size:0.8rem;">${escapeHtml(p.technical_limits || "")}</p></div>`).join("")}
          </div>` : `
          <div class="wb-alert wb-alert-info" style="margin:4px 0 0;">
            ⓘ Hãy luyện tập thêm để theo dõi các lỗi thường gặp.
          </div>`}
      </section>
    </div>

    <section class="wb-sc-bottom-bar wb-next-action">
      <div class="wb-sc-bottom-intro">
        <div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <div>
          <h2>Luyện tập</h2>
          <p>Rèn lại kỹ năng và khắc phục các lỗi đã ghi nhận.</p>
        </div>
      </div>
      <div class="wb-sc-bottom-actions">
        <a href="/practice" class="wb-sc-cta-tile primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="12" rx="2"/><polygon points="10 8 15 10 10 12 10 8" fill="currentColor"/><line x1="8" y1="20" x2="16" y2="20"/></svg>
          <div><strong>Luyện lại theo kỹ năng</strong><span>Tập trung vào kỹ năng cần củng cố</span></div>
        </a>
        <a href="/vocabulary/review" class="wb-sc-cta-tile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>
          <div><strong>Ôn kiến thức</strong><span>Xem lại nội dung liên quan đến lỗi</span></div>
        </a>
      </div>
    </section>`;
  return htmlResponse(renderPublicPage({ title: "My Mistakes", currentPath: "/my-mistakes", breadcrumbs: [{ label: "Luyện tập", href: "/practice" }, { label: "My Mistakes" }], user, contentHtml }));
}
__name(renderMistakesPage, "renderMistakesPage");
function renderSkillCenterHub({ user }) {
  const skills = [
    ["vocabulary", "Từ vựng", "Mở rộng, ghi nhớ và vận dụng từ vựng theo chủ đề, ngữ cảnh.", "/skills/vocabulary"],
    ["grammar", "Ngữ pháp", "Nắm vững cấu trúc, quy tắc và cách sử dụng trong thực tế.", "/skills/grammar"],
    ["listening", "Nghe", "Luyện nghe hiểu qua hội thoại, đoạn văn và tình huống thực tế.", "/skills/listening"],
    ["speaking", "Nói", "Luyện phản xạ, diễn đạt tự nhiên và giao tiếp tự tin.", "/skills/speaking"],
    ["pronunciation", "Phát âm", "Luyện phát âm chuẩn, cải thiện ngữ điệu và độ lưu loát.", "/skills/pronunciation"],
    ["reading", "Đọc", "Rèn luyện kỹ năng đọc hiểu, phân tích và nắm ý chính.", "/skills/reading"],
    ["writing", "Viết", "Phát triển kỹ năng viết rõ ràng, logic và đúng ngữ pháp.", "/skills/writing"]
  ];
  const contentHtml = `
    <span class="wb-badge" style="background:#e6f5f5;color:#146466;">SKILL CENTER · 7 SYSTEMS</span>
    <h1 style="margin:8px 0 6px;font-size:2rem;color:#0f172a;">Trung tâm kỹ năng</h1>
    <p class="wb-muted" style="margin:0 0 18px;">Mỗi kỹ năng có luồng luyện tập và bộ thẻ riêng. Nội dung luyện tập chỉ xuất hiện khi nguồn có bài tập hoặc dữ liệu đã kiểm duyệt.</p>
    <div class="wb-skill-layout">
      <aside class="wb-skill-sidebar" aria-label="Danh sách 7 kỹ năng">
        ${skills.map(([slug, name, _d, href], i) => `<a href="${href}" class="wb-skill-side-item${i === 0 ? " active" : ""}"><span class="wb-soft-icon" style="width:34px;height:34px;" aria-hidden="true">●</span><div><strong style="display:block;font-size:0.94rem;">${escapeHtml(name)}</strong><span class="wb-muted" style="font-size:0.78rem;">Xem workflow →</span></div></a>`).join("")}
      </aside>
      <div>
        <div class="wb-skill-cards-grid">
          ${skills.map(([slug, name, desc, href]) => `
            <article class="wb-skill-card">
              <div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <span class="wb-soft-icon" aria-hidden="true">◆</span>
                  <h2 style="margin:0;font-size:1.15rem;color:#0f172a;">${escapeHtml(name)}</h2>
                </div>
                <p class="wb-muted" style="margin:0;font-size:0.9rem;">${escapeHtml(desc)}</p>
              </div>
              <a href="${href}" class="wb-btn wb-btn-outline wb-btn-sm wb-btn-pill">Bắt đầu luyện tập →</a>
            </article>`).join("")}
        </div>
        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;">
          <h3 style="margin:0 0 10px;color:#0f172a;">Practice &amp; review</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="/practice" class="wb-btn wb-btn-primary">Mở Practice Center</a>
            <a href="/vocabulary/flashcards" class="wb-btn wb-btn-outline">Ôn tập Flashcards</a>
            <a href="/my-mistakes" class="wb-btn wb-btn-outline">Phân tích lỗi (My Mistakes)</a>
          </div>
        </div>
      </div>
    </div>`;
  return htmlResponse(renderPublicPage({
    title: "Trung tâm kỹ năng",
    currentPath: "/learning/skills",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Học tập", href: "/learning" }, { label: "Kỹ năng" }],
    user,
    contentHtml
  }));
}
__name(renderSkillCenterHub, "renderSkillCenterHub");

// src/pages/dictionary-pages.js
function safeJsonArray(raw) {
  try {
    const parsed = safeJsonParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
__name(safeJsonArray, "safeJsonArray");
async function renderDictionaryPage({ services, user, url, languageSlug = "" }) {
  const q = (url.searchParams.get("q") || "").trim();
  const level = (url.searchParams.get("level") || "").trim();
  const domain = (url.searchParams.get("domain") || "").trim();
  const locale = url.searchParams.get("locale") || "";
  const langCode = languageSlug ? normalizeLanguageCode(languageSlug) : url.searchParams.get("language") || "";
  if (!user && (q || level || domain)) {
    const returnPath = `${url.pathname}${url.search}`;
    return redirectResponse(signInUrl(returnPath, "dictionary.search", locale));
  }
  if (languageSlug && !langCode) {
    return htmlResponse(renderPublicPage({
      title: "Từ điển không hỗ trợ",
      currentPath: `/dictionary/${languageSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">WORD BRIDGE chỉ hỗ trợ từ điển Tiếng Trung, Tiếng Anh.</div>'
    }), 404);
  }
  let res = { entries: [], total: 0 };
  try {
    res = await services.dictionary.search({ q, language: langCode, level, domain, limit: 36 });
  } catch {
    res = { entries: [], total: 0 };
  }
  const langLabel = langCode ? OFFICIAL_LANGUAGES[langCode]?.nameVi : "Đa ngôn ngữ (Trung – Anh)";
  const currentPath = languageSlug ? `/dictionary/${languageSlug}` : "/dictionary";
  const contentHtml = `
    <h1>Từ điển ${escapeHtml(langLabel)}</h1>
    <p class="wb-muted">Dictionary = tra cứu · My Vocabulary = dữ liệu cá nhân · Flashcard = phương pháp luyện · Review = lịch ôn SRS.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả</a>
      <a href="/dictionary/chinese" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Trung (zh)</a>
      <a href="/dictionary/english" class="wb-btn wb-btn-outline wb-btn-sm">Tiếng Anh (en)</a>
      <a href="/vocabulary/notebook" class="wb-btn wb-btn-primary wb-btn-sm">Sổ từ vựng cá nhân</a>
      <a href="/vocabulary/sets" class="wb-btn wb-btn-ghost wb-btn-sm">Bộ từ vựng</a>
      <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost wb-btn-sm">Flashcard</a>
      <a href="/vocabulary/review" class="wb-btn wb-btn-ghost wb-btn-sm">Ôn tập SRS</a>
    </div>

    <form method="GET" action="${escapeHtml(currentPath)}" class="wb-card" ${user ? "" : 'data-auth-intent="dictionary.search"'} style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input class="wb-input" style="flex:1;min-width:220px;" name="q" value="${escapeHtml(q)}" placeholder="Tìm theo từ gốc, Pinyin/IPA, nghĩa tiếng Việt, ví dụ..." />
      <input class="wb-input" style="width:160px;" name="level" value="${escapeHtml(level)}" placeholder="Trình độ (HSK 1, A1...)" />
      <button type="submit" class="wb-btn wb-btn-primary">Tra cứu</button>
    </form>

    <p class="wb-muted">Hiển thị ${res.entries.length} / ${res.total} mục từ công bố.</p>
    <div class="wb-grid-3">
      ${res.entries.map((e) => {
    const entryHref = `/dictionary/${OFFICIAL_LANGUAGES[e.language_code].slug}/${e.slug}`;
    return `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <span class="wb-badge">${escapeHtml(e.language_code.toUpperCase())} · ${escapeHtml(e.level_ref)}</span>
            ${e.specialized_domain ? `<span class="wb-badge wb-badge-ok">${escapeHtml(e.specialized_domain)}</span>` : ""}
          </div>
          <h3 style="margin:10px 0 4px;"><a href="${escapeHtml(entryHref)}" data-learning-content>${escapeHtml(e.headword)}</a></h3>
          <div style="margin-bottom:6px;"><span class="wb-phonetic">${escapeHtml(e.phonetic)}</span> <span class="wb-muted" style="font-size:0.84rem;">${escapeHtml(e.part_of_speech)}</span></div>
          <p style="margin:0 0 12px;" data-learning-content>${escapeHtml(e.meaning_vi)}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="${escapeHtml(entryHref)}" class="wb-btn wb-btn-outline wb-btn-sm">Chi tiết mục từ</a>
            ${user ? `<button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-save-vocab="${escapeHtml(e.id)}">+ Lưu sổ từ</button>
                 <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${escapeHtml(e.headword)}" data-wb-lang="${escapeHtml(e.language_code)}">Nghe phát âm</button>` : `<a href="${escapeHtml(signInUrl(entryHref, "dictionary.save"))}" class="wb-btn wb-btn-ghost wb-btn-sm">Đăng nhập để lưu</a>`}
          </div>
        </article>`;
  }).join("") || '<div class="wb-alert wb-alert-info">Không tìm thấy mục từ phù hợp với từ khóa.</div>'}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: `Từ điển ${langLabel}`,
    currentPath,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Từ điển", href: "/dictionary" }, ...languageSlug ? [{ label: langLabel }] : []],
    user,
    contentHtml
  }));
}
__name(renderDictionaryPage, "renderDictionaryPage");
async function renderDictionaryEntryPage({ services, user, languageSlug, entrySlug }) {
  const entry = await services.dictionary.getEntry(languageSlug, entrySlug);
  if (!entry) {
    return htmlResponse(renderPublicPage({
      title: "Không tìm thấy mục từ",
      currentPath: `/dictionary/${languageSlug}/${entrySlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">Mục từ không tồn tại trong kho từ điển đã công bố.</div>'
    }), 404);
  }
  const examples = safeJsonArray(entry.examples_json);
  const collocations = safeJsonArray(entry.collocations_json);
  const synonyms = safeJsonArray(entry.synonyms_json);
  const antonyms = safeJsonArray(entry.antonyms_json);
  const lang = OFFICIAL_LANGUAGES[entry.language_code];
  const entryPath = `/dictionary/${lang.slug}/${entry.slug}`;
  const contentHtml = `
    <div class="wb-card">
      <span class="wb-badge">${escapeHtml(lang.nameVi)} · ${escapeHtml(entry.level_ref)} · ${escapeHtml(entry.part_of_speech)}</span>
      ${entry.specialized_domain ? `<span class="wb-badge wb-badge-ok" style="margin-left:6px;">${escapeHtml(entry.specialized_domain)}</span>` : ""}
      <div class="wb-headword" style="margin-top:10px;" data-learning-content>${escapeHtml(entry.headword)}</div>
      <div style="margin:8px 0 14px;">
        <span class="wb-phonetic">${escapeHtml(entry.phonetic)}</span>
        ${entry.ipa_or_pinyin && entry.ipa_or_pinyin !== entry.phonetic ? `<span class="wb-badge" style="margin-left:6px;">IPA/Pinyin: ${escapeHtml(entry.ipa_or_pinyin)}</span>` : ""}
        ${entry.tone_pattern ? `<span class="wb-badge" style="margin-left:6px;">Thanh điệu: ${escapeHtml(entry.tone_pattern)}</span>` : ""}
        ${entry.stress_pattern ? `<span class="wb-badge" style="margin-left:6px;">Trọng âm: ${escapeHtml(entry.stress_pattern)}</span>` : ""}
        ${entry.noun_gender ? `<span class="wb-badge" style="margin-left:6px;">Giống: ${escapeHtml(entry.noun_gender)}</span>` : ""}
      </div>
      <p><strong>Nghĩa tiếng Việt:</strong> <span data-learning-content>${escapeHtml(entry.meaning_vi)}</span></p>
      <p><strong>Định nghĩa ngôn ngữ đích:</strong> <span data-learning-content>${escapeHtml(entry.target_definition)}</span></p>
      ${entry.radicals_or_structure ? `<p><strong>Cấu tạo chữ / Bộ thủ:</strong> ${escapeHtml(entry.radicals_or_structure)}</p>` : ""}
      ${collocations.length ? `<p><strong>Collocations:</strong> ${collocations.map((c) => `<span class="wb-badge" style="margin:2px;">${escapeHtml(typeof c === "string" ? c : c.text || "")}</span>`).join("")}</p>` : ""}
      ${synonyms.length ? `<p><strong>Từ đồng nghĩa:</strong> ${escapeHtml(synonyms.join(", "))}</p>` : ""}
      ${antonyms.length ? `<p><strong>Từ trái nghĩa:</strong> ${escapeHtml(antonyms.join(", "))}</p>` : ""}
      ${examples.length ? `<h3>Ví dụ ứng dụng</h3><ul>${examples.map((ex) => `<li><strong data-learning-content>${escapeHtml(ex.text || ex)}</strong>${ex.vi ? ` — ${escapeHtml(ex.vi)}` : ""}</li>`).join("")}</ul>` : ""}
      <p class="wb-muted" style="font-size:0.84rem;margin-top:14px;">Nguồn bản quyền: ${escapeHtml(entry.source_name || "WORD BRIDGE")} (${escapeHtml(entry.license_terms || "Original")}) · Phiên bản ${escapeHtml(entry.data_version || "4.0.0")}</p>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        ${user ? `<button type="button" class="wb-btn wb-btn-primary" data-save-vocab="${escapeHtml(entry.id)}">Lưu vào Sổ từ vựng cá nhân</button>
             ${entry.audio_asset_id ? `<audio controls preload="none" src="/api/v1/audio/${escapeHtml(entry.audio_asset_id)}/stream"></audio>` : ""}
             <button type="button" class="wb-btn wb-btn-outline" data-wb-tts="${escapeHtml(entry.headword)}" data-wb-lang="${escapeHtml(entry.language_code)}">Nghe phát âm</button>
             <a href="/vocabulary/flashcards" class="wb-btn wb-btn-ghost">Mở Flashcard</a>` : `<a href="${escapeHtml(signInUrl(entryPath, "dictionary.study"))}" class="wb-btn wb-btn-primary">Đăng nhập để nghe phát âm & lưu Flashcard</a>`}
      </div>
    </div>
    ${entry.related?.length ? `
      <section style="margin-top:20px;">
        <h2>Từ liên quan</h2>
        <div class="wb-grid-3">${entry.related.map((r) => `<article class="wb-card"><h3><a href="/dictionary/${escapeHtml(lang.slug)}/${escapeHtml(r.slug)}">${escapeHtml(r.headword)}</a></h3><p class="wb-muted">${escapeHtml(r.phonetic)} · ${escapeHtml(r.meaning_vi)}</p></article>`).join("")}</div>
      </section>` : ""}
  `;
  return htmlResponse(renderPublicPage({
    title: `${entry.headword} — Từ điển ${lang.nameVi}`,
    currentPath: entryPath,
    breadcrumbs: [
      { label: "Trang chủ", href: "/" },
      { label: "Từ điển", href: "/dictionary" },
      { label: lang.nameVi, href: `/dictionary/${lang.slug}` },
      { label: entry.headword }
    ],
    user,
    contentHtml
  }));
}
__name(renderDictionaryEntryPage, "renderDictionaryEntryPage");
var STUDY_MODES = Object.freeze([
  { id: "recognition", label: "Recognition", desc: "Nhìn từ, nhớ nghĩa" },
  { id: "reverse", label: "Reverse Recall", desc: "Nhìn nghĩa, nhớ từ gốc" },
  { id: "listening", label: "Listening", desc: "Nghe từ, nhận diện nghĩa" },
  { id: "collocation", label: "Collocation", desc: "Học theo kết hợp từ" },
  { id: "context", label: "Context", desc: "Nhận diện trong ngữ cảnh" },
  { id: "specialized", label: "Specialized", desc: "Thuật ngữ chuyên ngành" }
]);
function filterCardsForStudyMode(items, studyMode) {
  switch (studyMode) {
    case "specialized":
      return items.filter((it) => Boolean(it.specialized_domain));
    case "collocation":
      return items.filter((it) => safeJsonArray(it.collocations_json).length > 0);
    case "context":
      return items.filter((it) => safeJsonArray(it.examples_json).length > 0);
    case "listening":
      return items.filter((it) => Boolean(it.audio_asset_id || it.phonetic));
    default:
      return items;
  }
}
__name(filterCardsForStudyMode, "filterCardsForStudyMode");
function renderVocabHeroArt(mode) {
  const wave = '<path d="M0 132 Q72 82 155 112 T340 94 L340 160 L0 160 Z" fill="#9cd8cd" fill-opacity="0.45"/>';
  if (mode === "review") {
    return `<svg viewBox="0 0 340 155" fill="none" aria-hidden="true">${wave}
      <g transform="translate(88,18) rotate(7)"><rect x="8" y="14" width="106" height="82" rx="14" fill="#0d6e62"/><rect x="0" y="6" width="106" height="82" rx="14" fill="#ffffff" stroke="#0d7a6b" stroke-width="3.5"/><text x="53" y="58" text-anchor="middle" fill="#0d6e62" font-size="30" font-weight="800">A 文</text></g>
      <g transform="translate(216,22)"><rect x="0" y="12" width="76" height="70" rx="12" fill="#ffffff" stroke="#148675" stroke-width="3"/><path d="M0 30 H76" stroke="#148675" stroke-width="3"/><circle cx="62" cy="70" r="18" fill="#179b84"/><polyline points="54 70 60 76 70 64" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;
  }
  if (mode === "sets") {
    return `<svg viewBox="0 0 340 155" fill="none" aria-hidden="true">${wave}
      <g transform="translate(182,72)"><path d="M10 38 L108 28 L136 42 L38 54 Z" fill="#0d6960"/><path d="M38 54 L136 42 L136 56 L38 68 Z" fill="#eef9f7"/><path d="M16 18 L114 8 L142 22 L44 34 Z" fill="#179484"/><path d="M44 34 L142 22 L142 36 L44 48 Z" fill="#ffffff"/><path d="M76 8 V-20" stroke="#1a8e74" stroke-width="3"/><ellipse cx="62" cy="-22" rx="15" ry="7" transform="rotate(28 62 -22)" fill="#2ea880"/><ellipse cx="90" cy="-26" rx="16" ry="7.5" transform="rotate(-28 90 -26)" fill="#4ec295"/></g>
      <g transform="translate(94,16) rotate(8)"><rect x="8" y="14" width="112" height="82" rx="14" fill="#148b7a"/><rect x="0" y="6" width="112" height="82" rx="14" fill="#ffffff" stroke="#0d7a6b" stroke-width="3.5"/><text x="56" y="58" text-anchor="middle" fill="#0d6e62" font-size="32" font-weight="800">A 文</text></g>
    </svg>`;
  }
  if (mode === "notebook") {
    return `<svg viewBox="0 0 340 155" fill="none" aria-hidden="true">${wave}
      <g transform="translate(206,72)"><path d="M8 38 L98 28 L122 42 L32 54 Z" fill="#0d6960"/><path d="M32 54 L122 42 L122 56 L32 68 Z" fill="#eef9f7"/><path d="M12 18 L102 8 L126 22 L36 34 Z" fill="#179484"/><path d="M36 34 L126 22 L126 36 L36 48 Z" fill="#ffffff"/><path d="M68 8 V-18" stroke="#1a8e74" stroke-width="3"/><ellipse cx="55" cy="-20" rx="14" ry="7" transform="rotate(28 55 -20)" fill="#2ea880"/><ellipse cx="81" cy="-24" rx="15" ry="7.5" transform="rotate(-28 81 -24)" fill="#4ec295"/></g>
      <g transform="translate(116,14) rotate(7)"><rect x="6" y="12" width="102" height="106" rx="14" fill="#158c7b"/><rect x="0" y="6" width="102" height="106" rx="14" fill="#ffffff" stroke="#0d7a6b" stroke-width="3.2"/><path d="M18 6 V-4 M38 6 V-4 M58 6 V-4 M78 6 V-4" stroke="#0d7a6b" stroke-width="4" stroke-linecap="round"/><text x="51" y="68" text-anchor="middle" fill="#0d6e62" font-size="32" font-weight="800">A 文</text></g>
    </svg>`;
  }
  return `<svg viewBox="0 0 340 155" fill="none" aria-hidden="true">${wave}
    <g transform="translate(198,84)"><path d="M8 32 L98 22 L122 36 L32 48 Z" fill="#0d6960"/><path d="M32 48 L122 36 L122 48 L32 60 Z" fill="#eef9f7"/><path d="M12 14 L102 4 L126 18 L36 30 Z" fill="#179484"/><path d="M36 30 L126 18 L126 30 L36 42 Z" fill="#ffffff"/></g>
    <g transform="translate(96,18) rotate(8)"><rect x="10" y="14" width="116" height="84" rx="14" fill="#108070"/><rect x="0" y="6" width="116" height="84" rx="14" fill="#ffffff" stroke="#0d7a6b" stroke-width="3.5"/><text x="58" y="59" text-anchor="middle" fill="#0d6e62" font-size="32" font-weight="800">A 文</text></g>
  </svg>`;
}
async function renderVocabularyPage({ db, user, mode = "notebook", url = null }) {
  const currentPath = `/vocabulary/${mode}`;
  if (!user && mode === "flashcards") {
    const card = await safeQueryFirst(db, "SELECT headword,phonetic,meaning_vi FROM wb_public_dictionary_entries ORDER BY language_code DESC,id LIMIT 1");
    const contentHtml = `
      <section class="wb-mint-hero">
        <div class="wb-mint-hero-grid">
          <div class="wb-mint-hero-copy"><span class="wb-mint-eyebrow">FLASHCARD · SMART PRACTICE</span><h1>Luyện Flashcard thông minh</h1><p>Luyện ghi nhớ từ vựng bằng thẻ Flashcard với nhiều chế độ thông minh.</p></div>
          <div class="wb-mint-hero-art">${renderVocabHeroArt("flashcards")}</div>
        </div>
      </section>
      <article class="wb-study-card"><span class="wb-badge">Từ vựng</span>
      ${card ? `<h2 data-learning-content>${escapeHtml(card.headword)}</h2><p>${escapeHtml(card.phonetic)}</p><p>${escapeHtml(card.meaning_vi)}</p>` : "<p>Nội dung đang được cập nhật.</p>"}
      <a class="wb-btn wb-btn-primary" href="${escapeHtml(signInUrl(currentPath, "vocabulary.flashcards"))}">Đăng nhập để ôn tập</a></article>`;
    return htmlResponse(renderPublicPage({ title: "Flashcard từ vựng", currentPath, contentHtml }));
  }
  if (!user) return redirectResponse(signInUrl(currentPath, `vocabulary.${mode}`));
  const studyMode = url?.searchParams?.get("mode") || "recognition";
  const filterSet = url?.searchParams?.get("set") || "";
  const filterStatus = url?.searchParams?.get("status") || "";
  const filterQ = (url?.searchParams?.get("q") || "").trim().toLowerCase();
  const [allItemsRes, setsRes] = await Promise.all([
    db.prepare(`
      SELECT n.*, d.headword, d.phonetic, d.ipa_or_pinyin, d.meaning_vi, d.target_definition,
             d.language_code, d.slug, d.level_ref, d.topic, d.specialized_domain,
             d.part_of_speech, d.audio_asset_id, d.collocations_json, d.examples_json
      FROM wb_public_vocabulary_notebook n
      JOIN wb_public_dictionary_entries d ON d.id = n.entry_id
      WHERE n.account_id = ?
      ORDER BY n.next_review_at ASC, n.created_at DESC
    `).bind(user.accountId).all().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT s.*, COUNT(n.id) AS card_count
      FROM wb_public_vocabulary_sets s
      LEFT JOIN wb_public_vocabulary_notebook n ON n.set_id = s.id AND n.account_id = s.account_id
      WHERE s.account_id = ?
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `).bind(user.accountId).all().catch(() => ({ results: [] }))
  ]);
  const allItems = allItemsRes.results || [];
  const sets = setsRes.results || [];
  const nowMs = Date.now();
  const stats = {
    total: allItems.length,
    newCount: allItems.filter((it) => memoryState(it) === "new").length,
    learning: allItems.filter((it) => memoryState(it) === "learning").length,
    reviewing: allItems.filter((it) => memoryState(it) === "reviewing").length,
    mastered: allItems.filter((it) => memoryState(it) === "mastered").length,
    due: allItems.filter((it) => new Date(it.next_review_at).getTime() <= nowMs).length,
    overdue: allItems.filter((it) => new Date(it.next_review_at).getTime() < nowMs - 864e5).length
  };
  let items = allItems;
  if (filterSet) items = items.filter((it) => it.set_id === filterSet);
  if (filterStatus) items = items.filter((it) => memoryState(it) === filterStatus);
  if (filterQ) {
    items = items.filter(
      (it) => `${it.headword} ${it.meaning_vi} ${it.phonetic} ${it.topic || ""} ${it.personal_note || ""}`.toLowerCase().includes(filterQ)
    );
  }
  const modeMeta = {
    notebook: { eyebrow: "TỪ ĐIỂN · PERSONAL VOCABULARY", title: "Sổ từ vựng cá nhân", sub: "Lưu trữ, tra cứu và quản lý toàn bộ từ vựng bạn đã thêm." },
    sets: { eyebrow: "TỪ ĐIỂN · PERSONAL VOCABULARY", title: "Bộ từ vựng cá nhân", sub: "Quản lý các bộ từ vựng của riêng bạn, tạo Flashcard và ôn tập hiệu quả theo lộ trình." },
    flashcards: { eyebrow: "FLASHCARD · SMART PRACTICE", title: "Luyện Flashcard thông minh", sub: "Luyện ghi nhớ từ vựng bằng thẻ Flashcard với nhiều chế độ và phương pháp thông minh." },
    review: { eyebrow: "TỪ ĐIỂN · SPACED REPETITION", title: "Ôn tập từ vựng ngắt quãng", sub: "Luyện tập lại từ vựng theo chu kỳ lặp lại tối ưu để ghi nhớ lâu hơn." }
  };
  const metaCur = modeMeta[mode] || modeMeta.notebook;

  const heroAndStats = `
    <section class="wb-mint-hero">
      <div class="wb-mint-hero-grid">
        <div class="wb-mint-hero-copy">
          <span class="wb-mint-eyebrow">${metaCur.eyebrow}</span>
          <h1>${metaCur.title}</h1>
          <p>${metaCur.sub}</p>
        </div>
        <div class="wb-mint-hero-art">${renderVocabHeroArt(mode)}</div>
      </div>
      <nav class="wb-skill-strip" aria-label="Phân mục từ vựng cá nhân">
        <a href="/vocabulary/notebook" ${mode === "notebook" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg><span>Sổ từ vựng (${stats.total})</span></a>
        <a href="/vocabulary/sets" ${mode === "sets" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Bộ từ vựng (${sets.length})</span></a>
        <a href="/vocabulary/flashcards" ${mode === "flashcards" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="14" height="16" rx="2"/><path d="M8 2h10a2 2 0 0 1 2 2v14"/></svg><span>Flashcard</span></a>
        <a href="/vocabulary/review" ${mode === "review" ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg><span>Ôn tập SRS (${stats.due} đến hạn)</span></a>
        <a href="/my-knowledge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg><span>My Knowledge</span></a>
      </nav>
    </section>

    <div class="wb-vocab-stats-5">
      <div class="wb-vocab-stat-tile"><div class="wb-vocab-stat-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg></div><div><strong>${stats.total}</strong><span>Tổng số từ</span></div></div>
      <div class="wb-vocab-stat-tile"><div class="wb-vocab-stat-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div><div><strong>${stats.newCount}</strong><span>Từ mới</span></div></div>
      <div class="wb-vocab-stat-tile"><div class="wb-vocab-stat-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg></div><div><strong>${stats.learning + stats.reviewing}</strong><span>Đang học / Ôn</span></div></div>
      <div class="wb-vocab-stat-tile"><div class="wb-vocab-stat-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg></div><div><strong>${stats.mastered}</strong><span>Đã nhớ (Mastered)</span></div></div>
      <div class="wb-vocab-stat-tile"><div class="wb-vocab-stat-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><strong>${stats.due}</strong><span>Đến hạn ôn (${stats.overdue} quá hạn)</span></div></div>
    </div>`;

  let bodyHtml = "";
  if (mode === "sets") {
    bodyHtml = `
      <div class="wb-grid-2" style="align-items:start;">
        <form class="wb-sc-card wb-form" data-api-endpoint="/api/v1/vocabulary/sets" data-redirect-to="/vocabulary/sets">
          <div class="wb-sc-card-head"><div class="wb-sc-card-ico">+</div><div><h2>Tạo bộ Flashcard mới</h2></div></div>
          <div class="wb-field"><label>Tên bộ thẻ <span class="wb-req">*</span></label><input class="wb-input" name="title" required placeholder="Ví dụ: Thuật ngữ Cơ khí tuần 1" /></div>
          <div class="wb-field"><label>Ngôn ngữ</label><select class="wb-select" name="languageCode"><option value="en">Tiếng Anh (EN)</option><option value="zh">Tiếng Trung (ZH)</option></select></div>
          <div class="wb-field"><label>Mô tả</label><textarea class="wb-textarea" name="description" rows="3" placeholder="Chủ đề, trình độ hoặc mục tiêu ôn tập..."></textarea></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary wb-btn-block">+ Tạo bộ thẻ</button>
        </form>
        <section class="wb-sc-card">
          <div class="wb-sc-card-head"><div class="wb-sc-card-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div><div><h2>Danh sách bộ thẻ (${sets.length})</h2></div></div>
          ${sets.length ? sets.map((s) => `
            <div style="border:1px solid var(--wb-border);border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <div>
                <strong>${escapeHtml(s.title)}</strong> <span class="wb-sc-mint-pill">${escapeHtml(s.language_code.toUpperCase())} · ${Number(s.card_count || 0)} thẻ</span>
                ${s.description ? `<p class="wb-muted" style="margin:4px 0 0;font-size:0.84rem;">${escapeHtml(s.description)}</p>` : ""}
              </div>
              <div style="display:flex;gap:6px;">
                <a href="/vocabulary/flashcards?set=${escapeHtml(s.id)}" class="wb-btn wb-btn-primary wb-btn-sm">Học bộ này</a>
                <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-delete-set="${escapeHtml(s.id)}">Xóa</button>
              </div>
            </div>`).join("") : `
            <div style="text-align:center;padding:28px 14px;">
              <svg viewBox="0 0 104 72" width="96" fill="none" aria-hidden="true"><rect x="14" y="14" width="76" height="50" rx="10" fill="#179484" opacity="0.22"/><rect x="8" y="8" width="76" height="50" rx="10" fill="#ffffff" stroke="#148675" stroke-width="3"/><text x="46" y="42" text-anchor="middle" fill="#0d6e62" font-size="22" font-weight="800">A 文</text></svg>
              <h3 style="margin:12px 0 6px;">Bạn chưa tạo bộ thẻ nào.</h3>
              <p class="wb-muted" style="margin:0;">Tạo bộ thẻ đầu tiên bên trái để phân nhóm từ vựng theo chủ đề hoặc chuyên ngành.</p>
            </div>`}
        </section>
      </div>`;
  } else if (mode === "flashcards" || mode === "review") {
    const basePool = mode === "review" ? items.filter((it) => new Date(it.next_review_at).getTime() <= nowMs) : items;
    const activeDeck = filterCardsForStudyMode(basePool, studyMode);
    const availableModes = STUDY_MODES.filter((m) => m.id === "recognition" || m.id === "reverse" || filterCardsForStudyMode(basePool, m.id).length > 0);
    const modeSubLabel = { recognition: "Nhận diện từ", reverse: "Nhớ ngược", listening: "Nghe nhận diện", collocation: "Kết hợp từ", context: "Trong ngữ cảnh", specialized: "Chuyên ngành" };
    const modeBar = `
      <div class="wb-vocab-mode-bar" aria-label="Chế độ học Flashcard">
        ${availableModes.map((m) => `<a href="/vocabulary/${mode}?mode=${m.id}${filterSet ? `&set=${encodeURIComponent(filterSet)}` : ""}" class="wb-vocab-mode-btn ${studyMode === m.id ? "active" : ""}" title="${escapeHtml(m.desc)}"><div><span>${escapeHtml(m.label)}</span>${mode === "flashcards" ? `<small>${escapeHtml(modeSubLabel[m.id] || m.desc)}</small>` : ""}</div></a>`).join("")}
        <button type="button" class="wb-vocab-mode-btn" data-wb-deck-shuffle><div><span>Xáo trộn</span>${mode === "flashcards" ? "<small>Luyện ngẫu nhiên</small>" : ""}</div></button>
        <button type="button" class="wb-vocab-mode-btn" data-wb-deck-restart><div><span>Học lại</span>${mode === "flashcards" ? "<small>Ôn các từ chưa nhớ</small>" : ""}</div></button>
      </div>`;
    if (!activeDeck.length) {
      bodyHtml = mode === "review" ? `
        ${modeBar}
        <div class="wb-vocab-empty-panel">
          <div class="wb-vocab-empty-split">
            <div style="text-align:center;" aria-hidden="true"><svg viewBox="0 0 140 100" width="136" fill="none"><path d="M12 68 L94 58 L116 70 L34 82 Z" fill="#0d6960"/><path d="M34 82 L116 70 L116 82 L34 94 Z" fill="#eef9f7"/><rect x="34" y="14" width="76" height="52" rx="10" fill="#ffffff" stroke="#0d7a6b" stroke-width="3"/><text x="72" y="48" text-anchor="middle" fill="#0d6e62" font-size="22" font-weight="800">A 文</text></svg></div>
            <div>
              <h2>Không có mục đến hạn ôn.</h2>
              <p>Rất tốt! Hiện tại không có từ vựng nào đến hạn ôn.</p>
              <div class="wb-vocab-empty-actions">
                <a href="/dictionary" class="wb-btn wb-btn-primary wb-btn-sm">+ Thêm từ vựng mới</a>
                <a href="/vocabulary/notebook" class="wb-btn wb-btn-outline wb-btn-sm">Xem sổ từ vựng</a>
                <a href="/vocabulary/sets" class="wb-btn wb-btn-outline wb-btn-sm">Học theo bộ từ vựng</a>
              </div>
            </div>
          </div>
        </div>` : `
        ${modeBar}
        <div class="wb-vocab-empty-panel">
          <svg viewBox="0 0 104 72" width="96" fill="none" aria-hidden="true"><rect x="14" y="14" width="76" height="50" rx="10" fill="#179484" opacity="0.22"/><rect x="8" y="8" width="76" height="50" rx="10" fill="#ffffff" stroke="#148675" stroke-width="3"/><text x="46" y="42" text-anchor="middle" fill="#0d6e62" font-size="22" font-weight="800">A 文</text></svg>
          <h2>Chưa có thẻ phù hợp cho chế độ này.</h2>
          <p>Hãy tra cứu và lưu mục từ tại <a href="/dictionary">/dictionary</a> hoặc <a href="/specialized">/specialized</a>.</p>
          <div class="wb-vocab-empty-actions">
            <a href="/dictionary" class="wb-btn wb-btn-primary">Tra cứu từ điển</a>
            <a href="/specialized" class="wb-btn wb-btn-outline">Lưu từ chuyên ngành</a>
          </div>
        </div>`;
    } else {
      bodyHtml = `
        ${modeBar}
        <p class="wb-muted" style="font-size:0.86rem;">Phím tắt: <strong>Space</strong> lật thẻ · <strong>← / →</strong> chuyển thẻ · <strong>1–4</strong> đánh giá trí nhớ · Vuốt trái/phải trên thiết bị cảm ứng.</p>
        <div data-wb-study-deck data-study-mode="${escapeHtml(studyMode)}" data-total-cards="${activeDeck.length}">
          <div class="wb-muted" data-wb-deck-progress style="margin-bottom:10px;">Thẻ 1 / ${activeDeck.length} · Chế độ: <strong>${escapeHtml(studyMode)}</strong></div>
          ${activeDeck.map((it, idx2) => {
        const collocs = safeJsonArray(it.collocations_json);
        const examples = safeJsonArray(it.examples_json);
        let frontPrompt = `<h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p class="wb-phonetic">${escapeHtml(it.phonetic)}</p>`;
        if (studyMode === "reverse") {
          frontPrompt = `<p class="wb-eyebrow">REVERSE RECALL</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.meaning_vi)}</h2>`;
        } else if (studyMode === "listening") {
          frontPrompt = `<p class="wb-eyebrow">LISTENING MODE</p><p>Nghe phát âm và nhớ lại từ gốc cùng nghĩa tiếng Việt.</p>`;
        } else if (studyMode === "collocation") {
          frontPrompt = `<p class="wb-eyebrow">COLLOCATION</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p>${collocs.map((c) => escapeHtml(typeof c === "string" ? c : c.text || "")).join(" · ")}</p>`;
        } else if (studyMode === "context") {
          const ex0 = examples[0];
          frontPrompt = `<p class="wb-eyebrow">CONTEXT</p><p data-learning-content>${escapeHtml(typeof ex0 === "string" ? ex0 : ex0?.text || it.target_definition || it.headword)}</p>`;
        } else if (studyMode === "specialized") {
          frontPrompt = `<p class="wb-eyebrow">SPECIALIZED · ${escapeHtml(it.specialized_domain || "")}</p><h2 data-learning-content style="margin:6px 0;">${escapeHtml(it.headword)}</h2><p class="wb-phonetic">${escapeHtml(it.phonetic)}</p>`;
        }
        return `
              <article class="wb-card wb-study-surface" data-wb-study-card data-card-index="${idx2}" ${idx2 > 0 ? "hidden" : ""}>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                  <span class="wb-badge">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(memoryState(it))} · Chu kỳ ${it.interval_days} ngày</span>
                  <div style="display:flex;gap:6px;">
                    ${it.audio_asset_id ? `<audio controls preload="none" src="/api/v1/audio/${escapeHtml(it.audio_asset_id)}/stream" style="height:30px;"></audio>` : ""}
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-tts="${escapeHtml(it.headword)}" data-wb-lang="${escapeHtml(it.language_code)}">Nghe phát âm</button>
                  </div>
                </div>
                <div data-wb-front>
                  ${frontPrompt}
                  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-reveal>Lật thẻ — Space</button>
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-prev>Thẻ trước</button>
                    <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-deck-next>Thẻ tiếp theo</button>
                  </div>
                </div>
                <div data-wb-back hidden style="margin-top:14px;padding-top:14px;border-top:1px solid var(--wb-border);">
                  <p><strong>Từ gốc:</strong> <span data-learning-content>${escapeHtml(it.headword)}</span> <span class="wb-phonetic">${escapeHtml(it.phonetic)}</span></p>
                  <p><strong>Nghĩa:</strong> <span data-learning-content>${escapeHtml(it.meaning_vi)}</span></p>
                  ${it.target_definition ? `<p class="wb-muted" data-learning-content>${escapeHtml(it.target_definition)}</p>` : ""}
                  ${it.personal_note ? `<p><strong>Ghi chú cá nhân:</strong> ${escapeHtml(it.personal_note)}</p>` : ""}
                </div>
                <form data-wb-review-form data-api-endpoint="/api/v1/vocabulary/review" hidden style="margin-top:14px;">
                  <input type="hidden" name="notebookItemId" value="${escapeHtml(it.id)}" />
                  <input type="hidden" name="expectedReview" value="${escapeHtml(it.last_reviewed_at || "")}" />
                  <input type="hidden" name="quality" value="4" />
                  <p class="wb-muted" style="font-size:0.84rem;margin:0 0 8px;">Đánh giá trí nhớ — chỉ cập nhật sau khi server xác nhận (phím 1–4):</p>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-grade="1">1 · Chưa nhớ</button>
                    <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-grade="2">2 · Khó</button>
                    <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-grade="4">3 · Nhớ</button>
                    <button type="button" class="wb-btn wb-btn-accent wb-btn-sm" data-wb-grade="5">4 · Rất chắc</button>
                  </div>
                  <div data-form-status style="margin-top:8px;"></div>
                </form>
              </article>`;
      }).join("")}
        </div>`;
    }
  } else {
    bodyHtml = `
      <form method="GET" action="/vocabulary/notebook" class="wb-vocab-filter-bar">
        <input class="wb-input" style="flex:1;min-width:200px;" name="q" value="${escapeHtml(filterQ)}" placeholder="Tìm trong sổ từ cá nhân..." />
        <select class="wb-select" name="status" style="width:auto;min-width:165px;">
          <option value="">Tất cả trạng thái</option>
          <option value="new" ${filterStatus === "new" ? "selected" : ""}>Từ mới</option>
          <option value="learning" ${filterStatus === "learning" ? "selected" : ""}>Đang học</option>
          <option value="reviewing" ${filterStatus === "reviewing" ? "selected" : ""}>Đang ôn</option>
          <option value="mastered" ${filterStatus === "mastered" ? "selected" : ""}>Đã nhớ</option>
        </select>
        ${sets.length ? `<select class="wb-select" name="set" style="width:auto;"><option value="">Tất cả bộ thẻ</option>${sets.map((s) => `<option value="${escapeHtml(s.id)}" ${filterSet === s.id ? "selected" : ""}>${escapeHtml(s.title)}</option>`).join("")}</select>` : ""}
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Lọc</button>
        <a href="/api/v1/vocabulary/export" class="wb-btn wb-btn-outline wb-btn-sm">Xuất CSV</a>
      </form>
      ${items.length ? `<div class="wb-grid-2">${items.map((it) => `
        <article class="wb-card" style="margin:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <span class="wb-badge">${escapeHtml(it.language_code.toUpperCase())} · ${escapeHtml(memoryState(it))} · Chu kỳ ${it.interval_days} ngày</span>
            <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-delete-vocab="${escapeHtml(it.id)}">Xóa</button>
          </div>
          <h3 style="margin-top:8px;"><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[it.language_code].slug)}/${escapeHtml(it.slug)}" data-learning-content>${escapeHtml(it.headword)}</a> <span class="wb-phonetic">${escapeHtml(it.phonetic)}</span></h3>
          <p data-learning-content>${escapeHtml(it.meaning_vi)}</p>
          <p class="wb-muted" style="font-size:0.82rem;margin:0;">Ôn tiếp theo: <time>${escapeHtml(it.next_review_at)}</time> · Lặp lại: ${it.repetitions} · EF: ${it.ease_factor}</p>
        </article>`).join("")}</div>` : `
        <div class="wb-vocab-empty-panel">
          <svg viewBox="0 0 96 68" width="90" fill="none" aria-hidden="true"><path d="M12 22 C28 14 40 16 48 26 C56 16 68 14 84 22 L78 56 C64 48 54 50 48 56 C42 50 32 48 18 56 Z" fill="#ffffff" stroke="#148675" stroke-width="3"/><text x="48" y="42" text-anchor="middle" fill="#0d6e62" font-size="18" font-weight="800">A 文</text></svg>
          <h2>Sổ từ vựng của bạn đang trống.</h2>
          <p>Hãy thêm từ mới khi học, tra cứu từ điển hoặc lưu từ chuyên ngành.</p>
          <div class="wb-vocab-empty-actions">
            <a href="/dictionary" class="wb-btn wb-btn-primary">+ Tra cứu &amp; Thêm từ mới</a>
            <a href="/specialized" class="wb-btn wb-btn-outline">Mở chuyên ngành</a>
            <a href="/vocabulary/sets" class="wb-btn wb-btn-outline">Quản lý bộ từ vựng</a>
          </div>
        </div>`}`;
  }
  return htmlResponse(renderPublicPage({
    title: metaCur.title,
    currentPath,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Từ điển", href: "/dictionary" }, { label: metaCur.title }],
    user,
    contentHtml: `${heroAndStats}${bodyHtml}`
  }));
}
__name(renderVocabularyPage, "renderVocabularyPage");

// src/pages/practice-exam-pages.js
var SKILL_LABELS = {
  listening: "Luyện Nghe (Listening)",
  speaking: "Luyện Nói (Speaking)",
  reading: "Luyện Đọc (Reading)",
  writing: "Luyện Viết (Writing)",
  vocabulary: "Luyện Từ Vựng",
  grammar: "Luyện Ngữ Pháp"
};
function safeJson3(raw, fallback = []) {
  try {
    return safeJsonParse(raw || "", {});
  } catch {
    return fallback;
  }
}
__name(safeJson3, "safeJson");
async function renderPracticePage({ services, db, user, skill = "" }) {
  const exercises = await services.practice.listExercises({ skill }).catch(() => []);
  const exercisesWithQuestions = [];
  for (const ex of exercises) {
    const qIds = safeJson3(ex.question_ids_json, []);
    const questions = [];
    if (db && Array.isArray(qIds)) {
      for (const qId of qIds) {
        const q = await safeQueryFirst(db, "SELECT * FROM wb_public_question_bank WHERE id = ?", [qId]).catch(() => null);
        if (q) questions.push(q);
      }
    }
    exercisesWithQuestions.push({ ...ex, questions });
  }
  let publishedAudio = [];
  if (skill === "listening" && db) {
    try {
      publishedAudio = await safeQueryAll(db, "SELECT * FROM wb_public_audio_assets WHERE review_status = 'published' ORDER BY created_at DESC LIMIT 10");
    } catch {
      publishedAudio = [];
    }
  }
  let readingPassages = [];
  if (skill === "reading" && db) {
    try {
      const rows = await safeQueryAll(db, "SELECT id, slug, title_vi, language_code, level_ref, components_json FROM wb_public_lessons WHERE review_status = 'published' LIMIT 6");
      readingPassages = rows.map((r) => {
        const comp = safeJson3(r.components_json, {});
        return { ...r, readingText: comp.reading || "" };
      }).filter((r) => r.readingText);
    } catch {
      readingPassages = [];
    }
  }
  const heading = skill ? SKILL_LABELS[skill] || "Cổng Luyện Tập" : "Cổng Luyện Tập Kỹ Năng & Chuyên Ngành";
  const currentPath = skill ? `/practice/${skill}` : "/practice";
  const listeningStudioHtml = skill === "listening" ? `
    <section class="wb-card" style="margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Phòng luyện Nghe & Chép chính tả</h2>
      ${publishedAudio.length ? publishedAudio.map((a) => {
    const segments = safeJson3(a.sync_segments_json, []);
    return `
              <div class="wb-audio-player" data-wb-audio style="margin-bottom:14px;">
                <strong>${escapeHtml(a.voice_label || "Âm thanh bài học")} · ${escapeHtml(a.language_code.toUpperCase())}</strong>
                ${user ? `<audio controls preload="none" style="width:100%;" src="/api/v1/audio/${escapeHtml(a.id)}/stream"></audio>
                     <div class="wb-audio-controls">
                       <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-audio-action="play">Phát</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="pause">Tạm dừng</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="replay">Phát lại</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="back">-5s</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="forward">+5s</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-action="loop">Lặp: Tắt</button>
                       <span class="wb-muted">Tốc độ: <strong data-speed-label>1.0x</strong></span>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="0.75">0.75x</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1">1.0x</button>
                       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-audio-speed="1.25">1.25x</button>
                     </div>` : `<p class="wb-muted">Đăng nhập để phát âm thanh luyện nghe.</p><a href="${escapeHtml(signInUrl("/practice/listening", "audio.listen"))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để nghe</a>`}
                ${a.transcript_text ? `<p style="margin:8px 0;" data-learning-content>${escapeHtml(a.transcript_text)}</p>` : ""}
                ${segments.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;">${segments.map((s) => `<button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-audio-segment-start="${Number(s.startMs || 0)}" data-audio-segment-end="${Number(s.endMs || 0)}">▶ ${escapeHtml(s.text || "")}</button>`).join("")}</div>` : ""}
                <div style="margin-top:10px;">
                  <label><strong>Chép chính tả</strong></label>
                  <textarea class="wb-textarea" rows="2" placeholder="Nghe từng câu và gõ lại nội dung bạn nghe được..."></textarea>
                </div>
                <div data-audio-status class="wb-muted" style="font-size:0.84rem;">Nghe lại từng đoạn hoặc điều chỉnh tốc độ phát.</div>
              </div>`;
  }).join("") : '<div class="wb-alert wb-alert-info">Chưa có bài Nghe đã phát hành có tệp audio xác minh.</div>'}
    </section>` : "";
  const speakingStudioHtml = skill === "speaking" ? `
    <section class="wb-card wb-recorder-studio" style="border-left:4px solid var(--wb-aqua);margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Tự luyện Nói & Phát âm qua Micro</h2>
      <p class="wb-muted">Ghi âm giọng đọc rồi nghe lại để tự đối chiếu với phát âm mẫu.</p>
      ${user ? `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
             <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-record-toggle>Ghi âm</button>
             <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-record-retry>Ghi lại</button>
             <span data-wb-record-status class="wb-muted" role="status">Chưa ghi âm.</span>
           </div>
           <audio id="wb-local-playback" controls hidden style="margin-top:10px;max-width:100%;"></audio>` : `<a href="${escapeHtml(signInUrl("/practice/speaking", "speaking.record"))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để ghi âm</a>`}
    </section>` : "";
  const readingStudioHtml = skill === "reading" ? `
    <section class="wb-card" style="margin-bottom:18px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Đoạn đọc học thuật đã xuất bản</h2>
      ${readingPassages.length ? readingPassages.slice(0, 3).map((p) => `
            <article style="margin-bottom:14px;">
              <p class="wb-eyebrow">${escapeHtml(p.language_code.toUpperCase())} · ${escapeHtml(p.level_ref)}</p>
              <h3><a href="/lessons/${escapeHtml(p.slug)}">${escapeHtml(p.title_vi)}</a></h3>
              <blockquote>${escapeHtml(p.readingText)}</blockquote>
            </article>`).join("") : "<blockquote>Chọn bài học trong giáo trình để đọc văn bản gốc và tra từ trực tiếp.</blockquote>"}
    </section>` : "";
  const contentHtml = `
    <section class="wb-hero-teal-banner">
      <div>
        <span class="wb-hero-pill">CỔNG LUYỆN TẬP · KỸ NĂNG · CHUYÊN NGÀNH</span>
        <h1>${escapeHtml(heading)}</h1>
        <p>Thực hành bài tập theo từng kỹ năng, chủ đề và chuyên ngành từ nguồn học liệu đã xuất bản.</p>
      </div>
      <div style="text-align:center;" aria-hidden="true">
        <svg viewBox="0 0 250 140" width="220" fill="none">
          <rect x="86" y="10" width="136" height="92" rx="12" fill="#ffffff" stroke="#0c5457" stroke-width="4"/>
          <path d="M68 104 H238 L228 118 H78 Z" fill="#dff4f2"/>
          <circle cx="116" cy="40" r="10" fill="#179484"/><polyline points="111 40 115 44 121 37" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
          <circle cx="116" cy="68" r="10" fill="#179484"/><polyline points="111 68 115 72 121 65" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M136 40 H196 M136 68 H188" stroke="#b9dcd9" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M18 96 L96 86 L120 98 L42 110 Z" fill="#09484b"/><path d="M42 110 L120 98 L120 112 L42 124 Z" fill="#e9f6f5"/>
          <path d="M22 76 L100 66 L124 78 L46 90 Z" fill="#178784"/><path d="M46 90 L124 78 L124 90 L46 102 Z" fill="#ffffff"/>
        </svg>
      </div>
    </section>

    <nav class="wb-practice-tabs" aria-label="Chọn kỹ năng luyện tập">
      <a href="/practice" class="wb-practice-tab ${!skill ? "active" : ""}">Tất cả</a>
      <a href="/practice/listening" class="wb-practice-tab ${skill === "listening" ? "active" : ""}">${SKILL_ICONS.listening}<span>Nghe</span></a>
      <a href="/practice/speaking" class="wb-practice-tab ${skill === "speaking" ? "active" : ""}">${SKILL_ICONS.pronunciation}<span>Nói</span></a>
      <a href="/practice/reading" class="wb-practice-tab ${skill === "reading" ? "active" : ""}">${SKILL_ICONS.reading}<span>Đọc</span></a>
      <a href="/practice/writing" class="wb-practice-tab ${skill === "writing" ? "active" : ""}">${SKILL_ICONS.writing}<span>Viết</span></a>
      <a href="/practice/vocabulary" class="wb-practice-tab ${skill === "vocabulary" ? "active" : ""}">${SKILL_ICONS.vocabulary}<span>Từ vựng</span></a>
      <a href="/practice/grammar" class="wb-practice-tab ${skill === "grammar" ? "active" : ""}">${SKILL_ICONS.grammar}<span>Ngữ pháp</span></a>
      <a href="/my-mistakes" class="wb-practice-tab">My Mistakes</a>
      <a href="/practice/history" class="wb-practice-tab">Practice Insights</a>
    </nav>

    ${listeningStudioHtml}
    ${speakingStudioHtml}
    ${readingStudioHtml}

    <section id="wb-practice-bank" class="wb-sc-card" data-skill="${escapeHtml(skill || "all")}" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:4px;">
        <div>
          <span class="wb-mint-eyebrow" style="margin-bottom:4px;">KHO LUYỆN TẬP THỰC CHIẾN · ĐA DẠNG CHỦ ĐỀ</span>
          <h2 style="margin:0;color:var(--wb-text);font-size:1.3rem;">Kho Luyện Tập Thực Chiến (${escapeHtml(SKILL_LABELS[skill] || "Tất cả kỹ năng")})</h2>
        </div>
        <div id="wb-pb-stats" class="wb-muted" style="font-size:0.86rem;">Hệ thống cung cấp nhiều bài luyện tập theo kỹ năng, chủ đề và chuyên ngành.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <input id="wb-pb-search" class="wb-input" style="flex:1;min-width:200px;" placeholder="Tìm từ vựng, chủ đề hoặc chuyên ngành để luyện tập..." />
        <select id="wb-pb-lang" class="wb-select" style="min-width:160px;">
          <option value="">Tất cả (Tiếng Anh + Tiếng Trung)</option>
          <option value="en">Tiếng Anh (EN)</option>
          <option value="zh">Tiếng Trung (ZH)</option>
        </select>
      </div>
      <div id="wb-pb-list" class="wb-grid-2"></div>
      <div id="wb-pb-pager" style="display:flex;justify-content:center;gap:10px;align-items:center;margin-top:14px;"></div>
    </section>

    <div class="wb-grid-2">
      ${exercisesWithQuestions.map((ex) => `
        <article class="wb-card">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span class="wb-badge">${escapeHtml(String(ex.language_code || "en").toUpperCase())} · ${escapeHtml(ex.skill)} · ${escapeHtml(ex.level_ref)}</span>
          </div>
          <h3 style="margin:10px 0 6px;color:var(--wb-teal);" data-learning-content>${escapeHtml(ex.title_vi)}</h3>
          <p class="wb-muted" style="margin:0 0 8px;">${escapeHtml(ex.instructions_vi)}</p>
          <p style="font-size:0.84rem;margin:0 0 12px;"><strong>Tiêu chí đánh giá:</strong> ${escapeHtml(ex.rubric_summary_vi)}</p>
          ${user ? `<form class="wb-form" data-api-endpoint="/api/v1/practice/submit" data-render-json="pr-out-${escapeHtml(ex.id)}">
                <input type="hidden" name="exerciseId" value="${escapeHtml(ex.id)}" />
                ${ex.questions.map((q) => {
    const opts = safeJson3(q.options_json, []);
    return `
                    <div class="wb-field">
                      <label data-learning-content><strong>Đề bài:</strong> ${escapeHtml(q.prompt_text)}</label>
                      ${opts.length ? `<div style="display:grid;gap:6px;">${opts.map((opt) => `<label style="display:flex;gap:8px;align-items:center;font-size:0.88rem;"><input type="radio" name="answer_${escapeHtml(q.id)}" value="${escapeHtml(opt)}" /> <span>${escapeHtml(opt)}</span></label>`).join("")}</div>` : `<textarea class="wb-textarea" name="answer_${escapeHtml(q.id)}" data-wb-counter="cnt-${escapeHtml(ex.id)}-${escapeHtml(q.id)}" placeholder="Nhập bài làm của bạn tại đây..."></textarea><div id="cnt-${escapeHtml(ex.id)}-${escapeHtml(q.id)}" class="wb-muted" style="font-size:0.8rem;">Số từ: 0 · Hán tự: 0 · Tổng ký tự: 0</div>`}
                    </div>`;
  }).join("")}
                <div data-form-status></div>
                <button type="submit" class="wb-btn wb-btn-primary wb-btn-sm">Nộp bài & Xem kết quả</button>
              </form><div id="pr-out-${escapeHtml(ex.id)}" style="margin-top:10px;"></div>` : `<a href="${escapeHtml(signInUrl(currentPath, `practice.${skill || "all"}`))}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập để làm & nộp bài</a>`}
        </article>`).join("") || '<div class="wb-alert wb-alert-info">Chưa có bài luyện tập đã xác thực cho kỹ năng này. Nội dung đang được cập nhật.</div>'}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Cổng Luyện Tập", href: "/practice" }, ...skill ? [{ label: heading }] : []],
    user,
    contentHtml
  }));
}
__name(renderPracticePage, "renderPracticePage");
async function renderPracticeHistoryPage({ db, user }) {
  if (!user) return redirectResponse(signInUrl("/practice/history", "practice.history"));
  const rows = (await db.prepare("SELECT r.*, e.title_vi FROM wb_public_practice_results r LEFT JOIN wb_public_practice_exercises e ON e.id = r.exercise_id WHERE r.account_id = ? ORDER BY r.submitted_at DESC, r.result_order DESC LIMIT 50").bind(user.accountId).all()).results || [];
  const gradedRows = rows.filter((r) => r.grading_status === "auto_graded" && Number(r.max_score) > 0 && r.score != null);
  const avgAccuracy = gradedRows.length ? Math.round(gradedRows.reduce((sum, r) => sum + Number(r.score) / Number(r.max_score) * 100, 0) / gradedRows.length) : null;
  const bySkill = {};
  const byWeek = {};
  for (const r of rows) {
    const sk = r.skill || "other";
    bySkill[sk] = bySkill[sk] || { total: 0, graded: 0, pctSum: 0 };
    bySkill[sk].total += 1;
    if (r.grading_status === "auto_graded" && Number(r.max_score) > 0 && r.score != null) {
      bySkill[sk].graded += 1;
      bySkill[sk].pctSum += Number(r.score) / Number(r.max_score) * 100;
    }
    const dayKey = String(r.submitted_at || "").slice(0, 10) || "Hôm nay";
    byWeek[dayKey] = (byWeek[dayKey] || 0) + 1;
  }
  return htmlResponse(renderPublicPage({
    title: "Practice Insights & Lịch sử luyện tập",
    currentPath: "/practice/history",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Cổng Luyện Tập", href: "/practice" }, { label: "Insights" }],
    user,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Practice Insights & Lịch sử luyện tập (${rows.length})</h1>
      <p class="wb-muted">Insights chỉ được tính từ kết quả practice đã lưu trong backend (không suy đoán thời lượng học khi chưa có dữ liệu đo thực tế).</p>
      <div class="wb-metric-row" style="margin-bottom:18px;">
        <div><strong>${rows.length}</strong><span>Tổng lượt luyện tập</span></div>
        <div><strong>${avgAccuracy !== null ? `${avgAccuracy}%` : "—"}</strong><span>Tỷ lệ chính xác trung bình</span></div>
        <div><strong>${Object.keys(bySkill).length}</strong><span>Skills có evidence</span></div>
      </div>
      <div class="wb-grid-2" style="margin-bottom:18px;">
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Hoạt động theo tuần</h2>
          ${Object.keys(byWeek).length ? `<ul>${Object.entries(byWeek).map(([d, cnt]) => `<li><strong>${escapeHtml(d)}</strong>: ${cnt} lượt nộp</li>`).join("")}</ul>` : '<p class="wb-muted">Chưa có dữ liệu hoạt động theo tuần.</p>'}
        </section>
        <section class="wb-card">
          <h2 style="margin-top:0;color:var(--wb-teal);">Hoạt động theo kỹ năng</h2>
          ${Object.keys(bySkill).length ? `<ul>${Object.entries(bySkill).map(([sk, st]) => `<li><strong>${escapeHtml(sk.toUpperCase())}</strong>: ${st.total} lượt · ${st.graded ? `${Math.round(st.pctSum / st.graded)}%` : "Chờ chấm theo rubric"}</li>`).join("")}</ul>` : '<p class="wb-muted">Chưa có dữ liệu theo kỹ năng.</p>'}
        </section>
      </div>
      <div class="wb-card"><div class="wb-table-wrap"><table class="wb-table">
        <thead><tr><th>Mã kết quả</th><th>Bài tập</th><th>Điểm</th><th>Trạng thái</th><th>Thời gian</th><th>Chi tiết</th></tr></thead>
        <tbody>${rows.map((r) => {
      const pctLabel = r.score != null && Number(r.max_score) > 0 ? `${Math.round(Number(r.score) / Number(r.max_score) * 100)}%` : "Chờ đánh giá theo rubric";
      return `<tr><td><code>${escapeHtml(r.id)}</code></td><td>${escapeHtml(r.title_vi || r.exercise_id)}</td><td><strong>${pctLabel}</strong></td><td><span class="wb-badge">${escapeHtml({ auto_graded: "Đã chấm", partially_graded: "Đã chấm một phần", pending_manual_review: "Chờ nhận xét" }[r.grading_status] || "Đang xử lý")}</span></td><td>${escapeHtml(r.submitted_at)}</td><td><a href="/practice/results/${escapeHtml(r.id)}" class="wb-btn wb-btn-outline wb-btn-sm">Xem</a></td></tr>`;
    }).join("") || '<tr><td colspan="6">Bạn chưa có bài nộp nào.</td></tr>'}</tbody>
      </table></div></div>`
  }));
}
__name(renderPracticeHistoryPage, "renderPracticeHistoryPage");
async function renderPracticeResultPage({ db, user, resultId }) {
  if (!user) return redirectResponse(signInUrl(`/practice/results/${resultId}`, "practice.result"));
  const r = await db.prepare("SELECT r.*, e.title_vi FROM wb_public_practice_results r LEFT JOIN wb_public_practice_exercises e ON e.id = r.exercise_id WHERE r.id = ? AND r.account_id = ?").bind(resultId, user.accountId).first();
  if (!r) return htmlResponse(renderPublicPage({ title: "Không tìm thấy kết quả", user, contentHtml: '<div class="wb-alert wb-alert-error">Kết quả không tồn tại hoặc không thuộc tài khoản hiện tại.</div>' }), 404);
  const feedback = safeJson3(r.feedback_json, []);
  const pctLabel = r.score != null && Number(r.max_score) > 0 ? `${Math.round(Number(r.score) / Number(r.max_score) * 100)}% (${r.score}/${r.max_score})` : "Chờ đánh giá theo rubric";
  return htmlResponse(renderPublicPage({
    title: "Kết quả luyện tập",
    currentPath: "/practice/history",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Cổng Luyện Tập", href: "/practice" }, { label: "Kết quả" }],
    user,
    contentHtml: `
      <div class="wb-card">
        <h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(r.title_vi || r.exercise_id)}</h1>
        <p><strong>Điểm đạt được:</strong> ${escapeHtml(pctLabel)} · <strong>Trạng thái:</strong> <span class="wb-badge">${escapeHtml({ auto_graded: "Đã chấm", partially_graded: "Đã chấm một phần", pending_manual_review: "Chờ nhận xét" }[r.grading_status] || "Đang xử lý")}</span></p>
        ${Array.isArray(feedback) && feedback.length ? `
          <h3>Chi tiết câu trả lời</h3>
          <ul>${feedback.map((f) => `<li><strong>${escapeHtml(f.prompt || f.questionId)}</strong> — ${f.graded ? f.correct ? "Đúng" : "Cần cải thiện" : escapeHtml(f.noteVi || "Chờ chấm")}${f.explanationVi ? ` · ${escapeHtml(f.explanationVi)}` : ""}</li>`).join("")}</ul>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
          <a href="/practice/${escapeHtml(r.skill || "")}" class="wb-btn wb-btn-primary wb-btn-sm">Luyện lại kỹ năng</a>
          <a href="/my-mistakes" class="wb-btn wb-btn-outline wb-btn-sm">Xem My Mistakes</a>
          <a href="/practice/history" class="wb-btn wb-btn-ghost wb-btn-sm">Practice Insights</a>
        </div>
      </div>`
  }));
}
__name(renderPracticeResultPage, "renderPracticeResultPage");

// src/pages/specialized-meet-pages.js
async function renderSpecializedPage({ db, user, subSlug = "" }) {
  let heading = "Ngoại ngữ chuyên ngành (Tiếng Trung & Tiếng Anh)";
  let terms = [];
  if (subSlug === "chinese") {
    heading = "Tiếng Trung chuyên ngành";
    terms = await safeQueryAll(db, "SELECT * FROM wb_public_dictionary_entries WHERE language_code = 'zh' AND specialized_domain IS NOT NULL LIMIT 30");
  } else if (subSlug === "english") {
    heading = "Tiếng Anh chuyên ngành";
    terms = await safeQueryAll(db, "SELECT * FROM wb_public_dictionary_entries WHERE language_code = 'en' AND specialized_domain IS NOT NULL LIMIT 30");
  } else if (subSlug) {
    const dom = SPECIALIZED_DOMAINS.find((d) => d.slug === subSlug);
    if (!dom) {
      return htmlResponse(renderPublicPage({ title: "Không tìm thấy chuyên ngành", currentPath: `/specialized/${subSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Nhóm chuyên ngành không tồn tại.</div>' }), 404);
    }
    heading = `Ngoại ngữ chuyên ngành: ${dom.nameVi}`;
  } else {
    try {
      terms = await safeQueryAll(db, "SELECT * FROM wb_public_dictionary_entries WHERE specialized_domain IS NOT NULL LIMIT 18");
    } catch {
      terms = [];
    }
  }
  const activeDomain = subSlug ? SPECIALIZED_DOMAINS.find((d) => d.slug === subSlug) : null;

  if (activeDomain) {
    const enTotal = activeDomain.enCount || Math.floor(activeDomain.count / 2);
    const zhTotal = activeDomain.zhCount || Math.ceil(activeDomain.count / 2);
    const domainContentHtml = `
      <section class="wb-specialized-hero" style="margin-bottom:20px;">
        <div class="wb-specialized-hero-copy">
          <span class="wb-eyebrow">Ngoại ngữ chuyên ngành · Song ngữ Anh – Trung</span>
          <h1>${escapeHtml(activeDomain.nameVi)}</h1>
          <p>Học và tra cứu trực tiếp <strong>${activeDomain.count.toLocaleString("vi-VN")} thuật ngữ</strong> chuyên ngành ${escapeHtml(activeDomain.nameVi)} (Anh – Trung), đầy đủ phiên âm IPA/Pinyin, nghĩa tiếng Việt, chủ đề và phát âm chuẩn.</p>
          <div class="wb-specialized-language-switch" style="margin-top:18px;">
            <a href="/specialized" class="wb-specialized-language"><strong>←</strong><span>Quay lại danh mục chuyên ngành</span></a>
            <a href="/dictionary" class="wb-specialized-language"><strong>A-Z</strong><span>Mở từ điển ngôn ngữ</span></a>
          </div>
        </div>
        <aside class="wb-specialized-scope">
          <span class="wb-badge wb-badge-aqua">Kho thuật ngữ chuyên ngành</span>
          <strong>${activeDomain.count.toLocaleString("vi-VN")} thuật ngữ</strong>
          <p>Tiếng Anh: ${enTotal.toLocaleString("vi-VN")} từ · Tiếng Trung: ${zhTotal.toLocaleString("vi-VN")} từ</p>
        </aside>
      </section>

      ${KNOWN_VOCAB_SLUGS.has(activeDomain.slug) ? `
      <section id="wb-vocab-explorer" class="wb-card" data-domain-slug="${escapeHtml(activeDomain.slug)}" data-is-authenticated="${user ? "true" : "false"}" style="margin-top:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <div>
            <span class="wb-badge wb-badge-aqua">KHO THUẬT NGỮ TRỰC TIẾP · SONG NGỮ ANH – TRUNG</span>
            <h2 style="margin:6px 0 0;color:var(--wb-teal);">${escapeHtml(activeDomain.nameVi)} (${activeDomain.count.toLocaleString("vi-VN")} thuật ngữ)</h2>
          </div>
          <div id="wb-vocab-stats" class="wb-muted" style="font-size:0.9rem;">Đang tải kho thuật ngữ...</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          <input id="wb-vocab-search" class="wb-input" style="flex:1;min-width:200px;" placeholder="Tìm kiếm thuật ngữ tiếng Anh, tiếng Trung hoặc nghĩa tiếng Việt..." />
          <select id="wb-vocab-lang" class="wb-select" style="min-width:155px;">
            <option value="">Tất cả ngôn ngữ (EN + ZH)</option>
            <option value="en">Tiếng Anh (EN · ${enTotal.toLocaleString("vi-VN")} từ)</option>
            <option value="zh">Tiếng Trung (ZH · ${zhTotal.toLocaleString("vi-VN")} từ)</option>
          </select>
          <select id="wb-vocab-src" class="wb-select" style="min-width:170px;">
            <option value="">Tất cả nguồn dữ liệu</option>
            <option value="excel">Dữ liệu Excel gốc</option>
            <option value="wb_v43">Biên soạn mở rộng (+1.000 từ)</option>
          </select>
          <select id="wb-vocab-topic" class="wb-select" style="min-width:190px;">
            <option value="">Tất cả chủ đề</option>
          </select>
        </div>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead><tr><th>#</th><th>Thuật ngữ</th><th>IPA / Pinyin</th><th>Nghĩa tiếng Việt &amp; Ví dụ</th><th>Chủ đề</th><th>Thao tác</th></tr></thead>
            <tbody id="wb-vocab-list"><tr><td colspan="6" style="text-align:center;padding:20px;">Đang nạp thuật ngữ...</td></tr></tbody>
          </table>
        </div>
        <div id="wb-vocab-pager" style="display:flex;justify-content:center;gap:10px;align-items:center;margin-top:14px;"></div>
      </section>
      <script src="/scripts/vocab-explorer.js?v=5.3.0" defer></script>` : `<div class="wb-card"><p>Dữ liệu thuật ngữ cho chuyên ngành này đang được cập nhật.</p></div>`}

      <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <a href="/specialized" class="wb-btn wb-btn-outline">← Chọn chuyên ngành khác</a>
        <a href="/practice/vocabulary" class="wb-btn wb-btn-primary">Luyện tập từ vựng →</a>
      </div>
    `;
    return htmlResponse(renderPublicPage({
      title: heading,
      currentPath: `/specialized/${activeDomain.slug}`,
      breadcrumbs: [
        { label: "Trang chủ", href: "/" },
        { label: "Ngoại ngữ chuyên ngành", href: "/specialized" },
        { label: activeDomain.nameVi }
      ],
      user,
      contentHtml: domainContentHtml
    }));
  }

  const languageFilter = subSlug === "chinese" ? "zh" : subSlug === "english" ? "en" : "";
  const visibleDomains = languageFilter ? SPECIALIZED_DOMAINS.filter((d) => d.languages.includes(languageFilter)) : SPECIALIZED_DOMAINS;
  const contentHtml = `
    <section class="wb-specialized-hero">
      <div class="wb-specialized-hero-copy">
        <span class="wb-eyebrow">Ngoại ngữ chuyên ngành · WORD BRIDGE</span>
        <h1>${escapeHtml(heading)}</h1>
        <p>Học ngôn ngữ trong đúng bối cảnh nghề nghiệp: <strong>22 chuyên ngành song ngữ Anh – Trung (46.104 thuật ngữ thực tế)</strong>, mở trực tiếp để học từ vựng, ví dụ, phát âm và luyện tập ngay không cần chuyển hướng.</p>
        <div class="wb-specialized-language-switch" aria-label="Chọn ngôn ngữ chuyên ngành">
          <a href="/specialized/chinese" class="wb-specialized-language ${subSlug === "chinese" ? "active" : ""}"><strong>中文</strong><span>Tiếng Trung chuyên ngành (22 ngành)</span></a>
          <a href="/specialized/english" class="wb-specialized-language ${subSlug === "english" ? "active" : ""}"><strong>EN</strong><span>Tiếng Anh chuyên ngành (22 ngành)</span></a>
        </div>
      </div>
      <aside class="wb-specialized-scope">
        <span class="wb-badge wb-badge-aqua">Phạm vi hiện hành</span>
        <strong>Tiếng Trung & Tiếng Anh</strong>
        <p>Chuyên ngành hiện chỉ áp dụng cho hai ngôn ngữ này.</p>
      </aside>
    </section>

    <section class="wb-section-block">
      <div class="wb-section-heading">
        <div><span class="wb-eyebrow">Khám phá theo lĩnh vực</span><h2>${languageFilter ? `Chuyên ngành dành cho ${languageFilter === "zh" ? "Tiếng Trung" : "Tiếng Anh"}` : "Danh mục chuyên ngành"}</h2></div>
        ${subSlug ? '<a href="/specialized" class="wb-btn wb-btn-ghost wb-btn-sm">Xem tất cả</a>' : ""}
      </div>
      <div class="wb-specialized-domain-grid">
        ${visibleDomains.map((d, index) => `
          <a href="/specialized/${escapeHtml(d.slug)}" class="wb-specialized-domain-card">
            <span class="wb-domain-index">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>${escapeHtml(d.nameVi)}</h3>
              <p>${d.languages.map((code) => code === "zh" ? "Tiếng Trung" : "Tiếng Anh").join(" · ")}${d.count ? ` · ${d.count.toLocaleString("vi-VN")} thuật ngữ` : ""}</p>
            </div>
            <span class="wb-domain-arrow" aria-hidden="true">→</span>
          </a>`).join("")}
      </div>
    </section>

    <section class="wb-section-block">
      <div class="wb-section-heading">
        <div><span class="wb-eyebrow">Kho thuật ngữ</span><h2>Thuật ngữ chuyên môn trong ngữ cảnh</h2></div>
        <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Mở từ điển</a>
      </div>
      <div class="wb-specialized-term-grid">
        ${terms.map((t) => `
          <article class="wb-specialized-term-card">
            <div class="wb-term-meta">
              <span class="wb-badge">${escapeHtml(t.language_code.toUpperCase())}</span>
              ${t.specialized_domain ? `<span>${escapeHtml(SPECIALIZED_DOMAINS.find((d) => d.slug === t.specialized_domain)?.nameVi || t.specialized_domain)}</span>` : ""}
            </div>
            <h3><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[t.language_code].slug)}/${escapeHtml(t.slug)}" data-learning-content>${escapeHtml(t.headword)}</a></h3>
            ${t.phonetic ? `<div class="wb-phonetic">${escapeHtml(t.phonetic)}</div>` : ""}
            <p class="wb-term-meaning" data-learning-content>${escapeHtml(t.meaning_vi)}</p>
            <a class="wb-term-link" href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[t.language_code].slug)}/${escapeHtml(t.slug)}">Xem mục từ <span>→</span></a>
          </article>`).join("") || `<div class="wb-specialized-empty"><strong>Chọn một chuyên ngành ở trên để mở trực tiếp kho thuật ngữ song ngữ.</strong><p>${user ? "Sử dụng bộ lọc hoặc lưu thuật ngữ vào Sổ từ cá nhân để học Flashcard." : `Đăng nhập tại <a href="${escapeHtml(signInUrl(subSlug ? `/specialized/${subSlug}` : "/specialized", "specialized.search"))}">Portal</a> để tra cứu và lưu thuật ngữ chuyên ngành.`}</p></div>`}
      </div>
    </section>
  `;
  const publishedMap = Object.fromEntries(SPECIALIZED_VOCAB_DATASETS.map((d) => [d.slug, d.count]));
  const grouped100 = SPECIALIZED_100_DOMAINS.reduce((acc, item) => {
    (acc[item.categoryNameVi] ||= []).push(item);
    return acc;
  }, {});
  const catalog100Html = `
    <section class="wb-card" style="margin-top:24px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Danh mục 100 lĩnh vực chuyên ngành Trung – Anh (${SPECIALIZED_100_DOMAINS.length} mã chuyên ngành độc lập)</h2>
      <p class="wb-muted">Số lượng thuật ngữ hiển thị động theo dữ liệu thực đã kiểm duyệt và xuất bản (mục 100 đã tách độc lập thành Thời trang, Bất động sản, Quản lý sự kiện và Dịch vụ khách hàng).</p>
      ${Object.entries(grouped100).map(([cat, items]) => `
        <details style="margin-bottom:10px;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;">
          <summary style="cursor:pointer;font-weight:700;color:var(--wb-teal);">${escapeHtml(cat)} (${items.length} chuyên ngành)</summary>
          <div class="wb-grid-3" style="margin-top:10px;">
            ${items.map((it) => {
              const cnt = it.datasetSlug ? publishedMap[it.datasetSlug] || 0 : 0;
              return `<div style="padding:8px 10px;background:#f8fafc;border-radius:8px;font-size:0.88rem;">
                <strong>${it.itemNumber}. ${escapeHtml(it.nameVi)}</strong><br/>
                <span class="wb-muted">${escapeHtml(it.nameEn)}</span><br/>
                ${cnt > 0 ? `<a href="/specialized/${escapeHtml(it.datasetSlug)}" style="color:var(--wb-teal);font-weight:600;">${cnt.toLocaleString("vi-VN")} thuật ngữ đã xuất bản →</a>` : `<span class="wb-muted" style="font-size:0.8rem;">Đang biên soạn theo lộ trình (0 thuật ngữ đã xuất bản)</span>`}
              </div>`;
            }).join("")}
          </div>
        </details>`).join("")}
    </section>`;
  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath: subSlug ? `/specialized/${subSlug}` : "/specialized",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Ngoại ngữ chuyên ngành", href: "/specialized" }, ...subSlug ? [{ label: heading }] : []],
    user,
    contentHtml: contentHtml + catalog100Html
  }));
}
__name(renderSpecializedPage, "renderSpecializedPage");
async function renderLearnerMeetPage({ db, services, user, subPath = "", param = "" }) {
  const providerStatus = services.learnerMeet.getProviderStatus();
  const currentPath = subPath ? `/learner-meet/${subPath}${param ? `/${param}` : ""}` : "/learner-meet";
  if (["create", "history", "room", "join"].includes(subPath) && !user) {
    return redirectResponse(signInUrl(currentPath, "meet.join"));
  }
  let body = "";
  let title = "Learner Meet — Thực hành Âm thanh & Video";
  if (subPath === "create") {
    title = "Tạo phiên Learner Meet";
    body = `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/learner-meet/sessions" data-render-json="lm-create-out">
        <div class="wb-field">
          <label>Ngôn ngữ thực hành</label>
          <select class="wb-select" name="languageCode">
            <option value="zh">Tiếng Trung (zh)</option>
            <option value="en">Tiếng Anh (en)</option>
            
          </select>
        </div>
        <div class="wb-field">
          <label>Hình thức</label>
          <select class="wb-select" name="mode">
            <option value="one_to_one">Thực hành 1–1 (2 người)</option>
            <option value="group">Thực hành nhóm (tối đa 8 người)</option>
          </select>
        </div>
        <div class="wb-field"><label>Chủ đề thực hành</label><input class="wb-input" name="topicVi" required placeholder="Ví dụ: Luyện hội thoại đặt lịch họp bằng tiếng Anh" /></div>
        <div class="wb-field"><label>Số người tối đa (2–8)</label><input class="wb-input" type="number" name="maxParticipants" min="2" max="8" value="2" /></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Tạo phiên thực hành</button>
      </form>
      <pre id="lm-create-out" style="font-size:0.82rem;overflow:auto;"></pre>`;
  } else if (subPath === "sessions" || subPath === "history") {
    title = subPath === "history" ? "Lịch sử tham gia Learner Meet" : "Danh sách phiên Learner Meet";
    const sessions = (await db.prepare("SELECT * FROM wb_public_learner_meet_sessions ORDER BY created_at DESC LIMIT 20").all()).results || [];
    body = sessions.length ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã phiên</th><th>Ngôn ngữ</th><th>Chủ đề</th><th>Trạng thái</th><th>Phòng</th></tr></thead><tbody>${sessions.map((s) => `<tr><td><strong>${escapeHtml(s.session_code)}</strong></td><td>${escapeHtml(s.language_code.toUpperCase())}</td><td>${escapeHtml(s.topic_vi)}</td><td>${escapeHtml(s.status)}</td><td><a href="/learner-meet/room/${escapeHtml(s.room_id)}">Mở phòng</a></td></tr>`).join("")}</tbody></table></div>` : '<div class="wb-alert wb-alert-info">Hiện chưa có phiên Learner Meet nào đang mở.</div>';
  } else if (subPath === "room") {
    title = `Phòng thực hành ${param}`;
    body = `
      <div class="wb-card">
        <h3>Phòng thực hành: ${escapeHtml(param)}</h3>
        <p><strong>Trạng thái phòng:</strong> <span class="wb-badge wb-badge-ok">Sẵn sàng</span></p>
        <p class="wb-muted">${escapeHtml(providerStatus.noteVi)}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;">
          <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-device-check>Kiểm tra Micro & Camera</button>
          <a href="/learner-meet/sessions" class="wb-btn wb-btn-outline wb-btn-sm">Rời phòng</a>
        </div>
        <div id="wb-device-status" class="wb-muted" style="font-size:0.9rem;"></div>
      </div>`;
  } else {
    body = `
      <div class="wb-grid-2">
        <div class="wb-card">
          <h3>Thực hành giao tiếp trực tiếp 1–1 & Nhóm</h3>
          <p>Hỗ trợ bật/tắt micro, bật/tắt camera và kết nối theo chủ đề cho Tiếng Trung, Tiếng Anh. Tham gia trực tiếp trên nền tảng thống nhất wordbridge.io.vn sau khi đăng nhập.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            ${user ? `<a href="/learner-meet/sessions" class="wb-btn wb-btn-primary wb-btn-sm">Danh sách phiên</a>
                 <a href="/learner-meet/create" class="wb-btn wb-btn-ghost wb-btn-sm">Tạo phiên mới</a>` : `<a href="${escapeHtml(signInUrl("/learner-meet", "meet.join"))}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập để tham gia</a>
                 <a href="/learner-meet/sessions" class="wb-btn wb-btn-outline wb-btn-sm">Xem danh sách phiên</a>`}
          </div>
        </div>
        <div class="wb-card wb-card-warm">
          <h3>Các giới hạn tuyệt đối của Learner Meet</h3>
          <ul>
            <li>Không có chat văn bản, không nhắn tin cá nhân/nhóm, không gửi tệp, không bình luận.</li>
            <li>Không livestream công khai, không chia sẻ màn hình.</li>
            <li>Không có nút ghi âm/ghi hình, không lưu bản ghi, không Recording API.</li>
            <li>Chỉ lưu metadata vận hành tối thiểu (thời gian tham gia/rời, trạng thái phiên).</li>
          </ul>
        </div>
      </div>`;
  }
  const contentHtml = `
    <h1>${escapeHtml(title)}</h1>
    <div class="wb-alert wb-alert-warn">${escapeHtml(LEARNER_MEET_DISCLAIMER_VI)}</div>
    ${body}
  `;
  return htmlResponse(renderPublicPage({
    title,
    currentPath,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Learner Meet", href: "/learner-meet" }],
    user,
    contentHtml
  }));
}
__name(renderLearnerMeetPage, "renderLearnerMeetPage");

// src/pages/intelligence-pages.js
function renderIntelligenceHub({ user }) {
  const cards = INTELLIGENCE_SYSTEMS.map((sys) => `
    <article class="wb-card">
      <span class="wb-badge">${escapeHtml(sys.code)} · ${sys.languages.join("/").toUpperCase()}</span>
      <h3 style="margin-top:8px;"><a href="/intelligence/${escapeHtml(sys.slug)}">${escapeHtml(sys.nameVi)}</a></h3>
      <p class="wb-muted" style="font-size:0.9rem;">${escapeHtml(sys.descriptionVi)}</p>
      <a href="/intelligence/${escapeHtml(sys.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở hệ thống</a>
    </article>
  `).join("");
  const contentHtml = `
    <h1>15 Hệ thống Trí tuệ Ngôn ngữ WORD BRIDGE</h1>
    <p class="wb-muted">Mỗi công cụ có không gian phân tích riêng, hiển thị phương pháp đánh giá rõ ràng và lưu lại lịch sử tiến bộ của bạn.</p>
    <div class="wb-grid-3">${cards}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: "15 Hệ thống Trí tuệ Ngôn ngữ",
    currentPath: "/intelligence",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "15 Hệ thống Trí tuệ Ngôn ngữ" }],
    user,
    contentHtml
  }));
}
__name(renderIntelligenceHub, "renderIntelligenceHub");
async function renderIntelligenceSystemPage({ services, user, systemSlug }) {
  const spec = SYSTEM_SPEC_MAP.get(systemSlug);
  if (!spec) {
    return htmlResponse(renderPublicPage({
      title: "Không tìm thấy hệ thống trí tuệ",
      currentPath: `/intelligence/${systemSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">Hệ thống trí tuệ ngôn ngữ không tồn tại.</div>'
    }), 404);
  }
  const history = user ? await services.intelligence.listHistory(user.accountId, systemSlug, 10) : [];
  const langOptions = spec.languages.map((code) => {
    const label = code === "zh" ? "Tiếng Trung (zh)" : "Tiếng Anh (en)";
    return `<option value="${code}">${label}</option>`;
  }).join("");
  const runnerHtml = user ? `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/intelligence/${escapeHtml(spec.slug)}/run" data-render-json="intel-result-box">
        <h3>Chạy phân tích ${escapeHtml(spec.nameVi)}</h3>
        <div class="wb-field">
          <label>Ngôn ngữ phân tích</label>
          <select class="wb-select" name="languageCode">${langOptions}</select>
        </div>
        <div class="wb-field">
          <label>Văn bản / Ngữ liệu đầu vào (tùy chọn tùy hệ thống)</label>
          <textarea class="wb-textarea" name="inputText" rows="4" placeholder="Nhập câu, đoạn văn hoặc ngữ cảnh cần phân tích..."></textarea>
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Chạy phân tích & Lưu lịch sử</button>
      </form>
      <pre id="intel-result-box" class="wb-card" style="font-size:0.82rem;overflow:auto;margin-top:16px;">Kết quả phân tích JSON sẽ hiển thị tại đây sau khi chạy.</pre>
    ` : `<div class="wb-alert wb-alert-info">Khách chưa đăng nhập được xem mô tả phương pháp và cấu trúc hệ thống. Vui lòng <a href="/login">đăng nhập</a> để chạy phân tích cá nhân và lưu lịch sử.</div>`;
  const contentHtml = `
    <span class="wb-badge">${escapeHtml(spec.code)} · Phạm vi: ${spec.languages.join(", ").toUpperCase()}</span>
    <h1>${escapeHtml(spec.nameVi)}</h1>
    <p class="wb-muted">${escapeHtml(spec.descriptionVi)}</p>
    <div class="wb-card wb-card-warm" style="margin-bottom:18px;">
      <strong>Minh bạch phương pháp & Giới hạn kỹ thuật:</strong>
      <p style="margin:6px 0 0;font-size:0.9rem;">Hệ thống phân tích trực tiếp từ dữ liệu học tập thực tế của bạn (bài học, bài luyện tập và sổ từ vựng) theo các tiêu chí ngôn ngữ học chuẩn hóa.</p>
    </div>
    ${runnerHtml}
    ${history.length ? `<h2 style="margin-top:24px;">Lịch sử phân tích gần đây</h2><div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Thời gian</th><th>Ngôn ngữ</th><th>Độ tin cậy</th><th>Trạng thái</th></tr></thead><tbody>${history.map((h) => `<tr><td>${escapeHtml(h.created_at)}</td><td>${escapeHtml(h.language_code.toUpperCase())}</td><td>${escapeHtml(h.confidence_level)}</td><td>${escapeHtml(h.status)}</td></tr>`).join("")}</tbody></table></div>` : ""}
  `;
  return htmlResponse(renderPublicPage({
    title: spec.nameVi,
    currentPath: `/intelligence/${spec.slug}`,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "15 Hệ thống Trí tuệ", href: "/intelligence" }, { label: spec.nameVi }],
    user,
    contentHtml
  }));
}
__name(renderIntelligenceSystemPage, "renderIntelligenceSystemPage");

// src/pages/account-pages.js
function renderLoginPage({ user, url = null, services = null }) {
  const nextRaw = url?.searchParams?.get("next") || "/my-learning";
  const candidateNext = safeReturnUrl(nextRaw);
  const safeNext = /^\/(?:quan-tri|admin)(?:\/|$)/i.test(candidateNext) ? "/my-learning" : candidateNext;
  if (user) return redirectResponse(safeNext);
  const contentHtml = `
    <h1 class="wb-page-title">Đăng nhập WORD BRIDGE</h1>
    <div class="wb-login-grid">
      <div class="wb-login-card">
        <form class="wb-form" data-api-endpoint="/api/v1/auth/login" data-redirect-to="${escapeHtml(safeNext)}">
          <div class="wb-field">
            <label for="field-email">Email</label>
            <div class="wb-input-wrap">
              <span class="wb-input-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span>
              <input id="field-email" class="wb-input wb-input-has-icon" type="email" name="email" placeholder="Nhập email của bạn" required autocomplete="email" />
            </div>
          </div>
          <div class="wb-field">
            <label for="field-password">Mật khẩu</label>
            <div class="wb-input-wrap">
              <span class="wb-input-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
              <input id="field-password" class="wb-input wb-input-has-icon wb-input-has-toggle" type="password" name="password" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
              <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-password" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
            </div>
          </div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary wb-btn-block wb-btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Đăng nhập</span>
          </button>
        </form>
        <div class="wb-login-divider"><span>Hoặc</span></div>
        <button type="button" class="wb-btn wb-btn-outline wb-btn-block" data-passkey="authenticate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.15-8.15"/><path d="m16 7 3 3"/><path d="m19 4 2 2"/></svg>
          <span>Đăng nhập bằng Passkey</span>
        </button>
        <p data-passkey-status role="status" class="wb-muted" style="font-size:0.84rem;text-align:center;margin:8px 0 0;"></p>
        ${(() => {
          const configuredOAuth = (services?.oauth?.listAllProvidersStatus?.() || []).filter((p) => p.configured);
          if (!configuredOAuth.length) return "";
          return `<div class="wb-login-divider"><span>Đăng nhập nhanh (OAuth)</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${configuredOAuth.map((p) => `<a class="wb-btn wb-btn-outline wb-btn-sm" href="/api/v1/auth/oauth/${p.provider}/start?next=${encodeURIComponent(safeNext)}">${escapeHtml(p.label)}</a>`).join("")}</div>`;
        })()}
        <p class="wb-login-links"><a href="/forgot-password">Quên mật khẩu?</a> <span>·</span> Chưa có tài khoản? <a href="/register" class="wb-link-accent">Đăng ký ngay</a></p>
      </div>

      <div class="wb-why-card">
        <h2 class="wb-why-title">Vì sao chọn WORD BRIDGE?</h2>
        <p class="wb-why-sub">Nền tảng học ngôn ngữ và kết nối người học toàn cầu.</p>
        <div class="wb-why-grid">
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></span>
            <h3>Học tập linh hoạt</h3>
            <p>Theo năng lực và mục tiêu cá nhân</p>
          </div>
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
            <h3>Luyện tập chuyên sâu</h3>
            <p>Nghe · Nói · Đọc · Viết đồng bộ</p>
          </div>
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <h3>Kết nối cộng đồng</h3>
            <p>Giao lưu, học hỏi với người học toàn cầu</p>
          </div>
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
            <h3>Thư viện phong phú</h3>
            <p>Tài liệu, bài đọc và nội dung chuyên ngành</p>
          </div>
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
            <h3>An toàn & Bảo mật</h3>
            <p>Bảo vệ tài khoản và dữ liệu người dùng</p>
          </div>
          <div class="wb-why-item">
            <span class="wb-why-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>
            <h3>Sử dụng mọi thiết bị</h3>
            <p>Trải nghiệm mượt mà trên máy tính và di động</p>
          </div>
        </div>
      </div>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: "Đăng nhập",
    currentPath: "/login",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Đăng nhập" }],
    user,
    contentHtml
  }));
}
__name(renderLoginPage, "renderLoginPage");
function renderRegisterPage({ user }) {
  if (user) return redirectResponse("/my-learning");
  const contentHtml = `
    <h1 class="wb-page-title">Đăng ký tài khoản cá nhân WORD BRIDGE</h1>
    <p class="wb-muted" style="margin:0 0 20px;">Tạo tài khoản WORD BRIDGE để học tập, luyện tập và kết nối cộng đồng ngôn ngữ. Vui lòng cung cấp đầy đủ thông tin cá nhân, trường học và đơn vị công tác để hoàn tất đăng ký.</p>
    <form class="wb-form wb-card wb-register-card" data-api-endpoint="/api/v1/auth/register">
      <div class="wb-field"><label for="field-fullName">1. Họ và tên <span class="wb-req">*</span></label><input id="field-fullName" class="wb-input" name="fullName" placeholder="Nhập họ và tên" required /></div>
      <div class="wb-field"><label for="field-dateOfBirth">2. Ngày sinh <span class="wb-req">*</span></label><input id="field-dateOfBirth" class="wb-input" type="date" name="dateOfBirth" required /></div>
      <div class="wb-field"><label for="field-phoneNumber">3. Số điện thoại <span class="wb-req">*</span></label><input id="field-phoneNumber" class="wb-input" name="phoneNumber" placeholder="Nhập số điện thoại" required /></div>
      <div class="wb-field"><label for="field-email">4. Email <span class="wb-req">*</span></label><input id="field-email" class="wb-input" type="email" name="email" placeholder="Nhập email" required /></div>
      <div class="wb-field">
        <label for="field-password">5. Mật khẩu (tối thiểu 10 ký tự gồm hoa, thường, số) <span class="wb-req">*</span></label>
        <div class="wb-input-wrap">
          <input id="field-password" class="wb-input wb-input-has-toggle" type="password" name="password" placeholder="Nhập mật khẩu" required />
          <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-password" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <div class="wb-field">
        <label for="field-confirmPassword">6. Xác nhận mật khẩu <span class="wb-req">*</span></label>
        <div class="wb-input-wrap">
          <input id="field-confirmPassword" class="wb-input wb-input-has-toggle" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required />
          <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-confirmPassword" aria-label="Hiện hoặc ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </div>
      <div class="wb-field"><label for="field-schoolName">7. Trường học (nhập Trường học hoặc Nơi làm việc) *</label><input id="field-schoolName" class="wb-input" name="schoolName" placeholder="Nhập tên trường học" /></div>
      <div class="wb-field"><label for="field-workplaceName">8. Nơi làm việc / tổ chức công tác</label><input id="field-workplaceName" class="wb-input" name="workplaceName" placeholder="Nhập tên cơ quan, tổ chức nơi làm việc" /></div>
      <div class="wb-field" style="grid-column:1/-1;">
        <label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;">
          <input type="checkbox" name="termsAccepted" value="1" required />
          <span>Tôi đã đọc và đồng ý với <a href="/policies/terms" target="_blank">Điều khoản sử dụng</a> và đã được thông báo về việc xử lý dữ liệu theo <a href="/policies/privacy" target="_blank">Chính sách quyền riêng tư</a>.</span>
        </label>
      </div>
      <div data-form-status></div>
      <button type="submit" class="wb-btn wb-btn-primary wb-btn-block wb-btn-lg">Tạo tài khoản & Bắt đầu học ngay →</button>
    </form>
  `;
  return htmlResponse(renderPublicPage({
    title: "Đăng ký tài khoản",
    currentPath: "/register",
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Đăng ký" }],
    user,
    contentHtml
  }));
}
__name(renderRegisterPage, "renderRegisterPage");
async function renderVerifyEmailPage({ services, url, request }) {
  const token = url.searchParams.get("token");
  if (!token) {
    return htmlResponse(renderPublicPage({
      title: "Xác minh email",
      currentPath: "/verify-email",
      contentHtml: '<h1>Xác minh địa chỉ email</h1><div class="wb-alert wb-alert-info">Vui lòng mở liên kết xác minh một lần đã được gửi tới hộp thư của bạn (không sử dụng mã OTP).</div>'
    }));
  }
  const res = await services.auth.verifyEmailToken(token, {
    ipAddress: request.headers.get("CF-Connecting-IP") || "127.0.0.1",
    userAgent: request.headers.get("User-Agent") || "Browser"
  });
  if (!res.ok) {
    return htmlResponse(renderPublicPage({
      title: "Xác minh email thất bại",
      currentPath: "/verify-email",
      contentHtml: `<h1>Xác minh email thất bại</h1><div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div><a href="${escapeHtml(signInUrl("/my-learning", "verify.retry"))}" class="wb-btn wb-btn-outline">Về trang đăng nhập</a>`
    }), 400);
  }
  return redirectResponse("/my-learning", 302, {
    "Set-Cookie": buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, url.protocol === "https:")
  });
}
__name(renderVerifyEmailPage, "renderVerifyEmailPage");
function renderPasswordPage({ mode = "forgot", user, url = null }) {
  const isReset = mode === "reset";
  const token = url?.searchParams?.get("token") || "";
  const contentHtml = isReset ? `<h1>Đặt lại mật khẩu</h1>
       <form class="wb-form wb-card" data-api-endpoint="/api/v1/auth/reset-password" data-redirect-to="/login">
         <p class="wb-muted">Nhập mật khẩu mới an toàn (tối thiểu 10 ký tự, gồm chữ hoa, chữ thường và chữ số).</p>
         <div class="wb-field"><label for="field-token">Mã xác nhận khôi phục *</label><input id="field-token" class="wb-input" name="token" value="${escapeHtml(token)}" required /></div>
         <div class="wb-field"><label for="field-newPassword">Mật khẩu mới *</label><input id="field-newPassword" class="wb-input" type="password" name="newPassword" required /></div>
         <div class="wb-field"><label for="field-confirmPassword">Xác nhận mật khẩu mới *</label><input id="field-confirmPassword" class="wb-input" type="password" name="confirmPassword" required /></div>
         <div data-form-status></div>
         <button type="submit" class="wb-btn wb-btn-primary">Cập nhật mật khẩu mới</button>
       </form>` : `<h1>Quên mật khẩu</h1>
       <form class="wb-form wb-card" data-api-endpoint="/api/v1/auth/forgot-password">
         <div class="wb-field"><label for="field-email">Email tài khoản</label><input id="field-email" class="wb-input" type="email" name="email" required /></div>
         <div data-form-status></div>
         <button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết khôi phục mật khẩu</button>
       </form>`;
  return htmlResponse(renderPublicPage({
    title: isReset ? "Đặt lại mật khẩu" : "Quên mật khẩu",
    currentPath: isReset ? "/reset-password" : "/forgot-password",
    user,
    contentHtml
  }));
}
__name(renderPasswordPage, "renderPasswordPage");
function formatDateVi(raw) {
  if (!raw) return "Chưa cập nhật";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return s;
  return m[4] ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : `${m[3]}/${m[2]}/${m[1]}`;
}
function formatShortDateVi(raw) {
  if (!raw) return "—";
  const m = String(raw).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(raw);
}
function parseDeviceLabel(ua = "") {
  const s = String(ua || "");
  if (!s) return { label: "Trình duyệt web", isMobile: false };
  let os = "Thiết bị web";
  let isMobile = false;
  if (/Android/i.test(s)) { os = "Android"; isMobile = true; }
  else if (/iPhone|iPad|iOS/i.test(s)) { os = "iOS"; isMobile = true; }
  else if (/Windows/i.test(s)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";
  let browser = "Trình duyệt";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) browser = "Chrome";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) browser = "Safari";
  return { label: `${os} · ${browser}`, isMobile };
}
function maskIpForDisplay(ip) {
  if (!ip) return "Chưa ghi nhận";
  const str = String(ip).trim();
  const v4 = str.split(".");
  if (v4.length === 4) return `${v4[0]}.${v4[1]}.***.${v4[3]}`;
  return str.length > 16 ? `${str.slice(0, 8)}***${str.slice(-4)}` : str;
}
function renderAccountDecorBanner() {
  return `<div class="wb-acct-side-art" aria-hidden="true">
    <svg viewBox="0 0 320 130" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="wbMtnBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c9e9e6"/>
          <stop offset="55%" stop-color="#76bab7"/>
          <stop offset="100%" stop-color="#2c8484"/>
        </linearGradient>
      </defs>
      <rect width="320" height="130" fill="url(#wbMtnBg)"/>
      <path d="M0 95 Q55 48 115 86 T235 74 T320 92 L320 130 L0 130 Z" fill="#1b7475" fill-opacity="0.45"/>
      <path d="M0 108 Q80 68 165 102 T320 88 L320 130 L0 130 Z" fill="#146466" fill-opacity="0.7"/>
      <path d="M210 18 C242 26 276 34 316 14" stroke="#4a3728" stroke-width="3" stroke-linecap="round"/>
      <circle cx="238" cy="24" r="6" fill="#fff7f5"/><circle cx="238" cy="24" r="2" fill="#e6997a"/>
      <circle cx="268" cy="28" r="7" fill="#fff7f5"/><circle cx="268" cy="28" r="2.2" fill="#e6997a"/>
      <circle cx="294" cy="18" r="5.5" fill="#fff7f5"/><circle cx="294" cy="18" r="1.8" fill="#e6997a"/>
      <circle cx="252" cy="42" r="5" fill="#fff7f5"/><circle cx="252" cy="42" r="1.6" fill="#e6997a"/>
    </svg>
  </div>`;
}
var ACCT_ICONS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  passkey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><line x1="4" y1="8" x2="20" y2="8"/><circle cx="9" cy="8" r="2.2" fill="currentColor"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="15" cy="16" r="2.2" fill="currentColor"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>',
  grad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>',
  mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
};

async function renderAccountPage({ db, services = null, user, subPath = "" }) {
  const currentPath = subPath === "profile-root" ? "/profile" : subPath ? `/account/${subPath}` : "/account";
  if (!user) return redirectResponse(signInUrl(currentPath, "account.view"));

  const activeMainTab =
    subPath === "security" || subPath === "sessions" || subPath === "login-history" ? "security" :
    subPath === "passkeys" ? "passkeys" :
    subPath === "preferences" ? "preferences" :
    subPath === "learning-data" || subPath === "privacy" ? "learning-data" :
    subPath === "student-benefit" ? "student-benefit" :
    "profile";

  const mainTabs = [
    { key: "profile", href: "/account", label: "Hồ sơ cá nhân", icon: ACCT_ICONS.user },
    { key: "security", href: "/account/security", label: "Bảo mật & Đổi mật khẩu", icon: ACCT_ICONS.shield },
    { key: "passkeys", href: "/account/passkeys", label: "Passkey", icon: ACCT_ICONS.passkey },
    { key: "preferences", href: "/account/preferences", label: "Tùy chọn nền tảng", icon: ACCT_ICONS.sliders },
    { key: "learning-data", href: "/account/learning-data", label: "Dữ liệu học tập", icon: ACCT_ICONS.database },
    { key: "student-benefit", href: "/account/student-benefit", label: "Quyền lợi sinh viên", icon: ACCT_ICONS.grad }
  ];

  const tabsHtml = `
    <nav class="wb-acct-tabs" aria-label="Danh mục tài khoản cá nhân">
      ${mainTabs.map((t) => `<a href="${t.href}" class="wb-acct-tab ${activeMainTab === t.key ? "active" : ""}">${t.icon}<span>${escapeHtml(t.label)}</span></a>`).join("")}
    </nav>`;

  const renderLeftFeatureCard = (iconSvg, heading, subtitle, bullets) => `
    <aside class="wb-acct-side-card">
      ${renderAccountDecorBanner()}
      <div class="wb-acct-side-icon-wrap"><div class="wb-acct-side-icon-inner">${iconSvg}</div></div>
      <div class="wb-acct-side-body">
        <h2>${escapeHtml(heading)}</h2>
        <p class="wb-acct-side-sub">${escapeHtml(subtitle)}</p>
        <ul class="wb-acct-check-list">
          ${bullets.map((b) => `<li><span class="wb-acct-check-dot" aria-hidden="true">${ACCT_ICONS.check}</span><span>${escapeHtml(b)}</span></li>`).join("")}
        </ul>
      </div>
    </aside>`;

  let body = "";
  let title = "Hồ sơ & Tài khoản cá nhân";

  if (subPath === "student-benefit") {
    title = "Quyền lợi sinh viên";
    const existing = await db.prepare("SELECT * FROM wb_student_benefits WHERE account_id = ?").bind(user.accountId).first().catch(() => null);
    const isVerified = existing && existing.status === "verified";
    const isPending = existing && existing.status === "pending";
    const statusBadge = isVerified
      ? '<span class="wb-status-pill-ok">Đã xác minh</span>'
      : isPending
        ? '<span class="wb-badge">Đang chờ xác minh email</span>'
        : '<span class="wb-status-pill-warn">✕ Chưa xác minh</span>';

    body = `
      <div class="wb-acct-grid">
        ${renderLeftFeatureCard(
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
          "Quyền lợi sinh viên",
          "Các lợi ích và chương trình ưu đãi dành riêng cho học sinh, sinh viên trên WORD BRIDGE.",
          ["Mở rộng tài nguyên học tập", "Tham gia chương trình ưu đãi", "Ưu tiên trải nghiệm tính năng mới", "Nhận thông tin học tập phù hợp"]
        )}
        <div>
          <section class="wb-acct-panel">
            <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title">${ACCT_ICONS.grad}<span>Quyền lợi nổi bật</span></h3></div>
            <div class="wb-benefit-grid-4">
              <div class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>Tài nguyên học tập mở rộng</span></div>
              <div class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg><span>Ưu tiên trải nghiệm tính năng mới</span></div>
              <div class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m9 15 6-6"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14.5" cy="14.5" r="1"/></svg><span>Ưu đãi từ đối tác giáo dục</span></div>
              <div class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 6v12"/></svg><span>Tham gia chương trình học tập đặc biệt</span></div>
            </div>
          </section>

          <section class="wb-acct-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="wb-session-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M6 16c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="13" x2="18" y2="13"/></svg></div>
                <div>
                  <strong style="display:block;font-size:1rem;">Xác minh sinh viên</strong>
                  <span class="wb-muted" style="font-size:0.86rem;">Xác minh bằng email sinh viên do trường cấp để kích hoạt đầy đủ quyền lợi 03 tháng (áp dụng một lần duy nhất).</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                ${statusBadge}
                ${!existing ? '<button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-wb-open-student-verify>Xác minh ngay ›</button>' : ""}
              </div>
            </div>
            ${existing ? `
              <div class="wb-alert wb-alert-info" style="margin-top:14px;margin-bottom:0;">
                Email sinh viên: <strong>${escapeHtml(existing.school_email)}</strong> · Trạng thái: <strong>${escapeHtml(existing.status)}</strong>${existing.expires_at ? ` · Hiệu lực đến: <strong>${escapeHtml(formatShortDateVi(existing.expires_at))}</strong>` : ""}
              </div>` : `
              <div id="wb-student-verify-panel" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--wb-border);">
                <form class="wb-form" data-api-endpoint="/api/v1/student-benefit/request" data-reload-on-success="true">
                  <input type="hidden" name="verificationMethod" value="school_email_only" />
                  <div class="wb-field">
                    <label for="field-schoolEmail">Email sinh viên do trường cấp (*.edu.vn, *.edu, *.ac.*) *</label>
                    <input id="field-schoolEmail" class="wb-input" type="email" name="schoolEmail" placeholder="vi-du@ten-truong.edu.vn" required />
                  </div>
                  <div data-form-status></div>
                  <div><button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết xác minh email sinh viên</button></div>
                </form>
              </div>`}
          </section>

          <section class="wb-acct-panel">
            <div class="wb-acct-panel-head">
              <div>
                <h3 class="wb-acct-panel-title">${ACCT_ICONS.grad}<span>Chương trình ưu đãi &amp; Hợp tác</span></h3>
                <p class="wb-muted" style="margin:4px 0 0;font-size:0.86rem;">Các chương trình học tập và học liệu mở rộng trực tiếp trên hệ thống WORD BRIDGE.</p>
              </div>
              <a href="/learning" style="font-size:0.88rem;font-weight:700;color:var(--wb-teal);">Khám phá chương trình ›</a>
            </div>
            <div class="wb-benefit-grid-4">
              <a href="/learning" class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg><span>Nền tảng học tập trực tuyến</span></a>
              <a href="/reader" class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><span>Tài nguyên học thuật số</span></a>
              <a href="/practice" class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg><span>Công cụ hỗ trợ học tập</span></a>
              <a href="/specialized" class="wb-benefit-card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg><span>Chuyên ngành Anh – Trung</span></a>
            </div>
          </section>
        </div>
      </div>`;
  } else if (subPath === "security" || subPath === "sessions" || subPath === "login-history") {
    const secSubTabs = `
      <div class="wb-subtabs" role="tablist">
        <a href="/account/security" class="wb-subtab ${subPath === "security" ? "active" : ""}">${ACCT_ICONS.lock}<span>Đổi mật khẩu</span></a>
        <a href="/account/sessions" class="wb-subtab ${subPath === "sessions" ? "active" : ""}">${ACCT_ICONS.device}<span>Thiết bị &amp; Phiên đăng nhập</span></a>
        <a href="/account/login-history" class="wb-subtab ${subPath === "login-history" ? "active" : ""}">${ACCT_ICONS.clock}<span>Lịch sử đăng nhập &amp; đăng xuất</span></a>
      </div>`;

    let secRightBody = "";
    if (subPath === "security") {
      title = "Bảo mật & Đổi mật khẩu";
      secRightBody = `
        <div class="wb-sec-pw-grid">
          <form class="wb-form" data-api-endpoint="/api/v1/account/change-password">
            <div>
              <h3 class="wb-acct-panel-title" style="margin-bottom:4px;">${ACCT_ICONS.lock}<span>Đổi mật khẩu</span></h3>
              <p class="wb-muted" style="margin:0;font-size:0.88rem;">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
            </div>
            <div class="wb-field">
              <label for="field-currentPassword">Mật khẩu hiện tại <span class="wb-req">*</span></label>
              <div class="wb-input-wrap">
                <span class="wb-input-icon" aria-hidden="true">${ACCT_ICONS.lock}</span>
                <input id="field-currentPassword" class="wb-input wb-input-has-icon wb-input-has-toggle" type="password" name="currentPassword" placeholder="Nhập mật khẩu hiện tại" required autocomplete="current-password" />
                <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-currentPassword" aria-label="Hiện hoặc ẩn mật khẩu">${ACCT_ICONS.eye}</button>
              </div>
            </div>
            <div class="wb-field">
              <label for="field-newPassword">Mật khẩu mới <span class="wb-req">*</span></label>
              <div class="wb-input-wrap">
                <span class="wb-input-icon" aria-hidden="true">${ACCT_ICONS.lock}</span>
                <input id="field-newPassword" class="wb-input wb-input-has-icon wb-input-has-toggle" type="password" name="newPassword" placeholder="Nhập mật khẩu mới" required autocomplete="new-password" />
                <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-newPassword" aria-label="Hiện hoặc ẩn mật khẩu">${ACCT_ICONS.eye}</button>
              </div>
            </div>
            <div class="wb-field">
              <label for="field-confirmPassword">Xác nhận mật khẩu mới <span class="wb-req">*</span></label>
              <div class="wb-input-wrap">
                <span class="wb-input-icon" aria-hidden="true">${ACCT_ICONS.lock}</span>
                <input id="field-confirmPassword" class="wb-input wb-input-has-icon wb-input-has-toggle" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu mới" required autocomplete="new-password" />
                <button type="button" class="wb-pw-toggle" data-wb-toggle-pw="field-confirmPassword" aria-label="Hiện hoặc ẩn mật khẩu">${ACCT_ICONS.eye}</button>
              </div>
            </div>
            <div data-form-status></div>
            <button type="submit" class="wb-btn wb-btn-primary wb-btn-block wb-btn-lg">Cập nhật mật khẩu</button>
          </form>
          <aside class="wb-pw-rules-box">
            <h3>${ACCT_ICONS.shield}<span>Yêu cầu mật khẩu</span></h3>
            <ul class="wb-pw-rules-list">
              <li data-pw-rule="len">✓ Tối thiểu <strong>10 ký tự</strong></li>
              <li data-pw-rule="upper">✓ Bao gồm chữ hoa (A – Z)</li>
              <li data-pw-rule="lower">✓ Bao gồm chữ thường (a – z)</li>
              <li data-pw-rule="num">✓ Bao gồm số (0 – 9)</li>
              <li data-pw-rule="special">✓ Khuyến nghị có ký tự đặc biệt (! @ # $ %)</li>
            </ul>
          </aside>
        </div>`;
    } else if (subPath === "sessions") {
      title = "Thiết bị & Phiên đăng nhập";
      const activeSessions = (await db.prepare(
        `SELECT id, ip_address, user_agent, created_at, expires_at, revoked_at
         FROM wb_sessions
         WHERE account_id = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')
         ORDER BY created_at DESC LIMIT 25`
      ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
      const currentSess = activeSessions.find((s) => s.id === user.sessionId) || null;
      const otherSessions = activeSessions.filter((s) => s.id !== user.sessionId);
      const curDev = parseDeviceLabel(currentSess?.user_agent || "");
      secRightBody = `
        <div class="wb-alert wb-alert-info" style="margin-top:0;margin-bottom:18px;">
          Quản lý các thiết bị và phiên đăng nhập đang hoạt động trên tài khoản của bạn.
        </div>

        <h3 class="wb-acct-panel-title" style="margin-bottom:10px;">${ACCT_ICONS.device}<span>Thiết bị hiện tại</span></h3>
        <div class="wb-session-row current">
          <div class="wb-session-main">
            <div class="wb-session-ico">${curDev.isMobile ? ACCT_ICONS.mobile : ACCT_ICONS.device}</div>
            <div>
              <strong>${escapeHtml(curDev.label)}</strong>
              <div class="wb-session-meta">IP: ${escapeHtml(maskIpForDisplay(currentSess?.ip_address))} · Đăng nhập: ${escapeHtml(formatDateVi(currentSess?.created_at))}</div>
            </div>
          </div>
          <span class="wb-status-pill-ok">Đang sử dụng</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:20px 0 12px;">
          <h3 class="wb-acct-panel-title">${ACCT_ICONS.database}<span>Các thiết bị / Phiên đăng nhập khác (${otherSessions.length})</span></h3>
          ${otherSessions.length > 0 ? `
            <form class="wb-form" data-api-endpoint="/api/v1/account/sessions/revoke-others" data-reload-on-success="true" style="margin:0;">
              <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Đăng xuất tất cả phiên khác</button>
            </form>` : ""}
        </div>
        ${otherSessions.length === 0
          ? '<div class="wb-card" style="background:var(--wb-surface-2);margin:0;text-align:center;"><p class="wb-muted" style="margin:0;">Không có thiết bị hoặc phiên đăng nhập nào khác đang hoạt động.</p></div>'
          : otherSessions.map((s) => {
              const dev = parseDeviceLabel(s.user_agent || "");
              return `<div class="wb-session-row">
                <div class="wb-session-main">
                  <div class="wb-session-ico">${dev.isMobile ? ACCT_ICONS.mobile : ACCT_ICONS.device}</div>
                  <div>
                    <strong>${escapeHtml(dev.label)}</strong>
                    <div class="wb-session-meta">IP: ${escapeHtml(maskIpForDisplay(s.ip_address))} · Đăng nhập: ${escapeHtml(formatDateVi(s.created_at))}</div>
                  </div>
                </div>
                <form class="wb-form" data-api-endpoint="/api/v1/account/sessions/revoke" data-reload-on-success="true" style="margin:0;">
                  <input type="hidden" name="sessionId" value="${escapeHtml(s.id)}" />
                  <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Đăng xuất</button>
                </form>
              </div>`;
            }).join("")}`;
    } else {
      title = "Lịch sử đăng nhập & đăng xuất";
      const authLogs = (await db.prepare(
        `SELECT action, ip_address, metadata_json, created_at
         FROM wb_audit_logs
         WHERE actor_account_id = ?
           AND action IN ('auth.login', 'auth.login_failed', 'auth.passkey_login', 'auth.logout', 'auth.session_revoked', 'auth.sessions_revoked_others', 'auth.password_changed', 'account.registered')
         ORDER BY created_at DESC LIMIT 40`
      ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
      const ACTION_LABELS = {
        "auth.login": ["Đăng nhập thành công", "wb-status-pill-ok"],
        "auth.passkey_login": ["Đăng nhập bằng Passkey", "wb-status-pill-ok"],
        "auth.logout": ["Đăng xuất", "wb-badge"],
        "auth.session_revoked": ["Đăng xuất một phiên thiết bị", "wb-badge"],
        "auth.sessions_revoked_others": ["Đăng xuất tất cả phiên khác", "wb-badge"],
        "auth.login_failed": ["Đăng nhập thất bại", "wb-status-pill-warn"],
        "auth.password_changed": ["Đổi mật khẩu thành công", "wb-badge"],
        "account.registered": ["Khởi tạo tài khoản", "wb-badge"]
      };
      secRightBody = `
        <div class="wb-alert wb-alert-info" style="margin-top:0;margin-bottom:16px;">
          Nhật ký thực tế các lần đăng nhập, đăng xuất và thay đổi bảo mật trên tài khoản của bạn.
        </div>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead><tr><th>Sự kiện</th><th>Thiết bị / Ghi chú</th><th>Địa chỉ IP</th><th>Thời gian</th></tr></thead>
            <tbody>
              ${authLogs.map((l) => {
                const [lbl, cls] = ACTION_LABELS[l.action] || [l.action, "wb-badge"];
                const meta = safeJsonParse(l.metadata_json, {});
                const devInfo = meta.userAgent ? parseDeviceLabel(meta.userAgent).label : (meta.revokedCount !== undefined ? `${meta.revokedCount} phiên` : "—");
                return `<tr>
                  <td><span class="${cls}">${escapeHtml(lbl)}</span></td>
                  <td>${escapeHtml(devInfo)}</td>
                  <td><code>${escapeHtml(maskIpForDisplay(l.ip_address))}</code></td>
                  <td>${escapeHtml(formatDateVi(l.created_at))}</td>
                </tr>`;
              }).join("") || '<tr><td colspan="4" style="text-align:center;padding:20px;">Chưa có lịch sử đăng nhập hoặc đăng xuất được ghi nhận.</td></tr>'}
            </tbody>
          </table>
        </div>`;
    }

    body = `
      <div class="wb-acct-grid">
        ${renderLeftFeatureCard(
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10"/></svg>',
          "Bảo mật tài khoản",
          "Tăng cường bảo vệ tài khoản và thông tin cá nhân của bạn trên WORD BRIDGE.",
          ["Mật khẩu được mã hóa an toàn", "Hỗ trợ xác thực Passkeys/WebAuthn", "Kiểm soát phiên đăng nhập", "Quản lý thiết bị đã đăng nhập"]
        )}
        <section class="wb-acct-panel">
          ${secSubTabs}
          ${secRightBody}
        </section>
      </div>`;
  } else if (subPath === "passkeys") {
    title = "Passkey (WebAuthn / FIDO2)";
    const keys = (await db.prepare(
      "SELECT id, display_name, created_at, last_used_at, revoked_at FROM wb_passkeys WHERE account_id = ? AND revoked_at IS NULL ORDER BY created_at DESC"
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    body = `
      <div class="wb-acct-grid">
        ${renderLeftFeatureCard(
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg>',
          "Passkey",
          "Đăng nhập an toàn, nhanh chóng và hiện đại hơn với Passkey (WebAuthn).",
          ["Đăng nhập không cần mật khẩu", "Bảo mật bằng thiết bị cá nhân", "Chống đánh cắp tài khoản", "Đơn giản và tiện lợi khi sử dụng"]
        )}
        <section class="wb-acct-panel">
          <div class="wb-acct-panel-head">
            <div>
              <h3 class="wb-acct-panel-title">${ACCT_ICONS.passkey}<span>Quản lý Passkey</span></h3>
              <p class="wb-muted" style="margin:4px 0 0;font-size:0.88rem;">Sử dụng Passkey để đăng nhập vào WORD BRIDGE bằng phương thức xác thực an toàn trên thiết bị của bạn (vân tay, khuôn mặt hoặc mã khóa thiết bị).</p>
            </div>
            <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-passkey-help>Tìm hiểu về Passkey</button>
          </div>
          <div id="wb-passkey-help-box" class="wb-alert wb-alert-info" hidden>
            WORD BRIDGE không thu thập hay lưu vân tay, khuôn mặt, PIN thiết bị hay khóa bí mật (private key). Hệ thống chỉ lưu định danh WebAuthn và khóa công khai COSE chuẩn FIDO2.
          </div>

          ${keys.length === 0 ? `
            <div class="wb-passkey-empty">
              <svg viewBox="0 0 140 84" width="132" height="80" fill="none" aria-hidden="true">
                <rect x="14" y="8" width="84" height="58" rx="8" stroke="#146466" stroke-width="3" fill="#f0fafa"/>
                <line x1="6" y1="68" x2="106" y2="68" stroke="#146466" stroke-width="3" stroke-linecap="round"/>
                <circle cx="56" cy="37" r="16" fill="#d9f1ef"/>
                <path d="M50 37a6 6 0 0 1 12 0c0 3-.5 6-1 8M56 35a2 2 0 0 0-2 2v5" stroke="#146466" stroke-width="2.2" stroke-linecap="round"/>
                <rect x="88" y="24" width="34" height="52" rx="6" stroke="#146466" stroke-width="2.6" fill="#ffffff"/>
                <rect x="97" y="40" width="16" height="16" rx="3" stroke="#5AABA9" stroke-width="2"/>
              </svg>
              <h3>Bạn chưa thiết lập Passkey</h3>
              <p>Hãy thêm Passkey để đăng nhập nhanh hơn và an toàn hơn.</p>
              <button type="button" class="wb-btn wb-btn-primary" data-passkey="register">+ Thêm Passkey</button>
              <p data-passkey-status role="status" class="wb-muted" style="margin-top:10px;"></p>
            </div>` : `
            <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <strong>Passkey đang hoạt động (${keys.length})</strong>
              <button type="button" class="wb-btn wb-btn-primary wb-btn-sm" data-passkey="register">+ Thêm Passkey mới</button>
            </div>
            <p data-passkey-status role="status" class="wb-muted" style="margin:0 0 12px;"></p>
            ${keys.map((k) => `
              <div class="wb-session-row">
                <div class="wb-session-main">
                  <div class="wb-session-ico">${ACCT_ICONS.passkey}</div>
                  <div>
                    <strong>${escapeHtml(k.display_name || "Passkey thiết bị")}</strong>
                    <div class="wb-session-meta">Thêm lúc: ${escapeHtml(formatDateVi(k.created_at))}${k.last_used_at ? ` · Dùng gần nhất: ${escapeHtml(formatDateVi(k.last_used_at))}` : ""}</div>
                  </div>
                </div>
                <form class="wb-form" data-api-endpoint="/api/v1/account/passkeys/${encodeURIComponent(k.id)}" data-api-method="DELETE" data-reload-on-success="true" style="margin:0;">
                  <button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Thu hồi</button>
                </form>
              </div>`).join("")}`}

          <div class="wb-note-banner">
            <strong style="display:flex;align-items:center;gap:6px;color:var(--wb-teal);">ⓘ Lưu ý</strong>
            <ul>
              <li>Passkey được lưu an toàn trên thiết bị cá nhân của bạn.</li>
              <li>Bạn có thể thêm nhiều Passkey (máy tính, điện thoại, khóa bảo mật).</li>
              <li>Nếu mất thiết bị, bạn vẫn có thể đăng nhập bằng mật khẩu để quản lý và thu hồi Passkey.</li>
            </ul>
          </div>
        </section>
      </div>`;
  } else if (subPath === "preferences") {
    title = "Tùy chọn nền tảng";
    const prefs = services?.auth ? await services.auth.getUserPreferences(user.accountId) : {
      theme: "light", language: "vi", fontSize: "md", lineHeight: "normal",
      notifyLearning: true, notifyPlatform: true, notifyRecommendations: false, syncEnabled: true
    };
    body = `
      <div class="wb-acct-grid">
        ${renderLeftFeatureCard(
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.9"><line x1="4" y1="8" x2="20" y2="8"/><circle cx="9" cy="8" r="2.2"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="15" cy="16" r="2.2"/></svg>',
          "Tùy chọn nền tảng",
          "Điều chỉnh giao diện, ngôn ngữ và các thiết lập hiển thị theo nhu cầu của bạn.",
          ["Cá nhân hóa trải nghiệm", "Đồng bộ trên mọi thiết bị", "Dễ dàng thay đổi khi cần"]
        )}
        <form id="wb-preferences-form" style="display:grid;gap:16px;">
          <div id="wb-pref-status" role="status"></div>
          <div class="wb-pref-grid">
            <section class="wb-acct-panel">
              <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title"><span>Giao diện</span></h3></div>
              <div class="wb-theme-cards">
                <label class="wb-theme-opt ${prefs.theme === "light" ? "active" : ""}">
                  <input type="radio" name="theme" value="light" ${prefs.theme === "light" ? "checked" : ""} />
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                  <span>Sáng</span>
                </label>
                <label class="wb-theme-opt ${prefs.theme === "dark" ? "active" : ""}">
                  <input type="radio" name="theme" value="dark" ${prefs.theme === "dark" ? "checked" : ""} />
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  <span>Tối</span>
                </label>
                <label class="wb-theme-opt ${prefs.theme === "auto" ? "active" : ""}">
                  <input type="radio" name="theme" value="auto" ${prefs.theme === "auto" ? "checked" : ""} />
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>
                  <span>Tự động</span>
                </label>
              </div>
            </section>

            <section class="wb-acct-panel">
              <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title"><span>Ngôn ngữ hiển thị</span></h3></div>
              <div class="wb-field">
                <select class="wb-select" name="language" aria-label="Ngôn ngữ hiển thị">
                  <option value="vi" ${prefs.language === "vi" ? "selected" : ""}>Tiếng Việt</option>
                </select>
                <span class="wb-muted" style="font-size:0.8rem;">Giao diện nền tảng WORD BRIDGE hiển thị thống nhất bằng Tiếng Việt.</span>
              </div>
            </section>
          </div>

          <div class="wb-pref-grid">
            <section class="wb-acct-panel">
              <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title"><span>Hiển thị</span></h3></div>
              <input type="hidden" name="fontSize" value="${escapeHtml(prefs.fontSize)}" />
              <input type="hidden" name="lineHeight" value="${escapeHtml(prefs.lineHeight)}" />
              <div class="wb-seg-row">
                <strong>Aa Cỡ chữ</strong>
                <div class="wb-seg-group">
                  <button type="button" class="wb-seg-btn ${prefs.fontSize === "sm" ? "active" : ""}" data-seg-field="fontSize" data-seg-val="sm">Nhỏ</button>
                  <button type="button" class="wb-seg-btn ${prefs.fontSize === "md" ? "active" : ""}" data-seg-field="fontSize" data-seg-val="md">Vừa</button>
                  <button type="button" class="wb-seg-btn ${prefs.fontSize === "lg" ? "active" : ""}" data-seg-field="fontSize" data-seg-val="lg">Lớn</button>
                </div>
              </div>
              <div class="wb-seg-row" style="margin-bottom:0;">
                <strong>Khoảng cách dòng</strong>
                <div class="wb-seg-group">
                  <button type="button" class="wb-seg-btn ${prefs.lineHeight === "compact" ? "active" : ""}" data-seg-field="lineHeight" data-seg-val="compact">Thấp</button>
                  <button type="button" class="wb-seg-btn ${prefs.lineHeight === "normal" ? "active" : ""}" data-seg-field="lineHeight" data-seg-val="normal">Vừa</button>
                  <button type="button" class="wb-seg-btn ${prefs.lineHeight === "relaxed" ? "active" : ""}" data-seg-field="lineHeight" data-seg-val="relaxed">Cao</button>
                </div>
              </div>
            </section>

            <section class="wb-acct-panel">
              <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title"><span>Thông báo</span></h3></div>
              <label class="wb-switch-row">
                <span>Nhận thông báo về hoạt động học tập</span>
                <span class="wb-switch"><input type="checkbox" name="notifyLearning" ${prefs.notifyLearning ? "checked" : ""} /><span class="wb-switch-slider"></span></span>
              </label>
              <label class="wb-switch-row">
                <span>Nhận thông báo về thông tin nền tảng</span>
                <span class="wb-switch"><input type="checkbox" name="notifyPlatform" ${prefs.notifyPlatform ? "checked" : ""} /><span class="wb-switch-slider"></span></span>
              </label>
              <label class="wb-switch-row">
                <span>Nhận đề xuất nội dung phù hợp</span>
                <span class="wb-switch"><input type="checkbox" name="notifyRecommendations" ${prefs.notifyRecommendations ? "checked" : ""} /><span class="wb-switch-slider"></span></span>
              </label>
            </section>
          </div>

          <section class="wb-acct-panel">
            <label class="wb-switch-row" style="padding:0;">
              <div>
                <strong style="display:block;font-size:0.98rem;">Đồng bộ &amp; Lưu trữ</strong>
                <span class="wb-muted" style="font-size:0.86rem;">Tự động đồng bộ cài đặt và tiến độ học tập trên tất cả thiết bị khi đăng nhập.</span>
              </div>
              <span class="wb-switch"><input type="checkbox" name="syncEnabled" ${prefs.syncEnabled ? "checked" : ""} /><span class="wb-switch-slider"></span></span>
            </label>
          </section>
        </form>
      </div>`;
  } else if (subPath === "learning-data") {
    title = "Dữ liệu học tập";
    const lpStats = await db.prepare(
      "SELECT COUNT(DISTINCT lesson_id) AS lessons_cnt, COALESCE(SUM(time_spent_seconds), 0) AS total_sec FROM wb_learner_progress WHERE account_id = ?"
    ).bind(user.accountId).first().catch(() => ({ lessons_cnt: 0, total_sec: 0 }));
    const prCountRow = await db.prepare("SELECT COUNT(*) AS cnt FROM wb_practice_results WHERE account_id = ?").bind(user.accountId).first().catch(() => ({ cnt: 0 }));
    const srCountRow = await db.prepare("SELECT COUNT(*) AS cnt FROM wb_skill_reviews WHERE account_id = ?").bind(user.accountId).first().catch(() => ({ cnt: 0 }));
    const rpCountRow = await db.prepare("SELECT COUNT(*) AS cnt FROM wb_reader_progress WHERE account_id = ?").bind(user.accountId).first().catch(() => ({ cnt: 0 }));

    const recentLessons = (await db.prepare(
      `SELECT l.title_vi AS label, lp.updated_at AS ts, 'lesson' AS kind
       FROM wb_learner_progress lp LEFT JOIN wb_lessons l ON l.id = lp.lesson_id
       WHERE lp.account_id = ? ORDER BY lp.updated_at DESC LIMIT 6`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const recentPractices = (await db.prepare(
      `SELECT COALESCE(pe.title_vi, pr.skill) AS label, pr.submitted_at AS ts, 'practice' AS kind
       FROM wb_practice_results pr LEFT JOIN wb_practice_exercises pe ON pe.id = pr.exercise_id
       WHERE pr.account_id = ? ORDER BY pr.submitted_at DESC LIMIT 6`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const recentReadings = (await db.prepare(
      `SELECT COALESCE(rd.title_vi, 'Tài liệu đọc') AS label, rp.last_read_at AS ts, 'reading' AS kind
       FROM wb_reader_progress rp LEFT JOIN wb_reader_documents rd ON rd.id = rp.document_id
       WHERE rp.account_id = ? ORDER BY rp.last_read_at DESC LIMIT 6`
    ).bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];

    const combinedActivities = [...recentLessons, ...recentPractices, ...recentReadings]
      .sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")))
      .slice(0, 8);
    const activeDaySet = new Set(combinedActivities.map((a) => String(a.ts || "").slice(0, 10)).filter(Boolean));
    const topicsLearned = Number(lpStats?.lessons_cnt || 0) + Number(rpCountRow?.cnt || 0);
    const totalPractices = Number(prCountRow?.cnt || 0) + Number(srCountRow?.cnt || 0);
    const totalSeconds = Number(lpStats?.total_sec || 0);
    const studyDurationLabel = totalSeconds >= 3600
      ? `${(totalSeconds / 3600).toFixed(1).replace(/\.0$/, "")} giờ`
      : `${Math.round(totalSeconds / 60)} phút`;

    body = `
      <div class="wb-acct-grid">
        ${renderLeftFeatureCard(
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.9"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>',
          "Dữ liệu học tập",
          "Quản lý, theo dõi và xuất dữ liệu học tập của bạn trên WORD BRIDGE.",
          ["Theo dõi tiến độ học tập", "Quản lý lịch sử hoạt động", "Xuất dữ liệu cá nhân", "Tùy chọn lưu trữ và xóa dữ liệu"]
        )}
        <div>
          <section class="wb-acct-panel">
            <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title">${ACCT_ICONS.database}<span>Tổng quan học tập</span></h3></div>
            <div class="wb-stat-tiles-4">
              <div class="wb-stat-tile"><div class="wb-stat-tile-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><div><strong>${topicsLearned}</strong><span>Chủ đề &amp; bài đọc</span></div></div>
              <div class="wb-stat-tile"><div class="wb-stat-tile-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg></div><div><strong>${totalPractices}</strong><span>Bài luyện tập</span></div></div>
              <div class="wb-stat-tile"><div class="wb-stat-tile-ico">${ACCT_ICONS.clock}</div><div><strong>${escapeHtml(studyDurationLabel)}</strong><span>Thời gian học</span></div></div>
              <div class="wb-stat-tile"><div class="wb-stat-tile-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><strong>${activeDaySet.size}</strong><span>Ngày hoạt động</span></div></div>
            </div>
          </section>

          <div class="wb-pref-grid" style="margin-top:16px;">
            <section class="wb-acct-panel">
              <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title">${ACCT_ICONS.clock}<span>Lịch sử hoạt động gần đây</span></h3></div>
              <div class="wb-activity-list">
                ${combinedActivities.map((a) => {
                  const prefix = a.kind === "lesson" ? "Bài học:" : a.kind === "practice" ? "Luyện tập:" : "Đọc tài liệu:";
                  return `<div class="wb-activity-item"><div class="wb-activity-left"><strong>${escapeHtml(prefix)}</strong><span>${escapeHtml(a.label || "Hoạt động học tập")}</span></div><span class="wb-activity-time">${escapeHtml(formatDateVi(a.ts))}</span></div>`;
                }).join("") || '<p class="wb-muted" style="margin:8px 0;">Chưa có hoạt động học tập nào được ghi nhận. Hãy bắt đầu một bài học hoặc bài luyện tập để theo dõi tiến độ thực tế tại đây.</p>'}
              </div>
              <div style="margin-top:16px;text-align:center;">
                <a href="/my-learning/history" class="wb-btn wb-btn-outline wb-btn-sm">Xem chi tiết ›</a>
              </div>
            </section>

            <div style="display:grid;gap:16px;align-content:start;">
              <section class="wb-acct-panel">
                <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title"><span>Xuất dữ liệu học tập</span></h3></div>
                <p class="wb-muted" style="margin:0 0 12px;font-size:0.86rem;">Tải về dữ liệu học tập thực tế của bạn (định dạng .CSV, .JSON hoặc báo cáo in .HTML/PDF).</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <select id="wb-export-format" class="wb-select" style="flex:1;min-width:140px;" aria-label="Chọn định dạng xuất dữ liệu">
                    <option value="csv">Bảng tính (.CSV)</option>
                    <option value="json">Dữ liệu cấu trúc (.JSON)</option>
                    <option value="html">Báo cáo in / PDF (.HTML)</option>
                  </select>
                  <button type="button" class="wb-btn wb-btn-primary" data-wb-export-learning>Xuất dữ liệu</button>
                </div>
              </section>

              <section class="wb-acct-panel">
                <div class="wb-acct-panel-head"><h3 class="wb-acct-panel-title" style="color:var(--wb-red);"><span>Quản lý dữ liệu</span></h3></div>
                <p class="wb-muted" style="margin:0 0 12px;font-size:0.86rem;">Xóa dữ liệu học tập trên tài khoản của bạn. Hành động này không thể hoàn tác.</p>
                <div id="wb-clear-learning-status" role="status"></div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" style="border-color:#dc2626;color:#b91c1c!important;" data-wb-clear-learning>Xóa dữ liệu học tập ›</button>
                  <a href="/account/privacy" class="wb-btn wb-btn-ghost wb-btn-sm">Trung tâm quyền riêng tư</a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>`;
  } else if (subPath === "privacy") {
    title = "Trung tâm quyền riêng tư & Dữ liệu cá nhân";
    const consents = (await db.prepare("SELECT policy_type, policy_version, acceptance_status, consent_purpose, created_at FROM wb_user_policy_consents WHERE account_id = ? ORDER BY created_at DESC LIMIT 20").bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const reqs = (await db.prepare("SELECT id, request_type, status, details, created_at FROM wb_privacy_requests WHERE account_id = ? ORDER BY created_at DESC LIMIT 20").bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const recs = (await db.prepare("SELECT id, language_code, target_text, retain_long_term, created_at FROM wb_speaking_sessions WHERE account_id = ? ORDER BY created_at DESC LIMIT 15").bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    const drafts = (await db.prepare("SELECT id, language_code, prompt_title, status, updated_at FROM wb_writing_submissions WHERE account_id = ? ORDER BY updated_at DESC LIMIT 15").bind(user.accountId).all().catch(() => ({ results: [] }))).results || [];
    body = `
      <div class="wb-grid-2">
        <div class="wb-acct-panel">
          <h3 style="margin-top:0;color:var(--wb-teal);">Gửi yêu cầu quyền dữ liệu cá nhân</h3>
          <p class="wb-muted">Thực hiện quyền theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và <a href="/policies/privacy">Chính sách quyền riêng tư</a>.</p>
          <form class="wb-form" data-api-endpoint="/api/v1/privacy/requests" data-reload-on-success="true">
            <div class="wb-field"><label for="prv-type">Loại yêu cầu *</label>
              <select id="prv-type" class="wb-input" name="requestType" required>
                <option value="access">Truy cập dữ liệu cá nhân</option>
                <option value="rectify">Yêu cầu chỉnh sửa dữ liệu</option>
                <option value="delete">Yêu cầu xóa dữ liệu / đóng tài khoản</option>
                <option value="withdraw_consent">Rút lại sự đồng ý xử lý dữ liệu</option>
                <option value="restrict_processing">Hạn chế xử lý dữ liệu</option>
              </select>
            </div>
            <div class="wb-field"><label for="prv-details">Chi tiết yêu cầu</label><textarea id="prv-details" class="wb-input" name="details" rows="3"></textarea></div>
            <div data-form-status></div>
            <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu quyền riêng tư</button>
          </form>
        </div>
        <div class="wb-acct-panel">
          <h3 style="margin-top:0;color:var(--wb-teal);">Chính sách &amp; Lịch sử xác nhận (${consents.length})</h3>
          <p><a href="/policies/terms">Điều khoản sử dụng</a> · <a href="/policies/privacy">Chính sách quyền riêng tư</a></p>
          <ul>${consents.map((c) => `<li><code>${escapeHtml(c.policy_type)}</code> — <strong>${escapeHtml(c.acceptance_status)}</strong> (${escapeHtml(c.consent_purpose)}, ${escapeHtml(formatDateVi(c.created_at))})</li>`).join("") || "<li>Chưa có bản ghi đồng ý bổ sung.</li>"}</ul>
          <h4 style="color:var(--wb-teal);">Trạng thái yêu cầu quyền dữ liệu (${reqs.length})</h4>
          <ul>${reqs.map((r) => `<li><code>${escapeHtml(r.id)}</code> · ${escapeHtml(r.request_type)} · <strong>${escapeHtml(r.status)}</strong></li>`).join("") || "<li>Chưa có yêu cầu nào.</li>"}</ul>
        </div>
      </div>
      <div class="wb-grid-2" style="margin-top:16px;">
        <div class="wb-acct-panel"><h3 style="margin-top:0;color:var(--wb-teal);">Bản ghi âm đã lưu (${recs.length})</h3><ul>${recs.map((r) => `<li>${escapeHtml(r.target_text.slice(0, 60))} (${escapeHtml(r.language_code)}) <form class="wb-form" data-api-endpoint="/api/v1/privacy/recordings/${encodeURIComponent(r.id)}" data-api-method="DELETE" data-reload-on-success="true" style="display:inline;"><button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Xóa</button></form></li>`).join("") || "<li>Không có bản ghi âm nào đang lưu.</li>"}</ul></div>
        <div class="wb-acct-panel"><h3 style="margin-top:0;color:var(--wb-teal);">Bài viết &amp; Bản nháp cá nhân (${drafts.length})</h3><ul>${drafts.map((d) => `<li>${escapeHtml(d.prompt_title || d.id)} (${escapeHtml(d.status)}) <form class="wb-form" data-api-endpoint="/api/v1/privacy/writings/${encodeURIComponent(d.id)}" data-api-method="DELETE" data-reload-on-success="true" style="display:inline;"><button type="submit" class="wb-btn wb-btn-outline wb-btn-sm">Xóa</button></form></li>`).join("") || "<li>Không có bản nháp nào đang lưu.</li>"}</ul></div>
      </div>`;
  } else {
    const prefs = services?.auth ? await services.auth.getUserPreferences(user.accountId) : { theme: "light", language: "vi", notifyLearning: true };
    const filledBasic = Boolean((user.fullName || "").trim() && (user.dateOfBirth || "").trim());
    const filledStudy = Boolean((user.schoolName || "").trim() || (user.workplaceName || "").trim());
    const filledContact = Boolean((user.email || "").trim() && (user.phoneNumber || "").trim());
    const fieldsList = [user.fullName, user.dateOfBirth, user.phoneNumber, user.schoolName, user.workplaceName];
    const completedCount = fieldsList.filter((v) => String(v || "").trim().length >= 2).length;
    const pct = Math.round((completedCount / fieldsList.length) * 100);
    const circ = 2 * Math.PI * 36;
    const dashOffset = (circ * (1 - pct / 100)).toFixed(1);
    const themeLabel = prefs.theme === "dark" ? "Tối" : prefs.theme === "auto" ? "Tự động" : "Sáng";

    body = `
      <div class="wb-acct-grid-profile">
        <aside class="wb-acct-side-card">
          ${renderAccountDecorBanner()}
          <div class="wb-acct-side-icon-wrap"><div class="wb-acct-side-icon-inner">${ACCT_ICONS.user}</div></div>
          <div class="wb-acct-side-body">
            <h2>${escapeHtml(user.fullName || user.email)}</h2>
            <div class="wb-acct-meta-list">
              <div class="wb-acct-meta-row"><span class="wb-acct-meta-label">Email</span><span class="wb-acct-meta-val">${escapeHtml(user.email)}</span></div>
              <div class="wb-acct-meta-row"><span class="wb-acct-meta-label">Trạng thái tài khoản</span><span class="wb-status-pill-ok">Đang hoạt động</span></div>
              <div class="wb-acct-meta-row"><span class="wb-acct-meta-label">Ngày tham gia</span><span class="wb-acct-meta-val">${escapeHtml(formatShortDateVi(user.createdAt))}</span></div>
              <div class="wb-acct-meta-row"><span class="wb-acct-meta-label">Cập nhật gần nhất</span><span class="wb-acct-meta-val">${escapeHtml(formatShortDateVi(user.updatedAt || user.createdAt))}</span></div>
            </div>
          </div>
        </aside>

        <form class="wb-form wb-acct-panel" data-api-endpoint="/api/v1/account/profile" data-reload-on-success="true">
          <div class="wb-acct-panel-head" style="margin-bottom:6px;">
            <h3 class="wb-acct-panel-title">${ACCT_ICONS.user}<span>Cập nhật hồ sơ cá nhân</span></h3>
          </div>
          <div class="wb-field">
            <label for="field-fullName">Họ và tên <span class="wb-req">*</span></label>
            <input id="field-fullName" class="wb-input" name="fullName" value="${escapeHtml(user.fullName || "")}" required />
          </div>
          <div class="wb-grid-2">
            <div class="wb-field">
              <label for="field-dateOfBirth">Ngày sinh <span class="wb-req">*</span></label>
              <input id="field-dateOfBirth" class="wb-input" type="date" name="dateOfBirth" value="${escapeHtml(user.dateOfBirth || "")}" />
            </div>
            <div class="wb-field">
              <label for="field-phoneNumber">Số điện thoại <span class="wb-req">*</span></label>
              <input id="field-phoneNumber" class="wb-input" name="phoneNumber" value="${escapeHtml(user.phoneNumber || "")}" required />
            </div>
          </div>
          <div class="wb-field">
            <label for="field-schoolName">Trường học <span class="wb-req">*</span></label>
            <input id="field-schoolName" class="wb-input" name="schoolName" value="${escapeHtml(user.schoolName || "")}" />
          </div>
          <div class="wb-field">
            <label for="field-workplaceName">Nơi làm việc</label>
            <input id="field-workplaceName" class="wb-input" name="workplaceName" value="${escapeHtml(user.workplaceName || "")}" />
          </div>
          <div data-form-status></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <button type="reset" class="wb-btn wb-btn-outline">Hủy thay đổi</button>
            <button type="submit" class="wb-btn wb-btn-primary">Lưu hồ sơ</button>
          </div>
        </form>

        <div class="wb-acct-profile-right">
          <section class="wb-acct-panel">
            <div class="wb-acct-panel-head" style="margin-bottom:12px;"><h3 class="wb-acct-panel-title"><span>Tiến độ hoàn thiện hồ sơ</span></h3></div>
            <div class="wb-donut-wrap">
              <svg class="wb-donut-svg" viewBox="0 0 88 88" aria-label="Tiến độ hồ sơ ${pct}%">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#e2efef" stroke-width="9"/>
                <circle cx="44" cy="44" r="36" fill="none" stroke="#146466" stroke-width="9" stroke-linecap="round"
                  stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 44 44)"/>
                <text x="44" y="49" text-anchor="middle" font-size="17" font-weight="800" fill="#146466">${pct}%</text>
              </svg>
              <ul class="wb-acct-check-list" style="border:none;padding:0;gap:8px;font-size:0.84rem;">
                <li><span class="wb-acct-check-dot" style="background:${filledBasic ? "#146466" : "#cbd5e1"};">${ACCT_ICONS.check}</span><span>Thông tin cơ bản</span></li>
                <li><span class="wb-acct-check-dot" style="background:${filledStudy ? "#146466" : "#cbd5e1"};">${ACCT_ICONS.check}</span><span>Thông tin học tập</span></li>
                <li><span class="wb-acct-check-dot" style="background:${filledContact ? "#146466" : "#cbd5e1"};">${ACCT_ICONS.check}</span><span>Thông tin liên hệ</span></li>
              </ul>
            </div>
          </section>

          <section class="wb-acct-panel" style="margin-top:16px;">
            <div class="wb-acct-panel-head" style="margin-bottom:8px;"><h3 class="wb-acct-panel-title">${ACCT_ICONS.sliders}<span>Thiết lập nhanh</span></h3></div>
            <div class="wb-quick-links">
              <a href="/account/preferences" class="wb-quick-link-row"><span class="wb-quick-link-left"><span>Ngôn ngữ hiển thị</span></span><span class="wb-quick-link-val">Tiếng Việt ›</span></a>
              <a href="/account/preferences" class="wb-quick-link-row"><span class="wb-quick-link-left"><span>Giao diện</span></span><span class="wb-quick-link-val">${escapeHtml(themeLabel)} ›</span></a>
              <a href="/account/preferences" class="wb-quick-link-row"><span class="wb-quick-link-left"><span>Thông báo</span></span><span class="wb-quick-link-val">${prefs.notifyLearning ? "Đang bật" : "Đang tắt"} ›</span></a>
              <a href="/account/privacy" class="wb-quick-link-row"><span class="wb-quick-link-left"><span>Quyền riêng tư</span></span><span class="wb-quick-link-val">Quản lý ›</span></a>
            </div>
          </section>
        </div>
      </div>`;
  }

  const pageShell = `
    <div class="wb-acct-shell">
      <div class="wb-acct-header">
        <h1>Hồ sơ &amp; Tài khoản cá nhân</h1>
        <p>Quản lý thông tin, bảo mật và các thiết lập cho trải nghiệm học tập trên WORD BRIDGE.</p>
      </div>
      ${tabsHtml}
      ${body}
    </div>`;

  return htmlResponse(renderPublicPage({
    title,
    currentPath,
    breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Hồ sơ & Tài khoản", href: "/account" }, ...subPath && subPath !== "profile-root" ? [{ label: title }] : []],
    user,
    contentHtml: pageShell
  }));
}
__name(renderAccountPage, "renderAccountPage");

// src/index.js
var REMOVED_LEGACY_PATHS = /* @__PURE__ */ new Set([
  "/social",
  "/friends",
  "/feed",
  "/organizations",
  "/account/subscription",
  "/oauth/callback",
  "/account/linked-accounts",
  "/examinations",
  "/examinations/history",
  "/examinations/chinese",
  "/examinations/english",
  "/examinations/russian"
]);
function createServices(env, dbOverride = null, readerLibraryLoader = null) {
  const db = dbOverride || env.DB;
  const email = new EmailService(db, env);
  const auth = new AuthService(db, email, env);
  const studentBenefit = new StudentBenefitService(db, email, env);
  const r2 = new R2StorageService(env.R2);
  const jobs = new JobsService(db, email, studentBenefit, r2);
  const dictionary = new DictionaryService(db);
  const audio = new AudioService(db, r2, env);
  const practice = new PracticeService(db, email, env);
  const reader = new ReaderService(db, r2, readerLibraryLoader);
  const learnerMeet = new LearnerMeetService(db, email, env);
  const intelligence = new IntelligenceService(db, env);
  const admin = new AdminService(db, auth, jobs, r2, email);
  const legal = new LegalPolicyService(db, env);
  const oauth = new OAuthService(db, auth, env, { randomTokenHex, sha256Hex, generateId });
  const adminPin = new AdminPinService(db, auth, env, { hashPassword, verifyPassword, randomTokenHex, sha256Hex, generateId, timingSafeEqual });
  const languageApi = new LanguageServicesAdapter(db, r2, env, { generateId });
  return { email, auth, studentBenefit, jobs, r2, dictionary, audio, practice, reader, learnerMeet, intelligence, admin, legal, oauth, adminPin, languageApi };
}
__name(createServices, "createServices");
var publicSchemaEnsured = false;
var PUBLIC_CATALOG_DDL = Object.freeze([
  "CREATE VIEW IF NOT EXISTS wb_public_programs AS SELECT * FROM wb_programs WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_courses AS SELECT * FROM wb_courses WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_lessons AS SELECT * FROM wb_lessons WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_learning_resources AS SELECT * FROM wb_learning_resources WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_dictionary_entries AS SELECT * FROM wb_dictionary_entries WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_audio_assets AS SELECT * FROM wb_audio_assets WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_vocabulary_sets AS SELECT * FROM wb_vocabulary_sets WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_grammar_topics AS SELECT * FROM wb_grammar_topics WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_question_bank AS SELECT * FROM wb_question_bank WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_practice_exercises AS SELECT * FROM wb_practice_exercises WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_practice_results AS SELECT rowid AS result_order, * FROM wb_practice_results WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_learner_meet_sessions AS SELECT * FROM wb_learner_meet_sessions WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_intelligence_runs AS SELECT * FROM wb_intelligence_runs WHERE language_code IN ('zh','en')",
  "CREATE VIEW IF NOT EXISTS wb_public_reader_documents AS SELECT * FROM wb_reader_documents WHERE language_code IN ('zh','en') AND review_status='published'",
  "CREATE VIEW IF NOT EXISTS wb_public_languages AS SELECT * FROM wb_languages WHERE code IN ('zh','en') AND is_active=1",
  "CREATE VIEW IF NOT EXISTS wb_public_modules AS SELECT * FROM wb_modules WHERE course_id IN (SELECT id FROM wb_public_courses)",
  "CREATE VIEW IF NOT EXISTS wb_public_weeks AS SELECT * FROM wb_weeks WHERE course_id IN (SELECT id FROM wb_public_courses)",
  "CREATE VIEW IF NOT EXISTS wb_public_learner_progress AS SELECT * FROM wb_learner_progress WHERE lesson_id IN (SELECT id FROM wb_public_lessons) OR (lesson_id IS NULL AND course_id IN (SELECT id FROM wb_public_courses))",
  "CREATE VIEW IF NOT EXISTS wb_public_lesson_submissions AS SELECT * FROM wb_lesson_submissions WHERE lesson_id IN (SELECT id FROM wb_public_lessons)",
  "CREATE VIEW IF NOT EXISTS wb_public_vocabulary_notebook AS SELECT * FROM wb_vocabulary_notebook WHERE entry_id IN (SELECT id FROM wb_public_dictionary_entries)",
  "CREATE TABLE IF NOT EXISTS wb_skill_reviews (account_id TEXT NOT NULL REFERENCES wb_accounts(id), lesson_id TEXT NOT NULL REFERENCES wb_lessons(id), skill TEXT NOT NULL CHECK(skill IN ('grammar','listening','speaking','reading','writing')), remembered INTEGER NOT NULL CHECK(remembered IN (0,1)), response_text TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(account_id, lesson_id, skill))",
  "CREATE TABLE IF NOT EXISTS wb_lesson_notes (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, lesson_slug TEXT NOT NULL, note_content TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(account_id, lesson_slug))"
]);

function isMissingTableError(err) {
  const combined = `${err?.message || ""} ${err?.cause?.message || ""} ${err?.cause || ""} ${err || ""}`;
  return /no such table|no such column|has no column named|no such view|SQLITE_ERROR/i.test(combined);
}
async function safeQueryAll(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const res = params.length ? await stmt.bind(...params).all() : await stmt.all();
    return res?.results || [];
  } catch (err) {
    if (isMissingTableError(err)) return [];
    throw err;
  }
}
async function safeQueryFirst(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return params.length ? await stmt.bind(...params).first() : await stmt.first();
  } catch (err) {
    if (isMissingTableError(err)) return null;
    throw err;
  }
}
var V42_RUNTIME_TABLES_DDL = Object.freeze([
  "CREATE TABLE IF NOT EXISTS wb_reader_documents (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title_vi TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '', language_code TEXT NOT NULL DEFAULT 'en', category TEXT NOT NULL DEFAULT 'article', cefr_or_hsk_level TEXT DEFAULT 'A1', summary_vi TEXT DEFAULT '', content_text TEXT DEFAULT '', r2_object_key TEXT, content_type TEXT DEFAULT 'text/plain', review_status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_support_requests (id TEXT PRIMARY KEY, request_type TEXT NOT NULL DEFAULT 'support', account_id TEXT, sender_name TEXT NOT NULL, sender_email TEXT NOT NULL, subject TEXT NOT NULL, message_body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'received', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_admin_pins (account_id TEXT PRIMARY KEY, pin_hash TEXT NOT NULL, failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until TEXT, must_reset INTEGER NOT NULL DEFAULT 0, reset_token_hash TEXT, reset_token_expires_at TEXT, updated_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_admin_sessions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, parent_session_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, csrf_token TEXT NOT NULL, ip_address TEXT, user_agent TEXT, expires_at TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_policy_documents (slug TEXT PRIMARY KEY, title_vi TEXT NOT NULL, title_en TEXT NOT NULL, current_version TEXT NOT NULL DEFAULT '1.0', effective_date TEXT, operator_name TEXT, privacy_email TEXT, support_email TEXT, legal_email TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_policy_versions (id TEXT PRIMARY KEY, policy_slug TEXT NOT NULL, version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', change_level TEXT NOT NULL DEFAULT 'minor', summary_vi TEXT NOT NULL DEFAULT '', content_vi TEXT NOT NULL, content_en TEXT NOT NULL DEFAULT '', effective_date TEXT, created_by TEXT, reviewed_by TEXT, approved_by TEXT, published_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(policy_slug, version))",
  "CREATE TABLE IF NOT EXISTS wb_user_policy_consents (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, policy_type TEXT NOT NULL, policy_version TEXT NOT NULL, policy_effective_date TEXT, acceptance_status TEXT NOT NULL, consent_purpose TEXT NOT NULL DEFAULT 'account_agreement', source TEXT NOT NULL DEFAULT 'web', metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_privacy_requests (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, request_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'received', details TEXT NOT NULL DEFAULT '', resolution_note TEXT NOT NULL DEFAULT '', handled_by TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_oauth_states (id TEXT PRIMARY KEY, provider TEXT NOT NULL, state_hash TEXT NOT NULL UNIQUE, redirect_to TEXT NOT NULL DEFAULT '/my-learning', expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_oauth_identities (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider TEXT NOT NULL, provider_user_id TEXT NOT NULL, provider_email TEXT, phone_verified_after_oauth INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(provider, provider_user_id))",
  "CREATE TABLE IF NOT EXISTS wb_api_providers (id TEXT PRIMARY KEY, service_type TEXT NOT NULL, provider_code TEXT NOT NULL, display_name TEXT NOT NULL, is_primary INTEGER NOT NULL DEFAULT 0, is_fallback INTEGER NOT NULL DEFAULT 0, config_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED', daily_quota_limit INTEGER NOT NULL DEFAULT 1000, monthly_quota_limit INTEGER NOT NULL DEFAULT 25000, data_region TEXT NOT NULL DEFAULT 'unverified', retention_policy TEXT NOT NULL DEFAULT 'minimal', updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(service_type, provider_code))",
  "CREATE TABLE IF NOT EXISTS wb_api_usage_logs (id TEXT PRIMARY KEY, account_id TEXT, service_type TEXT NOT NULL, provider_code TEXT NOT NULL, request_id TEXT NOT NULL, status_code INTEGER NOT NULL, latency_ms INTEGER NOT NULL DEFAULT 0, input_units INTEGER NOT NULL DEFAULT 0, estimated_cost_usd REAL, error_code TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_api_jobs (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, service_type TEXT NOT NULL, idempotency_key TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'queued', input_ref TEXT, result_json TEXT, error_reason TEXT, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_reading_attempts (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, document_id TEXT, language_code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_progress', answers_json TEXT NOT NULL DEFAULT '{}', comprehension_layers_json TEXT NOT NULL DEFAULT '{}', score REAL, feedback_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')), submitted_at TEXT)",
  "CREATE TABLE IF NOT EXISTS wb_listening_attempts (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, task_id TEXT, language_code TEXT NOT NULL, transcript_hidden INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'in_progress', answers_json TEXT NOT NULL DEFAULT '{}', score REAL, error_analysis_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')), submitted_at TEXT)",
  "CREATE TABLE IF NOT EXISTS wb_speaking_sessions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, language_code TEXT NOT NULL, target_text TEXT NOT NULL, target_phonetic TEXT NOT NULL DEFAULT '', r2_audio_key TEXT, audio_content_type TEXT, audio_size_bytes INTEGER NOT NULL DEFAULT 0, retain_long_term INTEGER NOT NULL DEFAULT 0, audio_expires_at TEXT, transcript_text TEXT, evaluation_status TEXT NOT NULL DEFAULT 'created', evaluation_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_pronunciation_assessments (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, speaking_session_id TEXT, language_code TEXT NOT NULL, target_text TEXT NOT NULL, provider_code TEXT NOT NULL DEFAULT 'unconfigured', status TEXT NOT NULL DEFAULT 'not_configured', overall_score REAL, pronunciation_score REAL, fluency_score REAL, accuracy_score REAL, completeness_score REAL, word_results_json TEXT NOT NULL DEFAULT '[]', phoneme_results_json TEXT NOT NULL DEFAULT '[]', improvement_guide_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_writing_submissions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, language_code TEXT NOT NULL, prompt_title TEXT NOT NULL DEFAULT '', original_content TEXT NOT NULL, version_number INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', evaluation_json TEXT NOT NULL DEFAULT '{}', rubric_score REAL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_specialized_domains_catalog (slug TEXT PRIMARY KEY, category_code TEXT NOT NULL, category_name_vi TEXT NOT NULL, item_number INTEGER NOT NULL, name_vi TEXT NOT NULL, name_en TEXT NOT NULL, target_terms_en INTEGER NOT NULL DEFAULT 500, target_terms_zh INTEGER NOT NULL DEFAULT 500, published_terms_en INTEGER NOT NULL DEFAULT 0, published_terms_zh INTEGER NOT NULL DEFAULT 0, dataset_slug TEXT, status TEXT NOT NULL DEFAULT 'cataloged', updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_passkeys (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, credential_id TEXT NOT NULL UNIQUE, public_key_cose TEXT NOT NULL, sign_count INTEGER NOT NULL DEFAULT 0, display_name TEXT NOT NULL, transports_json TEXT DEFAULT '[]', revoked_at TEXT, last_used_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_webauthn_challenges (id TEXT PRIMARY KEY, account_id TEXT, challenge TEXT NOT NULL UNIQUE, challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')), expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_intelligence_runs (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, system_slug TEXT NOT NULL, language_code TEXT NOT NULL DEFAULT 'en', input_json TEXT NOT NULL, output_json TEXT NOT NULL, methodology_note TEXT NOT NULL, confidence_level TEXT NOT NULL, technical_limits TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed', created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_intelligence_status (system_slug TEXT PRIMARY KEY, operational_status TEXT NOT NULL DEFAULT 'active', ai_adapter_required INTEGER NOT NULL DEFAULT 0, admin_note_vi TEXT DEFAULT '', updated_by TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE VIEW IF NOT EXISTS wb_public_intelligence_runs AS SELECT * FROM wb_intelligence_runs WHERE language_code IN ('zh','en')",
  "CREATE TABLE IF NOT EXISTS wb_email_templates (template_key TEXT PRIMARY KEY, custom_subject TEXT NOT NULL DEFAULT '', custom_title TEXT NOT NULL DEFAULT '', custom_body TEXT NOT NULL DEFAULT '', updated_by TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_email_automations (event_key TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, updated_by TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_platform_config (config_key TEXT PRIMARY KEY, config_value TEXT NOT NULL, description_vi TEXT NOT NULL DEFAULT '', updated_by TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS wb_roles (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name_vi TEXT NOT NULL, description_vi TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS wb_account_roles (account_id TEXT NOT NULL, role_id TEXT NOT NULL, granted_by TEXT, granted_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (account_id, role_id))",
  "CREATE TABLE IF NOT EXISTS wb_student_benefits (id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE, school_email TEXT NOT NULL, verification_method TEXT NOT NULL DEFAULT 'school_email_only', status TEXT NOT NULL DEFAULT 'pending', verified_at TEXT, expires_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
]);




function wrapD1Statement(st, isReadOnly) {
  if (!st || !isReadOnly) return st;
  const make = (inner) => ({
    bind(...args) { return make(inner.bind(...args)); },
    async all() {
      try { return await inner.all(); } catch (err) {
        if (isMissingTableError(err)) return { results: [], success: true, meta: {} };
        throw err;
      }
    },
    async first(...args) {
      try { return await inner.first(...args); } catch (err) {
        if (isMissingTableError(err)) return null;
        throw err;
      }
    },
    async run() { return inner.run(); },
    async raw(...args) { return inner.raw(...args); }
  });
  return make(st);
}
function createSafeD1Adapter(rawDb) {
  if (!rawDb || typeof rawDb.prepare !== "function") return rawDb;
  return {
    prepare(sql) {
      const isReadOnly = /^\s*(?:SELECT|WITH)\b/i.test(String(sql || ""));
      return wrapD1Statement(rawDb.prepare(sql), isReadOnly);
    },
    batch(stmts) { return rawDb.batch(stmts); },
    exec(sql) { return rawDb.exec(sql); },
    dump() { return rawDb.dump ? rawDb.dump() : undefined; }
  };
}

async function ensurePublicCatalogSchema(db) {
  if (publicSchemaEnsured || !db) return;
  try {
    const existingRows = (await db.prepare("SELECT name FROM sqlite_master WHERE type IN ('view','table')").all()).results || [];
    const existingSet = new Set(existingRows.map((r) => r.name));
    const requiredChecks = ["wb_public_courses", "wb_public_languages", "wb_public_reader_documents", "wb_skill_reviews", "wb_lesson_notes", "wb_admin_pins", "wb_policy_documents", "wb_api_providers", "wb_passkeys", "wb_webauthn_challenges", "wb_intelligence_runs", "wb_public_intelligence_runs", "wb_email_templates", "wb_email_automations"];
    if (requiredChecks.every((n) => existingSet.has(n))) {
      publicSchemaEnsured = true;
      return;
    }
    for (const ddl of V42_RUNTIME_TABLES_DDL) {
      try { await db.prepare(ddl).run(); } catch (ddlErr) {
        console.warn("[WB-SCHEMA-GUARD] V42 DDL:", String(ddlErr?.message || ddlErr).slice(0, 120));
      }
    }
    if (existingSet.has("wb_courses")) {
      for (const ddl of PUBLIC_CATALOG_DDL) {
        try { await db.prepare(ddl).run(); } catch (ddlErr) {
          console.warn("[WB-SCHEMA-GUARD] Public DDL:", String(ddlErr?.message || ddlErr).slice(0, 120));
        }
      }
    }
    publicSchemaEnsured = true;
  } catch (err) {
    console.warn("[WB-SCHEMA-GUARD] Failed:", String(err?.message || err).slice(0, 140));
  }
}
__name(ensurePublicCatalogSchema, "ensurePublicCatalogSchema");
async function loadRuntimeFromD1(db) {
  const fallback = {
    site: {
      display_name: "WORD BRIDGE",
      maintenance_mode: false,
      maintenance_message: "",
      announcement_banner: ""
    },
    settings: {}
  };
  try {
    const rows = (await db.prepare("SELECT config_key, config_value FROM wb_platform_config WHERE config_key IN ('site.maintenance_mode', 'site.maintenance_message', 'site.announcement_banner')").all()).results || [];
    const map = Object.fromEntries(rows.map((r) => [r.config_key, r.config_value]));
    return {
      site: {
        display_name: "WORD BRIDGE",
        maintenance_mode: map["site.maintenance_mode"] === "true",
        maintenance_message: map["site.maintenance_message"] || "",
        announcement_banner: map["site.announcement_banner"] || ""
      },
      settings: {}
    };
  } catch {
    return fallback;
  }
}
__name(loadRuntimeFromD1, "loadRuntimeFromD1");
function inferContentType(path) {
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
__name(inferContentType, "inferContentType");
var vocabFiles = Object.freeze({
  "quan-tri-mang-may-tinh": "digital-business",
  "sua-chua-lap-rap-may-tinh": "digital-business",
  "thiet-ke-do-hoa": "digital-business",
  "ke-toan-doanh-nghiep": "digital-business",
  "logistics": "digital-business",
  "business": "digital-business",
  "import-export": "digital-business",
  "it-cloud": "digital-business",
  "economics-tourism": "digital-business",
  "graphic-design": "digital-business",
  "cat-got-kim-loai": "mechanical",
  "nguoi-sua-chua-may-cong-cu": "mechanical",
  "cong-nghe-o-to": "mechanical",
  "ky-thuat-may-lanh-dhkk": "mechanical",
  "mechanical-engineering": "mechanical",
  "automotive": "mechanical",
  "co-dien-tu": "industrial",
  "dien-cong-nghiep": "industrial",
  "dien-tu-cong-nghiep": "industrial",
  "bao-tri-thiet-bi-co-dien": "industrial",
  "electrical-electronics": "industrial",
  "healthcare": "industrial"
});
async function loadStaticAsset(normalizedPath, request, url, rawEnv) {
  const termFile = /^\/data\/vocab\/([a-z0-9-]+)\.json$/.exec(normalizedPath);
  if (termFile && Object.hasOwn(vocabFiles, termFile[1])) {
    const slug = termFile[1];
    const group = await loadStaticAsset("/data/vocab/" + vocabFiles[slug] + ".json", request, url, rawEnv);
    if (!group || !group.ok) return group;
    const data = (await group.json())[slug];
    return data ? Response.json(data, { headers: { "Cache-Control": "public, max-age=3600" } }) : null;
  }
  if (rawEnv.ASSETS) {
    const assetUrl = new URL(normalizedPath, url.origin);
    const safeMethod = request.method === "HEAD" ? "HEAD" : "GET";
    const assetRes = await rawEnv.ASSETS.fetch(new Request(assetUrl.toString(), { method: safeMethod }));
    if (assetRes && assetRes.status !== 404) return assetRes;
  }
  if (rawEnv.STATIC_ASSETS_LOADER) {
    const asset = await rawEnv.STATIC_ASSETS_LOADER(`/public${normalizedPath}`);
    if (asset) {
      return new Response(asset.body, {
        status: 200,
        headers: {
          "Content-Type": asset.contentType || inferContentType(normalizedPath),
          "Cache-Control": "public, max-age=3600",
          ...SECURITY_HEADERS
        }
      });
    }
  }
  return null;
}
__name(loadStaticAsset, "loadStaticAsset");
var KNOWN_VOCAB_SLUGS = new Set(SPECIALIZED_DOMAINS.map((d) => d.slug));
var cachedReaderLibrary = null;
async function loadReaderLibrary(request, url, rawEnv) {
  if (cachedReaderLibrary) return cachedReaderLibrary;
  try {
    const assetRes = await loadStaticAsset("/data/reader-library.json", request, url, rawEnv);
    if (!assetRes || assetRes.status !== 200) return null;
    cachedReaderLibrary = await assetRes.json();
    return cachedReaderLibrary;
  } catch {
    return null;
  }
}
__name(loadReaderLibrary, "loadReaderLibrary");
async function loadVocabJson(domainSlug, request, url, rawEnv) {
  const safeSlug = String(domainSlug || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!safeSlug || !KNOWN_VOCAB_SLUGS.has(safeSlug)) return null;
  try {
    const assetRes = await loadStaticAsset(`/data/vocab/${safeSlug}.json`, request, url, rawEnv);
    if (!assetRes || assetRes.status !== 200) return null;
    return await assetRes.json();
  } catch {
    return null;
  }
}
__name(loadVocabJson, "loadVocabJson");
var cachedVocabV5 = null;
async function loadVocabV5Data(request, url, rawEnv) {
  if (cachedVocabV5) return cachedVocabV5;
  try {
    const idxRes = await loadStaticAsset("/data/vocab-v5/index.json", request, url, rawEnv);
    if (!idxRes || idxRes.status !== 200) return null;
    const index = await idxRes.json();
    const entries = [];
    for (const s of index.shards || []) {
      const sRes = await loadStaticAsset(`/data/vocab-v5/${s.file}`, request, url, rawEnv);
      if (sRes && sRes.status === 200) {
        const shardData = await sRes.json();
        if (Array.isArray(shardData.entries)) entries.push(...shardData.entries);
      }
    }
    cachedVocabV5 = { index, entries };
    return cachedVocabV5;
  } catch {
    return null;
  }
}
__name(loadVocabV5Data, "loadVocabV5Data");
function failure(status, request, id) {
  if (new URL(request.url).pathname.startsWith("/api/")) {
    return jsonResponse({ ok: false, error: { code: String(status), message: errorTitles[status] }, requestId: id }, status);
  }
  const subtitle = status === 404 ? "Trang bạn đang truy cập không tồn tại, đã được di chuyển hoặc tạm thời không khả dụng." : id ? `Mã yêu cầu: ${id}. Vui lòng thử lại sau hoặc gửi mã này cho bộ phận CSKH.` : "Bạn có thể quay lại trang chủ hoặc xem hướng dẫn tại Trung Tâm Trợ Giúp.";
  return htmlResponse(renderPublicPage({
    title: errorTitles[status] || `Lỗi ${status}`,
    contentHtml: `<section class="wb-error-state" style="max-width:640px;margin:28px auto;text-align:center;background:#fff;border:1px solid #d7e6e6;border-radius:18px;padding:36px 24px 0;overflow:hidden;"><strong style="font-size:5.2rem;font-weight:900;color:#146466;line-height:1;display:block;">${status}</strong><svg class="wb-swoosh-red" viewBox="0 0 120 12" fill="none"><path d="M4 9C40 2 82 2 116 7" stroke="#C92F1C" stroke-width="4" stroke-linecap="round"/></svg><h1 style="margin:0 0 10px;font-size:1.9rem;">${escapeHtml(errorTitles[status] || "Đã xảy ra lỗi")}</h1><p class="wb-muted" style="margin:0 0 22px;">${escapeHtml(subtitle)}</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;"><a class="wb-btn wb-btn-primary" href="/">Về Trang chủ</a><a class="wb-btn wb-btn-outline" href="/help/errors">Quay lại / Hướng dẫn lỗi</a></div>${renderErrorWaveSvg()}</section>`
  }), status);
}
__name(failure, "failure");
var errorTitles = { 400: "Yêu cầu không hợp lệ", 401: "Vui lòng đăng nhập", 403: "Bạn chưa có quyền truy cập", 404: "Không tìm thấy trang", 408: "Yêu cầu đã hết hạn", 409: "Dữ liệu vừa được cập nhật", 410: "Trang đã ngừng cung cấp", 413: "Tệp quá lớn", 415: "Định dạng chưa được hỗ trợ", 422: "Vui lòng kiểm tra dữ liệu", 429: "Vui lòng thử lại sau", 500: "Hệ thống tạm thời gặp sự cố", 502: "Kết nối bị gián đoạn", 503: "Dịch vụ tạm thời chưa khả dụng", 504: "Dịch vụ phản hồi chậm" };
function logFailure(err, route, id, status, rayId = null) {
  const frames = String(err?.stack || "").split("\n").filter((line) => /^\s+at /.test(line)).slice(0, 12);
  const message = String(err?.message || "").slice(0, 300) || void 0;
  const cause = err?.cause ? String(err.cause?.message || err.cause).slice(0, 200) : void 0;
  console.error(JSON.stringify({ time: (/* @__PURE__ */ new Date()).toISOString(), requestId: id, rayId: /^[a-f0-9]{16,32}(?:-[A-Z]{3})?$/i.test(rayId || "") ? rayId : void 0, route, type: err?.name || "Error", message, cause, stack: frames, status }));
}
__name(logFailure, "logFailure");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
    try {
      if (path === "/sitemap.xml") {
        const origin = new URL(env.APP_BASE_URL || "https://wordbridge.io.vn").origin;
        const entries = SITEMAP_PATHS.map((route) => `<url><loc>${origin}${route}</loc></url>`).join("");
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      }
      if (path.startsWith("/styles/") || path.startsWith("/scripts/") || path.startsWith("/branding/") || path.startsWith("/data/") || path.startsWith("/public/")) {
        const normalizedPath = path.startsWith("/public/") ? path.slice("/public".length) : path;
        const assetRes = await loadStaticAsset(normalizedPath, request, url, env);
        if (assetRes) return assetRes;
      }
      if (REMOVED_LEGACY_PATHS.has(path) || path.startsWith("/social/") || path.startsWith("/friends/") || path.startsWith("/organizations/") || path.startsWith("/examinations/") || path.startsWith("/examination-attempts/") || path.startsWith("/examination-results/")) {
        return failure(410, request);
      }
      if (/^\/admin(?:\/|$)/i.test(path)) return failure(404, request);
      if (/\/(?:russian|ru|tieng-nga)(?:\/|$)/i.test(path)) return failure(410, request);
      if (!env.DB) {
        const id = (globalThis.crypto || nodeWebCrypto).randomUUID();
        logFailure(new Error("Missing D1 binding"), "fetch", id, 503);
        return failure(503, request, id);
      }
      await ensurePublicCatalogSchema(env.DB);
      const safeDb = createSafeD1Adapter(env.DB);
      const services = createServices(env, safeDb, () => loadReaderLibrary(request, url, env));
      const cookies = parseCookies(request);
      const user = await services.auth.authenticateSession(cookies.wb_session);
      const runtime = await loadRuntimeFromD1(safeDb);
      const bypassMaintenance = path === "/login" || path === "/help" || path.startsWith("/api/v1/health") || path.startsWith("/api/v1/auth/") || services.auth.hasAnyAdminRole(user);
      if (runtime?.site?.maintenance_mode && !bypassMaintenance) {
        return await renderMaintenancePage(runtime.site);
      }
      if (path === "/session-invalid") {
        return htmlResponse(renderPublicPage({
          title: "Phiên đăng nhập không hợp lệ",
          currentPath: "/session-invalid",
          user: null,
          runtime,
          contentHtml: renderSessionInvalidContent({ escapeHtml })
        }), 401);
      }
      if (path === "/quan-tri/khoi-tao" || path === "/quan-tri/dang-nhap" || path === "/quan-tri/login" || path === "/quan-tri" || path.startsWith("/quan-tri/")) {
        const saCountRow = await safeDb.prepare(
          "SELECT COUNT(*) AS cnt FROM wb_account_roles ar JOIN wb_roles r ON r.id = ar.role_id WHERE r.code = 'super_admin'"
        ).first().catch(() => ({ cnt: 0 }));
        const hasSuperAdmin = Number(saCountRow?.cnt || 0) > 0;
        if (!hasSuperAdmin && env.ENVIRONMENT !== "test" && (path === "/quan-tri" || path === "/quan-tri/khoi-tao" || path === "/quan-tri/dang-nhap" || path === "/quan-tri/login")) {
          return new Response(renderAdminBootstrapPage({ escapeHtml, prefillUser: user }), {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", ...SECURITY_HEADERS }
          });
        }
        if (path === "/quan-tri/khoi-tao" && hasSuperAdmin) {
          return redirectResponse("/quan-tri/dang-nhap");
        }
      }
      if (path === "/quan-tri/dang-nhap" || path === "/quan-tri/login") {
        if (user && services.auth.hasAnyAdminRole(user)) {
          return redirectResponse("/quan-tri");
        }
        const notice = user && !services.auth.hasAnyAdminRole(user)
          ? "Phiên hiện tại là tài khoản người học thông thường và không có quyền quản trị. Vui lòng đăng nhập bằng tài khoản quản trị được cấp quyền."
          : "";
        return new Response(renderAdminLoginPage({ escapeHtml, notice }), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", ...SECURITY_HEADERS }
        });
      }
      if (path === "/quan-tri" || path.startsWith("/quan-tri/")) {
        if (!user) return redirectResponse("/quan-tri/dang-nhap");
        if (!services.auth.hasAnyAdminRole(user)) return failure(403, request);
        const adminSession = await services.adminPin.authenticateAdminSession(user, cookies.wb_admin_session);
        if (!adminSession) {
          const pinStatus = await services.adminPin.getPinStatus(user.accountId);
          return new Response(renderAdminPinLockPage({ user, pinStatus, escapeHtml }), {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", ...SECURITY_HEADERS }
          });
        }
        const section = path === "/quan-tri" ? "" : path.slice("/quan-tri/".length);
        const html = await renderAdminCenterHtml({ section, user, adminSession, services, db: safeDb, escapeHtml });
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", ...SECURITY_HEADERS }
        });
      }
      if (path === "/help/errors") {
        return htmlResponse(renderPublicPage({ title: "Bộ trang lỗi hệ thống", currentPath: path, breadcrumbs: [{ label: "Trang chủ", href: "/" }, { label: "Trung Tâm Trợ Giúp", href: "/help" }, { label: "Bộ trang lỗi hệ thống" }], user, contentHtml: renderErrorSystemHubHtml({ escapeHtml }) }));
      }
      if (path.startsWith("/help/errors/")) {
        const code = path.slice("/help/errors/".length);
        const title = code === "1101" ? "Sự cố ngoại lệ Worker (Cloudflare 1101)" : code === "1100" ? "Sự cố lớp mạng biên (Cloudflare 1100)" : errorTitles[Number(code)];
        if (!title) return failure(404, request);
        const advice = code === "1101" ? "Worker gặp ngoại lệ khi xử lý yêu cầu. Hãy thử lại sau và cung cấp Ray ID cho bộ phận hỗ trợ." : code === "401" ? "Đăng nhập lại để tiếp tục." : code === "413" ? "Chọn tệp nhỏ hơn rồi gửi lại." : code === "415" ? "Kiểm tra định dạng của tệp trước khi gửi." : code === "409" ? "Tải lại trang để xem phiên bản mới nhất." : ["400", "422"].includes(code) ? "Kiểm tra thông tin đã nhập rồi gửi lại." : "Bạn có thể quay lại trang chủ hoặc liên hệ bộ phận hỗ trợ.";
        return htmlResponse(renderPublicPage({ title, currentPath: path, user, contentHtml: `<section class="wb-error-state"><strong>${Number(code)}</strong><h1>${title}</h1><p>${advice}</p><a class="wb-btn wb-btn-primary" href="${code === "401" ? "/login" : "/help"}">${code === "401" ? "Đăng nhập" : "Trợ giúp"}</a> <a href="/">Trang chủ</a></section>` }));
      }
      if (path === "/api/v1/lessons/notes") {
        if (!user) return jsonResponse({ ok: false, error: { code: "UNAUTHORIZED", message: "Cần đăng nhập để lưu ghi chú bài học." } }, 401);
        if (request.method === "POST") {
          const b = await request.json().catch(() => ({}));
          const csrfToken = request.headers.get("X-CSRF-Token") || b._csrf || "";
          if (!user.csrfToken || !csrfToken || !timingSafeEqual(String(csrfToken), String(user.csrfToken))) {
            return jsonResponse({ ok: false, error: { code: "CSRF_INVALID", message: "Thiếu hoặc sai mã bảo vệ CSRF." } }, 403);
          }
          const lessonSlug = String(b.lessonSlug || "").trim();
          const noteContent = String(b.noteContent || "").trim();
          await safeDb.prepare(
            `INSERT INTO wb_lesson_notes (id, account_id, lesson_slug, note_content, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(account_id, lesson_slug) DO UPDATE SET note_content=excluded.note_content, updated_at=datetime('now')`
          ).bind(`ln_${Date.now()}`, user.accountId, lessonSlug, noteContent).run();
          return jsonResponse({ ok: true, message: "Đã lưu ghi chú bài học." });
        }
        const rows = (await safeDb.prepare("SELECT lesson_slug, note_content, updated_at FROM wb_lesson_notes WHERE account_id = ?").bind(user.accountId).all()).results || [];
        return jsonResponse({ ok: true, notes: rows });
      }
      if (path === "/api/v1/vocabulary/export" && request.method === "GET") {
        if (!user) return jsonResponse({ ok: false, error: { code: "UNAUTHORIZED", message: "Cần đăng nhập để xuất sổ từ vựng." } }, 401);
        const rows = (await safeDb.prepare(
          `SELECT e.headword, e.phonetic, e.language_code, e.meaning_vi, n.mastery_status, n.interval_days
           FROM wb_public_vocabulary_notebook n JOIN wb_public_dictionary_entries e ON e.id = n.entry_id WHERE n.account_id = ?`
        ).bind(user.accountId).all()).results || [];
        const csv = ["headword,phonetic,language,meaning_vi,status,interval_days", ...rows.map((r) => `"${String(r.headword || "").replace(/"/g, '""')}","${String(r.phonetic || "").replace(/"/g, '""')}","${r.language_code}","${String(r.meaning_vi || "").replace(/"/g, '""')}","${r.mastery_status}",${r.interval_days}`)].join("\n");
        return new Response(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="wordbridge-vocabulary.csv"', ...SECURITY_HEADERS } });
      }
      if (path.startsWith("/api/v1/")) {
        return await handleApiRequest(request, url, {
          services,
          user,
          env,
          db: safeDb,
          ctx,
          loadVocabJson: /* @__PURE__ */ __name((domainSlug) => loadVocabJson(domainSlug, request, url, env), "loadVocabJson")
        });
      }
      if (path === "/") return await renderHomePage({ db: safeDb, user, runtime });
      if (path === "/features") return await renderFeaturesPage({ user, runtime });
      if (path === "/about") return await renderAboutPage({ user, runtime });
      if (path === "/faq") return await renderFaqPage({ user, runtime });
      if (path === "/contact") return await renderContactPage({ user, runtime, env });
      if (path === "/help") return await renderHelpCenterPage({ services, user, runtime });
      if (path === "/reader") return await renderReaderLibraryPage({ services, user, url, runtime });
      const readerDocMatch = path.match(/^\/reader\/([^/]+)$/);
      if (readerDocMatch) return await renderReaderDocumentPage({ services, user, slug: readerDocMatch[1], runtime });
      if (path === "/search") return await renderGlobalSearchPage({ db: safeDb, user, url });
      if (path.startsWith("/policies/")) return await renderPolicyPage({ services, user, policySlug: path.slice("/policies/".length), runtime });
      if (path === "/learning") return await renderLearningHub({ db: safeDb, user });
      if (path === "/learning/path") return await renderLearningPathPage({ db: safeDb, user });
      if (path === "/learning/skills") return await renderSkillCenterHub({ user });
      if (path.startsWith("/skills/")) return await renderSkillCenterPage({ db: safeDb, user, skill: path.slice("/skills/".length) });
      if (path === "/my-knowledge") return await renderKnowledgePage({ db: safeDb, user });
      if (path === "/my-mistakes") return await renderMistakesPage({ db: safeDb, user });
      if (path.startsWith("/learning/")) return await renderLanguageLearningPage({ db: safeDb, user, languageSlug: path.slice("/learning/".length) });
      const progLevelMatch = path.match(/^\/programs\/([^/]+)\/levels\/([^/]+)$/);
      if (progLevelMatch) return await renderProgramDetailPage({ db: safeDb, user, programSlug: progLevelMatch[1] });
      const progMatch = path.match(/^\/programs\/([^/]+)$/);
      if (progMatch) return await renderProgramDetailPage({ db: safeDb, user, programSlug: progMatch[1] });
      const courseCurMatch = path.match(/^\/courses\/([^/]+)\/curriculum$/);
      if (courseCurMatch) return await renderCourseCurriculumPage({ db: safeDb, user, courseSlug: courseCurMatch[1], showCurriculumOnly: true });
      const courseMatch = path.match(/^\/courses\/([^/]+)$/);
      if (courseMatch) return await renderCourseCurriculumPage({ db: safeDb, user, courseSlug: courseMatch[1], showCurriculumOnly: false });
      const modMatch = path.match(/^\/modules\/([^/]+)$/);
      if (modMatch) return await renderModuleDetailPage({ db: safeDb, user, moduleSlug: modMatch[1] });
      const weekMatch = path.match(/^\/weeks\/([^/]+)$/);
      if (weekMatch) return await renderWeekDetailPage({ db: safeDb, user, weekSlug: weekMatch[1] });
      const lessonResMatch = path.match(/^\/lessons\/([^/]+)\/result$/);
      if (lessonResMatch) return await renderLessonResultPage({ db: safeDb, user, lessonSlug: lessonResMatch[1] });
      const lessonMatch = path.match(/^\/lessons\/([^/]+)$/);
      if (lessonMatch) return await renderLessonDetailPage({ db: safeDb, user, lessonSlug: lessonMatch[1] });
      if (path === "/my-learning") return await renderMyLearningPage({ db: safeDb, user, subPath: "" });
      if (path === "/my-learning/history") return await renderMyLearningPage({ db: safeDb, user, subPath: "history" });
      if (path === "/my-learning/vocabulary") return await renderMyLearningPage({ db: safeDb, user, subPath: "vocabulary" });
      const drill = path.match(/^\/flashcards\/([a-z]+)$/);
      if (drill && Object.hasOwn(cardSkills, drill[1])) return await renderSkillCards({ db: safeDb, user, skill: drill[1], url });
      if (path === "/dictionary") return await renderDictionaryPage({ services, user, url });
      const dictEntryMatch = path.match(/^\/dictionary\/([^/]+)\/([^/]+)$/);
      if (dictEntryMatch) return await renderDictionaryEntryPage({ services, user, languageSlug: dictEntryMatch[1], entrySlug: dictEntryMatch[2] });
      const dictLangMatch = path.match(/^\/dictionary\/([^/]+)$/);
      if (dictLangMatch) return await renderDictionaryPage({ services, user, url, languageSlug: dictLangMatch[1] });
      if (path === "/vocabulary") return await renderVocabularyPage({ db: safeDb, user, mode: "notebook", url });
      if (path === "/vocabulary/notebook") return await renderVocabularyPage({ db: safeDb, user, mode: "notebook", url });
      if (path === "/vocabulary/sets") return await renderVocabularyPage({ db: safeDb, user, mode: "sets", url });
      if (path === "/vocabulary/flashcards") return await renderVocabularyPage({ db: safeDb, user, mode: "flashcards", url });
      if (path === "/vocabulary/review") return await renderVocabularyPage({ db: safeDb, user, mode: "review", url });
      if (path === "/practice") return await renderPracticePage({ services, db: safeDb, user });
      if (path === "/practice/history") return await renderPracticeHistoryPage({ db: safeDb, user });
      const prResMatch = path.match(/^\/practice\/results\/([^/]+)$/);
      if (prResMatch) return await renderPracticeResultPage({ db: safeDb, user, resultId: prResMatch[1] });
      const practiceSkillMatch = path.match(/^\/practice\/(listening|speaking|reading|writing|vocabulary|grammar)$/);
      if (practiceSkillMatch) return await renderPracticePage({ services, db: safeDb, user, skill: practiceSkillMatch[1] });
      if (path === "/specialized") return await renderSpecializedPage({ db: safeDb, user });
      if (path.startsWith("/specialized/")) return await renderSpecializedPage({ db: safeDb, user, subSlug: path.slice("/specialized/".length) });
      if (path === "/learner-meet") return await renderLearnerMeetPage({ db: safeDb, services, user });
      if (path === "/learner-meet/sessions") return await renderLearnerMeetPage({ db: safeDb, services, user, subPath: "sessions" });
      if (path === "/learner-meet/create") return await renderLearnerMeetPage({ db: safeDb, services, user, subPath: "create" });
      if (path === "/learner-meet/history") return await renderLearnerMeetPage({ db: safeDb, services, user, subPath: "history" });
      const lmJoinMatch = path.match(/^\/learner-meet\/join\/([^/]+)$/);
      if (lmJoinMatch) return await renderLearnerMeetPage({ db: safeDb, services, user, subPath: "room", param: lmJoinMatch[1] });
      const lmRoomMatch = path.match(/^\/learner-meet\/room\/([^/]+)$/);
      if (lmRoomMatch) return await renderLearnerMeetPage({ db: safeDb, services, user, subPath: "room", param: lmRoomMatch[1] });
      if (path === "/intelligence") return await renderIntelligenceHub({ user });
      const intelPageMatch = path.match(/^\/intelligence\/([a-z0-9-]+)$/);
      if (intelPageMatch) return await renderIntelligenceSystemPage({ services, user, systemSlug: intelPageMatch[1] });
      if (path === "/login") return await renderLoginPage({ user, url, services });
      if (path === "/register") return await renderRegisterPage({ user });
      if (path === "/verify-email") return await renderVerifyEmailPage({ services, url, request });
      if (path === "/forgot-password") return await renderPasswordPage({ mode: "forgot", user, url });
      if (path === "/reset-password") return await renderPasswordPage({ mode: "reset", user, url });
      if (path === "/profile") return await renderAccountPage({ db: safeDb, services, user, subPath: "profile-root" });
      if (path === "/account") return await renderAccountPage({ db: safeDb, services, user, subPath: "" });
      if (path.startsWith("/account/")) return await renderAccountPage({ db: safeDb, services, user, subPath: path.slice("/account/".length) });
      return failure(404, request);
    } catch (err) {
      const id = (globalThis.crypto || nodeWebCrypto).randomUUID();
      const section = path.split("/")[1];
      const route = ["learning", "practice", "account", "api", "lessons", "dictionary", "flashcards", "skills", "reader", "styles", "my-knowledge", "my-mistakes"].includes(section) ? "/" + section : "/";
      logFailure(err, route, id, 500, request.headers.get("cf-ray"));
      const res500 = failure(500, request, id);
      const errClass = /D1_ERROR|SQLITE/i.test(String(err?.message || "")) ? "WB_D1_ERROR" : /Illegal invocation|TypeError/i.test(String(err?.name || "") + " " + String(err?.message || "")) ? "WB_RUNTIME_TYPE_ERROR" : "WB_WORKER_ERROR";
      res500.headers.set("X-WB-Request-Id", id);
      res500.headers.set("X-WB-Error-Class", errClass);
      return res500;
    }
  },
  async scheduled(event, env) {
    try {
      const results = await createServices(env).jobs.runScheduledSweep();
      if (results.some((result) => result?.ok === false)) throw new Error("Scheduled job failed");
    } catch (err) {
      logFailure(err, "scheduled", (globalThis.crypto || nodeWebCrypto).randomUUID(), 500);
      throw new Error("Scheduled job failed");
    }
  }
};
export {
  index_default as default
};
