'use strict';
const crypto = require('crypto');
const { EMAIL_ADDRESSES } = require('../config/constants');
const { getIntegrationStatus } = require('../config/env');
const { renderEmailTemplate } = require('../emails/templates.registry');

class EmailAdapter {
  constructor(db) {
    this.db = db;
  }

  /**
   * PHẦN 21: Phân luồng cứng 4 địa chỉ email chính thức + Tích hợp RESEND_API_KEY
   * - noreply@wordbridge.io.vn: Luôn là địa chỉ gửi tự động của hệ thống
   * - wordbridge.education@gmail.com: Liên hệ chính thức
   * - cskh@wordbridge.io.vn: Chăm sóc khách hàng & Hỗ trợ
   * - contact@wordbridge.io.vn: Hợp tác và truyền thông
   */
  resolveRoutingForCategory(category) {
    const fromEmail = EMAIL_ADDRESSES.SYSTEM_NOREPLY;
    let replyTo = EMAIL_ADDRESSES.CUSTOMER_SUPPORT;
    if (category === 'partnership' || category === 'media') {
      replyTo = EMAIL_ADDRESSES.PARTNERSHIP_MEDIA;
    } else if (category === 'system' || category === 'general') {
      replyTo = EMAIL_ADDRESSES.OFFICIAL_CONTACT;
    }
    return {
      from_email: fromEmail,
      sender_name: EMAIL_ADDRESSES.SYSTEM_SENDER_NAME,
      reply_to_email: replyTo
    };
  }

  async sendViaResendApi({ resendApiKey, fromName, fromEmail, toEmail, replyToEmail, subject, html, idempotencyKey }) {
    if (!resendApiKey || typeof fetch !== 'function') {
      return { sent: false, reason: 'RESEND_API_KEY chưa được cung cấp.' };
    }
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey || crypto.randomBytes(8).toString('hex')
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [toEmail],
          reply_to: replyToEmail,
          subject,
          html
        })
      });
      const resJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { sent: false, reason: resJson.message || `Resend HTTP ${response.status}` };
      }
      return { sent: true, provider_id: resJson.id || 'resend_ok' };
    } catch (err) {
      return { sent: false, reason: err.message };
    }
  }

  enqueueEmail({ templateSlug, toEmail, variables = {}, idempotencyKey = null, resendApiKey = null }) {
    const rendered = renderEmailTemplate(templateSlug, Object.assign({ email: toEmail }, variables));
    const routing = this.resolveRoutingForCategory(rendered.category);
    const dedupKey = idempotencyKey || crypto
      .createHash('sha256')
      .update(`${templateSlug}:${toEmail}:${rendered.subject}:${variables.ref_code || ''}`)
      .digest('hex');

    const existing = this.db.get('SELECT * FROM email_queue WHERE idempotency_key = ?', [dedupKey]);
    if (existing) {
      return { deduplicated: true, queue_item: existing };
    }

    const activeResendKey = resendApiKey || process.env.RESEND_API_KEY || '';
    const statusInfo = getIntegrationStatus({ RESEND_API_KEY: activeResendKey }).email;
    const initialStatus = statusInfo.connected ? 'sent' : 'provider_unconfigured';
    const now = new Date().toISOString();
    const id = 'emq_' + crypto.randomBytes(8).toString('hex');

    this.db.run(
      `INSERT INTO email_queue (
        id, idempotency_key, template_slug, to_email, from_email, reply_to_email,
        subject, rendered_html, status, retry_count, error_message, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dedupKey,
        templateSlug,
        toEmail,
        routing.from_email,
        routing.reply_to_email,
        rendered.subject,
        rendered.html,
        initialStatus,
        0,
        statusInfo.connected ? '' : 'Chưa cấu hình RESEND_API_KEY; email đã được lưu vào hàng đợi an toàn.',
        now,
        statusInfo.connected ? now : null
      ]
    );

    if (activeResendKey && process.env.NODE_ENV !== 'test') {
      this.sendViaResendApi({
        resendApiKey: activeResendKey,
        fromName: routing.sender_name,
        fromEmail: routing.from_email,
        toEmail,
        replyToEmail: routing.reply_to_email,
        subject: rendered.subject,
        html: rendered.html,
        idempotencyKey: dedupKey
      }).catch(() => {});
    }

    return {
      deduplicated: false,
      id,
      status: initialStatus,
      provider: activeResendKey ? 'resend' : statusInfo.provider,
      provider_connected: statusInfo.connected,
      from_email: routing.from_email,
      reply_to_email: routing.reply_to_email,
      subject: rendered.subject
    };
  }

  retryEmail(queueId) {
    const item = this.db.get('SELECT * FROM email_queue WHERE id = ?', [queueId]);
    if (!item) throw new Error('Không tìm thấy email trong hàng đợi.');
    const statusInfo = getIntegrationStatus().email;
    const newStatus = statusInfo.connected ? 'sent' : 'provider_unconfigured';
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE email_queue SET retry_count = retry_count + 1, status = ?, processed_at = ? WHERE id = ?`,
      [newStatus, statusInfo.connected ? now : null, queueId]
    );
    return this.db.get('SELECT * FROM email_queue WHERE id = ?', [queueId]);
  }
}

module.exports = { EmailAdapter };
