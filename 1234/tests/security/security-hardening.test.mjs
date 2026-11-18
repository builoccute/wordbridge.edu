import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordBridgeRuntime } from '../../src/api/router.mjs';
import { resetRateLimitsForTest } from '../../src/utils/security.mjs';

async function callApi(runtime, path, { method = 'GET', body = null, token = '' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const req = new Request(`https://www.wordbridge.vn${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await runtime.handleApiRequest(req);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

test('Security 1: Blocks SQL Injection payloads in query strings and JSON bodies', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  const sqliQuery = await callApi(runtime, "/api/public/catalog?lang=en' OR '1'='1");
  assert.equal(sqliQuery.status, 400);
  assert.equal(sqliQuery.data.error, 'MALICIOUS_INPUT_BLOCKED');

  const sqliBody = await callApi(runtime, '/api/auth/login', {
    method: 'POST',
    body: { email: "admin@wordbridge.vn'; DROP TABLE accounts; --", password: 'x' },
  });
  assert.equal(sqliBody.status, 400);
});

test('Security 2: Enforces Brute-Force account lockout after 5 failed password attempts', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  const reg = await callApi(runtime, '/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Vũ Quốc Huy',
      dateOfBirth: '1998-02-10',
      phoneNumber: '+84911222333',
      email: 'huy@wordbridge.vn',
      password: 'CorrectPassword2026',
      confirmPassword: 'CorrectPassword2026',
      schoolName: 'Đại học Quốc gia',
      workplaceName: 'Viện Công nghệ',
    },
  });
  await callApi(runtime, `/api/auth/verify-email?token=${reg.data.verificationToken}`);

  for (let i = 0; i < 5; i++) {
    const attempt = await callApi(runtime, '/api/auth/login', {
      method: 'POST',
      body: { email: 'huy@wordbridge.vn', password: 'WrongPassword000' },
    });
    assert.equal(attempt.status, 401);
  }

  const lockedAttempt = await callApi(runtime, '/api/auth/login', {
    method: 'POST',
    body: { email: 'huy@wordbridge.vn', password: 'CorrectPassword2026' },
  });
  assert.equal(lockedAttempt.status, 423);
  assert.equal(lockedAttempt.data.error, 'ACCOUNT_LOCKED_BRUTE_FORCE');
});

test('Security 3: Prevents IDOR on Passkeys, rejects biometric data, and blocks non-admin from /api/admin/*', async () => {
  resetRateLimitsForTest();
  const runtime = createWordBridgeRuntime({});

  const reg1 = await callApi(runtime, '/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Người dùng A',
      dateOfBirth: '2000-01-01',
      phoneNumber: '+84900000001',
      email: 'usera@wordbridge.vn',
      password: 'Password2026',
      confirmPassword: 'Password2026',
      schoolName: 'Trường A',
      workplaceName: 'Đơn vị A',
    },
  });
  const ver1 = await callApi(runtime, `/api/auth/verify-email?token=${reg1.data.verificationToken}`);
  const tokenA = ver1.data.sessionToken;

  const reg2 = await callApi(runtime, '/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Người dùng B',
      dateOfBirth: '2000-02-02',
      phoneNumber: '+84900000002',
      email: 'userb@wordbridge.vn',
      password: 'Password2026',
      confirmPassword: 'Password2026',
      schoolName: 'Trường B',
      workplaceName: 'Đơn vị B',
    },
  });
  const ver2 = await callApi(runtime, `/api/auth/verify-email?token=${reg2.data.verificationToken}`);
  const tokenB = ver2.data.sessionToken;

  // Reject biometric or private key upload in Passkey endpoint
  const bioAttempt = await callApi(runtime, '/api/account/passkeys', {
    method: 'POST',
    token: tokenA,
    body: { friendlyName: 'Bad Key', biometricData: 'raw_fingerprint' },
  });
  assert.equal(bioAttempt.status, 400);

  // User A creates a valid passkey
  const pkA = await callApi(runtime, '/api/account/passkeys', {
    method: 'POST',
    token: tokenA,
    body: { friendlyName: 'MacBook TouchID Public Key' },
  });
  assert.equal(pkA.status, 201);

  // User B attempts IDOR revocation of User A's passkey -> 403 Forbidden
  const idorAttempt = await callApi(runtime, `/api/account/passkeys/${pkA.data.passkey.id}`, {
    method: 'DELETE',
    token: tokenB,
  });
  assert.equal(idorAttempt.status, 403);

  // Default Learner User A attempts to access /api/admin/overview -> 403 Forbidden (No default admin role)
  const adminAttempt = await callApi(runtime, '/api/admin/overview', { token: tokenA });
  assert.equal(adminAttempt.status, 403);
});
