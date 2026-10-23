/**
 * sOS Second Shift: Play, Work or Sleep, and the machine answers with its display, workload rows, lamps and caption
 * all at once. State changes are immediate; nothing animates, so reduced motion needs no special case. The buttons
 * are hidden in the markup and revealed here once the handler exists.
 */
import type { InteractionModule } from '../../client/interactions';

type Shift = 'play' | 'work' | 'sleep';

interface ShiftScene {
  title: string;
  detail: string;
  services: string;
  jobs: string;
  gaming: string;
  caption: string;
}

const SHIFTS: Record<Shift, ShiftScene> = {
  play: { title: 'Game first.', detail: 'Background work makes room for the game.', services: 'Light on its feet', jobs: 'Yielding safely', gaming: 'Right of way', caption: 'A second shift. Not a career change.' },
  work: { title: 'The house has a few jobs.', detail: 'Useful services. Background jobs. The box you already own.', services: 'Available', jobs: 'Making progress', gaming: 'Ready when you are', caption: 'Useful work, on the machine you already own.' },
  sleep: { title: 'Nothing needs the machine.', detail: 'Let it rest.', services: 'Nothing pending', jobs: 'All done for now', gaming: 'Until next time', caption: 'A quiet machine is a perfectly good outcome.' },
};

const isShift = (value: string | undefined): value is Shift => value === 'play' || value === 'work' || value === 'sleep';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const machine = root.querySelector<HTMLElement>('[data-machine-mode]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-shift]')];
  const lamps = [...root.querySelectorAll<HTMLElement>('[data-lamp]')];
  if (!machine || buttons.length === 0) return;

  const setText = (selector: string, value: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  const show = (mode: Shift) => {
    const scene = SHIFTS[mode];
    machine.dataset.machineMode = mode;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.shift === mode)));
    lamps.forEach((lamp) => lamp.classList.toggle('lit', lamp.dataset.lamp === mode));
    setText('[data-machine-label]', mode.toUpperCase());
    setText('[data-machine-title]', scene.title);
    setText('[data-machine-detail]', scene.detail);
    setText('[data-service-posture]', scene.services);
    setText('[data-jobs-posture]', scene.jobs);
    setText('[data-gaming-posture]', scene.gaming);
    setText('[data-machine-caption]', scene.caption);
  };

  buttons.forEach((button) => button.addEventListener('click', () => {
    const mode = button.dataset.shift;
    if (isShift(mode)) show(mode);
  }, { signal }));

  root.querySelectorAll<HTMLElement>('[data-enhancement]').forEach((control) => { control.hidden = false; });
};
