/**
 * The resident rehearsal: Yoru's real engine on a small stand-in page, served by the studio (never built into the
 * site). A floor, a ledge he can hop onto, a nook to sleep in and a pebble to inspect; poke him, remove the ledge
 * under him, slow time down, switch to reduced motion, and read the trace of what he chose and why.
 */
import { ClipLibrary, type SheetManifest } from '../../../src/features/yoru/clips';
import { SpritePlayer } from '../../../src/features/yoru/player';
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
    boxPlace('nook', 'nook', '[data-nook]', { restful: true }),
    boxPlace('ledge', 'perch', '[data-ledge]', { restful: true }),
  ],
  links: [
    { from: 'floor', to: 'nook', way: 'walk', at: 'right', arrive: 0.05 },
    { from: 'nook', to: 'floor', way: 'walk', at: 'left', arrive: 0.95 },
    { from: 'floor', to: 'ledge', way: 'hop-up', at: 'left', arrive: 0.8 },
    // No way down drawn yet: he walks off the ledge's right end onto the floor. The ladder and a hop down replace this.
    { from: 'ledge', to: 'floor', way: 'walk', at: 'right', arrive: 0.02 },
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
let player: SpritePlayer | null = null;

function trace(line: string): void {
  const row = document.createElement('div');
  row.textContent = `${(performance.now() / 1000).toFixed(1).padStart(6)}s  ${line}`;
  log.prepend(row);
  while (log.childElementCount > 200) log.lastElementChild!.remove();
}

async function boot(): Promise<void> {
  resident?.stop();
  stage.querySelector('[data-yoru]')?.remove();
  const clips = await loadClips();
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
    trace,
  });
  el.addEventListener('click', () => resident?.poke());
  resident.start();
  trace('— start —');
}

document.querySelector('[data-restart]')!.addEventListener('click', () => void boot());
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
  readout.textContent = `${s.place} @ ${s.at.toFixed(2)} · ${s.posture} · rest ${s.rest.toFixed(2)} · curiosity ${s.curiosity.toFixed(2)} · wariness ${s.wariness.toFixed(2)}`;
}, 250);

void boot();
