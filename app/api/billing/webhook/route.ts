/**
 * POTAL Billing — POST /api/billing/webhook
 *
 * Stripe Webhook handler.
 * Receives events from Stripe and syncs subscription state to Supabase.
 *
 * Events handled:
 *   - checkout.session.completed → First subscription created
 *   - customer.subscription.created → Subscription starts
 *   - customer.subscription.updated → Plan change, trial end, payment status
 *   - customer.subscription.deleted → Subscription canceled
 *   - invoice.payment_succeeded → Payment confirmed
 *   - invoice.payment_failed → Payment failed (past_due)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/app/lib/billing/stripe';
import {
  updateSellerSubscription,
  mapStripeStatus,
  mapPriceToPlan,
} from '@/app/lib/billing/subscription';

// Disable body parsing — Stripe needs raw body for signature verification
export const dynamic = 'force-dynamic';

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  if (!reader) throw new Error('No request body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sellerId = session.metadata?.potal_seller_id;
        const planId = session.metadata?.potal_plan_id;

        if (sellerId && planId) {
          await updateSellerSubscription({
            sellerId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            planId: planId as any,
            subscriptionStatus: 'trialing', // 14-day trial starts
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const planId = priceId ? mapPriceToPlan(priceId) : 'starter';
        const status = mapStripeStatus(subscription.status);

        await updateSellerSubscription({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          planId,
          subscriptionStatus: status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await updateSellerSubscription({
          stripeCustomerId: customerId,
          planId: 'starter', // Downgrade to free
          subscriptionStatus: 'canceled',
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          // Payment successful — ensure status is active
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          const planId = priceId ? mapPriceToPlan(priceId) : 'starter';

          await updateSellerSubscription({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await updateSellerSubscription({
          stripeCustomerId: customerId,
          planId: 'growth', // Keep plan but mark past_due
          subscriptionStatus: 'past_due',
        });
        break;
      }

      default:
        // Unhandled event type — just acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
