/**
 * Entries with their own presentation. A subject whose default form can't carry it (a village, an atlas, a sea) adds
 * `Compact.astro` and/or `Expanded.astro` under entries/<id>/; discovery is by file, so adding a scene is adding a
 * file, not a registry line. Scenes are ordinary trusted website source composed at build time. An ordinary entry has
 * no scene and uses its form's default in components/Compact.astro and components/EndlessEntry.astro.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (...args: any[]) => any;

const compact = import.meta.glob<{ default: AstroComponent }>('./entries/*/Compact.astro', { eager: true });
const expanded = import.meta.glob<{ default: AstroComponent }>('./entries/*/Expanded.astro', { eager: true });

const idOf = (path: string) => path.split('/').at(-2)!;
const byId = (modules: Record<string, { default: AstroComponent }>) =>
  new Map(Object.entries(modules).map(([path, module]) => [idOf(path), module.default]));

const COMPACT = byId(compact);
const EXPANDED = byId(expanded);

export function sceneFor(id: string): { Compact?: AstroComponent; Expanded?: AstroComponent } {
  return { Compact: COMPACT.get(id), Expanded: EXPANDED.get(id) };
}

/** Every entry id that has at least one scene; the catalogue checks these against the collection. */
export const SCENE_IDS: ReadonlySet<string> = new Set([...COMPACT.keys(), ...EXPANDED.keys()]);
