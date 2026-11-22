/** WORD BRIDGE Domain 1 — accessible two-locale public shell and V4 navigation. */
import { BRAND, TRANSLATIONS, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/http.js';

const ICONS = Object.freeze({
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6.5 12 3l9 3.5V18l-9 3-9-3zM12 3v18M3 6.5l9 4 9-4"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 12l6 6L21 5"/><path d="M3 5h8"/></svg>',
  discover: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>',
  specialized: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 5V3h8v2M3 12h18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.2 16.2 4.3 4.3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
});

const NAV_GROUPS = Object.freeze([
  { key: 'learn', href: '/learning', label: 'nav.learn', children: [
    ['/learning', 'nav.learningHome'], ['/learning/path', 'nav.learningPath'], ['/learning/skills', 'nav.skills'], ['/my-knowledge', 'nav.knowledge'],
  ]},
  { key: 'practice', href: '/practice', label: 'nav.practice', children: [
    ['/practice', 'nav.practiceHome'], ['/practice/listening', 'nav.listening'], ['/practice/speaking', 'nav.speaking'], ['/practice/reading', 'nav.reading'], ['/practice/writing', 'nav.writing'], ['/practice/vocabulary', 'nav.vocabulary'], ['/practice/grammar', 'nav.grammar'], ['/vocabulary/review', 'nav.review'], ['/my-mistakes', 'nav.mistakes'], ['/practice/history', 'nav.history'],
  ]},
  { key: 'discover', href: '/dictionary', label: 'nav.discover', children: [
    ['/dictionary', 'nav.dictionary'], ['/search', 'nav.search'], ['/learner-meet', 'nav.meet'], ['/reader', 'footer.reader'],
  ]},
  { key: 'specialized', href: '/specialized', label: 'nav.specialized', children: [
    ['/specialized', 'nav.specialized'], ['/examinations', 'footer.exam'],
  ]},
]);

function validLink(value) {
  if (!value || value === '#') return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null; }
  catch { return null; }
}
function isActive(currentPath, href) {
  return href.startsWith('/') && (currentPath === href || currentPath.startsWith(`${href}/`));
}
function translateVi(key) { return TRANSLATIONS.vi[key] || key; }
function renderNavGroup(group, currentPath) {
  const active = isActive(currentPath, group.href) || group.children.some(([href]) => isActive(currentPath, href));
  const childHtml = group.children.map(([href, label]) => {
    const external = href.startsWith('http');
    return `<a href="${escapeHtml(href)}" ${external ? 'rel="noopener"' : ''} ${isActive(currentPath, href) ? 'aria-current="page"' : ''}><span data-i18n="${escapeHtml(label)}">${escapeHtml(translateVi(label))}</span></a>`;
  }).join('');
  return `<details class="wb-nav-group" ${active ? 'data-active="true"' : ''}><summary class="wb-main-link${active ? ' active' : ''}">${ICONS[group.key]}<span data-i18n="${group.label}">${escapeHtml(translateVi(group.label))}</span></summary><div class="wb-nav-menu"><a class="wb-nav-overview" href="${group.href}"><span data-i18n="${group.label}">${escapeHtml(translateVi(group.label))}</span></a>${childHtml}</div></details>`;
}

export function renderBrandLogo() {
  return `<a href="/" class="wb-brand" aria-label="WORD BRIDGE — Home"><img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" width="164" height="48" /></a>`;
}

export function renderPublicPage({ title, description = '', currentPath = '/', breadcrumbs = [], user = null, contentHtml = '', runtime = null }) {
  const settings = runtime?.settings || {};
  const notice = runtime?.site?.announcement_banner ? `<div class="wb-banner">${escapeHtml(runtime.site.announcement_banner)}</div>` : '';
  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}"/>` : '';
  const brandNav = NAV_GROUPS.map((group) => renderNavGroup(group, currentPath)).join('');
  const loginLink = signInUrl(currentPath.startsWith('/') ? currentPath : '/', 'auth.login');
  const actions = user
    ? `<a class="wb-btn wb-btn-outline wb-btn-sm" href="https://portal.wordbridge.io.vn/" data-i18n="user.account">Tài khoản</a><button type="button" data-wb-logout class="wb-btn wb-btn-ghost wb-btn-sm" data-i18n="user.logout">Đăng xuất</button>`
    : `<a class="wb-btn wb-btn-outline wb-btn-sm" href="${escapeHtml(loginLink)}" data-wb-auth-link data-i18n="user.login">Đăng nhập</a><a class="wb-btn wb-btn-primary wb-btn-sm wb-hide-mobile" href="https://portal.wordbridge.io.vn/register" data-wb-auth-link data-i18n="user.start">Bắt đầu học</a>`;
  const social = [['Facebook', settings.social_facebook], ['YouTube', settings.social_youtube], ['TikTok', settings.social_tiktok]]
    .map(([name, address]) => validLink(address) ? `<a href="${escapeHtml(validLink(address))}" rel="noopener noreferrer" target="_blank">${escapeHtml(name)}</a>` : '').filter(Boolean).join(' · ');
  const crumbHtml = breadcrumbs.length ? `<nav class="wb-crumbs" aria-label="Breadcrumb">${breadcrumbs.map((c, i) => c.href && i < breadcrumbs.length - 1 ? `<a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a>` : `<span>${escapeHtml(c.label)}</span>`).join(' / ')}</nav>` : '';

  return `<!doctype html><html lang="vi"><head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)} | ${escapeHtml(BRAND.name)}</title>
  <meta name="description" content="${escapeHtml(description || 'WORD BRIDGE — Học, luyện tập và sử dụng ngôn ngữ trong đời sống và công việc.')}"/>
  <link rel="icon" href="/branding/favicon.png" type="image/png"/><link rel="stylesheet" href="/styles/design-system.css"/>${csrfMeta}
  </head><body>
  <a class="wb-skip-link" href="#wb-main" data-i18n="access.skip">Chuyển tới nội dung</a>${notice}
  <header class="wb-header"><div class="wb-container wb-header-inner">
    ${renderBrandLogo()}
    <nav class="wb-nav" id="wb-main-nav" data-i18n-aria="access.mainNav" aria-label="Điều hướng chính">${brandNav}</nav>
    <div class="wb-header-actions"><a href="/search" class="wb-icon-button" data-i18n-aria="nav.search" aria-label="Tìm kiếm">${ICONS.search}</a><label class="wb-locale-control"><span class="wb-sr-only" data-i18n="access.locale">Ngôn ngữ giao diện</span><select data-wb-locale data-i18n-aria="access.locale" aria-label="Ngôn ngữ giao diện"><option value="vi">VI</option><option value="en">EN</option></select></label>${actions}<button type="button" class="wb-menu-toggle" data-wb-menu-toggle data-i18n-aria="access.openMenu" aria-label="Mở menu" aria-controls="wb-main-nav" aria-expanded="false">${ICONS.menu}</button></div>
  </div></header>
  <main id="wb-main" class="wb-main" tabindex="-1"><div class="wb-container">${crumbHtml}<div id="wb-global-status" role="status" aria-live="polite"></div>${contentHtml}</div></main>
  <footer class="wb-footer-v4"><div class="wb-container wb-footer-v4-grid wb-footer-clean">
    <div><h2>WORD BRIDGE</h2><p data-i18n="footer.tagline">Học, luyện tập và sử dụng ngôn ngữ trong cuộc sống và công việc.</p>${social ? `<p>${social}</p>` : ''}</div>
    <div><h3 data-i18n="footer.learn">Học tập</h3><a href="/learning" data-i18n="nav.learn">Học</a><a href="/learning/path" data-i18n="nav.learningPath">Lộ trình học tập</a><a href="/learning/skills" data-i18n="nav.skills">Trung tâm kỹ năng</a><a href="/my-knowledge">My Knowledge</a></div>
    <div><h3 data-i18n="footer.connect">Kết nối</h3><a href="/dictionary" data-i18n="footer.dictionary">Từ điển</a><a href="/learner-meet">Learner Meet</a><a href="/examinations" data-i18n="footer.exam">Đánh giá</a><a href="/reader" data-i18n="footer.reader">Thư viện</a></div>
    <div><h3 data-i18n="footer.help">Hỗ trợ</h3><a href="https://help.wordbridge.io.vn/" data-i18n="footer.support">Trung tâm trợ giúp</a><a href="/about" data-i18n="footer.about">Giới thiệu</a><a href="/policies/privacy" data-i18n="footer.privacy">Quyền riêng tư</a></div>
  </div><div class="wb-footer-bottom-bar"><div class="wb-container">© 2026 WORD BRIDGE</div></div></footer>
  <dialog id="wb-auth-gate" class="wb-auth-dialog" aria-labelledby="wb-auth-title"><form method="dialog"><button class="wb-dialog-close" value="cancel" aria-label="Đóng" data-wb-auth-close>${ICONS.close}</button></form><p class="wb-eyebrow">PUBLIC TO DISCOVER · SIGN IN TO DO</p><h2 id="wb-auth-title">Đăng nhập để tiếp tục</h2><p id="wb-auth-copy">Hành động này cần tài khoản. Sau đăng nhập, WORD BRIDGE sẽ quay lại trang hiện tại với intent an toàn.</p><div class="wb-practice-actions"><a class="wb-btn wb-btn-primary" href="${escapeHtml(loginLink)}" data-wb-auth-gate-login>Đăng nhập</a><button type="button" class="wb-btn wb-btn-ghost" data-wb-auth-close>Hủy</button></div></dialog>
  <div id="wb-toast-root" aria-live="polite" aria-atomic="true"></div><script src="/scripts/i18n.js" defer></script><script src="/scripts/app.js" defer></script>
  </body></html>`;
}
export const renderAdminPage = renderPublicPage;
