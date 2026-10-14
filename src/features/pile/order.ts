/**
 * Endless order: the curated, stable sequence of the whole collection. Moving a line moves an entry without changing
 * its id or address. Every entry in src/content/pile/ appears here exactly once; the build refuses otherwise.
 */
export const ENDLESS_ORDER = [
  'shortcuts',
  'xkcd',
  'ex-tree',
  'tunnel',
  'ex-fork',
  'receipt',
  'baumhaus',
  'ex-dice',
  'ex-recipe',
  'rpgm',
  'ex-rename',
  'ex-quiet',
  'ex-notebook',
  'ex-sky',
  'ex-playlist',
  'ex-weather',
  'ex-changelog',
  'ex-tabnap',
  'ex-mood',
] as const;
