"use strict";
/**
 * POTAL JavaScript/TypeScript SDK v1.1.0
 * https://www.potal.app/developers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotalClient = exports.PotalError = void 0;
// ─── Error ─────────────────────────────────────────
class PotalError extends Error {
    constructor(status, code, message) {
        super(message);
        this.name = 'PotalError';
        this.status = status;
        this.code = code;
    }
}
exports.PotalError = PotalError;
// ─── Client ────────────────────────────────────────
class PotalClient {
    constructor(config) {
        /** Remaining API calls in current window (from response headers) */
        this.rateLimitRemaining = null;
        /** When the rate limit window resets */
        this.rateLimitReset = null;
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl || 'https://www.potal.app/api/v1').replace(/\/$/, '');
        this.timeout = config.timeout || 30000;
        this.maxRetries = config.maxRetries || 2;
    }
    async request(method, path, body, params) {
        var _a;
        let url = `${this.baseUrl}${path}`;
        if (params) {
            const qs = Object.entries(params)
                .filter(([, v]) => v != null)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join('&');
            if (qs)
                url += `?${qs}`;
        }
        let lastError = null;
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
                if (remaining)
                    this.rateLimitRemaining = parseInt(remaining, 10) || null;
                const resetTs = res.headers.get('X-RateLimit-Reset');
                this.rateLimitReset = resetTs ? new Date(parseInt(resetTs, 10) * 1000) : null;
                // 429 Rate Limit — wait and retry
                if (res.status === 429) {
                    const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
                    await new Promise(r => setTimeout(r, retryAfter * 1000));
                    continue;
                }
                // Parse JSON safely
                let data;
                try {
                    data = await res.json();
                }
                catch (_b) {
                    const text = await res.text();
                    throw new PotalError(res.status, 'INVALID_JSON', `Invalid JSON response: ${text.slice(0, 200)}`);
                }
                if (!res.ok) {
                    const err = ((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : {});
                    throw new PotalError(res.status, String(err.code || 'UNKNOWN'), String(err.message || JSON.stringify(data)));
                }
                return data;
            }
            catch (e) {
                lastError = e instanceof Error ? e : new Error(String(e));
                // 4xx (except 429) — don't retry
                if (e instanceof PotalError && e.status >= 400 && e.status < 500)
                    throw e;
                if (attempt < this.maxRetries) {
                    await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
                }
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        throw lastError || new PotalError(500, 'RETRY_EXHAUSTED', 'Max retries exceeded');
    }
    // ─── Core Methods ──────────────────────────────
    async calculate(params) {
        return this.request('POST', '/calculate', params);
    }
    async classify(params) {
        return this.request('POST', '/classify', params);
    }
    async validateHs(hsCode, country) {
        return this.request('POST', '/validate', { hsCode, country });
    }
    async screen(params) {
        return this.request('POST', '/screening', params);
    }
    async getCountry(code) {
        return this.request('GET', `/countries/${code}`);
    }
    async exchangeRate(from, to, date) {
        return this.request('GET', '/exchange-rate/historical', undefined, { from, to, ...(date ? { date } : {}) });
    }
    async preShipmentCheck(params) {
        return this.request('POST', '/verify/pre-shipment', params);
    }
    // ─── Batch Methods ─────────────────────────────
    async classifyBatch(items) {
        return this.request('POST', '/classify/batch', { items });
    }
    async calculateBatch(items) {
        return this.request('POST', '/calculate/batch', { items });
    }
    // ─── Webhook Methods ───────────────────────────
    async listWebhooks() {
        return this.request('GET', '/webhooks');
    }
    async createWebhook(params) {
        return this.request('POST', '/webhooks', params);
    }
    async deleteWebhook(id) {
        await this.request('DELETE', `/webhooks/${id}`);
    }
}
exports.PotalClient = PotalClient;
exports.default = PotalClient;
