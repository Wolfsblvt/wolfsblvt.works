import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { renderWorksSponsor } from '../../src/lib/works-sponsor.mjs';

const bundle = 'brand/bundle/works/';
const template = readFileSync(bundle + 'components/works-sponsor.html', 'utf8');
const stylesheet = readFileSync(bundle + 'css/works-sponsor.css', 'utf8');
const behavior = readFileSync(bundle + 'components/works-sponsor.mjs', 'utf8').replace('export function', 'function');
const panel = (id: string) => renderWorksSponsor(template, { idPrefix: id, github: 'https://github.com/sponsors/Wolfsblvt', context: 'A product with a longer name & a real reason to support it.' });

for (const width of [390, 1280]) {
  test(`shared sponsor: two instances, keyboard and reduced motion at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setContent(`<style>body{margin:40px;background:#fff}${stylesheet}
      .works-sponsor{--works-sponsor-spacing:40px 0}
      .works-sponsor + .works-sponsor{--works-sponsor-background:#f6efe6;--works-sponsor-border:1px solid #d1c0b8;--works-sponsor-text:#22171c;--works-sponsor-button-background:#22171c;--works-sponsor-button-text:#f6efe6}
    </style>${panel('first')}${panel('second')}`);
    await page.addScriptTag({ content: behavior + '\nmountWorksSponsors();' });
    await expect(page.getByRole('heading', { name: 'Support the work.' })).toHaveCount(2);
    await expect(page.locator('.works-sponsor.will-play')).toHaveCount(0);
    await expect(page.locator('.works-sponsor .dr').first()).toHaveCSS('stroke-dashoffset', '0px');
    const brokenRefs = await page.evaluate(() => [...document.querySelectorAll('use')].filter(el => !document.getElementById(el.getAttribute('href')!.slice(1))).length);
    expect(brokenRefs).toBe(0);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'GitHub Sponsors' }).first()).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/review/sponsor-${width}-reduced.png`, fullPage: true });
  });
}

test('shared sponsor plays once; website uses the same completed component', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.waitForTimeout(3700);
  await expect(page.locator('[data-mark]')).toBeVisible();
  await page.locator('[data-mark]').screenshot({ path: 'artifacts/review/header-full.png' });
  await page.locator('#help').scrollIntoViewIfNeeded();
  await expect(page.locator('#help .works-sponsor')).toHaveClass(/is-playing/);
  await page.waitForTimeout(3700);
  await expect(page.locator('#help .works-sponsor .dr').first()).toHaveCSS('stroke-dashoffset', '0px');
  await page.locator('#hi').scrollIntoViewIfNeeded();
  await page.locator('#help').scrollIntoViewIfNeeded();
  await expect(page.locator('#help .works-sponsor .dr').first()).toHaveCSS('stroke-dashoffset', '0px');
  await page.locator('#help').screenshot({ path: 'artifacts/review/works-help-finished.png' });
  await page.locator('[data-mark]').screenshot({ path: 'artifacts/review/header-compact.png' });
});

test('shared sponsor remains complete without scripts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.setContent(`<style>${stylesheet}</style>${panel('static')}`);
    await expect(page.getByRole('link', { name: 'GitHub Sponsors' })).toBeVisible();
    await expect(page.locator('.dr').first()).toHaveCSS('stroke-dashoffset', '0px');
    await expect(page.locator('.works-sponsor__works')).toBeVisible();
  } finally { await context.close(); }
});
