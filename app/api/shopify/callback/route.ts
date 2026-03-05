/**
 * POTAL — Shopify OAuth Callback
 *
 * GET /api/shopify/callback?code=xxx&hmac=xxx&shop=xxx&state=xxx
 *
 * Shopify에서 셀러가 권한 승인 후 리다이렉트되는 엔드포인트.
 * authorization code를 access token으로 교환하고 DB에 저장합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyShopifyHmac,
  exchangeCodeForToken,
  saveShopToken,
  isValidShopDomain,
  installScriptTag,
  getShopifyConfig,
} from '@/app/lib/shopify/shopify-auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { shop, code, state, hmac } = params;

  // ━━━ 1. 파라미터 검증 ━━━
  if (!shop || !code || !state || !hmac) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  if (!isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 400 }
    );
  }

  // ━━━ 2. HMAC 검증 ━━━
  if (!verifyShopifyHmac(params)) {
    return NextResponse.json(
      { error: 'HMAC verification failed' },
      { status: 401 }
    );
  }

  // ━━━ 3. Nonce (state) 검증 — CSRF 방지 ━━━
  const cookieStore = await cookies();
  const savedNonce = cookieStore.get('shopify_nonce')?.value;

  if (!savedNonce || savedNonce !== state) {
    return NextResponse.json(
      { error: 'Invalid state parameter (nonce mismatch)' },
      { status: 401 }
    );
  }

  // Nonce 쿠키 삭제
  cookieStore.delete('shopify_nonce');

  // ━━━ 4. Access Token 교환 ━━━
  const tokenResult = await exchangeCodeForToken(shop, code);

  if (!tokenResult) {
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for access token' },
      { status: 500 }
    );
  }

  // ━━━ 5. DB에 저장 ━━━
  const saved = await saveShopToken(shop, tokenResult.accessToken, tokenResult.scope);

  if (!saved) {
    console.error(`[POTAL Shopify] Failed to save token for ${shop}`);
    // 저장 실패해도 계속 진행 (유저 경험 우선)
  }

  // ━━━ 6. Script Tag으로 위젯 설치 (선택사항) ━━━
  // Theme App Extension이 있으면 불필요하지만, 폴백으로 설치
  // TODO: 셀러의 POTAL API key를 자동 생성하거나 연결
  // installScriptTag(shop, tokenResult.accessToken, 'seller_api_key');

  // ━━━ 7. POTAL 대시보드로 리다이렉트 ━━━
  const config = getShopifyConfig();
  const redirectUrl = new URL('/dashboard', config.appUrl);
  redirectUrl.searchParams.set('shopify', 'installed');
  redirectUrl.searchParams.set('shop', shop);

  return NextResponse.redirect(redirectUrl.toString());
}
