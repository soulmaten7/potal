/**
 * HSCodeComp 632 — Remap with Chinese field synonym dictionary
 * Parse product_attributes JSON for 材质/面料/材料/成分/加工方式/用途 etc.
 * Usage: npx tsx scripts/hscodecomp_remap.ts
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const raw: any[] = JSON.parse(fs.readFileSync(`${BASE}/hscodecomp_raw.json`, 'utf-8'));

// Chinese/English field synonym mapping
const MATERIAL_KEYS = ['Material', 'material', '材质', '材料', '面料', '素材', 'Texture', 'Fabric', 'Fabric Type', 'Main Material', 'Shell Material', 'Outer Material', 'Upper Material', 'Frame Material', 'Blade Material', 'Main Stone Material', 'Case Material', 'Band Material', 'Dial Material'];
const COMPOSITION_KEYS = ['成分', '成分含量', 'Composition', 'composition', 'Fiber Content', 'Content', '组成'];
const PROCESSING_KEYS = ['加工方式', '加工状态', 'Processing', 'processing', '工艺', 'Craft', 'Process'];
const WEIGHT_KEYS = ['Weight', 'weight', '重量', 'Package weight', 'Net weight', 'Item Weight', 'Gross weight'];
const ORIGIN_KEYS = ['Origin', 'origin', '原产地', '产地', 'Country of Origin', 'Made in', 'Place of Origin'];
const USE_KEYS = ['用途', 'Use', 'Application', 'Purpose', 'Intended Use', 'Suitable For'];
const DESC_KEYS = ['规格型号', 'Specification', 'Model', 'Type', 'Size', 'Dimension', 'Style'];

function parseAttrs(attrsStr: string): Record<string, string> {
  try { return JSON.parse(attrsStr); }
  catch {
    const result: Record<string, string> = {};
    const matches = attrsStr.matchAll(/"([^"]+)"\s*:\s*"([^"]*?)"/g);
    for (const m of matches) result[m[1]] = m[2];
    return result;
  }
}

function findField(attrs: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (attrs[k] && attrs[k].trim() && attrs[k] !== 'None' && attrs[k] !== 'none') {
      return attrs[k].trim();
    }
  }
  return '';
}

async function main() {
  console.log('═══ Phase 6: HSCodeComp Remapping with Chinese Field Dictionary ═══\n');

  // Stats: before vs after
  let beforeMaterial = 0, afterMaterial = 0;
  let beforeOrigin = 0, afterOrigin = 0;
  let beforeFields = 0, afterFields = 0;

  interface RemappedItem {
    id: number;
    product_name: string;
    material_before: string;
    material_after: string;
    origin_before: string;
    origin_after: string;
    extra_fields_found: string[];
    available_field_count_before: number;
    available_field_count_after: number;
    verified_hs6: string;
    pipeline_hs6_before: string;
    pipeline_hs6_after: string;
    hs6_match_before: boolean;
    hs6_match_after: boolean;
  }

  const remapped: RemappedItem[] = [];
  let h6OkBefore = 0, h6OkAfter = 0;
  let chOkBefore = 0, chOkAfter = 0;
  let hOkBefore = 0, hOkAfter = 0;

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const attrs = parseAttrs(item.product_attributes || '{}');

    // HS code
    const hsRaw = String(item.hs_code || '').padStart(10, '0');
    const hs6 = hsRaw.substring(0, 6);
    const vChapter = parseInt(hs6.substring(0, 2), 10);
    const vHeading = hs6.substring(0, 4);

    // Category
    const catParts = [item.cate_lv1_desc, item.cate_lv2_desc, item.cate_lv3_desc, item.cate_lv4_desc, item.cate_lv5_desc]
      .filter((c: string) => c && c.trim());
    const category = catParts.join(' > ');

    // BEFORE: simple mapping (like original benchmark)
    const materialBefore = attrs['Material'] || attrs['material'] || '';
    const originRaw = attrs['Origin'] || '';
    let originBefore = '';
    if (originRaw.includes('China') || originRaw.includes('中国')) originBefore = 'CN';

    // AFTER: enhanced mapping with Chinese dictionary
    const materialAfter = findField(attrs, MATERIAL_KEYS);
    const compositionAfter = findField(attrs, COMPOSITION_KEYS);
    const processingAfter = findField(attrs, PROCESSING_KEYS);
    const weightAfter = findField(attrs, WEIGHT_KEYS);
    const originAfterRaw = findField(attrs, ORIGIN_KEYS);
    let originAfter = '';
    if (originAfterRaw.includes('China') || originAfterRaw.includes('中国') || originAfterRaw.includes('Mainland')) originAfter = 'CN';
    else if (originAfterRaw.includes('India')) originAfter = 'IN';
    else if (originAfterRaw.includes('Korea')) originAfter = 'KR';
    else if (originAfterRaw.includes('Japan')) originAfter = 'JP';
    else if (originAfterRaw.includes('Vietnam')) originAfter = 'VN';
    else if (originAfterRaw.includes('Taiwan')) originAfter = 'TW';
    else if (originAfterRaw) originAfter = 'CN'; // default for Chinese platform

    const useAfter = findField(attrs, USE_KEYS);
    const descAfter = findField(attrs, DESC_KEYS);

    if (materialBefore) beforeMaterial++;
    if (materialAfter) afterMaterial++;
    if (originBefore) beforeOrigin++;
    if (originAfter) afterOrigin++;

    const fieldsBefore = ['product_name', category ? 'category' : '', materialBefore ? 'material' : '', originBefore ? 'origin_country' : ''].filter(Boolean).length;
    const fieldsAfter = ['product_name', category ? 'category' : '', materialAfter ? 'material' : '', originAfter ? 'origin_country' : '', compositionAfter ? 'composition' : '', processingAfter ? 'processing' : '', weightAfter ? 'weight_spec' : '', useAfter ? 'use' : '', descAfter ? 'description' : ''].filter(Boolean).length;
    beforeFields += fieldsBefore;
    afterFields += fieldsAfter;

    // Extra fields found
    const extraFields: string[] = [];
    if (materialAfter && !materialBefore) extraFields.push(`material: "${materialAfter}"`);
    if (compositionAfter) extraFields.push(`composition: "${compositionAfter}"`);
    if (processingAfter) extraFields.push(`processing: "${processingAfter}"`);
    if (useAfter) extraFields.push(`use→category: "${useAfter}"`);
    if (descAfter) extraFields.push(`desc: "${descAfter}"`);

    // Run BEFORE pipeline
    const inputBefore: ClassifyInputV3 = {
      product_name: item.product_name || '',
      material: materialBefore || 'unknown',
      origin_country: originBefore || 'CN',
      category,
      description: '',
      processing: '',
      composition: '',
      weight_spec: '',
      price: item.price && item.currency_code === 'USD' ? item.price : (item.price ? item.price / 7.2 : undefined),
    };
    if (inputBefore.material.length < 2) inputBefore.material = 'unknown';

    // Run AFTER pipeline
    const categoryEnhanced = useAfter ? `${category} > ${useAfter}` : category;
    const inputAfter: ClassifyInputV3 = {
      product_name: item.product_name || '',
      material: materialAfter || 'unknown',
      origin_country: originAfter || 'CN',
      category: categoryEnhanced,
      description: descAfter,
      processing: processingAfter,
      composition: compositionAfter,
      weight_spec: weightAfter,
      price: item.price && item.currency_code === 'USD' ? item.price : (item.price ? item.price / 7.2 : undefined),
    };
    if (inputAfter.material.length < 2) inputAfter.material = 'unknown';

    try {
      const rBefore = await classifyV3(inputBefore);
      const rAfter = await classifyV3(inputAfter);

      const h6MatchBefore = (rBefore.confirmed_hs6 || '') === hs6;
      const h6MatchAfter = (rAfter.confirmed_hs6 || '') === hs6;
      const chMatchBefore = rBefore.confirmed_chapter === vChapter;
      const chMatchAfter = rAfter.confirmed_chapter === vChapter;
      const hMatchBefore = (rBefore.confirmed_heading || '') === vHeading;
      const hMatchAfter = (rAfter.confirmed_heading || '') === vHeading;

      if (h6MatchBefore) h6OkBefore++;
      if (h6MatchAfter) h6OkAfter++;
      if (chMatchBefore) chOkBefore++;
      if (chMatchAfter) chOkAfter++;
      if (hMatchBefore) hOkBefore++;
      if (hMatchAfter) hOkAfter++;

      remapped.push({
        id: item.task_id,
        product_name: (item.product_name || '').substring(0, 50),
        material_before: materialBefore,
        material_after: materialAfter,
        origin_before: originBefore,
        origin_after: originAfter,
        extra_fields_found: extraFields,
        available_field_count_before: fieldsBefore,
        available_field_count_after: fieldsAfter,
        verified_hs6: hs6,
        pipeline_hs6_before: rBefore.confirmed_hs6 || '',
        pipeline_hs6_after: rAfter.confirmed_hs6 || '',
        hs6_match_before: h6MatchBefore,
        hs6_match_after: h6MatchAfter,
      });

      if (i < 10 || (h6MatchAfter && !h6MatchBefore)) {
        const mark = h6MatchAfter ? '✅' : (h6MatchBefore ? '🔻' : '❌');
        if (h6MatchAfter && !h6MatchBefore) {
          console.log(`  🆕 #${i + 1} FIXED: "${(item.product_name || '').substring(0, 35)}" ${rBefore.confirmed_hs6}→${rAfter.confirmed_hs6} (expected ${hs6})`);
        }
      }

      if (i % 100 === 0) {
        console.log(`[${i + 1}/632] Before: ${h6OkBefore} HS6 | After: ${h6OkAfter} HS6`);
      }
    } catch (err: any) {
      remapped.push({
        id: item.task_id, product_name: (item.product_name || '').substring(0, 50),
        material_before: materialBefore, material_after: materialAfter,
        origin_before: originBefore, origin_after: originAfter,
        extra_fields_found: extraFields,
        available_field_count_before: fieldsBefore, available_field_count_after: fieldsAfter,
        verified_hs6: hs6, pipeline_hs6_before: '', pipeline_hs6_after: '',
        hs6_match_before: false, hs6_match_after: false,
      });
    }
  }

  const N = raw.length;
  console.log(`\n═══ Remapping Results ═══`);
  console.log(`\nField extraction improvement:`);
  console.log(`  material: ${beforeMaterial}→${afterMaterial} (${beforeMaterial}→${afterMaterial} / ${N})`);
  console.log(`  origin:   ${beforeOrigin}→${afterOrigin}`);
  console.log(`  avg fields: ${(beforeFields / N).toFixed(1)}→${(afterFields / N).toFixed(1)} per item`);

  console.log(`\nAccuracy comparison:`);
  console.log(`  Chapter: ${chOkBefore}→${chOkAfter} / ${N} (${(chOkBefore / N * 100).toFixed(1)}%→${(chOkAfter / N * 100).toFixed(1)}%)`);
  console.log(`  Heading: ${hOkBefore}→${hOkAfter} / ${N} (${(hOkBefore / N * 100).toFixed(1)}%→${(hOkAfter / N * 100).toFixed(1)}%)`);
  console.log(`  HS6:     ${h6OkBefore}→${h6OkAfter} / ${N} (${(h6OkBefore / N * 100).toFixed(1)}%→${(h6OkAfter / N * 100).toFixed(1)}%)`);

  const improved = remapped.filter(r => r.hs6_match_after && !r.hs6_match_before);
  const regressed = remapped.filter(r => !r.hs6_match_after && r.hs6_match_before);
  console.log(`\n  Improved: ${improved.length} items`);
  console.log(`  Regressed: ${regressed.length} items`);
  console.log(`  Net gain: ${improved.length - regressed.length} items`);

  fs.writeFileSync(`${BASE}/hscodecomp_remapped.json`, JSON.stringify(remapped, null, 2));
  console.log(`\n✅ Saved to ${BASE}/hscodecomp_remapped.json`);
}

main().catch(console.error);
