/**
 * Webhook Signature Verification — unified utilities for all providers.
 *
 * Security features:
 * - HMAC-SHA256 with timing-safe comparison (all providers)
 * - Timestamp freshness check (replay attack prevention, 5min max)
 * - Dual-secret support for POTAL (24h rotation grace period)
 */

import crypto from 'crypto';

/** Maximum age of a webhook event in seconds before rejection (replay prevention) */
const MAX_AGE_SECONDS = 300; // 5 minutes

// ─── Paddle ──────────────────────────────────────────

/**
 * Verify Paddle webhook signature.
 * Format: Paddle-Signature header = "ts=1234567890;h1=abc123..."
 * Includes timestamp freshness check.
 */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
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

    const tsNum = parseInt(ts, 10);
    if (isNaN(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > MAX_AGE_SECONDS) {
      return false;
    }

    const payload = `${ts}:${rawBody}`;
    const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(computed));
  } catch {
    return false;
  }
}

// ─── Shopify ─────────────────────────────────────────

/**
 * Verify Shopify webhook HMAC.
 * Header: X-Shopify-Hmac-SHA256 (base64-encoded HMAC-SHA256)
 * Shopify doesn't provide a timestamp header — replay protection is via
 * idempotency (X-Shopify-Webhook-Id) checked in the handler.
 */
export function verifyShopifyHmac(
  rawBody: string,
  hmac: string,
  secret: string,
): boolean {
  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
  } catch {
    return false;
  }
}

// ─── BigCommerce ─────────────────────────────────────

/**
 * Verify BigCommerce webhook signature + timestamp freshness.
 * Header: X-Webhook-Signature (base64-encoded HMAC-SHA256)
 * Timestamp: payload.created_at (Unix seconds)
 */
export function verifyBigCommerceSignature(
  rawBody: string,
  signature: string,
  clientSecret: string,
  createdAt?: number,
): boolean {
  try {
    // Timestamp freshness check (if provided)
    if (createdAt !== undefined && createdAt > 0) {
      if (Math.abs(Date.now() / 1000 - createdAt) > MAX_AGE_SECONDS) {
        return false;
      }
    }

    const computed = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}

// ─── POTAL Outbound ──────────────────────────────────

/**
 * Verify POTAL outbound webhook signature with dual-secret support.
 * Headers:
 *   X-Webhook-Signature: hex-encoded HMAC-SHA256
 *   X-Webhook-Timestamp: ISO 8601 timestamp
 *
 * Dual-secret: during rotation grace period, accepts either current or previous secret.
 */
export function verifyPotalSignature(
  rawBody: string,
  signature: string,
  secret: string,
  previousSecret?: string | null,
  timestamp?: string,
): boolean {
  try {
    // Timestamp freshness check
    if (timestamp) {
      const ts = new Date(timestamp).getTime();
      if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_AGE_SECONDS * 1000) {
        return false;
      }
    }

    // Try current secret first
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed))) {
      return true;
    }

    // Try previous secret (rotation grace period)
    if (previousSecret) {
      const prevComputed = crypto.createHmac('sha256', previousSecret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(prevComputed));
    }

    return false;
  } catch {
    return false;
  }
}
