/**
 * POTAL Trade Remedy Lookup
 *
 * Queries trade_remedy_cases + trade_remedy_duties + trade_remedy_products
 * to find applicable AD (Anti-Dumping), CVD (Countervailing Duty),
 * and Safeguard measures for a given HS code + origin + destination.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

export type RemedyType = 'AD' | 'CVD' | 'SG';

export interface TradeRemedyResult {
  /** Total additional duty rate from all applicable remedies */
  totalRemedyRate: number;
  /** Individual remedy measures found */
  measures: TradeRemedyMeasure[];
  /** Whether any active trade remedies apply */
  hasRemedies: boolean;
}

export interface TradeRemedyMeasure {
  /** Type: AD (anti-dumping), CVD (countervailing), SG (safeguard) */
  type: RemedyType;
  /** Case ID from trade_remedy_cases */
  caseId: number;
  /** Additional duty rate (decimal, e.g. 0.25 = 25%) */
  dutyRate: number;
  /** Case title/description */
  title: string;
  /** Imposing country */
  imposingCountry: string;
  /** Affected country (exporter) */
  affectedCountry: string;
  /** Whether the measure is currently active */
  isActive: boolean;
}

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Main Lookup ───────────────────────────────────

/**
 * Look up applicable trade remedies (AD/CVD/Safeguard) for a product.
 *
 * @param destinationCountry  Imposing country ISO2
 * @param originCountry       Exporter country ISO2
 * @param hsCode              HS code (6+ digits)
 * @returns TradeRemedyResult with applicable measures
 */
export async function lookupTradeRemedies(
  destinationCountry: string,
  originCountry: string,
  hsCode: string,
): Promise<TradeRemedyResult> {
  const empty: TradeRemedyResult = { totalRemedyRate: 0, measures: [], hasRemedies: false };

  const supabase = getSupabase();
  if (!supabase) return empty;

  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();
  const hs6 = hsCode.replace(/\./g, '').trim().substring(0, 6);

  try {
    // Step 1: Find matching products in trade_remedy_products by HS prefix
    const productResult: any = await supabase
      .from('trade_remedy_products' as any)
      .select('case_id, hs_code')
      .or(`hs_code.eq.${hs6},hs_code.like.${hs6.substring(0, 4)}%`)
      .limit(50);

    if (productResult.error || !productResult.data || productResult.data.length === 0) {
      return empty;
    }

    const caseIds = [...new Set((productResult.data as any[]).map(p => p.case_id))];

    // Step 2: Get active cases matching imposing/affected country
    const caseResult: any = await supabase
      .from('trade_remedy_cases' as any)
      .select('id, case_type, title, imposing_country, affected_country, status')
      .in('id', caseIds)
      .eq('imposing_country', dest)
      .eq('affected_country', origin)
      .in('status', ['active', 'in_force', 'preliminary']);

    if (caseResult.error || !caseResult.data || caseResult.data.length === 0) {
      return empty;
    }

    const activeCases = caseResult.data as any[];
    const activeCaseIds = activeCases.map(c => c.id);

    // Step 3: Get duty rates for these cases
    const dutyResult: any = await supabase
      .from('trade_remedy_duties' as any)
      .select('case_id, duty_rate, duty_type')
      .in('case_id', activeCaseIds)
      .limit(50);

    // Build measures
    const measures: TradeRemedyMeasure[] = [];
    const dutyMap = new Map<number, number>();

    if (dutyResult.data) {
      for (const d of dutyResult.data as any[]) {
        const rate = parseFloat(d.duty_rate) || 0;
        const existing = dutyMap.get(d.case_id) || 0;
        dutyMap.set(d.case_id, Math.max(existing, rate));
      }
    }

    for (const c of activeCases) {
      const remedyType: RemedyType =
        c.case_type === 'AD' || c.case_type === 'anti-dumping' ? 'AD' :
        c.case_type === 'CVD' || c.case_type === 'countervailing' ? 'CVD' : 'SG';

      const rate = dutyMap.get(c.id) || 0;

      measures.push({
        type: remedyType,
        caseId: c.id,
        dutyRate: rate / 100, // Convert from percentage to decimal
        title: c.title || `${remedyType} measure`,
        imposingCountry: c.imposing_country,
        affectedCountry: c.affected_country,
        isActive: true,
      });
    }

    const totalRemedyRate = measures.reduce((sum, m) => sum + m.dutyRate, 0);

    return {
      totalRemedyRate,
      measures,
      hasRemedies: measures.length > 0,
    };
  } catch {
    return empty;
  }
}
