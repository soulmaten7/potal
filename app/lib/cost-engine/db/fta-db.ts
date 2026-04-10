/**
 * POTAL FTA — DB-backed version
 *
 * Same interface as hs-code/fta.ts but reads from Supabase.
 * Falls back to hardcoded data if DB is unavailable.
 */

import { getFtaAgreements, type CachedFtaAgreement } from './tariff-cache';
import { findApplicableFta as hardcodedFindFta, applyFtaRate as hardcodedApplyFta } from '../hs-code/fta';
import type { FtaResult } from '../hs-code/fta';

/**
 * CW32: FTAs added to hs-code/fta.ts after the Supabase fta_agreements
 * table was last synced. When the DB lookup fails to find a match we also
 * consult the hardcoded list so new agreements (Korea-UK, KCFTA…) apply
 * without waiting for a DB migration.
 *
 * Safe because hardcodedFindFta() returns `hasFta:false` when nothing
 * applies, and the merge only replaces a "no FTA" result with a hit.
 */
function mergeWithHardcoded(
  dbResult: FtaResult,
  originCountry: string,
  destinationCountry: string,
  hsChapter: string | undefined,
): FtaResult {
  // DB already found a preferential agreement — keep it.
  if (dbResult.hasFta && (dbResult.preferentialMultiplier ?? 1) < 1) {
    return dbResult;
  }
  const hardcoded = hardcodedFindFta(originCountry, destinationCountry, hsChapter);
  if (hardcoded.hasFta && (hardcoded.preferentialMultiplier ?? 1) < 1) {
    return hardcoded;
  }
  return dbResult;
}

/**
 * Find applicable FTA from DB.
 */
export async function findApplicableFtaFromDb(
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): Promise<FtaResult> {
  try {
    const origin = originCountry.toUpperCase();
    const dest = destinationCountry.toUpperCase();

    // Same country = domestic
    if (origin === dest) {
      return { hasFta: true, ftaName: 'Domestic', ftaCode: 'DOMESTIC', preferentialMultiplier: 0.0 };
    }

    const ftas = await getFtaAgreements();

    let bestFta: CachedFtaAgreement | null = null;
    let bestMultiplier = 1.0;

    for (const fta of ftas) {
      if (!fta.isActive) continue;
      if (!fta.members.includes(origin) || !fta.members.includes(dest)) continue;

      // Check chapter exclusion
      if (hsChapter && fta.excludedChapters.includes(hsChapter)) continue;

      if (fta.preferentialMultiplier < bestMultiplier) {
        bestFta = fta;
        bestMultiplier = fta.preferentialMultiplier;
      }
    }

    const dbResult: FtaResult = bestFta
      ? {
          hasFta: true,
          ftaName: bestFta.ftaName,
          ftaCode: bestFta.ftaCode,
          preferentialMultiplier: bestMultiplier,
        }
      : { hasFta: false };

    // CW32: merge hardcoded additions so new FTAs apply without a DB migration.
    return mergeWithHardcoded(dbResult, originCountry, destinationCountry, hsChapter);
  } catch {
    // Fallback to hardcoded
    return hardcodedFindFta(originCountry, destinationCountry, hsChapter);
  }
}

/**
 * Apply FTA rate from DB.
 */
export async function applyFtaRateFromDb(
  mfnRate: number,
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): Promise<{ rate: number; fta: FtaResult }> {
  try {
    const fta = await findApplicableFtaFromDb(originCountry, destinationCountry, hsChapter);

    if (!fta.hasFta || fta.preferentialMultiplier === undefined) {
      return { rate: mfnRate, fta };
    }

    const preferentialRate = mfnRate * fta.preferentialMultiplier;
    return { rate: preferentialRate, fta };
  } catch {
    return hardcodedApplyFta(mfnRate, originCountry, destinationCountry, hsChapter);
  }
}
