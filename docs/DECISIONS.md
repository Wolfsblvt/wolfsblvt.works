# Decisions

## Meaning

The durable choices behind the Wolfsblvt Works website, and why they were made. The site was co-designed in rounds on a
design canvas before any production code existed, so much of its shape is deliberate in ways the code alone can't
explain: why the navigation reads like a person talking, why the background frames the content instead of filling it,
why the Pile behaves the way it does, what was tried and dropped. This record keeps those reasons so a later change is a
choice, not an accident. It owns the site's product, design and technical decisions. Wolfsblvt Works' wider identity
and voice live with the Works foundation, and each project's own voice lives with that project.

Entries are grouped by subject. The design source referred to below is the canvas in `design/the-walk/` and the marks in
`design/marks/`.

## The site

### One long walk, not a set of pages

**Date:** 2026-10-14 · **Status:** Current

The site is a single long page you walk through, top to bottom. Separate pages exist only where something functional
needs its own address: Contact, Privacy and data, Impressum, and the error pages.

**Why.** Works is a place to encounter what Wolf makes and why, at his pace. A walk keeps the projects, the reasons and
the people in one continuous story; a page tree turns the same material into a brochure with a menu.

**Rejected.** A conventional multi-page site with a large top menu; a separate About page; an FAQ in the header. Each
splits the walk into destinations and reads like a company site.

**Reopen if.** A section grows into something people need to link to and read on its own, with enough substance to
earn a page.

### Personal navigation: Hi, What, Why, Who, Help, Whoa, Hello?

**Date:** 2026-10-14 · **Status:** Current

The header names the sections as a person would: Hi, What, Why, Who, Help, Whoa, Hello?. Hovering or focusing a word
draws `...`, then writes its plain name underneath in Wolf's handwriting; it lingers, then wipes away. `Hello?` is
permanently crossed out with **Contact** handwritten below it, slightly offset and tilted. A pencil-drawn signpost sits
in front, a wavy progress path fills along the header's bottom edge, and the current section gets a small cyan dot.

**Why.** Contact must be findable without hovering, and the other words stay playful without becoming riddles. The
crossed-out correction is the same gesture as the hero's strike-through, so the site teaches its own handwriting once.

**Rejected.** Custom tooltips and native `title` tooltips (they hide the personality and don't work on touch);
crossing out every label (Contact's correction would lose its meaning); plain section names (correct and lifeless).

### The Walk frames the content

**Date:** 2026-10-14 · **Status:** Current

Two frayed lines, orange on the left and magenta on the right, run down the page alongside the content frame. They
share one gentle meander, so they never drift into parallel rails, while the gap between them breathes. Colour fills
softly from each line outwards to the edge of the viewport, with an edge that doesn't follow the line exactly. The
lines are sized from the content and scroll with it: you walk along a path, you don't scroll past a backdrop.

**Why.** The background is the site's idea made visible: a path through the work. Binding it to the content keeps it a
frame, not wallpaper, and stops it from ever growing the page.

**Rejected.** A viewport-fixed background; perfectly parallel lines; lines that ignore the content width; a straight
left edge. On phones a narrower, gentler meander replaces the desktop one rather than a scaled copy.

### Dark only

**Date:** 2026-10-14 · **Status:** Current

The site is dark-only. Every page declares `color-scheme: dark` and `<meta name="darkreader-lock">`, so browsers render
native controls dark and extensions such as Dark Reader leave the page alone.

**Why.** The palette, the glow of the Walk and the handwriting are designed on a dark canvas. A light theme would be a
second design, not a variant. Dark Reader treated an earlier build as a light page and inverted it, which broke the
glow and the marks.

**Rejected.** A light theme or a theme toggle in the header; relying on detection heuristics in extensions.

**Reopen if.** Real readers need a light variant for accessibility rather than taste.

### Palette and type

**Date:** 2026-10-14 · **Status:** Current

The palette is Smoke & Fireworks: canvas `#100b11` → `#181018` → `#0c1217`, text `#f3e8dc`, soft text `#d1c0b8`,
orange `#eca557`, rose `#ef8ea1`, magenta `#db61aa`, cyan `#73cae3`. Rose is Wolf's handwriting and corrections; cyan is
focus and "you are here". Literata carries the reading voice, Albert Sans the interface, Shantell Sans Wolf's
handwriting. IBM Plex appears only inside the diffdevil window and Special Elite only on typed pile notes. Abril Fatface
exists only inside the outlined marks and never ships as a web font.

**Why.** One warm, readable serif for the walk; one neutral sans for controls; one honest handwriting for the person.
Everything else belongs to the project it sits in.

**Rejected.** A red accent for the current-section dot and underlines (it fought the palette).

### Handwriting is Wolf's voice, used sparingly

**Date:** 2026-10-14 · **Status:** Current

Shantell Sans in rose is reserved for Wolf's own remarks: a correction, an aside, an admission, a joke. The Works
narration stays in the reading serif. Scribbles write themselves in when they come into view; the hero's correction
draws its strike first, then writes the replacement.

**Why.** A handwritten note only feels personal if it is rare and clearly someone's. Filling every margin with quips
would turn the voice into decoration.

### Motion explains, then gets out of the way

**Date:** 2026-10-14 · **Status:** Current

Animations play when their content is properly in view, not at the first pixel. Larger demonstrations wait for most of
themselves to be visible. Things that run once stay finished. Every animation has a finished state under
`prefers-reduced-motion`, and nothing important appears only through motion; the hero's invitation line is simply
there from the start.

**Why.** Motion should show change or carry character. If it starts before you can see it, it's wasted; if it loops or
blocks reading, it gets in the way.

**Rejected.** Reveal-on-first-pixel; animating the hero's main sentence in; looping ambient motion beyond the Pile's
slow breathing and Yoru.

### Yoru lives here

**Date:** 2026-10-14 · **Status:** Current

Yoru, the resident, sits on the hero with a handwritten "that's Yoru. he lives here." Once the hero scrolls away he
follows along at the edge, dozes, runs off when clicked and comes back, and naps on the footer. He also appears on the
404 ("Yoru gets lost here too"), on the 503 (asleep, "looking into it"), on the legal pages (asleep), and on Contact,
where he runs off with a sent message.

**Why.** He's the site's small living thing: something you carry along on a walk. He makes the functional pages feel
like the same place.

**Rejected.** Yoru inside the marks or the sponsor banner; the marks stay his own and so does he.

## The header and the marks

### Finished assets, editable design, and production markup are separate

**Date:** 2026-10-15 · **Status:** Current

Approved reusable marks and their SVG/PNG/animation variants belong to `assets/brand/`, exposed through `assets/README.md`. The approved geometry, generator, canvas rounds and sponsor *demonstrations* live under `design/marks/`, without the internal contribution number in their paths. Live sponsorship HTML and CSS are owned by `src/components/WorksSponsor.astro` and `src/styles/sponsor.css`; the website no longer parses design-demo HTML to render Help.

**Why.** The original site read header marks, favicons, social cards and sponsorship markup directly from a numbered design handoff. That made an internal delivery format a lasting implementation API and hid the downloadable exports from the very people meant to reuse them. Preserve Tala and Wolf's selected artwork and rationale, not the delivery wrapper.

**Theme handling.** The standalone responsive SVG exports contain both selected light and dark drawings and switch through `prefers-color-scheme`. Static `-light` and `-dark` exports remain for reliable GitHub `<picture>` usage and image processors. Their suffix describes the background each drawing fits. This does not change the Works website's dark-only design.


### The lockup eases from full to compact as you scroll

**Date:** 2026-10-14 · **Status:** Current

At the top of a page the header shows the full Works lockup, larger than the header (60px tall, hanging over its bottom
border). As you scroll it eases into the compact 32px drawing, on the same curve as the header's background and blur.
The two drawings share the name, so the ease interpolates the corners, the position and size of WORKS and the pen
weight. It does not crossfade two images. On the home page the mark's own motion plays on every load: the corners
draw, then the name lights up while WORKS is written. On every other page the mark is already drawn.

**Why.** The full lockup is the identity; the compact one is what fits a working header. Morphing between them keeps
one mark instead of two. Playing the motion only on the home page avoids repeating it on every navigation, and
playing it on every home load needs no storage.

**Rejected.** The 32px lockup at the top (too small for a first impression); crossfading the two drawings; playing the
motion once per visit (that would need browser storage and a line in Privacy and data).

### The signpost is a sketched, pencil-drawn glyph

**Date:** 2026-10-14 · **Status:** Current

The header's signpost is our own icon: three boards (right, left, small right) on one post, drawn on the Lucide grid
with 2px round strokes, with edges that run a little past their corners like a quick pencil sketch. The two upper boards
are narrower than the third and offset from each other, so each one reads on its own. It belongs in `@wolfsblvt/icons`
as a Works-authored glyph.

**Why.** The nav is personal; a stock signpost icon would be the one generic thing in it. The overshoot carries the
hand-drawn feel within the icon standard's geometry rules (no filters, no transforms).

**Rejected.** A tidy three-board version, a leaning version with open boards, and a two-board version standing in a
small Walk path. All were drawn and compared; the sketched one was the most hand-made, and narrowing the upper boards
fixed its legibility.

### Identity assets

**Date:** 2026-10-14 · **Status:** Current

- **Favicon:** the transparent icon that switches between its dark and light colours with the browser theme. Static, not
  animated.
- **App icons** (the 180px Apple touch icon and a 192px icon): the icon on a dark tile with the Walk's orange and
  magenta glowing in from the corners. There is no web app manifest and no maskable icon: the site isn't an installable
  app, and a manifest would only invite "install" prompts for a walk.
- **Social cards:** the home page uses the hero as a card (the sentence with its correction, a small lockup, Yoru).
  Every other page uses the lockup between the Walk lines with its own line of text. Legal pages have no card.
- **Theme colour:** the canvas, `#100b11`.

**Why.** The favicon is the mark as designed; a very light browser tab makes its dot thin, which is acceptable. The
glow tile makes the app icon unmistakably this site without changing the mark. The hero is the site's own first
impression.

**Rejected.** A favicon on a solid tile; a plain canvas tile and a light paper tile for app icons; a "corner of the
pile" social card (too busy at thumbnail size); an animated favicon. Browsers that don't animate SVG favicons, Chrome
among them, would show its first frame, which is empty corners, and a moving tab is a distraction.

**Reopen if.** Browsers animate SVG favicons consistently and the first frame can be the finished mark.

## The Pile

### A deterministic daily pile that opens into Endless

**Date:** 2026-10-14 · **Status:** Current

Each day has its own pile, keyed to the date in Europe/Berlin. The selection first takes one piece from each of five
different forms, then fills a footprint budget, and a "today's pick" goes on top. Pieces are placed with a skyline
packer and settle with a small, uneven drop. "There's more. A lot more." scatters the pile downwards and opens Endless,
the full continuation, in place; the page gets longer rather than navigating away. Every piece has a `#pile-<id>`
address, and "Back to the pile" and "Gather the pile" return you.

**Why.** The pile should feel accumulated and alive without being random noise: the same day shows the same pile, so
it can be shared and talked about. Endless belongs to the same walk, not to a separate archive page.

**Rejected.** A random pile per page load; a separate spotlight or "featured" block above the pile (today's pick inside
the pile replaced it); a grid of identical cards; a separate archive page.

### The pile varies a little per browser, and nothing is stored

**Date:** 2026-10-14 · **Status:** Current

Alongside the date, the shuffle mixes in a hash of what every request already carries: the browser's name and version
and its preferred language. In production the edge Worker computes that from the request headers and uses it once to
deal the pile. It is not stored, logged or sent anywhere. People with the same browser and language see the same pile.
The Privacy and data page says this in one paragraph.

**Why.** A little individuality makes the pile feel like it was dealt for you, but not at the cost of tracking or a
consent banner. Request headers are already sent and processed to deliver the page; reading them on the server adds no
storage and touches nothing on the device.

**Rejected.** A random seed saved in the browser on the first visit (storing it isn't strictly necessary, so it would
need consent); saving a seed only when the visitor asks for their own pile (it worked, but it was a feature nobody would
miss, carrying a storage disclosure); hashing the IP address (personal data, which would extend the privacy page);
reading screen or device values in the browser (that is access to the device and needs consent).

**Reopen if.** The pile ever needs genuinely per-person behaviour that someone explicitly asks for.

### The current pile pieces and project windows are placeholders

**Date:** 2026-10-14 · **Status:** Current

The site is built first, with clearly marked illustrative pile pieces and project windows. The real pieces and each
project's own branding and voice are authored afterwards, inside the site's content, as ordinary additions.

**Why.** The shell, the pile mechanics and the content model need to exist before real content can be authored against
them, and a project's window has to speak in that project's own voice, which is its own piece of work. Only the
diffdevil window is already in its real voice and theme.

**Rejected.** Authoring all real content on the design canvas before the build; launching publicly with placeholder
pieces visible.

**Consequence.** Placeholders are marked in source (`illustrative: true` on Pile pieces, `data-placeholder` on project
windows, `pending` on privacy facts, the operator fixture) and visibly on the page. `npm run check:publish` refuses a
public build while any remain, so "launching with placeholders" can't happen by accident.

### Pile pieces are a content collection with a fixed Endless order

**Date:** 2026-10-14 · **Status:** Current

Each piece is a Markdown file in `src/content/pile/` with a typed schema: its form (thought, note, chip, artifact,
lineage, door, specimen, site), whether it can be dealt onto the daily desk, an optional subline, scribble, standing
and links, and the illustrative flag. `ENDLESS_ORDER` lists every piece exactly once in Endless order, and the build
refuses a piece that is missing from it or listed twice. A piece that needs its own small interaction carries a module
loaded only when it opens.

**Why.** Adding a piece should be writing one file, not touching layout code. A curated order keeps Endless a
composed sequence rather than a sort by date, and moving a line never changes a piece's address.

### Endless opens in place: the pile scatters downwards and the page grows

**Date:** 2026-10-14 · **Status:** Current

Opening Endless animates each piece of the pile downwards from where it lies while the page's real height grows
beneath it, then reveals Endless. Gathering reverses it. The animation runs on the pieces themselves.

**Why.** It is the behaviour of the selected Main canvas, and moving the real elements keeps focus, selection and
links intact.

**Rejected.** The fixed, viewport-clipped flight layer described in `docs/pile/pile-technical-plan.md`, which moves the
preview nodes into an overlay for the motion. The in-place version looked the same on the canvas with less machinery.

**Reopen if.** The in-place scatter shows real problems the overlay would solve, such as clipping or layout jumps in a
browser.

## Sections

### Each project speaks in its own window

**Date:** 2026-10-14 · **Status:** Current

Works narrates between the projects; inside a project's window the project speaks for itself in its own type, colour
and words. diffdevil's window uses its exact theme, with its own borders, and an illustrative terminal.

**Why.** Works is the guide on the walk, not a wrapper that turns every product into the same card.

**Rejected.** One uniform Works card style for every project.

### Support is the shared Works sponsor section

**Date:** 2026-10-14 · **Status:** Current

The Help section is the shared sponsor component from the marks: "Support the work." with the lit-edge WOLFSBLVT
letters, the two corners drawn on the panel's border, WORKS written over the magenta corner, and links to GitHub Sponsors
and Ko-fi. It plays its motion once, when it first comes properly into view.

**Why.** The same invitation appears on every product that opts in; on Works it should be the original, not a second
design next to it.

**Rejected.** Keeping the earlier support block alongside or instead of it.

### Contact is an open invitation

**Date:** 2026-10-14 · **Status:** Current

The closing section and the contact page invite people to write about whatever is on their mind: "Arriving with a
thought / Whatever's on your mind, I'd like to hear it." The section offers "Write to me" (the contact page), "Message
@wolfsblvt" on Discord (`#5865F2`; the app first, then the web profile) and "Copy handle". It ends with a handwritten
"contact me 🙃" and "— Wolf", where the upside-down face is drawn in the same hand rather than as an emoji.

**Why.** A worthwhile encounter can start with a thought rather than a proposal. The page shouldn't qualify people as
customers or collaborators.

**Rejected.** Contact for collaboration only; project-by-project pleas; a qualifying questionnaire.

## Contact

### One Works contact page, hosted with this site

**Date:** 2026-10-14 · **Status:** Current

The contact form is the Works contact page at `contact.wolfsblvt.works`. Its service lives in this repository: field
contract, validation, Turnstile verification, form-issue tokens, mail delivery and redacted logging. Other sites
(wolfsblvt.com, diffdevil and future products) link to it with `?product=<slug>`, which preselects their entry; they do
not get their own forms.

**Why.** The service was first built in wolfsblvt.com before the Works site was planned. Contact belongs to Works,
and one form means one inbox, one privacy text and one set of protections.

**Rejected.** A form per site; keeping the service in wolfsblvt.com.

**Reopen if.** A product needs contact behaviour the shared form can't carry.

### Contact page shape

**Date:** 2026-10-14 · **Status:** Current

On desktop, the heading, a plain "when you send it" list and the direct routes sit on the left, and the form sits on the
right. On phones the order is heading, form, then the notes. Topics are pill choices with "Something else" always fine.
The project picker is a searchable list in front of the native select, hand-ordered: the Works website, then the
projects in walk order, then the named pile pieces, then other sites. Each entry shows a type (Website, Tool,
Project…) and its icon from `@wolfsblvt/icons`, or a dashed placeholder with its initial until it has one. The subject
has a neutral `0 / 120` counter and the message a plain character count. Outcomes use the service's exact wording.

**Why.** The form's fields are fixed by the contract; the page around them should feel like Works and get out of the
way.

**Rejected.** A plain dropdown for topics; an alphabetical project list; the earlier standalone contact design built
for wolfsblvt.com.

### Arriving from another product: Works look, the product beside "Contact"

**Date:** 2026-10-14 · **Status:** Current. Built to Wolf's leaning; he kept it after seeing the rendered page

A visitor who arrives with `?product=<slug>` from another product's site sees the ordinary Works contact page. The
header shows that product's glyph and name in a small chip next to "Contact", linking back to the product's home, and
the form opens with a short "You came from …" note and the product preselected. The Works website itself
(`wolfsblvt-works`) gets no chip.

**Why.** Wolf leaned towards keeping the page Works-themed always: contact is one Works place, and the product is
context, not a new skin. The chip keeps the way back obvious without a second header design.

**Rejected.** Theming the page in each product's colours and type (a per-product design to maintain for every product,
and the page would stop being recognisably the one Works contact).

### Contact events are kept for 12 months

**Date:** 2026-10-14 · **Status:** Current, not yet configured on Cloudflare

Each `contact.submission` event (time, IP address, topic and project, every control's outcome, never the message) is
kept for 12 months in the retained log route, the Works default for security events. The Privacy and data page says so.

**Why.** Wolf chose the Works default. The event is mostly abuse and security evidence; one retention for the whole
event keeps it simple.

**Rejected.** 90 days (proposed because the form has no accounts to protect); 30 days (the design's original line).

### diffdevil is a registered contact product

**Date:** 2026-10-14 · **Status:** Current

The product list in `shared/contact-contract.ts` gained `diffdevil` beside the Works website, `wolfsblvt.com` and the
agents. The list is hand-ordered: the Works website, the projects in walk order, then other sites.

**Why.** diffdevil is the first product with its own public site, and it should link to this form with its own context
rather than as "something else".

### Bluesky shows as a visibly unavailable slot

**Date:** 2026-10-14 · **Status:** Current

The header's social panel and the footer show the Bluesky icon, disabled and labelled as not up yet, until
`links.bluesky` is set in `site.config.mjs`. Setting the URL turns both into links.

**Why.** Wolf: "Show the icon, mark it disabled for now. I will add it soon, likely before we deploy this. No need to
leave the design out yet."

### GitHub Sponsors is set up after the site, before publication

**Date:** 2026-10-14 · **Status:** Current

The Help section links GitHub Sponsors and Ko-fi as designed. Sponsors itself isn't set up yet: Wolf was waiting for
the finished Works site, its voice and branding before creating it, which made it a circular dependency. The site
ships the section complete, and setting up Sponsors is a publication step in `docs/DEVELOPMENT.md`.

**Why.** Wolf: "We include it locally with all that is needed. Once the site and assets are done, I will set up GitHub
sponsors, before we actually publish the website."

## Legal and error pages

### Legal pages are plain, readable, and a little human

**Date:** 2026-10-14 · **Status:** Current

`/impressum/` and `/privacy/` follow the Wolfsblvt Works legal baseline: `noindex, nosnippet`, no sitemap entry, no
social card, footer links in the standard order. Privacy and data opens with a short "the short version" list and keeps a
contents column. It names the controller and points to the Impressum for the postal address instead of repeating it. It
gives retention as criteria without promising scheduled deletion. A small "My rights" section claims the right to
serve the site in dark mode only. Operator data comes from a private build-time projection; source carries an obvious
fixture.

**Why.** Legal text is still something people read. The address belongs in one place, and mail is archived, so
promising deletion would be untrue.

**Rejected.** Repeating the address on the privacy page; a deletion promise for correspondence; a cookie banner (nothing
on the site needs consent).

### Error pages in the site's voice

**Date:** 2026-10-14 · **Status:** Current

The 404 says "Off the path.": the address you tried is struck through with a handwritten correction, the Walk lines lose
each other below the copy, and Yoru wanders off when clicked. The 503 says "Something broke. On our side." and is a
self-contained page with inline styles and no web fonts, served as Cloudflare's custom error page, linking only to
places that still work when this site doesn't. An unknown `#pile-…` address is not an error page: it opens Endless with
"This piece isn't here."

**Why.** A dead end is still part of the walk. A 503 page that depends on the broken site helps nobody.

## Build and repository

### Static Astro, with a Worker only where the edge must act

**Date:** 2026-10-14 · **Status:** Current

The site is an Astro static build. A Cloudflare Worker handles only what static files can't do: the contact page's form
token and submission, the per-browser pile seed, and response headers. Fonts are self-hosted (Latin and Latin
Extended). No analytics, no third-party scripts except Turnstile on the contact page.

**Why.** Astro static output is the Wolfsblvt Works default for websites. Everything here is content and client
behaviour, except the few edge decisions above.

**Rejected.** A client-side SPA framework; a CMS; Google-hosted fonts in production (a request to Google on every page
view).

### The Worker runs first only on the home page and Contact

**Date:** 2026-10-14 · **Status:** Current

`run_worker_first` lists `/`, `/contact` and `/contact/`; everything else is served straight from the asset store,
including the legal pages, the 404 and every asset. Static pages get their headers from a generated `_headers` file
with one site-wide CSP that pins every inline script by hash. The Worker hashes the actual HTML it serves for the home
and contact pages and sets their CSP itself; only Contact allows the Turnstile origin. The home page varies by browser
and language, so it is cached privately with `Vary: User-Agent, Accept-Language`.

**Why.** The fewer requests pass through code, the fewer can break: if the Worker fails, the legal pages and assets
keep working. Hashes instead of `'unsafe-inline'` scripts keep a strict CSP without nonces, which a static file can't
carry.

**Rejected.** Running the Worker on every request; nonce-based CSP (needs the Worker on every page); one CSP rule per
page in `_headers` (Cloudflare joins duplicate header rules, which would intersect the policies).

### The social cards are rendered once and committed

**Date:** 2026-10-14 · **Status:** Current

`npm run cards` renders `public/social/home.png` and `contact.png` in Chromium with the site's own fonts inlined, and
the PNGs are committed. The build doesn't render them.

**Why.** A browser in every build for two images that change only with the hero or the lockup costs more than it
saves. Rendering from HTML with the site's real fonts keeps the cards faithful to the page.

### Publication is a separate, gated build

**Date:** 2026-10-14 · **Status:** Current

`npm run build` always works, with fixture legal data and marked placeholders, so development and CI never need
private data. `npm run build:production` requires the private legal-operator projection, refuses the fixture, then runs
the output check and the publication gate, which refuses illustrative pieces, placeholder windows, pending privacy
facts, the placeholder Turnstile key and any dependency from a local path, and lists the steps it can't verify
(GitHub Sponsors, Bluesky, hosting).

**Why.** The real operator data must never be needed to work on the site, and placeholder content must never reach
the public by accident.

### The footer's Site column follows the Works website defaults

**Date:** 2026-10-14 · **Status:** Current

Besides Contact, Privacy and data and Impressum from the canvas, the footer's Site column links the source on GitHub,
the security policy and the licences.

**Why.** Every public Works website carries those routes in its footer, and this site's source is public.

### smolpng's button stays disabled until it has a public home

**Date:** 2026-10-14 · **Status:** Current

smolpng's window shows its "Explore smolpng" button visibly disabled.

**Why.** smolpng has no public site or repository yet; a link to a private repository would be a dead end.

**Reopen if.** smolpng gets a public home; the window is authored in its own voice then anyway.

### Licences

**Date:** 2026-10-14 · **Status:** Current

The website's code is licensed under AGPL-3.0-only. Original prose is CC BY 4.0. The Works marks, Yoru and other
artwork are not covered by either licence. Third-party fonts and assets keep their own licences.

**Why.** This is the licence split Wolfsblvt Works uses for its websites and hosted software. The marks and the
resident identify Works and stay with it.

**Rejected.** A single permissive licence over everything, which would also license the identity.
