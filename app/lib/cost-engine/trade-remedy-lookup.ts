/**
 * POTAL Trade Remedy Lookup (v2 — Firm-specific matching)
 *
 * Queries trade_remedy_cases + trade_remedy_duties + trade_remedy_products
 * to find applicable AD (Anti-Dumping), CVD (Countervailing Duty),
 * and Safeguard measures for a given HS code + origin + destination.
 *
 * v2 improvements:
 * - Firm-specific AD/CVD duty matching (exact company → "All Others" fallback)
 * - Safeguard exemption checking via safeguard_exemptions table
 * - HS code hierarchical matching (6 → 4 → 2 digit prefix)
 * - Separate AD + CVD rates (cumulative when both apply)
 * - Detailed measure breakdown with firm info
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
  /** Firm name that matched (if firm-specific) */
  firmName?: string;
  /** How the firm was matched */
  matchType?: 'exact' | 'fuzzy' | 'all_others' | 'country_wide';
  /** Fuzzy match score (0-1, only for fuzzy matches) */
  matchScore?: number;
  /** Measure type: AVD (ad valorem), SD (specific duty), PU (price undertaking) */
  measureType?: string;
}

// Extended options for firm-specific lookup
export interface TradeRemedyLookupOptions {
  /** Exporter/manufacturer company name for firm-specific AD/CVD matching */
  firmName?: string;
}

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Firm Name Matching ───────────────────────────

/**
 * Normalize firm name for matching (remove punctuation, case, common suffixes).
 */
function normalizeFirmName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[.,\-()'"]/g, ' ')
    .replace(/\b(CO|LTD|LLC|INC|CORP|CORPORATION|COMPANY|LIMITED|PLC|SA|AG|GMBH|SRL|BV|NV)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a duty entry represents the "All Others" / catch-all rate.
 * TTBD data often uses variations of "All Others" for the residual rate.
 */
function isAllOthersEntry(firmName: string | null): boolean {
  if (!firmName) return true; // null firm = country-wide rate
  const norm = firmName.toUpperCase().trim();
  return (
    norm === 'ALL OTHERS' ||
    norm === 'ALL OTHER' ||
    norm === 'ALL OTHER COMPANIES' ||
    norm === 'ALL OTHER EXPORTERS' ||
    norm === 'ALL OTHER MANUFACTURERS' ||
    norm === 'ALL OTHER PRODUCERS' ||
    norm === 'RESIDUAL' ||
    norm === 'COUNTRY-WIDE' ||
    norm === 'COUNTRYWIDE' ||
    norm === 'ALL OTHERS RATE' ||
    norm.includes('ALL OTHER') ||
    norm.includes('RESIDUAL RATE') ||
    norm.includes('COUNTRY-WIDE')
  );
}

/**
 * Calculate fuzzy match score between query firm name and DB firm name.
 * Returns 0-1 (1 = exact match).
 */
function firmMatchScore(query: string, dbFirm: string): number {
  const nq = normalizeFirmName(query);
  const nd = normalizeFirmName(dbFirm);

  if (!nq || !nd) return 0;
  if (nq === nd) return 1.0;

  // One contains the other
  if (nd.includes(nq) || nq.includes(nd)) return 0.85;

  // Token overlap
  const qTokens = nq.split(/\s+/).filter(t => t.length > 1);
  const dTokens = nd.split(/\s+/).filter(t => t.length > 1);
  if (qTokens.length === 0 || dTokens.length === 0) return 0;

  let matched = 0;
  for (const qt of qTokens) {
    for (const dt of dTokens) {
      if (qt === dt) { matched++; break; }
    }
  }

  return matched / Math.max(qTokens.length, dTokens.length);
}

// ─── Main Lookup ───────────────────────────────────

/**
 * Look up applicable trade remedies (AD/CVD/Safeguard) for a product.
 *
 * @param destinationCountry  Imposing country ISO2
 * @param originCountry       Exporter country ISO2
 * @param hsCode              HS code (6+ digits)
 * @param options             Optional firm-specific matching options
 * @returns TradeRemedyResult with applicable measures
 */
export async function lookupTradeRemedies(
  destinationCountry: string,
  originCountry: string,
  hsCode: string,
  options?: TradeRemedyLookupOptions,
): Promise<TradeRemedyResult> {
  const empty: TradeRemedyResult = { totalRemedyRate: 0, measures: [], hasRemedies: false };

  const supabase = getSupabase();
  if (!supabase) return empty;

  const dest = destinationCountry.toUpperCase();
  const origin = originCountry.toUpperCase();
  const hsClean = hsCode.replace(/\./g, '').trim();
  const hs6 = hsClean.substring(0, 6);
  const hs4 = hsClean.substring(0, 4);

  try {
    // Step 1: Find matching products — hierarchical HS prefix (6 → 4 digit)
    const productResult: any = await supabase
      .from('trade_remedy_products' as any)
      .select('case_id, hs_code, hs_digits')
      .or(`hs_code.eq.${hs6},hs_code.like.${hs4}%`)
      .limit(100);

    if (productResult.error || !productResult.data || productResult.data.length === 0) {
      return empty;
    }

    // Prioritize exact HS6 matches over HS4 prefix matches
    const products = productResult.data as any[];
    const exactHs6CaseIds = new Set<number>();
    const prefixCaseIds = new Set<number>();

    for (const p of products) {
      const pHs = (p.hs_code || '').replace(/\./g, '');
      if (pHs === hs6) {
        exactHs6CaseIds.add(p.case_id);
      } else {
        prefixCaseIds.add(p.case_id);
      }
    }

    // Use exact matches if available, otherwise fall back to prefix
    const caseIds = exactHs6CaseIds.size > 0
      ? [...exactHs6CaseIds]
      : [...new Set([...exactHs6CaseIds, ...prefixCaseIds])];

    // Step 2: Get active cases matching imposing/affected country
    const caseResult: any = await supabase
      .from('trade_remedy_cases' as any)
      .select('id, case_id, case_type, title, imposing_country, affected_country, status, measure_type')
      .in('id', caseIds)
      .eq('imposing_country', dest)
      .eq('affected_country', origin)
      .in('status', ['active', 'in_force', 'preliminary']);

    if (caseResult.error || !caseResult.data || caseResult.data.length === 0) {
      return empty;
    }

    const activeCases = caseResult.data as any[];
    const activeCaseIds = activeCases.map(c => c.id);

    // Step 3: Check safeguard exemptions (SG cases only)
    const sgCases = activeCases.filter(c =>
      c.case_type === 'SG' || c.case_type === 'safeguard'
    );
    const exemptSgCaseIds = new Set<number>();

    if (sgCases.length > 0) {
      const sgIds = sgCases.map(c => c.id);
      const exemptResult: any = await supabase
        .from('safeguard_exemptions' as any)
        .select('case_id')
        .in('case_id', sgIds)
        .eq('exempt_country', origin);

      if (exemptResult.data) {
        for (const e of exemptResult.data as any[]) {
          exemptSgCaseIds.add(e.case_id);
        }
      }
    }

    // Step 4: Get ALL duty rates for active cases (for firm-specific matching)
    const dutyResult: any = await supabase
      .from('trade_remedy_duties' as any)
      .select('case_id, firm_name, target_country, duty_rate, duty_type, measure_type, margin')
      .in('case_id', activeCaseIds)
      .limit(500);

    // Step 5: Build measures with firm-specific logic
    const measures: TradeRemedyMeasure[] = [];

    for (const c of activeCases) {
      const remedyType: RemedyType =
        c.case_type === 'AD' || c.case_type === 'anti-dumping' ? 'AD' :
        c.case_type === 'CVD' || c.case_type === 'countervailing' ? 'CVD' : 'SG';

      // Skip exempted safeguard cases
      if (remedyType === 'SG' && exemptSgCaseIds.has(c.id)) {
        continue;
      }

      // Get all duties for this case
      const caseDuties = dutyResult.data
        ? (dutyResult.data as any[]).filter(d => d.case_id === c.id)
        : [];

      if (caseDuties.length === 0) {
        // No duty data — skip (case exists but no rate assigned)
        continue;
      }

      // Firm-specific matching logic
      const { rate, firmName: matchedFirm, matchType, matchScore, measureType } = await resolveFirmDuty(
        caseDuties,
        origin,
        options?.firmName,
      );

      if (rate <= 0) continue;

      measures.push({
        type: remedyType,
        caseId: c.id,
        dutyRate: rate / 100, // Convert percentage to decimal
        title: c.title || `${remedyType} measure`,
        imposingCountry: c.imposing_country,
        affectedCountry: c.affected_country,
        isActive: true,
        firmName: matchedFirm,
        matchType,
        matchScore,
        measureType: measureType || c.measure_type,
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

// ─── Firm Duty Resolution ─────────────────────────

interface ResolvedDuty {
  rate: number;        // duty_rate (percentage, e.g. 25.5)
  firmName: string | undefined;
  matchType: 'exact' | 'fuzzy' | 'all_others' | 'country_wide';
  matchScore?: number;
  measureType: string | undefined;
}

/**
 * Resolve the applicable duty rate from a list of firm-specific duties.
 *
 * Priority:
 * 1. Exact firm name match (if firmName provided)
 * 2. Fuzzy firm name match (score >= 0.7)
 * 3. "All Others" / residual rate
 * 4. Country-wide rate (target_country match, no firm)
 * 5. Highest available rate (conservative fallback)
 */
async function resolveFirmDuty(
  duties: any[],
  originCountry: string,
  queryFirmName?: string,
): Promise<ResolvedDuty> {
  if (duties.length === 0) {
    return { rate: 0, firmName: undefined, matchType: 'country_wide', measureType: undefined };
  }

  // Filter by target country if available
  const countryDuties = duties.filter(d => {
    if (!d.target_country) return true; // null = applies to all
    return d.target_country.toUpperCase() === originCountry;
  });

  const relevantDuties = countryDuties.length > 0 ? countryDuties : duties;

  // 1. Exact / fuzzy firm match (if query firm provided)
  if (queryFirmName && queryFirmName.trim()) {
    let bestMatch: { duty: any; score: number } | null = null;

    for (const d of relevantDuties) {
      if (!d.firm_name || isAllOthersEntry(d.firm_name)) continue;
      const score = firmMatchScore(queryFirmName, d.firm_name);
      if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { duty: d, score };
      }
    }

    if (bestMatch) {
      return {
        rate: parseFloat(bestMatch.duty.duty_rate) || 0,
        firmName: bestMatch.duty.firm_name,
        matchType: bestMatch.score >= 0.95 ? 'exact' : 'fuzzy',
        matchScore: Math.round(bestMatch.score * 100) / 100,
        measureType: bestMatch.duty.measure_type,
      };
    }
  }

  // 1b. pg_trgm server-side fuzzy search (if in-code matching failed)
  if (queryFirmName && queryFirmName.trim() && relevantDuties.some(d => d.firm_name && !isAllOthersEntry(d.firm_name))) {
    const trgmResult = await searchFirmByTrgm(
      queryFirmName,
      relevantDuties.filter(d => d.firm_name && !isAllOthersEntry(d.firm_name)).map(d => d.case_id),
    );
    if (trgmResult) {
      const matchedDuty = relevantDuties.find(d =>
        d.firm_name && normalizeFirmName(d.firm_name) === normalizeFirmName(trgmResult.firmName)
      );
      if (matchedDuty) {
        return {
          rate: parseFloat(matchedDuty.duty_rate) || 0,
          firmName: matchedDuty.firm_name,
          matchType: trgmResult.similarity >= 0.95 ? 'exact' : 'fuzzy',
          matchScore: trgmResult.similarity,
          measureType: matchedDuty.measure_type,
        };
      }
    }
  }

  // 2. "All Others" rate
  const allOthers = relevantDuties.filter(d => isAllOthersEntry(d.firm_name));
  if (allOthers.length > 0) {
    // Use highest "All Others" rate (conservative)
    const highest = allOthers.reduce((max, d) => {
      const r = parseFloat(d.duty_rate) || 0;
      return r > max.rate ? { rate: r, duty: d } : max;
    }, { rate: 0, duty: allOthers[0] });

    if (highest.rate > 0) {
      return {
        rate: highest.rate,
        firmName: 'All Others',
        matchType: 'all_others',
        measureType: highest.duty.measure_type,
      };
    }
  }

  // 3. Country-wide fallback — use highest rate (conservative for compliance)
  const highest = relevantDuties.reduce((max, d) => {
    const r = parseFloat(d.duty_rate) || 0;
    return r > max.rate ? { rate: r, duty: d } : max;
  }, { rate: 0, duty: relevantDuties[0] });

  return {
    rate: highest.rate,
    firmName: highest.duty.firm_name || undefined,
    matchType: 'country_wide',
    measureType: highest.duty.measure_type,
  };
}

// ─── pg_trgm Server-Side Fuzzy Search ────────────

/**
 * Search for a firm name in trade_remedy_duties using pg_trgm similarity.
 * Falls back gracefully if the pg_trgm extension or function is unavailable.
 */
async function searchFirmByTrgm(
  queryFirmName: string,
  caseIds: (string | number)[],
): Promise<{ firmName: string; similarity: number } | null> {
  if (caseIds.length === 0) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const result: any = await supabase.rpc('search_firm_trgm' as any, {
      query_name: queryFirmName,
      case_ids: caseIds,
      min_similarity: 0.3,
    });

    if (result.error || !result.data || (result.data as any[]).length === 0) {
      return null;
    }

    const best = (result.data as any[])[0];
    return {
      firmName: best.firm_name,
      similarity: parseFloat(best.similarity) || 0,
    };
  } catch {
    return null;
  }
}
