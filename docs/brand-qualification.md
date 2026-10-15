# Works brand qualification

## Meaning

This record owns the rendered qualification and reproduction boundary of the standardized Works bundle. It separates
approved artwork, inspected consumer behavior and unobserved publication; it is not external adoption.

## Source and export

The approved SVG, PNG, GIF and APNG masters were moved byte for byte from the repaired asset tree at
`671b93c8db0e211e8ad6738034667dca7cbfe5b9` into `brand/source/works/artwork/`. Design canvases and editable geometry
remain provenance under `design/marks/`. UI glyphs are distributed exclusively through `@wolfsblvt/icons`.
The application/touch glow tile preserves the existing website generator. The maskable composition preserves the
approved 300px drawing centered in its 512px tile. The website continues to have no application manifest.

`scripts/export-brand.mjs` copies approved masters and bounded component/foundation files, projects the tile and
hashes every delivered byte. Fonts originate from pinned Fontsource packages; exact font bytes and OFL licences
travel with the source. The outlined name needs no font. Sponsor image copy keeps its existing serif fallback.
The accepted shared Brand Bundle v1 schema/executor is vendored unchanged in `tools/brand-bundle/`.

## Rendered qualification

The Chromium pass renders fixed SVGs and their additional adaptive renditions on white, paper `#f6efe6`, near-black
`#100b11` and dark blue `#0c1217`, in both browser color schemes. Fixed on-light/on-dark and monochrome variants
remain legible on their intended background class. Opaque application/touch/maskable tiles retain their own background
on all four surfaces. Full and compact name drawings retain the approved geometry and clear separation.

Adaptive SVGs follow the browser scheme, not the host's actual background. A dark-scheme drawing on a light panel
can have poor contrast, and the converse also holds. They are additional conveniences, not universal artwork. Choose
fixed files with picture fallbacks for known host backgrounds. The sponsor banner's copy needs a wide fixed slot;
the manifest recommends 800px, with the responsive component or lockup/text credit for narrower contexts.

The shared component was exercised at 390px and 1280px with two independent SVG namespaces, keyboard focus, reduced
motion and script-disabled completion. The native Works binding plays once on scroll and stays finished when revisited.
Its selected Literata typography is bound through host variables to survive stylesheet ordering. GIF frame dimensions,
durations and finite play counts pass the shared validator; optional APNG timing is retained from the approved source,
not independently re-authored or frame-by-frame qualified here.

No publication, physical device installation or real external consumer is claimed.

### Captured evidence and test standing

The Windows local run uses Chromium from Playwright 1.63.0. The focused shared-component pass is 4/4, including actual
light/dark panels, 390px/1280px widths, two instances, keyboard focus, script-disabled completion and one-play motion.
The identity sheet's two scheme cases passed. The source check passes with 89 unit/Worker tests, zero Astro diagnostics,
a successful build and a valid byte-identical served mirror.

The full browser suite is **not green**: both attempts finished 38/39. The default two-worker run failed the Pile's
ready-state expectation before the Back/Forward assertions; a one-worker run passed that case but failed the Pile
animation sampling count (2 intermediate samples, expected more than 5). No Pile implementation or timing criterion
was changed to hide those failures. Their cause remains unresolved; these results qualify the brand surfaces, not the
whole website without limitation.

- [Native Works sponsor binding](brand/works-help.png)
- [Shared light/dark panels at 390px](brand/works-sponsor-narrow.png) and [1280px](brand/works-sponsor-wide.png)
- [Full header drawing](brand/header-full.png) and [scrolled compact drawing](brand/header-compact.png)

## Reproduce and consume

The manifest's `source.commit` is the immutable input commit, not the later consumer carrier commit. With the pinned
dependencies installed, run `npm run brand:export -- <source.commit>`, compare the complete file set and
`bundleSha256`, and run `npm run brand:check`. Git attributes preserve transported bytes.
Retain that input commit unchanged on integration, or establish a new durable input coordinate and regenerate before
promoting the bundle. A PR head alone is not accepted-history durability.

This source candidate does not establish real external adoption or publication. Those require their own observed consumer path.
