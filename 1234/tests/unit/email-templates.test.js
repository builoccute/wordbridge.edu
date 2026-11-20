import test from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL_TEMPLATE_KEYS, renderEmailTemplate } from '../../email/templates/registry.js';
import { EmailService } from '../../src/services/email-service.js';
import { createTestEnv } from '../helpers/sqlite-d1-shim.js';

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
