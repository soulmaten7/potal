import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const EXEMPTION_DATA: Record<string, { types: string[]; notes: string }> = {
  US: { types: ['501(c)(3) Non-profit', 'Government purchase', 'Resale certificate', 'Manufacturing exemption'], notes: 'Exemptions vary by state. Resale certificates must be validated.' },
  GB: { types: ['Zero-rated goods', 'Reduced rate (5%)', 'Exempt supplies'], notes: 'Children\'s clothing, most food, and books are zero-rated.' },
  DE: { types: ['Reduced VAT (7%)', 'Intra-community supply', 'Export exemption'], notes: 'Reduced rate applies to food, books, and public transport.' },
  AU: { types: ['GST-free supply', 'Input-taxed supply', 'Export exemption'], notes: 'Basic food, health services, and education are GST-free.' },
  CA: { types: ['Zero-rated supply', 'Exempt supply', 'Point-of-sale rebate'], notes: 'Basic groceries and prescription drugs are zero-rated.' },
  JP: { types: ['Reduced rate (8%)', 'Export exemption', 'Small business exemption'], notes: 'Food and newspapers qualify for reduced 8% rate.' },
};

const handler = async (req: NextRequest, _ctx: ApiAuthContext): Promise<Response> => {
  try {
    const body = await req.json().catch(() => ({}));
    const { destinationCountry, productCategory, exemptionType } = body as Record<string, string>;

    if (!destinationCountry) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry is required.');
    }

    const country = destinationCountry.toUpperCase();
    const data = EXEMPTION_DATA[country];

    return apiSuccess({
      country,
      productCategory: productCategory || 'general',
      exemptionType: exemptionType || 'all',
      availableExemptions: data?.types || ['Export exemption', 'Diplomatic exemption'],
      notes: data?.notes || 'Contact local tax authority for specific exemption rules.',
      standardRate: country === 'US' ? 'Varies by state (0-10.25%)' : country === 'GB' ? '20%' : country === 'DE' ? '19%' : country === 'JP' ? '10%' : 'Varies',
    });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Tax exemption lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
};

export const POST = withApiAuth(handler);
