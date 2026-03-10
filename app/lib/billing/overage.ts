/**
 * POTAL Billing — Overage Charge
 *
 * 월말에 실행되어 각 셀러의 초과 사용량을 계산하고
 * Paddle One-time Charge API로 청구.
 *
 * Overage rates (세션 37 확정):
 *   Basic:      $0.015/call
 *   Pro:        $0.012/call
 *   Enterprise: $0.01/call
 *
 * Paddle API: POST /subscriptions/{id}/charge
 */

import { createClient } from '@supabase/supabase-js';
import { PLAN_CONFIG, getPaddleHeaders, getPaddleBaseUrl } from './paddle';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface OverageResult {
  sellerId: string;
  planId: string;
  used: number;
  limit: number;
  overageCount: number;
  overageRate: number;
  chargeAmountCents: number;
  charged: boolean;
  error?: string;
}

const PLAN_LIMITS: Record<string, { limit: number; overageRate: number }> = {
  free: { limit: 100, overageRate: 0 },
  basic: { limit: 2000, overageRate: 0.015 },
  pro: { limit: 10000, overageRate: 0.012 },
  enterprise: { limit: 50000, overageRate: 0.01 },
};

/**
 * Calculate overage for all sellers in a given month.
 * Returns list of sellers with overage details.
 */
export async function calculateMonthlyOverages(
  year: number,
  month: number
): Promise<OverageResult[]> {
  const supabase = getServiceClient();
  const results: OverageResult[] = [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;

  // Get all paid sellers with active subscriptions
  const { data: sellers } = await (supabase.from('sellers') as any)
    .select('id, plan_id, billing_subscription_id, billing_customer_id, contact_email, company_name')
    .in('plan_id', ['basic', 'pro', 'enterprise'])
    .eq('subscription_status', 'active');

  if (!sellers || sellers.length === 0) return results;

  for (const seller of sellers) {
    const planConfig = PLAN_LIMITS[seller.plan_id] || PLAN_LIMITS.basic;

    // Count usage for this seller in the given month
    const { count } = await (supabase.from('usage_logs') as any)
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', seller.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    const used = count || 0;
    const overageCount = Math.max(0, used - planConfig.limit);

    if (overageCount === 0) continue;

    const chargeAmountCents = Math.round(overageCount * planConfig.overageRate * 100);

    const result: OverageResult = {
      sellerId: seller.id,
      planId: seller.plan_id,
      used,
      limit: planConfig.limit,
      overageCount,
      overageRate: planConfig.overageRate,
      chargeAmountCents,
      charged: false,
    };

    // Charge via Paddle if seller has active subscription
    if (seller.billing_subscription_id && chargeAmountCents > 0) {
      try {
        await chargeOverageViaPaddle(
          seller.billing_subscription_id,
          chargeAmountCents,
          overageCount,
          seller.plan_id,
          `${year}-${String(month).padStart(2, '0')}`
        );
        result.charged = true;
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'Unknown error';
      }
    } else {
      result.error = 'No active subscription';
    }

    results.push(result);
  }

  return results;
}

/**
 * Create a one-time charge on a Paddle subscription for overage.
 *
 * Paddle API: POST /subscriptions/{subscription_id}/charge
 * Docs: https://developer.paddle.com/api-reference/subscriptions/create-one-time-charge
 */
async function chargeOverageViaPaddle(
  subscriptionId: string,
  amountCents: number,
  overageCount: number,
  planId: string,
  period: string
): Promise<void> {
  const productId = 'pro_01kkaxh9zk1cdb59681knmha01'; // POTAL product

  const res = await fetch(
    `${getPaddleBaseUrl()}/subscriptions/${subscriptionId}/charge`,
    {
      method: 'POST',
      headers: getPaddleHeaders(),
      body: JSON.stringify({
        items: [
          {
            price: {
              description: `POTAL API overage: ${overageCount} calls over ${planId} plan limit (${period})`,
              unit_price: {
                amount: String(amountCents),
                currency_code: 'USD',
              },
              product_id: productId,
              tax_mode: 'account_setting',
            },
            quantity: 1,
          },
        ],
        effective_from: 'next_billing_period',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Paddle charge failed: ${res.status} ${JSON.stringify(err)}`);
  }
}
