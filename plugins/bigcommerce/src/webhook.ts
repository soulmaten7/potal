/**
 * POTAL BigCommerce Webhook Handler
 * Handles orders/created and store/product/updated webhooks.
 * Includes HMAC-SHA256 signature verification.
 */

import crypto from 'crypto';

interface BigCommerceOrder {
  id: number;
  status: string;
  billing_address: { country_iso2: string };
  products: { url: string }[];
  subtotal_inc_tax: string;
  shipping_cost_inc_tax: string;
}

interface WebhookPayload {
  scope: string;
  store_id: string;
  data: { type: string; id: number };
  hash: string;
  created_at: number;
  producer: string;
}

const POTAL_API = 'https://www.potal.app/api/v1';

/**
 * Verify BigCommerce webhook signature.
 * BigCommerce sends HMAC-SHA256 in X-Webhook-Signature header.
 */
export function verifyBigCommerceSignature(
  rawBody: string,
  signature: string,
  clientSecret: string
): boolean {
  try {
    const computed = crypto
      .createHmac('sha256', clientSecret)
      .update(rawBody)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computed)
    );
  } catch {
    return false;
  }
}

/**
 * Route BigCommerce webhook events.
 */
export async function handleBigCommerceWebhook(
  payload: WebhookPayload,
  config: { potalApiKey: string; bigcommerceToken: string; storeHash: string; clientSecret: string },
  rawBody: string,
  signature: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Verify signature
  if (!verifyBigCommerceSignature(rawBody, signature, config.clientSecret)) {
    return { success: false, error: 'Invalid webhook signature' };
  }

  switch (payload.scope) {
    case 'store/order/created':
      return handleOrderCreated(payload, config);
    case 'store/product/updated':
      return { success: true, data: { event: 'product_updated', id: payload.data.id } };
    default:
      return { success: true, data: { event: payload.scope, note: 'Unhandled event type' } };
  }
}

export async function handleOrderCreated(
  payload: WebhookPayload,
  config: { potalApiKey: string; bigcommerceToken: string; storeHash: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const orderId = payload.data.id;

  // Fetch order details from BigCommerce
  const orderRes = await fetch(
    `https://api.bigcommerce.com/stores/${config.storeHash}/v2/orders/${orderId}`,
    {
      headers: {
        'X-Auth-Token': config.bigcommerceToken,
        'Accept': 'application/json',
      },
    }
  );
  if (!orderRes.ok) return { success: false, error: 'Failed to fetch order' };

  const order: BigCommerceOrder = await orderRes.json();
  const destination = order.billing_address?.country_iso2 || 'US';
  const subtotal = parseFloat(order.subtotal_inc_tax) || 0;
  const shipping = parseFloat(order.shipping_cost_inc_tax) || 0;

  // Calculate landed cost via POTAL
  const calcRes = await fetch(`${POTAL_API}/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.potalApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price: subtotal,
      shippingPrice: shipping,
      destinationCountry: destination,
    }),
  });

  if (!calcRes.ok) return { success: false, error: 'POTAL calculation failed' };
  const result = await calcRes.json();

  return {
    success: true,
    data: { order_id: orderId, destination, landed_cost: result.data },
  };
}
