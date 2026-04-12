#!/usr/bin/env node
/**
 * CW34-S1 Accuracy Verification — run POTAL_Ablation_V2.xlsx benchmark
 * against the live engine and report pass/fail per test case.
 *
 * Uses two datasets from the benchmark XLSX:
 *   1. "Baseline Detail" — 50 Amazon products (expected all pass)
 *   2. "HSCodeComp Detail" — 632 products with Verified HS6 ground truth
 *
 * Calls POST /api/v1/classify with X-Demo-Request:true (auth bypass).
 *
 * Usage:
 *   PORT=3040 npm run start &   # start server
 *   sleep 8
 *   PORT=3040 node scripts/verify-cw34-accuracy.mjs
 *
 * Or pass --baseline-only / --hscomp-only to run subsets.
 */
import fs from 'node:fs';

// xlsx is installed as a devDep (npm install --no-save xlsx)
let XLSX;
try { XLSX = (await import('xlsx')).default || (await import('xlsx')); }
catch { console.error('xlsx not found. Run: npm install --no-save xlsx'); process.exit(1); }

const PORT = process.env.PORT || '3040';
const BASE = `http://localhost:${PORT}`;
const XLSX_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx';

if (!fs.existsSync(XLSX_PATH)) {
  console.error(`Benchmark file not found: ${XLSX_PATH}`);
  console.error('Connect the external drive (/Volumes/soulmaten/).');
  process.exit(1);
}

const wb = XLSX.readFile(XLSX_PATH);

// ─── Parse benchmark datasets ─────────────────────────

function parseBaseline() {
  const ws = wb.Sheets['Baseline Detail'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  // Header at row index 2; data starts at 3
  const cases = [];
  const seen = new Set();
  for (let i = 3; i < data.length; i++) {
    const r = data[i];
    if (!r || !r[0] || !r[1]) continue;
    const key = `${r[0]}_${r[1]}`;
    if (seen.has(key)) continue; // skip dupes
    seen.add(key);
    cases.push({
      id: `BL-${r[0]}`,
      product: String(r[1]).trim(),
      material: r[2] || '',
      category: r[3] || '',
      expectedSection: r[4],
      expectedChapter: String(r[5]).padStart(2, '0'),
      expectedHeading: String(r[6]),
      expectedHS6: String(r[7]),
    });
  }
  return cases;
}

function parseHSCodeComp() {
  const ws = wb.Sheets['HSCodeComp Detail'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  // Header at row 0; data starts at 1
  const cases = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r === undefined || r[0] === undefined) continue;
    const verifiedHS6 = String(r[5] || '').trim();
    if (!verifiedHS6 || verifiedHS6 === 'undefined') continue;
    cases.push({
      id: `HC-${r[0]}`,
      product: String(r[1] || '').trim(),
      material: String(r[2] || '').trim(),
      category: String(r[3] || '').trim(),
      expectedHS6: verifiedHS6,
      pipelineHS6: String(r[6] || '').trim(), // historical pipeline result
    });
  }
  return cases;
}

// ─── Classify via API ─────────────────────────────────

async function classify(productName, category) {
  try {
    // Use the demo/scenario route (seller) which calls the real engine
    // without the strict field validation of /api/v1/classify.
    // The HS code comes from the engine's classifyWithOverrideAsync path.
    const body = {
      scenarioId: 'seller',
      inputs: {
        product: productName,
        from: 'CN', // origin doesn't affect HS classification
        to: 'US',   // destination affects HS10 but not HS6
        value: 100,
        ...(category ? { category } : {}),
      },
    };
    const res = await fetch(`${BASE}/api/demo/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const json = await res.json();
    if (!json.success) return { error: json.error?.message || 'classify failed' };
    const result = json.data?.result;
    if (!result || result.hsCode === '0000') {
      return { error: `engine unavailable (source=${json.data?.source})` };
    }
    return {
      hsCode: String(result.hsCode || '').replace(/\./g, ''),
      description: result.hsDescription || '',
      confidence: 0, // demo route doesn't expose confidence
      source: json.data?.source || '',
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Matching logic ───────────────────────────────────

function matchHS6(expected, actual) {
  const exp = String(expected).replace(/\./g, '').trim();
  const act = String(actual).replace(/\./g, '').trim();
  if (!exp || !act) return { ch: false, h: false, hs6: false };
  return {
    ch: act.slice(0, 2) === exp.slice(0, 2),
    h: act.slice(0, 4) === exp.slice(0, 4),
    hs6: act.slice(0, 6) === exp.slice(0, 6),
  };
}

// ─── Main ─────────────────────────────────────────────

const args = process.argv.slice(2);
const baselineOnly = args.includes('--baseline-only');
const hscompOnly = args.includes('--hscomp-only');
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0');

const baseline = baselineOnly || !hscompOnly ? parseBaseline() : [];
const hscomp = hscompOnly || !baselineOnly ? parseHSCodeComp() : [];

let allCases = [...baseline, ...hscomp];
if (limit > 0) allCases = allCases.slice(0, limit);

console.log(`\n=== CW34-S1 Accuracy Benchmark ===`);
console.log(`Baseline: ${baseline.length} | HSCodeComp: ${hscomp.length} | Total: ${allCases.length}${limit ? ` (limited to ${limit})` : ''}`);
console.log(`Target: ${BASE}\n`);

const results = [];
let done = 0;
const stats = { total: 0, chPass: 0, hPass: 0, hs6Pass: 0, errors: 0 };
const failCategories = {};

for (const c of allCases) {
  const t0 = Date.now();
  const res = await classify(c.product, c.category || c.material || undefined);
  const elapsed = Date.now() - t0;
  stats.total++;

  if (res.error) {
    stats.errors++;
    results.push({ ...c, actual: '(error)', pass: false, error: res.error, elapsed });
    if (++done % 50 === 0) console.log(`  progress: ${done}/${allCases.length}`);
    continue;
  }

  const m = matchHS6(c.expectedHS6, res.hsCode);
  if (m.ch) stats.chPass++;
  if (m.h) stats.hPass++;
  if (m.hs6) stats.hs6Pass++;

  const pass = m.hs6;
  if (!pass) {
    // Categorize failure
    const cat = m.h ? 'A_subheading_mismatch'
      : m.ch ? 'B_heading_mismatch'
      : 'C_chapter_mismatch';
    failCategories[cat] = (failCategories[cat] || 0) + 1;
  }

  results.push({
    ...c,
    actual: res.hsCode,
    actualDesc: res.description?.slice(0, 60),
    confidence: res.confidence,
    source: res.source,
    chMatch: m.ch,
    hMatch: m.h,
    hs6Match: m.hs6,
    pass,
    elapsed,
  });

  if (++done % 50 === 0) {
    console.log(`  progress: ${done}/${allCases.length} (hs6: ${stats.hs6Pass}/${stats.total})`);
  }
}

// ─── Report ───────────────────────────────────────────

console.log('\n=== Results ===');
console.log(`Total:     ${stats.total}`);
console.log(`Chapter:   ${stats.chPass}/${stats.total} (${(stats.chPass/stats.total*100).toFixed(1)}%)`);
console.log(`Heading:   ${stats.hPass}/${stats.total} (${(stats.hPass/stats.total*100).toFixed(1)}%)`);
console.log(`HS6:       ${stats.hs6Pass}/${stats.total} (${(stats.hs6Pass/stats.total*100).toFixed(1)}%)`);
console.log(`Errors:    ${stats.errors}`);

if (Object.keys(failCategories).length > 0) {
  console.log('\nFail categories:');
  Object.entries(failCategories).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
}

// Print first 20 fails
const fails = results.filter(r => !r.pass);
if (fails.length > 0) {
  console.log(`\nFirst 20 fails (of ${fails.length}):`);
  fails.slice(0, 20).forEach(f => {
    console.log(`  ${f.id} expected=${f.expectedHS6} actual=${f.actual} product="${f.product?.slice(0,50)}"`);
  });
}

// Save full results JSON for analysis
const reportPath = '/tmp/cw34-accuracy-results.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\nFull results saved to: ${reportPath}`);

// Exit code: 0 if 100% pass, 1 otherwise
const passRate = stats.hs6Pass / stats.total;
console.log(`\nPass rate: ${(passRate * 100).toFixed(1)}%`);
if (passRate < 1.0) {
  console.log(`${stats.total - stats.hs6Pass} cases need fixing.`);
  process.exit(1);
}
