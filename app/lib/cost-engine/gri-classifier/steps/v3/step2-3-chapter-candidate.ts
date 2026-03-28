/**
 * v3 Step 2-3 — Chapter Candidate Selection
 * Uses Section confirmation + material/processing/category to narrow to Chapter
 */

import type { NormalizedInputV3, Step2_2_Output, Step2_3_Output } from '../../types';
import { HEADING_DESCRIPTIONS } from '../../data/heading-descriptions';

/** Chapter descriptions for matching */
const CHAPTER_DESCRIPTIONS: Record<number, string> = {};

// Build chapter descriptions from heading descriptions (first heading per chapter)
(function init() {
  for (const [code, desc] of Object.entries(HEADING_DESCRIPTIONS)) {
    const ch = parseInt(code.substring(0, 2), 10);
    if (!CHAPTER_DESCRIPTIONS[ch]) {
      CHAPTER_DESCRIPTIONS[ch] = desc;
    }
  }
})();

/** Material → Chapter mapping within Section */
const MATERIAL_CHAPTER_MAP: Record<string, Record<string, number[]>> = {
  // Section XI textiles
  silk: { '11': [50] },
  wool: { '11': [51] },
  cotton: { '11': [52] },
  polyester: { '11': [54, 55] },
  nylon: { '11': [54, 55] },
  linen: { '11': [53] },
  // Section XV base metals
  iron: { '15': [72, 73, 82] },
  steel: { '15': [72, 73, 82] },
  copper: { '15': [74] },
  aluminum: { '15': [76] },
  zinc: { '15': [79] },
  tin: { '15': [80] },
  // Section VII plastics/rubber
  plastic: { '7': [39] },
  rubber: { '7': [40] },
};

/** Processing → Chapter refinement */
const PROCESSING_CHAPTER_MAP: Record<string, Record<number, number>> = {
  // Within Section XI: processing determines yarn/fabric/garment chapter
  knitted: { 11: 61 },      // knitted garments
  crocheted: { 11: 61 },
  woven: { 11: 62 },        // woven garments (if category=clothing)
  embroidered: { 11: 58 },
  // Within Section I: processing determines fresh/frozen/prepared
  live: { 1: 1 },
  fresh: { 1: 2 },
  frozen: { 1: 2 },
  smoked: { 1: 3 },         // fish processing
  salted: { 1: 3 },
  dried: { 1: 3 },
  // Within Section XV: semi-finished vs articles
  rolled: { 15: 72 },
  forged: { 15: 73 },
  cast: { 15: 73 },
  machined: { 15: 73 },
};

export function selectChapterCandidates(
  input: NormalizedInputV3,
  step22: Step2_2_Output
): Step2_3_Output {
  const section = step22.confirmed_section;
  const availableChapters = step22.chapters_in_section;
  const candidates: Map<number, { score: number; matched_by: string }> = new Map();

  // 1. Use chapter hints from Step 2-2 (highest priority)
  // When multiple hints with same score, prefer material-specific hint
  for (const hint of step22.chapter_hints) {
    if (availableChapters.includes(hint.chapter)) {
      // Material-specific hints get higher score than generic processing hints
      const isMaterialHint = hint.reason.startsWith('material=');
      const score = isMaterialHint ? 0.95 : 0.9;
      const existing = candidates.get(hint.chapter);
      if (!existing || existing.score < score) {
        candidates.set(hint.chapter, { score, matched_by: `hint:${hint.reason}` });
      }
    }
  }

  // 2. Material → Chapter within Section
  // For Section XV (base metals), disambiguate raw material chapters vs article chapters
  // e.g. steel → Ch72 (raw) vs Ch73 (articles); aluminum → Ch76 (both raw & articles)
  const ARTICLE_KEYWORDS = ['bottle', 'bottles', 'container', 'pot', 'pan', 'kettle', 'table', 'kitchen', 'household', 'tool', 'utensil', 'cutlery', 'nail', 'screw', 'bolt', 'nut', 'wire', 'cable', 'chain', 'spring', 'tank', 'drum', 'can', 'door', 'window', 'furniture', 'stand', 'holder', 'rack', 'hook', 'thermos', 'insulated', 'knife', 'knives', 'scissors', 'blade', 'fork', 'spoon', 'cutter', 'chopper', 'cleaver'];
  // Ch82 cutlery/tool keywords — if present in Section XV, boost Ch82 over Ch73
  const CH82_KEYWORDS = ['knife', 'knives', 'blade', 'cutlery', 'scissors', 'fork', 'spoon', 'spatula', 'ladle', 'grater', 'peeler', 'opener', 'cutter', 'chopper', 'cleaver', 'shears', 'file', 'rasp', 'hammer', 'pliers', 'wrench', 'saw', 'drill'];
  const inputText = [input.product_name.toLowerCase(), ...input.category_tokens, ...input.description_tokens].join(' ');
  const isArticle = ARTICLE_KEYWORDS.some(kw => inputText.includes(kw));
  const isCh82Product = CH82_KEYWORDS.some(kw => inputText.includes(kw));

  const sectionKey = String(section);
  for (const mat of input.material_keywords) {
    const mapping = MATERIAL_CHAPTER_MAP[mat]?.[sectionKey];
    if (mapping) {
      for (const ch of mapping) {
        if (availableChapters.includes(ch)) {
          let score = 0.85;
          // In Section XV: prefer articles chapter (73,76) over raw material chapter (72)
          if (section === 15 && isArticle) {
            if (ch === 82 && isCh82Product) score = 0.95; // cutlery/tools → Ch82 highest priority
            else if (ch === 73 || ch === 76) score = isCh82Product ? 0.75 : 0.9;  // demote Ch73 if Ch82 product
            else if (ch === 72) score = 0.7;  // demote raw material chapter
          }
          const existing = candidates.get(ch);
          if (!existing || existing.score < score) {
            candidates.set(ch, { score, matched_by: `material:${mat}→Ch.${ch}` });
          }
        }
      }
    }
  }

  // 3. Processing → Chapter refinement
  for (const proc of input.processing_states) {
    const mapping = PROCESSING_CHAPTER_MAP[proc]?.[section];
    if (mapping && availableChapters.includes(mapping)) {
      const existing = candidates.get(mapping);
      if (!existing || existing.score < 0.8) {
        candidates.set(mapping, { score: 0.8, matched_by: `processing:${proc}→Ch.${mapping}` });
      }
    }
  }

  // 4. Category tokens → Chapter (check product_name + description words against heading descriptions)
  if (candidates.size === 0) {
    const searchText = [
      input.product_name,
      ...input.category_tokens,
      ...input.description_tokens,
    ].join(' ').toLowerCase();

    for (const ch of availableChapters) {
      // Find headings in this chapter
      const chPrefix = String(ch).padStart(2, '0');
      let bestScore = 0;

      for (const [code, desc] of Object.entries(HEADING_DESCRIPTIONS)) {
        if (code.startsWith(chPrefix)) {
          const descWords = desc.toLowerCase().split(/[;,\s]+/).filter(w => w.length > 3);
          const matchCount = descWords.filter(w => searchText.includes(w)).length;
          const score = matchCount / Math.max(descWords.length, 1);
          if (score > bestScore) bestScore = score;
        }
      }

      if (bestScore > 0.1) {
        candidates.set(ch, { score: Math.min(bestScore * 2, 0.9), matched_by: `heading_match:Ch.${ch}` });
      }
    }
  }

  // 5. Composition: use max-weight material
  if (candidates.size === 0 && input.composition_parsed.length > 0) {
    const primary = input.composition_parsed[0]; // highest pct
    for (const mat of Object.keys(MATERIAL_CHAPTER_MAP)) {
      if (primary.material.includes(mat)) {
        const mapping = MATERIAL_CHAPTER_MAP[mat]?.[sectionKey];
        if (mapping) {
          for (const ch of mapping) {
            if (availableChapters.includes(ch)) {
              candidates.set(ch, { score: 0.75, matched_by: `composition:${primary.material}(${primary.pct}%)→Ch.${ch}` });
            }
          }
        }
      }
    }
  }

  // 6. Fallback: if still no candidates, add all chapters in section with low score
  if (candidates.size === 0) {
    for (const ch of availableChapters) {
      candidates.set(ch, { score: 0.3, matched_by: 'fallback:all_in_section' });
    }
  }

  // Build output, sorted by score, top 2
  const result: Step2_3_Output = {
    chapter_candidates: Array.from(candidates.entries())
      .map(([chapter, info]) => ({
        chapter,
        score: info.score,
        matched_by: info.matched_by,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2),
  };

  return result;
}
