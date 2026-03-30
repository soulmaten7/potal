/**
 * POTAL JavaScript/TypeScript SDK v1.1.0
 * https://www.potal.app/developers
 */

// ─── Types ─────────────────────────────────────────

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

export interface CreateWebhookParams {
  url: string;
  events: string[];
  secret?: string;
}

// ─── Response Types ────────────────────────────────

export interface CalculateResponse {
  totalLandedCost: number;
  importDuty: number;
  vat: number;
  mpf: number;
  insurance: number;
  currency: string;
  breakdown: Array<{ label: string; amount: number; note?: string }>;
  tariffOptimization?: { optimalRate: number; savingsVsMfn: number };
}

export interface ClassifyResponse {
  hsCode: string;
  confidence: number;
  description: string;
  method: string;
  section?: number;
  chapter?: number;
}

export interface ScreeningResponse {
  matches: Array<{ name: string; score: number; source: string; riskLevel: string }>;
  riskLevel: string;
  screened: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

// ─── Error ─────────────────────────────────────────

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

// ─── Client ────────────────────────────────────────

export class PotalClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  /** Remaining API calls in current window (from response headers) */
  public rateLimitRemaining: number | null = null;
  /** When the rate limit window resets */
  public rateLimitReset: Date | null = null;

  constructor(config: PotalConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://www.potal.app/api/v1').replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  private async request<T = Record<string, unknown>>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'potal-js/1.1.0',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        // Track rate limit headers
        const remaining = res.headers.get('X-RateLimit-Remaining');
        if (remaining) this.rateLimitRemaining = parseInt(remaining, 10) || null;
        const resetTs = res.headers.get('X-RateLimit-Reset');
        this.rateLimitReset = resetTs ? new Date(parseInt(resetTs, 10) * 1000) : null;

        // 429 Rate Limit — wait and retry
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }

        // Parse JSON safely
        let data: Record<string, unknown>;
        try {
          data = await res.json() as Record<string, unknown>;
        } catch {
          const text = await res.text();
          throw new PotalError(res.status, 'INVALID_JSON', `Invalid JSON response: ${text.slice(0, 200)}`);
        }

        if (!res.ok) {
          const err = (data?.error ?? {}) as Record<string, unknown>;
          throw new PotalError(
            res.status,
            String(err.code || 'UNKNOWN'),
            String(err.message || JSON.stringify(data)),
          );
        }

        return data as T;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        // 4xx (except 429) — don't retry
        if (e instanceof PotalError && e.status >= 400 && e.status < 500) throw e;
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
    throw lastError || new PotalError(500, 'RETRY_EXHAUSTED', 'Max retries exceeded');
  }

  // ─── Core Methods ──────────────────────────────

  async calculate(params: CalculateParams): Promise<CalculateResponse> {
    return this.request<CalculateResponse>('POST', '/calculate', params as unknown as Record<string, unknown>);
  }

  async classify(params: ClassifyParams): Promise<ClassifyResponse> {
    return this.request<ClassifyResponse>('POST', '/classify', params as unknown as Record<string, unknown>);
  }

  async validateHs(hsCode: string, country?: string): Promise<Record<string, unknown>> {
    return this.request('POST', '/validate', { hsCode, country });
  }

  async screen(params: ScreeningParams): Promise<ScreeningResponse> {
    return this.request<ScreeningResponse>('POST', '/screening', params as unknown as Record<string, unknown>);
  }

  async getCountry(code: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/countries/${code}`);
  }

  async exchangeRate(from: string, to: string, date?: string): Promise<Record<string, unknown>> {
    return this.request('GET', '/exchange-rate/historical', undefined, { from, to, ...(date ? { date } : {}) });
  }

  async preShipmentCheck(params: {
    hs_code: string;
    destination: string;
    origin?: string;
    declared_value?: number;
    shipper_name?: string;
  }): Promise<Record<string, unknown>> {
    return this.request('POST', '/verify/pre-shipment', params as unknown as Record<string, unknown>);
  }

  // ─── Batch Methods ─────────────────────────────

  async classifyBatch(items: ClassifyParams[]): Promise<ClassifyResponse[]> {
    return this.request<ClassifyResponse[]>('POST', '/classify/batch', { items } as unknown as Record<string, unknown>);
  }

  async calculateBatch(items: CalculateParams[]): Promise<CalculateResponse[]> {
    return this.request<CalculateResponse[]>('POST', '/calculate/batch', { items } as unknown as Record<string, unknown>);
  }

  // ─── Webhook Methods ───────────────────────────

  async listWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>('GET', '/webhooks');
  }

  async createWebhook(params: CreateWebhookParams): Promise<Webhook> {
    return this.request<Webhook>('POST', '/webhooks', params as unknown as Record<string, unknown>);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }
}

export default PotalClient;
