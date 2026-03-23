/**
 * v3 Step 1 — Cache/DB Lookup
 * Check if this product+material combination has been classified before
 */

import type { NormalizedInputV3, V3PipelineResult } from '../../types';

/**
 * Generate a cache key from product_name + material
 */
function generateCacheKey(input: NormalizedInputV3): string {
  const base = `${input.product_name}|${input.material_primary}`.toLowerCase().trim();
  // Simple hash
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const ch = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return `v3_${Math.abs(hash).toString(36)}`;
}

/**
 * Try to find a cached classification result
 * Returns null if no cache hit (DB unavailable or no match)
 */
export async function lookupCache(input: NormalizedInputV3): Promise<V3PipelineResult | null> {
  try {
    const cacheKey = generateCacheKey(input);

    // Try Supabase gri_classification_cache table
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from('gri_classification_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .limit(1)
      .maybeSingle();

    if (data?.result) {
      const cached = data.result as V3PipelineResult;
      return { ...cached, cache_hit: true };
    }
  } catch {
    // DB unavailable — proceed without cache
  }

  return null;
}

/**
 * Save classification result to cache (fire-and-forget)
 */
export async function saveToCache(input: NormalizedInputV3, result: V3PipelineResult): Promise<void> {
  try {
    const cacheKey = generateCacheKey(input);

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from('gri_classification_cache')
      .upsert({
        cache_key: cacheKey,
        product_name: input.product_name,
        material: input.material_primary,
        result,
        created_at: new Date().toISOString(),
      }, { onConflict: 'cache_key' });
  } catch {
    // Silently fail — cache is optional
  }
}
