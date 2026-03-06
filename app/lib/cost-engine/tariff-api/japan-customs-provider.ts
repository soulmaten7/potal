/**
 * POTAL — Japan Customs Tariff Provider
 *
 * 일본 관세율 조회
 *
 * Source: Japan Customs Tariff Schedule (関税率表)
 * - https://www.customs.go.jp/english/tariff/
 * - No public REST API available
 * - Fallback: Hardcoded MFN rates
 *
 * Japan tariff characteristics:
 * - Simple average MFN applied: ~4.2%
 * - Agricultural goods: HIGH (rice 778%, beef 38.5%, dairy 30-40%)
 * - Industrial goods: LOW (0-5%)
 * - Electronics: 0% (ITA member)
 * - Consumption Tax (JCT): 10% on all imports (handled separately)
 * - De minimis: ¥10,000 (~$67 USD)
 *
 * Key FTAs:
 * - RCEP: China, Korea, ASEAN, Australia, NZ
 * - CPTPP: Canada, Mexico, Chile, Peru, Malaysia, etc.
 * - EU-Japan EPA: Comprehensive (most goods duty-free)
 * - JAEPA: Japan-Australia (dairy excluded mostly)
 * - Japan-India CEPA: Partial coverage
 * - Japan-Switzerland FTA: Industrial goods duty-free
 * - Japan-UK CEPA: Post-Brexit continuity
 * - Japan-ASEAN EPA: Comprehensive
 */

import type { HsCodeDutyRate } from '../hs-code/types';

const JAPAN_CHAPTER_MFN_RATES: Record<string, number> = {
  '01': 0.0,    // Live animals (cattle: 0%)
  '02': 0.15,   // Meat (beef 38.5%, pork varies, chicken 8.5-11.9%)
  '03': 0.08,   // Fish (varies 3.5-15%)
  '04': 0.35,   // Dairy (30-40% for cheese, butter)
  '05': 0.0,    // Products of animal origin
  '06': 0.03,   // Live plants
  '07': 0.10,   // Vegetables
  '08': 0.08,   // Fruit and nuts
  '09': 0.0,    // Coffee, tea (mostly 0%)
  '10': 0.50,   // Cereals (rice: 778%)
  '11': 0.12,   // Milling products
  '12': 0.0,    // Oil seeds (soybeans 0%)
  '13': 0.0,    // Lac, gums, resins
  '14': 0.0,    // Vegetable plaiting materials
  '15': 0.10,   // Fats and oils
  '16': 0.12,   // Meat/fish preparations
  '17': 0.15,   // Sugars
  '18': 0.08,   // Cocoa
  '19': 0.15,   // Cereal preparations
  '20': 0.12,   // Vegetable/fruit preparations
  '21': 0.10,   // Misc food preparations
  '22': 0.15,   // Beverages
  '23': 0.0,    // Animal feed
  '24': 0.0,    // Tobacco (excise separate)
  '25': 0.0,    // Salt, minerals
  '26': 0.0,    // Ores
  '27': 0.0,    // Mineral fuels
  '28': 0.03,   // Inorganic chemicals
  '29': 0.03,   // Organic chemicals
  '30': 0.0,    // Pharmaceutical
  '31': 0.0,    // Fertilizers
  '32': 0.08,   // Tanning/dyeing
  '33': 0.0,    // Cosmetics (0% for most)
  '34': 0.035,  // Soap
  '35': 0.05,   // Albuminoidal
  '36': 0.038,  // Explosives
  '37': 0.0,    // Photographic
  '38': 0.07,   // Chemical products
  '39': 0.04,   // Plastics
  '40': 0.05,   // Rubber
  '41': 0.0,    // Raw hides
  '42': 0.10,   // Leather goods (bags: 8-16%)
  '43': 0.10,   // Furskins
  '44': 0.0,    // Wood
  '45': 0.0,    // Cork
  '46': 0.04,   // Straw manufactures
  '47': 0.0,    // Pulp
  '48': 0.0,    // Paper
  '49': 0.0,    // Printed books
  '50': 0.08,   // Silk
  '51': 0.08,   // Wool
  '52': 0.08,   // Cotton
  '53': 0.0,    // Vegetable textile fibres
  '54': 0.08,   // Man-made filaments
  '55': 0.08,   // Man-made staple fibres
  '56': 0.06,   // Wadding/felt
  '57': 0.06,   // Carpets
  '58': 0.06,   // Special woven fabrics
  '59': 0.06,   // Impregnated textiles
  '60': 0.08,   // Knitted fabrics
  '61': 0.105,  // Knitted apparel (9.1-13.4%)
  '62': 0.10,   // Woven apparel (8.4-12.8%)
  '63': 0.06,   // Textile articles
  '64': 0.30,   // Footwear (very high: 27-30%)
  '65': 0.06,   // Headwear
  '66': 0.06,   // Umbrellas
  '67': 0.06,   // Prepared feathers
  '68': 0.04,   // Stone articles
  '69': 0.03,   // Ceramics
  '70': 0.04,   // Glass
  '71': 0.055,  // Jewelry
  '72': 0.0,    // Iron and steel (mostly 0%)
  '73': 0.03,   // Iron/steel articles
  '74': 0.01,   // Copper
  '75': 0.0,    // Nickel
  '76': 0.01,   // Aluminium
  '78': 0.0,    // Lead
  '79': 0.0,    // Zinc
  '80': 0.0,    // Tin
  '81': 0.0,    // Other base metals
  '82': 0.05,   // Tools
  '83': 0.05,   // Misc metal articles
  '84': 0.0,    // Machinery (ITA = 0%)
  '85': 0.0,    // Electronics (ITA = 0%)
  '86': 0.0,    // Railway
  '87': 0.0,    // Vehicles (passenger cars: 0%!)
  '88': 0.0,    // Aircraft
  '89': 0.0,    // Ships
  '90': 0.0,    // Optical/medical
  '91': 0.0,    // Watches
  '92': 0.0,    // Musical instruments
  '93': 0.0,    // Arms
  '94': 0.0,    // Furniture
  '95': 0.0,    // Toys
  '96': 0.038,  // Misc manufactured
  '97': 0.0,    // Works of art
};

/**
 * 일본 관세율 조회
 */
export async function fetchJapanDutyRate(
  hsCode: string,
  originCountry?: string,
  timeoutMs: number = 15000,
): Promise<HsCodeDutyRate | null> {
  try {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const mfnRate = JAPAN_CHAPTER_MFN_RATES[chapter];

    if (mfnRate === undefined) {
      return null;
    }

    let ftaRate: number | undefined;
    let notes = `Source: Japan Customs Tariff | Chapter ${chapter}`;

    if (originCountry) {
      const origin = originCountry.toUpperCase();

      // EU-Japan EPA — most industrial goods duty-free
      if (isEuCountry(origin)) {
        const agriChapters = new Set(['02', '04', '10', '17', '22', '24']);
        if (agriChapters.has(chapter)) {
          ftaRate = mfnRate * 0.5;
        } else {
          ftaRate = 0;
        }
        notes += ' | EU-Japan EPA';
      }
      // RCEP — China, Korea, ASEAN, AU, NZ
      else if (['CN', 'KR', 'AU', 'NZ', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'].includes(origin)) {
        ftaRate = mfnRate * 0.5; // Gradual RCEP reduction
        notes += ' | RCEP';
      }
      // CPTPP members
      else if (['AU', 'BN', 'CA', 'CL', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'].includes(origin)) {
        ftaRate = 0;
        notes += ' | CPTPP (duty-free)';
      }
      // UK-Japan CEPA
      else if (origin === 'GB') {
        ftaRate = 0;
        notes += ' | UK-Japan CEPA';
      }
      // Japan-India CEPA
      else if (origin === 'IN') {
        ftaRate = mfnRate * 0.5;
        notes += ' | Japan-India CEPA';
      }
      // Japan-Switzerland FTA
      else if (origin === 'CH') {
        ftaRate = 0;
        notes += ' | Japan-Switzerland FTA';
      }
      // Japan-US (no comprehensive FTA, but sectoral agreements)
      else if (origin === 'US') {
        // US-Japan Trade Agreement (Phase 1, 2020)
        // Only covers agriculture and digital trade
        const agriChapters = new Set(['02', '04', '07', '08', '10', '12', '15']);
        if (agriChapters.has(chapter)) {
          ftaRate = mfnRate * 0.7; // Partial reduction
          notes += ' | US-Japan Trade Agreement (Phase 1)';
        }
      }
    }

    return {
      hsCode: hsCode.replace(/\./g, ''),
      destinationCountry: 'JP',
      originCountry,
      mfnRate,
      ftaRate,
      notes,
    };
  } catch (error: any) {
    console.warn('[POTAL JP] Error:', error.message);
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
