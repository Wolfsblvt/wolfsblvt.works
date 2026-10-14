/**
 * The site Worker. Static assets serve everything they can on their own; this Worker runs first only for the routes
 * listed in wrangler.jsonc and adds what static files can't do:
 *
 *   contact.wolfsblvt.works  GET /   the contact page, prepared with its Turnstile key and a signed issue token
 *                            POST /  the contact submission pipeline
 *   wolfsblvt.works          GET /   the home page with today's per-browser pile seed
 *                            /contact/  a permanent redirect to the contact host
 *
 * Outside production (wrangler dev, previews) the contact page also answers at /contact/ on the same host, so the
 * whole journey can be exercised locally.
 */
import { CONTACT_HOST } from '../shared/contact-contract';
import type { ContactEnv } from './contact/env';
import { contentSecurityPolicy, scriptHashes } from '../shared/csp';
import { prepareContactPage } from './contact/form-page';
import { handleContactSubmission } from './contact/handler';
import { createContactServices } from './contact/services';
import { pileSeed } from './pile-seed';

export interface Env extends ContactEnv {
  ASSETS: Fetcher;
}

const SITE_URL = 'https://wolfsblvt.works/';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000',
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const production = env.ENVIRONMENT_NAME === 'production';
    const contactHost = url.hostname === CONTACT_HOST;
    const contactPath = url.pathname === '/contact' || url.pathname === '/contact/';

    if (contactHost && url.pathname === '/') return contact(request, env, url);
    if (contactHost && contactPath) return Response.redirect(`https://${CONTACT_HOST}/${url.search}`, 301);
    if (contactPath) {
      if (production) return Response.redirect(`https://${CONTACT_HOST}/${url.search}`, 301);
      return contact(request, env, url);
    }
    if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) return home(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function contact(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'POST') {
    const response = await handleContactSubmission(request, createContactServices(env, SITE_URL));
    return withHeaders(response, contentSecurityPolicy([], { turnstile: true }));
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD, POST' } });
  }
  const asset = await env.ASSETS.fetch(new Request(new URL('/contact/', url.origin), { headers: request.headers }));
  if (!asset.ok) return asset;
  const html = await asset.text();
  const prepared = await prepareContactPage(new Response(html, asset), env);
  const response = withHeaders(prepared, contentSecurityPolicy(await scriptHashes(html), { turnstile: true }));
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

async function home(request: Request, env: Env): Promise<Response> {
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok || !(asset.headers.get('Content-Type') ?? '').includes('text/html')) return asset;
  const html = await asset.text();
  const page = new Response(html, asset);
  const seed = pileSeed(request);
  const seeded = new HTMLRewriter()
    .on('[data-pile]', { element(element) { element.setAttribute('data-pile-seed', seed); } })
    .transform(page);
  const response = new Response(seeded.body, seeded);
  // The page now varies by browser family and language; keep it out of shared caches but bfcache-friendly.
  response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  response.headers.set('Vary', 'User-Agent, Accept-Language');
  return withHeaders(response, contentSecurityPolicy(await scriptHashes(html)));
}

function withHeaders(response: Response, csp: string): Response {
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
  out.headers.set('Content-Security-Policy', csp);
  return out;
}
