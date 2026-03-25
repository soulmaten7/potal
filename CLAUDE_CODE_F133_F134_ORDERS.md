# F133/F134 Order Auto-Sync + Bulk Order Import — 프로덕션 강화

> ⚠️ 이 2개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/orders/sync/route.ts` — 주문 동기화/일괄 가져오기 API

---

## F133 Order Auto-Sync — CRITICAL 3개

### C1: 실제 마켓플레이스 API 호출 없음
지원 플랫폼 목록만 반환. 실제 Shopify/Amazon 주문 가져오기 없음.
**수정**: F082 마켓플레이스 연동 활용
```typescript
// marketplace_connections에서 토큰 가져와서 주문 조회
async function fetchOrders(sellerId: string, marketplace: string, since: string) {
  const token = await getValidMarketplaceToken(sellerId, marketplace);
  if (marketplace === 'shopify') {
    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/orders.json?created_at_min=${since}`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    return (await res.json()).orders;
  }
  // 다른 마켓플레이스도 유사하게
}
```

### C2: 주문별 HS 코드 자동 분류 없음
주문 동기화만 하고 상품에 HS 코드 부여 안 함.
**수정**: 동기화 시 자동 분류
```typescript
for (const order of syncedOrders) {
  for (const item of order.line_items) {
    // 기존 매핑 확인
    const existing = await lookupProductHsMapping(item.name);
    if (!existing) {
      // AI 분류
      const classification = await classifyProduct(item.name, item.category);
      item.hsCode = classification.hsCode;
      item.hsConfidence = classification.confidence;
    } else {
      item.hsCode = existing.hsCode;
      item.hsConfidence = 1.0;
    }
  }
}
```

### C3: 동기화 충돌 처리 없음
같은 주문이 두 번 동기화될 때 중복 처리 로직 없음.
**수정**: upsert + 타임스탬프 비교
```typescript
// external_order_id 기준 upsert
await supabase.from('synced_orders').upsert(
  { seller_id: sellerId, marketplace, external_order_id: order.id,
    order_data: order, synced_at: new Date().toISOString() },
  { onConflict: 'seller_id,marketplace,external_order_id' }
);
```

---

## F134 Bulk Order Import — CRITICAL 3개

### C1: CSV 파싱 에러 처리 미흡
잘못된 CSV(빈 행, 인코딩 오류) 시 전체 실패.
**수정**: 행별 에러 처리 + 부분 성공
```typescript
const results = { success: 0, failed: 0, errors: [] as RowError[] };
for (let i = 0; i < rows.length; i++) {
  try {
    validateRow(rows[i], i + 2); // 헤더 제외
    await processOrder(rows[i]);
    results.success++;
  } catch (err) {
    results.failed++;
    results.errors.push({ row: i + 2, error: err.message, data: rows[i] });
  }
}
return { ...results, totalRows: rows.length };
```

### C2: 대용량 파일 처리 없음
1000+ 행 CSV 시 타임아웃 위험.
**수정**: 청크 처리 + 비동기 작업
```typescript
if (rows.length > 100) {
  // 비동기 처리 모드
  const jobId = crypto.randomUUID();
  await supabase.from('import_jobs').insert({
    id: jobId, seller_id: sellerId, total_rows: rows.length,
    status: 'processing', created_at: new Date().toISOString()
  });
  // 백그라운드에서 청크 처리
  processInBackground(jobId, rows, 50); // 50행씩
  return NextResponse.json({ jobId, status: 'processing', checkUrl: `/api/v1/orders/import-status/${jobId}` });
}
```

### C3: 템플릿 다운로드 없음
어떤 형식으로 CSV를 만들어야 하는지 가이드/템플릿 없음.
**수정**: 템플릿 엔드포인트
```typescript
if (action === 'template') {
  const template = 'order_id,product_name,hs_code,quantity,unit_price,currency,origin_country,destination_country,weight_kg\nSAMPLE-001,T-Shirt Cotton,6109.10,10,15.00,USD,CN,US,0.5\n';
  return new Response(template, {
    headers: { 'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="potal_import_template.csv"' }
  });
}
```

## 테스트 8개
```
1. F133: Shopify 주문 동기화 → HS 코드 자동 부여
2. F133: 중복 주문 → upsert (덮어쓰기)
3. F133: 마켓플레이스 미연결 → 404
4. F134: 유효한 CSV → success + failed 카운트
5. F134: 잘못된 행 → 부분 성공 + errors 배열
6. F134: 1000+ 행 → 비동기 jobId 반환
7. F134: 템플릿 다운로드 → CSV 파일
8. F134: 빈 파일 → 400 에러
```
