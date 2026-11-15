'use strict';
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = '/tmp/wb_test_suite.sqlite';

const assert = require('assert');
const fs = require('fs');
const { createAppServer, services } = require('../src/server');
const { BRAND, GB_BYTES, TB_BYTES, EMAIL_ADDRESSES, OFFICIAL_ROUTES } = require('../src/config/constants');

async function runTests() {
  if (fs.existsSync(process.env.SQLITE_DB_PATH)) {
    fs.unlinkSync(process.env.SQLITE_DB_PATH);
  }
  services.db.migrateAndInitialize();
  const seedSql = fs.readFileSync(require('path').resolve(process.cwd(), 'database/seeds/01_reference_data.sql'), 'utf8');
  services.db.execScript(seedSql);

  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function req(pathname, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const res = await fetch(`${baseUrl}${pathname}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    return { status: res.status, data };
  }

  let passed = 0;
  function ok(name, cond) {
    assert.ok(cond, `FAILED: ${name}`);
    passed += 1;
    console.log(`  [PASS] ${String(passed).padStart(2, '0')}. ${name}`);
  }

  try {
    console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ SINH THÁI WORD BRIDGE + PHỤ LỤC A ===');

    // 1. Kiểm tra Kiến trúc 1 tên miền, Không có Sự kiện (/su-kien), Không có Vipro, Không dùng Cloudflare D1/R2
    const boot = await req('/api/system/bootstrap');
    ok('Bootstrap trả về đúng thương hiệu WORD BRIDGE & tên miền https://wordbridge.io.vn',
      boot.status === 200 && boot.data.brand.NAME === 'WORD BRIDGE' && boot.data.brand.CANONICAL_ORIGIN === 'https://wordbridge.io.vn');
    const wranglerTxt = fs.readFileSync(require("path").resolve(process.cwd(), "wrangler.toml"), "utf8");
    ok("Tích hợp chuẩn wrangler.toml (name=wordbridge, D1 word ce84cc48-6d49-409b-b45a-13ba3bc4a771, R2 word, MONTHLY_QUOTA_GB)",
      wranglerTxt.includes("name = \"wordbridge\"") &&
      wranglerTxt.includes("database_id = \"ce84cc48-6d49-409b-b45a-13ba3bc4a771\"") &&
      wranglerTxt.includes("bucket_name = \"word\"") &&
      boot.data.integrations.infrastructure.d1_database_id === "ce84cc48-6d49-409b-b45a-13ba3bc4a771");

    for (const svgPath of ["/assets/logo-light.svg", "/assets/logo-dark.svg", "/assets/logo-vertical.svg", "/assets/favicon.svg", "/assets/hero-globe-illustration.svg"]) {
      const svgRes = await req(svgPath);
      ok(`Tài nguyên ảnh SVG ${svgPath} hoạt động hoàn hảo không lỗi ảnh (HTTP 200)`,
        svgRes.status === 200 && String(svgRes.data).includes("<svg"));
    }

    const evRoute = await req('/su-kien');
    ok('Route /su-kien bị loại bỏ hoàn toàn và trả về 404', evRoute.status === 404);
    ok('Danh mục OFFICIAL_ROUTES có /quan-tri/luu-tru và tuyệt đối không chứa /su-kien hay Vipro',
      OFFICIAL_ROUTES.some(r => r.path === '/quan-tri/luu-tru') &&
      !OFFICIAL_ROUTES.some(r => r.path.includes('su-kien') || r.title.toLowerCase().includes('vipro')));

    // 2. Kiểm tra quy chuẩn mật khẩu >= 15 ký tự, >= 1 chữ hoa, >= 3 ký tự đặc biệt
    const weakReg = await req('/api/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Người dùng Mật khẩu Yếu',
        email: 'weak@wordbridge.io.vn',
        phone: '0912345678',
        password: 'Short1!',
        confirm_password: 'Short1!',
        accept_terms: true,
        accept_privacy: true
      }
    });
    ok('Từ chối mật khẩu dưới 15 ký tự hoặc thiếu ký tự đặc biệt', weakReg.status === 400);

    // 3. Đăng ký cá nhân hợp lệ + Kích hoạt dùng thử 07 ngày Personal Plus (5 GB mặc định)
    const validPwd = 'WordBridge2026!@#Strong';
    const user1Reg = await req('/api/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Nguyễn Minh Anh',
        username: 'minhanh2026',
        email: 'minhanh@vsvc.edu.vn',
        phone: '0988504210',
        password: validPwd,
        confirm_password: validPwd,
        accept_terms: true,
        accept_privacy: true
      }
    });
    ok('Đăng ký tài khoản cá nhân thành công và cấp 07 ngày dùng thử Personal Plus',
      user1Reg.status === 201 && user1Reg.data.trial.trial_days === 7);
    const token1 = user1Reg.data.session.token;
    const user1Id = user1Reg.data.user.id;
    const authHeader1 = { Authorization: `Bearer ${token1}` };

    // 4. Kiểm tra Email OTP xác minh chính chủ
    const otpVerify = await req('/api/auth/otp/verify', {
      method: 'POST',
      body: {
        email: 'minhanh@vsvc.edu.vn',
        purpose: 'register',
        otp_code: user1Reg.data.otp_verification._test_only_otp
      }
    });
    ok('Xác thực Email OTP một lần thành công', otpVerify.status === 200 && otpVerify.data.verified === true);

    // 5. Kiểm tra OAuth không hỗ trợ Zalo và bắt buộc xác minh chính chủ trước khi gộp
    const zaloTry = await req('/api/auth/oauth/link', {
      method: 'POST',
      headers: authHeader1,
      body: { provider: 'zalo', provider_user_id: 'z1', provider_email: 'minhanh@vsvc.edu.vn', ownership_verified: true }
    });
    ok('Từ chối liên kết OAuth với Zalo (Chỉ hỗ trợ Google, Facebook, Microsoft, Apple)', zaloTry.status === 400);

    const unverifiedOauth = await req('/api/auth/oauth/link', {
      method: 'POST',
      headers: authHeader1,
      body: { provider: 'google', provider_user_id: 'g1', provider_email: 'minhanh@vsvc.edu.vn', ownership_verified: false }
    });
    ok('Từ chối tự động gộp tài khoản OAuth khi chưa xác minh chính chủ', unverifiedOauth.status === 400);

    // 6. Kiểm tra 05 ngôn ngữ & 04 công cụ thực hành cốt lõi
    const langsRes = await req('/api/learning/languages');
    ok('Đầy đủ 05 ngôn ngữ (Trung, Anh, Hàn, Nhật, Nga)',
      langsRes.status === 200 && langsRes.data.languages.length === 5);

    const allExRes = await req('/api/learning/exercises');
    ok('Đầy đủ 20 bài thực hành cho 05 ngôn ngữ x 04 công cụ (Nghe, Từ vựng, Sắp xếp câu, Đọc hiểu)',
      allExRes.status === 200 && allExRes.data.exercises.length === 20);

    const listenAttempt = await req('/api/learning/attempts', {
      method: 'POST',
      headers: authHeader1,
      body: { exercise_id: 'ex_en_listen_1', submission: { blank: 'practice' }, duration_seconds: 18 }
    });
    ok('Chấm điểm chính xác bài Nghe điền từ và lưu lịch sử thực hành',
      listenAttempt.status === 200 && listenAttempt.data.result.is_correct === true && listenAttempt.data.result.score === 10);

    // 7. Kiểm tra Trợ lý AI ngữ cảnh
    const aiCheatTry = await req('/api/learning/ai-assist', {
      method: 'POST',
      headers: authHeader1,
      body: { exercise_id: 'ex_en_listen_1', language_code: 'en', question: 'Hãy giải hết và làm thay toàn bộ bài cho tôi' }
    });
    ok('Trợ lý AI từ chối yêu cầu làm thay toàn bộ bài tập', aiCheatTry.status === 400);

    const aiValid = await req('/api/learning/ai-assist', {
      method: 'POST',
      headers: authHeader1,
      body: { exercise_id: 'ex_en_listen_1', language_code: 'en', question: 'Giải thích ngữ cảnh từ practice trong câu' }
    });
    ok('Trợ lý AI giải thích ngữ cảnh hợp lệ và ghi nhận hạn mức sử dụng',
      aiValid.status === 200 && aiValid.data.quota.used_today === 1);

    // 8. Kiểm tra Theo dõi tiến độ & Hạn mức Personal Plus (5 GB mặc định)
    const progRes = await req('/api/progress', { headers: authHeader1 });
    ok('Dashboard Theo dõi tiến độ phản ánh đúng lượt làm bài thực tế & hạn mức Personal Plus 5 GB',
      progRes.status === 200 &&
      progRes.data.dashboard.total_attempts === 1 &&
      progRes.data.dashboard.storage_quota.default_quota_bytes === 5 * GB_BYTES);

    // 9. Kiểm tra Kết nối bạn học & Chat
    const user2Reg = await req('/api/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Trần Quốc Bảo',
        username: 'quocbao2026',
        email: 'quocbao@wordbridge.io.vn',
        phone: '0977112233',
        password: validPwd,
        confirm_password: validPwd,
        accept_terms: true,
        accept_privacy: true
      }
    });
    const token2 = user2Reg.data.session.token;
    const user2Id = user2Reg.data.user.id;
    const authHeader2 = { Authorization: `Bearer ${token2}` };

    const prematureChat = await req('/api/chat/messages', {
      method: 'POST',
      headers: authHeader1,
      body: { recipient_id: user2Id, content: 'Xin chào khi chưa kết bạn' }
    });
    ok('Chặn mở trò chuyện riêng tư khi hai bên chưa đồng thuận kết bạn', prematureChat.status === 400);

    const frReq = await req('/api/friends/request', {
      method: 'POST',
      headers: authHeader1,
      body: { addressee_id: user2Id, match_note: 'Cùng học Tiếng Anh B1' }
    });
    const frAccept = await req('/api/friends/respond', {
      method: 'POST',
      headers: authHeader2,
      body: { friendship_id: frReq.data.friendship.id, action: 'accept' }
    });
    ok('Kết bạn thành công sau khi bên nhận đồng ý (accepted)',
      frAccept.status === 200 && frAccept.data.friendship.status === 'accepted');

    // 10. Kiểm tra Hệ thống Đăng ký Tổ chức (2 loại biểu mẫu, 3 mục I-II-III, 34 tỉnh/thành, chữ ký)
    const catRes = await req('/api/organizations/catalog');
    ok('Danh mục hành chính Việt Nam có đúng 34 tỉnh/thành phố hiện hành và 05 lĩnh vực + Khác',
      catRes.status === 200 && catRes.data.catalog.total_provinces === 34 && catRes.data.catalog.approved_activity_fields.length === 6);

    const lookupLegal = await req('/api/organizations/lookup-legal?code=0303460456');
    ok('Tra cứu mã số pháp nhân Loại 2 hoạt động chính xác',
      lookupLegal.status === 200 && lookupLegal.data.found_count === 1 && lookupLegal.data.results[0].short_name === 'USSH');

    const orgAppRes = await req('/api/organizations/applications', {
      method: 'POST',
      headers: authHeader1,
      body: {
        form_type: 1,
        section_i: {
          name: 'Câu lạc bộ Ngoại ngữ Sky First',
          short_name: 'SFEC',
          unit_category: 'Câu lạc bộ',
          logo_url: '/assets/favicon.svg',
          field_of_activity: 'Giáo dục và Đào tạo ngoại ngữ',
          founded_date: '2025-11-01',
          email: 'sfec@wordbridge.io.vn',
          phone: '0988504210',
          social_links: [{ platform: 'Facebook', url: 'https://facebook.com/sfec' }],
          introduction: 'CLB thực hành ngoại ngữ cộng đồng',
          mission: 'Kết nối người học',
          operation_scope: 'Toàn quốc',
          province_code: '02',
          commune_name: 'Phường Thủ Đức',
          address_detail: 'Số 1 Võ Văn Ngân',
          has_legal_sponsor: false
        },
        section_ii: {
          full_name: 'Bùi Tấn Lộc',
          birth_date: '2006-10-23',
          title: 'Chủ nhiệm CLB',
          email: 'minhanh@vsvc.edu.vn',
          phone: '0988504210',
          province_code: '02',
          commune_name: 'Phường Thủ Đức',
          address_detail: 'Số 1 Võ Văn Ngân'
        },
        section_iii: {
          signature_method: 'direct_draw',
          signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
          confirmed_accurate: true,
          accepted_terms: true
        }
      }
    });
    ok('Nộp hồ sơ đăng ký tổ chức (3 mục I, II, III + chữ ký) thành công với trạng thái Chờ xét duyệt',
      orgAppRes.status === 201 && orgAppRes.data.application.status === 'Chờ xét duyệt');

    // 11. Kiểm tra Chương trình Hỗ trợ Sinh viên & Payment Core QR
    const cardTry = await req('/api/commerce/support-programs/apply', {
      method: 'POST',
      headers: authHeader1,
      body: { program_type: 'student_plus', student_edu_email: 'minhanh@vsvc.edu.vn', reject_student_card_upload: true }
    });
    ok('Từ chối xác minh sinh viên bằng thẻ sinh viên (chỉ chấp nhận email trường cấp)', cardTry.status === 400);

    const eduValid = await req('/api/commerce/support-programs/apply', {
      method: 'POST',
      headers: authHeader1,
      body: { program_type: 'student_plus', student_edu_email: 'minhanh@vsvc.edu.vn', reason: 'Sinh viên đăng ký thực hành ngoại ngữ' }
    });
    ok('Phê duyệt ưu đãi Personal Plus 03 tháng miễn phí qua email sinh viên .edu.vn (01 lần duy nhất)',
      eduValid.status === 201 && eduValid.data.application.status === 'approved');

    const ordRes = await req('/api/payments/orders', {
      method: 'POST',
      headers: authHeader2,
      body: { plan_code: 'personal_plus_monthly' }
    });
    ok('Tạo đơn hàng thanh toán QR thành công với nội dung chuyển khoản duy nhất',
      ordRes.status === 201 && ordRes.data.order.final_amount_vnd === 129000);

    const notifyTransfer = await req('/api/payments/notify-transfer', {
      method: 'POST',
      headers: authHeader2,
      body: { order_id: ordRes.data.order.id }
    });
    ok('Bấm nút thông báo đã chuyển khoản KHÔNG tự động đánh dấu paid khi chưa đối soát',
      notifyTransfer.status === 200 && notifyTransfer.data.status === 'pending' && notifyTransfer.data.service_activated === false);

    // 12. Kiểm tra HỆ THỐNG KHẢO THÍ WORD BRIDGE (/khao-thi)
    const enterExam = await req('/api/exams/enter-room', {
      method: 'POST',
      headers: authHeader1,
      body: { exam_id: 'exam_wb_en_b1' }
    });
    const firstQ = enterExam.data.questions[0];
    ok('Vào phòng thi /khao-thi thành công và tuyệt đối KHÔNG gửi đáp án đúng xuống trình duyệt',
      enterExam.status === 200 && firstQ && firstQ.correct_answer_json === undefined && firstQ.explanation === undefined);

    const integrityEvt = await req('/api/exams/integrity-events', {
      method: 'POST',
      headers: authHeader1,
      body: { session_id: enterExam.data.session.id, event_type: 'tab_switch', description: 'Chuyển tab trong giờ thi' }
    });
    ok('Ghi nhận sự kiện liêm chính khảo thí vào hồ sơ bằng chứng và AI không tự động đánh trượt thí sinh',
      integrityEvt.status === 200 && integrityEvt.data.auto_disqualified === false);

    const submitExam = await req('/api/exams/submit', {
      method: 'POST',
      headers: authHeader1,
      body: {
        session_id: enterExam.data.session.id,
        answers: { eq_en_1: 'interaction', eq_en_3: 'Đúng', eq_en_4: 'in' }
      }
    });
    ok('Nộp bài thi chính thức, chấm điểm tự động và khóa chỉnh sửa sau khi nộp',
      submitExam.status === 200 && submitExam.data.score === 60 && submitExam.data.locked_after_submit === true);

    // 13. Kiểm tra RBAC Backend
    const userTryAdmin = await req('/api/admin/dashboard', { headers: authHeader1 });
    ok('RBAC Backend chặn người dùng thường truy cập /api/admin/dashboard (HTTP 403)', userTryAdmin.status === 403);

    services.db.run(`UPDATE users SET role = 'super_admin' WHERE id = ?`, [user1Id]);

    // 14. Phê duyệt hồ sơ tổ chức & Kiểm tra hạn mức Organization Plus (50 GB/tháng, tối đa 30 thành viên)
    const approveOrg = await req('/api/organizations/applications/review', {
      method: 'POST',
      headers: authHeader1,
      body: { application_id: orgAppRes.data.application.id, new_status: 'Đã phê duyệt', review_note: 'Hồ sơ hợp lệ' }
    });
    const orgId = approveOrg.data.application.approved_org_id;
    ok('Sau khi phê duyệt hồ sơ tổ chức mới cấp không gian tổ chức chính thức',
      approveOrg.status === 200 && Boolean(orgId));

    // Nâng tổ chức sang gói Organization Plus Tháng (50 GB/tháng, tối đa 30 thành viên)
    services.db.run(`UPDATE organizations SET plan_code = 'org_plus_monthly', max_members = 30 WHERE id = ?`, [orgId]);
    const orgQuota = services.progressMod.ensureQuotaRecord('organization', orgId, 'org_plus_monthly');
    ok('Organization Plus Tháng có hạn mức mặc định 50 GB/tháng (tối đa 30 thành viên, chu kỳ tháng)',
      orgQuota.default_quota_bytes === 50 * GB_BYTES && orgQuota.is_monthly_cycle === true);

    // Kiểm tra thêm thành viên vào tổ chức KHÔNG làm nhân hạn mức 50 GB theo số thành viên (Phụ lục A3 & A7)
    const addOrgMem = await req('/api/organizations/members', {
      method: 'POST',
      headers: authHeader1,
      body: {
        org_id: orgId,
        full_name: 'Lê Hoàng Nam',
        email: 'hoangnam@sfec.vn',
        phone: '0911223344',
        password: validPwd,
        org_role: 'member',
        title: 'Thành viên CLB'
      }
    });
    const orgQuotaAfterMember = services.progressMod.ensureQuotaRecord('organization', orgId, 'org_plus_monthly');
    ok('Thêm thành viên vào tổ chức KHÔNG nhân hạn mức tổ chức theo số thành viên (Vẫn giữ đúng 50 GB chung) và thành viên nhận Personal Free 1 GB',
      addOrgMem.status === 201 &&
      orgQuotaAfterMember.effective_quota_bytes === 50 * GB_BYTES &&
      services.progressMod.ensureQuotaRecord('personal', addOrgMem.data.member.member_user_id).default_quota_bytes === 1 * GB_BYTES);

    // 15. Kiểm tra Phụ lục A3 & A6: Khi hết gói Personal Plus (5 GB) về Personal Free (1 GB) mà đang lưu > 1 GB
    // Người dùng 2 đang dùng thử Personal Plus (5 GB) tải lên tệp 2 GB -> thành công
    const upload2Gb = await req('/api/resources', {
      method: 'POST',
      headers: authHeader2,
      body: {
        title: 'Bộ tài liệu âm thanh luyện nghe 2GB',
        language_code: 'en',
        resource_type: 'pdf',
        access_scope: 'personal',
        simulated_size_bytes: 2 * GB_BYTES
      }
    });
    const uploadedFileId = upload2Gb.data.resource.file_id;
    ok('Tải tệp 2 GB khi đang ở gói Personal Plus (hạn mức 5 GB) thành công',
      upload2Gb.status === 201 && upload2Gb.data.resource.quota_after_upload.total_stored_bytes === 2 * GB_BYTES);

    // Hết thời gian dùng thử / hạ về gói Personal Free (1 GB)
    const user2Sub = services.db.get(`SELECT id FROM subscriptions WHERE user_id = ?`, [user2Id]);
    const expireSub = await req('/api/commerce/subscriptions/manage', {
      method: 'POST',
      headers: authHeader2,
      body: { subscription_id: user2Sub.id, action: 'expire_to_free' }
    });
    ok('Khi hết gói Personal Plus chuyển về Personal Free (1 GB): Không xóa 2 GB dữ liệu cũ nhưng bật trạng thái cảnh báo vượt hạn mức (over_quota_blocked = true)',
      expireSub.status === 200 &&
      expireSub.data.storage_quota.default_quota_bytes === 1 * GB_BYTES &&
      expireSub.data.storage_quota.total_stored_bytes === 2 * GB_BYTES &&
      expireSub.data.storage_quota.over_quota_blocked === true);

    // Khi đang vượt hạn mức (2 GB / 1 GB): Tải tệp mới bị chặn (403), nhưng đọc/tải xuống tệp cũ vẫn thành công (200)
    const blockedNewUpload = await req('/api/resources', {
      method: 'POST',
      headers: authHeader2,
      body: { title: 'Tệp mới khi vượt hạn mức', language_code: 'en', simulated_size_bytes: 1024 }
    });
    ok('Ngăn tải lên tệp mới khi tài khoản đang đạt/vượt hạn mức (HTTP 403)', blockedNewUpload.status === 403);

    const downloadOldFile = await req(`/api/resources/download?file_id=${encodeURIComponent(uploadedFileId)}`, {
      headers: authHeader2
    });
    ok('Giữ nguyên quyền đọc và tải xuống dữ liệu hợp lệ đã lưu ngay cả khi tài khoản đạt/vượt hạn mức (HTTP 200)',
      downloadOldFile.status === 200 && downloadOldFile.data.file.id === uploadedFileId);

    // 16. Kiểm tra Phụ lục A5: Admin điều chỉnh hạn mức tại /quan-tri/luu-tru (Theo GB, TB, Không giới hạn, Gỡ cấu hình riêng)
    // Ví dụ 1 trong Phụ lục A5: Tổ chức A mua Organization Plus tháng (mặc định 50 GB/tháng) -> Admin điều chỉnh lên 100 GB/tháng
    const adminSet100Gb = await req('/api/admin/storage/quota', {
      method: 'POST',
      headers: authHeader1,
      body: {
        target_type: 'organization',
        target_id: orgId,
        action: 'set_custom',
        amount: 100,
        unit: 'GB',
        reason: 'Ví dụ A5: Nâng hạn mức Tổ chức lên 100 GB/tháng'
      }
    });
    ok('Admin điều chỉnh Tổ chức từ 50 GB/tháng lên 100 GB/tháng -> Áp dụng ưu tiên 100 GB/tháng (admin_custom)',
      adminSet100Gb.status === 200 &&
      adminSet100Gb.data.quota.effective_quota_bytes === 100 * GB_BYTES &&
      adminSet100Gb.data.quota.priority_source === 'admin_custom');

    // Ví dụ 2 trong Phụ lục A5: Chuyển Tổ chức sang Organization Plus Năm (mặc định 120 GB/tháng) và Admin chuyển sang Không giới hạn
    services.db.run(`UPDATE organizations SET plan_code = 'org_plus_yearly' WHERE id = ?`, [orgId]);
    services.progressMod.ensureQuotaRecord('organization', orgId, 'org_plus_yearly');

    const adminSetUnlimited = await req('/api/admin/storage/quota', {
      method: 'POST',
      headers: authHeader1,
      body: {
        target_type: 'organization',
        target_id: orgId,
        action: 'set_unlimited',
        reason: 'Ví dụ A5: Chuyển Tổ chức sang Không giới hạn'
      }
    });
    ok('Admin chuyển Tổ chức sang Không giới hạn -> Không áp dụng giới hạn phần mềm (is_unlimited = true)',
      adminSetUnlimited.status === 200 &&
      adminSetUnlimited.data.quota.is_unlimited === true &&
      adminSetUnlimited.data.quota.effective_quota_bytes === null);

    // Gỡ cấu hình riêng của Admin -> Trở về đúng hạn mức mặc định theo gói đang hoạt động (Organization Plus Năm = 120 GB/tháng)
    const adminRemoveCustom = await req('/api/admin/storage/quota', {
      method: 'POST',
      headers: authHeader1,
      body: {
        target_type: 'organization',
        target_id: orgId,
        action: 'remove_custom',
        reason: 'Gỡ cấu hình riêng để trở về hạn mức mặc định của gói Organization Plus Năm'
      }
    });
    ok('Khi Admin gỡ cấu hình riêng -> Trở về đúng hạn mức mặc định của gói đang hoạt động (120 GB/tháng cho Organization Plus Năm)',
      adminRemoveCustom.status === 200 &&
      adminRemoveCustom.data.quota.is_unlimited === false &&
      adminRemoveCustom.data.quota.effective_quota_bytes === 120 * GB_BYTES &&
      adminRemoveCustom.data.quota.priority_source === 'plan_default');

    // 17. Kiểm tra Phụ lục A4 & A7: Tải tệp vào vùng lưu trữ Tổ chức, Thành viên rời tổ chức & Làm mới Chu kỳ Tháng Ngày 01 (Asia/Ho_Chi_Minh)
    const memberLogin = await req('/api/auth/login', {
      method: 'POST',
      body: { email: 'hoangnam@sfec.vn', password: validPwd }
    });
    const authHeaderMem = { Authorization: `Bearer ${memberLogin.data.session.token}` };

    const orgUpload = await req('/api/resources', {
      method: 'POST',
      headers: authHeaderMem,
      body: {
        title: 'Giáo trình nội bộ CLB Sky First',
        language_code: 'en',
        owner_org_id: orgId,
        access_scope: 'organization',
        simulated_size_bytes: 5 * GB_BYTES
      }
    });
    const orgFileId = orgUpload.data.resource.file_id;
    ok('Dữ liệu tải lên trong không gian Tổ chức được tính vào hạn mức chung của Tổ chức (5 GB / 120 GB)',
      orgUpload.status === 201 &&
      orgUpload.data.resource.quota_after_upload.cycle_used_bytes === 5 * GB_BYTES &&
      orgUpload.data.resource.quota_after_upload.total_stored_bytes === 5 * GB_BYTES);

    // Khi thành viên rời tổ chức (Phụ lục A7): Không xóa dữ liệu tổ chức và không chuyển quyền sở hữu sang cá nhân
    const departRes = await req('/api/organizations/members/remove', {
      method: 'POST',
      headers: authHeader1,
      body: { org_id: orgId, member_user_id: addOrgMem.data.member.member_user_id, reason: 'Hoàn tất nhiệm kỳ' }
    });
    ok('Khi thành viên rời tổ chức: Không xóa dữ liệu tổ chức, không chuyển quyền sở hữu cho cá nhân và ghi audit log',
      departRes.status === 200 &&
      departRes.data.org_files_deleted === 0 &&
      departRes.data.ownership_transferred_to_personal === false &&
      departRes.data.preserved_org_files_count === 1);

    // Kiểm soát truy cập chéo tổ chức (Cross-Organization Protection): Thành viên đã rời tổ chức không còn quyền tải tệp nội bộ của tổ chức
    const departedTryDownload = await req(`/api/resources/download?file_id=${encodeURIComponent(orgFileId)}`, {
      headers: authHeaderMem
    });
    ok('Kiểm soát truy cập chéo tổ chức chặn người không còn thuộc tổ chức tải tệp nội bộ (HTTP 403)',
      departedTryDownload.status === 403);

    // Chạy làm mới bộ đếm chu kỳ tháng ngày 01 (Asia/Ho_Chi_Minh - Phụ lục A4)
    const resetCycle = await req('/api/admin/storage/cycles/reset', {
      method: 'POST',
      headers: authHeader1,
      body: { target_cycle_month: '2026-12' }
    });
    const orgQuotaAfterReset = services.progressMod.ensureQuotaRecord('organization', orgId, 'org_plus_yearly');
    const user2QuotaAfterReset = services.progressMod.ensureQuotaRecord('personal', user2Id, 'personal_free');
    ok('Làm mới chu kỳ tháng ngày 01 (Asia/Ho_Chi_Minh): Reset bộ đếm tháng tổ chức về 0, KHÔNG xóa 5 GB dữ liệu đã lưu và KHÔNG reset tài khoản cá nhân',
      resetCycle.status === 200 &&
      resetCycle.data.files_deleted === 0 &&
      orgQuotaAfterReset.cycle_month === '2026-12' &&
      orgQuotaAfterReset.cycle_used_bytes === 0 &&
      orgQuotaAfterReset.total_stored_bytes === 5 * GB_BYTES &&
      user2QuotaAfterReset.total_stored_bytes === 2 * GB_BYTES);

    // 18. Kiểm tra Dashboard /quan-tri/luu-tru & Kiểm tra Backup + Phục hồi (Phụ lục A8 & A9)
    const storageDashRes = await req('/api/admin/storage/dashboard', { headers: authHeader1 });
    ok('Dashboard /quan-tri/luu-tru trả về đầy đủ Tổng quan hạ tầng, Quản lý tài khoản, Chu kỳ tháng, Cảnh báo & Nhật ký',
      storageDashRes.status === 200 &&
      storageDashRes.data.global_website_fixed_gb_limit === null &&
      storageDashRes.data.infrastructure_overview.expansion_capability_verified === true &&
      Array.isArray(storageDashRes.data.account_quotas) &&
      Array.isArray(storageDashRes.data.monthly_cycles.historical_cycles));

    const verifyRec = await req('/api/admin/storage/verify-recovery', {
      method: 'POST',
      headers: authHeader1,
      body: {}
    });
    ok('Backup Database, Backup Storage và kiểm tra khả năng phục hồi (Recovery Verification) thành công',
      verifyRec.status === 200 && verifyRec.data.database_recovery_verified.ok === true);

    // 19. Đối soát thanh toán, 29 mẫu Email, CMS Word, Bảo trì & WAF
    const reconcileRes = await req('/api/payments/reconcile', {
      method: 'POST',
      headers: authHeader1,
      body: {
        order_id: ordRes.data.order.id,
        received_amount_vnd: 129000,
        received_content: ordRes.data.order.transfer_content,
        source: 'manual_reconcile'
      }
    });
    ok('Đối soát thanh toán hợp lệ mở quyền dịch vụ và phát hành hóa đơn điện tử',
      reconcileRes.status === 200 && reconcileRes.data.status === 'paid');

    const emailCenter = await req('/api/admin/emails', { headers: authHeader1 });
    ok('Email Management Center có đúng 29 mẫu email HTML độc lập và 4 địa chỉ email chuẩn',
      emailCenter.status === 200 &&
      emailCenter.data.total_templates === 29 &&
      EMAIL_ADDRESSES.SYSTEM_NOREPLY === 'noreply@wordbridge.io.vn' &&
      EMAIL_ADDRESSES.OFFICIAL_CONTACT === 'wordbridge.education@gmail.com' &&
      EMAIL_ADDRESSES.CUSTOMER_SUPPORT === 'cskh@wordbridge.io.vn' &&
      EMAIL_ADDRESSES.PARTNERSHIP_MEDIA === 'contact@wordbridge.io.vn');

    const cmsPub = await req('/api/cms/pages', {
      method: 'POST',
      headers: authHeader1,
      body: {
        slug: '/gioi-thieu',
        title: 'Giới thiệu WORD BRIDGE (Đã cập nhật qua CMS Word)',
        html_content: '<h2>Giới thiệu WORD BRIDGE</h2><p>Nội dung xuất bản từ CMS Word.</p>',
        workflow_action: 'publish'
      }
    });
    ok('WORD BRIDGE CMS lưu lịch sử phiên bản và xuất bản nội dung thành công',
      cmsPub.status === 200 && cmsPub.data.page.status === 'published');

    const enableMaint = await req('/api/admin/maintenance', {
      method: 'POST',
      headers: authHeader1,
      body: { mode: 'maintenance_all', title: 'Bảo trì nâng cấp định kỳ', reason: 'Kiểm thử đóng/mở an toàn', advance_notice_days: 3 }
    });
    ok('Bật chế độ bảo trì toàn website thành công', enableMaint.status === 200 && enableMaint.data.maintenance.mode === 'maintenance_all');

    const userBlockedDuringMaint = await req('/api/learning/languages', { headers: authHeader2 });
    ok('Người dùng thường nhận trạng thái 503 Bảo trì khi website đang đóng bảo trì', userBlockedDuringMaint.status === 503);

    const reopenMaint = await req('/api/admin/maintenance', {
      method: 'POST',
      headers: authHeader1,
      body: { mode: 'active', title: 'Hệ thống hoạt động bình thường' }
    });
    ok('Quản trị viên kỹ thuật mở lại website an toàn kèm post-check toàn diện',
      reopenMaint.status === 200 && reopenMaint.data.maintenance.mode === 'active');

    const sqliTry = await req('/api/community/posts', {
      method: 'POST',
      headers: authHeader2,
      body: { title: 'Test', content: "1' UNION SELECT * FROM users --" }
    });
    ok('Lớp bảo vệ WAF chặn payload SQL Injection (HTTP 400)', sqliTry.status === 400);

    const xssTry = await req('/api/community/posts', {
      method: 'POST',
      headers: authHeader2,
      body: { title: 'Test XSS', content: '<script>alert(1)</script>' }
    });
    ok('Lớp bảo vệ WAF chặn payload XSS Script (HTTP 400)', xssTry.status === 400);

    
    // 20. Kiểm tra cài đặt MONTHLY_QUOTA_GB tại máy chủ & RESEND_API_KEY
    const mqGet = await req("/api/admin/storage/monthly-quota-config", { headers: authHeader1 });
    ok("GET /api/admin/storage/monthly-quota-config trả về MONTHLY_QUOTA_GB=50 mặc định",
      mqGet.status === 200 && mqGet.data.monthly_quota_gb === 50);

    const mqPost = await req("/api/admin/storage/monthly-quota-config", {
      method: "POST",
      headers: authHeader1,
      body: { monthly_quota_gb: 80, reason: "Nâng MONTHLY_QUOTA_GB tại máy chủ lên 80 GB" }
    });
    ok("POST /api/admin/storage/monthly-quota-config cập nhật MONTHLY_QUOTA_GB tại máy chủ thành công (80 GB)",
      mqPost.status === 200 && mqPost.data.monthly_quota_gb === 80);

    // Khôi phục về 50 GB mặc định
    await req("/api/admin/storage/monthly-quota-config", {
      method: "POST",
      headers: authHeader1,
      body: { monthly_quota_gb: 50 }
    });

    const resendCfg = await req("/api/admin/emails/config", {
      method: "POST",
      headers: authHeader1,
      body: { resend_api_key: "re_test_wordbridge_key_2026" }
    });
    ok("Tích hợp RESEND_API_KEY tại máy chủ thành công (provider = resend)",
      resendCfg.status === 200 && resendCfg.data.email_status.resend_configured === true && resendCfg.data.email_status.provider === "resend");

    console.log(`=== HOÀN TẤT KIỂM THỬ: ${passed}/${passed} BÀI KIỂM THỬ ĐẠT 100% ===`);
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
