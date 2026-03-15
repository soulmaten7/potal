/**
 * POTAL API v1 — /api/v1/compliance/export-controls
 *
 * Export Controls screening endpoint (EAR/ITAR).
 * Checks products and destinations against US export control regulations.
 *
 * - EAR (Export Administration Regulations) — dual-use items, Commerce Dept (BIS)
 * - ITAR (International Traffic in Arms Regulations) — defense articles, State Dept (DDTC)
 *
 * POST /api/v1/compliance/export-controls
 * Body: {
 *   productName: string,         // required
 *   hsCode?: string,
 *   eccn?: string,               // Export Control Classification Number
 *   destinationCountry: string,  // required — ISO 2-letter
 *   endUse?: string,             // end-use description
 *   endUser?: string,            // end-user name
 *   value?: number,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// HS chapter → likely ECCN group mapping for AI-free ECCN suggestion
const HS_TO_ECCN_MAP: Record<string, { eccnGroup: string; description: string }[]> = {
  '84': [{ eccnGroup: '2B', description: 'Machine tools and manufacturing equipment' }],
  '85': [{ eccnGroup: '3A', description: 'Electronic components and equipment' }, { eccnGroup: '5A', description: 'Telecom and info security equipment' }],
  '87': [{ eccnGroup: '0A', description: 'Ground vehicles' }],
  '88': [{ eccnGroup: '9A', description: 'Aircraft and spacecraft' }],
  '89': [{ eccnGroup: '8A', description: 'Marine vessels and equipment' }],
  '90': [{ eccnGroup: '6A', description: 'Sensors, lasers, and optical equipment' }],
  '93': [{ eccnGroup: '0A', description: 'Firearms and military equipment (likely ITAR)' }],
  '28': [{ eccnGroup: '1C', description: 'Chemical precursors' }],
  '29': [{ eccnGroup: '1C', description: 'Organic chemical compounds' }],
  '38': [{ eccnGroup: '1C', description: 'Dual-use chemical products' }],
};

interface ExportControlChartEntry {
  eccn_group: string;
  reason_for_control: string;
  license_required: boolean;
  license_exceptions: string[] | null;
}

async function lookupExportControlChart(eccnGroup: string, countryCode: string): Promise<ExportControlChartEntry[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('export_control_chart')
      .select('eccn_group, reason_for_control, license_required, license_exceptions')
      .eq('eccn_group', eccnGroup)
      .eq('country_code', countryCode);
    return (data || []) as ExportControlChartEntry[];
  } catch {
    return [];
  }
}

async function suggestEccnFromProduct(productName: string, hsCode?: string): Promise<{ eccnGroup: string; description: string; isEar99: boolean } | null> {
  // First try HS-based mapping
  if (hsCode) {
    const chapter = hsCode.replace(/[^0-9]/g, '').substring(0, 2);
    const mappings = HS_TO_ECCN_MAP[chapter];
    if (mappings && mappings.length > 0) {
      return { ...mappings[0], isEar99: false };
    }
  }

  // Check product name for obvious keywords
  const lowerName = productName.toLowerCase();
  if (/semiconductor|chip|processor|integrated circuit/i.test(lowerName)) {
    return { eccnGroup: '3A', description: 'Electronic components (semiconductor)', isEar99: false };
  }
  if (/laser|lidar|sensor|camera.*infrared/i.test(lowerName)) {
    return { eccnGroup: '6A', description: 'Sensors and lasers', isEar99: false };
  }
  if (/encryption|crypto|vpn|secure comm/i.test(lowerName)) {
    return { eccnGroup: '5A', description: 'Information security / encryption', isEar99: false };
  }
  if (/drone|uav|unmanned/i.test(lowerName)) {
    return { eccnGroup: '9A', description: 'Unmanned aerial vehicles', isEar99: false };
  }
  if (/nuclear|centrifuge|isotope/i.test(lowerName)) {
    return { eccnGroup: '0B', description: 'Nuclear-related equipment', isEar99: false };
  }

  // Most commercial goods are EAR99
  return { eccnGroup: 'EAR99', description: 'Not controlled — eligible for export without license to most destinations', isEar99: true };
}

// ─── Export Control Data ───────────────────────────

// Country groups per EAR Part 740 Supplement 1
const COUNTRY_GROUP_E1 = new Set(['CU', 'IR', 'KP', 'SY']); // Embargoed
const COUNTRY_GROUP_E2 = new Set(['CU']); // Cuba
const COUNTRY_GROUP_D1 = new Set([
  'AF', 'AM', 'AZ', 'BY', 'CN', 'GE', 'IQ', 'KG', 'KZ', 'LA',
  'MN', 'MM', 'PK', 'RU', 'TJ', 'TM', 'UA', 'UZ', 'VN',
]); // National security concerns
const COUNTRY_GROUP_D5 = new Set(['IR', 'KP', 'SY']); // US arms embargo

// Sensitive HS chapters that may require export license
const SENSITIVE_HS_CHAPTERS: Record<string, string> = {
  '27': 'Mineral fuels (potential energy sector controls)',
  '28': 'Inorganic chemicals (potential CW precursor controls)',
  '29': 'Organic chemicals (potential CW precursor controls)',
  '38': 'Chemical products (potential dual-use controls)',
  '84': 'Nuclear reactors, boilers, machinery (potential dual-use)',
  '85': 'Electrical machinery, electronics (potential dual-use, EAR)',
  '87': 'Vehicles (potential military end-use concerns)',
  '88': 'Aircraft and parts (ITAR/EAR controlled)',
  '89': 'Ships and boats (potential naval controls)',
  '90': 'Optical, measuring instruments (potential dual-use)',
  '93': 'Arms and ammunition (ITAR controlled)',
};

// ECCN categories (Commerce Control List)
const ECCN_CATEGORIES: Record<string, string> = {
  '0': 'Nuclear Materials, Facilities, and Equipment',
  '1': 'Special Materials and Related Equipment, Chemicals, Microorganisms, and Toxins',
  '2': 'Materials Processing',
  '3': 'Electronics Design, Development, and Production',
  '4': 'Computers',
  '5': 'Telecommunications and Information Security',
  '6': 'Sensors and Lasers',
  '7': 'Navigation and Avionics',
  '8': 'Marine',
  '9': 'Aerospace and Propulsion',
};

// Sensitive end-use keywords
const SENSITIVE_END_USES = [
  { pattern: /nuclear|enrichment|centrifuge/i, control: 'Nuclear Non-Proliferation (NP)' },
  { pattern: /missile|rocket|propulsion|guidance/i, control: 'Missile Technology (MT)' },
  { pattern: /chemical weapon|biological weapon|cw|bw/i, control: 'Chemical & Biological Weapons (CB)' },
  { pattern: /military|defense|weapon|ammunition/i, control: 'ITAR/Munitions List' },
  { pattern: /surveillance|intercept|monitor/i, control: 'Regional Stability (RS) / Crime Control (CC)' },
  { pattern: /encryption|cryptograph/i, control: 'Encryption Items (EI)' },
];

// ─── Types ─────────────────────────────────────────

interface ExportControlIssue {
  type: 'embargo' | 'license_required' | 'end_use_concern' | 'entity_concern' | 'itar' | 'ear';
  severity: 'blocked' | 'license_required' | 'warning';
  message: string;
  regulation?: string;
}

// ─── Screening Logic ───────────────────────────────

function screenExportControls(
  productName: string,
  destinationCountry: string,
  hsCode?: string,
  eccn?: string,
  endUse?: string,
  endUser?: string,
): ExportControlIssue[] {
  const issues: ExportControlIssue[] = [];
  const dest = destinationCountry.toUpperCase();

  // 1. Embargo check (highest priority)
  if (COUNTRY_GROUP_E1.has(dest)) {
    issues.push({
      type: 'embargo',
      severity: 'blocked',
      message: `${dest} is under comprehensive US embargo (EAR Country Group E:1). Virtually all exports prohibited without specific OFAC license.`,
      regulation: 'EAR Part 746, OFAC Sanctions',
    });
  }

  // 2. Arms embargo check
  if (COUNTRY_GROUP_D5.has(dest)) {
    issues.push({
      type: 'embargo',
      severity: 'blocked',
      message: `${dest} is under US arms embargo (Country Group D:5). Defense articles and services prohibited.`,
      regulation: 'EAR Part 746',
    });
  }

  // 3. National security country check
  if (COUNTRY_GROUP_D1.has(dest)) {
    issues.push({
      type: 'license_required',
      severity: 'license_required',
      message: `${dest} is in Country Group D:1 (national security concern). Many dual-use items require BIS export license.`,
      regulation: 'EAR Part 742',
    });
  }

  // 4. HS code screening
  if (hsCode) {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    const sensitiveDesc = SENSITIVE_HS_CHAPTERS[chapter];
    if (sensitiveDesc) {
      issues.push({
        type: 'ear',
        severity: 'warning',
        message: `HS chapter ${chapter}: ${sensitiveDesc}. May be subject to export controls — verify ECCN classification.`,
        regulation: 'EAR Commerce Control List',
      });
    }

    // ITAR check for arms/ammunition
    if (chapter === '93') {
      issues.push({
        type: 'itar',
        severity: 'license_required',
        message: 'Arms and ammunition (HS 93) are likely controlled under ITAR (US Munitions List). State Department license required.',
        regulation: 'ITAR 22 CFR 120-130',
      });
    }
  }

  // 5. ECCN screening
  if (eccn) {
    const category = eccn.charAt(0);
    const categoryName = ECCN_CATEGORIES[category];
    if (categoryName) {
      const controlLevel = eccn.charAt(1);
      if (controlLevel !== '9') { // x9xx = EAR99 equivalent
        issues.push({
          type: 'ear',
          severity: COUNTRY_GROUP_D1.has(dest) ? 'license_required' : 'warning',
          message: `ECCN ${eccn} (${categoryName}): Controlled item. ${COUNTRY_GROUP_D1.has(dest) ? 'License likely required for ' + dest + '.' : 'Verify license requirements for destination.'}`,
          regulation: 'EAR Part 774, Commerce Control List',
        });
      }
    }
  }

  // 6. End-use screening
  if (endUse) {
    for (const { pattern, control } of SENSITIVE_END_USES) {
      if (pattern.test(endUse)) {
        issues.push({
          type: 'end_use_concern',
          severity: 'license_required',
          message: `Sensitive end-use detected: "${endUse}" may trigger ${control} controls. License determination required.`,
          regulation: 'EAR Part 744 (End-Use Controls)',
        });
      }
    }
  }

  // 7. End-user concern (basic check)
  if (endUser) {
    issues.push({
      type: 'entity_concern',
      severity: 'warning',
      message: `End-user "${endUser}" should be screened against BIS Entity List, Denied Persons List, and Unverified List. Use /api/v1/screen for full screening.`,
      regulation: 'EAR Part 744 Supplement 4',
    });
  }

  return issues;
}

// ─── Handler ───────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const eccn = typeof body.eccn === 'string' ? body.eccn.toUpperCase().trim() : undefined;
  const endUse = typeof body.endUse === 'string' ? body.endUse.trim() : undefined;
  const endUser = typeof body.endUser === 'string' ? body.endUser.trim() : undefined;

  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  }
  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be a 2-letter ISO code.');
  }

  const issues = screenExportControls(productName, destinationCountry, hsCode, eccn, endUse, endUser);

  // ECCN suggestion if not provided
  const eccnSuggestion = !eccn ? await suggestEccnFromProduct(productName, hsCode) : null;
  const effectiveEccnGroup = eccn ? eccn.substring(0, 2) : eccnSuggestion?.eccnGroup || null;

  // DB chart lookup for license requirements
  let chartResults: ExportControlChartEntry[] = [];
  let licenseRequiredByChart = false;
  let availableExceptions: string[] = [];
  if (effectiveEccnGroup && effectiveEccnGroup !== 'EAR99') {
    chartResults = await lookupExportControlChart(effectiveEccnGroup, destinationCountry);
    const requiresLicense = chartResults.filter(c => c.license_required);
    licenseRequiredByChart = requiresLicense.length > 0;

    // Collect all available license exceptions
    const exceptionSet = new Set<string>();
    for (const c of chartResults) {
      if (c.license_exceptions) {
        for (const ex of c.license_exceptions) exceptionSet.add(ex);
      }
    }
    availableExceptions = Array.from(exceptionSet);

    if (licenseRequiredByChart) {
      const reasons = requiresLicense.map(c => c.reason_for_control).join(', ');
      issues.push({
        type: 'ear',
        severity: 'license_required',
        message: `BIS Commerce Country Chart: ECCN ${effectiveEccnGroup} to ${destinationCountry} requires license for: ${reasons}`,
        regulation: 'EAR Part 738, Commerce Country Chart',
      });
    }
  }

  const blocked = issues.some(i => i.severity === 'blocked');
  const licenseRequired = issues.some(i => i.severity === 'license_required') || licenseRequiredByChart;

  const status: 'clear' | 'license_required' | 'blocked' =
    blocked ? 'blocked'
      : licenseRequired ? 'license_required'
        : 'clear';

  return apiSuccess(
    {
      status,
      productName,
      destinationCountry,
      eccn: eccn || null,
      eccn_suggestion: eccnSuggestion ? {
        eccn_group: eccnSuggestion.eccnGroup,
        description: eccnSuggestion.description,
        is_ear99: eccnSuggestion.isEar99,
      } : null,
      ear99: eccnSuggestion?.isEar99 ?? (eccn ? eccn.includes('99') : null),
      license_required: licenseRequired,
      available_exceptions: availableExceptions,
      issues,
      chart_results: chartResults.length > 0 ? chartResults.map(c => ({
        eccn_group: c.eccn_group,
        reason: c.reason_for_control,
        license_required: c.license_required,
        exceptions: c.license_exceptions,
      })) : null,
      countryGroups: {
        E1_embargo: COUNTRY_GROUP_E1.has(destinationCountry),
        D1_national_security: COUNTRY_GROUP_D1.has(destinationCountry),
        D5_arms_embargo: COUNTRY_GROUP_D5.has(destinationCountry),
      },
      recommendations: blocked
        ? ['Export to this destination is prohibited. Contact legal counsel before proceeding.']
        : licenseRequired
          ? [
              'BIS export license may be required. Consult export compliance counsel.',
              'File license application via BIS SNAP-R system.',
              ...(availableExceptions.length > 0 ? [`Possible license exceptions: ${availableExceptions.join(', ')}`] : []),
            ]
          : ['No export control issues detected based on provided information.', 'This screening does not replace professional export compliance review.'],
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { productName: "...", destinationCountry: "CN", hsCode?: "...", eccn?: "3A001" }'
  );
}
