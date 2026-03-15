/**
 * POTAL AI Classification Pipeline — 50-Product Benchmark
 *
 * Tests 50 products through the 3-stage pipeline:
 *   Stage 1: Keyword matching (hs-code/classifier.ts)
 *   Stage 2: Vector search (pgvector cosine similarity)
 *   Stage 3: LLM classification (GPT-4o-mini)
 *
 * Usage: npx tsx scripts/benchmark_classification_50.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { classifyProduct } = require('../app/lib/cost-engine/hs-code/classifier');

interface TestProduct {
  product_name: string;
  category: string;
  expected_hs6: string;
}

interface StageResult {
  hsCode: string;
  confidence: number;
  timeMs: number;
  hit: boolean;
  correct: boolean;
  source?: string;
}

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || '';
const MGMT_URL = 'https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query';
const VECTOR_THRESHOLD = 0.55;

// ─── 50 Test Products (diverse categories) ──────────────────
const TEST_PRODUCTS: TestProduct[] = [
  // Electronics (10)
  { product_name: "iPhone 15 Pro Max", category: "Electronics > Communications > Phones", expected_hs6: "851712" },
  { product_name: "Samsung Galaxy Buds", category: "Electronics > Audio > Headphones", expected_hs6: "851830" },
  { product_name: "Sony 65-inch OLED TV", category: "Electronics > Video > Televisions", expected_hs6: "852872" },
  { product_name: "MacBook Pro 16-inch Laptop", category: "Electronics > Computers > Laptops", expected_hs6: "847130" },
  { product_name: "Canon EOS R5 Camera", category: "Electronics > Cameras > Digital Cameras", expected_hs6: "852580" },
  { product_name: "USB-C Charging Cable", category: "Electronics > Accessories > Cables", expected_hs6: "854442" },
  { product_name: "Wireless Bluetooth Mouse", category: "Electronics > Computers > Peripherals", expected_hs6: "847160" },
  { product_name: "Portable Power Bank 20000mAh", category: "Electronics > Batteries > Portable Chargers", expected_hs6: "850760" },
  { product_name: "Smart Watch Fitness Tracker", category: "Electronics > Wearables > Smart Watches", expected_hs6: "910111" },
  { product_name: "Gaming Mechanical Keyboard", category: "Electronics > Computers > Keyboards", expected_hs6: "847160" },

  // Apparel (10)
  { product_name: "Men's Cotton T-Shirt", category: "Apparel & Accessories > Clothing > Shirts & Tops", expected_hs6: "610910" },
  { product_name: "Women's Denim Jeans", category: "Apparel & Accessories > Clothing > Pants", expected_hs6: "620462" },
  { product_name: "Leather Dress Shoes", category: "Apparel & Accessories > Shoes", expected_hs6: "640399" },
  { product_name: "Silk Necktie", category: "Apparel & Accessories > Clothing Accessories > Ties", expected_hs6: "621510" },
  { product_name: "Winter Down Jacket", category: "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets", expected_hs6: "620193" },
  { product_name: "Baby Cotton Onesie", category: "Apparel & Accessories > Clothing > Baby Clothing", expected_hs6: "611120" },
  { product_name: "Running Sneakers", category: "Apparel & Accessories > Shoes > Athletic Shoes", expected_hs6: "640411" },
  { product_name: "Cashmere Scarf", category: "Apparel & Accessories > Clothing Accessories > Scarves", expected_hs6: "621410" },
  { product_name: "Sunglasses UV Protection", category: "Apparel & Accessories > Eyewear > Sunglasses", expected_hs6: "900410" },
  { product_name: "Gold Necklace 18K", category: "Apparel & Accessories > Jewelry > Necklaces", expected_hs6: "711319" },

  // Home & Garden (8)
  { product_name: "Ceramic Coffee Mug", category: "Home & Garden > Kitchen > Drinkware", expected_hs6: "691110" },
  { product_name: "Memory Foam Pillow", category: "Home & Garden > Bedding > Pillows", expected_hs6: "940490" },
  { product_name: "Stainless Steel Cookware Set", category: "Home & Garden > Kitchen > Cookware", expected_hs6: "732393" },
  { product_name: "LED Desk Lamp", category: "Home & Garden > Lighting > Desk Lamps", expected_hs6: "940540" },
  { product_name: "Bathroom Towel Set Cotton", category: "Home & Garden > Bath > Towels", expected_hs6: "630260" },
  { product_name: "Vacuum Cleaner Robot", category: "Home & Garden > Cleaning > Vacuum Cleaners", expected_hs6: "850940" },
  { product_name: "Wall Clock Wooden", category: "Home & Garden > Decor > Clocks", expected_hs6: "910400" },
  { product_name: "Garden Hose 50ft", category: "Home & Garden > Outdoor > Garden Tools", expected_hs6: "391723" },

  // Food & Beverage (5)
  { product_name: "Organic Green Tea", category: "Food, Beverages & Tobacco > Beverages > Tea", expected_hs6: "090210" },
  { product_name: "Dark Chocolate Bar 70%", category: "Food, Beverages & Tobacco > Food > Confectionery", expected_hs6: "180632" },
  { product_name: "Extra Virgin Olive Oil", category: "Food, Beverages & Tobacco > Food > Cooking Oils", expected_hs6: "150910" },
  { product_name: "Instant Coffee Powder", category: "Food, Beverages & Tobacco > Beverages > Coffee", expected_hs6: "210111" },
  { product_name: "Vitamin C Supplements", category: "Health & Beauty > Health Care > Vitamins & Supplements", expected_hs6: "293627" },

  // Sports & Toys (7)
  { product_name: "Yoga Mat Non-Slip", category: "Sporting Goods > Exercise & Fitness > Yoga", expected_hs6: "950699" },
  { product_name: "Carbon Fiber Bicycle", category: "Sporting Goods > Outdoor Recreation > Cycling", expected_hs6: "871200" },
  { product_name: "LEGO Building Set", category: "Toys & Games > Toys > Building Toys", expected_hs6: "950300" },
  { product_name: "Tennis Racket Professional", category: "Sporting Goods > Athletics > Racket Sports > Tennis", expected_hs6: "950651" },
  { product_name: "Electric Scooter", category: "Vehicles & Parts > Motor Vehicles > Scooters", expected_hs6: "871120" },
  { product_name: "Fishing Rod Carbon", category: "Sporting Goods > Outdoor Recreation > Fishing", expected_hs6: "950710" },
  { product_name: "Camping Tent 4-Person", category: "Sporting Goods > Outdoor Recreation > Camping & Hiking", expected_hs6: "630622" },

  // Industrial & Office (5)
  { product_name: "Industrial Drill Press", category: "Hardware > Power Tools > Drills", expected_hs6: "846729" },
  { product_name: "Office Chair Ergonomic", category: "Furniture > Chairs > Office Chairs", expected_hs6: "940130" },
  { product_name: "Printer Ink Cartridge", category: "Office Supplies > Printer Supplies", expected_hs6: "844399" },
  { product_name: "Cardboard Shipping Box", category: "Office Supplies > Packaging > Boxes", expected_hs6: "481910" },
  { product_name: "Stainless Steel Bolts M10", category: "Hardware > Fasteners > Bolts", expected_hs6: "731815" },

  // Beauty & Personal Care (5)
  { product_name: "Organic Face Cream", category: "Health & Beauty > Personal Care > Skin Care", expected_hs6: "330499" },
  { product_name: "Hair Dryer Professional", category: "Health & Beauty > Personal Care > Hair Care > Styling Tools", expected_hs6: "851631" },
  { product_name: "Perfume Eau de Parfum 100ml", category: "Health & Beauty > Personal Care > Fragrance", expected_hs6: "330300" },
  { product_name: "Electric Toothbrush", category: "Health & Beauty > Personal Care > Oral Care", expected_hs6: "851010" },
  { product_name: "Nail Polish Set", category: "Health & Beauty > Personal Care > Cosmetics > Nail Care", expected_hs6: "330430" },
];

// ─── Stage 1: Keyword Classifier ────────────────────────────
function testKeyword(product: TestProduct): StageResult {
  const start = performance.now();
  const result = classifyProduct(product.product_name, product.category);
  const timeMs = Math.round(performance.now() - start);
  const hsCode = result.hsCode || '9999';
  const hit = hsCode !== '9999' && result.confidence >= 0.6;
  const correct = hsCode.startsWith(product.expected_hs6.substring(0, 4));
  return { hsCode, confidence: result.confidence, timeMs, hit, correct };
}

// ─── Stage 2: Vector Search ─────────────────────────────────
async function testVectorSearch(product: TestProduct): Promise<StageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { hsCode: '-', confidence: 0, timeMs: 0, hit: false, correct: false, source: 'no_api_key' };
  }

  const start = performance.now();
  try {
    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `${product.product_name} ${product.category}`.toLowerCase().trim(),
      }),
    });

    if (!embResponse.ok) {
      return { hsCode: '-', confidence: 0, timeMs: Math.round(performance.now() - start), hit: false, correct: false, source: 'embedding_fail' };
    }

    const embData = await embResponse.json();
    const embedding = embData?.data?.[0]?.embedding;
    if (!embedding) {
      return { hsCode: '-', confidence: 0, timeMs: Math.round(performance.now() - start), hit: false, correct: false, source: 'no_embedding' };
    }

    const vecStr = `[${embedding.join(',')}]`;
    const sql = `SELECT product_name, hs_code, 1 - (embedding <=> '${vecStr}'::vector) as similarity FROM hs_classification_vectors WHERE 1 - (embedding <=> '${vecStr}'::vector) >= ${VECTOR_THRESHOLD} ORDER BY embedding <=> '${vecStr}'::vector LIMIT 3;`;

    const rpcResponse = await fetch(MGMT_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });

    const timeMs = Math.round(performance.now() - start);
    if (!rpcResponse.ok) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: `sql_error:${rpcResponse.status}` };
    }

    const matches = await rpcResponse.json();
    if (!matches || matches.length === 0) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: 'no_match' };
    }

    const best = matches[0];
    const similarity = best.similarity || 0;
    const correct = best.hs_code?.startsWith(product.expected_hs6.substring(0, 4)) || false;

    return { hsCode: best.hs_code || '-', confidence: Math.round(similarity * 100) / 100, timeMs, hit: true, correct, source: `sim=${similarity.toFixed(3)}` };
  } catch (err: any) {
    return { hsCode: '-', confidence: 0, timeMs: Math.round(performance.now() - start), hit: false, correct: false, source: err.message };
  }
}

// ─── Stage 3: LLM Classification ────────────────────────────
async function testLlm(product: TestProduct): Promise<StageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { hsCode: '-', confidence: 0, timeMs: 0, hit: false, correct: false, source: 'no_api_key' };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an HS Code classification expert. Given a product name and category, return the most specific 6-digit HS code. Respond ONLY in JSON:\n{"hsCode":"XXXXXX","description":"...","confidence":0.0-1.0}`,
          },
          { role: 'user', content: `Product: ${product.product_name}\nCategory: ${product.category}` },
        ],
      }),
    });

    const timeMs = Math.round(performance.now() - start);
    if (!response.ok) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: `api_error:${response.status}` };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const hsCode = (parsed.hsCode || '').replace(/\./g, '').substring(0, 6);
    const confidence = parsed.confidence || 0;
    const correct = hsCode.startsWith(product.expected_hs6.substring(0, 4));
    const tokens = data?.usage?.total_tokens || 0;

    return { hsCode, confidence, timeMs, hit: hsCode.length >= 4, correct, source: `tokens=${tokens}` };
  } catch (err: any) {
    return { hsCode: '-', confidence: 0, timeMs: Math.round(performance.now() - start), hit: false, correct: false, source: err.message };
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const N = TEST_PRODUCTS.length;
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(` POTAL AI Classification Pipeline — ${N}-Product Benchmark`);
  console.log(' Stages: ① Keyword → ② Vector (pgvector) → ③ LLM (GPT-4o-mini)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const results: { product: TestProduct; keyword: StageResult; vector: StageResult; llm: StageResult }[] = [];

  for (let i = 0; i < N; i++) {
    const product = TEST_PRODUCTS[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${N}] ${product.product_name.padEnd(30)} `);

    const keyword = testKeyword(product);
    const vector = await testVectorSearch(product);
    const llm = await testLlm(product);

    results.push({ product, keyword, vector, llm });
    console.log(
      `KW:${keyword.hit ? '✅' : '❌'}(${keyword.hsCode.padEnd(6)}) ` +
      `VEC:${vector.hit ? '✅' : '❌'} ` +
      `LLM:${llm.hit ? '✅' : '❌'}(${llm.hsCode.padEnd(6)})`
    );
  }

  // ─── Detailed Results Table ────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' DETAILED RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(
    '#'.padStart(3) + ' ' +
    'Product'.padEnd(30) + ' ' +
    'Expect'.padEnd(7) + ' ' +
    '│ KW Code'.padEnd(10) + ' ' +
    'OK'.padEnd(3) +
    '│ VEC Code'.padEnd(10) + ' ' +
    'OK'.padEnd(3) +
    '│ LLM Code'.padEnd(10) + ' ' +
    'OK'
  );
  console.log('─'.repeat(90));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(
      String(i + 1).padStart(3) + ' ' +
      r.product.product_name.substring(0, 29).padEnd(30) + ' ' +
      r.product.expected_hs6.padEnd(7) + ' ' +
      `│ ${r.keyword.hsCode.padEnd(7)} ` +
      (r.keyword.correct ? '✅' : '❌') + ' ' +
      `│ ${r.vector.hsCode.substring(0, 7).padEnd(7)} ` +
      (r.vector.correct ? '✅' : '❌') + ' ' +
      `│ ${r.llm.hsCode.padEnd(7)} ` +
      (r.llm.correct ? '✅' : '❌')
    );
  }

  // ─── Aggregate Statistics ──────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' AGGREGATE STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const kwHits = results.filter(r => r.keyword.hit).length;
  const kwCorrect = results.filter(r => r.keyword.correct).length;
  const kwAvgMs = Math.round(results.reduce((s, r) => s + r.keyword.timeMs, 0) / N);

  const vecHits = results.filter(r => r.vector.hit).length;
  const vecCorrect = results.filter(r => r.vector.correct).length;
  const vecAvgMs = Math.round(results.reduce((s, r) => s + r.vector.timeMs, 0) / N);

  const llmHits = results.filter(r => r.llm.hit).length;
  const llmCorrect = results.filter(r => r.llm.correct).length;
  const llmAvgMs = Math.round(results.reduce((s, r) => s + r.llm.timeMs, 0) / N);
  const llmAvgConf = llmHits > 0 ? (results.filter(r => r.llm.hit).reduce((s, r) => s + r.llm.confidence, 0) / llmHits).toFixed(2) : '-';

  console.log('Stage         │ Hit Rate       │ HS4 Accuracy   │ Avg Time    │ Avg Confidence');
  console.log('──────────────┼────────────────┼────────────────┼─────────────┼───────────────');
  console.log(`① Keyword     │ ${String(kwHits).padStart(2)}/${N} (${(kwHits / N * 100).toFixed(0).padStart(3)}%)  │ ${String(kwCorrect).padStart(2)}/${N} (${(kwCorrect / N * 100).toFixed(0).padStart(3)}%)  │ ${String(kwAvgMs).padStart(4)}ms      │ -`);
  console.log(`② Vector      │ ${String(vecHits).padStart(2)}/${N} (${(vecHits / N * 100).toFixed(0).padStart(3)}%)  │ ${String(vecCorrect).padStart(2)}/${N} (${(vecCorrect / N * 100).toFixed(0).padStart(3)}%)  │ ${String(vecAvgMs).padStart(4)}ms      │ -`);
  console.log(`③ LLM         │ ${String(llmHits).padStart(2)}/${N} (${(llmHits / N * 100).toFixed(0).padStart(3)}%)  │ ${String(llmCorrect).padStart(2)}/${N} (${(llmCorrect / N * 100).toFixed(0).padStart(3)}%)  │ ${String(llmAvgMs).padStart(4)}ms      │ ${llmAvgConf}`);

  // Pipeline combined
  const pipelineCorrect = results.filter(r =>
    (r.keyword.hit && r.keyword.correct) ||
    (r.vector.hit && r.vector.correct) ||
    (r.llm.hit && r.llm.correct)
  ).length;

  const keywordOnly = kwHits;
  const needsVector = results.filter(r => !r.keyword.hit && r.vector.hit).length;
  const needsLlm = results.filter(r => !r.keyword.hit && !r.vector.hit).length;

  // Category breakdown
  const categories = new Map<string, { total: number; kwCorrect: number; llmCorrect: number; pipeCorrect: number }>();
  for (const r of results) {
    const cat = r.product.category.split(' > ')[0];
    const entry = categories.get(cat) || { total: 0, kwCorrect: 0, llmCorrect: 0, pipeCorrect: 0 };
    entry.total++;
    if (r.keyword.correct) entry.kwCorrect++;
    if (r.llm.correct) entry.llmCorrect++;
    if ((r.keyword.hit && r.keyword.correct) || (r.vector.hit && r.vector.correct) || (r.llm.hit && r.llm.correct)) entry.pipeCorrect++;
    categories.set(cat, entry);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(' PIPELINE SUMMARY');
  console.log('══════════════════════════════════════════════════\n');
  console.log(`🎯 Pipeline Accuracy (any stage): ${pipelineCorrect}/${N} (${(pipelineCorrect / N * 100).toFixed(0)}%)`);
  console.log(`⚡ Keyword resolves (free):       ${keywordOnly}/${N} (${(keywordOnly / N * 100).toFixed(0)}%)`);
  console.log(`🔍 Vector resolves (low cost):    ${needsVector}/${N}`);
  console.log(`🤖 Needs LLM fallback:            ${needsLlm}/${N} (${(needsLlm / N * 100).toFixed(0)}%)`);

  console.log('\n──────────────────────────────────────────────────');
  console.log(' ACCURACY BY CATEGORY');
  console.log('──────────────────────────────────────────────────');
  for (const [cat, stats] of [...categories.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${cat.padEnd(35)} ${stats.pipeCorrect}/${stats.total} pipeline | KW ${stats.kwCorrect}/${stats.total} | LLM ${stats.llmCorrect}/${stats.total}`);
  }

  // Save results to JSON
  const outputPath = resolve(__dirname, '..', 'benchmark_classification_results.json');
  const output = {
    timestamp: new Date().toISOString(),
    totalProducts: N,
    stages: {
      keyword: { hitRate: kwHits / N, accuracy: kwCorrect / N, avgMs: kwAvgMs },
      vector: { hitRate: vecHits / N, accuracy: vecCorrect / N, avgMs: vecAvgMs },
      llm: { hitRate: llmHits / N, accuracy: llmCorrect / N, avgMs: llmAvgMs },
    },
    pipeline: { accuracy: pipelineCorrect / N, keywordOnly: keywordOnly / N, needsLlm: needsLlm / N },
    categoryBreakdown: Object.fromEntries(categories),
    details: results.map(r => ({
      product: r.product.product_name,
      expected: r.product.expected_hs6,
      keyword: { code: r.keyword.hsCode, correct: r.keyword.correct, ms: r.keyword.timeMs },
      vector: { code: r.vector.hsCode, correct: r.vector.correct, ms: r.vector.timeMs },
      llm: { code: r.llm.hsCode, correct: r.llm.correct, ms: r.llm.timeMs },
    })),
  };
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n📁 Results saved to: benchmark_classification_results.json\n`);
}

main().catch(console.error);
