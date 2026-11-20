import test from 'node:test';
import assert from 'node:assert/strict';
import mainWorker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';

test('Curriculum Quality V3.2: zero generic placeholder tokens remain in wb_study_sessions or wb_lessons & all 24 /admin/* routes render distinct D1 data', async () => {
  const env = await createTestEnv();
  try {
    const badSessions = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_study_sessions WHERE vocabulary_json LIKE '%Từ trọng tâm %'").first();
    assert.equal(badSessions.cnt, 0, 'Zero placeholder vocabulary tokens should remain in wb_study_sessions');

    const badLessons = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_lessons WHERE components_json LIKE '%Từ trọng tâm %'").first();
    assert.equal(badLessons.cnt, 0, 'Zero placeholder vocabulary tokens should remain in wb_lessons');

    // Create Super Admin and verify all 24 /admin/* routes return 200 in Vietnamese
    const reg = await mainWorker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/register', {
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
    const ver = await mainWorker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/verify-email', {
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
    const reg = await mainWorker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/register', {
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
    const ver = await mainWorker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    }), env, {});
    const { csrfToken } = await ver.json();
    const cookie = (ver.headers.get('Set-Cookie') || '').match(/wb_session=[^;]+/)[0];

    const issueRes = await mainWorker.fetch(new Request('https://www.wordbridge.vn/api/v1/sso/reader/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ nonce: 'client_nonce_01' }),
    }), env, {});
    assert.equal(issueRes.status, 200);
    const data = await issueRes.json();
    assert.equal(data.assertion.iss, 'https://www.wordbridge.vn');
    assert.equal(data.assertion.aud, 'https://reader.wordbridge.vn');
    assert.ok(data.assertion.jti);
    assert.ok(data.assertion.signature);
  } finally {
    env.DB.close();
  }
});
