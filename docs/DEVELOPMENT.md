# Development

## Meaning

How to build, run, test and prepare the Wolfsblvt Works website for publication on a fresh clone: the toolchain, the
static dev server and the local Worker, the three test layers, what the build generates, how to reset, the everyday
changes (Pile pieces, contact products, icons, social cards), and the publication checklist that has to be clear before
the site goes public. It owns the local bootstrap, run and test boundary. Hosting adoption itself is Wolf Ops work;
this guide lists what that work has to provide.

## Prerequisites

- **Node.js 22.12 or later**, 24 recommended (`.node-version`). Astro 7 needs 22.12.
- **npm.** With npm 12, install scripts only run for packages listed in `allowScripts` in `package.json` (esbuild and
  workerd). Older npm runs them anyway.
- **Chromium for Playwright**, only for the browser QA suite: `npx playwright install chromium`. Firefox and WebKit are
  optional (`npx playwright install firefox webkit`).

Nothing else is needed locally: Wrangler and the Workers runtime come from `node_modules`, and no Cloudflare account
is required for development.

## Bootstrap

```sh
npm install
cp .dev.vars.example .dev.vars
```

`.dev.vars` holds the two secrets `wrangler dev` needs: Turnstile's documented always-passing test secret, and any long
random string for `CONTACT_FORM_SECRET`. It is ignored by Git; real values never go in the repository.

## Run and test

| Task | Command |
| --- | --- |
| Static site with hot reload, at <http://localhost:4321> | `npm run dev` |
| Built site through the real Worker, at <http://localhost:8787> | `npm run dev:worker` |
| Build to `artifacts/site/` | `npm run build` |
| Full verification: types, unit and Worker tests, build, output check | `npm run check` |
| Types only (Astro pages and the Worker) | `npm run check:types` |
| Unit and Worker tests | `npm run test:unit` |
| One test file | `npx vitest run tests/unit/pile-selection.test.ts` |
| Browser QA: build, then Playwright against a local Worker on port 8788 | `npm run qa` |
| Browser QA in Firefox and WebKit too | `QA_ALL_BROWSERS=1 npm run qa` |
| Re-render the social cards | `npm run cards` |
| Refresh the committed profile pictures of people credited in the Pile | `npm run credits` |
| Publication gate on its own | `npm run check:publish` |
| Publication build | `npm run build:production` |
| Contact-first launch build (the contact page, its assets, the 404 and the 503; nothing else) | `npm run build:contact-only` |

`npm run dev` serves the static pages only: there is no Worker, so the Pile has no per-browser seed and the contact
form is not prepared. Use `npm run dev:worker` for the contact journey and anything the Worker touches. It rebuilds
first; rerun it after changing the site.

### The three test layers

- **`unit`** (Node): the Pile deal and packer, the Walk generator and the lockup ease, the CSP builder, the pile seed,
  and the contact service with injected fakes: validation, tokens, Turnstile, mail composition, the redacted log event.
- **`contact-worker`** and **`site-worker`** (workerd, through `@cloudflare/vitest-pool-workers`): the contact seam and
  the site Worker's routing, seeding, redirects and headers, run in the real Workers runtime against small fixture
  pages in `tests/fixtures/`.
- **Playwright** (`tests/e2e/`): real-browser journeys against the built site and the real Worker. The Pile's deal,
  scatter, Endless, addresses and history; the contact form's validation, picker and outcomes, with the submission
  answered by a route mock so no mail is sent; the rooms; and a phone layout pass.

## Local services

`npm run dev:worker` runs `wrangler dev` with the `vars` from `wrangler.jsonc`: environment `development`,
`CONTACT_SENDING_ENABLED` `false`, and Turnstile's always-passing test site key. Submissions run the whole pipeline and
end with the honest "sending is paused" outcome; no mail can leave a development run. The contact page answers at
`/contact/` on the same host there; in production it lives on `contact.wolfsblvt.works`.

Rate limiters and `send_email` bindings are simulated locally by Wrangler. Nothing local reaches Cloudflare.

## Safe reset

```sh
npm run clean
npm run build
```

That removes every build output, Astro's cache, Wrangler's local state and the generated assets, then recreates them.
It touches nothing tracked. `node_modules` can go too; `npm install` restores it from the lockfile.

## Reusable assets and the sponsor section

Find every consumer file in the [brand catalogue](../assets/README.md) and `brand/bundle/works/manifest.json`.
Maintained artwork and foundation masters live in `brand/source/works/`; historical geometry/canvases remain in
`design/marks/`. The website reads only the generated bundle.

After changing masters/exporter, commit the immutable input first, then run `npm run brand:export -- <input-sha>` and
`npm run brand:check`. Commit the generated tree in a later carrier commit. Preserve the input commit unchanged on
integration or regenerate after establishing its replacement. Repeat the export and compare all files and the digest.
The optional historical design renderer now writes artwork masters, never consumer files. It is not needed to reproduce
the bundle. [Qualification](brand-qualification.md) records its pinned inputs and rendered boundary.

The live Help section is `src/components/WorksSponsor.astro` plus `src/styles/sponsor.css`. It renders real links from `site.config.mjs`; no HTML or CSS is scraped from design demonstrations. `src/lib/marks.ts`, the favicon generator and social-card renderer use the approved exports. `npm run check` also verifies the rendered sponsorship links.

## Generated artifacts

Produced by the build, ignored by Git, never edited by hand:

| Path | Made by |
| --- | --- |
| `artifacts/site/` | `astro build`, then `scripts/write-headers.mjs` for `_headers` |
| `public/fonts/`, `src/styles/fonts.generated.css` | `scripts/prepare-fonts.mjs`, from the Fontsource packages (Latin and Latin Extended) |
| `public/favicon.svg`, `public/favicon-192.png`, `public/apple-touch-icon.png` | `scripts/generate-identity-assets.mjs`, from the marks |
| `public/brand/works/` | The same script, byte-for-byte mirror of the committed canonical bundle |
| `src/generated/yoru-doze.ts` | the same script: one sleeping frame from `design/yoru/sheets/sleep.webp`, inline for the 503 |
| `public/yoru/resident/<family>-1x.webp`, `-2x.webp`, `src/generated/yoru-families.ts` | the same script, from the resident's packed sheets in `design/yoru/sheets/`; a sheet is re-encoded only when its master changed |
| `artifacts/yoru-studio/` | `npm run yoru`: raw generations, cut frames, contact sheets and the studio pages |
| `artifacts/test-results/`, `artifacts/review/` | Playwright, and one-off review captures |

**Committed on purpose:** `public/social/home.png` and `public/social/contact.png`. They are rendered by
`npm run cards` with Playwright and the site's own fonts, and kept in Git so the build doesn't need a browser. Re-render
and commit them when the hero copy, the lockup or a card's line changes. The same goes for the profile pictures of
people credited in the Pile (`src/features/pile/entries/mpreg/nek0tera.jpg`): `npm run credits` fetches them from
their own public pages; commit the result.

## Common paths

### Make or change Yoru's animation

`npm run yoru -- generate <family> <clip>` draws candidates through `codex exec` (Codex's built-in image tool on the
ChatGPT plan signed in on this machine; no API key), `npm run yoru -- serve` shows them at
http://localhost:4390/preview/ and the resident rehearsal at /rehearsal/, `select` picks one and `pack` writes the
sheet the site builds from. [design/yoru/README.md](../design/yoru/README.md) is the authoring guide.

### Add a Pile piece

Write a Markdown file in `src/content/pile/`. The schema is in `src/content.config.ts`; the forms, footprints and tone
are in the [Pile authoring guide](pile/pile-authoring-guide.md), and the behaviour behind it in
[the Pile experience](pile/pile-experience.md) and [technical plan](pile/pile-technical-plan.md). Add its id to
`ENDLESS_ORDER` in `src/features/pile/order.ts`, which lists every piece exactly once in Endless order; the build
refuses otherwise. Pieces with `daily.include: true` can be dealt onto the desk; `daily.footprint` sizes them there.
A piece whose form can't carry its material gets its own scene: `Compact.astro` and/or `Expanded.astro` under
`src/features/pile/entries/<id>/`, and `interaction.ts` beside them when it has behaviour. They are found by file;
nothing else needs editing. The existing entries are the examples.

### Add a product to the contact picker

Register the slug, label and order in `PRODUCTS` in `shared/contact-contract.ts`, then its type, icon and home in
`src/features/contact/products.ts`. The picker shows a dashed placeholder with the initial until the product has a glyph
in `@wolfsblvt/icons`. Other sites then link to `https://contact.wolfsblvt.works/?product=<slug>`.

### Update the icons

All icons come from `@wolfsblvt/icons`; this repository has no local SVG icons. A missing glyph or brand mark is added
to [wolfsblvt-icons](https://github.com/Wolfsblvt/wolfsblvt-icons) and released there, then picked up here with
`npm install @wolfsblvt/icons@<version>`.

### The miniflare override

`package.json` overrides `sharp` and `undici` beneath `miniflare` only. The miniflare that
`@cloudflare/vitest-pool-workers` pins (an alpha, as of 0.23.0) pins both exactly, at versions with published
advisories; the override lifts them to the patched releases for the workerd tests. It affects nothing the site ships.
Remove it once the pinned miniflare itself requires `sharp` ≥ 0.35.5 and `undici` ≥ 7.30.1 (check with
`npm explain sharp undici`), or whenever it holds those packages below what miniflare asks for.

### Change a hosting fact on the Privacy page

The hosting facts live in `legal.privacy` in `site.config.mjs`. Each entry stays `pending: true`, rendered as a marked
fixture, until confirmed against provider evidence. The six publication facts were confirmed by Wolf Ops on 2026-10-24;
live readback remains a separate publication step. Current request-log and contact-event retention is up to 7 days in
Workers Logs.
Twelve months remains selected, active only after the private R2 route, 365-day lifecycle and a retained event are read
back. R2 is not a publication gate; update the privacy fact and [Logging](LOGGING.md#retention-and-deletion) together
when that route is proved.

## Publication

The content is authored and the site is deliberately not yet published. Before it goes public, all of this must hold.

**Content and copy** (refused by `npm run check:publish` until done):

- No Pile piece is `illustrative: true` and none links to an example address; no project window carries
  `data-placeholder`. Both marks mean unreplaced scaffolding only; a composed scene is content
  ([Decisions](DECISIONS.md#composed-scenes-are-content-only-unreplaced-scaffolding-is-a-placeholder)).
- The legal operator arrives as `WOLFSBLVT_LEGAL_OPERATOR_B64` (base64 of the canonical operator record, schema version
  1), with its contacts provisioned and its additional direct contact (the live form) `provisioned`. The public
  fixture and anything containing its values are refused.
- Every `legal.privacy` fact in `site.config.mjs` is confirmed against provider evidence and set `pending: false`.
  Publication states the current 7-day retention from [Logging](LOGGING.md#retention-and-deletion); the selected
  12-month retained route is separate, non-blocking Work.
- `wrangler.jsonc` carries the production Turnstile site key (it does, since 2026-10-23: the public key of the widget
  Wolf Ops created for `contact.wolfsblvt.works`).
- Every dependency resolves from the npm registry, never a local path or tarball.

**Confirmed by hand:**

- GitHub Sponsors is live at `https://github.com/sponsors/Wolfsblvt` (read back by Wolf Ops on 2026-10-22).
- Bluesky: `links.bluesky` in `site.config.mjs` is set when the profile exists. Until then the slot shows as visibly
  unavailable, which is fine to publish.

**The first launch, in order (Wolf Ops, #916):**

1. **Contact first.** `npm run build:contact-only`, deployed with `--env production` and only
   `contact.wolfsblvt.works` routed. The build holds the contact page, its assets, the 404 and the 503; no home, no
   legal pages, no sitemap. `workers_dev` and preview URLs are off in `wrangler.jsonc`, so nothing is public on a
   provider hostname either.
2. **Read the form back.** The page renders with the production Turnstile, and one identified test submission arrives
   in the inbox with the visitor copy.
3. **Flip the legal pointer.** Ops records the additional direct contact as `provisioned` in the canonical record and
   refreshes `WOLFSBLVT_LEGAL_OPERATOR_B64`.
4. **Publish.** `npm run build:production`, deployed with both hosts routed, then read back from outside.

**Hosting (Wolf Ops):**

- A Cloudflare Worker deployed with `--env production` (`wrangler` derives the name `wolfsblvt-works-production`),
  `BUILD_VERSION` set to the commit, and routes or custom domains for `wolfsblvt.works` and
  `contact.wolfsblvt.works`; `www` redirecting to the apex.
- Secrets `TURNSTILE_SECRET_KEY` and `CONTACT_FORM_SECRET` (`wrangler secret put --env production`).
- A managed Turnstile widget for `contact.wolfsblvt.works` with action `contact` (created 2026-10-22).
- Email Service: `contact@wolfsblvt.works` verified as the internal destination and `wolfsblvt.works` onboarded as the
  sending domain for the visitor copy (done 2026-10-22; the first real submission proves signing and delivery).
- Errors: the Worker serves `503.html` itself for failures it can catch. The zone is on the free plan, which cannot
  show a custom page for provider-level errors; that remains a priced choice for Wolf, not a step here.
- Workers Logs on (current retention up to 7 days). The private retained route from [Logging](LOGGING.md) is not a
  publication gate; 12 months must not be claimed until its route, 365-day lifecycle and retained event are read back.
- After deployment: read back both hosts, the redirect from `wolfsblvt.works/contact/`, the headers on a static page and
  on the home page, a direct `#pile-<id>` link, a real contact submission end to end, and the privacy facts.

`npm run build:production` with the operator projection in the environment builds the site with the legal pages
required to be real, runs the output check, then the publication gate.

There is no deployment workflow in this repository yet. `.github/workflows/verify.yml` only verifies.
