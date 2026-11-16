import { crypto } from '../config/runtime.js';
import { EMAIL_ADDRESSES } from '../config/constants.js';
import { getIntegrationStatus } from '../config/env.js';
import { renderEmailTemplate } from '../emails/templates.registry.js';

/**
 * EMAIL ADAPTER TÍCH HỢP RESEND CHÍNH THỨC (PHẦN XVII & XXI.13)
 * Quy tắc bắt buộc:
 * - Phân luồng theo đúng 04 địa chỉ email chính thức.
 * - Tuyệt đối KHÔNG đánh dấu trạng thái 'sent' (Đã gửi) trước khi nhận được xác nhận thành công thực tế từ Resend API.
 * - Khi mới tạo: lưu vào hàng đợi với trạng thái 'queued' (hoặc 'provider_unconfigured' nếu chưa cấu hình khóa).
 * - Khi gọi Resend: ghi nhận provider_message_id và mã phản hồi thực tế; nếu lỗi lưu trạng thái 'failed' và error_message.
 * - Có khóa chống gửi trùng (idempotency_key), lịch sử gửi và cơ chế thử lại (retry).
 */
class EmailAdapter {
  constructor(db, customTransport = null) {
    this.db = db;
    this.customTransport = customTransport; // Cho phép gắn mock transport có xác nhận phản hồi trong kiểm thử hoặc fetch Resend thực tế
  }

  setTransport(fn) {
    this.customTransport = fn;
  }

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
    if (!resendApiKey) {
      return {
        sent: false,
        status: 'provider_unconfigured',
        http_status: 0,
        provider_id: null,
        reason: 'Chưa cấu hình RESEND_API_KEY trên máy chủ.'
      };
    }

    if (typeof this.customTransport === 'function') {
      return await this.customTransport({
        resendApiKey,
        fromName,
        fromEmail,
        toEmail,
        replyToEmail,
        subject,
        html,
        idempotencyKey
      });
    }

    if (typeof fetch !== 'function') {
      return {
        sent: false,
        status: 'failed',
        http_status: 0,
        provider_id: null,
        reason: 'Môi trường chưa hỗ trợ kết nối mạng ra ngoài tới Resend API.'
      };
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
      if (!response.ok || !resJson.id) {
        return {
          sent: false,
          status: 'failed',
          http_status: response.status,
          provider_id: null,
          reason: resJson.message || `Resend trả về mã HTTP ${response.status}`
        };
      }
      return {
        sent: true,
        status: 'sent',
        http_status: response.status,
        provider_id: String(resJson.id),
        reason: null
      };
    } catch (err) {
      return {
        sent: false,
        status: 'failed',
        http_status: 0,
        provider_id: null,
        reason: err.message || 'Lỗi kết nối tới Resend API'
      };
    }
  }

  /**
   * Đưa email vào hàng đợi với trạng thái 'queued' hoặc 'provider_unconfigured'.
   * Tuyệt đối KHÔNG tự gán status = 'sent' trước khi có xác nhận phản hồi từ Resend!
   */
  enqueueEmail({ templateSlug, toEmail, variables = {}, idempotencyKey = null, resendApiKey = null }) {
    const cleanTo = String(toEmail || '').trim().toLowerCase();
    if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
      throw new Error('Địa chỉ email người nhận không hợp lệ.');
    }

    const rendered = renderEmailTemplate(templateSlug, Object.assign({ email: cleanTo }, variables));
    const routing = this.resolveRoutingForCategory(rendered.category);
    const dedupKey = idempotencyKey || crypto
      .createHash('sha256')
      .update(`${templateSlug}:${cleanTo}:${rendered.subject}:${variables.ref_code || ''}`)
      .digest('hex');

    const existing = this.db.get('SELECT * FROM email_queue WHERE idempotency_key = ?', [dedupKey]);
    if (existing) {
      return {
        deduplicated: true,
        id: existing.id,
        status: existing.status,
        status_vi: this.translateEmailStatus(existing.status),
        queue_item: existing
      };
    }

    const activeResendKey = resendApiKey || process.env.RESEND_API_KEY || '';
    const statusInfo = getIntegrationStatus({ RESEND_API_KEY: activeResendKey }).email;
    // Khi mới đưa vào hàng đợi, nếu có key thì ở trạng thái 'queued' chờ xác nhận từ Resend, chưa bao giờ được tự đánh dấu 'sent'!
    const initialStatus = statusInfo.connected ? 'queued' : 'provider_unconfigured';
    const now = new Date().toISOString();
    const id = 'emq_' + crypto.randomBytes(8).toString('hex');

    this.db.run(
      `INSERT INTO email_queue (
        id, idempotency_key, template_slug, to_email, from_email, reply_to_email,
        subject, rendered_html, status, retry_count, error_message, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
      [
        id,
        dedupKey,
        templateSlug,
        cleanTo,
        routing.from_email,
        routing.reply_to_email,
        rendered.subject,
        rendered.html,
        initialStatus,
        statusInfo.connected ? 'Đang chờ xác nhận phản hồi từ Resend API' : 'Chưa cấu hình RESEND_API_KEY; đã lưu vào hàng đợi an toàn.',
        now
      ]
    );

    if (activeResendKey && (process.env.NODE_ENV !== 'test' || typeof this.customTransport === 'function')) {
      this.dispatchQueuedEmail(id, activeResendKey).catch(() => {});
    }

    const currentItem = this.db.get('SELECT * FROM email_queue WHERE id = ?', [id]);
    return {
      deduplicated: false,
      id,
      status: currentItem.status,
      status_vi: this.translateEmailStatus(currentItem.status),
      provider: activeResendKey ? 'resend' : statusInfo.provider,
      provider_connected: statusInfo.connected,
      from_email: routing.from_email,
      reply_to_email: routing.reply_to_email,
      subject: rendered.subject
    };
  }

  /**
   * Thực thi gửi tới Resend và CHỈ chuyển sang 'sent' khi Resend phản hồi thành công kèm provider_id.
   */
  async dispatchQueuedEmail(queueId, resendApiKey = null) {
    const item = this.db.get('SELECT * FROM email_queue WHERE id = ?', [queueId]);
    if (!item) {
      throw new Error('Không tìm thấy email trong hàng đợi.');
    }
    if (item.status === 'sent') {
      return {
        already_sent: true,
        sent: true,
        status: 'sent',
        status_vi: this.translateEmailStatus('sent'),
        queue_item: item
      };
    }

    const activeKey = resendApiKey !== null ? resendApiKey : (process.env.RESEND_API_KEY || '');
    const res = await this.sendViaResendApi({
      resendApiKey: activeKey,
      fromName: EMAIL_ADDRESSES.SYSTEM_SENDER_NAME,
      fromEmail: item.from_email,
      toEmail: item.to_email,
      replyToEmail: item.reply_to_email,
      subject: item.subject,
      html: item.rendered_html,
      idempotencyKey: item.idempotency_key
    });

    const nowIso = new Date().toISOString();
    if (res.sent && res.provider_id) {
      this.db.run(
        `UPDATE email_queue
         SET status = 'sent', error_message = ?, processed_at = ?
         WHERE id = ?`,
        [`Resend xác nhận thành công (ID: ${res.provider_id})`, nowIso, queueId]
      );
    } else {
      const nextStatus = res.status === 'provider_unconfigured' ? 'provider_unconfigured' : 'failed';
      this.db.run(
        `UPDATE email_queue
         SET status = ?, error_message = ?, processed_at = NULL
         WHERE id = ?`,
        [nextStatus, String(res.reason || 'Gửi email thất bại'), queueId]
      );
    }

    const updated = this.db.get('SELECT * FROM email_queue WHERE id = ?', [queueId]);
    return {
      sent: Boolean(res.sent && res.provider_id),
      status: updated.status,
      status_vi: this.translateEmailStatus(updated.status),
      provider_id: res.provider_id || null,
      http_status: res.http_status || 0,
      error: res.sent ? null : res.reason,
      queue_item: updated
    };
  }

  async retryEmail(queueId, resendApiKey = null) {
    const item = this.db.get('SELECT * FROM email_queue WHERE id = ?', [queueId]);
    if (!item) throw new Error('Không tìm thấy email trong hàng đợi.');
    if (item.status === 'sent') {
      return {
        already_sent: true,
        sent: true,
        status: 'sent',
        status_vi: this.translateEmailStatus('sent'),
        queue_item: item
      };
    }
    this.db.run(`UPDATE email_queue SET retry_count = retry_count + 1 WHERE id = ?`, [queueId]);
    return await this.dispatchQueuedEmail(queueId, resendApiKey);
  }

  translateEmailStatus(status) {
    const map = {
      queued: 'Đang chờ xác nhận gửi',
      sent: 'Đã gửi thành công',
      failed: 'Gửi thất bại',
      provider_unconfigured: 'Chờ cấu hình nhà cung cấp'
    };
    return map[status] || status;
  }
}

export { EmailAdapter };
export default { EmailAdapter };
