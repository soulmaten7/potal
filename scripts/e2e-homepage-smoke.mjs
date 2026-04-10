#!/usr/bin/env node
/**
 * POTAL homepage E2E smoke test — CW30 Sprint 8
 *
 * Runs against PRODUCTION (https://www.potal.app) with no auth.
 * Verifies the critical anonymous-user paths:
 *   1. GET /                            → 200, contains "POTAL"
 *   2. GET /?type=custom                → 200 (homepage handles CUSTOM via query param)
 *   3. POST /api/demo/scenario × 5      → success, result.landedCost.total > 0, source in {live-cached, mock}
 *   4. GET /mobile-notice               → 200, contains "desktop"
 *
 * Exit 0 on all-pass, exit 1 on any failure.
 * NO dependencies — uses Node 18+ built-in fetch.
 *
 * Usage:
 *   node scripts/e2e-homepage-smoke.mjs
 *   E2E_BASE_URL=http://localhost:3000 node scripts/e2e-homepage-smoke.mjs
 */

const BASE = process.env.E2E_BASE_URL || 'https://www.potal.app';
// Actual scenario IDs from lib/scenarios/scenario-config.ts
const SCENARIOS = ['seller', 'd2c', 'importer', 'exporter', 'forwarder'];

let pass = 0;
let fail = 0;
const results = [];
const timings = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) pass += 1;
  else fail += 1;
  const icon = ok ? '✓' : '✗';
  process.stdout.write(`${icon} ${name}${detail ? ' — ' + detail : ''}\n`);
}

async function check(name, fn) {
  try {
    await fn();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    record(name, false, msg);
  }
}

async function main() {
  process.stdout.write(`POTAL E2E smoke — base: ${BASE}\n\n`);

  // 1) Home page
  await check('GET /', async () => {
    const res = await fetch(`${BASE}/`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/POTAL/i.test(html)) throw new Error('missing POTAL brand');
    record('GET /', true, `${res.status}`);
  });

  // 2) Home page with CUSTOM scenario query
  await check('GET /?type=custom', async () => {
    const res = await fetch(`${BASE}/?type=custom`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/POTAL/i.test(html)) throw new Error('missing POTAL brand');
    record('GET /?type=custom', true, `${res.status}`);
  });

  // 3) Demo API — 5 scenarios
  for (const scenarioId of SCENARIOS) {
    await check(`POST /api/demo/scenario [${scenarioId}]`, async () => {
      const started = Date.now();
      const res = await fetch(`${BASE}/api/demo/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, inputs: { value: 45 } }),
      });
      const ms = Date.now() - started;
      timings.push({ scenarioId, ms });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const source = res.headers.get('x-demo-source');
      const responseTime = res.headers.get('x-response-time');
      const json = await res.json();
      if (!json || json.success !== true) throw new Error('success=false');
      const total = json?.data?.result?.landedCost?.total;
      if (typeof total !== 'number' || total <= 0) {
        throw new Error(`invalid total: ${total}`);
      }
      if (source !== 'live-cached' && source !== 'live' && source !== 'mock') {
        throw new Error(`unexpected source: ${source}`);
      }
      record(
        `POST /api/demo/scenario [${scenarioId}]`,
        true,
        `wall=${ms}ms server=${responseTime || '?'}ms source=${source} total=${total}`
      );
    });
  }

  // 4) Mobile notice page
  await check('GET /mobile-notice', async () => {
    const res = await fetch(`${BASE}/mobile-notice`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await res.text();
    if (!/desktop/i.test(html)) throw new Error('missing desktop marker');
    record('GET /mobile-notice', true, `${res.status}`);
  });

  // Summary + p95
  process.stdout.write(`\nSummary: ${pass} passed, ${fail} failed\n`);
  if (timings.length > 0) {
    const sorted = timings.map(t => t.ms).sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95 = sorted[Math.max(0, p95Index)];
    process.stdout.write(`Demo API timing: p50=${p50}ms p95=${p95}ms max=${sorted[sorted.length - 1]}ms\n`);
  }

  if (fail > 0) {
    process.stderr.write('\nE2E smoke FAILED\n');
    process.exit(1);
  }
  process.stdout.write('\nE2E smoke PASSED\n');
  process.exit(0);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
