// Combined test suite with source-file blocks and original assertions.

// Source: core-systems.test.mjs (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {
  hashPassword,
  verifyPassword,
  validateRegistrationInput,
  detectSqlInjectionPattern,
  escapeHtml,
} = await import("../../src/utils/security.mjs");
const { assertSafeSqlStatement, D1_DATABASE_METADATA } = await import("../../src/services/d1-database.mjs");
const { validateR2ObjectKey, validateUploadFile, R2_BUCKET_METADATA } = await import("../../src/services/r2-storage.mjs");
const { renderEmailTemplate, EMAIL_TEMPLATES_CATALOG, OFFICIAL_EMAIL_ADDRESSES } = await import("../../src/services/email-service.mjs");
const { calculateNextSpacedRepetition } = await import("../../src/modules/examination/learning-rules.mjs");
const {
  FIFTEEN_SYSTEMS_SPEC,
  computeLanguageDna,
  analyzeLanguageTransfer,
  runKnowledgeToLanguage,
  evaluateSimulatorStep,
  analyzeErrorGenome,
  lookupMeaningEquivalence,
  computeLanguageTimeline,
  evaluatePronunciation,
  queryMultiLanguageGraph,
  analyzePersonalCorpus,
  evaluateContextReconstruction,
  scoreComprehensionDepth,
  computeLearningRecovery,
  evaluateLanguageQualityBenchmark,
  generatePersonalObservatoryReport,
} = await import("../../src/modules/language-intelligence/engine.mjs");
test('Unit 1: Password hashing uses PBKDF2-SHA256 with unique salt and verifies accurately', async () => {
  const { hashHex, saltHex } = await hashPassword('WordBridge2026Strong');
  assert.equal(hashHex.length, 64);
  assert.equal(saltHex.length, 32);
  assert.equal(await verifyPassword('WordBridge2026Strong', hashHex, saltHex), true);
  assert.equal(await verifyPassword('WrongPassword123', hashHex, saltHex), false);
});

test('Unit 2: Registration validation enforces all 8 mandatory fields with separate School & Workplace', () => {
  const missingWorkplace = validateRegistrationInput({
    fullName: 'Trần Minh Quân',
    dateOfBirth: '2001-08-20',
    phoneNumber: '+84912345678',
    email: 'quan@example.edu.vn',
    password: 'Password2026',
    confirmPassword: 'Password2026',
    schoolName: 'Đại học Bách Khoa',
    workplaceName: '',
  });
  assert.equal(missingWorkplace.valid, false);

  const valid = validateRegistrationInput({
    fullName: 'Trần Minh Quân',
    dateOfBirth: '2001-08-20',
    phoneNumber: '+84912345678',
    email: 'quan@example.edu.vn',
    password: 'Password2026',
    confirmPassword: 'Password2026',
    schoolName: 'Đại học Bách Khoa TP.HCM',
    workplaceName: 'Công ty Logistics Quốc tế',
  });
  assert.equal(valid.valid, true);
});

test('Unit 3: Cloudflare D1 metadata & anti-DROP guard', () => {
  assert.equal(D1_DATABASE_METADATA.databaseName, 'word');
  assert.equal(D1_DATABASE_METADATA.databaseId, 'ce84cc48-6d49-409b-b45a-13ba3bc4a771');
  assert.throws(() => assertSafeSqlStatement('DROP TABLE accounts;'), /SECURITY_POLICY_VIOLATION/);
  assert.doesNotThrow(() => assertSafeSqlStatement('CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY);'));
});

test('Unit 4: Cloudflare R2 object key prefixes, Learner Meet recording prohibition & Email PNG rejection', () => {
  assert.equal(R2_BUCKET_METADATA.bucketName, 'word');
  assert.equal(validateR2ObjectKey('learning/chinese/hsk1/audio.mp3').valid, true);
  assert.equal(validateR2ObjectKey('specialized/english/it/guide.pdf').valid, true);
  assert.equal(validateR2ObjectKey('specialized/russian/not-allowed.pdf').valid, false);
  assert.equal(validateR2ObjectKey('user-content/learner-meet-recording.mp4').valid, false);
  assert.equal(validateUploadFile('branding/email-logo.png', 'image/png', 1024, true).valid, false);
  assert.equal(validateUploadFile('branding/email-logo.svg', 'image/svg+xml', 1024, true).valid, true);
});

test('Unit 5: Email service enforces 3 official addresses, Reply-To routing, 11 templates & zero PNG logo', () => {
  assert.equal(OFFICIAL_EMAIL_ADDRESSES.CSKH, 'cskh@wordbridge.vn');
  assert.equal(OFFICIAL_EMAIL_ADDRESSES.NOREPLY, 'noreply@wordbridge.vn');
  assert.equal(OFFICIAL_EMAIL_ADDRESSES.CONTACT, 'contact@wordbridge.vn');
  assert.equal(Object.keys(EMAIL_TEMPLATES_CATALOG).length, 11);

  const rendered = renderEmailTemplate('EMAIL_VERIFICATION', {
    recipientName: 'Lê Hoàng Nam',
    ctaLabel: 'Xác minh Email',
    ctaUrl: 'https://www.wordbridge.vn/verify',
  });
  assert.equal(rendered.from, 'WORD BRIDGE <noreply@wordbridge.vn>');
  assert.equal(rendered.replyTo, 'cskh@wordbridge.vn');
  assert.equal(rendered.html.includes('.png'), false);
  assert.equal(rendered.html.includes('Where Languages Bring People Together.'), true);
});

test('Unit 6: All 15 Differentiating Language Intelligence Systems execute real algorithms', () => {
  assert.equal(FIFTEEN_SYSTEMS_SPEC.length, 15);
  assert.ok(computeLanguageDna({ languageCode: 'zh' }).compositeDnaIndex > 0);
  assert.ok(analyzeLanguageTransfer({ targetLanguage: 'en', sampleText: 'Although it rained, but he went.' }).negativeInterferences.length > 0);
  assert.equal(runKnowledgeToLanguage({ languageCode: 'ru' }).error, true); // Russian specialized blocked
  assert.equal(runKnowledgeToLanguage({ languageCode: 'zh', domainCode: 'LOGISTICS' }).concepts.length, 2);
  assert.equal(evaluateSimulatorStep({ step: 1, userChoice: 'FORMAL_COMPLETE' }).pragmaticAppropriateness, 94);
  assert.ok(analyzeErrorGenome({ languageCode: 'ru' }).detectedGenes.length > 0);
  assert.ok(lookupMeaningEquivalence({ conceptSlug: 'verify-compliance' }).result.expressionRu.includes('Проверить'));
  assert.equal(computeLanguageTimeline({ languageCode: 'en' }).trajectoryTrend, 'UPWARD_GROWTH');
  assert.equal(evaluatePronunciation({ languageCode: 'en', targetPhrase: 'resilience', recognizedTranscript: 'resilience' }).phonemeAccuracy, 100);
  assert.ok(queryMultiLanguageGraph({ nodeId: 'aspect-completion' }).node.zh.includes('了'));
  assert.ok(analyzePersonalCorpus({ languageCode: 'en', text: 'Empirical data suggest strong system resilience.' }).tokenCount >= 6);
  assert.equal(evaluateContextReconstruction({ languageCode: 'zh', selectedRegister: 'FORMAL' }).contextMatchScore, 95);
  assert.equal(scoreComprehensionDepth({ literalCorrect: 1, inferentialCorrect: 1, pragmaticCorrect: 1, criticalCorrect: 1 }).depthIndex, 100);
  assert.ok(computeLearningRecovery({}).items.length >= 3);
  assert.ok(evaluateLanguageQualityBenchmark({ languageCode: 'en', submittedText: 'Furthermore, empirical evidence suggests resilience.' }).compositeBenchmark > 70);
  assert.ok(generatePersonalObservatoryReport({ accountId: 'acc_1', languageCode: 'en' }).recommendedActions.length >= 3);
});

test('Unit 7: Spaced Repetition SM-2 schedules next interval accurately', () => {
  const first = calculateNextSpacedRepetition({ quality: 5, repetitions: 0, easeFactor: 2.5, intervalDays: 1 });
  assert.equal(first.repetitions, 1);
  assert.equal(first.intervalDays, 1);
  const second = calculateNextSpacedRepetition({ quality: 5, repetitions: 1, easeFactor: first.easeFactor, intervalDays: 1 });
  assert.equal(second.repetitions, 2);
  assert.equal(second.intervalDays, 3);
});

}

// Source: email-templates.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const { EMAIL_TEMPLATE_KEYS, renderEmailTemplate } = await import("../../email/templates/registry.js");
const { EmailService } = await import("../../src/services/email-service.js");
const { createTestEnv } = await import("../helpers/sqlite-d1-shim.js");
test('All 30 mandatory email templates render complete HTML and Plain Text fallback with brand wordmark (no PNG)', () => {
  assert.equal(EMAIL_TEMPLATE_KEYS.length, 30);
  for (const key of EMAIL_TEMPLATE_KEYS) {
    const rendered = renderEmailTemplate(key, {
      fullName: 'Học viên Kiểm thử',
      ctaUrl: 'https://www.wordbridge.vn/verify-email?token=sample',
      senderName: 'Đối tác',
      ticketId: 'cskh_001',
      subject: 'Hỗ trợ kỹ thuật',
    });
    assert.ok(rendered.html.includes('<!DOCTYPE html>'), `Template ${key} missing DOCTYPE`);
    assert.ok(rendered.html.includes('WORD') && rendered.html.includes('BRIDGE'), `Template ${key} missing wordmark`);
    assert.ok(!rendered.html.includes('.png'), `Template ${key} must not use PNG logo fallback`);
    assert.ok(rendered.text.length > 40, `Template ${key} missing Plain Text fallback`);
  }
});

test('Official email channel routing enforces noreply@, cskh@, contact@ and Reply-To rules', () => {
  const sys = renderEmailTemplate('verify_email', {});
  assert.equal(sys.senderAddress, 'noreply@wordbridge.vn');
  assert.equal(sys.replyTo, 'cskh@wordbridge.vn');

  const cskh = renderEmailTemplate('support_request_confirmation', {});
  assert.equal(cskh.senderAddress, 'cskh@wordbridge.vn');
  assert.equal(cskh.replyTo, 'cskh@wordbridge.vn');

  const contact = renderEmailTemplate('contact_partnership_confirmation', {});
  assert.equal(contact.senderAddress, 'contact@wordbridge.vn');
  assert.equal(contact.replyTo, 'contact@wordbridge.vn');
});

test('EmailService enforces idempotency and never fabricates DELIVERED when provider is unconfigured', async () => {
  const env = await createTestEnv();
  try {
    const svc = new EmailService(env.DB, env);
    const first = await svc.sendEventEmail({
      eventType: 'UserRegistered',
      templateKey: 'verify_email',
      recipientEmail: 'learner@example.com',
      idempotencyKey: 'idem-test-001',
      variables: { fullName: 'Test User' },
    });
    assert.equal(first.deduplicated, false);
    assert.equal(first.status, 'BLOCKED_UNCONFIGURED');

    const second = await svc.sendEventEmail({
      eventType: 'UserRegistered',
      templateKey: 'verify_email',
      recipientEmail: 'learner@example.com',
      idempotencyKey: 'idem-test-001',
      variables: { fullName: 'Test User' },
    });
    assert.equal(second.deduplicated, true);
    assert.equal(second.eventId, first.eventId);
  } finally {
    env.DB.close();
  }
});

}

// Source: language-scope.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const { assertOfficialLanguage, assertSpecializedLanguage, isAcademicSchoolEmail, validateRegistrationPayload } = await import("../../src/utils/http.js");
const { validateObjectKey } = await import("../../src/modules/audio/media-service.js");
const { OFFICIAL_LANGUAGES, INTELLIGENCE_SYSTEMS } = await import("../../src/config/constants.js");
test('Official language scope strictly allows ONLY zh, en, ru and rejects ja/ko', () => {
  assert.equal(assertOfficialLanguage('zh'), 'zh');
  assert.equal(assertOfficialLanguage('en'), 'en');
  assert.equal(assertOfficialLanguage('ru'), 'ru');
  assert.equal(Object.keys(OFFICIAL_LANGUAGES).length, 3);
  assert.throws(() => assertOfficialLanguage('ja'));
  assert.throws(() => assertOfficialLanguage('ko'));
  assert.throws(() => assertOfficialLanguage('japanese'));
  assert.throws(() => assertOfficialLanguage('korean'));
});

test('Specialized language scope strictly allows ONLY zh and en; rejects ru', () => {
  assert.equal(assertSpecializedLanguage('zh'), 'zh');
  assert.equal(assertSpecializedLanguage('en'), 'en');
  assert.throws(() => assertSpecializedLanguage('ru'));
  assert.throws(() => assertSpecializedLanguage('russian'));
  const k2l = INTELLIGENCE_SYSTEMS.find((s) => s.slug === 'knowledge-to-language');
  assert.deepEqual(k2l.languages, ['zh', 'en']);
});

test('R2 adapter enforces official prefixes and blocks Learner Meet recordings & forbidden languages', () => {
  assert.equal(validateObjectKey('audio/zh/week-01.mp3').valid, true);
  assert.equal(validateObjectKey('specialized/english/it-cloud.pdf').valid, true);
  assert.equal(validateObjectKey('specialized/russian/doc.pdf').valid, false);
  assert.equal(validateObjectKey('learning/japanese/lesson1.mp3').valid, false);
  assert.equal(validateObjectKey('recordings/learner-meet-123.webm').valid, false);
  assert.equal(validateObjectKey('user-content/learner-meet-record.mp4').valid, false);
});

test('Registration validation enforces all 8 mandatory independent fields', () => {
  const valid = validateRegistrationPayload({
    fullName: 'Nguyễn Minh Quân',
    dateOfBirth: '2002-05-14',
    phoneNumber: '0912345678',
    email: 'quan@example.edu.vn',
    password: 'StrongPassword2026',
    confirmPassword: 'StrongPassword2026',
    schoolName: 'Đại học Bách Khoa TP.HCM',
    workplaceName: 'Công ty Kỹ thuật Phần mềm ABC',
  });
  assert.equal(valid.valid, true);

  const missingWorkplace = validateRegistrationPayload({
    fullName: 'Nguyễn Minh Quân',
    dateOfBirth: '2002-05-14',
    phoneNumber: '0912345678',
    email: 'quan@example.edu.vn',
    password: 'StrongPassword2026',
    confirmPassword: 'StrongPassword2026',
    schoolName: 'Đại học Bách Khoa TP.HCM',
    workplaceName: '',
  });
  assert.equal(missingWorkplace.valid, false);
});

test('Student email verification accepts academic domains and rejects consumer domains', () => {
  assert.equal(isAcademicSchoolEmail('sv2026@hcmut.edu.vn'), true);
  assert.equal(isAcademicSchoolEmail('student@mit.edu'), true);
  assert.equal(isAcademicSchoolEmail('user@gmail.com'), false);
  assert.equal(isAcademicSchoolEmail('user@yahoo.com'), false);
});

}

// Source: security-csrf-webhook.test.js (full test body preserved)
{
const {default: test} = await import("node:test");
const {default: assert} = await import("node:assert/strict");
const {default: worker} = await import("../../src/index.js");
const { createTestEnv } = await import("../helpers/sqlite-d1-shim.js");
const { hmacSha256Hex } = await import("../../src/utils/crypto.js");
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

}
