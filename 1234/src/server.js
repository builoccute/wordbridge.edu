'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { BRAND, EMAIL_ADDRESSES, OFFICIAL_ROUTES, RBAC_ROLES } = require('./config/constants');
const { PORT, getIntegrationStatus } = require('./config/env');
const { db } = require('./adapters/database.adapter');
const { storage } = require('./adapters/storage.adapter');
const { EmailAdapter } = require('./adapters/email.adapter');
const { PaymentAdapter } = require('./adapters/payment.adapter');
const { realtimeHub } = require('./adapters/realtime.adapter');

const {
  checkRateLimit,
  inspectPayloadWaf,
  generateCsrfToken,
  applySecurityHeaders
} = require('./security/defense.middleware');
const { AuthService } = require('./security/auth.service');
const { requireAuth, requirePermission } = require('./security/rbac.middleware');

const { UsersModule } = require('./modules/users.module');
const { LearningModule } = require('./modules/learning.module');
const { ProgressAndResourcesModule } = require('./modules/progress.module');
const { ConnectionsAndChatModule } = require('./modules/connections.module');
const { CommunityModule } = require('./modules/community.module');
const { OrganizationsModule } = require('./modules/organizations.module');
const { CommerceModule } = require('./modules/commerce.module');
const { PaymentModule } = require('./modules/payment.module');
const { ExamModule } = require('./modules/exam.module');
const { CmsModule } = require('./modules/cms.module');
const { AdminAndOperationsModule } = require('./modules/admin.module');

// Khởi tạo Database & Seed nền tảng nếu chưa khởi tạo
function ensureBootstrapped() {
  if (!db.initialized) {
    db.migrateAndInitialize();
    const seedSqlPath = path.resolve(process.cwd(), 'database/seeds/01_reference_data.sql');
    if (fs.existsSync(seedSqlPath)) {
      db.execScript(fs.readFileSync(seedSqlPath, 'utf8'));
    }
  }
}

ensureBootstrapped();

const emailAdapter = new EmailAdapter(db);
const paymentAdapter = new PaymentAdapter(db);
const authService = new AuthService(db, emailAdapter);

const usersMod = new UsersModule(db, authService, emailAdapter);
const learningMod = new LearningModule(db);
const progressMod = new ProgressAndResourcesModule(db, storage);
const connectionsMod = new ConnectionsAndChatModule(db, realtimeHub);
const communityMod = new CommunityModule(db);
const orgsMod = new OrganizationsModule(db, authService, emailAdapter);
const commerceMod = new CommerceModule(db, emailAdapter);
const paymentMod = new PaymentModule(db, paymentAdapter, emailAdapter);
const examMod = new ExamModule(db);
const cmsMod = new CmsModule(db);
const adminMod = new AdminAndOperationsModule(db, emailAdapter);

function sendJson(res, statusCode, payload) {
  applySecurityHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseCookies(cookieHeader = '') {
  const out = {};
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return out;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 16 * 1024 * 1024) {
        reject(new Error('Dữ liệu gửi lên vượt quá giới hạn cho phép.'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({ raw: '', json: {} });
      try {
        resolve({ raw, json: JSON.parse(raw) });
      } catch (_) {
        reject(new Error('Định dạng JSON đầu vào không hợp lệ.'));
      }
    });
    req.on('error', reject);
  });
}

function extractAuthContext(req) {
  const authHeader = req.headers['authorization'] || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req.headers['cookie']);
    token = cookies.wb_token || '';
  }
  return authService.authenticateToken(token);
}

function renderMaintenanceHtml(maint) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thông báo Bảo trì Hệ thống – WORD BRIDGE</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <style>
    body { margin:0; font-family:'Be Vietnam Pro','Segoe UI',sans-serif; background:#0F3D3E; color:#FFFFFF; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
    .card { max-width:620px; width:100%; background:#FFFFFF; color:#182C2D; border-radius:18px; padding:36px; box-shadow:0 16px 40px rgba(0,0,0,0.28); border-top:6px solid #C92F1C; }
    .badge { display:inline-block; background:#FDECEC; color:#C92F1C; padding:6px 14px; border-radius:999px; font-weight:700; font-size:13px; margin-bottom:14px; }
    h1 { color:#146466; margin:0 0 12px 0; font-size:24px; }
    p { line-height:1.65; color:#2C4243; margin:0 0 14px 0; }
    .meta { background:#F4F9F9; border-left:4px solid #146466; padding:14px 16px; border-radius:8px; font-size:14px; margin:18px 0; }
    .support { font-size:13px; color:#526B6C; border-top:1px solid #E2ECEC; padding-top:14px; margin-top:20px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="/assets/logo-light.svg" alt="WORD BRIDGE" style="height:52px;margin-bottom:16px;" />
    <div><span class="badge">THÔNG BÁO BẢO TRÌ HỆ THỐNG</span></div>
    <h1>${maint.title || 'Hệ thống WORD BRIDGE đang bảo trì'}</h1>
    <p>${maint.notice_content || 'Chúng tôi đang thực hiện bảo trì nâng cấp để đảm bảo trải nghiệm tốt nhất.'}</p>
    <div class="meta">
      <div><strong>Lý do bảo trì:</strong> ${maint.reason || 'Bảo trì định kỳ'}</div>
      <div><strong>Thời gian dự kiến mở lại:</strong> ${maint.scheduled_end || 'Đang cập nhật'}</div>
      <div><strong>Đơn vị phụ trách:</strong> ${maint.responsible_person || 'Ban Quản trị Kỹ thuật WORD BRIDGE'}</div>
    </div>
    <div class="support">
      Hỗ trợ khách hàng: <strong>cskh@wordbridge.io.vn</strong> | Liên hệ chính thức: <strong>wordbridge.education@gmail.com</strong>
    </div>
  </div>
</body>
</html>`;
}

async function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    // PHẦN 03.4: Bỏ hoàn toàn trang Sự kiện (/su-kien)
    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/') || pathname === '/api/events' || pathname.startsWith('/api/events/')) {
      return sendJson(res, 404, {
        ok: false,
        error: 'Mục Sự kiện đã được loại bỏ hoàn toàn khỏi kiến trúc WORD BRIDGE. Các thử thách và lịch sinh hoạt nội bộ được quản lý trực tiếp bên trong không gian Nhóm (/cong-dong/nhom) và Tổ chức (/to-chuc).'
      });
    }

    // Kiểm tra Rate Limiting
    const rateCheck = checkRateLimit(ip, pathname);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return sendJson(res, 429, {
        ok: false,
        error: `Quá giới hạn tần suất truy cập (${rateCheck.bucket}). Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`
      });
    }

    // Phục vụ tệp tĩnh Frontend (/assets, /css, /js)
    const frontendRoot = path.resolve(process.cwd(), 'src/frontend');
    if (pathname.startsWith('/assets/') || pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
      const rel = pathname.slice(1);
      if (rel.includes('..')) {
        return sendJson(res, 400, { ok: false, error: 'Đường dẫn không hợp lệ.' });
      }
      const filePath = path.join(frontendRoot, rel);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
          '.svg': 'image/svg+xml; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.html': 'text/html; charset=utf-8',
          '.json': 'application/json; charset=utf-8'
        };
        applySecurityHeaders(res);
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        return res.end(fs.readFileSync(filePath));
      }
      return sendJson(res, 404, { ok: false, error: 'Không tìm thấy tài nguyên tĩnh.' });
    }

    const authCtx = extractAuthContext(req);
    const currentUser = authCtx ? authCtx.user : null;
    const currentSession = authCtx ? authCtx.session : null;

    // Kiểm tra trạng thái Bảo trì Website (PHẦN 26)
    const maint = adminMod.getMaintenanceState();
    const isTechAdmin = currentUser && ['super_admin', 'system_admin'].includes(currentUser.role);
    const isMaintBypassRoute =
      pathname.startsWith('/quan-tri') ||
      pathname.startsWith('/dang-nhap') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/admin') ||
      pathname === '/api/system/bootstrap';

    if (!isTechAdmin && !isMaintBypassRoute) {
      if (maint.mode === 'maintenance_all' || maint.mode === 'suspended' || maint.mode === 'emergency') {
        if (pathname.startsWith('/api/')) {
          return sendJson(res, 503, {
            ok: false,
            maintenance: true,
            title: maint.title,
            reason: maint.reason,
            scheduled_end: maint.scheduled_end,
            notice: maint.notice_content
          });
        }
        applySecurityHeaders(res);
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderMaintenanceHtml(maint));
      }
      if (maint.mode === 'maintenance_module' && Array.isArray(maint.affected_modules)) {
        for (const modPrefix of maint.affected_modules) {
          if (pathname.startsWith(modPrefix)) {
            return sendJson(res, 503, {
              ok: false,
              maintenance: true,
              affected_module: modPrefix,
              title: maint.title,
              reason: maint.reason,
              scheduled_end: maint.scheduled_end
            });
          }
        }
      }
    }

    // Xử lý toàn bộ API (/api/...)
    if (pathname.startsWith('/api/')) {
      let bodyData = { raw: '', json: {} };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        bodyData = await readJsonBody(req);
        const allowRichHtml = pathname === '/api/cms/pages' && isTechAdmin;
        const wafCheck = inspectPayloadWaf(bodyData.json, allowRichHtml);
        if (wafCheck.blocked) {
          return sendJson(res, 400, {
            ok: false,
            error: `Yêu cầu bị từ chối bởi lớp bảo vệ WAF ứng dụng (Quy tắc: ${wafCheck.rule}).`
          });
        }
      }
      const body = bodyData.json || {};
      const query = Object.fromEntries(parsedUrl.searchParams.entries());

      // 1. System Bootstrap & Metadata
      if (pathname === '/api/system/bootstrap' && req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          brand: BRAND,
          emails: EMAIL_ADDRESSES,
          routes: OFFICIAL_ROUTES,
          roles: RBAC_ROLES,
          integrations: getIntegrationStatus(),
          maintenance: maint,
          csrf_token: generateCsrfToken(currentSession ? currentSession.id : 'anonymous'),
          current_user: currentUser ? usersMod.sanitizeUserForSelf(currentUser) : null,
          languages: learningMod.listLanguages(),
          pricing: commerceMod.getPricingCatalog(),
          admin_catalog: orgsMod.getAdministrativeCatalog()
        });
      }

      // 2. Auth & Account APIs
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const out = usersMod.registerPersonalAccount(body, { ipAddress: ip, userAgent: req.headers['user-agent'] });
        return sendJson(res, 201, { ok: true, ...out });
      }
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const out = usersMod.login(body, { ipAddress: ip, userAgent: req.headers['user-agent'] });
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/auth/otp/send' && req.method === 'POST') {
        const out = authService.issueEmailOtp({
          email: body.email,
          userId: currentUser ? currentUser.id : null,
          purpose: body.purpose || 'register',
          fullName: body.full_name || 'Thành viên'
        });
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/auth/otp/verify' && req.method === 'POST') {
        const out = authService.verifyEmailOtp({
          email: body.email,
          purpose: body.purpose || 'register',
          otpCode: body.otp_code
        });
        if (out.verified && body.email) {
          db.run(`UPDATE users SET email_verified = 1 WHERE email = ?`, [String(body.email).trim().toLowerCase()]);
        }
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/auth/oauth/link' && req.method === 'POST') {
        requireAuth(currentUser);
        const out = authService.linkOAuthAccount({
          userId: currentUser.id,
          provider: body.provider,
          providerUserId: body.provider_user_id,
          providerEmail: body.provider_email,
          ownershipVerified: Boolean(body.ownership_verified)
        });
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/auth/password/change' && req.method === 'POST') {
        const out = usersMod.changePassword(currentUser, body);
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/auth/sessions/revoke-others' && req.method === 'POST') {
        const out = usersMod.revokeOtherSessions(currentUser, currentSession ? currentSession.id : '');
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/profile' && req.method === 'GET') {
        requireAuth(currentUser);
        return sendJson(res, 200, {
          ok: true,
          profile: usersMod.sanitizeUserForSelf(db.get('SELECT * FROM users WHERE id = ?', [currentUser.id])),
          my_space: orgsMod.getMySpaceOverview(currentUser)
        });
      }
      if (pathname === '/api/profile' && req.method === 'PUT') {
        const out = usersMod.updateProfile(currentUser, body);
        return sendJson(res, 200, { ok: true, profile: out });
      }

      // 3. Learning & Practice & AI Assistant APIs
      if (pathname === '/api/learning/languages' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, languages: learningMod.listLanguages() });
      }
      if (pathname === '/api/learning/exercises' && req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          exercises: learningMod.listExercises({
            languageCode: query.language_code,
            toolType: query.tool_type,
            level: query.level
          })
        });
      }
      if (pathname === '/api/learning/attempts' && req.method === 'POST') {
        const out = learningMod.submitPracticeAttempt(currentUser, body);
        return sendJson(res, 200, { ok: true, result: out });
      }
      if (pathname === '/api/learning/vocabulary-sets' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, sets: learningMod.listUserVocabularySets(currentUser) });
      }
      if (pathname === '/api/learning/vocabulary-sets' && req.method === 'POST') {
        const out = learningMod.createVocabularySet(currentUser, body);
        return sendJson(res, 201, { ok: true, set: out });
      }
      if (pathname === '/api/learning/ai-assist' && req.method === 'POST') {
        const out = learningMod.askAiContextualAssistant(currentUser, body);
        return sendJson(res, 200, { ok: true, ...out });
      }

      // 4. Progress & Resources APIs
      if (pathname === '/api/progress' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, dashboard: progressMod.getUserProgressDashboard(currentUser) });
      }
      if (pathname === '/api/progress/goals' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, goal: progressMod.upsertLearningGoal(currentUser, body) });
      }
      if (pathname === '/api/resources' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, resources: progressMod.listResources(currentUser, query) });
      }
      if (pathname === '/api/resources' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, resource: progressMod.uploadResource(currentUser, body) });
      }
// 4B. Appendix A Storage & Quota Management APIs (/quan-tri/luu-tru)
      if (pathname === '/api/resources/download' && req.method === 'GET') {
        const out = progressMod.downloadStorageFile(currentUser, query.file_id);
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/organizations/members/remove' && req.method === 'POST') {
        const out = orgsMod.removeOrganizationMember(currentUser, body);
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/admin/storage/dashboard' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, ...adminMod.getStorageManagementDashboard(currentUser, progressMod, query) });
      }
if (pathname === '/api/admin/storage/monthly-quota-config' && req.method === 'GET') {
        requirePermission(currentUser, 'admin.view');
        const { getMonthlyQuotaGb } = require('./config/env');
        const gb = getMonthlyQuotaGb();
        return sendJson(res, 200, {
          ok: true,
          monthly_quota_gb: gb,
          monthly_quota_bytes: gb * 1024 * 1024 * 1024
        });
      }
      if (pathname === '/api/admin/storage/monthly-quota-config' && req.method === 'POST') {
        const out = progressMod.configureServerMonthlyQuotaGb(currentUser, body);
        return sendJson(res, 200, { ok: true, ...out });
      }
      if (pathname === '/api/admin/emails/config' && req.method === 'POST') {
        requirePermission(currentUser, 'email.manage');
        if (body.resend_api_key !== undefined) {
          process.env.RESEND_API_KEY = String(body.resend_api_key).trim();
          process.env.EMAIL_PROVIDER = process.env.RESEND_API_KEY ? 'resend' : 'unconfigured';
        }
        return sendJson(res, 200, {
          ok: true,
          email_status: getIntegrationStatus().email
        });
      }
      if (pathname === '/api/admin/storage/quota' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...progressMod.adminAdjustQuota(currentUser, body) });
      }
      if (pathname === '/api/admin/storage/cycles/reset' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...progressMod.runMonthlyOrganizationQuotaReset(currentUser, body) });
      }
      if (pathname === '/api/admin/storage/verify-recovery' && req.method === 'POST') {
        requirePermission(currentUser, 'backup.manage');
        const dbBak = db.createBackup();
        const dbVerify = db.verifyRestoreCapability(dbBak.backup_path);
        const stBak = storage.backupStorageSnapshot();
        return sendJson(res, 200, {
          ok: true,
          database_backup: dbBak,
          database_recovery_verified: dbVerify,
          storage_backup: stBak
        });
      }
      if (pathname === '/api/resources/report' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, report: progressMod.reportCopyrightOrViolation(currentUser, body) });
      }

      // 5. Connections, Friends & Chat APIs
      if (pathname === '/api/connections/search' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, partners: connectionsMod.searchStudyPartners(currentUser, query) });
      }
      if (pathname === '/api/friends/request' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, friendship: connectionsMod.sendFriendRequest(currentUser, body) });
      }
      if (pathname === '/api/friends/respond' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, friendship: connectionsMod.respondFriendRequest(currentUser, body) });
      }
      if (pathname === '/api/chat/groups' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, conversation: connectionsMod.createGroupConversation(currentUser, body) });
      }
      if (pathname === '/api/chat/messages' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, message: connectionsMod.sendMessage(currentUser, body) });
      }
      if (pathname === '/api/chat/messages/mutate' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, message: connectionsMod.mutateMessageState(currentUser, body) });
      }

      // 6. Community & Groups APIs
      if (pathname === '/api/community/posts' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, posts: communityMod.listPosts(query) });
      }
      if (pathname === '/api/community/posts' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, post: communityMod.createPost(currentUser, body) });
      }
      if (pathname === '/api/community/comments' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, comment: communityMod.addComment(currentUser, body) });
      }
      if (pathname === '/api/community/groups' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, group: communityMod.createGroup(currentUser, body) });
      }
      if (pathname === '/api/community/activities' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, activity: communityMod.createInternalGroupActivity(currentUser, body) });
      }

      // 7. Organizations & 2-Form Registration (I, II, III) APIs
      if (pathname === '/api/organizations/catalog' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, catalog: orgsMod.getAdministrativeCatalog() });
      }
      if (pathname === '/api/organizations/lookup-legal' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, ...orgsMod.lookupLegalEntityByCode(query.code) });
      }
      if (pathname === '/api/organizations/applications' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, application: orgsMod.submitOrganizationApplication(currentUser, body) });
      }
      if (pathname === '/api/organizations/applications/review' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, application: orgsMod.reviewOrganizationApplication(currentUser, body) });
      }
      if (pathname === '/api/organizations/members' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, member: orgsMod.createOrganizationMemberAccount(currentUser, body) });
      }

      // 8. Commerce, Plans, Support Programs, Loyalty & Payment Core QR APIs
      if (pathname === '/api/commerce/catalog' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, ...commerceMod.getPricingCatalog() });
      }
      if (pathname === '/api/commerce/support-programs/apply' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, application: commerceMod.applyForSupportProgram(currentUser, body) });
      }
      if (pathname === '/api/commerce/subscriptions/manage' && req.method === 'POST') {
        const sub = commerceMod.manageSubscriptionLifecycle(currentUser, body);
        const refreshedUser = db.get("SELECT * FROM users WHERE id = ?", [currentUser.id]);
        const updatedQuota = progressMod.ensureQuotaRecord("personal", currentUser.id, refreshedUser.plan_code);
        return sendJson(res, 200, { ok: true, subscription: sub, storage_quota: updatedQuota });
      }
      if (pathname === '/api/commerce/referrals/apply' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, loyalty: commerceMod.applyReferralCode(currentUser, body) });
      }
      if (pathname === '/api/payments/orders' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, order: paymentMod.createOrder(currentUser, body) });
      }
      if (pathname === '/api/payments/notify-transfer' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...paymentMod.notifyCustomerTransferSubmitted(currentUser, body) });
      }
      if (pathname === '/api/payments/reconcile' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...paymentMod.reconcileOrderAuthorized(currentUser, body) });
      }
      if (pathname === '/api/payments/refund' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, order: paymentMod.refundOrder(currentUser, body) });
      }

      // 9. Examination System (/khao-thi) & Anti-Cheating APIs
      if (pathname === '/api/exams' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, exams: examMod.listPublicExams() });
      }
      if (pathname === '/api/exams/register' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, registration: examMod.registerForExam(currentUser, body) });
      }
      if (pathname === '/api/exams/enter-room' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...examMod.enterExamRoom(currentUser, body) });
      }
      if (pathname === '/api/exams/autosave' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...examMod.autoSaveExamAnswers(currentUser, body) });
      }
      if (pathname === '/api/exams/integrity-events' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...examMod.recordIntegrityEvent(currentUser, body) });
      }
      if (pathname === '/api/exams/submit' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...examMod.submitExamSession(currentUser, body) });
      }
      if (pathname === '/api/exams/proctor' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, session: examMod.proctorAction(currentUser, body) });
      }
      if (pathname === '/api/exams/appeals' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, appeal: examMod.submitAppeal(currentUser, body) });
      }

      // 10. CMS Word (/quan-tri/cms), Admin (/quan-tri), Email (/quan-tri/email), Maintenance (/quan-tri/bao-tri) & Support (/ho-tro)
      if (pathname === '/api/cms/pages' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, pages: cmsMod.listPages() });
      }
      if (pathname === '/api/cms/pages' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...cmsMod.saveOrUpdatePage(currentUser, body) });
      }
      if (pathname === '/api/cms/pages/restore' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, page: cmsMod.restorePageVersion(currentUser, body) });
      }
      if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, ...adminMod.getRealAdminDashboard(currentUser) });
      }
      if (pathname === '/api/admin/emails' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, ...adminMod.getEmailManagementOverview(currentUser) });
      }
      if (pathname === '/api/admin/emails/preview' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, preview: adminMod.previewEmailTemplate(currentUser, query.slug) });
      }
      if (pathname === '/api/admin/maintenance' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, maintenance: adminMod.configureMaintenanceMode(currentUser, body) });
      }
      if (pathname === '/api/admin/backup' && req.method === 'POST') {
        requirePermission(currentUser, 'backup.manage');
        return sendJson(res, 200, { ok: true, backup: db.createBackup() });
      }
      if (pathname === '/api/support/tickets' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, tickets: adminMod.listSupportTickets(currentUser) });
      }
      if (pathname === '/api/support/tickets' && req.method === 'POST') {
        return sendJson(res, 201, { ok: true, ticket: adminMod.createSupportTicket(currentUser, body) });
      }
      if (pathname === '/api/support/tickets/reply' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true, ...adminMod.replyAndUpdateTicket(currentUser, body) });
      }

      return sendJson(res, 404, { ok: false, error: `Không tìm thấy API endpoint: ${pathname}` });
    }

    // Phục vụ giao diện thống nhất cho mọi route chính thức của WORD BRIDGE
    const indexHtmlPath = path.join(frontendRoot, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      applySecurityHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(indexHtmlPath));
    }

    return sendJson(res, 404, { ok: false, error: 'Không tìm thấy trang yêu cầu.' });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendJson(res, statusCode, {
      ok: false,
      error: err.message || 'Lỗi xử lý yêu cầu hệ thống.'
    });
  }
}

function createAppServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const srv = createAppServer();
  srv.listen(PORT, () => {
    console.log(`[WORD BRIDGE] Server running at http://localhost:${PORT} (Canonical: ${BRAND.CANONICAL_ORIGIN})`);
  });
}

module.exports = {
  createAppServer,
  handleRequest,
  services: {
    db,
    storage,
    emailAdapter,
    paymentAdapter,
    authService,
    usersMod,
    learningMod,
    progressMod,
    connectionsMod,
    communityMod,
    orgsMod,
    commerceMod,
    paymentMod,
    examMod,
    cmsMod,
    adminMod
  }
};
