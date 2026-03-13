/**
 * POTAL API v1 — /api/v1/tax/exemptions
 *
 * Tax exemption certificate management.
 * Store, validate, and lookup exemption certificates.
 *
 * POST /api/v1/tax/exemptions — Create/upload exemption certificate
 * GET  /api/v1/tax/exemptions — List seller's exemption certificates
 *
 * POST Body: {
 *   certificateType: string,     // "resale" | "exempt_org" | "government" | "agricultural" | "manufacturing" | "diplomatic"
 *   jurisdiction: string,        // Country or US state code
 *   exemptionNumber: string,     // Certificate/permit number
 *   holderName: string,          // Name on certificate
 *   holderTaxId?: string,        // Tax ID / EIN
 *   expirationDate?: string,     // ISO date (null = no expiration)
 *   productCategories?: string[],// Exempt product categories
 *   notes?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

const VALID_CERT_TYPES = ['resale', 'exempt_org', 'government', 'agricultural', 'manufacturing', 'diplomatic', 'foreign_diplomat', 'native_american', 'direct_pay'];

// Certificate type descriptions
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

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tax_exemption_certificates')
    .select('*')
    .eq('seller_id', context.sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to retrieve exemption certificates.');
  }

  const certs = (data || []).map((c: Record<string, unknown>) => ({
    id: c.id,
    certificateType: c.certificate_type,
    jurisdiction: c.jurisdiction,
    exemptionNumber: c.exemption_number,
    holderName: c.holder_name,
    holderTaxId: c.holder_tax_id,
    expirationDate: c.expiration_date,
    isExpired: c.expiration_date ? new Date(c.expiration_date as string) < new Date() : false,
    productCategories: c.product_categories,
    status: c.status,
    createdAt: c.created_at,
  }));

  return apiSuccess(
    { certificates: certs, total: certs.length },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

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

  if (!VALID_CERT_TYPES.includes(certificateType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"certificateType" must be one of: ${VALID_CERT_TYPES.join(', ')}`);
  }
  if (!jurisdiction) return apiError(ApiErrorCode.BAD_REQUEST, '"jurisdiction" is required.');
  if (!exemptionNumber) return apiError(ApiErrorCode.BAD_REQUEST, '"exemptionNumber" is required.');
  if (!holderName) return apiError(ApiErrorCode.BAD_REQUEST, '"holderName" is required.');

  // Check expiration
  if (expirationDate && new Date(expirationDate) < new Date()) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Certificate has already expired.');
  }

  const supabase = getSupabase();

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

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to store exemption certificate.');
  }

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
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
