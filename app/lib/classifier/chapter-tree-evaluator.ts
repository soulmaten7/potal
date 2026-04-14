/**
 * CW36-WCO1: Chapter Decision Tree Evaluator
 *
 * Uses chapter_decision_trees.json to:
 * 1. Validate that a product belongs in a chapter (include rules)
 * 2. Redirect products that DON'T belong (exclude rules → correct chapter)
 * 3. Provide material/form/use hints to improve classification confidence
 *
 * Priority: manual decision trees (CW34-S1) > this auto tree > voting engine
 */

import treeData from '@/config/chapter_decision_trees.json';

interface ChapterTree {
  chapter: string;
  description: string;
  rules: Array<{
    type: 'include' | 'exclude';
    condition: string;
    action: string;
    redirectHeadings?: string[];
  }>;
  materialHints: string[];
  formHints: string[];
  useHints: string[];
  crossRefHeadings: string[];
  subheadingNote?: string;
}

export interface ChapterClassificationHint {
  chapter: string;
  chapterDescription: string;
  materialHints: string[];
  formHints: string[];
  useHints: string[];
  excludeWarnings: string[];
  includeConfirmations: string[];
  suggestedRedirects: string[];
  confidence: number;
  source: 'chapter_decision_tree';
}

const chapters = (treeData as { chapters: Record<string, ChapterTree> }).chapters;

/**
 * Evaluate a product against chapter decision trees.
 * Returns classification hints for the given chapter.
 */
export function evaluateChapterTree(
  chapterCode: string,
  productName: string,
  material?: string,
  productForm?: string,
  intendedUse?: string,
): ChapterClassificationHint | null {
  const tree = chapters[chapterCode];
  if (!tree) return null;

  const lower = productName.toLowerCase();
  const matLower = (material || '').toLowerCase();

  const excludeWarnings: string[] = [];
  const includeConfirmations: string[] = [];
  const suggestedRedirects: string[] = [];
  let confidence = 0.6; // baseline

  // Check include rules
  for (const rule of tree.rules) {
    if (rule.type === 'include') {
      const condLower = rule.condition.toLowerCase();
      // Check if product description matches include condition keywords
      const condWords = condLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = condWords.filter(w => lower.includes(w)).length;
      if (matchCount > 0) {
        includeConfirmations.push(rule.condition);
        confidence += 0.1;
      }
    }
  }

  // Check exclude rules
  for (const rule of tree.rules) {
    if (rule.type === 'exclude') {
      const condLower = rule.condition.toLowerCase();
      const condWords = condLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = condWords.filter(w => lower.includes(w) || matLower.includes(w)).length;
      if (matchCount >= 2) {
        excludeWarnings.push(rule.condition);
        if (rule.redirectHeadings) {
          suggestedRedirects.push(...rule.redirectHeadings);
        }
        confidence -= 0.15;
      }
    }
  }

  // Material hint match
  if (material && tree.materialHints.includes(matLower)) {
    confidence += 0.1;
  }

  // Form hint match
  if (productForm && tree.formHints.includes(productForm.toLowerCase())) {
    confidence += 0.05;
  }

  // Use hint match
  if (intendedUse && tree.useHints.includes(intendedUse.toLowerCase())) {
    confidence += 0.05;
  }

  confidence = Math.max(0, Math.min(1, confidence));

  return {
    chapter: chapterCode,
    chapterDescription: tree.description,
    materialHints: tree.materialHints,
    formHints: tree.formHints,
    useHints: tree.useHints,
    excludeWarnings,
    includeConfirmations,
    suggestedRedirects: [...new Set(suggestedRedirects)],
    confidence,
    source: 'chapter_decision_tree',
  };
}

/**
 * Find the best matching chapter for a product based on material/form/use.
 * Used when the classifier is uncertain between multiple chapters.
 */
export function findBestChapter(
  candidateChapters: string[],
  material?: string,
  productForm?: string,
  intendedUse?: string,
): { chapter: string; score: number } | null {
  if (candidateChapters.length === 0) return null;

  const matLower = (material || '').toLowerCase();
  const formLower = (productForm || '').toLowerCase();
  const useLower = (intendedUse || '').toLowerCase();

  let best: { chapter: string; score: number } | null = null;

  for (const ch of candidateChapters) {
    const tree = chapters[ch];
    if (!tree) continue;

    let score = 0;
    if (matLower && tree.materialHints.includes(matLower)) score += 3;
    if (formLower && tree.formHints.includes(formLower)) score += 2;
    if (useLower && tree.useHints.includes(useLower)) score += 1;

    if (!best || score > best.score) {
      best = { chapter: ch, score };
    }
  }

  return best;
}

/**
 * Get all chapter hints for a given HS code.
 */
export function getChapterHints(hsCode: string): ChapterClassificationHint | null {
  const chapter = hsCode.slice(0, 2);
  return evaluateChapterTree(chapter, '', undefined, undefined, undefined);
}
