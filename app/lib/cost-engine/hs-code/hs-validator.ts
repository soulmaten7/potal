/**
 * POTAL F012 — HS Code Validation
 *
 * Validates HS codes against the WCO HS 2022 database.
 * Checks format, existence, chapter/heading validity,
 * and country-specific tariff line existence.
 */

import { HS_DATABASE, getHsEntry } from './hs-database';

// ─── Types ──────────────────────────────────────────

export interface HsValidationResult {
  /** Whether the HS code is valid */
  valid: boolean;
  /** Validation status: 'valid' | 'invalid_format' | 'invalid_code' | 'partial_match' */
  status: 'valid' | 'invalid_format' | 'invalid_code' | 'partial_match';
  /** The normalized HS code (dots removed, trimmed) */
  normalizedCode: string;
  /** Number of digits */
  digits: number;
  /** Chapter (first 2 digits) */
  chapter?: string;
  /** Chapter description */
  chapterDescription?: string;
  /** Heading (first 4 digits) */
  heading?: string;
  /** Subheading (6 digits) — international standard */
  subheading?: string;
  /** Full entry from database (if found) */
  entry?: {
    code: string;
    description: string;
    category: string;
  };
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Suggestions if code is invalid */
  suggestions?: { code: string; description: string }[];
}

// ─── Chapter Descriptions ────────────────────────────

const CHAPTER_DESCRIPTIONS: Record<string, string> = {
  '01': 'Live animals', '02': 'Meat and edible meat offal',
  '03': 'Fish, crustaceans, molluscs', '04': 'Dairy produce, eggs, honey',
  '05': 'Products of animal origin', '06': 'Live trees, plants, bulbs',
  '07': 'Edible vegetables', '08': 'Edible fruit and nuts',
  '09': 'Coffee, tea, mate, spices', '10': 'Cereals',
  '11': 'Products of milling industry', '12': 'Oil seeds, oleaginous fruits',
  '13': 'Lac, gums, resins', '14': 'Vegetable plaiting materials',
  '15': 'Animal/vegetable fats and oils', '16': 'Preparations of meat/fish',
  '17': 'Sugars and sugar confectionery', '18': 'Cocoa and cocoa preparations',
  '19': 'Preparations of cereals, flour', '20': 'Preparations of vegetables/fruit',
  '21': 'Miscellaneous edible preparations', '22': 'Beverages, spirits, vinegar',
  '23': 'Residues from food industries', '24': 'Tobacco and manufactured tobacco',
  '25': 'Salt, sulphur, earths, stone', '26': 'Ores, slag and ash',
  '27': 'Mineral fuels, oils', '28': 'Inorganic chemicals',
  '29': 'Organic chemicals', '30': 'Pharmaceutical products',
  '31': 'Fertilisers', '32': 'Tanning/dyeing extracts, paints',
  '33': 'Essential oils, perfumery, cosmetics', '34': 'Soap, waxes, candles',
  '35': 'Albuminoidal substances, glues', '36': 'Explosives, pyrotechnics',
  '37': 'Photographic/cinematographic goods', '38': 'Miscellaneous chemical products',
  '39': 'Plastics and articles thereof', '40': 'Rubber and articles thereof',
  '41': 'Raw hides and skins, leather', '42': 'Articles of leather',
  '43': 'Furskins and artificial fur', '44': 'Wood and articles of wood',
  '45': 'Cork and articles of cork', '46': 'Manufactures of straw/plaiting materials',
  '47': 'Pulp of wood', '48': 'Paper and paperboard',
  '49': 'Printed books, newspapers', '50': 'Silk',
  '51': 'Wool, fine/coarse animal hair', '52': 'Cotton',
  '53': 'Other vegetable textile fibres', '54': 'Man-made filaments',
  '55': 'Man-made staple fibres', '56': 'Wadding, felt, nonwovens',
  '57': 'Carpets and other textile floor coverings', '58': 'Special woven fabrics',
  '59': 'Impregnated/coated textile fabrics', '60': 'Knitted or crocheted fabrics',
  '61': 'Articles of apparel, knitted', '62': 'Articles of apparel, not knitted',
  '63': 'Other made up textile articles', '64': 'Footwear, gaiters',
  '65': 'Headgear and parts thereof', '66': 'Umbrellas, walking-sticks',
  '67': 'Prepared feathers, artificial flowers', '68': 'Articles of stone, plaster, cement',
  '69': 'Ceramic products', '70': 'Glass and glassware',
  '71': 'Natural/cultured pearls, precious stones', '72': 'Iron and steel',
  '73': 'Articles of iron or steel', '74': 'Copper and articles thereof',
  '75': 'Nickel and articles thereof', '76': 'Aluminium and articles thereof',
  '78': 'Lead and articles thereof', '79': 'Zinc and articles thereof',
  '80': 'Tin and articles thereof', '81': 'Other base metals',
  '82': 'Tools, cutlery of base metal', '83': 'Miscellaneous articles of base metal',
  '84': 'Nuclear reactors, boilers, machinery', '85': 'Electrical machinery and equipment',
  '86': 'Railway/tramway locomotives', '87': 'Vehicles other than railway',
  '88': 'Aircraft, spacecraft', '89': 'Ships, boats',
  '90': 'Optical, photographic, measuring instruments', '91': 'Clocks and watches',
  '92': 'Musical instruments', '93': 'Arms and ammunition',
  '94': 'Furniture, lighting, signs', '95': 'Toys, games, sports equipment',
  '96': 'Miscellaneous manufactured articles', '97': 'Works of art, antiques',
};

// ─── Validator ──────────────────────────────────────

/**
 * Validate an HS code against the WCO HS 2022 database.
 */
export function validateHsCode(hsCode: string): HsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Normalize: remove dots, spaces, dashes
  const normalized = hsCode.replace(/[\s.\-]/g, '');

  // Check basic format
  if (!normalized || normalized.length === 0) {
    return {
      valid: false,
      status: 'invalid_format',
      normalizedCode: '',
      digits: 0,
      errors: ['HS code is empty.'],
      warnings: [],
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      status: 'invalid_format',
      normalizedCode: normalized,
      digits: normalized.length,
      errors: ['HS code must contain only digits.'],
      warnings: [],
    };
  }

  if (normalized.length < 2) {
    return {
      valid: false,
      status: 'invalid_format',
      normalizedCode: normalized,
      digits: normalized.length,
      errors: ['HS code must be at least 2 digits (chapter level).'],
      warnings: [],
    };
  }

  if (normalized.length > 10) {
    errors.push('HS code exceeds 10 digits. Standard HS codes are 6 digits (international) or up to 10 digits (national).');
  }

  const chapter = normalized.substring(0, 2);
  const heading = normalized.length >= 4 ? normalized.substring(0, 4) : undefined;
  const subheading = normalized.length >= 6 ? normalized.substring(0, 6) : undefined;

  // Validate chapter
  const chNum = parseInt(chapter, 10);
  if (chNum < 1 || chNum > 97 || chNum === 77) {
    errors.push(`Chapter ${chapter} is not a valid HS chapter. Valid range: 01-76, 78-97 (chapter 77 is reserved).`);
    return {
      valid: false,
      status: 'invalid_code',
      normalizedCode: normalized,
      digits: normalized.length,
      chapter,
      errors,
      warnings,
    };
  }

  const chapterDescription = CHAPTER_DESCRIPTIONS[chapter];

  // Check against HS database (6-digit level)
  let entry: { code: string; description: string; category: string } | undefined;
  let suggestions: { code: string; description: string }[] | undefined;

  if (subheading) {
    const dbEntry = getHsEntry(subheading);
    if (dbEntry) {
      entry = { code: dbEntry.code, description: dbEntry.description, category: dbEntry.category };
    } else {
      // Try to find similar codes in the same heading
      const headingPrefix = normalized.substring(0, 4);
      const similar = HS_DATABASE
        .filter(e => e.code.startsWith(headingPrefix))
        .slice(0, 5)
        .map(e => ({ code: e.code, description: e.description }));

      if (similar.length > 0) {
        suggestions = similar;
        warnings.push(`HS code ${subheading} not found in database. Similar codes in heading ${headingPrefix} are available.`);
      } else {
        errors.push(`HS code ${subheading} not found in the HS 2022 database.`);
      }
    }
  } else if (heading) {
    // 4-digit heading — check if any codes exist under this heading
    const headingCodes = HS_DATABASE.filter(e => e.code.startsWith(heading));
    if (headingCodes.length > 0) {
      warnings.push(`${heading} is a 4-digit heading. Provide 6 digits for subheading-level precision.`);
      suggestions = headingCodes.slice(0, 5).map(e => ({ code: e.code, description: e.description }));
    } else {
      errors.push(`Heading ${heading} not found in the HS 2022 database.`);
    }
  }

  if (normalized.length > 6) {
    warnings.push(`Digits beyond 6 (${normalized.substring(6)}) are country-specific tariff line codes. International standard is 6 digits.`);
  }

  const valid = errors.length === 0;

  return {
    valid,
    status: valid ? (entry ? 'valid' : 'partial_match') : 'invalid_code',
    normalizedCode: normalized,
    digits: normalized.length,
    chapter,
    chapterDescription,
    heading,
    subheading,
    entry,
    errors,
    warnings,
    suggestions,
  };
}
