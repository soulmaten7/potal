/**
 * Intent Router API
 * ━━━━━━━━━━━━━━━━━━
 * 얇은 API 래퍼. 실제 프롬프트 → app/lib/ai/prompts/intent-router.ts
 *
 * POST /api/intent
 * Body: { query: string }
 * Response: { intent, confidence, searchQuery, attributes, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/app/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query?: string };

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const result = await classifyIntent({ query: query.trim() });

    return NextResponse.json({
      ...result.data,
      meta: {
        durationMs: result.meta.durationMs,
        estimatedCost: result.meta.estimatedCost,
        usedFallback: result.meta.usedFallback,
        moduleVersion: 'intent-router@1.0.0',
      },
    });
  } catch (err) {
    console.error('Intent route error:', err);
    return NextResponse.json({
      intent: 'PRODUCT_CATEGORY',
      confidence: 0.3,
      searchQuery: '',
      attributes: [],
      priceSignal: null,
      suggestedCategories: null,
      comparisonTargets: null,
    });
  }
}
