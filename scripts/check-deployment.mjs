// Credential-free publication readback. The marker identifies the uploaded asset tree;
// BUILD_VERSION and the provider deployment remain separate operator evidence. Every publication also reads back that
// plain HTTP stays closed on the Worker's routes and on static files (check-live-https.mjs).
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { checkLiveHttps } from './check-live-https.mjs';

const HOSTS = ['https://wolfsblvt.works', 'https://contact.wolfsblvt.works'];
// The first upload was visible about 75 seconds later. Allow 120 seconds for the
// whole readback, polling only a served stale SHA; each individual request also has a cap.
const READINESS_MS = 120_000;
const POLL_MS = 5_000;
const REQUEST_MS = 10_000;

/**
 * Wait for the asset build within one budget, then check each host's HTML/HSTS once, then that both stay HTTPS-only.
 * The HTTPS readback runs after readiness, outside its budget, under its own single finite budget (check-live-https.mjs),
 * and sends nothing more after a transport failure.
 */
export async function checkDeployment(sourceSha, {
  fetchImpl = fetch, now = () => performance.now(), wait = setTimeout,
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error('Readback needs the resolved 40-character source SHA.');
  const deadline = now() + READINESS_MS;
  let lastObservation = 'no response';
  const remaining = () => {
    const ms = deadline - now();
    if (ms <= 0) throw new Error(`Publication readback: readiness deadline exceeded; last observation: ${lastObservation}.`);
    return ms;
  };
  let requests = 0;
  for (const host of HOSTS) {
    async function get(path, readMarker = false) {
      const timeout = Math.max(1, Math.ceil(Math.min(REQUEST_MS, remaining())));
      requests++;
      try {
        const response = await fetchImpl(`${host}${path}`, {
          redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(timeout),
        });
        const body = readMarker && response.status === 200 ? await response.text() : null;
        if (body === null) await response.body?.cancel();
        return { response, body };
      } catch {
        // Provider/transport exceptions can carry URLs, headers or response payloads.
        throw new Error(`Publication readback: ${host} transport failure; last observation: ${lastObservation}. Stopped without retrying.`);
      }
    }
    while (true) {
      const { response, body } = await get(`/build-version.txt?source=${sourceSha}`, true);
      if (response.status !== 200) throw new Error(`Publication readback: ${host} marker status ${response.status}; stopped without retrying.`);
      const value = body.trim();
      if (!/^[a-f0-9]{40}$/.test(value)) throw new Error(`Publication readback: ${host} marker is not a SHA; stopped without retrying.`);
      lastObservation = `${host} ${value === sourceSha ? 'marker matched' : 'stale SHA'}`;
      remaining();
      if (value === sourceSha) break;
      await wait(Math.min(POLL_MS, remaining()));
    }
    const { response: page } = await get('/');
    remaining();
    if (page.status !== 200 || !page.headers.get('content-type')?.includes('text/html') ||
        !page.headers.get('strict-transport-security')) {
      throw new Error(`Publication readback: ${host} is missing its HTML success response or HSTS.`);
    }
  }
  const https = await checkLiveHttps({ fetchImpl });
  requests += https.results.length;
  if (https.failures.length > 0) {
    throw new Error(`Publication readback: plain HTTP is not fully closed.\n- ${https.failures.join('\n- ')}`);
  }
  return { hosts: HOSTS.length, requests, sourceSha };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await checkDeployment(process.argv[2]);
    console.log(`Publication readback passed: ${result.hosts} hosts, ${result.requests} requests, asset build ${result.sourceSha}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
