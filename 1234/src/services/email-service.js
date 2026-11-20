/**
 * WORD BRIDGE — Event-Driven Email Automation Engine (V3.1 Hardened)
 * Enforces Section 66–72 (V3.0) & Section 8–12, 18 (V3.1):
 * - Official senders: noreply@wordbridge.vn (Reply-To: cskh@wordbridge.vn),
 *   cskh@wordbridge.vn, contact@wordbridge.vn
 * - Full HTML + Plain Text fallback for every email
 * - Idempotency key prevents duplicate sends
 * - Real retry dispatch for RETRYING events
 * - HMAC-SHA256 webhook signature verification + timestamp freshness + replay protection
 * - Honest delivery status tracking: never claims DELIVERED unless signed webhook confirms
 */

import { renderEmailTemplate } from '../../email/templates/registry.js';
import { generateId, hmacSha256Hex, timingSafeEqual } from '../utils/crypto.js';

export class EmailService {
  constructor(db, env = {}) {
    this.db = db;
    this.env = env;
    this.providerName = env.EMAIL_PROVIDER || 'unconfigured';
  }

  async sendEventEmail({
    eventType,
    templateKey,
    recipientEmail,
    accountId = null,
    variables = {},
    idempotencyKey,
  }) {
    if (!idempotencyKey) {
      throw new Error('idempotencyKey là bắt buộc để chống gửi trùng email.');
    }

    const existing = await this.db
      .prepare('SELECT id, delivery_status, provider_message_id FROM wb_email_events WHERE idempotency_key = ?')
      .bind(idempotencyKey)
      .first();

    if (existing) {
      return {
        deduplicated: true,
        eventId: existing.id,
        status: existing.delivery_status,
        providerMessageId: existing.provider_message_id,
      };
    }

    const rendered = renderEmailTemplate(templateKey, variables, {
      officialSvgUrl: this.env.OFFICIAL_LOGO_SVG_URL || null,
    });

    const eventId = generateId('eml');
    await this.db
      .prepare(`
        INSERT INTO wb_email_events (
          id, idempotency_key, event_type, template_key, template_version,
          sender_address, reply_to_address, recipient_email, account_id,
          subject, variables_json, delivery_status, provider_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', ?)
      `)
      .bind(
        eventId,
        idempotencyKey,
        eventType,
        rendered.templateKey,
        rendered.templateVersion,
        rendered.senderAddress,
        rendered.replyTo,
        recipientEmail.toLowerCase(),
        accountId,
        rendered.subject,
        JSON.stringify(variables),
        this.providerName
      )
      .run();

    await this.recordDeliveryLog(eventId, 'QUEUED', { eventType, templateKey });

    const dispatchResult = await this.dispatchToProvider({
      eventId,
      from: rendered.from,
      replyTo: rendered.replyTo,
      to: recipientEmail.toLowerCase(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return {
      deduplicated: false,
      eventId,
      status: dispatchResult.status,
      provider: this.providerName,
      providerMessageId: dispatchResult.providerMessageId || null,
      renderedPreview: {
        from: rendered.from,
        replyTo: rendered.replyTo,
        subject: rendered.subject,
      },
    };
  }

  async retryQueuedEvent(eventId) {
    const row = await this.db
      .prepare('SELECT * FROM wb_email_events WHERE id = ?')
      .bind(eventId)
      .first();
    if (!row) return { ok: false, error: 'Không tìm thấy email event.' };
    if (row.retry_count >= row.max_retries) {
      await this.db
        .prepare("UPDATE wb_email_events SET delivery_status = 'FAILED', next_retry_at = NULL, updated_at = datetime('now') WHERE id = ?")
        .bind(eventId)
        .run();
      return { ok: false, status: 'FAILED', reason: 'Đã chạm giới hạn số lần thử lại.' };
    }
    const vars = JSON.parse(row.variables_json || '{}');
    const rendered = renderEmailTemplate(row.template_key, vars, {
      officialSvgUrl: this.env.OFFICIAL_LOGO_SVG_URL || null,
    });
    const res = await this.dispatchToProvider({
      eventId: row.id,
      from: rendered.from,
      replyTo: rendered.replyTo,
      to: row.recipient_email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    return { ok: res.status === 'ACCEPTED', eventId: row.id, status: res.status };
  }

  async dispatchToProvider({ eventId, from, replyTo, to, subject, html, text }) {
    if (this.providerName === 'unconfigured' || (this.providerName === 'resend' && !this.env.RESEND_API_KEY)) {
      const reason = 'Nhà cung cấp email chưa được cấu hình (EMAIL_PROVIDER=unconfigured hoặc thiếu RESEND_API_KEY). Không giả mạo trạng thái DELIVERED.';
      await this.db
        .prepare(`
          UPDATE wb_email_events
          SET delivery_status = 'BLOCKED_UNCONFIGURED', last_error = ?, updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(reason, eventId)
        .run();
      await this.recordDeliveryLog(eventId, 'BLOCKED_UNCONFIGURED', { reason });
      return { status: 'BLOCKED_UNCONFIGURED', reason };
    }

    if (this.providerName === 'resend') {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html, text }),
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.message || `Resend HTTP ${res.status}`);
        }

        const providerMessageId = payload.id || null;
        await this.db
          .prepare(`
            UPDATE wb_email_events
            SET delivery_status = 'ACCEPTED', provider_message_id = ?, next_retry_at = NULL, last_error = NULL, updated_at = datetime('now')
            WHERE id = ?
          `)
          .bind(providerMessageId, eventId)
          .run();
        await this.recordDeliveryLog(eventId, 'ACCEPTED', payload);
        return { status: 'ACCEPTED', providerMessageId };
      } catch (err) {
        return this.markRetryOrFail(eventId, err.message);
      }
    }

    return this.markRetryOrFail(eventId, `Email provider không được hỗ trợ: ${this.providerName}`);
  }

  async markRetryOrFail(eventId, errorMessage) {
    const row = await this.db
      .prepare('SELECT retry_count, max_retries FROM wb_email_events WHERE id = ?')
      .bind(eventId)
      .first();
    const nextRetry = (row?.retry_count || 0) + 1;
    const maxRetries = row?.max_retries || 3;
    const isFinalFailure = nextRetry > maxRetries;
    const newStatus = isFinalFailure ? 'FAILED' : 'RETRYING';
    const backoffMinutes = Math.pow(2, nextRetry) * 5;

    await this.db
      .prepare(`
        UPDATE wb_email_events
        SET delivery_status = ?, retry_count = ?, last_error = ?,
            next_retry_at = CASE WHEN ? = 'RETRYING' THEN datetime('now', '+' || ? || ' minutes') ELSE NULL END,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(newStatus, nextRetry, String(errorMessage).slice(0, 500), newStatus, backoffMinutes, eventId)
      .run();

    await this.recordDeliveryLog(eventId, newStatus, { error: errorMessage, retryCount: nextRetry });
    return { status: newStatus, error: errorMessage };
  }

  /**
   * Section 18: Signed Webhook Verification + Anti-Replay + Idempotency
   * Expected headers: X-WB-Webhook-Id, X-WB-Webhook-Timestamp (unix sec), X-WB-Signature (hex HMAC-SHA256 of `${timestamp}.${rawBody}`)
   */
  async verifyAndHandleWebhook({ rawBody, signature, timestamp, webhookEventId }) {
    const secret = this.env.EMAIL_WEBHOOK_SECRET;
    if (!secret) {
      return {
        ok: false,
        status: 503,
        code: 'BLOCKED_UNCONFIGURED',
        error: 'EMAIL_WEBHOOK_SECRET chưa được cấu hình. Từ chối cập nhật trạng thái email từ webhook chưa xác thực.',
      };
    }
    if (!signature || !timestamp || !webhookEventId) {
      return { ok: false, status: 401, code: 'WEBHOOK_SIGNATURE_MISSING', error: 'Thiếu chữ ký, timestamp hoặc mã sự kiện webhook.' };
    }

    const tsNum = Number(timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > 300) {
      return { ok: false, status: 401, code: 'WEBHOOK_REPLAY_EXPIRED', error: 'Timestamp webhook không hợp lệ hoặc vượt ngưỡng chống replay (300 giây).' };
    }

    const expectedSig = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
    if (!timingSafeEqual(String(signature).trim().toLowerCase(), expectedSig)) {
      return { ok: false, status: 401, code: 'WEBHOOK_SIGNATURE_INVALID', error: 'Chữ ký HMAC-SHA256 webhook không hợp lệ.' };
    }

    // Idempotency / anti-replay check on webhookEventId
    const seen = await this.db
      .prepare('SELECT event_id FROM wb_webhook_events WHERE event_id = ?')
      .bind(webhookEventId)
      .first();
    if (seen) {
      return { ok: true, status: 200, deduplicated: true, message: 'Sự kiện webhook đã được xử lý trước đó.' };
    }

    const body = JSON.parse(rawBody || '{}');
    const webhookEventType = body.type || body.webhookEventType;
    const providerMessageId = body.data?.email_id || body.providerMessageId;

    await this.db
      .prepare('INSERT INTO wb_webhook_events (event_id, provider, event_type, signature_verified) VALUES (?, ?, ?, 1)')
      .bind(webhookEventId, this.providerName, String(webhookEventType || 'unknown'))
      .run();

    const statusMap = {
      'email.sent': 'SENT',
      'email.delivered': 'DELIVERED',
      'email.bounced': 'BOUNCED',
      'email.complained': 'COMPLAINED',
      'email.delivery_delayed': 'RETRYING',
    };
    const mapped = statusMap[webhookEventType];
    if (!mapped) {
      return { ok: true, status: 200, ignored: true, reason: `Sự kiện webhook không ánh xạ: ${webhookEventType}` };
    }

    const eventRow = await this.db
      .prepare('SELECT id FROM wb_email_events WHERE provider_message_id = ?')
      .bind(providerMessageId)
      .first();
    if (!eventRow) {
      return { ok: true, status: 200, ignored: true, reason: 'Không tìm thấy email_event tương ứng.' };
    }

    await this.db
      .prepare("UPDATE wb_email_events SET delivery_status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(mapped, eventRow.id)
      .run();
    await this.recordDeliveryLog(eventRow.id, mapped, { webhookEventId, webhookEventType });
    return { ok: true, status: 200, updated: true, eventId: eventRow.id, deliveryStatus: mapped };
  }

  async recordDeliveryLog(emailEventId, status, payload = {}) {
    await this.db
      .prepare(`
        INSERT INTO wb_email_delivery_logs (id, email_event_id, status, provider_payload_json)
        VALUES (?, ?, ?, ?)
      `)
      .bind(generateId('elg'), emailEventId, status, JSON.stringify(payload))
      .run();
  }
}
