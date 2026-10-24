# Development

## Meaning

How to build, run, test and prepare the Wolfsblvt Works website for publication on a fresh clone: the toolchain, the
static dev server and the local Worker, the three test layers, what the build generates, how to reset, the everyday
changes (Pile pieces, contact products, icons, social cards), and validated automatic publication. It owns the local
bootstrap, run/test and publication-source boundary. Wolf Ops supplies provider setup, credentials, activation and live
qualification; workflow source alone does not establish those effects.

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
| Live HTTPS readback of both public hosts (after a deployment or route change) | `npm run check:live-https` |
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
| `artifacts/site/build-version.txt` | `Website` stamps the resolved source SHA after the production build; it contains no operator data |
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
their own public pages; commit the result. README captures and Yoru's greeting are also committed intentionally;
[README media](assets/readme/README.md) records their sources and reproduction.

## Common paths

### Make or change Yoru's animation

`npm run yoru -- generate <family> <clip>` draws candidates through `codex exec` (Codex's built-in image tool on the
ChatGPT plan signed in on this machine; no API key), `npm run yoru -- serve` shows them at
http://127.0.0.1:4390/preview/ and the resident rehearsal at /rehearsal/, `select` picks one and `pack` writes the
sheet the site builds from. [design/yoru/README.md](../design/yoru/README.md) is the authoring guide.
The studio binds only `127.0.0.1`. Its tempo board edits source through same-origin JSON requests capped at 4 KiB;
tempo is 0.25–3 and walk/run stride is 20–240 pixels, matching the board's supported stride range.

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
fixture, until confirmed against provider evidence. The publication facts were confirmed by Wolf Ops on 2026-10-24;
live readback remains a separate publication step. Ordinary request logs remain available for up to 7 days in Workers
Logs. Structured `contact.submission` events are retained for up to 12 months through the private Logpush/Pipelines/R2
route, whose 365-day lifecycle and first retained contact-class event were read back. Keep the two facts distinct and
update this guide, [Logging](LOGGING.md#retention-and-deletion) and `site.config.mjs` together when either changes.

## Publication

The site is public. Routine publication uses the controller below; the first-admission sequence is preserved afterward
as history and recovery context. This guide describes source and operating prerequisites, not a deployment receipt.

### Automatic publication

`.github/workflows/website.yml` is the sole automatic production controller. It runs on `main` only, using native
`push.paths` filters before a runner starts; `workflow_dispatch` on `main` recovers the current accepted source. A dispatch
on another ref skips the production job. Cloudflare native Builds/triggers/hooks must remain disabled for this Worker.
`Verify` stays credential-free on PRs and supplies the Node 22/24 compatibility witness; publication validates again
inside its own serialized job, so another workflow going green independently cannot authorize an unchecked upload.

The native filter lists site/public/Worker/shared source, the consumed Works bundle, project artwork, Yoru packed
sheets, build/check scripts, locked packages, toolchain/configuration, ordinary validation tests (including the studio
libraries they exercise) and the publication
workflow itself. `shared/contact-contract.ts`, for example, is consumed by both site and Worker and must trigger a
publication. Internal `docs/`, README, `AGENTS.md`, design canvases, brand masters and non-consumed authoring tools do
not trigger one; their exported consumer files do. Test/config changes that the mandatory check consumes do trigger.
Keep the list beside the workflow; do not replace it with an in-job diff that starts a runner for every docs edit.
GitHub's changed-file comparison has a finite path-list limit; an omitted relevant event can be recovered by dispatch.
This optional publication workflow must not become a required merge check whose path skip leaves a PR pending.

Production concurrency is `works-website-production`, with `cancel-in-progress: false`. Checkout resolves **current
`main` after the job acquires the slot**. The recorded SHA is what the job builds and puts in `BUILD_VERSION`, even if
the queued triggering event was older. GitHub may replace a pending job; the surviving job still resolves current main.
A later relevant change arriving during a build supplies the next publication. An unrelated docs push cannot cancel it.

Before checkout or install, the workflow checks presence flags for all required configuration. Missing names produce
a fixed error and stop the job before build/deployment; values are never printed. Ops must supply these **before
merging/activating the workflow**:

| Repository configuration | Kind | Consumer |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Actions variable | Deploy step only; presence flag at preflight |
| `CLOUDFLARE_API_TOKEN` | Actions secret | Deploy step only; presence flag at preflight |
| `WOLFSBLVT_LEGAL_OPERATOR_B64` | Actions secret | `npm run build:production` only; presence flag at preflight |

No `WEBSITE_TARGET` variable is needed: this site already has one Worker target. The workflow uses read-only
`GITHUB_TOKEN`, pinned checkout/setup-node, `npm ci` and the repository-local pinned Wrangler. Dependency install and
`npm run check` receive neither production secret. Production build output is discarded, including failure output,
because diagnostics could contain the private legal projection; ordinary fixture checks retain full diagnostics.
No production build/log artifact is uploaded to GitHub. The legal pages remain public at their admitted hosts,
excluded from source, indexing, sitemap and social output.

Ops creates a deployment credential limited to the existing Worker in its account: **Workers Editor** (the legacy
permission is Account / Workers Scripts / Edit). Existing bindings need no separate resource-data access. Account ID
is supplied explicitly, so account discovery is unnecessary. No DNS, Zone/Workers Routes write, Logpush/Pipelines/R2
administration, mail, Turnstile or token-management permission is selected by this upload. Ops must qualify the exact
provider-issued scope against this deploy route before activation; source cannot prove permission sufficiency.
See [Cloudflare's deployment/route permission distinction](https://developers.cloudflare.com/workers/authorization/workers/).

After validation, `build:production` enforces the real-operator and publication gates. The workflow stamps only the
resolved SHA into `build-version.txt`, then runs:

```sh
node_modules/.bin/wrangler deploy --config wrangler.jsonc --env production --keep-vars --var "BUILD_VERSION:$SOURCE_SHA"
node scripts/check-deployment.mjs "$SOURCE_SHA"
```

The declared production bindings and `logpush: true` remain source-owned and unchanged. `--keep-vars` retains extra
provider variables while the explicit SHA replaces `BUILD_VERSION`. Wrangler preserves existing secrets on deploy;
omitting routes/custom domains preserves their provider-owned connections. No credential or legal value becomes a CLI
argument. [Wrangler's command contract](https://developers.cloudflare.com/workers/wrangler/commands/workers/) describes
these flags; changes to bindings, routes or secret custody require their own current Work.

The readback uses one **120-second deadline for both hosts together**, including waits, requests and body reads.
Tonight's first automatic upload was observed serving its new marker about 75 seconds later, so an immediate stale
marker is readiness evidence rather than a failed deploy. Poll only a **200 response containing a different valid SHA**,
at five-second intervals within that shared deadline. A transport failure, non-200 status or malformed marker stops
immediately. Once a host's marker matches, check its HTML/HSTS once; the already-ready path still makes four GETs.
Each request is capped at ten seconds or the remaining overall budget, whichever is shorter. No redirects are followed,
no bodies or observed SHA values are printed, and failures report a fixed observation category. The script never
redeploys. This proves the observed asset revision and basic host response, not the
Worker's runtime variable, real mail delivery, legal correctness or every rendered journey. A readback failure after
upload is a **possibly successful deployment**: reconcile the provider version and hosts before retrying the effect.

### Activation evidence and recovery (Wolf Ops)

Juno owns credential installation, review/landing disposition and continuing provider qualification:

1. Confirm the token/account/legal projection and one-controller provider state, then accept and land the workflow.
2. Consume the first relevant-main run: record its resolved SHA, validation, upload receipt, actual provider
   `BUILD_VERSION`, unchanged bindings/secrets/domains/Logpush and the two-host asset/HTML readback.
3. Carry one ordinary docs-only update: no `Website` run/runner may start (ordinary Verify is a separate witness).
4. Carry a useful consumed shared-input update: `Website` must start and publish its then-current main SHA. If another
   relevant update is pending, its final surviving job must not roll production back to its older triggering SHA.
5. Read the meaningful site/contact/legal/375px journeys at the new revision, plus the native HTTPS/canonical redirects,
   without sending mail merely to prove an unchanged deployment. Run the full live legal verifier with protected error
   output contained. Keep the ordinary provider URLs disabled.

#### Activation record — 2026-10-25

Automatic relevant-main publication is operating. The first controller upload at `efb834a` succeeded, but its immediate
one-shot marker check failed before the new asset build was observed serving. The corrected readiness check landed as
**`a7eeefeadb169d34a2dfe0702efa9b0ab865d440`** through PR #19. Its consumed-input push started
[Website run 40148610731](https://github.com/Wolfsblvt/wolfsblvt.works/actions/runs/40148610731): preflight, exact-main
checkout, locked install, canonical check, production build, upload and public readback all completed successfully.
The log records that exact checked-out SHA, provider version `9ab6c314-e57a-4730-8e4c-c2d3f0677393`, and a passing
two-host/four-request asset readback. [Post-landing Verify](https://github.com/Wolfsblvt/wolfsblvt.works/actions/runs/40148610824)
also passed Node 22/24. The readiness tests additionally exercise delayed serving, the single deadline across hosts
and request time, immediate transport/status failure, and a failing witness with the SHA-match guard removed.

A separate credential-free read at **00:57:23 UTC** observed the exact asset marker on Works and Contact, both roots
as 200 HTML with HSTS, and Privacy/Impressum on both hosts as 200 with HTML-meta and header `noindex, nosnippet`.
No form submission or operator-value capture was needed. This records the automatic relevant-change and served-asset
result, not a fresh credentialed runtime/binding/logging readback or full legal certification. Juno retains that Ops
boundary. The next natural shared-input specimen is Contact PR #17 when accepted and landed; no extra source change
is manufactured for it. Pending-run freshness and actual rollback remain unobserved until their natural occasions.
This record changes only internal documentation, so its own main push is the separate native docs-only skip specimen;
the provider observation for that commit belongs to the owning Work Return.

For ordinary recovery, repair or revert the faulty consumed change on `main`; its relevant push publishes accepted
current source. Dispatch `Website` on `main` if an event was missed. Dispatch deliberately does not accept an arbitrary
historical SHA or turn a feature branch into a production source.

For urgent rollback, Ops first reconciles/coordinates active and pending publication so a queued current-main job cannot
immediately overwrite the recovery. Under its exact recovery grant, use the provider's prior version with local pinned
Wrangler (`wrangler rollback <version-id> --env production`), then read back deployment, runtime version and hosts. Revert
or repair `main` before resuming automatic publication. A rollback's older asset marker is expected; do not compare it
to the bad head. Preserve current secrets, connections, bindings and retained logging. Rollback practicality and actual
provider behavior remain live qualification, not a claim made by this source contribution.

**Content and copy** (refused by `npm run check:publish` until done):

- No Pile piece is `illustrative: true` and none links to an example address; no project window carries
  `data-placeholder`. Both marks mean unreplaced scaffolding only; a composed scene is content
  ([Decisions](DECISIONS.md#composed-scenes-are-content-only-unreplaced-scaffolding-is-a-placeholder)).
- The legal operator arrives as `WOLFSBLVT_LEGAL_OPERATOR_B64` (base64 of the canonical operator record, schema version
  1), with its contacts provisioned and its additional direct contact (the live form) `provisioned`. The public
  fixture and anything containing its values are refused.
- Every `legal.privacy` fact in `site.config.mjs` is confirmed against provider evidence and set `pending: false`.
  Publication distinguishes the current seven-day request-log window from the twelve-month private retention of
  structured `contact.submission` events in [Logging](LOGGING.md#retention-and-deletion).
- `wrangler.jsonc` carries the production Turnstile site key (it does, since 2026-10-23: the public key of the widget
  Wolf Ops created for `contact.wolfsblvt.works`).
- Every dependency resolves from the npm registry, never a local path or tarball.

**Confirmed by hand:**

- GitHub Sponsors is live at `https://github.com/sponsors/Wolfsblvt` (read back by Wolf Ops on 2026-10-22).
- Bluesky: `links.bluesky` in `site.config.mjs` is set when the profile exists. Until then the slot shows as visibly
  unavailable, which is fine to publish.

**The first admission (completed 2026-10-24, historical sequence in #916):**

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
- Workers Logs on (ordinary request-log retention up to 7 days), with source-owned `logpush: true`. The private
  retained route from [Logging](LOGGING.md) carries structured contact events for up to 12 months through the proved
  Logpush/Pipelines/R2 path and its 365-day lifecycle.
- After deployment: read back both hosts, the redirect from `wolfsblvt.works/contact/`, the headers on a static page and
  on the home page, a direct `#pile-<id>` link, a real contact submission end to end, and the privacy facts.

`npm run build:production` with the operator projection in the environment builds the site with the legal pages
required to be real, runs the output check, then the publication gate.

Routine releases use `Website` above. The first-admission steps are not repeated for every merge.

After every production deployment, and after any route, domain or zone change, run `npm run check:live-https` from
outside. It asks both hosts over plain HTTP (a page load, an empty `POST` and a path with a query) without following
redirects and expects each to be redirected to the same HTTPS address, then expects HTTPS to answer with HSTS. It sends
no form fields or credentials and keeps no response bodies. The Worker's own redirect is pinned by the Worker tests;
from outside the zone's redirect and the Worker's look the same.
