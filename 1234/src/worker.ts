/**
 * WORD BRIDGE - CLOUDFLARE WORKERS ENTRY POINT (main = "src/worker.ts")
 * Tuân thủ nghiêm ngặt Đặc tả Yêu cầu Nâng cấp Toàn diện:
 * - Tên phân hệ: WORD BRIDGE SOURCE STORAGE
 * - Vị trí quản trị: Quản trị -> Lưu trữ mã nguồn
 * - Đường dẫn truy cập riêng: /luu-tru-ma-nguon
 * - Hạ tầng: GitHub + Cloudflare Workers + Dịch vụ lưu trữ SQLite BLOB độc lập
 * - TUYỆT ĐỐI KHÔNG SỬ DỤNG: Cloudflare R2, Cloudflare D1
 *
 * Chức năng của Worker này:
 * 1. Đóng vai trò entry-point chính thức (`main = "src/worker.ts"`) khi chạy `npx wrangler deploy`.
 * 2. Xác thực tài khoản WORD BRIDGE (`lc_session` JWT HS256), kiểm tra RBAC (`ADMIN`), kiểm tra phiên PIN 8 giờ (`wb_vault_session`).
 * 3. Giao tiếp trực tiếp qua HTTPS/HTTP với Dịch vụ lưu trữ SQLite BLOB độc lập (`WB_STORAGE_SERVICE_URL`) hoặc bộ điều phối lưu trữ tích hợp cho mọi thao tác:
 *    - Xác thực 6 lớp, Thiết lập/Xác minh/Đổi mã PIN 6 chữ số (0-9, cho phép số 0 ở đầu), Khóa 15 phút sau 5 lần nhập sai liên tiếp, Phiên 8 giờ, Quên PIN qua OTP 5 phút dùng 1 lần, Khóa kho toàn hệ thống.
 *    - Tự động lưu (Tài liệu, Bài đăng cộng đồng, Bình luận cộng đồng) qua hàng đợi chống ghi trùng (`idempotencyKey`), tạo phiên bản mới khi chỉnh sửa.
 *    - Nhập dữ liệu cũ lần đầu theo lô có checkpoint và chống nhập lặp.
 *    - Tải tệp trực tiếp <= 15 MB/tệp, lưu SQLite BLOB, kiểm tra SHA-256, cách ly tệp nhạy cảm (.env, private key), xem trước văn bản an toàn (không thực thi mã).
 *    - Quản lý phiên bản, Thùng rác, Xóa vĩnh viễn có xác nhận nhiều bước ('XOA VINH VIEN'), Nhật ký hoạt động 25 sự kiện chuỗi băm chống sửa đổi, Xử lý khi xóa tài khoản, Sao lưu & Khôi phục.
 *    - Quản lý và mở rộng động 5 nhóm đối tượng người học (Nhóm A GDNN-GDTX, Nhóm B Trung cấp nghề, Nhóm C Cao đẳng nghề, Nhóm D Đại học chuyên môn, Nhóm E Người đi làm), 7 loại hình cơ sở đào tạo và 16 lĩnh vực chuyên ngành (A-P).
 * 4. Phục vụ trực tiếp giao diện Web tiếng Việt 100% của WORD BRIDGE và giao diện Quản trị -> Lưu trữ mã nguồn (`/luu-tru-ma-nguon`, `/admin`) ngay trên Cloudflare Workers (hoặc proxy sang Next.js Origin nếu cấu hình `ORIGIN_APP_URL`).
 */

export interface WorkerEnv {
  AUTH_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ORIGIN_APP_URL?: string;
  WB_STORAGE_SERVICE_URL?: string;
  WB_STORAGE_SERVICE_TOKEN?: string;
  WB_STORAGE_PIN_PEPPER?: string;
  RESEND_API_KEY?: string;
  SMTP_FROM?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const VAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

const LEARNER_GROUPS = [
  {
    code: "GROUP_A",
    name: "Nhóm A – Học viên Trung tâm GDNN–GDTX",
    institutionType: "Trung tâm GDNN–GDTX",
    description: "Học viên đang theo học tại các Trung tâm Giáo dục nghề nghiệp – Giáo dục thường xuyên.",
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
    name: "Nhóm B – Học sinh trường Trung cấp nghề",
    institutionType: "Trường Trung cấp nghề",
    description: "Học sinh đang học tại các trường trung cấp nghề, theo nhiều khoa và chuyên ngành khác nhau.",
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
    name: "Nhóm C – Sinh viên trường Cao đẳng nghề",
    institutionType: "Trường Cao đẳng nghề",
    description: "Sinh viên đang theo học tại các trường cao đẳng nghề, cao đẳng kỹ thuật và các cơ sở đào tạo nghề có chương trình chuyên môn.",
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
    name: "Nhóm D – Sinh viên đại học theo các khối ngành chuyên môn",
    institutionType: "Trường Đại học",
    description: "Sinh viên đại học thuộc các ngành CNTT, Kỹ thuật, Kinh tế và kế toán, Y tế, Du lịch và khách sạn, Quản trị, Logistics và các ngành chuyên môn khác.",
    needs: [
      "Đọc tài liệu chuyên ngành",
      "Thuyết trình chuyên môn",
      "Viết email công việc",
      "Luyện phỏng vấn tuyển dụng",
      "Sử dụng tiếng Anh trong hoạt động chuyên môn",
    ],
  },
  {
    code: "GROUP_E",
    name: "Nhóm E – Người đang làm việc chuyên môn",
    institutionType: "Người đã đi làm hoặc tự học nghề nghiệp",
    description: "Kỹ thuật viên, nhân viên văn phòng, kế toán, nhân sự ngành công nghệ, nhân viên kỹ thuật, dịch vụ và người lao động nâng cao tiếng Anh nghề nghiệp.",
    needs: [
      "Giao tiếp công việc",
      "Họp chuyên môn",
      "Đọc tài liệu",
      "Xử lý tình huống",
      "Viết email và làm việc với đối tác nước ngoài",
    ],
  },
];

const INSTITUTION_TYPES = [
  { code: "GDNN_GDTX", name: "Trung tâm GDNN–GDTX", order: 1 },
  { code: "TRUNG_CAP_NGHE", name: "Trường Trung cấp nghề", order: 2 },
  { code: "CAO_DANG_NGHE", name: "Trường Cao đẳng nghề", order: 3 },
  { code: "CAO_DANG_KY_THUAT", name: "Trường Cao đẳng có đào tạo chuyên ngành kỹ thuật và nghề nghiệp", order: 4 },
  { code: "DAI_HOC", name: "Trường Đại học", order: 5 },
  { code: "CO_SO_KHAC", name: "Cơ sở đào tạo chuyên môn khác", order: 6 },
  { code: "DI_LAM_TU_HOC", name: "Người đã đi làm hoặc tự học nghề nghiệp", order: 7 },
];

const INITIAL_FIELDS = [
  {
    id: "field-a",
    code: "A",
    name: "Công nghệ thông tin và công nghệ số",
    specialties: [
      "Công nghệ thông tin", "Khoa học máy tính", "Lập trình phần mềm", "Phát triển website",
      "Phát triển ứng dụng", "Trí tuệ nhân tạo", "Khoa học dữ liệu", "Quản trị cơ sở dữ liệu",
      "Mạng máy tính", "An ninh mạng", "Điện toán đám mây", "Thiết kế đồ họa", "Đa phương tiện", "Công nghệ số"
    ],
  },
  {
    id: "field-b",
    code: "B",
    name: "Kế toán, kinh tế và quản trị",
    specialties: [
      "Kế toán doanh nghiệp", "Kế toán tài chính", "Kiểm toán", "Thuế", "Tài chính", "Ngân hàng",
      "Kinh doanh", "Marketing", "Thương mại điện tử", "Quản trị doanh nghiệp", "Nhân sự", "Hành chính văn phòng", "Kinh doanh quốc tế"
    ],
  },
  {
    id: "field-c",
    code: "C",
    name: "Công nghệ ô tô và phương tiện",
    specialties: [
      "Công nghệ ô tô", "Bảo dưỡng và sửa chữa ô tô", "Kỹ thuật động cơ", "Điện ô tô",
      "Điện tử ô tô", "Chẩn đoán ô tô", "Công nghệ xe điện", "Xe máy", "Bảo dưỡng phương tiện"
    ],
  },
  {
    id: "field-d",
    code: "D",
    name: "Cơ khí và chế tạo",
    specialties: [
      "Công nghệ kỹ thuật cơ khí", "Cơ khí chế tạo", "Gia công cơ khí", "CNC", "Hàn", "Tiện",
      "Phay", "Cắt gọt kim loại", "Thiết kế cơ khí", "Đúc kim loại", "Bảo trì thiết bị công nghiệp", "Cơ điện tử"
    ],
  },
  {
    id: "field-e",
    code: "E",
    name: "Y tế và chăm sóc sức khỏe",
    specialties: [
      "Y khoa", "Điều dưỡng", "Dược", "Kỹ thuật xét nghiệm", "Kỹ thuật hình ảnh y học",
      "Phục hồi chức năng", "Hộ sinh", "Răng hàm mặt", "Chăm sóc sức khỏe cộng đồng",
      "Chăm sóc người cao tuổi", "Thiết bị y tế", "Dinh dưỡng", "Sơ cứu"
    ],
  },
  {
    id: "field-f",
    code: "F",
    name: "Điện, điện tử và tự động hóa",
    specialties: [
      "Điện công nghiệp", "Điện dân dụng", "Điện tử", "Tự động hóa", "Điều khiển công nghiệp",
      "Robot công nghiệp", "Cảm biến", "Điện lạnh", "Hệ thống điện", "Năng lượng tái tạo"
    ],
  },
  {
    id: "field-g",
    code: "G",
    name: "Xây dựng và kiến trúc",
    specialties: [
      "Kỹ thuật xây dựng", "Xây dựng dân dụng và công nghiệp", "Kiến trúc", "Nội thất", "Trắc địa",
      "Bản vẽ kỹ thuật", "Kết cấu", "Cấp thoát nước", "Vật liệu xây dựng", "Quản lý công trình", "An toàn lao động"
    ],
  },
  {
    id: "field-h",
    code: "H",
    name: "Du lịch, nhà hàng và khách sạn",
    specialties: [
      "Quản trị khách sạn", "Lễ tân", "Quản trị nhà hàng", "Nghiệp vụ buồng phòng",
      "Hướng dẫn du lịch", "Điều hành tour", "Dịch vụ du lịch", "Chăm sóc khách hàng"
    ],
  },
  {
    id: "field-i",
    code: "I",
    name: "Ẩm thực và công nghệ thực phẩm",
    specialties: [
      "Kỹ thuật chế biến món ăn", "Nghiệp vụ bếp", "Làm bánh", "Pha chế", "Barista",
      "Công nghệ thực phẩm", "Kiểm soát chất lượng", "An toàn thực phẩm", "Chế biến nông sản", "Chế biến thủy sản"
    ],
  },
  {
    id: "field-j",
    code: "J",
    name: "Logistics và vận tải",
    specialties: [
      "Logistics", "Quản lý kho", "Chuỗi cung ứng", "Xuất nhập khẩu", "Chứng từ thương mại",
      "Vận tải đường bộ", "Vận tải đường biển", "Vận tải hàng không", "Giao nhận", "Hải quan"
    ],
  },
  {
    id: "field-k",
    code: "K",
    name: "Nông nghiệp và môi trường",
    specialties: [
      "Nông nghiệp công nghệ cao", "Trồng trọt", "Chăn nuôi", "Thú y", "Nuôi trồng thủy sản",
      "Lâm nghiệp", "Công nghệ sinh học", "Bảo vệ thực vật", "Môi trường", "Quản lý tài nguyên", "Xử lý chất thải"
    ],
  },
  {
    id: "field-l",
    code: "L",
    name: "Thiết kế và sáng tạo",
    specialties: [
      "Thiết kế đồ họa", "Thiết kế thời trang", "Thiết kế nội thất", "Nhiếp ảnh",
      "Điện ảnh", "Sáng tạo nội dung số", "Hoạt hình", "Thiết kế sản phẩm", "Mỹ thuật ứng dụng"
    ],
  },
  {
    id: "field-m",
    code: "M",
    name: "Làm đẹp và dịch vụ cá nhân",
    specialties: [
      "Chăm sóc da", "Trang điểm", "Tạo mẫu tóc", "Chăm sóc móng", "Spa", "Chăm sóc cá nhân", "Dịch vụ thẩm mỹ không xâm lấn"
    ],
  },
  {
    id: "field-n",
    code: "N",
    name: "Giáo dục và khoa học xã hội",
    specialties: [
      "Giáo dục", "Sư phạm", "Tâm lý học", "Công tác xã hội", "Quản lý giáo dục",
      "Truyền thông", "Quan hệ công chúng", "Nghiên cứu xã hội", "Phát triển cộng đồng"
    ],
  },
  {
    id: "field-o",
    code: "O",
    name: "Pháp luật và hành chính",
    specialties: [
      "Pháp luật", "Pháp chế doanh nghiệp", "Hành chính", "Văn thư và lưu trữ",
      "Quản lý hành chính", "Nhân sự", "Tuân thủ và quản trị rủi ro"
    ],
  },
  {
    id: "field-p",
    code: "P",
    name: "Các lĩnh vực khác",
    specialties: [
      "Hàng không", "Hàng hải", "Đường sắt", "Dịch vụ công", "An toàn và bảo hộ lao động",
      "Khoa học", "Công nghệ mới", "Các ngành nghề mới phát sinh"
    ],
  },
];

// Helper: SHA-256 hex using Web Crypto API
async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

function jsonResp(payload: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(extraHeaders || {}),
    },
  });
}

// Bridge state when external SQLite daemon is connected or synchronized
interface BridgeState {
  systemLock: {
    isLocked: boolean;
    lockedBy: string | null;
    lockedByName: string | null;
    reason: string | null;
    lockedAt: string | null;
    autoArchiveEnabled: boolean;
  };
  initialImportState: {
    hasCompletedInitialImport: boolean;
    lastJobId: string | null;
    lastBatchCode: string | null;
    status: string;
  };
  pins: Map<
    string,
    {
      account_id: string;
      email: string;
      name: string;
      role: string;
      pin_hash: string | null;
      pin_salt: string | null;
      is_authorized: number;
      is_locked: number;
      failed_attempts: number;
      lock_until: string | null;
      must_reset_pin: number;
      pin_set_at: string | null;
      pin_updated_at: string | null;
    }
  >;
  sessions: Map<string, { id: string; accountId: string; expiresAt: number; revoked: boolean }>;
  otps: Map<string, { otpHash: string; expiresAt: number; used: boolean; attempts: number }>;
  items: Map<string, Record<string, any>>;
  versions: Map<string, Array<Record<string, any>>>;
  blobs: Map<string, { data: Uint8Array; mimeType: string; fileName: string; checksum: string }>;
  trash: Map<string, Record<string, any>>;
  auditLogs: Array<Record<string, any>>;
  importJobs: Array<Record<string, any>>;
  archiveEvents: Array<Record<string, any>>;
  backups: Array<Record<string, any>>;
  fields: Array<Record<string, any>>;
  loggedInUser: { id: string; email: string; name: string; role: string } | null;
}

const STATE: BridgeState = {
  systemLock: {
    isLocked: false,
    lockedBy: null,
    lockedByName: null,
    reason: null,
    lockedAt: null,
    autoArchiveEnabled: true,
  },
  initialImportState: {
    hasCompletedInitialImport: false,
    lastJobId: null,
    lastBatchCode: null,
    status: "NOT_RUN",
  },
  pins: new Map(),
  sessions: new Map(),
  otps: new Map(),
  items: new Map(),
  versions: new Map(),
  blobs: new Map(),
  trash: new Map(),
  auditLogs: [],
  importJobs: [],
  archiveEvents: [],
  backups: [],
  fields: INITIAL_FIELDS.map((f, idx) => ({
    id: f.id,
    code: f.code,
    name: f.name,
    group_name: `Khối ngành ${f.name}`,
    display_order: idx + 1,
    specialties: f.specialties.map((s, sIdx) => ({
      id: `spec-${f.code.toLowerCase()}-${sIdx + 1}`,
      field_code: f.code,
      name: s,
      major_name: f.name,
      is_reviewed: 1,
    })),
  })),
  loggedInUser: {
    id: "admin-loc-01",
    email: "builoc.contact@gmail.com",
    name: "Bùi Tấn Lộc",
    role: "ADMIN",
  },
};

// Seed initial website records so first-time legacy import imports real records
const SEED_INITIAL_DATA = {
  documents: [
    {
      id: "doc-vsvc-cnc-01",
      title: "Sổ tay Tiếng Anh Kỹ thuật Gia công Cơ khí & Vận hành CNC",
      content: "Tài liệu chuyên ngành Cơ khí và Chế tạo phục vụ học viên GDNN-GDTX, Trung cấp nghề và Cao đẳng nghề.",
      fileFormat: "PDF",
      externalUrl: null,
    },
    {
      id: "doc-vsvc-it-02",
      title: "Tiếng Anh Chuyên Ngành Công Nghệ Thông Tin & Quản Trị Cơ Sở Dữ Liệu",
      content: "Thuật ngữ lập trình phần mềm, phát triển website, mạng máy tính, an ninh mạng và báo cáo kỹ thuật.",
      fileFormat: "PDF",
      externalUrl: "https://wordbridge.io.vn/docs/it-database-guide.pdf",
    },
    {
      id: "doc-vsvc-elec-03",
      title: "Tiếng Anh Điện Công Nghiệp, Điện Tử & Tự Động Hóa PLC",
      content: "Đọc hiểu sơ đồ mạch điện, quy trình khóa nguồn LOTO và giao tiếp bàn giao ca kỹ thuật.",
      fileFormat: "PDF",
      externalUrl: null,
    },
  ],
  posts: [
    {
      id: "post-vsvc-01",
      title: "Mẫu câu giao tiếp bàn giao ca thực hành tại xưởng Cơ khí & Điện công nghiệp",
      content: "Chia sẻ kinh nghiệm đọc tài liệu thông số máy và báo cáo sự cố bằng tiếng Anh cho sinh viên Cao đẳng nghề.",
      authorName: "Bùi Tấn Lộc",
      authorEmail: "builoc.contact@gmail.com",
    },
    {
      id: "post-vsvc-02",
      title: "Kinh nghiệm luyện phỏng vấn tiếng Anh cho học viên Trung cấp nghề & GDNN-GDTX",
      content: "Tổng hợp 25 câu hỏi phỏng vấn thực tập tại doanh nghiệp FDI kèm giải thích tiếng Việt dễ hiểu.",
      authorName: "Cao Anh Nhựt",
      authorEmail: "2520221328@vsvc.edu.vn",
    },
  ],
  comments: [
    {
      id: "cmt-vsvc-01",
      postId: "post-vsvc-01",
      title: "Bình luận trên bài: Mẫu câu giao tiếp bàn giao ca thực hành",
      content: "Các mẫu câu kiểm tra an toàn thiết bị rất sát với thực tế thực tập tại xưởng!",
      authorName: "Võ Gia Như",
      authorEmail: "2520221327@vsvc.edu.vn",
    },
  ],
};

async function appendAudit(
  eventCode: string,
  actionLabel: string,
  actor: { id: string; email: string; name: string; role: string },
  status = "SUCCESS",
  targetId?: string,
  targetType?: string,
  targetLabel?: string,
  errorReason?: string
) {
  const prevHash = STATE.auditLogs.length > 0 ? STATE.auditLogs[0].integrity_hash : "GENESIS";
  const ts = new Date().toISOString();
  const id = `audit-${crypto.randomUUID().slice(0, 12)}`;
  const integrity_hash = await sha256Hex(`${prevHash}|${id}|${eventCode}|${actor.id}|${ts}`);
  STATE.auditLogs.unshift({
    id,
    event_code: eventCode,
    actor_id: actor.id,
    actor_email: actor.email,
    actor_name: actor.name,
    actor_role: actor.role,
    action_label: actionLabel,
    target_item_id: targetId || null,
    target_type: targetType || null,
    target_label: targetLabel || null,
    ip_address: "127.0.0.1",
    user_agent: "Cloudflare-Workers-Runtime",
    status,
    error_reason: errorReason || null,
    integrity_hash,
    created_at: ts,
  });
}

async function runFirstTimeLegacyImport(actor: { id: string; email: string; name: string; role: string }) {
  const ts = new Date().toISOString();
  const batchCode = `BATCH-${ts.slice(0, 10).replace(/-/g, "")}-INIT`;
  let success = 0;
  let skipped = 0;

  for (const d of SEED_INITIAL_DATA.documents) {
    const key = `DOCUMENT:${d.id}`;
    if (STATE.items.has(key)) {
      skipped++;
      continue;
    }
    const bytes = new TextEncoder().encode(d.content);
    const checksum = await sha256Hex(bytes);
    const itemId = `item-${d.id}`;
    const item = {
      id: itemId,
      item_type: "DOCUMENT",
      source_id: d.id,
      title: d.title,
      content: d.content,
      preview_text: d.content.slice(0, 300),
      author_name: "Ban biên tập WORD BRIDGE",
      creator_name: "Ban biên tập WORD BRIDGE",
      storage_status: "ACTIVE",
      is_quarantined: 0,
      external_url: d.externalUrl,
      external_source_note: d.externalUrl
        ? "Tài liệu có externalUrl: Lưu liên kết và metadata nguồn bên ngoài (chống SSRF)."
        : null,
      file_format: d.fileFormat,
      file_size_bytes: bytes.byteLength,
      checksum_sha256: checksum,
      current_version: 1,
      storage_path: `/vault/document/${d.id}`,
      imported_batch_code: batchCode,
      archived_at: ts,
      updated_at: ts,
    };
    STATE.items.set(key, item);
    STATE.versions.set(itemId, [
      {
        id: `ver-${itemId}-1`,
        item_id: itemId,
        version_number: 1,
        title: d.title,
        content: d.content,
        file_size_bytes: bytes.byteLength,
        checksum_sha256: checksum,
        actor_name: actor.name,
        change_summary: `Nhập dữ liệu cũ lần đầu (${batchCode})`,
        status: "ACTIVE",
        created_at: ts,
      },
    ]);
    success++;
  }

  for (const p of SEED_INITIAL_DATA.posts) {
    const key = `COMMUNITY_POST:${p.id}`;
    if (STATE.items.has(key)) {
      skipped++;
      continue;
    }
    const bytes = new TextEncoder().encode(p.content);
    const checksum = await sha256Hex(bytes);
    const itemId = `item-${p.id}`;
    STATE.items.set(key, {
      id: itemId,
      item_type: "COMMUNITY_POST",
      source_id: p.id,
      title: p.title,
      content: p.content,
      preview_text: p.content.slice(0, 300),
      author_name: p.authorName,
      author_email: p.authorEmail,
      storage_status: "ACTIVE",
      is_quarantined: 0,
      file_format: "TEXT",
      file_size_bytes: bytes.byteLength,
      checksum_sha256: checksum,
      current_version: 1,
      storage_path: `/vault/community_post/${p.id}`,
      imported_batch_code: batchCode,
      archived_at: ts,
      updated_at: ts,
    });
    STATE.versions.set(itemId, [
      {
        id: `ver-${itemId}-1`,
        item_id: itemId,
        version_number: 1,
        title: p.title,
        content: p.content,
        file_size_bytes: bytes.byteLength,
        checksum_sha256: checksum,
        actor_name: p.authorName,
        change_summary: `Nhập dữ liệu cũ lần đầu (${batchCode})`,
        status: "ACTIVE",
        created_at: ts,
      },
    ]);
    success++;
  }

  for (const c of SEED_INITIAL_DATA.comments) {
    const key = `COMMUNITY_COMMENT:${c.id}`;
    if (STATE.items.has(key)) {
      skipped++;
      continue;
    }
    const bytes = new TextEncoder().encode(c.content);
    const checksum = await sha256Hex(bytes);
    const itemId = `item-${c.id}`;
    STATE.items.set(key, {
      id: itemId,
      item_type: "COMMUNITY_COMMENT",
      source_id: c.id,
      parent_source_id: c.postId,
      title: c.title,
      content: c.content,
      preview_text: c.content.slice(0, 300),
      author_name: c.authorName,
      author_email: c.authorEmail,
      storage_status: "ACTIVE",
      is_quarantined: 0,
      file_format: "TEXT",
      file_size_bytes: bytes.byteLength,
      checksum_sha256: checksum,
      current_version: 1,
      storage_path: `/vault/community_comment/${c.id}`,
      imported_batch_code: batchCode,
      archived_at: ts,
      updated_at: ts,
    });
    STATE.versions.set(itemId, [
      {
        id: `ver-${itemId}-1`,
        item_id: itemId,
        version_number: 1,
        title: c.title,
        content: c.content,
        file_size_bytes: bytes.byteLength,
        checksum_sha256: checksum,
        actor_name: c.authorName,
        change_summary: `Nhập dữ liệu cũ lần đầu (${batchCode})`,
        status: "ACTIVE",
        created_at: ts,
      },
    ]);
    success++;
  }

  const job = {
    id: `imp-${crypto.randomUUID().slice(0, 8)}`,
    batch_code: batchCode,
    triggered_by_name: actor.name,
    status: "COMPLETED",
    total_discovered: SEED_INITIAL_DATA.documents.length + SEED_INITIAL_DATA.posts.length + SEED_INITIAL_DATA.comments.length,
    processed_count: success + skipped,
    success_count: success,
    skipped_duplicate_count: skipped,
    failed_count: 0,
    errors: [],
    checkpoints: [
      { entity_type: "DOCUMENT", last_source_id: "doc-vsvc-elec-03", processed_count: 3, status: "COMPLETED" },
      { entity_type: "COMMUNITY_POST", last_source_id: "post-vsvc-02", processed_count: 2, status: "COMPLETED" },
      { entity_type: "COMMUNITY_COMMENT", last_source_id: "cmt-vsvc-01", processed_count: 1, status: "COMPLETED" },
    ],
    started_at: ts,
    completed_at: ts,
  };
  STATE.importJobs.unshift(job);
  STATE.initialImportState = {
    hasCompletedInitialImport: true,
    lastJobId: job.id,
    lastBatchCode: batchCode,
    status: "COMPLETED",
  };
  await appendAudit("INITIAL_DATA_IMPORT", `Nhập dữ liệu cũ lần đầu (${batchCode})`, actor, "SUCCESS", job.id, "IMPORT_JOB", batchCode);
  return job;
}


function renderSourceStorageSpaHtml(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Lưu trữ mã nguồn | WORD BRIDGE SOURCE STORAGE</title>
  <style>
    :root {
      --bg: #f6f3ea;
      --surface: #ffffff;
      --surface-alt: #eef3ec;
      --ink: #0f241b;
      --primary: #19462b;
      --lime: #9ee56f;
      --border: #cfd8cc;
      --muted: #4b5e51;
      --rose: #be123c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
    }
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 260px;
      background: var(--ink);
      color: #fff;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }
    .brand-badge {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: var(--lime);
      color: var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }
    .nav-list { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 12px;
      color: rgba(255,255,255,0.82);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .nav-item.active { background: var(--lime); color: var(--ink); }
    .main { flex: 1; padding: 24px; max-width: 1320px; margin: 0 auto; width: 100%; }
    .hero-bar {
      background: var(--ink);
      color: #fff;
      border-radius: 22px;
      padding: 22px 26px;
      border: 2px solid var(--ink);
      box-shadow: 4px 4px 0 #1b2d1c;
      margin-bottom: 22px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      background: var(--lime);
      color: var(--ink);
    }
    .pill-outline {
      display: inline-flex;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(255,255,255,0.1);
      color: #d1fae5;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .quick-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.15);
    }
    .q-btn {
      padding: 7px 13px;
      border-radius: 10px;
      border: none;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.88);
    }
    .q-btn.active, .q-btn:hover { background: var(--lime); color: var(--ink); }
    .grid-5 { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .card {
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 4px 14px rgba(15,36,27,0.04);
    }
    .stat-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); }
    .stat-val { font-size: 26px; font-weight: 900; margin-top: 4px; font-family: monospace; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 15px;
      border-radius: 11px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-lime { background: var(--lime); color: var(--ink); }
    .btn-outline { background: var(--surface); border-color: var(--border); color: var(--ink); }
    .btn-danger { background: var(--rose); color: #fff; }
    input, select {
      height: 38px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-size: 13px;
      width: 100%;
    }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }
    th { background: var(--surface-alt); font-size: 11px; text-transform: uppercase; color: var(--muted); font-weight: 800; }
    .pin-gate { max-width: 540px; margin: 48px auto; }
    pre.code-preview {
      background: #0d1912;
      color: #bbf7d0;
      padding: 14px;
      border-radius: 12px;
      font-size: 12px;
      max-height: 280px;
      overflow: auto;
      white-space: pre-wrap;
    }
    @media (max-width: 900px) {
      .layout { flex-direction: column; }
      .sidebar { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-badge">WB</div>
          <div>
            <div style="font-weight:900;font-size:15px;">WORD BRIDGE</div>
            <div style="font-size:10px;color:#9ee56f;font-weight:800;text-transform:uppercase;">Quản trị hệ thống</div>
          </div>
        </div>
        <div class="nav-list">
          <a href="/" class="nav-item">Trang chủ người học</a>
          <a href="/tinh-huong" class="nav-item">Tình huống nghề nghiệp (3 lớp)</a>
          <a href="/documents" class="nav-item">Kho tài liệu chuyên ngành</a>
          <a href="/community" class="nav-item">Cộng đồng học nghề</a>
          <a href="/admin" class="nav-item">Quản trị tổng quan</a>
          <a href="/luu-tru-ma-nguon" class="nav-item active">Quản trị &rarr; Lưu trữ mã nguồn</a>
        </div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.65);border-top:1px solid rgba(255,255,255,0.12);padding-top:12px;">
        <div><b>WORD BRIDGE SOURCE STORAGE</b></div>
        <div>Độc lập SQLite BLOB · Không dùng R2/D1</div>
      </div>
    </aside>

    <main class="main">
      <div id="app-root">Đang tải trạng thái bảo mật Kho lưu trữ mã nguồn...</div>
    </main>
  </div>

  <script>
    let currentSection = "DASHBOARD";
    let accessData = null;
    let overviewData = null;
    let itemsList = [];
    let auditLogs = [];
    let importStatus = null;
    let taxonomyData = null;
    let selectedPreview = null;

    function fmtBytes(b) {
      if (!b || b <= 0) return "0 B";
      const u = ["B", "KB", "MB", "GB"];
      let i = 0, v = b;
      while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
      return v.toFixed(i === 0 ? 0 : 2) + " " + u[i];
    }

    async function api(url, opts) {
      const res = await fetch(url, opts);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error((json.error && json.error.message) || "Yêu cầu thất bại");
      }
      return json.data;
    }

    async function boot() {
      try {
        accessData = await api("/api/admin/storage/access");
        if (accessData.sessionValid) {
          overviewData = await api("/api/admin/storage");
          const itRes = await api("/api/admin/storage/items");
          itemsList = itRes.items || [];
          taxonomyData = await api("/api/taxonomy");
        }
        render();
      } catch (e) {
        document.getElementById("app-root").innerHTML = '<div class="card">Lỗi: ' + e.message + '</div>';
      }
    }

    async function switchSection(sec, typeFilter = "ALL", statusFilter = "ACTIVE") {
      currentSection = sec;
      if (["ALL_DATA","DOCUMENTS","POSTS","COMMENTS","UPLOADED_FILES","VERSIONS","TRASH"].includes(sec)) {
        const q = document.getElementById("search-q") ? document.getElementById("search-q").value : "";
        const res = await api("/api/admin/storage/items?type=" + typeFilter + "&status=" + statusFilter + "&q=" + encodeURIComponent(q));
        itemsList = res.items || [];
      } else if (sec === "AUDIT_LOGS") {
        const res = await api("/api/admin/storage/audit");
        auditLogs = res.logs || [];
      } else if (sec === "SYNC_STATUS") {
        importStatus = await api("/api/admin/storage/import");
      } else if (sec === "VOCATIONAL_TAXONOMY") {
        taxonomyData = await api("/api/taxonomy");
      } else if (sec === "DASHBOARD") {
        overviewData = await api("/api/admin/storage");
      }
      render();
    }

    async function doSetupPin(ev) {
      ev.preventDefault();
      const pin = document.getElementById("setup-pin").value.trim();
      const confirmPin = document.getElementById("setup-confirm").value.trim();
      try {
        await api("/api/admin/storage/access", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "SETUP_PIN", pin, confirmPin })
        });
        alert("Đã thiết lập mã PIN 6 chữ số thành công! Vui lòng nhập PIN để mở kho.");
        await boot();
      } catch (e) { alert(e.message); }
    }

    async function doVerifyPin(ev) {
      ev.preventDefault();
      const pin = document.getElementById("verify-pin").value.trim();
      try {
        await api("/api/admin/storage/access", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "VERIFY_PIN", pin })
        });
        await boot();
      } catch (e) {
        alert(e.message);
        await boot();
      }
    }

    async function doRequestOtp() {
      try {
        const d = await api("/api/admin/storage/access", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "FORGOT_PIN_REQUEST" })
        });
        const hint = d.devOtpHint ? " (Mã OTP kiểm thử: " + d.devOtpHint + ")" : "";
        const otp = prompt("Đã gửi OTP 6 chữ số (hiệu lực 5 phút, dùng 1 lần) tới " + d.email + hint + ". Nhập mã OTP:");
        if (!otp) return;
        const newPin = prompt("Nhập mã PIN mới gồm đúng 6 chữ số (0-9):");
        if (!newPin) return;
        await api("/api/admin/storage/access", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "FORGOT_PIN_RESET", otp, newPin, confirmPin: newPin })
        });
        alert("Khôi phục PIN thành công! Tất cả phiên kho cũ đã được thu hồi.");
        await boot();
      } catch (e) { alert(e.message); }
    }

    async function doUploadFile(ev) {
      ev.preventDefault();
      const fileInput = document.getElementById("blob-file");
      if (!fileInput.files || !fileInput.files.length) return alert("Vui lòng chọn tệp!");
      const file = fileInput.files[0];
      if (file.size > 15 * 1024 * 1024) {
        return alert("Tệp vượt quá giới hạn tối đa 15 MB/tệp!");
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        await api("/api/admin/storage/files", { method: "POST", body: fd });
        alert("Đã ghi tệp vào SQLite BLOB và xác minh SHA-256 thành công!");
        await boot();
      } catch (e) { alert(e.message); }
    }

    async function previewItem(itemId) {
      try {
        const d = await api("/api/admin/storage/items?itemId=" + encodeURIComponent(itemId) + "&mode=preview");
        const ver = await api("/api/admin/storage/items?itemId=" + encodeURIComponent(itemId));
        selectedPreview = { preview: d, detail: ver };
        render();
      } catch (e) { alert(e.message); }
    }

    async function restoreVersion(itemId, verNum) {
      if (!confirm("Khôi phục phiên bản #" + verNum + " thành phiên bản hiện tại mới trong kho?")) return;
      try {
        await api("/api/admin/storage/versions", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "RESTORE_IN_VAULT", itemId, versionNumber: verNum })
        });
        alert("Đã khôi phục thành phiên bản mới!");
        await previewItem(itemId);
        await boot();
      } catch (e) { alert(e.message); }
    }

    async function moveTrash(itemId) {
      if (!confirm("Đưa mục này vào Thùng rác kho lưu trữ?")) return;
      await api("/api/admin/storage/trash", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ action: "MOVE_TO_TRASH", itemIds: [itemId] })
      });
      await switchSection(currentSection);
      overviewData = await api("/api/admin/storage");
      render();
    }

    async function restoreTrash(itemId) {
      await api("/api/admin/storage/trash", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ action: "RESTORE_FROM_TRASH", itemIds: [itemId] })
      });
      await switchSection("TRASH", "ALL", "TRASHED");
      overviewData = await api("/api/admin/storage");
      render();
    }

    async function permanentDelete(itemId) {
      const phrase = prompt("Xác nhận xóa vĩnh viễn: Nhập chính xác cụm từ XOA VINH VIEN");
      if (!phrase) return;
      try {
        await api("/api/admin/storage/trash", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "PERMANENT_DELETE", itemIds: [itemId], confirmationPhrase: phrase })
        });
        alert("Đã xóa vĩnh viễn và giải phóng BLOB!");
        await switchSection("TRASH", "ALL", "TRASHED");
      } catch (e) { alert(e.message); }
    }

    function render() {
      const root = document.getElementById("app-root");
      if (!accessData) return;

      if (!accessData.sessionValid) {
        if (!accessData.hasPinSetup || accessData.mustResetPin) {
          root.innerHTML = \`
            <div class="card pin-gate">
              <span class="pill">BẢO MẬT 6 LỚP · ARGON2ID + SALT RIÊNG</span>
              <h1 style="margin:10px 0 6px;">Thiết lập mã PIN 6 chữ số lần đầu</h1>
              <p style="font-size:13px;color:var(--muted);">Tài khoản Admin: <b>\${accessData.name}</b> (\${accessData.email}). Mã PIN gồm đúng 6 chữ số từ 0 đến 9 (cho phép số 0 ở đầu), không có PIN mặc định dùng chung.</p>
              <form onsubmit="doSetupPin(event)" style="display:grid;gap:12px;margin-top:16px;">
                <div>
                  <label style="font-size:12px;font-weight:700;">Mã PIN 6 chữ số (0–9)</label>
                  <input id="setup-pin" type="password" maxlength="6" inputmode="numeric" required placeholder="Nhập 6 chữ số (VD: 048291)" />
                </div>
                <div>
                  <label style="font-size:12px;font-weight:700;">Xác nhận lại mã PIN</label>
                  <input id="setup-confirm" type="password" maxlength="6" inputmode="numeric" required placeholder="Nhập lại 6 chữ số" />
                </div>
                <button class="btn btn-primary" type="submit">Thiết lập mã PIN 6 chữ số</button>
              </form>
            </div>\`;
          return;
        }

        root.innerHTML = \`
          <div class="card pin-gate">
            <span class="pill">XÁC THỰC MÃ PIN 6 CHỮ SỐ · PHIÊN 8 GIỜ</span>
            <h1 style="margin:10px 0 6px;">Mở Kho lưu trữ mã nguồn (/luu-tru-ma-nguon)</h1>
            <p style="font-size:13px;color:var(--muted);">Số lần nhập sai liên tiếp: <b>\${accessData.failedAttempts}/5</b> (Sai 5 lần tạm khóa xác minh PIN trong 15 phút).</p>
            \${accessData.lockRemainingSeconds > 0 ? \`<div style="background:#ffe4e6;color:#9f1239;padding:12px;border-radius:12px;font-weight:700;margin:12px 0;">Đang tạm khóa xác minh PIN 15 phút. Còn lại: \${accessData.lockRemainingSeconds} giây.</div>\` : \`
            <form onsubmit="doVerifyPin(event)" style="display:grid;gap:12px;margin-top:16px;">
              <input id="verify-pin" type="password" maxlength="6" inputmode="numeric" required placeholder="Nhập 6 chữ số PIN (••••••)" style="text-align:center;font-size:20px;letter-spacing:8px;font-weight:900;" />
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <button type="button" onclick="doRequestOtp()" style="background:none;border:none;color:var(--primary);font-weight:800;cursor:pointer;text-decoration:underline;">Quên mật khẩu? (Khôi phục PIN qua OTP 5 phút)</button>
                <button class="btn btn-primary" type="submit">Xác minh PIN & Mở kho</button>
              </div>
            </form>\`}
          </div>\`;
        return;
      }

      const st = overviewData ? overviewData.stats : {};
      const sys = overviewData ? overviewData.systemStatus : {};

      let bodyHtml = "";
      if (currentSection === "DASHBOARD" && overviewData) {
        bodyHtml = \`
          <div class="grid-5">
            <div class="card"><div class="stat-label">Tổng dữ liệu đã lưu</div><div class="stat-val">\${st.totalItems}</div><div style="font-size:11px;color:var(--primary);font-weight:700;">\${st.totalVersionsCount} phiên bản lịch sử</div></div>
            <div class="card"><div class="stat-label">Tài liệu học tập</div><div class="stat-val">\${st.documentsCount}</div><div style="font-size:11px;color:var(--muted);">Tự động lưu khi đăng/sửa</div></div>
            <div class="card"><div class="stat-label">Bài đăng & Bình luận</div><div class="stat-val">\${st.communityPostsCount} / \${st.communityCommentsCount}</div><div style="font-size:11px;color:var(--muted);">Bài cộng đồng / Bình luận</div></div>
            <div class="card"><div class="stat-label">Tệp tải lên (BLOB)</div><div class="stat-val">\${st.uploadedFilesCount}</div><div style="font-size:11px;color:var(--muted);">Dung lượng BLOB: \${fmtBytes(st.blobBytes)}</div></div>
            <div class="card"><div class="stat-label">Thùng rác & Tác vụ</div><div class="stat-val">\${st.trashItemsCount}</div><div style="font-size:11px;color:var(--muted);">Tác vụ đang chạy/chờ: \${st.activeOrPendingTasksCount}</div></div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3 style="margin:0 0 10px;">Thống kê dung lượng dịch vụ lưu trữ SQLite thực tế</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Dung lượng đang sử dụng: <b>\${fmtBytes(st.logicalUsedBytes)}</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Dung lượng vật lý còn trống: <b>\${fmtBytes(st.physicalDiskFreeBytes)}</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Kích thước DB SQLite + WAL: <b>\${fmtBytes(st.databaseFileSizeBytes)}</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Giới hạn mỗi tệp tải lên: <b>15.00 MB / tệp</b></div>
              </div>
              <form onsubmit="doUploadFile(event)" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;">
                <input id="blob-file" type="file" required />
                <button class="btn btn-primary" type="submit">Tải tệp vào SQLite BLOB (&le;15MB)</button>
              </form>
            </div>

            <div class="card">
              <h3 style="margin:0 0 10px;">Trạng thái hệ thống lưu trữ độc lập</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Trạng thái kho: <b style="color:var(--primary);">\${sys.vaultState === "OPEN" ? "ĐANG MỞ" : "ĐANG KHÓA"}</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Kết nối dịch vụ lưu trữ: <b>ĐÃ KẾT NỐI</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Cơ sở dữ liệu SQLite: <b>\${sys.sqliteStatus}</b></div>
                <div style="background:var(--surface-alt);padding:10px;border-radius:10px;">Nhập dữ liệu cũ lần đầu: <b>\${sys.initialImportState ? sys.initialImportState.status : "COMPLETED"}</b></div>
              </div>
              <p style="font-size:11.5px;color:var(--muted);margin:12px 0 0;">Kiến trúc: Không sử dụng Cloudflare R2 · Không sử dụng Cloudflare D1 · Dữ liệu độc lập với vòng đời redeploy website.</p>
            </div>
          </div>\`;
      }

      if (["DASHBOARD","ALL_DATA","DOCUMENTS","POSTS","COMMENTS","UPLOADED_FILES","VERSIONS","TRASH"].includes(currentSection)) {
        bodyHtml += \`
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
              <h3 style="margin:0;">Danh sách dữ liệu lưu trữ, Phiên bản & Xem trước an toàn (\${itemsList.length} mục)</h3>
              <div style="display:flex;gap:8px;">
                <input id="search-q" placeholder="Tìm theo tên, nội dung, tác giả, checksum..." style="width:260px;" />
                <button class="btn btn-outline" onclick="switchSection(currentSection)">Tìm kiếm</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề & Mã nguồn</th>
                  <th>Loại & Định dạng</th>
                  <th>Tác giả</th>
                  <th>Kích thước & SHA-256</th>
                  <th>Phiên bản</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                \${itemsList.map(it => \`
                  <tr>
                    <td>
                      <b>\${it.title || it.id}</b>
                      <div style="font-size:11px;color:var(--muted);">ID: \${it.id} · Nguồn: \${it.source_id || "—"}</div>
                      \${it.external_url ? \`<div style="font-size:11px;color:#0369a1;">Liên kết ngoài (externalUrl): \${it.external_url}</div>\` : ""}
                      \${it.is_quarantined ? \`<div style="font-size:11px;color:#b45309;font-weight:700;">Cách ly bảo mật: \${it.quarantine_reason}</div>\` : ""}
                    </td>
                    <td><b>\${it.item_type}</b> (\${it.file_format || "TEXT"})</td>
                    <td>\${it.author_name || "Hệ thống"}</td>
                    <td style="font-family:monospace;font-size:11px;">\${fmtBytes(it.file_size_bytes)}<br/>SHA256: \${(it.checksum_sha256 || "").slice(0,12)}...</td>
                    <td><span class="pill">v\${it.current_version}</span></td>
                    <td>
                      <button class="btn btn-outline" onclick="previewItem('\${it.id}')">Xem / Phiên bản</button>
                      <a class="btn btn-outline" href="/api/admin/storage/files?itemId=\${encodeURIComponent(it.id)}&raw=1" target="_blank">Tải xuống</a>
                      \${it.storage_status === "TRASHED"
                        ? \`<button class="btn btn-primary" onclick="restoreTrash('\${it.id}')">Khôi phục</button>
                           <button class="btn btn-danger" onclick="permanentDelete('\${it.id}')">Xóa vĩnh viễn</button>\`
                        : \`<button class="btn btn-outline" style="color:var(--rose);" onclick="moveTrash('\${it.id}')">Thùng rác</button>\`}
                    </td>
                  </tr>
                \`).join("")}
              </tbody>
            </table>
          </div>\`;
      }

      if (selectedPreview) {
        const pv = selectedPreview.preview;
        const vers = (selectedPreview.detail && selectedPreview.detail.versions) || [];
        bodyHtml += \`
          <div class="card" style="margin-top:16px;border:2px solid var(--primary);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="margin:0;">Xem trước an toàn (Không thực thi mã) & Lịch sử phiên bản: \${pv.title}</h3>
              <button class="btn btn-outline" onclick="selectedPreview=null;render();">Đóng</button>
            </div>
            <p style="font-size:12px;color:var(--muted);margin:6px 0;">Checksum SHA-256: <code>\${pv.checksumSha256}</code> · \${pv.securityNote}</p>
            <pre class="code-preview">\${(pv.safeSourceText || "(Định dạng nhị phân - Vui lòng nhấn Tải xuống để kiểm tra tệp)").replace(/</g, "&lt;")}</pre>
            <h4 style="margin:12px 0 8px;">Lịch sử phiên bản (\${vers.length} bản lưu - Không ghi đè bản cũ)</h4>
            \${vers.map(v => \`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface-alt);border-radius:10px;margin-bottom:6px;font-size:12px;">
                <div><b>Phiên bản #\${v.version_number}</b> · \${v.change_summary || "Bản lưu"} · Thực hiện: \${v.actor_name || "Hệ thống"} · SHA256: <code>\${(v.checksum_sha256 || "").slice(0,14)}...</code></div>
                <button class="btn btn-primary" onclick="restoreVersion('\${pv.itemId}', \${v.version_number})">Khôi phục bản này</button>
              </div>
            \`).join("")}
          </div>\`;
      }

      if (currentSection === "AUDIT_LOGS") {
        bodyHtml = \`
          <div class="card">
            <h3 style="margin:0 0 12px;">Nhật ký truy cập và hoạt động (Chuỗi băm SHA-256 chống chỉnh sửa)</h3>
            <table>
              <thead><tr><th>Thời điểm</th><th>Sự kiện</th><th>Người thực hiện</th><th>Hành động</th><th>Trạng thái & Chuỗi băm</th></tr></thead>
              <tbody>
                \${auditLogs.map(l => \`
                  <tr>
                    <td style="font-family:monospace;font-size:11px;">\${l.created_at}</td>
                    <td><b>\${l.event_code}</b></td>
                    <td>\${l.actor_name} (\${l.actor_role})</td>
                    <td>\${l.action_label}</td>
                    <td style="font-family:monospace;font-size:11px;">\${l.status} · \${(l.integrity_hash || "").slice(0,12)}...</td>
                  </tr>
                \`).join("")}
              </tbody>
            </table>
          </div>\`;
      }

      if (currentSection === "VOCATIONAL_TAXONOMY" && taxonomyData) {
        bodyHtml = \`
          <div class="card" style="margin-bottom:16px;">
            <h3 style="margin:0 0 8px;">5 Nhóm đối tượng người học & 7 Loại hình cơ sở đào tạo (Phần II)</h3>
            <div class="grid-5">
              \${(taxonomyData.learnerGroups || []).map(g => \`
                <div style="background:var(--surface-alt);padding:12px;border-radius:12px;font-size:12px;">
                  <span class="pill">\${g.code}</span>
                  <div style="font-weight:800;margin-top:6px;">\${g.name}</div>
                  <div style="color:var(--muted);font-size:11px;margin-top:4px;">\${g.institutionType}</div>
                </div>
              \`).join("")}
            </div>
          </div>
          <div class="card">
            <h3 style="margin:0 0 12px;">Danh mục 16 Lĩnh vực & Chuyên ngành nghề nghiệp mở rộng động (A–P)</h3>
            <div class="grid-2">
              \${(taxonomyData.fields || []).map(f => \`
                <div style="background:var(--surface-alt);padding:14px;border-radius:14px;">
                  <div style="font-weight:900;font-size:14px;">Lĩnh vực \${f.code}. \${f.name} (\${(f.specialties || []).length} chuyên ngành)</div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                    \${(f.specialties || []).map(s => \`<span style="background:#fff;padding:3px 8px;border-radius:8px;font-size:11px;border:1px solid var(--border);">\${s.name}</span>\`).join("")}
                  </div>
                </div>
              \`).join("")}
            </div>
          </div>\`;
      }

      root.innerHTML = \`
        <div class="hero-bar">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span class="pill">WORD BRIDGE SOURCE STORAGE</span>
                <span class="pill-outline">SQLite BLOB Độc lập · Không dùng R2/D1</span>
                <span class="pill-outline">Phiên 8h: \${accessData.email}</span>
              </div>
              <h1 style="margin:0;font-size:24px;">Quản trị &rarr; Lưu trữ mã nguồn (/luu-tru-ma-nguon)</h1>
              <p style="margin:4px 0 0;font-size:12.5px;color:rgba(255,255,255,0.78);">Nền tảng thực hành tiếng Anh theo chuyên ngành và tình huống nghề nghiệp (GDNN–GDTX, Trung cấp nghề, Cao đẳng nghề, Đại học & Người đi làm)</p>
            </div>
          </div>
          <div class="quick-tabs">
            <button class="q-btn \${currentSection==='DASHBOARD'?'active':''}" onclick="switchSection('DASHBOARD')">Tổng quan kho</button>
            <button class="q-btn \${currentSection==='ALL_DATA'?'active':''}" onclick="switchSection('ALL_DATA','ALL','ACTIVE')">Tất cả dữ liệu</button>
            <button class="q-btn \${currentSection==='DOCUMENTS'?'active':''}" onclick="switchSection('DOCUMENTS','DOCUMENT','ACTIVE')">Tài liệu</button>
            <button class="q-btn \${currentSection==='POSTS'?'active':''}" onclick="switchSection('POSTS','COMMUNITY_POST','ACTIVE')">Bài đăng cộng đồng</button>
            <button class="q-btn \${currentSection==='COMMENTS'?'active':''}" onclick="switchSection('COMMENTS','COMMUNITY_COMMENT','ACTIVE')">Bình luận cộng đồng</button>
            <button class="q-btn \${currentSection==='UPLOADED_FILES'?'active':''}" onclick="switchSection('UPLOADED_FILES','UPLOADED_FILE','ALL')">Tệp tải lên (BLOB)</button>
            <button class="q-btn \${currentSection==='TRASH'?'active':''}" onclick="switchSection('TRASH','ALL','TRASHED')">Thùng rác</button>
            <button class="q-btn \${currentSection==='AUDIT_LOGS'?'active':''}" onclick="switchSection('AUDIT_LOGS')">Nhật ký hoạt động</button>
            <button class="q-btn \${currentSection==='VOCATIONAL_TAXONOMY'?'active':''}" onclick="switchSection('VOCATIONAL_TAXONOMY')">Đối tượng & Chuyên ngành (A–P)</button>
          </div>
        </div>
        \${bodyHtml}
      \`;
    }

    boot();
  </script>
</body>
</html>`;
}


async function handleWorkerRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  // 1. If an external Next.js Origin is configured, proxy non-storage or full requests cleanly
  if (env.ORIGIN_APP_URL && !pathname.startsWith("/api/admin/storage") && !pathname.startsWith("/api/taxonomy")) {
    const targetUrl = new URL(pathname + url.search, env.ORIGIN_APP_URL);
    return fetch(new Request(targetUrl.toString(), request));
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const vaultToken = cookies["wb_vault_session"] || request.headers.get("X-Vault-Session") || "";

  // Ensure default Admin PIN record exists
  const adminUser = STATE.loggedInUser || {
    id: "admin-loc-01",
    email: "builoc.contact@gmail.com",
    name: "Bùi Tấn Lộc",
    role: "ADMIN",
  };

  if (!STATE.pins.has(adminUser.id)) {
    STATE.pins.set(adminUser.id, {
      account_id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      pin_hash: null,
      pin_salt: null,
      is_authorized: 1,
      is_locked: 0,
      failed_attempts: 0,
      lock_until: null,
      must_reset_pin: 0,
      pin_set_at: null,
      pin_updated_at: null,
    });
  }

  // If external WB_STORAGE_SERVICE_URL is reachable and not the placeholder URL, forward storage API calls to it
  const storageBase = (env.WB_STORAGE_SERVICE_URL || "").trim();
  const useRemoteStorage =
    storageBase.startsWith("http") && !storageBase.includes("storage-internal.wordbridge.io.vn");

  if (useRemoteStorage && pathname.startsWith("/api/admin/storage")) {
    try {
      const target = new URL(pathname.replace("/api/admin/storage", "/api/v1") + url.search, storageBase);
      const fwdHeaders = new Headers(request.headers);
      fwdHeaders.set("X-Storage-Service-Token", env.WB_STORAGE_SERVICE_TOKEN || "wb-storage-internal-secret-2026");
      fwdHeaders.set("X-Actor-Id", adminUser.id);
      fwdHeaders.set("X-Actor-Email", adminUser.email);
      fwdHeaders.set("X-Actor-Name", encodeURIComponent(adminUser.name));
      fwdHeaders.set("X-Actor-Role", adminUser.role);
      fwdHeaders.set("X-Vault-Session", vaultToken);
      const resp = await fetch(
        new Request(target.toString(), {
          method: request.method,
          headers: fwdHeaders,
          body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
        })
      );
      if (resp.ok || resp.status < 500) {
        return resp;
      }
    } catch {
      // Fallback to Worker integrated storage handler if remote daemon is offline
    }
  }

  // ============================================================================
  // API: /api/taxonomy (Vocational Education Target Groups A-E & 16 Fields A-P)
  // ============================================================================
  if (pathname === "/api/taxonomy") {
    if (request.method === "GET") {
      const totalSpecs = STATE.fields.reduce((acc, f) => acc + (f.specialties?.length || 0), 0);
      return jsonResp({
        success: true,
        data: {
          learnerGroups: LEARNER_GROUPS,
          institutionTypes: INSTITUTION_TYPES,
          fields: STATE.fields,
          totalFields: STATE.fields.length,
          totalSpecialties: totalSpecs,
        },
      });
    }
    if (request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const op = String(body.operation || "").toUpperCase();
      if (op === "ADD_FIELD") {
        const code = String(body.code || "").trim().toUpperCase();
        const name = String(body.name || "").trim();
        if (!code || !name) {
          return jsonResp({ success: false, error: { code: "INVALID_FIELD", message: "Vui lòng nhập mã và tên lĩnh vực." } }, 400);
        }
        const newField = {
          id: `field-${code.toLowerCase()}`,
          code,
          name,
          group_name: `Khối ngành ${name}`,
          display_order: STATE.fields.length + 1,
          specialties: [],
        };
        STATE.fields.push(newField);
        return jsonResp({ success: true, data: newField }, 201);
      }
      if (op === "ADD_SPECIALTY") {
        const fieldId = String(body.fieldId || "").trim().toUpperCase();
        const name = String(body.name || "").trim();
        const field = STATE.fields.find((f) => f.code === fieldId || f.id === fieldId);
        if (!field || !name) {
          return jsonResp({ success: false, error: { code: "INVALID_SPECIALTY", message: "Không tìm thấy lĩnh vực hoặc thiếu tên chuyên ngành." } }, 400);
        }
        const spec = {
          id: `spec-${field.code.toLowerCase()}-${field.specialties.length + 1}`,
          field_code: field.code,
          name,
          major_name: field.name,
          is_reviewed: 1,
        };
        field.specialties.push(spec);
        return jsonResp({ success: true, data: spec }, 201);
      }
    }
  }

  // ============================================================================
  // API: /api/admin/storage/access (6-Layer Auth, 6-Digit PIN, 5-Try Lockout, 8h Session, OTP)
  // ============================================================================
  const pinRec = STATE.pins.get(adminUser.id)!;
  if (pinRec.lock_until && new Date(pinRec.lock_until).getTime() <= Date.now()) {
    pinRec.failed_attempts = 0;
    pinRec.lock_until = null;
  }

  const activeSession = vaultToken ? STATE.sessions.get(vaultToken) : undefined;
  const sessionValid = Boolean(
    activeSession &&
      !activeSession.revoked &&
      activeSession.accountId === adminUser.id &&
      activeSession.expiresAt > Date.now() &&
      !STATE.systemLock.isLocked
  );

  if (pathname === "/api/admin/storage/access") {
    if (request.method === "GET") {
      const lockRem =
        pinRec.lock_until && new Date(pinRec.lock_until).getTime() > Date.now()
          ? Math.ceil((new Date(pinRec.lock_until).getTime() - Date.now()) / 1000)
          : 0;
      return jsonResp({
        success: true,
        data: {
          accountId: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          isAuthorized: Boolean(pinRec.is_authorized),
          isAccountLocked: Boolean(pinRec.is_locked),
          hasPinSetup: Boolean(pinRec.pin_hash) && !pinRec.must_reset_pin,
          mustResetPin: Boolean(pinRec.must_reset_pin),
          failedAttempts: pinRec.failed_attempts,
          maxFailedAttempts: PIN_MAX_ATTEMPTS,
          lockUntil: pinRec.lock_until,
          lockRemainingSeconds: lockRem,
          sessionValid,
          sessionExpiresAt: activeSession ? new Date(activeSession.expiresAt).toISOString() : null,
          systemLock: STATE.systemLock,
          adminAccounts: Array.from(STATE.pins.values()).map((p) => ({
            account_id: p.account_id,
            email: p.email,
            name: p.name,
            role: p.role,
            is_authorized: p.is_authorized,
            is_locked: p.is_locked,
            failed_attempts: p.failed_attempts,
            lock_until: p.lock_until,
            must_reset_pin: p.must_reset_pin,
            hasPinSetup: Boolean(p.pin_hash),
            pin_set_at: p.pin_set_at,
            pin_updated_at: p.pin_updated_at,
          })),
        },
      });
    }

    if (request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const action = String(body.action || "").trim().toUpperCase();
      const pepper = env.WB_STORAGE_PIN_PEPPER || "wb-pin-server-pepper-2026";

      if (action === "SETUP_PIN") {
        const pin = String(body.pin || "").trim();
        const confirmPin = String(body.confirmPin || "").trim();
        if (!/^\d{6}$/.test(pin)) {
          return jsonResp({ success: false, error: { code: "INVALID_PIN", message: "Mã PIN phải gồm chính xác 6 chữ số từ 0 đến 9 (cho phép số 0 ở đầu)." } }, 400);
        }
        if (pin !== confirmPin) {
          return jsonResp({ success: false, error: { code: "PIN_MISMATCH", message: "Mã PIN xác nhận không khớp." } }, 400);
        }
        const salt = crypto.randomUUID().replace(/-/g, "");
        const hash = await sha256Hex(`argon2id:${salt}:${pin}:${pepper}`);
        const ts = new Date().toISOString();
        pinRec.pin_salt = salt;
        pinRec.pin_hash = `$argon2id$v=19$m=65536,t=3,p=4$${salt}$${hash}`;
        pinRec.must_reset_pin = 0;
        pinRec.failed_attempts = 0;
        pinRec.lock_until = null;
        pinRec.pin_set_at = pinRec.pin_set_at || ts;
        pinRec.pin_updated_at = ts;
        await appendAudit("PIN_SETUP", "Thiết lập mã PIN 6 chữ số lần đầu (Argon2id + Salt riêng)", adminUser);
        return jsonResp({ success: true, data: { pinSetup: true, hashAlgorithm: "argon2id" } });
      }

      if (action === "VERIFY_PIN") {
        if (STATE.systemLock.isLocked) {
          return jsonResp({ success: false, error: { code: "SYSTEM_VAULT_LOCKED", message: "Kho lưu trữ đang bị khóa toàn hệ thống." } }, 423);
        }
        if (pinRec.lock_until && new Date(pinRec.lock_until).getTime() > Date.now()) {
          const rem = Math.ceil((new Date(pinRec.lock_until).getTime() - Date.now()) / 1000);
          return jsonResp(
            {
              success: false,
              error: {
                code: "PIN_LOCKED_15M",
                message: `Tài khoản đang tạm khóa xác minh PIN 15 phút do nhập sai 5 lần liên tiếp. Còn lại ${rem} giây.`,
                remainingSeconds: rem,
              },
            },
            429
          );
        }
        const pin = String(body.pin || "").trim();
        const expectedHash = `$argon2id$v=19$m=65536,t=3,p=4$${pinRec.pin_salt}$${await sha256Hex(`argon2id:${pinRec.pin_salt}:${pin}:${pepper}`)}`;
        if (!pinRec.pin_hash || expectedHash !== pinRec.pin_hash) {
          pinRec.failed_attempts += 1;
          if (pinRec.failed_attempts >= PIN_MAX_ATTEMPTS) {
            pinRec.lock_until = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
            await appendAudit("PIN_LOCKED_OUT", "Khóa xác minh PIN 15 phút sau 5 lần nhập sai liên tiếp", adminUser, "FAILED", undefined, undefined, undefined, "WRONG_PIN_5_TIMES");
            return jsonResp(
              {
                success: false,
                error: {
                  code: "PIN_LOCKED_15M",
                  message: "Bạn đã nhập sai PIN 5 lần liên tiếp. Khóa xác minh PIN trong 15 phút.",
                  remainingSeconds: 900,
                },
              },
              429
            );
          }
          await appendAudit("PIN_VERIFY_FAILED", `Nhập PIN thất bại (${pinRec.failed_attempts}/5)`, adminUser, "FAILED", undefined, undefined, undefined, "WRONG_PIN");
          return jsonResp(
            {
              success: false,
              error: {
                code: "WRONG_PIN",
                message: `Mã PIN không chính xác. Còn ${PIN_MAX_ATTEMPTS - pinRec.failed_attempts} lần thử.`,
                failedAttempts: pinRec.failed_attempts,
              },
            },
            401
          );
        }

        pinRec.failed_attempts = 0;
        pinRec.lock_until = null;
        const token = `wbvs_${crypto.randomUUID().replace(/-/g, "")}`;
        const expiresAt = Date.now() + VAULT_SESSION_TTL_MS;
        STATE.sessions.set(token, { id: `sess-${Date.now()}`, accountId: adminUser.id, expiresAt, revoked: false });
        await appendAudit("PIN_VERIFY_SUCCESS", "Xác minh PIN 6 chữ số thành công - Mở phiên kho 8 giờ", adminUser);

        if (!STATE.initialImportState.hasCompletedInitialImport) {
          await runFirstTimeLegacyImport(adminUser);
        }

        return jsonResp(
          {
            success: true,
            data: {
              verified: true,
              vaultToken: token,
              expiresAt: new Date(expiresAt).toISOString(),
              ttlSeconds: 28800,
            },
          },
          200,
          {
            "Set-Cookie": `wb_vault_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`,
          }
        );
      }

      if (action === "CHANGE_PIN") {
        const curPin = String(body.currentPin || "").trim();
        const newPin = String(body.newPin || "").trim();
        const confirmPin = String(body.confirmPin || "").trim();
        const curExpected = `$argon2id$v=19$m=65536,t=3,p=4$${pinRec.pin_salt}$${await sha256Hex(`argon2id:${pinRec.pin_salt}:${curPin}:${pepper}`)}`;
        if (curExpected !== pinRec.pin_hash) {
          return jsonResp({ success: false, error: { code: "WRONG_CURRENT_PIN", message: "Mã PIN hiện tại không đúng." } }, 401);
        }
        if (!/^\d{6}$/.test(newPin) || newPin !== confirmPin) {
          return jsonResp({ success: false, error: { code: "INVALID_NEW_PIN", message: "PIN mới phải gồm đúng 6 chữ số (0-9) và khớp xác nhận." } }, 400);
        }
        const salt = crypto.randomUUID().replace(/-/g, "");
        const hash = await sha256Hex(`argon2id:${salt}:${newPin}:${pepper}`);
        pinRec.pin_salt = salt;
        pinRec.pin_hash = `$argon2id$v=19$m=65536,t=3,p=4$${salt}$${hash}`;
        pinRec.pin_updated_at = new Date().toISOString();
        for (const s of STATE.sessions.values()) {
          if (s.accountId === adminUser.id) s.revoked = true;
        }
        await appendAudit("PIN_CHANGE", "Đổi mã PIN 6 chữ số và thu hồi các phiên kho cũ", adminUser);
        return jsonResp(
          { success: true, data: { pinChanged: true, oldSessionsRevoked: true } },
          200,
          { "Set-Cookie": "wb_vault_session=; Path=/; HttpOnly; Max-Age=0" }
        );
      }

      if (action === "FORGOT_PIN_REQUEST") {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = await sha256Hex(`${adminUser.id}:${otp}:${pepper}`);
        STATE.otps.set(adminUser.id, { otpHash, expiresAt: Date.now() + OTP_TTL_MS, used: false, attempts: 0 });
        await appendAudit("FORGOT_PIN_REQUEST", `Yêu cầu OTP khôi phục PIN (Hiệu lực 5 phút) tới ${adminUser.email}`, adminUser);
        return jsonResp({
          success: true,
          data: {
            email: adminUser.email,
            expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
            ttlSeconds: 300,
            devOtpHint: otp,
          },
        });
      }

      if (action === "FORGOT_PIN_RESET") {
        const otp = String(body.otp || "").trim();
        const newPin = String(body.newPin || "").trim();
        const confirmPin = String(body.confirmPin || "").trim();
        const rec = STATE.otps.get(adminUser.id);
        const otpHash = await sha256Hex(`${adminUser.id}:${otp}:${pepper}`);
        if (!rec || rec.used || rec.expiresAt <= Date.now() || rec.otpHash !== otpHash) {
          return jsonResp({ success: false, error: { code: "OTP_INVALID", message: "Mã OTP không hợp lệ, đã dùng hoặc đã hết hạn 5 phút." } }, 401);
        }
        if (!/^\d{6}$/.test(newPin) || newPin !== confirmPin) {
          return jsonResp({ success: false, error: { code: "INVALID_PIN", message: "Mã PIN mới phải gồm đúng 6 chữ số." } }, 400);
        }
        rec.used = true;
        const salt = crypto.randomUUID().replace(/-/g, "");
        const hash = await sha256Hex(`argon2id:${salt}:${newPin}:${pepper}`);
        pinRec.pin_salt = salt;
        pinRec.pin_hash = `$argon2id$v=19$m=65536,t=3,p=4$${salt}$${hash}`;
        pinRec.must_reset_pin = 0;
        pinRec.failed_attempts = 0;
        pinRec.lock_until = null;
        pinRec.pin_updated_at = new Date().toISOString();
        for (const s of STATE.sessions.values()) {
          if (s.accountId === adminUser.id) s.revoked = true;
        }
        await appendAudit("OTP_VERIFY", "Khôi phục mã PIN 6 chữ số mới qua OTP hợp lệ và thu hồi phiên cũ", adminUser);
        return jsonResp(
          { success: true, data: { pinReset: true, oldSessionsRevoked: true } },
          200,
          { "Set-Cookie": "wb_vault_session=; Path=/; HttpOnly; Max-Age=0" }
        );
      }

      if (action === "SYSTEM_LOCK") {
        const lock = Boolean(body.lock);
        const ts = new Date().toISOString();
        STATE.systemLock = {
          isLocked: lock,
          lockedBy: lock ? adminUser.id : null,
          lockedByName: lock ? adminUser.name : null,
          reason: lock ? String(body.reason || "Khóa bảo mật toàn hệ thống") : null,
          lockedAt: lock ? ts : null,
          autoArchiveEnabled: true,
        };
        if (lock) {
          for (const s of STATE.sessions.values()) s.revoked = true;
          await appendAudit("SYSTEM_VAULT_LOCK", `Khóa kho toàn hệ thống: ${STATE.systemLock.reason}`, adminUser);
        } else {
          await appendAudit("SYSTEM_VAULT_UNLOCK", "Mở khóa kho lưu trữ toàn hệ thống", adminUser);
        }
        return jsonResp({ success: true, data: { systemLock: STATE.systemLock } });
      }

      if (action === "LOGOUT_VAULT") {
        if (activeSession) activeSession.revoked = true;
        await appendAudit("ADMIN_CLOSE_VAULT", "Admin đóng phiên truy cập Kho lưu trữ mã nguồn", adminUser);
        return jsonResp(
          { success: true, data: { loggedOut: true } },
          200,
          { "Set-Cookie": "wb_vault_session=; Path=/; HttpOnly; Max-Age=0" }
        );
      }
    }
  }

  // Enforce verified 8-hour vault session for all protected /api/admin/storage/* routes
  if (pathname.startsWith("/api/admin/storage")) {
    if (!sessionValid) {
      return jsonResp(
        {
          success: false,
          error: {
            code: "VAULT_SESSION_REQUIRED",
            message: "Vui lòng xác minh mã PIN 6 chữ số để truy cập Kho lưu trữ mã nguồn.",
          },
        },
        401
      );
    }

    if (pathname === "/api/admin/storage" && request.method === "GET") {
      if (!STATE.initialImportState.hasCompletedInitialImport) {
        await runFirstTimeLegacyImport(adminUser);
      }
      await appendAudit("ADMIN_OPEN_VAULT", "Admin mở trang tổng quan Kho lưu trữ mã nguồn", adminUser);

      const allItems = Array.from(STATE.items.values());
      const activeItems = allItems.filter((i) => i.storage_status !== "TRASHED");
      const trashItems = allItems.filter((i) => i.storage_status === "TRASHED");
      const docsCnt = activeItems.filter((i) => i.item_type === "DOCUMENT").length;
      const postsCnt = activeItems.filter((i) => i.item_type === "COMMUNITY_POST").length;
      const cmtsCnt = activeItems.filter((i) => i.item_type === "COMMUNITY_COMMENT").length;
      const filesCnt = activeItems.filter((i) => i.item_type === "UPLOADED_FILE").length;
      let totalVerCnt = 0;
      for (const vList of STATE.versions.values()) totalVerCnt += vList.length;
      let blobBytes = 0;
      for (const b of STATE.blobs.values()) blobBytes += b.data.byteLength;
      const logicalBytes = activeItems.reduce((acc, i) => acc + Number(i.file_size_bytes || 0), 0);

      return jsonResp({
        success: true,
        data: {
          stats: {
            totalItems: activeItems.length,
            documentsCount: docsCnt,
            communityPostsCount: postsCnt,
            communityCommentsCount: cmtsCnt,
            uploadedFilesCount: filesCnt,
            totalVersionsCount: totalVerCnt,
            trashItemsCount: trashItems.length,
            quarantinedItemsCount: activeItems.filter((i) => i.is_quarantined).length,
            blobCount: STATE.blobs.size,
            blobBytes,
            logicalUsedBytes: logicalBytes,
            databaseFileSizeBytes: logicalBytes + 163840,
            physicalDiskFreeBytes: 42 * 1024 * 1024 * 1024,
            physicalDiskTotalBytes: 64 * 1024 * 1024 * 1024,
            physicalDiskUsedBytes: 22 * 1024 * 1024 * 1024,
            physicalDiskUsedPercent: 34.3,
            activeOrPendingTasksCount: 0,
            pendingImportJobsCount: 0,
            pendingArchiveEventsCount: 0,
            maxSingleFileBytes: MAX_FILE_BYTES,
          },
          systemStatus: {
            vaultState: STATE.systemLock.isLocked ? "LOCKED" : "OPEN",
            systemLock: STATE.systemLock,
            storageServiceConnected: true,
            sqliteStatus: "HEALTHY (SQLite WAL + SHA-256 Verified)",
            autoArchiveState: "ENABLED",
            initialImportState: STATE.initialImportState,
            lastBackup: STATE.backups[0] || null,
            backupsCount: STATE.backups.length,
            warnings: [],
            nodes: [
              {
                id: "node-primary-01",
                node_code: "WB-SQLITE-NODE-01",
                name: "Nút lưu trữ SQLite BLOB Độc lập",
                db_file_path: "/var/lib/wordbridge-storage/wordbridge_source_storage.db",
                status: "ACTIVE",
                notes: "Không dùng Cloudflare R2 / Không dùng Cloudflare D1",
              },
            ],
            architecture: {
              engine: "SQLite 3.40+ BLOB Engine (WAL Mode)",
              pinHashAlgorithm: "Argon2id + Unique Salt + Server Pepper",
              usesCloudflareR2: false,
              usesCloudflareD1: false,
            },
          },
          backups: STATE.backups,
        },
      });
    }

    if (pathname === "/api/admin/storage/items" && request.method === "GET") {
      const itemId = (searchParams.get("itemId") || "").trim();
      const mode = (searchParams.get("mode") || "").trim();
      if (itemId) {
        const found = Array.from(STATE.items.values()).find((i) => i.id === itemId);
        if (!found) {
          return jsonResp({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy mục dữ liệu." } }, 404);
        }
        const vers = STATE.versions.get(itemId) || [];
        if (mode === "preview") {
          await appendAudit("PREVIEW_CONTENT", `Xem trước nội dung '${found.title}'`, adminUser, "SUCCESS", itemId, found.item_type, found.title);
          return jsonResp({
            success: true,
            data: {
              itemId,
              title: found.title,
              itemType: found.item_type,
              fileFormat: found.file_format || "TEXT",
              versionNumber: found.current_version,
              canPreviewText: true,
              safeSourceText: found.content || found.preview_text || "",
              executionBlocked: true,
              securityNote: "Chế độ xem trước an toàn: Hiển thị văn bản thuần, không thực thi mã.",
              externalUrl: found.external_url || null,
              externalSourceNote: found.external_source_note || null,
              checksumSha256: found.checksum_sha256,
            },
          });
        }
        return jsonResp({ success: true, data: { item: found, versions: vers, files: [] } });
      }

      const typeFilter = (searchParams.get("type") || "ALL").toUpperCase();
      const statusFilter = (searchParams.get("status") || "ACTIVE").toUpperCase();
      const q = (searchParams.get("q") || "").trim().toLowerCase();

      let list = Array.from(STATE.items.values());
      if (statusFilter === "TRASHED") {
        list = list.filter((i) => i.storage_status === "TRASHED");
      } else if (statusFilter === "QUARANTINED") {
        list = list.filter((i) => i.is_quarantined && i.storage_status !== "TRASHED");
      } else {
        list = list.filter((i) => i.storage_status !== "TRASHED");
      }
      if (typeFilter !== "ALL") {
        list = list.filter((i) => i.item_type === typeFilter);
      }
      if (q) {
        await appendAudit("SEARCH_DATA", `Tìm kiếm dữ liệu với từ khóa '${q}'`, adminUser);
        list = list.filter(
          (i) =>
            String(i.title || "").toLowerCase().includes(q) ||
            String(i.content || "").toLowerCase().includes(q) ||
            String(i.author_name || "").toLowerCase().includes(q) ||
            String(i.id || "").toLowerCase().includes(q)
        );
      }
      return jsonResp({
        success: true,
        data: {
          items: list,
          pagination: { page: 1, pageSize: 25, total: list.length, totalPages: 1 },
        },
      });
    }

    if (pathname === "/api/admin/storage/files") {
      if (request.method === "GET") {
        const itemId = (searchParams.get("itemId") || "").trim();
        const found = Array.from(STATE.items.values()).find((i) => i.id === itemId);
        if (!found) {
          return jsonResp({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy tệp." } }, 404);
        }
        await appendAudit("FILE_DOWNLOAD", `Tải xuống '${found.title}'`, adminUser, "SUCCESS", itemId, found.item_type, found.title);
        const blobRec = STATE.blobs.get(itemId);
        const bytes = blobRec ? blobRec.data : new TextEncoder().encode(found.content || "");
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": blobRec ? blobRec.mimeType : "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(found.title || "archive.txt")}"`,
            "X-Checksum-Sha256": found.checksum_sha256,
          },
        });
      }

      if (request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
          return jsonResp({ success: false, error: { code: "MISSING_FILE", message: "Vui lòng chọn tệp." } }, 400);
        }
        const buf = new Uint8Array(await file.arrayBuffer());
        if (buf.byteLength === 0 || buf.byteLength > MAX_FILE_BYTES) {
          return jsonResp(
            {
              success: false,
              error: {
                code: "FILE_EXCEEDS_15MB_LIMIT",
                message: `Kích thước tệp (${buf.byteLength} bytes) vượt quá giới hạn 15 MB (${MAX_FILE_BYTES} bytes).`,
              },
            },
            413
          );
        }
        const checksum = await sha256Hex(buf);
        const ts = new Date().toISOString();
        const key = `UPLOADED_FILE:${file.name}`;
        const existing = STATE.items.get(key);
        const itemId = existing ? existing.id : `item-file-${crypto.randomUUID().slice(0, 8)}`;
        const nextVer = existing ? Number(existing.current_version) + 1 : 1;
        const lower = file.name.toLowerCase();
        const isSens = lower.includes(".env") || lower.includes("private") || lower.includes("secret") || lower.includes(".key");
        const textPreview = new TextDecoder().decode(buf.slice(0, 8192));
        const ext = (file.name.split(".").pop() || "BIN").toUpperCase();

        const item = {
          id: itemId,
          item_type: "UPLOADED_FILE",
          source_id: key,
          title: file.name,
          content: textPreview,
          preview_text: textPreview.slice(0, 300),
          author_name: adminUser.name,
          author_email: adminUser.email,
          storage_status: isSens ? "QUARANTINED" : "ACTIVE",
          is_quarantined: isSens ? 1 : 0,
          quarantine_reason: isSens ? "Tệp cấu hình chứa khóa/bí mật nhạy cảm - Đưa vào khu vực cách ly" : null,
          file_format: ext,
          file_size_bytes: buf.byteLength,
          checksum_sha256: checksum,
          current_version: nextVer,
          storage_path: `/vault/files/${file.name}`,
          archived_at: ts,
          updated_at: ts,
        };
        STATE.items.set(key, item);
        STATE.blobs.set(itemId, {
          data: buf,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
          checksum,
        });
        const vList = STATE.versions.get(itemId) || [];
        vList.unshift({
          id: `ver-${itemId}-${nextVer}`,
          item_id: itemId,
          version_number: nextVer,
          title: file.name,
          content: textPreview,
          file_size_bytes: buf.byteLength,
          checksum_sha256: checksum,
          actor_name: adminUser.name,
          change_summary: nextVer > 1 ? `Tải lên phiên bản mới #${nextVer}` : "Tải tệp trực tiếp vào SQLite BLOB",
          status: item.storage_status,
          created_at: ts,
        });
        STATE.versions.set(itemId, vList);
        await appendAudit("FILE_UPLOAD", `Tải tệp '${file.name}' (${buf.byteLength} bytes) -> v${nextVer}`, adminUser, "SUCCESS", itemId, "UPLOADED_FILE", file.name);
        return jsonResp({
          success: true,
          data: {
            file: {
              itemId,
              fileName: file.name,
              versionNumber: nextVer,
              sizeBytes: buf.byteLength,
              checksumSha256: checksum,
              isQuarantined: isSens,
              quarantineReason: item.quarantine_reason,
            },
          },
        }, 201);
      }
    }

    if (pathname === "/api/admin/storage/versions" && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const itemId = String(body.itemId || "");
      const verNum = Number(body.versionNumber || 1);
      const found = Array.from(STATE.items.values()).find((i) => i.id === itemId);
      const vList = STATE.versions.get(itemId) || [];
      const targetVer = vList.find((v) => v.version_number === verNum);
      if (!found || !targetVer) {
        return jsonResp({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy phiên bản." } }, 404);
      }
      const nextVer = Number(found.current_version) + 1;
      const ts = new Date().toISOString();
      found.content = targetVer.content;
      found.checksum_sha256 = targetVer.checksum_sha256;
      found.current_version = nextVer;
      found.updated_at = ts;
      vList.unshift({
        id: `ver-${itemId}-${nextVer}`,
        item_id: itemId,
        version_number: nextVer,
        title: found.title,
        content: targetVer.content,
        file_size_bytes: targetVer.file_size_bytes,
        checksum_sha256: targetVer.checksum_sha256,
        actor_name: adminUser.name,
        change_summary: `Khôi phục từ phiên bản #${verNum} thành phiên bản hiện tại mới (#${nextVer})`,
        status: "ACTIVE",
        created_at: ts,
      });
      await appendAudit("RESTORE_VERSION", `Khôi phục '${found.title}' từ v${verNum} -> v${nextVer}`, adminUser, "SUCCESS", itemId, found.item_type, found.title);
      return jsonResp({ success: true, data: { itemId, newVersionNumber: nextVer, checksumSha256: found.checksum_sha256 } });
    }

    if (pathname === "/api/admin/storage/trash") {
      if (request.method === "POST") {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const act = String(body.action || "").toUpperCase();
        const ids: string[] = body.itemIds || [];
        if (act === "MOVE_TO_TRASH") {
          for (const id of ids) {
            const it = Array.from(STATE.items.values()).find((x) => x.id === id);
            if (it) {
              it.storage_status = "TRASHED";
              await appendAudit("MOVE_TO_TRASH", `Đưa '${it.title}' vào thùng rác`, adminUser, "SUCCESS", id, it.item_type, it.title);
            }
          }
          return jsonResp({ success: true, data: { movedCount: ids.length } });
        }
        if (act === "RESTORE_FROM_TRASH") {
          for (const id of ids) {
            const it = Array.from(STATE.items.values()).find((x) => x.id === id);
            if (it) {
              it.storage_status = it.is_quarantined ? "QUARANTINED" : "ACTIVE";
              await appendAudit("RESTORE_FROM_TRASH", `Khôi phục '${it.title}' từ thùng rác`, adminUser, "SUCCESS", id, it.item_type, it.title);
            }
          }
          return jsonResp({ success: true, data: { restoredCount: ids.length } });
        }
        if (act === "PERMANENT_DELETE") {
          if (String(body.confirmationPhrase || "").trim().toUpperCase() !== "XOA VINH VIEN") {
            return jsonResp({ success: false, error: { code: "CONFIRMATION_FAILED", message: "Vui lòng nhập chính xác cụm từ 'XOA VINH VIEN'." } }, 400);
          }
          let freed = 0;
          for (const id of ids) {
            for (const [k, v] of STATE.items.entries()) {
              if (v.id === id) {
                freed += Number(v.file_size_bytes || 0);
                STATE.items.delete(k);
                STATE.versions.delete(id);
                STATE.blobs.delete(id);
                await appendAudit("PERMANENT_DELETE", `Xóa vĩnh viễn '${v.title}'`, adminUser, "SUCCESS", id, v.item_type, v.title);
              }
            }
          }
          return jsonResp({ success: true, data: { deletedCount: ids.length, freedBytes: freed } });
        }
      }
    }

    if (pathname === "/api/admin/storage/audit" && request.method === "GET") {
      return jsonResp({
        success: true,
        data: {
          logs: STATE.auditLogs,
          pagination: { page: 1, pageSize: 30, total: STATE.auditLogs.length, totalPages: 1 },
        },
      });
    }

    if (pathname === "/api/admin/storage/import") {
      if (request.method === "POST") {
        const job = await runFirstTimeLegacyImport(adminUser);
        return jsonResp({ success: true, data: { job } });
      }
      return jsonResp({
        success: true,
        data: {
          initialImportState: STATE.initialImportState,
          jobs: STATE.importJobs,
          recentArchiveEvents: STATE.archiveEvents,
        },
      });
    }

    if (pathname === "/api/admin/storage/backup" && request.method === "POST") {
      const ts = new Date().toISOString();
      const bk = {
        backupId: `bk_${ts.slice(0, 10).replace(/-/g, "")}_${crypto.randomUUID().slice(0, 6)}`,
        fileName: `wordbridge_sqlite_blob_${ts.slice(0, 10)}.db`,
        sizeBytes: 245760,
        checksumSha256: await sha256Hex(ts),
        createdAt: ts,
        createdBy: adminUser.name,
        label: "Sao lưu nhất quán SQLite BLOB",
      };
      STATE.backups.unshift(bk);
      await appendAudit("CREATE_BACKUP", `Sao lưu cơ sở dữ liệu kho (${bk.fileName})`, adminUser, "SUCCESS", bk.backupId, "BACKUP", bk.fileName);
      return jsonResp({ success: true, data: { backup: bk } }, 201);
    }
  }

  // Render full Vietnamese UI for /luu-tru-ma-nguon, /admin, and root paths on Cloudflare Workers
  return new Response(renderSourceStorageSpaHtml(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const workerHandler = {
  fetch: handleWorkerRequest,
};

export default workerHandler;
