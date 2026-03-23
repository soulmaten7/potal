/**
 * Step 5: Check Chapter Notes for include/exclude rules.
 * Pure code — no AI calls.
 */

import type { ChapterCandidate, KeywordResult } from '../types';
import { getChapterNote, parseChapterNoteRules } from '../data/chapter-notes';

interface ChapterNoteResult {
  validChapters: ChapterCandidate[];
  excludedChapters: { chapter: number; reason: string; redirectTo?: number }[];
}

export function checkChapterNotes(
  chapterCandidates: ChapterCandidate[],
  keywordResult: KeywordResult
): ChapterNoteResult {
  const { keywords } = keywordResult;
  const validChapters: ChapterCandidate[] = [];
  const excludedChapters: { chapter: number; reason: string; redirectTo?: number }[] = [];

  for (const candidate of chapterCandidates) {
    const note = getChapterNote(candidate.chapter);
    const rules = parseChapterNoteRules(note);

    let excluded = false;

    // Check excludes
    for (const excludeText of rules.excludes) {
      const excludeLower = excludeText.toLowerCase();
      for (const kw of keywords) {
        if (excludeLower.includes(kw) && kw.length > 3) {
          excludedChapters.push({
            chapter: candidate.chapter,
            reason: `Chapter note excludes "${kw}": "${excludeText.substring(0, 80)}"`,
          });
          excluded = true;
          break;
        }
      }
      if (excluded) break;
    }

    // Check definitions — if a defined term matches our product, boost score
    if (!excluded) {
      for (const [term, definition] of Object.entries(rules.definitions)) {
        for (const kw of keywords) {
          if (term.includes(kw) || kw.includes(term)) {
            candidate.score += 2; // Boost for matching defined terms
            break;
          }
        }
      }
    }

    if (!excluded) {
      validChapters.push(candidate);
    }
  }

  // If all chapters were excluded, restore the highest-scoring one
  if (validChapters.length === 0 && chapterCandidates.length > 0) {
    validChapters.push(chapterCandidates[0]);
  }

  return { validChapters, excludedChapters };
}
