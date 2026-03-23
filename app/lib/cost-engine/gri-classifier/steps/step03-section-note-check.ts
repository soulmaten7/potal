/**
 * Step 3: Check Section Notes for include/exclude rules.
 * Pure code — no AI calls.
 */

import type { SectionCandidate, KeywordResult } from '../types';
import { getSectionNote } from '../data/section-notes';

interface SectionNoteResult {
  validSections: SectionCandidate[];
  excludedSections: { section: number; reason: string }[];
}

export function checkSectionNotes(
  sectionCandidates: SectionCandidate[],
  keywordResult: KeywordResult
): SectionNoteResult {
  const { keywords } = keywordResult;
  const keywordStr = keywords.join(' ').toLowerCase();
  const validSections: SectionCandidate[] = [];
  const excludedSections: { section: number; reason: string }[] = [];

  for (const candidate of sectionCandidates) {
    const note = getSectionNote(candidate.section);

    if (!note || !note.section_note) {
      // No note — keep the candidate
      validSections.push(candidate);
      continue;
    }

    const noteText = note.section_note.toLowerCase();
    let excluded = false;

    // Check for exclusion patterns
    const exclusionPatterns = [
      /this section does not cover[:\s]+([^.]+)/g,
      /(?:excluded|not included)[:\s]+([^.]+)/g,
      /does not apply to[:\s]+([^.]+)/g,
    ];

    for (const pattern of exclusionPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(noteText)) !== null) {
        const exclusionText = match[1].toLowerCase();
        // Check if any of our keywords appear in the exclusion
        for (const kw of keywords) {
          if (exclusionText.includes(kw) && kw.length > 3) {
            excludedSections.push({
              section: candidate.section,
              reason: `Section note excludes "${kw}": "${match[0].substring(0, 100)}"`,
            });
            excluded = true;
            break;
          }
        }
        if (excluded) break;
      }
      if (excluded) break;
    }

    // Check for redirect patterns
    const redirectPattern = /(?:classified|falls?) (?:under|in) (?:section|heading)\s+(\w+)/gi;
    let redirectMatch: RegExpExecArray | null;
    while ((redirectMatch = redirectPattern.exec(noteText)) !== null) {
      // Redirects are informational — we don't auto-redirect, just note them
    }

    if (!excluded) {
      validSections.push(candidate);
    }
  }

  // If all sections were excluded, restore the highest-scoring one
  if (validSections.length === 0 && sectionCandidates.length > 0) {
    validSections.push(sectionCandidates[0]);
  }

  return { validSections, excludedSections };
}
