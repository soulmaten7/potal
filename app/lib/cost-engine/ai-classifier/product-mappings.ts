/**
 * POTAL AI Classifier — Product-HS Mappings Lookup
 *
 * Queries product_hs_mappings table for matching HS codes.
 * Uses PostgreSQL trigram similarity (pg_trgm) for fuzzy text matching.
 *
 * Sources:
 * - Google Product Taxonomy (5,596 categories)
 * - WDC Product Data (when available)
 * - AI-classified results (accumulated over time)
 * - Manual curations
 */

import { createClient } from '@supabase/supabase-js';
import type { HsClassificationResult } from '../hs-code/types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Search product_hs_mappings using trigram similarity.
 * Returns the best matching HS code.
 */
export async function searchProductMappings(
  productName: string,
  category?: string,
): Promise<HsClassificationResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // Build query: search by product name similarity
    let query = supabase
      .from('product_hs_mappings')
      .select('product_name, hs6, confidence, source, category')
      .order('confidence', { ascending: false })
      .limit(5);

    // Use ilike for basic matching (trigram index makes this fast)
    const searchTerms = productName.toLowerCase().split(/\s+/).filter(t => t.length >= 3);
    if (searchTerms.length > 0) {
      // Search with the longest/most specific term
      const bestTerm = searchTerms.sort((a, b) => b.length - a.length)[0];
      query = query.ilike('product_name', `%${bestTerm}%`);
    }

    // Filter by category if provided
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) return null;

    const best = data[0] as any;
    const alternatives = (data as any[]).slice(1).map(r => ({
      hsCode: r.hs6,
      description: r.product_name,
      confidence: r.confidence * 0.9, // Slightly lower for alternatives
    }));

    return {
      hsCode: best.hs6,
      description: best.product_name,
      confidence: Math.min(best.confidence, 0.85), // Cap at 0.85 for DB matches
      method: 'keyword' as const,
      alternatives,
    };
  } catch {
    return null;
  }
}

/**
 * Get mapping statistics.
 */
export async function getMappingStats(): Promise<{
  totalMappings: number;
  bySources: Record<string, number>;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { count } = await supabase
      .from('product_hs_mappings')
      .select('*', { count: 'exact', head: true });

    return {
      totalMappings: count || 0,
      bySources: {}, // Would need a separate query
    };
  } catch {
    return null;
  }
}
