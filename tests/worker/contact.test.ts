/**
 * Runs the contact seam inside workerd through the test-only fixture Worker: the page-preparation adapter against a
 * representative form page, and the submission pipeline through the real binding shapes. Siteverify is answered
 * locally and the email bindings are Miniflare simulations, so nothing leaves the machine.
 */
import { SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FIELDS } from '../../shared/contact-contract';
import { issueFormToken } from '../../worker/contact/token';

const FORM_SECRET = 'test-form-secret-not-a-real-value';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const ORIGIN = 'https://contact.example.test';

// Tests and the Worker share one isolate in the Workers pool, so the Worker's outbound `fetch` is this
// global. Siteverify is answered locally; any other outbound request is a test failure, never real traffic.
function answerSiteverify(body: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url === SITEVERIFY) return Response.json(body);
    throw new Error(`Unexpected outbound request in test: ${url}`);
  });
}

afterEach(() => vi.restoreAllMocks());

function post(body: FormData) {
  return SELF.fetch(`${ORIGIN}/`, {
    method: 'POST',
    body,
    redirect: 'manual',
    headers: { Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.9' },
  });
}

describe('contact page preparation', () => {
  it('injects environment-bound form values into the representative page', async () => {
    const response = await SELF.fetch(`${ORIGIN}/?product=agents`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const html = await response.text();
    expect(html).toContain('data-turnstile-sitekey="1x00000000000000000000AA"');
    expect(html).toMatch(/data-form-token="\d+\.[0-9a-f]{64}"/);
  });

  it('issues a fresh token on every render', async () => {
    const token = async () => /data-form-token="([^"]+)"/.exec(await (await SELF.fetch(`${ORIGIN}/`)).text())?.[1];
    const first = await token();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await token()).not.toBe(first);
  });
});

describe('contact submission', () => {
  async function submission(overrides: Record<string, string> = {}) {
    const form = new FormData();
    const fields: Record<string, string> = {
      [FIELDS.category]: 'project',
      [FIELDS.name]: 'Ada',
      [FIELDS.email]: 'ada@example.org',
      [FIELDS.subject]: 'Hello',
      [FIELDS.message]: 'Message body.',
      [FIELDS.turnstile]: 'turnstile-token',
      [FIELDS.formToken]: await issueFormToken(FORM_SECRET, Date.now() - 10_000),
      [FIELDS.submission]: 'sub-1',
      [FIELDS.attempt]: '1',
    };
    for (const [key, value] of Object.entries({ ...fields, ...overrides })) form.set(key, value);
    return form;
  }

  it('accepts a valid submission through the binding shapes and reports "sent"', async () => {
    const siteverify = answerSiteverify({ success: true, action: 'contact', hostname: 'contact.example.test', 'error-codes': [] });

    const response = await post(await submission());
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = (await response.json()) as { ok: boolean; outcome: string; reference: string };
    expect(body.ok).toBe(true);
    expect(body.outcome).toBe('sent');
    expect(body.reference).toMatch(/^WW-\d{8}-[A-Z2-9]{5}$/);
    expect(siteverify).toHaveBeenCalledTimes(1);
  });

  it('refuses a failed Turnstile verdict without sending', async () => {
    answerSiteverify({ success: false, 'error-codes': ['invalid-input-response'] });

    const response = await post(await submission());
    expect(response.status).toBe(403);
    expect(((await response.json()) as { outcome: string }).outcome).toBe('rejected');
  });

  it('returns linked field errors before consulting Turnstile', async () => {
    const siteverify = answerSiteverify({ success: true });
    const response = await post(await submission({ [FIELDS.email]: 'nope' }));
    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Array<{ field: string }> };
    expect(body.errors.map((error) => error.field)).toEqual([FIELDS.email]);
    expect(siteverify).not.toHaveBeenCalled();
  });
});
