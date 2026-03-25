/**
 * F038: Export License Management Engine
 *
 * Determines export license requirements based on:
 * - ECCN + destination + Commerce Country Chart (C2)
 * - Embargo/sanctions status from DB (C1)
 * - License exception eligibility with conditions (C3)
 * - Re-export de minimis rules (C5)
 * - Application tracking (C6)
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────

export interface LicenseRequirement {
  type: string;
  authority: string;
  description: string;
  estimatedProcessingDays: number;
  required: boolean;
}

export interface ExceptionResult {
  exception: string;
  eligible: boolean;
  reason: string;
}

export interface ReexportControl {
  applicable: boolean;
  usContent: number;
  threshold: number;
  note: string;
}

export interface ApplicationGuide {
  form: string;
  submissionUrl: string;
  requiredInfo: string[];
  processingTime: string;
  expeditedOption: string;
}

export interface ExistingLicense {
  id: string;
  eccn: string;
  destination: string;
  status: string;
  referenceNumber: string;
  appliedAt: string;
  expiresAt?: string;
}

export interface SanctionsCheck {
  isFullEmbargo: boolean;
  isPartialSanction: boolean;
  programs: string[];
}

export interface ExportLicenseResult {
  licenseRequired: boolean;
  sanctionStatus: 'clear' | 'full_embargo' | 'partial_sanctions';
  requirements: LicenseRequirement[];
  exceptions: ExceptionResult[];
  reexportControl?: ReexportControl;
  applicationGuide?: ApplicationGuide;
  existingLicense?: ExistingLicense;
  economicSanctionsWarning?: string;
}

export interface ExportContext {
  eccn: string;
  eccnCategory: string;
  destination: string;
  value: number;
  isTemporary: boolean;
  returnDays: number;
  itemType: string;
  isEncryption: boolean;
}

// ─── Constants ──────────────────────────────────────

// Comprehensive embargo countries (OFAC)
const FULL_EMBARGO_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY']);

// Country Group D:1 (National Security) — EAR Supplement No. 1 to Part 740
const COUNTRY_GROUP_D1 = new Set([
  'AF', 'BY', 'CN', 'IQ', 'KZ', 'KG', 'MM', 'PK', 'RU', 'TJ', 'TM', 'UZ', 'VN',
]);

// Country Group E:1 (Terrorism) — overlaps with embargo
const COUNTRY_GROUP_E1 = new Set(['CU', 'IR', 'KP', 'SY']);

// Country Group E:2 (Unilateral)
const COUNTRY_GROUP_E2 = new Set(['CU']);

// EU member states for EU export control
const EU_MEMBERS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// ECCN control reason codes → Commerce Country Chart columns
const ECCN_CONTROL_REASONS: Record<string, string[]> = {
  '0': ['AT'],                    // Nuclear — Anti-Terrorism
  '1': ['NS', 'MT', 'NP', 'AT'], // Materials — multiple
  '2': ['NS', 'NP', 'AT'],       // Materials Processing
  '3': ['NS', 'AT'],              // Electronics
  '4': ['NS', 'AT'],              // Computers
  '5': ['NS', 'AT'],              // Telecommunications (5A/5D/5E)
  '6': ['NS', 'AT'],              // Sensors & Lasers
  '7': ['NS', 'MT', 'AT'],       // Navigation & Avionics
  '8': ['NS', 'AT'],              // Marine
  '9': [],                        // EAR99 — no control reasons
};

// Commerce Country Chart: which control reasons trigger license for which country groups
const COUNTRY_CHART_RESTRICTIONS: Record<string, Set<string>> = {
  NS: new Set([...COUNTRY_GROUP_D1]),
  AT: new Set([...COUNTRY_GROUP_D1, ...COUNTRY_GROUP_E1]),
  NP: new Set(['AF', 'CN', 'IN', 'IR', 'IQ', 'KP', 'LY', 'MM', 'PK', 'SY']),
  MT: new Set(['AF', 'CN', 'IN', 'IR', 'IQ', 'KP', 'LY', 'MM', 'PK', 'SY']),
  CB: new Set([...COUNTRY_GROUP_D1, ...COUNTRY_GROUP_E1]),
  CC: new Set([...COUNTRY_GROUP_D1]),
  RS: new Set(['CN', 'RU', 'BY']),
  SS: new Set(['CN', 'RU', 'BY']),
  FC: new Set([...COUNTRY_GROUP_E1]),
};

// Sensitive HS chapters requiring export licenses
const CONTROLLED_CHAPTERS: Record<string, { authority: string; licenseType: string }> = {
  '27': { authority: 'DOE/BIS', licenseType: 'Energy export license' },
  '28': { authority: 'BIS/EPA', licenseType: 'Chemical export license' },
  '29': { authority: 'BIS/EPA', licenseType: 'Chemical export license' },
  '84': { authority: 'BIS', licenseType: 'Dual-use technology license' },
  '85': { authority: 'BIS', licenseType: 'Technology/electronics export license' },
  '88': { authority: 'DDTC/BIS', licenseType: 'Aerospace export license' },
  '90': { authority: 'BIS', licenseType: 'Precision instruments license' },
  '93': { authority: 'DDTC', licenseType: 'ITAR Munitions License (DSP-5/DSP-73)' },
};

// ─── Supabase ───────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── C1: Sanctions/Embargo Check ────────────────────

export async function checkSanctions(destination: string): Promise<SanctionsCheck> {
  const dest = destination.toUpperCase();

  if (FULL_EMBARGO_COUNTRIES.has(dest)) {
    return { isFullEmbargo: true, isPartialSanction: false, programs: ['COMPREHENSIVE'] };
  }

  // Check DB for partial sanctions
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('sanctions_entries')
        .select('program')
        .ilike('country', `%${dest}%`)
        .limit(20);

      if (data && data.length > 0) {
        const programs = [...new Set(data.map((s: Record<string, unknown>) => String(s.program ?? '')))];
        return { isFullEmbargo: false, isPartialSanction: true, programs };
      }
    } catch { /* fallback to static check */ }
  }

  // Static partial sanctions fallback
  const PARTIAL_SANCTIONS = new Set(['RU', 'BY', 'VE', 'NI', 'CN']);
  if (PARTIAL_SANCTIONS.has(dest)) {
    const programMap: Record<string, string[]> = {
      RU: ['RUSSIA-EO14024', 'UKRAINE-EO13662'],
      BY: ['BELARUS-EO14038'],
      VE: ['VENEZUELA-EO13884'],
      NI: ['NICARAGUA-EO13851'],
      CN: ['CHINA-MILITARY-EO13959'],
    };
    return { isFullEmbargo: false, isPartialSanction: true, programs: programMap[dest] || ['SECTORAL'] };
  }

  return { isFullEmbargo: false, isPartialSanction: false, programs: [] };
}

// ─── C2: Commerce Country Chart License Determination ─

export function getControlReasons(eccn: string): string[] {
  if (!eccn || eccn === 'EAR99') return [];
  const category = eccn.charAt(0);
  return ECCN_CONTROL_REASONS[category] || ['AT'];
}

export function lookupCommerceCountryChart(
  destination: string,
  controlReasons: string[],
): { reason: string; restricted: boolean }[] {
  const dest = destination.toUpperCase();
  return controlReasons.map(reason => {
    const restrictedCountries = COUNTRY_CHART_RESTRICTIONS[reason];
    return {
      reason,
      restricted: restrictedCountries ? restrictedCountries.has(dest) : false,
    };
  });
}

// ─── C3: License Exception Checks ──────────────────

export function checkLicenseExceptions(ctx: ExportContext): ExceptionResult[] {
  const results: ExceptionResult[] = [];

  // LVS — Limited Value Shipments (EAR §740.3)
  if (ctx.value > 0) {
    const lvsThresholds: Record<string, number> = {
      '3': 5000, '4': 5000, '5': 5000, DEFAULT: 2500,
    };
    const limit = lvsThresholds[ctx.eccnCategory] || lvsThresholds.DEFAULT;
    results.push({
      exception: 'LVS',
      eligible: ctx.value <= limit && !COUNTRY_GROUP_E1.has(ctx.destination),
      reason: COUNTRY_GROUP_E1.has(ctx.destination)
        ? 'LVS not available for Country Group E:1'
        : ctx.value > limit
          ? `Value $${ctx.value} exceeds LVS limit $${limit} for category ${ctx.eccnCategory}`
          : `Within LVS threshold ($${ctx.value} ≤ $${limit})`,
    });
  }

  // TMP — Temporary Exports (EAR §740.9)
  results.push({
    exception: 'TMP',
    eligible: ctx.isTemporary && ctx.returnDays <= 365 && !COUNTRY_GROUP_E1.has(ctx.destination),
    reason: !ctx.isTemporary
      ? 'Not a temporary export'
      : ctx.returnDays > 365
        ? 'TMP requires return within 12 months'
        : COUNTRY_GROUP_E1.has(ctx.destination)
          ? 'TMP not available for Country Group E:1'
          : 'Eligible for TMP (temporary export, return within 12 months)',
  });

  // TSR — Technology and Software Under Restriction (EAR §740.6)
  results.push({
    exception: 'TSR',
    eligible: ctx.itemType === 'software' && ['5'].includes(ctx.eccnCategory) && !COUNTRY_GROUP_D1.has(ctx.destination),
    reason: ctx.itemType !== 'software'
      ? 'TSR only for software/technology'
      : !['5'].includes(ctx.eccnCategory)
        ? 'TSR limited to specific ECCN categories'
        : COUNTRY_GROUP_D1.has(ctx.destination)
          ? 'TSR not available for Country Group D:1'
          : 'Eligible for TSR',
  });

  // ENC — Encryption (EAR §740.17)
  results.push({
    exception: 'ENC',
    eligible: ctx.isEncryption && !COUNTRY_GROUP_E1.has(ctx.destination) && !COUNTRY_GROUP_E2.has(ctx.destination),
    reason: !ctx.isEncryption
      ? 'Not an encryption item'
      : COUNTRY_GROUP_E1.has(ctx.destination)
        ? 'ENC not available for Country Group E:1'
        : 'Eligible for ENC (mass-market encryption)',
  });

  return results;
}

// ─── C4: Application Guide ─────────────────────────

export function buildApplicationGuide(authority: string): ApplicationGuide {
  if (authority.includes('DDTC') || authority.includes('ITAR')) {
    return {
      form: 'DSP-5 (Permanent Export License)',
      submissionUrl: 'https://dtrade.pmddtc.state.gov',
      requiredInfo: [
        'Applicant registration (DDTC)',
        'End-user statement (DSP-83)',
        'Item description and USML category',
        'End-use and end-user details',
        'Value and quantity',
        'Country of ultimate destination',
        'Non-transfer/non-re-export certificate',
      ],
      processingTime: '60-120 days (ITAR items)',
      expeditedOption: 'Emergency processing for government-to-government sales',
    };
  }

  return {
    form: 'BIS-748P (Multipurpose Application)',
    submissionUrl: 'https://snapr.bis.doc.gov',
    requiredInfo: [
      'Applicant information (name, address, EIN)',
      'End-user name and address',
      'Item description and ECCN',
      'End-use statement',
      'Value and quantity',
      'Country of ultimate destination',
      'Intermediate consignee (if any)',
    ],
    processingTime: '30-90 days (average)',
    expeditedOption: 'Emergency processing available for certain items',
  };
}

// ─── C5: Re-export De Minimis Check ────────────────

export function checkReexportDeMinimis(
  destination: string,
  usOriginContentPercent?: number,
): ReexportControl | undefined {
  if (usOriginContentPercent === undefined || usOriginContentPercent <= 0) return undefined;

  const dest = destination.toUpperCase();
  const threshold = COUNTRY_GROUP_E1.has(dest) ? 10 : 25;

  if (usOriginContentPercent >= threshold) {
    return {
      applicable: true,
      usContent: usOriginContentPercent,
      threshold,
      note: `US-origin content (${usOriginContentPercent}%) meets de minimis threshold (${threshold}%). EAR applies to this re-export.`,
    };
  }

  return {
    applicable: false,
    usContent: usOriginContentPercent,
    threshold,
    note: `US-origin content (${usOriginContentPercent}%) below de minimis threshold (${threshold}%). EAR does not apply.`,
  };
}

// ─── C6: Application Tracking ──────────────────────

export async function lookupExistingLicense(
  sellerId: string,
  eccn: string,
  destination: string,
): Promise<ExistingLicense | undefined> {
  const supabase = getSupabase();
  if (!supabase) return undefined;

  try {
    const { data } = await supabase
      .from('export_license_applications')
      .select('id, eccn, destination, status, reference_number, applied_at, expires_at')
      .eq('seller_id', sellerId)
      .eq('eccn', eccn)
      .eq('destination', destination)
      .in('status', ['approved', 'pending'])
      .order('applied_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return {
        id: String(data.id ?? ''),
        eccn: String(data.eccn ?? ''),
        destination: String(data.destination ?? ''),
        status: String(data.status ?? ''),
        referenceNumber: String(data.reference_number ?? ''),
        appliedAt: String(data.applied_at ?? ''),
        expiresAt: data.expires_at ? String(data.expires_at) : undefined,
      };
    }
  } catch { /* no existing license */ }

  return undefined;
}

export async function recordLicenseApplication(
  sellerId: string,
  eccn: string,
  destination: string,
  productName: string,
): Promise<string> {
  const supabase = getSupabase();
  const refNumber = `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (supabase) {
    try {
      await supabase.from('export_license_applications').insert({
        seller_id: sellerId,
        eccn,
        destination,
        product_name: productName,
        status: 'pending',
        reference_number: refNumber,
        applied_at: new Date().toISOString(),
      });
    } catch { /* best-effort storage */ }
  }

  return refNumber;
}

// ─── Main: Determine Export License ─────────────────

export async function determineExportLicense(params: {
  originCountry: string;
  destinationCountry: string;
  productName: string;
  hsCode?: string;
  eccn?: string;
  value?: number;
  endUse?: string;
  sellerId?: string;
  isTemporary?: boolean;
  returnDays?: number;
  itemType?: string;
  isEncryption?: boolean;
  usOriginContentPercent?: number;
}): Promise<ExportLicenseResult> {
  const origin = params.originCountry.toUpperCase();
  const dest = params.destinationCountry.toUpperCase();
  const eccn = params.eccn?.toUpperCase() || '';

  const requirements: LicenseRequirement[] = [];
  let exceptions: ExceptionResult[] = [];

  // C1: Sanctions/embargo check
  const sanctions = await checkSanctions(dest);

  if (sanctions.isFullEmbargo) {
    requirements.push({
      type: 'OFAC Specific License',
      authority: 'US Treasury OFAC',
      description: `${dest} is under comprehensive US embargo. Export prohibited without OFAC specific license. Denial policy applies for most items.`,
      estimatedProcessingDays: 90,
      required: true,
    });

    return {
      licenseRequired: true,
      sanctionStatus: 'full_embargo',
      requirements,
      exceptions: [],
      applicationGuide: buildApplicationGuide('OFAC'),
      reexportControl: checkReexportDeMinimis(dest, params.usOriginContentPercent),
    };
  }

  // US origin export controls
  if (origin === 'US' || params.usOriginContentPercent !== undefined) {
    // C2: ECCN + Commerce Country Chart
    if (eccn && eccn !== 'EAR99') {
      const controlReasons = getControlReasons(eccn);
      const chartResults = lookupCommerceCountryChart(dest, controlReasons);
      const restricted = chartResults.filter(c => c.restricted);

      if (restricted.length > 0) {
        requirements.push({
          type: 'BIS Individual License',
          authority: 'US Commerce BIS',
          description: `ECCN ${eccn} to ${dest}: license required for control reason(s) ${restricted.map(r => r.reason).join(', ')} per Commerce Country Chart (EAR Part 738, Supplement No. 1).`,
          estimatedProcessingDays: 60,
          required: true,
        });

        // C3: Check license exceptions
        const ctx: ExportContext = {
          eccn,
          eccnCategory: eccn.charAt(0),
          destination: dest,
          value: params.value || 0,
          isTemporary: params.isTemporary || false,
          returnDays: params.returnDays || 0,
          itemType: params.itemType || 'goods',
          isEncryption: params.isEncryption || false,
        };
        exceptions = checkLicenseExceptions(ctx);
      }
    }

    // HS chapter-based controls
    if (params.hsCode) {
      const chapter = params.hsCode.replace(/[^0-9]/g, '').substring(0, 2);
      const controlled = CONTROLLED_CHAPTERS[chapter];
      if (controlled && (COUNTRY_GROUP_D1.has(dest) || sanctions.isPartialSanction)) {
        requirements.push({
          type: controlled.licenseType,
          authority: controlled.authority,
          description: `HS chapter ${chapter} exports to ${dest} may require ${controlled.licenseType}.`,
          estimatedProcessingDays: 45,
          required: sanctions.isPartialSanction,
        });
      }
    }

    // High-value technology exports
    if (params.value && params.value > 500000 && COUNTRY_GROUP_D1.has(dest)) {
      requirements.push({
        type: 'End-Use Certificate',
        authority: 'BIS',
        description: 'High-value export to restricted destination requires end-use certificate from consignee.',
        estimatedProcessingDays: 30,
        required: false,
      });
    }
  }

  // EU origin export controls
  if (EU_MEMBERS.has(origin)) {
    if (sanctions.isFullEmbargo || sanctions.isPartialSanction) {
      requirements.push({
        type: 'EU Export Authorization',
        authority: 'National Export Control Authority',
        description: `EU Dual-Use Regulation (2021/821) applies. ${dest} is under EU restrictive measures. Programs: ${sanctions.programs.join(', ')}.`,
        estimatedProcessingDays: 60,
        required: true,
      });
    }
  }

  const licenseRequired = requirements.some(r => r.required);
  const hasEligibleException = exceptions.some(e => e.eligible);

  // NLR if no requirements
  if (requirements.length === 0) {
    requirements.push({
      type: 'No License Required (NLR)',
      authority: 'N/A',
      description: eccn === 'EAR99'
        ? 'EAR99 items generally do not require export license except to embargoed destinations.'
        : 'Based on provided information, no specific export license appears required.',
      estimatedProcessingDays: 0,
      required: false,
    });
  }

  // C4: Application guide (when license required and no exception)
  const guide = licenseRequired && !hasEligibleException
    ? buildApplicationGuide(requirements[0]?.authority || 'BIS')
    : undefined;

  // C5: Re-export de minimis
  const reexport = checkReexportDeMinimis(dest, params.usOriginContentPercent);

  // C6: Existing license lookup
  let existingLicense: ExistingLicense | undefined;
  if (params.sellerId && eccn && licenseRequired) {
    existingLicense = await lookupExistingLicense(params.sellerId, eccn, dest);
  }

  return {
    licenseRequired: licenseRequired && !hasEligibleException,
    sanctionStatus: sanctions.isFullEmbargo ? 'full_embargo' : sanctions.isPartialSanction ? 'partial_sanctions' : 'clear',
    requirements,
    exceptions,
    reexportControl: reexport,
    applicationGuide: guide,
    existingLicense,
    economicSanctionsWarning: sanctions.isPartialSanction
      ? `Partial sanctions in effect for ${dest}. Programs: ${sanctions.programs.join(', ')}. Check OFAC guidance for specific restrictions.`
      : undefined,
  };
}
