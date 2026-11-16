'use strict';
const crypto = require('crypto');
const { GB_BYTES, PLAN_DEFAULT_QUOTAS } = require('../config/constants');
const { requireAuth, requirePermission, requireOrgAccess } = require('../security/rbac.middleware');

/**
 * PAYMENT CORE, THANH TOÁN CHUYỂN KHOẢN NGÂN HÀNG THỦ CÔNG, ĐỐI SOÁT QR, HÓA ĐƠN & HOÀN TIỀN (PHẦN XV.4, 5 & XXI.14, 15)
 * Quy tắc bắt buộc:
 * - Không tự động kích hoạt dịch vụ chỉ dựa trên ảnh biên lai hoặc thao tác "Tôi đã thanh toán".
 * - Tách biệt hoàn toàn gói cá nhân và gói tổ chức:
 *   + Đơn hàng tổ chức (org_plus_monthly / org_plus_yearly) PHẢI kích hoạt quyền cho đúng tổ chức (organizations.plan_code, max_members = 30, storage_quotas của tổ chức), không ghi đè gói cá nhân của người mua.
 *   + Hoàn tiền gói tổ chức PHẢI xử lý đúng tổ chức hưởng quyền, tuyệt đối KHÔNG reset nhầm gói cá nhân của người mua!
 * - Lịch sử giao dịch không được xóa; mọi thay đổi phải có nhật ký (audit_logs).
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
      throw new Error('Gói Người Dùng bản Miễn Phí (0 đồng) không cần tạo đơn thanh toán.');
    }

    let resolvedOrgId = org_id || null;
    if (plan.target_type === 'organization') {
      if (!resolvedOrgId) {
        const myManagedOrg = this.db.get(
          `SELECT org_id FROM org_members WHERE user_id = ? AND status = 'active' AND org_role IN ('owner', 'head', 'manager', 'executive') ORDER BY joined_at DESC LIMIT 1`,
          [user.id]
        );
        if (myManagedOrg) {
          resolvedOrgId = myManagedOrg.org_id;
        }
      }
      if (!resolvedOrgId) {
        throw new Error('Gói dịch vụ dành cho Tổ chức yêu cầu chọn đúng Tổ chức hưởng quyền trước khi tạo đơn hàng.');
      }
      requireOrgAccess(this.db, user, resolvedOrgId, ['owner', 'head', 'manager', 'executive']);
    } else {
      resolvedOrgId = null;
    }

    let baseAmount = plan.price_vnd;
    let discountAmount = 0;

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
        resolvedOrgId,
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

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'payment_order_created', 'payment_orders', ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        user.id,
        user.role,
        orderId,
        JSON.stringify({ order_code: orderCode, plan_code: plan.code, target_type: plan.target_type, org_id: resolvedOrgId, final_amount_vnd: finalAmount }),
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

  notifyCustomerTransferSubmitted(user, { order_id, transfer_note = '' }) {
    requireAuth(user);
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ? AND user_id = ?`, [order_id, user.id]);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    if (order.status === 'paid') return order;

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'customer_notified_transfer_awaiting_reconcile', 'payment_orders', ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        user.id,
        user.role,
        order.id,
        JSON.stringify({ order_code: order.order_code, status_remained: 'pending', service_activated: false, transfer_note }),
        new Date().toISOString()
      ]
    );

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
      status_vi: 'Đang chờ đối soát',
      service_activated: false,
      notice: 'Đã ghi nhận thông tin chuyển khoản vào danh sách chờ đối soát. Hệ thống chỉ kích hoạt gói và quyền lợi sau khi Quản trị viên kiểm tra và xác nhận giao dịch thực tế.'
    };
  }

  /**
   * PHẦN XV.4, 5 & XXI.14:
   * Khi Admin xác nhận đối soát thanh toán:
   * - Nếu là gói Tổ chức (org_plus_monthly / org_plus_yearly): kích hoạt quyền cho ĐÚNG tổ chức (order.org_id), cập nhật hạn mức 50GB/120GB và tối đa 30 thành viên cho tổ chức đó, KHÔNG ghi đè plan_code cá nhân của người mua.
   * - Nếu là gói Cá nhân (personal_plus_monthly / personal_plus_yearly): kích hoạt quyền cho tài khoản cá nhân (order.user_id) và hạn mức 5GB.
   */
  reconcileOrderAuthorized(actorUser, { order_id, received_amount_vnd, received_content, source = 'manual_reconcile' }) {
    if (source === 'manual_reconcile') {
      requirePermission(actorUser, 'payments.reconcile');
    }
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ? OR order_code = ?`, [order_id, order_id]);
    if (!order) throw new Error('Không tìm thấy đơn hàng cần đối soát.');

    const plan = this.db.get(`SELECT * FROM service_plans WHERE code = ?`, [order.plan_code]);
    const isOrgPlan = Boolean(order.org_id || (plan && plan.target_type === 'organization') || String(order.plan_code).startsWith('org_'));

    const res = this.paymentAdapter.reconcileTransaction({
      order,
      receivedAmountVnd: received_amount_vnd,
      receivedContent: received_content,
      source,
      verifierId: actorUser ? actorUser.id : 'reconcile_system'
    });

    const buyer = this.db.get(`SELECT * FROM users WHERE id = ?`, [order.user_id]);
    if (res.ok && !res.already_paid) {
      const now = new Date();
      const nowIso = now.toISOString();
      const days = order.plan_code.includes('yearly') ? 365 : 30;
      const expIso = new Date(now.getTime() + days * 24 * 3600 * 1000).toISOString();
      const quotaSpec = PLAN_DEFAULT_QUOTAS[order.plan_code];

      if (isOrgPlan) {
        if (!order.org_id) {
          throw new Error('Đơn hàng gói Tổ chức thiếu mã định danh tổ chức (org_id) để kích hoạt quyền lợi.');
        }
        // Kích hoạt quyền lợi ở ĐÚNG tổ chức (PHẦN XXI.14)
        this.db.run(
          `UPDATE organizations SET plan_code = ?, max_members = 30, status = 'active', updated_at = ? WHERE id = ?`,
          [order.plan_code, nowIso, order.org_id]
        );
        const orgQuotaBytes = quotaSpec ? quotaSpec.quota_bytes : (order.plan_code.includes('yearly') ? 120 * GB_BYTES : 50 * GB_BYTES);
        this.db.run(
          `UPDATE storage_quotas
           SET plan_code = ?, default_quota_bytes = ?, is_monthly_cycle = 1, over_quota_blocked = 0, updated_at = ?
           WHERE target_type = 'organization' AND target_id = ?`,
          [order.plan_code, orgQuotaBytes, nowIso, order.org_id]
        );
      } else {
        // Kích hoạt quyền lợi ở tài khoản cá nhân
        this.db.run(`UPDATE users SET plan_code = ?, updated_at = ? WHERE id = ?`, [order.plan_code, nowIso, order.user_id]);
        const personalQuotaBytes = quotaSpec ? quotaSpec.quota_bytes : 5 * GB_BYTES;
        this.db.run(
          `UPDATE storage_quotas
           SET plan_code = ?, default_quota_bytes = ?, is_monthly_cycle = 0, over_quota_blocked = 0, updated_at = ?
           WHERE target_type = 'personal' AND target_id = ?`,
          [order.plan_code, personalQuotaBytes, nowIso, order.user_id]
        );
      }

      this.db.run(
        `INSERT INTO subscriptions (id, user_id, org_id, plan_code, status, auto_renew, started_at, expires_at, history_json, created_at)
         VALUES (?, ?, ?, ?, 'active', 0, ?, ?, ?, ?)`,
        [
          'sub_' + crypto.randomBytes(8).toString('hex'),
          order.user_id,
          isOrgPlan ? order.org_id : null,
          order.plan_code,
          nowIso,
          expIso,
          JSON.stringify([{
            action: 'activated_after_verified_payment',
            target_type: isOrgPlan ? 'organization' : 'personal',
            target_id: isOrgPlan ? order.org_id : order.user_id,
            order_code: order.order_code,
            at: nowIso
          }]),
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
          JSON.stringify([{ plan_code: order.plan_code, org_id: order.org_id, amount_vnd: order.final_amount_vnd }]),
          order.final_amount_vnd,
          nowIso
        ]
      );

      // Gửi thông báo trong website cho người dùng
      this.db.run(
        `INSERT INTO notifications (id, user_id, category, title, message, link_url, is_read, created_at)
         VALUES (?, ?, 'transaction', 'Đã xác nhận thanh toán và kích hoạt gói dịch vụ', ?, '/thanh-toan/lich-su', 0, ?)`,
        [
          'ntf_' + crypto.randomBytes(8).toString('hex'),
          order.user_id,
          `Đơn hàng ${order.order_code} (${plan ? plan.name : order.plan_code}) đã được đối soát thành công.`,
          nowIso
        ]
      );

      this.db.run(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
         VALUES (?, ?, ?, 'payment_order_reconciled', 'payment_orders', ?, '127.0.0.1', ?, ?)`,
        [
          'aud_' + crypto.randomBytes(8).toString('hex'),
          actorUser ? actorUser.id : 'system',
          actorUser ? actorUser.role : 'system',
          order.id,
          JSON.stringify({
            order_code: order.order_code,
            plan_code: order.plan_code,
            activated_target_type: isOrgPlan ? 'organization' : 'personal',
            activated_target_id: isOrgPlan ? order.org_id : order.user_id,
            paid_amount_vnd: received_amount_vnd
          }),
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
            plan_name: plan ? plan.name : order.plan_code,
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

    return Object.assign({}, res, {
      activated_target_type: isOrgPlan ? 'organization' : 'personal',
      activated_target_id: isOrgPlan ? order.org_id : order.user_id,
      order: this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [order.id])
    });
  }

  /**
   * PHẦN XV.5 & XXI.15:
   * Hoàn tiền phải xử lý đúng đối tượng hưởng quyền:
   * - Nếu đơn hàng là gói Tổ chức (order.org_id / org_plus_*): thu hồi gói Tổ chức về mức cơ bản ('org_trial', max_members = 10, không xóa dữ liệu đã lưu), TUYỆT ĐỐI KHÔNG reset nhầm gói cá nhân (users.plan_code) của người mua!
   * - Nếu đơn hàng là gói Cá nhân (personal_plus_*): đưa gói cá nhân của người mua về 'personal_free' (1GB, không xóa dữ liệu cũ).
   */
  refundOrder(adminUser, { order_id, reason = 'Hoàn tiền theo yêu cầu hợp lệ' }) {
    requirePermission(adminUser, 'refunds.manage');
    const order = this.db.get(`SELECT * FROM payment_orders WHERE id = ? OR order_code = ?`, [order_id, order_id]);
    if (!order || order.status !== 'paid') {
      throw new Error('Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán thành công.');
    }

    const plan = this.db.get(`SELECT * FROM service_plans WHERE code = ?`, [order.plan_code]);
    const isOrgPlan = Boolean(order.org_id || (plan && plan.target_type === 'organization') || String(order.plan_code).startsWith('org_'));
    const nowIso = new Date().toISOString();

    // Không bao giờ xóa lịch sử giao dịch; chỉ cập nhật trạng thái thành 'refunded'
    this.db.run(`UPDATE payment_orders SET status = 'refunded', verified_at = ? WHERE id = ?`, [nowIso, order.id]);

    if (isOrgPlan && order.org_id) {
      // Chỉ hạ gói trên đúng Tổ chức hưởng quyền, giữ nguyên 100% gói cá nhân của người mua!
      this.db.run(
        `UPDATE organizations SET plan_code = 'org_trial', max_members = 10, updated_at = ? WHERE id = ?`,
        [nowIso, order.org_id]
      );
      this.db.run(
        `UPDATE subscriptions SET status = 'canceled' WHERE org_id = ? AND plan_code = ? AND status = 'active'`,
        [order.org_id, order.plan_code]
      );
      this.db.run(
        `UPDATE storage_quotas
         SET plan_code = 'org_trial', default_quota_bytes = ?, updated_at = ?
         WHERE target_type = 'organization' AND target_id = ?`,
        [PLAN_DEFAULT_QUOTAS.org_trial.quota_bytes, nowIso, order.org_id]
      );
    } else {
      // Đơn hàng cá nhân -> hạ gói cá nhân về personal_free, giữ nguyên dữ liệu học tập
      this.db.run(`UPDATE users SET plan_code = 'personal_free', updated_at = ? WHERE id = ?`, [nowIso, order.user_id]);
      this.db.run(
        `UPDATE subscriptions SET status = 'canceled' WHERE user_id = ? AND org_id IS NULL AND plan_code = ? AND status = 'active'`,
        [order.user_id, order.plan_code]
      );
      this.db.run(
        `UPDATE storage_quotas
         SET plan_code = 'personal_free', default_quota_bytes = ?, updated_at = ?
         WHERE target_type = 'personal' AND target_id = ?`,
        [PLAN_DEFAULT_QUOTAS.personal_free.quota_bytes, nowIso, order.user_id]
      );
    }

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'payment_order_refunded', 'payment_orders', ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        adminUser.id,
        adminUser.role,
        order.id,
        JSON.stringify({
          order_code: order.order_code,
          refunded_target_type: isOrgPlan ? 'organization' : 'personal',
          refunded_target_id: isOrgPlan ? order.org_id : order.user_id,
          personal_plan_untouched: isOrgPlan,
          reason
        }),
        nowIso
      ]
    );

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

    return Object.assign({}, this.db.get(`SELECT * FROM payment_orders WHERE id = ?`, [order.id]), {
      refunded_target_type: isOrgPlan ? 'organization' : 'personal',
      refunded_target_id: isOrgPlan ? order.org_id : order.user_id
    });
  }

  listUserTransactions(user) {
    requireAuth(user);
    const orders = this.db.query(
      `SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC`,
      [user.id]
    );
    const invoices = this.db.query(
      `SELECT * FROM invoices WHERE user_id = ? ORDER BY issued_at DESC`,
      [user.id]
    );
    return { orders, invoices };
  }
}

module.exports = { PaymentModule };
