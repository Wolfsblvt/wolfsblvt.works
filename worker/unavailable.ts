/**
 * The application's own 503. When the Worker fails unexpectedly, the visitor gets the site's "Something broke. On our
 * side." page instead of the provider's generic error, served from the static assets with status 503. This covers
 * failures the application can catch; provider-edge failures in front of the Worker are a separate matter.
 */
const PLAIN = 'Something broke. On our side. Please try again in a moment.';

export async function unavailable(request: Request, assets: Fetcher, error: unknown, headers: Record<string, string> = {}): Promise<Response> {
  // One structured line with the error's own name and message: never the request body, headers or visitor content.
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(JSON.stringify({ event: 'site.worker.error', message: message.slice(0, 200) }));
  const respond = (body: BodyInit, type: string) =>
    new Response(body, { status: 503, headers: { ...headers, 'Content-Type': type, 'Cache-Control': 'no-store', 'Retry-After': '120' } });
  try {
    const page = await assets.fetch(new Request(new URL('/503.html', request.url), { method: 'GET' }));
    if (page.ok) return respond(await page.text(), 'text/html; charset=utf-8');
  } catch {
    // The assets are unavailable too; the plain line below still answers.
  }
  return respond(PLAIN, 'text/plain; charset=utf-8');
}
