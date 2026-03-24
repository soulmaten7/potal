/**
 * Vector Search Benchmark — pure embedding similarity, no LLM reasoning.
 * Embeds 5,371 HS6 descriptions + 100 benchmark product names,
 * then matches by cosine similarity.
 */

import * as fs from 'fs';
import * as path from 'path';

try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {}

// Import HS data
import { SUBHEADING_DESCRIPTIONS } from '../app/lib/cost-engine/gri-classifier/data/subheading-descriptions';

const BENCHMARK_FILE = '/Volumes/soulmaten/POTAL/benchmark_test_data.json';
const EMBEDDINGS_CACHE = '/Volumes/soulmaten/POTAL/hs_embeddings/hs6_embeddings.json';
const OUTPUT_DIR = '/Volumes/soulmaten/POTAL/benchmark_results';

interface BenchmarkItem {
  id: number;
  ruling_number: string;
  item_name: string;
  description: string;
  hts_code_answer: string;
  hs6: string;
  hs_chapter: string;
}

// ─── Embedding helpers ───

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const results: number[][] = [];
  const batchSize = 2048;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Embedding API error: ${response.status} ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    for (const item of data.data) {
      results.push(item.embedding);
    }

    if (i + batchSize < texts.length) {
      process.stdout.write(`  Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length}...\n`);
    }
  }

  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Main ───

async function main() {
  process.stdout.write('\n═══════════════════════════════════════\n');
  process.stdout.write('Vector Search Benchmark\n');
  process.stdout.write('═══════════════════════════════════════\n\n');

  // 1. Load HS6 descriptions
  const entries = Object.entries(SUBHEADING_DESCRIPTIONS);
  const hs6Codes = entries.map(([code]) => code);
  const hs6Descriptions = entries.map(([, desc]) => desc);
  process.stdout.write(`HS6 codes loaded: ${hs6Codes.length}\n`);

  // 2. Get or cache HS6 embeddings
  let hs6Embeddings: number[][];

  if (fs.existsSync(EMBEDDINGS_CACHE)) {
    process.stdout.write('Loading cached HS6 embeddings...\n');
    hs6Embeddings = JSON.parse(fs.readFileSync(EMBEDDINGS_CACHE, 'utf-8'));
    process.stdout.write(`Loaded ${hs6Embeddings.length} cached embeddings.\n`);
  } else {
    process.stdout.write(`Embedding ${hs6Codes.length} HS6 descriptions...\n`);
    // Embed: "HS code XXXXXX: description" format for better context
    const textsToEmbed = entries.map(([code, desc]) => `HS ${code}: ${desc}`);
    hs6Embeddings = await getEmbeddings(textsToEmbed);

    fs.mkdirSync(path.dirname(EMBEDDINGS_CACHE), { recursive: true });
    fs.writeFileSync(EMBEDDINGS_CACHE, JSON.stringify(hs6Embeddings));
    process.stdout.write(`Cached ${hs6Embeddings.length} embeddings.\n`);
  }

  // 3. Load benchmark data
  const benchmarkData: BenchmarkItem[] = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf-8'));
  process.stdout.write(`Benchmark items: ${benchmarkData.length}\n\n`);

  // 4. Embed all product names
  const productTexts = benchmarkData.map(item => item.item_name || item.description?.substring(0, 200) || '');
  process.stdout.write('Embedding product names...\n');
  const productEmbeddings = await getEmbeddings(productTexts);

  // 5. Match each product to HS6 by cosine similarity
  let exact6 = 0, match4 = 0, match2 = 0;
  let top3Hit = 0, top5Hit = 0, top10Hit = 0;

  interface ResultItem {
    id: number;
    product_name: string;
    expected_hs6: string;
    predicted_hs6: string;
    predicted_desc: string;
    match_6digit: boolean;
    match_4digit: boolean;
    match_2digit: boolean;
    top_5: { code: string; desc: string; similarity: number }[];
    top_n_hit: number; // position of correct answer in top-N (0 = not found)
    error_type: string;
    category: string;
  }

  const results: ResultItem[] = [];
  const errors: ResultItem[] = [];

  for (let i = 0; i < benchmarkData.length; i++) {
    const item = benchmarkData[i];
    const expectedHs6 = (item.hs6 || '').replace(/\./g, '').substring(0, 6);

    if (!expectedHs6 || expectedHs6.length < 6) continue;

    // Calculate similarity with all HS6 codes
    const similarities: { idx: number; sim: number }[] = [];
    for (let j = 0; j < hs6Embeddings.length; j++) {
      similarities.push({ idx: j, sim: cosineSimilarity(productEmbeddings[i], hs6Embeddings[j]) });
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.sim - a.sim);

    const top10 = similarities.slice(0, 10).map(s => ({
      code: hs6Codes[s.idx],
      desc: hs6Descriptions[s.idx].substring(0, 60),
      similarity: Math.round(s.sim * 1000) / 1000,
    }));

    const predictedHs6 = top10[0].code;
    const is6 = predictedHs6 === expectedHs6;
    const is4 = predictedHs6.substring(0, 4) === expectedHs6.substring(0, 4);
    const is2 = predictedHs6.substring(0, 2) === expectedHs6.substring(0, 2);

    if (is6) exact6++;
    if (is4) match4++;
    if (is2) match2++;

    // Check top-N hit
    let topNHit = 0;
    for (let k = 0; k < top10.length; k++) {
      if (top10[k].code === expectedHs6) {
        topNHit = k + 1;
        break;
      }
    }
    if (topNHit >= 1 && topNHit <= 3) top3Hit++;
    if (topNHit >= 1 && topNHit <= 5) top5Hit++;
    if (topNHit >= 1 && topNHit <= 10) top10Hit++;
    // top1 = exact6

    // Categorize errors
    const chapter = parseInt(expectedHs6.substring(0, 2), 10);
    let category = 'Other';
    if (chapter <= 5) category = 'Animal';
    else if (chapter <= 14) category = 'Vegetable';
    else if (chapter === 15) category = 'Fats/Oils';
    else if (chapter <= 24) category = 'Food/Beverage';
    else if (chapter <= 27) category = 'Mineral';
    else if (chapter <= 38) category = 'Chemical';
    else if (chapter <= 40) category = 'Plastic/Rubber';
    else if (chapter <= 43) category = 'Leather';
    else if (chapter <= 46) category = 'Wood';
    else if (chapter <= 49) category = 'Paper/Printed';
    else if (chapter <= 63) category = 'Textiles/Apparel';
    else if (chapter <= 67) category = 'Footwear/Headgear';
    else if (chapter <= 70) category = 'Stone/Ceramic/Glass';
    else if (chapter === 71) category = 'Precious';
    else if (chapter <= 83) category = 'Base Metals';
    else if (chapter <= 85) category = 'Machinery/Electronics';
    else if (chapter <= 89) category = 'Vehicles';
    else if (chapter <= 92) category = 'Instruments';
    else if (chapter === 93) category = 'Arms';
    else if (chapter <= 96) category = 'Misc Manufactured';
    else if (chapter === 97) category = 'Art/Antiques';

    let errorType = 'CORRECT';
    if (!is6) {
      if (!is2) errorType = 'CATEGORY_ERROR';
      else if (!is4) errorType = 'HEADING_ERROR';
      else errorType = 'SUBHEADING_ERROR';
    }

    const resultItem: ResultItem = {
      id: item.id,
      product_name: (item.item_name || '').substring(0, 80),
      expected_hs6: expectedHs6,
      predicted_hs6: predictedHs6,
      predicted_desc: top10[0].desc,
      match_6digit: is6,
      match_4digit: is4,
      match_2digit: is2,
      top_5: top10.slice(0, 5),
      top_n_hit: topNHit,
      error_type: errorType,
      category,
    };

    results.push(resultItem);
    if (!is6) errors.push(resultItem);

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`  [${i + 1}/${benchmarkData.length}] 6-digit: ${exact6}/${i + 1} (${((exact6 / (i + 1)) * 100).toFixed(1)}%)\n`);
    }
  }

  const total = results.length;

  // ─── Output ───

  process.stdout.write('\n═══════════════════════════════════════\n');
  process.stdout.write('벡터 검색 벤치마크 결과\n');
  process.stdout.write('═══════════════════════════════════════\n');
  process.stdout.write(`정확도:\n`);
  process.stdout.write(`  6-digit: ${exact6}/${total} (${((exact6 / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  4-digit: ${match4}/${total} (${((match4 / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  Chapter: ${match2}/${total} (${((match2 / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  AI calls: 0 | Cost: ~$0.002 (embeddings only)\n\n`);

  process.stdout.write(`상위 N개 중 정답 포함율:\n`);
  process.stdout.write(`  Top-1:  ${exact6}/${total} (${((exact6 / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  Top-3:  ${top3Hit}/${total} (${((top3Hit / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  Top-5:  ${top5Hit}/${total} (${((top5Hit / total) * 100).toFixed(1)}%)\n`);
  process.stdout.write(`  Top-10: ${top10Hit}/${total} (${((top10Hit / total) * 100).toFixed(1)}%)\n\n`);

  process.stdout.write(`vs 이전 버전:\n`);
  process.stdout.write(`              6-digit  4-digit  Chapter  Cost\n`);
  process.stdout.write(`v3.0 Broker:   24%      42%      59%     ~$0.020\n`);
  process.stdout.write(`Vector Search: ${((exact6 / total) * 100).toFixed(0)}%      ${((match4 / total) * 100).toFixed(0)}%      ${((match2 / total) * 100).toFixed(0)}%     ~$0.002\n\n`);

  // Error analysis by category
  const catErrors: Record<string, ResultItem[]> = {};
  for (const e of errors) {
    if (!catErrors[e.category]) catErrors[e.category] = [];
    catErrors[e.category].push(e);
  }

  process.stdout.write('═══════════════════════════════════════\n');
  process.stdout.write('오류 패턴 분류\n');
  process.stdout.write('═══════════════════════════════════════\n');

  const errorTypes = { CATEGORY_ERROR: 0, HEADING_ERROR: 0, SUBHEADING_ERROR: 0 };
  for (const e of errors) {
    if (e.error_type in errorTypes) errorTypes[e.error_type as keyof typeof errorTypes]++;
  }
  process.stdout.write(`  CATEGORY_ERROR (Chapter 틀림): ${errorTypes.CATEGORY_ERROR}\n`);
  process.stdout.write(`  HEADING_ERROR (Heading 틀림): ${errorTypes.HEADING_ERROR}\n`);
  process.stdout.write(`  SUBHEADING_ERROR (Subheading 틀림): ${errorTypes.SUBHEADING_ERROR}\n\n`);

  // Category breakdown
  process.stdout.write('카테고리별 실패:\n');
  const sortedCats = Object.entries(catErrors).sort((a, b) => b[1].length - a[1].length);
  for (const [cat, items] of sortedCats) {
    process.stdout.write(`\n### ${cat} (${items.length}건):\n`);
    process.stdout.write('| # | 상품명 | 정답 | 예측 | 오류유형 |\n');
    process.stdout.write('|---|--------|------|------|----------|\n');
    for (const item of items.slice(0, 8)) {
      process.stdout.write(`| ${item.id} | ${item.product_name.substring(0, 40)} | ${item.expected_hs6} | ${item.predicted_hs6} | ${item.error_type} |\n`);
    }
    if (items.length > 8) {
      process.stdout.write(`| ... | +${items.length - 8} more | | | |\n`);
    }
  }

  // Save results
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'vector_search_benchmark_results.json'),
    JSON.stringify({ summary: { exact6, match4, match2, total, top3Hit, top5Hit, top10Hit }, results }, null, 2)
  );

  process.stdout.write(`\n\n결과 저장: ${OUTPUT_DIR}/vector_search_benchmark_results.json\n`);
}

main().catch(err => {
  process.stderr.write(`Error: ${err}\n`);
  process.exit(1);
});
