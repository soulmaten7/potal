/**
 * POTAL API v1 — /api/v1/verify/history
 * Verification log history for the authenticated seller.
 *
 * GET /api/v1/verify/history          — Last 20 verifications
 * GET /api/v1/verify/history?limit=50 — Custom limit (max 100)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(1, parseInt(limitParam || '20', 10) || 20), 100);

  const sb = getServiceClient();

  const { data, error } = await (sb.from('verification_logs') as ReturnType<ReturnType<typeof createClient>['from']>)
    .select('id, shipment_ref, hs_code, origin, destination, risk_level, risk_score, shipment_allowed, created_at')
    .eq('seller_id', context.sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch verification history.');
  }

  return apiSuccess({
    history: data || [],
    total: (data || []).length,
    limit,
  });
});
