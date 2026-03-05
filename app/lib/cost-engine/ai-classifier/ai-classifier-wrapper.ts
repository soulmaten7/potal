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
): Promise<HsClassificationResult & { classificationSource: string }> {
  const config = getAiClassifierConfig();
  const hash = hashProductName(productName, category);

  // ━━━ 1단계: DB 캐시 조회 ━━━
  const cached = await getFromCache(hash, config.maxCacheAgeDays);
  if (cached) {
    console.log(`[POTAL] Cache HIT for "${productName}" → ${cached.hsCode}`);
    return { ...cached, classificationSource: 'cache' };
  }

  // ━━━ 2단계: 키워드 매칭 (기존 로직) ━━━
  const keywordResult = classifyProduct(productName, category);

  if (keywordResult.confidence >= config.minConfidenceThreshold) {
    console.log(`[POTAL] Keyword match for "${productName}" → ${keywordResult.hsCode} (${keywordResult.confidence})`);
    // 키워드 결과도 캐시에 저장 (다음엔 DB에서 바로 리턴)
    await saveToCache(productName, hash, keywordResult, category);
    return { ...keywordResult, classificationSource: 'keyword' };
  }

  // ━━━ 3단계: AI 분류 ━━━
  if (config.enabled) {
    console.log(`[POTAL] Keyword confidence too low (${keywordResult.confidence}), calling AI for "${productName}"`);

    const aiResult = await classifyWithAi(productName, category);

    if (aiResult) {
      // AI 결과를 캐시에 저장 → 다음 요청부터 AI 호출 없이 DB 리턴
      await saveToCache(productName, hash, aiResult.result, category);

      // API 호출 로그 저장 (비용 추적)
      await logApiCall(
        aiResult.meta.provider,
        productName,
        aiResult.meta.tokensUsed,
        aiResult.meta.estimatedCostUsd,
        true,
        sellerId,
      );

      console.log(`[POTAL] AI classified "${productName}" → ${aiResult.result.hsCode} (${aiResult.result.confidence}) via ${aiResult.meta.provider}`);
      return { ...aiResult.result, classificationSource: 'ai' };
    }

    // AI 실패 로그
    await logApiCall('ai_failed', productName, 0, 0, false, sellerId);
  }

  // ━━━ 4단계: 폴백 — 키워드 결과 그대로 리턴 ━━━
  console.log(`[POTAL] Fallback to keyword for "${productName}" → ${keywordResult.hsCode}`);
  // 낮은 confidence라도 캐시에 저장 (다음에 다시 시도할 수 있도록 짧은 TTL)
  return { ...keywordResult, classificationSource: 'keyword_fallback' };
}

/**
 * 비동기 분류 (HS Code 오버라이드 지원)
 *
 * 셀러가 직접 HS Code를 입력하면 그대로 사용,
 * 아니면 AI 폴백 체인으로 분류
 */
export async function classifyWithOverrideAsync(
  productName: string,
  hsCodeOverride?: string,
  category?: string,
  sellerId?: string,
): Promise<HsClassificationResult & { classificationSource: string }> {
  // 셀러가 직접 HS Code 제공 → 그대로 사용
  if (hsCodeOverride) {
    const result = classifyWithOverride(productName, hsCodeOverride, category);
    return { ...result, classificationSource: 'manual' };
  }

  // AI 폴백 체인으로 분류
  return classifyProductAsync(productName, category, sellerId);
}
