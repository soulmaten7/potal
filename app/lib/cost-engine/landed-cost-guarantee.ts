/**
 * F026: Landed Cost Guarantee System
 *
 * Provides accuracy guarantees on calculated landed costs.
 * Three tiers based on data quality and plan level:
 * - Standard: ±10% accuracy guarantee
 * - Premium: ±5% accuracy guarantee
 * - Enterprise: ±2% accuracy guarantee
 *
 * Guarantee conditions and claim tracking.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────

export type GuaranteeTier = 'standard' | 'premium' | 'enterprise';
export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'denied';

export interface LandedCostGuarantee {
  /** Guarantee tier based on plan + data quality */
  tier: GuaranteeTier;
  /** Maximum coverage percentage (e.g. 10 = ±10%) */
  coveragePercentage: number;
  /** Maximum claim amount in USD */
  maxClaimAmount: number;
  /** Guarantee valid until (ISO 8601) */
  validUntil: string;
  /** Conditions under which guarantee applies */
  conditions: string[];
  /** Conditions that void the guarantee */
  exclusions: string[];
  /** Whether this calculation qualifies for guarantee */
  eligible: boolean;
  /** Reason if not eligible */
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

// ─── Constants ──────────────────────────────────────

const TIER_CONFIG: Record<GuaranteeTier, { coverage: number; maxClaim: number; validDays: number }> = {
  standard: { coverage: 10, maxClaim: 500, validDays: 30 },
  premium: { coverage: 5, maxClaim: 2000, validDays: 60 },
  enterprise: { coverage: 2, maxClaim: 10000, validDays: 90 },
};

const PLAN_TO_TIER: Record<string, GuaranteeTier> = {
  free: 'standard',
  basic: 'standard',
  pro: 'premium',
  enterprise: 'enterprise',
};

/** Conditions under which the guarantee applies */
const GUARANTEE_CONDITIONS: string[] = [
  'Product classified with ≥80% confidence score',
  'Origin and destination countries are valid ISO codes',
  'Declared value matches actual transaction value',
  'HS code was determined by POTAL (not manually overridden)',
  'Claim submitted within guarantee validity period',
  'Calculation performed with current tariff data (not stale)',
];

/** Conditions that void the guarantee */
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
 * Determine the guarantee tier and eligibility for a given calculation.
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

  // Check eligibility
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
  const validUntil = new Date(Date.now() + config.validDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    tier,
    coveragePercentage: config.coverage,
    maxClaimAmount: config.maxClaim,
    validUntil,
    conditions: GUARANTEE_CONDITIONS,
    exclusions: GUARANTEE_EXCLUSIONS,
    eligible,
    ineligibleReason: eligible ? undefined : issues.join('; '),
  };
}

// ─── Claim Management ───────────────────────────────

/**
 * Submit a guarantee claim.
 */
export async function submitClaim(params: {
  sellerId: string;
  calculationId: string;
  calculatedAmount: number;
  actualAmount: number;
  tier: GuaranteeTier;
}): Promise<GuaranteeClaim | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database not available' };

  // Validate claim
  if (params.calculatedAmount <= 0 || params.actualAmount <= 0) {
    return { error: 'Calculated and actual amounts must be positive' };
  }

  const diff = Math.abs(params.actualAmount - params.calculatedAmount);
  const diffPercent = (diff / params.calculatedAmount) * 100;
  const config = TIER_CONFIG[params.tier];

  if (diffPercent <= config.coverage) {
    return { error: `Difference of ${diffPercent.toFixed(1)}% is within ±${config.coverage}% guarantee coverage. No claim needed.` };
  }

  if (diff > config.maxClaim) {
    return { error: `Claim amount $${diff.toFixed(2)} exceeds maximum of $${config.maxClaim}` };
  }

  try {
    const claim: Omit<GuaranteeClaim, 'id'> = {
      sellerId: params.sellerId,
      calculationId: params.calculationId,
      calculatedAmount: params.calculatedAmount,
      actualAmount: params.actualAmount,
      differenceAmount: diff,
      differencePercent: Math.round(diffPercent * 100) / 100,
      tier: params.tier,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    // Store claim in health_check_logs as a structured event
    const { error } = await (supabase.from('health_check_logs') as any).insert({
      overall_status: 'yellow',
      checks: [{
        name: 'guarantee_claim',
        claim_status: claim.status,
        seller_id: claim.sellerId,
        calculated: claim.calculatedAmount,
        actual: claim.actualAmount,
        difference: claim.differenceAmount,
        tier: claim.tier,
      }],
      duration_ms: 0,
    });

    if (error) return { error: `Failed to submit claim: ${error.message}` };

    return { ...claim, id: `claim_${Date.now()}` } as GuaranteeClaim;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Claim submission failed' };
  }
}
