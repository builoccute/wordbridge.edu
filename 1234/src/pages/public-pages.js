import { renderPublicPage } from '../layouts/site-layout.js';
import { escapeHtml, htmlResponse } from '../utils/http.js';
import { signInUrl } from '../config/constants.js';

/**
 * WORD BRIDGE — Specialized Learning Environment + Learner Meet discovery.
 * The 12 JSON corpora remain the source-backed foundation. Modules without
 * verified content stay explicitly unavailable instead of fabricating lessons.
 */





export const SPECIALIZED_VOCAB_DOMAINS = [
  { slug: 'ke-toan-doanh-nghiep', pack: 'digital-business', nameVi: 'Kế toán Doanh nghiệp', count: 1000, topicsCount: 10, sample: 'account, balance sheet, general ledger, depreciation' },
  { slug: 'quan-tri-mang-may-tinh', pack: 'digital-business', nameVi: 'Quản trị Mạng Máy tính', count: 1000, topicsCount: 10, sample: 'application layer, firewall, subnet mask, routing protocol' },
  { slug: 'cong-nghe-o-to', pack: 'mechanical', nameVi: 'Công nghệ Ô tô', count: 1000, topicsCount: 7, sample: 'internal combustion engine, turbocharger, ABS, crankshaft' },
  { slug: 'ky-thuat-may-lanh-dhkk', pack: 'mechanical', nameVi: 'Kỹ thuật Máy lạnh & ĐHKK', count: 1000, topicsCount: 8, sample: 'refrigeration cycle, compressor, evaporator, condenser' },
  { slug: 'sua-chua-lap-rap-may-tinh', pack: 'digital-business', nameVi: 'Sửa chữa & Lắp ráp Máy tính', count: 1012, topicsCount: 21, sample: 'motherboard, BIOS, thermal paste, power supply unit' },
  { slug: 'thiet-ke-do-hoa', pack: 'digital-business', nameVi: 'Thiết kế Đồ họa', count: 1017, topicsCount: 15, sample: 'graphic design, typography, kerning, vector graphics' },
  { slug: 'dien-cong-nghiep', pack: 'industrial', nameVi: 'Điện Công nghiệp', count: 1012, topicsCount: 17, sample: 'transformer, circuit breaker, three-phase motor, switchgear' },
  { slug: 'dien-tu-cong-nghiep', pack: 'industrial', nameVi: 'Điện tử Công nghiệp', count: 1015, topicsCount: 19, sample: 'semiconductor, transistor, microcontroller, oscilloscope' },
  { slug: 'co-dien-tu', pack: 'industrial', nameVi: 'Cơ Điện tử', count: 1023, topicsCount: 17, sample: 'mechatronics, actuator, servo motor, PLC automation' },
  { slug: 'cat-got-kim-loai', pack: 'mechanical', nameVi: 'Cắt gọt Kim loại', count: 1005, topicsCount: 17, sample: 'metal cutting, lathe, milling machine, CNC spindle' },
  { slug: 'nguoi-sua-chua-may-cong-cu', pack: 'mechanical', nameVi: 'Nguội Sửa chữa Máy công cụ', count: 1013, topicsCount: 17, sample: 'bench work, vernier caliper, tolerance, surface scraping' },
  { slug: 'bao-tri-thiet-bi-co-dien', pack: 'industrial', nameVi: 'Bảo trì Thiết bị Cơ điện', count: 1007, topicsCount: 12, sample: 'preventive maintenance, vibration analysis, bearing alignment' },
];

export async function loadDomainDataset(env, origin, domain) {
  const selected = SPECIALIZED_VOCAB_DOMAINS.find(row => row.slug === domain);
  if (!selected) return null;
  const assetPath='/data/vocab/'+selected.pack+'.json';
  const asset=env.ASSETS ? await env.ASSETS.fetch(new Request(new URL(assetPath,origin))) : await env.STATIC_ASSETS_LOADER?.('/public'+assetPath);
  if (!asset || asset.ok===false) throw new Error('DOMAIN_DATA_UNAVAILABLE');
  const pack=asset.json ? await asset.json() : JSON.parse(new TextDecoder().decode(asset.body));
  const data=pack[domain];
  if (!Array.isArray(data?.words)) throw new Error('DOMAIN_DATA_INVALID');
  return data;
}

function unavailableModule(title, description) {
  return `<article class="wb-module-state" aria-disabled="true"><div><p class="wb-eyebrow">CHƯA CÓ NỘI DUNG ĐÃ XÁC MINH</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div><span class="wb-badge">Not available</span></article>`;
}

export async function renderSpecializedPage({ db, user, subSlug = '', runtime = null }) {
  if (subSlug === 'russian' || subSlug === 'ru') {
    return htmlResponse(renderPublicPage({
      title: 'Không hỗ trợ chuyên ngành Tiếng Nga', currentPath: `/specialized/${subSlug}`, user, runtime,
      contentHtml: '<section class="wb-alert wb-alert-error"><h1>Chuyên ngành Tiếng Nga chưa được hỗ trợ</h1><p>Dữ liệu chuyên ngành hiện có chỉ dành cho các lĩnh vực Tiếng Anh/Tiếng Trung. Bạn vẫn có thể học chương trình Tiếng Nga nền tảng.</p><a href="/learning/russian" class="wb-btn wb-btn-outline">Xem chương trình Tiếng Nga</a></section>',
    }), 404);
  }

  const matched = SPECIALIZED_VOCAB_DOMAINS.find((d) => d.slug === subSlug);
  if (matched) {
    let relatedPrograms = [];
    if (db) {
      relatedPrograms = (await db.prepare(`SELECT p.slug,p.name_vi AS title_vi,p.language_code FROM wb_programs p WHERE p.review_status='published' AND lower(p.program_type) LIKE '%special%' ORDER BY p.name_vi`).all()).results || [];
    }
    const authCta = user
      ? '<a href="#wb-vocab-explorer" class="wb-btn wb-btn-primary">Bắt đầu với nền tảng thuật ngữ</a>'
      : `<a href="${signInUrl(`/specialized/${matched.slug}`, 'specialized.learn')}" class="wb-btn wb-btn-primary">Đăng nhập để bắt đầu học</a>`;

    const contentHtml = `
      <section class="wb-learning-landing">
        <p class="wb-eyebrow">SPECIALIZED LEARNING ENVIRONMENT · ${matched.count.toLocaleString('vi-VN')} TERMS · ${matched.topicsCount} TOPICS</p>
        <h1>${escapeHtml(matched.nameVi)}</h1>
        <p>Nền tảng hiện có dữ liệu thuật ngữ có cấu trúc cho lĩnh vực này. Các module kỹ năng chỉ được bật khi source/API có nội dung thật tương ứng.</p>
        <div class="wb-inline-actions"><a href="/specialized" class="wb-btn wb-btn-ghost">Tất cả lĩnh vực</a>${authCta}</div>
      </section>

      <section class="wb-specialized-environment" aria-labelledby="specialized-modules">
        <div class="wb-section-heading"><div><p class="wb-eyebrow">LEARNING ENVIRONMENT</p><h2 id="specialized-modules">Học ngôn ngữ trong ngữ cảnh nghề nghiệp</h2></div></div>
        <article class="wb-module-state wb-module-state-ready"><div><p class="wb-eyebrow">AVAILABLE · SOURCE-BACKED</p><h3>Foundation & Terminology</h3><p>${matched.count.toLocaleString('vi-VN')} mục từ, IPA, nghĩa nghề nghiệp và ${matched.topicsCount} nhóm chủ đề từ dataset hiện hữu.</p></div><a href="#wb-vocab-explorer" class="wb-btn wb-btn-outline">Mở dữ liệu nền tảng</a></article>
        <article class="wb-module-state wb-module-state-ready"><div><p class="wb-eyebrow">AVAILABLE · SAME KNOWLEDGE SOURCE</p><h3>Vocabulary in context</h3><p>Dùng bộ lọc chủ đề và tra cứu từng thuật ngữ. Khi cần luyện thêm, Bridge dẫn sang Practice/Dictionary thay vì sao chép Knowledge Object.</p></div><a href="/practice/vocabulary" class="wb-btn wb-btn-outline">Practice Vocabulary</a></article>
        ${relatedPrograms.length ? `<article class="wb-module-state wb-module-state-ready"><div><p class="wb-eyebrow">PUBLISHED PROGRAM DATA</p><h3>Learning programs</h3><p>${relatedPrograms.map((p) => escapeHtml(p.title_vi)).join(' · ')}</p></div><a href="/learning/path" class="wb-btn wb-btn-outline">Learning Path</a></article>` : ''}
        ${unavailableModule('Professional Reading', 'Chưa có bài đọc được gắn chắc chắn với dataset lĩnh vực này trong source hiện tại.')}
        ${unavailableModule('Listening', 'Chưa có audio/timestamp transcript đã xác minh cho lĩnh vực này; hệ thống không tạo nội dung nghe giả.')}
        ${unavailableModule('Professional Writing', 'Chưa có prompt/rubric chuyên biệt theo lĩnh vực được xác minh cho dataset này.')}
        ${unavailableModule('Speaking & Scenario', 'Chưa có prompt/scenario chuyên biệt đã xác minh; không tạo hội thoại hoặc AI feedback giả.')}
        <article class="wb-module-state"><div><p class="wb-eyebrow">EXTERNAL OWNERSHIP</p><h3>Assessment</h3><p>Miền 1 chỉ discovery/handoff. Việc bắt đầu bài đánh giá thuộc exam.wordbridge.io.vn và yêu cầu đăng nhập.</p></div><a href="/examinations" class="wb-btn wb-btn-outline">Khám phá đánh giá</a></article>
      </section>

      <section id="wb-vocab-explorer" class="wb-reference-workspace" data-domain-slug="${escapeHtml(matched.slug)}" data-is-authenticated="${user ? 'true' : 'false'}">
        <header><p class="wb-eyebrow">FOUNDATION DATA</p><h2>Thuật ngữ & khái niệm</h2><p class="wb-muted">Ví dụ dữ liệu: ${escapeHtml(matched.sample)}. Tìm kiếm/lọc là action và được auth-gate khi chưa đăng nhập.</p></header>
        <div class="wb-specialized-tools">
          <label class="wb-field"><span>Tìm thuật ngữ</span><input id="wb-vocab-search" class="wb-input" type="search" placeholder="Từ, IPA hoặc nghĩa..." /></label>
          <label class="wb-field"><span>Chủ đề</span><select id="wb-vocab-topic" class="wb-select"><option value="">Đang tải chủ đề…</option></select></label>
        </div>
        <div class="wb-list-meta"><div id="wb-vocab-stats" class="wb-muted">Đang tải dữ liệu đã phát hành…</div><div id="wb-vocab-pager" class="wb-inline-actions"></div></div>
        <div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>STT</th><th>Thuật ngữ</th><th>IPA</th><th>Nghĩa</th><th>Chủ đề</th><th>Thao tác</th></tr></thead><tbody id="wb-vocab-list"><tr><td colspan="6">Đang tải dữ liệu…</td></tr></tbody></table></div>
      </section>
      <section class="wb-next-action"><h2>Bridge</h2><a href="/vocabulary/flashcards?mode=specialized" class="wb-btn wb-btn-outline">Flashcard</a><a href="/vocabulary/review" class="wb-btn wb-btn-outline">Review</a><a href="/dictionary" class="wb-btn wb-btn-outline">Dictionary</a><a href="/practice/vocabulary" class="wb-btn wb-btn-outline">Practice</a><a href="/learning/path" class="wb-btn wb-btn-outline">Learning Path</a></section>
      <script src="/scripts/vocab-explorer.js" defer></script>`;

    return htmlResponse(renderPublicPage({
      title: `${matched.nameVi} — Chuyên ngành`, currentPath: `/specialized/${matched.slug}`,
      breadcrumbs: [{ label: 'Chuyên ngành', href: '/specialized' }, { label: matched.nameVi }], user, runtime, contentHtml,
    }));
  }

  if (subSlug) return htmlResponse(renderPublicPage({title:'Không tìm thấy lĩnh vực',currentPath:'/specialized',user,contentHtml:'<h1>Không tìm thấy lĩnh vực</h1><a href="/specialized">Chọn lĩnh vực</a>'}),404);
  const totalWords = SPECIALIZED_VOCAB_DOMAINS.reduce((sum, item) => sum + item.count, 0);
  const rows = SPECIALIZED_VOCAB_DOMAINS.map((d) => `<li class="wb-specialized-index-row"><div><p class="wb-eyebrow">${d.count.toLocaleString('vi-VN')} TERMS · ${d.topicsCount} TOPICS</p><h3><a href="/specialized/${escapeHtml(d.slug)}">${escapeHtml(d.nameVi)}</a></h3><p class="wb-muted">${escapeHtml(d.sample)}</p></div><a href="/specialized/${escapeHtml(d.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá</a></li>`).join('');
  return htmlResponse(renderPublicPage({
    title: 'Chuyên ngành', currentPath: '/specialized', breadcrumbs: [{ label: 'Chuyên ngành' }], user, runtime,
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">12 SOURCE-BACKED DATASETS · ${totalWords.toLocaleString('vi-VN')} TERMS</p><h1>Chuyên ngành</h1><p>Không phải kho thuật ngữ đơn lẻ: mỗi lĩnh vực là một learning environment. Hiện foundation/vocabulary dùng dữ liệu thật; module chưa có content được đánh dấu rõ thay vì tạo lesson giả.</p></section><section><div class="wb-section-heading"><div><h2>Chọn lĩnh vực</h2><p>Duyệt theo danh mục gọn, không dùng 12-card grid.</p></div></div><ul class="wb-specialized-index">${rows}</ul></section>`,
  }));
}

export async function renderLearnerMeetPage({ user, runtime = null }) {
  const action = user
    ? '<a data-wb-handoff href="https://portal.wordbridge.io.vn/meet" class="wb-btn wb-btn-primary">Mở Learner Meet</a>'
    : `<a href="${signInUrl('/learner-meet', 'learner-meet.join')}" class="wb-btn wb-btn-primary">Đăng nhập để tham gia</a>`;
  return htmlResponse(renderPublicPage({
    title: 'Learner Meet', currentPath: '/learner-meet', breadcrumbs: [{ label: 'Khám phá', href: '/learning' }, { label: 'Learner Meet' }], user, runtime,
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">LEARNER MEET · DISCOVERY</p><h1>Tìm bạn học và thực hành cùng nhau</h1><p>Miền 1 giới thiệu luồng học; hoạt động tương tác thuộc Portal. Luồng này chỉ phục vụ tương tác học tập trực tiếp; Miền 1 không triển khai mạng xã hội công khai.</p>${action}<p class="wb-muted">Cross-domain SSO/session continuation chỉ được xác nhận khi Portal contract và môi trường staging khả dụng.</p></section><section class="wb-next-action"><h2>Chuẩn bị trước khi gặp</h2><a href="/practice/speaking" class="wb-btn wb-btn-outline">Speaking Practice</a><a href="/practice/listening" class="wb-btn wb-btn-outline">Listening Practice</a></section>`,
  }));
}

/** WORD BRIDGE V4 — public product map for Domain 1. */



const SYSTEMS = [
  ['Learning Home', 'Tiếp tục học, việc đến hạn và next action chỉ từ evidence thật.', '/learning'],
  ['Learning Path', 'Timeline học tập từ chương trình/khóa học đã phát hành.', '/learning/path'],
  ['7 Skill Centers', 'Vocabulary, Grammar, Listening, Speaking, Pronunciation, Reading, Writing.', '/learning/skills'],
  ['Dictionary', 'Reference workspace nối sang My Vocabulary, Flashcard, Review và Practice.', '/dictionary'],
  ['Practice Center', 'Studio theo kỹ năng, không dùng một presentation chung cho mọi task.', '/practice'],
  ['Memory & Review', 'Lịch ôn dựa trên notebook và next_review_at thật.', '/vocabulary/review'],
  ['My Knowledge', 'Evidence-based view cho kiến thức cá nhân; không suy đoán mastery.', '/my-knowledge'],
  ['My Mistakes', 'Mistake lifecycle chỉ hiển thị trạng thái có evidence backend.', '/my-mistakes'],
  ['Chuyên ngành', '12 source-backed datasets làm foundation cho learning environment.', '/specialized'],
  ['Examination', 'Discovery/handoff; engine thi thuộc exam.wordbridge.io.vn.', '/examinations'],
  ['Learner Meet', 'Discovery/handoff cho study-partner interaction tại Portal.', '/learner-meet'],
  ['Reader', 'Discovery/handoff tới reader.wordbridge.io.vn.', '/reader'],
];

export function renderFeaturesPage({ user, runtime }) {
  const rows = SYSTEMS.map(([title, desc, href]) => `<li class="wb-specialized-index-row"><div><h3><a href="${href}">${title}</a></h3><p>${desc}</p></div><a href="${href}" class="wb-btn wb-btn-outline wb-btn-sm">Mở hệ thống</a></li>`).join('');
  return htmlResponse(renderPublicPage({
    title: 'Hệ thống học tập WORD BRIDGE', currentPath: '/features', breadcrumbs: [{ label: 'Khám phá', href: '/' }, { label: 'Hệ thống học tập' }], user, runtime,
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">DOMAIN 1 PRODUCT MAP</p><h1>Hệ thống học tập WORD BRIDGE</h1><p>Miền 1 kết nối discovery, learning, practice, correction, review và assessment. Mỗi hệ thống dưới đây chỉ mô tả khả năng đang có trong source hoặc handoff đúng ownership.</p></section><ul class="wb-specialized-index">${rows}</ul>`,
  }));
}

/**
 * WORD BRIDGE — Public Core Pages matching Reference Mockups 1 & 2
 * - Visual Hero with Books & Globe artwork + 3 Visual Language Image Cards
 * - Dynamic content fields editable from quantri.wordbridge.io.vn
 * - Clean Vietnamese labels with hidden URLs (no raw domains, no awkward jargon)
 */






export function renderHomePage({ user, runtime = null }) {
  const settings = runtime?.settings || {};
  const heroBadge = settings.hero_badge || 'WORD BRIDGE · LEARNING PRODUCT';
  const heroTitle = settings.hero_title || 'Học để sử dụng ngôn ngữ';
  const heroTagline = settings.brand_tagline || 'Where Languages Bring People Together.';
  const heroSubtitle = settings.hero_subtitle || 'Khám phá → học → luyện tập → sửa lỗi → ôn tập → đánh giá, với dữ liệu thật và lộ trình nối tiếp giữa các hệ thống.';
  const startUrl = user ? '/learning' : signInUrl('/learning', 'learning.start');

  const contentHtml = `
    <section class="wb-hero-visual">
      <div><div class="wb-hero-pill">${escapeHtml(heroBadge)}</div><h1>${escapeHtml(heroTitle)}<em>${escapeHtml(heroTagline)}</em></h1><p>${escapeHtml(heroSubtitle)}</p>
        <div class="wb-hero-ctas"><a href="/learning" class="wb-btn wb-hero-btn-white">Khám phá học tập</a><a href="/learning/path" class="wb-btn wb-hero-btn-glass">Xem Learning Path</a><a href="${startUrl}" class="wb-btn wb-hero-btn-red">${user ? 'Tiếp tục học' : 'Đăng nhập để bắt đầu'}</a></div>
      </div><div class="wb-hero-art"><img src="/branding/hero-books.jpg" alt="WORD BRIDGE — học Tiếng Trung, Tiếng Anh và Tiếng Nga" /></div>
    </section>

    <section class="wb-product-loop" aria-labelledby="learning-loop-title"><div class="wb-section-heading"><div><p class="wb-eyebrow">BRIDGE ENGINE</p><h2 id="learning-loop-title">Một vòng học thống nhất, không phải các portal rời rạc</h2></div><a href="/search" class="wb-btn wb-btn-outline wb-btn-sm">Tìm kiếm toàn Miền 1</a></div>
      <ol><li><a href="/dictionary">Discover</a><span>Tra cứu và tìm nội dung.</span></li><li><a href="/learning">Learn</a><span>Học theo chương trình và path.</span></li><li><a href="/practice">Practice</a><span>Luyện theo đúng kỹ năng.</span></li><li><a href="/my-mistakes">Correct</a><span>Sửa lỗi dựa trên evidence.</span></li><li><a href="/vocabulary/review">Review</a><span>Ôn khi thực sự đến hạn.</span></li><li><a href="/examinations">Assess</a><span>Discovery và handoff sang Exam.</span></li></ol>
    </section>

    <section class="wb-lang-cards" aria-label="Ngôn ngữ học tập"><a href="/learning/chinese" class="wb-lang-card"><img class="wb-lang-bg" src="/branding/card-zh.jpg" alt="Tiếng Trung"/><div class="wb-lang-card-body"><span class="wb-lang-code wb-lang-code-zh">ZH</span><h3>Tiếng Trung (中文)</h3><span class="wb-lang-cta">Xem chương trình →</span></div></a><a href="/learning/english" class="wb-lang-card"><img class="wb-lang-bg" src="/branding/card-en.jpg" alt="Tiếng Anh"/><div class="wb-lang-card-body"><span class="wb-lang-code wb-lang-code-en">EN</span><h3>Tiếng Anh (English)</h3><span class="wb-lang-cta">Xem chương trình →</span></div></a><a href="/learning/russian" class="wb-lang-card"><img class="wb-lang-bg" src="/branding/card-ru.jpg" alt="Tiếng Nga"/><div class="wb-lang-card-body"><span class="wb-lang-code wb-lang-code-ru">RU</span><h3>Tiếng Nga (Русский язык)</h3><span class="wb-lang-cta">Xem chương trình →</span></div></a></section>

    <section class="wb-discovery-band"><div><p class="wb-eyebrow">SPECIALIZED</p><h2>Học theo lĩnh vực</h2><p>12 dataset hiện hữu tạo foundation cho Specialized Learning Environment; module thiếu content được ghi rõ thay vì dựng lesson giả.</p></div><a href="/specialized" class="wb-btn wb-btn-primary">Khám phá chuyên ngành</a></section>

    <section class="wb-entry-list" aria-label="Các hệ thống liên kết"><a href="/dictionary"><strong>Dictionary & Language Intelligence</strong><span>Reference workspace, context và Bridge sang học/luyện.</span></a><a href="/learner-meet"><strong>Learner Meet</strong><span>Public discovery; tham gia yêu cầu đăng nhập và handoff sang Portal.</span></a><a href="/reader"><strong>Reader</strong><span>Public entry; mở thư viện là action được auth-gate.</span></a><a href="/examinations"><strong>Examination</strong><span>Public discovery; bắt đầu assessment thuộc Exam.</span></a></section>`;

  return htmlResponse(renderPublicPage({ title: 'Trang chủ', currentPath: '/', user, runtime, contentHtml }));
}

export function renderAboutPage({ user, runtime = null }) {
  return htmlResponse(renderPublicPage({
    title: 'Giới thiệu WORD BRIDGE',
    currentPath: '/about',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Giới thiệu' }],
    user,
    runtime,
    contentHtml: `
      <div class="wb-card">
        <h1 style="margin-top:0;color:var(--wb-teal);">Giới thiệu Nền tảng WORD BRIDGE</h1>
        <p><strong>WORD BRIDGE</strong> (<em>Where Languages Bring People Together.</em>) là nền tảng học tập, tra cứu từ điển và thực hành ngoại ngữ chuyên ngành cho ba ngôn ngữ: <strong>Tiếng Trung</strong>, <strong>Tiếng Anh</strong> và <strong>Tiếng Nga</strong>.</p>
        <p>Hệ thống chú trọng ứng dụng thực tế nghề nghiệp, giúp người học làm chủ thuật ngữ, mẫu câu giao tiếp công việc và kỹ năng đọc hiểu tài liệu chuyên môn.</p>
      </div>`,
  }));
}

export function renderReaderEntryPage({ user, runtime = null }) {
  const action = user
    ? '<a href="https://reader.wordbridge.io.vn/" class="wb-btn wb-btn-primary">Mở Reader</a>'
    : `<a href="${signInUrl('/reader', 'reader.open')}" class="wb-btn wb-btn-primary">Đăng nhập để mở Reader</a>`;
  return htmlResponse(renderPublicPage({
    title: 'Reader', currentPath: '/reader', user, runtime,
    breadcrumbs: [{ label: 'Khám phá', href: '/learning' }, { label: 'Reader' }],
    contentHtml: `<section class="wb-learning-landing"><p class="wb-eyebrow">READER · DISCOVERY</p><h1>Thư viện đọc</h1><p>Miền 1 chỉ cung cấp entry point. Nội dung đọc và session chuyên trách thuộc reader.wordbridge.io.vn.</p>${action}<p class="wb-muted">SSO assertion endpoint tồn tại trong source nhưng external Reader continuation contract chưa được staging-verify.</p></section><section class="wb-next-action"><h2>Bridge</h2><a href="/practice/reading" class="wb-btn wb-btn-outline">Reading Practice</a><a href="/dictionary" class="wb-btn wb-btn-outline">Dictionary</a></section>`,
  }));
}

export function renderHelpPage({ user, runtime = null }) {
  return htmlResponse(renderPublicPage({
    title: 'Trung Tâm Trợ Giúp',
    currentPath: '/help',
    user,
    runtime,
    contentHtml: `<div class="wb-card"><h1>Trung Tâm Trợ Giúp</h1><p>Mời bạn truy cập <a href="https://help.wordbridge.io.vn/">Trung Tâm Trợ Giúp</a> để xem hướng dẫn chi tiết và gửi yêu cầu hỗ trợ.</p></div>`,
  }));
}

export function renderFaqPage({ user, runtime = null }) {
  const faqs = [
    ['WORD BRIDGE hỗ trợ những ngôn ngữ nào?', 'Nền tảng tập trung đào tạo Tiếng Trung, Tiếng Anh (nền tảng và chuyên ngành) cùng Tiếng Nga.'],
    ['Quy trình đăng ký tài khoản thành viên như thế nào?', 'Tại Cổng Thành Viên, bạn điền Họ tên, Số điện thoại, Email và Trường/Đơn vị công tác. Hệ thống sẽ gửi liên kết xác nhận qua email để bạn tự thiết lập mật khẩu.'],
    ['Tôi có thể đọc tài liệu và tham gia đánh giá năng lực ở đâu?', 'Bạn có thể truy cập trực tiếp Thư Viện Tài Liệu và Cổng Dự Thi ngay từ tài khoản thành viên của mình.'],
  ];
  return htmlResponse(renderPublicPage({
    title: 'Câu hỏi thường gặp',
    currentPath: '/faq',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Câu hỏi thường gặp' }],
    user,
    runtime,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Câu hỏi thường gặp</h1>
      <div class="wb-grid-2">${faqs.map(([q, a]) => `<article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(q)}</h3><p style="margin-bottom:0;">${escapeHtml(a)}</p></article>`).join('')}</div>`,
  }));
}

export function renderContactPage({ user, runtime = null }) {
  return htmlResponse(renderPublicPage({
    title: 'Liên hệ hỗ trợ',
    currentPath: '/contact',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }],
    user,
    runtime,
    contentHtml: `
      <div class="wb-card" style="max-width:640px;">
        <h1 style="margin-top:0;color:var(--wb-teal);">Liên hệ WORD BRIDGE</h1>
        <p>Đội ngũ hỗ trợ luôn sẵn sàng đồng hành cùng bạn trong suốt quá trình học tập.</p>
        <a href="${user ? 'https://help.wordbridge.io.vn/tickets' : signInUrl('/contact','support.request')}" class="wb-btn wb-btn-primary">Gửi yêu cầu tại Trung Tâm Trợ Giúp</a>
      </div>`,
  }));
}

export function renderPolicyPage({ user, policySlug, runtime = null }) {
  const titles = {
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách quyền riêng tư',
    'data-protection': 'Bảo vệ dữ liệu cá nhân',
    'platform-usage': 'Quy tắc sử dụng nền tảng',
  };
  const title = titles[policySlug] || 'Chính sách nền tảng';
  return htmlResponse(renderPublicPage({
    title,
    currentPath: `/policies/${policySlug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: title }],
    user,
    runtime,
    contentHtml: `<div class="wb-card"><h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(title)}</h1><p>WORD BRIDGE cam kết minh bạch trong việc lưu trữ dữ liệu học tập và bảo vệ quyền riêng tư của thành viên.</p></div>`,
  }));
}
