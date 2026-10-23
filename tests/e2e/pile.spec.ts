import { expect, test, type Page } from '@playwright/test';
import { ENDLESS_ORDER } from '../../src/features/pile/order';

const endlessHeight = (page: Page) => page.locator('[data-endless-outer]').evaluate((el) => el.getBoundingClientRect().height);

async function toPile(page: Page) {
  await page.goto('/');
  await page.locator('#pile').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveClass(/pile-on/);
}

test('opening scatters the pile and grows Endless over time, then gathers back', async ({ page }) => {
  await toPile(page);
  const toggle = page.locator('[data-pile-toggle]');
  await expect(toggle).toHaveText('There’s more. A lot more.');
  expect(await endlessHeight(page)).toBe(0);
  // A real height reveal, not an instant jump: sample the height every frame while it opens.
  const sampling = page.evaluate(() => new Promise<number[]>((resolve) => {
    const outer = document.querySelector('[data-endless-outer]')!;
    const heights: number[] = [];
    const t0 = performance.now();
    const tick = () => { heights.push(outer.getBoundingClientRect().height); if (performance.now() - t0 < 2500) requestAnimationFrame(tick); else resolve(heights); };
    requestAnimationFrame(tick);
  }));
  await toggle.click();
  await expect(page).toHaveURL(/#endless$/);
  const heights = await sampling;
  const final = heights[heights.length - 1]!;
  expect(final).toBeGreaterThan(2000);
  expect(heights.filter((h) => h > 50 && h < final - 50).length).toBeGreaterThan(5);
  await expect(page.locator('[data-pile-stage]')).toHaveClass(/empty/);
  await expect(page.locator('.empty-note')).toBeVisible();
  await expect(toggle).toHaveText('Gather the pile');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await toggle.click();
  await expect(page).toHaveURL(/#pile$/);
  await expect.poll(() => endlessHeight(page), { timeout: 5000 }).toBe(0);
  await expect(page.locator('[data-pile-stage]')).not.toHaveClass(/scattered/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('a compact object opens Endless and travels to its entry, focusing it', async ({ page }) => {
  await toPile(page);
  const piece = page.locator('.pi:not([hidden]) a.cl').first();
  const id = await piece.getAttribute('data-pile-link');
  await piece.click();
  await expect(page).toHaveURL(new RegExp(`#pile-${id}$`));
  const heading = page.locator(`#pile-${id} h3`);
  await expect(heading).toBeFocused({ timeout: 8000 });
  const top = await page.locator(`#pile-${id}`).evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(40);
  expect(top).toBeLessThan(260);
});

test('a cold shared link opens Endless and arrives at an entry not necessarily in today’s pile', async ({ page }) => {
  await page.goto('/#pile-baumhaus');
  await expect(page).toHaveURL(/#pile-baumhaus$/);
  await expect(page.locator('#pile-baumhaus h3')).toBeFocused({ timeout: 10000 });
  const top = await page.locator('#pile-baumhaus').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeLessThan(260);
});

test('an unknown entry opens the collection with a small notice', async ({ page }) => {
  await page.goto('/#pile-not-a-real-piece');
  await expect(page.locator('[data-pile-unknown]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-pile-unknown]')).toContainText('This piece isn’t here.');
});

test('closing from deep inside Endless travels back to the threshold before retracting', async ({ page }) => {
  await toPile(page);
  await page.locator('[data-pile-toggle]').click();
  await expect.poll(() => endlessHeight(page), { timeout: 5000 }).toBeGreaterThan(2000);
  await page.locator('[data-pile-close]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-pile-back]')).not.toHaveClass(/hide/);
  await page.locator('[data-pile-close]').click();
  await expect.poll(() => endlessHeight(page), { timeout: 8000 }).toBe(0);
  const thresholdTop = await page.locator('#pile').evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(thresholdTop)).toBeLessThan(400);
  await expect(page.locator('[data-pile-toggle]')).toBeFocused();
});

test('Back and Forward restore the historical view without replaying the entrance', async ({ page }) => {
  await toPile(page);
  await page.locator('[data-pile-toggle]').click();
  await expect.poll(() => endlessHeight(page), { timeout: 5000 }).toBeGreaterThan(2000);
  await page.goBack();
  await expect.poll(() => endlessHeight(page)).toBe(0);
  await page.goForward();
  await expect.poll(() => endlessHeight(page)).toBeGreaterThan(2000);
});

test('the daily pile is the same on reload', async ({ page }) => {
  await toPile(page);
  const ids = () => page.locator('.pi:not([hidden])').evaluateAll((els) => els.map((el) => el.getAttribute('data-pid')));
  const first = await ids();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/pile-on/);
  expect(await ids()).toEqual(first);
  expect(first.length).toBeGreaterThanOrEqual(5);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every entry is readable and every address works natively', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-endless-outer]')).toBeVisible();
    await expect(page.locator('.e-item')).toHaveCount(ENDLESS_ORDER.length);
    await expect(page.locator('[data-pile-static-open]')).toHaveAttribute('href', '#endless');
    await page.goto('/#pile-receipt');
    await expect(page.locator('#pile-receipt')).toBeInViewport();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('opens and closes without the long animations, with the same content', async ({ page }) => {
    await toPile(page);
    await page.locator('[data-pile-toggle]').click();
    expect(await endlessHeight(page)).toBeGreaterThan(2000);
    await expect(page.locator('.empty-note')).toBeVisible();
    await page.locator('[data-pile-toggle]').click();
    expect(await endlessHeight(page)).toBe(0);
  });
});
