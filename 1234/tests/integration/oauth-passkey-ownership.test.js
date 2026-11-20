import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';

async function registerAndVerify(env, email) {
  const reg = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/register', {
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
  const ver = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/verify-email', {
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
