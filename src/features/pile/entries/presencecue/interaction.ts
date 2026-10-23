/**
 * PresenceCue: choose a cue and watch Discord follow it; set your own presence and watch it hold while the cues keep
 * changing, until you let them take over again. State changes are immediate; nothing animates, so reduced motion needs
 * no special case. The controls are hidden in the markup and revealed here once the handlers exist.
 */
import type { InteractionModule } from '../../client/interactions';

type Cue = 'work' | 'play' | 'away';

interface Presence {
  status: string;
  rich: string;
  detail: string;
  owner: string;
}

interface CueScene extends Presence {
  source: string;
  label: string;
  state: string;
}

const CUES: Record<Cue, CueScene> = {
  work: { source: 'iPhone Focus', label: 'Work', state: 'Focus is on', status: 'Do not disturb', rich: 'Making things.', detail: 'Room for a little concentration.', owner: 'Following Work Focus' },
  play: { source: 'Your PC', label: 'A game opens', state: 'Time for a round', status: 'Online', rich: 'One more round.', detail: 'Probably. No promises.', owner: 'Following the game' },
  away: { source: 'Your schedule', label: 'Quiet hours', state: 'The evening is yours', status: 'Invisible', rich: 'Nothing shared.', detail: 'Rich Presence cleared.', owner: 'Following quiet hours' },
};

const MANUAL: Presence = { status: 'Idle', rich: 'Taking a break.', detail: 'Back when I’m back.', owner: 'Set by you · cues can wait' };

const isCue = (value: string | undefined): value is Cue => value === 'work' || value === 'play' || value === 'away';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const scene = root.querySelector<HTMLElement>('[data-cue-mode]');
  const manualButton = root.querySelector<HTMLButtonElement>('[data-manual-toggle]');
  const cueButtons = [...root.querySelectorAll<HTMLButtonElement>('button[data-cue]')];
  if (!scene || !manualButton || cueButtons.length === 0) return;

  const setText = (selector: string, value: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  let current: Cue = 'work';
  let manual = false;

  const render = () => {
    const cue = CUES[current];
    const presence: Presence = manual ? MANUAL : cue;
    scene.dataset.cueMode = current;
    scene.dataset.manual = String(manual);
    setText('[data-cue-source]', cue.source);
    setText('[data-cue-label]', cue.label);
    setText('[data-cue-state]', cue.state);
    setText('[data-cue-status]', presence.status);
    setText('[data-cue-rich]', presence.rich);
    setText('[data-cue-rich-detail]', presence.detail);
    setText('[data-cue-owner]', presence.owner);
    cueButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cue === current)));
    manualButton.setAttribute('aria-pressed', String(manual));
    manualButton.textContent = manual ? 'Let cues take over again' : 'Set my own: Taking a break.';
    setText('[data-cue-announcement]', `${cue.label}. Discord: ${presence.status}. Rich Presence: ${presence.rich} ${presence.owner}.`);
  };

  cueButtons.forEach((button) => button.addEventListener('click', () => {
    const next = button.dataset.cue;
    if (!isCue(next)) return;
    current = next;
    render();
  }, { signal }));
  manualButton.addEventListener('click', () => {
    manual = !manual;
    render();
  }, { signal });

  root.querySelectorAll<HTMLElement>('[data-enhancement]').forEach((control) => { control.hidden = false; });
};
