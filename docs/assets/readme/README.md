# README media

## Meaning

The source and reproduction record for the root README's committed entrance assets. They show the joined Home and
the maintained [Yoru 2.0 artwork](../../../design/yoru/README.md) on this source tree. The presence sheet and manifest
originate in Tala's `d3f1f2acc011d03ef8b967585aa742dd063b4780` contribution and are used without artwork changes.
Reusable Works identity exports remain in the
[brand catalogue](../../../assets/README.md). A local capture establishes presentation, not public availability.

## Committed media

| File | Source and treatment |
| --- | --- |
| `walk-hero.webp` | Local build of the accepted Home; 1440 × 900 viewport, reduced motion, fonts loaded, top 1440 × 640 captured and encoded at WebP quality 86. No page elements or copy are replaced. |
| `yoru-hello.gif` | `design/yoru/sheets/presence.webp` and `presence.json`: first idle frame; the six wave frames and their authored durations; idle again. One play, then still. |
| `yoru-still.png` | The same first idle frame, with its transparency and original 320 × 240 canvas preserved. The README selects it for reduced motion and links it directly. |

Yoru displays at the sheet's native half-scale, 160 × 120. The greeting lasts 2.8 seconds: 600 ms idle, the authored
1600 ms wave, then 600 ms idle. GIF's 10 ms resolution rounds the cumulative timeline, preserving the total duration.
No artwork is redrawn or mirrored. The historical May sheet is not a runtime or README input.

## Reproduce Yoru

From a checkout containing the pinned source, using the existing `sharp` dependency:

```sh
npm ci --no-audit --no-fund
node scripts/render-readme-yoru.mjs
```

The renderer writes only `yoru-hello.gif` and `yoru-still.png` beside this document. Repeated runs with the same
source and locked dependencies produce the same bytes.

## Refresh the site capture

Use the [local build route](../../DEVELOPMENT.md#run-and-test), with public fixture legal data. The Home capture needs
no operator record, contact submission or live service. Build first, then serve the built output on loopback:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

While that preview is running, in another terminal:

```sh
node scripts/render-readme-hero.mjs
```

Stop the preview afterward. The renderer closes its own isolated headless Chromium. Chromium must already be installed
through the [browser QA setup](../../DEVELOPMENT.md#prerequisites). Browser and font rasterization can vary between
versions; the renderer reports its browser version. Inspect the whole README in light and dark surroundings and at
phone width after replacing media. Check the title's appearance, image loading, greeting's finite playback and static
reduced-motion alternative. Update this source record when the accepted site or artwork changes.

## Rights

Works marks, Yoru and the artwork visible in these images remain reserved under the
[licence map](../../../LICENSES/README.md#reserved-the-marks-yoru-and-other-artwork). The surrounding documentation
and renderers keep their existing prose and code licences. Exporting an image for the README grants no new reuse rights.
