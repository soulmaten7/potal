/**
 * F055: VAT Registration Engine
 * VIES validation + OSS thresholds + registration requirements.
 */

// ─── Types ──────────────────────────────────────────

export interface VatValidationResult {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name?: string;
  address?: string;
  error?: string;
}

export interface OssThreshold {
  country: string;
  threshold: number;
  currency: string;
  registrationType: 'OSS' | 'IOSS' | 'national';
  note: string;
}

export interface RegistrationRequirement {
  country: string;
  required: boolean;
  threshold?: number;
  registrationUrl: string;
  estimatedTimeDays: number;
  documentsNeeded: string[];
}

// ─── VAT Format Validators ─────────────────────────

const VAT_FORMATS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE[01]\d{9}$/,
  BG: /^BG\d{9,10}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DE: /^DE\d{9}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  GB: /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
  GR: /^EL\d{9}$/,
  HR: /^HR\d{11}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d[A-Z0-9+*]\d{5}[A-Z]{1,2}$/,
  IT: /^IT\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  LV: /^LV\d{11}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SE: /^SE\d{12}$/,
  SI: /^SI\d{8}$/,
  SK: /^SK\d{10}$/,
};

export function validateVatFormat(vatNumber: string): VatValidationResult {
  const cleaned = vatNumber.replace(/[\s.-]/g, '').toUpperCase();
  const countryCode = cleaned.substring(0, 2);
  const pattern = VAT_FORMATS[countryCode === 'EL' ? 'GR' : countryCode];

  if (!pattern) {
    return { valid: false, countryCode, vatNumber: cleaned, error: `Unknown VAT country prefix: ${countryCode}` };
  }

  if (!pattern.test(cleaned)) {
    return { valid: false, countryCode, vatNumber: cleaned, error: `Invalid VAT format for ${countryCode}. Expected pattern: ${pattern.source}` };
  }

  return { valid: true, countryCode, vatNumber: cleaned };
}

// ─── VIES API Check ─────────────────────────────────

export async function checkViesVat(vatNumber: string): Promise<VatValidationResult> {
  const formatResult = validateVatFormat(vatNumber);
  if (!formatResult.valid) return formatResult;

  const cc = formatResult.countryCode === 'EL' ? 'EL' : formatResult.countryCode;
  const number = formatResult.vatNumber.substring(2);

  try {
    const response = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${cc}/vat/${number}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return { ...formatResult, error: `VIES API returned ${response.status}. Format valid but online verification failed.` };
    }

    const data = await response.json();
    return {
      valid: Boolean(data.isValid),
      countryCode: cc,
      vatNumber: formatResult.vatNumber,
      name: data.name || undefined,
      address: data.address || undefined,
      error: data.isValid ? undefined : 'VAT number not found in VIES database',
    };
  } catch {
    // VIES unavailable — return format check only
    return { ...formatResult, error: 'VIES service unavailable. Format validation passed.' };
  }
}

// ─── OSS Thresholds ─────────────────────────────────

export const EU_OSS_THRESHOLD: OssThreshold = {
  country: 'EU',
  threshold: 10000,
  currency: 'EUR',
  registrationType: 'OSS',
  note: 'EU-wide €10,000 threshold for cross-border B2C sales. Above threshold: register for OSS or in each member state.',
};

export const IOSS_THRESHOLD: OssThreshold = {
  country: 'EU',
  threshold: 150,
  currency: 'EUR',
  registrationType: 'IOSS',
  note: 'Import One-Stop Shop for goods ≤€150. Collect VAT at point of sale.',
};

// ─── Registration Requirements ──────────────────────

export const REGISTRATION_REQUIREMENTS: Record<string, RegistrationRequirement> = {
  GB: { country: 'GB', required: true, threshold: 85000, registrationUrl: 'https://www.gov.uk/vat-registration', estimatedTimeDays: 30, documentsNeeded: ['Company registration', 'Bank details', 'Trading history', 'ID verification'] },
  DE: { country: 'DE', required: true, threshold: 0, registrationUrl: 'https://www.bzst.de/EN/', estimatedTimeDays: 45, documentsNeeded: ['Certificate of incorporation', 'Bank certificate', 'Tax advisor appointment', 'ID/passport'] },
  FR: { country: 'FR', required: true, threshold: 0, registrationUrl: 'https://www.impots.gouv.fr/', estimatedTimeDays: 60, documentsNeeded: ['Company registration', 'Fiscal representative (non-EU)', 'Bank details'] },
  AU: { country: 'AU', required: true, threshold: 75000, registrationUrl: 'https://www.ato.gov.au/business/gst/registering-for-gst/', estimatedTimeDays: 14, documentsNeeded: ['ABN', 'Business registration', 'Bank details'] },
  CA: { country: 'CA', required: true, threshold: 30000, registrationUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/', estimatedTimeDays: 21, documentsNeeded: ['BN (Business Number)', 'Business registration'] },
  JP: { country: 'JP', required: true, threshold: 10000000, registrationUrl: 'https://www.nta.go.jp/', estimatedTimeDays: 30, documentsNeeded: ['Corporate registration', 'Tax agent in Japan (non-resident)'] },
  KR: { country: 'KR', required: true, threshold: 0, registrationUrl: 'https://www.nts.go.kr/', estimatedTimeDays: 14, documentsNeeded: ['Business registration certificate', 'Korean tax agent'] },
  SG: { country: 'SG', required: true, threshold: 1000000, registrationUrl: 'https://www.iras.gov.sg/taxes/goods-services-tax-(gst)', estimatedTimeDays: 21, documentsNeeded: ['ACRA registration', 'Company details'] },
};

export function getRegistrationRequirement(country: string): RegistrationRequirement | null {
  return REGISTRATION_REQUIREMENTS[country.toUpperCase()] || null;
}
