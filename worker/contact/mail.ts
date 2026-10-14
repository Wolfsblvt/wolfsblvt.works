/**
 * Plain-text mail construction. Visitor input never reaches `From`, the envelope or arbitrary headers; the
 * internal notification carries the visitor as `Reply-To` only. Nothing is rendered as HTML.
 */
import { CONTACT_INBOX, WORKS_NAME } from '../../shared/contact-contract';
import type { ValidSubmission } from './validate';

export interface MailContext {
  reference: string;
  receivedAt: Date;
  environment: string;
  buildVersion: string;
  siteUrl: string;
}

export interface OutgoingMail {
  from: { email: string; name: string };
  to: { email: string; name?: string };
  replyTo: { email: string; name?: string };
  subject: string;
  text: string;
}

/** Collapse anything that could break a header line. Fields were validated already; this is belt and braces. */
export function headerSafe(value: string): string {
  return value.replace(/[\r\n\t\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, ' ').trim();
}

/** Display names in address headers cannot carry quotes or angle brackets safely. */
function displayName(value: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = headerSafe(value).replace(/["<>]/g, '');
  return cleaned || undefined;
}

export function buildInternalNotification(submission: ValidSubmission, context: MailContext, inbox = CONTACT_INBOX): OutgoingMail {
  const sender = submission.name ? `${submission.name} <${submission.email}>` : submission.email;
  const text = [
    `New message via the ${WORKS_NAME} contact form`,
    '',
    `Reference: ${context.reference}`,
    `Received:  ${context.receivedAt.toISOString()}`,
    `Category:  ${submission.categoryLabel}`,
    `Product:   ${submission.productLabel ?? 'none given'}`,
    `From:      ${sender}`,
    `Subject:   ${submission.subject}`,
    '',
    '--- Message ---',
    submission.message,
    '--- End of message ---',
    '',
    'Reply to this email to answer the sender; Reply-To is set to their address.',
    `Sent by the contact form (${context.environment}, build ${context.buildVersion}).`,
    '',
  ].join('\n');

  return {
    from: { email: inbox, name: `${WORKS_NAME} contact form` },
    to: { email: inbox },
    replyTo: { email: submission.email, name: displayName(submission.name) },
    subject: headerSafe(`[Contact] ${submission.categoryLabel}: ${submission.subject}`),
    text,
  };
}

export function buildVisitorCopy(submission: ValidSubmission, context: MailContext, inbox = CONTACT_INBOX): OutgoingMail {
  const greeting = submission.name ? `Hello ${submission.name},` : 'Hello,';
  const text = [
    greeting,
    '',
    `The ${WORKS_NAME} contact form accepted your message. This copy confirms that the system received it; it does not mean that anyone has read it yet, and there is no promised response time.`,
    '',
    `Reference: ${context.reference}`,
    `Received:  ${context.receivedAt.toISOString()}`,
    `Category:  ${submission.categoryLabel}`,
    `Product:   ${submission.productLabel ?? 'none given'}`,
    `Subject:   ${submission.subject}`,
    '',
    '--- Your message ---',
    submission.message,
    '--- End of message ---',
    '',
    `If you did not send this, you can ignore it. The form keeps no separate message database; the provider and mailboxes process the emails for delivery.`,
    `${WORKS_NAME} · ${context.siteUrl}`,
    '',
  ].join('\n');

  return {
    from: { email: inbox, name: WORKS_NAME },
    to: { email: submission.email, name: displayName(submission.name) },
    replyTo: { email: inbox, name: WORKS_NAME },
    subject: headerSafe(`Your message to ${WORKS_NAME} · ${context.reference}`),
    text,
  };
}
