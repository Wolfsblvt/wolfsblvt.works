/**
 * Loads the Pile's collection in Endless order and validates the small executable contract: unique safe ids, every
 * entry ordered exactly once, related-entry links that resolve, ticket destinations that are URL links, supported
 * link schemes, and no scene without its entry. Errors name the entry and field.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { ENDLESS_ORDER } from './order';
import { SCENE_IDS } from './scenes';

export type PileEntry = CollectionEntry<'pile'>;
export type PileForm = PileEntry['data']['form'];
export type PileKind = PileForm['kind'];

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function loadCatalogue(): Promise<PileEntry[]> {
  const entries = await getCollection('pile');
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const problems: string[] = [];

  for (const entry of entries) {
    if (!ID.test(entry.id)) problems.push(`${entry.id}: id must be lowercase kebab-case`);
    if (!(ENDLESS_ORDER as readonly string[]).includes(entry.id)) problems.push(`${entry.id}: missing from src/features/pile/order.ts`);
    const linkIds = new Set<string>();
    for (const link of entry.data.links) {
      if (linkIds.has(link.id)) problems.push(`${entry.id}: duplicate link id "${link.id}"`);
      linkIds.add(link.id);
      if ('entry' in link && !byId.has(link.entry.id)) problems.push(`${entry.id}: link "${link.id}" points to unknown entry "${link.entry.id}"`);
      if ('href' in link && !/^https:\/\//.test(link.href)) problems.push(`${entry.id}: link "${link.id}" must use https`);
    }
    const form = entry.data.form;
    if (form.kind === 'site') {
      const destination = entry.data.links.find((link) => link.id === form.destination);
      if (!destination || !('href' in destination)) problems.push(`${entry.id}: form.destination must name a URL link`);
    }
  }
  const seen = new Set<string>();
  for (const id of ENDLESS_ORDER) {
    if (seen.has(id)) problems.push(`order.ts: "${id}" is listed twice`);
    seen.add(id);
    if (!byId.has(id)) problems.push(`order.ts: "${id}" has no entry in src/content/pile/`);
  }
  for (const id of SCENE_IDS) {
    if (!byId.has(id)) problems.push(`entries/${id}/: has a scene but no entry in src/content/pile/`);
  }
  if (problems.length) throw new Error(`The Pile's collection is invalid:\n- ${problems.join('\n- ')}`);

  return ENDLESS_ORDER.map((id) => byId.get(id)!);
}

/** The tile background for a lettered mark. */
export const markBackground = (tint: string) => `linear-gradient(150deg,${tint} 0%,color-mix(in oklab,${tint} 62%,#100b11) 100%)`;
