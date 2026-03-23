/**
 * v3 Heading Lookup — Get all headings for confirmed chapter
 */

import { HEADING_DESCRIPTIONS } from '../../data/heading-descriptions';

export function getHeadingsForChapter(chapter: number): { heading: string; description: string }[] {
  const chPrefix = String(chapter).padStart(2, '0');
  const headings: { heading: string; description: string }[] = [];

  for (const [code, desc] of Object.entries(HEADING_DESCRIPTIONS)) {
    if (code.startsWith(chPrefix)) {
      headings.push({ heading: code, description: desc });
    }
  }

  return headings;
}
