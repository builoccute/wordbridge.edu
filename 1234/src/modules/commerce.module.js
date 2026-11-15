'use strict';
const crypto = require('crypto');
const { SERVICE_PLANS, ADDON_GROUPS } = require('../config/constants');
const { requireAuth, requirePermission } = require('../security/rbac.middleware');

/**
 * DỊCH VỤ, GÓI THÀNH VIÊN, 4 CHƯƠNG TRÌNH HỖ TRỢ, KHUYẾN MÃI & LOYALTY (PHẦN 16 & 18)
 */
class CommerceModule {
  constructor(db, emailAdapter) {
    this.db = db;
    this.emailAdapter = emailAdapter;
  }

  getPricingCatalog() {
    const dbPlans = this.db.query(`SELECT * FROM service_plans WHERE is_active = 1`);
    return {
      plans: dbPlans.length > 0 ? dbPlans.map(p => ({ ...p, features: JSON.parse(p.features_json || '[]') })) : SERVICE_PLANS,
      addons: ADDON_GROUPS,
      organization_scale_tiers: [
        { tier: 'Cơ bản (Trong gói Organization Plus)', max_members: 30, pricing_note: 'Đã bao gồm trong gói tháng/năm' },
        { tier: 'Mở rộng 60', max_members: 60, pricing_note: 'Theo thỏa thuận mở rộng hạ tầng' },
        { tier: 'Mở rộng 100', max_members: 100, pricing_note: 'Theo thỏa thuận mở rộng hạ tầng' },
        { tier: 'Trên 100 thành viên', max_members: 500, pricing_note: 'Theo báo giá riêng, không tự thu phí lẻ từng người' }
      ],
      support_programs: [
        {
          code: 'nonprofit_30',
          name: 'Ưu đãi Tổ chức Phi lợi nhuận (Giảm 30%)',
          discount_percent: 30,
          monthly_price_vnd: 245000,
          yearly_price_vnd: 2450000,
          condition: 'Có hồ sơ pháp lý hợp lệ, không tự động cộng dồn ưu đãi khác.'
        },
        {
          code: 'community_access',
          name: 'Hỗ Trợ Cộng Đồng (Community Access)',
          duration_months: 3,
          price_vnd: 0,
          condition: 'Dành cho CLB và nhóm cộng đồng chưa có pháp nhân; xét duyệt từng kỳ 03 tháng và đánh giá trước khi gia hạn.'
        },
        {
          code: 'student_plus',
          name: 'Chương trình Sinh viên (Personal Plus miễn phí 03 tháng)',
          duration_months: 3,
          price_vnd: 0,
          condition: 'Cấp 01 lần duy nhất; xác minh duy nhất qua email sinh viên do trường cấp (.edu.vn / .ac.vn); không thay bằng thẻ sinh viên.'
        },
        {
          code: 'hardship_support',
          name: 'Hỗ trợ Hoàn cảnh khó khăn (Miễn phí 12 tháng)',
          duration_months: 12,
          price_vnd: 0,
          annual_budget_cap_vnd: 5000000,
          condition: 'Bảo mật tuyệt đối hồ sơ; tổng ngân sách tham chiếu tối đa 5.000.000 đồng/năm; không hạch toán thành doanh thu tiền mặt.'
        }
      ]
    };
  }

  applyForSupportProgram(user, body) {
    requireAuth(user);
    const { program_type, student_edu_email = '', org_id = null, reason = '', reject_student_card_upload = false } = body || {};
    if (!['nonprofit_30', 'community_access', 'student_plus', 'hardship_support'].includes(program_type)) {
      throw new Error('Chương trình hỗ trợ không hợp lệ.');
    }

    const nowIso = new Date().toISOString();

    if (program_type === 'student_plus') {
      if (reject_student_card_upload || body.student_card_image) {
        throw new Error('Chương trình Sinh viên chỉ xác minh duy nhất qua email sinh viên do trường cấp, tuyệt đối không thay thế bằng ảnh thẻ sinh viên.');
      }
      const eduMail = String(student_edu_email || '').trim().toLowerCase();
      if (!/\.(edu\.vn|edu|ac\.vn)$/i.test(eduMail)) {
        throw new Error('Email xác minh sinh viên phải là email học thuật do nhà trường cấp (ví dụ: @...edu.vn).');
      }
      const alreadyGranted = this.db.get(
        `SELECT id FROM support_program_applications WHERE user_id = ? AND program_type = 'student_plus' AND status IN ('approved', 'pending')`,
        [user.id]
      );
      if (alreadyGranted) {
        throw new Error('Ưu đãi Personal Plus miễn phí 03 tháng dành cho Sinh viên chỉ được cấp một lần duy nhất cho mỗi tài khoản.');
      }
    }

    // Kiểm tra trần ngân sách 5.000.000 đồng/năm cho 2 chương trình hỗ trợ cá nhân (Sinh viên & Hoàn cảnh khó khăn)
    let estimatedCost = 0;
    if (program_type === 'student_plus') estimatedCost = 129000 * 3;
    if (program_type === 'hardship_support') estimatedCost = 1000000;

    if (estimatedCost > 0) {
      const budgetRow = this.db.get(
        `SELECT COALESCE(SUM(budget_allocated_vnd), 0) AS used_budget
         FROM support_program_applications
         WHERE program_type IN ('student_plus', 'hardship_support') AND status = 'approved'`
      );
      const currentUsed = budgetRow ? budgetRow.used_budget : 0;
      if (currentUsed + estimatedCost > 5000000) {
        throw new Error('Tổng ngân sách hỗ trợ cá nhân trong năm (5.000.000 đồng/năm) đã chạm trần hạn mức.');
      }
    }

    const id = 'spa_' + crypto.randomBytes(8).toString('hex');
    const months = program_type === 'hardship_support' ? 12 : 3;
    // Tự động kích hoạt nếu là Sinh viên đã xác thực đúng đuôi email trường cấp
    const initialStatus = program_type === 'student_plus' ? 'approved' : 'pending';

    this.db.run(
      `INSERT INTO support_program_applications (
        id, user_id, org_id, program_type, student_edu_email, supporting_info_json,
        status, granted_months, budget_allocated_vnd, reviewed_by, review_note, created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user.id,
        org_id,
        program_type,
        student_edu_email,
        JSON.stringify({ reason, confidential: program_type === 'hardship_support', cash_revenue_counted: 0 }),
        initialStatus,
        months,
        initialStatus === 'approved' ? estimatedCost : 0,
        initialStatus === 'approved' ? 'system_edu_verifier' : null,
        initialStatus === 'approved' ? 'Đã xác minh email sinh viên trường cấp (01 lần duy nhất).' : 'Đang chờ xét duyệt hồ sơ.',
        nowIso,
        initialStatus === 'approved' ? nowIso : null
      ]
    );

    if (initialStatus === 'approved') {
      const exp = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
      this.db.run(`UPDATE users SET plan_code = 'personal_plus_monthly' WHERE id = ?`, [user.id]);
      this.db.run(
        `INSERT INTO subscriptions (id, user_id, org_id, plan_code, status, auto_renew, started_at, expires_at, history_json, created_at)
         VALUES (?, ?, NULL, 'personal_plus_monthly', 'active', 0, ?, ?, ?, ?)`,
        [
          'sub_' + crypto.randomBytes(8).toString('hex'),
          user.id,
          nowIso,
          exp,
          JSON.stringify([{ action: 'student_plus_3_months_free', cash_revenue: 0, at: nowIso }]),
          nowIso
        ]
      );
    }

    return this.db.get(`SELECT * FROM support_program_applications WHERE id = ?`, [id]);
  }

  manageSubscriptionLifecycle(user, { subscription_id, action, target_plan_code = null, consent_auto_renew = false }) {
    requireAuth(user);
    const sub = this.db.get(`SELECT * FROM subscriptions WHERE id = ? AND user_id = ?`, [subscription_id, user.id]);
    if (!sub) throw new Error('Không tìm thấy thuê bao dịch vụ.');

    const history = JSON.parse(sub.history_json || '[]');
    const nowIso = new Date().toISOString();

    if (action === 'cancel' || action === 'expire_to_free') {
      // Hết hạn hoặc hạ gói tự chuyển về Free và giữ nguyên 100% lịch sử học tập (PHẦN 16.3 & 16.6)
      history.push({ action, preserved_learning_history: true, at: nowIso });
      this.db.run(
        `UPDATE subscriptions SET status = ?, auto_renew = 0, history_json = ? WHERE id = ?`,
        [action === 'cancel' ? 'canceled' : 'expired', JSON.stringify(history), sub.id]
      );
      this.db.run(`UPDATE users SET plan_code = 'personal_free', updated_at = ? WHERE id = ?`, [nowIso, user.id]);
      this.emailAdapter.enqueueEmail({
        templateSlug: 'subscription-expired.html',
        toEmail: user.email,
        variables: { full_name: user.full_name, plan_name: sub.plan_code, ref_code: sub.id.toUpperCase() }
      });
    } else if (action === 'toggle_auto_renew') {
      // Không gia hạn tự động nếu khách hàng chưa đồng ý rõ ràng
      const renewVal = consent_auto_renew ? 1 : 0;
      history.push({ action: 'set_auto_renew', value: Boolean(renewVal), at: nowIso });
      this.db.run(`UPDATE subscriptions SET auto_renew = ?, history_json = ? WHERE id = ?`, [
        renewVal,
        JSON.stringify(history),
        sub.id
      ]);
    } else if (action === 'downgrade' && target_plan_code) {
      history.push({ action: 'downgrade', from: sub.plan_code, to: target_plan_code, preserved_history: true, at: nowIso });
      this.db.run(`UPDATE subscriptions SET plan_code = ?, history_json = ? WHERE id = ?`, [
        target_plan_code,
        JSON.stringify(history),
        sub.id
      ]);
      this.db.run(`UPDATE users SET plan_code = ? WHERE id = ?`, [target_plan_code, user.id]);
    }

    return this.db.get(`SELECT * FROM subscriptions WHERE id = ?`, [sub.id]);
  }

  applyReferralCode(user, { referral_code }) {
    requireAuth(user);
    const cleanCode = String(referral_code || '').trim().toUpperCase();
    const myLoyalty = this.db.get(`SELECT * FROM loyalty_accounts WHERE user_id = ?`, [user.id]);
    if (!myLoyalty) throw new Error('Chưa khởi tạo tài khoản thành viên thân thiết.');
    if (myLoyalty.referral_code === cleanCode) {
      throw new Error('Không được tự sử dụng mã giới thiệu của chính mình (Chống gian lận tự giới thiệu).');
    }
    if (myLoyalty.referred_by_code) {
      throw new Error('Tài khoản của bạn đã áp dụng mã giới thiệu trước đó.');
    }
    const referrer = this.db.get(`SELECT * FROM loyalty_accounts WHERE referral_code = ?`, [cleanCode]);
    if (!referrer) {
      throw new Error('Mã giới thiệu không tồn tại.');
    }
    const nowIso = new Date().toISOString();
    this.db.run(`UPDATE loyalty_accounts SET referred_by_code = ?, points_balance = points_balance + 100, lifetime_points = lifetime_points + 100, updated_at = ? WHERE user_id = ?`, [
      cleanCode,
      nowIso,
      user.id
    ]);
    this.db.run(`UPDATE loyalty_accounts SET points_balance = points_balance + 150, lifetime_points = lifetime_points + 150, updated_at = ? WHERE user_id = ?`, [
      nowIso,
      referrer.user_id
    ]);
    return this.db.get(`SELECT * FROM loyalty_accounts WHERE user_id = ?`, [user.id]);
  }
}

module.exports = { CommerceModule };
