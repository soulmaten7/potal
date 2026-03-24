/**
 * POTAL Reverse Matching HS Classification Engine
 *
 * Instead of top-down (product → lookup table → guess),
 * this engine works bottom-up: match product against ALL 95K official
 * tariff descriptions simultaneously, then narrow by conditions.
 *
 * Data source: gov_tariff_schedules (89,842 codes × 7 countries) + HS6 (5,371)
 */

// ─── Types ──────────────────────────────────────────────

export interface ProductInput {
  productName: string;
  description?: string;
  price?: number;
  weight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  material?: string;
  originCountry?: string;
  destinationCountry: string;
}

export interface MatchResult {
  hs10: string;
  hs6: string;
  description: string;
  confidence: number;
  matchedKeywords: string[];
  candidates: CandidateCode[];
  decisionPath: string[];
  method: 'reverse-match';
}

export interface CandidateCode {
  code: string;
  country: string;
  description: string;
  score: number;
  matchedTerms: string[];
  level: number;
}

interface TariffEntry {
  country: string;
  hs_code: string;
  description: string;
  description_lower: string;
  indent: number;
  units: string;
  chapter: string;
  hs6: string;
  tokens: Set<string>;
}

// ─── Keyword Dictionaries ───────────────────────────────

const MATERIAL_MAP: Record<string, string[]> = {
  cotton: ['cotton'],
  polyester: ['polyester'],
  wool: ['wool', 'woolen', 'woollen'],
  silk: ['silk'],
  nylon: ['nylon', 'polyamide'],
  linen: ['linen', 'flax'],
  leather: ['leather', 'hide', 'skin'],
  rubber: ['rubber', 'latex'],
  plastic: ['plastic', 'plastics', 'pvc', 'polyethylene', 'polypropylene'],
  steel: ['steel', 'stainless steel'],
  iron: ['iron', 'cast iron'],
  aluminum: ['aluminum', 'aluminium'],
  copper: ['copper'],
  nickel: ['nickel'],
  wood: ['wood', 'wooden', 'timber'],
  paper: ['paper', 'paperboard', 'cardboard'],
  glass: ['glass'],
  ceramic: ['ceramic', 'porcelain', 'stoneware', 'earthenware'],
  gold: ['gold'],
  silver: ['silver'],
};

const PRODUCT_TYPE_TO_CHAPTERS: Record<string, string[]> = {
  // Animals & animal products
  animal: ['01', '02', '03', '04', '05'],
  meat: ['02', '16'],
  fish: ['03', '16'],
  dairy: ['04'],
  // Vegetable products
  vegetable: ['06', '07', '08', '09', '10', '11', '12', '13', '14'],
  flower: ['06'],
  fruit: ['08', '20'],
  cereal: ['10', '11'],
  coffee: ['09'],
  tea: ['09'],
  spice: ['09'],
  // Food
  food: ['16', '17', '18', '19', '20', '21', '22', '23', '24'],
  sugar: ['17'],
  chocolate: ['18'],
  beverage: ['22'],
  alcohol: ['22'],
  wine: ['22'],
  beer: ['22'],
  whiskey: ['22'],
  tobacco: ['24'],
  // Chemicals
  chemical: ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'],
  pharmaceutical: ['30'],
  cosmetic: ['33'],
  soap: ['34'],
  explosive: ['36'],
  pesticide: ['38'],
  // Plastics & rubber
  plastic_product: ['39'],
  rubber_product: ['40'],
  // Leather & fur
  leather_product: ['41', '42', '43'],
  handbag: ['42'],
  luggage: ['42'],
  // Wood & paper
  wood_product: ['44', '45', '46'],
  furniture_wood: ['44', '94'],
  paper_product: ['47', '48', '49'],
  book: ['49'],
  // Textiles
  textile: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
  silk_fabric: ['50'],
  wool_fabric: ['51'],
  cotton_fabric: ['52'],
  yarn: ['52', '54', '55'],
  fabric: ['54', '55', '56', '58', '59', '60'],
  carpet: ['57'],
  clothing: ['61', '62'],
  jacket: ['61', '62'],
  coat: ['61', '62'],
  shirt: ['61', '62'],
  trousers: ['61', '62'],
  dress: ['61', '62'],
  hat: ['65'],
  // Footwear
  shoe: ['64'],
  footwear: ['64'],
  boot: ['64'],
  // Stone, ceramic, glass
  stone_product: ['68'],
  glass_product: ['70'],
  ceramic_product: ['69'],
  // Metals
  metal: ['72', '73', '74', '75', '76', '78', '79', '80', '81', '82', '83'],
  steel_product: ['72', '73'],
  copper_product: ['74'],
  nickel_product: ['75'],
  aluminum_product: ['76'],
  tool: ['82'],
  cutlery: ['82'],
  // Machinery
  machine: ['84'],
  engine: ['84'],
  pump: ['84'],
  // Electrical
  electrical: ['85'],
  motor: ['85'],
  battery: ['85'],
  // Vehicles
  vehicle: ['86', '87', '88', '89'],
  car: ['87'],
  automobile: ['87'],
  truck: ['87'],
  bicycle: ['87'],
  aircraft: ['88'],
  ship: ['89'],
  // Instruments
  instrument: ['90'],
  medical: ['90'],
  optical: ['90'],
  watch: ['91'],
  clock: ['91'],
  // Miscellaneous
  jewelry: ['71'],
  toy: ['95'],
  game: ['95'],
  sport: ['95'],
  furniture: ['94'],
  lamp: ['94'],
  art: ['97'],
  ornament: ['44', '46', '69', '83'],
};

// ─── Tokenizer ──────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1)
  );
}

function extractBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();
  const arr = Array.from(tokens);
  for (let i = 0; i < arr.length - 1; i++) {
    bigrams.add(`${arr[i]} ${arr[i + 1]}`);
  }
  return bigrams;
}

// ─── Scoring ────────────────────────────────────────────

function scoreMatch(
  productTokens: Set<string>,
  productBigrams: Set<string>,
  entry: TariffEntry,
  chapterBoost: Set<string>,
  materialHint: string | null,
): number {
  let score = 0;
  const matchedTerms: string[] = [];

  // 1. Token overlap (Jaccard-like)
  let overlap = 0;
  for (const token of productTokens) {
    if (entry.tokens.has(token)) {
      overlap++;
      matchedTerms.push(token);
    }
  }
  if (productTokens.size === 0) return 0;
  const tokenScore = overlap / Math.max(productTokens.size, 1);
  score += tokenScore * 40; // max 40 points

  // 2. Bigram matches (more precise)
  const entryText = entry.description_lower;
  let bigramHits = 0;
  for (const bg of productBigrams) {
    if (entryText.includes(bg)) {
      bigramHits++;
    }
  }
  score += Math.min(bigramHits * 5, 20); // max 20 points

  // 3. Chapter relevance boost
  if (chapterBoost.has(entry.chapter)) {
    score += 15;
  }

  // 4. Material match boost
  if (materialHint) {
    const matTerms = MATERIAL_MAP[materialHint] || [materialHint];
    for (const mt of matTerms) {
      if (entryText.includes(mt)) {
        score += 10;
        break;
      }
    }
  }

  // 5. Specificity bonus (longer HS codes are more specific)
  const codeLen = entry.hs_code.replace(/\./g, '').length;
  if (codeLen >= 8) score += 5;
  if (codeLen >= 10) score += 5;

  // 6. Description length penalty (very short = too generic)
  if (entry.description.length < 10) score -= 10;

  return score;
}

// ─── Value/Weight Condition Checker ─────────────────────

function checkValueCondition(description: string, price?: number): boolean {
  if (!price) return true; // No price given, can't filter
  const lower = description.toLowerCase();

  // "valued over $X"
  const overMatch = lower.match(/valued (?:over|exceeding) \$?([\d,.]+)/);
  if (overMatch) {
    const threshold = parseFloat(overMatch[1].replace(/,/g, ''));
    return price > threshold;
  }

  // "valued not over $X"
  const notOverMatch = lower.match(/valued not (?:over|exceeding) \$?([\d,.]+)/);
  if (notOverMatch) {
    const threshold = parseFloat(notOverMatch[1].replace(/,/g, ''));
    return price <= threshold;
  }

  return true;
}

function checkWeightCondition(description: string, weightKg?: number): boolean {
  if (!weightKg) return true;
  const lower = description.toLowerCase();

  const moreMatch = lower.match(/weighing (?:more than|exceeding|over) ([\d,.]+)\s*(?:kg|kilogram)/);
  if (moreMatch) {
    return weightKg > parseFloat(moreMatch[1].replace(/,/g, ''));
  }

  const lessMatch = lower.match(/weighing (?:less than|not (?:more than|exceeding)) ([\d,.]+)\s*(?:kg|kilogram)/);
  if (lessMatch) {
    return weightKg <= parseFloat(lessMatch[1].replace(/,/g, ''));
  }

  return true;
}

// ─── Material Detector ──────────────────────────────────

function detectMaterial(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [material, keywords] of Object.entries(MATERIAL_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return material;
    }
  }
  return null;
}

// ─── Chapter Predictor ──────────────────────────────────

function predictChapters(text: string): Set<string> {
  const lower = text.toLowerCase();
  const chapters = new Set<string>();

  for (const [keyword, chs] of Object.entries(PRODUCT_TYPE_TO_CHAPTERS)) {
    if (lower.includes(keyword)) {
      for (const ch of chs) {
        chapters.add(ch);
      }
    }
  }

  return chapters;
}

// ─── Main Engine ────────────────────────────────────────

export class ReverseMatchEngine {
  private entries: TariffEntry[] = [];
  private entriesByCountry: Map<string, TariffEntry[]> = new Map();
  private loaded = false;

  /**
   * Load tariff schedule data. Call once at startup.
   * Accepts rows from gov_tariff_schedules.
   */
  load(rows: Array<{
    country: string;
    hs_code: string;
    description: string;
    indent?: number;
    units?: string;
  }>) {
    this.entries = rows.map(r => ({
      country: r.country,
      hs_code: r.hs_code,
      description: r.description || '',
      description_lower: (r.description || '').toLowerCase(),
      indent: r.indent || 0,
      units: r.units || '',
      chapter: r.hs_code.substring(0, 2),
      hs6: r.hs_code.substring(0, 6),
      tokens: tokenize(r.description || ''),
    }));

    // Index by country
    this.entriesByCountry.clear();
    for (const entry of this.entries) {
      const list = this.entriesByCountry.get(entry.country) || [];
      list.push(entry);
      this.entriesByCountry.set(entry.country, list);
    }

    this.loaded = true;
  }

  /**
   * Classify a product using reverse matching.
   *
   * Process:
   * 1. Tokenize product name + description
   * 2. Detect material, predict likely chapters
   * 3. Score ALL entries for destination country (or all if unknown)
   * 4. Take top candidates
   * 5. Apply value/weight conditions to narrow
   * 6. Return best match with decision path
   */
  classify(input: ProductInput): MatchResult {
    if (!this.loaded) {
      throw new Error('Engine not loaded. Call load() first.');
    }

    const decisionPath: string[] = [];
    const fullText = [input.productName, input.description || '', input.material || '']
      .join(' ')
      .trim();

    // Step 1: Tokenize
    const tokens = tokenize(fullText);
    const tokenArr = fullText.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 1);
    const bigrams = extractBigrams(tokenArr);
    decisionPath.push(`Tokens: ${tokens.size}, Bigrams: ${bigrams.size}`);

    // Step 2: Detect material and predict chapters
    const materialHint = input.material ? input.material.toLowerCase() : detectMaterial(fullText);
    const chapterHints = predictChapters(fullText);
    if (materialHint) decisionPath.push(`Material detected: ${materialHint}`);
    if (chapterHints.size > 0) decisionPath.push(`Chapter hints: ${Array.from(chapterHints).join(', ')}`);

    // Step 3: Get candidate pool
    const destCountry = input.destinationCountry.toUpperCase();
    let pool = this.entriesByCountry.get(destCountry) || [];

    // If no country-specific data, use US as fallback (largest dataset)
    if (pool.length === 0) {
      pool = this.entriesByCountry.get('US') || this.entries;
      decisionPath.push(`No data for ${destCountry}, using US fallback`);
    }
    decisionPath.push(`Candidate pool: ${pool.length} entries (${destCountry})`);

    // Step 4: Score all entries
    const scored: Array<{ entry: TariffEntry; score: number }> = [];
    for (const entry of pool) {
      // Quick chapter filter: if we have chapter hints, skip non-matching chapters
      // But keep some slack (don't filter if we have few hints)
      if (chapterHints.size > 0 && chapterHints.size <= 10) {
        if (!chapterHints.has(entry.chapter)) continue;
      }

      const score = scoreMatch(tokens, bigrams, entry, chapterHints, materialHint);
      if (score > 10) {
        scored.push({ entry, score });
      }
    }

    // If chapter filter was too aggressive, retry without it
    if (scored.length < 5 && chapterHints.size > 0) {
      decisionPath.push('Chapter filter too aggressive, scoring all entries');
      scored.length = 0;
      for (const entry of pool) {
        const score = scoreMatch(tokens, bigrams, entry, chapterHints, materialHint);
        if (score > 10) {
          scored.push({ entry, score });
        }
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    decisionPath.push(`Scored candidates: ${scored.length}`);

    // Step 5: Apply conditions (value, weight) to top candidates
    let topCandidates = scored.slice(0, 50);

    if (input.price) {
      const beforeFilter = topCandidates.length;
      topCandidates = topCandidates.filter(
        c => checkValueCondition(c.entry.description, input.price)
      );
      if (topCandidates.length < beforeFilter) {
        decisionPath.push(`Value filter: ${beforeFilter} → ${topCandidates.length}`);
      }
    }

    const weightKg = input.weight
      ? input.weightUnit === 'lb' || input.weightUnit === 'oz'
        ? input.weightUnit === 'lb' ? input.weight * 0.4536 : input.weight * 0.02835
        : input.weightUnit === 'g' ? input.weight / 1000 : input.weight
      : undefined;

    if (weightKg) {
      const beforeFilter = topCandidates.length;
      topCandidates = topCandidates.filter(
        c => checkWeightCondition(c.entry.description, weightKg)
      );
      if (topCandidates.length < beforeFilter) {
        decisionPath.push(`Weight filter: ${beforeFilter} → ${topCandidates.length}`);
      }
    }

    // Step 6: Build result
    if (topCandidates.length === 0) {
      // Fallback: return best unfiltered result
      if (scored.length > 0) {
        topCandidates = scored.slice(0, 5);
        decisionPath.push('Condition filters eliminated all candidates, using unfiltered top 5');
      }
    }

    const candidates: CandidateCode[] = topCandidates.slice(0, 10).map(c => ({
      code: c.entry.hs_code,
      country: c.entry.country,
      description: c.entry.description,
      score: Math.round(c.score * 10) / 10,
      matchedTerms: Array.from(tokens).filter(t => c.entry.tokens.has(t)),
      level: c.entry.indent,
    }));

    const best = topCandidates[0];
    if (!best) {
      return {
        hs10: '',
        hs6: '',
        description: 'No match found',
        confidence: 0,
        matchedKeywords: [],
        candidates: [],
        decisionPath: [...decisionPath, 'No candidates found'],
        method: 'reverse-match',
      };
    }

    const maxPossibleScore = 90; // theoretical max
    const confidence = Math.min(best.score / maxPossibleScore, 1);

    // Deduplicate HS6 from top candidates to find consensus
    const hs6Votes = new Map<string, number>();
    for (const c of topCandidates.slice(0, 20)) {
      const hs6 = c.entry.hs6;
      hs6Votes.set(hs6, (hs6Votes.get(hs6) || 0) + c.score);
    }
    const bestHs6 = Array.from(hs6Votes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || best.entry.hs6;

    decisionPath.push(`Best match: ${best.entry.hs_code} (score ${best.score.toFixed(1)})`);
    decisionPath.push(`HS6 consensus: ${bestHs6}`);

    return {
      hs10: best.entry.hs_code,
      hs6: bestHs6,
      description: best.entry.description,
      confidence: Math.round(confidence * 100) / 100,
      matchedKeywords: Array.from(tokens).filter(t => best.entry.tokens.has(t)),
      candidates,
      decisionPath,
      method: 'reverse-match',
    };
  }
}
