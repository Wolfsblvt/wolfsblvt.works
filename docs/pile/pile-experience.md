# The Pile: opening Endless and finding a piece

## Meaning

The compact Pile is a changing arrangement of recognisable objects. Opening Endless scatters those objects downward out of view, leaves their place intentionally empty, and slowly reveals a stable collection of more generous, individually authored windows below. Closing gathers the same day's arrangement again. This is one continuous website experience, not a modal, a separate directory, or an instant list appended beneath a still-populated Pile.

This document carries the selected interaction, the empty state, the opening and closing journeys, shareable anchors, motion intent, and the remaining visual choices. Wolf selected the behavior in this co-design. The concrete wording and starting motion values below are Nyxara-authored decisions for the return, subject to refinement in the actual design rather than presented as quotations from Wolf. This specifies intended behavior; it does not claim an implemented or browser-tested result.

Use [the authoring guide](pile-authoring-guide.md) for content and the eight forms. Use [the technical plan](pile-technical-plan.md) for implementation, state, URL handling, rendering, and qualification.

## What is settled

The Pile and Endless are two presentations of the same public collection. The daily Pile changes; Endless has a deliberately curated order that does not reroll with the date.

Every compact object opens its own Endless entry. A compact die is not playable, a compact ticket does not leave the site, and a compact door is not a dead end. Actual controls and onward destinations appear inside the expanded windows.

Opening leaves an empty Pile. The scattered pieces do not travel to their exact expanded coordinates. Their downward departure expresses the relationship between the two presentations; it does not make daily placement control Endless order.

The page gains its real additional height gradually. The footer and closing content remain below the growing collection. Opening is not an instant height change disguised with a fade. Closing retracts that space just as deliberately.

Every entry has a stable anchor, including entries absent from today's Pile. Following a shared entry link opens Endless and takes the visitor to that entry with an eased journey.

## The spatial sequence

The page retains this reading order:

1. The composed Walk.
2. The Pile heading and daily-arrangement information.
3. The Pile stage, containing the compact objects when closed and the meaningful empty state when open.
4. The open/collapse control and short Endless introduction.
5. The stable sequence of Endless windows.
6. The existing contact/closing and footer.

This is not a new information architecture for the rest of the site. Keep the main design's established neighbouring sections and single closing surface.

The empty stage should still read as the place the Pile occupied. Do not quietly compress it into an ordinary heading row once its objects leave. Its original footprint is the starting treatment; its responsive proportions can be composed without requiring every viewport to preserve an enormous desktop blank.

Keep the surrounding path and spatial frame. The lack of objects is intentional, not a loading state. Do not replace it with skeletons, a spinner, an error illustration, or a second project index.

## Words at the threshold

Use this compact set as the recommended authored treatment. The handwritten line belongs to the empty stage; the heading and explanation belong to the newly revealed continuation. Do not repeat them in both places.

| Surface | Recommended text |
| --- | --- |
| Pile heading | And then there’s the pile. |
| Pile introduction | Tools, experiments, ideas, and things still taking shape. Some have a home of their own. Some open here. |
| Daily note | a different arrangement tomorrow. |
| Closed primary control | There’s more. A lot more. |
| Open primary control | Gather the pile |
| Empty-stage scribble | they’re down there now. |
| Endless introduction heading | A closer look. |
| Endless introduction text | A little more about each thing, and places to follow it next. |
| Closing control at the end of Endless | Gather the pile |
| Accessible collapse name | Gather the pile and close Endless |
| Entry-marker accessible name | Link to [entry title] |

“Gather the pile” describes the visible result. The button's programmatic expanded state communicates whether the collection is open. A small visible “Close Endless” explanation may accompany the control when the rendered context needs clarification; do not use a misleading “Back to the Pile” label for a control that also collapses the page.

The empty scribble may point downward, but an arrow alone is not the explanation. Keep it quiet. The visitor has just watched the objects leave; they do not need a paragraph explaining the animation.

The exact introductory wording can be tuned to the final composition. Its jobs are fixed: the empty space should feel intentional, and the continuation should promise a little more understanding rather than a new browsing application.

## Opening from the main control

The visitor activates “There’s more. A lot more.”

The pieces begin to lift and scatter down out of the visible frame. Their paths differ slightly: a short lean left, a wider curve right, a small turn, a later departure. Use a small authored family of movements with restrained variation. This should feel like one scattering Pile, not a synchronised grid dropping on command or an explosion of confetti.

At the same time, the continuation begins opening below. Let the two movements overlap. Do not make the visitor finish watching one complete animation before another empty wait begins.

The emptied stage and its small scribble become visible. The control changes to “Gather the pile”. The short Endless introduction appears, and the actual space for the windows grows into the document.

The visitor's viewport stays under their control. Opening from the main control does not automatically send them to an arbitrary entry or the end of the collection. They can continue scrolling from the threshold.

Once open, Endless is ordinary readable page content. Do not apply continuous scroll smoothing, scroll-jacking, or a mandatory reveal animation every time an entry enters the viewport.

## Opening from a compact object

The visitor selects a particular object, not an abstract instruction to expand a list.

Run the same scattering and opening sequence. Remember the selected entry while the page is gaining height. Only after the destination can be positioned reliably should the directed scroll begin.

The journey starts gently, gains speed, then settles gently. The selected heading or identifying element should come to rest below the site header, with enough space to understand the window. No snap to the destination before the animation, no teleport followed by a decorative wiggle, and no final correction that visibly jumps.

Do not attempt to keep a particular compact object attached to the camera for the whole trip. Recognition comes from its expanded material, title, artwork, or shape. A restrained arrival emphasis can reinforce that connection without flashing the entire section.

If Endless is already open, navigate directly to the target with the same eased scroll. Do not replay the scattering sequence.

If another entry is selected during opening, keep opening and change the pending destination. The latest explicit choice wins. Do not accumulate a tour of every item the visitor clicked.

## Following a shared link

A shared link addresses the entry, not its position in today's arrangement. The entry opens even when it was not selected for the daily Pile.

For a fresh visit, begin from the site's ordinary initial frame. Open Endless and then animate to the entry once its layout is ready. Do not first jump to the entry, reset the page, and replay a manufactured entrance. Do not detour through the Pile just to force the visitor to watch its objects leave.

The implementation must prevent the browser's initial native fragment positioning from racing the intended journey. That is specified in the technical plan, not left as an animation-polish issue.

A browser Back/Forward restoration is different from a fresh invitation. Restore the historical view and reading position without replaying the entire entrance. Returning from another site must not repeatedly impose the opening sequence.

## Closing and gathering

The primary control and the equivalent control at the end of Endless perform the same operation.

When the visitor is already at the Pile threshold, retract the continuation while the objects gather into the original daily arrangement. The empty-state copy and Endless introduction leave as part of that change. The control returns to “There’s more. A lot more.”

When the visitor is far down the expanded collection, first make an eased return to the threshold while the full document remains in place. Then retract it. Removing several screens of height underneath the current viewport would otherwise cause the browser to clamp the page upward; that is not an acceptable closing animation.

Gathering expresses the reverse relationship, but it does not require a mathematically exact reversal of every frame. The pieces return from below with related paths and settle recognisably. Their selected membership and authored note variants do not reroll.

A resize can change their positions to fit the new viewport. It does not change which objects were chosen for that visit.

Closing is not a browser Back command. A visitor who arrived from an external shared link should not leave the website merely because they close Endless.

## Motion character and starting values

The character is deliberate, slow enough to perceive, and light rather than sluggish. These are implementation starting values for rendered tuning, not frozen acceptance timings.

| Movement | Starting treatment |
| --- | --- |
| One piece scattering | About 800 ms, with a small rotation and a downward path |
| Spread between departures | About 0–160 ms across the selected assortment |
| Opening real page space | About 1,200 ms, beginning around 160 ms into the departure |
| Empty-state appearance | Around the middle of the scattering sequence, not before anything leaves |
| Closing real page space | About 1,100 ms, overlapping with the gathering |
| One piece gathering | About 800–900 ms |
| Directed scroll | Distance-aware, roughly 700–2,200 ms, with a smooth acceleration and deceleration |
| Ticket stub tearing | About 320 ms before an ordinary same-tab navigation |

Do not add these durations into a long serial ceremony. Scattering, layout growth, and the threshold copy overlap. A selected-entry journey waits for stable destination geometry, then uses the distance-aware scroll.

Use a bounded family of curves rather than a physics simulation. The pieces can differ without receiving hand-authored trajectories for every future entry.

Animate the page's available space, not the scale of its text. Scaling the entire collection vertically would distort the very material being revealed. An enormous arbitrary `max-height` also produces the wrong timing when content is shorter than that value.

The path remains a steady reference. The motion should explain a change of state without making the surrounding website swim.

## Interruptions are ordinary use

The visitor remains in control throughout.

Manual wheel, touch, or scrolling-key input cancels automatic travel. The collection remains readable; it does not drag the visitor back to the selected heading afterward. Successful automatic travel may move keyboard focus to the target heading; cancelled travel must not steal focus later.

A close request while opening retargets the visible transition from its current state. A reopen request during closing does the same. Do not snap to an endpoint merely to simplify the next animation.

If the visitor interrupts the preparatory trip back to the threshold, stop that trip and leave Endless open. Do not complete an unseen collapse beneath them.

Reduced-motion preference removes the scattering, large height animation, and long travel while preserving the same destinations, meaningful empty state, open/close controls, and content. This is an equivalent usable mode, not a lesser content set.

The technical plan defines cleanup and state ownership so interruptions do not leave invisible focus targets, stranded pieces, or stale callbacks.

## The path-side entry marker

Every expanded entry has one unobtrusive permalink marker aligned with the path to its left.

The preferred experiment is Wolf's forthcoming scribbled signpost icon. Until that actual asset is supplied and selected, render the small `#` treatment. The behavior must work fully without the signpost; do not invent a substitute drawing in this contribution.

The marker is a genuine link. It can be followed, opened in another tab, or copied with the browser's normal link commands. A hover or focus label names the entry. Do not secretly make its only click action “copy to clipboard” while presenting it as navigation.

Reserve a real path-side gutter rather than clipping the marker off the screen with a negative margin. On narrow screens, move it to the leading edge of the entry heading or another fitting position inside the readable frame. The small visible mark can have a comfortably larger hit area.

The canonical anchor belongs to the expanded window. The compact preview points to it but does not duplicate the same HTML ID. A grouped door scene still gives each door its own marker and target.

An entry's title, form, branding, links, and position may change. Its address remains stable.

## Useful content inside Endless

The shared frame provides navigation, not a mandatory card layout.

A thought may add a short paragraph. A note keeps its tape and gains a sketch. A chip can reveal an app-like glimpse. An artifact can explain itself through comments and output. A lineage window can show what was extended and give both subjects their own links. A door may retain one sentence. A specimen can become usable. A ticket can adopt the destination's visual character.

Sub-lines, paragraphs, Wolf scribbles, images, branding, and cross-links are available across the forms. They are not compulsory slots. The authoring guide supplies their writing and factual boundaries.

Most windows remain brief. The aim is a useful glimpse that rewards opening, not a complete product manual. There is no rule that every item must fill the width or occupy a whole viewport.

The default is one individually composed entry at a time. A small group of genuinely related doors is the selected exception available for exploration. A solitary door remains a valid, often stronger use of quiet space.

## Ticket interaction

Inside an expanded ticket, the outbound stub is a real external link. An ordinary unmodified same-tab activation plays the tearing movement before following that destination.

A keyboard activation deserves the same result. Modified clicks, middle click, an explicit new-tab action, downloads, reduced motion, or an animation failure retain ordinary link behavior. Do not open a blank tab and hope a later animation callback can repair it.

After returning to the page, the stub should be whole and usable again. A torn decoration must not become a permanently missing navigation control.

The compact ticket does none of this. It opens its own Endless window.

## What visual judgment remains

The behavior is selected. The remaining design freedom concerns the exact scattering curves and tempo, the composition of the empty space, the final signpost versus `#` appearance, and whether a particular set of real doors benefits from grouping.

These are fitting and tuning decisions, not an invitation to restore a populated Pile, reroll Endless, replace the slow reveal with instant content, make compact objects perform different actions, or reduce expanded windows to generic descriptions.

The first implementation should make the complete joined experience available for inspection. It should not deliver only a scattering animation with dead links, or only a working list with the selected motion left to an unspecified later pass.

## Acceptance in the real page

A successful implementation lets a visitor open the whole collection, select a compact object, arrive through an entry link, follow an internal relationship, visit a ticket destination, return, and close again without losing orientation or access.

Inspect the empty Pile as a designed scene, the actual growth and retraction of document space, the easing of short and long entry journeys, the path-side markers on narrow screens, and the relationship between content density and visual rhythm.

The technical plan carries the concrete verification cases. The screenshots and this return establish direction; only the implemented page can establish whether the motion actually feels right.
