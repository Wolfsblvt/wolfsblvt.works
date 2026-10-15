import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderWorksSponsor } from '../../src/lib/works-sponsor.mjs';

const template = readFileSync('brand/bundle/works/components/works-sponsor.html', 'utf8');

describe('shared sponsor host binding', () => {
  it('renders only enabled destinations and escapes context as text', () => {
    const html = renderWorksSponsor(template, { idPrefix: 'one', context: '<img src=x onerror=alert(1)>', kofi: 'https://ko-fi.com/wolf?a=1&b=2' });
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('https://ko-fi.com/wolf?a=1&amp;b=2');
    expect(html).not.toContain('>GitHub Sponsors</a>');
    expect(html).not.toContain('{{');
  });

  it('gives two instances disjoint SVG and accessible heading ids', () => {
    const ids = (html: string) => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const one = renderWorksSponsor(template, { idPrefix: 'one', heading: 3 });
    const two = renderWorksSponsor(template, { idPrefix: 'two' });
    const all = [...ids(one), ...ids(two)];
    expect(new Set(all).size).toBe(all.length);
    expect(one).toContain('<h3 id="one-title">');
    expect(one).toContain('aria-labelledby="one-title"');
  });

  it('rejects active URLs and invalid composition inputs', () => {
    expect(() => renderWorksSponsor(template, { idPrefix: 'safe', github: 'javascript:alert(1)' })).toThrow();
    expect(() => renderWorksSponsor(template, { idPrefix: '" onmouseover="bad' })).toThrow();
    expect(() => renderWorksSponsor(template, { idPrefix: 'safe', heading: 7 })).toThrow();
  });
});
