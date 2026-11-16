'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TEST_DIR = path.resolve(process.cwd(), '.tmp_test_suite_' + process.pid);
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = path.join(TEST_DIR, 'test_wordbridge.db');
process.env.DB_PATH = path.join(TEST_DIR, 'test_wordbridge.db');
process.env.STORAGE_PATH = path.join(TEST_DIR, 'r2_storage');
process.env.BACKUP_PATH = path.join(TEST_DIR, 'backups');
process.env.SESSION_SECRET = 'test-secret-key-wordbridge-2026-2027-secure-token-xyz';
process.env.ADMIN_BOOTSTRAP_SECRET = 'test-bootstrap-admin-secret-2026';
process.env.MONTHLY_QUOTA_GB = '999'; // Kiểm tra đảm bảo MONTHLY_QUOTA_GB không ghi đè hạn mức mặc định từng gói

const { createAppServer, services } = require('../src/server');
const workerModule = require('../src/worker');

describe('WORD BRIDGE 2026–2027 — Bộ Kiểm Thử Toàn Diện 10 Phân Hệ & 16 Điểm Sửa Bắt Buộc', () => {
  let server;
  let baseUrl;

  before(async () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    server = createAppServer();
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  async function api(urlPath, { method = 'GET', body = null, token = null, headers = {} } = {}) {
    const reqHeaders = { ...headers };
    if (body && !(body instanceof Buffer)) {
      reqHeaders['content-type'] = 'application/json';
    }
    if (token) {
      reqHeaders['authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers: reqHeaders,
      body: body ? (body instanceof Buffer ? body : JSON.stringify(body)) : undefined
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, headers: res.headers, text, json };
  }

  // ==========================================================================
  // 1. KIỂM THỬ GIAO DIỆN CHÍNH THỨC, HEADER, FOOTER & ẨN ĐƯỜNG DẪN KỸ THUẬT
  // ==========================================================================
  test('1. Giao diện HTML/JS chuẩn hóa Header 1 hàng, Footer 4 cột, không lộ đường dẫn kỹ thuật hay lối vào Quản trị công khai', async () => {
    const res = await api('/');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('Where Languages Bring People Together.'), 'Phải có slogan chính thức');
    assert.ok(res.text.includes('Khám phá &amp; Học tập') || res.text.includes('Khám phá & Học tập'), 'Footer cột 1');
    assert.ok(res.text.includes('Kết nối &amp; Tổ chức') || res.text.includes('Kết nối & Tổ chức'), 'Footer cột 2');
    assert.ok(res.text.includes('Dịch vụ &amp; Chính sách') || res.text.includes('Dịch vụ & Chính sách'), 'Footer cột 3');
    assert.ok(res.text.includes('Liên hệ Chính thức'), 'Footer cột 4');
    assert.ok(res.text.includes('Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như'), 'Thông tin nhóm sáng lập ở Footer');

    // Không lộ (/ho-tro) hay Trung tâm quản trị (/quan-tri) ở Footer/Header
    assert.ok(!res.text.includes('(/ho-tro)'), 'Không được hiển thị chuỗi kỹ thuật (/ho-tro)');
    assert.ok(!res.text.includes('Trung tâm quản trị'), 'Không được đặt liên kết Trung tâm quản trị công khai ở Footer');

    // Kiểm tra các tệp JS frontend không chứa chuỗi lộ kỹ thuật
    const frontendDir = path.resolve(process.cwd(), 'src/frontend/js');
    const jsFiles = fs.readdirSync(frontendDir).filter((f) => f.endsWith('.js'));
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(frontendDir, file), 'utf8');
      assert.ok(!content.includes('(/ho-tro)'), `File ${file} không được chứa (/ho-tro)`);
      assert.ok(!content.includes('Đường dẫn: /khao-thi/'), `File ${file} không được lộ Đường dẫn: /khao-thi/`);
      assert.ok(!content.includes('localStorage.setItem(\'wb_token'), `File ${file} không được lưu session token vào localStorage`);
      assert.ok(!content.includes('localStorage.setItem("wb_token'), `File ${file} không được lưu session token vào localStorage`);
    }

    // Kiểm tra /su-kien đã bị loại bỏ hoàn toàn
    const eventRes = await api('/su-kien');
    assert.equal(eventRes.status, 404);

    // Kiểm tra bộ 16 hình ảnh minh họa sạch trích xuất từ ẢNH.zip (Không chứa laptop AI hay người AI)
    const bannerAssets = [
      'hero-globe-books.webp',
      'promo-community-card.webp',
      'banner-globe-books.webp',
      'banner-community-globe.webp',
      'lang-zh-landmark.webp',
      'lang-en-landmark.webp',
      'lang-ko-landmark.webp',
      'lang-ja-landmark.webp',
      'lang-ru-landmark.webp',
      'header-progress-trophy.webp',
      'header-pricing-crown.webp',
      'header-security-shield.webp',
      'header-org-building.webp',
      'header-resources-books.webp',
      'header-roadmap-flag.webp',
      'header-analytics-chart.webp'
    ];
    for (const assetName of bannerAssets) {
      const assetRes = await api('/assets/banners/' + assetName);
      assert.equal(assetRes.status, 200, 'Phải phục vụ thành công hình ảnh ' + assetName);
      assert.equal(assetRes.headers.get('content-type'), 'image/webp', 'MIME type của ' + assetName + ' phải là image/webp');
    }
  });

  // ==========================================================================
  // 2. KIỂM THỬ TÀI KHOẢN, ĐĂNG KÝ, ĐĂNG NHẬP, OAUTH 2.0, QUÊN MẬT KHẨU & PHIÊN
  // ==========================================================================
  let learner1 = {};
  let learner2 = {};

  test('2. Đăng ký tài khoản cá nhân (7 ngày dùng thử Personal Plus), tách biệt ngôn ngữ giao diện và ngôn ngữ học, OAuth & Khôi phục mật khẩu', async () => {
    const validPassword1 = 'WordBridge@!#2026Strong';
    const reg1 = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'learner1@example.com',
        phone: '0901234567',
        password: validPassword1,
        confirm_password: validPassword1,
        full_name: 'Nguyễn Minh Anh',
        accept_terms: true,
        accept_privacy: true,
        learning_languages: ['en', 'ja'],
        proficiency_level: 'B1',
        learning_goals: 'Giao tiếp công việc và đọc tài liệu'
      }
    });
    assert.equal(reg1.status, 201, `Đăng ký learner1 lỗi: ${reg1.text}`);
    assert.equal(reg1.json.user.plan_code, 'personal_plus_monthly', 'Tài khoản mới được kích hoạt dùng thử 7 ngày Personal Plus');
    assert.equal(reg1.json.user.role, 'user', 'Tài khoản đăng ký thông thường luôn có vai trò user, không tự thành Admin');
    assert.ok(reg1.json.trial.expires_at, 'Phải có thời hạn kết thúc dùng thử 7 ngày');
    learner1 = {
      id: reg1.json.user.id,
      token: reg1.json.session.token
    };

    // Đăng ký người học thứ 2 (email sinh viên .edu.vn)
    const reg2 = await api('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'learner2@hcmus.edu.vn',
        phone: '0912345678',
        password: validPassword1,
        confirm_password: validPassword1,
        full_name: 'Trần Hoàng Nam',
        accept_terms: true,
        accept_privacy: true,
        learning_languages: ['en', 'zh'],
        proficiency_level: 'B1',
        learning_goals: 'Thực hành phản xạ'
      }
    });
    assert.equal(reg2.status, 201, `Đăng ký learner2 lỗi: ${reg2.text}`);
    learner2 = {
      id: reg2.json.user.id,
      token: reg2.json.session.token
    };

    // Cập nhật hồ sơ không làm mất ngôn ngữ đang học
    const patchProfile = await api('/api/profile', {
      method: 'PUT',
      token: learner1.token,
      body: {
        full_name: 'Nguyễn Minh Anh',
        bio: 'Yêu thích ngôn ngữ và giao lưu quốc tế'
      }
    });
    assert.equal(patchProfile.status, 200);
    assert.deepEqual(patchProfile.json.profile.learning_languages, ['en', 'ja'], 'Không làm thay đổi ngôn ngữ đang học của tài khoản');

    // Kiểm tra trạng thái nhà cung cấp OAuth 2.0
    const oauthProviders = await api('/api/auth/oauth/providers');
    assert.equal(oauthProviders.status, 200);
    assert.ok(oauthProviders.json.providers && oauthProviders.json.providers.google, 'Phải trả về thông tin nhà cung cấp Google OAuth');
    assert.equal(oauthProviders.json.providers.google.configured, false, 'Khi chưa cấu hình CLIENT_ID/SECRET thì configured=false');

    // Khi gọi khởi tạo OAuth chưa cấu hình, không được giả lập session đăng nhập và authorization_url = null
    const oauthInit = await api('/api/auth/oauth/authorize?provider=google');
    assert.equal(oauthInit.status, 200);
    assert.equal(oauthInit.json.configured, false, 'Phải báo configured=false khi chưa có khóa OAuth');
    assert.equal(oauthInit.json.authorization_url, null, 'Không được sinh URL giả khi chưa cấu hình Client ID/Secret');
    assert.equal(oauthInit.json.session, undefined, 'Tuyệt đối không được tự tạo phiên đăng nhập giả');

    // Chặn nhà cung cấp không hỗ trợ (ví dụ Zalo)
    const zaloInit = await api('/api/auth/oauth/authorize?provider=zalo');
    assert.equal(zaloInit.status, 400, 'Phải từ chối nhà cung cấp Zalo không nằm trong danh mục');

    // Luồng quên mật khẩu & đặt lại mật khẩu bằng mã OTP
    const forgotRes = await api('/api/auth/password/forgot', {
      method: 'POST',
      body: { email: 'learner1@example.com' }
    });
    assert.equal(forgotRes.status, 200);
    const testOtp = forgotRes.json.otp_verification._test_only_otp;
    assert.ok(testOtp, 'Phải sinh mã OTP khôi phục mật khẩu hợp lệ');

    const newValidPassword = 'NewPassword@!#2027Strong';
    const resetRes = await api('/api/auth/password/reset', {
      method: 'POST',
      body: {
        email: 'learner1@example.com',
        otp_code: testOtp,
        new_password: newValidPassword,
        confirm_password: newValidPassword
      }
    });
    assert.equal(resetRes.status, 200, `Reset password failed: ${resetRes.text}`);

    // Đăng nhập lại bằng mật khẩu mới
    const relogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'learner1@example.com', password: newValidPassword }
    });
    assert.equal(relogin.status, 200);
    learner1.token = relogin.json.session.token;

    // Kiểm tra danh sách phiên đăng nhập
    const sessionsRes = await api('/api/auth/sessions', { token: learner1.token });
    assert.equal(sessionsRes.status, 200);
    assert.ok(sessionsRes.json.sessions.length >= 1);
  });

  // ==========================================================================
  // 3. KIỂM THỬ CỔNG ĐĂNG NHẬP QUẢN TRỊ RIÊNG BIỆT & PHÂN QUYỀN RBAC
  // ==========================================================================
  let adminSession = {};

  test('3. Cổng đăng nhập Quản trị viên tách biệt (/api/admin/auth/*), chặn người dùng thường gọi API Admin & bảo vệ các API Worker', async () => {
    // Người dùng thường không thể truy cập API quản trị
    const userTryAdmin = await api('/api/admin/dashboard', { token: learner1.token });
    assert.equal(userTryAdmin.status, 403);

    // Xóa các admin seed tạm nếu có để kiểm thử trọn vẹn luồng bootstrapFirstAdmin một lần duy nhất
    services.db.run(`DELETE FROM users WHERE role IN ('super_admin', 'system_admin')`);
    services.db.run(`UPDATE admin_security_state SET first_admin_bootstrapped = 0 WHERE id = 'singleton'`);

    const adminEmail = 'superadmin@wordbridge.io.vn';
    const adminPassword = 'AdminStrong@!#2026Password';
    const adminSecurityCode = 'WB-ADMIN-SEC-2026';

    const bootstrapRes = await api('/api/admin/auth/bootstrap', {
      method: 'POST',
      body: {
        bootstrap_secret: 'test-bootstrap-admin-secret-2026',
        email: adminEmail,
        phone: '0988504210',
        password: adminPassword,
        security_code: adminSecurityCode,
        full_name: 'Bùi Tấn Lộc (Super Admin)'
      }
    });
    assert.equal(bootstrapRes.status, 201, `Bootstrap Admin failed: ${bootstrapRes.text}`);

    // Khi hệ thống đã có Quản trị viên, gọi bootstrap lần 2 phải bị từ chối (403)
    const bootstrapAgain = await api('/api/admin/auth/bootstrap', {
      method: 'POST',
      body: {
        bootstrap_secret: 'test-bootstrap-admin-secret-2026',
        email: 'hacker@wordbridge.io.vn',
        password: adminPassword,
        security_code: adminSecurityCode,
        full_name: 'Hacker'
      }
    });
    assert.equal(bootstrapAgain.status, 403, 'Bootstrap lần 2 phải bị chặn khi đã có Super Admin');

    // Người dùng thường không thể đăng nhập qua cổng Quản trị riêng (/api/admin/auth/login)
    const learnerTryAdminLogin = await api('/api/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'learner1@example.com',
        password: 'NewPassword@!#2027Strong',
        security_code: adminSecurityCode
      }
    });
    assert.equal(learnerTryAdminLogin.status, 403, 'Người dùng thường phải bị từ chối tại cổng đăng nhập Admin');

    // Đăng nhập cổng Quản trị riêng thành công
    const adminLogin = await api('/api/admin/auth/login', {
      method: 'POST',
      body: {
        email: adminEmail,
        password: adminPassword,
        security_code: adminSecurityCode
      }
    });
    assert.equal(adminLogin.status, 200, `Admin login failed: ${adminLogin.text}`);
    assert.ok(adminLogin.json.admin_session.token.startsWith('wbadm_'), 'Token phiên quản trị phải có tiền tố wbadm_ tách biệt');
    adminSession = {
      token: adminLogin.json.admin_session.token
    };

    // Kiểm tra các API nhạy cảm bắt buộc xác thực & phân quyền
    const unauthQuota = await api('/api/admin/storage/monthly-quota-config');
    assert.ok([401, 403].includes(unauthQuota.status), 'API cấu hình quota không được mở tự do');

    const userTryQuota = await api('/api/admin/storage/monthly-quota-config', { token: learner1.token });
    assert.equal(userTryQuota.status, 403, 'Người dùng thường không được phép đọc/sửa cấu hình quota hệ thống');

    const adminQuota = await api('/api/admin/storage/monthly-quota-config', { token: adminSession.token });
    assert.equal(adminQuota.status, 200);
    assert.equal(adminQuota.json.override_plan_quotas, false, 'override_plan_quotas bắt buộc là false');
  });

  // ==========================================================================
  // 4. KIỂM THỬ TRỤ CỘT LEARN & GROW (5 NGÔN NGỮ, BÀI TẬP, SRS, LỘ TRÌNH, TIẾN ĐỘ)
  // ==========================================================================
  test('4. Học tập 05 ngôn ngữ, Kiểm tra trình độ, Lộ trình cá nhân hóa, Flashcard SRS, Lưu học liệu & Theo dõi tiến độ', async () => {
    const langs = await api('/api/learning/languages');
    assert.equal(langs.status, 200);
    assert.equal(langs.json.languages.length, 5, 'Đúng 05 ngôn ngữ mục tiêu: zh, en, ko, ja, ru');

    // Làm bài kiểm tra trình độ đầu vào (Placement Assessment)
    const placementQuestions = await api('/api/learning/placement?language_code=en');
    assert.equal(placementQuestions.status, 200);
    const qList = placementQuestions.json.questions || [];
    const placementSubmissions = {};
    for (const q of qList) {
      placementSubmissions[q.exercise_id] = 'A';
    }

    const placement = await api('/api/learning/placement', {
      method: 'POST',
      token: learner1.token,
      body: {
        language_code: 'en',
        daily_minutes_target: 30,
        target_goal: 'Giao tiếp thực tế và đọc hiểu tài liệu',
        submissions: placementSubmissions
      }
    });
    assert.equal(placement.status, 200, `Placement failed: ${placement.text}`);
    assert.ok(placement.json.assessment_id, 'Phải trả về mã kết quả đánh giá trình độ');
    assert.ok(placement.json.estimated_level, 'Phải trả về trình độ ước lượng');
    assert.ok(placement.json.roadmap, 'Tự động sinh lộ trình tự thực hành theo trình độ');

    // Lấy danh sách bài tập tiếng Anh và nộp bài thực hành
    const exercises = await api('/api/learning/exercises?language_code=en');
    assert.equal(exercises.status, 200);
    assert.ok(exercises.json.exercises.length > 0);
    const ex = exercises.json.exercises[0];

    const submitEx = await api('/api/learning/attempts', {
      method: 'POST',
      token: learner1.token,
      body: {
        exercise_id: ex.id,
        submission: 'Hello',
        duration_seconds: 95
      }
    });
    assert.equal(submitEx.status, 200, `Submit attempt failed: ${submitEx.text}`);
    assert.ok(submitEx.json.result);

    // Lưu bài tập yêu thích
    const saveItem = await api('/api/learning/saved-items', {
      method: 'POST',
      token: learner1.token,
      body: {
        item_type: 'favorite_exercise',
        reference_id: ex.id,
        language_code: 'en',
        content: { title: ex.title },
        note: 'Ôn lại cấu trúc câu quan trọng'
      }
    });
    assert.equal(saveItem.status, 201);

    // Kiểm tra tiến độ học tập (GROW)
    const progress = await api('/api/progress', { token: learner1.token });
    assert.equal(progress.status, 200);
    assert.ok(progress.json.dashboard);
  });

  // ==========================================================================
  // 5. KIỂM THỬ TRỤ CỘT CONNECT & COMMUNITY (ĐỒNG THUẬN 2 CHIỀU, LƯU, CHẶN, BẢNG TIN)
  // ==========================================================================
  test('5. Kết nối bạn học đồng thuận hai chiều, nhắn tin, lưu bạn học, chặn người dùng & tương tác Bảng tin cộng đồng', async () => {
    // Gửi lời mời kết nối từ learner1 -> learner2
    const reqConn = await api('/api/friends/request', {
      method: 'POST',
      token: learner1.token,
      body: {
        addressee_id: learner2.id,
        practice_language: 'en',
        intro_message: 'Mình muốn luyện giao tiếp tiếng Anh B1 cùng bạn!'
      }
    });
    assert.equal(reqConn.status, 201, `Friend request failed: ${reqConn.text}`);
    const friendshipId = reqConn.json.friendship.id;

    // learner2 chấp nhận lời mời
    const acceptConn = await api('/api/friends/respond', {
      method: 'POST',
      token: learner2.token,
      body: { friendship_id: friendshipId, action: 'accept' }
    });
    assert.equal(acceptConn.status, 200, `Friend accept failed: ${acceptConn.text}`);

    // Lưu bạn học yêu thích
    const favPartner = await api('/api/connections/favorite', {
      method: 'POST',
      token: learner1.token,
      body: { partner_user_id: learner2.id, note: 'Bạn học tiếng Anh ăn ý' }
    });
    assert.equal(favPartner.status, 200);

    // Đăng bài viết cộng đồng, thích và lưu bài viết
    const createPost = await api('/api/community/posts', {
      method: 'POST',
      token: learner1.token,
      body: {
        title: 'Kinh nghiệm luyện phát âm tiếng Anh qua hội thoại ngắn',
        content: 'Mỗi ngày dành 15 phút đọc to và ghi âm đối chiếu giúp cải thiện ngữ điệu rõ rệt.',
        language_code: 'en',
        topic: 'pronunciation',
        post_type: 'sharing'
      }
    });
    assert.equal(createPost.status, 201, `Create post failed: ${createPost.text}`);
    const postId = createPost.json.post.id;

    const likePost = await api('/api/community/posts/like', {
      method: 'POST',
      token: learner2.token,
      body: { post_id: postId }
    });
    assert.equal(likePost.status, 200);
    assert.equal(likePost.json.liked, true);

    const bookmarkPost = await api('/api/community/posts/bookmark', {
      method: 'POST',
      token: learner2.token,
      body: { post_id: postId }
    });
    assert.equal(bookmarkPost.status, 200);
    assert.equal(bookmarkPost.json.bookmarked, true);
  });

  // ==========================================================================
  // 6. KIỂM THỬ TỔ CHỨC, 6 VAI TRÒ, CHẶN TRUY CẬP TRÁI PHÉP & CÁCH LY DỮ LIỆU
  // ==========================================================================
  let org1 = {};

  test('6. Đăng ký Tổ chức, duyệt Tổ chức, phân quyền 6 vai trò và chặn người dùng không thuộc tổ chức truy cập /khong-gian-cua-toi & /to-chuc', async () => {
    // Khi learner2 chưa thuộc tổ chức nào, truy cập quản lý tổ chức (/api/organizations/manage) phải bị chặn (403)
    const noOrgManage = await api('/api/organizations/manage', { token: learner2.token });
    assert.equal(noOrgManage.status, 403, 'Người dùng chưa có quyền quản trị tổ chức phải bị chặn ngay');

    // Lấy tỉnh và xã hợp lệ từ catalog hành chính
    const catalogRes = await api('/api/organizations/catalog');
    assert.equal(catalogRes.status, 200);
    const hcm = catalogRes.json.catalog.provinces.find((p) => p.code === '02') || catalogRes.json.catalog.provinces[0];
    const validCommune = hcm.communes[0];
    const validActivityField = catalogRes.json.catalog.approved_activity_fields[0];

    // learner1 nộp hồ sơ đăng ký thành lập tổ chức mới (Biểu mẫu Loại 1 - 3 phần)
    const appRes = await api('/api/organizations/applications', {
      method: 'POST',
      token: learner1.token,
      body: {
        form_type: 1,
        section_i: {
          unit_category: 'Câu lạc bộ',
          name: 'Câu lạc bộ Ngoại ngữ Đa Quốc Gia Sài Gòn',
          short_name: 'CLB-SG-POLYGLOT',
          logo_url: '/assets/logo-light.svg',
          field_of_activity: validActivityField,
          founded_date: '2026-01-15',
          email: 'clbsaigon@wordbridge.io.vn',
          phone: '0901234567',
          province_code: hcm.code,
          commune_name: validCommune,
          address_detail: 'Số 10 Đường Nguyễn Huệ',
          social_links: [{ platform: 'Facebook', url: 'https://facebook.com/clbsaigonpolyglot' }],
          introduction: 'Cộng đồng rèn luyện phản xạ giao tiếp tiếng Anh, Nhật, Trung hằng tuần.'
        },
        section_ii: {
          full_name: 'Nguyễn Minh Anh',
          birth_date: '1998-05-20',
          title: 'Chủ nhiệm Câu lạc bộ',
          email: 'learner1@example.com',
          phone: '0901234567',
          province_code: hcm.code,
          commune_name: validCommune,
          address_detail: 'Số 10 Đường Nguyễn Huệ'
        },
        section_iii: {
          signature_method: 'direct_draw',
          signature_data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          confirmed_accurate: true,
          accepted_terms: true
        }
      }
    });
    assert.equal(appRes.status, 201, `Submit org application failed: ${appRes.text}`);
    const applicationId = appRes.json.application.id;

    // Quản trị viên phê duyệt hồ sơ tổ chức (kích hoạt tổ chức & dùng thử 14 ngày tối đa 10 thành viên)
    const approveOrg = await api('/api/organizations/applications/review', {
      method: 'POST',
      token: adminSession.token,
      body: {
        application_id: applicationId,
        new_status: 'Đã kích hoạt',
        review_note: 'Hồ sơ hợp lệ, kích hoạt dùng thử 14 ngày.'
      }
    });
    assert.equal(approveOrg.status, 200, `Review org application failed: ${approveOrg.text}`);
    const createdOrgId = approveOrg.json.application.approved_org_id;
    org1 = services.db.get(`SELECT * FROM organizations WHERE id = ?`, [createdOrgId]);
    assert.ok(org1?.id, 'Tổ chức mới phải được khởi tạo sau khi duyệt hồ sơ');
    assert.equal(org1.plan_code, 'org_trial');
    assert.equal(org1.max_members, 10);

    // learner2 gửi yêu cầu xin gia nhập tổ chức org1
    const joinReq = await api('/api/organizations/join-request', {
      method: 'POST',
      token: learner2.token,
      body: {
        org_id: org1.id,
        message: 'Em muốn tham gia luyện nói tiếng Anh cùng CLB ạ.'
      }
    });
    assert.equal(joinReq.status, 201, `Join request failed: ${joinReq.text}`);

    // Chủ tổ chức (learner1) duyệt yêu cầu gia nhập với vai trò member (Thành viên)
    const approveJoin = await api('/api/organizations/join-requests/review', {
      method: 'POST',
      token: learner1.token,
      body: {
        org_id: org1.id,
        request_id: joinReq.json.join_request.id,
        decision: 'approved'
      }
    });
    assert.equal(approveJoin.status, 200, `Review join request failed: ${approveJoin.text}`);

    // Thành viên thường (member) xem được /api/organizations/my-space nhưng bị chặn /api/organizations/manage
    const memberSpace = await api('/api/organizations/my-space', { token: learner2.token });
    assert.equal(memberSpace.status, 200);
    assert.ok(memberSpace.json.my_space.organizations.length >= 1, 'Thành viên phải thấy tổ chức của mình tại Không gian của tôi');

    const memberTryManage = await api(`/api/organizations/manage?org_id=${org1.id}`, { token: learner2.token });
    assert.equal(memberTryManage.status, 403, 'Thành viên thường (member) phải bị chặn truy cập khu vực quản lý tổ chức (/to-chuc)');

    // Chủ tổ chức (learner1) truy cập được khu vực quản lý tổ chức
    const ownerManage = await api(`/api/organizations/manage?org_id=${org1.id}`, { token: learner1.token });
    assert.equal(ownerManage.status, 200);
  });

  // ==========================================================================
  // 7. KIỂM THỬ THƯƠNG MẠI, GÓI DỊCH VỤ, QUOTA & ĐỐI SOÁT THANH TOÁN / HOÀN TIỀN
  // ==========================================================================
  test('7. Mua gói Tổ chức kích hoạt đúng tổ chức, hoàn tiền gói Tổ chức không làm mất gói Cá nhân của người mua & bảo vệ hạn mức lưu trữ', async () => {
    // 1. Kiểm tra bảng giá và hạn mức mặc định không bị MONTHLY_QUOTA_GB=999 ghi đè
    const catalogRes = await api('/api/commerce/catalog');
    assert.equal(catalogRes.status, 200);
    const plans = catalogRes.json.plans || [];
    const pFree = plans.find((p) => p.code === 'personal_free');
    const pPlusM = plans.find((p) => p.code === 'personal_plus_monthly');
    const oPlusM = plans.find((p) => p.code === 'org_plus_monthly');
    const oPlusY = plans.find((p) => p.code === 'org_plus_yearly');

    assert.equal(pFree.default_storage_gb, 1, 'Gói Miễn Phí phải giữ đúng 1 GB');
    assert.equal(pPlusM.default_storage_gb, 5, 'Gói Plus Tháng phải giữ đúng 5 GB');
    assert.equal(oPlusM.default_storage_gb, 50, 'Gói Tổ Chức Tháng phải giữ đúng 50 GB');
    assert.equal(oPlusY.default_storage_gb, 120, 'Gói Tổ Chức Năm phải giữ đúng 120 GB');

    // 2. Đặt mua và đối soát gói Cá nhân Plus Năm cho learner1
    const orderPersonal = await api('/api/payments/orders', {
      method: 'POST',
      token: learner1.token,
      body: { plan_code: 'personal_plus_yearly' }
    });
    assert.equal(orderPersonal.status, 201, `Create personal order failed: ${orderPersonal.text}`);

    const reconcilePersonal = await api('/api/payments/reconcile', {
      method: 'POST',
      token: adminSession.token,
      body: {
        order_id: orderPersonal.json.order.id,
        received_amount_vnd: orderPersonal.json.order.final_amount_vnd,
        received_content: orderPersonal.json.order.transfer_content
      }
    });
    assert.equal(reconcilePersonal.status, 200, `Reconcile personal failed: ${reconcilePersonal.text}`);

    const userAfterPersonal = services.db.get(`SELECT plan_code FROM users WHERE id = ?`, [learner1.id]);
    assert.equal(userAfterPersonal.plan_code, 'personal_plus_yearly');

    // 3. learner1 đặt mua gói Tổ Chức Plus – Năm (org_plus_yearly) cho tổ chức org1 (kèm ưu đãi phi lợi nhuận 30%)
    const orderOrg = await api('/api/payments/orders', {
      method: 'POST',
      token: learner1.token,
      body: {
        plan_code: 'org_plus_yearly',
        org_id: org1.id,
        nonprofit_approved: true
      }
    });
    assert.equal(orderOrg.status, 201, `Create org order failed: ${orderOrg.text}`);
    assert.equal(orderOrg.json.order.org_id, org1.id);
    assert.equal(orderOrg.json.order.final_amount_vnd, 2450000, 'Tổ chức phi lợi nhuận giảm 30% từ 3.500.000đ còn 2.450.000đ');

    // Đối soát thanh toán đơn hàng tổ chức
    const reconcileOrg = await api('/api/payments/reconcile', {
      method: 'POST',
      token: adminSession.token,
      body: {
        order_id: orderOrg.json.order.id,
        received_amount_vnd: orderOrg.json.order.final_amount_vnd,
        received_content: orderOrg.json.order.transfer_content
      }
    });
    assert.equal(reconcileOrg.status, 200, `Reconcile org failed: ${reconcileOrg.text}`);

    // Kiểm tra: Tổ chức org1 được nâng lên org_plus_yearly (tối đa 30 thành viên), trong khi gói cá nhân của learner1 vẫn là personal_plus_yearly
    const orgAfterPaid = services.db.get(`SELECT plan_code, max_members FROM organizations WHERE id = ?`, [org1.id]);
    assert.equal(orgAfterPaid.plan_code, 'org_plus_yearly', 'Gói của tổ chức phải được nâng lên org_plus_yearly');
    assert.equal(orgAfterPaid.max_members, 30, 'Số thành viên tối đa của tổ chức phải tăng lên 30');

    const userAfterOrgPaid = services.db.get(`SELECT plan_code FROM users WHERE id = ?`, [learner1.id]);
    assert.equal(userAfterOrgPaid.plan_code, 'personal_plus_yearly', 'Mua gói tổ chức không được ghi đè gói cá nhân của người mua');

    // 4. Hoàn tiền đơn hàng gói Tổ chức -> Chỉ hạ gói của Tổ chức, tuyệt đối KHÔNG reset gói cá nhân của learner1
    const refundOrg = await api('/api/payments/refund', {
      method: 'POST',
      token: adminSession.token,
      body: {
        order_id: orderOrg.json.order.id,
        reason: 'Hoàn tiền theo yêu cầu đối soát tổ chức'
      }
    });
    assert.equal(refundOrg.status, 200, `Refund org failed: ${refundOrg.text}`);

    const orgAfterRefund = services.db.get(`SELECT plan_code FROM organizations WHERE id = ?`, [org1.id]);
    assert.equal(orgAfterRefund.plan_code, 'org_trial', 'Tổ chức trở về gói cơ bản sau khi hoàn tiền');

    const userAfterOrgRefund = services.db.get(`SELECT plan_code FROM users WHERE id = ?`, [learner1.id]);
    assert.equal(
      userAfterOrgRefund.plan_code,
      'personal_plus_yearly',
      'Hoàn tiền gói tổ chức tuyệt đối không được reset gói cá nhân của người mua về personal_free'
    );

    // 5. Chương trình Hỗ trợ Sinh viên (.edu.vn) 03 tháng một lần duy nhất, không yêu cầu ảnh thẻ SV
    const studentApp = await api('/api/commerce/support-programs/apply', {
      method: 'POST',
      token: learner2.token,
      body: {
        program_type: 'student_plus',
        student_edu_email: 'learner2@hcmus.edu.vn',
        reason: 'Sinh viên đăng ký hỗ trợ học ngoại ngữ 03 tháng qua email trường.'
      }
    });
    assert.equal(studentApp.status, 201, `Student support apply failed: ${studentApp.text}`);
    assert.equal(studentApp.json.application.status, 'approved');
  });

  // ==========================================================================
  // 8. KIỂM THỬ HỆ THỐNG KHẢO THÍ ĐỘC LẬP, CHỐNG NỘP TRÙNG & PHÚC KHẢO
  // ==========================================================================
  test('8. Hệ thống Khảo Thí độc lập (/api/exams), đăng ký, vào phòng thi, nộp bài, chống nộp trùng và gửi yêu cầu phúc khảo', async () => {
    const examsRes = await api('/api/exams');
    assert.equal(examsRes.status, 200);
    assert.ok(examsRes.json.exams.length > 0);
    const exam = examsRes.json.exams[0];

    // Đăng ký dự thi
    const regExam = await api('/api/exams/register', {
      method: 'POST',
      token: learner1.token,
      body: { exam_id: exam.id, device_checked: true, camera_consented: true }
    });
    assert.equal(regExam.status, 201, `Register exam failed: ${regExam.text}`);

    // Vào phòng thi
    const enterRes = await api('/api/exams/enter-room', {
      method: 'POST',
      token: learner1.token,
      body: { exam_id: exam.id, device_checked: true, camera_consented: true }
    });
    assert.equal(enterRes.status, 200, `Enter exam room failed: ${enterRes.text}`);
    const sessionId = enterRes.json.session.id;

    // Không câu hỏi nào trong phòng thi được lộ correct_answer_json
    for (const q of enterRes.json.questions) {
      assert.equal(q.correct_answer_json, undefined, 'Đề thi gửi xuống trình duyệt không được lộ đáp án đúng');
    }

    // Nộp bài lần 1 thành công
    const submit1 = await api('/api/exams/submit', {
      method: 'POST',
      token: learner1.token,
      body: {
        session_id: sessionId,
        answers: { q1: 'A', q2: 'B' }
      }
    });
    assert.equal(submit1.status, 200, `Submit exam failed: ${submit1.text}`);
    assert.equal(submit1.json.locked_after_submit, true);

    // Cố tình nộp trùng cùng session_id lần 2 -> Phải báo already_submitted = true và không chấm lại
    const submitDuplicate = await api('/api/exams/submit', {
      method: 'POST',
      token: learner1.token,
      body: {
        session_id: sessionId,
        answers: { q1: 'C', q2: 'D' }
      }
    });
    assert.equal(submitDuplicate.status, 200);
    assert.equal(submitDuplicate.json.already_submitted, true, 'Phải chặn chấm lại bài khảo thí nộp trùng');

    // Gửi yêu cầu phúc khảo kết quả bài thi
    const appealRes = await api('/api/exams/appeals', {
      method: 'POST',
      token: learner1.token,
      body: {
        session_id: sessionId,
        reason: 'Đề nghị kiểm tra lại câu hỏi đọc hiểu số 2.',
        explanation_text: 'Phương án B phù hợp với ngữ cảnh đoạn văn thứ nhất.'
      }
    });
    assert.equal(appealRes.status, 201, `Appeal exam failed: ${appealRes.text}`);
  });

  // ==========================================================================
  // 9. KIỂM THỬ EMAIL RESEND: KHÔNG ĐÁNH DẤU ĐÃ GỬI KHI CHƯA CÓ XÁC NHẬN PROVIDER
  // ==========================================================================
  test('9. Hàng đợi Email không tự đánh dấu Đã gửi (sent) khi chưa nhận phản hồi thành công từ Resend API', async () => {
    const logsRes = await api('/api/admin/emails', { token: adminSession.token });
    assert.equal(logsRes.status, 200);
    const queue = logsRes.json.recent_queue || logsRes.json.queue || [];
    assert.ok(queue.length > 0, 'Phải có bản ghi trong hàng đợi email');

    // Khi chưa cấu hình RESEND_API_KEY thật, không có email nào được phép mang trạng thái 'sent' giả tạo không có provider_id
    const fakeSent = queue.filter((e) => e.status === 'sent' && !e.provider_id && !e.provider_message_id);
    assert.equal(fakeSent.length, 0, 'Tuyệt đối không có email nào mang trạng thái sent khi chưa có provider_id thực tế từ Resend');
  });

  // ==========================================================================
  // 10. KIỂM THỬ TÌM KIẾM TOÀN NỀN TẢNG (10 NHÓM NỘI DUNG + 5 BỘ LỌC) & ĐỒNG NHẤT WORKER
  // ==========================================================================
  test('10. Tìm kiếm toàn nền tảng (/api/search) với 10 nhóm nội dung, 5 bộ lọc và đồng nhất đường chạy src/worker.js', async () => {
    const searchRes = await api('/api/search?q=tiếng&language_code=en');
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.json.results, 'Phải trả về kết quả phân nhóm theo 10 nhóm nội dung');
    const groupKeys = Object.keys(searchRes.json.results);
    assert.equal(groupKeys.length, 10, `Phải hỗ trợ đầy đủ 10 nhóm nội dung tìm kiếm (hiện có: ${groupKeys.join(', ')})`);

    // Kiểm tra thực thi trực tiếp qua src/worker.js (Cloudflare Worker Entrypoint)
    const workerReq = new Request('https://wordbridge.io.vn/api/system/bootstrap', { method: 'GET' });
    const workerRes = await workerModule.fetch(workerReq, {});
    assert.equal(workerRes.status, 200);
    const workerJson = await workerRes.json();
    assert.equal(workerJson.ok, true);
    assert.equal(workerJson.brand.SLOGAN, 'Where Languages Bring People Together.');

    // Kiểm tra Worker chặn truy cập trái phép vào /api/admin/storage/monthly-quota-config và /api/r2/upload
    const workerUnauthAdmin = new Request('https://wordbridge.io.vn/api/admin/storage/monthly-quota-config', {
      method: 'GET'
    });
    const workerAdminRes = await workerModule.fetch(workerUnauthAdmin, {});
    assert.ok([401, 403].includes(workerAdminRes.status), 'Cloudflare Worker phải chặn truy cập trái phép vào API cấu hình quota');

    const workerUnauthR2 = new Request('https://wordbridge.io.vn/api/r2/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: 'test.txt', content: 'hello' })
    });
    const workerR2Res = await workerModule.fetch(workerUnauthR2, {});
    assert.ok([401, 403].includes(workerR2Res.status), 'Cloudflare Worker phải chặn tải tệp R2 không xác thực');
  });
});
