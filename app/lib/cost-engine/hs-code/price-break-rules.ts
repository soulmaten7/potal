/**
 * POTAL F015 — Price Break Rules
 *
 * Handles "valued over/under $X" conditions in tariff schedules.
 * When an HS 10-digit code has a price threshold, the duty rate
 * changes based on the declared value of the goods.
 *
 * Example: HTS 6204.62.4011 — "Women's trousers, valued not over $10/kg"
 *          HTS 6204.62.4021 — "Women's trousers, valued over $10/kg"
 *
 * Data source: hs_price_break_rules table (populated from government bulk downloads)
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────

export interface PriceBreakRule {
  /** Rule ID */
  id: string;
  /** Country ISO code */
  country: string;
  /** Parent HS code (6 or 8 digit) */
  parentHsCode: string;
  /** HS 10 code for items UNDER the threshold */
  hs10Under: string;
  /** HS 10 code for items AT or OVER the threshold */
  hs10Over: string;
  /** Price threshold value */
  thresholdValue: number;
  /** Threshold unit: 'unit' (per item), 'kg' (per kg), 'sqm' (per sq meter) */
  thresholdUnit: 'unit' | 'kg' | 'sqm' | 'dozen' | 'liter';
  /** Currency of threshold (usually USD) */
  thresholdCurrency: string;
  /** Duty rate for under-threshold */
  dutyRateUnder: number;
  /** Duty rate for over-threshold */
  dutyRateOver: number;
  /** Description for under-threshold */
  descriptionUnder: string;
  /** Description for over-threshold */
  descriptionOver: string;
}

export interface PriceBreakResult {
  /** Whether a price break rule applies */
  ruleApplied: boolean;
  /** The matching rule (if any) */
  rule?: PriceBreakRule;
  /** Selected HS 10 code based on price */
  selectedHs10?: string;
  /** Selected duty rate */
  selectedDutyRate?: number;
  /** Selected description */
  selectedDescription?: string;
  /** Whether the value is over the threshold */
  isOverThreshold?: boolean;
  /** Explanation of the rule */
  explanation?: string;
}

// ─── Supabase Client ────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── In-Memory Cache ────────────────────────────────

const ruleCache = new Map<string, { rules: PriceBreakRule[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Lookup Rules ───────────────────────────────────

/**
 * Look up price break rules for a given HS code and country.
 *
 * @param hsCode - HS code (6-10 digits)
 * @param country - Destination country ISO code
 * @param declaredValuePerUnit - Value per unit in USD
 * @param weightKg - Weight in kg (for per-kg thresholds)
 */
export async function applyPriceBreakRule(
  hsCode: string,
  country: string,
  declaredValuePerUnit: number,
  weightKg?: number,
): Promise<PriceBreakResult> {
  const rules = await getRulesForHsCode(hsCode, country);

  if (!rules || rules.length === 0) {
    return { ruleApplied: false };
  }

  // Find the matching rule
  for (const rule of rules) {
    let effectiveValue: number;

    switch (rule.thresholdUnit) {
      case 'kg':
        if (!weightKg || weightKg <= 0) continue;
        effectiveValue = declaredValuePerUnit / weightKg;
        break;
      case 'dozen':
        effectiveValue = declaredValuePerUnit * 12;
        break;
      default:
        effectiveValue = declaredValuePerUnit;
    }

    const isOver = effectiveValue > rule.thresholdValue;

    return {
      ruleApplied: true,
      rule,
      selectedHs10: isOver ? rule.hs10Over : rule.hs10Under,
      selectedDutyRate: isOver ? rule.dutyRateOver : rule.dutyRateUnder,
      selectedDescription: isOver ? rule.descriptionOver : rule.descriptionUnder,
      isOverThreshold: isOver,
      explanation: `Value ${effectiveValue.toFixed(2)} USD/${rule.thresholdUnit} is ${isOver ? 'over' : 'at or under'} threshold of $${rule.thresholdValue}/${rule.thresholdUnit}. Applied HS ${isOver ? rule.hs10Over : rule.hs10Under} with ${((isOver ? rule.dutyRateOver : rule.dutyRateUnder) * 100).toFixed(1)}% duty.`,
    };
  }

  return { ruleApplied: false };
}

/**
 * Get all price break rules for an HS code prefix in a country.
 */
async function getRulesForHsCode(
  hsCode: string,
  country: string,
): Promise<PriceBreakRule[] | null> {
  const hs6 = hsCode.replace(/\./g, '').substring(0, 6);
  const cacheKey = `${country}:${hs6}`;

  // Check cache
  const cached = ruleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.rules;
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('hs_price_break_rules')
      .select('*')
      .eq('country', country)
      .like('parent_hs_code', `${hs6}%`)
      .order('threshold_value', { ascending: true });

    if (error || !data) return null;

    const rules: PriceBreakRule[] = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      country: row.country as string,
      parentHsCode: row.parent_hs_code as string,
      hs10Under: row.hs10_under as string,
      hs10Over: row.hs10_over as string,
      thresholdValue: row.threshold_value as number,
      thresholdUnit: (row.threshold_unit as string) as PriceBreakRule['thresholdUnit'],
      thresholdCurrency: (row.threshold_currency as string) || 'USD',
      dutyRateUnder: row.duty_rate_under as number,
      dutyRateOver: row.duty_rate_over as number,
      descriptionUnder: row.description_under as string,
      descriptionOver: row.description_over as string,
    }));

    ruleCache.set(cacheKey, { rules, timestamp: Date.now() });
    return rules;
  } catch {
    return null;
  }
}

/**
 * Invalidate the price break rules cache.
 */
export function invalidatePriceBreakCache(): void {
  ruleCache.clear();
}
