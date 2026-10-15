# Wolfsblvt Works marks and sponsor assets

## Meaning

This is the historical co-design record of the approved Wolfsblvt Works identity, originally contributed in co-design round 02: the identity marks (icon, lockup and wordmark, favicon, icon-slot glyph, maker credit) and the shared sponsor section, with their motion. Tala designed it with Wolf in three canvas rounds on 2026-10-14. It records what Wolf selected, in his words, and how the marks are built and used. It also lists every file and what still has to join with the visual-grammar and website work.

The selected marks and sponsor panel now form part of the website. This record preserves the co-design rationale and editable sources; it is **not** the download or runtime dependency for finished artwork, a deployed website claim or trademark clearance. Get usable exports from the [asset catalogue](../../assets/README.md). Wolf's choices below are his; unquoted construction and recommendations were written by Tala.

- Open [the approved asset gallery](../../assets/works-gallery.html) to see every exported file on the background it was made for.
- Open [`canvas/round-3/canvas.html`](canvas/round-3/canvas.html) for the final design record, with motion replay and timing sliders. Rounds [1](canvas/round-1/canvas.html) and [2](canvas/round-2/canvas.html) keep the explored and rejected directions.
- Open [`sponsor-section/specimen.html`](sponsor-section/specimen.html) for the reusable web section on three hosts and on phone width.

The historical canvases and the specimen load fonts from Google Fonts and need to be served over HTTP. Any static server works, for example `python -m http.server` from this folder. Opened as plain files they still render, but some browsers block the scripts.

## Current source relationship

Maintained masters are in `brand/source/works/`; consumer exports exist only in `brand/bundle/works/`.
[The current catalogue](../../assets/README.md) and [shared sponsor contract](../../docs/works-sponsor.md) supersede
the original handoff paths, glyph proposal and integration notes below. Relative artwork links below are provenance,
not consumer coordinates. The old renderer is an optional design tool; the deterministic bundle exporter reads the
approved source bytes without requiring its historical Chrome/ffmpeg/font toolchain.

## The idea: two corners hold the work

Every mark is the same two strokes: an **orange corner at the top left** and a **magenta corner at the bottom right**. They never mirror; the magenta one always reaches further. What sits between them depends on the job:

| Piece | What the corners hold |
| --- | --- |
| Icon | a dot, set slightly off-centre on purpose |
| Lockup (= wordmark) | the name: **WOLFSBLVT** set formal, **WORKS** written by hand over its end |
| Sponsor section | the invitation; the corners are drawn on the section's own border |

The corners scale as one piece with their stroke weight, so they get heavier as the mark gets bigger. They are never redrawn thinner.

The type pairing carries a relationship Wolf named himself:

> The actual compromise between WOLFSBLVT being the formal font and WORKS being the handwritten personal piece is amazingly great. The actual relationship is me being Wolfsblvt, personal, and Works the more serious project we do, but that's the actual great thing here.

## What Wolf selected

These are quoted from the round-2, round-3 and final review messages. Everything else in this document is Tala's construction or recommendation.

- **Icon E, the two corners.** *"E is my favorite, by far. It actually has individuality. It is simple."* Off-centre dot: *"Make it the middle between the two. slightly off-center, so you might not even notice it, but it's on purpose."* Final: *"The icon off-centre is perfect."*
- **Font.** *"I want Abril Fatface for the WOLFSBLVT font. Not just because of the name, lol. It looks good."*
- **WORKS.** Written by hand, as capitals with a bigger W, underlined: *"try WORKS even in scribble"*. Final: *"The Works in your writing is fine."*
- **Lockup H2, written over.** *"I am a big fan of H2, this is much more personality."* Lockup and wordmark are one mark: *"Lockup as Wordmark works. We use the same."*
- **Two drawings.** *"H2 full is much better. For everything besides the 32px version."* A separate compact drawing is used at 32px. Website plan: *"we'll likely use the 44px version at the top, and ease in to the 32px one for the header during scrolling."*
- **Sponsor.** Big Type in the *"Lit edges"* treatment (*"really unique distinctive"*), with the corners at the 128px icon scale *"literally drawn over the corner of the border of the panel/section"*. WORKS goes over the corner piece on small screens. Final: *"The sponsor panel is literally perfect."*
- **Motion.** Corners always draw first. Then WOLFSBLVT lights up from dark while WORKS is written; both start after the corners. The defaults were kept, with one change: *"the magenta corner needs to start slightly later."*
- **Rejected along the way, and why** (details in the canvases):
  - Chip-cut: *"too generic"*.
  - Double-V: *"just a letter"*.
  - Maker's punch: *"looks like.. a folder"*.
  - Lit-edge sponsor art: brings the Walk onto other products' pages.
  - Fireworks: *"not like sponsor, and not like works"*.
  - Outline glow: *"generic neon letters"*.

## Icon

- **Grid:** 32 units, stroke 3, round caps.
- **Orange corner:** `M4.6 20.5V13A8 8 0 0 1 12.6 5H17.5`. Its lines sit at x 4.6 and y 5, with a bend radius of 8.
- **Magenta corner:** `M27.4 8.5V15A12.4 12.4 0 0 1 15 27.4H9.5`. Its lines sit at x 27.4 and y 27.4, with a bend radius of 12.4.
- **Dot:** centre (17.15, 17.35), radius 3.1. That is about 1.2 units right and down of true centre. It isn't meant to be noticed; it settles into the magenta's curve.
- **Colours:**

  | Background | Orange | Magenta | Dot |
  | --- | --- | --- | --- |
  | Dark | `#eca557` | `#db61aa` | `#f3e8dc` |
  | Light | `#b8661f` | `#a8327a` | `#22171c` |

  The mono version uses `currentColor`.
- **Favicon:** [`../../brand/bundle/works/svg/icon/favicon.svg`](../../brand/bundle/works/svg/icon/favicon.svg) switches between the dark and light colours with `prefers-color-scheme`. PNG sizes run from 16 to 1024. The set also includes an opaque `apple-touch-icon-180.png` and a `works-icon-maskable-512.png` with safe-zone padding.
- **Icon-slot glyph:** [`../../brand/bundle/works/svg/glyph/works-glyph-24.svg`](../../brand/bundle/works/svg/glyph/works-glyph-24.svg) is drawn on the 24×24 grid with 2px round strokes in `currentColor`. It uses the same arcs and the same offset dot (12.8, 13), like diffdevil's trimmed glyph. It is a candidate for `@wolfsblvt/icons`; admission still runs through that package's own standard and checks.
- **Credit:** use the 16–18px icon next to `by WOLFSBLVT` in the host's type, or the text credits from the Works identity authority (`A Wolfsblvt Works product`, …). The canvases show both on a diffdevil footer and on a light footer.

## Lockup (also the wordmark)

One mark, in two drawings that share the same name and orange corner:

| Drawing | Use when the lockup is drawn | What differs |
| --- | --- | --- |
| **full** (`works-lockup-*`) | 40px tall and up: the site header at the top (44px), about pages, press, anywhere large | WORKS over the end of the name, lower; the frame holds both |
| **compact** (`works-lockup-compact-*`) | below 40px: the 32px scrolled header, small credits | WORKS about a third bigger and lower, written across the name **and** the magenta corner; heavier pen |

Construction, at a name size of 100 (cap height 70, baseline 0):

- **Name:** WOLFSBLVT in Abril Fatface, letter-spacing 0.01em, font kerning on, outlined to paths. Width 606.4.
- **Corners:** the corner scale follows the height being held. The corner lines sit 22.4 icon units apart, as in the icon, and the clearance is measured from the stroke's inner edge. So the frame never crowds the name, whatever the size.
- **Layer order:** orange corner, then the name (cut away under the WORKS strokes as a real transparent knockout, not a painted halo), then the magenta corner, then the WORKS ink. The magenta corner is never knocked out, so WORKS reads as written *over* it. This works on any background and on transparent PNGs.
- **Exact numbers:** both drawings' view boxes, corner scales, corner positions and WORKS transforms are in [`source/geometry.json`](source/geometry.json).

**The 44 → 32px header ease.** Both drawings share the name, the orange corner and the WORKS strokes. Only the WORKS transform and the magenta corner's scale and position differ, and those are listed in `geometry.json`. The website can interpolate those two transforms while scrolling instead of crossfading two images. A crossfade is the honest fallback. This is a recommendation for the website session; it isn't built here.

**Clear space and minimum size.** Keep at least the orange corner's horizontal arm length clear around the lockup. Don't draw the full lockup under 40px tall or the compact one under 24px; below that, use the icon.

**Don't:**
- Re-type WOLFSBLVT in another font, or swap WORKS for a font.
- Mirror the corners or make them equal.
- Recolour the corners to a product's palette, or put the mark in a box.
- Paint a halo instead of the knockout.
- Use the lockup inside product UI as a product's own logo.

## WORKS: the handwriting

Five single strokes (W, O, R, K, S) and an underline, drawn by Tala, skewed -7°. The W stands taller than the rest. One stroke per letter is what lets the marks *write* it on screen. The paths are in [`source/core.mjs`](source/core.mjs) (`HAND`, `UNDERLINE`). Wolf accepted this hand. If he ever writes it himself, his strokes can replace `HAND` one for one, as long as each letter stays a single stroke.

## Motion: one motion everywhere

| Phase | Starts | Duration | Notes |
| --- | --- | --- | --- |
| Orange corner draws | 0.05s | 0.7s | |
| Magenta corner draws | 0.43s | 0.7s | answers 0.38s later, clearly not together |
| Icon dot pops | 1.10s | 0.5s | icon only |
| WOLFSBLVT lights up | 1.15s | 2.2s | starts at 14% opacity; a soft orange-to-magenta band runs ahead, and the letters stay lit behind it |
| WORKS is written | 1.15s | about 1.4s | 0.19s between letters, underline last; the knockout follows the pen; finishes before the light does |

- **Sponsor section:** same sequence. Its lit-edge letters wait dark and their glow rises with the pass.
- **Plays once:**
  - Animated SVGs play on load.
  - The web section plays when it first scrolls into view.
  - GIFs don't loop. APNGs play once.
- **Reduced motion:** every animated SVG and the web section show the finished state immediately.
- **Tuning:** the values are CSS custom properties (`--dim`, `--sweep`, `--ws`, `--corner`, `--stagger`, `--after`) and live in one place: `MOTION` in [`source/core.mjs`](source/core.mjs).
- **Recommendation (Tala's):** in the site header, play it once per visit on the first load, never again on navigation.

## Sponsor section

The words are the selected shared sponsorship copy, unchanged: **Support the work.** / *Help fund development, maintenance, and the ideas behind Wolfsblvt Works.* Then an optional project line, and the two destinations **GitHub Sponsors** and **Ko-fi**. On Works, the longer Works paragraph follows. The canonical source for these words is `docs/company/works/sponsorship.md` in Leitsatz.

**Web section** ([`sponsor-section/`](sponsor-section/)): the reusable component.
- [`works-sponsor.css`](sponsor-section/works-sponsor.css) holds the layout and the motion. [`works-sponsor.js`](sponsor-section/works-sponsor.js) plays it once on view and respects reduced motion. [`example.html`](sponsor-section/example.html) and [`example-light.html`](sponsor-section/example-light.html) are paste-ready.
- **Works owns:** the lit-edge artwork, the two corners on the border, the WORKS note, the two held radii (top-left 32px and bottom-right 49.6px, which are the corners' own bends at the 128px scale), and the motion.
- **The host owns:** the panel background and border, its other two radii, typography, buttons and surrounding spacing. Set `--works-sponsor-veil` to the panel colour.
- **Below a 600px container:** one column, the type behind the copy at low strength, and WORKS written over the magenta corner with its outline.
- **Before it ships:** the hrefs are placeholders (`#github-sponsors`, `#ko-fi`) until the real enabled destinations are set. Give ids that are unique on the page, because the artwork uses SVG masks.

**Static banner** ([`../../brand/bundle/works/svg/sponsor/`](../../brand/bundle/works/svg/sponsor/), [`../../brand/bundle/works/png/sponsor/`](../../brand/bundle/works/png/sponsor/), animated in [`../../brand/bundle/works/animated/`](../../brand/bundle/works/animated/)): the same composition for READMEs and fixed slots.
- It holds only the common words, because an image can't carry two links. The text stays editable `<text>`. Outside a browser with Literata loaded, it falls back to Georgia.
- GitHub README, dark and light:

  ```html
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="works-sponsor-banner-dark.svg">
    <img alt="Support the work. Help fund development, maintenance, and the ideas behind Wolfsblvt Works." src="works-sponsor-banner-light.svg">
  </picture>

  [GitHub Sponsors](…) · [Ko-fi](…)
  ```

## Colours and fonts

- **Colours:**
  - **Dark:** the selected Smoke & Fireworks values (canvas `#100b11`, text `#f3e8dc`, orange `#eca557`, rose `#ef8ea1` for WORKS, magenta `#db61aa`).
  - **Light:** paper `#f6efe6`, ink `#22171c`, orange `#b8661f`, magenta `#a8327a`, rose `#c4506b`. These are Tala's provisional values; the visual-grammar contribution should confirm or replace them.
- **Fonts (references only, no binaries shipped):**
  - [Abril Fatface](https://fonts.google.com/specimen/Abril+Fatface) (SIL OFL 1.1) for WOLFSBLVT, outlined in every export.
  - [Literata](https://fonts.google.com/specimen/Literata) (SIL OFL 1.1) for the Works sponsor copy.
  - The canvases also use Albert Sans, Shantell Sans, IBM Plex Sans, DM Serif Display and Fraunces as specimens.

## Historical source inventory

| Folder | Contents |
| --- | --- |
| [`../../brand/bundle/works/svg/icon/`](../../brand/bundle/works/svg/icon/) | `works-icon-{dark,light,mono}.svg`, `works-icon-animated-{dark,light}.svg`, `favicon.svg` |
| [`../../brand/bundle/works/svg/glyph/`](../../brand/bundle/works/svg/glyph/) | `works-glyph-24.svg` |
| [`../../brand/bundle/works/svg/lockup/`](../../brand/bundle/works/svg/lockup/) | `works-lockup-{dark,light,mono}.svg`, `works-lockup-compact-{dark,light,mono}.svg`, `works-lockup-animated-{dark,light}.svg` |
| [`../../brand/bundle/works/svg/sponsor/`](../../brand/bundle/works/svg/sponsor/) | `works-sponsor-banner-{dark,light}.svg`, `works-sponsor-banner-animated-{dark,light}.svg` |
| [`../../brand/bundle/works/png/icon/`](../../brand/bundle/works/png/icon/) | transparent `works-icon-{dark,light}-{16…1024}.png`, `works-icon-{white,black}-512.png`, `apple-touch-icon-180.png`, `works-icon-maskable-512.png` |
| [`../../brand/bundle/works/png/glyph/`](../../brand/bundle/works/png/glyph/) | `works-glyph-{bone,ink}-{24,48,96}.png` |
| [`../../brand/bundle/works/png/lockup/`](../../brand/bundle/works/png/lockup/) | transparent `works-lockup-{dark,light}-{600,1200,2400}w.png`, `works-lockup-{white,black}-1200w.png`, `works-lockup-compact-{dark,light}-{32,64,128}h.png` |
| [`../../brand/bundle/works/png/sponsor/`](../../brand/bundle/works/png/sponsor/) | `works-sponsor-banner-{dark,light}.png` and `@2x` |
| [`../../brand/bundle/works/animated/gif/`](../../brand/bundle/works/animated/gif/) | play-once GIFs for icon (256), lockup (1200w) and sponsor banner, dark and light. GIFs sit on their background: Works dark/paper, and GitHub's README backgrounds for the banner |
| [`../../brand/bundle/works/animated/apng/`](../../brand/bundle/works/animated/apng/) | play-once APNGs, same set, transparent |
| [`sponsor-section/`](sponsor-section/) | the web component, examples and specimen |
| [`canvas/`](canvas/) | the three design rounds, interactive |
| [`source/`](source/) | the generator (`core.mjs`, `build.mjs`, `sponsor-section.mjs`) and `geometry.json` |
| [`assets.html`](assets.html) | visual index of every file |

**Notes on formats:**
- **Animated SVGs** animate with CSS. They play in browsers, including as `<img>`. Editors such as Inkscape or Figma show their *start* state (empty corners), so edit the static SVGs instead.
- **APNG:** a viewer without APNG support shows only the first frame, which is the empty start state. That's why the files use the `.apng` extension instead of passing as static PNGs. Use them only where APNG support is known.

## Historical renderer

From `design/marks/source/`, run `npm install`. Then run `node build.mjs --font <path>/AbrilFatface-Regular.ttf`. The font comes from [google/fonts](https://github.com/google/fonts/tree/main/ofl/abrilfatface) and isn't included here.

- `--no-raster` writes SVGs into `brand/bundle/works/`, updates source geometry here, and regenerates design-only sponsor specimens.
- The raster pass needs Chrome (`--chrome <path>` if it isn't in the default location) and `ffmpeg` on PATH. It renders in a temporary, isolated Chrome profile and deletes it afterwards.
- One detail that matters: headless Chrome reports `prefers-reduced-motion: reduce`, so the build emulates `no-preference` for frames. Without that, every frame comes out as the finished state.

## Provenance and boundaries

- **Authorship:** marks, handwriting strokes, construction and generator by Tala (Claude Code, Opus 5.5), in co-design with Wolf.
- **Not in the marks:** the resident Yoru, the human VTuber doodle, and any product character. Yoru appears only as a guest in a round-1 sponsor exploration.
- **No claims made:** this return claims no trademark registration, clearance, or live sponsorship destination. The Works name and legal standing remain with the Works identity authority in Leitsatz.
- **Placeholder content:** the diffdevil host is a sketch of its window in the Walk. The light host and the smolpng line are illustrative.

## Original handoff remainder (historical)

- **Visual grammar (contribution 01):** confirm the light-mode relatives and token names. Placement of the marks in the site grammar.
- **Website session:**
  - the header 44 → 32px ease, using `geometry.json`;
  - first-load mark motion;
  - footer use of the full lockup;
  - the sponsor component on Works itself, where it replaces rather than repeats the existing support section.
- **Site identity:** favicon projection (`favicon.svg`, the PNG sizes, touch and maskable icons) and social preview cards. The 16 and 32px icon exports are rendered geometrically and not hand-snapped to the pixel grid; do that if they look soft in real tabs.
- **`@wolfsblvt/icons`:** admission of `works-glyph-24.svg` through the package's icon standard.
- **Sponsorship rollout:** the real GitHub Sponsors and Ko-fi destinations, and which product pages enable the section. The copy and offers stay with their owning sources.
- **Proposed extras, not built here:**
  - a README maker badge;
  - a social preview template;
  - Ko-fi and GitHub Sponsors profile art.
