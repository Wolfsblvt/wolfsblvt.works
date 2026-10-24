# Wolfsblvt Works artwork

## Meaning

Approved identity files for a README, profile, product credit or shared sponsor invitation. The sole consumer root is
[brand/bundle/works/](../brand/bundle/works/). Design/source paths are not a second reuse API.

![Wolfsblvt Works](../brand/bundle/works/assets/lockup-default/on-dark.svg)

| Need | Canonical role |
| --- | --- |
| Full logo / README title | [lockup.default](../brand/bundle/works/assets/lockup-default/) |
| Logo below 40px tall | [lockup.compact](../brand/bundle/works/assets/lockup-compact/) |
| Standalone mark | [mark.primary](../brand/bundle/works/assets/mark-primary/) |
| Browser/application/touch/maskable | [Icon projections](../brand/bundle/works/assets/) |
| Fixed sponsor slot | [sponsor.banner](../brand/bundle/works/assets/sponsor-banner/) |
| Interactive web invitation | [Shared component](../docs/works-sponsor.md) |
| Every exact file | [Gallery](works-gallery.html), [manifest](../brand/bundle/works/manifest.json) |

`on-light` means intended for light backgrounds; `on-dark` means dark backgrounds. Every core appearance has fixed
SVG and PNG. Animated roles carry SVG/GIF plus static fallbacks; APNG is additional. The adaptive SVG is a convenience
with both drawings and never replaces the fixed set. Opaque app tiles are universal. UI glyphs come exclusively from
`@wolfsblvt/icons`: `wolfsblvt/works` and `wolfsblvt/signpost`.

The fixed sponsor banner's small copy is intended for a slot at least 800px wide. On narrow web surfaces use the
responsive component; for a tiny fixed credit use the lockup with ordinary text and links beside it.

## Pin or vendor

Choose an accepted carrier commit containing the manifest. Pin repository references to that full SHA, or copy the
complete bundle byte for byte to `vendor/brand/works/` and validate it. The manifest records the earlier input commit
and bundle digest; that input SHA is not the consumer carrier pin.

A GitHub README uses a picture with the pinned `assets/lockup-default/on-dark.svg` source and
`assets/lockup-default/on-light.svg` fallback, alt text “Wolfsblvt Works” and links outside the image. Use the same
pattern for `assets/sponsor-banner/`, with enabled support links separately. Avoid floating main URLs.

The [published mirror](https://wolfsblvt.works/brand/works/manifest.json) is at `https://wolfsblvt.works/brand/works/`.
It serves display-only surfaces deliberately following the
current identity; product runtimes vendor tokens, CSS, fonts and components at build time.

## Maintenance and rights

Edit `brand/source/works/`, export and validate; never edit the generated bundle. The [design record](../design/marks/README.md)
preserves Wolf/Tala's co-design. [Qualification](../docs/brand-qualification.md) explains input/carrier history and evidence.
Artwork remains reserved. Font licences and component-code licensing travel in the bundle; see [licence boundaries](../LICENSES/README.md).
