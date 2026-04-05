/**
 * v3 Step 3 — Heading Selection (4-digit)
 * Strategy: category keyword → heading mapping (synonym dictionary approach)
 * Then fallback to keyword overlap on heading description.
 */

import type { NormalizedInputV3 } from '../../types';
import { getHeadingConditions } from '../../data/codified-headings';
import { getSubheadingConditions } from '../../data/codified-subheadings';
// Load extended keyword→heading mappings (13,449 keywords from 7-country codification)
// Use dynamic import to avoid fs.readFileSync (Vercel serverless compatible)
let _extendedKw: Record<string, string[]> | null = null;
function getExtendedKeywords(): Record<string, string[]> {
  if (_extendedKw) return _extendedKw;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _extendedKw = require('../../data/extended-heading-keywords.json') as Record<string, string[]>;
    return _extendedKw!;
  } catch {
    _extendedKw = {};
    return _extendedKw;
  }
}

export interface Step3Output {
  confirmed_heading: string;
  heading_description: string;
  confidence: number;
  matched_by: string;
  subheadings: { code: string; description: string }[];
  runner_up_heading?: string;
}

/**
 * Category/product keyword → heading mapping
 * Built from Google Taxonomy + ecommerce seller vocabulary → HS heading
 */
const KEYWORD_TO_HEADINGS: Record<string, string[]> = {
  // Kitchen/Tableware
  'kitchen': ['3924','4419','6911','6912','7013','7323','7615','8509','8516'],
  'kitchenware': ['3924','4419','6911','6912','7323'],
  'cutting boards': ['4419'], 'cutting board': ['4419'],
  'food storage': ['3923','3924'], 'containers': ['3923','3924'],
  'mugs': ['6911','6912'], 'mug': ['6911','6912'],
  'cups': ['6911','6912','7013'], 'cup': ['6911','6912','7013'],
  'tableware': ['3924','4419','6911','6912','7013','7323'],
  'plates': ['6911','6912','7013','7323'], 'bowls': ['6911','6912','7013'],
  // Clothing — knitted (Ch.61)
  't-shirts': ['6109'], 't-shirt': ['6109'], 'tee': ['6109'], 'tees': ['6109'],
  'shirts': ['6105','6106','6205','6206'],
  'dresses': ['6104','6204'], 'dress': ['6104','6204'],
  'pants': ['6103','6104','6203','6204'], 'trousers': ['6103','6203'],
  'jackets': ['6101','6102','6201','6202'], 'jacket': ['6101','6102','6201','6202'],
  'coats': ['6101','6102','6201','6202'], 'coat': ['6101','6102','6201','6202'],
  'sweaters': ['6110'], 'sweater': ['6110'], 'knitwear': ['6110'],
  'underwear': ['6107','6108','6207','6208'],
  'socks': ['6115'], 'hosiery': ['6115'],
  'suits': ['6103','6104','6203','6204'],
  // Accessories
  'belts': ['4203'], 'belt': ['4203'],
  'gloves': ['4203','6116','6216'], 'mittens': ['6116','6216'],
  'hats': ['6505','6506'], 'caps': ['6505','6506'],
  'scarves': ['6117','6214'], 'scarf': ['6117','6214'],
  'handbags': ['4202'], 'handbag': ['4202'], 'bags': ['4202'],
  'wallets': ['4202'], 'wallet': ['4202'], 'purses': ['4202'],
  'luggage': ['4202'], 'suitcases': ['4202'], 'backpacks': ['4202'],
  // Footwear
  'shoes': ['6401','6402','6403','6404','6405'], 'shoe': ['6403'],
  'boots': ['6401','6402','6403'], 'boot': ['6403'],
  'sandals': ['6402','6403','6404'], 'sneakers': ['6402','6403','6404'],
  'footwear': ['6401','6402','6403','6404','6405'],
  // Electronics
  'headphones': ['8518'], 'earbuds': ['8518'], 'earphones': ['8518'],
  'speakers': ['8518'], 'speaker': ['8518'],
  'microphones': ['8518'], 'microphone': ['8518'],
  'smartphones': ['8517'], 'phones': ['8517'], 'telephone': ['8517'],
  'laptop tablets': ['8471'], 'laptops': ['8471'], 'computers': ['8471'],
  'cameras': ['9006'], 'camera': ['9006'],
  'monitors': ['8528'], 'televisions': ['8528'], 'tv': ['8528'],
  'chargers': ['8504'], 'batteries': ['8506','8507'],
  'cables': ['8544'], 'wires': ['8544'],
  'wireless': ['8517','8518'],
  // Appliances
  'blenders': ['8509'], 'blender': ['8509'],
  'mixers': ['8509'], 'mixer': ['8509'],
  'appliances': ['8509','8516'], 'appliance': ['8509','8516'],
  'vacuum': ['8508'], 'vacuum cleaners': ['8508'],
  'ovens': ['8516'], 'toasters': ['8516'], 'kettles': ['8516'],
  // Automotive
  'tires': ['4011'], 'tire': ['4011'], 'tyres': ['4011'], 'tyre': ['4011'],
  'pneumatic': ['4011'],
  // Toys
  'building sets': ['9503'], 'building blocks': ['9503'],
  'blocks': ['9503'], 'toys': ['9503','9501','9502','9504','9505'],
  'dolls': ['9503'], 'puzzles': ['9503'], 'action figures': ['9503'],
  'board games': ['9504'], 'video games': ['9504'],
  // Food
  'coffee': ['0901'], 'tea': ['0902'], 'chocolate': ['1806'],
  'seafood': ['0301','0302','0303','0304','0305','0306','0307','0308'],
  'frozen seafood': ['0303','0306'], 'shrimp': ['0306'], 'prawns': ['0306'],
  'crustaceans': ['0306'], 'fish': ['0302','0303','0304','0305'],
  'frozen fish': ['0303'], 'fresh fish': ['0302'],
  // Packaging
  'shipping boxes': ['4819'], 'cardboard boxes': ['4819'],
  'glass bottles': ['7010'], 'bottles': ['3923','7010'],
  'cartons': ['4819'], 'boxes': ['4819'],
  // Health/Pharma
  'medications': ['3003','3004'], 'medicine': ['3003','3004'], 'medicines': ['3003','3004'],
  'pain relief': ['3004'], 'tablets': ['3004'],
  'vitamins': ['2936','3004'], 'supplements': ['2106','3004'],
  'pharmaceutical': ['3003','3004'], 'medicaments': ['3004'],
  // Watches
  'watches': ['9101','9102'], 'watch': ['9101','9102'],
  'watch accessories': ['9113','9114'], 'watch bands': ['9113'],
  'watch straps': ['9113'], 'straps': ['9113'],
  // Industrial
  'fasteners': ['7318'], 'bolts': ['7318'], 'nuts': ['7318'],
  'screws': ['7318'], 'rivets': ['7318'], 'washers': ['7318'],
  'nails': ['7317'],
  'pipes': ['7304','7305','7306','7608'], 'tubes': ['7304','7306','7608'],
  // Metals
  'metal sheets': ['7208','7209','7210','7606'], 'metal plates': ['7208','7606'],
  'foil': ['7607','7612'],
  // Chemicals
  'acids': ['2811','2904','2915','2916','2917','2918'],
  'citric acid': ['2918'], 'acetic acid': ['2915'],
  // Raw materials
  'cotton': ['5201','5202','5203'], 'raw cotton': ['5201'],
  'bales': ['5201'],
  // Wood
  'plywood': ['4412'], 'particle board': ['4410'],
  'veneer': ['4408'], 'timber': ['4403','4407'],
  // Ceramic
  'tiles': ['6907','6908'], 'porcelain': ['6911'], 'stoneware': ['6912'],
  'ceramic': ['6907','6908','6909','6911','6912'],
  // Water bottles / thermos
  'water bottle': ['7323','7615','3924'], 'water bottles': ['7323','7615','3924'],
  'thermos': ['7323','7615'], 'thermoses': ['7323','7615'],
  'insulated': ['7323','7615'],
  // Laptop/desk accessories
  'laptop stand': ['7616','7326'], 'laptop stands': ['7616','7326'],
  'desk stand': ['7616','7326'], 'stand': ['7616','7326','3926'],
  // Yoga/fitness
  'yoga mat': ['4016','3918'], 'yoga mats': ['4016','3918'],
  'exercise mat': ['4016','3918'], 'fitness mat': ['4016','3918'],
  'mat': ['4016','3918','5705'],
  'floor covering': ['3918','5705'], 'floor coverings': ['3918','5705'],
  // ── Section I: Animals/Seafood ──
  'salmon': ['0302','0303','0304'],
  'tuna': ['0302','0303','0304'], 'crab': ['0306'], 'lobster': ['0306'],
  'meat': ['0201','0202','0203','0204','0207'], 'beef': ['0201','0202'],
  'pork': ['0203'], 'chicken': ['0207'], 'turkey': ['0207'],
  'eggs': ['0407','0408'], 'honey': ['0409'],
  'milk': ['0401','0402'], 'cheese': ['0406'], 'butter': ['0405'],
  // ── Section II: Vegetables/Fruits/Coffee/Tea ──
  'rice': ['1006'], 'wheat': ['1001'], 'corn': ['1005'], 'barley': ['1003'],
  'flour': ['1101','1102'], 'starch': ['1108'],
  'fruit': ['0803','0804','0805','0806','0808','0810'],
  'dried fruits': ['0813'], 'tree nuts': ['0801','0802'],
  'pepper': ['0904'], 'cinnamon': ['0906'], 'ginger': ['0910'],
  'vanilla': ['0905'], 'turmeric': ['0910'],
  // ── Section III: Oils/Fats/Waxes/Candles ──
  'olive oil': ['1509'], 'coconut oil': ['1513'], 'palm oil': ['1511'],
  'soybean oil': ['1507'], 'sunflower oil': ['1512'],
  'essential oils': ['3301'], 'essential oil': ['3301'],
  'candles': ['3406'], 'wax candles': ['3406'],
  'margarine': ['1517'],
  // ── Section IV: Prepared Foods ──
  'sugar': ['1701','1702'], 'candy': ['1704'], 'confectionery': ['1704'],
  'cocoa': ['1801','1803','1804','1805'],
  'cereal': ['1904'], 'pasta': ['1902'], 'bread': ['1905'],
  'juice': ['2009'], 'soda': ['2202'], 'mineral water': ['2201'],
  'wine': ['2204'], 'beer': ['2203'], 'whiskey': ['2208'], 'vodka': ['2208'],
  'vinegar': ['2209'], 'sauce': ['2103'], 'ketchup': ['2103'],
  'jam': ['2007'], 'pickles': ['2001'], 'canned food': ['2005'],
  // ── Section V: Mineral/Petroleum ──
  'cement': ['2523'], 'concrete': ['6810'], 'plaster': ['2520'],
  'salt': ['2501'], 'sulfur': ['2503'], 'petroleum': ['2709','2710'],
  'gasoline': ['2710'], 'diesel': ['2710'], 'lubricant': ['2710'],
  'coal': ['2701'], 'charcoal': ['4402'],
  // ── Section VI: Chemicals/Soap/Cosmetics ──
  'soap': ['3401'], 'detergent': ['3402'], 'shampoo': ['3305'],
  'perfume': ['3303'], 'makeup': ['3304'], 'lipstick': ['3304'],
  'lotion': ['3304'], 'sunscreen': ['3304'], 'toothpaste': ['3306'],
  'fertilizer': ['3101','3102','3103','3104','3105'],
  'insecticide': ['3808'], 'pesticide': ['3808'],
  'paint': ['3208','3209','3210'], 'varnish': ['3208','3209'],
  'adhesive': ['3506'], 'glue': ['3506'],
  'ink': ['3215'], 'dye': ['3204'],
  // ── Section VII additions ──
  'foam': ['3921','4016'], 'sponge': ['3921','4016'],
  'pipe': ['3917','7304','7306'], 'hose': ['3917','4009'],
  'bag': ['3923','4202'], 'sack': ['3923','6305'],
  'film': ['3920','3702'], 'sheet': ['3920','3921','4408','7208'],
  // ── Section X: Paper ──
  'envelope': ['4817'], 'stationery': ['4817','4820'],
  'notebook': ['4820'], 'diary': ['4820'], 'journal': ['4820'],
  'tissue': ['4818'], 'toilet paper': ['4818'], 'napkin': ['4818'],
  'label': ['4821'], 'sticker': ['4821'],
  // ── Section XII: Footwear/Headgear ──
  'helmet': ['6506'], 'hard hat': ['6506'],
  'slipper': ['6401','6402','6403','6404'], 'slippers': ['6401','6402'],
  // ── Section XIV: Precious metals/Jewelry ──
  'necklace': ['7113','7117'], 'bracelet': ['7113','7117'],
  'earring': ['7113','7117'], 'earrings': ['7113','7117'],
  'ring': ['7113','7117'], 'rings': ['7113','7117'],
  'brooch': ['7113','7117'], 'pendant': ['7113','7117'],
  'chain': ['7113','7117','7315'], 'silver jewelry': ['7113'],
  'gold jewelry': ['7113'], 'costume jewelry': ['7117'],
  // ── Section XV: Base metals additions ──
  'skillet': ['7323','7615'], 'pan': ['7323','7615'],
  'pot': ['7323','7615'], 'cookware': ['7323','7615'],
  'knife': ['8211','8214'], 'knives': ['8211','8214'],
  'fork': ['8215'], 'spoon': ['8215'], 'cutlery': ['8211','8215'],
  'lock': ['8301'], 'padlock': ['8301'], 'key': ['8301'],
  'needle': ['7319','8452'], 'pin': ['7319'], 'staple': ['7317'],
  'wire': ['7217','7312','7413','7605'], 'cable': ['7312','8544'],
  // ── Section XVI: Machinery/Electrical ──
  'drill': ['8467'], 'power drill': ['8467'], 'grinder': ['8467'],
  'saw': ['8202','8467'], 'power tool': ['8467'], 'power tools': ['8467'],
  'motor': ['8501'], 'generator': ['8501','8502'],
  'pump': ['8413','8414'], 'compressor': ['8414'],
  'washing machine': ['8450'], 'dishwasher': ['8422'],
  'refrigerator': ['8418'], 'freezer': ['8418'],
  'air conditioner': ['8415'], 'heater': ['8516'],
  'fan': ['8414'], 'iron': ['8516'], 'hair dryer': ['8516'],
  'sewing machine': ['8452'], 'printer': ['8443'],
  'robot': ['8479'], 'conveyor': ['8428'],
  'transformer': ['8504'], 'inverter': ['8504'],
  'switch': ['8536'], 'socket': ['8536'], 'plug': ['8536'],
  'led': ['8541'], 'solar panel': ['8541'],
  // ── Section XVII: Vehicles ──
  'car parts': ['8708'], 'auto parts': ['8708'],
  'brake': ['8708'], 'filter': ['8421','8708'],
  'trailer': ['8716'], 'wheelchair': ['8713'],
  'stroller': ['8715'], 'baby carriage': ['8715'],
  // ── Section XVIII: Instruments ──
  'thermometer': ['9025'], 'barometer': ['9025'],
  'scale': ['8423'], 'weighing': ['8423'],
  'compass': ['9014'], 'gps': ['9014'],
  'guitar': ['9202'], 'piano': ['9201'], 'violin': ['9202'],
  'drum': ['9206'], 'flute': ['9205'], 'trumpet': ['9205'],
  // ── Section XX: Miscellaneous ──
  'sofa': ['9401'], 'couch': ['9401'], 'chair': ['9401','9402'],
  'bed': ['9403'], 'mattress': ['9404'],
  'desk': ['9403'], 'bookshelf': ['9403'],
  'lamp': ['9405'], 'chandelier': ['9405'], 'lantern': ['9405'],
  'broom': ['9603'], 'mop': ['9603'], 'toothbrush': ['9603'],
  'comb': ['9615'], 'hair clip': ['9615'],
  'lighter': ['9613'], 'match': ['3605'],
  'pen': ['9608'], 'pencil': ['9609'], 'marker': ['9608'],
  'button': ['9606'], 'zipper': ['9607'], 'buckle': ['8308'],
  'game': ['9504'], 'playing cards': ['9504'],
  'ball': ['9506'], 'racket': ['9506'], 'golf club': ['9506'],
  'fishing rod': ['9507'], 'fishing reel': ['9507'],
  'tent': ['6306'], 'sleeping bag': ['9404'],
  'christmas': ['9505'], 'decoration': ['9505'],
};

/** Fuzzy match: case-insensitive, up to 2 trailing chars */
function fuzzyMatch(a: string, b: string): boolean {
  const al = a.toLowerCase(), bl = b.toLowerCase();
  if (al === bl) return true;
  if (Math.abs(al.length - bl.length) > 2) return false;
  const shorter = al.length <= bl.length ? al : bl;
  const longer = al.length > bl.length ? al : bl;
  return longer.startsWith(shorter);
}

function splitWords(text: string): string[] {
  return text.toLowerCase().split(/[>\/,;\s]+/).filter(w => w.length >= 2);
}

const STOP = new Set(['of','and','or','the','for','to','in','by','with','a','an','is','are','was','not','other','than']);

export function selectHeading(
  input: NormalizedInputV3,
  confirmedChapter: number,
  headingsList: { heading: string; description: string }[]
): Step3Output {
  if (headingsList.length === 0) {
    return { confirmed_heading: '', heading_description: '', confidence: 0, matched_by: 'none', subheadings: [] };
  }
  if (headingsList.length === 1) {
    const h = headingsList[0];
    return { confirmed_heading: h.heading, heading_description: h.description, confidence: 1.0, matched_by: 'single', subheadings: getSubs(h.heading) };
  }

  const validHeadings = new Set(headingsList.map(h => h.heading));

  // ── Phase 1: Keyword → Heading lookup ──
  // Collect all input words
  const allInputWords: string[] = [];
  // Category tokens (multi-word phrases first, then individual words)
  const catTokens = input.category_tokens;
  // Build phrases from category: "t-shirts", "cutting boards", "watch bands"
  const catPhrase = catTokens.join(' ');
  allInputWords.push(...splitWords(input.product_name).filter(w => !STOP.has(w)));
  allInputWords.push(...catTokens.filter(w => !STOP.has(w)));
  allInputWords.push(...input.description_tokens.filter(w => w.length > 2 && !STOP.has(w)));
  allInputWords.push(...input.material_keywords);
  allInputWords.push(...input.processing_states);

  // Check multi-word phrases first (e.g. "cutting boards", "building blocks", "citric acid")
  const headingVotes: Map<string, { count: number; sources: string[] }> = new Map();

  function vote(heading: string, source: string) {
    if (!validHeadings.has(heading)) return;
    const existing = headingVotes.get(heading);
    if (existing) { existing.count++; existing.sources.push(source); }
    else { headingVotes.set(heading, { count: 1, sources: [source] }); }
  }

  // Multi-word phrase matching (highest priority)
  const phrases = [catPhrase, input.product_name.toLowerCase()];
  for (const phrase of phrases) {
    for (const [kw, heads] of Object.entries(KEYWORD_TO_HEADINGS)) {
      if (kw.includes(' ') && phrase.includes(kw)) {
        for (const h of heads) vote(h, `phrase:${kw}`);
      }
    }
  }

  // Single word matching
  const dedupedWords = Array.from(new Set(allInputWords));
  for (const word of dedupedWords) {
    // Exact lookup
    const exact = KEYWORD_TO_HEADINGS[word];
    if (exact) {
      for (const h of exact) vote(h, `kw:${word}`);
      continue;
    }
    // Fuzzy lookup (trailing 2 chars)
    for (const [kw, heads] of Object.entries(KEYWORD_TO_HEADINGS)) {
      if (!kw.includes(' ') && fuzzyMatch(word, kw)) {
        for (const h of heads) vote(h, `fuzzy:${word}~${kw}`);
        break;
      }
    }
  }

  // ── Extended keywords lookup (13,449 from 7-country codification) ──
  if (headingVotes.size === 0) {
    const extKw = getExtendedKeywords();
    for (const word of dedupedWords) {
      const extHeads = extKw[word];
      if (extHeads) {
        for (const h of extHeads) vote(h, `ext:${word}`);
      }
    }
  }

  // Pick heading with most votes — with material tiebreaker
  if (headingVotes.size > 0) {
    const sorted = Array.from(headingVotes.entries()).sort((a, b) => b[1].count - a[1].count);

    // If top candidates are tied or close, use material to break tie
    const topScore = sorted[0][1].count;
    const tiedCandidates = sorted.filter(([, v]) => v.count >= topScore - 1); // within 1 vote

    let bestCode = sorted[0][0];

    if (tiedCandidates.length > 1 && input.material_keywords.length > 0) {
      // Check material_hint for each tied candidate
      const conditions = getHeadingConditions(confirmedChapter);
      for (const [code] of tiedCandidates) {
        const cond = conditions.find(c => c.code === code);
        if (cond && cond.material_hint.length > 0) {
          const matMatch = input.material_keywords.some(iw =>
            cond.material_hint.some(mh => fuzzyMatch(iw.toLowerCase(), mh))
          );
          if (matMatch) {
            bestCode = code;
            break;
          }
        }
      }
    }

    const hd = headingsList.find(h => h.heading === bestCode);
    if (hd) {
      const voteInfo = headingVotes.get(bestCode)!;
      const confidence = Math.min(0.5 + voteInfo.count * 0.2, 1.0);
      return {
        confirmed_heading: hd.heading,
        heading_description: hd.description,
        confidence,
        matched_by: `dict(${voteInfo.count}): ${voteInfo.sources.slice(0, 3).join('+')}`,
        subheadings: getSubs(hd.heading),
      };
    }
  }

  // ── Phase 2: Fallback — keyword overlap on heading description ──
  const conditions = getHeadingConditions(confirmedChapter);
  const scored = headingsList.map(hd => {
    const cond = conditions.find(c => c.code === hd.heading);
    const kws = cond?.keywords || [];
    let matchCount = 0;
    for (const iw of dedupedWords) {
      for (const kw of kws) {
        if (fuzzyMatch(iw, kw)) { matchCount++; break; }
      }
    }
    return { heading: hd.heading, description: hd.description, matchCount };
  });
  scored.sort((a, b) => b.matchCount - a.matchCount);
  const best = scored[0];

  return {
    confirmed_heading: best.heading,
    heading_description: best.description,
    confidence: best.matchCount > 0 ? Math.min(0.3 + best.matchCount * 0.1, 0.8) : 0.1,
    matched_by: `fallback_overlap(${best.matchCount})`,
    subheadings: getSubs(best.heading),
    runner_up_heading: scored[1]?.heading,
  };
}

function getSubs(heading: string): { code: string; description: string }[] {
  return getSubheadingConditions(heading).map(s => ({ code: s.code, description: s.description }));
}
