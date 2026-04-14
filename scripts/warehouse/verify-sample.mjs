#!/usr/bin/env node
/**
 * CW34-S3-G: 1,000 row stratified sample for manual review.
 * Outputs: docs/CW34_S3_VERIFICATION_SAMPLES.csv
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKETS = [
  { name: 'high_conf_active',     n: 150, filter: { confidence_score: { gte: 0.9 }, status: { eq: 'active' } } },
  { name: 'high_conf_expired',    n: 50,  filter: { confidence_score: { gte: 0.9 }, status: { eq: 'expired' } } },
  { name: 'med_conf',             n: 150, filter: { confidence_score: { gte: 0.6, lt: 0.9 } } },
  { name: 'low_conf',             n: 100, filter: { confidence_score: { lt: 0.6 } } },
  { name: 'has_conditional',      n: 50,  filter: { conditional_rules: { not_null: true } } },
  { name: 'has_material',         n: 80,  filter: { material: { not_null: true } } },
  { name: 'material_null',        n: 50,  filter: { material: { is_null: true } } },
  { name: 'has_composition',      n: 50,  filter: { material_composition: { not_null: true } } },
  { name: 'has_form',             n: 50,  filter: { product_form: { not_null: true } } },
  { name: 'has_use',              n: 50,  filter: { intended_use: { not_null: true } } },
  { name: 'eu_ebti',              n: 50,  filter: { source: { eq: 'eu_ebti' } } },
  { name: 'cbp_cross',            n: 50,  filter: { source: { eq: 'cbp_cross' } } },
  { name: 'cbp_cross_search',     n: 30,  filter: { source: { eq: 'cbp_cross_search' } } },
  { name: 'status_expired',       n: 30,  filter: { status: { eq: 'expired' } } },
  { name: 'status_historical',    n: 10,  filter: { status: { eq: 'historical' } } },
];

const COLS = 'id,ruling_id,source,issuing_country,jurisdiction,hs6,hs_code,chapter,product_name,material,material_composition,product_form,intended_use,conditional_rules,ruling_date,valid_from,valid_to,status,language,confidence_score,needs_manual_review,keywords,categories,collection';

async function sampleBucket(bucket) {
  let q = sb.from('customs_rulings').select(COLS);

  for (const [col, cond] of Object.entries(bucket.filter)) {
    if (cond.gte !== undefined) q = q.gte(col, cond.gte);
    if (cond.lt !== undefined) q = q.lt(col, cond.lt);
    if (cond.eq !== undefined) q = q.eq(col, cond.eq);
    if (cond.not_null) q = q.not(col, 'is', null);
    if (cond.is_null) q = q.is(col, null);
  }

  const { data, error } = await q.limit(bucket.n);
  if (error) {
    console.error(`  ❌ ${bucket.name}: ${error.message}`);
    return [];
  }
  return (data ?? []).map(r => ({ _bucket: bucket.name, ...r }));
}

console.log('━━ CW34-S3-G Verification Sampling ━━\n');

const allSamples = [];
for (const b of BUCKETS) {
  const rows = await sampleBucket(b);
  allSamples.push(...rows);
  console.log(`  ${b.name}: ${rows.length} / ${b.n} requested`);
}

console.log(`\nTotal samples: ${allSamples.length}`);

// Write CSV
if (allSamples.length === 0) {
  console.error('No samples collected!');
  process.exit(1);
}

const cols = Object.keys(allSamples[0]);
const reviewCols = ['review_verdict', 'review_issue_category', 'review_notes'];
const allCols = [...cols, ...reviewCols];

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const csvLines = [
  allCols.join(','),
  ...allSamples.map(r => [...cols.map(c => csvEscape(r[c])), '', '', ''].join(',')),
];

fs.writeFileSync('docs/CW34_S3_VERIFICATION_SAMPLES.csv', csvLines.join('\n'));
console.log('\n✅ Written to docs/CW34_S3_VERIFICATION_SAMPLES.csv');

// Quick stats
const byBucket = {};
for (const r of allSamples) {
  byBucket[r._bucket] = (byBucket[r._bucket] || 0) + 1;
}
console.log('\nBucket distribution:');
for (const [k, v] of Object.entries(byBucket)) {
  console.log(`  ${k}: ${v}`);
}
