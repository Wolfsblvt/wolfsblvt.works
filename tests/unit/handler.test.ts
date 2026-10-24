import { describe, expect, it } from 'vitest';
import { FIELDS, LIMITS } from '../../shared/contact-contract';
import { handleContactSubmission, type SubmitResponseBody } from '../../worker/contact/handler';
import type { ContactLogEvent } from '../../worker/contact/log';
import type { OutgoingMail } from '../../worker/contact/mail';
import type { ContactServices, SendResult } from '../../worker/contact/services';
import { issueFormToken } from '../../worker/contact/token';

const SECRET = 'handler-test-secret';
const NOW = new Date('2026-09-22T03:00:00.000Z');

interface Harness {
  services: ContactServices;
  events: ContactLogEvent[];
  internal: OutgoingMail[];
  copies: OutgoingMail[];
}

function harness(overrides: Partial<ContactServices> = {}): Harness {
  const events: ContactLogEvent[] = [];
  const internal: OutgoingMail[] = [];
  const copies: OutgoingMail[] = [];
  const services: ContactServices = {
    sendingEnabled: true,
    inbox: 'contact@wolfsblvt.works',
    environment: 'test',
    buildVersion: 'test-build',
    formSecret: SECRET,
    siteUrl: 'https://wolfsblvt.com/',
    now: () => NOW,
    sendInternal: async (mail) => {
      internal.push(mail);
      return { ok: true, messageId: 'internal-1' };
    },
    sendVisitorCopy: async (mail) => {
      copies.push(mail);
      return { ok: true, messageId: 'copy-1' };
    },
    limitIp: async () => 'allowed',
    limitRecipient: async () => 'allowed',
    limitLocation: async () => 'allowed',
    turnstile: async () => ({ ok: true, errorCodes: [], hostname: 'contact.wolfsblvt.works', action: 'contact', testingKey: false }),
    log: (event) => events.push(event),
    ...overrides,
  };
  return { services, events, internal, copies };
}

async function request(fields: Record<string, string>, options: { token?: string | null; ip?: string } = {}): Promise<Request> {
  const form = new FormData();
  const token = options.token === undefined ? await issueFormToken(SECRET, NOW.getTime() - 10_000) : options.token;
  const base: Record<string, string> = {
    [FIELDS.category]: 'project',
    [FIELDS.email]: 'ada@example.org',
    [FIELDS.subject]: 'Hello',
    [FIELDS.message]: 'A message.',
    [FIELDS.turnstile]: 'token-123',
    [FIELDS.submission]: '11111111-1111-4111-8111-111111111111',
    [FIELDS.attempt]: '1',
  };
  for (const [key, value] of Object.entries({ ...base, ...fields })) form.set(key, value);
  if (token) form.set(FIELDS.formToken, token);
  const headers = new Headers();
  headers.set('Origin', 'https://contact.wolfsblvt.works');
  if (options.ip !== '') headers.set('CF-Connecting-IP', options.ip ?? '203.0.113.7');
  return new Request('https://contact.wolfsblvt.works/', { method: 'POST', body: form, headers });
}

async function submit(h: Harness, fields: Record<string, string> = {}, options?: { token?: string | null; ip?: string }) {
  const response = await handleContactSubmission(await request(fields, options), h.services);
  return { status: response.status, body: (await response.json()) as SubmitResponseBody, event: h.events.at(-1)! };
}

describe('happy path', () => {
  it('sends the internal notification then the visitor copy and reports both', async () => {
    const h = harness();
    const { status, body, event } = await submit(h, { [FIELDS.name]: 'Ada', [FIELDS.product]: 'agents' });

    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, outcome: 'sent', retryable: false, fallbackEmail: 'contact@wolfsblvt.works' });
    expect(body.reference).toMatch(/^WW-20260922-[A-Z2-9]{5}$/);
    expect(h.internal).toHaveLength(1);
    expect(h.copies).toHaveLength(1);
    expect(h.copies[0]!.to).toEqual({ email: 'ada@example.org', name: 'Ada' });
    expect(event).toMatchObject({
      stage: 'sent',
      status: 200,
      reference: body.reference,
      submissionId: '11111111-1111-4111-8111-111111111111',
      attempt: 1,
      possibleDuplicate: false,
      category: 'project',
      product: 'agents',
      clientIp: '203.0.113.7',
      turnstile: { checked: true, ok: true, errorCodes: [], testingKey: false },
      internalMessageId: 'internal-1',
      visitorCopy: 'accepted',
      visitorCopyMessageId: 'copy-1',
      formToken: 'ok',
    });
    expect(h.events).toHaveLength(1);
  });

  it('never logs visitor content', async () => {
    const h = harness();
    await submit(h, { [FIELDS.name]: 'Ada Secretname', [FIELDS.subject]: 'SecretSubject', [FIELDS.message]: 'SecretBody' });
    const serialized = JSON.stringify(h.events[0]);
    for (const secret of ['Ada Secretname', 'ada@example.org', 'SecretSubject', 'SecretBody', 'token-123']) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('marks a retry as a possible duplicate without claiming certainty', async () => {
    const h = harness();
    const { event } = await submit(h, { [FIELDS.attempt]: '2' });
    expect(event.possibleDuplicate).toBe(true);
    expect(event.attempt).toBe(2);
  });
});

describe('the three truthful outcomes', () => {
  it('reports "sent, copy failed" when only the visitor copy fails', async () => {
    const h = harness({ sendVisitorCopy: async (): Promise<SendResult> => ({ ok: false, code: 'E_RECIPIENT_SUPPRESSED' }) });
    const { status, body, event } = await submit(h);
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, outcome: 'sent-copy-failed', retryable: false });
    expect(body.message).toContain('could not be emailed');
    expect(event).toMatchObject({ stage: 'sent-copy-failed', internalMessageId: 'internal-1', visitorCopy: 'failed', visitorCopyErrorCode: 'E_RECIPIENT_SUPPRESSED' });
  });

  it('reports "failed" and skips the copy when the internal notification fails', async () => {
    const h = harness({ sendInternal: async (): Promise<SendResult> => ({ ok: false, code: 'E_DAILY_LIMIT' }) });
    const { status, body, event } = await submit(h);
    expect(status).toBe(503);
    expect(body).toMatchObject({ ok: false, outcome: 'failed', retryable: true });
    expect(body.message).toContain('nothing reached the inbox');
    expect(body.reference).toMatch(/^WW-/);
    expect(h.copies).toHaveLength(0);
    expect(event).toMatchObject({ stage: 'internal-send-failed', internalErrorCode: 'E_DAILY_LIMIT', visitorCopy: 'skipped' });
  });
});

describe('refusals before any send', () => {
  it('honors the total-send circuit breaker', async () => {
    const h = harness({ sendingEnabled: false });
    const { status, body, event } = await submit(h);
    expect(status).toBe(503);
    expect(body).toMatchObject({ ok: false, outcome: 'disabled', retryable: false });
    expect(event.stage).toBe('disabled');
    expect(h.internal).toHaveLength(0);
  });

  it('rejects the honeypot silently as a bot', async () => {
    const h = harness();
    const { status, body, event } = await submit(h, { [FIELDS.honeypot]: 'https://spam.example' });
    expect(status).toBe(400);
    expect(body.outcome).toBe('rejected');
    expect(event).toMatchObject({ stage: 'honeypot', honeypotTripped: true });
  });

  it('rejects a missing, forged or too-fast form token', async () => {
    const h = harness();
    expect((await submit(h, {}, { token: null })).event.formToken).toBe('missing');
    expect((await submit(h, {}, { token: '1700000000000.' + 'a'.repeat(64) })).event.formToken).toBe('bad-signature');
    const fresh = await issueFormToken(SECRET, NOW.getTime() - 1000);
    const fast = await submit(h, {}, { token: fresh });
    expect(fast.event.formToken).toBe('too-fast');
    expect(fast.body.retryable).toBe(true);
    expect(h.internal).toHaveLength(0);
  });

  it('applies IP, global and recipient limits and says which one', async () => {
    const ip = harness({ limitIp: async () => 'limited' });
    expect((await submit(ip)).event.rateLimited).toBe('ip');
    const location = harness({ limitLocation: async () => 'limited' });
    expect((await submit(location)).event.rateLimited).toBe('location');
    const recipient = harness({ limitRecipient: async () => 'limited' });
    const limited = await submit(recipient);
    expect(limited.status).toBe(429);
    expect(limited.event.rateLimited).toBe('recipient');
    expect(limited.body.retryable).toBe(true);
  });

  it('holds sending when the client IP or a limiter is unavailable', async () => {
    let calls = 0;
    const h = harness({ limitIp: async () => (calls++, 'allowed') });
    const missingIp = await submit(h, {}, { ip: '' });
    expect(missingIp.status).toBe(503);
    expect(missingIp.event.rateUnavailable).toBe('ip');
    expect(calls).toBe(0);
    const outage = await submit(harness({ limitLocation: async () => 'unavailable' }));
    expect(outage.status).toBe(503);
    expect(outage.event.rateUnavailable).toBe('location');
  });

  it('returns field errors with 422 before Turnstile is consulted', async () => {
    let turnstileCalls = 0;
    const h = harness({ turnstile: async () => (turnstileCalls++, { ok: true, errorCodes: [], testingKey: false }) });
    const { status, body, event } = await submit(h, { [FIELDS.email]: 'nope', [FIELDS.subject]: '' });
    expect(status).toBe(422);
    expect(body.errors?.map((error) => error.field)).toEqual([FIELDS.email, FIELDS.subject]);
    expect(event.stage).toBe('validation');
    expect(turnstileCalls).toBe(0);
  });

  it('refuses a failed Turnstile verdict with 403 and records the codes', async () => {
    const h = harness({ turnstile: async () => ({ ok: false, errorCodes: ['timeout-or-duplicate'], testingKey: false }) });
    const { status, body, event } = await submit(h);
    expect(status).toBe(403);
    expect(body).toMatchObject({ outcome: 'rejected', retryable: true });
    expect(event.turnstile).toEqual({ checked: true, ok: false, errorCodes: ['timeout-or-duplicate'], testingKey: false });
    expect(h.internal).toHaveLength(0);
  });

  it('refuses an oversized body', async () => {
    const h = harness();
    const { status, event } = await submit(h, { [FIELDS.message]: 'x'.repeat(LIMITS.requestBodyMax + 1) });
    expect(status).toBe(413);
    expect(event.stage).toBe('body-too-large');
  });

  it('bounds a streamed body without a Content-Length header', async () => {
    const h = harness();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(50_000));
        controller.enqueue(new Uint8Array(50_000));
        controller.close();
      },
    });
    const request = new Request('https://contact.wolfsblvt.works/', {
      method: 'POST',
      body: stream,
      // Node's Request requires duplex for a streaming upload; Workers accept the same stream.
      duplex: 'half',
      headers: { Origin: 'https://contact.wolfsblvt.works', 'Content-Type': 'multipart/form-data; boundary=bounded' },
    } as RequestInit);
    const response = await handleContactSubmission(request, h.services);
    expect(response.status).toBe(413);
    expect(h.events[0]!.stage).toBe('body-too-large');
    expect(h.internal).toHaveLength(0);
  });

  it('refuses another Origin before parsing or sending', async () => {
    const h = harness();
    const response = await handleContactSubmission(
      new Request('https://contact.wolfsblvt.works/', { method: 'POST', body: '{"json":true}', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' } }),
      h.services,
    );
    expect(response.status).toBe(403);
    expect(h.events[0]!.stage).toBe('origin');
  });

  it('refuses non-form content without reflecting it into logs', async () => {
    const h = harness();
    const response = await handleContactSubmission(
      new Request('https://contact.wolfsblvt.works/', { method: 'POST', body: '{"message":"private"}', headers: { Origin: 'https://contact.wolfsblvt.works', 'Content-Type': 'application/json' } }),
      h.services,
    );
    expect(response.status).toBe(415);
    expect(h.events[0]!.stage).toBe('content-type');
    expect(JSON.stringify(h.events)).not.toContain('private');
  });
});

/** Counts every limiter call so a test can prove which allowances an attempt spent. */
function countingLimits(results: Partial<Record<'ip' | 'location' | 'recipient', 'allowed' | 'limited' | 'unavailable'>> = {}) {
  const calls = { ip: 0, location: 0, recipient: 0 };
  return {
    calls,
    overrides: {
      limitIp: async () => (calls.ip++, results.ip ?? 'allowed'),
      limitLocation: async () => (calls.location++, results.location ?? 'allowed'),
      limitRecipient: async () => (calls.recipient++, results.recipient ?? 'allowed'),
    } satisfies Partial<ContactServices>,
  };
}

const failedTurnstile = async () => ({ ok: false, errorCodes: ['invalid-input-response'], testingKey: false });

describe('shared allowances are spent only by attempts that passed the bot check', () => {
  it('a failed Turnstile verdict spends neither the shared location nor the recipient allowance', async () => {
    const limits = countingLimits();
    const h = harness({ ...limits.overrides, turnstile: failedTurnstile });
    const { status, event } = await submit(h);
    expect(status).toBe(403);
    expect(event.stage).toBe('turnstile');
    expect(limits.calls).toEqual({ ip: 1, location: 0, recipient: 0 });
  });

  it('an absent Turnstile proof spends neither shared allowance', async () => {
    const limits = countingLimits();
    const h = harness({ ...limits.overrides, turnstile: async (token) => ({ ok: token !== null, errorCodes: token ? [] : ['missing-input-response'], testingKey: false }) });
    const form = await request({});
    const body = await form.formData();
    body.delete(FIELDS.turnstile);
    const response = await handleContactSubmission(new Request(form.url, { method: 'POST', body, headers: { Origin: 'https://contact.wolfsblvt.works', 'CF-Connecting-IP': '203.0.113.7' } }), h.services);
    expect(response.status).toBe(403);
    expect(limits.calls).toEqual({ ip: 1, location: 0, recipient: 0 });
  });

  it('invalid fields spend no shared allowance', async () => {
    const limits = countingLimits();
    const h = harness(limits.overrides);
    const { status } = await submit(h, { [FIELDS.email]: 'nope' });
    expect(status).toBe(422);
    expect(limits.calls).toEqual({ ip: 1, location: 0, recipient: 0 });
  });

  it('keeps the per-IP limit early: an over-limit client reaches neither validation nor Turnstile', async () => {
    let turnstileCalls = 0;
    const limits = countingLimits({ ip: 'limited' });
    const h = harness({ ...limits.overrides, turnstile: async () => (turnstileCalls++, { ok: true, errorCodes: [], testingKey: false }) });
    const { status, event } = await submit(h, { [FIELDS.email]: 'nope' });
    expect(status).toBe(429);
    expect(event).toMatchObject({ stage: 'rate-limited', rateLimited: 'ip', turnstile: { checked: false } });
    expect(turnstileCalls).toBe(0);
    expect(limits.calls).toEqual({ ip: 1, location: 0, recipient: 0 });
  });

  it('still limits actual sends after the bot check passes', async () => {
    const location = countingLimits({ location: 'limited' });
    const atLocation = harness(location.overrides);
    expect((await submit(atLocation)).event).toMatchObject({ stage: 'rate-limited', rateLimited: 'location', turnstile: { checked: true, ok: true } });
    expect(atLocation.internal).toHaveLength(0);

    const recipient = countingLimits({ recipient: 'limited' });
    const toRecipient = harness(recipient.overrides);
    expect((await submit(toRecipient)).event).toMatchObject({ stage: 'rate-limited', rateLimited: 'recipient', turnstile: { checked: true, ok: true } });
    expect(toRecipient.internal).toHaveLength(0);
    expect(toRecipient.copies).toHaveLength(0);
  });

  it('a successful send spends each allowance exactly once', async () => {
    const limits = countingLimits();
    const h = harness(limits.overrides);
    expect((await submit(h)).body.outcome).toBe('sent');
    expect(limits.calls).toEqual({ ip: 1, location: 1, recipient: 1 });
  });
});

describe('an expired form is renewable without losing the draft', () => {
  it('marks an expired token renewable, sends nothing and claims nothing about a reload', async () => {
    const h = harness();
    const old = await issueFormToken(SECRET, NOW.getTime() - LIMITS.maximumFormAgeMs - 1);
    const { status, body, event } = await submit(h, {}, { token: old });
    expect(status).toBe(400);
    expect(event.formToken).toBe('expired');
    expect(body).toMatchObject({ ok: false, outcome: 'rejected', renewForm: true, retryable: false });
    expect(body.message).toContain('nothing was sent');
    expect(body.message).not.toMatch(/reload/i);
    expect(h.internal).toHaveLength(0);
  });

  it('marks a token signed with an earlier secret renewable', async () => {
    const h = harness();
    const rotated = await issueFormToken('an-earlier-secret', NOW.getTime() - 10_000);
    const { body, event } = await submit(h, {}, { token: rotated });
    expect(event.formToken).toBe('bad-signature');
    expect(body.renewForm).toBe(true);
  });

  it('does not offer renewal for a missing or malformed token', async () => {
    const h = harness();
    expect((await submit(h, {}, { token: null })).body.renewForm).toBeUndefined();
    expect((await submit(h, {}, { token: 'not-a-token' })).body.renewForm).toBeUndefined();
  });
});

describe('production accepts submissions only over HTTPS', () => {
  async function productionSubmit(url: string, origin: string) {
    const h = harness({ environment: 'production' });
    const form = await (await request({})).formData();
    const response = await handleContactSubmission(new Request(url, { method: 'POST', body: form, headers: { Origin: origin, 'CF-Connecting-IP': '203.0.113.7' } }), h.services);
    return { h, status: response.status, body: (await response.json()) as SubmitResponseBody };
  }

  it('refuses a same-origin plaintext submission on the contact host before reading or sending it', async () => {
    const { h, status, body } = await productionSubmit('http://contact.wolfsblvt.works/', 'http://contact.wolfsblvt.works');
    expect(status).toBe(403);
    expect(body.message).toContain('https://contact.wolfsblvt.works/');
    expect(h.events[0]).toMatchObject({ stage: 'origin', formToken: null });
    expect(h.internal).toHaveLength(0);
  });

  it('sends over HTTPS on the contact host', async () => {
    const { h, body } = await productionSubmit('https://contact.wolfsblvt.works/', 'https://contact.wolfsblvt.works');
    expect(body.outcome).toBe('sent');
    expect(h.internal).toHaveLength(1);
  });
});
