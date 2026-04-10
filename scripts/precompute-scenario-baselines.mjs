#!/usr/bin/env node
/**
 * CW29 Sprint 7.5 — Precompute live baseline for homepage demo scenarios.
 *
 * Runs once against production POTAL engines with X-Demo-Request bypass.
 * Output: lib/scenarios/live-baseline.json (committed to repo).
 *
 * Usage:
 *   node scripts/precompute-scenario-baselines.mjs
 *   node scripts/precompute-scenario-baselines.mjs --base=https://www.potal.app
 *
 * Re-run manually when tariffs are updated or engine logic changes.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../lib/scenarios/live-baseline.json');

const BASE =
  process.argv.find(a => a.startsWith('--base='))?.split('=')[1] ||
  'https://www.potal.app';

// 5 scenario precompute inputs (spec scenario section)
const SCENARIOS = [
  {
    id: 'seller',
    classify: {
      productName: 'leather handbag',
      material: 'leather',
      category: 'bags',
      intendedUse: 'personal',
      targetUser: 'adult',
      originCountry: 'CN',
    },
    calculate: {
      price: 45,
      shippingPrice: 12.5,
      origin: 'CN',
      destinationCountry: 'US',
      zipcode: '10001',
    },
  },
  {
    id: 'd2c',
    classify: {
      productName: 'cotton t-shirt',
      material: 'cotton',
      category: 'apparel',
      intendedUse: 'personal',
      targetUser: 'adult',
      originCountry: 'VN',
    },
    calculate: {
      price: 28,
      shippingPrice: 8,
      origin: 'VN',
      destinationCountry: 'KR',
    },
  },
  {
    id: 'importer',
    classify: {
      productName: 'industrial centrifugal pump',
      material: 'stainless steel',
      category: 'machinery',
      intendedUse: 'industrial',
      targetUser: 'business',
      originCountry: 'DE',
    },
    calculate: {
      price: 85000,
      shippingPrice: 2400,
      origin: 'DE',
      destinationCountry: 'US',
    },
  },
  {
    id: 'exporter',
    classify: {
      productName: 'lithium-ion battery module',
      material: 'lithium-ion',
      category: 'electronics',
      intendedUse: 'industrial',
      targetUser: 'business',
      originCountry: 'KR',
    },
    calculate: {
      price: 250000,
      shippingPrice: 6800,
      origin: 'KR',
      destinationCountry: 'DE',
    },
  },
  {
    id: 'forwarder',
    classify: {
      productName: 'cotton t-shirt bulk shipment',
      material: 'cotton',
      category: 'apparel',
      intendedUse: 'commercial',
      targetUser: 'business',
      originCountry: 'BD',
    },
    calculate: {
      price: 12000,
      shippingPrice: 850,
      origin: 'BD',
      destinationCountry: 'US',
    },
  },
];

async function hit(endpoint, body) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Request': 'true',
    },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - t0;
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, elapsed, json };
}

async function precomputeOne(scenario) {
  process.stdout.write(`[${scenario.id}] classify... `);
  const classifyRes = await hit('/api/v1/classify', scenario.classify);
  process.stdout.write(`${classifyRes.elapsed}ms ${classifyRes.ok ? 'OK' : 'FAIL'}\n`);

  const hsCode = classifyRes.json?.data?.hsCode || null;

  process.stdout.write(`[${scenario.id}] calculate... `);
  const calcRes = await hit('/api/v1/calculate', {
    ...scenario.calculate,
    ...(hsCode ? { hsCode } : {}),
  });
  process.stdout.write(`${calcRes.elapsed}ms ${calcRes.ok ? 'OK' : 'FAIL'}\n`);

  if (!calcRes.ok || !calcRes.json?.data) {
    process.stdout.write(`[${scenario.id}] SKIP (calculate failed)\n`);
    return null;
  }

  const calc = calcRes.json.data;
  const classify = classifyRes.json?.data || null;

  // Shape into MockResult-compatible structure.
  return {
    scenarioId: scenario.id,
    source: 'live-cached',
    capturedAt: new Date().toISOString(),
    classifyElapsedMs: classifyRes.elapsed,
    calculateElapsedMs: calcRes.elapsed,
    hsCode: classify?.hsCode || calc.hsClassification?.hsCode || null,
    hsDescription:
      classify?.description ||
      calc.hsClassification?.description ||
      null,
    landedCost: {
      currency: calc.destinationCurrency || 'USD',
      productValue: Number(calc.productPrice ?? scenario.calculate.price),
      duty: Number(calc.importDuty ?? 0),
      dutyRate: Number(
        calc.dutyType === 'ad_valorem' && calc.importDuty && calc.productPrice
          ? calc.importDuty / calc.productPrice
          : calc.tariffOptimization?.mfnRate ?? 0
      ),
      taxes: Number(calc.vat ?? calc.salesTax ?? 0),
      shipping: Number(calc.shippingCost ?? scenario.calculate.shippingPrice),
      fees: Number((calc.mpf ?? 0) + (calc.insurance ?? 0)),
      total: Number(calc.totalLandedCost ?? 0),
    },
    restriction: {
      blocked:
        calc.regulatory_warnings?.some(w => w.category === 'restriction') || false,
      summary:
        calc.regulatory_warnings?.[0]?.note ||
        `De minimis threshold: ${calc.destinationCurrency || 'USD'} ${
          calc.de_minimis_detail?.threshold ?? 0
        }`,
    },
    notes: (calc.regulatory_warnings || [])
      .slice(0, 3)
      .map(w => w.note)
      .filter(Boolean),
  };
}

async function main() {
  process.stdout.write(`Precomputing baselines from ${BASE}\n\n`);

  const results = {};
  for (const scenario of SCENARIOS) {
    const result = await precomputeOne(scenario);
    if (result) results[scenario.id] = result;
  }

  const successCount = Object.keys(results).length;
  process.stdout.write(`\n${successCount}/${SCENARIOS.length} scenarios precomputed\n`);

  if (successCount === 0) {
    process.stdout.write('ERROR: All scenarios failed. Aborting write.\n');
    process.exit(1);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: BASE,
    scenarios: results,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  process.stdout.write(`\nWrote ${OUTPUT_PATH}\n`);
}

main().catch(err => {
  process.stderr.write(`Precompute failed: ${err?.message || err}\n`);
  process.exit(1);
});
