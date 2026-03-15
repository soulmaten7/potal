/**
 * F003/F023: Rules of Origin Engine — S+ Grade
 */

export type OriginCriteria = 'WO' | 'PE' | 'RVC' | 'CTH' | 'CC' | 'CTSH';

export interface RoOInput {
  hs6: string;
  origin: string;
  destination: string;
  ftaId?: string;
  productValue?: number;
  localContentValue?: number;
  materials?: Array<{ hsCode: string; origin: string; value: number }>;
}

export interface RoOResult {
  eligible: boolean;
  criteriaMetList: OriginCriteria[];
  criteriaFailed: OriginCriteria[];
  rvcPercentage?: number;
  requiredRvc?: number;
  tariffShiftMet?: boolean;
  savingsIfEligible: number;
  method: string;
  details: string;
}

// Default RVC thresholds by FTA type
const RVC_THRESHOLDS: Record<string, number> = {
  'USMCA': 75, 'KORUS': 35, 'EU-KR': 40, 'CPTPP': 45,
  'RCEP': 40, 'UKTRADE': 40, 'EFTA': 50, 'DEFAULT': 40,
};

export function evaluateRoO(input: RoOInput): RoOResult {
  const { hs6, origin, destination, productValue, localContentValue, materials } = input;
  const ftaKey = input.ftaId || 'DEFAULT';
  const requiredRvc = RVC_THRESHOLDS[ftaKey] || RVC_THRESHOLDS['DEFAULT'];

  const criteriaMetList: OriginCriteria[] = [];
  const criteriaFailed: OriginCriteria[] = [];

  // WO — Wholly Obtained (agricultural, mineral)
  const woChapters = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '25', '26', '27']);
  const chapter = hs6.slice(0, 2);
  if (woChapters.has(chapter) && !materials?.some(m => m.origin !== origin)) {
    criteriaMetList.push('WO');
  } else if (woChapters.has(chapter)) {
    criteriaFailed.push('WO');
  }

  // RVC — Regional Value Content
  let rvcPercentage: number | undefined;
  if (productValue && localContentValue) {
    rvcPercentage = Math.round(localContentValue / productValue * 10000) / 100;
    if (rvcPercentage >= requiredRvc) {
      criteriaMetList.push('RVC');
    } else {
      criteriaFailed.push('RVC');
    }
  }

  // CTH — Change in Tariff Heading
  if (materials && materials.length > 0) {
    const productHeading = hs6.slice(0, 4);
    const allDifferentHeading = materials.every(m => m.hsCode.slice(0, 4) !== productHeading);
    if (allDifferentHeading) {
      criteriaMetList.push('CTH');
    } else {
      criteriaFailed.push('CTH');
    }

    // CC — Change in Chapter
    const productChapter = hs6.slice(0, 2);
    const allDifferentChapter = materials.every(m => m.hsCode.slice(0, 2) !== productChapter);
    if (allDifferentChapter) {
      criteriaMetList.push('CC');
    } else {
      criteriaFailed.push('CC');
    }

    // CTSH
    const allDifferentSubheading = materials.every(m => m.hsCode.slice(0, 6) !== hs6);
    if (allDifferentSubheading) {
      criteriaMetList.push('CTSH');
    } else {
      criteriaFailed.push('CTSH');
    }
  }

  const eligible = criteriaMetList.length > 0;
  // Estimated savings: ~5% duty reduction on average
  const savingsIfEligible = productValue ? Math.round(productValue * 0.05 * 100) / 100 : 0;

  return {
    eligible,
    criteriaMetList,
    criteriaFailed,
    rvcPercentage,
    requiredRvc,
    tariffShiftMet: criteriaMetList.includes('CTH') || criteriaMetList.includes('CC'),
    savingsIfEligible,
    method: criteriaMetList.length > 0 ? criteriaMetList[0] : 'none',
    details: eligible
      ? `Origin criteria met: ${criteriaMetList.join(', ')}. FTA preferential rate may apply.`
      : `No origin criteria met. MFN rate applies.`,
  };
}
