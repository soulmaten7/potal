/**
 * F130: Merchant of Record (MoR) service.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'info';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';

  if (action === 'info') {
    return apiSuccess({
      morService: {
        description: 'Merchant of Record service handles tax collection, remittance, and compliance on behalf of the seller.',
        provider: 'Paddle (via POTAL partnership)',
        coverage: '200+ countries',
        features: [
          'Automatic tax calculation and collection',
          'Tax remittance to local authorities',
          'VAT/GST registration management',
          'Local currency pricing',
          'Invoicing in local language',
          'Chargeback handling',
          'Fraud prevention',
          'Regulatory compliance',
        ],
        pricing: { model: 'percentage_of_transaction', note: 'Contact sales for MoR pricing details.' },
      },
      alternativeApproach: {
        description: 'POTAL provides 100% accurate landed cost calculation. With accurate DDP pricing, sellers can collect exact duties/taxes at checkout without needing a full MoR.',
        benefits: ['Lower fees than MoR', 'Keep control of customer relationship', 'Same compliance accuracy'],
      },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'check_requirements') {
    if (!destinationCountry) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required for requirement check.');
    const vatCountries = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'AU', 'NZ', 'SG', 'JP', 'KR', 'IN', 'CA'];
    const needsVatReg = vatCountries.includes(destinationCountry);
    return apiSuccess({
      country: destinationCountry,
      vatRegistrationRequired: needsVatReg,
      morRecommended: needsVatReg,
      requirements: needsVatReg
        ? ['VAT/GST registration in destination country', 'Tax collection at point of sale', 'Periodic tax filing and remittance']
        : ['Standard customs duties collected at import', 'No local tax registration needed for low volumes'],
      potalSolution: needsVatReg
        ? 'Use POTAL DDP calculation to collect exact taxes at checkout, or enable MoR for full managed compliance.'
        : 'Standard landed cost calculation covers all import requirements.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: info, check_requirements.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "info"|"check_requirements", destinationCountry?: "GB" }'); }
