#!/usr/bin/env node
/**
 * CW33-S3 Seed — hs_codes, hs_keywords, brand_origins, marketplace_origins, eu_vat_regimes
 *
 * Sources:
 *   - regulations/international/wco/hs2022_{sections,chapters}.json → hs_codes (level=section/chapter)
 *   - regulations/us/htsus/hts_2026_rev4.json → hs_codes (heading/subheading/national)
 *   - app/lib/cost-engine/hs-code/chapters/ch*.ts → hs_keywords
 *   - app/lib/data/brand-origins.ts → brand_origins
 *   - app/lib/cost-engine/origin-detection.ts PLATFORM_ORIGINS → marketplace_origins
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ROOT = '/Volumes/soulmaten/POTAL';

// ─── P0.11 HS Codes (WCO 2022 sections/chapters + HTSUS 2026) ──
console.log('=== P0.11 hs_codes ===');
async function seedHsCodes() {
  // 1. WCO 2022 sections (21 sections I-XXI)
  const sections = JSON.parse(fs.readFileSync(`${ROOT}/regulations/international/wco/hs2022_sections.json`, 'utf8'));
  const chapters = JSON.parse(fs.readFileSync(`${ROOT}/regulations/international/wco/hs2022_chapters.json`, 'utf8'));
  console.log(`  WCO sections=${Array.isArray(sections) ? sections.length : Object.keys(sections).length}, chapters=${Array.isArray(chapters) ? chapters.length : Object.keys(chapters).length}`);

  const rows = [];

  // Sections — handle either array or object shape
  const sectionArr = Array.isArray(sections) ? sections
    : Object.entries(sections).map(([code, v]) => ({ code, ...(typeof v === 'string' ? { title: v } : v) }));
  for (const s of sectionArr) {
    const code = s.code || s.section || s.roman;
    const desc = s.title || s.description || s.name;
    if (!code || !desc) continue;
    rows.push({
      hs_code: `S${code}`.slice(0, 10),
      description: desc.slice(0, 500),
      level: 'section',
      section: code,
      source_citation: 'WCO Harmonized System 2022 — Sections',
      data_confidence: 'official',
    });
  }

  // Chapters — similar
  const chapterArr = Array.isArray(chapters) ? chapters
    : Object.entries(chapters).map(([code, v]) => ({ code, ...(typeof v === 'string' ? { title: v } : v) }));
  for (const c of chapterArr) {
    const code = String(c.code || c.chapter || '').padStart(2, '0');
    const desc = c.title || c.description || c.name;
    if (!code || !desc || code.length !== 2) continue;
    rows.push({
      hs_code: code,
      description: desc.slice(0, 500),
      level: 'chapter',
      chapter: code,
      section: c.section || null,
      source_citation: 'WCO Harmonized System 2022 — Chapters',
      data_confidence: 'official',
    });
  }

  // 2. US HTSUS 2026 rev4 — headings + subheadings + 10-digit national
  const hts = JSON.parse(fs.readFileSync(`${ROOT}/regulations/us/htsus/hts_2026_rev4.json`, 'utf8'));
  let htsRows = 0;
  for (const e of hts) {
    const raw = (e.htsno || '').trim();
    if (!raw) continue;
    const code = raw.replace(/\./g, '');
    const level = code.length === 4 ? 'heading'
      : code.length === 6 ? 'subheading'
      : code.length === 8 ? 'national8'
      : code.length === 10 ? 'national10'
      : null;
    if (!level) continue;
    rows.push({
      hs_code: code.slice(0, 10),
      description: (e.description || '').slice(0, 500),
      level,
      chapter: code.slice(0, 2),
      parent_code: level === 'heading' ? code.slice(0, 2)
        : level === 'subheading' ? code.slice(0, 4)
        : level === 'national8' ? code.slice(0, 6)
        : code.slice(0, 8),
      indent: Number(e.indent) || 0,
      hs_version: '2022',
      source_citation: 'USITC HTSUS 2026 rev4',
      data_confidence: 'official',
    });
    htsRows++;
  }
  console.log(`  prepared ${rows.length} rows (wco meta + ${htsRows} HTSUS)`);

  // Upsert in chunks, dedup on hs_code
  const seen = new Set();
  const unique = [];
  for (const r of rows) {
    if (seen.has(r.hs_code)) continue;
    seen.add(r.hs_code);
    unique.push(r);
  }
  console.log(`  unique: ${unique.length}`);

  // Clear existing
  await sb.from('hs_codes').delete().not('id', 'is', null);

  const CHUNK = 500;
  let inserted = 0;
  for (let k = 0; k < unique.length; k += CHUNK) {
    const chunk = unique.slice(k, k + CHUNK);
    const { error } = await sb.from('hs_codes').insert(chunk);
    if (error) {
      console.log(`  chunk ${k}: ${error.message.slice(0, 150)}`);
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`  ✓ inserted ${inserted} hs_codes`);
}

// ─── P0.11 HS Keywords (from chapter files) ─────────
console.log('\n=== P0.11 hs_keywords ===');
async function seedHsKeywords() {
  const chDir = 'app/lib/cost-engine/hs-code/chapters';
  const files = fs.readdirSync(chDir).filter(f => f.endsWith('.ts'));
  console.log(`  found ${files.length} chapter files`);

  const rows = [];
  for (const file of files) {
    const content = fs.readFileSync(`${chDir}/${file}`, 'utf8');
    // Match entries: { code: '8506', ..., keywords: ['battery', ...] }
    const entryRe = /\{\s*code:\s*'([^']+)'[\s\S]*?keywords:\s*\[([^\]]*)\]\s*\}/g;
    let m;
    while ((m = entryRe.exec(content)) !== null) {
      const code = m[1];
      const kwBlock = m[2];
      const keywords = [...kwBlock.matchAll(/'([^']+)'/g)].map(x => x[1]);
      for (const kw of keywords) {
        if (!kw || kw.length < 2 || kw.length > 80) continue;
        rows.push({
          keyword: kw.toLowerCase(),
          hs_code: code,
          score: 1.0,
          keyword_type: 'product',
          source_citation: `app/lib/cost-engine/hs-code/chapters/${file}`,
          data_confidence: 'official',
        });
      }
    }
  }

  console.log(`  parsed ${rows.length} keyword rows`);

  // Dedup (keyword, hs_code)
  const seen = new Set();
  const unique = [];
  for (const r of rows) {
    const key = `${r.keyword}|${r.hs_code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }
  console.log(`  unique: ${unique.length}`);

  await sb.from('hs_keywords').delete().not('id', 'is', null);
  const CHUNK = 500;
  let inserted = 0;
  for (let k = 0; k < unique.length; k += CHUNK) {
    const chunk = unique.slice(k, k + CHUNK);
    const { error } = await sb.from('hs_keywords').insert(chunk);
    if (error) console.log(`  chunk ${k}: ${error.message.slice(0, 150)}`);
    else inserted += chunk.length;
  }
  console.log(`  ✓ inserted ${inserted} keywords`);
}

// ─── P0.12 Brand origins + Marketplace origins ─────
console.log('\n=== P0.12 brand_origins + marketplace_origins ===');
async function seedBrandOrigins() {
  const src = fs.readFileSync('app/lib/data/brand-origins.ts', 'utf8');
  const rows = [...src.matchAll(/([a-z][a-z0-9]*(?:[a-z0-9])?)\s*:\s*'([A-Z]{2})'/g)]
    .map(m => ({
      brand_name: m[1],
      country_code: m[2],
      confidence: 0.9,
      source_citation: 'app/lib/data/brand-origins.ts (CW33-S1 seeded)',
      data_confidence: 'official',
    }));
  console.log(`  parsed ${rows.length} brands`);

  await sb.from('brand_origins').delete().not('id', 'is', null);
  // Dedup by brand_name
  const seen = new Set();
  const unique = rows.filter(r => {
    if (seen.has(r.brand_name)) return false;
    seen.add(r.brand_name);
    return true;
  });
  const { error, data } = await sb.from('brand_origins').insert(unique).select('brand_name');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} brands`);
}

async function seedMarketplaceOrigins() {
  const src = fs.readFileSync('app/lib/cost-engine/origin-detection.ts', 'utf8');
  const block = src.match(/PLATFORM_ORIGINS[^}]*=\s*\{([\s\S]*?)\};/)?.[1];
  if (!block) { console.log('  ✗ PLATFORM_ORIGINS block not found'); return; }
  const rows = [...block.matchAll(/['"]?([a-z0-9]+)['"]?\s*:\s*'([A-Z]{2})'/gi)]
    .map(m => ({
      platform: m[1].toLowerCase(),
      default_country_code: m[2],
      confidence: m[2] === 'US' ? 0.6 : 0.9,  // US is a hub, weaker signal
      source_citation: 'app/lib/cost-engine/origin-detection.ts PLATFORM_ORIGINS',
      data_confidence: 'official',
    }));
  console.log(`  parsed ${rows.length} platforms`);

  await sb.from('marketplace_origins').delete().not('id', 'is', null);
  const seen = new Set();
  const unique = rows.filter(r => {
    if (seen.has(r.platform)) return false;
    seen.add(r.platform);
    return true;
  });
  const { error, data } = await sb.from('marketplace_origins').insert(unique).select('platform');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} platforms`);
}

// ─── P0.13 EU VAT regimes (IOSS / OSS / SCR) ───────
console.log('\n=== P0.13 eu_vat_regimes ===');
async function seedEuVatRegimes() {
  // These are official EU thresholds from VAT Directive 2006/112/EC
  // IOSS — Import One-Stop Shop (low-value goods <€150)
  // OSS — One-Stop Shop (intra-EU distance sales >€10k annually)
  // SCR — Small Consignment Relief (deleted 2021-07-01)
  const regimes = [
    {
      regime_code: 'IOSS',
      regime_name: 'Import One-Stop Shop',
      threshold_eur: 150,
      threshold_description: 'Intrinsic value ≤ €150 for consignments from third countries',
      applies_to_b2c: true,
      applies_to_b2b: false,
      registration_format: 'IMxxxxxxxxxx (12 digits)',
      effective_date: '2021-07-01',
      legal_citation: 'EU VAT Directive 2006/112/EC Articles 369l-369x (amended by Council Directive (EU) 2017/2455)',
      source_citation: 'EU Directive 2006/112/EC + Commission Regulation (EU) 2020/194',
      data_confidence: 'official',
    },
    {
      regime_code: 'OSS',
      regime_name: 'One-Stop Shop (Union scheme)',
      threshold_eur: 10000,
      threshold_description: 'Annual distance sales + B2C services to other EU Member States > €10,000',
      applies_to_b2c: true,
      applies_to_b2b: false,
      registration_format: 'National VAT number',
      effective_date: '2021-07-01',
      legal_citation: 'EU VAT Directive 2006/112/EC Articles 369a-369k',
      source_citation: 'EU Directive 2006/112/EC + Commission Implementing Regulation (EU) 2019/2026',
      data_confidence: 'official',
    },
    {
      regime_code: 'OSS_NON_UNION',
      regime_name: 'One-Stop Shop (non-Union scheme)',
      threshold_eur: null,
      threshold_description: 'For non-EU service providers supplying B2C services in EU',
      applies_to_b2c: true,
      applies_to_b2b: false,
      registration_format: 'EUxxxxxxxxx',
      effective_date: '2021-07-01',
      legal_citation: 'EU VAT Directive 2006/112/EC Articles 358-369',
      source_citation: 'EU Directive 2006/112/EC',
      data_confidence: 'official',
    },
    {
      regime_code: 'SCR',
      regime_name: 'Small Consignment Relief (abolished)',
      threshold_eur: 22,
      threshold_description: 'Historical: €22 import VAT exemption — ABOLISHED 2021-07-01 by Directive (EU) 2017/2455',
      applies_to_b2c: true,
      applies_to_b2b: true,
      effective_date: '2009-01-01',
      expires_at: '2021-06-30',
      legal_citation: 'EU VAT Directive 2006/112/EC Article 23 (deleted)',
      source_citation: 'EU Directive 2006/112/EC (pre-2021 version) — reference only',
      data_confidence: 'official',
    },
  ];

  await sb.from('eu_vat_regimes').delete().not('id', 'is', null);
  const { error, data } = await sb.from('eu_vat_regimes').insert(regimes).select('regime_code');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} regimes`);
}

// ─── Run all ─────────────────────────────────────
await seedHsCodes();
await seedHsKeywords();
await seedBrandOrigins();
await seedMarketplaceOrigins();
await seedEuVatRegimes();

console.log('\n=== Final counts ===');
for (const t of ['hs_codes', 'hs_keywords', 'brand_origins', 'marketplace_origins', 'eu_vat_regimes']) {
  const { data } = await sb.from(t).select('*').range(0, 9999);
  console.log(`  ${t.padEnd(25)} ${data?.length ?? 0} rows`);
}
