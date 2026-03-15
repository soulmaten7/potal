/**
 * POTAL JavaScript/TypeScript SDK
 * https://www.potal.app/developers
 */

export interface PotalConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface CalculateParams {
  price: number;
  destinationCountry?: string;
  origin?: string;
  hsCode?: string;
  productName?: string;
  productCategory?: string;
  shippingPrice?: number;
  shippingTerms?: 'DDP' | 'DDU' | 'CIF' | 'FOB' | 'EXW';
  firmName?: string;
  weight_kg?: number;
  quantity?: number;
  buyer_vat_number?: string;
}

export interface ClassifyParams {
  product_name: string;
  product_category?: string;
  origin?: string;
  destination?: string;
  price?: number;
}

export interface ScreeningParams {
  name: string;
  country?: string;
  address?: string;
  lists?: string[];
  minScore?: number;
}

export class PotalError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'PotalError';
    this.status = status;
    this.code = code;
  }
}

export class PotalClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: PotalConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://www.potal.app/api/v1').replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  private async request<T = Record<string, unknown>>(method: string, path: string, body?: Record<string, unknown>, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      if (qs) url += `?${qs}`;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'potal-js/1.0.0',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });

        const data = await res.json();
        if (!res.ok) {
          const err = data?.error || {};
          throw new PotalError(res.status, err.code || 'UNKNOWN', err.message || JSON.stringify(data));
        }
        return data as T;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (e instanceof PotalError && e.status < 500) throw e;
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }
    throw lastError || new PotalError(500, 'RETRY_EXHAUSTED', 'Max retries exceeded');
  }

  async calculate(params: CalculateParams) {
    return this.request('POST', '/calculate', params as unknown as Record<string, unknown>);
  }

  async classify(params: ClassifyParams) {
    return this.request('POST', '/classify', params as unknown as Record<string, unknown>);
  }

  async validateHs(hsCode: string, country?: string) {
    return this.request('POST', '/validate', { hsCode, country });
  }

  async screen(params: ScreeningParams) {
    return this.request('POST', '/screening', params as unknown as Record<string, unknown>);
  }

  async getCountry(code: string) {
    return this.request('GET', `/countries/${code}`);
  }

  async exchangeRate(from: string, to: string, date?: string) {
    return this.request('GET', '/exchange-rate/historical', undefined, { from, to, ...(date ? { date } : {}) });
  }

  async preShipmentCheck(params: { hs_code: string; destination: string; origin?: string; declared_value?: number; shipper_name?: string }) {
    return this.request('POST', '/verify/pre-shipment', params as unknown as Record<string, unknown>);
  }

  async batchExport(items: Record<string, unknown>[], format: 'csv' | 'json' = 'json') {
    return this.request('POST', '/export', { items, format });
  }
}

export default PotalClient;
