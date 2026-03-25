/**
 * F050: Section 321 De Minimis Tracker
 *
 * C4: US Section 321 ($800) eligibility with 2024+ restrictions.
 * Tracks origin restrictions, HS code restrictions, and frequency limits.
 */

// ─── Types ──────────────────────────────────────────

export interface DeMinimisResult {
  eligible: boolean;
  threshold: number;
  currency: string;
  reason: string;
  restrictions: string[];
  alternativeEntry?: string;
}

// ─── Constants ──────────────────────────────────────

// Countries with de minimis restrictions (2024+ rules)
const RESTRICTED_ORIGINS_US: Record<string, { restricted: boolean; reason: string }> = {
  CN: { restricted: true, reason: 'China-origin goods: Section 321 eligibility restricted under 2024 proposed rule for textiles/apparel (Chapters 50-63) and certain goods subject to AD/CVD orders.' },
  HK: { restricted: true, reason: 'Hong Kong: treated as China-origin for de minimis purposes under certain programs.' },
  MO: { restricted: true, reason: 'Macau: treated as China-origin for de minimis purposes under certain programs.' },
};

// HS Chapters restricted from Section 321
const RESTRICTED_HS_CHAPTERS_US = new Set([
  // Textiles and apparel (proposed restriction for CN origin)
  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63',
]);

// Global de minimis thresholds by country
const DE_MINIMIS_THRESHOLDS: Record<string, { value: number; currency: string; notes?: string }> = {
  US: { value: 800, currency: 'USD', notes: 'Section 321. Restrictions apply for CN-origin textiles.' },
  CA: { value: 40, currency: 'CAD', notes: 'CBSA LVS threshold. Raised from $20 under CUSMA.' },
  EU: { value: 150, currency: 'EUR', notes: 'Customs duty exempt. VAT still applies via IOSS.' },
  UK: { value: 135, currency: 'GBP', notes: 'Customs duty exempt. VAT collected at point of sale.' },
  AU: { value: 1000, currency: 'AUD', notes: 'GST applies to all imported goods regardless of value.' },
  JP: { value: 10000, currency: 'JPY', notes: 'Customs exempt. Consumption tax may apply.' },
  KR: { value: 150, currency: 'USD', notes: 'Equivalent in KRW at current rate.' },
  CN: { value: 50, currency: 'CNY', notes: 'Cross-border e-commerce has separate rules.' },
  SG: { value: 400, currency: 'SGD', notes: 'GST applies above threshold.' },
  NZ: { value: 1000, currency: 'NZD', notes: 'GST applies to all imported goods.' },
  MX: { value: 50, currency: 'USD', notes: 'Equivalent in MXN.' },
  BR: { value: 50, currency: 'USD', notes: 'ICMS may still apply.' },
  IN: { value: 0, currency: 'INR', notes: 'No de minimis exemption for customs duty.' },
  DEFAULT: { value: 0, currency: 'USD', notes: 'No de minimis data. Customs duty likely applies.' },
};

// ─── Functions ──────────────────────────────────────

export function getDeMinimisThreshold(country: string): { value: number; currency: string; notes: string } {
  const entry = DE_MINIMIS_THRESHOLDS[country.toUpperCase()] || DE_MINIMIS_THRESHOLDS.DEFAULT;
  return { value: entry.value, currency: entry.currency, notes: entry.notes || '' };
}

export function checkDeMinimisEligibility(params: {
  destinationCountry: string;
  originCountry: string;
  hsCode?: string;
  declaredValue: number;
  currency?: string;
  shipmentsPerWeek?: number;
}): DeMinimisResult {
  const dest = params.destinationCountry.toUpperCase();
  const origin = params.originCountry.toUpperCase();
  const threshold = DE_MINIMIS_THRESHOLDS[dest] || DE_MINIMIS_THRESHOLDS.DEFAULT;
  const restrictions: string[] = [];

  // Value check
  if (params.declaredValue > threshold.value) {
    return {
      eligible: false,
      threshold: threshold.value,
      currency: threshold.currency,
      reason: `Declared value ${params.declaredValue} ${params.currency || threshold.currency} exceeds de minimis threshold of ${threshold.value} ${threshold.currency}.`,
      restrictions: [],
      alternativeEntry: dest === 'US' ? 'formal' : 'standard',
    };
  }

  // US-specific restrictions
  if (dest === 'US') {
    const originRestriction = RESTRICTED_ORIGINS_US[origin];
    if (originRestriction?.restricted) {
      restrictions.push(originRestriction.reason);

      // Check HS code for textile restriction
      if (params.hsCode) {
        const chapter = params.hsCode.replace(/[^0-9]/g, '').substring(0, 2);
        if (RESTRICTED_HS_CHAPTERS_US.has(chapter)) {
          return {
            eligible: false,
            threshold: threshold.value,
            currency: threshold.currency,
            reason: `${origin}-origin goods in HS Chapter ${chapter} (textiles/apparel) are restricted from Section 321 de minimis entry.`,
            restrictions,
            alternativeEntry: 'formal',
          };
        }
      }

      // Frequency restriction
      if (params.shipmentsPerWeek && params.shipmentsPerWeek > 5) {
        restrictions.push(`High shipment frequency (${params.shipmentsPerWeek}/week) may trigger CBP scrutiny under Section 321 reform proposals.`);
      }
    }
  }

  // Eligible
  return {
    eligible: true,
    threshold: threshold.value,
    currency: threshold.currency,
    reason: `Value ${params.declaredValue} ${params.currency || threshold.currency} is within de minimis threshold of ${threshold.value} ${threshold.currency}.`,
    restrictions,
  };
}
