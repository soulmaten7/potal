/**
 * AI Smart Suggestion API
 * ━━━━━━━━━━━━━━━━━━━━━━━━
 * 이 파일은 얇은 API 래퍼(thin wrapper).
 * 실제 프롬프트 로직은 → app/lib/ai/prompts/smart-filter.ts
 * 프롬프트를 수정하려면 그 파일만 수정하면 됨. 이 파일은 안건드려도 됨.
 *
 * POST /api/ai-suggestions
 * Body: { query: string, titles: string[] }
 * Response: { brands, axes, keywords (하위호환), detectedCategory, meta }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSmartFilters } from '@/app/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, titles } = body as { query?: string; titles?: string[] };

    if (!query?.trim() || !titles?.length) {
      return NextResponse.json({ brands: [], axes: [], keywords: [] });
    }

    // 프롬프트 모듈 실행 (timeout, fallback, 비용추적 모두 engine에서 처리)
    const result = await generateSmartFilters({ query, titles });

    return NextResponse.json({
      brands: result.data.brands,
      axes: result.data.axes,
      keywords: result.data.keywords, // 하위호환: axes의 values를 flat으로 합친 것
      detectedCategory: result.data.detectedCategory,
      meta: {
        durationMs: result.meta.durationMs,
        estimatedCost: result.meta.estimatedCost,
        usedFallback: result.meta.usedFallback,
        moduleVersion: 'smart-filter@3.0.0',
      },
    });
  } catch (err) {
    console.error('AI Suggestion route error:', err);
    return NextResponse.json({ brands: [], axes: [], keywords: [] });
  }
}
