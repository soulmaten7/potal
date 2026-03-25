/**
 * POTAL API v1 — /api/v1/tax/vat-registration
 *
 * VAT/GST registration guide with:
 * - VIES VAT number validation (EU)
 * - Country-specific format validation (GB, AU, JP, KR, CA, IN, SG)
 * - Registration threshold check with revenue-based obligation
 * - Step-by-step registration procedures
 * - OSS/IOSS guidance for EU
 *
 * POST /api/v1/tax/vat-registration
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── VAT Number Format Rules (C5) ────────────────────

const VAT_FORMAT_RULES: Record<string, { pattern: RegExp; example: string; name: string }> = {
  AT: { pattern: /^ATU\d{8}$/, example: 'ATU12345678', name: 'UID-Nummer' },
  BE: { pattern: /^BE0\d{9}$/, example: 'BE0123456789', name: 'Btw-nummer' },
  BG: { pattern: /^BG\d{9,10}$/, example: 'BG123456789', name: 'Идентификационен номер' },
  CY: { pattern: /^CY\d{8}[A-Z]$/, example: 'CY12345678A', name: 'ΦΠΑ' },
  CZ: { pattern: /^CZ\d{8,10}$/, example: 'CZ12345678', name: 'DIČ' },
  DE: { pattern: /^DE\d{9}$/, example: 'DE123456789', name: 'USt-IdNr' },
  DK: { pattern: /^DK\d{8}$/, example: 'DK12345678', name: 'CVR/SE-nummer' },
  EE: { pattern: /^EE\d{9}$/, example: 'EE123456789', name: 'KMKR number' },
  ES: { pattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, example: 'ESA12345678', name: 'NIF/CIF' },
  FI: { pattern: /^FI\d{8}$/, example: 'FI12345678', name: 'ALV-tunnus' },
  FR: { pattern: /^FR[A-Z0-9]{2}\d{9}$/, example: 'FRXX123456789', name: 'TVA intracommunautaire' },
  GR: { pattern: /^EL\d{9}$/, example: 'EL123456789', name: 'ΑΦΜ' },
  HR: { pattern: /^HR\d{11}$/, example: 'HR12345678901', name: 'OIB' },
  HU: { pattern: /^HU\d{8}$/, example: 'HU12345678', name: 'Adószám' },
  IE: { pattern: /^IE\d[A-Z0-9]\d{5}[A-Z]$/, example: 'IE1234567A', name: 'VAT Reg' },
  IT: { pattern: /^IT\d{11}$/, example: 'IT12345678901', name: 'P.IVA' },
  LT: { pattern: /^LT\d{9,12}$/, example: 'LT123456789', name: 'PVM mokėtojo kodas' },
  LU: { pattern: /^LU\d{8}$/, example: 'LU12345678', name: 'TVA' },
  LV: { pattern: /^LV\d{11}$/, example: 'LV12345678901', name: 'PVN reģistrācijas Nr' },
  MT: { pattern: /^MT\d{8}$/, example: 'MT12345678', name: 'VAT Reg' },
  NL: { pattern: /^NL\d{9}B\d{2}$/, example: 'NL123456789B01', name: 'Btw-nummer' },
  PL: { pattern: /^PL\d{10}$/, example: 'PL1234567890', name: 'NIP' },
  PT: { pattern: /^PT\d{9}$/, example: 'PT123456789', name: 'NIF' },
  RO: { pattern: /^RO\d{2,10}$/, example: 'RO1234567890', name: 'CUI' },
  SE: { pattern: /^SE\d{12}$/, example: 'SE123456789012', name: 'Momsregistreringsnummer' },
  SI: { pattern: /^SI\d{8}$/, example: 'SI12345678', name: 'DDV številka' },
  SK: { pattern: /^SK\d{10}$/, example: 'SK1234567890', name: 'IČ DPH' },
  // Non-EU
  GB: { pattern: /^GB\d{9}$/, example: 'GB123456789', name: 'VAT Registration Number' },
  AU: { pattern: /^\d{11}$/, example: '12345678901', name: 'ABN (Australian Business Number)' },
  JP: { pattern: /^T\d{13}$/, example: 'T1234567890123', name: '適格請求書発行事業者' },
  KR: { pattern: /^\d{3}-\d{2}-\d{5}$/, example: '123-45-67890', name: '사업자등록번호' },
  CA: { pattern: /^\d{9}RT\d{4}$/, example: '123456789RT0001', name: 'GST/HST Registration' },
  IN: { pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z]$/, example: '22AAAAA0000A1Z5', name: 'GSTIN' },
  SG: { pattern: /^[A-Z]\d{8}[A-Z]$/, example: 'M12345678A', name: 'GST Registration' },
};

/** Validate VAT number format for any country */
function validateVatFormat(vatNumber: string, country?: string): { valid: boolean; error?: string; format?: string } {
  if (!vatNumber || vatNumber.length < 4) return { valid: false, error: 'VAT number too short.' };

  // Determine country from prefix or parameter
  const cc = country?.toUpperCase() || vatNumber.substring(0, 2).toUpperCase();
  const rule = VAT_FORMAT_RULES[cc];

  if (!rule) return { valid: true, format: 'unknown' }; // No rule = can't validate format

  const clean = vatNumber.toUpperCase().replace(/\s/g, '');
  if (!rule.pattern.test(clean)) {
    return { valid: false, error: `Invalid format for ${cc}. Expected: ${rule.example} (${rule.name})`, format: rule.name };
  }

  return { valid: true, format: rule.name };
}

// ─── VIES Validation (C1) ────────────────────────────

interface ViesResult {
  valid: boolean | null;
  name?: string;
  address?: string;
  error?: string;
}

async function validateVatVies(vatNumber: string): Promise<ViesResult> {
  const cc = vatNumber.substring(0, 2).toUpperCase();
  const num = vatNumber.substring(2).replace(/\s/g, '');

  try {
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types"><soapenv:Body><urn:checkVat><urn:countryCode>${cc}</urn:countryCode><urn:vatNumber>${num}</urn:vatNumber></urn:checkVat></soapenv:Body></soapenv:Envelope>`,
      signal: AbortSignal.timeout(10000),
    });

    const xml = await response.text();
    const valid = xml.includes('<valid>true</valid>');
    const nameMatch = xml.match(/<name>([\s\S]*?)<\/name>/);
    const addrMatch = xml.match(/<address>([\s\S]*?)<\/address>/);

    return { valid, name: nameMatch?.[1]?.trim(), address: addrMatch?.[1]?.trim() };
  } catch {
    return { valid: null, error: 'VIES service temporarily unavailable. Format validation passed.' };
  }
}

// ─── Registration Info ───────────────────────────────

interface VatRegInfo {
  country: string;
  threshold: number;
  currency: string;
  registrationUrl?: string;
  filingFrequency: string;
  standardRate: number;
  note: string;
  steps: string[];
}

const VAT_REG_INFO: Record<string, VatRegInfo> = {
  GB: { country: 'United Kingdom', threshold: 90000, currency: 'GBP', registrationUrl: 'https://www.gov.uk/vat-registration', filingFrequency: 'Quarterly (MTD)', standardRate: 0.20, note: 'Threshold £90,000 (April 2024). Non-UK digital sellers must register regardless.', steps: ['Apply online via HMRC', 'Provide UTR, SIC code, bank details', 'Choose VAT scheme (Standard/Flat Rate/Cash)', 'Receive VAT certificate (7-30 working days)', 'Start charging VAT from effective date'] },
  DE: { country: 'Germany', threshold: 0, currency: 'EUR', registrationUrl: 'https://www.bzst.de', filingFrequency: 'Monthly/Quarterly', standardRate: 0.19, note: 'No threshold for non-EU sellers. Register via BZSt or use OSS.', steps: ['Apply to BZSt (Federal Central Tax Office)', 'Provide business registration documents', 'Receive USt-IdNr (VAT ID)', 'File monthly/quarterly VAT returns'] },
  FR: { country: 'France', threshold: 0, currency: 'EUR', filingFrequency: 'Monthly/Quarterly', standardRate: 0.20, note: 'Non-EU sellers must register or use OSS.', steps: ['Register with SIE (Service des Impôts des Entreprises)', 'Obtain numéro TVA intracommunautaire', 'File CA3 returns monthly/quarterly'] },
  AU: { country: 'Australia', threshold: 75000, currency: 'AUD', registrationUrl: 'https://www.ato.gov.au', filingFrequency: 'Quarterly (BAS)', standardRate: 0.10, note: 'GST registration required when AU turnover ≥ A$75,000.', steps: ['Register for ABN at abr.gov.au', 'Register for GST via ATO', 'Lodge BAS quarterly or monthly', 'Report GST collected and claim input tax credits'] },
  JP: { country: 'Japan', threshold: 10000000, currency: 'JPY', filingFrequency: 'Annually', standardRate: 0.10, note: 'Consumption tax ≥ ¥10M. Qualified Invoice System (QIS) required.', steps: ['Register as qualified invoice issuer with NTA', 'Obtain T-number (T+13 digits)', 'Issue qualified invoices for B2B', 'File annual consumption tax return'] },
  KR: { country: 'South Korea', threshold: 0, currency: 'KRW', filingFrequency: 'Semi-annual', standardRate: 0.10, note: 'Foreign digital service providers must register for Korean VAT.', steps: ['Apply via HomeTax system (NTS)', 'Obtain 사업자등록번호', 'File VAT returns semi-annually (Jan, Jul)', 'Issue e-tax invoices for B2B'] },
  CA: { country: 'Canada', threshold: 30000, currency: 'CAD', filingFrequency: 'Quarterly', standardRate: 0.05, note: 'GST/HST registration when taxable supplies > C$30,000 in 4 quarters.', steps: ['Register for BN (Business Number) with CRA', 'Register for GST/HST account', 'File GST/HST returns quarterly', 'Provincial sales tax may also apply (PST/QST)'] },
  IN: { country: 'India', threshold: 2000000, currency: 'INR', filingFrequency: 'Monthly (GSTR-3B)', standardRate: 0.18, note: 'GST threshold ₹20L. E-commerce operators must register regardless.', steps: ['Apply at gst.gov.in with PAN', 'Obtain GSTIN (15-digit)', 'File GSTR-3B monthly', 'File GSTR-1 (outward supplies) monthly'] },
  SG: { country: 'Singapore', threshold: 1000000, currency: 'SGD', filingFrequency: 'Quarterly', standardRate: 0.09, note: 'GST 9% (2024). Registration when taxable turnover > S$1M.', steps: ['Register via myTax Portal (IRAS)', 'Obtain GST registration number', 'File GST returns quarterly (F5/F7)', 'Charge GST on taxable supplies'] },
};

const EU_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
const EU_OSS_THRESHOLD = 10000;

// ─── Handler ─────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const annualRevenue = typeof body.annualRevenue === 'number' ? body.annualRevenue : undefined;
  const hasLocalEntity = typeof body.hasLocalEntity === 'boolean' ? body.hasLocalEntity : false;
  const sellsDigitalGoods = typeof body.sellsDigitalGoods === 'boolean' ? body.sellsDigitalGoods : false;
  const vatNumber = typeof body.vatNumber === 'string' ? body.vatNumber.trim() : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" must be 2-letter ISO code.');

  const info = VAT_REG_INFO[country];
  const isEU = EU_COUNTRIES.has(country);

  // ─── VAT Number Validation (C1 + C5) ─────────────
  let vatValidation: Record<string, unknown> | undefined;
  if (vatNumber) {
    const formatCheck = validateVatFormat(vatNumber, country);
    if (!formatCheck.valid) {
      return apiError(ApiErrorCode.BAD_REQUEST, formatCheck.error || 'Invalid VAT number format.');
    }

    vatValidation = { formatValid: true, format: formatCheck.format };

    // VIES check for EU numbers
    if (isEU || ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(vatNumber.substring(0, 2).toUpperCase())) {
      const vies = await validateVatVies(vatNumber);
      vatValidation = { ...vatValidation, viesValid: vies.valid, viesName: vies.name, viesAddress: vies.address, viesError: vies.error };
    }
  }

  // ─── Registration Obligation (C4) ─────────────────
  let registrationRequired = false;
  let reason = '';
  let percentOfThreshold: number | undefined;

  if (info) {
    if (hasLocalEntity) {
      registrationRequired = true;
      reason = 'Local entity must register for VAT/GST.';
    } else if (info.threshold === 0) {
      registrationRequired = true;
      reason = `${info.country} requires VAT registration for foreign sellers (no threshold).`;
    } else if (annualRevenue !== undefined) {
      percentOfThreshold = Math.round((annualRevenue / info.threshold) * 100);
      if (annualRevenue >= info.threshold) {
        registrationRequired = true;
        reason = `Revenue ${info.currency} ${annualRevenue.toLocaleString()} exceeds threshold ${info.currency} ${info.threshold.toLocaleString()}.`;
      } else {
        reason = `Below threshold (${percentOfThreshold}% of ${info.currency} ${info.threshold.toLocaleString()}).`;
      }
    } else if (sellsDigitalGoods && isEU) {
      registrationRequired = true;
      reason = 'EU digital services require VAT registration (OSS or individual registration).';
    }
  }

  return apiSuccess({
    country,
    countryName: info?.country || country,
    registrationRequired,
    reason,
    percentOfThreshold,
    ...(percentOfThreshold && percentOfThreshold >= 80 && !registrationRequired ? { warning: `Approaching registration threshold (${percentOfThreshold}%). Plan ahead.` } : {}),
    vatInfo: info ? {
      threshold: info.threshold,
      currency: info.currency,
      standardRate: info.standardRate,
      standardRatePercent: `${(info.standardRate * 100).toFixed(1)}%`,
      filingFrequency: info.filingFrequency,
      registrationUrl: info.registrationUrl || null,
      note: info.note,
    } : null,
    registrationSteps: info?.steps || ['Contact local tax authority for registration requirements'],
    euOss: isEU ? {
      eligible: true,
      threshold: EU_OSS_THRESHOLD,
      currency: 'EUR',
      note: 'EU One-Stop Shop (OSS): single registration covers all 27 EU member states for B2C distance sales.',
    } : null,
    vatValidation: vatValidation || undefined,
    availableFormats: VAT_FORMAT_RULES[country] ? {
      pattern: VAT_FORMAT_RULES[country].example,
      name: VAT_FORMAT_RULES[country].name,
    } : null,
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "GB", annualRevenue?: 100000, vatNumber?: "GB123456789" }');
}
