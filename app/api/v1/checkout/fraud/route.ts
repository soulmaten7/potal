/**
 * F131: Fraud prevention.
 * F132: Chargeback management.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const HIGH_RISK_COUNTRIES = ['NG', 'GH', 'CI', 'CM', 'PK', 'BD'];
const FRAUD_SIGNALS = ['address_mismatch', 'velocity_check', 'device_fingerprint', 'ip_geolocation', 'email_domain', 'bin_country_mismatch'];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'screen';

  if (action === 'screen') {
    const orderValue = typeof body.orderValue === 'number' ? body.orderValue : 0;
    const country = typeof body.country === 'string' ? body.country.toUpperCase() : '';
    const email = typeof body.email === 'string' ? body.email : '';

    if (!orderValue || !country) return apiError(ApiErrorCode.BAD_REQUEST, '"orderValue" and "country" required.');

    const riskFactors: string[] = [];
    let riskScore = 0;

    if (HIGH_RISK_COUNTRIES.includes(country)) { riskFactors.push('high_risk_country'); riskScore += 30; }
    if (orderValue > 5000) { riskFactors.push('high_value_order'); riskScore += 15; }
    if (email && email.includes('+')) { riskFactors.push('email_alias_detected'); riskScore += 5; }
    if (orderValue > 10000) { riskFactors.push('very_high_value'); riskScore += 20; }

    const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
    const recommendation = riskLevel === 'high' ? 'manual_review' : riskLevel === 'medium' ? 'additional_verification' : 'approve';

    return apiSuccess({
      riskScore, riskLevel, recommendation, riskFactors,
      signals: FRAUD_SIGNALS,
      actions: { approve: 'Process order', hold: 'Hold for manual review', reject: 'Decline order' },
      note: 'For production fraud prevention, integrate with Stripe Radar, Signifyd, or Riskified.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  if (action === 'chargeback') {
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    if (!orderId) return apiError(ApiErrorCode.BAD_REQUEST, '"orderId" required.');

    return apiSuccess({
      orderId,
      chargebackManagement: {
        prevention: ['Address verification (AVS)', 'CVV verification', '3D Secure authentication', 'Clear billing descriptor', 'Delivery confirmation'],
        responseFlow: [
          { step: 1, action: 'Chargeback received', sla: 'Immediate notification' },
          { step: 2, action: 'Evidence collection', sla: '24 hours', evidence: ['Tracking proof', 'Delivery signature', 'Customer communication', 'Invoice'] },
          { step: 3, action: 'Dispute response submitted', sla: '48 hours' },
          { step: 4, action: 'Resolution', sla: '30-90 days (card network dependent)' },
        ],
        automatedEvidence: ['Shipping tracking with delivery confirmation', 'Customs clearance documentation', 'DDP payment receipts', 'Landed cost calculation audit trail'],
      },
      note: 'Chargeback management handled through Paddle MoR or directly via payment provider.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: screen, chargeback.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "screen"|"chargeback", orderValue?, country?, orderId? }'); }
