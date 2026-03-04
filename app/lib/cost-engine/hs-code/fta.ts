/**
 * POTAL FTA (Free Trade Agreement) Logic
 *
 * Determines if preferential duty rates apply based on
 * origin → destination country pairs and applicable FTAs.
 *
 * Sources: WTO RTA database, official FTA texts
 *
 * Phase 1: Major FTAs with simplified preferential rates
 * Phase 3: Certificate of Origin verification, product-specific rules
 */

// ─── FTA Definitions ───────────────────────────────────────────

interface FtaAgreement {
  /** Agreement name */
  name: string;
  /** Short code */
  code: string;
  /** Member countries (ISO 2-letter codes) */
  members: string[];
  /** Default preferential rate discount (multiplier, e.g. 0.0 = duty-free, 0.5 = 50% of MFN) */
  preferentialMultiplier: number;
  /** Chapter-specific overrides (some chapters excluded from FTA) */
  excludedChapters?: string[];
  /** Is the FTA currently in effect? */
  isActive: boolean;
}

const FTA_AGREEMENTS: FtaAgreement[] = [
  // ─── USMCA (US-Mexico-Canada) ───
  {
    name: 'United States-Mexico-Canada Agreement',
    code: 'USMCA',
    members: ['US', 'MX', 'CA'],
    preferentialMultiplier: 0.0, // duty-free for qualifying goods
    isActive: true,
  },

  // ─── RCEP (Regional Comprehensive Economic Partnership) ───
  {
    name: 'Regional Comprehensive Economic Partnership',
    code: 'RCEP',
    members: ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.5, // ~50% reduction on average (varies by product)
    excludedChapters: ['24'], // Tobacco often excluded
    isActive: true,
  },

  // ─── EU-Korea FTA ───
  {
    name: 'EU-Korea Free Trade Agreement',
    code: 'EU-KR',
    members: [
      'KR',
      // EU members
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── EU-Japan EPA ───
  {
    name: 'EU-Japan Economic Partnership Agreement',
    code: 'EU-JP',
    members: [
      'JP',
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── KORUS FTA (Korea-US) ───
  {
    name: 'Korea-US Free Trade Agreement',
    code: 'KORUS',
    members: ['US', 'KR'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── Australia FTAs ───
  {
    name: 'China-Australia Free Trade Agreement',
    code: 'ChAFTA',
    members: ['CN', 'AU'],
    preferentialMultiplier: 0.0, // Most goods duty-free by 2025
    excludedChapters: ['24'],
    isActive: true,
  },
  {
    name: 'Australia-US Free Trade Agreement',
    code: 'AUSFTA',
    members: ['US', 'AU'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── UK Trade Agreements (post-Brexit) ───
  {
    name: 'UK-Japan CEPA',
    code: 'UK-JP',
    members: ['GB', 'JP'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },
  {
    name: 'UK-Australia FTA',
    code: 'UK-AU',
    members: ['GB', 'AU'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── CPTPP ───
  {
    name: 'Comprehensive and Progressive Trans-Pacific Partnership',
    code: 'CPTPP',
    members: ['AU', 'BN', 'CA', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },

  // ─── Korea-China FTA ───
  {
    name: 'Korea-China FTA',
    code: 'KR-CN',
    members: ['KR', 'CN'],
    preferentialMultiplier: 0.3, // Partial reduction (varies heavily by product)
    excludedChapters: ['87'], // Many auto/vehicle exclusions
    isActive: true,
  },

  // ─── ASEAN-China FTA ───
  {
    name: 'ASEAN-China Free Trade Area',
    code: 'ACFTA',
    members: ['CN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'BN', 'KH', 'LA', 'MM'],
    preferentialMultiplier: 0.0,
    isActive: true,
  },
];

// ─── Public API ────────────────────────────────────────────────

export interface FtaResult {
  /** Does an FTA apply? */
  hasFta: boolean;
  /** FTA name */
  ftaName?: string;
  /** FTA code */
  ftaCode?: string;
  /** Preferential rate multiplier (0.0 = duty-free, 0.5 = 50% of MFN) */
  preferentialMultiplier?: number;
  /** Is this chapter excluded from FTA benefits? */
  isExcluded?: boolean;
}

/**
 * Find applicable FTA between origin and destination countries.
 *
 * @param originCountry - ISO code of exporting country
 * @param destinationCountry - ISO code of importing country
 * @param hsChapter - Optional HS chapter to check exclusions
 * @returns FTA result with preferential rate info
 */
export function findApplicableFta(
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): FtaResult {
  const origin = originCountry.toUpperCase();
  const dest = destinationCountry.toUpperCase();

  // Same country = no duty
  if (origin === dest) {
    return { hasFta: true, ftaName: 'Domestic', ftaCode: 'DOMESTIC', preferentialMultiplier: 0.0 };
  }

  // Find best FTA (lowest multiplier = most preferential)
  let bestFta: FtaAgreement | null = null;
  let bestMultiplier = 1.0;

  for (const fta of FTA_AGREEMENTS) {
    if (!fta.isActive) continue;
    if (!fta.members.includes(origin) || !fta.members.includes(dest)) continue;

    // Check chapter exclusion
    if (hsChapter && fta.excludedChapters?.includes(hsChapter)) {
      continue;
    }

    if (fta.preferentialMultiplier < bestMultiplier) {
      bestFta = fta;
      bestMultiplier = fta.preferentialMultiplier;
    }
  }

  if (!bestFta) {
    return { hasFta: false };
  }

  return {
    hasFta: true,
    ftaName: bestFta.name,
    ftaCode: bestFta.code,
    preferentialMultiplier: bestMultiplier,
  };
}

/**
 * Calculate preferential duty rate after FTA application
 *
 * @param mfnRate - MFN duty rate (decimal)
 * @param originCountry - ISO code
 * @param destinationCountry - ISO code
 * @param hsChapter - HS chapter (2 digits)
 * @returns Adjusted duty rate after FTA discount
 */
export function applyFtaRate(
  mfnRate: number,
  originCountry: string,
  destinationCountry: string,
  hsChapter?: string,
): { rate: number; fta: FtaResult } {
  const fta = findApplicableFta(originCountry, destinationCountry, hsChapter);

  if (!fta.hasFta || fta.preferentialMultiplier === undefined) {
    return { rate: mfnRate, fta };
  }

  const preferentialRate = mfnRate * fta.preferentialMultiplier;
  return { rate: preferentialRate, fta };
}

/**
 * List all FTAs a country participates in
 */
export function getCountryFtas(countryCode: string): Array<{ code: string; name: string; partners: string[] }> {
  const code = countryCode.toUpperCase();
  return FTA_AGREEMENTS
    .filter((fta) => fta.isActive && fta.members.includes(code))
    .map((fta) => ({
      code: fta.code,
      name: fta.name,
      partners: fta.members.filter((m) => m !== code),
    }));
}
