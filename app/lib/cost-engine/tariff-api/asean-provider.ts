/**
 * POTAL Tariff API — ASEAN Tariff Provider
 *
 * Provides duty rates for ASEAN member states via ATIGA (ASEAN Trade in Goods Agreement).
 * Uses ASEAN Stats tariff schedules for MFN rates per member country.
 *
 * ASEAN members: BN, KH, ID, LA, MY, MM, PH, SG, TH, VN
 *
 * Data source: ASEANStats (stats.asean.org), ATIGA tariff schedules
 * Note: SG has zero tariffs on almost everything (free port).
 */

import type { HsCodeDutyRate } from '../hs-code/types';

const ASEAN_MEMBERS = ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN'];

export function isAseanMember(countryCode: string): boolean {
  return ASEAN_MEMBERS.includes(countryCode.toUpperCase());
}

// Default MFN rates by ASEAN member and HS chapter (avg applied rates from WTO/WITS)
const ASEAN_CHAPTER_RATES: Record<string, Record<string, number>> = {
  SG: {}, // Singapore: 0% on almost everything
  BN: { '22': 0.20, '24': 0.25 },
  MY: {
    '01': 0, '02': 0, '03': 0, '04': 0.05, '08': 0.05, '09': 0.05,
    '17': 0.05, '22': 0.15, '24': 0.25, '33': 0.10, '42': 0.20,
    '50': 0.10, '61': 0.15, '62': 0.15, '64': 0.20, '69': 0.10,
    '70': 0.10, '71': 0.05, '84': 0, '85': 0.05, '87': 0.20,
    '90': 0, '94': 0.15, '95': 0.10,
  },
  TH: {
    '01': 0.05, '02': 0.30, '03': 0.05, '04': 0.20, '08': 0.30,
    '09': 0.20, '17': 0.65, '22': 0.54, '24': 0.60, '33': 0.10,
    '42': 0.20, '50': 0.05, '61': 0.30, '62': 0.30, '64': 0.30,
    '69': 0.10, '70': 0.10, '71': 0.05, '84': 0.01, '85': 0.05,
    '87': 0.30, '90': 0.01, '94': 0.20, '95': 0.10,
  },
  VN: {
    '01': 0.05, '02': 0.15, '03': 0.10, '04': 0.10, '08': 0.15,
    '09': 0.20, '17': 0.30, '22': 0.45, '24': 0.75, '33': 0.15,
    '42': 0.20, '61': 0.20, '62': 0.20, '64': 0.20, '84': 0.01,
    '85': 0.05, '87': 0.30, '90': 0.01, '94': 0.20, '95': 0.15,
  },
  ID: {
    '01': 0.05, '02': 0.05, '03': 0.05, '04': 0.05, '08': 0.05,
    '09': 0.05, '17': 0.10, '22': 0.35, '24': 0.55, '33': 0.10,
    '42': 0.15, '61': 0.15, '62': 0.15, '64': 0.15, '69': 0.10,
    '70': 0.10, '84': 0.05, '85': 0.05, '87': 0.15, '90': 0,
    '94': 0.10, '95': 0.10,
  },
  PH: {
    '01': 0.05, '02': 0.10, '03': 0.07, '04': 0.07, '08': 0.10,
    '09': 0.10, '17': 0.10, '22': 0.15, '24': 0.45, '33': 0.05,
    '42': 0.15, '61': 0.15, '62': 0.15, '64': 0.10, '84': 0.01,
    '85': 0.03, '87': 0.15, '90': 0.01, '94': 0.15, '95': 0.10,
  },
  KH: {
    '01': 0.07, '02': 0.07, '03': 0.07, '04': 0.07, '08': 0.07,
    '17': 0.07, '22': 0.15, '24': 0.15, '33': 0.07, '42': 0.07,
    '61': 0.07, '62': 0.07, '64': 0.07, '84': 0.07, '85': 0.07,
    '87': 0.15, '90': 0.07, '94': 0.07, '95': 0.07,
  },
  LA: {
    '01': 0.05, '02': 0.10, '17': 0.10, '22': 0.20, '24': 0.25,
    '33': 0.10, '42': 0.15, '61': 0.20, '62': 0.20, '64': 0.15,
    '84': 0.05, '85': 0.10, '87': 0.20,
  },
  MM: {
    '01': 0.05, '02': 0.05, '17': 0.05, '22': 0.10, '24': 0.10,
    '33': 0.05, '42': 0.05, '61': 0.10, '62': 0.10, '64': 0.05,
    '84': 0.01, '85': 0.03, '87': 0.10,
  },
};

// ATIGA preferential rates (intra-ASEAN trade): 0% for most tariff lines
const ATIGA_RATE = 0;

/**
 * Fetch duty rate for ASEAN member state.
 * If origin is also ASEAN member, applies ATIGA rate (0% for most goods).
 */
export async function fetchAseanDutyRate(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
  _timeoutMs?: number,
): Promise<HsCodeDutyRate | null> {
  const dest = destinationCountry.toUpperCase();
  if (!isAseanMember(dest)) return null;

  const chapter = hsCode.substring(0, 2);
  const origin = originCountry?.toUpperCase() || '';

  // Singapore: virtually 0% on everything
  if (dest === 'SG') {
    return {
      hsCode,
      destinationCountry: dest,
      originCountry: origin || undefined,
      mfnRate: 0,
      notes: 'Source: Singapore Customs (zero tariff free port)',
    };
  }

  // Intra-ASEAN: apply ATIGA rate (0%)
  if (origin && isAseanMember(origin)) {
    return {
      hsCode,
      destinationCountry: dest,
      originCountry: origin,
      mfnRate: ATIGA_RATE,
      notes: 'Source: ATIGA (ASEAN Trade in Goods Agreement) — duty-free intra-ASEAN trade',
    };
  }

  // MFN rate from chapter-level data
  const countryRates = ASEAN_CHAPTER_RATES[dest];
  if (countryRates) {
    const rate = countryRates[chapter];
    if (rate !== undefined) {
      return {
        hsCode,
        destinationCountry: dest,
        originCountry: origin || undefined,
        mfnRate: rate,
        notes: `Source: ASEAN tariff schedule (${dest}, chapter ${chapter} avg MFN rate)`,
      };
    }
  }

  // Default fallback for ASEAN: ~5%
  return {
    hsCode,
    destinationCountry: dest,
    originCountry: origin || undefined,
    mfnRate: 0.05,
    notes: `Source: ASEAN default estimate (${dest})`,
  };
}
