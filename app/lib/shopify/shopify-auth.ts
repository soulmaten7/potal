/**
 * POTAL — Shopify App Authentication
 *
 * Shopify OAuth 2.0 플로우 + HMAC 검증 + 토큰 관리
 *
 * 설치 플로우:
 * 1. 셀러가 Shopify App Store에서 POTAL 앱 설치 클릭
 * 2. /api/shopify/auth → Shopify OAuth 페이지로 리다이렉트
 * 3. 셀러가 권한 승인
 * 4. /api/shopify/callback → access_token 발급 → DB 저장
 * 5. POTAL 대시보드로 리다이렉트 (앱 설정 페이지)
 *
 * 필수 환경변수:
 * - SHOPIFY_API_KEY: Shopify App API key
 * - SHOPIFY_API_SECRET: Shopify App API secret
 * - SHOPIFY_SCOPES: 앱 권한 (read_products,write_script_tags,read_themes,write_themes)
 * - NEXT_PUBLIC_APP_URL: 앱 URL (https://www.potal.app)
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ─── Configuration ──────────────────────────────────

export interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string;
  appUrl: string;
}

export function getShopifyConfig(): ShopifyConfig {
  return {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,read_themes,write_themes,write_script_tags',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.potal.app',
  };
}

// ─── Supabase Client ────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── HMAC Verification ──────────────────────────────

/**
 * Shopify 요청의 HMAC 서명 검증
 * Shopify는 모든 요청에 HMAC 파라미터를 포함시킴
 */
export function verifyShopifyHmac(query: Record<string, string>): boolean {
  const config = getShopifyConfig();
  if (!config.apiSecret) return false;

  const hmac = query.hmac;
  if (!hmac) return false;

  // hmac 파라미터를 제외한 나머지를 정렬하여 메시지 생성
  const params = { ...query };
  delete params.hmac;

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', config.apiSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(computedHmac, 'hex')
  );
}

/**
 * Shopify Webhook의 HMAC 검증
 */
export function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const config = getShopifyConfig();
  if (!config.apiSecret) return false;

  const computedHmac = crypto
    .createHmac('sha256', config.apiSecret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmacHeader),
    Buffer.from(computedHmac)
  );
}

// ─── OAuth Flow ─────────────────────────────────────

/**
 * Shopify OAuth 인증 URL 생성
 */
export function buildAuthUrl(shop: string, nonce: string): string {
  const config = getShopifyConfig();
  const redirectUri = `${config.appUrl}/api/shopify/callback`;

  const params = new URLSearchParams({
    client_id: config.apiKey,
    scope: config.scopes,
    redirect_uri: redirectUri,
    state: nonce,
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Authorization code를 access token으로 교환
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string,
): Promise<{ accessToken: string; scope: string } | null> {
  const config = getShopifyConfig();

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.apiKey,
        client_secret: config.apiSecret,
        code,
      }),
    });

    if (!response.ok) {
      console.error(`[POTAL Shopify] Token exchange failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      scope: data.scope,
    };
  } catch (error) {
    console.error('[POTAL Shopify] Token exchange error:', error);
    return null;
  }
}

// ─── Shop Storage (Supabase) ────────────────────────

/**
 * Shopify 스토어 정보를 DB에 저장/업데이트
 */
export async function saveShopToken(
  shop: string,
  accessToken: string,
  scope: string,
  sellerId?: string,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('shopify_stores')
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        scope,
        seller_id: sellerId || null,
        installed_at: new Date().toISOString(),
        uninstalled_at: null,
        is_active: true,
      }, { onConflict: 'shop_domain' });

    if (error) {
      console.error('[POTAL Shopify] Save shop token error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[POTAL Shopify] Save shop token error:', error);
    return false;
  }
}

/**
 * 스토어의 access token 조회
 */
export async function getShopToken(shop: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop_domain', shop)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * 앱 삭제 시 스토어 비활성화
 */
export async function markShopUninstalled(shop: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('shopify_stores')
      .update({
        is_active: false,
        uninstalled_at: new Date().toISOString(),
      })
      .eq('shop_domain', shop);
  } catch (error) {
    console.error('[POTAL Shopify] Mark uninstalled error:', error);
  }
}

// ─── Shopify Admin API ──────────────────────────────

/**
 * Shopify Admin API 호출 헬퍼
 */
export async function shopifyAdminApi(
  shop: string,
  accessToken: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const url = `https://${shop}/admin/api/2024-10/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Script Tag으로 POTAL 위젯 설치
 * (Theme App Extension이 안 될 때 폴백용)
 */
export async function installScriptTag(
  shop: string,
  accessToken: string,
  potalApiKey: string,
): Promise<boolean> {
  const config = getShopifyConfig();

  try {
    await shopifyAdminApi(shop, accessToken, 'script_tags.json', 'POST', {
      script_tag: {
        event: 'onload',
        src: `${config.appUrl}/widget/potal-widget.js?apiKey=${potalApiKey}`,
        display_scope: 'all',
      },
    });
    console.log(`[POTAL Shopify] Script tag installed for ${shop}`);
    return true;
  } catch (error) {
    console.error('[POTAL Shopify] Script tag install error:', error);
    return false;
  }
}

// ─── Nonce Management ───────────────────────────────

/**
 * 랜덤 nonce 생성 (CSRF 방지)
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Shop 도메인 검증 (security)
 */
export function isValidShopDomain(shop: string): boolean {
  // myshop.myshopify.com 형식 검증
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
