/**
 * Playground — Scenario → Endpoint config.
 *
 * CW34: Each scenario has its own unique endpoint chain based on actual
 * API route files. Every param/response is verified against the real
 * route.ts — no guesswork.
 */

import { COUNTRY_OPTIONS, CATEGORY_OPTIONS, CURRENCY_OPTIONS } from './dropdown-options';

export interface ParamDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'select';
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
}

// ─── Online Seller (3) ────────────────────────────────

const SELLER_ENDPOINTS: EndpointDef[] = [
  {
    id: 'classify',
    name: 'Classify',
    description: 'Classify a product into its HS code using the product name.',
    method: 'POST',
    path: '/api/v1/classify',
    params: [
      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Handmade leather wallet', description: 'Product description in English' },
      { key: 'origin', label: 'Origin Country', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'Optional hint to improve accuracy' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '4202', description: 'If known, skips classification' },
    ],
    exampleResponse: {
      success: true,
      data: {
        hsCode: '4202210000',
        description: 'Handbags — outer surface of leather',
        confidence: 0.92,
        method: 'override',
        alternatives: [{ hsCode: '420231', confidence: 0.65 }],
      },
    },
  },
  {
    id: 'restrictions',
    name: 'Check Restrictions',
    description: 'Check import restrictions, HAZMAT flags, or carrier restrictions for a product/country combination.',
    method: 'POST',
    path: '/api/v1/restrictions',
    params: [
      { key: 'hsCode', label: 'HS Code', type: 'string', required: true, placeholder: '4202210000', description: 'HS code from Classify step' },
      { key: 'destinationCountry', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Import country' },
    ],
    exampleResponse: {
      success: true,
      data: { hasRestrictions: false, isProhibited: false, isWatched: false, restrictions: [], restrictedCarriers: [], hsCode: '4202210000', destinationCountry: 'US' },
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
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '45', description: 'Product price in declared currency' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Origin country', defaultValue: 'CN' },
      { key: 'destinationCountry', label: 'Destination', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Destination country', defaultValue: 'US' },
      { key: 'shippingPrice', label: 'Shipping Cost (USD)', type: 'number', required: false, placeholder: '0', description: 'Estimated shipping cost' },
      { key: 'hsCode', label: 'HS Code', type: 'string', required: false, placeholder: '4202210000', description: 'Skip auto-classify' },
      { key: 'currency', label: 'Currency', type: 'select', required: false, options: CURRENCY_OPTIONS, defaultValue: 'USD', description: 'Currency for declared value' },
    ],
    exampleResponse: {
      success: true,
      data: { productPrice: 45, shippingCost: 0, importDuty: 0, salesTax: 3.15, totalLandedCost: 50.83, isDutyFree: true, originCountry: 'KR', destinationCountry: 'US', ftaApplied: { hasFta: true, ftaName: 'Korea-US Free Trade Agreement' } },
    },
  },
];

// ─── D2C Brand (3) ────────────────────────────────────

const D2C_ENDPOINTS: EndpointDef[] = [
  {
    id: 'compare',
    name: 'Compare Countries',
    description: 'Compare landed costs across multiple destination countries to find your best market.',
    method: 'POST',
    path: '/api/v1/calculate/compare',
    params: [
      { key: 'value', label: 'Product Value (USD)', type: 'number', required: true, placeholder: '28', description: 'Product value, must be > 0' },
      { key: 'routes', label: 'Routes (JSON)', type: 'string', required: true, placeholder: '[{"shipping":5},{"shipping":8},{"shipping":12}]', description: 'Array of 1-5 route objects with shipping cost' },
    ],
    exampleResponse: {
      success: true,
      data: { routes: [{ totalLandedCost: 37.5, duty: 0, vat: 5.32 }, { totalLandedCost: 42.1, duty: 3.36, vat: 4.8 }], cheapest_route_index: 0, savings_vs_most_expensive: 4.6 },
    },
  },
  {
    id: 'fta-eligibility',
    name: 'FTA Eligibility',
    description: 'Check if your product qualifies for preferential FTA duty rates between two countries.',
    method: 'POST',
    path: '/api/v1/fta/eligibility',
    params: [
      { key: 'hs_code', label: 'HS Code', type: 'string', required: true, placeholder: '610910', description: '4+ digit HS code' },
      { key: 'origin', label: 'Origin', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Exporting country' },
      { key: 'destination', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Importing country' },
      { key: 'product_value', label: 'Product Value', type: 'number', required: false, placeholder: '28', description: 'For RVC (regional value content) calculation' },
      { key: 'local_content_percentage', label: 'Local Content %', type: 'number', required: false, placeholder: '60', description: '0-100, for RVC check' },
    ],
    exampleResponse: {
      success: true,
      data: { hs_code: '610910', origin: 'KR', destination: 'DE', fta_id: 'EU-KR', eligible: true, best_criteria: 'CTH', mfn_duty_estimate: 0.12, fta_duty_estimate: 0, savings_if_eligible: 3.36 },
    },
  },
  {
    id: 'ddp-vs-ddu',
    name: 'DDP vs DDU',
    description: 'Compare DDP (Delivered Duty Paid) vs DDU (Delivered Duty Unpaid) pricing for a shipment.',
    method: 'POST',
    path: '/api/v1/calculate/ddp-vs-ddu',
    params: [
      { key: 'value', label: 'Product Value (USD)', type: 'number', required: true, placeholder: '28', description: 'Product value' },
      { key: 'origin', label: 'Origin', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Origin country' },
      { key: 'destination', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Destination country' },
      { key: 'weight_kg', label: 'Weight (kg)', type: 'number', required: false, placeholder: '0.5', description: 'Weight for shipping estimate' },
      { key: 'mode', label: 'Mode', type: 'string', required: false, placeholder: 'compare', description: '"DDP", "DDU", "DAP", or "compare"', defaultValue: 'compare' },
    ],
    exampleResponse: {
      success: true,
      data: { incoterms: { ddp: { sellerPays: ['duty', 'vat', 'shipping'], riskTransfer: 'at buyer door' }, ddu: { buyerPays: ['duty', 'vat'], riskTransfer: 'at destination port' } } },
    },
  },
];

// ─── Importer (4) ─────────────────────────────────────

const IMPORTER_ENDPOINTS: EndpointDef[] = [
  {
    id: 'classify-precise',
    name: 'Classify (Precise)',
    description: 'Classify industrial/bulk products with category and material hints for maximum accuracy.',
    method: 'POST',
    path: '/api/v1/classify',
    params: [
      { key: 'productName', label: 'Product Name', type: 'string', required: true, placeholder: 'Industrial centrifugal water pump', description: 'Be specific — include material, function, use case' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Manufacturing country', defaultValue: 'DE' },
      { key: 'productCategory', label: 'Category', type: 'select', required: false, options: CATEGORY_OPTIONS, description: 'WCO-aligned category hint', defaultValue: 'machinery-pumps' },
      { key: 'hsCode', label: 'HS Code Hint', type: 'string', required: false, placeholder: '8413', description: 'If you know the heading, engine skips classification' },
      { key: 'material', label: 'Material', type: 'string', required: false, placeholder: 'stainless steel', description: 'Primary material for subheading accuracy' },
    ],
    exampleResponse: {
      success: true,
      data: { hsCode: '841370', description: 'Centrifugal pumps, not fitted with a measuring device', confidence: 0.88, method: 'keyword' },
    },
  },
  {
    id: 'restrictions',
    name: 'Check Restrictions',
    description: 'Check import restrictions and required documents for your HS code and destination.',
    method: 'POST',
    path: '/api/v1/restrictions',
    params: [
      { key: 'hsCode', label: 'HS Code', type: 'string', required: true, placeholder: '841370', description: 'HS code from Classify step' },
      { key: 'destinationCountry', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Import country', defaultValue: 'KR' },
    ],
    exampleResponse: {
      success: true,
      data: { hasRestrictions: false, isProhibited: false, isWatched: false, restrictions: [], restrictedCarriers: [], hsCode: '841370', destinationCountry: 'KR' },
    },
  },
  {
    id: 'fta-lookup',
    name: 'Lookup FTA',
    description: 'Look up applicable Free Trade Agreements between origin and destination countries.',
    method: 'GET',
    path: '/api/v1/fta',
    params: [
      { key: 'origin', label: 'Origin', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Exporting country' },
      { key: 'destination', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Importing country' },
      { key: 'hs_code', label: 'HS Code', type: 'string', required: false, placeholder: '8413', description: 'For chapter exclusion check' },
    ],
    exampleResponse: {
      success: true,
      data: { origin: 'DE', destination: 'KR', fta: { applicable: true, name: 'EU-Korea Free Trade Agreement', code: 'EU-KR', preferentialMultiplier: 0 } },
    },
  },
  {
    id: 'breakdown',
    name: 'Cost Breakdown',
    description: 'Get a detailed 15-item cost breakdown for an import shipment.',
    method: 'POST',
    path: '/api/v1/calculate/breakdown',
    params: [
      { key: 'value', label: 'Shipment Value (USD)', type: 'number', required: true, placeholder: '85000', description: 'Total product value' },
      { key: 'shipping', label: 'Shipping Cost', type: 'number', required: false, placeholder: '3200', description: 'Freight cost (USD)' },
      { key: 'insurance', label: 'Insurance', type: 'number', required: false, placeholder: '850', description: 'Insurance cost (USD)' },
      { key: 'selling_price', label: 'Selling Price', type: 'number', required: false, placeholder: '120000', description: 'For margin calculation' },
    ],
    exampleResponse: {
      success: true,
      data: { totalLandedCost: 104600, breakdown: { product_price: 85000, import_duty: 6800, vat_gst: 9180, freight_estimate: 3200, insurance_estimate: 850 } },
    },
  },
];

// ─── Exporter (4) ─────────────────────────────────────

const EXPORTER_ENDPOINTS: EndpointDef[] = [
  {
    id: 'calculate',
    name: 'Calculate Landed Cost',
    description: 'Show your buyer exactly what they will pay at their door — full transparency.',
    method: 'POST',
    path: '/api/v1/calculate',
    params: [
      { key: 'productName', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'For auto HS classification' },
      { key: 'price', label: 'Price', type: 'number', required: true, placeholder: '250000', description: 'Shipment value in declared currency' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Your country', defaultValue: 'KR' },
      { key: 'destinationCountry', label: 'Destination', type: 'select', required: false, options: COUNTRY_OPTIONS, description: "Buyer's country", defaultValue: 'US' },
      { key: 'hsCode', label: 'HS Code', type: 'string', required: false, placeholder: '850760', description: 'If known' },
      { key: 'currency', label: 'Currency', type: 'select', required: false, options: CURRENCY_OPTIONS, defaultValue: 'USD', description: 'Currency for declared value' },
    ],
    exampleResponse: {
      success: true,
      data: { productPrice: 250000, importDuty: 0, salesTax: 17500, totalLandedCost: 269634, isDutyFree: true, ftaApplied: { hasFta: true, ftaName: 'Korea-US Free Trade Agreement' } },
    },
  },
  {
    id: 'screening',
    name: 'Denied Party Screening',
    description: 'Screen your buyer against OFAC SDN, BIS Entity List, EU/UK/UN sanctions — 47,926 entries.',
    method: 'POST',
    path: '/api/v1/screening',
    params: [
      { key: 'name', label: 'Party Name', type: 'string', required: true, placeholder: 'Acme Electronics Inc', description: 'Name to screen against sanctions lists' },
      { key: 'country', label: 'Country', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'Weights same-country matches higher' },
      { key: 'minScore', label: 'Min Match Score', type: 'number', required: false, placeholder: '0.8', description: '0.5-1.0 (default 0.8)' },
    ],
    exampleResponse: {
      success: true,
      data: { hasMatches: false, status: 'clear', totalMatches: 0, matches: [], screenedAt: '2026-04-12T10:00:00Z', listsChecked: ['OFAC_SDN', 'BIS_ENTITY', 'EU_SANCTIONS', 'UK_SANCTIONS', 'UN_SANCTIONS'] },
    },
  },
  {
    id: 'export-controls',
    name: 'Export Controls',
    description: 'Classify a product for ECCN export control and check if an export license is needed.',
    method: 'POST',
    path: '/api/v1/export-controls/classify',
    params: [
      { key: 'product_name', label: 'Product Name', type: 'string', required: false, placeholder: 'Lithium-ion battery cells', description: 'Product name or HS code required' },
      { key: 'hs_code', label: 'HS Code', type: 'string', required: false, placeholder: '850760', description: 'HS code for ECCN mapping' },
      { key: 'destination', label: 'Destination', type: 'select', required: false, options: COUNTRY_OPTIONS, description: 'For license determination' },
      { key: 'end_use', label: 'End Use', type: 'string', required: false, placeholder: 'consumer electronics', description: 'End-use context' },
    ],
    exampleResponse: {
      success: true,
      data: { eccn_classification: { eccn: 'EAR99', description: 'No ECCN — subject to EAR but no specific control', license_required: false }, license_determination: null },
    },
  },
  {
    id: 'invoice',
    name: 'Generate Invoice',
    description: 'Generate a commercial invoice in JSON or UBL 2.1 XML format for customs clearance.',
    method: 'POST',
    path: '/api/v1/invoice/generate',
    params: [
      { key: 'format', label: 'Format', type: 'string', required: false, placeholder: 'json', description: '"json", "ubl", or "xml"', defaultValue: 'json' },
      { key: 'invoice_data', label: 'Invoice Data (JSON)', type: 'string', required: true, placeholder: '{"seller":{"name":"POTAL KR"},"buyer":{"name":"Acme US"},"items":[{"description":"Li-ion cells","quantity":1000,"unit_price":250}]}', description: 'Full invoice object with seller, buyer, items[]' },
    ],
    exampleResponse: {
      success: true,
      data: { invoice_id: 'INV-2026-001', issue_date: '2026-04-12', currency: 'USD', totals: { line_total: 250000, tax_total: 0, payable: 250000 } },
    },
  },
];

// ─── Forwarder / 3PL (4) ──────────────────────────────

const FORWARDER_ENDPOINTS: EndpointDef[] = [
  {
    id: 'batch-classify',
    name: 'Batch Classify',
    description: 'Classify multiple products at once — up to 500 items per request.',
    method: 'POST',
    path: '/api/v1/classify/batch',
    params: [
      { key: 'items', label: 'Items (JSON)', type: 'string', required: true, placeholder: '[{"id":"1","productName":"Cotton T-shirt"},{"id":"2","productName":"Leather wallet"}]', description: 'Array of {id, productName, material?, category?}' },
    ],
    exampleResponse: {
      success: true,
      data: { results: [{ id: '1', hsCode: '610910', confidence: 0.95 }, { id: '2', hsCode: '420211', confidence: 0.92 }], summary: { total: 2, classified: 2, failed: 0, avgConfidence: 0.935 } },
    },
  },
  {
    id: 'batch-calculate',
    name: 'Batch Calculate',
    description: 'Calculate landed costs for multiple shipments at once — up to 500 items.',
    method: 'POST',
    path: '/api/v1/calculate/batch',
    params: [
      { key: 'items', label: 'Items (JSON)', type: 'string', required: true, placeholder: '[{"id":"1","price":45,"origin":"KR","destinationCountry":"US"},{"id":"2","price":28,"origin":"KR","destinationCountry":"DE"}]', description: 'Array of {id, price, origin?, destinationCountry?, hsCode?, productName?}' },
      { key: 'defaults', label: 'Defaults (JSON)', type: 'string', required: false, placeholder: '{"origin":"KR","destinationCountry":"US"}', description: 'Default values applied to all items' },
    ],
    exampleResponse: {
      success: true,
      data: { results: [{ id: '1', result: { totalLandedCost: 50.83 } }, { id: '2', result: { totalLandedCost: 33.6 } }], summary: { total: 2, success: 2, failed: 0 } },
    },
  },
  {
    id: 'shipping-estimate',
    name: 'Shipping Estimate',
    description: 'Estimate shipping costs by weight, dimensions, and mode (express/standard/economy).',
    method: 'POST',
    path: '/api/v1/shipping/estimate',
    params: [
      { key: 'origin', label: 'Origin', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Origin country' },
      { key: 'destination', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Destination country' },
      { key: 'weight_kg', label: 'Weight (kg)', type: 'number', required: true, placeholder: '5', description: 'Package weight' },
      { key: 'length_cm', label: 'Length (cm)', type: 'number', required: false, placeholder: '30' },
      { key: 'width_cm', label: 'Width (cm)', type: 'number', required: false, placeholder: '20' },
      { key: 'height_cm', label: 'Height (cm)', type: 'number', required: false, placeholder: '15' },
      { key: 'mode', label: 'Mode', type: 'string', required: false, placeholder: 'express', description: '"express", "standard", or "economy"' },
    ],
    exampleResponse: {
      success: true,
      data: { estimates: [{ tier: 'express', costMin: 45, costMax: 65 }, { tier: 'standard', costMin: 25, costMax: 35 }, { tier: 'economy', costMin: 12, costMax: 20 }] },
    },
  },
  {
    id: 'pre-shipment',
    name: 'Pre-shipment Verify',
    description: 'Run a full pre-shipment checklist — HS validation, restrictions, screening, documents, risk score.',
    method: 'POST',
    path: '/api/v1/verify/pre-shipment',
    params: [
      { key: 'hs_code', label: 'HS Code', type: 'string', required: true, placeholder: '610910', description: '4+ digit HS code' },
      { key: 'destination', label: 'Destination', type: 'select', required: true, options: COUNTRY_OPTIONS, description: 'Import country' },
      { key: 'origin', label: 'Origin', type: 'select', required: false, options: COUNTRY_OPTIONS },
      { key: 'declared_value', label: 'Declared Value', type: 'number', required: false, placeholder: '12000', description: 'For de minimis check' },
      { key: 'shipper_name', label: 'Shipper Name', type: 'string', required: false, placeholder: 'POTAL Korea Inc', description: 'For denied party screening' },
    ],
    exampleResponse: {
      success: true,
      data: { checklist: [{ item: 'HS Code Validation', status: 'PASS' }, { item: 'Import Restrictions', status: 'PASS' }, { item: 'Denied Party Screening', status: 'PASS' }], risk_score: 5, risk_level: 'LOW', shipment_allowed: true },
    },
  },
];

// ─── Scenario map ──────────────────────────────────────

export const SCENARIO_ENDPOINTS: Record<string, EndpointDef[]> = {
  seller: SELLER_ENDPOINTS,
  d2c: D2C_ENDPOINTS,
  importer: IMPORTER_ENDPOINTS,
  exporter: EXPORTER_ENDPOINTS,
  forwarder: FORWARDER_ENDPOINTS,
  custom: SELLER_ENDPOINTS, // fallback — custom builder later
};

export const SCENARIO_META: Record<string, { icon: string; label: string; subtitle: string }> = {
  seller: { icon: '🛒', label: 'Online Seller', subtitle: 'Etsy, Shopify, eBay' },
  d2c: { icon: '🌐', label: 'D2C Brand', subtitle: 'Direct to consumer' },
  importer: { icon: '📦', label: 'Importer', subtitle: 'B2B container loads' },
  exporter: { icon: '✈️', label: 'Exporter', subtitle: 'Quotes & contracts' },
  forwarder: { icon: '🚚', label: 'Forwarder / 3PL', subtitle: 'Multi-destination batch' },
  custom: { icon: '⚙️', label: 'CUSTOM', subtitle: 'Build your own combo' },
};
