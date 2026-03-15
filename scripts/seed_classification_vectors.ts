/**
 * POTAL — Seed hs_classification_vectors from product_hs_mappings
 *
 * Uses Management API (not REST) to bypass Supabase pooler issues.
 * 1. Fetch all product_hs_mappings via Management API SQL
 * 2. Generate OpenAI embeddings (text-embedding-3-small, 1536-dim)
 * 3. Insert into hs_classification_vectors via Management API SQL
 *
 * Usage: npx tsx scripts/seed_classification_vectors.ts
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

// ─── Config ───────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || '';
const PROJECT_ID = 'zyurflkhiregundhisky';
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`;
const EMBEDDING_BATCH_SIZE = 20;

interface ProductMapping {
  product_name: string;
  category: string | null;
  hs6: string;
  confidence: number;
  source: string;
}

// ─── Management API SQL helper ────────────────────────────

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

// ─── Step 1: Fetch all mappings ───────────────────────────

async function fetchAllMappings(): Promise<ProductMapping[]> {
  return runSQL<ProductMapping>(
    `SELECT product_name, category, hs6, confidence, source FROM product_hs_mappings ORDER BY id;`
  );
}

// ─── Step 2: Generate embeddings ──────────────────────────

async function generateEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  try {
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
      console.error(`Embedding API error: ${response.status}`);
      return texts.map(() => null);
    }

    const data = await response.json();
    const embeddings: (number[] | null)[] = texts.map(() => null);
    for (const item of data.data) {
      embeddings[item.index] = item.embedding;
    }
    return embeddings;
  } catch (err: any) {
    console.error(`Embedding error: ${err.message}`);
    return texts.map(() => null);
  }
}

// ─── Step 3: Insert via SQL ───────────────────────────────

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

async function insertVectorsBatch(
  rows: { product_name: string; category: string | null; hs_code: string; embedding: number[]; source: string; confidence: number }[],
): Promise<number> {
  if (rows.length === 0) return 0;

  // Build VALUES clause — one row at a time to avoid SQL too long
  let inserted = 0;
  for (const row of rows) {
    const vecStr = `[${row.embedding.join(',')}]`;
    const catVal = row.category ? `'${escapeSQL(row.category)}'` : 'NULL';
    const sql = `INSERT INTO hs_classification_vectors (product_name, category, hs_code, embedding, source, confidence)
VALUES ('${escapeSQL(row.product_name)}', ${catVal}, '${escapeSQL(row.hs_code)}', '${vecStr}'::vector, '${escapeSQL(row.source)}', ${row.confidence})
ON CONFLICT DO NOTHING;`;

    try {
      await runSQL(sql);
      inserted++;
    } catch (err: any) {
      console.error(`  ✗ Insert failed for "${row.product_name}": ${err.message}`);
    }
  }

  return inserted;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' POTAL — Vector DB Seeding (Management API)');
  console.log(' product_hs_mappings → hs_classification_vectors');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Fetch
  console.log('Step 1: Fetching product_hs_mappings...');
  const mappings = await fetchAllMappings();
  console.log(`  → ${mappings.length} rows fetched\n`);

  if (mappings.length === 0) {
    console.error('No mappings found. Aborting.');
    process.exit(1);
  }

  // Step 2: Generate embeddings
  console.log('Step 2: Generating embeddings (OpenAI text-embedding-3-small)...');
  type VectorRow = { product_name: string; category: string | null; hs_code: string; embedding: number[]; source: string; confidence: number };
  const vectorRows: VectorRow[] = [];

  for (let i = 0; i < mappings.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = mappings.slice(i, i + EMBEDDING_BATCH_SIZE);
    const texts = batch.map(m => `${m.product_name} ${m.category || ''}`.trim());

    const embeddings = await generateEmbeddingsBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      if (embeddings[j]) {
        vectorRows.push({
          product_name: batch[j].product_name,
          category: batch[j].category,
          hs_code: batch[j].hs6,
          embedding: embeddings[j]!,
          source: `seeded_from_${batch[j].source}`,
          confidence: batch[j].confidence,
        });
      }
    }

    const done = Math.min(i + EMBEDDING_BATCH_SIZE, mappings.length);
    console.log(`  → ${done}/${mappings.length} embeddings generated`);
  }

  console.log(`  → ${vectorRows.length}/${mappings.length} embeddings successful\n`);

  // Step 3: Insert
  console.log('Step 3: Inserting into hs_classification_vectors...');
  let totalInserted = 0;

  // Insert in chunks of 10 to show progress
  for (let i = 0; i < vectorRows.length; i += 10) {
    const chunk = vectorRows.slice(i, i + 10);
    const inserted = await insertVectorsBatch(chunk);
    totalInserted += inserted;
    console.log(`  → ${Math.min(i + 10, vectorRows.length)}/${vectorRows.length} inserted (${totalInserted} total)`);
  }

  console.log(`\n  → ${totalInserted} vectors inserted total\n`);

  // Verify
  console.log('Step 4: Verifying...');
  const countResult = await runSQL<{ count: number }>('SELECT count(*) FROM hs_classification_vectors;');
  console.log(`  → hs_classification_vectors total rows: ${countResult[0]?.count || 0}`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(` ✅ Seeding complete: ${totalInserted} vectors inserted`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
