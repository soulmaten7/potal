# F138 Multi-hub Inventory & 3PL Integration — 강화 명령어

## 현재 상태
- 기본 stub만 존재
- 실제 창고별 재고/배송 로직 없음

## CRITICAL 수정 사항

### C1. 창고 허브 관리 API
- `app/api/v1/inventory/hubs/route.ts` 신규 생성
- CRUD: 창고 등록/조회/수정/삭제
- 필드: hub_id, name, country_code, address, type (warehouse/3pl/dropship/fba), is_active, priority
- 국가 코드 → 수출국 자동 설정 (origin_country 매핑)

### C2. 최적 출하 허브 선택
- `app/lib/inventory/hub-optimizer.ts` 신규 생성
- selectOptimalHub(destination_country, product_hs6, hubs[]): 최저 TLC 허브 자동 선택
- 로직: 각 허브에서 destination까지 TLC 계산 → 최저 비용 허브 반환
- FTA 활용: 허브 country가 destination과 FTA 있으면 우선순위 UP

### C3. 재고 수준 추적
- `app/api/v1/inventory/levels/route.ts` 신규 생성
- GET: 허브별 재고 수준 조회 (hub_id, sku, quantity, reserved, available)
- POST: 재고 업데이트 (입고/출고/조정)
- 재고 부족 시 대체 허브 자동 추천

### C4. 3PL 연동 인터페이스
- `app/lib/inventory/tpl-connector.ts` 신규 생성
- 지원 3PL: ShipBob, Deliverr, Flexport, Amazon FBA, ShipMonk
- 공통 인터페이스: getInventory(), createShipment(), getTrackingStatus()
- 실제 API 호출은 stub (향후 연동), 인터페이스와 에러 처리만 구현

### C5. 배송 비용 비교
- hub-optimizer에 shipping cost 추정 포함
- 거리 기반 + 중량 기반 간이 계산 (실제 캐리어 API는 향후)
- 관세 + 배송 + 세금 = Total Landed Cost per hub

### C6. 허브별 규정 체크
- 특정 허브(국가)에서 특정 상품 수출 가능한지 체크
- export_controls + product_restrictions 기존 로직 활용
- 수출 불가 허브는 자동 제외

## 수정/생성 파일
- app/api/v1/inventory/hubs/route.ts (신규 — 허브 CRUD)
- app/api/v1/inventory/levels/route.ts (신규 — 재고 관리)
- app/lib/inventory/hub-optimizer.ts (신규 — 최적 허브 선택)
- app/lib/inventory/tpl-connector.ts (신규 — 3PL 인터페이스)

## 5-Step 검증
1. TypeScript compile — `npx tsc --noEmit 2>&1 | grep -c "error"` → 0
2. `as any` 검사 — 새 파일에 `as any` 없어야 함
3. `npm run build` — Compiled successfully
4. 테스트 작성 + 실행 — 10개+ PASS
5. 에러 핸들링 — try-catch + 입력 검증 + hub 미존재 처리
