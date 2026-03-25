/**
 * F131: Fraud Prevention — weighted risk scoring + allow/block lists.
 * F132: Chargeback Management — dispute tracking + evidence collection.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── F131: Fraud Weights ────────────────────────────

const FRAUD_WEIGHTS: Record<string, number> = {
  country_mismatch: 25,
  velocity_check: 20,
  address_mismatch: 15,
  high_value_first_order: 15,
  disposable_email: 10,
  known_fraud_bin: 10,
  vpn_detected: 5,
  email_alias: 3,
  high_risk_country: 20,
  very_high_value: 15,
};

const HIGH_RISK_COUNTRIES = new Set(['NG', 'GH', 'CI', 'CM', 'PK', 'BD']);
const DISPOSABLE_EMAIL_DOMAINS = new Set(['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'yopmail.com']);

// ─── F132: Chargeback Reasons ───────────────────────

const CHARGEBACK_REASON_CODES: Record<string, { description: string; evidence: string[] }> = {
  '10.4': { description: 'Other Fraud — Card-Absent Environment', evidence: ['AVS match', 'CVV match', 'IP geolocation', 'Device fingerprint', '3DS result'] },
  '13.1': { description: 'Merchandise/Services Not Received', evidence: ['Tracking number', 'Delivery confirmation', 'Carrier signature', 'Customs clearance docs'] },
  '13.2': { description: 'Cancelled Recurring Transaction', evidence: ['Cancellation policy', 'Communication log', 'Terms accepted'] },
  '13.3': { description: 'Not as Described', evidence: ['Product listing', 'Photos', 'Return policy', 'Customer correspondence'] },
  '13.6': { description: 'Credit Not Processed', evidence: ['Refund receipt', 'Processing timeline', 'Communication'] },
  '13.7': { description: 'Cancelled Merchandise/Services', evidence: ['Cancellation policy', 'Terms of sale', 'Communication'] },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const action = typeof body.action === 'string' ? body.action : 'screen';

  // ── F131: Fraud Screen ────────────────────────────
  if (action === 'screen') {
    const orderValue = typeof body.orderValue === 'number' ? body.orderValue : 0;
    const country = typeof body.country === 'string' ? body.country.toUpperCase() : '';
    const email = typeof body.email === 'string' ? body.email.toLowerCase() : '';
    const ipCountry = typeof body.ipCountry === 'string' ? body.ipCountry.toUpperCase() : '';
    const billingCountry = typeof body.billingCountry === 'string' ? body.billingCountry.toUpperCase() : '';
    const isFirstOrder = typeof body.isFirstOrder === 'boolean' ? body.isFirstOrder : true;
    const isVpn = typeof body.isVpn === 'boolean' ? body.isVpn : false;
    const allowList = Array.isArray(body.allowList) ? body.allowList as string[] : [];

    if (orderValue <= 0 || !country) return apiError(ApiErrorCode.BAD_REQUEST, '"orderValue" and "country" required.');

    // Allow list check
    if (email && allowList.includes(email)) {
      return apiSuccess({
        riskScore: 0, riskLevel: 'low', recommendation: 'approve',
        riskFactors: [], note: 'Customer on allow list — bypassed fraud checks.',
      }, { sellerId: context.sellerId, plan: context.planId });
    }

    const riskFactors: { signal: string; weight: number; detail: string }[] = [];

    if (HIGH_RISK_COUNTRIES.has(country)) {
      riskFactors.push({ signal: 'high_risk_country', weight: FRAUD_WEIGHTS.high_risk_country, detail: `${country} is flagged as high-risk` });
    }
    if (ipCountry && country && ipCountry !== country) {
      riskFactors.push({ signal: 'country_mismatch', weight: FRAUD_WEIGHTS.country_mismatch, detail: `IP country ${ipCountry} ≠ shipping country ${country}` });
    }
    if (billingCountry && country && billingCountry !== country) {
      riskFactors.push({ signal: 'address_mismatch', weight: FRAUD_WEIGHTS.address_mismatch, detail: `Billing ${billingCountry} ≠ shipping ${country}` });
    }
    if (orderValue > 5000 && isFirstOrder) {
      riskFactors.push({ signal: 'high_value_first_order', weight: FRAUD_WEIGHTS.high_value_first_order, detail: `$${orderValue} on first order` });
    }
    if (orderValue > 10000) {
      riskFactors.push({ signal: 'very_high_value', weight: FRAUD_WEIGHTS.very_high_value, detail: `Order value $${orderValue} exceeds $10K` });
    }
    if (email) {
      const domain = email.split('@')[1];
      if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        riskFactors.push({ signal: 'disposable_email', weight: FRAUD_WEIGHTS.disposable_email, detail: `${domain} is a disposable email provider` });
      }
      if (email.includes('+')) {
        riskFactors.push({ signal: 'email_alias', weight: FRAUD_WEIGHTS.email_alias, detail: 'Email contains + alias' });
      }
    }
    if (isVpn) {
      riskFactors.push({ signal: 'vpn_detected', weight: FRAUD_WEIGHTS.vpn_detected, detail: 'VPN/proxy detected' });
    }

    const riskScore = riskFactors.reduce((sum, f) => sum + f.weight, 0);
    const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
    const recommendation = riskLevel === 'high' ? 'reject' : riskLevel === 'medium' ? 'manual_review' : 'approve';

    return apiSuccess({
      riskScore,
      riskLevel,
      recommendation,
      riskFactors,
      thresholds: { low: '0-29', medium: '30-59', high: '60+' },
      suggestedActions: {
        approve: 'Process order normally',
        manual_review: 'Hold for manual review. Request additional verification (phone, ID).',
        reject: 'Decline order. Notify customer with option to contact support.',
      },
      integrationNote: 'For production fraud prevention, layer with Stripe Radar, Signifyd, or Riskified.',
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  // ── F132: Chargeback ──────────────────────────────
  if (action === 'chargeback') {
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const reasonCode = typeof body.reasonCode === 'string' ? body.reasonCode : '';
    const disputeAmount = typeof body.disputeAmount === 'number' ? body.disputeAmount : 0;

    if (!orderId) return apiError(ApiErrorCode.BAD_REQUEST, '"orderId" required.');

    const reasonInfo = reasonCode ? CHARGEBACK_REASON_CODES[reasonCode] : null;

    return apiSuccess({
      orderId,
      reasonCode: reasonCode || null,
      reasonDescription: reasonInfo?.description || 'Unknown reason code. Provide Visa/MC reason code (e.g., "10.4", "13.1").',
      disputeAmount: disputeAmount || null,
      evidenceRequired: reasonInfo?.evidence || ['Transaction receipt', 'Shipping tracking', 'Customer communication', 'Terms of sale'],
      responseFlow: [
        { step: 1, action: 'Chargeback notification received', sla: 'Immediate' },
        { step: 2, action: 'Collect evidence', sla: '24 hours', automatedEvidence: ['Shipping tracking + delivery confirmation', 'Customs clearance documentation', 'DDP payment receipts', 'Landed cost calculation audit trail'] },
        { step: 3, action: 'Submit dispute response', sla: '48 hours (before card network deadline)' },
        { step: 4, action: 'Await resolution', sla: '30-90 days (card network dependent)' },
      ],
      prevention: ['Enable 3D Secure (3DS2)', 'Collect AVS + CVV', 'Clear billing descriptor', 'Provide tracking with delivery confirmation', 'Use DDP pricing to prevent "hidden charges" disputes'],
      allReasonCodes: Object.entries(CHARGEBACK_REASON_CODES).map(([code, info]) => ({ code, ...info })),
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid action. Use: screen, chargeback.');
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { action: "screen"|"chargeback", orderValue?, country?, email?, orderId?, reasonCode? }');
}
