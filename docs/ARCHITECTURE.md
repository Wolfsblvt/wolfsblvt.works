# Architecture

## Meaning

The Wolfsblvt Works website is an Astro static build served by Cloudflare Workers Static Assets, with one small Worker
that runs first only where the edge has to act: the home page's per-browser pile seed and the contact page and its
submissions. Everything else, including the legal pages, the error page and every asset, is a plain file that keeps
working even if the Worker fails. This document records that shape, the two request paths that matter, the
boundaries between the static site, the Worker and the contact service, and the invariants that keep the site private
and honest. Exact field rules, event schemas and copy live in source and tests; the reasons behind the choices live in
[Decisions](DECISIONS.md).

The deployment configuration in `wrangler.jsonc` is complete but dormant: it names no account, routes or domains.
Adoption on Cloudflare is Wolf Ops work; see [Development](DEVELOPMENT.md#publication).

## Components

| Component | Responsibility | Talks to |
| --- | --- | --- |
| Astro site (`src/`) | Every page as static HTML: the home walk, Contact, Privacy and data, Impressum, 404, the 503 error page, `robots.txt` and the sitemap | Build-time only: `site.config.mjs`, the Pile collection, `@wolfsblvt/icons`, the marks in `design/marks/`, the legal-operator projection |
| Browser scripts (`src/scripts/`, `src/features/*/client/`) | The Walk, header lockup and nav, reveals and travel, Yoru, the Pile and Endless, the contact form | Only the page; the contact form also posts to its own origin and loads Turnstile |
| Build scripts (`scripts/`) | Fonts, identity assets, `_headers`, social cards, the output and publication checks | The build output in `artifacts/site/` |
| Site Worker (`worker/index.ts`) | Routes the few Worker-first paths, seeds the home pile, serves and prepares the contact page, sets security headers and CSP on what it serves | `ASSETS`, the contact service, `pile-seed.ts`, `shared/csp.ts` |
| Contact service (`worker/contact/`) | Admission, abuse controls, validation, Turnstile, mail delivery, the redacted log event | Cloudflare Email Service (`send_email`), rate limiters, Turnstile siteverify |
| Shared modules (`shared/`) | The contact field contract and product list; CSP construction and inline-script hashing | Used by the site, the Worker, the build scripts and the tests alike |

## Two request paths

### The home page

1. A browser asks `https://wolfsblvt.works/`. `/` is in `run_worker_first`, so the Worker runs.
2. The Worker fetches the static `index.html` from `ASSETS`. It computes a seed from the request's browser family and
   version and its primary `Accept-Language` (`worker/pile-seed.ts`), and writes it onto the Pile's `data-pile`
   element with `HTMLRewriter`. The seed is used for this response only; it is never stored, logged or sent anywhere.
3. It sets `Cache-Control: private, max-age=0, must-revalidate`, `Vary: User-Agent, Accept-Language`, the security
   headers, and a CSP whose `script-src` lists the SHA-256 hash of every inline script in that HTML.
4. In the browser, the Pile controller (`src/features/pile/client/controller.ts`) deals today's pile from the manifest
   the page carries: the Europe/Berlin date plus the seed. It takes one piece from each of five forms first, fills a
   footprint budget, puts today's pick on top and packs the pieces with a skyline packer
   (`client/selection.ts`). Without the Worker (for example `npm run dev`), there is no seed and everyone shares the
   day's pile.
5. "There's more. A lot more." scatters the pile and opens Endless in place, pushing a history entry. `#pile-<id>`
   links open Endless at that piece; an inline bootstrap script in the page head holds the address before first
   paint so a cold link doesn't flash the closed pile.

Without JavaScript the same page is complete: the pile renders as an ordinary list and Endless as a section.

### A contact message

1. A browser asks `https://contact.wolfsblvt.works/?product=diffdevil`. The Worker serves the static `contact/` page
   through `prepareContactPage`, which sets the Turnstile site key and a freshly signed `<issuedAt>.<hmac>` form
   token on the form and marks the response `no-store`. On `wolfsblvt.works`, `/contact/` redirects there permanently
   (outside production it answers on the same host so the journey runs locally).
2. The page script (`src/features/contact/contact-form.ts`) preselects the product from `?product=`, shows where the
   visitor came from with a link back, validates as the visitor types, and loads Turnstile only once the page is
   prepared.
3. The form posts `multipart/form-data` to the same origin. `handleContactSubmission` runs, in order:
   1. circuit breaker, canonical-host admission in production, exact `Origin`, content type, declared length and a
      streamed body ceiling, then form parsing;
   2. honeypot, and the signed form token with its minimum interaction time and maximum age;
   3. per-IP and per-Cloudflare-location rate limits;
   4. field validation against `shared/contact-contract.ts`: category, an optional registered product, an optional
      single-line name, a plausible email, a subject up to 120 characters, a plain-text message; control characters
      and header-injection material are refused;
   5. a per-recipient rate limit keyed by a hash of the email;
   6. Turnstile siteverify with the request IP, expected action and, in production, the expected hostname;
   7. the internal notification through `CONTACT_INTERNAL` (fixed destination, the visitor as `Reply-To`);
   8. the visitor's copy through `CONTACT_VISITOR_COPY` (fixed Works sender, fixed subject with the reference).
4. Every exit writes exactly one `contact.submission` event and returns one JSON body with a truthful outcome: `sent`,
   `sent-copy-failed` or `failed`, or an `invalid`, `rejected`, `rate-limited` or `disabled` refusal. The page shows the
   service's exact wording; no browser claim outruns what the service observed.

## The contact service

The service was built in the `wolfsblvt.com` repository and moved here unchanged, with its tests, when Contact became
part of Works (see [Decisions](DECISIONS.md#one-works-contact-page-hosted-with-this-site)). It does not know what the
contact page looks like. Any page that renders one `form[data-contact-form]` with the contract's fields can host it;
the Worker connects the two.

All provider dependencies are injected through `services.ts`, built from the bindings in `ContactEnv`:

| Binding | Kind | Purpose |
| --- | --- | --- |
| `CONTACT_INTERNAL` | `send_email`, fixed `destination_address` | the internal notification |
| `CONTACT_VISITOR_COPY` | `send_email`, `allowed_sender_addresses` | the visitor's copy from the Works address |
| `RATE_IP`, `RATE_RECIPIENT`, `RATE_LOCATION` | `ratelimits` | generous location-local limits |
| `TURNSTILE_SECRET_KEY`, `CONTACT_FORM_SECRET` | secrets | siteverify, and signing the form token |
| `TURNSTILE_SITE_KEY`, `CONTACT_INBOX`, `CONTACT_SENDING_ENABLED`, `ENVIRONMENT_NAME`, `BUILD_VERSION` | vars | configuration |

Each limiter answers `allowed`, `limited` or `unavailable`; an unavailable limiter holds sending rather than letting it
through. Production refuses to send unless the canonical contact host, non-test Turnstile keys, the form secret and the
Works inbox are all configured. Any environment other than `production` and `test` never sends.

The products a visitor can pick are listed once, in `shared/contact-contract.ts`, in the order the picker shows them.
`src/features/contact/products.ts` adds what the page needs to present them: a type, an icon from `@wolfsblvt/icons`,
and the home a visitor arriving from that product can return to.

## Data and storage

Nothing is persisted. There is no database, no message store, no cookie set by this site and nothing written to browser
storage. A contact message exists only as two emails. The contact service's log event and Cloudflare's own request logs
are the only records; [Logging](LOGGING.md) describes them.

Build-time data comes from the repository: `site.config.mjs` (identity, links, legal facts), the Pile collection in
`src/content/pile/`, the marks in `design/marks/`, and Yoru's frames in `design/the-walk/assets/`. The legal operator's
name and address reach the build only as the private `WOLFSBLVT_LEGAL_OPERATOR_B64` projection; the public source
carries an obvious fixture in `src/data/legal-operator.example.json`.

## Boundaries and integrations

- **Static versus Worker.** Only `/`, `/contact` and `/contact/` run the Worker first (`run_worker_first`). Everything
  else is served from the asset store; `not_found_handling: "404-page"` serves `404.html` for unknown paths. The
  Worker never sits in front of the legal pages or the assets.
- **Headers.** Static responses get their headers from `artifacts/site/_headers`, written by
  `scripts/write-headers.mjs`: security headers, one site-wide CSP pinning every inline script the static pages ship by
  hash, `X-Robots-Tag: noindex, nosnippet` on the legal pages, and long caching for fingerprinted assets. The Worker
  sets its own CSP on the home and contact pages, hashing the actual HTML it serves; only the contact page allows the
  Turnstile origin.
- **Hosts.** `wolfsblvt.works` serves the site; `contact.wolfsblvt.works` serves the contact page at `/` and shares the
  same assets. Canonical URLs point each page at its own host.
- **The 503.** `503.html` is self-contained (inline CSS, system fonts, no scripts, absolute links) so Cloudflare can
  show it as a custom error page while the site itself is down.
- **Third parties.** Cloudflare (hosting, Email Service, rate limiting, Turnstile). Turnstile's script loads on the
  contact page only. Nothing else is fetched from another origin.
- **Icons.** `@wolfsblvt/icons` resolves Lucide glyphs, brand marks and Works product glyphs at build time into
  inline SVG (`src/components/Icon.astro`). No icon fonts and no icon CDN.

## Invariants

- No visitor content in logs: the `contact.submission` event can't carry the visitor's name, email, subject, message
  or Turnstile token. `log.ts` refuses those keys structurally and the tests pin it.
- Mail headers never take visitor input except as `Reply-To` on the internal notification; `From`, the envelope and
  every other header are fixed.
- The visitor's copy is sent unconditionally after the internal notification succeeds, and the page reports exactly
  which of the two happened.
- Nothing on the device is read or written for the Pile or anything else. The per-browser variety comes from request
  headers on the server, used once.
- Operator data appears only on `/impressum/` and `/privacy/`, never in metadata, the sitemap, other pages or logs.
  `scripts/check-output.mjs` checks it on every build.
- Legal pages stay crawlable but `noindex, nosnippet`, out of the sitemap and without a social card.
- Every inline script on a page is pinned by hash in that page's CSP; adding one without rebuilding the headers breaks
  it visibly rather than silently allowing inline code.
- Every animation has a finished state under `prefers-reduced-motion`, and every page is complete without JavaScript.

## Known compromises

- The CSP allows `'unsafe-inline'` styles. The marks, the Walk and the Pile set inline styles and positions; hashing
  every style attribute would cost more than the risk it removes on a site with no user-generated markup.
- Cloudflare's rate limiter is location-local and eventually consistent. The Email Service account quota and the
  `CONTACT_SENDING_ENABLED` circuit breaker are the hard ceilings; no exact global counter is claimed.
- The home page varies by browser and language, so it is cached privately rather than at the edge.
