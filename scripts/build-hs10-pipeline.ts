/**
 * POTAL HS10 Pipeline Builder
 * TASK 1: Divergence Map generation
 * TASK 2: Keyword extraction from 89,842 descriptions
 * TASK 3: Price break rules population
 *
 * Usage: npx tsx scripts/build-hs10-pipeline.ts
 */

import * as fs from 'fs';

const SUPABASE_URL = 'https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query';
const AUTH_TOKEN = 'sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a';
const LOG_FILE = process.cwd() + '/hs10_pipeline.log';

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function runSQL(query: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (data.message) throw new Error(data.message);
  return data as Record<string, unknown>[];
}

// ─── TASK 1: Create Divergence Map ───
async function task1DivergenceMap() {
  log('=== TASK 1: Divergence Map ===');

  // Create table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS divergence_map (
      id BIGSERIAL PRIMARY KEY,
      hs6 TEXT NOT NULL,
      country TEXT NOT NULL,
      hs10 TEXT NOT NULL,
      description TEXT,
      keywords TEXT[],
      divergence_type TEXT DEFAULT 'standard',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(hs6, country, hs10)
    );
    CREATE INDEX IF NOT EXISTS idx_divergence_map_hs6 ON divergence_map(hs6);
    CREATE INDEX IF NOT EXISTS idx_divergence_map_country ON divergence_map(country);
  `);
  log('divergence_map table created');

  // Get all 7+ digit codes grouped by HS6
  const countries = ['US', 'EU', 'GB', 'KR', 'CA', 'AU', 'JP'];

  for (const country of countries) {
    log(`Processing ${country}...`);

    // Fetch all records with 7+ digit codes for this country
    const rows = await runSQL(`
      SELECT hs_code, description, LEFT(hs_code, 6) as hs6
      FROM gov_tariff_schedules
      WHERE country = '${country}'
        AND length(hs_code) >= 7
        AND hs_code ~ '^[0-9]+$'
      ORDER BY hs_code;
    `);

    log(`  ${country}: ${rows.length} rows with 7+ digit codes`);

    if (rows.length === 0) continue;

    // Extract keywords from descriptions and batch insert
    const batchSize = 200;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map(row => {
        const hs6 = String(row.hs6);
        const hs10 = String(row.hs_code);
        const desc = String(row.description || '').replace(/'/g, "''");
        const keywords = extractKeywords(desc);
        const kwArray = keywords.length > 0 ? `ARRAY[${keywords.map(k => `'${k.replace(/'/g, "''")}'`).join(',')}]` : 'ARRAY[]::text[]';
        return `('${hs6}', '${country}', '${hs10}', '${desc}', ${kwArray}, 'standard')`;
      }).join(',\n');

      try {
        await runSQL(`
          INSERT INTO divergence_map (hs6, country, hs10, description, keywords, divergence_type)
          VALUES ${values}
          ON CONFLICT (hs6, country, hs10) DO UPDATE SET
            description = EXCLUDED.description,
            keywords = EXCLUDED.keywords;
        `);
        inserted += batch.length;
      } catch (err) {
        log(`  Warning: batch insert error at ${i}: ${String(err).substring(0, 100)}`);
        // Try one by one for failed batch
        for (const row of batch) {
          try {
            const hs6 = String(row.hs6);
            const hs10 = String(row.hs_code);
            const desc = String(row.description || '').replace(/'/g, "''");
            const keywords = extractKeywords(desc);
            const kwArray = keywords.length > 0 ? `ARRAY[${keywords.map(k => `'${k.replace(/'/g, "''")}'`).join(',')}]` : 'ARRAY[]::text[]';
            await runSQL(`
              INSERT INTO divergence_map (hs6, country, hs10, description, keywords, divergence_type)
              VALUES ('${hs6}', '${country}', '${hs10}', '${desc}', ${kwArray}, 'standard')
              ON CONFLICT (hs6, country, hs10) DO NOTHING;
            `);
            inserted++;
          } catch { /* skip */ }
        }
      }
    }
    log(`  ${country}: ${inserted} rows inserted into divergence_map`);
  }

  // Count divergence stats
  const stats = await runSQL(`
    SELECT
      count(DISTINCT hs6) as total_hs6,
      count(*) as total_entries,
      count(DISTINCT hs6) FILTER (WHERE (SELECT count(DISTINCT country) FROM divergence_map d2 WHERE d2.hs6 = divergence_map.hs6) > 1) as divergent_hs6
    FROM divergence_map;
  `);
  log(`Divergence Map stats: ${JSON.stringify(stats)}`);

  // Mark divergent HS6 codes
  await runSQL(`
    UPDATE divergence_map SET divergence_type = 'divergent'
    WHERE hs6 IN (
      SELECT hs6 FROM (
        SELECT hs6, count(DISTINCT country) as cnt
        FROM divergence_map
        GROUP BY hs6
        HAVING count(DISTINCT country) > 1
      ) t
      WHERE EXISTS (
        SELECT 1 FROM divergence_map d1
        JOIN divergence_map d2 ON d1.hs6 = d2.hs6 AND d1.country != d2.country
        WHERE d1.hs6 = t.hs6
        AND d1.description != d2.description
      )
    );
  `);

  const divergentCount = await runSQL(`SELECT count(DISTINCT hs6) as cnt FROM divergence_map WHERE divergence_type = 'divergent';`);
  const standardCount = await runSQL(`SELECT count(DISTINCT hs6) as cnt FROM divergence_map WHERE divergence_type = 'standard';`);
  log(`TASK 1 COMPLETE: divergent=${JSON.stringify(divergentCount)}, standard=${JSON.stringify(standardCount)}`);
}

// ─── TASK 2: Keyword Extraction ───
async function task2KeywordExtraction() {
  log('=== TASK 2: Keyword Extraction ===');

  // Create table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS hs_description_keywords (
      id BIGSERIAL PRIMARY KEY,
      hs_code TEXT NOT NULL,
      country TEXT NOT NULL,
      keyword TEXT NOT NULL,
      keyword_type TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(hs_code, country, keyword)
    );
    CREATE INDEX IF NOT EXISTS idx_hdk_hs_code ON hs_description_keywords(hs_code);
    CREATE INDEX IF NOT EXISTS idx_hdk_keyword ON hs_description_keywords(keyword);
    CREATE INDEX IF NOT EXISTS idx_hdk_type ON hs_description_keywords(keyword_type);
  `);
  log('hs_description_keywords table created');

  const countries = ['US', 'EU', 'GB', 'KR', 'CA', 'AU', 'JP'];

  for (const country of countries) {
    log(`Extracting keywords for ${country}...`);

    const rows = await runSQL(`
      SELECT hs_code, description
      FROM gov_tariff_schedules
      WHERE country = '${country}'
        AND description IS NOT NULL
        AND description != ''
        AND length(hs_code) >= 6
        AND hs_code ~ '^[0-9]+$'
      ORDER BY hs_code;
    `);

    log(`  ${country}: ${rows.length} rows to process`);

    const batchSize = 300;
    let totalKw = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const allValues: string[] = [];

      for (const row of batch) {
        const hsCode = String(row.hs_code);
        const desc = String(row.description || '');
        const classified = classifyKeywords(desc);

        for (const kw of classified) {
          const safeKw = kw.keyword.replace(/'/g, "''").toLowerCase();
          if (safeKw.length < 2) continue;
          allValues.push(`('${hsCode}', '${country}', '${safeKw}', '${kw.type}')`);
        }
      }

      if (allValues.length > 0) {
        // Split into smaller sub-batches if needed
        const subBatchSize = 500;
        for (let j = 0; j < allValues.length; j += subBatchSize) {
          const subBatch = allValues.slice(j, j + subBatchSize);
          try {
            await runSQL(`
              INSERT INTO hs_description_keywords (hs_code, country, keyword, keyword_type)
              VALUES ${subBatch.join(',\n')}
              ON CONFLICT (hs_code, country, keyword) DO NOTHING;
            `);
            totalKw += subBatch.length;
          } catch (err) {
            log(`  Warning: keyword insert error: ${String(err).substring(0, 80)}`);
          }
        }
      }
    }
    log(`  ${country}: ${totalKw} keywords extracted`);
  }

  const totalStats = await runSQL(`
    SELECT keyword_type, count(*) as cnt
    FROM hs_description_keywords
    GROUP BY keyword_type
    ORDER BY cnt DESC;
  `);
  log(`TASK 2 COMPLETE: keyword stats=${JSON.stringify(totalStats)}`);
}

// ─── TASK 3: Price Break Rules ───
async function task3PriceBreakRules() {
  log('=== TASK 3: Price Break Rules ===');

  // Create table if not exists
  await runSQL(`
    CREATE TABLE IF NOT EXISTS hs_price_break_rules (
      id BIGSERIAL PRIMARY KEY,
      country TEXT NOT NULL,
      parent_hs_code TEXT NOT NULL,
      hs10_under TEXT,
      hs10_over TEXT,
      threshold_value NUMERIC NOT NULL,
      threshold_unit TEXT DEFAULT 'unit',
      threshold_currency TEXT DEFAULT 'USD',
      duty_rate_under NUMERIC,
      duty_rate_over NUMERIC,
      description_under TEXT,
      description_over TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(country, parent_hs_code, threshold_value, threshold_unit)
    );
    CREATE INDEX IF NOT EXISTS idx_pbr_country ON hs_price_break_rules(country);
    CREATE INDEX IF NOT EXISTS idx_pbr_parent ON hs_price_break_rules(parent_hs_code);
  `);
  log('hs_price_break_rules table created');

  // Fetch all rows with "valued" in description
  const rows = await runSQL(`
    SELECT hs_code, country, description, duty_rate_pct
    FROM gov_tariff_schedules
    WHERE description ILIKE '%valued%'
      AND hs_code ~ '^[0-9]{6,}$'
      AND length(hs_code) >= 8
    ORDER BY hs_code, country;
  `);

  log(`Found ${rows.length} rows with 'valued' in description`);

  // Parse price conditions
  const rules: Array<{
    country: string;
    parentHs: string;
    hs10: string;
    threshold: number;
    unit: string;
    isOver: boolean;
    dutyRate: number | null;
    description: string;
  }> = [];

  for (const row of rows) {
    const desc = String(row.description || '');
    const hsCode = String(row.hs_code);
    const country = String(row.country);
    const dutyRate = row.duty_rate_pct as number | null;

    const parsed = parsePriceCondition(desc);
    if (!parsed) continue;

    rules.push({
      country,
      parentHs: hsCode.substring(0, 6),
      hs10: hsCode,
      threshold: parsed.value,
      unit: parsed.unit,
      isOver: parsed.isOver,
      dutyRate,
      description: desc,
    });
  }

  log(`Parsed ${rules.length} price break conditions`);

  // Group by parent HS + country to find under/over pairs
  const grouped = new Map<string, typeof rules>();
  for (const rule of rules) {
    const key = `${rule.country}:${rule.parentHs}:${rule.threshold}:${rule.unit}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rule);
  }

  let inserted = 0;
  for (const [, group] of grouped) {
    const overRule = group.find(r => r.isOver);
    const underRule = group.find(r => !r.isOver);

    if (!overRule && !underRule) continue;

    const ref = overRule || underRule!;
    const safeDescUnder = (underRule?.description || '').replace(/'/g, "''");
    const safeDescOver = (overRule?.description || '').replace(/'/g, "''");

    try {
      await runSQL(`
        INSERT INTO hs_price_break_rules (country, parent_hs_code, hs10_under, hs10_over, threshold_value, threshold_unit, threshold_currency, duty_rate_under, duty_rate_over, description_under, description_over)
        VALUES ('${ref.country}', '${ref.parentHs}', '${underRule?.hs10 || ''}', '${overRule?.hs10 || ''}', ${ref.threshold}, '${ref.unit}', 'USD', ${underRule?.dutyRate ?? 'NULL'}, ${overRule?.dutyRate ?? 'NULL'}, '${safeDescUnder}', '${safeDescOver}')
        ON CONFLICT (country, parent_hs_code, threshold_value, threshold_unit) DO UPDATE SET
          hs10_under = COALESCE(EXCLUDED.hs10_under, hs_price_break_rules.hs10_under),
          hs10_over = COALESCE(EXCLUDED.hs10_over, hs_price_break_rules.hs10_over),
          duty_rate_under = COALESCE(EXCLUDED.duty_rate_under, hs_price_break_rules.duty_rate_under),
          duty_rate_over = COALESCE(EXCLUDED.duty_rate_over, hs_price_break_rules.duty_rate_over);
      `);
      inserted++;
    } catch (err) {
      log(`  Warning: price rule insert error: ${String(err).substring(0, 80)}`);
    }
  }

  const totalRules = await runSQL(`SELECT count(*) as cnt FROM hs_price_break_rules;`);
  log(`TASK 3 COMPLETE: ${inserted} rules inserted, total=${JSON.stringify(totalRules)}`);
}

// ─── Keyword Extraction Helpers ───

const MATERIAL_PATTERNS = [
  'cotton', 'polyester', 'nylon', 'silk', 'wool', 'linen', 'leather', 'rubber',
  'plastic', 'glass', 'ceramic', 'porcelain', 'wood', 'wooden', 'paper',
  'stainless steel', 'alloy steel', 'carbon steel', 'steel', 'iron', 'cast iron',
  'aluminum', 'aluminium', 'copper', 'brass', 'zinc', 'tin', 'titanium', 'nickel',
  'gold', 'silver', 'platinum', 'synthetic', 'man-made', 'acrylic', 'viscose',
  'polypropylene', 'polyethylene', 'pvc', 'polycarbonate', 'fiberglass',
  'bamboo', 'cork', 'jute', 'hemp', 'flax', 'ramie', 'cashmere', 'mohair',
  'suede', 'canvas', 'denim', 'velvet', 'satin', 'chiffon', 'organza',
  'felt', 'knitted', 'woven', 'crocheted', 'nonwoven', 'tufted',
];

const USAGE_PATTERNS = [
  "for men", "for women", "for boys", "for girls", "for children", "for infants",
  "men's", "women's", "boys'", "girls'", "children's", "unisex",
  "industrial", "medical", "surgical", "pharmaceutical", "agricultural",
  "military", "civilian", "household", "commercial", "automotive",
  "electrical", "electronic", "optical", "mechanical", "hydraulic",
  "food grade", "cosmetic", "veterinary", "dental", "laboratory",
];

const FORM_PATTERNS = [
  'knitted', 'woven', 'crocheted', 'molded', 'cast', 'forged', 'stamped',
  'extruded', 'rolled', 'drawn', 'welded', 'seamless', 'coated', 'plated',
  'painted', 'printed', 'embroidered', 'bleached', 'dyed', 'finished',
  'unfinished', 'crude', 'refined', 'processed', 'raw', 'frozen', 'dried',
  'fresh', 'preserved', 'canned', 'bottled', 'powdered', 'liquid', 'solid',
  'laminated', 'corrugated', 'perforated', 'threaded', 'polished', 'anodized',
];

function classifyKeywords(desc: string): Array<{ keyword: string; type: string }> {
  const results: Array<{ keyword: string; type: string }> = [];
  const lower = desc.toLowerCase();

  for (const mat of MATERIAL_PATTERNS) {
    if (lower.includes(mat)) {
      results.push({ keyword: mat, type: 'material' });
    }
  }

  for (const usage of USAGE_PATTERNS) {
    if (lower.includes(usage)) {
      results.push({ keyword: usage, type: 'usage' });
    }
  }

  for (const form of FORM_PATTERNS) {
    if (lower.includes(form)) {
      results.push({ keyword: form, type: 'form' });
    }
  }

  // Price conditions
  const priceMatch = lower.match(/valued\s+(not\s+)?over\s+\$?([\d.,]+)/);
  if (priceMatch) {
    results.push({ keyword: priceMatch[0], type: 'price_condition' });
  }

  return results;
}

function extractKeywords(desc: string): string[] {
  const classified = classifyKeywords(desc);
  return classified.map(c => c.keyword);
}

function parsePriceCondition(desc: string): { value: number; unit: string; isOver: boolean } | null {
  const lower = desc.toLowerCase();

  // Match patterns like:
  // "valued not over $0.30 each"
  // "valued over $2.38/liter"
  // "valued not over 30 cents per dozen"
  // "Valued $2.30/kg or more"

  // Pattern 1: "valued (not)? over $X/unit"
  let match = lower.match(/valued\s+(not\s+)?over\s+\$?([\d.,]+)\s*(?:\/|\s*per\s+)?(each|pair|kg|liter|litre|dozen|sqm|square meter|piece|unit)?/);
  if (match) {
    const isNotOver = !!match[1]; // "not over" = under threshold
    const value = parseFloat(match[2].replace(/,/g, ''));
    const unit = normalizeUnit(match[3] || 'unit');
    return { value, unit, isOver: !isNotOver };
  }

  // Pattern 2: "valued $X/unit or more"
  match = lower.match(/valued\s+\$?([\d.,]+)\s*(?:\/|\s*per\s+)?(each|pair|kg|liter|litre|dozen|sqm|piece|unit)?\s+or\s+more/);
  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    const unit = normalizeUnit(match[2] || 'unit');
    return { value, unit, isOver: true };
  }

  // Pattern 3: "valued under $X"
  match = lower.match(/valued\s+under\s+\$?([\d.,]+)\s*(?:\/|\s*per\s+)?(each|pair|kg|liter|litre|dozen|sqm|piece|unit)?/);
  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    const unit = normalizeUnit(match[2] || 'unit');
    return { value, unit, isOver: false };
  }

  // Pattern 4: cents per unit
  match = lower.match(/valued\s+(not\s+)?over\s+(\d+)\s*(?:¢|cents?)\s*(?:\/|\s*per\s+)?(each|pair|kg|liter|litre|dozen|sqm|piece|unit)?/);
  if (match) {
    const isNotOver = !!match[1];
    const value = parseInt(match[2]) / 100;
    const unit = normalizeUnit(match[3] || 'unit');
    return { value, unit, isOver: !isNotOver };
  }

  return null;
}

function normalizeUnit(u: string): string {
  const map: Record<string, string> = {
    'each': 'unit', 'piece': 'unit', 'pair': 'unit',
    'kg': 'kg', 'kilogram': 'kg',
    'liter': 'liter', 'litre': 'liter',
    'dozen': 'dozen',
    'sqm': 'sqm', 'square meter': 'sqm',
    'unit': 'unit',
  };
  return map[u.toLowerCase()] || 'unit';
}

// ─── Main ───
async function main() {
  log('🚀 HS10 Pipeline Builder started');
  log(`Total gov_tariff_schedules: 89,842 rows across 7 countries`);

  await task1DivergenceMap();
  await task2KeywordExtraction();
  await task3PriceBreakRules();

  log('🎯 All DB tasks (1-3) complete');
}

main().catch(err => {
  log(`FATAL: ${err}`);
  process.exit(1);
});
