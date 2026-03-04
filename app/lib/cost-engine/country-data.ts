/**
 * POTAL Cost Engine — Global Country Data
 *
 * VAT/GST rates, import duty averages, de minimis thresholds,
 * and currency info for 130+ countries.
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
  region: string;
  /** VAT/GST rate (decimal, e.g. 0.20 = 20%) */
  vatRate: number;
  /** VAT/GST label for display */
  vatLabel: string;
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
  BG: {
    code: 'BG', name: 'Bulgaria', region: 'Europe',
    vatRate: 0.20, vatLabel: 'DDC', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'BGN', deMinimisUsd: 0,
    currency: 'BGN', hasFtaWithChina: false,
  },
  HR: {
    code: 'HR', name: 'Croatia', region: 'Europe',
    vatRate: 0.25, vatLabel: 'PDV', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  SK: {
    code: 'SK', name: 'Slovakia', region: 'Europe',
    vatRate: 0.20, vatLabel: 'DPH', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  SI: {
    code: 'SI', name: 'Slovenia', region: 'Europe',
    vatRate: 0.22, vatLabel: 'DDV', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  LT: {
    code: 'LT', name: 'Lithuania', region: 'Europe',
    vatRate: 0.21, vatLabel: 'PVM', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  LV: {
    code: 'LV', name: 'Latvia', region: 'Europe',
    vatRate: 0.21, vatLabel: 'PVN', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  EE: {
    code: 'EE', name: 'Estonia', region: 'Europe',
    vatRate: 0.22, vatLabel: 'KM', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  CY: {
    code: 'CY', name: 'Cyprus', region: 'Europe',
    vatRate: 0.19, vatLabel: 'FPA', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  MT: {
    code: 'MT', name: 'Malta', region: 'Europe',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  LU: {
    code: 'LU', name: 'Luxembourg', region: 'Europe',
    vatRate: 0.17, vatLabel: 'TVA', avgDutyRate: 0.045,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  IS: {
    code: 'IS', name: 'Iceland', region: 'Europe',
    vatRate: 0.24, vatLabel: 'VSK', avgDutyRate: 0.03,
    deMinimis: 0, deMinimsCurrency: 'ISK', deMinimisUsd: 0,
    currency: 'ISK', hasFtaWithChina: false,
  },
  RS: {
    code: 'RS', name: 'Serbia', region: 'Europe',
    vatRate: 0.20, vatLabel: 'PDV', avgDutyRate: 0.10,
    deMinimis: 50, deMinimsCurrency: 'EUR', deMinimisUsd: 50,
    currency: 'RSD', hasFtaWithChina: false,
  },
  UA: {
    code: 'UA', name: 'Ukraine', region: 'Europe',
    vatRate: 0.20, vatLabel: 'PDV', avgDutyRate: 0.10,
    deMinimis: 100, deMinimsCurrency: 'EUR', deMinimisUsd: 100,
    currency: 'UAH', hasFtaWithChina: false,
  },
  BA: {
    code: 'BA', name: 'Bosnia', region: 'Europe',
    vatRate: 0.17, vatLabel: 'PDV', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'BAM', deMinimisUsd: 0,
    currency: 'BAM', hasFtaWithChina: false,
  },
  ME: {
    code: 'ME', name: 'Montenegro', region: 'Europe',
    vatRate: 0.21, vatLabel: 'PDV', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'EUR', deMinimisUsd: 0,
    currency: 'EUR', hasFtaWithChina: false,
  },
  MK: {
    code: 'MK', name: 'North Macedonia', region: 'Europe',
    vatRate: 0.18, vatLabel: 'DDV', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'MKD', deMinimisUsd: 0,
    currency: 'MKD', hasFtaWithChina: false,
  },
  AL: {
    code: 'AL', name: 'Albania', region: 'Europe',
    vatRate: 0.20, vatLabel: 'TVSH', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'ALL', deMinimisUsd: 0,
    currency: 'ALL', hasFtaWithChina: false,
  },
  GE: {
    code: 'GE', name: 'Georgia', region: 'Europe',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 300, deMinimsCurrency: 'GEL', deMinimisUsd: 100,
    currency: 'GEL', hasFtaWithChina: false,
  },
  MD: {
    code: 'MD', name: 'Moldova', region: 'Europe',
    vatRate: 0.20, vatLabel: 'TVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'MDL', deMinimisUsd: 0,
    currency: 'MDL', hasFtaWithChina: false,
  },
  BY: {
    code: 'BY', name: 'Belarus', region: 'Europe',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 22, deMinimsCurrency: 'EUR', deMinimisUsd: 22,
    currency: 'BYN', hasFtaWithChina: false,
  },
  AM: {
    code: 'AM', name: 'Armenia', region: 'Europe',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'AMD', deMinimisUsd: 0,
    currency: 'AMD', hasFtaWithChina: false,
  },
  AZ: {
    code: 'AZ', name: 'Azerbaijan', region: 'Europe',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'AZN', deMinimisUsd: 0,
    currency: 'AZN', hasFtaWithChina: false,
  },

  // ═══ AMERICAS ═══
  EC: {
    code: 'EC', name: 'Ecuador', region: 'Americas',
    vatRate: 0.12, vatLabel: 'IVA', avgDutyRate: 0.12,
    deMinimis: 400, deMinimsCurrency: 'USD', deMinimisUsd: 400,
    currency: 'USD', hasFtaWithChina: false,
  },
  VE: {
    code: 'VE', name: 'Venezuela', region: 'Americas',
    vatRate: 0.16, vatLabel: 'IVA', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'VES', deMinimisUsd: 0,
    currency: 'VES', hasFtaWithChina: false,
  },
  BO: {
    code: 'BO', name: 'Bolivia', region: 'Americas',
    vatRate: 0.13, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'BOB', deMinimisUsd: 0,
    currency: 'BOB', hasFtaWithChina: false,
  },
  PY: {
    code: 'PY', name: 'Paraguay', region: 'Americas',
    vatRate: 0.10, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'PYG', deMinimisUsd: 0,
    currency: 'PYG', hasFtaWithChina: false,
  },
  UY: {
    code: 'UY', name: 'Uruguay', region: 'Americas',
    vatRate: 0.22, vatLabel: 'IVA', avgDutyRate: 0.12,
    deMinimis: 200, deMinimsCurrency: 'USD', deMinimisUsd: 200,
    currency: 'UYU', hasFtaWithChina: false,
  },
  CR: {
    code: 'CR', name: 'Costa Rica', region: 'Americas',
    vatRate: 0.13, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'CRC', deMinimisUsd: 0,
    currency: 'CRC', hasFtaWithChina: false,
  },
  PA: {
    code: 'PA', name: 'Panama', region: 'Americas',
    vatRate: 0.07, vatLabel: 'ITBMS', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'PAB', deMinimisUsd: 0,
    currency: 'PAB', hasFtaWithChina: false,
  },
  GT: {
    code: 'GT', name: 'Guatemala', region: 'Americas',
    vatRate: 0.12, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'GTQ', deMinimisUsd: 0,
    currency: 'GTQ', hasFtaWithChina: false,
  },
  HN: {
    code: 'HN', name: 'Honduras', region: 'Americas',
    vatRate: 0.15, vatLabel: 'ISV', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'HNL', deMinimisUsd: 0,
    currency: 'HNL', hasFtaWithChina: false,
  },
  SV: {
    code: 'SV', name: 'El Salvador', region: 'Americas',
    vatRate: 0.13, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'USD', deMinimisUsd: 0,
    currency: 'USD', hasFtaWithChina: false,
  },
  NI: {
    code: 'NI', name: 'Nicaragua', region: 'Americas',
    vatRate: 0.15, vatLabel: 'IVA', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'NIO', deMinimisUsd: 0,
    currency: 'NIO', hasFtaWithChina: false,
  },
  DO: {
    code: 'DO', name: 'Dominican Republic', region: 'Americas',
    vatRate: 0.18, vatLabel: 'ITBIS', avgDutyRate: 0.10,
    deMinimis: 200, deMinimsCurrency: 'USD', deMinimisUsd: 200,
    currency: 'DOP', hasFtaWithChina: false,
  },
  JM: {
    code: 'JM', name: 'Jamaica', region: 'Americas',
    vatRate: 0.15, vatLabel: 'GCT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'JMD', deMinimisUsd: 0,
    currency: 'JMD', hasFtaWithChina: false,
  },
  TT: {
    code: 'TT', name: 'Trinidad', region: 'Americas',
    vatRate: 0.125, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'TTD', deMinimisUsd: 0,
    currency: 'TTD', hasFtaWithChina: false,
  },
  CU: {
    code: 'CU', name: 'Cuba', region: 'Americas',
    vatRate: 0.20, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'CUP', deMinimisUsd: 0,
    currency: 'CUP', hasFtaWithChina: false,
  },
  PR: {
    code: 'PR', name: 'Puerto Rico', region: 'Americas',
    vatRate: 0.115, vatLabel: 'IVU', avgDutyRate: 0.05,
    deMinimis: 800, deMinimsCurrency: 'USD', deMinimisUsd: 800,
    currency: 'USD', hasFtaWithChina: false,
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
  PK: {
    code: 'PK', name: 'Pakistan', region: 'Asia',
    vatRate: 0.17, vatLabel: 'GST', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'PKR', deMinimisUsd: 0,
    currency: 'PKR', hasFtaWithChina: false,
  },
  BD: {
    code: 'BD', name: 'Bangladesh', region: 'Asia',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'BDT', deMinimisUsd: 0,
    currency: 'BDT', hasFtaWithChina: false,
  },
  LK: {
    code: 'LK', name: 'Sri Lanka', region: 'Asia',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'LKR', deMinimisUsd: 0,
    currency: 'LKR', hasFtaWithChina: false,
  },
  MM: {
    code: 'MM', name: 'Myanmar', region: 'Asia',
    vatRate: 0.05, vatLabel: 'CT', avgDutyRate: 0.05,
    deMinimis: 0, deMinimsCurrency: 'MMK', deMinimisUsd: 0,
    currency: 'MMK', hasFtaWithChina: false,
  },
  KH: {
    code: 'KH', name: 'Cambodia', region: 'Asia',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'KHR', deMinimisUsd: 0,
    currency: 'KHR', hasFtaWithChina: false,
  },
  LA: {
    code: 'LA', name: 'Laos', region: 'Asia',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.07,
    deMinimis: 0, deMinimsCurrency: 'LAK', deMinimisUsd: 0,
    currency: 'LAK', hasFtaWithChina: false,
  },
  NP: {
    code: 'NP', name: 'Nepal', region: 'Asia',
    vatRate: 0.13, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'NPR', deMinimisUsd: 0,
    currency: 'NPR', hasFtaWithChina: false,
  },
  MN: {
    code: 'MN', name: 'Mongolia', region: 'Asia',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 0, deMinimsCurrency: 'MNT', deMinimisUsd: 0,
    currency: 'MNT', hasFtaWithChina: false,
  },
  KZ: {
    code: 'KZ', name: 'Kazakhstan', region: 'Asia',
    vatRate: 0.12, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 200, deMinimsCurrency: 'EUR', deMinimisUsd: 200,
    currency: 'KZT', hasFtaWithChina: false,
  },
  UZ: {
    code: 'UZ', name: 'Uzbekistan', region: 'Asia',
    vatRate: 0.12, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'UZS', deMinimisUsd: 0,
    currency: 'UZS', hasFtaWithChina: false,
  },
  KG: {
    code: 'KG', name: 'Kyrgyzstan', region: 'Asia',
    vatRate: 0.12, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 200, deMinimsCurrency: 'EUR', deMinimisUsd: 200,
    currency: 'KGS', hasFtaWithChina: false,
  },
  TJ: {
    code: 'TJ', name: 'Tajikistan', region: 'Asia',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'TJS', deMinimisUsd: 0,
    currency: 'TJS', hasFtaWithChina: false,
  },
  TM: {
    code: 'TM', name: 'Turkmenistan', region: 'Asia',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'TMT', deMinimisUsd: 0,
    currency: 'TMT', hasFtaWithChina: false,
  },
  BN: {
    code: 'BN', name: 'Brunei', region: 'Asia',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0.03,
    deMinimis: 0, deMinimsCurrency: 'BND', deMinimisUsd: 0,
    currency: 'BND', hasFtaWithChina: false,
  },
  AF: {
    code: 'AF', name: 'Afghanistan', region: 'Asia',
    vatRate: 0, vatLabel: 'BRT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'AFN', deMinimisUsd: 0,
    currency: 'AFN', hasFtaWithChina: false,
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
  JO: {
    code: 'JO', name: 'Jordan', region: 'Middle East',
    vatRate: 0.16, vatLabel: 'GST', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'JOD', deMinimisUsd: 0,
    currency: 'JOD', hasFtaWithChina: false,
  },
  LB: {
    code: 'LB', name: 'Lebanon', region: 'Middle East',
    vatRate: 0.11, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 0, deMinimsCurrency: 'LBP', deMinimisUsd: 0,
    currency: 'LBP', hasFtaWithChina: false,
  },
  IQ: {
    code: 'IQ', name: 'Iraq', region: 'Middle East',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'IQD', deMinimisUsd: 0,
    currency: 'IQD', hasFtaWithChina: false,
  },
  IR: {
    code: 'IR', name: 'Iran', region: 'Middle East',
    vatRate: 0.09, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'IRR', deMinimisUsd: 0,
    currency: 'IRR', hasFtaWithChina: false,
  },
  YE: {
    code: 'YE', name: 'Yemen', region: 'Middle East',
    vatRate: 0.05, vatLabel: 'GST', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'YER', deMinimisUsd: 0,
    currency: 'YER', hasFtaWithChina: false,
  },
  OM: {
    code: 'OM', name: 'Oman', region: 'Middle East',
    vatRate: 0.05, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 1000, deMinimsCurrency: 'OMR', deMinimisUsd: 390,
    currency: 'OMR', hasFtaWithChina: false,
  },
  BH: {
    code: 'BH', name: 'Bahrain', region: 'Middle East',
    vatRate: 0.10, vatLabel: 'VAT', avgDutyRate: 0.05,
    deMinimis: 300, deMinimsCurrency: 'BHD', deMinimisUsd: 800,
    currency: 'BHD', hasFtaWithChina: false,
  },
  SY: {
    code: 'SY', name: 'Syria', region: 'Middle East',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'SYP', deMinimisUsd: 0,
    currency: 'SYP', hasFtaWithChina: false,
  },

  // ═══ LATIN AMERICA (continued) ═══
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
  TN: {
    code: 'TN', name: 'Tunisia', region: 'Africa',
    vatRate: 0.19, vatLabel: 'TVA', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'TND', deMinimisUsd: 0,
    currency: 'TND', hasFtaWithChina: false,
  },
  DZ: {
    code: 'DZ', name: 'Algeria', region: 'Africa',
    vatRate: 0.19, vatLabel: 'TVA', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'DZD', deMinimisUsd: 0,
    currency: 'DZD', hasFtaWithChina: false,
  },
  LY: {
    code: 'LY', name: 'Libya', region: 'Africa',
    vatRate: 0, vatLabel: 'None', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'LYD', deMinimisUsd: 0,
    currency: 'LYD', hasFtaWithChina: false,
  },
  GH: {
    code: 'GH', name: 'Ghana', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'GHS', deMinimisUsd: 0,
    currency: 'GHS', hasFtaWithChina: false,
  },
  CI: {
    code: 'CI', name: 'Ivory Coast', region: 'Africa',
    vatRate: 0.18, vatLabel: 'TVA', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'XOF', deMinimisUsd: 0,
    currency: 'XOF', hasFtaWithChina: false,
  },
  SN: {
    code: 'SN', name: 'Senegal', region: 'Africa',
    vatRate: 0.18, vatLabel: 'TVA', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'XOF', deMinimisUsd: 0,
    currency: 'XOF', hasFtaWithChina: false,
  },
  CM: {
    code: 'CM', name: 'Cameroon', region: 'Africa',
    vatRate: 0.1925, vatLabel: 'TVA', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'XAF', deMinimisUsd: 0,
    currency: 'XAF', hasFtaWithChina: false,
  },
  TZ: {
    code: 'TZ', name: 'Tanzania', region: 'Africa',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'TZS', deMinimisUsd: 0,
    currency: 'TZS', hasFtaWithChina: false,
  },
  UG: {
    code: 'UG', name: 'Uganda', region: 'Africa',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'UGX', deMinimisUsd: 0,
    currency: 'UGX', hasFtaWithChina: false,
  },
  ET: {
    code: 'ET', name: 'Ethiopia', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'ETB', deMinimisUsd: 0,
    currency: 'ETB', hasFtaWithChina: false,
  },
  RW: {
    code: 'RW', name: 'Rwanda', region: 'Africa',
    vatRate: 0.18, vatLabel: 'VAT', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'RWF', deMinimisUsd: 0,
    currency: 'RWF', hasFtaWithChina: false,
  },
  CD: {
    code: 'CD', name: 'DR Congo', region: 'Africa',
    vatRate: 0.16, vatLabel: 'TVA', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'CDF', deMinimisUsd: 0,
    currency: 'CDF', hasFtaWithChina: false,
  },
  AO: {
    code: 'AO', name: 'Angola', region: 'Africa',
    vatRate: 0.14, vatLabel: 'IVA', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'AOA', deMinimisUsd: 0,
    currency: 'AOA', hasFtaWithChina: false,
  },
  MZ: {
    code: 'MZ', name: 'Mozambique', region: 'Africa',
    vatRate: 0.17, vatLabel: 'IVA', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'MZN', deMinimisUsd: 0,
    currency: 'MZN', hasFtaWithChina: false,
  },
  MU: {
    code: 'MU', name: 'Mauritius', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'MUR', deMinimisUsd: 0,
    currency: 'MUR', hasFtaWithChina: false,
  },
  MG: {
    code: 'MG', name: 'Madagascar', region: 'Africa',
    vatRate: 0.20, vatLabel: 'TVA', avgDutyRate: 0.12,
    deMinimis: 0, deMinimsCurrency: 'MGA', deMinimisUsd: 0,
    currency: 'MGA', hasFtaWithChina: false,
  },
  BW: {
    code: 'BW', name: 'Botswana', region: 'Africa',
    vatRate: 0.14, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'BWP', deMinimisUsd: 0,
    currency: 'BWP', hasFtaWithChina: false,
  },
  ZW: {
    code: 'ZW', name: 'Zimbabwe', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'ZWL', deMinimisUsd: 0,
    currency: 'ZWL', hasFtaWithChina: false,
  },
  NA: {
    code: 'NA', name: 'Namibia', region: 'Africa',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'NAD', deMinimisUsd: 0,
    currency: 'NAD', hasFtaWithChina: false,
  },
  SD: {
    code: 'SD', name: 'Sudan', region: 'Africa',
    vatRate: 0.17, vatLabel: 'VAT', avgDutyRate: 0.15,
    deMinimis: 0, deMinimsCurrency: 'SDG', deMinimisUsd: 0,
    currency: 'SDG', hasFtaWithChina: false,
  },

  // ═══ OCEANIA ═══
  FJ: {
    code: 'FJ', name: 'Fiji', region: 'Oceania',
    vatRate: 0.15, vatLabel: 'VAT', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'FJD', deMinimisUsd: 0,
    currency: 'FJD', hasFtaWithChina: false,
  },
  PG: {
    code: 'PG', name: 'Papua New Guinea', region: 'Oceania',
    vatRate: 0.10, vatLabel: 'GST', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'PGK', deMinimisUsd: 0,
    currency: 'PGK', hasFtaWithChina: false,
  },
  WS: {
    code: 'WS', name: 'Samoa', region: 'Oceania',
    vatRate: 0.15, vatLabel: 'VAGST', avgDutyRate: 0.10,
    deMinimis: 0, deMinimsCurrency: 'WST', deMinimisUsd: 0,
    currency: 'WST', hasFtaWithChina: false,
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
