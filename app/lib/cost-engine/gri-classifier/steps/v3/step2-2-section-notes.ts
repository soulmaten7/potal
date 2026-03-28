/**
 * v3 Step 2-2 — Section Notes Verification
 * Apply exclusion/inclusion rules from codified Section Notes
 * Resolve essential character cases via category field
 */

import type { NormalizedInputV3, Step2_1_Output, Step2_2_Output } from '../../types';
import { getRulesForSection, matchExclusion } from '../../data/codified-rules';
import { getAllSectionNotes } from '../../data/section-notes';

export function verifySectionWithNotes(
  input: NormalizedInputV3,
  step21: Step2_1_Output
): Step2_2_Output {
  const rulesApplied: { source: string; type: string; action: string }[] = [];
  const excludedSections: { section: number; reason: string }[] = [];

  // Start with top candidate
  let candidates = [...step21.section_candidates];

  // Build input text for rule matching
  const inputText = [
    input.product_name,
    input.material_primary,
    ...input.material_keywords,
    ...input.category_tokens,
    ...input.description_tokens,
    ...input.processing_states,
  ].join(' ');

  // Apply exclusion rules for each candidate section
  for (const candidate of candidates) {
    const rules = getRulesForSection(candidate.section);
    const exclusionResult = matchExclusion(inputText, rules);

    if (exclusionResult.matched && exclusionResult.rule) {
      excludedSections.push({
        section: candidate.section,
        reason: `Excluded by ${exclusionResult.rule.source}: ${exclusionResult.rule.original_text?.substring(0, 100) || ''}`,
      });
      rulesApplied.push({
        source: exclusionResult.rule.source,
        type: 'exclusion',
        action: `Excluded Section ${candidate.section}`,
      });
      candidate.score = 0; // Mark for removal
    }
  }

  // Remove excluded
  candidates = candidates.filter(c => c.score > 0);

  // If all excluded, use redirect targets from exclusion rules
  if (candidates.length === 0 && excludedSections.length > 0) {
    // Fallback: look at section candidates from step 2-1 that weren't excluded
    const allSections = getAllSectionNotes();
    for (const s of allSections) {
      if (!excludedSections.find(e => e.section === s.section_number) && s.note_length > 0) {
        const chFrom = parseInt(s.chapter_from, 10);
        const chTo = parseInt(s.chapter_to, 10);
        const chapters: number[] = [];
        for (let c = chFrom; c <= chTo; c++) chapters.push(c);
        candidates.push({
          section: s.section_number,
          title: s.title,
          score: 0.3,
          matched_by: 'fallback_after_exclusion',
          chapters,
        });
      }
    }
  }

  // Pick confirmed section (highest score remaining)
  const confirmed = candidates[0];
  if (!confirmed) {
    // Ultimate fallback
    return {
      confirmed_section: 0,
      section_title: 'Unknown',
      chapters_in_section: [],
      chapter_hints: [],
      rules_applied: rulesApplied,
      excluded_sections: excludedSections,
    };
  }

  // Generate chapter hints from input
  const chapterHints = generateChapterHints(input, confirmed.section, confirmed.chapters);

  return {
    confirmed_section: confirmed.section,
    section_title: confirmed.title,
    chapters_in_section: confirmed.chapters,
    chapter_hints: chapterHints,
    rules_applied: rulesApplied,
    excluded_sections: excludedSections,
  };
}

/** Generate hints about which chapter within the section to focus on */
function generateChapterHints(
  input: NormalizedInputV3,
  section: number,
  chapters: number[]
): { chapter: number; reason: string }[] {
  const hints: { chapter: number; reason: string }[] = [];

  // Section-specific hints based on input fields
  switch (section) {
    case 1: // Live animals; animal products
      // Material-specific hints FIRST (highest priority)
      if (input.material_keywords.some(m => ['fish', 'shrimp', 'seafood'].includes(m)))
        hints.push({ chapter: 3, reason: 'material=fish/seafood → Ch.3' });
      if (input.material_keywords.includes('dairy'))
        hints.push({ chapter: 4, reason: 'material=dairy → Ch.4' });
      if (input.material_keywords.includes('meat') || input.material_keywords.includes('poultry'))
        hints.push({ chapter: 2, reason: 'material=meat/poultry → Ch.2' });
      // Processing-based hints (lower priority)
      if (input.processing_states.includes('live')) hints.push({ chapter: 1, reason: 'processing=live → Ch.1' });
      if (!hints.length && (input.processing_states.includes('fresh') || input.processing_states.includes('frozen')))
        hints.push({ chapter: 2, reason: 'processing=fresh/frozen → Ch.2 (meat default)' });
      // Ch.5: other animal products (hair, bone, ivory, coral, sponge)
      if (input.category_tokens.some(t => ['bone', 'hair', 'ivory', 'coral', 'sponge', 'feather', 'horn', 'antler'].includes(t)))
        hints.push({ chapter: 5, reason: 'other animal product → Ch.5' });
      break;

    case 11: { // Textiles
      // Garment chapters (61/62) take PRIORITY over raw material chapters (50-55)
      // because a "cotton t-shirt" is a garment (Ch.61), not raw cotton (Ch.52)
      const isClothing = input.category_tokens.some(t =>
        ['clothing', 'garment', 'apparel', 'shirt', 'dress', 'sweater', 'knitwear',
         'jacket', 'pants', 'skirt', 'blouse', 'coat', 'hoodie', 'underwear',
         'women', 'men', 'children', 'baby'].includes(t)
      );
      const isKnitted = input.processing_states.includes('knitted') || input.processing_states.includes('crocheted');
      const isWoven = input.processing_states.includes('woven');
      const nameLower = input.product_name.toLowerCase();
      const nameHasGarment = /\b(shirt|dress|pants|jacket|sweater|coat|blouse|skirt|hoodie|vest|suit|shorts|trouser|underwear|sock|glove|scarf|hat|cap)\b/.test(nameLower);

      if (isKnitted && (isClothing || nameHasGarment)) {
        hints.push({ chapter: 61, reason: 'knitted + clothing → Ch.61 (garments)' });
      } else if (isWoven && (isClothing || nameHasGarment)) {
        hints.push({ chapter: 62, reason: 'woven + clothing → Ch.62 (garments)' });
      } else if (isClothing || nameHasGarment) {
        // Clothing but no specific processing → check name
        if (isKnitted || nameLower.includes('knit') || nameLower.includes('t-shirt') || nameLower.includes('tee') || nameLower.includes('sweater') || nameLower.includes('hoodie'))
          hints.push({ chapter: 61, reason: 'clothing + knit indicators → Ch.61' });
        else
          hints.push({ chapter: 62, reason: 'clothing default → Ch.62 (woven garments)' });
      } else if (isKnitted) {
        hints.push({ chapter: 60, reason: 'knitted fabric (not garment) → Ch.60' });
      }

      // Raw material chapters — only if NOT garment
      if (!isClothing && !nameHasGarment) {
        if (input.material_primary === 'cotton')
          hints.push({ chapter: 52, reason: 'material=cotton (raw/yarn/fabric) → Ch.52' });
        if (input.material_primary === 'silk')
          hints.push({ chapter: 50, reason: 'material=silk → Ch.50' });
        if (input.material_primary === 'wool')
          hints.push({ chapter: 51, reason: 'material=wool → Ch.51' });
      }
      break;
    }

    case 15: // Base metals
      if (input.material_primary === 'steel' || input.material_primary === 'iron') {
        // Category-based: fasteners/bolts/nuts → always Ch.73 (articles)
        const isFastener = input.category_tokens.some(t => ['fasteners', 'fastener', 'bolts', 'bolt', 'nuts', 'nut', 'screws', 'screw', 'hardware'].includes(t));
        const isArticle = input.category_tokens.some(t => ['tools', 'tool', 'cutlery', 'cookware', 'kitchenware'].includes(t));
        if (isFastener || isArticle) {
          hints.push({ chapter: 73, reason: 'category=fastener/article → Ch.73' });
        } else if (input.processing_states.some(p => ['raw', 'rolled', 'hot rolled', 'cold rolled'].includes(p)) && !isFastener) {
          hints.push({ chapter: 72, reason: 'steel/iron semi-finished → Ch.72' });
        } else {
          hints.push({ chapter: 73, reason: 'steel/iron articles → Ch.73' });
        }
      }
      if (input.material_primary === 'copper')
        hints.push({ chapter: 74, reason: 'material=copper → Ch.74' });
      if (input.material_primary === 'nickel')
        hints.push({ chapter: 75, reason: 'material=nickel → Ch.75' });
      if (input.material_primary === 'aluminum')
        hints.push({ chapter: 76, reason: 'material=aluminum → Ch.76' });
      if (input.material_primary === 'lead')
        hints.push({ chapter: 78, reason: 'material=lead → Ch.78' });
      // Ch.82 Tools/cutlery, Ch.83 Misc metal articles
      if (input.category_tokens.some(t => ['knife', 'knives', 'blade', 'scissors', 'razor', 'saw', 'file', 'pliers', 'wrench', 'spanner', 'cutlery', 'fork', 'spoon'].includes(t)))
        hints.push({ chapter: 82, reason: 'tool/cutlery → Ch.82' });
      if (input.category_tokens.some(t => ['lock', 'padlock', 'key', 'safe', 'sign', 'nameplate', 'clasp', 'buckle', 'hook', 'staple'].includes(t)))
        hints.push({ chapter: 83, reason: 'lock/sign/misc metal → Ch.83' });
      break;

    case 16: { // Machinery (Ch.84) vs Electrical (Ch.85)
      const isElectrical = input.category_tokens.some(t =>
        ['electronic', 'electronics', 'electrical', 'phone', 'phones', 'cable', 'cables',
         'battery', 'batteries', 'led', 'charger', 'chargers', 'headphones', 'earbuds',
         'earphones', 'speaker', 'speakers', 'audio', 'monitor', 'monitors', 'tv',
         'television', 'camera', 'cameras', 'lamp', 'lamps', 'lighting'].includes(t)
      );
      const nameLower = input.product_name.toLowerCase();
      const nameIsElectrical = /\b(earbuds?|headphones?|speaker|bluetooth|wireless|charger|cable|led|monitor|tv|camera|battery|phone)\b/.test(nameLower);

      // Ch.84: computers, printers, machinery — takes priority over generic "electronics"
      const isCh84 = input.category_tokens.some(t =>
        ['computer', 'computers', 'laptop', 'laptops', 'printer', 'printers', 'server', 'servers',
         'copier', 'scanner', 'air conditioner', 'refrigerator', 'washing machine', 'dishwasher',
         'machine', 'machinery', 'engine', 'pump', 'compressor', 'turbine', 'boiler'].includes(t)
      ) || /\b(laptop|computer|notebook|server|printer|copier|scanner|washing machine|dishwasher|air conditioner|refrigerator|freezer)\b/.test(nameLower);

      if (isCh84) {
        hints.push({ chapter: 84, reason: 'computer/machinery/appliance → Ch.84' });
      } else if (isElectrical || nameIsElectrical) {
        hints.push({ chapter: 85, reason: 'electrical/electronic → Ch.85' });
      } else {
        // Appliances with motors → Ch.85 if electric, Ch.84 if mechanical
        const isMotorAppliance = input.category_tokens.some(t =>
          ['blender', 'blenders', 'mixer', 'mixers', 'juicer', 'juicers',
           'processor', 'grinder', 'vacuum'].includes(t)
        );
        if (isMotorAppliance) {
          hints.push({ chapter: 85, reason: 'electric appliance with motor → Ch.85' });
        } else {
          hints.push({ chapter: 84, reason: 'machinery/mechanical → Ch.84' });
        }
      }
      break;
    }

    case 6: { // Chemical (Ch.28-38)
      const isMedicine = input.category_tokens.some(t =>
        ['medications', 'medicine', 'medicines', 'pharmaceutical', 'pharmaceuticals',
         'pharmacy', 'health', 'otc', 'pain', 'relief', 'drug', 'drugs', 'tablet', 'tablets'].includes(t)
      );
      const isOrganic = input.category_tokens.some(t =>
        ['acid', 'acids', 'organic', 'compound', 'compounds'].includes(t)
      );
      const nameLower = input.product_name.toLowerCase();
      const nameIsMedicine = /\b(ibuprofen|paracetamol|aspirin|tablet|capsule|medicine|vitamin|supplement)\b/.test(nameLower);

      const s6Toks = [...input.category_tokens, ...input.description_tokens];
      if (isMedicine || nameIsMedicine)
        hints.push({ chapter: 30, reason: 'pharmaceutical/medicine → Ch.30' });
      else if (s6Toks.some(t => ['fertilizer', 'fertiliser', 'npk', 'urea', 'ammonia', 'nitrate'].includes(t)))
        hints.push({ chapter: 31, reason: 'fertilizer → Ch.31' });
      else if (s6Toks.some(t => ['dye', 'pigment', 'paint', 'varnish', 'ink', 'tanning', 'color', 'colour'].includes(t)))
        hints.push({ chapter: 32, reason: 'dye/paint/tanning → Ch.32' });
      else if (s6Toks.some(t => ['perfume', 'cosmetic', 'cosmetics', 'lipstick', 'makeup', 'shampoo', 'deodorant', 'essential oil', 'fragrance', 'lotion', 'cream', 'skincare'].includes(t))
        || /\b(perfume|lipstick|mascara|shampoo|conditioner|sunscreen|moisturizer|serum)\b/.test(nameLower))
        hints.push({ chapter: 33, reason: 'cosmetic/perfume → Ch.33' });
      else if (s6Toks.some(t => ['soap', 'detergent', 'candle', 'wax', 'polish', 'cleaning'].includes(t)))
        hints.push({ chapter: 34, reason: 'soap/detergent/candle → Ch.34' });
      else if (s6Toks.some(t => ['glue', 'adhesive', 'gelatin', 'enzyme', 'casein'].includes(t)))
        hints.push({ chapter: 35, reason: 'glue/adhesive/enzyme → Ch.35' });
      else if (s6Toks.some(t => ['explosive', 'firework', 'match', 'pyrotechnic'].includes(t)))
        hints.push({ chapter: 36, reason: 'explosive/firework → Ch.36' });
      else if (s6Toks.some(t => ['photographic', 'film', 'developer', 'photosensitive'].includes(t)))
        hints.push({ chapter: 37, reason: 'photographic → Ch.37' });
      else if (s6Toks.some(t => ['insecticide', 'herbicide', 'pesticide', 'disinfectant', 'antifreeze', 'solvent', 'reagent'].includes(t)))
        hints.push({ chapter: 38, reason: 'misc chemical product → Ch.38' });
      else if (isOrganic || /\b(citric|acetic|lactic|formic|oxalic|tartaric)\b/.test(nameLower))
        hints.push({ chapter: 29, reason: 'organic acid/compound → Ch.29' });
      else
        hints.push({ chapter: 28, reason: 'inorganic chemical default → Ch.28' });
      break;
    }

    case 13: // Stone, ceramic, glass
      if (input.material_keywords.some(m => ['ceramic', 'stoneware', 'porcelain', 'earthenware'].includes(m)))
        hints.push({ chapter: 69, reason: 'material=ceramic/stoneware → Ch.69' });
      if (input.material_keywords.includes('glass'))
        hints.push({ chapter: 70, reason: 'material=glass → Ch.70' });
      if (input.material_keywords.includes('stone') && !input.material_keywords.some(m => ['ceramic','stoneware','porcelain'].includes(m)))
        hints.push({ chapter: 68, reason: 'material=stone → Ch.68' });
      break;

    case 18: // Optical, medical, musical, watches
      if (input.category_tokens.some(t => ['watch', 'watches', 'clock', 'timepiece'].includes(t)))
        hints.push({ chapter: 91, reason: 'category=watch/clock → Ch.91' });
      if (input.category_tokens.some(t => ['optical', 'lens', 'microscope', 'telescope'].includes(t)))
        hints.push({ chapter: 90, reason: 'category=optical → Ch.90' });
      if (input.category_tokens.some(t => ['medical', 'surgical', 'prosthetic'].includes(t)))
        hints.push({ chapter: 90, reason: 'category=medical → Ch.90' });
      if (input.category_tokens.some(t => ['musical', 'instrument', 'piano', 'guitar', 'violin'].includes(t)))
        hints.push({ chapter: 92, reason: 'category=musical → Ch.92' });
      break;

    case 20: // Misc manufactured
      if (input.category_tokens.some(t => ['toy', 'toys', 'game', 'games', 'doll', 'puzzle'].includes(t)))
        hints.push({ chapter: 95, reason: 'category=toys → Ch.95' });
      if (input.category_tokens.some(t => ['furniture', 'chair', 'table', 'desk', 'sofa', 'bed', 'mattress', 'lamp'].includes(t)))
        hints.push({ chapter: 94, reason: 'category=furniture → Ch.94' });
      if (input.category_tokens.some(t => ['brush', 'pen', 'pencil', 'button', 'lighter', 'comb'].includes(t)))
        hints.push({ chapter: 96, reason: 'category=misc articles → Ch.96' });
      break;

    case 17: // Vehicles
      if (input.category_tokens.includes('bicycle'))
        hints.push({ chapter: 87, reason: 'bicycle → Ch.87' });
      if (input.category_tokens.some(t => ['car', 'vehicle', 'truck', 'motorcycle'].includes(t)))
        hints.push({ chapter: 87, reason: 'motor vehicle → Ch.87' });
      if (input.category_tokens.some(t => ['ship', 'boat'].includes(t)))
        hints.push({ chapter: 89, reason: 'ship/boat → Ch.89' });
      if (input.category_tokens.includes('aircraft'))
        hints.push({ chapter: 88, reason: 'aircraft → Ch.88' });
      if (input.category_tokens.some(t => ['railway', 'locomotive', 'train', 'tramway'].includes(t)))
        hints.push({ chapter: 86, reason: 'railway/locomotive → Ch.86' });
      break;

    case 2: { // Vegetable products (Ch.06-14)
      const nm = input.product_name.toLowerCase();
      const toks = [...input.category_tokens, ...input.description_tokens];
      if (toks.some(t => ['flower', 'plant', 'bulb', 'seedling', 'foliage'].includes(t)))
        hints.push({ chapter: 6, reason: 'live plant/flower → Ch.06' });
      if (toks.some(t => ['vegetable', 'potato', 'tomato', 'onion', 'garlic', 'carrot', 'lettuce', 'cabbage', 'pepper', 'mushroom', 'legume'].includes(t)))
        hints.push({ chapter: 7, reason: 'edible vegetable → Ch.07' });
      if (toks.some(t => ['fruit', 'apple', 'banana', 'orange', 'grape', 'berry', 'melon', 'mango', 'nut', 'almond', 'walnut', 'cashew', 'pistachio', 'coconut', 'avocado'].includes(t)))
        hints.push({ chapter: 8, reason: 'fruit/nut → Ch.08' });
      if (toks.some(t => ['coffee', 'tea', 'spice', 'pepper', 'cinnamon', 'ginger', 'turmeric', 'vanilla', 'clove', 'saffron'].includes(t)) || nm.includes('tea') || nm.includes('coffee'))
        hints.push({ chapter: 9, reason: 'coffee/tea/spice → Ch.09' });
      if (toks.some(t => ['cereal', 'rice', 'wheat', 'corn', 'maize', 'barley', 'oat', 'rye', 'millet', 'sorghum'].includes(t)))
        hints.push({ chapter: 10, reason: 'cereal/grain → Ch.10' });
      if (toks.some(t => ['flour', 'starch', 'malt', 'gluten', 'inulin'].includes(t)))
        hints.push({ chapter: 11, reason: 'flour/starch/malt → Ch.11' });
      if (toks.some(t => ['seed', 'oilseed', 'soybean', 'sunflower', 'rapeseed', 'linseed', 'sesame', 'hop'].includes(t)))
        hints.push({ chapter: 12, reason: 'oil seed → Ch.12' });
      if (toks.some(t => ['gum', 'resin', 'lac', 'shellac'].includes(t)))
        hints.push({ chapter: 13, reason: 'gum/resin → Ch.13' });
      if (toks.some(t => ['rattan', 'reed', 'rush', 'plaiting'].includes(t)))
        hints.push({ chapter: 14, reason: 'vegetable plaiting → Ch.14' });
      break;
    }

    case 4: { // Prepared foodstuffs (Ch.16-24)
      const toks = [...input.category_tokens, ...input.description_tokens];
      const nm = input.product_name.toLowerCase();
      if (toks.some(t => ['sausage', 'canned meat', 'meat preparation', 'canned fish', 'sardine', 'tuna'].includes(t)))
        hints.push({ chapter: 16, reason: 'meat/fish preparation → Ch.16' });
      if (toks.some(t => ['sugar', 'confectionery', 'candy', 'caramel', 'molasses', 'syrup'].includes(t)))
        hints.push({ chapter: 17, reason: 'sugar/confectionery → Ch.17' });
      if (toks.some(t => ['cocoa', 'chocolate'].includes(t)) || nm.includes('chocolate') || nm.includes('cocoa'))
        hints.push({ chapter: 18, reason: 'cocoa/chocolate → Ch.18' });
      if (toks.some(t => ['bakery', 'bread', 'biscuit', 'pasta', 'cereal preparation', 'pastry', 'cake', 'noodle', 'cookie', 'cracker'].includes(t)))
        hints.push({ chapter: 19, reason: 'bakery/cereal preparation → Ch.19' });
      if (toks.some(t => ['jam', 'juice', 'sauce', 'ketchup', 'pickle', 'canned vegetable', 'canned fruit', 'preserved'].includes(t)))
        hints.push({ chapter: 20, reason: 'vegetable/fruit preparation → Ch.20' });
      if (toks.some(t => ['seasoning', 'condiment', 'yeast', 'supplement', 'protein powder', 'food supplement'].includes(t)))
        hints.push({ chapter: 21, reason: 'misc food preparation → Ch.21' });
      if (toks.some(t => ['beverage', 'beer', 'wine', 'spirit', 'whisky', 'vodka', 'rum', 'soda', 'mineral water', 'energy drink', 'juice'].includes(t)) || nm.includes('beer') || nm.includes('wine'))
        hints.push({ chapter: 22, reason: 'beverage/alcohol → Ch.22' });
      if (toks.some(t => ['animal feed', 'dog food', 'cat food', 'pet food', 'bran', 'residue'].includes(t)))
        hints.push({ chapter: 23, reason: 'animal feed/residue → Ch.23' });
      if (toks.some(t => ['tobacco', 'cigar', 'cigarette', 'vape', 'smoking'].includes(t)) || nm.includes('tobacco') || nm.includes('cigarette'))
        hints.push({ chapter: 24, reason: 'tobacco → Ch.24' });
      break;
    }

    case 5: // Mineral products (Ch.25-27)
      if (input.category_tokens.some(t => ['salt', 'sulfur', 'earth', 'stone', 'gravel', 'sand', 'cement', 'lime', 'plaster'].includes(t)) || input.material_keywords.some(m => ['salt', 'cement', 'stone', 'sand', 'chalk'].includes(m)))
        hints.push({ chapter: 25, reason: 'salt/stone/cement → Ch.25' });
      if (input.category_tokens.some(t => ['ore', 'slag', 'ash', 'manganese', 'chromium'].includes(t)))
        hints.push({ chapter: 26, reason: 'ore/slag/ash → Ch.26' });
      if (input.category_tokens.some(t => ['petroleum', 'oil', 'coal', 'gas', 'bitumen', 'fuel', 'kerosene', 'diesel', 'gasoline', 'natural gas', 'propane'].includes(t)) || input.material_keywords.some(m => ['petroleum', 'coal'].includes(m)))
        hints.push({ chapter: 27, reason: 'mineral fuel/petroleum → Ch.27' });
      break;

    case 8: // Hides/leather (Ch.41-43)
      if (input.processing_states.some(p => ['raw', 'tanned', 'crust'].includes(p)) || input.category_tokens.some(t => ['rawhide', 'tanned'].includes(t)))
        hints.push({ chapter: 41, reason: 'raw hide/tanned leather → Ch.41' });
      if (input.category_tokens.some(t => ['handbag', 'handbags', 'bag', 'bags', 'purse', 'wallet', 'luggage', 'suitcase', 'briefcase', 'backpack', 'saddlery', 'harness', 'belt'].includes(t)))
        hints.push({ chapter: 42, reason: 'leather article/bag → Ch.42' });
      if (input.material_keywords.some(m => ['fur', 'furskin', 'mink', 'fox'].includes(m)) || input.category_tokens.some(t => ['fur', 'furskin'].includes(t)))
        hints.push({ chapter: 43, reason: 'furskin/fur article → Ch.43' });
      if (!hints.length && input.material_primary === 'leather')
        hints.push({ chapter: 42, reason: 'leather default → Ch.42 (articles)' });
      break;

    case 9: // Wood/cork (Ch.44-46)
      if (input.material_keywords.includes('cork') || input.category_tokens.includes('cork'))
        hints.push({ chapter: 45, reason: 'cork → Ch.45' });
      if (input.category_tokens.some(t => ['basket', 'rattan', 'bamboo', 'wickerwork', 'plaiting', 'straw'].includes(t)))
        hints.push({ chapter: 46, reason: 'basketware/plaiting → Ch.46' });
      if (!hints.length)
        hints.push({ chapter: 44, reason: 'wood default → Ch.44' });
      break;

    case 10: // Paper (Ch.47-49)
      if (input.category_tokens.some(t => ['pulp', 'cellulose'].includes(t)))
        hints.push({ chapter: 47, reason: 'wood pulp → Ch.47' });
      if (input.category_tokens.some(t => ['book', 'books', 'newspaper', 'magazine', 'printing', 'printed', 'poster', 'calendar', 'map', 'card', 'postcard'].includes(t)))
        hints.push({ chapter: 49, reason: 'printed matter/book → Ch.49' });
      if (!hints.length)
        hints.push({ chapter: 48, reason: 'paper/paperboard default → Ch.48' });
      break;

    case 12: // Footwear/headgear (Ch.64-67)
      if (input.category_tokens.some(t => ['footwear', 'shoe', 'shoes', 'boot', 'boots', 'sandal', 'sandals', 'sneaker', 'sneakers', 'slipper'].includes(t)))
        hints.push({ chapter: 64, reason: 'footwear → Ch.64' });
      if (input.category_tokens.some(t => ['hat', 'cap', 'headgear', 'headwear', 'beret', 'helmet', 'bonnet'].includes(t)))
        hints.push({ chapter: 65, reason: 'headgear → Ch.65' });
      if (input.category_tokens.some(t => ['umbrella', 'parasol', 'walking stick', 'cane'].includes(t)))
        hints.push({ chapter: 66, reason: 'umbrella → Ch.66' });
      if (input.category_tokens.some(t => ['feather', 'artificial flower', 'wig'].includes(t)))
        hints.push({ chapter: 67, reason: 'feather/artificial flower → Ch.67' });
      if (!hints.length && input.material_primary === 'leather')
        hints.push({ chapter: 64, reason: 'leather in S12 → Ch.64 (footwear)' });
      break;
  }

  return hints;
}
