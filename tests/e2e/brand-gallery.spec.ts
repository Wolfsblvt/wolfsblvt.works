import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve('brand/bundle/works');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));

for (const colorScheme of ['light', 'dark'] as const) {
  test(`canonical identity: fixed/adaptive and opaque tiles in ${colorScheme} scheme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const cards = manifest.assets.flatMap((asset: any) => asset.variants.map((variant: any) => {
      const images = variant.representations.filter((rep: any) => rep.format === 'svg' && rep.motion === 'static');
      return `<article><h2>${asset.role} / ${variant.appearance}</h2>${['#ffffff', '#f6efe6', '#100b11', '#0c1217'].map(background => `<div style="background:${background};padding:12px">${images.map((rep: any) => `<img src="${pathToFileURL(resolve(root, rep.file.path))}" alt="${rep.file.path}" style="max-width:100%;width:${asset.role.includes('lockup') ? 300 : asset.role === 'sponsor.banner' ? 600 : 64}px">`).join('')}</div>`).join('')}</article>`;
    }));
    await page.goto(pathToFileURL(resolve('assets/works-gallery.html')).href);
    await page.setContent(`<style>body{font:14px system-ui;margin:24px;background:#ddd}article{margin-bottom:24px}article>div{display:flex;gap:24px;align-items:center}h2{font-size:16px}</style>${cards.join('')}`);
    await page.locator('img').evaluateAll(async images => { await Promise.all(images.map(img => (img as HTMLImageElement).decode())); });
    expect(await page.locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `artifacts/review/identity-${colorScheme}.png`, fullPage: true });
  });
}
