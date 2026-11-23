/**
 * WORD BRIDGE V4.1 — Unified REST API Router (/api/v1/*)
 * - One Domain (https://wordbridge.io.vn), Native D1 & R2
 * - Exam APIs completely removed (410 Gone)
 * - Full Auth (register, verify-email, login, forgot-password, reset-password, profile, change-password, passkeys)
 * - Real Help Center Tickets API, Real Reader API, Full Super Admin & RBAC APIs
 * - Mandatory Backend CSRF verification on all authenticated state-changing requests
 */

import { jsonResponse, errorResponse, buildSessionCookie, clearSessionCookie } from '../utils/http.js';
import { OFFICIAL_LANGUAGES, SPECIALIZED_DOMAINS, INTELLIGENCE_SYSTEMS, PLANS, BRAND } from '../config/constants.js';
import { assertOfficialLanguage, assertSpecializedLanguage } from '../utils/validation.js';
import { generateId, timingSafeEqual } from '../utils/crypto.js';

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function requireAuth(user) {
  if (!user) return errorResponse('UNAUTHORIZED', 'Hành động này yêu cầu đăng nhập tài khoản WORD BRIDGE.', 401);
  return null;
}

function requireCsrf(request, user, parsedBody = {}) {
  const headerToken = request.headers.get('X-CSRF-Token') || parsedBody?._csrf || '';
  if (!user?.csrfToken || !headerToken || !timingSafeEqual(String(headerToken), String(user.csrfToken))) {
    return errorResponse('CSRF_INVALID', 'Thiếu hoặc sai mã bảo vệ CSRF (X-CSRF-Token). Yêu cầu bị từ chối tại backend.', 403);
  }
  return null;
}

export async function handleApiRequest(request, url, ctx) {
  const { services, user, env, loadVocabJson } = ctx;
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const userAgent = request.headers.get('User-Agent') || 'Unknown';
  const isSecure = url.protocol === 'https:';

  // Strictly block any certificate API attempts
  if (path.includes('certificate')) {
    return errorResponse('FEATURE_PROHIBITED', 'WORD BRIDGE không cung cấp chức năng cấp chứng chỉ dưới mọi hình thức.', 404);
  }

  // Exam module completely removed -> 410 Gone
  if (
    path.startsWith('/api/v1/examinations') ||
    path.startsWith('/api/v1/examination-attempts') ||
    path.startsWith('/api/v1/examination-results')
  ) {
    return errorResponse('EXAM_MODULE_REMOVED', 'Phân hệ Exam đã được loại bỏ hoàn toàn khỏi WORD BRIDGE. Vui lòng sử dụng Cổng Luyện Tập (/practice).', 410);
  }

  // Legacy external Reader SSO removed (Reader is now natively integrated at /reader)
  if (path === '/api/v1/sso/reader/issue') {
    return errorResponse('SUBDOMAIN_REMOVED', 'Thư viện đọc đã được tích hợp trực tiếp tại /reader trên wordbridge.io.vn.', 410);
  }

  // Health & OpenAPI
  if (path === '/api/v1/health' && method === 'GET') {
    const langCount = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_languages WHERE code IN ('zh', 'en') AND is_active = 1").first();
    return jsonResponse({
      ok: true,
      service: 'WORD BRIDGE API',
      version: '4.2.0',
      domain: BRAND.websiteUrl,
      database: { name: 'word', status: 'connected', officialLanguages: langCount?.cnt || 0 },
      storage: { bucket: 'word', status: services.r2.isAvailable() ? 'connected' : 'unbound' },
      emailProvider: env.EMAIL_PROVIDER || 'unconfigured',
      learnerMeetProvider: env.LEARNER_MEET_PROVIDER || 'unconfigured',
      csrfProtection: 'enforced',
      timestamp: new Date().toISOString(),
    });
  }

  if (path === '/api/v1/openapi.json' && method === 'GET') {
    return jsonResponse({
      openapi: '3.1.0',
      info: { title: 'WORD BRIDGE Unified API', version: '4.2.0' },
      servers: [{ url: `${BRAND.websiteUrl}/api/v1` }],
      paths: {
        '/health': { get: { summary: 'Health & D1/R2 status' } },
        '/auth/register': { post: { summary: 'Đăng ký tài khoản Email/Mật khẩu' } },
        '/auth/login': { post: { summary: 'Đăng nhập tài khoản' } },
        '/auth/reset-password': { post: { summary: 'Đặt lại mật khẩu bằng token một lần' } },
        '/dictionary/search': { get: { summary: 'Tra cứu từ điển (yêu cầu đăng nhập)' } },
        '/specialized/terms': { get: { summary: 'Tra cứu 12 bộ thuật ngữ chuyên ngành' } },
        '/reader/documents': { get: { summary: 'Danh sách tài liệu Thư viện đọc (/reader)' } },
        '/reader/progress': { post: { summary: 'Lưu tiến độ đọc & ghi chú cá nhân' } },
        '/support/tickets': { get: { summary: 'Theo dõi yêu cầu hỗ trợ cá nhân' }, post: { summary: 'Gửi yêu cầu hỗ trợ / liên hệ' } },
        '/practice/submit': { post: { summary: 'Nộp bài luyện tập 6 kỹ năng' } },
      },
    });
  }

  // Real Audio R2 Stream Endpoint — Auth Required + Published Only
  const audioStreamMatch = path.match(/^\/api\/v1\/audio\/([^/]+)\/stream$/);
  if (audioStreamMatch && method === 'GET') {
    if (!user) return errorResponse('UNAUTHORIZED', 'Cần đăng nhập tài khoản WORD BRIDGE để nghe phát âm và audio học tập.', 401);
    const asset = await env.DB.prepare('SELECT * FROM wb_audio_assets WHERE id = ?').bind(audioStreamMatch[1]).first();
    if (!asset || asset.review_status !== 'published') {
      return errorResponse('AUDIO_NOT_FOUND', 'Không tìm thấy bản ghi âm thanh đã xuất bản.', 404);
    }
    try {
      const obj = await services.r2.getObject(asset.r2_object_key, { allowPrivate: true });
      if (!obj) {
        return errorResponse('AUDIO_ASSET_PENDING_UPLOAD', 'Tệp âm thanh hiện đang được cập nhật.', 404);
      }
      return new Response(obj.body, {
        status: 200,
        headers: { 'Content-Type': asset.content_type || 'audio/mpeg', 'Accept-Ranges': 'bytes' },
      });
    } catch (err) {
      return errorResponse('AUDIO_STREAM_ERROR', err.message, 403);
    }
  }

  // Public Reader Document Catalog & File Stream
  if (path === '/api/v1/reader/documents' && method === 'GET') {
    const docs = await services.reader.listDocuments({
      language: url.searchParams.get('language') || '',
      category: url.searchParams.get('category') || '',
      q: url.searchParams.get('q') || '',
    });
    return jsonResponse({ ok: true, documents: docs });
  }

  const readerFileMatch = path.match(/^\/api\/v1\/reader\/documents\/([^/]+)\/file$/);
  if (readerFileMatch && method === 'GET') {
    if (!user) return errorResponse('UNAUTHORIZED', 'Cần đăng nhập để tải tệp tài liệu Reader.', 401);
    const doc = await env.DB.prepare("SELECT * FROM wb_reader_documents WHERE id = ? AND review_status = 'published'").bind(readerFileMatch[1]).first();
    if (!doc || !doc.r2_object_key) {
      return errorResponse('READER_FILE_NOT_FOUND', 'Tài liệu không có tệp đính kèm trong R2.', 404);
    }
    try {
      const obj = await services.r2.getObject(doc.r2_object_key, { allowPrivate: true });
      if (!obj) return errorResponse('READER_FILE_MISSING', 'Không tìm thấy tệp trong R2 bucket `word`.', 404);
      return new Response(obj.body, {
        status: 200,
        headers: { 'Content-Type': doc.content_type || 'application/pdf' },
      });
    } catch (err) {
      return errorResponse('READER_FILE_ERROR', err.message, 403);
    }
  }

  // Public Catalog APIs
  if (path === '/api/v1/languages' && method === 'GET') {
    return jsonResponse({ ok: true, languages: Object.values(OFFICIAL_LANGUAGES) });
  }

  if (path === '/api/v1/programs' && method === 'GET') {
    const langParam = url.searchParams.get('language');
    const typeParam = url.searchParams.get('type');
    try {
      const clauses = [];
      const params = [];
      if (langParam) {
        const norm = typeParam === 'specialized' ? assertSpecializedLanguage(langParam) : assertOfficialLanguage(langParam);
        clauses.push('language_code = ?');
        params.push(norm);
      }
      if (typeParam) {
        clauses.push('program_type = ?');
        params.push(typeParam);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const res = await env.DB.prepare(`SELECT * FROM wb_programs ${where} ORDER BY language_code, code`).bind(...params).all();
      return jsonResponse({ ok: true, programs: res.results || [] });
    } catch (err) {
      return errorResponse('INVALID_LANGUAGE_SCOPE', err.message, 400);
    }
  }

  // Interactive Dictionary Search — Auth Required
  if (path === '/api/v1/dictionary/search' && method === 'GET') {
    if (!user) return errorResponse('UNAUTHORIZED', 'Cần đăng nhập để sử dụng tìm kiếm từ điển tương tác.', 401);
    const result = await services.dictionary.search({
      q: url.searchParams.get('q') || '',
      language: url.searchParams.get('language') || '',
      level: url.searchParams.get('level') || '',
      pos: url.searchParams.get('pos') || '',
      topic: url.searchParams.get('topic') || '',
      domain: url.searchParams.get('domain') || '',
      limit: Number(url.searchParams.get('limit') || 30),
      offset: Number(url.searchParams.get('offset') || 0),
    });
    if (result.error) return errorResponse('INVALID_LANGUAGE_SCOPE', result.error, 400);
    return jsonResponse({ ok: true, ...result });
  }

  if (path === '/api/v1/specialized/domains' && method === 'GET') {
    const langParam = url.searchParams.get('language');
    if (langParam) {
      try {
        const norm = assertSpecializedLanguage(langParam);
        return jsonResponse({ ok: true, domains: SPECIALIZED_DOMAINS.filter((d) => d.languages.includes(norm)) });
      } catch (err) {
        return errorResponse('SPECIALIZED_LANGUAGE_FORBIDDEN', err.message, 400);
      }
    }
    return jsonResponse({ ok: true, domains: SPECIALIZED_DOMAINS });
  }

  if (path === '/api/v1/specialized/terms' && method === 'GET') {
    if (!user) return errorResponse('UNAUTHORIZED', 'Cần đăng nhập để tra cứu thuật ngữ chuyên ngành.', 401);
    const domain = String(url.searchParams.get('domain') || '').trim().toLowerCase();
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const topic = String(url.searchParams.get('topic') || '').trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const dataset = typeof loadVocabJson === 'function' ? await loadVocabJson(domain) : null;
    if (!dataset || !Array.isArray(dataset.words)) {
      return errorResponse('DOMAIN_NOT_FOUND', `Không tìm thấy bộ thuật ngữ chuyên ngành: ${domain}`, 404);
    }
    let words = dataset.words;
    if (topic) words = words.filter((w) => String(w.t || '').toLowerCase().includes(topic));
    if (q) words = words.filter((w) => `${w.w || ''} ${w.m || ''} ${w.i || ''} ${w.t || ''}`.toLowerCase().includes(q));
    return jsonResponse({
      ok: true,
      domain: dataset.slug,
      nameVi: dataset.nameVi,
      language: dataset.language,
      total: words.length,
      words: words.slice(0, limit),
    });
  }

  // Signed Email Webhook
  if (path === '/api/v1/webhooks/email' && method === 'POST') {
    const rawBody = await request.text();
    const res = await services.email.verifyAndHandleWebhook({
      rawBody,
      signature: request.headers.get('X-WB-Signature') || request.headers.get('svix-signature'),
      timestamp: request.headers.get('X-WB-Webhook-Timestamp') || request.headers.get('svix-timestamp'),
      webhookEventId: request.headers.get('X-WB-Webhook-Id') || request.headers.get('svix-id'),
    });
    if (!res.ok) return errorResponse(res.code || 'WEBHOOK_ERROR', res.error, res.status);
    return jsonResponse(res, res.status);
  }

  // Unauthenticated Auth Routes
  if (path === '/api/v1/auth/register' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.auth.register(body, { ipAddress, userAgent });
    if (!res.ok) return errorResponse('REGISTRATION_FAILED', res.errors.join(' '), res.status, res.errors);
    return jsonResponse(res, 201);
  }

  if (path === '/api/v1/auth/verify-email' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.auth.verifyEmailToken(body.token, { ipAddress, userAgent });
    if (!res.ok) return errorResponse('VERIFICATION_FAILED', res.error, res.status);
    return jsonResponse(
      { ok: true, account: res.account, csrfToken: res.session.csrfToken },
      200,
      { 'Set-Cookie': buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }

  if (path === '/api/v1/auth/login' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.auth.login(body, { ipAddress, userAgent });
    if (!res.ok) return errorResponse('LOGIN_FAILED', res.error, res.status);
    return jsonResponse(
      { ok: true, account: res.account, csrfToken: res.session.csrfToken },
      200,
      { 'Set-Cookie': buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }

  if (path === '/api/v1/auth/forgot-password' && method === 'POST') {
    const body = await readJsonBody(request);
    return jsonResponse(await services.auth.requestPasswordReset(body.email, ipAddress));
  }

  if (path === '/api/v1/auth/reset-password' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.auth.resetPassword(body, { ipAddress, userAgent });
    if (!res.ok) return errorResponse('PASSWORD_RESET_FAILED', res.error, res.status);
    return jsonResponse(res);
  }

  if (path === '/api/v1/student-benefit/confirm' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.studentBenefit.confirmStudentEmail(body.token);
    if (!res.ok) return errorResponse('STUDENT_BENEFIT_CONFIRM_FAILED', res.error, res.status);
    return jsonResponse(res);
  }

  // Third-party OAuth login completely removed
  if (path.startsWith('/api/v1/auth/oauth/')) {
    return errorResponse('AUTH_METHOD_REMOVED', 'Phương thức đăng nhập bên thứ ba đã được gỡ bỏ hoàn toàn khỏi WORD BRIDGE. Vui lòng sử dụng Email/Mật khẩu hoặc Passkey.', 410);
  }

  // Passkey Authentication
  if (path === '/api/v1/account/passkeys/authenticate/options' && method === 'POST') {
    return jsonResponse(await services.auth.createPasskeyAuthOptions(null));
  }
  if (path === '/api/v1/account/passkeys/authenticate/verify' && method === 'POST') {
    const body = await readJsonBody(request);
    const res = await services.auth.verifyPasskeyAssertion(body, { ipAddress, userAgent });
    if (!res.ok) return errorResponse('PASSKEY_AUTH_FAILED', res.error, res.status);
    return jsonResponse(
      { ok: true, accountId: res.accountId, csrfToken: res.session.csrfToken },
      200,
      { 'Set-Cookie': buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, isSecure) }
    );
  }

  // ---- AUTHENTICATED ROUTES BELOW ----
  const authErr = requireAuth(user);
  if (authErr) return authErr;

  let body = {};
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    body = await readJsonBody(request);
    const csrfErr = requireCsrf(request, user, body);
    if (csrfErr) return csrfErr;
  }

  // Support/Contact Tickets (Create + List Own Tickets)
  if (path === '/api/v1/support/tickets' && method === 'GET') {
    const tickets = await services.admin.listUserSupportTickets(user.accountId);
    return jsonResponse({ ok: true, tickets });
  }
  if (path === '/api/v1/support/tickets' && method === 'POST') {
    const res = await services.admin.createSupportOrContactTicket({ ...body, accountId: user.accountId }, services.email);
    if (!res.ok) return errorResponse('VALIDATION_ERROR', res.error, res.status);
    return jsonResponse(res, 201);
  }

  // Reader Progress & Notes
  if (path === '/api/v1/reader/progress' && method === 'POST') {
    const res = await services.reader.saveProgress(user.accountId, {
      documentId: body.documentId,
      currentSection: body.currentSection,
      progressPercent: body.progressPercent,
      bookmarked: body.bookmarked === true || body.bookmarked === 'true',
      personalNotes: body.personalNotes,
    });
    if (!res.ok) return errorResponse('READER_PROGRESS_ERROR', res.error, res.status);
    return jsonResponse(res);
  }

  // Account Profile, Password, Sessions
  if (path === '/api/v1/account/profile' && (method === 'POST' || method === 'PATCH')) {
    const res = await services.auth.updateProfile(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse('PROFILE_UPDATE_FAILED', res.error, res.status);
    return jsonResponse(res);
  }
  if (path === '/api/v1/account/change-password' && method === 'POST') {
    const res = await services.auth.changePassword(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse('PASSWORD_CHANGE_FAILED', res.error, res.status);
    return jsonResponse(res);
  }
  if (path === '/api/v1/account/sessions/revoke' && method === 'POST') {
    if (!body.sessionId) return errorResponse('VALIDATION_ERROR', 'Thiếu sessionId.', 400);
    await services.auth.revokeSession(body.sessionId, user.accountId, ipAddress);
    return jsonResponse({ ok: true, sessionId: body.sessionId });
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    await services.auth.revokeSession(user.sessionId, user.accountId, ipAddress);
    return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(isSecure) });
  }

  if (path === '/api/v1/auth/me' && method === 'GET') {
    return jsonResponse({
      ok: true,
      user: {
        accountId: user.accountId,
        email: user.email,
        fullName: user.fullName,
        schoolName: user.schoolName,
        workplaceName: user.workplaceName,
        planCode: user.planCode,
        storageQuotaBytes: user.storageQuotaBytes,
        roles: user.roles,
        isAdmin: services.auth.hasAnyAdminRole(user),
        csrfToken: user.csrfToken,
      },
    });
  }

  // Passkey Registration & Revocation
  if (path === '/api/v1/account/passkeys/register/options' && method === 'POST') {
    return jsonResponse(await services.auth.createPasskeyRegistrationOptions(user));
  }
  if (path === '/api/v1/account/passkeys/register/verify' && method === 'POST') {
    const res = await services.auth.verifyAndStorePasskeyRegistration(user.accountId, body, ipAddress);
    if (!res.ok) return errorResponse('PASSKEY_REGISTER_FAILED', res.error, res.status);
    return jsonResponse(res, 201);
  }
  const pkDelMatch = path.match(/^\/api\/v1\/account\/passkeys\/([^/]+)$/);
  if (pkDelMatch && method === 'DELETE') {
    const res = await services.auth.revokePasskey(user.accountId, pkDelMatch[1], ipAddress);
    if (!res.ok) return errorResponse('PASSKEY_REVOKE_FAILED', res.error, res.status);
    return jsonResponse(res);
  }

  // Student Benefit Request
  if (path === '/api/v1/student-benefit/request' && method === 'POST') {
    const res = await services.studentBenefit.requestVerification(user.accountId, body);
    if (!res.ok) return errorResponse('STUDENT_BENEFIT_REJECTED', res.error, res.status);
    return jsonResponse(res, 201);
  }

  // Lesson Progress & Backend-Evaluated Completion
  if (path === '/api/v1/learning/progress' && method === 'POST') {
    if (!body.lessonId) return errorResponse('VALIDATION_ERROR', 'Thiếu lessonId.', 400);
    const lesson = await env.DB.prepare('SELECT * FROM wb_lessons WHERE id = ?').bind(body.lessonId).first();
    if (!lesson) return errorResponse('LESSON_NOT_FOUND', 'Bài học không tồn tại.', 404);

    const comp = JSON.parse(lesson.components_json || '{}');
    const checkQIds = Array.isArray(comp.checkQuestionIds) ? comp.checkQuestionIds : [];
    const submittedAnswers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const hasAnswers = Object.keys(submittedAnswers).length > 0;

    let score = null;
    let maxScore = null;
    let scorePercent = null;
    let lifecycleStatus = 'content_completed';
    let progressStatus = 'completed';
    const breakdown = [];

    if (checkQIds.length > 0 && hasAnswers) {
      let earned = 0;
      let total = 0;
      for (const qId of checkQIds) {
        const q = await env.DB.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first();
        if (!q || q.auto_gradable !== 1 || !q.correct_answer_json) continue;
        total += q.max_score;
        const expected = JSON.parse(q.correct_answer_json);
        const given = submittedAnswers[qId];
        const correct = String(given ?? '').trim().toLowerCase() === String(expected).trim().toLowerCase();
        if (correct) earned += q.max_score;
        breakdown.push({
          questionId: qId,
          prompt: q.prompt_text,
          given: given ?? '',
          expected,
          correct,
          explanationVi: q.explanation_vi,
        });
      }
      if (total > 0) {
        score = earned;
        maxScore = total;
        scorePercent = Number(((earned / total) * 100).toFixed(2));
        lifecycleStatus = scorePercent >= 70 ? 'passed' : 'graded';
        progressStatus = scorePercent >= 70 ? 'completed' : 'in_progress';
      }
    } else if (body.action === 'open') {
      lifecycleStatus = 'opened';
      progressStatus = 'in_progress';
    } else {
      lifecycleStatus = 'content_completed';
      progressStatus = 'completed';
      scorePercent = null;
    }

    const subId = generateId('lsub');
    await env.DB
      .prepare(`
        INSERT INTO wb_lesson_submissions (
          id, account_id, lesson_id, lifecycle_status, answers_json, breakdown_json,
          score, max_score, score_percent, skills_assessed_json, improvement_notes_vi, next_recommendation_vi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        subId, user.accountId, lesson.id, lifecycleStatus,
        JSON.stringify(submittedAnswers), JSON.stringify(breakdown),
        score, maxScore, scorePercent,
        JSON.stringify(['reading', 'vocabulary', 'grammar']),
        scorePercent !== null && scorePercent < 70
          ? 'Cần ôn lại phần từ vựng và cấu trúc ngữ pháp trọng tâm của bài trước khi chuyển buổi tiếp theo.'
          : 'Đã ghi nhận tiến độ bài học từ backend (không dùng điểm mặc định phía client).',
        'Ôn tập flashcard tại /vocabulary/review hoặc làm bài luyện tập tại /practice.'
      )
      .run();

    const existing = await env.DB
      .prepare('SELECT id FROM wb_learner_progress WHERE account_id = ? AND lesson_id = ?')
      .bind(user.accountId, lesson.id)
      .first();

    if (existing) {
      await env.DB
        .prepare(`
          UPDATE wb_learner_progress
          SET status = ?, score_percent = ?,
              time_spent_seconds = time_spent_seconds + ?,
              completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(progressStatus, scorePercent, Number(body.timeSpentSeconds || 0), progressStatus, existing.id)
        .run();
    } else {
      await env.DB
        .prepare(`
          INSERT INTO wb_learner_progress (id, account_id, week_id, lesson_id, status, score_percent, time_spent_seconds, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END)
        `)
        .bind(generateId('prg'), user.accountId, lesson.week_id, lesson.id, progressStatus, scorePercent, Number(body.timeSpentSeconds || 0), progressStatus)
        .run();
    }

    return jsonResponse({
      ok: true,
      submissionId: subId,
      lifecycleStatus,
      progressStatus,
      score,
      maxScore,
      scorePercent,
      breakdown,
    }, 201);
  }

  // Personal Vocabulary Sets CRUD
  if (path === '/api/v1/vocabulary/sets' && method === 'GET') {
    const sets = await services.dictionary.listSets(user.accountId);
    return jsonResponse({ ok: true, sets });
  }
  if (path === '/api/v1/vocabulary/sets' && method === 'POST') {
    const res = await services.dictionary.createSet(user.accountId, body);
    if (!res.ok) return errorResponse('SET_ERROR', res.error, res.status);
    return jsonResponse(res, 201);
  }
  const setMatch = path.match(/^\/api\/v1\/vocabulary\/sets\/([^/]+)$/);
  if (setMatch && method === 'PATCH') {
    const res = await services.dictionary.updateSet(user.accountId, setMatch[1], body);
    if (!res.ok) return errorResponse('SET_ERROR', res.error, res.status);
    return jsonResponse(res);
  }
  if (setMatch && method === 'DELETE') {
    const res = await services.dictionary.deleteSet(user.accountId, setMatch[1]);
    if (!res.ok) return errorResponse('SET_ERROR', res.error, res.status);
    return jsonResponse(res);
  }

  // Personal Vocabulary Notebook & SRS
  if (path === '/api/v1/vocabulary/notebook' && method === 'GET') {
    const rows = await env.DB
      .prepare('SELECT n.*, d.headword, d.phonetic, d.meaning_vi, d.language_code, d.slug, d.specialized_domain FROM wb_vocabulary_notebook n JOIN wb_dictionary_entries d ON d.id = n.entry_id WHERE n.account_id = ? ORDER BY n.created_at DESC')
      .bind(user.accountId)
      .all();
    return jsonResponse({ ok: true, items: rows.results || [] });
  }
  if (path === '/api/v1/vocabulary/notebook' && method === 'POST') {
    const resolveSpecializedTerm = async (domain, termNum) => {
      if (typeof loadVocabJson !== 'function') return null;
      const dataset = await loadVocabJson(domain);
      if (!dataset || !Array.isArray(dataset.words)) return null;
      const word = dataset.words.find((w) => Number(w.n) === Number(termNum)) || dataset.words[Number(termNum) - 1];
      if (!word) return null;
      return { word, language: dataset.language || 'en' };
    };
    const res = await services.dictionary.saveToNotebook(user.accountId, body, { resolveSpecializedTerm });
    if (!res.ok) return errorResponse('NOTEBOOK_ERROR', res.error, res.status);
    return jsonResponse(res, 201);
  }
  const nbItemMatch = path.match(/^\/api\/v1\/vocabulary\/notebook\/([^/]+)$/);
  if (nbItemMatch && method === 'PATCH') {
    const res = await services.dictionary.updateNotebookItem(user.accountId, nbItemMatch[1], body);
    if (!res.ok) return errorResponse('NOTEBOOK_ERROR', res.error, res.status);
    return jsonResponse(res);
  }
  if (nbItemMatch && method === 'DELETE') {
    const existing = await env.DB.prepare('SELECT id, account_id FROM wb_vocabulary_notebook WHERE id = ?').bind(nbItemMatch[1]).first();
    if (!existing) return errorResponse('NOT_FOUND', 'Không tìm thấy mục từ.', 404);
    if (existing.account_id !== user.accountId) return errorResponse('FORBIDDEN', 'Bạn không có quyền xóa dữ liệu của tài khoản khác.', 403);
    await env.DB.prepare('DELETE FROM wb_vocabulary_notebook WHERE id = ?').bind(existing.id).run();
    return jsonResponse({ ok: true });
  }
  if (path === '/api/v1/vocabulary/review' && method === 'POST') {
    const res = await services.dictionary.reviewFlashcard(user.accountId, body.notebookItemId, body.quality, {
      expectedReview: body.expectedReview,
    });
    if (!res.ok) return errorResponse(res.code || 'SRS_ERROR', res.error, res.status);
    return jsonResponse(res);
  }

  // Practice Submission & Ownership-checked Result (100% Preserved)
  if (path === '/api/v1/practice/submit' && method === 'POST') {
    const res = await services.practice.submitPractice(user.accountId, body.exerciseId, body.answers);
    if (!res.ok) return errorResponse('PRACTICE_ERROR', res.error, res.status);
    return jsonResponse(res, 201);
  }
  const prGetMatch = path.match(/^\/api\/v1\/practice\/results\/([^/]+)$/);
  if (prGetMatch && method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM wb_practice_results WHERE id = ?').bind(prGetMatch[1]).first();
    if (!row) return errorResponse('NOT_FOUND', 'Không tìm thấy kết quả luyện tập.', 404);
    if (row.account_id !== user.accountId && !services.auth.hasAnyAdminRole(user)) {
      return errorResponse('FORBIDDEN', 'Không có quyền xem kết quả của người dùng khác.', 403);
    }
    return jsonResponse({ ok: true, result: row });
  }

  // Learner Meet
  if (path.startsWith('/api/v1/learner-meet/') && /(chat|message|record|screen-share|file)/i.test(path)) {
    return errorResponse('LEARNER_MEET_PROHIBITED', 'Learner Meet tuyệt đối không hỗ trợ chat văn bản, gửi tệp, chia sẻ màn hình hoặc ghi âm/ghi hình.', 403);
  }
  if (path === '/api/v1/learner-meet/sessions' && method === 'POST') {
    try {
      const res = await services.learnerMeet.createSession(user.accountId, body);
      if (!res.ok) return errorResponse('LEARNER_MEET_ERROR', res.error, res.status);
      return jsonResponse(res, 201);
    } catch (err) {
      return errorResponse('INVALID_LANGUAGE_SCOPE', err.message, 400);
    }
  }
  if (path === '/api/v1/learner-meet/join' && method === 'POST') {
    const res = await services.learnerMeet.joinSession(user.accountId, body.sessionCode);
    if (!res.ok) return errorResponse('LEARNER_MEET_JOIN_ERROR', res.error, res.status);
    return jsonResponse(res);
  }

  // 15 Language Intelligence Systems
  const intelMatch = path.match(/^\/api\/v1\/intelligence\/([a-z0-9-]+)\/run$/);
  if (intelMatch && method === 'POST') {
    try {
      const res = await services.intelligence.executeSystem(user.accountId, intelMatch[1], body);
      if (!res.ok) return errorResponse('INTELLIGENCE_ERROR', res.error, res.status);
      return jsonResponse(res);
    } catch (err) {
      return errorResponse('INVALID_LANGUAGE_SCOPE', err.message, 400);
    }
  }

  // ---- SUPREME ADMIN APIs (/api/v1/admin/*) — Strict Backend RBAC + CSRF ----
  if (path.startsWith('/api/v1/admin/')) {
    if (!services.auth.hasAnyAdminRole(user)) {
      return errorResponse('FORBIDDEN', 'Tài khoản của bạn không có vai trò quản trị được cấp phép.', 403);
    }
    if (path === '/api/v1/admin/dashboard' && method === 'GET') {
      const metrics = await services.admin.getDashboardMetrics();
      return jsonResponse({ ok: true, metrics, plans: PLANS, intelligenceCount: INTELLIGENCE_SYSTEMS.length });
    }
    if (path === '/api/v1/admin/accounts' && method === 'GET') {
      const res = await services.admin.listAccounts(user, {
        q: url.searchParams.get('q') || '',
        status: url.searchParams.get('status') || '',
        verified: url.searchParams.get('verified') || '',
        limit: url.searchParams.get('limit') || 50,
        offset: url.searchParams.get('offset') || 0,
      });
      if (!res.ok) return errorResponse('RBAC_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/accounts/status' && (method === 'POST' || method === 'PATCH')) {
      const res = await services.admin.updateAccountStatus(user, body.accountId, body.action, body.reason || '', ipAddress);
      if (!res.ok) return errorResponse('ACCOUNT_ADMIN_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/staff' && method === 'GET') {
      const res = await services.admin.listStaffAndRoles(user);
      if (!res.ok) return errorResponse('RBAC_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/roles/assign' && method === 'POST') {
      const res = await services.admin.assignRole(user, body.accountId, body.roleCode, ipAddress);
      if (!res.ok) return errorResponse('RBAC_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/roles/revoke' && method === 'POST') {
      const res = await services.admin.revokeRole(user, body.accountId, body.roleCode, ipAddress);
      if (!res.ok) return errorResponse('RBAC_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/academic' && method === 'GET') {
      const res = await services.admin.getAcademicOverview(user);
      if (!res.ok) return errorResponse('ACADEMIC_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/reader/documents' && method === 'POST') {
      if (!services.auth.hasPermission(user, 'reader:manage') && !services.auth.hasPermission(user, 'curriculum:create')) {
        return errorResponse('FORBIDDEN', 'Thiếu quyền reader:manage hoặc curriculum:create.', 403);
      }
      try {
        const res = await services.reader.createDocument(user, body);
        if (!res.ok) return errorResponse('READER_CREATE_ERROR', res.error, res.status);
        await services.auth.recordAudit(user.accountId, 'reader.document_created', 'wb_reader_documents', res.documentId, ipAddress, { slug: res.slug });
        return jsonResponse(res, 201);
      } catch (err) {
        return errorResponse('READER_CREATE_ERROR', err.message, 400);
      }
    }
    if (path === '/api/v1/admin/data/status' && method === 'GET') {
      const res = await services.admin.getDataAndStorageStatus(user);
      if (!res.ok) return errorResponse('DATA_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/data/snapshot' && method === 'POST') {
      const res = await services.admin.runIntegrityCheckOrBackup(user, body.snapshotType || 'integrity_check', ipAddress);
      if (!res.ok) return errorResponse('DATA_SNAPSHOT_ERROR', res.error, res.status);
      return jsonResponse(res, 201);
    }
    if (path === '/api/v1/admin/security' && method === 'GET') {
      const res = await services.admin.getSecurityOverview(user);
      if (!res.ok) return errorResponse('SECURITY_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/security/revoke-session' && method === 'POST') {
      const res = await services.admin.revokeSessionByAdmin(user, body.sessionId, ipAddress);
      if (!res.ok) return errorResponse('SECURITY_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/operations' && method === 'GET') {
      const res = await services.admin.getOperationsOverview(user);
      if (!res.ok) return errorResponse('OPERATIONS_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/config' && (method === 'POST' || method === 'PATCH')) {
      const res = await services.admin.updatePlatformConfig(user, body.configKey, body.configValue, ipAddress);
      if (!res.ok) return errorResponse('CONFIG_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/notifications' && method === 'POST') {
      const res = await services.admin.createNotification(user, body, ipAddress);
      if (!res.ok) return errorResponse('NOTIFICATION_ERROR', res.error, res.status);
      return jsonResponse(res, 201);
    }
    if (path === '/api/v1/admin/support/reply' && method === 'POST') {
      const res = await services.admin.replySupportTicket(user, body.ticketId, body, ipAddress);
      if (!res.ok) return errorResponse('SUPPORT_REPLY_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/jobs/action' && method === 'POST') {
      const res = await services.admin.toggleBackgroundJob(user, body.jobName, body.action, ipAddress);
      if (!res.ok) return errorResponse('JOB_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/content/status' && method === 'PATCH') {
      const res = await services.admin.updateContentStatus(user, body.tableName, body.itemId, body.newStatus, ipAddress);
      if (!res.ok) return errorResponse('CMS_STATUS_ERROR', res.error, res.status);
      return jsonResponse(res);
    }
    if (path === '/api/v1/admin/programs' && method === 'POST') {
      if (!services.auth.hasPermission(user, 'curriculum:create')) {
        return errorResponse('FORBIDDEN', 'Thiếu quyền curriculum:create.', 403);
      }
      try {
        const lang = body.programType === 'specialized'
          ? assertSpecializedLanguage(body.languageCode)
          : assertOfficialLanguage(body.languageCode);
        const id = generateId('prg');
        await env.DB
          .prepare(`
            INSERT INTO wb_programs (id, code, slug, name_vi, language_code, program_type, entry_level, target_level, target_audience, prerequisites, total_modules, total_weeks, sessions_per_week, estimated_hours, overall_objectives, learning_outcomes, assessment_methods, completion_criteria, review_status, author_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
          `)
          .bind(
            id, String(body.code || id).toUpperCase(), String(body.slug || id).toLowerCase(),
            String(body.nameVi || '').trim(), lang, body.programType || 'general',
            body.entryLevel || 'Cơ bản', body.targetLevel || 'Trung cấp',
            body.targetAudience || 'Người học WORD BRIDGE', body.prerequisites || 'Không yêu cầu',
            Number(body.totalModules || 1), Number(body.totalWeeks || 12), Number(body.sessionsPerWeek || 3),
            Number(body.estimatedHours || 36), body.overallObjectives || 'Mục tiêu học thuật',
            body.learningOutcomes || 'Chuẩn đầu ra học thuật', body.assessmentMethods || 'Kiểm tra tuần',
            body.completionCriteria || 'Đạt >= 70%', user.fullName
          )
          .run();
        await services.auth.recordAudit(user.accountId, 'cms.program_created', 'wb_programs', id, ipAddress, { lang });
        return jsonResponse({ ok: true, programId: id, reviewStatus: 'draft' }, 201);
      } catch (err) {
        return errorResponse('CMS_CREATE_ERROR', err.message, 400);
      }
    }
    if (path === '/api/v1/admin/intelligence/status' && method === 'PATCH') {
      if (!services.auth.hasPermission(user, 'operations:manage') && !services.auth.hasPermission(user, 'infrastructure:manage')) {
        return errorResponse('FORBIDDEN', 'Thiếu quyền cập nhật trạng thái Intelligence Systems.', 403);
      }
      const allowed = new Set(['active', 'unconfigured', 'paused', 'error', 'not_implemented']);
      if (!allowed.has(body.operationalStatus)) {
        return errorResponse('VALIDATION_ERROR', 'Trạng thái vận hành không hợp lệ.', 400);
      }
      await env.DB
        .prepare("UPDATE wb_intelligence_status SET operational_status = ?, admin_note_vi = COALESCE(?, admin_note_vi), updated_by = ?, updated_at = datetime('now') WHERE system_slug = ?")
        .bind(body.operationalStatus, body.adminNoteVi ?? null, user.accountId, body.systemSlug)
        .run();
      await services.auth.recordAudit(user.accountId, 'intelligence.status_updated', 'wb_intelligence_status', body.systemSlug, ipAddress, { operationalStatus: body.operationalStatus });
      return jsonResponse({ ok: true, systemSlug: body.systemSlug, operationalStatus: body.operationalStatus });
    }
  }

  return errorResponse('NOT_FOUND', `API endpoint không tồn tại: ${method} ${path}`, 404);
}
