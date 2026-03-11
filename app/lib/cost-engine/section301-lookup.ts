/**
 * POTAL Section 301/232 Additional Tariff Lookup
 *
 * US-specific additional tariffs:
 * - Section 301: China tariffs (List 1/2/3/4a)
 * - Section 232: Steel (25%) and Aluminum (10%) tariffs
 *
 * These are ON TOP of regular MFN duties.
 */

// ─── Section 301 (China Tariffs) ────────────────────

/** Section 301 List definitions — HS chapter/heading ranges */
interface Section301List {
  name: string;
  rate: number;
  /** HS 2-digit chapters or 4-digit headings covered */
  hsPatterns: string[];
}

const SECTION_301_LISTS: Section301List[] = [
  {
    name: 'List 1',
    rate: 0.25,
    // Industrial machinery, electronics, aerospace — HS chapters 84, 85, 88, 90
    hsPatterns: ['84', '85', '88', '90'],
  },
  {
    name: 'List 2',
    rate: 0.25,
    // Chemicals, plastics, minerals — HS chapters 28, 29, 38, 39, 72, 73
    hsPatterns: ['28', '29', '38', '39', '72', '73'],
  },
  {
    name: 'List 3',
    rate: 0.25,
    // Broad range: furniture, textiles, food, etc.
    hsPatterns: ['94', '61', '62', '63', '64', '42', '03', '04', '07', '08', '16', '20', '21'],
  },
  {
    name: 'List 4A',
    rate: 0.075,
    // Consumer goods at reduced rate (was 15%, reduced to 7.5% in Phase One deal)
    hsPatterns: ['95', '65', '66', '67', '96', '43', '46', '57', '58', '59', '60', '68', '69', '70'],
  },
];

// ─── Section 232 (Steel & Aluminum) ────────────────

/** HS chapters for steel (72-73) and aluminum (76) */
const SECTION_232_STEEL_CHAPTERS = ['72', '73'];
const SECTION_232_ALUMINUM_CHAPTERS = ['76'];

/** Countries exempt from Section 232 (as of 2026) */
const SECTION_232_EXEMPT_COUNTRIES = new Set([
  'AU', // Australia
  'AR', // Argentina (quota)
  'BR', // Brazil (quota)
  'KR', // South Korea (quota)
]);

// ─── Types ─────────────────────────────────────────

export interface Section301Result {
  /** Whether Section 301 tariff applies */
  applies: boolean;
  /** Additional duty rate */
  rate: number;
  /** Which list */
  listName: string;
  /** Note for display */
  note: string;
}

export interface Section232Result {
  /** Whether Section 232 tariff applies */
  applies: boolean;
  /** Additional duty rate */
  rate: number;
  /** Material type */
  material: 'steel' | 'aluminum';
  /** Note for display */
  note: string;
}

export interface USAdditionalTariffResult {
  /** Total additional tariff rate */
  totalRate: number;
  /** Section 301 result */
  section301?: Section301Result;
  /** Section 232 result */
  section232?: Section232Result;
  /** Whether any additional tariffs apply */
  hasAdditionalTariffs: boolean;
}

// ─── Lookup Functions ──────────────────────────────

/**
 * Check if Section 301 tariffs apply (China → US only)
 */
export function checkSection301(
  originCountry: string,
  hsCode: string,
): Section301Result | null {
  if (originCountry !== 'CN') return null;

  const chapter = hsCode.substring(0, 2);
  const heading = hsCode.substring(0, 4);

  for (const list of SECTION_301_LISTS) {
    if (list.hsPatterns.includes(chapter) || list.hsPatterns.includes(heading)) {
      return {
        applies: true,
        rate: list.rate,
        listName: list.name,
        note: `Section 301 ${list.name}: +${(list.rate * 100).toFixed(1)}% (CN origin)`,
      };
    }
  }

  return null;
}

/**
 * Check if Section 232 tariffs apply (steel/aluminum → US)
 */
export function checkSection232(
  originCountry: string,
  hsCode: string,
): Section232Result | null {
  if (SECTION_232_EXEMPT_COUNTRIES.has(originCountry)) return null;

  const chapter = hsCode.substring(0, 2);

  if (SECTION_232_STEEL_CHAPTERS.includes(chapter)) {
    return {
      applies: true,
      rate: 0.25,
      material: 'steel',
      note: `Section 232 Steel: +25% (${originCountry} origin)`,
    };
  }

  if (SECTION_232_ALUMINUM_CHAPTERS.includes(chapter)) {
    return {
      applies: true,
      rate: 0.10,
      material: 'aluminum',
      note: `Section 232 Aluminum: +10% (${originCountry} origin)`,
    };
  }

  return null;
}

/**
 * Check all US additional tariffs for a product.
 * Only applies when destination = US.
 */
export function lookupUSAdditionalTariffs(
  originCountry: string,
  hsCode: string,
): USAdditionalTariffResult {
  const section301 = checkSection301(originCountry, hsCode) ?? undefined;
  const section232 = checkSection232(originCountry, hsCode) ?? undefined;

  const totalRate = (section301?.rate || 0) + (section232?.rate || 0);

  return {
    totalRate,
    section301,
    section232,
    hasAdditionalTariffs: totalRate > 0,
  };
}
