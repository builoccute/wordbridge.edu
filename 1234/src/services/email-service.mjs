/**
 * WORD BRIDGE — Official Email Delivery Service & 11 Responsive HTML/Plain-Text Templates
 *
 * Enforces Section XII Requirements:
 * 1. Three official addresses:
 *    - cskh@wordbridge.vn (Chăm sóc khách hàng)
 *    - noreply@wordbridge.vn (Email tự động)
 *    - contact@wordbridge.vn (Liên hệ và hợp tác)
 * 2. Strict Reply-To policy:
 *    - Emails from noreply@wordbridge.vn ALWAYS set:
 *      From: WORD BRIDGE <noreply@wordbridge.vn>
 *      Reply-To: cskh@wordbridge.vn
 * 3. Email Logo Policy:
 *    - NEVER uses PNG for the email logo.
 *    - Uses inline SVG slot + progressive HTML/text wordmark fallback ("WORD" in Deep Teal #146466,
 *      "BRIDGE" in Vermilion Red #C92F1C, tagline "Where Languages Bring People Together.")
 *      for clients that strip inline <svg> (e.g., Gmail Web/Mobile, Outlook Desktop).
 * 4. Honest Delivery Status:
 *    - Does NOT fake successful email transmission when EMAIL_PROVIDER / EMAIL_API_KEY are unconfigured.
 *    - Records accurate status (`BLOCKED_MISSING_CREDENTIALS` vs `SENT`) in `email_records`.
 */

import { escapeHtml, generateId } from '../utils/security.mjs';

export const OFFICIAL_EMAIL_ADDRESSES = Object.freeze({
  CSKH: 'cskh@wordbridge.vn',
  NOREPLY: 'noreply@wordbridge.vn',
  CONTACT: 'contact@wordbridge.vn',
});

export const EMAIL_TEMPLATES_CATALOG = Object.freeze({
  EMAIL_VERIFICATION: {
    code: 'EMAIL_VERIFICATION',
    nameVi: '1. Xác minh email',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE] Xác minh địa chỉ email kích hoạt tài khoản của bạn',
  },
  WELCOME: {
    code: 'WELCOME',
    nameVi: '2. Chào mừng',
    senderType: 'NOREPLY',
    defaultSubject: 'Chào mừng bạn đến với WORD BRIDGE — Where Languages Bring People Together',
  },
  PASSWORD_RECOVERY: {
    code: 'PASSWORD_RECOVERY',
    nameVi: '3. Khôi phục mật khẩu',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE] Liên kết đặt lại mật khẩu an toàn',
  },
  NEW_LOGIN_ALERT: {
    code: 'NEW_LOGIN_ALERT',
    nameVi: '4. Đăng nhập mới',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE Bảo mật] Phát hiện phiên đăng nhập mới vào tài khoản của bạn',
  },
  SECURITY_CHANGE: {
    code: 'SECURITY_CHANGE',
    nameVi: '5. Thay đổi bảo mật',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE Bảo mật] Thông báo cập nhật thiết lập bảo mật tài khoản',
  },
  ACCOUNT_NOTICE: {
    code: 'ACCOUNT_NOTICE',
    nameVi: '6. Thông báo tài khoản',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE] Thông báo cập nhật trạng thái tài khoản & quyền lợi',
  },
  LEARNING_NOTICE: {
    code: 'LEARNING_NOTICE',
    nameVi: '7. Thông báo học tập',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE Học tập] Nhắc lịch ôn tập & lộ trình Trung – Anh – Nga',
  },
  EXAM_NOTICE: {
    code: 'EXAM_NOTICE',
    nameVi: '8. Thông báo khảo thí',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE Khảo thí] Kết quả bài đánh giá năng lực ngôn ngữ',
  },
  SYSTEM_NOTICE: {
    code: 'SYSTEM_NOTICE',
    nameVi: '9. Thông báo hệ thống',
    senderType: 'NOREPLY',
    defaultSubject: '[WORD BRIDGE Hệ thống] Thông báo bảo trì & cập nhật nền tảng',
  },
  SUPPORT_RESPONSE: {
    code: 'SUPPORT_RESPONSE',
    nameVi: '10. Phản hồi hỗ trợ',
    senderType: 'CSKH',
    defaultSubject: '[WORD BRIDGE CSKH] Phản hồi yêu cầu hỗ trợ học viên',
  },
  CONTACT_INQUIRY: {
    code: 'CONTACT_INQUIRY',
    nameVi: '11. Liên hệ',
    senderType: 'CONTACT',
    defaultSubject: '[WORD BRIDGE Liên hệ] Xác nhận tiếp nhận thông tin liên hệ & hợp tác',
  },
});

export function resolveSenderHeaders(senderType = 'NOREPLY') {
  if (senderType === 'CSKH') {
    return {
      from: 'WORD BRIDGE CSKH <cskh@wordbridge.vn>',
      replyTo: 'cskh@wordbridge.vn',
    };
  }
  if (senderType === 'CONTACT') {
    return {
      from: 'WORD BRIDGE Contact <contact@wordbridge.vn>',
      replyTo: 'contact@wordbridge.vn',
    };
  }
  return {
    from: 'WORD BRIDGE <noreply@wordbridge.vn>',
    replyTo: 'cskh@wordbridge.vn',
  };
}

/**
 * Renders an email template with SVG-first logo slot + HTML/Text fallback (STRICTLY NO PNG).
 */
export function renderEmailTemplate(templateCode, variables = {}) {
  const meta = EMAIL_TEMPLATES_CATALOG[templateCode];
  if (!meta) {
    throw new Error(`Không tìm thấy mẫu email: ${templateCode}`);
  }

  const recipientName = escapeHtml(variables.recipientName || 'Học viên WORD BRIDGE');
  const headline = escapeHtml(variables.headline || meta.defaultSubject);
  const bodyParagraph = escapeHtml(
    variables.bodyText ||
      'Thông báo chính thức từ nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga WORD BRIDGE.'
  );
  const ctaLabel = variables.ctaLabel ? escapeHtml(variables.ctaLabel) : null;
  const ctaUrl = variables.ctaUrl ? escapeHtml(variables.ctaUrl) : null;
  const securityNote = escapeHtml(
    variables.securityNote ||
      'Vì lý do an toàn, WORD BRIDGE không bao giờ yêu cầu mật khẩu, mã PIN thiết bị hoặc khóa bí mật qua email.'
  );

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#E2E2C4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#142829;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#E2E2C4;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #5AABA9;">
          <!-- Header with SVG Logo Slot + HTML/Text Fallback (ZERO PNG) -->
          <tr>
            <td style="padding:24px 32px;background-color:#FFFFFF;border-bottom:3px solid #146466;">
              <!-- Official SVG Integration Slot (Replaced automatically when official brand.svg is uploaded) -->
              <div data-logo-slot="official-svg-slot" style="display:inline-block;vertical-align:middle;">
                <span style="font-size:24px;font-weight:800;letter-spacing:0.5px;color:#146466;">WORD</span>
                <span style="font-size:24px;font-weight:800;letter-spacing:0.5px;color:#C92F1C;margin-left:4px;">BRIDGE</span>
                <div style="font-size:12px;color:#146466;font-weight:600;margin-top:2px;">Where Languages Bring People Together.</div>
              </div>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px 0;font-size:15px;color:#146466;font-weight:600;">Xin chào ${recipientName},</p>
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.4;color:#142829;">${headline}</h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#243B3C;">${bodyParagraph}</p>
              ${
                ctaLabel && ctaUrl
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" bgcolor="#146466" style="border-radius:8px;">
                          <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;">${ctaLabel}</a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
              <div style="margin-top:24px;padding:14px 16px;background-color:#F6F6EC;border-left:4px solid #5AABA9;border-radius:6px;font-size:13px;line-height:1.5;color:#334E4F;">
                ${securityNote}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#146466;color:#FFFFFF;font-size:12px;line-height:1.6;">
              <div style="font-weight:700;font-size:13px;">WORD BRIDGE — Where Languages Bring People Together.</div>
              <div>Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga.</div>
              <div style="margin-top:6px;">Website: <a href="https://wordbridge.io.vn/" style="color:#E2E2C4;text-decoration:underline;">https://wordbridge.io.vn/</a> | Hỗ trợ: <a href="mailto:cskh@wordbridge.vn" style="color:#E2E2C4;text-decoration:underline;">cskh@wordbridge.vn</a></div>
              <div style="margin-top:6px;opacity:0.85;">© 2026 WORD BRIDGE. All rights reserved.</div>
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
    '------------------------------------------------------------',
    `Xin chào ${variables.recipientName || 'Học viên WORD BRIDGE'},`,
    '',
    variables.headline || meta.defaultSubject,
    '',
    variables.bodyText ||
      'Thông báo chính thức từ nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga WORD BRIDGE.',
    ctaLabel && ctaUrl ? `
${ctaLabel}: ${ctaUrl}
` : '',
    `Lưu ý bảo mật: ${
      variables.securityNote ||
      'Vì lý do an toàn, WORD BRIDGE không bao giờ yêu cầu mật khẩu, mã PIN thiết bị hoặc khóa bí mật qua email.'
    }`,
    '------------------------------------------------------------',
    'Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga',
    'Website: https://wordbridge.io.vn/ | CSKH: cskh@wordbridge.vn',
    '© 2026 WORD BRIDGE. All rights reserved.',
  ]
    .filter(Boolean)
    .join("\n");

  const headers = resolveSenderHeaders(meta.senderType);

  return {
    templateCode,
    from: headers.from,
    replyTo: headers.replyTo,
    subject: variables.subject || meta.defaultSubject,
    html,
    text,
  };
}

export class EmailDeliveryAdapter {
  constructor(env = {}) {
    this.provider = env.EMAIL_PROVIDER || '';
    this.apiKey = env.EMAIL_API_KEY || '';
    this.outbox = [];
  }

  async sendTemplatedEmail({ templateCode, to, accountId = null, variables = {} }) {
    const rendered = renderEmailTemplate(templateCode, variables);
    const recordId = generateId('em');

    // Never fake successful sending when external provider credentials are not configured
    if (!this.provider || !this.apiKey) {
      const record = {
        id: recordId,
        accountId,
        templateCode,
        from: rendered.from,
        replyTo: rendered.replyTo,
        to,
        subject: rendered.subject,
        deliveryStatus: 'BLOCKED_MISSING_CREDENTIALS',
        providerName: 'UNCONFIGURED',
        errorDetail:
          'Chưa cấu hình EMAIL_PROVIDER và EMAIL_API_KEY. Email đã được kết xuất HTML/PlainText và lưu vào hàng đợi kiểm tra, không giả lập gửi thành công.',
        html: rendered.html,
        text: rendered.text,
        createdAt: new Date().toISOString(),
      };
      this.outbox.push(record);
      return record;
    }

    // Real HTTP dispatch for Resend-compatible API when configured
    if (this.provider === 'resend') {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: rendered.from,
          to: [to],
          reply_to: rendered.replyTo,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      const record = {
        id: recordId,
        accountId,
        templateCode,
        from: rendered.from,
        replyTo: rendered.replyTo,
        to,
        subject: rendered.subject,
        deliveryStatus: resp.ok ? 'SENT' : 'FAILED',
        providerName: 'resend',
        providerMessageId: data?.id || null,
        errorDetail: resp.ok ? null : JSON.stringify(data),
        createdAt: new Date().toISOString(),
      };
      this.outbox.push(record);
      return record;
    }

    throw new Error(`Nhà cung cấp email chưa được hỗ trợ: ${this.provider}`);
  }
}
