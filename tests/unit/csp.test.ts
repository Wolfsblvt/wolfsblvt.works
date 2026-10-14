import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, inlineScripts, scriptHashes } from '../../shared/csp';

describe('inline scripts', () => {
  const html = `<script>a()</script><script type="module" src="/x.js"></script><script type="application/ld+json">{"a":1}</script><script type="application/json" id="m">[]</script><script type="module">b()</script>`;

  it('finds only executable inline scripts', () => {
    expect(inlineScripts(html)).toEqual(['a()', 'b()']);
  });

  it('hashes them as CSP sources', async () => {
    const expected = createHash('sha256').update('a()').digest('base64');
    expect((await scriptHashes(html))[0]).toBe(`'sha256-${expected}'`);
  });
});

describe('policy', () => {
  it('allows Turnstile only where asked', () => {
    expect(contentSecurityPolicy([])).not.toContain('challenges.cloudflare.com');
    const contact = contentSecurityPolicy(["'sha256-x'"], { turnstile: true });
    expect(contact).toContain("script-src 'self' 'sha256-x' https://challenges.cloudflare.com");
    expect(contact).toContain('frame-src https://challenges.cloudflare.com');
  });
});
