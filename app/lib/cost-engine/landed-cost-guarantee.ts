/**
 * F026: Landed Cost Guarantee System
 *
 * Provides accuracy guarantees on calculated landed costs.
 * Tier system based on plan level:
 * - Standard (Free/Basic): ±10% coverage, $500 max claim, 30-day validity
 * - Premium (Pro): ±5% coverage, $5,000 max claim, 60-day validity
 * - Enterprise: ±2% coverage, $50,000 max claim, 90-day validity
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────

export type GuaranteeTier = 'standard' | 'premium' | 'enterprise';
export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'denied';

export interface LandedCostGuarantee {
  tier: GuaranteeTier;
  coveragePercentage: number;
  maxClaimAmount: number;
  validDays: number;
  validUntil: string;
  conditions: string[];
  exclusions: string[];
  eligible: boolean;
  ineligibleReason?: string;
}

export interface GuaranteeClaim {
  id: string;
  sellerId: string;
  calculationId: string;
  calculatedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  differencePercent: number;
  tier: GuaranteeTier;
  status: ClaimStatus;
  submittedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

// ─── Tier Configuration (single source of truth) ────

export const TIER_CONFIG: Record<GuaranteeTier, {
  coverage: number;
  maxClaim: number;
  validDays: number;
}> = {
  standard:   { coverage: 10,  maxClaim: 500,   validDays: 30 },
  premium:    { coverage: 5,   maxClaim: 5000,  validDays: 60 },
  enterprise: { coverage: 2,   maxClaim: 50000, validDays: 90 },
};

export const PLAN_TO_TIER: Record<string, GuaranteeTier> = {
  free: 'standard',
  basic: 'standard',
  pro: 'premium',
  enterprise: 'enterprise',
};

const GUARANTEE_CONDITIONS: string[] = [
  'Product classified with ≥80% confidence score',
  'Origin and destination countries are valid ISO codes',
  'Declared value matches actual transaction value',
  'HS code was determined by POTAL (not manually overridden)',
  'Claim submitted within guarantee validity period',
  'Calculation performed with current tariff data (not stale)',
];

const GUARANTEE_EXCLUSIONS: string[] = [
  'Manual HS code override by seller',
  'Products under trade remedies (AD/CVD)',
  'Sanctions-restricted destinations',
  'Goods subject to quota or licensing requirements',
  'Duty rate changes between calculation and import date',
  'Incorrect product description provided by seller',
  'De minimis threshold changes by destination country',
];

// ─── Supabase ───────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Guarantee Assessment ───────────────────────────

/**
 * Assess guarantee eligibility for a landed cost calculation.
 */
export function assessGuarantee(params: {
  planId: string;
  confidenceScore: number;
  dataQuality: 'fresh' | 'stale' | 'fallback';
  dutyRateSource: string;
  hsCodeSource: string;
  hasTradeRemedies: boolean;
  isSanctioned: boolean;
}): LandedCostGuarantee {
  const tier = PLAN_TO_TIER[params.planId] || 'standard';
  const config = TIER_CONFIG[tier];

  const issues: string[] = [];

  if (params.confidenceScore < 0.8) {
    issues.push(`Confidence score ${(params.confidenceScore * 100).toFixed(0)}% is below 80% threshold`);
  }
  if (params.dataQuality === 'fallback') {
    issues.push('Calculation used fallback/estimated duty rates');
  }
  if (params.dataQuality === 'stale') {
    issues.push('Tariff data may be outdated');
  }
  if (params.hsCodeSource === 'manual') {
    issues.push('HS code was manually overridden (not POTAL-classified)');
  }
  if (params.hasTradeRemedies) {
    issues.push('Product is subject to trade remedies (AD/CVD)');
  }
  if (params.isSanctioned) {
    issues.push('Destination is sanctions-restricted');
  }

  const eligible = issues.length === 0;

  return {
    tier,
    coveragePercentage: config.coverage,
    maxClaimAmount: config.maxClaim,
    validDays: config.validDays,
    validUntil: new Date(Date.now() + config.validDays * 24 * 60 * 60 * 1000).toISOString(),
    conditions: GUARANTEE_CONDITIONS,
    exclusions: GUARANTEE_EXCLUSIONS,
    eligible,
    ineligibleReason: eligible ? undefined : issues.join('; '),
  };
}

// ─── Claim Management ───────────────────────────────

/**
 * Submit a guarantee claim. Validates amounts against tier coverage.
 */
export async function submitClaim(params: {
  sellerId: string;
  calculationId: string;
  calculatedAmount: number;
  actualAmount: number;
  tier: GuaranteeTier;
}): Promise<GuaranteeClaim | { error: string }> {
  if (!params.sellerId || !params.calculationId) {
    return { error: 'sellerId and calculationId are required' };
  }
  if (typeof params.calculatedAmount !== 'number' || params.calculatedAmount <= 0) {
    return { error: 'calculatedAmount must be a positive number' };
  }
  if (typeof params.actualAmount !== 'number' || params.actualAmount <= 0) {
    return { error: 'actualAmount must be a positive number' };
  }

  const config = TIER_CONFIG[params.tier];
  if (!config) {
    return { error: `Invalid tier: ${params.tier}` };
  }

  const diff = Math.abs(params.actualAmount - params.calculatedAmount);
  const diffPercent = (diff / params.calculatedAmount) * 100;

  if (diffPercent <= config.coverage) {
    return { error: `Difference of ${diffPercent.toFixed(1)}% is within ±${config.coverage}% coverage. No claim needed.` };
  }

  if (diff > config.maxClaim) {
    return { error: `Claim amount $${diff.toFixed(2)} exceeds tier maximum of $${config.maxClaim.toLocaleString()}` };
  }

  const supabase = getSupabase();
  const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const claim: GuaranteeClaim = {
    id: claimId,
    sellerId: params.sellerId,
    calculationId: params.calculationId,
    calculatedAmount: params.calculatedAmount,
    actualAmount: params.actualAmount,
    differenceAmount: Math.round(diff * 100) / 100,
    differencePercent: Math.round(diffPercent * 100) / 100,
    tier: params.tier,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };

  // Store claim in DB (fire-and-forget if DB unavailable)
  if (supabase) {
    try {
      await (supabase.from('health_check_logs') as any).insert({
        overall_status: 'yellow',
        checks: [{ name: 'guarantee_claim', ...claim }],
        duration_ms: 0,
      } as Record<string, unknown>);
    } catch {
      // Claim object still returned — DB persistence is best-effort
    }
  }

  return claim;
}

/**
 * Look up claims for a seller. Searches health_check_logs for guarantee_claim entries.
 */
export async function getClaims(sellerId: string): Promise<GuaranteeClaim[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data } = await (supabase.from('health_check_logs') as any)
      .select('checks, checked_at')
      .order('checked_at', { ascending: false })
      .limit(100) as { data: Array<{ checks: Array<Record<string, unknown>>; checked_at: string }> | null };

    if (!data) return [];

    const claims: GuaranteeClaim[] = [];
    for (const row of data) {
      const checks = row.checks as Array<Record<string, unknown>>;
      if (!Array.isArray(checks)) continue;
      for (const check of checks) {
        if (check.name === 'guarantee_claim' && check.sellerId === sellerId) {
          claims.push(check as unknown as GuaranteeClaim);
        }
      }
    }
    return claims;
  } catch {
    return [];
  }
}
