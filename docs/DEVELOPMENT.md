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
| Publication gate on its own | `npm run check:publish` |
| Publication build | `npm run build:production` |

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

Find all usable exports in the [brand asset catalogue](../assets/README.md): `assets/brand/` stores SVGs, static light/dark variants, adaptive SVGs, PNGs and animations. Source geometry, generators and historical canvas/specimens are separately in `design/marks/`. The website never depends on the internal design handoff structure.

To regenerate approved marks, use `design/marks/source/`: install the dependencies there and run `node build.mjs --font <path-to-AbrilFatface-Regular.ttf>` (`--no-raster` for an SVG-only pass). SVG and raster exports go into `assets/brand/`, the geometry stays under `design/marks/source/`, and preview specimens remain under `design/marks/sponsor-section/`. Review and commit intended changed exports.

The live Help section is `src/components/WorksSponsor.astro` plus `src/styles/sponsor.css`. It renders real links from `site.config.mjs`; no HTML or CSS is scraped from design demonstrations. `src/lib/marks.ts`, the favicon generator and social-card renderer use the approved exports. `npm run check` also verifies the rendered sponsorship links.

## Generated artifacts

Produced by the build, ignored by Git, never edited by hand:

| Path | Made by |
| --- | --- |
| `artifacts/site/` | `astro build`, then `scripts/write-headers.mjs` for `_headers` |
| `public/fonts/`, `src/styles/fonts.generated.css` | `scripts/prepare-fonts.mjs`, from the Fontsource packages (Latin and Latin Extended) |
| `public/favicon.svg`, `public/favicon-192.png`, `public/apple-touch-icon.png` | `scripts/generate-identity-assets.mjs`, from the marks |
| `public/yoru/sheet-1x.webp`, `sheet-2x.webp`, `src/generated/yoru-doze.ts` | the same script, from Yoru's frames in `design/the-walk/assets/` |
| `artifacts/test-results/`, `artifacts/review/` | Playwright, and one-off review captures |

**Committed on purpose:** `public/social/home.png` and `public/social/contact.png`. They are rendered by
`npm run cards` with Playwright and the site's own fonts, and kept in Git so the build doesn't need a browser. Re-render
and commit them when the hero copy, the lockup or a card's line changes.

## Common paths

### Add a Pile piece

Write a Markdown file in `src/content/pile/`. The schema is in `src/content.config.ts`; the forms, sizes and tone are in
the [Pile authoring guide](pile/pile-authoring-guide.md), and the behaviour behind it in
[the Pile experience](pile/pile-experience.md) and [technical plan](pile/pile-technical-plan.md). Add its id to `ENDLESS_ORDER`
in `src/features/pile/order.ts`, which lists every piece exactly once in Endless order; the build refuses otherwise. Pieces with `daily: true` can be dealt onto the
desk. A piece with its own small interaction gets a module under `src/features/pile/entries/<id>/` and a loader entry
in `client/interactions.ts`.

### Add a product to the contact picker

Register the slug, label and order in `PRODUCTS` in `shared/contact-contract.ts`, then its type, icon and home in
`src/features/contact/products.ts`. The picker shows a dashed placeholder with the initial until the product has a glyph
in `@wolfsblvt/icons`. Other sites then link to `https://contact.wolfsblvt.works/?product=<slug>`.

### Update the icons

All icons come from `@wolfsblvt/icons`; this repository has no local SVG icons. A missing glyph or brand mark is added
to [wolfsblvt-icons](https://github.com/Wolfsblvt/wolfsblvt-icons) and released there, then picked up here with
`npm install @wolfsblvt/icons@<version>`.

### Change a hosting fact on the Privacy page

The hosting facts live in `legal.privacy` in `site.config.mjs`. Each entry stays `pending: true`, rendered as a marked
fixture, until it has been read back from the actual deployment.

## Publication

The site is complete and deliberately not published. Before it goes public, all of this must hold.

**Content and copy** (refused by `npm run check:publish` until done):

- Real Pile pieces replace the `illustrative: true` ones, and no piece links to an example address.
- The smolpng, Shikkuri and Lunescence windows are authored in their projects' own voice and lose `data-placeholder`.
- The legal operator arrives as `WOLFSBLVT_LEGAL_OPERATOR_B64` (base64 of the canonical operator record, schema version
  1), with its contacts provisioned. The public fixture and anything containing its values are refused.
- Every `legal.privacy` fact in `site.config.mjs` is confirmed against the deployment and set `pending: false`,
  including the retained log route and its 12-month retention from [Logging](LOGGING.md#retention-and-deletion).
- `wrangler.jsonc` carries the production Turnstile site key instead of `REPLACE_WITH_PRODUCTION_TURNSTILE_SITE_KEY`.
- Every dependency resolves from the npm registry, never a local path or tarball.

**Confirmed by hand:**

- GitHub Sponsors is live at `https://github.com/sponsors/Wolfsblvt`. Sponsors was waiting for this site and its assets;
  set it up after they are done and before publishing.
- Bluesky: `links.bluesky` in `site.config.mjs` is set when the profile exists. Until then the slot shows as visibly
  unavailable, which is fine to publish.

**Hosting (Wolf Ops):**

- A Cloudflare Worker named `wolfsblvt-works` deployed with `--env production`, `BUILD_VERSION` set to the commit, and
  routes or custom domains for `wolfsblvt.works` and `contact.wolfsblvt.works`.
- Secrets `TURNSTILE_SECRET_KEY` and `CONTACT_FORM_SECRET` (`wrangler secret put --env production`).
- A managed Turnstile widget for `contact.wolfsblvt.works` with action `contact`.
- Email Service: `contact@wolfsblvt.works` verified as the internal destination and allowed as the sender of the
  visitor copy. Email Sending only; mail itself stays where it is hosted.
- `artifacts/site/503.html` uploaded as the zone's custom error page for 5xx.
- Workers Logs on, and the retained log route from [Logging](LOGGING.md).
- After deployment: read back both hosts, the redirect from `wolfsblvt.works/contact/`, the headers on a static page and
  on the home page, a real contact submission end to end, and the privacy facts.

`npm run build:production` with the operator projection in the environment builds the site with the legal pages
required to be real, runs the output check, then the publication gate.

There is no deployment workflow in this repository yet. `.github/workflows/verify.yml` only verifies.
