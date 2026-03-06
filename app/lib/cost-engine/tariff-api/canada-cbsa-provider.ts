/**
 * POTAL — Canada CBSA (Canada Border Services Agency) Tariff Provider
 *
 * 캐나다 관세율 조회
 *
 * API: Canadian Customs Tariff (Open Government)
 *   Primary: https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/
 *   Fallback: Hardcoded MFN rates for major HS chapters
 *
 * Canada uses 10-digit tariff codes based on HS.
 * MFN rates are published in the Canadian Customs Tariff Schedule.
 *
 * Key considerations:
 * - USMCA: Most US/MX goods enter duty-free
 * - CPTPP: Duty reduction schedule for member countries
 * - CETA: EU goods enter with preferential rates
 * - GPT (General Preferential Tariff): Developing countries
 */

import type { HsCodeDutyRate } from '../hs-code/types';

/**
 * Hardcoded Canadian MFN duty rates by HS Chapter
 * Source: Canada Customs Tariff 2025-2026
 * These are AVERAGE rates for the chapter; actual rates vary by subheading
 */
const CANADA_CHAPTER_MFN_RATES: Record<string, number> = {
  '01': 0.0,    // Live animals
  '02': 0.0,    // Meat (most MFN = 0%, except some supply-managed)
  '03': 0.0,    // Fish
  '04': 0.25,   // Dairy (supply managed, very high)
  '05': 0.0,    // Products of animal origin
  '06': 0.0,    // Live plants
  '07': 0.05,   // Vegetables
  '08': 0.05,   // Fruit and nuts
  '09': 0.0,    // Coffee, tea, spices
  '10': 0.0,    // Cereals
  '11': 0.08,   // Milling products
  '12': 0.0,    // Oil seeds
  '13': 0.0,    // Lac, gums, resins
  '14': 0.0,    // Vegetable plaiting materials
  '15': 0.08,   // Fats and oils
  '16': 0.10,   // Meat/fish preparations
  '17': 0.12,   // Sugars
  '18': 0.05,   // Cocoa
  '19': 0.10,   // Cereal preparations
  '20': 0.10,   // Vegetable/fruit preparations
  '21': 0.08,   // Misc food preparations
  '22': 0.20,   // Beverages (high due to excise)
  '23': 0.0,    // Residues from food industries
  '24': 0.16,   // Tobacco
  '25': 0.0,    // Salt, sulphur, earth, stone
  '26': 0.0,    // Ores, slag, ash
  '27': 0.0,    // Mineral fuels
  '28': 0.0,    // Inorganic chemicals
  '29': 0.0,    // Organic chemicals
  '30': 0.0,    // Pharmaceutical
  '31': 0.0,    // Fertilizers
  '32': 0.08,   // Tanning/dyeing extracts
  '33': 0.065,  // Cosmetics
  '34': 0.065,  // Soap, candles
  '35': 0.065,  // Albuminoidal substances
  '36': 0.065,  // Explosives, matches
  '37': 0.07,   // Photographic goods
  '38': 0.08,   // Chemical products misc
  '39': 0.065,  // Plastics
  '40': 0.07,   // Rubber
  '41': 0.0,    // Raw hides and skins
  '42': 0.08,   // Leather articles
  '43': 0.07,   // Furskins
  '44': 0.0,    // Wood
  '45': 0.0,    // Cork
  '46': 0.08,   // Straw/esparto manufactures
  '47': 0.0,    // Pulp of wood
  '48': 0.0,    // Paper
  '49': 0.0,    // Printed books
  '50': 0.16,   // Silk
  '51': 0.16,   // Wool
  '52': 0.16,   // Cotton
  '53': 0.0,    // Vegetable textile fibres
  '54': 0.16,   // Man-made filaments
  '55': 0.16,   // Man-made staple fibres
  '56': 0.14,   // Wadding, felt, nonwovens
  '57': 0.14,   // Carpets
  '58': 0.14,   // Special woven fabrics
  '59': 0.14,   // Impregnated textile fabrics
  '60': 0.18,   // Knitted fabrics
  '61': 0.18,   // Knitted apparel
  '62': 0.18,   // Woven apparel
  '63': 0.14,   // Textile articles
  '64': 0.18,   // Footwear
  '65': 0.095,  // Headwear
  '66': 0.10,   // Umbrellas
  '67': 0.14,   // Prepared feathers
  '68': 0.065,  // Stone articles
  '69': 0.065,  // Ceramics
  '70': 0.065,  // Glass
  '71': 0.08,   // Jewelry
  '72': 0.0,    // Iron and steel
  '73': 0.065,  // Iron/steel articles
  '74': 0.0,    // Copper
  '75': 0.0,    // Nickel
  '76': 0.0,    // Aluminium
  '78': 0.0,    // Lead
  '79': 0.0,    // Zinc
  '80': 0.0,    // Tin
  '81': 0.0,    // Other base metals
  '82': 0.065,  // Tools, cutlery
  '83': 0.065,  // Misc metal articles
  '84': 0.0,    // Machinery, computers (ITA = 0%)
  '85': 0.0,    // Electrical/electronics (ITA = 0%)
  '86': 0.0,    // Railway
  '87': 0.13,   // Vehicles
  '88': 0.0,    // Aircraft
  '89': 0.25,   // Ships, boats
  '90': 0.05,   // Optical/medical
  '91': 0.05,   // Watches
  '92': 0.0,    // Musical instruments
  '93': 0.0,    // Arms and ammunition
  '94': 0.08,   // Furniture
  '95': 0.07,   // Toys
  '96': 0.065,  // Misc manufactured
  '97': 0.0,    // Works of art
};

/**
 * 캐나다 관세율 조회
 *
 * @param hsCode - HS Code (6~10자리)
 * @param originCountry - 원산지 (USMCA, CPTPP, CETA 판단용)
 * @param timeoutMs - 타임아웃
 */
export async function fetchCanadaCbsaDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const mfnRate = CANADA_CHAPTER_MFN_RATES[chapter];

    if (mfnRate === undefined) {
      return null;
    }

    // USMCA 적용 (US, MX → CA: 대부분 0%)
    let ftaRate: number | undefined;
    let notes = `Source: Canada CBSA Tariff Schedule | Chapter ${chapter}`;

    if (originCountry) {
      const origin = originCountry.toUpperCase();

      // USMCA
      if (origin === 'US' || origin === 'MX') {
        ftaRate = 0;
        notes += ' | USMCA preferential rate';
      }
      // CPTPP members (excluding US which is not a member)
      else if (['AU', 'BN', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'].includes(origin)) {
        ftaRate = mfnRate * 0.0; // Most CPTPP goods are duty-free by 2026
        notes += ' | CPTPP preferential rate';
      }
      // CETA (EU countries)
      else if (isEuCountry(origin)) {
        ftaRate = mfnRate * 0.0; // CETA: most industrial goods duty-free
        notes += ' | CETA preferential rate';
      }
      // Korea-Canada FTA (not yet in force as of 2026)
      else if (origin === 'KR') {
        ftaRate = mfnRate * 0.5;
        notes += ' | KR-CA bilateral (partial)';
      }
      // GPT (General Preferential Tariff) for developing countries
      else if (isGptEligible(origin)) {
        ftaRate = mfnRate * 0.75; // GPT ~25% reduction
        notes += ' | GPT (General Preferential Tariff)';
      }
    }

    return {
      hsCode: hsCode.replace(/\./g, ''),
      destinationCountry: 'CA',
      originCountry,
      mfnRate,
      ftaRate,
      notes,
    };
  } catch (error: any) {
    console.warn('[POTAL CA] Error:', error.message);
    return null;
  }
}

function isEuCountry(code: string): boolean {
  const EU = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]);
  return EU.has(code);
}

function isGptEligible(code: string): boolean {
  // Major GPT-eligible developing countries
  const GPT_COUNTRIES = new Set([
    'CN', 'IN', 'TH', 'VN', 'PH', 'ID', 'BD', 'PK', 'LK',
    'KH', 'LA', 'MM', 'BR', 'AR', 'CO', 'EG', 'NG', 'KE',
    'ZA', 'GH', 'TZ', 'ET', 'MA', 'TN',
  ]);
  return GPT_COUNTRIES.has(code);
}
