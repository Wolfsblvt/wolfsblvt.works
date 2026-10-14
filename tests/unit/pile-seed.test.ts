import { describe, expect, it } from 'vitest';
import { browserFamily, pileSeed, primaryLanguage } from '../../worker/pile-seed';

const UA = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70',
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
};

describe('pile seed inputs', () => {
  it('reduces the user agent to a browser family and major version', () => {
    expect(browserFamily(UA.chrome)).toBe('Chrome/131');
    expect(browserFamily(UA.edge)).toBe('Edge/131');
    expect(browserFamily(UA.firefox)).toBe('Firefox/132');
    expect(browserFamily(UA.safari)).toBe('Safari/18');
    expect(browserFamily(null)).toBe('other');
    expect(browserFamily('curl/8.9.1')).toBe('other');
  });

  it('keeps only the first preferred language', () => {
    expect(primaryLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('de-de');
    expect(primaryLanguage('en')).toBe('en');
    expect(primaryLanguage(null)).toBe('und');
    expect(primaryLanguage('<script>')).toBe('und');
  });
});

describe('pile seed', () => {
  const request = (headers: Record<string, string>) => new Request('https://wolfsblvt.works/', { headers });
  const day = new Date('2026-10-14T10:00:00Z');

  it('is the same for the same browser family, language and Berlin day, whatever the OS or IP', () => {
    const a = pileSeed(request({ 'User-Agent': UA.chrome, 'Accept-Language': 'de-DE', 'CF-Connecting-IP': '203.0.113.1' }), day);
    const b = pileSeed(request({ 'User-Agent': UA.chrome.replace('Windows NT 10.0; Win64; x64', 'X11; Linux x86_64'), 'Accept-Language': 'de-DE', 'CF-Connecting-IP': '198.51.100.7' }), day);
    expect(b).toBe(a);
  });

  it('changes with the language, the browser and the day', () => {
    const base = pileSeed(request({ 'User-Agent': UA.chrome, 'Accept-Language': 'de-DE' }), day);
    expect(pileSeed(request({ 'User-Agent': UA.chrome, 'Accept-Language': 'en-GB' }), day)).not.toBe(base);
    expect(pileSeed(request({ 'User-Agent': UA.firefox, 'Accept-Language': 'de-DE' }), day)).not.toBe(base);
    expect(pileSeed(request({ 'User-Agent': UA.chrome, 'Accept-Language': 'de-DE' }), new Date('2026-10-15T10:00:00Z'))).not.toBe(base);
  });
});
