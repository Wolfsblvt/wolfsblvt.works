/**
 * The composition seam between a contact page and the contact service. Whatever page composition is selected, it
 * renders one `form[data-contact-form]`. The Worker that hosts the page passes it through `prepareContactPage` on
 * every GET, so the form carries this environment's Turnstile site key and a freshly signed issue token. The page's
 * design stays entirely outside this module.
 */
import type { ContactEnv } from './env';
import { issueFormToken } from './token';

/** Turnstile's script and frame origin. The page that hosts the form must allow it in its Content-Security-Policy. */
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

export const CONTACT_FORM_SELECTOR = 'form[data-contact-form]';

export async function prepareContactPage(
  page: Response,
  env: Pick<ContactEnv, 'TURNSTILE_SITE_KEY' | 'CONTACT_FORM_SECRET'>,
): Promise<Response> {
  const formToken = await issueFormToken(env.CONTACT_FORM_SECRET);
  const prepared = new HTMLRewriter()
    .on(CONTACT_FORM_SELECTOR, {
      element(element) {
        element.setAttribute('data-turnstile-sitekey', env.TURNSTILE_SITE_KEY);
        element.setAttribute('data-form-token', formToken);
      },
    })
    .transform(page);

  // The token is time-bound and per-render, so a prepared page is never cacheable.
  const response = new Response(prepared.body, prepared);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
