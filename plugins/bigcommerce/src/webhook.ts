/**
 * POTAL BigCommerce Webhook Handler
 * Handles orders/created webhook to calculate landed costs
 */

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

export async function handleOrderCreated(
  payload: WebhookPayload,
  config: { potalApiKey: string; bigcommerceToken: string; storeHash: string }
) {
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
  if (!orderRes.ok) return { error: 'Failed to fetch order' };

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

  if (!calcRes.ok) return { error: 'POTAL calculation failed' };
  const result = await calcRes.json();

  return {
    order_id: orderId,
    destination,
    landed_cost: result.data,
  };
}
