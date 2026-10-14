# Wolfsblvt Works website: repository instructions

## Meaning

Repository-local rules and commands for anyone, human or coding agent, changing the Wolfsblvt Works website. It names
the sources to read first, the commands, the durable branch, and the boundaries that protect visitors' privacy and
Wolf's private data. It carries only what is specific to this repository.

## Start with the relevant source

Read [docs/VISION.md](docs/VISION.md) for what the site is for and [docs/DECISIONS.md](docs/DECISIONS.md) before
changing how anything looks or behaves: most of the design is deliberate in ways the code can't explain. The design
canvas in `design/the-walk/project/` and the marks in `design/marks/` are the design sources; a change that departs from
them is a decision to record, not a cleanup. [docs/PROJECT-MAP.md](docs/PROJECT-MAP.md) says where things live.

The Works voice and site expression are owned by the Wolfsblvt Works foundation, not by this repository. Where Works
speaks, follow it; inside a project's window, the project's own voice and facts win. Wolf decides copy.

## Commands

```sh
npm install                 # Node 22.12+ (24 recommended)
npm run dev                 # static site, http://localhost:4321
npm run dev:worker          # built site behind the Worker, http://localhost:8787 (needs .dev.vars from .dev.vars.example)
npm run check               # the canonical verification: types, unit and workerd tests, build, output check
npm run qa                  # browser suite (Playwright, Chromium)
npm run check:publish       # what still blocks publication
```

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) has every command, the generated files and the publication checklist.

## Durable branch

```text
main:
  maintainer integration: direct allowed
  external contributions: PR required
  required pre-integration evidence: none
  required approval/review: none
  resolved conversations: no
  automatic CI: Verify on main push and pull request
  automatic retained branch effects: none
  other pre-update evidence: npm run check green locally
```

The site is unpublished and founder-controlled. This moves to `PR preferred` once the site is public and people rely
on it.

## Boundaries

- **Operator data.** The legal operator's name and address reach the build only as `WOLFSBLVT_LEGAL_OPERATOR_B64`.
  Never commit them, print them, put them in metadata, feeds, logs or any page other than `/impressum/` and
  `/privacy/`. The fixture in `src/data/legal-operator.example.json` stays obviously fake.
- **Visitor content.** The contact service never logs or stores a visitor's name, email, subject or message. Keep the
  `contact.submission` event redacted ([docs/LOGGING.md](docs/LOGGING.md)) and the tests that pin it.
- **No tracking, no device access.** No analytics, no third-party scripts beyond Turnstile on the contact page, nothing
  in cookies or browser storage. The Pile's variety comes from the date and request headers on the server only.
- **Icons.** Every icon comes from `@wolfsblvt/icons`. Add missing glyphs to the wolfsblvt-icons repository; never add a
  local SVG icon here.
- **Secrets.** `.dev.vars` is local and ignored. Real secrets are set by Wolf Ops with `wrangler secret put`.
- **Deployment.** `wrangler.jsonc` is deliberately dormant (no account, routes or domains). Deploying, adding routes,
  changing DNS or Cloudflare settings is Wolf Ops work, not part of changes here.
- **Placeholders.** Illustrative Pile pieces, fixture values and `data-placeholder` windows must stay visibly marked.
  `npm run check:publish` refuses a public build while any remain; don't silence it.
- **Generated files.** `artifacts/`, `public/fonts/`, the favicons, Yoru's sheets and `src/generated/` are build output.
  The social cards in `public/social/` are committed; re-render them with `npm run cards`.

## Changing the contact service

The service in `worker/contact/` and `shared/` was moved from `wolfsblvt.com` with its tests. Behaviour changes keep
its guarantees: one internal notification with the visitor as `Reply-To`, an unconditional visitor copy after it,
three truthful sent outcomes, fixed senders and headers, no stored state. Update [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
and [docs/LOGGING.md](docs/LOGGING.md) with any change to the pipeline or the event.

## Documentation

Update the document whose truth changed in the same change: Decisions for a settled choice, Architecture for a
boundary or invariant, Development for a command, Logging for an event or retention. The Privacy and data page must
stay true to what the site actually does.
