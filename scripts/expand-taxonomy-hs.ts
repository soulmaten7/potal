/**
 * POTAL — Expand Google Product Taxonomy to Full HS Mappings
 *
 * Takes 5,596 Google categories and maps them all to HS 6-digit codes
 * using parent-child hierarchy resolution.
 *
 * Usage: npx tsx scripts/expand-taxonomy-hs.ts
 */

import * as fs from 'fs';
import { resolveHsCode } from './import-google-taxonomy-hs';

const SUPABASE_URL = 'https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query';
const AUTH_TOKEN = 'sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a';
const LOG_FILE = process.cwd() + '/hs10_pipeline.log';

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function runSQL(query: string) {
  const res = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if ((data as { message?: string }).message) throw new Error((data as { message: string }).message);
  return data;
}

async function main() {
  log('=== TASK 5: Google Taxonomy Expansion ===');

  // Read taxonomy file
  const taxonomyFile = '/tmp/google_taxonomy.txt';
  if (!fs.existsSync(taxonomyFile)) {
    log('Downloading Google taxonomy...');
    const res = await fetch('https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt');
    fs.writeFileSync(taxonomyFile, await res.text());
  }

  const lines = fs.readFileSync(taxonomyFile, 'utf-8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'));

  log(`Total categories: ${lines.length}`);

  // Parse categories
  const categories: Array<{ id: string; path: string; leaf: string }> = [];
  for (const line of lines) {
    const match = line.match(/^(\d+)\s*-\s*(.+)$/);
    if (!match) continue;
    const [, id, path] = match;
    const parts = path.split(' > ');
    categories.push({ id, path: path.trim(), leaf: parts[parts.length - 1].trim() });
  }

  log(`Parsed ${categories.length} categories`);

  // Resolve HS codes using existing mapping + parent tree walk
  const mappings: Array<{ product_name: string; category: string; hs6: string; confidence: number }> = [];
  let resolved = 0;
  let unresolved = 0;

  for (const cat of categories) {
    const hs6 = resolveHsCode(cat.path);
    if (hs6) {
      const depth = cat.path.split(' > ').length;
      mappings.push({
        product_name: cat.leaf,
        category: cat.path,
        hs6,
        confidence: depth >= 4 ? 0.8 : depth >= 3 ? 0.75 : 0.7,
      });
      resolved++;
    } else {
      unresolved++;
    }
  }

  log(`Resolved: ${resolved}, Unresolved: ${unresolved}`);

  // Get existing mappings to dedup
  const existing = await runSQL(`SELECT product_name, category FROM product_hs_mappings WHERE source = 'google_product_taxonomy';`);
  const existingKeys = new Set((existing as Array<{ product_name: string; category: string }>).map(
    (r) => `${r.product_name}::${r.category}`
  ));

  const newMappings = mappings.filter(m => !existingKeys.has(`${m.product_name}::${m.category}`));
  log(`New mappings after dedup: ${newMappings.length}`);

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < newMappings.length; i += batchSize) {
    const batch = newMappings.slice(i, i + batchSize);
    const values = batch.map(m => {
      const safeName = m.product_name.replace(/'/g, "''");
      const safeCat = m.category.replace(/'/g, "''");
      return `('google_product_taxonomy', '${safeName}', '${safeCat}', '${m.hs6}', ${m.confidence}, '{"taxonomy_version": "2024"}'::jsonb)`;
    }).join(',\n');

    try {
      await runSQL(`
        INSERT INTO product_hs_mappings (source, product_name, category, hs6, confidence, metadata)
        VALUES ${values}
        ON CONFLICT DO NOTHING;
      `);
      inserted += batch.length;
    } catch (err) {
      log(`Warning: batch insert error at ${i}: ${String(err).substring(0, 100)}`);
      // Try individual inserts
      for (const m of batch) {
        try {
          const safeName = m.product_name.replace(/'/g, "''");
          const safeCat = m.category.replace(/'/g, "''");
          await runSQL(`INSERT INTO product_hs_mappings (source, product_name, category, hs6, confidence, metadata) VALUES ('google_product_taxonomy', '${safeName}', '${safeCat}', '${m.hs6}', ${m.confidence}, '{"taxonomy_version": "2024"}'::jsonb) ON CONFLICT DO NOTHING;`);
          inserted++;
        } catch { /* skip */ }
      }
    }
  }

  const totalCount = await runSQL(`SELECT count(*) as cnt FROM product_hs_mappings;`);
  log(`TASK 5 COMPLETE: ${inserted} new mappings inserted. Total product_hs_mappings: ${JSON.stringify(totalCount)}`);
}

main().catch(err => {
  log(`TASK 5 ERROR: ${err}`);
  process.exit(1);
});
