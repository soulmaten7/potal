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
    detailedDescription: 'Classify any product into its correct HS (Harmonized System) code using POTAL\'s v3.3 GRI pipeline. The system uses 595 codified rules across all 21 Sections of the HS nomenclature — zero AI calls, zero per-request cost. Supports text-based classification with 9-field input, image-based classification, and batch processing for hundreds of products at once.',
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
    detailedDescription: 'Validate HS code inputs using POTAL\'s 9-field validation system. Before classification, the system checks that all input fields are valid and complete. It verifies product name format, material groups against the 79 WCO-defined groups, processing methods, and composition data to ensure the most accurate classification possible.',
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
  makeGuide('carrier-integration', ['shipping-rates', 'label-generation', 'tracking', 'ddp-quote', 'multi-package']),
  makeGuide('label-generation', ['shipping-rates', 'carrier-integration', 'customs-forms', 'tracking', 'multi-package'], { endpoint: '/api/v1/shipping/labels', method: 'POST' }),
  makeGuide('tracking', ['shipping-rates', 'carrier-integration', 'label-generation', 'webhooks', 'order-sync']),
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
  makeGuide('dimensional-weight', ['shipping-rates', 'multi-package', 'carrier-integration', 'total-landed-cost', 'insurance-calc']),
  makeGuide('insurance-calc', ['shipping-rates', 'total-landed-cost', 'ddp-quote', 'carrier-integration', 'returns-management']),
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
  makeGuide('multi-package', ['shipping-rates', 'dimensional-weight', 'carrier-integration', 'label-generation', 'total-landed-cost']),
  makeGuide('3pl-integration', ['multi-warehouse', 'inventory-sync', 'order-sync', 'shipping-rates', 'carrier-integration']),
  makeGuide('multi-warehouse', ['3pl-integration', 'inventory-sync', 'shipping-rates', 'order-sync', 'multi-package']),
];

// ─── Remaining categories: use compact format ────────

const PLATFORM_GUIDES: FeatureGuide[] = [
  makeGuide('multi-language-ui', ['multi-country-support', 'landing-page', 'dashboard', 'js-widget', 'white-label-widget']),
  makeGuide('rest-api', ['api-key-auth', 'versioned-api', 'openapi-spec', 'api-documentation', 'rate-limiting']),
  makeGuide('api-key-auth', ['rest-api', 'rate-limiting', 'access-control', 'sandbox-environment', 'role-based-access']),
  makeGuide('rate-limiting', ['api-key-auth', 'high-throughput', 'error-handling', 'rest-api', 'sandbox-environment']),
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
  makeGuide('dashboard', ['usage-analytics', 'sla-dashboard', 'user-management', 'role-based-access', 'onboarding-wizard']),
  makeGuide('usage-analytics', ['dashboard', 'sla-dashboard', 'scheduled-reports', 'custom-reports', 'data-visualization'], { endpoint: '/api/v1/admin/usage', method: 'GET' }),
  makeGuide('multi-currency', ['currency-conversion', 'total-landed-cost', 'checkout-integration', 'shipping-rates', 'ddp-quote']),
  makeGuide('white-label-widget', ['custom-branding', 'js-widget', 'checkout-integration', 'shopify-app', 'woocommerce-plugin'], { endpoint: '/api/v1/whitelabel/config', method: 'POST' }),
  makeGuide('custom-branding', ['white-label-widget', 'js-widget', 'dashboard', 'landing-page', 'email-notifications'], { endpoint: '/api/v1/branding', method: 'POST' }),
  makeGuide('batch-import-export', ['batch-classification', 'csv-export', 'pdf-reports', 'custom-reports', 'scheduled-reports'], { endpoint: '/api/v1/classify/batch', method: 'POST' }),
  makeGuide('scheduled-reports', ['custom-reports', 'usage-analytics', 'data-visualization', 'email-notifications', 'csv-export'], { endpoint: '/api/v1/reports/schedule', method: 'POST' }),
  makeGuide('custom-reports', ['scheduled-reports', 'usage-analytics', 'data-visualization', 'csv-export', 'dashboard']),
  makeGuide('data-visualization', ['custom-reports', 'usage-analytics', 'dashboard', 'sla-dashboard', 'scheduled-reports']),
  makeGuide('email-notifications', ['in-app-notifications', 'webhooks', 'scheduled-reports', 'dashboard', 'rate-monitoring']),
  makeGuide('in-app-notifications', ['email-notifications', 'webhooks', 'dashboard', 'rate-monitoring', 'usage-analytics'], { endpoint: '/api/v1/notifications', method: 'GET' }),
  makeGuide('user-management', ['role-based-access', 'team-management', 'dashboard', 'sso-support', 'api-key-auth']),
  makeGuide('role-based-access', ['user-management', 'team-management', 'access-control', 'api-key-auth', 'multi-tenant']),
  makeGuide('team-management', ['user-management', 'role-based-access', 'dashboard', 'sso-support', 'multi-tenant'], { endpoint: '/api/v1/team', method: 'GET' }),
  makeGuide('api-documentation', ['openapi-spec', 'rest-api', 'versioned-api', 'sandbox-environment', 'sdk-javascript']),
  makeGuide('sandbox-environment', ['api-key-auth', 'rest-api', 'api-documentation', 'onboarding-wizard', 'error-handling']),
  makeGuide('rate-monitoring', ['usage-analytics', 'email-notifications', 'webhooks', 'sla-dashboard', 'dashboard'], { endpoint: '/api/v1/admin/rate-monitor', method: 'GET' }),
  makeGuide('sla-dashboard', ['usage-analytics', 'uptime-monitoring', 'status-page', 'rate-monitoring', 'dashboard'], { endpoint: '/api/v1/admin/sla', method: 'GET' }),
  makeGuide('high-throughput', ['rate-limiting', 'batch-classification', 'rest-api', 'sla-dashboard', 'total-landed-cost']),
  makeGuide('webhook-retry', ['webhooks', 'error-handling', 'email-notifications', 'rest-api', 'in-app-notifications']),
  makeGuide('error-handling', ['rest-api', 'versioned-api', 'api-documentation', 'rate-limiting', 'webhook-retry']),
  makeGuide('versioned-api', ['rest-api', 'api-changelog', 'migration-guide', 'api-documentation', 'openapi-spec']),
  makeGuide('openapi-spec', ['api-documentation', 'rest-api', 'versioned-api', 'sdk-javascript', 'sdk-python'], { endpoint: '/api/v1/docs', method: 'GET' }),
  makeGuide('status-page', ['uptime-monitoring', 'sla-dashboard', 'incident-response', 'dashboard', 'rest-api'], { endpoint: '/api/v1/health', method: 'GET' }),
  makeGuide('uptime-monitoring', ['status-page', 'sla-dashboard', 'incident-response', 'email-notifications', 'webhooks']),
  makeGuide('incident-response', ['uptime-monitoring', 'status-page', 'sla-dashboard', 'email-notifications', 'webhooks']),
  makeGuide('csv-export', ['batch-import-export', 'pdf-reports', 'custom-reports', 'scheduled-reports', 'batch-classification'], { endpoint: '/api/v1/calculate/csv', method: 'GET' }),
  makeGuide('pdf-reports', ['csv-export', 'customs-documentation', 'customs-forms', 'compliance-reports', 'e-invoice'], { endpoint: '/api/v1/documents/pdf', method: 'POST' }),
  makeGuide('multi-tenant', ['role-based-access', 'user-management', 'access-control', 'data-encryption', 'data-retention']),
  makeGuide('sso-support', ['user-management', 'role-based-access', 'team-management', 'dashboard', 'api-key-auth']),
  makeGuide('audit-logging', ['audit-trail', 'usage-analytics', 'compliance-reports', 'dashboard', 'data-retention']),
  makeGuide('data-retention', ['audit-logging', 'multi-tenant', 'gdpr-compliance', 'usage-analytics', 'dashboard']),
  makeGuide('api-changelog', ['versioned-api', 'migration-guide', 'api-documentation', 'rest-api', 'openapi-spec']),
  makeGuide('migration-guide', ['api-changelog', 'versioned-api', 'api-documentation', 'onboarding-wizard', 'sdk-javascript']),
  makeGuide('onboarding-wizard', ['dashboard', 'api-key-auth', 'sandbox-environment', 'product-tour', 'api-documentation']),
  makeGuide('product-tour', ['onboarding-wizard', 'dashboard', 'knowledge-base', 'video-tutorials', 'api-documentation']),
  makeGuide('a-b-testing', ['feature-flags', 'usage-analytics', 'dashboard', 'data-visualization', 'custom-reports']),
  makeGuide('feature-flags', ['a-b-testing', 'multi-tenant', 'dashboard', 'role-based-access', 'usage-analytics']),
];

const INTEGRATION_GUIDES: FeatureGuide[] = [
  makeGuide('shopify-app', ['js-widget', 'white-label-widget', 'checkout-integration', 'woocommerce-plugin', 'total-landed-cost']),
  makeGuide('woocommerce-plugin', ['shopify-app', 'js-widget', 'checkout-integration', 'bigcommerce-plugin', 'total-landed-cost']),
  makeGuide('bigcommerce-plugin', ['shopify-app', 'woocommerce-plugin', 'js-widget', 'checkout-integration', 'magento-module']),
  makeGuide('magento-module', ['shopify-app', 'woocommerce-plugin', 'bigcommerce-plugin', 'js-widget', 'checkout-integration']),
  makeGuide('js-widget', ['shopify-app', 'white-label-widget', 'custom-branding', 'checkout-integration', 'sdk-javascript']),
  makeGuide('sdk-javascript', ['sdk-python', 'sdk-curl', 'rest-api', 'api-documentation', 'js-widget']),
  makeGuide('sdk-python', ['sdk-javascript', 'sdk-curl', 'rest-api', 'api-documentation', 'batch-classification']),
  makeGuide('sdk-curl', ['sdk-javascript', 'sdk-python', 'rest-api', 'api-documentation', 'sandbox-environment']),
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
  makeGuide('order-sync', ['checkout-integration', 'shopify-app', 'woocommerce-plugin', 'inventory-sync', 'webhooks'], { endpoint: '/api/v1/orders/sync', method: 'POST' }),
  makeGuide('inventory-sync', ['order-sync', 'multi-warehouse', '3pl-integration', 'shopify-app', 'webhooks'], { endpoint: '/api/v1/inventory/levels', method: 'GET' }),
  makeGuide('marketplace-connect', ['shopify-app', 'order-sync', 'inventory-sync', 'checkout-integration', 'webhooks'], { endpoint: '/api/v1/integrations/marketplace', method: 'POST' }),
  makeGuide('erp-integration', ['accounting-integration', 'order-sync', 'inventory-sync', 'csv-export', 'webhooks'], { endpoint: '/api/v1/integrations/erp', method: 'POST' }),
  makeGuide('accounting-integration', ['erp-integration', 'csv-export', 'e-invoice', 'pdf-reports', 'tax-calculation-vat-gst'], { endpoint: '/api/v1/integrations/accounting', method: 'POST' }),
];

const SECURITY_GUIDES: FeatureGuide[] = [
  makeGuide('data-encryption', ['access-control', 'security-headers', 'multi-tenant', 'api-key-auth', 'gdpr-compliance']),
  makeGuide('access-control', ['data-encryption', 'role-based-access', 'api-key-auth', 'multi-tenant', 'security-headers']),
  makeGuide('security-headers', ['data-encryption', 'access-control', 'vulnerability-scanning', 'penetration-testing', 'gdpr-compliance']),
  makeGuide('vulnerability-scanning', ['security-headers', 'penetration-testing', 'data-encryption', 'incident-response', 'access-control']),
  makeGuide('penetration-testing', ['vulnerability-scanning', 'security-headers', 'data-encryption', 'incident-response', 'access-control']),
];

const LEGAL_GUIDES: FeatureGuide[] = [
  makeGuide('gdpr-compliance', ['ccpa-compliance', 'privacy-policy', 'data-retention', 'data-encryption', 'cookie-consent']),
  makeGuide('ccpa-compliance', ['gdpr-compliance', 'privacy-policy', 'data-retention', 'terms-of-service', 'cookie-consent']),
  makeGuide('terms-of-service', ['privacy-policy', 'gdpr-compliance', 'ccpa-compliance', 'cookie-consent', 'compliance-reports']),
  makeGuide('privacy-policy', ['terms-of-service', 'gdpr-compliance', 'ccpa-compliance', 'data-encryption', 'cookie-consent']),
  makeGuide('cookie-consent', ['privacy-policy', 'gdpr-compliance', 'ccpa-compliance', 'terms-of-service', 'security-headers']),
  makeGuide('compliance-reports', ['audit-logging', 'usage-analytics', 'pdf-reports', 'scheduled-reports', 'gdpr-compliance'], { endpoint: '/api/v1/reports/compliance-audit', method: 'GET' }),
];

const WEB_GUIDES: FeatureGuide[] = [
  makeGuide('landing-page', ['pricing-page', 'seo-optimization', 'multi-language-ui', 'js-widget', 'custom-branding']),
  makeGuide('pricing-page', ['landing-page', 'dashboard', 'onboarding-wizard', 'seo-optimization', 'multi-language-ui']),
  makeGuide('blog', ['seo-optimization', 'knowledge-base', 'landing-page', 'email-campaigns', 'community-forum']),
  makeGuide('seo-optimization', ['landing-page', 'blog', 'pricing-page', 'multi-language-ui', 'knowledge-base']),
];

const SUPPORT_GUIDES: FeatureGuide[] = [
  makeGuide('knowledge-base', ['api-documentation', 'video-tutorials', 'community-forum', 'ai-chatbot', 'onboarding-wizard']),
  makeGuide('video-tutorials', ['knowledge-base', 'api-documentation', 'onboarding-wizard', 'product-tour', 'training-program']),
  makeGuide('community-forum', ['knowledge-base', 'ai-chatbot', 'video-tutorials', 'training-program', 'customer-success']),
  makeGuide('training-program', ['certification', 'video-tutorials', 'knowledge-base', 'customer-success', 'community-forum']),
  makeGuide('certification', ['training-program', 'knowledge-base', 'video-tutorials', 'customer-success', 'community-forum']),
  makeGuide('customer-success', ['training-program', 'certification', 'community-forum', 'ai-chatbot', 'knowledge-base'], { endpoint: '/api/v1/account/csm', method: 'GET' }),
  makeGuide('ai-chatbot', ['knowledge-base', 'community-forum', 'customer-success', 'sentiment-analysis', 'in-app-notifications'], { endpoint: '/api/v1/support/chat', method: 'POST' }),
  makeGuide('sentiment-analysis', ['ai-chatbot', 'customer-success', 'community-forum', 'usage-analytics', 'data-visualization']),
];

const BUSINESS_GUIDES: FeatureGuide[] = [
  makeGuide('partner-portal', ['referral-program', 'affiliate-system', 'reseller-program', 'partner-ecosystem', 'dashboard'], { endpoint: '/api/v1/partners', method: 'GET' }),
  makeGuide('referral-program', ['affiliate-system', 'partner-portal', 'reseller-program', 'partner-ecosystem', 'email-campaigns']),
  makeGuide('affiliate-system', ['referral-program', 'partner-portal', 'reseller-program', 'partner-ecosystem', 'email-campaigns']),
  makeGuide('reseller-program', ['partner-portal', 'white-label-widget', 'custom-branding', 'affiliate-system', 'partner-ecosystem']),
  makeGuide('partner-ecosystem', ['partner-portal', 'referral-program', 'affiliate-system', 'reseller-program', 'marketplace-connect'], { endpoint: '/api/v1/partners', method: 'GET' }),
];

const MARKETING_GUIDES: FeatureGuide[] = [
  makeGuide('email-campaigns', ['email-notifications', 'referral-program', 'affiliate-system', 'partner-portal', 'community-forum']),
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
