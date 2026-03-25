/**
 * POTAL API v1 — /api/v1/tax/exemptions
 *
 * Tax exemption certificate management.
 * C1: Certificate format validation by type
 * C2: Expiration check + renewal warning
 * C3: State-specific form requirements + MTC support
 * C4: Audit logging for exemption usage
 *
 * POST — Create/upload exemption certificate
 * GET  — List seller's certificates (with expiration status)
 * PUT  — Apply exemption to a transaction (logs usage)
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Constants ──────────────────────────────────────

const VALID_CERT_TYPES = [
  'resale', 'exempt_org', 'government', 'agricultural',
  'manufacturing', 'diplomatic', 'foreign_diplomat',
  'native_american', 'direct_pay',
];

const CERT_DESCRIPTIONS: Record<string, string> = {
  resale: 'Resale Certificate — Purchases for resale are exempt from sales tax.',
  exempt_org: 'Tax-Exempt Organization — 501(c)(3) or equivalent nonprofit exemption.',
  government: 'Government Entity — Federal, state, or local government purchases.',
  agricultural: 'Agricultural Exemption — Farm equipment, supplies, and livestock.',
  manufacturing: 'Manufacturing Exemption — Raw materials and machinery for manufacturing.',
  diplomatic: 'Diplomatic Exemption — Foreign diplomatic mission exemption.',
  foreign_diplomat: 'Foreign Diplomat — Personal purchases exemption (with OFM card).',
  native_american: 'Native American — Tribal exemption on reservation purchases.',
  direct_pay: 'Direct Pay Permit — Large businesses authorized to self-assess tax.',
};

// ─── C1: Certificate Format Validators ──────────────

const CERT_FORMAT_PATTERNS: Record<string, { pattern: RegExp; example: string; description: string }> = {
  resale: {
    pattern: /^[A-Z0-9-]{5,20}$/,
    example: 'CA-123456 or 12-345678',
    description: 'State abbreviation + number, or state-specific format',
  },
  exempt_org: {
    pattern: /^\d{2}-\d{7}$/,
    example: '12-3456789',
    description: 'EIN format (XX-XXXXXXX)',
  },
  government: {
    pattern: /^[A-Z0-9-]{4,20}$/,
    example: 'GOV-12345 or federal TIN',
    description: 'Government entity ID',
  },
  diplomatic: {
    pattern: /^[A-Z]{1,4}\d{3,10}$/,
    example: 'OFM1234 or DS12345',
    description: 'OFM card number or diplomatic ID',
  },
  foreign_diplomat: {
    pattern: /^[A-Z0-9]{4,15}$/,
    example: 'OFM1234567',
    description: 'OFM card number',
  },
  direct_pay: {
    pattern: /^[A-Z0-9-]{5,20}$/,
    example: 'DP-123456',
    description: 'Direct pay permit number',
  },
};

function validateCertificateFormat(
  certType: string,
  certNumber: string,
): { valid: boolean; error?: string } {
  const config = CERT_FORMAT_PATTERNS[certType];
  if (!config) return { valid: true }; // No strict format for agricultural/manufacturing/native_american

  const normalized = certNumber.replace(/\s/g, '').toUpperCase();
  if (!config.pattern.test(normalized)) {
    return {
      valid: false,
      error: `Invalid ${certType} certificate format. Expected: ${config.description} (e.g., "${config.example}"). Got: "${certNumber}"`,
    };
  }
  return { valid: true };
}

// ─── C2: Expiration Check ───────────────────────────

interface ExpirationStatus {
  isExpired: boolean;
  daysUntilExpiry: number | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'no_expiration';
  warning?: string;
}

function checkExpiration(expirationDate: string | null | undefined): ExpirationStatus {
  if (!expirationDate) {
    return { isExpired: false, daysUntilExpiry: null, status: 'no_expiration' };
  }

  const expires = new Date(expirationDate);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      isExpired: true,
      daysUntilExpiry: days,
      status: 'expired',
      warning: `Certificate expired ${Math.abs(days)} days ago. Renew before applying exemption.`,
    };
  }
  if (days <= 30) {
    return {
      isExpired: false,
      daysUntilExpiry: days,
      status: 'expiring_soon',
      warning: `Certificate expires in ${days} days. Consider renewal.`,
    };
  }
  return { isExpired: false, daysUntilExpiry: days, status: 'active' };
}

// ─── C3: State Exemption Forms ──────────────────────

interface StateExemptionForm {
  form: string;
  name: string;
  mtcAccepted: boolean;
}

const STATE_EXEMPTION_FORMS: Record<string, StateExemptionForm> = {
  AL: { form: 'STE-1', name: 'Alabama Sales Tax Exemption Certificate', mtcAccepted: true },
  AZ: { form: '5000A', name: 'Arizona Resale Certificate', mtcAccepted: true },
  AR: { form: 'ST391', name: 'Arkansas Streamlined Sales Tax Exemption Certificate', mtcAccepted: true },
  CA: { form: 'CDTFA-230', name: 'California General Resale Certificate', mtcAccepted: false },
  CO: { form: 'DR-0563', name: 'Colorado Sales Tax Exemption Certificate', mtcAccepted: true },
  CT: { form: 'CERT-119', name: 'Connecticut Resale Certificate', mtcAccepted: false },
  FL: { form: 'DR-13', name: 'Florida Annual Resale Certificate', mtcAccepted: false },
  GA: { form: 'ST-5', name: 'Georgia Sales Tax Exemption Certificate', mtcAccepted: true },
  HI: { form: 'G-17', name: 'Hawaii Resale Certificate', mtcAccepted: false },
  ID: { form: 'ST-101', name: 'Idaho Sales Tax Resale/Exemption Certificate', mtcAccepted: true },
  IL: { form: 'CRT-61', name: 'Illinois Resale Certificate', mtcAccepted: false },
  IN: { form: 'ST-105', name: 'Indiana General Sales Tax Exemption Certificate', mtcAccepted: true },
  IA: { form: '31-014', name: 'Iowa Sales/Use Tax Exemption Certificate', mtcAccepted: true },
  KS: { form: 'ST-28', name: 'Kansas Resale Exemption Certificate', mtcAccepted: true },
  KY: { form: '51A105', name: 'Kentucky Resale Certificate', mtcAccepted: true },
  LA: { form: 'R-1048', name: 'Louisiana Resale Certificate', mtcAccepted: false },
  MD: { form: 'ST-206', name: 'Maryland Resale Certificate', mtcAccepted: false },
  MA: { form: 'ST-4', name: 'Massachusetts Sales Tax Resale Certificate', mtcAccepted: false },
  MI: { form: '3372', name: 'Michigan Sales and Use Tax Certificate of Exemption', mtcAccepted: true },
  MN: { form: 'ST3', name: 'Minnesota Certificate of Exemption', mtcAccepted: true },
  MS: { form: '72-315', name: 'Mississippi Sales Tax Exemption Certificate', mtcAccepted: false },
  MO: { form: '149', name: 'Missouri Sales/Use Tax Exemption Certificate', mtcAccepted: false },
  NE: { form: '13', name: 'Nebraska Resale or Exempt Sale Certificate', mtcAccepted: true },
  NV: { form: 'R-01', name: 'Nevada Resale Certificate', mtcAccepted: true },
  NJ: { form: 'ST-3', name: 'New Jersey Resale Certificate', mtcAccepted: true },
  NM: { form: 'NTTC', name: 'New Mexico Non-Taxable Transaction Certificate', mtcAccepted: false },
  NY: { form: 'ST-120', name: 'New York Resale Certificate', mtcAccepted: true },
  NC: { form: 'E-595E', name: 'North Carolina Streamlined Exemption Certificate', mtcAccepted: true },
  ND: { form: '51-52', name: 'North Dakota Exemption Certificate', mtcAccepted: true },
  OH: { form: 'STEC-B', name: 'Ohio Sales/Use Tax Blanket Exemption Certificate', mtcAccepted: true },
  OK: { form: '13-16', name: 'Oklahoma Sales Tax Exemption Card', mtcAccepted: true },
  PA: { form: 'REV-1220', name: 'Pennsylvania Exemption Certificate', mtcAccepted: false },
  RI: { form: 'SU-3', name: 'Rhode Island Resale Certificate', mtcAccepted: true },
  SC: { form: 'ST-8A', name: 'South Carolina Resale Certificate', mtcAccepted: true },
  SD: { form: 'SFN-21919', name: 'South Dakota Exemption Certificate', mtcAccepted: true },
  TN: { form: 'SLS450', name: 'Tennessee Streamlined Certificate of Exemption', mtcAccepted: true },
  TX: { form: '01-339', name: 'Texas Sales and Use Tax Exemption Certification', mtcAccepted: true },
  UT: { form: 'TC-721', name: 'Utah Exemption Certificate', mtcAccepted: true },
  VT: { form: 'S-3', name: 'Vermont Resale Certificate', mtcAccepted: true },
  VA: { form: 'ST-10', name: 'Virginia Sales/Use Tax Exemption Certificate', mtcAccepted: false },
  WA: { form: 'REV-27-0032', name: 'Washington Resale Certificate', mtcAccepted: true },
  WV: { form: 'F0003', name: 'West Virginia Exemption Certificate', mtcAccepted: true },
  WI: { form: 'S-211', name: 'Wisconsin Sales/Use Tax Exemption Certificate', mtcAccepted: true },
  WY: { form: 'ETS', name: 'Wyoming Sales/Use Tax Exemption Certificate', mtcAccepted: true },
};

// ─── GET: List certificates with expiration status ──

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    const { data, error } = await supabase
      .from('tax_exemption_certificates')
      .select('*')
      .eq('seller_id', context.sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const certs = (data || []).map((c: Record<string, unknown>) => {
      const expiration = checkExpiration(c.expiration_date as string | null);
      return {
        id: c.id,
        certificateType: c.certificate_type,
        description: CERT_DESCRIPTIONS[String(c.certificate_type ?? '')] || String(c.certificate_type ?? ''),
        jurisdiction: c.jurisdiction,
        exemptionNumber: c.exemption_number,
        holderName: c.holder_name,
        holderTaxId: c.holder_tax_id || null,
        expirationDate: c.expiration_date || null,
        expiration, // C2: Full expiration status
        productCategories: c.product_categories || null,
        status: expiration.isExpired ? 'expired' : String(c.status ?? 'active'),
        valid: !expiration.isExpired && String(c.status ?? 'active') === 'active',
        requiredForm: STATE_EXEMPTION_FORMS[String(c.jurisdiction ?? '')] || null, // C3
        createdAt: c.created_at,
      };
    });

    // Summary
    const active = certs.filter(c => c.valid).length;
    const expired = certs.filter(c => c.expiration.isExpired).length;
    const expiringSoon = certs.filter(c => c.expiration.status === 'expiring_soon').length;

    return apiSuccess(
      {
        certificates: certs,
        total: certs.length,
        summary: { active, expired, expiringSoon },
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to retrieve exemption certificates.');
  }
});

// ─── POST: Create certificate with validation ──────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const certificateType = typeof body.certificateType === 'string' ? body.certificateType.toLowerCase().trim() : '';
  const jurisdiction = typeof body.jurisdiction === 'string' ? body.jurisdiction.toUpperCase().trim() : '';
  const exemptionNumber = typeof body.exemptionNumber === 'string' ? body.exemptionNumber.trim() : '';
  const holderName = typeof body.holderName === 'string' ? body.holderName.trim() : '';
  const holderTaxId = typeof body.holderTaxId === 'string' ? body.holderTaxId.trim() : undefined;
  const expirationDate = typeof body.expirationDate === 'string' ? body.expirationDate.trim() : undefined;
  const productCategories = Array.isArray(body.productCategories) ? body.productCategories : undefined;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;

  // Validation
  if (!VALID_CERT_TYPES.includes(certificateType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"certificateType" must be one of: ${VALID_CERT_TYPES.join(', ')}`);
  }
  if (!jurisdiction) return apiError(ApiErrorCode.BAD_REQUEST, '"jurisdiction" is required.');
  if (!exemptionNumber) return apiError(ApiErrorCode.BAD_REQUEST, '"exemptionNumber" is required.');
  if (!holderName) return apiError(ApiErrorCode.BAD_REQUEST, '"holderName" is required.');

  // C1: Format validation
  const formatCheck = validateCertificateFormat(certificateType, exemptionNumber);
  if (!formatCheck.valid) {
    return apiError(ApiErrorCode.BAD_REQUEST, formatCheck.error || 'Invalid certificate format.');
  }

  // C2: Expiration check on create
  if (expirationDate) {
    const expCheck = checkExpiration(expirationDate);
    if (expCheck.isExpired) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Certificate has already expired. Cannot register expired certificates.');
    }
  }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    const { data, error } = await supabase
      .from('tax_exemption_certificates')
      .insert({
        seller_id: context.sellerId,
        certificate_type: certificateType,
        jurisdiction,
        exemption_number: exemptionNumber,
        holder_name: holderName,
        holder_tax_id: holderTaxId,
        expiration_date: expirationDate,
        product_categories: productCategories,
        notes,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) throw error;

    // C3: State form info
    const stateForm = STATE_EXEMPTION_FORMS[jurisdiction];

    return apiSuccess(
      {
        id: data?.id,
        certificateType,
        description: CERT_DESCRIPTIONS[certificateType] || certificateType,
        jurisdiction,
        exemptionNumber,
        holderName,
        status: 'active',
        saved: true,
        requiredForm: stateForm ? {
          form: stateForm.form,
          name: stateForm.name,
          mtcAccepted: stateForm.mtcAccepted,
          mtcNote: stateForm.mtcAccepted
            ? 'MTC Uniform Sales & Use Tax Exemption Certificate also accepted'
            : 'State-specific form required. MTC uniform certificate NOT accepted.',
        } : null,
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to store exemption certificate.');
  }
});

// ─── PUT: Apply exemption to transaction + audit log ─

export const PUT = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const certificateId = typeof body.certificateId === 'string' ? body.certificateId.trim() : '';
  const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';
  const exemptedAmount = typeof body.exemptedAmount === 'number' ? body.exemptedAmount : 0;
  const buyerId = typeof body.buyerId === 'string' ? body.buyerId.trim() : undefined;

  if (!certificateId) return apiError(ApiErrorCode.BAD_REQUEST, '"certificateId" is required.');
  if (!transactionId) return apiError(ApiErrorCode.BAD_REQUEST, '"transactionId" is required.');

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    // Look up certificate
    const { data: cert, error: certError } = await supabase
      .from('tax_exemption_certificates')
      .select('*')
      .eq('id', certificateId)
      .eq('seller_id', context.sellerId)
      .single();

    if (certError || !cert) {
      return apiError(ApiErrorCode.NOT_FOUND, 'Certificate not found or does not belong to this seller.');
    }

    // C2: Check expiration before applying
    const expiration = checkExpiration(cert.expiration_date as string | null);
    if (expiration.isExpired) {
      return apiError(ApiErrorCode.BAD_REQUEST,
        `Certificate expired ${Math.abs(expiration.daysUntilExpiry || 0)} days ago. Renew before applying exemption.`);
    }

    if (String(cert.status) !== 'active') {
      return apiError(ApiErrorCode.BAD_REQUEST, `Certificate status is "${cert.status}". Only active certificates can be applied.`);
    }

    // C4: Log exemption usage
    try {
      await supabase.from('tax_exemption_usage_log').insert({
        certificate_id: certificateId,
        seller_id: context.sellerId,
        buyer_id: buyerId || null,
        transaction_id: transactionId,
        exempted_amount: exemptedAmount,
        jurisdiction: cert.jurisdiction,
        certificate_type: cert.certificate_type,
        applied_at: new Date().toISOString(),
      });
    } catch { /* best-effort logging */ }

    // C4: Audit log
    try {
      await supabase.from('health_check_logs').insert({
        overall_status: 'green',
        checks: [{
          name: 'tax_exemption_applied',
          certificateId,
          sellerId: context.sellerId,
          transactionId,
          exemptedAmount,
          jurisdiction: cert.jurisdiction,
          certificateType: cert.certificate_type,
        }],
        duration_ms: 0,
      });
    } catch { /* best-effort */ }

    return apiSuccess(
      {
        applied: true,
        certificateId,
        transactionId,
        exemptedAmount,
        jurisdiction: cert.jurisdiction,
        certificateType: cert.certificate_type,
        holderName: cert.holder_name,
        expiration,
        auditLogged: true,
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to apply exemption.');
  }
});
