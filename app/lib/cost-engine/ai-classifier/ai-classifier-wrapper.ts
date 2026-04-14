/**
 * POTAL AI Classifier Wrapper
 *
 * 폴백 체인 전체를 관리하는 오케스트레이터:
 * 1. DB 캐시 조회 (hs_classification_cache)
 * 2. 키워드 매칭 (기존 classifier.ts)
 * 3. AI API 호출 (claude-classifier.ts)
 * 4. 결과를 DB 캐시에 저장
 *
 * 같은 상품이 다시 들어오면 AI 호출 없이 DB에서 즉시 리턴 → 비용 $0
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { HsClassificationResult } from '../hs-code/types';
import { classifyProduct, classifyWithOverride } from '../hs-code/classifier';
import { classifyWithAi, getAiClassifierConfig } from './claude-classifier';
import { classifyWithVectorSearch, storeClassificationVector, getVectorSearchConfig } from './vector-search';
import { classifyV3 } from '../gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../gri-classifier/types';

// ─── CW33-S1: DB-driven classification overrides ───────────
//
// Replaces the CW32 `deterministicOverride()` regex function. Overrides
// now live in the `hs_classification_overrides` table and can be managed
// without redeploying the application. An in-memory LRU with a 10-minute
// TTL guards against latency on the hot path.
//
// Rules are ordered by `priority ASC` — lower number runs first. A rule
// hits when its pattern_regex matches the lowercased product name.

interface ClassificationOverrideRule {
  priority: number;
  patternRegex: RegExp;
  hsCode: string;
  description: string;
  confidence: number;
}

let overrideCache: { rules: ClassificationOverrideRule[]; loadedAt: number } | null = null;
const OVERRIDE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function loadClassificationOverrides(): Promise<ClassificationOverrideRule[]> {
  const now = Date.now();
  if (overrideCache && now - overrideCache.loadedAt < OVERRIDE_TTL_MS) {
    return overrideCache.rules;
  }
  const supabase = getSupabase();
  if (!supabase) return overrideCache?.rules ?? [];
  try {
    const { data, error } = await supabase
      .from('hs_classification_overrides')
      .select('priority, pattern_regex, hs_code, description, confidence')
      .eq('active', true)
      .order('priority', { ascending: true });
    if (error || !data) {
      console.warn('[HS Override] load failed:', error?.message);
      return overrideCache?.rules ?? [];
    }
    const rules: ClassificationOverrideRule[] = [];
    for (const row of data as any[]) {
      try {
        rules.push({
          priority: row.priority,
          patternRegex: new RegExp(row.pattern_regex, 'i'),
          hsCode: row.hs_code,
          description: row.description,
          confidence: Number(row.confidence) || 0.9,
        });
      } catch (e) {
        console.warn('[HS Override] bad regex:', row.pattern_regex, (e as Error).message);
      }
    }
    overrideCache = { rules, loadedAt: now };
    return rules;
  } catch (e) {
    console.warn('[HS Override] load failed:', (e as Error).message);
    return overrideCache?.rules ?? [];
  }
}

async function deterministicOverride(
  productName: string,
): Promise<HsClassificationResult | null> {
  if (!productName) return null;
  const rules = await loadClassificationOverrides();
  if (rules.length === 0) return null;
  const p = productName.toLowerCase();
  for (const rule of rules) {
    if (rule.patternRegex.test(p)) {
      return {
        hsCode: rule.hsCode,
        description: rule.description,
        confidence: rule.confidence,
        method: 'keyword',
        alternatives: [],
      };
    }
  }
  return null;
}

// ─── Supabase Client ──────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Hash Function ────────────────────────────────

/**
 * 상품명을 SHA256 해시로 변환 (DB 조회 키)
 * 같은 상품명은 항상 같은 해시 → 캐시 히트
 */
function hashProductName(productName: string, category?: string): string {
  const normalized = productName.toLowerCase().trim();
  const key = category ? `${normalized}::${category.toLowerCase()}` : normalized;
  return createHash('sha256').update(key).digest('hex');
}

// ─── DB Cache Operations ──────────────────────────

/**
 * DB 캐시에서 분류 결과 조회
 */
async function getFromCache(
  productNameHash: string,
  maxAgeDays: number,
): Promise<HsClassificationResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - maxAgeDays);

    const { data, error } = await supabase
      .from('hs_classification_cache')
      .select('hs_code, description, confidence, source, alternatives')
      .eq('product_name_hash', productNameHash)
      .is('invalidated_at', null)
      .gte('created_at', minDate.toISOString())
      .limit(1)
      .single();

    if (error || !data) return null;

    // 캐시 히트 카운트 증가 (비동기, 응답 블로킹 안 함)
    void (async () => {
      try {
        await supabase
          .from('hs_classification_cache')
          .update({ hit_count: ((data as any).hit_count || 0) + 1, last_hit_at: new Date().toISOString() })
          .eq('product_name_hash', productNameHash);
      } catch { /* ignore */ }
    })();

    return {
      hsCode: (data as any).hs_code,
      description: (data as any).description,
      confidence: parseFloat((data as any).confidence),
      method: (data as any).source === 'ai' ? 'ai' : 'keyword',
      alternatives: (data as any).alternatives || [],
    };
  } catch (error) {
    console.warn('[POTAL Cache] Cache lookup failed:', error);
    return null;
  }
}

/**
 * 분류 결과를 DB 캐시에 저장
 */
async function saveToCache(
  productName: string,
  productNameHash: string,
  result: HsClassificationResult,
  category?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('hs_classification_cache').upsert(
      {
        product_name_hash: productNameHash,
        product_name: productName,
        product_category: category || null,
        hs_code: result.hsCode,
        description: result.description,
        confidence: result.confidence,
        source: result.method,
        alternatives: result.alternatives || [],
        hit_count: 0,
        invalidated_at: null,
      },
      { onConflict: 'product_name_hash' }
    );
  } catch (error) {
    // 캐시 저장 실패는 치명적이지 않음 — 다음에 다시 AI 호출하면 됨
    console.warn('[POTAL Cache] Cache save failed:', error);
  }
}

/**
 * 외부 API 호출 로그 저장 (비용 추적용)
 */
async function logApiCall(
  provider: string,
  productName: string,
  tokensUsed: number,
  estimatedCostUsd: number,
  success: boolean,
  sellerId?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('external_api_logs').insert({
      api_provider: provider,
      api_endpoint: 'hs-classification',
      request_payload: { productName },
      response_status: success ? 200 : 500,
      tokens_used: tokensUsed,
      estimated_cost_usd: estimatedCostUsd,
      is_success: success,
      triggered_by_seller_id: sellerId || null,
    });
  } catch {
    // 로그 실패는 무시
  }
}

// ─── Main Async Classification ────────────────────

/**
 * 비동기 상품 분류 (전체 폴백 체인)
 *
 * 순서:
 * 1. DB 캐시 → 즉시 리턴 (10ms, 비용 $0)
 * 2. 키워드 매칭 → confidence >= 0.6이면 리턴 + 캐시 저장
 * 3. AI API → 결과 리턴 + 캐시 저장 (다음엔 AI 호출 없이 DB에서 리턴)
 * 4. 모두 실패 → 키워드 결과 그대로 리턴 (최소한의 결과)
 *
 * @param productName - 상품명
 * @param category - 카테고리 힌트
 * @param sellerId - 셀러 ID (API 비용 추적용)
 * @returns 분류 결과 + 소스 메타데이터
 */
export async function classifyProductAsync(
  productName: string,
  category?: string,
  sellerId?: string,
): Promise<HsClassificationResult & { classificationSource: string; chapterTreeHint?: unknown }> {
  const config = getAiClassifierConfig();
  const hash = hashProductName(productName, category);

  // ━━━ CW33-S1: DB-driven override (bypasses cache) ━━━
  const override = await deterministicOverride(productName);
  if (override) {
    return { ...override, classificationSource: 'override' };
  }

  // ━━━ Stage 0: DB Cache ━━━
  const cached = await getFromCache(hash, config.maxCacheAgeDays);
  if (cached) {
    return { ...cached, classificationSource: 'cache' };
  }

  // ━━━ Stage 1: Vector Search (cosine similarity, pgvector) ━━━
  const vectorConfig = getVectorSearchConfig();
  if (vectorConfig.enabled) {
    try {
      const vectorResult = await classifyWithVectorSearch(productName, category);
      if (vectorResult && vectorResult.confidence >= vectorConfig.minSimilarity) {
        await saveToCache(productName, hash, vectorResult, category);
        return { ...vectorResult, classificationSource: 'vector' };
      }
    } catch {
      // Vector search failed — continue to keyword
    }
  }

  // ━━━ Stage 2: Keyword Matching ━━━
  const keywordResult = classifyProduct(productName, category);

  if (keywordResult.confidence >= config.minConfidenceThreshold) {
    await saveToCache(productName, hash, keywordResult, category);
    return { ...keywordResult, classificationSource: 'keyword' };
  }

  // ━━━ Stage 3: LLM Fallback ━━━
  if (config.enabled) {
    const aiResult = await classifyWithAi(productName, category);

    if (aiResult) {
      await saveToCache(productName, hash, aiResult.result, category);

      await logApiCall(
        aiResult.meta.provider,
        productName,
        aiResult.meta.tokensUsed,
        aiResult.meta.estimatedCostUsd,
        true,
        sellerId,
      );

      // Store AI result as new vector for future similarity matches
      void storeClassificationVector(
        productName,
        aiResult.result.hsCode,
        category,
        'ai_classified',
        aiResult.result.confidence,
      );

      return { ...aiResult.result, classificationSource: 'ai' };
    }

    await logApiCall('ai_failed', productName, 0, 0, false, sellerId);
  }

  // ━━━ Stage 4: Fallback — keyword result as-is ━━━
  return { ...keywordResult, classificationSource: 'keyword_fallback' };
}

/**
 * 비동기 분류 (HS Code 오버라이드 지원, v3 pipeline 통합)
 *
 * 셀러가 직접 HS Code를 입력하면 그대로 사용,
 * 아니면 Stage 2 (v3 pipeline) → AI 폴백 체인으로 분류
 *
 * @param productName - 상품명 (필수)
 * @param hsCodeOverride - HS Code 직접 입력 (선택)
 * @param category - 카테고리 힌트 (선택)
 * @param sellerId - 셀러 ID (선택)
 * @param material - 재질 (Stage 2: v3 pipeline용)
 * @param originCountry - 원산지 국가코드 (Stage 2: v3 pipeline용)
 * @param destinationCountry - 목적지 국가코드 (Stage 2: v3 pipeline용)
 */
export async function classifyWithOverrideAsync(
  productName: string,
  hsCodeOverride?: string,
  category?: string,
  sellerId?: string,
  material?: string,
  originCountry?: string,
  destinationCountry?: string,
): Promise<HsClassificationResult & { classificationSource: string }> {
  // 셀러가 직접 HS Code 제공 → 그대로 사용
  if (hsCodeOverride) {
    const result = classifyWithOverride(productName, hsCodeOverride, category);
    return { ...result, classificationSource: 'manual' };
  }

  const config = getAiClassifierConfig();
  const hash = hashProductName(productName, category);

  // ━━━ CW33-S1: DB-driven override (bypasses cache) ━━━
  const override = await deterministicOverride(productName);
  if (override) {
    return { ...override, classificationSource: 'override' };
  }

  // ━━━ Stage 0: DB Cache ━━━
  const cached = await getFromCache(hash, config.maxCacheAgeDays);
  if (cached) {
    return { ...cached, classificationSource: 'cache' };
  }

  // ━━━ Stage 1: Vector Search (cosine similarity, pgvector) ━━━
  const vectorConfig = getVectorSearchConfig();
  if (vectorConfig.enabled) {
    try {
      const vectorResult = await classifyWithVectorSearch(productName, category);
      if (vectorResult && vectorResult.confidence >= vectorConfig.minSimilarity) {
        await saveToCache(productName, hash, vectorResult, category);
        return { ...vectorResult, classificationSource: 'vector' };
      }
    } catch {
      // Vector search failed — continue to v3 pipeline
    }
  }

  // ━━━ Stage 2: v3 Pipeline (codified rules + 5,621 subheadings) ━━━
  if (material && originCountry) {
    try {
      const v3Input: ClassifyInputV3 = {
        product_name: productName,
        material: material,
        origin_country: originCountry,
        destination_country: destinationCountry,
        category: category,
      };
      const v3Result = await classifyV3(v3Input);
      if (v3Result.final_hs_code && v3Result.confidence >= 0.7) {
        const hsResult: HsClassificationResult = {
          hsCode: v3Result.final_hs_code,
          description: v3Result.hs_code_precision === 'HS10'
            ? `[HS10] ${v3Result.confirmed_hs6 || ''}`
            : v3Result.confirmed_hs6 || '',
          confidence: v3Result.confidence,
          method: 'v3_pipeline',
          alternatives: [],
        };
        await saveToCache(productName, hash, hsResult, category);
        return { ...hsResult, classificationSource: 'v3-pipeline' };
      }
    } catch {
      // v3 pipeline failed — continue to keyword matching
    }
  }

  // ━━━ Stage 3: Keyword Matching ━━━
  const keywordResult = classifyProduct(productName, category);

  if (keywordResult.confidence >= config.minConfidenceThreshold) {
    await saveToCache(productName, hash, keywordResult, category);
    return { ...keywordResult, classificationSource: 'keyword' };
  }

  // ━━━ Stage 4: LLM Fallback ━━━
  if (config.enabled) {
    const aiResult = await classifyWithAi(productName, category);

    if (aiResult) {
      await saveToCache(productName, hash, aiResult.result, category);

      await logApiCall(
        aiResult.meta.provider,
        productName,
        aiResult.meta.tokensUsed,
        aiResult.meta.estimatedCostUsd,
        true,
        sellerId,
      );

      // Store AI result as new vector for future similarity matches
      void storeClassificationVector(
        productName,
        aiResult.result.hsCode,
        category,
        'ai_classified',
        aiResult.result.confidence,
      );

      return { ...aiResult.result, classificationSource: 'ai' };
    }

    await logApiCall('ai_failed', productName, 0, 0, false, sellerId);
  }

  // ━━━ Stage 5: Fallback — keyword result as-is ━━━
  return { ...keywordResult, classificationSource: 'keyword_fallback' };
}
