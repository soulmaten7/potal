/**
 * v3 Step 0 — Input Validation & Normalization
 * Validates required fields, normalizes material/category/processing/composition
 */

import type { ClassifyInputV3, NormalizedInputV3, CompositionEntry } from '../../types';

export const MATERIAL_KEYWORDS: Record<string, string[]> = {
  leather: ['leather', 'cowhide', 'calfskin', 'lambskin', 'pigskin', 'suede', 'nubuck', 'patent leather', 'genuine leather', 'full grain'],
  cotton: ['cotton', 'denim', 'canvas', 'muslin', 'flannel', 'poplin', 'twill', 'percale', 'sateen'],
  polyester: ['polyester', 'polyethylene terephthalate', 'pet', 'dacron', 'terylene'],
  silk: ['silk', 'mulberry silk', 'charmeuse', 'chiffon silk', 'dupioni'],
  wool: ['wool', 'merino', 'cashmere', 'mohair', 'angora', 'alpaca', 'camel hair', 'vicuna'],
  nylon: ['nylon', 'polyamide', 'cordura', 'ripstop nylon'],
  linen: ['linen', 'flax', 'ramie'],
  steel: ['steel', 'stainless steel', 'carbon steel', 'alloy steel', 'galvanized steel', 'mild steel'],
  iron: ['iron', 'cast iron', 'wrought iron', 'pig iron', 'ferro'],
  aluminum: ['aluminum', 'aluminium', 'anodized aluminum', 'aluminum alloy'],
  copper: ['copper', 'brass', 'bronze', 'copper alloy'],
  zinc: ['zinc', 'galvanized'],
  tin: ['tin', 'tinplate'],
  titanium: ['titanium', 'ti alloy'],
  plastic: ['plastic', 'pvc', 'polypropylene', 'polyethylene', 'abs', 'polycarbonate', 'acrylic', 'pmma', 'hdpe', 'ldpe', 'pp', 'pe', 'ps', 'polystyrene'],
  rubber: ['rubber', 'natural rubber', 'synthetic rubber', 'vulcanized rubber', 'latex', 'silicone', 'neoprene', 'epdm'],
  wood: ['wood', 'bamboo', 'cork', 'timber', 'plywood', 'mdf', 'particle board', 'hardwood', 'softwood', 'oak', 'pine', 'maple', 'walnut', 'teak', 'mahogany'],
  glass: ['glass', 'tempered glass', 'borosilicate', 'crystal', 'lead glass', 'safety glass'],
  ceramic: ['ceramic', 'porcelain', 'stoneware', 'earthenware', 'terracotta', 'bone china'],
  paper: ['paper', 'cardboard', 'paperboard', 'corrugated', 'kraft'],
  stone: ['stone', 'marble', 'granite', 'slate', 'sandstone', 'limestone'],
  gold: ['gold', '14k', '18k', '24k', 'karat gold'],
  silver: ['silver', 'sterling silver', '925 silver'],
  platinum: ['platinum'],
  // Food/Agriculture materials
  seafood: ['seafood', 'shrimp', 'prawn', 'crab', 'lobster', 'fish', 'salmon', 'tuna', 'shellfish', 'wild-caught'],
  coffee: ['coffee', 'coffee bean', 'arabica', 'robusta'],
  plant: ['plant', 'vegetable', 'herb', 'botanical', 'plant/vegetable'],
  // Chemical/Pharmaceutical
  chemical: ['chemical', 'acid', 'hydroxide', 'oxide', 'compound', 'reagent', 'solvent', 'citric acid', 'sodium', 'industrial chemical'],
  pharmaceutical: ['pharmaceutical', 'medicine', 'drug', 'tablet', 'capsule', 'ibuprofen', 'paracetamol', 'api', 'active pharmaceutical'],
  // Additional
  bamboo: ['bamboo', 'moso bamboo'],
  cardboard: ['cardboard', 'corrugated', 'fiberboard', 'paperboard', 'kraft', 'paper/cardboard'],
  stoneware: ['stoneware', 'earthenware', 'porcelain'],
  // ── Section I: Live animals, animal products ──
  meat: ['meat', 'beef', 'pork', 'lamb', 'mutton', 'veal', 'poultry', 'chicken', 'turkey', 'duck'],
  dairy: ['dairy', 'milk', 'butter', 'cheese', 'cream', 'yogurt', 'whey'],
  egg: ['eggs', 'egg product', 'egg white', 'egg yolk'],
  honey: ['honey', 'beeswax', 'royal jelly', 'propolis'],
  animal: ['animal', 'animal product', 'bone', 'horn', 'ivory', 'feather', 'down'],
  fur: ['mink', 'fox fur', 'rabbit fur', 'faux fur', 'pelt', 'fur coat', 'fur trim'],
  // ── Section II: Vegetable products ──
  grain: ['grain', 'wheat', 'rice', 'corn', 'maize', 'barley', 'oats', 'rye', 'sorghum', 'millet'],
  fruit: ['fruit', 'apple', 'banana', 'orange', 'grape', 'berry', 'mango', 'pineapple', 'dried fruit'],
  seed: ['seed', 'sesame', 'sunflower seed', 'flaxseed', 'chia seed', 'hemp seed'],
  tea: ['tea', 'green tea', 'black tea', 'herbal tea', 'mate', 'matcha'],
  spice: ['spice', 'pepper', 'cinnamon', 'turmeric', 'ginger', 'clove', 'nutmeg', 'vanilla', 'saffron'],
  tobacco: ['tobacco', 'cigar', 'cigarette'],
  // ── Section III: Fats, oils, waxes ──
  oil: ['olive oil', 'coconut oil', 'palm oil', 'sunflower oil', 'soybean oil', 'vegetable oil', 'essential oil', 'mineral oil', 'cooking oil', 'edible oil'],
  fat: ['lard', 'tallow', 'margarine', 'shortening', 'ghee', 'animal fat', 'vegetable fat'],
  wax: ['wax', 'beeswax', 'paraffin', 'soy wax', 'candle wax', 'carnauba wax', 'microcrystalline wax'],
  // ── Section IV: Prepared foodstuffs ──
  sugar: ['sugar', 'sucrose', 'glucose', 'fructose', 'molasses', 'candy', 'confectionery'],
  chocolate: ['chocolate', 'cocoa', 'cocoa butter', 'cocoa powder', 'cacao'],
  beverage: ['beverage', 'juice', 'soda', 'water', 'mineral water', 'energy drink', 'sports drink'],
  alcohol: ['alcohol', 'wine', 'beer', 'spirits', 'whiskey', 'vodka', 'rum', 'gin', 'liquor'],
  flour: ['flour', 'wheat flour', 'rice flour', 'starch', 'baking mix'],
  // ── Section V: Mineral products ──
  mineral: ['mineral', 'ore', 'calcium', 'ite', 'ite powder'],
  cement: ['cement', 'concrete', 'morite', 'gypsum', 'plaster', 'asphalt'],
  salt: ['salt', 'sodium chloride', 'sea salt', 'rock salt'],
  petroleum: ['petroleum', 'crude oil', 'fuel', 'gasoline', 'diesel', 'kerosene', 'lubricant', 'bitumen'],
  coal: ['coal', 'charcoal', 'coke', 'lignite', 'peat'],
  sand: ['sand', 'gravel', 'clay', 'kaolin', 'feldspar', 'ite'],
  // ── Section VI additions ──
  soap: ['soap', 'detergent', 'surfactant', 'shampoo', 'body wash'],
  cosmetic: ['cosmetic', 'perfume', 'fragrance', 'makeup', 'lipstick', 'mascara', 'foundation', 'lotion', 'cream'],
  fertilizer: ['fertilizer', 'nitrogen', 'phosphate', 'potash', 'urea', 'ammonium'],
  explosive: ['explosive', 'dynamite', 'detonator', 'firework', 'pyrotechnic'],
  // ── Section VII additions ──
  foam: ['foam', 'polyurethane foam', 'eva foam', 'memory foam', 'styrofoam', 'expanded polystyrene'],
  resin: ['resin', 'epoxy', 'polyester resin', 'phenolic resin', 'alkyd'],
  // ── Section VIII additions ──
  hide: ['hide', 'rawhide', 'skin', 'parchment', 'chamois'],
  // ── Section XII: Footwear, headgear ──
  footwear: ['footwear', 'shoe', 'boot', 'sandal', 'sneaker', 'slipper', 'heel'],
  headgear: ['headgear', 'hat', 'cap', 'helmet', 'beret', 'bonnet', 'visor'],
  umbrella: ['umbrella', 'parasol', 'walking stick', 'cane'],
  // ── Section XIV additions ──
  pearl: ['pearl', 'natural pearl', 'cultured pearl', 'freshwater pearl'],
  diamond: ['diamond', 'gemstone', 'ruby', 'sapphire', 'emerald', 'precious stone', 'semi-precious'],
  jewelry: ['jewelry', 'jewellery', 'necklace', 'bracelet', 'ring', 'earring', 'brooch', 'pendant'],
  // ── Section XVI: Machinery, electrical ──
  machinery: ['machinery', 'machine', 'pump', 'compressor', 'turbine', 'engine', 'motor', 'generator'],
  electronic: ['electronic', 'electrical', 'circuit', 'transistor', 'semiconductor', 'led', 'diode', 'capacitor'],
  battery: ['battery', 'lithium', 'lithium-ion', 'alkaline', 'rechargeable', 'cell', 'accumulator'],
  // ── Section XVII: Vehicles ──
  vehicle: ['vehicle', 'automobile', 'truck', 'motorcycle', 'scooter'],
  bicycle: ['bicycle', 'bike', 'cycle', 'tricycle', 'e-bike'],
  aircraft: ['aircraft', 'airplane', 'helicopter', 'drone', 'uav'],
  ship: ['ship', 'boat', 'vessel', 'yacht', 'canoe', 'kayak', 'raft'],
  tire: ['tire', 'tyre', 'pneumatic tire', 'inner tube', 'retreaded'],
  // ── Section XVIII: Instruments ──
  optical: ['optical', 'lens', 'binocular', 'telescope', 'microscope', 'magnifying'],
  medical: ['medical', 'surgical', 'orthopedic', 'prosthetic', 'dental', 'syringe', 'catheter'],
  watch: ['watch', 'wristwatch', 'clock', 'timepiece', 'chronometer', 'stopwatch'],
  musical: ['musical', 'guitar', 'piano', 'violin', 'drum', 'flute', 'trumpet', 'harmonica'],
  // ── Section XIX: Arms ──
  weapon: ['weapon', 'firearm', 'gun', 'rifle', 'pistol', 'revolver', 'shotgun', 'ammunition', 'cartridge'],
  // ── Section XX: Miscellaneous ──
  furniture: ['furniture', 'chair', 'table', 'desk', 'sofa', 'bed', 'mattress', 'shelf', 'cabinet', 'wardrobe'],
  toy: ['toy', 'doll', 'puzzle', 'action figure', 'building block', 'plush', 'stuffed animal', 'board game'],
  sports: ['sports', 'fitness', 'exercise', 'gym', 'yoga', 'camping', 'fishing', 'golf', 'tennis', 'basketball'],
  lamp: ['lamp', 'lantern', 'chandelier', 'light fixture', 'bulb'],
  brush: ['brush', 'broom', 'mop', 'comb', 'toothbrush', 'paintbrush'],
  candle: ['candle', 'taper', 'votive', 'pillar candle', 'tea light', 'scented candle'],
  // ── Section XXI: Art ──
  art: ['painting', 'sculpture', 'engraving', 'lithograph', 'antique', 'collectors piece', 'artwork', 'fine art',
        'oil painting', 'watercolor', 'watercolour', 'acrylic painting', 'original art', 'statue', 'statuette',
        'stamp collection', 'coin collection', 'numismatic', 'antiquity'],
};

export const PROCESSING_KEYWORDS = [
  'raw', 'fresh', 'live', 'frozen', 'chilled', 'dried', 'smoked', 'salted', 'cured', 'roasted',
  'woven', 'knitted', 'crocheted', 'embroidered', 'printed', 'dyed', 'bleached', 'spun',
  'forged', 'cast', 'machined', 'stamped', 'extruded', 'rolled', 'welded', 'soldered',
  'molded', 'injection molded', 'blow molded', 'thermoformed',
  'assembled', 'finished', 'polished', 'coated', 'painted', 'galvanized', 'anodized', 'tempered',
  'laminated', 'pressed', 'ground', 'refined', 'distilled', 'fermented',
  'cut', 'sewn', 'glued', 'bonded', 'vulcanized', 'sintered',
];

export function validateAndNormalize(input: ClassifyInputV3): NormalizedInputV3 {
  if (!input.product_name || input.product_name.trim().length < 2) {
    throw new Error('product_name is required (min 2 chars)');
  }
  if (!input.material || input.material.trim().length < 2) {
    throw new Error('material is required (min 2 chars)');
  }
  if (!input.origin_country || input.origin_country.trim().length < 2) {
    throw new Error('origin_country is required (min 2 chars)');
  }

  const materialLower = input.material.toLowerCase();
  const materialPrimary = extractPrimaryMaterial(materialLower);
  const materialKeywords = extractMaterialKeywords(materialLower);

  const categoryTokens = input.category
    ? input.category.toLowerCase().split(/[>\/,;\-\s]+/).map(t => t.trim()).filter(t => t.length > 1)
    : [];

  const descriptionTokens = input.description
    ? input.description.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    : [];

  const processingStates = input.processing
    ? extractProcessingStates(input.processing.toLowerCase())
    : extractProcessingStates(input.product_name.toLowerCase() + ' ' + (input.description || '').toLowerCase());

  const compositionParsed = input.composition
    ? parseComposition(input.composition)
    : [];

  const compositionRaw = (input.composition || '').toLowerCase();
  const isAlloy = compositionRaw.includes('alloy') || materialLower.includes('alloy');

  // Footwear: extract upper/outsole from composition
  let outsoleMaterial: string | null = null;
  let upperMaterial: string | null = null;
  const outsoleMatch = compositionRaw.match(/(\w+)\s+(?:outsole|sole)\b/);
  if (outsoleMatch) outsoleMaterial = outsoleMatch[1];
  const upperMatch = compositionRaw.match(/(\w+)\s+upper\b/);
  if (upperMatch) upperMaterial = upperMatch[1];

  return {
    product_name: input.product_name.trim(),
    material_primary: materialPrimary,
    material_keywords: materialKeywords,
    origin_country: input.origin_country.trim().toUpperCase(),
    category_tokens: categoryTokens,
    description_tokens: descriptionTokens,
    processing_states: processingStates,
    composition_parsed: compositionParsed,
    composition_raw: compositionRaw,
    weight_spec: input.weight_spec?.trim() || null,
    price: input.price ?? null,
    is_alloy: isAlloy,
    outsole_material: outsoleMaterial,
    upper_material: upperMaterial,
  };
}

/** Match material variant against text, using word boundary for short terms to avoid false positives */
function materialVariantMatches(text: string, variant: string): boolean {
  if (variant.length <= 3) {
    // Short variants (pe, pp, ps, abs, pet, mdf) need word boundary to avoid
    // "paper" matching "pe", "caps" matching "ps", etc.
    const regex = new RegExp(`\\b${variant}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(variant);
}

function extractPrimaryMaterial(text: string): string {
  for (const [primary, variants] of Object.entries(MATERIAL_KEYWORDS)) {
    for (const v of variants) {
      if (materialVariantMatches(text, v)) return primary;
    }
  }
  // Fallback: return first word as material
  const words = text.split(/\s+/);
  return words[0] || text;
}

function extractMaterialKeywords(text: string): string[] {
  const found: string[] = [];
  for (const [primary, variants] of Object.entries(MATERIAL_KEYWORDS)) {
    for (const v of variants) {
      if (materialVariantMatches(text, v) && !found.includes(primary)) {
        found.push(primary);
      }
    }
  }
  return found.length > 0 ? found : [text.split(/\s+/)[0] || text];
}

function extractProcessingStates(text: string): string[] {
  return PROCESSING_KEYWORDS.filter(kw => {
    // Use word boundary to avoid "straw" → "raw", "glued" → "cut", etc.
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(text);
  });
}

function parseComposition(comp: string): CompositionEntry[] {
  const entries: CompositionEntry[] = [];
  // Pattern: "cotton 85%, polyester 15%" or "85% cotton, 15% polyester"
  const pattern1 = /(\w[\w\s]*?)\s+(\d+(?:\.\d+)?)\s*%/g;
  const pattern2 = /(\d+(?:\.\d+)?)\s*%\s*(\w[\w\s]*?)(?:,|$)/g;

  let m: RegExpExecArray | null;
  m = pattern1.exec(comp);
  while (m) {
    entries.push({ material: m[1].trim().toLowerCase(), pct: parseFloat(m[2]) });
    m = pattern1.exec(comp);
  }

  if (entries.length === 0) {
    m = pattern2.exec(comp);
    while (m) {
      entries.push({ material: m[2].trim().toLowerCase(), pct: parseFloat(m[1]) });
      m = pattern2.exec(comp);
    }
  }

  return entries.sort((a, b) => b.pct - a.pct);
}
