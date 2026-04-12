/**
 * Playground — Scenario → Endpoint config.
 *
 * CW34: Defines the API chain for each scenario. Each endpoint lists its
 * path, method, parameter definitions, and example responses. The
 * playground UI reads this config to render the sidebar, params panel,
 * code snippets, and example response tabs.
 */

export interface ParamDef {
  key: string;
  label: string;
  type: 'string' | 'number';
  required: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface EndpointDef {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  params: ParamDef[];
  exampleResponse: unknown;
  errorResponse?: unknown;
}

// ─── Online Seller ─────────────────────────────────────

const SELLER_ENDPOINTS: EndpointDef[] = [
  {
    id: 'classify',
    name: 'Classify',
    description: 'Classify a product into its HS code using the product name.',
    method: 'POST',
    path: '/api/v1/classify',
    params: [
      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Handmade leather wallet', description: 'Product description in English' },
      { key: 'origin', label: 'Origin Country', type: 'string', required: false, placeholder: 'KR', description: 'ISO 3166-1 alpha-2 (e.g. KR, CN, US)' },
      { key: 'productCategory', label: 'Category', type: 'string', required: false, placeholder: 'leather-goods', description: 'Optional hint to improve accuracy' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '4202', description: 'If known, skips classification' },
    ],
    exampleResponse: {
      success: true,
      data: {
        hsCode: '4202210000',
        description: 'Handbags, whether or not with shoulder strap — outer surface of leather',
        confidence: 0.92,
        method: 'override',
        alternatives: [
          { hsCode: '420231', description: 'Articles carried in pocket — outer surface of leather', confidence: 0.65 },
        ],
      },
    },
  },
  {
    id: 'restrictions',
    name: 'Check Restrictions',
    description: 'Check if a product/country combination has import restrictions, HAZMAT flags, or carrier restrictions.',
    method: 'POST',
    path: '/api/v1/restrictions',
    params: [
      { key: 'hsCode', label: 'HS Code', type: 'string', required: true, placeholder: '4202210000', description: 'HS code from Classify step' },
      { key: 'destinationCountry', label: 'Destination', type: 'string', required: true, placeholder: 'US', description: 'Import country ISO code' },
    ],
    exampleResponse: {
      success: true,
      data: {
        hasRestrictions: false,
        isProhibited: false,
        isWatched: false,
        restrictions: [],
        restrictedCarriers: [],
        hsCode: '4202210000',
        destinationCountry: 'US',
      },
    },
  },
  {
    id: 'calculate',
    name: 'Calculate Landed Cost',
    description: 'Calculate the total landed cost including duties, taxes, fees, and shipping.',
    method: 'POST',
    path: '/api/v1/calculate',
    params: [
      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Handmade leather wallet', description: 'For auto HS classification' },
      { key: 'price', label: 'Price (USD)', type: 'number', required: true, placeholder: '45', description: 'Product price in USD' },
      { key: 'origin', label: 'Origin', type: 'string', required: false, placeholder: 'KR', description: 'Origin country (default: CN)', defaultValue: 'CN' },
      { key: 'destinationCountry', label: 'Destination', type: 'string', required: false, placeholder: 'US', description: 'Destination country (default: US)', defaultValue: 'US' },
      { key: 'shippingPrice', label: 'Shipping', type: 'number', required: false, placeholder: '0', description: 'Shipping cost (USD)' },
      { key: 'hsCode', label: 'HS Code', type: 'string', required: false, placeholder: '4202210000', description: 'Skip auto-classify' },
    ],
    exampleResponse: {
      success: true,
      data: {
        productPrice: 45,
        shippingCost: 0,
        importDuty: 0,
        salesTax: 3.15,
        totalLandedCost: 50.83,
        type: 'global',
        isDutyFree: true,
        originCountry: 'KR',
        destinationCountry: 'US',
        vat: 3.15,
        vatLabel: 'Sales Tax',
        ftaApplied: { hasFta: true, ftaName: 'Korea-US Free Trade Agreement' },
      },
    },
  },
];

// ─── Scenario map ──────────────────────────────────────

export const SCENARIO_ENDPOINTS: Record<string, EndpointDef[]> = {
  seller: SELLER_ENDPOINTS,
  d2c: SELLER_ENDPOINTS,       // same 3 endpoints, different defaults later
  importer: SELLER_ENDPOINTS,
  exporter: SELLER_ENDPOINTS,
  forwarder: SELLER_ENDPOINTS,
};

export const SCENARIO_META: Record<string, { icon: string; label: string; subtitle: string }> = {
  seller: { icon: '🛒', label: 'Online Seller', subtitle: 'Etsy, Shopify, eBay' },
  d2c: { icon: '🏭', label: 'D2C Brand', subtitle: 'Direct to consumer' },
  importer: { icon: '📦', label: 'Importer', subtitle: 'Bulk & container' },
  exporter: { icon: '🚢', label: 'Exporter', subtitle: 'Korea → World' },
  forwarder: { icon: '🌐', label: 'Forwarder / 3PL', subtitle: 'Multi-destination' },
};
