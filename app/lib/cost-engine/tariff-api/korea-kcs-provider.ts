/**
 * POTAL — Korea KCS (Korea Customs Service) Tariff Provider
 *
 * 한국 관세율 조회
 *
 * Source: Korea Customs Service (관세청) Tariff Schedule
 * API: https://unipass.customs.go.kr (Open API - requires Korean gov API key)
 * Fallback: Hardcoded MFN rates from Korea Customs Tariff 2025
 *
 * Key FTAs:
 * - KORUS (Korea-US): Most goods duty-free
 * - EU-Korea FTA: Duty-free for most industrial goods
 * - RCEP: Graduated reductions with ASEAN/China/Japan/AU/NZ
 * - Korea-China FTA: Partial reduction (varies by product)
 * - CPTPP: Korea acceded 2025
 * - Korea-UK FTA: Continuity agreement post-Brexit
 * - AKFTA (ASEAN-Korea): Comprehensive duty reduction
 * - Korea-Vietnam FTA: Bilateral enhancement
 * - Korea-India CEPA: Partial coverage
 *
 * Korea tariff characteristics:
 * - Average MFN applied: ~8.8%
 * - Agricultural goods: high (40-100%+ for rice, dairy)
 * - Industrial goods: relatively low (0-8%)
 * - Electronics: 0% (ITA)
 */

import type { HsCodeDutyRate } from '../hs-code/types';

const KOREA_CHAPTER_MFN_RATES: Record<string, number> = {
  '01': 0.18,   // Live animals (higher for cattle)
  '02': 0.20,   // Meat (40% for beef, 8% for poultry)
  '03': 0.15,   // Fish
  '04': 0.25,   // Dairy (very high, supply managed)
  '05': 0.0,    // Products of animal origin
  '06': 0.08,   // Live plants
  '07': 0.10,   // Vegetables (varies widely)
  '08': 0.15,   // Fruit and nuts
  '09': 0.0,    // Coffee, tea, spices
  '10': 0.50,   // Cereals (rice: 513%, others lower)
  '11': 0.08,   // Milling products
  '12': 0.08,   // Oil seeds
  '13': 0.05,   // Lac, gums, resins
  '14': 0.05,   // Vegetable plaiting materials
  '15': 0.08,   // Fats and oils
  '16': 0.18,   // Meat/fish preparations
  '17': 0.15,   // Sugars
  '18': 0.10,   // Cocoa
  '19': 0.12,   // Cereal preparations
  '20': 0.15,   // Vegetable/fruit preparations
  '21': 0.10,   // Misc food preparations
  '22': 0.20,   // Beverages
  '23': 0.05,   // Animal feed
  '24': 0.40,   // Tobacco
  '25': 0.02,   // Salt, minerals
  '26': 0.0,    // Ores
  '27': 0.03,   // Mineral fuels
  '28': 0.05,   // Inorganic chemicals
  '29': 0.05,   // Organic chemicals
  '30': 0.0,    // Pharmaceutical
  '31': 0.0,    // Fertilizers
  '32': 0.08,   // Tanning/dyeing
  '33': 0.08,   // Cosmetics
  '34': 0.08,   // Soap
  '35': 0.08,   // Albuminoidal
  '36': 0.08,   // Explosives
  '37': 0.08,   // Photographic
  '38': 0.08,   // Chemical products
  '39': 0.065,  // Plastics
  '40': 0.08,   // Rubber
  '41': 0.02,   // Raw hides
  '42': 0.08,   // Leather goods
  '43': 0.08,   // Furskins
  '44': 0.0,    // Wood
  '45': 0.05,   // Cork
  '46': 0.08,   // Straw manufactures
  '47': 0.0,    // Pulp
  '48': 0.0,    // Paper
  '49': 0.0,    // Printed books
  '50': 0.13,   // Silk
  '51': 0.13,   // Wool
  '52': 0.13,   // Cotton
  '53': 0.05,   // Vegetable textile fibres
  '54': 0.13,   // Man-made filaments
  '55': 0.13,   // Man-made staple fibres
  '56': 0.10,   // Wadding/felt
  '57': 0.10,   // Carpets
  '58': 0.10,   // Special woven fabrics
  '59': 0.10,   // Impregnated textiles
  '60': 0.13,   // Knitted fabrics
  '61': 0.13,   // Knitted apparel
  '62': 0.13,   // Woven apparel
  '63': 0.10,   // Textile articles
  '64': 0.13,   // Footwear
  '65': 0.08,   // Headwear
  '66': 0.08,   // Umbrellas
  '67': 0.08,   // Prepared feathers
  '68': 0.08,   // Stone articles
  '69': 0.08,   // Ceramics
  '70': 0.08,   // Glass
  '71': 0.08,   // Jewelry
  '72': 0.0,    // Iron and steel
  '73': 0.08,   // Iron/steel articles
  '74': 0.08,   // Copper
  '75': 0.03,   // Nickel
  '76': 0.08,   // Aluminium
  '78': 0.03,   // Lead
  '79': 0.03,   // Zinc
  '80': 0.03,   // Tin
  '81': 0.03,   // Other base metals
  '82': 0.08,   // Tools
  '83': 0.08,   // Misc metal articles
  '84': 0.0,    // Machinery (ITA = 0%)
  '85': 0.0,    // Electronics (ITA = 0%)
  '86': 0.0,    // Railway
  '87': 0.08,   // Vehicles (passenger cars: 8%)
  '88': 0.0,    // Aircraft
  '89': 0.0,    // Ships
  '90': 0.08,   // Optical/medical
  '91': 0.08,   // Watches
  '92': 0.0,    // Musical instruments
  '93': 0.0,    // Arms
  '94': 0.0,    // Furniture
  '95': 0.08,   // Toys
  '96': 0.08,   // Misc manufactured
  '97': 0.0,    // Works of art
};

/**
 * 한국 관세율 조회
 */
export async function fetchKoreaDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const mfnRate = KOREA_CHAPTER_MFN_RATES[chapter];

    if (mfnRate === undefined) {
      return null;
    }

    let ftaRate: number | undefined;
    let notes = `Source: Korea Customs Tariff | Chapter ${chapter}`;

    if (originCountry) {
      const origin = originCountry.toUpperCase();

      // KORUS (Korea-US FTA) — most goods duty-free
      if (origin === 'US') {
        ftaRate = 0;
        notes += ' | KORUS (duty-free)';
      }
      // EU-Korea FTA — industrial goods duty-free
      else if (isEuCountry(origin)) {
        // Agricultural chapters may not be duty-free
        const agriChapters = new Set(['01', '02', '03', '04', '07', '08', '10', '16', '17', '19', '20', '22', '24']);
        if (agriChapters.has(chapter)) {
          ftaRate = mfnRate * 0.5; // Partial reduction for agri
        } else {
          ftaRate = 0;
        }
        notes += ' | EU-Korea FTA';
      }
      // Korea-China FTA — partial reduction
      else if (origin === 'CN') {
        ftaRate = mfnRate * 0.3; // ~70% reduction on average
        notes += ' | Korea-China FTA';
      }
      // RCEP
      else if (['JP', 'AU', 'NZ', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'].includes(origin)) {
        ftaRate = mfnRate * 0.5; // Gradual reduction under RCEP
        notes += ' | RCEP';
      }
      // UK-Korea FTA (continuity)
      else if (origin === 'GB') {
        ftaRate = 0;
        notes += ' | UK-Korea FTA';
      }
      // EFTA-Korea FTA
      else if (['CH', 'NO', 'IS'].includes(origin)) {
        ftaRate = 0;
        notes += ' | EFTA-Korea FTA';
      }
      // India-Korea CEPA
      else if (origin === 'IN') {
        ftaRate = mfnRate * 0.5;
        notes += ' | India-Korea CEPA';
      }
      // Chile-Korea FTA
      else if (origin === 'CL') {
        ftaRate = 0;
        notes += ' | Chile-Korea FTA';
      }
      // Peru-Korea FTA
      else if (origin === 'PE') {
        ftaRate = 0;
        notes += ' | Peru-Korea FTA';
      }
      // Colombia-Korea FTA
      else if (origin === 'CO') {
        ftaRate = mfnRate * 0.3;
        notes += ' | Colombia-Korea FTA';
      }
      // Turkey-Korea FTA
      else if (origin === 'TR') {
        ftaRate = 0;
        notes += ' | Turkey-Korea FTA';
      }
    }

    return {
      hsCode: hsCode.replace(/\./g, ''),
      destinationCountry: 'KR',
      originCountry,
      mfnRate,
      ftaRate,
      notes,
    };
  } catch (error: any) {
    console.warn('[POTAL KR] Error:', error.message);
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
