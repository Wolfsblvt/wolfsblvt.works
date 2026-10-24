/** Capture the built local Walk for the README; run `npm run preview` first. */
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const capture = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 640 } });
  await sharp(capture).webp({ quality: 86 })
    .toFile(fileURLToPath(new URL('../docs/assets/readme/walk-hero.webp', import.meta.url)));
  console.log(`Captured the local Walk with ${browser.version()}; 1440×640 WebP, quality 86.`);
} finally {
  await browser.close();
}
