/**
 * POTAL — Seed hs_classification_vectors from NEW WDC product_hs_mappings
 *
 * Only processes WDC-sourced mappings (source = 'wdc_category' or 'wdc_product')
 * that don't already have vectors.
 *
 * Usage: npx tsx scripts/seed_wdc_vectors.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || '';
const PROJECT_ID = 'zyurflkhiregundhisky';
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`;
const BATCH_SIZE = 20;

async function runSQL<T = any>(query: string): Promise<T[]> {
  const res = await fetch(MGMT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MGMT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL error (${res.status}): ${text}`);
  }
  return res.json();
}

function escapeSQL(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.toLowerCase().trim()),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    process.stderr.write(`Embedding API ${response.status}: ${err.substring(0, 200)}\n`);
    return texts.map(() => null);
  }

  const data = await response.json();
  const embeddings: (number[] | null)[] = texts.map(() => null);
  for (const item of data.data) {
    embeddings[item.index] = item.embedding;
  }
  return embeddings;
}

async function main() {
  process.stdout.write('POTAL — WDC Vector Seeding\n\n');

  if (!OPENAI_API_KEY) {
    process.stderr.write('Missing OPENAI_API_KEY\n');
    process.exit(1);
  }

  // Fetch WDC mappings only
  process.stdout.write('Step 1: Fetching WDC mappings...\n');
  const mappings = await runSQL<{
    product_name: string; category: string | null; hs6: string; confidence: number; source: string;
  }>(
    `SELECT product_name, category, hs6, confidence, source
     FROM product_hs_mappings
     WHERE source IN ('wdc_category', 'wdc_product', 'wdc_category_phase2')
     ORDER BY id;`
  );
  process.stdout.write(`  ${mappings.length} WDC mappings found\n\n`);

  // Check existing vectors to avoid duplicates
  const existing = await runSQL<{ product_name: string }>(
    `SELECT product_name FROM hs_classification_vectors WHERE source LIKE 'seeded_from_wdc%';`
  );
  const existingNames = new Set(existing.map(e => e.product_name.toLowerCase()));
  const toProcess = mappings.filter(m => !existingNames.has(m.product_name.toLowerCase()));
  process.stdout.write(`  ${existing.length} already vectorized, ${toProcess.length} new to process\n\n`);

  if (toProcess.length === 0) {
    process.stdout.write('Nothing to do.\n');
    return;
  }

  // Generate embeddings
  process.stdout.write('Step 2: Generating embeddings...\n');
  let embedded = 0;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const texts = batch.map(m => `${m.product_name} ${m.category || ''}`.trim());

    const embeddings = await generateEmbeddingsBatch(texts);

    // Insert each successful embedding
    for (let j = 0; j < batch.length; j++) {
      if (!embeddings[j]) continue;
      embedded++;

      const m = batch[j];
      const vecStr = `[${embeddings[j]!.join(',')}]`;
      const catVal = m.category ? `'${escapeSQL(m.category)}'` : 'NULL';
      const sql = `INSERT INTO hs_classification_vectors (product_name, category, hs_code, embedding, source, confidence)
VALUES ('${escapeSQL(m.product_name)}', ${catVal}, '${m.hs6}', '${vecStr}'::vector, 'seeded_from_${m.source}', ${m.confidence})
ON CONFLICT DO NOTHING;`;

      try {
        await runSQL(sql);
        inserted++;
      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          process.stderr.write(`  Error: ${m.product_name.substring(0, 40)} — ${err.message.substring(0, 100)}\n`);
        }
      }
    }

    const done = Math.min(i + BATCH_SIZE, toProcess.length);
    if (done % 100 === 0 || done === toProcess.length) {
      process.stdout.write(`  ${done}/${toProcess.length} processed, ${inserted} inserted, ${errors} errors\n`);
    }
  }

  // Verify
  const countResult = await runSQL<{ count: number }>('SELECT count(*) FROM hs_classification_vectors;');
  process.stdout.write(`\nDone: ${inserted} vectors inserted (${errors} errors)\n`);
  process.stdout.write(`Total hs_classification_vectors: ${countResult[0]?.count || 0}\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
