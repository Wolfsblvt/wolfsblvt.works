/**
 * The site Worker in workerd against a tiny representative build: the home page gets today's per-browser pile seed
 * and a CSP pinning its inline script; the contact page is prepared on both the contact host and (outside production)
 * /contact/; everything else is plain static assets.
 */
import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

const CHROME_DE = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8' };
const seedOf = (html: string) => /data-pile-seed="([0-9a-z]+)"/.exec(html)?.[1];

describe('home', () => {
  it('adds a per-browser seed and keeps the page out of shared caches', async () => {
    const response = await SELF.fetch('https://wolfsblvt.works/', { headers: CHROME_DE });
    expect(response.status).toBe(200);
    expect(seedOf(await response.text())).toBeTruthy();
    expect(response.headers.get('Vary')).toBe('User-Agent, Accept-Language');
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=0, must-revalidate');
  });

  it('deals the same seed to the same browser family and language, a different one for another language', async () => {
    const seed = async (headers: Record<string, string>) => seedOf(await (await SELF.fetch('https://wolfsblvt.works/', { headers })).text());
    const a = await seed(CHROME_DE);
    const sameFamily = await seed({ ...CHROME_DE, 'User-Agent': CHROME_DE['User-Agent'].replace('Windows NT 10.0; Win64; x64', 'X11; Linux x86_64') });
    const english = await seed({ ...CHROME_DE, 'Accept-Language': 'en-GB,en;q=0.9' });
    expect(sameFamily).toBe(a);
    expect(english).not.toBe(a);
  });

  it('pins the inline script by hash and allows no third-party script', async () => {
    const response = await SELF.fetch('https://wolfsblvt.works/');
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    expect(csp).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
    expect(csp).not.toContain('challenges.cloudflare.com');
  });
});

describe('contact', () => {
  it('prepares the contact page on the contact host, with Turnstile allowed', async () => {
    const response = await SELF.fetch('https://contact.wolfsblvt.works/?product=diffdevil');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Security-Policy')).toContain('https://challenges.cloudflare.com');
    const html = await response.text();
    expect(html).toContain('data-turnstile-sitekey="1x00000000000000000000AA"');
    expect(html).toMatch(/data-form-token="\d+\.[0-9a-f]{64}"/);
  });

  it('serves the same prepared page at /contact/ outside production', async () => {
    const html = await (await SELF.fetch('https://wolfsblvt.works/contact/')).text();
    expect(html).toMatch(/data-form-token="\d+\.[0-9a-f]{64}"/);
  });

  it('refuses methods other than GET, HEAD and POST', async () => {
    const response = await SELF.fetch('https://contact.wolfsblvt.works/', { method: 'PUT' });
    expect(response.status).toBe(405);
  });

  it('answers a submission with a truthful JSON outcome', async () => {
    const response = await SELF.fetch('https://contact.wolfsblvt.works/', { method: 'POST', body: new FormData(), headers: { Origin: 'https://contact.wolfsblvt.works' } });
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(((await response.json()) as { outcome: string }).outcome).toBe('rejected');
  });
});

describe('plain HTTP on the public hosts', () => {
  it('redirects the contact page and a submission to HTTPS before the Worker serves or handles them', async () => {
    for (const method of ['GET', 'POST']) {
      const response = await SELF.fetch('http://contact.wolfsblvt.works/?product=diffdevil', { method, redirect: 'manual', ...(method === 'POST' ? { body: new FormData(), headers: { Origin: 'http://contact.wolfsblvt.works' } } : {}) });
      expect(response.status).toBe(308);
      expect(response.headers.get('Location')).toBe('https://contact.wolfsblvt.works/?product=diffdevil');
      expect(await response.text()).not.toContain('data-form-token');
    }
  });

  it('redirects the home page and the old contact path to HTTPS, keeping the path', async () => {
    const home = await SELF.fetch('http://wolfsblvt.works/', { redirect: 'manual' });
    expect(home.status).toBe(308);
    expect(home.headers.get('Location')).toBe('https://wolfsblvt.works/');
    const contact = await SELF.fetch('http://wolfsblvt.works/contact/', { redirect: 'manual' });
    expect(contact.headers.get('Location')).toBe('https://wolfsblvt.works/contact/');
  });

  it('leaves plain HTTP alone on other hosts, so local development keeps working', async () => {
    const response = await SELF.fetch('http://localhost/contact/', { redirect: 'manual' });
    expect(response.status).toBe(200);
    expect(await response.text()).toMatch(/data-form-token="\d+\.[0-9a-f]{64}"/);
  });
});

describe('static pages', () => {
  it('serves other routes straight from the assets', async () => {
    const response = await SELF.fetch('https://wolfsblvt.works/privacy/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Privacy');
  });

  it('serves the 404 page for missing routes', async () => {
    const response = await SELF.fetch('https://wolfsblvt.works/not-a-place/');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('Off the path.');
  });
});

describe('when the Worker itself fails', () => {
  it('answers with the site’s own 503 page from the assets', async () => {
    const { unavailable } = await import('../../worker/unavailable');
    const assets = { fetch: async () => new Response('<!doctype html><title>Something broke</title>', { headers: { 'Content-Type': 'text/html' } }) } as unknown as Fetcher;
    const response = await unavailable(new Request('https://wolfsblvt.works/'), assets, new Error('boom'), { 'X-Content-Type-Options': 'nosniff' });
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('120');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await response.text()).toContain('Something broke');
  });

  it('still answers plainly when the assets are gone too', async () => {
    const { unavailable } = await import('../../worker/unavailable');
    const assets = { fetch: async () => { throw new Error('no assets'); } } as unknown as Fetcher;
    const response = await unavailable(new Request('https://wolfsblvt.works/'), assets, new Error('boom'));
    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
  });
});
