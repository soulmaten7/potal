/**
 * 9-Field Validator — Layer 2
 *
 * Validates input fields against WCO legal standards.
 * Returns field-by-field status + estimated accuracy + guide.
 */

import { MATERIAL_KEYWORDS, PROCESSING_KEYWORDS } from './steps/v3/step0-input';
import { CHAPTER_DESCRIPTIONS } from './data/chapter-descriptions';

// ─── Types ───

export interface FieldValidationResult {
  field: string;
  status: 'valid' | 'error' | 'warning';
  value: string | number | null | undefined;
  message?: string;
  valid_examples?: string[];
  closest_match?: string;
  impact?: string;
}

export interface ValidationReport {
  overall_status: 'valid' | 'has_errors' | 'has_warnings';
  valid_field_count: number;
  error_field_count: number;
  warning_field_count: number;
  estimated_accuracy: string;
  fields: FieldValidationResult[];
  guide_summary?: string;
}

// ─── ISO 3166-1 alpha-2 (240 countries) ───

const VALID_COUNTRIES = new Set([
  'AF','AL','DZ','AS','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ',
  'BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM','CA','CV','CF','TD','CL','CN','CO','KM','CG',
  'CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ',
  'FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HK','HU','IS','IN','ID',
  'IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI',
  'LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ',
  'MM','NA','NR','NP','NL','NZ','NI','NE','NG','KP','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH',
  'PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI',
  'SB','SO','ZA','KR','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT',
  'TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW','EU',
]);

// ─── Levenshtein distance for closest match ───

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findClosestMaterial(input: string): string | undefined {
  const inputLower = input.toLowerCase();
  let bestMatch = '';
  let bestDist = Infinity;

  for (const [group, variants] of Object.entries(MATERIAL_KEYWORDS)) {
    for (const v of variants) {
      const d = levenshtein(inputLower, v);
      if (d < bestDist) {
        bestDist = d;
        bestMatch = v;
      }
    }
    const d2 = levenshtein(inputLower, group);
    if (d2 < bestDist) {
      bestDist = d2;
      bestMatch = group;
    }
  }

  return bestDist <= 3 ? bestMatch : undefined;
}

// ─── Validation Functions ───

function validateProductName(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length < 2) {
    return {
      field: 'product_name', status: 'error', value,
      message: 'product_name is required (minimum 2 characters)',
      impact: 'Without product_name, classification is impossible',
    };
  }
  return { field: 'product_name', status: 'valid', value };
}

function validateMaterial(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      field: 'material', status: 'error', value,
      message: 'material is required for accurate classification.',
      valid_examples: ['cotton', 'polyester', 'steel', 'leather', 'plastic', 'wood', 'glass', 'ceramic', 'rubber', 'gold'],
      impact: 'Missing material reduces accuracy by ~45% (Section-level failure)',
    };
  }

  const inputLower = value.toLowerCase();
  let matched = false;

  for (const variants of Object.values(MATERIAL_KEYWORDS)) {
    if (variants.some(v => inputLower.includes(v))) {
      matched = true;
      break;
    }
  }
  // Also check group names
  if (!matched) {
    for (const group of Object.keys(MATERIAL_KEYWORDS)) {
      if (inputLower.includes(group)) {
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    const closest = findClosestMaterial(value);
    return {
      field: 'material', status: 'error', value,
      message: `material '${value}' does not match WCO classification standards.`,
      valid_examples: ['cotton', 'polyester', 'steel', 'leather', 'plastic', 'wood', 'glass', 'ceramic'],
      closest_match: closest,
      impact: 'Invalid material reduces accuracy by ~45%',
    };
  }

  return { field: 'material', status: 'valid', value };
}

function validateOriginCountry(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      field: 'origin_country', status: 'warning', value,
      message: 'origin_country recommended for 7-10 digit HS code. Without it, classification returns 6-digit HS only.',
      valid_examples: ['US', 'CN', 'DE', 'JP', 'KR', 'VN', 'IN'],
      impact: 'Without origin_country: 6-digit HS only. With it: full 7-10 digit national code + duty rates',
    };
  }

  const upper = value.toUpperCase().trim();

  // Common mistakes
  const commonFixes: Record<string, string> = {
    'USA': 'US', 'CHINA': 'CN', 'UK': 'GB', 'KOREA': 'KR', 'JAPAN': 'JP',
    'GERMANY': 'DE', 'FRANCE': 'FR', 'INDIA': 'IN', 'VIETNAM': 'VN',
    'ITALY': 'IT', 'SPAIN': 'ES', 'AUSTRALIA': 'AU', 'CANADA': 'CA',
    'MEXICO': 'MX', 'BRAZIL': 'BR', 'TAIWAN': 'TW', 'THAILAND': 'TH',
  };

  if (commonFixes[upper]) {
    return {
      field: 'origin_country', status: 'error', value,
      message: `Use ISO 3166-1 alpha-2 code: '${commonFixes[upper]}' instead of '${value}'`,
      closest_match: commonFixes[upper],
      valid_examples: ['US', 'CN', 'DE', 'JP', 'KR'],
    };
  }

  if (!VALID_COUNTRIES.has(upper)) {
    return {
      field: 'origin_country', status: 'error', value,
      message: `'${value}' is not a valid ISO 3166-1 alpha-2 country code`,
      valid_examples: ['US', 'CN', 'DE', 'JP', 'KR'],
    };
  }

  return { field: 'origin_country', status: 'valid', value: upper };
}

// ─── Category: WCO 97 Chapter keyword set ───

function buildCategoryKeywords(): Set<string> {
  const STOP = new Set(['and','or','of','the','thereof','other','not','elsewhere',
    'specified','included','articles','parts','accessories','products','preparations',
    'whether','their','with','than','such','like','similar','certain','kind']);
  const keywords = new Set<string>();

  for (const desc of Object.values(CHAPTER_DESCRIPTIONS)) {
    const tokens = (desc as string).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
    for (const t of tokens) {
      if (t.length >= 3 && !STOP.has(t)) keywords.add(t);
    }
  }

  // Platform category terms → WCO Chapter mapping
  const PLATFORM_TERMS = [
    'clothing','apparel','fashion','electronics','computers','phones','furniture','home',
    'toys','games','footwear','shoes','jewelry','jewellery','food','grocery','beauty',
    'cosmetics','sports','fitness','automotive','cars','books','media','tools','hardware',
    'garden','outdoor','pet','pets','health','pharmaceutical','medicine','musical',
    'instruments','watches','clocks','bags','luggage','handbags','ceramic','pottery',
    'glass','glassware','paper','stationery','plastic','rubber','wood','wooden',
    'textile','fabric','carpet','rug','soap','detergent','perfume','fragrance',
    'tobacco','cigarettes','alcohol','wine','beer','spirits',
    // Section XII: Headgear
    'hat','hats','cap','caps','headgear','headwear','beret','helmet','bonnet','visor',
    // Section IV: Prepared foodstuffs
    'chocolate','cocoa','candy','confectionery','snack','snacks','bakery','cereal',
    'beverage','sauce','condiment','seasoning',
    // Section XXI: Art
    'painting','sculpture','antique','antiques','artwork','art','engraving','lithograph',
    // Section XIX: Arms
    'weapon','weapons','firearm','firearms','ammunition','gun','guns','rifle',
    // Kitchen/household
    'kitchenware','cookware','tableware','cutlery','knife','knives','pot','pots','pan','pans',
    // Section III: Fats/oils
    'oil','oils','fat','fats','margarine','butter',
    // Section XIV: Precious metals/stones
    'gold','silver','platinum','diamond','gemstone','pearl',
  ];
  for (const t of PLATFORM_TERMS) keywords.add(t);

  return keywords;
}

const CATEGORY_VALID_KEYWORDS = buildCategoryKeywords();

function validateCategory(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      field: 'category', status: 'warning', value,
      message: 'Adding category improves accuracy by ~33%. Use WCO Chapter description or common product category.',
      valid_examples: ['Clothing', 'Electronics', 'Furniture', 'Toys', 'Footwear', 'Jewelry', 'Pharmaceutical products'],
      impact: 'Missing category reduces accuracy by ~33% (Chapter-level ambiguity)',
    };
  }

  const inputLower = value.toLowerCase().trim();
  const tokens = inputLower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length >= 3);

  let matched = false;
  for (const token of tokens) {
    if (CATEGORY_VALID_KEYWORDS.has(token)) { matched = true; break; }
  }
  if (!matched) {
    for (const kw of CATEGORY_VALID_KEYWORDS) {
      if (inputLower.includes(kw)) { matched = true; break; }
    }
  }

  if (!matched) {
    let bestMatch = '';
    let bestDist = Infinity;
    for (const kw of CATEGORY_VALID_KEYWORDS) {
      const d = levenshtein(inputLower, kw);
      if (d < bestDist) { bestDist = d; bestMatch = kw; }
    }
    return {
      field: 'category', status: 'error', value,
      message: `category '${value}' does not match WCO Chapter classifications.`,
      valid_examples: ['Clothing', 'Electronics', 'Footwear', 'Furniture', 'Toys', 'Jewelry', 'Pharmaceutical products'],
      closest_match: bestDist <= 4 ? bestMatch : undefined,
      impact: 'Invalid category reduces accuracy by ~33%',
    };
  }

  return { field: 'category', status: 'valid', value };
}

function validateProcessing(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { field: 'processing', status: 'valid', value };
  }
  const inputLower = value.toLowerCase();
  const matched = PROCESSING_KEYWORDS.some(kw => inputLower.includes(kw));
  if (!matched) {
    return {
      field: 'processing', status: 'warning', value,
      message: `processing '${value}' not recognized in standard terms`,
      valid_examples: ['knitted', 'woven', 'forged', 'cast', 'molded', 'assembled', 'frozen', 'dried'],
    };
  }
  return { field: 'processing', status: 'valid', value };
}

function validateComposition(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { field: 'composition', status: 'valid', value };
  }
  // Check for percentage pattern
  const pctMatches = value.match(/(\d+(?:\.\d+)?)\s*%/g);
  if (pctMatches) {
    const total = pctMatches.reduce((sum, m) => sum + parseFloat(m), 0);
    if (total > 100) {
      return {
        field: 'composition', status: 'warning', value,
        message: `Composition percentages sum to ${total}% (exceeds 100%)`,
        valid_examples: ['100% cotton', '85% cotton, 15% polyester'],
      };
    }
  }
  return { field: 'composition', status: 'valid', value };
}

// ─── Weight/Spec: SI + trade units ───

const VALID_WEIGHT_UNITS = new Set([
  'kg','g','mg','t','lb','lbs','oz','ct','carat',
  'm','cm','mm','km','in','inch','inches','ft','feet','yd','yard','yards',
  'm²','m2','cm²','cm2','mm²','mm2','sqm','sqft','sqin',
  'l','ml','cl','gal','gallon','qt','quart','pt','pint',
  'g/m²','g/m2','gsm','oz/yd²','oz/yd2','kg/m³','kg/m3',
  'den','denier','dtex','tex',
  'v','w','kw','a','mah','wh','kwh',
  'pcs','pc','piece','pieces','pair','pairs','set','sets','dozen','doz','gross','ream','bbl','barrel',
]);

const WEIGHT_SPEC_PATTERN = /(\d+(?:\.\d+)?)\s*([a-zA-Zµ²³\/][a-zA-Z0-9µ²³\/]*)/;

function validateWeightSpec(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { field: 'weight_spec', status: 'valid', value };
  }

  const trimmed = value.trim();
  const match = trimmed.match(WEIGHT_SPEC_PATTERN);
  if (!match) {
    return {
      field: 'weight_spec', status: 'warning', value,
      message: 'weight_spec should be in "number + unit" format.',
      valid_examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '50W', '2000mAh'],
    };
  }

  const unit = match[2].trim();
  const unitLower = unit.toLowerCase();
  const unitMatched = VALID_WEIGHT_UNITS.has(unit) ||
                      VALID_WEIGHT_UNITS.has(unitLower) ||
                      VALID_WEIGHT_UNITS.has(unit.replace('²', '2'));

  if (!unitMatched) {
    let bestUnit = '';
    let bestDist = Infinity;
    for (const vu of VALID_WEIGHT_UNITS) {
      const d = levenshtein(unitLower, vu.toLowerCase());
      if (d < bestDist) { bestDist = d; bestUnit = vu; }
    }
    return {
      field: 'weight_spec', status: 'warning', value,
      message: `Unit '${unit}' not recognized. Use SI units or standard trade units.`,
      valid_examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '50W'],
      closest_match: bestDist <= 2 ? bestUnit : undefined,
    };
  }

  return { field: 'weight_spec', status: 'valid', value };
}

function validatePrice(value: number | null | undefined): FieldValidationResult {
  if (value === null || value === undefined) {
    return { field: 'price', status: 'valid', value };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: 'price', status: 'error', value,
      message: 'price must be a number (USD).',
      valid_examples: ['9.99', '49.99', '199.00'],
    };
  }

  if (value <= 0) {
    return {
      field: 'price', status: 'error', value,
      message: 'price must be positive (USD). Used for price-break tariff rules.',
      valid_examples: ['9.99', '49.99', '199.00'],
    };
  }

  if (value > 1000000) {
    return {
      field: 'price', status: 'warning', value,
      message: `price $${value.toLocaleString()} is unusually high. Verify this is the correct unit price in USD.`,
    };
  }

  return { field: 'price', status: 'valid', value };
}

function validateDescription(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { field: 'description', status: 'valid', value: null };
  }

  const trimmed = value.trim();

  if (trimmed.length < 10) {
    return {
      field: 'description', status: 'warning', value,
      message: `Description too short (${trimmed.length} chars). Customs declarations require meaningful product description (min 10 chars).`,
      valid_examples: ['Short-sleeve crew-neck cotton t-shirt, screen printed', 'Wireless bluetooth earbuds with charging case'],
    };
  }

  const alphaCount = (trimmed.match(/[a-zA-Z\u3000-\u9FFF\uAC00-\uD7AF]/g) || []).length;
  if (alphaCount < 5) {
    return {
      field: 'description', status: 'warning', value,
      message: 'Description should contain meaningful text describing the product, not just numbers or codes.',
      valid_examples: ['Men\'s cotton polo shirt, short sleeve, solid color', 'Stainless steel insulated water bottle, 500ml'],
    };
  }

  return { field: 'description', status: 'valid', value };
}

// ─── Main Validation ───

export interface ValidateInput {
  product_name?: string;
  material?: string;
  origin_country?: string;
  category?: string;
  processing?: string;
  composition?: string;
  weight_spec?: string;
  price?: number;
  description?: string;
}

export function validateFields(input: ValidateInput): ValidationReport {
  const fields: FieldValidationResult[] = [
    validateProductName(input.product_name),
    validateMaterial(input.material),
    validateOriginCountry(input.origin_country),
    validateCategory(input.category),
    validateProcessing(input.processing),
    validateComposition(input.composition),
    validateWeightSpec(input.weight_spec),
    validatePrice(input.price),
    validateDescription(input.description),
  ];

  const errors = fields.filter(f => f.status === 'error').length;
  const warnings = fields.filter(f => f.status === 'warning').length;
  const valid = fields.filter(f => f.status === 'valid').length;

  // Estimated accuracy based on 466-combination Ablation data
  let accuracy = 0;
  if (fields.find(f => f.field === 'product_name')?.status === 'valid') accuracy += 18;
  if (fields.find(f => f.field === 'material')?.status === 'valid') accuracy += 45;
  if (fields.find(f => f.field === 'category')?.status === 'valid') accuracy += 33;
  if (fields.find(f => f.field === 'description')?.status === 'valid' && input.description) accuracy += 4;
  accuracy = Math.min(accuracy, 100);

  const overall = errors > 0 ? 'has_errors' : warnings > 0 ? 'has_warnings' : 'valid';

  let guide = '';
  if (errors > 0) {
    const missingRequired = fields.filter(f => f.status === 'error').map(f => f.field);
    guide = `Fix required fields (${missingRequired.join(', ')}) to enable classification.`;
  } else if (warnings > 0) {
    const missingOptional = fields.filter(f => f.status === 'warning').map(f => f.field);
    guide = `Adding ${missingOptional.join(', ')} can improve accuracy to ~100%.`;
  }

  return {
    overall_status: overall,
    valid_field_count: valid,
    error_field_count: errors,
    warning_field_count: warnings,
    estimated_accuracy: accuracy >= 100 ? '100%' : `~${accuracy}%`,
    fields,
    guide_summary: guide || undefined,
  };
}
