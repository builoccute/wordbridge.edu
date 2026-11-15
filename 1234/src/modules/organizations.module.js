'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { requireAuth, requirePermission, requireOrgAccess } = require('../security/rbac.middleware');

const ADMIN_UNITS_PATH = path.resolve(process.cwd(), 'database/seeds/02_vn_admin_units.json');
const ADMIN_UNITS_DATA = JSON.parse(fs.readFileSync(ADMIN_UNITS_PATH, 'utf8'));

/**
 * TỔ CHỨC, CLB, ĐỘI, NHÓM & HỆ THỐNG ĐĂNG KÝ 2 LOẠI / XÉT DUYỆT (PHẦN 14 & 15)
 */
class OrganizationsModule {
  constructor(db, authService, emailAdapter) {
    this.db = db;
    this.authService = authService;
    this.emailAdapter = emailAdapter;
  }

  getAdministrativeCatalog() {
    return {
      total_provinces: ADMIN_UNITS_DATA.total_provinces,
      provinces: ADMIN_UNITS_DATA.provinces,
      approved_activity_fields: ADMIN_UNITS_DATA.approved_activity_fields,
      allowed_social_platforms: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Khác'],
      signature_methods: [
        { code: 'digital_cert', name: 'Chữ ký số hợp lệ (Giá trị pháp lý theo chứng thư số)' },
        { code: 'upload_image', name: 'Tải ảnh chữ ký (Xác nhận hồ sơ nội bộ, không mặc định tương đương chữ ký số pháp lý)' },
        { code: 'direct_draw', name: 'Ký trực tiếp bằng chuột, bút cảm ứng hoặc ngón tay' }
      ]
    };
  }

  lookupLegalEntityByCode(queryCode) {
    const q = String(queryCode || '').trim();
    if (!q) {
      throw new Error('Vui lòng nhập Mã số doanh nghiệp / Mã số tổ chức / Mã số pháp lý để tra cứu.');
    }
    const matches = ADMIN_UNITS_DATA.public_legal_registry.filter(
      item => item.legal_code === q || item.short_name.toLowerCase() === q.toLowerCase() || item.legal_name.toLowerCase().includes(q.toLowerCase())
    );
    return {
      query: q,
      looked_up_at: new Date().toISOString(),
      source: 'Danh mục Cổng dữ liệu công khai & đối tác giáo dục đã xác thực',
      found_count: matches.length,
      results: matches,
      note: matches.length === 0
        ? 'Không tìm thấy dữ liệu trùng khớp trong nguồn công khai. Hệ thống không tự suy đoán hay tạo dữ liệu giả; vui lòng kiểm tra lại mã số hoặc bổ sung thông tin hợp lệ.'
        : 'Đã tìm thấy dữ liệu công khai. Hệ thống tự động điền các trường đã xác thực để bạn không phải nhập lại.'
    };
  }

  validateAdministrativeAddress(provinceCode, communeName, addressDetail, fieldLabel = 'Địa chỉ') {
    if (!provinceCode) {
      throw new Error(`${fieldLabel}: Phải chọn Tỉnh/Thành phố (trong 34 đơn vị hành chính cấp tỉnh hiện hành) trước khi chọn Xã/Phường/Đặc khu.`);
    }
    const prov = ADMIN_UNITS_DATA.provinces.find(p => p.code === String(provinceCode));
    if (!prov) {
      throw new Error(`${fieldLabel}: Tỉnh/Thành phố không thuộc danh mục 34 đơn vị hành chính Việt Nam hiện hành.`);
    }
    if (!communeName || !prov.communes.includes(communeName)) {
      throw new Error(`${fieldLabel}: Xã/Phường/Đặc khu '${communeName || ''}' không thuộc '${prov.name}'. Khi đổi tỉnh phải chọn lại cấp xã trực thuộc.`);
    }
    if (!addressDetail || String(addressDetail).trim().length < 3) {
      throw new Error(`${fieldLabel}: Vui lòng nhập địa chỉ chi tiết.`);
    }
    if (String(addressDetail).toLowerCase() === 'online' || String(addressDetail).toLowerCase() === 'hoạt động trực tuyến') {
      throw new Error(`${fieldLabel}: Lựa chọn 'Hoạt động trực tuyến (Online)' chỉ áp dụng cho Phạm vi hoạt động, không thay thế địa chỉ pháp lý/liên hệ.`);
    }
    return { province_code: prov.code, province_name: prov.name, commune_name: communeName, address_detail: String(addressDetail).trim() };
  }

  submitOrganizationApplication(user, body) {
    requireAuth(user);
    const {
      form_type, // 1 (Chưa có tư cách pháp nhân độc lập) | 2 (Có tư cách pháp nhân độc lập)
      section_i,
      section_ii,
      section_iii
    } = body || {};

    if (![1, 2].includes(Number(form_type))) {
      throw new Error('Loại biểu mẫu đăng ký tổ chức không hợp lệ (Chỉ có Loại 1 hoặc Loại 2).');
    }
    if (!section_i || !section_ii || !section_iii) {
      throw new Error('Biểu mẫu đăng ký tổ chức phải có đúng 03 mục chính: I. THÔNG TIN TỔ CHỨC, II. THÔNG TIN NGƯỜI ĐẠI DIỆN, III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ.');
    }
    if (section_i.country || section_ii.country) {
      throw new Error('Biểu mẫu địa chỉ hành chính Việt Nam không sử dụng trường Quốc gia.');
    }

    // Kiểm tra thông tin tổ chức (Mục I)
    if (!section_i.name || !section_i.short_name) {
      throw new Error('Mục I: Vui lòng nhập Tên đơn vị và Tên viết tắt.');
    }
    if (!section_i.logo_url) {
      throw new Error('Mục I: Logo đơn vị là thông tin bắt buộc.');
    }
    if (!ADMIN_UNITS_DATA.approved_activity_fields.includes(section_i.field_of_activity)) {
      throw new Error('Mục I: Lĩnh vực hoạt động phải nằm trong 05 lựa chọn đã duyệt hoặc Khác.');
    }

    // Kiểm tra nhóm Mạng xã hội gộp duy nhất (ít nhất 1 đường dẫn hợp lệ)
    const socialLinks = Array.isArray(section_i.social_links) ? section_i.social_links : [];
    const validSocials = socialLinks.filter(
      s => s && ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Khác'].includes(s.platform) && /^https?:\/\/.+/i.test(String(s.url || ''))
    );
    if (validSocials.length < 1) {
      throw new Error('Mục I (Mạng xã hội): Bắt buộc có ít nhất 01 đường dẫn mạng xã hội hợp lệ trong nhóm Mạng xã hội.');
    }

    // Kiểm tra địa chỉ hành chính 34 tỉnh/thành cho Tổ chức
    const orgAddr = this.validateAdministrativeAddress(
      section_i.province_code,
      section_i.commune_name,
      section_i.address_detail,
      'Mục I (Địa chỉ tổ chức)'
    );

    // Kiểm tra riêng theo Loại 1 & Loại 2
    if (Number(form_type) === 1) {
      if (section_i.has_legal_sponsor) {
        const sp = section_i.legal_sponsor || {};
        if (!sp.sponsor_name || !sp.representative_name || !sp.phone || !sp.confirmation_doc || !sp.scope_and_term) {
          throw new Error('Mục I (Bảo trợ pháp lý): Khi chọn Có đơn vị bảo trợ pháp lý, phải cung cấp đầy đủ Tên đơn vị bảo trợ, Người đại diện, SĐT, Văn bản xác nhận và Phạm vi/Thời hạn bảo trợ.');
        }
        if (String(sp.sponsor_name).trim().toLowerCase() === String(section_i.name).trim().toLowerCase()) {
          throw new Error('Không được coi đơn vị bảo trợ pháp lý và đơn vị đăng ký là cùng một pháp nhân.');
        }
      }
    } else {
      // Loại 2: Có tư cách pháp nhân độc lập
      if (!section_i.legal_code) {
        throw new Error('Mục I (Loại 2): Vui lòng nhập Mã số doanh nghiệp / Mã số tổ chức / Mã số pháp lý.');
      }
    }

    // Kiểm tra Mục II: Người đại diện
    if (!section_ii.full_name || !section_ii.birth_date || !section_ii.title || !section_ii.email || !section_ii.phone) {
      throw new Error('Mục II (Người đại diện): Vui lòng nhập đầy đủ Họ tên, Ngày sinh, Chức vụ, Email và Số điện thoại.');
    }
    const repAddr = this.validateAdministrativeAddress(
      section_ii.province_code,
      section_ii.commune_name,
      section_ii.address_detail,
      'Mục II (Địa chỉ người đại diện)'
    );

    // Kiểm tra Mục III: Xem lại & Chữ ký xác nhận
    const sigMethod = section_iii.signature_method;
    if (!['digital_cert', 'upload_image', 'direct_draw'].includes(sigMethod)) {
      throw new Error('Mục III: Phương thức chữ ký không hợp lệ (Chỉ hỗ trợ: digital_cert, upload_image, direct_draw).');
    }
    if (!section_iii.signature_data || String(section_iii.signature_data).trim().length < 5) {
      throw new Error('Mục III: Vui lòng thực hiện ký xác nhận trước khi nộp hồ sơ.');
    }
    if (!section_iii.confirmed_accurate || !section_iii.accepted_terms) {
      throw new Error('Mục III: Vui lòng xác nhận tính chính xác của hồ sơ và đồng ý điều khoản.');
    }

    const appId = 'orgapp_' + crypto.randomBytes(8).toString('hex');
    const appCode = 'WB-ORG-' + new Date().getFullYear() + '-' + crypto.randomInt(10000, 99999);
    const now = new Date().toISOString();

    const sigHistory = [
      {
        action: 'signed_and_submitted',
        method: sigMethod,
        legal_equivalence_note:
          sigMethod === 'digital_cert'
            ? 'Chữ ký số hợp lệ gắn với chứng thư số'
            : 'Chữ ký hình ảnh/vẽ tay phục vụ xác nhận hồ sơ, không mặc định có giá trị pháp lý tương đương chữ ký số',
        signer_user_id: user.id,
        signer_name: section_ii.full_name,
        signed_at: now
      }
    ];

    this.db.run(
      `INSERT INTO org_applications (
        id, application_code, applicant_user_id, form_type,
        section_i_org_json, section_ii_rep_json, section_iii_confirm_json,
        signature_method, signature_data, signature_history_json,
        signed_at, status, review_note, reviewed_by, reviewed_at, approved_org_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chờ xét duyệt', '', NULL, NULL, NULL, ?, ?)`,
      [
        appId,
        appCode,
        user.id,
        Number(form_type),
        JSON.stringify(Object.assign({}, section_i, { validated_address: orgAddr, social_links: validSocials })),
        JSON.stringify(Object.assign({}, section_ii, { validated_address: repAddr })),
        JSON.stringify(section_iii),
        sigMethod,
        section_iii.signature_data,
        JSON.stringify(sigHistory),
        now,
        now,
        now
      ]
    );

    // Gửi email xác nhận tiếp nhận hồ sơ từ noreply@wordbridge.io.vn
    this.emailAdapter.enqueueEmail({
      templateSlug: 'system-announcement.html',
      toEmail: section_ii.email,
      variables: {
        full_name: section_ii.full_name,
        ref_code: appCode,
        announcement_body: `Hồ sơ đăng ký tổ chức "${section_i.name}" (Mã hồ sơ: ${appCode}, Loại biểu mẫu: Loại ${form_type}) đã được tiếp nhận và chuyển tới Bộ phận Quản trị Tổ chức để xét duyệt.`
      }
    });

    return this.db.get(`SELECT * FROM org_applications WHERE id = ?`, [appId]);
  }

  reviewOrganizationApplication(adminUser, { application_id, new_status, review_note = '' }) {
    requirePermission(adminUser, 'org_applications.review');
    const validStatuses = [
      'Chưa gửi',
      'Đã gửi',
      'Chờ xét duyệt',
      'Yêu cầu bổ sung',
      'Đã phê duyệt',
      'Từ chối',
      'Đã kích hoạt',
      'Tạm đình chỉ'
    ];
    if (!validStatuses.includes(new_status)) {
      throw new Error('Trạng thái xét duyệt hồ sơ tổ chức không hợp lệ.');
    }
    if ((new_status === 'Từ chối' || new_status === 'Yêu cầu bổ sung') && !String(review_note || '').trim()) {
      throw new Error('Phải ghi rõ lý do khi Yêu cầu bổ sung hoặc Từ chối hồ sơ tổ chức.');
    }

    const app = this.db.get(`SELECT * FROM org_applications WHERE id = ?`, [application_id]);
    if (!app) throw new Error('Không tìm thấy hồ sơ đăng ký tổ chức.');

    const secI = JSON.parse(app.section_i_org_json || '{}');
    const secII = JSON.parse(app.section_ii_rep_json || '{}');
    const now = new Date();
    const nowIso = now.toISOString();
    let approvedOrgId = app.approved_org_id;

    // Chỉ sau khi phê duyệt mới cấp không gian tổ chức chính thức (PHẦN 15.5)
    if ((new_status === 'Đã phê duyệt' || new_status === 'Đã kích hoạt') && !approvedOrgId) {
      approvedOrgId = 'org_' + crypto.randomBytes(8).toString('hex');
      const orgCode = 'ORG-' + crypto.randomInt(1000, 9999);
      const addr = secI.validated_address || {};
      this.db.run(
        `INSERT INTO organizations (
          id, code, org_type_form, unit_category, name, short_name, logo_url,
          field_of_activity, founded_date, website, email, phone, social_links_json,
          introduction, history, mission, vision, main_activities, member_scale,
          operation_scope, province_code, province_name, commune_code, commune_name,
          address_detail, legal_code, legal_lookup_json, has_legal_sponsor, legal_sponsor_json,
          founder_name, head_name, representative_json, owner_user_id, plan_code, max_members,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'org_plus_monthly', 10, 'active', ?, ?)`,
        [
          approvedOrgId,
          orgCode,
          app.form_type,
          secI.unit_category || 'Tổ chức',
          secI.name,
          secI.short_name,
          secI.logo_url,
          secI.field_of_activity,
          secI.founded_date || '2026-01-01',
          secI.website || '',
          secI.email || secII.email,
          secI.phone || secII.phone,
          JSON.stringify(secI.social_links || []),
          secI.introduction || '',
          secI.history || '',
          secI.mission || '',
          secI.vision || '',
          secI.main_activities || '',
          secI.member_scale || '10 - 30 thành viên',
          secI.operation_scope || 'Toàn quốc',
          addr.province_code || '02',
          addr.province_name || 'Thành phố Hồ Chí Minh',
          addr.commune_name || 'Phường Thủ Đức',
          addr.commune_name || 'Phường Thủ Đức',
          addr.address_detail || '',
          secI.legal_code || '',
          JSON.stringify(secI.legal_lookup || {}),
          secI.has_legal_sponsor ? 1 : 0,
          JSON.stringify(secI.legal_sponsor || {}),
          secI.founder_name || secII.full_name,
          secII.full_name,
          JSON.stringify(secII),
          app.applicant_user_id,
          nowIso,
          nowIso
        ]
      );

      // Cấp quyền Người đứng đầu đơn vị (không cấp quyền quản trị nền tảng)
      const memId = 'omem_' + crypto.randomBytes(8).toString('hex');
      this.db.run(
        `INSERT OR REPLACE INTO org_members (id, org_id, user_id, org_role, title, permissions_json, status, joined_at)
         VALUES (?, ?, ?, 'head', ?, ?, 'active', ?)`,
        [
          memId,
          approvedOrgId,
          app.applicant_user_id,
          secII.title || 'Trưởng đơn vị',
          JSON.stringify(['org.manage', 'org.members.create', 'org.activities.manage', 'org.resources.manage']),
          nowIso
        ]
      );

      // Kích hoạt dùng thử Organization Plus 14 ngày (tối đa 10 thành viên - PHẦN 16.3)
      const trialEnd = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();
      this.db.run(
        `INSERT INTO subscriptions (id, user_id, org_id, plan_code, status, auto_renew, started_at, expires_at, history_json, created_at)
         VALUES (?, ?, ?, 'org_plus_monthly', 'trial', 0, ?, ?, ?, ?)`,
        [
          'sub_' + crypto.randomBytes(8).toString('hex'),
          app.applicant_user_id,
          approvedOrgId,
          nowIso,
          trialEnd,
          JSON.stringify([{ action: 'org_trial_14_days_10_members', at: nowIso }]),
          nowIso
        ]
      );
    }

    this.db.run(
      `UPDATE org_applications
       SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = ?, approved_org_id = ?, updated_at = ?
       WHERE id = ?`,
      [new_status, String(review_note).trim(), adminUser.id, nowIso, approvedOrgId, nowIso, application_id]
    );

    this.emailAdapter.enqueueEmail({
      templateSlug: 'system-announcement.html',
      toEmail: secII.email,
      variables: {
        full_name: secII.full_name,
        ref_code: app.application_code,
        announcement_body: `Hồ sơ tổ chức ${app.application_code} (${secI.name}) đã chuyển sang trạng thái: "${new_status}". Ghi chú xét duyệt: ${review_note || 'Không có'}.`
      }
    });

    return this.db.get(`SELECT * FROM org_applications WHERE id = ?`, [application_id]);
  }

  /**
   * PHẦN 14.3: Tài khoản chính tổ chức tạo tài khoản thành viên và cấp quyền trong phạm vi đơn vị.
   * Tuyệt đối không trao quyền quản trị nền tảng cho thành viên tổ chức.
   */
  createOrganizationMemberAccount(actorUser, { org_id, full_name, email, phone, password, org_role = 'member', title = 'Thành viên' }) {
    requireOrgAccess(this.db, actorUser, org_id, ['head', 'executive']);
    const org = this.db.get(`SELECT * FROM organizations WHERE id = ?`, [org_id]);
    if (!org) throw new Error('Không tìm thấy tổ chức.');

    const currentMemberCount = this.db.get(
      `SELECT COUNT(*) AS cnt FROM org_members WHERE org_id = ? AND status = 'active'`,
      [org_id]
    ).cnt;
    if (currentMemberCount >= org.max_members) {
      throw new Error(`Tổ chức đã đạt giới hạn tối đa ${org.max_members} thành viên của gói hiện tại. Hệ thống không tự thu thêm phí lẻ khi chưa có thỏa thuận nâng gói.`);
    }

    const pwdCheck = this.authService.validatePasswordPolicy(password, password);
    if (!pwdCheck.valid) {
      throw new Error(pwdCheck.issues.join(' '));
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    let memberUser = this.db.get(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    const nowIso = new Date().toISOString();

    if (!memberUser) {
      const { salt, hash } = this.authService.hashPassword(password);
      const newUserId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const uname = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase() + '_' + crypto.randomBytes(2).toString('hex');
      // Role trên nền tảng luôn là 'user', tuyệt đối không cấp 'super_admin' hay admin nền tảng
      this.db.run(
        `INSERT INTO users (
          id, full_name, username, email, phone, phone_verified, email_verified,
          password_hash, password_salt, role, plan_code, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, 'user', 'personal_free', 'active', ?, ?)`,
        [newUserId, String(full_name).trim(), uname, cleanEmail, String(phone || '0900000000'), hash, salt, nowIso, nowIso]
      );
      memberUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [newUserId]);
    }

    const safeOrgRole = ['executive', 'coordinator', 'member'].includes(org_role) ? org_role : 'member';
    const memId = 'omem_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT OR REPLACE INTO org_members (id, org_id, user_id, org_role, title, permissions_json, status, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        memId,
        org_id,
        memberUser.id,
        safeOrgRole,
        String(title).trim(),
        JSON.stringify(['view_org', 'join_activities']),
        nowIso
      ]
    );

    return {
      org_id,
      member_user_id: memberUser.id,
      email: memberUser.email,
      org_role: safeOrgRole,
      platform_role: memberUser.role,
      title
    };
  }


  /**
   * PHỤ LỤC A (MỤC A7): Khi thành viên rời tổ chức:
   * - Không tự động xóa dữ liệu tổ chức do thành viên đó đã tải lên.
   * - Không chuyển quyền sở hữu dữ liệu tổ chức cho tài khoản cá nhân một cách tùy tiện.
   * - Duy trì dữ liệu theo quyền và chính sách lưu trữ của tổ chức.
   * - Ghi nhật ký thay đổi thành viên (audit_logs).
   */
  removeOrganizationMember(actorUser, { org_id, member_user_id, reason = 'Thành viên rời tổ chức' }) {
    requireOrgAccess(this.db, actorUser, org_id, ['head', 'executive']);
    const member = this.db.get(
      `SELECT * FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
      [org_id, member_user_id]
    );
    if (!member) {
      throw new Error('Không tìm thấy thành viên đang hoạt động trong tổ chức.');
    }
    if (member.org_role === 'head') {
      throw new Error('Không thể xóa trực tiếp Người đứng đầu tổ chức khi chưa bàn giao quyền đại diện.');
    }

    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE org_members SET status = 'left' WHERE id = ?`,
      [member.id]
    );

    // Đảm bảo toàn bộ tệp do thành viên này từng tải lên trong không gian tổ chức
    // vẫn thuộc quyền sở hữu của tổ chức (owner_type = 'organization', owner_org_id = org_id) và không bị xóa!
    const preservedFilesCount = this.db.get(
      `SELECT COUNT(*) AS cnt FROM storage_files WHERE owner_org_id = ? AND uploaded_by_user_id = ? AND status = 'active'`,
      [org_id, member_user_id]
    ).cnt;

    this.db.run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'org_member_departed', 'organization', ?, '127.0.0.1', ?, ?)`,
      [
        'aud_' + crypto.randomBytes(8).toString('hex'),
        actorUser.id,
        actorUser.role,
        org_id,
        JSON.stringify({
          departed_user_id: member_user_id,
          reason,
          org_files_deleted: 0,
          ownership_transferred_to_personal: false,
          preserved_org_files_count: preservedFilesCount
        }),
        nowIso
      ]
    );

    return {
      org_id,
      departed_user_id: member_user_id,
      status: 'left',
      org_files_deleted: 0,
      ownership_transferred_to_personal: false,
      preserved_org_files_count: preservedFilesCount
    };
  }

  getMySpaceOverview(user) {
    requireAuth(user);
    const orgMemberships = this.db.query(
      `SELECT m.*, o.name AS org_name, o.short_name, o.unit_category, o.code AS org_code
       FROM org_members m
       JOIN organizations o ON m.org_id = o.id
       WHERE m.user_id = ?`,
      [user.id]
    );
    const groupMemberships = this.db.query(
      `SELECT gm.*, g.name AS group_name, g.group_category, g.language_code
       FROM group_members gm
       JOIN community_groups g ON gm.group_id = g.id
       WHERE gm.user_id = ?`,
      [user.id]
    );
    const myApplications = this.db.query(
      `SELECT id, application_code, form_type, status, review_note, approved_org_id, created_at
       FROM org_applications WHERE applicant_user_id = ? ORDER BY created_at DESC`,
      [user.id]
    );
    return {
      organizations: orgMemberships,
      groups: groupMemberships,
      applications: myApplications
    };
  }
}

module.exports = { OrganizationsModule };
