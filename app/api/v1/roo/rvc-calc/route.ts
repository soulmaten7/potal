/**
 * POTAL API v1 — /api/v1/roo/rvc-calc
 *
 * Regional Value Content (RVC) Calculator.
 * Supports build-up and build-down methods.
 *
 * POST /api/v1/roo/rvc-calc
 * Body: { product_value, originating_value, non_originating_value, method, fta_code?, hs_code? }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

type RvcMethod = 'build-up' | 'build-down' | 'focused-value' | 'net-cost';

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productValue = typeof body.product_value === 'number' ? body.product_value : 0;
  const originatingValue = typeof body.originating_value === 'number' ? body.originating_value : 0;
  const nonOriginatingValue = typeof body.non_originating_value === 'number' ? body.non_originating_value : 0;
  const method = (typeof body.method === 'string' ? body.method.toLowerCase() : 'build-down') as RvcMethod;
  const ftaCode = typeof body.fta_code === 'string' ? body.fta_code.toUpperCase().trim() : undefined;
  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : undefined;

  if (productValue <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'product_value must be greater than 0.');
  }

  const validMethods: RvcMethod[] = ['build-up', 'build-down', 'focused-value', 'net-cost'];
  if (!validMethods.includes(method)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Invalid method. Use: ${validMethods.join(', ')}`);
  }

  // Calculate RVC based on method
  let rvcPercentage: number;
  let formula: string;

  switch (method) {
    case 'build-up':
      // RVC = (VOM / AV) × 100
      rvcPercentage = (originatingValue / productValue) * 100;
      formula = `(Originating Value ${originatingValue} / Product Value ${productValue}) × 100`;
      break;
    case 'build-down':
      // RVC = ((AV - VNM) / AV) × 100
      rvcPercentage = ((productValue - nonOriginatingValue) / productValue) * 100;
      formula = `((Product Value ${productValue} - Non-Originating ${nonOriginatingValue}) / Product Value ${productValue}) × 100`;
      break;
    case 'focused-value':
      // RVC = ((AV - VNM of focused materials) / AV) × 100
      rvcPercentage = ((productValue - nonOriginatingValue) / productValue) * 100;
      formula = `((Product Value ${productValue} - Focused Non-Originating ${nonOriginatingValue}) / Product Value ${productValue}) × 100`;
      break;
    case 'net-cost':
      // RVC = ((NC - VNM) / NC) × 100
      // Net cost = product value minus sales promotion, royalties, packing costs
      rvcPercentage = ((productValue - nonOriginatingValue) / productValue) * 100;
      formula = `((Net Cost ${productValue} - Non-Originating ${nonOriginatingValue}) / Net Cost ${productValue}) × 100`;
      break;
  }

  rvcPercentage = Math.round(rvcPercentage * 100) / 100;

  // Look up threshold from PSR if fta_code and hs_code provided
  let threshold: number | null = null;
  let meetsRequirement: boolean | null = null;
  let psrRule: string | null = null;

  if (ftaCode && hsCode) {
    const supabase = getSupabase();
    const hs6 = hsCode.substring(0, 6);

    try {
      const { data } = await supabase
        .from('product_specific_rules')
        .select('threshold_pct, rule_text, rule_type')
        .eq('fta_code', ftaCode)
        .eq('rule_type', 'RVC')
        .or(`hs6_code.eq.${hs6},hs6_code.like.${hsCode.substring(0, 4)}%`)
        .limit(1)
        .single();

      if (data && data.threshold_pct) {
        threshold = parseFloat(data.threshold_pct);
        meetsRequirement = rvcPercentage >= threshold;
        psrRule = data.rule_text;
      }
    } catch { /* no PSR found */ }
  }

  // Default thresholds by FTA if no PSR found
  if (threshold === null && ftaCode) {
    const DEFAULT_THRESHOLDS: Record<string, number> = {
      USMCA: 75,
      CPTPP: 45,
      RCEP: 40,
      KORUS: 55,
      'EU-UK_TCA': 50,
      CETA: 50,
    };
    threshold = DEFAULT_THRESHOLDS[ftaCode] || null;
    if (threshold) {
      meetsRequirement = rvcPercentage >= threshold;
    }
  }

  return apiSuccess({
    rvc_percentage: rvcPercentage,
    method,
    formula,
    inputs: {
      product_value: productValue,
      originating_value: originatingValue,
      non_originating_value: nonOriginatingValue,
    },
    threshold: threshold ? `${threshold}%` : null,
    threshold_pct: threshold,
    meets_requirement: meetsRequirement,
    psr_rule: psrRule,
    fta_code: ftaCode || null,
    hs_code: hsCode || null,
    recommendation: meetsRequirement === false
      ? `RVC ${rvcPercentage}% is below the ${threshold}% threshold. Increase originating content or use a different RoO criterion (e.g., CTC).`
      : meetsRequirement === true
        ? `RVC ${rvcPercentage}% meets the ${threshold}% threshold. Product qualifies for preferential treatment under ${ftaCode}.`
        : null,
  }, {
    sellerId: _context.sellerId,
    plan: _context.planId,
  });
});
