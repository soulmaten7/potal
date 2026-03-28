/**
 * v3 Step 2-1 — Section Candidate Selection
 * Material keywords → Section mapping + category override
 */

import type { NormalizedInputV3, Step2_1_Output } from '../../types';
import { getAllSectionNotes } from '../../data/section-notes';
import { CHAPTER_DESCRIPTIONS, CHAPTER_TO_SECTION } from '../../data/chapter-descriptions';

/** WCO Chapter descriptions → keyword index (auto-generated at module load) */
const CHAPTER_KEYWORDS: Record<number, Set<string>> = buildChapterKeywords();

function buildChapterKeywords(): Record<number, Set<string>> {
  const STOP = new Set(['and','or','of','the','thereof','other','not','elsewhere',
    'specified','included','articles','parts','accessories','products','preparations',
    'whether','their','with','than','such','like','similar','certain','kind','n.e.c.',
    'suitable','all','kinds','n.e.c','containing','intended','human','body','a','in',
    'for','to','into','from','made','materials','material','fibres','metal','base',
    'its','them','these','those','substances','metals',
    // Generic words that appear in many chapter descriptions — too ambiguous for matching
    'origin','organic','food','edible','prepared','live','raw','natural','fine',
    'coarse','manufactured','man-made','special','industrial','mineral','vegetable',
    'animal','miscellaneous','recovered','waste','scrap','worked','graded','mounted',
    'set','clad','plated','covered','coated','laminated','impregnated','stuffed',
    'prefabricated','illuminated','nuclear','mechanical','electro-mechanical','rolling',
    'combustible','pyrophoric','fibrous','cellulosic','oleaginous','albuminoidal']);

  const result: Record<number, Set<string>> = {};
  for (const [ch, desc] of Object.entries(CHAPTER_DESCRIPTIONS)) {
    const chNum = parseInt(ch);
    if (isNaN(chNum)) continue;
    const words = new Set<string>();
    // Split by semicolons, commas, parentheses to get phrases, then tokenize
    const phrases = desc.toLowerCase().replace(/[;,()]/g, '|').split('|');
    for (const phrase of phrases) {
      const tokens = phrase.trim().split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
      for (const t of tokens) words.add(t);
      // Also add 2-word compound phrases (e.g. "precious stones", "iron steel")
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i].length >= 3 && tokens[i + 1].length >= 3) {
          words.add(`${tokens[i]} ${tokens[i + 1]}`);
        }
      }
    }
    // Add common variants
    if (words.has('jewellery')) words.add('jewelry');
    if (words.has('aluminium')) words.add('aluminum');
    if (words.has('sulphur')) words.add('sulfur');
    if (words.has('tyres')) words.add('tires');
    if (words.has('colour')) words.add('color');
    if (words.has('colours')) words.add('colors');
    result[chNum] = words;
  }
  return result;
}

/** Material → Section mapping */
const MATERIAL_TO_SECTION: Record<string, { section: number; score: number }[]> = {
  // Section I: Live animals; animal products
  meat: [{ section: 1, score: 0.9 }],
  fish: [{ section: 1, score: 0.9 }],
  shrimp: [{ section: 1, score: 0.9 }],
  seafood: [{ section: 1, score: 0.9 }],
  poultry: [{ section: 1, score: 0.9 }],
  dairy: [{ section: 1, score: 0.8 }],
  animal: [{ section: 1, score: 0.8 }],
  // Section II: Vegetable products
  plant: [{ section: 2, score: 0.85 }],
  vegetable: [{ section: 2, score: 0.85 }],
  grain: [{ section: 2, score: 0.8 }],
  rice: [{ section: 2, score: 0.9 }],
  wheat: [{ section: 2, score: 0.9 }],
  seed: [{ section: 2, score: 0.8 }],
  coffee: [{ section: 2, score: 0.9 }],
  tea: [{ section: 2, score: 0.9 }],
  cocoa: [{ section: 2, score: 0.9 }],
  spice: [{ section: 2, score: 0.9 }],
  herb: [{ section: 2, score: 0.85 }],
  // Section III: Fats and oils
  // Section IV: Prepared foodstuffs
  // Section V: Mineral products
  mineral: [{ section: 5, score: 0.8 }],
  ore: [{ section: 5, score: 0.85 }],
  cement: [{ section: 5, score: 0.8 }],
  // Section VI: Chemical products
  chemical: [{ section: 6, score: 0.9 }],
  pharmaceutical: [{ section: 6, score: 0.9 }],
  acid: [{ section: 6, score: 0.9 }],
  compound: [{ section: 6, score: 0.85 }],
  medicine: [{ section: 6, score: 0.9 }],
  drug: [{ section: 6, score: 0.9 }],
  // Section VII: Plastics and rubber
  plastic: [{ section: 7, score: 0.9 }],
  rubber: [{ section: 7, score: 0.9 }],
  silicone: [{ section: 7, score: 0.85 }],
  // Section VIII: Hides, leather
  leather: [{ section: 8, score: 0.95 }],
  // Section IX: Wood
  wood: [{ section: 9, score: 0.9 }],
  bamboo: [{ section: 9, score: 0.9 }],
  cork: [{ section: 9, score: 0.85 }],
  // Section X: Paper
  paper: [{ section: 10, score: 0.9 }],
  cardboard: [{ section: 10, score: 0.9 }],
  // Section XI: Textiles
  cotton: [{ section: 11, score: 0.9 }],
  polyester: [{ section: 11, score: 0.9 }],
  silk: [{ section: 11, score: 0.9 }],
  wool: [{ section: 11, score: 0.9 }],
  nylon: [{ section: 11, score: 0.9 }],
  linen: [{ section: 11, score: 0.9 }],
  fabric: [{ section: 11, score: 0.85 }],
  textile: [{ section: 11, score: 0.9 }],
  // Section XII: Footwear, headgear (by category, not material)
  // Section XIII: Stone, ceramic, glass
  ceramic: [{ section: 13, score: 0.9 }],
  stoneware: [{ section: 13, score: 0.9 }],
  porcelain: [{ section: 13, score: 0.9 }],
  glass: [{ section: 13, score: 0.9 }],
  stone: [{ section: 13, score: 0.7 }, { section: 5, score: 0.6 }],
  // Section XIV: Precious metals
  gold: [{ section: 14, score: 0.9 }],
  silver: [{ section: 14, score: 0.9 }],
  platinum: [{ section: 14, score: 0.9 }],
  // Section XV: Base metals
  steel: [{ section: 15, score: 0.9 }],
  iron: [{ section: 15, score: 0.9 }],
  aluminum: [{ section: 15, score: 0.9 }],
  copper: [{ section: 15, score: 0.9 }],
  zinc: [{ section: 15, score: 0.8 }],
  tin: [{ section: 15, score: 0.8 }],
  nickel: [{ section: 15, score: 0.85 }],
  lead: [{ section: 15, score: 0.8 }],
  titanium: [{ section: 15, score: 0.8 }],
  brass: [{ section: 15, score: 0.85 }],
  bronze: [{ section: 15, score: 0.85 }],
  metal: [{ section: 15, score: 0.7 }],
  // Section I additions
  egg: [{ section: 1, score: 0.85 }],
  honey: [{ section: 1, score: 0.85 }],
  fur: [{ section: 1, score: 0.85 }],
  hide: [{ section: 8, score: 0.9 }],
  // Section II additions
  fruit: [{ section: 2, score: 0.85 }],
  tobacco: [{ section: 4, score: 0.95 }],
  // Section III: Fats, oils, waxes
  oil: [{ section: 3, score: 0.85 }, { section: 5, score: 0.5 }],
  fat: [{ section: 3, score: 0.9 }],
  wax: [{ section: 3, score: 0.85 }],
  candle: [{ section: 6, score: 0.85 }],
  // Section IV: Prepared foodstuffs
  sugar: [{ section: 4, score: 0.85 }],
  chocolate: [{ section: 4, score: 0.9 }],
  beverage: [{ section: 4, score: 0.85 }],
  alcohol: [{ section: 4, score: 0.9 }],
  flour: [{ section: 4, score: 0.85 }],
  // Section V: Mineral products
  petroleum: [{ section: 5, score: 0.9 }],
  coal: [{ section: 5, score: 0.85 }],
  salt: [{ section: 5, score: 0.8 }],
  sand: [{ section: 5, score: 0.7 }],
  // Section VI additions
  soap: [{ section: 6, score: 0.85 }],
  cosmetic: [{ section: 6, score: 0.85 }],
  fertilizer: [{ section: 6, score: 0.85 }],
  explosive: [{ section: 6, score: 0.8 }],
  // Section VII additions
  foam: [{ section: 7, score: 0.85 }],
  resin: [{ section: 7, score: 0.85 }],
  // Section XII: Footwear, headgear (by material when applicable)
  footwear: [{ section: 12, score: 0.9 }],
  headgear: [{ section: 12, score: 0.85 }],
  // Section XIV additions
  pearl: [{ section: 14, score: 0.9 }],
  diamond: [{ section: 14, score: 0.9 }],
  jewelry: [{ section: 14, score: 0.85 }],
  // Section XVI: Machinery, electrical
  machinery: [{ section: 16, score: 0.9 }],
  electronic: [{ section: 16, score: 0.9 }],
  battery: [{ section: 16, score: 0.85 }],
  // Section XVII: Vehicles
  vehicle: [{ section: 17, score: 0.9 }],
  bicycle: [{ section: 17, score: 0.85 }],
  tire: [{ section: 7, score: 0.9 }],
  // Section XVIII: Instruments
  optical: [{ section: 18, score: 0.9 }],
  musical: [{ section: 18, score: 0.9 }],
  // Section XIX: Arms
  weapon: [{ section: 19, score: 0.95 }],
  // Section XX: Miscellaneous manufactured
  furniture: [{ section: 20, score: 0.9 }],
  toy: [{ section: 20, score: 0.9 }],
  sports: [{ section: 20, score: 0.8 }],
  candle_material: [{ section: 6, score: 0.85 }],
  // Section XXI: Art
  art: [{ section: 21, score: 0.9 }],
};

/** Category keywords → Section override */
const CATEGORY_TO_SECTION: Record<string, { section: number; score: number }> = {
  watch: { section: 18, score: 0.95 },
  watches: { section: 18, score: 0.95 },
  clock: { section: 18, score: 0.95 },
  toy: { section: 20, score: 0.95 },
  toys: { section: 20, score: 0.95 },
  game: { section: 20, score: 0.9 },
  games: { section: 20, score: 0.9 },
  furniture: { section: 20, score: 0.95 },
  vehicle: { section: 17, score: 0.95 },
  car: { section: 17, score: 0.95 },
  truck: { section: 17, score: 0.95 },
  motorcycle: { section: 17, score: 0.95 },
  bicycle: { section: 17, score: 0.9 },
  machine: { section: 16, score: 0.9 },
  electronic: { section: 16, score: 0.9 },
  computer: { section: 16, score: 0.95 },
  phone: { section: 16, score: 0.95 },
  laptop: { section: 16, score: 0.95 },
  camera: { section: 18, score: 0.9 },
  printer: { section: 16, score: 0.9 },
  weapon: { section: 19, score: 0.95 },
  ammunition: { section: 19, score: 0.95 },
  footwear: { section: 12, score: 0.95 },
  shoe: { section: 12, score: 0.95 },
  shoes: { section: 12, score: 0.95 },
  boot: { section: 12, score: 0.9 },
  boots: { section: 12, score: 0.9 },
  sandal: { section: 12, score: 0.9 },
  sandals: { section: 12, score: 0.9 },
  sneaker: { section: 12, score: 0.9 },
  sneakers: { section: 12, score: 0.9 },
  hat: { section: 12, score: 0.85 },
  umbrella: { section: 12, score: 0.85 },
  // Section VI via category
  chemicals: { section: 6, score: 0.9 },
  medications: { section: 6, score: 0.9 },
  health: { section: 6, score: 0.7 },
  // Section IV via category (prepared food)
  grocery: { section: 4, score: 0.85 },
  food: { section: 4, score: 0.85 },
  beverages: { section: 4, score: 0.85 },
  snacks: { section: 4, score: 0.85 },
  // Section XVI: Kitchen/Electronics appliances
  appliances: { section: 16, score: 0.95 },
  appliance: { section: 16, score: 0.95 },
  blender: { section: 16, score: 0.95 },
  blenders: { section: 16, score: 0.95 },
  mixer: { section: 16, score: 0.9 },
  oven: { section: 16, score: 0.9 },
  microwave: { section: 16, score: 0.9 },
  headphones: { section: 16, score: 0.95 },
  earbuds: { section: 16, score: 0.95 },
  earphones: { section: 16, score: 0.95 },
  speaker: { section: 16, score: 0.9 },
  speakers: { section: 16, score: 0.9 },
  audio: { section: 16, score: 0.9 },
  // Section VII via category
  tires: { section: 7, score: 0.95 },
  tire: { section: 7, score: 0.95 },
  tyres: { section: 7, score: 0.95 },
  tyre: { section: 7, score: 0.95 },
  // Packaging → Section X (paper) or VII (plastic) by material
  packaging: { section: 10, score: 0.7 },
  shipping: { section: 10, score: 0.6 },
  optical: { section: 18, score: 0.9 },
  medical: { section: 18, score: 0.85 },
  musical: { section: 18, score: 0.9 },
  instrument: { section: 18, score: 0.8 },
  ship: { section: 17, score: 0.95 },
  boat: { section: 17, score: 0.95 },
  aircraft: { section: 17, score: 0.95 },
  drone: { section: 20, score: 0.6 },  // ambiguous: toy vs aircraft
  jewelry: { section: 14, score: 0.95 },
  jewellery: { section: 14, score: 0.95 },
  painting: { section: 21, score: 0.9 },
  antique: { section: 21, score: 0.9 },
  sculpture: { section: 21, score: 0.9 },
  // Section I via category (animals/meat/seafood)
  meat: { section: 1, score: 0.9 },
  seafood: { section: 1, score: 0.9 },
  poultry: { section: 1, score: 0.9 },
  eggs: { section: 1, score: 0.85 },
  // Section II via category (agriculture/plants)
  agriculture: { section: 2, score: 0.85 },
  garden: { section: 2, score: 0.7 },
  seeds: { section: 2, score: 0.8 },
  spices: { section: 2, score: 0.9 },
  herbs: { section: 2, score: 0.85 },
  // Section III via category (oils/fats)
  cooking: { section: 3, score: 0.7 },
  candles: { section: 6, score: 0.85 },
  aromatherapy: { section: 3, score: 0.7 },
  // Section V via category (mineral/construction)
  construction: { section: 5, score: 0.8 },
  mining: { section: 5, score: 0.85 },
  petroleum: { section: 5, score: 0.9 },
  // Section IX via category (wood/craft)
  woodworking: { section: 9, score: 0.85 },
  craft: { section: 9, score: 0.6 },
  // Section XIII via category (glass/ceramic/stone)
  glassware: { section: 13, score: 0.9 },
  pottery: { section: 13, score: 0.9 },
  tiles: { section: 13, score: 0.85 },
  // Section XI via category (clothing/textiles)
  clothing: { section: 11, score: 0.95 },
  apparel: { section: 11, score: 0.95 },
  garment: { section: 11, score: 0.95 },
  garments: { section: 11, score: 0.95 },
  shirts: { section: 11, score: 0.95 },
  undershirts: { section: 11, score: 0.95 },
  underwear: { section: 11, score: 0.95 },
  dresses: { section: 11, score: 0.95 },
  pants: { section: 11, score: 0.95 },
  trousers: { section: 11, score: 0.95 },
  jackets: { section: 11, score: 0.95 },
  coats: { section: 11, score: 0.95 },
  sweaters: { section: 11, score: 0.95 },
  socks: { section: 11, score: 0.95 },
  hosiery: { section: 11, score: 0.95 },
  scarves: { section: 11, score: 0.95 },
  scarf: { section: 11, score: 0.95 },
  gloves: { section: 11, score: 0.9 },
  // Section VIII via category (leather goods)
  wallets: { section: 8, score: 0.95 },
  wallet: { section: 8, score: 0.95 },
  handbags: { section: 8, score: 0.95 },
  handbag: { section: 8, score: 0.95 },
  purses: { section: 8, score: 0.95 },
  luggage: { section: 8, score: 0.95 },
  bags: { section: 8, score: 0.9 },
  backpacks: { section: 8, score: 0.9 },
  belts: { section: 8, score: 0.9 },
  // Section IX via category (wood/kitchen)
  kitchen: { section: 15, score: 0.7 },
  kitchenware: { section: 15, score: 0.7 },
  // Section VII via category (yoga/fitness rubber)
  yoga: { section: 7, score: 0.85 },
  fitness: { section: 16, score: 0.7 },
};

/** Processing state affects Section choice */
const PROCESSING_OVERRIDES: { material: string; processing: string; section: number; score: number }[] = [
  { material: 'cotton', processing: 'raw', section: 2, score: 0.85 },
  { material: 'wool', processing: 'raw', section: 1, score: 0.85 },
  { material: 'silk', processing: 'raw', section: 1, score: 0.85 },
  { material: 'leather', processing: 'raw', section: 8, score: 0.9 },
  { material: 'rubber', processing: 'raw', section: 5, score: 0.7 },
];

export function selectSectionCandidates(input: NormalizedInputV3): Step2_1_Output {
  const candidates: Map<number, { score: number; matched_by: string }> = new Map();

  // 1. Material → Section mapping
  for (const mat of input.material_keywords) {
    const sections = MATERIAL_TO_SECTION[mat];
    if (sections) {
      for (const s of sections) {
        const existing = candidates.get(s.section);
        if (!existing || existing.score < s.score) {
          candidates.set(s.section, { score: s.score, matched_by: `material:${mat}` });
        }
      }
    }
  }

  // 2. Category override (HIGHEST priority — overrides material)
  //
  // Two-tier matching:
  //   Tier A: WCO Chapter keywords (CHAPTER_KEYWORDS from chapter-descriptions.ts) — legal basis
  //   Tier B: Legacy CATEGORY_TO_SECTION (128 manual keywords) — fallback
  //
  // Exception: passive accessories (stand, holder, mount, case, sleeve)
  // should be classified by MATERIAL, not by the device category.
  const PASSIVE_ACCESSORY_WORDS = ['stand', 'stands', 'holder', 'holders', 'mount', 'mounts', 'rack', 'racks', 'shelf', 'case', 'sleeve', 'cover', 'dock', 'riser', 'tray'];
  const ELECTRONICS_SECTIONS = [16]; // Section XVI: Machinery, electrical
  const nameLowerForAccessory = input.product_name.toLowerCase();
  const isPassiveAccessory = PASSIVE_ACCESSORY_WORDS.some(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    return regex.test(nameLowerForAccessory);
  });

  let categoryOverrideApplied = false;

  // ── Tier A: WCO Chapter keyword matching (legal basis, highest priority) ──
  // ONLY use category_tokens for WCO matching (not product_name)
  // Product_name words like "coffee" in "coffee mug" would falsely match Ch.9
  const allCategoryTokens = new Set<string>(
    input.category_tokens.map(t => t.toLowerCase()),
  );

  // Score each chapter by keyword overlap
  const chapterScores: { chapter: number; section: number; matchCount: number; bestKeyword: string }[] = [];
  for (const [chStr, kwSet] of Object.entries(CHAPTER_KEYWORDS)) {
    const ch = parseInt(chStr);
    if (isNaN(ch)) continue;
    let matchCount = 0;
    let bestKw = '';
    for (const kw of kwSet) {
      if (kw.includes(' ')) {
        // Multi-word: check if both words are in tokens
        const parts = kw.split(' ');
        if (parts.every(p => allCategoryTokens.has(p))) {
          matchCount += 2; // Compound match worth more
          bestKw = kw;
        }
      } else if (allCategoryTokens.has(kw)) {
        matchCount++;
        if (!bestKw) bestKw = kw;
      }
    }
    if (matchCount > 0) {
      const section = CHAPTER_TO_SECTION[ch];
      if (section !== undefined) {
        chapterScores.push({ chapter: ch, section, matchCount, bestKeyword: bestKw });
      }
    }
  }

  // Sort by match count, pick best
  chapterScores.sort((a, b) => b.matchCount - a.matchCount);

  if (chapterScores.length > 0) {
    const best = chapterScores[0];
    // Only apply if match is strong enough (≥2 keywords or single highly-specific keyword)
    const isStrong = best.matchCount >= 2 ||
      (best.matchCount === 1 && best.bestKeyword.length >= 6); // 6+ char keywords are more specific

    if (isStrong) {
      // Skip electronics override for passive accessories
      if (!(isPassiveAccessory && ELECTRONICS_SECTIONS.includes(best.section) && candidates.size > 0)) {
        const score = Math.min(0.95, 0.75 + best.matchCount * 0.04);
        candidates.clear();
        candidates.set(best.section, { score, matched_by: `wco_chapter:${best.chapter}(${best.bestKeyword})` });
        categoryOverrideApplied = true;
      }
    }
  }

  // ── Tier B: Legacy CATEGORY_TO_SECTION fallback (128 manual keywords) ──
  if (!categoryOverrideApplied) {
    // Process tokens in REVERSE order: deepest/most-specific category wins
    const reversedTokens = [...input.category_tokens].reverse();
    for (const token of reversedTokens) {
      const override = CATEGORY_TO_SECTION[token];
      if (override) {
        if (isPassiveAccessory && ELECTRONICS_SECTIONS.includes(override.section) && candidates.size > 0) {
          continue;
        }
        if (override.score >= 0.9 && !categoryOverrideApplied) {
          candidates.clear();
          categoryOverrideApplied = true;
        }
        if (!categoryOverrideApplied || !candidates.has(override.section)) {
          candidates.set(override.section, { score: override.score, matched_by: `category:${token}` });
        }
        if (categoryOverrideApplied) break;
      }
    }
  }
  // Also check product_name for legacy category keywords (fallback)
  if (!categoryOverrideApplied) {
    const nameLower = input.product_name.toLowerCase();
    for (const [kw, override] of Object.entries(CATEGORY_TO_SECTION)) {
      if (isPassiveAccessory && ELECTRONICS_SECTIONS.includes(override.section) && candidates.size > 0) {
        continue;
      }
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(nameLower) && override.score >= 0.9) {
        const existing = candidates.get(override.section);
        if (!existing || existing.score < override.score * 0.95) {
          candidates.set(override.section, { score: override.score * 0.95, matched_by: `product_name:${kw}` });
        }
      }
    }
  }

  // 3. Processing state overrides
  for (const proc of input.processing_states) {
    for (const po of PROCESSING_OVERRIDES) {
      if (input.material_primary === po.material && proc === po.processing) {
        const existing = candidates.get(po.section);
        if (!existing || existing.score < po.score) {
          candidates.set(po.section, { score: po.score, matched_by: `processing:${po.material}+${po.processing}` });
        }
      }
    }
  }

  // 4. Product name fallback if no candidates
  if (candidates.size === 0) {
    const nameLower = input.product_name.toLowerCase();
    for (const [kw, override] of Object.entries(CATEGORY_TO_SECTION)) {
      if (nameLower.includes(kw)) {
        candidates.set(override.section, { score: override.score * 0.8, matched_by: `product_name:${kw}` });
      }
    }
  }

  // Build output with section metadata
  const sectionNotes = getAllSectionNotes();
  const result: Step2_1_Output = { section_candidates: [] };

  candidates.forEach((info, section) => {
    const note = sectionNotes.find(n => n.section_number === section);
    const chFrom = parseInt(note?.chapter_from || '0', 10);
    const chTo = parseInt(note?.chapter_to || '0', 10);
    const chapters: number[] = [];
    for (let c = chFrom; c <= chTo; c++) chapters.push(c);

    result.section_candidates.push({
      section,
      title: note?.title || `Section ${section}`,
      score: info.score,
      matched_by: info.matched_by,
      chapters,
    });
  });

  // Sort by score desc, take top 3
  result.section_candidates.sort((a, b) => b.score - a.score);
  result.section_candidates = result.section_candidates.slice(0, 3);

  return result;
}
