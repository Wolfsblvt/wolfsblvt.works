// The live HTTPS readback, run from outside by every Website publication (through check-deployment.mjs) and on its own
// with `npm run check:live-https` after a manual deployment or any route or zone change. Plain HTTP to either public
// host must be upgraded to the same path and query on HTTPS before anything is served or handled, for a page load and
// for a submission alike, and HTTPS must answer with HSTS. It follows no redirect, sends no form fields, cookies or
// credentials, and discards every body.
//
// Two layers keep plain HTTP closed. The Worker redirects on its own routes (`run_worker_first` in wrangler.jsonc), so
// the zone's redirect and the Worker's look the same there. Existing static files never reach the Worker: only the
// zone's redirect protects them. So the readback also probes known static routes, and first confirms over HTTPS that
// each one really exists, because a missing path would fall through to the Worker and prove nothing about the zone.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONTACT_HOST, WORKS_HOST } from '../shared/contact-contract.ts';

export const HOSTS = [WORKS_HOST, CONTACT_HOST];
const QUERY = '?https-readback=1';
/** Served by the Worker first. */
const WORKER_PROBES = [['GET', '/'], ['POST', '/'], ['GET', `/${QUERY}`]];
/** Real static files on both hosts: the deliberately Worker-independent legal page and a plain asset. */
export const STATIC_ROUTES = ['/privacy/', '/robots.txt'];
const STATIC_PROBES = [['GET', `/privacy/${QUERY}`], ['POST', `/privacy/${QUERY}`], ['GET', `/robots.txt${QUERY}`]];
/** Redirects that move the request to Location. 300, 304 and the rest of 3xx are not an upgrade. */
const UPGRADE_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * Probes both hosts and returns every observation plus the failures; never throws for a host's answer. Transport
 * failures are reported without the exception text, which can carry URLs, headers or payloads.
 */
export async function checkLiveHttps({ fetchImpl = fetch, hosts = HOSTS } = {}) {
  const results = [];
  const failures = [];

  async function probe(url, method = 'GET') {
    try {
      const response = await fetchImpl(url, {
        method, ...(method === 'POST' ? { body: '' } : {}),
        redirect: 'manual', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      });
      await response.body?.cancel();
      return response;
    } catch {
      results.push({ check: `${method} ${url}`, ok: false });
      failures.push(`${method} ${url} did not answer.`);
      return null;
    }
  }

  async function expectUpgrade(host, method, path) {
    const from = `http://${host}${path}`;
    const expected = `https://${host}${path}`;
    const response = await probe(from, method);
    if (!response) return;
    const location = response.headers.get('Location');
    const target = location === null ? null : new URL(location, from).href;
    const ok = UPGRADE_STATUSES.has(response.status) && target === expected;
    results.push({ check: `${method} ${from}`, status: response.status, location, ok });
    if (!ok) failures.push(`${method} ${from} answered ${response.status}${location ? ` → ${location}` : ''}; expected a redirect to ${expected}.`);
  }

  async function expectHttpsSuccess(host, path) {
    const url = `https://${host}${path}`;
    const response = await probe(url);
    if (!response) return;
    const hsts = response.headers.get('Strict-Transport-Security');
    const ok = response.status === 200 && /max-age=[1-9]\d*/.test(hsts ?? '');
    results.push({ check: `GET ${url}`, status: response.status, hsts, ok });
    if (!ok) failures.push(`GET ${url} answered ${response.status} with HSTS "${hsts ?? 'absent'}"; expected 200 with a positive max-age${path === '/' ? '' : ' (a static route that is missing cannot show the zone redirect)'}.`);
  }

  for (const host of hosts) {
    await expectHttpsSuccess(host, '/');
    for (const path of STATIC_ROUTES) await expectHttpsSuccess(host, path);
    for (const [method, path] of [...WORKER_PROBES, ...STATIC_PROBES]) await expectUpgrade(host, method, path);
  }
  return { results, failures };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const { results, failures } = await checkLiveHttps();
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  if (failures.length > 0) {
    console.error(`\nPlain HTTP is not fully closed:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.error('\nBoth hosts upgrade plain HTTP to HTTPS on Worker and static routes, and answer HTTPS with HSTS.');
  }
}
