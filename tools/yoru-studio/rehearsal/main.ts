/**
 * The resident rehearsal: Yoru's real engine on a small stand-in page, served by the studio (never built into the
 * site). A floor, a ledge he can hop onto, a nook to sleep in and a pebble to inspect; poke him, remove the ledge
 * under him, slow time down, switch to reduced motion, and read the trace of what he chose and why.
 */
import { ClipLibrary, type SheetManifest } from '../../../src/features/yoru/clips';
import { SpritePlayer } from '../../../src/features/yoru/player';
import { browserMemory, newAcquaintance, welcomeBack } from '../../../src/features/yoru/memory';
import { Resident } from '../../../src/features/yoru/resident';
import type { Place, Surface, World } from '../../../src/features/yoru/world';

const stage = document.querySelector<HTMLElement>('[data-stage]')!;
const log = document.querySelector<HTMLElement>('[data-log]')!;
const readout = document.querySelector<HTMLElement>('[data-state]')!;

/** A place backed by an element on the stage: its top edge is the surface. */
function boxPlace(id: string, kind: Place['kind'], selector: string, extra: Partial<Place> = {}): Place {
  return {
    id,
    kind,
    surface(): Surface | null {
      const el = stage.querySelector<HTMLElement>(selector);
      if (!el || el.hidden) return null;
      return { left: el.offsetLeft + 12, right: el.offsetLeft + el.offsetWidth - 12, y: el.offsetTop };
    },
    ...extra,
  };
}

const world: World = {
  places: [
    boxPlace('floor', 'ground', '[data-floor]', {
      curiosities: () => {
        const pebble = stage.querySelector<HTMLElement>('[data-pebble]');
        return pebble ? [{ id: 'pebble', x: pebble.offsetLeft + pebble.offsetWidth / 2 }] : [];
      },
    }),
    {
      // His nook: the surface is the dent in his cushion, so a nap here is on it.
      id: 'nook',
      kind: 'nook',
      restful: true,
      surface(): Surface | null {
        const nook = stage.querySelector<HTMLElement>('[data-nook]');
        if (!nook) return null;
        const centre = nook.offsetLeft + nook.offsetWidth / 2;
        return { left: centre - 28, right: centre + 28, y: nook.offsetTop - 26 };
      },
    },
    boxPlace('ledge', 'perch', '[data-ledge]', { restful: true }),
    {
      // Borrowed Coast's window: he sits behind its lower edge, inside its layer, so the frame clips and covers him.
      id: 'coast',
      kind: 'guest',
      surface(): Surface | null {
        const win = stage.querySelector<HTMLElement>('[data-window]');
        if (!win || win.hidden) return null;
        const left = win.offsetLeft + win.offsetWidth * 0.08;
        return { left, right: win.offsetLeft + win.offsetWidth * 0.7, y: win.offsetTop + win.offsetHeight + 2 };
      },
      layer() {
        const win = stage.querySelector<HTMLElement>('[data-window]');
        const layer = win?.querySelector<HTMLElement>('[data-window-layer]');
        return win && layer ? { element: layer, origin: { x: win.offsetLeft, y: win.offsetTop } } : null;
      },
    },
  ],
  links: [
    { from: 'floor', to: 'nook', way: 'walk', at: 'right', arrive: 0.05 },
    { from: 'nook', to: 'floor', way: 'walk', at: 'left', arrive: 0.95 },
    { from: 'floor', to: 'ledge', way: 'hop', at: 'left', arrive: 0.8 },
    { from: 'ledge', to: 'floor', way: 'hop', at: 'right', arrive: 0.08 },
    // Into the window from the floor below its right side, and out again from the sill's right end.
    { from: 'floor', to: 'coast', way: 'hop', at: 'left', leave: 0.74, arrive: 0.85 },
    { from: 'coast', to: 'floor', way: 'hop', at: 'right', arrive: 0.8 },
  ],
};

async function loadClips(): Promise<ClipLibrary> {
  // The studio lists the families that are packed; the newest look comes first, v1 only stands in for gaps.
  const packed = (await (await fetch('/sheets/')).json()) as string[];
  const families = await Promise.all(packed.map(async (family) => ({
    manifest: (await (await fetch(`/sheets/${family}.json`)).json()) as SheetManifest,
    sheetUrl: `/sheets/${family}.webp`,
  })));
  return new ClipLibrary(families);
}

let resident: Resident | null = null;
const memory = browserMemory((() => { try { return window.localStorage; } catch { return null; } })());
const today = () => new Date().toISOString().slice(0, 10);
const rememberBox = document.querySelector<HTMLInputElement>('[data-remember]')!;
rememberBox.checked = memory.load() !== null;
let player: SpritePlayer | null = null;

function trace(line: string): void {
  const row = document.createElement('div');
  row.textContent = `${(performance.now() / 1000).toFixed(1).padStart(6)}s  ${line}`;
  log.prepend(row);
  while (log.childElementCount > 200) log.lastElementChild!.remove();
}

/** Scenes whose keepsake appears in the nook once he has visited them with remembering on. */
const KEEPSAKES: Record<string, number> = { coast: 0 };

/** Draws the nook's props with the same player code, holding one frame each. */
function furnishNook(clips: ClipLibrary): void {
  const nook = stage.querySelector<HTMLElement>('[data-nook]')!;
  stage.querySelectorAll('[data-nook-prop]').forEach((el) => el.remove());
  if (!clips.has('nook/cushion')) return;
  const centre = nook.offsetLeft + nook.offsetWidth / 2;
  const place = (clip: string, frame: number, x: number) => {
    const el = document.createElement('div');
    el.dataset['nookProp'] = '';
    el.style.zIndex = '1';
    stage.append(el);
    const p = new SpritePlayer(el);
    el.style.pointerEvents = 'none'; // scenery, not something to poke
    p.hold(clips.get(clip), frame);
    p.moveTo(x, nook.offsetTop + 4);
  };
  place('nook/cushion', 0, centre);
  const known = memory.load()?.discovered ?? [];
  known.filter((id) => id in KEEPSAKES).forEach((id, i) => {
    if (clips.has('nook/keepsakes')) place('nook/keepsakes', KEEPSAKES[id]!, centre + 80 + i * 26);
  });
}

async function boot(): Promise<void> {
  resident?.stop();
  stage.querySelector('[data-yoru]')?.remove();
  const clips = await loadClips();
  furnishNook(clips);
  const el = document.createElement('button');
  el.type = 'button';
  el.dataset['yoru'] = '';
  el.className = 'yoru';
  el.setAttribute('aria-label', 'Yoru. Poke him.');
  stage.append(el);
  player = new SpritePlayer(el);
  player.tempo = Number(document.querySelector<HTMLInputElement>('[data-tempo]')!.value);
  resident = new Resident({
    player,
    clips,
    world,
    start: { place: 'floor', at: 0.6 },
    seed: Number(document.querySelector<HTMLInputElement>('[data-seed]')!.value) || 1,
    reducedMotion: document.querySelector<HTMLInputElement>('[data-reduced]')!.checked,
    acquaintance: (() => { const r = memory.load(); return r ? welcomeBack(r, today()) : null; })(),
    trace,
  });
  el.addEventListener('click', () => resident?.poke());
  resident.start();
  trace('— start —');
}

document.querySelector('[data-restart]')!.addEventListener('click', () => void boot());
document.querySelector('[data-invite]')!.addEventListener('click', () => resident?.invite('coast'));
// Switching the chart's view is a scene change he can notice while watching.
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
  button.addEventListener('click', () => {
    document.querySelector<HTMLImageElement>('[data-window-img]')!.src = `/walk-assets/borrowed-coast/window-${button.dataset['mode']}.png`;
    for (const b of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) b.setAttribute('aria-pressed', String(b === button));
    resident?.sceneChanged('coast');
  });
}
rememberBox.addEventListener('change', () => {
  if (rememberBox.checked) {
    const fresh = newAcquaintance(today());
    memory.save(fresh);
    resident?.setAcquaintance(fresh);
    trace('remembering on');
  } else {
    memory.forget();
    resident?.setAcquaintance(null);
    trace('remembering off: forgotten');
  }
});
const keep = () => { const r = resident?.remember(); if (r) memory.save(r); };
setInterval(keep, 15000);
addEventListener('pagehide', keep);
document.querySelector('[data-reduced]')!.addEventListener('change', () => void boot());
document.querySelector<HTMLInputElement>('[data-tempo]')!.addEventListener('input', (e) => {
  const tempo = Number((e.target as HTMLInputElement).value);
  if (player) player.tempo = tempo;
  document.querySelector('[data-tempo-out]')!.textContent = `${tempo.toFixed(1)}×`;
});
document.querySelector('[data-toggle-ledge]')!.addEventListener('click', () => {
  const ledge = stage.querySelector<HTMLElement>('[data-ledge]')!;
  ledge.hidden = !ledge.hidden;
  resident?.layoutChanged();
});
new ResizeObserver(() => resident?.layoutChanged()).observe(stage);
setInterval(() => {
  if (!resident) return;
  const s = resident.state;
  const known = memory.load();
  readout.textContent = `${s.place} @ ${s.at.toFixed(2)} · ${s.posture} · rest ${s.rest.toFixed(2)} · curiosity ${s.curiosity.toFixed(2)} · wariness ${s.wariness.toFixed(2)}${known ? ` · familiarity ${known.familiarity.toFixed(2)}` : ' · not remembering'}`;
}, 250);

void boot();
