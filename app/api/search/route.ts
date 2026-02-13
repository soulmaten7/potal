import { NextResponse } from 'next/server';
import { getCoordinator } from '../../lib/agent/Coordinator';
import { getSearchCache, SearchCache } from '../../lib/search/SearchCache';

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
 * 개선사항:
 *   - In-memory 캐시 (동일 쿼리 중복 방지, TTL 5분)
 *   - Timeout 처리 (15초 제한)
 *   - 에러 분류 (timeout, provider, unknown)
 *   - Cache-Control 헤더
 *
 * Query params:
 *   q        - search query (required)
 *   page     - pagination (default: 1)
 *   zipcode  - US zipcode for tax calculation
 *   market   - 'all' | 'domestic' | 'global' (default: all)
 */

const SEARCH_TIMEOUT_MS = 15_000; // 15초

/** Promise에 타임아웃을 적용하는 유틸 */
function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const emptyResult = {
  results: [],
  total: 0,
  metadata: { domesticCount: 0, internationalCount: 0 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const zipcode = searchParams.get('zipcode') || '';
  const market = (searchParams.get('market') || 'all') as 'all' | 'domestic' | 'global';

  if (!q.trim()) {
    return NextResponse.json(emptyResult);
  }

  // ── 캐시 확인 ──
  const cache = getSearchCache();
  const cacheKey = SearchCache.buildKey(q, page, market, zipcode || undefined);
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log(`⚡ [POTAL API] Cache HIT: "${q}" page=${page}`);
    return NextResponse.json(cached, {
      headers: {
        'X-POTAL-Cache': 'HIT',
        'Cache-Control': 'private, max-age=300', // 5분
      },
    });
  }

  // ── 검색 실행 (with timeout) ──
  try {
    const coordinator = getCoordinator();

    const result = await withTimeout(
      coordinator.search({
        originalQuery: q,
        page,
        zipcode: zipcode || undefined,
        market,
      }),
      SEARCH_TIMEOUT_MS,
      'Coordinator.search',
    );

    // ── 캐시 저장 (결과가 있을 때만) ──
    if (result.results.length > 0) {
      cache.set(cacheKey, result);
    }

    return NextResponse.json(result, {
      headers: {
        'X-POTAL-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isTimeout = errMsg.includes('timed out');

    console.error(`❌ [POTAL API] ${isTimeout ? 'Timeout' : 'Error'}: ${errMsg}`);

    // 에러 응답에도 유용한 정보 포함
    return NextResponse.json(
      {
        ...emptyResult,
        error: isTimeout
          ? 'Search took too long. Please try again.'
          : 'Something went wrong. Please try again.',
        errorType: isTimeout ? 'timeout' : 'unknown',
      },
      {
        status: isTimeout ? 504 : 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
