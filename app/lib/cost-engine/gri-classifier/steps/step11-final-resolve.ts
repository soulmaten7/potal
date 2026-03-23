/**
 * Step 11: Final resolution — select the definitive HS code.
 * AI calls: 0 (usually) or 1 (if multiple indistinguishable candidates).
 */

import type { GriClassificationResult, CountryAgentResult, DecisionStep } from '../types';
import { createHash } from 'crypto';

export function finalResolve(params: {
  hs6: string;
  hs6Description: string;
  confidence: number;
  countryResult: CountryAgentResult | null;
  decisionPath: DecisionStep[];
  griRulesApplied: { rule: string; reason: string }[];
  aiCallCount: number;
  startTime: number;
  productName: string;
  alternatives?: { hsCode: string; description: string; confidence: number; rejectionReason: string }[];
}): GriClassificationResult {
  const {
    hs6, hs6Description, confidence, countryResult,
    decisionPath, griRulesApplied, aiCallCount, startTime,
    alternatives,
  } = params;

  const processingTimeMs = Date.now() - startTime;

  // Determine final code
  let finalCode = hs6;
  let precision: 'HS10' | 'HS8' | 'HS6' = 'HS6';
  let finalDescription = hs6Description;

  if (countryResult) {
    finalCode = countryResult.nationalCode;
    finalDescription = countryResult.description || hs6Description;
    if (countryResult.codePrecision >= 10) precision = 'HS10';
    else if (countryResult.codePrecision >= 8) precision = 'HS8';
  }

  return {
    hsCode: finalCode,
    hsCodePrecision: precision,
    description: finalDescription,
    confidence: countryResult ? countryResult.confidence : confidence,
    decisionPath,
    griRulesApplied,
    alternatives,
    classificationMethod: 'gri_pipeline',
    aiCallCount: aiCallCount + (countryResult?.aiCallCount || 0),
    processingTimeMs,
    countrySpecific: countryResult ? {
      country: finalCode.length > 6 ? 'determined' : 'default',
      nationalCode: countryResult.nationalCode,
      dutyRate: countryResult.dutyRate,
      additionalNotes: countryResult.additionalDuties?.join('; '),
    } : undefined,
  };
}

/**
 * Hash product name for cache key.
 */
export function hashProductName(name: string): string {
  return createHash('sha256')
    .update(name.toLowerCase().trim())
    .digest('hex')
    .substring(0, 16);
}
