/**
 * v3 Step 2-4 — Chapter Notes Verification
 * Apply codified Chapter Notes rules (exclusion/inclusion/numeric/material)
 * Handle essential character via category field
 */

import type { NormalizedInputV3, Step2_3_Output, Step2_4_Output } from '../../types';
import { getRulesForChapter, matchExclusion, matchInclusion } from '../../data/codified-rules';

/** Essential character resolution via category — the 4 boundary cases */
const CATEGORY_CHAPTER_OVERRIDES: Record<string, { keywords: string[]; chapter: number }[]> = {
  // Ch.9 vs Ch.21: spice vs seasoning
  '9': [
    { keywords: ['spice', 'spices', 'pepper', 'cinnamon', 'turmeric', 'curry powder', 'cumin', 'ginger', 'clove', 'nutmeg', 'saffron'], chapter: 9 },
    { keywords: ['seasoning', 'condiment', 'sauce', 'paste', 'dressing', 'marinade', 'rub'], chapter: 21 },
  ],
  // Ch.40 vs Ch.39/Section XI: rubber vs plastic/textile
  '40': [
    { keywords: ['rubber', 'tire', 'tyre', 'gasket', 'seal', 'hose', 'belt'], chapter: 40 },
    { keywords: ['plastic', 'pvc', 'polypropylene'], chapter: 39 },
  ],
  // Ch.42 vs Ch.71: leather goods vs jewelry
  '42': [
    { keywords: ['handbag', 'wallet', 'purse', 'suitcase', 'briefcase', 'bag', 'case', 'strap'], chapter: 42 },
    { keywords: ['jewelry', 'jewellery', 'necklace', 'bracelet', 'ring', 'earring', 'brooch', 'pendant'], chapter: 71 },
  ],
  // Ch.95 vs Ch.88/85: toy vs aircraft/electronics
  '95': [
    { keywords: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'plush', 'stuffed', 'plaything', 'building block', 'board game'], chapter: 95 },
    { keywords: ['drone', 'uav', 'quadcopter', 'aerial', 'unmanned aircraft'], chapter: 88 },
    { keywords: ['computer', 'tablet', 'monitor', 'server', 'router'], chapter: 84 },
  ],
};

export function verifyChapterWithNotes(
  input: NormalizedInputV3,
  step23: Step2_3_Output
): Step2_4_Output {
  const rulesApplied: { source: string; type: string; action: string }[] = [];
  const excludedChapters: { chapter: number; reason: string }[] = [];

  let candidates = [...step23.chapter_candidates];

  // Build input text for matching
  const inputText = [
    input.product_name,
    input.material_primary,
    ...input.material_keywords,
    ...input.category_tokens,
    ...input.description_tokens,
    ...input.processing_states,
  ].join(' ');

  // 1. Apply Chapter Notes exclusion rules
  for (const candidate of candidates) {
    const rules = getRulesForChapter(candidate.chapter);

    // Exclusion check
    const exclusionResult = matchExclusion(inputText, rules);
    if (exclusionResult.matched && exclusionResult.rule) {
      excludedChapters.push({
        chapter: candidate.chapter,
        reason: `Excluded by ${exclusionResult.rule.source}: ${exclusionResult.rule.original_text?.substring(0, 80) || ''}`,
      });
      rulesApplied.push({
        source: exclusionResult.rule.source,
        type: 'exclusion',
        action: `Excluded Chapter ${candidate.chapter}`,
      });
      candidate.score = 0;
    }

    // Inclusion boost
    const inclusionResult = matchInclusion(inputText, rules);
    if (inclusionResult.matched && inclusionResult.rule) {
      candidate.score = Math.min(candidate.score + 0.1, 1.0);
      rulesApplied.push({
        source: inclusionResult.rule.source,
        type: 'inclusion',
        action: `Confirmed Chapter ${candidate.chapter}`,
      });
    }

    // Numeric threshold checks (composition/weight)
    const numericRules = rules.filter(r => r.type === 'numeric_threshold');
    for (const rule of numericRules) {
      if (rule.condition?.unit === '%' && rule.condition.value && input.composition_parsed.length > 0) {
        const threshold = parseFloat(rule.condition.value);
        const primaryPct = input.composition_parsed[0]?.pct || 0;
        if (!isNaN(threshold) && primaryPct > 0) {
          const meetsThreshold = primaryPct >= threshold;
          if (meetsThreshold) {
            rulesApplied.push({
              source: rule.source,
              type: 'numeric_threshold',
              action: `Composition ${primaryPct}% meets threshold ${threshold}%`,
            });
          }
        }
      }
    }

    // Material condition checks (89 rules)
    const materialRules = rules.filter(r => r.type === 'material_condition');
    for (const rule of materialRules) {
      const ruleText = (rule.original_text || '').toLowerCase();
      if (!ruleText || ruleText.length < 10) continue;
      const combined = [...input.material_keywords, ...input.composition_parsed.map(c => c.material), input.product_name].join(' ').toLowerCase();
      const materialTerms = ['textile', 'cotton', 'wool', 'silk', 'polyester', 'leather', 'rubber', 'plastic', 'metal', 'steel', 'iron', 'glass', 'ceramic', 'wood', 'paper'];
      const matched = materialTerms.filter(m => ruleText.includes(m) && combined.includes(m));
      if (matched.length > 0) {
        rulesApplied.push({ source: rule.source, type: 'material_condition', action: `Material: ${matched.join(', ')}` });
      }
    }
  }

  // Remove excluded
  candidates = candidates.filter(c => c.score > 0);

  // 2. Essential character resolution via category
  if (candidates.length >= 2 || candidates.length === 0) {
    const categoryText = input.category_tokens.join(' ');
    if (categoryText) {
      for (const [chKey, overrides] of Object.entries(CATEGORY_CHAPTER_OVERRIDES)) {
        for (const override of overrides) {
          const match = override.keywords.some(kw => categoryText.includes(kw));
          if (match) {
            // Category resolves the ambiguity
            const existing = candidates.find(c => c.chapter === override.chapter);
            if (existing) {
              existing.score = Math.min(existing.score + 0.2, 1.0);
            } else {
              candidates.push({
                chapter: override.chapter,
                score: 0.85,
                matched_by: `category_override:${override.keywords[0]}→Ch.${override.chapter}`,
              });
            }
            rulesApplied.push({
              source: `Essential Character (Ch.${chKey})`,
              type: 'ai_derived_rule',
              action: `Category "${categoryText}" → Chapter ${override.chapter}`,
            });
            break;
          }
        }
      }
    }
  }

  // Sort by score
  candidates.sort((a, b) => b.score - a.score);

  // Pick confirmed chapter
  const confirmed = candidates[0];
  if (!confirmed) {
    return {
      confirmed_chapter: 0,
      chapter_description: 'Unknown',
      rules_applied: rulesApplied,
      excluded_chapters: excludedChapters,
    };
  }

  // Get chapter description
  const chCode = String(confirmed.chapter).padStart(2, '0');
  const { HEADING_DESCRIPTIONS } = require('../../data/heading-descriptions');
  let chapterDesc = '';
  for (const [code, desc] of Object.entries(HEADING_DESCRIPTIONS)) {
    if ((code as string).startsWith(chCode)) {
      chapterDesc = desc as string;
      break;
    }
  }

  return {
    confirmed_chapter: confirmed.chapter,
    chapter_description: chapterDesc || `Chapter ${confirmed.chapter}`,
    rules_applied: rulesApplied,
    excluded_chapters: excludedChapters,
  };
}
