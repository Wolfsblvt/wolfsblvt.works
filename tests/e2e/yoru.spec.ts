import { expect, test } from '@playwright/test';

// Yoru remembering a visitor: nothing is stored until they say so, and "Forget me" deletes it. Reduced motion makes his
// trips instant, so the journeys don't wait on his running.
test.use({ reducedMotion: 'reduce' });

const stored = (page: import('@playwright/test').Page) => page.evaluate(() => localStorage.getItem('yoru.acquaintance'));

test('in his nook he asks to remember the visitor; a yes stores his record, and Forget me deletes it', async ({ page }) => {
  await page.goto('/');
  expect(await stored(page)).toBeNull();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const note = page.locator('.yoru-note');
  await expect(note).toContainText('want me to remember you?', { timeout: 15000 });
  await note.getByRole('button', { name: 'remember me' }).click();
  await expect(note).toContainText('I’ll remember.');
  expect(JSON.parse((await stored(page)) ?? '{}')).toMatchObject({ version: 1, familiarity: 0, discovered: [] });

  await page.goto('/privacy/');
  const memory = page.locator('[data-yoru-memory]');
  await expect(memory).toContainText('Yoru remembers you on this browser.');
  await memory.getByRole('button', { name: 'Forget me' }).click();
  await expect(memory).toContainText('Forgotten.');
  expect(await stored(page)).toBeNull();
  // Leaving the page, where he was asleep with the old record in mind, must not bring it back.
  await page.goto('/impressum/');
  expect(await stored(page)).toBeNull();
});

test('not today closes his note and stores nothing', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const note = page.locator('.yoru-note');
  await expect(note).toBeVisible({ timeout: 15000 });
  await note.getByRole('button', { name: 'not today' }).click();
  await expect(note).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});

test('a visitor he remembers, back on another day, is greeted and finds his keepsake', async ({ page }) => {
  await page.goto('/503.html');
  await page.evaluate(() => localStorage.setItem('yoru.acquaintance', JSON.stringify({
    version: 1, familiarity: 0.4, wariness: 0, favouritePlace: 'nook', discovered: ['coast'], lastSeen: '2020-01-01',
  })));
  await page.goto('/');
  await expect(page.locator('[data-yoru-cap] span')).toHaveText('oh. you again.');
  await expect(page.locator('.yoru-prop')).toHaveCount(2); // his cushion and the sea chart from Borrowed Coast
});
