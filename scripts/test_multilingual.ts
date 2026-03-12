/**
 * Task 2: 20 Multilingual Pipeline Tests
 * Cotton T-Shirt in 20 languages via classifyProductAsync
 * Non-English input → keyword miss → vector/LLM fallback (expected behavior)
 */

import { classifyProductAsync } from '../app/lib/cost-engine/ai-classifier/ai-classifier-wrapper';

interface LangCase {
  lang: string;
  input: string;
}

const languages: LangCase[] = [
  { lang: 'English', input: 'Cotton T-Shirt' },
  { lang: 'Korean', input: '면 티셔츠' },
  { lang: 'Japanese', input: '綿Tシャツ' },
  { lang: 'Chinese (Simplified)', input: '棉质T恤' },
  { lang: 'Chinese (Traditional)', input: '棉質T恤' },
  { lang: 'Spanish', input: 'Camiseta de algodón' },
  { lang: 'French', input: 'T-shirt en coton' },
  { lang: 'German', input: 'Baumwoll-T-Shirt' },
  { lang: 'Portuguese', input: 'Camiseta de algodão' },
  { lang: 'Italian', input: 'Maglietta di cotone' },
  { lang: 'Dutch', input: 'Katoenen T-shirt' },
  { lang: 'Russian', input: 'Хлопковая футболка' },
  { lang: 'Arabic', input: 'تي شيرت قطني' },
  { lang: 'Hindi', input: 'सूती टी-शर्ट' },
  { lang: 'Thai', input: 'เสื้อยืดผ้าฝ้าย' },
  { lang: 'Vietnamese', input: 'Áo thun cotton' },
  { lang: 'Turkish', input: 'Pamuklu tişört' },
  { lang: 'Polish', input: 'Bawełniany T-shirt' },
  { lang: 'Swedish', input: 'Bomulls-T-shirt' },
  { lang: 'Indonesian', input: 'Kaos katun' },
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Task 2: Multilingual Classification Pipeline (20 languages)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  const results: { lang: string; input: string; hs: string; hs4: string; conf: number; method: string; status: string; issue: string }[] = [];

  for (const tc of languages) {
    process.stdout.write(`  ${tc.lang.padEnd(22)} "${tc.input}" ... `);
    try {
      const result = await classifyProductAsync(tc.input);
      const hs = result?.hsCode || 'N/A';
      const hs4 = hs.slice(0, 4);
      const conf = result?.confidence ?? 0;
      const method = result?.method || 'unknown';

      // For Cotton T-Shirt: HS4 should be 6109 (knitted t-shirts) or 6109-6110 range
      // Accept 6109, 6110, or broader apparel chapters 61/62
      const apparelOk = ['61', '62'].includes(hs.slice(0, 2));
      const status = apparelOk ? '✅' : (hs === 'N/A' || hs === '9999' ? '⚠️' : '❌');

      if (apparelOk) passed++;
      else failed++;

      results.push({
        lang: tc.lang,
        input: tc.input,
        hs,
        hs4,
        conf,
        method,
        status,
        issue: apparelOk ? '' : (hs === '9999' ? 'No classification' : `Got ${hs4}, expected 61xx/62xx`),
      });

      console.log(`${status} ${hs} (${method}, conf: ${conf.toFixed(2)})`);
    } catch (err: any) {
      failed++;
      results.push({
        lang: tc.lang,
        input: tc.input,
        hs: 'ERR',
        hs4: 'ERR',
        conf: 0,
        method: 'error',
        status: '❌',
        issue: err.message?.slice(0, 60) || 'Unknown error',
      });
      console.log(`❌ ERROR: ${err.message?.slice(0, 60)}`);
    }
  }

  // Summary table
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('| # | Language | Input | HS Code | HS4 | Conf | Method | Status | Issue |');
  console.log('|---|----------|-------|---------|-----|------|--------|--------|-------|');
  results.forEach((r, i) => {
    console.log(`| ${(i+1).toString().padStart(2)} | ${r.lang.padEnd(22)} | ${r.input.padEnd(20)} | ${r.hs.padEnd(6)} | ${r.hs4} | ${r.conf.toFixed(2)} | ${r.method.padEnd(8)} | ${r.status} | ${r.issue} |`);
  });

  // Method distribution
  const methods: Record<string, number> = {};
  results.forEach(r => { methods[r.method] = (methods[r.method] || 0) + 1; });
  console.log('\n📊 Method Distribution:');
  Object.entries(methods).forEach(([m, c]) => console.log(`  ${m}: ${c}`));

  console.log(`\n✅ Passed: ${passed}/20  ❌ Failed: ${failed}/20`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
