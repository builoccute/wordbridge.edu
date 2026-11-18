import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordBridgeRuntime } from '../../src/api/router.mjs';
import { resetRateLimitsForTest } from '../../src/utils/security.mjs';

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
