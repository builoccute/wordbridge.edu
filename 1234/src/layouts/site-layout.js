/**
 * WORD BRIDGE V4.0 — Unified Brand & Responsive Layout (Mobile Drawer + Laptop)
 * Uses exact Logo.jpg palette (#035257, #CB0203, #3DA2A0) & vector SVG logo.
 */
import { BRAND } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';

const PUBLIC_NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Học ngoại ngữ', href: '/learning' },
  { label: 'Chuyên ngành', href: '/specialized' },
  { label: 'Từ điển', href: '/dictionary' },
  { label: 'Luyện tập', href: '/practice' },
  { label: 'Learner Meet', href: '/learner-meet' },
  { label: '40 Tính năng', href: '/features' },
  { label: 'Thi thật', href: 'https://exam.wordbridge.io.vn/' },
  { label: 'Trợ giúp', href: 'https://help.wordbridge.io.vn/' },
];

const FOOTER_GROUPS = [
  {
    title: 'Học tập & Chuyên ngành',
    links: [
      { label: 'Tiếng Trung (HSK & CN)', href: '/learning/chinese' },
      { label: 'Tiếng Anh (CEFR & CN)', href: '/learning/english' },
      { label: 'Tiếng Nga (Tổng quát)', href: '/learning/russian' },
      { label: '10 Lĩnh vực Chuyên ngành', href: '/specialized' },
    ],
  },
  {
    title: 'Công cụ & Chính sách',
    links: [
      { label: 'Từ điển & Flashcard SM-2', href: '/dictionary' },
      { label: '15 Trí tuệ Ngôn ngữ', href: '/intelligence' },
      { label: 'Điều khoản sử dụng', href: '/policies/terms' },
      { label: 'Bảo mật & Quyền riêng tư', href: '/policies/privacy' },
    ],
  },
];

export function renderBrandLogo() {
  return `<a href="/" class="wb-brand" aria-label="${escapeHtml(BRAND.name)} — ${escapeHtml(BRAND.tagline)}">
    <img src="/branding/logo-wordbridge.svg" alt="${escapeHtml(BRAND.name)}" />
  </a>`;
}

export function renderPublicPage({
  title,
  description = '',
  currentPath = '/',
  breadcrumbs = [],
  user = null,
  contentHtml = '',
  runtime = null,
}) {
  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}" />` : '';
  const banner = runtime?.site?.announcement_banner
    ? `<div class="wb-banner">${escapeHtml(runtime.site.announcement_banner)}</div>`
    : '';
  const customStyle = runtime?.site
    ? `<style>:root{--wb-teal:${escapeHtml(runtime.site.primary_color || '#035257')};--wb-red:${escapeHtml(runtime.site.accent_color || '#CB0203')};--wb-aqua:${escapeHtml(runtime.site.secondary_color || '#3DA2A0')};}${runtime.site.custom_css || ''}</style>`
    : '';

  const navHtml = PUBLIC_NAV_ITEMS
    .map((item) => {
      const active = currentPath === item.href || (item.href !== '/' && !item.href.startsWith('http') && currentPath.startsWith(item.href));
      return `<a href="${escapeHtml(item.href)}" class="${active ? 'active' : ''}">${escapeHtml(item.label)}</a>`;
    })
    .join('');

  const crumbHtml = breadcrumbs.length
    ? `<nav aria-label="Breadcrumb" style="font-size:0.84rem;margin-bottom:14px;color:var(--wb-text-muted);">${breadcrumbs
        .map((c, i) => (c.href && i < breadcrumbs.length - 1 ? `<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a> › ` : `<span>${escapeHtml(c.label)}</span>`))
        .join('')}</nav>`
    : '';

  const authActions = user
    ? `<a href="https://portal.wordbridge.io.vn/" class="wb-btn wb-btn-outline wb-btn-sm wb-hide-mobile">${escapeHtml(user.fullName || user.email)}</a>
       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-logout>Đăng xuất</button>`
    : `<a href="https://portal.wordbridge.io.vn/login" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>
       <a href="https://portal.wordbridge.io.vn/register" class="wb-btn wb-btn-accent wb-btn-sm wb-hide-mobile">Đăng ký</a>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | ${escapeHtml(BRAND.name)}</title>
  <meta name="description" content="${escapeHtml(description || 'WORD BRIDGE — Nền tảng học ngoại ngữ chuyên ngành Trung – Anh & Tiếng Nga.')}" />
  ${csrfMeta}
  <link rel="stylesheet" href="/styles/design-system.css" />
  ${customStyle}
</head>
<body>
  ${banner}
  <header class="wb-header">
    <div class="wb-container wb-header-inner">
      ${renderBrandLogo()}
      <nav class="wb-nav" id="wb-main-nav" aria-label="Điều hướng chính">${navHtml}</nav>
      <div class="wb-header-actions">
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm wb-hide-mobile" data-wb-theme-toggle title="Sáng / Tối">🌓</button>
        ${authActions}
        <button type="button" class="wb-menu-toggle" data-wb-menu-toggle aria-label="Mở menu">☰</button>
      </div>
    </div>
  </header>
  <main class="wb-main">
    <div class="wb-container">
      ${!user ? `<div class="wb-alert wb-alert-info" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <span><strong>Chế độ xem công khai:</strong> Bạn có thể xem trước giáo trình, từ điển và 10 nhóm chuyên ngành. Đăng nhập qua <strong>portal.wordbridge.io.vn</strong> để lưu sổ từ, lật Flashcard, ghi chú và nộp bài.</span>
        <a href="https://portal.wordbridge.io.vn/login" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập sử dụng</a>
      </div>` : ''}
      ${crumbHtml}
      <div id="wb-global-status" role="status" aria-live="polite"></div>
      ${contentHtml}
    </div>
  </main>
  <footer class="wb-footer">
    <div class="wb-container">
      <div class="wb-footer-grid">
        <div>
          <div style="background:#fff;display:inline-block;padding:8px 12px;border-radius:10px;margin-bottom:10px;">
            <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" style="height:34px;" />
          </div>
          <p style="font-size:0.86rem;opacity:0.9;">Nền tảng học Tiếng Chuyên Ngành Trung – Anh & Tiếng Nga tổng quát. Dữ liệu & vận hành bảo mật tập trung.</p>
        </div>
        ${FOOTER_GROUPS.map((g) => `<div><h4 style="margin:0 0 8px;color:#fff;">${escapeHtml(g.title)}</h4><ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:0.86rem;">${g.links.map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`).join('')}</ul></div>`).join('')}
        <div>
          <h4 style="margin:0 0 8px;color:#fff;">Hệ sinh thái WORD BRIDGE</h4>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:0.86rem;">
            <li><a href="https://portal.wordbridge.io.vn/">Cổng Thành Viên (Portal)</a></li>
            <li><a href="https://reader.wordbridge.io.vn/">Thư Viện PDF (Reader)</a></li>
            <li><a href="https://exam.wordbridge.io.vn/">Hệ Thống Thi Thật (Exam)</a></li>
            <li><a href="https://help.wordbridge.io.vn/">Trung Tâm Trợ Giúp (Help)</a></li>
          </ul>
        </div>
      </div>
      <div style="margin-top:22px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.16);font-size:0.82rem;opacity:0.85;">
        © 2026 WORD BRIDGE (wordbridge.io.vn) — Where Languages Bring People Together.
      </div>
    </div>
  </footer>
  <div id="wb-toast-root" aria-live="polite"></div>
  <script src="/scripts/app.js" defer></script>
</body>
</html>`;
}

export function renderAdminPage(opts) {
  return renderPublicPage(opts);
}
