/**
 * POTAL API v1 — /api/v1/ioss/check
 * IOSS/VRN eligibility check for EU and UK
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { convertCurrency } from '@/app/lib/cost-engine/exchange-rate/exchange-rate-service';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const EU_MEMBERS = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
const IOSS_THRESHOLD_EUR = 150;
const UK_VRN_THRESHOLD_GBP = 135;

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase().trim() : '';
  const declaredValue = typeof body.declared_value === 'number' ? body.declared_value : 0;
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'EUR';

  if (!destination || destination.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'destination must be a 2-letter ISO code.');
  if (declaredValue <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'declared_value must be > 0.');

  // Convert to EUR using real exchange rates (not hardcoded)
  let valueEur = declaredValue;
  let exchangeRate = 1;
  if (currency !== 'EUR') {
    try {
      const conversion = await convertCurrency(declaredValue, currency, 'EUR');
      valueEur = conversion.convertedAmount;
      exchangeRate = conversion.rate;
    } catch {
      // Fallback approximation if exchange rate service unavailable
      const fallbackRates: Record<string, number> = { USD: 0.92, GBP: 1.17, JPY: 0.006, CNY: 0.13, KRW: 0.00069 };
      exchangeRate = fallbackRates[currency] || 1;
      valueEur = declaredValue * exchangeRate;
    }
  }

  // EU destination — IOSS check
  if (EU_MEMBERS.has(destination)) {
    let vatRate = 0.21; // default
    try {
      const sb = getSupabase();
      const { data } = await (sb.from('vat_gst_rates') as any).select('rate, vat_rate').eq('country_code', destination).single();
      if (data) {
        const parsed = parseFloat(data.rate || data.vat_rate || '0');
        vatRate = parsed > 1 ? parsed / 100 : parsed; // Normalize: 21 → 0.21
      }
    } catch { /* use default */ }

    if (valueEur <= IOSS_THRESHOLD_EUR) {
      const vatAmount = Math.round(declaredValue * vatRate * 100) / 100;
      return apiSuccess({
        ioss_eligible: true,
        ioss_vat_rate: vatRate,
        vat_amount: vatAmount,
        total_with_ioss: Math.round((declaredValue + vatAmount) * 100) / 100,
        duty_exempt: true,
        exchange_rate: { from: currency, to: 'EUR', rate: exchangeRate, value_eur: Math.round(valueEur * 100) / 100 },
        note: 'IOSS: Seller collects VAT at point of sale. No import VAT or customs duties at destination.',
        destination, declared_value: declaredValue, currency,
      }, { sellerId: ctx.sellerId });
    } else {
      return apiSuccess({
        ioss_eligible: false,
        reason: `Value €${valueEur.toFixed(2)} exceeds €${IOSS_THRESHOLD_EUR} IOSS threshold.`,
        alternative: 'Standard import VAT at customs. Buyer pays import VAT + any applicable customs duty.',
        vat_rate: vatRate,
        exchange_rate: { from: currency, to: 'EUR', rate: exchangeRate, value_eur: Math.round(valueEur * 100) / 100 },
        destination, declared_value: declaredValue, currency,
      }, { sellerId: ctx.sellerId });
    }
  }

  // UK destination — VRN check
  if (destination === 'GB') {
    let valueGbp = declaredValue;
    let gbpRate = 1;
    if (currency !== 'GBP') {
      try {
        const conversion = await convertCurrency(declaredValue, currency, 'GBP');
        valueGbp = conversion.convertedAmount;
        gbpRate = conversion.rate;
      } catch {
        const fallback: Record<string, number> = { USD: 0.79, EUR: 0.86 };
        gbpRate = fallback[currency] || 1;
        valueGbp = declaredValue * gbpRate;
      }
    }

    const ukVatRate = 0.20;
    if (valueGbp <= UK_VRN_THRESHOLD_GBP) {
      const vatAmount = Math.round(declaredValue * ukVatRate * 100) / 100;
      return apiSuccess({
        vrn_applicable: true,
        uk_vat_rate: ukVatRate,
        vat_amount: vatAmount,
        total_with_vat: Math.round((declaredValue + vatAmount) * 100) / 100,
        exchange_rate: { from: currency, to: 'GBP', rate: gbpRate, value_gbp: Math.round(valueGbp * 100) / 100 },
        note: 'UK: Seller must register for UK VAT and collect 20% VAT at point of sale for goods ≤£135.',
        destination, declared_value: declaredValue, currency,
      }, { sellerId: ctx.sellerId });
    } else {
      return apiSuccess({
        vrn_applicable: false,
        reason: `Value £${valueGbp.toFixed(2)} exceeds £${UK_VRN_THRESHOLD_GBP}. Standard import procedure applies.`,
        uk_vat_rate: ukVatRate,
        note: 'Buyer pays import VAT (20%) + customs duty at border.',
        destination, declared_value: declaredValue, currency,
      }, { sellerId: ctx.sellerId });
    }
  }

  return apiSuccess({
    ioss_eligible: false, vrn_applicable: false,
    note: `IOSS/VRN not applicable for destination ${destination}. These schemes apply only to EU and UK.`,
    destination, declared_value: declaredValue,
  }, { sellerId: ctx.sellerId });
});
