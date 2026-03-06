/**
 * POTAL Billing — POST /api/billing/webhook
 *
 * LemonSqueezy Webhook handler.
 * Receives events from LemonSqueezy and syncs subscription state to Supabase.
 *
 * Events handled:
 *   - subscription_created → Subscription starts (trialing or active)
 *   - subscription_updated → Plan change, trial end, payment status
 *   - subscription_cancelled → Subscription canceled (still active until period end)
 *   - subscription_expired → Subscription fully expired
 *   - subscription_payment_success → Payment confirmed
 *   - subscription_payment_failed → Payment failed (past_due)
 *
 * Signature: HMAC SHA-256 using LEMONSQUEEZY_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  updateSellerSubscription,
  mapLSStatus,
  mapVariantToPlan,
} from '@/app/lib/billing/subscription';

export const dynamic = 'force-dynamic';

async function getRawBody(req: NextRequest): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  if (!reader) throw new Error('No request body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf-8');
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let rawBody: string;
  let event: any;

  try {
    rawBody = await getRawBody(req);
    const signature = req.headers.get('x-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data || {};
  const attrs = event.data?.attributes || {};

  try {
    switch (eventName) {
      case 'subscription_created': {
        const sellerId = customData.potal_seller_id;
        const planId = customData.potal_plan_id;
        const customerId = attrs.customer_id?.toString();
        const subscriptionId = event.data?.id?.toString();
        const status = mapLSStatus(attrs.status);
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : undefined;

        if (sellerId) {
          await updateSellerSubscription({
            sellerId,
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId: planId || 'starter',
            subscriptionStatus: status,
            currentPeriodEnd: renewsAt,
          });
        }
        break;
      }

      case 'subscription_updated': {
        const customerId = attrs.customer_id?.toString();
        const subscriptionId = event.data?.id?.toString();
        const variantId = attrs.variant_id?.toString();
        const planId = variantId ? mapVariantToPlan(variantId) : 'starter';
        const status = mapLSStatus(attrs.status);
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : undefined;

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: status,
            currentPeriodEnd: renewsAt,
          });
        }
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const customerId = attrs.customer_id?.toString();

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            planId: 'starter', // Downgrade to free
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }

      case 'subscription_payment_success': {
        const customerId = attrs.customer_id?.toString();
        const subscriptionId = event.data?.id?.toString();
        const variantId = attrs.variant_id?.toString();
        const planId = variantId ? mapVariantToPlan(variantId) : 'starter';
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : undefined;

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: 'active',
            currentPeriodEnd: renewsAt,
          });
        }
        break;
      }

      case 'subscription_payment_failed': {
        const customerId = attrs.customer_id?.toString();

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            planId: 'growth', // Keep plan but mark past_due
            subscriptionStatus: 'past_due',
          });
        }
        break;
      }

      default:
        // Unhandled event — just acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
