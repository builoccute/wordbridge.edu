import test from 'node:test';
import assert from 'node:assert/strict';
import { assertOfficialLanguage, assertSpecializedLanguage, isAcademicSchoolEmail, validateRegistrationPayload } from '../../src/utils/validation.js';
import { validateObjectKey } from '../../storage/r2-adapter.js';
import { OFFICIAL_LANGUAGES, INTELLIGENCE_SYSTEMS } from '../../src/config/constants.js';

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
