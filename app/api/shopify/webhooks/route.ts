/**
 * POTAL — Shopify Webhook Handler
 *
 * POST /api/shopify/webhooks
 *
 * Shopify 필수 웹훅 처리:
 * - app/uninstalled: 앱 삭제 시 토큰 무효화
 * - customers/data_request: GDPR 고객 데이터 요청
 * - customers/redact: GDPR 고객 데이터 삭제
 * - shop/redact: GDPR 스토어 데이터 삭제
 *
 * 이 4개 웹훅은 Shopify App Store 제출 시 필수입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook, markShopUninstalled } from '@/app/lib/shopify/shopify-auth';

export async function POST(req: NextRequest) {
  // ━━━ 1. Raw body 읽기 (HMAC 검증용) ━━━
  const rawBody = await req.text();

  // ━━━ 2. HMAC 검증 ━━━
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader || !verifyShopifyWebhook(rawBody, hmacHeader)) {
    console.warn('[POTAL Shopify] Webhook HMAC verification failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ━━━ 3. 웹훅 토픽 확인 ━━━
  const topic = req.headers.get('x-shopify-topic');
  const shopDomain = req.headers.get('x-shopify-shop-domain');

  console.log(`[POTAL Shopify] Webhook received: ${topic} from ${shopDomain}`);

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = {};
  }

  // ━━━ 4. 토픽별 처리 ━━━
  switch (topic) {
    case 'app/uninstalled':
      await handleAppUninstalled(shopDomain || '', body);
      break;

    case 'customers/data_request':
      await handleCustomersDataRequest(shopDomain || '', body);
      break;

    case 'customers/redact':
      await handleCustomersRedact(shopDomain || '', body);
      break;

    case 'shop/redact':
      await handleShopRedact(shopDomain || '', body);
      break;

    default:
      console.log(`[POTAL Shopify] Unknown webhook topic: ${topic}`);
  }

  // Shopify는 2xx 응답을 기대 (200 OK)
  return NextResponse.json({ success: true });
}

// ─── Webhook Handlers ───────────────────────────────

/**
 * 앱 삭제: 토큰 무효화, 스토어 비활성화
 */
async function handleAppUninstalled(shop: string, _body: any): Promise<void> {
  console.log(`[POTAL Shopify] App uninstalled from ${shop}`);
  await markShopUninstalled(shop);
}

/**
 * GDPR: 고객 데이터 요청
 * POTAL은 고객 개인정보를 저장하지 않으므로 빈 응답
 */
async function handleCustomersDataRequest(shop: string, body: any): Promise<void> {
  console.log(`[POTAL Shopify] Customer data request from ${shop}`, {
    customer_id: body.customer?.id,
    orders_requested: body.orders_requested?.length || 0,
  });
  // POTAL은 고객 PII를 저장하지 않음. 추후 필요 시 구현.
}

/**
 * GDPR: 고객 데이터 삭제
 * POTAL은 고객 개인정보를 저장하지 않으므로 실행할 작업 없음
 */
async function handleCustomersRedact(shop: string, body: any): Promise<void> {
  console.log(`[POTAL Shopify] Customer redact from ${shop}`, {
    customer_id: body.customer?.id,
  });
  // No customer PII stored. No action needed.
}

/**
 * GDPR: 스토어 데이터 삭제
 * shopify_stores 테이블에서 해당 스토어 데이터 삭제
 */
async function handleShopRedact(shop: string, _body: any): Promise<void> {
  console.log(`[POTAL Shopify] Shop redact from ${shop}`);
  await markShopUninstalled(shop);
  // 추후: shopify_stores 테이블에서 완전 삭제 (현재는 비활성화만)
}
