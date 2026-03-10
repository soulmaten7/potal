/**
 * POTAL Billing — Subscription Management
 *
 * Handles subscription lifecycle:
 *   trialing → active → past_due → canceled
 *
 * Syncs Paddle subscription status to Supabase sellers table.
 * (Stripe → LemonSqueezy(세션 26) → Paddle(세션 36))
 */

import { createClient } from '@supabase/supabase-js';
import {
  getPaddleHeaders,
  getPaddleBaseUrl,
  type PlanId,
} from './paddle';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Map Paddle subscription status to POTAL subscription status
 *
 * Paddle statuses: trialing, active, past_due, paused, canceled
 */
export function mapPaddleStatus(
  paddleStatus: string
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive' {
  switch (paddleStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'paused':
      return 'active'; // Treat paused as active (keeps access until period end)
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'inactive';
  }
}

/**
 * Update seller's subscription status in Supabase
 */
export async function updateSellerSubscription(params: {
  sellerId?: string;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  planId: PlanId;
  subscriptionStatus: string;
  currentPeriodEnd?: Date;
}) {
  const supabase = getServiceClient();

  const updateData: Record<string, unknown> = {
    plan_id: params.planId,
    subscription_status: params.subscriptionStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.billingCustomerId) {
    updateData.billing_customer_id = params.billingCustomerId;
  }
  if (params.billingSubscriptionId) {
    updateData.billing_subscription_id = params.billingSubscriptionId;
  }
  if (params.currentPeriodEnd) {
    updateData.current_period_end = params.currentPeriodEnd.toISOString();
  }

  let query;

  if (params.sellerId) {
    query = (supabase.from('sellers') as any)
      .update(updateData)
      .eq('id', params.sellerId);
  } else if (params.billingCustomerId) {
    query = (supabase.from('sellers') as any)
      .update(updateData)
      .eq('billing_customer_id', params.billingCustomerId);
  } else {
    throw new Error('Either sellerId or billingCustomerId required');
  }

  const { error } = await query;
  if (error) {
    throw new Error(`Failed to update seller subscription: ${error.message}`);
  }
}

/**
 * Cancel a Paddle subscription (at period end)
 */
export async function cancelSubscription(subscriptionId: string) {
  const res = await fetch(
    `${getPaddleBaseUrl()}/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: getPaddleHeaders(),
      body: JSON.stringify({ effective_from: 'next_billing_period' }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to cancel subscription: ${JSON.stringify(err)}`);
  }
}

/**
 * Pause a Paddle subscription
 */
export async function pauseSubscription(subscriptionId: string) {
  const res = await fetch(
    `${getPaddleBaseUrl()}/subscriptions/${subscriptionId}/pause`,
    {
      method: 'POST',
      headers: getPaddleHeaders(),
      body: JSON.stringify({ effective_from: 'next_billing_period' }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to pause subscription: ${JSON.stringify(err)}`);
  }
}

/**
 * Resume a paused Paddle subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  const res = await fetch(
    `${getPaddleBaseUrl()}/subscriptions/${subscriptionId}/resume`,
    {
      method: 'POST',
      headers: getPaddleHeaders(),
      body: JSON.stringify({ effective_from: 'immediately' }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to resume subscription: ${JSON.stringify(err)}`);
  }
}
