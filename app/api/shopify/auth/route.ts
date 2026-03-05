/**
 * POTAL — Shopify OAuth Install Endpoint
 *
 * GET /api/shopify/auth?shop=mystore.myshopify.com
 *
 * Shopify App Store에서 "Install" 클릭 시 호출됨.
 * Shopify OAuth 페이지로 리다이렉트합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl, generateNonce, isValidShopDomain } from '@/app/lib/shopify/shopify-auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  // Shop 도메인 검증
  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop parameter. Expected format: mystore.myshopify.com' },
      { status: 400 }
    );
  }

  // CSRF 방지용 nonce 생성 → 쿠키에 저장
  const nonce = generateNonce();

  const cookieStore = await cookies();
  cookieStore.set('shopify_nonce', nonce, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10분
    path: '/',
  });

  // Shopify OAuth 페이지로 리다이렉트
  const authUrl = buildAuthUrl(shop, nonce);

  return NextResponse.redirect(authUrl);
}
