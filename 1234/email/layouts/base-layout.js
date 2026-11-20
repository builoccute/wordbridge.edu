/**
 * WORD BRIDGE — Email Base Layout (HTML + Plain Text Fallback)
 * Brand Palette: Deep Teal #146466, Vermilion Red #C92F1C, Aqua #5AABA9, Warm Ivory #E2E2C4
 * Logo Policy (Section 62.2):
 * - Prioritize official SVG when available, NEVER replace with PNG.
 * - Because email clients (Gmail/Outlook/Apple Mail) vary in SVG support, render a clean
 *   HTML/text brand wordmark fallback with exact brand colors and safe aspect layout.
 */

export function escapeEmailHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderEmailLogoHeader({ officialSvgUrl = null } = {}) {
  // Never emit PNG fallback; prefer official SVG if configured, with safe HTML wordmark fallback
  if (officialSvgUrl) {
    return `
      <div style="padding:4px 0;">
        <img src="${escapeEmailHtml(officialSvgUrl)}" alt="WORD BRIDGE — Where Languages Bring People Together." width="200" style="display:block;max-width:200px;height:auto;border:0;outline:none;text-decoration:none;" />
        <noscript>
          <span style="font-size:22px;font-weight:800;letter-spacing:0.04em;color:#146466;">WORD</span>
          <span style="font-size:22px;font-weight:800;letter-spacing:0.04em;color:#C92F1C;"> BRIDGE</span>
        </noscript>
      </div>`;
  }
  return `
    <div style="padding:4px 0;line-height:1.2;">
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:0.04em;">
        <span style="color:#146466;">WORD</span> <span style="color:#C92F1C;">BRIDGE</span>
      </div>
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#146466;margin-top:4px;">
        Where Languages Bring People Together.
      </div>
    </div>`;
}

export function renderEmailLayout({
  title,
  preheader = '',
  bodyHtml,
  bodyText,
  ctaLabel = null,
  ctaUrl = null,
  senderAddress = 'noreply@wordbridge.vn',
  replyToAddress = 'cskh@wordbridge.vn',
  officialSvgUrl = null,
}) {
  const supportNoteHtml = senderAddress === 'noreply@wordbridge.vn'
    ? `Email này được gửi tự động từ địa chỉ <strong>noreply@wordbridge.vn</strong>. Nếu cần hỗ trợ, vui lòng phản hồi tới <a href="mailto:${escapeEmailHtml(replyToAddress)}" style="color:#146466;">${escapeEmailHtml(replyToAddress)}</a>.`
    : `Bạn có thể phản hồi trực tiếp tới <a href="mailto:${escapeEmailHtml(replyToAddress)}" style="color:#146466;">${escapeEmailHtml(replyToAddress)}</a> để được đội ngũ WORD BRIDGE hỗ trợ.`;

  const supportNoteText = senderAddress === 'noreply@wordbridge.vn'
    ? `Email nay duoc gui tu dong tu noreply@wordbridge.vn. Neu can ho tro, vui long lien he: ${replyToAddress}`
    : `Ban co the phan hoi truc tiep toi: ${replyToAddress}`;

  const ctaBlockHtml = ctaLabel && ctaUrl
    ? `<div style="margin:24px 0;">
        <a href="${escapeEmailHtml(ctaUrl)}" style="display:inline-block;background-color:#146466;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">
          ${escapeEmailHtml(ctaLabel)}
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#52606D;word-break:break-all;">
          Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt: ${escapeEmailHtml(ctaUrl)}
        </p>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeEmailHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F7F7;font-family:'Segoe UI',Roboto,'Noto Sans',Helvetica,Arial,sans-serif;color:#1F2933;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeEmailHtml(preheader || title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F5F7F7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;border:1px solid #D9E2EC;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background-color:#E2E2C4;border-bottom:3px solid #146466;">
              ${renderEmailLogoHeader({ officialSvgUrl })}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#146466;">${escapeEmailHtml(title)}</h1>
              <div style="font-size:15px;line-height:1.65;color:#1F2933;">
                ${bodyHtml}
              </div>
              ${ctaBlockHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background-color:#F8FAFC;border-top:1px solid #E4E7EB;font-size:12px;line-height:1.6;color:#52606D;">
              <p style="margin:0 0 8px;">${supportNoteHtml}</p>
              <p style="margin:0 0 4px;"><strong>WORD BRIDGE</strong> — Where Languages Bring People Together.</p>
              <p style="margin:0;">Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga | <a href="https://www.wordbridge.vn/" style="color:#146466;">https://www.wordbridge.vn/</a></p>
              <p style="margin:6px 0 0;">© 2026 WORD BRIDGE. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'WORD BRIDGE — Where Languages Bring People Together.',
    '====================================================',
    title,
    '',
    bodyText,
    ctaLabel && ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : '',
    '',
    '----------------------------------------------------',
    supportNoteText,
    'Website: https://www.wordbridge.vn/',
    '© 2026 WORD BRIDGE. All rights reserved.',
  ].filter(Boolean).join('\n');

  return { html, text };
}
