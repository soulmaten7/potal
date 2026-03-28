/**
 * GRI Classification Pipeline — 11-step orchestrator.
 *
 * Executes Steps 1-11 sequentially, tracking decision path and AI calls.
 */

import type {
  GriProductInput, GriClassificationResult, DecisionStep,
} from './types';
import { extractKeywords } from './steps/step01-keyword-extract';
import { matchSections } from './steps/step02-section-match';
import { checkSectionNotes } from './steps/step03-section-note-check';
import { matchChapters } from './steps/step04-chapter-match';
import { checkChapterNotes } from './steps/step05-chapter-note-check';
import { matchHeadings } from './steps/step06-heading-match';
import { searchDbCache } from './steps/step00-db-cache';
import { resetTokenCounter, getTotalTokensUsed } from './utils/llm-call';
import { resolveConflict } from './steps/step07-conflict-resolve';
import { matchSubheading } from './steps/step08-subheading-match';
import { routeCountry } from './steps/step09-country-router';
import { applyPriceBreak } from './steps/step10-price-break';
import { finalResolve, hashProductName } from './steps/step11-final-resolve';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Check GRI classification cache.
 */
async function checkCache(cacheKey: string): Promise<GriClassificationResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('gri_classification_cache')
      .select('*')
      .eq('product_name_hash', cacheKey.split('_')[0])
      .eq('destination_country', cacheKey.split('_')[1] || 'XX')
      .single();

    if (error || !data) return null;

    return {
      hsCode: data.hs_code,
      hsCodePrecision: data.hs_code_precision as 'HS10' | 'HS8' | 'HS6',
      description: data.description || '',
      confidence: parseFloat(data.confidence) || 0.8,
      decisionPath: data.decision_path || [],
      griRulesApplied: data.gri_rules_applied || [],
      classificationMethod: 'gri_pipeline',
      aiCallCount: data.ai_call_count || 0,
      processingTimeMs: 0, // Will be overwritten
    };
  } catch {
    return null;
  }
}

/**
 * Save result to GRI classification cache.
 */
async function saveCache(cacheKey: string, result: GriClassificationResult): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const [hash, country] = cacheKey.split('_');
    await supabase.from('gri_classification_cache').upsert({
      product_name_hash: hash,
      destination_country: country || 'XX',
      hs_code: result.hsCode,
      hs_code_precision: result.hsCodePrecision,
      description: result.description,
      confidence: result.confidence,
      decision_path: result.decisionPath,
      gri_rules_applied: result.griRulesApplied,
      ai_call_count: result.aiCallCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_name_hash,destination_country' });
  } catch {
    // Cache save failure is not critical
  }
}

function stepTime(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Main GRI classification pipeline.
 */
export async function classifyWithGRI(
  input: GriProductInput,
  options?: { skipCache?: boolean }
): Promise<GriClassificationResult> {
  const startTime = Date.now();
  const decisionPath: DecisionStep[] = [];
  const griRulesApplied: { rule: string; reason: string }[] = [];
  let aiCallCount = 0;

  resetTokenCounter();

  // Step 0: GRI cache check
  const cacheKey = hashProductName(input.productName) + '_' + (input.destinationCountry || 'XX');
  if (!options?.skipCache) {
    const cached = await checkCache(cacheKey);
    if (cached) {
      return { ...cached, processingTimeMs: Date.now() - startTime };
    }
  }

  // Step 0.5: DB product_hs_mappings search
  if (!options?.skipCache) {
    try {
      const dbResult = await searchDbCache(input.productName);
      if (dbResult && dbResult.confidence >= 0.9) {
        return { ...dbResult, processingTimeMs: Date.now() - startTime };
      }
    } catch {
      // DB cache search failed, continue with pipeline
    }
  }

  // Step 1: Keyword extraction (LLM + code merged)
  let stepStart = Date.now();
  const step1 = await extractKeywords({
    productName: input.productName,
    description: input.description,
    material: input.material,
  });
  if (step1.productUnderstood) aiCallCount++; // LLM was called
  decisionPath.push({
    step: 1, name: 'keyword_extract',
    input: input.productName.substring(0, 50),
    output: `${step1.productUnderstood?.substring(0, 40) || step1.keywords.slice(0, 5).join(', ')}`,
    method: step1.productUnderstood ? 'ai' : 'code',
    timeMs: stepTime(stepStart),
  });

  // Step 2: Section matching (LLM with keyword fallback)
  stepStart = Date.now();
  const step2 = await matchSections(step1, input);
  aiCallCount++; // LLM called in step 2
  decisionPath.push({
    step: 2, name: 'section_match',
    input: input.productName.substring(0, 50),
    output: step2.map(s => `S${s.section}(${s.score.toFixed(1)})`).join(', '),
    method: 'ai', timeMs: stepTime(stepStart),
  });
  griRulesApplied.push({ rule: 'GRI 1', reason: 'Section matching by LLM understanding' });

  // Step 3: Section Note check
  stepStart = Date.now();
  const step3 = checkSectionNotes(step2, step1);
  decisionPath.push({
    step: 3, name: 'section_note_check',
    input: `${step2.length} candidates`,
    output: `${step3.validSections.length} valid, ${step3.excludedSections.length} excluded`,
    method: 'code', timeMs: stepTime(stepStart),
  });

  // Step 4: Chapter matching (LLM with keyword fallback)
  stepStart = Date.now();
  const step4 = await matchChapters(step3.validSections, step1, input);
  aiCallCount++;
  decisionPath.push({
    step: 4, name: 'chapter_match',
    input: `Section ${step3.validSections[0]?.section || '?'}`,
    output: step4.map(c => `Ch${c.chapter}(${c.score.toFixed(1)})`).join(', '),
    method: 'ai', timeMs: stepTime(stepStart),
  });

  // Step 5: Chapter Note check
  stepStart = Date.now();
  const step5 = checkChapterNotes(step4, step1);
  decisionPath.push({
    step: 5, name: 'chapter_note_check',
    input: `${step4.length} candidates`,
    output: `${step5.validChapters.length} valid, ${step5.excludedChapters.length} excluded`,
    method: 'code', timeMs: stepTime(stepStart),
  });

  // Step 6: Heading matching (LLM with keyword fallback)
  stepStart = Date.now();
  const step6 = await matchHeadings(step5.validChapters, step1, input);
  aiCallCount++;
  decisionPath.push({
    step: 6, name: 'heading_match',
    input: `Ch${step5.validChapters[0]?.chapter || '?'}`,
    output: step6.headingCandidates.map(h => `${h.heading}(${h.score.toFixed(1)})`).slice(0, 3).join(', '),
    method: 'ai', timeMs: stepTime(stepStart),
  });

  // Step 7: Conflict resolution (may call AI)
  let resolvedHeading = step6.headingCandidates[0]?.heading || '0000';
  let resolutionMethod = 'direct';

  // Guard: heading must be 4 digits (prevents "null", undefined, etc.)
  if (!/^\d{4}$/.test(resolvedHeading)) resolvedHeading = '0000';

  if (step6.needsConflictResolution && step6.headingCandidates.length >= 2) {
    stepStart = Date.now();
    const step7 = await resolveConflict(step6.headingCandidates, step1, input);
    const candidate = step7.resolvedHeading;
    resolvedHeading = /^\d{4}$/.test(candidate) ? candidate : resolvedHeading;
    resolutionMethod = step7.method;
    if (step7.aiCalled) aiCallCount++;
    if (step7.griRuleApplied) {
      griRulesApplied.push({ rule: step7.griRuleApplied, reason: step7.reasoning });
    }
    decisionPath.push({
      step: 7, name: 'conflict_resolve',
      input: step6.headingCandidates.map(h => h.heading).join(' vs '),
      output: `${resolvedHeading} (${step7.method})`,
      method: step7.aiCalled ? 'ai' : step7.method === 'pattern_match' ? 'pattern_match' : 'code',
      timeMs: stepTime(stepStart),
    });
  } else {
    decisionPath.push({
      step: 7, name: 'conflict_resolve',
      input: 'no conflict',
      output: resolvedHeading,
      method: 'code', timeMs: 0,
    });
  }

  // Step 8: Subheading matching (LLM with keyword fallback)
  stepStart = Date.now();
  const step8 = await matchSubheading(resolvedHeading, step1, input.price, input);
  aiCallCount++;
  decisionPath.push({
    step: 8, name: 'subheading_match',
    input: resolvedHeading,
    output: step8.hs6,
    method: 'ai', timeMs: stepTime(stepStart),
  });
  griRulesApplied.push({ rule: 'GRI 6', reason: 'Subheading classification via LLM' });

  // Step 9: Country routing
  stepStart = Date.now();
  const step9 = await routeCountry(
    step8.hs6, input.destinationCountry, step1.keywords, input.price, input.productName
  );
  decisionPath.push({
    step: 9, name: 'country_router',
    input: input.destinationCountry || 'none',
    output: step9 ? `${step9.nationalCode} (${step9.method})` : 'default (6-digit)',
    method: 'code', timeMs: stepTime(stepStart),
  });
  if (step9?.aiCallCount) aiCallCount += step9.aiCallCount;

  // Step 10: Price break
  stepStart = Date.now();
  const candidates = step9 ? [step9.nationalCode] : [step8.hs6];
  const step10 = await applyPriceBreak(candidates, input.price);
  decisionPath.push({
    step: 10, name: 'price_break',
    input: `price=${input.price || 'none'}`,
    output: step10.priceBreakApplied ? `applied: ${step10.rule}` : 'none',
    method: 'code', timeMs: stepTime(stepStart),
  });

  // Step 11: Final resolution
  const alternatives = step6.headingCandidates.slice(1, 4).map(h => ({
    hsCode: h.heading + '00',
    description: h.description,
    confidence: Math.max(0, h.score * 0.1),
    rejectionReason: resolutionMethod === 'pattern_match'
      ? 'Conflict pattern selected different heading'
      : 'Lower keyword match score',
  }));

  const result = finalResolve({
    hs6: step8.hs6,
    hs6Description: step8.description,
    confidence: step8.confidence,
    countryResult: step9,
    decisionPath,
    griRulesApplied,
    aiCallCount,
    startTime,
    productName: input.productName,
    alternatives,
  });

  // Save to cache (non-blocking)
  if (!options?.skipCache) {
    saveCache(cacheKey, result).catch(() => {});
  }

  return result;
}
