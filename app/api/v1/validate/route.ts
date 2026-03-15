/**
 * POTAL API v1 — /api/v1/validate
 *
 * HS Code validation endpoint (S+ grade).
 * - HS 2022 existence check + format validation
 * - Country-specific tariff line check from gov_tariff_schedules
 * - Expired/replaced code detection
 * - Batch mode up to 100 codes
 *
 * POST /api/v1/validate
 * Body: {
 *   hsCode: string,              // required — HS code to validate
 *   hsCodes?: string[],          // batch — array of HS codes to validate
 *   country?: string,            // ISO 2-letter — check country-specific validity
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { validateHsCode } from '@/app/lib/cost-engine/hs-code/hs-validator';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

const MAX_BATCH_VALIDATE = 100;

// HS 2017→2022 major reclassified codes
const REPLACED_CODES: Record<string, { replacement: string; reason: string }> = {
  '854231': { replacement: '854232', reason: 'Reclassified in HS 2022: processors and controllers' },
  '854232': { replacement: '854233', reason: 'Reclassified in HS 2022: memories' },
  '854239': { replacement: '854239', reason: 'Reclassified in HS 2022: other ICs' },
  '847130': { replacement: '847150', reason: 'Reclassified in HS 2022: processing units' },
  '382499': { replacement: '382470', reason: 'Reclassified in HS 2022: e-waste/chemical mixtures' },
};

async function checkCountryValidity(hsCode: string, country: string) {
  const sb = getSupabase();
  const normalized = hsCode.replace(/[\s.\-]/g, '');
  const hs6 = normalized.substring(0, 6);

  // Check gov_tariff_schedules for country-specific lines
  const { data } = await sb.from('gov_tariff_schedules')
    .select('hs_code, description, duty_rate')
    .eq('country_code', country.toUpperCase())
    .like('hs_code', `${hs6}%`)
    .limit(10);

  if (!data || data.length === 0) {
    return { found: false, lines: [], note: `No tariff lines found for HS ${hs6} in ${country} schedule.` };
  }

  // Check exact match (10-digit)
  const exactMatch = normalized.length > 6
    ? data.find((d: { hs_code: string }) => d.hs_code.replace(/[\s.\-]/g, '') === normalized)
    : null;

  return {
    found: true,
    exact_match: exactMatch ? { hs_code: exactMatch.hs_code, description: exactMatch.description, duty_rate: exactMatch.duty_rate } : null,
    lines: data.map((d: { hs_code: string; description: string; duty_rate: string }) => ({
      hs_code: d.hs_code,
      description: d.description,
      duty_rate: d.duty_rate,
    })),
    note: exactMatch
      ? `Exact match found in ${country} tariff schedule.`
      : `${data.length} tariff line(s) found under HS ${hs6} in ${country}. No exact match for ${normalized}.`,
  };
}

function enrichResult(result: ReturnType<typeof validateHsCode>) {
  const normalized = result.normalizedCode;
  const replaced = REPLACED_CODES[normalized.substring(0, 6)];
  return {
    ...result,
    hs_version: 'HS 2022',
    replaced_code: replaced ? { original: normalized.substring(0, 6), ...replaced } : null,
  };
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : undefined;

  // Batch validation
  if (Array.isArray(body.hsCodes)) {
    const codes = body.hsCodes as string[];
    if (codes.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'hsCodes array must not be empty.');
    }
    if (codes.length > MAX_BATCH_VALIDATE) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_BATCH_VALIDATE} codes per batch.`);
    }

    const results = await Promise.all(codes.map(async (code, i) => {
      if (typeof code !== 'string') {
        return { index: i, hsCode: String(code), valid: false, error: 'Must be a string.' };
      }
      const result = enrichResult(validateHsCode(code));
      const countryCheck = country ? await checkCountryValidity(code, country) : undefined;
      return { index: i, hsCode: code, ...result, country_validity: countryCheck };
    }));

    const validCount = results.filter(r => 'valid' in r && r.valid).length;

    return apiSuccess(
      {
        results,
        summary: {
          total: codes.length,
          valid: validCount,
          invalid: codes.length - validCount,
        },
        country: country || null,
      },
      {
        sellerId: context.sellerId,
        plan: context.planId,
      }
    );
  }

  // Single validation
  if (!body.hsCode || typeof body.hsCode !== 'string') {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "hsCode" (string) or "hsCodes" (string[]) is required.');
  }

  const result = enrichResult(validateHsCode(body.hsCode));
  const countryCheck = country ? await checkCountryValidity(body.hsCode, country) : undefined;

  return apiSuccess({ ...result, country_validity: countryCheck }, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { hsCode: "610910", country: "US" } or { hsCodes: ["610910", "854231"], country: "US" }'
  );
}
