/**
 * POTAL API v1 — /api/v1/tax/special
 *
 * Special/sector-specific tax lookup.
 * Covers telecom (F028), lodging (F029), digital services, sugar, environmental taxes.
 *
 * POST /api/v1/tax/special
 * Body: {
 *   country: string,              // required — ISO 2-letter
 *   taxType: string,              // required — "telecom" | "lodging" | "digital" | "sugar" | "environmental"
 *   state?: string,               // optional — US state-level rates
 *   value?: number,               // optional — calculate tax amount
 *   serviceType?: string,         // optional — "streaming" | "software" | "cloud" | "advertising" | "voip"
 *   buyerType?: string,           // optional — "business" | "consumer" (B2B/B2C)
 *   buyerVatNumber?: string,      // optional — for EU reverse charge
 *   buyerCountry?: string,        // optional — buyer's country (for cross-border)
 *   sellerGlobalRevenue?: number, // optional — for DST threshold check
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Telecom Tax Rates ──────────────────────────────

const TELECOM_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  US: { rate: 0.195, components: ['Federal USF 5.9%', 'State telecom tax 3-8%', 'Local surcharges 2-5%', 'E911 fee $0.50-$2.00'], note: 'US average combined ~19.5%. Varies by state.' },
  CA: { rate: 0.05, components: ['GST/HST on telecom services'] },
  GB: { rate: 0.20, components: ['Standard VAT 20%'] },
  DE: { rate: 0.19, components: ['Standard MwSt 19%'] },
  FR: { rate: 0.20, components: ['Standard TVA 20%'] },
  IN: { rate: 0.18, components: ['GST 18% on telecom'] },
  JP: { rate: 0.10, components: ['Consumption tax 10%'] },
  KR: { rate: 0.10, components: ['VAT 10%', 'Individual consumption tax on premium services'] },
  BR: { rate: 0.45, components: ['ICMS 25-30%', 'PIS/COFINS 9.25%', 'FUST 1%', 'FUNTEL 0.5%'], note: 'Brazil has among highest telecom taxes globally' },
  AU: { rate: 0.10, components: ['GST 10%'] },
};

// ─── US Telecom Surcharges (F028 C2) ─────────────────

interface TelecomSurcharge {
  name: string;
  rate?: number;
  flatAmount?: number;
  type: 'percentage' | 'flat';
}

const US_FEDERAL_SURCHARGES: TelecomSurcharge[] = [
  { name: 'Federal USF (Universal Service Fund)', rate: 0.201, type: 'percentage' },
  { name: 'TRS (Telecommunications Relay Service)', rate: 0.03, type: 'percentage' },
  { name: 'NANP (North American Numbering Plan)', rate: 0.001, type: 'percentage' },
];

const US_STATE_SURCHARGES: Record<string, TelecomSurcharge[]> = {
  NY: [{ name: 'NY E911', flatAmount: 1.50, type: 'flat' }, { name: 'NY state USF', rate: 0.035, type: 'percentage' }],
  CA: [{ name: 'CA E911', flatAmount: 0.80, type: 'flat' }, { name: 'CA PUC surcharge', rate: 0.05, type: 'percentage' }],
  IL: [{ name: 'IL E911', flatAmount: 1.50, type: 'flat' }, { name: 'IL telecom excise', rate: 0.07, type: 'percentage' }],
  TX: [{ name: 'TX E911', flatAmount: 0.50, type: 'flat' }, { name: 'TX state surcharge', rate: 0.04, type: 'percentage' }],
  FL: [{ name: 'FL E911', flatAmount: 0.40, type: 'flat' }, { name: 'FL CST', rate: 0.072, type: 'percentage' }],
  WA: [{ name: 'WA E911', flatAmount: 0.95, type: 'flat' }, { name: 'WA state tax', rate: 0.065, type: 'percentage' }],
  PA: [{ name: 'PA E911', flatAmount: 1.65, type: 'flat' }, { name: 'PA gross receipts', rate: 0.06, type: 'percentage' }],
};

function calculateTelecomSurcharges(state: string | undefined, revenue: number): { surcharges: { name: string; amount: number }[]; total: number } {
  const surcharges: { name: string; amount: number }[] = [];

  for (const s of US_FEDERAL_SURCHARGES) {
    const amount = s.type === 'percentage' ? Math.round(revenue * (s.rate || 0) * 100) / 100 : (s.flatAmount || 0);
    surcharges.push({ name: s.name, amount });
  }

  if (state && US_STATE_SURCHARGES[state]) {
    for (const s of US_STATE_SURCHARGES[state]) {
      const amount = s.type === 'percentage' ? Math.round(revenue * (s.rate || 0) * 100) / 100 : (s.flatAmount || 0);
      surcharges.push({ name: s.name, amount });
    }
  }

  return { surcharges, total: Math.round(surcharges.reduce((sum, s) => sum + s.amount, 0) * 100) / 100 };
}

// ─── Digital Services Tax with Thresholds (C3) ──────

interface DSTThreshold {
  globalRevenueEur: number;
  localRevenueEur: number;
  rate: number;
  currency: string;
}

const DST_THRESHOLDS: Record<string, DSTThreshold> = {
  GB: { globalRevenueEur: 500_000_000, localRevenueEur: 25_000_000, rate: 0.02, currency: 'GBP' },
  FR: { globalRevenueEur: 750_000_000, localRevenueEur: 25_000_000, rate: 0.03, currency: 'EUR' },
  IT: { globalRevenueEur: 750_000_000, localRevenueEur: 5_500_000, rate: 0.03, currency: 'EUR' },
  ES: { globalRevenueEur: 750_000_000, localRevenueEur: 3_000_000, rate: 0.03, currency: 'EUR' },
  TR: { globalRevenueEur: 750_000_000, localRevenueEur: 20_000_000, rate: 0.075, currency: 'TRY' },
  AT: { globalRevenueEur: 750_000_000, localRevenueEur: 25_000_000, rate: 0.05, currency: 'EUR' },
  IN: { globalRevenueEur: 0, localRevenueEur: 0, rate: 0.02, currency: 'INR' }, // Equalisation Levy — no threshold
  KR: { globalRevenueEur: 0, localRevenueEur: 0, rate: 0.10, currency: 'KRW' }, // VAT registration required
  AU: { globalRevenueEur: 0, localRevenueEur: 75_000, rate: 0.10, currency: 'AUD' }, // GST on digital
};

// ─── Digital Service Type Rates (C1) ─────────────────

const DIGITAL_SERVICE_RATES: Record<string, Record<string, number>> = {
  IN: { streaming: 0.18, software: 0.18, cloud: 0.18, advertising: 0.18, voip: 0.18 },
  TR: { streaming: 0.075, software: 0.18, cloud: 0.18, advertising: 0.075, voip: 0.18 },
  AU: { streaming: 0.10, software: 0.10, cloud: 0.10, advertising: 0.10, voip: 0.10 },
  KR: { streaming: 0.10, software: 0.10, cloud: 0.10, advertising: 0.10, voip: 0.10 },
  GB: { streaming: 0.20, software: 0.20, cloud: 0.20, advertising: 0.02, voip: 0.20 }, // advertising = DST 2%
  FR: { streaming: 0.20, software: 0.20, cloud: 0.20, advertising: 0.03, voip: 0.20 },
};

// ─── Withholding Tax (C5) ────────────────────────────

const WITHHOLDING_TAX: Record<string, { rate: number; appliesTo: string[]; note: string }> = {
  IN: { rate: 0.02, appliesTo: ['foreign_digital_services'], note: 'TCS 2% on foreign e-commerce supply (Equalisation Levy)' },
  KR: { rate: 0.20, appliesTo: ['software_royalty', 'technical_services'], note: 'Withholding tax 20% on software royalty payments to non-residents' },
  BR: { rate: 0.15, appliesTo: ['software_license', 'technical_services'], note: 'IRRF 15% on software/technical service payments abroad' },
  ID: { rate: 0.20, appliesTo: ['digital_services'], note: 'Income tax 20% on payments to non-resident digital service providers' },
};

// ─── EU Countries (for B2B reverse charge) ───────────

const EU_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

// ─── F029: Lodging Tax — City-level + Flat Fees ──────

interface LodgingTaxComponent {
  name: string;
  type: 'percentage' | 'flat_per_night' | 'flat_per_stay';
  percentageRate?: number;
  flatAmount?: number;
  currency?: string;
}

function calculateLodgingTax(
  nightlyRate: number, nights: number, rooms: number, taxes: LodgingTaxComponent[]
): { total: number; breakdown: Array<{ name: string; amount: number }> } {
  const breakdown: Array<{ name: string; amount: number }> = [];
  let total = 0;
  for (const tax of taxes) {
    let amount = 0;
    if (tax.type === 'percentage') amount = nightlyRate * nights * rooms * (tax.percentageRate! / 100);
    else if (tax.type === 'flat_per_night') amount = tax.flatAmount! * nights * rooms;
    else if (tax.type === 'flat_per_stay') amount = tax.flatAmount!;
    amount = Math.round(amount * 100) / 100;
    breakdown.push({ name: tax.name, amount });
    total += amount;
  }
  return { total: Math.round(total * 100) / 100, breakdown };
}

const CITY_LODGING_TAXES: Record<string, LodgingTaxComponent[]> = {
  'US_NYC': [
    { name: 'NY State Hotel Tax', type: 'percentage', percentageRate: 4 },
    { name: 'NYC Hotel Tax', type: 'percentage', percentageRate: 5.875 },
    { name: 'MCTD Surcharge', type: 'percentage', percentageRate: 0.375 },
    { name: 'NYC Unit Fee', type: 'flat_per_night', flatAmount: 3.50 },
    { name: 'Javits Center Fee', type: 'flat_per_night', flatAmount: 1.50 },
  ],
  'US_LA': [
    { name: 'LA TOT', type: 'percentage', percentageRate: 12 },
    { name: 'TMD Assessment', type: 'percentage', percentageRate: 1.5 },
    { name: 'Tourism Marketing', type: 'percentage', percentageRate: 1 },
  ],
  'US_SF': [
    { name: 'SF TOT', type: 'percentage', percentageRate: 14 },
    { name: 'Tourism District', type: 'percentage', percentageRate: 1.25 },
  ],
  'US_CHI': [
    { name: 'IL Hotel Tax', type: 'percentage', percentageRate: 6 },
    { name: 'Chicago Hotel Tax', type: 'percentage', percentageRate: 4.5 },
    { name: 'McPier Tax', type: 'percentage', percentageRate: 2.5 },
  ],
  'US_MIA': [
    { name: 'FL State Tax', type: 'percentage', percentageRate: 6 },
    { name: 'Miami-Dade Tourism', type: 'percentage', percentageRate: 6 },
  ],
  'JP_TOKYO': [
    { name: 'Consumption Tax', type: 'percentage', percentageRate: 10 },
    { name: 'Tokyo Accommodation Tax', type: 'flat_per_night', flatAmount: 200, currency: 'JPY' },
  ],
  'JP_KYOTO': [
    { name: 'Consumption Tax', type: 'percentage', percentageRate: 10 },
    { name: 'Kyoto Accommodation Tax', type: 'flat_per_night', flatAmount: 500, currency: 'JPY' },
  ],
  'IT_ROME': [
    { name: 'IVA', type: 'percentage', percentageRate: 10 },
    { name: 'Imposta di Soggiorno', type: 'flat_per_night', flatAmount: 7, currency: 'EUR' },
  ],
  'FR_PARIS': [
    { name: 'TVA', type: 'percentage', percentageRate: 10 },
    { name: 'Taxe de Séjour', type: 'flat_per_night', flatAmount: 4.30, currency: 'EUR' },
  ],
  'ES_BARCELONA': [
    { name: 'IVA', type: 'percentage', percentageRate: 10 },
    { name: 'Catalan Tourist Tax', type: 'flat_per_night', flatAmount: 2.25, currency: 'EUR' },
    { name: 'Barcelona Surcharge', type: 'flat_per_night', flatAmount: 1.75, currency: 'EUR' },
  ],
  'AE_DUBAI': [
    { name: 'Tourism Dirham', type: 'flat_per_night', flatAmount: 15, currency: 'AED' },
    { name: 'Municipality Fee', type: 'percentage', percentageRate: 7 },
    { name: 'Tourism Fee', type: 'percentage', percentageRate: 5 },
  ],
  'DE_BERLIN': [
    { name: 'MwSt', type: 'percentage', percentageRate: 7 },
    { name: 'City Tax', type: 'percentage', percentageRate: 5 },
  ],
};

const LONG_STAY_EXEMPTION: Record<string, number> = {
  DEFAULT: 30, NY: 90, FL: 183, TX: 30, CA: 30, IL: 30,
};

const PLATFORM_TAX_COLLECTORS = new Set(['airbnb', 'booking.com', 'vrbo', 'expedia', 'hotels.com', 'agoda']);

function normalizeCityKey(country: string, city: string): string | null {
  const c = city.toUpperCase().replace(/[^A-Z]/g, '');
  const map: Record<string, string> = {
    NEWYORK: 'NYC', NYC: 'NYC', MANHATTAN: 'NYC', LOSANGELES: 'LA', LA: 'LA',
    SANFRANCISCO: 'SF', SF: 'SF', CHICAGO: 'CHI', CHI: 'CHI', MIAMI: 'MIA', MIA: 'MIA',
    TOKYO: 'TOKYO', KYOTO: 'KYOTO', ROME: 'ROME', ROMA: 'ROME', PARIS: 'PARIS',
    BARCELONA: 'BARCELONA', DUBAI: 'DUBAI', BERLIN: 'BERLIN',
  };
  const mapped = map[c];
  return mapped ? `${country}_${mapped}` : null;
}

// ─── Legacy Data ─────────────────────────────────────

const LODGING_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  US: { rate: 0.145, components: ['State hotel tax 4-7%', 'City occupancy tax 3-8%', 'Tourism fee 1-3%'], note: 'US average ~14.5%' },
  FR: { rate: 0.10, components: ['TVA réduite 10%', 'Taxe de séjour €0.20-€4/night'] },
  DE: { rate: 0.07, components: ['Reduced MwSt 7%', 'City tax 0-5%'] },
  IT: { rate: 0.10, components: ['IVA ridotta 10%', 'Imposta di soggiorno €1-€7/night'] },
  ES: { rate: 0.10, components: ['IVA reducido 10%', 'Tourist tax €0.50-€2.50/night (Catalonia)'] },
  JP: { rate: 0.10, components: ['Consumption tax 10%', 'Accommodation tax ¥100-¥200/night'] },
  GB: { rate: 0.20, components: ['Standard VAT 20%'] },
  AU: { rate: 0.10, components: ['GST 10%'] },
  TH: { rate: 0.07, components: ['VAT 7%', 'Service charge 10%'] },
  AE: { rate: 0.10, components: ['Tourism fee 5%', 'Municipality fee 7%'] },
};

const SUGAR_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  GB: { rate: 0.18, components: ['SDIL: 18p/L (>5g sugar/100ml)'] },
  MX: { rate: 0.10, components: ['IEPS: 1 peso/L on sugary drinks'] },
  FR: { rate: 0.075, components: ['Taxe soda: €7.53/hL'] },
  NO: { rate: 0.30, components: ['Sugar tax: NOK 8.49/kg'] },
  PH: { rate: 0.06, components: ['₱6/L sweetened beverages'] },
};

const ENVIRONMENTAL_TAX_RATES: Record<string, { rate: number; components: string[]; note?: string }> = {
  SE: { rate: 0.025, components: ['Chemical tax on electronics SEK 320/kg'] },
  FR: { rate: 0.015, components: ['DEEE eco-contribution', 'Eco-emballages'] },
  DE: { rate: 0.02, components: ['Verpackungsgesetz', 'ElektroG WEEE'] },
  GB: { rate: 0.025, components: ['Plastic Packaging Tax £210.82/tonne'] },
};

const TAX_REGISTRIES: Record<string, Record<string, { rate: number; components: string[]; note?: string }>> = {
  telecom: TELECOM_TAX_RATES,
  lodging: LODGING_TAX_RATES,
  digital: Object.fromEntries(Object.entries(DST_THRESHOLDS).map(([k, v]) => [k, { rate: v.rate, components: [`DST ${(v.rate * 100).toFixed(1)}%`], note: `Threshold: €${(v.globalRevenueEur / 1e6).toFixed(0)}M global revenue` }])),
  sugar: SUGAR_TAX_RATES,
  environmental: ENVIRONMENTAL_TAX_RATES,
};

const VALID_TAX_TYPES = Object.keys(TAX_REGISTRIES);

const US_STATE_LODGING_TAX: Record<string, number> = {
  NY: 0.1475, HI: 0.1725, TX: 0.12, CA: 0.14, FL: 0.12,
  IL: 0.175, WA: 0.125, CO: 0.105, MA: 0.145, GA: 0.13,
};

// ─── Handler ────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const taxType = typeof body.taxType === 'string' ? body.taxType.toLowerCase().trim() : '';
  const state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : undefined;
  const value = typeof body.value === 'number' ? body.value : undefined;
  const serviceType = typeof body.serviceType === 'string' ? body.serviceType.toLowerCase().trim() : undefined;
  const buyerType = typeof body.buyerType === 'string' ? body.buyerType.toLowerCase().trim() : undefined;
  const buyerVatNumber = typeof body.buyerVatNumber === 'string' ? body.buyerVatNumber.trim() : undefined;
  const buyerCountry = typeof body.buyerCountry === 'string' ? body.buyerCountry.toUpperCase().trim() : undefined;
  const sellerGlobalRevenue = typeof body.sellerGlobalRevenue === 'number' ? body.sellerGlobalRevenue : undefined;
  const city = typeof body.city === 'string' ? body.city.trim() : undefined;
  const nights = typeof body.nights === 'number' && body.nights > 0 ? Math.floor(body.nights) : 1;
  const rooms = typeof body.rooms === 'number' && body.rooms > 0 ? Math.floor(body.rooms) : 1;
  const platform = typeof body.platform === 'string' ? body.platform.trim() : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  if (!VALID_TAX_TYPES.includes(taxType)) return apiError(ApiErrorCode.BAD_REQUEST, `"taxType" must be: ${VALID_TAX_TYPES.join(', ')}`);

  // ─── F029: Lodging-specific logic ─────────────────
  if (taxType === 'lodging') {
    // C3: OTA platform check
    if (platform && PLATFORM_TAX_COLLECTORS.has(platform.toLowerCase())) {
      return apiSuccess({
        country, taxType, platform, platformCollected: true,
        note: `${platform} collects and remits lodging taxes in most jurisdictions.`,
        action: 'Verify with platform for this specific location.',
      }, { sellerId: context.sellerId, plan: context.planId });
    }

    // C4: Long-stay exemption
    const exemptionDays = (state && LONG_STAY_EXEMPTION[state]) || LONG_STAY_EXEMPTION.DEFAULT;
    if (nights >= exemptionDays) {
      return apiSuccess({
        country, taxType, nights, taxAmount: 0, longStayExemption: true,
        reason: `Stay of ${nights} nights exceeds ${exemptionDays}-day exemption threshold${state ? ` in ${state}` : ''}.`,
      }, { sellerId: context.sellerId, plan: context.planId });
    }

    // C1+C2+C5: City-level lodging tax with flat fees
    const cityKey = city ? normalizeCityKey(country, city) : null;
    const cityTaxes = cityKey ? CITY_LODGING_TAXES[cityKey] : null;

    if (cityTaxes && value) {
      const result = calculateLodgingTax(value, nights, rooms, cityTaxes);
      return apiSuccess({
        country, taxType, city, state, found: true, nights, rooms, nightlyRate: value,
        taxAmount: result.total,
        breakdown: result.breakdown,
        totalWithTax: Math.round((value * nights * rooms + result.total) * 100) / 100,
        components: cityTaxes.map(t => t.type === 'percentage' ? `${t.name}: ${t.percentageRate}%` : `${t.name}: ${t.currency || '$'}${t.flatAmount}/night`),
        precision: 'city_level',
      }, { sellerId: context.sellerId, plan: context.planId });
    }

    if (cityTaxes) {
      return apiSuccess({
        country, taxType, city, found: true, precision: 'city_level',
        components: cityTaxes.map(t => t.type === 'percentage' ? `${t.name}: ${t.percentageRate}%` : `${t.name}: ${t.currency || '$'}${t.flatAmount}/night`),
        note: 'Provide "value" (nightly rate), "nights", and "rooms" for exact calculation.',
      }, { sellerId: context.sellerId, plan: context.planId });
    }
  }

  // ─── B2B Reverse Charge Check (C4) ─────────────────
  if (buyerType === 'business' && buyerVatNumber && taxType === 'digital') {
    if (EU_COUNTRIES.has(country) && buyerCountry && buyerCountry !== country) {
      return apiSuccess({
        country, taxType, buyerType, reverseCharge: true,
        taxAmount: 0, rate: 0,
        mechanism: 'reverse_charge',
        note: 'EU B2B reverse charge applies. Buyer self-assesses VAT. No tax collected by seller.',
      }, { sellerId: context.sellerId });
    }
  }

  // Base tax lookup
  const registry = TAX_REGISTRIES[taxType];
  let taxData = registry[country];
  let effectiveRate = taxData?.rate || 0;
  const extraInfo: Record<string, unknown> = {};

  // ─── Telecom: US state surcharges (C2) ─────────────
  if (taxType === 'telecom' && country === 'US') {
    if (value) {
      const surchargeResult = calculateTelecomSurcharges(state, value);
      extraInfo.surcharges = surchargeResult.surcharges;
      extraInfo.surchargeTotal = surchargeResult.total;
    }
    if (state && US_STATE_SURCHARGES[state]) {
      const stateRate = US_STATE_SURCHARGES[state].filter(s => s.type === 'percentage').reduce((sum, s) => sum + (s.rate || 0), 0);
      effectiveRate = 0.059 + stateRate; // Federal USF + state
      taxData = { rate: effectiveRate, components: [`Federal USF 5.9%`, `${state} surcharges`], note: `Combined rate for ${state}` };
    }
  }

  // ─── Lodging: US state override ────────────────────
  if (taxType === 'lodging' && country === 'US' && state && US_STATE_LODGING_TAX[state]) {
    taxData = { rate: US_STATE_LODGING_TAX[state], components: [`${state} combined lodging tax`] };
    effectiveRate = US_STATE_LODGING_TAX[state];
  }

  // ─── Digital: service type differentiation (C1) ────
  if (taxType === 'digital' && serviceType && DIGITAL_SERVICE_RATES[country]) {
    const serviceRate = DIGITAL_SERVICE_RATES[country][serviceType];
    if (serviceRate !== undefined) {
      effectiveRate = serviceRate;
      extraInfo.serviceType = serviceType;
      extraInfo.serviceRate = `${(serviceRate * 100).toFixed(1)}%`;
    }
  }

  // ─── Digital: DST threshold check (C3) ─────────────
  if (taxType === 'digital' && DST_THRESHOLDS[country]) {
    const dst = DST_THRESHOLDS[country];
    extraInfo.dstThreshold = {
      globalRevenueRequired: dst.globalRevenueEur,
      localRevenueRequired: dst.localRevenueEur,
      rate: dst.rate,
    };
    if (sellerGlobalRevenue !== undefined && dst.globalRevenueEur > 0) {
      const dstApplicable = sellerGlobalRevenue >= dst.globalRevenueEur;
      extraInfo.dstApplicable = dstApplicable;
      if (!dstApplicable) {
        extraInfo.dstNote = `Global revenue below DST threshold (€${(dst.globalRevenueEur / 1e6).toFixed(0)}M). DST does not apply.`;
        effectiveRate = 0; // DST not applicable
      }
    }
  }

  // ─── Withholding tax (C5) ──────────────────────────
  const isCrossBorder = buyerCountry && buyerCountry !== country;
  if (isCrossBorder && WITHHOLDING_TAX[buyerCountry]) {
    extraInfo.withholdingTax = WITHHOLDING_TAX[buyerCountry];
  }

  const taxAmount = value ? Math.round(value * effectiveRate * 100) / 100 : null;
  const totalWithSurcharges = taxAmount !== null && extraInfo.surchargeTotal
    ? Math.round((taxAmount + (extraInfo.surchargeTotal as number)) * 100) / 100
    : taxAmount;

  return apiSuccess({
    country, taxType, state: state || null, serviceType: serviceType || null,
    buyerType: buyerType || null,
    found: !!taxData || effectiveRate > 0,
    rate: effectiveRate,
    ratePercent: `${(effectiveRate * 100).toFixed(2)}%`,
    components: taxData?.components || [],
    note: taxData?.note || (!taxData ? `No specific ${taxType} tax data for ${country}. Standard VAT/GST may apply.` : null),
    taxAmount,
    totalWithSurcharges: totalWithSurcharges !== taxAmount ? totalWithSurcharges : undefined,
    value: value || null,
    ...extraInfo,
    availableTaxTypes: VALID_TAX_TYPES,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country, taxType: "telecom"|"lodging"|"digital"|"sugar"|"environmental", serviceType?, buyerType?, value? }');
}
