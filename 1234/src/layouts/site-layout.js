/**
 * WORD BRIDGE — Unified Layout (100% Visual Identity Preserved)
 * - Exact 5 Header links with monochrome SVG icons
 * - VI/EN locale switcher (<select data-wb-locale>)
 * - Central Auth Gate dialog (#wb-auth-gate) with safe return_to & SVG close icon
 * - Zero href="#" fake links, zero hardcoded fake stats ("10.000+")
 * - Local discovery entries for /learner-meet, /reader, /examinations
 */
import { BRAND, ECOSYSTEM, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';

const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  meet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 19c0-2 1.8-3.6 4-4"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 1.9"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};

const PUBLIC_NAV_ITEMS = [
  { label: 'Trang chủ', href: '/', icon: NAV_ICONS.home },
  { label: 'Học tập', href: '/learning', icon: NAV_ICONS.learn },
  { label: 'Learner Meet', href: '/learner-meet', icon: NAV_ICONS.meet },
  { label: 'Cổng Luyện Tập', href: '/practice', icon: NAV_ICONS.practice },
  { label: 'Trung Tâm Trợ Giúp', href: '/help', icon: NAV_ICONS.help },
];

export function renderBrandLogo() {
  return `<a href="/" class="wb-brand" aria-label="${escapeHtml(BRAND.name)}">
    <img src="/branding/logo-wordbridge.svg" alt="${escapeHtml(BRAND.name)}" style="height:44px;width:auto;border-radius:6px;" />
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
    ? `<style>:root{--wb-teal:${escapeHtml(runtime.site.primary_color || '#035257')};--wb-red:${escapeHtml(runtime.site.accent_color || '#CB0203')};--wb-aqua:${escapeHtml(runtime.site.secondary_color || '#3DA2A0')};}${runtime.site.custom_css || ''}</style>`
    : '';

  const navHtml = PUBLIC_NAV_ITEMS
    .map((item) => {
      const active = currentPath === item.href || (item.href !== '/' && !item.href.startsWith('http') && currentPath.startsWith(item.href));
      return `<a href="${escapeHtml(item.href)}" class="${active ? 'active' : ''}">${item.icon}<span>${escapeHtml(item.label)}</span></a>`;
    })
    .join('');

  const crumbHtml = breadcrumbs.length
    ? `<nav aria-label="Breadcrumb" style="font-size:0.84rem;margin-bottom:14px;color:var(--wb-text-muted);">${breadcrumbs
        .map((c, i) => (c.href && i < breadcrumbs.length - 1 ? `<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a> › ` : `<span>${escapeHtml(c.label)}</span>`))
        .join('')}</nav>`
    : '';

  const loginHref = signInUrl(currentPath.startsWith('http') ? '/' : currentPath, 'header.login');
  const localeControl = `<select class="wb-select wb-btn-sm" data-wb-locale aria-label="Ngôn ngữ giao diện" style="width:auto;min-width:64px;padding:4px 8px;"><option value="vi">VI</option><option value="en">EN</option></select>`;

  const authActions = user
    ? `${localeControl}
       <a href="/account" class="wb-btn wb-btn-outline wb-btn-sm wb-hide-mobile">${escapeHtml(user.fullName || user.email)}</a>
       <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-logout>Đăng xuất</button>`
    : `${localeControl}
       <a href="${escapeHtml(loginHref)}" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>
       <a href="${escapeHtml(ECOSYSTEM.portal)}/register" class="wb-btn wb-btn-accent wb-btn-sm wb-hide-mobile">Đăng ký</a>`;

  // Honest footer stats (never hardcoded fake "10.000+")
  const statLanguages = s.footer_stat_languages || '3 ngôn ngữ';
  const statLanguagesLabel = s.footer_stat_languages_label || 'Trung – Anh – Nga';
  const statTerms = s.footer_stat_terms || '12.104+';
  const statTermsLabel = s.footer_stat_terms_label || 'Thuật ngữ chuyên ngành';
  const footerSlogan = s.footer_slogan || 'WORD BRIDGE – Kết nối tri thức, mở rộng thế giới ngôn ngữ';
  const fbUrl = s.social_facebook || '/contact';
  const ytUrl = s.social_youtube || '/about';
  const ttUrl = s.social_tiktok || '/learning';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | ${escapeHtml(BRAND.name)}</title>
  <meta name="description" content="${escapeHtml(description || 'WORD BRIDGE — Nền tảng học ngôn ngữ Trung – Anh – Nga và kết nối người học toàn cầu.')}" />
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
        <div>
          <div class="wb-footer-logo-pill">
            <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" />
          </div>
          <p style="font-size:0.88rem;margin:0 0 10px;color:#E2F6F6;">Nền tảng học ngôn ngữ và kết nối người học toàn cầu</p>
          <div style="width:42px;height:3px;background:#CB0203;border-radius:2px;margin-bottom:10px;"></div>
          <div class="wb-footer-lang-pills">
            <span class="wb-footer-lang-pill"><strong style="color:#FF6B6B;">ZH</strong> Tiếng Trung</span>
            <span class="wb-footer-lang-pill"><strong style="color:#63B3FF;">EN</strong> Tiếng Anh</span>
            <span class="wb-footer-lang-pill"><strong style="color:#C09BFF;">RU</strong> Tiếng Nga</span>
          </div>
          <div style="font-size:0.78rem;opacity:0.85;margin-top:8px;">Kết nối với WORD BRIDGE</div>
          <div class="wb-footer-socials">
            <a href="${escapeHtml(fbUrl)}" class="wb-footer-social-btn" aria-label="Liên hệ cộng đồng">f</a>
            <a href="${escapeHtml(ytUrl)}" class="wb-footer-social-btn" aria-label="Giới thiệu nền tảng">▶</a>
            <a href="${escapeHtml(ttUrl)}" class="wb-footer-social-btn" aria-label="Khám phá học tập">♪</a>
            <a href="/" class="wb-footer-social-btn" aria-label="Trang chủ WORD BRIDGE">WB</a>
          </div>
        </div>

        <div class="wb-footer-col">
          <h4>Học tập & Chương trình</h4>
          <ul>
            <li><a href="/learning">› Chương trình học</a></li>
            <li><a href="/learning/path">› Lộ trình học tập</a></li>
            <li><a href="/specialized">› Ngoại ngữ Chuyên ngành</a></li>
            <li><a href="/reader">› Thư Viện Tài Liệu</a></li>
            <li><a href="/dictionary">› Từ điển Ngôn ngữ</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Cộng đồng & Kết nối</h4>
          <ul>
            <li><a href="/learner-meet">› Learner Meet</a></li>
            <li><a href="/my-knowledge">› My Knowledge</a></li>
            <li><a href="/practice">› Cổng Luyện Tập</a></li>
            <li><a href="/examinations">› Cổng Khảo Thí</a></li>
          </ul>
        </div>

        <div class="wb-footer-col">
          <h4>Hỗ trợ & Thông tin</h4>
          <ul>
            <li><a href="/help">› Trung Tâm Trợ Giúp</a></li>
            <li><a href="/faq">› Câu hỏi thường gặp</a></li>
            <li><a href="/about">› Giới thiệu nền tảng</a></li>
            <li><a href="/contact">› Liên hệ hỗ trợ</a></li>
          </ul>
        </div>

        <div class="wb-footer-stats-box">
          <div style="font-weight:800;font-size:0.95rem;color:#fff;">Quy mô dữ liệu thật</div>
          <div class="wb-footer-stat-item">
            <div>
              <div class="wb-footer-stat-num">${escapeHtml(statLanguages)}</div>
              <div style="font-size:0.78rem;color:#BCE9E8;">${escapeHtml(statLanguagesLabel)}</div>
            </div>
          </div>
          <div class="wb-footer-stat-item">
            <div>
              <div class="wb-footer-stat-num">${escapeHtml(statTerms)}</div>
              <div style="font-size:0.78rem;color:#BCE9E8;">${escapeHtml(statTermsLabel)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="wb-footer-glow-art">
        <img src="/branding/footer-glow-book.jpg" alt="WORD BRIDGE Global Knowledge" />
      </div>
    </div>

    <div class="wb-footer-bottom-bar">
      <div class="wb-container wb-footer-bottom-inner">
        <div><span style="color:#3DA2A0;font-weight:900;margin-right:8px;">|</span><strong>${escapeHtml(footerSlogan)}</strong></div>
        <div style="opacity:0.85;">© 2026 WORD BRIDGE. All rights reserved.</div>
      </div>
    </div>
  </footer>

  <dialog id="wb-auth-gate" class="wb-auth-gate" aria-labelledby="wb-auth-gate-title">
    <div class="wb-card" style="margin:0;max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;">
        <h3 id="wb-auth-gate-title" style="margin:0;color:var(--wb-teal);">Đăng nhập để tiếp tục</h3>
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm wb-dialog-close" data-wb-auth-gate-close aria-label="Đóng">${NAV_ICONS.close}</button>
      </div>
      <p id="wb-auth-gate-message" class="wb-muted" style="margin:0 0 16px;">Hành động này cần tài khoản. Sau đăng nhập, WORD BRIDGE sẽ quay lại trang hiện tại với intent an toàn.</p>
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

export function renderAdminPage(opts) {
  return renderPublicPage(opts);
}
