/**
 * POTAL Tariff API — India CBIC Provider
 *
 * Provides duty rates for India imports via CBIC (Central Board of Indirect Taxes and Customs).
 * India has complex tariff structure: Basic Customs Duty + Social Welfare Surcharge + IGST.
 *
 * Data source: Indian Customs Tariff (cbic-gst.gov.in)
 * Chapter-level average applied MFN rates from ITC-HS.
 */

import type { HsCodeDutyRate } from '../hs-code/types';

// Indian BCD (Basic Customs Duty) rates by HS chapter (avg applied MFN)
const INDIA_BCD_RATES: Record<string, number> = {
  // Agriculture / Food
  '01': 0.30, '02': 0.30, '03': 0.30, '04': 0.40, '05': 0.30,
  '06': 0.30, '07': 0.30, '08': 0.30, '09': 0.30, '10': 0.50,
  '11': 0.30, '12': 0.30, '13': 0.30, '14': 0.30, '15': 0.45,
  '16': 0.30, '17': 0.50, '18': 0.30, '19': 0.30, '20': 0.30,
  '21': 0.30, '22': 0.60, '23': 0.30, '24': 1.00,
  // Chemicals
  '28': 0.075, '29': 0.10, '30': 0.10, '31': 0.075, '32': 0.10,
  '33': 0.10, '34': 0.10, '35': 0.10, '36': 0.10, '37': 0.10,
  '38': 0.10,
  // Plastics / Rubber
  '39': 0.10, '40': 0.10,
  // Leather / Textiles
  '41': 0.10, '42': 0.15, '43': 0.10,
  '50': 0.10, '51': 0.10, '52': 0.10, '53': 0.10, '54': 0.10,
  '55': 0.10, '56': 0.10, '57': 0.10, '58': 0.10, '59': 0.10,
  '60': 0.10, '61': 0.20, '62': 0.20, '63': 0.20,
  // Footwear
  '64': 0.25, '65': 0.10,
  // Stone / Ceramics
  '68': 0.10, '69': 0.10, '70': 0.10, '71': 0.10,
  // Iron / Steel / Metals
  '72': 0.075, '73': 0.10, '74': 0.05, '75': 0.05, '76': 0.075,
  '78': 0.05, '79': 0.05, '80': 0.05, '81': 0.05, '82': 0.10,
  '83': 0.10,
  // Machinery / Electronics
  '84': 0.075, '85': 0.10, '86': 0.075, '87': 0.25, '88': 0.05,
  '89': 0.05, '90': 0.075, '91': 0.10, '92': 0.10,
  // Miscellaneous
  '93': 0.10, '94': 0.20, '95': 0.15, '96': 0.10, '97': 0,
};

// Social Welfare Surcharge: 10% on BCD
const SWS_RATE = 0.10;

/**
 * Fetch duty rate for India imports.
 * Returns BCD (Basic Customs Duty). Note: SWS and IGST calculated separately by engine.
 */
export async function fetchIndiaCbicDutyRate(
  hsCode: string,
  originCountry?: string,
  _timeoutMs?: number,
): Promise<HsCodeDutyRate | null> {
  const chapter = hsCode.substring(0, 2);
  const bcdRate = INDIA_BCD_RATES[chapter];

  if (bcdRate === undefined) {
    return {
      hsCode,
      destinationCountry: 'IN',
      originCountry,
      mfnRate: 0.10, // Default 10%
      additionalTariff: 0.10 * SWS_RATE,
      notes: 'Source: India CBIC default estimate (BCD + SWS)',
    };
  }

  return {
    hsCode,
    destinationCountry: 'IN',
    originCountry,
    mfnRate: bcdRate,
    additionalTariff: bcdRate * SWS_RATE,
    notes: `Source: India CBIC tariff schedule (chapter ${chapter} avg BCD ${(bcdRate * 100).toFixed(1)}% + SWS ${(bcdRate * SWS_RATE * 100).toFixed(1)}%)`,
  };
}
