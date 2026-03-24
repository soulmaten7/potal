/**
 * Regression test: Clean 20 items + Amazon 169 items (9-field)
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';

const getCh2Sec = (ch: number) => {
  if (ch <= 5) return 1; if (ch <= 14) return 2; if (ch === 15) return 3;
  if (ch <= 24) return 4; if (ch <= 27) return 5; if (ch <= 38) return 6;
  if (ch <= 40) return 7; if (ch <= 43) return 8; if (ch <= 46) return 9;
  if (ch <= 49) return 10; if (ch <= 63) return 11; if (ch <= 67) return 12;
  if (ch <= 70) return 13; if (ch === 71) return 14; if (ch <= 83) return 15;
  if (ch <= 85) return 16; if (ch <= 89) return 17; if (ch <= 92) return 18;
  if (ch === 93) return 19; if (ch <= 96) return 20; return 21;
};

async function runTest(name: string, items: any[]) {
  let s_ok = 0, c_ok = 0, h_ok = 0, h6_ok = 0, errors = 0;
  const failures: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    try {
      const r = await classifyV3({
        product_name: m.product_name || '',
        material: m.material || 'unknown',
        origin_country: m.origin_country || 'CN',
        destination_country: 'US',
        category: typeof m.category === 'string' ? m.category : String(m.category || ''),
        description: m.description || '',
        processing: m.processing || '',
        composition: m.composition || '',
        weight_spec: m.weight_spec || '',
        price: m.price || undefined,
      });

      const vH6 = m.verified_hs6 || m.correct_hs6 || '';
      const vCh = m.verified_chapter || (vH6 ? parseInt(vH6.substring(0, 2)) : 0);
      if (r.confirmed_section === getCh2Sec(vCh)) s_ok++;
      else failures.push(`[${i}] Section: got ${r.confirmed_section} want ${getCh2Sec(vCh)} — ${(m.product_name||'').substring(0,40)}`);
      if (r.confirmed_chapter === vCh) c_ok++;
      else if (failures.length <= 5) failures.push(`[${i}] Chapter: got ${r.confirmed_chapter} want ${vCh} — ${(m.product_name||'').substring(0,40)}`);
      if (r.confirmed_heading === (vH6||'').substring(0,4)) h_ok++;
      if (r.confirmed_hs6 === vH6) h6_ok++;
    } catch (e: any) {
      errors++;
    }
    if ((i + 1) % 50 === 0) process.stdout.write(`  [${name}] ${i+1}/${items.length}\r`);
  }

  const N = items.length;
  console.log(`${name}: Section=${s_ok}/${N}(${Math.round(s_ok/N*100)}%) Chapter=${c_ok}/${N}(${Math.round(c_ok/N*100)}%) Heading=${h_ok}/${N}(${Math.round(h_ok/N*100)}%) HS6=${h6_ok}/${N}(${Math.round(h6_ok/N*100)}%) errors=${errors}`);
  if (failures.length > 0) {
    console.log(`  Failures (first 5):`);
    for (const f of failures.slice(0, 5)) console.log(`    ${f}`);
  }
  return { s_ok, c_ok, h_ok, h6_ok, errors, total: N };
}

async function main() {
  console.log('\n=== Regression Test ===\n');

  // 1. Clean 20
  const clean20 = JSON.parse(fs.readFileSync(`${BASE}/clean_test_20_v3.json`, 'utf-8'));
  const cleanItems = clean20.items || clean20;
  const r1 = await runTest('Clean 20', cleanItems);

  // 2. Amazon 169 (9-field complete)
  const amazon = JSON.parse(fs.readFileSync(`${BASE}/amazon_9field_complete.json`, 'utf-8'));
  const INVALID_MATS = new Set(['blend','other','unknown','various','mixed','n/a','na','none','']);
  const validAmazon = amazon.filter((p: any) => !INVALID_MATS.has((p.material || '').trim().toLowerCase()));
  const r2 = await runTest('Amazon 169', validAmazon);

  // Summary
  console.log('\n=== Regression Summary ===');
  console.log(`Clean 20:   Section ${r1.s_ok}/20  Chapter ${r1.c_ok}/20  ${r1.s_ok === 20 && r1.c_ok === 20 ? '✅' : '⚠️ REGRESSION'}`);
  console.log(`Amazon 169: Section ${r2.s_ok}/169 Chapter ${r2.c_ok}/169 HS6 ${r2.h6_ok}/169`);

  if (r1.s_ok < 20 || r1.c_ok < 20) {
    console.log('\n⚠️ REGRESSION ON CLEAN 20 — ROLLBACK NEEDED');
  } else {
    console.log('\n✅ Clean 20: PASS');
  }
}

main().catch(console.error);
