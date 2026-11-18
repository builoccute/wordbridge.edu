import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  validateRegistrationInput,
  detectSqlInjectionPattern,
  escapeHtml,
} from '../../src/utils/security.mjs';
import { assertSafeSqlStatement, D1_DATABASE_METADATA } from '../../src/services/d1-database.mjs';
import { validateR2ObjectKey, validateUploadFile, R2_BUCKET_METADATA } from '../../src/services/r2-storage.mjs';
import { renderEmailTemplate, EMAIL_TEMPLATES_CATALOG, OFFICIAL_EMAIL_ADDRESSES } from '../../src/services/email-service.mjs';
import { calculateNextSpacedRepetition } from '../../src/modules/dictionary/spaced-repetition.mjs';
import {
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
} from '../../src/modules/language-intelligence/engine.mjs';

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
