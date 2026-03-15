/**
 * F029: Temporary Import/Export Rules
 */

export interface TempAdmissionRules {
  country: string;
  maxDurationMonths: number;
  bondRequired: boolean;
  bondRatePct: number;
  eligiblePurposes: string[];
  ataCarnetAccepted: boolean;
  reExportRequirements: string[];
}

const COUNTRY_RULES: Record<string, TempAdmissionRules> = {
  US: { country: 'US', maxDurationMonths: 12, bondRequired: true, bondRatePct: 110, eligiblePurposes: ['Exhibition', 'Testing', 'Repair', 'Professional equipment'], ataCarnetAccepted: true, reExportRequirements: ['Must re-export within authorized period', 'File CBP Form 3461'] },
  EU: { country: 'EU', maxDurationMonths: 24, bondRequired: false, bondRatePct: 0, eligiblePurposes: ['Exhibition', 'Scientific', 'Professional equipment', 'Samples', 'Artistic/cultural'], ataCarnetAccepted: true, reExportRequirements: ['Temporary Admission (TA) procedure', 'ATA Carnet or deposit'] },
  GB: { country: 'GB', maxDurationMonths: 24, bondRequired: false, bondRatePct: 0, eligiblePurposes: ['Exhibition', 'Testing', 'Repair', 'Professional equipment'], ataCarnetAccepted: true, reExportRequirements: ['CPC 5300001', 'Must be re-exported in same condition'] },
  JP: { country: 'JP', maxDurationMonths: 12, bondRequired: true, bondRatePct: 100, eligiblePurposes: ['Exhibition', 'Testing', 'Professional equipment'], ataCarnetAccepted: true, reExportRequirements: ['Japan Customs Form C-5000', 'Re-export certificate'] },
  KR: { country: 'KR', maxDurationMonths: 12, bondRequired: true, bondRatePct: 120, eligiblePurposes: ['Exhibition', 'Testing', 'Film production', 'Professional equipment'], ataCarnetAccepted: true, reExportRequirements: ['KCS temporary import declaration', 'Bond or deposit'] },
  CN: { country: 'CN', maxDurationMonths: 6, bondRequired: true, bondRatePct: 100, eligiblePurposes: ['Exhibition', 'Testing', 'Sports events'], ataCarnetAccepted: true, reExportRequirements: ['China Customs TA approval', 'Full duty deposit required if no ATA Carnet'] },
  AU: { country: 'AU', maxDurationMonths: 12, bondRequired: true, bondRatePct: 100, eligiblePurposes: ['Exhibition', 'Demonstration', 'Testing', 'Professional equipment'], ataCarnetAccepted: true, reExportRequirements: ['ABF temporary import permit', 'Security deposit or ATA Carnet'] },
};

const DEFAULT_RULES: TempAdmissionRules = {
  country: '', maxDurationMonths: 6, bondRequired: true, bondRatePct: 100,
  eligiblePurposes: ['Exhibition', 'Testing'], ataCarnetAccepted: false,
  reExportRequirements: ['Contact local customs authority for requirements'],
};

export function getTemporaryAdmissionRules(country: string): TempAdmissionRules {
  const c = country.toUpperCase();
  return COUNTRY_RULES[c] || { ...DEFAULT_RULES, country: c };
}

export function calculateBond(value: number, country: string): { bondAmount: number; refundable: boolean } {
  const rules = getTemporaryAdmissionRules(country);
  if (!rules.bondRequired) return { bondAmount: 0, refundable: false };
  const bondAmount = Math.round(value * rules.bondRatePct / 100 * 100) / 100;
  return { bondAmount, refundable: true };
}
