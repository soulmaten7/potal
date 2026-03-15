/**
 * POTAL API v1 — /api/v1/ioss/check
 * Enhanced IOSS/VRN eligibility check for EU and UK
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

const EU_MEMBERS = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase().trim() : '';
  const declaredValue = typeof body.declared_value === 'number' ? body.declared_value : 0;
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'EUR';

  if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, 'destination required.');
  if (declaredValue <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'declared_value must be > 0.');

  // Convert to EUR if needed (approximate)
  let valueEur = declaredValue;
  if (currency === 'USD') valueEur = declaredValue * 0.92;
  else if (currency === 'GBP') valueEur = declaredValue * 1.17;

  // EU destination
  if (EU_MEMBERS.has(destination)) {
    // Get destination VAT rate
    let vatRate = 0;
    try {
      const sb = getSupabase();
      const { data } = await sb.from('vat_gst_rates').select('rate, vat_rate').eq('country_code', destination).single();
      if (data) vatRate = parseFloat(data.rate || data.vat_rate || '0');
    } catch { /* default 0 */ }

    if (valueEur <= 150) {
      const vatAmount = Math.round(declaredValue * vatRate) / 100;
      return apiSuccess({
        ioss_eligible: true,
        ioss_vat_rate: vatRate,
        vat_amount: vatAmount,
        total_with_ioss: Math.round((declaredValue + vatAmount) * 100) / 100,
        duty_exempt: true,
        note: 'IOSS: Seller collects VAT at point of sale. No import VAT or customs duties at destination.',
        destination,
        declared_value: declaredValue,
        currency,
      }, { sellerId: _ctx.sellerId });
    } else {
      return apiSuccess({
        ioss_eligible: false,
        reason: 'Value exceeds €150 IOSS threshold.',
        alternative: 'Standard import VAT at customs. Buyer pays import VAT + any applicable customs duty.',
        vat_rate: vatRate,
        destination,
        declared_value: declaredValue,
        currency,
      }, { sellerId: _ctx.sellerId });
    }
  }

  // UK destination
  if (destination === 'GB') {
    let valueGbp = declaredValue;
    if (currency === 'EUR') valueGbp = declaredValue * 0.86;
    else if (currency === 'USD') valueGbp = declaredValue * 0.79;

    if (valueGbp <= 135) {
      const vatAmount = Math.round(declaredValue * 20) / 100;
      return apiSuccess({
        vrn_applicable: true,
        uk_vat_rate: 20,
        vat_amount: vatAmount,
        total_with_vat: Math.round((declaredValue + vatAmount) * 100) / 100,
        note: 'UK: Seller must register for UK VAT and collect 20% VAT at point of sale for goods ≤£135.',
        destination,
        declared_value: declaredValue,
        currency,
      }, { sellerId: _ctx.sellerId });
    } else {
      return apiSuccess({
        vrn_applicable: false,
        reason: 'Value exceeds £135. Standard import procedure applies.',
        uk_vat_rate: 20,
        note: 'Buyer pays import VAT (20%) + customs duty at border.',
        destination,
        declared_value: declaredValue,
        currency,
      }, { sellerId: _ctx.sellerId });
    }
  }

  return apiSuccess({
    ioss_eligible: false,
    vrn_applicable: false,
    note: `IOSS/VRN not applicable for destination ${destination}. These schemes apply only to EU and UK.`,
    destination,
    declared_value: declaredValue,
  }, { sellerId: _ctx.sellerId });
});
