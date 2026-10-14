import { describe, expect, it } from 'vitest';
import { FIELDS, LIMITS } from '../../shared/contact-contract';
import { validateSubmission } from '../../worker/contact/validate';

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const base: Record<string, string> = {
    [FIELDS.category]: 'collaboration',
    [FIELDS.product]: '',
    [FIELDS.name]: 'Ada',
    [FIELDS.email]: 'ada@example.org',
    [FIELDS.subject]: 'A question',
    [FIELDS.message]: 'Hello there.\n\nSecond paragraph with https://example.org/link.',
  };
  for (const [key, value] of Object.entries({ ...base, ...overrides })) data.set(key, value);
  return data;
}

function errorsFor(overrides: Record<string, string>): string[] {
  const result = validateSubmission(form(overrides));
  return result.ok ? [] : result.errors.map((error) => error.field);
}

describe('validateSubmission', () => {
  it('accepts a complete submission and normalizes line endings', () => {
    const result = validateSubmission(form({ [FIELDS.message]: 'line one\r\nline two\r\n' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      category: 'collaboration',
      categoryLabel: 'Working together',
      product: null,
      productLabel: null,
      name: 'Ada',
      email: 'ada@example.org',
      subject: 'A question',
      message: 'line one\nline two',
    });
  });

  it('requires category, email, subject and message', () => {
    expect(errorsFor({ [FIELDS.category]: '' })).toEqual([FIELDS.category]);
    expect(errorsFor({ [FIELDS.email]: '' })).toEqual([FIELDS.email]);
    expect(errorsFor({ [FIELDS.subject]: '   ' })).toEqual([FIELDS.subject]);
    expect(errorsFor({ [FIELDS.message]: '' })).toEqual([FIELDS.message]);
  });

  it('rejects unknown categories', () => {
    expect(errorsFor({ [FIELDS.category]: 'sales' })).toEqual([FIELDS.category]);
  });

  it('recognizes registered products and silently ignores unknown ones', () => {
    const known = validateSubmission(form({ [FIELDS.product]: 'agents' }));
    expect(known.ok && known.value.productLabel).toBe("Wolf's Agents");
    const unknown = validateSubmission(form({ [FIELDS.product]: '<script>alert(1)</script>' }));
    expect(unknown.ok && unknown.value.product).toBeNull();
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['nope', 'a@b', 'a@b.', 'a b@example.org', 'a@exa mple.org', '"quoted"@example.org', 'a@example.org\r\nBcc: x@y.z']) {
      expect(errorsFor({ [FIELDS.email]: email }), email).toEqual([FIELDS.email]);
    }
    for (const email of ['first.last+tag@sub.example.co.uk', 'x@xn--bcher-kva.example']) {
      expect(errorsFor({ [FIELDS.email]: email }), email).toEqual([]);
    }
  });

  it('enforces the 120-character subject as a count of characters, not bytes', () => {
    expect(errorsFor({ [FIELDS.subject]: '🐺'.repeat(LIMITS.subjectMax) })).toEqual([]);
    expect(errorsFor({ [FIELDS.subject]: 'x'.repeat(LIMITS.subjectMax + 1) })).toEqual([FIELDS.subject]);
  });

  it('refuses header-injection material in single-line fields', () => {
    expect(errorsFor({ [FIELDS.subject]: 'Hi\r\nBcc: victim@example.org' })).toEqual([FIELDS.subject]);
    expect(errorsFor({ [FIELDS.name]: 'Ada\nBcc: x@y.z' })).toEqual([FIELDS.name]);
    expect(errorsFor({ [FIELDS.subject]: 'Tab\tinside' })).toEqual([FIELDS.subject]);
  });

  it('keeps newlines and tabs in the message but refuses other control characters', () => {
    expect(errorsFor({ [FIELDS.message]: 'a\n\tb' })).toEqual([]);
    expect(errorsFor({ [FIELDS.message]: 'a\u0000b' })).toEqual([FIELDS.message]);
    expect(errorsFor({ [FIELDS.message]: 'a\u2028b' })).toEqual([FIELDS.message]);
  });

  it('applies the technical message ceiling only', () => {
    expect(errorsFor({ [FIELDS.message]: 'x'.repeat(LIMITS.messageMax) })).toEqual([]);
    expect(errorsFor({ [FIELDS.message]: 'x'.repeat(LIMITS.messageMax + 1) })).toEqual([FIELDS.message]);
  });

  it('returns all errors at once so the summary can link each field', () => {
    expect(errorsFor({ [FIELDS.category]: '', [FIELDS.email]: 'bad', [FIELDS.message]: '' })).toEqual([FIELDS.category, FIELDS.email, FIELDS.message]);
  });
});
