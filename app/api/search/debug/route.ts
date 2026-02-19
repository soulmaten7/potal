import { NextResponse } from 'next/server';

/**
 * POTAL Debug API — /api/search/debug
 *
 * 각 Provider API를 직접 호출하여 raw 응답을 확인하는 진단 도구.
 *
 * 사용법:
 *   /api/search/debug?q=earbuds           — 전체 Provider 테스트
 *   /api/search/debug?q=earbuds&only=target  — Target만 테스트
 *   /api/search/debug?q=earbuds&only=temu    — Temu만 테스트
 *   /api/search/debug?q=earbuds&raw=true     — raw 응답 포함 (디버깅)
 *
 * ⚠️ 진단 완료 후 삭제 권장
 */

// ── Raw API test functions (Provider 클래스를 거치지 않고 직접 호출) ──

async function testTargetRaw(q: string) {
  const apiKey = process.env.RAPIDAPI_KEY || '';
  const host = process.env.RAPIDAPI_HOST_TARGET || 'target-com-shopping-api.p.rapidapi.com';
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host };

  // 여러 파라미터 조합 테스트
  const variations = [
    { label: 'keyword only', url: `https://${host}/product_search?keyword=${encodeURIComponent(q)}` },
    { label: 'keyword + store_id', url: `https://${host}/product_search?keyword=${encodeURIComponent(q)}&store_id=3991` },
    { label: 'keyword + pricing_store_id', url: `https://${host}/product_search?keyword=${encodeURIComponent(q)}&pricing_store_id=3991` },
    { label: 'keyword + count', url: `https://${host}/product_search?keyword=${encodeURIComponent(q)}&count=20` },
  ];

  const results = [];
  for (const v of variations) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(v.url, { headers, signal: controller.signal });
      clearTimeout(timer);

      const text = await res.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { /* not json */ }

      results.push({
        label: v.label,
        status: res.status,
        statusText: res.statusText,
        responsePreview: text.slice(0, 500),
        topKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as Record<string, unknown>).slice(0, 10) : null,
        hasProducts: parsed && typeof parsed === 'object'
          ? Boolean(
              (parsed as any)?.data?.search_response?.items?.length ||
              (parsed as any)?.data?.products?.length ||
              (parsed as any)?.products?.length ||
              (parsed as any)?.search?.search_response?.products?.length
            )
          : false,
      });
    } catch (err) {
      results.push({
        label: v.label,
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

async function testTemuRaw(q: string) {
  const token = process.env.APIFY_API_TOKEN || '';
  if (!token) return { error: 'APIFY_API_TOKEN not set' };

  const actorId = 'amit123~temu-products-scraper';
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQueries: [q], maxProducts: 5 }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }

    return {
      status: res.status,
      statusText: res.statusText,
      isArray: Array.isArray(parsed),
      itemCount: Array.isArray(parsed) ? parsed.length : 'N/A',
      responsePreview: text.slice(0, 800),
      firstItemKeys: Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object'
        ? Object.keys(parsed[0])
        : null,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function testBestBuyRaw(q: string) {
  const apiKey = process.env.RAPIDAPI_KEY || '';
  const host = process.env.RAPIDAPI_HOST_BESTBUY || 'bestbuy-usa.p.rapidapi.com';
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host };

  try {
    const url = `https://${host}/search?query=${encodeURIComponent(q)}&page=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }

    return {
      status: res.status,
      statusText: res.statusText,
      responsePreview: text.slice(0, 800),
      topKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed as Record<string, unknown>) : null,
      dataType: parsed && typeof parsed === 'object' && (parsed as any).data
        ? typeof (parsed as any).data === 'object'
          ? `object with keys: ${Object.keys((parsed as any).data).join(', ')}`
          : typeof (parsed as any).data
        : 'no data field',
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function testEbayRaw(q: string) {
  const apiKey = process.env.RAPIDAPI_KEY || '';
  const host = process.env.RAPIDAPI_HOST_EBAY || 'real-time-ebay-data.p.rapidapi.com';
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host };

  try {
    const url = `https://${host}/searchByKeywords?keywords=${encodeURIComponent(q)}&page=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    const text = await res.text();
    const isCaptcha = text.includes('challenge') || text.includes('captcha') || text.includes('splashui');

    return {
      status: res.status,
      statusText: res.statusText,
      isCaptcha,
      responsePreview: text.slice(0, 500),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'wireless earbuds';
  const only = searchParams.get('only')?.toLowerCase();
  const showRaw = searchParams.get('raw') === 'true';

  const results: Record<string, unknown> = {
    query: q,
    timestamp: new Date().toISOString(),
    env: {
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? `✅ ${process.env.RAPIDAPI_KEY.slice(0, 8)}...` : '❌ NOT SET',
      RAPIDAPI_HOST_TARGET: process.env.RAPIDAPI_HOST_TARGET || '❌ NOT SET',
      RAPIDAPI_HOST_BESTBUY: process.env.RAPIDAPI_HOST_BESTBUY || '❌ NOT SET',
      RAPIDAPI_HOST_EBAY: process.env.RAPIDAPI_HOST_EBAY || '❌ NOT SET',
      APIFY_API_TOKEN: process.env.APIFY_API_TOKEN ? `✅ ${process.env.APIFY_API_TOKEN.slice(0, 12)}...` : '❌ NOT SET',
    },
  };

  // 문제있는 Provider만 raw 테스트
  const tests: Record<string, unknown> = {};

  if (!only || only === 'target') {
    tests.target = await testTargetRaw(q);
  }
  if (!only || only === 'temu') {
    tests.temu = await testTemuRaw(q);
  }
  if (!only || only === 'bestbuy') {
    tests.bestbuy = await testBestBuyRaw(q);
  }
  if (!only || only === 'ebay') {
    tests.ebay = await testEbayRaw(q);
  }

  results.rawTests = tests;

  // showRaw가 아니면 responsePreview 제거 (간결 모드)
  if (!showRaw) {
    const cleanTests = JSON.parse(JSON.stringify(tests));
    for (const key of Object.keys(cleanTests)) {
      const test = cleanTests[key];
      if (Array.isArray(test)) {
        for (const item of test) {
          delete item.responsePreview;
        }
      } else if (test && typeof test === 'object') {
        delete test.responsePreview;
      }
    }
    results.rawTests = cleanTests;
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
