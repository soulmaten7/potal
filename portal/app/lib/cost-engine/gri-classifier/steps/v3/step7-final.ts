/**
 * v3 Step 6: Final Resolution — 최종 HS code 조합 + macmap 세율 조회
 * HS6 + Country Result + Price Break → final_hs_code
 * + lookupDutyRate() → macmap_ntlc_rates에서 MFN 세율
 * AI 호출: 0회
 */

import type { CountryAgentResult } from '../../types';
import { lookupDutyRate } from './duty-rate-lookup';

export interface FinalResolveOutput {
  final_hs_code: string;
  hs_code_precision: 'HS10' | 'HS8' | 'HS6';
  final_description: string;
  confidence: number;
  country_specific: {
    country: string;
    national_code: string;
    duty_rate?: number;
    additional_duties?: string[];
    method: string;
  } | null;
  price_break_applied: boolean;
  ai_call_count: number;
  processing_time_ms: number;
}

export async function finalResolveV3(params: {
  hs6: string;
  hs6_description: string;
  confidence: number;
  country_result: CountryAgentResult | null;
  price_break_applied: boolean;
  price_break_code?: string;
  price_break_duty?: number;
  ai_call_count: number;
  start_time: number;
  destination_country?: string;
}): Promise<FinalResolveOutput> {
  const processingTimeMs = Date.now() - params.start_time;

  let finalCode = params.hs6;
  let precision: 'HS10' | 'HS8' | 'HS6' = 'HS6';
  let finalDescription = params.hs6_description;
  let dutyRate: number | undefined;

  // 1. Country Agent result (7~10 digit)
  if (params.country_result) {
    finalCode = params.country_result.nationalCode;
    finalDescription = params.country_result.description || params.hs6_description;
    const len = finalCode.replace(/\./g, '').length;
    if (len >= 10) precision = 'HS10';
    else if (len >= 8) precision = 'HS8';
  }

  // 2. Price Break overrides country code (more specific)
  if (params.price_break_applied && params.price_break_code) {
    finalCode = params.price_break_code;
    if (params.price_break_duty !== undefined) dutyRate = params.price_break_duty;
    const len = finalCode.replace(/\./g, '').length;
    if (len >= 10) precision = 'HS10';
    else if (len >= 8) precision = 'HS8';
  }

  // 3. Duty rate lookup from macmap (if not already set by price break)
  if (dutyRate === undefined && params.destination_country) {
    const lookup = await lookupDutyRate(finalCode, params.destination_country);
    if (lookup) {
      dutyRate = lookup.duty_rate_pct;
    }
  }

  const finalConfidence = params.country_result
    ? Math.min(params.confidence, params.country_result.confidence)
    : params.confidence;

  return {
    final_hs_code: finalCode,
    hs_code_precision: precision,
    final_description: finalDescription,
    confidence: finalConfidence,
    country_specific: params.destination_country ? {
      country: params.country_result?.nationalCode && params.country_result.nationalCode.length > 6 ? 'determined' : 'default',
      national_code: params.country_result?.nationalCode || finalCode,
      duty_rate: dutyRate,
      additional_duties: params.country_result?.additionalDuties,
      method: params.country_result?.method || 'hs6_only',
    } : null,
    price_break_applied: params.price_break_applied,
    ai_call_count: params.ai_call_count + (params.country_result?.aiCallCount || 0),
    processing_time_ms: processingTimeMs,
  };
}
