/**
 * GRI Classification Engine — Text Matching Utilities
 * Data file: Steps 4, 6, 8, 11 use these functions for keyword matching.
 */

/**
 * Normalize text into an array of clean words.
 */
export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/**
 * Basic English stemming (no library dependency).
 */
export function stemBasic(word: string): string {
  if (word.length < 4) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ves') && word.length > 4) return word.slice(0, -3) + 'f';
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  return word;
}

/**
 * Synonyms dictionary for HS classification.
 * Maps canonical term → alternative terms that should also match.
 */
const SYNONYMS: Record<string, string[]> = {
  'tshirt': ['shirt', 'tee', 'top', 'singlet', 'tank'],
  'shoe': ['footwear', 'sneaker', 'boot', 'sandal', 'slipper'],
  'phone': ['telephone', 'cellphone', 'mobile', 'smartphone', 'handset'],
  'laptop': ['notebook', 'computer', 'pc'],
  'bag': ['handbag', 'purse', 'satchel', 'tote', 'backpack', 'rucksack'],
  'watch': ['wristwatch', 'timepiece', 'chronometer'],
  'tv': ['television', 'monitor', 'display', 'screen'],
  'car': ['automobile', 'vehicle', 'sedan', 'suv', 'motorcar'],
  'truck': ['lorry', 'pickup', 'van'],
  'bicycle': ['bike', 'cycle'],
  'jewelry': ['jewellery', 'ornament', 'trinket'],
  'toy': ['plaything', 'doll', 'figurine', 'game'],
  'lamp': ['light', 'lantern', 'luminaire', 'fixture'],
  'wire': ['cable', 'cord', 'conductor'],
  'pipe': ['tube', 'tubing', 'conduit'],
  'motor': ['engine', 'drive'],
  'cloth': ['fabric', 'textile', 'material'],
  'garment': ['apparel', 'clothing', 'wear', 'outfit'],
  'knit': ['knitted', 'crocheted', 'jersey'],
  'woven': ['weave', 'wove'],
  'ceramic': ['porcelain', 'earthenware', 'stoneware', 'pottery'],
  'rubber': ['latex', 'elastomer', 'vulcanized'],
  'plastic': ['polymer', 'resin', 'synthetic'],
  'steel': ['iron', 'ferrous', 'stainless'],
  'aluminum': ['aluminium', 'alloy'],
  'copper': ['brass', 'bronze'],
  'leather': ['hide', 'skin', 'suede'],
  'wood': ['timber', 'lumber', 'plywood', 'wooden'],
  'glass': ['crystal', 'glazed', 'vitreous'],
  'paper': ['cardboard', 'paperboard', 'carton'],
  'food': ['edible', 'foodstuff', 'preparation'],
  'chemical': ['compound', 'reagent', 'substance'],
  'medicine': ['pharmaceutical', 'medicament', 'drug'],
  'cosmetic': ['beauty', 'makeup', 'toiletry'],
  'perfume': ['fragrance', 'scent', 'cologne'],
  'furniture': ['furnishing', 'seat', 'chair', 'table', 'desk', 'bed', 'sofa', 'cabinet'],
  'machinery': ['machine', 'apparatus', 'appliance', 'equipment', 'device'],
  'electrical': ['electric', 'electronic', 'electro'],
  'optical': ['optic', 'lens', 'microscope', 'telescope'],
  'musical': ['music', 'instrument'],
  'weapon': ['firearm', 'arm', 'gun', 'rifle'],
  'art': ['painting', 'sculpture', 'artwork'],
  'antique': ['antiquity', 'relic'],
  'flag': ['pennant', 'banner', 'bunting'],
  'lanyard': ['strap', 'cord', 'neck strap'],
  'pesticide': ['insecticide', 'herbicide', 'fungicide', 'biocide'],
};

// Reverse synonym map for quick lookup
const REVERSE_SYNONYMS: Map<string, string> = new Map();
for (const [canonical, alternatives] of Object.entries(SYNONYMS)) {
  for (const alt of alternatives) {
    REVERSE_SYNONYMS.set(alt, canonical);
  }
  REVERSE_SYNONYMS.set(canonical, canonical);
}

/**
 * Expand keywords with synonyms.
 */
export function expandSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>(keywords);

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    // Check if keyword is a synonym
    const canonical = REVERSE_SYNONYMS.get(kwLower);
    if (canonical) {
      expanded.add(canonical);
      const alts = SYNONYMS[canonical];
      if (alts) {
        for (const alt of alts) {
          expanded.add(alt);
        }
      }
    }
    // Check if keyword IS a canonical term
    const alts = SYNONYMS[kwLower];
    if (alts) {
      for (const alt of alts) {
        expanded.add(alt);
      }
    }
  }

  return [...expanded];
}

/**
 * Score how well keywords match a description text.
 * Uses normalization, stemming, synonym expansion, and weighted scoring.
 */
export function scoreMatch(keywords: string[], description: string): number {
  if (!description || keywords.length === 0) return 0;

  const descWords = normalize(description);
  const descStems = descWords.map(stemBasic);
  const descJoined = descWords.join(' ');

  // Expand keywords with synonyms
  const expandedKeywords = expandSynonyms(keywords);

  let score = 0;

  for (const kw of expandedKeywords) {
    const kwLower = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kwLower.length < 2) continue;
    const kwStem = stemBasic(kwLower);

    // Exact word match (weight 3)
    if (descWords.includes(kwLower)) {
      score += 3;
      continue;
    }

    // Stem match (weight 2) — "shirts" matches "shirt"
    if (descStems.includes(kwStem)) {
      score += 2;
      continue;
    }

    // Partial/substring match (weight 1) — "cotton" in "of cotton"
    if (kwLower.length >= 3 && descJoined.includes(kwLower)) {
      score += 1;
      continue;
    }

    // Reverse partial — description word contains keyword or vice versa
    if (kwLower.length >= 4) {
      for (const dw of descWords) {
        if (dw.length >= 4 && (dw.includes(kwLower) || kwLower.includes(dw))) {
          score += 1;
          break;
        }
      }
    }
  }

  // Penalty for "Other" descriptions (catch-all, should be last resort)
  if (descWords[0] === 'other' || descJoined.startsWith('other')) {
    score -= 5;
  }

  // Penalty for "not elsewhere specified"
  if (descJoined.includes('not elsewhere')) {
    score -= 3;
  }

  return score;
}
