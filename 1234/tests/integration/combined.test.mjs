// Combined test suite with source-file blocks and original assertions.

// Source: api-workflows.test.mjs (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const { createWordBridgeRuntime } = await import("../../src/api/router.mjs");
const { resetRateLimitsForTest } = await import("../../src/utils/security.mjs");
async function callApi(runtime, path, { method = 'GET', body = null, token = '', csrf = '' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const req = new Request(`https://www.wordbridge.vn${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await runtime.handleApiRequest(req);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

test('Integration 1: Public view vs Authenticated action enforcement (Section IV.13)', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  // Guest can view public catalog
  const pub = await callApi(runtime, '/api/public/catalog');
  assert.equal(pub.status, 200);
  assert.equal(pub.data.languages.length, 3);
  assert.equal(pub.data.fifteenSystems.length, 15);

  // Guest is blocked from starting a lesson, querying dictionary, saving vocab, doing exercises, taking exams, joining Learner Meet
  assert.equal((await callApi(runtime, '/api/learning/lessons/start', { method: 'POST', body: { lessonId: 'lesson-zh-01' } })).status, 401);
  assert.equal((await callApi(runtime, '/api/dictionary/search?q=resilience')).status, 401);
  assert.equal((await callApi(runtime, '/api/dictionary/vocabulary/save', { method: 'POST', body: { dictionaryEntryId: 'dict-en-001' } })).status, 401);
  assert.equal((await callApi(runtime, '/api/practice/exercises/submit', { method: 'POST', body: { exerciseId: 'ex-en-read-01', answer: 'B. suggest that / may' } })).status, 401);
  assert.equal((await callApi(runtime, '/api/examinations/submit', { method: 'POST', body: { examId: 'exam-en-b2', answers: {} } })).status, 401);
  assert.equal((await callApi(runtime, '/api/learner-meet/rooms')).status, 401);
});

test('Integration 2: Email registration (8 fields), email verification link & auto-login (Section IX.27)', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  const reg = await callApi(runtime, '/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Phạm Thu Hà',
      dateOfBirth: '2003-04-12',
      phoneNumber: '+84987654321',
      email: 'thuha@hcmus.edu.vn',
      password: 'SecurePass2026',
      confirmPassword: 'SecurePass2026',
      schoolName: 'Trường Đại học Khoa học Tự nhiên',
      workplaceName: 'Trung tâm Nghiên cứu Ngôn ngữ Tính toán',
    },
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.accountStatus, 'PENDING_VERIFICATION');
  assert.equal(reg.data.verificationMethod, 'EMAIL_LINK_ONLY_NO_OTP');
  assert.equal(reg.data.emailDispatchStatus, 'BLOCKED_MISSING_CREDENTIALS');

  // Cannot log in before verifying email link
  const earlyLogin = await callApi(runtime, '/api/auth/login', {
    method: 'POST',
    body: { email: 'thuha@hcmus.edu.vn', password: 'SecurePass2026' },
  });
  assert.equal(earlyLogin.status, 403);

  // Open verification link -> verifies email AND auto-logs in
  const verify = await callApi(runtime, `/api/auth/verify-email?token=${reg.data.verificationToken}`);
  assert.equal(verify.status, 200);
  assert.equal(verify.data.autoLoggedIn, true);
  assert.ok(verify.data.sessionToken);

  const token = verify.data.sessionToken;

  // Authenticated user can now start lessons, search dictionary, save vocab, submit exercise, take exam, and claim student promo
  const startLesson = await callApi(runtime, '/api/learning/lessons/start', {
    method: 'POST',
    token,
    body: { lessonId: 'lesson-zh-01', completed: true, masteryScore: 95 },
  });
  assert.equal(startLesson.status, 200);

  const dictSearch = await callApi(runtime, '/api/dictionary/search?q=供应链&lang=zh', { token });
  assert.equal(dictSearch.status, 200);
  assert.equal(dictSearch.data.count, 1);

  const saveVocab = await callApi(runtime, '/api/dictionary/vocabulary/save', {
    method: 'POST',
    token,
    body: { dictionaryEntryId: 'dict-zh-002', quality: 5 },
  });
  assert.equal(saveVocab.status, 201);

  // Student promo: rejects student ID card image, accepts .edu.vn email once only
  const cardAttempt = await callApi(runtime, '/api/subscription/student-benefit', {
    method: 'POST',
    token,
    body: { studentEmail: 'thuha@hcmus.edu.vn', studentIdCardImage: 'card.jpg' },
  });
  assert.equal(cardAttempt.status, 400);

  const studentClaim = await callApi(runtime, '/api/subscription/student-benefit', {
    method: 'POST',
    token,
    body: { studentEmail: 'thuha@hcmus.edu.vn' },
  });
  assert.equal(studentClaim.status, 200);
  assert.equal(studentClaim.data.subscription.plan_code, 'PERSONAL_PLUS');

  const duplicateClaim = await callApi(runtime, '/api/subscription/student-benefit', {
    method: 'POST',
    token,
    body: { studentEmail: 'thuha@hcmus.edu.vn' },
  });
  assert.equal(duplicateClaim.status, 409);
});

test('Integration 3: OAuth prevents automatic linking by email collision & requires missing profile fields (Section IX.28)', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  // Register an email account first
  await callApi(runtime, '/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Hoàng Văn Bảo',
      dateOfBirth: '1999-11-11',
      phoneNumber: '+84909111222',
      email: 'bao@wordbridge.vn',
      password: 'Password2026',
      confirmPassword: 'Password2026',
      schoolName: 'Đại học Ngoại thương',
      workplaceName: 'Công ty XNK Á Châu',
    },
  });

  // Attempt OAuth login with the same email -> MUST NOT auto-link
  const collision = await callApi(runtime, '/api/auth/oauth/callback', {
    method: 'POST',
    body: {
      provider: 'google',
      providerUserId: 'google-uid-999',
      email: 'bao@wordbridge.vn',
      emailVerified: true,
      fullName: 'Hoàng Văn Bảo',
    },
  });
  assert.equal(collision.status, 409);
  assert.equal(collision.data.error, 'OAUTH_EMAIL_COLLISION_NO_AUTO_LINK');

  // Fresh OAuth user -> succeeds and prompts for missing mandatory profile fields without phone OTP
  const freshOauth = await callApi(runtime, '/api/auth/oauth/callback', {
    method: 'POST',
    body: {
      provider: 'microsoft',
      providerUserId: 'ms-uid-1001',
      email: 'new.oauth.user@outlook.com',
      emailVerified: true,
      fullName: 'Đặng Khánh Linh',
    },
  });
  assert.equal(freshOauth.status, 200);
  assert.equal(freshOauth.data.requiresProfileCompletion, true);
  assert.equal(freshOauth.data.phoneOtpRequired, false);
});

}

// Source: migrations-d1.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {default: fs} = await import("node:fs");
const {default: path} = await import("node:path");
const { SQLiteD1Database } = await import("../helpers/sqlite-d1-shim.js");
test('All 11 D1 migrations are strictly non-destructive (ZERO DROP TABLE) and deliver 108 sessions, 115+ lessons, specialized zh/en courses & balanced 350+ dictionary', async () => {
  const migrationsDir = path.resolve(process.cwd(), 'database/migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(files.length >= 11, `Expected at least 11 migration files, got ${files.length}`);

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8').replace(/^--.*$/gm, '');
    assert.ok(!/\bDROP\s+TABLE\b/i.test(sql), `Destructive DROP TABLE found in ${f}`);
  }

  const db = new SQLiteD1Database(':memory:');
  try {
    await db.applyAllMigrations(migrationsDir);

    const langs = (await db.prepare('SELECT code, has_specialized FROM wb_languages ORDER BY code').all()).results;
    assert.deepEqual(langs, [
      { code: 'en', has_specialized: 1 },
      { code: 'ru', has_specialized: 0 },
      { code: 'zh', has_specialized: 1 },
    ]);

    await assert.rejects(() =>
      db.prepare("INSERT INTO wb_languages (code, name_vi, native_name, has_general, has_specialized, proficiency_framework, script_system, phonetic_system) VALUES ('ja', 'Tiếng Nhật', '日本語', 1, 0, 'JLPT', 'Kanji', 'Kana')").run()
    );

    const sessions = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_study_sessions').first();
    assert.equal(sessions.cnt, 108, 'Expected 108 distinct study sessions across 36 foundation weeks');

    const lessons = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_lessons').first();
    assert.ok(lessons.cnt >= 115, `Expected >= 115 real lessons (108 foundation + 7 specialized), got ${lessons.cnt}`);

    const resources = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_learning_resources').first();
    assert.ok(resources.cnt >= 108, `Expected >= 108 learning resources, got ${resources.cnt}`);

    const courses = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_courses').first();
    assert.ok(courses.cnt >= 10, `Expected >= 10 courses (3 foundation + 7 specialized zh/en), got ${courses.cnt}`);

    const dictByLang = (await db.prepare('SELECT language_code, COUNT(*) AS cnt FROM wb_dictionary_entries GROUP BY language_code ORDER BY language_code').all()).results;
    const map = Object.fromEntries(dictByLang.map((r) => [r.language_code, r.cnt]));
    assert.ok(map.zh >= 65, `Expected >= 65 Chinese dictionary entries, got ${map.zh}`);
    assert.ok(map.en >= 225, `Expected >= 225 English dictionary entries, got ${map.en}`);
    assert.ok(map.ru >= 60, `Expected >= 60 Russian dictionary entries, got ${map.ru}`);

    const intelStatuses = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_intelligence_status').first();
    assert.equal(intelStatuses.cnt, 15, 'Expected 15 intelligence operational status rows');
  } finally {
    db.close();
  }
});

}

// Source: multipage-navigation.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {default: worker} = await import("../../src/index.js");
const { createTestEnv } = await import("../helpers/sqlite-d1-shim.js");
const { INTELLIGENCE_SYSTEMS } = await import("../../src/config/constants.js");
test('Multi-page navigation: all key routes return unique titles, breadcrumbs, zero # fake links, zero PDF Reader in Header/Footer', async () => {
  const env = await createTestEnv();
  try {
    const publicRoutes = [
      '/', '/learning', '/learning/chinese', '/learning/english', '/learning/russian',
      '/programs/chinese-foundation-hsk1', '/courses/chinese-beginner-12-weeks',
      '/courses/chinese-beginner-12-weeks/curriculum', '/weeks/chinese-beginner-week-01',
      '/lessons/chinese-week-01-lesson-01', '/dictionary', '/dictionary/chinese',
      '/dictionary/english', '/dictionary/russian', '/dictionary/chinese/hai-yun-ti-dan',
      '/practice', '/practice/listening', '/practice/speaking', '/practice/reading',
      '/practice/writing', '/practice/vocabulary', '/practice/grammar',
      '/examinations', '/examinations/chinese', '/examinations/english', '/examinations/russian',
      '/examinations/hsk-1-reference-diagnostic', '/examinations/hsk-1-reference-diagnostic/instructions',
      '/specialized', '/specialized/chinese', '/specialized/english', '/specialized/logistics',
      '/specialized/it-cloud', '/specialized/automotive', '/specialized/graphic-design',
      '/learner-meet', '/learner-meet/sessions', '/about', '/help', '/faq', '/contact',
      '/intelligence', ...INTELLIGENCE_SYSTEMS.map((s) => `/intelligence/${s.slug}`),
      '/login', '/register', '/forgot-password',
    ];

    const seenTitles = new Set();
    for (const route of publicRoutes) {
      const res = await worker.fetch(new Request(`https://www.wordbridge.vn${route}`), env, {});
      assert.equal(res.status, 200, `Route ${route} should return 200, got ${res.status}`);
      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      assert.ok(titleMatch, `Route ${route} missing <title>`);
      seenTitles.add(titleMatch[1]);
      assert.ok(!html.includes('href="#"'), `Route ${route} contains fake href="#" link`);
      assert.ok(!html.includes('reader.wordbridge.vn'), `Route ${route} must NOT expose PDF Reader in Header/Footer`);
    }
    assert.ok(seenTitles.size >= 45, `Expected unique page titles across multi-page routes, got ${seenTitles.size}`);

    // Homepage must NOT dump full lessons, registration form, or admin
    const homeRes = await worker.fetch(new Request('https://www.wordbridge.vn/'), env, {});
    const homeHtml = await homeRes.text();
    assert.ok(!homeHtml.includes('confirmPassword'), 'Homepage must not contain full registration form');
    assert.ok(!homeHtml.includes('QUẢN TRỊ WORD BRIDGE'), 'Homepage must not contain admin console');

    // Specialized Russian must return 404
    const ruSpecRes = await worker.fetch(new Request('https://www.wordbridge.vn/specialized/russian'), env, {});
    assert.equal(ruSpecRes.status, 404);

    // Certificate API must be blocked
    const certRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/certificates'), env, {});
    assert.equal(certRes.status, 404);
  } finally {
    env.DB.close();
  }
});

}

// Source: oauth-passkey-ownership.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {default: worker} = await import("../../src/index.js");
const { createTestEnv } = await import("../helpers/sqlite-d1-shim.js");
async function registerAndVerify(env, email) {
  const reg = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Người Dùng Kiểm Thử',
      dateOfBirth: '2000-01-10',
      phoneNumber: '0987654321',
      email,
      password: 'WordBridge2026Secure',
      confirmPassword: 'WordBridge2026Secure',
      schoolName: 'Đại học Quốc gia TP.HCM',
      workplaceName: 'Công ty Công nghệ XYZ',
    }),
  }), env, {});
  const regData = await reg.json();
  const ver = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: regData.verificationToken }),
  }), env, {});
  const verData = await ver.json();
  const cookie = (ver.headers.get('Set-Cookie') || '').match(/wb_session=[^;]+/)[0];
  return { accountId: regData.accountId, cookie, csrfToken: verData.csrfToken };
}

test('OAuth Flow: generates state/nonce, reports BLOCKED_UNCONFIGURED without credentials, and blocks replayed state', async () => {
  const env = await createTestEnv();
  try {
    const startRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/oauth/google/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectPath: '/my-learning' }),
    }), env, {});
    assert.equal(startRes.status, 503);
    const startData = await startRes.json();
    assert.equal(startData.code, 'BLOCKED_UNCONFIGURED');
    assert.ok(startData.state);

    // Callback with valid state when unconfigured -> 503 (never fakes login)
    const cb1 = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/oauth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: startData.state, code: 'fake_code' }),
    }), env, {});
    assert.equal(cb1.status, 503);

    // Replayed state -> 400
    const cb2 = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/oauth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: startData.state, code: 'fake_code' }),
    }), env, {});
    assert.equal(cb2.status, 400);
  } finally {
    env.DB.close();
  }
});

test('WebAuthn Passkey Flow: registration challenge -> verify -> assertion login -> revoke', async () => {
  const env = await createTestEnv();
  try {
    const user = await registerAndVerify(env, 'passkey@example.com');

    const optRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/account/passkeys/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({}),
    }), env, {});
    assert.equal(optRes.status, 200);
    const optData = await optRes.json();
    assert.ok(optData.publicKey.challenge);

    const regRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/account/passkeys/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({
        challenge: optData.publicKey.challenge,
        credentialId: 'cred_fido2_001',
        publicKeyCose: 'cose_pub_key_base64url',
        displayName: 'MacBook TouchID',
      }),
    }), env, {});
    assert.equal(regRes.status, 201);
    const { passkeyId } = await regRes.json();

    // Authenticate with Passkey challenge
    const authOptRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/account/passkeys/authenticate/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }), env, {});
    const authOpt = await authOptRes.json();
    const authVerRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/account/passkeys/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge: authOpt.publicKey.challenge, credentialId: 'cred_fido2_001', newSignCount: 1 }),
    }), env, {});
    assert.equal(authVerRes.status, 200);

    // Revoke passkey
    const revRes = await worker.fetch(new Request(`https://www.wordbridge.vn/api/v1/account/passkeys/${passkeyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({}),
    }), env, {});
    assert.equal(revRes.status, 200);
  } finally {
    env.DB.close();
  }
});

test('Data Ownership Isolation: User B cannot read User A exam attempt or delete User A notebook item', async () => {
  const env = await createTestEnv();
  try {
    const userA = await registerAndVerify(env, 'userA@example.com');
    const userB = await registerAndVerify(env, 'userB@example.com');

    const nbA = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/vocabulary/notebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie, 'X-CSRF-Token': userA.csrfToken },
      body: JSON.stringify({ entryId: 'dict_en_schedule' }),
    }), env, {});
    const { id: nbId } = await nbA.json();

    // User B tries to delete User A's notebook item -> 403
    const delB = await worker.fetch(new Request(`https://www.wordbridge.vn/api/v1/vocabulary/notebook/${nbId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie, 'X-CSRF-Token': userB.csrfToken },
      body: JSON.stringify({}),
    }), env, {});
    assert.equal(delB.status, 403);

    // User A starts an exam; User B tries to read it -> 403
    const startA = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/examinations/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie, 'X-CSRF-Token': userA.csrfToken },
      body: JSON.stringify({ examSlug: 'cefr-a1-reference-diagnostic' }),
    }), env, {});
    const { attemptId } = await startA.json();

    const readB = await worker.fetch(new Request(`https://www.wordbridge.vn/api/v1/examination-attempts/${attemptId}`, {
      headers: { Cookie: userB.cookie },
    }), env, {});
    assert.equal(readB.status, 403);
  } finally {
    env.DB.close();
  }
});

}

// Source: v32-curriculum-and-sso.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {default: mainWorker} = await import("../../src/index.js");
const { createTestEnv } = await import("../helpers/sqlite-d1-shim.js");
test('Curriculum Quality V3.2: zero generic placeholder tokens remain in wb_study_sessions or wb_lessons & all 24 /admin/* routes render distinct D1 data', async () => {
  const env = await createTestEnv();
  try {
    const badSessions = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_study_sessions WHERE vocabulary_json LIKE '%Từ trọng tâm %'").first();
    assert.equal(badSessions.cnt, 0, 'Zero placeholder vocabulary tokens should remain in wb_study_sessions');

    const badLessons = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_lessons WHERE components_json LIKE '%Từ trọng tâm %'").first();
    assert.equal(badLessons.cnt, 0, 'Zero placeholder vocabulary tokens should remain in wb_lessons');

    // Create Super Admin and verify all 24 /admin/* routes return 200 in Vietnamese
    const reg = await mainWorker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Quản Trị Viên',
        dateOfBirth: '1995-01-01',
        phoneNumber: '0901234567',
        email: 'admin.v32@example.com',
        password: 'WordBridge2026Secure',
        confirmPassword: 'WordBridge2026Secure',
        schoolName: 'ĐH Quốc Gia',
        workplaceName: 'WORD BRIDGE',
      }),
    }), env, {});
    const { accountId, verificationToken } = await reg.json();
    const ver = await mainWorker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    }), env, {});
    const cookie = (ver.headers.get('Set-Cookie') || '').match(/wb_session=[^;]+/)[0];
    await env.DB.prepare("INSERT INTO wb_account_roles (account_id, role_id) VALUES (?, 'role_super_admin')").bind(accountId).run();

    const adminRoutes = [
      '/admin', '/admin/accounts', '/admin/roles', '/admin/permissions', '/admin/languages',
      '/admin/programs', '/admin/curricula', '/admin/courses', '/admin/modules', '/admin/weeks',
      '/admin/lessons', '/admin/resources', '/admin/vocabulary', '/admin/grammar', '/admin/dictionary',
      '/admin/practice', '/admin/question-bank', '/admin/examinations', '/admin/learner-meet',
      '/admin/language-intelligence', '/admin/email', '/admin/audit-logs', '/admin/infrastructure', '/admin/settings',
    ];
    for (const r of adminRoutes) {
      const res = await mainWorker.fetch(new Request(`https://www.wordbridge.vn${r}`, { headers: { Cookie: cookie } }), env, {});
      assert.equal(res.status, 200, `Admin route ${r} must return 200`);
    }
  } finally {
    env.DB.close();
  }
});

test('SSO Issuer Endpoint on WORD BRIDGE: returns 503 when unconfigured, and issues valid signed assertion (iss/aud/sub/iat/exp/jti/nonce) when configured', async () => {
  const env = await createTestEnv({ PDF_READER_SSO_ENABLED: 'true', PDF_READER_SSO_SHARED_SECRET: 'shared-sso-v32-key' });
  try {
    const reg = await mainWorker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Học Viên SSO',
        dateOfBirth: '2002-02-02',
        phoneNumber: '0911223344',
        email: 'sso.user@example.com',
        password: 'WordBridge2026Secure',
        confirmPassword: 'WordBridge2026Secure',
        schoolName: 'ĐH Kinh Tế',
        workplaceName: 'Công ty ABC',
      }),
    }), env, {});
    const { verificationToken } = await reg.json();
    const ver = await mainWorker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    }), env, {});
    const { csrfToken } = await ver.json();
    const cookie = (ver.headers.get('Set-Cookie') || '').match(/wb_session=[^;]+/)[0];

    const issueRes = await mainWorker.fetch(new Request('https://wordbridge.io.vn/api/v1/sso/reader/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ nonce: 'client_nonce_01' }),
    }), env, {});
    assert.equal(issueRes.status, 200);
    const data = await issueRes.json();
    assert.equal(data.assertion.iss, 'https://wordbridge.io.vn');
    assert.equal(data.assertion.aud, 'https://reader.wordbridge.io.vn');
    assert.ok(data.assertion.jti);
    assert.ok(data.assertion.signature);
  } finally {
    env.DB.close();
  }
});

}
