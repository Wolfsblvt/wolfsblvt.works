import { describe, expect, it } from 'vitest';
import { checkDeployment } from '../../scripts/check-deployment.mjs';

const SHA = '1234567890abcdef1234567890abcdef12345678';

function fixture(change = () => {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const marker = new URL(url).pathname === '/build-version.txt';
    const response = { body: marker ? SHA : '<html>Works</html>', status: 200,
      headers: { 'content-type': marker ? 'text/plain' : 'text/html', 'strict-transport-security': 'max-age=31536000' } };
    change(response, url);
    return new Response(response.body, response);
  };
  return { calls, fetchImpl };
}

describe('publication readback', () => {
  it('checks the current asset marker and useful page on both hosts, without credentials or redirects', async () => {
    const f = fixture();
    expect(await checkDeployment(SHA, f)).toEqual({ hosts: 2, requests: 4, sourceSha: SHA });
    expect(f.calls.map(c => new URL(c.url).hostname)).toEqual([
      'wolfsblvt.works', 'wolfsblvt.works', 'contact.wolfsblvt.works', 'contact.wolfsblvt.works',
    ]);
    for (const { options } of f.calls) {
      expect(options.redirect).toBe('manual');
      expect(options.cache).toBe('no-store');
      expect(options.headers).toBeUndefined();
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('refuses a stale asset tree on either host without printing the received body', async () => {
    const f = fixture((r, url) => { if (url.includes('contact.') && url.includes('build-version')) r.body = 'private failure specimen'; });
    await expect(checkDeployment(SHA, f)).rejects.toThrow('https://contact.wolfsblvt.works does not serve the expected asset build.');
    expect(f.calls).toHaveLength(3);
  });

  it.each([
    ['redirect', r => { r.status = 302; }],
    ['error page', r => { r.status = 503; }],
    ['non-HTML', r => { r.headers['content-type'] = 'application/json'; }],
    ['missing HSTS', r => { delete r.headers['strict-transport-security']; }],
  ])('refuses a %s at the useful page', async (_, change) => {
    const f = fixture((r, url) => { if (new URL(url).pathname === '/') change(r); });
    await expect(checkDeployment(SHA, f)).rejects.toThrow('missing its HTML success response or HSTS');
    expect(f.calls).toHaveLength(2);
  });

  it('stops on a transport failure without retrying or echoing the exception', async () => {
    let calls = 0;
    await expect(checkDeployment(SHA, { fetchImpl: async () => { calls++; throw new Error('secret-bearing transport failure'); } }))
      .rejects.toThrow('https://wolfsblvt.works did not answer. No retry or redeploy was attempted.');
    expect(calls).toBe(1);
  });

  it('rejects an unresolved source before any network request', async () => {
    const f = fixture();
    await expect(checkDeployment('main', f)).rejects.toThrow('resolved 40-character source SHA');
    expect(f.calls).toHaveLength(0);
  });
});
