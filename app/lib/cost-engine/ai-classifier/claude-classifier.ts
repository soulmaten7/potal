/**
 * POTAL AI HS Code Classifier — Claude API
 *
 * 상품명을 입력받아 Claude AI를 통해 HS Code (최대 10자리)로 분류합니다.
 * 키워드 매칭으로 분류가 안 되거나 confidence가 낮을 때 AI 폴백으로 사용.
 *
 * 비용: 콜당 ~$0.003~$0.01 (Claude 3.5 Sonnet 기준)
 * 속도: 1~3초 (네트워크 포함)
 *
 * 지원 AI 프로바이더: Anthropic Claude, OpenAI GPT (설정 가능)
 */

import type { HsClassificationResult } from '../hs-code/types';

// ─── Configuration ────────────────────────────────

export interface AiClassifierConfig {
  /** AI 분류 활성화 여부 */
  enabled: boolean;
  /** AI 프로바이더 선택 */
  provider: 'anthropic' | 'openai';
  /** API 타임아웃 (밀리초) */
  timeoutMs: number;
  /** 최소 confidence 기준 (이 이하면 AI 호출) */
  minConfidenceThreshold: number;
  /** 캐시 최대 보존 기간 (일) */
  maxCacheAgeDays: number;
}

export function getAiClassifierConfig(): AiClassifierConfig {
  return {
    enabled: process.env.AI_CLASSIFIER_ENABLED !== 'false',
    provider: (process.env.AI_CLASSIFIER_PROVIDER as 'anthropic' | 'openai') || 'anthropic',
    timeoutMs: parseInt(process.env.AI_CLASSIFIER_TIMEOUT_MS || '10000', 10),
    minConfidenceThreshold: parseFloat(process.env.AI_CLASSIFIER_MIN_CONFIDENCE || '0.6'),
    maxCacheAgeDays: parseInt(process.env.AI_CLASSIFIER_MAX_CACHE_AGE_DAYS || '30', 10),
  };
}

// ─── AI Classification Prompt ─────────────────────

const SYSTEM_PROMPT = `You are an expert in Harmonized System (HS) product classification, trained on WCO HS 2022 Edition standards and country-specific tariff schedules (US HTS, UK Trade Tariff, EU TARIC).

Your job: Given a product name/description, return the most accurate HS Code classification at the MAXIMUM possible precision level.

Rules:
1. Return HS Code up to 10 digits whenever possible. Use dots for readability (e.g., "6404.11.00.90").
   - First 6 digits: international HS standard (mandatory)
   - Digits 7-8: subheading (provide if you can determine)
   - Digits 9-10: tariff line (provide if you can determine)
   - If uncertain about country-specific digits (7-10), return 6 digits and set confidence accordingly.
2. Provide confidence score from 0.0 to 1.0 based on how certain you are.
   - 0.9+: Exact product match to known tariff line
   - 0.7-0.9: Strong match at 6-digit level, uncertain about deeper digits
   - 0.5-0.7: Reasonable classification but product is ambiguous
3. Provide up to 3 alternative HS codes if the product could fall under multiple categories.
4. Use the latest HS 2022 nomenclature.
5. For ambiguous products, prefer the most commonly used classification in international trade.
6. Always include the chapter description in your response.

Respond ONLY in valid JSON format. No markdown, no code blocks, no explanation outside JSON.`;

function buildUserPrompt(productName: string, category?: string): string {
  let prompt = `Classify this product to an HS Code:\n\nProduct: "${productName}"`;
  if (category) {
    prompt += `\nCategory hint: "${category}"`;
  }
  prompt += `\n\nRespond in this exact JSON format:
{
  "hsCode": "XXXX.XX.XX.XX",
  "description": "HS Code description",
  "confidence": 0.95,
  "chapter": "XX",
  "chapterDescription": "Chapter description",
  "alternatives": [
    {"hsCode": "YYYY.YY.YY.YY", "description": "Alt description", "confidence": 0.80}
  ]
}`;
  return prompt;
}

// ─── AI Provider: Anthropic Claude ────────────────

async function classifyWithAnthropic(
  productName: string,
  category?: string,
  timeoutMs: number = 10000,
): Promise<AiRawResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[POTAL AI] ANTHROPIC_API_KEY not set, skipping AI classification');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Anthropic API 직접 호출 (SDK 없이도 동작하도록 fetch 사용)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt(productName, category) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POTAL AI] Anthropic API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) return null;

    // 사용 토큰 추적
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    const estimatedCost = tokensUsed * 0.000003; // ~$3/1M tokens for Sonnet

    return {
      rawText: content,
      tokensUsed,
      estimatedCostUsd: estimatedCost,
      provider: 'anthropic',
    };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.warn(`[POTAL AI] Anthropic API timeout after ${timeoutMs}ms`);
    } else {
      console.error('[POTAL AI] Anthropic API error:', error.message);
    }
    return null;
  }
}

// ─── AI Provider: OpenAI GPT ──────────────────────

async function classifyWithOpenAI(
  productName: string,
  category?: string,
  timeoutMs: number = 10000,
): Promise<AiRawResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[POTAL AI] OPENAI_API_KEY not set, skipping AI classification');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(productName, category) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POTAL AI] OpenAI API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
    const estimatedCost = tokensUsed * 0.00000015; // ~$0.15/1M tokens for gpt-4o-mini

    return {
      rawText: content,
      tokensUsed,
      estimatedCostUsd: estimatedCost,
      provider: 'openai',
    };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.warn(`[POTAL AI] OpenAI API timeout after ${timeoutMs}ms`);
    } else {
      console.error('[POTAL AI] OpenAI API error:', error.message);
    }
    return null;
  }
}

// ─── Response Parser ──────────────────────────────

interface AiRawResponse {
  rawText: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  provider: 'anthropic' | 'openai';
}

interface AiParsedClassification {
  hsCode: string;
  description: string;
  confidence: number;
  alternatives: { hsCode: string; description: string; confidence: number }[];
  tokensUsed: number;
  estimatedCostUsd: number;
  provider: string;
}

function parseAiResponse(raw: AiRawResponse): AiParsedClassification | null {
  try {
    // JSON 추출 (마크다운 코드블록 안에 있을 수도 있으므로 처리)
    let jsonStr = raw.rawText.trim();

    // ```json ... ``` 패턴 제거
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // HS Code 정규화: 점 제거, 숫자만
    const hsCode = (parsed.hsCode || '').replace(/\./g, '').replace(/[^0-9]/g, '');
    if (hsCode.length < 4 || hsCode.length > 10) {
      console.warn(`[POTAL AI] Invalid HS Code length: ${hsCode} (${hsCode.length} digits)`);
      return null;
    }

    // 대안 코드 파싱
    const alternatives = (parsed.alternatives || [])
      .slice(0, 3)
      .map((alt: any) => ({
        hsCode: (alt.hsCode || '').replace(/\./g, '').replace(/[^0-9]/g, ''),
        description: alt.description || '',
        confidence: Math.min(Math.max(parseFloat(alt.confidence) || 0, 0), 1),
      }))
      .filter((alt: any) => alt.hsCode.length >= 4);

    return {
      hsCode,
      description: parsed.description || parsed.chapterDescription || 'AI classified',
      confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
      alternatives,
      tokensUsed: raw.tokensUsed,
      estimatedCostUsd: raw.estimatedCostUsd,
      provider: raw.provider,
    };
  } catch (error) {
    console.error('[POTAL AI] Failed to parse AI response:', error, raw.rawText.substring(0, 200));
    return null;
  }
}

// ─── Main Classification Function ─────────────────

/**
 * AI를 사용해 상품을 HS Code로 분류합니다.
 *
 * @param productName - 상품명 (예: "Nike Air Max running shoes")
 * @param category - 카테고리 힌트 (예: "footwear")
 * @returns 분류 결과 또는 null (실패 시)
 */
export async function classifyWithAi(
  productName: string,
  category?: string,
): Promise<{
  result: HsClassificationResult;
  meta: { tokensUsed: number; estimatedCostUsd: number; provider: string };
} | null> {
  const config = getAiClassifierConfig();

  if (!config.enabled) {
    console.log('[POTAL AI] AI classifier disabled');
    return null;
  }

  // AI 프로바이더 선택
  let rawResponse: AiRawResponse | null = null;

  if (config.provider === 'anthropic') {
    rawResponse = await classifyWithAnthropic(productName, category, config.timeoutMs);
    // Anthropic 실패 시 OpenAI 폴백
    if (!rawResponse) {
      rawResponse = await classifyWithOpenAI(productName, category, config.timeoutMs);
    }
  } else {
    rawResponse = await classifyWithOpenAI(productName, category, config.timeoutMs);
    // OpenAI 실패 시 Anthropic 폴백
    if (!rawResponse) {
      rawResponse = await classifyWithAnthropic(productName, category, config.timeoutMs);
    }
  }

  if (!rawResponse) {
    console.warn('[POTAL AI] All AI providers failed for:', productName);
    return null;
  }

  // 응답 파싱
  const parsed = parseAiResponse(rawResponse);
  if (!parsed) {
    return null;
  }

  return {
    result: {
      hsCode: parsed.hsCode,
      description: parsed.description,
      confidence: parsed.confidence,
      method: 'ai',
      alternatives: parsed.alternatives,
    },
    meta: {
      tokensUsed: parsed.tokensUsed,
      estimatedCostUsd: parsed.estimatedCostUsd,
      provider: parsed.provider,
    },
  };
}
