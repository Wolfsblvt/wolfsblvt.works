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
  // A real height reveal, not an instant jump: sample the height every frame while it opens. The window starts when
  // the height first moves, so a slow click under suite load cannot end it before the reveal begins.
  const sampling = page.evaluate(() => new Promise<number[]>((resolve) => {
    const outer = document.querySelector('[data-endless-outer]')!;
    const heights: number[] = [];
    const t0 = performance.now();
    let moved: number | null = null;
    const tick = () => {
      const h = outer.getBoundingClientRect().height;
      heights.push(h);
      if (moved === null && h > 0) moved = performance.now();
      const now = performance.now();
      if (moved === null ? now - t0 < 15000 : now - moved < 2500) requestAnimationFrame(tick);
      else resolve(heights);
    };
    requestAnimationFrame(tick);
  }));
  await toggle.click();
  await expect(page).toHaveURL(/#whoa$/);
  const heights = await sampling;
  const final = heights[heights.length - 1]!;
  expect(final).toBeGreaterThan(2000);
  // Several in-between frames prove a reveal rather than a jump; under suite load the page may paint only a few.
  expect(heights.filter((h) => h > 50 && h < final - 50).length).toBeGreaterThan(2);
  await expect(page.locator('[data-pile-stage]')).toHaveClass(/empty/);
  await expect(page.locator('.empty-note')).toBeVisible();
  await expect(toggle).toHaveText('Gather the pile');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await toggle.click();
  await expect(page).toHaveURL(/#whoa$/);
  // Closing travels back to the threshold first (up to 2.2s), then retracts (1.1s); under suite load the frames that
  // carry it can arrive late, so the wait is generous without weakening what it proves.
  await expect.poll(() => endlessHeight(page), { timeout: 15000 }).toBe(0);
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
  // The bootstrap holds the address for two seconds. If the script arrives later than that (it can under suite load),
  // the escape has already put the entry in front of the reader natively and the script stands back; both arrivals
  // are designed, so the test accepts either and checks the one it got.
  type Booted = Window & { __pileReady?: boolean; __pileBoot?: { failed?: boolean } };
  await page.waitForFunction(() => (window as Booted).__pileReady || (window as Booted).__pileBoot?.failed, undefined, { timeout: 15000 });
  const escaped = await page.evaluate(() => !!(window as Booted).__pileBoot?.failed);
  if (!escaped) await expect(page.locator('#pile-baumhaus h3')).toBeFocused({ timeout: 10000 });
  await expect.poll(() => page.locator('#pile-baumhaus').evaluate((el) => el.getBoundingClientRect().top), { timeout: 10000 }).toBeLessThan(260);
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

test.describe('addresses', () => {
  test('a project window’s address arrives with the eased journey, under the header', async ({ page }) => {
    await page.goto('/#karaokebarr');
    await expect.poll(() => page.locator('#karaokebarr').evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 10000 }).toBeLessThan(200);
    expect(await page.locator('#karaokebarr').evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(40);
    // The address comes back once the journey has arrived.
    await expect(page).toHaveURL(/#karaokebarr$/);
  });

  test('a loosely written entry address opens the entry and settles on the canonical one', async ({ page }) => {
    await page.goto('/#noreplyyet');
    // The canonical address is written as soon as the Pile's script boots; under suite load that boot can be late.
    await expect(page).toHaveURL(/#pile-no-reply-yet$/, { timeout: 15000 });
    await expect(page.locator('#pile-no-reply-yet h3')).toBeFocused({ timeout: 10000 });
  });

  test('the # in a window’s corner puts its address in the bar', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-anchor-link="smolpng"]').click();
    await expect(page).toHaveURL(/#smolpng$/);
    await expect.poll(() => page.locator('#smolpng').evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 8000 }).toBeLessThan(200);
  });
});
