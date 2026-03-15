/**
 * POTAL AI Classification Pipeline — Real Data Test
 *
 * Tests 20 random products from product_hs_mappings through the 3-stage pipeline:
 *   Stage 1: Keyword matching (hs-code/classifier.ts)
 *   Stage 2: Vector search (pgvector cosine similarity)
 *   Stage 3: LLM classification (OpenAI/Anthropic)
 *
 * Usage: npx tsx scripts/test_ai_classification_pipeline.ts
 */

// Load .env.local manually
import { readFileSync } from 'fs';
import { resolve } from 'path';
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

// ─── Stage 1: Keyword Classifier (sync, no API calls) ────────

const { classifyProduct } = require('../app/lib/cost-engine/hs-code/classifier');

// ─── Types ────────────────────────────────────────────────────

interface TestProduct {
  product_name: string;
  category: string;
  expected_hs6: string;
  db_confidence: number;
}

interface StageResult {
  hsCode: string;
  confidence: number;
  timeMs: number;
  hit: boolean;
  correct: boolean; // HS6 prefix matches expected
  source?: string;
}

interface TestResult {
  product: TestProduct;
  keyword: StageResult;
  vector: StageResult;
  llm: StageResult;
}

// ─── Test Products (from product_hs_mappings random 20) ──────

const TEST_PRODUCTS: TestProduct[] = [
  { product_name: "Phones", category: "Electronics > Communications > Phones", expected_hs6: "851712", db_confidence: 0.85 },
  { product_name: "Backpacks", category: "Luggage & Bags > Backpacks", expected_hs6: "420292", db_confidence: 0.7 },
  { product_name: "Toys & Games", category: "Toys & Games", expected_hs6: "950300", db_confidence: 0.7 },
  { product_name: "Camping & Hiking", category: "Sporting Goods > Outdoor Recreation > Camping & Hiking", expected_hs6: "630622", db_confidence: 0.85 },
  { product_name: "Office Supplies", category: "Office Supplies", expected_hs6: "482090", db_confidence: 0.7 },
  { product_name: "Bird Supplies", category: "Animals & Pet Supplies > Pet Supplies > Bird Supplies", expected_hs6: "230990", db_confidence: 0.85 },
  { product_name: "Chairs", category: "Furniture > Chairs", expected_hs6: "940130", db_confidence: 0.7 },
  { product_name: "Diapering", category: "Baby & Toddler > Diapering", expected_hs6: "961900", db_confidence: 0.7 },
  { product_name: "Watches", category: "Apparel & Accessories > Jewelry > Watches", expected_hs6: "910111", db_confidence: 0.85 },
  { product_name: "Hardware", category: "Hardware", expected_hs6: "820559", db_confidence: 0.7 },
  { product_name: "Toys", category: "Baby & Toddler > Toys", expected_hs6: "950300", db_confidence: 0.7 },
  { product_name: "Shirts & Tops", category: "Apparel & Accessories > Clothing > Shirts & Tops", expected_hs6: "610510", db_confidence: 0.85 },
  { product_name: "Board Games", category: "Toys & Games > Games > Board Games", expected_hs6: "950490", db_confidence: 0.85 },
  { product_name: "Fish Supplies", category: "Animals & Pet Supplies > Pet Supplies > Fish Supplies", expected_hs6: "230990", db_confidence: 0.85 },
  { product_name: "Cycling", category: "Sporting Goods > Outdoor Recreation > Cycling", expected_hs6: "871200", db_confidence: 0.85 },
  { product_name: "Fishing", category: "Sporting Goods > Outdoor Recreation > Fishing", expected_hs6: "950710", db_confidence: 0.85 },
  { product_name: "Plumbing", category: "Hardware > Plumbing", expected_hs6: "848180", db_confidence: 0.7 },
  { product_name: "Puzzles", category: "Toys & Games > Games > Puzzles", expected_hs6: "950490", db_confidence: 0.85 },
  { product_name: "Animals & Pet Supplies", category: "Animals & Pet Supplies", expected_hs6: "230910", db_confidence: 0.7 },
  { product_name: "Games", category: "Toys & Games > Games", expected_hs6: "950490", db_confidence: 0.7 },
];

// ─── Stage Testers ───────────────────────────────────────────

function testKeyword(product: TestProduct): StageResult {
  const start = performance.now();
  const result = classifyProduct(product.product_name, product.category);
  const timeMs = Math.round(performance.now() - start);
  const hsCode = result.hsCode || '9999';
  const hit = hsCode !== '9999' && result.confidence >= 0.6;
  const correct = hsCode.startsWith(product.expected_hs6.substring(0, 4)); // HS4 match

  return { hsCode, confidence: result.confidence, timeMs, hit, correct };
}

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || '';
const MGMT_URL = 'https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query';
const VECTOR_THRESHOLD = 0.55; // test threshold (production: 0.85)

async function testVectorSearch(product: TestProduct): Promise<StageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { hsCode: '-', confidence: 0, timeMs: 0, hit: false, correct: false, source: 'no_api_key' };
  }

  const start = performance.now();

  try {
    // Generate embedding
    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `${product.product_name} ${product.category}`.toLowerCase().trim(),
      }),
    });

    if (!embResponse.ok) {
      const timeMs = Math.round(performance.now() - start);
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: 'embedding_fail' };
    }

    const embData = await embResponse.json();
    const embedding = embData?.data?.[0]?.embedding;
    if (!embedding) {
      const timeMs = Math.round(performance.now() - start);
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: 'no_embedding' };
    }

    // Search vectors via Management API SQL (REST API 503 우회)
    const vecStr = `[${embedding.join(',')}]`;
    const sql = `SELECT product_name, hs_code, 1 - (embedding <=> '${vecStr}'::vector) as similarity FROM hs_classification_vectors WHERE 1 - (embedding <=> '${vecStr}'::vector) >= ${VECTOR_THRESHOLD} ORDER BY embedding <=> '${vecStr}'::vector LIMIT 3;`;

    const rpcResponse = await fetch(MGMT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MGMT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const timeMs = Math.round(performance.now() - start);

    if (!rpcResponse.ok) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: `sql_error: ${rpcResponse.status}` };
    }

    const matches = await rpcResponse.json();

    if (!matches || matches.length === 0) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: 'no_match' };
    }

    const best = matches[0];
    const similarity = best.similarity || 0;
    const correct = best.hs_code?.startsWith(product.expected_hs6.substring(0, 4)) || false;

    return {
      hsCode: best.hs_code || '-',
      confidence: Math.round(similarity * 100) / 100,
      timeMs,
      hit: true,
      correct,
      source: `sim=${similarity.toFixed(3)},top=${matches.length}`,
    };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - start);
    return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: err.message };
  }
}

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
            content: `You are an HS Code classification expert. Given a product name and category, return the most specific 6-digit HS code. Respond ONLY in JSON:
{"hsCode":"XXXXXX","description":"...","confidence":0.0-1.0,"chapter":"XX","countryOfOrigin":null}`,
          },
          {
            role: 'user',
            content: `Product: ${product.product_name}\nCategory: ${product.category}`,
          },
        ],
      }),
    });

    const timeMs = Math.round(performance.now() - start);

    if (!response.ok) {
      return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: `api_error: ${response.status}` };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const hsCode = (parsed.hsCode || '').replace(/\./g, '').substring(0, 6);
    const confidence = parsed.confidence || 0;
    const correct = hsCode.startsWith(product.expected_hs6.substring(0, 4));
    const tokens = data?.usage?.total_tokens || 0;

    return {
      hsCode,
      confidence,
      timeMs,
      hit: hsCode.length >= 4,
      correct,
      source: `tokens=${tokens}`,
    };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - start);
    return { hsCode: '-', confidence: 0, timeMs, hit: false, correct: false, source: err.message };
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' POTAL AI Classification Pipeline — Real Data Test');
  console.log(' 20 products × 3 stages (Keyword → Vector → LLM)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results: TestResult[] = [];

  for (let i = 0; i < TEST_PRODUCTS.length; i++) {
    const product = TEST_PRODUCTS[i];
    process.stdout.write(`[${i + 1}/20] ${product.product_name.padEnd(25)} `);

    // Stage 1: Keyword (sync)
    const keyword = testKeyword(product);

    // Stage 2: Vector (async)
    const vector = await testVectorSearch(product);

    // Stage 3: LLM (async) — only if keyword missed (simulate real pipeline)
    let llm: StageResult;
    if (!keyword.hit) {
      llm = await testLlm(product);
    } else {
      // Skip LLM if keyword hit (cost saving) — still test for accuracy comparison
      llm = await testLlm(product);
    }

    results.push({ product, keyword, vector, llm });
    console.log(
      `KW:${keyword.hit ? '✅' : '❌'}(${keyword.confidence.toFixed(2)}) ` +
      `VEC:${vector.hit ? '✅' : '❌'} ` +
      `LLM:${llm.hit ? '✅' : '❌'}(${llm.confidence.toFixed(2)})`
    );
  }

  // ─── Summary Report ──────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' RESULTS TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Header
  console.log(
    '#'.padStart(3) + ' ' +
    'Product'.padEnd(25) + ' ' +
    'Expected'.padEnd(8) + ' ' +
    '│ KW Code'.padEnd(10) + ' ' +
    'Conf'.padEnd(6) + ' ' +
    'ms'.padEnd(5) + ' ' +
    'OK'.padEnd(3) + ' ' +
    '│ VEC'.padEnd(6) + ' ' +
    '│ LLM Code'.padEnd(11) + ' ' +
    'Conf'.padEnd(6) + ' ' +
    'ms'.padEnd(6) + ' ' +
    'OK'.padEnd(3)
  );
  console.log('─'.repeat(105));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(
      String(i + 1).padStart(3) + ' ' +
      r.product.product_name.padEnd(25) + ' ' +
      r.product.expected_hs6.padEnd(8) + ' ' +
      `│ ${r.keyword.hsCode.padEnd(8)} ` +
      r.keyword.confidence.toFixed(2).padEnd(6) + ' ' +
      String(r.keyword.timeMs).padEnd(5) + ' ' +
      (r.keyword.correct ? '✅' : '❌').padEnd(3) + ' ' +
      `│ ${r.vector.hit ? '✅' : '❌'}`.padEnd(6) + ' ' +
      `│ ${r.llm.hsCode.padEnd(8)} ` +
      r.llm.confidence.toFixed(2).padEnd(6) + ' ' +
      String(r.llm.timeMs).padEnd(6) + ' ' +
      (r.llm.correct ? '✅' : '❌').padEnd(3)
    );
  }

  // ─── Aggregate Stats ─────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' AGGREGATE STATISTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const n = results.length;

  const kwHits = results.filter(r => r.keyword.hit).length;
  const kwCorrect = results.filter(r => r.keyword.correct).length;
  const kwAvgMs = Math.round(results.reduce((s, r) => s + r.keyword.timeMs, 0) / n);
  const kwAvgConf = (results.reduce((s, r) => s + r.keyword.confidence, 0) / n).toFixed(2);

  const vecHits = results.filter(r => r.vector.hit).length;
  const vecCorrect = results.filter(r => r.vector.correct).length;
  const vecAvgMs = Math.round(results.reduce((s, r) => s + r.vector.timeMs, 0) / n);

  const llmHits = results.filter(r => r.llm.hit).length;
  const llmCorrect = results.filter(r => r.llm.correct).length;
  const llmAvgMs = Math.round(results.reduce((s, r) => s + r.llm.timeMs, 0) / n);
  const llmAvgConf = (results.filter(r => r.llm.hit).reduce((s, r) => s + r.llm.confidence, 0) / (llmHits || 1)).toFixed(2);

  console.log('Stage         │ Hit Rate    │ Accuracy (HS4) │ Avg Time   │ Avg Confidence');
  console.log('──────────────┼─────────────┼────────────────┼────────────┼───────────────');
  console.log(`① Keyword     │ ${kwHits}/${n} (${(kwHits/n*100).toFixed(0)}%)  │ ${kwCorrect}/${n} (${(kwCorrect/n*100).toFixed(0)}%)       │ ${kwAvgMs}ms       │ ${kwAvgConf}`);
  console.log(`② Vector      │ ${vecHits}/${n} (${(vecHits/n*100).toFixed(0)}%)   │ ${vecCorrect}/${n} (${(vecCorrect/n*100).toFixed(0)}%)        │ ${vecAvgMs}ms      │ -`);
  console.log(`③ LLM (GPT)   │ ${llmHits}/${n} (${(llmHits/n*100).toFixed(0)}%)  │ ${llmCorrect}/${n} (${(llmCorrect/n*100).toFixed(0)}%)       │ ${llmAvgMs}ms      │ ${llmAvgConf}`);

  // Pipeline effectiveness
  const pipelineCorrect = results.filter(r => {
    if (r.keyword.hit && r.keyword.correct) return true;
    if (r.vector.hit && r.vector.correct) return true;
    if (r.llm.hit && r.llm.correct) return true;
    return false;
  }).length;

  const keywordOnly = results.filter(r => r.keyword.hit).length;
  const needsLlm = results.filter(r => !r.keyword.hit).length;

  console.log('\n──────────────────────────────────────────────────────────');
  console.log(`🎯 Pipeline Accuracy (any stage correct): ${pipelineCorrect}/${n} (${(pipelineCorrect/n*100).toFixed(0)}%)`);
  console.log(`⚡ Keyword-only resolves: ${keywordOnly}/${n} (${(keywordOnly/n*100).toFixed(0)}%) — $0 cost`);
  console.log(`🤖 Needs LLM fallback: ${needsLlm}/${n} (${(needsLlm/n*100).toFixed(0)}%)`);
  console.log(`📊 Vector DB: ${vecHits > 0 ? vecHits + ' hits' : '0 vectors in DB (empty)'}`);
  console.log('──────────────────────────────────────────────────────────\n');
}

main().catch(console.error);
