/**
 * Webhook Signature Verification — unified utilities for all inbound webhook sources.
 *
 * All functions use timing-safe comparison to prevent timing attacks.
 */

import crypto from 'crypto';

/**
 * Verify Paddle webhook signature.
 * Format: Paddle-Signature header = "ts=1234567890;h1=abc123..."
 * Includes timestamp freshness check (max 5 minutes).
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

    // Timestamp freshness — reject events older than 5 minutes
    const tsNum = parseInt(ts, 10);
    const MAX_AGE_SECONDS = 300;
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

/**
 * Verify Shopify webhook HMAC.
 * Header: X-Shopify-Hmac-SHA256 (base64-encoded HMAC-SHA256)
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

/**
 * Verify BigCommerce webhook signature.
 * Header: X-Webhook-Signature (base64-encoded HMAC-SHA256)
 */
export function verifyBigCommerceSignature(
  rawBody: string,
  signature: string,
  clientSecret: string,
): boolean {
  try {
    const computed = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}

/**
 * Verify POTAL outbound webhook signature.
 * Header: X-Webhook-Signature (hex-encoded HMAC-SHA256)
 */
export function verifyPotalSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}
