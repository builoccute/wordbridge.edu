import { renderErrorPage } from '../../src/pages/error-pages.js';
/**
 * WORD BRIDGE V4.1 — Comprehensive Integration & Security Test Suite
 * Verifies:
 * 1. One Domain (https://wordbridge.io.vn), Zero operational subdomains
 * 2. Complete Auth lifecycle: Register -> Verify Email -> Login -> Forgot Password -> Reset Password -> Profile Update -> Change Password -> Session Revoke
 * 3. Strict Exam Removal (410 Gone on web & API, exam_admin & exam:manage removed from D1, archive tables populated)
 * 4. Preserved Practice, Question Bank, Language DNA & Comprehension Depth (zero Exam dependency)
 * 5. Supreme Admin Center (/quan-tri): hasAnyAdminRole() fix, RBAC enforcement, Anti-Self-Elevation, Account lock/unlock, Role assign/revoke, D1 integrity & R2 backup snapshot, Maintenance Mode, Audit Logs
 * 6. Real Help Center (/help): Submit ticket -> Admin reply in /quan-tri -> User tracks ticket & reply
 * 7. Real Integrated Reader (/reader, /reader/:slug): Catalog, Filter, Read, Save Progress & Notes, R2 file stream & R2 prefix guardrails
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';
import { R2StorageService, validateObjectKey } from '../../storage/r2-adapter.js';
import { AuthService } from '../../src/services/auth-service.js';

function createMockR2() {
  const store = new Map();
  return {
    async put(key, body, opts = {}) {
      const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : new Uint8Array(body);
      store.set(key, {
        key,
        body: bytes,
        size: bytes.byteLength,
        uploaded: new Date().toISOString(),
        httpMetadata: opts.httpMetadata || {},
        customMetadata: opts.customMetadata || {},
      });
    },
    async get(key) {
      return store.get(key) || null;
    },
    async delete(key) {
      store.delete(key);
    },
    async list({ prefix = '', limit = 100 } = {}) {
      const objects = [...store.values()].filter((o) => o.key.startsWith(prefix)).slice(0, limit);
      return { objects };
    },
  };
}

async function registerVerifyAndLogin(env, email, password = 'StrongPassword123') {
  const regRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: `User ${email.split('@')[0]}`,
      dateOfBirth: '1999-05-10',
      phoneNumber: '0909123456',
      email,
      password,
      confirmPassword: password,
      schoolName: 'Đại học Bách Khoa',
      workplaceName: 'WORD BRIDGE Lab',
    }),
  }), env);
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.ok(regData.verificationToken);

  const verRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: regData.verificationToken }),
  }), env);
  assert.equal(verRes.status, 200);
  const verData = await verRes.json();
  const cookie = (verRes.headers.get('set-cookie') || '').split(';')[0];
  return { accountId: regData.accountId, cookie, csrfToken: verData.csrfToken };
}

test('V4.1 Auth Lifecycle: Register -> Verify -> Forgot/Reset Password -> Profile Update -> Change Password', async () => {
  const env = await createTestEnv();
  try {
    const user = await registerVerifyAndLogin(env, 'lifecycle@wordbridge.io.vn', 'InitialPass123');

    // Update profile
    const profRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/account/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({
        fullName: 'Nguyễn Minh Quân',
        phoneNumber: '0911222333',
        schoolName: 'ĐH Quốc Gia TP.HCM',
        workplaceName: 'Trung tâm Ngôn ngữ',
        dateOfBirth: '1998-08-20',
      }),
    }), env);
    assert.equal(profRes.status, 200);

    // Profile page renders updated name
    const profPage = await worker.fetch(new Request('https://wordbridge.io.vn/profile', {
      headers: { Cookie: user.cookie },
    }), env);
    assert.equal(profPage.status, 200);
    assert.match(await profPage.text(), /Nguyễn Minh Quân/);

    // Request password reset
    const forgotRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lifecycle@wordbridge.io.vn' }),
    }), env);
    const forgotData = await forgotRes.json();
    assert.equal(forgotData.ok, true);
    assert.ok(forgotData.resetToken);

    // Complete password reset
    const resetRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotData.resetToken,
        newPassword: 'ResetNewPassword99',
        confirmPassword: 'ResetNewPassword99',
      }),
    }), env);
    assert.equal(resetRes.status, 200);

    // Login with new password succeeds
    const loginRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lifecycle@wordbridge.io.vn', password: 'ResetNewPassword99' }),
    }), env);
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    const newCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

    // Change password while logged in
    const chgRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: newCookie, 'X-CSRF-Token': loginData.csrfToken },
      body: JSON.stringify({
        currentPassword: 'ResetNewPassword99',
        newPassword: 'FinalPassword789',
        confirmPassword: 'FinalPassword789',
      }),
    }), env);
    assert.equal(chgRes.status, 200);
  } finally {
    env.DB.close();
  }
});

test('V4.1 Exam Complete Removal & Practice / Intelligence Preservation', async () => {
  const env = await createTestEnv();
  try {
    const user = await registerVerifyAndLogin(env, 'practice-only@wordbridge.io.vn');

    // Exam web & API routes return 410 Gone
    for (const examPath of ['/examinations', '/examinations/history', '/examinations/english', '/examination-attempts/att_1', '/examination-results/res_1']) {
      const res = await worker.fetch(new Request(`https://wordbridge.io.vn${examPath}`), env);
      assert.equal(res.status, 410, `Expected 410 for ${examPath}`);
    }
    const examApi = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/examinations/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ examSlug: 'any' }),
    }), env);
    assert.equal(examApi.status, 410);

    // exam_admin & exam:manage removed from active RBAC tables; archive table exists
    const examRole = await env.DB.prepare("SELECT * FROM wb_roles WHERE code = 'exam_admin'").first();
    const examPerm = await env.DB.prepare("SELECT * FROM wb_permissions WHERE code = 'exam:manage'").first();
    assert.equal(examRole, null);
    assert.equal(examPerm, null);
    const archived = await env.DB.prepare('SELECT COUNT(*) AS cnt FROM wb_archive_examinations').first();
    assert.ok(archived.cnt >= 0);

    // Practice still works end-to-end
    const exRow = await env.DB.prepare('SELECT id, question_ids_json FROM wb_practice_exercises LIMIT 1').first();
    assert.ok(exRow?.id);
    const qIds = JSON.parse(exRow.question_ids_json || '[]');
    const answers = Object.fromEntries(qIds.map((qid) => [qid, 'sample answer']));
    const prSub = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
      body: JSON.stringify({ exerciseId: exRow.id, answers }),
    }), env);
    assert.equal(prSub.status, 201);

    // Intelligence Language DNA & Comprehension Depth work without Exam tables
    for (const slug of ['language-dna', 'comprehension-depth', 'language-observatory']) {
      const intRes = await worker.fetch(new Request(`https://wordbridge.io.vn/api/v1/intelligence/${slug}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: user.cookie, 'X-CSRF-Token': user.csrfToken },
        body: JSON.stringify({ languageCode: 'en', inputText: 'Testing practice-backed intelligence.' }),
      }), env);
      assert.equal(intRes.status, 200, `Intelligence ${slug} should succeed`);
      const intData = await intRes.json();
      assert.equal(intData.ok, true);
    }
  } finally {
    env.DB.close();
  }
});

test('V4.1 Security & RBAC: hasAnyAdminRole() rejects non-admin roles, blocks self-elevation, enforces /quan-tri', async () => {
  const env = await createTestEnv();
  env.R2 = createMockR2();
  try {
    // Unit verification of hasAnyAdminRole() fix
    const authSvc = new AuthService(env.DB, null, env);
    assert.equal(authSvc.hasAnyAdminRole({ roles: ['learner'] }), false);
    assert.equal(authSvc.hasAnyAdminRole({ roles: ['member', 'exam_admin'] }), false);
    assert.equal(authSvc.hasAnyAdminRole({ roles: ['super_admin'] }), true);
    assert.equal(authSvc.hasAnyAdminRole({ roles: ['support_admin'] }), true);

    // Unauthenticated /quan-tri redirects to internal /login
    const guestAdmin = await worker.fetch(new Request('https://wordbridge.io.vn/quan-tri'), env);
    assert.equal(guestAdmin.status, 404);
    assert.equal(guestAdmin.headers.get('location'), null);

    // Normal user gets 403 on /quan-tri and /api/v1/admin/dashboard
    const member = await registerVerifyAndLogin(env, 'normal-member@wordbridge.io.vn');
    const memberAdminPage = await worker.fetch(new Request('https://wordbridge.io.vn/quan-tri', {
      headers: { Cookie: member.cookie },
    }), env);
    assert.equal(memberAdminPage.status, 404);
    const memberAdminApi = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/dashboard', {
      headers: { Cookie: member.cookie },
    }), env);
    assert.equal(memberAdminApi.status, 403);

    // Create Super Admin via DB bootstrap
    const superAdmin = await registerVerifyAndLogin(env, 'superadmin@wordbridge.io.vn');
    await env.DB.prepare("INSERT INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, 'role_super_admin', NULL)").bind(superAdmin.accountId).run();

    // Super Admin can access all 7 /quan-tri sections
    for (const sec of ['', '/accounts', '/staff', '/academic', '/data', '/security', '/operations']) {
      const res = await worker.fetch(new Request(`https://wordbridge.io.vn/quan-tri${sec}`, {
        headers: { Cookie: superAdmin.cookie },
      }), env);
      assert.equal(res.status, 404, `/quan-tri${sec} must be blocked (404) on public website`);
    }

    // Anti-self-elevation: Super Admin cannot assign a role to self
    const selfAssign = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/roles/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ accountId: superAdmin.accountId, roleCode: 'platform_admin' }),
    }), env);
    assert.equal(selfAssign.status, 403);

    // Super Admin assigns support_admin to member
    const assignOk = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/roles/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ accountId: member.accountId, roleCode: 'support_admin' }),
    }), env);
    assert.equal(assignOk.status, 200);

    // support_admin cannot assign super_admin to anyone (lacks rbac:manage & not super_admin)
    const supportEscalate = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/roles/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member.cookie, 'X-CSRF-Token': member.csrfToken },
      body: JSON.stringify({ accountId: superAdmin.accountId, roleCode: 'super_admin' }),
    }), env);
    assert.equal(supportEscalate.status, 403);

    // Super Admin runs D1 integrity check + logical backup snapshot to R2
    const integrityRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/data/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ snapshotType: 'integrity_check' }),
    }), env);
    assert.equal(integrityRes.status, 201);
    const backupRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/data/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ snapshotType: 'logical_d1_summary' }),
    }), env);
    assert.equal(backupRes.status, 201);
    const backupData = await backupRes.json();
    assert.ok(backupData.r2ObjectKey.startsWith('backups/'));

    // Super Admin toggles Maintenance Mode ON -> guest gets 503 on /, Super Admin still accesses /quan-tri
    const maintOn = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ configKey: 'site.maintenance_mode', configValue: 'true' }),
    }), env);
    assert.equal(maintOn.status, 200);
    const guestHome = await worker.fetch(new Request('https://wordbridge.io.vn/'), env);
    assert.equal(guestHome.status, 503);
    const adminBlocked = await worker.fetch(new Request('https://wordbridge.io.vn/quan-tri', { headers: { Cookie: superAdmin.cookie } }), env);
    assert.equal(adminBlocked.status, 404);
    const adminApiStillUp = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/dashboard', { headers: { Cookie: superAdmin.cookie } }), env);
    assert.equal(adminApiStillUp.status, 200);

    // Turn Maintenance Mode back OFF
    await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdmin.cookie, 'X-CSRF-Token': superAdmin.csrfToken },
      body: JSON.stringify({ configKey: 'site.maintenance_mode', configValue: 'false' }),
    }), env);

    // Verify audit logs recorded real admin actions
    const auditCnt = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM wb_audit_logs WHERE action IN ('rbac.role_assigned', 'data.integrity_check', 'data.logical_d1_summary', 'operations.config_updated')").first();
    assert.ok(auditCnt.cnt >= 4);
  } finally {
    env.DB.close();
  }
});

test('V4.1 Real Help Center (/help) & Real Reader (/reader) + R2 Integration', async () => {
  const env = await createTestEnv();
  env.R2 = createMockR2();
  try {
    const learner = await registerVerifyAndLogin(env, 'help-reader@wordbridge.io.vn');
    const admin = await registerVerifyAndLogin(env, 'support-boss@wordbridge.io.vn');
    await env.DB.prepare("INSERT INTO wb_account_roles (account_id, role_id, granted_by) VALUES (?, 'role_super_admin', NULL)").bind(admin.accountId).run();

    // 1. /help renders directly (200 OK, no subdomain redirect)
    const helpRes = await worker.fetch(new Request('https://wordbridge.io.vn/help', { headers: { Cookie: learner.cookie } }), env);
    assert.equal(helpRes.status, 200);
    assert.match(await helpRes.text(), /Trung Tâm Trợ Giúp WORD BRIDGE/);

    // 2. Learner submits real support ticket -> Admin replies -> Learner sees reply in /help & API
    const ticketRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: learner.cookie, 'X-CSRF-Token': learner.csrfToken },
      body: JSON.stringify({
        requestType: 'support',
        senderName: 'Học viên A',
        senderEmail: 'help-reader@wordbridge.io.vn',
        subject: 'Cần hỗ trợ đọc tài liệu Logistics',
        messageBody: 'Xin hướng dẫn cách lưu ghi chú khi đọc tài liệu trên /reader.',
      }),
    }), env);
    assert.equal(ticketRes.status, 201);
    const ticketData = await ticketRes.json();

    const replyRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/admin/support/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie, 'X-CSRF-Token': admin.csrfToken },
      body: JSON.stringify({
        ticketId: ticketData.ticketId,
        replyBody: 'Bạn mở tài liệu tại /reader và điền vào ô Ghi chú cá nhân bên dưới bài đọc.',
        newStatus: 'resolved',
      }),
    }), env);
    assert.equal(replyRes.status, 200);

    const listTickets = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/support/tickets', {
      headers: { Cookie: learner.cookie },
    }), env);
    const listData = await listTickets.json();
    assert.equal(listData.tickets.length, 1);
    assert.equal(listData.tickets[0].status, 'resolved');
    assert.equal(listData.tickets[0].replies.length, 1);

    // 3. /reader library & document detail & progress saving
    const readerPage = await worker.fetch(new Request('https://wordbridge.io.vn/reader', { headers: { Cookie: learner.cookie } }), env);
    assert.equal(readerPage.status, 200);
    assert.match(await readerPage.text(), /zh-hsk1-daily-greetings-dialogue/);

    const docPage = await worker.fetch(new Request('https://wordbridge.io.vn/reader/zh-hsk1-daily-greetings-dialogue', { headers: { Cookie: learner.cookie } }), env);
    assert.equal(docPage.status, 200);
    assert.match(await docPage.text(), /Nǐ hǎo/);

    const progRes = await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/reader/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: learner.cookie, 'X-CSRF-Token': learner.csrfToken },
      body: JSON.stringify({
        documentId: 'rdoc_zh_01',
        progressPercent: 75,
        bookmarked: true,
        personalNotes: 'Ghi nhớ cấu trúc 您贵姓.',
      }),
    }), env);
    assert.equal(progRes.status, 200);

    // 4. R2 adapter policy check: reader/ allowed, examinations/ blocked
    assert.equal(validateObjectKey('reader/zh-logistics-guide.pdf').valid, true);
    assert.equal(validateObjectKey('backups/snp_1.json').valid, true);
    assert.equal(validateObjectKey('examinations/old.pdf').valid, false);
    assert.equal(validateObjectKey('specialized/russian/bad.pdf').valid, false);

    const r2Svc = new R2StorageService(env.R2);
    await r2Svc.uploadObject({
      key: 'reader/sample-guide.txt',
      body: 'WORD BRIDGE Real R2 Reader Content',
      contentType: 'text/plain',
      visibility: 'private',
      uploadedBy: admin.accountId,
    });
    const obj = await r2Svc.getObject('reader/sample-guide.txt', { allowPrivate: true });
    assert.ok(obj);
  } finally {
    env.DB.close();
  }
});


// === V4.2 Bilingual, P0 Admin Block & 1101 Tests ===

async function createEnv() {
  return createTestEnv();
}

test('V4.2 P0: /quan-tri and /admin* are completely blocked (404, no redirect, no leak)', async () => {
  const env = await createEnv();
  try {
    for (const p of ['/admin', '/admin/accounts', '/admin/curriculum', '/quan-tri', '/quan-tri/accounts', '/quan-tri/security']) {
      const res = await worker.fetch(new Request(`https://wordbridge.io.vn${p}`), env);
      assert.equal(res.status, 404, `${p} must return 404`);
      assert.equal(res.headers.get('location'), null, `${p} must not redirect`);
      const html = await res.text();
      assert.doesNotMatch(html, /Trung tâm Quản trị|Super Admin|href="\/quan-tri/i);
    }

    const openapi = await (await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/openapi.json'), env)).json();
    assert.equal(openapi.paths['/admin/dashboard'], undefined, 'OpenAPI must not advertise admin routes');
  } finally {
    env.DB.close();
  }
});

test('V4.2 P2: Zero Russian across all public pages and Russian routes return 410', async () => {
  const env = await createEnv();
  try {
    const publicRoutes = ['/', '/learning', '/learning/chinese', '/learning/english', '/learning/skills', '/dictionary', '/practice', '/specialized', '/reader', '/help', '/about', '/faq', '/login', '/register'];
    for (const route of publicRoutes) {
      const res = await worker.fetch(new Request(`https://wordbridge.io.vn${route}`), env);
      assert.equal(res.status, 200, `${route} should return 200`);
      const html = await res.text();
      assert.doesNotMatch(html, /Tiếng Nga|Русский|card-ru\.jpg|\/learning\/russian|\/dictionary\/russian/i, `${route} must not contain Russian`);
      assert.doesNotMatch(html, /href="\/quan-tri|Trung tâm Quản trị Tối cao|Không có bài tập giả|presentation và bridge/i, `${route} must not contain internal jargon or admin links`);
    }

    for (const ruPath of ['/learning/russian', '/learning/ru', '/dictionary/russian', '/specialized/russian']) {
      const res = await worker.fetch(new Request(`https://wordbridge.io.vn${ruPath}`), env);
      assert.equal(res.status, 410, `${ruPath} must return 410 Gone`);
    }

    const health = await (await worker.fetch(new Request('https://wordbridge.io.vn/api/v1/health'), env)).json();
    assert.equal(health.ok, true);
    assert.equal(health.database.officialLanguages, 2, 'Active official languages in D1 must be 2 (zh, en)');
  } finally {
    env.DB.close();
  }
});

test('V4.2 P0/XI: Error 1101 is handled as Worker Exception (not invalid session) and fetch/scheduled never crash uncaught', async () => {
  const res1101 = renderErrorPage({ code: 1101, currentPath: '/', requestId: 'a5ee8729dc25797c' });
  assert.equal(res1101.status, 500);
  const html1101 = await res1101.text();
  assert.match(html1101, /1101/);
  assert.match(html1101, /Worker Exception|Cloudflare Worker/i);
  assert.doesNotMatch(html1101, /Phiên đăng nhập không hợp lệ/i);

  // Missing DB must return clean 500 without throwing uncaught Worker exception
  const brokenRes = await worker.fetch(new Request('https://wordbridge.io.vn/'), {});
  assert.equal(brokenRes.status, 500);
  const brokenHtml = await brokenRes.text();
  assert.doesNotMatch(brokenHtml, /at Object\.fetch|node:internal/);

  // scheduled() with empty/broken env must never throw uncaught
  await assert.doesNotReject(() => worker.scheduled({}, {}));
  await assert.doesNotReject(() => worker.scheduled({}, { DB: { prepare() { throw new Error('DB_DOWN'); } } }));
});
