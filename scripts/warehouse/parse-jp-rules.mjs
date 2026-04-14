#!/usr/bin/env node
/**
 * Parse jp_tariff_rules.md → config/jp_classification_rules.json
 * Extracts chapter examples (section 8) into structured format.
 */
import fs from 'node:fs';

const SRC = '/Volumes/soulmaten/POTAL/hs_classification_rules/jp_tariff_rules.md';
const OUT = 'config/jp_classification_rules.json';

const md = fs.readFileSync(SRC, 'utf-8');

// Extract section 8 (Annotated Code Examples) tables
const rules = [];

// Match table rows: | code | description | ... |
const TABLE_ROW = /^\|\s*(\d{4}\.\d{2}\.\d{3})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|?\s*(.+?)?\s*\|?\s*$/gm;

let currentChapter = '';
let currentChapterTitle = '';
let currentSubdivisionAxis = '';

const lines = md.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Chapter header: ### 8.1 Chapter 01 — Live Animals (生動物)
  const chapterMatch = line.match(/^### 8\.\d+ Chapter (\d+) — (.+)$/);
  if (chapterMatch) {
    currentChapter = chapterMatch[1].padStart(2, '0');
    currentChapterTitle = chapterMatch[2];
    currentSubdivisionAxis = '';
    continue;
  }

  // Subdivision axis: **Subdivision axis:** ...
  const axisMatch = line.match(/^\*\*Subdivision ax[ei]s?:\*\*\s*(.+)$/);
  if (axisMatch) {
    currentSubdivisionAxis = axisMatch[1].trim();
    continue;
  }

  // Table row
  const rowMatch = line.match(/^\|\s*(\d{4}\.\d{2}\.\d{3})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*(?:\|\s*(.+?)\s*)?(?:\|\s*(.+?)\s*)?\|?\s*$/);
  if (rowMatch && currentChapter) {
    const code9 = rowMatch[1].replace(/\./g, '');
    const hs6 = code9.slice(0, 6);
    const heading = code9.slice(0, 4);
    const description = rowMatch[2].trim();
    const col3 = rowMatch[3].trim();

    // col3 might be duty rate or subdivision logic depending on table format
    let dutyRate = null;
    let subdivisionLogic = null;
    let unit = null;

    if (/^\d+(\.\d+)?%|^Free|^¥|^Specific/i.test(col3)) {
      dutyRate = col3;
      subdivisionLogic = rowMatch[4]?.trim() || null;
      unit = rowMatch[5]?.trim() || null;
    } else {
      subdivisionLogic = col3;
    }

    rules.push({
      code9: code9.slice(0, 4) + '.' + code9.slice(4, 6) + '.' + code9.slice(6),
      code9_flat: code9,
      hs6,
      heading,
      chapter: currentChapter,
      chapter_title: currentChapterTitle,
      description,
      duty_rate: dutyRate,
      unit,
      subdivision_logic: subdivisionLogic,
      subdivision_axis: currentSubdivisionAxis || null,
    });
  }
}

// Build chapter-level summaries
const chapterSummary = {};
for (const r of rules) {
  if (!chapterSummary[r.chapter]) {
    chapterSummary[r.chapter] = {
      chapter: r.chapter,
      title: r.chapter_title,
      subdivision_axes: new Set(),
      codes: [],
    };
  }
  chapterSummary[r.chapter].codes.push(r);
  if (r.subdivision_axis) chapterSummary[r.chapter].subdivision_axes.add(r.subdivision_axis);
}

// Serialize
const output = {
  source: 'jp_tariff_rules.md',
  compiled_at: new Date().toISOString(),
  total_rules: rules.length,
  chapters_covered: Object.keys(chapterSummary).length,
  chapters: Object.fromEntries(
    Object.entries(chapterSummary).map(([ch, data]) => [
      ch,
      {
        title: data.title,
        subdivision_axes: [...data.subdivision_axes],
        code_count: data.codes.length,
        codes: data.codes.map(c => ({
          code: c.code9,
          hs6: c.hs6,
          description: c.description,
          duty_rate: c.duty_rate,
          subdivision_logic: c.subdivision_logic,
        })),
      },
    ])
  ),
};

fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`✅ ${OUT}: ${rules.length} rules, ${Object.keys(chapterSummary).length} chapters`);
for (const [ch, data] of Object.entries(chapterSummary)) {
  console.log(`  Ch ${ch}: ${data.title} — ${data.codes.length} codes`);
}
