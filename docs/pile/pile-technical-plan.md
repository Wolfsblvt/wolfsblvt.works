# The Pile: technical implementation plan

## Meaning

Implement one Git-authored public catalogue, eight reusable compact/expanded forms, optional entry-specific components and interactions, a deterministic daily Pile, and a separately curated Endless order. A single feature controller owns the scattering empty state, gradual document expansion and collapse, anchor navigation, and the lifecycle of expanded interactions. The result is a collection of individually authored windows, not a page-builder engine.

This is Nyxara's complete technical definition for the selected Pile experience. Wolf explicitly commissioned this plan after choosing the empty Pile, slow reversible reveal, eased entry journeys, and shareable anchors. The [authoring guide](pile-authoring-guide.md) owns writing; the [experience specification](pile-experience.md) owns the visitor-facing behavior and visual intent. This plan defines how to carry both.

The supplied HTML exports and relevant source-package material were inspected as design evidence. They are not the live website repository, and this return did not inspect its current production source, dependency lockfile, or runtime. Paths and APIs below are the selected target implementation, not claims about code already present. Map them into the existing site at integration without changing their responsibilities or silently migrating an otherwise fitting stack. No repository, provider, deployment, or publication effect is performed by this return.

## Architecture decision

Use **Astro static composition, TypeScript browser modules, ordinary CSS, and the native Web Animations API** for this feature. The site does not need a new client framework, server, database, CMS, scheduler, or animation dependency to implement the selected behavior. Astro components provide build-time composition; browser scripts supply the interactions.[^astro-components][^astro-scripts]

Keep an existing suitable site stack if the actual repository already has one. That is an integration mapping, not permission to replace the full selected behavior with whatever a stock component happens to support. The exported reference's React and DCLogic support files belong to its design-tool runtime; they do not establish a production React requirement.

Three responsibilities stay separate:

| Responsibility | Owns | Does not own |
| --- | --- | --- |
| Catalogue and entry source | Stable identity, public copy/assets/links, editorial order, local custom components | Browser mode, daily coordinates, scroll position |
| Shared Pile host | Daily selection and packing, canonical anchors, open/close state, travel, common interaction lifecycle | The visual identity or full layout of each expanded window |
| Entry presentation | Its material, composition, useful glimpse, and optional local controls | URL/history policy, daily selection, global scrolling, or the open/close state |

The server/build side renders every public Endless entry into the page. The browser enhances that document; it does not fetch a second content database or construct the meaningful text from an animation manifest.

Do not virtualize entries out of the document in the initial implementation. Stable anchors, native reading, and lightweight static content matter more than speculative scaling machinery. Native find-in-page can search the open collection and the no-script document; this plan does not claim that browsers search a collapsed inert subtree. Revisit rendering only if the actual collection produces a measured problem, preserving those outcomes.

## Authoring files and the entry contract

Place the feature in one cohesive source subtree. The following is the selected layout; existing site-wide components such as icons or image helpers remain in their established homes.

```text
src/features/pile/
  catalogue.ts
  types.ts
  Pile.astro
  pile.css
  motion-tokens.ts
  components/
    CompactLink.astro
    EndlessEntry.astro
    EntryPermalink.astro
    EntryLinks.astro
    EntryCopy.astro
    EntryMedia.astro
    WolfScribble.astro
    forms/
      Thought.astro
      Note.astro
      Chip.astro
      Artifact.astro
      Lineage.astro
      Door.astro
      Specimen.astro
      SiteTicket.astro
  entries/
    <stable-id>/
      entry.ts
      Endless.astro       # only when a custom window is useful
      Compact.astro       # only when the default compact form is insufficient
      interaction.ts      # only when this entry has behavior
      assets/             # actual owned/selected assets, not an empty requirement
  client/
    bootstrap.js          # deliberately small, synchronous head bootstrap
    pile-controller.ts
    pile-layout.ts
    pile-motion.ts
    pile-navigation.ts
    entry-interactions.ts
```

Tests sit in the repository's existing test arrangement, near this feature or in its established test directory. Do not introduce a second test convention merely to match this tree.

### One file for ordinary content

`entry.ts` exports `data`, checked with `satisfies EntryData`. Optional component exports supply custom presentations. Ordinary entries need only this data file and an import in `catalogue.ts`.

Use this public content shape. It is a specification of the source contract; it is not a serialized browser protocol or a storage migration schema.

```ts
export type Footprint = "small" | "medium" | "large";

export interface ImageAsset {
  src: string;            // resolved local/build asset URL
  width: number;
  height: number;
  alt: string;
  caption?: string;
  credit?: {
    text: string;
    href?: string;
  };
}

export type Scribble =
  | { kind: "text"; text: string }
  | { kind: "image"; image: ImageAsset };

export type LinkKind =
  | "source"
  | "site"
  | "app"
  | "docs"
  | "community"
  | "download"
  | "upstream"
  | "related";

export type EntryLink = {
  id: string;             // unique within this entry
  kind: LinkKind;
  label: string;
} & (
  | { destination: "url"; href: string }
  | { destination: "entry"; entryId: string }
);

export interface LineageSubject {
  label: string;
  mark?: ImageAsset;
  linkIds?: readonly string[];
}

export type EntryForm =
  | { kind: "thought"; question?: boolean }
  | {
      kind: "note";
      preset: "short-slip" | "wide-note" | "torn-sheet" | "folded-note";
      lettering: "handwritten" | "typed";
      sketch?: ImageAsset;
    }
  | {
      kind: "chip";
      icon: ImageAsset;
      platform?: string;
    }
  | {
      kind: "artifact";
      excerpt: string;
      language?: string;
      expandedExample?: string;
    }
  | {
      kind: "lineage";
      from: LineageSubject;
      to: LineageSubject;
      relationship: string;
    }
  | { kind: "door" }
  | {
      kind: "specimen";
      preview: ImageAsset;
      previewStanding: "illustration" | "actual-output";
    }
  | {
      kind: "site";
      domain: string;
      destinationLinkId: string;
      preview?: ImageAsset;
    };

export interface EntryData {
  id: string;
  title: string;
  form: EntryForm;
  compactCaption?: string;
  daily: {
    include: boolean;
    footprint: Footprint;
  };
  endless?: {
    subline?: string;
    paragraphs?: readonly string[];
    scribble?: Scribble;
    media?: readonly ImageAsset[];
    standing?: string;
  };
  links?: readonly EntryLink[];
}
```

The thought's or note's main text is normally `title`; do not maintain a second identical statement. Richer custom content belongs in a local component, not a recursively nested content-block language. A chart, rich SVG scene, or animation can be authored there while reusing the shared copy and links.

`paragraphs` normally contains one short paragraph; an additional useful paragraph needs no custom template. The optional fields express available content, not obligations. Do not make authoring fail because a door lacks a paragraph or a note lacks links.

Use the site's existing image pipeline to produce asset URLs and dimensions. Local entry assets may be imported at build time; never place private working files in a publicly copied asset directory. Product-brand styling belongs in the entry's scoped stylesheet/component and existing brand assets, not an arbitrary CSS string field inside the data.

Example source for a supplied concept, with proposed wording rather than a release claim:

```ts
import type { EntryData } from "../../types";

export const data = {
  id: "shortcuts",
  title: "There’s probably a shortcut for that.",
  form: { kind: "thought" },
  daily: { include: true, footprint: "medium" },
  endless: {
    subline: "Useful shortcuts while you’re using an app or website.",
    paragraphs: [
      "An idea for finding a quicker way without stopping to read the manual. " +
      "Search for what you need, keep useful shortcuts visible, and save others " +
      "for a time when you actually want to learn them.",
    ],
    standing: "Concept",
  },
  links: [],
} satisfies EntryData;

// Add only when an authored presentation is useful:
// export { default as Endless } from "./Endless.astro";
```

### Curated order, explicitly visible

`catalogue.ts` statically imports each selected public entry module and exports one ordered array. That order is Endless order.

```ts
import * as shortcuts from "./entries/shortcuts/entry";
import * as baumhaus from "./entries/baumhaus/entry";

export const catalogue = [
  shortcuts,
  baumhaus,
] as const;
```

This is an illustrative two-entry excerpt, not the full launch selection. Adopt the real chosen collection rather than copying these as the only entries.

There is no per-entry numerical rank, filesystem-order dependency, alphabetical fallback, date sort, or dynamic import that determines editorial sequence. Moving one entry in this array changes its position without changing its ID.

Only chosen public entries belong in this array. Do not import a private catalogue and rely on CSS, client filtering, or a `published: false` flag to protect undisclosed copy. Development fixtures belong in the existing non-production preview/test surface.

### Optional custom components

An entry may export `Endless` and, when needed, `Compact` as statically imported Astro components. Keep component references on the build side. Do not send component functions, private frontmatter, or the full source catalogue to the browser.

The default form component accepts the entry data and a `mode` of `compact` or `endless`. A custom component receives the same data and, in Endless, the supplied heading ID. It can compose `EntryCopy`, `EntryMedia`, `EntryLinks`, and `WolfScribble`, or arrange the same information differently.

`EndlessEntry.astro` owns the outer article, canonical ID, permalink marker, and lifecycle target. The content component places exactly one semantic title heading with the supplied ID wherever its composition needs it. The frame uses `aria-labelledby` to that heading. When artwork already displays the title, a visually hidden semantic heading can carry the accessible name.

Do not impose a visible standard heading row above every bespoke scene. Equally, do not let a custom scene remove the anchor or become an inaccessible image of its text.

## Render the semantic document first

`Pile.astro` renders:

- one labelled Pile section and its stage;
- static compact previews, each inside `CompactLink`;
- one threshold control region and one empty-state region;
- one Endless introduction and one expansion wrapper;
- one `EndlessEntry` per catalogue entry, in explicit order;
- the existing site continuation outside this feature.

Do not duplicate the contact section or footer inside the component. They remain downstream in ordinary document flow.

`CompactLink` is a real `<a href="#pile-<id>">`. Its accessible name identifies the entry and destination. Its visual children contain no links, buttons, form controls, or independent click handlers. An apparent terminal source label or ticket stub is decorative at compact scale.

Server-render compact previews for daily-eligible entries in a readable flow. The enhancement selects and packs the day's subset. Without JavaScript, the full public Endless collection stays visible, the previews work as normal anchors, and no false daily-selection claim is displayed.

The unenhanced open affordance is a link to `#endless`. Enhancement replaces it with a native button carrying `aria-controls` and `aria-expanded`; the no-script document does not contain an inert “open” button above content that already exists. Show collapse controls only after enhancement.

Boot CSS can temporarily conceal the unselected compact set and collapse the expanded wrapper to prevent a flash. That CSS must be tied to an explicit bootstrap marker with the failure recovery described below. A generic permanent `.js` class is insufficient.

Browser metadata is projected through escaped data attributes or a safely serialized small manifest. Include only IDs, form kinds, eligibility, footprints, and values needed for selection/navigation. Content remains semantic HTML. Never interpolate raw author strings into executable JavaScript or inline event handlers.

## Default forms and shared helpers

The eight defaults must be usable at first integration; custom components are a refinement path, not a requirement to make the basic collection work.

| Form | Default Endless implementation |
| --- | --- |
| Thought | Statement plus optional sub-line, paragraph, aside, media, and links |
| Note | The same paper/tape family, optional additional writing or sketch; four curated variants and two lettering choices |
| Chip | Icon/title with copy and a reserved media area when an actual image is supplied |
| Artifact | Expanded example or compact excerpt, selectable code, optional explanatory comments and a real link strip |
| Lineage | Two identifiable subjects and an accurate relationship, with optional explanation and subject-specific links |
| Door | Named door with its public line and any genuinely applicable links; no compulsory expansion text |
| Specimen | Honest static preview and context, replaceable or enrichable with an actual local control |
| Site ticket | Destination-themed ticket structure, optional preview/copy, real outbound stub and secondary links |

Every default can use the optional copy, media, scribble, standing, and links. “Available” must not mean hidden behind a custom rewrite for six of the eight forms.

`EntryLinks` resolves `destination: "entry"` through the catalogue ID table to the canonical fragment. It resolves URL destinations as genuine anchors. The same component can render a subset of link IDs beside a lineage subject or on a ticket stub without duplicating URLs.

Keep icons with the existing site icon system and readable labels with the content. Icon-only presentation needs an accessible name and a visible hover/focus label; use visible text where touch or multiple similar destinations makes icon-only meaning ambiguous. Do not fetch provider icons at runtime.

A ticket's `destinationLinkId` must name one of its URL links. A lineage subject's `linkIds` must resolve within that entry. These are useful validation rules; they do not require a generic relationship engine.

A group of doors is an optional authored composition of consecutive genuine entries, not the default catalogue shape. Add it only when selected. Its component must retain each member's own article ID and target region; do not introduce empty grouping machinery before such a scene exists.

## Daily selection and placement

### Date and identity

Use the **Europe/Berlin calendar date** as the shared daily seed coordinate. This is the plan's implementation choice, not a claim that the earlier prototype already did so.

Produce `YYYY-MM-DD` from `Intl.DateTimeFormat` with an explicit time zone and `formatToParts`; do not subtract local midnights or use the visitor's unspecified time zone. Combine the date with the sorted eligible IDs. The exact same date and catalogue produce the same membership regardless of device width or Endless order.

Use a small deterministic non-cryptographic seeded generator. Reusing the reference's pure PRNG is appropriate after separating it from the old date calculation and fixed-ten selection. Hash the explicit seed consistently, for example with FNV-1a over UTF-8 followed by a documented 32-bit generator. This is visual selection, not randomness for security or a user identifier.

Freeze the chosen date and selection for this document visit. Closing, opening, resizing, or returning from another tab does not reroll it. A new visit or reload uses the current date. Do not add a midnight watcher, storage preference, fingerprint, or server job.

The visible stamp includes the selected date, so a long-open page retains an intelligible date even after midnight. Never claim new projects are published every day.

### Variety without a fixed card count

Target five different forms when at least five real eligible forms exist. Select one seeded representative from each of five seeded form groups, then fill from the remaining seeded entries according to a visual footprint budget.

Starting weights are `small = 1`, `medium = 2`, `large = 3`, with an initial budget of `16`. These are layout-tuning constants, not public limits or a fixed count of objects. The five representatives fit even when large; remaining space can carry repeats or additional forms. Do not force all eight forms.

If fewer forms or fewer entries exist, use what is real. Never manufacture filler, duplicate an entry, or discard a meaningful type solely to satisfy a count. The exact membership stays the same across widths; a narrow page may grow taller to show it.

The budget may be tuned against real content. That does not change the invariant that the assortment is date-deterministic, varied, and free of mandatory all-eight representation.

### Packing

Keep packing in `pile-layout.ts`, separate from the catalogue and animation.

Measure the selected compact wrappers at their actual readable widths. Use a small set of wide-layout horizontal lanes, seeded x-offsets and small outer rotations. Place objects in source order, testing their rotated bounding rectangles against already placed content. Shift a conflicting candidate downward until it clears. The stage grows to contain the final bounds.

This is a bounded placement routine, not a force simulation or physics world. It does not need to understand a door, a terminal, or a note beyond its measured box and authored footprint.

Prefer a narrow-screen flow or simple staggered arrangement when free placement would damage reading. Preserve every selected object and meaningful focus order. Do not solve overflow by shrinking text or dropping items.

Use separate wrappers for placement, flight transform, and the object's authored material/rotation. Recomputing a daily position must not overwrite an entry's note variant or internal branding.

Recompute geometry on an actual container resize and relevant font/content-size change. Batch layout reads before writes. The selection and note variants remain fixed. Do not run a continuous physics or polling loop.

## Mode state and ownership

`pile-controller.ts` is the sole mutation boundary for mode, pending destination, and transition resources. `pile-navigation.ts` owns fragment/history interpretation and directed travel; `pile-motion.ts` owns the visual mechanism. Entry code does neither.

Use four explicit mode states:

```ts
type PileMode = "closed" | "opening" | "open" | "closing";
type Target =
  | { kind: "intro" }
  | { kind: "entry"; id: string };

interface PileState {
  mode: PileMode;
  desiredOpen: boolean;
  pendingTarget: Target | null;
}
```

Keep the current scroll operation, origin focus element, and animation handles as controller-owned runtime resources, not content fields or an independent global store.

The public feature operations are `open()`, `openToEntry(id)`, `openToIntro()`, `close()`, and `dispose()`. Each resolves or reports its actual completed/cancelled result. Do not report successful arrival when the visitor interrupted travel.

| Current state and input | Result |
| --- | --- |
| Closed + open | Scatter and reveal; stay at the threshold |
| Closed + entry/intro | Same opening, then travel to the selected target |
| Opening + another target | Keep the opening; replace the pending target |
| Open + target | Travel only; do not scatter again |
| Opening + close | Retarget the current transition toward closed |
| Closing + open/target | Retarget from the current visual state toward open |
| Open + close from below | Travel to threshold first; then retract and gather |
| Any automatic travel + manual scroll input | Cancel travel and any deferred focus transfer |
| Interrupted preparatory close travel | Remain open; cancel the pending collapse |

Use one abortable operation context and a monotonically increasing intent token to prevent old callbacks from settling a newer request. This is a local controller implementation, not an event bus or workflow framework.

Catch expected cancellation of Web Animations promises. `Animation.cancel()` can reject the corresponding finished promise; cancelling is not automatically an application failure.[^animation-cancel] A real unexpected error takes the feature to an accessible stable state, described under recovery, rather than leaving half-hidden content.

## Scatter and gather without duplicated entries

Use one inert, pointer-transparent, fixed flight layer for the compact previews. It clips to the viewport and sits above the Pile's ordinary content but below global site controls.

Before departure:

1. Measure the stage and each selected preview's viewport rectangle.
2. Preserve the stage's footprint and each preview's original insertion point.
3. Move focus off a departing compact link when necessary, normally to the threshold button.
4. Make the compact set inert and transfer its actual outer preview nodes to the flight layer.
5. Give those nodes the measured position and size; animate only their flight wrapper.

Use the actual compact nodes rather than cloned DOM. This avoids duplicate IDs and duplicated SVG definitions. Canonical Endless articles never move and are never cloned.

Make compact visual styles independent of a particular stage ancestor. The flight layer carries the same relevant theme tokens, and each wrapper keeps its width and styling scope. Do not let reparenting change fonts, container-query sizing, or a note's appearance.

Choose among four to six authored downward path families, with seeded offsets, delays, and modest rotations. Curves can be sampled into transform keyframes. The destination is below the current viewport, not the item's real document location. Offscreen previews may settle without costly visible painting; every preview still leaves the compact stage.

After departure, restore nodes to their saved positions in the compact set, hidden and inert. Leave the separate empty-state region visible in the preserved stage. This restoration is internal bookkeeping, not a visible repopulation.

For gathering, compute the current responsive destination boxes with the compact set hidden but measurable. Transfer the previews to the flight layer, travel from below toward those boxes, then restore them to their normal parents at the final coordinates. Remove temporary styles and inertness only when they are ready for use.

On reversal, start from the current computed transforms and positions. Do not reset to the fully scattered or fully gathered state first. Always clean up the flight layer and insertion placeholders on completion, cancellation, history restoration, and disposal.

## Reveal real document space

The Endless wrapper has an inner content element in normal flow. In the enhanced closed state, it is hidden from interaction and occupies zero expansion height.

At opening, make the inner content measurable while the outer wrapper remains clipped at its current height and inert. Measure the inner natural block height. Animate the outer height from its current value to that height while introducing the threshold copy. At completion, clear the explicit height to `auto`, remove clipping where the final design allows, and release inertness.

Use the experience document's starting timing: roughly 1,200 ms, overlapping the scattering. Implement the actual growing document height; an opacity transition alone does not qualify.

At closing, measure and freeze the current height, then animate it toward zero. Hide the expanded region and keep it inert once closed. Opening and closing use the same content DOM, so a local specimen does not reset merely because the visitor folds the collection away.

Reserve dimensions/aspect ratios for images, screenshots, and specimens. A single observer on the inner size can retarget an in-progress height animation when a genuine geometry change occurs. Once open, natural height handles ordinary changes. Avoid observer loops caused by observing the animated outer height itself.

Batch measurements and minimise per-frame layout work. Height animation is a deliberate layout effect required by the selected experience; do not replace it with stretched text, arbitrary `max-height`, or permanent transform scaling.

During the controlled expansion/retraction, prevent browser scroll anchoring from following the moving footer. Apply the necessary temporary anchoring override to the affected scroll container, record its former value, and restore it when settled. Keep this local in duration; never disable ordinary document navigation or scrolling permanently.

A visitor closing from deep inside Endless travels to the threshold before height disappears. If that preparatory travel is interrupted, leave the space open.

## Anchors, history, and directed travel

### Stable addresses

Reserve these same-document destinations:

```text
#pile                 the Pile threshold, with the collection closed
#endless              the expanded collection introduction
#pile-<stable-id>     one expanded entry
```

Use an explicitly authored lowercase kebab-case ID. Do not derive a published ID again from its current title, its form, or its position. Validate ID uniqueness and fragment safety at build time. Component-local SVG/heading/control IDs also receive an entry-specific prefix.

Exactly one article carries `id="pile-<stable-id>"`. Compact links, related-entry links, and the path-side permalink all point to that article. A permalink still works when the entry is absent from the daily selection.

Use the existing canonical website origin and page path to form copied or externally shared URLs. These fragments are locations inside the Works page, not separate product routes. They do not require separate titles, sitemap records, or per-entry social-preview endpoints. A fragment is handled by the browser rather than sent as part of the HTTP resource request; do not promise unique social unfurls for fragment-only links.[^fragment]

Retain an old fragment alias only for a genuinely published address that needs preservation. A discarded design mockup hash is not evidence of such a consumer.

### Path-side marker

`EntryPermalink` renders a normal anchor with the label “Link to [title]”. Render `#` now, with a replaceable icon slot for the signpost supplied through the separate design work.

Give the marker a real gutter and a comfortable hit area, initially 44 CSS pixels even when the glyph is small. On narrow layouts, keep it within the entry's leading edge. Show its label on focus as well as hover. The icon asset changes no navigation code.

Its default action follows the anchor. Native copy-link and open-in-new-tab work. An explicit clipboard button can be added separately if selected later; do not make click-to-copy a hidden replacement for navigation.

### Intercept only the owned journey

Handle an unmodified primary click on a same-page Pile/Endless link by preventing native fragment positioning, updating history, and calling the appropriate feature operation.

Preserve modified click, middle click, explicit new-tab targets, downloads, external destinations, and unrelated anchors. Do not install a global click blocker or overwrite the site's existing navigation system.

Use `history.pushState` for an explicit new destination and call the controller directly. That API can update the URL without performing a native hash navigation; it does not emit `hashchange` for the update.[^pushstate] Do not set `location.hash` and then attempt to animate after the browser has already moved.

Use one small namespaced `history.state.worksPile` value containing the desired mode and selected target. Preserve the rest of the site's history state. When an existing router owns history, integrate these facts through that owner rather than installing a second competing router.

Do not push another entry for repeated activation of the current destination. Do not update the fragment as the visitor simply scrolls through different windows.

| Action | History behavior |
| --- | --- |
| Main open control | Record the source state, then push `#endless`; open without forced travel |
| Compact entry or related-entry link | Record the source state, push its entry fragment, then open/travel |
| Permalink at the current target | Keep the address; avoid duplicate history and unnecessary movement |
| Close control | Push `#pile`; perform the threshold return and collapse |
| Interrupted close before collapse | Replace that pending close destination with the actual retained open destination/state |
| Back or Forward | Restore the historical mode and browser reading position, without a new push |
| Unrelated same-document link | Preserve native/site-router behavior; do not close Endless as a side effect |

Closing never calls `history.back()`. That operation cannot distinguish a prior entry on this page from an unrelated website that supplied the incoming shared link.

### Browser history restoration is not a fresh entrance

Keep ordinary browser restoration rather than replaying an elaborate animation on Back/Forward.

On `popstate`, cancel active feature travel and animations, restore compact nodes, and synchronously establish the historical open/closed layout before the browser restores its persisted reading position. Do not start a competing animated scroll in that handler. Restore an existing site router's mode through its own navigation hook if it owns restoration.

The event ordering and browser restoration behavior require real-browser qualification; they are not proved by a unit test or an assumed universal timeout.[^popstate][^restoration] The required outcome is a coherent historical view without double scrolling.

For address-bar or externally initiated `hashchange` navigation, recognise owned targets, open hidden content when needed, and complete any still-needed journey. Do not undo a browser-owned native movement just to replay it for appearance. The fully controlled animated paths are our own links and the cold shared-link bootstrap.

Leave unrelated hashes alone. Preserve focus when history restores a readable view; this is not a new request to move keyboard focus to a heading.

### Cold shared-link bootstrap

A fresh `#pile-<id>` visit must not jump natively before the requested reveal-and-scroll journey begins.

Use a small synchronous plain-JavaScript bootstrap in the document head, before entry IDs are parsed:

1. Recognise only `#endless` and the exact `#pile-<id>` syntax. Leave other fragments, including unsupported text-fragment syntax, untouched.
2. Save the complete original URL, existing history state, and current restoration setting.
3. Temporarily hold the recognised fragment by using `replaceState` with the same URL minus its fragment. Do not create a history entry. Suppress native restoration only for this controlled initial journey.
4. Set the feature's boot marker so the initial expanded content is not briefly painted before collapsing.
5. Let the bundled controller initialise, validate the requested target against the actual catalogue, and establish the daily board and recovery handlers.
6. Restore the exact original URL using `replaceState`, not `location.hash`. Acknowledge successful boot before starting the deliberately slow animation.
7. Open with the normal reveal sequence, then travel to the requested entry or introduction. Restore the previous restoration policy afterward.

Do not detour the viewport to the Pile just to display the scattering. The same opening can occur below the initial viewport before the directed trip.

Integrate the bootstrap into the site's existing CSP handling with the appropriate nonce or hash. Do not weaken the policy to permit arbitrary inline scripts. Astro's deliberately unprocessed inline script route carries plain JavaScript; do not place TypeScript syntax or unresolved imports inside it.[^astro-scripts]

The bootstrap has one explicit failure escape. If the controller fails to load/initialise, or has not acknowledged initialization after an initial 2,000 ms loading budget, restore the original URL/state and restoration policy, clear boot CSS, reveal the semantic collection, and leave ordinary anchors usable. A caught module-loading failure invokes the same recovery immediately. After exposing the content, honour a still-pending incoming target with ordinary native positioning when it exists and the visitor has not taken control; restoring a hash with `replaceState` alone does not perform that positioning.

That timer is a load-failure escape, not animation timing. Once initialization is acknowledged, the slow opening and scroll can run for their full durations. If recovery already ran, a late module must not collapse the content the visitor is now reading.

If history manipulation is unavailable or throws, skip enhancement of this initial journey and preserve normal access. JavaScript-disabled visits never execute the bootstrap and receive the usable semantic document immediately.

Respect manual input during startup. Opening may finish, but cancel unrequested later camera travel once the visitor starts navigating for themselves.

For a back-forward cache return, use the preserved document state rather than this cold bootstrap. For a full-document historical return, use historical mode/restoration rather than replaying a fresh invitation.

### Unknown or withdrawn entry

A syntactically owned but unknown `#pile-...` destination opens the collection and shows a small notice at its introduction:

> This piece isn’t here.

Provide a real “Browse the collection” link to `#endless`. Keep the attempted address available instead of silently claiming to have found an entry. Do not display a fabricated project or pretend a fragment failure is an HTTP 404 response.

If an entry is intentionally withdrawn later, preserve a small public placeholder or a known replacement only when the publication decision permits it. Privacy can require actual removal; the generic unknown-entry response remains valid.

### Eased scroll implementation

Native smooth scrolling does not expose the exact duration and easing controls selected for this experience. Use one small `requestAnimationFrame` travel function; do not introduce a general scrolling framework.[^scrollto]

For progress `t` clamped to `[0, 1]`, use the monotonic quintic easing:

```ts
const ease = (t: number): number =>
  t * t * t * (10 + t * (-15 + 6 * t));
```

The zero-speed beginning and end provide the requested getting-faster-and-slower character. Use a distance-aware starting duration:

```ts
const distanceInScreens =
  Math.abs(targetY - startY) / Math.max(1, viewportHeight);

const durationMs = Math.min(
  2200,
  Math.max(700, 550 + 260 * Math.sqrt(distanceInScreens)),
);
```

These values are authored tuning defaults. Adjust them from the rendered journey, not by replacing the curve with an instant jump.

Measure the destination after the reveal has settled to natural height. Compute the heading/target's document top minus the current header clearance and a small breathing margin, clamped to the scrollable range. Use the current page's actual offset rather than a hard-coded header height.

On each frame, apply the interpolated y with an immediate scroll operation so native smooth behavior does not fight the authored animation. Ignore `scrollTo`'s return value; the feature owns completion through its own frame lifecycle.

Reserve media dimensions so delayed image loads do not move every later entry. Use current font metrics rather than waiting indefinitely for every remote font. If a relevant geometry change occurs during travel, rebase continuously from the current position toward the updated destination. Do not append a visible snap after reaching an old target.

Abort on a new navigation intent, page lifecycle exit, manual wheel/touch movement, or a scrolling key. Do not interpret the scroll events generated by the animation itself as manual interruption. If the visitor changes keyboard focus during travel, cancel deferred focus transfer.

At successful arrival, focus the target heading with `tabindex="-1"` and `preventScroll: true` when the navigation warrants focus movement. A cancelled journey never performs a later focus jump. Do not jiggle a target that is already suitably positioned.

## Custom windows and local scripting

A new entry can use the defaults forever or gain its own `Endless.astro` later. That component is ordinary trusted website source, not a template string evaluated from content.

Custom windows retain the shared outer anchor, accessible title, common open/close ownership, and link semantics. They may bring a distinct layout, SVG, image, chart, brand treatment, or local animation. They may not mutate another entry or control the site camera themselves.

### Lazy behavior, not executable data

Use `client/entry-interactions.ts` as a small explicit table of bundled lazy imports for entries that actually have scripting:

```ts
const loaders = {
  "dice-for-one": () => import("../entries/dice-for-one/interaction"),
};
```

The ID above is an illustrative interaction entry, not automatic approval to publish the reference fixture. No `script` field, executable JSON, `eval`, remote plugin loading, or runtime path construction belongs in an entry record.

The loader's public contract is small:

```ts
export interface InteractionContext {
  signal: AbortSignal;
  navigateToEntry(id: string): Promise<"arrived" | "cancelled">;
}

export interface InteractionHandle {
  setActive?(active: boolean): void;
  destroy?(): void;
}

export interface InteractionModule {
  mount(
    root: HTMLElement,
    context: InteractionContext,
  ): InteractionHandle | void;
}
```

The controller owns one intersection observer for scripted entry roots. When Endless is open and a scripted entry approaches the viewport, load and mount it once. Bind listeners to the supplied signal. After mounting, `setActive` follows actual viewport relevance and open/page visibility; time-based work pauses while hidden or closed.

Simple click-only controls need no active-state method. A moving simulation or media specimen does. Ordinary local DOM state can survive closing and reopening; do not remount everything merely to stop a loop.

On disposal or actual document replacement, abort listeners and call `destroy` once. On page hiding or a back-forward cache transition, pause transient work and restore coherent static mode; on return, resume the same entry state without rerolling the daily collection.

A failed interaction import leaves the static preview, text, and links usable. Give an actionable local fallback if the control itself cannot work. It must not prevent the rest of Endless from opening.

The loader table is one explicit source map for actual code, not a discoverable plugin system. An ordinary new entry requires no loader change; a scripted entry adds one import.

### Real and illustrated specimens

Keep meaningful static preview HTML in the window. Mount real controls into a reserved region without replacing the entry's identity or description.

Label a fixture as an illustration. A local simulated result is not a live provider result. Do not add credentials, tracking, remote integrations, or retained visitor data to make a showcase appear functional without a separately selected product boundary.

The entry script owns only its root. Shared navigation is provided through the controller rather than recreated in each specimen.

## Ticket tearing and external navigation

`SiteTicket` renders a real anchor for its outbound stub. Its href is resolved from the entry's canonical links, not copied into a script literal.

For an ordinary unmodified same-tab activation:

1. Capture the already resolved destination.
2. Prevent the immediate navigation.
3. Play the short stub-tearing animation.
4. Navigate once on completion, with a bounded failure escape.

Use a single completion guard and a roughly 600 ms maximum wait around the approximately 320 ms animation. Completion, rejection, and timeout all converge on the same exactly-once navigation. Do not leave a visitor trapped by a lost animation event.

Keyboard activation follows the same route. Reduced motion skips the tear. Modified click, middle click, explicit new-tab links, and download actions are left native before interception. Do not rely on an asynchronous popup after user activation has expired.

On page return, reset the stub's transient decoration so the link is whole and usable. A ticket can use the target's own visual theme through its scoped component; navigation behavior stays shared.

## Accessibility, continuity, and recovery

The page is still a document. Open/close is a disclosure, not a dialog; do not add a focus trap or require Escape to exit.

Use a native button with `aria-expanded` and `aria-controls`. During transitions, make outgoing compact controls and unavailable expanded controls inert. `inert` affects focus, interaction, and exposure to assistive technology; it is not merely an opacity change.[^inert] Remove it when the corresponding view becomes usable.

Never hide the currently focused element without placing focus somewhere sensible. Successful directed entry navigation focuses its heading without an additional scroll. Successful collapse restores focus to the threshold control. Manual interruption preserves the visitor's chosen focus.

Observe `prefers-reduced-motion` in JavaScript and CSS.[^reduced-motion] Settle mode and navigation without the scattering, large height travel, or ticket tear. Keep content, links, empty state, and stable IDs identical.

If reduced-motion preference changes during an animation, cancel travel and settle the selected usable state. Do not execute the remainder of a long animation merely because it began under another preference.

Ordinary browser history restores its own position, while fresh feature-directed navigation uses the authored curve. Do not add permanent global smooth scrolling or change unrelated site anchors.

A runtime failure restores compact nodes and removes orphaned flight layers, clipping, fixed heights, and stale inertness. Prefer a readable expanded collection with ordinary links over a partially closed broken feature. Degrade only the affected enhancement; do not disable the entire website.

No-script access is intentionally simpler: semantic content and native anchors, without claiming the animated experience. Do not hide the only useful content behind JavaScript or fetch.

Keep custom SVG IDs scoped to their entry and presentation. Do not let a compact illustration's gradients or masks accidentally reference the expanded illustration. A flight uses the actual compact node, not another duplicate.

On narrow screens and at zoom, ensure the path marker remains within reach, paragraphs keep readable measure, ticket links remain usable, and no absolute-positioned object escapes the stage. Explicit width available to a composition is not an instruction to stretch every line across it.

## Build-time validation and content safety

Validate the small executable contract as part of the normal site check/build:

- entry IDs and canonical DOM IDs are unique and safe;
- every catalogue module has a supported form and required form-specific content;
- related-entry targets and per-entry link references exist;
- ticket stubs resolve to URL destinations;
- asset dimensions and meaningful image alternatives are supplied;
- public navigation destinations use supported ordinary schemes or same-site routes, not executable URL schemes;
- every chosen entry has an Endless article and compact eligibility is explicit.

Validation should report the entry and faulty field. Do not make a broken link reference become a silently missing link.

Do not enforce the soft paragraph/scribble word ranges with build failures. Meaning, voice, disclosure, and tasteful composition require editorial judgment, not a phrase scanner.

Do not load arbitrary remote previews, embed third-party pages automatically, or ship private product notes as hidden metadata. Use local selected artwork and real links. This plan adds no accounts, analytics, cookies, persistent visitor seed, or runtime service. A future specimen that genuinely needs those would have its own explicit product and operational decision.

## Verification plan

Use the repository's existing healthy test stack. For an Astro/TypeScript site without one, select **Vitest for pure module contracts and Playwright for real-browser journeys**; pin compatible development dependencies in the repository rather than installing a global toolchain. Their official setup and browser-project documentation are the current integration references.[^vitest][^playwright]

Do not create tests for every helper merely because it has a file. Preserve the joined behavior at the cheapest layer that can establish it.

### Pure and structural tests

Cover deterministic selection for the same date/catalogue, independence from viewport and Endless order, correct Berlin date boundaries including daylight-saving transitions, graceful scarcity of forms, absence of duplicates, and preservation of all selected items.

Cover unique ID/link validation, stable related-entry resolution, the chosen note presets, and the mapping from a selected ID to its canonical anchor. An intentional title/form/order change must not change the address.

Cover travel easing endpoints, monotonic progress, distance-aware duration bounds, cancellation outcomes, and latest-intent state transitions. Do not assert exact intermediate pixels or every animation callback.

Render representative forms to check one canonical article ID, a real compact anchor with no nested controls, labelled onward links, and a tape-bearing expanded note. An HTML check does not prove the motion works.

### Browser journeys

Use actual rendered page geometry and input. Test Chromium, Firefox, and WebKit for the important navigation and history boundaries, plus a narrow touch-sized view.

| Journey | Required observation |
| --- | --- |
| Main open | Pieces leave; the stage is intentionally empty; real document height grows over time; control changes; viewport is not teleported |
| Main close at threshold | Height retracts; same selection gathers; no hidden focus targets or orphaned flight nodes remain |
| Close from deep inside Endless | Eased return occurs before substantial height is removed |
| Compact object navigation | One opening followed by eased travel to its actual entry, including early, middle, and late targets |
| Cold shared link | No native jump before reveal; target is reached even when absent from today's Pile |
| Native link affordances | Modified click, middle click, new-tab, and browser copy-link remain valid |
| Related-entry link | Travels within stable Endless without rerolling or reopening it |
| Back/Forward and page return | Historical mode and reading position restore without a second animated entrance or competing scroll |
| Unrelated anchor | Contact and other site destinations retain their normal behavior |
| Rapid input | Open/close/open and multiple target choices settle to the latest intent without stale callbacks |
| Manual interruption | Camera travel stops; no delayed focus theft; interrupted close return leaves the collection open |
| Responsive change | Resize during transition does not drop pieces, lose anchors, or introduce horizontal overflow |
| Late media/font geometry | Targeting remains coherent; reserved media avoids large shifts; no snap correction after arrival |
| Reduced motion | Equivalent destinations, content, and empty state without long motion |
| JavaScript disabled | All public windows and native anchors remain usable |
| Bootstrap or interaction failure | Original URL is restored; semantic content remains accessible; only the failed enhancement is lost |
| Ticket stub | Tear precedes one normal navigation; keyboard, modified-click, failure, and return cases remain usable |
| Custom specimen | Static fallback remains; real controls work; loops pause when hidden/closed; reopening does not duplicate listeners |
| Single closing surface | The actual site's contact/closing/footer appear once and move with the expanding document |

For motion, sample geometry at several points to distinguish a real height reveal from an immediate jump. Do not build a fragile test that passes only at one exact duration. Use stable fixtures and control irrelevant network delays when checking choreography.

Inspect keyboard focus and screen-reader structure separately from screenshots. Check zoom, narrow path markers, readable note text, and the discoverability of cross-links.

A short real-page visual review judges whether scattering feels like a Pile, whether the empty space works, whether the easing feels deliberate, and whether the windows reward opening. Browser tests do not ratify taste.

### Evidence boundary

During return authoring, the standalone `EntryData` contract and included concept-entry example passed a strict TypeScript check. The proposed easing formula was checked for its endpoints and sampled monotonicity, and the duration formula for its bounds. The three Markdown files' relative links and code-fence structure were checked.

These checks qualify those excerpts and the document package, not a website implementation. No controller, animation, history journey, or browser rendering was implemented or exercised here. The implementing session returns actual test/build results and representative browser observations, including any remaining difference from the selected behavior.

## Implementation sequence and complete delivery

The following sequence builds one coherent capability. It is not permission to ship an unrelated static list as completion or to leave the accepted animation and anchors in an unnamed later phase.

**1. Join the actual site source.** Read the website repository's own instructions and relevant current implementation. Map this feature to its real page frame, image/icon pipeline, history owner, CSP, and root commands. The reference-tool runtime is not an application dependency to preserve. Return a real incompatible assumption if encountered; do not silently reduce the destination.

**2. Establish the catalogue and all eight defaults.** Implement typed entry data, the explicit curated order, shared wrappers/links, canonical anchors, and semantic static HTML. Transfer the chosen real entries and retain illustration standing where applicable. Give each default actual optional expansion support. Do not replace the entire collection with the two-entry example from this document.

**3. Author useful initial windows and daily composition.** Use the available public material to add fitting sub-lines, paragraphs, scribbles, examples, media, branding, and links. Implement deterministic varied selection and readable responsive packing. The initial content should visibly demonstrate useful enrichment, not merely a new schema with all fields empty.

**4. Carry the whole opening and navigation system.** Implement state ownership, scattering/gathering, real gradual height changes, meaningful empty state, the cold shared-link bootstrap, eased travel, collapse from deep in the page, anchors, history, cancellation, and reduced-motion/no-script recovery as one joined behavior.

**5. Exercise the extension path with real selected content.** Implement the ticket tear in its shared default. Use an actually selected specimen or custom window to establish the local component and lazy-interaction join. When only a fixture is presently appropriate, keep it honest; do not invent a live service. The full capability to author later local windows remains part of the delivered architecture.

**6. Qualify and reconcile.** Run the focused structural and pure tests, the actual page build, and the browser journeys above. Tune timing/composition in the complete page, not only an isolated component gallery. Correct stale source links, compact interactions, the expanded note's tape, and any remaining generic listification from the reference.

**7. Adopt the maintained documentation.** Place these three documents together under the website's natural documentation home, for example `docs/pile/`, and link the authoring guide from the existing development/design entrance. The architecture/development map needs only the relevant pointer and changed truth, not a duplicate of this plan. Record significant adopted rationale in the site's existing decision home when needed.

The complete initial result includes all eight usable forms, the real selected catalogue, useful default enrichment, stable per-entry addresses, the daily/curated distinction, the empty Pile, the slow reversible opening, and the joined navigation behavior. It does not require bespoke artwork and custom scripting for every current or future entry.

Later entry-specific enrichment is normal content/product work: add a link, improve a paragraph, supply a screenshot, replace a fixture with a control, or give an entry its own window. Those additions preserve the catalogue contract and ID. They do not require redesigning the host or inventing a plugin platform.

## Decisions and supersession carried by this plan

| Selected implementation | Reason and rejected alternative |
| --- | --- |
| Static public HTML plus browser enhancement | Preserves readable content and real anchors; rejects content existing only in client-side generated cards |
| Explicit ordered catalogue | Makes curation obvious; rejects daily/random/filesystem ordering for Endless |
| Data plus ordinary local components | Makes small additions cheap and bespoke windows possible; rejects executable content strings and a generic page-builder language |
| Shared daily packing, individual window composition | Keeps author effort on the entry; rejects per-entry manual placement and a uniform expanded card |
| One mode owner and one travel owner | Contains cancellation and history coordination; rejects each piece independently opening/scanning/scrolling the page |
| Fixed flight layer for real compact nodes | Expresses scattering without distant coordinate morphs or duplicate DOM IDs |
| Actual height reveal | Carries the selected slow opening; rejects an instant append disguised by opacity |
| Controlled links plus cold-fragment bootstrap | Carries shareable animated journeys; rejects a native jump followed by an attempted correction |
| Native historical restoration | Respects returning readers; rejects replaying the entrance every time Back is used |
| Signpost as replaceable art over working `#` | Keeps the full anchor behavior available while the separate artwork is designed |
| No runtime server or general plugin system | The selected experience is authored static content with bounded local interaction, not an independently operated platform |

These are authored technical choices under Wolf's planning request. They are not retrospective claims about agreement in the earlier design export, and they do not authorize website or provider effects by themselves.

## Source boundary and technical references

The product source is this Pile co-design, particularly Wolf's instruction that every compact action leads to Endless and his final selection of the empty scattering Pile, slow reveal, eased anchor journeys, and full technical plan. The supplied object sheet/HTML and original reference package provide visual and historical evidence. The maintained Works voice remains in `Wolfsblvt/wolf-leitsatz:docs/company/works/`; this feature does not replace it.

The old Walk example's fixed ten-item daily slice, generic expanded-list rendering, magic scroll delay, compact outbound links, and compact playable die are not the selected implementation. No current live repository behavior was inferred from those specimens.

Official platform references below were checked on 14 October 2026. They establish the named API boundaries, not proof that this proposed implementation has been built. The specific architecture, sequence, duration values, content shape, and recovery choices are authored in this plan.

[^astro-components]: [Astro: components](https://docs.astro.build/en/basics/astro-components/). Build-time component composition and component-local structure.
[^astro-scripts]: [Astro: scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/). Bundled scripts, TypeScript processing, ordinary browser interactivity, and the separate unprocessed inline-script route.
[^pushstate]: [MDN: History.pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState). Same-document history updates without an automatic hash-change event.
[^popstate]: [MDN: popstate](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event). History traversal and its relationship to persisted browser state.
[^restoration]: [MDN: History.scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration). Automatic versus manual restoration; preserve the site's actual ownership of this setting.
[^scrollto]: [MDN: Window.scrollTo](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo). Native scroll operation and behavior options; the plan's easing/duration are supplied by its own frame loop.
[^animation-cancel]: [MDN: Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel). Cancellation and the finished-promise rejection boundary.
[^inert]: [MDN: inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert). Interaction, focus, and accessibility implications.
[^reduced-motion]: [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Detecting the user's motion preference.
[^fragment]: [MDN: URI fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment). Browser-handled document locations rather than separate server requests.
[^vitest]: [Vitest: getting started](https://vitest.dev/guide/). Repository-local TypeScript test setup when no fitting runner is established.
[^playwright]: [Playwright: test projects](https://playwright.dev/docs/test-projects). Browser/project configurations for the selected real-page journeys.
