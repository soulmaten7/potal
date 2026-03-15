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
  const items = Array.isArray(body.items) ? body.items : [];
  if (!destination || items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'destination and items required.');

  const sb = getSupabase();
  const { data } = await sb.from('de_minimis_thresholds').select('*').eq('country_code', destination).single();
  const threshold = data ? parseFloat(data.threshold_usd || data.threshold || '0') : 0;

  const totalValue = items.reduce((s: number, i: Record<string, unknown>) => s + (typeof i.value === 'number' ? i.value : 0), 0);
  const canSplit = totalValue > threshold && items.length > 1;

  let splitSuggestion;
  if (canSplit) {
    const packages: Array<{ items: number[]; value: number; belowThreshold: boolean }> = [];
    let currentPkg: { items: number[]; value: number } = { items: [], value: 0 };
    for (let i = 0; i < items.length; i++) {
      const itemVal = typeof items[i].value === 'number' ? items[i].value : 0;
      if (currentPkg.value + itemVal > threshold && currentPkg.items.length > 0) {
        packages.push({ ...currentPkg, belowThreshold: currentPkg.value <= threshold });
        currentPkg = { items: [], value: 0 };
      }
      currentPkg.items.push(i);
      currentPkg.value += itemVal;
    }
    if (currentPkg.items.length > 0) packages.push({ ...currentPkg, belowThreshold: currentPkg.value <= threshold });
    splitSuggestion = { packages };
  }

  return apiSuccess({
    total_value: totalValue, threshold, destination,
    can_split: canSplit, split_suggestion: splitSuggestion,
    disclaimer: 'Legal advisory: consult customs broker for split shipment compliance. Intentional threshold avoidance may violate customs regulations.',
  }, { sellerId: ctx.sellerId });
});
