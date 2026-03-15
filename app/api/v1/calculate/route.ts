/**
 * POTAL API v1 — /api/v1/calculate
 *
 * Single-item Total Landed Cost calculation endpoint.
 * Requires API key (pk_live_ or sk_live_).
 *
 * POST /api/v1/calculate
 * Body: {
 *   price: number | string,        // required
 *   shippingPrice?: number,         // default 0
 *   origin?: string,                // ISO code ("CN") or platform name ("AliExpress")
 *   shippingType?: string,          // "domestic" | "international" | "global"
 *   zipcode?: string,               // US ZIP for sales tax
 *   hsCode?: string,                // HS Code (future use)
 *   destinationCountry?: string,    // default "US"
 *   firmName?: string               // Exporter firm name for AD/CVD matching
 *   shippingTerms?: string,         // Incoterms: "DDP" (default) | "DDU" | "CIF" | "FOB" | "EXW"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getCountryFtas } from '@/app/lib/cost-engine/hs-code/fta';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // 1. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // 2. Validate required field: price
  if (body.price === undefined || body.price === null || body.price === '') {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "price" is required.');
  }

  // 3. Validate price is a number or numeric string
  const priceNum = typeof body.price === 'number'
    ? body.price
    : parseFloat(String(body.price).replace(/[^0-9.-]/g, ''));

  if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "price" must be a valid non-negative number.');
  }

  // 4. Validate optional numeric fields
  if (body.shippingPrice !== undefined) {
    const sp = Number(body.shippingPrice);
    if (isNaN(sp) || sp < 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Field "shippingPrice" must be a non-negative number.');
    }
  }

  // 5. Build CostInput (with HS Code classification support)
  const costInput: GlobalCostInput = {
    price: body.price as string | number,
    shippingPrice: body.shippingPrice !== undefined ? Number(body.shippingPrice) : undefined,
    origin: typeof body.origin === 'string' ? body.origin : undefined,
    shippingType: typeof body.shippingType === 'string' ? body.shippingType : undefined,
    zipcode: typeof body.zipcode === 'string' ? body.zipcode : undefined,
    hsCode: typeof body.hsCode === 'string' ? body.hsCode : undefined,
    destinationCountry: typeof body.destinationCountry === 'string' ? body.destinationCountry : undefined,
    productName: typeof body.productName === 'string' ? body.productName : undefined,
    productCategory: typeof body.productCategory === 'string' ? body.productCategory : undefined,
    firmName: typeof body.firmName === 'string' ? body.firmName : undefined,
    shippingTerms: (['DDP', 'DDU', 'CIF', 'FOB', 'EXW'].includes(String(body.shippingTerms || '').toUpperCase())
      ? String(body.shippingTerms).toUpperCase() as GlobalCostInput['shippingTerms']
      : undefined),
    weight_kg: typeof body.weight_kg === 'number' ? body.weight_kg : undefined,
    quantity: typeof body.quantity === 'number' ? body.quantity : undefined,
    annualVolume: typeof body.annualVolume === 'number' ? body.annualVolume : undefined,
    buyerVatNumber: typeof body.buyer_vat_number === 'string' ? body.buyer_vat_number.trim() : undefined,
  };

  // 6. Calculate (DB-backed global engine — supports 58+ countries)
  try {
    const result = await calculateGlobalLandedCostAsync(costInput);

    // 7. Build fta_utilization from tariffOptimization
    const origin = costInput.origin || '';
    const dest = costInput.destinationCountry || 'US';
    const resultObj = result as unknown as Record<string, unknown>;
    const tariffOpt = resultObj.tariffOptimization as { optimalRateType?: string; optimalAgreementName?: string; savingsVsMfn?: number; rateOptions?: { rateType: string; agreementName?: string; rate: number }[] } | undefined;

    let ftaUtilization = null;
    if (tariffOpt) {
      const isFtaApplied = tariffOpt.optimalRateType === 'AGR' || tariffOpt.optimalRateType === 'FTA';
      const productValue = typeof costInput.price === 'number' ? costInput.price : parseFloat(String(costInput.price)) || 0;

      // Find alternative FTAs from rate options
      const altFtas = (tariffOpt.rateOptions || [])
        .filter(r => (r.rateType === 'AGR' || r.rateType === 'FTA') && r.agreementName !== tariffOpt.optimalAgreementName)
        .map(r => ({ name: r.agreementName || r.rateType, rate: r.rate }));

      // Also check hardcoded FTA list for available FTAs
      const originFtas = getCountryFtas(origin);
      const destFtas = getCountryFtas(dest);
      const originCodes = new Set(originFtas.map(f => f.code));
      const sharedFtaCount = destFtas.filter(f => originCodes.has(f.code)).length;

      ftaUtilization = {
        fta_available: sharedFtaCount > 0,
        fta_count: sharedFtaCount,
        fta_applied: isFtaApplied ? (tariffOpt.optimalAgreementName || 'FTA') : null,
        savings: isFtaApplied ? Math.round((tariffOpt.savingsVsMfn || 0) * productValue * 100) / 100 : 0,
        alternative_ftas: altFtas,
      };
    }

    // 8. F011 — Rate lock: save rate + quote_id
    const rateLockMinutes = typeof body.rate_lock_minutes === 'number' ? Math.min(body.rate_lock_minutes, 1440) : 0;
    let rateLock = null;
    if (rateLockMinutes > 0) {
      const quoteId = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const lockedUntil = new Date(Date.now() + rateLockMinutes * 60 * 1000).toISOString();
      try {
        const sb = getSupabase();
        await sb.from('locked_rates').insert({
          quote_id: quoteId,
          seller_id: context.sellerId,
          locked_rate: JSON.stringify(resultObj),
          locked_until: lockedUntil,
        });
      } catch { /* non-blocking */ }
      rateLock = { quote_id: quoteId, locked_until: lockedUntil, lock_minutes: rateLockMinutes };
    }

    // 9. F013 — De minimis detail
    let deMinimisDetail = null;
    try {
      const sb = getSupabase();
      const { data: dm } = await sb.from('de_minimis_thresholds').select('*').eq('country_code', dest).single();
      const shipmentType = typeof body.shipment_type === 'string' ? body.shipment_type : 'goods';
      if (dm) {
        const threshold = parseFloat(dm.threshold_usd || dm.amount || '0');
        const { data: exceptions } = await sb.from('de_minimis_exceptions')
          .select('*').eq('country_code', dest).limit(5);
        deMinimisDetail = {
          threshold,
          currency: dm.currency || dm.threshold_currency || 'USD',
          applied: threshold > 0 && priceNum <= threshold,
          shipment_type: shipmentType,
          exceptions: (exceptions || []).map((e: { product_category: string; exception_type: string; description: string }) => ({
            category: e.product_category, type: e.exception_type, description: e.description,
          })),
        };
      }
    } catch { /* non-blocking */ }

    // 10. F007 — Regulatory warnings from country_regulatory_notes
    let regulatoryWarnings: { category: string; note: string; effective_date: string | null }[] = [];
    try {
      const sb = getSupabase();
      const { data: notes } = await sb.from('country_regulatory_notes')
        .select('category, note_text, effective_date')
        .eq('country_code', dest).limit(10);
      if (notes && notes.length > 0) {
        regulatoryWarnings = notes.map((n: { category: string; note_text: string; effective_date: string | null }) => ({
          category: n.category, note: n.note_text, effective_date: n.effective_date,
        }));
      }
    } catch { /* non-blocking */ }

    // 11. F020-F021 — Enhanced trade remedies
    let tradeRemediesEnhanced = null;
    const tradeRemedies = resultObj.tradeRemedies as { hasRemedies?: boolean; cases?: { caseType: string; orderNumber?: string; dutyRate?: number; scope?: string }[] } | undefined;
    if (tradeRemedies?.hasRemedies && tradeRemedies.cases) {
      tradeRemediesEnhanced = {
        ...tradeRemedies,
        cases: tradeRemedies.cases.map(c => ({
          ...c,
          rate_type: c.dutyRate !== undefined ? (c.dutyRate > 0 ? 'ad_valorem' : 'zero') : 'unknown',
          enforcement: 'active',
        })),
        total_additional_duty: tradeRemedies.cases.reduce((s, c) => s + (c.dutyRate || 0), 0),
      };
    }

    // 12. Return enriched response
    return apiSuccess({
      ...resultObj,
      fta_utilization: ftaUtilization,
      rate_lock: rateLock,
      de_minimis_detail: deMinimisDetail,
      regulatory_warnings: regulatoryWarnings.length > 0 ? regulatoryWarnings : undefined,
      trade_remedies_detail: tradeRemediesEnhanced,
    }, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Calculation failed: ${errMsg}`);
  }
});

// ─── GET Handler (method not allowed) ───────────────

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method with JSON body. See docs: /api/v1/docs'
  );
}
