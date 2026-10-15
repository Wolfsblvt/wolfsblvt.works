import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), 'assets', 'brand', path), 'utf8');

// These are the actual files embedded in GitHub profiles and reused by other products.
describe('reusable theme-aware Works SVGs', () => {
  for (const path of [
    'svg/icon/works-icon.svg',
    'svg/lockup/works-lockup.svg',
    'svg/lockup/works-lockup-compact.svg',
    'svg/sponsor/works-sponsor-banner.svg',
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
    const light = read('svg/lockup/works-lockup-light.svg');
    const dark = read('svg/lockup/works-lockup-dark.svg');
    expect(light).toContain('#22171c');
    expect(dark).toContain('#f3e8dc');
    expect(light).not.toEqual(dark);
  });
});
