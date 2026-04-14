/**
 * CW36-JP1: Japan tariff classification rules loader.
 * Loads config/jp_classification_rules.json for JP-destination lookups.
 */

import jpRulesData from '@/config/jp_classification_rules.json';

interface JpCode {
  code: string;
  hs6: string;
  description: string;
  duty_rate: string | null;
  subdivision_logic: string | null;
}

interface JpChapter {
  title: string;
  subdivision_axes: string[];
  code_count: number;
  codes: JpCode[];
}

export interface JpClassificationGuidance {
  source: 'JP_TARIFF_RULES';
  chapter: string;
  chapterTitle: string;
  subdivisionAxes: string[];
  matchedCodes: Array<{
    code: string;
    description: string;
    dutyRate: string | null;
    subdivisionLogic: string | null;
  }>;
}

const chapters = (jpRulesData as { chapters: Record<string, JpChapter> }).chapters;

/**
 * Look up JP classification guidance for a given HS code.
 * Returns chapter-level guidance + matched codes within that chapter.
 */
export function lookupJpGuidance(hsCode: string): JpClassificationGuidance | null {
  if (!hsCode || hsCode.length < 2) return null;
  const chapter = hsCode.slice(0, 2);
  const chapterData = chapters[chapter];
  if (!chapterData) return null;

  // Filter codes that match the HS prefix
  const heading = hsCode.slice(0, 4);
  const hs6 = hsCode.slice(0, 6);

  let matched = chapterData.codes.filter(c => c.hs6 === hs6);
  if (matched.length === 0) {
    matched = chapterData.codes.filter(c => c.hs6.startsWith(heading));
  }
  if (matched.length === 0) {
    matched = chapterData.codes; // return all chapter codes as context
  }

  return {
    source: 'JP_TARIFF_RULES',
    chapter,
    chapterTitle: chapterData.title,
    subdivisionAxes: chapterData.subdivision_axes,
    matchedCodes: matched.slice(0, 10).map(c => ({
      code: c.code,
      description: c.description,
      dutyRate: c.duty_rate,
      subdivisionLogic: c.subdivision_logic,
    })),
  };
}
