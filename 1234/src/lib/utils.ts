import { NextResponse } from "next/server";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind utility classes while resolving conflicting variants. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer VND amounts with Vietnamese locale grouping. */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

/** Format numbers with Vietnamese dot grouping (e.g. 1.839). */
export function formatViNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Safely parse stored JSON strings with a typed fallback. */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Convert raw correct count in a Listening or Reading section to the TOEIC 5–495 scale
 * (rounded to nearest multiple of 5, matching standard ETS score steps).
 */
export function calculateToeicSectionScore(correct: number, total: number): number {
  if (total <= 0 || correct <= 0) return 5;
  const ratio = Math.min(1, Math.max(0, correct / total));
  const raw = Math.round((5 + ratio * 490) / 5) * 5;
  return Math.min(495, Math.max(5, raw));
}

/** Format seconds into mm:ss countdown display. */
export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


// === api-response.ts ===

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}


// === admin-utils.ts ===
/** Normalize Vietnamese text into URL-safe lowercase kebab slug. */
export function slugifyVietnamese(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `item-${Date.now()}`;
}

/** Parse bounded integer safely with fallback. */
export function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const num = Number(raw);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}


// === age-safety.ts ===
import crypto from "crypto";

export type AgeGroupCode = "UNDER_16" | "AGE_16_17" | "ADULT_18_PLUS";
export type MatchingScope = "UNDER_18" | "ADULT_18_PLUS";

/**
 * Compute age group category in Vietnam timezone based on date of birth.
 * Falls back to ADULT_18_PLUS when DOB is omitted for existing accounts.
 */
export function computeAgeGroup(dob: Date | string | null | undefined): AgeGroupCode {
  if (!dob) return "ADULT_18_PLUS";
  const birth = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birth.getTime())) return "ADULT_18_PLUS";

  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  if (age < 16) return "UNDER_16";
  if (age < 18) return "AGE_16_17";
  return "ADULT_18_PLUS";
}

export function isMinorAgeGroup(ageGroup: string | null | undefined): boolean {
  return ageGroup === "UNDER_16" || ageGroup === "AGE_16_17";
}

export function getMatchingScope(ageGroup: string | null | undefined): MatchingScope {
  return isMinorAgeGroup(ageGroup) ? "UNDER_18" : "ADULT_18_PLUS";
}

export function getAgeGroupLabel(ageGroup: string | null | undefined): string {
  if (ageGroup === "UNDER_16") return "Dưới 16 tuổi (Giám hộ phụ huynh)";
  if (ageGroup === "AGE_16_17") return "16 - 17 tuổi (Dưới 18 tuổi)";
  return "Từ 18 tuổi trở lên";
}

export function generateParentMonitorCode(): string {
  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VSVC-PH-${token}`;
}

/**
 * Generate a deterministic, safe Google Meet-style room URL so peers do not
 * exchange personal phone numbers, Zalo, or private emails.
 */
export function generateSafeMeetLink(seedKey: string): string {
  const digest = crypto.createHash("sha256").update(seedKey).digest("hex");
  const letters = (chunk: string) =>
    chunk
      .split("")
      .map((ch) => String.fromCharCode(97 + (parseInt(ch, 16) % 26)))
      .join("");
  const p1 = letters(digest.slice(0, 3));
  const p2 = letters(digest.slice(3, 7));
  const p3 = letters(digest.slice(7, 10));
  return `https://meet.google.com/${p1}-${p2}-${p3}`;
}

export interface PairingEligibilityCheck {
  allowed: boolean;
  reason?: string;
}

export function checkPairingEligibility(user: {
  approvalStatus: string;
  ageGroup: string;
  parentConsentStatus: string;
  guardianName?: string | null;
}): PairingEligibilityCheck {
  if (user.approvalStatus === "SUSPENDED") {
    return {
      allowed: false,
      reason: "Tài khoản đang bị tạm khóa do vi phạm nội quy thử nghiệm kín.",
    };
  }
  if (user.approvalStatus !== "APPROVED") {
    return {
      allowed: false,
      reason: "Tài khoản đang chờ giáo viên phụ trách hoặc quản trị viên duyệt tham gia thử nghiệm kín.",
    };
  }
  if (user.ageGroup === "UNDER_16" && !user.guardianName) {
    return {
      allowed: false,
      reason: "Theo Nghị định 147/2024/NĐ-CP, người dưới 16 tuổi cần khai thông tin cha/mẹ/người giám hộ giám sát.",
    };
  }
  if (isMinorAgeGroup(user.ageGroup) && user.parentConsentStatus !== "APPROVED") {
    return {
      allowed: false,
      reason: "Học viên dưới 18 tuổi bắt buộc có Phiếu đồng ý của phụ huynh được duyệt trước khi ghép cặp luyện nói.",
    };
  }
  return { allowed: true };
}


// === vocational-taxonomy.ts ===
/**
 * WORD BRIDGE – ĐỊNH HƯỚNG GIÁO DỤC NGHỀ NGHIỆP & DANH MỤC LĨNH VỰC, NGÀNH, CHUYÊN NGÀNH (PHẦN II)
 * Cấu trúc phân loại mở rộng:
 * Lĩnh vực -> Nhóm ngành -> Ngành -> Chuyên ngành -> Tình huống nghề nghiệp -> Bài học -> Bài thực hành
 */

export interface LearnerTargetGroup {
  code: "GROUP_A" | "GROUP_B" | "GROUP_C" | "GROUP_D" | "GROUP_E";
  legacyCode: "N1" | "N2" | "N3";
  name: string;
  shortLabel: string;
  institutionType: string;
  description: string;
  needs: string[];
}

export interface TrainingInstitutionType {
  code: string;
  name: string;
  order: number;
}

export interface VocationalFieldItem {
  code: string;
  name: string;
  groupName: string;
  specialties: string[];
}

export const LEARNER_TARGET_GROUPS: LearnerTargetGroup[] = [
  {
    code: "GROUP_A",
    legacyCode: "N1",
    name: "Nhóm A – Học viên Trung tâm GDNN–GDTX",
    shortLabel: "Học viên GDNN–GDTX",
    institutionType: "Trung tâm GDNN–GDTX",
    description:
      "Học viên đang theo học tại các Trung tâm Giáo dục nghề nghiệp – Giáo dục thường xuyên, trình độ đầu vào đa dạng, bắt đầu từ căn bản và phát triển dần theo chuyên ngành.",
    needs: [
      "Tiếng Anh cơ bản phục vụ học tập và định hướng nghề nghiệp",
      "Tiếng Anh giao tiếp trong môi trường nghề",
      "Từ vựng theo ngành hoặc nghề đang học",
      "Đọc hiểu hướng dẫn, quy trình và tài liệu chuyên môn",
      "Giao tiếp với khách hàng, đồng nghiệp và người hướng dẫn",
      "Chuẩn bị cho thực tập, học nghề và tìm kiếm việc làm",
    ],
  },
  {
    code: "GROUP_B",
    legacyCode: "N1",
    name: "Nhóm B – Học sinh trường Trung cấp nghề",
    shortLabel: "Học sinh Trung cấp nghề",
    institutionType: "Trường Trung cấp nghề",
    description:
      "Học sinh đang học tại các trường trung cấp nghề, theo nhiều khoa và chuyên ngành kỹ thuật, dịch vụ, nghiệp vụ.",
    needs: [
      "Tiếng Anh theo đúng ngành đang học",
      "Thuật ngữ và từ vựng nghề nghiệp",
      "Đọc hiểu tài liệu kỹ thuật",
      "Mô tả dụng cụ, thiết bị, quy trình và thao tác nghề",
      "Trao đổi trong môi trường thực hành và thực tập",
      "Giao tiếp khi tiếp xúc với doanh nghiệp hoặc khách hàng nước ngoài",
      "Chuẩn bị phỏng vấn và tìm kiếm việc làm",
    ],
  },
  {
    code: "GROUP_C",
    legacyCode: "N1",
    name: "Nhóm C – Sinh viên trường Cao đẳng nghề",
    shortLabel: "Sinh viên Cao đẳng nghề",
    institutionType: "Trường Cao đẳng nghề",
    description:
      "Nhóm đối tượng trọng tâm của nền tảng: sinh viên đang theo học tại các trường cao đẳng nghề, cao đẳng kỹ thuật và các cơ sở đào tạo nghề có chương trình chuyên môn.",
    needs: [
      "Tiếng Anh chuyên ngành theo khoa và chuyên ngành đào tạo",
      "Đọc tài liệu, hướng dẫn và tiêu chuẩn kỹ thuật bằng tiếng Anh",
      "Trình bày quy trình và giải thích vấn đề chuyên môn",
      "Giao tiếp trong quá trình thực tập",
      "Viết email công việc và báo cáo chuyên môn",
      "Tham gia phỏng vấn tuyển dụng",
      "Chuẩn bị làm việc tại doanh nghiệp có yếu tố nước ngoài",
      "Nâng cao năng lực cạnh tranh nghề nghiệp",
    ],
  },
  {
    code: "GROUP_D",
    legacyCode: "N2",
    name: "Nhóm D – Sinh viên đại học theo các khối ngành chuyên môn",
    shortLabel: "Sinh viên Đại học chuyên môn",
    institutionType: "Trường Đại học",
    description:
      "Sinh viên đại học thuộc các ngành CNTT, Kỹ thuật, Kinh tế và kế toán, Y tế và chăm sóc sức khỏe, Du lịch và khách sạn, Quản trị, Logistics và các ngành chuyên môn khác.",
    needs: [
      "Đọc tài liệu chuyên ngành bằng tiếng Anh",
      "Thuyết trình chuyên môn",
      "Viết email công việc",
      "Luyện phỏng vấn tuyển dụng",
      "Sử dụng tiếng Anh trong hoạt động chuyên môn",
    ],
  },
  {
    code: "GROUP_E",
    legacyCode: "N3",
    name: "Nhóm E – Người đang làm việc chuyên môn",
    shortLabel: "Người đang làm việc chuyên môn",
    institutionType: "Người đã đi làm hoặc tự học nghề nghiệp",
    description:
      "Kỹ thuật viên, nhân viên văn phòng, nhân viên kế toán, nhân sự ngành công nghệ, nhân viên kỹ thuật, người làm dịch vụ và người lao động có nhu cầu nâng cao hoặc chuyển đổi nghề nghiệp.",
    needs: [
      "Giao tiếp công việc hàng ngày",
      "Họp chuyên môn",
      "Đọc tài liệu kỹ thuật và quy trình",
      "Xử lý tình huống nghề nghiệp",
      "Viết email và làm việc với đối tác nước ngoài",
    ],
  },
];

export const TRAINING_INSTITUTION_TYPES: TrainingInstitutionType[] = [
  { code: "GDNN_GDTX", name: "Trung tâm GDNN–GDTX", order: 1 },
  { code: "TRUNG_CAP_NGHE", name: "Trường Trung cấp nghề", order: 2 },
  { code: "CAO_DANG_NGHE", name: "Trường Cao đẳng nghề", order: 3 },
  {
    code: "CAO_DANG_KY_THUAT",
    name: "Trường Cao đẳng có đào tạo chuyên ngành kỹ thuật và nghề nghiệp",
    order: 4,
  },
  { code: "DAI_HOC", name: "Trường Đại học", order: 5 },
  { code: "CO_SO_KHAC", name: "Cơ sở đào tạo chuyên môn khác", order: 6 },
  { code: "DI_LAM_TU_HOC", name: "Người đã đi làm hoặc tự học nghề nghiệp", order: 7 },
];

export const VOCATIONAL_FIELDS_CATALOG: VocationalFieldItem[] = [
  {
    code: "A",
    name: "Công nghệ thông tin và công nghệ số",
    groupName: "Khối Công nghệ & Số hóa",
    specialties: [
      "Công nghệ thông tin",
      "Khoa học máy tính",
      "Lập trình phần mềm",
      "Phát triển website",
      "Phát triển ứng dụng",
      "Trí tuệ nhân tạo",
      "Khoa học dữ liệu",
      "Quản trị cơ sở dữ liệu",
      "Mạng máy tính",
      "An ninh mạng",
      "Điện toán đám mây",
      "Thiết kế đồ họa",
      "Đa phương tiện",
      "Công nghệ số",
    ],
  },
  {
    code: "B",
    name: "Kế toán, kinh tế và quản trị",
    groupName: "Khối Kinh tế, Tài chính & Quản trị",
    specialties: [
      "Kế toán doanh nghiệp",
      "Kế toán tài chính",
      "Kiểm toán",
      "Thuế",
      "Tài chính",
      "Ngân hàng",
      "Kinh doanh",
      "Marketing",
      "Thương mại điện tử",
      "Quản trị doanh nghiệp",
      "Nhân sự",
      "Hành chính văn phòng",
      "Kinh doanh quốc tế",
    ],
  },
  {
    code: "C",
    name: "Công nghệ ô tô và phương tiện",
    groupName: "Khối Kỹ thuật Ô tô & Phương tiện",
    specialties: [
      "Công nghệ ô tô",
      "Bảo dưỡng và sửa chữa ô tô",
      "Kỹ thuật động cơ",
      "Điện ô tô",
      "Điện tử ô tô",
      "Chẩn đoán ô tô",
      "Công nghệ xe điện",
      "Xe máy",
      "Bảo dưỡng phương tiện",
    ],
  },
  {
    code: "D",
    name: "Cơ khí và chế tạo",
    groupName: "Khối Kỹ thuật Cơ khí & Chế tạo",
    specialties: [
      "Công nghệ kỹ thuật cơ khí",
      "Cơ khí chế tạo",
      "Gia công cơ khí",
      "CNC",
      "Hàn",
      "Tiện",
      "Phay",
      "Cắt gọt kim loại",
      "Thiết kế cơ khí",
      "Đúc kim loại",
      "Bảo trì thiết bị công nghiệp",
      "Cơ điện tử",
    ],
  },
  {
    code: "E",
    name: "Y tế và chăm sóc sức khỏe",
    groupName: "Khối Sức khỏe & Y Dược",
    specialties: [
      "Y khoa",
      "Điều dưỡng",
      "Dược",
      "Kỹ thuật xét nghiệm",
      "Kỹ thuật hình ảnh y học",
      "Phục hồi chức năng",
      "Hộ sinh",
      "Răng hàm mặt",
      "Chăm sóc sức khỏe cộng đồng",
      "Chăm sóc người cao tuổi",
      "Thiết bị y tế",
      "Dinh dưỡng",
      "Sơ cứu",
    ],
  },
  {
    code: "F",
    name: "Điện, điện tử và tự động hóa",
    groupName: "Khối Điện, Điện tử & Tự động hóa",
    specialties: [
      "Điện công nghiệp",
      "Điện dân dụng",
      "Điện tử",
      "Tự động hóa",
      "Điều khiển công nghiệp",
      "Robot công nghiệp",
      "Cảm biến",
      "Điện lạnh",
      "Hệ thống điện",
      "Năng lượng tái tạo",
    ],
  },
  {
    code: "G",
    name: "Xây dựng và kiến trúc",
    groupName: "Khối Xây dựng, Kiến trúc & Công trình",
    specialties: [
      "Kỹ thuật xây dựng",
      "Xây dựng dân dụng và công nghiệp",
      "Kiến trúc",
      "Nội thất",
      "Trắc địa",
      "Bản vẽ kỹ thuật",
      "Kết cấu",
      "Cấp thoát nước",
      "Vật liệu xây dựng",
      "Quản lý công trình",
      "An toàn lao động",
    ],
  },
  {
    code: "H",
    name: "Du lịch, nhà hàng và khách sạn",
    groupName: "Khối Du lịch, Nhà hàng & Khách sạn",
    specialties: [
      "Quản trị khách sạn",
      "Lễ tân",
      "Quản trị nhà hàng",
      "Nghiệp vụ buồng phòng",
      "Hướng dẫn du lịch",
      "Điều hành tour",
      "Dịch vụ du lịch",
      "Chăm sóc khách hàng",
    ],
  },
  {
    code: "I",
    name: "Ẩm thực và công nghệ thực phẩm",
    groupName: "Khối Ẩm thực & Chế biến Thực phẩm",
    specialties: [
      "Kỹ thuật chế biến món ăn",
      "Nghiệp vụ bếp",
      "Làm bánh",
      "Pha chế",
      "Barista",
      "Công nghệ thực phẩm",
      "Kiểm soát chất lượng",
      "An toàn thực phẩm",
      "Chế biến nông sản",
      "Chế biến thủy sản",
    ],
  },
  {
    code: "J",
    name: "Logistics và vận tải",
    groupName: "Khối Logistics, Kho vận & Xuất nhập khẩu",
    specialties: [
      "Logistics",
      "Quản lý kho",
      "Chuỗi cung ứng",
      "Xuất nhập khẩu",
      "Chứng từ thương mại",
      "Vận tải đường bộ",
      "Vận tải đường biển",
      "Vận tải hàng không",
      "Giao nhận",
      "Hải quan",
    ],
  },
  {
    code: "K",
    name: "Nông nghiệp và môi trường",
    groupName: "Khối Nông – Lâm – Thủy sản & Môi trường",
    specialties: [
      "Nông nghiệp công nghệ cao",
      "Trồng trọt",
      "Chăn nuôi",
      "Thú y",
      "Nuôi trồng thủy sản",
      "Lâm nghiệp",
      "Công nghệ sinh học",
      "Bảo vệ thực vật",
      "Môi trường",
      "Quản lý tài nguyên",
      "Xử lý chất thải",
    ],
  },
  {
    code: "L",
    name: "Thiết kế và sáng tạo",
    groupName: "Khối Thiết kế, Nghệ thuật & Sáng tạo số",
    specialties: [
      "Thiết kế đồ họa",
      "Thiết kế thời trang",
      "Thiết kế nội thất",
      "Nhiếp ảnh",
      "Điện ảnh",
      "Sáng tạo nội dung số",
      "Hoạt hình",
      "Thiết kế sản phẩm",
      "Mỹ thuật ứng dụng",
    ],
  },
  {
    code: "M",
    name: "Làm đẹp và dịch vụ cá nhân",
    groupName: "Khối Chăm sóc Sắc đẹp & Dịch vụ cá nhân",
    specialties: [
      "Chăm sóc da",
      "Trang điểm",
      "Tạo mẫu tóc",
      "Chăm sóc móng",
      "Spa",
      "Chăm sóc cá nhân",
      "Dịch vụ thẩm mỹ không xâm lấn",
    ],
  },
  {
    code: "N",
    name: "Giáo dục và khoa học xã hội",
    groupName: "Khối Giáo dục, Truyền thông & Xã hội",
    specialties: [
      "Giáo dục",
      "Sư phạm",
      "Tâm lý học",
      "Công tác xã hội",
      "Quản lý giáo dục",
      "Truyền thông",
      "Quan hệ công chúng",
      "Nghiên cứu xã hội",
      "Phát triển cộng đồng",
    ],
  },
  {
    code: "O",
    name: "Pháp luật và hành chính",
    groupName: "Khối Pháp luật, Hành chính & Văn thư",
    specialties: [
      "Pháp luật",
      "Pháp chế doanh nghiệp",
      "Hành chính",
      "Văn thư và lưu trữ",
      "Quản lý hành chính",
      "Nhân sự",
      "Tuân thủ và quản trị rủi ro",
    ],
  },
  {
    code: "P",
    name: "Các lĩnh vực khác",
    groupName: "Khối Hạ tầng, Dịch vụ công & Ngành nghề mới",
    specialties: [
      "Hàng không",
      "Hàng hải",
      "Đường sắt",
      "Dịch vụ công",
      "An toàn và bảo hộ lao động",
      "Khoa học",
      "Công nghệ mới",
      "Các ngành nghề mới phát sinh",
    ],
  },
];

export const SPECIALTY_CONTENT_MODULES: string[] = [
  "Lộ trình tiếng Anh",
  "Từ vựng chuyên môn",
  "Thuật ngữ",
  "Cách phát âm",
  "Mẫu câu",
  "Hội thoại nghề nghiệp",
  "Tình huống thực tế",
  "Bài đọc",
  "Bài nghe",
  "Bài viết",
  "Bài nói",
  "Bài tập",
  "Bài kiểm tra",
  "Nội dung chuẩn bị thực tập",
  "Nội dung chuẩn bị phỏng vấn",
  "Nội dung giao tiếp tại nơi làm việc",
];

export const ENGLISH_USAGE_GOALS: string[] = [
  "Đọc hiểu tài liệu, quy trình và tiêu chuẩn kỹ thuật chuyên ngành",
  "Giao tiếp trong giờ thực hành xưởng, phòng lab và kỳ thực tập",
  "Viết email công việc và báo cáo kỹ thuật / chuyên môn",
  "Chuẩn bị phỏng vấn tuyển dụng và làm việc tại doanh nghiệp FDI",
  "Giao tiếp với khách hàng, đối tác và đồng nghiệp nước ngoài",
];
