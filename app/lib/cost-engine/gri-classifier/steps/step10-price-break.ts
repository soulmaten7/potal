/**
 * Step 10: Apply price break rules.
 * Pure code — no AI calls.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface PriceBreakResult {
  filteredCandidates: string[];
  priceBreakApplied: boolean;
  rule?: string;
}

export async function applyPriceBreak(
  candidates: string[],
  price?: number
): Promise<PriceBreakResult> {
  if (!price || candidates.length === 0) {
    return { filteredCandidates: candidates, priceBreakApplied: false };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { filteredCandidates: candidates, priceBreakApplied: false };
  }

  try {
    // Check price break rules for these HS codes
    const hs6List = [...new Set(candidates.map(c => c.substring(0, 6)))];

    const { data, error } = await supabase
      .from('hs_price_break_rules')
      .select('*')
      .in('parent_hs_code', hs6List);

    if (error || !data || data.length === 0) {
      return { filteredCandidates: candidates, priceBreakApplied: false };
    }

    // Apply price break rules
    const filtered: string[] = [];
    let appliedRule: string | undefined;

    for (const candidate of candidates) {
      const hs6 = candidate.substring(0, 6);
      const rule = data.find((r: Record<string, unknown>) => r.parent_hs_code === hs6);

      if (!rule) {
        filtered.push(candidate);
        continue;
      }

      const threshold = rule.price_threshold as number;
      const condition = rule.condition as string;

      if (condition === 'over' && price > threshold) {
        filtered.push(candidate);
        appliedRule = `Price $${price} > $${threshold}: ${condition}`;
      } else if (condition === 'not_over' && price <= threshold) {
        filtered.push(candidate);
        appliedRule = `Price $${price} <= $${threshold}: ${condition}`;
      }
      // If condition doesn't match, skip this candidate
    }

    return {
      filteredCandidates: filtered.length > 0 ? filtered : candidates,
      priceBreakApplied: !!appliedRule,
      rule: appliedRule,
    };
  } catch {
    return { filteredCandidates: candidates, priceBreakApplied: false };
  }
}
