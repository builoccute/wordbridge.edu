/**
 * @file src/services/domains.js
 * @description Hệ thống 20 Chế độ Dịch thuật Chuyên ngành (Specialized Translation Domains).
 * Cơ chế:
 *   - Cho phép lựa chọn chuyên ngành trước khi dịch.
 *   - Áp dụng bộ thuật ngữ chuyên ngành công khai được cấu hình sẵn (Stateless Public Glossary)
 *     để duy trì tính nhất quán thuật ngữ và văn phong trong cùng một lần dịch.
 *   - Tuyệt đối KHÔNG xây dựng từ điển cá nhân lưu dữ liệu người dùng.
 */

export const SPECIALIZED_DOMAINS = Object.freeze([
  {
    id: "general",
    order: 20,
    name: "Tổng quát & Chuyên môn khác",
    nameEn: "General & Other Specializations",
    styleGuide: "Tự nhiên, rõ ràng, giữ nguyên cấu trúc câu và ngữ cảnh giao tiếp chuẩn xác.",
    glossaryViToEn: {
      "hệ thống dịch thuật toàn cầu": "global translation platform",
      "chính sách không lưu trữ dữ liệu": "zero user data storage policy",
      "kết nối ngôn ngữ": "connecting languages"
    },
    glossaryEnToVi: {
      "global translation platform": "nền tảng dịch thuật toàn cầu",
      "zero user data storage policy": "chính sách không lưu trữ dữ liệu người dùng",
      "artificial intelligence": "trí tuệ nhân tạo"
    }
  },
  {
    id: "economics",
    order: 1,
    name: "1. Kinh tế",
    nameEn: "Economics",
    styleGuide: "Chuẩn học thuật kinh tế vĩ mô và vi mô, bảo toàn các chỉ số tăng trưởng và thuật ngữ thị trường.",
    glossaryViToEn: {
      "tổng sản phẩm quốc nội": "gross domestic product (GDP)",
      "lạm phát cơ bản": "core inflation",
      "chính sách tiền tệ": "monetary policy",
      "chính sách tài khóa": "fiscal policy",
      "cán cân thương mại": "balance of trade",
      "tăng trưởng kinh tế bền vững": "sustainable economic growth",
      "kinh tế vĩ mô": "macroeconomics"
    },
    glossaryEnToVi: {
      "gross domestic product": "tổng sản phẩm quốc nội (GDP)",
      "core inflation": "lạm phát cơ bản",
      "monetary policy": "chính sách tiền tệ",
      "fiscal policy": "chính sách tài khóa",
      "balance of trade": "cán cân thương mại",
      "sustainable economic growth": "tăng trưởng kinh tế bền vững",
      "macroeconomics": "kinh tế vĩ mô"
    }
  },
  {
    id: "finance",
    order: 2,
    name: "2. Tài chính",
    nameEn: "Finance & Banking",
    styleGuide: "Chính xác tuyệt đối về thuật ngữ ngân hàng, đầu tư, dòng tiền, tỷ suất sinh lời và quản trị rủi ro.",
    glossaryViToEn: {
      "tỷ suất hoàn vốn": "return on investment (ROI)",
      "dòng tiền chiết khấu": "discounted cash flow (DCF)",
      "thanh khoản thị trường": "market liquidity",
      "quản trị rủi ro tín dụng": "credit risk management",
      "vốn chủ sở hữu": "shareholders' equity",
      "trái phiếu doanh nghiệp": "corporate bonds"
    },
    glossaryEnToVi: {
      "return on investment": "tỷ suất hoàn vốn (ROI)",
      "discounted cash flow": "dòng tiền chiết khấu (DCF)",
      "market liquidity": "thanh khoản thị trường",
      "credit risk management": "quản trị rủi ro tín dụng",
      "shareholders' equity": "vốn chủ sở hữu",
      "corporate bonds": "trái phiếu doanh nghiệp"
    }
  },
  {
    id: "accounting",
    order: 3,
    name: "3. Kế toán",
    nameEn: "Accounting & Auditing",
    styleGuide: "Tuân thủ chuẩn mực báo cáo tài chính quốc tế (IFRS) và chuẩn mực kế toán doanh nghiệp.",
    glossaryViToEn: {
      "bảng cân đối kế toán": "balance sheet",
      "báo cáo kết quả hoạt động kinh doanh": "income statement",
      "báo cáo lưu chuyển tiền tệ": "cash flow statement",
      "khấu hao tài sản cố định": "depreciation of fixed assets",
      "khoản phải thu khách hàng": "accounts receivable",
      "khoản phải trả nhà cung cấp": "accounts payable",
      "kiểm toán độc lập": "independent audit"
    },
    glossaryEnToVi: {
      "balance sheet": "bảng cân đối kế toán",
      "income statement": "báo cáo kết quả hoạt động kinh doanh",
      "cash flow statement": "báo cáo lưu chuyển tiền tệ",
      "depreciation of fixed assets": "khấu hao tài sản cố định",
      "accounts receivable": "khoản phải thu khách hàng",
      "accounts payable": "khoản phải trả nhà cung cấp",
      "independent audit": "kiểm toán độc lập"
    }
  },
  {
    id: "legal",
    order: 4,
    name: "4. Luật",
    nameEn: "Legal & Contracts",
    styleGuide: "Văn phong pháp lý chặt chẽ, chuẩn thuật ngữ hợp đồng, điều khoản chế tài và quyền sở hữu trí tuệ.",
    glossaryViToEn: {
      "bất khả kháng": "force majeure",
      "bồi thường thiệt hại": "indemnification and damages",
      "quyền sở hữu trí tuệ": "intellectual property rights",
      "thỏa thuận bảo mật thông tin": "non-disclosure agreement (NDA)",
      "giải quyết tranh chấp": "dispute resolution",
      "hiệu lực pháp lý": "legal validity",
      "bên vi phạm hợp đồng": "breaching party"
    },
    glossaryEnToVi: {
      "force majeure": "sự kiện bất khả kháng",
      "intellectual property rights": "quyền sở hữu trí tuệ",
      "non-disclosure agreement": "thỏa thuận bảo mật thông tin (NDA)",
      "dispute resolution": "giải quyết tranh chấp",
      "legal validity": "hiệu lực pháp lý",
      "breach of contract": "vi phạm hợp đồng"
    }
  },
  {
    id: "education",
    order: 5,
    name: "5. Giáo dục",
    nameEn: "Education & Pedagogy",
    styleGuide: "Chuẩn sư phạm, chương trình đào tạo, kiểm định chất lượng giáo dục và học thuật.",
    glossaryViToEn: {
      "chương trình đào tạo": "curriculum",
      "chuẩn đầu ra": "learning outcomes",
      "kiểm định chất lượng giáo dục": "educational quality accreditation",
      "học tập suốt đời": "lifelong learning",
      "phương pháp sư phạm": "pedagogical methodology"
    },
    glossaryEnToVi: {
      "curriculum": "chương trình đào tạo",
      "learning outcomes": "chuẩn đầu ra",
      "educational quality accreditation": "kiểm định chất lượng giáo dục",
      "lifelong learning": "học tập suốt đời",
      "pedagogical methodology": "phương pháp sư phạm"
    }
  },
  {
    id: "medical",
    order: 6,
    name: "6. Y tế",
    nameEn: "Medical & Healthcare",
    styleGuide: "Chính xác về thuật ngữ lâm sàng, dược học, chẩn đoán y khoa và phác đồ điều trị.",
    glossaryViToEn: {
      "chẩn đoán lâm sàng": "clinical diagnosis",
      "phác đồ điều trị": "treatment regimen",
      "chống chỉ định": "contraindications",
      "tác dụng không mong muốn": "adverse reactions",
      "thử nghiệm lâm sàng": "clinical trial",
      "hồ sơ bệnh án": "medical record"
    },
    glossaryEnToVi: {
      "clinical diagnosis": "chẩn đoán lâm sàng",
      "treatment regimen": "phác đồ điều trị",
      "contraindications": "chống chỉ định",
      "adverse reactions": "tác dụng không mong muốn",
      "clinical trial": "thử nghiệm lâm sàng"
    }
  },
  {
    id: "it",
    order: 7,
    name: "7. Công nghệ thông tin",
    nameEn: "Information Technology & Cloud",
    styleGuide: "Bảo toàn thuật ngữ kỹ thuật phần mềm, kiến trúc điện toán đám mây, API, bảo mật và cơ sở dữ liệu.",
    glossaryViToEn: {
      "kiến trúc điện toán biên": "edge computing architecture",
      "cơ sở dữ liệu phân tán": "distributed database",
      "xác thực đa yếu tố": "multi-factor authentication (MFA)",
      "mã hóa đầu cuối": "end-to-end encryption",
      "giao diện lập trình ứng dụng": "application programming interface (API)",
      "không lưu trữ dữ liệu người dùng": "zero user data storage",
      "bộ nhớ tạm thời": "ephemeral in-memory buffer"
    },
    glossaryEnToVi: {
      "edge computing architecture": "kiến trúc điện toán biên",
      "distributed database": "cơ sở dữ liệu phân tán",
      "multi-factor authentication": "xác thực đa yếu tố (MFA)",
      "end-to-end encryption": "mã hóa đầu cuối",
      "application programming interface": "giao diện lập trình ứng dụng (API)",
      "zero user data storage": "không lưu trữ dữ liệu người dùng",
      "ephemeral in-memory buffer": "bộ nhớ đệm tạm thời trên RAM"
    }
  },
  {
    id: "engineering",
    order: 8,
    name: "8. Kỹ thuật",
    nameEn: "Engineering & Mechanics",
    styleGuide: "Chuẩn thông số kỹ thuật cơ khí, điện - điện tử, tự động hóa và tiêu chuẩn ISO/IEC.",
    glossaryViToEn: {
      "dung sai kỹ thuật": "engineering tolerance",
      "hệ thống điều khiển tự động": "automatic control system",
      "bảo trì dự đoán": "predictive maintenance",
      "thông số kỹ thuật": "technical specifications"
    },
    glossaryEnToVi: {
      "engineering tolerance": "dung sai kỹ thuật",
      "automatic control system": "hệ thống điều khiển tự động",
      "predictive maintenance": "bảo trì dự đoán",
      "technical specifications": "thông số kỹ thuật"
    }
  },
  {
    id: "science",
    order: 9,
    name: "9. Khoa học",
    nameEn: "Scientific Research",
    styleGuide: "Văn phong công bố khoa học quốc tế, khách quan, chuẩn thuật ngữ thực nghiệm và định lượng.",
    glossaryViToEn: {
      "giả thuyết nghiên cứu": "research hypothesis",
      "phân tích định lượng": "quantitative analysis",
      "độ lệch chuẩn": "standard deviation",
      "phản biện đồng cấp": "peer review"
    },
    glossaryEnToVi: {
      "research hypothesis": "giả thuyết nghiên cứu",
      "quantitative analysis": "phân tích định lượng",
      "standard deviation": "độ lệch chuẩn",
      "peer review": "phản biện đồng cấp"
    }
  },
  {
    id: "environment",
    order: 10,
    name: "10. Môi trường",
    nameEn: "Environment & Sustainability",
    styleGuide: "Chuẩn thuật ngữ phát triển bền vững ESG, biến đổi khí hậu, năng lượng tái tạo và đánh giá tác động môi trường.",
    glossaryViToEn: {
      "đánh giá tác động môi trường": "environmental impact assessment (EIA)",
      "phát thải ròng bằng không": "net-zero emissions",
      "năng lượng tái tạo": "renewable energy",
      "đa dạng sinh học": "biodiversity"
    },
    glossaryEnToVi: {
      "environmental impact assessment": "đánh giá tác động môi trường (ĐTM)",
      "net-zero emissions": "phát thải ròng bằng không (Net Zero)",
      "renewable energy": "năng lượng tái tạo",
      "biodiversity": "đa dạng sinh học"
    }
  },
  {
    id: "construction",
    order: 11,
    name: "11. Xây dựng",
    nameEn: "Construction & Civil Engineering",
    styleGuide: "Chuẩn thuật ngữ kết cấu công trình, dự toán xây dựng, hồ sơ mời thầu và giám sát thi công.",
    glossaryViToEn: {
      "kết cấu bê tông cốt thép": "reinforced concrete structure",
      "hồ sơ thiết kế bản vẽ thi công": "construction drawing design dossier",
      "nghiệm thu công trình": "construction acceptance",
      "tổng thầu thi công": "general contractor"
    },
    glossaryEnToVi: {
      "reinforced concrete structure": "kết cấu bê tông cốt thép",
      "construction acceptance": "nghiệm thu công trình",
      "general contractor": "tổng thầu thi công",
      "bill of quantities": "bảng tiên lượng dự toán (BOQ)"
    }
  },
  {
    id: "tourism",
    order: 12,
    name: "12. Du lịch",
    nameEn: "Tourism & Hospitality",
    styleGuide: "Văn phong lữ hành, khách sạn và văn hóa điểm đến sinh động, lịch sự, chuẩn thuật ngữ dịch vụ quốc tế.",
    glossaryViToEn: {
      "di sản văn hóa thế giới": "world cultural heritage",
      "du lịch sinh thái bền vững": "sustainable ecotourism",
      "lịch trình tham quan": "travel itinerary"
    },
    glossaryEnToVi: {
      "world cultural heritage": "di sản văn hóa thế giới",
      "sustainable ecotourism": "du lịch sinh thái bền vững",
      "travel itinerary": "lịch trình tham quan"
    }
  },
  {
    id: "media",
    order: 13,
    name: "13. Truyền thông",
    nameEn: "Media & Communications",
    styleGuide: "Sắc bén, chuẩn thuật ngữ báo chí, quan hệ công chúng (PR), truyền thông số và thương hiệu.",
    glossaryViToEn: {
      "thông cáo báo chí": "press release",
      "nhận diện thương hiệu": "brand identity",
      "truyền thông đa phương tiện": "multimedia communications"
    },
    glossaryEnToVi: {
      "press release": "thông cáo báo chí",
      "brand identity": "nhận diện thương hiệu",
      "multimedia communications": "truyền thông đa phương tiện"
    }
  },
  {
    id: "administration",
    order: 14,
    name: "14. Hành chính",
    nameEn: "Public Administration",
    styleGuide: "Trang trọng, chuẩn thể thức văn bản hành chính nhà nước, công văn, quyết định và thủ tục công vụ.",
    glossaryViToEn: {
      "cải cách thủ tục hành chính": "administrative procedure reform",
      "dịch vụ công trực tuyến": "online public service",
      "văn bản quy phạm pháp luật": "legal normative document"
    },
    glossaryEnToVi: {
      "administrative procedure reform": "cải cách thủ tục hành chính",
      "online public service": "dịch vụ công trực tuyến",
      "legal normative document": "văn bản quy phạm pháp luật"
    }
  },
  {
    id: "commerce",
    order: 15,
    name: "15. Thương mại",
    nameEn: "Commerce & International Trade",
    styleGuide: "Chuẩn thuật ngữ ngoại thương, Incoterms, xuất nhập khẩu, thương mại điện tử và hợp đồng mua bán hàng hóa.",
    glossaryViToEn: {
      "tín dụng thư không hủy ngang": "irrevocable letter of credit (L/C)",
      "giấy chứng nhận xuất xứ": "certificate of origin (C/O)",
      "thương mại xuyên biên giới": "cross-border e-commerce"
    },
    glossaryEnToVi: {
      "irrevocable letter of credit": "tín dụng thư không hủy ngang (L/C)",
      "certificate of origin": "giấy chứng nhận xuất xứ (C/O)",
      "cross-border e-commerce": "thương mại điện tử xuyên biên giới"
    }
  },
  {
    id: "diplomacy",
    order: 16,
    name: "16. Ngoại giao",
    nameEn: "Diplomacy & International Relations",
    styleGuide: "Trọng thị, chuẩn nghi thức ngoại giao, công hàm, hiệp định song phương và đa phương.",
    glossaryViToEn: {
      "đối tác chiến lược toàn diện": "comprehensive strategic partnership",
      "biên bản ghi nhớ hợp tác": "memorandum of understanding (MoU)",
      "công hàm ngoại giao": "diplomatic note"
    },
    glossaryEnToVi: {
      "comprehensive strategic partnership": "đối tác chiến lược toàn diện",
      "memorandum of understanding": "biên bản ghi nhớ hợp tác (MoU)",
      "diplomatic note": "công hàm ngoại giao"
    }
  },
  {
    id: "agriculture",
    order: 17,
    name: "17. Nông nghiệp",
    nameEn: "Agriculture & Agrotech",
    styleGuide: "Chuẩn thuật ngữ nông học, nông nghiệp công nghệ cao, truy xuất nguồn gốc và kiểm dịch thực vật.",
    glossaryViToEn: {
      "nông nghiệp công nghệ cao": "high-tech agriculture",
      "kiểm dịch thực vật": "phytosanitary inspection",
      "truy xuất nguồn gốc nông sản": "agricultural product traceability"
    },
    glossaryEnToVi: {
      "high-tech agriculture": "nông nghiệp công nghệ cao",
      "phytosanitary inspection": "kiểm dịch thực vật",
      "agricultural product traceability": "truy xuất nguồn gốc nông sản"
    }
  },
  {
    id: "logistics",
    order: 18,
    name: "18. Logistics",
    nameEn: "Logistics & Supply Chain",
    styleGuide: "Chuẩn thuật ngữ vận tải đa phương thức, vận đơn (B/L), thông quan hải quan và quản trị chuỗi cung ứng.",
    glossaryViToEn: {
      "vận đơn đường biển": "ocean bill of lading (B/L)",
      "thông quan hải quan": "customs clearance",
      "quản trị chuỗi cung ứng": "supply chain management",
      "vận tải đa phương thức": "multimodal transport"
    },
    glossaryEnToVi: {
      "bill of lading": "vận đơn (B/L)",
      "customs clearance": "thông quan hải quan",
      "supply chain management": "quản trị chuỗi cung ứng",
      "multimodal transport": "vận tải đa phương thức"
    }
  },
  {
    id: "manufacturing",
    order: 19,
    name: "19. Sản xuất",
    nameEn: "Manufacturing & Quality Control",
    styleGuide: "Chuẩn thuật ngữ dây chuyền sản xuất tinh gọn (Lean), kiểm soát chất lượng QA/QC và quản lý nhà máy.",
    glossaryViToEn: {
      "sản xuất tinh gọn": "lean manufacturing",
      "kiểm soát chất lượng toàn diện": "total quality management (TQM)",
      "dây chuyền lắp ráp tự động": "automated assembly line"
    },
    glossaryEnToVi: {
      "lean manufacturing": "sản xuất tinh gọn (Lean)",
      "total quality management": "quản trị chất lượng toàn diện (TQM)",
      "automated assembly line": "dây chuyền lắp ráp tự động"
    }
  }
]);

export function getDomainById(domainId) {
  const normalized = String(domainId || "general").trim().toLowerCase();
  return (
    SPECIALIZED_DOMAINS.find((d) => d.id === normalized) ||
    SPECIALIZED_DOMAINS[0]
  );
}

/**
 * Xây dựng chỉ dẫn ngữ cảnh (System Instruction) cho công cụ AI/NMT theo chuyên ngành đã chọn.
 */
export function buildDomainPromptInstruction(domainId, sourceLang, targetLang) {
  const domain = getDomainById(domainId);
  return (
    `Translate strictly from ${sourceLang} to ${targetLang} in the specialized domain of "${domain.nameEn}" (${domain.name}). ` +
    `Style requirement: ${domain.styleGuide} ` +
    `Maintain strict terminology consistency across all paragraphs, preserve line breaks, numbers, and URLs, and output only the translated text.`
  );
}
