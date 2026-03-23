/**
 * Step 1: Extract keywords from product name.
 * v2.1: LLM-based understanding + code-based extraction merged.
 */

import type { KeywordResult } from '../types';
import { callLLM } from '../utils/llm-call';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'for', 'with', 'made', 'from', 'in', 'to', 'and',
  'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'shall', 'can', 'not', 'no', 'but', 'so', 'yet', 'both',
  'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
  'such', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
  'again', 'against', 'between', 'into', 'through', 'during', 'before',
  'up', 'down', 'out', 'off', 'over', 'under', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'this', 'that', 'these', 'those',
  'it', 'its', 'by', 'on', 'at', 'as', 'if', 'per', 'etc', 'also', 'used',
  'using', 'use', 'type', 'style', 'new', 'item', 'product', 'products',
]);

const MATERIALS: Record<string, string> = {
  cotton: 'cotton', polyester: 'polyester', nylon: 'nylon', silk: 'silk',
  wool: 'wool', linen: 'linen', leather: 'leather', suede: 'suede',
  rubber: 'rubber', plastic: 'plastic', metal: 'metal', steel: 'steel',
  iron: 'iron', aluminum: 'aluminum', aluminium: 'aluminum', copper: 'copper',
  brass: 'brass', bronze: 'bronze', titanium: 'titanium', gold: 'gold',
  silver: 'silver', platinum: 'platinum', wood: 'wood', bamboo: 'bamboo',
  glass: 'glass', ceramic: 'ceramic', porcelain: 'porcelain', stone: 'stone',
  marble: 'marble', granite: 'granite', paper: 'paper', cardboard: 'cardboard',
  canvas: 'canvas', denim: 'denim', velvet: 'velvet', satin: 'satin',
  acrylic: 'acrylic', pvc: 'pvc', polypropylene: 'polypropylene',
  polyethylene: 'polyethylene', silicone: 'silicone', carbon: 'carbon',
  fiber: 'fiber', fibre: 'fiber', stainless: 'stainless steel',
};

const PRODUCT_TYPES: Record<string, string> = {
  shirt: 'clothing', tshirt: 'clothing', blouse: 'clothing', dress: 'clothing',
  jacket: 'clothing', coat: 'clothing', pants: 'clothing', trousers: 'clothing',
  jeans: 'clothing', skirt: 'clothing', sweater: 'clothing', hoodie: 'clothing',
  vest: 'clothing', shorts: 'clothing', suit: 'clothing', uniform: 'clothing',
  shoe: 'footwear', shoes: 'footwear', boot: 'footwear', boots: 'footwear',
  sandal: 'footwear', sandals: 'footwear', slipper: 'footwear', sneaker: 'footwear',
  bag: 'bags', handbag: 'bags', backpack: 'bags', suitcase: 'bags',
  wallet: 'bags', purse: 'bags', luggage: 'bags', briefcase: 'bags',
  phone: 'electronics', laptop: 'electronics', computer: 'electronics',
  tablet: 'electronics', camera: 'electronics', speaker: 'electronics',
  headphone: 'electronics', headphones: 'electronics', television: 'electronics',
  tv: 'electronics', monitor: 'electronics', printer: 'electronics',
  battery: 'electronics', charger: 'electronics', cable: 'electronics',
  toy: 'toys', doll: 'toys', puzzle: 'toys', game: 'toys',
  chair: 'furniture', table: 'furniture', desk: 'furniture', sofa: 'furniture',
  bed: 'furniture', mattress: 'furniture', shelf: 'furniture', cabinet: 'furniture',
  lamp: 'lighting', light: 'lighting', bulb: 'lighting', chandelier: 'lighting',
  tool: 'tools', drill: 'tools', saw: 'tools', hammer: 'tools',
  wrench: 'tools', screwdriver: 'tools', pliers: 'tools',
  car: 'vehicle', truck: 'vehicle', bicycle: 'vehicle', motorcycle: 'vehicle',
  watch: 'watch', clock: 'watch', jewelry: 'jewelry', ring: 'jewelry',
  necklace: 'jewelry', bracelet: 'jewelry', earring: 'jewelry',
  food: 'food', candy: 'food', chocolate: 'food', coffee: 'food',
  tea: 'food', wine: 'beverage', beer: 'beverage', juice: 'beverage',
  soap: 'cosmetics', shampoo: 'cosmetics', perfume: 'cosmetics', cream: 'cosmetics',
  book: 'printed', pen: 'stationery', pencil: 'stationery',
  screw: 'fastener', bolt: 'fastener', nail: 'fastener', nut: 'fastener',
  pipe: 'pipe', tube: 'tube', wire: 'wire', rod: 'rod',
  motor: 'machinery', engine: 'machinery', pump: 'machinery', valve: 'machinery',
  bearing: 'machinery', gear: 'machinery', turbine: 'machinery',
};

// Known brand prefixes to remove
const BRAND_PATTERNS = [
  /^(?:nike|adidas|samsung|apple|sony|lg|hp|dell|lenovo|asus|acer|huawei|xiaomi|google|amazon|microsoft|bosch|siemens|philips|panasonic|canon|nikon|gucci|prada|louis vuitton|chanel|hermes|zara|hm|uniqlo)\b/i,
];

// Code-only fallback (renamed from extractKeywords)
export function extractKeywordsCode(input: {
  productName: string;
  description?: string;
  material?: string;
}): KeywordResult {
  let text = (input.productName || '').toLowerCase();

  // Add description if available
  if (input.description) {
    text += ' ' + input.description.toLowerCase();
  }

  // Remove brand names
  for (const pattern of BRAND_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // Clean text
  text = text.replace(/[^a-z0-9\s\-]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  const words = text.split(' ').filter(w => w.length > 1 && !STOPWORDS.has(w));

  // Detect material
  let detectedMaterial = input.material?.toLowerCase();
  if (!detectedMaterial) {
    for (const word of words) {
      if (MATERIALS[word]) {
        detectedMaterial = MATERIALS[word];
        break;
      }
    }
  }

  // Detect product type
  let productType: string | undefined;
  for (const word of words) {
    if (PRODUCT_TYPES[word]) {
      productType = PRODUCT_TYPES[word];
      break;
    }
  }

  // Dedupe keywords preserving order
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      keywords.push(w);
    }
  }

  return {
    keywords,
    material: detectedMaterial,
    productType,
    originalName: input.productName,
  };
}

// ─── LLM-based Keyword Extraction (v2.1) ────────────

const STEP1_LLM_PROMPT = `You are a world-class customs classification expert. Your ONLY job is to analyze a product name and extract structured information for HS Code classification.

## YOUR TASK:
Given a product name (which may be a brand name, trade name, slang, abbreviation, or technical term), you must:
1. IDENTIFY what this product actually IS (not what it's called)
2. EXTRACT keywords relevant to HS classification
3. DETERMINE the primary material and product type

## CRITICAL RULES:
- Brand names → translate to generic product description
  Examples: "KitKat" → chocolate-covered wafer bar | "iPhone" → smartphone/mobile phone | "Levi's 501" → denim jeans/trousers | "Tylenol" → acetaminophen tablet/pharmaceutical | "Tesla Model 3" → electric passenger vehicle | "Ray-Ban Aviator" → sunglasses | "Pampers" → disposable baby diapers | "Nutella" → chocolate hazelnut spread | "Band-Aid" → adhesive bandage | "Jacuzzi" → whirlpool bath
- Trade terms → translate to HS language
  Examples: "lumber" → wood sawn/chipped | "grease" (cooking) → animal/vegetable fat/oil | "sneakers" → footwear with rubber/plastic sole | "laptop" → portable automatic data processing machine | "brake pad" → parts of motor vehicles/braking system | "rebar" → bars and rods of iron/steel | "drywall" → plaster board/gypsum | "toner cartridge" → parts of printing machines | "LED bulb" → electrical lighting equipment/LED lamp
- Ambiguous products → provide BOTH possible interpretations
  Example: "Apple" → could be fresh fruit (apple) OR consumer electronics brand (Apple Inc.)
  Example: "Coach bag" → leather handbag/travel goods (Coach = luxury brand)
  Example: "Crown" → could be dental crown (medical), bottle crown cap (metal), or decorative crown (jewelry/misc)
- Waste/used/recycled → always note this, it affects classification
  Example: "Used Restaurant Grease" → WASTE cooking fat/oil (used/waste = important modifier)
  Example: "Scrap copper wire" → WASTE/SCRAP of copper (not copper wire)
- Composite/multi-material → list ALL materials in order of dominance
  Example: "Cotton-polyester blend shirt" → material_primary: cotton, material_secondary: polyester, form: knitted/woven garment
- Include PROCESSING LEVEL: raw, semi-processed, or finished
  Example: "crude petroleum" → raw | "plastic pellets" → semi-processed | "plastic bottle" → finished
- CBP ruling format: extract the ACTUAL PRODUCT from ruling descriptions
  Example: "Tariff classification of lead ingots from India" → the product is "lead ingots"
  Example: "The tariff classification and country of origin of watch straps" → the product is "watch straps"

## MATERIAL CATEGORIES (use these exact terms when applicable):
Animal: meat, fish, dairy, egg, honey, bone, horn, feather, gut, shellfish, crustacean, insect, silk, wool, leather, fur, hide
Vegetable: wood, bamboo, cork, straw, cotton, flax, hemp, rubber, coconut, palm, olive, seed, grain, fruit, vegetable, flower, mushroom, seaweed, tobacco
Fat/Oil: animal fat, vegetable oil, wax, margarine, tallow, lard, glycerol (NOTE: cooking grease/used oil = this category)
Food/Beverage: sugar, chocolate, cocoa, candy, pasta, bread, juice, wine, beer, spirits, vinegar, sauce, jam, cereal, flour, starch, coffee, tea, spice
Mineral: stone, cement, salt, sulfur, ore, slag, coal, petroleum, asphalt, natural gas, sand, gravel, gypsum, lime
Chemical: acid, alkali, oxide, pharmaceutical, medicine, drug, fertilizer, pesticide, insecticide, soap, cosmetic, perfume, dye, pigment, paint, ink, adhesive, explosive, photographic, enzyme
Plastic/Rubber: plastic, rubber, silicone, polymer, resin, acrylic, pvc, polyethylene, nylon, polyester, polyurethane, foam, film, tube
Metal: iron, steel, stainless steel, aluminum, copper, zinc, tin, lead, nickel, cobalt, tungsten, titanium, gold, silver, platinum, alloy
Textile: cotton fabric, silk fabric, wool fabric, synthetic fabric, knitted, woven, nonwoven, felt, lace, embroidery, rope, cord, twine, net
Glass/Ceramic: glass, crystal, ceramic, porcelain, pottery, tile, brick, fiberglass
Paper: paper, cardboard, pulp, printed matter, book, newspaper, label

## PRODUCT TYPE CATEGORIES (use these exact terms when applicable):
Clothing/Apparel: shirt, blouse, dress, skirt, pants, trousers, jacket, coat, sweater, vest, underwear, sock, scarf, tie, glove, hat, cap, garment
Footwear: shoe, boot, sandal, slipper, sneaker
Bags/Cases: handbag, wallet, briefcase, luggage, backpack, purse, travel bag, tool bag
Electronics: computer, phone, television, camera, battery, circuit, chip, display, speaker, charger, router, sensor
Machinery: engine, motor, pump, valve, bearing, gear, turbine, compressor, generator, transformer, conveyor, crane
Vehicle: car, truck, bicycle, motorcycle, ship, boat, aircraft, train, trailer, bus, tractor
Food Product: canned food, frozen food, dried food, preserved food, confectionery, biscuit, snack, beverage, alcoholic drink
Cosmetic/Pharma: cream, lotion, shampoo, toothpaste, medicine, tablet, capsule, ointment, vitamin
Tool: screwdriver, wrench, pliers, saw, drill, hammer, knife, blade, cutting tool
Furniture: chair, table, desk, bed, shelf, cabinet, mattress, lamp, lighting fixture
Toy/Sport: toy, game, puzzle, doll, ball, racket, bat, ski, exercise equipment
Instrument: medical instrument, surgical tool, measuring device, optical instrument, clock, watch, musical instrument
Jewelry: ring, necklace, bracelet, earring, brooch, pendant, gemstone

## EXAMPLES:
Input: "KitKat"
Output: {"product_understood":"chocolate-covered wafer bar, confectionery product","keywords":["chocolate","wafer","confectionery","cocoa","sugar","biscuit","candy","bar"],"material_primary":"chocolate","material_secondary":"wheat flour","product_type":"confectionery","processing_level":"finished","is_waste_or_used":false,"is_composite":true,"hs_relevant_notes":"Chocolate-covered products: if chocolate is primary character → Ch.18 cocoa, if biscuit is primary → Ch.19 bakery"}

Input: "Used Restaurant Grease"
Output: {"product_understood":"waste cooking oil/fat collected from restaurant, used frying oil","keywords":["waste","used","cooking","oil","fat","grease","animal fat","vegetable oil","frying oil","restaurant waste"],"material_primary":"vegetable oil","material_secondary":"animal fat","product_type":"waste fat/oil","processing_level":"raw","is_waste_or_used":true,"is_composite":true,"hs_relevant_notes":"WASTE cooking oil = Ch.15 (fats/oils), specifically heading 1518 or 1522. NOT Ch.16. Waste status critical."}

Input: "Tariff classification, country of origin of NAFTA eligibility of lead ingots from India"
Output: {"product_understood":"lead ingots, unwrought lead in ingot form imported from India","keywords":["lead","ingot","unwrought","metal","base metal","smelted","primary lead"],"material_primary":"lead","material_secondary":null,"product_type":"unwrought metal ingot","processing_level":"semi-processed","is_waste_or_used":false,"is_composite":false,"hs_relevant_notes":"Lead ingots = Ch.78, heading 7801. CBP ruling format - extract actual product."}

Input: "Boy's jacket"
Output: {"product_understood":"jacket or outerwear garment for boys, children's clothing","keywords":["jacket","boy","children","outerwear","coat","garment","clothing","apparel"],"material_primary":null,"material_secondary":null,"product_type":"jacket/outerwear","processing_level":"finished","is_waste_or_used":false,"is_composite":false,"hs_relevant_notes":"Without material: woven → Ch.62, knitted → Ch.61. Boy's = men's in HS."}

Input: "4 in 1 Screwdriver"
Output: {"product_understood":"multi-function screwdriver tool with 4 interchangeable bits","keywords":["screwdriver","tool","hand tool","multi-function","interchangeable","bits","driver"],"material_primary":"steel","material_secondary":"plastic","product_type":"hand tool","processing_level":"finished","is_waste_or_used":false,"is_composite":true,"hs_relevant_notes":"Hand tools Ch.82, heading 8205 or 8204. Multi-function: classify by principal function."}`;

interface Step1LLMResponse {
  product_understood: string;
  keywords: string[];
  material_primary: string | null;
  material_secondary: string | null;
  product_type: string | null;
  processing_level: 'raw' | 'semi-processed' | 'finished';
  is_waste_or_used: boolean;
  is_composite: boolean;
  hs_relevant_notes: string;
}

async function extractKeywordsLLM(
  productName: string,
  description?: string
): Promise<Step1LLMResponse | null> {
  const userPrompt = `## Input:
Product name: "${productName}"
${description ? `Description: ${description}` : ''}

## Output (STRICT JSON only):`;

  const result = await callLLM<Step1LLMResponse>({
    userPrompt: STEP1_LLM_PROMPT + '\n\n' + userPrompt,
    maxTokens: 300,
    temperature: 0,
  });

  return result.data || null;
}

/**
 * Main export — LLM understanding + code extraction merged.
 */
export async function extractKeywords(input: {
  productName: string;
  description?: string;
  material?: string;
}): Promise<KeywordResult> {
  // 1. LLM-based understanding
  const llmResult = await extractKeywordsLLM(input.productName, input.description);

  // 2. Code-based extraction (always runs as backup/supplement)
  const codeResult = extractKeywordsCode(input);

  // 3. LLM failed → return code result only
  if (!llmResult) return codeResult;

  // 4. Merge LLM + code results
  const mergedKeywords = [...new Set([
    ...llmResult.keywords.map(k => k.toLowerCase()),
    ...codeResult.keywords,
  ])];

  return {
    keywords: mergedKeywords,
    material: llmResult.material_primary || codeResult.material,
    productType: llmResult.product_type || codeResult.productType,
    originalName: input.productName,
    productUnderstood: llmResult.product_understood,
    materialSecondary: llmResult.material_secondary,
    processingLevel: llmResult.processing_level,
    isWaste: llmResult.is_waste_or_used,
    isComposite: llmResult.is_composite,
    hsNotes: llmResult.hs_relevant_notes,
  };
}
