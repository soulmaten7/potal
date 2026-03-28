/**
 * GET/POST /api/v1/trade-remedies — Trade remedy lookup (AD/CVD/Safeguard)
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.replace(/[^0-9]/g, '') : '';
  const origin = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase() : '';
  const dest = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';

  if (!hsCode) return apiError(ApiErrorCode.BAD_REQUEST, '"hsCode" required.');

  const supabase = getSupabase();
  if (!supabase) return apiSuccess({ remedies: [], total: 0, note: 'DB unavailable' }, { sellerId: ctx.sellerId });

  try {
    let query = supabase
      .from('trade_remedy_cases')
      .select('id, case_number, title, type, imposing_country, affected_country, hs_codes, status, duty_rate, effective_date')
      .limit(20);

    if (dest) query = query.eq('imposing_country', dest);
    if (origin) query = query.eq('affected_country', origin);

    const { data, error } = await query;
    if (error) throw error;

    // Filter by HS code overlap
    const hs4 = hsCode.substring(0, 4);
    const matches = (data || []).filter((r: Record<string, unknown>) => {
      const codes = r.hs_codes;
      if (!codes) return false;
      if (typeof codes === 'string') return codes.includes(hs4);
      if (Array.isArray(codes)) return codes.some((c: unknown) => String(c).startsWith(hs4));
      return false;
    });

    return apiSuccess({
      hsCode,
      originCountry: origin || null,
      destinationCountry: dest || null,
      hasRemedies: matches.length > 0,
      remedies: matches.map((r: Record<string, unknown>) => ({
        caseNumber: r.case_number,
        title: r.title,
        type: r.type,
        imposingCountry: r.imposing_country,
        affectedCountry: r.affected_country,
        status: r.status,
        dutyRate: r.duty_rate,
        effectiveDate: r.effective_date,
      })),
      total: matches.length,
      subRoutes: {
        ad: 'POST /api/v1/trade-remedies/ad — Anti-dumping cases',
        cvd: 'POST /api/v1/trade-remedies/cvd — Countervailing duty cases',
        safeguard: 'POST /api/v1/trade-remedies/safeguard — Safeguard measures',
        calculate: 'POST /api/v1/trade-remedies/calculate — Calculate remedy duty amount',
      },
    }, { sellerId: ctx.sellerId, plan: ctx.planId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Trade remedy lookup failed.');
  }
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { hsCode, originCountry?, destinationCountry? }');
}
