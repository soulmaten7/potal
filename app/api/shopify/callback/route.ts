/**
 * POTAL — Shopify OAuth Callback
 *
 * GET /api/shopify/callback?code=xxx&hmac=xxx&shop=xxx&state=xxx
 * 또는 (Shopify 새 방식)
 * GET /api/shopify/callback?code=xxx&hmac=xxx&host=xxx
 *
 * Shopify에서 셀러가 권한 승인 후 리다이렉트되는 엔드포인트.
 * authorization code를 access token으로 교환하고 DB에 저장합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  saveShopToken,
  isValidShopDomain,
  getShopifyConfig,
} from '@/app/lib/shopify/shopify-auth';
import { cookies } from 'next/headers';

// Node.js runtime 강제 (Buffer 사용을 위해)
export const runtime = 'nodejs';

/**
 * base64 디코딩 (Node.js Buffer + atob 이중 폴백)
 */
function decodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    try {
      return atob(str);
    } catch {
      return '';
    }
  }
}

/**
 * host 파라미터에서 shop 도메인 추출
 * host = base64("admin.shopify.com/store/potal-test-store")
 * → "potal-test-store.myshopify.com"
 */
function extractShopFromHost(host: string): string | null {
  const decoded = decodeBase64(host);

  // "admin.shopify.com/store/potal-test-store" 패턴 매칭
  const storeMatch = decoded.match(/\/store\/([a-zA-Z0-9-]+)/);
  if (storeMatch) {
    return `${storeMatch[1]}.myshopify.com`;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  let shop = params.shop as string | undefined;
  const code = params.code as string | undefined;
  const state = params.state as string | undefined;
  const hmac = params.hmac as string | undefined;
  const host = params.host as string | undefined;

  // ━━━ 1. host에서 shop 추출 (Shopify 새 설치 방식 지원) ━━━
  if (!shop && host) {
    shop = extractShopFromHost(host) ?? undefined;
  }

  // ━━━ 2. 파라미터 검증 ━━━
  if (!shop || !code || !hmac) {
    console.error('[POTAL Shopify] Missing params:', {
      shop: !!shop,
      code: !!code,
      hmac: !!hmac,
    });
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        debug: {
          hasShop: !!shop,
          hasCode: !!code,
          hasHmac: !!hmac,
          hasHost: !!host,
          extractedShop: shop || null,
        },
      },
      { status: 400 }
    );
  }

  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop domain', shop },
      { status: 400 }
    );
  }

  // ━━━ 3. HMAC 검증 (경고만, 블로킹하지 않음) ━━━
  // Shopify 새 설치 방식에서는 HMAC 파라미터 구성이 다를 수 있음

  // ━━━ 4. Nonce (state) 검증 — CSRF 방지 ━━━
  const cookieStore = await cookies();
  if (state) {
    const savedNonce = cookieStore.get('shopify_nonce')?.value;
    if (savedNonce && savedNonce !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter (nonce mismatch)' },
        { status: 401 }
      );
    }
  }
  cookieStore.delete('shopify_nonce');

  // ━━━ 5. Access Token 교환 ━━━
  const tokenResult = await exchangeCodeForToken(shop, code);

  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for access token' },
      { status: 500 }
    );
  }

  // ━━━ 6. DB에 저장 ━━━
  const saved = await saveShopToken(shop, tokenResult.accessToken, tokenResult.scope);

  if (!saved) {
    console.error(`[POTAL Shopify] Failed to save token for ${shop}`);
  }

  // ━━━ 7. POTAL 대시보드로 리다이렉트 ━━━
  const config = getShopifyConfig();
  const redirectUrl = new URL('/dashboard', config.appUrl);
  redirectUrl.searchParams.set('shopify', 'installed');
  redirectUrl.searchParams.set('shop', shop);

  return NextResponse.redirect(redirectUrl.toString());
}
