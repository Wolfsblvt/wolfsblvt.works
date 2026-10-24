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

**Addendum, 2026-10-24.** The path fills across the words: while you read a section, the fill runs across its own
word, letter to letter, and the gap to the next word jumps with the highlight, so the whole Pile, Endless included,
stays inside "Whoa" however long it grows, and "Hello?" only fills at the end. Before, the fill was linear in page
height and reached the end while you were still in the Pile (Wolf: "it needs to scale the last part of the bar to the
pile section"); a first correction ran each word's fill on to the next word's start, which made "Whoa" look complete
by the middle of Endless. The phone bar has no words to follow and shows plain page progress instead.

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

**Addendum, 2026-10-23.** Four more faces are self-hosted and used only inside their project's window: Nunito
(smolpng), Bricolage Grotesque and Atkinson Hyperlegible Next (Karaokebarr), Alegreya and Alegreya Sans (Borrowed
Coast). Squishling's ASCII drawing is set in Consolas, the face Wolf drew it in, then Menlo, DejaVu Sans Mono and the
system's own monospace; each run of its non-ASCII glyphs sits in a cell exactly as wide as that many characters of the
primary face, so a fallback font for one stroke (the arc, on most systems) cannot push a line out of alignment. It is
the mascot's command-line form, not a web font.

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

**Addendum, 2026-10-24.** Yoru is in one place at a time. Once he has left the hero's perch, the perch stays an empty
line and the caption is gone for good; scrolling back up does not teleport him home. Wolf: "He literally lives in the
site."

## The header and the marks

### Finished assets, editable design, and production markup are separate

**Date:** 2026-10-15 · **Status:** Separation retained; paths and sponsor ownership superseded by the standard bundle below

The first separation placed approved exports in a dedicated artwork directory and production sponsor markup in the
website, away from design demonstrations. The standard bundle now owns the reusable addresses and shared component;
the website's native component binds it. Editable co-design provenance stays under `design/marks/`.

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

**Date:** 2026-10-14 · **Status:** Superseded on 2026-10-23 by "Composed scenes are content; only unreplaced
scaffolding is a placeholder". The marks and the publication gate remain; the content they guarded has been authored.

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

### Composed scenes are content; only unreplaced scaffolding is a placeholder

**Date:** 2026-10-23 · **Status:** Current

A constructed game map, a Disc label, an authored reading state, a stream receipt with its figures, a mock interaction
or an imagined scene is a finished public specimen. It carries no "illustrative", "fixture", "example data" or "not
built" caption, in text, alt text or aria labels, and no `illustrative: true`. A project's standing is said once, in
one short line ("Work in progress", "In development", "Early concept", "Idea", "Private project"), and some tiny
pieces say nothing at all. `illustrative: true` and `data-placeholder` now mean exactly one thing: design-time
scaffolding that has not been replaced, which the publication gate still refuses.

**Why.** Wolf, 22 October 2026: "This is a showcase. Why do I need to correct all the sessions that we showcase stuff
and make it look interesting, not create a research and source-based factual claim list that a lawyer will check."
Numbers inside a clearly composed design are not production metrics, and the page must not read like an audit.

**Rejected.** Per-card fixture labels and evidence tables; a recreated disclaimer layer; disabling the publication
guard while scaffolding survives. Legal-operator fixtures, pending hosting facts, placeholder keys and dead
destinations keep their factual obligations: those are different from illustrative art.

### Pile entries carry their own scenes; size follows the footprint

**Date:** 2026-10-23 · **Status:** Current

An entry that its form's default can't carry (a village, an atlas, a sea, a machine) adds `Compact.astro` and/or
`Expanded.astro` under `src/features/pile/entries/<id>/`, found by file, not by a registry line; behaviour is an
`interaction.ts` beside them, bundled as a lazy import and mounted once the entry approaches the viewport in an open
Endless. A compact scene renders inside the object's single link and holds no controls; an expanded scene places
exactly one title heading and decides where the shared copy block (hook, paragraphs, standing, links) sits. The desk
sizes a compact object by its authored `footprint` (small, medium, large); the form only decides its tilt and its
default presentation. The catalogue refuses a scene folder without an entry.

**Why.** Twenty-nine admitted subjects with their own material cannot be eight uniform shells; the technical plan
reserved exactly this seam. Discovery by file keeps authoring an ordinary addition. Width by footprint lets a wide
village strip and a small door share one packer without a per-kind table that no longer described the objects.

**Rejected.** A page-builder, a scene engine or a CMS; smuggling scene fields into the content schema; a registry
module that every new scene has to edit. The generic die specimen (`ex-dice`) and the other `ex-*` pieces are retired.

### Endless opens in a mixed order

**Date:** 2026-10-23 · **Status:** Current

The first Endless order is deliberately mixed: it opens with understandable objects, alternates screen-like material
with paper, worlds and quiet, and lets the moth and the closed door end the collection. It is not grouped by the kind
of project, and it is not a navigation contract: lines may move while every subject and address survives.

**Why.** Grouping by provenance (small tools, growing products, games, private doors, fragments) would turn Endless into
the co-design's filing system. The visitor should meet variety.

### Tera's fragment is in, credited to nek0tera

**Date:** 2026-10-24 · **Status:** Current

The `.mpreg` thought is the 29th entry (`mpreg`): a tiny torn scrap with the extension and an editorial question
mark on the desk, and in Endless the whole line in her words, "Can someone not make a file extension like .mpreg?",
credited to nek0tera with her Twitch profile picture and links to her Twitch and X. Wolf asked her and wants the
credit to promote her, on the compact object as well as the expansion. The picture is fetched by hand from her
channel page's own `og:image` (`npm run credits`) and committed; the build fetches nothing.

**Why.** Wolf, 24 October 2026: "Tera's fragment we'll add as defined. I asked her for permission. We'll also use this
note to shill her Twitch and Twitter." A committed picture keeps the build reproducible and offline; refreshing it is
an ordinary content update.

**Rejected.** Fetching the avatar at build or deploy time (a third-party dependency in every build, and Twitch's
API needs credentials); a "permission pending" card.

### The P-4 taste choices: the quiet door and the request note

**Date:** 2026-10-24 · **Status:** Current

Wolf chose the quiet blue-green door for Shikkuri over the game-sleeve specimen, and the taped request note for
SimklBridge over the poster chip, after seeing both pairs rendered in the Works context. The alternatives were built
for the comparison and removed afterwards; the Returns in #916 keep them.

### Each project window has its own address

**Date:** 2026-10-24 · **Status:** Current

`#diffdevil`, `#borrowed-coast`, `#smolpng`, `#karaokebarr` and `#lunescence` (and the section words) arrive with
the walk's eased journey instead of the browser's jump, held before first paint like a Pile address. Each window
carries a small `#` in its corner that travels there, puts the address in the bar and copies the link. Pile addresses
are forgiving: `#noreplyyet` and `#no-reply-yet` resolve to `#pile-no-reply-yet`. The Pile's public address is `#whoa`,
the header's own word, whether it is open or closed; `#endless` and `#pile` are still understood but internal.

On a slow connection the journey still happens: a held address sets off once the fonts are in or after 600 ms,
whichever comes first, because the journey rebases towards its destination every frame anyway; and when the Pile's
script arrives after the bootstrap's two-second escape it still takes over while the Pile is below the fold, standing
back only when the escape has already put the collection in front of the reader.

**Why.** Wolf: "Each section needs anchors that I can link people to." Linking straight to a project is how the site
will mostly be shared. On the Pile: "we said "endless" is only internal. The public anchor is `#whoa` for the pile.
[...] if you expand and collapse the pile, it is still called `#whoa`."

### smolpng and TunnelTend are registered contact products

**Date:** 2026-10-24 · **Status:** Current

The picker lists smolpng after diffdevil (walk order) and TunnelTend after it (the named Pile pieces), both without
a glyph until `@wolfsblvt/icons` carries one, with their repositories as the way back.

**Why.** Wolf, 24 October 2026. TunnelTend's own publication waits on this form; smolpng's repository is public.

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
and words. diffdevil's window uses its exact theme and its own borders; since 2026-10-23 it leads with the counting
idea (GitHub +3 / −2, diffdevil 3 Changed), then the App's own Overview capture under "diffdevil, with a memory." and a
quieter glimpse of the Chrome extension; since 2026-10-24 that glimpse carries "Add to Chrome" with the browser's glyph,
pointing at the product site's extension page until a Web Store listing exists. Each window keeps its stylesheet beside
its component in `src/sections/projects/`.

**Why.** Works is the guide on the walk, not a wrapper that turns every product into the same card.

**Rejected.** One uniform Works card style for every project; a pretend CLI transcript as diffdevil's visual; an
exhaustive feature tour.

### The five windows: diffdevil, Borrowed Coast, smolpng, Karaokebarr, Lunescence

**Date:** 2026-10-23 · **Status:** Current

The walk introduces five projects in this order, with the Why interlude after diffdevil and one shared guide line ("A
few more things I want you to see." with "not all of them are ready. yet." in Wolf's hand) before the other four. Each
window carries its own introduction; no narrator paragraph precedes every project. Shikkuri left the walk and became a
closed door in the Pile.

**Why.** The consolidated co-design (room #916) settled the five and their order. Shikkuri is paused and private; a
door says that better than a window that had to invent a shelf.

### smolpng's window is light inside the dark-only site

**Date:** 2026-10-23 · **Status:** Current

smolpng is light-first, so its window is a light plane (version B of the D-1 design: ice and periwinkle field, one
coral cut, Nunito, Squishling's full ASCII on a white shape, the drop → squish → result illustration ending in "much
smoller."). Its palette is scoped to the window and leans on Gura's official colours without copying any artwork.

**Why.** Wolf: "B completely. It's better than A." The Vision says a project speaks in its own colour inside its
window; a light window is the strongest form of that. The site stays dark only; this is one project's room.

**Rejected.** Version A (paper and hoodie, Albert Sans); a global light theme; a "Local-first" front line. Ease,
cuteness and the whole journey lead; local processing belongs in the product's own help.

### smolpng's source link is live; its website button waits

**Date:** 2026-10-23 · **Status:** Current. Supersedes "smolpng's button stays disabled until it has a public home"

The window links "Source on GitHub" to the public repository and shows "Website coming" visibly off.

**Why.** The repository is public, so the earlier decision met its reopen condition. The website does not exist yet.

### Karaokebarr leads with the song's journey; the Disc supports

**Date:** 2026-10-23 · **Status:** Current

The window's main event is request → preparation → ready on the device: "Remember this one? Can we sing it?", a
Telegram message or a YouTube link, music, video, lyrics and notes coming together, and the living-room player
saying "Ready to sing." The native "See how a song gets ready" disclosure carries the three steps. A smaller Disc
("Friday, the loud one · 12 songs · 2026") keeps its real hole, proportions and printed label beneath. The brand is
unchanged: the K/disc mark, Ink, Warm Paper, Apricot, Mint and Lilac, Bricolage Grotesque and Atkinson Hyperlegible
Next. The window has no outbound destination; the project's repository is private.

**Why.** Wolf's correction of the first co-design: the Disc had displaced the product's purpose. The D-1 board's Disc
lifecycle animation was already coded, which is not a reason to keep it as the hero.

**Rejected.** The Disc lifecycle (draft → saved → burned) as the main animation; "Disc concept · illustrative
collection" and other captions under the object; stripping "12 songs · 2026" from the label.

### Lunescence carries its settled verbal brand with an open visual identity

**Date:** 2026-10-23 · **Status:** Current

The window is an open three-part typographic composition: The identity shines through. Embody. Express. Evolve. The
Express scene is set like a passage from a play; the Lunescence Workshop ("Shape what shines through.") sits beside it
with the "That look. Keep that." exchange; "Inside the Workshop" is a native disclosure underneath. One "Early concept"
line. The frame is Works' own Literata and Albert Sans: no moon, no celestial theme, no logo, no fixed character.

**Why.** Wolf: "You have my full authorization to completely replace or rewrite how we showcase Lunescence there, and
make it like.. the actual project I envisioned." The verbal brand was settled in the founding conversation; visual
openness does not erase it.

**Rejected.** The provisional moon and the three-line scene with a seconds-long reveal; a narrow "AI companion" pitch
that hid the Workshop; a new wordmark.

### Borrowed Coast: one crop of the coast, three ways of knowing it

**Date:** 2026-10-23 · **Status:** Current

The window shows the same patch of the Borrowed Sea in Chart, Watch and Nations, switched with the game's own mode
nav (its chart, watch and nations glyphs from `@wolfsblvt/icons`), in the game's Night Chart tokens and Alegreya type,
with one line of chart lettering naming the pressed mode and one captain's report as the human detail. The switch is
three radio buttons and CSS, so it works without JavaScript and under reduced motion. The three captures are the
originals from the game's Night Chart v15 reference, kept in `design/the-walk/assets/borrowed-coast/`. A "click" in
Wolf's hand points at the mode nav so it reads as the control it is and not as part of the capture; on screens 1640px
and wider it steps out to the right of the window, where there is room for it clear of Yoru's lane.

**Why.** The comparison only reads when the place stays fixed; three different maps side by side lose the one thing
the game does that nothing else does. The images are large and the crop is identical across modes on purpose.

**Rejected.** Embedding the live prototype; an invented wordmark; a label beneath each view; "Design study · fictional
campaign" captions.

### diffdevil keeps its canonical link

**Date:** 2026-10-23 · **Status:** Current

The window's "Explore diffdevil →" goes to `https://diffdevil.dev/` from the first launch, although the product site's
publication follows this one.

**Why.** Wolf selected it explicitly; publication order is Ops follow-through, not a reason to swap in a temporary
GitHub button and undo it later.

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

**Date:** 2026-10-14 · **Status:** Done. Sponsors was read back as live by Wolf Ops on 2026-10-22

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

### Contact goes live first; the site follows

**Date:** 2026-10-23 · **Status:** Current

The legal operator's additional direct contact is the live contact form, and the publication build refuses to say
"provisioned" before that route is operated and read back. So the first launch is two deployments of the same Worker:
first a contact-only build (`npm run build:contact-only`: the ordinary build pruned to the contact page, its assets,
the 404 and the 503, with no home, legal pages or sitemap, and a robots.txt that disallows everything) with only
`contact.wolfsblvt.works` routed; Ops reads the form back with one identified submission and flips the pointer; then
the publication build with both hosts routed. `workers_dev` and preview URLs are off, so a build is never public on
a provider hostname Ops did not route.

**Why.** Wolf Ops' Saturday sequence (Juno, #916) and the Leitsatz legal default: no live-form claim before the form
is live, and the guard stays on. A contact-only build keeps the first step from exposing fixture legal pages under the
contact host, which the whole build would have done.

**Rejected.** Weakening the legal guard; a host-scoped response in the Worker (the Worker does not run first for every
path on the contact host, so static fixture pages would still have been reachable).

### The Worker answers its own failures with the 503 page

**Date:** 2026-10-23 · **Status:** Current

An unexpected error in the Worker is caught once, at the top, and answered with the site's own 503 page from the
assets (status 503, `Retry-After`, no caching), or a plain line if the assets are unavailable too. The log line
carries the error's name and message only.

**Why.** The zone is on Cloudflare's free plan, which cannot serve a custom page for provider-level errors; what the
application itself can catch should at least fail in the site's voice. Provider-edge failures in front of the Worker
remain a priced fork for Wolf.

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

### Standard Works bundle and shared sponsor source

**Date:** 2026-10-16 · **Status:** Selected source migration; product acceptance pending

The accepted Brand Bundle v1 layout replaces the historical export coordinates. Maintained masters live in
`brand/source/works/`; only generated `brand/bundle/works/` is a consumer API. The website reads the same
shared sponsor template/styles/behavior that products may vendor; its Astro adapter supplies only host facts.

**Why.** Wolf required standard reusable paths once, and one opt-in Works sponsor treatment across products.
Keeping legacy public aliases or independent native artwork would recreate drift. The approved pictures and
co-design provenance survive. Existing SVG/raster masters make export reproducible without installing the historical
renderer toolchain. Glyphs remain in @wolfsblvt/icons.

**Boundary.** This candidate does not publish the website, enable accounts or complete external adoption.
The manifest input commit must survive integration unchanged, or the bundle must be regenerated against a new durable input.
