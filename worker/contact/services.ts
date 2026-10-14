/**
 * The handler's dependencies as one injectable object, built from the real bindings in production and
 * from fakes in tests. Keeps every provider seam (mail, rate limits, Turnstile, clock, logging) visible.
 */
import { CONTACT_HOST } from '../../shared/contact-contract';
import type { ContactEnv } from './env';
import { consoleLogSink, type LogSink } from './log';
import { verifyTurnstile, type TurnstileVerdict } from './turnstile';
import type { OutgoingMail } from './mail';

export type SendResult = { ok: true; messageId: string } | { ok: false; code: string };
export type LimitResult = 'allowed' | 'limited' | 'unavailable';

export interface ContactServices {
  sendingEnabled: boolean;
  inbox: string;
  environment: string;
  buildVersion: string;
  formSecret: string;
  siteUrl: string;
  now: () => Date;
  sendInternal: (mail: OutgoingMail) => Promise<SendResult>;
  sendVisitorCopy: (mail: OutgoingMail) => Promise<SendResult>;
  limitIp: (key: string) => Promise<LimitResult>;
  limitRecipient: (key: string) => Promise<LimitResult>;
  limitLocation: () => Promise<LimitResult>;
  turnstile: (token: string | null, remoteIp: string | null, idempotencyKey: string) => Promise<TurnstileVerdict>;
  log: LogSink;
}

/** The binding wants either a bare address or a name-bearing address object, never an optional name. */
function toAddress(address: { email: string; name?: string }): string | EmailAddress {
  return address.name ? { email: address.email, name: address.name } : address.email;
}

function sendWith(binding: SendEmail): (mail: OutgoingMail) => Promise<SendResult> {
  return async (mail) => {
    try {
      const result = await binding.send({
        from: toAddress(mail.from),
        to: toAddress(mail.to),
        replyTo: toAddress(mail.replyTo),
        subject: mail.subject,
        text: mail.text,
      });
      return { ok: true, messageId: result.messageId };
    } catch (error) {
      const code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : 'E_SEND_FAILED';
      return { ok: false, code };
    }
  };
}

function limitWith(binding: RateLimit): (key: string) => Promise<LimitResult> {
  return async (key) => {
    try {
      const outcome = await binding.limit({ key });
      return outcome.success ? 'allowed' : 'limited';
    } catch {
      return 'unavailable';
    }
  };
}

export function createContactServices(env: ContactEnv, siteUrl: string): ContactServices {
  const production = env.ENVIRONMENT_NAME === 'production';
  const test = env.ENVIRONMENT_NAME === 'test';
  const productionReady = production &&
    env.TURNSTILE_SITE_KEY !== 'REPLACE_WITH_PRODUCTION_TURNSTILE_SITE_KEY' &&
    !/^[123]x0{12}/.test(env.TURNSTILE_SITE_KEY) &&
    !/^[123]x0{12}/.test(env.TURNSTILE_SECRET_KEY ?? '') &&
    Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.CONTACT_FORM_SECRET) &&
    env.CONTACT_INBOX === 'contact@wolfsblvt.works';

  return {
    // Staging has a test widget and can never send through real Email Service bindings.
    sendingEnabled: env.CONTACT_SENDING_ENABLED === 'true' && (productionReady || test),
    inbox: env.CONTACT_INBOX,
    environment: env.ENVIRONMENT_NAME,
    buildVersion: env.BUILD_VERSION,
    formSecret: env.CONTACT_FORM_SECRET,
    siteUrl,
    now: () => new Date(),
    sendInternal: sendWith(env.CONTACT_INTERNAL),
    sendVisitorCopy: sendWith(env.CONTACT_VISITOR_COPY),
    limitIp: limitWith(env.RATE_IP),
    limitRecipient: limitWith(env.RATE_RECIPIENT),
    limitLocation: () => limitWith(env.RATE_LOCATION)('location'),
    turnstile: (token, remoteIp, idempotencyKey) =>
      verifyTurnstile({ secret: env.TURNSTILE_SECRET_KEY, token, remoteIp, expectedHostnames: production ? [CONTACT_HOST] : [], idempotencyKey }),
    log: consoleLogSink,
  };
}
