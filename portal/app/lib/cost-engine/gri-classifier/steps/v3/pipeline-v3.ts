/**
 * v3 Pipeline — Orchestrator
 * Step 0 → 1 → 2(2-1~2-4) → 3(Heading) → 3-2(Subheading) → 4(Country) → 5(Price Break) → 6(Final)
 * AI calls: 0. All classification via code + codified rules + DB lookup.
 */

import type { ClassifyInputV3, V3PipelineResult, V3DecisionStep } from '../../types';
import { validateAndNormalize } from './step0-input';
import { lookupCache, saveToCache } from './step1-cache';
import { selectSectionCandidates } from './step2-1-section-candidate';
import { verifySectionWithNotes } from './step2-2-section-notes';
import { selectChapterCandidates } from './step2-3-chapter-candidate';
import { verifyChapterWithNotes } from './step2-4-chapter-notes';
import { getHeadingsForChapter } from './heading-lookup';
import { selectHeading } from './step3-heading';
import { selectSubheading } from './step4-subheading';
import { routeToCountry } from './step5-country-router';
import { applyPriceBreakV3 } from './step6-price-break';
import { finalResolveV3 } from './step7-final';

export async function classifyV3(input: ClassifyInputV3): Promise<V3PipelineResult> {
  const startTime = Date.now();
  const decisionPath: V3DecisionStep[] = [];

  // ── Step 0: Input Validation & Normalization ──
  const t0 = Date.now();
  const normalized = validateAndNormalize(input);
  decisionPath.push({
    step: 'Step 0: Input',
    input_summary: `product="${input.product_name}", material="${input.material}", origin="${input.origin_country}"`,
    output_summary: `primary_material="${normalized.material_primary}", keywords=[${normalized.material_keywords.join(',')}], processing=[${normalized.processing_states.join(',')}]`,
    rules_applied: [],
    time_ms: Date.now() - t0,
  });

  // ── Step 1: Cache Lookup ──
  const t1 = Date.now();
  const cached = await lookupCache(normalized);
  if (cached) {
    decisionPath.push({
      step: 'Step 1: Cache',
      input_summary: `key=${normalized.product_name}|${normalized.material_primary}`,
      output_summary: 'CACHE HIT',
      rules_applied: [],
      time_ms: Date.now() - t1,
    });
    return { ...cached, decision_path: decisionPath, processing_time_ms: Date.now() - startTime };
  }
  decisionPath.push({
    step: 'Step 1: Cache',
    input_summary: `key=${normalized.product_name}|${normalized.material_primary}`,
    output_summary: 'CACHE MISS → proceed',
    rules_applied: [],
    time_ms: Date.now() - t1,
  });

  // ── Step 2-1: Section Candidate Selection ──
  const t21 = Date.now();
  const step21 = selectSectionCandidates(normalized);
  decisionPath.push({
    step: 'Step 2-1: Section Candidates',
    input_summary: `material=[${normalized.material_keywords.join(',')}], category=[${normalized.category_tokens.join(',')}]`,
    output_summary: step21.section_candidates.map(c => `S${c.section}(${c.score.toFixed(2)},${c.matched_by})`).join(' | '),
    rules_applied: step21.section_candidates.map(c => c.matched_by),
    time_ms: Date.now() - t21,
  });

  // ── Step 2-2: Section Notes Verification ──
  const t22 = Date.now();
  const step22 = verifySectionWithNotes(normalized, step21);
  decisionPath.push({
    step: 'Step 2-2: Section Notes',
    input_summary: `candidates=[${step21.section_candidates.map(c => `S${c.section}`).join(',')}]`,
    output_summary: `confirmed=S${step22.confirmed_section}, hints=[${step22.chapter_hints.map(h => `Ch${h.chapter}`).join(',')}]`,
    rules_applied: step22.rules_applied.map(r => `${r.source}:${r.type}`),
    time_ms: Date.now() - t22,
  });

  // ── Step 2-3: Chapter Candidate Selection ──
  const t23 = Date.now();
  const step23 = selectChapterCandidates(normalized, step22);
  decisionPath.push({
    step: 'Step 2-3: Chapter Candidates',
    input_summary: `section=${step22.confirmed_section}`,
    output_summary: step23.chapter_candidates.map(c => `Ch${c.chapter}(${c.score.toFixed(2)})`).join(' | '),
    rules_applied: step23.chapter_candidates.map(c => c.matched_by),
    time_ms: Date.now() - t23,
  });

  // ── Step 2-4: Chapter Notes Verification ──
  const t24 = Date.now();
  const step24 = verifyChapterWithNotes(normalized, step23);
  decisionPath.push({
    step: 'Step 2-4: Chapter Notes',
    input_summary: `candidates=[${step23.chapter_candidates.map(c => `Ch${c.chapter}`).join(',')}]`,
    output_summary: `confirmed=Ch${step24.confirmed_chapter}`,
    rules_applied: step24.rules_applied.map(r => `${r.source}:${r.type}`),
    time_ms: Date.now() - t24,
  });

  // ── Heading Lookup ──
  const headings = getHeadingsForChapter(step24.confirmed_chapter);

  // ── Step 3: Heading Selection ──
  const t3 = Date.now();
  const step3 = selectHeading(normalized, step24.confirmed_chapter, headings);
  decisionPath.push({
    step: 'Step 3: Heading',
    input_summary: `Ch${step24.confirmed_chapter}, ${headings.length} headings`,
    output_summary: `${step3.confirmed_heading} "${step3.heading_description.substring(0, 50)}" (${step3.matched_by}, conf=${step3.confidence.toFixed(2)})`,
    rules_applied: [step3.matched_by],
    time_ms: Date.now() - t3,
  });

  // ── Step 4: Subheading Selection ──
  const t4 = Date.now();
  const step4 = selectSubheading(normalized, step3.confirmed_heading, step3.subheadings);
  decisionPath.push({
    step: 'Step 4: Subheading',
    input_summary: `${step3.confirmed_heading}, ${step3.subheadings.length} subheadings`,
    output_summary: `${step4.confirmed_hs6} "${step4.hs6_description.substring(0, 50)}" (${step4.matched_by}, conf=${step4.confidence.toFixed(2)})`,
    rules_applied: [step4.matched_by],
    time_ms: Date.now() - t4,
  });

  // ── HS6 confidence (Step 0~3-2) ──
  const confidence = Math.min(
    step21.section_candidates[0]?.score || 0,
    step23.chapter_candidates[0]?.score || 0,
    step3.confidence,
    step4.confidence
  );

  // ── Step 4: Country Router ──
  const t5 = Date.now();
  const step5 = await routeToCountry(
    step4.confirmed_hs6,
    input.destination_country,
    normalized,
    input.price,
    input.product_name
  );
  decisionPath.push({
    step: 'Step 4: Country Router',
    input_summary: `hs6=${step4.confirmed_hs6}, dest=${input.destination_country || 'none'}`,
    output_summary: step5.country_result
      ? `${step5.country_result.nationalCode} (${step5.country_result.method}, conf=${step5.country_result.confidence.toFixed(2)})`
      : `${step5.destination_country} → HS6 only (${step5.is_supported ? 'DB error' : 'unsupported'})`,
    rules_applied: step5.country_result ? [step5.country_result.method] : ['hs6_passthrough'],
    time_ms: Date.now() - t5,
  });

  // ── Step 5: Price Break ──
  const t6 = Date.now();
  const codeForPriceBreak = step5.country_result?.nationalCode || step4.confirmed_hs6;
  const step6 = await applyPriceBreakV3(codeForPriceBreak, input.price, input.destination_country);
  decisionPath.push({
    step: 'Step 5: Price Break',
    input_summary: `code=${codeForPriceBreak}, price=${input.price ?? 'none'}`,
    output_summary: step6.price_break_applied
      ? `APPLIED: ${step6.rule_description}`
      : 'NO PRICE BREAK',
    rules_applied: step6.price_break_applied ? ['price_break'] : [],
    time_ms: Date.now() - t6,
  });

  // ── Step 6: Final Resolution ──
  const finalResult = await finalResolveV3({
    hs6: step4.confirmed_hs6,
    hs6_description: step4.hs6_description,
    confidence,
    country_result: step5.country_result,
    price_break_applied: step6.price_break_applied,
    price_break_code: step6.price_break_applied ? step6.final_hs_code : undefined,
    price_break_duty: step6.duty_rate,
    ai_call_count: 0,
    start_time: startTime,
    destination_country: input.destination_country,
  });
  decisionPath.push({
    step: 'Step 6: Final',
    input_summary: `hs6=${step4.confirmed_hs6}, country=${step5.country_result?.nationalCode || 'none'}, priceBreak=${step6.price_break_applied}`,
    output_summary: `FINAL: ${finalResult.final_hs_code} (${finalResult.hs_code_precision}, conf=${finalResult.confidence.toFixed(2)})`,
    rules_applied: ['final_resolve'],
    time_ms: finalResult.processing_time_ms,
  });

  // ── Build result ──
  const result: V3PipelineResult = {
    confirmed_section: step22.confirmed_section,
    confirmed_chapter: step24.confirmed_chapter,
    confirmed_heading: step3.confirmed_heading,
    confirmed_hs6: step4.confirmed_hs6,
    final_hs_code: finalResult.final_hs_code,
    hs_code_precision: finalResult.hs_code_precision,
    country_specific: finalResult.country_specific,
    price_break_applied: finalResult.price_break_applied,
    price_break_rule: step6.rule_description,
    ai_call_count: finalResult.ai_call_count,
    headings_list: headings,
    confidence: finalResult.confidence,
    decision_path: decisionPath,
    cache_hit: false,
    processing_time_ms: finalResult.processing_time_ms,
  };

  // Save to cache (fire-and-forget)
  saveToCache(normalized, result).catch(() => {});

  return result;
}
