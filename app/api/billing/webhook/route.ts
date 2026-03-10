/**
 * POTAL Billing — POST /api/billing/webhook
 *
 * Paddle Webhook handler.
 * Receives events from Paddle and syncs subscription state to Supabase.
 *
 * Events handled:
 *   - subscription.created → New subscription
 *   - subscription.updated → Plan change, status change
 *   - subscription.canceled → Subscription canceled
 *   - subscription.past_due → Payment failed
 *   - subscription.activated → Subscription activated (after trial)
 *   - transaction.completed → Payment confirmed
 *
 * Signature: Paddle-Signature header (ts + h1 HMAC SHA-256)
 * Docs: https://developer.paddle.com/webhooks/signature-verification
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  updateSellerSubscription,
  mapPaddleStatus,
} from '@/app/lib/billing/subscription';
import { mapPriceToPlan } from '@/app/lib/billing/paddle';

export const dynamic = 'force-dynamic';

/**
 * Verify Paddle webhook signature
 * Format: ts=1234567890;h1=abc123...
 */
function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(';')) {
      const [key, value] = part.split('=');
      if (key && value) parts[key] = value;
    }

    const ts = parts['ts'];
    const h1 = parts['h1'];
    if (!ts || !h1) return false;

    const payload = `${ts}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret);
    const computed = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(computed)
    );
  } catch {
    return false;
  }
}

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

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let rawBody: string;
  let event: any;

  try {
    rawBody = await getRawBody(req);
    const signature = req.headers.get('paddle-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Paddle-Signature header' }, { status: 400 });
    }

    if (!verifyPaddleSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const eventType = event.event_type;
  const data = event.data || {};

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated': {
        const customData = data.custom_data || {};
        const sellerId = customData.potal_seller_id;
        const customerId = data.customer_id;
        const subscriptionId = data.id;
        const status = mapPaddleStatus(data.status);
        const currentPeriodEnd = data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : undefined;

        const priceId = data.items?.[0]?.price?.id;
        const planId = customData.potal_plan_id || (priceId ? mapPriceToPlan(priceId) : 'basic');

        if (sellerId) {
          await updateSellerSubscription({
            sellerId,
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: status,
            currentPeriodEnd,
          });
        }
        break;
      }

      case 'subscription.updated': {
        const customerId = data.customer_id;
        const subscriptionId = data.id;
        const status = mapPaddleStatus(data.status);
        const currentPeriodEnd = data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : undefined;

        const priceId = data.items?.[0]?.price?.id;
        const planId = priceId ? mapPriceToPlan(priceId) : 'basic';

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: status,
            currentPeriodEnd,
          });
        }
        break;
      }

      case 'subscription.canceled': {
        const customerId = data.customer_id;

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            planId: 'free',
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }

      case 'subscription.past_due': {
        const customerId = data.customer_id;
        const priceId = data.items?.[0]?.price?.id;
        const planId = priceId ? mapPriceToPlan(priceId) : 'basic';

        if (customerId) {
          await updateSellerSubscription({
            billingCustomerId: customerId,
            planId,
            subscriptionStatus: 'past_due',
          });
        }
        break;
      }

      case 'transaction.completed': {
        const customerId = data.customer_id;
        const subscriptionId = data.subscription_id;

        if (customerId && subscriptionId) {
          const priceId = data.items?.[0]?.price?.id;
          const planId = priceId ? mapPriceToPlan(priceId) : 'basic';

          await updateSellerSubscription({
            billingCustomerId: customerId,
            billingSubscriptionId: subscriptionId,
            planId,
            subscriptionStatus: 'active',
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
