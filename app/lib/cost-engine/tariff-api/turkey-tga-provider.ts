/**
 * POTAL Tariff API — Turkey TGA Provider
 *
 * Provides duty rates for Turkey imports.
 * Turkey has a Customs Union with EU for industrial goods (chapters 25-97),
 * but applies own rates for agricultural products.
 *
 * Data source: Turkish Revenue Administration (GIB), Trade Ministry schedules
 */

import type { HsCodeDutyRate } from '../hs-code/types';

// Turkey MFN rates by HS chapter
const TURKEY_RATES: Record<string, number> = {
  // Agricultural
  '01': 0.30, '02': 0.75, '03': 0.15, '04': 0.50, '05': 0.05,
  '06': 0.05, '07': 0.20, '08': 0.25, '09': 0.10, '10': 0.25,
  '11': 0.15, '12': 0.05, '13': 0.05, '14': 0.05, '15': 0.20,
  '16': 0.40, '17': 0.50, '18': 0.10, '19': 0.15, '20': 0.30,
  '21': 0.10, '22': 0.30, '23': 0.10, '24': 0.50,
  // Industrial (aligned with EU CET under Customs Union)
  '25': 0, '26': 0, '27': 0.04, '28': 0.055, '29': 0.055,
  '30': 0.04, '31': 0.055, '32': 0.055, '33': 0.03, '34': 0.055,
  '35': 0.055, '36': 0.055, '37': 0.04, '38': 0.055, '39': 0.055,
  '40': 0.055, '41': 0, '42': 0.06, '43': 0.035,
  '44': 0.04, '45': 0.04, '46': 0.04, '47': 0, '48': 0,
  '49': 0, '50': 0.03, '51': 0.03, '52': 0.04, '53': 0.03,
  '54': 0.04, '55': 0.04, '56': 0.04, '57': 0.06, '58': 0.06,
  '59': 0.04, '60': 0.06, '61': 0.12, '62': 0.12, '63': 0.12,
  '64': 0.12, '65': 0.04, '66': 0.06, '67': 0.04,
  '68': 0.04, '69': 0.06, '70': 0.06, '71': 0.04,
  '72': 0, '73': 0.03, '74': 0, '75': 0, '76': 0.06,
  '78': 0, '79': 0, '80': 0, '81': 0, '82': 0.04,
  '83': 0.04, '84': 0.02, '85': 0.04, '86': 0.04,
  '87': 0.06, '88': 0.04, '89': 0, '90': 0.02, '91': 0.04,
  '92': 0.04, '93': 0.04, '94': 0.04, '95': 0.04, '96': 0.04,
  '97': 0,
};

// EU members get 0% on industrial goods (chapters 25-97) under Customs Union
const EU_MEMBERS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

export async function fetchTurkeyDutyRate(
  hsCode: string,
  originCountry?: string,
  _timeoutMs?: number,
): Promise<HsCodeDutyRate | null> {
  const chapter = hsCode.substring(0, 2);
  const chapterNum = parseInt(chapter, 10);
  const origin = originCountry?.toUpperCase() || '';

  // EU → Turkey: Customs Union applies for industrial goods (chapters 25-97)
  if (origin && EU_MEMBERS.has(origin) && chapterNum >= 25) {
    return {
      hsCode,
      destinationCountry: 'TR',
      originCountry: origin,
      mfnRate: 0,
      notes: 'Source: Turkey-EU Customs Union — 0% for industrial goods from EU',
    };
  }

  const rate = TURKEY_RATES[chapter];
  if (rate === undefined) {
    return {
      hsCode,
      destinationCountry: 'TR',
      originCountry: origin || undefined,
      mfnRate: 0.05,
      notes: 'Source: Turkey tariff default estimate',
    };
  }

  return {
    hsCode,
    destinationCountry: 'TR',
    originCountry: origin || undefined,
    mfnRate: rate,
    notes: `Source: Turkey tariff schedule (chapter ${chapter} avg rate ${(rate * 100).toFixed(1)}%)`,
  };
}
