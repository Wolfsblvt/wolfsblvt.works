import { describe, expect, it } from 'vitest';
import { buildInternalNotification, buildVisitorCopy, headerSafe } from '../../worker/contact/mail';
import type { ValidSubmission } from '../../worker/contact/validate';

const submission: ValidSubmission = {
  category: 'security',
  categoryLabel: 'Security',
  product: 'agents',
  productLabel: "Wolf's Agents",
  name: 'Ada "Lovelace" <admin>',
  email: 'ada@example.org',
  subject: 'Report',
  message: '<b>not html</b>\nline two',
};

const context = {
  reference: 'WW-20260922-ABCDE',
  receivedAt: new Date('2026-09-22T03:04:05.000Z'),
  environment: 'test',
  buildVersion: 'abc123',
  siteUrl: 'https://wolfsblvt.works/',
};

describe('internal notification', () => {
  const mail = buildInternalNotification(submission, context);

  it('is sent from and to the fixed contact identity with the visitor only in Reply-To', () => {
    expect(mail.from).toEqual({ email: 'contact@wolfsblvt.works', name: 'Wolfsblvt Works contact form' });
    expect(mail.to).toEqual({ email: 'contact@wolfsblvt.works' });
    expect(mail.replyTo).toEqual({ email: 'ada@example.org', name: 'Ada Lovelace admin' });
  });

  it('carries category, reference, product, subject and the message as plain text', () => {
    expect(mail.subject).toBe('[Contact] Security: Report');
    expect(mail.text).toContain('Reference: WW-20260922-ABCDE');
    expect(mail.text).toContain('Received:  2026-09-22T03:04:05.000Z');
    expect(mail.text).toContain("Product:   Wolf's Agents");
    expect(mail.text).toContain('<b>not html</b>\nline two');
    expect(mail.text).toContain('build abc123');
  });

  it('says so when no product was given', () => {
    const plain = buildInternalNotification({ ...submission, product: null, productLabel: null, name: null }, context);
    expect(plain.text).toContain('Product:   none given');
    expect(plain.text).toContain('From:      ada@example.org');
    expect(plain.replyTo).toEqual({ email: 'ada@example.org', name: undefined });
  });
});

describe('visitor copy', () => {
  const mail = buildVisitorCopy(submission, context);

  it('uses the fixed Works subject with the reference', () => {
    expect(mail.subject).toBe('Your message to Wolfsblvt Works · WW-20260922-ABCDE');
    expect(mail.from).toEqual({ email: 'contact@wolfsblvt.works', name: 'Wolfsblvt Works' });
    expect(mail.to).toEqual({ email: 'ada@example.org', name: 'Ada Lovelace admin' });
    expect(mail.replyTo).toEqual({ email: 'contact@wolfsblvt.works', name: 'Wolfsblvt Works' });
  });

  it('states that acceptance is not reading and repeats what was submitted', () => {
    expect(mail.text).toContain('does not mean that anyone has read it yet');
    expect(mail.text).toContain('Subject:   Report');
    expect(mail.text).toContain('--- Your message ---\n<b>not html</b>\nline two\n--- End of message ---');
  });
});

describe('headerSafe', () => {
  it('collapses line breaks and control characters into single spaces', () => {
    expect(headerSafe('a\r\nb\tc\u0000d')).toBe('a b c d');
  });
});
