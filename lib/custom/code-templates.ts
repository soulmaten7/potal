/**
 * Code Templates for CUSTOM Builder — CW25 Sprint 3
 *
 * Per-feature API call templates in 4 languages.
 * Used by LiveCodeAssembler to compose a multi-step workflow
 * when the user checks features in the CUSTOM builder.
 *
 * Template variables use {PLACEHOLDER} syntax that the assembler
 * replaces with actual values or sensible defaults.
 */

export type Language = 'curl' | 'python' | 'node' | 'go';

export interface FeatureTemplate {
  featureId: string;
  slug: string;
  name: string;
  category: string;
  apiEndpoint: string | null;
  /** Short description of what this API call does */
  stepDescription: string;
  /** Code templates per language. null if feature has no API (UI-only). */
  code: Record<Language, string> | null;
}

// For features that don't have a direct API endpoint (UI-only features like
// "Landing Page", "Blog", "Cookie Consent"), we set code to null.
// The LiveCodeAssembler will skip these in the generated code but still show
// them as checked in the feature list.

export const FEATURE_TEMPLATES: FeatureTemplate[] = [
  // ─── Core Engine (15) ──────────────────────────────────

  {
    featureId: 'F001',
    slug: 'hs-code-classification',
    name: 'HS Code Classification',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Classify a product into an HS code',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}"}'`,
      python: `result = potal.classify(
    product_description="{PRODUCT}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}"
)`,
      node: `const result = await potal.classify({
  productDescription: "{PRODUCT}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ProductDescription: "{PRODUCT}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
})`,
    },
  },

  {
    featureId: 'F002',
    slug: 'duty-rate-calculation',
    name: 'Duty Rate Calculation',
    category: 'Core',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Look up duty rates for an HS code and country pair',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "value": {VALUE}}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    value={VALUE}
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
})`,
    },
  },

  {
    featureId: 'F003',
    slug: 'tax-calculation-vat-gst',
    name: 'Tax Calculation (VAT/GST)',
    category: 'Core',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Calculate VAT/GST for an import',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "destination_country": "{DESTINATION}", "value": {VALUE}, "include_tax": true}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    destination_country="{DESTINATION}",
    value={VALUE},
    include_tax=True
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
  includeTax: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
  IncludeTax:         true,
})`,
    },
  },

  {
    featureId: 'F004',
    slug: 'total-landed-cost',
    name: 'Total Landed Cost',
    category: 'Core',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Get the full landed cost including duties, taxes, and fees',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "value": {VALUE}, "shipping_cost": {SHIPPING}}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    value={VALUE},
    shipping_cost={SHIPPING}
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
  shippingCost: {SHIPPING},
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
  ShippingCost:       {SHIPPING},
})`,
    },
  },

  {
    featureId: 'F006',
    slug: 'confidence-score',
    name: 'Confidence Score',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Get multi-dimensional confidence scores for a classification',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "include_confidence": true}'`,
      python: `result = potal.classify(
    product_description="{PRODUCT}",
    include_confidence=True
)`,
      node: `const result = await potal.classify({
  productDescription: "{PRODUCT}",
  includeConfidence: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ProductDescription: "{PRODUCT}",
  IncludeConfidence:  true,
})`,
    },
  },

  {
    featureId: 'F007',
    slug: 'multi-country-support',
    name: 'Multi-country Support',
    category: 'Core',
    apiEndpoint: '/api/v1/countries',
    stepDescription: 'List supported countries and their tax rules',
    code: {
      curl: `curl -s https://api.potal.app/v1/countries \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.countries.list()`,
      node: `const result = await potal.countries.list();`,
      go: `result, err := client.Countries.List()`,
    },
  },

  {
    featureId: 'F008',
    slug: 'audit-trail',
    name: 'Audit Trail',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Retrieve classification history with decision paths',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "include_audit_trail": true}'`,
      python: `result = potal.classify(
    product_description="{PRODUCT}",
    include_audit_trail=True
)`,
      node: `const result = await potal.classify({
  productDescription: "{PRODUCT}",
  includeAuditTrail: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ProductDescription: "{PRODUCT}",
  IncludeAuditTrail:  true,
})`,
    },
  },

  {
    featureId: 'F009',
    slug: 'batch-classification',
    name: 'Batch Classification',
    category: 'Core',
    apiEndpoint: '/api/v1/classify/batch',
    stepDescription: 'Classify multiple products in a single batch request',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify/batch \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"items": [{"product_description": "{PRODUCT_1}"}, {"product_description": "{PRODUCT_2}"}]}'`,
      python: `result = potal.classify.batch(
    items=[
        {"product_description": "{PRODUCT_1}"},
        {"product_description": "{PRODUCT_2}"},
    ]
)`,
      node: `const result = await potal.classify.batch({
  items: [
    { productDescription: "{PRODUCT_1}" },
    { productDescription: "{PRODUCT_2}" },
  ],
});`,
      go: `result, err := client.Classify.Batch(&potal.BatchClassifyRequest{
  Items: []potal.ClassifyItem{
    {ProductDescription: "{PRODUCT_1}"},
    {ProductDescription: "{PRODUCT_2}"},
  },
})`,
    },
  },

  {
    featureId: 'F010',
    slug: 'image-classification',
    name: 'Image Classification',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Classify a product from a photo using AI vision',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_url": "{IMAGE_URL}", "destination_country": "{DESTINATION}"}'`,
      python: `result = potal.classify(
    image_url="{IMAGE_URL}",
    destination_country="{DESTINATION}"
)`,
      node: `const result = await potal.classify({
  imageUrl: "{IMAGE_URL}",
  destinationCountry: "{DESTINATION}",
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ImageURL:           "{IMAGE_URL}",
  DestinationCountry: "{DESTINATION}",
})`,
    },
  },

  {
    featureId: 'F011',
    slug: 'currency-conversion',
    name: 'Currency Conversion',
    category: 'Core',
    apiEndpoint: '/api/v1/exchange-rate',
    stepDescription: 'Convert between currencies using real-time rates',
    code: {
      curl: `curl -s "https://api.potal.app/v1/exchange-rate?from={FROM_CURRENCY}&to={TO_CURRENCY}&amount={AMOUNT}" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.exchange_rate(
    from_currency="{FROM_CURRENCY}",
    to_currency="{TO_CURRENCY}",
    amount={AMOUNT}
)`,
      node: `const result = await potal.exchangeRate({
  fromCurrency: "{FROM_CURRENCY}",
  toCurrency: "{TO_CURRENCY}",
  amount: {AMOUNT},
});`,
      go: `result, err := client.ExchangeRate(&potal.ExchangeRateRequest{
  FromCurrency: "{FROM_CURRENCY}",
  ToCurrency:   "{TO_CURRENCY}",
  Amount:       {AMOUNT},
})`,
    },
  },

  {
    featureId: 'F012',
    slug: 'hs-code-validation',
    name: 'HS Code Validation',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Validate an HS code format and check if it exists',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "validate_only": true}'`,
      python: `result = potal.classify(
    hs_code="{HS_CODE}",
    validate_only=True
)`,
      node: `const result = await potal.classify({
  hsCode: "{HS_CODE}",
  validateOnly: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  HsCode:       "{HS_CODE}",
  ValidateOnly: true,
})`,
    },
  },

  {
    featureId: 'F013',
    slug: 'de-minimis-check',
    name: 'De Minimis Check',
    category: 'Core',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Check if a shipment falls below the duty-free threshold',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_country": "{DESTINATION}", "value": {VALUE}, "check_de_minimis": true}'`,
      python: `result = potal.calculate(
    destination_country="{DESTINATION}",
    value={VALUE},
    check_de_minimis=True
)`,
      node: `const result = await potal.calculate({
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
  checkDeMinimis: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
  CheckDeMinimis:     true,
})`,
    },
  },

  {
    featureId: 'F014',
    slug: 'restricted-items',
    name: 'Restricted Items',
    category: 'Core',
    apiEndpoint: '/api/v1/restrictions',
    stepDescription: 'Screen a product against import restrictions',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/restrictions \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "destination_country": "{DESTINATION}"}'`,
      python: `result = potal.restrictions.check(
    hs_code="{HS_CODE}",
    destination_country="{DESTINATION}"
)`,
      node: `const result = await potal.restrictions.check({
  hsCode: "{HS_CODE}",
  destinationCountry: "{DESTINATION}",
});`,
      go: `result, err := client.Restrictions.Check(&potal.RestrictionsRequest{
  HsCode:             "{HS_CODE}",
  DestinationCountry: "{DESTINATION}",
})`,
    },
  },

  {
    featureId: 'F015',
    slug: 'price-break-rules',
    name: 'Price Break Rules',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Apply price-break duty rules from tariff schedules',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "value": {VALUE}, "apply_price_breaks": true}'`,
      python: `result = potal.classify(
    hs_code="{HS_CODE}",
    value={VALUE},
    apply_price_breaks=True
)`,
      node: `const result = await potal.classify({
  hsCode: "{HS_CODE}",
  value: {VALUE},
  applyPriceBreaks: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  HsCode:          "{HS_CODE}",
  Value:           {VALUE},
  ApplyPriceBreaks: true,
})`,
    },
  },

  {
    featureId: 'F016',
    slug: 'origin-detection',
    name: 'Origin Detection',
    category: 'Core',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Detect country of origin from product description',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "detect_origin": true}'`,
      python: `result = potal.classify(
    product_description="{PRODUCT}",
    detect_origin=True
)`,
      node: `const result = await potal.classify({
  productDescription: "{PRODUCT}",
  detectOrigin: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ProductDescription: "{PRODUCT}",
  DetectOrigin:       true,
})`,
    },
  },

  // ─── Trade Compliance (21) ─────────────────────────────

  {
    featureId: 'F017',
    slug: 'fta-detection',
    name: 'FTA Detection',
    category: 'Trade',
    apiEndpoint: '/api/v1/fta',
    stepDescription: 'Identify applicable Free Trade Agreements',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/fta \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "hs_code": "{HS_CODE}"}'`,
      python: `result = potal.fta.detect(
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    hs_code="{HS_CODE}"
)`,
      node: `const result = await potal.fta.detect({
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  hsCode: "{HS_CODE}",
});`,
      go: `result, err := client.FTA.Detect(&potal.FTARequest{
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  HsCode:             "{HS_CODE}",
})`,
    },
  },

  {
    featureId: 'F018',
    slug: 'rules-of-origin',
    name: 'Rules of Origin',
    category: 'Trade',
    apiEndpoint: '/api/v1/fta',
    stepDescription: 'Verify preferential origin eligibility',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/fta \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "hs_code": "{HS_CODE}", "include_roo": true}'`,
      python: `result = potal.fta.rules_of_origin(
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    hs_code="{HS_CODE}"
)`,
      node: `const result = await potal.fta.rulesOfOrigin({
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  hsCode: "{HS_CODE}",
});`,
      go: `result, err := client.FTA.RulesOfOrigin(&potal.FTARequest{
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  HsCode:             "{HS_CODE}",
})`,
    },
  },

  {
    featureId: 'F019',
    slug: 'preferential-rates',
    name: 'Preferential Rates',
    category: 'Trade',
    apiEndpoint: '/api/v1/fta',
    stepDescription: 'Get reduced FTA duty rates when origin rules are met',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/fta \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "hs_code": "{HS_CODE}", "include_preferential_rates": true}'`,
      python: `result = potal.fta.preferential_rates(
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    hs_code="{HS_CODE}"
)`,
      node: `const result = await potal.fta.preferentialRates({
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  hsCode: "{HS_CODE}",
});`,
      go: `result, err := client.FTA.PreferentialRates(&potal.FTARequest{
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  HsCode:             "{HS_CODE}",
})`,
    },
  },

  {
    featureId: 'F020',
    slug: 'anti-dumping-duties',
    name: 'Anti-dumping Duties',
    category: 'Trade',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Check for anti-dumping duty exposure',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "include_trade_remedies": true}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    include_trade_remedies=True
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  includeTradeRemedies: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:               "{HS_CODE}",
  OriginCountry:        "{ORIGIN}",
  DestinationCountry:   "{DESTINATION}",
  IncludeTradeRemedies: true,
})`,
    },
  },

  {
    featureId: 'F021',
    slug: 'countervailing-duties',
    name: 'Countervailing Duties',
    category: 'Trade',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Identify countervailing (subsidy) duty risks',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "include_cvd": true}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    include_cvd=True
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  includeCvd: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  IncludeCVD:         true,
})`,
    },
  },

  {
    featureId: 'F022',
    slug: 'safeguard-measures',
    name: 'Safeguard Measures',
    category: 'Trade',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Apply safeguard tariffs and exemptions',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "include_safeguards": true}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    include_safeguards=True
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  includeSafeguards: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  IncludeSafeguards:  true,
})`,
    },
  },

  {
    featureId: 'F023',
    slug: 'sanctions-screening',
    name: 'Sanctions Screening',
    category: 'Trade',
    apiEndpoint: '/api/v1/screening',
    stepDescription: 'Screen against OFAC SDN, BIS Entity List, and global sources',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/screening \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"entity_name": "{ENTITY_NAME}", "country": "{COUNTRY}"}'`,
      python: `result = potal.screening.check(
    entity_name="{ENTITY_NAME}",
    country="{COUNTRY}"
)`,
      node: `const result = await potal.screening.check({
  entityName: "{ENTITY_NAME}",
  country: "{COUNTRY}",
});`,
      go: `result, err := client.Screening.Check(&potal.ScreeningRequest{
  EntityName: "{ENTITY_NAME}",
  Country:    "{COUNTRY}",
})`,
    },
  },

  {
    featureId: 'F024',
    slug: 'denied-party-screening',
    name: 'Denied Party Screening',
    category: 'Trade',
    apiEndpoint: '/api/v1/screening',
    stepDescription: 'Check against 21K+ denied party entries with fuzzy matching',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/screening \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"entity_name": "{ENTITY_NAME}", "type": "denied_party", "fuzzy_match": true}'`,
      python: `result = potal.screening.check(
    entity_name="{ENTITY_NAME}",
    type="denied_party",
    fuzzy_match=True
)`,
      node: `const result = await potal.screening.check({
  entityName: "{ENTITY_NAME}",
  type: "denied_party",
  fuzzyMatch: true,
});`,
      go: `result, err := client.Screening.Check(&potal.ScreeningRequest{
  EntityName: "{ENTITY_NAME}",
  Type:       "denied_party",
  FuzzyMatch: true,
})`,
    },
  },

  {
    featureId: 'F025',
    slug: 'export-controls',
    name: 'Export Controls',
    category: 'Trade',
    apiEndpoint: '/api/v1/export-controls/classify',
    stepDescription: 'Classify a product under EAR/ITAR export controls',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/export-controls/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "destination_country": "{DESTINATION}"}'`,
      python: `result = potal.export_controls.classify(
    product_description="{PRODUCT}",
    destination_country="{DESTINATION}"
)`,
      node: `const result = await potal.exportControls.classify({
  productDescription: "{PRODUCT}",
  destinationCountry: "{DESTINATION}",
});`,
      go: `result, err := client.ExportControls.Classify(&potal.ExportControlRequest{
  ProductDescription: "{PRODUCT}",
  DestinationCountry: "{DESTINATION}",
})`,
    },
  },

  {
    featureId: 'F026',
    slug: 'eccn-classification',
    name: 'ECCN Classification',
    category: 'Trade',
    apiEndpoint: '/api/v1/classify/eccn',
    stepDescription: 'Classify a product into an ECCN code',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify/eccn \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "technical_specs": "{SPECS}"}'`,
      python: `result = potal.classify.eccn(
    product_description="{PRODUCT}",
    technical_specs="{SPECS}"
)`,
      node: `const result = await potal.classify.eccn({
  productDescription: "{PRODUCT}",
  technicalSpecs: "{SPECS}",
});`,
      go: `result, err := client.Classify.ECCN(&potal.ECCNRequest{
  ProductDescription: "{PRODUCT}",
  TechnicalSpecs:     "{SPECS}",
})`,
    },
  },

  {
    featureId: 'F027',
    slug: 'dangerous-goods-flag',
    name: 'Dangerous Goods Flag',
    category: 'Trade',
    apiEndpoint: '/api/v1/restrictions',
    stepDescription: 'Flag hazardous materials and dangerous goods',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/restrictions \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "check_dangerous_goods": true}'`,
      python: `result = potal.restrictions.check(
    hs_code="{HS_CODE}",
    check_dangerous_goods=True
)`,
      node: `const result = await potal.restrictions.check({
  hsCode: "{HS_CODE}",
  checkDangerousGoods: true,
});`,
      go: `result, err := client.Restrictions.Check(&potal.RestrictionsRequest{
  HsCode:              "{HS_CODE}",
  CheckDangerousGoods: true,
})`,
    },
  },

  {
    featureId: 'F028',
    slug: 'country-prohibitions',
    name: 'Country Prohibitions',
    category: 'Trade',
    apiEndpoint: '/api/v1/restrictions',
    stepDescription: 'Enforce country-specific import bans',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/restrictions \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "destination_country": "{DESTINATION}", "check_prohibitions": true}'`,
      python: `result = potal.restrictions.check(
    hs_code="{HS_CODE}",
    destination_country="{DESTINATION}",
    check_prohibitions=True
)`,
      node: `const result = await potal.restrictions.check({
  hsCode: "{HS_CODE}",
  destinationCountry: "{DESTINATION}",
  checkProhibitions: true,
});`,
      go: `result, err := client.Restrictions.Check(&potal.RestrictionsRequest{
  HsCode:             "{HS_CODE}",
  DestinationCountry: "{DESTINATION}",
  CheckProhibitions:  true,
})`,
    },
  },

  {
    featureId: 'F029',
    slug: 'dual-use-goods',
    name: 'Dual-use Goods',
    category: 'Trade',
    apiEndpoint: '/api/v1/compliance/export-controls',
    stepDescription: 'Identify dual-use items requiring export authorization',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/compliance/export-controls \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "destination_country": "{DESTINATION}", "check_dual_use": true}'`,
      python: `result = potal.compliance.export_controls(
    product_description="{PRODUCT}",
    destination_country="{DESTINATION}",
    check_dual_use=True
)`,
      node: `const result = await potal.compliance.exportControls({
  productDescription: "{PRODUCT}",
  destinationCountry: "{DESTINATION}",
  checkDualUse: true,
});`,
      go: `result, err := client.Compliance.ExportControls(&potal.ComplianceRequest{
  ProductDescription: "{PRODUCT}",
  DestinationCountry: "{DESTINATION}",
  CheckDualUse:       true,
})`,
    },
  },

  {
    featureId: 'F030',
    slug: 'trade-embargo-check',
    name: 'Trade Embargo Check',
    category: 'Trade',
    apiEndpoint: '/api/v1/screening',
    stepDescription: 'Verify trade routes against embargo lists',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/screening \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "type": "embargo"}'`,
      python: `result = potal.screening.check(
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    type="embargo"
)`,
      node: `const result = await potal.screening.check({
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  type: "embargo",
});`,
      go: `result, err := client.Screening.Check(&potal.ScreeningRequest{
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  Type:               "embargo",
})`,
    },
  },

  {
    featureId: 'F031',
    slug: 'customs-documentation',
    name: 'Customs Documentation',
    category: 'Trade',
    apiEndpoint: '/api/v1/customs-docs/generate',
    stepDescription: 'Generate commercial invoices and customs documents',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/customs-docs/generate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"document_type": "commercial_invoice", "shipment_id": "{SHIPMENT_ID}"}'`,
      python: `result = potal.customs_docs.generate(
    document_type="commercial_invoice",
    shipment_id="{SHIPMENT_ID}"
)`,
      node: `const result = await potal.customsDocs.generate({
  documentType: "commercial_invoice",
  shipmentId: "{SHIPMENT_ID}",
});`,
      go: `result, err := client.CustomsDocs.Generate(&potal.CustomsDocsRequest{
  DocumentType: "commercial_invoice",
  ShipmentID:   "{SHIPMENT_ID}",
})`,
    },
  },

  {
    featureId: 'F032',
    slug: 'ics2-pre-arrival',
    name: 'ICS2 Pre-arrival',
    category: 'Trade',
    apiEndpoint: '/api/v1/ics2',
    stepDescription: 'Submit EU ICS2 pre-arrival safety declaration',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/ics2 \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"shipment_id": "{SHIPMENT_ID}", "hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}"}'`,
      python: `result = potal.ics2.submit(
    shipment_id="{SHIPMENT_ID}",
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}"
)`,
      node: `const result = await potal.ics2.submit({
  shipmentId: "{SHIPMENT_ID}",
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
});`,
      go: `result, err := client.ICS2.Submit(&potal.ICS2Request{
  ShipmentID:    "{SHIPMENT_ID}",
  HsCode:        "{HS_CODE}",
  OriginCountry: "{ORIGIN}",
})`,
    },
  },

  {
    featureId: 'F033',
    slug: 'ioss-support',
    name: 'IOSS Support',
    category: 'Trade',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Calculate EU IOSS VAT for low-value imports',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_country": "{EU_COUNTRY}", "value": {VALUE}, "ioss_number": "{IOSS_NUMBER}"}'`,
      python: `result = potal.calculate(
    destination_country="{EU_COUNTRY}",
    value={VALUE},
    ioss_number="{IOSS_NUMBER}"
)`,
      node: `const result = await potal.calculate({
  destinationCountry: "{EU_COUNTRY}",
  value: {VALUE},
  iossNumber: "{IOSS_NUMBER}",
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  DestinationCountry: "{EU_COUNTRY}",
  Value:              {VALUE},
  IOSSNumber:         "{IOSS_NUMBER}",
})`,
    },
  },

  {
    featureId: 'F034',
    slug: 'type-86-entry',
    name: 'Type 86 Entry',
    category: 'Trade',
    apiEndpoint: '/api/v1/customs/type86',
    stepDescription: 'Generate US Type 86 simplified customs entry',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/customs/type86 \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "value": {VALUE}, "shipper": "{SHIPPER}"}'`,
      python: `result = potal.customs.type86(
    hs_code="{HS_CODE}",
    value={VALUE},
    shipper="{SHIPPER}"
)`,
      node: `const result = await potal.customs.type86({
  hsCode: "{HS_CODE}",
  value: {VALUE},
  shipper: "{SHIPPER}",
});`,
      go: `result, err := client.Customs.Type86(&potal.Type86Request{
  HsCode:  "{HS_CODE}",
  Value:   {VALUE},
  Shipper: "{SHIPPER}",
})`,
    },
  },

  {
    featureId: 'F040',
    slug: 'pre-shipment-check',
    name: 'Pre-shipment Check',
    category: 'Trade',
    apiEndpoint: '/api/v1/verify/pre-shipment',
    stepDescription: 'Run comprehensive pre-shipment screening',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/verify/pre-shipment \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "value": {VALUE}}'`,
      python: `result = potal.verify.pre_shipment(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    value={VALUE}
)`,
      node: `const result = await potal.verify.preShipment({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
});`,
      go: `result, err := client.Verify.PreShipment(&potal.PreShipmentRequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
})`,
    },
  },

  {
    featureId: 'F043',
    slug: 'customs-forms',
    name: 'Customs Forms',
    category: 'Trade',
    apiEndpoint: '/api/v1/customs-docs/generate',
    stepDescription: 'Generate CN22, CN23, and customs declaration forms',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/customs-docs/generate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"document_type": "cn23", "shipment_id": "{SHIPMENT_ID}"}'`,
      python: `result = potal.customs_docs.generate(
    document_type="cn23",
    shipment_id="{SHIPMENT_ID}"
)`,
      node: `const result = await potal.customsDocs.generate({
  documentType: "cn23",
  shipmentId: "{SHIPMENT_ID}",
});`,
      go: `result, err := client.CustomsDocs.Generate(&potal.CustomsDocsRequest{
  DocumentType: "cn23",
  ShipmentID:   "{SHIPMENT_ID}",
})`,
    },
  },

  {
    featureId: 'F111',
    slug: 'compliance-certificates',
    name: 'Compliance Certificates',
    category: 'Trade',
    apiEndpoint: null,
    stepDescription: 'Generate compliance and origin certificates',
    code: null,
  },

  // ─── Tax (8) ───────────────────────────────────────────

  {
    featureId: 'F053',
    slug: 'tax-exemptions',
    name: 'Tax Exemptions',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/exemption',
    stepDescription: 'Apply tax exemption certificates per jurisdiction',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/exemption \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jurisdiction": "{JURISDICTION}", "exemption_type": "{TYPE}", "certificate_id": "{CERT_ID}"}'`,
      python: `result = potal.tax.exemption(
    jurisdiction="{JURISDICTION}",
    exemption_type="{TYPE}",
    certificate_id="{CERT_ID}"
)`,
      node: `const result = await potal.tax.exemption({
  jurisdiction: "{JURISDICTION}",
  exemptionType: "{TYPE}",
  certificateId: "{CERT_ID}",
});`,
      go: `result, err := client.Tax.Exemption(&potal.TaxExemptionRequest{
  Jurisdiction:  "{JURISDICTION}",
  ExemptionType: "{TYPE}",
  CertificateID: "{CERT_ID}",
})`,
    },
  },

  {
    featureId: 'F054',
    slug: 'sub-national-tax',
    name: 'Sub-national Tax',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/us-sales-tax',
    stepDescription: 'Calculate state and provincial tax rates',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/us-sales-tax \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"state": "{STATE}", "zip_code": "{ZIP}", "amount": {AMOUNT}}'`,
      python: `result = potal.tax.us_sales_tax(
    state="{STATE}",
    zip_code="{ZIP}",
    amount={AMOUNT}
)`,
      node: `const result = await potal.tax.usSalesTax({
  state: "{STATE}",
  zipCode: "{ZIP}",
  amount: {AMOUNT},
});`,
      go: `result, err := client.Tax.USSalesTax(&potal.USSalesTaxRequest{
  State:   "{STATE}",
  ZipCode: "{ZIP}",
  Amount:  {AMOUNT},
})`,
    },
  },

  {
    featureId: 'F055',
    slug: 'digital-services-tax',
    name: 'Digital Services Tax',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/digital-services',
    stepDescription: 'Apply DST rates for digital goods and services',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/digital-services \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"country": "{COUNTRY}", "service_type": "{SERVICE_TYPE}", "amount": {AMOUNT}}'`,
      python: `result = potal.tax.digital_services(
    country="{COUNTRY}",
    service_type="{SERVICE_TYPE}",
    amount={AMOUNT}
)`,
      node: `const result = await potal.tax.digitalServices({
  country: "{COUNTRY}",
  serviceType: "{SERVICE_TYPE}",
  amount: {AMOUNT},
});`,
      go: `result, err := client.Tax.DigitalServices(&potal.DigitalServicesTaxRequest{
  Country:     "{COUNTRY}",
  ServiceType: "{SERVICE_TYPE}",
  Amount:      {AMOUNT},
})`,
    },
  },

  {
    featureId: 'F056',
    slug: 'us-state-sales-tax',
    name: 'US State Sales Tax',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/us-sales-tax',
    stepDescription: 'Get ZIP-level US sales tax with nexus rules',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/us-sales-tax \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"zip_code": "{ZIP}", "amount": {AMOUNT}, "product_category": "{CATEGORY}"}'`,
      python: `result = potal.tax.us_sales_tax(
    zip_code="{ZIP}",
    amount={AMOUNT},
    product_category="{CATEGORY}"
)`,
      node: `const result = await potal.tax.usSalesTax({
  zipCode: "{ZIP}",
  amount: {AMOUNT},
  productCategory: "{CATEGORY}",
});`,
      go: `result, err := client.Tax.USSalesTax(&potal.USSalesTaxRequest{
  ZipCode:         "{ZIP}",
  Amount:          {AMOUNT},
  ProductCategory: "{CATEGORY}",
})`,
    },
  },

  {
    featureId: 'F057',
    slug: 'specialized-tax',
    name: 'Specialized Tax',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/specialized',
    stepDescription: 'Calculate specialized taxes (telecom, lodging, etc.)',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/specialized \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"country": "{COUNTRY}", "tax_type": "{TAX_TYPE}", "amount": {AMOUNT}}'`,
      python: `result = potal.tax.specialized(
    country="{COUNTRY}",
    tax_type="{TAX_TYPE}",
    amount={AMOUNT}
)`,
      node: `const result = await potal.tax.specialized({
  country: "{COUNTRY}",
  taxType: "{TAX_TYPE}",
  amount: {AMOUNT},
});`,
      go: `result, err := client.Tax.Specialized(&potal.SpecializedTaxRequest{
  Country: "{COUNTRY}",
  TaxType: "{TAX_TYPE}",
  Amount:  {AMOUNT},
})`,
    },
  },

  {
    featureId: 'F058',
    slug: 'vat-registration',
    name: 'VAT Registration',
    category: 'Tax',
    apiEndpoint: '/api/v1/tax/vat-registration',
    stepDescription: 'Verify a VAT registration number',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/tax/vat-registration \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"vat_number": "{VAT_NUMBER}", "country": "{COUNTRY}"}'`,
      python: `result = potal.tax.vat_registration(
    vat_number="{VAT_NUMBER}",
    country="{COUNTRY}"
)`,
      node: `const result = await potal.tax.vatRegistration({
  vatNumber: "{VAT_NUMBER}",
  country: "{COUNTRY}",
});`,
      go: `result, err := client.Tax.VATRegistration(&potal.VATRegistrationRequest{
  VATNumber: "{VAT_NUMBER}",
  Country:   "{COUNTRY}",
})`,
    },
  },

  {
    featureId: 'F059',
    slug: 'e-invoice',
    name: 'E-Invoice',
    category: 'Tax',
    apiEndpoint: '/api/v1/invoicing/e-invoice',
    stepDescription: 'Generate a compliant e-invoice',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/invoicing/e-invoice \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id": "{ORDER_ID}", "format": "ubl"}'`,
      python: `result = potal.invoicing.e_invoice(
    order_id="{ORDER_ID}",
    format="ubl"
)`,
      node: `const result = await potal.invoicing.eInvoice({
  orderId: "{ORDER_ID}",
  format: "ubl",
});`,
      go: `result, err := client.Invoicing.EInvoice(&potal.EInvoiceRequest{
  OrderID: "{ORDER_ID}",
  Format:  "ubl",
})`,
    },
  },

  {
    featureId: 'F148',
    slug: 'us-sales-tax-nexus-tracking',
    name: 'US Sales Tax Nexus Tracking',
    category: 'Tax',
    apiEndpoint: '/api/v1/nexus/check',
    stepDescription: 'Track US state sales tax nexus thresholds',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/nexus/check \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"seller_id": "{SELLER_ID}", "state": "{STATE}"}'`,
      python: `result = potal.nexus.check(
    seller_id="{SELLER_ID}",
    state="{STATE}"
)`,
      node: `const result = await potal.nexus.check({
  sellerId: "{SELLER_ID}",
  state: "{STATE}",
});`,
      go: `result, err := client.Nexus.Check(&potal.NexusCheckRequest{
  SellerID: "{SELLER_ID}",
  State:    "{STATE}",
})`,
    },
  },

  // ─── Platform (43) ─────────────────────────────────────

  {
    featureId: 'F035',
    slug: 'multi-language-ui',
    name: 'Multi-language UI',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Full interface localization in 50 languages',
    code: null,
  },

  {
    featureId: 'F036',
    slug: 'rest-api',
    name: 'REST API',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: '155+ API endpoints with consistent JSON responses',
    code: null,
  },

  {
    featureId: 'F037',
    slug: 'api-key-auth',
    name: 'API Key Auth',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Secure API key authentication with scope-based permissions',
    code: null,
  },

  {
    featureId: 'F038',
    slug: 'rate-limiting',
    name: 'Rate Limiting',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Intelligent rate limiting with per-plan quotas',
    code: null,
  },

  {
    featureId: 'F039',
    slug: 'webhooks',
    name: 'Webhooks',
    category: 'Platform',
    apiEndpoint: '/api/v1/webhooks',
    stepDescription: 'Configure real-time event notification endpoints',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/webhooks \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "{WEBHOOK_URL}", "events": ["classification.complete", "calculation.complete"]}'`,
      python: `result = potal.webhooks.create(
    url="{WEBHOOK_URL}",
    events=["classification.complete", "calculation.complete"]
)`,
      node: `const result = await potal.webhooks.create({
  url: "{WEBHOOK_URL}",
  events: ["classification.complete", "calculation.complete"],
});`,
      go: `result, err := client.Webhooks.Create(&potal.WebhookCreateRequest{
  URL:    "{WEBHOOK_URL}",
  Events: []string{"classification.complete", "calculation.complete"},
})`,
    },
  },

  {
    featureId: 'F041',
    slug: 'dashboard',
    name: 'Dashboard',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Full-featured admin dashboard with usage analytics',
    code: null,
  },

  {
    featureId: 'F042',
    slug: 'usage-analytics',
    name: 'Usage Analytics',
    category: 'Platform',
    apiEndpoint: '/api/v1/admin/usage',
    stepDescription: 'Track API usage and classification history',
    code: {
      curl: `curl -s "https://api.potal.app/v1/admin/usage?period=30d" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.admin.usage(period="30d")`,
      node: `const result = await potal.admin.usage({ period: "30d" });`,
      go: `result, err := client.Admin.Usage(&potal.UsageRequest{
  Period: "30d",
})`,
    },
  },

  {
    featureId: 'F044',
    slug: 'multi-currency',
    name: 'Multi-currency',
    category: 'Platform',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Display costs in any currency with real-time conversion',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "destination_country": "{DESTINATION}", "value": {VALUE}, "display_currency": "{CURRENCY}"}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    destination_country="{DESTINATION}",
    value={VALUE},
    display_currency="{CURRENCY}"
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
  displayCurrency: "{CURRENCY}",
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
  DisplayCurrency:    "{CURRENCY}",
})`,
    },
  },

  {
    featureId: 'F071',
    slug: 'white-label-widget',
    name: 'White-label Widget',
    category: 'Platform',
    apiEndpoint: '/api/v1/whitelabel/config',
    stepDescription: 'Configure a white-label widget for your brand',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/whitelabel/config \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"brand_color": "{COLOR}", "logo_url": "{LOGO_URL}", "domain": "{DOMAIN}"}'`,
      python: `result = potal.whitelabel.config(
    brand_color="{COLOR}",
    logo_url="{LOGO_URL}",
    domain="{DOMAIN}"
)`,
      node: `const result = await potal.whitelabel.config({
  brandColor: "{COLOR}",
  logoUrl: "{LOGO_URL}",
  domain: "{DOMAIN}",
});`,
      go: `result, err := client.Whitelabel.Config(&potal.WhitelabelConfigRequest{
  BrandColor: "{COLOR}",
  LogoURL:    "{LOGO_URL}",
  Domain:     "{DOMAIN}",
})`,
    },
  },

  {
    featureId: 'F072',
    slug: 'custom-branding',
    name: 'Custom Branding',
    category: 'Platform',
    apiEndpoint: '/api/v1/branding',
    stepDescription: 'Apply logo, colors, and fonts to customer-facing elements',
    code: {
      curl: `curl -s -X PUT https://api.potal.app/v1/branding \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"logo_url": "{LOGO_URL}", "primary_color": "{COLOR}", "font_family": "{FONT}"}'`,
      python: `result = potal.branding.update(
    logo_url="{LOGO_URL}",
    primary_color="{COLOR}",
    font_family="{FONT}"
)`,
      node: `const result = await potal.branding.update({
  logoUrl: "{LOGO_URL}",
  primaryColor: "{COLOR}",
  fontFamily: "{FONT}",
});`,
      go: `result, err := client.Branding.Update(&potal.BrandingRequest{
  LogoURL:      "{LOGO_URL}",
  PrimaryColor: "{COLOR}",
  FontFamily:   "{FONT}",
})`,
    },
  },

  {
    featureId: 'F078',
    slug: 'batch-import-export',
    name: 'Batch Import/Export',
    category: 'Platform',
    apiEndpoint: '/api/v1/classify/batch',
    stepDescription: 'Bulk import products via CSV and export results',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify/batch \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"format": "csv", "file_url": "{CSV_URL}"}'`,
      python: `result = potal.classify.batch(
    format="csv",
    file_url="{CSV_URL}"
)`,
      node: `const result = await potal.classify.batch({
  format: "csv",
  fileUrl: "{CSV_URL}",
});`,
      go: `result, err := client.Classify.Batch(&potal.BatchClassifyRequest{
  Format:  "csv",
  FileURL: "{CSV_URL}",
})`,
    },
  },

  {
    featureId: 'F079',
    slug: 'scheduled-reports',
    name: 'Scheduled Reports',
    category: 'Platform',
    apiEndpoint: '/api/v1/reports/schedule',
    stepDescription: 'Schedule automated report generation',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/reports/schedule \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"report_type": "classification_summary", "frequency": "weekly", "email": "{EMAIL}"}'`,
      python: `result = potal.reports.schedule(
    report_type="classification_summary",
    frequency="weekly",
    email="{EMAIL}"
)`,
      node: `const result = await potal.reports.schedule({
  reportType: "classification_summary",
  frequency: "weekly",
  email: "{EMAIL}",
});`,
      go: `result, err := client.Reports.Schedule(&potal.ScheduleReportRequest{
  ReportType: "classification_summary",
  Frequency:  "weekly",
  Email:      "{EMAIL}",
})`,
    },
  },

  {
    featureId: 'F080',
    slug: 'custom-reports',
    name: 'Custom Reports',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Build custom reports with flexible filters',
    code: null,
  },

  {
    featureId: 'F081',
    slug: 'data-visualization',
    name: 'Data Visualization',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Interactive charts for duty rates and trends',
    code: null,
  },

  {
    featureId: 'F086',
    slug: 'email-notifications',
    name: 'Email Notifications',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Automated email alerts for rate changes and compliance',
    code: null,
  },

  {
    featureId: 'F087',
    slug: 'in-app-notifications',
    name: 'In-app Notifications',
    category: 'Platform',
    apiEndpoint: '/api/v1/notifications',
    stepDescription: 'Manage in-app notification preferences',
    code: {
      curl: `curl -s "https://api.potal.app/v1/notifications?unread=true" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.notifications.list(unread=True)`,
      node: `const result = await potal.notifications.list({ unread: true });`,
      go: `result, err := client.Notifications.List(&potal.NotificationsRequest{
  Unread: true,
})`,
    },
  },

  {
    featureId: 'F088',
    slug: 'user-management',
    name: 'User Management',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Full user lifecycle management with Supabase Auth',
    code: null,
  },

  {
    featureId: 'F089',
    slug: 'role-based-access',
    name: 'Role-based Access',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'RBAC with admin, manager, analyst, and viewer roles',
    code: null,
  },

  {
    featureId: 'F090',
    slug: 'team-management',
    name: 'Team Management',
    category: 'Platform',
    apiEndpoint: '/api/v1/team',
    stepDescription: 'Invite team members and manage permissions',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/team \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "{EMAIL}", "role": "analyst"}'`,
      python: `result = potal.team.invite(
    email="{EMAIL}",
    role="analyst"
)`,
      node: `const result = await potal.team.invite({
  email: "{EMAIL}",
  role: "analyst",
});`,
      go: `result, err := client.Team.Invite(&potal.TeamInviteRequest{
  Email: "{EMAIL}",
  Role:  "analyst",
})`,
    },
  },

  {
    featureId: 'F091',
    slug: 'api-documentation',
    name: 'API Documentation',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Interactive API docs with code examples',
    code: null,
  },

  {
    featureId: 'F092',
    slug: 'sandbox-environment',
    name: 'Sandbox Environment',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Test API calls in sandbox mode without affecting production',
    code: null,
  },

  {
    featureId: 'F093',
    slug: 'rate-monitoring',
    name: 'Rate Monitoring',
    category: 'Platform',
    apiEndpoint: '/api/v1/admin/rate-monitor',
    stepDescription: 'Monitor tariff rate changes with automated sync',
    code: {
      curl: `curl -s "https://api.potal.app/v1/admin/rate-monitor?country={COUNTRY}" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.admin.rate_monitor(country="{COUNTRY}")`,
      node: `const result = await potal.admin.rateMonitor({ country: "{COUNTRY}" });`,
      go: `result, err := client.Admin.RateMonitor(&potal.RateMonitorRequest{
  Country: "{COUNTRY}",
})`,
    },
  },

  {
    featureId: 'F094',
    slug: 'sla-dashboard',
    name: 'SLA Dashboard',
    category: 'Platform',
    apiEndpoint: '/api/v1/admin/sla',
    stepDescription: 'Get real-time SLA metrics (uptime, latency, errors)',
    code: {
      curl: `curl -s "https://api.potal.app/v1/admin/sla" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.admin.sla()`,
      node: `const result = await potal.admin.sla();`,
      go: `result, err := client.Admin.SLA()`,
    },
  },

  {
    featureId: 'F095',
    slug: 'high-throughput',
    name: 'High Throughput',
    category: 'Platform',
    apiEndpoint: '/api/v1/calculate',
    stepDescription: 'Pre-computed results for sub-50ms responses',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "destination_country": "{DESTINATION}", "value": {VALUE}, "use_cache": true}'`,
      python: `result = potal.calculate(
    hs_code="{HS_CODE}",
    destination_country="{DESTINATION}",
    value={VALUE},
    use_cache=True
)`,
      node: `const result = await potal.calculate({
  hsCode: "{HS_CODE}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
  useCache: true,
});`,
      go: `result, err := client.Calculate(&potal.CalculateRequest{
  HsCode:             "{HS_CODE}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
  UseCache:           true,
})`,
    },
  },

  {
    featureId: 'F096',
    slug: 'webhook-retry',
    name: 'Webhook Retry',
    category: 'Platform',
    apiEndpoint: '/api/v1/webhooks',
    stepDescription: 'Automatic webhook retry with exponential backoff',
    code: {
      curl: `curl -s -X PUT https://api.potal.app/v1/webhooks/{WEBHOOK_ID} \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"retry_policy": {"max_retries": 5, "backoff": "exponential"}}'`,
      python: `result = potal.webhooks.update(
    webhook_id="{WEBHOOK_ID}",
    retry_policy={"max_retries": 5, "backoff": "exponential"}
)`,
      node: `const result = await potal.webhooks.update({
  webhookId: "{WEBHOOK_ID}",
  retryPolicy: { maxRetries: 5, backoff: "exponential" },
});`,
      go: `result, err := client.Webhooks.Update(&potal.WebhookUpdateRequest{
  WebhookID: "{WEBHOOK_ID}",
  RetryPolicy: potal.RetryPolicy{MaxRetries: 5, Backoff: "exponential"},
})`,
    },
  },

  {
    featureId: 'F097',
    slug: 'error-handling',
    name: 'Error Handling',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Structured error responses with codes and doc links',
    code: null,
  },

  {
    featureId: 'F098',
    slug: 'versioned-api',
    name: 'Versioned API',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Stable v1 API with backward-compatible versioning',
    code: null,
  },

  {
    featureId: 'F099',
    slug: 'openapi-spec',
    name: 'OpenAPI Spec',
    category: 'Platform',
    apiEndpoint: '/api/v1/docs',
    stepDescription: 'Fetch the OpenAPI 3.0 specification',
    code: {
      curl: `curl -s "https://api.potal.app/v1/docs" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.docs.openapi_spec()`,
      node: `const result = await potal.docs.openapiSpec();`,
      go: `result, err := client.Docs.OpenAPISpec()`,
    },
  },

  {
    featureId: 'F100',
    slug: 'status-page',
    name: 'Status Page',
    category: 'Platform',
    apiEndpoint: '/api/v1/health',
    stepDescription: 'Check service health and status',
    code: {
      curl: `curl -s "https://api.potal.app/v1/health"`,
      python: `result = potal.health()`,
      node: `const result = await potal.health();`,
      go: `result, err := client.Health()`,
    },
  },

  {
    featureId: 'F101',
    slug: 'uptime-monitoring',
    name: 'Uptime Monitoring',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Automated uptime checks every 6 hours',
    code: null,
  },

  {
    featureId: 'F102',
    slug: 'incident-response',
    name: 'Incident Response',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Automated escalation flow with Telegram alerts',
    code: null,
  },

  {
    featureId: 'F109',
    slug: 'csv-export',
    name: 'CSV Export',
    category: 'Platform',
    apiEndpoint: '/api/v1/calculate/csv',
    stepDescription: 'Export calculation results as CSV',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate/csv \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query_ids": ["{QUERY_ID_1}", "{QUERY_ID_2}"]}'`,
      python: `result = potal.calculate.csv(
    query_ids=["{QUERY_ID_1}", "{QUERY_ID_2}"]
)`,
      node: `const result = await potal.calculate.csv({
  queryIds: ["{QUERY_ID_1}", "{QUERY_ID_2}"],
});`,
      go: `result, err := client.Calculate.CSV(&potal.CSVExportRequest{
  QueryIDs: []string{"{QUERY_ID_1}", "{QUERY_ID_2}"},
})`,
    },
  },

  {
    featureId: 'F110',
    slug: 'pdf-reports',
    name: 'PDF Reports',
    category: 'Platform',
    apiEndpoint: '/api/v1/documents/pdf',
    stepDescription: 'Generate PDF trade documents',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/documents/pdf \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"document_type": "commercial_invoice", "order_id": "{ORDER_ID}"}'`,
      python: `result = potal.documents.pdf(
    document_type="commercial_invoice",
    order_id="{ORDER_ID}"
)`,
      node: `const result = await potal.documents.pdf({
  documentType: "commercial_invoice",
  orderId: "{ORDER_ID}",
});`,
      go: `result, err := client.Documents.PDF(&potal.PDFRequest{
  DocumentType: "commercial_invoice",
  OrderID:      "{ORDER_ID}",
})`,
    },
  },

  {
    featureId: 'F112',
    slug: 'multi-tenant',
    name: 'Multi-tenant',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Full multi-tenancy with row-level security',
    code: null,
  },

  {
    featureId: 'F113',
    slug: 'sso-support',
    name: 'SSO Support',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Single sign-on via Supabase Auth with OAuth providers',
    code: null,
  },

  {
    featureId: 'F114',
    slug: 'audit-logging',
    name: 'Audit Logging',
    category: 'Platform',
    apiEndpoint: '/api/v1/classify',
    stepDescription: 'Every API call logged with full traceability',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_description": "{PRODUCT}", "include_audit_log": true}'`,
      python: `result = potal.classify(
    product_description="{PRODUCT}",
    include_audit_log=True
)`,
      node: `const result = await potal.classify({
  productDescription: "{PRODUCT}",
  includeAuditLog: true,
});`,
      go: `result, err := client.Classify(&potal.ClassifyRequest{
  ProductDescription: "{PRODUCT}",
  IncludeAuditLog:    true,
})`,
    },
  },

  {
    featureId: 'F115',
    slug: 'data-retention',
    name: 'Data Retention',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Configurable data retention policies per plan tier',
    code: null,
  },

  {
    featureId: 'F128',
    slug: 'api-changelog',
    name: 'API Changelog',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Detailed changelog for every API version',
    code: null,
  },

  {
    featureId: 'F129',
    slug: 'migration-guide',
    name: 'Migration Guide',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Step-by-step guides for migrating from competitors',
    code: null,
  },

  {
    featureId: 'F140',
    slug: 'onboarding-wizard',
    name: 'Onboarding Wizard',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Guided setup wizard for new users',
    code: null,
  },

  {
    featureId: 'F141',
    slug: 'product-tour',
    name: 'Product Tour',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Interactive walkthrough of key platform features',
    code: null,
  },

  {
    featureId: 'F145',
    slug: 'a-b-testing',
    name: 'A/B Testing',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Built-in A/B testing framework for experiments',
    code: null,
  },

  {
    featureId: 'F146',
    slug: 'feature-flags',
    name: 'Feature Flags',
    category: 'Platform',
    apiEndpoint: null,
    stepDescription: 'Toggle features on/off per tenant without deployments',
    code: null,
  },

  // ─── Integration (14) ──────────────────────────────────

  {
    featureId: 'F045',
    slug: 'shopify-app',
    name: 'Shopify App',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Native Shopify Theme App Extension (coming soon)',
    code: null,
  },

  {
    featureId: 'F046',
    slug: 'woocommerce-plugin',
    name: 'WooCommerce Plugin',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'WordPress/WooCommerce plugin (coming soon)',
    code: null,
  },

  {
    featureId: 'F047',
    slug: 'bigcommerce-plugin',
    name: 'BigCommerce Plugin',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'BigCommerce storefront integration (coming soon)',
    code: null,
  },

  {
    featureId: 'F048',
    slug: 'magento-module',
    name: 'Magento Module',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Full Magento 2 module (coming soon)',
    code: null,
  },

  {
    featureId: 'F049',
    slug: 'js-widget',
    name: 'JS Widget',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Drop-in JavaScript widget for any website',
    code: null,
  },

  {
    featureId: 'F050',
    slug: 'sdk-javascript',
    name: 'SDK (JavaScript)',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Official JavaScript/TypeScript SDK on npm',
    code: null,
  },

  {
    featureId: 'F051',
    slug: 'sdk-python',
    name: 'SDK (Python)',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Official Python SDK with sync and async support',
    code: null,
  },

  {
    featureId: 'F052',
    slug: 'sdk-curl',
    name: 'SDK (cURL)',
    category: 'Integration',
    apiEndpoint: null,
    stepDescription: 'Comprehensive cURL examples and shell scripts',
    code: null,
  },

  {
    featureId: 'F073',
    slug: 'checkout-integration',
    name: 'Checkout Integration',
    category: 'Integration',
    apiEndpoint: '/api/v1/checkout',
    stepDescription: 'DDP/DDU checkout flow with session management',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/checkout \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id": "{SESSION_ID}", "cart_items": [{"hs_code": "{HS_CODE}", "value": {VALUE}}], "incoterm": "DDP"}'`,
      python: `result = potal.checkout.create(
    session_id="{SESSION_ID}",
    cart_items=[{"hs_code": "{HS_CODE}", "value": {VALUE}}],
    incoterm="DDP"
)`,
      node: `const result = await potal.checkout.create({
  sessionId: "{SESSION_ID}",
  cartItems: [{ hsCode: "{HS_CODE}", value: {VALUE} }],
  incoterm: "DDP",
});`,
      go: `result, err := client.Checkout.Create(&potal.CheckoutRequest{
  SessionID: "{SESSION_ID}",
  CartItems: []potal.CartItem{{HsCode: "{HS_CODE}", Value: {VALUE}}},
  Incoterm:  "DDP",
})`,
    },
  },

  {
    featureId: 'F074',
    slug: 'order-sync',
    name: 'Order Sync',
    category: 'Integration',
    apiEndpoint: '/api/v1/orders/sync',
    stepDescription: 'Bi-directional order synchronization',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/orders/sync \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "{PLATFORM}", "order_id": "{ORDER_ID}", "direction": "pull"}'`,
      python: `result = potal.orders.sync(
    platform="{PLATFORM}",
    order_id="{ORDER_ID}",
    direction="pull"
)`,
      node: `const result = await potal.orders.sync({
  platform: "{PLATFORM}",
  orderId: "{ORDER_ID}",
  direction: "pull",
});`,
      go: `result, err := client.Orders.Sync(&potal.OrderSyncRequest{
  Platform:  "{PLATFORM}",
  OrderID:   "{ORDER_ID}",
  Direction: "pull",
})`,
    },
  },

  {
    featureId: 'F075',
    slug: 'inventory-sync',
    name: 'Inventory Sync',
    category: 'Integration',
    apiEndpoint: '/api/v1/inventory/levels',
    stepDescription: 'Real-time inventory level synchronization',
    code: {
      curl: `curl -s "https://api.potal.app/v1/inventory/levels?warehouse={WAREHOUSE_ID}" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.inventory.levels(warehouse="{WAREHOUSE_ID}")`,
      node: `const result = await potal.inventory.levels({ warehouse: "{WAREHOUSE_ID}" });`,
      go: `result, err := client.Inventory.Levels(&potal.InventoryRequest{
  Warehouse: "{WAREHOUSE_ID}",
})`,
    },
  },

  {
    featureId: 'F082',
    slug: 'marketplace-connect',
    name: 'Marketplace Connect',
    category: 'Integration',
    apiEndpoint: '/api/v1/integrations/marketplace',
    stepDescription: 'Connect Amazon, eBay, Etsy via OAuth',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/integrations/marketplace \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "amazon", "region": "{REGION}", "auth_code": "{AUTH_CODE}"}'`,
      python: `result = potal.integrations.marketplace(
    platform="amazon",
    region="{REGION}",
    auth_code="{AUTH_CODE}"
)`,
      node: `const result = await potal.integrations.marketplace({
  platform: "amazon",
  region: "{REGION}",
  authCode: "{AUTH_CODE}",
});`,
      go: `result, err := client.Integrations.Marketplace(&potal.MarketplaceRequest{
  Platform: "amazon",
  Region:   "{REGION}",
  AuthCode: "{AUTH_CODE}",
})`,
    },
  },

  {
    featureId: 'F083',
    slug: 'erp-integration',
    name: 'ERP Integration',
    category: 'Integration',
    apiEndpoint: '/api/v1/integrations/erp',
    stepDescription: 'Connect SAP, Oracle, NetSuite, and more',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/integrations/erp \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"erp": "sap", "connection_string": "{CONN_STRING}", "sync_mode": "incremental"}'`,
      python: `result = potal.integrations.erp(
    erp="sap",
    connection_string="{CONN_STRING}",
    sync_mode="incremental"
)`,
      node: `const result = await potal.integrations.erp({
  erp: "sap",
  connectionString: "{CONN_STRING}",
  syncMode: "incremental",
});`,
      go: `result, err := client.Integrations.ERP(&potal.ERPRequest{
  ERP:              "sap",
  ConnectionString: "{CONN_STRING}",
  SyncMode:         "incremental",
})`,
    },
  },

  {
    featureId: 'F084',
    slug: 'accounting-integration',
    name: 'Accounting Integration',
    category: 'Integration',
    apiEndpoint: '/api/v1/integrations/accounting',
    stepDescription: 'Sync duty/tax data with QuickBooks, Xero, Sage',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/integrations/accounting \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"platform": "quickbooks", "auth_code": "{AUTH_CODE}", "sync_type": "duties_and_taxes"}'`,
      python: `result = potal.integrations.accounting(
    platform="quickbooks",
    auth_code="{AUTH_CODE}",
    sync_type="duties_and_taxes"
)`,
      node: `const result = await potal.integrations.accounting({
  platform: "quickbooks",
  authCode: "{AUTH_CODE}",
  syncType: "duties_and_taxes",
});`,
      go: `result, err := client.Integrations.Accounting(&potal.AccountingRequest{
  Platform: "quickbooks",
  AuthCode: "{AUTH_CODE}",
  SyncType: "duties_and_taxes",
})`,
    },
  },

  // ─── Shipping (11) ─────────────────────────────────────

  {
    featureId: 'F060',
    slug: 'shipping-rates',
    name: 'Shipping Rates',
    category: 'Shipping',
    apiEndpoint: '/api/v1/shipping/rates',
    stepDescription: 'Compare rates across 8 carriers',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/shipping/rates \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "weight_kg": {WEIGHT}, "dimensions": {"l": {L}, "w": {W}, "h": {H}}}'`,
      python: `result = potal.shipping.rates(
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    weight_kg={WEIGHT},
    dimensions={"l": {L}, "w": {W}, "h": {H}}
)`,
      node: `const result = await potal.shipping.rates({
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  weightKg: {WEIGHT},
  dimensions: { l: {L}, w: {W}, h: {H} },
});`,
      go: `result, err := client.Shipping.Rates(&potal.ShippingRatesRequest{
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  WeightKg:           {WEIGHT},
  Dimensions:         potal.Dimensions{L: {L}, W: {W}, H: {H}},
})`,
    },
  },

  {
    featureId: 'F061',
    slug: 'carrier-integration',
    name: 'Carrier Integration',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Live carrier API connections for real-time rates',
    code: null,
  },

  {
    featureId: 'F062',
    slug: 'label-generation',
    name: 'Label Generation',
    category: 'Shipping',
    apiEndpoint: '/api/v1/shipping/labels',
    stepDescription: 'Generate 4x6 shipping labels as PDF',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/shipping/labels \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"shipment_id": "{SHIPMENT_ID}", "carrier": "{CARRIER}", "format": "pdf"}'`,
      python: `result = potal.shipping.labels(
    shipment_id="{SHIPMENT_ID}",
    carrier="{CARRIER}",
    format="pdf"
)`,
      node: `const result = await potal.shipping.labels({
  shipmentId: "{SHIPMENT_ID}",
  carrier: "{CARRIER}",
  format: "pdf",
});`,
      go: `result, err := client.Shipping.Labels(&potal.LabelRequest{
  ShipmentID: "{SHIPMENT_ID}",
  Carrier:    "{CARRIER}",
  Format:     "pdf",
})`,
    },
  },

  {
    featureId: 'F063',
    slug: 'tracking',
    name: 'Tracking',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Real-time shipment tracking with carrier events',
    code: null,
  },

  {
    featureId: 'F064',
    slug: 'ddp-quote',
    name: 'DDP Quote',
    category: 'Shipping',
    apiEndpoint: '/api/v1/calculate/ddp-vs-ddu',
    stepDescription: 'Compare DDP vs DDU costs with itemized breakdown',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/calculate/ddp-vs-ddu \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code": "{HS_CODE}", "origin_country": "{ORIGIN}", "destination_country": "{DESTINATION}", "value": {VALUE}}'`,
      python: `result = potal.calculate.ddp_vs_ddu(
    hs_code="{HS_CODE}",
    origin_country="{ORIGIN}",
    destination_country="{DESTINATION}",
    value={VALUE}
)`,
      node: `const result = await potal.calculate.ddpVsDdu({
  hsCode: "{HS_CODE}",
  originCountry: "{ORIGIN}",
  destinationCountry: "{DESTINATION}",
  value: {VALUE},
});`,
      go: `result, err := client.Calculate.DDPvsDDU(&potal.DDPvsDDURequest{
  HsCode:             "{HS_CODE}",
  OriginCountry:      "{ORIGIN}",
  DestinationCountry: "{DESTINATION}",
  Value:              {VALUE},
})`,
    },
  },

  {
    featureId: 'F065',
    slug: 'dimensional-weight',
    name: 'Dimensional Weight',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Calculate dimensional weight for shipping cost estimates',
    code: null,
  },

  {
    featureId: 'F066',
    slug: 'insurance-calc',
    name: 'Insurance Calc',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Shipping insurance cost estimation',
    code: null,
  },

  {
    featureId: 'F067',
    slug: 'returns-management',
    name: 'Returns Management',
    category: 'Shipping',
    apiEndpoint: '/api/v1/returns/process',
    stepDescription: 'Process cross-border returns with duty drawback',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/returns/process \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id": "{ORDER_ID}", "reason": "{REASON}", "calculate_drawback": true}'`,
      python: `result = potal.returns.process(
    order_id="{ORDER_ID}",
    reason="{REASON}",
    calculate_drawback=True
)`,
      node: `const result = await potal.returns.process({
  orderId: "{ORDER_ID}",
  reason: "{REASON}",
  calculateDrawback: true,
});`,
      go: `result, err := client.Returns.Process(&potal.ReturnsRequest{
  OrderID:           "{ORDER_ID}",
  Reason:            "{REASON}",
  CalculateDrawback: true,
})`,
    },
  },

  {
    featureId: 'F068',
    slug: 'multi-package',
    name: 'Multi-package',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Split shipments across multiple packages',
    code: null,
  },

  {
    featureId: 'F069',
    slug: '3pl-integration',
    name: '3PL Integration',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Connect ShipBob, Amazon FBA, and fulfillment providers',
    code: null,
  },

  {
    featureId: 'F070',
    slug: 'multi-warehouse',
    name: 'Multi-warehouse',
    category: 'Shipping',
    apiEndpoint: null,
    stepDescription: 'Manage inventory across multiple warehouse locations',
    code: null,
  },

  // ─── Security (5) ──────────────────────────────────────

  {
    featureId: 'F121',
    slug: 'data-encryption',
    name: 'Data Encryption',
    category: 'Security',
    apiEndpoint: null,
    stepDescription: 'AES-256 encryption at rest and TLS 1.3 in transit',
    code: null,
  },

  {
    featureId: 'F122',
    slug: 'access-control',
    name: 'Access Control',
    category: 'Security',
    apiEndpoint: null,
    stepDescription: 'Granular API key scopes with row-level security',
    code: null,
  },

  {
    featureId: 'F123',
    slug: 'security-headers',
    name: 'Security Headers',
    category: 'Security',
    apiEndpoint: null,
    stepDescription: 'CSP, HSTS, X-Frame-Options, and OWASP-compliant headers',
    code: null,
  },

  {
    featureId: 'F124',
    slug: 'vulnerability-scanning',
    name: 'Vulnerability Scanning',
    category: 'Security',
    apiEndpoint: null,
    stepDescription: 'Automated dependency scanning and security audits',
    code: null,
  },

  {
    featureId: 'F125',
    slug: 'penetration-testing',
    name: 'Penetration Testing',
    category: 'Security',
    apiEndpoint: null,
    stepDescription: 'Regular security assessments with documented results',
    code: null,
  },

  // ─── Legal (6) ─────────────────────────────────────────

  {
    featureId: 'F116',
    slug: 'gdpr-compliance',
    name: 'GDPR Compliance',
    category: 'Legal',
    apiEndpoint: null,
    stepDescription: 'Full GDPR compliance with data export and deletion',
    code: null,
  },

  {
    featureId: 'F117',
    slug: 'ccpa-compliance',
    name: 'CCPA Compliance',
    category: 'Legal',
    apiEndpoint: null,
    stepDescription: 'California Consumer Privacy Act compliance',
    code: null,
  },

  {
    featureId: 'F118',
    slug: 'terms-of-service',
    name: 'Terms of Service',
    category: 'Legal',
    apiEndpoint: null,
    stepDescription: 'Comprehensive terms for API and platform usage',
    code: null,
  },

  {
    featureId: 'F119',
    slug: 'privacy-policy',
    name: 'Privacy Policy',
    category: 'Legal',
    apiEndpoint: null,
    stepDescription: 'Transparent privacy policy covering all data processing',
    code: null,
  },

  {
    featureId: 'F120',
    slug: 'cookie-consent',
    name: 'Cookie Consent',
    category: 'Legal',
    apiEndpoint: null,
    stepDescription: 'Cookie consent banner compliant with EU ePrivacy',
    code: null,
  },

  {
    featureId: 'F126',
    slug: 'compliance-reports',
    name: 'Compliance Reports',
    category: 'Legal',
    apiEndpoint: '/api/v1/reports/compliance-audit',
    stepDescription: 'Generate compliance audit reports',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/reports/compliance-audit \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"period": "2025-Q1", "report_type": "full"}'`,
      python: `result = potal.reports.compliance_audit(
    period="2025-Q1",
    report_type="full"
)`,
      node: `const result = await potal.reports.complianceAudit({
  period: "2025-Q1",
  reportType: "full",
});`,
      go: `result, err := client.Reports.ComplianceAudit(&potal.ComplianceAuditRequest{
  Period:     "2025-Q1",
  ReportType: "full",
})`,
    },
  },

  // ─── Web (4) ───────────────────────────────────────────

  {
    featureId: 'F104',
    slug: 'landing-page',
    name: 'Landing Page',
    category: 'Web',
    apiEndpoint: null,
    stepDescription: 'High-converting landing page with cost calculator',
    code: null,
  },

  {
    featureId: 'F105',
    slug: 'pricing-page',
    name: 'Pricing Page',
    category: 'Web',
    apiEndpoint: null,
    stepDescription: 'Transparent pricing with plan comparison',
    code: null,
  },

  {
    featureId: 'F106',
    slug: 'blog',
    name: 'Blog',
    category: 'Web',
    apiEndpoint: null,
    stepDescription: 'SEO-optimized blog with cross-border commerce guides',
    code: null,
  },

  {
    featureId: 'F107',
    slug: 'seo-optimization',
    name: 'SEO Optimization',
    category: 'Web',
    apiEndpoint: null,
    stepDescription: 'Dynamic sitemap, Open Graph, and structured data',
    code: null,
  },

  // ─── Support (8) ───────────────────────────────────────

  {
    featureId: 'F127',
    slug: 'knowledge-base',
    name: 'Knowledge Base',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Comprehensive FAQ and help center with search',
    code: null,
  },

  {
    featureId: 'F130',
    slug: 'video-tutorials',
    name: 'Video Tutorials',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Step-by-step video guides for API integration',
    code: null,
  },

  {
    featureId: 'F131',
    slug: 'community-forum',
    name: 'Community Forum',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Developer community on GitHub Discussions and Discord',
    code: null,
  },

  {
    featureId: 'F136',
    slug: 'training-program',
    name: 'Training Program',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Structured training courses for customs and API usage',
    code: null,
  },

  {
    featureId: 'F137',
    slug: 'certification',
    name: 'Certification',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Professional certification for customs specialists',
    code: null,
  },

  {
    featureId: 'F138',
    slug: 'customer-success',
    name: 'Customer Success',
    category: 'Support',
    apiEndpoint: '/api/v1/account/csm',
    stepDescription: 'Dedicated customer success manager for Enterprise',
    code: {
      curl: `curl -s "https://api.potal.app/v1/account/csm" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.account.csm()`,
      node: `const result = await potal.account.csm();`,
      go: `result, err := client.Account.CSM()`,
    },
  },

  {
    featureId: 'F143',
    slug: 'ai-chatbot',
    name: 'AI Chatbot',
    category: 'Support',
    apiEndpoint: '/api/v1/support/chat',
    stepDescription: 'AI-powered support chatbot',
    code: {
      curl: `curl -s -X POST https://api.potal.app/v1/support/chat \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "{MESSAGE}", "session_id": "{SESSION_ID}"}'`,
      python: `result = potal.support.chat(
    message="{MESSAGE}",
    session_id="{SESSION_ID}"
)`,
      node: `const result = await potal.support.chat({
  message: "{MESSAGE}",
  sessionId: "{SESSION_ID}",
});`,
      go: `result, err := client.Support.Chat(&potal.ChatRequest{
  Message:   "{MESSAGE}",
  SessionID: "{SESSION_ID}",
})`,
    },
  },

  {
    featureId: 'F144',
    slug: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    category: 'Support',
    apiEndpoint: null,
    stepDescription: 'Analyze customer feedback sentiment',
    code: null,
  },

  // ─── Business (5) ──────────────────────────────────────

  {
    featureId: 'F132',
    slug: 'partner-portal',
    name: 'Partner Portal',
    category: 'Business',
    apiEndpoint: '/api/v1/partners',
    stepDescription: 'Self-service partner dashboard with revenue sharing',
    code: {
      curl: `curl -s "https://api.potal.app/v1/partners" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.partners.list()`,
      node: `const result = await potal.partners.list();`,
      go: `result, err := client.Partners.List()`,
    },
  },

  {
    featureId: 'F133',
    slug: 'referral-program',
    name: 'Referral Program',
    category: 'Business',
    apiEndpoint: null,
    stepDescription: 'Customer referral tracking with automated rewards',
    code: null,
  },

  {
    featureId: 'F134',
    slug: 'affiliate-system',
    name: 'Affiliate System',
    category: 'Business',
    apiEndpoint: null,
    stepDescription: 'Affiliate marketing with tracking links and commissions',
    code: null,
  },

  {
    featureId: 'F135',
    slug: 'reseller-program',
    name: 'Reseller Program',
    category: 'Business',
    apiEndpoint: null,
    stepDescription: 'White-label reseller program with custom pricing',
    code: null,
  },

  {
    featureId: 'F147',
    slug: 'partner-ecosystem',
    name: 'Partner Ecosystem',
    category: 'Business',
    apiEndpoint: '/api/v1/partners',
    stepDescription: '1,400+ potential partners across logistics and e-commerce',
    code: {
      curl: `curl -s "https://api.potal.app/v1/partners?type=ecosystem" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`,
      python: `result = potal.partners.list(type="ecosystem")`,
      node: `const result = await potal.partners.list({ type: "ecosystem" });`,
      go: `result, err := client.Partners.List(&potal.PartnersRequest{
  Type: "ecosystem",
})`,
    },
  },

  // ─── Marketing (1) ────────────────────────────────────

  {
    featureId: 'F142',
    slug: 'email-campaigns',
    name: 'Email Campaigns',
    category: 'Marketing',
    apiEndpoint: null,
    stepDescription: 'Automated welcome emails and engagement workflows',
    code: null,
  },
];

export function getTemplatesByCategory(): Record<string, FeatureTemplate[]> {
  const map: Record<string, FeatureTemplate[]> = {};
  for (const t of FEATURE_TEMPLATES) {
    (map[t.category] ??= []).push(t);
  }
  return map;
}

export function getTemplateBySlug(slug: string): FeatureTemplate | undefined {
  return FEATURE_TEMPLATES.find(t => t.slug === slug);
}
