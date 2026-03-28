/**
 * POTAL BigCommerce REST API Connector
 * Manages store connection, product sync, and script installation.
 *
 * Usage:
 *   const bc = new BigCommerceConnector({ storeHash, accessToken, potalApiKey });
 *   await bc.installWidget();
 *   await bc.syncProducts();
 */

interface BigCommerceConnectorConfig {
  storeHash: string;
  accessToken: string;
  potalApiKey: string;
  potalSellerId?: string;
  origin?: string;
}

interface BigCommerceProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  weight: number;
  categories: number[];
  is_visible: boolean;
  custom_fields?: { name: string; value: string }[];
}

interface ScriptResponse {
  data: { uuid: string; name: string; src?: string };
}

const BC_API_BASE = 'https://api.bigcommerce.com/stores';
const POTAL_WIDGET_URL = 'https://www.potal.app/widget/potal-widget.js';

export class BigCommerceConnector {
  private storeHash: string;
  private accessToken: string;
  private potalApiKey: string;
  private potalSellerId: string;
  private origin: string;

  constructor(config: BigCommerceConnectorConfig) {
    this.storeHash = config.storeHash;
    this.accessToken = config.accessToken;
    this.potalApiKey = config.potalApiKey;
    this.potalSellerId = config.potalSellerId || '';
    this.origin = config.origin || 'US';
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${BC_API_BASE}/${this.storeHash}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'X-Auth-Token': this.accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`BigCommerce API ${res.status}: ${text}`);
    }
    return res.json();
  }

  // ─── Widget Installation via Script Manager ──────────

  async installWidget(): Promise<{ success: boolean; scriptId?: string; error?: string }> {
    try {
      const script = {
        name: 'POTAL Landed Cost Widget',
        description: 'Displays estimated import duties and taxes on product pages',
        src: POTAL_WIDGET_URL,
        auto_uninstall: true,
        load_method: 'default',
        location: 'footer',
        visibility: 'all_pages',
        kind: 'src',
        consent_category: 'functional',
      };

      const res = await this.request<ScriptResponse>('POST', '/v3/content/scripts', script);
      return { success: true, scriptId: res.data.uuid };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Script install failed' };
    }
  }

  async uninstallWidget(scriptId: string): Promise<{ success: boolean }> {
    try {
      await this.request('DELETE', `/v3/content/scripts/${scriptId}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async listInstalledScripts(): Promise<{ scripts: { uuid: string; name: string; src?: string }[] }> {
    const res = await this.request<{ data: { uuid: string; name: string; src?: string }[] }>('GET', '/v3/content/scripts');
    return { scripts: res.data || [] };
  }

  // ─── Product Sync ────────────────────────────────────

  async getProducts(page = 1, limit = 50): Promise<{ products: BigCommerceProduct[]; totalPages: number }> {
    const res = await this.request<{ data: BigCommerceProduct[]; meta: { pagination: { total_pages: number } } }>(
      'GET',
      `/v3/catalog/products?page=${page}&limit=${limit}&include=custom_fields`
    );
    return {
      products: res.data || [],
      totalPages: res.meta?.pagination?.total_pages || 1,
    };
  }

  async getProduct(productId: number): Promise<BigCommerceProduct | null> {
    try {
      const res = await this.request<{ data: BigCommerceProduct }>('GET', `/v3/catalog/products/${productId}?include=custom_fields`);
      return res.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Sync product HS codes from POTAL classification to BigCommerce custom fields.
   * Stores hs_code and duty_rate as custom fields on each product.
   */
  async syncProductHsCode(productId: number, hsCode: string, dutyRate: number): Promise<{ success: boolean }> {
    try {
      const product = await this.getProduct(productId);
      if (!product) return { success: false };

      const existingFields = product.custom_fields || [];
      const hsField = existingFields.find(f => f.name === 'potal_hs_code');
      const dutyField = existingFields.find(f => f.name === 'potal_duty_rate');

      const updates: { name: string; value: string }[] = [];
      if (!hsField || hsField.value !== hsCode) updates.push({ name: 'potal_hs_code', value: hsCode });
      if (!dutyField || dutyField.value !== String(dutyRate)) updates.push({ name: 'potal_duty_rate', value: String(dutyRate) });

      if (updates.length > 0) {
        for (const field of updates) {
          await this.request('POST', `/v3/catalog/products/${productId}/custom-fields`, field);
        }
      }

      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Classify all products via POTAL API and store HS codes.
   */
  async classifyAndSyncAll(): Promise<{ total: number; synced: number; errors: number }> {
    let page = 1;
    let total = 0;
    let synced = 0;
    let errors = 0;

    while (true) {
      const { products, totalPages } = await this.getProducts(page, 50);
      if (products.length === 0) break;

      for (const product of products) {
        total++;
        try {
          const classRes = await fetch('https://www.potal.app/api/v1/classify', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.potalApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productName: product.name, origin: this.origin }),
          });

          if (classRes.ok) {
            const classData = await classRes.json();
            const hsCode = classData.data?.hsCode || classData.data?.hs_code || '';
            const dutyRate = classData.data?.dutyRate || 0;
            if (hsCode) {
              const syncResult = await this.syncProductHsCode(product.id, hsCode, dutyRate);
              if (syncResult.success) synced++;
              else errors++;
            }
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }

      if (page >= totalPages) break;
      page++;
    }

    return { total, synced, errors };
  }

  // ─── Webhook Registration ────────────────────────────

  async registerWebhooks(): Promise<{ created: string[]; errors: string[] }> {
    const webhookUrl = `https://www.potal.app/api/v1/webhooks/bigcommerce/${this.storeHash}`;
    const scopes = [
      'store/order/created',
      'store/order/updated',
      'store/product/created',
      'store/product/updated',
      'store/cart/converted',
    ];

    const created: string[] = [];
    const errs: string[] = [];

    for (const scope of scopes) {
      try {
        await this.request('POST', '/v3/hooks', {
          scope,
          destination: webhookUrl,
          is_active: true,
          headers: { 'X-POTAL-Store': this.storeHash },
        });
        created.push(scope);
      } catch (err) {
        errs.push(`${scope}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    return { created, errors: errs };
  }

  // ─── Store Info ──────────────────────────────────────

  async getStoreInfo(): Promise<Record<string, unknown> | null> {
    try {
      const res = await this.request<{ data: Record<string, unknown> }>('GET', '/v2/store');
      return res.data || res;
    } catch {
      return null;
    }
  }

  // ─── Channel & Site Info ─────────────────────────────

  async getChannels(): Promise<{ id: number; name: string; type: string }[]> {
    try {
      const res = await this.request<{ data: { id: number; name: string; type: string }[] }>('GET', '/v3/channels');
      return res.data || [];
    } catch {
      return [];
    }
  }
}

export type { BigCommerceConnectorConfig, BigCommerceProduct };
