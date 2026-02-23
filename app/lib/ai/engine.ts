/**
 * ══════════════════════════════════════════════════════════════
 * POTAL AI Execution Engine
 * ══════════════════════════════════════════════════════════════
 *
 * 모든 프롬프트 모듈이 공유하는 실행 엔진.
 * 한 번 세팅하면 건드릴 필요 없음 — 프롬프트 수정은 각 모듈에서.
 *
 * 역할:
 * - OpenAI API 호출 (timeout, retry)
 * - JSON 파싱 + 검증
 * - 비용 추적
 * - Fallback 처리
 * - 로깅
 *
 * 사용법:
 *   import { executePrompt } from '@/app/lib/ai/engine';
 *   const result = await executePrompt<SmartFilterOutput>(config, messages, fallbackFn);
 * ══════════════════════════════════════════════════════════════
 */

import OpenAI from 'openai';
import type { PromptModuleConfig, PromptResult, FewShotExample } from './types';

// ━━━ OpenAI Client (Singleton) ━━━
let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// ━━━ 비용 계산 (gpt-4o-mini 기준) ━━━
const COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':  { input: 0.00000015, output: 0.0000006 },
  'gpt-4o':       { input: 0.0000025,  output: 0.00001 },
  'gpt-4-turbo':  { input: 0.00001,    output: 0.00003 },
};

// ━━━ Cumulative cost tracking (per-instance lifecycle) ━━━
let _cumulativeCost = 0;
let _totalCalls = 0;
const COST_ALERT_THRESHOLD = 1.00; // $1.00 per server lifecycle

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_TOKEN[model] ?? COST_PER_TOKEN['gpt-4o-mini'];
  const cost = inputTokens * rates.input + outputTokens * rates.output;

  _cumulativeCost += cost;
  _totalCalls++;

  if (_cumulativeCost > COST_ALERT_THRESHOLD) {
    console.warn(`⚠️ [AI Engine] Cumulative cost $${_cumulativeCost.toFixed(4)} exceeds threshold ($${COST_ALERT_THRESHOLD}). Total calls: ${_totalCalls}`);
  }

  return cost;
}

/** Get current AI cost stats */
export function getAICostStats(): { cumulativeCost: number; totalCalls: number } {
  return { cumulativeCost: _cumulativeCost, totalCalls: _totalCalls };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Core Execution Function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ExecuteOptions<T> {
  /** 프롬프트 모듈 설정 */
  config: PromptModuleConfig;
  /** System 프롬프트 */
  systemPrompt: string;
  /** User 메시지 */
  userMessage: string;
  /** Few-shot 예시 (선택) */
  fewShot?: FewShotExample[];
  /** AI 실패 시 fallback 결과 */
  fallback: () => T;
  /** 출력 파싱/검증 함수 */
  parseOutput: (raw: string) => T;
}

export async function executePrompt<T>(options: ExecuteOptions<T>): Promise<PromptResult<T>> {
  const { config, systemPrompt, userMessage, fewShot, fallback, parseOutput } = options;
  const startTime = Date.now();

  // API 키 없음 → graceful fallback
  const client = getClient();
  if (!client) {
    return buildResult(config, fallback(), startTime, true, 'No OPENAI_API_KEY');
  }

  // 메시지 구성: System → Few-shot → User
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Few-shot examples 추가
  if (fewShot && fewShot.length > 0) {
    for (const ex of fewShot) {
      messages.push({ role: 'user', content: ex.user });
      messages.push({ role: 'assistant', content: ex.assistant });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  // AI 호출 + Timeout
  try {
    const aiCall = client.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`TIMEOUT_${config.timeoutMs}ms`)), config.timeoutMs);
    });

    const completion = await Promise.race([aiCall, timeoutPromise]);

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return buildResult(config, fallback(), startTime, true, 'Empty AI response');
    }

    // 토큰 사용량
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    // JSON 파싱 (마크다운 펜스 방어 — 중첩 펜스도 처리)
    let cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // 추가 방어: JSON이 아닌 텍스트가 앞뒤에 붙은 경우
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    let parsed: T;
    try {
      parsed = parseOutput(cleaned);
    } catch (parseErr) {
      const parseMsg = parseErr instanceof Error ? parseErr.message : 'Unknown parse error';
      console.warn(`⚠️ [${config.id} v${config.version}] parseOutput failed: ${parseMsg} | Raw: ${cleaned.slice(0, 200)}`);
      return buildResult(config, fallback(), startTime, true, `Parse error: ${parseMsg}`);
    }

    return {
      ok: true,
      data: parsed,
      meta: {
        moduleId: config.id,
        durationMs: Date.now() - startTime,
        tokensUsed: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        estimatedCost: estimateCost(config.model, inputTokens, outputTokens),
        usedFallback: false,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    if (errorMsg.startsWith('TIMEOUT_')) {
      console.warn(`⚠️ [${config.id} v${config.version}] Timeout (${config.timeoutMs}ms) — using fallback`);
    } else {
      console.error(`❌ [${config.id} v${config.version}] Error:`, errorMsg);
    }

    return buildResult(config, fallback(), startTime, true, errorMsg);
  }
}

// ━━━ Helper: 결과 객체 생성 ━━━
function buildResult<T>(
  config: PromptModuleConfig,
  data: T,
  startTime: number,
  usedFallback: boolean,
  error?: string,
): PromptResult<T> {
  return {
    ok: !usedFallback,
    data,
    meta: {
      moduleId: config.id,
      durationMs: Date.now() - startTime,
      tokensUsed: { input: 0, output: 0, total: 0 },
      estimatedCost: 0,
      usedFallback,
      error,
    },
  };
}
