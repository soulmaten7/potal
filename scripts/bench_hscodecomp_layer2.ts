/**
 * HSCodeComp 632 Layer 2 Benchmark — 3 scenarios
 * A: product_name only
 * B: full 9-field mapped
 * C: filled fields only (same as B but explicit)
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { throw new Error('Set SUPABASE_SERVICE_ROLE_KEY env var before running'); }

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const mapped: any[] = JSON.parse(fs.readFileSync(`${BASE}/hscodecomp_9field_mapped.json`, 'utf-8'));

interface ScenarioResult {
  name: string;
  section_ok: number;
  chapter_ok: number;
  heading_ok: number;
  hs6_ok: number;
  errors: number;
  total: number;
}

async function runScenario(name: string, getInput: (m: any) => any): Promise<ScenarioResult> {
  let s_ok = 0, c_ok = 0, h_ok = 0, h6_ok = 0, errors = 0;

  for (let i = 0; i < mapped.length; i++) {
    const m = mapped[i];
    try {
      const input = getInput(m);
      const r = await classifyV3(input);

      const vCh = m.verified_chapter;
      const vH4 = m.verified_hs6.substring(0, 4);
      const vH6 = m.verified_hs6;

      if (r.confirmed_chapter === vCh) c_ok++;
      if (r.confirmed_heading === vH4) h_ok++;
      if (r.confirmed_hs6 === vH6) h6_ok++;
      // Section check (derive from chapter)
      const getCh2Sec = (ch: number) => {
        if (ch <= 5) return 1; if (ch <= 14) return 2; if (ch === 15) return 3;
        if (ch <= 24) return 4; if (ch <= 27) return 5; if (ch <= 38) return 6;
        if (ch <= 40) return 7; if (ch <= 43) return 8; if (ch <= 46) return 9;
        if (ch <= 49) return 10; if (ch <= 63) return 11; if (ch <= 67) return 12;
        if (ch <= 70) return 13; if (ch === 71) return 14; if (ch <= 83) return 15;
        if (ch <= 85) return 16; if (ch <= 89) return 17; if (ch <= 92) return 18;
        if (ch === 93) return 19; if (ch <= 96) return 20; return 21;
      };
      if (r.confirmed_section === getCh2Sec(vCh)) s_ok++;

    } catch {
      errors++;
    }

    if (i % 100 === 0) process.stdout.write(`  [${name}] ${i}/${mapped.length}\r`);
  }

  return { name, section_ok: s_ok, chapter_ok: c_ok, heading_ok: h_ok, hs6_ok: h6_ok, errors, total: mapped.length };
}

async function main() {
  console.log(`\n=== HSCodeComp 632 — Layer 2 Benchmark ===\n`);

  // Scenario A: product_name only
  const scA = await runScenario('A: name only', (m) => ({
    product_name: m.product_name, material: 'unknown', origin_country: 'CN',
    destination_country: 'US',
  }));

  // Scenario B: full 9-field mapped
  const scB = await runScenario('B: full 9-field', (m) => ({
    product_name: m.product_name,
    material: m.material || 'unknown',
    origin_country: m.origin_country || 'CN',
    destination_country: 'US',
    category: m.category || '',
    description: m.description || '',
    processing: m.processing || '',
    composition: m.composition || '',
    weight_spec: m.weight_spec || '',
    price: m.price || undefined,
  }));

  // Scenario C: material-only (name + material + category, no other fields)
  const scC = await runScenario('C: name+mat+cat', (m) => ({
    product_name: m.product_name,
    material: m.material || 'unknown',
    origin_country: m.origin_country || 'CN',
    destination_country: 'US',
    category: m.category || '',
  }));

  const N = mapped.length;
  console.log(`\n=== Results ===`);
  console.log(`Scenario       Section  Chapter  Heading  HS6      Errors`);
  for (const sc of [scA, scB, scC]) {
    console.log(`${sc.name.padEnd(16)} ${sc.section_ok}/${N} (${Math.round(sc.section_ok/N*100)}%)  ${sc.chapter_ok}/${N} (${Math.round(sc.chapter_ok/N*100)}%)  ${sc.heading_ok}/${N} (${Math.round(sc.heading_ok/N*100)}%)  ${sc.hs6_ok}/${N} (${Math.round(sc.hs6_ok/N*100)}%)  ${sc.errors}`);
  }

  console.log(`\nComparison with previous (no Layer 1 improvements):`);
  console.log(`  Previous A (name only): Section ~36%, Chapter ~22%, HS6 ~6%`);
  console.log(`  Previous B (basic mapping): Section ~43%, Chapter ~43%, HS6 ~6%`);

  fs.writeFileSync(`${BASE}/hscodecomp_layer2_results.json`, JSON.stringify({
    scenarios: { A: scA, B: scB, C: scC },
    mapped_field_rates: {
      material: mapped.filter(m => m.material).length,
      category: mapped.filter(m => m.category).length,
      price: mapped.filter(m => m.price).length,
      weight: mapped.filter(m => m.weight_spec).length,
    },
  }, null, 2));
  console.log(`\n✅ Saved: ${BASE}/hscodecomp_layer2_results.json`);
}

main().catch(console.error);
