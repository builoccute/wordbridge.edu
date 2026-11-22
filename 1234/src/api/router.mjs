/**
 * WORD BRIDGE — Comprehensive Backend API & Policy Enforcement Router
 *
 * Enforces:
 * - Public View vs Authenticated Action Principle (Section IV.13):
 *   Guests can view public pages, lessons, exercises, program info, and public dictionary entries,
 *   but backend strictly returns 401 Unauthorized if an unauthenticated guest attempts to:
 *   start a lesson, query/search dictionary interactively, save vocabulary, submit an exercise,
 *   take an exam, save progress, join Learner Meet, or save personal results.
 * - Prohibited Features (Section IV.14):
 *   - No certificates
 *   - No social network features (posts, feed, comments, reactions, friends, follow, public chat)
 *   - No chat or recording or screen-sharing in Learner Meet
 *   - No organization accounts
 * - Email & Password Registration with 8 Mandatory Fields (separate School & Workplace),
 *   link-based email verification (NO OTP), and auto-login upon link verification.
 * - OAuth (Google, Facebook, Microsoft, Apple) with post-auth missing profile completion
 *   and NO auto-linking merely by matching email.
 * - WebAuthn / FIDO2 Passkey registration, listing, renaming, and revocation (Zero biometrics stored).
 * - Student Policy: 3 months free Personal Plus, once only, verified strictly via school-issued
 *   student email link (NO student ID card upload accepted), auto-downgrade to Personal Free after 3 months.
 */

import {
  generateId,
  generateRandomToken,
  sha256Hex,
  hashPassword,
  verifyPassword,
  validateRegistrationInput,
  sanitizeText,
  detectSqlInjectionPattern,
  checkRateLimit,
  buildSecurityHeaders,
  parseCookies,
  serializeSessionCookie,
} from '../utils/security.mjs';
import { createLocalD1CompatibleStore, D1_DATABASE_METADATA, assertSafeSqlStatement } from '../services/d1-database.mjs';
import { R2StorageManager, R2_BUCKET_METADATA, ALLOWED_R2_PREFIXES } from '../services/r2-storage.mjs';
import { EmailDeliveryAdapter, EMAIL_TEMPLATES_CATALOG, OFFICIAL_EMAIL_ADDRESSES, renderEmailTemplate } from '../services/email-service.mjs';
import {
  FIFTEEN_SYSTEMS_SPEC,
  computeLanguageDna,
  analyzeLanguageTransfer,
  runKnowledgeToLanguage,
  evaluateSimulatorStep,
  analyzeErrorGenome,
  lookupMeaningEquivalence,
  computeLanguageTimeline,
  evaluatePronunciation,
  queryMultiLanguageGraph,
  analyzePersonalCorpus,
  evaluateContextReconstruction,
  scoreComprehensionDepth,
  computeLearningRecovery,
  evaluateLanguageQualityBenchmark,
  generatePersonalObservatoryReport,
} from '../modules/language-intelligence/engine.mjs';
import {
  LEARNER_MEET_PRIVACY_DISCLOSURE_VI,
  LEARNER_MEET_POLICY_ENFORCEMENT,
  assertProhibitedLearnerMeetAction,
  createLearnerMeetSessionRecord,
  getPdfReaderSsoStatus,
  ADMIN_MODULE_GROUPS_VI,
  SEVEN_ADMIN_CENTERS_VI,
  NINE_ADMIN_ROLES_VI,
} from '../modules/administration/legacy-domains.mjs';
import { calculateNextSpacedRepetition, gradeExamSubmission } from '../modules/examination/learning-rules.mjs';

export function createWordBridgeRuntime(env = {}) {
  const store = createLocalD1CompatibleStore();
  const state = store._state;
  const r2 = new R2StorageManager(env.STORAGE || null);
  const emailer = new EmailDeliveryAdapter(env);

  function getAuthenticatedSession(request) {
    const authHeader = request.headers.get('Authorization') || '';
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const rawToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : cookies.wb_session || '';
    if (!rawToken) return null;

    const session = state.sessions.find(
      (s) => s.raw_token === rawToken && s.revoked === 0 && new Date(s.expires_at).getTime() > Date.now()
    );
    if (!session) return null;

    const account = state.accounts.find((a) => a.id === session.account_id);
    if (!account || account.account_status === 'SUSPENDED') return null;

    const profile = state.profiles.find((p) => p.account_id === account.id) || null;
    const roles = state.account_roles.filter((r) => r.account_id === account.id).map((r) => r.role_code);
    const subscription = resolveSubscriptionState(account.id);

    session.last_active_at = new Date().toISOString();
    return { session, account, profile, roles, subscription };
  }

  function resolveSubscriptionState(accountId) {
    let sub = state.subscription_entitlements.find((s) => s.account_id === accountId);
    if (!sub) {
      sub = {
        account_id: accountId,
        plan_code: 'PERSONAL_FREE',
        status: 'ACTIVE',
        is_student_benefit: 0,
        student_edu_email: null,
        student_verified_at: null,
        student_benefit_claimed_once: 0,
        starts_at: new Date().toISOString(),
        expires_at: null,
        updated_at: new Date().toISOString(),
      };
      state.subscription_entitlements.push(sub);
    }
    // Check 3-month student promo expiration -> automatic fallback to PERSONAL_FREE
    if (sub.plan_code === 'PERSONAL_PLUS' && sub.expires_at) {
      if (new Date(sub.expires_at).getTime() <= Date.now()) {
        sub.plan_code = 'PERSONAL_FREE';
        sub.status = 'DOWNGRADED';
        sub.updated_at = new Date().toISOString();
      }
    }
    return sub;
  }

  function recordSecurityEvent({ accountId = null, eventType, severity = 'INFO', ip = '127.0.0.1', userAgent = '', details = {} }) {
    const ev = {
      id: generateId('sec'),
      account_id: accountId,
      event_type: eventType,
      severity,
      ip_address: ip,
      user_agent: userAgent,
      details_json: JSON.stringify(details),
      created_at: new Date().toISOString(),
    };
    state.security_events.unshift(ev);
    return ev;
  }

  function recordAuditLog({ actorAccountId, action, targetType, targetId, before = null, after = null, ip = '127.0.0.1' }) {
    const entry = {
      id: generateId('aud'),
      actor_account_id: actorAccountId,
      action,
      target_type: targetType,
      target_id: targetId,
      before_json: before ? JSON.stringify(before) : null,
      after_json: after ? JSON.stringify(after) : null,
      ip_address: ip,
      created_at: new Date().toISOString(),
    };
    state.audit_logs.unshift(entry);
    return entry;
  }

  function requireCsrfIfCookieAuth(request, authCtx) {
    if (!authCtx) return { ok: true };
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      return { ok: true };
    }
    const csrfHeader = request.headers.get('X-CSRF-Token') || '';
    if (!csrfHeader || csrfHeader !== authCtx.session.csrf_token) {
      return {
        ok: false,
        errorVi: 'Từ chối yêu cầu: Thiếu hoặc sai mã bảo vệ CSRF (X-CSRF-Token).',
      };
    }
    return { ok: true };
  }

  function jsonResponse(data, status = 200, extraHeaders = {}) {
    const baseHeaders = buildSecurityHeaders(env.APP_URL || 'https://www.wordbridge.vn');
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        ...extraHeaders,
      },
    });
  }

  async function handleApiRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const userAgent = request.headers.get('User-Agent') || 'WordBridgeClient/1.0';

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: buildSecurityHeaders() });
    }

    // Global API Rate Limiting
    const rl = checkRateLimit(`api:${clientIp}:${path}`, path.startsWith('/api/auth/') ? 20 : 120, 60000);
    if (!rl.allowed) {
      recordSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'WARNING',
        ip: clientIp,
        userAgent,
        details: { path },
      });
      return jsonResponse(
        { error: 'RATE_LIMITED', messageVi: 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.' },
        429
      );
    }

    // Check SQL Injection payload in query parameters
    for (const [k, v] of url.searchParams.entries()) {
      if (detectSqlInjectionPattern(v)) {
        recordSecurityEvent({
          eventType: 'SQL_INJECTION_BLOCKED',
          severity: 'HIGH',
          ip: clientIp,
          userAgent,
          details: { param: k, value: v },
        });
        return jsonResponse(
          { error: 'MALICIOUS_INPUT_BLOCKED', messageVi: 'Yêu cầu chứa chuỗi truy vấn không an toàn và đã bị hệ thống bảo mật chặn.' },
          400
        );
      }
    }

    let body = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const text = await request.text();
        if (text) {
          if (detectSqlInjectionPattern(text)) {
            recordSecurityEvent({
              eventType: 'SQL_INJECTION_BODY_BLOCKED',
              severity: 'HIGH',
              ip: clientIp,
              userAgent,
              details: { path },
            });
            return jsonResponse(
              { error: 'MALICIOUS_INPUT_BLOCKED', messageVi: 'Dữ liệu đầu vào chứa mẫu tấn công SQL Injection và đã bị chặn.' },
              400
            );
          }
          body = JSON.parse(text);
        }
      } catch {
        return jsonResponse({ error: 'INVALID_JSON', messageVi: 'Định dạng dữ liệu JSON không hợp lệ.' }, 400);
      }
    }

    const authCtx = getAuthenticatedSession(request);

    // Block prohibited features explicitly (Section IV.14)
    if (
      path.includes('/certificates') ||
      path.includes('/certificate') ||
      path.includes('/social') ||
      path.includes('/friends') ||
      path.includes('/feed') ||
      path.includes('/organizations')
    ) {
      return jsonResponse(
        {
          error: 'PROHIBITED_PRODUCT_FEATURE',
          messageVi:
            'Theo quy định kiến trúc sản phẩm WORD BRIDGE (PHẦN IV Mục 14): Hệ thống tuyệt đối không xây dựng tính năng Chứng chỉ, Mạng xã hội hoặc Tài khoản tổ chức.',
        },
        403
      );
    }

    // -------------------------------------------------------------------------
    // 1. PLATFORM METADATA & PUBLIC OVERVIEW (Publicly Viewable)
    // -------------------------------------------------------------------------
    if (method === 'GET' && path === '/api/health') {
      return jsonResponse({
        status: 'OK',
        platform: 'WORD BRIDGE',
        tagline: 'Where Languages Bring People Together.',
        website: 'https://www.wordbridge.vn/',
        d1Database: D1_DATABASE_METADATA,
        r2Bucket: R2_BUCKET_METADATA,
        supportedLanguages: state.languages,
        prohibitedFeaturesEnforced: {
          certificates: false,
          socialNetwork: false,
          learnerMeetChat: false,
          learnerMeetRecording: false,
          learnerMeetScreenShare: false,
          organizationAccounts: false,
          japaneseOrKorean: false,
          russianSpecialized: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (method === 'GET' && path === '/api/public/catalog') {
      const langFilter = url.searchParams.get('lang');
      const programs = langFilter
        ? state.learning_programs.filter((p) => p.language_code === langFilter)
        : state.learning_programs;
      const courses = langFilter
        ? state.courses.filter((c) => c.language_code === langFilter)
        : state.courses;
      const lessons = state.lessons.map((l) => ({
        id: l.id,
        course_id: l.course_id,
        language_code: l.language_code,
        slug: l.slug,
        title_vi: l.title_vi,
        title_target: l.title_target,
        objectives: JSON.parse(l.objectives_json || '[]'),
        vocabulary: JSON.parse(l.vocabulary_json || '[]'),
        grammar: JSON.parse(l.grammar_json || '[]'),
        new_knowledge_html: l.new_knowledge_html,
        examples: JSON.parse(l.examples_json || '[]'),
        context_dialogue: JSON.parse(l.context_dialogue_json || '[]'),
        status: l.status,
        publicViewAllowed: true,
        startLessonRequiresAuth: true,
      }));
      const publicDictionary = state.dictionary_entries
        .filter((d) => d.is_public_preview === 1)
        .map((d) => ({
          id: d.id,
          language_code: d.language_code,
          headword: d.headword,
          phonetic: d.phonetic,
          part_of_speech: d.part_of_speech,
          meaning_vi: d.meaning_vi,
          definition_target: d.definition_target,
          examples: JSON.parse(d.examples_json || '[]'),
          usage_context: d.usage_context,
          synonyms: JSON.parse(d.synonyms_json || '[]'),
          antonyms: JSON.parse(d.antonyms_json || '[]'),
          word_family: JSON.parse(d.word_family_json || '[]'),
          collocations: JSON.parse(d.collocations_json || '[]'),
          radicals_stroke: JSON.parse(d.radicals_stroke_json || '{}'),
          is_specialized: d.is_specialized === 1,
          specialized_domain: d.specialized_domain,
          level_code: d.level_code,
        }));
      const publicExercises = state.exercises.map((e) => ({
        id: e.id,
        lesson_id: e.lesson_id,
        language_code: e.language_code,
        skill_type: e.skill_type,
        exercise_format: e.exercise_format,
        level_code: e.level_code,
        title_vi: e.title_vi,
        prompt_text: e.prompt_text,
        options: JSON.parse(e.options_json || '[]'),
        publicViewAllowed: true,
        submissionRequiresAuth: true,
      }));
      const publicExams = state.exams.map((ex) => ({
        id: ex.id,
        language_code: ex.language_code,
        code: ex.code,
        title_vi: ex.title_vi,
        standard_ref: ex.standard_ref,
        level_code: ex.level_code,
        duration_minutes: ex.duration_minutes,
        passing_score_percent: ex.passing_score_percent,
        sections: JSON.parse(ex.sections_json || '[]'),
        certificateIssued: false,
        takingExamRequiresAuth: true,
      }));

      return jsonResponse({
        languages: state.languages,
        programs,
        courses,
        lessons,
        publicDictionary,
        publicExercises,
        publicExams,
        fifteenSystems: FIFTEEN_SYSTEMS_SPEC,
      });
    }

    // -------------------------------------------------------------------------
    // 2. AUTHENTICATION, REGISTRATION, EMAIL VERIFICATION, OAUTH & PASSKEYS
    // -------------------------------------------------------------------------
    if (method === 'POST' && path === '/api/auth/register') {
      if (body.accountType === 'ORGANIZATION' || body.organizationAccount) {
        return jsonResponse(
          {
            error: 'ORGANIZATION_ACCOUNTS_PROHIBITED',
            messageVi: 'WORD BRIDGE chỉ hỗ trợ tài khoản cá nhân (PHẦN IV Mục 14.5 & PHẦN IX Mục 26). Không tạo tài khoản tổ chức.',
          },
          400
        );
      }

      const validation = validateRegistrationInput(body);
      if (!validation.valid) {
        return jsonResponse({ error: 'VALIDATION_ERROR', errors: validation.errors }, 400);
      }

      const { fullName, dateOfBirth, phoneNumber, email, password, schoolName, workplaceName } = validation.cleaned;
      const existing = state.accounts.find((a) => a.email === email);
      if (existing) {
        return jsonResponse({ error: 'EMAIL_EXISTS', messageVi: 'Địa chỉ email này đã được đăng ký trên hệ thống.' }, 409);
      }

      const { hashHex, saltHex } = await hashPassword(password);
      const accountId = generateId('acc');
      const now = new Date().toISOString();

      const newAccount = {
        id: accountId,
        email,
        password_hash: hashHex,
        password_salt: saltHex,
        email_verified: 0,
        email_verified_at: null,
        account_status: 'PENDING_VERIFICATION',
        profile_completed: 1,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      };
      state.accounts.push(newAccount);

      const newProfile = {
        account_id: accountId,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        phone_number: phoneNumber,
        school_name: schoolName,
        workplace_name: workplaceName,
        ui_language: 'vi',
        primary_learning_language: 'en',
        avatar_r2_key: null,
        bio: '',
        created_at: now,
        updated_at: now,
      };
      state.profiles.push(newProfile);

      // Default personal role is LEARNER ONLY (Never grant admin role by default - Section X.35)
      state.account_roles.push({
        account_id: accountId,
        role_code: 'LEARNER',
        granted_by: 'system',
        approval_note: 'Vai trò người học cá nhân mặc định khi đăng ký',
        granted_at: now,
      });

      resolveSubscriptionState(accountId);

      // Create link-based verification token (NO OTP used)
      const rawVerifyToken = generateRandomToken(24);
      const tokenHash = await sha256Hex(rawVerifyToken);
      const verifyUrl = `${env.APP_URL || 'https://www.wordbridge.vn'}/api/auth/verify-email?token=${rawVerifyToken}`;

      state.email_verification_tokens.push({
        id: generateId('evt'),
        account_id: accountId,
        token_hash: tokenHash,
        purpose: 'EMAIL_VERIFY',
        target_email: email,
        raw_token_for_dev_verification: rawVerifyToken,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        consumed_at: null,
        created_at: now,
      });

      const emailResult = await emailer.sendTemplatedEmail({
        templateCode: 'EMAIL_VERIFICATION',
        to: email,
        accountId,
        variables: {
          recipientName: fullName,
          headline: 'Xác minh địa chỉ email kích hoạt tài khoản WORD BRIDGE',
          bodyText:
            'Cảm ơn bạn đã đăng ký tài khoản cá nhân tại WORD BRIDGE. Vui lòng nhấn vào liên kết xác minh bên dưới để kích hoạt tài khoản và tự động đăng nhập (Hệ thống sử dụng liên kết xác minh bảo mật, không dùng mã OTP).',
          ctaLabel: 'Xác minh Email & Tự động Đăng nhập',
          ctaUrl: verifyUrl,
        },
      });
      state.email_records.push(emailResult);

      recordSecurityEvent({
        accountId,
        eventType: 'ACCOUNT_REGISTERED_PENDING_VERIFICATION',
        severity: 'INFO',
        ip: clientIp,
        userAgent,
        details: { email, verificationDeliveryStatus: emailResult.deliveryStatus },
      });

      return jsonResponse(
        {
          messageVi:
            'Tài khoản chưa xác minh đã được khởi tạo. Vui lòng mở liên kết xác minh email để kích hoạt và tự động đăng nhập.',
          accountId,
          accountStatus: 'PENDING_VERIFICATION',
          verificationMethod: 'EMAIL_LINK_ONLY_NO_OTP',
          verificationUrlPreview: verifyUrl,
          verificationToken: rawVerifyToken,
          emailDispatchStatus: emailResult.deliveryStatus,
        },
        201
      );
    }

    // Email Verification Link Handler -> Verifies Email & Auto-Logs In User (Section IX.27 steps 5-7)
    if ((method === 'GET' || method === 'POST') && path === '/api/auth/verify-email') {
      const rawToken = url.searchParams.get('token') || body.token || '';
      if (!rawToken) {
        return jsonResponse({ error: 'MISSING_TOKEN', messageVi: 'Thiếu mã liên kết xác minh email.' }, 400);
      }
      const tokenHash = await sha256Hex(rawToken);
      const tokenRecord = state.email_verification_tokens.find(
        (t) => t.token_hash === tokenHash && t.purpose === 'EMAIL_VERIFY' && !t.consumed_at
      );

      if (!tokenRecord || new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
        return jsonResponse(
          { error: 'INVALID_OR_EXPIRED_TOKEN', messageVi: 'Liên kết xác minh email không hợp lệ hoặc đã hết hạn.' },
          400
        );
      }

      const account = state.accounts.find((a) => a.id === tokenRecord.account_id);
      if (!account) {
        return jsonResponse({ error: 'ACCOUNT_NOT_FOUND', messageVi: 'Không tìm thấy tài khoản.' }, 404);
      }

      const now = new Date().toISOString();
      tokenRecord.consumed_at = now;
      account.email_verified = 1;
      account.email_verified_at = now;
      account.account_status = 'ACTIVE';
      account.last_login_at = now;
      account.updated_at = now;

      // Step 7: Automatically create an authenticated session upon valid email link verification
      const rawSessionToken = generateRandomToken(32);
      const sessionHash = await sha256Hex(rawSessionToken);
      const csrfToken = generateRandomToken(16);
      const sessionObj = {
        id: generateId('sess'),
        account_id: account.id,
        token_hash: sessionHash,
        raw_token: rawSessionToken,
        csrf_token: csrfToken,
        ip_address: clientIp,
        user_agent: userAgent,
        device_label: 'Trình duyệt xác minh Email',
        auth_method: 'email_verification',
        expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        revoked: 0,
        created_at: now,
        last_active_at: now,
      };
      state.sessions.push(sessionObj);

      recordSecurityEvent({
        accountId: account.id,
        eventType: 'EMAIL_VERIFIED_AND_AUTO_LOGGED_IN',
        severity: 'INFO',
        ip: clientIp,
        userAgent,
      });

      const cookieHeader = serializeSessionCookie('wb_session', rawSessionToken, 7 * 86400, true);
      const profile = state.profiles.find((p) => p.account_id === account.id);
      const roles = state.account_roles.filter((r) => r.account_id === account.id).map((r) => r.role_code);

      return jsonResponse(
        {
          messageVi: 'Xác minh email thành công! Hệ thống đã tự động đăng nhập vào tài khoản của bạn.',
          autoLoggedIn: true,
          sessionToken: rawSessionToken,
          csrfToken,
          account: {
            id: account.id,
            email: account.email,
            emailVerified: true,
            status: account.account_status,
            roles,
          },
          profile,
        },
        200,
        { 'Set-Cookie': cookieHeader }
      );
    }

    // Login with Email & Password (with Brute-Force Lockout Protection)
    if (method === 'POST' && path === '/api/auth/login') {
      const email = sanitizeText(body.email, 160).toLowerCase();
      const password = String(body.password || '');

      const account = state.accounts.find((a) => a.email === email);
      if (!account) {
        return jsonResponse({ error: 'INVALID_CREDENTIALS', messageVi: 'Email hoặc mật khẩu không chính xác.' }, 401);
      }

      if (account.locked_until && new Date(account.locked_until).getTime() > Date.now()) {
        return jsonResponse(
          {
            error: 'ACCOUNT_LOCKED_BRUTE_FORCE',
            messageVi: 'Tài khoản tạm khóa bảo vệ chống dò mật khẩu (Brute-force). Vui lòng thử lại sau 15 phút.',
          },
          423
        );
      }

      const validPassword = await verifyPassword(password, account.password_hash, account.password_salt);
      if (!validPassword) {
        account.failed_login_attempts = (account.failed_login_attempts || 0) + 1;
        if (account.failed_login_attempts >= 5) {
          account.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          recordSecurityEvent({
            accountId: account.id,
            eventType: 'BRUTE_FORCE_LOCKOUT_TRIGGERED',
            severity: 'HIGH',
            ip: clientIp,
            userAgent,
          });
        }
        return jsonResponse({ error: 'INVALID_CREDENTIALS', messageVi: 'Email hoặc mật khẩu không chính xác.' }, 401);
      }

      if (!account.email_verified) {
        return jsonResponse(
          {
            error: 'EMAIL_NOT_VERIFIED',
            messageVi: 'Tài khoản chưa xác minh email. Vui lòng mở liên kết xác minh đã gửi qua email.',
          },
          403
        );
      }

      account.failed_login_attempts = 0;
      account.locked_until = null;
      account.last_login_at = new Date().toISOString();

      const rawSessionToken = generateRandomToken(32);
      const sessionHash = await sha256Hex(rawSessionToken);
      const csrfToken = generateRandomToken(16);
      const now = new Date().toISOString();

      state.sessions.push({
        id: generateId('sess'),
        account_id: account.id,
        token_hash: sessionHash,
        raw_token: rawSessionToken,
        csrf_token: csrfToken,
        ip_address: clientIp,
        user_agent: userAgent,
        device_label: body.deviceLabel || 'Trình duyệt Web',
        auth_method: 'password',
        expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        revoked: 0,
        created_at: now,
        last_active_at: now,
      });

      recordSecurityEvent({
        accountId: account.id,
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        ip: clientIp,
        userAgent,
      });

      const profile = state.profiles.find((p) => p.account_id === account.id);
      const roles = state.account_roles.filter((r) => r.account_id === account.id).map((r) => r.role_code);
      const cookieHeader = serializeSessionCookie('wb_session', rawSessionToken, 7 * 86400, true);

      return jsonResponse(
        {
          messageVi: 'Đăng nhập thành công.',
          sessionToken: rawSessionToken,
          csrfToken,
          account: {
            id: account.id,
            email: account.email,
            emailVerified: Boolean(account.email_verified),
            profileCompleted: Boolean(account.profile_completed),
            roles,
          },
          profile,
        },
        200,
        { 'Set-Cookie': cookieHeader }
      );
    }

    // OAuth Federated Login Handler (Google, Facebook, Microsoft, Apple)
    // Enforces Section IX.28:
    // - Never auto-links accounts merely because email matches an existing account.
    // - If provider confirms email is reliably verified, does not require re-verification.
    // - Requires completing missing mandatory profile fields (DOB, Phone, School, Workplace) after auth.
    if (method === 'POST' && path === '/api/auth/oauth/callback') {
      const provider = String(body.provider || '').toLowerCase();
      if (!['google', 'facebook', 'microsoft', 'apple'].includes(provider)) {
        return jsonResponse({ error: 'UNSUPPORTED_OAUTH_PROVIDER', messageVi: 'Nhà cung cấp OAuth chỉ hỗ trợ Google, Facebook, Microsoft và Apple.' }, 400);
      }

      const providerUserId = sanitizeText(body.providerUserId, 128);
      const providerEmail = sanitizeText(body.email, 160).toLowerCase();
      const providerEmailVerified = Boolean(body.emailVerified);
      const fullName = sanitizeText(body.fullName || 'Học viên OAuth', 120);

      if (!providerUserId || !providerEmail) {
        return jsonResponse({ error: 'MISSING_OAUTH_CLAIMS', messageVi: 'Thiếu thông tin định danh từ nhà cung cấp OAuth.' }, 400);
      }

      // Check if this exact (provider, provider_user_id) is already linked
      const existingOauth = state.oauth_identities.find(
        (o) => o.provider === provider && o.provider_user_id === providerUserId
      );

      let account = null;
      if (existingOauth) {
        account = state.accounts.find((a) => a.id === existingOauth.account_id);
      } else {
        // Check if an account with the same email already exists
        const emailCollision = state.accounts.find((a) => a.email === providerEmail);
        if (emailCollision) {
          // CRITICAL RULE (Section IX.28): Never automatically link accounts merely because email matches!
          recordSecurityEvent({
            accountId: emailCollision.id,
            eventType: 'OAUTH_AUTO_LINK_BLOCKED_BY_POLICY',
            severity: 'WARNING',
            ip: clientIp,
            userAgent,
            details: { provider, providerEmail },
          });
          return jsonResponse(
            {
              error: 'OAUTH_EMAIL_COLLISION_NO_AUTO_LINK',
              messageVi:
                'Địa chỉ email này đã tồn tại trên hệ thống. Theo nguyên tắc bảo mật (PHẦN IX Mục 28), hệ thống không tự động liên kết tài khoản chỉ vì trùng email. Vui lòng đăng nhập vào tài khoản hiện có và liên kết thủ công trong Trung tâm bảo mật.',
            },
            409
          );
        }

        const now = new Date().toISOString();
        const accountId = generateId('acc');
        account = {
          id: accountId,
          email: providerEmail,
          password_hash: null,
          password_salt: null,
          email_verified: providerEmailVerified ? 1 : 0,
          email_verified_at: providerEmailVerified ? now : null,
          account_status: providerEmailVerified ? 'ACTIVE' : 'PENDING_VERIFICATION',
          profile_completed: 0, // Must complete missing DOB, Phone, School, Workplace
          failed_login_attempts: 0,
          locked_until: null,
          last_login_at: now,
          created_at: now,
          updated_at: now,
        };
        state.accounts.push(account);
        state.profiles.push({
          account_id: accountId,
          full_name: fullName,
          date_of_birth: '',
          phone_number: '',
          school_name: '',
          workplace_name: '',
          ui_language: 'vi',
          primary_learning_language: 'en',
          avatar_r2_key: null,
          bio: '',
          created_at: now,
          updated_at: now,
        });
        state.account_roles.push({
          account_id: accountId,
          role_code: 'LEARNER',
          granted_by: 'system',
          approval_note: `Đăng ký qua OAuth (${provider})`,
          granted_at: now,
        });
        state.oauth_identities.push({
          id: generateId('oauth'),
          account_id: accountId,
          provider,
          provider_user_id: providerUserId,
          provider_email: providerEmail,
          provider_email_verified: providerEmailVerified ? 1 : 0,
          linked_at: now,
          last_used_at: now,
        });
        resolveSubscriptionState(accountId);
      }

      const rawSessionToken = generateRandomToken(32);
      const csrfToken = generateRandomToken(16);
      state.sessions.push({
        id: generateId('sess'),
        account_id: account.id,
        token_hash: await sha256Hex(rawSessionToken),
        raw_token: rawSessionToken,
        csrf_token: csrfToken,
        ip_address: clientIp,
        user_agent: userAgent,
        device_label: `Đăng nhập liên kết ${provider.toUpperCase()}`,
        auth_method: 'oauth',
        expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        revoked: 0,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      });

      const profile = state.profiles.find((p) => p.account_id === account.id);
      const missingFields = [];
      if (!profile.date_of_birth) missingFields.push('dateOfBirth');
      if (!profile.phone_number) missingFields.push('phoneNumber');
      if (!profile.school_name) missingFields.push('schoolName');
      if (!profile.workplace_name) missingFields.push('workplaceName');

      return jsonResponse({
        messageVi:
          missingFields.length > 0
            ? 'Xác thực OAuth thành công. Vui lòng bổ sung các trường hồ sơ bắt buộc còn thiếu (Ngày sinh, Số điện thoại, Trường học, Nơi làm việc).'
            : 'Đăng nhập OAuth thành công.',
        sessionToken: rawSessionToken,
        csrfToken,
        requiresProfileCompletion: missingFields.length > 0,
        missingProfileFields: missingFields,
        phoneOtpRequired: false, // Section IX.28: Never require phone OTP verification
        account: {
          id: account.id,
          email: account.email,
          emailVerified: Boolean(account.email_verified),
          profileCompleted: Boolean(account.profile_completed),
        },
      });
    }

    // Complete Missing Profile Fields (Post-OAuth or Profile Update)
    if (method === 'POST' && path === '/api/account/profile/complete') {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập để cập nhật hồ sơ.' }, 401);
      }
      const csrfCheck = requireCsrfIfCookieAuth(request, authCtx);
      if (!csrfCheck.ok) return jsonResponse({ error: 'CSRF_ERROR', messageVi: csrfCheck.errorVi }, 403);

      const fullName = sanitizeText(body.fullName || authCtx.profile?.full_name, 120);
      const dateOfBirth = sanitizeText(body.dateOfBirth || authCtx.profile?.date_of_birth, 20);
      const phoneNumber = sanitizeText(body.phoneNumber || authCtx.profile?.phone_number, 30);
      const schoolName = sanitizeText(body.schoolName || authCtx.profile?.school_name, 200);
      const workplaceName = sanitizeText(body.workplaceName || authCtx.profile?.workplace_name, 200);

      if (!fullName || !dateOfBirth || !phoneNumber || !schoolName || !workplaceName) {
        return jsonResponse(
          {
            error: 'MISSING_MANDATORY_PROFILE_FIELDS',
            messageVi: 'Bắt buộc nhập đầy đủ Họ và tên, Ngày sinh, Số điện thoại, Trường học và Nơi làm việc (2 trường riêng biệt).',
          },
          400
        );
      }

      authCtx.profile.full_name = fullName;
      authCtx.profile.date_of_birth = dateOfBirth;
      authCtx.profile.phone_number = phoneNumber;
      authCtx.profile.school_name = schoolName;
      authCtx.profile.workplace_name = workplaceName;
      if (body.uiLanguage && ['vi', 'en', 'zh', 'ru'].includes(body.uiLanguage)) {
        authCtx.profile.ui_language = body.uiLanguage;
      }
      if (body.primaryLearningLanguage && ['zh', 'en', 'ru'].includes(body.primaryLearningLanguage)) {
        authCtx.profile.primary_learning_language = body.primaryLearningLanguage;
      }
      authCtx.profile.updated_at = new Date().toISOString();
      authCtx.account.profile_completed = 1;

      return jsonResponse({
        messageVi: 'Đã hoàn tất cập nhật hồ sơ cá nhân.',
        profile: authCtx.profile,
      });
    }

    // -------------------------------------------------------------------------
    // 3. WEBAUTHN / FIDO2 PASSKEYS & SECURITY CENTER (Section IX.29 & 30)
    // -------------------------------------------------------------------------
    if (method === 'GET' && path === '/api/account/security-center') {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập để truy cập Trung tâm bảo mật.' }, 401);
      }
      const passkeys = state.passkeys
        .filter((pk) => pk.account_id === authCtx.account.id)
        .map((pk) => ({
          id: pk.id,
          credentialId: pk.credential_id,
          friendlyName: pk.friendly_name,
          coseAlgorithm: pk.cose_algorithm,
          signCount: pk.sign_count,
          revoked: Boolean(pk.revoked),
          createdAt: pk.created_at,
          lastUsedAt: pk.last_used_at,
        }));
      const linkedOAuth = state.oauth_identities.filter((o) => o.account_id === authCtx.account.id);
      const activeSessions = state.sessions
        .filter((s) => s.account_id === authCtx.account.id && s.revoked === 0)
        .map((s) => ({
          id: s.id,
          deviceLabel: s.device_label,
          ipAddress: s.ip_address,
          authMethod: s.auth_method,
          lastActiveAt: s.last_active_at,
          expiresAt: s.expires_at,
          isCurrent: s.id === authCtx.session.id,
        }));
      const securityHistory = state.security_events
        .filter((e) => e.account_id === authCtx.account.id)
        .slice(0, 30);
      const lifecycleRequests = state.account_lifecycle_requests.filter(
        (r) => r.account_id === authCtx.account.id
      );

      return jsonResponse({
        account: {
          id: authCtx.account.id,
          email: authCtx.account.email,
          emailVerified: Boolean(authCtx.account.email_verified),
          status: authCtx.account.account_status,
        },
        profile: authCtx.profile,
        subscription: authCtx.subscription,
        passkeys,
        passkeyPrivacyPolicyVi:
          'WORD BRIDGE hỗ trợ WebAuthn/FIDO2 (vân tay, khuôn mặt trên thiết bị, PIN thiết bị, khóa vật lý) nhưng TUYỆT ĐỐI KHÔNG lưu trữ dữ liệu sinh trắc học, mã PIN hay khóa bí mật (private key) của người dùng.',
        linkedOAuth,
        activeSessions,
        securityHistory,
        lifecycleRequests,
        pdfReaderSso: getPdfReaderSsoStatus(env),
      });
    }

    // Add a new WebAuthn Passkey (Stores Public Key & Credential ID only; rejects raw biometric/PIN fields)
    if (method === 'POST' && path === '/api/account/passkeys') {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập để quản lý Passkey.' }, 401);
      }
      if (body.biometricData || body.fingerprintTemplate || body.faceScan || body.devicePin || body.privateKey) {
        return jsonResponse(
          {
            error: 'BIOMETRIC_OR_PRIVATE_KEY_REJECTED',
            messageVi: 'Vi phạm nguyên tắc bảo mật Passkey (PHẦN IX Mục 29): WORD BRIDGE tuyệt đối không nhận hoặc lưu dữ liệu sinh trắc học, PIN hoặc private key.',
          },
          400
        );
      }

      const credentialId = sanitizeText(body.credentialId || generateId('cred'), 256);
      const publicKeySpki = sanitizeText(body.publicKeySpki || 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE_FIDO2_PUBLIC_KEY', 1024);
      const friendlyName = sanitizeText(body.friendlyName || 'Passkey thiết bị cá nhân', 80);

      const newPasskey = {
        id: generateId('pk'),
        account_id: authCtx.account.id,
        credential_id: credentialId,
        public_key_spki: publicKeySpki,
        cose_algorithm: -7,
        sign_count: 0,
        friendly_name: friendlyName,
        transports_json: JSON.stringify(['internal', 'hybrid']),
        revoked: 0,
        revoked_at: null,
        last_used_at: null,
        created_at: new Date().toISOString(),
      };
      state.passkeys.push(newPasskey);

      recordSecurityEvent({
        accountId: authCtx.account.id,
        eventType: 'PASSKEY_REGISTERED',
        severity: 'INFO',
        ip: clientIp,
        userAgent,
        details: { passkeyId: newPasskey.id, friendlyName },
      });

      return jsonResponse({
        messageVi: 'Đã thêm Passkey WebAuthn/FIDO2 thành công (Chỉ lưu khóa công khai, không lưu sinh trắc học).',
        passkey: {
          id: newPasskey.id,
          credentialId: newPasskey.credential_id,
          friendlyName: newPasskey.friendly_name,
          revoked: false,
          createdAt: newPasskey.created_at,
        },
      }, 201);
    }

    // Rename or Revoke a specific Passkey
    if (path.startsWith('/api/account/passkeys/') && (method === 'PATCH' || method === 'DELETE')) {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập.' }, 401);
      }
      const passkeyId = path.split('/').pop();
      // Ownership check (Prevents IDOR)
      const pk = state.passkeys.find((p) => p.id === passkeyId);
      if (!pk) {
        return jsonResponse({ error: 'NOT_FOUND', messageVi: 'Không tìm thấy Passkey.' }, 404);
      }
      if (pk.account_id !== authCtx.account.id) {
        recordSecurityEvent({
          accountId: authCtx.account.id,
          eventType: 'IDOR_ATTEMPT_BLOCKED_ON_PASSKEY',
          severity: 'HIGH',
          ip: clientIp,
          userAgent,
          details: { targetPasskeyId: passkeyId },
        });
        return jsonResponse({ error: 'FORBIDDEN_OWNERSHIP', messageVi: 'Bạn không có quyền thao tác trên Passkey của tài khoản khác.' }, 403);
      }

      if (method === 'PATCH') {
        pk.friendly_name = sanitizeText(body.friendlyName || pk.friendly_name, 80);
        return jsonResponse({ messageVi: 'Đã đổi tên Passkey.', passkey: pk });
      } else {
        pk.revoked = 1;
        pk.revoked_at = new Date().toISOString();
        recordSecurityEvent({
          accountId: authCtx.account.id,
          eventType: 'PASSKEY_REVOKED',
          severity: 'INFO',
          ip: clientIp,
          userAgent,
          details: { passkeyId: pk.id },
        });
        return jsonResponse({ messageVi: 'Đã thu hồi Passkey thành công.', passkey: pk });
      }
    }

    // Account Deletion Request & Password Change
    if (method === 'POST' && path === '/api/account/Deletion-request'.toLowerCase()) {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập.' }, 401);
      }
      const reqRecord = {
        id: generateId('delreq'),
        account_id: authCtx.account.id,
        request_type: 'ACCOUNT_DELETION',
        reason: sanitizeText(body.reason || 'Người dùng yêu cầu xóa tài khoản cá nhân', 500),
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.account_lifecycle_requests.push(reqRecord);
      authCtx.account.account_status = 'PENDING_DELETION';
      recordSecurityEvent({
        accountId: authCtx.account.id,
        eventType: 'ACCOUNT_DELETION_REQUESTED',
        severity: 'WARNING',
        ip: clientIp,
        userAgent,
      });
      return jsonResponse({
        messageVi: 'Đã ghi nhận yêu cầu xóa tài khoản cá nhân và dữ liệu liên quan.',
        request: reqRecord,
      }, 201);
    }

    // -------------------------------------------------------------------------
    // 4. STUDENT SUPPORT POLICY (Section XIII.48)
    //    - 03 months Personal Plus free
    //    - Strictly ONE TIME ONLY
    //    - Verified ONLY by school-issued student email (.edu.vn / .edu / .ac.*)
    //    - Rejects student ID card image/document uploads
    // -------------------------------------------------------------------------
    if (method === 'POST' && path === '/api/subscription/student-benefit') {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập để đăng ký ưu đãi sinh viên.' }, 401);
      }
      if (body.studentIdCardImage || body.replacementDocument) {
        return jsonResponse(
          {
            error: 'STUDENT_ID_CARD_NOT_ACCEPTED',
            messageVi:
              'Theo chính sách hỗ trợ sinh viên (PHẦN XIII Mục 48): Chỉ xác minh bằng email sinh viên do trường cấp; tuyệt đối không chấp nhận thẻ sinh viên hoặc giấy tờ thay thế.',
          },
          400
        );
      }

      const eduEmail = sanitizeText(body.studentEmail, 160).toLowerCase();
      const isSchoolEmail = /@([a-z0-9-]+\.)*(edu(\.[a-z]{2})?|ac\.[a-z]{2,3}|university\.[a-z]+)$/i.test(eduEmail);
      if (!isSchoolEmail) {
        return jsonResponse(
          {
            error: 'INVALID_STUDENT_EMAIL_DOMAIN',
            messageVi: 'Email sinh viên phải thuộc tên miền giáo dục chính thức do trường cấp (ví dụ: .edu.vn, .edu, .ac.*).',
          },
          400
        );
      }

      const sub = resolveSubscriptionState(authCtx.account.id);
      const alreadyUsedEmail = state.subscription_entitlements.find(
        (s) => s.student_edu_email === eduEmail && s.student_benefit_claimed_once === 1
      );
      if (sub.student_benefit_claimed_once === 1 || alreadyUsedEmail) {
        return jsonResponse(
          {
            error: 'STUDENT_BENEFIT_ALREADY_CLAIMED',
            messageVi: 'Mỗi sinh viên chỉ được hưởng ưu đãi 03 tháng Personal Plus miễn phí một lần duy nhất.',
          },
          409
        );
      }

      const now = new Date();
      const expires = new Date(now.getTime() + 90 * 86400 * 1000); // 03 months (90 days)
      sub.plan_code = 'PERSONAL_PLUS';
      sub.status = 'ACTIVE';
      sub.is_student_benefit = 1;
      sub.student_edu_email = eduEmail;
      sub.student_verified_at = now.toISOString();
      sub.student_benefit_claimed_once = 1;
      sub.starts_at = now.toISOString();
      sub.expires_at = expires.toISOString();
      sub.updated_at = now.toISOString();

      return jsonResponse({
        messageVi:
          'Xác minh email sinh viên thành công! Bạn đã được kích hoạt gói Personal Plus miễn phí 03 tháng (1 lần duy nhất). Sau 03 tháng nếu không gia hạn trả phí, tài khoản sẽ tự động trở về Personal Free.',
        subscription: sub,
      });
    }

    // -------------------------------------------------------------------------
    // 5. AUTHENTICATED LEARNING ACTIONS (Enforces Section IV.13 Guest Restrictions)
    // -------------------------------------------------------------------------
    // 5.1 Start a Lesson & Save Progress
    if (method === 'POST' && path === '/api/learning/lessons/start') {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_LESSON_START',
            messageVi: 'Khách chưa đăng nhập chỉ được xem nội dung công khai. Vui lòng đăng nhập để bắt đầu bài học và lưu tiến độ (PHẦN IV Mục 13).',
          },
          401
        );
      }
      const lessonId = sanitizeText(body.lessonId, 80);
      const lesson = state.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        return jsonResponse({ error: 'LESSON_NOT_FOUND', messageVi: 'Không tìm thấy bài học.' }, 404);
      }

      let prog = state.learner_progress.find(
        (p) => p.account_id === authCtx.account.id && p.lesson_id === lesson.id
      );
      if (!prog) {
        prog = {
          id: generateId('prog'),
          account_id: authCtx.account.id,
          language_code: lesson.language_code,
          course_id: lesson.course_id,
          lesson_id: lesson.id,
          completion_status: body.completed ? 'COMPLETED' : 'IN_PROGRESS',
          mastery_score: Number(body.masteryScore ?? 85),
          time_spent_seconds: Number(body.timeSpentSeconds ?? 600),
          last_accessed_at: new Date().toISOString(),
        };
        state.learner_progress.push(prog);
      } else {
        prog.completion_status = body.completed ? 'COMPLETED' : prog.completion_status;
        prog.mastery_score = Math.max(prog.mastery_score, Number(body.masteryScore ?? prog.mastery_score));
        prog.time_spent_seconds += Number(body.timeSpentSeconds ?? 300);
        prog.last_accessed_at = new Date().toISOString();
      }

      return jsonResponse({
        messageVi: 'Đã bắt đầu bài học và ghi nhận tiến độ học tập cá nhân vào cơ sở dữ liệu.',
        progress: prog,
      });
    }

    // 5.2 Interactive Dictionary Lookup & Save Personal Vocabulary (Authenticated Only)
    if (method === 'GET' && path === '/api/dictionary/search') {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_DICTIONARY_LOOKUP',
            messageVi: 'Khách chưa đăng nhập được xem các mục từ công khai nhưng phải đăng nhập mới được sử dụng công cụ tra cứu từ điển tương tác (PHẦN IV Mục 13).',
          },
          401
        );
      }
      const q = sanitizeText(url.searchParams.get('q') || '', 100).toLowerCase();
      const lang = url.searchParams.get('lang') || '';
      const specializedOnly = url.searchParams.get('specialized') === '1';

      if (lang === 'ru' && specializedOnly) {
        return jsonResponse(
          {
            error: 'RUSSIAN_SPECIALIZED_NOT_SUPPORTED',
            messageVi: 'Tiếng Nga chỉ hỗ trợ từ vựng học tổng quát, không có thuật ngữ chuyên ngành tiếng Nga.',
          },
          400
        );
      }

      const results = state.dictionary_entries.filter((d) => {
        if (lang && d.language_code !== lang) return false;
        if (specializedOnly && d.is_specialized !== 1) return false;
        if (!q) return true;
        return (
          d.headword.toLowerCase().includes(q) ||
          d.phonetic.toLowerCase().includes(q) ||
          d.meaning_vi.toLowerCase().includes(q)
        );
      });

      return jsonResponse({ query: q, language: lang || 'all', count: results.length, results });
    }

    if (method === 'POST' && path === '/api/dictionary/vocabulary/save') {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_VOCAB_SAVE',
            messageVi: 'Vui lòng đăng nhập để lưu từ vựng vào sổ từ cá nhân và tạo thẻ Flashcard ôn tập ngắt quãng.',
          },
          401
        );
      }
      const entryId = sanitizeText(body.dictionaryEntryId, 80);
      const entry = state.dictionary_entries.find((d) => d.id === entryId);
      if (!entry) {
        return jsonResponse({ error: 'ENTRY_NOT_FOUND', messageVi: 'Không tìm thấy mục từ điển.' }, 404);
      }

      const srs = calculateNextSpacedRepetition({
        quality: Number(body.quality ?? 4),
        repetitions: 0,
        easeFactor: 2.5,
        intervalDays: 1,
      });

      let saved = state.personal_vocabulary.find(
        (v) => v.account_id === authCtx.account.id && v.dictionary_entry_id === entry.id
      );
      if (!saved) {
        saved = {
          id: generateId('pvoc'),
          account_id: authCtx.account.id,
          dictionary_entry_id: entry.id,
          headword: entry.headword,
          language_code: entry.language_code,
          meaning_vi: entry.meaning_vi,
          deck_name: sanitizeText(body.deckName || 'Sổ từ vựng cá nhân', 80),
          personal_note: sanitizeText(body.personalNote || '', 300),
          ease_factor: srs.easeFactor,
          interval_days: srs.intervalDays,
          repetitions: srs.repetitions,
          next_review_at: srs.nextReviewAt,
          created_at: new Date().toISOString(),
        };
        state.personal_vocabulary.push(saved);
      } else {
        const updatedSrs = calculateNextSpacedRepetition({
          quality: Number(body.quality ?? 4),
          repetitions: saved.repetitions,
          easeFactor: saved.ease_factor,
          intervalDays: saved.interval_days,
        });
        saved.ease_factor = updatedSrs.easeFactor;
        saved.interval_days = updatedSrs.intervalDays;
        saved.repetitions = updatedSrs.repetitions;
        saved.next_review_at = updatedSrs.nextReviewAt;
      }

      return jsonResponse({
        messageVi: 'Đã lưu từ vựng vào sổ cá nhân và cập nhật lịch ôn tập ngắt quãng (Spaced Repetition).',
        vocabularyItem: saved,
      }, 201);
    }

    // 5.3 Submit Interactive Exercise (Authenticated Only)
    if (method === 'POST' && path === '/api/practice/exercises/submit') {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_EXERCISE',
            messageVi: 'Khách chưa đăng nhập được xem đề bài tập nhưng phải đăng nhập mới được làm bài và lưu kết quả (PHẦN IV Mục 13).',
          },
          401
        );
      }
      const exerciseId = sanitizeText(body.exerciseId, 80);
      const ex = state.exercises.find((e) => e.id === exerciseId);
      if (!ex) {
        return jsonResponse({ error: 'EXERCISE_NOT_FOUND', messageVi: 'Không tìm thấy bài tập.' }, 404);
      }

      const expected = JSON.parse(ex.correct_answer_json || '{}');
      let isCorrect = false;
      let scorePercent = 0;

      if (ex.exercise_format === 'MULTIPLE_CHOICE') {
        isCorrect = String(body.answer || '').trim() === String(expected.selected || '').trim();
        scorePercent = isCorrect ? 100 : 0;
      } else if (ex.exercise_format === 'WRITING_PROMPT') {
        const text = String(body.answer || '');
        const reqWords = expected.required_keywords || [];
        const matched = reqWords.filter((kw) => text.includes(kw));
        scorePercent = reqWords.length > 0 ? Math.round((matched.length / reqWords.length) * 100) : 85;
        isCorrect = scorePercent >= 65;
      } else if (ex.exercise_format === 'PRONUNCIATION') {
        const pronEval = evaluatePronunciation({
          languageCode: ex.language_code,
          targetPhrase: expected.target_phrase || ex.prompt_text,
          recognizedTranscript: String(body.answer || ''),
        });
        scorePercent = pronEval.phonemeAccuracy;
        isCorrect = scorePercent >= 75;
      }

      const submission = {
        id: generateId('sub'),
        account_id: authCtx.account.id,
        exercise_id: ex.id,
        user_response_json: JSON.stringify({ answer: body.answer }),
        score_percent: scorePercent,
        is_correct: isCorrect ? 1 : 0,
        feedback_json: JSON.stringify({ explanationVi: ex.explanation_vi }),
        submitted_at: new Date().toISOString(),
      };
      state.exercise_submissions.push(submission);

      return jsonResponse({
        messageVi: isCorrect ? 'Chính xác! Kết quả luyện tập đã được lưu.' : 'Đã chấm điểm bài luyện tập. Hãy xem giải thích chi tiết.',
        submission: {
          id: submission.id,
          exerciseId: ex.id,
          scorePercent,
          isCorrect,
          explanationVi: ex.explanation_vi,
        },
      });
    }

    // 5.4 Take & Submit Examination (Authenticated Only, Zero Certificates)
    if (method === 'POST' && path === '/api/examinations/submit') {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_EXAM',
            messageVi: 'Vui lòng đăng nhập để tham gia làm bài thi khảo thí và lưu kết quả đánh giá năng lực.',
          },
          401
        );
      }
      const examId = sanitizeText(body.examId, 80);
      const exam = state.exams.find((e) => e.id === examId);
      if (!exam) {
        return jsonResponse({ error: 'EXAM_NOT_FOUND', messageVi: 'Không tìm thấy đề thi.' }, 404);
      }

      const qIds = JSON.parse(exam.question_ids_json || '[]');
      const questions = state.question_bank.filter((q) => qIds.includes(q.id));
      const graded = gradeExamSubmission({
        accountId: authCtx.account.id,
        exam,
        questions,
        submittedAnswers: body.answers || {},
        durationSeconds: Number(body.durationSeconds || 900),
      });
      state.exam_results.push(graded);

      return jsonResponse({
        messageVi: 'Đã hoàn thành chấm điểm bài khảo thí (Lưu ý: Hệ thống chỉ phân tích năng lực, tuyệt đối không cấp chứng chỉ).',
        result: graded,
      });
    }

    // 5.5 Learner Meet Live Audio/Video Rooms (Authenticated Only; Strictly NO Chat/Record/ScreenShare)
    if (path.startsWith('/api/learner-meet')) {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_LEARNER_MEET',
            messageVi: 'Khách chưa đăng nhập không được tham gia Learner Meet. Vui lòng đăng nhập.',
          },
          401
        );
      }

      if (method === 'GET' && path === '/api/learner-meet/rooms') {
        return jsonResponse({
          policy: LEARNER_MEET_POLICY_ENFORCEMENT,
          privacyDisclosureVi: LEARNER_MEET_PRIVACY_DISCLOSURE_VI,
          webrtcProviderStatus: env.LEARNER_MEET_PROVIDER
            ? `CONFIGURED (${env.LEARNER_MEET_PROVIDER})`
            : 'WAITING_EXTERNAL_WEBRTC_CREDENTIALS_NATIVE_P2P_SIGNALING_READY',
          rooms: state.learner_meet_sessions,
        });
      }

      if (method === 'POST' && path === '/api/learner-meet/rooms') {
        const room = createLearnerMeetSessionRecord({
          hostAccountId: authCtx.account.id,
          languageCode: body.languageCode || 'en',
          mode: body.mode || 'ONE_ON_ONE',
          topicTitle: body.topicTitle || 'Thực hành phản xạ hội thoại trực tiếp',
          levelCode: body.levelCode || 'B1',
          maxParticipants: body.maxParticipants || 2,
        });
        state.learner_meet_sessions.unshift(room);
        state.learner_meet_participants.push({
          id: generateId('mp'),
          session_id: room.id,
          account_id: authCtx.account.id,
          joined_at: new Date().toISOString(),
          left_at: null,
          connection_state: 'CONNECTED',
          mic_enabled: 1,
          camera_enabled: 1,
        });
        return jsonResponse({
          messageVi: 'Đã tạo phiên thực hành Learner Meet (Chỉ hỗ trợ âm thanh & video trực tiếp, không có chat và không ghi âm/ghi hình).',
          room,
        }, 201);
      }

      if (method === 'POST' && path === '/api/learner-meet/action') {
        const policyCheck = assertProhibitedLearnerMeetAction(body.actionType);
        if (!policyCheck.allowed) {
          return jsonResponse({ error: 'PROHIBITED_LEARNER_MEET_ACTION', messageVi: policyCheck.errorVi }, 403);
        }

        const room = state.learner_meet_sessions.find((r) => r.id === body.sessionId);
        if (!room) {
          return jsonResponse({ error: 'ROOM_NOT_FOUND', messageVi: 'Không tìm thấy phiên Learner Meet.' }, 404);
        }

        let participant = state.learner_meet_participants.find(
          (p) => p.session_id === room.id && p.account_id === authCtx.account.id && !p.left_at
        );

        if (body.actionType === 'JOIN_SESSION') {
          if (!participant) {
            participant = {
              id: generateId('mp'),
              session_id: room.id,
              account_id: authCtx.account.id,
              joined_at: new Date().toISOString(),
              left_at: null,
              connection_state: 'CONNECTED',
              mic_enabled: 1,
              camera_enabled: 1,
            };
            state.learner_meet_participants.push(participant);
          }
          return jsonResponse({ messageVi: 'Đã tham gia phiên Learner Meet.', participant, privacyDisclosureVi: LEARNER_MEET_PRIVACY_DISCLOSURE_VI });
        }

        if (body.actionType === 'TOGGLE_MIC' && participant) {
          participant.mic_enabled = participant.mic_enabled ? 0 : 1;
          return jsonResponse({ messageVi: participant.mic_enabled ? 'Đã bật microphone.' : 'Đã tắt microphone.', participant });
        }

        if (body.actionType === 'TOGGLE_CAMERA' && participant) {
          participant.camera_enabled = participant.camera_enabled ? 0 : 1;
          return jsonResponse({ messageVi: participant.camera_enabled ? 'Đã bật camera.' : 'Đã tắt camera.', participant });
        }

        if (body.actionType === 'LEAVE_SESSION' && participant) {
          participant.left_at = new Date().toISOString();
          participant.connection_state = 'DISCONNECTED';
          return jsonResponse({ messageVi: 'Đã rời phiên Learner Meet (Đã lưu thời điểm rời phiên vào metadata vận hành).', participant });
        }

        if (body.actionType === 'END_SESSION') {
          if (room.host_account_id !== authCtx.account.id && !authCtx.roles.includes('SUPER_ADMIN')) {
            return jsonResponse({ error: 'FORBIDDEN', messageVi: 'Chỉ người tạo phiên mới có quyền kết thúc phiên.' }, 403);
          }
          room.status = 'ENDED';
          room.ended_at = new Date().toISOString();
          return jsonResponse({ messageVi: 'Đã kết thúc phiên Learner Meet.', room });
        }

        return jsonResponse({ messageVi: 'Đã cập nhật trạng thái kết nối phiên.', room });
      }
    }

    // -------------------------------------------------------------------------
    // 6. THE 15 DIFFERENTIATING LANGUAGE INTELLIGENCE SYSTEMS (Section VII)
    // -------------------------------------------------------------------------
    if (method === 'GET' && path === '/api/language-intelligence/systems') {
      return jsonResponse({
        totalSystems: FIFTEEN_SYSTEMS_SPEC.length,
        systems: FIFTEEN_SYSTEMS_SPEC,
        externalAiAdapterConfigured: Boolean(env.AI_ADAPTER_PROVIDER && env.AI_ADAPTER_API_KEY),
        learnerMeetDataUsedForAi: false,
      });
    }

    if (method === 'POST' && path.startsWith('/api/language-intelligence/evaluate/')) {
      if (!authCtx) {
        return jsonResponse(
          {
            error: 'AUTH_REQUIRED_FOR_INTELLIGENCE_ENGINE',
            messageVi: 'Vui lòng đăng nhập để chạy phân tích và lưu kết quả trên 15 hệ thống trí tuệ ngôn ngữ.',
          },
          401
        );
      }
      const slug = path.split('/').pop();
      let output = null;

      switch (slug) {
        case 'language-dna':
          output = computeLanguageDna({ ...body, accountId: authCtx.account.id });
          break;
        case 'language-transfer-lab':
          output = analyzeLanguageTransfer(body);
          break;
        case 'knowledge-to-language':
          output = runKnowledgeToLanguage(body);
          if (output.error) return jsonResponse(output, output.status || 400);
          break;
        case 'real-world-language-simulator':
          output = evaluateSimulatorStep(body);
          break;
        case 'language-error-genome':
          output = analyzeErrorGenome(body);
          break;
        case 'meaning-equivalence-engine':
          output = lookupMeaningEquivalence(body);
          break;
        case 'language-timeline':
          output = computeLanguageTimeline(body);
          break;
        case 'universal-pronunciation-lab':
          output = evaluatePronunciation(body);
          break;
        case 'multi-language-knowledge-graph':
          output = queryMultiLanguageGraph(body);
          break;
        case 'personal-language-corpus':
          output = analyzePersonalCorpus(body);
          break;
        case 'context-reconstruction':
          output = evaluateContextReconstruction(body);
          break;
        case 'comprehension-depth-test':
          output = scoreComprehensionDepth(body);
          break;
        case 'learning-recovery-system':
          output = computeLearningRecovery(body);
          break;
        case 'language-quality-benchmark':
          output = evaluateLanguageQualityBenchmark({
            ...body,
            aiAdapter: { isConfigured: Boolean(env.AI_ADAPTER_PROVIDER && env.AI_ADAPTER_API_KEY) },
          });
          break;
        case 'personal-language-observatory':
          output = generatePersonalObservatoryReport({
            accountId: authCtx.account.id,
            languageCode: body.languageCode || 'en',
          });
          break;
        default:
          return jsonResponse({ error: 'UNKNOWN_SYSTEM_SLUG', messageVi: `Không tìm thấy hệ thống trí tuệ ngôn ngữ: ${slug}` }, 404);
      }

      state.li_systems_outputs.unshift({
        id: generateId('liout'),
        account_id: authCtx.account.id,
        system_slug: slug,
        output,
        created_at: new Date().toISOString(),
      });

      return jsonResponse({
        messageVi: `Đã thực thi hệ thống trí tuệ ngôn ngữ [${slug}] thành công.`,
        result: output,
      });
    }

    // -------------------------------------------------------------------------
    // 7. CLOUDFLARE R2 STORAGE ENDPOINTS (Section XIV.50 & 51)
    // -------------------------------------------------------------------------
    if (method === 'POST' && path === '/api/storage/upload') {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập để tải tệp lên.' }, 401);
      }
      try {
        const stored = await r2.putObject({
          objectKey: body.objectKey,
          content: body.content || '',
          mimeType: body.mimeType || 'text/plain',
          uploadedBy: authCtx.account.id,
          isEmailLogo: Boolean(body.isEmailLogo),
        });
        state.learning_resources.push({
          id: generateId('res'),
          lesson_id: body.lessonId || null,
          language_code: body.languageCode || 'en',
          r2_object_key: stored.objectKey,
          resource_type: stored.resourceType,
          mime_type: stored.mimeType,
          size_bytes: stored.sizeBytes,
          visibility: stored.visibility,
          checksum_sha256: stored.checksumSha256,
          uploaded_by: authCtx.account.id,
          created_at: new Date().toISOString(),
        });
        return jsonResponse({
          messageVi: 'Đã kiểm tra bảo mật và lưu trữ đối tượng lên R2 bucket `word` thành công.',
          object: stored,
        }, 201);
      } catch (err) {
        return jsonResponse({ error: 'R2_UPLOAD_REJECTED', messageVi: err.message }, 400);
      }
    }

    if (method === 'GET' && path === '/api/storage/object') {
      const key = url.searchParams.get('key') || '';
      const isAdmin = Boolean(authCtx && authCtx.roles.some((r) => r.includes('ADMIN')));
      const res = await r2.getObject({
        objectKey: key,
        requesterAccountId: authCtx ? authCtx.account.id : null,
        isAdmin,
      });
      if (res.status !== 200) {
        return jsonResponse({ error: 'R2_ACCESS_DENIED', messageVi: res.error }, res.status);
      }
      return jsonResponse({
        messageVi: 'Truy xuất đối tượng R2 hợp lệ.',
        objectKey: key,
        mimeType: res.mimeType,
        metadata: res.metadata,
      });
    }

    // -------------------------------------------------------------------------
    // 8. VIETNAMESE ADMINISTRATION PORTAL & RBAC (Section X.32 - 35)
    // -------------------------------------------------------------------------
    if (path.startsWith('/api/admin/')) {
      if (!authCtx) {
        return jsonResponse({ error: 'UNAUTHORIZED', messageVi: 'Vui lòng đăng nhập tài khoản quản trị viên.' }, 401);
      }
      const adminRoleCodes = new Set(NINE_ADMIN_ROLES_VI.map((r) => r.code));
      const hasAdminRole = authCtx.roles.some((r) => adminRoleCodes.has(r));
      if (!hasAdminRole) {
        recordSecurityEvent({
          accountId: authCtx.account.id,
          eventType: 'UNAUTHORIZED_ADMIN_ACCESS_BLOCKED',
          severity: 'HIGH',
          ip: clientIp,
          userAgent,
          details: { path, roles: authCtx.roles },
        });
        return jsonResponse(
          {
            error: 'FORBIDDEN_RBAC',
            messageVi: 'Truy cập bị từ chối: Tài khoản của bạn không có vai trò quản trị (RBAC) được phê duyệt.',
          },
          403
        );
      }

      if (method === 'GET' && path === '/api/admin/overview') {
        const referencedKeys = new Set(state.learning_resources.map((r) => r.r2_object_key));
        const orphanReport = await r2.findOrphanedObjects(referencedKeys);

        return jsonResponse({
          uiLanguage: 'vi',
          moduleGroups: ADMIN_MODULE_GROUPS_VI,
          sevenCenters: SEVEN_ADMIN_CENTERS_VI,
          rbacRoles: NINE_ADMIN_ROLES_VI,
          metricsRealTime: {
            totalAccounts: state.accounts.length,
            totalLanguages: state.languages.length,
            totalPrograms: state.learning_programs.length,
            totalCourses: state.courses.length,
            totalLessons: state.lessons.length,
            totalDictionaryEntries: state.dictionary_entries.length,
            totalExercises: state.exercises.length,
            totalExams: state.exams.length,
            totalIntelligenceSystems: FIFTEEN_SYSTEMS_SPEC.length,
            activeLearnerMeetRooms: state.learner_meet_sessions.filter((s) => s.status === 'LIVE').length,
            totalAuditLogs: state.audit_logs.length,
            totalSecurityEvents: state.security_events.length,
          },
          infrastructure: {
            d1: D1_DATABASE_METADATA,
            r2: {
              ...R2_BUCKET_METADATA,
              allowedPrefixes: ALLOWED_R2_PREFIXES,
              orphanScan: orphanReport,
            },
            emailTemplatesCount: Object.keys(EMAIL_TEMPLATES_CATALOG).length,
            officialEmailAddresses: OFFICIAL_EMAIL_ADDRESSES,
          },
          auditLogs: state.audit_logs.slice(0, 25),
          securityEvents: state.security_events.slice(0, 25),
        });
      }

      // Grant or Revoke RBAC Role with mandatory Audit Log (Section X.35)
      if (method === 'POST' && path === '/api/admin/rbac/assign') {
        if (!authCtx.roles.includes('SUPER_ADMIN') && !authCtx.roles.includes('SECURITY_ADMIN')) {
          return jsonResponse(
            {
              error: 'INSUFFICIENT_RBAC_PRIVILEGE',
              messageVi: 'Chỉ Super Admin hoặc Quản trị bảo mật mới có thẩm quyền phê duyệt thay đổi vai trò RBAC.',
            },
            403
          );
        }
        const targetAccountId = sanitizeText(body.targetAccountId, 80);
        const roleCode = sanitizeText(body.roleCode, 40);
        const approvalNote = sanitizeText(body.approvalNote || 'Phê duyệt cấp quyền theo quy trình RBAC', 300);

        const validRole = NINE_ADMIN_ROLES_VI.find((r) => r.code === roleCode) || { code: 'LEARNER' };
        if (!validRole) {
          return jsonResponse({ error: 'INVALID_ROLE_CODE', messageVi: 'Mã vai trò RBAC không hợp lệ.' }, 400);
        }

        const beforeRoles = state.account_roles
          .filter((r) => r.account_id === targetAccountId)
          .map((r) => r.role_code);

        if (!beforeRoles.includes(roleCode)) {
          state.account_roles.push({
            account_id: targetAccountId,
            role_code: roleCode,
            granted_by: authCtx.account.id,
            approval_note: approvalNote,
            granted_at: new Date().toISOString(),
          });
        }

        const afterRoles = state.account_roles
          .filter((r) => r.account_id === targetAccountId)
          .map((r) => r.role_code);

        const auditEntry = recordAuditLog({
          actorAccountId: authCtx.account.id,
          action: 'RBAC_ROLE_ASSIGNED',
          targetType: 'ACCOUNT_ROLES',
          targetId: targetAccountId,
          before: { roles: beforeRoles },
          after: { roles: afterRoles, approvalNote },
          ip: clientIp,
        });

        return jsonResponse({
          messageVi: 'Đã cấp quyền RBAC và ghi nhận vào nhật ký kiểm toán bảo mật.',
          assignedRole: roleCode,
          auditLog: auditEntry,
        });
      }

      // Editorial Center: Create/Update/Publish Lesson Version (Section VI.19 & X.34)
      if (method === 'POST' && path === '/api/admin/editorial/lessons') {
        const allowedEditorial = ['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'CONTENT_EDITOR', 'MODERATOR'];
        if (!authCtx.roles.some((r) => allowedEditorial.includes(r))) {
          return jsonResponse({ error: 'FORBIDDEN_EDITORIAL', messageVi: 'Bạn không có quyền truy cập Trung tâm biên tập học liệu.' }, 403);
        }

        const languageCode = sanitizeText(body.languageCode || 'en', 10);
        if (!['zh', 'en', 'ru'].includes(languageCode)) {
          return jsonResponse({ error: 'INVALID_LANGUAGE', messageVi: 'Chỉ hỗ trợ biên tập bài học cho tiếng Trung (zh), tiếng Anh (en) và tiếng Nga (ru).' }, 400);
        }

        const newLesson = {
          id: generateId('lesson'),
          course_id: sanitizeText(body.courseId || 'course-en-101', 80),
          language_code: languageCode,
          slug: sanitizeText(body.slug || `bai-hoc-${Date.now()}`, 120),
          title_vi: sanitizeText(body.titleVi || 'Bài học mới', 200),
          title_target: sanitizeText(body.titleTarget || 'New Lesson', 200),
          order_index: Number(body.orderIndex || state.lessons.length + 1),
          objectives_json: JSON.stringify(body.objectives || []),
          vocabulary_json: JSON.stringify(body.vocabulary || []),
          grammar_json: JSON.stringify(body.grammar || []),
          new_knowledge_html: sanitizeText(body.newKnowledgeHtml || '', 5000),
          examples_json: JSON.stringify(body.examples || []),
          context_dialogue_json: JSON.stringify(body.contextDialogue || []),
          listening_section_json: JSON.stringify(body.listeningSection || {}),
          speaking_section_json: JSON.stringify(body.speakingSection || {}),
          reading_section_json: JSON.stringify(body.readingSection || {}),
          writing_section_json: JSON.stringify(body.writingSection || {}),
          media_assets_json: JSON.stringify(body.mediaAssets || []),
          status: ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].includes(body.status) ? body.status : 'DRAFT',
          version: Number(body.version || 1),
          published_by: authCtx.account.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.lessons.push(newLesson);

        recordAuditLog({
          actorAccountId: authCtx.account.id,
          action: 'LESSON_CREATED_OR_VERSIONED',
          targetType: 'LESSON',
          targetId: newLesson.id,
          after: { titleVi: newLesson.title_vi, status: newLesson.status, version: newLesson.version },
          ip: clientIp,
        });

        return jsonResponse({
          messageVi: 'Đã lưu bài học mới vào hệ thống quản trị biên tập học liệu.',
          lesson: newLesson,
        }, 201);
      }

      // Database & R2 Backup Export Manifest (Section XIV.49, 50 & XXII.78.25)
      if (method === 'POST' && path === '/api/admin/infrastructure/backup') {
        if (!authCtx.roles.includes('SUPER_ADMIN') && !authCtx.roles.includes('DATA_ADMIN')) {
          return jsonResponse({ error: 'FORBIDDEN', messageVi: 'Chỉ Super Admin hoặc Quản trị dữ liệu mới có quyền tạo bản sao lưu.' }, 403);
        }
        const snapshot = {
          backupId: generateId('bk'),
          createdAt: new Date().toISOString(),
          d1Database: D1_DATABASE_METADATA.databaseName,
          d1DatabaseId: D1_DATABASE_METADATA.databaseId,
          r2Bucket: R2_BUCKET_METADATA.bucketName,
          tablesCount: {
            languages: state.languages.length,
            programs: state.learning_programs.length,
            courses: state.courses.length,
            lessons: state.lessons.length,
            dictionaryEntries: state.dictionary_entries.length,
            exercises: state.exercises.length,
            exams: state.exams.length,
            accounts: state.accounts.length,
          },
        };
        recordAuditLog({
          actorAccountId: authCtx.account.id,
          action: 'INFRASTRUCTURE_BACKUP_CREATED',
          targetType: 'D1_R2_SNAPSHOT',
          targetId: snapshot.backupId,
          after: snapshot,
          ip: clientIp,
        });
        return jsonResponse({
          messageVi: 'Đã khởi tạo bản chụp sao lưu (Backup Manifest) cho Cloudflare D1 `word` và R2 `word` thành công.',
          backupManifest: snapshot,
        });
      }
    }

    // -------------------------------------------------------------------------
    // 9. EMAIL PREVIEW & VERIFICATION ENDPOINT
    // -------------------------------------------------------------------------
    if (method === 'GET' && path === '/api/email/templates') {
      const previewCode = url.searchParams.get('code') || 'EMAIL_VERIFICATION';
      const rendered = renderEmailTemplate(previewCode, {
        recipientName: 'Nguyễn Minh Anh',
        ctaLabel: 'Xác minh tài khoản WORD BRIDGE',
        ctaUrl: 'https://www.wordbridge.vn/api/auth/verify-email?token=sample',
      });
      return jsonResponse({
        officialAddresses: OFFICIAL_EMAIL_ADDRESSES,
        replyToPolicy: {
          fromNoreply: 'WORD BRIDGE <noreply@wordbridge.vn>',
          replyToWhenFromNoreply: 'cskh@wordbridge.vn',
        },
        logoPolicy: 'SVG_FIRST_WITH_HTML_TEXT_FALLBACK_NO_PNG',
        templatesCatalog: EMAIL_TEMPLATES_CATALOG,
        preview: rendered,
      });
    }

    return jsonResponse({ error: 'NOT_FOUND', messageVi: `Không tìm thấy đường dẫn API: ${path}` }, 404);
  }

  return {
    state,
    r2,
    emailer,
    handleApiRequest,
    assertSafeSqlStatement,
  };
}
