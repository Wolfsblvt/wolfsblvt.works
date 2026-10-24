// The image generator: one non-interactive Codex run that calls Codex's built-in image tool once.
//
// This is the engine that drew Yoru in May (the `$imagegen` Skill's default path), reached through `codex exec` so it
// uses the ChatGPT plan already signed in on this machine; no API key is involved. Codex saves the image under
// `$CODEX_HOME/generated_images/<thread id>/`, a path the agent inside the run cannot report reliably, so the thread
// id is read from the JSON event stream and the folder is listed afterwards.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** The route selected for image jobs: a bounded, strongly checkable task (see the studio README). */
export const ROUTE = { model: 'gpt-6-luna', effort: 'high' };

const codexHome = () => process.env.CODEX_HOME || join(homedir(), '.codex');

/** The Codex CLI entry point, run through this Node binary so no shell or console window is involved. */
function codexCommand() {
  if (process.env.YORU_CODEX_JS) return [process.execPath, process.env.YORU_CODEX_JS];
  if (process.platform === 'win32' && process.env.APPDATA) {
    const js = join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (existsSync(js)) return [process.execPath, js];
  }
  return ['codex'];
}

/**
 * Runs one generation. Resolves with the generated image paths (normally one) and the run's thread id; rejects when
 * Codex fails or produced no image.
 *
 * @param {{ prompt: string, images: string[], cwd: string, onEvent?: (event: object) => void }} job
 * @returns {Promise<{ threadId: string, outputs: string[], events: object[], seconds: number }>}
 */
export function generate({ prompt, images, cwd, onEvent }) {
  const [command, ...prefix] = codexCommand();
  const args = [
    ...prefix, 'exec',
    '-m', ROUTE.model,
    '-c', `model_reasoning_effort="${ROUTE.effort}"`,
    '-s', 'read-only',
    '--skip-git-repo-check',
    '--json',
    ...images.flatMap((image) => ['-i', image]),
    '-',
  ];
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const events = [];
    let buffered = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      buffered += chunk;
      let newline;
      while ((newline = buffered.indexOf('\n')) >= 0) {
        const line = buffered.slice(0, newline).trim();
        buffered = buffered.slice(newline + 1);
        if (!line) continue;
        try {
          const event = JSON.parse(line);
          events.push(event);
          onEvent?.(event);
        } catch { /* not an event line */ }
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      const threadId = events.find((e) => e.type === 'thread.started')?.thread_id;
      const seconds = Math.round((Date.now() - started) / 1000);
      if (code !== 0) return reject(new Error(`codex exec exited ${code}: ${stderr.trim().slice(-500)}`));
      if (!threadId) return reject(new Error('codex exec reported no thread id'));
      const outputs = imagesOf(threadId, started);
      if (!outputs.length) return reject(new Error(`codex run ${threadId} produced no image`));
      resolve({ threadId, outputs, events, seconds });
    });
    child.stdin.end(prompt);
  });
}

/** Images Codex saved for this thread during this run, oldest first. */
function imagesOf(threadId, since) {
  const dir = join(codexHome(), 'generated_images', threadId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.png'))
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).mtimeMs >= since - 1000)
    .sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
}
