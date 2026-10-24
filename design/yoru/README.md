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
3. **Registers** every frame at one shared scale. Standing Yoru is 198 px tall in master pixels; a clip's `scale`
   says which frame's real height is known, either as a fraction of standing height or by matching a frame of another
   clip (`"match": "settle#-1"`). Feet go on the cell's floor line and the slot centre on the pivot, so nothing pops
   or slides that the drawing did not move.
4. Writes a contact sheet per run and warnings for anything that needs a look: frames that reach the image edge,
   detached pieces, leftover magenta.

## Writing a clip

A clip lists **key poses** (`beats`), each one clear step of the action. `inbetweens` asks the generator to draw that
many intermediate poses between neighbouring keys; per-key `durations` are then shared with the in-betweens, so they
make motion smoother without changing its tempo. More frames per sheet leave fewer pixels per frame; keep in-betweens
only where they hold the same fidelity as key-only clips.

Transitions connect through shared poses. A clip that starts or ends in another clip's pose attaches it as a
reference (`reference/key-*.png` or `"frame": "family/clip#n"`) and matches its scale to it. Write waking as its own
movement, not settling reversed, and write left-facing poses as drawn poses rather than mirrors: he is asymmetric.

Check every candidate in the studio at 1× on both backgrounds, with the floor line and standing Yoru for scale,
before selecting it. A clean contact sheet does not show jitter, sliding feet or a face that changes between frames.

## Families

| Family | Clips | Standing |
| --- | --- | --- |
| `v1` | The nine May rows, imported from their raw strips and re-cut on the shared scale | Imported; heights estimated |
| `sleep` | `settle`, `sleep` (loop), `wake` | Generating |
