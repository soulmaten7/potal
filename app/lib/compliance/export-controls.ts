/**
 * F022: Export Controls — ECCN classification, EAR, Commerce Country Chart
 */

export interface ECCNResult {
  eccn: string;
  ear99: boolean;
  category: string;
  categoryName: string;
  licenseRequired: boolean;
  licenseExceptions: string[];
  controlledDestinations: string[];
  reasonForControl: string[];
}

// EAR Category mapping (simplified HS→ECCN)
const HS_TO_ECCN_MAP: Record<string, { eccn: string; category: string; categoryName: string; reasons: string[] }> = {
  '84': { eccn: '2B', category: '2', categoryName: 'Materials Processing', reasons: ['NS', 'MT'] },
  '85': { eccn: '3A', category: '3', categoryName: 'Electronics', reasons: ['NS', 'AT'] },
  '88': { eccn: '9A', category: '9', categoryName: 'Aerospace & Propulsion', reasons: ['NS', 'MT'] },
  '90': { eccn: '6A', category: '6', categoryName: 'Sensors & Lasers', reasons: ['NS', 'MT'] },
  '93': { eccn: '0A', category: '0', categoryName: 'Nuclear & Miscellaneous', reasons: ['NS', 'FC', 'CC'] },
  '28': { eccn: '1C', category: '1', categoryName: 'Materials, Chemicals', reasons: ['CB', 'CW'] },
  '29': { eccn: '1C', category: '1', categoryName: 'Materials, Chemicals', reasons: ['CB', 'CW'] },
  '38': { eccn: '1C', category: '1', categoryName: 'Materials, Chemicals', reasons: ['CB', 'CW'] },
  // Ch.87 (vehicles): Most consumer vehicles are EAR99 — NOT mapped here.
  // Military vehicles are USML Category VII (ITAR), not EAR.
};

// Embargoed/heavily controlled destinations
const CONTROLLED_DESTINATIONS = new Set(['CU', 'IR', 'KP', 'SY', 'RU', 'BY']);
const TIER_B_COUNTRIES = new Set(['CN', 'VE', 'MM', 'IQ', 'LB', 'LY', 'SO', 'SD', 'YE']);

/**
 * Deterministic license exception lookup based on ECCN category.
 * Reference: 15 CFR § 740 (License Exceptions)
 */
function determineLicenseExceptions(category: string): string[] {
  const exceptions: string[] = [];
  const cat = parseInt(category);
  if (isNaN(cat)) return [];

  // LVS (Low Value Shipments): Categories 1-9
  if (cat >= 1 && cat <= 9) exceptions.push('LVS');
  // GBS (Governments, International Orgs): Categories 1-9
  if (cat >= 1 && cat <= 9) exceptions.push('GBS');
  // TSR (Technology & Software): Categories 3-5 (electronics/computers/telecom)
  if (cat >= 3 && cat <= 5) exceptions.push('TSR');
  // TMP (Temporary Exports): All categories
  exceptions.push('TMP');
  // RPL (Servicing & Replacement): All categories
  exceptions.push('RPL');

  return exceptions;
}

export function classifyECCN(params: { hsCode: string; productName: string; technicalSpecs?: string }): ECCNResult {
  const chapter = params.hsCode.replace(/\./g, '').slice(0, 2);
  const mapping = HS_TO_ECCN_MAP[chapter];

  if (!mapping) {
    return {
      eccn: 'EAR99',
      ear99: true,
      category: 'N/A',
      categoryName: 'Not specifically controlled',
      licenseRequired: false,
      licenseExceptions: ['NLR'],
      controlledDestinations: [...CONTROLLED_DESTINATIONS],
      reasonForControl: [],
    };
  }

  return {
    eccn: mapping.eccn,
    ear99: false,
    category: mapping.category,
    categoryName: mapping.categoryName,
    licenseRequired: true,
    licenseExceptions: determineLicenseExceptions(mapping.category),
    controlledDestinations: [...CONTROLLED_DESTINATIONS],
    reasonForControl: mapping.reasons,
  };
}

export function checkLicenseRequirement(eccn: string, destination: string, endUse?: string): {
  required: boolean;
  exceptionAvailable: boolean;
  exceptionType?: string;
  reason: string;
} {
  const dest = destination.toUpperCase();

  if (CONTROLLED_DESTINATIONS.has(dest)) {
    return { required: true, exceptionAvailable: false, reason: `${dest} is under comprehensive sanctions. License required for all controlled items.` };
  }

  if (eccn === 'EAR99') {
    return { required: false, exceptionAvailable: true, exceptionType: 'NLR', reason: 'EAR99 items generally do not require a license.' };
  }

  if (TIER_B_COUNTRIES.has(dest)) {
    return { required: true, exceptionAvailable: true, exceptionType: 'LVS', reason: `${dest} requires license for ${eccn} items. License exception LVS may apply.` };
  }

  if (endUse && /military|weapon|defense/i.test(endUse)) {
    return { required: true, exceptionAvailable: false, reason: 'Military end-use requires specific license regardless of destination.' };
  }

  return { required: false, exceptionAvailable: true, exceptionType: 'NLR', reason: `No license required for ${eccn} to ${dest}.` };
}
