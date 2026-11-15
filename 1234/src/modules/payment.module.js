'use strict';
const crypto = require('crypto');
const { requireAuth, requirePermission } = require('../security/rbac.middleware');

/**
 * PAYMENT CORE, THANH TOÁN QR, ĐỐI SOÁT, HÓA ĐƠN & HOÀN TIỀN (PHẦN 17)
 * Quy tắc bắt buộc:
 * - Không đánh dấu thành công chỉ vì tải ảnh biên lai hoặc người dùng tự bấm nút "Tôi đã chuyển khoản".
 * - Chỉ mở quyền dịch vụ sau khi xác minh qua Webhook ngân hàng hợp lệ hoặc đối soát thủ công được phân quyền.
 */
class PaymentModule {
  constructor(db, paymentAdapter, emailAdapter) {
    this.db = db;
    this.paymentAdapter = paymentAdapter;
    this.emailAdapter = emailAdapter;
  }

  createOrder(user, { plan_code, org_id = null, promo_code = '', nonprofit_approved = false }) {
    requireAuth(user);
    const plan = this.db.get(`SELECT * FROM service_plans WHERE code = ? AND is_active = 1`, [plan_code]);
    if (!plan) throw new Error('Gói dịch vụ không tồn tại.');
    if (plan.price_vnd === 0) {
      throw new Error('Gói Personal Free (0 đồng) không cần tạo đơn thanh toán.');
    }

    let baseAmount = plan.price_vnd;
    let discountAmount = 0;

    // Ưu đãi tổ chức phi lợi nhuận giảm 30% (không tự động cộng dồn ưu đãi khác - PHẦN 16.4)
    if (nonprofit_approved && plan.target_type === 'organization') {
      discountAmount = Math.round(baseAmount * 0.3);
    } else if (promo_code) {
      const promo = this.db.get(`SELECT * FROM promotions WHERE code = ? AND status = 'active'`, [String(promo_code).trim().toUpperCase()]);
      if (!promo) throw new Error('Mã khuyến mãi không tồn tại hoặc đã ngưng áp dụng.');
      const now = new Date();
      if (new Date(promo.starts_at) > now || new Date(promo.ends_at) < now) {
        throw new Error('Mã khuyến mãi nằm ngoài thời gian hiệu lực.');
      }
      if (promo.used_count >= promo.max_uses || promo.budget_used_vnd >= promo.budget_limit_vnd) {
        throw new Error('Chiến dịch khuyến mãi đã hết lượt hoặc hết hạn mức ngân sách.');
      }
      if (promo.discount_type === 'percent') {
        discountAmount = Math.min(Math.round((baseAmount * promo.discount_value) / 100), promo.max_discount_vnd);
      } else {
        discountAmount = Math.min(promo.discount_value, promo.max_discount_vnd);
      }
      this.db.run(
        `UPDATE promotions SET used_count = used_count + 1, budget_used_vnd = budget_used_vnd + ? WHERE id = ?`,
        [discountAmount, promo.id]
      );
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const orderId = 'ord_' + crypto.randomBytes(8).toString('hex');
    const orderCode = 'WBORD' + Date.now().toString().slice(-6) + crypto.randomInt(10, 99);
    const transactionCode = 'WBTXN' + crypto.randomBytes(5).toString('hex').toUpperCase();
    const transferContent = `WB ${orderCode} ${transactionCode}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const qrPayload = this.paymentAdapter.generateQrPayload({
      orderCode,
      transactionCode,
      amountVnd: finalAmount,
      transferContent
    });

    this.db.run(
      `INSERT INTO payment_orders (
        id, order_code, transaction_code, user_id, org_id, plan_code,
        base_amount_vnd, discount_amount_vnd, final_amount_vnd, paid_amount_vnd,
        promo_code, transfer_content, qr_payload, status, verification_source,
        verified_by, verified_at, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'pending', '', NULL, NULL, ?, ?)`,
      [
        orderId,
        orderCode,
        transactionCode,
        user.id,
        org_id,
        plan.code,
        baseAmount,
        discountAmount,
        finalAmount,
        promo_code || '',
        transferContent,
        qrPayload,
        expiresAt,
        now.toISOString()
      ]
    );

    this.emailAdapter.enqueueEmail({
      templateSlug: 'order-created.html',
      toEmail: user.email,
      variables: {
        full_name: user.full_name,
        order_code: orderCode,
        transaction_code: transactionCode,
        plan_name: plan.name,
        amount_vnd: `${finalAmount.toLocaleString('vi-VN')} đồng`,
        transfer_content: transferContent,
        expires_at: expiresAt,
        ref_code: orderCode
      }
    });

    return this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [orderId]);
  }

  /**
   * PHẦN 17.3: Người dùng thông báo đã chuyển khoản hoặc tải ảnh biên lai
   * -> Tuyệt đối KHÔNG đánh dấu 'paid', chỉ giữ trạng thái 'pending' chờ Webhook/Đối soát.
   */
  notifyCustomerTransferSubmitted(user, { order_id }) {
    requireAuth(user);
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ? AND user_id = ?`, [order_id, user.id]);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    if (order.status === 'paid') return order;

    this.emailAdapter.enqueueEmail({
      templateSlug: 'payment-pending.html',
      toEmail: user.email,
      variables: {
        full_name: user.full_name,
        order_code: order.order_code,
        transfer_content: order.transfer_content,
        ref_code: order.transaction_code
      }
    });

    return {
      order_id: order.id,
      status: 'pending',
      service_activated: false,
      notice: 'Đã ghi nhận thông báo chờ đối soát. Theo quy định an toàn tài chính, hệ thống không tự động mở quyền dịch vụ chỉ từ thao tác bấm nút hoặc tải ảnh biên lai mà cần xác thực từ Webhook ngân hàng hoặc đối soát phân quyền.'
    };
  }

  reconcileOrderAuthorized(actorUser, { order_id, received_amount_vnd, received_content, source = 'manual_reconcile' }) {
    if (source === 'manual_reconcile') {
      requirePermission(actorUser, 'payments.reconcile');
    }
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ? OR order_code = ?`, [order_id, order_id]);
    if (!order) throw new Error('Không tìm thấy đơn hàng cần đối soát.');

    const res = this.paymentAdapter.reconcileTransaction({
      order,
      receivedAmountVnd: received_amount_vnd,
      receivedContent: received_content,
      source,
      verifierId: actorUser ? actorUser.id : 'webhook_system'
    });

    const buyer = this.db.get(`SELECT * FROM users WHERE id = ?`, [order.user_id]);
    if (res.ok && !res.already_paid) {
      const now = new Date();
      const nowIso = now.toISOString();
      const days = order.plan_code.includes('yearly') ? 365 : 30;
      const expIso = new Date(now.getTime() + days * 24 * 3600 * 1000).toISOString();

      // Mở quyền dịch vụ sau khi đối soát hợp lệ
      this.db.run(`UPDATE users SET plan_code = ?, updated_at = ? WHERE id = ?`, [order.plan_code, nowIso, order.user_id]);
      this.db.run(
        `INSERT INTO subscriptions (id, user_id, org_id, plan_code, status, auto_renew, started_at, expires_at, history_json, created_at)
         VALUES (?, ?, ?, ?, 'active', 0, ?, ?, ?, ?)`,
        [
          'sub_' + crypto.randomBytes(8).toString('hex'),
          order.user_id,
          order.org_id,
          order.plan_code,
          nowIso,
          expIso,
          JSON.stringify([{ action: 'activated_after_verified_payment', order_code: order.order_code, at: nowIso }]),
          nowIso
        ]
      );

      // Phát hành Hóa đơn điện tử
      const invId = 'inv_' + crypto.randomBytes(8).toString('hex');
      const invNo = 'WBINV-' + new Date().getFullYear() + '-' + crypto.randomInt(10000, 99999);
      this.db.run(
        `INSERT OR IGNORE INTO invoices (id, invoice_number, order_id, user_id, buyer_name, buyer_tax_code, items_json, total_vnd, issued_at)
         VALUES (?, ?, ?, ?, ?, '', ?, ?, ?)`,
        [
          invId,
          invNo,
          order.id,
          order.user_id,
          buyer ? buyer.full_name : 'Khách hàng WORD BRIDGE',
          JSON.stringify([{ plan_code: order.plan_code, amount_vnd: order.final_amount_vnd }]),
          order.final_amount_vnd,
          nowIso
        ]
      );

      if (buyer) {
        this.emailAdapter.enqueueEmail({
          templateSlug: 'payment-success.html',
          toEmail: buyer.email,
          variables: {
            full_name: buyer.full_name,
            order_code: order.order_code,
            transaction_code: order.transaction_code,
            plan_name: order.plan_code,
            amount_vnd: `${order.final_amount_vnd.toLocaleString('vi-VN')} đồng`,
            ref_code: order.order_code
          }
        });
        this.emailAdapter.enqueueEmail({
          templateSlug: 'invoice.html',
          toEmail: buyer.email,
          variables: {
            full_name: buyer.full_name,
            order_code: order.order_code,
            invoice_number: invNo,
            ref_code: invNo
          }
        });
      }
    } else if (!res.ok && buyer) {
      this.emailAdapter.enqueueEmail({
        templateSlug: 'payment-failed.html',
        toEmail: buyer.email,
        variables: {
          full_name: buyer.full_name,
          order_code: order.order_code,
          transaction_code: order.transaction_code,
          failure_reason: res.message,
          ref_code: order.order_code
        }
      });
    }

    return Object.assign({}, res, { order: this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [order.id]) });
  }

  refundOrder(adminUser, { order_id, reason = 'Hoàn tiền theo yêu cầu hợp lệ' }) {
    requirePermission(adminUser, 'refunds.manage');
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [order_id]);
    if (!order || order.status !== 'paid') {
      throw new Error('Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán thành công.');
    }
    const nowIso = new Date().toISOString();
    this.db.run(`UPDATE payment_orders SET status = 'refunded', verified_at = ? WHERE id = ?`, [nowIso, order.id]);
    this.db.run(`UPDATE users SET plan_code = 'personal_free', updated_at = ? WHERE id = ?`, [nowIso, order.user_id]);
    const buyer = this.db.get(`SELECT * FROM users WHERE id = ?`, [order.user_id]);
    if (buyer) {
      this.emailAdapter.enqueueEmail({
        templateSlug: 'payment-refund.html',
        toEmail: buyer.email,
        variables: {
          full_name: buyer.full_name,
          order_code: order.order_code,
          refund_amount_vnd: `${order.paid_amount_vnd.toLocaleString('vi-VN')} đồng`,
          ref_code: 'REF-' + order.order_code
        }
      });
    }
    return this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [order.id]);
  }
}

module.exports = { PaymentModule };
