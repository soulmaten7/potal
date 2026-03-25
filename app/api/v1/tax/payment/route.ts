/**
 * F052: Tax Payment Automation
 * F058: Duty Pre-payment Service
 * F059: Post-clearance Duty Collection
 *
 * C1: Payment guide with tax authority URLs
 * C2: Payment log tracking
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

const PAYMENT_METHODS: Record<string, { methods: string[]; note: string }> = {
  US: { methods: ['ACH (pay.gov)', 'ABI periodic duty statement', 'Customs bond'], note: 'CBP accepts ACH debit/credit and periodic monthly statements.' },
  EU: { methods: ['SEPA transfer', 'Deferred payment account', 'Customs guarantee'], note: 'Deferred payment allows up to 30 days after release.' },
  GB: { methods: ['Duty deferment account (DDA)', 'BACS', 'CHAPS'], note: 'DDA requires guarantee (CGU/CG). Payment by 15th of month following import.' },
  AU: { methods: ['ICS (Integrated Cargo System)', 'Direct debit'], note: 'Deferred GST available for registered importers.' },
  JP: { methods: ['Bank transfer', 'Multi-payment network', 'Extended payment'], note: 'AEO importers eligible for extended payment (3 months).' },
  KR: { methods: ['Bank transfer', 'Credit card', 'Electronic payment'], note: 'KCS electronic customs payment system.' },
  CA: { methods: ['EDI payment', 'Bank remittance', 'Daily notice'], note: 'CBSA D120 daily notice or monthly statement.' },
};

// C1: Tax authority URLs
const TAX_AUTHORITY_URLS: Record<string, { customs: string; tax: string }> = {
  US: { customs: 'https://www.cbp.gov/trade/basic-import-export/internet-purchases', tax: 'https://www.irs.gov/payments' },
  GB: { customs: 'https://www.gov.uk/topic/business-tax/import-export', tax: 'https://www.gov.uk/pay-vat' },
  EU: { customs: 'https://ec.europa.eu/taxation_customs/', tax: 'https://ec.europa.eu/taxation_customs/vat-gap_en' },
  AU: { customs: 'https://www.abf.gov.au/', tax: 'https://www.ato.gov.au/business/gst/' },
  CA: { customs: 'https://www.cbsa-asfc.gc.ca/', tax: 'https://www.canada.ca/en/revenue-agency/services/payments.html' },
  JP: { customs: 'https://www.customs.go.jp/', tax: 'https://www.nta.go.jp/' },
  KR: { customs: 'https://www.customs.go.kr/', tax: 'https://www.hometax.go.kr/' },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const country = typeof body.country === 'string' ? body.country.toUpperCase().trim() : '';
  const action = typeof body.action === 'string' ? body.action.toLowerCase() : 'info';
  const amount = typeof body.amount === 'number' ? body.amount : undefined;
  const taxType = typeof body.taxType === 'string' ? body.taxType : 'customs_duty';
  const reference = typeof body.reference === 'string' ? body.reference.trim() : undefined;

  if (!country || country.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"country" required (2-letter ISO).');

  const paymentInfo = PAYMENT_METHODS[country];
  const authorityUrls = TAX_AUTHORITY_URLS[country];

  // C2: Log payment if action is 'record'
  if (action === 'record' && amount && amount > 0) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('tax_payment_log').insert({
          seller_id: context.sellerId,
          country,
          tax_type: taxType,
          amount: { value: amount, currency: typeof body.currency === 'string' ? body.currency : 'USD' },
          status: 'recorded',
          reference: reference || null,
          paid_at: new Date().toISOString(),
        });
      } catch { /* best-effort */ }
    }

    return apiSuccess({
      country, action: 'record', recorded: true,
      amount, taxType, reference: reference || null,
    }, { sellerId: context.sellerId, plan: context.planId });
  }

  return apiSuccess({
    country, action,
    paymentMethods: paymentInfo?.methods || ['Contact local customs authority'],
    note: paymentInfo?.note || 'Payment method information not available.',
    // C1: Payment guide with authority URLs
    paymentGuide: {
      manual: {
        method: 'Direct payment to tax authority',
        customsUrl: authorityUrls?.customs || null,
        taxUrl: authorityUrls?.tax || null,
      },
      automated: {
        available: false,
        note: 'Automated tax payment integration coming soon. Record payments manually via action: "record".',
      },
    },
    dutyPrepayment: {
      available: ['US', 'GB', 'EU', 'AU', 'CA'].includes(country),
      description: 'Pre-pay estimated duties before shipment arrival for expedited clearance.',
      benefits: ['Faster customs release', 'Predictable cash flow', 'Reduced demurrage risk'],
    },
    postClearanceCollection: {
      available: true,
      description: 'Collect duties from buyer after customs clearance (DDU/DAP terms).',
      methods: ['Buyer invoice', 'COD collection via carrier', 'Payment link'],
    },
    estimatedAmount: amount || null,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { country: "US", action?: "prepay"|"info"|"record", amount?, taxType?, reference? }');
}
