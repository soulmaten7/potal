/**
 * Step 0.5: DB Cache Search — check product_hs_mappings for exact/similar match.
 * Pure code — no AI calls.
 */

import { createClient } from '@supabase/supabase-js';
import type { GriClassificationResult } from '../types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Search product_hs_mappings for an exact or similar product name.
 * Returns a GriClassificationResult if found, null otherwise.
 */
export async function searchDbCache(productName: string): Promise<GriClassificationResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const cleanName = productName.trim().toLowerCase();
  if (cleanName.length < 3) return null;

  try {
    // 1. Exact match (case-insensitive)
    const { data: exactMatch } = await supabase
      .from('product_hs_mappings')
      .select('product_name, hs6_code, source')
      .ilike('product_name', cleanName)
      .limit(1)
      .single();

    if (exactMatch && exactMatch.hs6_code) {
      const hs6 = String(exactMatch.hs6_code).replace(/\./g, '').substring(0, 6);
      return buildCacheResult(hs6, exactMatch.product_name, 'exact_match', 0.95);
    }

    // 2. Prefix/contains match
    const searchTerm = cleanName.substring(0, 50);
    const { data: partialMatches } = await supabase
      .from('product_hs_mappings')
      .select('product_name, hs6_code, source')
      .ilike('product_name', `%${searchTerm}%`)
      .limit(3);

    if (partialMatches && partialMatches.length > 0) {
      const best = partialMatches[0];
      const hs6 = String(best.hs6_code).replace(/\./g, '').substring(0, 6);
      return buildCacheResult(hs6, best.product_name, 'partial_match', 0.8);
    }

    return null;
  } catch {
    return null;
  }
}

function buildCacheResult(
  hs6: string,
  matchedName: string,
  method: string,
  confidence: number
): GriClassificationResult {
  return {
    hsCode: hs6,
    hsCodePrecision: 'HS6',
    description: `DB cache ${method}: "${matchedName}"`,
    confidence,
    decisionPath: [{
      step: 0,
      name: 'db_cache',
      input: matchedName,
      output: hs6,
      method: 'code',
      timeMs: 0,
    }],
    griRulesApplied: [],
    classificationMethod: 'gri_pipeline',
    aiCallCount: 0,
    processingTimeMs: 0,
  };
}
