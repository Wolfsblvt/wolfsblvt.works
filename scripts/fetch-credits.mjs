// Refreshes the committed profile pictures of people credited in the Pile, from their own public pages. Run by hand
// (`npm run credits`) and commit the result; the build never fetches anything. Today: nek0tera's Twitch picture, read
// from the channel page's own og:image, for Tera's fragment.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CREDITS = [
  { page: 'https://www.twitch.tv/nek0tera', out: new URL('../src/features/pile/entries/mpreg/nek0tera.jpg', import.meta.url) },
];

const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; wolfsblvt.works credits refresh)' };
for (const credit of CREDITS) {
  const html = await (await fetch(credit.page, { headers })).text();
  const image = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
  if (!image) throw new Error(`${credit.page}: no og:image found; the page layout may have changed.`);
  const response = await fetch(image, { headers });
  if (!response.ok) throw new Error(`${image}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(fileURLToPath(credit.out), bytes);
  console.log(`${credit.page} → ${fileURLToPath(credit.out)} (${bytes.length} bytes from ${image})`);
}
