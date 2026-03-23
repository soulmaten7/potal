/**
 * GRI Rules 1-6 — Hardcoded text for classification prompts.
 */

const GRI_RULES: Record<number, string> = {
  1: 'GRI 1: Classification shall be determined according to the terms of the headings and any relative section or chapter notes. Titles of sections, chapters and sub-chapters are provided for ease of reference only.',
  2: 'GRI 2(a): Any reference to an article shall include incomplete or unfinished articles having the essential character of the complete article. GRI 2(b): Any reference to a material shall include mixtures or combinations of that material with other materials.',
  3: 'GRI 3(a): The heading which provides the most specific description shall be preferred. GRI 3(b): Composite goods shall be classified by the component which gives essential character. GRI 3(c): When 3(a) and 3(b) fail, classify under the heading which occurs last in numerical order.',
  4: 'GRI 4: Goods which cannot be classified under Rules 1-3 shall be classified under the heading appropriate to the goods to which they are most akin.',
  5: 'GRI 5(a): Cases, boxes and similar containers specially shaped to hold a specific article shall be classified with the article. GRI 5(b): Packing materials shall be classified with the goods if normally used for packing such goods.',
  6: 'GRI 6: Classification of goods in the subheadings of a heading shall be determined according to the terms of those subheadings and any related subheading notes, mutatis mutandis to Rules 1 to 5.',
};

export function getGriRule(ruleNumber: 1 | 2 | 3 | 4 | 5 | 6): string {
  return GRI_RULES[ruleNumber] || '';
}

export function getAllGriRules(): string {
  return Object.values(GRI_RULES).join('\n\n');
}
