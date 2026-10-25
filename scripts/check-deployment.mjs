// Credential-free publication readback. The marker identifies the uploaded asset tree;
// BUILD_VERSION and the provider deployment remain separate operator evidence.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HOSTS = ['https://wolfsblvt.works', 'https://contact.wolfsblvt.works'];

/** Verify the exact asset build and a useful HTML response on both custom hosts, once each. */
export async function checkDeployment(sourceSha, { fetchImpl = fetch } = {}) {
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error('Readback needs the resolved 40-character source SHA.');
  let requests = 0;
  for (const host of HOSTS) {
    async function get(path) {
      requests++;
      try {
        return await fetchImpl(`${host}${path}`, {
          redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10_000),
        });
      } catch {
        // Provider/transport exceptions can carry URLs, headers or response payloads.
        throw new Error(`Publication readback: ${host} did not answer. No retry or redeploy was attempted.`);
      }
    }
    const marker = await get(`/build-version.txt?source=${sourceSha}`);
    if (marker.status !== 200 || (await marker.text()).trim() !== sourceSha) {
      throw new Error(`Publication readback: ${host} does not serve the expected asset build.`);
    }
    const page = await get('/');
    if (page.status !== 200 || !page.headers.get('content-type')?.includes('text/html') ||
        !page.headers.get('strict-transport-security')) {
      throw new Error(`Publication readback: ${host} is missing its HTML success response or HSTS.`);
    }
    await page.body?.cancel();
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
