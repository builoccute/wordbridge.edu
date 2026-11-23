/**
 * WORD BRIDGE V4.1 — Unified Maintenance Mode Renderer
 * Single-Domain Architecture: maintenance mode is controlled directly from D1
 * (`wb_platform_config`) via https://wordbridge.io.vn/quan-tri.
 * Zero external subdomain or remote external control plane proxy dependencies.
 */

export function renderMaintenancePage(site) {
  const title = site?.display_name || 'WORD BRIDGE';
  const msg = site?.maintenance_message || 'Hệ thống WORD BRIDGE đang bảo trì nâng cấp. Vui lòng quay lại sau ít phút.';
  return new Response(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Bảo trì hệ thống | ${title}</title>
<link rel="stylesheet" href="/styles/design-system.css"/></head>
<body style="justify-content:center;align-items:center;padding:24px;text-align:center;">
  <div class="wb-card" style="max-width:520px;border-top:5px solid #CB0203;">
    <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" style="height:46px;margin:0 auto 12px;"/>
    <h1 style="color:#035257;margin:8px 0;">Đang bảo trì hệ thống</h1>
    <p>${msg}</p>
    <p class="wb-muted">Trạng thái bảo trì được điều hành trực tiếp từ Trung tâm Quản trị <code>wordbridge.io.vn/quan-tri</code>.</p>
    <a href="/help" class="wb-btn wb-btn-outline">Xem Trung tâm Trợ giúp</a>
  </div>
</body></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '300' } });
}
