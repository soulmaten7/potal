import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const origin = (url.searchParams.get('origin') || '').toUpperCase();
  const destination = (url.searchParams.get('destination') || '').toUpperCase();
  const ftaId = url.searchParams.get('fta_id') || '';

  const sb = getSupabase();
  let q = sb.from('macmap_trade_agreements').select('*').limit(100);

  if (ftaId) q = q.eq('agreement_id', ftaId);
  if (origin) q = q.or(`reporter_code.eq.${origin},partner_code.eq.${origin}`);
  if (destination) q = q.or(`reporter_code.eq.${destination},partner_code.eq.${destination}`);

  const { data, error } = await q;
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, error.message);

  return apiSuccess({
    count: (data || []).length,
    ftas: (data || []).map(f => ({
      id: f.agreement_id || f.id,
      name: f.agreement_name || f.name,
      reporter: f.reporter_code,
      partner: f.partner_code,
      effective_date: f.effective_date,
      status: f.status || 'active',
    })),
  }, { sellerId: ctx.sellerId });
});
