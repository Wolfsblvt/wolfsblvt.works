# Exploring Works

## Meaning

[Wolfsblvt Works](https://wolfsblvt.works/) is the home of Wolf's software, experiments, and ideas: what he's making,
what drew him in, and what might be worth following next. This guide explains the places you can visit and how to
use them. The [Vision](VISION.md) keeps the site's wider destination; the [documentation map](README.md) leads to its
design and implementation.

“Oddly useful ~~software.~~ things. also games. also questions.” is the invitation. Some things begin with a practical
need; others begin with a question that won't leave. You can follow the whole page or jump to whatever interests you.

## One long Walk

The home page is one continuous walk. The header's short labels are its landmarks:

| Landmark | Takes you to |
| --- | --- |
| [Hi](https://wolfsblvt.works/#hi) | Wolf's invitation and Yoru's perch |
| [What](https://wolfsblvt.works/#what) | The first project window; more projects appear along the Walk |
| [Why](https://wolfsblvt.works/#why) | What matters in the work and why it gets made |
| [Who](https://wolfsblvt.works/#who) | The people making things together |
| [Help](https://wolfsblvt.works/#help) | What support sustains, with GitHub Sponsors and Ko-fi links |
| [Whoa](https://wolfsblvt.works/#whoa) | The Pile |
| [Hello?](https://wolfsblvt.works/#hello) | The invitation to write, with a link to the shared contact page |

Works frames the journey. Inside a project window, that project speaks in its own colours, type and words. The site
includes projects at different stages, so follow each window's standing and offered links when deciding what to try.

| Project window | What you'll find |
| --- | --- |
| [diffdevil](https://wolfsblvt.works/#diffdevil) | What changed in a pull request, and how those facts inform labels, checks and workflows. Links lead to the product site and Chrome extension. |
| [Borrowed Coast](https://wolfsblvt.works/#borrowed-coast) | A slow strategy game about nations that can unmoor, in development. Switch between Chart, Watch and Nations for different views. |
| [smolpng](https://wolfsblvt.works/#smolpng) | Smaller images with little fuss. Work in progress; its source is linked and its own website is still coming. |
| [Karaokebarr](https://wolfsblvt.works/#karaokebarr) | Self-hosted karaoke automation, in development. Open “See how a song gets ready” to follow the preparation journey. |
| [Lunescence](https://wolfsblvt.works/#lunescence) | An early concept for giving a companion, assistant or character a body, voice and way of expressing themselves, then shaping that presence together. |

## The Pile

The [Pile](https://wolfsblvt.works/#whoa) collects smaller projects, ideas, notes, artifacts and links. Its pieces have
different shapes because they carry different things: a sentence, a ticket, a small scene, a door to a repository.

The daily desk deals a selection for the date, with a little variation from the browser and language already present
in the page request. That mix is used without storing it. Nothing about which pieces you look at leaves the page.
The [privacy explanation](https://wolfsblvt.works/privacy/#storage) describes the distinction.

Open **“There's more. A lot more.”** to spread the full collection into Endless, in the same page. Open an individual
piece to see its longer material or interaction. Its address uses `#pile-<id>` so you can bookmark or share it;
`#whoa` is the entrance to the collection. A piece is something to encounter, not a promise that it will become a
product. To add one, use the [Pile authoring guide](pile/pile-authoring-guide.md).

## Yoru, the resident

Yoru lives in the site. He keeps you company along the Walk, has places to perch and nap, and reacts when poked.
He is part of the place's character; the content remains usable without motion or JavaScript. The site is dark only,
with its glow and handwriting designed for that canvas.

The README greeting uses the maintained [Yoru artwork](../design/yoru/README.md) and a static reduced-motion alternative.
[README media](assets/readme/README.md) records the source and reproduction procedure. Yoru's artwork remains
[reserved](../LICENSES/README.md#reserved-the-marks-yoru-and-other-artwork).

## One contact page

[contact.wolfsblvt.works](https://contact.wolfsblvt.works/) is the shared form for Wolf and every Wolfsblvt project.
An idea, question, connection or hello is welcome; you don't need to arrive as a customer or collaborator.

A product can link with its registered slug, for example
[`https://contact.wolfsblvt.works/?product=diffdevil`](https://contact.wolfsblvt.works/?product=diffdevil).
That selects the project and shows a route back. The [development guide](DEVELOPMENT.md#add-a-product-to-the-contact-picker)
explains how another project joins the picker.

A successful submission sends one email to Wolf's inbox and a copy to the sender. There is no submission database;
the message exists in those emails. Technical contact events omit the name, email address, subject and message.
The [privacy page](https://wolfsblvt.works/privacy/#contact) explains processing and retention, and
[Logging](LOGGING.md) describes the technical record.

## Privacy while visiting

No analytics or cross-site tracking. Works stores no browser state except the Yoru memory you choose with “remember me”
in his nook on the main site. That memory stays only in this browser and is removable. Contact does not store it.
The hosting security layer may use the short-lived necessary cookie disclosed on Privacy. The main-site record holds
familiarity, brief wariness, his favourite resting place, scenes visited together and the calendar day of the last Home
visit. Only Home updates it; Privacy, Impressum and 404 may read it. Choose “Forget me” in his nook or on Privacy to
remove it; otherwise it stays until you clear site data or the browser removes it. Fonts are
self-hosted. The contact form's Cloudflare Turnstile check is the only third-party script; hosting and security
services still handle the requests needed to deliver and protect the site. The
[privacy page](https://wolfsblvt.works/privacy/) explains those services and their current handling.

## Running your own local preview

The repository contains the Astro site and its Cloudflare Worker. With Git, Node.js 22.23.4 or later (24 recommended)
and npm, clone the repository, install its dependencies and start the static preview:

```sh
git clone https://github.com/Wolfsblvt/wolfsblvt.works.git
cd wolfsblvt.works
npm install
npm run dev
```

At <http://localhost:4321> you should see the Walk, project windows and Pile. Legal details are public fixtures in a
local build. Use the [development guide](DEVELOPMENT.md#bootstrap) for the Worker-backed preview and contact flow;
local contact sending is disabled. `npm run check` is the full verification command.

The [licence map](../LICENSES/README.md) covers reuse: code is AGPL-3.0-only, original prose is CC BY 4.0, and the Works
marks, Yoru and other artwork remain reserved.
