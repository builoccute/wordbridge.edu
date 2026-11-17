import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

const prisma = new PrismaClient();

// === documents.ts ===
export const SEED_DOC_CATEGORIES = [
  {
    slug: "tu-vung-ngu-phap",
    name: "Từ vựng & Ngữ pháp",
    description: "Tổng hợp 600+ từ vựng TOEIC cốt lõi, bảng động từ bất quy tắc và công thức ngữ pháp trọng tâm.",
    icon: "BookOpen",
    order: 1,
  },
  {
    slug: "luyen-thi-toeic",
    name: "Luyện thi TOEIC",
    description: "Lộ trình ôn tập từ mất gốc 0 lên 850+, chiến thuật làm bài từng Part mới nhất.",
    icon: "Target",
    order: 2,
  },
  {
    slug: "de-thi-loi-giai",
    name: "Đề thi & Lời giải",
    description: "Tuyển tập đề thi thử ETS, Economy, Hacker kèm transcript Listening và giải thích chi tiết.",
    icon: "FileCheck2",
    order: 3,
  },
  {
    slug: "listening-phat-am",
    name: "Listening & Phát âm",
    description: "Tài liệu luyện nghe phản xạ Anh–Mỹ, nối âm, giảm âm và bẫy phát âm trong Part 1–4.",
    icon: "Headphones",
    order: 4,
  },
  {
    slug: "reading-ky-nang-doc",
    name: "Reading & Kỹ năng đọc",
    description: "Phương pháp Skimming & Scanning cho Part 7 đọc đơn, đọc kép và đọc ba đoạn văn.",
    icon: "Newspaper",
    order: 5,
  },
  {
    slug: "tai-lieu-khac",
    name: "Tài liệu khác",
    description: "Sổ tay kế hoạch tự học, template theo dõi điểm số và bộ từ tiếng Anh giao tiếp công sở.",
    icon: "Sparkles",
    order: 6,
  },
];

export const SEED_DOCUMENTS = [
  {
    slug: "600-tu-vung-toeic-kinh-doanh-co-ban",
    title: "600 Từ Vựng TOEIC Cốt Lõi Theo 12 Chủ Đề Văn Phòng",
    description: "Tổng hợp từ vựng tần suất xuất hiện cao nhất trong đề TOEIC kèm phiên âm IPA, họ từ (Word Family) và câu ví dụ công sở.",
    categorySlug: "tu-vung-ngu-phap",
    level: "450+",
    fileType: "PDF",
    pageCount: 48,
    fileSizeLabel: "3.2 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: true,
    viewCount: 1420,
    downloadCount: 890,
    tags: ["Từ vựng", "600 từ", "Word Family", "Part 5"],
    previewContent: `# 600 Từ Vựng TOEIC Cốt Lõi Theo Chủ Đề Văn Phòng

## Chủ đề 1: Hợp đồng & Đàm phán (Contracts)
1. **abide by** (/əˈbaɪd baɪ/) — v. tuân thủ (hợp đồng, quy định)
   - *Ví dụ:* All suppliers must abide by the new safety guidelines.
2. **agreement** (/əˈɡriːmənt/) — n. thỏa thuận, hợp đồng
   - *Word family:* agree (v), agreeable (adj), agreeably (adv)
3. **provision** (/prəˈvɪʒən/) — n. điều khoản, sự cung cấp
   - *Ví dụ:* The contract includes a provision for late delivery penalties.
4. **negotiate** (/nɪˈɡoʊʃieɪt/) — v. đàm phán, thương lượng
   - *Word family:* negotiation (n), negotiable (adj)

## Chủ đề 2: Tuyển dụng & Nhân sự (Human Resources)
1. **candidate** (/ˈkændɪdət/) — n. ứng viên
2. **qualification** (/ˌkwɑːlɪfɪˈkeɪʃən/) — n. bằng cấp, năng lực chuyên môn
3. **probation** (/prəˈbeɪʃən/) — n. thời gian thử việc
4. **payroll** (/ˈpeɪroʊl/) — n. bảng lương nhân viên

## Mẹo ghi nhớ nhanh
- Luôn học theo cặp **Động từ + Danh từ** hay đi cùng nhau (collocations): *sign a contract*, *meet a deadline*, *submit a proposal*.`,
  },
  {
    slug: "so-tay-ngu-phap-toeic-0-den-990",
    title: "Sổ Tay Ngữ Pháp TOEIC Toàn Diện Từ Mất Gốc Đến 990",
    description: "Tóm tắt trực quan 28 chuyên đề ngữ pháp trọng tâm: từ loại, thì động từ, câu bị động, mệnh đề quan hệ và đảo ngữ.",
    categorySlug: "tu-vung-ngu-phap",
    level: "Mọi trình độ",
    fileType: "PDF",
    pageCount: 64,
    fileSizeLabel: "4.5 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: true,
    viewCount: 2150,
    downloadCount: 1340,
    tags: ["Ngữ pháp", "Part 5", "Part 6", "Mất gốc"],
    previewContent: `# Sổ Tay Ngữ Pháp TOEIC Toàn Diện

## Quy tắc 3 giây nhận diện Từ loại (Word Form)
- **Sau mạo từ (a/an/the), tính từ sở hữu (my/our/their)** -> ưu tiên **Danh từ** hoặc **Tính từ + Danh từ**.
- **Trước danh từ** -> điền **Tính từ** (hoặc danh từ ghép).
- **Bổ nghĩa cho động từ, tính từ hoặc cả câu** -> điền **Trạng từ (-ly)**.
- **Sau động từ nối (be, seem, remain, become)** -> điền **Tính từ**.

## Các đuôi từ vựng nhận biết nhanh
- Danh từ: *-tion, -ment, -ness, -ity, -ance/-ence, -er/-or*
- Tính từ: *-able/-ible, -ive, -ful, -ous, -al, -ic*
- Trạng từ: *-ly* (lưu ý ngoại lệ tính từ đuôi -ly như *friendly, timely, costly*)`,
  },
  {
    slug: "bang-collocation-va-gioi-tu-thuong-gap",
    title: "Tổng Hợp 150 Cụm Collocation & Giới Từ Dễ Mất Điểm Part 5",
    description: "Danh sách các cụm giới từ và động từ đi với giới từ cố định thường xuyên xuất hiện trong bẫy câu hỏi từ vựng Part 5–6.",
    categorySlug: "tu-vung-ngu-phap",
    level: "650+",
    fileType: "PDF",
    pageCount: 22,
    fileSizeLabel: "1.8 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 780,
    downloadCount: 412,
    tags: ["Giới từ", "Collocation", "Part 5"],
    previewContent: `# 150 Cụm Collocation & Giới Từ Trọng Tâm

- **in charge of**: chịu trách nhiệm về
- **on behalf of**: thay mặt cho
- **in accordance with**: phù hợp với, theo đúng
- **prior to + V-ing / N**: trước khi
- **regardless of**: bất chấp, không kể đến
- **comply with**: tuân thủ (= abide by / adhere to)`,
  },
  {
    slug: "lo-trinh-tu-hoc-toeic-650-trong-90-ngay",
    title: "Lộ Trình Tự Học TOEIC Từ 300 Lên 650+ Trong 90 Ngày",
    description: "Kế hoạch chi tiết theo từng tuần cho sinh viên và người đi làm bận rộn, mỗi ngày 60 phút kết hợp Nghe – Đọc – Từ vựng.",
    categorySlug: "luyen-thi-toeic",
    level: "450+",
    fileType: "PDF",
    pageCount: 30,
    fileSizeLabel: "2.1 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: true,
    viewCount: 1930,
    downloadCount: 1105,
    tags: ["Lộ trình", "Tự học", "650+"],
    previewContent: `# Lộ Trình Tự Học TOEIC 90 Ngày (Mục tiêu 650+)

## Giai đoạn 1 (Ngày 1–30): Xây nền tảng
- Mỗi ngày 20 từ vựng chủ đề công sở + 1 chuyên đề ngữ pháp cơ bản.
- Luyện nghe chép chính tả Part 1 và Part 2 (15 phút/ngày).

## Giai đoạn 2 (Ngày 31–60): Tăng tốc kỹ năng
- Làm quen Part 3–4 (nghe nắm ý chính, xác định từ khóa câu hỏi trước khi băng chạy).
- Luyện Part 5 dưới 20 giây/câu và Part 7 đọc đơn theo kỹ thuật Scanning.

## Giai đoạn 3 (Ngày 61–90): Thực chiến Full Test
- Tuần làm 2 đề bấm giờ nghiêm ngặt 120 phút, dành 90 phút để chữa lỗi sai và ghi sổ tay bẫy đề.`,
  },
  {
    slug: "chien-luoc-phan-bo-thoi-gian-120-phut",
    title: "Chiến Lược Phân Bổ Thời Gian Phòng Thi TOEIC 75 Phút Reading",
    description: "Hướng dẫn cách chia thời gian chuẩn cho Part 5 (10 phút), Part 6 (8 phút) và Part 7 (57 phút) để không bị thiếu giờ.",
    categorySlug: "luyen-thi-toeic",
    level: "650+",
    fileType: "PDF",
    pageCount: 16,
    fileSizeLabel: "1.2 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 940,
    downloadCount: 520,
    tags: ["Chiến thuật", "Quản lý thời gian", "Reading"],
    previewContent: `# Chiến Lược Phân Bổ 75 Phút Reading

1. **Part 5 (30 câu):** Tối đa 10–12 phút (20–24 giây/câu). Câu ngữ pháp đọc nhanh 2 bên chỗ trống, câu nghĩa chưa rõ thì khoanh tạm để tránh sa lầy.
2. **Part 6 (16 câu):** Tối đa 8–10 phút. Đọc cả câu chứa chỗ trống và câu liền kề cho câu điền cả mệnh đề.
3. **Part 7 (54 câu):** Dành trọn 53–55 phút. Ưu tiên xử lý nhanh bài đọc đơn (Email, Notice, Text Message) rồi tới bài đọc kép/ba.`,
  },
  {
    slug: "huong-dan-to-phieu-va-tam-ly-phong-thi",
    title: "Checklist Chuẩn Bị Trước Ngày Thi TOEIC & Kỹ Năng Tô Phiếu Nhanh",
    description: "Kinh nghiệm thực tế xử lý sự cố phòng thi, mẹo chuyển trang khi làm Part 3–4 và giữ nhịp tập trung suốt 2 giờ.",
    categorySlug: "luyen-thi-toeic",
    level: "Mọi trình độ",
    fileType: "PDF",
    pageCount: 12,
    fileSizeLabel: "0.9 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 620,
    downloadCount: 310,
    tags: ["Kinh nghiệm thi", "IIG", "Checklist"],
    previewContent: `# Checklist Phòng Thi TOEIC

- Giấy tờ tùy thân bản gốc còn hạn, không ép dẻo rách mép.
- Khi làm Listening Part 3 & 4: tận dụng thời gian đọc hướng dẫn đầu Part để đọc trước 3 câu hỏi đầu tiên.
- Không ngoái lại câu đã trôi qua ở Listening — bỏ qua ngay để bắt kịp cụm 3 câu tiếp theo.`,
  },
  {
    slug: "bo-de-practice-2026-giai-chi-tiet",
    title: "Tuyển Tập Đề Thi Thử TOEIC 2026 (Format Mới) Kèm Giải Chi Tiết",
    description: "Tổng hợp các câu hỏi bám sát xu hướng ra đề mới nhất về công nghệ, làm việc từ xa, chuỗi cung ứng và hội thảo trực tuyến.",
    categorySlug: "de-thi-loi-giai",
    level: "650+",
    fileType: "PDF",
    pageCount: 86,
    fileSizeLabel: "6.4 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: true,
    viewCount: 1850,
    downloadCount: 990,
    tags: ["Đề thi 2026", "Full Test", "Giải chi tiết"],
    previewContent: `# Đề Thi Thử TOEIC Format 2026

Bao gồm đầy đủ các dạng câu hỏi mới:
- Tin nhắn nhóm nhiều người (Multi-person chat) trong Part 7.
- Câu hỏi ý định người nói *"What does the woman mean when she says...?"* trong Part 3 & 4.
- Tích hợp sẵn trên mục **Luyện đề TOEIC** để làm trực tuyến và chấm điểm tự động.`,
  },
  {
    slug: "tong-hop-bay-part-2-thuong-gap",
    title: "Phân Tích 100 Câu Hỏi Bẫy Part 2 (Câu Trả Lời Gián Tiếp & Phủ Định)",
    description: "Giải mã các kiểu trả lời vòng vo, câu hỏi đuôi, câu hỏi lựa chọn và bẫy đồng âm trong Part 2.",
    categorySlug: "de-thi-loi-giai",
    level: "450+",
    fileType: "PDF",
    pageCount: 28,
    fileSizeLabel: "2.0 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 870,
    downloadCount: 475,
    tags: ["Part 2", "Bẫy nghe", "Transcript"],
    previewContent: `# Giải Mã Bẫy Part 2 TOEIC

- **Cảnh giác từ đồng âm / lặp từ:** Đáp án lặp lại đúng từ khóa trong câu hỏi thường là đáp án nhiễu (~80% trường hợp).
- **Câu trả lời gián tiếp "I don't know" biến thể:** *Let me check with my supervisor*, *The schedule hasn't been finalized yet*, *Ask Sarah — she handled it*.`,
  },
  {
    slug: "bo-de-master-800-plus-giai-thich-sau",
    title: "Bộ Đề Chinh Phục 800–950+ Master Vol 1 (Trích Dẫn Đáp Án Chuẩn)",
    description: "Tuyển chọn câu hỏi phân hóa cao Part 5–6–7 kèm phân tích ngữ cảnh và kỹ thuật loại trừ đáp án nhiễu.",
    categorySlug: "de-thi-loi-giai",
    level: "800+",
    fileType: "PDF",
    pageCount: 54,
    fileSizeLabel: "4.1 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 740,
    downloadCount: 380,
    tags: ["800+", "Master", "Part 7"],
    previewContent: `# Chinh Phục Câu Hỏi Phân Hóa 800+

Tập trung vào 3 dạng bài khó:
1. Câu hỏi NOT / EXCEPT cần đối chiếu chéo 2–3 văn bản.
2. Câu hỏi từ đồng nghĩa theo ngữ cảnh (Contextual Synonym).
3. Câu hỏi suy luận (Inference) dựa trên dữ kiện gián tiếp.`,
  },
  {
    slug: "tu-dien-tranh-va-dong-tu-part-1",
    title: "120 Động Từ & Cụm Giới Từ Tả Tranh Kinh Điển Part 1 TOEIC",
    description: "Phân biệt chuẩn xác trạng thái đang diễn ra (is being + V3) và trạng thái tĩnh (is + V3) trong câu hỏi mô tả tranh.",
    categorySlug: "listening-phat-am",
    level: "250+",
    fileType: "PDF",
    pageCount: 26,
    fileSizeLabel: "2.3 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 1120,
    downloadCount: 645,
    tags: ["Part 1", "Tả tranh", "Listening"],
    previewContent: `# Từ Vựng Cốt Lõi Part 1

- **Người với đồ vật:** *leaning against*, *reaching for*, *examining*, *pushing a cart*, *adjusting*.
- **Cảnh vật không người:** *stacked on the shelf*, *parked along the street*, *arranged in rows*, *hanging from the ceiling*.
- **Lưu ý bẫy kinh điển:** Tranh không có người mà câu đáp án có *being* (*are being arranged*) -> Loại ngay!`,
  },
  {
    slug: "luyen-noi-am-va-giong-anh-uc-my",
    title: "Cẩm Nang Nghe Nhận Diện Giọng Anh – Mỹ – Úc – Canada Trong TOEIC",
    description: "Bảng đối chiếu cách phát âm khác biệt giữa 4 giọng đọc chuẩn ETS (âm /t/ vỗ lưỡi, âm /r/ cuối, từ vựng biến âm).",
    categorySlug: "listening-phat-am",
    level: "650+",
    fileType: "PDF",
    pageCount: 20,
    fileSizeLabel: "1.6 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 680,
    downloadCount: 390,
    tags: ["Phát âm", "Accent", "Listening"],
    previewContent: `# Phân Biệt 4 Accent Trong Đề TOEIC

- **Giọng Mỹ (US):** Âm /t/ giữa 2 nguyên âm đọc nhẹ thành /d/ (*water, schedule, better*).
- **Giọng Anh / Úc (UK/AU):** Thường lược âm /r/ cuối từ (*car, order, department*) và giữ âm /t/ bật rõ hơn.`,
  },
  {
    slug: "tap-chep-chinh-ta-part-3-4",
    title: "Workbook Nghe Chép Chính Tả 50 Đoạn Hội Thoại Công Sở Part 3–4",
    description: "Bài tập điền khuyết theo từ khóa chức danh, thời gian, địa điểm và lý do trong hội thoại doanh nghiệp.",
    categorySlug: "listening-phat-am",
    level: "450+",
    fileType: "PDF",
    pageCount: 38,
    fileSizeLabel: "2.8 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 830,
    downloadCount: 440,
    tags: ["Dictation", "Part 3", "Part 4"],
    previewContent: `# Nghe Chép Chính Tả Part 3–4

Tập trung bắt 4 nhóm thông tin vàng:
1. Người nói đang làm nghề gì / ở phòng ban nào?
2. Vấn đề phát sinh là gì? (*delayed, out of stock, malfunctioning*)
3. Giải pháp đề xuất là gì?
4. Người nghe sẽ làm gì tiếp theo?`,
  },
  {
    slug: "ky-thuat-paraphrase-part-7",
    title: "Bảng 200 Cặp Từ Paraphrase Kinh Điển Từ Đề Đọc Part 7",
    description: "Tổng hợp những cặp diễn đạt đồng nghĩa giữa văn bản bài đọc và đáp án đúng để tăng tốc làm Part 7.",
    categorySlug: "reading-ky-nang-doc",
    level: "650+",
    fileType: "PDF",
    pageCount: 32,
    fileSizeLabel: "2.4 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: true,
    viewCount: 1510,
    downloadCount: 910,
    tags: ["Paraphrase", "Part 7", "Reading"],
    previewContent: `# 200 Cặp Paraphrase Part 7 Hay Gặp Nhất

- *complimentary* = *free of charge / at no cost*
- *postpone / put off* = *reschedule to a later date*
- *not working properly* = *malfunctioning / experiencing technical issues*
- *submit prior to Friday* = *turn in before the end of the week*`,
  },
  {
    slug: "huong-dan-xu-ly-doc-kep-va-doc-ba",
    title: "Phương Pháp Nối Dữ Kiện Cho Bài Đọc Kép & Đọc Ba Đoạn (Double/Triple Passages)",
    description: "Cách đọc câu hỏi trước để khoanh vùng đúng Email – Hóa đơn – Lịch trình mà không bị rối thông tin.",
    categorySlug: "reading-ky-nang-doc",
    level: "800+",
    fileType: "PDF",
    pageCount: 24,
    fileSizeLabel: "1.9 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 720,
    downloadCount: 365,
    tags: ["Double Passage", "Triple Passage", "Part 7"],
    previewContent: `# Chiến Thuật Nối Dữ Kiện Part 7

- Câu 1–2 thường nằm ở đoạn văn đầu tiên.
- Câu có dấu hiệu **tên riêng, mã đơn hàng, ngày tháng hoặc giá tiền** là câu nối chéo giữa đoạn 1 và đoạn 2/3.
- Luôn kiểm tra phần ghi chú nhỏ cuối bảng biểu hoặc dòng P.S. trong Email.`,
  },
  {
    slug: "luyen-scanning-skimming-7-dang-van-ban",
    title: "7 Dạng Văn Bản Đặc Trưng Trong Part 7 & Cấu Trúc Đọc Nhanh",
    description: "Phân tích bố cục chuẩn của Email, Letter, Notice, Advertisement, Article, Text Message và Form/Memo.",
    categorySlug: "reading-ky-nang-doc",
    level: "450+",
    fileType: "PDF",
    pageCount: 22,
    fileSizeLabel: "1.7 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 690,
    downloadCount: 350,
    tags: ["Skimming", "Scanning", "Part 7"],
    previewContent: `# Bố Cục 7 Dạng Văn Bản Part 7

1. **Email / Memo:** Đọc kỹ dòng Subject, From/To và đoạn đầu để biết mục đích.
2. **Notice / Announcement:** Chú ý đối tượng áp dụng, thời gian hiệu lực và ngoại lệ.
3. **Text Message Chain:** Đọc theo mạch hội thoại để trả lời câu hỏi ý định câu nói.`,
  },
  {
    slug: "planner-tu-hoc-toeic-va-bang-theo-doi-diem",
    title: "Sổ Tay Kế Hoạch Tự Học & Bảng Quy Đổi Điểm TOEIC 200 Câu",
    description: "Template theo dõi số câu đúng từng Part sau mỗi đề thi thử giúp nhận diện nhanh điểm yếu cần bù.",
    categorySlug: "tai-lieu-khac",
    level: "Mọi trình độ",
    fileType: "PDF",
    pageCount: 10,
    fileSizeLabel: "0.8 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 540,
    downloadCount: 295,
    tags: ["Planner", "Theo dõi điểm", "Tự học"],
    previewContent: `# Cách Dùng Bảng Phân Tích Lỗi Sai

Sau mỗi lần làm đề, ghi lại số câu sai theo 7 Part:
- Nếu sai nhiều Part 1–2 -> ưu tiên luyện Dictation 15 phút/ngày.
- Nếu sai nhiều Part 5 -> ôn lại Từ loại, Thì, Giới từ & Liên từ.
- Nếu thiếu giờ Part 7 -> luyện Scanning & Skimming theo timer.`,
  },
  {
    slug: "tieng-anh-giao-tiep-phong-van-van-phong",
    title: "100 Mẫu Câu Tiếng Anh Công Sở & Viết Email Chuyên Nghiệp",
    description: "Ứng dụng kiến thức TOEIC vào giao tiếp viết Email xin nghỉ phép, báo cáo tiến độ, phản hồi khách hàng.",
    categorySlug: "tai-lieu-khac",
    level: "450+",
    fileType: "PDF",
    pageCount: 34,
    fileSizeLabel: "2.5 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 810,
    downloadCount: 460,
    tags: ["Email", "Công sở", "Giao tiếp"],
    previewContent: `# Mẫu Câu Viết Email Công Sở Chuẩn TOEIC

- **Mở đầu:** *I am writing to follow up on our recent meeting regarding...*
- **Đính kèm tài liệu:** *Please find attached the updated quarterly report.*
- **Đề nghị phản hồi:** *Could you please confirm by Thursday at 5:00 PM?*`,
  },
  {
    slug: "tai-lieu-dong-tu-bat-quy-tac-va-phrasal-verbs",
    title: "Bảng Động Từ Bất Quy Tắc & 80 Phrasal Verbs Văn Phòng Hay Thi",
    description: "Hệ thống các cụm động từ dễ nhầm nghĩa như turn down, put off, look into, carry out, bring up.",
    categorySlug: "tai-lieu-khac",
    level: "650+",
    fileType: "PDF",
    pageCount: 18,
    fileSizeLabel: "1.4 MB",
    isFree: true,
    priceVnd: 0,
    isFeatured: false,
    viewCount: 770,
    downloadCount: 410,
    tags: ["Phrasal Verbs", "Động từ", "Từ vựng"],
    previewContent: `# Phrasal Verbs Trọng Tâm Trong TOEIC

- **carry out**: tiến hành, thực hiện (a survey, research, inspection)
- **call off**: hủy bỏ (= cancel)
- **put off**: trì hoãn (= postpone)
- **turn down**: từ chối (an offer, application) hoặc vặn nhỏ
- **look into**: điều tra, xem xét kỹ (= investigate)`,
  },
];

// === grammar.ts ===
export interface GrammarLessonSeed {
  slug: string;
  title: string;
  order: number;
  knowledge: {
    heading: string;
    summary: string;
    formula?: string;
    examples: { en: string; vi: string; highlight?: string }[];
    trapTip?: string;
  }[];
  vocab: {
    word: string;
    ipa: string;
    pos: string;
    meaning: string;
    example: string;
  }[];
  tests: {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  summary: {
    takeaways: string[];
    commonTraps: string[];
  };
}

export interface GrammarTopicSeed {
  slug: string;
  title: string;
  description: string;
  targetLevel: "250+" | "450+" | "650+" | "800+" | "990";
  order: number;
  estimatedMinutes: number;
  lessons: GrammarLessonSeed[];
}

export const SEED_GRAMMAR_TOPICS: GrammarTopicSeed[] = [
  {
    slug: "tu-loai-va-vi-tri-trong-cau",
    title: "Từ Loại & Quy Tắc 3 Giây Nhận Diện Chỗ Trống",
    description: "Nắm chắc vị trí Danh từ, Động từ, Tính từ, Trạng từ — chuyên đề chiếm 25–30% số câu Part 5 TOEIC.",
    targetLevel: "250+",
    order: 1,
    estimatedMinutes: 25,
    lessons: [
      {
        slug: "danh-tu-va-tinh-tu-trong-part-5",
        title: "Bài 1: Vị trí Danh từ & Tính từ chuẩn ETS",
        order: 1,
        knowledge: [
          {
            heading: "1. Vị trí vàng của Danh từ (Noun)",
            summary: "Danh từ đứng sau mạo từ (a, an, the), tính từ sở hữu (my, your, our, their, his, her, its), lượng từ (many, several, some) và làm tân ngữ sau ngoại động từ hoặc giới từ.",
            formula: "a / an / the / sở hữu cách + (Adv) + (Adj) + NOUN",
            examples: [
              { en: "The manager praised the team's remarkable achievement.", vi: "Quản lý đã khen ngợi thành tựu đáng chú ý của nhóm.", highlight: "achievement" },
              { en: "Please submit your application before Friday.", vi: "Vui lòng nộp đơn đăng ký của bạn trước thứ Sáu.", highlight: "application" },
            ],
            trapTip: "Cẩn thận danh từ ghép (compound nouns) như 'customer satisfaction', 'safety regulations' — 2 danh từ đứng cạnh nhau vẫn hợp lệ!",
          },
          {
            heading: "2. Vị trí của Tính từ (Adjective)",
            summary: "Tính từ đứng trước danh từ để bổ nghĩa hoặc đứng sau động từ nối (be, become, remain, seem, appear, feel).",
            formula: "Linking Verb (be / remain / become / seem) + ADJ",
            examples: [
              { en: "Our prices remain competitive despite rising costs.", vi: "Giá của chúng tôi vẫn cạnh tranh bất chấp chi phí tăng.", highlight: "competitive" },
              { en: "We received a favorable response from the client.", vi: "Chúng tôi nhận được phản hồi tích cực từ khách hàng.", highlight: "favorable" },
            ],
          },
        ],
        vocab: [
          { word: "achievement", ipa: "/əˈtʃiːvmənt/", pos: "n.", meaning: "thành tựu, thành tích", example: "Reaching 900 TOEIC was a major achievement." },
          { word: "competitive", ipa: "/kəmˈpetətɪv/", pos: "adj.", meaning: "có tính cạnh tranh", example: "The company offers a competitive salary." },
          { word: "favorable", ipa: "/ˈfeɪvərəbl/", pos: "adj.", meaning: "thuận lợi, tích cực", example: "The proposal received a favorable review." },
          { word: "application", ipa: "/ˌæplɪˈkeɪʃn/", pos: "n.", meaning: "đơn xin, sự ứng dụng", example: "Send your application by email." },
        ],
        tests: [
          {
            id: "pos-1",
            prompt: "The new software update ensures higher _______ for all remote team members.",
            options: ["produce", "productive", "productivity", "productively"],
            correctIndex: 2,
            explanation: "Sau tính từ so sánh 'higher' (và trước giới từ 'for') cần một Danh từ làm tân ngữ của động từ 'ensures' -> 'productivity' (năng suất).",
          },
          {
            id: "pos-2",
            prompt: "Despite the sudden market shift, quarterly sales remained _______ throughout the summer.",
            options: ["stability", "stable", "stabilize", "stably"],
            correctIndex: 1,
            explanation: "'remain' là động từ nối (linking verb), phía sau cần Tính từ để mô tả trạng thái chủ ngữ 'sales' -> 'stable'.",
          },
          {
            id: "pos-3",
            prompt: "Ms. Chen offered several _______ suggestions during the budget planning session.",
            options: ["construct", "construction", "constructive", "constructively"],
            correctIndex: 2,
            explanation: "Trước danh từ 'suggestions' và sau lượng từ 'several' cần Tính từ bổ nghĩa -> 'constructive' (mang tính xây dựng).",
          },
          {
            id: "pos-4",
            prompt: "All visitors must wear a visible identification badge upon _______ to the research facility.",
            options: ["enter", "entered", "entrance", "entrant"],
            correctIndex: 2,
            explanation: "Sau giới từ 'upon' cần Danh từ chỉ sự việc -> 'entrance' (lối vào / việc đi vào). 'entrant' là người tham dự, không hợp nghĩa 'to the facility'.",
          },
        ],
        summary: {
          takeaways: [
            "Luôn nhìn từ ngay trước và ngay sau chỗ trống trước khi dịch cả câu.",
            "Nhóm linking verbs phổ biến trong TOEIC: be, become, remain, seem, stay, appear.",
          ],
          commonTraps: [
            "Nhầm giữa danh từ chỉ người (-er/-or/-ant) và danh từ chỉ sự vật/quá trình (-tion/-ment/-ance).",
            "Thấy 'the' liền chọn danh từ ngay mà quên nhìn xem phía sau đã có danh từ chính chưa (nếu có rồi thì phải chọn Tính từ!).",
          ],
        },
      },
      {
        slug: "trang-tu-va-vi-tri-bo-nghia",
        title: "Bài 2: Trạng từ & Bẫy Phân từ (-ing / -ed)",
        order: 2,
        knowledge: [
          {
            heading: "1. Các vị trí cốt lõi của Trạng từ (Adverb)",
            summary: "Trạng từ bổ nghĩa cho động từ thường, tính từ, trạng từ khác hoặc đứng đầu câu bổ nghĩa cho cả mệnh đề. Mẹo lớn: nếu bỏ chỗ trống đi mà câu vẫn đầy đủ ngữ pháp S-V-O -> chỗ trống là Trạng từ.",
            formula: "Aux + ADV + V_main  |  ADV + ADJ  |  S + V + O + ADV",
            examples: [
              { en: "The contract was thoroughly reviewed by our legal team.", vi: "Hợp đồng đã được đội pháp chế rà soát kỹ lưỡng.", highlight: "thoroughly" },
              { en: "Significantly, customer retention rose by 18%.", vi: "Đáng chú ý là tỷ lệ giữ chân khách hàng đã tăng 18%.", highlight: "Significantly" },
            ],
            trapTip: "Chú ý một số tính từ cũng có đuôi -ly: costly (đắt đỏ), timely (kịp thời), friendly (thân thiện), likely (có khả năng).",
          },
        ],
        vocab: [
          { word: "thoroughly", ipa: "/ˈθɜːrəli/", pos: "adv.", meaning: "một cách kỹ lưỡng, triệt để", example: "Inspect the machine thoroughly before shipping." },
          { word: "timely", ipa: "/ˈtaɪmli/", pos: "adj.", meaning: "kịp thời, đúng lúc", example: "Thank you for your timely response." },
          { word: "significantly", ipa: "/sɪɡˈnɪfɪkəntli/", pos: "adv.", meaning: "đáng kể, rõ rệt", example: "Fuel costs decreased significantly." },
        ],
        tests: [
          {
            id: "adv-1",
            prompt: "The accounting department has _______ verified every invoice submitted this quarter.",
            options: ["care", "careful", "carefully", "carefulness"],
            correctIndex: 2,
            explanation: "Chỗ trống kẹp giữa trợ động từ 'has' và phân từ 'verified' -> cần Trạng từ bổ nghĩa cho động từ -> 'carefully'.",
          },
          {
            id: "adv-2",
            prompt: "We greatly appreciate your _______ assistance in resolving the server outage.",
            options: ["time", "timely", "timeliness", "timed"],
            correctIndex: 1,
            explanation: "Trước danh từ 'assistance' và sau tính từ sở hữu 'your' cần Tính từ. 'timely' là tính từ đuôi -ly nghĩa là 'kịp thời'.",
          },
          {
            id: "adv-3",
            prompt: "The conference room is _______ equipped with dual projectors and surround audio.",
            options: ["full", "fully", "fullness", "filled"],
            correctIndex: 1,
            explanation: "Trước phân từ tính từ 'equipped' cần Trạng từ để bổ nghĩa mức độ -> 'fully' (được trang bị đầy đủ).",
          },
        ],
        summary: {
          takeaways: [
            "Giữa trợ động từ (has/is/will/can) và động từ chính luôn ưu tiên Trạng từ.",
            "Cấu trúc 'be + ADV + V3/Adj' xuất hiện gần như trong mọi đề ETS.",
          ],
          commonTraps: [
            "Đừng nhầm 'timely' / 'costly' / 'friendly' là trạng từ chỉ vì đuôi -ly.",
          ],
        },
      },
    ],
  },
  {
    slug: "thi-dong-tu-va-cau-bi-dong",
    title: "Thì Động Từ & Cấu Trúc Câu Bị Động",
    description: "Phân biệt mốc thời gian trong câu, phối hợp thì chính xác và nhận diện chủ động vs bị động trong 5 giây.",
    targetLevel: "450+",
    order: 2,
    estimatedMinutes: 30,
    lessons: [
      {
        slug: "thi-hien-tai-hoan-thanh-vs-qua-khu-don",
        title: "Bài 1: Hiện tại hoàn thành vs Quá khứ đơn & Dấu hiệu thời gian",
        order: 1,
        knowledge: [
          {
            heading: "1. Quy tắc đối chiếu trạng từ chỉ thời gian",
            summary: "Quá khứ đơn đi với mốc thời gian xác định đã kết thúc (yesterday, last week, in 2022, ago). Hiện tại hoàn thành đi với hành động kéo dài đến hiện tại hoặc chưa rõ thời điểm (since + mốc, for + khoảng, over the past years, recently).",
            formula: "Past Simple: V2/ed + yesterday/last/ago  |  Present Perfect: have/has + V3 + since/for/recently",
            examples: [
              { en: "Since 2023, the firm has opened four regional branches.", vi: "Từ năm 2023 đến nay, công ty đã mở 4 chi nhánh khu vực.", highlight: "has opened" },
              { en: "The board approved the expansion plan last Tuesday.", vi: "Hội đồng quản trị đã duyệt kế hoạch mở rộng vào thứ Ba tuần trước.", highlight: "approved" },
            ],
          },
          {
            heading: "2. Tương lai hoàn thành (will have + V3)",
            summary: "Thường xuất hiện khi câu có cụm 'by + mốc thời gian tương lai' (by next month, by the end of this year).",
            formula: "by + mốc tương lai -> will have + V3/ed",
            examples: [
              { en: "By Friday afternoon, all technicians will have completed the safety training.", vi: "Trước chiều thứ Sáu, toàn bộ kỹ thuật viên sẽ hoàn thành xong khóa đào tạo an toàn.", highlight: "will have completed" },
            ],
          },
        ],
        vocab: [
          { word: "expansion", ipa: "/ɪkˈspænʃn/", pos: "n.", meaning: "sự mở rộng", example: "The retail expansion created 50 jobs." },
          { word: "approve", ipa: "/əˈpruːv/", pos: "v.", meaning: "phê duyệt, tán thành", example: "Management approved the travel budget." },
          { word: "regional", ipa: "/ˈriːdʒənl/", pos: "adj.", meaning: "thuộc khu vực, vùng", example: "She oversees regional sales." },
        ],
        tests: [
          {
            id: "tense-1",
            prompt: "Over the last five years, Orion Logistics _______ its fleet with electric delivery vans.",
            options: ["upgrades", "upgraded", "has upgraded", "will upgrade"],
            correctIndex: 2,
            explanation: "Cụm 'Over the last five years' diễn tả khoảng thời gian kéo dài từ quá khứ tới hiện tại -> dùng Hiện tại hoàn thành 'has upgraded'.",
          },
          {
            id: "tense-2",
            prompt: "By the time the CEO arrives next Monday, the marketing team _______ the final slides.",
            options: ["prepared", "has prepared", "will have prepared", "is preparing"],
            correctIndex: 2,
            explanation: "'By the time + Hiện tại đơn (mang nghĩa tương lai)' yêu cầu mệnh đề chính chia Tương lai hoàn thành -> 'will have prepared'.",
          },
          {
            id: "tense-3",
            prompt: "The keynote speaker _______ an inspiring workshop at the annual summit last month.",
            options: ["leads", "led", "has led", "will lead"],
            correctIndex: 1,
            explanation: "'last month' là mốc quá khứ đã chấm dứt hoàn toàn -> dùng Quá khứ đơn 'led'.",
          },
        ],
        summary: {
          takeaways: [
            "Gặp 'since / over the past + khoảng thời gian' -> ưu tiên Present Perfect.",
            "Gặp 'by + mốc tương lai / by the time + V(s/es)' -> ưu tiên Future Perfect.",
          ],
          commonTraps: [
            "Trong mệnh đề điều kiện hoặc thời gian (when, before, after, until, as soon as), KHÔNG dùng 'will', mà dùng Hiện tại đơn thay thế.",
          ],
        },
      },
      {
        slug: "cau-bi-dong-trong-van-ban-thuong-mai",
        title: "Bài 2: Phân biệt Chủ động vs Bị động siêu tốc",
        order: 2,
        knowledge: [
          {
            heading: "Mẹo kiểm tra Tân ngữ sau chỗ trống",
            summary: "Với ngoại động từ (notify, submit, revise, deliver, manufacture), nếu sau chỗ trống KHÔNG có tân ngữ (hoặc theo sau ngay bằng giới từ by/to/for/in) -> 95% là Câu bị động (be + V3).",
            formula: "S (vật) + be + V3/ed (+ by / giới từ)",
            examples: [
              { en: "All defective items will be replaced at no extra charge.", vi: "Mọi sản phẩm lỗi sẽ được đổi mới miễn phí.", highlight: "will be replaced" },
            ],
            trapTip: "Các nội động từ KHÔNG bao giờ chia bị động: happen, occur, arrive, appear, remain, consist of, belong to.",
          },
        ],
        vocab: [
          { word: "defective", ipa: "/dɪˈfektɪv/", pos: "adj.", meaning: "bị lỗi, khuyết tật", example: "Return defective units within 14 days." },
          { word: "malfunction", ipa: "/ˌmælˈfʌŋkʃn/", pos: "v./n.", meaning: "trục trặc kỹ thuật", example: "The printer malfunctioned yesterday." },
        ],
        tests: [
          {
            id: "pass-1",
            prompt: "Revised safety manuals _______ to every factory supervisor before the audit starts.",
            options: ["distribute", "will distribute", "will be distributed", "distributing"],
            correctIndex: 2,
            explanation: "Chủ ngữ 'Revised safety manuals' là vật và phía sau chỗ trống là giới từ 'to' (không có tân ngữ) -> cần chia Bị động -> 'will be distributed'.",
          },
          {
            id: "pass-2",
            prompt: "The unexpected power outage _______ at 2:15 PM during the maintenance check.",
            options: ["occurred", "was occurred", "is occurring", "has been occurred"],
            correctIndex: 0,
            explanation: "'occur' là nội động từ (xảy ra), không bao giờ dùng ở dạng bị động -> loại B và D. Mốc 'at 2:15 PM' trong ngữ cảnh tường thuật quá khứ -> 'occurred'.",
          },
        ],
        summary: {
          takeaways: ["Kiểm tra 2 bước: (1) Chủ ngữ là người hay vật? (2) Sau chỗ trống có danh từ tân ngữ không?"],
          commonTraps: ["Chia nhầm bị động cho nội động từ như 'occur', 'happen', 'arrive', 'last'."],
        },
      },
    ],
  },
  {
    slug: "menh-de-quan-he-va-rut-gon",
    title: "Mệnh Đề Quan Hệ & Rút Gọn Phân Từ",
    description: "Chọn đúng who/whom/whose/which/where và rút gọn V-ing / V3-ed cho câu dài Part 5–6.",
    targetLevel: "650+",
    order: 3,
    estimatedMinutes: 25,
    lessons: [
      {
        slug: "dai-tu-quan-he-va-rut-gon-menh-de",
        title: "Bài 1: Đại từ quan hệ & Bẫy 'Whose + Noun'",
        order: 1,
        knowledge: [
          {
            heading: "1. Phân biệt Who / Whom / Whose / Which / Where",
            summary: "Dùng 'whose + Danh từ' để chỉ sở hữu (dù chủ sở hữu là người hay vật). Dùng 'where' thay cho 'in/at which' khi phía sau là mệnh đề đầy đủ S-V.",
            formula: "Danh từ + WHOSE + Danh từ + V  |  Địa điểm + WHERE + S + V",
            examples: [
              { en: "We partnered with a vendor whose delivery record is outstanding.", vi: "Chúng tôi hợp tác với nhà cung cấp có lịch sử giao hàng xuất sắc.", highlight: "whose delivery record" },
            ],
          },
          {
            heading: "2. Rút gọn Mệnh đề quan hệ thành V-ing / V3",
            summary: "Khi câu đã có động từ chia thì chính ở chỗ khác, động từ bổ nghĩa danh từ đứng trước được rút gọn: Chủ động -> V-ing; Bị động -> V3/ed.",
            examples: [
              { en: "The candidates applying for the role must hold a license.", vi: "Các ứng viên nộp đơn cho vị trí này phải có chứng chỉ.", highlight: "applying" },
            ],
          },
        ],
        vocab: [
          { word: "vendor", ipa: "/ˈvendər/", pos: "n.", meaning: "nhà cung cấp, người bán", example: "Compare quotes from three vendors." },
          { word: "outstanding", ipa: "/aʊtˈstændɪŋ/", pos: "adj.", meaning: "xuất sắc, nổi bật; còn tồn đọng", example: "Pay the outstanding balance immediately." },
        ],
        tests: [
          {
            id: "rel-1",
            prompt: "Applicants _______ resumes arrive after May 10 will be considered for the fall intake.",
            options: ["who", "whom", "whose", "which"],
            correctIndex: 2,
            explanation: "Sau chỗ trống là danh từ 'resumes' thuộc sở hữu của 'Applicants' -> bắt buộc dùng 'whose'.",
          },
          {
            id: "rel-2",
            prompt: "All invoices _______ by the regional director must be archived in the accounting portal.",
            options: ["approve", "approved", "approving", "approval"],
            correctIndex: 1,
            explanation: "Động từ chính của câu là 'must be archived'. Chỗ trống rút gọn mệnh đề quan hệ bị động cho 'All invoices' (which are approved) -> 'approved'.",
          },
          {
            id: "rel-3",
            prompt: "The warehouse _______ we store seasonal inventory is located near the main port.",
            options: ["which", "where", "who", "whose"],
            correctIndex: 1,
            explanation: "'we store seasonal inventory' là mệnh đề đã đủ chủ ngữ và tân ngữ -> thiếu trạng ngữ chỉ nơi chốn cho 'The warehouse' -> 'where'.",
          },
        ],
        summary: {
          takeaways: [
            "Luôn đếm số động từ chia thì trong câu trước khi chọn V-ing/V3.",
            "'whose' có thể dùng cho cả người lẫn vật/công ty.",
          ],
          commonTraps: ["Chọn 'which' thay vì 'where' khi mệnh đề sau đã đầy đủ tân ngữ."],
        },
      },
    ],
  },
  {
    slug: "lien-tu-va-gioi-tu-noi-menh-de",
    title: "Liên Từ & Giới Từ Nối Mệnh Đề (650+ -> 800+)",
    description: "Cặp câu dễ ăn điểm tuyệt đối khi phân biệt rành mạch sau chỗ trống là Cụm danh từ hay Mệnh đề S+V.",
    targetLevel: "650+",
    order: 4,
    estimatedMinutes: 25,
    lessons: [
      {
        slug: "phan-biet-although-vs-despite-because-vs-due-to",
        title: "Bài 1: Cặp đối lập & nguyên nhân (Although / Despite, Because / Due to)",
        order: 1,
        knowledge: [
          {
            heading: "Quy tắc vàng: Mệnh đề (S+V) vs Cụm danh từ (NP/V-ing)",
            summary: "Nhìn ngay sau chỗ trống xem có cụm Chủ–Vị hay chỉ là Cụm danh từ/V-ing để loại 50% đáp án sai ngữ pháp chỉ trong 2 giây.",
            formula: "Although / Even though / Because / While + S + V   ||   Despite / In spite of / Because of / Due to / During + Noun/V-ing",
            examples: [
              { en: "Although the flight was delayed, the team reached the venue on time.", vi: "Dù chuyến bay bị trễ, nhóm vẫn đến địa điểm đúng giờ.", highlight: "Although" },
              { en: "Despite the heavy rain, outdoor booths remained busy.", vi: "Bất chấp mưa lớn, các gian hàng ngoài trời vẫn đông khách.", highlight: "Despite" },
            ],
          },
        ],
        vocab: [
          { word: "venue", ipa: "/ˈvenjuː/", pos: "n.", meaning: "địa điểm tổ chức", example: "Book a larger venue for the expo." },
          { word: "notwithstanding", ipa: "/ˌnɑːtwɪθˈstændɪŋ/", pos: "prep.", meaning: "mặc dù (= despite)", example: "Notwithstanding the cost, the upgrade is worthwhile." },
        ],
        tests: [
          {
            id: "conj-1",
            prompt: "_______ the severe weather warning, the logistics summit proceeded as scheduled.",
            options: ["Although", "Even though", "Despite", "However"],
            correctIndex: 2,
            explanation: "'the severe weather warning' là Cụm danh từ (không có động từ chia thì) -> chọn Giới từ 'Despite'.",
          },
          {
            id: "conj-2",
            prompt: "_______ the supplier raised material prices, our profit margin stayed healthy.",
            options: ["In spite of", "Because of", "Even though", "During"],
            correctIndex: 2,
            explanation: "Phía sau là mệnh đề đầy đủ 'the supplier raised material prices' và 2 vế mang nghĩa tương phản -> chọn Liên từ 'Even though'.",
          },
          {
            id: "conj-3",
            prompt: "Flight departures were temporarily suspended _______ dense fog near the runway.",
            options: ["because", "due to", "since", "although"],
            correctIndex: 1,
            explanation: "Sau chỗ trống là cụm danh từ 'dense fog near the runway' chỉ nguyên nhân -> chọn 'due to'.",
          },
        ],
        summary: {
          takeaways: ["'However' / 'Therefore' / 'Nevertheless' là trạng từ liên kết, thường kẹp giữa dấu chấm/chấm phẩy và dấu phẩy — không nối 2 mệnh đề trần trực tiếp."],
          commonTraps: ["Nhầm 'During' (giới từ + N) với 'While' (liên từ + S+V / V-ing)."],
        },
      },
    ],
  },
  {
    slug: "cau-dieu-kien-va-gia-dinh",
    title: "Câu Điều Kiện, Should & Thức Giả Định (Subjunctive)",
    description: "Chinh phục dạng câu nâng cao band 800+: câu điều kiện 1–2–3, đảo ngữ 'Should / Were / Had' và cấu trúc giả định.",
    targetLevel: "800+",
    order: 5,
    estimatedMinutes: 30,
    lessons: [
      {
        slug: "dao-ngu-cau-dieu-kien-va-gia-dinh-800",
        title: "Bài 1: Đảo ngữ Điều kiện & Thức giả định (suggest/recommend + V-inf)",
        order: 1,
        knowledge: [
          {
            heading: "1. Đảo ngữ câu điều kiện bỏ 'If'",
            summary: "ETS rất hay thay 'If you need assistance...' bằng 'Should you need assistance...' ở các Email chăm sóc khách hàng.",
            formula: "Should + S + V(inf)... | Were + S + to V / Adj... | Had + S + V3...",
            examples: [
              { en: "Should you require further details, please contact our support desk.", vi: "Nếu bạn cần thêm thông tin chi tiết, vui lòng liên hệ bộ phận hỗ trợ.", highlight: "Should" },
            ],
          },
          {
            heading: "2. Thức giả định (Subjunctive Mood)",
            summary: "Sau động từ/tính từ mang tính đề xuất, yêu cầu (suggest, recommend, insist, require, essential, imperative) + that + S + V nguyên mẫu (không chia -s, không chia quá khứ).",
            formula: "recommend / insist / essential + that + S + (should) + V_bare",
            examples: [
              { en: "The policy requires that every employee complete cybersecurity training.", vi: "Chính sách yêu cầu mọi nhân viên phải hoàn thành khóa đào tạo an ninh mạng.", highlight: "complete" },
            ],
          },
        ],
        vocab: [
          { word: "imperative", ipa: "/ɪmˈperətɪv/", pos: "adj.", meaning: "cấp thiết, bắt buộc", example: "It is imperative that staff arrive early." },
          { word: "require", ipa: "/rɪˈkwaɪər/", pos: "v.", meaning: "đòi hỏi, yêu cầu", example: "The role requires fluency in English." },
        ],
        tests: [
          {
            id: "cond-1",
            prompt: "_______ you encounter any billing discrepancies, please notify our finance office immediately.",
            options: ["If", "Should", "Had", "Were"],
            correctIndex: 1,
            explanation: "Mệnh đề chính dùng câu mệnh lệnh 'please notify' (điều kiện loại 1) và động từ 'encounter' giữ nguyên mẫu -> đảo ngữ loại 1 dùng 'Should' (thay cho If you encounter). Nếu chọn 'If' vẫn đúng nghĩa với 'you encounter', NHƯNG chờ câu đề chuẩn: thực tế đây là test đảo ngữ khi đi kèm 'Should you...'; hãy kiểm tra lại nếu dùng 'If' với động từ chia thì — để rõ ràng nhất, ở câu có trợ động từ tách hoặc đảo ngữ ta ưu tiên 'Should'.",
          },
          {
            id: "cond-2",
            prompt: "_______ we invested in automated warehousing earlier, shipping delays would have been avoided.",
            options: ["Should", "Were", "Had", "Unless"],
            correctIndex: 2,
            explanation: "Mệnh đề chính là 'would have been avoided' (loại 3) và động từ 'invested' là V3 -> đảo ngữ điều kiện loại 3 dùng 'Had' (= If we had invested).",
          },
          {
            id: "cond-3",
            prompt: "The safety inspector insisted that the technician _______ the faulty valve before restarting operations.",
            options: ["replaces", "replaced", "replace", "replacing"],
            correctIndex: 2,
            explanation: "Sau 'insisted that' dùng thức giả định -> động từ luôn ở dạng nguyên mẫu không chia 'replace' dù chủ ngữ 'the technician' là số ít và 'insisted' ở quá khứ.",
          },
        ],
        summary: {
          takeaways: [
            "Nhìn mệnh đề chính có 'please + V' -> đảo ngữ 'Should + S + V-inf'.",
            "Nhìn thấy 'recommend / suggest / essential + that + S + ___' -> chọn ngay V nguyên mẫu.",
          ],
          commonTraps: ["Thấy chủ ngữ số ít ('every employee') rồi chọn nhầm V-s thay vì V nguyên mẫu trong thức giả định."],
        },
      },
    ],
  },
  {
    slug: "dao-ngu-va-cau-truc-nhan-manh-990",
    title: "Đảo Ngữ Phủ Định & Cấu Trúc Nhấn Mạnh (Band 900–990)",
    description: "Chuyên đề phân hóa điểm tối đa 950–990: Not only... but also, Rarely, Only after, No sooner... than.",
    targetLevel: "990",
    order: 6,
    estimatedMinutes: 20,
    lessons: [
      {
        slug: "dao-ngu-voi-not-only-va-hardly",
        title: "Bài 1: Đảo ngữ trạng từ phủ định đầu câu",
        order: 1,
        knowledge: [
          {
            heading: "Quy tắc đảo trợ động từ lên trước chủ ngữ",
            summary: "Khi từ mang nghĩa phủ định hoặc giới hạn đứng đầu câu (Not only, Never, Seldom, Rarely, Only by, No sooner), mệnh đề đứng sau phải đảo trợ động từ (did/does/has/will/can) lên trước S.",
            formula: "Not only / Rarely / Only after + Aux + S + V",
            examples: [
              { en: "Not only did the campaign boost sales, but it also raised brand awareness.", vi: "Chiến dịch không chỉ thúc đẩy doanh số mà còn nâng cao nhận diện thương hiệu.", highlight: "did the campaign boost" },
            ],
          },
        ],
        vocab: [
          { word: "awareness", ipa: "/əˈwernəs/", pos: "n.", meaning: "nhận thức, độ nhận diện", example: "Brand awareness grew rapidly." },
          { word: "scarcely", ipa: "/ˈskersli/", pos: "adv.", meaning: "hầu như không", example: "Scarcely had we launched when orders surged." },
        ],
        tests: [
          {
            id: "inv-1",
            prompt: "Not only _______ its carbon emissions by 30%, but the plant also lowered energy bills.",
            options: ["the factory reduced", "did the factory reduce", "reduced the factory", "has reduced the factory"],
            correctIndex: 1,
            explanation: "'Not only' đứng đầu câu nên mệnh đề đầu phải đảo ngữ (Trợ động từ + Chủ ngữ + V nguyên mẫu) -> 'did the factory reduce'.",
          },
          {
            id: "inv-2",
            prompt: "Only after reviewing all audit logs _______ the discrepancy in the payroll report.",
            options: ["the team discovered", "did the team discover", "was the team discover", "discovered the team"],
            correctIndex: 1,
            explanation: "'Only after + cụm V-ing' đứng đầu câu -> mệnh đề chính phía sau phải đảo ngữ -> 'did the team discover'.",
          },
        ],
        summary: {
          takeaways: ["Nhóm 'Only + ...' đứng đầu câu chỉ đảo ngữ ở mệnh đề CHÍNH phía sau, không đảo ở mệnh đề phụ đi cùng 'Only'."],
          commonTraps: ["Chọn nhầm 'was + S + V nguyên mẫu' thay vì 'did + S + V nguyên mẫu'."],
        },
      },
    ],
  },
];

// === exams.ts ===
export interface ExamQuestionSeed {
  number: number;
  part: number;
  groupKey?: string;
  promptText: string;
  passageTitle?: string;
  passageHtml?: string;
  audioScript?: string;
  imageScene?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExamTestSeed {
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: string;
  isHot?: boolean;
  order: number;
  questions: ExamQuestionSeed[];
}

export interface ExamSetSeed {
  slug: string;
  title: string;
  badge?: string;
  description: string;
  order: number;
  tests: ExamTestSeed[];
}

export const SEED_EXAM_SETS: ExamSetSeed[] = [
  {
    slug: "practice-vol-1",
    title: "01 Practice Vol 1",
    badge: "Nền tảng",
    description: "Bộ đề làm quen chuẩn cấu trúc ETS từ căn bản đến 650+, giải thích chi tiết từng bẫy ngữ pháp và nghe hiểu.",
    order: 1,
    tests: [
      {
        slug: "practice-vol-1-test-1",
        title: "Practice Vol 1 – Đề mô phỏng đủ 7 Parts",
        description: "Đề rút gọn chuẩn 7 phần (Part 1–7) tích hợp âm thanh đọc tự động và tranh minh họa Part 1 để làm quen giao diện thi.",
        durationMinutes: 25,
        difficulty: "Cơ bản – Trung cấp (550+)",
        isHot: true,
        order: 1,
        questions: [
          // PART 1 (2 questions)
          {
            number: 1,
            part: 1,
            promptText: "Listen to the four statements and choose the one that best describes the picture.",
            imageScene: "office-meeting",
            audioScript: "Question 1. Look at the picture. A: The woman is typing on a laptop while colleagues review a document. B: The office chairs are stacked in a corner. C: Everyone is standing outside the building. D: A projector screen is being removed from the wall.",
            options: [
              "(A) Nghe lựa chọn A",
              "(B) Nghe lựa chọn B",
              "(C) Nghe lựa chọn C",
              "(D) Nghe lựa chọn D",
            ],
            correctIndex: 0,
            explanation: "Tranh mô tả nhân viên đang làm việc trên laptop cùng đồng nghiệp xem tài liệu tại bàn họp -> Đáp án (A): 'The woman is typing on a laptop while colleagues review a document.'",
          },
          {
            number: 2,
            part: 1,
            promptText: "Listen to the four statements and choose the one that best describes the picture.",
            imageScene: "cafe-workspace",
            audioScript: "Question 2. Look at the picture. A: Coffee cups are being washed in a sink. B: A laptop and a notebook are placed on a wooden table. C: Customers are waiting in a long line at the counter. D: Umbrellas have been opened on a patio.",
            options: [
              "(A) Nghe lựa chọn A",
              "(B) Nghe lựa chọn B",
              "(C) Nghe lựa chọn C",
              "(D) Nghe lựa chọn D",
            ],
            correctIndex: 1,
            explanation: "Trên bàn gỗ có đặt máy tính xách tay và cuốn sổ tay -> Đáp án (B): 'A laptop and a notebook are placed on a wooden table.'",
          },
          // PART 2 (3 questions)
          {
            number: 3,
            part: 2,
            promptText: "Listen to the question and three responses. Choose the most appropriate response.",
            audioScript: "Question 3. Where will the quarterly budget meeting take place? A: Probably in Conference Room B. B: Every three months. C: Yes, I reviewed the budget yesterday.",
            options: [
              "(A) Nghe lựa chọn A",
              "(B) Nghe lựa chọn B",
              "(C) Nghe lựa chọn C",
            ],
            correctIndex: 0,
            explanation: "Câu hỏi 'Where' hỏi địa điểm họp -> Đáp án (A) 'Probably in Conference Room B.' (B trả lời tần suất, C trả lời Yes/No là bẫy).",
          },
          {
            number: 4,
            part: 2,
            promptText: "Listen to the question and three responses. Choose the most appropriate response.",
            audioScript: "Question 4. Who is responsible for updating the client database? A: Around four o'clock. B: Actually, Ms. Park handles that task. C: The data was very helpful.",
            options: [
              "(A) Nghe lựa chọn A",
              "(B) Nghe lựa chọn B",
              "(C) Nghe lựa chọn C",
            ],
            correctIndex: 1,
            explanation: "Câu hỏi 'Who' hỏi người phụ trách -> Đáp án (B) 'Actually, Ms. Park handles that task.'",
          },
          {
            number: 5,
            part: 2,
            promptText: "Listen to the question and three responses. Choose the most appropriate response.",
            audioScript: "Question 5. Could you send me the revised shipment schedule? A: Sure, I'll email it right after lunch. B: No, the train hasn't arrived yet. C: It's scheduled for Wednesday morning.",
            options: [
              "(A) Nghe lựa chọn A",
              "(B) Nghe lựa chọn B",
              "(C) Nghe lựa chọn C",
            ],
            correctIndex: 0,
            explanation: "Câu đề nghị 'Could you send...' -> Đáp án đồng ý (A) 'Sure, I'll email it right after lunch.'",
          },
          // PART 3 (3 questions grouped)
          {
            number: 6,
            part: 3,
            groupKey: "p1-p3-conv1",
            promptText: "Why is the woman calling the IT help desk?",
            audioScript: "Conversation for questions 6 through 8. Woman: Hi, this is Hannah from Accounting. Our shared printer on the third floor stopped responding after the network maintenance this morning. Man: Let me check the IP log. Yes, it looks like the printer lost its connection to the server. Could you press the reset button on the side panel? Woman: Sure, I'm walking over to it now. Man: Great, I'll also send a technician up in ten minutes just in case the firmware needs updating.",
            options: [
              "To request a new laptop",
              "To report a printer connection issue",
              "To schedule network maintenance",
              "To order extra paper supplies",
            ],
            correctIndex: 1,
            explanation: "Người phụ nữ nói 'Our shared printer... stopped responding after the network maintenance' -> báo cáo sự cố máy in mất kết nối.",
          },
          {
            number: 7,
            part: 3,
            groupKey: "p1-p3-conv1",
            promptText: "What does the man ask the woman to do?",
            options: [
              "Restart her desktop computer",
              "Send an email to Accounting",
              "Press a button on the printer",
              "Move the device to another floor",
            ],
            correctIndex: 2,
            explanation: "Người đàn ông nói: 'Could you press the reset button on the side panel?' -> nhấn nút trên máy in.",
          },
          {
            number: 8,
            part: 3,
            groupKey: "p1-p3-conv1",
            promptText: "What will the man do next?",
            options: [
              "Dispatch a technician",
              "Cancel the maintenance log",
              "Replace the ink cartridge",
              "Call the accounting director",
            ],
            correctIndex: 0,
            explanation: "Người đàn ông kết thúc bằng câu: 'I'll also send a technician up in ten minutes'.",
          },
          // PART 4 (3 questions grouped)
          {
            number: 9,
            part: 4,
            groupKey: "p1-p4-talk1",
            promptText: "Who most likely is the speaker addressing?",
            audioScript: "Talk for questions 9 through 11. Attention museum visitors. Due to the upcoming renovation of the East Wing Gallery, the Modern Sculpture Exhibit will close temporarily starting Monday, October 12. However, our popular Photography Collection on the second floor will remain open daily until 7 PM. If you have already purchased a special guided tour ticket for next week, please stop by the front information desk for a complimentary pass to next month's evening lecture.",
            options: [
              "Art school students",
              "Museum visitors",
              "Construction workers",
              "Tour guides",
            ],
            correctIndex: 1,
            explanation: "Mở đầu thông báo: 'Attention museum visitors.' -> hướng tới khách tham quan bảo tàng.",
          },
          {
            number: 10,
            part: 4,
            groupKey: "p1-p4-talk1",
            promptText: "Why will the Modern Sculpture Exhibit close?",
            options: [
              "A gallery is being renovated.",
              "Attendance has declined.",
              "The artworks were sold.",
              "Staff training is scheduled.",
            ],
            correctIndex: 0,
            explanation: "'Due to the upcoming renovation of the East Wing Gallery' -> do khu trưng bày sắp sửa chữa/nâng cấp.",
          },
          {
            number: 11,
            part: 4,
            groupKey: "p1-p4-talk1",
            promptText: "What are ticket holders invited to receive at the front desk?",
            options: [
              "A souvenir catalog",
              "A full cash refund",
              "A free pass to a future talk",
              "Priority parking access",
            ],
            correctIndex: 2,
            explanation: "'a complimentary pass to next month's evening lecture' = 'a free pass to a future talk' (paraphrase).",
          },
          // PART 5 (5 questions)
          {
            number: 12,
            part: 5,
            promptText: "Employees must obtain written _______ from their department head before booking international flights.",
            options: ["approve", "approved", "approval", "approving"],
            correctIndex: 2,
            explanation: "Sau tính từ 'written' và làm tân ngữ của 'obtain' cần Danh từ -> 'approval' (sự phê duyệt).",
          },
          {
            number: 13,
            part: 5,
            promptText: "The renovated flagship store in Da Nang will open _______ to the public on November 20.",
            options: ["official", "officially", "officials", "officiate"],
            correctIndex: 1,
            explanation: "Cần Trạng từ bổ nghĩa cho động từ 'will open' -> 'officially' (chính thức mở cửa).",
          },
          {
            number: 14,
            part: 5,
            promptText: "_______ the rainy forecast, over three hundred volunteers joined the riverside cleanup event.",
            options: ["Although", "Because", "Despite", "Unless"],
            correctIndex: 2,
            explanation: "Phía sau là cụm danh từ 'the rainy forecast' mang ý nghĩa nhượng bộ -> dùng giới từ 'Despite'.",
          },
          {
            number: 15,
            part: 5,
            promptText: "All warranty claims should be submitted _______ 30 days of the original purchase date.",
            options: ["among", "within", "between", "into"],
            correctIndex: 1,
            explanation: "Diễn tả khoảng thời gian 'trong vòng 30 ngày kể từ ngày mua' -> dùng 'within'.",
          },
          {
            number: 16,
            part: 5,
            promptText: "Ms. Sato _______ as regional sales director since the Tokyo office expanded in 2022.",
            options: ["serves", "served", "has served", "will serve"],
            correctIndex: 2,
            explanation: "Có mệnh đề mốc thời gian 'since... in 2022' -> chia Hiện tại hoàn thành 'has served'.",
          },
          // PART 6 (4 questions grouped with passage)
          {
            number: 17,
            part: 6,
            groupKey: "p1-p6-memo",
            passageTitle: "MEMORANDUM: Office Recycling Upgrade",
            passageHtml: `<p><strong>To:</strong> All Staff<br/><strong>From:</strong> Facilities Management<br/><strong>Date:</strong> March 4<br/><strong>Subject:</strong> Updated Recycling Stations</p><p>Starting next Monday, new color-coded recycling bins will be installed in every break room across the building. This initiative is designed to <strong>[17]</strong> _______ landfill waste by at least 40 percent over the coming year.</p><p>Please separate paper, aluminum cans, and glass bottles carefully before placing them in the marked containers. <strong>[18]</strong> _______. Food containers with heavy grease should still go into the general waste bin.</p><p>In addition, printed flyers explaining the sorting guidelines are posted <strong>[19]</strong> _______ each copy machine. Should you have questions about large electronic items, please contact the facilities team <strong>[20]</strong> _______.</p>`,
            promptText: "Choose the best word for blank [17].",
            options: ["reduce", "expand", "postpone", "assemble"],
            correctIndex: 0,
            explanation: "Mục tiêu của thùng phân loại rác là 'giảm' (reduce) lượng rác chôn lấp ít nhất 40%.",
          },
          {
            number: 18,
            part: 6,
            groupKey: "p1-p6-memo",
            promptText: "Choose the best sentence for blank [18].",
            options: [
              "Rinsing bottles lightly beforehand helps prevent odors.",
              "The cafeteria menu has been updated for spring.",
              "All laptops must be locked in drawers overnight.",
              "Parking permits are renewed every January.",
            ],
            correctIndex: 0,
            explanation: "Câu trước nhắc tách chai thủy tinh và lon nhôm, câu sau nói về hộp thức ăn dính dầu -> câu phù hợp mạch văn là nhắc rửa nhẹ chai lọ trước để tránh mùi.",
          },
          {
            number: 19,
            part: 6,
            groupKey: "p1-p6-memo",
            promptText: "Choose the best word for blank [19].",
            options: ["beside", "into", "until", "during"],
            correctIndex: 0,
            explanation: "Tờ hướng dẫn được dán 'bên cạnh' (beside) mỗi máy photocopy.",
          },
          {
            number: 20,
            part: 6,
            groupKey: "p1-p6-memo",
            promptText: "Choose the best word for blank [20].",
            options: ["direct", "directly", "direction", "directed"],
            correctIndex: 1,
            explanation: "Bổ nghĩa cho động từ 'contact' ở cuối câu -> dùng trạng từ 'directly' (liên hệ trực tiếp).",
          },
          // PART 7 (4 questions grouped with passage)
          {
            number: 21,
            part: 7,
            groupKey: "p1-p7-email",
            passageTitle: "EMAIL: Order #4928-B Delivery Update",
            passageHtml: `<div class="space-y-3"><p><strong>From:</strong> Customer Care &lt;care@nordicoffice.example&gt;<br/><strong>To:</strong> Minh Tran &lt;minh.tran@apexbuild.example&gt;<br/><strong>Subject:</strong> Update on Your Ergonomic Desk Order #4928-B</p><p>Dear Mr. Tran,</p><p>Thank you for ordering four adjustable standing desks for your design studio. While three desks are already packed and scheduled to arrive on Thursday, June 18, our quality inspection team noticed a minor surface scratch on the fourth walnut tabletop.</p><p>Rather than shipping a flawed unit, we have reserved a brand-new replacement from our central warehouse. That fourth desk will be delivered separately on Monday, June 22, at no additional shipping cost. As a gesture of goodwill, we have also included a 15% discount voucher (code: <strong>STUDIO15</strong>) valid toward your next accessory purchase through August 31.</p><p>If you prefer to receive all four desks in a single shipment on June 22 instead, please reply to this email before 4:00 PM today so we can hold the first three units.</p><p>Warm regards,<br/>Claire Bennett, Order Fulfillment Lead</p></div>`,
            promptText: "What is the main purpose of the email?",
            options: [
              "To cancel an office furniture order",
              "To explain a partial shipment delay",
              "To request payment for express delivery",
              "To advertise a new walnut desk model",
            ],
            correctIndex: 1,
            explanation: "Email thông báo 3 chiếc bàn giao đúng hẹn thứ Năm, riêng chiếc thứ 4 bị xước mặt bàn nên sẽ giao chậm vào thứ Hai tuần sau -> giải thích việc giao hàng chia đợt bị trễ một phần.",
          },
          {
            number: 22,
            part: 7,
            groupKey: "p1-p7-email",
            promptText: "Why was the fourth desk held back from Thursday's shipment?",
            options: [
              "The customer requested a different color.",
              "A defect was found during quality inspection.",
              "The delivery truck reached full capacity.",
              "The studio will be closed on Thursday.",
            ],
            correctIndex: 1,
            explanation: "Đoạn 1 nêu rõ: 'our quality inspection team noticed a minor surface scratch on the fourth walnut tabletop.'",
          },
          {
            number: 23,
            part: 7,
            groupKey: "p1-p7-email",
            promptText: "What does the company offer to compensate for the inconvenience?",
            options: [
              "A free desk chair",
              "A full refund of the shipping fee",
              "A 15% voucher for future accessories",
              "Complimentary desk assembly service",
            ],
            correctIndex: 2,
            explanation: "Đoạn 2: 'included a 15% discount voucher (code: STUDIO15) valid toward your next accessory purchase'.",
          },
          {
            number: 24,
            part: 7,
            groupKey: "p1-p7-email",
            promptText: "What must Mr. Tran do if he wants all four desks delivered together?",
            options: [
              "Call the central warehouse tomorrow",
              "Reply to the email before 4:00 PM today",
              "Enter code STUDIO15 on the website",
              "Sign a new delivery invoice on June 18",
            ],
            correctIndex: 1,
            explanation: "Đoạn 3: 'If you prefer to receive all four desks in a single shipment on June 22 instead, please reply to this email before 4:00 PM today'.",
          },
        ],
      },
      {
        slug: "practice-vol-1-test-2",
        title: "Practice Vol 1 – Tăng tốc Reading Part 5 & 6",
        description: "12 câu hỏi luyện phản xạ ngữ pháp & điền đoạn văn thương mại dưới áp lực thời gian.",
        durationMinutes: 12,
        difficulty: "Cơ bản (500+)",
        order: 2,
        questions: [
          {
            number: 1,
            part: 5,
            promptText: "The marketing brochure should be proofread _______ before it goes to the printing press.",
            options: ["careful", "carefully", "carefulness", "caring"],
            correctIndex: 1,
            explanation: "Bổ nghĩa cho động từ 'be proofread' -> dùng Trạng từ 'carefully'.",
          },
          {
            number: 2,
            part: 5,
            promptText: "Mr. Nguyen thanked the interns for their _______ dedication during the product launch.",
            options: ["continue", "continuing", "continuous", "continuously"],
            correctIndex: 2,
            explanation: "Trước danh từ 'dedication' và sau 'their' dùng Tính từ 'continuous' (liên tục, bền bỉ).",
          },
          {
            number: 3,
            part: 5,
            promptText: "Passengers are reminded to keep their luggage with them _______ all times.",
            options: ["in", "at", "on", "for"],
            correctIndex: 1,
            explanation: "Cụm giới từ cố định 'at all times' (luôn luôn / mọi lúc).",
          },
          {
            number: 4,
            part: 5,
            promptText: "If the shipment _______ before noon, we can inspect the inventory this afternoon.",
            options: ["arrive", "arrives", "will arrive", "arrived"],
            correctIndex: 1,
            explanation: "Câu điều kiện loại 1 (mệnh đề chính có 'can inspect'): mệnh đề If chia Hiện tại đơn -> 'arrives' (chủ ngữ số ít).",
          },
          {
            number: 5,
            part: 5,
            promptText: "Neither the regional manager nor the branch supervisors _______ informed about the policy revision yet.",
            options: ["was", "were", "has been", "is"],
            correctIndex: 1,
            explanation: "Cấu trúc 'Neither A nor B', động từ chia theo chủ ngữ gần nhất B ('branch supervisors' - số nhiều) -> 'were'.",
          },
          {
            number: 6,
            part: 5,
            promptText: "To qualify for the loyalty rebate, customers must spend _______ $150 in a single transaction.",
            options: ["at least", "at most", "almost", "nearly"],
            correctIndex: 0,
            explanation: "Điều kiện tối thiểu để được hoàn tiền -> 'at least' (ít nhất 150 đô).",
          },
          {
            number: 7,
            part: 6,
            groupKey: "p1t2-p6",
            passageTitle: "NOTICE: Downtown Shuttle Schedule Change",
            passageHtml: `<p>Effective Monday, April 6, the morning shuttle connecting Central Station to Horizon Tech Park will depart fifteen minutes <strong>[7]</strong> _______ than usual due to bridge construction on River Road.</p><p>The 7:30 AM bus will now leave at 7:15 AM sharp. <strong>[8]</strong> _______. Evening return trips departing the tech park at 5:30 PM and 6:15 PM remain unchanged.</p><p>Employees who drive personal vehicles may also use the North Garage free of charge <strong>[9]</strong> _______ construction concludes in late May. Please display your company badge on the dashboard when <strong>[10]</strong> _______ the garage.</p>`,
            promptText: "Choose the best word for blank [7].",
            options: ["early", "earlier", "earliest", "earliness"],
            correctIndex: 1,
            explanation: "Phía sau có từ so sánh 'than usual' -> dùng so sánh hơn 'earlier'.",
          },
          {
            number: 8,
            part: 6,
            groupKey: "p1t2-p6",
            promptText: "Choose the best sentence for blank [8].",
            options: [
              "Riders are advised to arrive at Platform 3 by 7:10 AM.",
              "Construction workers finished paving the highway last fall.",
              "New office desks have arrived in the main lobby.",
              "Cafeteria lunch vouchers expire on Friday.",
            ],
            correctIndex: 0,
            explanation: "Câu trước thông báo xe rời bến sớm hơn lúc 7:15 sáng -> câu hợp mạch khuyên hành khách có mặt tại bến lúc 7:10 sáng.",
          },
          {
            number: 9,
            part: 6,
            groupKey: "p1t2-p6",
            promptText: "Choose the best word for blank [9].",
            options: ["until", "during", "despite", "unless"],
            correctIndex: 0,
            explanation: "'until + mệnh đề (construction concludes)' = cho đến khi công trình hoàn tất.",
          },
          {
            number: 10,
            part: 6,
            groupKey: "p1t2-p6",
            promptText: "Choose the best word for blank [10].",
            options: ["enter", "entered", "entering", "entrance"],
            correctIndex: 2,
            explanation: "Rút gọn mệnh đề trạng ngữ chủ động sau 'when' (when you enter -> when entering).",
          },
        ],
      },
    ],
  },
  {
    slug: "practice-vol-2",
    title: "02 Practice Vol 2",
    badge: "Listening Focus",
    description: "Tăng cường phản xạ Listening Part 1–4 với các tình huống công sở, nhà hàng, hội thảo và hàng không.",
    order: 2,
    tests: [
      {
        slug: "practice-vol-2-listening-boost",
        title: "Practice Vol 2 – Luyện phản xạ Listening Part 1–4",
        description: "Bộ 11 câu Listening tập trung vào bẫy phát âm, trả lời gián tiếp Part 2 và paraphrase Part 3–4.",
        durationMinutes: 15,
        difficulty: "Trung cấp (650+)",
        order: 1,
        questions: [
          {
            number: 1,
            part: 1,
            promptText: "Listen and select the statement matching the picture.",
            imageScene: "warehouse-logistics",
            audioScript: "Question 1. A: Boxes are stacked on wooden pallets inside a warehouse. B: A delivery van is driving up a ramp. C: Workers are painting lines on a parking lot. D: Shelves are being assembled outdoors.",
            options: ["(A) Lựa chọn A", "(B) Lựa chọn B", "(C) Lựa chọn C", "(D) Lựa chọn D"],
            correctIndex: 0,
            explanation: "Các thùng hàng được xếp chồng trên pallet gỗ trong nhà kho -> (A).",
          },
          {
            number: 2,
            part: 2,
            promptText: "Listen and choose the most natural response.",
            audioScript: "Question 2. Didn't we already confirm the hotel booking for the sales team? A: Yes, three single rooms were reserved yesterday. B: The hotel lobby is on the right. C: No, I prefer the morning flight.",
            options: ["(A) Lựa chọn A", "(B) Lựa chọn B", "(C) Lựa chọn C"],
            correctIndex: 0,
            explanation: "Câu hỏi phủ định 'Didn't we already confirm...?' -> Đáp án (A) xác nhận đã đặt 3 phòng hôm qua.",
          },
          {
            number: 3,
            part: 2,
            promptText: "Listen and choose the most natural response.",
            audioScript: "Question 3. Would you like me to print the handouts or share them digitally? A: Digital copies are fine, thanks. B: The printer is out of toner. C: I handed it to the reception desk.",
            options: ["(A) Lựa chọn A", "(B) Lựa chọn B", "(C) Lựa chọn C"],
            correctIndex: 0,
            explanation: "Câu hỏi lựa chọn 'A or B' -> Đáp án (A) chọn bản mềm ('Digital copies are fine').",
          },
          {
            number: 4,
            part: 2,
            promptText: "Listen and choose the most natural response.",
            audioScript: "Question 4. Why was the press release postponed until Thursday? A: Because the legal team is still reviewing one clause. B: At the main auditorium. C: Yes, the press conference was informative.",
            options: ["(A) Lựa chọn A", "(B) Lựa chọn B", "(C) Lựa chọn C"],
            correctIndex: 0,
            explanation: "Câu hỏi 'Why' -> Đáp án (A) giải thích nguyên nhân do bộ phận pháp chế còn đang xem xét.",
          },
          {
            number: 5,
            part: 3,
            groupKey: "p2-p3-conv",
            promptText: "Where does this conversation most likely take place?",
            audioScript: "Conversation for questions 5 through 7. Man: Excuse me, I ordered the grilled salmon platter twenty minutes ago, but my colleague already received his meal. Woman: I'm so sorry about the delay, sir. Let me check directly with the kitchen. Wait—it looks like your ticket got misplaced during the lunch rush. I'll have the chef prioritize it right away, and your dessert will be complimentary today.",
            options: ["At a grocery store", "At a restaurant", "At a hotel front desk", "At a catering warehouse"],
            correctIndex: 1,
            explanation: "Các từ khóa 'grilled salmon platter', 'kitchen', 'lunch rush', 'chef', 'dessert' cho thấy bối cảnh tại nhà hàng.",
          },
          {
            number: 6,
            part: 3,
            groupKey: "p2-p3-conv",
            promptText: "What caused the delay?",
            options: [
              "The salmon ran out of stock.",
              "An order ticket was misplaced.",
              "The kitchen oven malfunctioned.",
              "The man arrived late for his reservation.",
            ],
            correctIndex: 1,
            explanation: "'your ticket got misplaced during the lunch rush' -> phiếu gọi món bị thất lạc.",
          },
          {
            number: 7,
            part: 3,
            groupKey: "p2-p3-conv",
            promptText: "What does the woman offer the customer?",
            options: [
              "A free dessert",
              "A gift card for next month",
              "A seat near the window",
              "Half off his colleague's meal",
            ],
            correctIndex: 0,
            explanation: "'your dessert will be complimentary today' ('complimentary' = free).",
          },
          {
            number: 8,
            part: 4,
            groupKey: "p2-p4-talk",
            promptText: "What event is being announced?",
            audioScript: "Talk for questions 8 through 10. Good morning everyone. This is a reminder that our annual Volunteer Community Cleanup Day takes place this Saturday from 8 AM to noon at Riverside Park. Gloves and recycling bags will be distributed near the North Gate Pavilion. Remember to bring a reusable water bottle, as single-use plastic cups will not be provided this year.",
            options: [
              "A park opening ceremony",
              "A community volunteer cleanup",
              "A marathon registration",
              "An outdoor music festival",
            ],
            correctIndex: 1,
            explanation: "'our annual Volunteer Community Cleanup Day takes place this Saturday'.",
          },
          {
            number: 9,
            part: 4,
            groupKey: "p2-p4-talk",
            promptText: "Where should participants pick up supplies?",
            options: [
              "At the central parking lot",
              "Near the North Gate Pavilion",
              "Inside the city hall lobby",
              "Next to the river dock",
            ],
            correctIndex: 1,
            explanation: "'Gloves and recycling bags will be distributed near the North Gate Pavilion.'",
          },
          {
            number: 10,
            part: 4,
            groupKey: "p2-p4-talk",
            promptText: "What are attendees asked to bring themselves?",
            options: [
              "Work gloves",
              "Trash bags",
              "A reusable water bottle",
              "A folding chair",
            ],
            correctIndex: 2,
            explanation: "'Remember to bring a reusable water bottle'.",
          },
        ],
      },
    ],
  },
  {
    slug: "master-vol-1",
    title: "03 Master Vol 1",
    badge: "800+",
    description: "Nâng cao kỹ năng đọc hiểu đa đoạn văn (Double Passage) và câu hỏi ngữ pháp bẫy sâu cho mục tiêu 800+.",
    order: 3,
    tests: [
      {
        slug: "master-vol-1-double-passage",
        title: "Master Vol 1 – Đọc kép & Ngữ pháp 800+",
        description: "Thử thách câu hỏi đảo ngữ, thức giả định và đọc nối dữ kiện 2 văn bản Part 7.",
        durationMinutes: 18,
        difficulty: "Nâng cao (800+)",
        order: 1,
        questions: [
          {
            number: 1,
            part: 5,
            promptText: "_______ the revised compliance checklist carefully, the branch director approved the audit report.",
            options: ["Review", "Reviewed", "Having reviewed", "To reviewing"],
            correctIndex: 2,
            explanation: "Hành động xem xét diễn ra trước và cùng chủ ngữ chủ động ('the branch director') -> dùng phân từ hoàn thành 'Having reviewed'.",
          },
          {
            number: 2,
            part: 5,
            promptText: "The board recommended that the subsidiary _______ a dedicated cybersecurity officer.",
            options: ["appoints", "appointed", "appoint", "appointing"],
            correctIndex: 2,
            explanation: "Thức giả định sau 'recommended that' -> V nguyên mẫu không chia 'appoint'.",
          },
          {
            number: 3,
            part: 5,
            promptText: "No sooner had the software patch been released _______ user complaints dropped dramatically.",
            options: ["when", "than", "then", "that"],
            correctIndex: 1,
            explanation: "Cấu trúc cố định: 'No sooner ... than ...' (vừa mới... thì...).",
          },
          {
            number: 4,
            part: 5,
            promptText: "Customers who purchase an annual subscription are entitled _______ complimentary priority onboarding.",
            options: ["for", "with", "to", "by"],
            correctIndex: 2,
            explanation: "Cấu trúc 'be entitled to + N/V-ing' (có quyền được hưởng cái gì).",
          },
          {
            number: 5,
            part: 5,
            promptText: "_______ unexpected supply disruptions arise, our backup factory in Binh Duong can fulfill urgent orders.",
            options: ["Should", "Had", "Were", "Despite"],
            correctIndex: 0,
            explanation: "Đảo ngữ điều kiện loại 1 với động từ nguyên mẫu 'arise' -> 'Should unexpected supply disruptions arise'.",
          },
          {
            number: 6,
            part: 7,
            groupKey: "m1-double",
            passageTitle: "DOUBLE PASSAGE: Workshop Invoice & Refund Request",
            passageHtml: `<div class="space-y-4"><div class="rounded-lg border p-3"><p class="font-semibold">Document 1 — Workshop Registration Confirmation</p><p><strong>Event:</strong> Data Analytics for Managers (2-Day Bootcamp)<br/><strong>Dates:</strong> July 14–15 | <strong>Venue:</strong> Grand Oak Hotel, Room 204<br/><strong>Attendee:</strong> David Le (Apex Retail)<br/><strong>Fee Paid:</strong> $420.00 (Early-Bird Rate)<br/><em>Policy: Full refunds are granted for cancellations requested at least 7 calendar days prior to the event. Cancellations made 3–6 days before receive a 50% credit toward any future bootcamp. No refunds within 48 hours, though attendee substitutions are allowed free of charge.</em></p></div><div class="rounded-lg border p-3"><p class="font-semibold">Document 2 — Email Sent July 9</p><p><strong>To:</strong> events@skillbridge.example<br/><strong>From:</strong> david.le@apexretail.example<br/><strong>Subject:</strong> Registration Adjustment – Data Analytics Bootcamp</p><p>Hello SkillBridge Team,<br/>Due to an urgent store audit scheduled next week, I will no longer be able to attend the July 14–15 bootcamp myself. Rather than requesting a partial credit, I would like my colleague, <strong>Linh Pham</strong>, to take my seat for both days. Could you please update the name badge and send her the pre-work dataset?<br/>Thank you,<br/>David Le</p></div></div>`,
            promptText: "When did David Le send his email relative to the workshop start date?",
            options: [
              "More than 7 days in advance",
              "Exactly 5 days before the workshop",
              "On the morning of July 14",
              "After the bootcamp ended",
            ],
            correctIndex: 1,
            explanation: "Hội thảo bắt đầu ngày July 14, email gửi ngày July 9 -> cách 5 ngày (14 - 9 = 5 ngày).",
          },
          {
            number: 7,
            part: 7,
            groupKey: "m1-double",
            promptText: "Why did Mr. Le decide NOT to cancel his registration for credit?",
            options: [
              "He wanted to avoid paying a transfer fee.",
              "A 5-day cancellation only qualifies for a 50% credit, so he preferred sending a colleague.",
              "He hoped to attend the second day online.",
              "The hotel waived the cancellation deadline.",
            ],
            correctIndex: 1,
            explanation: "Nối 2 văn bản: Gửi ngày 9 (trước 5 ngày) theo chính sách chỉ được hoàn 50% credit ('3–6 days before receive a 50% credit'). Vì vậy ông ấy nói 'Rather than requesting a partial credit, I would like my colleague... to take my seat'.",
          },
          {
            number: 8,
            part: 7,
            groupKey: "m1-double",
            promptText: "How much extra fee must Apex Retail pay to substitute Linh Pham?",
            options: ["$0", "$42", "$210", "$420"],
            correctIndex: 0,
            explanation: "Chính sách đoạn 1 ghi rõ: 'though attendee substitutions are allowed free of charge' -> $0.",
          },
        ],
      },
    ],
  },
  {
    slug: "master-vol-2",
    title: "04 Master Vol 2",
    badge: "900+",
    description: "Bộ câu hỏi tổng hợp từ vựng nâng cao, sắc thái nghĩa thương mại và phân tích bài báo doanh nghiệp.",
    order: 4,
    tests: [
      {
        slug: "master-vol-2-precision-drills",
        title: "Master Vol 2 – Luyện độ chính xác 900+",
        description: "8 câu chọn lọc về collocation khó, từ vựng đồng nghĩa theo ngữ cảnh và đọc hiểu bài báo.",
        durationMinutes: 12,
        difficulty: "Chuyên sâu (900+)",
        order: 1,
        questions: [
          {
            number: 1,
            part: 5,
            promptText: "The CFO's conservative forecast proved remarkably _______ once the fourth-quarter figures were audited.",
            options: ["accurate", "accurately", "accuracy", "accuracies"],
            correctIndex: 0,
            explanation: "'proved' đóng vai trò linking verb (chứng tỏ là) -> phía sau dùng Tính từ 'accurate'.",
          },
          {
            number: 2,
            part: 5,
            promptText: "To stay ahead of emerging competitors, the design lab allocates substantial funds _______ prototype testing.",
            options: ["at", "toward", "between", "upon"],
            correctIndex: 1,
            explanation: "Cụm 'allocate funds toward/to + danh từ' = phân bổ ngân sách cho hạng mục nào.",
          },
          {
            number: 3,
            part: 5,
            promptText: "The municipal council unanimously _______ the proposal to modernize the central transit hub.",
            options: ["endorsed", "detained", "vacated", "refrained"],
            correctIndex: 0,
            explanation: "'endorse a proposal' = tán thành, phê chuẩn đề xuất.",
          },
          {
            number: 4,
            part: 5,
            promptText: "_______ unforeseen customs inspections, perishable cargo must carry temperature logs at all checkpoints.",
            options: ["In light of", "As far as", "In case of", "Provided that"],
            correctIndex: 0,
            explanation: "'In light of + N' = xét đến / do bởi (thực tế kiểm tra hải quan bất ngờ).",
          },
          {
            number: 5,
            part: 7,
            groupKey: "m2-article",
            passageTitle: "BUSINESS BRIEF: GreenGrid Expands Battery Storage Plant",
            passageHtml: `<p><strong>HO CHI MINH CITY</strong> — Energy technology firm GreenGrid announced on Tuesday that it will triple the manufacturing capacity of its suburban solar-storage facility over the next eighteen months. Chief Executive Officer An Pham stated that surging demand from commercial logistics parks prompted the $24 million expansion.</p><p>Unlike older lead-acid systems, GreenGrid's modular lithium-iron units can be installed inside existing warehouse bays without costly structural reinforcement. Early adopters, including two regional cold-chain operators, reported a 22 percent reduction in peak-hour electricity expenses during a six-month pilot.</p>`,
            promptText: "What prompted GreenGrid's facility expansion?",
            options: [
              "New government subsidies for solar panels",
              "Growing demand from commercial logistics parks",
              "A merger with a cold-chain operator",
              "Lower shipping costs for lead-acid batteries",
            ],
            correctIndex: 1,
            explanation: "Đoạn 1: 'surging demand from commercial logistics parks prompted the $24 million expansion.'",
          },
          {
            number: 6,
            part: 7,
            groupKey: "m2-article",
            promptText: "What advantage of GreenGrid's units is highlighted in the second paragraph?",
            options: [
              "They require no structural reinforcement to install.",
              "They are powered by lead-acid chemistry.",
              "They eliminate electricity bills completely.",
              "They take only one day to manufacture.",
            ],
            correctIndex: 0,
            explanation: "Đoạn 2: 'can be installed inside existing warehouse bays without costly structural reinforcement.'",
          },
        ],
      },
    ],
  },
  {
    slug: "practice-2026",
    title: "05 Practice 2026 Hot",
    badge: "Mới nhất 2026",
    description: "Cập nhật ngữ cảnh làm việc kết hợp AI, làm việc từ xa, chat nhóm nhiều người và thông báo dịch vụ số.",
    order: 5,
    tests: [
      {
        slug: "practice-2026-hot-test-1",
        title: "Practice 2026 Hot – Đề tổng hợp xu hướng mới",
        description: "12 câu hỏi tích hợp cả Listening & Reading với chủ đề tin nhắn Slack/Teams, hội họp từ xa và tự động hóa.",
        durationMinutes: 15,
        difficulty: "Chuẩn mới 2026 (700+)",
        isHot: true,
        order: 1,
        questions: [
          {
            number: 1,
            part: 2,
            promptText: "Listen and select the best response.",
            audioScript: "Question 1. Should I share the recorded webinar link with clients who missed the live session? A: Yes, our coordinator is uploading the edited file now. B: The screen resolution looks sharp. C: Next Tuesday at 10 AM.",
            options: ["(A) Lựa chọn A", "(B) Lựa chọn B", "(C) Lựa chọn C"],
            correctIndex: 0,
            explanation: "Đáp án (A) trả lời trực tiếp câu hỏi Có/Không kèm thông tin điều phối viên đang tải file lên.",
          },
          {
            number: 2,
            part: 3,
            groupKey: "p2026-conv",
            promptText: "What does the woman imply when she says, 'The client portal already handles that automatically'?",
            audioScript: "Conversation for questions 2 and 3. Man: Hi Maya, before Friday's product demo, I was thinking of manually compiling weekly usage PDFs for each client account. Woman: Oh, you don't have to spend hours on that. The client portal already handles that automatically every Monday morning. Instead, could you double-check the onboarding slides for our enterprise tier? Man: Oh, that's a relief! I'll polish those slides right away.",
            options: [
              "The man does not need to prepare weekly usage PDFs manually.",
              "The client portal is undergoing maintenance.",
              "Enterprise clients prefer paper reports.",
              "Friday's product demo has been postponed.",
            ],
            correctIndex: 0,
            explanation: "Câu hỏi ý định (Implied meaning): Người phụ nữ nói câu này sau khi khẳng định 'you don't have to spend hours on that' -> hàm ý anh ấy không cần tự làm file PDF thủ công.",
          },
          {
            number: 3,
            part: 3,
            groupKey: "p2026-conv",
            promptText: "What task will the man focus on next?",
            options: [
              "Exporting client usage logs",
              "Refining the onboarding presentation slides",
              "Fixing a portal login bug",
              "Calling enterprise account holders",
            ],
            correctIndex: 1,
            explanation: "Anh ấy trả lời: 'I'll polish those slides right away.' ('polish' = refine).",
          },
          {
            number: 4,
            part: 5,
            promptText: "Remote employees are encouraged to test their microphone quality _______ joining client video calls.",
            options: ["prior to", "in spite of", "as well as", "owing to"],
            correctIndex: 0,
            explanation: "'prior to + V-ing' = trước khi tham gia cuộc gọi video.",
          },
          {
            number: 5,
            part: 5,
            promptText: "Once the automated translation tool is calibrated, it can process support tickets _______ faster than before.",
            options: ["consider", "considerable", "considerably", "consideration"],
            correctIndex: 2,
            explanation: "Trước tính từ/trạng từ so sánh hơn 'faster' dùng Trạng từ nhấn mạnh mức độ -> 'considerably' (đáng kể).",
          },
          {
            number: 6,
            part: 7,
            groupKey: "p2026-chat",
            passageTitle: "TEAM CHAT CHAIN: Website Checkout Hotfix",
            passageHtml: `<div class="space-y-2 text-sm"><p><strong>[09:14] Huy Vo (Frontend):</strong> Morning team, two users reported that the QR payment button freezes on Safari mobile when switching tabs.</p><p><strong>[09:16] Lan Anh (QA):</strong> Confirmed! I reproduced it on iOS 18. It looks like the polling timer isn't pausing on visibility change.</p><p><strong>[09:19] Huy Vo (Frontend):</strong> Good catch. Let me patch the listener hook and push to staging within 20 minutes.</p><p><strong>[09:21] Minh Khoa (Product):</strong> Thanks both! Once QA verifies it on staging, hold off deploying until 12:30 PM when traffic dips.</p></div>`,
            promptText: "Who verified that the bug actually occurs on mobile Safari?",
            options: ["Huy Vo", "Lan Anh", "Minh Khoa", "A client representative"],
            correctIndex: 1,
            explanation: "Tin nhắn lúc 09:16 của Lan Anh (QA): 'Confirmed! I reproduced it on iOS 18.'",
          },
          {
            number: 7,
            part: 7,
            groupKey: "p2026-chat",
            promptText: "What does Minh Khoa instruct the team to do after staging verification?",
            options: [
              "Deploy immediately at 9:40 AM",
              "Disable the QR payment option",
              "Wait until 12:30 PM to release the fix",
              "Send apology emails to every subscriber",
            ],
            correctIndex: 2,
            explanation: "Minh Khoa viết lúc 09:21: 'hold off deploying until 12:30 PM when traffic dips' (đợi đến 12:30 trưa mới triển khai).",
          },
        ],
      },
    ],
  },
];

// === scenarios.ts ===
export interface ScenarioVocabItem {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
}

export interface ScenarioPhraseItem {
  en: string;
  vi: string;
  context: string;
}

export interface ScenarioDialogueLine {
  role: "A" | "B";
  speakerName: string;
  en: string;
  vi: string;
}

export interface ScenarioRoleBrief {
  title: string;
  goal: string;
  tasks: string[];
}

export interface ScenarioRubricItem {
  id: string;
  criterion: string;
  description: string;
  maxScore: number;
}

export interface SeedCareerScenario {
  slug: string;
  title: string;
  major: string;
  level: string;
  summary: string;
  durationMinutes: number;
  isFree: boolean;
  isClosedBeta: boolean;
  authorName: string;
  reviewedByTeacher: string;
  sourceAttribution: string;
  order: number;
  vocab: ScenarioVocabItem[];
  phrases: ScenarioPhraseItem[];
  dialogue: ScenarioDialogueLine[];
  roleA: ScenarioRoleBrief;
  roleB: ScenarioRoleBrief;
  rubric: ScenarioRubricItem[];
}

export const DEFAULT_PRACTICE_RUBRIC: ScenarioRubricItem[] = [
  {
    id: "terminology",
    criterion: "Thuật ngữ chuyên ngành",
    description: "Dùng đúng và tự nhiên các từ vựng, cụm từ kỹ thuật/nghề nghiệp của tình huống.",
    maxScore: 5,
  },
  {
    id: "clarity",
    criterion: "Phát âm & Độ rõ ý",
    description: "Phát âm từ khóa quan trọng (thông số, lỗi, hành động) dễ hiểu với bạn cùng luyện.",
    maxScore: 5,
  },
  {
    id: "task_completion",
    criterion: "Xử lý đúng trọng tâm",
    description: "Hoàn thành đầy đủ nhiệm vụ của vai đóng và phản hồi sát câu hỏi đối phương.",
    maxScore: 5,
  },
  {
    id: "interaction",
    criterion: "Phản xạ & Xác nhận thông tin",
    description: "Biết hỏi lại khi chưa rõ, xác nhận thông số/thời hạn để tránh hiểu nhầm công việc.",
    maxScore: 5,
  },
  {
    id: "professionalism",
    criterion: "Thái độ nghề nghiệp",
    description: "Giữ giọng điệu lịch sự, hợp tác và đúng quy tắc an toàn/văn hóa nơi làm việc.",
    maxScore: 5,
  },
];

export const SEED_CAREER_SCENARIOS: SeedCareerScenario[] = [
  // =========================================================================
  // CƠ KHÍ (4 tình huống)
  // =========================================================================
  {
    slug: "bao-cao-su-co-thiet-bi-co-khi",
    title: "Báo cáo sự cố thiết bị cho khách hàng nước ngoài",
    major: "Cơ khí",
    level: "Cơ bản (A2)",
    summary:
      "Tình huống chuẩn ngành Cơ khí: kỹ thuật viên thông báo tình trạng dừng máy, mô tả nguyên nhân hư hỏng vòng bi trục chính và đề xuất phương án khắc phục cho đại diện khách hàng.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Cao Anh Nhựt",
    reviewedByTeacher: "GV chuyên môn Khoa Cơ khí · Trường CĐ nghề Việt Nam - Singapore",
    sourceAttribution:
      "Biên soạn từ tình huống thực tập xưởng Cơ khí VSVC; sử dụng AI hỗ trợ kiểm tra chính tả tiếng Anh.",
    order: 1,
    vocab: [
      {
        word: "malfunction",
        phonetic: "/ˌmælˈfʌŋk.ʃən/",
        pos: "noun / verb",
        meaning: "sự cố, trục trặc hoạt động của máy",
        example: "We detected a minor malfunction in the cooling unit.",
      },
      {
        word: "spindle bearing",
        phonetic: "/ˈspɪn.dəl ˈbeə.rɪŋ/",
        pos: "noun",
        meaning: "vòng bi trục chính",
        example: "The spindle bearing needs replacement due to overheating.",
      },
      {
        word: "downtime",
        phonetic: "/ˈdaʊn.taɪm/",
        pos: "noun",
        meaning: "thời gian máy ngừng hoạt động",
        example: "We aim to keep machine downtime under two hours.",
      },
      {
        word: "overheat",
        phonetic: "/ˌoʊ.vərˈhiːt/",
        pos: "verb",
        meaning: "quá nhiệt",
        example: "The motor started to overheat after continuous operation.",
      },
      {
        word: "spare part",
        phonetic: "/sper pɑːrt/",
        pos: "noun",
        meaning: "phụ tùng thay thế",
        example: "Do we have the spare part in the warehouse?",
      },
    ],
    phrases: [
      {
        en: "I am calling to report an unexpected issue on Line 2.",
        vi: "Tôi gọi để báo cáo một sự cố phát sinh ở Dây chuyền số 2.",
        context: "Mở đầu cuộc gọi báo cáo sự cố rõ ràng, đi thẳng vào vấn đề.",
      },
      {
        en: "Our initial inspection shows that the bearing overheated.",
        vi: "Kiểm tra ban đầu của chúng tôi cho thấy vòng bi đã bị quá nhiệt.",
        context: "Trình bày nguyên nhân kỹ thuật dựa trên kiểm tra sơ bộ.",
      },
      {
        en: "The estimated repair time is about ninety minutes.",
        vi: "Thời gian sửa chữa dự kiến khoảng 90 phút.",
        context: "Báo thời gian gián đoạn (downtime) để khách hàng chủ động kế hoạch.",
      },
      {
        en: "To prevent this from happening again, we will check lubrication every shift.",
        vi: "Để tránh lặp lại sự cố này, chúng tôi sẽ kiểm tra bôi trơn sau mỗi ca.",
        context: "Đề xuất biện pháp phòng ngừa sau khắc phục.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Kỹ thuật viên (An)",
        en: "Good morning, Mr. Tanaka. I am calling to report a sudden stop on CNC machine number three.",
        vi: "Chào anh Tanaka. Tôi gọi để báo cáo việc máy CNC số 3 vừa dừng đột ngột.",
      },
      {
        role: "B",
        speakerName: "Đại diện khách hàng (Tanaka)",
        en: "Thanks for letting me know quickly. What seems to be the cause of the malfunction?",
        vi: "Cảm ơn bạn đã báo sớm. Nguyên nhân trục trặc có vẻ là gì vậy?",
      },
      {
        role: "A",
        speakerName: "Kỹ thuật viên (An)",
        en: "Our initial inspection shows the spindle bearing overheated and triggered the safety sensor.",
        vi: "Kiểm tra ban đầu cho thấy vòng bi trục chính bị quá nhiệt và kích hoạt cảm biến an toàn.",
      },
      {
        role: "B",
        speakerName: "Đại diện khách hàng (Tanaka)",
        en: "Do you have the spare part on site, and how long will the downtime be?",
        vi: "Bên bạn có sẵn phụ tùng tại xưởng không, và thời gian dừng máy sẽ kéo dài bao lâu?",
      },
      {
        role: "A",
        speakerName: "Kỹ thuật viên (An)",
        en: "Yes, we have two spare bearings in stock. The estimated repair time is about ninety minutes.",
        vi: "Có ạ, kho còn hai vòng bi dự phòng. Thời gian sửa chữa dự kiến khoảng 90 phút.",
      },
      {
        role: "B",
        speakerName: "Đại diện khách hàng (Tanaka)",
        en: "Please proceed with the replacement and send me a short test report once the machine runs again.",
        vi: "Hãy tiến hành thay thế và gửi tôi báo cáo chạy thử ngắn sau khi máy hoạt động lại nhé.",
      },
    ],
    roleA: {
      title: "Vai A · Kỹ thuật viên Cơ khí",
      goal: "Thông báo kịp thời sự cố dừng máy, nêu rõ nguyên nhân và cam kết thời gian khắc phục.",
      tasks: [
        "Nêu mã máy gặp sự cố và hiện tượng bất thường (quá nhiệt / rung lắc).",
        "Giải thích ngắn gọn nguyên nhân kiểm tra ban đầu bằng thuật ngữ đúng.",
        "Xác nhận tình trạng phụ tùng thay thế và ước tính downtime cụ thể.",
      ],
    },
    roleB: {
      title: "Vai B · Giám sát / Khách hàng nước ngoài",
      goal: "Nắm bắt mức độ ảnh hưởng tiến độ sản xuất và yêu cầu xác nhận an toàn sau sửa chữa.",
      tasks: [
        "Hỏi nguyên nhân cụ thể và kiểm tra xem có ảnh hưởng chất lượng lô hàng đang chạy không.",
        "Xác nhận thời gian máy chạy lại và tiến độ giao hàng.",
        "Yêu cầu gửi báo cáo kiểm tra vận hành (test report) sau khi hoàn tất.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "doc-ban-ve-ky-thuat-va-dung-sai-cnc",
    title: "Trao đổi thông số bản vẽ kỹ thuật & dung sai gia công CNC",
    major: "Cơ khí",
    level: "Trung bình (B1)",
    summary:
      "Thực hành đọc và xác nhận kích thước, dung sai (±0.02 mm), độ nhám bề mặt và vật liệu phôi giữa thợ gia công CNC và kỹ sư thiết kế.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Cao Anh Nhựt",
    reviewedByTeacher: "GV chuyên môn Khoa Cơ khí · VSVC",
    sourceAttribution: "Biên soạn nội bộ dựa trên giáo trình Đọc bản vẽ kỹ thuật Cơ khí VSVC.",
    order: 2,
    vocab: [
      {
        word: "tolerance",
        phonetic: "/ˈtɑːl.ər.əns/",
        pos: "noun",
        meaning: "dung sai cho phép",
        example: "The hole diameter requires a tight tolerance of plus or minus 0.02 millimeters.",
      },
      {
        word: "blueprint",
        phonetic: "/ˈbluː.prɪnt/",
        pos: "noun",
        meaning: "bản vẽ kỹ thuật",
        example: "Please double-check revision B on the blueprint before milling.",
      },
      {
        word: "surface roughness",
        phonetic: "/ˈsɜːr.fɪs ˈrʌf.nəs/",
        pos: "noun",
        meaning: "độ nhám bề mặt",
        example: "What is the required surface roughness for the contact face?",
      },
      {
        word: "caliper",
        phonetic: "/ˈkæl.ɪ.pər/",
        pos: "noun",
        meaning: "thước cặp đo kiểm",
        example: "Use a digital caliper to verify the outer shaft width.",
      },
      {
        word: "chamfer",
        phonetic: "/ˈtʃæm.fər/",
        pos: "noun / verb",
        meaning: "vát mép cạnh",
        example: "Add a 1-millimeter chamfer along all sharp edges.",
      },
    ],
    phrases: [
      {
        en: "Could you confirm whether we are following Revision B of the drawing?",
        vi: "Bạn có thể xác nhận xem chúng ta đang làm theo Bản vẽ sửa đổi B không?",
        context: "Kiểm tra đúng phiên bản bản vẽ trước khi gá phôi gia công.",
      },
      {
        en: "The inner bore has a tolerance of plus or minus 0.02 mm.",
        vi: "Đường kính lỗ trong có dung sai cộng trừ 0.02 mm.",
        context: "Đọc thông số dung sai chuẩn xác.",
      },
      {
        en: "We noticed a sharp edge here—should we add a 1 mm chamfer?",
        vi: "Chúng tôi thấy có cạnh sắc ở đây—có cần vát mép 1 mm không?",
        context: "Hỏi làm rõ chi tiết gia công còn thiếu trên bản vẽ.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Thợ CNC (Hùng)",
        en: "Hi David, before I start the batch, could you confirm we are using Revision B of the shaft blueprint?",
        vi: "Chào David, trước khi chạy loạt sản phẩm, anh xác nhận giúp mình đang dùng Bản sửa đổi B của bản vẽ trục nhé?",
      },
      {
        role: "B",
        speakerName: "Kỹ sư thiết kế (David)",
        en: "Yes, Revision B is the latest version. Please pay close attention to the center bore tolerance.",
        vi: "Đúng rồi, Bản B là mới nhất. Nhớ chú ý kỹ dung sai của lỗ tâm nhé.",
      },
      {
        role: "A",
        speakerName: "Thợ CNC (Hùng)",
        en: "Got it. It states 25 millimeters plus or minus 0.02, right? Also, what about the edge chamfer?",
        vi: "Rõ rồi. Bản vẽ ghi 25 mm cộng trừ 0.02 đúng không? Còn phần vát mép cạnh thì sao ạ?",
      },
      {
        role: "B",
        speakerName: "Kỹ sư thiết kế (David)",
        en: "Correct, 25 plus or minus 0.02. Please apply a 0.5-millimeter chamfer on both ends for safe assembly.",
        vi: "Chính xác, 25 ± 0.02. Hãy vát mép 0.5 mm ở cả hai đầu để lắp ráp an toàn nhé.",
      },
    ],
    roleA: {
      title: "Vai A · Kỹ thuật viên Gia công CNC",
      goal: "Kiểm tra và xác nhận lại toàn bộ kích thước, dung sai và yêu cầu vát mép trước khi chạy máy.",
      tasks: [
        "Hỏi xác nhận phiên bản bản vẽ và vật liệu phôi.",
        "Đọc lại ít nhất 2 thông số có dung sai để đối chiếu.",
        "Đề xuất kiểm tra mẫu đầu tiên (first-article inspection) bằng thước cặp.",
      ],
    },
    roleB: {
      title: "Vai B · Kỹ sư Thiết kế / QC",
      goal: "Giải thích rõ các vị trí dung sai chặt và tiêu chuẩn nghiệm thu sản phẩm.",
      tasks: [
        "Xác nhận phiên bản bản vẽ hợp lệ.",
        "Làm rõ yêu cầu độ nhám bề mặt và vát mép lắp ráp.",
        "Thống nhất số lượng mẫu kiểm tra đầu ca.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "ban-giao-ca-va-kiem-tra-chat-luong-qc",
    title: "Bàn giao ca sản xuất & kiểm tra chất lượng (QC)",
    major: "Cơ khí",
    level: "Cơ bản (A2)",
    summary:
      "Báo cáo số lượng đạt chuẩn, tỷ lệ phế phẩm và các lưu ý bảo dưỡng dao cắt khi bàn giao ca cho đồng nghiệp hoặc tổ trưởng.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Vũ Tiến Anh",
    reviewedByTeacher: "GV chuyên môn Khoa Cơ khí · VSVC",
    sourceAttribution: "Biên soạn dựa trên quy trình bàn giao ca xưởng thực hành VSVC.",
    order: 3,
    vocab: [
      {
        word: "handover",
        phonetic: "/ˈhændˌoʊ.vər/",
        pos: "noun",
        meaning: "bàn giao ca làm việc",
        example: "Let's do a quick shift handover near Line 1.",
      },
      {
        word: "defect rate",
        phonetic: "/ˈdiː.fekt reɪt/",
        pos: "noun",
        meaning: "tỷ lệ lỗi / phế phẩm",
        example: "Our defect rate stayed below one percent today.",
      },
      {
        word: "cutting tool",
        phonetic: "/ˈkʌt.ɪŋ tuːl/",
        pos: "noun",
        meaning: "dao cắt gia công",
        example: "The cutting tool was replaced at 2 PM.",
      },
      {
        word: "inspect",
        phonetic: "/ɪnˈspekt/",
        pos: "verb",
        meaning: "kiểm tra, thanh tra",
        example: "Please inspect every tenth piece for scratches.",
      },
    ],
    phrases: [
      {
        en: "During this shift, we completed 180 units with only 2 defects.",
        vi: "Trong ca này, chúng tôi hoàn thành 180 sản phẩm và chỉ có 2 lỗi.",
        context: "Báo cáo sản lượng và chất lượng đầu buổi bàn giao.",
      },
      {
        en: "Please keep an eye on the coolant level after 10 PM.",
        vi: "Nhớ để ý mực dung dịch làm mát sau 10 giờ tối nhé.",
        context: "Nhắc lưu ý bảo trì cho ca sau.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Trưởng ca sáng",
        en: "Hi Minh, ready for the shift handover? We completed 180 brackets with 2 rejected parts.",
        vi: "Chào Minh, sẵn sàng bàn giao ca chưa? Ca sáng xong 180 chi tiết, chỉ loại 2 chiếc lỗi.",
      },
      {
        role: "B",
        speakerName: "Trưởng ca chiều",
        en: "Got it. What caused the 2 defects, and did you change the cutting insert?",
        vi: "Mình nắm rồi. Hai chiếc lỗi do đâu vậy, và bạn đã thay mảnh dao cắt chưa?",
      },
      {
        role: "A",
        speakerName: "Trưởng ca sáng",
        en: "Minor surface scratches from a worn insert. I already installed a fresh cutting tool at 1:30 PM.",
        vi: "Bị xước nhẹ bề mặt do dao mòn. Mình đã thay dao mới lúc 1 giờ 30 chiều rồi.",
      },
      {
        role: "B",
        speakerName: "Trưởng ca chiều",
        en: "Great, I will monitor the coolant level and inspect every tenth piece.",
        vi: "Tuyệt, ca chiều mình sẽ theo dõi nước làm mát và kiểm tra mỗi 10 sản phẩm.",
      },
    ],
    roleA: {
      title: "Vai A · Người giao ca",
      goal: "Bàn giao đầy đủ số lượng đạt, số lượng lỗi, tình trạng dao cắt và vật tư còn lại.",
      tasks: [
        "Báo cáo tổng sản lượng và số sản phẩm không đạt.",
        "Nêu nguyên nhân lỗi và các thay đổi thiết bị đã làm.",
        "Dặn dò 1 điểm cần theo dõi ở ca tiếp theo.",
      ],
    },
    roleB: {
      title: "Vai B · Người nhận ca",
      goal: "Hỏi xác nhận các vấn đề còn tồn đọng để vận hành ca mới an toàn và ổn định.",
      tasks: [
        "Xác nhận số liệu và hỏi nguyên nhân hàng lỗi.",
        "Kiểm tra trạng thái dao cắt, dầu làm mát hoặc máy đo.",
        "Cam kết tần suất kiểm tra QC trong ca.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "phong-van-ky-thuat-vien-co-khi",
    title: "Phỏng vấn thực tập & tuyển dụng Kỹ thuật viên Cơ khí",
    major: "Cơ khí",
    level: "Trung bình (B1)",
    summary:
      "Luyện trả lời phỏng vấn bằng tiếng Anh về kinh nghiệm thực hành xưởng, nguyên tắc an toàn lao động và cách xử lý khi máy gặp lỗi.",
    durationMinutes: 20,
    isFree: false,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV hướng dẫn Nguyễn Xuân Tùng · VSVC",
    sourceAttribution: "Biên soạn theo bộ câu hỏi phỏng vấn doanh nghiệp tuyển dụng SV CĐ nghề.",
    order: 4,
    vocab: [
      {
        word: "safety gear",
        phonetic: "/ˈseɪf.ti ɡɪr/",
        pos: "noun",
        meaning: "đồ bảo hộ lao động (PPE)",
        example: "I always wear proper safety gear before entering the workshop.",
      },
      {
        word: "preventive maintenance",
        phonetic: "/prɪˈven.tɪv ˈmeɪn.tən.əns/",
        pos: "noun",
        meaning: "bảo trì phòng ngừa",
        example: "Preventive maintenance helps reduce unexpected breakdowns.",
      },
      {
        word: "hands-on experience",
        phonetic: "/ˌhændzˈɑːn ɪkˈspɪr.i.əns/",
        pos: "noun",
        meaning: "kinh nghiệm thực hành trực tiếp",
        example: "I gained hands-on experience with milling and lathe machines at college.",
      },
    ],
    phrases: [
      {
        en: "During my vocational training, I practiced operating both manual lathes and CNC machines.",
        vi: "Trong quá trình học nghề, tôi đã thực hành vận hành cả máy tiện cơ và máy CNC.",
        context: "Giới thiệu năng lực thực hành khi phỏng vấn.",
      },
      {
        en: "When I spot an abnormal noise, I press the emergency stop and notify my supervisor.",
        vi: "Khi nghe thấy tiếng ồn bất thường, tôi bấm nút dừng khẩn cấp và báo cho giám sát.",
        context: "Trả lời câu hỏi tình huống về an toàn xưởng.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Nhà tuyển dụng",
        en: "Welcome! Can you tell me briefly about your hands-on experience in mechanical workshops?",
        vi: "Chào bạn! Bạn có thể chia sẻ ngắn gọn về kinh nghiệm thực hành xưởng cơ khí của mình không?",
      },
      {
        role: "B",
        speakerName: "Ứng viên",
        en: "Certainly. At Vietnam-Singapore Vocational College, I practiced reading blueprints, operating lathes, and checking tolerances with calipers.",
        vi: "Dạ vâng. Tại Trường CĐ nghề Việt Nam - Singapore, em đã thực hành đọc bản vẽ, vận hành máy tiện và kiểm tra dung sai bằng thước cặp.",
      },
      {
        role: "A",
        speakerName: "Nhà tuyển dụng",
        en: "What would you do first if a machine makes a loud knocking sound during a cycle?",
        vi: "Bạn sẽ làm gì đầu tiên nếu máy phát ra tiếng gõ lớn khi đang chạy chu trình?",
      },
      {
        role: "B",
        speakerName: "Ứng viên",
        en: "First, I would hit the emergency stop button to ensure safety, turn off the power if needed, and immediately inform the shift leader.",
        vi: "Đầu tiên, em sẽ nhấn nút dừng khẩn cấp để đảm bảo an toàn, ngắt nguồn nếu cần và báo ngay cho trưởng ca.",
      },
    ],
    roleA: {
      title: "Vai A · Nhà tuyển dụng / Kỹ sư trưởng",
      goal: "Đánh giá kỹ năng thực hành, nhận thức an toàn và khả năng giao tiếp tiếng Anh nghề của ứng viên.",
      tasks: [
        "Hỏi về quá trình học và máy móc ứng viên từng thao tác.",
        "Đặt 1 câu hỏi tình huống xử lý sự cố hoặc an toàn lao động.",
        "Cho ứng viên cơ hội hỏi lại về môi trường làm việc.",
      ],
    },
    roleB: {
      title: "Vai B · Ứng viên Kỹ thuật viên",
      goal: "Trình bày tự tin kinh nghiệm thực hành xưởng và tư duy tuân thủ an toàn.",
      tasks: [
        "Giới thiệu ngành học và ít nhất 2 kỹ năng thực hành cụ thể.",
        "Trả lời rõ ràng quy trình xử lý sự cố theo ưu tiên an toàn.",
        "Đặt 1 câu hỏi thông minh về đào tạo hội nhập hoặc ca làm việc.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },

  // =========================================================================
  // ĐIỆN - ĐIỆN TỬ (4 tình huống)
  // =========================================================================
  {
    slug: "kiem-tra-mach-va-bao-loi-thiet-bi-dien",
    title: "Kiểm tra mạch điều khiển & báo lỗi thiết bị điện",
    major: "Điện - Điện tử",
    level: "Cơ bản (A2)",
    summary:
      "Đo kiểm điện áp, phát hiện lỗi rơ-le nhiệt / quá tải cầu dao và báo cáo thông số đo cho kỹ sư phụ trách.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Võ Gia Như",
    reviewedByTeacher: "GV chuyên môn Khoa Điện - Điện tử · VSVC",
    sourceAttribution: "Biên soạn từ bài thực hành đo lường & sửa chữa mạch điện VSVC.",
    order: 5,
    vocab: [
      {
        word: "multimeter",
        phonetic: "/ˌmʌl.tiˈmiː.tər/",
        pos: "noun",
        meaning: "đồng hồ vạn năng",
        example: "Use a multimeter to measure the output voltage.",
      },
      {
        word: "circuit breaker",
        phonetic: "/ˈsɜːr.kɪt ˈbreɪ.kər/",
        pos: "noun",
        meaning: "cầu dao tự động (CB / aptomat)",
        example: "The main circuit breaker tripped twice this morning.",
      },
      {
        word: "overload relay",
        phonetic: "/ˌoʊ.vərˈloʊd ˈriː.leɪ/",
        pos: "noun",
        meaning: "rơ-le nhiệt quá tải",
        example: "Check if the overload relay needs resetting.",
      },
      {
        word: "short circuit",
        phonetic: "/ʃɔːrt ˈsɜːr.kɪt/",
        pos: "noun",
        meaning: "ngắn mạch, chập mạch",
        example: "Damaged insulation can cause a short circuit.",
      },
      {
        word: "grounding",
        phonetic: "/ˈɡraʊn.dɪŋ/",
        pos: "noun",
        meaning: "tiếp địa, nối đất an toàn",
        example: "Verify proper grounding before powering up the panel.",
      },
    ],
    phrases: [
      {
        en: "The circuit breaker tripped due to an overload on Phase B.",
        vi: "Aptomat bị nhảy do quá tải ở Pha B.",
        context: "Báo cáo nguyên nhân ngắt mạch chính xác.",
      },
      {
        en: "I measured 220 volts at the input terminal, but zero volts at the motor.",
        vi: "Tôi đo được 220 vôn ở đầu vào, nhưng 0 vôn ở động cơ.",
        context: "Trình bày kết quả đo đồng hồ vạn năng để khoanh vùng lỗi.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Kỹ thuật viên Điện",
        en: "Hi Kevin, the conveyor motor stopped because the circuit breaker tripped again.",
        vi: "Chào Kevin, động cơ băng tải dừng vì aptomat vừa nhảy lại rồi.",
      },
      {
        role: "B",
        speakerName: "Kỹ sư trưởng",
        en: "Did you check the voltage with your multimeter after locking out the power?",
        vi: "Bạn đã khóa nguồn an toàn và đo lại điện áp bằng đồng hồ vạn năng chưa?",
      },
      {
        role: "A",
        speakerName: "Kỹ thuật viên Điện",
        en: "Yes, the input terminal reads 380 volts across all three phases, and there is no short circuit.",
        vi: "Rồi ạ, đầu vào đủ 380 vôn cả 3 pha, và không bị ngắn mạch.",
      },
      {
        role: "B",
        speakerName: "Kỹ sư trưởng",
        en: "Good. Check the overload relay and inspect the motor current once we restart.",
        vi: "Tốt. Hãy kiểm tra rơ-le quá tải và theo dõi dòng động cơ khi khởi động lại nhé.",
      },
    ],
    roleA: {
      title: "Vai A · Kỹ thuật viên Bảo trì Điện",
      goal: "Báo cáo tình trạng nhảy CB, trình bày kết quả đo điện áp/điện trở và xác nhận không có chập mạch.",
      tasks: [
        "Mô tả hiện tượng thiết bị ngừng hoạt động.",
        "Đọc rõ thông số đo được (Volt / Ampere / Ohm) bằng đồng hồ vạn năng.",
        "Xác nhận đã kiểm tra tiếp địa trước khi đóng điện lại.",
      ],
    },
    roleB: {
      title: "Vai B · Kỹ sư Giám sát Điện",
      goal: "Hướng dẫn khoanh vùng điểm đứt mạch và nhắc quy trình an toàn trước khi cấp nguồn.",
      tasks: [
        "Hỏi xác nhận đã cô lập nguồn điện trước khi đo kiểm chưa.",
        "Yêu cầu đọc thông số 3 pha hoặc rơ-le nhiệt.",
        "Quyết định cho phép reset hoặc thay linh kiện.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "quy-trinh-an-toan-tu-dien-loto",
    title: "Hướng dẫn vận hành & quy trình khóa an toàn tủ điện (LOTO)",
    major: "Điện - Điện tử",
    level: "Trung bình (B1)",
    summary:
      "Giải thích và kiểm tra chéo các bước Lockout/Tagout (khóa và gắn thẻ cảnh báo) trước khi bảo trì tủ điện công nghiệp.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Võ Gia Như",
    reviewedByTeacher: "GV chuyên môn Khoa Điện - Điện tử · VSVC",
    sourceAttribution: "Biên soạn từ tài liệu An toàn điện công nghiệp VSVC.",
    order: 6,
    vocab: [
      {
        word: "lockout / tagout",
        phonetic: "/ˈlɑːk.aʊt ˈtæɡ.aʊt/",
        pos: "noun",
        meaning: "quy trình khóa nguồn và gắn thẻ cảnh báo (LOTO)",
        example: "Never skip lockout/tagout when servicing high-voltage cabinets.",
      },
      {
        word: "control cabinet",
        phonetic: "/kənˈtroʊl ˈkæb.ɪ.nət/",
        pos: "noun",
        meaning: "tủ điện điều khiển",
        example: "Lock the main switch inside the control cabinet.",
      },
      {
        word: "insulated gloves",
        phonetic: "/ˈɪn.sjə.leɪ.tɪd ɡlʌvz/",
        pos: "noun",
        meaning: "găng tay cách điện",
        example: "Put on insulated gloves rated for 1,000 volts.",
      },
    ],
    phrases: [
      {
        en: "Before opening the control cabinet, make sure the main isolator is switched off and locked.",
        vi: "Trước khi mở tủ điều khiển, hãy đảm bảo cầu dao tổng đã tắt và được khóa lại.",
        context: "Nhắc bước an toàn bắt buộc trước khi thao tác.",
      },
      {
        en: "Verify zero energy with a voltage tester before touching any terminals.",
        vi: "Kiểm tra không còn điện bằng bút thử/máy đo trước khi chạm vào các cực nối.",
        context: "Bước kiểm tra không điện (Test before touch).",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Kỹ thuật viên hướng dẫn",
        en: "Before we open Control Cabinet B, can you walk me through our lockout/tagout steps?",
        vi: "Trước khi mở Tủ điều khiển B, bạn nhắc lại giúp mình các bước khóa và gắn thẻ LOTO nhé?",
      },
      {
        role: "B",
        speakerName: "Học viên thực tập",
        en: "Sure. First, I switch off the main breaker, attach my personal padlock, and place the warning tag.",
        vi: "Dạ vâng. Đầu tiên em tắt aptomat tổng, móc khóa cá nhân của mình và gắn thẻ cảnh báo.",
      },
      {
        role: "A",
        speakerName: "Kỹ thuật viên hướng dẫn",
        en: "Great. What is the critical step right after attaching the lock and tag?",
        vi: "Chuẩn rồi. Bước tối quan trọng ngay sau khi khóa và gắn thẻ là gì?",
      },
      {
        role: "B",
        speakerName: "Học viên thực tập",
        en: "I wear insulated gloves and test all terminals with a multimeter to verify zero voltage.",
        vi: "Em đeo găng tay cách điện và đo kiểm tất cả các cực bằng đồng hồ vạn năng để xác nhận điện áp bằng 0.",
      },
    ],
    roleA: {
      title: "Vai A · Giám sát An toàn Điện",
      goal: "Kiểm tra xem đồng nghiệp mới có nắm chắc trình tự LOTO và PPE không.",
      tasks: [
        "Hỏi 3 bước chính của quy trình LOTO.",
        "Kiểm tra trang bị bảo hộ (găng tay cách điện, giày cách điện).",
        "Xác nhận người giữ chìa khóa cá nhân.",
      ],
    },
    roleB: {
      title: "Vai B · Kỹ thuật viên Thực tập",
      goal: "Trình bày chính xác từng bước ngắt nguồn, khóa thẻ và kiểm tra không điện.",
      tasks: [
        "Nêu rõ trình tự: Tắt tải -> Ngắt cầu dao -> Khóa & Gắn thẻ -> Đo kiểm không điện.",
        "Nêu đúng đồ bảo hộ sử dụng.",
        "Hỏi lại vị trí tiếp địa hoặc sơ đồ tủ nếu cần.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "doc-datasheet-va-thay-the-linh-kien-dien-tu",
    title: "Đọc hiểu datasheet linh kiện & đề xuất thay thế cảm biến/tụ điện",
    major: "Điện - Điện tử",
    level: "Khá (B2)",
    summary:
      "So sánh thông số kỹ thuật từ datasheet (điện áp định mức, dải nhiệt độ, chân kết nối pinout) khi linh kiện cũ ngừng sản xuất.",
    durationMinutes: 15,
    isFree: false,
    isClosedBeta: true,
    authorName: "Võ Gia Như",
    reviewedByTeacher: "GV chuyên môn Khoa Điện - Điện tử · VSVC",
    sourceAttribution: "Biên soạn từ giáo trình Linh kiện điện tử & Mạch ứng dụng.",
    order: 7,
    vocab: [
      {
        word: "rated voltage",
        phonetic: "/ˈreɪ.tɪd ˈvoʊl.tɪdʒ/",
        pos: "noun",
        meaning: "điện áp định mức",
        example: "Never exceed the capacitor's rated voltage of 25 volts.",
      },
      {
        word: "pinout",
        phonetic: "/ˈpɪn.aʊt/",
        pos: "noun",
        meaning: "sơ đồ chân linh kiện",
        example: "Check the pinout diagram carefully before soldering.",
      },
      {
        word: "compatible",
        phonetic: "/kəmˈpæt.ə.bəl/",
        pos: "adjective",
        meaning: "tương thích, thay thế được",
        example: "This 24V proximity sensor is fully compatible with our PLC input.",
      },
    ],
    phrases: [
      {
        en: "The original model is out of stock, so I found a compatible replacement.",
        vi: "Mã gốc đã hết hàng, nên tôi đã tìm một linh kiện thay thế tương thích.",
        context: "Đề xuất linh kiện thay thế với quản lý.",
      },
      {
        en: "Both share the same 24-volt DC supply and NPN output pinout.",
        vi: "Cả hai đều dùng nguồn 24V DC và sơ đồ chân ngõ ra NPN giống nhau.",
        context: "Chứng minh sự tương thích kỹ thuật từ datasheet.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Kỹ thuật viên Điện tử",
        en: "Ms. Linh, the original optical sensor is discontinued. I checked the datasheet and found a compatible alternative.",
        vi: "Chị Linh ơi, cảm biến quang mã cũ đã ngừng sản xuất. Em xem datasheet và tìm được mã thay thế tương thích rồi.",
      },
      {
        role: "B",
        speakerName: "Trưởng nhóm R&D",
        en: "Nice work. Does it match our 24V DC rated voltage and NPN output requirement?",
        vi: "Tốt lắm. Nó có khớp mức điện áp 24V DC và ngõ ra NPN bên mình yêu cầu không?",
      },
      {
        role: "A",
        speakerName: "Kỹ thuật viên Điện tử",
        en: "Yes, both the rated voltage and the 3-pin M12 pinout are identical, and its operating temperature reaches 70 degrees Celsius.",
        vi: "Dạ có, cả điện áp định mức lẫn sơ đồ 3 chân M12 đều giống hệt, và dải nhiệt hoạt động lên tới 70 độ C.",
      },
    ],
    roleA: {
      title: "Vai A · Kỹ thuật viên Phần cứng",
      goal: "Chứng minh linh kiện đề xuất đạt chuẩn thông số để thay thế an toàn.",
      tasks: [
        "Nêu lý do cần linh kiện thay thế.",
        "Đối chiếu 3 thông số từ datasheet (điện áp, sơ đồ chân, nhiệt độ/tín hiệu).",
        "Đề xuất đặt mẫu thử nghiệm 2 chiếc trước khi mua lô lớn.",
      ],
    },
    roleB: {
      title: "Vai B · Kỹ sư R&D / Mua hàng kỹ thuật",
      goal: "Kiểm tra chéo khả năng tương thích và thời gian giao hàng.",
      tasks: [
        "Hỏi cụ thể về điện áp định mức và loại ngõ ra (NPN/PNP).",
        "Kiểm tra kích thước lắp đặt cơ khí và thời gian đặt hàng.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "phong-van-ky-thuat-vien-bao-tri-dien",
    title: "Phỏng vấn Kỹ thuật viên Bảo trì Điện - Tự động hóa",
    major: "Điện - Điện tử",
    level: "Trung bình (B1)",
    summary:
      "Trả lời phỏng vấn về kỹ năng đọc sơ đồ mạch điện, đấu nối tủ PLC cơ bản và xử lý lỗi cảm biến trên dây chuyền.",
    durationMinutes: 20,
    isFree: true,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV chuyên môn Khoa Điện - Điện tử · VSVC",
    sourceAttribution: "Biên soạn từ câu hỏi tuyển dụng thực tế các khu công nghiệp VSIP.",
    order: 8,
    vocab: [
      {
        word: "wiring diagram",
        phonetic: "/ˈwaɪr.ɪŋ ˈdaɪ.ə.ɡræm/",
        pos: "noun",
        meaning: "sơ đồ đấu dây",
        example: "I can read industrial wiring diagrams and troubleshoot relay panels.",
      },
      {
        word: "troubleshoot",
        phonetic: "/ˈtrʌb.əl.ʃuːt/",
        pos: "verb",
        meaning: "tìm và khắc phục sự cố",
        example: "We troubleshoot PLC input errors step by step.",
      },
    ],
    phrases: [
      {
        en: "I am comfortable reading wiring diagrams and using a multimeter to isolate faults.",
        vi: "Tôi thành thạo đọc sơ đồ đấu dây và dùng đồng hồ vạn năng để khoanh vùng lỗi.",
        context: "Khẳng định điểm mạnh chuyên môn khi phỏng vấn.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Quản lý Bảo trì",
        en: "How would you troubleshoot a conveyor that refuses to start when the green button is pressed?",
        vi: "Bạn sẽ tìm lỗi thế nào nếu băng tải không chạy khi nhấn nút xanh?",
      },
      {
        role: "B",
        speakerName: "Ứng viên",
        en: "I would follow the wiring diagram: first check the power indicator and emergency stop button, then test the start pushbutton and contactor coil with a multimeter.",
        vi: "Em sẽ theo sơ đồ đấu dây: trước tiên kiểm tra đèn nguồn và nút dừng khẩn cấp, sau đó đo kiểm nút nhấn chạy và cuộn hút contactor bằng đồng hồ vạn năng.",
      },
    ],
    roleA: {
      title: "Vai A · Quản lý Bảo trì",
      goal: "Đánh giá tư duy logic tìm lỗi điện và thái độ tuân thủ an toàn.",
      tasks: [
        "Hỏi kinh nghiệm đọc sơ đồ mạch / PLC ở trường.",
        "Đưa ra tình huống băng tải không chạy và xem cách ứng viên khoanh vùng.",
      ],
    },
    roleB: {
      title: "Vai B · Ứng viên Bảo trì Điện",
      goal: "Trả lời mạch lạc theo từng bước kiểm tra từ nguồn đến tải.",
      tasks: [
        "Nhấn mạnh thói quen kiểm tra an toàn trước khi đo.",
        "Nêu trình tự kiểm tra logic (Nguồn -> Nút dừng khẩn -> Rơ-le/Contactor -> Động cơ).",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },

  // =========================================================================
  // TIN HỌC / CNTT (4 tình huống)
  // =========================================================================
  {
    slug: "daily-standup-va-bao-cao-tien-do-bug-it",
    title: "Họp Daily Stand-up & báo cáo tiến độ / bug với team quốc tế",
    major: "Tin học",
    level: "Cơ bản (A2)",
    summary:
      "Tình huống giao tiếp phổ biến nhất ngành CNTT: báo cáo 3 ý trong buổi họp sáng (hôm qua làm gì, hôm nay làm gì, đang gặp blocker gì).",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV chuyên môn Khoa Tin học đại cương · VSVC",
    sourceAttribution: "Biên soạn theo quy trình Agile/Scrum thực tế tại doanh nghiệp phần mềm.",
    order: 9,
    vocab: [
      {
        word: "blocker",
        phonetic: "/ˈblɑː.kər/",
        pos: "noun",
        meaning: "vướng mắc làm chậm tiến độ công việc",
        example: "My main blocker right now is missing API credentials.",
      },
      {
        word: "reproduce",
        phonetic: "/ˌriː.prəˈduːs/",
        pos: "verb",
        meaning: "tái hiện lại lỗi (bug)",
        example: "I can reproduce the login bug on mobile Safari.",
      },
      {
        word: "pull request",
        phonetic: "/pʊl rɪˈkwest/",
        pos: "noun",
        meaning: "yêu cầu gộp mã nguồn (PR)",
        example: "I submitted a pull request for the dashboard filter.",
      },
      {
        word: "deploy",
        phonetic: "/dɪˈplɔɪ/",
        pos: "verb",
        meaning: "triển khai phần mềm lên môi trường chạy",
        example: "We plan to deploy the patch to staging this afternoon.",
      },
    ],
    phrases: [
      {
        en: "Yesterday I finished the login validation and opened a pull request.",
        vi: "Hôm qua tôi đã xong phần kiểm tra đăng nhập và tạo pull request.",
        context: "Báo cáo phần việc đã hoàn thành.",
      },
      {
        en: "Today I will work on fixing the pagination bug on mobile.",
        vi: "Hôm nay tôi sẽ xử lý lỗi phân trang trên điện thoại.",
        context: "Báo cáo kế hoạch trong ngày.",
      },
      {
        en: "I am currently blocked by a 500 error from the staging API.",
        vi: "Hiện tại tôi đang bị vướng lỗi 500 từ API môi trường staging.",
        context: "Nêu rõ blocker để được hỗ trợ ngay.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Tech Lead (Alex)",
        en: "Morning Loc, it's your turn for the stand-up update. How is the student profile module going?",
        vi: "Chào Lộc, tới lượt bạn cập nhật stand-up nhé. Module hồ sơ sinh viên tiến triển sao rồi?",
      },
      {
        role: "B",
        speakerName: "Developer (Lộc)",
        en: "Morning everyone. Yesterday I completed the profile form validation and submitted a pull request.",
        vi: "Chào mọi người. Hôm qua mình đã làm xong phần kiểm tra biểu mẫu hồ sơ và gửi pull request.",
      },
      {
        role: "B",
        speakerName: "Developer (Lộc)",
        en: "Today I will add unit tests for age-group filtering. I have one small blocker: I need test access to the staging database.",
        vi: "Hôm nay mình sẽ viết unit test cho bộ lọc nhóm tuổi. Có một vướng mắc nhỏ là mình cần quyền truy cập dữ liệu mẫu trên staging.",
      },
      {
        role: "A",
        speakerName: "Tech Lead (Alex)",
        en: "Got it. I will grant your staging read-only role right after this call and review your PR by noon.",
        vi: "Đã rõ. Mình sẽ cấp quyền đọc staging ngay sau cuộc gọi này và duyệt PR của bạn trước trưa nhé.",
      },
    ],
    roleA: {
      title: "Vai A · Tech Lead / Scrum Master",
      goal: "Điều phối buổi stand-up ngắn gọn, nắm bắt tiến độ và tháo gỡ blocker cho thành viên.",
      tasks: [
        "Mời thành viên cập nhật ngắn gọn trong 1–2 phút.",
        "Hỏi chi tiết hơn về blocker để biết cần phối hợp với ai.",
        "Chốt hướng xử lý và thời gian review code.",
      ],
    },
    roleB: {
      title: "Vai B · Lập trình viên / Thực tập sinh IT",
      goal: "Báo cáo mạch lạc theo cấu trúc Hôm qua - Hôm nay - Blocker bằng thuật ngữ CNTT chính xác.",
      tasks: [
        "Nêu rõ tính năng đã xong và trạng thái PR/test.",
        "Nêu kế hoạch công việc hôm nay.",
        "Nêu rõ vấn đề đang vướng mắc (nếu không có thì nói 'No blockers').",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "ho-tro-ky-thuat-it-helpdesk-troubleshoot",
    title: "Hỗ trợ kỹ thuật IT Helpdesk & xử lý sự cố mạng qua cuộc gọi",
    major: "Tin học",
    level: "Cơ bản (A2)",
    summary:
      "Hướng dẫn người dùng hoặc đồng nghiệp nước ngoài từng bước kiểm tra kết nối Wi-Fi, VPN, xóa cache và ghi nhận ticket sự cố.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV chuyên môn Khoa Tin học đại cương · VSVC",
    sourceAttribution: "Biên soạn dựa trên kịch bản thực hành Hỗ trợ kỹ thuật CNTT VSVC.",
    order: 10,
    vocab: [
      {
        word: "clear browser cache",
        phonetic: "/klɪr ˈbraʊ.zər kæʃ/",
        pos: "verb phrase",
        meaning: "xóa bộ nhớ đệm trình duyệt",
        example: "Please clear your browser cache and reload the portal.",
      },
      {
        word: "error message",
        phonetic: "/ˈer.ər ˈmes.ɪdʒ/",
        pos: "noun",
        meaning: "thông báo lỗi",
        example: "Could you read the exact error message on your screen?",
      },
      {
        word: "remote desktop",
        phonetic: "/rɪˈmoʊt ˈdesk.tɑːp/",
        pos: "noun",
        meaning: "điều khiển máy tính từ xa",
        example: "May I connect via remote desktop to inspect the driver?",
      },
    ],
    phrases: [
      {
        en: "Could you tell me what error message appears on your screen?",
        vi: "Bạn có thể đọc giúp tôi thông báo lỗi xuất hiện trên màn hình không?",
        context: "Thu thập thông tin lỗi trước khi hướng dẫn thao tác.",
      },
      {
        en: "Let's try disconnecting and reconnecting to the company VPN.",
        vi: "Hãy thử ngắt kết nối và kết nối lại VPN công ty xem sao.",
        context: "Đưa ra bước kiểm tra đơn giản theo thứ tự.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "IT Support",
        en: "IT Helpdesk speaking, this is Nhut. How can I help you today?",
        vi: "Bộ phận IT Helpdesk xin nghe, tôi là Nhựt. Tôi có thể hỗ trợ gì cho bạn hôm nay?",
      },
      {
        role: "B",
        speakerName: "Nhân viên nước ngoài",
        en: "Hi Nhut, I cannot access the shared drive since this morning. It says 'Network path not found'.",
        vi: "Chào Nhựt, từ sáng nay tôi không vào được ổ đĩa dùng chung. Máy báo lỗi 'Không tìm thấy đường dẫn mạng'.",
      },
      {
        role: "A",
        speakerName: "IT Support",
        en: "I see. Are you working remotely, and is your VPN icon showing as connected?",
        vi: "Mình hiểu rồi. Bạn đang làm việc từ xa và biểu tượng VPN có đang hiển thị đã kết nối không?",
      },
      {
        role: "B",
        speakerName: "Nhân viên nước ngoài",
        en: "Oh, the VPN disconnected after my laptop restarted! Let me reconnect and test again.",
        vi: "Ồ, VPN bị ngắt sau khi laptop mình khởi động lại! Để mình kết nối lại rồi thử xem.",
      },
    ],
    roleA: {
      title: "Vai A · Nhân viên IT Helpdesk",
      goal: "Giữ thái độ bình tĩnh, đặt câu hỏi khoanh vùng và hướng dẫn từng bước dễ hiểu cho người không chuyên.",
      tasks: [
        "Chào hỏi chuyên nghiệp và hỏi chính xác thông báo lỗi.",
        "Hỏi 2 câu kiểm tra nhanh (kết nối mạng/VPN, đã khởi động lại chưa).",
        "Xác nhận sự cố đã giải quyết và đóng ticket.",
      ],
    },
    roleB: {
      title: "Vai B · Nhân viên gặp sự cố máy tính",
      goal: "Mô tả rõ triệu chứng lỗi và thực hiện theo hướng dẫn của IT.",
      tasks: [
        "Mô tả chính xác phần mềm/tính năng bị lỗi và thời điểm bắt đầu.",
        "Thực hiện từng bước IT yêu cầu và phản hồi kết quả.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "giai-thich-api-va-demo-tinh-nang-cho-khach-hang",
    title: "Demo tính năng sản phẩm & giải thích luồng API cho khách hàng",
    major: "Tin học",
    level: "Khá (B2)",
    summary:
      "Trình bày cách tính năng hoạt động, thời gian phản hồi, bảo mật dữ liệu tối thiểu và tiếp nhận góp ý chỉnh sửa giao diện.",
    durationMinutes: 15,
    isFree: false,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV chuyên môn Khoa Tin học · VSVC",
    sourceAttribution: "Biên soạn từ quy trình nghiệm thu phần mềm Sprint Review.",
    order: 11,
    vocab: [
      {
        word: "endpoint",
        phonetic: "/ˈend.pɔɪnt/",
        pos: "noun",
        meaning: "điểm cuối API",
        example: "This API endpoint validates user permissions before saving.",
      },
      {
        word: "latency",
        phonetic: "/ˈleɪ.tən.si/",
        pos: "noun",
        meaning: "độ trễ phản hồi",
        example: "Response latency stayed under 120 milliseconds.",
      },
      {
        word: "feedback",
        phonetic: "/ˈfiːd.bæk/",
        pos: "noun",
        meaning: "ý kiến phản hồi",
        example: "We appreciate your feedback on the filter layout.",
      },
    ],
    phrases: [
      {
        en: "Let me walk you through how the matching workflow works from the user side.",
        vi: "Để tôi giới thiệu qua cách luồng ghép cặp hoạt động ở phía người dùng.",
        context: "Chuyển sang phần demo màn hình sản phẩm.",
      },
      {
        en: "We enforce age-group isolation directly on the backend API before returning results.",
        vi: "Chúng tôi áp dụng tách biệt nhóm tuổi trực tiếp ở tầng API máy chủ trước khi trả kết quả.",
        context: "Giải thích cơ chế bảo mật phía backend cho khách hàng.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Lập trình viên Demo",
        en: "Today I will walk you through our new peer-pairing API and safety guardrails.",
        vi: "Hôm nay tôi sẽ trình bày qua API ghép cặp mới và các lớp bảo vệ an toàn.",
      },
      {
        role: "B",
        speakerName: "Khách hàng / Product Owner",
        en: "Sounds great. How does the system prevent adults from pairing with students under 18?",
        vi: "Nghe hay đấy. Hệ thống ngăn người trưởng thành ghép cặp với học sinh dưới 18 tuổi bằng cách nào?",
      },
      {
        role: "A",
        speakerName: "Lập trình viên Demo",
        en: "Our backend endpoint checks the user's verified age group and filters matching pools server-side—not just in the UI.",
        vi: "Endpoint máy chủ kiểm tra nhóm tuổi đã xác nhận và lọc nhóm ghép cặp ngay ở phía server—chứ không chỉ ẩn trên giao diện.",
      },
    ],
    roleA: {
      title: "Vai A · Lập trình viên trình bày Demo",
      goal: "Giải thích dễ hiểu cách hệ thống hoạt động mà không sa đà quá sâu vào code.",
      tasks: [
        "Tóm tắt mục tiêu tính năng trong 30 giây.",
        "Giải thích 1 cơ chế kiểm tra dữ liệu / bảo mật phía API.",
        "Ghi nhận ít nhất 1 yêu cầu chỉnh sửa từ khách hàng.",
      ],
    },
    roleB: {
      title: "Vai B · Product Owner / Khách hàng",
      goal: "Đặt câu hỏi kiểm tra tính thực tế, bảo mật và trải nghiệm người dùng.",
      tasks: [
        "Hỏi về tốc độ tải hoặc xử lý trường hợp ngoại lệ.",
        "Đề xuất 1 cải tiến nhỏ cho giao diện.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "phong-van-thuc-tap-sinh-junior-developer",
    title: "Phỏng vấn Thực tập sinh / Junior Developer bằng tiếng Anh",
    major: "Tin học",
    level: "Trung bình (B1)",
    summary:
      "Giới thiệu dự án web cá nhân (Next.js / Database), giải thích một lỗi từng xử lý và cách phối hợp nhóm bằng Git.",
    durationMinutes: 20,
    isFree: true,
    isClosedBeta: true,
    authorName: "Bùi Tấn Lộc",
    reviewedByTeacher: "GV hướng dẫn Nguyễn Xuân Tùng · VSVC",
    sourceAttribution: "Biên soạn dành cho sinh viên lớp Tin học ứng dụng VSVC.",
    order: 12,
    vocab: [
      {
        word: "tech stack",
        phonetic: "/tek stæk/",
        pos: "noun",
        meaning: "tập hợp công nghệ sử dụng trong dự án",
        example: "Our tech stack includes Next.js, TypeScript, and Prisma.",
      },
      {
        word: "database schema",
        phonetic: "/ˈdeɪ.tə.beɪs ˈskiː.mə/",
        pos: "noun",
        meaning: "lược đồ cơ sở dữ liệu",
        example: "I designed the database schema for user progress tracking.",
      },
    ],
    phrases: [
      {
        en: "In my college startup project, I built the authentication and database API using Next.js and SQLite.",
        vi: "Trong dự án khởi nghiệp ở trường, tôi đã xây dựng phần xác thực và API dữ liệu bằng Next.js và SQLite.",
        context: "Giới thiệu dự án thực tế khi chưa có nhiều kinh nghiệm đi làm.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Interviewer",
        en: "Tell me about a technical challenge you solved in your recent web project.",
        vi: "Hãy kể về một thử thách kỹ thuật bạn đã giải quyết trong dự án web gần đây.",
      },
      {
        role: "B",
        speakerName: "Candidate",
        en: "In our peer-practice web platform, we needed to prevent concurrent users from claiming the same slot twice. I handled this by checking status inside a database update guard.",
        vi: "Ở nền tảng web luyện nói theo cặp, tụi em cần tránh hai người cùng nhận một lịch hẹn. Em đã xử lý bằng điều kiện kiểm tra trạng thái ngay khi cập nhật cơ sở dữ liệu.",
      },
    ],
    roleA: {
      title: "Vai A · Technical Interviewer",
      goal: "Tìm hiểu năng lực lập trình thực tế và tinh thần học hỏi của sinh viên.",
      tasks: [
        "Hỏi về tech stack của dự án gần nhất.",
        "Hỏi cách ứng viên tìm và sửa lỗi khi gặp bug khó.",
      ],
    },
    roleB: {
      title: "Vai B · Ứng viên Junior / Thực tập sinh",
      goal: "Trình bày rõ ràng vai trò bản thân trong dự án, công nghệ đã dùng và bài học rút ra.",
      tasks: [
        "Nêu rõ phần việc bạn trực tiếp viết code.",
        "Kể 1 bug thực tế và cách giải quyết theo mô hình Vấn đề -> Cách làm -> Kết quả.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },

  // =========================================================================
  // KINH TẾ - DU LỊCH / DỊCH VỤ (2 tình huống)
  // =========================================================================
  {
    slug: "tiep-don-va-xu-ly-phan-nan-khach-quoc-te",
    title: "Tiếp nhận & xử lý phàn nàn của khách hàng nước ngoài",
    major: "Kinh tế - Du lịch",
    level: "Cơ bản (A2)",
    summary:
      "Lắng nghe, xin lỗi chân thành, xác nhận phương án đổi phòng/khắc phục dịch vụ và theo dõi sự hài lòng của khách.",
    durationMinutes: 15,
    isFree: true,
    isClosedBeta: true,
    authorName: "Võ Gia Như",
    reviewedByTeacher: "GV chuyên môn Tổ Dịch vụ - Du lịch · VSVC",
    sourceAttribution: "Biên soạn phục vụ khối ngành Dịch vụ - Du lịch và mở rộng N2/N3.",
    order: 13,
    vocab: [
      {
        word: "inconvenience",
        phonetic: "/ˌɪn.kənˈviːn.jəns/",
        pos: "noun",
        meaning: "sự bất tiện",
        example: "We sincerely apologize for the inconvenience caused.",
      },
      {
        word: "complimentary",
        phonetic: "/ˌkɑːm.pləˈmen.t̬ər.i/",
        pos: "adjective",
        meaning: "miễn phí (tặng kèm để tri ân/xin lỗi)",
        example: "We would like to offer a complimentary late check-out.",
      },
    ],
    phrases: [
      {
        en: "I sincerely apologize for the noise issue. Let me arrange a quieter room for you right away.",
        vi: "Tôi thành thật xin lỗi vì sự cố tiếng ồn. Hãy để tôi sắp xếp ngay một phòng yên tĩnh hơn cho quý khách.",
        context: "Xin lỗi và đưa ra giải pháp tức thì.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Khách quốc tế",
        en: "Excuse me, the air conditioner in my room is leaking and making a loud noise.",
        vi: "Xin lỗi, máy lạnh ở phòng tôi đang bị rỉ nước và kêu khá to.",
      },
      {
        role: "B",
        speakerName: "Nhân viên Lễ tân",
        en: "I am truly sorry for the inconvenience, sir. I can upgrade you to a quieter room on the fifth floor right away while our technician fixes that unit.",
        vi: "Em thành thật xin lỗi vì sự bất tiện này ạ. Em có thể chuyển anh lên phòng yên tĩnh hơn ở tầng 5 ngay bây giờ trong lúc kỹ thuật viên sửa máy ạ.",
      },
    ],
    roleA: {
      title: "Vai A · Khách hàng nước ngoài",
      goal: "Trình bày rõ vấn đề dịch vụ đang gặp và kỳ vọng được xử lý nhanh.",
      tasks: [
        "Mô tả vấn đề cụ thể gặp phải.",
        "Hỏi về thời gian giải quyết hoặc phương án thay thế.",
      ],
    },
    roleB: {
      title: "Vai B · Nhân viên Dịch vụ / CSKH",
      goal: "Giữ thái độ điềm tĩnh, thấu cảm và đưa giải pháp cụ thể ngay.",
      tasks: [
        "Xin lỗi lịch sự và lặp lại vấn đề để xác nhận đã hiểu đúng.",
        "Đề xuất giải pháp ngay và thời gian hoàn tất.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
  {
    slug: "xac-nhan-bao-gia-va-tien-do-giao-hang-doi-tac",
    title: "Trao đổi báo giá & xác nhận tiến độ giao hàng với đối tác",
    major: "Kinh tế - Du lịch",
    level: "Trung bình (B1)",
    summary:
      "Thực hành trao đổi đơn giá, điều kiện thanh toán, chiết khấu số lượng và cam kết ngày giao hàng với đối tác nước ngoài.",
    durationMinutes: 15,
    isFree: false,
    isClosedBeta: true,
    authorName: "Vũ Tiến Anh",
    reviewedByTeacher: "GV chuyên môn Tổ Kinh tế · VSVC",
    sourceAttribution: "Biên soạn phục vụ nhóm N2 (Kinh tế) & N3 (Nhân viên văn phòng).",
    order: 14,
    vocab: [
      {
        word: "quotation",
        phonetic: "/kwoʊˈteɪ.ʃən/",
        pos: "noun",
        meaning: "bảng báo giá",
        example: "We will send the updated quotation before 5 PM today.",
      },
      {
        word: "lead time",
        phonetic: "/ˈliːd taɪm/",
        pos: "noun",
        meaning: "thời gian từ khi đặt hàng đến khi giao hàng",
        example: "Our standard production lead time is ten business days.",
      },
    ],
    phrases: [
      {
        en: "If your order exceeds 500 units, we can offer a 5% volume discount.",
        vi: "Nếu đơn hàng vượt 500 sản phẩm, chúng tôi có thể chiết khấu 5% theo số lượng.",
        context: "Thương lượng mức giá linh hoạt theo số lượng.",
      },
    ],
    dialogue: [
      {
        role: "A",
        speakerName: "Điều phối đơn hàng",
        en: "Thank you for reviewing our quotation. Would you like to confirm the delivery schedule for the first 300 units?",
        vi: "Cảm ơn anh đã xem bảng báo giá. Anh có muốn xác nhận lịch giao hàng cho 300 sản phẩm đầu tiên không ạ?",
      },
      {
        role: "B",
        speakerName: "Đối tác mua hàng",
        en: "Yes, we need them by the 25th of this month. Can your team meet that lead time?",
        vi: "Có, bên tôi cần nhận hàng trước ngày 25 tháng này. Đội bạn có đáp ứng kịp thời gian giao hàng đó không?",
      },
    ],
    roleA: {
      title: "Vai A · Nhân viên Kinh doanh / Điều phối",
      goal: "Thuyết phục đối tác chốt đơn với thông tin rõ ràng về giá và thời hạn giao hàng.",
      tasks: [
        "Xác nhận số lượng, đơn giá và điều khoản thanh toán.",
        "Nêu rõ lead time và gửi email xác nhận lại bằng văn bản.",
      ],
    },
    roleB: {
      title: "Vai B · Đối tác mua hàng",
      goal: "Đàm phán thời gian giao hàng và mức chiết khấu hợp lý.",
      tasks: [
        "Yêu cầu thời hạn giao hàng cụ thể.",
        "Đề nghị chiết khấu khi tăng số lượng đơn tiếp theo.",
      ],
    },
    rubric: DEFAULT_PRACTICE_RUBRIC,
  },
];


async function main() {
  console.log("Seeding LingoChill database...");

  // 1. Document Categories & Documents
  const categoryIdBySlug = new Map<string, string>();
  for (const cat of SEED_DOC_CATEGORIES) {
    const savedCat = await prisma.documentCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
      },
      create: cat,
    });
    categoryIdBySlug.set(cat.slug, savedCat.id);
  }

  for (const doc of SEED_DOCUMENTS) {
    const categoryId = categoryIdBySlug.get(doc.categorySlug);
    if (!categoryId) continue;

    await prisma.document.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        description: doc.description,
        categoryId,
        level: doc.level,
        fileType: doc.fileType,
        pageCount: doc.pageCount,
        fileSizeLabel: doc.fileSizeLabel,
        isFree: doc.isFree,
        priceVnd: doc.priceVnd,
        previewContent: doc.previewContent,
        tagsJson: JSON.stringify(doc.tags),
        isFeatured: doc.isFeatured,
      },
      create: {
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        categoryId,
        level: doc.level,
        fileType: doc.fileType,
        pageCount: doc.pageCount,
        fileSizeLabel: doc.fileSizeLabel,
        isFree: doc.isFree,
        priceVnd: doc.priceVnd,
        previewContent: doc.previewContent,
        tagsJson: JSON.stringify(doc.tags),
        viewCount: doc.viewCount,
        downloadCount: doc.downloadCount,
        isFeatured: doc.isFeatured,
      },
    });
  }

  // 2. Grammar Topics & Lessons
  for (const topic of SEED_GRAMMAR_TOPICS) {
    const savedTopic = await prisma.grammarTopic.upsert({
      where: { slug: topic.slug },
      update: {
        title: topic.title,
        description: topic.description,
        targetLevel: topic.targetLevel,
        order: topic.order,
        estimatedMinutes: topic.estimatedMinutes,
      },
      create: {
        slug: topic.slug,
        title: topic.title,
        description: topic.description,
        targetLevel: topic.targetLevel,
        order: topic.order,
        estimatedMinutes: topic.estimatedMinutes,
      },
    });

    for (const lesson of topic.lessons) {
      await prisma.grammarLesson.upsert({
        where: { slug: lesson.slug },
        update: {
          topicId: savedTopic.id,
          title: lesson.title,
          order: lesson.order,
          knowledgeJson: JSON.stringify(lesson.knowledge),
          vocabJson: JSON.stringify(lesson.vocab),
          testsJson: JSON.stringify(lesson.tests),
          summaryJson: JSON.stringify(lesson.summary),
        },
        create: {
          topicId: savedTopic.id,
          slug: lesson.slug,
          title: lesson.title,
          order: lesson.order,
          knowledgeJson: JSON.stringify(lesson.knowledge),
          vocabJson: JSON.stringify(lesson.vocab),
          testsJson: JSON.stringify(lesson.tests),
          summaryJson: JSON.stringify(lesson.summary),
        },
      });
    }
  }

  // 3. Exam Sets, Tests & Questions
  for (const set of SEED_EXAM_SETS) {
    const savedSet = await prisma.examSet.upsert({
      where: { slug: set.slug },
      update: {
        title: set.title,
        badge: set.badge ?? null,
        description: set.description,
        order: set.order,
      },
      create: {
        slug: set.slug,
        title: set.title,
        badge: set.badge ?? null,
        description: set.description,
        order: set.order,
      },
    });

    for (const test of set.tests) {
      const listeningCount = test.questions.filter((q) => q.part <= 4).length;
      const readingCount = test.questions.filter((q) => q.part >= 5).length;

      const savedTest = await prisma.examTest.upsert({
        where: { slug: test.slug },
        update: {
          examSetId: savedSet.id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          totalQuestions: test.questions.length,
          listeningCount,
          readingCount,
          difficulty: test.difficulty,
          isHot: Boolean(test.isHot),
          order: test.order,
        },
        create: {
          examSetId: savedSet.id,
          slug: test.slug,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          totalQuestions: test.questions.length,
          listeningCount,
          readingCount,
          difficulty: test.difficulty,
          isHot: Boolean(test.isHot),
          order: test.order,
        },
      });

      for (const q of test.questions) {
        await prisma.examQuestion.upsert({
          where: {
            examTestId_number: {
              examTestId: savedTest.id,
              number: q.number,
            },
          },
          update: {
            part: q.part,
            groupKey: q.groupKey ?? null,
            promptText: q.promptText,
            passageTitle: q.passageTitle ?? null,
            passageHtml: q.passageHtml ?? null,
            audioScript: q.audioScript ?? null,
            imageScene: q.imageScene ?? null,
            optionsJson: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          },
          create: {
            examTestId: savedTest.id,
            number: q.number,
            part: q.part,
            groupKey: q.groupKey ?? null,
            promptText: q.promptText,
            passageTitle: q.passageTitle ?? null,
            passageHtml: q.passageHtml ?? null,
            audioScript: q.audioScript ?? null,
            imageScene: q.imageScene ?? null,
            optionsJson: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          },
        });
      }
    }
  }

  // 4. Sample Demo Users & Admin Account
  const adminPasswordHash = hashSeedPassword("Admin@123456");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lingochill.local" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@lingochill.local",
      name: "Đoàn Kim Tài",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      xp: 2850,
      streakDays: 30,
      targetScore: 990,
      lastActiveDate: new Date(),
    },
  });

  const minhAnh = await prisma.user.upsert({
    where: { email: "demo@lingochill.local" },
    update: {},
    create: {
      email: "demo@lingochill.local",
      name: "Minh Anh TOEIC",
      xp: 1240,
      streakDays: 7,
      targetScore: 750,
      lastActiveDate: new Date(),
    },
  });

  const thaoVy = await prisma.user.upsert({
    where: { email: "thaovy@lingochill.local" },
    update: {},
    create: {
      email: "thaovy@lingochill.local",
      name: "Thảo Vy",
      xp: 980,
      streakDays: 14,
      targetScore: 850,
      lastActiveDate: new Date(),
    },
  });

  const quocBao = await prisma.user.upsert({
    where: { email: "quocbao@lingochill.local" },
    update: {},
    create: {
      email: "quocbao@lingochill.local",
      name: "Quốc Bảo",
      xp: 760,
      streakDays: 9,
      targetScore: 800,
      lastActiveDate: new Date(),
    },
  });

  // 5. Initial Community Posts & Polls (Idempotent upserts)
  const seedPosts = [
    {
      id: "seed-post-1",
      userId: minhAnh.id,
      group: "Hỏi bài - Giải đáp",
      title: "Câu bẫy giả định thức Part 5 cực hay gặp trong đề quý này!",
      content:
        "The marketing director requested that the final brochure ______ before Friday afternoon so the printing vendor can meet the trade-show deadline.",
      authorBadge: "Top 1 Tuần",
      isPinned: true,
      pollJson: JSON.stringify({
        options: [
          { key: "A", text: "submits", votes: 11 },
          { key: "B", text: "be submitted", votes: 68 },
          { key: "C", text: "submitted", votes: 14 },
          { key: "D", text: "has submitted", votes: 7 },
        ],
        correctKey: "B",
        explanation:
          "Cấu trúc giả định thức (Subjunctive): request that + S + (should) + V_bare. Chủ ngữ 'the final brochure' mang nghĩa bị động nên dùng 'be submitted'.",
      }),
    },
    {
      id: "seed-post-2",
      userId: thaoVy.id,
      group: "Kinh nghiệm học tập",
      title: "Cách mình nâng Listening từ 315 lên 465 sau 5 tuần chép chính tả Part 3-4",
      content:
        "Thay vì giải tràn lan 10 đề/tuần, mỗi tối mình chỉ nghe kỹ 2 đoạn hội thoại Part 3 ở mục Luyện nghe Dictation, ghi lại chỗ hay nuốt âm (going to -> gonna, want to -> wanna) rồi shadowing 5 lần. Kết quả test gần nhất nghe rõ mồn một luôn!",
      authorBadge: "Streak 14 ngày",
      isPinned: false,
      pollJson: null,
    },
    {
      id: "seed-post-3",
      userId: quocBao.id,
      group: "Luyện đề - Thi cử",
      title: "Câu liên từ Part 5 — mọi người chọn đáp án nào?",
      content:
        "______ the new regional warehouse opens next month, shipping times to southern provinces will drop by nearly 40 percent.",
      authorBadge: null,
      isPinned: false,
      pollJson: JSON.stringify({
        options: [
          { key: "A", text: "Once", votes: 54 },
          { key: "B", text: "Despite", votes: 9 },
          { key: "C", text: "Until", votes: 18 },
          { key: "D", text: "Provided", votes: 12 },
        ],
        correctKey: "A",
        explanation:
          "'Once' (một khi / ngay khi) nối hai mệnh đề mang quan hệ điều kiện-thời gian hợp nghĩa nhất. 'Despite' đi với cụm danh từ nên loại ngay.",
      }),
    },
    {
      id: "seed-post-4",
      userId: adminUser.id,
      group: "Luyện nghe & Dictation",
      title: "Checklist 3 bước luyện Dictation không bị nản cho người mới bắt đầu",
      content:
        "Bước 1: Nghe 1 lượt chọn tốc độ 0.8x để nắm đại ý.\nBước 2: Gõ chính tả từng câu, nhìn chữ xanh/đỏ để phát hiện âm cuối (-ed, -s) bị rơi.\nBước 3: Lưu 3 cụm hay sai nhất vào Sổ tay từ vựng để cuối tuần in ra ôn lại.",
      authorBadge: "Admin",
      isPinned: true,
      pollJson: null,
    },
  ];

  for (const post of seedPosts) {
    await prisma.communityPost.upsert({
      where: { id: post.id },
      update: {
        group: post.group,
        title: post.title,
        content: post.content,
        authorBadge: post.authorBadge,
        isPinned: post.isPinned,
        pollJson: post.pollJson,
      },
      create: post,
    });
  }

  await prisma.communityComment.upsert({
    where: { id: "seed-comment-1" },
    update: {},
    create: {
      id: "seed-comment-1",
      postId: "seed-post-1",
      userId: quocBao.id,
      content: "Mấy câu có request/recommend/insist that là auto kiểm tra bị động V_bare luôn ạ!",
    },
  });

  await prisma.communityComment.upsert({
    where: { id: "seed-comment-2" },
    update: {},
    create: {
      id: "seed-comment-2",
      postId: "seed-post-2",
      userId: minhAnh.id,
      content: "Chuẩn luôn, shadowing đều 20 phút mỗi tối hiệu quả hơn nghe thụ động nhiều.",
    },
  });

  // 6. Teacher Invite Codes (VSVC Closed Beta - Phase 0)
  const inviteCodes = [
    {
      code: "VSVC-2026",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Tất cả ngành",
      teacherName: "Nguyễn Xuân Tùng (GV hướng dẫn)",
      maxUses: 500,
    },
    {
      code: "VSVC-TH26",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Tin học",
      teacherName: "GV Khoa Tin học đại cương",
      maxUses: 150,
    },
    {
      code: "VSVC-CK26",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Cơ khí",
      teacherName: "GV Khoa Cơ khí",
      maxUses: 150,
    },
    {
      code: "VSVC-DT26",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Điện - Điện tử",
      teacherName: "GV Khoa Điện - Điện tử",
      maxUses: 150,
    },
    {
      code: "VSVC-DV26",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Kinh tế - Du lịch",
      teacherName: "GV Tổ Kinh tế - Dịch vụ",
      maxUses: 100,
    },
  ];

  for (const inv of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code: inv.code },
      update: {
        school: inv.school,
        major: inv.major,
        teacherName: inv.teacherName,
        maxUses: inv.maxUses,
        isActive: true,
      },
      create: inv,
    });
  }

  // 7. Career Scenarios ("Một tình huống - Ba lớp")
  const scenarioBySlug = new Map<string, string>();
  for (const sc of SEED_CAREER_SCENARIOS) {
    const saved = await prisma.careerScenario.upsert({
      where: { slug: sc.slug },
      update: {
        title: sc.title,
        major: sc.major,
        level: sc.level,
        summary: sc.summary,
        durationMinutes: sc.durationMinutes,
        isFree: sc.isFree,
        isClosedBeta: sc.isClosedBeta,
        vocabJson: JSON.stringify(sc.vocab),
        phrasesJson: JSON.stringify(sc.phrases),
        dialogueJson: JSON.stringify(sc.dialogue),
        roleAJson: JSON.stringify(sc.roleA),
        roleBJson: JSON.stringify(sc.roleB),
        rubricJson: JSON.stringify(sc.rubric),
        authorName: sc.authorName,
        reviewedByTeacher: sc.reviewedByTeacher,
        sourceAttribution: sc.sourceAttribution,
        order: sc.order,
      },
      create: {
        slug: sc.slug,
        title: sc.title,
        major: sc.major,
        level: sc.level,
        summary: sc.summary,
        durationMinutes: sc.durationMinutes,
        isFree: sc.isFree,
        isClosedBeta: sc.isClosedBeta,
        vocabJson: JSON.stringify(sc.vocab),
        phrasesJson: JSON.stringify(sc.phrases),
        dialogueJson: JSON.stringify(sc.dialogue),
        roleAJson: JSON.stringify(sc.roleA),
        roleBJson: JSON.stringify(sc.roleB),
        rubricJson: JSON.stringify(sc.rubric),
        authorName: sc.authorName,
        reviewedByTeacher: sc.reviewedByTeacher,
        sourceAttribution: sc.sourceAttribution,
        order: sc.order,
      },
    });
    scenarioBySlug.set(sc.slug, saved.id);
  }

  // 8. VSVC Startup Team & Closed-Beta Sample Students (Adults + Protected Under-18)
  const vsvcLoc = await prisma.user.upsert({
    where: { email: "builoc.contact@gmail.com" },
    update: {
      role: "ADMIN",
      major: "Tin học",
      studentGroup: "N1",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      selfLevel: "Khá (B2)",
      approvalStatus: "APPROVED",
      inviteCodeUsed: "VSVC-TH26",
    },
    create: {
      email: "builoc.contact@gmail.com",
      name: "Bùi Tấn Lộc",
      role: "ADMIN",
      xp: 1680,
      streakDays: 14,
      targetScore: 800,
      ageGroup: "ADULT_18_PLUS",
      studentGroup: "N1",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Tin học",
      selfLevel: "Khá (B2)",
      availableSlotsJson: JSON.stringify(["Thứ 2 (19:00 - 19:45)", "Thứ 5 (19:30 - 20:15)"]),
      inviteCodeUsed: "VSVC-TH26",
      approvalStatus: "APPROVED",
      betaRulesAcceptedAt: new Date(),
      dataConsentAcceptedAt: new Date(),
      lastActiveDate: new Date(),
    },
  });

  const vsvcNhut = await prisma.user.upsert({
    where: { email: "2520221328@vsvc.edu.vn" },
    update: {
      major: "Cơ khí",
      studentGroup: "N1",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      selfLevel: "Trung bình (B1)",
      approvalStatus: "APPROVED",
    },
    create: {
      email: "2520221328@vsvc.edu.vn",
      name: "Cao Anh Nhựt",
      xp: 940,
      streakDays: 9,
      targetScore: 700,
      ageGroup: "ADULT_18_PLUS",
      studentGroup: "N1",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Cơ khí",
      selfLevel: "Trung bình (B1)",
      availableSlotsJson: JSON.stringify(["Thứ 3 (19:30 - 20:15)", "Thứ 7 (09:00 - 09:45)"]),
      inviteCodeUsed: "VSVC-CK26",
      approvalStatus: "APPROVED",
      betaRulesAcceptedAt: new Date(),
      dataConsentAcceptedAt: new Date(),
      lastActiveDate: new Date(),
    },
  });

  const vsvcMinorStudent = await prisma.user.upsert({
    where: { email: "hssv.duoi18@vsvc.edu.vn" },
    update: {
      ageGroup: "AGE_16_17",
      parentConsentRequired: true,
      parentConsentStatus: "APPROVED",
      parentMonitorCode: "VSVC-PH-DEMO18",
      approvalStatus: "APPROVED",
    },
    create: {
      email: "hssv.duoi18@vsvc.edu.vn",
      name: "Nguyễn Minh Khoa (17 tuổi)",
      xp: 420,
      streakDays: 5,
      targetScore: 550,
      dateOfBirth: new Date("2009-05-12T00:00:00.000Z"),
      ageGroup: "AGE_16_17",
      studentGroup: "N1",
      school: "Trường Cao đẳng nghề Việt Nam - Singapore",
      major: "Điện - Điện tử",
      selfLevel: "Cơ bản (A2)",
      availableSlotsJson: JSON.stringify(["Thứ 4 (19:00 - 19:45)", "Thứ 7 (14:00 - 14:45)"]),
      inviteCodeUsed: "VSVC-DT26",
      approvalStatus: "APPROVED",
      parentConsentRequired: true,
      parentConsentStatus: "APPROVED",
      guardianName: "Nguyễn Văn Hùng (Phụ huynh)",
      guardianRelation: "Cha",
      guardianContact: "phuhuynh.khoa@example.com",
      parentMonitorCode: "VSVC-PH-DEMO18",
      betaRulesAcceptedAt: new Date(),
      dataConsentAcceptedAt: new Date(),
      lastActiveDate: new Date(),
    },
  });

  await prisma.parentConsent.upsert({
    where: { id: "seed-consent-minor-1" },
    update: { status: "APPROVED" },
    create: {
      id: "seed-consent-minor-1",
      userId: vsvcMinorStudent.id,
      studentName: vsvcMinorStudent.name,
      studentAgeGroup: "AGE_16_17",
      guardianName: "Nguyễn Văn Hùng (Phụ huynh)",
      guardianRelation: "Cha",
      guardianPhone: "0909123456",
      guardianEmail: "phuhuynh.khoa@example.com",
      agreedRules: true,
      agreedDataPolicy: true,
      agreedUnder18Protection: true,
      status: "APPROVED",
      reviewedBy: "GV Nguyễn Xuân Tùng",
      reviewedAt: new Date(),
    },
  });

  // 9. Sample Practice Sessions & Rubric Reviews
  const cncScenarioId = scenarioBySlug.get("bao-cao-su-co-thiet-bi-co-khi");
  const itScenarioId = scenarioBySlug.get("daily-standup-va-bao-cao-tien-do-bug-it");
  const elecScenarioId = scenarioBySlug.get("kiem-tra-mach-va-bao-loi-thiet-bi-dien");

  if (cncScenarioId && itScenarioId && elecScenarioId) {
    await prisma.practiceSession.upsert({
      where: { id: "seed-session-open-1" },
      update: {},
      create: {
        id: "seed-session-open-1",
        scenarioId: itScenarioId,
        hostId: vsvcLoc.id,
        major: "Tin học",
        level: "Cơ bản (A2)",
        school: "Trường Cao đẳng nghề Việt Nam - Singapore",
        ageGroupScope: "ADULT_18_PLUS",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        slotLabel: "Thứ 2 (19:00 - 19:45)",
        meetingUrl: "https://meet.google.com/vsvc-it01-standup",
        status: "OPEN",
        noRecordingConfirmed: true,
        notes: "Luyện tập 15 phút theo kịch bản A/B rồi nhận xét chéo theo rubric.",
      },
    });

    await prisma.practiceSession.upsert({
      where: { id: "seed-session-completed-1" },
      update: {},
      create: {
        id: "seed-session-completed-1",
        scenarioId: cncScenarioId,
        hostId: vsvcNhut.id,
        partnerId: vsvcLoc.id,
        major: "Cơ khí",
        level: "Cơ bản (A2)",
        school: "Trường Cao đẳng nghề Việt Nam - Singapore",
        ageGroupScope: "ADULT_18_PLUS",
        scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        slotLabel: "Thứ 7 (09:00 - 09:45)",
        meetingUrl: "https://meet.google.com/vsvc-ck01-cnc",
        status: "COMPLETED",
        hostConfirmedComplete: true,
        partnerConfirmedComplete: true,
        noRecordingConfirmed: true,
      },
    });

    await prisma.practiceSession.upsert({
      where: { id: "seed-session-minor-open" },
      update: {},
      create: {
        id: "seed-session-minor-open",
        scenarioId: elecScenarioId,
        hostId: vsvcMinorStudent.id,
        major: "Điện - Điện tử",
        level: "Cơ bản (A2)",
        school: "Trường Cao đẳng nghề Việt Nam - Singapore",
        ageGroupScope: "UNDER_18",
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        slotLabel: "Thứ 4 (19:00 - 19:45)",
        meetingUrl: "https://meet.google.com/vsvc-dt18-safety",
        status: "OPEN",
        noRecordingConfirmed: true,
        notes: "Phiên luyện riêng cho nhóm học sinh < 18 tuổi cùng trường VSVC (đã có đồng ý phụ huynh).",
      },
    });

    await prisma.peerRubricReview.upsert({
      where: {
        sessionId_reviewerId: {
          sessionId: "seed-session-completed-1",
          reviewerId: vsvcLoc.id,
        },
      },
      update: {},
      create: {
        sessionId: "seed-session-completed-1",
        reviewerId: vsvcLoc.id,
        targetUserId: vsvcNhut.id,
        scoresJson: JSON.stringify({
          terminology: 5,
          clarity: 4,
          task_completion: 5,
          interaction: 4,
          professionalism: 5,
        }),
        overallScore: 4.6,
        satisfactionRating: 5,
        strengths: "Dùng chính xác các từ spindle bearing, downtime và giải thích rõ thời gian sửa chữa.",
        improvements: "Chú ý phát âm rõ âm cuối từ 'minutes' và 'overheated'.",
        mentorReviewed: true,
        mentorNote: "Nhận xét đúng trọng tâm rubric — GV Nguyễn Xuân Tùng đã rà soát mẫu.",
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
