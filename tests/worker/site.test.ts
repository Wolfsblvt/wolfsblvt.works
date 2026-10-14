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
