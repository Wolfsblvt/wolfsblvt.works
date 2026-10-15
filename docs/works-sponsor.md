# Shared Works sponsor invitation

## Meaning

Works owns one opt-in invitation: common words, lit-edge artwork, corners, handwritten WORKS and motion.
Products choose placement and real enabled destinations. This is the build-time binding contract, not a claim that
sponsorship accounts or a published website exist.

## Consume the component

Vendor the complete `brand/bundle/works/` tree. The manifest addresses `components/works-sponsor.html`,
`css/works-sponsor.css` and `components/works-sponsor.mjs`, with artwork, fonts and licences. Bundle these local files
through the host stack. There is no runtime remote fetch, telemetry or browser storage.

The template uses four build-time substitutions: `{{id}}`, `{{heading}}`, `{{context}}` and `{{links}}`.
Bind a unique lowercase id prefix per instance and heading level 1–6. Escape optional context text and enabled HTTPS
hrefs. Render only enabled GitHub Sponsors/Ko-fi links; unavailable destinations produce no link. Arbitrary host markup
is not admitted. `src/lib/works-sponsor.mjs` is the site's binding example.

Common heading and paragraph remain fixed; context follows them. The Astro adapter reads the bundle template and
carries no duplicate artwork. Import the stylesheet and call `mountWorksSponsors()` after the page exists. Each instance
plays once on substantial first view. Without scripts/observer or with reduced motion, finished artwork stays visible.
SVG ids are composed uniquely at build time.

## Host presentation

The stylesheet documents defaults for `--works-sponsor-background`, `--works-sponsor-border`,
`--works-sponsor-radius-top-right`, `--works-sponsor-radius-bottom-left`, `--works-sponsor-text`,
`--works-sponsor-font`, `--works-sponsor-heading-font`, `--works-sponsor-button-background`,
`--works-sponsor-button-text` and `--works-sponsor-spacing`. The veil follows the panel background.
Artwork colors, held top-left/bottom-right radii, common copy, composition and internal motion are Works-owned.
The Works site's existing host treatment remains in `src/styles/sponsor.css`; its font variables preserve the selected
Literata typography independently of stylesheet import order.

For a fixed slot use `sponsor.banner` with its static fallback and links outside the image. Native web bindings preserve
the same content, geometry and behavior. See [qualification](brand-qualification.md) for the actual exercised boundary.
