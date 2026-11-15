/**
 * WORD BRIDGE – CLOUDFLARE WORKER ENTRYPOINT (src/worker.js)
 * Tích hợp trực tiếp:
 * - Worker Name: "wordbridge"
 * - Cloudflare D1 Binding: env.DB (database_name = "word", database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771")
 * - Cloudflare R2 Binding: env.R2 (bucket_name = "word")
 * - Biến môi trường & API máy chủ: env.MONTHLY_QUOTA_GB, env.RESEND_API_KEY
 * - Tích hợp sẵn bộ tài nguyên SVG chống lỗi ảnh (Zero Broken Images)
 */

const EMBEDDED_SVGS = {"/assets/hero-globe-illustration.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 560 320\" width=\"560\" height=\"320\" role=\"img\" aria-label=\"Minh họa Vector 5 Ngôn ngữ WORD BRIDGE\">\n  <defs>\n    <linearGradient id=\"bgWave\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0%\" stop-color=\"#EAF5F5\"/>\n      <stop offset=\"100%\" stop-color=\"#D4ECEB\"/>\n    </linearGradient>\n  </defs>\n  <rect width=\"560\" height=\"320\" rx=\"20\" fill=\"url(#bgWave)\"/>\n  <!-- Decorative Bridge Waves -->\n  <path d=\"M0 275 Q160 220 320 265 T560 240 L560 320 L0 320 Z\" fill=\"#146466\" opacity=\"0.16\"/>\n  <path d=\"M180 300 Q340 230 560 265 L560 320 L180 320 Z\" fill=\"#C92F1C\" opacity=\"0.82\"/>\n  <!-- Stack of Books -->\n  <g transform=\"translate(150, 175)\">\n    <rect x=\"0\" y=\"65\" width=\"130\" height=\"28\" rx=\"6\" fill=\"#C92F1C\"/>\n    <rect x=\"8\" y=\"70\" width=\"114\" height=\"18\" rx=\"3\" fill=\"#FFFDF7\"/>\n    <rect x=\"10\" y=\"36\" width=\"120\" height=\"28\" rx=\"6\" fill=\"#E09F3E\"/>\n    <rect x=\"18\" y=\"41\" width=\"104\" height=\"18\" rx=\"3\" fill=\"#FFFDF7\"/>\n    <rect x=\"16\" y=\"8\" width=\"110\" height=\"26\" rx=\"6\" fill=\"#146466\"/>\n    <rect x=\"24\" y=\"13\" width=\"94\" height=\"16\" rx=\"3\" fill=\"#FFFDF7\"/>\n  </g>\n  <!-- Globe on Stand -->\n  <g transform=\"translate(335, 145)\">\n    <circle cx=\"0\" cy=\"0\" r=\"68\" fill=\"#5AABA9\" stroke=\"#146466\" stroke-width=\"4\"/>\n    <path d=\"M-45 -25 Q-20 -45 10 -20 Q35 0 20 35 Q-10 50 -35 20 Z\" fill=\"#E2E2C4\" opacity=\"0.9\"/>\n    <path d=\"M25 -45 Q50 -25 45 10 Q30 20 20 -10 Z\" fill=\"#E2E2C4\" opacity=\"0.85\"/>\n    <path d=\"M-55 -55 A78 78 0 0 0 55 55\" fill=\"none\" stroke=\"#B66E2E\" stroke-width=\"7\" stroke-linecap=\"round\"/>\n    <rect x=\"-12\" y=\"75\" width=\"24\" height=\"18\" fill=\"#B66E2E\"/>\n    <rect x=\"-38\" y=\"90\" width=\"76\" height=\"12\" rx=\"6\" fill=\"#8C511E\"/>\n  </g>\n  <!-- 5 Language Speech Bubbles (EN, KO, JA, RU, ZH) -->\n  <g transform=\"translate(195, 52)\">\n    <rect x=\"0\" y=\"0\" width=\"56\" height=\"44\" rx=\"12\" fill=\"#C92F1C\"/>\n    <text x=\"28\" y=\"29\" text-anchor=\"middle\" font-family=\"'Be Vietnam Pro', sans-serif\" font-size=\"24\" font-weight=\"800\" fill=\"#FFFFFF\">A</text>\n  </g>\n  <g transform=\"translate(415, 36)\">\n    <rect x=\"0\" y=\"0\" width=\"54\" height=\"42\" rx=\"12\" fill=\"#146466\"/>\n    <text x=\"27\" y=\"28\" text-anchor=\"middle\" font-family=\"'Noto Sans KR', sans-serif\" font-size=\"21\" font-weight=\"700\" fill=\"#FFFFFF\">안</text>\n  </g>\n  <g transform=\"translate(476, 82)\">\n    <rect x=\"0\" y=\"0\" width=\"54\" height=\"42\" rx=\"12\" fill=\"#C92F1C\"/>\n    <text x=\"27\" y=\"28\" text-anchor=\"middle\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"21\" font-weight=\"700\" fill=\"#FFFFFF\">あ</text>\n  </g>\n  <g transform=\"translate(422, 134)\">\n    <rect x=\"0\" y=\"0\" width=\"54\" height=\"42\" rx=\"12\" fill=\"#3D5A80\"/>\n    <text x=\"27\" y=\"28\" text-anchor=\"middle\" font-family=\"'Noto Sans', sans-serif\" font-size=\"22\" font-weight=\"700\" fill=\"#FFFFFF\">Я</text>\n  </g>\n  <g transform=\"translate(95, 92)\">\n    <rect x=\"0\" y=\"0\" width=\"66\" height=\"42\" rx=\"12\" fill=\"#2A7F62\"/>\n    <text x=\"33\" y=\"27\" text-anchor=\"middle\" font-family=\"'Noto Sans SC', sans-serif\" font-size=\"18\" font-weight=\"700\" fill=\"#FFFFFF\">你好</text>\n  </g>\n</svg>", "/assets/favicon.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"64\" height=\"64\">\n  <rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#146466\"/>\n  <path d=\"M10 34 C20 12, 44 12, 54 34\" fill=\"none\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n  <line x1=\"24\" y1=\"21\" x2=\"24\" y2=\"34\" stroke=\"#C92F1C\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>\n  <line x1=\"32\" y1=\"17\" x2=\"32\" y2=\"34\" stroke=\"#C92F1C\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n  <line x1=\"40\" y1=\"21\" x2=\"40\" y2=\"34\" stroke=\"#C92F1C\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>\n  <path d=\"M8 38 Q20 31 32 39 Q44 31 56 38 L53 46 Q42 39 32 47 Q22 39 11 46 Z\" fill=\"#5AABA9\"/>\n  <path d=\"M7 47 Q20 41 32 49 Q44 41 57 47 L55 52 Q43 45 32 53 Q21 45 9 52 Z\" fill=\"#E2E2C4\"/>\n</svg>", "/assets/logo-vertical.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 260 150\" width=\"260\" height=\"150\" role=\"img\" aria-label=\"WORD BRIDGE Vertical Logo\">\n  <g transform=\"translate(80, 10)\">\n    <path d=\"M8 38 C24 6, 76 6, 92 38\" fill=\"none\" stroke=\"#C92F1C\" stroke-width=\"5.5\" stroke-linecap=\"round\"/>\n    <line x1=\"33\" y1=\"18\" x2=\"33\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <line x1=\"50\" y1=\"13\" x2=\"50\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n    <line x1=\"67\" y1=\"18\" x2=\"67\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <path d=\"M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z\" fill=\"#5AABA9\"/>\n    <path d=\"M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z\" fill=\"#146466\"/>\n  </g>\n  <text x=\"130\" y=\"105\" text-anchor=\"middle\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"26\" font-weight=\"800\">\n    <tspan fill=\"#146466\">WORD </tspan><tspan fill=\"#C92F1C\">BRIDGE</tspan>\n  </text>\n  <text x=\"130\" y=\"128\" text-anchor=\"middle\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"11\" font-weight=\"600\" fill=\"#2A4849\">Where Languages Bring People Together.</text>\n</svg>", "/assets/logo-dark.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 380 78\" width=\"380\" height=\"78\" role=\"img\" aria-label=\"WORD BRIDGE - Where Languages Bring People Together.\">\n  <g transform=\"translate(6, 8)\">\n    <path d=\"M8 38 C24 6, 76 6, 92 38\" fill=\"none\" stroke=\"#C92F1C\" stroke-width=\"5.5\" stroke-linecap=\"round\"/>\n    <line x1=\"33\" y1=\"18\" x2=\"33\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <line x1=\"50\" y1=\"13\" x2=\"50\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n    <line x1=\"67\" y1=\"18\" x2=\"67\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <path d=\"M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z\" fill=\"#5AABA9\"/>\n    <path d=\"M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z\" fill=\"#E2E2C4\"/>\n  </g>\n  <text x=\"116\" y=\"42\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"30\" font-weight=\"800\" fill=\"#FFFFFF\" letter-spacing=\"0.5\">WORD</text>\n  <text x=\"220\" y=\"42\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"30\" font-weight=\"800\" fill=\"#FF5A43\" letter-spacing=\"0.5\">BRIDGE</text>\n  <text x=\"116\" y=\"61\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"12.5\" font-weight=\"500\" fill=\"#E2E2C4\">Where Languages Bring People Together.</text>\n</svg>", "/assets/logo-light.svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 380 78\" width=\"380\" height=\"78\" role=\"img\" aria-label=\"WORD BRIDGE - Where Languages Bring People Together.\">\n  <g transform=\"translate(6, 8)\">\n    <!-- Red Arch Bridge (#C92F1C) -->\n    <path d=\"M8 38 C24 6, 76 6, 92 38\" fill=\"none\" stroke=\"#C92F1C\" stroke-width=\"5.5\" stroke-linecap=\"round\"/>\n    <line x1=\"33\" y1=\"18\" x2=\"33\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <line x1=\"50\" y1=\"13\" x2=\"50\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n    <line x1=\"67\" y1=\"18\" x2=\"67\" y2=\"38\" stroke=\"#C92F1C\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n    <!-- Open Teal Book (#5AABA9 & #146466) -->\n    <path d=\"M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z\" fill=\"#5AABA9\"/>\n    <path d=\"M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z\" fill=\"#146466\"/>\n  </g>\n  <text x=\"116\" y=\"42\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"30\" font-weight=\"800\" fill=\"#146466\" letter-spacing=\"0.5\">WORD</text>\n  <text x=\"220\" y=\"42\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"30\" font-weight=\"800\" fill=\"#C92F1C\" letter-spacing=\"0.5\">BRIDGE</text>\n  <text x=\"116\" y=\"61\" font-family=\"'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif\" font-size=\"12.5\" font-weight=\"600\" fill=\"#2A4849\">Where Languages Bring People Together.</text>\n</svg>"};
const FALLBACK_INDEX_HTML = "<!DOCTYPE html>\n<html lang=\"vi\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>WORD BRIDGE – Where Languages Bring People Together.</title>\n  <meta name=\"description\" content=\"WORD BRIDGE – Nền tảng thực hành ngoại ngữ (Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Nga), kết nối bạn học, vận hành câu lạc bộ/tổ chức và khảo thí trực tuyến tại https://wordbridge.io.vn.\" />\n  <link rel=\"canonical\" href=\"https://wordbridge.io.vn/\" />\n  <link rel=\"icon\" href=\"/assets/favicon.svg\" type=\"image/svg+xml\" />\n  <link rel=\"stylesheet\" href=\"/css/design-system.css\" />\n  <link rel=\"stylesheet\" href=\"/css/layouts-responsive.css\" />\n</head>\n<body>\n  <!-- HEADER CHÍNH THỨC (PHẦN 06.1 - Tuyệt đối không có mục Sự kiện) -->\n  <header class=\"wb-header\" role=\"banner\">\n    <div class=\"wb-container wb-header-inner\">\n      <a href=\"/\" class=\"wb-logo-link\" data-nav=\"/\">\n        <img src=\"/assets/logo-light.svg\" alt=\"WORD BRIDGE - Where Languages Bring People Together.\" />\n      </a>\n\n      <button type=\"button\" class=\"wb-btn wb-btn-outline wb-mobile-menu-toggle\" id=\"wbMobileMenuBtn\" aria-label=\"Mở menu điều hướng\">\n        ☰ Danh mục\n      </button>\n\n      <nav class=\"wb-nav\" id=\"wbMainNav\" aria-label=\"Điều hướng chính WORD BRIDGE\">\n        <div class=\"wb-nav-item\">\n          <a href=\"/\" class=\"wb-nav-link\" data-nav=\"/\">Trang chủ</a>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/kham-pha\" class=\"wb-nav-link\" data-nav=\"/kham-pha\">Khám phá ▾</a>\n          <div class=\"wb-mega-menu\">\n            <a href=\"/gioi-thieu\" class=\"wb-mega-card\" data-nav=\"/gioi-thieu\">\n              <strong>Giới thiệu WORD BRIDGE</strong>\n              <span>Tầm nhìn LEARN – CONNECT – COMMUNITY – GROW</span>\n            </a>\n            <a href=\"/kham-pha\" class=\"wb-mega-card\" data-nav=\"/kham-pha\">\n              <strong>Khám phá Nền tảng</strong>\n              <span>Kiến trúc hệ sinh thái ngoại ngữ hợp nhất</span>\n            </a>\n          </div>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/hoc-tap\" class=\"wb-nav-link\" data-nav=\"/hoc-tap\">Học ngoại ngữ ▾</a>\n          <div class=\"wb-mega-menu\">\n            <a href=\"/ngon-ngu\" class=\"wb-mega-card\" data-nav=\"/ngon-ngu\">\n              <strong>Khám phá 05 Ngôn ngữ</strong>\n              <span>Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Nga</span>\n            </a>\n            <a href=\"/hoc-tap\" class=\"wb-mega-card\" data-nav=\"/hoc-tap\">\n              <strong>Trung tâm Học tập & Thực hành</strong>\n              <span>Tổng quan lộ trình & Trợ lý AI ngữ cảnh</span>\n            </a>\n            <a href=\"/hoc-tap/nghe\" class=\"wb-mega-card\" data-nav=\"/hoc-tap/nghe\">\n              <strong>A. Nghe điền từ (Listening)</strong>\n              <span>Nghe hội thoại, điều chỉnh tốc độ & điền từ</span>\n            </a>\n            <a href=\"/hoc-tap/tu-vung\" class=\"wb-mega-card\" data-nav=\"/hoc-tap/tu-vung\">\n              <strong>B. Từ vựng & Flashcard</strong>\n              <span>Lật thẻ ghi nhớ, tạo bộ từ riêng & kiểm tra</span>\n            </a>\n            <a href=\"/hoc-tap/sap-xep-cau\" class=\"wb-mega-card\" data-nav=\"/hoc-tap/sap-xep-cau\">\n              <strong>C. Sắp xếp câu (Sentence Building)</strong>\n              <span>Ghép từ xáo trộn chuẩn cấu trúc ngữ pháp</span>\n            </a>\n            <a href=\"/hoc-tap/doc-hieu\" class=\"wb-mega-card\" data-nav=\"/hoc-tap/doc-hieu\">\n              <strong>D. Đọc hiểu (Reading)</strong>\n              <span>Đọc đoạn văn theo cấp độ & chấm điểm tức thì</span>\n            </a>\n            <a href=\"/tien-do\" class=\"wb-mega-card\" data-nav=\"/tien-do\">\n              <strong>Theo dõi Tiến độ & Kết quả</strong>\n              <span>Thống kê lịch sử thực hành thực tế theo kỹ năng</span>\n            </a>\n          </div>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/cong-dong\" class=\"wb-nav-link\" data-nav=\"/cong-dong\">Cộng đồng ▾</a>\n          <div class=\"wb-mega-menu\">\n            <a href=\"/cong-dong\" class=\"wb-mega-card\" data-nav=\"/cong-dong\">\n              <strong>Bảng tin Cộng đồng</strong>\n              <span>Thảo luận, chia sẻ kinh nghiệm & học liệu</span>\n            </a>\n            <a href=\"/ket-noi\" class=\"wb-mega-card\" data-nav=\"/ket-noi\">\n              <strong>Tìm bạn thực hành</strong>\n              <span>Ghép cặp theo ngôn ngữ, trình độ & khung giờ</span>\n            </a>\n            <a href=\"/ban-be\" class=\"wb-mega-card\" data-nav=\"/ban-be\">\n              <strong>Hệ thống Bạn bè</strong>\n              <span>Quản lý lời mời kết nối có đồng thuận 2 bên</span>\n            </a>\n            <a href=\"/tin-nhan\" class=\"wb-mega-card\" data-nav=\"/tin-nhan\">\n              <strong>Chat & Nhắn tin</strong>\n              <span>Trò chuyện cá nhân & thảo luận nhóm theo chủ đề</span>\n            </a>\n            <a href=\"/cong-dong/clb\" class=\"wb-mega-card\" data-nav=\"/cong-dong/clb\">\n              <strong>Câu lạc bộ (CLB)</strong>\n              <span>Không gian sinh hoạt câu lạc bộ ngoại ngữ</span>\n            </a>\n            <a href=\"/cong-dong/nhom\" class=\"wb-mega-card\" data-nav=\"/cong-dong/nhom\">\n              <strong>Đội & Nhóm học tập</strong>\n              <span>Tạo thử thách & lịch sinh hoạt nội bộ</span>\n            </a>\n          </div>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/cong-dong/to-chuc\" class=\"wb-nav-link\" data-nav=\"/cong-dong/to-chuc\">Tổ chức ▾</a>\n          <div class=\"wb-mega-menu\">\n            <a href=\"/cong-dong/to-chuc\" class=\"wb-mega-card\" data-nav=\"/cong-dong/to-chuc\">\n              <strong>Khám phá Tổ chức</strong>\n              <span>Các đơn vị giáo dục, CLB và tổ chức trên nền tảng</span>\n            </a>\n            <a href=\"/dang-ky-to-chuc\" class=\"wb-mega-card\" data-nav=\"/dang-ky-to-chuc\">\n              <strong>Đăng ký Tổ chức (Loại 1 & Loại 2)</strong>\n              <span>Biểu mẫu 3 mục chuẩn hành chính 34 tỉnh/thành</span>\n            </a>\n            <a href=\"/khong-gian-cua-toi\" class=\"wb-mega-card\" data-nav=\"/khong-gian-cua-toi\">\n              <strong>Tổ chức & Cộng đồng của tôi</strong>\n              <span>Không gian thành viên, nhiệm vụ & tài liệu nội bộ</span>\n            </a>\n            <a href=\"/to-chuc\" class=\"wb-mega-card\" data-nav=\"/to-chuc\">\n              <strong>Không gian Quản lý Tổ chức</strong>\n              <span>Quản trị thành viên, phân quyền & báo cáo đơn vị</span>\n            </a>\n          </div>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/khao-thi\" class=\"wb-nav-link\" data-nav=\"/khao-thi\">Khảo thí</a>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/tai-nguyen\" class=\"wb-nav-link\" data-nav=\"/tai-nguyen\">Tài nguyên</a>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/dich-vu\" class=\"wb-nav-link\" data-nav=\"/dich-vu\">Dịch vụ ▾</a>\n          <div class=\"wb-mega-menu\">\n            <a href=\"/dich-vu\" class=\"wb-mega-card\" data-nav=\"/dich-vu\">\n              <strong>Tổng quan Dịch vụ & Tiện ích</strong>\n              <span>Mô hình dịch vụ & 06 nhóm tiện ích bổ sung</span>\n            </a>\n            <a href=\"/goi-dich-vu\" class=\"wb-mega-card\" data-nav=\"/goi-dich-vu\">\n              <strong>Gói Thành viên & Chương trình Hỗ trợ</strong>\n              <span>Personal Free/Plus, Organization Plus, Sinh viên, Community Access</span>\n            </a>\n            <a href=\"/thanh-toan\" class=\"wb-mega-card\" data-nav=\"/thanh-toan\">\n              <strong>Thanh toán QR & Đối soát</strong>\n              <span>Tạo đơn hàng, mã VietQR & tra cứu hóa đơn</span>\n            </a>\n          </div>\n        </div>\n        <div class=\"wb-nav-item\">\n          <a href=\"/ho-tro\" class=\"wb-nav-link\" data-nav=\"/ho-tro\">Hỗ trợ</a>\n        </div>\n      </nav>\n\n      <div class=\"wb-header-actions\">\n        <form class=\"wb-search-box\" id=\"wbGlobalSearchForm\" role=\"search\">\n          <input type=\"search\" id=\"wbGlobalSearchInput\" placeholder=\"Tìm ngôn ngữ, tài liệu...\" aria-label=\"Tìm kiếm trên WORD BRIDGE\" />\n        </form>\n        <div id=\"wbHeaderUserArea\" style=\"display:flex;align-items:center;gap:8px;\">\n          <a href=\"/dang-nhap\" class=\"wb-btn wb-btn-outline\" data-nav=\"/dang-nhap\">Đăng nhập</a>\n          <a href=\"/dang-ky\" class=\"wb-btn wb-btn-accent\" data-nav=\"/dang-ky\">Đăng ký</a>\n        </div>\n      </div>\n    </div>\n  </header>\n\n  <!-- KHU VỰC NỘI DUNG ĐỘNG THEO ROUTE -->\n  <main id=\"wbAppRoot\" role=\"main\" style=\"min-height:72vh;\"></main>\n\n  <!-- FOOTER CHÍNH THỨC (PHẦN 06.3 & PHẦN 21 - Chuẩn thiết kế trang 2 của 42.pdf) -->\n  <footer class=\"wb-footer\" role=\"contentinfo\">\n    <div class=\"wb-container\">\n      <div class=\"wb-footer-grid\">\n        <div class=\"wb-footer-col\">\n          <img src=\"/assets/logo-dark.svg\" alt=\"WORD BRIDGE\" style=\"height:50px;margin-bottom:14px;\" />\n          <p style=\"color:#E2E2C4;font-size:13.5px;margin:0 0 12px 0;\">\n            Nền tảng thực hành ngoại ngữ, kết nối bạn học đồng hành và vận hành câu lạc bộ, đội, nhóm, tổ chức giáo dục trên một địa chỉ duy nhất <strong>https://wordbridge.io.vn</strong>.\n          </p>\n          <div style=\"font-size:12px;color:#5AABA9;\">\n            LEARN • CONNECT • COMMUNITY • GROW\n          </div>\n        </div>\n\n        <div class=\"wb-footer-col\">\n          <h4>Khám phá & Học tập</h4>\n          <ul class=\"wb-footer-links\">\n            <li><a href=\"/\" data-nav=\"/\">Trang chủ WORD BRIDGE</a></li>\n            <li><a href=\"/gioi-thieu\" data-nav=\"/gioi-thieu\">Giới thiệu nền tảng</a></li>\n            <li><a href=\"/ngon-ngu\" data-nav=\"/ngon-ngu\">Khám phá 05 ngôn ngữ</a></li>\n            <li><a href=\"/hoc-tap\" data-nav=\"/hoc-tap\">Trung tâm học tập</a></li>\n            <li><a href=\"/tien-do\" data-nav=\"/tien-do\">Theo dõi tiến độ</a></li>\n            <li><a href=\"/tai-nguyen\" data-nav=\"/tai-nguyen\">Thư viện tài nguyên</a></li>\n          </ul>\n        </div>\n\n        <div class=\"wb-footer-col\">\n          <h4>Kết nối & Tổ chức</h4>\n          <ul class=\"wb-footer-links\">\n            <li><a href=\"/ket-noi\" data-nav=\"/ket-noi\">Tìm bạn thực hành</a></li>\n            <li><a href=\"/tin-nhan\" data-nav=\"/tin-nhan\">Chat & Nhắn tin</a></li>\n            <li><a href=\"/cong-dong\" data-nav=\"/cong-dong\">Bảng tin cộng đồng</a></li>\n            <li><a href=\"/cong-dong/to-chuc\" data-nav=\"/cong-dong/to-chuc\">Khám phá tổ chức</a></li>\n            <li><a href=\"/dang-ky-to-chuc\" data-nav=\"/dang-ky-to-chuc\">Đăng ký tổ chức</a></li>\n            <li><a href=\"/khao-thi\" data-nav=\"/khao-thi\">Hệ Thống Khảo Thí</a></li>\n          </ul>\n        </div>\n\n        <div class=\"wb-footer-col\">\n          <h4>Dịch vụ & Chính sách</h4>\n          <ul class=\"wb-footer-links\">\n            <li><a href=\"/goi-dich-vu\" data-nav=\"/goi-dich-vu\">Gói thành viên & Hỗ trợ</a></li>\n            <li><a href=\"/thanh-toan\" data-nav=\"/thanh-toan\">Thanh toán & Đối soát QR</a></li>\n            <li><a href=\"/ho-tro\" data-nav=\"/ho-tro\">Trung tâm trợ giúp (/ho-tro)</a></li>\n            <li><a href=\"/phap-ly\" data-nav=\"/phap-ly\">Điều khoản & Quyền riêng tư</a></li>\n            <li><a href=\"/phap-ly\" data-nav=\"/phap-ly\">Bảo vệ dữ liệu & Trẻ em</a></li>\n            <li><a href=\"/quan-tri\" data-nav=\"/quan-tri\">Trung tâm quản trị (/quan-tri)</a></li>\n          </ul>\n        </div>\n\n        <div class=\"wb-footer-col\">\n          <h4>Liên hệ Chính thức</h4>\n          <ul class=\"wb-footer-links\" style=\"font-size:13px;color:#E2E2C4;\">\n            <li style=\"margin-bottom:12px;\">\n              <strong style=\"color:#FFFFFF;display:block;\">Liên hệ chính thức & chung:</strong>\n              <a href=\"mailto:wordbridge.education@gmail.com\">wordbridge.education@gmail.com</a>\n            </li>\n            <li style=\"margin-bottom:12px;\">\n              <strong style=\"color:#FFFFFF;display:block;\">Chăm sóc khách hàng & Hỗ trợ:</strong>\n              <a href=\"mailto:cskh@wordbridge.io.vn\">cskh@wordbridge.io.vn</a>\n            </li>\n            <li style=\"margin-bottom:12px;\">\n              <strong style=\"color:#FFFFFF;display:block;\">Hợp tác & Truyền thông:</strong>\n              <a href=\"mailto:contact@wordbridge.io.vn\">contact@wordbridge.io.vn</a>\n            </li>\n          </ul>\n        </div>\n      </div>\n\n      <div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:20px;font-size:13px;color:#E2E2C4;\">\n        <div>© 2026–2027 <strong>WORD BRIDGE</strong>. All rights reserved. Tên miền chính thức duy nhất: <strong>https://wordbridge.io.vn</strong></div>\n        <div>Nhóm sáng lập: Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như</div>\n      </div>\n    </div>\n  </footer>\n\n  <div class=\"wb-toast-container\" id=\"wbToastContainer\" aria-live=\"polite\"></div>\n\n  <script src=\"/js/app-core.js\"></script>\n  <script src=\"/js/views-public-auth.js\"></script>\n  <script src=\"/js/views-learning.js\"></script>\n  <script src=\"/js/views-community-org.js\"></script>\n  <script src=\"/js/views-commerce-exam.js\"></script>\n  <script src=\"/js/views-admin-cms.js\"></script>\n</body>\n</html>\n";

const GB_BYTES = 1024 * 1024 * 1024;
let runtimeMonthlyQuotaGb = null;

async function ensureWorkerD1Schema(d1) {
  if (!d1) return;
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS storage_quotas (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      plan_code TEXT NOT NULL,
      default_quota_bytes INTEGER NOT NULL,
      admin_custom_quota_bytes INTEGER DEFAULT NULL,
      is_unlimited INTEGER NOT NULL DEFAULT 0,
      total_stored_bytes INTEGER NOT NULL DEFAULT 0,
      cycle_month TEXT NOT NULL DEFAULT '2026-11',
      cycle_used_bytes INTEGER NOT NULL DEFAULT 0,
      is_monthly_cycle INTEGER NOT NULL DEFAULT 0,
      quota_reached_at TEXT DEFAULT NULL,
      over_quota_blocked INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(target_type, target_id)
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      template_slug TEXT NOT NULL,
      to_email TEXT NOT NULL,
      from_email TEXT NOT NULL,
      reply_to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      rendered_html TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      retry_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      processed_at TEXT DEFAULT NULL
    )`)
  ]);
}

async function sendResendEmail(env, { to, subject, html, replyTo = 'cskh@wordbridge.io.vn' }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, status: 'provider_unconfigured', reason: 'Chưa cấu hình RESEND_API_KEY trong Cloudflare Worker.' };
  }
  const fromName = env.EMAIL_FROM_NAME || 'WORD BRIDGE – Email tự động từ hệ thống';
  const fromAddr = env.EMAIL_FROM_NOREPLY || 'noreply@wordbridge.io.vn';
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddr}>`,
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo,
      subject,
      html
    })
  });
  const data = await resp.json().catch(() => ({}));
  return {
    sent: resp.ok,
    status: resp.ok ? 'sent' : 'failed',
    provider_id: data.id || null,
    error: resp.ok ? null : (data.message || `HTTP ${resp.status}`)
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Bỏ hoàn toàn trang Sự kiện (/su-kien)
    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/') || pathname.startsWith('/api/events')) {
      return Response.json({
        ok: false,
        error: 'Mục Sự kiện đã được loại bỏ hoàn toàn khỏi kiến trúc WORD BRIDGE.'
      }, { status: 404 });
    }

    // 2. Phục vụ trực tiếp các file ảnh SVG thương hiệu (Đảm bảo 100% không bao giờ lỗi ảnh trên Workers)
    if (EMBEDDED_SVGS[pathname]) {
      return new Response(EMBEDDED_SVGS[pathname], {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    const activeMonthlyQuotaGb = runtimeMonthlyQuotaGb !== null
      ? runtimeMonthlyQuotaGb
      : Number(env.MONTHLY_QUOTA_GB || 50);

    // 3. API Quản lý MONTHLY_QUOTA_GB, D1, R2 và RESEND_API_KEY trên Cloudflare Worker
    if (pathname === '/api/admin/storage/monthly-quota-config') {
      if (request.method === 'GET') {
        return Response.json({
          ok: true,
          monthly_quota_gb: activeMonthlyQuotaGb,
          monthly_quota_bytes: activeMonthlyQuotaGb * GB_BYTES,
          d1_bound: Boolean(env.DB),
          r2_bound: Boolean(env.R2)
        });
      }
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const val = Number(body.monthly_quota_gb);
        if (!Number.isFinite(val) || val <= 0) {
          return Response.json({ ok: false, error: 'MONTHLY_QUOTA_GB phải là số dương hợp lệ.' }, { status: 400 });
        }
        runtimeMonthlyQuotaGb = val;
        if (env.DB) {
          await ensureWorkerD1Schema(env.DB);
          await env.DB.prepare(
            `UPDATE storage_quotas SET default_quota_bytes = ?, updated_at = ? WHERE target_type = 'organization' AND plan_code IN ('org_plus_monthly', 'org_trial')`
          ).bind(val * GB_BYTES, new Date().toISOString()).run();
        }
        return Response.json({
          ok: true,
          monthly_quota_gb: runtimeMonthlyQuotaGb,
          monthly_quota_bytes: runtimeMonthlyQuotaGb * GB_BYTES
        });
      }
    }

    // API lưu/đọc đối tượng trên R2 Bucket ("word")
    if (pathname === '/api/r2/upload' && request.method === 'POST') {
      if (!env.R2) {
        return Response.json({ ok: false, error: 'Chưa gắn R2 binding (R2 -> bucket word).' }, { status: 500 });
      }
      const body = await request.json().catch(() => ({}));
      const key = `uploads/${Date.now()}_${String(body.filename || 'file.txt').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const content = body.content || '';
      await env.R2.put(key, content, {
        httpMetadata: { contentType: body.mime_type || 'text/plain; charset=utf-8' }
      });
      return Response.json({ ok: true, storage_key: key, bucket: 'word' }, { status: 201 });
    }

    // API gửi email qua RESEND_API_KEY trên Worker
    if (pathname === '/api/emails/send' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const result = await sendResendEmail(env, {
        to: body.to_email,
        subject: body.subject || '[WORD BRIDGE] Thông báo từ hệ thống',
        html: body.html || '<p>Thông báo từ WORD BRIDGE (https://wordbridge.io.vn)</p>',
        replyTo: body.reply_to || 'cskh@wordbridge.io.vn'
      });
      return Response.json({ ok: result.sent, ...result }, { status: result.sent ? 200 : 400 });
    }

    // 4. Phục vụ tài nguyên tĩnh qua binding ASSETS của Cloudflare Workers (hoặc fallback HTML)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) return assetRes;
    }

    return new Response(FALLBACK_INDEX_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
