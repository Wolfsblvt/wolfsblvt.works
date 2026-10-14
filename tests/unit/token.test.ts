import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/contact-contract';
import { issueFormToken, verifyFormToken } from '../../worker/contact/token';

const secret = 'unit-test-secret';

describe('form token', () => {
  it('round-trips after the minimum interaction time', async () => {
    const issuedAt = 1_700_000_000_000;
    const token = await issueFormToken(secret, issuedAt);
    const verdict = await verifyFormToken(secret, token, issuedAt + LIMITS.minimumInteractionMs + 1);
    expect(verdict).toEqual({ ok: true, issuedAt, ageMs: LIMITS.minimumInteractionMs + 1 });
  });

  it('rejects a submission faster than a person could fill the form', async () => {
    const issuedAt = 1_700_000_000_000;
    const token = await issueFormToken(secret, issuedAt);
    expect(await verifyFormToken(secret, token, issuedAt + 500)).toEqual({ ok: false, reason: 'too-fast' });
  });

  it('rejects an expired form', async () => {
    const issuedAt = 1_700_000_000_000;
    const token = await issueFormToken(secret, issuedAt);
    expect(await verifyFormToken(secret, token, issuedAt + LIMITS.maximumFormAgeMs + 1)).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects missing, malformed and tampered tokens', async () => {
    const token = await issueFormToken(secret, 1_700_000_000_000);
    expect(await verifyFormToken(secret, null)).toEqual({ ok: false, reason: 'missing' });
    expect(await verifyFormToken(secret, 'nonsense')).toEqual({ ok: false, reason: 'malformed' });
    expect(await verifyFormToken(secret, token.replace(/^\d/, '9'), 1_800_000_000_000)).toEqual({ ok: false, reason: 'bad-signature' });
    expect(await verifyFormToken('other-secret', token, 1_700_000_010_000)).toEqual({ ok: false, reason: 'bad-signature' });
  });
});
