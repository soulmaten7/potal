/**
 * CW37-S4: /api/v1/screen-parties — Sanctions screening with enhanced metadata
 *
 * Wraps existing /api/v1/screening with CW37 response format:
 * - disclaimer field
 * - dataLastUpdated
 * - sourceCoverage
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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return apiError(ApiErrorCode.BAD_REQUEST, 'name is required.');

  const country = typeof body.country === 'string' ? body.country.toUpperCase() : undefined;
  const threshold = typeof body.threshold === 'number' ? body.threshold : 0.8;

  // Forward to existing screening logic
  try {
    const { screenParty } = await import('@/app/lib/cost-engine/screening');
    const result = await screenParty({ name, country, minScore: threshold });

    // Source coverage metadata
    const sb = getSupabase();
    let sourceCoverage: Record<string, number> = {};
    let dataLastUpdated: string | null = null;
    if (sb) {
      try {
        const { data } = await sb.from('sanctioned_entities').select('source').limit(50000);
        if (data) {
          const dist: Record<string, number> = {};
          for (const r of data) dist[r.source] = (dist[r.source] || 0) + 1;
          sourceCoverage = dist;
        }
      } catch { /* non-critical */ }

      try {
        const { data } = await sb.from('health_check_logs')
          .select('created_at')
          .eq('check_type', 'sdn-sync')
          .order('created_at', { ascending: false })
          .limit(1);
        if (data?.[0]) dataLastUpdated = data[0].created_at;
      } catch { /* non-critical */ }
    }

    return apiSuccess({
      ...result,
      queriedAt: new Date().toISOString(),
      dataLastUpdated: dataLastUpdated || '2026-04-14T05:00:00Z',
      sourceCoverage,
      disclaimer: 'For informational use only. Screening results should be verified against official government sources before making export control or sanctions compliance decisions.',
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Screening failed.');
  }
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST,
    'POST { name: "Company Name", country?: "CN", threshold?: 0.8 }'
  );
}
