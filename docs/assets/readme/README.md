# README media

## Meaning

The source and reproduction record for the root README's proposed small entrance assets. A preview capture and greeting were produced in a prior local session, but their binary bytes did not arrive in the GitHub branch. **The three images listed here are NOT committed**. The README deliberately does not embed missing media; the release media remains a concrete integration item. Reusable Works identity exports remain in the [brand catalogue](../../../assets/README.md).

## Prepared sources (binary delivery outstanding)

| File | Source and treatment |
| --- | --- |
| `walk-hero.webp` | The Works home page at [`77a85fd3aba0c58f5bac4592ad70b910cac5e062`](https://github.com/Wolfsblvt/wolfsblvt.works/tree/77a85fd3aba0c58f5bac4592ad70b910cac5e062), captured locally with the new Yoru resident. A 1440 × 900 browser viewport, reduced motion, fonts loaded, cropped to the top 1440 × 640 and encoded as WebP at quality 86. No page elements or copy were replaced for the capture. |
| `yoru-hello.gif` | The same commit's [`presence.webp`](https://github.com/Wolfsblvt/wolfsblvt.works/blob/77a85fd3aba0c58f5bac4592ad70b910cac5e062/design/yoru/sheets/presence.webp) and [packed manifest](https://github.com/Wolfsblvt/wolfsblvt.works/blob/77a85fd3aba0c58f5bac4592ad70b910cac5e062/design/yoru/sheets/presence.json). One idle frame, the six `wave` frames, then the idle frame again; 600 ms holds surround the authored wave timing. One play, then still. |
| `yoru-still.png` | The first `idle` frame from that same presence sheet, with its transparency and original canvas preserved. The README selects it for `prefers-reduced-motion: reduce` and also links it directly. |

The locally observed Yoru projections were 320 × 240 pixels and displayed at 160 × 120. GIF timing is quantized to its 10 ms resolution;
the wave's 325/375 ms frames become 320/380 ms, preserving its overall duration. The complete greeting takes 2.8 seconds.
The earlier local outputs were reported at about 104 KiB for the GIF, 40 KiB for the still and 42 KiB for the capture. Those output bytes are not available in this Session; sizes are historical observations, not repository readback.

These inputs were selected on `feat/yoru-resident-life`. The release README is prepared to accompany that resident
implementation: its media source pin is explicit even before the branch is integrated. A local capture proves this
rendered candidate, not hosted availability. The README's public-site language belongs to the release deployment.

The selected Yoru artwork is carried from Tala's contribution on that branch (including the
[presence-sheet source commit](https://github.com/Wolfsblvt/wolfsblvt.works/commit/be738057dd9796422e972cfa23d9cf85abe1614e));
this README pass exports those frames without redrawing him.

## Reproduce the greeting

The renderer uses the existing `sharp` dependency and reads cell positions and timing from the packed manifest.
After the Yoru source is present in the checkout:

```sh
npm install
node scripts/render-readme-yoru.mjs
```

To reproduce the current files independently of branch integration, extract the two pinned inputs and pass their
directory explicitly:

```sh
git fetch origin 77a85fd3aba0c58f5bac4592ad70b910cac5e062
yoru_source=$(mktemp -d)
git show 77a85fd3aba0c58f5bac4592ad70b910cac5e062:design/yoru/sheets/presence.json > "$yoru_source/presence.json"
git show 77a85fd3aba0c58f5bac4592ad70b910cac5e062:design/yoru/sheets/presence.webp > "$yoru_source/presence.webp"
node scripts/render-readme-yoru.mjs "$yoru_source"
```

The renderer writes only `yoru-hello.gif` and `yoru-still.png` beside this document. It neither edits nor generates
character artwork. Keep the selected source's asymmetry; do not mirror the character.

## Refresh the site capture

Run the source checkout's static preview using [Development](../../DEVELOPMENT.md#run-and-test), install Chromium
with `npx playwright install chromium`, and run the following from that checkout. This capture contains the home
page's public artwork and copy only; it needs no operator record, contact submission or live service.

```js
import { chromium } from 'playwright';
import sharp from 'sharp';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const capture = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 640 } });
  await sharp(capture).webp({ quality: 86 }).toFile('docs/assets/readme/walk-hero.webp');
} finally {
  await browser.close();
}
```

The prior capture used Chromium 141.0.7390.37; browser/font rasterization can vary. Inspect the whole README in
light and dark surroundings and at phone width after replacing media. Check that the title lockup switches, the
greeting stops, and reduced motion selects the PNG. Update the input pin and this record when the source changes.

## Rights

Works marks, Yoru and the artwork visible in these images remain reserved under the
[licence map](../../../LICENSES/README.md#reserved-the-marks-yoru-and-other-artwork). The surrounding documentation
and renderer keep their existing prose and code licences. Exporting an image for the README grants no new reuse rights.
