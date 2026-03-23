/**
 * LLM Call Utility — shared by all GRI Steps that need AI.
 * Uses OpenAI GPT-4o-mini for cost-efficiency.
 */

interface LLMCallOptions {
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
  timeoutMs?: number;
}

interface LLMCallResult<T> {
  data: T | null;
  raw: string;
  tokensUsed: number;
  error?: string;
}

let totalTokensUsed = 0;

export function getTotalTokensUsed(): number {
  return totalTokensUsed;
}

export function resetTokenCounter(): void {
  totalTokensUsed = 0;
}

export async function callLLM<T = Record<string, unknown>>(
  options: LLMCallOptions
): Promise<LLMCallResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { data: null, raw: '', tokensUsed: 0, error: 'OPENAI_API_KEY not set' };
  }

  const maxRetries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 15000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const messages: { role: string; content: string }[] = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.userPrompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: options.temperature ?? 0,
          max_tokens: options.maxTokens ?? 300,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown');
        if (attempt < maxRetries) continue;
        return { data: null, raw: '', tokensUsed: 0, error: `API ${response.status}: ${errText.substring(0, 100)}` };
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      const tokens = result.usage?.total_tokens || 0;
      totalTokensUsed += tokens;

      try {
        const parsed = JSON.parse(content) as T;
        return { data: parsed, raw: content, tokensUsed: tokens };
      } catch {
        if (attempt < maxRetries) continue;
        return { data: null, raw: content, tokensUsed: tokens, error: 'JSON parse failed' };
      }
    } catch (err) {
      if (attempt < maxRetries) continue;
      return {
        data: null, raw: '', tokensUsed: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  return { data: null, raw: '', tokensUsed: 0, error: 'Max retries exceeded' };
}
