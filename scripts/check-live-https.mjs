// The live HTTPS readback, run from outside after every production deployment and any route or zone change. Plain
// HTTP to either public host must be redirected to the same path and query on HTTPS before anything is served or
// handled, for a page load and for a submission alike, and HTTPS must answer with HSTS. It follows no redirect, sends
// no form fields, cookies or credentials, and discards every body. Either the zone's redirect or the Worker's own
// may supply the redirect; from outside the two are indistinguishable, and the Worker's is pinned by its tests.
import { CONTACT_HOST, WORKS_HOST } from '../shared/contact-contract.ts';

const HOSTS = [WORKS_HOST, CONTACT_HOST];
const PROBE_PATH = '/https-readback?probe=1';
const failures = [];
const results = [];

async function probe(url, init = {}) {
  const response = await fetch(url, { redirect: 'manual', credentials: 'omit', ...init, signal: AbortSignal.timeout(15_000) });
  await response.body?.cancel();
  return response;
}

async function expectHttpsRedirect(host, path, method) {
  const from = `http://${host}${path}`;
  const expected = `https://${host}${path}`;
  const response = await probe(from, { method, ...(method === 'POST' ? { body: '' } : {}) });
  const location = response.headers.get('Location');
  const ok = response.status >= 300 && response.status < 400 && location === expected;
  results.push({ check: `${method} ${from}`, status: response.status, location, ok });
  if (!ok) failures.push(`${method} ${from} answered ${response.status}${location ? ` → ${location}` : ''}; expected a redirect to ${expected}.`);
}

async function expectHsts(host) {
  const url = `https://${host}/`;
  const response = await probe(url);
  const hsts = response.headers.get('Strict-Transport-Security');
  const ok = response.status === 200 && /max-age=[1-9]\d*/.test(hsts ?? '');
  results.push({ check: `GET ${url}`, status: response.status, hsts, ok });
  if (!ok) failures.push(`GET ${url} answered ${response.status} with HSTS "${hsts ?? 'absent'}"; expected 200 with a positive max-age.`);
}

for (const host of HOSTS) {
  await expectHttpsRedirect(host, '/', 'GET');
  await expectHttpsRedirect(host, '/', 'POST');
  await expectHttpsRedirect(host, PROBE_PATH, 'GET');
  await expectHsts(host);
}

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
if (failures.length > 0) {
  console.error(`\nPlain HTTP is not fully closed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.error('\nBoth hosts redirect plain HTTP to HTTPS and answer HTTPS with HSTS.');
}
