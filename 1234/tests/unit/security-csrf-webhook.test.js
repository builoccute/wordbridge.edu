import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';
import { hmacSha256Hex } from '../../src/utils/crypto.js';

async function createAuthenticatedUser(env, email = 'csrfuser@example.com') {
  const reg = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Nguyễn Bảo Minh',
      dateOfBirth: '2001-03-15',
      phoneNumber: '0912345670',
      email,
      password: 'WordBridge2026Secure',
      confirmPassword: 'WordBridge2026Secure',
      schoolName: 'Đại học Bách Khoa TP.HCM',
      workplaceName: 'Trung tâm Nghiên cứu Ngôn ngữ',
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

test('CSRF Protection: rejects missing token (403), rejects wrong token (403), accepts valid token (201)', async () => {
  const env = await createTestEnv();
  try {
    const user = await createAuthenticatedUser(env);

    // 1. Missing CSRF token -> 403
    const missing = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/vocabulary/notebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie },
      body: JSON.stringify({ entryId: 'dict_zh_haiyuntidan' }),
    }), env, {});
    assert.equal(missing.status, 403);

    // 2. Wrong CSRF token -> 403
    const wrong = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/vocabulary/notebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': 'forged-token' },
      body: JSON.stringify({ entryId: 'dict_zh_haiyuntidan' }),
    }), env, {});
    assert.equal(wrong.status, 403);

    // 3. Valid CSRF token -> 201
    const valid = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/vocabulary/notebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ entryId: 'dict_zh_haiyuntidan' }),
    }), env, {});
    assert.equal(valid.status, 201);
  } finally {
    env.DB.close();
  }
});

test('Email Webhook: rejects unconfigured secret (503), rejects forged signature (401), accepts valid HMAC & blocks replay', async () => {
  // 1. Unconfigured secret -> 503 BLOCKED_UNCONFIGURED
  const envNoSecret = await createTestEnv();
  try {
    const res = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/webhooks/email', {
      method: 'POST',
      body: JSON.stringify({ type: 'email.delivered', data: { email_id: 'msg_1' } }),
    }), envNoSecret, {});
    assert.equal(res.status, 503);
  } finally {
    envNoSecret.DB.close();
  }

  // 2. Configured secret: verify HMAC + anti-replay
  const secret = 'test-webhook-secret-v31';
  const env = await createTestEnv({ EMAIL_WEBHOOK_SECRET: secret });
  try {
    await env.DB.prepare(`
      INSERT INTO wb_email_events (id, idempotency_key, event_type, template_key, sender_address, reply_to_address, recipient_email, subject, delivery_status, provider_name, provider_message_id)
      VALUES ('eml_wh_1', 'idem_wh_1', 'UserRegistered', 'verify_email', 'noreply@wordbridge.vn', 'cskh@wordbridge.vn', 'u@example.com', 'Verify', 'ACCEPTED', 'resend', 're_msg_999')
    `).run();

    const rawBody = JSON.stringify({ type: 'email.delivered', data: { email_id: 're_msg_999' } });
    const ts = String(Math.floor(Date.now() / 1000));

    // Forged signature -> 401
    const forged = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/webhooks/email', {
      method: 'POST',
      headers: { 'X-WB-Webhook-Id': 'evt_1', 'X-WB-Webhook-Timestamp': ts, 'X-WB-Signature': '0000deadbeef' },
      body: rawBody,
    }), env, {});
    assert.equal(forged.status, 401);

    // Valid HMAC -> 200 & updates delivery_status to DELIVERED
    const sig = await hmacSha256Hex(secret, `${ts}.${rawBody}`);
    const valid = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/webhooks/email', {
      method: 'POST',
      headers: { 'X-WB-Webhook-Id': 'evt_1', 'X-WB-Webhook-Timestamp': ts, 'X-WB-Signature': sig },
      body: rawBody,
    }), env, {});
    assert.equal(valid.status, 200);
    const updatedRow = await env.DB.prepare('SELECT delivery_status FROM wb_email_events WHERE id = ?').bind('eml_wh_1').first();
    assert.equal(updatedRow.delivery_status, 'DELIVERED');

    // Replay same event_id -> deduplicated
    const replay = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/webhooks/email', {
      method: 'POST',
      headers: { 'X-WB-Webhook-Id': 'evt_1', 'X-WB-Webhook-Timestamp': ts, 'X-WB-Signature': sig },
      body: rawBody,
    }), env, {});
    const replayData = await replay.json();
    assert.equal(replayData.deduplicated, true);
  } finally {
    env.DB.close();
  }
});

test('Lesson Completion Security: ignores arbitrary frontend scorePercent=100 and computes real backend score', async () => {
  const env = await createTestEnv();
  try {
    const user = await createAuthenticatedUser(env, 'lessonsec@example.com');

    // Content-only completion with forged scorePercent: 100 -> backend MUST store null (content_completed)
    const contentOnly = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/learning/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ lessonId: 'les_zh_01_1', scorePercent: 100 }),
    }), env, {});
    assert.equal(contentOnly.status, 201);
    const coData = await contentOnly.json();
    assert.equal(coData.lifecycleStatus, 'content_completed');
    assert.equal(coData.scorePercent, null);

    // Graded submission with wrong answer -> backend MUST compute 0% (graded, not passed)
    const wrongAns = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/learning/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ lessonId: 'les_zh_02_2', answers: { qb_zh_1: '装箱单' }, scorePercent: 100 }),
    }), env, {});
    const waData = await wrongAns.json();
    assert.equal(waData.scorePercent, 0);
    assert.equal(waData.lifecycleStatus, 'graded');

    // Graded submission with right answer -> backend computes 100% (passed)
    const rightAns = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/learning/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ lessonId: 'les_zh_02_2', answers: { qb_zh_1: '海运提单' } }),
    }), env, {});
    const raData = await rightAns.json();
    assert.equal(raData.scorePercent, 100);
    assert.equal(raData.lifecycleStatus, 'passed');
  } finally {
    env.DB.close();
  }
});
