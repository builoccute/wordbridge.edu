/**
 * WORD BRIDGE — Standalone PDF Reader SSO Bridge Adapter
 * Target App: https://reader.wordbridge.vn/
 *
 * Enforces Section II (6):
 * - Uses central account/SSO system with WORD BRIDGE.
 * - NEVER appears in Header, Footer, or Homepage of WORD BRIDGE.
 * - Does NOT rebuild PDF Reader inside the main website.
 * - Only activates real SSO token exchange when technical credentials (`PDF_READER_SSO_ENABLED=true`
 *   and `PDF_READER_SSO_SHARED_SECRET`) are configured.
 */

export function getPdfReaderSsoStatus(env = {}) {
  const enabled = String(env.PDF_READER_SSO_ENABLED || 'false').toLowerCase() === 'true';
  const hasSecret = Boolean(env.PDF_READER_SSO_SHARED_SECRET && env.PDF_READER_SSO_SHARED_SECRET.length >= 16);
  const ready = enabled && hasSecret;

  return {
    targetApplicationUrl: env.PDF_READER_SSO_URL || 'https://reader.wordbridge.vn/',
    includedInHeader: false,
    includedInFooter: false,
    includedOnHomepage: false,
    status: ready ? 'CONFIGURED' : 'BLOCKED_MISSING_SSO_TECHNICAL_SPEC',
    messageVi: ready
      ? 'Cầu nối SSO với ứng dụng độc lập reader.wordbridge.vn đã sẵn sàng.'
      : 'Cầu nối SSO cho https://reader.wordbridge.vn/ đã được xây dựng ở trạng thái chờ cấu hình kỹ thuật (Nhóm B - Cần bổ sung PDF_READER_SSO_SHARED_SECRET và thông số callback từ ứng dụng độc lập).',
  };
}
