/**
 * The public contact contract shared by the browser integration and the Worker.
 *
 * One source keeps the Works contact page, server validation and mail formatting in agreement.
 * Values here are product meaning ratified in emergency-meeting#500 (smolpng and TunnelTend added by Wolf in #916,
 * 2026-10-24); change them there first.
 * Moved here from Wolfsblvt/wolfsblvt.com (accepted foundation 98a85f8) when the service joined the Works site.
 */

export const WORKS_HOST = 'wolfsblvt.works';
export const CONTACT_HOST = 'contact.wolfsblvt.works';
export const CONTACT_INBOX = 'contact@wolfsblvt.works';
export const WORKS_NAME = 'Wolfsblvt Works';

/** Stable submission categories. The value is what mail and logs carry; the label is what people read. */
export const CATEGORIES = [
  { value: 'project', label: 'A project' },
  { value: 'collaboration', label: 'Working together' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'legal', label: 'Legal information' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Something else' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];

/**
 * Registered product context. A product links to `https://contact.wolfsblvt.works/?product=<slug>` and the
 * form shows the recognized name. Unknown slugs are ignored, never reflected and never stored.
 *
 * A product registers here once it operates a public surface that links to this form. Every site with a contact
 * need receives that cross-link instead of its own form (Wolf, 2026-10-14). The order is the picker's hand order:
 * the Works website, then projects in walk order, then other sites. Presentation (type, icon, home) lives with the
 * page in src/features/contact/products.ts.
 */
export const PRODUCTS = [
  { slug: 'wolfsblvt-works', label: 'Wolfsblvt Works website' },
  { slug: 'diffdevil', label: 'diffdevil' },
  { slug: 'smolpng', label: 'smolpng' },
  { slug: 'tunneltend', label: 'TunnelTend' },
  { slug: 'wolfsblvt-com', label: 'wolfsblvt.com website' },
  { slug: 'agents', label: "Wolf's Agents" },
] as const;

export type ProductSlug = (typeof PRODUCTS)[number]['slug'];

/** Public field limits. Only the subject limit is a visible product rule; the rest are technical ceilings. */
export const LIMITS = {
  subjectMax: 120,
  nameMax: 200,
  emailMax: 254,
  /** Technical ceiling, not a product rule: the page shows a neutral count and no maximum. */
  messageMax: 50_000,
  /** Whole request body ceiling in bytes. Accepting arbitrary megabytes is not a form feature. */
  requestBodyMax: 96 * 1024,
  /** Minimum milliseconds between form issue and submission; below this the visitor is not a person. */
  minimumInteractionMs: 4_000,
  /** A form issued longer ago than this must be reloaded. */
  maximumFormAgeMs: 12 * 60 * 60 * 1000,
} as const;

/** Field names the browser integration and Worker parser agree on. */
export const FIELDS = {
  category: 'category',
  product: 'product',
  name: 'name',
  email: 'email',
  subject: 'subject',
  message: 'message',
  turnstile: 'cf-turnstile-response',
  /** Honeypot: hidden from people, filled by naive bots. */
  honeypot: 'website',
  /** Signed issue token proving the form was rendered by this deployment at a known time. */
  formToken: 'form-token',
  /** Client-generated submission id that survives retries so logs can relate them. */
  submission: 'submission',
  attempt: 'attempt',
} as const;

/** Truthful browser outcomes; each maps to exactly one provider result the Worker actually observed. */
export const OUTCOMES = {
  /** Internal notification accepted and the visitor copy accepted. */
  sent: 'sent',
  /** Internal notification accepted; the visitor copy could not be emailed. */
  sentCopyFailed: 'sent-copy-failed',
  /** Internal notification not accepted; nothing reached the inbox. */
  failed: 'failed',
} as const;

export type Outcome = (typeof OUTCOMES)[keyof typeof OUTCOMES];

export const TURNSTILE_ACTION = 'contact';

export function findCategory(value: unknown) {
  return CATEGORIES.find((category) => category.value === value) ?? null;
}

export function findProduct(slug: unknown) {
  return PRODUCTS.find((product) => product.slug === slug) ?? null;
}
