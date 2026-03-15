/**
 * POTAL API v1 — /api/v1/roo/check
 *
 * Look up Product Specific Rules (PSR) for a given HS code + FTA.
 *
 * POST /api/v1/roo/check
 * Body: { hs_code, fta_code, origin }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import { getRulesOfOrigin } from '@/app/lib/cost-engine/hs-code/fta';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// Map FTA code to certification type
const CERT_TYPES: Record<string, string> = {
  USMCA: 'Self-certification (Certification of Origin)',
  CPTPP: 'Self-certification or Approved Exporter',
  'EU-UK_TCA': 'Statement on Origin (EUR.1 not required)',
  RCEP: 'Certificate of Origin (Form RCEP) or Approved Exporter',
  KORUS: 'Self-certification (Free Trade Agreement Certificate of Origin)',
  CETA: 'EUR.1 or Origin Declaration',
  'EU-KR': 'EUR.1 or Invoice Declaration',
  'EU-JP': 'Self-certification by Registered Exporter (REX)',
};

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : '';
  const ftaCode = typeof body.fta_code === 'string' ? body.fta_code.toUpperCase().trim() : '';
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase().trim() : '';

  if (!hsCode || hsCode.length < 4) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid hs_code (at least 4 digits).');
  }
  if (!ftaCode) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide fta_code (e.g. USMCA, CPTPP, RCEP).');
  }

  const supabase = getSupabase();
  const hs6 = hsCode.substring(0, 6);
  const hs4 = hsCode.substring(0, 4);

  // Query PSR table with fallback: exact HS6 → prefix match on HS4
  let psrRules: { rule_type: string; rule_text: string | null; threshold_pct: number | null; notes: string | null; hs6_code: string }[] = [];

  try {
    const { data } = await supabase
      .from('product_specific_rules')
      .select('rule_type, rule_text, threshold_pct, notes, hs6_code')
      .eq('fta_code', ftaCode)
      .or(`hs6_code.eq.${hs6},hs6_code.like.${hs4}%`)
      .order('hs6_code', { ascending: true });

    if (data && data.length > 0) {
      psrRules = data;
    }
  } catch { /* DB unavailable, try hardcoded */ }

  // Also get general RoO from hardcoded FTA definitions
  const generalRoo = origin
    ? getRulesOfOrigin(origin, '', hsCode) // destination not needed for general lookup
    : null;

  const certType = CERT_TYPES[ftaCode] || 'Certificate of Origin (contact customs authority)';

  return apiSuccess({
    fta: ftaCode,
    hs_code: hsCode,
    origin: origin || null,
    product_specific_rules: psrRules.map(r => ({
      rule_type: r.rule_type,
      rule_text: r.rule_text,
      threshold: r.threshold_pct ? `${r.threshold_pct}%` : null,
      threshold_pct: r.threshold_pct,
      notes: r.notes,
      matched_hs: r.hs6_code,
    })),
    general_roo: generalRoo ? {
      accumulationAllowed: generalRoo.accumulationAllowed,
      accumulationType: generalRoo.accumulationType,
      rules: generalRoo.rules.map(r => ({
        criterion: r.criterion,
        description: r.description,
        threshold: r.threshold,
        rvcMethod: r.rvcMethod,
      })),
    } : null,
    certification_type: certType,
    rules_found: psrRules.length,
  }, {
    sellerId: _context.sellerId,
    plan: _context.planId,
  });
});
