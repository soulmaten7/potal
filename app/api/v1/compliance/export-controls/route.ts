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

  const blocked = issues.some(i => i.severity === 'blocked');
  const licenseRequired = issues.some(i => i.severity === 'license_required');

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
      issues,
      countryGroups: {
        E1_embargo: COUNTRY_GROUP_E1.has(destinationCountry),
        D1_national_security: COUNTRY_GROUP_D1.has(destinationCountry),
        D5_arms_embargo: COUNTRY_GROUP_D5.has(destinationCountry),
      },
      recommendations: blocked
        ? ['Export to this destination is prohibited. Contact legal counsel before proceeding.']
        : licenseRequired
          ? ['BIS export license may be required. Consult export compliance counsel.', 'File license application via BIS SNAP-R system.']
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
