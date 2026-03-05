/**
 * POTAL HS Code Duty Rate Database
 *
 * Real MFN (Most Favored Nation) duty rates by HS Chapter
 * for major destination countries.
 *
 * Sources: US HTSUS, EU TARIC, Japan Customs, UK Trade Tariff,
 *          Australia Customs, Canada CBSA, Korea KCS, ASEAN AFTA,
 *          India SCCN, Brazil TIPI, Mexico TLC
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
 * Countries:
 *   - Existing (8): US, GB, EU, JP, KR, AU, CA, CN
 *   - New (13): IN, TH, VN, SG, MY, ID, PH, TW, HK, MX, BR, IL, TR, CO, CL, AE, SA, ZA, NZ, NO, CH
 *
 * Total: 40+ HS Chapters covering all major product categories
 * (EU countries use EU rate; HK and SG are 0% for most products as free ports)
 */
const CHAPTER_DUTY_RATES: ChapterDutyProfile[] = [
  // Chapter 02: Meat and Edible Meat Offal
  {
    chapter: '02',
    rates: {
      US: 0.12, GB: 0.15, EU: 0.15, JP: 0.15, KR: 0.20, AU: 0.0, CA: 0.0, CN: 0.12,
      IN: 0.30, TH: 0.15, VN: 0.10, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.10,
      HK: 0.0, MX: 0.20, BR: 0.15, IL: 0.10, TR: 0.15, CO: 0.20, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.15, CH: 0.10,
    },
  },
  // Chapter 03: Fish and Crustaceans
  {
    chapter: '03',
    rates: {
      US: 0.10, GB: 0.10, EU: 0.10, JP: 0.08, KR: 0.15, AU: 0.0, CA: 0.0, CN: 0.10,
      IN: 0.20, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.05,
      HK: 0.0, MX: 0.15, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.15, CL: 0.0, AE: 0.05,
      SA: 0.05, ZA: 0.0, NZ: 0.0, NO: 0.05, CH: 0.03,
    },
  },
  // Chapter 04: Dairy, Eggs, Honey
  {
    chapter: '04',
    rates: {
      US: 0.25, GB: 0.35, EU: 0.35, JP: 0.35, KR: 0.25, AU: 0.0, CA: 0.25, CN: 0.20,
      IN: 0.30, TH: 0.20, VN: 0.15, SG: 0.0, MY: 0.15, ID: 0.15, PH: 0.15, TW: 0.15,
      HK: 0.0, MX: 0.20, BR: 0.25, IL: 0.15, TR: 0.20, CO: 0.25, CL: 0.10, AE: 0.05,
      SA: 0.05, ZA: 0.15, NZ: 0.0, NO: 0.25, CH: 0.12,
    },
  },
  // Chapter 07: Edible Vegetables
  {
    chapter: '07',
    rates: {
      US: 0.06, GB: 0.08, EU: 0.08, JP: 0.10, KR: 0.10, AU: 0.0, CA: 0.05, CN: 0.10,
      IN: 0.15, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.05,
      HK: 0.0, MX: 0.08, BR: 0.12, IL: 0.05, TR: 0.08, CO: 0.10, CL: 0.0, AE: 0.05,
      SA: 0.05, ZA: 0.0, NZ: 0.0, NO: 0.08, CH: 0.03,
    },
  },
  // Chapter 08: Edible Fruit and Nuts
  {
    chapter: '08',
    rates: {
      US: 0.05, GB: 0.08, EU: 0.08, JP: 0.08, KR: 0.15, AU: 0.0, CA: 0.05, CN: 0.12,
      IN: 0.15, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.05,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.05, TR: 0.08, CO: 0.10, CL: 0.0, AE: 0.05,
      SA: 0.05, ZA: 0.0, NZ: 0.0, NO: 0.08, CH: 0.03,
    },
  },
  // Chapter 09: Coffee, Tea, Spices
  {
    chapter: '09',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.08,
      IN: 0.10, TH: 0.0, VN: 0.0, SG: 0.0, MY: 0.0, ID: 0.0, PH: 0.0, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.0, IL: 0.0, TR: 0.08, CO: 0.0, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 15: Animal or Vegetable Oils and Fats
  {
    chapter: '15',
    rates: {
      US: 0.08, GB: 0.10, EU: 0.10, JP: 0.10, KR: 0.08, AU: 0.0, CA: 0.08, CN: 0.10,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.08,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.15, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.05, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 16: Meat, Fish and Seafood Preparations
  {
    chapter: '16',
    rates: {
      US: 0.10, GB: 0.12, EU: 0.12, JP: 0.12, KR: 0.18, AU: 0.0, CA: 0.10, CN: 0.15,
      IN: 0.25, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.10,
      HK: 0.0, MX: 0.15, BR: 0.15, IL: 0.08, TR: 0.12, CO: 0.18, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.05, NZ: 0.0, NO: 0.10, CH: 0.08,
    },
  },
  // Chapter 17: Sugars and Sugar Confectionery
  {
    chapter: '17',
    rates: {
      US: 0.15, GB: 0.12, EU: 0.12, JP: 0.15, KR: 0.15, AU: 0.0, CA: 0.12, CN: 0.20,
      IN: 0.20, TH: 0.15, VN: 0.15, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.12,
      HK: 0.0, MX: 0.15, BR: 0.18, IL: 0.10, TR: 0.15, CO: 0.20, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.10, NZ: 0.0, NO: 0.15, CH: 0.08,
    },
  },
  // Chapter 18: Cocoa and Cocoa Preparations
  {
    chapter: '18',
    rates: {
      US: 0.05, GB: 0.08, EU: 0.08, JP: 0.08, KR: 0.10, AU: 0.0, CA: 0.05, CN: 0.12,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.08, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 19: Cereal, Flour, Starch Preparations
  {
    chapter: '19',
    rates: {
      US: 0.12, GB: 0.10, EU: 0.10, JP: 0.15, KR: 0.12, AU: 0.0, CA: 0.10, CN: 0.15,
      IN: 0.18, TH: 0.12, VN: 0.12, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.12, BR: 0.14, IL: 0.08, TR: 0.12, CO: 0.15, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.12, CH: 0.06,
    },
  },
  // Chapter 20: Vegetable, Fruit, Nut Food Preparations
  {
    chapter: '20',
    rates: {
      US: 0.10, GB: 0.10, EU: 0.10, JP: 0.12, KR: 0.15, AU: 0.0, CA: 0.10, CN: 0.15,
      IN: 0.18, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.12, BR: 0.14, IL: 0.08, TR: 0.10, CO: 0.15, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.06,
    },
  },
  // Chapter 21: Miscellaneous Edible Preparations
  {
    chapter: '21',
    rates: {
      US: 0.08, GB: 0.10, EU: 0.10, JP: 0.10, KR: 0.10, AU: 0.0, CA: 0.08, CN: 0.12,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 22: Beverages and Vinegar
  {
    chapter: '22',
    rates: {
      US: 0.15, GB: 0.20, EU: 0.20, JP: 0.15, KR: 0.20, AU: 0.05, CA: 0.20, CN: 0.50,
      IN: 0.25, TH: 0.25, VN: 0.20, SG: 0.0, MY: 0.20, ID: 0.20, PH: 0.20, TW: 0.20,
      HK: 0.0, MX: 0.20, BR: 0.25, IL: 0.15, TR: 0.20, CO: 0.25, CL: 0.25, AE: 0.05,
      SA: 0.05, ZA: 0.20, NZ: 0.0, NO: 0.25, CH: 0.12,
    },
  },
  // Chapter 27: Mineral Fuels, Oils, Wax
  {
    chapter: '27',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.05,
      IN: 0.05, TH: 0.0, VN: 0.0, SG: 0.0, MY: 0.0, ID: 0.0, PH: 0.0, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.0, IL: 0.0, TR: 0.0, CO: 0.0, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 30: Pharmaceutical Products
  {
    chapter: '30',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.08,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.08, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.05, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 32: Tanning, Dyeing Extracts, Paints, Varnish
  {
    chapter: '32',
    rates: {
      US: 0.07, GB: 0.07, EU: 0.07, JP: 0.08, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.10,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 33: Cosmetics & Perfumes
  {
    chapter: '33',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.15,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 34: Soap, Candles
  {
    chapter: '34',
    rates: {
      US: 0.035, GB: 0.04, EU: 0.04, JP: 0.035, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.15, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.08, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 38: Miscellaneous Chemical Products
  {
    chapter: '38',
    rates: {
      US: 0.07, GB: 0.06, EU: 0.06, JP: 0.07, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.10,
      IN: 0.12, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.08, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 39: Plastics
  {
    chapter: '39',
    rates: {
      US: 0.042, GB: 0.065, EU: 0.065, JP: 0.04, KR: 0.065, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.08, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 40: Rubber and Articles
  {
    chapter: '40',
    rates: {
      US: 0.05, GB: 0.08, EU: 0.08, JP: 0.05, KR: 0.08, AU: 0.05, CA: 0.07, CN: 0.10,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.08, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 42: Leather Goods (bags, wallets)
  {
    chapter: '42',
    rates: {
      US: 0.08, GB: 0.03, EU: 0.03, JP: 0.10, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.10,
      IN: 0.20, TH: 0.15, VN: 0.15, SG: 0.0, MY: 0.12, ID: 0.12, PH: 0.12, TW: 0.12,
      HK: 0.0, MX: 0.12, BR: 0.15, IL: 0.10, TR: 0.12, CO: 0.15, CL: 0.10, AE: 0.05,
      SA: 0.05, ZA: 0.10, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 44: Wood and Articles
  {
    chapter: '44',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.08,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.0, ID: 0.0, PH: 0.0, TW: 0.0,
      HK: 0.0, MX: 0.05, BR: 0.0, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 48: Paper and Paperboard
  {
    chapter: '48',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.08,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.0,
      HK: 0.0, MX: 0.05, BR: 0.08, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 49: Books
  {
    chapter: '49',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      IN: 0.0, TH: 0.0, VN: 0.0, SG: 0.0, MY: 0.0, ID: 0.0, PH: 0.0, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.0, IL: 0.0, TR: 0.0, CO: 0.0, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 50: Silk
  {
    chapter: '50',
    rates: {
      US: 0.14, GB: 0.12, EU: 0.12, JP: 0.08, KR: 0.13, AU: 0.05, CA: 0.16, CN: 0.16,
      IN: 0.18, TH: 0.12, VN: 0.12, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.12,
      HK: 0.0, MX: 0.12, BR: 0.14, IL: 0.10, TR: 0.12, CO: 0.14, CL: 0.08, AE: 0.05,
      SA: 0.05, ZA: 0.10, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 51: Wool and Fine Hair
  {
    chapter: '51',
    rates: {
      US: 0.12, GB: 0.12, EU: 0.12, JP: 0.08, KR: 0.13, AU: 0.0, CA: 0.16, CN: 0.16,
      IN: 0.18, TH: 0.12, VN: 0.12, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.12,
      HK: 0.0, MX: 0.12, BR: 0.14, IL: 0.10, TR: 0.12, CO: 0.14, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.05, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 52: Cotton
  {
    chapter: '52',
    rates: {
      US: 0.14, GB: 0.12, EU: 0.12, JP: 0.08, KR: 0.13, AU: 0.05, CA: 0.16, CN: 0.16,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 54: Man-made Filaments
  {
    chapter: '54',
    rates: {
      US: 0.12, GB: 0.12, EU: 0.12, JP: 0.08, KR: 0.13, AU: 0.05, CA: 0.16, CN: 0.16,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 55: Man-made Staple Fibers
  {
    chapter: '55',
    rates: {
      US: 0.12, GB: 0.12, EU: 0.12, JP: 0.08, KR: 0.13, AU: 0.05, CA: 0.16, CN: 0.16,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 61: Knitted Apparel
  {
    chapter: '61',
    rates: {
      US: 0.16, GB: 0.12, EU: 0.12, JP: 0.105, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.16,
      IN: 0.20, TH: 0.15, VN: 0.15, SG: 0.0, MY: 0.12, ID: 0.12, PH: 0.12, TW: 0.14,
      HK: 0.0, MX: 0.14, BR: 0.16, IL: 0.12, TR: 0.14, CO: 0.16, CL: 0.08, AE: 0.05,
      SA: 0.05, ZA: 0.12, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 62: Woven Apparel
  {
    chapter: '62',
    rates: {
      US: 0.15, GB: 0.12, EU: 0.12, JP: 0.10, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.16,
      IN: 0.20, TH: 0.15, VN: 0.15, SG: 0.0, MY: 0.12, ID: 0.12, PH: 0.12, TW: 0.14,
      HK: 0.0, MX: 0.14, BR: 0.16, IL: 0.12, TR: 0.14, CO: 0.16, CL: 0.08, AE: 0.05,
      SA: 0.05, ZA: 0.12, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 63: Textile Articles (towels, bedding)
  {
    chapter: '63',
    rates: {
      US: 0.10, GB: 0.12, EU: 0.12, JP: 0.06, KR: 0.10, AU: 0.05, CA: 0.14, CN: 0.10,
      IN: 0.18, TH: 0.12, VN: 0.12, SG: 0.0, MY: 0.10, ID: 0.10, PH: 0.10, TW: 0.12,
      HK: 0.0, MX: 0.12, BR: 0.14, IL: 0.10, TR: 0.12, CO: 0.14, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.10, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 64: Footwear
  {
    chapter: '64',
    rates: {
      US: 0.12, GB: 0.08, EU: 0.08, JP: 0.30, KR: 0.13, AU: 0.05, CA: 0.18, CN: 0.24,
      IN: 0.25, TH: 0.20, VN: 0.20, SG: 0.0, MY: 0.15, ID: 0.15, PH: 0.15, TW: 0.18,
      HK: 0.0, MX: 0.16, BR: 0.18, IL: 0.12, TR: 0.16, CO: 0.18, CL: 0.10, AE: 0.05,
      SA: 0.05, ZA: 0.12, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 65: Headwear
  {
    chapter: '65',
    rates: {
      US: 0.075, GB: 0.025, EU: 0.025, JP: 0.06, KR: 0.08, AU: 0.05, CA: 0.095, CN: 0.10,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 66: Umbrellas, Sunshades, Whips
  {
    chapter: '66',
    rates: {
      US: 0.08, GB: 0.05, EU: 0.05, JP: 0.06, KR: 0.08, AU: 0.05, CA: 0.10, CN: 0.12,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.10, CH: 0.05,
    },
  },
  // Chapter 68: Stone and Plaster Articles
  {
    chapter: '68',
    rates: {
      US: 0.06, GB: 0.06, EU: 0.06, JP: 0.04, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.10, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 69: Ceramics
  {
    chapter: '69',
    rates: {
      US: 0.06, GB: 0.05, EU: 0.05, JP: 0.03, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.12,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 70: Glass and Glassware
  {
    chapter: '70',
    rates: {
      US: 0.05, GB: 0.06, EU: 0.06, JP: 0.04, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.10, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 71: Jewelry
  {
    chapter: '71',
    rates: {
      US: 0.065, GB: 0.025, EU: 0.025, JP: 0.055, KR: 0.08, AU: 0.05, CA: 0.08, CN: 0.20,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 73: Iron/Steel articles
  {
    chapter: '73',
    rates: {
      US: 0.034, GB: 0.028, EU: 0.028, JP: 0.03, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 74: Copper and Articles
  {
    chapter: '74',
    rates: {
      US: 0.0, GB: 0.02, EU: 0.02, JP: 0.01, KR: 0.08, AU: 0.0, CA: 0.0, CN: 0.10,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.05,
      HK: 0.0, MX: 0.05, BR: 0.08, IL: 0.03, TR: 0.05, CO: 0.08, CL: 0.02, AE: 0.05,
      SA: 0.05, ZA: 0.03, NZ: 0.0, NO: 0.02, CH: 0.0,
    },
  },
  // Chapter 76: Aluminum and Articles
  {
    chapter: '76',
    rates: {
      US: 0.0, GB: 0.02, EU: 0.02, JP: 0.01, KR: 0.08, AU: 0.0, CA: 0.0, CN: 0.10,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.05,
      HK: 0.0, MX: 0.05, BR: 0.08, IL: 0.03, TR: 0.05, CO: 0.08, CL: 0.02, AE: 0.05,
      SA: 0.05, ZA: 0.03, NZ: 0.0, NO: 0.02, CH: 0.0,
    },
  },
  // Chapter 82: Tools and Cutlery
  {
    chapter: '82',
    rates: {
      US: 0.04, GB: 0.04, EU: 0.04, JP: 0.05, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.12,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 83: Miscellaneous Articles of Base Metal
  {
    chapter: '83',
    rates: {
      US: 0.05, GB: 0.04, EU: 0.04, JP: 0.05, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.12,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.06, CH: 0.03,
    },
  },
  // Chapter 84: Machinery & Computers
  {
    chapter: '84',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.05, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.03, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 85: Electrical/Electronics
  {
    chapter: '85',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.05, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.03, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 87: Vehicles (bicycles, e-bikes)
  {
    chapter: '87',
    rates: {
      US: 0.11, GB: 0.14, EU: 0.14, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.13, CN: 0.20,
      IN: 0.25, TH: 0.15, VN: 0.15, SG: 0.0, MY: 0.12, ID: 0.12, PH: 0.12, TW: 0.14,
      HK: 0.0, MX: 0.14, BR: 0.16, IL: 0.10, TR: 0.14, CO: 0.16, CL: 0.08, AE: 0.05,
      SA: 0.05, ZA: 0.10, NZ: 0.0, NO: 0.12, CH: 0.05,
    },
  },
  // Chapter 90: Optical/Medical
  {
    chapter: '90',
    rates: {
      US: 0.02, GB: 0.028, EU: 0.028, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.05, CN: 0.10,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.05, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.03, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 91: Watches
  {
    chapter: '91',
    rates: {
      US: 0.06, GB: 0.045, EU: 0.045, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.05, CN: 0.20,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 92: Musical Instruments
  {
    chapter: '92',
    rates: {
      US: 0.0, GB: 0.02, EU: 0.02, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.08,
      IN: 0.10, TH: 0.05, VN: 0.05, SG: 0.0, MY: 0.03, ID: 0.03, PH: 0.03, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.05, IL: 0.0, TR: 0.05, CO: 0.05, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
    },
  },
  // Chapter 94: Furniture
  {
    chapter: '94',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.05, CA: 0.08, CN: 0.0,
      IN: 0.10, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.05, ID: 0.05, PH: 0.05, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.05, TR: 0.08, CO: 0.10, CL: 0.05, AE: 0.05,
      SA: 0.05, ZA: 0.05, NZ: 0.0, NO: 0.08, CH: 0.0,
    },
  },
  // Chapter 95: Toys & Sports
  {
    chapter: '95',
    rates: {
      US: 0.0, GB: 0.047, EU: 0.047, JP: 0.0, KR: 0.08, AU: 0.05, CA: 0.07, CN: 0.10,
      IN: 0.15, TH: 0.10, VN: 0.10, SG: 0.0, MY: 0.08, ID: 0.08, PH: 0.08, TW: 0.10,
      HK: 0.0, MX: 0.10, BR: 0.12, IL: 0.08, TR: 0.10, CO: 0.12, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.08, NZ: 0.0, NO: 0.08, CH: 0.05,
    },
  },
  // Chapter 96: Misc Manufactured
  {
    chapter: '96',
    rates: {
      US: 0.04, GB: 0.035, EU: 0.035, JP: 0.038, KR: 0.08, AU: 0.05, CA: 0.065, CN: 0.10,
      IN: 0.12, TH: 0.08, VN: 0.08, SG: 0.0, MY: 0.06, ID: 0.06, PH: 0.06, TW: 0.08,
      HK: 0.0, MX: 0.08, BR: 0.10, IL: 0.06, TR: 0.08, CO: 0.10, CL: 0.06, AE: 0.05,
      SA: 0.05, ZA: 0.06, NZ: 0.0, NO: 0.08, CH: 0.03,
    },
  },
  // Chapter 97: Works of Art, Antiques
  {
    chapter: '97',
    rates: {
      US: 0.0, GB: 0.0, EU: 0.0, JP: 0.0, KR: 0.0, AU: 0.0, CA: 0.0, CN: 0.0,
      IN: 0.0, TH: 0.0, VN: 0.0, SG: 0.0, MY: 0.0, ID: 0.0, PH: 0.0, TW: 0.0,
      HK: 0.0, MX: 0.0, BR: 0.0, IL: 0.0, TR: 0.0, CO: 0.0, CL: 0.0, AE: 0.0,
      SA: 0.0, ZA: 0.0, NZ: 0.0, NO: 0.0, CH: 0.0,
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
