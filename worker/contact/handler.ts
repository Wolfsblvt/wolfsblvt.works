/**
 * The contact submission pipeline. Order is deliberate: cheap local refusals first, then the per-IP limit, then
 * validation, then the Turnstile check, then the shared location and per-recipient limits, then the two sends.
 * Only a request that passed Turnstile can spend the shared allowances, so failed or unauthenticated attempts
 * cannot use them up for everyone else; the per-IP limit stays early so one client cannot hammer the pipeline.
 * Every exit writes exactly one log event and returns exactly one truthful browser outcome.
 */
import { CONTACT_HOST, CONTACT_INBOX, FIELDS, LIMITS, OUTCOMES, type Outcome } from '../../shared/contact-contract';
import { buildInternalNotification, buildVisitorCopy } from './mail';
import { createReference } from './reference';
import type { ContactLogEvent, Stage } from './log';
import type { ContactServices } from './services';
import { verifyFormToken } from './token';
import { validateSubmission, type FieldError } from './validate';

export interface SubmitResponseBody {
  ok: boolean;
  outcome: Outcome | 'invalid' | 'rejected' | 'rate-limited' | 'disabled';
  reference?: string;
  message: string;
  errors?: FieldError[];
  retryable: boolean;
  /** The form token can't be used any more; nothing was sent, and a freshly served form can send the same text. */
  renewForm?: boolean;
  fallbackEmail: string;
}

/** Production accepts submissions only over HTTPS on the canonical contact host. */
const CONTACT_ORIGIN = `https://${CONTACT_HOST}`;

const RETRY_LATER = 'Please wait a moment and try again, or email directly.';

export async function handleContactSubmission(request: Request, services: ContactServices): Promise<Response> {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const clientIp = request.headers.get('CF-Connecting-IP');
  const cf = (request as Request & { cf?: { colo?: string; country?: string } }).cf;

  const event: ContactLogEvent = {
    event: 'contact.submission',
    timestamp: services.now().toISOString(),
    reference: null,
    submissionId: null,
    attempt: null,
    possibleDuplicate: false,
    build: services.buildVersion,
    environment: services.environment,
    host: url.hostname,
    clientIp,
    colo: cf?.colo ?? null,
    country: cf?.country ?? null,
    userAgentPresent: Boolean(request.headers.get('User-Agent')),
    category: null,
    product: null,
    turnstile: { checked: false, ok: null, errorCodes: [], testingKey: false },
    honeypotTripped: false,
    formToken: null,
    rateLimited: null,
    rateUnavailable: null,
    stage: 'bad-request',
    status: 400,
    durationMs: 0,
    internalMessageId: null,
    visitorCopy: 'skipped',
    visitorCopyMessageId: null,
    visitorCopyErrorCode: null,
    internalErrorCode: null,
  };

  const finish = (stage: Stage, status: number, body: SubmitResponseBody): Response => {
    event.stage = stage;
    event.status = status;
    event.durationMs = Date.now() - startedAt;
    services.log(event);
    return Response.json(body, {
      status,
      headers: { 'Cache-Control': 'no-store' },
    });
  };

  const refuse = (stage: Stage, status: number, outcome: SubmitResponseBody['outcome'], message: string, extra: Partial<SubmitResponseBody> = {}) =>
    finish(stage, status, { ok: false, outcome, message, retryable: false, fallbackEmail: services.inbox || CONTACT_INBOX, ...extra });

  const refuseForLimit = (kind: 'ip' | 'recipient' | 'location', result: 'limited' | 'unavailable') => {
    if (result === 'unavailable') {
      event.rateUnavailable = kind;
      return refuse('rate-unavailable', 503, 'disabled', `The contact form cannot safely send right now. Email ${services.inbox} directly instead.`);
    }
    event.rateLimited = kind;
    return refuse('rate-limited', 429, 'rate-limited', `The form is busy right now. ${RETRY_LATER}`, { retryable: true });
  };

  if (!services.sendingEnabled) {
    return refuse('disabled', 503, 'disabled', `The contact form is paused right now. Email ${services.inbox} directly instead.`);
  }

  if (services.environment === 'production' && url.origin !== CONTACT_ORIGIN) {
    return refuse('origin', 403, 'rejected', `Open the contact form at ${CONTACT_ORIGIN}/ and send it from there.`);
  }

  if (request.headers.get('Origin') !== url.origin) {
    return refuse('origin', 403, 'rejected', 'Reload the contact form at its own address and try again.');
  }
  if (!/^multipart\/form-data\s*;\s*boundary=[^;\s]+$/i.test(request.headers.get('Content-Type') ?? '')) {
    return refuse('content-type', 415, 'invalid', 'The submission format is not supported. Reload the page and try again.');
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (declaredLength > LIMITS.requestBodyMax) {
    return refuse('body-too-large', 413, 'invalid', 'The submission is larger than the form accepts. Send long material by email instead.');
  }

  let form: FormData;
  try {
    const raw = await readBoundedBody(request, LIMITS.requestBodyMax);
    if (raw === null) {
      return refuse('body-too-large', 413, 'invalid', 'The submission is larger than the form accepts. Send long material by email instead.');
    }
    form = await new Request(request.url, { method: 'POST', headers: request.headers, body: raw }).formData();
  } catch {
    return refuse('bad-request', 400, 'invalid', 'The submission could not be read. Reload the page and try again.');
  }

  const submissionId = stringField(form, FIELDS.submission, 64);
  event.submissionId = submissionId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId) ? submissionId : null;
  const attempt = Number(stringField(form, FIELDS.attempt, 4) ?? '');
  event.attempt = Number.isInteger(attempt) && attempt > 0 && attempt <= 999 ? attempt : null;
  event.possibleDuplicate = (event.attempt ?? 0) > 1;

  if (stringField(form, FIELDS.honeypot, 4096)) {
    event.honeypotTripped = true;
    return refuse('honeypot', 400, 'rejected', 'The submission was rejected.');
  }

  const token = await verifyFormToken(services.formSecret, stringField(form, FIELDS.formToken, 128), services.now().getTime());
  if (!token.ok) {
    event.formToken = token.reason;
    if (token.reason === 'too-fast') {
      return refuse('form-token', 400, 'rejected', 'That was quick. Take a moment, then send again.', { retryable: true });
    }
    // An expired form, or one signed before the form secret changed, is renewable: nothing was sent, and the page can
    // fetch a freshly issued token without losing what the visitor typed.
    if (token.reason === 'expired' || token.reason === 'bad-signature') {
      return refuse('form-token', 400, 'rejected', 'This form needs refreshing before it can send, so nothing was sent. Get a fresh form and send again.', { renewForm: true });
    }
    return refuse('form-token', 400, 'rejected', 'This form could not be verified, so nothing was sent. Reload the contact page and send again.');
  }
  event.formToken = 'ok';

  const ipLimit = clientIp ? await services.limitIp(clientIp) : 'unavailable';
  if (ipLimit !== 'allowed') return refuseForLimit('ip', ipLimit);

  const validation = validateSubmission(form);
  if (!validation.ok) {
    return refuse('validation', 422, 'invalid', 'Some fields need attention.', { errors: validation.errors });
  }
  const submission = validation.value;
  event.category = submission.category;
  event.product = submission.product;

  const turnstileToken = stringField(form, FIELDS.turnstile, 2048);
  const verdict = await services.turnstile(turnstileToken, clientIp, crypto.randomUUID());
  event.turnstile = { checked: true, ok: verdict.ok, errorCodes: verdict.errorCodes, testingKey: verdict.testingKey };
  if (!verdict.ok) {
    return refuse('turnstile', 403, 'rejected', 'The bot check did not pass. Try again; your text is kept in the form.', { retryable: true });
  }
  if (services.environment === 'production' && verdict.testingKey) {
    return refuse('turnstile', 503, 'disabled', 'The contact form is temporarily unavailable. Please email directly instead.');
  }

  const locationLimit = await services.limitLocation();
  if (locationLimit !== 'allowed') return refuseForLimit('location', locationLimit);
  const recipientKey = await sha256Hex(submission.email.toLowerCase());
  const recipientLimit = await services.limitRecipient(recipientKey);
  if (recipientLimit !== 'allowed') return refuseForLimit('recipient', recipientLimit);

  const reference = createReference(services.now());
  event.reference = reference;
  const context = {
    reference,
    receivedAt: services.now(),
    environment: services.environment,
    buildVersion: services.buildVersion,
    siteUrl: services.siteUrl,
  };

  const internal = await services.sendInternal(buildInternalNotification(submission, context, services.inbox));
  if (!internal.ok) {
    event.internalErrorCode = internal.code;
    return finish('internal-send-failed', 503, {
      ok: false,
      outcome: OUTCOMES.failed,
      reference,
      message: `The message was not sent; nothing reached the inbox. Your text is kept in the form. Retry, or email ${services.inbox} directly and mention ${reference}.`,
      retryable: true,
      fallbackEmail: services.inbox,
    });
  }
  event.internalMessageId = internal.messageId;

  const copy = await services.sendVisitorCopy(buildVisitorCopy(submission, context, services.inbox));
  if (!copy.ok) {
    event.visitorCopy = 'failed';
    event.visitorCopyErrorCode = copy.code;
    return finish('sent-copy-failed', 200, {
      ok: true,
      outcome: OUTCOMES.sentCopyFailed,
      reference,
      message: `Your message reached the inbox, but the copy to ${submission.email} could not be emailed. Keep the reference ${reference} for your records.`,
      retryable: false,
      fallbackEmail: services.inbox,
    });
  }
  event.visitorCopy = 'accepted';
  event.visitorCopyMessageId = copy.messageId;

  return finish('sent', 200, {
    ok: true,
    outcome: OUTCOMES.sent,
    reference,
    message: `Your message reached the inbox and a copy was emailed to ${submission.email}. Nobody has necessarily read it yet, and there is no promised response time.`,
    retryable: false,
    fallbackEmail: services.inbox,
  });
}

function stringField(form: FormData, name: string, maxLength: number): string | null {
  const value = form.get(name);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/** Stop reading before a client without Content-Length can allocate the whole request. */
async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!request.body) throw new Error('Missing request body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
