/**
 * WORD BRIDGE V4.2 — Unified Single-Domain Layout (https://wordbridge.io.vn)
 * - Official Palette: Deep Teal (#146466), Vermilion Red (#C92F1C), Aqua (#5AABA9), Warm Ivory (#E2E2C4)
 * - Bilingual Scope: Chinese (zh) & English (en) ONLY
 * - Zero Public Admin Button or admin path exposure
 * - Matches UI Reference #06 (Header) & #09 (Footer)
 */
import { BRAND, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';

const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  reader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 1.9"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};

const PUBLIC_NAV_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: NAV_ICONS.home },
  { label: 'Học tập', href: '/learning', icon: NAV_ICONS.learn },
  { label: 'Thư viện đọc', href: '/reader', icon: NAV_ICONS.reader },
  { label: 'Cổng Luyện Tập', href: '/practice', icon: NAV_ICONS.practice },
  { label: 'Trung Tâm Trợ Giúp', href: '/help', icon: NAV_ICONS.help },
];

export function renderBrandLogo() {
  return `<a href="/" class="wb-brand" aria-label="${escapeHtml(BRAND.name)}">
    <img src="/branding/logo-wordbridge.svg" alt="${escapeHtml(BRAND.name)}" style="height:42px;width:auto;border-radius:6px;" />
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
  const s = runtime?.settings || {};
  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}" />` : '';
  const banner = runtime?.site?.announcement_banner
    ? `<div class="wb-banner">${escapeHtml(runtime.site.announcement_banner)}</div>`
    : '';
  const customStyle = runtime?.site
    ? `<style>:root{--wb-teal:${escapeHtml(runtime.site.primary_color || '#146466')};--wb-red:${escapeHtml(runtime.site.accent_color || '#C92F1C')};--wb-aqua:${escapeHtml(runtime.site.secondary_color || '#5AABA9')};}${runtime.site.custom_css || ''}</style>`
    : '';

  const navHtml = PUBLIC_NAV_ITEMS
    .map((item) => {
      const active =
        currentPath === item.href ||
        (item.href !== '/' && !item.href.startsWith('http') && currentPath.startsWith(item.href));
      return `<a href="${escapeHtml(item.href)}" class="${active ? 'active' : ''}">${item.icon}<span>${escapeHtml(item.label)}</span></a>`;
    })
    .join('');

  const crumbHtml = breadcrumbs.length
    ? `<nav class="wb-breadcrumb" aria-label="Breadcrumb">${breadcrumbs
        .map((c, i) =>
          c.href && i < breadcrumbs.length - 1
            ? `<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a><span class="wb-crumb-sep" aria-hidden="true">›</span>`
            : `<span class="wb-crumb-current">${escapeHtml(c.label)}</span>`
        )
        .join('')}</nav>`
    : '';

  const loginHref = signInUrl(currentPath.startsWith('http') ? '/' : currentPath, 'header.login');
  const localeControl = `<select class="wb-select wb-btn-sm wb-locale-select" data-wb-locale aria-label="Ngôn ngữ giao diện"><option value="vi">VI</option><option value="en">EN</option></select>`;

  // Strictly NO public admin button in Header or Footer
  const authActions = user
    ? `${localeControl}
       <a href="/profile" class="wb-btn wb-btn-outline wb-btn-sm wb-hide-mobile">${escapeHtml(user.fullName || user.email)}</a>
       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-logout>Đăng xuất</button>`
    : `${localeControl}
       <a href="${escapeHtml(loginHref)}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>
       <a href="/register" class="wb-btn wb-btn-accent wb-btn-sm wb-hide-mobile">Đăng ký</a>`;

  const statLanguages = s.footer_stat_languages || '2 ngôn ngữ';
  const statLanguagesLabel = s.footer_stat_languages_label || 'Trung – Anh';
  const statTerms = s.footer_stat_terms || '12.104+';
  const statTermsLabel = s.footer_stat_terms_label || 'Thuật ngữ chuyên ngành';
  const footerSlogan = s.footer_slogan || 'WORD BRIDGE – Nền tảng học ngôn ngữ và kết nối người học toàn cầu.';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | ${escapeHtml(BRAND.name)}</title>
  <meta name="description" content="${escapeHtml(description || 'WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh thống nhất tại wordbridge.io.vn.')}" />
  <link rel="canonical" href="${escapeHtml(BRAND.websiteUrl)}${escapeHtml(currentPath.startsWith('/') ? currentPath : '/')}" />
  <link rel="icon" type="image/png" href="/branding/favicon.png" />
  ${csrfMeta}
  <link rel="stylesheet" href="/styles/design-system.css" />
  ${customStyle}
</head>
<body data-wb-authenticated="${user ? 'true' : 'false'}">
  ${banner}
  <header class="wb-header">
    <div class="wb-container wb-header-inner">
      ${renderBrandLogo()}
      <nav class="wb-nav" id="wb-main-nav" aria-label="Điều hướng chính">${navHtml}</nav>
      <div class="wb-header-actions">
        ${authActions}
        <button type="button" class="wb-menu-toggle" data-wb-menu-toggle aria-label="Mở menu">${NAV_ICONS.menu}</button>
      </div>
    </div>
  </header>
  <main class="wb-main">
    <div class="wb-container">
      ${crumbHtml}
      <div id="wb-global-status" role="status" aria-live="polite"></div>
      ${contentHtml}
    </div>
  </main>
  <footer class="wb-footer-v4">
    <div class="wb-container">
      <div class="wb-footer-v4-grid">
        <div class="wb-footer-brand-card">
          <div class="wb-footer-logo-pill">
            <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" />
          </div>
          <p class="wb-footer-tagline">Nền tảng học ngôn ngữ Trung – Anh và kết nối người học toàn cầu.</p>
          <div class="wb-footer-lang-pills">
            <a href="/learning/chinese" class="wb-footer-lang-pill wb-pill-zh"><strong>中</strong> Tiếng Trung</a>
            <a href="/learning/english" class="wb-footer-lang-pill wb-pill-en"><strong>EN</strong> Tiếng Anh</a>
          </div>
        </div>

        <div class="wb-footer-col">
          <h4>Học tập & Rèn luyện</h4>
          <span class="wb-accent-line" aria-hidden="true"></span>
          <ul>
            <li><a href="/learning">Chương trình học</a></li>
            <li><a href="/learning/path">Lộ trình học tập</a></li>
            <li><a href="/specialized">Ngoại ngữ Chuyên ngành</a></li>
            <li><a href="/reader">Thư Viện Đọc</a></li>
            <li><a href="/dictionary">Từ điển Ngôn ngữ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Luyện tập & Phân tích</h4>
          <span class="wb-accent-line" aria-hidden="true"></span>
          <ul>
            <li><a href="/practice">Cổng Luyện Tập</a></li>
            <li><a href="/vocabulary/flashcards">Flashcards & Ôn tập</a></li>
            <li><a href="/my-knowledge">My Knowledge</a></li>
            <li><a href="/intelligence">Trí tuệ Ngôn ngữ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Hỗ trợ & Thông tin</h4>
          <span class="wb-accent-line" aria-hidden="true"></span>
          <ul>
            <li><a href="/help">Trung Tâm Trợ Giúp</a></li>
            <li><a href="/faq">Câu hỏi thường gặp</a></li>
            <li><a href="/about">Giới thiệu nền tảng</a></li>
            <li><a href="/contact">Liên hệ hỗ trợ</a></li>
          </ul>
        </div>

        <div class="wb-footer-stats-box">
          <div class="wb-footer-stats-heading">Quy mô học liệu thật</div>
          <a href="/learning" class="wb-footer-stat-item">
            <div class="wb-footer-stat-num">${escapeHtml(statLanguages)}</div>
            <div class="wb-footer-stat-label">${escapeHtml(statLanguagesLabel)}</div>
          </a>
          <a href="/specialized" class="wb-footer-stat-item">
            <div class="wb-footer-stat-num">${escapeHtml(statTerms)}</div>
            <div class="wb-footer-stat-label">${escapeHtml(statTermsLabel)}</div>
          </a>
        </div>
      </div>
    </div>

    <div class="wb-footer-wave" aria-hidden="true">
      <svg viewBox="0 0 1440 72" preserveAspectRatio="none"><path d="M0,48 C280,8 560,72 900,34 C1160,8 1340,22 1440,36 L1440,72 L0,72 Z" fill="#146466"/><path d="M980,46 C1180,18 1340,8 1440,16 L1440,28 C1340,22 1180,32 980,54 Z" fill="#C92F1C"/></svg>
    </div>

    <div class="wb-footer-bottom-bar">
      <div class="wb-container wb-footer-bottom-inner">
        <div>© 2026 ${escapeHtml(footerSlogan)}</div>
        <div class="wb-footer-legal-links">
          <a href="/policies/terms">Điều khoản sử dụng</a>
          <span>|</span>
          <a href="/policies/privacy">Chính sách bảo mật</a>
          <span>|</span>
          <a href="/contact">Liên hệ</a>
        </div>
      </div>
    </div>
  </footer>

  <dialog id="wb-auth-gate" class="wb-auth-gate" aria-labelledby="wb-auth-gate-title">
    <div class="wb-card" style="margin:0;max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;">
        <h3 id="wb-auth-gate-title" style="margin:0;color:var(--wb-teal);">Đăng nhập để tiếp tục</h3>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm wb-dialog-close" data-wb-auth-gate-close aria-label="Đóng">${NAV_ICONS.close}</button>
      </div>
      <p id="wb-auth-gate-message" class="wb-muted" style="margin:0 0 16px;">Tính năng này cần tài khoản WORD BRIDGE. Sau khi đăng nhập, bạn sẽ quay lại đúng trang hiện tại.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-auth-gate-close>Hủy</button>
        <a id="wb-auth-gate-cta" href="${escapeHtml(loginHref)}" class="wb-btn wb-btn-primary wb-btn-sm">Đăng nhập ngay</a>
      </div>
    </div>
  </dialog>

  <div id="wb-toast-root" aria-live="polite"></div>
  <script src="/scripts/i18n.js" defer></script>
  <script src="/scripts/app.js" defer></script>
</body>
</html>`;
}
