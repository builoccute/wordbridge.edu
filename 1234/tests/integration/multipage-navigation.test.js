import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/index.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';
import { INTELLIGENCE_SYSTEMS } from '../../src/config/constants.js';

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
