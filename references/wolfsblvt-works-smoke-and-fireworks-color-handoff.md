# Wolfsblvt Works color direction: Smoke & Fireworks

## Meaning

This is a focused handoff for the **Wolfsblvt Works color palette and its background-light language**.

It does not replace the current Claude Design layout, typography, project compositions, motion grammar, or homepage structure. Those remain part of the active design conversation. Apply this color direction to the existing work rather than redesigning the site around the examples that led here.

The palette is selected strongly enough to develop, but the exact production tokens may still receive small contrast and optical adjustments during the full grammar pass.

## Owner reasoning

Wolfsblvt Works should feel:

> **Warm in atmosphere. Precise in construction. Surprising in details.**

The site is dark-first, personal, and diverse. It should not become:

- generic neutral SaaS design;
- cold neon cyberpunk;
- sepia artisan or fantasy-workshop cosplay;
- an all-purple or all-pink site;
- another modern site whose identity is merely several blurred radial gradients.

The selected direction keeps a warm smoky dark world, then introduces a deliberate clash of:

- **orange-gold** from the left;
- **pink-magenta** from the right;
- **cyan** as a crisp technical and interactive counterpoint.

The bright colors are allowed to occupy meaningful space, but they remain shaped by the Walk rather than sprayed across every control.

## Core palette

```css
:root {
  /* Large dark fields */
  --works-canvas: #100b11;
  --works-canvas-warm: #181018;
  --works-canvas-cool: #0c1217;

  /* Surfaces */
  --works-surface: #181219;
  --works-surface-raised: #211720;

  /* Type */
  --works-text: #f3e8dc;
  --works-text-soft: #d1c0b8;
  --works-text-muted: #c0b0b1;

  /* Rules and quiet structure */
  --works-rule: rgb(243 232 220 / 12%);
  --works-rule-strong: rgb(243 232 220 / 20%);

  /* Character colors */
  --works-orange: #eca557;
  --works-rose: #ef8ea1;
  --works-magenta: #db61aa;
  --works-cyan: #73cae3;
  --works-deep-plum: #4d1b40;

  /* Language aliases */
  --works-handwritten: var(--works-rose);
  --works-strike: var(--works-rose);
  --works-focus: var(--works-cyan);
}
```

These are the intended hue relationships and role boundaries. Claude may derive close relatives for contrast, hover, selected, disabled, focus, or translucent use. Do not casually replace the chromatic thesis with a different palette during that derivation.

## Required correction to the current specimen

The crossed-out **software** line and the handwritten notes belong to the same visual language.

Both use the same soft rose:

```css
.handwritten,
.editorial-strike {
  color: var(--works-rose);
  stroke: var(--works-rose);
}
```

Do not use orange for one and rose for the other merely to distribute palette colors evenly.

Orange-gold belongs primarily to the left-side atmospheric light and other deliberately warm moments. Cyan belongs primarily to precise interaction, focus, links, and selected technical details.

## Base background

Use a warm plum-black field with a slight warm-to-cool material shift:

```css
.works-page {
  background:
    linear-gradient(
      160deg,
      var(--works-canvas) 0%,
      var(--works-canvas-warm) 52%,
      var(--works-canvas-cool) 100%
    );
  color: var(--works-text);
}
```

The base must still look authored when the Walk lighting is absent. The lighting enriches the page; it does not rescue an otherwise generic black surface.

## The Walk as the background-light language

The background color effect is part of **The Walk**.

The site has two slowly winding inner boundaries:

- a warmer orange-gold side field on the left;
- a pink-magenta side field on the right.

The fields begin at the **left and right edges of the site's centered content frame** and bleed inward until their respective boundaries.

They do not attach to the physical browser edge.

The Walk travels with the page content. It is not a fixed viewport overlay.

### Geometry

- The two paths descend in the same broad direction.
- They are never parallel or mirrored.
- The right field usually receives more room and reaches farther inward.
- The left field usually stays closer to the edge, but occasionally widens.
- Curves use long, slow winds across substantial page distance.
- Avoid hooks, sharp turns, narrow zigzags, repeated sine waves, or decorative oscillation.
- Major project sections may eventually exert gentle local pressure on a nearby boundary, but only through gradual curvature.

The inner road remains the largest visual region.

The content-frame width itself belongs to the shared website-frame standard and the product-specific site design. This color handoff does not select that width.

## Field, highlight, and glow are different layers

The colored side field, visible boundary line, and emitted light are related but not identical.

### 1. Side field

The side field is the largest and quietest layer.

```css
/* Conceptual opacity ranges, not final tokens */
--works-walk-field-near-edge: 0.16 to 0.20;
--works-walk-field-near-road: 0;
```

It fades from the content-frame edge toward the winding inner boundary.

The field matters more than the line.

### 2. Visible boundary

The visible highlight line is thin and readable.

Suggested starting range:

```css
--works-walk-line-width: 2px to 3px;
--works-walk-line-opacity: 0.42 to 0.52;
```

Use orange-gold on the left and magenta on the right.

It must not look like a neon tube.

### 3. Near-line bleed

A restrained bleed follows the visible line closely:

```css
--works-walk-near-bleed-width: 6px to 9px;
--works-walk-near-bleed-blur: 10px to 16px;
--works-walk-near-bleed-opacity: 0.12 to 0.20;
```

This keeps the line luminous without turning it into a hard vector stripe.

### 4. Displaced glow path

The larger captured-light glow uses its own path.

It broadly follows the visible boundary but drifts slightly:

- sometimes farther toward the outer field;
- sometimes a little farther into the inner road;
- never as one constant geometric offset;
- never enough to read as a second independent route.

Suggested starting range:

```css
--works-walk-glow-width: 14px to 24px;
--works-walk-glow-blur: 18px to 30px;
--works-walk-glow-opacity: 0.10 to 0.16;
```

A useful normalized drift is roughly `0.5%–2%` of the content-frame width at selected control points, changing gradually along the page.

This non-identical relationship makes the light feel dynamic and captured by the line rather than mechanically traced from it.

## Conceptual layer order

```text
page material
→ side color fields
→ displaced broad glow paths
→ near-line bleed
→ thin visible boundaries
→ site content
```

The Walk remains behind content. Project worlds may cover, interrupt, recolor, or temporarily replace local portions where the selected project composition calls for it.

## Interaction colors

Use cyan for precise, crisp interactive contrast:

- keyboard focus;
- selected links or controls;
- small technical details;
- occasional exact edges.

Do not make cyan a second ambient field competing with orange and magenta.

Rose is the editorial human mark:

- handwritten notes;
- crossing out and corrections;
- small candid interventions;
- occasional expressive control.

Magenta belongs primarily to the right-side field and related atmospheric variants. It may also appear in rare graphic moments, but should not turn every action into a pink button.

Orange-gold carries warmth:

- left-side field;
- selected warm light;
- very occasional supporting emphasis.

## Project-owned color

Works hosts projects with independent identities.

The Works palette is the surrounding world, not a filter imposed on every project.

A project may:

- replace a local section background;
- introduce its own typography and interaction color;
- interrupt or cover the Walk;
- make the nearby Works light quieter;
- use a different composition entirely.

Do not recolor project-owned brand assets merely to fit this palette.

## Accessibility and quieter forms

Derive foreground colors against the actual surface where they appear. The exact source hue may require a lighter relative for small text or focus.

For reduced motion, the Walk remains a static authored composition. Do not remove the color fields merely because movement is reduced.

For a calmer rendering or resource-constrained surface, preserve:

- the side fields;
- the winding boundaries;
- the orange/pink asymmetry;
- the separate glow relationship where practical.

The identity should not collapse into plain black plus one accent.

## Avoid

- generic independent radial glow blobs;
- magenta-and-cyan everywhere;
- bright neon borders on every surface;
- identical line and glow paths;
- equal left/right fields;
- mirrored curves;
- short or sharp turns;
- perfectly repeated wave patterns;
- orange handwriting paired with rose strike-through;
- making Yoru or any current project the palette source of truth;
- solving semantic status colors by reusing every brand accent.

## Standing

This is the selected **Smoke & Fireworks** direction for Wolfsblvt Works color development.

Claude Design should:

1. keep the accepted existing site/design work;
2. replace its current Works palette with this color relationship;
3. develop a complete accessible palette and token system from these roles;
4. integrate the Walk background-light language;
5. show the palette across the actual homepage grammar rather than returning another isolated swatch board.

This handoff does not select typography, page-frame width, final layout, project composition, Yoru behavior, or a production implementation.
