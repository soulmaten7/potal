/**
 * Layer 2 v7 → Layer 1 benchmark
 * Runs v7 mapped data through classifyV3 pipeline
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const mapped: any[] = JSON.parse(fs.readFileSync(`${BASE}/hscodecomp_v7_9field_mapped.json`, 'utf-8'));

async function main() {
  console.log(`\n=== Layer 2 v7 → Layer 1 Benchmark (${mapped.length} items) ===\n`);

  let s_ok = 0, c_ok = 0, h_ok = 0, h6_ok = 0, errors = 0;

  const getCh2Sec = (ch: number) => {
    if (ch <= 5) return 1; if (ch <= 14) return 2; if (ch === 15) return 3;
    if (ch <= 24) return 4; if (ch <= 27) return 5; if (ch <= 38) return 6;
    if (ch <= 40) return 7; if (ch <= 43) return 8; if (ch <= 46) return 9;
    if (ch <= 49) return 10; if (ch <= 63) return 11; if (ch <= 67) return 12;
    if (ch <= 70) return 13; if (ch === 71) return 14; if (ch <= 83) return 15;
    if (ch <= 85) return 16; if (ch <= 89) return 17; if (ch <= 92) return 18;
    if (ch === 93) return 19; if (ch <= 96) return 20; return 21;
  };

  for (let i = 0; i < mapped.length; i++) {
    const m = mapped[i];
    try {
      const r = await classifyV3({
        product_name: m.product_name || '',
        material: m.material || 'unknown',
        origin_country: m.origin_country || 'CN',
        destination_country: 'US',
        category: m.category || '',
        description: m.description || '',
        processing: m.processing || '',
        composition: m.composition || '',
        weight_spec: m.weight_spec || '',
        price: m.price || undefined,
      });

      const vCh = m.verified_chapter;
      const vH4 = m.verified_hs6.substring(0, 4);
      const vH6 = m.verified_hs6;

      if (r.confirmed_chapter === vCh) c_ok++;
      if (r.confirmed_heading === vH4) h_ok++;
      if (r.confirmed_hs6 === vH6) h6_ok++;
      if (r.confirmed_section === getCh2Sec(vCh)) s_ok++;
    } catch {
      errors++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${mapped.length} — S:${s_ok} C:${c_ok} H:${h_ok} HS6:${h6_ok} err:${errors}`);
    }
  }

  const N = mapped.length;
  console.log(`\n=== v7 Layer 1 Results ===`);
  console.log(`Section:  ${s_ok}/${N} (${Math.round(s_ok / N * 100)}%)`);
  console.log(`Chapter:  ${c_ok}/${N} (${Math.round(c_ok / N * 100)}%)`);
  console.log(`Heading:  ${h_ok}/${N} (${Math.round(h_ok / N * 100)}%)`);
  console.log(`HS6:      ${h6_ok}/${N} (${Math.round(h6_ok / N * 100)}%)`);
  console.log(`Errors:   ${errors}`);

  console.log(`\n=== Comparison ===`);
  console.log(`Scenario                Section  Chapter  Heading  HS6`);
  console.log(`B (simple map)          56%      43%      16%      8%`);
  console.log(`D (v2 material)         57%      46%      19%      8%`);
  console.log(`H (v6 raw text)         65%      43%      16%      6%`);
  console.log(`I (v7 intersection)     ${Math.round(s_ok/N*100)}%      ${Math.round(c_ok/N*100)}%      ${Math.round(h_ok/N*100)}%      ${Math.round(h6_ok/N*100)}%`);

  fs.writeFileSync(`${BASE}/hscodecomp_layer2_v7_layer1_results.json`, JSON.stringify({
    section: { ok: s_ok, pct: Math.round(s_ok / N * 100) },
    chapter: { ok: c_ok, pct: Math.round(c_ok / N * 100) },
    heading: { ok: h_ok, pct: Math.round(h_ok / N * 100) },
    hs6: { ok: h6_ok, pct: Math.round(h6_ok / N * 100) },
    errors,
    total: N,
  }, null, 2));
  console.log(`\n✅ Saved: ${BASE}/hscodecomp_layer2_v7_layer1_results.json`);
}

main().catch(console.error);
