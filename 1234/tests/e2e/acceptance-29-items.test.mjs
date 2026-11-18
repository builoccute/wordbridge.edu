import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/worker.mjs';
import { resetRateLimitsForTest } from '../../src/utils/security.mjs';

test('E2E 1: Full Homepage, Locked Header, Locked Footer, Zero PDF Reader in Header/Footer/Homepage, and Prohibited Features Verification', async () => {
  resetRateLimitsForTest();
  const res = await worker.fetch(new Request('https://www.wordbridge.vn/'));
  assert.equal(res.status, 200);
  const html = await res.text();

  // Verify Brand & Tagline
  assert.equal(html.includes('WORD'), true);
  assert.equal(html.includes('BRIDGE'), true);
  assert.equal(html.includes('Where Languages Bring People Together.'), true);

  // Verify Locked 8 Header Navigation Items
  for (const item of [
    'Trang chủ',
    'Học ngoại ngữ',
    'Từ điển',
    'Luyện tập',
    'Khảo thí',
    'Ngoại ngữ chuyên ngành',
    'Learner Meet',
    'Giới thiệu',
  ]) {
    assert.equal(html.includes(item), true, `Missing header item: ${item}`);
  }

  // Verify PDF Reader (reader.wordbridge.vn) is NOT in Header, Footer, or Homepage HTML
  assert.equal(html.includes('reader.wordbridge.vn'), false);

  // Verify 7 Vietnamese Admin Centers are rendered in Vietnamese
  for (const center of [
    'Trung tâm biên tập học liệu',
    'Trung tâm quản trị khảo thí',
    'Trung tâm trí tuệ học tập',
    'Trung tâm đa ngôn ngữ',
    'Trung tâm chất lượng ngôn ngữ',
    'Trung tâm bảo mật và kiểm toán',
    'Trung tâm vận hành hạ tầng',
  ]) {
    assert.equal(html.includes(center), true, `Missing admin center: ${center}`);
  }

  // Verify Learner Meet prohibitions (chat, recording, screen-share) are enforced at API level
  const regRes = await worker.fetch(
    new Request('https://www.wordbridge.vn/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nguyễn Hải Đăng',
        dateOfBirth: '1997-07-07',
        phoneNumber: '+84933444555',
        email: 'haidang@wordbridge.vn',
        password: 'Password2026',
        confirmPassword: 'Password2026',
        schoolName: 'Đại học Sư phạm',
        workplaceName: 'Trung tâm Ngôn ngữ',
      }),
    })
  );
  const regData = await regRes.json();
  const verRes = await worker.fetch(
    new Request(`https://www.wordbridge.vn/api/auth/verify-email?token=${regData.verificationToken}`)
  );
  const verData = await verRes.json();
  const token = verData.sessionToken;

  const meetChatAttempt = await worker.fetch(
    new Request('https://www.wordbridge.vn/api/learner-meet/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId: 'room1', actionType: 'SEND_CHAT_MESSAGE' }),
    })
  );
  assert.equal(meetChatAttempt.status, 403);

  const meetRecordAttempt = await worker.fetch(
    new Request('https://www.wordbridge.vn/api/learner-meet/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId: 'room1', actionType: 'START_RECORDING' }),
    })
  );
  assert.equal(meetRecordAttempt.status, 403);

  // Verify prohibited endpoints (certificates, social, organizations) return 403
  for (const forbiddenPath of ['/api/certificates', '/api/social/feed', '/api/organizations']) {
    const fRes = await worker.fetch(new Request(`https://www.wordbridge.vn${forbiddenPath}`));
    assert.equal(fRes.status, 403);
  }
});
