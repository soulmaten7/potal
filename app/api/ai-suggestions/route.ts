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
    const { query, titles, products } = body as {
      query?: string;
      titles?: string[];
      products?: Array<{ title: string; price?: string; site?: string }>;
    };

    if (!query?.trim() || (!titles?.length && !products?.length)) {
      return NextResponse.json({ brands: [], axes: [], keywords: [] });
    }

    // v4.0: products 데이터가 있으면 함께 전달 (더 정확한 필터 생성)
    const result = await generateSmartFilters({
      query,
      titles: titles || [],
      products,
    });

    return NextResponse.json({
      brands: result.data.brands,
      axes: result.data.axes,
      keywords: result.data.keywords, // 하위호환: axes의 values를 flat으로 합친 것
      detectedCategory: result.data.detectedCategory,
      meta: {
        durationMs: result.meta.durationMs,
        estimatedCost: result.meta.estimatedCost,
        usedFallback: result.meta.usedFallback,
        moduleVersion: 'smart-filter@4.0.0',
      },
    });
  } catch (err) {
    console.error('AI Suggestion route error:', err);
    return NextResponse.json({ brands: [], axes: [], keywords: [] });
  }
}
