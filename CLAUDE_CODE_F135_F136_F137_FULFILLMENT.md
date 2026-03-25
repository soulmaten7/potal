# F135/F136/F137 Inventory Sync + 3PL + Multi-Hub — 프로덕션 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/fulfillment/inventory/route.ts` — 재고/3PL/멀티허브 API

---

## F135 Inventory Sync — CRITICAL 2개

### C1: 재고 수량 동기화 안 됨
재고 설정만 반환. 실제 마켓플레이스/ERP 재고 수량 가져오기 없음.
**수정**: 마켓플레이스 재고 조회 연동
```typescript
async function syncInventory(sellerId: string, source: string) {
  const token = await getValidMarketplaceToken(sellerId, source);
  if (source === 'shopify') {
    const inventoryLevels = await fetchShopifyInventory(token);
    for (const item of inventoryLevels) {
      await supabase.from('inventory_sync').upsert({
        seller_id: sellerId, sku: item.sku, source,
        quantity: item.available, location: item.location_name,
        last_synced: new Date().toISOString()
      });
    }
    return { synced: inventoryLevels.length };
  }
}
```

### C2: 저재고 알림 기준값 없음
"low stock" 경고가 있지만 기준값을 셀러가 설정 못 함.
**수정**: 셀러별 알림 임계값 설정
```typescript
// POST /fulfillment/inventory/alerts — 알림 설정
const alertConfig = {
  lowStockThreshold: body.threshold || 10, // 기본 10개
  reorderPoint: body.reorderPoint,
  notifyEmail: body.email || sellerEmail,
  notifyWebhook: body.webhookUrl,
};
// 재고 동기화 시 체크
if (item.quantity <= alertConfig.lowStockThreshold) {
  await triggerAlert(sellerId, 'low_stock', { sku: item.sku, quantity: item.quantity });
}
```

---

## F136 3PL Integration — CRITICAL 2개

### C1: 3PL 실제 연동 없음
6개 3PL 이름만 나열. API 연동/주문 전달 없음.
**수정**: 3PL 연결 구조 + 최소 1개 실제 연동 가이드
```typescript
const THREPL_CONFIGS: Record<string, ThreePlConfig> = {
  shipbob: { apiBase: 'https://api.shipbob.com', authType: 'bearer',
    endpoints: { orders: '/1.0/order', inventory: '/1.0/inventory', products: '/1.0/product' } },
  flexport: { apiBase: 'https://api.flexport.com', authType: 'bearer' },
  fba: { apiBase: 'https://sellingpartnerapi-na.amazon.com', authType: 'aws_signature' },
};
// 주문 전달
async function sendTo3pl(sellerId: string, orderId: string) {
  const conn = await get3plConnection(sellerId);
  const order = await getOrder(orderId);
  // 3PL API에 주문 전달
  await fetch(`${conn.apiBase}/orders`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${conn.token}` },
    body: JSON.stringify(mapOrderTo3plFormat(order, conn.threepl))
  });
}
```

### C2: 3PL 비용 비교 없음
어떤 3PL이 가장 경제적인지 비교 불가.
**수정**: 예상 비용 비교
```typescript
response.costComparison = connectedThreePls.map(pl => ({
  provider: pl.name,
  pickAndPack: pl.rates?.pickAndPack || 'Contact provider',
  storage: pl.rates?.storagePerPallet || 'Contact provider',
  estimatedPerOrder: pl.rates?.estimatedPerOrder || null,
  transitDays: pl.avgTransitDays || null
}));
```

---

## F137 Multi-Hub Fulfillment — CRITICAL 2개

### C1: 라우팅 로직이 단순 거리 기반만
"nearest customer" 전략만. 관세 최적화, 재고 가용성 미고려.
**수정**: 다중 전략 라우팅
```typescript
type RoutingStrategy = 'nearest' | 'lowest_cost' | 'fastest' | 'lowest_duty' | 'stock_available';

async function selectHub(destination: string, items: Item[], strategy: RoutingStrategy) {
  const hubs = await getAvailableHubs(items);
  switch (strategy) {
    case 'lowest_duty':
      // 각 허브 국가→목적지 관세 비교
      const dutyByHub = await Promise.all(hubs.map(async h => ({
        hub: h, duty: await estimateDuty(h.country, destination, items[0].hsCode)
      })));
      return dutyByHub.sort((a, b) => a.duty - b.duty)[0].hub;
    case 'stock_available':
      return hubs.find(h => h.stockAvailable >= items[0].quantity) || hubs[0];
    // ...
  }
}
```

### C2: 분할 배송 미지원
여러 허브에서 일부 상품씩 발송하는 split shipment 로직 없음.
**수정**: 분할 배송 판단
```typescript
function planFulfillment(items: Item[], hubs: Hub[]): FulfillmentPlan {
  const plan: FulfillmentPlan = { shipments: [], splitRequired: false };
  const unfulfilledItems = [...items];

  for (const hub of hubs) {
    const fulfillable = unfulfilledItems.filter(i =>
      hub.inventory.some(inv => inv.sku === i.sku && inv.quantity >= i.quantity));
    if (fulfillable.length > 0) {
      plan.shipments.push({ hub: hub.id, items: fulfillable });
      fulfillable.forEach(f => unfulfilledItems.splice(unfulfilledItems.indexOf(f), 1));
    }
  }
  plan.splitRequired = plan.shipments.length > 1;
  return plan;
}
```

## 테스트 10개
```
1. F135: Shopify 재고 동기화 → synced 수 반환
2. F135: 저재고 알림 → threshold 이하 시 alert
3. F136: ShipBob 주문 전달 → API 호출 구조
4. F136: 비용 비교 → costComparison 배열
5. F137: lowest_duty 라우팅 → 관세 최저 허브
6. F137: stock_available → 재고 있는 허브
7. F137: 분할 배송 → splitRequired: true
8. F135: 알림 임계값 설정 → DB 저장
9. F136: 미연결 3PL → 400 에러
10. F137: 모든 허브 재고 없음 → backorder 안내
```
