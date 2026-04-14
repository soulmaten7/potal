/**
 * CW36-JP1 + CW36-SYNC: Japan tariff classification rules loader.
 * Primary: Supabase jp_classification_rules table (89 codes)
 * Fallback: config/jp_classification_rules.json (local file)
 */

import { createClient } from '@supabase/supabase-js';

// Fallback: local JSON (kept for offline/build-time use)
import jpRulesData from '@/config/jp_classification_rules.json';

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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Look up JP classification guidance — DB-first, local JSON fallback.
 */
export async function lookupJpGuidanceAsync(hsCode: string): Promise<JpClassificationGuidance | null> {
  if (!hsCode || hsCode.length < 2) return null;
  const chapter = hsCode.slice(0, 2);
  const heading = hsCode.slice(0, 4);
  const hs6 = hsCode.slice(0, 6);

  const sb = getSupabase();
  if (sb) {
    try {
      // Try DB first
      let { data } = await sb.from('jp_classification_rules').select('*').eq('chapter', chapter).limit(20);
      if (data && data.length > 0) {
        // Filter by precision: hs6 → heading → chapter
        let matched = data.filter((r: Record<string, string>) => r.hs6 === hs6);
        if (!matched.length) matched = data.filter((r: Record<string, string>) => r.heading === heading);
        if (!matched.length) matched = data;
        const chapterTitle = data[0]?.chapter_title || `Chapter ${chapter}`;
        return {
          source: 'JP_TARIFF_RULES',
          chapter,
          chapterTitle,
          subdivisionAxes: [...new Set(data.map((r: Record<string, string | null>) => r.subdivision_axis).filter(Boolean))] as string[],
          matchedCodes: matched.slice(0, 10).map((r: Record<string, string | null>) => ({
            code: r.code9 || '',
            description: r.description || '',
            dutyRate: r.duty_rate || null,
            subdivisionLogic: r.subdivision_logic || null,
          })),
        };
      }
    } catch { /* DB failed, fall through to local */ }
  }

  // Fallback: local JSON
  return lookupJpGuidance(hsCode);
}

/** Sync fallback using local JSON (for non-async contexts) */
export function lookupJpGuidance(hsCode: string): JpClassificationGuidance | null {
  if (!hsCode || hsCode.length < 2) return null;
  const chapter = hsCode.slice(0, 2);
  const chapters = (jpRulesData as { chapters: Record<string, { title: string; subdivision_axes: string[]; codes: Array<{ code: string; hs6: string; description: string; duty_rate: string | null; subdivision_logic: string | null }> }> }).chapters;
  const chapterData = chapters[chapter];
  if (!chapterData) return null;

  const heading = hsCode.slice(0, 4);
  const hs6 = hsCode.slice(0, 6);
  let matched = chapterData.codes.filter(c => c.hs6 === hs6);
  if (!matched.length) matched = chapterData.codes.filter(c => c.hs6.startsWith(heading));
  if (!matched.length) matched = chapterData.codes;

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
