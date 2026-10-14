/**
 * Test-only Worker that connects the contact seam the way the later Works composition will: GET serves a
 * representative form page through `prepareContactPage`, POST runs the submission pipeline. It is never deployed,
 * declares no public route and stands in for no accepted page design.
 */
import { WORKS_HOST } from '../../shared/contact-contract';
import type { ContactEnv } from '../../worker/contact/env';
import { prepareContactPage } from '../../worker/contact/form-page';
import { handleContactSubmission } from '../../worker/contact/handler';
import { createContactServices } from '../../worker/contact/services';

interface FixtureEnv extends ContactEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/') return new Response('Not Found', { status: 404 });

    if (request.method === 'POST') {
      return handleContactSubmission(request, createContactServices(env, `https://${WORKS_HOST}/`));
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      const page = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin).toString(), { headers: request.headers }));
      if (!page.ok) return new Response('Not Found', { status: 404 });
      const prepared = await prepareContactPage(page, env);
      return request.method === 'HEAD' ? new Response(null, prepared) : prepared;
    }
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD, POST' } });
  },
} satisfies ExportedHandler<FixtureEnv>;
