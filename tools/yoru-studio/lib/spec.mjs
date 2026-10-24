// Family specs, the generation prompt and the layout guide.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** Standing Yoru, ear tips to feet, in master pixels (twice the size the site shows him). Matches the v1 atlas. */
export const STANDING_HEIGHT = 198;

export const KEY = '#FF00FF';

/** The prop channel's key colour; see processRun in studio.mjs. */
export const PROP_KEY = '#00FF00';

/** The scenery channel's key colour, for the part of the site an action needs drawn (a ledge). */
export const SCENERY_KEY = '#0000FF';

export function paths(root) {
  const design = join(root, 'design', 'yoru');
  const work = join(root, 'artifacts', 'yoru-studio');
  return {
    design,
    character: join(design, 'character.md'),
    families: join(design, 'families'),
    sheets: join(design, 'sheets'),
    reference: join(design, 'reference'),
    work,
    runs: join(work, 'runs'),
    frames: join(work, 'frames'),
    guides: join(work, 'guides'),
    preview: join(work, 'preview'),
  };
}

/** The identity lock from the character sheet: the visible description sent with every generation. */
export function identityLock(characterPath) {
  const text = readFileSync(characterPath, 'utf8');
  const m = /<!-- identity-lock:start -->\s*([\s\S]*?)\s*<!-- identity-lock:end -->/.exec(text);
  if (!m) throw new Error(`${characterPath} has no identity-lock block`);
  return m[1].replace(/\s+/g, ' ').trim();
}

export function loadFamily(p, id) {
  const file = join(p.families, `${id}.json`);
  const family = JSON.parse(readFileSync(file, 'utf8'));
  if (family.family !== id) throw new Error(`${file} declares family "${family.family}"`);
  for (const clip of family.clips) {
    const { cols, rows = 1 } = clip.layout ?? { cols: clip.frames };
    if (cols * rows !== clip.frames) throw new Error(`${id}/${clip.id}: layout ${cols}×${rows} is not ${clip.frames} frames`);
    if (clip.beats && frameCount(clip) !== clip.frames) {
      throw new Error(`${id}/${clip.id}: ${clip.beats.length} key poses with ${clip.inbetweens ?? 0} in-betweens make ${frameCount(clip)} frames, not ${clip.frames}`);
    }
  }
  return { ...family, file };
}

/**
 * Frames a clip's key poses expand to. Between consecutive keys sit `inbetweens` drawn in-between frames; a loop also
 * has them between its last key and its first.
 */
export function frameCount(clip) {
  const keys = clip.beats?.length ?? clip.frames;
  const n = clip.inbetweens ?? 0;
  return clip.loop ? keys * (1 + n) : keys + (keys - 1) * n;
}

/** What each frame shows: a key pose, or an in-between of two keys. */
export function frameScript(clip) {
  const n = clip.inbetweens ?? 0;
  const keys = clip.beats;
  const frames = [];
  keys.forEach((beat, k) => {
    frames.push({ key: k, text: beat });
    const next = k + 1 < keys.length ? k + 1 : clip.loop ? 0 : null;
    if (next === null) return;
    for (let j = 1; j <= n; j++) frames.push({ between: [k, next], step: j, of: n + 1 });
  });
  return frames;
}

/**
 * Frame durations. Given one duration per key pose, a key and the in-betweens after it share that key's time, so
 * adding in-betweens makes the motion smoother without making it slower or faster.
 */
export function clipDurations(clip) {
  const d = clip.durations ?? 140;
  if (!Array.isArray(d)) return Array(clip.frames).fill(d);
  if (d.length === clip.frames) return d;
  if (clip.beats && d.length === clip.beats.length) {
    const script = frameScript(clip);
    const owner = (f) => f.key ?? f.between[0];
    const groupSize = (k) => script.filter((f) => owner(f) === k).length;
    return script.map((f) => Math.round(d[owner(f)] / groupSize(owner(f))));
  }
  throw new Error(`${clip.id}: ${d.length} durations for ${clip.frames} frames`);
}

export function saveFamily(family) {
  const { file, ...data } = family;
  writeFileSync(file, `${formatJson(data)}\n`);
}

/** JSON as people write it: two-space indent, but short arrays and small objects of plain values on one line. */
export function formatJson(value) {
  return JSON.stringify(value, null, 2).replace(/([[{])\n\s*([^[\]{}]*?)\n\s*([\]}])/g, (match, open, body, close) => {
    const inline = `${open}${open === '{' ? ' ' : ''}${body.split(/,\n\s*/).join(', ')}${close === '}' ? ' ' : ''}${close}`;
    return inline.length <= 100 ? inline : match;
  });
}

export const clipLayout = (clip) => ({ rows: 1, ...(clip.layout ?? { cols: clip.frames }) });

/**
 * The prompt for one clip. Attachments are listed in the order they are passed to Codex, so their roles can be named.
 *
 * @param {{ lock: string, family: object, clip: object, attachments: Array<{ role: string }> }} input
 */
export function clipPrompt({ lock, family, clip, attachments }) {
  const { cols, rows } = clipLayout(clip);
  const grid = rows === 1
    ? `exactly ${clip.frames} frames in one row, left to right`
    : `exactly ${clip.frames} frames in a grid of ${rows} rows by ${cols} columns, read left to right, then top to bottom`;
  const lines = [
    'Use your built-in image generation tool exactly once to create one image. Do not run shell commands, edit files or write code.',
    '',
    'Attached images, in order:',
    ...attachments.map((a, i) => `${i + 1}. ${a.role}`),
    '',
    ...(family.subject === 'prop'
      ? [
        `Create one sprite sheet of a prop from Yoru's world: "${clip.id}" (${family.title}), ${grid}. Each frame sits in its own invisible equal slot with generous padding, at the same size and scale in every frame, resting on one shared floor line. No character appears.`,
        '',
        `Style and world: ${family.propDescription}`,
      ]
      : [
        `Create one sprite animation sheet of Yoru: "${clip.id}" (${family.title}), ${grid}. Each frame sits in its own invisible equal slot, the whole body inside the slot with generous padding, no overlap between frames, and the same size and scale for Yoru in every frame. All frames share one floor line, as if standing on the same ground.`,
        '',
        `Identity, identical in every frame: ${lock}`,
      ]),
    '',
    `Action: ${clip.action}`,
  ];
  if (clip.beats) {
    const script = frameScript(clip);
    const numberOf = (k) => script.findIndex((f) => f.key === k) + 1;
    lines.push('', clip.inbetweens
      ? `Frames: the key poses are given below; every in-between frame is a smooth intermediate pose exactly part-way between its two neighbouring key poses, so the animation plays fluidly. In-betweens change the pose only slightly; they introduce nothing new.`
      : 'Frames:');
    script.forEach((f, i) => {
      if (f.key !== undefined) lines.push(`${i + 1}. Key pose: ${f.text}`);
      else lines.push(`${i + 1}. In-between ${f.step} of ${f.of - 1}: ${f.of === 2 ? 'halfway' : `${f.step}/${f.of} of the way`} from frame ${numberOf(f.between[0])} to frame ${numberOf(f.between[1])}.`);
    });
  }
  if (clip.prop) {
    lines.push('', `Prop: ${clip.prop.description} It is painted as a flat, pure green ${PROP_KEY} shape with no shading, outline or texture, exactly where it would be, as a placeholder the real prop replaces later. Its shape and size must be accurate; where Yoru's paws hold it, his paws are in front of the green.`);
  }
  if (clip.scenery) {
    lines.push('', `Scenery: ${clip.scenery.description} It is painted as a flat, pure blue ${SCENERY_KEY} shape with no shading, outline or texture, in the same place in every frame, as a placeholder for the real scenery. Yoru stands on or in front of it; where he is in front of it, he covers the blue.`);
  }
  if (clip.notes) lines.push('', clip.notes);
  lines.push(
    '',
    `Output: a perfectly flat pure magenta ${KEY} background everywhere outside ${family.subject === 'prop' ? 'the prop' : 'Yoru'}${clip.prop ? ' and the green prop' : ''}${clip.scenery ? ' and the blue scenery' : ''}. No floor, ground line, shadow, glow, motion lines, dust, sparkles, symbols, text, frame borders, guide marks or scenery. No detached effects: everything drawn is part of Yoru or a prop he holds. Keep magenta and close pinks out of Yoru himself; his plum capelet stays a dark, muted plum.`,
    '',
    'When the image is done, reply with the single word: done',
  );
  return lines.join('\n');
}

/**
 * The layout guide: slot boxes, a safe margin and the floor line, on a light background, so the generator lays the
 * frames out where the cutter expects them. Attached for spacing only.
 */
export async function makeGuide(clip, cell, file) {
  const { cols, rows } = clipLayout(clip);
  const slotW = 360;
  const slotH = Math.round((slotW * cell.height) / cell.width);
  const w = slotW * cols;
  const h = slotH * rows;
  const floorY = Math.round(slotH * 0.94);
  const parts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * slotW, y = r * slotH;
      parts.push(`<rect x="${x + 1}" y="${y + 1}" width="${slotW - 2}" height="${slotH - 2}" fill="none" stroke="#222" stroke-width="2"/>`);
      parts.push(`<rect x="${x + 24}" y="${y + 18}" width="${slotW - 48}" height="${slotH - 36}" fill="none" stroke="#2f80ed" stroke-width="2"/>`);
      parts.push(`<line x1="${x + 24}" y1="${y + floorY}" x2="${x + slotW - 24}" y2="${y + floorY}" stroke="#e07020" stroke-width="3" stroke-dasharray="10 6"/>`);
      parts.push(`<line x1="${x + slotW / 2}" y1="${y + 18}" x2="${x + slotW / 2}" y2="${y + slotH - 18}" stroke="#bbb" stroke-width="2" stroke-dasharray="8 6"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#f4f4f4"/>${parts.join('')}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
  return file;
}
