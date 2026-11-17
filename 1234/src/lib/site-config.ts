export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface FeatureMapItem {
  id: string;
  number: string;
  title: string;
  description: string;
  href: string;
  category: "Luyện Nghe & Đọc" | "Từ Vựng & Ngữ Pháp" | "Luyện Đề Thi Thử" | "Tài Liệu & Cộng Đồng";
  status: "ready" | "preview";
  badge?: string;
  stars: number;
  rating: string;
  city: string;
  coords: [number, number]; // lat, lon for 3D globe pins
}

export const siteConfig = {
  brand: {
    name: "WORD BRIDGE",
    shortName: "WORD BRIDGE",
    mascotName: "Mochi",
    tagline: "Nền tảng thực hành tiếng Anh theo chuyên ngành và tình huống nghề nghiệp",
    titleSuffix: "WORD BRIDGE – Thực Hành Tiếng Anh Chuyên Ngành & Tình Huống Nghề Nghiệp",
    description:
      "Nền tảng tự học tiếng Anh và luyện thi TOEIC miễn phí: kho tài liệu chọn lọc, lộ trình ngữ pháp 250–990, phòng luyện đề chuẩn ETS và công cụ đồng bộ tiến độ thông minh.",
    ownerName: "Đoàn Kim Tài",
    founderQuote:
      "LingoChill bắt đầu từ một Fanpage nhỏ chia sẻ tài liệu học tập miễn phí. Càng nhiều bạn tìm đến, tụi mình càng muốn làm nhiều hơn là gửi một đường link: biến việc luyện thi TOEIC mỗi ngày trở nên nhẹ nhàng, có lộ trình và chi phí thấp nhất.",
    email: "admin@lingochill.local",
    hotline: "0948 203 816",
    facebookUrl: "https://facebook.com",
    youtubeUrl: "https://youtube.com",
    zaloUrl: "https://zalo.me",
    year: 2026,
  },
  vietqr: {
    bankId: process.env.NEXT_PUBLIC_VIETQR_BANK_ID || "BIDV",
    accountNo: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "96247KIMTAI3110",
    accountName: process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "DOAN KIM TAI",
    presets: [
      { amount: 20000, label: "Một ly trà đá", tag: "20k" },
      { amount: 50000, label: "Một ly cà phê", tag: "Phổ biến" },
      { amount: 100000, label: "Một bữa trưa", tag: "100k" },
    ],
  },
  navDropdowns: {
    listenRead: [
      { label: "Luyện Đề", href: "/luyen-de", description: "Đề full 200 câu sát đề thật" },
      { label: "Luyện Nghe", href: "/listening", description: "Part 1–4, Lộ trình & Dictation" },
      { label: "Luyện Đọc", href: "/reading", description: "Part 5–7 & Báo song ngữ" },
    ] satisfies NavDropdownItem[],
    vocab: [
      { label: "Bộ từ có sẵn", href: "/vocab/notebook?tab=available", description: "600+ từ TOEIC chọn lọc" },
      { label: "Kho từ của tôi", href: "/vocab/notebook?tab=personal", description: "Thư mục lưu & sổ từ cá nhân" },
      { label: "Lịch ôn từ vựng", href: "/vocab/notebook?tab=review", description: "Nhắc ôn ngắt quãng SRS" },
      { label: "In từ vựng PDF", href: "/vocab/notebook?tab=print", description: "Xuất thẻ học khổ A4" },
    ] satisfies NavDropdownItem[],
    career: [
      { label: "Tình huống 3 lớp", href: "/tinh-huong", description: "Từ vựng, hội thoại, đóng vai & rubric theo ngành", badge: "Mới" },
      { label: "Ghép cặp luyện nói", href: "/ghep-cap", description: "Luyện 1-1 theo ngành, trình độ & lịch hẹn", badge: "VSVC" },
      { label: "Khảo sát H1–H6", href: "/khao-sat", description: "15 câu Phụ lục A & kiểm chứng giả thuyết" },
      { label: "Đề án & Lộ trình", href: "/de-an", description: "Cuộc thi KN TP.HCM 2026–2027 (Mã LV04)" },
      { label: "Gói học Freemium", href: "/goi-hoc", description: "Giai đoạn 0 miễn phí · Dự kiến Giai đoạn 1" },
      { label: "Ứng dụng Android (APK)", href: "/ung-dung-android", description: "Đóng gói từ web · Ký số & Google Play" },
      { label: "Cổng Phụ huynh & GV", href: "/phu-huynh", description: "Xem lịch luyện & giám sát dưới 18 tuổi" },
    ] satisfies NavDropdownItem[],
  },
  primaryNav: [
    { label: "Kho tài liệu", href: "/documents" },
    { label: "Ngữ pháp", href: "/ngu-phap" },
    { label: "Luyện đề TOEIC", href: "/luyen-de", badge: "Hot" },
    { label: "Luyện nghe", href: "/listening" },
    { label: "Luyện đọc", href: "/reading" },
    { label: "Từ vựng", href: "/vocab/notebook" },
  ] satisfies NavItem[],
  heroSpeechBubbles: [
    { word: "easy", meaning: "dễ", text: "Tài liệu này easy (dễ) thiệt á cậu, mở thử coi." },
    { word: "actually", meaning: "thật ra", text: "Actually (thật ra) luôn cậu, chuỗi học này đáng nể ghê." },
    { word: "smoothie", meaning: "sinh tố", text: "Cậu học xong là tớ bao smoothie (sinh tố) luôn, hứa đó." },
    { word: "evening", meaning: "buổi tối", text: "Học vào evening (buổi tối) là hợp nhất đó cậu, đầu óc tỉnh queo." },
  ],
  tickerItems: [
    { text: "Hơn", highlight: "5.000+", tail: "thành viên đã đăng ký học" },
    { text: "Thành lập và phát triển uy tín", highlight: "3", tail: "năm" },
    { text: "Kho tài liệu", highlight: "TOEIC · IIG", tail: "cập nhật liên tục hàng tuần" },
    { text: "Tham gia cùng", highlight: "10.000+", tail: "sĩ tử bứt phá điểm TOEIC mỗi ngày" },
  ],
  featureMap: [
    {
      id: "listening-roadmap",
      number: "01",
      title: "Lộ trình Listening",
      description: "Lộ trình 3 chặng Part 1–4 giúp xây phản xạ nghe tiếng Anh từ 450+ lên 850+.",
      href: "/listening",
      category: "Luyện Nghe & Đọc",
      status: "ready",
      badge: "HOT",
      stars: 5,
      rating: "5.0",
      city: "Tokyo",
      coords: [35.6, 139.7],
    },
    {
      id: "ngu-phap",
      number: "02",
      title: "Lộ trình Ngữ pháp",
      description: "Hệ thống 4 tab cho mỗi chuyên đề: Video, Kiến thức, Từ vựng, Bài tập & Tải PDF.",
      href: "/ngu-phap",
      category: "Từ Vựng & Ngữ Pháp",
      status: "ready",
      badge: "HOT",
      stars: 5,
      rating: "5.0",
      city: "Cape Town",
      coords: [-33.9, 18.4],
    },
    {
      id: "dictation-sentence",
      number: "03",
      title: "Nghe chép từng câu",
      description: "Luyện nghe chi tiết từng câu với audio tốc độ tuỳ chỉnh và kiểm tra chính tả.",
      href: "/listening?mode=dictation",
      category: "Luyện Nghe & Đọc",
      status: "ready",
      stars: 5,
      rating: "5.0",
      city: "Reykjavík",
      coords: [64.1, -21.9],
    },
    {
      id: "bilingual-news",
      number: "04",
      title: "Đọc báo song ngữ",
      description: "Đọc tin tức tiếng Anh theo 5 chặng TOEIC với tra từ nhanh và dịch từng câu.",
      href: "/reading?mode=news",
      category: "Luyện Nghe & Đọc",
      status: "ready",
      stars: 4,
      rating: "4.8",
      city: "Washington, D.C.",
      coords: [38.9, -77.0],
    },
    {
      id: "bilingual-video",
      number: "05",
      title: "Video song ngữ",
      description: "Luyện nghe nhìn qua clip ngắn phụ đề song ngữ và highlight từ khoá quan trọng.",
      href: "/listening?mode=video",
      category: "Luyện Nghe & Đọc",
      status: "ready",
      stars: 4,
      rating: "4.8",
      city: "London",
      coords: [51.5, -0.1],
    },
    {
      id: "dictation-paragraph",
      number: "06",
      title: "Nghe chép đoạn văn",
      description: "Thử thách nghe chép cả đoạn hội thoại Part 3–4 tăng khả năng nhớ ý chính.",
      href: "/listening?mode=paragraph",
      category: "Luyện Nghe & Đọc",
      status: "ready",
      stars: 4,
      rating: "4.9",
      city: "Hà Nội",
      coords: [21.0, 105.8],
    },
    {
      id: "vocab",
      number: "07",
      title: "Ôn Từ vựng",
      description: "Sổ từ vựng theo thư mục, flashcard ôn tập ngắt quãng SRS và xuất PDF khổ A4.",
      href: "/vocab/notebook",
      category: "Từ Vựng & Ngữ Pháp",
      status: "ready",
      stars: 4,
      rating: "4.9",
      city: "TP.HCM",
      coords: [10.8, 106.7],
    },
    {
      id: "skim-scan",
      number: "08",
      title: "Đọc quét & Đọc lướt",
      description: "Rèn kỹ năng Skim & Scan tìm từ khoá loại trừ đáp án nhiễu siêu tốc Part 7.",
      href: "/reading?mode=skim-scan",
      category: "Luyện Đề Thi Thử",
      status: "ready",
      stars: 4,
      rating: "4.7",
      city: "Sydney",
      coords: [-33.8, 151.2],
    },
  ] satisfies FeatureMapItem[],
  quickMapBoxes: [
    { title: "Tài liệu", subtitle: "Kho PDF & sách", href: "/documents" },
    { title: "Luyện nghe", subtitle: "Theo Part 1 – 4", href: "/listening" },
    { title: "Luyện đọc", subtitle: "Theo Part 5 – 7", href: "/reading" },
    { title: "Luyện đề", subtitle: "Đề TOEIC đầy đủ", href: "/luyen-de" },
  ],
  policies: [
    { slug: "dieu-khoan-su-dung", title: "Điều khoản sử dụng" },
    { slug: "bao-ve-du-lieu-ca-nhan", title: "Bảo vệ dữ liệu cá nhân" },
    { slug: "noi-quy-thu-nghiem-kin", title: "Nội quy thử nghiệm kín" },
    { slug: "bao-ve-nguoi-duoi-18-tuoi", title: "Bảo vệ người dưới 18 tuổi" },
    { slug: "thanh-toan", title: "Thanh toán" },
    { slug: "doi-tra-hoan-tien", title: "Đổi trả, hoàn tiền" },
    { slug: "giai-quyet-khieu-nai", title: "Khiếu nại" },
    { slug: "thong-tin-chu-so-huu", title: "Thông tin chủ sở hữu" },
    { slug: "quy-tac-cong-dong", title: "Quy tắc cộng đồng" },
    { slug: "giao-nhan", title: "Giao nhận" },
    { slug: "cong-tac-vien", title: "Chính sách CTV" },
  ],
  startupProject: {
    competition: "Cuộc thi “Học sinh với ý tưởng khởi nghiệp cấp Thành phố” năm học 2026 - 2027",
    organizer: "UBND Thành phố Hồ Chí Minh · Sở Giáo dục và Đào tạo TP.HCM",
    title: "Nền tảng thực hành và kết nối cộng đồng ngoại ngữ",
    fieldCode: "LV04",
    fieldName: "Giáo dục, y tế, văn hóa, du lịch (Mã lĩnh vực: LV04)",
    unit: "Trường Cao đẳng nghề Việt Nam – Singapore (VSVC)",
    proposalDate: "14/11/2026",
    baselineDate: "16/11/2026",
    submissionDeadline: "Trước 23:59 ngày 02/12/2026",
    advisor: "Nguyễn Xuân Tùng",
    legalBases: [
      "Quyết định số 336/QĐ-TTg ngày 25/02/2026 của Thủ tướng Chính phủ phê duyệt Chương trình “Hỗ trợ học sinh, sinh viên khởi nghiệp giai đoạn 2026 - 2035”.",
      "Kế hoạch số 171/KH-UBND ngày 04/05/2026 của UBND TP.HCM triển khai Chương trình “Hỗ trợ học sinh, sinh viên khởi nghiệp” giai đoạn 2026 - 2035.",
      "Kế hoạch của Sở GD&ĐT TP.HCM tổ chức Cuộc thi “Học sinh với ý tưởng khởi nghiệp cấp Thành phố” năm học 2026 - 2027.",
      "Kế hoạch số 15-KH/HSV ngày 10/11/2026 của BCH Hội Sinh viên Việt Nam Trường Cao đẳng nghề Việt Nam - Singapore.",
    ],
    team: [
      {
        name: "Bùi Tấn Lộc",
        roleBadge: "Trưởng nhóm · Phụ trách dữ liệu",
        className: "T25DH2DA",
        phone: "0988504210",
        email: "builoc.contact@gmail.com",
        responsibility:
          "Phát triển web MVP và ứng dụng Android; bảo mật, quyền riêng tư (Luật 91/2025/QH15) và rà soát pháp lý.",
      },
      {
        name: "Cao Anh Nhựt",
        roleBadge: "Thành viên 1",
        className: "T25DH2DA",
        phone: "0867505186",
        email: "2520221328@vsvc.edu.vn",
        responsibility: "Điều phối nhóm; làm việc với nhà trường; hoàn thiện đề án; biên soạn tình huống nghề.",
      },
      {
        name: "Võ Gia Như",
        roleBadge: "Thành viên 2",
        className: "T25DH2DA",
        phone: "0792660105",
        email: "2520221327@vsvc.edu.vn",
        responsibility: "Khảo sát, phỏng vấn sâu, phân tích số liệu H1–H6; dùng thử và cập nhật bảng đối thủ.",
      },
      {
        name: "Vũ Tiến Anh",
        roleBadge: "Thành viên 3",
        className: "T25DH2DA",
        phone: "0933445532",
        email: "2520221302@vsvc.edu.vn",
        responsibility: "Vận hành ghép cặp trong nhóm HSSV của trường; liên hệ giáo viên chuyên môn rà soát nội dung.",
      },
    ],
    majors: [
      "Công nghệ thông tin và công nghệ số",
      "Kế toán, kinh tế và quản trị",
      "Công nghệ ô tô và phương tiện",
      "Cơ khí và chế tạo",
      "Y tế và chăm sóc sức khỏe",
      "Điện, điện tử và tự động hóa",
      "Xây dựng và kiến trúc",
      "Du lịch, nhà hàng và khách sạn",
      "Ẩm thực và công nghệ thực phẩm",
      "Logistics và vận tải",
      "Nông nghiệp và môi trường",
      "Thiết kế và sáng tạo",
      "Làm đẹp và dịch vụ cá nhân",
      "Giáo dục và khoa học xã hội",
      "Pháp luật và hành chính",
      "Các lĩnh vực khác",
      "Điện - Điện tử",
      "Cơ khí",
      "Tin học",
      "Kinh tế - Du lịch"
    ],
    selfLevels: [
      "Mất gốc (A1)",
      "Cơ bản (A2)",
      "Trung bình (B1)",
      "Khá (B2)",
      "Thành thạo (C1)",
    ],
    defaultTimeSlots: [
      "Thứ 2 (19:00 - 19:45)",
      "Thứ 3 (19:30 - 20:15)",
      "Thứ 4 (19:00 - 19:45)",
      "Thứ 5 (19:30 - 20:15)",
      "Thứ 6 (19:00 - 19:45)",
      "Thứ 7 (09:00 - 09:45)",
      "Thứ 7 (14:00 - 14:45)",
      "Chủ nhật (20:00 - 20:45)",
    ],
    customerSegments: [
      {
        code: "N1",
        name: "HSSV trường nghề, cao đẳng",
        description:
          "Học các ngành kỹ thuật, công nghệ, dịch vụ, có thể dưới 18 tuổi. Nhóm thử nghiệm đầu tiên: HSSV Trường Cao đẳng nghề Việt Nam - Singapore.",
        primaryNeed:
          "Tiếng Anh kỹ thuật phục vụ học tập, thực tập, phỏng vấn và làm việc với doanh nghiệp có yếu tố nước ngoài.",
      },
      {
        code: "N2",
        name: "Sinh viên đại học theo các khối ngành chuyên môn",
        description: "CNTT, kỹ thuật, kinh tế, du lịch - khách sạn, y tế và các ngành khác.",
        primaryNeed: "Đọc tài liệu chuyên ngành, thuyết trình, viết email, luyện phỏng vấn bằng tiếng Anh.",
      },
      {
        code: "N3",
        name: "Người đang làm việc chuyên môn",
        description: "Kỹ thuật viên, nhân viên văn phòng, nhân sự các lĩnh vực chuyên môn.",
        primaryNeed: "Giao tiếp công việc, họp, email, làm việc với đối tác nước ngoài; thời gian học linh hoạt.",
      },
    ],
    problems: [
      {
        code: "V1",
        title: "Nội dung chưa sát nghề",
        detail:
          "Giáo trình và ứng dụng phổ thông chủ yếu dạy giao tiếp chung, ít từ vựng và tình huống đặc thù (đọc tài liệu kỹ thuật, báo cáo sự cố, làm việc với khách hàng nước ngoài, phỏng vấn xin việc).",
      },
      {
        code: "V2",
        title: "Thiếu môi trường luyện nói",
        detail: "Người học ngại nói, ít bạn cùng trình độ, ít người sửa lỗi theo ngữ cảnh chuyên ngành.",
      },
      {
        code: "V3",
        title: "Khó duy trì động lực khi học một mình",
        detail: "Không có lịch hẹn và cam kết luyện tập với người khác nên dễ bỏ dở giữa chừng.",
      },
    ],
    competitorMatrix: [
      {
        name: "Duolingo",
        careerContent: "Không",
        realSpeaking: "Không",
        careerCommunity: "Không",
        lowCost: "Có",
        vietnameseUi: "Có",
        strengths: "Thương hiệu lớn, trò chơi hóa tốt, có bản miễn phí, giao diện tiếng Việt.",
        weaknesses: "Nội dung phổ thông, không theo ngành nghề; không có luyện nói với người thật.",
      },
      {
        name: "ELSA Speak",
        careerContent: "Một phần",
        realSpeaking: "Không",
        careerCommunity: "Không",
        lowCost: "Một phần",
        vietnameseUi: "Có",
        strengths: "Luyện phát âm có chấm điểm bằng AI, quen thuộc với người học Việt Nam.",
        weaknesses: "Luyện một mình với AI; không có cộng đồng cùng ngành; phần lớn tính năng cần trả phí.",
      },
      {
        name: "HelloTalk, Tandem",
        careerContent: "Không",
        realSpeaking: "Có",
        careerCommunity: "Không",
        lowCost: "Một phần",
        vietnameseUi: "Cần kiểm chứng",
        strengths: "Kết nối người học với người bản ngữ trên toàn cầu, trò chuyện thực tế.",
        weaknesses: "Ghép theo sở thích, không theo ngành; chất lượng trò chuyện không ổn định; thiếu cấu trúc.",
      },
      {
        name: "Gia sư trực tuyến (italki, Preply, Cambly)",
        careerContent: "Một phần",
        realSpeaking: "Có",
        careerCommunity: "Không",
        lowCost: "Không",
        vietnameseUi: "Một phần",
        strengths: "Có người sửa trực tiếp, linh hoạt lịch.",
        weaknesses: "Trả phí theo giờ, chi phí cao với HSSV; chuyên ngành phụ thuộc từng gia sư.",
      },
      {
        name: "AI hội thoại & YouTube",
        careerContent: "Một phần",
        realSpeaking: "Không",
        careerCommunity: "Không",
        lowCost: "Có",
        vietnameseUi: "Có",
        strengths: "Miễn phí hoặc chi phí thấp, dùng được ngay, có thể yêu cầu tình huống theo ngành.",
        weaknesses: "Người học phải tự thiết kế bài tập, không có lịch hẹn, không có người cùng luyện.",
      },
      {
        name: "Dự án (Mục tiêu thiết kế)",
        careerContent: "Có",
        realSpeaking: "Có (ngang hàng)",
        careerCommunity: "Có",
        lowCost: "Có",
        vietnameseUi: "Có",
        strengths: "Kết hợp tình huống nghề đã rà soát + luyện cặp có kịch bản & rubric + cộng đồng tin cậy.",
        weaknesses: "Đang trong giai đoạn kiểm chứng giả thuyết H1–H6 và thử nghiệm kín 0a/0b.",
      },
    ],
    judgeFaqs: [
      {
        q: "Sao không dùng Duolingo kết hợp ChatGPT?",
        a: "Làm được, nhưng người học phải tự thiết kế tình huống, không có lịch hẹn và người cùng luyện. Dự án cung cấp tình huống nghề đã rà soát và lịch luyện cố định. Giả thuyết H1, H3 sẽ cho biết người học có thực sự thấy thiếu điều này không.",
      },
      {
        q: "Khác gì HelloTalk, Tandem?",
        a: "Các ứng dụng này kết nối toàn cầu theo sở thích. Dự án ghép cùng ngành, cùng trình độ, có kịch bản và rubric, trong cộng đồng kiểm soát được (cùng trường, khoa, lớp).",
      },
      {
        q: "Nếu đối thủ lớn thêm nội dung theo ngành thì sao?",
        a: "Có thể xảy ra. Lợi thế của nhóm là nội dung bám chương trình nghề Việt Nam, quan hệ với khoa, giáo viên chuyên môn và cộng đồng HSSV tại trường; mức độ bền vững sẽ được kiểm tra bằng tỷ lệ quay lại ở thử nghiệm.",
      },
      {
        q: "Có bằng chứng nhu cầu chưa?",
        a: "Nhóm đã tích hợp bộ khảo sát 15 câu (Phụ lục A) và tiêu chí chấp nhận H1–H6 rõ ràng ngay trên hệ thống; số liệu thực tế đang được thu thập (17–24/11/2026) để cập nhật trước hạn 02/12/2026.",
      },
    ],
    roadmapPhases: [
      {
        phase: "0a. Thử nghiệm thủ công (Concierge Test)",
        time: "20/11 - 25/11/2026",
        scope: "Khoa Tin học đại cương và một số khoa khác tại VSVC (bắt đầu 8–10 người).",
        exitCriteria: "Có người quay lại luyện lần 2; thu được phản hồi quy trình ghép cặp tay.",
      },
      {
        phase: "0b. MVP web, thử nghiệm kín",
        time: "25/11 - 15/12/2026",
        scope: "Học sinh, sinh viên toàn Trường Cao đẳng nghề Việt Nam - Singapore.",
        exitCriteria: "Đạt chỉ tiêu 0b (≥50 thành viên, ≥30 buổi, ≥70% hoàn thành, ≥40% giữ chân tuần 2, ≥4/5 hài lòng); hoàn tất rà soát pháp lý mục VIII.",
      },
      {
        phase: "1. Mở rộng, ứng dụng Android (APK) & gói trả phí",
        time: "Trong năm 2027",
        scope: "Mở rộng sang các khoa, ngành và trường khác; phát hành APK (ưu tiên Google Play); mở gói trả phí cho cá nhân.",
        exitCriteria: "Đạt chỉ tiêu 0b; có quy trình kiểm duyệt; xác nhận pháp lý về thu phí và ứng dụng.",
      },
      {
        phase: "2. Hoàn thiện, cộng đồng mở",
        time: "Sau khi hoàn tất thủ tục",
        scope: "Mở cho người học và người đi làm ngoài trường; bổ sung ngôn ngữ mới (Nhật, Hàn, Trung).",
        exitCriteria: "Xác thực số điện thoại theo NĐ 147/2024/NĐ-CP; giấy phép nếu thuộc diện bắt buộc.",
      },
    ],
    freemiumPlans: {
      freeFeatures: [
        "Truy cập tình huống nghề nghiệp cơ bản theo ngành (Điện - Điện tử, Cơ khí, Tin học)",
        "Ghép cặp luyện nói theo lịch hẹn (giới hạn số buổi mỗi tuần trong giai đoạn mở rộng)",
        "Kịch bản đóng vai A/B & Phiếu nhận xét theo rubric 5 tiêu chí",
        "Học từ vựng chuyên ngành, phát âm mẫu và Sổ tay từ vựng SRS",
        "Kho tài liệu, ngữ pháp & đề luyện tập miễn phí có sẵn trên nền tảng",
        "Đầy đủ lớp bảo vệ người dưới 18 tuổi, nút báo cáo vi phạm & chặn",
      ],
      proFeatures: [
        "Toàn bộ thư viện tình huống chuyên sâu của mọi ngành (bao gồm bộ phỏng vấn FDI & datasheet nâng cao)",
        "Ghép cặp ưu tiên theo khung giờ linh hoạt & không giới hạn số buổi luyện",
        "Nhận xét trực tiếp từ mentor / giáo viên chuyên môn trên bài luyện",
        "Lộ trình cá nhân hóa theo đúng vị trí việc làm mục tiêu",
        "Mô-đun luyện phỏng vấn xin việc 1-1 chuyên sâu",
        "Chứng nhận hoàn thành lộ trình thực hành ngoại ngữ nghề",
        "Học ngoại tuyến (offline) trên ứng dụng Android (APK / Google Play)",
      ],
    },
    aiDeclaration:
      "Nhóm cam kết ý tưởng do nhóm đề xuất và thực hiện tại Trường Cao đẳng nghề Việt Nam - Singapore; không sao chép, không vi phạm sở hữu trí tuệ, kê khai rõ nguồn dữ liệu. Công cụ AI chỉ hỗ trợ rà soát ngữ pháp tiếng Anh trong các mẫu hội thoại nghề và tăng tốc lập trình giao diện web dưới sự kiểm soát, biên tập trực tiếp của nhóm và giáo viên hướng dẫn Nguyễn Xuân Tùng.",
  },
};


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
export const DEFAULT_PRACTICE_RUBRIC: ScenarioRubricItem[] = [
  { id: "terminology", criterion: "Thuật ngữ chuyên ngành", description: "Dùng đúng và tự nhiên các từ vựng, cụm từ kỹ thuật/nghề nghiệp của tình huống.", maxScore: 5 },
  { id: "clarity", criterion: "Độ rõ ràng & Phát âm", description: "Phát âm dễ hiểu, nhấn trọng âm đúng các từ khoá kỹ thuật, tốc độ vừa phải.", maxScore: 5 },
  { id: "task_completion", criterion: "Hoàn thành nhiệm vụ vai diễn", description: "Giải quyết trọn vẹn các yêu cầu trong kịch bản Vai A / Vai B.", maxScore: 5 },
  { id: "interaction", criterion: "Phản xạ & Tương tác", description: "Lắng nghe, hỏi lại xác nhận thông tin và phối hợp nhịp nhàng với bạn luyện.", maxScore: 5 },
  { id: "professionalism", criterion: "Thái độ & Tác phong nghề nghiệp", description: "Lịch sự, đúng ngữ cảnh giao tiếp tại xưởng/văn phòng/doanh nghiệp.", maxScore: 5 },
];
