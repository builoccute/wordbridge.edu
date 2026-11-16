import { crypto } from '../config/runtime.js';
import { GB_BYTES, TB_BYTES, PLAN_DEFAULT_QUOTAS } from '../config/constants.js';
import { getMonthlyQuotaGb, setMonthlyQuotaGb } from '../config/env.js';
import { requireAuth, requirePermission, requireOrgAccess } from '../security/rbac.middleware.js';

/**
 * DASHBOARD CÁ NHÂN & GROW (PHẦN VIII), THƯ VIỆN TÀI NGUYÊN (PHẦN III.2)
 * & QUẢN LÝ HẠN MỨC DUNG LƯỢNG CLOUDFLARE D1/R2 (PHẦN XV.2, XVI & XXI.5, 6)
 * Quy tắc bắt buộc:
 * - Hạn mức mặc định của từng gói (Personal Free 1GB, Personal Plus 5GB, Org Trial 50GB/tháng, Org Plus Tháng 50GB/tháng, Org Plus Năm 120GB/tháng) được bảo vệ tuyệt đối.
 * - Biến môi trường MONTHLY_QUOTA_GB KHÔNG ĐƯỢC PHÉP ghi đè hạn mức riêng của từng gói dịch vụ!
 * - Dashboard GROW chỉ hiển thị thành tích từ dữ liệu thật, không tạo điểm số giả hay lượt hoạt động giả.
 */

function getCurrentHoChiMinhCycleMonth(dateObj = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = fmt.format(dateObj).split('-'); // YYYY-MM-DD
  return {
    cycle_month: `${parts[0]}-${parts[1]}`,
    day_of_month: Number(parts[2]),
    timezone: 'Asia/Ho_Chi_Minh'
  };
}

function formatBytesHuman(bytes) {
  if (bytes === null || bytes === undefined) return 'Không giới hạn';
  const n = Number(bytes);
  if (n >= TB_BYTES) return `${(n / TB_BYTES).toFixed(2).replace(/\.00$/, '')} TB`;
  if (n >= GB_BYTES) return `${(n / GB_BYTES).toFixed(2).replace(/\.00$/, '')} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${n} B`;
}

class ProgressAndResourcesModule {
  constructor(db, storageAdapter) {
    this.db = db;
    this.storageAdapter = storageAdapter;
  }

  /**
   * PHẦN XV.2 & XXI.5, 6: Bảo vệ tuyệt đối hạn mức mặc định theo từng gói.
   * Tuyệt đối KHÔNG dùng getMonthlyQuotaGb() để ghi đè hạn mức của các gói dịch vụ!
   */
  getDefaultQuotaForPlan(planCode, targetType = 'personal') {
    const spec = PLAN_DEFAULT_QUOTAS[planCode];
    if (spec) {
      return {
        default_quota_bytes: spec.quota_bytes,
        is_monthly_cycle: spec.is_monthly_cycle ? 1 : 0
      };
    }
    if (targetType === 'organization') {
      return {
        default_quota_bytes: 50 * GB_BYTES,
        is_monthly_cycle: 1
      };
    }
    return {
      default_quota_bytes: 1 * GB_BYTES,
      is_monthly_cycle: 0
    };
  }

  ensureQuotaRecord(targetType, targetId, planCode = null) {
    let row = this.db.get(
      `SELECT * FROM storage_quotas WHERE target_type = ? AND target_id = ?`,
      [targetType, targetId]
    );
    const hcm = getCurrentHoChiMinhCycleMonth();
    const nowIso = new Date().toISOString();

    if (!planCode) {
      if (targetType === 'personal') {
        const u = this.db.get(`SELECT plan_code FROM users WHERE id = ?`, [targetId]);
        planCode = u ? u.plan_code : 'personal_free';
      } else {
        const o = this.db.get(`SELECT plan_code FROM organizations WHERE id = ?`, [targetId]);
        planCode = o ? o.plan_code : 'org_plus_monthly';
      }
    }

    const def = this.getDefaultQuotaForPlan(planCode, targetType);

    if (!row) {
      const qId = 'sq_' + crypto.randomBytes(8).toString('hex');
      this.db.run(
        `INSERT INTO storage_quotas (
          id, target_type, target_id, plan_code, default_quota_bytes,
          admin_custom_quota_bytes, is_unlimited, total_stored_bytes,
          cycle_month, cycle_used_bytes, is_monthly_cycle,
          quota_reached_at, over_quota_blocked, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 0, 0, ?, 0, ?, NULL, 0, ?)`,
        [qId, targetType, targetId, planCode, def.default_quota_bytes, hcm.cycle_month, def.is_monthly_cycle, nowIso]
      );
      row = this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [qId]);
    } else if (row.plan_code !== planCode || row.default_quota_bytes !== def.default_quota_bytes) {
      this.db.run(
        `UPDATE storage_quotas
         SET plan_code = ?, default_quota_bytes = ?, is_monthly_cycle = ?, updated_at = ?
         WHERE id = ?`,
        [planCode, def.default_quota_bytes, def.is_monthly_cycle, nowIso, row.id]
      );
      row = this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [row.id]);
      this.recalculateBlockState(row.id);
      row = this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [row.id]);
    }
    return this.decorateQuotaRow(row);
  }

  decorateQuotaRow(row) {
    if (!row) return null;
    const isUnlimited = Boolean(row.is_unlimited);
    const hasCustom = row.admin_custom_quota_bytes !== null && row.admin_custom_quota_bytes !== undefined;
    const effectiveQuotaBytes = isUnlimited
      ? null
      : (hasCustom ? Number(row.admin_custom_quota_bytes) : Number(row.default_quota_bytes));
    const prioritySource = isUnlimited
      ? 'admin_unlimited'
      : (hasCustom ? 'admin_custom' : 'plan_default');
    const priorityLabelVi = isUnlimited
      ? 'Không giới hạn do Quản trị viên cấp'
      : (hasCustom ? 'Hạn mức riêng do Quản trị viên cấp' : 'Hạn mức mặc định của gói');

    const meteredUsedBytes = row.is_monthly_cycle ? Number(row.cycle_used_bytes) : Number(row.total_stored_bytes);
    const usagePercent = isUnlimited || !effectiveQuotaBytes
      ? 0
      : Math.round((meteredUsedBytes / effectiveQuotaBytes) * 10000) / 100;

    let limitStatus = 'normal';
    if (!isUnlimited && effectiveQuotaBytes !== null) {
      if (meteredUsedBytes > effectiveQuotaBytes) limitStatus = 'over_quota_warning';
      else if (meteredUsedBytes === effectiveQuotaBytes) limitStatus = 'reached_limit';
      else if (usagePercent >= 80) limitStatus = 'near_limit';
    }

    return {
      ...row,
      is_unlimited: isUnlimited,
      is_monthly_cycle: Boolean(row.is_monthly_cycle),
      over_quota_blocked: Boolean(row.over_quota_blocked),
      effective_quota_bytes: effectiveQuotaBytes,
      effective_quota_human: formatBytesHuman(effectiveQuotaBytes),
      default_quota_human: formatBytesHuman(row.default_quota_bytes),
      admin_custom_quota_human: hasCustom ? formatBytesHuman(row.admin_custom_quota_bytes) : null,
      metered_used_bytes: meteredUsedBytes,
      metered_used_human: formatBytesHuman(meteredUsedBytes),
      total_stored_human: formatBytesHuman(row.total_stored_bytes),
      cycle_used_human: formatBytesHuman(row.cycle_used_bytes),
      usage_percent: usagePercent,
      priority_source: prioritySource,
      priority_label_vi: priorityLabelVi,
      limit_status: limitStatus
    };
  }

  recalculateBlockState(quotaId) {
    const raw = this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [quotaId]);
    if (!raw) return null;
    const dec = this.decorateQuotaRow(raw);
    const nowIso = new Date().toISOString();
    const isBlocked = !dec.is_unlimited && dec.effective_quota_bytes !== null && dec.metered_used_bytes >= dec.effective_quota_bytes;
    const reachedAt = isBlocked ? (raw.quota_reached_at || nowIso) : null;
    this.db.run(
      `UPDATE storage_quotas SET over_quota_blocked = ?, quota_reached_at = ?, updated_at = ? WHERE id = ?`,
      [isBlocked ? 1 : 0, reachedAt, nowIso, raw.id]
    );
    return this.decorateQuotaRow(this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [raw.id]));
  }

  checkAndConsumeQuota({ actorUser, targetType = 'personal', targetId, incomingBytes }) {
    const q = this.ensureQuotaRecord(targetType, targetId);
    const size = Number(incomingBytes || 0);
    const nowIso = new Date().toISOString();

    if (!q.is_unlimited && q.effective_quota_bytes !== null) {
      if (q.metered_used_bytes + size > q.effective_quota_bytes) {
        this.db.run(
          `UPDATE storage_quotas SET over_quota_blocked = 1, quota_reached_at = COALESCE(quota_reached_at, ?), updated_at = ? WHERE id = ?`,
          [nowIso, nowIso, q.id]
        );
        this.db.run(
          `INSERT INTO storage_access_logs (id, file_id, actor_user_id, owner_type, owner_id, action, size_bytes, status, detail, created_at)
           VALUES (?, NULL, ?, ?, ?, 'blocked_over_quota', ?, 'blocked', ?, ?)`,
          [
            'sal_' + crypto.randomBytes(8).toString('hex'),
            actorUser ? actorUser.id : 'system',
            targetType,
            targetId,
            size,
            `Đạt giới hạn dung lượng (${q.metered_used_human} / ${q.effective_quota_human}). Ngăn tải lên mới nhưng giữ nguyên dữ liệu cũ và quyền đọc/tải xuống.`,
            nowIso
          ]
        );
        const err = new Error(
          `Tài khoản/Tổ chức đã đạt hoặc vượt hạn mức dung lượng lưu trữ (${q.metered_used_human} / ${q.effective_quota_human}). ` +
          `Hệ thống tạm ngăn tải lên tệp mới vượt hạn mức; toàn bộ dữ liệu cũ và quyền đọc/tải xuống vẫn được giữ nguyên.`
        );
        err.statusCode = 403;
        throw err;
      }
    }

    const newTotal = Number(q.total_stored_bytes) + size;
    const newCycle = Number(q.cycle_used_bytes) + size;
    const newMetered = q.is_monthly_cycle ? newCycle : newTotal;
    const hitExactLimit = !q.is_unlimited && q.effective_quota_bytes !== null && newMetered >= q.effective_quota_bytes;

    this.db.run(
      `UPDATE storage_quotas
       SET total_stored_bytes = ?, cycle_used_bytes = ?,
           over_quota_blocked = ?, quota_reached_at = ?, updated_at = ?
       WHERE id = ?`,
      [
        newTotal,
        newCycle,
        hitExactLimit ? 1 : 0,
        hitExactLimit ? (q.quota_reached_at || nowIso) : q.quota_reached_at,
        nowIso,
        q.id
      ]
    );

    this.db.run(
      `UPDATE infrastructure_nodes SET used_bytes = used_bytes + ?, last_health_check_at = ? WHERE node_id = 'wb-storage-node-01'`,
      [size, nowIso]
    );

    return this.decorateQuotaRow(this.db.get(`SELECT * FROM storage_quotas WHERE id = ?`, [q.id]));
  }

  /**
   * PHẦN XV.2 & XXI.5, 6:
   * Cập nhật thông số tham chiếu hạ tầng MONTHLY_QUOTA_GB tại máy chủ,
   * NHƯNG TUYỆT ĐỐI KHÔNG ghi đè hạn mức mặc định của bất kỳ gói dịch vụ nào (gói năm 120GB, gói tháng 50GB, gói dùng thử 50GB, gói cá nhân 1GB/5GB)!
   */
  configureServerMonthlyQuotaGb(adminUser, { monthly_quota_gb, reason = 'Cập nhật thông số tham chiếu dung lượng hạ tầng' }) {
    requirePermission(adminUser, 'storage.manage');
    const updatedGb = setMonthlyQuotaGb(monthly_quota_gb);
    const updatedBytes = updatedGb * GB_BYTES;
    const nowIso = new Date().toISOString();

    // Đảm bảo mọi bản ghi storage_quotas đều giữ nguyên đúng hạn mức chuẩn của gói (1GB, 5GB, 50GB, 120GB)
    for (const [planCode, spec] of Object.entries(PLAN_DEFAULT_QUOTAS)) {
      this.db.run(
        `UPDATE storage_quotas SET default_quota_bytes = ?, updated_at = ? WHERE plan_code = ?`,
        [spec.quota_bytes, nowIso, planCode]
      );
    }

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'update_server_reference_quota_gb', 'system_config', 'MONTHLY_QUOTA_GB', '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        adminUser.id,
        adminUser.role,
        JSON.stringify({
          monthly_quota_gb: updatedGb,
          override_plan_quotas: false,
          protected_plans: Object.keys(PLAN_DEFAULT_QUOTAS),
          reason
        }),
        nowIso
      ]
    );

    return {
      monthly_quota_gb: updatedGb,
      monthly_quota_bytes: updatedBytes,
      monthly_quota_human: formatBytesHuman(updatedBytes),
      override_plan_quotas: false,
      policy_note: 'Thông số tham chiếu hạ tầng đã được cập nhật. Hạn mức của từng gói dịch vụ (Miễn phí 1 GB, Cá nhân Plus 5 GB, Tổ chức Dùng thử 50 GB, Tổ chức Tháng 50 GB, Tổ chức Năm 120 GB) được bảo vệ nguyên vẹn, không bị ghi đè.',
      updated_at: nowIso
    };
  }

  adminAdjustQuota(adminUser, body) {
    requirePermission(adminUser, 'storage.manage');
    const {
      target_type = 'personal',
      target_id,
      action,
      amount = 0,
      unit = 'GB',
      reason = 'Điều chỉnh hạn mức riêng cho tài khoản/tổ chức'
    } = body || {};

    if (!['personal', 'organization'].includes(target_type) || !target_id) {
      throw new Error('Vui lòng chọn đúng Tài khoản cá nhân hoặc Tổ chức cần điều chỉnh hạn mức.');
    }

    const current = this.ensureQuotaRecord(target_type, target_id);
    const unitNorm = String(unit || 'GB').toUpperCase();
    const multiplier = unitNorm === 'TB' ? TB_BYTES : (unitNorm === 'BYTES' ? 1 : GB_BYTES);
    const deltaOrTargetBytes = Math.round(Number(amount || 0) * multiplier);

    let newCustomBytes = current.admin_custom_quota_bytes;
    let newUnlimited = current.is_unlimited ? 1 : 0;

    if (action === 'set_unlimited') {
      newUnlimited = 1;
    } else if (action === 'remove_custom') {
      newCustomBytes = null;
      newUnlimited = 0;
    } else if (action === 'set_custom') {
      if (deltaOrTargetBytes <= 0) throw new Error('Mức dung lượng riêng phải lớn hơn 0.');
      newCustomBytes = deltaOrTargetBytes;
      newUnlimited = 0;
    } else if (action === 'increase') {
      const base = current.effective_quota_bytes || current.default_quota_bytes;
      newCustomBytes = base + deltaOrTargetBytes;
      newUnlimited = 0;
    } else if (action === 'decrease') {
      const base = current.effective_quota_bytes || current.default_quota_bytes;
      newCustomBytes = Math.max(1, base - deltaOrTargetBytes);
      newUnlimited = 0;
    } else {
      throw new Error(`Thao tác điều chỉnh hạn mức '${action}' không hợp lệ.`);
    }

    const nowIso = new Date().toISOString();
    // Bảo vệ default_quota_bytes theo đúng gói đang hoạt động của tài khoản/tổ chức
    const planDef = this.getDefaultQuotaForPlan(current.plan_code, target_type);
    this.db.run(
      `UPDATE storage_quotas
       SET default_quota_bytes = ?, admin_custom_quota_bytes = ?, is_unlimited = ?, updated_at = ?
       WHERE id = ?`,
      [planDef.default_quota_bytes, newCustomBytes, newUnlimited, nowIso, current.id]
    );

    const updated = this.recalculateBlockState(current.id);

    this.db.run(
      `INSERT INTO storage_quota_history (
        id, target_type, target_id, action, previous_custom_bytes, new_custom_bytes,
        previous_unlimited, new_unlimited, unit_input, changed_by, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'sqh_' + crypto.randomBytes(8).toString('hex'),
        target_type,
        target_id,
        action,
        current.admin_custom_quota_bytes,
        newCustomBytes,
        current.is_unlimited ? 1 : 0,
        newUnlimited,
        `${amount} ${unitNorm}`,
        adminUser.id,
        String(reason).trim(),
        nowIso
      ]
    );

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'storage_quota_adjust', ?, ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        adminUser.id,
        adminUser.role,
        target_type,
        target_id,
        JSON.stringify({
          action,
          unit_input: `${amount} ${unitNorm}`,
          effective_quota_bytes: updated.effective_quota_bytes,
          default_quota_bytes: updated.default_quota_bytes,
          is_unlimited: updated.is_unlimited,
          over_quota_blocked: updated.over_quota_blocked,
          preserved_existing_files: true
        }),
        nowIso
      ]
    );

    return {
      quota: updated,
      warning: updated.over_quota_blocked
        ? 'Cảnh báo: Hạn mức mới thấp hơn dung lượng đang lưu trữ. Hệ thống giữ nguyên 100% tệp cũ và quyền đọc/tải xuống, nhưng tạm ngăn tải lên tệp mới cho đến khi dung lượng phù hợp.'
        : null
    };
  }

  runMonthlyOrganizationQuotaReset(actorUser = null, { target_cycle_month = null } = {}) {
    if (actorUser) {
      requirePermission(actorUser, 'storage.manage');
    }
    const hcm = getCurrentHoChiMinhCycleMonth();
    const newCycleMonth = target_cycle_month || hcm.cycle_month;
    const nowIso = new Date().toISOString();

    const orgQuotas = this.db.query(
      `SELECT * FROM storage_quotas WHERE target_type = 'organization' AND is_monthly_cycle = 1`
    );

    const processed = [];
    for (const oq of orgQuotas) {
      const dec = this.decorateQuotaRow(oq);
      const cycleId = 'sqc_' + crypto.randomBytes(8).toString('hex');

      this.db.run(
        `INSERT INTO storage_quota_cycles (
          id, org_id, cycle_month, plan_code, effective_quota_bytes,
          closing_cycle_used_bytes, total_persistent_stored_bytes,
          job_status, reset_at, timezone, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, 'Asia/Ho_Chi_Minh', ?)`,
        [
          cycleId,
          oq.target_id,
          oq.cycle_month,
          oq.plan_code,
          dec.effective_quota_bytes || oq.default_quota_bytes,
          oq.cycle_used_bytes,
          oq.total_stored_bytes,
          nowIso,
          'Làm mới bộ đếm chu kỳ tháng ngày 01 (Asia/Ho_Chi_Minh); không cộng dồn dung lượng dư; giữ nguyên 100% dữ liệu đã lưu.'
        ]
      );

      this.db.run(
        `UPDATE storage_quotas
         SET cycle_month = ?, cycle_used_bytes = 0, over_quota_blocked = 0, quota_reached_at = NULL, updated_at = ?
         WHERE id = ?`,
        [newCycleMonth, nowIso, oq.id]
      );

      processed.push({
        org_id: oq.target_id,
        previous_cycle: oq.cycle_month,
        new_cycle: newCycleMonth,
        closed_cycle_used_bytes: oq.cycle_used_bytes,
        preserved_total_stored_bytes: oq.total_stored_bytes,
        files_deleted: 0
      });
    }

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'monthly_org_quota_reset', 'storage_quota_cycles', ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        actorUser ? actorUser.id : 'cron_scheduler_hcm',
        actorUser ? actorUser.role : 'system',
        newCycleMonth,
        JSON.stringify({ timezone: 'Asia/Ho_Chi_Minh', organizations_reset_count: processed.length, files_deleted: 0 }),
        nowIso
      ]
    );

    return {
      ok: true,
      timezone: 'Asia/Ho_Chi_Minh',
      new_cycle_month: newCycleMonth,
      organizations_reset_count: processed.length,
      personal_accounts_reset_count: 0,
      files_deleted: 0,
      processed
    };
  }

  /**
   * PHẦN VIII: DASHBOARD CÁ NHÂN VÀ GROW (DỮ LIỆU THỰC TẾ 100%)
   */
  getUserProgressDashboard(user) {
    requireAuth(user);
    const fullUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [user.id]);
    const attempts = this.db.query(
      `SELECT a.*, e.title AS exercise_title, e.topic, e.level
       FROM practice_attempts a
       LEFT JOIN practice_exercises e ON a.exercise_id = e.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [user.id]
    );

    const bySkill = {
      listening: { name_vi: 'Nghe điền từ', count: 0, total_score: 0, max_score: 0, errors_count: 0 },
      vocabulary: { name_vi: 'Từ vựng & Flashcard', count: 0, total_score: 0, max_score: 0, errors_count: 0 },
      sentence: { name_vi: 'Sắp xếp câu', count: 0, total_score: 0, max_score: 0, errors_count: 0 },
      reading: { name_vi: 'Đọc hiểu', count: 0, total_score: 0, max_score: 0, errors_count: 0 }
    };

    let totalDurationSeconds = 0;
    const activeDatesSet = new Set();

    for (const att of attempts) {
      totalDurationSeconds += Number(att.duration_seconds || 0);
      if (att.created_at) {
        activeDatesSet.add(att.created_at.slice(0, 10));
      }
      if (bySkill[att.tool_type]) {
        bySkill[att.tool_type].count += 1;
        bySkill[att.tool_type].total_score += att.score;
        bySkill[att.tool_type].max_score += att.max_score;
        if (!att.is_correct) {
          bySkill[att.tool_type].errors_count += 1;
        }
      }
    }

    const skillBreakdown = Object.entries(bySkill).map(([skill, stat]) => ({
      skill,
      skill_name_vi: stat.name_vi,
      attempts_count: stat.count,
      errors_count: stat.errors_count,
      total_score: stat.total_score,
      max_score: stat.max_score,
      accuracy_percent: stat.max_score > 0 ? Math.round((stat.total_score / stat.max_score) * 100) : 0
    }));

    // Tính chuỗi ngày thực hành (streak_days) từ dữ liệu thật
    const sortedDates = Array.from(activeDatesSet).sort().reverse();
    const streakDays = sortedDates.length;

    const vocabItems = this.db.query(`SELECT * FROM vocabulary_items WHERE user_id = ?`, [user.id]);
    const knownWordsCount = vocabItems.filter(v => Number(v.mastery_level || 0) >= 3).length;
    const unmemorizedWordsCount = vocabItems.length - knownWordsCount;

    const goals = this.db.query(`SELECT * FROM learning_goals WHERE user_id = ?`, [user.id]);
    const roadmaps = this.db.query(`SELECT * FROM learning_roadmaps WHERE user_id = ? ORDER BY updated_at DESC`, [user.id]).map(r => ({
      ...r,
      skills_to_improve: JSON.parse(r.skills_to_improve_json || '[]'),
      recommended_exercises: JSON.parse(r.recommended_exercises_json || '[]')
    }));
    const savedItems = this.db.query(`SELECT * FROM saved_learning_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [user.id]).map(s => ({
      ...s,
      content: JSON.parse(s.content_json || '{}')
    }));
    const achievements = this.db.query(`SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC`, [user.id]);
    const quota = this.ensureQuotaRecord('personal', user.id, fullUser.plan_code);

    const weakestSkill = [...skillBreakdown].sort((a, b) => a.attempts_count - b.attempts_count || a.accuracy_percent - b.accuracy_percent)[0];
    const nextExercises = this.db.query(
      `SELECT id, language_code, tool_type, level, topic, title, points FROM practice_exercises WHERE tool_type = ? LIMIT 3`,
      [weakestSkill ? weakestSkill.skill : 'listening']
    );

    const recommendation = weakestSkill
      ? `Gợi ý thực hành tiếp theo: Bạn nên rèn luyện thêm công cụ "${weakestSkill.skill_name_vi}" để cân bằng cả 04 kỹ năng.`
      : 'Hãy bắt đầu bài thực hành đầu tiên của bạn tại Trung tâm học tập.';

    return {
      account_overview: {
        full_name: fullUser.full_name,
        learning_languages: JSON.parse(fullUser.learning_languages || '["en"]'),
        current_level: fullUser.proficiency_level,
        learning_goals: fullUser.learning_goals,
        plan_code: fullUser.plan_code
      },
      total_attempts: attempts.length,
      completed_exercises_count: new Set(attempts.filter(a => a.is_correct).map(a => a.exercise_id)).size,
      total_duration_seconds: totalDurationSeconds,
      total_duration_minutes: Math.round((totalDurationSeconds / 60) * 10) / 10,
      total_score_earned: attempts.reduce((acc, x) => acc + x.score, 0),
      streak_days: streakDays,
      practice_calendar_dates: sortedDates,
      vocabulary_reviewing_count: vocabItems.length,
      vocabulary_known_count: knownWordsCount,
      vocabulary_unmemorized_count: unmemorizedWordsCount,
      skill_breakdown: skillBreakdown,
      recent_attempts: attempts.slice(0, 20),
      mistake_items: savedItems.filter(i => i.item_type === 'wrong_sentence' || i.item_type === 'difficult_sentence'),
      saved_items: savedItems,
      personal_goals: goals,
      roadmaps,
      achievements,
      recommended_next_exercises: nextExercises,
      storage_quota: quota,
      practice_recommendation: recommendation
    };
  }

  upsertLearningGoal(user, { language_code, target_title, target_sessions_per_week = 5, daily_minutes_target = 30 }) {
    requireAuth(user);
    const id = 'goal_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO learning_goals (id, user_id, language_code, target_title, target_sessions_per_week, current_sessions, status, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 'in_progress', ?)`,
      [id, user.id, language_code || 'en', String(target_title || 'Thực hành mỗi ngày').trim(), Number(target_sessions_per_week || 5), now]
    );
    return this.db.get(`SELECT * FROM learning_goals WHERE id = ?`, [id]);
  }

  listResources(user, { language_code = null, resource_type = null, q = null } = {}) {
    const clauses = ["moderation_status = 'approved'"];
    const params = [];
    if (language_code) {
      clauses.push('language_code = ?');
      params.push(language_code);
    }
    if (resource_type) {
      clauses.push('resource_type = ?');
      params.push(resource_type);
    }
    if (q) {
      clauses.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const rows = this.db.query(
      `SELECT r.*, u.full_name AS author_name
       FROM resources r
       LEFT JOIN users u ON r.uploader_id = u.id
       WHERE ${clauses.join(' AND ').replace(/language_code/g, 'r.language_code').replace(/resource_type/g, 'r.resource_type').replace(/moderation_status/g, 'r.moderation_status').replace(/title/g, 'r.title').replace(/description/g, 'r.description')}
       ORDER BY r.created_at DESC`,
      params
    );
    return rows.filter(r => {
      if (r.access_scope === 'public') return true;
      if (!user) return false;
      if (r.uploader_id === user.id || user.role === 'super_admin') return true;
      if (r.access_scope === 'organization' && r.owner_org_id) {
        const m = this.db.get(
          `SELECT id FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
          [r.owner_org_id, user.id]
        );
        return Boolean(m);
      }
      if (r.access_scope === 'member') return true;
      if (r.access_scope === 'plus_only') return user.plan_code !== 'personal_free';
      return false;
    }).map(r => {
      const linkedEx = this.db.query(
        `SELECT id, title, tool_type, level FROM practice_exercises WHERE language_code = ? LIMIT 2`,
        [r.language_code]
      );
      return {
        ...r,
        source_attribution: r.author_name || 'Kho học liệu cộng đồng WORD BRIDGE',
        usage_rights_label: r.access_scope === 'public' ? 'Sử dụng cho mục đích học tập trên WORD BRIDGE' : 'Tài liệu lưu hành theo phân quyền',
        linked_exercises: linkedEx
      };
    });
  }

  toggleResourceFavorite(user, { resource_id }) {
    requireAuth(user);
    const resRow = this.db.get(`SELECT * FROM resources WHERE id = ?`, [resource_id]);
    if (!resRow) throw new Error('Không tìm thấy tài liệu.');
    const existing = this.db.get(
      `SELECT * FROM resource_favorites WHERE user_id = ? AND resource_id = ?`,
      [user.id, resource_id]
    );
    if (existing) {
      this.db.run(`DELETE FROM resource_favorites WHERE user_id = ? AND resource_id = ?`, [user.id, resource_id]);
      this.db.run(`UPDATE resources SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?`, [resource_id]);
      return { favorited: false, resource_id };
    }
    this.db.run(
      `INSERT INTO resource_favorites (user_id, resource_id, created_at) VALUES (?, ?, ?)`,
      [user.id, resource_id, new Date().toISOString()]
    );
    this.db.run(`UPDATE resources SET favorite_count = favorite_count + 1 WHERE id = ?`, [resource_id]);
    return { favorited: true, resource_id };
  }

  uploadResource(user, body) {
    requireAuth(user);
    const {
      language_code = 'en',
      resource_type = 'pdf',
      title,
      description = '',
      access_scope = 'public',
      owner_org_id = null,
      mime_type = 'text/plain',
      content_base64 = '',
      simulated_size_bytes = null,
      original_name = 'resource.txt'
    } = body || {};

    if (!title) throw new Error('Vui lòng nhập tiêu đề học liệu.');

    let targetType = 'personal';
    let targetId = user.id;
    if (owner_org_id) {
      requireOrgAccess(this.db, user, owner_org_id, ['owner', 'head', 'manager', 'executive', 'coordinator', 'group_leader', 'member']);
      targetType = 'organization';
      targetId = owner_org_id;
    }

    const buf = content_base64
      ? Buffer.from(content_base64, 'base64')
      : Buffer.from(`Tài liệu học tập WORD BRIDGE: ${title}`, 'utf8');

    const effectiveSizeBytes = simulated_size_bytes !== null ? Number(simulated_size_bytes) : buf.length;

    const updatedQuota = this.checkAndConsumeQuota({
      actorUser: user,
      targetType,
      targetId,
      incomingBytes: effectiveSizeBytes
    });

    const stored = this.storageAdapter.saveFile({
      buffer: buf,
      mimeType: mime_type,
      originalName: original_name,
      scope: owner_org_id ? 'organization' : access_scope,
      ownerId: targetId,
      ownerType: targetType
    });

    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO storage_files (
        id, storage_key, owner_type, owner_user_id, owner_org_id,
        uploaded_by_user_id, original_name, mime_type, size_bytes,
        checksum_sha256, access_scope, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        stored.file_id,
        stored.storage_key,
        targetType,
        targetType === 'personal' ? user.id : null,
        owner_org_id || null,
        user.id,
        original_name,
        stored.mime_type,
        effectiveSizeBytes,
        stored.checksum_sha256,
        owner_org_id ? 'organization' : access_scope,
        now
      ]
    );

    const id = 'res_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT INTO resources (
        id, uploader_id, language_code, resource_type, title, description,
        access_scope, owner_group_id, owner_org_id, storage_key, mime_type,
        size_bytes, moderation_status, favorite_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'approved', 0, ?)`,
      [
        id,
        user.id,
        language_code,
        resource_type,
        String(title).trim(),
        String(description).trim(),
        owner_org_id ? 'organization' : access_scope,
        owner_org_id || null,
        stored.storage_key,
        stored.mime_type,
        effectiveSizeBytes,
        now
      ]
    );

    this.db.run(
      `INSERT INTO storage_access_logs (id, file_id, actor_user_id, owner_type, owner_id, action, size_bytes, status, detail, created_at)
       VALUES (?, ?, ?, ?, ?, 'upload', ?, 'success', ?, ?)`,
      [
        'sal_' + crypto.randomBytes(8).toString('hex'),
        stored.file_id,
        user.id,
        targetType,
        targetId,
        effectiveSizeBytes,
        `Tải lên học liệu '${title}' (${formatBytesHuman(effectiveSizeBytes)}) lên Cloudflare R2`,
        now
      ]
    );

    return {
      ...this.db.get(`SELECT * FROM resources WHERE id = ?`, [id]),
      file_id: stored.file_id,
      quota_after_upload: updatedQuota
    };
  }

  downloadStorageFile(user, fileId) {
    const fileRec = this.db.get(`SELECT * FROM storage_files WHERE id = ? AND status = 'active'`, [fileId]);
    if (!fileRec) {
      const err = new Error('Không tìm thấy tệp lưu trữ.');
      err.statusCode = 404;
      throw err;
    }

    try {
      const buf = this.storageAdapter.readFileAuthorized({
        storageKey: fileRec.storage_key,
        requesterUser: user,
        fileRecord: fileRec,
        db: this.db
      });
      this.db.run(
        `INSERT INTO storage_access_logs (id, file_id, actor_user_id, owner_type, owner_id, action, size_bytes, status, detail, created_at)
         VALUES (?, ?, ?, ?, ?, 'download', ?, 'success', 'Tải xuống tệp hợp lệ', ?)`,
        [
          'sal_' + crypto.randomBytes(8).toString('hex'),
          fileRec.id,
          user ? user.id : 'guest',
          fileRec.owner_type,
          fileRec.owner_org_id || fileRec.owner_user_id || '',
          fileRec.size_bytes,
          new Date().toISOString()
        ]
      );
      return {
        file: fileRec,
        content_length: buf ? buf.length : fileRec.size_bytes
      };
    } catch (err) {
      this.db.run(
        `INSERT INTO storage_access_logs (id, file_id, actor_user_id, owner_type, owner_id, action, size_bytes, status, detail, created_at)
         VALUES (?, ?, ?, ?, ?, 'cross_access_denied', ?, 'denied', ?, ?)`,
        [
          'sal_' + crypto.randomBytes(8).toString('hex'),
          fileRec.id,
          user ? user.id : 'guest',
          fileRec.owner_type,
          fileRec.owner_org_id || fileRec.owner_user_id || '',
          fileRec.size_bytes,
          err.message,
          new Date().toISOString()
        ]
      );
      throw err;
    }
  }

  reportCopyrightOrViolation(user, { resource_id = null, post_id = null, report_type = 'copyright', reason, evidence_note = '' }) {
    requireAuth(user);
    if (!reason) throw new Error('Vui lòng mô tả lý do báo cáo hoặc khiếu nại bản quyền.');
    const id = 'rep_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO copyright_reports (id, resource_id, post_id, reporter_id, report_type, reason, evidence_note, status, handled_by, resolution_note, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, '', ?, NULL)`,
      [id, resource_id, post_id, user.id, report_type, String(reason).trim(), String(evidence_note).trim(), now]
    );
    return this.db.get(`SELECT * FROM copyright_reports WHERE id = ?`, [id]);
  }
}

export { ProgressAndResourcesModule, getCurrentHoChiMinhCycleMonth, formatBytesHuman };
export default { ProgressAndResourcesModule, getCurrentHoChiMinhCycleMonth, formatBytesHuman };
