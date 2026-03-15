import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase() : '';
  const value = typeof body.value === 'number' ? body.value : 0;
  if (!destination || value <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'destination and value required.');

  const sb = getSupabase();
  const { data } = await sb.from('de_minimis_thresholds').select('*').eq('country_code', destination).single();

  const threshold = data ? parseFloat(data.threshold_usd || data.threshold || '0') : 0;
  const currency = data?.currency || 'USD';
  const isBelowThreshold = value <= threshold;

  return apiSuccess({
    destination,
    threshold: { amount: threshold, currency },
    value, is_below_threshold: isBelowThreshold,
    duty_free: isBelowThreshold,
    vat_applies: !isBelowThreshold || destination === 'AU' || destination === 'NZ',
    notes: isBelowThreshold
      ? `Value is below ${destination} de minimis threshold of ${currency} ${threshold}. No duty applies.`
      : `Value exceeds ${destination} de minimis threshold. Duties and taxes apply.`,
  }, { sellerId: ctx.sellerId });
});
