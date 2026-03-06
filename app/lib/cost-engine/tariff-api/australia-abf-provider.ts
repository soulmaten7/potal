/**
 * POTAL — Australia ABF (Australian Border Force) Tariff Provider
 *
 * 호주 관세율 조회
 *
 * Source: Australian Customs Tariff 2025-2026
 * - Most manufactured goods: 0-5%
 * - Apparel/textiles/footwear: 5%
 * - GST: 10% on all imports (handled separately in country-data.ts)
 * - De minimis: AUD 1,000 (duty only; GST always applies)
 *
 * Key FTAs:
 * - ChAFTA (China-Australia): Most goods duty-free by 2025
 * - AUSFTA (US-Australia): Duty-free for most goods
 * - AANZFTA (ASEAN-Australia-NZ): Graduated reductions
 * - CPTPP: Comprehensive coverage
 * - JAEPA (Japan): Duty-free for most goods
 * - KAFTA (Korea): Duty-free for most goods
 * - UK-AU FTA: Phased reduction to zero
 *
 * Note: Australia has relatively LOW tariffs (~2.5% average)
 * compared to most countries. ITA goods (electronics) = 0%.
 */

import type { HsCodeDutyRate } from '../hs-code/types';

/**
 * Hardcoded Australian MFN duty rates by HS Chapter
 * Source: Australian Customs Tariff Working Tariff 2025-2026
 */
const AUSTRALIA_CHAPTER_MFN_RATES: Record<string, number> = {
  '01': 0.0,    // Live animals
  '02': 0.0,    // Meat
  '03': 0.0,    // Fish
  '04': 0.0,    // Dairy
  '05': 0.0,    // Products of animal origin
  '06': 0.0,    // Live plants
  '07': 0.0,    // Vegetables
  '08': 0.0,    // Fruit and nuts
  '09': 0.0,    // Coffee, tea, spices
  '10': 0.0,    // Cereals
  '11': 0.0,    // Milling products
  '12': 0.0,    // Oil seeds
  '13': 0.0,    // Lac, gums, resins
  '14': 0.0,    // Vegetable plaiting materials
  '15': 0.0,    // Fats and oils
  '16': 0.0,    // Meat/fish preparations
  '17': 0.0,    // Sugars
  '18': 0.0,    // Cocoa
  '19': 0.0,    // Cereal preparations
  '20': 0.0,    // Vegetable/fruit preparations
  '21': 0.0,    // Misc food preparations
  '22': 0.05,   // Beverages
  '23': 0.0,    // Animal feed
  '24': 0.0,    // Tobacco (excise separate)
  '25': 0.0,    // Salt, minerals
  '26': 0.0,    // Ores
  '27': 0.0,    // Mineral fuels
  '28': 0.0,    // Inorganic chemicals
  '29': 0.0,    // Organic chemicals
  '30': 0.0,    // Pharmaceutical
  '31': 0.0,    // Fertilizers
  '32': 0.05,   // Tanning/dyeing
  '33': 0.05,   // Cosmetics
  '34': 0.05,   // Soap
  '35': 0.05,   // Albuminoidal
  '36': 0.05,   // Explosives
  '37': 0.05,   // Photographic
  '38': 0.05,   // Chemical products
  '39': 0.05,   // Plastics
  '40': 0.05,   // Rubber
  '41': 0.0,    // Raw hides
  '42': 0.05,   // Leather goods
  '43': 0.05,   // Furskins
  '44': 0.0,    // Wood
  '45': 0.0,    // Cork
  '46': 0.05,   // Straw manufactures
  '47': 0.0,    // Pulp
  '48': 0.0,    // Paper
  '49': 0.0,    // Printed books
  '50': 0.05,   // Silk
  '51': 0.0,    // Wool (Australia is major exporter)
  '52': 0.05,   // Cotton
  '53': 0.0,    // Vegetable textile fibres
  '54': 0.05,   // Man-made filaments
  '55': 0.05,   // Man-made staple fibres
  '56': 0.05,   // Wadding/felt
  '57': 0.05,   // Carpets
  '58': 0.05,   // Special woven fabrics
  '59': 0.05,   // Impregnated textiles
  '60': 0.05,   // Knitted fabrics
  '61': 0.05,   // Knitted apparel
  '62': 0.05,   // Woven apparel
  '63': 0.05,   // Textile articles
  '64': 0.05,   // Footwear
  '65': 0.05,   // Headwear
  '66': 0.05,   // Umbrellas
  '67': 0.05,   // Prepared feathers
  '68': 0.05,   // Stone articles
  '69': 0.05,   // Ceramics
  '70': 0.05,   // Glass
  '71': 0.05,   // Jewelry
  '72': 0.0,    // Iron and steel
  '73': 0.05,   // Iron/steel articles
  '74': 0.0,    // Copper
  '75': 0.0,    // Nickel
  '76': 0.0,    // Aluminium
  '78': 0.0,    // Lead
  '79': 0.0,    // Zinc
  '80': 0.0,    // Tin
  '81': 0.0,    // Other base metals
  '82': 0.05,   // Tools
  '83': 0.05,   // Misc metal articles
  '84': 0.0,    // Machinery (ITA = 0%)
  '85': 0.0,    // Electronics (ITA = 0%)
  '86': 0.0,    // Railway
  '87': 0.05,   // Vehicles
  '88': 0.0,    // Aircraft
  '89': 0.0,    // Ships
  '90': 0.05,   // Optical/medical
  '91': 0.05,   // Watches
  '92': 0.0,    // Musical instruments
  '93': 0.0,    // Arms
  '94': 0.05,   // Furniture
  '95': 0.05,   // Toys
  '96': 0.05,   // Misc manufactured
  '97': 0.0,    // Works of art
};

/**
 * 호주 관세율 조회
 */
export async function fetchAustraliaDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const mfnRate = AUSTRALIA_CHAPTER_MFN_RATES[chapter];

    if (mfnRate === undefined) {
      return null;
    }

    let ftaRate: number | undefined;
    let notes = `Source: Australian Customs Tariff | Chapter ${chapter}`;

    if (originCountry) {
      const origin = originCountry.toUpperCase();

      // ChAFTA (China-Australia) — most goods duty-free by 2025
      if (origin === 'CN') {
        ftaRate = 0;
        notes += ' | ChAFTA (duty-free)';
      }
      // AUSFTA (US-Australia)
      else if (origin === 'US') {
        ftaRate = 0;
        notes += ' | AUSFTA (duty-free)';
      }
      // JAEPA (Japan-Australia)
      else if (origin === 'JP') {
        ftaRate = 0;
        notes += ' | JAEPA (duty-free)';
      }
      // KAFTA (Korea-Australia)
      else if (origin === 'KR') {
        ftaRate = 0;
        notes += ' | KAFTA (duty-free)';
      }
      // UK-AU FTA
      else if (origin === 'GB') {
        ftaRate = 0;
        notes += ' | UK-AU FTA (duty-free)';
      }
      // CPTPP members
      else if (['BN', 'CA', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'].includes(origin)) {
        ftaRate = 0;
        notes += ' | CPTPP (duty-free)';
      }
      // AANZFTA (ASEAN-Australia-NZ)
      else if (['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'].includes(origin)) {
        ftaRate = mfnRate * 0.0;
        notes += ' | AANZFTA (duty-free)';
      }
      // India-Australia ECTA
      else if (origin === 'IN') {
        ftaRate = mfnRate * 0.0;
        notes += ' | AI-ECTA (duty-free on most goods)';
      }
      // EU (no FTA yet, but negotiations ongoing)
      else if (isEuCountry(origin)) {
        // No FTA - MFN applies
        notes += ' | MFN (no EU-AU FTA yet)';
      }
    }

    return {
      hsCode: hsCode.replace(/\./g, ''),
      destinationCountry: 'AU',
      originCountry,
      mfnRate,
      ftaRate,
      notes,
    };
  } catch (error: any) {
    console.warn('[POTAL AU] Error:', error.message);
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
