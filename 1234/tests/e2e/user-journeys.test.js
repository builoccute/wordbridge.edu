import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';

function extractSessionCookie(res) {
  const raw = res.headers.get('Set-Cookie') || '';
  const match = raw.match(/wb_session=[^;]+/);
  return match ? match[0] : '';
}

test('End-to-End V3.1 Journey: CSRF + Real Lesson Evaluation + Dedicated Module/Result/Exam Attempt/Result Pages + Student Benefit + Admin CMS & 15 Intelligence Status', async () => {
  const env = await createTestEnv();
  try {
    // 1. Guest blocked on interactive progress
    const guestProgress = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/learning/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 'les_zh_02_2' }),
    }), env, {});
    assert.equal(guestProgress.status, 401);

    // 2. Register 8 fields & verify email
    const regRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Trần Gia Bảo',
        dateOfBirth: '2003-08-20',
        phoneNumber: '0909123456',
        email: 'giabao.v31@example.com',
        password: 'WordBridge2026Secure',
        confirmPassword: 'WordBridge2026Secure',
        schoolName: 'Đại học Khoa học Tự nhiên TP.HCM',
        workplaceName: 'Phòng Nghiên cứu Ngôn ngữ Ứng dụng',
      }),
    }), env, {});
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();

    const verifyRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: regData.verificationToken }),
    }), env, {});
    assert.equal(verifyRes.status, 200);
    const { csrfToken } = await verifyRes.json();
    const cookie = extractSessionCookie(verifyRes);
    const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken };

    // 3. Dedicated Module page shows module-specific content + progress
    const modPage = await worker.fetch(new Request('https://www.wordbridge.vn/modules/chinese-beginner-module-1', { headers: { Cookie: cookie } }), env, {});
    assert.equal(modPage.status, 200);
    const modHtml = await modPage.text();
    assert.ok(modHtml.includes('Mục tiêu & Điều kiện tiên quyết học phần'));
    assert.ok(modHtml.includes('Tiến độ cá nhân trong học phần'));

    // 4. Lesson page has real <audio> element and ZERO hardcoded scorePercent=100
    const lessonPage = await worker.fetch(new Request('https://www.wordbridge.vn/lessons/chinese-week-02-lesson-02', { headers: { Cookie: cookie } }), env, {});
    const lessonHtml = await lessonPage.text();
    assert.ok(lessonHtml.includes('<audio '), 'Lesson page must include real HTML5 <audio> element');
    assert.ok(!lessonHtml.includes('name="scorePercent" value="100"'), 'Must not hardcode scorePercent=100');

    // Submit real graded lesson answer & verify dedicated /lessons/:slug/result page
    const progRes = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/learning/progress', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lessonId: 'les_zh_02_2', answers: { qb_zh_1: '海运提单' } }),
    }), env, {});
    assert.equal(progRes.status, 201);
    const lesResultPage = await worker.fetch(new Request('https://www.wordbridge.vn/lessons/chinese-week-02-lesson-02/result', { headers: { Cookie: cookie } }), env, {});
    assert.equal(lesResultPage.status, 200);
    const lesResultHtml = await lesResultPage.text();
    assert.ok(lesResultHtml.includes('Kết quả bài học:'));
    assert.ok(lesResultHtml.includes('Chi tiết câu trả lời & Giải thích'));

    // 5. Dedicated Exam Attempt -> Draft -> Submit -> Dedicated Exam Result -> Exam History
    const startExam = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/examinations/start', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ examSlug: 'hsk-1-reference-diagnostic' }),
    }), env, {});
    const { attemptId } = await startExam.json();

    const attemptPage = await worker.fetch(new Request(`https://www.wordbridge.vn/examination-attempts/${attemptId}`, { headers: { Cookie: cookie } }), env, {});
    assert.equal(attemptPage.status, 200);
    assert.ok((await attemptPage.text()).includes('Làm bài khảo thí:'));

    const draftRes = await worker.fetch(new Request(`https://www.wordbridge.vn/api/v1/examination-attempts/${attemptId}/draft`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ answers: { qb_zh_1: '海运提单' } }),
    }), env, {});
    assert.equal(draftRes.status, 200);

    const submitExam = await worker.fetch(new Request(`https://www.wordbridge.vn/api/v1/examination-attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ answers: { qb_zh_1: '海运提单', qb_zh_2: '我是越南学生。' } }),
    }), env, {});
    const examData = await submitExam.json();
    assert.equal(examData.certificateIssued, false);

    const examResultPage = await worker.fetch(new Request(`https://www.wordbridge.vn/examination-results/${attemptId}`, { headers: { Cookie: cookie } }), env, {});
    assert.equal(examResultPage.status, 200);
    assert.ok((await examResultPage.text()).includes('Xem lại từng câu & Giải thích'));

    const examHistoryPage = await worker.fetch(new Request('https://www.wordbridge.vn/examinations/history', { headers: { Cookie: cookie } }), env, {});
    assert.equal(examHistoryPage.status, 200);
    assert.ok((await examHistoryPage.text()).includes('Lịch sử khảo thí cá nhân'));

    // 6. RBAC Admin CMS & 15 Intelligence Statuses
    await env.DB.prepare("INSERT INTO wb_account_roles (account_id, role_id) VALUES (?, 'role_super_admin')").bind(regData.accountId).run();
    const cmsCreate = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/admin/programs', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ code: 'WB-ZH-GEN-02', slug: 'chinese-hsk2-gen', nameVi: 'Tiếng Trung Tổng quát HSK 2', languageCode: 'zh', programType: 'general' }),
    }), env, {});
    assert.equal(cmsCreate.status, 201);

    const intelStatusUpd = await worker.fetch(new Request('https://www.wordbridge.vn/api/v1/admin/intelligence/status', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ systemSlug: 'pronunciation-lab', operationalStatus: 'unconfigured' }),
    }), env, {});
    assert.equal(intelStatusUpd.status, 200);
  } finally {
    env.DB.close();
  }
});
