import { describe, expect, it } from 'vitest';
import { checkDeployment } from '../../scripts/check-deployment.mjs';

const SHA = '1234567890abcdef1234567890abcdef12345678';
const OLD_SHA = 'a'.repeat(40);

function fixture(change = () => {}) {
  const calls = [];
  const waits = [];
  let elapsed = 0;
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const marker = new URL(url).pathname === '/build-version.txt';
    const response = { body: marker ? SHA : '<html>Works</html>', status: 200,
      headers: { 'content-type': marker ? 'text/plain' : 'text/html', 'strict-transport-security': 'max-age=31536000' } };
    change(response, url, calls.length);
    return new Response(response.body, response);
  };
  return { calls, waits, fetchImpl, now: () => elapsed,
    wait: async ms => { waits.push(ms); elapsed += ms; } };
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

  it('refuses a malformed marker without printing the received body or polling it', async () => {
    const f = fixture((r, url) => { if (url.includes('contact.') && url.includes('build-version')) r.body = 'private failure specimen'; });
    await expect(checkDeployment(SHA, f)).rejects.toThrow('marker is not a SHA');
    expect(f.calls).toHaveLength(3);
    expect(f.waits).toEqual([]);
  });

  it('waits through a 75-second stale build, then checks each HTML page only once', async () => {
    let markerReads = 0;
    const f = fixture((r, url) => {
      if (url.includes('build-version') && ++markerReads <= 15) r.body = OLD_SHA;
    });
    await expect(checkDeployment(SHA, f)).resolves.toMatchObject({ hosts: 2, sourceSha: SHA });
    expect(f.now()).toBe(75_000);
    expect(f.waits).toEqual(Array(15).fill(5_000));
    expect(f.calls.filter(c => new URL(c.url).pathname === '/')).toHaveLength(2);
  });

  it('refuses a stale build at the overall deadline with a value-free last observation', async () => {
    const f = fixture(r => { r.body = OLD_SHA; });
    await expect(checkDeployment(SHA, f)).rejects.toThrow('readiness deadline exceeded; last observation: https://wolfsblvt.works stale SHA');
    expect(f.now()).toBe(120_000);
    expect(f.calls.every(c => c.url.includes('build-version'))).toBe(true);
  });

  it('shares the same readiness budget across hosts rather than restarting it per host', async () => {
    let firstHostReads = 0;
    const f = fixture((r, url) => {
      if (!url.includes('build-version')) return;
      if (url.includes('contact.') || ++firstHostReads <= 18) r.body = OLD_SHA;
    });
    await expect(checkDeployment(SHA, f)).rejects.toThrow('last observation: https://contact.wolfsblvt.works stale SHA');
    expect(f.now()).toBe(120_000);
    expect(f.calls.filter(c => new URL(c.url).pathname === '/')).toHaveLength(1);
  });

  it('counts request time and the one-time HTML check in the same overall budget', async () => {
    const f = fixture();
    const fetchFirst = f.fetchImpl;
    f.fetchImpl = async (...args) => {
      await f.wait(f.calls.length === 0 ? 119_500 : 501);
      return fetchFirst(...args);
    };
    await expect(checkDeployment(SHA, f)).rejects.toThrow('readiness deadline exceeded');
    expect(f.calls).toHaveLength(2);
  });

  it.each([302, 403, 404, 503])('stops at marker status %s without retrying', async status => {
    const f = fixture(r => { r.status = status; r.body = 'private failure specimen'; });
    await expect(checkDeployment(SHA, f)).rejects.toThrow(`marker status ${status}`);
    expect(f.calls).toHaveLength(1);
    expect(f.waits).toEqual([]);
  });

  it('stops if a transport fails after a stale response instead of waiting again', async () => {
    const f = fixture(r => { r.body = OLD_SHA; });
    const fetchFirst = f.fetchImpl;
    let reads = 0;
    f.fetchImpl = async (...args) => {
      if (++reads > 1) throw new Error('private transport specimen');
      return fetchFirst(...args);
    };
    await expect(checkDeployment(SHA, f)).rejects.toThrow('transport failure; last observation: https://wolfsblvt.works stale SHA');
    expect(reads).toBe(2);
    expect(f.waits).toEqual([5_000]);
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
      .rejects.toThrow('https://wolfsblvt.works transport failure; last observation: no response');
    expect(calls).toBe(1);
  });

  it('rejects an unresolved source before any network request', async () => {
    const f = fixture();
    await expect(checkDeployment('main', f)).rejects.toThrow('resolved 40-character source SHA');
    expect(f.calls).toHaveLength(0);
  });
});
