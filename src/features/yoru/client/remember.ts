/**
 * Yoru remembering a visitor, on the page: the offer he makes, keeping the record while they are here, and what a
 * returning visitor notices. The record and its rules are memory.ts; this is how the site presents them.
 *
 * Nothing is stored until the visitor answers "remember me" (Wolf, 2026-10-24: "Build it, opt-in only"). The offer
 * comes from Yoru himself, as a handwritten note beside him, at a moment that already feels warm: when he settles in
 * his nook at the end of the home page, or after his first answer to a poke in the smaller rooms. "not today" is as
 * easy as yes, and the note does not come back on that page. A returning visitor finds keepsakes from the scenes they
 * visited together beside his cushion, his favourite resting place, and, on a new day, "oh. you again." in the hero.
 * Wolf kept the copy as drafted (2026-10-24: "The remembering copy is fine as drafted. Keep it.").
 */
import { browserMemory, newAcquaintance, welcomeBack, type Acquaintance } from '../memory';
import type { Resident } from '../resident';
import { reducedMotion } from '../../../scripts/runtime';

export const memory = browserMemory((() => { try { return window.localStorage; } catch { return null; } })());

/** The visitor's calendar day, as the record keeps it: a day, never a timestamp. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** What Yoru remembers on arrival, settled by the time away, and whether this is a new day's visit. */
export function recall(): { record: Acquaintance | null; returning: boolean } {
  const stored = memory.load();
  if (!stored) return { record: null, returning: false };
  const record = welcomeBack(stored, today());
  memory.save(record);
  return { record, returning: stored.lastSeen !== record.lastSeen };
}

/**
 * Keeps what changed while the visitor is here: when the tab is hidden or the page is left. Only a record that still
 * exists is updated, so "Forget me" (on this page or in another tab) is never undone by a page he was already on.
 */
export function keepWhileVisiting(resident: Resident): void {
  const keep = () => { const record = resident.remember(); if (record && memory.load()) memory.save(record); };
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keep(); });
}

let offered = false;

/**
 * Yoru asks, once per page, whether to remember the visitor: a note in the page's own layer, placed by `place` from
 * its size (page coordinates of its top left corner), again as the page scrolls or resizes. Nothing happens if he
 * already remembers them.
 */
export function offerToRemember(o: {
  layer: HTMLElement;
  place(size: { width: number; height: number }): { left: number; top: number };
  resident: Resident;
}): void {
  if (offered || memory.load()) return;
  offered = true;

  const note = document.createElement('div');
  note.className = 'yoru-note';
  note.setAttribute('role', 'group');
  note.setAttribute('aria-label', 'Yoru asks');
  note.innerHTML = '<p class="yoru-note-text">want me to remember you?<br>next time I’ll know you.</p>'
    + '<div class="yoru-note-acts"><button type="button" data-yes>remember me</button><button type="button" data-no>not today</button></div>';
  o.layer.append(note);
  const place = () => {
    const { left, top } = o.place({ width: note.offsetWidth, height: note.offsetHeight });
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
  };
  place();
  addEventListener('resize', place);
  addEventListener('scroll', place, { passive: true });
  requestAnimationFrame(() => note.classList.add('shown'));

  const close = (after = 0) => setTimeout(() => {
    note.classList.remove('shown');
    removeEventListener('resize', place);
    removeEventListener('scroll', place);
    setTimeout(() => note.remove(), reducedMotion() ? 0 : 400);
  }, after);

  note.querySelector('[data-yes]')!.addEventListener('click', () => {
    const record = newAcquaintance(today());
    memory.save(record);
    o.resident.setAcquaintance(record);
    note.querySelector('.yoru-note-text')!.textContent = 'okay. I’ll remember.';
    note.querySelector('.yoru-note-acts')!.remove();
    place();
    close(2600);
  });
  note.querySelector('[data-no]')!.addEventListener('click', () => close());
}
