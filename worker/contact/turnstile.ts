/**
 * Mandatory server-side Turnstile validation. A token is single-use and valid for five minutes; the
 * siteverify answer, not the widget, decides whether the submission may continue.
 */
import { TURNSTILE_ACTION } from '../../shared/contact-contract';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerdict {
  ok: boolean;
  /** Provider error codes or a local reason such as `hostname-mismatch`. */
  errorCodes: string[];
  hostname?: string;
  action?: string;
  /** The provider marked this as a testing-key result: action and hostname are not asserted. */
  testingKey: boolean;
}

export interface TurnstileOptions {
  secret: string;
  token: string | null;
  remoteIp: string | null;
  /** Hostnames the token must have been solved on; empty means the check is not enforced (test keys). */
  expectedHostnames: string[];
  fetchImpl?: typeof fetch;
  idempotencyKey?: string;
}

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
  metadata?: { result_with_testing_key?: boolean };
}

export async function verifyTurnstile(options: TurnstileOptions): Promise<TurnstileVerdict> {
  const { token, fetchImpl = fetch } = options;
  if (!token) return { ok: false, errorCodes: ['missing-input-response'], testingKey: false };
  if (token.length > 2048) return { ok: false, errorCodes: ['invalid-input-response'], testingKey: false };

  const body = new URLSearchParams({ secret: options.secret, response: token });
  if (options.remoteIp) body.set('remoteip', options.remoteIp);
  if (options.idempotencyKey) body.set('idempotency_key', options.idempotencyKey);

  let result: SiteverifyResponse;
  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, errorCodes: [`siteverify-http-${response.status}`], testingKey: false };
    result = (await response.json()) as SiteverifyResponse;
  } catch {
    return { ok: false, errorCodes: ['siteverify-unreachable'], testingKey: false };
  }

  const testingKey = result.metadata?.result_with_testing_key === true;
  const base = { hostname: result.hostname, action: result.action, testingKey };
  const errorCodes = result['error-codes'] ?? [];
  if (!result.success) return { ok: false, errorCodes: errorCodes.length ? errorCodes : ['siteverify-failed'], ...base };

  // Cloudflare's documented testing secret answers success with no action and the hostname `example.com`.
  // A real secret never sets this flag, so production always asserts action and hostname.
  if (!testingKey) {
    if (result.action !== TURNSTILE_ACTION) return { ok: false, errorCodes: ['action-mismatch'], ...base };
    if (options.expectedHostnames.length > 0 && (!result.hostname || !options.expectedHostnames.includes(result.hostname))) {
      return { ok: false, errorCodes: ['hostname-mismatch'], ...base };
    }
  }
  return { ok: true, errorCodes: [], ...base };
}
