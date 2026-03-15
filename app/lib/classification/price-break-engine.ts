/**
 * F015: Price Break Rules Engine — S+ Grade
 * Evaluates price-dependent tariff classification and rate adjustments.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface PriceBreakResult {
  originalHs10: string;
  adjustedHs10?: string;
  priceConditionMet: string;
  dutyRateBefore: number;
  dutyRateAfter: number;
  priceThreshold: number;
  impact: { dutyDiffPct: number; dutyDiffAmountPerUnit: number };
}

export interface PriceOptimization {
  currentRate: number;
  pricePoints: Array<{
    priceThreshold: number;
    rateIfBelow: number;
    rateIfAbove: number;
    savingsPerUnit: number;
  }>;
  optimizationNote: string;
  disclaimer: string;
}

export async function evaluatePriceBreaks(hs10: string, price: number, country: string): Promise<PriceBreakResult | null> {
  const sb = getSupabase();

  const { data: rules } = await sb
    .from('price_break_rules')
    .select('*')
    .eq('country_code', country.toUpperCase())
    .like('hs_code', `${hs10.slice(0, 6)}%`)
    .limit(10);

  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const threshold = parseFloat(rule.price_threshold);
    const condType = rule.condition_type as string; // 'over' | 'not_over' | 'range'

    let met = false;
    let conditionStr = '';

    if (condType === 'over' && price > threshold) {
      met = true;
      conditionStr = `Valued over $${threshold}`;
    } else if (condType === 'not_over' && price <= threshold) {
      met = true;
      conditionStr = `Valued not over $${threshold}`;
    } else if (condType === 'range') {
      const upper = parseFloat(rule.price_threshold_upper || '0');
      if (price > threshold && price <= upper) {
        met = true;
        conditionStr = `Valued over $${threshold} but not over $${upper}`;
      }
    }

    if (met) {
      const rateBefore = parseFloat(rule.rate_default || '0');
      const rateAfter = parseFloat(rule.rate_if_met || '0');
      return {
        originalHs10: hs10,
        adjustedHs10: rule.adjusted_hs_code || undefined,
        priceConditionMet: conditionStr,
        dutyRateBefore: rateBefore,
        dutyRateAfter: rateAfter,
        priceThreshold: threshold,
        impact: {
          dutyDiffPct: rateAfter - rateBefore,
          dutyDiffAmountPerUnit: price * (rateAfter - rateBefore) / 100,
        },
      };
    }
  }

  return null;
}

export async function getOptimizationSuggestions(hsCode: string, price: number, country: string): Promise<PriceOptimization> {
  const sb = getSupabase();

  const { data: rules } = await sb
    .from('price_break_rules')
    .select('*')
    .eq('country_code', country.toUpperCase())
    .like('hs_code', `${hsCode.slice(0, 6)}%`)
    .order('price_threshold', { ascending: true })
    .limit(20);

  const currentRate = parseFloat(rules?.[0]?.rate_default || '0') || 5.0;

  const pricePoints = (rules || []).map(r => {
    const threshold = parseFloat(r.price_threshold);
    const rateBelow = parseFloat(r.rate_if_met || r.rate_default || '0');
    const rateAbove = parseFloat(r.rate_default || '0');
    return {
      priceThreshold: threshold,
      rateIfBelow: rateBelow,
      rateIfAbove: rateAbove,
      savingsPerUnit: price * Math.abs(rateAbove - rateBelow) / 100,
    };
  });

  return {
    currentRate,
    pricePoints,
    optimizationNote: pricePoints.length > 0
      ? `Found ${pricePoints.length} price threshold(s) for this HS code in ${country}.`
      : `No price-dependent rules found for ${hsCode} in ${country}.`,
    disclaimer: 'This is informational only. Consult a licensed customs advisor for compliance decisions.',
  };
}
