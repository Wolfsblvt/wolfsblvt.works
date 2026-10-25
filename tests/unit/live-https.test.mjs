import { describe, expect, it } from 'vitest';
import { checkLiveHttps, HOSTS, STATIC_ROUTES } from '../../scripts/check-live-https.mjs';

/**
 * A healthy public edge: the zone upgrades every plain HTTP request to the same HTTPS address, and HTTPS answers with
 * HSTS. `change(response, url, method)` turns it into the failure under test.
 */
function edge(change = () => {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const parsed = new URL(url);
    const response = parsed.protocol === 'http:'
      ? { status: 301, headers: { Location: `https://${parsed.host}${parsed.pathname}${parsed.search}` } }
      : { status: 200, headers: { 'Strict-Transport-Security': 'max-age=31536000' } };
    change(response, parsed, options.method ?? 'GET');
    return new Response(response.status === 200 ? 'body' : null, response);
  };
  return { calls, fetchImpl };
}

const isStatic = (url) => STATIC_ROUTES.includes(url.pathname);

describe('live HTTPS readback', () => {
  it('passes a healthy edge and probes Worker and static routes on both hosts without credentials or redirects', async () => {
    const e = edge();
    const { failures, results } = await checkLiveHttps(e);
    expect(failures).toEqual([]);
    expect(results.every((r) => r.ok)).toBe(true);
    for (const host of HOSTS) {
      const probed = e.calls.map((c) => `${c.options.method} ${c.url}`).filter((c) => c.includes(`//${host}/`));
      expect(probed).toEqual(expect.arrayContaining([
        `GET http://${host}/`,
        `POST http://${host}/`,
        `GET http://${host}/?https-readback=1`,
        `GET http://${host}/privacy/?https-readback=1`,
        `POST http://${host}/privacy/?https-readback=1`,
        `GET http://${host}/robots.txt?https-readback=1`,
        `GET https://${host}/privacy/`,
        `GET https://${host}/robots.txt`,
      ]));
    }
    for (const { options } of e.calls) {
      expect(options.redirect).toBe('manual');
      expect(options.credentials).toBe('omit');
      expect(options.headers).toBeUndefined();
      if (options.method === 'POST') expect(options.body).toBe('');
    }
  });

  it('fails when the roots upgrade but a static page answers plain HTTP (the zone rule is gone, the Worker is not)', async () => {
    // Exactly what the Worker's own redirect cannot hide: its routes still upgrade, static files bypass it.
    const e = edge((r, url) => { if (url.protocol === 'http:' && isStatic(url)) { r.status = 200; r.headers = {}; } });
    const { failures } = await checkLiveHttps(e);
    expect(failures).toContain('GET http://wolfsblvt.works/privacy/?https-readback=1 answered 200; expected a redirect to https://wolfsblvt.works/privacy/?https-readback=1.');
    expect(failures).toContain('POST http://contact.wolfsblvt.works/privacy/?https-readback=1 answered 200; expected a redirect to https://contact.wolfsblvt.works/privacy/?https-readback=1.');
    expect(failures.some((f) => f.includes('/robots.txt?https-readback=1 answered 200'))).toBe(true);
    expect(failures.some((f) => f.startsWith('GET http://wolfsblvt.works/ ') || f.startsWith('POST http://wolfsblvt.works/ '))).toBe(false);
  });

  it('refuses a missing static route, which would only reach the Worker', async () => {
    const e = edge((r, url) => { if (url.protocol === 'https:' && url.pathname === '/robots.txt') r.status = 404; });
    const { failures } = await checkLiveHttps(e);
    expect(failures).toContain('GET https://wolfsblvt.works/robots.txt answered 404 with HSTS "max-age=31536000"; expected 200 with a positive max-age (a static route that is missing cannot show the zone redirect).');
  });

  it.each([
    ['a 304 pointing at HTTPS', (r) => { r.status = 304; }],
    ['a 300 pointing at HTTPS', (r) => { r.status = 300; }],
    ['an upgrade that drops path and query', (r, url) => { r.headers.Location = `https://${url.host}/`; }],
    ['an upgrade that drops the query', (r, url) => { r.headers.Location = `https://${url.host}${url.pathname}`; }],
    ['a redirect to another host', (r, url) => { r.headers.Location = `https://elsewhere.example${url.pathname}${url.search}`; }],
    ['a redirect that stays on HTTP', (r, url) => { r.headers.Location = `http://${url.host}${url.pathname}${url.search}`; }],
  ])('refuses %s on a static route', async (_, change) => {
    const e = edge((r, url) => { if (url.protocol === 'http:' && url.pathname === '/privacy/') change(r, url); });
    const { failures } = await checkLiveHttps(e);
    expect(failures.filter((f) => f.includes('/privacy/?https-readback=1 answered'))).toHaveLength(4);
  });

  it('accepts every real upgrade status', async () => {
    for (const status of [301, 302, 303, 307, 308]) {
      const e = edge((r) => { if (r.status !== 200) r.status = status; });
      expect((await checkLiveHttps(e)).failures).toEqual([]);
    }
  });

  it('resolves a relative Location against the plain request, so it is no upgrade', async () => {
    const e = edge((r, url) => { if (url.protocol === 'http:' && url.pathname === '/robots.txt') r.headers.Location = `${url.pathname}${url.search}`; });
    expect((await checkLiveHttps(e)).failures).toEqual([
      'GET http://wolfsblvt.works/robots.txt?https-readback=1 answered 301 → /robots.txt?https-readback=1; expected a redirect to https://wolfsblvt.works/robots.txt?https-readback=1.',
      'GET http://contact.wolfsblvt.works/robots.txt?https-readback=1 answered 301 → /robots.txt?https-readback=1; expected a redirect to https://contact.wolfsblvt.works/robots.txt?https-readback=1.',
    ]);
  });

  it('refuses HTTPS without HSTS on a static route', async () => {
    const e = edge((r, url) => { if (url.protocol === 'https:' && url.pathname === '/privacy/') r.headers = {}; });
    expect((await checkLiveHttps(e)).failures).toHaveLength(2);
  });

  it('stops at the first transport failure without the exception text and sends nothing more', async () => {
    const e = edge();
    const failing = async (url, options) => {
      if (url === 'http://contact.wolfsblvt.works/') throw new Error('secret-bearing transport failure');
      return e.fetchImpl(url, options);
    };
    const { failures, results } = await checkLiveHttps({ fetchImpl: failing });
    expect(failures).toEqual(['GET http://contact.wolfsblvt.works/ did not answer. Stopped without retrying or sending the remaining probes.']);
    expect(JSON.stringify([failures, results])).not.toContain('secret-bearing');
    // wolfsblvt.works completed (3 HTTPS + 6 plain), then contact's 3 HTTPS probes and the failing one; nothing after.
    expect(e.calls).toHaveLength(9 + 3);
    expect(results.filter((r) => r.ok)).toHaveLength(9 + 3);
    expect(results.at(-1)).toEqual({ check: 'GET http://contact.wolfsblvt.works/', ok: false });
  });

  it('keeps the observations it made before a failure', async () => {
    const e = edge();
    const failing = async (url, options) => {
      if (url.startsWith('http://wolfsblvt.works/privacy/')) throw new Error('boom');
      return e.fetchImpl(url, options);
    };
    const { results } = await checkLiveHttps({ fetchImpl: failing });
    expect(results.filter((r) => r.ok).length).toBeGreaterThan(3);
    expect(results.at(-1).ok).toBe(false);
  });

  it('gives a hanging target one capped request, then stops instead of waiting out 18 timeouts', async () => {
    const started = performance.now();
    let requests = 0;
    const hanging = (url, options) => new Promise((_, reject) => {
      requests++;
      options.signal.addEventListener('abort', () => reject(options.signal.reason));
    });
    const { failures } = await checkLiveHttps({ fetchImpl: hanging, requestMs: 40, budgetMs: 1_000 });
    expect(requests).toBe(1);
    expect(failures).toEqual(['GET https://wolfsblvt.works/ did not answer. Stopped without retrying or sending the remaining probes.']);
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('spends one finite budget across slow-but-answering requests and then stops', async () => {
    const e = edge();
    const slow = async (url, options) => {
      await new Promise((r) => setTimeout(r, 30));
      return e.fetchImpl(url, options);
    };
    const started = performance.now();
    const { failures } = await checkLiveHttps({ fetchImpl: slow, budgetMs: 100, requestMs: 1_000 });
    expect(e.calls.length).toBeGreaterThan(1);
    expect(e.calls.length).toBeLessThan(18);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/^The 0\.1-second readback budget ran out after \d+ requests, before (GET|POST) \S+\. Stopped without retrying/);
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  it('cuts a hanging request at the remaining budget when that is shorter than the request cap', async () => {
    const hanging = (url, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason));
    });
    const started = performance.now();
    const { failures } = await checkLiveHttps({ fetchImpl: hanging, budgetMs: 60, requestMs: 5_000 });
    expect(failures).toHaveLength(1);
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});
