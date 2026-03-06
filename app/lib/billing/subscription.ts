/**
 * POTAL Billing — Subscription Management
 *
 * Handles subscription lifecycle:
 *   trialing → active → past_due → canceled
 *
 * Syncs LemonSqueezy subscription status to Supabase sellers table.
 * (Migrated from Stripe — 세션 26, Stripe 계정 정지)
 */

import { createClient } from '@supabase/supabase-js';
import {
  initLemonSqueezy,
  type PlanId,
} from './lemonsqueezy';
import {
  createCustomer,
  cancelSubscription as lsCancelSubscription,
  updateSubscription as lsUpdateSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Map LemonSqueezy subscription status to POTAL subscription status
 *
 * LS statuses: on_trial, active, paused, past_due, unpaid, cancelled, expired
 */
export function mapLSStatus(
  lsStatus: string
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'inactive' {
  switch (lsStatus) {
    case 'on_trial':
      return 'trialing';
    case 'active':
      return 'active';
    case 'paused':
      return 'active'; // Treat paused as active (keeps access until period end)
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'cancelled':
    case 'expired':
      return 'canceled';
    default:
      return 'inactive';
  }
}

/**
 * Map LemonSqueezy Variant ID to POTAL Plan ID
 */
export function mapVariantToPlan(variantId: string): PlanId {
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_STARTER) return 'starter';
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_GROWTH) return 'growth';
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE) return 'enterprise';
  return 'starter'; // Default fallback
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
 * Create or retrieve LemonSqueezy Customer for a seller
 */
export async function getOrCreateBillingCustomer(
  sellerId: string,
  email: string,
  companyName?: string
): Promise<string> {
  const supabase = getServiceClient();
  initLemonSqueezy();

  // Check if seller already has a billing customer ID
  const { data: seller } = await (supabase.from('sellers') as any)
    .select('billing_customer_id')
    .eq('id', sellerId)
    .single();

  if (seller?.billing_customer_id) {
    return seller.billing_customer_id;
  }

  // Create new LemonSqueezy customer
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID is not set');
  }

  const { data: customer, error } = await createCustomer(storeId, {
    name: companyName || email,
    email,
  });

  if (error || !customer) {
    throw new Error(`Failed to create LemonSqueezy customer: ${error?.message || 'Unknown error'}`);
  }

  const customerId = customer.data.id;

  // Save customer ID to Supabase
  await (supabase.from('sellers') as any)
    .update({ billing_customer_id: customerId })
    .eq('id', sellerId);

  return customerId;
}

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(subscriptionId: string) {
  initLemonSqueezy();
  const { error } = await lsCancelSubscription(subscriptionId);
  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Resume/reactivate a cancelled subscription (if still within billing period)
 */
export async function reactivateSubscription(subscriptionId: string) {
  initLemonSqueezy();
  const { error } = await lsUpdateSubscription(subscriptionId, {
    cancelled: false,
  });
  if (error) {
    throw new Error(`Failed to reactivate subscription: ${error.message}`);
  }
}
