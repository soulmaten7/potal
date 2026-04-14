/**
 * F039: Rules of Origin (RoO) Engine — Production Grade
 *
 * Determines FTA eligibility based on:
 * - WO (Wholly Obtained)
 * - PE (Produced Entirely from originating materials)
 * - RVC (Regional Value Content) with FTA/chapter-specific thresholds
 * - CTH/CC/CTSH (Tariff Shift)
 * - Cumulation (diagonal for RCEP, bilateral for others)
 * - De minimis (non-originating < threshold → still eligible)
 * - Substantial transformation check
 */

export type OriginCriteria = 'WO' | 'PE' | 'RVC' | 'CTH' | 'CC' | 'CTSH';

export interface RoOInput {
  hs6: string;
  origin: string;
  destination: string;
  ftaId?: string;
  productValue?: number;
  localContentValue?: number;
  originatingMaterialValue?: number;  // C3: FTA member-origin materials
  nonOriginatingMaterialValue?: number;
  materials?: Array<{ hsCode: string; origin: string; value: number }>;
  inputOrigins?: string[];  // C4: countries where inputs originate
  // CW34-S4.5: 10-field integration
  material?: string;
  materialComposition?: Record<string, number>;
  productForm?: string;
  intendedUse?: string;
  originatingContentPct?: number;  // 0-100, user-provided originating %
}

export type EligibilityVerdict = 'eligible' | 'ineligible' | 'indeterminate';

export interface RoOResult {
  eligible: boolean;
  verdict: EligibilityVerdict;
  criteriaMetList: OriginCriteria[];
  criteriaFailed: OriginCriteria[];
  rvcPercentage?: number;
  requiredRvc?: number;
  tariffShiftMet?: boolean;
  substantialTransformation?: boolean;
  cumulationApplied?: boolean;
  deMinimisApplied?: boolean;
  savingsIfEligible: number;
  mfnDutyEstimate?: number;
  ftaDutyEstimate?: number;
  method: string;
  details: string;
  warnings: string[];
  // CW34-S4.5
  dbRule?: { id: string; fta_code: string; rule_type: string; rule_text: string } | null;
  tenFieldEvidence?: Record<string, unknown>;
  // CW36-FTA-Enrichment
  rulingPrecedents?: Array<{ rulingId: string; source: string; hsCode: string; productName: string; confidenceScore: number }>;
  classificationGuidance?: Record<string, unknown>;
  chapterValidation?: { passed: boolean; warnings: string[] };
  dataAvailability?: { jurisdiction: string; status: string; warning?: string };
}

// ─── FTA Configuration ──────────────────────────────

interface FtaConfig {
  defaultRvc: number;
  chapterRvc?: Record<string, number>;  // C1: chapter-specific overrides
  members: string[];
  cumulationType: 'bilateral' | 'diagonal' | 'full';
  deMinimisThreshold: number;  // M2: non-originating % allowed
  status: 'active' | 'pending' | 'expired';
  effectiveDate?: string;
}

const FTA_CONFIG: Record<string, FtaConfig> = {
  USMCA: {
    defaultRvc: 75,
    chapterRvc: {
      '61': 65, '62': 65, '63': 65, // textiles
      '87': 75, // automotive
      '84': 50, '85': 50, // machinery/electronics
    },
    members: ['US', 'CA', 'MX'],
    cumulationType: 'diagonal',
    deMinimisThreshold: 10,
    status: 'active',
    effectiveDate: '2020-07-01',
  },
  KORUS: {
    defaultRvc: 35,
    chapterRvc: { '87': 55 },
    members: ['US', 'KR'],
    cumulationType: 'bilateral',
    deMinimisThreshold: 10,
    status: 'active',
    effectiveDate: '2012-03-15',
  },
  CPTPP: {
    defaultRvc: 45,
    chapterRvc: { '61': 55, '62': 55 },
    members: ['AU', 'BN', 'CA', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN', 'GB'],
    cumulationType: 'diagonal',
    deMinimisThreshold: 10,
    status: 'active',
    effectiveDate: '2018-12-30',
  },
  RCEP: {
    defaultRvc: 40,
    members: ['AU', 'BN', 'KH', 'CN', 'ID', 'JP', 'KR', 'LA', 'MY', 'MM', 'NZ', 'PH', 'SG', 'TH', 'VN'],
    cumulationType: 'diagonal',
    deMinimisThreshold: 10,
    status: 'active',
    effectiveDate: '2022-01-01',
  },
  'EU-KR': {
    defaultRvc: 40,
    chapterRvc: { '87': 55 },
    members: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','KR'],
    cumulationType: 'bilateral',
    deMinimisThreshold: 10,
    status: 'active',
    effectiveDate: '2011-07-01',
  },
  EFTA: {
    defaultRvc: 50,
    members: ['CH', 'NO', 'IS', 'LI'],
    cumulationType: 'diagonal',
    deMinimisThreshold: 10,
    status: 'active',
  },
};

// ─── Helper Functions ───────────────────────────────

function findApplicableFta(origin: string, destination: string, ftaId?: string): { key: string; config: FtaConfig } | null {
  if (ftaId && FTA_CONFIG[ftaId]) {
    const config = FTA_CONFIG[ftaId];
    if (config.members.includes(origin) && config.members.includes(destination)) {
      return { key: ftaId, config };
    }
  }
  // Auto-detect FTA
  for (const [key, config] of Object.entries(FTA_CONFIG)) {
    if (config.members.includes(origin) && config.members.includes(destination) && config.status === 'active') {
      return { key, config };
    }
  }
  return null;
}

function getRvcThreshold(config: FtaConfig, hsChapter: string): number {
  return config.chapterRvc?.[hsChapter] ?? config.defaultRvc;
}

// ─── CW34-S4.5: DB Product Rule Lookup ────────────────
/**
 * Find matching fta_product_rules row for given HS + FTA.
 * hs_scope can be: "0101-0106" (range), "6109" (prefix), "61" (chapter).
 * We match by checking if the HS6 falls within the scope range.
 */
async function findDbProductRule(hs6: string, ftaCode: string): Promise<Record<string, unknown> | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const sb = createClient(url, key);

    // Try specific scope levels: subheading → heading → chapter
    const heading = hs6.slice(0, 4);
    const chapter = hs6.slice(0, 2);

    // Check for exact or range matches
    const { data } = await sb
      .from('fta_product_rules')
      .select('*')
      .eq('fta_code', ftaCode)
      .limit(50);

    if (!data || data.length === 0) return null;

    // Find best match: hs_scope that contains our HS code
    for (const rule of data) {
      const scope = String(rule.hs_scope || '');
      // Range: "0101-0106"
      if (scope.includes('-')) {
        const [from, to] = scope.split('-').map(s => s.trim());
        if (heading >= from && heading <= to) return rule;
      }
      // Prefix: "6109" or "61"
      else if (heading.startsWith(scope) || chapter === scope) {
        return rule;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main RoO Evaluation ────────────────────────────

export function evaluateRoO(input: RoOInput): RoOResult {
  const { hs6, origin, destination, productValue, localContentValue, materials, inputOrigins } = input;
  const chapter = hs6.slice(0, 2);
  const warnings: string[] = [];

  const criteriaMetList: OriginCriteria[] = [];
  const criteriaFailed: OriginCriteria[] = [];

  // Find applicable FTA
  const fta = findApplicableFta(origin, destination, input.ftaId);
  if (!fta) {
    return {
      eligible: false,
      verdict: 'ineligible' as EligibilityVerdict,
      criteriaMetList: [],
      criteriaFailed: [],
      savingsIfEligible: 0,
      method: 'none',
      details: `No active FTA found between ${origin} and ${destination}.`,
      warnings: input.ftaId ? [`FTA "${input.ftaId}" not found or not applicable for ${origin}→${destination}.`] : [],
    };
  }

  // C5: Check FTA validity
  if (fta.config.status !== 'active') {
    return {
      eligible: false,
      verdict: 'ineligible' as EligibilityVerdict,
      criteriaMetList: [],
      criteriaFailed: [],
      savingsIfEligible: 0,
      method: 'none',
      details: `FTA "${fta.key}" is not currently active (status: ${fta.config.status}).`,
      warnings: [],
    };
  }

  if (fta.config.effectiveDate && new Date() < new Date(fta.config.effectiveDate)) {
    return {
      eligible: false,
      verdict: 'ineligible' as EligibilityVerdict,
      criteriaMetList: [],
      criteriaFailed: [],
      savingsIfEligible: 0,
      method: 'none',
      details: `FTA "${fta.key}" not yet effective (starts: ${fta.config.effectiveDate}).`,
      warnings: [],
    };
  }

  // C1: Chapter-specific RVC threshold
  const requiredRvc = getRvcThreshold(fta.config, chapter);

  // ─── WO: Wholly Obtained ───
  const woChapters = new Set(['01','02','03','04','05','06','07','08','09','10','25','26','27']);
  if (woChapters.has(chapter) && (!materials || materials.length === 0 || materials.every(m => m.origin === origin))) {
    criteriaMetList.push('WO');
  } else if (woChapters.has(chapter)) {
    criteriaFailed.push('WO');
  }

  // ─── C3: PE — Produced Entirely from originating materials ───
  if (materials && materials.length > 0) {
    const allOriginating = materials.every(m => m.origin === origin || fta.config.members.includes(m.origin));
    if (allOriginating) {
      criteriaMetList.push('PE');
    } else {
      criteriaFailed.push('PE');
    }
  }

  // ─── RVC — Regional Value Content ───
  let rvcPercentage: number | undefined;
  if (productValue && productValue > 0) {
    // C3: Build-down method: RVC = (productValue - nonOriginatingMaterialValue) / productValue × 100
    let nonOriginating = input.nonOriginatingMaterialValue;
    if (nonOriginating === undefined && materials) {
      nonOriginating = materials
        .filter(m => m.origin !== origin && !fta.config.members.includes(m.origin))
        .reduce((sum, m) => sum + m.value, 0);
    }

    // C4: Cumulation — count FTA member inputs as originating
    let cumulationBonus = 0;
    if (inputOrigins && (fta.config.cumulationType === 'diagonal' || fta.config.cumulationType === 'full')) {
      const memberInputCount = inputOrigins.filter(o => fta.config.members.includes(o) && o !== origin).length;
      if (memberInputCount > 0 && materials) {
        cumulationBonus = materials
          .filter(m => fta.config.members.includes(m.origin) && m.origin !== origin)
          .reduce((sum, m) => sum + m.value, 0);
      }
    }

    if (nonOriginating !== undefined) {
      const adjustedNonOrig = Math.max(0, nonOriginating - cumulationBonus);
      rvcPercentage = Math.round((productValue - adjustedNonOrig) / productValue * 10000) / 100;
    } else if (localContentValue) {
      rvcPercentage = Math.round((localContentValue + cumulationBonus) / productValue * 10000) / 100;
    }

    if (rvcPercentage !== undefined) {
      if (rvcPercentage >= requiredRvc) {
        criteriaMetList.push('RVC');
      } else {
        criteriaFailed.push('RVC');
      }
    }
  }

  // ─── CTH/CC/CTSH — Tariff Shift ───
  let substantialTransformation: boolean | undefined;
  if (materials && materials.length > 0) {
    const productHeading = hs6.slice(0, 4);
    const productChapter = hs6.slice(0, 2);

    // CTH
    const allDiffHeading = materials.every(m => m.hsCode.slice(0, 4) !== productHeading);
    if (allDiffHeading) {
      criteriaMetList.push('CTH');
    } else {
      criteriaFailed.push('CTH');
    }

    // CC
    const allDiffChapter = materials.every(m => m.hsCode.slice(0, 2) !== productChapter);
    if (allDiffChapter) {
      criteriaMetList.push('CC');
    } else {
      criteriaFailed.push('CC');
    }

    // CTSH
    const allDiffSubheading = materials.every(m => m.hsCode.slice(0, 6) !== hs6);
    if (allDiffSubheading) {
      criteriaMetList.push('CTSH');
    } else {
      criteriaFailed.push('CTSH');
    }

    // C2: Substantial transformation check
    if (criteriaMetList.includes('CTH') || criteriaMetList.includes('CC')) {
      const totalMaterialValue = materials.reduce((sum, m) => sum + m.value, 0);
      if (productValue && totalMaterialValue > 0) {
        const materialRatio = totalMaterialValue / productValue;
        substantialTransformation = materialRatio > 0.20;
        if (!substantialTransformation) {
          warnings.push('Tariff shift detected but transformation may not be "substantial" (material cost <20% of product value). Consult customs advisor.');
        }
      } else {
        substantialTransformation = true; // Assume substantial if no cost data
      }
    }
  }

  // ─── M2: De Minimis Rule ───
  // If non-originating materials are below threshold, product still qualifies
  let deMinimisApplied = false;
  if (materials && materials.length > 0) {
    const nonOrigMaterials = materials.filter(m => m.origin !== origin && !fta.config.members.includes(m.origin));
    const nonOrigValue = nonOrigMaterials.reduce((sum, m) => sum + m.value, 0);
    const totalMaterialValue = materials.reduce((sum, m) => sum + m.value, 0);
    const base = productValue || totalMaterialValue;
    const nonOrigPct = base > 0 ? (nonOrigValue / base) * 100 : 0;

    if (nonOrigPct > 0 && nonOrigPct <= fta.config.deMinimisThreshold) {
      deMinimisApplied = true;
      if (!criteriaMetList.includes('RVC')) {
        criteriaMetList.push('RVC');
        const idx = criteriaFailed.indexOf('RVC');
        if (idx >= 0) criteriaFailed.splice(idx, 1);
      }
      warnings.push(`De minimis rule applied: non-originating materials (${nonOrigPct.toFixed(1)}%) ≤ ${fta.config.deMinimisThreshold}% threshold.`);
    }
  }

  // ─── Cumulation flag ───
  const cumulationApplied = !!(inputOrigins && inputOrigins.some(o => fta.config.members.includes(o) && o !== origin));

  // ─── CW34-S4.5: originatingContentPct shortcut for RVC ───
  if (input.originatingContentPct !== undefined && rvcPercentage === undefined) {
    rvcPercentage = input.originatingContentPct;
    if (rvcPercentage >= requiredRvc) {
      criteriaMetList.push('RVC');
    } else {
      criteriaFailed.push('RVC');
    }
  }

  // ─── Eligibility determination ───
  const eligible = criteriaMetList.length > 0;

  // CW34-S4.5: Three-state verdict (Rule 12 — no fake "eligible")
  let verdict: EligibilityVerdict;
  if (criteriaMetList.length > 0) {
    verdict = 'eligible';
  } else if (criteriaFailed.length > 0) {
    verdict = 'ineligible';
  } else {
    // No criteria evaluated (insufficient input) → indeterminate
    verdict = 'indeterminate';
    warnings.push('Insufficient data to determine eligibility. Provide productValue, materials, or originatingContentPct.');
  }

  // M4: Savings calculation (estimated MFN vs FTA)
  const mfnDutyEstimate = productValue ? Math.round(productValue * 0.08 * 100) / 100 : 0; // ~8% avg MFN
  const ftaDutyEstimate = productValue ? Math.round(productValue * 0.02 * 100) / 100 : 0; // ~2% avg FTA
  const savingsIfEligible = eligible ? Math.round((mfnDutyEstimate - ftaDutyEstimate) * 100) / 100 : 0;

  // CW34-S4.5: 10-field evidence
  const tenFieldEvidence: Record<string, unknown> = {};
  if (input.material) tenFieldEvidence.material = input.material;
  if (input.materialComposition) tenFieldEvidence.materialComposition = input.materialComposition;
  if (input.productForm) tenFieldEvidence.productForm = input.productForm;
  if (input.intendedUse) tenFieldEvidence.intendedUse = input.intendedUse;
  if (input.originatingContentPct !== undefined) tenFieldEvidence.originatingContentPct = input.originatingContentPct;

  return {
    eligible,
    verdict,
    criteriaMetList,
    criteriaFailed,
    rvcPercentage,
    requiredRvc,
    tariffShiftMet: criteriaMetList.includes('CTH') || criteriaMetList.includes('CC'),
    substantialTransformation,
    cumulationApplied,
    deMinimisApplied,
    savingsIfEligible,
    mfnDutyEstimate,
    ftaDutyEstimate,
    method: criteriaMetList.length > 0 ? criteriaMetList[0] : 'none',
    details: verdict === 'eligible'
      ? `FTA "${fta.key}" origin criteria met: ${criteriaMetList.join(', ')}. Preferential rate applies. Estimated savings: $${savingsIfEligible}.`
      : verdict === 'ineligible'
      ? `Not eligible under FTA "${fta.key}" (required RVC: ${requiredRvc}%${rvcPercentage !== undefined ? `, actual: ${rvcPercentage}%` : ''}). MFN rate applies.`
      : `Eligibility under FTA "${fta.key}" cannot be determined. Provide additional data (originatingContentPct, materials, productValue).`,
    warnings,
    tenFieldEvidence: Object.keys(tenFieldEvidence).length > 0 ? tenFieldEvidence : undefined,
  };
}

// ─── CW36-FTA-Enrichment: Async enrichment wrapper ────────────

/**
 * evaluateRoO + async enrichment from rulings/JP rules/chapter trees.
 * Backward compatible — all new fields are optional additions.
 */
export async function evaluateRoOEnriched(input: RoOInput): Promise<RoOResult> {
  const result = evaluateRoO(input);

  const EU_MEMBERS = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
  const destJurisdiction = EU_MEMBERS.includes(input.destination) ? 'EU' : input.destination;

  // 1. Ruling precedents
  try {
    const { lookupRulings } = await import('@/app/lib/rulings/lookup');
    const rulings = await lookupRulings({
      hs6: input.hs6.slice(0, 6),
      jurisdiction: destJurisdiction,
      material: input.material,
      limit: 3,
    });
    if (rulings.length > 0) {
      result.rulingPrecedents = rulings.map(r => ({
        rulingId: r.rulingId,
        source: r.source,
        hsCode: r.hsCode,
        productName: r.productName.slice(0, 100),
        confidenceScore: r.confidenceScore,
      }));
    }
  } catch { /* non-critical */ }

  // 2. JP classification guidance
  if (input.destination === 'JP') {
    try {
      const { lookupJpGuidance } = await import('@/app/lib/rulings/jp-rules-loader');
      const guidance = lookupJpGuidance(input.hs6);
      if (guidance) {
        result.classificationGuidance = guidance as unknown as Record<string, unknown>;
      }
    } catch { /* non-critical */ }
  }

  // 3. Chapter tree validation
  try {
    const { evaluateChapterTree } = await import('@/app/lib/classifier/chapter-tree-evaluator');
    const hint = evaluateChapterTree(input.hs6.slice(0, 2), '', input.material, input.productForm, input.intendedUse);
    if (hint) {
      result.chapterValidation = {
        passed: hint.excludeWarnings.length === 0,
        warnings: hint.excludeWarnings,
      };
    }
  } catch { /* non-critical */ }

  // 4. Data availability for non-EU/US jurisdictions
  try {
    const { checkDataAvailability } = await import('@/app/lib/rulings/lookup');
    const da = checkDataAvailability(destJurisdiction, input.hs6);
    if (da) {
      result.dataAvailability = da;
    }
  } catch { /* non-critical */ }

  return result;
}
