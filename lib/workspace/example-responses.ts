/**
 * Pre-populated example responses for each workspace endpoint.
 * Source: public/openapi.json examples — extracted for client-side rendering.
 * Used by EndpointPanel to show examples before the user runs an API call.
 *
 * CW38 — 8 endpoints × 2-3 success cases + 1 error case each = 26 examples total.
 */

export interface ExampleResponse {
  name: string;
  summary: string;
  status: 200 | 400;
  value: Record<string, unknown>;
}

export const EXAMPLE_RESPONSES: Record<string, ExampleResponse[]> = {
  classify: [
    {
      name: 'Success',
      summary: 'Cotton T-Shirt classified successfully',
      status: 200,
      value: {
        success: true,
        data: {
          hsCode: '610910',
          description: 'T-shirts, singlets and other vests, knitted or crocheted, of cotton',
          confidence: 0.94,
          method: 'v3-pipeline',
          alternatives: [
            { hsCode: '611020', description: 'Pullovers of cotton', confidence: 0.42 },
          ],
          ruling_reference: 'HQ 953567',
        },
        _metadata: {
          disclaimer: 'For informational use only. Verify with official customs authority.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'LowConfidence',
      summary: 'Ambiguous product — low confidence classification',
      status: 200,
      value: {
        success: true,
        data: {
          hsCode: '392690',
          description: 'Other articles of plastics',
          confidence: 0.38,
          method: 'keyword_fallback',
          alternatives: [
            { hsCode: '481840', description: 'Sanitary articles of paper', confidence: 0.31 },
            { hsCode: '630790', description: 'Other made-up articles', confidence: 0.22 },
          ],
        },
        _metadata: {
          disclaimer: 'Low confidence result. Provide material/category/description for better accuracy.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'ValidationError',
      summary: 'productName field is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'productName is required', field: 'productName' },
      },
    },
  ],

  calculate: [
    {
      name: 'Success',
      summary: 'CN→US cotton T-shirt $50 (duty applied)',
      status: 200,
      value: {
        success: true,
        data: {
          totalLandedCost: 82.15,
          importDuty: 8.25,
          vat: 5.40,
          shippingCost: 8.50,
          dutyRateSource: 'precomputed_mfn',
          dutyInfo: { rate: 0.165, amount: 8.25, source: 'HTSUS 2026' },
          exchangeRateInfo: { currency: 'USD', source: 'direct' },
          deMinimisInfo: { applied: false, threshold: 800, reason: 'Value exceeds US $800 de minimis' },
          ftaSavings: { applicable: false, ftas: [] },
        },
        _metadata: {
          disclaimer: 'For informational use only. Actual duties may vary based on classification and valuation.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'DeMinimisApplied',
      summary: 'Low value shipment under de minimis threshold',
      status: 200,
      value: {
        success: true,
        data: {
          totalLandedCost: 58.49,
          importDuty: 0,
          vat: 5.00,
          shippingCost: 3.49,
          dutyInfo: { rate: 0, amount: 0, source: 'De minimis' },
          deMinimisInfo: { applied: true, threshold: 150, reason: 'EUR 150 EU de minimis (applies to duties, not VAT)' },
          ftaSavings: { applicable: false },
        },
        _metadata: { disclaimer: 'For informational use only.', apiVersion: 'v1' },
      },
    },
    {
      name: 'FtaSavings',
      summary: 'KR→US with KORUS FTA (duty-free)',
      status: 200,
      value: {
        success: true,
        data: {
          totalLandedCost: 58.50,
          importDuty: 0,
          vat: 0,
          shippingCost: 8.50,
          dutyRateSource: 'live_db',
          dutyInfo: { rate: 0, amount: 0, source: 'KORUS FTA (eligible)' },
          ftaSavings: { applicable: true, appliedFta: 'KORUS', savings: 8.25, originalDutyRate: 0.165 },
        },
        _metadata: {
          disclaimer: 'FTA eligibility requires valid Certificate of Origin.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'ValidationError',
      summary: 'price field is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'price is required and must be a positive number', field: 'price' },
      },
    },
  ],

  'apply-fta': [
    {
      name: 'Eligible',
      summary: 'MX→US USMCA eligible (RVC 70%)',
      status: 200,
      value: {
        success: true,
        data: {
          verdict: 'eligible',
          eligible: true,
          criteriaMetList: ['RVC', 'CTH'],
          requiredRvc: 60,
          rvcPercentage: 70,
          originatingContentPct: 70,
          applicableFTAs: [{ fta_id: 'USMCA', eligible: true, duty_saving_pct: 16.5 }],
          recommended: { fta_id: 'USMCA', criterion: 'RVC', note: 'Qualifies under regional value content rule' },
        },
        _metadata: {
          disclaimer: 'Non-binding advisory. Valid Certificate of Origin required for actual FTA benefit.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'Ineligible',
      summary: 'Low RVC — does not meet threshold',
      status: 200,
      value: {
        success: true,
        data: {
          verdict: 'ineligible',
          eligible: false,
          criteriaMetList: [],
          requiredRvc: 60,
          rvcPercentage: 35,
          applicableFTAs: [{ fta_id: 'USMCA', eligible: false, reason: 'RVC 35% below required 60%' }],
        },
        _metadata: { disclaimer: 'Non-binding advisory.', apiVersion: 'v1' },
      },
    },
    {
      name: 'Indeterminate',
      summary: 'Insufficient data to determine eligibility',
      status: 200,
      value: {
        success: true,
        data: {
          verdict: 'indeterminate',
          eligible: null,
          criteriaMetList: [],
          applicableFTAs: [],
          dataAvailability: { jurisdiction: 'JP', rulingsAvailable: false, warning: 'No ruling precedents for this HS code' },
        },
        _metadata: {
          disclaimer: 'Indeterminate result — provide originating_content_pct or consult customs authority.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'ValidationError',
      summary: 'hs_code, origin, and destination required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'hs_code, origin, and destination are required' },
      },
    },
  ],

  'check-restrictions': [
    {
      name: 'Restricted',
      summary: 'Lithium-ion battery HAZMAT — restricted',
      status: 200,
      value: {
        success: true,
        data: {
          restricted: true,
          hasRestrictions: true,
          isProhibited: false,
          restrictions: [{
            type: 'HAZMAT',
            severity: 'warning',
            summary: 'Lithium Batteries: IATA DGR Class 9 UN3480/UN3481. Air transport requires packaging per IATA DGR.',
            permitRequired: true,
            authority: 'IATA / DOT',
          }],
          categories: ['HAZMAT', 'dangerous_goods'],
        },
        _metadata: {
          disclaimer: 'For informational use only. Verify current HAZMAT regulations with shipping carrier.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'Clear',
      summary: 'Cotton T-shirt — no restrictions',
      status: 200,
      value: {
        success: true,
        data: {
          restricted: false,
          hasRestrictions: false,
          isProhibited: false,
          restrictions: [],
          categories: [],
        },
        _metadata: {
          disclaimer: 'No active import restrictions detected for HS 610910 → US.',
          apiVersion: 'v1',
        },
      },
    },
    {
      name: 'Prohibited',
      summary: 'Prohibited item (e.g. narcotics)',
      status: 200,
      value: {
        success: true,
        data: {
          restricted: true,
          hasRestrictions: true,
          isProhibited: true,
          restrictions: [{
            type: 'PROHIBITED',
            severity: 'critical',
            summary: 'Import of this item is prohibited under destination country law.',
            authority: 'CBP (U.S. Customs and Border Protection)',
          }],
          categories: ['prohibited'],
        },
        _metadata: { disclaimer: 'Consult customs authority before shipping.', apiVersion: 'v1' },
      },
    },
    {
      name: 'ValidationError',
      summary: 'destinationCountry is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'destinationCountry is required (ISO-2 code)', field: 'destinationCountry' },
      },
    },
  ],

  compare: [
    {
      name: 'Success',
      summary: 'Compare US / DE / JP for cotton T-shirt $50',
      status: 200,
      value: {
        success: true,
        data: {
          comparison: [
            { country: 'US', currency: 'USD', totalLandedCost: 82.15, importDuty: 8.25, vat: 5.40, vatRate: 0.085, deMinimisThreshold: 800 },
            { country: 'DE', currency: 'EUR', totalLandedCost: 76.30, importDuty: 6.00, vat: 11.57, vatRate: 0.19, deMinimisThreshold: 150 },
            { country: 'JP', currency: 'JPY', totalLandedCost: 8920, importDuty: 540, vat: 880, vatRate: 0.10, deMinimisThreshold: 10000 },
          ],
        },
        _metadata: { disclaimer: 'For informational use only.', apiVersion: 'v1' },
      },
    },
    {
      name: 'ValidationError',
      summary: 'At least 2 countries required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'countries array must contain 2-10 ISO-2 country codes', field: 'countries' },
      },
    },
  ],

  'generate-document': [
    {
      name: 'CommercialInvoice',
      summary: 'Commercial invoice generated',
      status: 200,
      value: {
        success: true,
        data: {
          document: {
            type: 'commercial_invoice',
            shipper: { name: 'Acme Corp', country: 'KR' },
            consignee: { name: 'Global Trade Ltd', country: 'US' },
            items: [{ hsCode: '610910', description: 'Cotton T-shirt', quantity: 100, unitValue: 5.00, totalValue: 500.00 }],
            totals: { invoiceValue: 500.00, currency: 'USD', incoterms: 'DDP' },
          },
        },
        _metadata: { disclaimer: 'Document is for reference. Buyer must verify with their customs broker.', apiVersion: 'v1' },
      },
    },
    {
      name: 'CertificateOfOrigin',
      summary: 'Certificate of Origin generated (KORUS FTA)',
      status: 200,
      value: {
        success: true,
        data: {
          document: {
            type: 'certificate_of_origin',
            fta: 'KORUS',
            exporter: { name: 'Acme Corp', country: 'KR' },
            importer: { name: 'Global Trade Ltd', country: 'US' },
            items: [{ hsCode: '610910', description: 'Cotton T-shirt', origin_criterion: 'RVC', rvc_pct: 72 }],
          },
        },
        _metadata: { disclaimer: 'Certificate must be signed by authorized exporter before use.', apiVersion: 'v1' },
      },
    },
    {
      name: 'ValidationError',
      summary: 'documentType is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'documentType is required (one of: commercial_invoice, packing_list, certificate_of_origin, customs_declaration)', field: 'documentType' },
      },
    },
  ],

  'screen-parties': [
    {
      name: 'Match',
      summary: 'Huawei Technologies found on BIS Entity List',
      status: 200,
      value: {
        success: true,
        data: {
          matches: [{
            name: 'Huawei Technologies Co., Ltd.',
            matchScore: 0.95,
            type: 'company',
            source: 'BIS Entity List',
            country: 'CN',
            restrictions: 'License required (presumption of denial)',
            programs: ['China-related'],
          }],
          totalMatches: 1,
        },
        sourceCoverage: { OFAC_SDN: 18718, BIS_Entity: 2585, UK_Sanctions: 19761, UN_Sanctions: 1002, EU_Sanctions: 5860 },
        disclaimer: 'For informational use only. Verify match with the list owner before acting.',
      },
    },
    {
      name: 'NoMatch',
      summary: 'Common name — no sanctions match',
      status: 200,
      value: {
        success: true,
        data: { matches: [], totalMatches: 0 },
        sourceCoverage: { OFAC_SDN: 18718, BIS_Entity: 2585, UK_Sanctions: 19761, UN_Sanctions: 1002, EU_Sanctions: 5860 },
        disclaimer: 'No match above threshold 0.8.',
      },
    },
    {
      name: 'ValidationError',
      summary: 'name is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name is required', field: 'name' },
      },
    },
  ],

  'eccn-lookup': [
    {
      name: 'Success',
      summary: "Keyword 'encryption' — ECCN 5A002 matches",
      status: 200,
      value: {
        success: true,
        data: {
          matches: [{
            eccn: '5A002.a',
            description: 'Information security commodities designed or modified to use cryptographic techniques.',
            category: 'Cat 5 Part 2 — Information Security',
            controlReason: ['NS', 'AT', 'EI'],
            licenseRequired: { CN: true, RU: true, KR: false, JP: false },
            exceptions: ['ENC', 'TSU'],
          }],
          totalMatches: 1,
          totalEccnEntries: 658,
        },
        disclaimer: 'For informational use only. Final ECCN determination requires BIS CCATS or attorney review.',
      },
    },
    {
      name: 'NoMatch',
      summary: 'Keyword with no ECCN match (likely EAR99)',
      status: 200,
      value: {
        success: true,
        data: {
          matches: [],
          totalMatches: 0,
          totalEccnEntries: 658,
          suggestion: 'No specific ECCN match. Item may be EAR99 (subject to EAR but not on CCL).',
        },
        disclaimer: 'EAR99 classification requires self-determination. Consult BIS for binding ruling.',
      },
    },
    {
      name: 'ValidationError',
      summary: 'keyword is required',
      status: 400,
      value: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'keyword is required', field: 'keyword' },
      },
    },
  ],
};
