// src/modules/academic-catalog.js
// WORD BRIDGE V4.2.0 — 22 Chinese Foundation Topics, 22 English Foundation Topics,
// 100 Specialized Domains Taxonomy (Item 100 split into 4 independent domains = 103 domain keys),
// 12 Contact Categories & Contact / Session-Invalid Page Renderers

export const CHINESE_FOUNDATION_22 = Object.freeze([
  { no: 1, slug: "ngu-am-tieng-trung", titleVi: "Ngữ âm tiếng Trung", level: "HSK 1" },
  { no: 2, slug: "pinyin", titleVi: "Pinyin (Phiên âm Latinh)", level: "HSK 1" },
  { no: 3, slug: "thanh-mau", titleVi: "Thanh mẫu (声母)", level: "HSK 1" },
  { no: 4, slug: "van-mau", titleVi: "Vận mẫu (韵母)", level: "HSK 1" },
  { no: 5, slug: "thanh-dieu", titleVi: "Thanh điệu & Biến điệu (声调)", level: "HSK 1" },
  { no: 6, slug: "chu-han", titleVi: "Chữ Hán (汉字)", level: "HSK 1-2" },
  { no: 7, slug: "bo-thu", titleVi: "Bộ thủ (部首)", level: "HSK 1-2" },
  { no: 8, slug: "cau-tao-chu", titleVi: "Cấu tạo chữ Hán (六书)", level: "HSK 2" },
  { no: 9, slug: "tu-vung-nen-tang", titleVi: "Từ vựng nền tảng", level: "HSK 1-3" },
  { no: 10, slug: "tu-loai-zh", titleVi: "Từ loại tiếng Trung", level: "HSK 2-3" },
  { no: 11, slug: "ngu-phap-co-ban-zh", titleVi: "Ngữ pháp cơ bản", level: "HSK 1-2" },
  { no: 12, slug: "ngu-phap-nang-cao-zh", titleVi: "Ngữ pháp nâng cao", level: "HSK 4-5" },
  { no: 13, slug: "cau-don-cau-phuc-zh", titleVi: "Câu đơn và câu phức", level: "HSK 3-4" },
  { no: 14, slug: "giao-tiep-co-ban-zh", titleVi: "Giao tiếp cơ bản", level: "HSK 1-2" },
  { no: 15, slug: "nghe-hieu-zh", titleVi: "Nghe hiểu tiếng Trung", level: "HSK 1-5" },
  { no: 16, slug: "noi-phan-xa-zh", titleVi: "Nói và phản xạ", level: "HSK 2-5" },
  { no: 17, slug: "doc-hieu-zh", titleVi: "Đọc hiểu tiếng Trung", level: "HSK 2-5" },
  { no: 18, slug: "viet-tieng-trung", titleVi: "Viết tiếng Trung", level: "HSK 3-5" },
  { no: 19, slug: "thanh-ngu-bieu-dat-zh", titleVi: "Thành ngữ và biểu đạt (成语)", level: "HSK 4-6" },
  { no: 20, slug: "tieng-trung-hoc-thuat", titleVi: "Tiếng Trung học thuật", level: "HSK 5-6" },
  { no: 21, slug: "giao-tiep-cong-viec-zh", titleVi: "Giao tiếp công việc", level: "HSK 4-6" },
  { no: 22, slug: "phuong-phap-hoc-zh", titleVi: "Phương pháp học và ghi nhớ", level: "Tất cả" }
]);

export const ENGLISH_FOUNDATION_22 = Object.freeze([
  { no: 1, slug: "phat-am-en", titleVi: "Phát âm tiếng Anh", level: "CEFR A1" },
  { no: 2, slug: "ipa", titleVi: "Bảng phiên âm quốc tế IPA", level: "CEFR A1" },
  { no: 3, slug: "nguyen-am-en", titleVi: "Nguyên âm (Vowels)", level: "CEFR A1" },
  { no: 4, slug: "phu-am-en", titleVi: "Phụ âm (Consonants)", level: "CEFR A1" },
  { no: 5, slug: "trong-am-tu-en", titleVi: "Trọng âm từ (Word Stress)", level: "CEFR A2" },
  { no: 6, slug: "trong-am-cau-en", titleVi: "Trọng âm câu (Sentence Stress)", level: "CEFR B1" },
  { no: 7, slug: "ngu-dieu-en", titleVi: "Ngữ điệu (Intonation)", level: "CEFR B1-B2" },
  { no: 8, slug: "tu-vung-co-ban-en", titleVi: "Từ vựng cơ bản", level: "CEFR A1-A2" },
  { no: 9, slug: "tu-loai-en", titleVi: "Từ loại tiếng Anh", level: "CEFR A1-B1" },
  { no: 10, slug: "ngu-phap-co-ban-en", titleVi: "Ngữ pháp cơ bản", level: "CEFR A1-A2" },
  { no: 11, slug: "ngu-phap-nang-cao-en", titleVi: "Ngữ pháp nâng cao", level: "CEFR B2-C1" },
  { no: 12, slug: "cau-truc-cau-en", titleVi: "Cấu trúc câu (Syntax)", level: "CEFR B1-B2" },
  { no: 13, slug: "nghe-hieu-en", titleVi: "Nghe hiểu tiếng Anh", level: "CEFR A1-C1" },
  { no: 14, slug: "noi-phan-xa-en", titleVi: "Nói và phản xạ", level: "CEFR A2-C1" },
  { no: 15, slug: "doc-hieu-en", titleVi: "Đọc hiểu tiếng Anh", level: "CEFR A2-C1" },
  { no: 16, slug: "viet-tieng-anh", titleVi: "Viết tiếng Anh", level: "CEFR B1-C1" },
  { no: 17, slug: "tu-vung-hoc-thuat-en", titleVi: "Từ vựng học thuật (AWL)", level: "CEFR B2-C1" },
  { no: 18, slug: "giao-tiep-thuc-te-en", titleVi: "Giao tiếp thực tế", level: "CEFR A2-B2" },
  { no: 19, slug: "viet-bao-cao-email-en", titleVi: "Viết báo cáo và email", level: "CEFR B1-C1" },
  { no: 20, slug: "trinh-bay-lap-luan-en", titleVi: "Trình bày và lập luận", level: "CEFR B2-C1" },
  { no: 21, slug: "tieng-anh-hoc-thuat", titleVi: "Tiếng Anh học thuật (EAP)", level: "CEFR B2-C1" },
  { no: 22, slug: "phuong-phap-hoc-en", titleVi: "Phương pháp học và ghi nhớ", level: "Tất cả" }
]);

// All 100 Specialized Domains (Item 100 split into 4 independent database domains = 103 independent keys)
const RAW_100_GROUPS = [
  {
    code: "economics_finance",
    nameVi: "Kinh tế, kinh doanh và tài chính",
    items: [
      [1, "kinh-te-hoc", "Kinh tế học", "Economics", null],
      [2, "quan-tri-kinh-doanh", "Quản trị kinh doanh", "Business Administration", null],
      [3, "quan-tri-doanh-nghiep", "Quản trị doanh nghiệp", "Corporate Management", null],
      [4, "khoi-nghiep", "Khởi nghiệp", "Entrepreneurship", null],
      [5, "quan-tri-chien-luoc", "Quản trị chiến lược", "Strategic Management", null],
      [6, "quan-tri-van-hanh", "Quản trị vận hành", "Operations Management", null],
      [7, "ke-toan-doanh-nghiep", "Kế toán doanh nghiệp", "Business Accounting", "ke-toan-doanh-nghiep"],
      [8, "ke-toan-tai-chinh", "Kế toán tài chính", "Financial Accounting", null],
      [9, "ke-toan-quan-tri", "Kế toán quản trị", "Management Accounting", null],
      [10, "kiem-toan", "Kiểm toán", "Auditing", null],
      [11, "thue", "Thuế", "Taxation", null],
      [12, "hai-quan", "Hải quan", "Customs", null],
      [13, "tai-chinh", "Tài chính", "Finance", null],
      [14, "ngan-hang", "Ngân hàng", "Banking", null],
      [15, "bao-hiem", "Bảo hiểm", "Insurance", null],
      [16, "dau-tu-chung-khoan", "Đầu tư và chứng khoán", "Investment and Securities", null]
    ]
  },
  {
    code: "trade_logistics",
    nameVi: "Thương mại, logistics và chuỗi cung ứng",
    items: [
      [17, "thuong-mai-quoc-te", "Thương mại quốc tế", "International Trade", null],
      [18, "xuat-nhap-khau", "Xuất nhập khẩu", "Import and Export", null],
      [19, "hop-dong-thuong-mai", "Hợp đồng thương mại", "Commercial Contracts", null],
      [20, "logistics", "Logistics", "Logistics", null],
      [21, "quan-ly-chuoi-cung-ung", "Quản lý chuỗi cung ứng", "Supply Chain Management", null],
      [22, "giao-nhan-van-tai", "Giao nhận vận tải", "Freight Forwarding", null],
      [23, "van-tai-bien", "Vận tải biển", "Maritime Transport", null],
      [24, "van-tai-hang-khong", "Vận tải hàng không", "Air Freight", null],
      [25, "van-tai-duong-bo-duong-sat", "Vận tải đường bộ và đường sắt", "Road and Rail Transport", null],
      [26, "quan-ly-kho-hang", "Quản lý kho hàng", "Warehousing Management", null],
      [27, "quan-ly-cung-ung", "Quản lý cung ứng", "Procurement Management", null],
      [28, "nghiep-vu-mua-hang", "Nghiệp vụ mua hàng", "Purchasing", null],
      [29, "ban-le", "Bán lẻ", "Retail Management", null],
      [30, "thuong-mai-dien-tu", "Thương mại điện tử", "E-commerce", null],
      [31, "quan-ly-ban-hang", "Quản lý bán hàng", "Sales Management", null]
    ]
  },
  {
    code: "marketing_media_design",
    nameVi: "Marketing, truyền thông và thiết kế",
    items: [
      [32, "quan-tri-quan-he-khach-hang", "Quản trị quan hệ khách hàng", "Customer Relationship Management", null],
      [33, "marketing", "Marketing", "Marketing", null],
      [34, "marketing-so", "Marketing số", "Digital Marketing", null],
      [35, "quang-cao", "Quảng cáo", "Advertising", null],
      [36, "quan-he-cong-chung", "Quan hệ công chúng", "Public Relations", null],
      [37, "truyen-thong-doanh-nghiep", "Truyền thông doanh nghiệp", "Corporate Communications", null],
      [38, "bao-chi", "Báo chí", "Journalism", null],
      [39, "sang-tao-noi-dung-so", "Sáng tạo nội dung số", "Digital Content Creation", null],
      [40, "thiet-ke-do-hoa", "Thiết kế đồ họa", "Graphic Design", "thiet-ke-do-hoa"],
      [41, "thiet-ke-ui-ux", "Thiết kế UI/UX", "UI/UX Design", null],
      [42, "thiet-ke-da-phuong-tien", "Thiết kế đa phương tiện", "Multimedia Design", null]
    ]
  },
  {
    code: "it_data",
    nameVi: "Công nghệ thông tin và dữ liệu",
    items: [
      [43, "cong-nghe-thong-tin", "Công nghệ thông tin", "Information Technology", null],
      [44, "khoa-hoc-may-tinh", "Khoa học máy tính", "Computer Science", null],
      [45, "ky-thuat-phan-mem", "Kỹ thuật phần mềm", "Software Engineering", null],
      [46, "phat-trien-web", "Phát triển web", "Web Development", null],
      [47, "phat-trien-ung-dung-di-dong", "Phát triển ứng dụng di động", "Mobile App Development", null],
      [48, "he-thong-co-so-du-lieu", "Hệ thống cơ sở dữ liệu", "Database Systems", null],
      [49, "an-ninh-mang", "An ninh mạng", "Cybersecurity", null],
      [50, "tri-tue-nhan-tao-hoc-may", "Trí tuệ nhân tạo và học máy", "AI and Machine Learning", null],
      [51, "dien-toan-dam-may", "Điện toán đám mây", "Cloud Computing", null],
      [52, "quan-tri-mang-may-tinh", "Mạng máy tính & Quản trị mạng", "Computer Networking", "quan-tri-mang-may-tinh"],
      [53, "sua-chua-lap-rap-may-tinh", "Hỗ trợ kỹ thuật CNTT & Lắp ráp máy tính", "IT Support & Computer Assembly", "sua-chua-lap-rap-may-tinh"],
      [54, "phan-tich-du-lieu", "Phân tích dữ liệu", "Data Analytics", null],
      [55, "khoa-hoc-du-lieu", "Khoa học dữ liệu", "Data Science", null]
    ]
  },
  {
    code: "management_org",
    nameVi: "Quản lý và quản trị tổ chức",
    items: [
      [56, "quan-ly-san-pham", "Quản lý sản phẩm", "Product Management", null],
      [57, "quan-ly-du-an", "Quản lý dự án", "Project Management", null],
      [58, "quan-ly-chat-luong", "Quản lý chất lượng", "Quality Management", null],
      [59, "quan-tri-rui-ro", "Quản trị rủi ro", "Risk Management", null],
      [60, "quan-tri-nhan-su", "Quản trị nhân sự", "Human Resource Management", null],
      [61, "tuyen-dung", "Tuyển dụng", "Recruitment", null],
      [62, "dao-tao-phat-trien-nhan-luc", "Đào tạo và phát triển nhân lực", "Training and Development", null],
      [63, "phap-luat", "Pháp luật", "Law", null],
      [64, "phap-luat-doanh-nghiep", "Pháp luật doanh nghiệp", "Corporate Law", null],
      [65, "hanh-chinh-cong", "Hành chính công", "Public Administration", null]
    ]
  },
  {
    code: "education_society",
    nameVi: "Giáo dục, ngôn ngữ và xã hội",
    items: [
      [66, "giao-duc", "Giáo dục", "Education", null],
      [67, "cong-nghe-giao-duc", "Công nghệ giáo dục", "Educational Technology", null],
      [68, "ngon-ngu-hoc", "Ngôn ngữ học", "Linguistics", null],
      [69, "bien-dich-phien-dich", "Biên dịch và phiên dịch", "Translation and Interpreting", null],
      [70, "tam-ly-hoc", "Tâm lý học", "Psychology", null],
      [71, "cong-tac-xa-hoi", "Công tác xã hội và phát triển cộng đồng", "Social Work and Community Development", null],
      [72, "nghien-cuu-phat-trien", "Nghiên cứu và phát triển", "Research and Development", null]
    ]
  },
  {
    code: "engineering_manufacturing",
    nameVi: "Kỹ thuật và sản xuất",
    items: [
      [73, "ky-thuat-co-khi", "Kỹ thuật cơ khí", "Mechanical Engineering", "nguoi-sua-chua-may-cong-cu"],
      [74, "dien-cong-nghiep", "Kỹ thuật điện & Điện công nghiệp", "Electrical Engineering", "dien-cong-nghiep"],
      [75, "dien-tu-cong-nghiep", "Kỹ thuật điện tử & Điện tử công nghiệp", "Electronics Engineering", "dien-tu-cong-nghiep"],
      [76, "co-dien-tu", "Cơ điện tử", "Mechatronics", "co-dien-tu"],
      [77, "tu-dong-hoa-cong-nghiep", "Tự động hóa công nghiệp", "Industrial Automation", null],
      [78, "ky-thuat-xay-dung", "Kỹ thuật xây dựng", "Civil Engineering", null],
      [79, "quan-ly-xay-dung", "Quản lý xây dựng", "Construction Management", null],
      [80, "cong-nghe-o-to", "Công nghệ ô tô", "Automotive Technology", "cong-nghe-o-to"],
      [81, "ky-thuat-may-lanh-dhkk", "Kỹ thuật lạnh và điều hòa không khí", "HVAC and Refrigeration", "ky-thuat-may-lanh-dhkk"],
      [82, "san-xuat-cong-nghiep", "Sản xuất công nghiệp", "Industrial Manufacturing", null],
      [83, "cat-got-kim-loai", "Gia công kim loại và CNC", "Metalworking and CNC Machining", "cat-got-kim-loai"],
      [84, "bao-tri-thiet-bi-co-dien", "Bảo trì thiết bị công nghiệp", "Industrial Maintenance", "bao-tri-thiet-bi-co-dien"],
      [85, "ky-thuat-hoa-hoc", "Kỹ thuật hóa học", "Chemical Engineering", null]
    ]
  },
  {
    code: "science_health",
    nameVi: "Khoa học, môi trường và sức khỏe",
    items: [
      [86, "khoa-hoc-moi-truong", "Khoa học môi trường", "Environmental Science", null],
      [87, "phat-trien-ben-vung-cong-nghe-xanh", "Phát triển bền vững và công nghệ xanh", "Sustainability and Green Technology", null],
      [88, "nang-luong-tai-tao", "Năng lượng tái tạo", "Renewable Energy", null],
      [89, "nong-nghiep", "Nông nghiệp", "Agriculture", null],
      [90, "khoa-hoc-thuc-pham", "Khoa học thực phẩm", "Food Science", null],
      [91, "khoa-hoc-suc-khoe", "Khoa học sức khỏe", "Health Sciences", null],
      [92, "y-hoc", "Y học", "Medicine", null],
      [93, "dieu-duong", "Điều dưỡng", "Nursing", null],
      [94, "duoc-hoc", "Dược học", "Pharmacy", null],
      [95, "y-te-cong-cong", "Y tế công cộng", "Public Health", null]
    ]
  },
  {
    code: "services_social",
    nameVi: "Dịch vụ và các lĩnh vực xã hội",
    items: [
      [96, "du-lich", "Du lịch", "Tourism", null],
      [97, "khach-san-luu-tru", "Khách sạn và dịch vụ lưu trú", "Hospitality", null],
      [98, "hang-khong", "Hàng không", "Aviation", null],
      [99, "the-thao-khoa-hoc-the-thao", "Thể thao và khoa học thể thao", "Sports and Sports Science", null],
      // Item 100 explicitly split into 4 independent database domains:
      [100, "thoi-trang", "Thời trang (Nhóm 100A)", "Fashion", null],
      [100, "bat-dong-san", "Bất động sản (Nhóm 100B)", "Real Estate", null],
      [100, "quan-ly-su-kien", "Quản lý sự kiện (Nhóm 100C)", "Event Management", null],
      [100, "dich-vu-khach-hang", "Dịch vụ khách hàng (Nhóm 100D)", "Customer Service", null]
    ]
  }
];

export const SPECIALIZED_100_DOMAINS = Object.freeze(
  RAW_100_GROUPS.flatMap((g) =>
    g.items.map(([itemNumber, slug, nameVi, nameEn, datasetSlug]) => ({
      itemNumber,
      slug,
      categoryCode: g.code,
      categoryNameVi: g.nameVi,
      nameVi,
      nameEn,
      datasetSlug,
      targetTermsEn: 500,
      targetTermsZh: 500
    }))
  )
);

export const CONTACT_CATEGORIES_12 = Object.freeze([
  ["account_member", "1. Tài khoản và thành viên"],
  ["login_security", "2. Đăng nhập và bảo mật"],
  ["learning_support", "3. Hỗ trợ học tập"],
  ["reader_library", "4. Thư viện đọc"],
  ["practice_portal", "5. Cổng luyện tập"],
  ["dictionary_vocab", "6. Từ điển và dữ liệu từ vựng"],
  ["content_report", "7. Báo cáo nội dung"],
  ["security_report", "8. Báo cáo bảo mật"],
  ["privacy_personal_data", "9. Quyền riêng tư và dữ liệu cá nhân"],
  ["partnership_development", "10. Hợp tác và phát triển"],
  ["feedback_suggestions", "11. Góp ý và đề xuất"],
  ["other", "12. Vấn đề khác"]
]);

export function renderContactPageV42({ user, runtime = null, env = {}, signInUrl, escapeHtml }) {
  const verifiedCskhEmail = env.VERIFIED_CSKH_EMAIL || "";
  const formHtml = user
    ? `<form class="wb-form" data-api-endpoint="/api/v1/support/tickets" style="margin-top:16px;">
        <div class="wb-grid-2">
          <div class="wb-field"><label for="c-name">Họ và tên (từ hồ sơ) *</label><input id="c-name" class="wb-input" name="senderName" value="${escapeHtml(user.fullName || "")}" required /></div>
          <div class="wb-field"><label for="c-email">Email liên hệ *</label><input id="c-email" class="wb-input" type="email" name="senderEmail" value="${escapeHtml(user.email || "")}" required /></div>
        </div>
        <div class="wb-field">
          <label for="c-type">Nhóm yêu cầu (12 nhóm) *</label>
          <select id="c-type" class="wb-input" name="requestType" required>
            ${CONTACT_CATEGORIES_12.map(([val, label]) => `<option value="${val}">${escapeHtml(label)}</option>`).join("")}
          </select>
        </div>
        <div class="wb-field"><label for="c-subject">Tiêu đề yêu cầu *</label><input id="c-subject" class="wb-input" name="subject" placeholder="Tóm tắt ngắn gọn vấn đề cần CSKH hỗ trợ" required /></div>
        <div class="wb-field"><label for="c-body">Nội dung chi tiết *</label><textarea id="c-body" class="wb-input" name="messageBody" rows="4" placeholder="Mô tả chi tiết, mã yêu cầu hoặc đường dẫn gặp sự cố..." required></textarea></div>
        <div class="wb-field">
          <label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;">
            <input type="checkbox" name="policyConfirmed" value="1" required />
            <span>Tôi xác nhận đã đọc <a href="/policies/privacy">Chính sách quyền riêng tư</a> về việc tiếp nhận và xử lý phiếu CSKH.</span>
          </label>
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu đến CSKH</button>
      </form>`
    : `<div class="wb-alert wb-alert-info" style="margin:16px 0;">
        Vui lòng <a href="${escapeHtml(signInUrl("/contact", "contact.send"))}" style="font-weight:700;text-decoration:underline;">đăng nhập</a> để gửi biểu mẫu liên hệ trực tuyến hoặc xem hướng dẫn tại <a href="/help" style="font-weight:700;text-decoration:underline;">Trung Tâm Trợ Giúp</a>.
      </div>`;

  return `
    <section class="wb-card" style="padding:28px;">
      <h1 style="margin:0 0 8px;color:var(--wb-teal);font-size:2rem;">Liên hệ WORD BRIDGE</h1>
      <p style="margin:0 0 12px;color:#334155;">Đội ngũ Chăm sóc khách hàng (CSKH) luôn sẵn sàng đồng hành cùng bạn trong suốt quá trình học tập và hợp tác học thuật.</p>
      ${formHtml}
      <div class="wb-grid-3" style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
        <div>
          <strong style="display:block;color:var(--wb-teal);margin-bottom:4px;">CSKH (Chăm sóc khách hàng)</strong>
          <p class="wb-muted" style="margin:0;font-size:0.92rem;">${verifiedCskhEmail ? escapeHtml(verifiedCskhEmail) : "Tiếp nhận trực tuyến qua phiếu CSKH có mã theo dõi trong tài khoản."}</p>
        </div>
        <div>
          <strong style="display:block;color:var(--wb-teal);margin-bottom:4px;">Trung Tâm Trợ Giúp</strong>
          <p class="wb-muted" style="margin:0;font-size:0.92rem;"><a href="/help">Hướng dẫn &amp; câu hỏi thường gặp</a></p>
        </div>
        <div>
          <strong style="display:block;color:var(--wb-teal);margin-bottom:4px;">Phản hồi &amp; góp ý</strong>
          <p class="wb-muted" style="margin:0;font-size:0.92rem;">Gửi ý kiến, đề xuất qua nhóm <em>Góp ý và đề xuất</em> để chúng tôi cải thiện dịch vụ.</p>
        </div>
      </div>
    </section>`;
}

export function renderSessionInvalidContent({ escapeHtml }) {
  return `
    <section class="wb-error-state" style="max-width:560px;margin:24px auto;text-align:center;">
      <div style="margin-bottom:12px;" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#146466" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <strong style="font-size:2.4rem;color:var(--wb-teal);display:block;">401</strong>
      <div style="width:96px;height:4px;background:#C92F1C;border-radius:999px;margin:8px auto 16px;"></div>
      <h1 style="margin:0 0 8px;">Phiên đăng nhập không hợp lệ</h1>
      <p class="wb-muted" style="margin:0 0 20px;">Phiên đăng nhập của bạn đã hết hạn, bị thu hồi hoặc không còn hiệu lực. Vui lòng đăng nhập lại để tiếp tục sử dụng WORD BRIDGE.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a class="wb-btn wb-btn-primary" href="/login">Đăng nhập lại</a>
        <a class="wb-btn wb-btn-outline" href="/">Về Trang chủ</a>
        <a class="wb-btn wb-btn-outline" href="/help/errors/401">Hướng dẫn khắc phục</a>
      </div>
    </section>`;
}
