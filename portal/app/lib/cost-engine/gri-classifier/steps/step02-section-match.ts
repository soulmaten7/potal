/**
 * Step 2: Match keywords to HS Sections (21 sections).
 * Uses manual keywords + auto-generated keywords from heading descriptions.
 * Pure code — no AI calls.
 */

import type { KeywordResult, SectionCandidate, GriProductInput } from '../types';
import { HEADING_DESCRIPTIONS } from '../data/heading-descriptions';
import { CHAPTER_TO_SECTION } from '../data/chapter-descriptions';
import { stemBasic } from '../utils/text-matching';
import { callLLM } from '../utils/llm-call';

// Section keyword mappings — manual (original)
const SECTION_KEYWORDS: Record<number, { keywords: string[]; chapters: number[]; title: string }> = {
  1: { keywords: ['animal', 'meat', 'fish', 'dairy', 'egg', 'live', 'poultry', 'crustacean', 'insect', 'shellfish', 'shrimp', 'crab', 'lobster', 'salmon', 'tuna', 'chicken', 'beef', 'pork', 'lamb', 'honey', 'bone', 'horn', 'ivory', 'feather', 'gut', 'bladder'], chapters: [1, 2, 3, 4, 5], title: 'Live animals; animal products' },
  2: { keywords: ['plant', 'vegetable', 'fruit', 'coffee', 'tea', 'spice', 'cereal', 'grain', 'seed', 'straw', 'bamboo', 'flower', 'tree', 'herb', 'rice', 'wheat', 'corn', 'maize', 'barley', 'oat', 'soybean', 'nut', 'almond', 'mushroom', 'potato', 'tomato', 'onion', 'garlic', 'pepper', 'cinnamon', 'vanilla', 'ginger', 'turmeric', 'tobacco', 'cotton', 'flax', 'hemp', 'coconut', 'palm', 'olive', 'rubber', 'cork', 'seaweed'], chapters: [6, 7, 8, 9, 10, 11, 12, 13, 14], title: 'Vegetable products' },
  3: { keywords: ['fat', 'oil', 'wax', 'margarine', 'tallow', 'lard', 'glycerol', 'stearin', 'olein'], chapters: [15], title: 'Animal or vegetable fats and oils' },
  4: { keywords: ['food', 'beverage', 'tobacco', 'candy', 'chocolate', 'sugar', 'pasta', 'bread', 'juice', 'wine', 'beer', 'spirits', 'vinegar', 'sauce', 'soup', 'jam', 'jelly', 'pickle', 'canned', 'frozen', 'dried', 'preserved', 'confectionery', 'biscuit', 'cookie', 'cake', 'cereal', 'flour', 'starch', 'extract', 'yeast', 'mustard', 'ketchup', 'mayonnaise', 'seasoning', 'cigar', 'cigarette', 'snuff', 'vodka', 'whisky', 'rum', 'gin', 'tequila', 'liqueur', 'water', 'soda', 'energy drink', 'coffee', 'tea'], chapters: [16, 17, 18, 19, 20, 21, 22, 23, 24], title: 'Prepared foodstuffs; beverages; tobacco' },
  5: { keywords: ['mineral', 'stone', 'cement', 'fuel', 'oil', 'coal', 'petroleum', 'asphalt', 'salt', 'sulfur', 'earth', 'sand', 'gravel', 'ore', 'slag', 'ash', 'lime', 'gypsum', 'natural gas', 'bitumen', 'tar', 'coke', 'kerosene', 'gasoline', 'diesel', 'propane', 'butane', 'paraffin'], chapters: [25, 26, 27], title: 'Mineral products' },
  6: { keywords: ['chemical', 'pharmaceutical', 'fertilizer', 'soap', 'cosmetic', 'perfume', 'gelatin', 'enzyme', 'explosive', 'photographic', 'glue', 'adhesive', 'dye', 'pigment', 'paint', 'varnish', 'ink', 'essential oil', 'resin', 'insecticide', 'herbicide', 'fungicide', 'antibiotic', 'vitamin', 'hormone', 'vaccine', 'medicine', 'drug', 'tablet', 'capsule', 'ointment', 'cream', 'lotion', 'shampoo', 'toothpaste', 'deodorant', 'detergent', 'disinfectant', 'acid', 'alkali', 'oxide', 'hydroxide', 'chloride', 'sulfate', 'phosphate', 'nitrate', 'carbonate', 'pesticide'], chapters: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], title: 'Products of the chemical or allied industries' },
  7: { keywords: ['plastic', 'rubber', 'silicone', 'polymer', 'resin', 'acrylic', 'pvc', 'polyethylene', 'polypropylene', 'polystyrene', 'nylon', 'polyester', 'polyurethane', 'teflon', 'epoxy', 'vinyl', 'celluloid', 'cellulose', 'latex', 'foam', 'sponge', 'film', 'sheet', 'tube', 'hose', 'gasket', 'seal', 'tire', 'tyre'], chapters: [39, 40], title: 'Plastics and rubber' },
  8: { keywords: ['leather', 'skin', 'fur', 'handbag', 'wallet', 'belt', 'saddlery', 'travel', 'luggage', 'briefcase', 'purse', 'glove', 'suede', 'hide', 'parchment', 'chamois'], chapters: [41, 42, 43], title: 'Raw hides, leather, furskins' },
  9: { keywords: ['wood', 'cork', 'straw', 'bamboo', 'basket', 'plywood', 'veneer', 'particle board', 'timber', 'lumber', 'log', 'charcoal', 'furniture', 'frame', 'carving', 'marquetry', 'wickerwork', 'rattan'], chapters: [44, 45, 46], title: 'Wood and articles of wood' },
  10: { keywords: ['paper', 'cardboard', 'book', 'newspaper', 'printing', 'pulp', 'wallpaper', 'label', 'calendar', 'envelope', 'card', 'tissue', 'napkin', 'filter', 'stationery', 'notebook', 'magazine', 'catalog', 'map', 'poster', 'printed', 'decal', 'transfer', 'flag', 'pennant', 'banner'], chapters: [47, 48, 49], title: 'Pulp, paper, printed matter' },
  11: { keywords: ['textile', 'cotton', 'silk', 'wool', 'fabric', 'clothing', 'knit', 'woven', 'yarn', 'thread', 'carpet', 'towel', 'curtain', 'bedding', 'linen', 'denim', 'velvet', 'satin', 'chiffon', 'polyester', 'nylon', 'rayon', 'viscose', 'spandex', 'lycra', 'embroidery', 'lace', 'felt', 'nonwoven', 'rope', 'cord', 'twine', 'net', 'blanket', 'pillow', 'mattress', 'quilt', 'duvet', 'sheet', 'tablecloth', 'apron', 'tent', 'tarpaulin', 'sack', 'bag', 'shirt', 'blouse', 'dress', 'skirt', 'pants', 'trousers', 'jacket', 'coat', 'sweater', 'vest', 'shorts', 'underwear', 'sock', 'stocking', 'scarf', 'tie', 'glove', 'mitten', 'hat', 'cap', 'garment', 'apparel', 'lanyard', 'strap', 'webbing', 'ribbon', 'braid', 'narrow'], chapters: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63], title: 'Textiles and textile articles' },
  12: { keywords: ['footwear', 'shoe', 'boot', 'sandal', 'slipper', 'sneaker', 'hat', 'cap', 'umbrella', 'feather', 'artificial flower', 'helmet', 'headgear', 'walking stick', 'parasol', 'beret', 'bonnet'], chapters: [64, 65, 66, 67], title: 'Footwear, headgear, umbrellas' },
  13: { keywords: ['stone', 'ceramic', 'tile', 'brick', 'glass', 'mirror', 'bottle', 'vase', 'concrete', 'plaster', 'cement', 'asbestos', 'mica', 'pottery', 'porcelain', 'fiberglass', 'insulation', 'abrasive', 'grinding', 'cutting', 'crystal', 'lens', 'optical', 'flask', 'jar', 'terra', 'cotta'], chapters: [68, 69, 70], title: 'Stone, ceramic, glass' },
  14: { keywords: ['jewelry', 'pearl', 'gold', 'silver', 'diamond', 'precious', 'gemstone', 'platinum', 'ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'opal', 'turquoise', 'amber', 'coral', 'cultured', 'imitation', 'costume', 'brooch', 'pendant', 'tiara', 'cufflink'], chapters: [71], title: 'Precious metals and stones' },
  15: { keywords: ['iron', 'steel', 'copper', 'aluminum', 'metal', 'screw', 'bolt', 'nail', 'wire', 'chain', 'lock', 'safe', 'anchor', 'needle', 'spring', 'zinc', 'tin', 'lead', 'nickel', 'cobalt', 'tungsten', 'molybdenum', 'manganese', 'chromium', 'titanium', 'magnesium', 'alloy', 'casting', 'forging', 'tube', 'pipe', 'fitting', 'flange', 'clamp', 'hook', 'hinge', 'bracket', 'rivet', 'washer', 'nut', 'stainless', 'galvanized', 'coated', 'plated', 'welded', 'stamped', 'container', 'can', 'tank', 'barrel', 'drum', 'cage', 'fence', 'gate', 'railing', 'ladder', 'scaffold', 'ingot'], chapters: [72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83], title: 'Base metals' },
  16: { keywords: ['machine', 'engine', 'motor', 'pump', 'valve', 'bearing', 'gear', 'turbine', 'computer', 'phone', 'television', 'camera', 'battery', 'led', 'circuit', 'chip', 'electric', 'electronic', 'appliance', 'refrigerator', 'washing', 'microwave', 'printer', 'scanner', 'robot', 'compressor', 'generator', 'transformer', 'switch', 'relay', 'fuse', 'connector', 'cable', 'wire', 'resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'semiconductor', 'sensor', 'display', 'screen', 'keyboard', 'mouse', 'speaker', 'microphone', 'headphone', 'charger', 'adapter', 'router', 'modem', 'antenna', 'solar', 'panel', 'inverter', 'welder', 'lathe', 'mill', 'drill', 'grinder', 'press', 'conveyor', 'crane', 'forklift', 'elevator', 'escalator', 'air conditioner', 'heater', 'fan', 'blower', 'centrifuge', 'filter', 'boiler', 'furnace', 'oven', 'kiln', 'dryer', 'blender', 'mixer', 'processor', 'server', 'storage', 'memory', 'hard drive', 'ssd', 'usb', 'bluetooth', 'wifi', 'gps', 'radar', 'lidar'], chapters: [84, 85], title: 'Machinery and electrical equipment' },
  17: { keywords: ['vehicle', 'car', 'truck', 'bicycle', 'motorcycle', 'ship', 'boat', 'aircraft', 'airplane', 'train', 'railway', 'trailer', 'wheelchair', 'scooter', 'bus', 'van', 'sedan', 'suv', 'tractor', 'ambulance', 'tank', 'helicopter', 'drone', 'yacht', 'canoe', 'kayak', 'raft', 'ferry', 'barge', 'cargo', 'container', 'wagon', 'carriage', 'locomotive', 'subway', 'tram', 'monorail', 'funicular', 'cable car', 'parachute', 'glider', 'balloon'], chapters: [86, 87, 88, 89], title: 'Vehicles, aircraft, vessels' },
  18: { keywords: ['optical', 'medical', 'surgical', 'instrument', 'meter', 'thermometer', 'clock', 'watch', 'music', 'piano', 'guitar', 'violin', 'lens', 'microscope', 'telescope', 'binocular', 'spectacle', 'eyeglass', 'sunglass', 'stethoscope', 'syringe', 'needle', 'catheter', 'implant', 'prosthesis', 'wheelchair', 'hearing aid', 'pacemaker', 'xray', 'ultrasound', 'mri', 'ct scan', 'laser', 'spectrometer', 'oscilloscope', 'multimeter', 'gauge', 'scale', 'balance', 'barometer', 'hygrometer', 'compass', 'level', 'ruler', 'caliper', 'micrometer', 'timer', 'stopwatch', 'chronometer', 'metronome', 'tuner', 'drum', 'flute', 'trumpet', 'saxophone', 'organ', 'harmonica', 'accordion', 'synthesizer'], chapters: [90, 91, 92], title: 'Optical, medical, instruments, clocks, musical' },
  19: { keywords: ['weapon', 'firearm', 'ammunition', 'gun', 'rifle', 'pistol', 'shotgun', 'revolver', 'cartridge', 'projectile', 'bomb', 'grenade', 'mine', 'torpedo', 'missile', 'sword', 'bayonet', 'lance', 'halberd', 'crossbow'], chapters: [93], title: 'Arms and ammunition' },
  20: { keywords: ['furniture', 'mattress', 'lamp', 'light', 'fixture', 'prefab', 'building', 'toy', 'game', 'sport', 'exercise', 'pen', 'pencil', 'brush', 'button', 'zipper', 'lighter', 'comb', 'broom', 'mop', 'vacuum', 'basket', 'figurine', 'candle', 'match', 'smoking', 'carriage', 'stroller', 'wheelchair', 'coffin', 'urn', 'sign', 'placard', 'nameplate', 'mannequin', 'trophy', 'medal', 'badge', 'puzzle', 'doll', 'stuffed', 'plush', 'action figure', 'board game', 'card game', 'video game', 'console', 'ball', 'racket', 'bat', 'club', 'ski', 'skate', 'surfboard', 'skateboard', 'trampoline', 'gym', 'treadmill', 'dumbbell', 'barbell', 'yoga', 'pilates', 'swimming', 'diving', 'fishing', 'hunting', 'camping'], chapters: [94, 95, 96], title: 'Miscellaneous manufactured articles' },
  21: { keywords: ['art', 'antique', 'painting', 'sculpture', 'stamp', 'coin', 'collection', 'original', 'engraving', 'etching', 'lithograph', 'statue', 'bust', 'mosaic', 'tapestry', 'collage', 'photograph', 'numismatic', 'philatelic'], chapters: [97], title: 'Works of art, antiques' },
};

// Material-to-section bonus mapping
const MATERIAL_SECTION_BONUS: Record<string, number[]> = {
  cotton: [11], polyester: [11], nylon: [11, 7], silk: [11], wool: [11],
  linen: [11], leather: [8], suede: [8], rubber: [7], plastic: [7],
  metal: [15], steel: [15], iron: [15], aluminum: [15], copper: [15],
  wood: [9], bamboo: [9], glass: [13], ceramic: [13], paper: [10],
  gold: [14], silver: [14], diamond: [14], 'stainless steel': [15],
};

// Product type-to-section bonus mapping
const PRODUCT_TYPE_SECTION_BONUS: Record<string, number[]> = {
  clothing: [11], footwear: [12], bags: [8], electronics: [16],
  toys: [20], furniture: [20], lighting: [20], tools: [15, 16],
  vehicle: [17], watch: [18], jewelry: [14], food: [4], beverage: [4],
  cosmetics: [6], printed: [10], stationery: [20], fastener: [15],
  pipe: [15, 7], tube: [15, 7], wire: [15], rod: [15],
  machinery: [16],
};

// Stopwords for heading description parsing
const HEADING_STOPWORDS = new Set([
  'of', 'and', 'or', 'the', 'a', 'an', 'in', 'for', 'with', 'by',
  'to', 'from', 'not', 'on', 'at', 'as', 'its', 'their', 'other',
  'than', 'whether', 'including', 'excluding', 'also', 'but', 'such',
  'being', 'having', 'made', 'used', 'using', 'into', 'thereof',
  'thereto', 'parts', 'articles', 'goods', 'products', 'preparations',
  'similar', 'elsewhere', 'specified', 'kind', 'type', 'heading',
  'subheading', 'chapter', 'section', 'note', 'see', 'whether',
  'not', 'n.e.c', 'n.e.s',
]);

/**
 * Build section keywords automatically from heading descriptions.
 * Called once at module load time.
 */
function buildSectionKeywordsFromHeadings(): Record<number, Set<string>> {
  const sectionKeywords: Record<number, Set<string>> = {};
  for (let s = 1; s <= 21; s++) {
    sectionKeywords[s] = new Set();
  }

  for (const [code, description] of Object.entries(HEADING_DESCRIPTIONS)) {
    const chapter = parseInt(code.substring(0, 2), 10);
    const section = CHAPTER_TO_SECTION[chapter];
    if (!section) continue;

    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !HEADING_STOPWORDS.has(w));

    for (const word of words) {
      sectionKeywords[section].add(word);
    }

    // Add hyphenated compound words
    const hyphenWords = description.toLowerCase().match(/[a-z]+-[a-z]+/g);
    if (hyphenWords) {
      for (const hw of hyphenWords) {
        sectionKeywords[section].add(hw);
        sectionKeywords[section].add(hw.replace(/-/g, ''));
      }
    }
  }

  return sectionKeywords;
}

// Generated once at module load
const AUTO_SECTION_KEYWORDS = buildSectionKeywordsFromHeadings();

// Keyword-only fallback (renamed from matchSections)
export function matchSectionsKeyword(keywordResult: KeywordResult): SectionCandidate[] {
  const { keywords, material, productType } = keywordResult;
  const scores: Map<number, number> = new Map();

  for (const [sectionStr, data] of Object.entries(SECTION_KEYWORDS)) {
    const section = parseInt(sectionStr, 10);
    let score = 0;
    const manualKwSet = new Set(data.keywords);

    for (const kw of keywords) {
      // 1) Manual keyword match (weight 1)
      if (manualKwSet.has(kw)) {
        score += 1;
      }

      // 2) Auto keyword match from heading descriptions (weight 1.5)
      const autoKwSet = AUTO_SECTION_KEYWORDS[section];
      if (autoKwSet) {
        if (autoKwSet.has(kw) && !manualKwSet.has(kw)) {
          score += 1.5;
        }
        // Stem match: "shirts" vs "shirt", "vehicles" vs "vehicle"
        const kwStem = stemBasic(kw);
        if (kwStem !== kw && kwStem.length > 3) {
          for (const autoKw of autoKwSet) {
            if (stemBasic(autoKw) === kwStem) {
              score += 0.5;
              break;
            }
          }
        }
      }

      // 3) Partial match on manual keywords
      for (const skw of data.keywords) {
        if (kw !== skw && (kw.includes(skw) || skw.includes(kw)) && kw.length > 3) {
          score += 0.5;
          break;
        }
      }
    }

    if (score > 0) {
      scores.set(section, score);
    }
  }

  // Material bonus
  if (material) {
    const bonusSections = MATERIAL_SECTION_BONUS[material];
    if (bonusSections) {
      for (const s of bonusSections) {
        scores.set(s, (scores.get(s) || 0) + 2);
      }
    }
  }

  // Product type bonus
  if (productType) {
    const bonusSections = PRODUCT_TYPE_SECTION_BONUS[productType];
    if (bonusSections) {
      for (const s of bonusSections) {
        scores.set(s, (scores.get(s) || 0) + 2);
      }
    }
  }

  // Default fallback
  if (scores.size === 0) {
    scores.set(16, 0.1);
    scores.set(20, 0.1);
  }

  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([section, score]) => ({
    section,
    score,
    chapters: SECTION_KEYWORDS[section]?.chapters || [],
    title: SECTION_KEYWORDS[section]?.title || '',
  }));
}

// ─── v2.2: Pre-filter + LLM Section Matching ────────

/**
 * Code pre-filtering: search heading-descriptions for keyword matches,
 * group by Section, and build a summary for LLM.
 */
function preFilterSections(keywordResult: KeywordResult): {
  candidateSections: number[];
  matchSummary: string;
} {
  const { keywords, productUnderstood } = keywordResult;

  // Collect all keywords including from productUnderstood
  const allKeywords = [...keywords];
  if (productUnderstood) {
    const understoodWords = productUnderstood
      .toLowerCase()
      .replace(/[^a-z0-9\s\-\/]/g, ' ')
      .split(/[\s\/]+/)
      .filter((w: string) => w.length > 2 && !HEADING_STOPWORDS.has(w));
    for (const w of understoodWords) {
      if (!allKeywords.includes(w)) allKeywords.push(w);
    }
  }

  // Match against 1,229 heading descriptions
  const sectionScores: Map<number, number> = new Map();
  const sectionHeadings: Map<number, string[]> = new Map();

  for (const [code, description] of Object.entries(HEADING_DESCRIPTIONS)) {
    const descLower = description.toLowerCase();
    const chapter = parseInt(code.substring(0, 2), 10);
    const section = CHAPTER_TO_SECTION[chapter];
    if (!section) continue;

    let matchCount = 0;
    for (const kw of allKeywords) {
      if (descLower.includes(kw)) {
        matchCount++;
      } else {
        const kwStem = stemBasic(kw);
        if (kwStem !== kw && kwStem.length > 3) {
          const descWords = descLower.split(/\s+/);
          if (descWords.some(dw => stemBasic(dw) === kwStem)) {
            matchCount++;
          }
        }
      }
    }

    if (matchCount > 0) {
      sectionScores.set(section, (sectionScores.get(section) || 0) + matchCount);
      if (!sectionHeadings.has(section)) sectionHeadings.set(section, []);
      sectionHeadings.get(section)!.push(`${code}: ${description}`);
    }
  }

  // Material/productType bonuses
  const { material, productType } = keywordResult;
  if (material) {
    const bonusSections = MATERIAL_SECTION_BONUS[material];
    if (bonusSections) {
      for (const s of bonusSections) {
        sectionScores.set(s, (sectionScores.get(s) || 0) + 3);
      }
    }
  }
  if (productType) {
    const bonusSections = PRODUCT_TYPE_SECTION_BONUS[productType];
    if (bonusSections) {
      for (const s of bonusSections) {
        sectionScores.set(s, (sectionScores.get(s) || 0) + 3);
      }
    }
  }

  const sorted = [...sectionScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    sorted.push([16, 0.1], [20, 0.1]);
  }

  // Build match summary for LLM
  let summary = '';
  for (const [s, score] of sorted) {
    const headings = sectionHeadings.get(s) || [];
    const title = SECTION_KEYWORDS[s]?.title || '';
    summary += `\n\nSection ${s} (${title}) — ${score} keyword matches:`;
    for (const h of headings.slice(0, 5)) {
      summary += `\n  - ${h}`;
    }
    if (headings.length > 5) {
      summary += `\n  - ... and ${headings.length - 5} more headings`;
    }
  }

  return {
    candidateSections: sorted.map(([s]) => s),
    matchSummary: summary,
  };
}

const STEP2_PROMPT_V2 = `You are a licensed customs broker classifying a product into the correct HS Section.

## WHAT HAPPENED BEFORE YOU:
1. Step 1 (Product Understanding): An AI analyzed the product name and identified what it IS — material, type, processing level, and HS keywords.
2. Pre-filtering (Code): We searched all 1,229 HS heading descriptions for keywords from Step 1. The matching headings are grouped by Section below.

## YOUR JOB:
Look at the candidate Sections. Each shows:
- Section number and title
- How many keywords matched
- Actual heading descriptions that matched (official WCO text)

Pick the BEST Section. The keyword matching found WHERE keywords appear. You judge WHICH match is correct.

## JUDGMENT RULES:
1. MORE keyword matches = stronger signal, but not always decisive
2. MATERIAL priority for raw/semi-processed goods (copper wire → XV base metals, NOT XVI electrical)
3. FUNCTION priority for finished goods (washing machine → XVI machinery, NOT XV metals)
4. SPECIFIC sections override general (clothing → ALWAYS XI/XII, pharmaceuticals → ALWAYS VI)
5. WASTE/SCRAP → ORIGINAL MATERIAL (metal scrap → XV, used cooking oil → III)
6. TOY versions → Section XX (toy car = XX, NOT XVII vehicles)
7. PARTS of machines → with machine (XVI) unless general-use like screws (XV)
8. If pre-filter missed the right Section, you CAN pick one not in candidates — explain why

## CRITICAL:
- The heading descriptions are OFFICIAL WCO HS text. Trust them.
- If product's exact material/form is in a heading, that's very strong evidence.`;

// Old v2.0 prompt preserved for reference
const STEP2_PROMPT = `You are a licensed customs broker with 20 years of experience in HS classification.
Your ONLY task is to determine which HS SECTION (I through XXI) a product belongs to.

## Your thinking process (follow EXACTLY):

### Phase 1: Understand what the product IS
- What is this product made of? (primary material)
- What is its physical form? (solid, liquid, assembled device, garment, etc.)
- What is it used for? (primary function)
- Is it raw, semi-finished, or finished?

### Phase 2: Translate trade names to HS language
Commercial names often differ from HS descriptions. Translate mentally:
"Grease" (cooking) → animal/vegetable fat/oil | "Lumber" → wood | "Sneakers" → footwear
"Laptop" → automatic data processing machine | "T-shirt" → knitted cotton garment
"Aspirin" → pharmaceutical preparation | "LED bulb" → electrical lighting equipment
"Brake pad" → parts of vehicles | "Phone case" → articles of plastics/leather (by material)
"Restaurant grease" → used cooking fats/oils | "Lanyards" → narrow woven textile articles
"Pennants/flags" → printed articles (Ch.49) or textile articles (Ch.63)
"Motor vehicle" → vehicle (Ch.87) | "Sutures" → surgical/medical supplies or raw material
"Nickel alloy wire" → base metal articles | "Frozen beef" → meat (Ch.02)
"Ceramic coin bank" → ceramic articles | "Lead ingots" → base metal unwrought
"Pesticide" → chemical preparation | "Wooden ornament" → wood articles
"Fishing rod case" → travel goods/leather goods | "Wine" → beverage
"Solar panel" → electrical equipment | "Cotton towel" → textile article
"Stainless steel pipe" → articles of iron/steel | "Diamond ring" → precious stones/jewelry
"Shampoo" → cosmetic/chemical preparation | "Rubber tire" → rubber articles
"Guitar" → musical instrument | "Painting (original)" → works of art
"Rifle scope" → optical instrument | "Baby stroller" → vehicle
"Candle" → miscellaneous manufactured article | "Fertilizer" → chemical product
"Frozen shrimp" → crustacean/animal product | "Cocoa powder" → cocoa preparation
"Silk scarf" → textile article | "Porcelain vase" → ceramic product
"Copper wire" → base metal article | "Wristwatch" → clock/watch
"Toy car" → toy (NOT vehicle) | "Toothbrush" → miscellaneous manufactured article
"Artificial flower" → artificial flower (Ch.67) | "Wallpaper" → paper article
"Olive oil" → animal/vegetable fat/oil | "Cement" → mineral product
"Hearing aid" → medical/precision instrument | "Fishing net" → textile article
"Bicycle helmet" → headgear (NOT vehicle part) | "USB cable" → electrical equipment
"Essential oil" → chemical/allied product | "Canned tuna" → prepared food
"Fur coat" → furskin article | "Cork stopper" → cork article
Think: "Strip away brand/commercial language. What is this thing fundamentally?"

### Phase 3: Material vs Function rule
1. MATERIAL priority for raw/semi-processed (Sections I-XV mostly)
   Copper wire = Section XV (base metals), NOT XVI (electrical)
2. FUNCTION priority for finished manufactured articles (Sections XVI-XXI mostly)
   Washing machine = Section XVI (machinery), regardless of steel construction
3. SPECIFIC sections override general:
   Clothing → ALWAYS Section XI or XII, even if leather
   Pharmaceuticals → ALWAYS Section VI, even if plant-based

### Phase 4: Common traps
- Food INGREDIENTS vs PREPARATIONS: raw coffee beans (Sect II) vs roasted coffee (Sect IV)
- WASTE goes with original material: metal scrap (XV), used cooking oil (III)
- PARTS of machines: with machine (XVI) unless general-use like screws (XV)
- SETS/KITS: essential character component (GRI 3b)
- TOY versions: toy car = Section XX (toys), NOT XVII (vehicles)
- PRINTED items with text/images: may be Section X (printed matter) not by material

## The 21 HS Sections:
I. Live animals; animal products (Ch.1-5)
II. Vegetable products (Ch.6-14)
III. Animal, vegetable fats and oils (Ch.15) — incl. USED/WASTE cooking oils
IV. Prepared foodstuffs; beverages; tobacco (Ch.16-24)
V. Mineral products (Ch.25-27)
VI. Chemical or allied industries (Ch.28-38) — pharmaceuticals, cosmetics, pesticides
VII. Plastics and rubber (Ch.39-40)
VIII. Hides, leather, furskins (Ch.41-43) — handbags, travel goods
IX. Wood, cork, straw (Ch.44-46)
X. Paper and printed matter (Ch.47-49) — books, labels, flags/pennants, decals
XI. Textiles and textile articles (Ch.50-63) — ALL fibers, fabrics, clothing, lanyards
XII. Footwear, headgear, umbrellas (Ch.64-67)
XIII. Stone, ceramic, glass (Ch.68-70) — terra cotta, porcelain, crystal
XIV. Precious metals and stones (Ch.71) — jewelry, gold, gems
XV. Base metals (Ch.72-83) — iron/steel/copper/aluminum articles, tools, fasteners
XVI. Machinery and electrical equipment (Ch.84-85) — computers, phones, batteries
XVII. Vehicles, aircraft, vessels (Ch.86-89) — cars, bikes, ships, aircraft
XVIII. Instruments, clocks, musical (Ch.90-92) — medical, optical, watches
XIX. Arms and ammunition (Ch.93)
XX. Miscellaneous manufactured articles (Ch.94-96) — furniture, toys, pens, candles
XXI. Works of art, antiques (Ch.97)`;

interface Step2LLMResponse {
  thinking: string;
  section_1: number;
  section_2: number | null;
  section_3: number | null;
  confidence: number;
}

// v2.0 LLM (preserved for reference)
// async function matchSectionsLLM(input: GriProductInput): Promise<SectionCandidate[]> { ... }

/**
 * v2.2: Pre-filter + LLM with candidates and Step 1 context.
 */
async function matchSectionsLLMv2(
  input: GriProductInput,
  keywordResult: KeywordResult
): Promise<SectionCandidate[]> {
  const preFilter = preFilterSections(keywordResult);

  const userPrompt = `## PRODUCT INFORMATION (from Step 1):
Product name: "${input.productName}"
${keywordResult.productUnderstood ? `Product understood as: "${keywordResult.productUnderstood}"` : ''}
${keywordResult.material ? `Primary material: ${keywordResult.material}` : ''}
${keywordResult.materialSecondary ? `Secondary material: ${keywordResult.materialSecondary}` : ''}
${keywordResult.productType ? `Product type: ${keywordResult.productType}` : ''}
${keywordResult.processingLevel ? `Processing level: ${keywordResult.processingLevel}` : ''}
${keywordResult.isWaste ? '⚠️ WASTE/USED product' : ''}
${keywordResult.isComposite ? 'Composite/multi-material product' : ''}
${keywordResult.hsNotes ? `HS notes: ${keywordResult.hsNotes}` : ''}
Keywords: ${keywordResult.keywords.slice(0, 15).join(', ')}

## CANDIDATE SECTIONS (pre-filtered from 1,229 heading descriptions):
${preFilter.matchSummary}

## YOUR ANSWER (STRICT JSON only):
{"thinking":"your reasoning in 1-2 sentences","section_1":N,"section_2":N_or_null,"section_3":N_or_null,"confidence":0.X}`;

  const result = await callLLM<Step2LLMResponse>({
    userPrompt: STEP2_PROMPT_V2 + '\n\n' + userPrompt,
    maxTokens: 200,
    temperature: 0,
  });

  if (!result.data || !result.data.section_1) return [];

  const candidates: SectionCandidate[] = [];
  const d = result.data;

  const addCandidate = (sec: number, scoreBoost: number) => {
    if (sec >= 1 && sec <= 21 && SECTION_KEYWORDS[sec]) {
      candidates.push({
        section: sec,
        score: (d.confidence || 0.7) * 10 + scoreBoost,
        chapters: SECTION_KEYWORDS[sec].chapters,
        title: SECTION_KEYWORDS[sec].title,
      });
    }
  };

  addCandidate(d.section_1, 5);
  if (d.section_2) addCandidate(d.section_2, 2);
  if (d.section_3) addCandidate(d.section_3, 0);

  return candidates;
}

/**
 * Main export — v2.2 pre-filter + LLM, fallback to keyword.
 */
export async function matchSections(
  keywordResult: KeywordResult,
  input?: GriProductInput
): Promise<SectionCandidate[]> {
  if (input) {
    try {
      const llmResult = await matchSectionsLLMv2(input, keywordResult);
      if (llmResult.length > 0) return llmResult;
    } catch {
      // LLM failed, fall through
    }
  }
  return matchSectionsKeyword(keywordResult);
}
