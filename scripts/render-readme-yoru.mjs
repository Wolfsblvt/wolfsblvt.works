/** Export the accepted v1 resident's wave and idle frame without changing the artwork. */
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'docs/assets/readme');
const sheet = await readFile(resolve(root, 'design/the-walk/assets/yoru-spritesheet.webp'));
const width = 192;
const height = 208;
const idle = { row: 0, column: 0 };
// src/styles/base.css: s-wave uses row 3, four frames, over 700 ms at display size 96x104.
const frames = [idle, ...Array.from({ length: 4 }, (_, column) => ({ row: 3, column })), idle];
// GIF delays use 10 ms units; alternate around 175 ms to retain the 700 ms wave.
const delay = [600, 170, 180, 170, 180, 600];
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
