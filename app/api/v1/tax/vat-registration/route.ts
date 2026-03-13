/**
 * POTAL API v1 — /api/v1/tax/vat-registration
 *
 * VAT/GST registration requirement check.
 * Determines if a seller needs to register for VAT/GST in a given country.
 *
 * POST /api/v1/tax/vat-registration
 * Body: {
 *   country: string,            // required — destination country ISO code
 *   annualRevenue?: number,     // optional — revenue in this country (local currency)
 *   hasLocalEntity?: boolean,   // optional
 *   sellsDigitalGoods?: boolean,// optional — triggers different thresholds
 *   sellsPhysicalGoods?: boolean,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface VatRegInfo {
  country: string;
  registrationThreshold: number;
  currency: string;
  digitalServicesThreshold?: number;
  registrationUrl?: string;
  filingFrequency: string;
  standardRate: number;
  note: string;
}

const VAT_REGISTRATION_INFO: Record<string, VatRegInfo> = {
  GB: { country: 'United Kingdom', registrationThreshold: 85000, currency: 'GBP', digitalServicesThreshold: 0, registrationUrl: 'https://www.gov.uk/vat-registration', filingFrequency: 'Quarterly (MTD)', standardRate: 0.20, note: 'Non-UK sellers selling to UK consumers must register regardless of threshold for B2C digital services.' },
  DE: { country: 'Germany', registrationThreshold: 0, currency: 'EUR', registrationUrl: 'https://www.bzst.de', filingFrequency: 'Monthly/Quarterly', standardRate: 0.19, note: 'No threshold for non-EU sellers. Must register before first sale or use OSS.' },
  FR: { country: 'France', registrationThreshold: 0, currency: 'EUR', filingFrequency: 'Monthly/Quarterly', standardRate: 0.20, note: 'Non-EU sellers must register. EU sellers can use OSS for B2C.' },
  IT: { country: 'Italy', registrationThreshold: 0, currency: 'EUR', filingFrequency: 'Quarterly', standardRate: 0.22, note: 'VAT registration required for non-EU sellers before first sale.' },
  ES: { country: 'Spain', registrationThreshold: 0, currency: 'EUR', filingFrequency: 'Quarterly', standardRate: 0.21, note: 'SII (real-time reporting) required for large companies.' },
  NL: { country: 'Netherlands', registrationThreshold: 0, currency: 'EUR', filingFrequency: 'Quarterly', standardRate: 0.21, note: 'No threshold for non-EU sellers.' },
  AU: { country: 'Australia', registrationThreshold: 75000, currency: 'AUD', digitalServicesThreshold: 75000, filingFrequency: 'Quarterly (BAS)', standardRate: 0.10, note: 'GST registration required when turnover ≥ A$75,000.' },
  CA: { country: 'Canada', registrationThreshold: 30000, currency: 'CAD', filingFrequency: 'Quarterly', standardRate: 0.05, note: 'GST/HST registration when taxable supplies > C$30,000 in 4 consecutive quarters.' },
  JP: { country: 'Japan', registrationThreshold: 10000000, currency: 'JPY', filingFrequency: 'Annually', standardRate: 0.10, note: 'Consumption tax registration when taxable sales ≥ ¥10M. Invoice system (qualified invoices) required.' },
  KR: { country: 'South Korea', registrationThreshold: 0, currency: 'KRW', filingFrequency: 'Semi-annual', standardRate: 0.10, note: 'Foreign digital service providers must register for Korean VAT.' },
  IN: { country: 'India', registrationThreshold: 2000000, currency: 'INR', filingFrequency: 'Monthly (GSTR-3B)', standardRate: 0.18, note: 'GST registration threshold ₹20L (₹40L for goods in some states).' },
  SG: { country: 'Singapore', registrationThreshold: 1000000, currency: 'SGD', filingFrequency: 'Quarterly', standardRate: 0.09, note: 'GST registration when annual taxable turnover > S$1M. Rate increased to 9% from 2024.' },
  AE: { country: 'UAE', registrationThreshold: 375000, currency: 'AED', filingFrequency: 'Quarterly', standardRate: 0.05, note: 'VAT registration mandatory when taxable supplies > AED 375,000.' },
  SA: { country: 'Saudi Arabia', registrationThreshold: 375000, currency: 'SAR', filingFrequency: 'Monthly/Quarterly', standardRate: 0.15, note: 'VAT at 15% since July 2020.' },
  NO: { country: 'Norway', registrationThreshold: 50000, currency: 'NOK', filingFrequency: 'Bi-monthly', standardRate: 0.25, note: 'VOEC scheme for foreign sellers of low-value goods.' },
  CH: { country: 'Switzerland', registrationThreshold: 100000, currency: 'CHF', filingFrequency: 'Semi-annual', standardRate: 0.081, note: 'VAT registration when worldwide revenue ≥ CHF 100,000.' },
  MX: { country: 'Mexico', registrationThreshold: 0, currency: 'MXN', filingFrequency: 'Monthly', standardRate: 0.16, note: 'Digital service providers must register for IVA.' },
  BR: { country: 'Brazil', registrationThreshold: 0, currency: 'BRL', filingFrequency: 'Monthly', standardRate: 0.17, note: 'Complex cascading tax system (ICMS/PIS/COFINS). Tax reform ongoing.' },
};

// EU OSS threshold
const EU_OSS_THRESHOLD = 10000; // EUR — for intra-EU B2C distance sales

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const annualRevenue = typeof body.annualRevenue === 'number' ? body.annualRevenue : undefined;
  const hasLocalEntity = typeof body.hasLocalEntity === 'boolean' ? body.hasLocalEntity : false;
  const sellsDigitalGoods = typeof body.sellsDigitalGoods === 'boolean' ? body.sellsDigitalGoods : false;

  if (!country || country.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be a 2-letter ISO code.');
  }

  const info = VAT_REGISTRATION_INFO[country];

  // EU member state check
  const EU_COUNTRIES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);
  const isEU = EU_COUNTRIES.has(country);

  let registrationRequired = false;
  let reason = '';

  if (info) {
    if (hasLocalEntity) {
      registrationRequired = true;
      reason = 'Local entity must register for VAT/GST.';
    } else if (info.registrationThreshold === 0) {
      registrationRequired = true;
      reason = `${info.country} requires VAT registration for foreign sellers (no threshold).`;
    } else if (annualRevenue !== undefined && annualRevenue >= info.registrationThreshold) {
      registrationRequired = true;
      reason = `Revenue ${info.currency} ${annualRevenue.toLocaleString()} exceeds registration threshold of ${info.currency} ${info.registrationThreshold.toLocaleString()}.`;
    } else if (sellsDigitalGoods && info.digitalServicesThreshold !== undefined && (annualRevenue || 0) >= info.digitalServicesThreshold) {
      registrationRequired = true;
      reason = 'Digital services trigger VAT registration.';
    }
  }

  return apiSuccess(
    {
      country,
      countryName: info?.country || country,
      registrationRequired,
      reason: reason || `Below registration threshold${info ? ` (${info.currency} ${info.registrationThreshold.toLocaleString()})` : ''}.`,
      vatInfo: info ? {
        registrationThreshold: info.registrationThreshold,
        currency: info.currency,
        standardRate: info.standardRate,
        standardRatePercent: `${(info.standardRate * 100).toFixed(1)}%`,
        filingFrequency: info.filingFrequency,
        registrationUrl: info.registrationUrl || null,
        note: info.note,
      } : null,
      euOss: isEU ? {
        eligible: true,
        threshold: EU_OSS_THRESHOLD,
        currency: 'EUR',
        note: 'EU One-Stop Shop (OSS) available for intra-EU B2C distance sales. Single registration covers all EU member states.',
      } : null,
      nextSteps: registrationRequired ? [
        `Register for VAT/GST in ${info?.country || country}`,
        'Obtain VAT/GST number',
        `Begin collecting and remitting VAT/GST (${info?.filingFrequency || 'check local requirements'})`,
      ] : [
        'Monitor revenue against registration threshold',
        'Re-check when revenue or business model changes',
      ],
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "GB", annualRevenue?: 100000, sellsDigitalGoods?: true }');
}
