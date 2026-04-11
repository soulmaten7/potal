/**
 * POTAL FTA — DB-backed
 *
 * CW33-S1: DB is the canonical source. The hardcoded fta.ts fallback
 * (CW32 mergeWithHardcoded) has been REMOVED — all 65 FTAs now live in
 * Supabase (fta_agreements + fta_members + fta_product_rules).
 *
 * The last-resort fallback is the hardcoded helper ONLY when the DB call
 * throws (network outage). Never for "DB returned nothing" — that is an
 * authoritative "no FTA applies" answer.
 */

import { getFtaAgreements, type CachedFtaAgreement } from './tariff-cache';
import { findApplicableFta as hardcodedFindFta, applyFtaRate as hardcodedApplyFta } from '../hs-code/fta';
import type { FtaResult } from '../hs-code/fta';

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

    if (bestFta) {
      return {
        hasFta: true,
        ftaName: bestFta.ftaName,
        ftaCode: bestFta.ftaCode,
        preferentialMultiplier: bestMultiplier,
      };
    }

    return { hasFta: false };
  } catch {
    // Last resort: network/DB error — fall back to hardcoded data so the
    // engine still produces a sensible result. This path is NOT used for
    // "DB returned nothing"; DB no-match is authoritative.
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
