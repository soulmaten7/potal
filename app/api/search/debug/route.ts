import { NextResponse } from 'next/server';

/**
 * POTAL Debug API — /api/search/debug
 *
 * 각 Provider를 개별적으로 테스트하여 어떤 것이 작동하는지 진단.
 * 사용법: https://potal.app/api/search/debug?q=earbuds
 *
 * ⚠️ 프로덕션에서 장시간 유지하지 마세요 — 진단 완료 후 삭제 권장
 */

import { AmazonProvider } from '../../../lib/search/providers/AmazonProvider';
import { WalmartProvider } from '../../../lib/search/providers/WalmartProvider';
import { BestBuyProvider } from '../../../lib/search/providers/BestBuyProvider';
import { EbayProvider } from '../../../lib/search/providers/EbayProvider';
import { TargetProvider } from '../../../lib/search/providers/TargetProvider';
import { AliExpressProvider } from '../../../lib/search/providers/AliExpressProvider';
import { TemuProvider } from '../../../lib/search/providers/TemuProvider';

const providers = [
  { name: 'Amazon', provider: new AmazonProvider() },
  { name: 'Walmart', provider: new WalmartProvider() },
  { name: 'BestBuy', provider: new BestBuyProvider() },
  { name: 'eBay', provider: new EbayProvider() },
  { name: 'Target', provider: new TargetProvider() },
  { name: 'AliExpress', provider: new AliExpressProvider() },
  { name: 'Temu', provider: new TemuProvider() },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'wireless earbuds';
  const only = searchParams.get('only'); // optional: test single provider

  const results: Record<string, unknown> = {
    query: q,
    timestamp: new Date().toISOString(),
    env: {
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? `${process.env.RAPIDAPI_KEY.slice(0, 8)}...` : '❌ NOT SET',
      RAPIDAPI_HOST_BESTBUY: process.env.RAPIDAPI_HOST_BESTBUY || '❌ NOT SET',
      RAPIDAPI_HOST_TARGET: process.env.RAPIDAPI_HOST_TARGET || '❌ NOT SET',
      RAPIDAPI_HOST_AMAZON: process.env.RAPIDAPI_HOST_AMAZON || '❌ NOT SET',
      RAPIDAPI_HOST_WALMART: process.env.RAPIDAPI_HOST_WALMART || '❌ NOT SET',
      RAPIDAPI_HOST_EBAY: process.env.RAPIDAPI_HOST_EBAY || '❌ NOT SET',
      RAPIDAPI_HOST_ALIEXPRESS: process.env.RAPIDAPI_HOST_ALIEXPRESS || '❌ NOT SET',
      APIFY_API_TOKEN: process.env.APIFY_API_TOKEN ? `${process.env.APIFY_API_TOKEN.slice(0, 12)}...` : '❌ NOT SET',
    },
    providers: {} as Record<string, unknown>,
  };

  const testProviders = only
    ? providers.filter(p => p.name.toLowerCase() === only.toLowerCase())
    : providers;

  // Test each provider individually with 15s timeout
  const providerResults = await Promise.allSettled(
    testProviders.map(async ({ name, provider }) => {
      const start = Date.now();
      try {
        const products = await Promise.race([
          provider.search(q, 1),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout (15s)')), 15000)
          ),
        ]);
        const duration = Date.now() - start;
        return {
          name,
          status: products.length > 0 ? '✅ OK' : '⚠️ Empty',
          count: products.length,
          duration: `${duration}ms`,
          sample: products.slice(0, 2).map(p => ({
            name: (p.name || '').slice(0, 60),
            price: p.price,
            site: p.site,
          })),
        };
      } catch (err) {
        const duration = Date.now() - start;
        return {
          name,
          status: '❌ Error',
          count: 0,
          duration: `${duration}ms`,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  for (const result of providerResults) {
    if (result.status === 'fulfilled') {
      (results.providers as Record<string, unknown>)[result.value.name] = result.value;
    } else {
      // This shouldn't happen but just in case
      (results.providers as Record<string, unknown>)['unknown'] = {
        status: '❌ Promise rejected',
        error: result.reason?.message,
      };
    }
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
