# Yoru's sprites

## Meaning

The source for Yoru's animation: who he is, what each animation should show, and the registered sprite sheets the
site will play. New animation is generated with the same image engine that drew him in May, then cleaned, cut and
registered by the deterministic studio in [`tools/yoru-studio/`](../../tools/yoru-studio/studio.mjs). This folder is a
candidate on `feat/yoru-resident-life`; the live site still plays the v1 atlas in `design/the-walk/assets/`.

| Path | What it is |
| --- | --- |
| [`character.md`](character.md) | The character sheet and the identity lock every generation carries. Start here. |
| `reference/canonical-base.png` | The May base image every original row was drawn from. The visual source of truth. |
| `reference/key-*.png` | Accepted key poses other clips are anchored to, such as the curled sleep. |
| [`families/`](families/) | One JSON spec per animation family: its clips, their key poses, timing and scale anchor. |
| `sheets/` | Packed results: a lossless WebP sheet at twice display size and a JSON manifest per family. |

Raw generations, cut frames and the studio page live in the ignored `artifacts/yoru-studio/`. They are working
material; what the site needs is the packed sheet.

## How a family is made

```sh
npm run yoru -- generate sleep settle --count=2   # two candidates through codex exec
npm run yoru -- serve                             # http://localhost:4390: every candidate, played at site size
npm run yoru -- select sleep settle <run>         # the chosen run becomes the clip
npm run yoru -- pack sleep                        # design/yoru/sheets/sleep.webp and .json
```

`generate` runs `codex exec` once per candidate (model `gpt-6-luna`, reasoning high, read-only sandbox) with the
character's identity lock, the clip's key poses, the canonical base, a layout guide and any reference poses attached.
Codex draws one sheet on flat magenta with its built-in image tool, using the ChatGPT plan signed in on this machine;
no API key is involved. The studio then:

1. **Mattes** the magenta away by un-mixing each edge pixel into alpha and its true colour. A hard threshold, as in
   May, leaves the purple outline the v1 sprites have.
2. **Cuts** the sheet into frames from connected pieces, so a tail reaching into the next slot is not sliced, and
   drops detached specks.
3. **Registers** every frame at one shared scale. Standing Yoru is 198 px tall in master pixels. A clip's `scale`
   names one anchor frame: by default a standing pose, matched by silhouette against the canonical base; or
   `"match": "settle#-1"`, matched by silhouette against another clip's registered frame in the same pose. Silhouettes,
   not bounding boxes: an ear tip or tail tuft decides a box and would make him shrink and grow between clips. A
   `height` fraction is the fallback for a pose with nothing to match yet, and `endHeight` adds a second anchor at the
   clip's end when the generator drew him slowly shrinking across the sheet.
4. **Steadies** the frames. Feet go on the floor line; horizontally each frame is aligned to its neighbour (a loop to
   its first frame) by silhouette overlap, and a transition's accumulated drift is removed so it still starts and ends
   where its neighbours expect. `"stabilize": "none"` keeps the generator's placement.
5. Writes a contact sheet per run and warnings for anything that needs a look: frames that reach the image edge or
   leave the cell, detached pieces, leftover magenta, and colours that drift from the canonical Yoru (brown fur and
   pink ears are the generator's usual way of losing him).

`npm run yoru -- montage <family> [clip] [--strips]` stacks every run's contact sheet (or raw sheet) into one image
for reviewing a whole batch.

## Writing a clip

A clip lists **key poses** (`beats`), each one clear step of the action. `inbetweens` asks the generator to draw that
many intermediate poses between neighbouring keys; per-key `durations` are then shared with the in-betweens, so they
make motion smoother without changing its tempo. More frames per sheet leave fewer pixels per frame; keep in-betweens
only where they hold the same fidelity as key-only clips.

Say directions as "faces the left edge of the image", not "faces left": the generator reads the second as his left
and turns him the other way. Things he touches that belong to the site (a Pile piece, a ledge, a hanging tag) are
never drawn; the clip says where in front of him the empty spot is, and the resident puts the real object there.

Two key channels go further than an empty spot. A clip with a `prop` has the generator paint it in flat green and a
clip with `scenery` paints it in flat blue; the studio removes both like the background, so Yoru comes out alone,
and records where they were in every frame (`props` and `scenery` in the manifest). `"ground": "scenery"` uses the
blue's top edge as the floor, so a ledge stays put while he steps down past it. Use the channels for things that
stay still while he moves (the hanging ladder, the ledge); draw the real object when it moves with him.

A family with `"subject": "prop"` draws things from his world instead of Yoru: a `propDescription` replaces the
identity lock, the style anchor goes along as rendering style only, and `"scale": { "pixels": n }` gives its size.
Props that a clip must match (the ladder) are attached to that clip as references, so every clip draws the same one.

Transitions connect through shared poses. A clip that starts or ends in another clip's pose attaches it as a
reference (`reference/key-*.png` or `"frame": "family/clip#n"`) and matches its scale to it. Write waking as its own
movement, not settling reversed, and write left-facing poses as drawn poses rather than mirrors: he is asymmetric.

Check every candidate in the studio at 1× on both backgrounds, with the floor line and standing Yoru for scale,
before selecting it. A clean contact sheet does not show jitter, sliding feet or a face that changes between frames.

## Stills

Static artwork that shows Yoru (the home page's social card) uses a still from `design/yoru/stills/`, not a frame of
an old sheet. `npm run yoru -- cutout <source.png> <out.png>` mattes a drawing on flat magenta the way frames are
matted, keeps the figure and crops to him; `stills/standing.png` is cut from the sprites' style anchor
(`reference/style-standing.png`), so the card shows him as the site draws him. Re-render the cards with
`npm run cards` after changing a still.

## Tempo

A clip's `durations` set its rhythm; its `tempo` sets how fast the whole clip runs on the site (1 as written, 0.8 a
fifth slower), applied when the sheet is packed. A walk or run also has a `stride`: the CSS pixels one full cycle
carries him. The resident moves him by the frame, not by the millisecond, so a slower walk is a slower walk and his
feet stay planted. Set both by eye on the tempo board, which plays every clip the site uses at its real size and
saves each change to the clip's spec:

```sh
npm run yoru -- serve      # then http://localhost:4390/tempo/
npm run yoru -- pack <family>
```

## Families

| Family | Clips | Standing |
| --- | --- | --- |
| `v1` | The nine May rows, imported from their raw strips and re-cut | Historical; the newer engine draws him differently, so `presence` replaces it |
| `sleep` | `settle`, `sleep` (loop), `wake` | Selected and packed |
| `everyday` | walks, turns, sit-down, sit, stand-up, yawn, groom | Selected and packed |
| `presence` | idle, look, run left and right, wave, hop, think | Selected and packed |
| `curious` | inspect, nudge off a ledge, bat at something hanging | Selected and packed |
| `reactions` | unimpressed stare, startle, peek from behind an edge | Selected and packed |
| `codex` | jumping, failed, waiting, working: the desktop pet's own states | Selected and packed |
| `guest` | look-in, sit-in, watch, notice, rise: a visit inside a project window | Selected and packed |
| `nook` | his cushion and four keepsakes (prop family) | Selected and packed |
| `ladder-prop` | the folding ladder, open and folded (prop family) | Selected and packed |
| `ladder` | produce, mount, climb, dismount, stow | Round two: the real ladder where it moves with him, green ladder and blue ledge where it hangs |

Two more things are made from the packed sheets:

- **Codex desktop pet.** `npm run yoru -- export-codex [--install]` assembles the 8 × 9 Codex atlas from the selected
  clips, one scale per row, and with `--install` replaces `~/.codex/pets/yoru` after keeping the previous pet in
  `~/.codex/pets-backup/`.
- **The resident.** `src/features/yoru` is the engine that plays these sheets on the site. `npm run yoru -- serve`
  also serves a rehearsal at `/rehearsal/` that runs it on a stand-in page, outside the site build.
