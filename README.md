<h1 id="wolfsblvt-works">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="design/marks/return/02-marks-and-sponsor-assets/svg/lockup/works-lockup-light.svg">
    <img src="design/marks/return/02-marks-and-sponsor-assets/svg/lockup/works-lockup-dark.svg" alt="Wolfsblvt Works" height="48">
  </picture>
</h1>

[![Verify](https://github.com/Wolfsblvt/wolfsblvt.works/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/Wolfsblvt/wolfsblvt.works/actions/workflows/verify.yml)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Analytics](https://img.shields.io/badge/analytics-none-73cae3)

**Oddly useful ~~software.~~ things. also games. also questions.**

The home of Wolf's software, experiments, and ideas: what he's making, what drew him in, and what might be worth
following next. This repository is the whole website for **wolfsblvt.works**: one long page you
walk through, past the projects, the reasons behind them and the people making them, down to a pile of everything else
and an open invitation to write. It also hosts the contact form that every Wolfsblvt site links to.

The site is built and not yet published at its address. Its project windows and most Pile pieces are still clearly
marked placeholders, and a publication check refuses a public build until they, the legal operator data and the
hosting facts are real.

**[Run it locally](#run-it-locally)** · [How it's built](docs/ARCHITECTURE.md) ·
[Why it looks like this](docs/DECISIONS.md) · [Where it's going](docs/VISION.md)

<img src="docs/assets/readme/walk-hero.webp" alt="The top of the Wolfsblvt Works home page: the large serif line “Oddly useful software.” with “software.” struck through in rose and “things. also games. also questions.” handwritten beside it, Yoru the resident sitting on the right, and orange and magenta lines framing the page." width="100%">

## What's on the walk

- **Projects in their own windows.** Works narrates between them; inside a window the project speaks in its own type,
  colour and words. diffdevil's window is already in its real theme.
- **The Pile.** A desk of ideas, smaller projects, notes and artifacts, dealt fresh every day and the same for everyone
  on that day, with a little variation per browser that is computed at the edge and never stored. "There's more. A lot
  more." opens Endless, the whole collection, in place.
- **Yoru.** The resident. He follows along, dozes, runs off when you poke him and naps on the footer.
- **Support and contact.** A real sponsorship section, and a contact page for whatever is on your mind.

The [Vision](docs/VISION.md) has the whole destination and the character the site has to keep.

## Contact, for every Wolfsblvt site

The contact page at `contact.wolfsblvt.works` is the one form for Wolf and every Wolfsblvt product. A product links to
it with `?product=<slug>` to preselect itself; the page then shows where the visitor came from and leads them back. A
message becomes one email to the Works inbox and one copy to the sender. Nothing is stored, and the logs never contain
the sender's name, address, subject or message. [Logging](docs/LOGGING.md) and the
[architecture](docs/ARCHITECTURE.md#the-contact-service) have the details.

## Private by construction

No analytics, no tracking, no cookies of our own, nothing in browser storage, no third-party scripts except
Cloudflare Turnstile on the contact page. Fonts are self-hosted. The site is dark only, on purpose.

## Run it locally

You need Node.js 22.12 or later (24 recommended) and npm.

```sh
npm install
npm run dev
```

Open <http://localhost:4321>. That is the static site with fixture legal data. To run it the way production serves it,
with the edge Worker, the daily pile seed and a working contact page that never sends mail:

```sh
cp .dev.vars.example .dev.vars
npm run dev:worker
```

Then open <http://localhost:8787> and the contact page at <http://localhost:8787/contact/>. `npm run check` is the full
verification. The [development guide](docs/DEVELOPMENT.md) covers tests, the browser QA suite, the publication build
and everything else.

## Documentation

| Read | For |
| --- | --- |
| [Vision](docs/VISION.md) | What the site is for and where it is going |
| [Decisions](docs/DECISIONS.md) | Why it looks and behaves the way it does |
| [Architecture](docs/ARCHITECTURE.md) | The static build, the Worker, the Pile and the contact service |
| [Development](docs/DEVELOPMENT.md) | Commands, tests, generated files and the publication checklist |
| [Project map](docs/PROJECT-MAP.md) | What lives where |
| [Writing Pile pieces](docs/pile/pile-authoring-guide.md) | Adding to the Pile |
| [Security](SECURITY.md) | Reporting a vulnerability privately |

## License

The website's code is licensed under [AGPL-3.0-only](LICENSE.md), so anyone running a modified version for others must
share its source; the prose is CC BY 4.0, while the Works marks, Yoru and other artwork stay reserved.
