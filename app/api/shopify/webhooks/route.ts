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
import { verifyShopifyWebhook, markShopUninstalled, deleteShopData } from '@/app/lib/shopify/shopify-auth';
import { isEventProcessed, logWebhookEvent } from '@/app/lib/monitoring/webhook-event-log';

export async function POST(req: NextRequest) {
  // ━━━ 1. Raw body 읽기 (HMAC 검증용) ━━━
  const rawBody = await req.text();

  // ━━━ 2. HMAC 검증 ━━━
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader || !verifyShopifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ━━━ 3. 웹훅 토픽 확인 ━━━
  const topic = req.headers.get('x-shopify-topic');
  const shopDomain = req.headers.get('x-shopify-shop-domain');
  const webhookId = req.headers.get('x-shopify-webhook-id') || `shopify_${topic}_${Date.now()}`;

  // Idempotency check
  if (await isEventProcessed('shopify', webhookId)) {
    return NextResponse.json({ success: true, note: 'already_processed' });
  }

  // Webhook received: ${topic} from ${shopDomain}

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
      // Unknown webhook topic — silently ignore
  }

  // Log event and return success
  logWebhookEvent({ source: 'shopify', eventId: webhookId, topic: topic || 'unknown', status: 'success' }).catch(() => {});
  return NextResponse.json({ success: true });
}

// ─── Webhook Handlers ───────────────────────────────

/**
 * 앱 삭제: 토큰 무효화, 스토어 비활성화
 */
async function handleAppUninstalled(shop: string, _body: any): Promise<void> {
  await markShopUninstalled(shop);
}

/**
 * GDPR: 고객 데이터 요청
 * POTAL은 고객 개인정보를 저장하지 않으므로 빈 응답
 */
async function handleCustomersDataRequest(_shop: string, _body: any): Promise<void> {
  // POTAL은 고객 PII를 저장하지 않음 — 빈 응답 반환 (Shopify GDPR 준수)
}

/**
 * GDPR: 고객 데이터 삭제
 * POTAL은 고객 개인정보를 저장하지 않으므로 실행할 작업 없음
 */
async function handleCustomersRedact(_shop: string, _body: any): Promise<void> {
  // POTAL은 고객 PII를 저장하지 않음 — 삭제할 데이터 없음 (Shopify GDPR 준수)
}

/**
 * GDPR: 스토어 데이터 삭제
 * shopify_stores 테이블에서 해당 스토어 데이터 삭제
 */
async function handleShopRedact(shop: string, _body: any): Promise<void> {
  await deleteShopData(shop);
}
