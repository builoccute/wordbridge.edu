/**
 * WORD BRIDGE — Unified Multi-Page Layouts (Public & 100% Vietnamese Admin) — V3.1
 * Includes <meta name="wb-csrf-token"> for authenticated sessions.
 */

import { BRAND } from '../config/constants.js';
import { PUBLIC_HEADER_NAV, PUBLIC_FOOTER_SECTIONS, ADMIN_NAV_GROUPS } from '../config/sitemap.js';
import { escapeHtml } from '../utils/validation.js';

export function renderBrandLogo() {
  return `
    <a href="/" class="wb-logo-slot" aria-label="WORD BRIDGE — Trang chủ">
      <span class="wb-logo-wordmark"><span class="wb-logo-word">WORD</span> <span class="wb-logo-bridge">BRIDGE</span></span>
      <span class="wb-logo-tagline">${escapeHtml(BRAND.tagline)}</span>
    </a>`;
}

export function renderBreadcrumbs(items = []) {
  if (!items.length) return '';
  const parts = items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    if (isLast || !item.href) {
      return `<span aria-current="page">${escapeHtml(item.label)}</span>`;
    }
    return `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a><span aria-hidden="true">/</span>`;
  });
  return `<nav class="wb-breadcrumb" aria-label="Đường dẫn điều hướng">${parts.join('')}</nav>`;
}

export function renderPublicPage({
  title,
  description,
  currentPath = '/',
  breadcrumbs = [],
  user = null,
  contentHtml = '',
}) {
  const navLinks = PUBLIC_HEADER_NAV.map((item) => {
    const isActive = item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href);
    return `<a href="${item.href}" class="${isActive ? 'active' : ''}">${escapeHtml(item.label)}</a>`;
  }).join('');

  const authBlock = user
    ? `
      <div class="wb-auth-actions">
        <a href="/my-learning" class="wb-btn wb-btn-ghost wb-btn-sm">Lộ trình cá nhân</a>
        <a href="/account/security" class="wb-btn wb-btn-ghost wb-btn-sm">Trung tâm bảo mật</a>
        <a href="/account" class="wb-btn wb-btn-outline wb-btn-sm">${escapeHtml(user.fullName)}</a>
        ${user.roles?.length ? '<a href="/admin" class="wb-btn wb-btn-accent wb-btn-sm">Quản trị</a>' : ''}
        <button type="button" class="wb-btn wb-btn-ghost wb-btn-sm" data-wb-logout>Đăng xuất</button>
      </div>`
    : `
      <div class="wb-auth-actions">
        <a href="/login" class="wb-btn wb-btn-outline wb-btn-sm">Đăng nhập</a>
        <a href="/register" class="wb-btn wb-btn-primary wb-btn-sm">Đăng ký</a>
      </div>`;

  const footerCols = PUBLIC_FOOTER_SECTIONS.map((sec) => `
    <div>
      <h4>${escapeHtml(sec.title)}</h4>
      <ul>
        ${sec.links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('')}
      </ul>
    </div>`).join('');

  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}" />` : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | ${BRAND.name}</title>
  <meta name="description" content="${escapeHtml(description || 'WORD BRIDGE — Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga.')}" />
  ${csrfMeta}
  <link rel="stylesheet" href="/public/styles/design-system.css" />
</head>
<body>
  <header class="wb-header">
    <div class="wb-container wb-header-inner">
      ${renderBrandLogo()}
      <nav class="wb-nav" aria-label="Điều hướng chính">${navLinks}</nav>
      ${authBlock}
    </div>
  </header>

  <main class="wb-main">
    <div class="wb-container">
      ${renderBreadcrumbs(breadcrumbs)}
      <div id="wb-global-status" role="status" aria-live="polite"></div>
      ${contentHtml}
    </div>
  </main>

  <footer class="wb-footer">
    <div class="wb-container">
      <div class="wb-footer-grid">
        <div>
          <div style="font-size:1.25rem;font-weight:800;letter-spacing:0.04em;margin-bottom:6px;">
            <span style="color:#E2E2C4;">WORD</span> <span style="color:#FF8C7A;">BRIDGE</span>
          </div>
          <p style="margin:0 0 8px;font-size:0.9rem;color:#E2E2C4;">${escapeHtml(BRAND.tagline)}</p>
          <p style="margin:0;font-size:0.86rem;color:#CBE6E6;">Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga.</p>
          <p style="margin:10px 0 0;font-size:0.82rem;color:#A8D3D3;">CSKH: cskh@wordbridge.vn · Liên hệ: contact@wordbridge.vn</p>
        </div>
        ${footerCols}
      </div>
      <div class="wb-footer-bottom">
        <span>${BRAND.copyright}</span>
        <span>Học tập có cấu trúc · Trung – Anh – Nga · Không mạng xã hội · Không cấp chứng chỉ</span>
      </div>
    </div>
  </footer>
  <script src="/public/scripts/app.js" defer></script>
</body>
</html>`;
}

export function renderAdminPage({
  title,
  currentPath = '/admin',
  user,
  contentHtml = '',
}) {
  const sidebarHtml = ADMIN_NAV_GROUPS.map((group) => `
    <div class="wb-admin-group-title">${escapeHtml(group.groupVi)}</div>
    ${group.items.map((item) => `
      <a href="${item.href}" class="${currentPath === item.href ? 'active' : ''}">${escapeHtml(item.label)}</a>
    `).join('')}
  `).join('');

  const csrfMeta = user?.csrfToken ? `<meta name="wb-csrf-token" content="${escapeHtml(user.csrfToken)}" />` : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | Quản trị WORD BRIDGE</title>
  ${csrfMeta}
  <link rel="stylesheet" href="/public/styles/design-system.css" />
</head>
<body>
  <div class="wb-admin-shell">
    <aside class="wb-admin-sidebar" aria-label="Điều hướng quản trị">
      <div style="padding:4px 10px 16px;border-bottom:1px solid rgba(255,255,255,0.14);">
        <div style="font-size:1.15rem;font-weight:800;color:#E2E2C4;">QUẢN TRỊ WORD BRIDGE</div>
        <div style="font-size:0.78rem;color:#A8D3D3;margin-top:4px;">Xin chào, ${escapeHtml(user?.fullName || 'Quản trị viên')}</div>
        <div style="margin-top:8px;"><a href="/" style="display:inline;padding:0;color:#E2E2C4;text-decoration:underline;">← Về trang công khai</a></div>
      </div>
      ${sidebarHtml}
    </aside>
    <main class="wb-admin-content">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <h1 style="margin:0;font-size:1.5rem;color:#146466;">${escapeHtml(title)}</h1>
        <div>
          <span class="wb-badge">Vai trò: ${escapeHtml((user?.roleLabels || []).join(', ') || 'Chưa gán')}</span>
          <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-logout style="margin-left:8px;">Đăng xuất</button>
        </div>
      </header>
      <div id="wb-global-status" role="status" aria-live="polite"></div>
      ${contentHtml}
    </main>
  </div>
  <script src="/public/scripts/app.js" defer></script>
</body>
</html>`;
}
