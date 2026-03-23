/**
 * Base Country Agent — Enhanced pattern-based matching for all 7 countries.
 * Uses codified_national JSON (pattern_types, conditions, keywords) + DB fallback.
 */

import { createClient } from '@supabase/supabase-js';
import type { CountryAgentResult } from '../types';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Country codified data — loaded from DB at runtime (Vercel compatible)
// JSON files are too large (21MB total) for static import/bundling
/* eslint-disable @typescript-eslint/no-explicit-any */

function loadCodified(_countryCode: string): Record<string, any[]> {
  // Country codified data is loaded from gov_tariff_schedules DB via Supabase
  // The 7 JSON files (21MB) are for local dev/benchmark only
  // In production, baseClassify() queries DB directly (already implemented below)
  return {};
}

export interface EnhancedInput {
  keywords: string[];
  product_name?: string;
  material_keywords?: string[];
  category_tokens?: string[];
  processing_states?: string[];
  composition_parsed?: { material: string; pct: number }[];
  price?: number;
  weight_spec?: string | null;
}

export async function baseClassify(
  hs6: string,
  inputOrKeywords: string[] | EnhancedInput,
  countryCode: string,
  defaultPrecision: number,
  price?: number,
  productName?: string
): Promise<CountryAgentResult> {
  // Normalize input — support both old (string[]) and new (EnhancedInput) format
  let input: EnhancedInput;
  if (Array.isArray(inputOrKeywords)) {
    input = { keywords: inputOrKeywords, product_name: productName, price };
  } else {
    input = inputOrKeywords;
  }

  // ── Try codified data first (pattern-based) ──
  const codified = loadCodified(countryCode);
  const candidates = codified[hs6];

  if (candidates && candidates.length > 0) {
    const result = scoreWithPatterns(hs6, candidates, input, countryCode);
    if (result) return result;
  }

  // ── Fallback: DB query (original logic) ──
  return dbFallback(hs6, input.keywords, countryCode);
}

function scoreWithPatterns(
  hs6: string,
  candidates: any[],
  input: EnhancedInput,
  countryCode: string
): CountryAgentResult | null {
  const nameLower = (input.product_name || '').toLowerCase();
  const allKeywords = new Set([
    ...(input.keywords || []),
    ...(input.material_keywords || []),
    ...(input.category_tokens || []),
  ].map(k => k.toLowerCase()));

  const scored = candidates.map(c => {
    let score = 0;
    const patterns: string[] = c.patterns || [];
    const conditions = c.conditions || {};
    const desc = (c.desc || '').toLowerCase();
    const cKeywords: string[] = c.keywords || [];

    // ── Pattern-based scoring ──

    // 1. PRICE_THRESHOLD (most impactful for US)
    if (patterns.includes('PRICE_THRESHOLD') && input.price !== undefined && input.price !== null) {
      const threshold = conditions.price_threshold;
      const condition = conditions.price_condition;
      if (threshold !== undefined) {
        if (condition === 'not_over' && input.price <= threshold) score += 15;
        else if (condition === 'over' && input.price > threshold) score += 15;
        else score -= 10; // Price doesn't match this candidate
      }
    }

    // 2. MATERIAL_DETAIL
    if (patterns.includes('MATERIAL_DETAIL') && conditions.material) {
      const condMat = conditions.material.toLowerCase();
      if (input.material_keywords?.some(mk => mk.toLowerCase() === condMat || condMat.includes(mk.toLowerCase()))) {
        score += 12;
      }
      // Composition match
      if (input.composition_parsed?.some(cp => cp.material.toLowerCase().includes(condMat))) {
        score += 8;
      }
    }

    // 3. GENDER
    if (patterns.includes('GENDER') && conditions.gender) {
      const g = conditions.gender.toLowerCase();
      if ((g.includes('men') || g.includes('boy')) && (nameLower.includes('men') || nameLower.includes('boy') || nameLower.includes('male'))) score += 10;
      if ((g.includes('women') || g.includes('girl')) && (nameLower.includes('women') || nameLower.includes('girl') || nameLower.includes('female'))) score += 10;
    }

    // 4. PROCESSING
    if (patterns.includes('PROCESSING') && conditions.processing) {
      if (input.processing_states?.some(ps => ps.toLowerCase() === conditions.processing.toLowerCase())) score += 8;
    }

    // 5. COMPOSITION_PCT
    if (patterns.includes('COMPOSITION_PCT') && conditions.composition_pct) {
      const reqPct = conditions.composition_pct;
      if (input.composition_parsed?.length) {
        const primary = input.composition_parsed[0];
        if (primary.pct >= reqPct) score += 6;
      }
    }

    // 6. SIZE_THRESHOLD
    if (patterns.includes('SIZE_THRESHOLD') && conditions.size_cm && input.weight_spec) {
      // Try to extract cm from weight_spec
      const cmMatch = input.weight_spec.match(/([\d.]+)\s*(?:cm|inch)/i);
      if (cmMatch) {
        const val = parseFloat(cmMatch[1]);
        if (val <= conditions.size_cm) score += 6;
      }
    }

    // 7. END_USE
    if (patterns.includes('END_USE') && conditions.end_use) {
      if (input.category_tokens?.some(ct => ct.toLowerCase().includes(conditions.end_use))) score += 8;
    }

    // 8. Keyword overlap (general)
    for (const kw of cKeywords) {
      if (allKeywords.has(kw.toLowerCase())) score += 2;
    }

    // 9. Product name keyword in description
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 3);
    for (const nw of nameWords) {
      if (desc.includes(nw)) score += 3;
    }

    // 10. Penalize catch-all
    if (patterns.includes('CATCH_ALL')) score -= 2;

    // 11. Prefer deeper codes (longer = more specific)
    score += (c.code.length - 6) * 0.5;

    // 12. US indent: prefer higher indent (more specific)
    if (countryCode === 'US' && c.indent > 0) {
      score += c.indent * 0.3;
    }

    return { ...c, score };
  });

  scored.sort((a: any, b: any) => b.score - a.score);

  // Single candidate → always select it (no alternatives)
  if (scored.length === 1) {
    const only = scored[0];
    return {
      nationalCode: only.code,
      codePrecision: only.code.length,
      description: only.desc,
      confidence: Math.max(0.5, Math.min(0.85, 0.5 + only.score * 0.02)),
      method: 'pattern_single',
      aiCallCount: 0,
    };
  }

  const best = scored[0];
  if (best.score <= 0) {
    // No good match — find "other" as catch-all
    const catchAll = scored.find((s: any) =>
      s.desc.toLowerCase().includes('other') || (s.patterns || []).includes('CATCH_ALL')
    );
    if (catchAll) {
      return {
        nationalCode: catchAll.code,
        codePrecision: catchAll.code.length,
        description: catchAll.desc,
        confidence: 0.5,
        method: 'pattern_catch_all',
        aiCallCount: 0,
      };
    }
    return null; // Fall through to DB
  }

  const confidence = Math.min(0.95, 0.4 + best.score * 0.03);

  return {
    nationalCode: best.code,
    codePrecision: best.code.length,
    description: best.desc,
    confidence,
    method: best.score >= 10 ? 'pattern_strong' : 'pattern_match',
    aiCallCount: 0,
  };
}

async function dbFallback(
  hs6: string,
  keywords: string[],
  countryCode: string
): Promise<CountryAgentResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { nationalCode: hs6, codePrecision: 6, description: 'No DB', confidence: 0.3, method: 'exact_match', aiCallCount: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('gov_tariff_schedules')
      .select('hs_code, description')
      .eq('country', countryCode)
      .like('hs_code', `${hs6}%`)
      .order('hs_code');

    if (error || !data || data.length === 0) {
      return { nationalCode: hs6, codePrecision: 6, description: 'No subdivision', confidence: 0.5, method: 'exact_match', aiCallCount: 0 };
    }

    if (data.length === 1) {
      const code = String(data[0].hs_code).replace(/\./g, '');
      return { nationalCode: code, codePrecision: code.length, description: data[0].description || '', confidence: 0.9, method: 'exact_match', aiCallCount: 0 };
    }

    // Simple keyword scoring fallback
    const scored = data.map((row: Record<string, unknown>) => {
      const code = String(row.hs_code).replace(/\./g, '');
      const desc = String(row.description || '').toLowerCase();
      let score = 0;
      for (const kw of keywords) { if (desc.includes(kw)) score += 2; }
      if (desc.includes('other') || desc.includes('not elsewhere')) score -= 1;
      return { code, description: String(row.description || ''), score };
    });

    scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    const best = scored[0];

    return {
      nationalCode: best.code,
      codePrecision: best.code.length,
      description: best.description,
      confidence: best.score > 0 ? Math.min(0.9, 0.5 + best.score * 0.1) : 0.4,
      method: 'db_keyword_match',
      aiCallCount: 0,
    };
  } catch {
    return { nationalCode: hs6, codePrecision: 6, description: 'DB error', confidence: 0.3, method: 'exact_match', aiCallCount: 0 };
  }
}
