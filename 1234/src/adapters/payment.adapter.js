import { crypto } from '../config/runtime.js';
import { getIntegrationStatus } from '../config/env.js';

class PaymentAdapter {
  constructor(db) {
    this.db = db;
  }

  generateQrPayload({ orderCode, transactionCode, amountVnd, transferContent }) {
    const status = getIntegrationStatus().payment;
    const bankCode = process.env.PAYMENT_BANK_CODE || 'VIETQR_UNCONFIGURED';
    const accountName = process.env.PAYMENT_BANK_ACCOUNT_NAME || 'WORD BRIDGE EDUCATION';
    return JSON.stringify({
      standard: 'VietQR-EMVCo-2026',
      provider_connected: status.connected,
      bank_code: bankCode,
      account_name: accountName,
      order_code: orderCode,
      transaction_code: transactionCode,
      amount_vnd: amountVnd,
      transfer_content: transferContent
    });
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
      return { valid: false, reason: 'Chưa cấu hình PAYMENT_WEBHOOK_SECRET trên máy chủ.' };
    }
    if (!signatureHeader) {
      return { valid: false, reason: 'Thiếu chữ ký xác thực Webhook.' };
    }
    const expected = crypto.createHmac('sha256', secret).update(String(rawBody)).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(signatureHeader), 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, reason: 'Chữ ký Webhook không hợp lệ.' };
    }
    return { valid: true };
  }

  reconcileTransaction({ order, receivedAmountVnd, receivedContent, source, verifierId = null }) {
    if (order.status === 'paid') {
      return { already_paid: true, status: 'paid', message: 'Giao dịch đã được ghi nhận trước đó (Chống ghi nhận trùng).' };
    }
    const now = new Date();
    if (new Date(order.expires_at) < now && source !== 'manual_reconcile') {
      this.db.run(`UPDATE payment_orders SET status = 'expired' WHERE id = ?`, [order.id]);
      return { ok: false, status: 'expired', message: 'Giao dịch đã quá thời hạn thanh toán.' };
    }
    if (String(receivedContent || '').trim().toUpperCase() !== String(order.transfer_content).trim().toUpperCase()) {
      this.db.run(
        `UPDATE payment_orders SET status = 'wrong_content', paid_amount_vnd = ? WHERE id = ?`,
        [Number(receivedAmountVnd || 0), order.id]
      );
      return { ok: false, status: 'wrong_content', message: 'Sai nội dung chuyển khoản. Cần đối soát thủ công.' };
    }
    const paid = Number(receivedAmountVnd || 0);
    if (paid < order.final_amount_vnd) {
      this.db.run(
        `UPDATE payment_orders SET status = 'underpaid', paid_amount_vnd = ? WHERE id = ?`,
        [paid, order.id]
      );
      return { ok: false, status: 'underpaid', message: 'Số tiền thanh toán thấp hơn giá trị đơn hàng.' };
    }
    const finalStatus = paid > order.final_amount_vnd ? 'overpaid' : 'paid';
    const nowIso = now.toISOString();
    this.db.run(
      `UPDATE payment_orders
       SET status = 'paid', paid_amount_vnd = ?, verification_source = ?, verified_by = ?, verified_at = ?
       WHERE id = ?`,
      [paid, source, verifierId, nowIso, order.id]
    );
    return {
      ok: true,
      status: 'paid',
      overpaid_amount_vnd: paid > order.final_amount_vnd ? paid - order.final_amount_vnd : 0,
      verified_at: nowIso
    };
  }
}

export { PaymentAdapter };
export default { PaymentAdapter };
