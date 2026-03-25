/**
 * F130: Merchant of Record (MoR) — DDP quote, fees, terms.
 * C1: DDP quote with actual landed cost
 * C2: MoR fee structure
 * C3: Responsibility scope
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MOR_FEE = { percentage: 3.5, flatFee: 0.50 };

const VAT_REGISTRATION_COUNTRIES = new Set([
  'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'AT', 'BE', 'PL', 'CZ', 'DK', 'FI',
  'IE', 'PT', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'CY', 'MT',
  'AU', 'NZ', 'SG', 'JP', 'KR', 'IN', 'CA', 'NO', 'CH',
]);

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'info';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';

  if (action === 'quote') {
    const itemPrice = typeof body.itemPrice === 'number' ? body.itemPrice : 0;
    const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
    const shippingCost = typeof body.shippingCost === 'number' ? body.shippingCost : 0;
    const dutyRate = typeof body.dutyRate === 'number' ? body.dutyRate : 0;
    const vatRate = typeof body.vatRate === 'number' ? body.vatRate : 0;

    if (itemPrice <= 0) return apiError(ApiErrorCode.BAD_REQUEST, '"itemPrice" must be positive.');
    if (!destinationCountry) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required for quote.');

    const itemTotal = Math.round(itemPrice * quantity * 100) / 100;
    const duties = Math.round(itemTotal * dutyRate * 100) / 100;
    const taxes = Math.round((itemTotal + duties) * vatRate * 100) / 100;
    const subtotal = itemTotal + duties + taxes + shippingCost;
    const morFee = Math.round((subtotal * MOR_FEE.percentage / 100 + MOR_FEE.flatFee) * 100) / 100;
    const totalDdp = Math.round((subtotal + morFee) * 100) / 100;

    return apiSuccess({
      ddpQuote: {
        itemTotal, quantity,
        duties, dutyRate,
        taxes, vatRate,
        shippingCost,
        morFee: {
          percentage: MOR_FEE.percentage,
          flatFee: MOR_FEE.flatFee,
          total: morFee,
          includes: ['Tax collection & remittance', 'Compliance liability', 'Customs brokerage coordination', 'Local invoicing'],
        },
        totalDdp,
        currency: typeof body.currency === 'string' ? body.currency : 'USD',
        destinationCountry,
      },
      morTerms: {
        potalResponsibility: ['Tax calculation accuracy guarantee', 'Tax remittance to authorities', 'Customs classification', 'Regulatory compliance updates'],
        sellerResponsibility: ['Product quality & description accuracy', 'Shipping fulfillment', 'Return/refund handling', 'Customer communication'],
        buyerProtection: ['DDP guaranteed price — no hidden customs charges', 'Refund for tax overpayment', 'Landed cost accuracy guarantee'],
      },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'check_requirements') {
    if (!destinationCountry) return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" required.');
    const needsVatReg = VAT_REGISTRATION_COUNTRIES.has(destinationCountry);

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
      morFeeStructure: { percentage: MOR_FEE.percentage, flatFee: MOR_FEE.flatFee, note: 'Applied only when MoR service is used.' },
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // Default: info
  return apiSuccess({
    morService: {
      description: 'Merchant of Record handles tax collection, remittance, and compliance on behalf of the seller.',
      provider: 'Paddle (via POTAL partnership)',
      coverage: '200+ countries',
      features: ['Automatic tax calculation', 'Tax remittance', 'VAT/GST registration', 'Local currency pricing', 'Invoicing', 'Chargeback handling', 'Fraud prevention', 'Regulatory compliance'],
      feeStructure: { percentage: MOR_FEE.percentage, flatFee: MOR_FEE.flatFee },
    },
    alternativeApproach: {
      description: 'POTAL provides 100% accurate landed cost. With DDP pricing, sellers collect exact duties/taxes without full MoR.',
      benefits: ['Lower fees than MoR', 'Keep customer relationship', 'Same accuracy'],
    },
    actions: ['info', 'quote', 'check_requirements'],
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "info"|"quote"|"check_requirements", destinationCountry?, itemPrice?, quantity?, dutyRate?, vatRate? }');
}
