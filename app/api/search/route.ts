import { NextResponse } from 'next/server';
import { getSearchService } from '@/app/lib/search/SearchService';

/**
 * GET /api/search?q=query&page=1
 * - SearchService 사용: Amazon 메인, 에러/빈 결과 시 Mock 폴백
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const page = Number(searchParams.get('page')) || 1;

  if (!q || !String(q).trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const queryTrimmed = String(q).trim();
  try {
    const service = getSearchService();
    const { results, total, metadata } = await service.search(queryTrimmed, page);
    return NextResponse.json({
      results,
      total,
      metadata,
    });
  } catch (error) {
    console.error('❌ GET /api/search error:', error);
    return NextResponse.json(
      {
        results: [],
        total: 0,
        metadata: { domesticCount: 0, internationalCount: 0 },
        error: 'Search failed',
      },
      { status: 500 }
    );
  }
}
