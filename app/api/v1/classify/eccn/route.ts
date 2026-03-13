/**
 * POTAL API v1 — /api/v1/classify/eccn
 *
 * ECCN (Export Control Classification Number) and Schedule B classification.
 * Maps HS codes to ECCN and Schedule B codes for US export compliance.
 *
 * POST /api/v1/classify/eccn
 * Body: {
 *   productName: string,     // required
 *   hsCode?: string,         // optional — HS code to map from
 *   category?: string,       // optional — product category hint
 *   technicalSpecs?: string, // optional — technical specifications
 * }
 *
 * Returns: { eccn, scheduleB, exportControlStatus, licenseRequirements }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── ECCN Categories & Product Groups ──────────────

interface EccnMapping {
  eccn: string;
  description: string;
  controlReasons: string[];
  licenseExceptions?: string[];
}

// HS chapter → likely ECCN category mapping
const HS_TO_ECCN_MAP: Record<string, EccnMapping[]> = {
  '84': [
    { eccn: '2B001', description: 'Machine tools for metal removal', controlReasons: ['NS', 'NP', 'AT'], licenseExceptions: ['LVS', 'GBS'] },
    { eccn: '2B003', description: 'Machine tools for metal forming', controlReasons: ['NS', 'NP'], licenseExceptions: ['LVS'] },
  ],
  '85': [
    { eccn: '3A001', description: 'Electronic components', controlReasons: ['NS', 'AT'], licenseExceptions: ['LVS', 'GBS', 'TSR'] },
    { eccn: '3A002', description: 'General purpose electronic equipment', controlReasons: ['NS', 'AT'] },
    { eccn: '5A002', description: 'Information security systems and equipment', controlReasons: ['NS', 'AT', 'EI'] },
  ],
  '87': [
    { eccn: '0A606', description: 'Ground vehicles and components', controlReasons: ['NS', 'RS', 'AT'] },
  ],
  '88': [
    { eccn: '9A610', description: 'Aircraft and related commodities', controlReasons: ['NS', 'RS', 'AT', 'UN'] },
  ],
  '89': [
    { eccn: '8A001', description: 'Submersible vehicles and surface vessels', controlReasons: ['NS', 'AT'] },
  ],
  '90': [
    { eccn: '6A001', description: 'Acoustics (sensors)', controlReasons: ['NS', 'MT', 'AT'] },
    { eccn: '6A003', description: 'Cameras and imaging systems', controlReasons: ['NS', 'RS', 'AT'] },
  ],
  '93': [
    { eccn: '0A501', description: 'Firearms and related commodities', controlReasons: ['NS', 'FC', 'AT', 'UN'] },
  ],
};

// Control reason codes
const CONTROL_REASONS: Record<string, string> = {
  'NS': 'National Security',
  'NP': 'Nuclear Non-Proliferation',
  'MT': 'Missile Technology',
  'CB': 'Chemical & Biological Weapons',
  'RS': 'Regional Stability',
  'FC': 'Firearms Convention',
  'CC': 'Crime Control',
  'AT': 'Anti-Terrorism',
  'EI': 'Encryption Items',
  'UN': 'United Nations',
  'SI': 'Significant Items',
  'SL': 'Surreptitious Listening',
  'SS': 'Short Supply',
};

// Schedule B = first 6 digits of HS code + 4 more specific digits for US exports
function deriveScheduleB(hsCode: string): string {
  const clean = hsCode.replace(/\./g, '');
  // Schedule B uses the same 6-digit base as HS, with US-specific 4 additional digits
  if (clean.length >= 10) return clean.substring(0, 10);
  if (clean.length >= 6) return clean.substring(0, 6) + '0'.repeat(10 - clean.length);
  return clean + '0'.repeat(10 - clean.length);
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
  let hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const category = typeof body.category === 'string' ? body.category.trim() : undefined;
  const technicalSpecs = typeof body.technicalSpecs === 'string' ? body.technicalSpecs.trim() : undefined;

  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  }

  // Auto-classify HS code if not provided
  if (!hsCode) {
    try {
      const classification = await classifyProductAsync(productName, category, context.sellerId);
      if (classification.hsCode && classification.hsCode !== '9999') {
        hsCode = classification.hsCode;
      }
    } catch { /* classification failed */ }
  }

  // Derive Schedule B from HS code
  const scheduleB = hsCode ? deriveScheduleB(hsCode) : null;

  // Map to potential ECCN
  let eccnCandidates: EccnMapping[] = [];
  if (hsCode) {
    const chapter = hsCode.replace(/\./g, '').substring(0, 2);
    eccnCandidates = HS_TO_ECCN_MAP[chapter] || [];
  }

  // Determine export control status
  let exportControlStatus: 'EAR99' | 'controlled' | 'itar_possible' | 'unknown' = 'EAR99';

  if (eccnCandidates.length > 0) {
    exportControlStatus = 'controlled';
  }

  // Check for ITAR indicators
  const nameLower = productName.toLowerCase();
  const itarKeywords = ['weapon', 'ammunition', 'missile', 'warhead', 'munition', 'military grade', 'defense'];
  if (itarKeywords.some(kw => nameLower.includes(kw))) {
    exportControlStatus = 'itar_possible';
  }

  // Check technical specs for control indicators
  const specControls: string[] = [];
  if (technicalSpecs) {
    const specsLower = technicalSpecs.toLowerCase();
    if (/encrypt|aes.?256|rsa|cryptograph/i.test(specsLower)) specControls.push('EI (Encryption)');
    if (/infrared|thermal imaging|night vision/i.test(specsLower)) specControls.push('NS (Night Vision/IR)');
    if (/nuclear|radiation|centrifuge/i.test(specsLower)) specControls.push('NP (Nuclear)');
    if (/gps.*military|inertial nav/i.test(specsLower)) specControls.push('MT (Navigation)');
  }

  return apiSuccess(
    {
      productName,
      hsCode: hsCode || null,
      scheduleB,
      exportControlStatus,
      eccn: eccnCandidates.length > 0 ? {
        candidates: eccnCandidates.map(c => ({
          eccn: c.eccn,
          description: c.description,
          controlReasons: c.controlReasons.map(r => ({
            code: r,
            name: CONTROL_REASONS[r] || r,
          })),
          licenseExceptions: c.licenseExceptions || [],
        })),
        note: 'ECCN candidates based on HS code mapping. Final determination requires self-classification or BIS CCATS request.',
      } : {
        candidates: [],
        note: exportControlStatus === 'EAR99'
          ? 'Product likely classified as EAR99 (no license required for most destinations).'
          : 'Unable to determine ECCN. Self-classification or BIS consultation recommended.',
      },
      technicalControls: specControls.length > 0 ? specControls : null,
      recommendations: [
        exportControlStatus === 'itar_possible'
          ? 'Product may be ITAR-controlled. Consult State Department DDTC for jurisdiction determination.'
          : exportControlStatus === 'controlled'
            ? 'Product may require BIS export license depending on destination. Run /api/v1/compliance/export-controls for destination-specific check.'
            : 'Product appears to be EAR99 (most commercial items). No license typically required except for embargoed destinations.',
        'This is a preliminary screening. Final ECCN determination should be made by a qualified export compliance professional.',
      ],
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
    'Use POST method. Body: { productName: "...", hsCode?: "8471.30", technicalSpecs?: "..." }'
  );
}
