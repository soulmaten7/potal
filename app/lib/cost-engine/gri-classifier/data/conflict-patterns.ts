/**
 * Conflict Patterns loader — uses embedded data (no fs dependency).
 */

import type { ConflictPattern } from '../types';
import { CONFLICT_PATTERNS } from './conflict-patterns-data';

/**
 * Find a matching conflict pattern for given chapter and keywords.
 * Returns the pattern with the highest keyword overlap (minimum 2 shared keywords).
 */
export function findMatchingPattern(
  chapter: number,
  keywords: string[],
  candidateHeadings?: string[]
): ConflictPattern | null {
  const patterns = CONFLICT_PATTERNS[chapter];
  if (!patterns || patterns.length === 0) return null;

  const keywordSet = new Set(keywords.map(k => k.toLowerCase()));
  let bestPattern: ConflictPattern | null = null;
  let bestScore = 0;

  for (const pattern of patterns) {
    // If we have candidate headings, only consider patterns that match
    if (candidateHeadings && candidateHeadings.length > 0) {
      const hasOverlap = pattern.conflict_headings.some(h =>
        candidateHeadings.some(ch => ch.startsWith(h) || h.startsWith(ch))
      );
      if (!hasOverlap) continue;
    }

    // Calculate keyword overlap
    const patternKeywords = (pattern.keywords || []).map(k => k.toLowerCase());
    let overlap = 0;
    for (const pk of patternKeywords) {
      if (keywordSet.has(pk)) overlap++;
    }

    if (overlap >= 2 && overlap > bestScore) {
      bestScore = overlap;
      bestPattern = pattern;
    }
  }

  return bestPattern;
}

/**
 * Get all patterns for a chapter.
 */
export function getChapterPatterns(chapter: number): ConflictPattern[] {
  return CONFLICT_PATTERNS[chapter] || [];
}
