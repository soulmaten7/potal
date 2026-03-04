/**
 * POTAL Billing — Subscription Management
 *
 * Handles subscription lifecycle:
 *   trialing → active → past_due → canceled
 *
 * Syncs Stripe subscription status to Supabase sellers table.
 */

import { createClient } from '@supabase/supabase-js';
import { getStripe, type PlanId } from './stripe';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Map Stripe subscription status to POTAL subscription status
 */
export function mapStripeStatus(
  stripeStatus: string
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive' {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'inactive';
  }
}

/**
 * Map Stripe Price ID to POTAL Plan ID
 */
export function mapPriceToPlan(priceId: string): PlanId {
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 'growth';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return 'starter';
}

/**
 * Update seller's subscription status in Supabase
 */
export async function updateSellerSubscription(params: {
  sellerId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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

  if (params.stripeCustomerId) {
    updateData.stripe_customer_id = params.stripeCustomerId;
  }
  if (params.stripeSubscriptionId) {
    updateData.stripe_subscription_id = params.stripeSubscriptionId;
  }
  if (params.currentPeriodEnd) {
    updateData.current_period_end = params.currentPeriodEnd.toISOString();
  }

  let query;

  if (params.sellerId) {
    query = (supabase.from('sellers') as any)
      .update(updateData)
      .eq('id', params.sellerId);
  } else if (params.stripeCustomerId) {
    query = (supabase.from('sellers') as any)
      .update(updateData)
      .eq('stripe_customer_id', params.stripeCustomerId);
  } else {
    throw new Error('Either sellerId or stripeCustomerId required');
  }

  const { error } = await query;
  if (error) {
    console.error('Failed to update seller subscription:', error);
    throw error;
  }
}

/**
 * Create or retrieve Stripe Customer for a seller
 */
export async function getOrCreateStripeCustomer(
  sellerId: string,
  email: string,
  companyName?: string
): Promise<string> {
  const supabase = getServiceClient();
  const stripe = getStripe();

  // Check if seller already has a Stripe customer ID
  const { data: seller } = await (supabase.from('sellers') as any)
    .select('stripe_customer_id')
    .eq('id', sellerId)
    .single();

  if (seller?.stripe_customer_id) {
    return seller.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: companyName || email,
    metadata: {
      potal_seller_id: sellerId,
    },
  });

  // Save Stripe customer ID to Supabase
  await (supabase.from('sellers') as any)
    .update({ stripe_customer_id: customer.id })
    .eq('id', sellerId);

  return customer.id;
}

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(stripeSubscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(stripeSubscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
