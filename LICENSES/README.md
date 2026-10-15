# Wolfsblvt Works website licence boundaries

## Meaning

This is the authoritative component map for code, prose, artwork and third-party material in this repository and in the website built from it. Placement beside a licensed component does not silently license unrelated content.

## Website and service code — AGPL-3.0-only

The website's code is licensed under [GNU AGPL-3.0-only](AGPL-3.0-only.txt): everything under `src/` that is code (Astro components, pages, layouts, browser scripts, styles and content schemas), the Cloudflare Worker and contact service under `worker/`, the shared contract and policy modules under `shared/`, build and asset scripts under `scripts/`, the tests under `tests/`, and the configuration files at the root. A modified version that people use over a network must offer them its Corresponding Source.

The design canvas's tool scripts under `design/the-walk/tools/` and the marks generator under `design/marks/source/` are code too, under the same terms; the artwork they produce is not (see below).

## Prose — CC BY 4.0

Original prose is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/legalcode): the site's copy, the Pile's entries in `src/content/pile/`, the documentation in `docs/`, `README.md`, and the written records under `design/` and `references/`. Credit **Wolfsblvt Works**, link the licence and say what you changed. Quoted third-party material keeps its own terms.

## Reserved: the marks, Yoru and other artwork

The Wolfsblvt Works marks (the WOLFSBLVT / WORKS lockups, the icon and its corners, the handwritten WORKS, the sponsor artwork and their motion), Yoru, the agent avatars, the diffdevil identity, the social cards and every other piece of artwork in this repository are reserved. That covers `assets/brand/`, `design/marks/`, `design/the-walk/assets/`, `references/avatars/`, `public/social/` and the projections the build generates from them (favicons, app icons, Yoru's spritesheets). Their appearance in AGPL code or CC BY prose grants no right to use them; the names and marks identify Wolfsblvt Works and its projects.

The compact `wolfsblvt/works` and `wolfsblvt/signpost` glyphs are a separate case: they are distributed by [`@wolfsblvt/icons`](https://github.com/Wolfsblvt/wolfsblvt-icons) under MIT, and the site renders them from that package.

## Third parties

**Fonts** are self-hosted from [Fontsource](https://fontsource.org/) packages and shipped with the built site (Latin and Latin Extended subsets):

| Font | Copyright | Licence |
| --- | --- | --- |
| Literata | 2017 The Literata Project Authors | [SIL OFL 1.1](OFL-1.1.txt) |
| Albert Sans | 2021 The Albert Sans Project Authors | [SIL OFL 1.1](OFL-1.1.txt) |
| Shantell Sans | 2022 The Shantell Sans Project Authors | [SIL OFL 1.1](OFL-1.1.txt) |
| IBM Plex Sans, IBM Plex Mono | 2017–2019 IBM Corp. | [SIL OFL 1.1](OFL-1.1.txt) |
| Special Elite | Google Inc. (Astigmatic) | [Apache 2.0](Apache-2.0.txt) |

Abril Fatface appears only as outlines inside the marks and does not ship as a font.

**Icons** resolve at build time through `@wolfsblvt/icons` (MIT; see its [third-party notices](https://github.com/Wolfsblvt/wolfsblvt-icons/blob/main/third-party-notices.md)) and are embedded as inline SVG; nothing loads from an icon service. Ordinary interface glyphs come from [Lucide](https://lucide.dev/) (ISC; some geometry derived from Feather, MIT) and brand marks from [Simple Icons](https://simpleicons.org/) (CC0-1.0 for the icon data). The GitHub, Discord and Bluesky names and marks remain their owners' property; showing them implies no affiliation or endorsement.

#### Lucide ISC notice

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

Some Lucide geometry is derived from Feather:

```text
The MIT License (MIT)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Cloudflare Turnstile** loads on the contact page from Cloudflare under Cloudflare's own terms; it is not part of this repository.

Every other dependency keeps its own licence, recorded in `package-lock.json` and its distribution.
