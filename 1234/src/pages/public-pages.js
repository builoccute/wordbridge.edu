/**
 * WORD BRIDGE V4.2 — Public Core Pages (One Domain: https://wordbridge.io.vn)
 * Matches UI Reference #06 (Homepage) & #15 (Specialized & Core Feature Cards).
 * Strictly Bilingual: Chinese (zh) & English (en) ONLY.
 */
import { renderPublicPage } from '../layouts/site-layout.js';
import { SPECIALIZED_VOCAB_DATASETS, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

export const SPECIALIZED_VOCAB_DOMAINS = SPECIALIZED_VOCAB_DATASETS;

export function renderHomePage({ user, runtime = null }) {
  const s = runtime?.settings || {};
  const heroBadge = s.hero_badge || 'Nền tảng học ngôn ngữ Trung – Anh';
  const heroTitle = s.hero_title || 'WORD BRIDGE';
  const heroTagline = s.brand_tagline || 'Where Languages Bring People Together.';
  const heroSubtitle =
    s.hero_subtitle ||
    'Nền tảng học tập, tra cứu từ điển, luyện tập ngôn ngữ chuyên ngành, thư viện đọc và rèn luyện 7 kỹ năng thống nhất trên wordbridge.io.vn.';

  const contentHtml = `
    <section class="wb-hero-visual">
      <div>
        <div class="wb-hero-pill">${escapeHtml(heroBadge)}</div>
        <h1><span class="wb-brand-word">WORD</span> <span class="wb-brand-bridge">BRIDGE</span><em>${escapeHtml(heroTagline)}</em></h1>
        <p class="wb-hero-lead">${escapeHtml(heroSubtitle)}</p>
        <div class="wb-hero-ctas">
          <a href="/learning" class="wb-btn wb-hero-btn-white">Khám phá Học tập</a>
          <a href="/reader" class="wb-btn wb-hero-btn-glass">Mở Thư Viện Đọc</a>
          ${user
            ? '<a href="/my-learning" class="wb-btn wb-hero-btn-red">Vào lộ trình của tôi</a>'
            : '<a href="/register" class="wb-btn wb-hero-btn-red">Đăng ký tài khoản miễn phí</a>'}
        </div>
      </div>
      <div class="wb-hero-art">
        <img src="/branding/hero-books.jpg" alt="Tiếng Trung và Tiếng Anh — WORD BRIDGE" />
      </div>
    </section>

    <section class="wb-lang-cards wb-lang-cards-bilingual" aria-label="Hai ngôn ngữ học tập chính thức">
      <a href="/learning/chinese" class="wb-lang-card wb-lang-card-zh">
        <img class="wb-lang-bg" src="/branding/card-zh.jpg" alt="Học Tiếng Trung (中文)" />
        <div class="wb-lang-card-body">
          <span class="wb-lang-code wb-lang-code-zh">ZH</span>
          <h3>Tiếng Trung (中文)</h3>
          <p class="wb-lang-sub">Học · Giao tiếp · Ứng dụng · Chuyên ngành</p>
          <span class="wb-lang-cta">Xem chương trình →</span>
        </div>
      </a>
      <a href="/learning/english" class="wb-lang-card wb-lang-card-en">
        <img class="wb-lang-bg" src="/branding/card-en.jpg" alt="Học Tiếng Anh (English)" />
        <div class="wb-lang-card-body">
          <span class="wb-lang-code wb-lang-code-en">EN</span>
          <h3>Tiếng Anh (English)</h3>
          <p class="wb-lang-sub">Học · Giao tiếp · Ứng dụng · Chuyên ngành</p>
          <span class="wb-lang-cta">Xem chương trình →</span>
        </div>
      </a>
    </section>

    <section class="wb-highlights-strip" aria-label="Giá trị cốt lõi">
      <div class="wb-highlight-item">
        <strong>2 Ngôn ngữ trọng tâm</strong>
        <span>Tiếng Trung · Tiếng Anh</span>
      </div>
      <div class="wb-highlight-item">
        <strong>Học tập đa dạng</strong>
        <span>Từ điển · Luyện tập · Đọc hiểu</span>
      </div>
      <div class="wb-highlight-item">
        <strong>7 Hệ thống Kỹ năng</strong>
        <span>Từ vựng · Ngữ pháp · 4 Kỹ năng · Phát âm</span>
      </div>
      <div class="wb-highlight-item">
        <strong>An toàn & Bảo mật</strong>
        <span>Tài khoản thống nhất & Passkey</span>
      </div>
    </section>

    <section class="wb-section-block">
      <div class="wb-section-header">
        <div class="wb-section-title-wrap">
          <span class="wb-section-bar" aria-hidden="true"></span>
          <div>
            <h2>Ngoại ngữ Chuyên ngành Ứng dụng</h2>
            <span class="wb-accent-line" aria-hidden="true"></span>
            <p class="wb-muted">Hệ thống thuật ngữ, mẫu câu thực chiến và tình huống nghề nghiệp cho Tiếng Trung và Tiếng Anh.</p>
          </div>
        </div>
        <a href="/specialized" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá chuyên ngành →</a>
      </div>
      <div class="wb-specialized-grid">
        ${SPECIALIZED_VOCAB_DOMAINS.map((d) => `
          <a href="/specialized/${escapeHtml(d.slug)}" class="wb-spec-card">
            <h3>${escapeHtml(d.nameVi)}</h3>
            <span class="wb-accent-line" aria-hidden="true"></span>
            <p class="wb-muted">${d.count.toLocaleString('vi-VN')} thuật ngữ · Mẫu câu · Tình huống</p>
          </a>`).join('')}
      </div>
    </section>

    <section class="wb-grid-4 wb-feature-cards-row">
      <article class="wb-card wb-feature-card">
        <h3>Từ điển & Flashcards</h3>
        <span class="wb-accent-line" aria-hidden="true"></span>
        <p class="wb-muted">Tra cứu song ngữ Trung – Anh, lưu sổ từ vựng cá nhân và ôn tập ghi nhớ ngắt quãng SM-2.</p>
        <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Mở Từ điển →</a>
      </article>
      <article class="wb-card wb-feature-card">
        <h3>Cổng Luyện Tập</h3>
        <span class="wb-accent-line" aria-hidden="true"></span>
        <p class="wb-muted">Thực hành Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp chuyên sâu theo giáo trình chuẩn.</p>
        <a href="/practice" class="wb-btn wb-btn-outline wb-btn-sm">Vào Luyện Tập →</a>
      </article>
      <article class="wb-card wb-feature-card">
        <h3>Thư Viện Đọc</h3>
        <span class="wb-accent-line" aria-hidden="true"></span>
        <p class="wb-muted">Đọc giáo trình và tài liệu chuyên ngành trực tiếp kèm chú giải thuật ngữ và lưu tiến độ.</p>
        <a href="/reader" class="wb-btn wb-btn-outline wb-btn-sm">Mở Thư Viện →</a>
      </article>
      <article class="wb-card wb-feature-card">
        <h3>Trí tuệ Ngôn ngữ</h3>
        <span class="wb-accent-line" aria-hidden="true"></span>
        <p class="wb-muted">Phân tích Language DNA, độ hiểu bài và tiến độ học tập dựa trên dữ liệu thực tế của bạn.</p>
        <a href="/intelligence" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá phân tích →</a>
      </article>
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
        <p><strong>WORD BRIDGE</strong> (<em>Where Languages Bring People Together.</em>) là nền tảng học tập, tra cứu từ điển, đọc tài liệu và thực hành ngoại ngữ chuyên ngành cho hai ngôn ngữ trọng tâm: <strong>Tiếng Trung (中文)</strong> và <strong>Tiếng Anh (English)</strong>.</p>
        <p>Toàn bộ nền tảng vận hành thống nhất trên một tên miền duy nhất <code>https://wordbridge.io.vn</code> với một hệ thống tài khoản, lộ trình học tập rõ ràng và dữ liệu đồng bộ.</p>
      </div>`,
  }));
}

export function renderFaqPage({ user, runtime = null }) {
  const faqs = [
    ['WORD BRIDGE hỗ trợ những ngôn ngữ nào?', 'Nền tảng tập trung đào tạo hai ngôn ngữ chính thức: Tiếng Trung (中文) và Tiếng Anh (English), bao gồm cả chương trình nền tảng và ngoại ngữ chuyên ngành.'],
    ['Quy trình đăng ký tài khoản thành viên như thế nào?', 'Tại trang /register, bạn điền đầy đủ 8 trường thông tin cá nhân bắt buộc (gồm Trường học và Nơi làm việc độc lập) và xác minh qua liên kết email một lần.'],
    ['Tôi có thể đọc tài liệu và luyện tập kỹ năng ở đâu?', 'Bạn có thể truy cập trực tiếp Thư Viện Đọc (/reader), Cổng Luyện Tập (/practice), Trung tâm Kỹ năng (/learning/skills) và Trung Tâm Trợ Giúp (/help) bằng cùng một tài khoản.'],
  ];
  return htmlResponse(renderPublicPage({
    title: 'Câu hỏi thường gặp',
    currentPath: '/faq',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Câu hỏi thường gặp' }],
    user,
    runtime,
    contentHtml: `
      <h1 style="color:var(--wb-teal);">Câu hỏi thường gặp</h1>
      <div class="wb-grid-2">${faqs.map(([q, a]) => `<article class="wb-card"><h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(q)}</h3><p style="margin-bottom:0;">${escapeHtml(a)}</p></article>`).join('')}</div>
      <div style="margin-top:16px;"><a href="/help" class="wb-btn wb-btn-primary">Mở Trung Tâm Trợ Giúp</a></div>`,
  }));
}

export function renderContactPage({ user, runtime = null }) {
  const formHtml = user
    ? `
      <form class="wb-form" data-api-endpoint="/api/v1/support/tickets">
        <input type="hidden" name="requestType" value="contact_partnership" />
        <div class="wb-field"><label>Họ và tên *</label><input class="wb-input" name="senderName" value="${escapeHtml(user.fullName || '')}" required /></div>
        <div class="wb-field"><label>Email *</label><input class="wb-input" type="email" name="senderEmail" value="${escapeHtml(user.email || '')}" required /></div>
        <div class="wb-field"><label>Tiêu đề liên hệ *</label><input class="wb-input" name="subject" required /></div>
        <div class="wb-field"><label>Nội dung *</label><textarea class="wb-input" name="messageBody" rows="4" required></textarea></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi thông tin liên hệ</button>
      </form>`
    : `<div class="wb-alert wb-alert-info">Vui lòng <a href="${escapeHtml(signInUrl('/contact', 'contact.send'))}">đăng nhập</a> để gửi biểu mẫu liên hệ trực tuyến hoặc xem hướng dẫn tại <a href="/help">Trung Tâm Trợ Giúp</a>.</div>`;

  return htmlResponse(renderPublicPage({
    title: 'Liên hệ hỗ trợ',
    currentPath: '/contact',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }],
    user,
    runtime,
    contentHtml: `
      <div class="wb-card" style="max-width:680px;">
        <h1 style="margin-top:0;color:var(--wb-teal);">Liên hệ WORD BRIDGE</h1>
        <p>Đội ngũ hỗ trợ WORD BRIDGE luôn sẵn sàng đồng hành cùng bạn trong quá trình học tập và giải đáp thắc mắc.</p>
        ${formHtml}
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
    contentHtml: `<div class="wb-card"><h1 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(title)}</h1><p>WORD BRIDGE cam kết minh bạch trong việc lưu trữ dữ liệu học tập và bảo vệ quyền riêng tư của thành viên trên nền tảng wordbridge.io.vn.</p></div>`,
  }));
}
