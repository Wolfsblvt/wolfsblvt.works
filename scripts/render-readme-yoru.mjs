/** Export the maintained Yoru presence sheet's wave and idle frame without changing the artwork. */
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'docs/assets/readme');
const source = resolve(root, 'design/yoru/sheets');
const manifest = JSON.parse(await readFile(resolve(source, 'presence.json'), 'utf8'));
const sheet = await readFile(resolve(source, manifest.sheet));
const { width, height } = manifest.cell;
const idle = { row: manifest.clips.idle.row, column: 0 };
const wave = manifest.clips.wave;
const frames = [idle, ...Array.from({ length: wave.frames }, (_, column) => ({ row: wave.row, column })), idle];
// Round the cumulative timeline to GIF's 10 ms units, retaining the authored total duration to the nearest tick.
let elapsed = 600;
let previous = 600;
const delay = [600, ...wave.durations.map((duration) => {
  elapsed += duration;
  const end = Math.round(elapsed / 10) * 10;
  const durationMs = end - previous;
  previous = end;
  return durationMs;
}), 600];
const pixels = await Promise.all(frames.map(({ row, column }) => sharp(sheet)
  .extract({ left: column * width, top: row * height, width, height })
  .ensureAlpha().raw().toBuffer()));

await mkdir(output, { recursive: true });
await sharp(pixels[0], { raw: { width, height, channels: 4 } })
  .png().toFile(resolve(output, 'yoru-still.png'));
await sharp(Buffer.concat(pixels), { raw: { width, height: height * frames.length, channels: 4, pageHeight: height } })
  .gif({ loop: 1, delay, effort: 10, dither: 0 })
  .toFile(resolve(output, 'yoru-hello.gif'));

console.log(`Rendered ${frames.length} frames at ${width}×${height}; one greeting, then still.`);
