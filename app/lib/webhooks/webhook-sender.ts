/**
 * POTAL Outbound Webhook Sender
 *
 * Sends webhook events to seller-registered URLs with:
 * - HMAC-SHA256 signature (X-Webhook-Signature header)
 * - Exponential backoff retry (max 5 attempts: 1s, 2s, 4s, 8s, 16s)
 * - Delivery tracking via webhook_deliveries table
 *
 * Supported events:
 *   calculation.completed, classification.completed,
 *   subscription.updated, usage.threshold
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const MAX_RETRY_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const SEND_TIMEOUT_MS = 10000;

export const SUPPORTED_EVENTS = [
  'calculation.completed',
  'classification.completed',
  'subscription.updated',
  'usage.threshold',
] as const;

export type WebhookEventType = typeof SUPPORTED_EVENTS[number];

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  created_at: string;
  data: Record<string, unknown>;
  seller_id: string;
}

interface WebhookRegistration {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Generate HMAC-SHA256 signature for webhook payload.
 */
export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify an incoming webhook signature.
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const computed = signPayload(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}

/**
 * Record a delivery attempt in webhook_deliveries (health_check_logs fallback).
 */
async function recordDelivery(params: {
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string;
  attemptNumber: number;
  status: 'success' | 'failed' | 'retrying';
  errorMessage?: string;
  durationMs: number;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('health_check_logs').insert({
      check_type: `webhook_delivery_${params.webhookId}`,
      status: params.status === 'success' ? 'healthy' : 'degraded',
      response_time_ms: params.durationMs,
      details: `attempt:${params.attemptNumber} status:${params.responseStatus || 'timeout'} event:${params.eventType}`,
      metadata: {
        webhook_id: params.webhookId,
        event_type: params.eventType,
        response_status: params.responseStatus,
        response_body: params.responseBody.substring(0, 500),
        attempt_number: params.attemptNumber,
        delivery_status: params.status,
        error: params.errorMessage || null,
      },
    });
  } catch {
    // Fire-and-forget
  }
}

/**
 * Send a single webhook request with timeout.
 */
async function sendRequest(
  url: string,
  payloadStr: string,
  signature: string,
): Promise<{ status: number; body: string; durationMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'User-Agent': 'POTAL-Webhook/1.0',
      },
      body: payloadStr,
      signal: controller.signal,
    });

    const body = await response.text().catch(() => '');
    return { status: response.status, body, durationMs: Date.now() - start };
  } catch (err) {
    return {
      status: 0,
      body: err instanceof Error ? err.message : 'Request failed',
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send webhook event to a single registration with retry logic.
 */
async function deliverToWebhook(
  registration: WebhookRegistration,
  payload: WebhookPayload,
): Promise<{ success: boolean; attempts: number; lastStatus: number | null }> {
  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payloadStr, registration.secret);

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    const result = await sendRequest(registration.url, payloadStr, signature);
    const isSuccess = result.status >= 200 && result.status < 300;
    const isClientError = result.status >= 400 && result.status < 500;

    await recordDelivery({
      webhookId: registration.id,
      eventType: payload.type,
      payload: payload.data,
      responseStatus: result.status || null,
      responseBody: result.body,
      attemptNumber: attempt,
      status: isSuccess ? 'success' : (attempt === MAX_RETRY_ATTEMPTS || isClientError) ? 'failed' : 'retrying',
      errorMessage: isSuccess ? undefined : `HTTP ${result.status}: ${result.body.substring(0, 200)}`,
      durationMs: result.durationMs,
    });

    if (isSuccess) {
      return { success: true, attempts: attempt, lastStatus: result.status };
    }

    // Don't retry on 4xx (client error — problem is with the request, not transient)
    if (isClientError) {
      return { success: false, attempts: attempt, lastStatus: result.status };
    }

    // Exponential backoff before next retry (except on last attempt)
    if (attempt < MAX_RETRY_ATTEMPTS) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  return { success: false, attempts: MAX_RETRY_ATTEMPTS, lastStatus: null };
}

/**
 * Send a webhook event to all matching registrations for a seller.
 * Looks up registered webhooks, filters by event type, sends to each.
 *
 * @returns Number of successful deliveries
 */
export async function sendWebhookEvent(
  sellerId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  const supabase = getSupabase();
  if (!supabase) return { sent: 0, failed: 0 };

  // Look up seller's active webhooks that subscribe to this event
  const { data: webhooks, error } = await supabase
    .from('seller_webhooks')
    .select('id, url, secret, events, active')
    .eq('seller_id', sellerId)
    .eq('active', true);

  if (error || !webhooks || webhooks.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Filter by event type
  const matching = webhooks.filter((w: WebhookRegistration) =>
    w.events.includes(eventType) || w.events.includes('*')
  );

  if (matching.length === 0) return { sent: 0, failed: 0 };

  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    type: eventType,
    created_at: new Date().toISOString(),
    data,
    seller_id: sellerId,
  };

  // Send to all matching webhooks
  const results = await Promise.allSettled(
    matching.map((w: WebhookRegistration) => deliverToWebhook(w, payload))
  );

  let sent = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.success) sent++;
    else failed++;
  }

  return { sent, failed };
}
