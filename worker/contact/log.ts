/**
 * One structured log event per submission attempt. The schema is the ratified observability contract:
 * request facts, abuse-control outcomes, stage and delivery results — never the visitor's name, email,
 * subject, message or the Turnstile token.
 */

export type Stage =
  | 'disabled'
  | 'body-too-large'
  | 'bad-request'
  | 'origin'
  | 'content-type'
  | 'honeypot'
  | 'form-token'
  | 'rate-limited'
  | 'rate-unavailable'
  | 'validation'
  | 'turnstile'
  | 'internal-send-failed'
  | 'sent-copy-failed'
  | 'sent';

export interface ContactLogEvent {
  event: 'contact.submission';
  timestamp: string;
  reference: string | null;
  submissionId: string | null;
  attempt: number | null;
  /** `true` when the client reported a retry of an earlier attempt: a possible duplicate, not a proven one. */
  possibleDuplicate: boolean;
  build: string;
  environment: string;
  host: string;
  clientIp: string | null;
  colo: string | null;
  country: string | null;
  userAgentPresent: boolean;
  category: string | null;
  product: string | null;
  turnstile: { checked: boolean; ok: boolean | null; errorCodes: string[]; testingKey: boolean };
  honeypotTripped: boolean;
  formToken: string | null;
  rateLimited: 'ip' | 'recipient' | 'location' | null;
  rateUnavailable: 'ip' | 'recipient' | 'location' | null;
  stage: Stage;
  status: number;
  durationMs: number;
  internalMessageId: string | null;
  visitorCopy: 'accepted' | 'failed' | 'skipped';
  visitorCopyMessageId: string | null;
  visitorCopyErrorCode: string | null;
  internalErrorCode: string | null;
}

const FORBIDDEN_KEYS = new Set(['name', 'email', 'subject', 'message', 'token', 'cf-turnstile-response']);

/** Structural guard: the event object can never grow a visitor-content field by accident. */
export function assertRedacted(event: Record<string, unknown>): void {
  for (const key of Object.keys(event)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(`Refusing to log visitor content field "${key}".`);
  }
}

export type LogSink = (event: ContactLogEvent) => void;

export const consoleLogSink: LogSink = (event) => {
  assertRedacted(event as unknown as Record<string, unknown>);
  console.log(JSON.stringify(event));
};
