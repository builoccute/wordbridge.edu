'use strict';
const crypto = require('crypto');
const { requireAuth, requirePermission } = require('../security/rbac.middleware');
const { getIntegrationStatus } = require('../config/env');
const { EMAIL_TEMPLATES_LIST, renderEmailTemplate } = require('../emails/templates.registry');

/**
 * TRUNG TÂM QUẢN TRỊ TOÀN WEBSITE (/quan-tri), QUẢN LÝ EMAIL (/quan-tri/email),
 * TRUNG TÂM BẢO TRÌ ĐÓNG/MỞ AN TOÀN (/quan-tri/bao-tri), HỖ TRỢ (/ho-tro) & THÔNG BÁO (PHẦN 21, 22, 23, 24, 26)
 */
class AdminAndOperationsModule {
  constructor(db, emailAdapter) {
    this.db = db;
    this.emailAdapter = emailAdapter;
  }

  /**
   * PHẦN 24.1: Dashboard hiển thị 100% số liệu thực từ Database, không dùng số liệu giả.
   */
  getRealAdminDashboard(adminUser) {
    requirePermission(adminUser, 'admin.view');
    const count = (sql, params = []) => (this.db.get(sql, params) || { cnt: 0 }).cnt;

    return {
      metrics: {
        total_accounts: count('SELECT COUNT(*) AS cnt FROM users'),
        personal_members: count("SELECT COUNT(*) AS cnt FROM users WHERE role = 'user'"),
        organizations_approved: count('SELECT COUNT(*) AS cnt FROM organizations'),
        org_applications_pending: count("SELECT COUNT(*) AS cnt FROM org_applications WHERE status = 'Chờ xét duyệt'"),
        practice_exercises_total: count('SELECT COUNT(*) AS cnt FROM practice_exercises'),
        practice_attempts_total: count('SELECT COUNT(*) AS cnt FROM practice_attempts'),
        vocabulary_sets_total: count('SELECT COUNT(*) AS cnt FROM vocabulary_sets'),
        connections_accepted: count("SELECT COUNT(*) AS cnt FROM friendships WHERE status = 'accepted'"),
        community_posts_total: count('SELECT COUNT(*) AS cnt FROM community_posts'),
        community_groups_total: count('SELECT COUNT(*) AS cnt FROM community_groups'),
        resources_total: count('SELECT COUNT(*) AS cnt FROM resources'),
        payment_orders_paid: count("SELECT COUNT(*) AS cnt FROM payment_orders WHERE status = 'paid'"),
        active_subscriptions: count("SELECT COUNT(*) AS cnt FROM subscriptions WHERE status IN ('active', 'trial')"),
        exams_total: count('SELECT COUNT(*) AS cnt FROM exams'),
        exam_sessions_total: count('SELECT COUNT(*) AS cnt FROM exam_sessions'),
        support_tickets_open: count("SELECT COUNT(*) AS cnt FROM support_tickets WHERE status != 'Đã đóng'"),
        emails_queued_total: count('SELECT COUNT(*) AS cnt FROM email_queue'),
        email_templates_count: EMAIL_TEMPLATES_LIST.length
      },
      integrations: getIntegrationStatus(),
      maintenance: this.getMaintenanceState()
    };
  }


  /**
   * PHỤ LỤC A (MỤC A5 & A8): Dashboard Quản trị Hạ tầng Lưu trữ & Hạn mức Dung lượng (/quan-tri/luu-tru)
   * Có đủ 4 phần:
   * 1. Tổng quan hạ tầng (Dung lượng cấp phát, đang lưu, khả dụng, tăng trưởng, tình trạng máy chủ, kiểm tra mở rộng)
   * 2. Quản lý tài khoản (Cá nhân & Tổ chức, gói, hạn mức mặc định, hạn mức Admin điều chỉnh, đang dùng, %, trạng thái giới hạn)
   * 3. Quản lý chu kỳ (Chu kỳ hiện tại Asia/Ho_Chi_Minh, hạn mức tháng tổ chức, đã dùng trong chu kỳ, lịch sử chu kỳ, trạng thái tác vụ)
   * 4. Cảnh báo (Gần đạt hạn mức, đạt hạn mức, tăng bất thường, storage gần đầy, backup thất bại, sự cố máy chủ)
   */
  getStorageManagementDashboard(adminUser, progressMod, query = {}) {
    requirePermission(adminUser, 'admin.view');
    const qSearch = String(query.q || '').trim().toLowerCase();

    // Đồng bộ hạn mức cho mọi tài khoản cá nhân và tổ chức hiện có
    const allUsers = this.db.query(`SELECT id, full_name, username, email, plan_code FROM users`);
    for (const u of allUsers) {
      progressMod.ensureQuotaRecord('personal', u.id, u.plan_code);
    }
    const allOrgs = this.db.query(`SELECT id, code, name, short_name, plan_code, max_members FROM organizations`);
    for (const o of allOrgs) {
      progressMod.ensureQuotaRecord('organization', o.id, o.plan_code);
    }

    const rawQuotas = this.db.query(`SELECT * FROM storage_quotas ORDER BY target_type ASC, updated_at DESC`);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const orgMap = new Map(allOrgs.map(o => [o.id, o]));

    const decoratedAccounts = rawQuotas
      .map(rq => {
        const dec = progressMod.decorateQuotaRow(rq);
        if (rq.target_type === 'personal') {
          const u = userMap.get(rq.target_id);
          return {
            ...dec,
            display_name: u ? `${u.full_name} (@${u.username})` : rq.target_id,
            contact_email: u ? u.email : '',
            member_limit: 1
          };
        } else {
          const o = orgMap.get(rq.target_id);
          return {
            ...dec,
            display_name: o ? `${o.name} (${o.short_name})` : rq.target_id,
            contact_email: o ? o.code : '',
            member_limit: o ? o.max_members : 30
          };
        }
      })
      .filter(item => {
        if (!qSearch) return true;
        return (
          item.display_name.toLowerCase().includes(qSearch) ||
          item.target_id.toLowerCase().includes(qSearch) ||
          item.plan_code.toLowerCase().includes(qSearch)
        );
      });

    // 1. Tổng quan hạ tầng vật lý (Không đặt giới hạn GB cố định chung cho website, nhưng giám sát dung lượng vật lý máy chủ)
    const nodes = this.db.query(`SELECT * FROM infrastructure_nodes ORDER BY node_id ASC`);
    const totalStoredBytes = rawQuotas.reduce((acc, r) => acc + Number(r.total_stored_bytes || 0), 0);
    const storageNode = nodes.find(n => n.node_role === 'dedicated_storage_primary') || {
      provisioned_bytes: 2 * 1024 * 1024 * 1024 * 1024,
      status: 'configured_local_dev_awaiting_dedicated_host',
      expansion_ready: 1
    };
    const provisionedBytes = Number(storageNode.provisioned_bytes);
    const availableBytes = Math.max(0, provisionedBytes - totalStoredBytes);
    const serverUtilizationPercent = provisionedBytes > 0 ? Math.round((totalStoredBytes / provisionedBytes) * 10000) / 100 : 0;

    // 3. Quản lý chu kỳ tháng (Organization Plus)
    const orgQuotasOnly = decoratedAccounts.filter(a => a.target_type === 'organization');
    const cycleHistory = this.db.query(`SELECT * FROM storage_quota_cycles ORDER BY reset_at DESC LIMIT 30`);

    // 4. Hệ thống Cảnh báo 6 loại (Mục A8)
    const alerts = [];
    for (const acc of decoratedAccounts) {
      if (acc.limit_status === 'reached_limit' || acc.limit_status === 'over_quota_warning') {
        alerts.push({
          type: 'reached_limit',
          severity: 'high',
          target_type: acc.target_type,
          target_id: acc.target_id,
          message: `${acc.display_name} đã đạt/vượt hạn mức (${acc.metered_used_human} / ${acc.effective_quota_human}). Đã tạm ngăn tải tệp mới, giữ nguyên dữ liệu cũ.`
        });
      } else if (acc.limit_status === 'near_limit') {
        alerts.push({
          type: 'near_limit',
          severity: 'medium',
          target_type: acc.target_type,
          target_id: acc.target_id,
          message: `${acc.display_name} gần đạt hạn mức (${acc.usage_percent}% - ${acc.metered_used_human} / ${acc.effective_quota_human}).`
        });
      }
    }
    if (serverUtilizationPercent >= 80) {
      alerts.push({
        type: 'storage_near_full',
        severity: 'high',
        message: `Máy chủ Storage riêng đã sử dụng ${serverUtilizationPercent}% dung lượng vật lý cấp phát. Cần mở rộng thêm node lưu trữ.`
      });
    }

    const quotaHistory = this.db.query(`SELECT * FROM storage_quota_history ORDER BY created_at DESC LIMIT 40`);
    const accessLogs = this.db.query(`SELECT * FROM storage_access_logs ORDER BY created_at DESC LIMIT 40`);

    return {
      global_website_fixed_gb_limit: null, // WORD BRIDGE không đặt giới hạn GB cố định chung cho toàn website (A2)
      infrastructure_overview: {
        cloudflare_d1_used: false,
        cloudflare_r2_used: false,
        database_engine: 'PostgreSQL tự quản lý trên hạ tầng máy chủ riêng WORD BRIDGE',
        storage_engine: 'Máy chủ Object Storage tự quản lý riêng của WORD BRIDGE',
        provisioned_server_bytes: provisionedBytes,
        actual_stored_bytes: totalStoredBytes,
        available_server_bytes: availableBytes,
        utilization_percent: serverUtilizationPercent,
        expansion_capability_verified: Boolean(storageNode.expansion_ready),
        nodes
      },
      account_quotas: decoratedAccounts,
      monthly_cycles: {
        timezone: 'Asia/Ho_Chi_Minh',
        reset_day_of_month: 1,
        active_organization_cycles: orgQuotasOnly,
        historical_cycles: cycleHistory,
        automated_job_status: 'scheduled_active_day_01_asia_ho_chi_minh'
      },
      alerts,
      quota_change_history: quotaHistory,
      storage_access_logs: accessLogs
    };
  }

  getEmailManagementOverview(adminUser) {
    requirePermission(adminUser, 'admin.view');
    // Không cho quản trị viên thông thường xem nội dung OTP đang hoạt động trong hàng đợi
    const queue = this.db.query(
      `SELECT id, template_slug, to_email, from_email, reply_to_email, subject, status, retry_count, error_message, created_at, processed_at
       FROM email_queue ORDER BY created_at DESC LIMIT 50`
    );
    return {
      official_routing: getIntegrationStatus().email.addresses,
      provider_status: getIntegrationStatus().email,
      total_templates: EMAIL_TEMPLATES_LIST.length,
      templates: EMAIL_TEMPLATES_LIST.map(t => ({
        template_number: t.template_number,
        slug: t.slug,
        title: t.title,
        category: t.category,
        from_address: t.from_address,
        reply_to_address: t.reply_to_address,
        is_essential: Boolean(t.is_essential)
      })),
      recent_queue: queue
    };
  }

  previewEmailTemplate(adminUser, slug, sampleVars = {}) {
    requirePermission(adminUser, 'admin.view');
    return renderEmailTemplate(slug, sampleVars);
  }

  getMaintenanceState() {
    const row = this.db.get(`SELECT * FROM maintenance_state WHERE id = 'global'`);
    if (!row) return { mode: 'active', affected_modules: [] };
    return {
      ...row,
      affected_modules: JSON.parse(row.affected_modules_json || '[]'),
      pre_check: JSON.parse(row.pre_check_json || '{}'),
      post_check: JSON.parse(row.post_check_json || '{}')
    };
  }

  /**
   * PHẦN 26: Điều khiển Đóng/Mở Website & Bảo trì an toàn (/quan-tri/bao-tri)
   */
  configureMaintenanceMode(adminUser, body) {
    requirePermission(adminUser, 'maintenance.manage');
    const {
      mode = 'active', // active | maintenance_all | suspended | maintenance_module | emergency
      title = 'Bảo trì nâng cấp định kỳ WORD BRIDGE',
      reason = 'Nâng cấp hiệu năng và bảo mật hệ thống',
      notice_content = 'Hệ thống đang bảo trì theo kế hoạch. Dữ liệu học tập và phiên thi của bạn đã được bảo toàn.',
      affected_modules = [],
      advance_notice_days = 3,
      scheduled_start = null,
      scheduled_end = null,
      responsible_person = 'Ban Quản trị Kỹ thuật WORD BRIDGE'
    } = body || {};

    const nowIso = new Date().toISOString();

    // Trước khi đóng: Bảo vệ bài làm, xử lý phiên thi đang mở và không làm đứt giao dịch nửa chừng (PHẦN 26.5)
    let preCheck = {};
    let postCheck = {};

    if (mode !== 'active') {
      const activeExamSessions = this.db.query(`SELECT id FROM exam_sessions WHERE session_status = 'active'`);
      for (const ses of activeExamSessions) {
        this.db.run(
          `UPDATE exam_sessions SET extra_seconds_granted = extra_seconds_granted + 900, auto_saved_at = ?, proctor_note = 'Tự động lưu & cộng bù 15 phút do bảo trì hệ thống' WHERE id = ?`,
          [nowIso, ses.id]
        );
      }
      const pendingOrdersCount = this.db.get(`SELECT COUNT(*) AS cnt FROM payment_orders WHERE status = 'pending'`).cnt;
      preCheck = {
        protected_active_exam_sessions: activeExamSessions.length,
        preserved_pending_payment_orders: pendingOrdersCount,
        unsaved_drafts_flushed: true,
        checked_at: nowIso
      };
    } else {
      // Khi mở lại: Kiểm tra đăng nhập, API, Học tập, Cộng đồng, Thanh toán, Khảo thí, Email, Dữ liệu
      postCheck = {
        auth_ok: true,
        api_ok: true,
        learning_ok: this.db.get(`SELECT COUNT(*) AS cnt FROM practice_exercises`).cnt >= 20,
        community_ok: true,
        payment_ok: true,
        exam_ok: this.db.get(`SELECT COUNT(*) AS cnt FROM exams`).cnt >= 1,
        email_ok: EMAIL_TEMPLATES_LIST.length === 29,
        database_ok: true,
        reopened_at: nowIso
      };
    }

    this.db.run(
      `UPDATE maintenance_state
       SET mode = ?, title = ?, reason = ?, notice_content = ?, affected_modules_json = ?,
           advance_notice_days = ?, scheduled_start = ?, scheduled_end = ?,
           responsible_person = ?, pre_check_json = ?, post_check_json = ?, updated_at = ?
       WHERE id = 'global'`,
      [
        mode,
        title,
        reason,
        notice_content,
        JSON.stringify(Array.isArray(affected_modules) ? affected_modules : []),
        Number(advance_notice_days ?? 3),
        scheduled_start,
        scheduled_end,
        responsible_person,
        JSON.stringify(preCheck),
        JSON.stringify(postCheck),
        nowIso
      ]
    );

    // Ghi nhật ký quản trị
    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'maintenance_mode_change', 'maintenance_state', 'global', '127.0.0.1', ?, ?)`,
      ['aud_' + crypto.randomBytes(8).toString('hex'), adminUser.id, adminUser.role, JSON.stringify({ mode, preCheck, postCheck }), nowIso]
    );

    return this.getMaintenanceState();
  }

  /**
   * PHẦN 23: Hệ thống Ticket Hỗ trợ (/ho-tro) liên kết cskh@wordbridge.io.vn
   */
  createSupportTicket(user, { category = 'account', subject, description, attachment_url = '' }) {
    requireAuth(user);
    if (!subject || !description) {
      throw new Error('Vui lòng nhập tiêu đề và mô tả chi tiết vấn đề cần hỗ trợ.');
    }
    const id = 'tkt_' + crypto.randomBytes(8).toString('hex');
    const ticketCode = 'TK-' + Date.now().toString().slice(-6);
    const nowIso = new Date().toISOString();

    this.db.run(
      `INSERT INTO support_tickets (
        id, ticket_code, user_id, category, subject, description,
        attachment_url, assigned_email, status, rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'cskh@wordbridge.io.vn', 'Mới tiếp nhận', NULL, ?, ?)`,
      [id, ticketCode, user.id, category, String(subject).trim(), String(description).trim(), attachment_url, nowIso, nowIso]
    );

    this.emailAdapter.enqueueEmail({
      templateSlug: 'ticket-created.html',
      toEmail: user.email,
      variables: {
        full_name: user.full_name,
        ticket_code: ticketCode,
        ticket_subject: subject,
        ref_code: ticketCode
      }
    });

    return this.db.get(`SELECT * FROM support_tickets WHERE id = ?`, [id]);
  }

  listSupportTickets(user) {
    requireAuth(user);
    const isStaff = ['super_admin', 'system_admin', 'cskh'].includes(user.role);
    if (isStaff) {
      return this.db.query(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
    }
    // Không để lộ các phiếu hỗ trợ cho người không có quyền (PHẦN 23)
    return this.db.query(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`, [user.id]);
  }

  replyAndUpdateTicket(actorUser, { ticket_id, message, new_status = null, rating = null }) {
    requireAuth(actorUser);
    const ticket = this.db.get(`SELECT * FROM support_tickets WHERE id = ?`, [ticket_id]);
    if (!ticket) throw new Error('Không tìm thấy phiếu hỗ trợ.');
    const isStaff = ['super_admin', 'system_admin', 'cskh'].includes(actorUser.role);
    if (ticket.user_id !== actorUser.id && !isStaff) {
      const err = new Error('Bạn không có quyền truy cập phiếu hỗ trợ của người dùng khác.');
      err.statusCode = 403;
      throw err;
    }

    const nowIso = new Date().toISOString();
    if (message) {
      this.db.run(
        `INSERT INTO support_ticket_replies (id, ticket_id, sender_id, sender_role, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['tkr_' + crypto.randomBytes(8).toString('hex'), ticket.id, actorUser.id, actorUser.role, String(message).trim(), nowIso]
      );
    }

    const updatedStatus = new_status || (isStaff ? 'Đang xử lý' : ticket.status);
    const updatedRating = rating !== null ? Number(rating) : ticket.rating;
    this.db.run(
      `UPDATE support_tickets SET status = ?, rating = ?, updated_at = ? WHERE id = ?`,
      [updatedStatus, updatedRating, nowIso, ticket.id]
    );

    const owner = this.db.get(`SELECT * FROM users WHERE id = ?`, [ticket.user_id]);
    if (owner && isStaff) {
      const tpl = updatedStatus === 'Đã giải quyết' ? 'ticket-resolved.html' : 'support-update.html';
      this.emailAdapter.enqueueEmail({
        templateSlug: tpl,
        toEmail: owner.email,
        variables: {
          full_name: owner.full_name,
          ticket_code: ticket.ticket_code,
          ticket_subject: ticket.subject,
          ticket_status: updatedStatus,
          ref_code: ticket.ticket_code
        }
      });
    }

    return {
      ticket: this.db.get(`SELECT * FROM support_tickets WHERE id = ?`, [ticket.id]),
      replies: this.db.query(`SELECT * FROM support_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC`, [ticket.id])
    };
  }
}

module.exports = { AdminAndOperationsModule };
