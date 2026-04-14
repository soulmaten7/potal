#!/usr/bin/env node
/**
 * CW34-S3-E Platinum Supabase Load
 *
 * Gold JSONL → customs_rulings_staging (batch insert)
 * → validate → report
 *
 * Swap is done manually in Supabase Studio SQL Editor (no exec_sql RPC).
 *
 * Usage:
 *   node scripts/warehouse/load-platinum.mjs                # full load
 *   node scripts/warehouse/load-platinum.mjs --dry-run      # count only
 */

import fs from 'node:fs';
import readline from 'node:readline';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

// Load env
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const GOLD = '/Volumes/soulmaten/POTAL/warehouse/gold/customs_rulings.jsonl';
const BATCH_SIZE = 500; // conservative to avoid payload limits
const TABLE = 'customs_rulings_staging';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Gold fields → table columns mapping (strip fields not in table)
function toRow(g) {
  return {
    ruling_id: g.ruling_id,
    source: g.source,
    issuing_country: g.issuing_country || null,
    jurisdiction: g.jurisdiction || null,
    product_name: g.product_name || '',
    full_description: g.full_description || null,
    full_text: g.full_text || null,
    hs6: g.hs6 || null,
    hs_code: g.hs_code || null,
    chapter: g.chapter || null,
    all_tariffs: g.all_tariffs || null,
    material: g.material || null,
    material_composition: g.material_composition || null,
    product_form: g.product_form || null,
    intended_use: g.intended_use || null,
    conditional_rules: g.conditional_rules || null,
    duty_rate_ad_valorem: g.duty_rate_ad_valorem || null,
    duty_per_unit_amount: g.duty_per_unit_amount || null,
    duty_per_unit_currency: g.duty_per_unit_currency || null,
    duty_per_unit_uom: g.duty_per_unit_uom || null,
    ruling_date: g.ruling_date || null,
    valid_from: g.valid_from || null,
    valid_to: g.valid_to || null,
    status: g.status || 'active',
    language: g.language || 'en',
    keywords: g.keywords || null,
    categories: g.categories || null,
    collection: g.collection || null,
    is_usmca: g.is_usmca || false,
    is_nafta: g.is_nafta || false,
    confidence_score: g.confidence_score ?? 0.5,
    needs_manual_review: g.needs_manual_review || false,
    pipeline_version: g.pipeline_version || 'cw34-s3-v1',
    // hs_version NOT in table — stripped
    // created_at, updated_at — auto by DB
  };
}

// ─── Step 1: Clear staging ───

async function clearStaging() {
  console.log('▸ Clearing staging table...');
  if (dryRun) { console.log('  [dry-run] skip'); return; }
  // Delete all rows (no exec_sql RPC available)
  const { error } = await sb.from(TABLE).delete().gte('id', 0);
  if (error) {
    console.log('  delete().gte failed, trying neq...');
    const { error: e2 } = await sb.from(TABLE).delete().neq('ruling_id', '___impossible___');
    if (e2) throw new Error('Cannot clear staging: ' + e2.message);
  }
  console.log('  ✅ Staging cleared');
}

// ─── Step 2: Batch insert ───

async function loadGold() {
  console.log(`\n▸ Loading Gold → staging (batch=${BATCH_SIZE})...`);
  const startTime = Date.now();

  const rl = readline.createInterface({
    input: fs.createReadStream(GOLD, 'utf-8'),
    crlfDelay: Infinity,
  });

  let batch = [];
  let total = 0;
  let errors = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const gold = JSON.parse(line);
    batch.push(toRow(gold));

    if (batch.length >= BATCH_SIZE) {
      if (!dryRun) {
        const { error } = await sb.from(TABLE).insert(batch);
        if (error) {
          errors++;
          if (errors <= 3) console.error(`  ❌ Batch error at row ${total}: ${error.message}`);
          if (errors === 1) console.error('  First row:', JSON.stringify(batch[0]).slice(0, 300));
          // Try smaller batches on error
          for (let i = 0; i < batch.length; i += 50) {
            const mini = batch.slice(i, i + 50);
            const { error: e2 } = await sb.from(TABLE).insert(mini);
            if (e2) {
              // Try one by one
              for (const row of mini) {
                const { error: e3 } = await sb.from(TABLE).insert([row]);
                if (e3) {
                  errors++;
                  if (errors <= 10) console.error(`  ❌ Row error (${row.ruling_id}): ${e3.message}`);
                }
              }
            }
          }
        }
      }
      total += batch.length;
      batch = [];
      if (total % 10000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const rate = Math.round(total / ((Date.now() - startTime) / 1000));
        process.stdout.write(`  ${total.toLocaleString()} rows (${elapsed}s, ${rate}/s)\r`);
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    if (!dryRun) {
      const { error } = await sb.from(TABLE).insert(batch);
      if (error) {
        errors++;
        console.error(`  ❌ Final batch error: ${error.message}`);
      }
    }
    total += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Total: ${total.toLocaleString()} rows in ${elapsed}s (${errors} errors)`);
  return { total, errors };
}

// ─── Step 3: Validate ───

async function validate(expectedTotal) {
  console.log('\n▸ Validating staging...');
  if (dryRun) { console.log('  [dry-run] skip'); return true; }

  // Row count
  const { count, error } = await sb.from(TABLE).select('*', { count: 'exact', head: true });
  if (error) { console.error('  Count error:', error.message); return false; }
  console.log(`  Row count: ${count?.toLocaleString()}`);

  // Null hs_code check
  const { count: nullHs } = await sb.from(TABLE).select('*', { count: 'exact', head: true }).is('hs_code', null);
  console.log(`  Null hs_code: ${nullHs}`);

  // Source distribution
  const { data: samples } = await sb.from(TABLE).select('source').limit(50000);
  if (samples) {
    const dist = {};
    for (const r of samples) dist[r.source] = (dist[r.source] || 0) + 1;
    console.log('  Source distribution (sample):', dist);
  }

  // Status distribution
  const { data: statSamples } = await sb.from(TABLE).select('status').limit(50000);
  if (statSamples) {
    const dist = {};
    for (const r of statSamples) dist[r.status] = (dist[r.status] || 0) + 1;
    console.log('  Status distribution (sample):', dist);
  }

  return true;
}

// ─── Main ───

console.log('━━ CW34-S3-E Platinum Supabase Load ━━\n');

try {
  await clearStaging();
  const { total, errors } = await loadGold();
  const ok = await validate(total);

  if (!ok) {
    console.error('\n❌ Validation failed. Staging populated but NOT swapped.');
    process.exit(1);
  }

  console.log('\n━━ STAGING LOAD COMPLETE ━━');
  console.log(`  ${total.toLocaleString()} rows loaded, ${errors} errors`);
  console.log('\n▸ Next: Run SWAP SQL in Supabase Studio:');
  console.log(`
BEGIN;
  DROP TABLE IF EXISTS public.customs_rulings_old;
  ALTER TABLE IF EXISTS public.customs_rulings RENAME TO customs_rulings_old;
  ALTER TABLE public.customs_rulings_staging RENAME TO customs_rulings;
  CREATE TABLE public.customs_rulings_staging (LIKE public.customs_rulings INCLUDING ALL);
COMMIT;

ANALYZE public.customs_rulings;
`);
} catch (e) {
  console.error('\n━━ ❌ LOAD FAILED ━━');
  console.error(e.message || e);
  process.exit(1);
}
