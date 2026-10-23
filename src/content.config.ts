/**
 * The Pile's public collection. One Markdown file per entry under src/content/pile/: frontmatter carries the entry's
 * form, daily eligibility and links; the body is its Endless paragraph(s). Endless order is the explicit list in
 * src/features/pile/order.ts, never filesystem or date order. An entry with its own scene (Compact.astro or
 * Expanded.astro under src/features/pile/entries/<id>/) still declares a form: the form decides its footprint on the
 * desk, its tilt and its default presentation wherever a scene is absent. See docs/pile/pile-authoring-guide.md.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const mark = z.object({
  /** One or two characters shown on the tile where no artwork is used. */
  letter: z.string().min(1).max(2),
  tint: z.string().regex(/^#[0-9a-f]{6}$/i),
});

const form = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('thought'), question: z.boolean().default(false) }),
  z.object({
    kind: z.literal('note'),
    preset: z.enum(['short-slip', 'wide-note', 'torn-sheet', 'folded-note']),
    lettering: z.enum(['handwritten', 'typed']),
  }),
  z.object({
    kind: z.literal('chip'),
    /** The default tile; a chip with its own scene carries real artwork instead. */
    mark: mark.optional(),
    platform: z.string(),
    /** A coloured strip window in Endless instead of the icon-and-glimpse layout. */
    strip: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  }),
  z.object({
    kind: z.literal('artifact'),
    caption: z.string().optional(),
    excerpt: z.string().optional(),
    example: z.string().optional(),
  }),
  z.object({ kind: z.literal('lineage'), from: z.string(), relationship: z.string() }),
  z.object({ kind: z.literal('door'), caption: z.string() }),
  z.object({ kind: z.literal('specimen') }),
  z.object({
    kind: z.literal('site'),
    domain: z.string(),
    mark,
    background: z.string().regex(/^#[0-9a-f]{6}$/i),
    /** The link whose destination the ticket's outbound stub carries. */
    destination: z.string(),
  }),
]);

const link = z.union([
  z.object({ id: z.string().regex(ID), kind: z.enum(['source', 'site', 'app', 'docs', 'community', 'download', 'upstream', 'related']), label: z.string(), href: z.url() }),
  z.object({ id: z.string().regex(ID), kind: z.literal('related'), label: z.string(), entry: reference('pile') }),
]);

const pile = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pile' }),
  schema: z.object({
    title: z.string(),
    form,
    daily: z.object({ include: z.boolean(), footprint: z.enum(['small', 'medium', 'large']) }),
    subline: z.string().optional(),
    scribble: z.string().optional(),
    standing: z.string().optional(),
    links: z.array(link).default([]),
    /** Unreplaced scaffolding, never a composed scene. Shown marked; the publication check refuses while any remain. */
    illustrative: z.boolean().default(false),
  }),
});

export const collections = { pile };
