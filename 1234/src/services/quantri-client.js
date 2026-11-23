/**
 * WORD BRIDGE V4.2 — Maintenance Mode Renderer (503 Service Unavailable)
 * Clean public-facing maintenance notice with zero internal admin path exposure.
 */
import { escapeHtml } from '../utils/validation.js';
import { SECURITY_HEADERS } from '../utils/http.js';

export function renderMaintenancePage(site) {
  const title = escapeHtml(site?.display_name || 'WORD BRIDGE');
  const msg = escapeHtml(
    site?.maintenance_message ||
      'WORD BRIDGE đang nâng cấp và bảo trì hệ thống để mang đến trải nghiệm học tập tốt hơn. Vui lòng quay lại sau ít phút.'
  );
  return new Response(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>503 — Hệ thống đang bảo trì | ${title}</title>
  <link rel="stylesheet" href="/styles/design-system.css" />
</head>
<body>
  <main class="wb-error-shell">
    <section class="wb-error-card" role="status" aria-live="polite">
      <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" style="height:44px;margin:0 auto 14px;" />
      <div class="wb-error-code">503</div>
      <div class="wb-error-accent-bar"></div>
      <h1 class="wb-error-title">Hệ thống đang bảo trì</h1>
      <p class="wb-error-desc">${msg}</p>
      <div class="wb-error-actions">
        <a href="/" class="wb-btn wb-btn-primary">Quay lại sau</a>
        <a href="/help" class="wb-btn wb-btn-outline">Trung Tâm Trợ Giúp</a>
      </div>
    </section>
  </main>
</body>
</html>`, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '300',
      ...SECURITY_HEADERS,
    },
  });
}
