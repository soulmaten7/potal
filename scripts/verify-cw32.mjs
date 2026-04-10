#!/usr/bin/env node
/**
 * CW32 Correctness Sweep — 31-case automated verification matrix.
 *
 * Usage (from a terminal with the server already running):
 *   PORT=3010 node scripts/verify-cw32.mjs
 *
 * Or let the script spawn its own server:
 *   node scripts/verify-cw32.mjs --spawn
 */

const PORT = process.env.PORT || '3010';
const BASE = `http://localhost:${PORT}`;

const CASES = [
  // ─── CW31 18 legacy cases ───
  { id: '01', label: 'seller KR→US wallet',  scen: 'seller',  inputs: { product: 'Handmade leather wallet', from: 'KR', to: 'US', value: 45 },    expect: { source: 'live', total: 50.83, ftaContains: 'Korea-US' } },
  { id: '02', label: 'seller CN→US wallet',  scen: 'seller',  inputs: { product: 'Handmade leather wallet', from: 'CN', to: 'US', value: 45 },    expect: { source: 'live', dutyGt: 0 } },
  { id: '03', label: 'seller KR→DE wallet',  scen: 'seller',  inputs: { product: 'Handmade leather wallet', from: 'KR', to: 'DE', value: 45 },    expect: { source: 'live', ftaContains: 'EU-Korea' } },
  { id: '04', label: 'd2c KR→DE tshirt×500', scen: 'd2c',     inputs: { product: 'Organic cotton T-shirt',  from: 'KR', to: 'DE', value: 28, quantity: 500 }, expect: { source: 'live', ftaContains: 'EU-Korea' } },
  { id: '05', label: 'd2c KR→US tshirt×500', scen: 'd2c',     inputs: { product: 'Organic cotton T-shirt',  from: 'KR', to: 'US', value: 28, quantity: 500 }, expect: { source: 'live', ftaContains: 'Korea-US' } },
  { id: '06', label: 'd2c CN→US tshirt×500', scen: 'd2c',     inputs: { product: 'Organic cotton T-shirt',  from: 'CN', to: 'US', value: 28, quantity: 500 }, expect: { source: 'live', dutyGt: 0 } },
  { id: '07', label: 'importer DE→KR pumps', scen: 'importer', inputs: { product: 'Industrial centrifugal pumps', from: 'DE', to: 'KR', value: 85000, container: '40ft' }, expect: { source: 'live', ftaContains: 'EU-Korea' } },
  { id: '08', label: 'importer US→KR pumps', scen: 'importer', inputs: { product: 'Industrial centrifugal pumps', from: 'US', to: 'KR', value: 85000, container: '40ft' }, expect: { source: 'live', ftaContains: 'Korea-US' } },
  { id: '09', label: 'importer CN→KR pumps', scen: 'importer', inputs: { product: 'Industrial centrifugal pumps', from: 'CN', to: 'KR', value: 85000, container: '40ft' }, expect: { source: 'live', ftaContains: 'Korea-China' } },
  { id: '10', label: 'exporter KR→US Li-ion', scen: 'exporter', inputs: { product: 'Lithium-ion battery cells', from: 'KR', to: 'US', value: 250000 }, expect: { source: 'live', hsStarts: '8507', restrictContains: 'Lithium' } },
  { id: '11', label: 'exporter KR→DE Li-ion', scen: 'exporter', inputs: { product: 'Lithium-ion battery cells', from: 'KR', to: 'DE', value: 250000 }, expect: { source: 'live', hsStarts: '8507', restrictContains: 'Lithium' } },
  { id: '12', label: 'exporter KR→JP Li-ion', scen: 'exporter', inputs: { product: 'Lithium-ion battery cells', from: 'KR', to: 'JP', value: 250000 }, expect: { source: 'live', hsStarts: '8507', restrictContains: 'Lithium' } },
  { id: '13', label: 'forwarder KR→[US,DE,JP]', scen: 'forwarder', inputs: { product: 'Cotton T-shirts', from: 'KR', destinations: ['US','DE','JP'], value: 12000 }, expect: { source: 'live', rowsCount: 3, hsStarts: '6109' } },
  { id: '14', label: 'forwarder KR→[US,GB,CA]', scen: 'forwarder', inputs: { product: 'Cotton T-shirts',  from: 'KR', destinations: ['US','GB','CA'], value: 12000 }, expect: { source: 'live', rowsCount: 3 } },
  { id: '15', label: 'forwarder CN→[KR,JP,SG]', scen: 'forwarder', inputs: { product: 'Cotton T-shirts',  from: 'CN', destinations: ['KR','JP','SG'], value: 5000 }, expect: { source: 'live', rowsCount: 3 } },
  { id: '16', label: 'seller CN→US $200',     scen: 'seller',  inputs: { product: 'Handmade leather wallet', from: 'CN', to: 'US', value: 200 }, expect: { source: 'live', dutyGt: 0 } },
  { id: '17', label: 'seller KR→GB wallet',   scen: 'seller',  inputs: { product: 'Handmade leather wallet', from: 'KR', to: 'GB', value: 45 },  expect: { source: 'live' } },
  { id: '18', label: 'd2c KR→FR tshirt×100',  scen: 'd2c',     inputs: { product: 'Organic cotton T-shirt', from: 'KR', to: 'FR', value: 28, quantity: 100 }, expect: { source: 'live', ftaContains: 'EU-Korea' } },

  // ─── CW32 10 new cases ───
  { id: '22', label: 'forwarder KR→GB cotton (Korea-UK FTA)', scen: 'forwarder', inputs: { product: 'Cotton T-shirt', from: 'KR', destinations: ['GB'], value: 12000 }, expect: { source: 'live', rowsCount: 1, ftaContains: 'Korea' } },
  { id: '23', label: 'forwarder KR→CA cotton (KCFTA)',        scen: 'forwarder', inputs: { product: 'Cotton T-shirt', from: 'KR', destinations: ['CA'], value: 12000 }, expect: { source: 'live', rowsCount: 1, ftaContains: 'Korea' } },
  { id: '24', label: 'forwarder KR→[US,GB,CA,DE,JP] (5 dest)', scen: 'forwarder', inputs: { product: 'Cotton T-shirt', from: 'KR', destinations: ['US','GB','CA','DE','JP'], value: 12000 }, expect: { source: 'live', rowsCount: 5 } },
  { id: '25', label: 'forwarder to: array compatibility',     scen: 'forwarder', inputs: { product: 'Cotton T-shirt', from: 'KR', to: ['US','DE'], value: 12000 }, expect: { source: 'live', rowsCount: 2 } },
  { id: '26', label: 'exporter KR→US primary CR2032',          scen: 'exporter', inputs: { product: 'Primary Lithium Battery CR2032 non-rechargeable', from: 'KR', to: 'US', value: 250000 }, expect: { source: 'live', hsStarts: '8506', restrictContains: 'Primary' } },
  { id: '27', label: 'exporter KR→US Li-ion battery pack',     scen: 'exporter', inputs: { product: 'Lithium-ion Battery Pack', from: 'KR', to: 'US', value: 250000 }, expect: { source: 'live', hsStarts: '8507', restrictContains: 'Lithium' } },
  { id: '28a', label: 'd2c cotton HS ground truth',            scen: 'd2c',      inputs: { product: 'Cotton T-Shirt', from: 'KR', to: 'DE', value: 29 }, expect: { source: 'live', hsStarts: '6109' } },
  { id: '28b', label: 'forwarder cotton HS (must match 28a)',  scen: 'forwarder',inputs: { product: 'Cotton T-Shirt', from: 'KR', destinations: ['DE'], value: 29 }, expect: { source: 'live', hsStarts: '6109' } },
  { id: '29', label: 'forwarder to: string promoted to array', scen: 'forwarder',inputs: { product: 'Cotton T-Shirt', from: 'KR', to: 'US', value: 12000 }, expect: { source: 'live', rowsCount: 1 } },
  { id: '30', label: 'exporter "Lithium Battery" ambiguous',   scen: 'exporter', inputs: { product: 'Lithium Battery', from: 'KR', to: 'US', value: 250000 }, expect: { source: 'live', hsStarts: '8507' } },
];

async function runCase(c) {
  const t0 = Date.now();
  let res, json, error;
  try {
    res = await fetch(`${BASE}/api/demo/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: c.scen, inputs: c.inputs }),
    });
    json = await res.json();
  } catch (err) {
    error = err.message;
  }
  const elapsed = Date.now() - t0;
  if (!json || !json.success) {
    return { ...c, ok: false, reason: error || json?.error?.message || 'no-json', elapsed };
  }
  const r = json.data.result;
  const src = json.data.source;
  const exp = c.expect || {};
  const failures = [];
  if (exp.source && src !== exp.source) failures.push(`source=${src} (want ${exp.source})`);
  if (exp.total !== undefined && Math.abs(r.landedCost.total - exp.total) > 0.01)
    failures.push(`total=${r.landedCost.total} (want ${exp.total})`);
  if (exp.dutyGt !== undefined && !(r.landedCost.duty > exp.dutyGt))
    failures.push(`duty=${r.landedCost.duty} (want >${exp.dutyGt})`);
  if (exp.hsStarts && !String(r.hsCode).replace(/\./g, '').startsWith(exp.hsStarts))
    failures.push(`hs=${r.hsCode} (want starts ${exp.hsStarts})`);
  if (exp.ftaContains) {
    const fta = r.extras?.ftaName || '';
    const rowFtas = (r.comparisonRows || []).map(x => x.ftaName || '').join('|');
    const all = fta + '|' + rowFtas;
    if (!all.toLowerCase().includes(exp.ftaContains.toLowerCase()))
      failures.push(`fta=${all || '—'} (want contains "${exp.ftaContains}")`);
  }
  if (exp.restrictContains) {
    const restr = (r.restriction?.summary || '') + ' ' + (r.restriction?.license || '');
    if (!restr.toLowerCase().includes(exp.restrictContains.toLowerCase()))
      failures.push(`restriction="${r.restriction?.summary?.slice(0,40)}" (want contains "${exp.restrictContains}")`);
  }
  if (exp.rowsCount !== undefined && (r.comparisonRows?.length || 0) !== exp.rowsCount)
    failures.push(`rowsCount=${r.comparisonRows?.length || 0} (want ${exp.rowsCount})`);

  return {
    ...c,
    ok: failures.length === 0,
    failures,
    elapsed,
    src,
    hs: r.hsCode,
    total: r.landedCost.total,
    duty: r.landedCost.duty,
    rowCount: r.comparisonRows?.length || 0,
    fta: r.extras?.ftaName || '—',
    restriction: r.restriction?.summary?.slice(0, 60) || '',
  };
}

async function main() {
  console.log(`\n=== CW32 Correctness Sweep — ${CASES.length} cases against ${BASE} ===\n`);
  const results = [];
  for (const c of CASES) {
    const r = await runCase(c);
    results.push(r);
    const mark = r.ok ? '✓' : '✗';
    const line = `${mark} ${c.id.padEnd(4)} ${c.label.padEnd(42)} src=${(r.src || '?').padEnd(5)} hs=${(r.hs || '?').toString().padEnd(12)} total=$${(r.total ?? 0).toFixed(2).padStart(10)} ${r.elapsed}ms`;
    console.log(line);
    if (r.ok === false) console.log(`     FAIL: ${r.failures?.join(' | ') || r.reason}`);
    if (r.rowCount > 0) {
      const rows = await (async () => {
        const res = await fetch(`${BASE}/api/demo/scenario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: c.scen, inputs: c.inputs }),
        });
        const j = await res.json();
        return j.data?.result?.comparisonRows || [];
      })();
      for (const row of rows.slice().sort((a, b) => a.total - b.total)) {
        console.log(`        · ${row.destination} total=$${row.total.toFixed(2).padStart(10)} duty=$${row.duty.toFixed(2).padStart(8)} fta=${row.ftaName || '—'}`);
      }
    }
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => r.ok === false);
  const times = results.map(r => r.elapsed).filter(Boolean).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  console.log(`\n=== ${passed}/${results.length} passed · p50=${p50}ms · p95=${p95}ms · max=${Math.max(...times)}ms ===`);
  if (failed.length > 0) {
    console.log('\nFAILURES:');
    for (const f of failed) console.log(`  ${f.id} ${f.label}: ${f.failures?.join(' | ') || f.reason}`);
    process.exit(1);
  }

  // CW32 cotton HS drift assertion: 28a and 28b must have identical HS
  const h28a = results.find(r => r.id === '28a')?.hs;
  const h28b = results.find(r => r.id === '28b')?.hs;
  if (h28a && h28b && h28a !== h28b) {
    console.log(`\n✗ COTTON HS DRIFT: d2c=${h28a} forwarder=${h28b} (must be equal)`);
    process.exit(1);
  }
  console.log(`\n✓ Cotton HS drift check: d2c=${h28a} == forwarder=${h28b}`);

  process.exit(0);
}

main().catch(err => {
  console.error('FATAL', err);
  process.exit(2);
});
