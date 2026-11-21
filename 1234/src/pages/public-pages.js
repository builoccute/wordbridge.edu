/**
 * WORD BRIDGE — Public Core Pages matching Reference Mockups 1 & 2
 * - Visual Hero with Books & Globe artwork + 3 Visual Language Image Cards
 * - Dynamic content fields editable from quantri.wordbridge.io.vn
 * - Clean Vietnamese labels with hidden URLs (no raw domains, no awkward jargon)
 */
import { renderPublicPage } from '../layouts/site-layout.js';
import { SPECIALIZED_DOMAINS } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

export function renderHomePage({ user, runtime = null }) {
  const s = runtime?.settings || {};
  const heroBadge = s.hero_badge || 'Nền tảng học ngôn ngữ Trung – Anh – Nga';
  const heroTitle = s.hero_title || 'WORD BRIDGE —';
  const heroTagline = s.brand_tagline || 'Where Languages Bring People Together.';
  const heroSubtitle = s.hero_subtitle || 'Nền tảng học tập, tra cứu từ điển, luyện tập ngôn ngữ chuyên ngành và kết nối cộng đồng người học Việt Nam và quốc tế.';

  const contentHtml = `
    <section class="wb-hero-visual">
      <div>
        <div class="wb-hero-pill">🎓 ${escapeHtml(heroBadge)}</div>
        <h1>${escapeHtml(heroTitle)}<em>${escapeHtml(heroTagline)}</em></h1>
        <p>${escapeHtml(heroSubtitle)}</p>
        <div class="wb-hero-ctas">
          <a href="/learning" class="wb-btn wb-hero-btn-white">📖 Khám phá Học tập</a>
          <a href="https://portal.wordbridge.io.vn/meet" class="wb-btn wb-hero-btn-glass">👥 Tham gia Learner Meet</a>
          <a href="https://portal.wordbridge.io.vn/register" class="wb-btn wb-hero-btn-red">👤+ Đăng ký tài khoản miễn phí</a>
        </div>
      </div>
      <div class="wb-hero-art">
        <img src="/branding/hero-books.jpg" alt="Tiếng Trung, Tiếng Anh, Tiếng Nga — WORD BRIDGE" />
      </div>
    </section>

    <section class="wb-lang-cards" aria-label="Ba hệ thống ngôn ngữ">
      <a href="/learning/chinese" class="wb-lang-card">
        <img class="wb-lang-bg" src="/branding/card-zh.jpg" alt="Tiếng Trung" />
        <div class="wb-lang-card-body">
          <span class="wb-lang-code wb-lang-code-zh">ZH</span>
          <h3>Tiếng Trung (中文)</h3>
          <span class="wb-lang-cta">Xem chương trình →</span>
        </div>
      </a>
      <a href="/learning/english" class="wb-lang-card">
        <img class="wb-lang-bg" src="/branding/card-en.jpg" alt="Tiếng Anh" />
        <div class="wb-lang-card-body">
          <span class="wb-lang-code wb-lang-code-en">EN</span>
          <h3>Tiếng Anh (English)</h3>
          <span class="wb-lang-cta">Xem chương trình →</span>
        </div>
      </a>
      <a href="/learning/russian" class="wb-lang-card">
        <img class="wb-lang-bg" src="/branding/card-ru.jpg" alt="Tiếng Nga" />
        <div class="wb-lang-card-body">
          <span class="wb-lang-code wb-lang-code-ru">RU</span>
          <h3>Tiếng Nga (Русский язык)</h3>
          <span class="wb-lang-cta">Xem chương trình →</span>
        </div>
      </a>
    </section>

    <section class="wb-card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div>
          <h2 style="margin:0;color:var(--wb-teal);">Ngoại ngữ Chuyên ngành Ứng dụng</h2>
          <p class="wb-muted" style="margin:4px 0 0;">Hệ thống thuật ngữ, mẫu câu thực chiến và tình huống nghề nghiệp cho Tiếng Trung và Tiếng Anh.</p>
        </div>
        <a href="/specialized" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá chuyên ngành →</a>
      </div>
      <div class="wb-grid">
        ${SPECIALIZED_DOMAINS.map((d) => `
          <a href="/specialized/${escapeHtml(d.slug)}" class="wb-card" style="margin:0;display:block;border-left:4px solid var(--wb-teal);">
            <strong style="color:var(--wb-teal);display:block;">${escapeHtml(d.nameVi)}</strong>
            <span class="wb-muted" style="font-size:0.82rem;">Thuật ngữ · Mẫu câu · Tình huống</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="wb-grid-4">
      <article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">Từ điển & Flashcard</h3><p class="wb-muted">Tra cứu đa ngữ, lưu sổ từ vựng cá nhân và ôn tập ghi nhớ khoa học.</p><a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Mở Từ điển</a></article>
      <article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">Cổng Luyện Tập</h3><p class="wb-muted">Thực hành Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp chuyên sâu.</p><a href="/practice" class="wb-btn wb-btn-outline wb-btn-sm">Vào Luyện Tập</a></article>
      <article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">Thư Viện Tài Liệu</h3><p class="wb-muted">Đọc giáo trình và tài liệu chuyên ngành trực quan ngay trên trình duyệt.</p><a href="https://reader.wordbridge.io.vn/" class="wb-btn wb-btn-outline wb-btn-sm">Mở Thư Viện</a></article>
      <article class="wb-card"><h3 style="margin-top:0;color:var(--wb-red);">Cổng Dự Thi</h3><p class="wb-muted">Tham gia kỳ đánh giá năng lực và tra cứu kết quả trực tuyến.</p><a href="https://exam.wordbridge.io.vn/" class="wb-btn wb-btn-accent wb-btn-sm">Vào Cổng Dự Thi</a></article>
    </section>
  `;

  return htmlResponse(renderPublicPage({
    title: 'Trang chủ',
    currentPath: '/',
    user,
    runtime,
    contentHtml,
  }));
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
        <a href="https://help.wordbridge.io.vn/tickets" class="wb-btn wb-btn-primary">Gửi yêu cầu tại Trung Tâm Trợ Giúp</a>
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
