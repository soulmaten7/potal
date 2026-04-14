/**
 * CW34-S4: Customs Rulings Lookup
 *
 * Queries Supabase customs_rulings table for classification precedents.
 * CEO Decision 2: Rulings are classification judgments, NOT duty rate sources.
 * Only conditional_rules outcomes may contain rates.
 *
 * Scoring: HS precision + 10-field overlap + confidence + status
 */

import { createClient } from '@supabase/supabase-js';

export interface RulingQuery {
  hsCode?: string;
  hs6?: string;
  jurisdiction?: string;  // EU, US
  material?: string;
  productForm?: string;
  intendedUse?: string;
  limit?: number;
}

export interface RulingMatch {
  id: number;
  rulingId: string;
  source: string;
  issuingCountry: string | null;
  jurisdiction: string | null;
  hsCode: string;
  hs6: string;
  productName: string;
  material: string | null;
  productForm: string | null;
  intendedUse: string | null;
  conditionalRules: Record<string, unknown> | null;
  dutyRateAdValorem: number | null;
  confidenceScore: number;
  rulingDate: string | null;
  status: string;
  matchScore: number;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function computeMatchScore(row: Record<string, unknown>, q: RulingQuery): number {
  let score = 0;

  const rowHsCode = String(row.hs_code || '');
  const rowHs6 = String(row.hs6 || '');

  // HS match (most important)
  if (q.hsCode) {
    if (rowHsCode === q.hsCode) score += 100;           // exact 10-digit
    else if (rowHs6 === q.hsCode.slice(0, 6)) score += 60; // hs6 match
    else if (rowHsCode.slice(0, 4) === q.hsCode.slice(0, 4)) score += 20; // heading match
  } else if (q.hs6) {
    if (rowHs6 === q.hs6) score += 80;
    else if (rowHs6.slice(0, 4) === q.hs6.slice(0, 4)) score += 20;
  }

  // Jurisdiction match
  if (q.jurisdiction && row.jurisdiction === q.jurisdiction) score += 20;

  // 10-field overlap
  if (q.material && row.material) {
    const rowMat = String(row.material).toLowerCase();
    const qMat = q.material.toLowerCase();
    if (rowMat === qMat) score += 15;
    else if (rowMat.includes(qMat) || qMat.includes(rowMat)) score += 8;
  }
  if (q.productForm && row.product_form === q.productForm) score += 10;
  if (q.intendedUse && row.intended_use === q.intendedUse) score += 5;

  // Confidence from pipeline
  score += ((row.confidence_score as number) ?? 0) * 10;

  // Status bonus/penalty
  if (row.status === 'active') score += 5;
  else if (row.status === 'expired') score -= 5;
  else if (row.status === 'revoked') score -= 100;

  return Math.round(score * 100) / 100;
}

export async function lookupRulings(q: RulingQuery): Promise<RulingMatch[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const hs6 = q.hs6 || (q.hsCode ? q.hsCode.slice(0, 6) : null);
  if (!hs6) return [];

  try {
    let query = sb
      .from('customs_rulings')
      .select('id,ruling_id,source,issuing_country,jurisdiction,hs6,hs_code,product_name,material,product_form,intended_use,conditional_rules,duty_rate_ad_valorem,confidence_score,ruling_date,status')
      .eq('hs6', hs6)
      .neq('status', 'revoked')
      .limit(50);

    if (q.jurisdiction) {
      query = query.eq('jurisdiction', q.jurisdiction);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return [];

    const scored: RulingMatch[] = data.map(row => ({
      id: row.id,
      rulingId: row.ruling_id,
      source: row.source,
      issuingCountry: row.issuing_country,
      jurisdiction: row.jurisdiction,
      hsCode: row.hs_code,
      hs6: row.hs6,
      productName: row.product_name,
      material: row.material,
      productForm: row.product_form,
      intendedUse: row.intended_use,
      conditionalRules: row.conditional_rules,
      dutyRateAdValorem: row.duty_rate_ad_valorem,
      confidenceScore: row.confidence_score ?? 0,
      rulingDate: row.ruling_date,
      status: row.status,
      matchScore: computeMatchScore(row, q),
    }));

    return scored
      .filter(r => r.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, q.limit ?? 5);
  } catch {
    return [];
  }
}

// ─── CW36-CN1: Data availability for jurisdictions without rulings ───

/** Jurisdictions with rulings data in customs_rulings table */
const COVERED_JURISDICTIONS = new Set(['EU', 'US']);

export interface DataAvailability {
  jurisdiction: string;
  status: 'has_rulings_data' | 'no_rulings_data';
  warning?: string;
}

/**
 * Check if a jurisdiction has rulings data.
 * Returns warning for CN, JP, KR, AU, etc. where we have 0 rulings.
 */
export function checkDataAvailability(jurisdiction: string | null | undefined): DataAvailability | undefined {
  if (!jurisdiction) return undefined;
  if (COVERED_JURISDICTIONS.has(jurisdiction)) return undefined; // has data, no warning
  return {
    jurisdiction,
    status: 'no_rulings_data',
    warning: `POTAL does not currently have customs rulings data for ${jurisdiction} imports. Calculation uses general tariff schedules only. Manual review recommended for ${jurisdiction}-bound shipments.`,
  };
}

/**
 * Quick count of rulings matching an HS6 code.
 * Used for classification confidence boost.
 */
export async function countRulingsForHs6(hs6: string, jurisdiction?: string): Promise<number> {
  const sb = getSupabase();
  if (!sb || !hs6) return 0;
  try {
    let query = sb.from('customs_rulings').select('*', { count: 'exact', head: true }).eq('hs6', hs6);
    if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}
