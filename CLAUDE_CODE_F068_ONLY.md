# F068 위험물 분류 (Dangerous Goods Classification) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F068만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 문제가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F068 파일 목록 (2개 핵심 파일 + 연동)
1. `app/api/v1/compliance/dangerous-goods/route.ts` (255줄) — DG 분류 API (16개 제품 매핑, 16개 UN 클래스)
2. `app/api/v1/calculate/route.ts` (356줄) — DG 연동 부분 (197~219줄 부근)
3. `app/faq/page.tsx` (58줄 부근) — FAQ에서 "50+ UN-classified" 주장

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 파일을 **전부** 읽고, 아래 알려진 문제를 **직접 확인**한다.

---

## 🔧 Step 2: 알려진 문제 5개 수정

### 문제 1 (HIGH): calculate/route.ts에서 DG 조회 .limit(50) 버그
- **위치**: `app/api/v1/calculate/route.ts` 205줄 부근
- **현재**: `.from('dangerous_goods').select('...').limit(50)` → 50행만 가져옴
- **영향**: DB에 50개 이상의 DG 레코드가 있으면 매칭 실패 가능
- **수정**: `.limit(50)` 제거하고, 대신 HS 코드 필터를 서버사이드에서 적용
  ```typescript
  const hs4 = hsCode.substring(0, 4);
  const { data: dg } = await sb.from('dangerous_goods')
    .select('un_number, class, proper_shipping_name, air_allowed, sea_allowed, hs_codes')
    .contains('hs_codes', [hs4]);
  ```
  만약 contains가 안되면 최소한 `.limit(500)` 이상으로 올리고 TODO 남기기

### 문제 2 (HIGH): calculate/route.ts에서 DG 에러 silent suppression
- **위치**: `app/api/v1/calculate/route.ts` 219줄 부근
- **현재**: `catch { /* non-blocking */ }` — 에러를 완전히 무시
- **영향**: DG 조회 실패해도 사용자가 모르고 위험물을 발송할 수 있음
- **수정**: 에러를 무시하지 말고, 응답에 warning 추가
  ```typescript
  catch (err) {
    dangerousGoods = {
      isDangerous: false,
      warning: 'Dangerous goods check temporarily unavailable',
      details: null
    };
  }
  ```

### 문제 3 (MEDIUM): PRODUCT_DG_MAP이 16개뿐
- **위치**: `app/api/v1/compliance/dangerous-goods/route.ts` 54~71줄
- **현재**: 16개 키워드 패턴만 매핑됨 (lithium, perfume, nail polish 등)
- **FAQ에서는**: "50+ UN-classified dangerous goods" 주장 (app/faq/page.tsx 58줄)
- **수정 방향 2가지 중 1가지**:
  - (A) PRODUCT_DG_MAP을 최소 50개 이상으로 확장 (실제 IATA DGR 기반)
  - (B) FAQ 문구를 실제 수량에 맞게 수정: "16 UN-classified dangerous goods" 또는 "commonly shipped dangerous goods"
- **실행**: (B) 선택 — FAQ 수정이 안전함. PRODUCT_DG_MAP에 추가 가능한 일반적인 DG 제품 10~15개 추가:
  - Compressed gas cylinders (UN1956, Class 2.2)
  - Ethanol/alcohol (UN1170, Class 3)
  - Hydrogen peroxide (UN2014, Class 5.1)
  - Mercury/thermometer (UN2809, Class 8)
  - Adhesive/glue (UN1133, Class 3)
  - Torch/lighter fuel (UN1057, Class 2.1)
  - Swimming pool chemicals (UN2880, Class 5.1)
  - Airbag inflators (UN0503, Class 1.4)
  - Hair spray (UN1950, Class 2.1)
  - Cleaning solvent (UN1993, Class 3)
  → 26~30개로 확장, FAQ는 "30+ commonly shipped" 으로 수정

### 문제 4 (MEDIUM): sea/road/rail transport restriction 미구현
- **위치**: `app/api/v1/compliance/dangerous-goods/route.ts` — 전체
- **현재**: `transportMode` 검증은 air/sea/road/rail 4개 다 받지만, 실제 restriction 로직은 air 위주
- **IMDG Code (sea), ADR (road), RID (rail)** 참조 언급만 있고 실제 제한 로직 없음
- **수정**: 각 transport mode별 기본 restriction 로직 추가
  ```typescript
  // Transport mode specific restrictions
  if (transportMode === 'air') {
    restrictions.push(...getAirRestrictions(dgMatch));
  } else if (transportMode === 'sea') {
    restrictions.push(...getSeaRestrictions(dgMatch));
  } else if (transportMode === 'road' || transportMode === 'rail') {
    restrictions.push(...getSurfaceRestrictions(dgMatch));
  }
  ```
  - Air: 가장 엄격 (IATA DGR 기반, 일부 Class 1/7 금지)
  - Sea: IMDG 기반 (대부분 허용, 적정 포장 필요)
  - Road/Rail: ADR/RID 기반 (대부분 허용, 라벨링 필요)

### 문제 5 (MEDIUM): 전용 테스트 부족
- **현재**: sprint4-tax.test.ts에 stub 테스트 3개만
- **수정**: `__tests__/f068-dangerous-goods.test.ts` 생성:
  1. POST /dangerous-goods — "lithium battery" → isDangerous: true, UN3481
  2. POST /dangerous-goods — "cotton t-shirt" → isDangerous: false
  3. POST /dangerous-goods — hsCode "3303" (perfumery) → HS chapter DG 감지
  4. POST /dangerous-goods — transportMode "air" + Class 1.1 → restricted
  5. POST /dangerous-goods — transportMode "sea" + Class 3 → IMDG 참조
  6. POST /dangerous-goods — productName 누락 → 400 에러
  7. POST /dangerous-goods — transportMode 잘못된 값 → 400 에러
  8. DG_CLASSES — 16개 클래스 정의 확인
  9. PRODUCT_DG_MAP — 26+ 제품 매핑 확인
  10. calculate route — DG 연동 시 warning 필드 존재 확인
  11. POST /dangerous-goods — "aerosol spray" → UN1950, Class 2.1
  12. POST /dangerous-goods — weight 검증 (음수 → 에러 또는 무시)

---

## ✅ Step 3: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/api/v1/compliance/dangerous-goods/route.ts 2>&1 | head -20
```
→ 에러 0개

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/api/v1/compliance/dangerous-goods/route.ts
```
→ 0개

### 검수 3: transport mode 로직 확인
```bash
grep -n "sea\|road\|rail\|IMDG\|ADR\|RID" app/api/v1/compliance/dangerous-goods/route.ts
```
→ 각 transport mode별 restriction 로직 존재 확인

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f068-dangerous-goods.test.ts --verbose 2>&1
```
→ 12개 테스트 ALL PASS

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공

---

## 📊 Step 4: 결과 보고

```
=== F068 위험물 분류 — 검수 결과 ===

[수정 전 문제]
1. HIGH: calculate/route.ts DG 조회 .limit(50) 버그
2. HIGH: DG 에러 silent suppression (catch 비어있음)
3. MEDIUM: PRODUCT_DG_MAP 16개 (FAQ는 50+ 주장)
4. MEDIUM: sea/road/rail restriction 미구현
5. MEDIUM: 전용 테스트 부족

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)

[5단계 검수]
1. TypeScript 컴파일: ✅/❌
2. any 타입: ✅/❌
3. transport mode: ✅/❌
4. 테스트: ✅/❌ (N/12 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
