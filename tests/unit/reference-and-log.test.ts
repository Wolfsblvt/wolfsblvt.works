import { describe, expect, it } from 'vitest';
import { assertRedacted } from '../../worker/contact/log';
import { createReference, REFERENCE_PATTERN } from '../../worker/contact/reference';

describe('createReference', () => {
  it('produces a dated, readable reference', () => {
    const reference = createReference(new Date('2026-09-22T23:59:59Z'), () => new Uint8Array([0, 1, 2, 3, 255]));
    // 255 % 30 = 15, the sixteenth letter of the readable alphabet.
    expect(reference).toBe('WW-20260922-ABCDS');
    expect(reference).toMatch(REFERENCE_PATTERN);
  });

  it('uses only the readable alphabet with real randomness', () => {
    for (let i = 0; i < 50; i++) expect(createReference()).toMatch(REFERENCE_PATTERN);
  });
});

describe('assertRedacted', () => {
  it('refuses any event that carries a visitor-content key', () => {
    expect(() => assertRedacted({ event: 'contact.submission', clientIp: '1.2.3.4' })).not.toThrow();
    for (const key of ['name', 'email', 'subject', 'message', 'token', 'cf-turnstile-response']) {
      expect(() => assertRedacted({ [key]: 'x' })).toThrow(/Refusing to log/);
    }
  });
});
