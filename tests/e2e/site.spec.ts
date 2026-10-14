import { expect, test } from '@playwright/test';

const PAGES = ['/', '/privacy/', '/impressum/', '/contact/', '/not-a-place/'];

test('every page is dark-only and keeps Dark Reader away', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    await expect(page.locator('meta[name="darkreader-lock"]')).toHaveCount(1);
  }
});

test('titles follow the identity standard', async ({ page }) => {
  const expected: Record<string, string> = {
    '/': 'Wolfsblvt Works',
    '/privacy/': 'Privacy and data · Wolfsblvt Works',
    '/impressum/': 'Impressum · Wolfsblvt Works',
    '/contact/': 'Contact · Wolfsblvt Works',
  };
  for (const [path, title] of Object.entries(expected)) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
  }
});

test('legal pages are public but noindex, nosnippet, with no social card', async ({ page }) => {
  for (const path of ['/privacy/', '/impressum/']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toBe('noindex, nosnippet');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nosnippet');
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  }
});

test('source shows the obvious operator fixture, marked as such', async ({ page }) => {
  await page.goto('/impressum/');
  await expect(page.locator('.fx-key')).toBeVisible();
  await expect(page.locator('address')).toContainText('Max Mustermann');
});

test('the home page has a social card, structured identity and the per-browser seed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://wolfsblvt.works/social/home.png');
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(jsonLd['@type']).toBe('WebSite');
  await expect(page.locator('[data-pile]')).toHaveAttribute('data-pile-seed', /^[0-9a-z]+$/);
});

test('a missing page is a 404 that shows the address you tried', async ({ page }) => {
  const response = await page.goto('/a-thing-that-moved/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Off the path.');
  await expect(page.locator('[data-missing-path]')).toHaveText('/a-thing-that-moved/');
});

test('the nav travels along the walk and marks where you are', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav-item="who"] a').click();
  await expect(page).toHaveURL(/#who$/);
  await expect(page.locator('[data-nav-item="who"] a')).toHaveClass(/on/, { timeout: 5000 });
});

test('hovering a nav word writes its plain name in Wolf’s hand', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav-item="why"] a').hover();
  await expect(page.locator('[data-nav-item="why"] [data-nav-scribble]')).toHaveText('About Works', { timeout: 3000 });
});

test('the skip link reaches the content by keyboard', async ({ page }) => {
  await page.goto('/privacy/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('copy handle confirms with a toast', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('[data-copy-handle]').click();
  await expect(page.locator('[data-toast]')).toHaveText('Copied @wolfsblvt');
});

test('the 503 is self-contained: inline styles, no scripts, no web fonts', async ({ request }) => {
  const html = await (await request.get('/503.html')).text();
  expect(html).not.toMatch(/<script/i);
  expect(html).not.toMatch(/<link[^>]+stylesheet/i);
  expect(html).not.toContain('/fonts/');
  expect(html).toContain('Something broke. On our side.');
});
