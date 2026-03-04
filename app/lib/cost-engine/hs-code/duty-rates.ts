/**
 * POTAL HS Code Duty Rate Database
 *
 * Real MFN (Most Favored Nation) duty rates by HS Chapter
 * for major destination countries.
 *
 * Sources: US HTSUS, EU TARIC, Japan Customs, UK Trade Tariff,
 *          Australia Customs, Canada CBSA, Korea KCS
 *
 * Note: These are CHAPTER-LEVEL averages for common consumer goods.
 * Full 6-digit subheading rates will come in Phase 3 with database integration.
 *
 * Rates are expressed as decimals (0.12 = 12%)
 */

import type { HsCodeDutyRate } from './types';

// ─── Country-specific duty rates by HS Chapter ─────────────────

interface ChapterDutyProfile {
  /** HS Chapter (2 digits) */
  chapter: string;
  /** Country-specific MFN rates */
  rates: Record<string, number>;
}

/**
 * MFN Duty Rates by HS Chapter × Destination Country
 *
 * Countries: US, GB, DE/EU, JP, KR, AU, CA, CN
 * (EU countries share the same TARIC rates)
 */
const CHAPTER_DUTY_RATES: ChapterDutyProfile[] = [
  // Chapter 33: Cosmetics & Perfumes
  {
    chapter: '33',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.15,
    },
  },
  // Chapter 34: Soap, Candles
  {
    chapter: '34',
    rates: {
      US: 0.035, GB: 0.04, EU: 0.04, JP: 0.035, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
    },
  },
  // Chapter 39: Plastics
  {
    chapter: '39',
    rates: {
      US: 0.042, GB: 0.065, EU: 0.065, JP: 0.04, KR: 0.065, AU: 0.05, CA: 0.065, CN: 0.10,
    },
  },
  // Chapter 42: Leather Goods (bags, wallets)
  {
    chapter: '42',
    rates: {
      US: 0.08, GB: 0.03, EU: 0.03, JP: 0.10, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.10,
    },
  },
  // Chapter 49: Books
  {
    chapter: '49',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
    },
  },
  // Chapter 61: Knitted Apparel
  {
    chapter: '61',
    rates: {
      US: 0.16, GB: 0.12, EU: 0.12, JP: 0.105, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.16,
    },
  },
  // Chapter 62: Woven Apparel
  {
    chapter: '62',
    rates: {
      US: 0.15, GB: 0.12, EU: 0.12, JP: 0.10, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.16,
    },
  },
  // Chapter 63: Textile Articles (towels, bedding)
  {
    chapter: '63',
    rates: {
      US: 0.10, GB: 0.12, EU: 0.12, JP: 0.06, KR: 0.10, AU: 0.05, CA: 0.14, CN: 0.10,
    },
  },
  // Chapter 64: Footwear
  {
    chapter: '64',
    rates: {
      US: 0.12, GB: 0.08, EU: 0.08, JP: 0.30, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.24,
    },
  },
  // Chapter 65: Headwear
  {
    chapter: '65',
    rates: {
      US: 0.075, GB: 0.025, EU: 0.025, JP: 0.06, KR: 0.08, AU: 0.05, CA: 0.095, CN: 0.10,
    },
  },
  // Chapter 69: Ceramics
  {
    chapter: '69',
    rates: {
      US: 0.06, GB: 0.05, EU: 0.05, JP: 0.03, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.12,
    },
  },
  // Chapter 71: Jewelry
  {
    chapter: '71',
    rates: {
      US: 0.065, GB: 0.025, EU: 0.025, JP: 0.055, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.20,
    },
  },
  // Chapter 73: Iron/Steel articles
  {
    chapter: '73',
    rates: {
      US: 0.034, GB: 0.028, EU: 0.028, JP: 0.03, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
    },
  },
  // Chapter 84: Machinery & Computers
  {
    chapter: '84',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      // ITA (Information Technology Agreement) — most IT products are duty-free
    },
  },
  // Chapter 85: Electrical/Electronics
  {
    chapter: '85',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      // ITA products: phones, laptops, headphones mostly 0%
      // Exception: some consumer electronics like TVs may have duties
    },
  },
  // Chapter 87: Vehicles (bicycles, e-bikes)
  {
    chapter: '87',
    rates: {
      US: 0.11, GB: 0.14, EU: 0.14, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.13, CN: 0.20,
    },
  },
  // Chapter 90: Optical/Medical
  {
    chapter: '90',
    rates: {
      US: 0.02, GB: 0.028, EU: 0.028, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.05, CN: 0.10,
    },
  },
  // Chapter 91: Watches
  {
    chapter: '91',
    rates: {
      US: 0.06, GB: 0.045, EU: 0.045, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.05, CN: 0.20,
    },
  },
  // Chapter 94: Furniture
  {
    chapter: '94',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.05, CA: 0.08, CN: 0.0,
    },
  },
  // Chapter 95: Toys & Sports
  {
    chapter: '95',
    rates: {
      US: 0.0, GB: 0.047, EU: 0.047, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.07, CN: 0.10,
    },
  },
  // Chapter 96: Misc Manufactured
  {
    chapter: '96',
    rates: {
      US: 0.04, GB: 0.035, EU: 0.035, JP: 0.038, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
    },
  },
];

// ─── EU Member States ──────────────────────────────────────────
// All EU countries use the same Common External Tariff (CET/TARIC)

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// ─── Section 301 Additional Tariffs (US on China) ──────────────
// Simplified: additional tariff on top of MFN for CN→US

const SECTION_301_RATES: Record<string, number> = {
  '85': 0.25, // Electronics (List 3 — 25%)
  '84': 0.25, // Machinery/Computers
  '94': 0.25, // Furniture
  '39': 0.25, // Plastics
  '73': 0.25, // Steel articles
  '87': 0.25, // Vehicles/e-bikes
  '42': 0.075, // Leather goods (List 4A — 7.5%)
  '61': 0.075, // Knitted apparel
  '62': 0.075, // Woven apparel
  '64': 0.075, // Footwear
  '95': 0.075, // Toys
  '71': 0.075, // Jewelry
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Get the duty rate for a given HS Code going to a destination country.
 *
 * @param hsCode - 4+ digit HS Code
 * @param destinationCountry - ISO 2-letter country code
 * @param originCountry - ISO 2-letter country code (for Section 301, etc.)
 * @returns Duty rate info, or null if no specific rate found
 */
export function getDutyRate(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): HsCodeDutyRate | null {
  const chapter = hsCode.substring(0, 2);
  const dest = destinationCountry.toUpperCase();
  const origin = originCountry?.toUpperCase();

  // Find chapter rate profile
  const profile = CHAPTER_DUTY_RATES.find((p) => p.chapter === chapter);
  if (!profile) return null;

  // Resolve country key (EU members → EU rate)
  const rateKey = EU_COUNTRIES.has(dest) ? 'EU' : dest;
  const mfnRate = profile.rates[rateKey];

  if (mfnRate === undefined) return null;

  const result: HsCodeDutyRate = {
    hsCode,
    destinationCountry: dest,
    originCountry: origin,
    mfnRate,
  };

  // Section 301: Additional tariff for China → US
  if (dest === 'US' && origin === 'CN') {
    const additionalRate = SECTION_301_RATES[chapter];
    if (additionalRate !== undefined) {
      result.additionalTariff = additionalRate;
      result.notes = `Section 301 tariff: +${(additionalRate * 100).toFixed(1)}% on China origin`;
    }
  }

  return result;
}

/**
 * Get total effective duty rate (MFN + additional tariffs)
 */
export function getEffectiveDutyRate(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): number {
  const rate = getDutyRate(hsCode, destinationCountry, originCountry);
  if (!rate) return 0;

  return rate.mfnRate + (rate.additionalTariff || 0) + (rate.antiDumpingRate || 0);
}

/**
 * Check if the destination country has specific duty data
 */
export function hasCountryDutyData(countryCode: string): boolean {
  const code = countryCode.toUpperCase();
  if (EU_COUNTRIES.has(code)) return true;
  // Check if any chapter has rate for this country
  return CHAPTER_DUTY_RATES.some((p) => p.rates[code] !== undefined);
}

/**
 * Check if a country is an EU member (same tariff schedule)
 */
export function isEuMember(countryCode: string): boolean {
  return EU_COUNTRIES.has(countryCode.toUpperCase());
}
