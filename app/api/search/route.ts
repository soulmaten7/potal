import { NextResponse } from 'next/server';
import { getSearchService } from '../../lib/search/SearchService';

/**
 * POTAL Search API — /api/search
 *
 * Uses SearchService pipeline:
 * Provider → FraudFilter → AI Filter → CostEngine → ScoringEngine
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

  console.log(`🔍 [POTAL API] Search: "${q}" | page=${page} | zip=${zipcode || 'N/A'} | market=${market}`);

  try {
    const searchService = getSearchService();
    const result = await searchService.search(q, page, {
      zipcode: zipcode || undefined,
      market,
    });

    console.log(`✅ [POTAL API] Results: ${result.total} products (${result.metadata.domesticCount} domestic, ${result.metadata.internationalCount} global)`);

    if (result.metadata.fraudStats) {
      console.log(`🛡️ [POTAL API] Fraud: ${result.metadata.fraudStats.removed} removed, ${result.metadata.fraudStats.flagged} flagged`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [POTAL API] Search error:', error);
    return NextResponse.json({
      results: [],
      total: 0,
      metadata: { domesticCount: 0, internationalCount: 0 },
    });
  }
}
