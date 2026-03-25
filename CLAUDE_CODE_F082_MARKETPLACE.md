# F082 Marketplace Integration — 프로덕션 강화 (STUB → 실구현)

> ⚠️ 이 기능(F082)만 작업합니다.

## 현재 파일
- `app/api/v1/integrations/marketplace/route.ts` — 마켓플레이스 연동 API
- DB: `marketplace_connections` 테이블

## 현재 상태: 20% STUB (OAuth 미구현, 실제 연동 없음, credentials 미저장)

## CRITICAL 7개 (사실상 신규 구현)

### C1: OAuth 플로우 미구현 (route.ts)
GET/POST 핸들러만 있지만 실제 OAuth 인증 플로우 없음. credentials가 저장되지 않음.
**수정**: 마켓플레이스별 OAuth 구현
```typescript
// POST /integrations/marketplace/connect
const MARKETPLACE_CONFIGS: Record<string, MarketplaceConfig> = {
  shopify: {
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    scopes: 'read_products,read_orders,read_shipping',
    requiredParams: ['shop']
  },
  amazon: {
    authUrl: 'https://sellercentral.amazon.com/apps/authorize/consent',
    tokenUrl: 'https://api.amazon.com/auth/o2/token',
    scopes: 'read_products read_orders',
    requiredParams: ['sellerId', 'region']
  },
  ebay: {
    authUrl: 'https://auth.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    scopes: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
    requiredParams: []
  },
};

// OAuth callback 처리
// GET /integrations/marketplace/callback?code=xxx&state=yyy
async function handleOAuthCallback(code: string, state: string) {
  const { marketplace, sellerId } = decodeState(state);
  const config = MARKETPLACE_CONFIGS[marketplace];
  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({ code, grant_type: 'authorization_code', /* ... */ })
  });
  const tokens = await tokenResponse.json();

  // 암호화하여 저장
  await supabase.from('marketplace_connections').upsert({
    seller_id: sellerId, marketplace,
    access_token_encrypted: encrypt(tokens.access_token),
    refresh_token_encrypted: encrypt(tokens.refresh_token),
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    status: 'connected', connected_at: new Date().toISOString()
  });
}
```

### C2: 토큰 암호화 없음
현재 plaintext로 저장 구조. access_token은 반드시 암호화 필요.
**수정**: AES-256 암호화
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.MARKETPLACE_ENCRYPTION_KEY!; // 32 bytes
function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
function decrypt(encrypted: string): string {
  const [ivHex, encHex] = encrypted.split(':');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### C3: 상품/주문 동기화 없음
연결만 하고 실제 데이터 동기화가 없음. POTAL의 핵심 가치(자동 관세 계산)를 위해 필요.
**수정**: 상품 목록 동기화 기본 구조
```typescript
// GET /integrations/marketplace/sync
async function syncProducts(sellerId: string, marketplace: string) {
  const connection = await getConnection(sellerId, marketplace);
  const accessToken = decrypt(connection.access_token_encrypted);

  // 마켓플레이스별 API 호출
  let products;
  if (marketplace === 'shopify') {
    products = await fetchShopifyProducts(connection.shop_domain, accessToken);
  } else if (marketplace === 'amazon') {
    products = await fetchAmazonProducts(connection.seller_id_ext, accessToken);
  }

  // 각 상품에 HS 코드 분류 적용
  for (const product of products) {
    const classification = await classifyProduct(product.name, product.category);
    await supabase.from('marketplace_product_sync').upsert({
      seller_id: sellerId, marketplace, external_product_id: product.id,
      product_name: product.name, hs_code: classification.hsCode,
      last_synced: new Date().toISOString()
    });
  }
  return { synced: products.length };
}
```

### C4: 토큰 갱신(refresh) 없음
access_token 만료 시 자동 갱신 필요.
**수정**: 토큰 갱신 로직
```typescript
async function getValidToken(sellerId: string, marketplace: string): Promise<string> {
  const conn = await getConnection(sellerId, marketplace);
  if (new Date(conn.token_expires_at) > new Date(Date.now() + 300000)) {
    return decrypt(conn.access_token_encrypted); // 5분 여유
  }
  // 토큰 갱신
  const config = MARKETPLACE_CONFIGS[marketplace];
  const refreshToken = decrypt(conn.refresh_token_encrypted);
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  });
  const tokens = await response.json();
  await supabase.from('marketplace_connections').update({
    access_token_encrypted: encrypt(tokens.access_token),
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  }).eq('seller_id', sellerId).eq('marketplace', marketplace);
  return tokens.access_token;
}
```

### C5: 연결 상태 헬스체크 없음
연결 후 토큰 만료/권한 해제 감지 불가.
**수정**: 주기적 헬스체크
```typescript
async function checkConnectionHealth(sellerId: string, marketplace: string): Promise<HealthStatus> {
  try {
    const token = await getValidToken(sellerId, marketplace);
    // 간단한 API 호출로 연결 확인
    if (marketplace === 'shopify') {
      await fetch(`https://${conn.shop_domain}/admin/api/2024-01/shop.json`,
        { headers: { 'X-Shopify-Access-Token': token } });
    }
    return { status: 'healthy', lastChecked: new Date().toISOString() };
  } catch (err) {
    await supabase.from('marketplace_connections')
      .update({ status: 'error', error_message: err.message })
      .eq('seller_id', sellerId).eq('marketplace', marketplace);
    return { status: 'error', error: err.message };
  }
}
```

### C6: 연결 해제(disconnect) 미구현
연결 삭제만 가능하고 마켓플레이스 측 토큰 무효화 안 함.
**수정**: 양방향 해제
```typescript
// DELETE /integrations/marketplace/disconnect
async function disconnect(sellerId: string, marketplace: string) {
  const conn = await getConnection(sellerId, marketplace);
  // 마켓플레이스 측 토큰 무효화
  if (marketplace === 'shopify') {
    await fetch(`https://${conn.shop_domain}/admin/api_permissions/current.json`,
      { method: 'DELETE', headers: { 'X-Shopify-Access-Token': decrypt(conn.access_token_encrypted) } });
  }
  // DB에서 삭제
  await supabase.from('marketplace_connections')
    .delete().eq('seller_id', sellerId).eq('marketplace', marketplace);
  // 감사 로그
  await logAudit({ actor: sellerId, action: 'disconnect', area: 6, reason: `${marketplace} disconnected` });
}
```

### C7: Webhook 수신 없음
마켓플레이스에서 주문 생성/상품 변경 시 알림 받아야 실시간 동기화 가능.
**수정**: 웹훅 등록 + 수신 엔드포인트
```typescript
// POST /integrations/marketplace/webhook — 수신 엔드포인트
// Shopify webhook: orders/create, products/update
// Amazon: NOTIFICATION API subscription
```

## 수정 파일: 1개 (marketplace/route.ts) + 신규 lib/integrations/marketplace.ts + migration
## 테스트 10개
```
1. Shopify OAuth URL 생성 → 올바른 scopes 포함
2. OAuth callback → 토큰 암호화 저장
3. 토큰 갱신 → 만료 5분 전 자동 갱신
4. 상품 동기화 → HS 코드 분류 포함
5. 헬스체크 → healthy/error 상태
6. 연결 해제 → 양방향 토큰 무효화
7. 암호화 → encrypt/decrypt 왕복 일치
8. 중복 연결 시도 → upsert (덮어쓰기)
9. 잘못된 marketplace 이름 → 400 에러
10. 미연결 상태 sync 시도 → 404 에러
```

## 결과
```
=== F082 Marketplace — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 7개 | 테스트: 10개 | 빌드: PASS/FAIL
```
