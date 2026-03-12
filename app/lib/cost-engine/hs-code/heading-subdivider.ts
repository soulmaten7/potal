/**
 * POTAL HS Heading Subdivider
 *
 * When multiple HS6 codes share the same HS4 heading, this module uses
 * product attributes (material, composition, gender) to pick the correct
 * subheading suffix.
 *
 * HS subheading patterns (last 2 digits of HS6):
 * - Textiles (Ch.50-63): suffix by material (10=wool, 20=cotton, 30=synthetic, 90=other)
 * - Metals (Ch.72-83): suffix by form/alloy
 * - Others: suffix by use, size, or type
 *
 * Fallback: if no attribute match, returns the "90" (other) variant if it exists.
 */

// ─── Material Detection ──────────────────────────

const MATERIAL_PATTERNS: { pattern: RegExp; suffixes: string[]; priority: number }[] = [
  // Natural fibers
  { pattern: /\b(wool|merino|cashmere|alpaca|mohair|angora)\b/i, suffixes: ['10', '11'], priority: 10 },
  { pattern: /\b(cotton|100%?\s*cotton)\b/i, suffixes: ['20', '10'], priority: 10 },
  { pattern: /\b(linen|flax|hemp|ramie|jute)\b/i, suffixes: ['30', '90'], priority: 8 },
  { pattern: /\b(silk|mulberry\s*silk)\b/i, suffixes: ['10', '19'], priority: 9 },

  // Synthetic/man-made fibers
  { pattern: /\b(polyester|nylon|acrylic|spandex|elastane|lycra|rayon|viscose|modal|synthetic)\b/i, suffixes: ['20', '30'], priority: 9 },
  { pattern: /\b(man[- ]?made\s*(fiber|fibre)s?)\b/i, suffixes: ['20', '30'], priority: 8 },

  // Leather
  { pattern: /\b(leather|suede|nubuck|full[- ]?grain)\b/i, suffixes: ['10', '11', '20'], priority: 10 },
  { pattern: /\b(artificial|faux|synthetic|pu)\s*(leather)\b/i, suffixes: ['20', '90'], priority: 9 },
  { pattern: /\b(rubber|plastic|pvc|eva)\b/i, suffixes: ['90', '99'], priority: 7 },

  // Metals
  { pattern: /\b(stainless\s*steel)\b/i, suffixes: ['10', '20'], priority: 10 },
  { pattern: /\b(iron|cast\s*iron|steel)\b/i, suffixes: ['10', '20'], priority: 9 },
  { pattern: /\b(aluminum|aluminium)\b/i, suffixes: ['10', '30'], priority: 9 },
  { pattern: /\b(copper|brass|bronze)\b/i, suffixes: ['10', '20'], priority: 9 },
  { pattern: /\b(titanium)\b/i, suffixes: ['30', '90'], priority: 8 },

  // Wood
  { pattern: /\b(bamboo)\b/i, suffixes: ['10', '11'], priority: 9 },
  { pattern: /\b(oak|pine|walnut|maple|birch|teak|mahogany|wood|wooden)\b/i, suffixes: ['10', '20'], priority: 8 },
  { pattern: /\b(plywood|particle\s*board|mdf|fibreboard)\b/i, suffixes: ['30', '90'], priority: 8 },

  // Glass/Ceramic
  { pattern: /\b(glass|crystal|tempered\s*glass)\b/i, suffixes: ['10', '20'], priority: 9 },
  { pattern: /\b(ceramic|porcelain|stoneware|earthenware)\b/i, suffixes: ['10', '11', '20'], priority: 9 },

  // Plastics
  { pattern: /\b(polypropylene|pp)\b/i, suffixes: ['10', '20'], priority: 8 },
  { pattern: /\b(polyethylene|pe|hdpe|ldpe)\b/i, suffixes: ['10', '20'], priority: 8 },
  { pattern: /\b(silicone)\b/i, suffixes: ['30', '90'], priority: 8 },
  { pattern: /\b(abs|polycarbonate|acetal)\b/i, suffixes: ['90', '99'], priority: 7 },
];

// ─── Gender Detection ────────────────────────────

const GENDER_PATTERNS: { pattern: RegExp; genderSuffix: string }[] = [
  { pattern: /\b(men'?s?|boys?|male|masculine)\b/i, genderSuffix: 'M' },
  { pattern: /\b(women'?s?|girls?|ladies|female|feminine)\b/i, genderSuffix: 'F' },
  { pattern: /\b(unisex|kids?|children'?s?|infant'?s?|baby|toddler)\b/i, genderSuffix: 'U' },
];

// ─── HS Suffix Conventions by Chapter ─────────────

/**
 * Common HS6 suffix patterns for textile chapters (50-63).
 * Last 2 digits typically indicate material composition.
 */
const TEXTILE_MATERIAL_SUFFIXES: Record<string, string[]> = {
  '10': ['wool', 'fine animal hair', 'cashmere', 'silk'],
  '11': ['wool', 'fine animal hair'],
  '12': ['cashmere'],
  '19': ['other animal hair'],
  '20': ['cotton', 'man-made fibers', 'synthetic'],
  '21': ['cotton'],
  '22': ['man-made fibers', 'synthetic'],
  '23': ['synthetic fibers'],
  '29': ['other man-made'],
  '30': ['synthetic fibers', 'man-made fibers', 'linen'],
  '31': ['wool', 'cotton'],
  '32': ['cotton'],
  '33': ['synthetic'],
  '39': ['other'],
  '40': ['artificial fibers'],
  '90': ['other textile materials', 'mixed', 'other'],
  '99': ['other', 'not elsewhere specified'],
};

// ─── Main Subdivider ─────────────────────────────

interface SubdivisionResult {
  /** Best matching HS6 code */
  bestCode: string;
  /** Why this subheading was chosen */
  reason: string;
  /** Confidence boost (0-0.2) */
  confidenceBoost: number;
}

/**
 * Given multiple HS6 candidates sharing the same HS4 heading,
 * pick the best subheading based on product attributes.
 *
 * @param candidates - Array of HS6 codes (same heading)
 * @param productName - Product name/description for attribute extraction
 * @returns Best matching code with reason
 */
export function subdivideHeading(
  candidates: { code: string; description: string; score: number }[],
  productName: string,
): SubdivisionResult | null {
  if (candidates.length <= 1) return null;

  // All candidates must share the same HS4 heading
  const heading = candidates[0].code.slice(0, 4);
  const chapter = parseInt(heading.slice(0, 2), 10);
  const samePrefixCandidates = candidates.filter(c => c.code.startsWith(heading));
  if (samePrefixCandidates.length <= 1) return null;

  const productLower = productName.toLowerCase();

  // Strategy 1: Material-based subdivision (textiles, metals, wood, etc.)
  const materialMatch = findMaterialMatch(productLower, samePrefixCandidates, chapter);
  if (materialMatch) return materialMatch;

  // Strategy 2: Gender-based subdivision (apparel chapters 61-62)
  if (chapter >= 61 && chapter <= 62) {
    const genderMatch = findGenderMatch(productLower, samePrefixCandidates);
    if (genderMatch) return genderMatch;
  }

  // Strategy 3: Description keyword overlap
  const descMatch = findDescriptionMatch(productLower, samePrefixCandidates);
  if (descMatch) return descMatch;

  // Strategy 4: Prefer "90/99" (other) suffix as safe fallback
  const otherCode = samePrefixCandidates.find(c => {
    const suffix = c.code.slice(4);
    return suffix === '90' || suffix === '99';
  });
  if (otherCode) {
    return {
      bestCode: otherCode.code,
      reason: 'fallback to "Other" subheading',
      confidenceBoost: 0,
    };
  }

  return null;
}

// ─── Strategy Implementations ─────────────────────

function findMaterialMatch(
  productLower: string,
  candidates: { code: string; description: string; score: number }[],
  chapter: number,
): SubdivisionResult | null {
  // Find materials mentioned in product name
  const detectedMaterials: { suffixes: string[]; priority: number; name: string }[] = [];

  for (const mp of MATERIAL_PATTERNS) {
    const match = productLower.match(mp.pattern);
    if (match) {
      detectedMaterials.push({
        suffixes: mp.suffixes,
        priority: mp.priority,
        name: match[0],
      });
    }
  }

  if (detectedMaterials.length === 0) return null;

  // Sort by priority (highest first)
  detectedMaterials.sort((a, b) => b.priority - a.priority);
  const bestMaterial = detectedMaterials[0];

  // Find candidate whose suffix matches the detected material
  for (const suffix of bestMaterial.suffixes) {
    const match = candidates.find(c => c.code.slice(4) === suffix);
    if (match) {
      return {
        bestCode: match.code,
        reason: `material "${bestMaterial.name}" → suffix ${suffix}`,
        confidenceBoost: 0.15,
      };
    }
  }

  // For textile chapters, also check description for material keywords
  if (chapter >= 50 && chapter <= 63) {
    for (const suffix of bestMaterial.suffixes) {
      const materialTerms = TEXTILE_MATERIAL_SUFFIXES[suffix];
      if (materialTerms) {
        const match = candidates.find(c => {
          const desc = c.description.toLowerCase();
          return materialTerms.some(t => desc.includes(t));
        });
        if (match) {
          return {
            bestCode: match.code,
            reason: `textile material "${bestMaterial.name}" matches description`,
            confidenceBoost: 0.12,
          };
        }
      }
    }
  }

  return null;
}

function findGenderMatch(
  productLower: string,
  candidates: { code: string; description: string; score: number }[],
): SubdivisionResult | null {
  for (const gp of GENDER_PATTERNS) {
    if (gp.pattern.test(productLower)) {
      // Find candidate whose description matches the detected gender
      const genderTerms = gp.genderSuffix === 'M'
        ? ['men', 'boys', 'male']
        : gp.genderSuffix === 'F'
          ? ['women', 'girls', 'ladies', 'female']
          : ['unisex', 'children', 'kids', 'infant', 'baby'];

      const match = candidates.find(c => {
        const desc = c.description.toLowerCase();
        return genderTerms.some(t => desc.includes(t));
      });

      if (match) {
        return {
          bestCode: match.code,
          reason: `gender match: ${gp.genderSuffix === 'M' ? 'male' : gp.genderSuffix === 'F' ? 'female' : 'unisex'}`,
          confidenceBoost: 0.1,
        };
      }
    }
  }
  return null;
}

function findDescriptionMatch(
  productLower: string,
  candidates: { code: string; description: string; score: number }[],
): SubdivisionResult | null {
  const productWords = productLower.split(/\s+/).filter(w => w.length >= 4);
  if (productWords.length === 0) return null;

  let bestCandidate: { code: string; description: string; score: number } | null = null;
  let bestOverlap = 0;

  for (const c of candidates) {
    const descWords = c.description.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4);
    let overlap = 0;
    for (const pw of productWords) {
      if (descWords.some(dw => dw === pw || dw.includes(pw) || pw.includes(dw))) {
        overlap++;
      }
    }
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestCandidate = c;
    }
  }

  if (bestCandidate && bestOverlap >= 2) {
    return {
      bestCode: bestCandidate.code,
      reason: `description overlap (${bestOverlap} words)`,
      confidenceBoost: 0.08,
    };
  }

  return null;
}
