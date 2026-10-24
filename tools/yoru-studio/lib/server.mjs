// The local studio's HTTP boundary. Source edits are loopback-only, same-origin JSON requests.
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { loadFamily, saveFamily } from './spec.mjs';

/** Site timing families; the historical v1 sheets and Codex pet keep their own timing. */
export const TEMPO_FAMILIES = ['presence', 'everyday', 'sleep', 'curious', 'reactions', 'guest', 'ladder', 'nook'];
const BODY_LIMIT = 4096;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        chunks.length = 0;
        reject(new RequestError(413, 'Request too large.'));
      } else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** A segment boundary, including decoded Windows separators, rather than a sibling's shared string prefix. */
function containedFile(base, path) {
  const file = resolve(base, path);
  const rel = relative(base, file);
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel) ? file : null;
}

/** Writes only a selected family/clip, after validating the complete numeric edit before any source mutation. */
function saveTempo(paths, payload) {
  const { family: familyId, clip: clipId, tempo, stride } = payload ?? {};
  const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  if (!TEMPO_FAMILIES.includes(familyId) || typeof clipId !== 'string' || !finite(tempo, 0.25, 3)
    || (stride !== undefined && (!/^(walk|run)-/.test(clipId) || !finite(stride, 20, 240)))) {
    throw new RequestError(400, 'Invalid tempo edit. Tempo must be 0.25–3; walk/run stride must be 20–240 pixels.');
  }
  const family = loadFamily(paths, familyId);
  const clip = family.clips.find((item) => item.id === clipId);
  if (!clip) throw new RequestError(400, 'Unknown clip.');
  if (Math.abs(tempo - 1) < 0.001) delete clip.tempo; else clip.tempo = Math.round(tempo * 100) / 100;
  if (stride !== undefined) clip.stride = Math.round(stride);
  saveFamily(family);
}

/** Start the actual local server; callers own closing the returned server. Port 0 supports isolated server tests. */
export async function serveStudio({ root, paths, port = 4390, preview, tempoBoard }) {
  const rehearsal = join(root, 'tools', 'yoru-studio', 'rehearsal');
  const send = (res, file) => {
    if (!file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': TYPES[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  };
  const server = createServer(async (req, res) => {
    try {
      const authority = `127.0.0.1:${server.address().port}`;
      if (req.headers.host !== authority) throw new RequestError(403, 'Unexpected Host.');
      let path;
      try { path = decodeURIComponent(new URL(req.url, `http://${authority}`).pathname); }
      catch { throw new RequestError(400, 'Invalid path.'); }
      if (path === '/tempo/save' && req.method === 'POST') {
        if (req.headers.origin !== undefined && req.headers.origin !== `http://${authority}`) throw new RequestError(403, 'Unexpected Origin.');
        if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type'] ?? '')) throw new RequestError(415, 'Expected application/json.');
        if (Number(req.headers['content-length']) > BODY_LIMIT) throw new RequestError(413, 'Request too large.');
        const body = await readBody(req);
        let payload;
        try { payload = JSON.parse(body); }
        catch { throw new RequestError(400, 'Invalid JSON.'); }
        saveTempo(paths, payload);
        res.writeHead(204).end();
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
      if (path === '/') { res.writeHead(302, { location: '/preview/' }).end(); return; }
      if (path === '/preview/') await preview();
      if (path === '/rehearsal/') return send(res, join(rehearsal, 'index.html'));
      if (path === '/tempo/') return send(res, join(root, 'tools', 'yoru-studio', 'tempo', 'index.html'));
      if (path === '/tempo/clips.json') {
        res.writeHead(200, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' }).end(JSON.stringify(tempoBoard()));
        return;
      }
      if (path.startsWith('/walk-assets/')) return send(res, containedFile(join(root, 'design', 'the-walk', 'assets'), path.slice('/walk-assets/'.length)));
      if (path === '/sheets/') {
        const packed = existsSync(paths.sheets) ? readdirSync(paths.sheets).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
        res.writeHead(200, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' }).end(JSON.stringify(packed));
        return;
      }
      if (path === '/rehearsal/main.js') {
        const { build } = await import('esbuild');
        const result = await build({ entryPoints: [join(rehearsal, 'main.ts')], bundle: true, format: 'esm', write: false, sourcemap: 'inline', target: 'es2022' });
        res.writeHead(200, { 'content-type': TYPES['.js'], 'cache-control': 'no-store' }).end(result.outputFiles[0].text);
        return;
      }
      const [base, rest] = path.startsWith('/sheets/') ? [paths.sheets, path.slice('/sheets/'.length)] : [paths.work, path === '/preview/' ? 'preview/index.html' : `.${path}`];
      send(res, containedFile(base, rest));
    } catch (error) {
      if (res.headersSent) res.destroy();
      else {
        const status = error instanceof RequestError ? error.status : 500;
        res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...(status === 413 && { connection: 'close' }) })
          .end(error instanceof RequestError ? error.message : 'Studio request failed.', () => { if (status === 413) req.destroy(); });
      }
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}
