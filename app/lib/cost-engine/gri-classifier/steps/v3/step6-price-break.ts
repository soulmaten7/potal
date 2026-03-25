/**
 * v3 Step 5: Price Break — 가격 분기 규칙 적용
 * "valued over $X" / "valued not over $X" 처리
 * AI 호출: 0회. DB 룩업 (hs_price_break_rules, 18건)
 *
 * DB 구조:
 *   parent_hs_code | hs10_under | hs10_over | threshold_value | threshold_currency
 *   900640         | 9006406000 | 9006409000 | 10              | USD
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface Step6PriceBreakResult {
  final_hs_code: string;
  price_break_applied: boolean;
  rule_description?: string;
  original_code: string;
  duty_rate?: number;
}

export async function applyPriceBreakV3(
  hsCode: string,
  price?: number,
  destinationCountry?: string
): Promise<Step6PriceBreakResult> {
  const original = hsCode;

  if (!price || price < 0) {
    return { final_hs_code: hsCode, price_break_applied: false, original_code: original };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { final_hs_code: hsCode, price_break_applied: false, original_code: original };
  }

  try {
    // Match on parent_hs_code (6-digit prefix of current code)
    const hs6 = hsCode.substring(0, 6);

    let query = supabase
      .from('hs_price_break_rules')
      .select('*')
      .eq('parent_hs_code', hs6);

    // If destination country specified, filter by country
    if (destinationCountry) {
      query = query.eq('country', destinationCountry.toUpperCase());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return { final_hs_code: hsCode, price_break_applied: false, original_code: original };
    }

    for (const rule of data) {
      const threshold = Number(rule.threshold_value);
      const hs10Under = rule.hs10_under as string;
      const hs10Over = rule.hs10_over as string;
      const dutyUnder = rule.duty_rate_under as number | null;
      const dutyOver = rule.duty_rate_over as number | null;
      const descUnder = rule.description_under as string;
      const descOver = rule.description_over as string;

      if (price <= threshold) {
        return {
          final_hs_code: hs10Under,
          price_break_applied: true,
          rule_description: `${descUnder} (price $${price} ≤ $${threshold})`,
          original_code: original,
          duty_rate: dutyUnder ?? undefined,
        };
      } else {
        return {
          final_hs_code: hs10Over,
          price_break_applied: true,
          rule_description: `${descOver} (price $${price} > $${threshold})`,
          original_code: original,
          duty_rate: dutyOver ?? undefined,
        };
      }
    }

    return { final_hs_code: hsCode, price_break_applied: false, original_code: original };
  } catch {
    return { final_hs_code: hsCode, price_break_applied: false, original_code: original };
  }
}
