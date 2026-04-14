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
import shippingRatesData from '@/app/lib/data/shipping-rates.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

// Demo bypass moved to withApiAuth middleware (CW22-S4e)

const EU_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

const shippingRates = shippingRatesData as { route: string; origin: string; destination: string; weight_brackets: { max_kg: number; air_usd: number; sea_usd: number }[] }[];

// ─── POST Handler ───────────────────────────────────

const _calculateHandler = async (req: NextRequest, context: ApiAuthContext): Promise<Response> => {
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

    const originFtas = getCountryFtas(origin);
    const destFtas = getCountryFtas(dest);
    const originCodes = new Set(originFtas.map(f => f.code));
    const sharedFtas = destFtas.filter(f => originCodes.has(f.code));
    const sharedFtaCount = sharedFtas.length;

    let ftaUtilization = null;
    if (sharedFtaCount > 0 || tariffOpt) {
      const isFtaApplied = tariffOpt ? (tariffOpt.optimalRateType === 'AGR' || tariffOpt.optimalRateType === 'FTA') : false;
      const productValue = typeof costInput.price === 'number' ? costInput.price : parseFloat(String(costInput.price)) || 0;
      const altFtas = tariffOpt
        ? (tariffOpt.rateOptions || []).filter(r => (r.rateType === 'AGR' || r.rateType === 'FTA') && r.agreementName !== tariffOpt.optimalAgreementName).map(r => ({ name: r.agreementName || r.rateType, rate: r.rate }))
        : [];
      const altNames = new Set(altFtas.map(f => f.name));
      for (const fta of sharedFtas) {
        if (!altNames.has(fta.name)) altFtas.push({ name: fta.name, rate: 0 });
      }
      ftaUtilization = {
        fta_available: sharedFtaCount > 0,
        fta_count: sharedFtaCount,
        fta_applied: isFtaApplied ? (tariffOpt!.optimalAgreementName || 'FTA') : null,
        savings: isFtaApplied ? Math.round((tariffOpt!.savingsVsMfn || 0) * productValue * 100) / 100 : 0,
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

    // 12. F027 — Dangerous goods check
    let dangerousGoods: { is_dangerous: boolean; warning?: string; un_number?: string; class?: string; proper_shipping_name?: string; air_restriction?: boolean; sea_restriction?: boolean } = { is_dangerous: false };
    const hsCode = (resultObj.hsClassification as { hsCode?: string } | undefined)?.hsCode || costInput.hsCode || '';
    if (hsCode.length >= 4) {
      try {
        const sb = getSupabase();
        const hs4 = hsCode.substring(0, 4);
        const { data: dg } = await (sb.from('dangerous_goods') as any)
          .select('un_number, class, proper_shipping_name, air_allowed, sea_allowed, hs_codes')
          .or(`hs_codes.cs.{${hs4}}`);
        if (dg) {
          const match = dg.find((d: { hs_codes: string[] | null }) => d.hs_codes?.some((h: string) => hs4.startsWith(h.substring(0, 4)) || h.startsWith(hs4)));
          if (match) {
            dangerousGoods = {
              is_dangerous: true,
              un_number: match.un_number,
              class: match.class,
              proper_shipping_name: match.proper_shipping_name,
              air_restriction: !match.air_allowed,
              sea_restriction: !match.sea_allowed,
            };
          }
        }
      } catch {
        dangerousGoods = { is_dangerous: false, warning: 'Dangerous goods check temporarily unavailable' };
      }
    }

    // 13. F032 — ICS2 data for EU destinations
    let ics2Data = null;
    if (EU_COUNTRIES.has(dest)) {
      ics2Data = {
        required: true,
        hs6_code: hsCode.substring(0, 6) || null,
        item_description_min_chars: 300,
        trader_id_required: true,
        release: '3',
        transport_modes: ['air', 'sea', 'road', 'rail'],
        note: 'ICS2 Release 3: HS 6-digit code mandatory, item description min 300 chars recommended.',
      };
    }

    // 14. F033 — IOSS/VRN auto-include
    let iossVrn = null;
    if (EU_COUNTRIES.has(dest) && priceNum <= 150) {
      const vatRate = (resultObj.vatRate as number) || 0;
      iossVrn = {
        ioss_eligible: true,
        ioss_vat_rate: Math.round(vatRate * 10000) / 100,
        note: 'IOSS: Seller can collect VAT at point of sale for goods ≤€150.',
      };
    } else if (dest === 'GB' && priceNum <= 135) {
      iossVrn = {
        vrn_applicable: true,
        uk_vat_rate: 20,
        note: 'UK: Seller must register for UK VAT and collect 20% at point of sale for goods ≤£135.',
      };
    }

    // 15. F014 — Restricted items check
    let restrictions: { restricted: boolean; items?: { type: string; description: string; license_info: string; direction: string }[] } = { restricted: false };
    if (hsCode.length >= 4) {
      try {
        const sb = getSupabase();
        const hs2 = hsCode.substring(0, 2);
        const hs4 = hsCode.substring(0, 4);
        const { data: ri } = await sb.from('restricted_items')
          .select('hs_code_pattern, restriction_type, description, license_info, direction, destination_country, origin_country')
          .or(`hs_code_pattern.like.${hs2}%,hs_code_pattern.like.${hs4}%`)
          .limit(20);
        if (ri && ri.length > 0) {
          const matches = ri.filter((r: { destination_country: string | null; origin_country: string | null }) => {
            if (r.destination_country && r.destination_country !== dest) return false;
            if (r.origin_country && r.origin_country !== origin) return false;
            return true;
          });
          if (matches.length > 0) {
            restrictions = {
              restricted: true,
              items: matches.map((r: { restriction_type: string; description: string; license_info: string; direction: string }) => ({
                type: r.restriction_type, description: r.description, license_info: r.license_info, direction: r.direction,
              })),
            };
          }
        }
      } catch { /* non-blocking */ }
    }

    // 16. F060 — Shipping estimate
    let shippingEstimate = null;
    const weightKg = costInput.weight_kg;
    const dimensions = body.dimensions as { length_cm?: number; width_cm?: number; height_cm?: number } | undefined;
    let billableWeight = weightKg;
    let dimWeight: number | undefined;

    if (dimensions?.length_cm && dimensions?.width_cm && dimensions?.height_cm) {
      dimWeight = (dimensions.length_cm * dimensions.width_cm * dimensions.height_cm) / 5000;
      billableWeight = Math.max(weightKg || 0, dimWeight);
    }

    if (billableWeight && billableWeight > 0) {
      const destForRate = EU_COUNTRIES.has(dest) ? 'EU' : dest;
      const route = shippingRates.find(r => r.origin === origin && r.destination === destForRate);
      if (route) {
        const bracket = route.weight_brackets.find(b => billableWeight! <= b.max_kg) || route.weight_brackets[route.weight_brackets.length - 1];
        shippingEstimate = {
          air_estimate: bracket.air_usd,
          sea_estimate: bracket.sea_usd,
          currency: 'USD',
          billable_weight_kg: Math.round(billableWeight * 100) / 100,
          dimensional_weight_kg: dimWeight ? Math.round(dimWeight * 100) / 100 : undefined,
          note: 'Estimate only. Contact carrier for exact rates.',
        };
      }
    }

    // 17. DDP total (F064)
    let ddpTotal = null;
    if (costInput.shippingTerms === 'DDP' && shippingEstimate) {
      const tlc = (resultObj.totalLandedCost as number) || 0;
      ddpTotal = {
        ddp_total: Math.round((tlc + shippingEstimate.air_estimate) * 100) / 100,
        breakdown: {
          product: priceNum,
          duty: (resultObj.importDuty as number) || 0,
          tax: (resultObj.vat as number) || 0,
          shipping_estimate: shippingEstimate.air_estimate,
        },
      };
    }

    // CW37-S2: Structured lookup-absorption fields (Lookup 6개 흡수)
    const lookupAbsorbed = {
      dutyInfo: {
        rate: resultObj.importDuty && priceNum > 0 ? Math.round((resultObj.importDuty as number) / priceNum * 10000) / 100 : 0,
        amount: (resultObj.importDuty as number) || 0,
        source: resultObj.dutyRateSource || 'unknown',
        rateType: resultObj.rateTypeResolved || 'ad_valorem',
        confidence: resultObj.dutyConfidenceScore ?? 0,
      },
      exchangeRateInfo: resultObj.localCurrency ? {
        fromCurrency: 'USD',
        toCurrency: (resultObj.localCurrency as Record<string, unknown>)?.currency || resultObj.destinationCurrency,
        rate: (resultObj.localCurrency as Record<string, unknown>)?.rate || 1,
        lastUpdated: resultObj.exchangeRateTimestamp || null,
      } : undefined,
      deMinimisInfo: {
        threshold: resultObj.dutyThresholdUsd ?? null,
        applied: resultObj.deMinimisApplied ?? false,
        dutyWaived: resultObj.deMinimisApplied ? (resultObj.importDuty as number) || 0 : 0,
      },
      ftaSavings: resultObj.ftaApplied ? {
        applied: !!(resultObj.ftaApplied as Record<string, unknown>)?.hasFta,
        agreement: (resultObj.ftaApplied as Record<string, unknown>)?.ftaName || null,
        savingsAmount: resultObj.tariffOptimization ? (resultObj.tariffOptimization as Record<string, unknown>)?.savingsVsMfn || 0 : 0,
      } : undefined,
    };

    // 18. Return enriched response
    return apiSuccess({
      ...resultObj,
      ...lookupAbsorbed,
      fta_utilization: ftaUtilization,
      rate_lock: rateLock,
      de_minimis_detail: deMinimisDetail,
      regulatory_warnings: regulatoryWarnings.length > 0 ? regulatoryWarnings : undefined,
      trade_remedies_detail: tradeRemediesEnhanced,
      dangerous_goods: dangerousGoods,
      ics2_data: ics2Data,
      ioss_vrn: iossVrn,
      restrictions: restrictions.restricted ? restrictions : undefined,
      shipping_estimate: shippingEstimate,
      ddp_quote: ddpTotal,
    }, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Calculation failed: ${errMsg}`);
  }
};

export const POST = withApiAuth(_calculateHandler);

// ─── GET Handler (method not allowed) ───────────────

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method with JSON body. See docs: /api/v1/docs'
  );
}
