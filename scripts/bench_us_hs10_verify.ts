/**
 * US HS10 Verification Benchmark
 * All 169 valid products → destination_country='US' → verify final_hs_code against gov_tariff_schedules description
 */
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const INPUT = `${BASE}/amazon_9field_complete.json`;
const OUTPUT = `${BASE}/us_hs10_verification.json`;

const INVALID_MATS = new Set(['blend', 'other', 'unknown', 'various', 'mixed', 'n/a', 'na', 'none', '']);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function lookupHtsDesc(code: string): Promise<string> {
  const { data } = await supabase
    .from('gov_tariff_schedules')
    .select('description')
    .eq('country', 'US')
    .eq('hs_code', code)
    .limit(1);
  return data?.[0]?.description || '';
}

function autoJudge(productName: string, material: string, htsDesc: string): string {
  if (!htsDesc) return 'NO_EXPANSION';
  const nl = productName.toLowerCase();
  const dl = htsDesc.toLowerCase();
  const ml = material.toLowerCase();

  // Material in description
  if (ml.length > 2 && dl.includes(ml)) return 'MATCH';
  // Specific material variants
  if (ml.includes('cotton') && dl.includes('cotton')) return 'MATCH';
  if (ml.includes('steel') && (dl.includes('steel') || dl.includes('iron'))) return 'MATCH';
  if (ml.includes('leather') && dl.includes('leather')) return 'MATCH';
  if (ml.includes('bamboo') && (dl.includes('bamboo') || dl.includes('wood'))) return 'MATCH';
  if (ml.includes('ceramic') && (dl.includes('ceramic') || dl.includes('stoneware') || dl.includes('porcelain'))) return 'MATCH';
  if (ml.includes('glass') && dl.includes('glass')) return 'MATCH';
  if (ml.includes('plastic') && (dl.includes('plastic') || dl.includes('polyeth') || dl.includes('polyprop'))) return 'MATCH';
  if (ml.includes('rubber') && (dl.includes('rubber') || dl.includes('vulcan'))) return 'MATCH';
  if (ml.includes('aluminum') && (dl.includes('alumin') || dl.includes('aluminium'))) return 'MATCH';
  if (ml.includes('silk') && dl.includes('silk')) return 'MATCH';
  if (ml.includes('wool') && dl.includes('wool')) return 'MATCH';
  if (ml.includes('polyester') && (dl.includes('synth') || dl.includes('man-made') || dl.includes('polyester'))) return 'MATCH';
  if (ml.includes('linen') && (dl.includes('linen') || dl.includes('flax'))) return 'MATCH';
  if (ml.includes('soy wax') && (dl.includes('candle') || dl.includes('wax'))) return 'MATCH';
  if (ml.includes('iron') && (dl.includes('iron') || dl.includes('steel'))) return 'MATCH';

  // Product keyword match
  const words = nl.split(/\s+/).filter(w => w.length > 3);
  const matched = words.filter(w => dl.includes(w));
  if (matched.length >= 2) return 'MATCH';
  if (matched.length >= 1) return 'PARTIAL';

  // Category-level check
  if (dl.includes('other') || dl.includes('n.e.c.') || dl.includes('not elsewhere')) return 'PARTIAL';

  return 'REVIEW';
}

async function main() {
  const all: any[] = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

  // Filter valid
  const products = all.filter(p => {
    const mat = (p.material || '').trim().toLowerCase();
    return !INVALID_MATS.has(mat) && mat.length > 0;
  });
  console.log(`\n=== US HS10 Verification — ${products.length} valid products (all dest=US) ===\n`);

  const results: any[] = [];
  let errors = 0, expanded = 0, match = 0, partial = 0, mismatch = 0, noExp = 0, review = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const r = await classifyV3({
        product_name: p.product_name || '',
        material: p.material || 'unknown',
        origin_country: p.origin_country || 'CN',
        destination_country: 'US',
        category: typeof p.category === 'string' ? p.category : String(p.category || ''),
        description: p.description || '',
        processing: p.processing || '',
        composition: p.composition || '',
        weight_spec: p.weight_spec || '',
        price: p.price || undefined,
      });

      const fc = r.final_hs_code || r.confirmed_hs6 || '';
      const prec = r.hs_code_precision || 'HS6';
      const isExpanded = fc.length > 6;
      if (isExpanded) expanded++;

      // Lookup HTS description
      let htsDesc = '';
      if (isExpanded) {
        htsDesc = await lookupHtsDesc(fc);
        // If not found, try hs6 parent
        if (!htsDesc) htsDesc = await lookupHtsDesc(r.confirmed_hs6 || '');
      }

      const judgment = isExpanded ? autoJudge(p.product_name, p.material, htsDesc) : 'NO_EXPANSION';
      if (judgment === 'MATCH') match++;
      else if (judgment === 'PARTIAL') partial++;
      else if (judgment === 'REVIEW') review++;
      else if (judgment === 'NO_EXPANSION') noExp++;
      else mismatch++;

      results.push({
        idx: i + 1,
        product_name: (p.product_name || '').substring(0, 60),
        material: (p.material || '').substring(0, 25),
        category: (typeof p.category === 'string' ? p.category : '').substring(0, 30),
        hs6: r.confirmed_hs6,
        final_code: fc,
        precision: prec,
        hts_description: htsDesc.substring(0, 100),
        judgment,
        duty_rate: r.country_specific?.duty_rate,
        confidence: r.confidence,
        time_ms: r.processing_time_ms,
      });

      if (i < 5 || judgment === 'REVIEW' || judgment === 'MISMATCH' || i % 30 === 0) {
        const mark = judgment === 'MATCH' ? '✅' : (judgment === 'PARTIAL' ? '🔶' : (judgment === 'NO_EXPANSION' ? '⬜' : '❓'));
        console.log(`[${i+1}/${products.length}] ${mark} "${(p.product_name||'').substring(0,30)}" → ${fc}(${prec}) ${judgment}`);
        if (judgment === 'REVIEW') console.log(`   HTS: "${htsDesc.substring(0,80)}"`);
      }
    } catch (e: any) {
      errors++;
      results.push({ idx: i+1, product_name: (p.product_name||'').substring(0,60), error: e.message });
    }
  }

  const N = products.length;
  console.log(`\n=== Summary ===`);
  console.log(`Total: ${N}, Errors: ${errors}`);
  console.log(`Expanded (>6 digit): ${expanded}/${N} (${(expanded/N*100).toFixed(1)}%)`);
  console.log(`\nJudgment:`);
  console.log(`  MATCH:        ${match}/${N} (${(match/N*100).toFixed(1)}%)`);
  console.log(`  PARTIAL:      ${partial}/${N} (${(partial/N*100).toFixed(1)}%)`);
  console.log(`  REVIEW:       ${review}/${N} (${(review/N*100).toFixed(1)}%)`);
  console.log(`  NO_EXPANSION: ${noExp}/${N} (${(noExp/N*100).toFixed(1)}%)`);
  console.log(`  MISMATCH:     ${mismatch}/${N} (${(mismatch/N*100).toFixed(1)}%)`);
  console.log(`\n10자리 정확도 (MATCH+PARTIAL): ${match+partial}/${expanded} (${expanded > 0 ? ((match+partial)/expanded*100).toFixed(1) : 0}% of expanded)`);

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n✅ Saved: ${OUTPUT}`);
}

main().catch(console.error);
