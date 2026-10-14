import { expect, test } from '@playwright/test';

test('no page scrolls sideways on a phone', async ({ page }) => {
  for (const path of ['/', '/privacy/', '/impressum/', '/contact/', '/nowhere/']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('the menu replaces the nav and opens its plain names', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nav-full')).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#menu-panel')).toBeVisible();
  await expect(page.locator('#menu-panel')).toContainText('The Pile');
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-panel')).toBeHidden();
});

test('the contact page puts the form before the notes', async ({ page }) => {
  await page.goto('/contact/');
  const form = await page.locator('.ct-card-wrap').boundingBox();
  const info = await page.locator('.ct-info').boundingBox();
  expect(form!.y).toBeLessThan(info!.y);
});

test('the pile packs every chosen piece inside the screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pile').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveClass(/pile-on/);
  const outside = await page.locator('.pi:not([hidden])').evaluateAll((els) =>
    els.filter((el) => { const r = el.getBoundingClientRect(); return r.left < -4 || r.right > innerWidth + 4; }).length,
  );
  expect(outside).toBe(0);
});
