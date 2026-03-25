/**
 * F138: 3PL Connector — Common interface for third-party logistics providers.
 *
 * Supported: ShipBob, Deliverr, Flexport, Amazon FBA, ShipMonk
 * Interface-only — actual API calls to be implemented per provider.
 */

// ─── Types ──────────────────────────────────────────

export type TplProvider = 'shipbob' | 'deliverr' | 'flexport' | 'amazon_fba' | 'shipmonk';

export interface TplCredentials {
  provider: TplProvider;
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  region?: string;
}

export interface TplInventoryItem {
  sku: string;
  productName: string;
  quantity: number;
  reserved: number;
  available: number;
  warehouseId: string;
  warehouseName: string;
  lastUpdated: string;
}

export interface TplShipmentRequest {
  orderId: string;
  recipientName: string;
  recipientAddress: string;
  recipientCountry: string;
  items: { sku: string; quantity: number }[];
  shippingMethod?: string;
}

export interface TplShipmentResult {
  shipmentId: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  status: 'created' | 'processing' | 'shipped' | 'delivered' | 'error';
  error?: string;
}

export interface TplTrackingStatus {
  shipmentId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  lastUpdate: string;
  events: { timestamp: string; description: string; location?: string }[];
}

// ─── Provider Config ─────────────────────────────────

interface ProviderConfig {
  name: string;
  baseUrl: string;
  authHeader: string;
  features: string[];
}

export const TPL_PROVIDERS: Record<TplProvider, ProviderConfig> = {
  shipbob: {
    name: 'ShipBob',
    baseUrl: 'https://api.shipbob.com/1.0',
    authHeader: 'Authorization',
    features: ['inventory', 'fulfillment', 'tracking', 'returns'],
  },
  deliverr: {
    name: 'Deliverr (Flexport)',
    baseUrl: 'https://api.deliverr.com/v1',
    authHeader: 'x-api-key',
    features: ['inventory', 'fulfillment', 'tracking'],
  },
  flexport: {
    name: 'Flexport',
    baseUrl: 'https://api.flexport.com/v2',
    authHeader: 'Authorization',
    features: ['inventory', 'fulfillment', 'tracking', 'customs'],
  },
  amazon_fba: {
    name: 'Amazon FBA (SP-API)',
    baseUrl: 'https://sellingpartnerapi-na.amazon.com',
    authHeader: 'x-amz-access-token',
    features: ['inventory', 'fulfillment', 'tracking'],
  },
  shipmonk: {
    name: 'ShipMonk',
    baseUrl: 'https://api.shipmonk.com/v2',
    authHeader: 'Authorization',
    features: ['inventory', 'fulfillment', 'tracking', 'returns'],
  },
};

// ─── Connector Interface ─────────────────────────────

/**
 * Get inventory levels from a 3PL provider.
 * Returns per-SKU stock levels across warehouses.
 */
export async function getInventory(
  credentials: TplCredentials,
  sku?: string,
): Promise<{ items: TplInventoryItem[]; provider: string; error?: string }> {
  const config = TPL_PROVIDERS[credentials.provider];
  if (!config) return { items: [], provider: credentials.provider, error: `Unknown provider: ${credentials.provider}` };
  if (!credentials.apiKey) return { items: [], provider: config.name, error: 'API key required.' };

  try {
    const url = `${config.baseUrl}/inventory${sku ? `?sku=${encodeURIComponent(sku)}` : ''}`;
    const response = await fetch(url, {
      headers: { [config.authHeader]: `Bearer ${credentials.apiKey}`, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { items: [], provider: config.name, error: `API returned ${response.status}` };
    }

    // Each provider has different response format — normalize
    const data = await response.json();
    const items: TplInventoryItem[] = Array.isArray(data.inventory || data.items || data)
      ? (data.inventory || data.items || data).map((item: Record<string, unknown>) => ({
          sku: String(item.sku || item.seller_sku || ''),
          productName: String(item.name || item.product_name || ''),
          quantity: Number(item.quantity || item.total || 0),
          reserved: Number(item.reserved || item.pending || 0),
          available: Number(item.available || item.fulfillable_quantity || 0),
          warehouseId: String(item.warehouse_id || item.location_id || ''),
          warehouseName: String(item.warehouse_name || item.location_name || ''),
          lastUpdated: String(item.updated_at || item.last_updated || new Date().toISOString()),
        }))
      : [];

    return { items, provider: config.name };
  } catch (err) {
    return { items: [], provider: config.name, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

/**
 * Create a fulfillment shipment via 3PL provider.
 */
export async function createShipment(
  credentials: TplCredentials,
  request: TplShipmentRequest,
): Promise<TplShipmentResult> {
  const config = TPL_PROVIDERS[credentials.provider];
  if (!config) return { shipmentId: '', status: 'error', error: `Unknown provider: ${credentials.provider}` };
  if (!credentials.apiKey) return { shipmentId: '', status: 'error', error: 'API key required.' };

  try {
    const response = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        [config.authHeader]: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { shipmentId: '', status: 'error', error: `API returned ${response.status}` };
    }

    const data = await response.json();
    return {
      shipmentId: String(data.id || data.shipment_id || data.order_id || ''),
      trackingNumber: data.tracking_number || data.tracking?.number,
      carrier: data.carrier || data.shipping_provider,
      estimatedDelivery: data.estimated_delivery || data.estimated_delivery_date,
      status: 'created',
    };
  } catch (err) {
    return { shipmentId: '', status: 'error', error: err instanceof Error ? err.message : 'Shipment creation failed' };
  }
}

/**
 * Get tracking status for a shipment.
 */
export async function getTrackingStatus(
  credentials: TplCredentials,
  shipmentId: string,
): Promise<TplTrackingStatus | { error: string }> {
  const config = TPL_PROVIDERS[credentials.provider];
  if (!config) return { error: `Unknown provider: ${credentials.provider}` };
  if (!credentials.apiKey) return { error: 'API key required.' };

  try {
    const response = await fetch(`${config.baseUrl}/shipments/${shipmentId}/tracking`, {
      headers: { [config.authHeader]: `Bearer ${credentials.apiKey}`, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return { error: `API returned ${response.status}` };

    const data = await response.json();
    return {
      shipmentId,
      trackingNumber: data.tracking_number || '',
      carrier: data.carrier || '',
      status: data.status || 'unknown',
      lastUpdate: data.updated_at || new Date().toISOString(),
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Tracking query failed' };
  }
}
