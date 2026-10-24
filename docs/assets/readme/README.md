# README media

## Meaning

The source and reproduction record for the root README's committed entrance assets. They show the accepted site and
its v1 Yoru resident, using the artwork on `main` at
[`aca9d0a7c7ea0e034217ca8d339fd8942f3d2849`](https://github.com/Wolfsblvt/wolfsblvt.works/tree/aca9d0a7c7ea0e034217ca8d339fd8942f3d2849).
The active resident redesign is not an input. Reusable Works identity exports remain in the
[brand catalogue](../../../assets/README.md). A local capture establishes presentation, not public availability.

## Committed media

| File | Source and treatment |
| --- | --- |
| `walk-hero.webp` | Local build of the accepted Home; 1440 × 900 viewport, reduced motion, fonts loaded, top 1440 × 640 captured and encoded at WebP quality 86. No page elements or copy are replaced. |
| `yoru-hello.gif` | `design/the-walk/assets/yoru-spritesheet.webp`: idle at row 0, column 0; four wave frames at row 3, columns 0–3; idle again. These are the positions used by `src/styles/base.css`. One play, then still. |
| `yoru-still.png` | The same first idle frame, with its transparency and original 192 × 208 canvas preserved. The README selects it for reduced motion and links it directly. |

Yoru displays at the site's native 96 × 104 size. The greeting lasts 1.9 seconds: 600 ms idle, the site's 700 ms wave,
then 600 ms idle. GIF's 10 ms resolution uses 170/180/170/180 ms for the four wave frames. No artwork is redrawn,
mirrored or taken from an unaccepted branch.

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
