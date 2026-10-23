# Borrowed Coast on the Works website · window ideas and assets

## Meaning

Ideas and prepared assets for the Borrowed Coast Walk window on wolfsblvt.works (emergency-meeting #916, W-B), for Wolf's
co-design with Nyxara. Nothing here changes the website. The renderings come from the ratified Night Chart v15 reference
preserved in the Borrowed Coast repository (`docs/reference/night-chart-v15`), captured at one identical crop in all three
modes at 2× device pixels. The world shown is v15's synthetic tide-15 fixture (a war, a fight at The Narrows), not a live campaign.

## Recommendation

**One window, one crop, three ways of knowing it.** Show the same patch of coast and let the viewer switch Chart · Watch ·
Nations with the game's own mode switcher (the `.modes` nav, keys 1 2 3). The images crossfade in place. This is the
game's actual idea (the water is the rules; Watch is what you know; Nations is who holds what), and it only reads when
the place stays fixed. Three separate cards side by side read as three different maps, and the comparison is lost.

- Static stills, dynamic feel: three PNGs and ~30 lines of CSS/JS. No coupling to the game, no prototype code in the
  website repository, reduced-motion safe, keyboard reachable, works with JavaScript off (the Chart still shows).
- The switcher is lifted verbatim from the design, so it is a true piece of the interface, not a styled imitation.
- Minimal words: one italic chart-lettering line under the window that names the pressed mode. No wordmark, as the Plan says.
- Mobile: the switcher drops below the image as a row of tabs (`window-demo.html` does this at 560 px).

**Not recommended for tonight: embedding the live v15 prototype.** It is a 165 KB design carrier with its own state,
timers, local storage and prototype-only actions. It would have to be copied into the Works repository, kept in step
with the design, and made accessible as a landing-page element. The stills can be re-captured from it in a minute
whenever the design moves, which is the right dependency direction. If the window ever earns a live tide (the water
rising and falling under the viewer's cursor), that is a later, separate decision.

Also considered: three cards, each a different mode and a different place. Richer at a glance, but it spends the
window on variety instead of the one thing the game does that nothing else does. If a second image is wanted, use the
wide coast (`coast-wide.png`) as the quiet backdrop behind the Walk text rather than a fourth card.

## Assets

| File | What |
| --- | --- |
| `assets/window-chart.png` | Chart mode, 1520×1080 (760×540 CSS px at 2×): Lantern Reach with the moored ark, Morrow Quay, The Narrows (contested · fighting), Saintless Light with their ark, Hushwater, Tern Rest, Cinder Sound. |
| `assets/window-watch.png` | The same crop in Watch: lamplight on own harbors and ships, white light and "seen N tides ago" on foreign ships. |
| `assets/window-nations.png` | The same crop in Nations: held coast in each nation's colour, control marks on the harbors. |
| `assets/coast-wide.png` | The whole coast at ebb, 2100×1520, for a backdrop or a stitched wide rendering. |
| `window-demo.html` | The window with the real switcher and crossfade, as a self-contained study page. Open it in a browser. |
| `capture-window.mjs` | Re-captures everything from the repository's v15 payload (headless Edge, Playwright). |

Session furniture (decision letters, report numbers) is hidden in the window captures; routes, the fight marker, the
ark and the lamplight stay, because they are what the coast looks like, not what one commander's watch looks like.

## Tokens worth carrying into the Works theme adaptation

```text
--margin #1c1a15   --ink #efe6cf   --ink-2 #b9b199   --ink-3 #847e6b
--sea-1 #0e1f24    --water-ink #84a7a2   --intent #f2a83b (reserved for the commander's intention; do not use it decoratively)
--serif Alegreya   --sans Alegreya Sans
```

The mode icons (chart, watch, nations) are the Borrowed Coast glyphs from the icons package, inlined in the demo.
