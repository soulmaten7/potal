/**
 * POTAL Cost Engine — Global Country Data
 *
 * VAT/GST rates, import duty averages, de minimis thresholds,
 * and currency info for 58+ countries.
 *
 * Sources: WTO, WCO, national customs authorities
 * Last updated: 2026-03
 *
 * NOTE: These are AVERAGE/STANDARD rates. Actual rates vary by HS Code.
 * Future: HS Code-specific lookup will override these defaults.
 */

export interface CountryTaxProfile {
  /** ISO 3166-1 alpha-2 code */
  code: string;
  /** Country name (English) */
  name: string;
  /** Region grouping */
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East' | 'Africa' | 'Oceania';
  /** VAT/GST rate (decimal, e.g. 0.20 = 20%) */
  vatRate: number;
  /** VAT/GST label for display */
  vatLabel: 'VAT' | 'GST' | 'Sales Tax' | 'CT' | 'JCT' | 'IVA' | 'ICMS' | 'IGV' | 'SST' | 'None';
  /** Average import duty rate for consumer goods (decimal) */
  avgDutyRate: number;
  /** De minimis threshold in local currency (below = duty-free) */
  deMinimis: number;
  /** De minimis currency */
  deMinimsCurrency: string;
  /** De minimis in USD (approximate) */
  deMinimisUsd: number;
  /** Local currency ISO code */
  currency: string;
  /** Has FTA with major exporters (simplified) */
  hasFtaWithChina: boolean;
  /** Additional notes */
  notes?: string;
}

// ─── Country Database ────────────────────────────────

export const COUNTRY_DATA: Record<string, CountryTaxProfile> = {
  // ═══ NORTH AMERICA ═══
  US: {
    code: 'US', name: 'United States', region: 'North America',
    vatRate: 0, vatLabel: 'Sales Tax', avgDutyRate: 0.05, // state-level sales tax handled separately
    deMinimis: 0, deMinimsCurrency: 'USD', deMinimisUsd: 0, // eliminated for CN Aug 2025
    currency: 'USD', hasFtaWithChina: false,
    notes: 'State sales tax varies 0-10.25%. China de minimis eliminated Aug 2025.'
  },
  CA: {
    code: 'CA', name: 'Canada', region: 'North America',
    vatRate: 0.05, vatLabel: 'GST', avgDutyRate: 0.08,
    deMinimis: 20, deMinimsCurrency: 'CAD', deMinimisUsd: 15,
    currency: 'CAD', hasFtaWithChina: false,
    notes: 'GST 5% federal + PST/HST varies by province (0-10%).'
  },
  MX: {
    code: 'MX', name: 'Mexico', region: 'North America',
    vatRate: 0.16, vatLabel: 'IVA', avgDutyRate: 0.15,
    deMinimis: 50, deMinimsCurrency: 'USD', deMinimisUsd: 50,
    currency: 'MXN', hasFtaWithChina: false,
  },

  // ═══ EUROPE ═══
  GB: {
    code: 'GB', name: 'United Kingdom', region: 'Europe',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.04,
    deMinimis: 135, deMinimsCurrency: 'GBP', deMinimisUsd: 170,
    currency: 'GBP', hasFtaWithChina: false,
    notes: 'VAT collected at point of sale for goods ≤£135.'
  },
  DE: {
    code: 'DE', name: 'Germany', region: 'Europe',
    vatRate: 0.19, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
    notes: 'EU IOSS for goods ≤€150. VAT always applies.'
  },
  FR: {
    code: 'FR', name: 'France', region: 'Europe',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  IT: {
    code: 'IT', name: 'Italy', region: 'Europe',
    vatRate: 0.22, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  ES: {
    code: 'ES', name: 'Spain', region: 'Europe',
    vatRate: 0.21, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  NL: {
    code: 'NL', name: 'Netherlands', region: 'Europe',
    vatRate: 0.21, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  BE: {
    code: 'BE', name: 'Belgium', region: 'Europe',
    vatRate: 0.21, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  AT: {
    code: 'AT', name: 'Austria', region: 'Europe',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  SE: {
    code: 'SE', name: 'Sweden', region: 'Europe',
    vatRate: 0.25, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'SEK', hasFtaWithChina: false,
  },
  DK: {
    code: 'DK', name: 'Denmark', region: 'Europe',
    vatRate: 0.25, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'DKK', hasFtaWithChina: false,
  },
  FI: {
    code: 'FI', name: 'Finland', region: 'Europe',
    vatRate: 0.255, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  NO: {
    code: 'NO', name: 'Norway', region: 'Europe',
    vatRate: 0.25, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 350, deMinimsCurrency: 'NOK', deMinimisUsd: 33,
    currency: 'NOK', hasFtaWithChina: false,
    notes: 'VOEC scheme: VAT at point of sale for ≤NOK 3000.'
  },
  CH: {
    code: 'CH', name: 'Switzerland', region: 'Europe',
    vatRate: 0.081, vatLabel: 'VAT', avgDutyRate: 0.03,
    deMinimis: 5, deMinimsCurrency: 'CHF', deMinimisUsd: 5.60,
    currency: 'CHF', hasFtaWithChina: false,
    notes: 'De minimis based on duty amount, not goods value.'
  },
  PL: {
    code: 'PL', name: 'Poland', region: 'Europe',
    vatRate: 0.23, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'PLN', hasFtaWithChina: false,
  },
  IE: {
    code: 'IE', name: 'Ireland', region: 'Europe',
    vatRate: 0.23, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  PT: {
    code: 'PT', name: 'Portugal', region: 'Europe',
    vatRate: 0.23, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  GR: {
    code: 'GR', name: 'Greece', region: 'Europe',
    vatRate: 0.24, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'EUR', hasFtaWithChina: false,
  },
  CZ: {
    code: 'CZ', name: 'Czech Republic', region: 'Europe',
    vatRate: 0.21, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'CZK', hasFtaWithChina: false,
  },
  RO: {
    code: 'RO', name: 'Romania', region: 'Europe',
    vatRate: 0.19, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'RON', hasFtaWithChina: false,
  },
  HU: {
    code: 'HU', name: 'Hungary', region: 'Europe',
    vatRate: 0.27, vatLabel: 'VAT', avgDutyRate: 0.042,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'HUF', hasFtaWithChina: false,
  },

  // ═══ ASIA PACIFIC ═══
  JP: {
    code: 'JP', name: 'Japan', region: 'Asia Pacific',
    vatRate: 0.10, vatLabel: 'JCT', avgDutyRate: 0.05,
    deMinimis: 10000, deMinimsCurrency: 'JPY', deMinimisUsd: 67,
    currency: 'JPY', hasFtaWithChina: true,
    notes: 'RCEP member. De minimis ¥10,000 for customs duty.'
  },
  KR: {
    code: 'KR', name: 'South Korea', region: 'Asia Pacific',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.08,
    deMinimis: 150, deMinimsCurrency: 'USD', deMinimisUsd: 150,
    currency: 'KRW', hasFtaWithChina: true,
    notes: 'FTA with China. De minimis $150 USD.'
  },
  CN: {
    code: 'CN', name: 'China', region: 'Asia Pacific',
    vatRate: 0.13, vatLabel: 'VAT', avgDutyRate: 0.098,
    deMinimis: 50, deMinimsCurrency: 'CNY', deMinimisUsd: 7,
    currency: 'CNY', hasFtaWithChina: false,
    notes: 'Cross-border e-commerce has separate tax regime (9.1% composite).'
  },
  HK: {
    code: 'HK', name: 'Hong Kong', region: 'Asia Pacific',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0,
    deMinimis: 0, deMinimsCurrency: 'HKD', deMinimisUsd: 0,
    currency: 'HKD', hasFtaWithChina: true,
    notes: 'Free port. No customs duty, no VAT/GST.'
  },
  TW: {
    code: 'TW', name: 'Taiwan', region: 'Asia Pacific',
    vatRate: 0.05, vatLabel: 'VAT', avgDutyRate: 0.065,
    deMinimis: 2000, deMinimsCurrency: 'TWD', deMinimisUsd: 63,
    currency: 'TWD', hasFtaWithChina: false,
  },
  SG: {
    code: 'SG', name: 'Singapore', region: 'Asia Pacific',
    vatRate: 0.09, vatLabel: 'GST', avgDutyRate: 0,
    deMinimis: 400, deMinimsCurrency: 'SGD', deMinimisUsd: 300,
    currency: 'SGD', hasFtaWithChina: true,
    notes: 'Zero customs duty on most goods. GST on imports >$400 SGD.'
  },
  AU: {
    code: 'AU', name: 'Australia', region: 'Oceania',
    vatRate: 0.10, vatLabel: 'GST', avgDutyRate: 0.05,
    deMinimis: 1000, deMinimsCurrency: 'AUD', deMinimisUsd: 650,
    currency: 'AUD', hasFtaWithChina: true,
    notes: 'ChAFTA with China. GST on all imports. Duty de minimis AUD 1000.'
  },
  NZ: {
    code: 'NZ', name: 'New Zealand', region: 'Oceania',
    vatRate: 0.15, vatLabel: 'GST', avgDutyRate: 0.05,
    deMinimis: 1000, deMinimsCurrency: 'NZD', deMinimisUsd: 600,
    currency: 'NZD', hasFtaWithChina: true,
    notes: 'FTA with China. GST collected at border.'
  },
  IN: {
    code: 'IN', name: 'India', region: 'Asia Pacific',
    vatRate: 0.18, vatLabel: 'GST', avgDutyRate: 0.20,
    deMinimis: 0, deMinimsCurrency: 'INR', deMinimisUsd: 0,
    currency: 'INR', hasFtaWithChina: false,
    notes: 'No de minimis. IGST on all imports. BCD varies widely.'
  },
  TH: {
    code: 'TH', name: 'Thailand', region: 'Asia Pacific',
    vatRate: 0.07, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 1500, deMinimsCurrency: 'THB', deMinimisUsd: 43,
    currency: 'THB', hasFtaWithChina: true,
  },
  VN: {
    code: 'VN', name: 'Vietnam', region: 'Asia Pacific',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 1000000, deMinimsCurrency: 'VND', deMinimisUsd: 40,
    currency: 'VND', hasFtaWithChina: true,
  },
  MY: {
    code: 'MY', name: 'Malaysia', region: 'Asia Pacific',
    vatRate: 0.08, vatLabel: 'SST', avgDutyRate: 0.08,
    deMinimis: 500, deMinimsCurrency: 'MYR', deMinimisUsd: 110,
    currency: 'MYR', hasFtaWithChina: true,
  },
  PH: {
    code: 'PH', name: 'Philippines', region: 'Asia Pacific',
    vatRate: 0.12, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 10000, deMinimsCurrency: 'PHP', deMinimisUsd: 175,
    currency: 'PHP', hasFtaWithChina: true,
  },
  ID: {
    code: 'ID', name: 'Indonesia', region: 'Asia Pacific',
    vatRate: 0.11, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 3, deMinimsCurrency: 'USD', deMinimisUsd: 3,
    currency: 'IDR', hasFtaWithChina: true,
    notes: 'Very low de minimis (USD 3). VAT on all imports.'
  },

  // ═══ MIDDLE EAST ═══
  AE: {
    code: 'AE', name: 'United Arab Emirates', region: 'Middle East',
    vatRate: 0.05, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 1000, deMinimsCurrency: 'AED', deMinimisUsd: 272,
    currency: 'AED', hasFtaWithChina: false,
  },
  SA: {
    code: 'SA', name: 'Saudi Arabia', region: 'Middle East',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 1000, deMinimsCurrency: 'SAR', deMinimisUsd: 267,
    currency: 'SAR', hasFtaWithChina: false,
  },
  IL: {
    code: 'IL', name: 'Israel', region: 'Middle East',
    vatRate: 0.17, vatLabel: 'VAT', avgDutyRate: 0.08,
    deMinimis: 75, deMinimsCurrency: 'USD', deMinimisUsd: 75,
    currency: 'ILS', hasFtaWithChina: false,
  },
  TR: {
    code: 'TR', name: 'Turkey', region: 'Middle East',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 150, deMinimsCurrency: 'EUR', deMinimisUsd: 160,
    currency: 'TRY', hasFtaWithChina: false,
  },
  QA: {
    code: 'QA', name: 'Qatar', region: 'Middle East',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0.05,
    deMinimis: 0, deMinimsCurrency: 'QAR', deMinimisUsd: 0,
    currency: 'QAR', hasFtaWithChina: false,
    notes: 'No VAT. Customs duty 5% on most goods.'
  },
  KW: {
    code: 'KW', name: 'Kuwait', region: 'Middle East',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0.05,
    deMinimis: 0, deMinimsCurrency: 'KWD', deMinimisUsd: 0,
    currency: 'KWD', hasFtaWithChina: false,
  },

  // ═══ LATIN AMERICA ═══
  BR: {
    code: 'BR', name: 'Brazil', region: 'Latin America',
    vatRate: 0.17, vatLabel: 'ICMS', avgDutyRate: 0.20,
    deMinimis: 50, deMinimsCurrency: 'USD', deMinimisUsd: 50,
    currency: 'BRL', hasFtaWithChina: false,
    notes: 'Complex tax: II + IPI + ICMS + PIS/COFINS. Remessa Conforme program.'
  },
  CL: {
    code: 'CL', name: 'Chile', region: 'Latin America',
    vatRate: 0.19, vatLabel: 'IVA', avgDutyRate: 0.06,
    deMinimis: 30, deMinimsCurrency: 'USD', deMinimisUsd: 30,
    currency: 'CLP', hasFtaWithChina: true,
  },
  CO: {
    code: 'CO', name: 'Colombia', region: 'Latin America',
    vatRate: 0.19, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 200, deMinimsCurrency: 'USD', deMinimisUsd: 200,
    currency: 'COP', hasFtaWithChina: false,
  },
  AR: {
    code: 'AR', name: 'Argentina', region: 'Latin America',
    vatRate: 0.21, vatLabel: 'IVA', avgDutyRate: 0.18,
    deMinimis: 50, deMinimsCurrency: 'USD', deMinimisUsd: 50,
    currency: 'ARS', hasFtaWithChina: false,
    notes: 'Additional perception taxes on imports.'
  },
  PE: {
    code: 'PE', name: 'Peru', region: 'Latin America',
    vatRate: 0.18, vatLabel: 'IGV', avgDutyRate: 0.06,
    deMinimis: 200, deMinimsCurrency: 'USD', deMinimisUsd: 200,
    currency: 'PEN', hasFtaWithChina: true,
  },

  // ═══ AFRICA ═══
  ZA: {
    code: 'ZA', name: 'South Africa', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 500, deMinimsCurrency: 'ZAR', deMinimisUsd: 27,
    currency: 'ZAR', hasFtaWithChina: false,
  },
  NG: {
    code: 'NG', name: 'Nigeria', region: 'Africa',
    vatRate: 0.075, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'NGN', deMinimisUsd: 0,
    currency: 'NGN', hasFtaWithChina: false,
  },
  EG: {
    code: 'EG', name: 'Egypt', region: 'Africa',
    vatRate: 0.14, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'EGP', deMinimisUsd: 0,
    currency: 'EGP', hasFtaWithChina: false,
  },
  KE: {
    code: 'KE', name: 'Kenya', region: 'Africa',
    vatRate: 0.16, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'KES', deMinimisUsd: 0,
    currency: 'KES', hasFtaWithChina: false,
  },
  MA: {
    code: 'MA', name: 'Morocco', region: 'Africa',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'MAD', deMinimisUsd: 0,
    currency: 'MAD', hasFtaWithChina: false,
  },
};

// ─── Helper Functions ────────────────────────────────

/**
 * Get country profile by ISO code (case-insensitive)
 */
export function getCountryProfile(code: string): CountryTaxProfile | null {
  return COUNTRY_DATA[code.toUpperCase()] || null;
}

/**
 * Get all supported country codes
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_DATA);
}

/**
 * Get countries grouped by region
 */
export function getCountriesByRegion(): Record<string, CountryTaxProfile[]> {
  const groups: Record<string, CountryTaxProfile[]> = {};
  for (const country of Object.values(COUNTRY_DATA)) {
    if (!groups[country.region]) groups[country.region] = [];
    groups[country.region].push(country);
  }
  return groups;
}

/**
 * Get total number of supported countries
 */
export function getCountryCount(): number {
  return Object.keys(COUNTRY_DATA).length;
}
