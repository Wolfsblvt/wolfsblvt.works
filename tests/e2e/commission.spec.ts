import { test, expect } from '@playwright/test';

for (const width of [1440, 390, 320]) {
  test(`paid-work invitation and preselected form at ${width}px`, async ({ page }, info) => {
    await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.turnstile={render:()=>"fixture",reset(){}};window.onTurnstileLoaded?.();' }));
    // Follow the real public link while keeping the page on this test's local Worker and fixture secrets.
    await page.route('https://contact.wolfsblvt.works/**', async route => {
      expect(route.request().method()).toBe('GET');
      const url = new URL(route.request().url());
      const path = url.pathname === '/' ? '/contact/' : url.pathname;
      const response = await route.fetch({ url: `http://127.0.0.1:8788${path}${url.search}` });
      await route.fulfill({ response });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const commission = page.locator('#work-with-me');
    await commission.scrollIntoViewIfNeeded();
    await expect(commission.getByRole('heading')).toBeVisible();
    await expect(commission).toContainText('around the clock');
    await expect(commission.getByRole('link', { name: 'See what you can commission' })).toHaveAttribute('href', 'https://wolfsblvt.com/consulting/');
    await page.screenshot({ path: info.outputPath(`commission-${width}.png`) });
    await commission.getByRole('link', { name: 'Ask about paid work' }).click();
    await expect(page.locator('#category')).toHaveValue('consulting');
    await expect(page.locator('[data-consulting-hint]')).toBeVisible();
    await expect(page.locator('[data-consulting-hint]')).toContainText('German');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`consulting-form-${width}.png`), fullPage: true });
  });
}
