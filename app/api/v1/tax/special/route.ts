/**
 * POTAL API v1 — /api/v1/tax/special
 *
 * Special/sector-specific tax lookup.
 * Covers telecom taxes (F028), lodging/hotel taxes (F029), and other sector taxes.
 *
 * POST /api/v1/tax/special
 * Body: {
 *   country: string,         // required — ISO 2-letter
 *   taxType: string,         // required — "telecom" | "lodging" | "digital" | "sugar" | "excise" | "environmental"
 *   state?: string,          // optional — for US state-level rates
 *   value?: number,          // optional — calculate tax amount
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Telecom Tax Rates ─────────────────────────────

const TELECOM_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  US: { rate: 0.195, components: ['Federal USF 5.9%', 'State telecom tax 3-8%', 'Local surcharges 2-5%', 'E911 fee $0.50-$2.00'], note: 'US average combined ~19.5%. Varies by state.' },
  CA: { rate: 0.05, components: ['GST/HST on telecom services'], note: 'Standard GST/HST applies' },
  GB: { rate: 0.20, components: ['Standard VAT 20%'] },
  DE: { rate: 0.19, components: ['Standard MwSt 19%'] },
  FR: { rate: 0.20, components: ['Standard TVA 20%'] },
  IN: { rate: 0.18, components: ['GST 18% on telecom'] },
  JP: { rate: 0.10, components: ['Consumption tax 10%'] },
  KR: { rate: 0.10, components: ['VAT 10%', 'Individual consumption tax on premium services'] },
  BR: { rate: 0.45, components: ['ICMS 25-30%', 'PIS/COFINS 9.25%', 'FUST 1%', 'FUNTEL 0.5%'], note: 'Brazil has among the highest telecom taxes globally' },
  AU: { rate: 0.10, components: ['GST 10%'] },
};

// ─── Lodging/Hotel Tax Rates ───────────────────────

const LODGING_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  US: { rate: 0.145, components: ['State hotel tax 4-7%', 'City occupancy tax 3-8%', 'Tourism fee 1-3%'], note: 'US average ~14.5%. NYC can be 14.75%+. Varies widely by city.' },
  FR: { rate: 0.10, components: ['TVA réduite 10%', 'Taxe de séjour €0.20-€4/night'], note: 'Taxe de séjour varies by city and accommodation type' },
  DE: { rate: 0.07, components: ['Reduced MwSt 7%', 'City tax 0-5%'], note: 'Berlin 5% city tax, Munich exempt for business' },
  IT: { rate: 0.10, components: ['IVA ridotta 10%', 'Imposta di soggiorno €1-€7/night'], note: 'City tax varies: Rome €3-7, Venice €1-5' },
  ES: { rate: 0.10, components: ['IVA reducido 10%', 'Tourist tax €0.50-€2.50/night (Catalonia, Balearics)'] },
  JP: { rate: 0.10, components: ['Consumption tax 10%', 'Accommodation tax ¥100-¥200/night (Tokyo, Osaka, Kyoto)'] },
  GB: { rate: 0.20, components: ['Standard VAT 20%'], note: 'No separate hotel/tourist tax (as of 2026)' },
  AU: { rate: 0.10, components: ['GST 10%'], note: 'No separate lodging tax' },
  TH: { rate: 0.07, components: ['VAT 7%', 'Service charge 10% (hotel policy)'] },
  AE: { rate: 0.10, components: ['Tourism fee 5%', 'Municipality fee 7%', 'Service charge 10%'] },
};

// ─── Digital Services Tax ──────────────────────────

const DIGITAL_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  GB: { rate: 0.02, components: ['Digital Services Tax 2%'], note: 'Applies to search engines, social media, online marketplaces with global revenue >£500M' },
  FR: { rate: 0.03, components: ['Digital Services Tax 3%'], note: 'Applies to digital advertising and marketplace intermediation' },
  IT: { rate: 0.03, components: ['Digital Services Tax 3%'], note: 'Web tax on digital services revenue >€750M global' },
  ES: { rate: 0.03, components: ['Digital Services Tax 3%'] },
  AT: { rate: 0.05, components: ['Digital advertising tax 5%'] },
  IN: { rate: 0.02, components: ['Equalisation Levy 2%'], note: 'On e-commerce supply or services by non-resident operators' },
  KR: { rate: 0.10, components: ['VAT 10% on digital services'], note: 'Foreign digital service providers must register for Korean VAT' },
  AU: { rate: 0.10, components: ['GST 10% on digital supplies'], note: 'Applies to foreign suppliers of digital services to AU consumers' },
};

// ─── Sugar/Sweetened Beverage Tax ──────────────────

const SUGAR_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  GB: { rate: 0.18, components: ['SDIL: 18p/L (>5g sugar/100ml)', 'SDIL: 24p/L (>8g sugar/100ml)'], note: 'Soft Drinks Industry Levy (Sugar Tax)' },
  MX: { rate: 0.10, components: ['IEPS: 1 peso/L on sugary drinks'], note: 'Special Tax on Production and Services' },
  FR: { rate: 0.075, components: ['Taxe soda: €7.53/hL + escalating rate by sugar content'] },
  NO: { rate: 0.30, components: ['Sugar tax: NOK 8.49/kg on chocolate, NOK 3.56/L on beverages'] },
  PH: { rate: 0.06, components: ['₱6/L sweetened beverages', '₱12/L for HFCS drinks'] },
};

// ─── Environmental Tax ─────────────────────────────

const ENVIRONMENTAL_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  SE: { rate: 0.025, components: ['Chemical tax on electronics SEK 320/kg'], note: 'Applies to electronics containing certain flame retardants' },
  FR: { rate: 0.015, components: ['DEEE eco-contribution €0.01-€13/unit', 'Eco-emballages contribution'] },
  DE: { rate: 0.02, components: ['Verpackungsgesetz packaging tax', 'ElektroG WEEE registration'] },
  GB: { rate: 0.025, components: ['Plastic Packaging Tax £210.82/tonne (< 30% recycled)'] },
};

// ─── Tax Type Registry ─────────────────────────────

const TAX_REGISTRIES: Record<string, Record<string, { rate: number; components: string[]; note?: string }>> = {
  telecom: TELECOM_TAX_RATES,
  lodging: LODGING_TAX_RATES,
  digital: DIGITAL_TAX_RATES,
  sugar: SUGAR_TAX_RATES,
  environmental: ENVIRONMENTAL_TAX_RATES,
};

const VALID_TAX_TYPES = Object.keys(TAX_REGISTRIES);

// US state-level telecom surcharges
const US_STATE_TELECOM_SURCHARGE: Record<string, number> = {
  IL: 0.07, NY: 0.055, WA: 0.065, NE: 0.068, FL: 0.072,
  OH: 0.05, PA: 0.06, TX: 0.04, CA: 0.05, VA: 0.05,
};

// US state-level lodging tax
const US_STATE_LODGING_TAX: Record<string, number> = {
  NY: 0.1475, HI: 0.1725, TX: 0.12, CA: 0.14, FL: 0.12,
  IL: 0.175, WA: 0.125, CO: 0.105, MA: 0.145, GA: 0.13,
  NV: 0.13, AZ: 0.125, VA: 0.11, TN: 0.155, SC: 0.11,
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const taxType = typeof body.taxType === 'string' ? body.taxType.toLowerCase().trim() : '';
  const state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : undefined;
  const value = typeof body.value === 'number' ? body.value : undefined;

  if (!country || country.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  }
  if (!VALID_TAX_TYPES.includes(taxType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"taxType" must be one of: ${VALID_TAX_TYPES.join(', ')}`);
  }

  const registry = TAX_REGISTRIES[taxType];
  let taxData = registry[country];

  // US state-level override
  if (country === 'US' && state) {
    if (taxType === 'telecom' && US_STATE_TELECOM_SURCHARGE[state]) {
      taxData = {
        rate: US_STATE_TELECOM_SURCHARGE[state] + 0.059, // state + federal USF
        components: [`Federal USF 5.9%`, `${state} state telecom surcharge ${(US_STATE_TELECOM_SURCHARGE[state] * 100).toFixed(1)}%`],
        note: `Combined federal + ${state} state telecom tax rate`,
      };
    }
    if (taxType === 'lodging' && US_STATE_LODGING_TAX[state]) {
      taxData = {
        rate: US_STATE_LODGING_TAX[state],
        components: [`${state} combined hotel/lodging tax ${(US_STATE_LODGING_TAX[state] * 100).toFixed(2)}%`],
        note: `Includes state hotel tax + local occupancy taxes for ${state}`,
      };
    }
  }

  const taxAmount = value && taxData ? Math.round(value * taxData.rate * 100) / 100 : null;

  return apiSuccess(
    {
      country,
      taxType,
      state: state || null,
      found: !!taxData,
      rate: taxData?.rate || null,
      ratePercent: taxData ? `${(taxData.rate * 100).toFixed(2)}%` : null,
      components: taxData?.components || [],
      note: taxData?.note || (taxData ? null : `No specific ${taxType} tax data for ${country}. Standard VAT/GST may apply.`),
      taxAmount,
      value: value || null,
      availableTaxTypes: VALID_TAX_TYPES,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", taxType: "telecom"|"lodging"|"digital"|"sugar"|"environmental", state?: "NY", value?: 100 }');
}
