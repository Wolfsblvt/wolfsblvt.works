import { describe, expect, it } from 'vitest';
import { verifyTurnstile } from '../../worker/contact/turnstile';

function answering(body: unknown, status = 200) {
  const calls: Array<{ url: string; body: string }> = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), body: String(init?.body) });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const base = { secret: 's3cret', remoteIp: '203.0.113.5', expectedHostnames: ['contact.wolfsblvt.works'] };

describe('verifyTurnstile', () => {
  it('posts secret, token and remote IP and accepts a matching real result', async () => {
    const { fetchImpl, calls } = answering({ success: true, action: 'contact', hostname: 'contact.wolfsblvt.works', 'error-codes': [] });
    const verdict = await verifyTurnstile({ ...base, token: 'tok', fetchImpl, idempotencyKey: 'key-1' });
    expect(verdict).toEqual({ ok: true, errorCodes: [], hostname: 'contact.wolfsblvt.works', action: 'contact', testingKey: false });
    expect(calls[0]!.url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(calls[0]!.body).toContain('secret=s3cret');
    expect(calls[0]!.body).toContain('response=tok');
    expect(calls[0]!.body).toContain('remoteip=203.0.113.5');
    expect(calls[0]!.body).toContain('idempotency_key=key-1');
  });

  it('refuses a real result whose action or hostname does not match', async () => {
    const action = await verifyTurnstile({ ...base, token: 'tok', fetchImpl: answering({ success: true, action: 'login', hostname: 'contact.wolfsblvt.works' }).fetchImpl });
    expect(action.ok).toBe(false);
    expect(action.errorCodes).toEqual(['action-mismatch']);
    const host = await verifyTurnstile({ ...base, token: 'tok', fetchImpl: answering({ success: true, action: 'contact', hostname: 'evil.example' }).fetchImpl });
    expect(host.errorCodes).toEqual(['hostname-mismatch']);
  });

  it('does not enforce hostnames when none are configured', async () => {
    const verdict = await verifyTurnstile({ ...base, expectedHostnames: [], token: 'tok', fetchImpl: answering({ success: true, action: 'contact', hostname: 'preview.example' }).fetchImpl });
    expect(verdict.ok).toBe(true);
  });

  it('accepts the documented testing-key shape, which carries no action, and says so', async () => {
    const { fetchImpl } = answering({ success: true, hostname: 'example.com', 'error-codes': [], metadata: { result_with_testing_key: true } });
    const verdict = await verifyTurnstile({ ...base, token: 'XXXX.DUMMY.TOKEN.XXXX', fetchImpl });
    expect(verdict).toEqual({ ok: true, errorCodes: [], hostname: 'example.com', action: undefined, testingKey: true });
  });

  it('passes provider error codes through and names local failures', async () => {
    expect((await verifyTurnstile({ ...base, token: null, fetchImpl: answering({}).fetchImpl })).errorCodes).toEqual(['missing-input-response']);
    expect((await verifyTurnstile({ ...base, token: 'x'.repeat(2049), fetchImpl: answering({}).fetchImpl })).errorCodes).toEqual(['invalid-input-response']);
    expect((await verifyTurnstile({ ...base, token: 'tok', fetchImpl: answering({ success: false, 'error-codes': ['timeout-or-duplicate'] }).fetchImpl })).errorCodes).toEqual(['timeout-or-duplicate']);
    expect((await verifyTurnstile({ ...base, token: 'tok', fetchImpl: answering({}, 503).fetchImpl })).errorCodes).toEqual(['siteverify-http-503']);
    const failing = (async () => { throw new Error('down'); }) as unknown as typeof fetch;
    expect((await verifyTurnstile({ ...base, token: 'tok', fetchImpl: failing })).errorCodes).toEqual(['siteverify-unreachable']);
  });
});
