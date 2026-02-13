import { NextResponse } from 'next/server';
import { getCoordinator } from '../../lib/agent/Coordinator';

/**
 * POTAL Search API — /api/search
 *
 * Agent Orchestration 기반:
 * Coordinator가 상황에 따라 AI Agent와 Tool을 선택적으로 호출.
 *
 *   [Coordinator]
 *     ├── QueryAnalysis (현재: deterministic → 향후: AI Agent)
 *     ├── ProviderAPIs  (Tool: Amazon, Walmart, etc.)
 *     ├── FraudFilter   (Tool: 규칙 기반, $0)
 *     ├── AIFilter      (AI Agent: 관련성 판단, 비용 발생)
 *     ├── CostEngine    (Tool: 세금/관세 계산, $0)
 *     └── ScoringEngine (Tool: Best/Fastest/Cheapest, $0)
 *
 * Query params:
 *   q        - search query (required)
 *   page     - pagination (default: 1)
 *   zipcode  - US zipcode for tax calculation
 *   market   - 'all' | 'domestic' | 'global' (default: all)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const zipcode = searchParams.get('zipcode') || '';
  const market = (searchParams.get('market') || 'all') as 'all' | 'domestic' | 'global';

  if (!q.trim()) {
    return NextResponse.json({
      results: [],
      total: 0,
      metadata: { domesticCount: 0, internationalCount: 0 },
    });
  }

  try {
    const coordinator = getCoordinator();
    const result = await coordinator.search({
      originalQuery: q,
      page,
      zipcode: zipcode || undefined,
      market,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [POTAL API] Coordinator error:', error);
    return NextResponse.json({
      results: [],
      total: 0,
      metadata: { domesticCount: 0, internationalCount: 0 },
    });
  }
}
