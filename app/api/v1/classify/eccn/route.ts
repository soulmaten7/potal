/**
 * POTAL API v1 — /api/v1/classify/eccn
 *
 * ECCN (Export Control Classification Number) and Schedule B classification.
 * Maps HS codes to ECCN and Schedule B codes for US export compliance.
 *
 * POST /api/v1/classify/eccn
 * Body: {
 *   productName: string,           // required
 *   hsCode?: string,               // optional — HS code to map from
 *   category?: string,             // optional — product category hint
 *   technicalSpecs?: string,       // optional — technical specifications
 *   destinationCountry?: string,   // optional — for license determination (C5)
 * }
 *
 * Returns: { eccn, scheduleB, exportControlStatus, licenseRequirements, destinationAnalysis }
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
  hsRange?: string; // e.g. "8401-8402" for HS4-level precision
}

// C1: HS4 level mappings (more precise than chapter-level)
const HS4_TO_ECCN: Record<string, EccnMapping> = {
  '8401': { eccn: '0A001', description: 'Nuclear reactors and components', controlReasons: ['NP'], hsRange: '8401' },
  '8456': { eccn: '2B001', description: 'Machine tools — laser/plasma/EDM', controlReasons: ['NS', 'NP', 'AT'], licenseExceptions: ['LVS', 'GBS'], hsRange: '8456' },
  '8457': { eccn: '2B001', description: 'Machining centers', controlReasons: ['NS', 'NP', 'AT'], licenseExceptions: ['LVS'], hsRange: '8457' },
  '8458': { eccn: '2B001', description: 'Lathes for metal removal', controlReasons: ['NS', 'NP'], licenseExceptions: ['LVS'], hsRange: '8458-8461' },
  '8462': { eccn: '2B003', description: 'Machine tools for metal forming', controlReasons: ['NS', 'NP'], licenseExceptions: ['LVS'], hsRange: '8462-8463' },
  '8471': { eccn: '4A003', description: 'Digital computers and assemblies', controlReasons: ['NS', 'AT'], licenseExceptions: ['APP', 'CIV'], hsRange: '8471' },
  '8486': { eccn: '3B001', description: 'Semiconductor manufacturing equipment', controlReasons: ['NS', 'NP', 'AT'], hsRange: '8486' },
  '8525': { eccn: '6A003', description: 'Cameras and imaging systems', controlReasons: ['NS', 'RS', 'AT'], licenseExceptions: ['LVS', 'GBS'], hsRange: '8525' },
  '8526': { eccn: '7A003', description: 'Navigation equipment', controlReasons: ['NS', 'MT', 'AT'], hsRange: '8526' },
  '8541': { eccn: '3A001', description: 'Semiconductor devices', controlReasons: ['NS', 'AT'], licenseExceptions: ['LVS', 'GBS', 'TSR'], hsRange: '8541-8542' },
  '8542': { eccn: '3A001', description: 'Integrated circuits', controlReasons: ['NS', 'AT'], licenseExceptions: ['LVS', 'GBS', 'TSR'], hsRange: '8542' },
  '8543': { eccn: '3A002', description: 'Electronic equipment NES', controlReasons: ['NS', 'AT'], hsRange: '8543' },
  '8802': { eccn: '9A610', description: 'Aircraft and spacecraft', controlReasons: ['NS', 'RS', 'AT', 'UN'], hsRange: '8802' },
  '8906': { eccn: '8A001', description: 'Submersible vehicles', controlReasons: ['NS', 'AT'], hsRange: '8906' },
  '9005': { eccn: '6A002', description: 'Optical sensors and equipment', controlReasons: ['NS', 'MT', 'AT'], hsRange: '9005' },
  '9013': { eccn: '6A005', description: 'Lasers', controlReasons: ['NS', 'AT'], hsRange: '9013' },
  '9015': { eccn: '6A001', description: 'Acoustic/seismic equipment', controlReasons: ['NS', 'MT', 'AT'], hsRange: '9015' },
  '9306': { eccn: '0A501', description: 'Ammunition and components', controlReasons: ['NS', 'FC', 'AT', 'UN'], hsRange: '9306' },
  '9301': { eccn: '0A501', description: 'Military weapons', controlReasons: ['NS', 'FC', 'AT', 'UN'], hsRange: '9301-9305' },
};

// HS chapter fallback (C1: lower confidence)
const HS_CHAPTER_ECCN: Record<string, EccnMapping[]> = {
  '84': [
    { eccn: '2B001', description: 'Machine tools (general)', controlReasons: ['NS', 'NP', 'AT'] },
  ],
  '85': [
    { eccn: '3A001', description: 'Electronic components', controlReasons: ['NS', 'AT'] },
    { eccn: '5A002', description: 'Information security systems', controlReasons: ['NS', 'AT', 'EI'] },
  ],
  '87': [{ eccn: '0A606', description: 'Ground vehicles', controlReasons: ['NS', 'RS', 'AT'] }],
  '88': [{ eccn: '9A610', description: 'Aircraft and related', controlReasons: ['NS', 'RS', 'AT', 'UN'] }],
  '89': [{ eccn: '8A001', description: 'Vessels', controlReasons: ['NS', 'AT'] }],
  '90': [
    { eccn: '6A001', description: 'Sensors', controlReasons: ['NS', 'MT', 'AT'] },
    { eccn: '6A003', description: 'Cameras and imaging', controlReasons: ['NS', 'RS', 'AT'] },
  ],
  '93': [{ eccn: '0A501', description: 'Firearms and munitions', controlReasons: ['NS', 'FC', 'AT', 'UN'] }],
};

// C4: Full control reason codes (18 reasons)
const CONTROL_REASONS: Record<string, string> = {
  NS: 'National Security', NP: 'Nuclear Non-Proliferation', MT: 'Missile Technology',
  CB: 'Chemical & Biological Weapons', RS: 'Regional Stability', FC: 'Firearms Convention',
  CC: 'Crime Control', AT: 'Anti-Terrorism', EI: 'Encryption Items',
  UN: 'United Nations', SI: 'Significant Items', SL: 'Surreptitious Listening',
  SS: 'Short Supply', CW: 'Chemical Weapons', BW: 'Biological Weapons',
  AS: 'Anti-Satellite', HRS: 'Human Rights', XP: 'Computers',
};

// C5: Embargoed destinations (always license required)
const EMBARGOED = new Set(['CU', 'IR', 'KP', 'SY']);
// Country Group D:1 (national security concerns)
const GROUP_D1 = new Set(['CN', 'RU', 'BY', 'VE', 'MM', 'IQ', 'LY', 'SO', 'SD', 'YE', 'ZW']);
// Country Group A:1 (Wassenaar — generally favorable)
const GROUP_A1 = new Set([
  'AR', 'AU', 'AT', 'BE', 'BG', 'CA', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
  'GR', 'HU', 'IE', 'IT', 'JP', 'KR', 'LV', 'LT', 'LU', 'MT', 'MX', 'NL', 'NZ',
  'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'TR', 'UA', 'GB', 'US',
]);

// ─── Utility Functions ──────────────────────────────

// C6: HS code normalization + validation
function normalizeHsCode(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (cleaned.length < 4 || cleaned.length > 10) return null;
  return cleaned;
}

// C3: Schedule B derivation with confidence
function deriveScheduleB(hsCode: string): { code: string; confidence: 'low' | 'medium'; note: string } {
  const clean = hsCode.replace(/[^0-9]/g, '');
  let code: string;
  if (clean.length >= 10) {
    code = clean.substring(0, 10);
  } else if (clean.length >= 6) {
    code = clean.substring(0, 6) + '0'.repeat(10 - clean.length);
  } else {
    code = clean + '0'.repeat(10 - clean.length);
  }
  return {
    code,
    confidence: clean.length >= 10 ? 'medium' : 'low',
    note: clean.length >= 10
      ? 'Schedule B based on full 10-digit code.'
      : 'Estimated Schedule B (HS padded with zeros). Verify with Census Bureau Schedule B Search for official code.',
  };
}

// C8: ITAR confidence scoring (not just keyword presence)
function calculateItarConfidence(productName: string, specs?: string): number {
  const text = `${productName} ${specs || ''}`.toLowerCase();
  let score = 0;

  // High-confidence ITAR keywords (multi-word or very specific)
  const highKeywords = ['missile guidance', 'warhead', 'munition', 'military weapon', 'ballistic', 'fire control system', 'torpedo', 'nuclear weapon'];
  for (const kw of highKeywords) {
    if (text.includes(kw)) score += 0.45;
  }

  // Medium-confidence (need context)
  const mediumKeywords = ['weapon', 'ammunition', 'missile', 'defense system', 'military grade', 'classified'];
  for (const kw of mediumKeywords) {
    if (text.includes(kw)) score += 0.25;
  }

  // Low-confidence (common words that appear in non-defense contexts)
  const lowKeywords = ['defense', 'tactical', 'military'];
  for (const kw of lowKeywords) {
    // Only count if not followed by color/fashion terms
    const idx = text.indexOf(kw);
    if (idx >= 0) {
      const after = text.substring(idx + kw.length, idx + kw.length + 15);
      if (!/\s*(green|blue|style|fashion|jacket|boot|watch|time)/.test(after)) {
        score += 0.10;
      }
    }
  }

  return Math.min(score, 1.0);
}

// C5: License determination by destination
function checkLicenseRequirement(
  eccnCandidates: EccnMapping[],
  destination: string,
  exportControlStatus: string
): {
  licenseRequired: boolean;
  reason: string;
  applicableExceptions: string[];
} {
  if (EMBARGOED.has(destination)) {
    return {
      licenseRequired: true,
      reason: `${destination} is under comprehensive US embargo. License required for virtually all items.`,
      applicableExceptions: [],
    };
  }

  if (exportControlStatus === 'EAR99') {
    if (GROUP_D1.has(destination)) {
      return {
        licenseRequired: false,
        reason: `EAR99 items generally do not require license, but enhanced end-use checks apply for ${destination}.`,
        applicableExceptions: ['NLR'],
      };
    }
    return {
      licenseRequired: false,
      reason: 'EAR99 — No License Required (NLR) for most destinations.',
      applicableExceptions: ['NLR'],
    };
  }

  if (eccnCandidates.length > 0) {
    const allExceptions = new Set<string>();
    for (const c of eccnCandidates) {
      for (const ex of (c.licenseExceptions || [])) {
        allExceptions.add(ex);
      }
    }

    if (GROUP_D1.has(destination)) {
      return {
        licenseRequired: true,
        reason: `Controlled ECCN items require license for export to ${destination} (Country Group D:1).`,
        applicableExceptions: Array.from(allExceptions),
      };
    }

    if (GROUP_A1.has(destination)) {
      return {
        licenseRequired: false,
        reason: `License exception likely available for ${destination} (Country Group A:1/Wassenaar).`,
        applicableExceptions: Array.from(allExceptions),
      };
    }

    return {
      licenseRequired: true,
      reason: `Controlled ECCN items may require license for ${destination}. Check Commerce Country Chart.`,
      applicableExceptions: Array.from(allExceptions),
    };
  }

  return { licenseRequired: false, reason: 'No controlled ECCN identified.', applicableExceptions: [] };
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
  const rawHsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : undefined;
  const technicalSpecs = typeof body.technicalSpecs === 'string' ? body.technicalSpecs.trim() : undefined;
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.trim().toUpperCase() : undefined;

  if (!productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"productName" is required.');
  }

  // C6: Normalize HS code
  let hsCode: string | undefined;
  if (rawHsCode) {
    const normalized = normalizeHsCode(rawHsCode);
    if (!normalized) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid HS code format. Provide 4-10 digits.');
    }
    hsCode = normalized;
  }

  // C7: Auto-classify HS code if not provided (with error reporting)
  let classificationError: { message: string; reason: string; suggestion: string } | undefined;
  if (!hsCode) {
    try {
      const classification = await classifyProductAsync(productName, category, context.sellerId);
      if (classification.hsCode && classification.hsCode !== '9999') {
        hsCode = classification.hsCode;
      }
    } catch (err) {
      classificationError = {
        message: 'AI classification failed',
        reason: err instanceof Error ? err.message : 'Unknown error',
        suggestion: 'Provide HS code directly via hsCode parameter, or use a more specific product description.',
      };
    }
  }

  // C3: Schedule B derivation
  const scheduleB = hsCode ? deriveScheduleB(hsCode) : null;

  // C1: HS4-level ECCN mapping first, then chapter fallback
  let eccnCandidates: EccnMapping[] = [];
  let mappingPrecision: 'hs4' | 'chapter' | 'none' = 'none';

  if (hsCode) {
    const hs4 = hsCode.substring(0, 4);
    const hs4Match = HS4_TO_ECCN[hs4];
    if (hs4Match) {
      eccnCandidates = [hs4Match];
      mappingPrecision = 'hs4';
    } else {
      const chapter = hsCode.substring(0, 2);
      const chapterMatches = HS_CHAPTER_ECCN[chapter];
      if (chapterMatches) {
        eccnCandidates = chapterMatches;
        mappingPrecision = 'chapter';
      }
    }
  }

  // Determine export control status
  let exportControlStatus: 'EAR99' | 'controlled' | 'itar_possible' | 'review_recommended' | 'unknown' = 'EAR99';

  if (eccnCandidates.length > 0) {
    exportControlStatus = 'controlled';
  }

  // C8: ITAR check with confidence scoring
  const itarConfidence = calculateItarConfidence(productName, technicalSpecs);
  if (itarConfidence >= 0.70) {
    exportControlStatus = 'itar_possible';
  } else if (itarConfidence >= 0.30) {
    exportControlStatus = 'review_recommended';
  }

  // C2: Encryption-specific handling
  let encryptionAnalysis: Record<string, unknown> | undefined;
  const allText = `${productName} ${technicalSpecs || ''}`.toLowerCase();
  if (/encrypt|aes.?256|rsa|cryptograph|ssl|tls/i.test(allText)) {
    const isMassMarket = /consumer|commercial|mass.?market|open.?source|browser|https/i.test(allText);
    const isEmbargoed = destinationCountry && EMBARGOED.has(destinationCountry);

    encryptionAnalysis = {
      encryptionDetected: true,
      eccn: '5A002',
      description: 'Information security systems and equipment',
      licenseException: !isEmbargoed ? 'ENC' : null,
      encExceptionEligible: !isEmbargoed,
      massMarket: isMassMarket,
      note: isEmbargoed
        ? `Encryption export to ${destinationCountry} requires specific license. No ENC exception available.`
        : isMassMarket
          ? 'Mass-market encryption likely eligible for License Exception ENC (740.17). Self-classification may suffice.'
          : 'Non-mass-market encryption: ENC exception may apply after classification request (CCATS).',
    };

    if (!isEmbargoed && eccnCandidates.length === 0) {
      exportControlStatus = 'controlled';
    }
  }

  // Check technical specs for additional control indicators
  const specControls: string[] = [];
  if (technicalSpecs) {
    const specsLower = technicalSpecs.toLowerCase();
    if (/infrared|thermal imaging|night vision|flir/i.test(specsLower)) specControls.push('NS (Night Vision/IR)');
    if (/nuclear|radiation|centrifuge|enrichment/i.test(specsLower)) specControls.push('NP (Nuclear)');
    if (/gps.*military|inertial nav|ring laser gyro/i.test(specsLower)) specControls.push('MT (Navigation)');
    if (/chemical agent|nerve agent|toxic/i.test(specsLower)) specControls.push('CB (Chemical/Biological)');
    if (/underwater|sonar|acoustic sensor/i.test(specsLower)) specControls.push('NS (Acoustic)');
  }

  // C5: Destination-specific license analysis
  let destinationAnalysis: Record<string, unknown> | undefined;
  if (destinationCountry) {
    const licenseCheck = checkLicenseRequirement(eccnCandidates, destinationCountry, exportControlStatus);
    destinationAnalysis = {
      country: destinationCountry,
      licenseRequired: licenseCheck.licenseRequired,
      reason: licenseCheck.reason,
      applicableExceptions: licenseCheck.applicableExceptions,
      countryGroup: EMBARGOED.has(destinationCountry) ? 'E:1/E:2 (Embargoed)'
        : GROUP_D1.has(destinationCountry) ? 'D:1 (National Security Concern)'
        : GROUP_A1.has(destinationCountry) ? 'A:1 (Wassenaar/Favorable)'
        : 'Other',
    };
  }

  // Build ECCN response
  const eccnResponse = eccnCandidates.length > 0 ? {
    candidates: eccnCandidates.map(c => ({
      eccn: c.eccn,
      description: c.description,
      controlReasons: c.controlReasons.map(r => ({
        code: r,
        name: CONTROL_REASONS[r] || r,
      })),
      licenseExceptions: c.licenseExceptions || [],
    })),
    precision: mappingPrecision,
    note: mappingPrecision === 'chapter'
      ? 'ECCN mapped at HS chapter level. Multiple ECCNs possible — verify specific item characteristics.'
      : 'ECCN mapped at HS heading level. Final determination requires self-classification or BIS CCATS request.',
  } : {
    candidates: [],
    note: exportControlStatus === 'EAR99'
      ? 'Product likely classified as EAR99 (no license required for most destinations).'
      : 'ECCN mapping unavailable. Self-classification or BIS consultation recommended.',
  };

  // Recommendations
  const recommendations: string[] = [];
  if (exportControlStatus === 'itar_possible') {
    recommendations.push('Product may be ITAR-controlled (USML). Consult State Department DDTC for jurisdiction determination before export.');
  } else if (exportControlStatus === 'review_recommended') {
    recommendations.push(`Product has some defense-related indicators (confidence: ${Math.round(itarConfidence * 100)}%). Review with compliance team.`);
  } else if (exportControlStatus === 'controlled') {
    recommendations.push('Product may require BIS export license depending on destination. Check Commerce Country Chart (Supplement No. 1 to Part 738).');
  } else {
    recommendations.push('Product appears to be EAR99 (most commercial items). No license typically required except for embargoed destinations.');
  }
  recommendations.push('This is automated preliminary screening. Final ECCN determination should be made by a qualified export compliance professional.');

  return apiSuccess(
    {
      productName,
      hsCode: hsCode || null,
      scheduleB: scheduleB ? {
        code: scheduleB.code,
        confidence: scheduleB.confidence,
        note: scheduleB.note,
      } : null,
      exportControlStatus,
      itarConfidence: itarConfidence > 0 ? Math.round(itarConfidence * 100) / 100 : undefined,
      eccn: eccnResponse,
      encryptionAnalysis: encryptionAnalysis || undefined,
      technicalControls: specControls.length > 0 ? specControls : undefined,
      destinationAnalysis: destinationAnalysis || undefined,
      classificationError: classificationError || undefined,
      recommendations,
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
    'Use POST method. Body: { productName: "...", hsCode?: "8471.30", technicalSpecs?: "...", destinationCountry?: "CN" }'
  );
}
