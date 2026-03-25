/**
 * F037: Export Controls — ECCN classification, EAR, Commerce Country Chart
 *
 * Features:
 * - HS → ECCN mapping (11 chapters + keyword detection)
 * - Country groups (E1/E2/D1-D5/B per EAR Part 740 Supplement 1)
 * - License exceptions with LVS value thresholds
 * - ITAR compound keyword detection (reduced false positives)
 * - Unknown HS → CLASSIFICATION_REQUIRED (not auto-EAR99)
 */

export interface LicenseException {
  code: string;
  name: string;
  eligible: boolean;
  reason?: string;
}

export interface ECCNResult {
  eccn: string;
  ear99: boolean;
  category: string;
  categoryName: string;
  licenseRequired: boolean;
  licenseExceptions: LicenseException[];
  controlledDestinations: string[];
  reasonForControl: string[];
  classificationStatus: 'classified' | 'ear99' | 'classification_required' | 'itar_possible';
  warning?: string;
  itarGuidance?: { message: string; ddtcUrl: string; action: string };
}

// ─── HS → ECCN Mapping ──────────────────────────────

const HS_TO_ECCN_MAP: Record<string, { eccn: string; category: string; categoryName: string; reasons: string[] }> = {
  '27': { eccn: '1C', category: '1', categoryName: 'Energy Materials', reasons: ['NS', 'AT'] },
  '28': { eccn: '1C', category: '1', categoryName: 'Inorganic Chemicals', reasons: ['CB', 'CW'] },
  '29': { eccn: '1C', category: '1', categoryName: 'Organic Chemicals', reasons: ['CB', 'CW'] },
  '38': { eccn: '1C', category: '1', categoryName: 'Chemical Products', reasons: ['CB', 'CW'] },
  '39': { eccn: '1C', category: '1', categoryName: 'Plastics (precursor potential)', reasons: ['CB'] },
  '84': { eccn: '2B', category: '2', categoryName: 'Materials Processing', reasons: ['NS', 'MT'] },
  '85': { eccn: '3A', category: '3', categoryName: 'Electronics', reasons: ['NS', 'AT'] },
  '88': { eccn: '9A', category: '9', categoryName: 'Aerospace & Propulsion', reasons: ['NS', 'MT'] },
  '90': { eccn: '6A', category: '6', categoryName: 'Sensors & Lasers', reasons: ['NS', 'MT'] },
  '93': { eccn: '0A', category: '0', categoryName: 'Arms (likely ITAR)', reasons: ['NS', 'FC', 'CC'] },
};

// ─── Country Groups (EAR Part 740 Supplement 1) ─────

const CONTROLLED_DESTINATIONS = new Set(['CU', 'IR', 'KP', 'SY', 'RU', 'BY']);
const TIER_B_COUNTRIES = new Set(['CN', 'VE', 'MM', 'IQ', 'LB', 'LY', 'SO', 'SD', 'YE']);

export const COUNTRY_GROUPS: Record<string, Set<string>> = {
  E1: new Set(['CU', 'IR', 'KP', 'SY']),
  E2: new Set(['CU']),
  D1: new Set(['AF', 'AM', 'AZ', 'BY', 'CN', 'GE', 'IQ', 'KG', 'KZ', 'LA', 'MN', 'MM', 'PK', 'RU', 'TJ', 'TM', 'UA', 'UZ', 'VN']),
  D3: new Set(['BY', 'CN', 'IQ', 'PK', 'RU']),
  D4: new Set(['AF', 'BY', 'CN', 'CU', 'IQ', 'IR', 'KP', 'LB', 'LY', 'MM', 'PK', 'RU', 'SO', 'SD', 'SY', 'VE', 'YE']),
  D5: new Set(['IR', 'KP', 'SY']),
  B: new Set(['AU', 'AT', 'BE', 'CA', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'NL', 'NZ', 'NO', 'PL', 'PT', 'SK', 'SI', 'ES', 'SE', 'CH', 'TR', 'GB']),
};

// ─── LVS Thresholds (USD) ───────────────────────────

const LVS_THRESHOLDS: Record<string, number> = {
  '0': 0, '1': 5000, '2': 5000, '3': 5000, '4': 5000,
  '5': 5000, '6': 5000, '7': 0, '8': 5000, '9': 0,
};

// ─── ITAR Patterns ──────────────────────────────────

const ITAR_COMPOUND_PATTERNS = [
  /\b(weapon|firearm|munition)s?\b.*\b(system|component|part|assembly)\b/i,
  /\b(missile|rocket|warhead|torpedo)\b.*\b(guidance|propulsion|payload|launch)\b/i,
  /\bmilitary\b.*\b(weapon|combat|tactical|ordnance)\b/i,
];
const ITAR_WARNING_KEYWORDS = /\b(military|defense|weapon|ammunition|explosive|detonator)\b/i;

// Known consumer goods HS chapters (EAR99)
const CONSUMER_CHAPTERS = new Set([
  '01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16',
  '17','18','19','20','21','22','23','24','25','26','30','31','32','33','34','35',
  '36','37','40','41','42','43','44','45','46','47','48','49','50','51','52','53',
  '54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69',
  '70','71','72','73','74','75','76','78','79','80','81','82','83','86','87','89',
  '91','92','94','95','96','97',
]);

// ─── ECCN Classification ────────────────────────────

export function classifyECCN(params: {
  hsCode: string;
  productName: string;
  technicalSpecs?: string;
  declaredValue?: number;
}): ECCNResult {
  const chapter = params.hsCode.replace(/\./g, '').slice(0, 2);
  const nameLower = params.productName.toLowerCase();

  // 1. ITAR compound match (highest priority)
  if (ITAR_COMPOUND_PATTERNS.some(p => p.test(params.productName)) || chapter === '93') {
    return {
      eccn: 'ITAR', ear99: false, category: 'USML', categoryName: 'US Munitions List',
      licenseRequired: true, licenseExceptions: [], controlledDestinations: [...CONTROLLED_DESTINATIONS],
      reasonForControl: ['ITAR'], classificationStatus: 'itar_possible',
      itarGuidance: {
        message: 'This item may be subject to ITAR (State Dept jurisdiction). Submit CJ request to DDTC.',
        ddtcUrl: 'https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_commodity_jurisdiction',
        action: 'DO NOT EXPORT until jurisdiction is confirmed.',
      },
    };
  }

  // 2. Known controlled chapters
  const mapping = HS_TO_ECCN_MAP[chapter];
  if (mapping) {
    return {
      eccn: mapping.eccn, ear99: false, category: mapping.category, categoryName: mapping.categoryName,
      licenseRequired: true,
      licenseExceptions: determineLicenseExceptions(mapping.category, params.declaredValue),
      controlledDestinations: [...CONTROLLED_DESTINATIONS], reasonForControl: mapping.reasons,
      classificationStatus: 'classified',
    };
  }

  // 3. Keyword detection
  if (/semiconductor|chip|processor|integrated.circuit/i.test(nameLower)) {
    return buildClassified('3A', '3', 'Electronics (semiconductor)', ['NS', 'AT'], params.declaredValue);
  }
  if (/laser|lidar|infrared.sensor/i.test(nameLower)) {
    return buildClassified('6A', '6', 'Sensors & Lasers', ['NS', 'MT'], params.declaredValue);
  }
  if (/encryption|cryptograph/i.test(nameLower)) {
    return buildClassified('5A', '5', 'Information Security', ['NS', 'EI'], params.declaredValue);
  }

  // 4. Known consumer chapters → EAR99
  if (CONSUMER_CHAPTERS.has(chapter)) {
    const itarWarn = ITAR_WARNING_KEYWORDS.test(params.productName);
    return {
      eccn: 'EAR99', ear99: true, category: 'N/A', categoryName: 'Not specifically controlled',
      licenseRequired: false,
      licenseExceptions: [{ code: 'NLR', name: 'No License Required', eligible: true }],
      controlledDestinations: [...CONTROLLED_DESTINATIONS], reasonForControl: [],
      classificationStatus: 'ear99',
      ...(itarWarn ? { warning: 'Product name contains defense keyword. Verify not a defense article.' } : {}),
    };
  }

  // 5. Unknown chapter → require manual classification
  return {
    eccn: 'UNKNOWN', ear99: false, category: 'N/A', categoryName: 'Classification required',
    licenseRequired: false, licenseExceptions: [], controlledDestinations: [...CONTROLLED_DESTINATIONS],
    reasonForControl: [], classificationStatus: 'classification_required',
    warning: 'HS chapter not mapped to ECCN. Manual BIS classification required. Do not assume EAR99.',
  };
}

function buildClassified(eccn: string, cat: string, name: string, reasons: string[], value?: number): ECCNResult {
  return {
    eccn, ear99: false, category: cat, categoryName: name, licenseRequired: true,
    licenseExceptions: determineLicenseExceptions(cat, value),
    controlledDestinations: [...CONTROLLED_DESTINATIONS], reasonForControl: reasons,
    classificationStatus: 'classified',
  };
}

function determineLicenseExceptions(category: string, declaredValue?: number): LicenseException[] {
  const exceptions: LicenseException[] = [];
  const cat = parseInt(category);
  if (isNaN(cat)) return [];

  // LVS with value threshold
  const threshold = LVS_THRESHOLDS[category] || 0;
  if (threshold > 0) {
    const eligible = declaredValue === undefined || declaredValue <= threshold;
    exceptions.push({
      code: 'LVS', name: 'Low Value Shipments (§740.3)', eligible,
      reason: eligible ? `Within LVS threshold of $${threshold}` : `Value $${declaredValue} exceeds $${threshold} threshold`,
    });
  }

  exceptions.push({ code: 'TMP', name: 'Temporary Exports (§740.9)', eligible: false, reason: 'Requires documented return within 12 months' });
  exceptions.push({ code: 'RPL', name: 'Servicing & Replacement (§740.10)', eligible: true });

  if (cat >= 3 && cat <= 5) {
    exceptions.push({ code: 'TSR', name: 'Technology & Software (§740.6)', eligible: true, reason: 'For Country Group B destinations' });
  }

  return exceptions;
}

export function checkLicenseRequirement(eccn: string, destination: string, endUse?: string): {
  required: boolean; exceptionAvailable: boolean; exceptionType?: string; reason: string; countryGroups: string[];
} {
  const dest = destination.toUpperCase();
  const groups = Object.entries(COUNTRY_GROUPS).filter(([, s]) => s.has(dest)).map(([g]) => g);

  if (CONTROLLED_DESTINATIONS.has(dest)) {
    return { required: true, exceptionAvailable: false, reason: `${dest} under comprehensive sanctions.`, countryGroups: groups };
  }
  if (eccn === 'EAR99') {
    return { required: false, exceptionAvailable: true, exceptionType: 'NLR', reason: 'EAR99 — no license required.', countryGroups: groups };
  }
  if (eccn === 'UNKNOWN') {
    return { required: false, exceptionAvailable: false, reason: 'ECCN classification required first.', countryGroups: groups };
  }
  if (TIER_B_COUNTRIES.has(dest)) {
    return { required: true, exceptionAvailable: true, exceptionType: 'LVS', reason: `${dest} requires license for ${eccn}. LVS may apply.`, countryGroups: groups };
  }
  if (endUse && ITAR_COMPOUND_PATTERNS.some(p => p.test(endUse))) {
    return { required: true, exceptionAvailable: false, reason: 'Military end-use detected.', countryGroups: groups };
  }

  return { required: false, exceptionAvailable: true, exceptionType: 'NLR', reason: `No license required for ${eccn} to ${dest}.`, countryGroups: groups };
}
