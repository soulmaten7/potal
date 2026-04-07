/**
 * POTAL Feature Guide Data
 * Detailed guide content for each of the 140 features.
 * Core features have full API examples; others have template guides.
 */

export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export interface FieldSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
  tip?: string;
}

export interface FeatureGuide {
  slug: string;
  detailedDescription: string;
  howToUse: GuideStep[];
  apiEndpoint?: string;
  apiMethod?: string;
  requestExample?: string;
  responseExample?: string;
  curlExample?: string;
  relatedFeatures: string[];
  /** Input fields for API-based features */
  requiredFields?: FieldSpec[];
  /** Tips for achieving best accuracy */
  accuracyTips?: string[];
  /** Common mistakes users make */
  commonMistakes?: string[];
}

// ─── Core Engine Guides (15) ─────────────────────────

const CORE_GUIDES: FeatureGuide[] = [
  {
    slug: 'hs-code-classification',
    detailedDescription: 'Classify any product into its correct HS (Harmonized System) code using POTAL\'s v3.3 GRI pipeline. The system uses 595 codified rules across all 21 Sections of the HS nomenclature — zero AI calls, zero per-request cost. Supports text-based classification with 10-field input, image-based classification, and batch processing for hundreds of products at once.',
    howToUse: [
      { step: 1, title: 'Get your API key', description: 'Sign up at potal.app and generate an API key from the Dashboard > API Keys section.' },
      { step: 2, title: 'Prepare your product data', description: 'At minimum, provide a productName. For best accuracy, include category, material, and processing details.' },
      { step: 3, title: 'Send a POST request', description: 'Call POST /api/v1/classify with your product data. The response includes the HS code, confidence score, and classification path.' },
      { step: 4, title: 'Review the result', description: 'Check the confidence score and alternatives array. If confidence is below 0.8, consider providing more product details.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      productName: "Men's cotton t-shirt",
      category: "Apparel",
    }, null, 2),
    responseExample: JSON.stringify({
      hsCode: "6109.10",
      description: "T-shirts, singlets and other vests, of cotton, knitted or crocheted",
      confidence: 0.95,
      alternatives: [
        { hsCode: "6109.90", confidence: 0.82 },
      ],
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/classify \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName": "Men\\'s cotton t-shirt", "category": "Apparel"}'`,
    relatedFeatures: ['duty-rate-calculation', 'confidence-score', 'batch-classification', 'hs-code-validation', 'image-classification'],
    requiredFields: [
      { name: 'productName', type: 'string', required: true, description: 'Product name in English, as specific as possible', example: "Men's cotton t-shirt, knitted", tip: 'Include material + form. Exclude brand names.' },
      { name: 'category', type: 'string', required: false, description: 'Product category (e.g., apparel, electronics, food)', example: 'apparel', tip: 'Use broad category, not material. "apparel" not "cotton".' },
      { name: 'material', type: 'string', required: false, description: 'Primary material (WCO material group)', example: 'cotton', tip: 'Use WCO material terms: cotton, polyester, stainless steel, wood, etc.' },
      { name: 'processing', type: 'string', required: false, description: 'How the product is manufactured', example: 'knitted', tip: 'knitted, woven, molded, cast, forged, printed, etc.' },
      { name: 'composition', type: 'string', required: false, description: 'Material composition breakdown', example: '95% cotton, 5% elastane', tip: 'Include percentages when mixed materials.' },
      { name: 'weight_spec', type: 'string', required: false, description: 'Weight specification', example: '200 g/m2', tip: 'Per-unit weight helps distinguish tariff subheadings.' },
      { name: 'price', type: 'number', required: false, description: 'Unit price in USD', example: '14.99', tip: 'Price-break rules apply to some HS headings (e.g., "valued over $14/kg").' },
      { name: 'origin_country', type: 'string', required: false, description: 'Country of origin (ISO 2-letter code)', example: 'CN', tip: 'Use ISO codes: CN, US, DE, JP — not full country names.' },
      { name: 'destination_country', type: 'string', required: false, description: 'Destination country (ISO 2-letter code, default: US)', example: 'US', tip: 'Affects HS10 subheading selection for 7 countries with 10-digit codes.' },
    ],
    accuracyTips: [
      'All 9 fields provided = highest confidence classification',
      'productName alone works but may return lower confidence',
      'Adding material + processing dramatically improves accuracy for textiles and metals',
      'price field is critical for HS headings with "valued over/under $X" rules',
      'destination_country affects 10-digit HS code selection (US, EU, GB, CA, AU, JP, KR)',
    ],
    commonMistakes: [
      'Putting material in the category field — "cotton" is a material, "apparel" is the category',
      'Using full country names instead of ISO codes — use "CN" not "China"',
      'Too-generic product names — "shirt" is vague, "men\'s cotton knitted t-shirt" is precise',
      'Including brand names — "Nike Air Max" should be "running shoes, leather upper, rubber sole"',
      'Mixing up processing and composition — processing = how it\'s made, composition = what it\'s made of',
    ],
  },
  {
    slug: 'duty-rate-calculation',
    detailedDescription: 'Look up MFN (Most Favored Nation), MIN (minimum), and AGR (agreement/preferential) duty rates for any HS code across 240 countries. POTAL uses pre-computed tariff data from official government sources including WTO, WCO, TARIC (EU), USITC (US), and more. Results are returned in under 50ms with no AI calls required.',
    howToUse: [
      { step: 1, title: 'Get the HS code', description: 'Either provide an HS code directly or let POTAL auto-classify from a product name.' },
      { step: 2, title: 'Specify origin and destination', description: 'Provide the origin country (where the product is made) and destination country (where it\'s being imported).' },
      { step: 3, title: 'Call the calculate endpoint', description: 'POST /api/v1/calculate returns the full duty breakdown including MFN rate, preferential rates, and any trade remedies.' },
      { step: 4, title: 'Check tariff optimization', description: 'The response includes tariffOptimization showing the best available rate and potential savings via FTAs.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      productName: "Ceramic coffee mug",
      price: 5.00,
      origin: "CN",
      destinationCountry: "US",
    }, null, 2),
    responseExample: JSON.stringify({
      totalLandedCost: 8.42,
      breakdown: {
        productCost: 5.00,
        shippingCost: 0,
        duty: 1.38,
        tax: 0,
        insurance: 0.04,
        total: 8.42,
      },
      tariffOptimization: {
        optimalRateType: "MFN",
        savingsVsMfn: 0,
      },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Ceramic coffee mug","price":5,"origin":"CN","destinationCountry":"US"}'`,
    relatedFeatures: ['total-landed-cost', 'fta-detection', 'anti-dumping-duties', 'de-minimis-check', 'currency-conversion'],
    requiredFields: [
      { name: 'price', type: 'number', required: true, description: 'Product price (numeric value)', example: '25.00', tip: 'Must be a valid non-negative number. Currency strings also accepted.' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country (ISO 2-letter code)', example: 'CN', tip: 'Use ISO codes. Platform names like "AliExpress" also work.' },
      { name: 'destinationCountry', type: 'string', required: false, description: 'Destination country (ISO 2-letter code, default: US)', example: 'US' },
      { name: 'hsCode', type: 'string', required: false, description: 'HS code (2-10 digits). Auto-classified from productName if not provided.', example: '6109.10' },
      { name: 'productName', type: 'string', required: false, description: 'Product name for auto-classification when hsCode is not provided', example: 'Cotton t-shirt' },
      { name: 'shippingPrice', type: 'number', required: false, description: 'Shipping cost (default: 0)', example: '12.50' },
      { name: 'shippingTerms', type: 'string', required: false, description: 'Incoterms: DDP, DDU, CIF, FOB, EXW (default: DDP)', example: 'DDP' },
      { name: 'weight_kg', type: 'number', required: false, description: 'Weight in kilograms for shipping estimate', example: '0.5' },
      { name: 'quantity', type: 'number', required: false, description: 'Item quantity', example: '10' },
      { name: 'firmName', type: 'string', required: false, description: 'Exporter firm name for anti-dumping/CVD rate matching', example: 'Shenzhen Electronics Co' },
      { name: 'zipcode', type: 'string', required: false, description: 'US ZIP code for state/local sales tax', example: '90210' },
      { name: 'buyer_vat_number', type: 'string', required: false, description: 'Buyer VAT number for EU B2B reverse-charge', example: 'DE123456789' },
    ],
    accuracyTips: [
      'price is the only required field — everything else improves accuracy',
      'Providing origin + destinationCountry enables FTA preferential rate lookup',
      'Adding hsCode skips auto-classification and gives exact duty rates',
      'firmName enables company-specific anti-dumping rates instead of "all others" rate',
      'zipcode is essential for US destinations — state/local tax varies dramatically',
    ],
    commonMistakes: [
      'Omitting origin country — without it, FTA savings cannot be calculated',
      'Using full country names instead of ISO codes — use "CN" not "China"',
      'Forgetting shippingTerms — DDP includes duties at checkout, DDU does not',
      'Not including weight_kg — shipping cost estimate requires weight',
      'Setting price as string with currency symbol — use numeric value only (25.00 not "$25.00")',
    ],

  },
  {
    slug: 'tax-calculation-vat-gst',
    detailedDescription: 'Calculate VAT, GST, and sales tax for 240 countries and territories. POTAL covers standard rates, reduced rates, zero-rated goods, and exempt categories. For the US, it supports ZIP-level sales tax with state, county, city, and special district rates. For the EU, it includes IOSS support for imports under EUR 150.',
    howToUse: [
      { step: 1, title: 'Specify the destination', description: 'Provide the destination country code. For US, you can also add a ZIP code for precise local tax.' },
      { step: 2, title: 'Include product details', description: 'Product category affects tax rates — some goods are zero-rated or exempt (groceries, medicine, etc.).' },
      { step: 3, title: 'Call the calculate endpoint', description: 'The tax portion of the landed cost response includes VAT/GST rates and calculated amounts.' },
      { step: 4, title: 'Handle special cases', description: 'Check for de minimis thresholds, IOSS eligibility, and tax exemptions in the response.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      productName: "Wireless headphones",
      price: 79.99,
      origin: "CN",
      destinationCountry: "DE",
    }, null, 2),
    responseExample: JSON.stringify({
      totalLandedCost: 107.63,
      breakdown: {
        productCost: 79.99,
        shippingCost: 0,
        duty: 2.80,
        tax: 15.72,
        insurance: 0.12,
        total: 107.63,
      },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Wireless headphones","price":79.99,"origin":"CN","destinationCountry":"DE"}'`,
    relatedFeatures: ['total-landed-cost', 'us-state-sales-tax', 'ioss-support', 'tax-exemptions', 'digital-services-tax'],
    requiredFields: [
      { name: 'price', type: 'number', required: true, description: 'Product price', example: '79.99' },
      { name: 'destinationCountry', type: 'string', required: false, description: 'Destination country (ISO 2-letter code, default: US)', example: 'DE' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country (ISO 2-letter code)', example: 'CN' },
      { name: 'productName', type: 'string', required: false, description: 'Product name for category-based tax rate', example: 'Wireless headphones' },
      { name: 'zipcode', type: 'string', required: false, description: 'US ZIP code for precise local tax rate', example: '10001', tip: 'Essential for US — tax varies by ZIP code.' },
    ],
    accuracyTips: [
      'For US destinations, always include zipcode — state + county + city + special rates all vary',
      'For EU destinations, product category affects VAT rate (reduced rates for food, books, etc.)',
      'Including origin enables de minimis and IOSS threshold checks',
    ],
    commonMistakes: [
      'Not providing zipcode for US — state-level rate alone can be off by 2-4%',
      'Confusing VAT-inclusive vs exclusive pricing — POTAL calculates tax on the declared price',
    ],

  },
  {
    slug: 'total-landed-cost',
    detailedDescription: 'Get the full import cost for any product shipped internationally. Total Landed Cost includes the product price, shipping cost, import duties, taxes (VAT/GST), insurance, and brokerage fees. POTAL computes everything in a single API call with sub-50ms response time, using pre-computed tariff data for 240 countries.',
    howToUse: [
      { step: 1, title: 'Prepare shipment details', description: 'Include product name/HS code, price, shipping cost, origin country, and destination country.' },
      { step: 2, title: 'Choose shipping terms', description: 'Specify DDP (Delivered Duty Paid), DDU (Delivered Duty Unpaid), or other Incoterms like CIF/FOB/EXW.' },
      { step: 3, title: 'Send the request', description: 'POST /api/v1/calculate returns the complete cost breakdown with every fee itemized.' },
      { step: 4, title: 'Display to buyer', description: 'Show the total landed cost at checkout so buyers know exactly what they\'ll pay — no surprise fees.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      productName: "Laptop computer",
      price: 999.00,
      shippingPrice: 25.00,
      origin: "CN",
      destinationCountry: "US",
      shippingTerms: "DDP",
      quantity: 1,
    }, null, 2),
    responseExample: JSON.stringify({
      totalLandedCost: 1074.00,
      breakdown: {
        productCost: 999.00,
        shippingCost: 25.00,
        duty: 0,
        tax: 0,
        insurance: 1.50,
        total: 1074.00,
      },
      tariffOptimization: {
        optimalRateType: "ITA",
        optimalAgreementName: "Information Technology Agreement",
        savingsVsMfn: 49.95,
      },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Laptop computer","price":999,"shippingPrice":25,"origin":"CN","destinationCountry":"US","shippingTerms":"DDP"}'`,
    relatedFeatures: ['duty-rate-calculation', 'tax-calculation-vat-gst', 'currency-conversion', 'ddp-quote', 'shipping-rates'],
    requiredFields: [
      { name: 'price', type: 'number', required: true, description: 'Product price', example: '999.00' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country (ISO 2-letter code)', example: 'CN', tip: 'Critical for duty rate + FTA lookup.' },
      { name: 'destinationCountry', type: 'string', required: false, description: 'Destination country (ISO 2-letter code, default: US)', example: 'US' },
      { name: 'shippingPrice', type: 'number', required: false, description: 'Shipping cost (default: 0)', example: '25.00' },
      { name: 'shippingTerms', type: 'string', required: false, description: 'DDP (default), DDU, CIF, FOB, EXW', example: 'DDP', tip: 'DDP = buyer pays nothing extra at door. DDU = buyer pays duties on delivery.' },
      { name: 'productName', type: 'string', required: false, description: 'Product name (auto-classifies if no hsCode)', example: 'Laptop computer' },
      { name: 'hsCode', type: 'string', required: false, description: 'HS code (skips auto-classification)', example: '8471.30' },
      { name: 'weight_kg', type: 'number', required: false, description: 'Weight for shipping cost estimate', example: '2.5' },
      { name: 'quantity', type: 'number', required: false, description: 'Number of items', example: '1' },
    ],
    accuracyTips: [
      'price + origin + destinationCountry = core trio for accurate landed cost',
      'Adding shippingPrice gives true total; without it, shipping is estimated from weight',
      'shippingTerms determines who pays duties — DDP at checkout vs DDU at delivery',
      'hsCode speeds up response and avoids classification ambiguity',
    ],
    commonMistakes: [
      'Omitting origin — without it, duty rate defaults to MFN and FTA savings are missed',
      'Confusing DDP vs DDU — DDP means buyer pays total at checkout, DDU means surprise fees at delivery',
      'Not including shippingPrice — landed cost without shipping is incomplete',
    ],

  },
  {
    slug: 'confidence-score',
    detailedDescription: 'Every HS code classification includes a multi-dimensional confidence score from 0 to 1. The score reflects how precisely the product maps to the assigned HS code based on input completeness, rule match strength, and ambiguity level. A score above 0.9 indicates high confidence; below 0.7 suggests the product description may be too vague.',
    howToUse: [
      { step: 1, title: 'Classify a product', description: 'Send a classification request via POST /api/v1/classify with as much detail as possible.' },
      { step: 2, title: 'Read the confidence field', description: 'The response includes a confidence score between 0 and 1.' },
      { step: 3, title: 'Check alternatives', description: 'The alternatives array shows other possible HS codes with their own confidence scores.' },
      { step: 4, title: 'Improve low scores', description: 'If confidence is low, add more fields: material, processing method, intended use, or composition.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      productName: "Stainless steel water bottle",
      category: "Drinkware",
    }, null, 2),
    responseExample: JSON.stringify({
      hsCode: "7323.93",
      description: "Table, kitchen or other household articles, of stainless steel",
      confidence: 0.92,
      alternatives: [
        { hsCode: "7310.29", confidence: 0.71 },
        { hsCode: "7612.90", confidence: 0.55 },
      ],
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/classify \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Stainless steel water bottle","category":"Drinkware"}'`,
    relatedFeatures: ['hs-code-classification', 'audit-trail', 'hs-code-validation', 'batch-classification', 'origin-detection'],
    requiredFields: [
      { name: 'productName', type: 'string', required: true, description: 'Product name — more detail yields higher confidence', example: "Stainless steel insulated water bottle", tip: 'Include material + form + function for best scores.' },
      { name: 'category', type: 'string', required: false, description: 'Product category', example: 'Drinkware', tip: 'Boosts score by narrowing Section scope.' },
      { name: 'material', type: 'string', required: false, description: 'Primary material (WCO group)', example: 'stainless steel', tip: 'Directly maps to HS Sections XI–XV. Critical for scores above 0.9.' },
      { name: 'processing', type: 'string', required: false, description: 'Manufacturing method', example: 'pressed', tip: 'Differentiates subheadings — e.g., cast vs forged steel.' },
    ],
    accuracyTips: [
      'More input fields = higher confidence score',
      'productName alone typically yields 0.6–0.8 confidence',
      'Adding material + processing pushes most items above 0.9',
      'Scores below 0.7 usually mean the product name is too generic',
    ],
    commonMistakes: [
      'Expecting 1.0 confidence with only productName — provide at least 3 fields',
      'Ignoring the alternatives array — the second-best option may be more accurate for your specific product variant',
    ],
  },
  {
    slug: 'multi-country-support',
    detailedDescription: 'POTAL supports 240 countries and territories with localized tax rules, duty rates, and regulatory requirements. The /countries endpoint provides a full list of supported countries with their VAT rates, de minimis thresholds, currency codes, and FTA status. Data is grouped by region and available in 50 languages.',
    howToUse: [
      { step: 1, title: 'List all countries', description: 'GET /api/v1/countries returns the full list with tax rates and thresholds.' },
      { step: 2, title: 'Filter by region', description: 'Add ?region=Europe to filter by geographic region.' },
      { step: 3, title: 'Get localized names', description: 'Add ?lang=ja to get country names in Japanese (or any of 50 languages).' },
      { step: 4, title: 'Use in calculations', description: 'Pass country codes from this list to /calculate or /classify endpoints.' },
    ],
    apiEndpoint: '/api/v1/countries',
    apiMethod: 'GET',
    requestExample: '// No request body needed for GET\n// Optional query: ?region=Asia&lang=en',
    responseExample: JSON.stringify({
      success: true,
      data: {
        countries: [
          { code: "JP", name: "Japan", region: "Asia", vatRate: 10, deMinimisUsd: 130, currency: "JPY" },
          { code: "KR", name: "South Korea", region: "Asia", vatRate: 10, deMinimisUsd: 150, currency: "KRW" },
        ],
        total: 240,
      },
    }, null, 2),
    curlExample: `curl https://potal.app/api/v1/countries?region=Asia&lang=en \\
  -H "X-API-Key: pk_live_your_key"`,
    relatedFeatures: ['total-landed-cost', 'de-minimis-check', 'fta-detection', 'country-prohibitions', 'tax-calculation-vat-gst'],
    requiredFields: [
      { name: 'region', type: 'string', required: false, description: 'Filter by region', example: 'Asia', tip: 'Options: Europe, Asia, Americas, Africa, Oceania, Middle East' },
      { name: 'lang', type: 'string', required: false, description: 'Language code for country names (default: en)', example: 'ko', tip: '50 languages supported: en, ko, ja, zh, es, fr, de, pt, ru, ar, etc.' },
    ],
    accuracyTips: [
      'No authentication required — this is a public endpoint',
      'Response is cached for 24 hours — data refreshes daily',
      'Use country codes from this endpoint in all other API calls',
    ],
    commonMistakes: [
      'Using country names from this endpoint directly — always use the code field (2-letter ISO) in other API calls',
    ],

  },
  {
    slug: 'audit-trail',
    detailedDescription: 'Every classification and calculation is logged with a complete audit trail. This includes the input parameters, the decision path taken by the GRI pipeline, rules applied, confidence scores, and timestamps. Audit trails are essential for customs compliance, dispute resolution, and internal quality assurance.',
    howToUse: [
      { step: 1, title: 'Make a classification', description: 'Every POST /api/v1/classify call is automatically logged in the audit trail.' },
      { step: 2, title: 'View in Dashboard', description: 'Go to Dashboard > Classification History to see all past classifications with their full decision paths.' },
      { step: 3, title: 'Export audit data', description: 'Use the CSV Export feature to download classification history for customs authorities.' },
      { step: 4, title: 'Review decision path', description: 'Each audit entry shows which GRI rules were applied and why a specific HS code was selected.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    relatedFeatures: ['hs-code-classification', 'confidence-score', 'csv-export', 'compliance-reports', 'audit-logging'],
  },
  {
    slug: 'batch-classification',
    detailedDescription: 'Classify hundreds of products at once via the batch API. Upload a JSON array of products and receive HS codes for all of them in a single request. The batch endpoint processes items in parallel (10 concurrent) with built-in deduplication — if the same product name appears multiple times, it\'s classified once and the result is reused.',
    howToUse: [
      { step: 1, title: 'Prepare your product list', description: 'Create a JSON array with each item having a unique id and productName at minimum.' },
      { step: 2, title: 'Send the batch request', description: 'POST /api/v1/classify/batch with your items array. Max items: 500 (Free plan).' },
      { step: 3, title: 'Map results by ID', description: 'Each result includes the original id you provided for easy mapping back to your catalog.' },
      { step: 4, title: 'Handle failures', description: 'Items that fail classification will have an error field. Retry these individually with more detail.' },
    ],
    apiEndpoint: '/api/v1/classify/batch',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      items: [
        { id: "SKU-001", productName: "Cotton t-shirt" },
        { id: "SKU-002", productName: "Ceramic mug" },
        { id: "SKU-003", productName: "Leather wallet" },
      ],
    }, null, 2),
    responseExample: JSON.stringify({
      success: true,
      results: [
        { id: "SKU-001", hsCode: "6109.10", confidence: 0.94, description: "T-shirts, of cotton" },
        { id: "SKU-002", hsCode: "6912.00", confidence: 0.91, description: "Ceramic tableware" },
        { id: "SKU-003", hsCode: "4202.31", confidence: 0.89, description: "Wallets, of leather" },
      ],
      batchSize: 3,
      processedAt: "2026-03-29T12:00:00Z",
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/classify/batch \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"id":"SKU-001","productName":"Cotton t-shirt"},{"id":"SKU-002","productName":"Ceramic mug"}]}'`,
    relatedFeatures: ['hs-code-classification', 'batch-import-export', 'csv-export', 'confidence-score', 'high-throughput'],
    requiredFields: [
      { name: 'items[].id', type: 'string', required: true, description: 'Unique ID for result mapping', example: 'SKU-001', tip: 'Use your internal SKU or product ID for easy mapping.' },
      { name: 'items[].productName', type: 'string', required: true, description: 'Product name', example: 'Cotton t-shirt' },
      { name: 'items[].material', type: 'string', required: false, description: 'Material (WCO group)', example: 'cotton' },
      { name: 'items[].category', type: 'string', required: false, description: 'Product category', example: 'apparel' },
      { name: 'items[].processing', type: 'string', required: false, description: 'Processing method', example: 'knitted' },
      { name: 'items[].composition', type: 'string', required: false, description: 'Material composition', example: '100% cotton' },
      { name: 'items[].weight_spec', type: 'string', required: false, description: 'Weight specification', example: '180 g/m2' },
      { name: 'items[].price', type: 'number', required: false, description: 'Unit price', example: '14.99' },
      { name: 'items[].origin_country', type: 'string', required: false, description: 'Origin country (ISO code)', example: 'CN' },
    ],
    accuracyTips: [
      'Each item requires id + productName at minimum',
      'More fields per item = higher confidence scores',
      'Duplicate productNames are auto-deduplicated — classified once, result copied to all matching IDs',
      'Max items per request: 500 (Forever Free plan)',
    ],
    commonMistakes: [
      'Missing id field — results cannot be mapped back without unique IDs',
      'Exceeding batch limit — check your plan limit (500 for Forever Free)',
      'Inconsistent field naming — use snake_case for batch items (origin_country not originCountry)',
    ],

  },
  {
    slug: 'image-classification',
    detailedDescription: 'Classify products directly from photos using AI vision analysis. Upload an image URL or base64-encoded image data, and POTAL will identify the product and assign the correct HS code. Supports JPEG, PNG, GIF, and WebP formats up to 5MB. Ideal for visual product catalogs or mobile-first workflows.',
    howToUse: [
      { step: 1, title: 'Prepare your image', description: 'Use a clear product photo. Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.' },
      { step: 2, title: 'Send as URL or base64', description: 'Include imageUrl for hosted images or imageBase64 for direct upload in the classify request.' },
      { step: 3, title: 'Review detected product', description: 'The response includes detectedProductName showing what the AI identified from the image.' },
      { step: 4, title: 'Refine if needed', description: 'Add a productHint to guide classification if the image is ambiguous.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      imageUrl: "https://example.com/product-photo.jpg",
      productHint: "kitchen appliance",
    }, null, 2),
    responseExample: JSON.stringify({
      hsCode: "8516.79",
      description: "Electric coffee maker",
      confidence: 0.87,
      detectedProductName: "Electric drip coffee maker",
      alternatives: [
        { hsCode: "8419.81", confidence: 0.62 },
      ],
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/classify \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"imageUrl":"https://example.com/product-photo.jpg","productHint":"kitchen appliance"}'`,
    relatedFeatures: ['hs-code-classification', 'confidence-score', 'batch-classification', 'origin-detection', 'hs-code-validation'],
    requiredFields: [
      { name: 'imageUrl', type: 'string', required: false, description: 'URL of the product image (JPEG, PNG, GIF, WebP)', example: 'https://example.com/product.jpg', tip: 'Use a clear, well-lit photo with the product centered. Provide either imageUrl or imageBase64.' },
      { name: 'imageBase64', type: 'string', required: false, description: 'Base64-encoded image data', example: '/9j/4AAQSkZ...', tip: 'Max 5MB after decoding. Use for direct uploads without a hosted URL.' },
      { name: 'productHint', type: 'string', required: false, description: 'Optional hint to guide AI classification', example: 'kitchen appliance', tip: 'Improves accuracy for ambiguous images — e.g., "handbag" vs "luggage".' },
      { name: 'destination_country', type: 'string', required: false, description: 'Destination country for HS10 selection', example: 'US' },
    ],
    accuracyTips: [
      'Either imageUrl or imageBase64 must be provided (one is required)',
      'Clear, single-product photos yield the best results',
      'productHint significantly improves accuracy for visually ambiguous products',
      'Image classification uses AI vision — slightly slower than text-based classification',
    ],
    commonMistakes: [
      'Providing both imageUrl and imageBase64 — use one or the other',
      'Low-quality or cluttered images — crop to show only the product',
      'Images with text overlays or watermarks — these confuse the vision model',
      'Expecting the same confidence as text-based — image mode typically scores 0.7–0.9',
    ],
  },
  {
    slug: 'currency-conversion',
    detailedDescription: 'Real-time exchange rates with daily auto-updates for 160+ currencies. POTAL fetches rates from central bank sources and caches them for fast lookups. Use it standalone or as part of landed cost calculations where product prices need to be converted to the destination currency.',
    howToUse: [
      { step: 1, title: 'Get current rates', description: 'GET /api/v1/exchange-rate?from=USD&to=EUR returns the current exchange rate.' },
      { step: 2, title: 'Auto-convert in calculations', description: 'The /calculate endpoint automatically handles currency conversion when currencies differ.' },
      { step: 3, title: 'Lock a rate', description: 'POST /api/v1/exchange-rates/lock to freeze a rate for 24-72 hours for guaranteed pricing.' },
      { step: 4, title: 'Batch conversion', description: 'Convert multiple amounts in a single request by including the currency in each calculation.' },
    ],
    apiEndpoint: '/api/v1/exchange-rate',
    apiMethod: 'GET',
    requestExample: '// GET /api/v1/exchange-rate?from=USD&to=EUR',
    responseExample: JSON.stringify({
      from: "USD",
      to: "EUR",
      rate: 0.9234,
      timestamp: "2026-03-29T00:00:00Z",
      source: "ECB",
    }, null, 2),
    curlExample: `curl "https://potal.app/api/v1/exchange-rate?from=USD&to=EUR" \\
  -H "X-API-Key: pk_live_your_key"`,
    relatedFeatures: ['total-landed-cost', 'multi-currency', 'duty-rate-calculation', 'shipping-rates', 'ddp-quote'],
    requiredFields: [
      { name: 'from', type: 'string', required: true, description: 'Source currency code (ISO 4217)', example: 'USD', tip: 'Use 3-letter ISO currency codes: USD, EUR, GBP, JPY, KRW, CNY.' },
      { name: 'to', type: 'string', required: true, description: 'Target currency code (ISO 4217)', example: 'EUR', tip: '160+ currencies supported. Check /api/v1/countries for valid codes.' },
    ],
    accuracyTips: [
      'Rates are updated daily from central bank sources',
      'For landed cost calculations, currency conversion is automatic — no separate call needed',
      'Rate lock is available for guaranteed pricing over 24–72 hours',
    ],
    commonMistakes: [
      'Using country codes instead of currency codes — "US" is not valid, use "USD"',
      'Assuming rates are real-time — they are daily snapshots from central banks',
    ],
  },
  {
    slug: 'hs-code-validation',
    detailedDescription: 'Validate HS code inputs using POTAL\'s 10-field validation system. Before classification, the system checks that all input fields are valid and complete. It verifies product name format, material groups against the 79 WCO-defined groups, processing methods, and composition data to ensure the most accurate classification possible.',
    howToUse: [
      { step: 1, title: 'Submit product fields', description: 'Provide as many of the 9 fields as possible: productName, category, material, processing, composition, weight, price, origin, intended use.' },
      { step: 2, title: 'Review validation', description: 'The classify endpoint validates all fields before processing and returns warnings for invalid inputs.' },
      { step: 3, title: 'Fix flagged fields', description: 'If a material or processing value is not recognized, the response will suggest valid alternatives.' },
      { step: 4, title: 'Resubmit', description: 'Correct any flagged fields and resubmit for improved accuracy.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    relatedFeatures: ['hs-code-classification', 'confidence-score', 'batch-classification', 'audit-trail', 'origin-detection'],
  },
  {
    slug: 'de-minimis-check',
    detailedDescription: 'Automatically check if a shipment value falls below the duty-free de minimis threshold for the destination country. De minimis values vary widely — from $0 (Brazil) to $800 (US) to unlimited (some countries). POTAL maintains an up-to-date database of thresholds for all 240 supported countries.',
    howToUse: [
      { step: 1, title: 'Include the shipment value', description: 'Set the price field in your /calculate request to the declared value of the shipment.' },
      { step: 2, title: 'Check the result', description: 'If the value is below the de minimis threshold, the duty amount will be $0 in the breakdown.' },
      { step: 3, title: 'View thresholds', description: 'GET /api/v1/countries shows the deMinimisUsd field for each country.' },
      { step: 4, title: 'Handle edge cases', description: 'Some countries have different thresholds for duty vs. tax exemption. POTAL handles both.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['total-landed-cost', 'duty-rate-calculation', 'multi-country-support', 'ioss-support', 'type-86-entry'],
    requiredFields: [
      { name: 'price', type: 'number', required: true, description: 'Declared shipment value in USD', example: '45.00', tip: 'This is compared against the destination country de minimis threshold.' },
      { name: 'destinationCountry', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'US', tip: 'Thresholds vary hugely: US $800, EU €150, Brazil $0, Australia AUD 1,000.' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country for additional context', example: 'CN', tip: 'Some countries apply different thresholds based on origin.' },
    ],
    accuracyTips: [
      'De minimis check is automatic in /calculate — no separate API call needed',
      'GET /api/v1/countries returns deMinimisUsd for all 240 countries',
      'Some countries have separate duty and tax de minimis thresholds — POTAL checks both',
      'US de minimis changed to $0 for some origins (China/HK) as of Aug 2025',
    ],
    commonMistakes: [
      'Assuming $800 de minimis applies everywhere — it is US-specific',
      'Forgetting that de minimis applies to shipment value, not item value',
      'Not accounting for shipping costs — some countries include shipping in the threshold value',
    ],
  },
  {
    slug: 'restricted-items',
    detailedDescription: 'Screen products against import restrictions and prohibited item lists for any destination country. The system checks HS code-based restrictions, product category bans, and country-specific regulations. Covers dangerous goods, controlled substances, weapons, and culturally sensitive items across 240 countries.',
    howToUse: [
      { step: 1, title: 'Provide product details', description: 'Include the HS code and/or product name with the destination country.' },
      { step: 2, title: 'Call the restrictions endpoint', description: 'POST /api/v1/restrictions returns whether the product has import restrictions.' },
      { step: 3, title: 'Check prohibition status', description: 'The isProhibited field tells you if the product is completely banned in the destination.' },
      { step: 4, title: 'Review license requirements', description: 'Some restricted items can be imported with a license — check requiresLicense in the response.' },
    ],
    apiEndpoint: '/api/v1/restrictions',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      hsCode: "9304.00",
      destinationCountry: "AU",
      productName: "Air rifle",
    }, null, 2),
    responseExample: JSON.stringify({
      hasRestrictions: true,
      isProhibited: false,
      restrictions: [
        { type: "firearms_control", description: "Requires import permit from Australian Border Force", requiresLicense: true },
      ],
      hsCode: "9304.00",
      destinationCountry: "AU",
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/restrictions \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"hsCode":"9304.00","destinationCountry":"AU","productName":"Air rifle"}'`,
    relatedFeatures: ['country-prohibitions', 'dangerous-goods-flag', 'sanctions-screening', 'export-controls', 'pre-shipment-check'],
    requiredFields: [
      { name: 'destinationCountry', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'AU' },
      { name: 'hsCode', type: 'string', required: false, description: 'HS code (2-10 digits)', example: '9304.00', tip: 'Provide hsCode for exact restriction lookup. Without it, productName is auto-classified.' },
      { name: 'productName', type: 'string', required: false, description: 'Product name (used if hsCode not provided)', example: 'Air rifle', tip: 'Required if hsCode is not provided.' },
    ],
    accuracyTips: [
      'destinationCountry is the only required field',
      'Providing hsCode directly gives faster, more precise results than auto-classification',
      'If neither hsCode nor productName is provided, the request will fail',
    ],
    commonMistakes: [
      'Omitting both hsCode and productName — at least one must be provided',
      'Using 3-letter country codes — use ISO 2-letter codes (AU not AUS)',
    ],

  },
  {
    slug: 'price-break-rules',
    detailedDescription: 'Apply "valued over/under $X" rules from official government tariff schedules. Many countries apply different duty rates depending on the declared value of goods. For example, knitted garments valued over $14/kg vs under $14/kg may have different rates. POTAL automatically detects and applies these price-break rules.',
    howToUse: [
      { step: 1, title: 'Include product price', description: 'Set the price field in your classification or calculation request.' },
      { step: 2, title: 'Add weight if applicable', description: 'Some price-break rules use per-kg values, so include weight_kg.' },
      { step: 3, title: 'Classification auto-applies', description: 'The classify endpoint automatically considers price breaks when selecting the HS subheading.' },
      { step: 4, title: 'Review in audit trail', description: 'The classification audit trail shows which price-break rule was applied, if any.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    relatedFeatures: ['hs-code-classification', 'duty-rate-calculation', 'total-landed-cost', 'confidence-score', 'hs-code-validation'],
  },
  {
    slug: 'origin-detection',
    detailedDescription: 'Detect the most likely country of origin from product descriptions, brand names, and manufacturer information. Origin detection is critical for applying the correct duty rates and determining FTA eligibility. The system uses brand-country mapping, manufacturer databases, and product naming conventions.',
    howToUse: [
      { step: 1, title: 'Include product details', description: 'Provide productName, brand, or manufacturer in your classification request.' },
      { step: 2, title: 'Check origin in response', description: 'The countryOfOrigin field in the classification response shows the detected origin.' },
      { step: 3, title: 'Override if known', description: 'If you know the actual origin, set origin in the /calculate request to override detection.' },
      { step: 4, title: 'Impact on duties', description: 'Origin determines which duty rate applies — MFN, preferential, or trade remedy rates.' },
    ],
    apiEndpoint: '/api/v1/classify',
    apiMethod: 'POST',
    relatedFeatures: ['hs-code-classification', 'fta-detection', 'rules-of-origin', 'duty-rate-calculation', 'sanctions-screening'],
    requiredFields: [
      { name: 'productName', type: 'string', required: true, description: 'Product name — include brand or manufacturer if known', example: 'Samsung Galaxy S24 Ultra', tip: 'Brand names help detect origin: Samsung → KR, Bosch → DE, Canon → JP.' },
      { name: 'category', type: 'string', required: false, description: 'Product category', example: 'Electronics', tip: 'Helps narrow origin detection heuristics by product type.' },
      { name: 'origin_country', type: 'string', required: false, description: 'Override detected origin with a known value', example: 'VN', tip: 'If you know the actual origin, set this to skip detection and use the exact value.' },
    ],
    accuracyTips: [
      'Brand names are the strongest signal for origin detection',
      'If the actual origin is known, always set origin_country explicitly',
      'Detection is heuristic-based — for high-stakes shipments, verify with the supplier',
    ],
    commonMistakes: [
      'Assuming brand country = manufacturing country — "Apple" is US brand but products are made in CN/VN/IN',
      'Not providing origin when known — detection is a best-guess fallback, not a substitute for actual origin',
    ],
  },
];

// ─── Trade Compliance Guides (21) ────────────────────

const TRADE_GUIDES: FeatureGuide[] = [
  {
    slug: 'fta-detection',
    detailedDescription: 'Identify applicable Free Trade Agreements across 63 FTAs covering bilateral and multilateral agreements. POTAL checks origin-destination pairs against the full FTA database and returns preferential duty rates, exclusion lists, and rules of origin requirements. Includes USMCA, RCEP, EU FTAs, CPTPP, and more.',
    howToUse: [
      { step: 1, title: 'Specify origin and destination', description: 'GET /api/v1/fta?origin=KR&destination=US to check for applicable FTAs.' },
      { step: 2, title: 'Include HS code', description: 'Add &hsCode=8471 to check if the specific product is eligible for preferential rates.' },
      { step: 3, title: 'Review FTA details', description: 'The response shows the FTA name, preferential rate multiplier, and whether the product is excluded.' },
      { step: 4, title: 'Check rules of origin', description: 'The rulesOfOrigin field lists specific criteria the product must meet for preferential treatment.' },
    ],
    apiEndpoint: '/api/v1/fta',
    apiMethod: 'GET',
    requestExample: '// GET /api/v1/fta?origin=KR&destination=US&hsCode=8471',
    responseExample: JSON.stringify({
      origin: "KR",
      destination: "US",
      hsCode: "8471",
      fta: {
        applicable: true,
        name: "KORUS FTA",
        code: "KORUS",
        preferentialMultiplier: 0,
        isExcluded: false,
      },
      rulesOfOrigin: {
        ftaCode: "KORUS",
        certificateType: "Self-certification",
        accumulationAllowed: true,
      },
    }, null, 2),
    curlExample: `curl "https://potal.app/api/v1/fta?origin=KR&destination=US&hsCode=8471" \\
  -H "X-API-Key: pk_live_your_key"`,
    relatedFeatures: ['rules-of-origin', 'preferential-rates', 'duty-rate-calculation', 'total-landed-cost', 'multi-country-support'],
    requiredFields: [
      { name: 'origin', type: 'string', required: true, description: 'Origin country (ISO 2-letter code)', example: 'KR' },
      { name: 'destination', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'US' },
      { name: 'hsCode', type: 'string', required: false, description: 'HS code (2-10 digits) for product-specific FTA eligibility', example: '8471', tip: 'Some products are excluded from FTAs even if the agreement exists.' },
    ],
    accuracyTips: [
      'Both origin and destination are required for FTA pair lookup',
      'Adding hsCode checks if the specific product is FTA-eligible (some products are excluded)',
      'Use ?country=KR to list ALL FTAs for a single country',
    ],
    commonMistakes: [
      'Providing only one country — both origin AND destination are required',
      'Assuming FTA applies to all products — some HS codes are explicitly excluded',
      'Using country names instead of ISO codes — use "KR" not "Korea"',
    ],

  },
  {
    slug: 'rules-of-origin',
    detailedDescription: 'Verify preferential origin eligibility with certificate requirements for FTA-eligible goods. Rules of origin determine whether a product qualifies for reduced duty rates under a specific trade agreement. POTAL provides the specific criteria including tariff shift rules, value content requirements, and certificate types.',
    howToUse: [
      { step: 1, title: 'Check FTA applicability', description: 'First verify an FTA exists between origin and destination via GET /api/v1/fta.' },
      { step: 2, title: 'Review origin rules', description: 'The rulesOfOrigin field lists criteria like tariff classification change, regional value content, or specific processing.' },
      { step: 3, title: 'Verify compliance', description: 'Ensure your product meets the listed criteria before claiming preferential rates.' },
      { step: 4, title: 'Get certificate type', description: 'Check certificateType for the required documentation (self-certification, EUR.1, Form D, etc.).' },
    ],
    apiEndpoint: '/api/v1/fta',
    apiMethod: 'GET',
    relatedFeatures: ['fta-detection', 'preferential-rates', 'compliance-certificates', 'customs-documentation', 'origin-detection'],
  },
  {
    slug: 'preferential-rates',
    detailedDescription: 'Apply reduced FTA duty rates when origin rules are satisfied. POTAL automatically calculates the preferential rate alongside the standard MFN rate, showing potential savings. The tariffOptimization field in calculation responses recommends the best available rate.',
    howToUse: [
      { step: 1, title: 'Provide origin country', description: 'Include the origin field in your /calculate request to enable FTA rate lookup.' },
      { step: 2, title: 'Check optimization', description: 'The tariffOptimization field shows the optimal rate type and savings vs. MFN.' },
      { step: 3, title: 'Review rate options', description: 'rateOptions lists all available rates including MFN, preferential, and agreement-specific.' },
      { step: 4, title: 'Apply to checkout', description: 'Use the lowest applicable rate in your pricing to maximize competitiveness.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['fta-detection', 'rules-of-origin', 'duty-rate-calculation', 'total-landed-cost', 'anti-dumping-duties'],
  },
  {
    slug: 'anti-dumping-duties',
    detailedDescription: 'Check 119K+ trade remedy cases for anti-dumping duty exposure. Anti-dumping duties are additional tariffs imposed on imports that are priced below fair market value. POTAL cross-references your product\'s HS code and origin country against active anti-dumping orders from the US, EU, and other major markets.',
    howToUse: [
      { step: 1, title: 'Include origin and product', description: 'Provide both the origin country and product details in your /calculate request.' },
      { step: 2, title: 'Check trade remedies', description: 'The calculation result includes anti-dumping duty amounts if applicable.' },
      { step: 3, title: 'Review by firm name', description: 'Add firmName to check company-specific anti-dumping rates (some firms get individual rates).' },
      { step: 4, title: 'Monitor changes', description: 'Anti-dumping orders are updated regularly. POTAL syncs with government databases automatically.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['countervailing-duties', 'safeguard-measures', 'duty-rate-calculation', 'total-landed-cost', 'trade-embargo-check'],
  },
  {
    slug: 'countervailing-duties',
    detailedDescription: 'Identify countervailing (subsidy) duty risks on imports. Countervailing duties offset government subsidies that give foreign producers an unfair price advantage. POTAL checks active CVD orders and calculates the additional duty amount based on the product\'s HS code and origin.',
    howToUse: [
      { step: 1, title: 'Provide product and origin', description: 'Include origin, HS code, and optionally firmName in your /calculate request.' },
      { step: 2, title: 'Review CVD in breakdown', description: 'Countervailing duties appear as a separate line item in the cost breakdown.' },
      { step: 3, title: 'Check combined impact', description: 'Products can be subject to both anti-dumping and countervailing duties simultaneously.' },
      { step: 4, title: 'Plan sourcing', description: 'Use POTAL to compare total costs from different origin countries to optimize sourcing.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['anti-dumping-duties', 'safeguard-measures', 'duty-rate-calculation', 'total-landed-cost', 'fta-detection'],
  },
  {
    slug: 'safeguard-measures',
    detailedDescription: 'Apply safeguard tariffs and exemptions from 15K+ records. Safeguard measures are temporary import restrictions to protect domestic industries from import surges. POTAL tracks active safeguard duties, tariff-rate quotas, and country-specific exemptions.',
    howToUse: [
      { step: 1, title: 'Calculate with full details', description: 'POST /api/v1/calculate with HS code, origin, and destination for complete duty analysis.' },
      { step: 2, title: 'Check for safeguards', description: 'Safeguard duties are included automatically in the total duty calculation.' },
      { step: 3, title: 'Review exemptions', description: 'Some FTA partners are exempt from safeguard measures — check tariffOptimization.' },
      { step: 4, title: 'Monitor quotas', description: 'Tariff-rate quotas have volume limits — once exceeded, higher duty rates apply.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['anti-dumping-duties', 'countervailing-duties', 'duty-rate-calculation', 'fta-detection', 'total-landed-cost'],
  },
  {
    slug: 'sanctions-screening',
    detailedDescription: 'Screen entities against OFAC SDN, BIS Entity List, and 19 global sanctions sources including EU, UN, and UK lists. POTAL uses fuzzy name matching to catch variations and transliterations. Returns match scores, the specific list matched, and a PASS/FAIL/REVIEW decision.',
    howToUse: [
      { step: 1, title: 'Provide entity details', description: 'Include the party name, and optionally country and address for better matching.' },
      { step: 2, title: 'Send screening request', description: 'POST /api/v1/screening with name, country, and optional minScore threshold.' },
      { step: 3, title: 'Review matches', description: 'Check the matches array for any hits. Score > 0.9 is a strong match; 0.8-0.9 is a potential match.' },
      { step: 4, title: 'Act on decision', description: 'PASS = clear, FAIL = blocked party found, REVIEW = potential match requiring manual review.' },
    ],
    apiEndpoint: '/api/v1/screening',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      name: "Acme Trading Co",
      country: "IR",
      minScore: 0.8,
    }, null, 2),
    responseExample: JSON.stringify({
      hasMatches: false,
      totalMatches: 0,
      matches: [],
      embargo: { embargoed: true, programs: [{ program_type: "comprehensive", program_name: "Iran Sanctions" }] },
      decision: "FAIL",
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/screening \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Acme Trading Co","country":"IR","minScore":0.8}'`,
    relatedFeatures: ['denied-party-screening', 'trade-embargo-check', 'export-controls', 'pre-shipment-check', 'restricted-items'],
    requiredFields: [
      { name: 'name', type: 'string', required: true, description: 'Party name to screen', example: 'Acme Trading Co', tip: 'Full legal name gives best match accuracy.' },
      { name: 'country', type: 'string', required: false, description: 'Country (ISO 2-letter code)', example: 'IR', tip: 'Dramatically reduces false positives.' },
      { name: 'address', type: 'string', required: false, description: 'Party address', example: '123 Trade St, Tehran' },
      { name: 'lists', type: 'string[]', required: false, description: 'Specific lists to check (default: all)', example: '["OFAC_SDN", "BIS_ENTITY"]', tip: 'Valid: OFAC_SDN, OFAC_CONS, BIS_ENTITY, BIS_DENIED, BIS_UNVERIFIED, EU_SANCTIONS, UN_SANCTIONS, UK_SANCTIONS' },
      { name: 'minScore', type: 'number', required: false, description: 'Match threshold 0.5-1.0 (default: 0.8)', example: '0.8', tip: 'Lower = more matches but more false positives. 0.8 is recommended.' },
    ],
    accuracyTips: [
      'Always provide country — it enables embargo checks and reduces false positives',
      'Use full legal entity name, not abbreviations',
      'For batch screening, up to 50 parties in one request via the parties array',
      'minScore 0.8 balances accuracy and coverage — lower only for high-risk transactions',
    ],
    commonMistakes: [
      'Screening only the company name without country — misses embargo checks entirely',
      'Setting minScore too low (< 0.7) — floods results with false positives',
      'Not screening all parties in a transaction — check buyer, consignee, and end-user',
    ],

  },
  {
    slug: 'denied-party-screening',
    detailedDescription: 'Check 21K+ denied party entries with fuzzy name matching across 19 international sanctions lists. Supports batch screening of up to 50 parties per request. The system handles name transliterations, aliases, and common spelling variations to minimize false negatives.',
    howToUse: [
      { step: 1, title: 'Single party check', description: 'POST /api/v1/screening with a single name, country, and address.' },
      { step: 2, title: 'Batch screening', description: 'Include a parties array with up to 50 entities to screen in one request.' },
      { step: 3, title: 'Select specific lists', description: 'Add a lists field to limit screening to specific sources (e.g., ["OFAC_SDN", "BIS_ENTITY"]).' },
      { step: 4, title: 'Adjust sensitivity', description: 'Set minScore (default 0.8) to control match sensitivity. Lower values catch more but increase false positives.' },
    ],
    apiEndpoint: '/api/v1/screening',
    apiMethod: 'POST',
    relatedFeatures: ['sanctions-screening', 'trade-embargo-check', 'export-controls', 'country-prohibitions', 'pre-shipment-check'],
  },
  {
    slug: 'export-controls',
    detailedDescription: 'EAR/ITAR export control classification and license determination. Determines whether a product requires an export license based on its ECCN (Export Control Classification Number), destination country, end use, and end user. Covers dual-use goods, military items, and technology transfers.',
    howToUse: [
      { step: 1, title: 'Provide product info', description: 'Include HS code or product name, destination country, and any technical specifications.' },
      { step: 2, title: 'Get ECCN classification', description: 'POST /api/v1/export-controls/classify returns the ECCN and whether it\'s EAR99 (no license needed).' },
      { step: 3, title: 'Check license requirement', description: 'The license_determination field shows if an export license is required and which exceptions may apply.' },
      { step: 4, title: 'Include end use', description: 'Adding end_use information helps determine if license exceptions apply to your specific transaction.' },
    ],
    apiEndpoint: '/api/v1/export-controls/classify',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      product_name: "Industrial CNC machine",
      destination: "CN",
      technical_specs: "5-axis, positioning accuracy 0.001mm",
    }, null, 2),
    responseExample: JSON.stringify({
      eccn_classification: {
        eccn: "2B001",
        ear99: false,
        control_type: "National Security",
        description: "Machine tools for cutting metals",
      },
      license_determination: {
        license_required: true,
        license_type: "Individual License",
        exceptions: [],
        notes: "5-axis CNC machines require license for China",
      },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/export-controls/classify \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"product_name":"Industrial CNC machine","destination":"CN"}'`,
    relatedFeatures: ['eccn-classification', 'dual-use-goods', 'sanctions-screening', 'denied-party-screening', 'country-prohibitions'],
    requiredFields: [
      { name: 'hs_code', type: 'string', required: false, description: 'HS code for ECCN mapping', example: '8459.21', tip: 'At least hs_code OR product_name is required.' },
      { name: 'product_name', type: 'string', required: false, description: 'Product name (if hs_code not provided)', example: 'Industrial CNC machine' },
      { name: 'destination', type: 'string', required: false, description: 'Destination country (ISO 2-letter code)', example: 'CN', tip: 'Required for license determination. Without it, only ECCN classification is returned.' },
      { name: 'technical_specs', type: 'string', required: false, description: 'Technical specifications', example: '5-axis, positioning accuracy 0.001mm', tip: 'Key for determining if product exceeds controlled thresholds.' },
      { name: 'end_use', type: 'string', required: false, description: 'End-use category', example: 'manufacturing' },
    ],
    accuracyTips: [
      'At least hs_code OR product_name is required',
      'destination is needed for license determination — without it, only ECCN is returned',
      'technical_specs helps determine if product exceeds controlled performance thresholds',
    ],
    commonMistakes: [
      'Providing neither hs_code nor product_name — at least one is required',
      'Omitting destination — license requirement cannot be determined without it',
      'Ignoring technical_specs for precision equipment — thresholds matter for dual-use controls',
    ],

  },
  {
    slug: 'eccn-classification',
    detailedDescription: 'Classify products into Export Control Classification Numbers (ECCNs). ECCNs categorize items based on their technical characteristics and capabilities for export control purposes. Most commercial goods are EAR99 (no restrictions), but items with specific technical thresholds may require classification.',
    howToUse: [
      { step: 1, title: 'Describe the product', description: 'Provide the product name, HS code, and key technical specifications.' },
      { step: 2, title: 'Get classification', description: 'POST /api/v1/classify/eccn returns the ECCN code and control category.' },
      { step: 3, title: 'Check if EAR99', description: 'If ear99 is true, no export license is needed for most destinations.' },
      { step: 4, title: 'Review control type', description: 'The control_type field indicates the reason for control (National Security, Missile Technology, etc.).' },
    ],
    apiEndpoint: '/api/v1/classify/eccn',
    apiMethod: 'POST',
    relatedFeatures: ['export-controls', 'dual-use-goods', 'restricted-items', 'sanctions-screening', 'compliance-certificates'],
  },
  {
    slug: 'dangerous-goods-flag',
    detailedDescription: 'Flag hazardous materials and dangerous goods based on HS code and product description. Covers UN hazard classes, IATA/IMDG dangerous goods regulations, and country-specific restrictions on lithium batteries, chemicals, flammables, and other regulated materials.',
    howToUse: [
      { step: 1, title: 'Check product restrictions', description: 'POST /api/v1/restrictions with the product HS code and destination.' },
      { step: 2, title: 'Look for DG flags', description: 'The restrictions array includes dangerous goods classifications if applicable.' },
      { step: 3, title: 'Review shipping requirements', description: 'DG items require special packaging, labeling, and documentation.' },
      { step: 4, title: 'Check carrier acceptance', description: 'Not all carriers accept all DG classes — verify with /shipping/rates.' },
    ],
    apiEndpoint: '/api/v1/restrictions',
    apiMethod: 'POST',
    relatedFeatures: ['restricted-items', 'country-prohibitions', 'pre-shipment-check', 'shipping-rates', 'customs-documentation'],
  },
  {
    slug: 'country-prohibitions',
    detailedDescription: 'Enforce country-specific import bans and product restrictions. Some products are completely prohibited in certain countries regardless of HS code or licensing. POTAL maintains a comprehensive database of country-level prohibitions including religious, cultural, environmental, and security-related bans.',
    howToUse: [
      { step: 1, title: 'Specify destination', description: 'Include the destinationCountry in your /restrictions request.' },
      { step: 2, title: 'Check prohibition status', description: 'The isProhibited field in the response indicates a complete ban.' },
      { step: 3, title: 'Review restriction details', description: 'Each restriction includes the type, description, and license requirements.' },
      { step: 4, title: 'Use in pre-shipment', description: 'Integrate with /verify/pre-shipment for comprehensive compliance checks before shipping.' },
    ],
    apiEndpoint: '/api/v1/restrictions',
    apiMethod: 'POST',
    relatedFeatures: ['restricted-items', 'dangerous-goods-flag', 'sanctions-screening', 'pre-shipment-check', 'trade-embargo-check'],
  },
  {
    slug: 'dual-use-goods',
    detailedDescription: 'Identify dual-use items that have both civilian and military applications and may require export authorization. Dual-use controls are enforced internationally under the Wassenaar Arrangement, the Nuclear Suppliers Group, and other multilateral export control regimes.',
    howToUse: [
      { step: 1, title: 'Classify the product', description: 'POST /api/v1/compliance/export-controls with product details and technical specs.' },
      { step: 2, title: 'Check dual-use status', description: 'The response indicates if the item falls under dual-use control lists.' },
      { step: 3, title: 'Review destination restrictions', description: 'Dual-use controls vary by destination — some countries require licenses, others are embargoed.' },
      { step: 4, title: 'Document compliance', description: 'Keep records of dual-use assessments for audit purposes.' },
    ],
    apiEndpoint: '/api/v1/compliance/export-controls',
    apiMethod: 'POST',
    relatedFeatures: ['export-controls', 'eccn-classification', 'sanctions-screening', 'country-prohibitions', 'restricted-items'],
  },
  {
    slug: 'trade-embargo-check',
    detailedDescription: 'Verify trade routes against comprehensive embargo lists. Embargoes restrict or prohibit trade with specific countries, regions, or entities. POTAL checks both comprehensive embargoes (all trade blocked) and sectoral sanctions (specific industries restricted).',
    howToUse: [
      { step: 1, title: 'Screen the destination', description: 'POST /api/v1/screening with the destination country to check embargo status.' },
      { step: 2, title: 'Review embargo result', description: 'The embargo field shows whether the country is embargoed and which programs apply.' },
      { step: 3, title: 'Check sectoral sanctions', description: 'Some embargoes only affect specific sectors (energy, finance, defense).' },
      { step: 4, title: 'Combine with party screening', description: 'Always screen both the country and the specific parties involved in the transaction.' },
    ],
    apiEndpoint: '/api/v1/screening',
    apiMethod: 'POST',
    relatedFeatures: ['sanctions-screening', 'denied-party-screening', 'country-prohibitions', 'export-controls', 'pre-shipment-check'],
  },
  {
    slug: 'customs-documentation',
    detailedDescription: 'Generate commercial invoices, packing lists, and certificates of origin in a single API call. Provide shipper, consignee, and item details, and POTAL generates all required customs documents with proper formatting and regulatory compliance.',
    howToUse: [
      { step: 1, title: 'Prepare shipment data', description: 'Collect shipper info, consignee info, item details (HS code, description, value, quantity, weight).' },
      { step: 2, title: 'Generate documents', description: 'POST /api/v1/customs-docs/generate with the complete shipment data.' },
      { step: 3, title: 'Download documents', description: 'The response includes structured document data for commercial invoice, packing list, and certificates.' },
      { step: 4, title: 'Export as PDF', description: 'Use the /documents/pdf endpoint to convert document data into printable PDF format.' },
    ],
    apiEndpoint: '/api/v1/customs-docs/generate',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      shipper: { name: "Acme Corp", address: "123 Main St, Shanghai", country: "CN" },
      consignee: { name: "US Buyer LLC", address: "456 Oak Ave, New York", country: "US" },
      items: [{ hs_code: "6109.10", description: "Cotton t-shirts", value: 500, quantity: 100, weight: 25, origin: "CN" }],
      destination: "US",
      incoterms: "DDP",
      currency: "USD",
    }, null, 2),
    responseExample: JSON.stringify({
      documents: {
        commercial_invoice: { invoice_number: "INV-2026-001", total_value: 500, items: ["..."] },
        packing_list: { packages: 1, total_weight: 25, items: ["..."] },
        certificate_of_origin: { origin: "CN", certifier: "Self-certified" },
      },
      timestamp: "2026-03-29T12:00:00Z",
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/customs-docs/generate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"shipper":{"name":"Acme Corp","country":"CN"},"consignee":{"name":"US Buyer","country":"US"},"items":[{"hs_code":"6109.10","description":"Cotton t-shirts","value":500,"quantity":100,"weight":25,"origin":"CN"}],"destination":"US"}'`,
    relatedFeatures: ['customs-forms', 'pdf-reports', 'compliance-certificates', 'pre-shipment-check', 'ics2-pre-arrival'],
    requiredFields: [
      { name: 'doc_type', type: 'string', required: true, description: 'Document type', example: 'commercial_invoice', tip: 'Options: commercial_invoice, packing_list, certificate_of_origin, customs_declaration, certificate_of_compliance, phytosanitary_certificate' },
      { name: 'shipment.shipper.name', type: 'string', required: true, description: 'Shipper company name', example: 'Acme Corp' },
      { name: 'shipment.consignee.name', type: 'string', required: true, description: 'Consignee/buyer name', example: 'US Buyer LLC' },
      { name: 'shipment.items[].hs_code', type: 'string', required: true, description: 'HS code for each item', example: '6109.10' },
      { name: 'shipment.items[].description', type: 'string', required: true, description: 'Item description', example: 'Cotton t-shirts' },
      { name: 'shipment.items[].value', type: 'number', required: true, description: 'Item value', example: '500' },
      { name: 'shipment.items[].quantity', type: 'number', required: true, description: 'Quantity', example: '100' },
      { name: 'shipment.items[].weight', type: 'number', required: true, description: 'Weight in kg', example: '25' },
      { name: 'shipment.items[].origin', type: 'string', required: true, description: 'Country of origin (ISO code)', example: 'CN' },
      { name: 'shipment.destination', type: 'string', required: true, description: 'Destination country', example: 'US' },
      { name: 'shipment.incoterms', type: 'string', required: false, description: 'Incoterms (default: DDP)', example: 'DDP' },
      { name: 'shipment.currency', type: 'string', required: false, description: 'Currency code (default: USD)', example: 'USD' },
    ],
    accuracyTips: [
      'All item fields (hs_code, description, value, quantity, weight, origin) are required',
      'HS codes should be at least 4 digits — warnings are generated for shorter codes',
      'Values above $100,000 trigger validation warnings',
    ],
    commonMistakes: [
      'Missing item-level origin field — each item needs its own origin country',
      'Providing hs_code with fewer than 4 digits — use at least 4 digits for accuracy',
      'Forgetting doc_type — it determines which document template is generated',
    ],

  },
  {
    slug: 'ics2-pre-arrival',
    detailedDescription: 'EU ICS2 (Import Control System 2) pre-arrival safety and security declaration support. Starting 2024, all goods entering the EU require advance electronic data for risk analysis before arrival. POTAL helps generate the required data fields for ICS2 compliance.',
    howToUse: [
      { step: 1, title: 'Classify the goods', description: 'Ensure all items have accurate HS codes at the 6-digit level or beyond.' },
      { step: 2, title: 'Prepare shipment data', description: 'Collect shipper, consignee, item descriptions, and routing information.' },
      { step: 3, title: 'Generate ICS2 data', description: 'POST /api/v1/ics2 with the required fields for pre-arrival declaration.' },
      { step: 4, title: 'Submit to customs', description: 'Forward the generated data to the EU customs system before goods depart.' },
    ],
    apiEndpoint: '/api/v1/ics2',
    apiMethod: 'POST',
    relatedFeatures: ['customs-documentation', 'customs-forms', 'ioss-support', 'pre-shipment-check', 'total-landed-cost'],
  },
  {
    slug: 'ioss-support',
    detailedDescription: 'EU Import One-Stop Shop (IOSS) VAT collection and reporting for imports under EUR 150. IOSS allows sellers to collect EU VAT at the point of sale, simplifying customs clearance and eliminating the need for buyers to pay VAT on delivery. POTAL calculates the correct IOSS VAT amount per EU member state.',
    howToUse: [
      { step: 1, title: 'Check IOSS eligibility', description: 'IOSS applies to B2C shipments to EU with value under EUR 150.' },
      { step: 2, title: 'Calculate with EU destination', description: 'POST /api/v1/calculate with an EU destination country — IOSS VAT is automatically applied.' },
      { step: 3, title: 'Include IOSS number', description: 'If registered for IOSS, include your IOSS number for proper documentation.' },
      { step: 4, title: 'Generate customs docs', description: 'IOSS documentation is included in customs declaration generation.' },
    ],
    apiEndpoint: '/api/v1/calculate',
    apiMethod: 'POST',
    relatedFeatures: ['tax-calculation-vat-gst', 'ics2-pre-arrival', 'de-minimis-check', 'customs-documentation', 'total-landed-cost'],
  },
  {
    slug: 'type-86-entry',
    detailedDescription: 'US Type 86 simplified customs entry for low-value shipments under $800 (Section 321 de minimis). Type 86 allows faster customs clearance with minimal data requirements. POTAL generates the required data elements for Type 86 filings.',
    howToUse: [
      { step: 1, title: 'Check eligibility', description: 'Type 86 applies to US imports with declared value under $800.' },
      { step: 2, title: 'Prepare entry data', description: 'Provide HS code, value, shipper, and consignee information.' },
      { step: 3, title: 'Generate Type 86 data', description: 'POST /api/v1/customs/type86 generates the required data elements.' },
      { step: 4, title: 'Submit to CBP', description: 'Forward the generated data to your customs broker or ACE system.' },
    ],
    apiEndpoint: '/api/v1/customs/type86',
    apiMethod: 'POST',
    relatedFeatures: ['de-minimis-check', 'customs-documentation', 'customs-forms', 'total-landed-cost', 'pre-shipment-check'],
  },
  {
    slug: 'pre-shipment-check',
    detailedDescription: 'Comprehensive pre-shipment screening combining cost calculation, compliance checks, sanctions screening, and document verification in a single call. Returns a checklist of PASS/FAIL/WARNING items with an overall risk score and recommendations.',
    howToUse: [
      { step: 1, title: 'Prepare shipment details', description: 'Include HS code, origin, destination, value, weight, and shipper name.' },
      { step: 2, title: 'Run the check', description: 'POST /api/v1/verify/pre-shipment runs all compliance and cost checks.' },
      { step: 3, title: 'Review the checklist', description: 'Each check item shows PASS, FAIL, or WARNING status with detailed explanations.' },
      { step: 4, title: 'Address failures', description: 'Fix any FAIL items before shipping. The recommendations field provides specific guidance.' },
    ],
    apiEndpoint: '/api/v1/verify/pre-shipment',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      hs_code: "8471.30",
      origin: "CN",
      destination: "US",
      declared_value: 500,
      weight_kg: 2.5,
      shipper_name: "Shenzhen Tech Co",
    }, null, 2),
    responseExample: JSON.stringify({
      overallStatus: "PASS",
      riskScore: 15,
      checklist: [
        { item: "HS Code Validity", status: "PASS", detail: "Valid 6-digit HS code" },
        { item: "Sanctions Screening", status: "PASS", detail: "No matches found" },
        { item: "Restrictions Check", status: "PASS", detail: "No restrictions" },
        { item: "Embargo Check", status: "PASS", detail: "No embargo" },
      ],
      recommendations: [],
      missingDocs: [],
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/verify/pre-shipment \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"hs_code":"8471.30","origin":"CN","destination":"US","declared_value":500,"shipper_name":"Shenzhen Tech Co"}'`,
    relatedFeatures: ['sanctions-screening', 'restricted-items', 'customs-documentation', 'total-landed-cost', 'dangerous-goods-flag'],
    requiredFields: [
      { name: 'hs_code', type: 'string', required: true, description: 'HS code (digits only)', example: '8471.30' },
      { name: 'destination', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'US' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country (ISO 2-letter code)', example: 'CN' },
      { name: 'declared_value', type: 'number', required: false, description: 'Declared shipment value', example: '500' },
      { name: 'weight_kg', type: 'number', required: false, description: 'Weight in kg', example: '2.5' },
      { name: 'shipper_name', type: 'string', required: false, description: 'Shipper name for sanctions screening', example: 'Shenzhen Tech Co', tip: 'Include for sanctions screening — otherwise only embargo check runs.' },
      { name: 'documents_provided', type: 'string[]', required: false, description: 'List of documents already prepared', example: '["commercial_invoice", "packing_list"]', tip: 'Helps identify missing required documents before shipping.' },
    ],
    accuracyTips: [
      'hs_code + destination are the minimum required fields',
      'Adding shipper_name enables sanctions screening of the exporter',
      'documents_provided helps identify missing customs paperwork before shipping',
      'US imports over $2,500 require a customs bond — declared_value triggers this check',
    ],
    commonMistakes: [
      'Using HS codes with non-numeric characters — only digits are accepted',
      'Not providing shipper_name — sanctions screening is skipped without it',
    ],

  },
  {
    slug: 'customs-forms',
    detailedDescription: 'Auto-generate CN22, CN23, and customs declaration forms for international postal and commercial shipments. These forms are required by customs authorities worldwide for package clearance. POTAL fills in all required fields based on your shipment data.',
    howToUse: [
      { step: 1, title: 'Prepare item data', description: 'Collect HS codes, descriptions, values, and quantities for all items in the shipment.' },
      { step: 2, title: 'Generate forms', description: 'POST /api/v1/customs-docs/generate creates CN22/CN23 and declaration forms.' },
      { step: 3, title: 'Print and attach', description: 'Print the generated forms and attach them to the package exterior.' },
      { step: 4, title: 'Keep copies', description: 'Retain copies for your records and customs audit purposes.' },
    ],
    apiEndpoint: '/api/v1/customs-docs/generate',
    apiMethod: 'POST',
    relatedFeatures: ['customs-documentation', 'pdf-reports', 'ics2-pre-arrival', 'type-86-entry', 'pre-shipment-check'],
  },
  {
    slug: 'compliance-certificates',
    detailedDescription: 'Generate compliance and origin certificates for customs clearance. Includes certificates of origin, conformity certificates, and trade compliance attestations needed for preferential treatment under FTAs.',
    howToUse: [
      { step: 1, title: 'Determine required certificates', description: 'Different destinations and FTAs require different certificate types.' },
      { step: 2, title: 'Provide origin evidence', description: 'Include manufacturing details, material sourcing, and value addition data.' },
      { step: 3, title: 'Generate certificate', description: 'The customs-docs endpoint includes certificate of origin in its output.' },
      { step: 4, title: 'Submit with shipment', description: 'Include the certificate with customs documentation for preferential rate claims.' },
    ],
    relatedFeatures: ['rules-of-origin', 'customs-documentation', 'fta-detection', 'customs-forms', 'pdf-reports'],
  },
];

// ─── Template-based guides for remaining categories ──

function makeGuide(slug: string, related: string[], opts?: { endpoint?: string; method?: string }): FeatureGuide {
  return {
    slug,
    detailedDescription: '', // Filled by page from feature.description
    howToUse: [],
    apiEndpoint: opts?.endpoint,
    apiMethod: opts?.method,
    relatedFeatures: related,
  };
}

const TAX_GUIDES: FeatureGuide[] = [
  {
    slug: 'tax-exemptions',
    detailedDescription: 'Manage and apply tax exemption certificates per jurisdiction. Upload exemption certificates for specific product categories or buyer types, and POTAL will automatically apply zero-rate or reduced-rate tax calculations when applicable.',
    howToUse: [
      { step: 1, title: 'Identify exemptions', description: 'Determine which tax exemptions apply based on product type, buyer status, or jurisdiction.' },
      { step: 2, title: 'Register exemption', description: 'POST /api/v1/tax/exemption with the exemption certificate details.' },
      { step: 3, title: 'Auto-apply in calculations', description: 'Subsequent calculations automatically apply registered exemptions.' },
      { step: 4, title: 'Manage certificates', description: 'Track expiration dates and renewal requirements for each certificate.' },
    ],
    apiEndpoint: '/api/v1/tax/exemption',
    apiMethod: 'POST',
    relatedFeatures: ['tax-calculation-vat-gst', 'us-state-sales-tax', 'vat-registration', 'total-landed-cost', 'compliance-reports'],
  },
  {
    slug: 'sub-national-tax',
    detailedDescription: 'Calculate state, province, and regional tax rates accurately. Many countries have multi-level tax systems where national, regional, and local taxes stack. POTAL handles the complexity of sub-national taxation for the US, Canada, Australia, Brazil, India, and more.',
    howToUse: [
      { step: 1, title: 'Provide location', description: 'Include state/province code or postal code in your tax calculation request.' },
      { step: 2, title: 'Check combined rate', description: 'The response shows the combined rate broken down by jurisdiction level.' },
      { step: 3, title: 'Handle exemptions', description: 'Some states exempt certain product categories — POTAL applies these automatically.' },
      { step: 4, title: 'Multi-jurisdiction', description: 'For marketplace sellers, check nexus rules to determine where you need to collect.' },
    ],
    apiEndpoint: '/api/v1/tax/us-sales-tax',
    apiMethod: 'POST',
    relatedFeatures: ['us-state-sales-tax', 'tax-calculation-vat-gst', 'tax-exemptions', 'total-landed-cost', 'digital-services-tax'],
  },
  {
    slug: 'digital-services-tax',
    detailedDescription: 'Apply DST rates for digital goods and services across jurisdictions. An increasing number of countries are implementing Digital Services Taxes on electronically supplied services, digital content, and online marketplace transactions.',
    howToUse: [
      { step: 1, title: 'Classify as digital', description: 'Set the product category to digital goods or services.' },
      { step: 2, title: 'Provide destination', description: 'DST rates vary by country — specify the buyer\'s jurisdiction.' },
      { step: 3, title: 'Calculate tax', description: 'POST /api/v1/tax/digital-services returns the applicable DST rate and amount.' },
      { step: 4, title: 'Handle exemptions', description: 'Some jurisdictions exempt B2B transactions from DST.' },
    ],
    apiEndpoint: '/api/v1/tax/digital-services',
    apiMethod: 'POST',
    relatedFeatures: ['tax-calculation-vat-gst', 'sub-national-tax', 'vat-registration', 'ioss-support', 'total-landed-cost'],
  },
  {
    slug: 'us-state-sales-tax',
    detailedDescription: 'ZIP-level US sales tax calculation with nexus rules and marketplace facilitator laws. Covers all 50 states, 10,000+ local jurisdictions, and special tax districts. Automatically applies product-specific exemptions for groceries, clothing, prescription medicine, and more.',
    howToUse: [
      { step: 1, title: 'Provide location', description: 'Include state code and/or ZIP code in your request. ZIP gives the most accurate rate.' },
      { step: 2, title: 'Add product details', description: 'Set productCategory for automatic exemption checking (e.g., "groceries", "clothing").' },
      { step: 3, title: 'Check nexus', description: 'Include sellerState to determine if you have nexus (collection obligation) in the buyer\'s state.' },
      { step: 4, title: 'Marketplace rules', description: 'Add marketplace field for marketplace facilitator law compliance.' },
    ],
    apiEndpoint: '/api/v1/tax/us-sales-tax',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      state: "CA",
      zipcode: "90210",
      productValue: 100,
      productCategory: "clothing",
    }, null, 2),
    responseExample: JSON.stringify({
      state: "CA",
      stateName: "California",
      zipcode: "90210",
      combinedRatePercent: 9.5,
      taxBreakdown: { stateRate: 7.25, countyRate: 1.0, cityRate: 1.25, specialRate: 0 },
      estimatedTax: 9.50,
      nexus: { hasNexus: true, reason: "economic_nexus" },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/tax/us-sales-tax \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"state":"CA","zipcode":"90210","productValue":100}'`,
    relatedFeatures: ['sub-national-tax', 'tax-calculation-vat-gst', 'tax-exemptions', 'total-landed-cost', 'de-minimis-check'],
    requiredFields: [
      { name: 'state', type: 'string', required: false, description: 'US state code (2-letter)', example: 'CA', tip: 'Either state OR zipcode is required. Both gives best accuracy.' },
      { name: 'zipcode', type: 'string', required: false, description: 'US ZIP code (5-digit or ZIP+4)', example: '90210', tip: 'ZIP code gives most precise rate including city and special district taxes.' },
      { name: 'productValue', type: 'number', required: false, description: 'Product value for tax amount calculation', example: '100' },
      { name: 'productCategory', type: 'string', required: false, description: 'Category for exemption check', example: 'clothing', tip: 'Options: groceries, clothing, prescription_medicine, medical_equipment' },
      { name: 'sellerState', type: 'string', required: false, description: 'Seller state for nexus determination', example: 'NY' },
      { name: 'marketplace', type: 'string', required: false, description: 'Marketplace name for facilitator rules', example: 'Amazon' },
    ],
    accuracyTips: [
      'zipcode gives the most accurate rate — state-level rate can differ by 2-4% from actual',
      'productCategory enables automatic exemption checking (e.g., clothing exempt in PA)',
      'sellerState determines if economic nexus applies',
    ],
    commonMistakes: [
      'Using only state without zipcode — misses county, city, and special district rates',
      'Wrong ZIP format — use XXXXX or XXXXX-XXXX only',
      'Not providing productCategory — some states exempt groceries, clothing, or medicine',
    ],

  },
  {
    slug: 'specialized-tax',
    detailedDescription: 'Telecom, lodging, and 12 country-specific tax calculations beyond standard VAT/GST. Some jurisdictions impose special taxes on telecommunications, hospitality, environmental levies, luxury goods, and other specific categories.',
    howToUse: [
      { step: 1, title: 'Identify tax type', description: 'Specify the product/service category for specialized tax lookup.' },
      { step: 2, title: 'Send calculation', description: 'POST /api/v1/tax/specialized with product details and jurisdiction.' },
      { step: 3, title: 'Review breakdown', description: 'The response shows each applicable specialized tax separately.' },
      { step: 4, title: 'Combine with standard', description: 'Specialized taxes are additive to standard VAT/GST.' },
    ],
    apiEndpoint: '/api/v1/tax/specialized',
    apiMethod: 'POST',
    relatedFeatures: ['tax-calculation-vat-gst', 'sub-national-tax', 'digital-services-tax', 'total-landed-cost', 'compliance-reports'],
  },
  {
    slug: 'vat-registration',
    detailedDescription: 'Verify VAT registration numbers and validate tax IDs. Check if a business is VAT-registered in a specific jurisdiction, validate the format of tax identification numbers, and retrieve company details from official government databases.',
    howToUse: [
      { step: 1, title: 'Provide VAT number', description: 'Submit the VAT/tax ID number with the country code for validation.' },
      { step: 2, title: 'Check validity', description: 'POST /api/v1/tax/vat-registration verifies the number against official databases.' },
      { step: 3, title: 'Get company details', description: 'Valid registrations return the registered company name and address.' },
      { step: 4, title: 'Use for B2B', description: 'Valid B2B VAT numbers may qualify for reverse-charge (zero-rate) treatment.' },
    ],
    apiEndpoint: '/api/v1/tax/vat-registration',
    apiMethod: 'POST',
    relatedFeatures: ['tax-calculation-vat-gst', 'ioss-support', 'e-invoice', 'tax-exemptions', 'compliance-reports'],
  },
  {
    slug: 'e-invoice',
    detailedDescription: 'Generate compliant electronic invoices for jurisdictions requiring them. An increasing number of countries mandate e-invoicing for B2B and B2G transactions. POTAL generates invoices in the required format (UBL, CII, FacturX, etc.) with digital signatures.',
    howToUse: [
      { step: 1, title: 'Check requirements', description: 'Determine if the destination country requires e-invoicing.' },
      { step: 2, title: 'Provide invoice data', description: 'Include seller, buyer, item details, and tax calculations.' },
      { step: 3, title: 'Generate e-invoice', description: 'POST /api/v1/invoicing/e-invoice creates the compliant document.' },
      { step: 4, title: 'Submit to authority', description: 'Some countries require real-time submission to tax authorities.' },
    ],
    apiEndpoint: '/api/v1/invoicing/e-invoice',
    apiMethod: 'POST',
    relatedFeatures: ['vat-registration', 'customs-documentation', 'pdf-reports', 'tax-calculation-vat-gst', 'compliance-reports'],
  },
];

const SHIPPING_GUIDES: FeatureGuide[] = [
  {
    slug: 'shipping-rates',
    detailedDescription: 'Compare shipping rates across 8 carriers including DHL, FedEx, UPS, USPS, Royal Mail, and more. Get real-time quotes with estimated delivery times, and POTAL recommends the cheapest, fastest, and best-value options.',
    howToUse: [
      { step: 1, title: 'Specify route', description: 'Provide origin country, destination country, and package weight.' },
      { step: 2, title: 'Add dimensions', description: 'Include package dimensions for accurate dimensional weight pricing.' },
      { step: 3, title: 'Get quotes', description: 'POST /api/v1/shipping/rates returns rates from all available carriers.' },
      { step: 4, title: 'Use recommendations', description: 'Check the recommendation field for cheapest, fastest, and best-value options.' },
    ],
    apiEndpoint: '/api/v1/shipping/rates',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      originCountry: "CN",
      destinationCountry: "US",
      weightKg: 2.5,
      declaredValue: 100,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
    }, null, 2),
    responseExample: JSON.stringify({
      rates: [
        { carrier: "DHL Express", service: "Express Worldwide", rate: 45.50, estimatedDays: 3 },
        { carrier: "FedEx", service: "International Economy", rate: 38.20, estimatedDays: 5 },
        { carrier: "UPS", service: "Worldwide Expedited", rate: 42.00, estimatedDays: 4 },
      ],
      recommendation: {
        cheapest: { carrier: "FedEx", rate: 38.20 },
        fastest: { carrier: "DHL Express", estimatedDays: 3 },
      },
      totalOptions: 3,
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/shipping/rates \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"originCountry":"CN","destinationCountry":"US","weightKg":2.5,"declaredValue":100}'`,
    relatedFeatures: ['carrier-integration', 'ddp-quote', 'dimensional-weight', 'total-landed-cost', 'label-generation'],
    requiredFields: [
      { name: 'originCountry', type: 'string', required: true, description: 'Origin country (ISO 2-letter code)', example: 'CN' },
      { name: 'destinationCountry', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'US' },
      { name: 'weightKg', type: 'number', required: true, description: 'Package weight in kg (must be > 0)', example: '2.5' },
      { name: 'declaredValue', type: 'number', required: false, description: 'Declared shipment value for insurance', example: '100' },
      { name: 'lengthCm', type: 'number', required: false, description: 'Package length in cm', example: '30', tip: 'All 3 dimensions needed for dimensional weight calculation.' },
      { name: 'widthCm', type: 'number', required: false, description: 'Package width in cm', example: '20' },
      { name: 'heightCm', type: 'number', required: false, description: 'Package height in cm', example: '15' },
    ],
    accuracyTips: [
      'originCountry + destinationCountry + weightKg are all required',
      'Providing all 3 dimensions enables dimensional weight — carriers bill the higher of actual vs dimensional',
      'declaredValue affects insurance cost estimation',
    ],
    commonMistakes: [
      'Providing only 1 or 2 dimensions — all 3 (length, width, height) are needed for dimensional weight',
      'Setting weightKg to 0 — must be greater than 0',
      'Using snake_case and camelCase inconsistently — both are accepted but pick one style',
    ],

  },
  {
    slug: 'carrier-integration',
    detailedDescription: 'Connect with major shipping carriers (DHL, FedEx, UPS, USPS, and 50+ regional carriers) to get live shipping rates alongside duty and tax calculations. Carrier integration enables accurate total landed cost with real shipping quotes.',
    howToUse: [
      { step: 1, title: 'Connect carrier accounts', description: 'Add your carrier API credentials in Dashboard > Integrations > Carriers.' },
      { step: 2, title: 'Get live rates', description: 'Include carrier preference in your calculate request to receive live shipping quotes.' },
      { step: 3, title: 'Compare options', description: 'The response includes multiple carrier/service options sorted by price or delivery time.' },
      { step: 4, title: 'Auto-select cheapest', description: 'Set a default carrier selection strategy (cheapest, fastest, or preferred carrier).' },
    ],
    relatedFeatures: ['shipping-rates', 'label-generation', 'tracking', 'ddp-quote', 'multi-package'],
  },
  {
    slug: 'label-generation',
    detailedDescription: 'Generate shipping labels with customs declarations pre-filled from your landed cost calculation. Labels include CN22/CN23 customs forms, commercial invoice data, and HS codes — ready for international shipping.',
    howToUse: [
      { step: 1, title: 'Calculate landed cost first', description: 'Run a landed cost calculation to get HS codes, duty amounts, and customs data.' },
      { step: 2, title: 'Generate label', description: 'POST /api/v1/shipping/labels with the calculation ID and carrier preference.' },
      { step: 3, title: 'Download or print', description: 'The response includes a PDF download URL for the shipping label with customs forms attached.' },
      { step: 4, title: 'Batch labels', description: 'Generate labels for multiple shipments in a single request for high-volume operations.' },
    ],
    apiEndpoint: '/api/v1/shipping/labels',
    apiMethod: 'POST',
    relatedFeatures: ['shipping-rates', 'carrier-integration', 'customs-forms', 'tracking', 'multi-package'],
  },
  {
    slug: 'tracking',
    detailedDescription: 'Track international shipments across carriers with customs clearance status updates. Monitor when packages clear customs, are held for inspection, or require additional documentation. Supports webhook notifications for status changes.',
    howToUse: [
      { step: 1, title: 'Add tracking number', description: 'Enter the carrier tracking number in Dashboard > Shipments or via the tracking API endpoint.' },
      { step: 2, title: 'Monitor status', description: 'View real-time status including customs clearance progress and estimated delivery date.' },
      { step: 3, title: 'Set up notifications', description: 'Configure webhook or email alerts for key events: shipped, in customs, cleared, delivered.' },
      { step: 4, title: 'Share with buyers', description: 'Provide a tracking page link to buyers so they can monitor their shipment\'s customs status.' },
    ],
    relatedFeatures: ['shipping-rates', 'carrier-integration', 'label-generation', 'webhooks', 'order-sync'],
  },
  {
    slug: 'ddp-quote',
    detailedDescription: 'Compare DDP (Delivered Duty Paid) vs DDU (Delivered Duty Unpaid) costs with itemized fee breakdown. Shows buyers exactly what they\'ll pay at the door vs. at delivery, helping them make informed shipping decisions.',
    howToUse: [
      { step: 1, title: 'Provide shipment details', description: 'Include product, price, origin, destination, and weight.' },
      { step: 2, title: 'Get comparison', description: 'POST /api/v1/calculate/ddp-vs-ddu returns both DDP and DDU totals side by side.' },
      { step: 3, title: 'Review breakdown', description: 'Each option shows the full cost breakdown including duties, taxes, and fees.' },
      { step: 4, title: 'Let buyer choose', description: 'Display both options at checkout to let buyers pick their preference.' },
    ],
    apiEndpoint: '/api/v1/calculate/ddp-vs-ddu',
    apiMethod: 'POST',
    relatedFeatures: ['total-landed-cost', 'shipping-rates', 'checkout-integration', 'duty-rate-calculation', 'tax-calculation-vat-gst'],
  },
  {
    slug: 'dimensional-weight',
    detailedDescription: 'Calculate dimensional (volumetric) weight for international shipments. Carriers charge based on whichever is greater: actual weight or dimensional weight. POTAL computes both and identifies the billable weight, preventing unexpected shipping surcharges.',
    howToUse: [
      { step: 1, title: 'Provide package dimensions', description: 'Include length, width, and height in centimeters along with actual weight in kilograms.' },
      { step: 2, title: 'Get billable weight', description: 'The API returns both actual and dimensional weight, highlighting which one the carrier will bill.' },
      { step: 3, title: 'Compare across carriers', description: 'Different carriers use different divisors (5000, 6000). POTAL calculates for each carrier.' },
      { step: 4, title: 'Optimize packaging', description: 'Use the results to identify if repackaging could reduce shipping costs.' },
    ],
    apiEndpoint: '/api/v1/shipping/dim-weight',
    apiMethod: 'POST',
    relatedFeatures: ['shipping-rates', 'multi-package', 'carrier-integration', 'total-landed-cost', 'insurance-calc'],
  },
  {
    slug: 'insurance-calc',
    detailedDescription: 'Calculate shipping insurance premiums for international shipments based on declared value, route, and product category. POTAL provides insurance cost estimates that can be included in the total landed cost calculation for accurate DDP pricing.',
    howToUse: [
      { step: 1, title: 'Declare shipment value', description: 'Provide the product value, origin, and destination country.' },
      { step: 2, title: 'Select coverage type', description: 'Choose between basic carrier liability and full replacement value insurance.' },
      { step: 3, title: 'Get premium estimate', description: 'The API returns the insurance premium based on route risk, value, and product category.' },
      { step: 4, title: 'Include in landed cost', description: 'Add the insurance cost to your total landed cost calculation for accurate DDP quotes.' },
    ],
    apiEndpoint: '/api/v1/shipping/insurance',
    apiMethod: 'POST',
    relatedFeatures: ['shipping-rates', 'total-landed-cost', 'ddp-quote', 'carrier-integration', 'returns-management'],
  },
  {
    slug: 'returns-management',
    detailedDescription: 'Cross-border returns with duty drawback calculations. When returned goods re-enter the origin country, you may be eligible for a refund of duties paid on the original import. POTAL calculates potential drawback amounts and generates return documentation.',
    howToUse: [
      { step: 1, title: 'Initiate return', description: 'POST /api/v1/returns/process with the original shipment details.' },
      { step: 2, title: 'Calculate drawback', description: 'The response shows eligible duty drawback amounts.' },
      { step: 3, title: 'Generate return docs', description: 'Required customs documentation for the return shipment is generated.' },
      { step: 4, title: 'Track the claim', description: 'Monitor the duty drawback claim status through the dashboard.' },
    ],
    apiEndpoint: '/api/v1/returns/process',
    apiMethod: 'POST',
    relatedFeatures: ['customs-documentation', 'total-landed-cost', 'duty-rate-calculation', 'tracking', 'shipping-rates'],
  },
  {
    slug: 'multi-package',
    detailedDescription: 'Handle shipments with multiple packages under a single order. POTAL calculates landed cost for each package individually and provides a consolidated total, accounting for different weights, dimensions, and contents across packages.',
    howToUse: [
      { step: 1, title: 'Define packages', description: 'Create an array of packages, each with its own weight, dimensions, and declared contents.' },
      { step: 2, title: 'Send consolidated request', description: 'POST /api/v1/shipping/multi-package with all packages in a single API call.' },
      { step: 3, title: 'Review per-package costs', description: 'The response includes individual package costs and a consolidated total with duties and taxes.' },
      { step: 4, title: 'Generate labels', description: 'Each package gets its own customs declaration while sharing a single shipment reference.' },
    ],
    apiEndpoint: '/api/v1/shipping/multi-package',
    apiMethod: 'POST',
    relatedFeatures: ['shipping-rates', 'dimensional-weight', 'carrier-integration', 'label-generation', 'total-landed-cost'],
  },
  {
    slug: '3pl-integration',
    detailedDescription: 'Connect POTAL with third-party logistics (3PL) providers to automate landed cost calculations at the warehouse level. Integrate with fulfillment centers to calculate duties and taxes before orders ship, ensuring accurate DDP pricing from any warehouse location.',
    howToUse: [
      { step: 1, title: 'Register warehouse locations', description: 'Add your 3PL warehouse addresses and their associated origin countries in the Dashboard.' },
      { step: 2, title: 'Connect via API', description: 'Use the REST API or webhooks to receive order data from your 3PL system.' },
      { step: 3, title: 'Auto-calculate at fulfillment', description: 'POTAL automatically calculates landed cost based on which warehouse fulfills the order.' },
      { step: 4, title: 'Sync documentation', description: 'Customs documents are generated and sent to the 3PL for inclusion with the shipment.' },
    ],
    relatedFeatures: ['multi-warehouse', 'inventory-sync', 'order-sync', 'shipping-rates', 'carrier-integration'],
  },
  {
    slug: 'multi-warehouse',
    detailedDescription: 'Manage landed cost calculations across multiple warehouse locations. When you fulfill orders from warehouses in different countries, POTAL automatically adjusts duty rates, tax calculations, and shipping costs based on the actual origin warehouse.',
    howToUse: [
      { step: 1, title: 'Configure warehouses', description: 'Register each warehouse location with its country, region, and available inventory.' },
      { step: 2, title: 'Route-based calculation', description: 'POTAL calculates landed cost from the optimal warehouse based on cost or delivery time.' },
      { step: 3, title: 'Compare fulfillment options', description: 'Get side-by-side landed cost comparisons for fulfilling from different warehouse locations.' },
      { step: 4, title: 'Apply FTA benefits', description: 'Different origin countries may qualify for different FTA preferential rates.' },
    ],
    relatedFeatures: ['3pl-integration', 'inventory-sync', 'shipping-rates', 'order-sync', 'multi-package'],
  },
];

// ─── Remaining categories: use compact format ────────

const PLATFORM_GUIDES: FeatureGuide[] = [
  {
    slug: 'multi-language-ui',
    detailedDescription: 'POTAL supports 51 languages across the entire UI — dashboard, widget, error messages, and documentation. Sellers can embed the widget in their store in any supported language, and the dashboard auto-detects the user\'s browser language.',
    howToUse: [
      { step: 1, title: 'Set language preference', description: 'Go to Dashboard > Settings > Language and select your preferred language.' },
      { step: 2, title: 'Widget language', description: 'When embedding the JS widget, pass the locale parameter (e.g., locale="de") to display in German.' },
      { step: 3, title: 'API responses', description: 'Add Accept-Language header to API requests to receive localized descriptions and error messages.' },
      { step: 4, title: 'Contribute translations', description: 'Missing translations can be reported via the Community forum.' },
    ],
    relatedFeatures: ['multi-country-support', 'landing-page', 'dashboard', 'js-widget', 'white-label-widget'],
  },
  {
    slug: 'rest-api',
    detailedDescription: 'POTAL provides a RESTful JSON API with ~160 endpoints covering landed cost calculation, HS classification, sanctions screening, FTA lookup, and more. All endpoints use standard HTTP methods, return JSON responses, and include rate limit headers.',
    howToUse: [
      { step: 1, title: 'Get your API key', description: 'Sign up at potal.app and create an API key from Dashboard > API Keys.' },
      { step: 2, title: 'Authenticate requests', description: 'Include your API key in the X-API-Key or Authorization: Bearer header.' },
      { step: 3, title: 'Call endpoints', description: 'Send JSON requests to https://potal.app/api/v1/{endpoint}. All responses include success, data, and meta fields.' },
      { step: 4, title: 'Handle errors', description: 'Check the success field and HTTP status code. Error responses include a code and message for debugging.' },
    ],
    apiEndpoint: '/api/v1',
    apiMethod: 'GET/POST',
    relatedFeatures: ['api-key-auth', 'versioned-api', 'openapi-spec', 'api-documentation', 'rate-limiting'],
  },
  {
    slug: 'api-key-auth',
    detailedDescription: 'Secure API authentication with publishable and secret key pairs. Publishable keys (pk_live_) are safe for client-side widget usage with limited scope. Secret keys (sk_live_) provide full API access and should only be used server-side.',
    howToUse: [
      { step: 1, title: 'Create API key', description: 'Go to Dashboard > API Keys > Create Key. Choose between publishable (client) and secret (server) key types.' },
      { step: 2, title: 'Use in requests', description: 'Include the key in the X-API-Key header or Authorization: Bearer header.' },
      { step: 3, title: 'Rotate keys', description: 'Generate a new key and update your integration before revoking the old one.' },
      { step: 4, title: 'Monitor usage', description: 'Each key tracks its own usage stats, last used timestamp, and rate limit consumption.' },
    ],
    apiEndpoint: '/api/v1/sellers/keys',
    apiMethod: 'GET/POST',
    relatedFeatures: ['rest-api', 'rate-limiting', 'access-control', 'sandbox-environment', 'role-based-access'],
  },
  {
    slug: 'rate-limiting',
    detailedDescription: 'API rate limiting protects the platform and ensures fair usage. The Forever Free plan includes 60 requests per minute and 100,000 calls per month (soft cap). Every response includes X-RateLimit-Remaining and X-RateLimit-Reset headers.',
    howToUse: [
      { step: 1, title: 'Check response headers', description: 'Every API response includes X-RateLimit-Remaining (calls left) and X-RateLimit-Reset (reset timestamp).' },
      { step: 2, title: 'Handle 429 responses', description: 'When rate limited, you receive HTTP 429 with a Retry-After header. Wait and retry.' },
      { step: 3, title: 'Implement backoff', description: 'Use exponential backoff in your client code. The official SDKs handle this automatically.' },
      { step: 4, title: 'Request higher limits', description: 'Enterprise customers can contact us for custom rate limits.' },
    ],
    relatedFeatures: ['api-key-auth', 'high-throughput', 'error-handling', 'rest-api', 'sandbox-environment'],
  },
  {
    slug: 'webhooks',
    detailedDescription: 'Real-time event notifications with configurable endpoints. Register webhook URLs to receive instant notifications when classification completes, rates change, or compliance alerts trigger. Includes automatic retry with exponential backoff.',
    howToUse: [
      { step: 1, title: 'Register a webhook', description: 'POST /api/v1/webhooks with your HTTPS URL and the events you want to subscribe to.' },
      { step: 2, title: 'Store the secret', description: 'Save the webhook secret returned in the response for signature verification.' },
      { step: 3, title: 'Handle events', description: 'Your endpoint receives POST requests with event data. Verify the signature before processing.' },
      { step: 4, title: 'Manage webhooks', description: 'GET /api/v1/webhooks lists all registered webhooks. DELETE to remove them.' },
    ],
    apiEndpoint: '/api/v1/webhooks',
    apiMethod: 'GET/POST',
    requestExample: JSON.stringify({
      url: "https://yourapp.com/webhooks/potal",
      events: ["classification.completed", "rate.changed"],
    }, null, 2),
    responseExample: JSON.stringify({
      webhook: {
        id: "wh_abc123",
        url: "https://yourapp.com/webhooks/potal",
        events: ["classification.completed", "rate.changed"],
        secret: "whsec_xxx...",
        active: true,
      },
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/webhooks \\
  -H "X-API-Key: sk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://yourapp.com/webhooks/potal","events":["classification.completed"]}'`,
    relatedFeatures: ['webhook-retry', 'email-notifications', 'in-app-notifications', 'rest-api', 'error-handling'],
  },
  {
    slug: 'dashboard',
    detailedDescription: 'The POTAL Dashboard is your central control panel for managing API keys, monitoring usage, classifying products, and calculating landed costs. It provides real-time analytics, team management, and quick access to all POTAL features.',
    howToUse: [
      { step: 1, title: 'Sign in', description: 'Log in at potal.app/dashboard with your email or Google account.' },
      { step: 2, title: 'Explore sections', description: 'Navigate via the sidebar: Overview, API Keys, HS Classification, Tariff Calculator, Usage, Settings, and more.' },
      { step: 3, title: 'Try features directly', description: 'Use the built-in HS Classification and Tariff Calculator tools without writing any code.' },
      { step: 4, title: 'Monitor usage', description: 'The Overview tab shows API call counts, response times, and recent activity.' },
    ],
    relatedFeatures: ['usage-analytics', 'sla-dashboard', 'user-management', 'role-based-access', 'onboarding-wizard'],
  },
  {
    slug: 'usage-analytics',
    detailedDescription: 'Track API usage across all endpoints with detailed analytics. Monitor call volumes, response times, error rates, and top-used features. Usage data is available in the Dashboard and via API for programmatic access.',
    howToUse: [
      { step: 1, title: 'View in Dashboard', description: 'Go to Dashboard > Usage to see charts of API calls by day, endpoint, and response status.' },
      { step: 2, title: 'API access', description: 'GET /api/v1/admin/usage returns usage data in JSON format for integration into your own dashboards.' },
      { step: 3, title: 'Set up alerts', description: 'Configure email notifications when usage approaches thresholds.' },
      { step: 4, title: 'Export data', description: 'Download usage reports as CSV for analysis or billing reconciliation.' },
    ],
    apiEndpoint: '/api/v1/admin/usage',
    apiMethod: 'GET',
    relatedFeatures: ['dashboard', 'sla-dashboard', 'scheduled-reports', 'custom-reports', 'data-visualization'],
  },
  {
    slug: 'multi-currency',
    detailedDescription: 'Display landed costs in any currency using daily-updated exchange rates. POTAL automatically converts between 160+ currencies so buyers see costs in their local currency. Rates are sourced from central banks and updated every 24 hours.',
    howToUse: [
      { step: 1, title: 'Set target currency', description: 'Add the currency parameter (ISO 4217 code like EUR, GBP, JPY) to your calculate request.' },
      { step: 2, title: 'Get converted costs', description: 'The response includes all cost components in the requested currency with the exchange rate used.' },
      { step: 3, title: 'Historical rates', description: 'Use GET /api/v1/exchange-rate/historical for rates on a specific date.' },
      { step: 4, title: 'Widget integration', description: 'The JS widget auto-detects the buyer\'s locale and displays costs in their local currency.' },
    ],
    relatedFeatures: ['currency-conversion', 'total-landed-cost', 'checkout-integration', 'shipping-rates', 'ddp-quote'],
  },
  {
    slug: 'white-label-widget',
    detailedDescription: 'Embed a fully customizable landed cost calculator on your e-commerce store. The white-label widget displays duties, taxes, and shipping costs on product pages — with your branding, colors, and messaging. No POTAL branding visible to your customers.',
    howToUse: [
      { step: 1, title: 'Configure appearance', description: 'POST /api/v1/whitelabel/config to set colors, fonts, logo, and display options.' },
      { step: 2, title: 'Embed the script', description: 'Add the one-line JavaScript snippet to your product page template.' },
      { step: 3, title: 'Pass product data', description: 'The widget reads product price, origin, and destination from the page or data attributes.' },
      { step: 4, title: 'Customize messaging', description: 'Set custom labels like "Estimated Import Fees" and currency display format.' },
    ],
    apiEndpoint: '/api/v1/whitelabel/config',
    apiMethod: 'POST',
    relatedFeatures: ['custom-branding', 'js-widget', 'checkout-integration', 'shopify-app', 'woocommerce-plugin'],
  },
  {
    slug: 'custom-branding',
    detailedDescription: 'Customize the look and feel of POTAL-powered interfaces with your brand identity. Set primary colors, logos, fonts, and widget styles to match your store\'s design. Available for the embedded widget and exported documents.',
    howToUse: [
      { step: 1, title: 'Upload brand assets', description: 'Go to Dashboard > Settings > Branding to upload your logo and set brand colors.' },
      { step: 2, title: 'Configure via API', description: 'POST /api/v1/branding with color codes, logo URL, and font preferences.' },
      { step: 3, title: 'Preview changes', description: 'Use the live preview in the Dashboard to see how your branding looks on the widget.' },
      { step: 4, title: 'Apply to documents', description: 'Your branding automatically appears on generated invoices and customs documents.' },
    ],
    apiEndpoint: '/api/v1/branding',
    apiMethod: 'POST',
    relatedFeatures: ['white-label-widget', 'js-widget', 'dashboard', 'landing-page', 'email-notifications'],
  },
  {
    slug: 'batch-import-export',
    detailedDescription: 'Upload product lists via CSV or JSON for batch processing. Classify hundreds of products, calculate landed costs in bulk, or export results. Batch endpoints accept up to 50 items per request with parallel processing.',
    howToUse: [
      { step: 1, title: 'Prepare your data', description: 'Create a CSV or JSON file with product names, materials, categories, and other classification fields.' },
      { step: 2, title: 'Upload for processing', description: 'POST /api/v1/classify/batch with an items array containing up to 50 products per request.' },
      { step: 3, title: 'Monitor progress', description: 'For large batches, the response includes a job ID to check status via GET /api/v1/jobs/{id}.' },
      { step: 4, title: 'Download results', description: 'Retrieve completed batch results as JSON or export as CSV for use in your ERP or spreadsheet.' },
    ],
    apiEndpoint: '/api/v1/classify/batch',
    apiMethod: 'POST',
    relatedFeatures: ['batch-classification', 'csv-export', 'pdf-reports', 'custom-reports', 'scheduled-reports'],
  },
  {
    slug: 'scheduled-reports',
    detailedDescription: 'Automate recurring reports delivered via email or webhook. Schedule daily, weekly, or monthly reports on API usage, classification results, duty rate changes, or compliance alerts. Reports are generated as CSV or PDF attachments.',
    howToUse: [
      { step: 1, title: 'Define report type', description: 'Choose from usage summary, classification log, rate change alerts, or compliance status.' },
      { step: 2, title: 'Set schedule', description: 'POST /api/v1/reports/schedule with frequency (daily/weekly/monthly) and delivery method.' },
      { step: 3, title: 'Configure recipients', description: 'Add email addresses or webhook URLs to receive the report.' },
      { step: 4, title: 'Manage schedules', description: 'List, update, or delete scheduled reports from the Dashboard or via API.' },
    ],
    apiEndpoint: '/api/v1/reports/schedule',
    apiMethod: 'POST',
    relatedFeatures: ['custom-reports', 'usage-analytics', 'data-visualization', 'email-notifications', 'csv-export'],
  },
  {
    slug: 'custom-reports',
    detailedDescription: 'Build custom reports by selecting specific data fields, date ranges, and filters. Combine classification data, duty calculations, usage metrics, and compliance results into a single report tailored to your business needs.',
    howToUse: [
      { step: 1, title: 'Select data sources', description: 'Choose which data to include: classifications, calculations, usage stats, or compliance results.' },
      { step: 2, title: 'Apply filters', description: 'Filter by date range, country, HS code chapter, or product category.' },
      { step: 3, title: 'Choose format', description: 'Export as CSV for spreadsheet analysis or PDF for sharing with stakeholders.' },
      { step: 4, title: 'Save as template', description: 'Save your report configuration as a template for one-click generation in the future.' },
    ],
    relatedFeatures: ['scheduled-reports', 'usage-analytics', 'data-visualization', 'csv-export', 'dashboard'],
  },
  {
    slug: 'data-visualization',
    detailedDescription: 'Interactive charts and graphs in the Dashboard showing API usage trends, classification distribution, duty rate comparisons, and geographic breakdowns. Visualize your cross-border trade data to identify patterns and optimization opportunities.',
    howToUse: [
      { step: 1, title: 'Access visualizations', description: 'Go to Dashboard > Analytics to see pre-built charts for usage, classification, and cost trends.' },
      { step: 2, title: 'Adjust time range', description: 'Use the date picker to view data for specific periods — last 7 days, 30 days, or custom range.' },
      { step: 3, title: 'Drill into details', description: 'Click on chart elements to see detailed breakdowns by country, product category, or endpoint.' },
      { step: 4, title: 'Export charts', description: 'Download visualizations as PNG images or the underlying data as CSV.' },
    ],
    relatedFeatures: ['custom-reports', 'usage-analytics', 'dashboard', 'sla-dashboard', 'scheduled-reports'],
  },
  {
    slug: 'email-notifications',
    detailedDescription: 'Receive email alerts for important events: rate limit warnings, tariff rate changes, compliance alerts, scheduled report delivery, and account activity. Configure which notifications you want and their delivery frequency.',
    howToUse: [
      { step: 1, title: 'Configure preferences', description: 'Go to Dashboard > Settings > Notifications to enable or disable specific email types.' },
      { step: 2, title: 'Set thresholds', description: 'Configure usage threshold alerts (e.g., notify when 80% of monthly calls are used).' },
      { step: 3, title: 'Add recipients', description: 'Add team member emails to receive notifications alongside the account owner.' },
      { step: 4, title: 'Manage frequency', description: 'Choose immediate, daily digest, or weekly summary for non-critical notifications.' },
    ],
    relatedFeatures: ['in-app-notifications', 'webhooks', 'scheduled-reports', 'dashboard', 'rate-monitoring'],
  },
  {
    slug: 'in-app-notifications',
    detailedDescription: 'Real-time notifications within the POTAL Dashboard for usage alerts, compliance warnings, and system updates. Notifications appear in the bell icon dropdown and are accessible via API for integration into your own applications.',
    howToUse: [
      { step: 1, title: 'View notifications', description: 'Click the bell icon in the Dashboard header to see recent notifications.' },
      { step: 2, title: 'Access via API', description: 'GET /api/v1/notifications returns all unread notifications with timestamps and categories.' },
      { step: 3, title: 'Mark as read', description: 'PATCH /api/v1/notifications/{id} to mark individual notifications as read.' },
      { step: 4, title: 'Configure types', description: 'Choose which notification types appear in-app vs email in Dashboard > Settings.' },
    ],
    apiEndpoint: '/api/v1/notifications',
    apiMethod: 'GET',
    relatedFeatures: ['email-notifications', 'webhooks', 'dashboard', 'rate-monitoring', 'usage-analytics'],
  },
  {
    slug: 'user-management',
    detailedDescription: 'Manage team members who have access to your POTAL account. Add or remove users, assign roles, and control which features each team member can access. User activity is logged for audit purposes.',
    howToUse: [
      { step: 1, title: 'Invite team members', description: 'Go to Dashboard > Team > Invite and enter email addresses of team members to add.' },
      { step: 2, title: 'Assign roles', description: 'Choose between Admin (full access), Developer (API access), and Viewer (read-only) roles.' },
      { step: 3, title: 'Manage permissions', description: 'Admins can modify roles, revoke access, and view activity logs for all team members.' },
      { step: 4, title: 'Deactivate users', description: 'Remove team members when they leave — their API keys are automatically revoked.' },
    ],
    relatedFeatures: ['role-based-access', 'team-management', 'dashboard', 'sso-support', 'api-key-auth'],
  },
  {
    slug: 'role-based-access',
    detailedDescription: 'Control access to POTAL features based on user roles. Define what each team member can see and do — from full admin control to read-only analytics access. Roles apply to both the Dashboard UI and API key permissions.',
    howToUse: [
      { step: 1, title: 'View available roles', description: 'POTAL provides built-in roles: Admin, Developer, Analyst, and Viewer.' },
      { step: 2, title: 'Assign to users', description: 'Set roles when inviting team members or update them in Dashboard > Team.' },
      { step: 3, title: 'Scope API keys', description: 'API keys inherit the role permissions of the user who created them.' },
      { step: 4, title: 'Audit access', description: 'View which users accessed which features in the audit log.' },
    ],
    relatedFeatures: ['user-management', 'team-management', 'access-control', 'api-key-auth', 'multi-tenant'],
  },
  {
    slug: 'team-management',
    detailedDescription: 'Organize your POTAL account for team collaboration. Create teams, assign members, share API keys, and manage billing under a single organization. Team members share usage quotas while maintaining individual access credentials.',
    howToUse: [
      { step: 1, title: 'Create your team', description: 'Go to Dashboard > Team to set up your organization name and invite members.' },
      { step: 2, title: 'Manage members', description: 'GET /api/v1/team returns all team members, their roles, and last active timestamps.' },
      { step: 3, title: 'Share resources', description: 'Team members share the account\'s API quota while having individual API keys.' },
      { step: 4, title: 'Transfer ownership', description: 'Account owners can transfer organization ownership to another Admin-role member.' },
    ],
    apiEndpoint: '/api/v1/team',
    apiMethod: 'GET',
    relatedFeatures: ['user-management', 'role-based-access', 'dashboard', 'sso-support', 'multi-tenant'],
  },
  {
    slug: 'api-documentation',
    detailedDescription: 'Comprehensive API reference documentation at potal.app/developers with interactive examples, request/response schemas, and code snippets in cURL, JavaScript, and Python. Every endpoint is documented with parameters, types, and error codes.',
    howToUse: [
      { step: 1, title: 'Browse endpoints', description: 'Visit potal.app/developers/docs for the complete API reference organized by category.' },
      { step: 2, title: 'Try examples', description: 'Each endpoint page includes a cURL example you can copy and run immediately.' },
      { step: 3, title: 'Use SDK docs', description: 'Language-specific guides for JavaScript (npm) and Python (pip) SDKs with TypeScript types.' },
      { step: 4, title: 'Check changelog', description: 'The API changelog lists all recent changes, deprecations, and new endpoints.' },
    ],
    relatedFeatures: ['openapi-spec', 'rest-api', 'versioned-api', 'sandbox-environment', 'sdk-javascript'],
  },
  {
    slug: 'sandbox-environment',
    detailedDescription: 'Test POTAL API integrations in a sandbox environment without affecting production data or consuming your API quota. Sandbox mode returns realistic mock responses for all endpoints, allowing full integration testing.',
    howToUse: [
      { step: 1, title: 'Enable sandbox mode', description: 'Create a test API key (sk_test_ prefix) from Dashboard > API Keys > Create Test Key.' },
      { step: 2, title: 'Use test endpoints', description: 'All endpoints work the same way — the test key triggers sandbox mode automatically.' },
      { step: 3, title: 'Test error handling', description: 'Use special test values to trigger specific error responses (e.g., price=0 for validation error).' },
      { step: 4, title: 'Switch to production', description: 'Replace your test key with a live key (sk_live_) when ready to go live.' },
    ],
    relatedFeatures: ['api-key-auth', 'rest-api', 'api-documentation', 'onboarding-wizard', 'error-handling'],
  },
  {
    slug: 'rate-monitoring',
    detailedDescription: 'Monitor tariff rate changes across 240 countries in real time. POTAL tracks MFN rates, preferential rates, trade remedies, and de minimis thresholds — and alerts you when rates change for products you\'re tracking.',
    howToUse: [
      { step: 1, title: 'Set up monitoring', description: 'Add HS codes and country pairs you want to track in Dashboard > Rate Monitoring.' },
      { step: 2, title: 'Check current rates', description: 'GET /api/v1/admin/rate-monitor returns the latest rates for all monitored items.' },
      { step: 3, title: 'Receive change alerts', description: 'Configure email or webhook notifications when monitored rates change.' },
      { step: 4, title: 'Review history', description: 'View rate change history to understand trends and plan procurement timing.' },
    ],
    apiEndpoint: '/api/v1/admin/rate-monitor',
    apiMethod: 'GET',
    relatedFeatures: ['usage-analytics', 'email-notifications', 'webhooks', 'sla-dashboard', 'dashboard'],
  },
  {
    slug: 'sla-dashboard',
    detailedDescription: 'Monitor POTAL API performance against service level objectives. Track uptime, response times (p50/p95/p99), error rates, and availability across all endpoints. The SLA dashboard provides real-time and historical performance data.',
    howToUse: [
      { step: 1, title: 'View SLA metrics', description: 'Go to Dashboard > SLA or GET /api/v1/admin/sla for current performance metrics.' },
      { step: 2, title: 'Check uptime', description: 'View 30-day uptime percentage and incident history.' },
      { step: 3, title: 'Response time tracking', description: 'Monitor p50, p95, and p99 response times by endpoint.' },
      { step: 4, title: 'Set up alerts', description: 'Configure alerts when performance drops below your acceptable thresholds.' },
    ],
    apiEndpoint: '/api/v1/admin/sla',
    apiMethod: 'GET',
    relatedFeatures: ['usage-analytics', 'uptime-monitoring', 'status-page', 'rate-monitoring', 'dashboard'],
  },
  {
    slug: 'high-throughput',
    detailedDescription: 'POTAL\'s infrastructure handles high-volume API traffic with sub-200ms response times for cached routes. Built on edge computing with global CDN, database connection pooling, and intelligent caching for consistent performance under load.',
    howToUse: [
      { step: 1, title: 'Use batch endpoints', description: 'For bulk operations, use /classify/batch and /calculate/batch instead of individual calls.' },
      { step: 2, title: 'Leverage caching', description: 'Repeated queries for the same product/route are served from cache with ~5ms response times.' },
      { step: 3, title: 'Parallel requests', description: 'Send concurrent API calls — POTAL handles parallelism without degraded performance.' },
      { step: 4, title: 'Contact for enterprise', description: 'For sustained high volumes (50K+ calls/day), contact us for dedicated infrastructure.' },
    ],
    relatedFeatures: ['rate-limiting', 'batch-classification', 'rest-api', 'sla-dashboard', 'total-landed-cost'],
  },
  {
    slug: 'webhook-retry',
    detailedDescription: 'Automatic retry with exponential backoff for failed webhook deliveries. If your webhook endpoint returns a non-2xx status or times out, POTAL retries up to 3 times with increasing delays (1s, 10s, 60s) before marking the delivery as failed.',
    howToUse: [
      { step: 1, title: 'Configure webhooks', description: 'Register your webhook URL and POTAL automatically enables retry logic.' },
      { step: 2, title: 'Monitor deliveries', description: 'View delivery status and retry attempts in Dashboard > Webhooks > Delivery Log.' },
      { step: 3, title: 'Handle retries', description: 'Your endpoint should be idempotent — use the event ID to deduplicate retried deliveries.' },
      { step: 4, title: 'Debug failures', description: 'Check the delivery log for HTTP status codes and response bodies from failed attempts.' },
    ],
    relatedFeatures: ['webhooks', 'error-handling', 'email-notifications', 'rest-api', 'in-app-notifications'],
  },
  {
    slug: 'error-handling',
    detailedDescription: 'Structured error responses with consistent HTTP status codes, error codes, and human-readable messages across all API endpoints. Every error includes a machine-readable code for programmatic handling and a message for debugging.',
    howToUse: [
      { step: 1, title: 'Check HTTP status', description: 'POTAL uses standard codes: 400 (bad request), 401 (unauthorized), 404 (not found), 429 (rate limited), 500 (server error).' },
      { step: 2, title: 'Parse error body', description: 'Error responses include success: false, error.code (e.g., "INVALID_COUNTRY"), and error.message.' },
      { step: 3, title: 'Handle by code', description: 'Use the error code in your application logic — codes are stable across API versions.' },
      { step: 4, title: 'Retry on 5xx', description: 'Server errors are transient — retry with exponential backoff. 4xx errors require fixing the request.' },
    ],
    relatedFeatures: ['rest-api', 'versioned-api', 'api-documentation', 'rate-limiting', 'webhook-retry'],
  },
  {
    slug: 'versioned-api',
    detailedDescription: 'POTAL API uses URL-based versioning (/api/v1/) to ensure backward compatibility. Breaking changes are introduced in new versions only, while existing versions continue to work. Deprecation notices are communicated via headers and changelog.',
    howToUse: [
      { step: 1, title: 'Use the latest version', description: 'All current endpoints are under /api/v1/. Include the version prefix in all requests.' },
      { step: 2, title: 'Check deprecation headers', description: 'Responses may include X-API-Deprecated and Sunset headers for endpoints scheduled for removal.' },
      { step: 3, title: 'Follow the changelog', description: 'Subscribe to the API changelog for advance notice of new versions and deprecations.' },
      { step: 4, title: 'Migrate gradually', description: 'When a new version launches, both old and new versions run in parallel for at least 6 months.' },
    ],
    relatedFeatures: ['rest-api', 'api-changelog', 'migration-guide', 'api-documentation', 'openapi-spec'],
  },
  {
    slug: 'openapi-spec',
    detailedDescription: 'Full OpenAPI 3.0 specification for the POTAL API, enabling auto-generated client libraries, interactive documentation, and API testing tools. Import into Postman, Swagger UI, or any OpenAPI-compatible tool.',
    howToUse: [
      { step: 1, title: 'Download the spec', description: 'GET /api/v1/docs returns the OpenAPI 3.0 JSON specification for all endpoints.' },
      { step: 2, title: 'Import into tools', description: 'Load the spec into Postman, Insomnia, or Swagger UI for interactive API exploration.' },
      { step: 3, title: 'Generate clients', description: 'Use openapi-generator to create typed client libraries in any language.' },
      { step: 4, title: 'Validate requests', description: 'Use the spec schemas to validate your request payloads before sending them.' },
    ],
    apiEndpoint: '/api/v1/docs',
    apiMethod: 'GET',
    relatedFeatures: ['api-documentation', 'rest-api', 'versioned-api', 'sdk-javascript', 'sdk-python'],
  },
  {
    slug: 'status-page',
    detailedDescription: 'Public status page showing real-time operational status of all POTAL API services. Displays current uptime, ongoing incidents, scheduled maintenance, and historical availability. Also available via API health check endpoint.',
    howToUse: [
      { step: 1, title: 'Check status', description: 'GET /api/v1/health returns current system status with component-level health indicators.' },
      { step: 2, title: 'Monitor components', description: 'Status page shows individual component status: API, Database, Classification Engine, Rate Data.' },
      { step: 3, title: 'Subscribe to updates', description: 'Sign up for email or webhook notifications about incidents and maintenance windows.' },
      { step: 4, title: 'View incident history', description: 'Review past incidents with root cause analysis and resolution timelines.' },
    ],
    apiEndpoint: '/api/v1/health',
    apiMethod: 'GET',
    relatedFeatures: ['uptime-monitoring', 'sla-dashboard', 'incident-response', 'dashboard', 'rest-api'],
  },
  {
    slug: 'uptime-monitoring',
    detailedDescription: 'Continuous monitoring of all POTAL API endpoints with automated alerting. External monitors check API availability every 60 seconds from multiple global locations. Downtime triggers immediate incident creation and notification.',
    howToUse: [
      { step: 1, title: 'View uptime stats', description: 'Check the status page for 30-day, 90-day, and 12-month uptime percentages.' },
      { step: 2, title: 'Set up alerts', description: 'Configure email or webhook notifications for downtime events affecting your integration.' },
      { step: 3, title: 'Check from your side', description: 'Use /api/v1/health as a lightweight health check in your own monitoring system.' },
      { step: 4, title: 'Review SLA compliance', description: 'Enterprise customers can track uptime against their SLA agreement in the SLA Dashboard.' },
    ],
    relatedFeatures: ['status-page', 'sla-dashboard', 'incident-response', 'email-notifications', 'webhooks'],
  },
  {
    slug: 'incident-response',
    detailedDescription: 'Structured incident management with real-time communication and post-incident analysis. When issues occur, POTAL follows a defined response process: detection, triage, mitigation, resolution, and post-mortem with timeline.',
    howToUse: [
      { step: 1, title: 'Get notified', description: 'Subscribe to the status page or configure webhook alerts to receive incident notifications immediately.' },
      { step: 2, title: 'Check impact', description: 'Incident reports include affected components, severity level, and estimated time to resolution.' },
      { step: 3, title: 'Follow updates', description: 'Real-time updates are posted to the status page during active incidents.' },
      { step: 4, title: 'Read post-mortems', description: 'After resolution, a post-mortem is published with root cause, timeline, and prevention measures.' },
    ],
    relatedFeatures: ['uptime-monitoring', 'status-page', 'sla-dashboard', 'email-notifications', 'webhooks'],
  },
  {
    slug: 'csv-export',
    detailedDescription: 'Export calculation results, classification data, and usage reports as CSV files. Download data from the Dashboard or via API for import into spreadsheets, ERP systems, or data warehouses.',
    howToUse: [
      { step: 1, title: 'Export from Dashboard', description: 'Click the Export CSV button on any data table in the Dashboard to download the current view.' },
      { step: 2, title: 'API export', description: 'GET /api/v1/calculate/csv with your query parameters returns results in CSV format.' },
      { step: 3, title: 'Batch results', description: 'Batch classification and calculation results include a CSV download link in the response.' },
      { step: 4, title: 'Schedule exports', description: 'Use scheduled reports to receive automated CSV exports via email on a recurring basis.' },
    ],
    apiEndpoint: '/api/v1/calculate/csv',
    apiMethod: 'GET',
    relatedFeatures: ['batch-import-export', 'pdf-reports', 'custom-reports', 'scheduled-reports', 'batch-classification'],
  },
  {
    slug: 'pdf-reports',
    detailedDescription: 'Generate professional PDF documents for customs declarations, commercial invoices, landed cost breakdowns, and compliance reports. PDFs include your branding and are formatted for official customs submission.',
    howToUse: [
      { step: 1, title: 'Generate a document', description: 'POST /api/v1/documents/pdf with document type (invoice, customs-declaration, cost-breakdown) and transaction data.' },
      { step: 2, title: 'Apply branding', description: 'Documents automatically use your company branding configured in Dashboard > Settings > Branding.' },
      { step: 3, title: 'Download or email', description: 'The response includes a download URL. Optionally pass an email address to send the PDF directly.' },
      { step: 4, title: 'Batch generation', description: 'Generate multiple documents in a single request by passing an array of transactions.' },
    ],
    apiEndpoint: '/api/v1/documents/pdf',
    apiMethod: 'POST',
    relatedFeatures: ['csv-export', 'customs-documentation', 'customs-forms', 'compliance-reports', 'e-invoice'],
  },
  {
    slug: 'multi-tenant',
    detailedDescription: 'Isolate data and configurations between multiple organizations or business units within a single POTAL account. Each tenant has separate API keys, usage tracking, and access policies while sharing a unified billing account.',
    howToUse: [
      { step: 1, title: 'Create tenants', description: 'Set up separate organizational units in Dashboard > Settings > Tenants.' },
      { step: 2, title: 'Assign users', description: 'Add team members to specific tenants with tenant-scoped roles and permissions.' },
      { step: 3, title: 'Isolate API keys', description: 'Each tenant generates its own API keys — usage is tracked separately per tenant.' },
      { step: 4, title: 'Unified billing', description: 'All tenants roll up to a single billing account with per-tenant usage breakdowns.' },
    ],
    relatedFeatures: ['role-based-access', 'user-management', 'access-control', 'data-encryption', 'data-retention'],
  },
  {
    slug: 'sso-support',
    detailedDescription: 'Single Sign-On integration for Enterprise customers using SAML 2.0 or OpenID Connect. Connect your corporate identity provider (Okta, Azure AD, Google Workspace) to manage POTAL access through your existing authentication system.',
    howToUse: [
      { step: 1, title: 'Contact Enterprise team', description: 'SSO setup is available for Enterprise customers — contact us to get started.' },
      { step: 2, title: 'Configure identity provider', description: 'Add POTAL as a SAML or OIDC application in your identity provider (Okta, Azure AD, etc.).' },
      { step: 3, title: 'Map attributes', description: 'Map user attributes (email, name, role) from your IdP to POTAL user profiles.' },
      { step: 4, title: 'Enforce SSO', description: 'Optionally require all team members to sign in through SSO — disabling email/password login.' },
    ],
    relatedFeatures: ['user-management', 'role-based-access', 'team-management', 'dashboard', 'api-key-auth'],
  },
  {
    slug: 'audit-logging',
    detailedDescription: 'Comprehensive audit trail logging every API call, Dashboard action, and configuration change. Logs include who performed the action, what changed, when it happened, and from which IP address. Essential for compliance and security reviews.',
    howToUse: [
      { step: 1, title: 'View audit logs', description: 'Go to Dashboard > Settings > Audit Log to see all account activity with filters for user, action type, and date.' },
      { step: 2, title: 'API access', description: 'GET /api/v1/admin/audit-log returns audit entries in JSON format with pagination.' },
      { step: 3, title: 'Filter events', description: 'Filter by event type (api_call, config_change, user_login), user, date range, or IP address.' },
      { step: 4, title: 'Export for compliance', description: 'Download audit logs as CSV for SOC 2, GDPR, or internal compliance audits.' },
    ],
    relatedFeatures: ['audit-trail', 'usage-analytics', 'compliance-reports', 'dashboard', 'data-retention'],
  },
  {
    slug: 'data-retention',
    detailedDescription: 'Configurable data retention policies controlling how long POTAL stores your API logs, calculation results, and classification history. Default retention is 90 days. Enterprise customers can customize retention periods to meet compliance requirements.',
    howToUse: [
      { step: 1, title: 'View current policy', description: 'Check your data retention settings in Dashboard > Settings > Data Retention.' },
      { step: 2, title: 'Customize retention', description: 'Enterprise customers can set retention periods per data type: API logs, results, audit logs.' },
      { step: 3, title: 'Export before expiry', description: 'Schedule recurring exports to preserve data beyond the retention period.' },
      { step: 4, title: 'Request deletion', description: 'Submit a data deletion request to remove all stored data immediately (GDPR right to erasure).' },
    ],
    relatedFeatures: ['audit-logging', 'multi-tenant', 'gdpr-compliance', 'usage-analytics', 'dashboard'],
  },
  {
    slug: 'api-changelog',
    detailedDescription: 'Documented history of all API changes including new endpoints, deprecations, bug fixes, and breaking changes. Each entry includes the date, affected endpoints, and migration instructions. Subscribe via RSS or webhook for automatic updates.',
    howToUse: [
      { step: 1, title: 'Browse changelog', description: 'Visit potal.app/developers/changelog for the complete history of API changes.' },
      { step: 2, title: 'Subscribe to updates', description: 'Use the RSS feed or configure a webhook to receive notifications about new changes.' },
      { step: 3, title: 'Check deprecations', description: 'Deprecated endpoints are listed with their sunset date and recommended replacement.' },
      { step: 4, title: 'Plan migrations', description: 'Each breaking change entry includes a migration guide with before/after code examples.' },
    ],
    relatedFeatures: ['versioned-api', 'migration-guide', 'api-documentation', 'rest-api', 'openapi-spec'],
  },
  {
    slug: 'migration-guide',
    detailedDescription: 'Step-by-step guides for migrating between API versions or from competitor platforms to POTAL. Includes field mapping tables, code examples, and common pitfalls for smooth transitions.',
    howToUse: [
      { step: 1, title: 'Identify your source', description: 'Choose the migration guide matching your current setup: API version upgrade or platform migration.' },
      { step: 2, title: 'Review field mappings', description: 'Check the field-by-field mapping table to understand how your existing data maps to POTAL.' },
      { step: 3, title: 'Test in sandbox', description: 'Use the sandbox environment to test your migrated integration before going live.' },
      { step: 4, title: 'Validate results', description: 'Compare calculation results between old and new systems to verify accuracy.' },
    ],
    relatedFeatures: ['api-changelog', 'versioned-api', 'api-documentation', 'onboarding-wizard', 'sdk-javascript'],
  },
  {
    slug: 'onboarding-wizard',
    detailedDescription: 'Guided setup flow that walks new users through account configuration, API key creation, first API call, and widget embedding. Completes in under 5 minutes and ensures your POTAL integration is working correctly from the start.',
    howToUse: [
      { step: 1, title: 'Start the wizard', description: 'The onboarding wizard launches automatically after your first sign-in, or access it from Dashboard > Get Started.' },
      { step: 2, title: 'Create your first API key', description: 'The wizard generates a test key and walks you through making your first classification request.' },
      { step: 3, title: 'Try a calculation', description: 'Enter a sample product and see the full landed cost breakdown with duties, taxes, and shipping.' },
      { step: 4, title: 'Choose your integration', description: 'Select your platform (Shopify, WooCommerce, custom) and follow platform-specific setup instructions.' },
    ],
    relatedFeatures: ['dashboard', 'api-key-auth', 'sandbox-environment', 'product-tour', 'api-documentation'],
  },
  {
    slug: 'product-tour',
    detailedDescription: 'Interactive walkthrough highlighting key Dashboard features and capabilities. Tooltip-based guidance shows you where to find HS classification, tariff calculation, usage analytics, and API management tools.',
    howToUse: [
      { step: 1, title: 'Launch the tour', description: 'Click "Take a Tour" in the Dashboard sidebar or access it from Dashboard > Help > Product Tour.' },
      { step: 2, title: 'Follow the tooltips', description: 'Interactive tooltips guide you through each Dashboard section with descriptions and examples.' },
      { step: 3, title: 'Try features inline', description: 'The tour includes interactive steps where you can try classification and calculation directly.' },
      { step: 4, title: 'Replay anytime', description: 'Restart the tour from Dashboard > Help whenever you want a refresher on available features.' },
    ],
    relatedFeatures: ['onboarding-wizard', 'dashboard', 'knowledge-base', 'video-tutorials', 'api-documentation'],
  },
  {
    slug: 'a-b-testing',
    detailedDescription: 'Test different widget configurations, pricing displays, or API parameters to optimize conversion rates. Compare DDP vs DDU checkout performance, widget placement, or cost breakdown formats with built-in analytics.',
    howToUse: [
      { step: 1, title: 'Create an experiment', description: 'Define two or more variants in Dashboard > Experiments with different widget or API configurations.' },
      { step: 2, title: 'Set traffic split', description: 'Allocate traffic percentages to each variant (e.g., 50/50 or 80/20 for gradual rollouts).' },
      { step: 3, title: 'Monitor results', description: 'Track conversion rates, checkout completion, and user engagement per variant in real time.' },
      { step: 4, title: 'Apply the winner', description: 'Once results are statistically significant, apply the winning variant to all traffic.' },
    ],
    relatedFeatures: ['feature-flags', 'usage-analytics', 'dashboard', 'data-visualization', 'custom-reports'],
  },
  {
    slug: 'feature-flags',
    detailedDescription: 'Toggle specific POTAL features on or off for subsets of users or API keys without code deployments. Use feature flags for gradual rollouts, beta testing, or tenant-specific customizations.',
    howToUse: [
      { step: 1, title: 'Create a flag', description: 'Define feature flags in Dashboard > Settings > Feature Flags with targeting rules.' },
      { step: 2, title: 'Set targeting', description: 'Target flags by API key, tenant, user role, or percentage-based rollout.' },
      { step: 3, title: 'Check flags via API', description: 'Your integration can check flag status to conditionally enable features.' },
      { step: 4, title: 'Monitor impact', description: 'Track usage metrics per flag variant to measure the impact of feature changes.' },
    ],
    relatedFeatures: ['a-b-testing', 'multi-tenant', 'dashboard', 'role-based-access', 'usage-analytics'],
  },
];

const INTEGRATION_GUIDES: FeatureGuide[] = [
  {
    slug: 'shopify-app',
    detailedDescription: 'Native Shopify app that adds a landed cost calculator widget to your product pages. Automatically displays duties, taxes, and shipping costs to international buyers at checkout. One-click install from the Shopify App Store.',
    howToUse: [
      { step: 1, title: 'Install from Shopify', description: 'Search "POTAL" in the Shopify App Store and click Install. Authorize the required permissions.' },
      { step: 2, title: 'Configure settings', description: 'Set your default origin country, shipping methods, and widget appearance in the POTAL app settings.' },
      { step: 3, title: 'Enable on product pages', description: 'The widget automatically appears on product pages — customize placement via theme editor.' },
      { step: 4, title: 'Monitor performance', description: 'Track widget impressions, calculations, and international order conversions in the POTAL Dashboard.' },
    ],
    relatedFeatures: ['js-widget', 'white-label-widget', 'checkout-integration', 'woocommerce-plugin', 'total-landed-cost'],
  },
  {
    slug: 'woocommerce-plugin',
    detailedDescription: 'WordPress/WooCommerce plugin that integrates POTAL\'s landed cost calculator into your store. Displays duties and taxes on product pages and at checkout. Available on WordPress.org for one-click installation.',
    howToUse: [
      { step: 1, title: 'Install the plugin', description: 'Search "POTAL" in WordPress > Plugins > Add New, or upload the plugin ZIP manually.' },
      { step: 2, title: 'Enter API key', description: 'Go to WooCommerce > Settings > POTAL and enter your publishable API key (pk_live_).' },
      { step: 3, title: 'Configure display', description: 'Choose widget placement (product page, cart, checkout) and customize colors to match your theme.' },
      { step: 4, title: 'Test with a product', description: 'View any product page with an international destination to verify the landed cost widget appears.' },
    ],
    relatedFeatures: ['shopify-app', 'js-widget', 'checkout-integration', 'bigcommerce-plugin', 'total-landed-cost'],
  },
  {
    slug: 'bigcommerce-plugin',
    detailedDescription: 'BigCommerce integration that adds POTAL\'s landed cost calculator to your storefront. Display duties, taxes, and total import costs to international buyers. Integrates via the BigCommerce Apps Marketplace.',
    howToUse: [
      { step: 1, title: 'Install from marketplace', description: 'Find POTAL in the BigCommerce Apps Marketplace and install. Grant the required store permissions.' },
      { step: 2, title: 'Configure API credentials', description: 'Enter your POTAL API key in the app settings and set your default origin country.' },
      { step: 3, title: 'Customize widget', description: 'Adjust widget appearance, position, and behavior through the POTAL app configuration panel.' },
      { step: 4, title: 'Verify on storefront', description: 'Visit a product page with an international shipping destination to confirm the widget works.' },
    ],
    relatedFeatures: ['shopify-app', 'woocommerce-plugin', 'js-widget', 'checkout-integration', 'magento-module'],
  },
  {
    slug: 'magento-module',
    detailedDescription: 'Adobe Commerce (Magento) module that adds POTAL\'s landed cost calculator to product pages and checkout. Supports Magento 2.4+ with Composer-based installation and admin panel configuration.',
    howToUse: [
      { step: 1, title: 'Install via Composer', description: 'Run composer require potal/magento-module and enable with bin/magento module:enable Potal_LandedCost.' },
      { step: 2, title: 'Configure in admin', description: 'Go to Stores > Configuration > POTAL to enter your API key and set origin country.' },
      { step: 3, title: 'Theme integration', description: 'The module auto-injects the widget on product pages. Customize layout via XML layout files.' },
      { step: 4, title: 'Cache and deploy', description: 'Flush cache and run static content deploy to activate the module on your storefront.' },
    ],
    relatedFeatures: ['shopify-app', 'woocommerce-plugin', 'bigcommerce-plugin', 'js-widget', 'checkout-integration'],
  },
  {
    slug: 'js-widget',
    detailedDescription: 'Lightweight JavaScript widget (~15KB) that embeds a landed cost calculator on any website. Works with any e-commerce platform or custom site. Drop in a single script tag and the widget auto-renders with product data from the page.',
    howToUse: [
      { step: 1, title: 'Add the script tag', description: 'Include <script src="https://cdn.potal.app/widget.js" data-key="pk_live_..."></script> on your page.' },
      { step: 2, title: 'Pass product data', description: 'Set data attributes (data-product, data-price, data-origin) or pass via JavaScript API.' },
      { step: 3, title: 'Customize appearance', description: 'Use data-theme="dark" or pass custom CSS variables to match your site design.' },
      { step: 4, title: 'Listen for events', description: 'The widget fires JavaScript events (potal:calculated, potal:error) for custom integrations.' },
    ],
    relatedFeatures: ['shopify-app', 'white-label-widget', 'custom-branding', 'checkout-integration', 'sdk-javascript'],
  },
  {
    slug: 'sdk-javascript',
    detailedDescription: 'Official JavaScript/TypeScript SDK (potal-sdk on npm) for server-side and client-side integration. Provides typed methods for all API endpoints, automatic retry, and built-in error handling. Supports Node.js 18+ and modern browsers.',
    howToUse: [
      { step: 1, title: 'Install the SDK', description: 'Run npm install potal-sdk and import { PotalClient } from "potal-sdk".' },
      { step: 2, title: 'Initialize the client', description: 'Create a new PotalClient({ apiKey: "sk_live_..." }) instance with your secret key.' },
      { step: 3, title: 'Call methods', description: 'Use typed methods like client.classify(), client.calculate(), client.sanctions.screen().' },
      { step: 4, title: 'Handle responses', description: 'All methods return typed response objects with full TypeScript IntelliSense support.' },
    ],
    relatedFeatures: ['sdk-python', 'sdk-curl', 'rest-api', 'api-documentation', 'js-widget'],
  },
  {
    slug: 'sdk-python',
    detailedDescription: 'Official Python SDK (potal on PyPI) for server-side integration. Provides typed methods with Pydantic models for all API endpoints. Supports Python 3.8+ with async/await support and automatic retry logic.',
    howToUse: [
      { step: 1, title: 'Install the SDK', description: 'Run pip install potal and import from potal import PotalClient.' },
      { step: 2, title: 'Initialize the client', description: 'Create client = PotalClient(api_key="sk_live_...") with your secret key.' },
      { step: 3, title: 'Call methods', description: 'Use methods like client.classify(), client.calculate(), client.sanctions.screen() with typed parameters.' },
      { step: 4, title: 'Use async', description: 'For async applications, use AsyncPotalClient with await for all API calls.' },
    ],
    relatedFeatures: ['sdk-javascript', 'sdk-curl', 'rest-api', 'api-documentation', 'batch-classification'],
  },
  {
    slug: 'sdk-curl',
    detailedDescription: 'cURL examples for every POTAL API endpoint. Copy-paste ready commands for quick testing, scripting, and integration from any environment. Every endpoint page in the documentation includes a cURL example.',
    howToUse: [
      { step: 1, title: 'Get your API key', description: 'Create an API key from Dashboard > API Keys.' },
      { step: 2, title: 'Copy a cURL example', description: 'Find the endpoint in the API docs and copy the cURL example — replace the API key placeholder.' },
      { step: 3, title: 'Run in terminal', description: 'Paste into any terminal (macOS, Linux, Windows PowerShell) and execute.' },
      { step: 4, title: 'Pipe to tools', description: 'Combine with jq for JSON formatting: curl ... | jq . or redirect output to files.' },
    ],
    relatedFeatures: ['sdk-javascript', 'sdk-python', 'rest-api', 'api-documentation', 'sandbox-environment'],
  },
  {
    slug: 'checkout-integration',
    detailedDescription: 'DDP/DDU checkout flow with fraud detection and session management. Create checkout sessions that calculate total landed cost for multi-item carts, supporting up to 50 items per session with DDP, DDU, or DAP pricing modes.',
    howToUse: [
      { step: 1, title: 'Create a session', description: 'POST /api/v1/checkout with origin, destination, items array, and pricing mode.' },
      { step: 2, title: 'Display quote', description: 'Show the itemized cost breakdown to the buyer at checkout.' },
      { step: 3, title: 'Handle pricing modes', description: 'Let buyers switch between DDP and DDU to see the difference.' },
      { step: 4, title: 'Complete purchase', description: 'Use the session ID to finalize the transaction with accurate cost data.' },
    ],
    apiEndpoint: '/api/v1/checkout',
    apiMethod: 'POST',
    requestExample: JSON.stringify({
      originCountry: "CN",
      destinationCountry: "US",
      pricingMode: "DDP",
      items: [
        { productName: "Wireless Mouse", price: 29.99, quantity: 1 },
        { productName: "USB-C Cable", price: 9.99, quantity: 2 },
      ],
    }, null, 2),
    responseExample: JSON.stringify({
      checkoutSessionId: "cs_abc123",
      quote: {
        subtotal: 49.97,
        shipping: 8.50,
        duty: 2.45,
        tax: 0,
        total: 60.92,
      },
      expiresAt: "2026-03-29T13:00:00Z",
    }, null, 2),
    curlExample: `curl -X POST https://potal.app/api/v1/checkout \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"originCountry":"CN","destinationCountry":"US","pricingMode":"DDP","items":[{"productName":"Wireless Mouse","price":29.99,"quantity":1}]}'`,
    relatedFeatures: ['total-landed-cost', 'ddp-quote', 'shopify-app', 'js-widget', 'multi-currency'],
    requiredFields: [
      { name: 'originCountry', type: 'string', required: true, description: 'Origin country (ISO 2-letter code)', example: 'CN' },
      { name: 'destinationCountry', type: 'string', required: true, description: 'Destination country (ISO 2-letter code)', example: 'US' },
      { name: 'items[].productName', type: 'string', required: true, description: 'Product name for each item', example: 'Wireless Mouse' },
      { name: 'items[].price', type: 'number', required: true, description: 'Item price (must be > 0)', example: '29.99' },
      { name: 'items[].quantity', type: 'number', required: true, description: 'Quantity (must be > 0)', example: '1' },
      { name: 'items[].hsCode', type: 'string', required: false, description: 'HS code (speeds up calculation)', example: '8471.60' },
      { name: 'pricingMode', type: 'string', required: false, description: 'DDP (default), DDU, or DAP', example: 'DDP' },
    ],
    accuracyTips: [
      'Max 50 items per checkout session',
      'Providing hsCode per item skips auto-classification and speeds up response',
      'Use action=quote for price-only breakdown without creating a session',
    ],
    commonMistakes: [
      'Items with price = 0 — price must be greater than 0',
      'More than 50 items — split into multiple checkout sessions',
    ],

  },
  {
    slug: 'order-sync',
    detailedDescription: 'Synchronize order data between your e-commerce platform and POTAL for automated landed cost recalculation and customs document generation. Supports real-time sync via webhooks or batch sync via API.',
    howToUse: [
      { step: 1, title: 'Connect your platform', description: 'POST /api/v1/orders/sync with your platform credentials and sync configuration.' },
      { step: 2, title: 'Map order fields', description: 'Map your platform\'s order fields (product name, price, origin) to POTAL\'s expected format.' },
      { step: 3, title: 'Enable real-time sync', description: 'Configure webhooks to automatically push new orders to POTAL for instant landed cost calculation.' },
      { step: 4, title: 'Review sync status', description: 'Monitor sync health, failed syncs, and retry status in Dashboard > Integrations > Order Sync.' },
    ],
    apiEndpoint: '/api/v1/orders/sync',
    apiMethod: 'POST',
    relatedFeatures: ['checkout-integration', 'shopify-app', 'woocommerce-plugin', 'inventory-sync', 'webhooks'],
  },
  {
    slug: 'inventory-sync',
    detailedDescription: 'Keep inventory levels synchronized between your warehouses and POTAL for accurate fulfillment-based landed cost calculations. When stock levels change, POTAL adjusts routing to the optimal warehouse for cost or delivery speed.',
    howToUse: [
      { step: 1, title: 'Connect inventory source', description: 'POST /api/v1/inventory/connect with your warehouse management system credentials.' },
      { step: 2, title: 'Check inventory levels', description: 'GET /api/v1/inventory/levels returns current stock by product and warehouse location.' },
      { step: 3, title: 'Auto-route orders', description: 'POTAL uses real-time inventory to route calculations to warehouses that have stock.' },
      { step: 4, title: 'Set up alerts', description: 'Configure notifications for low stock or inventory discrepancies between systems.' },
    ],
    apiEndpoint: '/api/v1/inventory/levels',
    apiMethod: 'GET',
    relatedFeatures: ['order-sync', 'multi-warehouse', '3pl-integration', 'shopify-app', 'webhooks'],
  },
  {
    slug: 'marketplace-connect',
    detailedDescription: 'Connect multiple e-commerce marketplaces (Amazon, eBay, Etsy) to POTAL for centralized landed cost management. Sync product catalogs and orders across marketplaces with unified tariff classification and cost calculations.',
    howToUse: [
      { step: 1, title: 'Add a marketplace', description: 'POST /api/v1/integrations/marketplace with the marketplace type and your seller credentials.' },
      { step: 2, title: 'Sync product catalog', description: 'Import your product listings for bulk HS code classification and landed cost pre-calculation.' },
      { step: 3, title: 'Auto-calculate on orders', description: 'New orders trigger automatic landed cost calculation based on buyer destination.' },
      { step: 4, title: 'Manage across platforms', description: 'View all marketplace orders and calculations in a unified Dashboard view.' },
    ],
    apiEndpoint: '/api/v1/integrations/marketplace',
    apiMethod: 'POST',
    relatedFeatures: ['shopify-app', 'order-sync', 'inventory-sync', 'checkout-integration', 'webhooks'],
  },
  {
    slug: 'erp-integration',
    detailedDescription: 'Connect POTAL with your ERP system (SAP, Oracle, NetSuite, Microsoft Dynamics) for automated duty and tax data flow. Push landed cost calculations directly into purchase orders, invoices, and financial reports.',
    howToUse: [
      { step: 1, title: 'Configure ERP connection', description: 'POST /api/v1/integrations/erp with your ERP system type, API credentials, and data mapping.' },
      { step: 2, title: 'Map data fields', description: 'Map POTAL\'s duty, tax, and HS code fields to your ERP\'s chart of accounts and product codes.' },
      { step: 3, title: 'Enable auto-sync', description: 'Set up automatic data push on each calculation — duty amounts flow directly into your ERP.' },
      { step: 4, title: 'Verify entries', description: 'Check the sync log in Dashboard > Integrations to confirm data is appearing correctly in your ERP.' },
    ],
    apiEndpoint: '/api/v1/integrations/erp',
    apiMethod: 'POST',
    relatedFeatures: ['accounting-integration', 'order-sync', 'inventory-sync', 'csv-export', 'webhooks'],
  },
  {
    slug: 'accounting-integration',
    detailedDescription: 'Sync landed cost data with accounting software (QuickBooks, Xero, FreshBooks) for automated duty and tax bookkeeping. Calculations automatically create journal entries for import duties, VAT/GST, and customs fees.',
    howToUse: [
      { step: 1, title: 'Connect accounting software', description: 'POST /api/v1/integrations/accounting with your accounting platform type and OAuth credentials.' },
      { step: 2, title: 'Map accounts', description: 'Map duty, VAT/GST, and customs fee amounts to the appropriate ledger accounts.' },
      { step: 3, title: 'Auto-create entries', description: 'Each landed cost calculation creates a draft journal entry in your accounting system.' },
      { step: 4, title: 'Reconcile monthly', description: 'Use the monthly reconciliation report to verify POTAL entries match your customs payments.' },
    ],
    apiEndpoint: '/api/v1/integrations/accounting',
    apiMethod: 'POST',
    relatedFeatures: ['erp-integration', 'csv-export', 'e-invoice', 'pdf-reports', 'tax-calculation-vat-gst'],
  },
];

const SECURITY_GUIDES: FeatureGuide[] = [
  {
    slug: 'data-encryption',
    detailedDescription: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). API keys are stored as SHA-256 hashes — plaintext keys are never persisted. Database connections use SSL, and backups are encrypted with separate key management.',
    howToUse: [
      { step: 1, title: 'Use HTTPS only', description: 'All API requests must use HTTPS. HTTP requests are automatically redirected to HTTPS.' },
      { step: 2, title: 'Verify TLS', description: 'POTAL enforces TLS 1.2+ on all connections. Check your client supports modern TLS versions.' },
      { step: 3, title: 'Protect API keys', description: 'Store API keys in environment variables or secret managers — never in source code or client-side code.' },
      { step: 4, title: 'Request data deletion', description: 'Under GDPR, request deletion of all stored data including encrypted backups.' },
    ],
    relatedFeatures: ['access-control', 'security-headers', 'multi-tenant', 'api-key-auth', 'gdpr-compliance'],
  },
  {
    slug: 'access-control',
    detailedDescription: 'Granular access control at the API key, user, and tenant level. Restrict which endpoints each API key can access, limit IP ranges, and enforce least-privilege principles across your organization.',
    howToUse: [
      { step: 1, title: 'Scope API keys', description: 'Create keys with specific endpoint permissions — e.g., classify-only or calculate-only access.' },
      { step: 2, title: 'Set IP allowlists', description: 'Restrict API key usage to specific IP ranges in Dashboard > API Keys > Security.' },
      { step: 3, title: 'Assign user roles', description: 'Use role-based access (Admin, Developer, Viewer) to control Dashboard permissions.' },
      { step: 4, title: 'Review access logs', description: 'Check audit logs regularly to verify access patterns match expected usage.' },
    ],
    relatedFeatures: ['data-encryption', 'role-based-access', 'api-key-auth', 'multi-tenant', 'security-headers'],
  },
  {
    slug: 'security-headers',
    detailedDescription: 'POTAL implements comprehensive HTTP security headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security (HSTS), and Referrer-Policy. All responses include security headers by default.',
    howToUse: [
      { step: 1, title: 'Verify headers', description: 'Check response headers on any API call — security headers are included automatically.' },
      { step: 2, title: 'CORS configuration', description: 'Configure allowed origins for browser-based API calls in Dashboard > Settings > Security.' },
      { step: 3, title: 'Embed securely', description: 'When embedding the JS widget, the CSP headers ensure the widget loads only from trusted sources.' },
      { step: 4, title: 'Report vulnerabilities', description: 'Security issues can be reported via the security disclosure process at potal.app/security.' },
    ],
    relatedFeatures: ['data-encryption', 'access-control', 'vulnerability-scanning', 'penetration-testing', 'gdpr-compliance'],
  },
  {
    slug: 'vulnerability-scanning',
    detailedDescription: 'Automated vulnerability scanning runs continuously on POTAL infrastructure, dependencies, and application code. Scans cover OWASP Top 10, CVE databases, and dependency supply chain risks. Results are triaged and patched promptly.',
    howToUse: [
      { step: 1, title: 'Review security posture', description: 'Enterprise customers can request the latest vulnerability scan report from their account manager.' },
      { step: 2, title: 'Check dependency status', description: 'POTAL\'s open-source dependencies are monitored for known vulnerabilities via automated tooling.' },
      { step: 3, title: 'Report findings', description: 'If you discover a vulnerability, report it via the responsible disclosure process.' },
      { step: 4, title: 'Request SOC 2 report', description: 'Enterprise customers can request SOC 2 Type II compliance documentation.' },
    ],
    relatedFeatures: ['security-headers', 'penetration-testing', 'data-encryption', 'incident-response', 'access-control'],
  },
  {
    slug: 'penetration-testing',
    detailedDescription: 'Regular third-party penetration testing validates POTAL\'s security against real-world attack scenarios. Tests cover API endpoints, authentication flows, data isolation, and infrastructure. Results drive security improvements.',
    howToUse: [
      { step: 1, title: 'Request pentest report', description: 'Enterprise customers can request the latest third-party penetration test summary.' },
      { step: 2, title: 'Coordinate your own test', description: 'Contact us to schedule a coordinated penetration test against your POTAL integration.' },
      { step: 3, title: 'Review remediation', description: 'All findings are tracked to remediation with SLA-based response times.' },
      { step: 4, title: 'Continuous testing', description: 'Automated security tests run as part of the CI/CD pipeline on every deployment.' },
    ],
    relatedFeatures: ['vulnerability-scanning', 'security-headers', 'data-encryption', 'incident-response', 'access-control'],
  },
];

const LEGAL_GUIDES: FeatureGuide[] = [
  {
    slug: 'gdpr-compliance',
    detailedDescription: 'POTAL is fully GDPR-compliant with data processing agreements, right-to-erasure support, data portability, and EU data residency options. No personal data is required for API usage — only product and trade data is processed.',
    howToUse: [
      { step: 1, title: 'Review DPA', description: 'Download the Data Processing Agreement from potal.app/legal/dpa for your records.' },
      { step: 2, title: 'Request data export', description: 'Submit a data portability request to receive all your stored data in machine-readable format.' },
      { step: 3, title: 'Request deletion', description: 'Exercise right-to-erasure by contacting support — all data including backups is deleted within 30 days.' },
      { step: 4, title: 'Configure retention', description: 'Enterprise customers can set custom data retention periods to meet their GDPR policies.' },
    ],
    relatedFeatures: ['ccpa-compliance', 'privacy-policy', 'data-retention', 'data-encryption', 'cookie-consent'],
  },
  {
    slug: 'ccpa-compliance',
    detailedDescription: 'POTAL complies with the California Consumer Privacy Act (CCPA). Users can request access to their data, opt out of data sale (POTAL does not sell data), and request deletion. Compliance details are documented in the privacy policy.',
    howToUse: [
      { step: 1, title: 'Access your data', description: 'Submit a data access request to receive a copy of all personal information POTAL holds.' },
      { step: 2, title: 'Opt out of sale', description: 'POTAL does not sell personal data. The "Do Not Sell" link is provided for compliance.' },
      { step: 3, title: 'Request deletion', description: 'Submit a deletion request — all personal data is removed within the required timeframe.' },
      { step: 4, title: 'Non-discrimination', description: 'POTAL provides equal service regardless of whether you exercise CCPA rights.' },
    ],
    relatedFeatures: ['gdpr-compliance', 'privacy-policy', 'data-retention', 'terms-of-service', 'cookie-consent'],
  },
  {
    slug: 'terms-of-service',
    detailedDescription: 'POTAL\'s Terms of Service govern API usage, data handling, acceptable use, and liability. The ToS covers the Forever Free tier, Enterprise agreements, API rate limits, and intellectual property provisions.',
    howToUse: [
      { step: 1, title: 'Read the terms', description: 'Review the full Terms of Service at potal.app/legal/terms before using the API.' },
      { step: 2, title: 'Acceptable use', description: 'The ToS defines rate limits, prohibited uses, and requirements for attribution.' },
      { step: 3, title: 'Enterprise agreements', description: 'Enterprise customers receive custom terms with SLA guarantees and dedicated support.' },
      { step: 4, title: 'Updates notification', description: 'Material changes to the ToS are communicated via email 30 days before taking effect.' },
    ],
    relatedFeatures: ['privacy-policy', 'gdpr-compliance', 'ccpa-compliance', 'cookie-consent', 'compliance-reports'],
  },
  {
    slug: 'privacy-policy',
    detailedDescription: 'POTAL\'s Privacy Policy explains what data is collected, how it is used, and how it is protected. POTAL collects minimal data — account information for authentication and API logs for service improvement. No personal buyer data is stored.',
    howToUse: [
      { step: 1, title: 'Read the policy', description: 'Review the full Privacy Policy at potal.app/legal/privacy.' },
      { step: 2, title: 'Understand data collection', description: 'POTAL collects: email (account), API usage logs (service), and calculation inputs (temporary processing).' },
      { step: 3, title: 'Third-party sharing', description: 'POTAL does not sell data. Third-party services (hosting, email) have their own DPAs in place.' },
      { step: 4, title: 'Exercise your rights', description: 'Contact privacy@potal.app for data access, correction, or deletion requests.' },
    ],
    relatedFeatures: ['terms-of-service', 'gdpr-compliance', 'ccpa-compliance', 'data-encryption', 'cookie-consent'],
  },
  {
    slug: 'cookie-consent',
    detailedDescription: 'POTAL uses minimal cookies — session authentication and essential functionality only. No tracking or advertising cookies. The cookie consent banner allows users to review and manage cookie preferences in compliance with ePrivacy and GDPR.',
    howToUse: [
      { step: 1, title: 'Review cookie usage', description: 'View the cookie policy at potal.app/legal/cookies for a complete list of cookies used.' },
      { step: 2, title: 'Manage preferences', description: 'Use the cookie consent banner to accept or reject non-essential cookies.' },
      { step: 3, title: 'Widget cookies', description: 'The embedded JS widget uses no cookies — it operates via API calls only.' },
      { step: 4, title: 'API cookies', description: 'API endpoints do not use cookies — authentication is via API key headers only.' },
    ],
    relatedFeatures: ['privacy-policy', 'gdpr-compliance', 'ccpa-compliance', 'terms-of-service', 'security-headers'],
  },
  {
    slug: 'compliance-reports',
    detailedDescription: 'Generate compliance audit reports documenting your organization\'s cross-border trade activity, classification accuracy, and regulatory adherence. Reports cover HS code audit trails, duty payment summaries, and sanctions screening logs.',
    howToUse: [
      { step: 1, title: 'Generate a report', description: 'GET /api/v1/reports/compliance-audit with date range and report type parameters.' },
      { step: 2, title: 'Choose report type', description: 'Available types: classification-audit, duty-summary, sanctions-log, and trade-activity.' },
      { step: 3, title: 'Schedule recurring', description: 'Set up monthly compliance reports delivered via email for ongoing regulatory requirements.' },
      { step: 4, title: 'Export for auditors', description: 'Download reports as PDF with signatures for submission to customs authorities or internal audit.' },
    ],
    apiEndpoint: '/api/v1/reports/compliance-audit',
    apiMethod: 'GET',
    relatedFeatures: ['audit-logging', 'usage-analytics', 'pdf-reports', 'scheduled-reports', 'gdpr-compliance'],
  },
];

const WEB_GUIDES: FeatureGuide[] = [
  {
    slug: 'landing-page',
    detailedDescription: 'POTAL\'s landing page at potal.app showcases all 140+ features with an interactive hero calculator, competitive comparison charts, and clear CTAs. Optimized for conversion with fast load times and mobile-responsive design.',
    howToUse: [
      { step: 1, title: 'Try the calculator', description: 'Use the hero calculator on the homepage to see a live landed cost calculation without signing up.' },
      { step: 2, title: 'Explore features', description: 'Browse the full feature list organized by category — click any feature for a detailed guide.' },
      { step: 3, title: 'Compare competitors', description: 'View side-by-side comparison charts showing POTAL vs Zonos, Avalara, and others.' },
      { step: 4, title: 'Sign up free', description: 'Click "Start Free" to create an account and get API access in under 2 minutes.' },
    ],
    relatedFeatures: ['pricing-page', 'seo-optimization', 'multi-language-ui', 'js-widget', 'custom-branding'],
  },
  {
    slug: 'pricing-page',
    detailedDescription: 'POTAL\'s pricing page explains the Forever Free model — all 140+ features included at $0, with 100,000 API calls per month (soft cap). Enterprise customers with custom requirements can contact us for dedicated infrastructure and SLA guarantees.',
    howToUse: [
      { step: 1, title: 'View pricing', description: 'Visit potal.app/pricing to see the Forever Free plan details and included features.' },
      { step: 2, title: 'Compare with competitors', description: 'The pricing page includes a comparison showing POTAL\'s $0 vs competitor pricing ($500+/month).' },
      { step: 3, title: 'Check API limits', description: 'Review the soft cap (100K calls/month, 60 requests/minute) and what happens when exceeded.' },
      { step: 4, title: 'Contact Enterprise', description: 'For custom volume, SLA, or white-label requirements, use the Enterprise contact form.' },
    ],
    relatedFeatures: ['landing-page', 'dashboard', 'onboarding-wizard', 'seo-optimization', 'multi-language-ui'],
  },
  {
    slug: 'blog',
    detailedDescription: 'POTAL\'s blog covers cross-border commerce insights, tariff updates, regulatory changes, and product announcements. Content includes HS code guides, trade policy analysis, and practical tutorials for e-commerce sellers.',
    howToUse: [
      { step: 1, title: 'Browse articles', description: 'Visit potal.app/blog for the latest posts on trade regulations, features, and industry news.' },
      { step: 2, title: 'Search by topic', description: 'Filter articles by category: Tariffs, Compliance, Product Updates, or Tutorials.' },
      { step: 3, title: 'Subscribe', description: 'Sign up for the newsletter to receive new articles and regulatory update summaries.' },
      { step: 4, title: 'Contribute', description: 'Share your cross-border commerce expertise — contact us about guest posting opportunities.' },
    ],
    relatedFeatures: ['seo-optimization', 'knowledge-base', 'landing-page', 'email-campaigns', 'community-forum'],
  },
  {
    slug: 'seo-optimization',
    detailedDescription: 'POTAL\'s website is optimized for search engines with structured data (JSON-LD), dynamic meta tags, sitemap generation, and fast Core Web Vitals. Each of the 140+ feature guide pages is individually indexed with unique meta descriptions.',
    howToUse: [
      { step: 1, title: 'Share feature links', description: 'Each feature page has a unique, SEO-friendly URL (potal.app/features/[slug]) for sharing and linking.' },
      { step: 2, title: 'Embed structured data', description: 'Feature pages include JSON-LD structured data for rich search result snippets.' },
      { step: 3, title: 'Check sitemap', description: 'The sitemap at potal.app/sitemap.xml lists all indexed pages for search engine crawlers.' },
      { step: 4, title: 'Link to POTAL', description: 'Linking to POTAL from your site improves discoverability for both platforms.' },
    ],
    relatedFeatures: ['landing-page', 'blog', 'pricing-page', 'multi-language-ui', 'knowledge-base'],
  },
];

const SUPPORT_GUIDES: FeatureGuide[] = [
  {
    slug: 'knowledge-base',
    detailedDescription: 'Searchable knowledge base with guides, FAQs, and troubleshooting articles for POTAL. Covers API integration, widget setup, HS classification best practices, and common error resolutions. Available at potal.app/help.',
    howToUse: [
      { step: 1, title: 'Search for answers', description: 'Use the search bar at potal.app/help to find articles by keyword or error code.' },
      { step: 2, title: 'Browse categories', description: 'Articles are organized by topic: Getting Started, API, Widget, Classification, Billing, and Troubleshooting.' },
      { step: 3, title: 'Follow tutorials', description: 'Step-by-step tutorials walk you through common integration scenarios with code examples.' },
      { step: 4, title: 'Request new articles', description: 'Can\'t find what you need? Post in the Community forum and we\'ll create a knowledge base article.' },
    ],
    relatedFeatures: ['api-documentation', 'video-tutorials', 'community-forum', 'ai-chatbot', 'onboarding-wizard'],
  },
  {
    slug: 'video-tutorials',
    detailedDescription: 'Video walkthroughs covering POTAL setup, API integration, widget embedding, and advanced features. Available on YouTube with Korean and English subtitles. Each video is under 5 minutes with hands-on demonstrations.',
    howToUse: [
      { step: 1, title: 'Watch getting started', description: 'Start with the "POTAL in 5 Minutes" overview video for a quick introduction to all features.' },
      { step: 2, title: 'Follow along', description: 'Each tutorial includes a companion code repository and API examples you can follow step-by-step.' },
      { step: 3, title: 'Browse by topic', description: 'Videos are organized by category: Setup, API, Widget, Classification, and Advanced.' },
      { step: 4, title: 'Request a topic', description: 'Suggest new video topics in the Community forum.' },
    ],
    relatedFeatures: ['knowledge-base', 'api-documentation', 'onboarding-wizard', 'product-tour', 'training-program'],
  },
  {
    slug: 'community-forum',
    detailedDescription: 'POTAL Community forum at potal.app/community for questions, bug reports, feature requests, and discussions. Browse by category (140 features) or post type (Bug Report, Question, Feature Request). Upvote and comment on posts.',
    howToUse: [
      { step: 1, title: 'Browse posts', description: 'Visit potal.app/community to see recent posts, filtered by category or post type.' },
      { step: 2, title: 'Ask a question', description: 'Create a new post with the "Question" type and select the relevant feature category.' },
      { step: 3, title: 'Report bugs', description: 'Use the "Bug Report" post type with detailed reproduction steps and API responses.' },
      { step: 4, title: 'Vote on features', description: 'Upvote feature requests to help prioritize the POTAL roadmap.' },
    ],
    relatedFeatures: ['knowledge-base', 'ai-chatbot', 'video-tutorials', 'training-program', 'customer-success'],
  },
  {
    slug: 'training-program',
    detailedDescription: 'Structured training program for teams adopting POTAL. Covers cross-border trade fundamentals, HS classification methodology, API integration patterns, and widget customization. Available as self-paced online modules or live sessions for Enterprise.',
    howToUse: [
      { step: 1, title: 'Enroll in self-paced course', description: 'Access the training modules at potal.app/training — covers beginner to advanced topics.' },
      { step: 2, title: 'Complete modules', description: 'Each module includes video lessons, quizzes, and hands-on API exercises.' },
      { step: 3, title: 'Track progress', description: 'Your training dashboard shows completed modules, scores, and time spent.' },
      { step: 4, title: 'Request live training', description: 'Enterprise customers can schedule live training sessions with the POTAL team.' },
    ],
    relatedFeatures: ['certification', 'video-tutorials', 'knowledge-base', 'customer-success', 'community-forum'],
  },
  {
    slug: 'certification',
    detailedDescription: 'Earn a POTAL Certified Professional credential by completing the training program and passing the certification exam. Demonstrates expertise in cross-border trade calculations, HS classification, and POTAL API integration.',
    howToUse: [
      { step: 1, title: 'Complete training', description: 'Finish all required training modules to unlock the certification exam.' },
      { step: 2, title: 'Take the exam', description: 'The certification exam covers HS classification, landed cost calculation, and API integration.' },
      { step: 3, title: 'Receive credential', description: 'Upon passing, receive a digital certificate and badge for your LinkedIn profile.' },
      { step: 4, title: 'Maintain certification', description: 'Recertify annually to stay current with POTAL features and trade regulation changes.' },
    ],
    relatedFeatures: ['training-program', 'knowledge-base', 'video-tutorials', 'customer-success', 'community-forum'],
  },
  {
    slug: 'customer-success',
    detailedDescription: 'Dedicated customer success management for Enterprise customers. Your CSM helps with onboarding, integration planning, quarterly business reviews, and proactive issue resolution. Available via Dashboard or direct contact.',
    howToUse: [
      { step: 1, title: 'Meet your CSM', description: 'Enterprise customers are assigned a dedicated Customer Success Manager upon onboarding.' },
      { step: 2, title: 'Schedule reviews', description: 'Quarterly business reviews cover usage trends, optimization opportunities, and upcoming features.' },
      { step: 3, title: 'Get integration help', description: 'Your CSM coordinates with engineering for complex integration requirements.' },
      { step: 4, title: 'Check account health', description: 'GET /api/v1/account/csm returns your account health score and CSM contact information.' },
    ],
    apiEndpoint: '/api/v1/account/csm',
    apiMethod: 'GET',
    relatedFeatures: ['training-program', 'certification', 'community-forum', 'ai-chatbot', 'knowledge-base'],
  },
  {
    slug: 'ai-chatbot',
    detailedDescription: 'AI-powered support chatbot that answers questions about POTAL features, API usage, and HS classification in real time. Trained on the knowledge base, API documentation, and community forum content. Escalates complex issues to human support.',
    howToUse: [
      { step: 1, title: 'Open the chat', description: 'Click the chat icon in the bottom-right corner of any POTAL page to start a conversation.' },
      { step: 2, title: 'Ask questions', description: 'Ask about API endpoints, error codes, classification logic, or feature usage in natural language.' },
      { step: 3, title: 'API access', description: 'POST /api/v1/support/chat with your question to get programmatic chatbot responses.' },
      { step: 4, title: 'Escalate to human', description: 'Type "speak to a person" to create a support ticket and get human assistance.' },
    ],
    apiEndpoint: '/api/v1/support/chat',
    apiMethod: 'POST',
    relatedFeatures: ['knowledge-base', 'community-forum', 'customer-success', 'sentiment-analysis', 'in-app-notifications'],
  },
  {
    slug: 'sentiment-analysis',
    detailedDescription: 'Analyze customer sentiment from support interactions, community posts, and feedback surveys. Track satisfaction trends over time and identify common pain points to improve the product and support experience.',
    howToUse: [
      { step: 1, title: 'View sentiment dashboard', description: 'Go to Dashboard > Support > Sentiment to see overall satisfaction scores and trends.' },
      { step: 2, title: 'Analyze by category', description: 'Break down sentiment by feature category to identify which areas need improvement.' },
      { step: 3, title: 'Track over time', description: 'Monitor sentiment changes after product updates or support process changes.' },
      { step: 4, title: 'Act on insights', description: 'Use sentiment data to prioritize bug fixes, feature improvements, and documentation updates.' },
    ],
    relatedFeatures: ['ai-chatbot', 'customer-success', 'community-forum', 'usage-analytics', 'data-visualization'],
  },
];

const BUSINESS_GUIDES: FeatureGuide[] = [
  {
    slug: 'partner-portal',
    detailedDescription: 'Dedicated portal for POTAL partners to manage their integration, track referrals, access co-marketing resources, and view commission earnings. Partners get priority support and early access to new features.',
    howToUse: [
      { step: 1, title: 'Apply to become a partner', description: 'Submit a partner application at potal.app/partners with your company details and integration plans.' },
      { step: 2, title: 'Access the portal', description: 'Once approved, log in to the Partner Portal via Dashboard > Partners to manage your partnership.' },
      { step: 3, title: 'Track referrals', description: 'GET /api/v1/partners returns your referral stats, active clients, and commission earnings.' },
      { step: 4, title: 'Access resources', description: 'Download co-marketing materials, integration guides, and partner-exclusive documentation.' },
    ],
    apiEndpoint: '/api/v1/partners',
    apiMethod: 'GET',
    relatedFeatures: ['referral-program', 'affiliate-system', 'reseller-program', 'partner-ecosystem', 'dashboard'],
  },
  {
    slug: 'referral-program',
    detailedDescription: 'Earn rewards by referring new users to POTAL. Share your unique referral link and receive credits when referred users sign up and make their first API call. Track referral status and earnings in the Dashboard.',
    howToUse: [
      { step: 1, title: 'Get your referral link', description: 'Find your unique referral link in Dashboard > Referrals.' },
      { step: 2, title: 'Share with others', description: 'Share the link via email, social media, or your website. Referrals are tracked automatically.' },
      { step: 3, title: 'Track conversions', description: 'Monitor how many people clicked your link, signed up, and became active users.' },
      { step: 4, title: 'Earn rewards', description: 'Receive account credits or other rewards when referred users complete qualifying actions.' },
    ],
    relatedFeatures: ['affiliate-system', 'partner-portal', 'reseller-program', 'partner-ecosystem', 'email-campaigns'],
  },
  {
    slug: 'affiliate-system',
    detailedDescription: 'POTAL\'s affiliate program lets content creators, consultants, and trade professionals earn commissions by promoting POTAL. Affiliates receive tracking links, marketing materials, and real-time commission reporting.',
    howToUse: [
      { step: 1, title: 'Apply as affiliate', description: 'Submit an affiliate application at potal.app/affiliates with your website or channel details.' },
      { step: 2, title: 'Get tracking links', description: 'After approval, access your unique tracking links and promotional banners in the affiliate dashboard.' },
      { step: 3, title: 'Promote POTAL', description: 'Share tracking links in blog posts, videos, newsletters, or social media content.' },
      { step: 4, title: 'Track earnings', description: 'View real-time click, signup, and commission data in your affiliate dashboard.' },
    ],
    relatedFeatures: ['referral-program', 'partner-portal', 'reseller-program', 'partner-ecosystem', 'email-campaigns'],
  },
  {
    slug: 'reseller-program',
    detailedDescription: 'White-label reseller program for agencies and consultants who want to offer POTAL\'s landed cost capabilities under their own brand. Resellers get volume pricing, white-label widget access, and dedicated support.',
    howToUse: [
      { step: 1, title: 'Apply as reseller', description: 'Contact the Enterprise team to discuss reseller terms, pricing, and white-label options.' },
      { step: 2, title: 'Set up white-label', description: 'Configure your branded widget with custom colors, logo, and domain using the white-label API.' },
      { step: 3, title: 'Manage clients', description: 'Create sub-accounts for each client with separate API keys and usage tracking.' },
      { step: 4, title: 'Bill your clients', description: 'Set your own pricing — POTAL provides the infrastructure at wholesale rates.' },
    ],
    relatedFeatures: ['partner-portal', 'white-label-widget', 'custom-branding', 'affiliate-system', 'partner-ecosystem'],
  },
  {
    slug: 'partner-ecosystem',
    detailedDescription: 'POTAL\'s partner ecosystem connects e-commerce platforms, logistics providers, customs brokers, and trade consultants. Partners integrate POTAL into their workflows and offer landed cost capabilities to their own customers.',
    howToUse: [
      { step: 1, title: 'Explore partners', description: 'Browse the partner directory at potal.app/partners to find integration partners in your industry.' },
      { step: 2, title: 'Join the ecosystem', description: 'Apply to become a technology or service partner to list your integration in the directory.' },
      { step: 3, title: 'Build an integration', description: 'Use the Partner API (GET /api/v1/partners) to build and manage your POTAL integration.' },
      { step: 4, title: 'Co-market', description: 'Partners get access to co-marketing opportunities, case studies, and joint webinars.' },
    ],
    apiEndpoint: '/api/v1/partners',
    apiMethod: 'GET',
    relatedFeatures: ['partner-portal', 'referral-program', 'affiliate-system', 'reseller-program', 'marketplace-connect'],
  },
];

const MARKETING_GUIDES: FeatureGuide[] = [
  {
    slug: 'email-campaigns',
    detailedDescription: 'Targeted email campaigns for product announcements, feature updates, and educational content. POTAL sends opt-in emails about tariff rate changes, new feature launches, and cross-border commerce best practices.',
    howToUse: [
      { step: 1, title: 'Subscribe to updates', description: 'Sign up for the POTAL newsletter at potal.app or opt in during account registration.' },
      { step: 2, title: 'Choose preferences', description: 'Select which email types you want: Product Updates, Regulatory Changes, Tips & Tutorials.' },
      { step: 3, title: 'Manage subscriptions', description: 'Update preferences anytime in Dashboard > Settings > Email Preferences or via unsubscribe links.' },
      { step: 4, title: 'Partner campaigns', description: 'Partners can co-create email campaigns highlighting their POTAL integration.' },
    ],
    relatedFeatures: ['email-notifications', 'referral-program', 'affiliate-system', 'partner-portal', 'community-forum'],
  },
];

// ─── Combined lookup ────────────────────────────────

const ALL_GUIDES: FeatureGuide[] = [
  ...CORE_GUIDES,
  ...TRADE_GUIDES,
  ...TAX_GUIDES,
  ...SHIPPING_GUIDES,
  ...PLATFORM_GUIDES,
  ...INTEGRATION_GUIDES,
  ...SECURITY_GUIDES,
  ...LEGAL_GUIDES,
  ...WEB_GUIDES,
  ...SUPPORT_GUIDES,
  ...BUSINESS_GUIDES,
  ...MARKETING_GUIDES,
];

const GUIDE_MAP = new Map<string, FeatureGuide>();
for (const g of ALL_GUIDES) {
  GUIDE_MAP.set(g.slug, g);
}

export function getGuideBySlug(slug: string): FeatureGuide | undefined {
  return GUIDE_MAP.get(slug);
}

export { ALL_GUIDES };
