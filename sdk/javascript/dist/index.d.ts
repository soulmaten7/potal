/**
 * POTAL JavaScript/TypeScript SDK v1.1.0
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
export interface CreateWebhookParams {
    url: string;
    events: string[];
    secret?: string;
}
export interface CalculateResponse {
    totalLandedCost: number;
    importDuty: number;
    vat: number;
    mpf: number;
    insurance: number;
    currency: string;
    breakdown: Array<{
        label: string;
        amount: number;
        note?: string;
    }>;
    tariffOptimization?: {
        optimalRate: number;
        savingsVsMfn: number;
    };
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
    matches: Array<{
        name: string;
        score: number;
        source: string;
        riskLevel: string;
    }>;
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
export declare class PotalError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string);
}
export declare class PotalClient {
    private apiKey;
    private baseUrl;
    private timeout;
    private maxRetries;
    /** Remaining API calls in current window (from response headers) */
    rateLimitRemaining: number | null;
    /** When the rate limit window resets */
    rateLimitReset: Date | null;
    constructor(config: PotalConfig);
    private request;
    calculate(params: CalculateParams): Promise<CalculateResponse>;
    classify(params: ClassifyParams): Promise<ClassifyResponse>;
    validateHs(hsCode: string, country?: string): Promise<Record<string, unknown>>;
    screen(params: ScreeningParams): Promise<ScreeningResponse>;
    getCountry(code: string): Promise<Record<string, unknown>>;
    exchangeRate(from: string, to: string, date?: string): Promise<Record<string, unknown>>;
    preShipmentCheck(params: {
        hs_code: string;
        destination: string;
        origin?: string;
        declared_value?: number;
        shipper_name?: string;
    }): Promise<Record<string, unknown>>;
    classifyBatch(items: ClassifyParams[]): Promise<ClassifyResponse[]>;
    calculateBatch(items: CalculateParams[]): Promise<CalculateResponse[]>;
    listWebhooks(): Promise<Webhook[]>;
    createWebhook(params: CreateWebhookParams): Promise<Webhook>;
    deleteWebhook(id: string): Promise<void>;
}
export default PotalClient;
