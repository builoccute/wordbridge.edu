'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { BRAND, EMAIL_ADDRESSES, OFFICIAL_ROUTES, RBAC_ROLES } = require('./config/constants');
const { PORT, getIntegrationStatus, getMonthlyQuotaGb } = require('./config/env');
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

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  applySecurityHeaders(res);
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
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

function extractAuthContextFromHeaders(headers = {}, pathname = '') {
  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  const cookies = parseCookies(headers['cookie'] || headers['Cookie'] || '');
  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/quan-tri')) {
    token = cookies.wb_admin_token || cookies.wb_token || '';
  } else {
    token = cookies.wb_token || cookies.wb_admin_token || '';
  }

  return {
    token,
    adminToken: cookies.wb_admin_token || (token.startsWith('wbadm_') ? token : ''),
    authCtx: authService.authenticateToken(token)
  };
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

/**
 * BỘ ĐIỀU PHỐI API THỐNG NHẤT GIỮA CLOUDFLARE WORKER (src/worker.js) VÀ MÁY CHỦ NODE (src/server.js)
 * Đảm bảo 100% API nghiệp vụ, xác thực, RBAC, D1/R2 và Resend chạy đồng nhất trên môi trường sản xuất.
 */
async function dispatchApiRequest({ method, pathname, query = {}, body = {}, authInfo, ip = '127.0.0.1', userAgent = '', workerEnv = null }) {
  if (workerEnv && workerEnv.DB) db.bindWorkerD1(workerEnv.DB);
  if (workerEnv && workerEnv.R2) storage.bindWorkerR2(workerEnv.R2);

  const authCtx = authInfo ? authInfo.authCtx : null;
  const currentUser = authCtx ? authCtx.user : null;
  const currentSession = authCtx ? authCtx.session : null;
  const maint = adminMod.getMaintenanceState();
  const isTechAdmin = currentUser && ['super_admin', 'system_admin'].includes(currentUser.role);

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const allowRichHtml = (pathname === '/api/cms/pages' || pathname === '/api/news') && isTechAdmin;
    const wafCheck = inspectPayloadWaf(body, allowRichHtml);
    if (wafCheck.blocked) {
      return {
        statusCode: 400,
        payload: {
          ok: false,
          error: `Yêu cầu bị từ chối bởi lớp bảo vệ an toàn ứng dụng (Quy tắc: ${wafCheck.rule}).`
        }
      };
    }
  }

  // 1. System Bootstrap & Unified Search
  if (pathname === '/api/system/bootstrap' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        brand: BRAND,
        emails: EMAIL_ADDRESSES,
        routes: OFFICIAL_ROUTES.filter(r => !r.adminOnly && !r.adminPortal),
        roles: RBAC_ROLES,
        integrations: getIntegrationStatus(workerEnv),
        maintenance: maint,
        csrf_token: generateCsrfToken(currentSession ? currentSession.id : 'anonymous'),
        current_user: currentUser ? usersMod.sanitizeUserForSelf(currentUser) : null,
        is_admin_session: Boolean(authCtx && authCtx.isAdminSession),
        languages: learningMod.listLanguages(),
        pricing: commerceMod.getPricingCatalog(),
        admin_catalog: orgsMod.getAdministrativeCatalog()
      }
    };
  }

  if (pathname === '/api/search' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        ...cmsMod.searchPlatformUnified(currentUser, query)
      }
    };
  }

  // 2. Auth, Account, OAuth 2.0, Sessions & Notifications APIs
  if (pathname === '/api/auth/register' && method === 'POST') {
    const out = usersMod.registerPersonalAccount(body, { ipAddress: ip, userAgent });
    return {
      statusCode: 201,
      cookies: [`wb_token=${encodeURIComponent(out.session.token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`],
      payload: { ok: true, ...out }
    };
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    const out = usersMod.login(body, { ipAddress: ip, userAgent });
    return {
      statusCode: 200,
      cookies: [`wb_token=${encodeURIComponent(out.session.token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`],
      payload: { ok: true, ...out }
    };
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    if (authInfo && authInfo.token) {
      authService.revokeCurrentSession(authInfo.token);
    }
    return {
      statusCode: 200,
      cookies: [
        'wb_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'wb_admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
      ],
      payload: { ok: true, logged_out: true }
    };
  }
  if (pathname === '/api/auth/otp/send' && method === 'POST') {
    const out = authService.issueEmailOtp({
      email: body.email,
      userId: currentUser ? currentUser.id : null,
      purpose: body.purpose || 'register',
      fullName: body.full_name || 'Thành viên'
    });
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/otp/verify' && method === 'POST') {
    const out = authService.verifyEmailOtp({
      email: body.email,
      purpose: body.purpose || 'register',
      otpCode: body.otp_code
    });
    if (out.verified && body.email) {
      db.run(`UPDATE users SET email_verified = 1 WHERE email = ?`, [String(body.email).trim().toLowerCase()]);
    }
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/password/forgot' && method === 'POST') {
    const out = usersMod.requestPasswordReset(body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/password/reset' && method === 'POST') {
    const out = usersMod.resetPasswordWithOtp(body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/password/change' && method === 'POST') {
    const out = usersMod.changePassword(currentUser, body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/oauth/providers' && method === 'GET') {
    const { getOAuthProvidersStatus } = require('./config/env');
    return { statusCode: 200, payload: { ok: true, providers: getOAuthProvidersStatus(workerEnv) } };
  }
  if (pathname === '/api/auth/oauth/authorize' && (method === 'GET' || method === 'POST')) {
    const out = authService.initiateOAuthFlow({
      provider: query.provider || body.provider,
      redirectUri: query.redirect_uri || body.redirect_uri,
      userId: currentUser ? currentUser.id : null
    }, workerEnv);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/oauth/callback' && method === 'POST') {
    const out = authService.completeOAuthCallback(body, { ipAddress: ip, userAgent });
    return {
      statusCode: 200,
      cookies: [`wb_token=${encodeURIComponent(out.session.token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`],
      payload: {
        ok: true,
        user: usersMod.sanitizeUserForSelf(out.user),
        session: out.session,
        linked: Boolean(out.linked)
      }
    };
  }
  if (pathname === '/api/auth/oauth/link' && method === 'POST') {
    requireAuth(currentUser);
    const out = authService.linkOAuthAccount({
      userId: currentUser.id,
      provider: body.provider,
      providerUserId: body.provider_user_id,
      providerEmail: body.provider_email,
      ownershipVerified: Boolean(body.ownership_verified)
    });
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/sessions' && method === 'GET') {
    const sessions = usersMod.listUserSessions(currentUser, currentSession ? currentSession.id : '');
    return { statusCode: 200, payload: { ok: true, sessions } };
  }
  if (pathname === '/api/auth/sessions/revoke' && method === 'POST') {
    const out = usersMod.revokeSessionById(currentUser, body.session_id);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/auth/sessions/revoke-others' && method === 'POST') {
    const out = usersMod.revokeOtherSessions(currentUser, currentSession ? currentSession.id : '');
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/profile' && method === 'GET') {
    requireAuth(currentUser);
    return {
      statusCode: 200,
      payload: {
        ok: true,
        profile: usersMod.sanitizeUserForSelf(db.get('SELECT * FROM users WHERE id = ?', [currentUser.id])),
        notification_preferences: usersMod.getNotificationPreferences(currentUser),
        notifications: usersMod.listNotifications(currentUser),
        my_space: orgsMod.getMySpaceOverview(currentUser)
      }
    };
  }
  if (pathname === '/api/profile' && method === 'PUT') {
    const out = usersMod.updateProfile(currentUser, body);
    return { statusCode: 200, payload: { ok: true, profile: out } };
  }
  if (pathname === '/api/notifications' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        notifications: usersMod.listNotifications(currentUser),
        preferences: usersMod.getNotificationPreferences(currentUser)
      }
    };
  }
  if (pathname === '/api/notifications/read' && method === 'POST') {
    return { statusCode: 200, payload: usersMod.markNotificationRead(currentUser, body) };
  }
  if (pathname === '/api/notifications/preferences' && method === 'PUT') {
    return {
      statusCode: 200,
      payload: { ok: true, preferences: usersMod.updateNotificationPreferences(currentUser, body) }
    };
  }

  // 2B. Dedicated Admin Authentication APIs (/api/admin/auth/...)
  if (pathname === '/api/admin/auth/bootstrap' && method === 'POST') {
    const out = authService.bootstrapFirstAdmin(body, { ipAddress: ip, userAgent });
    return { statusCode: 201, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/admin/auth/login' && method === 'POST') {
    const out = authService.loginAdmin(body, { ipAddress: ip, userAgent });
    return {
      statusCode: 200,
      cookies: [`wb_admin_token=${encodeURIComponent(out.admin_session.token)}; HttpOnly; Path=/; Max-Age=43200; SameSite=Strict`],
      payload: { ok: true, ...out }
    };
  }

  // 3. Learning, Practice, Placement Assessment, Roadmap & AI Assistant APIs
  if (pathname === '/api/learning/languages' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, languages: learningMod.listLanguages() } };
  }
  if (pathname === '/api/learning/exercises' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        exercises: learningMod.listExercises({
          languageCode: query.language_code,
          toolType: query.tool_type,
          level: query.level,
          topic: query.topic,
          beginnerOnly: query.beginner_only === '1' || query.beginner_only === 'true'
        })
      }
    };
  }
  if (pathname === '/api/learning/exercises/detail' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...learningMod.getExerciseDetail(query.exercise_id) } };
  }
  if (pathname === '/api/learning/attempts' && method === 'POST') {
    const out = learningMod.submitPracticeAttempt(currentUser, body);
    return { statusCode: 200, payload: { ok: true, result: out } };
  }
  if (pathname === '/api/learning/saved-items' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, items: learningMod.listSavedLearningItems(currentUser, query) } };
  }
  if (pathname === '/api/learning/saved-items' && method === 'POST') {
    const item = learningMod.saveLearningItem(currentUser, body);
    return { statusCode: 201, payload: { ok: true, item } };
  }
  if (pathname === '/api/learning/vocabulary-sets' && method === 'GET') {
    const vocabData = learningMod.listUserVocabularySets(currentUser);
    return { statusCode: 200, payload: { ok: true, sets: vocabData.sets, statistics: vocabData.statistics } };
  }
  if (pathname === '/api/learning/vocabulary-sets' && method === 'POST') {
    const out = learningMod.createVocabularySet(currentUser, body);
    return { statusCode: 201, payload: { ok: true, set: out } };
  }
  if (pathname === '/api/learning/vocabulary-items/review' && method === 'POST') {
    const out = learningMod.reviewVocabularyItem(currentUser, body);
    return { statusCode: 200, payload: { ok: true, item: out } };
  }
  if (pathname === '/api/learning/placement' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...learningMod.getPlacementQuestions(query.language_code || 'en') } };
  }
  if (pathname === '/api/learning/placement' && method === 'POST') {
    const out = learningMod.submitPlacementAssessment(currentUser, body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/learning/roadmap' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, roadmap: learningMod.getUserRoadmap(currentUser, query.language_code) } };
  }
  if (pathname === '/api/learning/roadmap' && method === 'PUT') {
    return { statusCode: 200, payload: { ok: true, roadmap: learningMod.updateUserRoadmap(currentUser, body) } };
  }
  if (pathname === '/api/learning/ai-assist' && method === 'POST') {
    const out = learningMod.askAiContextualAssistant(currentUser, body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }

  // 4. Progress (GROW), Resources & Storage Quota APIs
  if (pathname === '/api/progress' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, dashboard: progressMod.getUserProgressDashboard(currentUser) } };
  }
  if (pathname === '/api/progress/goals' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, goal: progressMod.upsertLearningGoal(currentUser, body) } };
  }
  if (pathname === '/api/resources' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, resources: progressMod.listResources(currentUser, query) } };
  }
  if (pathname === '/api/resources' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, resource: progressMod.uploadResource(currentUser, body) } };
  }
  if (pathname === '/api/resources/favorite' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...progressMod.toggleResourceFavorite(currentUser, body) } };
  }
  if (pathname === '/api/resources/download' && method === 'GET') {
    const out = progressMod.downloadStorageFile(currentUser, query.file_id);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/resources/report' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, report: progressMod.reportCopyrightOrViolation(currentUser, body) } };
  }

  // Protected R2 Object Upload API (PHẦN XXI.3 - Bắt buộc xác thực và kiểm tra hạn mức/tệp)
  if (pathname === '/api/r2/upload' && method === 'POST') {
    requireAuth(currentUser);
    const out = progressMod.uploadResource(currentUser, {
      title: body.title || body.filename || 'Tệp tải lên R2',
      language_code: body.language_code || 'en',
      resource_type: body.resource_type || 'reference',
      access_scope: body.access_scope || 'personal',
      owner_org_id: body.owner_org_id || null,
      mime_type: body.mime_type || 'text/plain',
      content_base64: body.content_base64 || Buffer.from(String(body.content || 'Dữ liệu học tập WORD BRIDGE'), 'utf8').toString('base64'),
      original_name: body.filename || 'file.txt'
    });
    return {
      statusCode: 201,
      payload: {
        ok: true,
        storage_key: out.storage_key,
        file_id: out.file_id,
        bucket: 'word',
        quota_after_upload: out.quota_after_upload
      }
    };
  }

  // 5. Connections, Friends & Chat APIs
  if (pathname === '/api/connections/search' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, partners: connectionsMod.searchStudyPartners(currentUser, query) } };
  }
  if (pathname === '/api/connections/overview' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...connectionsMod.listConnectionsOverview(currentUser) } };
  }
  if (pathname === '/api/connections/favorite' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...connectionsMod.toggleFavoritePartner(currentUser, body) } };
  }
  if (pathname === '/api/connections/block' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...connectionsMod.blockUser(currentUser, body) } };
  }
  if (pathname === '/api/friends/request' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, friendship: connectionsMod.sendFriendRequest(currentUser, body) } };
  }
  if (pathname === '/api/friends/respond' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, friendship: connectionsMod.respondFriendRequest(currentUser, body) } };
  }
  if (pathname === '/api/chat/groups' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, conversation: connectionsMod.createGroupConversation(currentUser, body) } };
  }
  if (pathname === '/api/chat/messages' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, messages: connectionsMod.listMessages(currentUser, query.conversation_id) } };
  }
  if (pathname === '/api/chat/messages' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, message: connectionsMod.sendMessage(currentUser, body) } };
  }
  if (pathname === '/api/chat/messages/mutate' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, message: connectionsMod.mutateMessageState(currentUser, body) } };
  }

  // 6. Community & Groups APIs
  if (pathname === '/api/community/posts' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        posts: communityMod.listPosts(Object.assign({}, query, { viewer_user_id: currentUser ? currentUser.id : null }))
      }
    };
  }
  if (pathname === '/api/community/posts' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, post: communityMod.createPost(currentUser, body) } };
  }
  if (pathname === '/api/community/posts/like' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...communityMod.toggleLikePost(currentUser, body) } };
  }
  if (pathname === '/api/community/posts/bookmark' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...communityMod.toggleBookmarkPost(currentUser, body) } };
  }
  if (pathname === '/api/community/comments' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, comment: communityMod.addComment(currentUser, body) } };
  }
  if (pathname === '/api/community/groups' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...communityMod.listGroups(query) } };
  }
  if (pathname === '/api/community/groups' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, group: communityMod.createGroup(currentUser, body) } };
  }
  if (pathname === '/api/community/groups/join' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...communityMod.joinGroup(currentUser, body) } };
  }
  if (pathname === '/api/community/activities' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, activity: communityMod.createInternalGroupActivity(currentUser, body) } };
  }

  // 7. Organizations APIs (Khám phá, Tổ chức của tôi, Không gian Quản lý Tổ chức)
  if (pathname === '/api/organizations/catalog' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, catalog: orgsMod.getAdministrativeCatalog() } };
  }
  if (pathname === '/api/organizations/explore' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, organizations: orgsMod.explorePublicOrganizations(query) } };
  }
  if (pathname === '/api/organizations/join-request' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, join_request: orgsMod.requestJoinOrganization(currentUser, body) } };
  }
  if (pathname === '/api/organizations/my-space' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, my_space: orgsMod.getMySpaceOverview(currentUser) } };
  }
  if (pathname === '/api/organizations/manage' && method === 'GET') {
    return {
      statusCode: 200,
      payload: {
        ok: true,
        workspace: orgsMod.getOrganizationManagementDashboard(currentUser, query.org_id || null, progressMod)
      }
    };
  }
  if (pathname === '/api/organizations/lookup-legal' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...orgsMod.lookupLegalEntityByCode(query.code) } };
  }
  if (pathname === '/api/organizations/applications' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, application: orgsMod.submitOrganizationApplication(currentUser, body) } };
  }
  if (pathname === '/api/organizations/applications/review' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, application: orgsMod.reviewOrganizationApplication(currentUser, body) } };
  }
  if (pathname === '/api/organizations/members' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, member: orgsMod.createOrganizationMemberAccount(currentUser, body) } };
  }
  if (pathname === '/api/organizations/members/role' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, member: orgsMod.updateMemberOrgRole(currentUser, body) } };
  }
  if (pathname === '/api/organizations/members/remove' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...orgsMod.removeOrganizationMember(currentUser, body) } };
  }
  if (pathname === '/api/organizations/join-requests/review' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, join_request: orgsMod.reviewJoinRequest(currentUser, body) } };
  }
  if (pathname === '/api/organizations/tasks' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, task: orgsMod.createOrgTask(currentUser, body) } };
  }
  if (pathname === '/api/organizations/announcements' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, announcement: orgsMod.createOrgAnnouncement(currentUser, body) } };
  }

  // 8. Commerce, Plans, Support Programs & Payment Core QR APIs
  if (pathname === '/api/commerce/catalog' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...commerceMod.getPricingCatalog() } };
  }
  if (pathname === '/api/commerce/support-programs/apply' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, application: commerceMod.applyForSupportProgram(currentUser, body) } };
  }
  if (pathname === '/api/commerce/subscriptions/manage' && method === 'POST') {
    const sub = commerceMod.manageSubscriptionLifecycle(currentUser, body);
    const refreshedUser = db.get('SELECT * FROM users WHERE id = ?', [currentUser.id]);
    const updatedQuota = progressMod.ensureQuotaRecord('personal', currentUser.id, refreshedUser.plan_code);
    return { statusCode: 200, payload: { ok: true, subscription: sub, storage_quota: updatedQuota } };
  }
  if (pathname === '/api/commerce/referrals/apply' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, loyalty: commerceMod.applyReferralCode(currentUser, body) } };
  }
  if (pathname === '/api/payments/orders' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...paymentMod.listUserTransactions(currentUser) } };
  }
  if (pathname === '/api/payments/orders' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, order: paymentMod.createOrder(currentUser, body) } };
  }
  if (pathname === '/api/payments/notify-transfer' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...paymentMod.notifyCustomerTransferSubmitted(currentUser, body) } };
  }
  if (pathname === '/api/payments/reconcile' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...paymentMod.reconcileOrderAuthorized(currentUser, body) } };
  }
  if (pathname === '/api/payments/refund' && method === 'POST') {
    const refundedOrder = paymentMod.refundOrder(currentUser, body);
    return { statusCode: 200, payload: { ok: true, order: refundedOrder } };
  }

  // 9. Examination System (/khao-thi) APIs
  if (pathname === '/api/exams' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, exams: examMod.listPublicExams(query) } };
  }
  if (pathname === '/api/exams' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, exam: examMod.createExam(currentUser, body) } };
  }
  if (pathname === '/api/exams/questions' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, question: examMod.createQuestionBankItem(currentUser, body) } };
  }
  if (pathname === '/api/exams/register' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, registration: examMod.registerForExam(currentUser, body) } };
  }
  if (pathname === '/api/exams/enter-room' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...examMod.enterExamRoom(currentUser, body) } };
  }
  if (pathname === '/api/exams/autosave' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...examMod.autoSaveExamAnswers(currentUser, body) } };
  }
  if (pathname === '/api/exams/integrity-events' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...examMod.recordIntegrityEvent(currentUser, body) } };
  }
  if (pathname === '/api/exams/submit' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...examMod.submitExamSession(currentUser, body) } };
  }
  if (pathname === '/api/exams/history' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...examMod.listCandidateExamHistory(currentUser) } };
  }
  if (pathname === '/api/exams/proctor' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, session: examMod.proctorAction(currentUser, body) } };
  }
  if (pathname === '/api/exams/appeals' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, appeal: examMod.submitAppeal(currentUser, body) } };
  }
  if (pathname === '/api/exams/appeals/resolve' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, appeal: examMod.resolveExamAppeal(currentUser, body) } };
  }

  // 10. News (/tin-tuc), CMS, Admin, Email Resend, Storage & Support APIs
  if (pathname === '/api/news' && method === 'GET') {
    if (query.slug || query.id) {
      return { statusCode: 200, payload: { ok: true, ...cmsMod.getNewsArticleDetail(query.slug || query.id) } };
    }
    return { statusCode: 200, payload: { ok: true, articles: cmsMod.listNewsArticles(query) } };
  }
  if (pathname === '/api/news' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, article: cmsMod.saveOrUpdateNewsArticle(currentUser, body) } };
  }
  if (pathname === '/api/cms/pages' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, pages: cmsMod.listPages() } };
  }
  if (pathname === '/api/cms/pages' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...cmsMod.saveOrUpdatePage(currentUser, body) } };
  }
  if (pathname === '/api/cms/pages/restore' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, page: cmsMod.restorePageVersion(currentUser, body) } };
  }
  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...adminMod.getRealAdminDashboard(currentUser) } };
  }
  if (pathname === '/api/admin/users/update' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, user: adminMod.updateUserByAdmin(currentUser, body) } };
  }
  if (pathname === '/api/admin/support-programs/review' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, application: adminMod.reviewSupportProgramByAdmin(currentUser, body) } };
  }
  if (pathname === '/api/admin/reports/resolve' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, report: adminMod.resolveViolationReport(currentUser, body) } };
  }
  if (pathname === '/api/admin/storage/dashboard' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...adminMod.getStorageManagementDashboard(currentUser, progressMod, query) } };
  }
  if (pathname === '/api/admin/storage/monthly-quota-config' && method === 'GET') {
    requirePermission(currentUser, 'admin.view');
    const gb = getMonthlyQuotaGb();
    return {
      statusCode: 200,
      payload: {
        ok: true,
        monthly_quota_gb: gb,
        monthly_quota_bytes: gb * 1024 * 1024 * 1024,
        override_plan_quotas: false
      }
    };
  }
  if (pathname === '/api/admin/storage/monthly-quota-config' && method === 'POST') {
    const out = progressMod.configureServerMonthlyQuotaGb(currentUser, body);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/admin/storage/quota' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...progressMod.adminAdjustQuota(currentUser, body) } };
  }
  if (pathname === '/api/admin/storage/cycles/reset' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...progressMod.runMonthlyOrganizationQuotaReset(currentUser, body) } };
  }
  if (pathname === '/api/admin/storage/verify-recovery' && method === 'POST') {
    requirePermission(currentUser, 'backup.manage');
    const dbBak = db.createBackup();
    const dbVerify = db.verifyRestoreCapability(dbBak.backup_path);
    const stBak = storage.backupStorageSnapshot();
    const integrity = db.checkIntegrity();
    return {
      statusCode: 200,
      payload: {
        ok: true,
        database_backup: dbBak,
        database_recovery_verified: dbVerify,
        database_integrity: integrity,
        storage_backup: stBak
      }
    };
  }
  if (pathname === '/api/admin/emails' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, ...adminMod.getEmailManagementOverview(currentUser) } };
  }
  if (pathname === '/api/admin/emails/preview' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, preview: adminMod.previewEmailTemplate(currentUser, query.slug) } };
  }
  if (pathname === '/api/admin/emails/config' && method === 'POST') {
    requirePermission(currentUser, 'email.manage');
    if (body.resend_api_key !== undefined) {
      process.env.RESEND_API_KEY = String(body.resend_api_key).trim();
      process.env.EMAIL_PROVIDER = process.env.RESEND_API_KEY ? 'resend' : 'unconfigured';
    }
    return { statusCode: 200, payload: { ok: true, email_status: getIntegrationStatus(workerEnv).email } };
  }
  if ((pathname === '/api/admin/emails/send' || pathname === '/api/emails/send') && method === 'POST') {
    const out = await adminMod.sendControlledSystemEmail(currentUser, body, workerEnv);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/admin/emails/retry' && method === 'POST') {
    const out = await adminMod.retryQueuedEmailByAdmin(currentUser, body, workerEnv);
    return { statusCode: 200, payload: { ok: true, ...out } };
  }
  if (pathname === '/api/admin/maintenance' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, maintenance: adminMod.configureMaintenanceMode(currentUser, body) } };
  }
  if (pathname === '/api/admin/backup' && method === 'POST') {
    requirePermission(currentUser, 'backup.manage');
    return { statusCode: 200, payload: { ok: true, backup: db.createBackup() } };
  }
  if (pathname === '/api/support/tickets' && method === 'GET') {
    return { statusCode: 200, payload: { ok: true, tickets: adminMod.listSupportTickets(currentUser) } };
  }
  if (pathname === '/api/support/tickets' && method === 'POST') {
    return { statusCode: 201, payload: { ok: true, ticket: adminMod.createSupportTicket(currentUser, body) } };
  }
  if (pathname === '/api/support/tickets/reply' && method === 'POST') {
    return { statusCode: 200, payload: { ok: true, ...adminMod.replyAndUpdateTicket(currentUser, body) } };
  }

  return { statusCode: 404, payload: { ok: false, error: 'Không tìm thấy đường dẫn xử lý yêu cầu.' } };
}

async function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/') || pathname === '/api/events' || pathname.startsWith('/api/events/')) {
      return sendJson(res, 404, {
        ok: false,
        error: 'Mục Sự kiện đã được loại bỏ hoàn toàn khỏi kiến trúc WORD BRIDGE. Các thử thách và lịch sinh hoạt nội bộ được tổ chức trong không gian Nhóm hoặc Tổ chức.'
      });
    }

    const rateCheck = checkRateLimit(ip, pathname);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return sendJson(res, 429, {
        ok: false,
        error: `Quá giới hạn tần suất truy cập (${rateCheck.bucket}). Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`
      });
    }

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
          '.json': 'application/json; charset=utf-8',
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg'
        };
        applySecurityHeaders(res);
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        return res.end(fs.readFileSync(filePath));
      }
      return sendJson(res, 404, { ok: false, error: 'Không tìm thấy tài nguyên tĩnh.' });
    }

    const authInfo = extractAuthContextFromHeaders(req.headers, pathname);
    const currentUser = authInfo.authCtx ? authInfo.authCtx.user : null;

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

    if (pathname.startsWith('/api/')) {
      let bodyData = { raw: '', json: {} };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        bodyData = await readJsonBody(req);
      }
      const query = Object.fromEntries(parsedUrl.searchParams.entries());
      const result = await dispatchApiRequest({
        method: req.method,
        pathname,
        query,
        body: bodyData.json || {},
        authInfo,
        ip,
        userAgent: req.headers['user-agent'] || ''
      });
      const extraHeaders = {};
      if (result.cookies && result.cookies.length > 0) {
        extraHeaders['Set-Cookie'] = result.cookies;
      }
      return sendJson(res, result.statusCode, result.payload, extraHeaders);
    }

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
  dispatchApiRequest,
  extractAuthContextFromHeaders,
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
