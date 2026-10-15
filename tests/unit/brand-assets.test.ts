import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), 'brand', 'bundle', 'works', path), 'utf8');

// These are the actual files embedded in GitHub profiles and reused by other products.
describe('reusable theme-aware Works SVGs', () => {
  for (const path of [
    'assets/mark-primary/on-light-adaptive.svg',
    'assets/lockup-default/on-light-adaptive.svg',
    'assets/lockup-compact/on-light-adaptive.svg',
    'assets/sponsor-banner/on-light-adaptive.svg',
  ]) {
    it(`${path} includes both complete palette drawings`, () => {
      const svg = read(path);
      expect(svg).toContain('prefers-color-scheme: dark');
      expect(svg).toContain('class="for-light-theme"');
      expect(svg).toContain('class="for-dark-theme"');
      expect(svg).toContain('</svg>');
    });
  }
  it('keeps explicit contrast variants for GitHub picture fallbacks', () => {
    const light = read('assets/lockup-default/on-light.svg');
    const dark = read('assets/lockup-default/on-dark.svg');
    expect(light).toContain('#22171c');
    expect(dark).toContain('#f3e8dc');
    expect(light).not.toEqual(dark);
  });
});
