# CW34 Playground 검증 플레이북
> 작성: 2026-04-13 20:00 KST
> 목적: 새 세션이 이 파일을 읽고 시나리오 하나하나를 Seller 때와 동일한 디테일 수준으로 검증하도록 함

---

## 0. 배경: Seller 검증에서 우리가 한 것

Seller 시나리오를 검증할 때 우리는 이렇게 했다:

1. **Chrome MCP로 www.potal.app/playground/seller 접속**
2. **사이드바에서 endpoint 하나 클릭** (JavaScript tool로 `document.querySelector().click()` 사용 — React state가 일반 클릭으로 안 바뀜)
3. **모든 필드를 하나하나 확인**:
   - 필드 라벨이 맞는지
   - placeholder가 적절한지
   - required 필드 vs optional 필드 구분이 맞는지
   - defaultValue가 있는 필드는 실제로 값이 채워져 있는지 (⚠️ defaultValue 버그가 있었음 — paramValues state에 초기화 안 되는 문제)
   - Price 필드에 Currency 드롭다운이 composite로 붙어있는지
   - select 드롭다운이 제대로 열리고 선택되는지
4. **Test 버튼 클릭해서 실제 API 호출**
5. **결과값을 하나하나 검증**:
   - Classify: HS 코드가 맞는지, confidence, method
   - Restrictions: HAZMAT 여부, carrier restrictions 목록
   - Calculate: totalLandedCost 각 항목 (importDuty, additionalTariff, salesTax, MPF, insurance) 계산이 논리적으로 맞는지
6. **버그 발견 시 즉시 수정** (이번에 발견한 버그: defaultValue 미초기화, Price+Currency composite 미적용)

**새 세션도 이 순서를 시나리오 하나마다 반드시 따라야 한다.**

---

## 1. 완료된 시나리오

### ✅ Seller (🛒 Online Seller) — 3 endpoints 전부 검증 완료

| Endpoint | 테스트 입력 | 기대 결과 | 실제 결과 | 상태 |
|----------|-----------|----------|----------|------|
| Classify | wallet, leather, leather-goods | HS 420231 | HS 420231 (decision_tree:4202→group3+mat1) | ✅ |
| Check Restrictions | 850760, US | Lithium HAZMAT | Lithium Batteries HAZMAT + carrier restrictions | ✅ |
| Calculate Landed Cost | CN→US, $45 | type="global", Section 301 | $82.15 (duty $0.05 + tariff $15 + tax $4.2 + MPF $2 + insurance $0.9) | ✅ |

**발견+수정한 버그:**
- defaultValue가 paramValues state에 안 들어가서 API body에 origin/currency 누락 → importDuty $0
- Price+Currency composite가 Classify에 미적용 (조건이 currency param 존재 여부로 제한되어 있었음)

---

## 2. 검증할 시나리오 (아래 순서대로, 한 시나리오씩)

---

### 🌐 D2C Brand — 3 endpoints

**URL**: www.potal.app/playground/d2c

#### Endpoint 1: Compare Countries (`/api/v1/calculate/compare`)

**필드 체크리스트:**
- [ ] Price 필드: 숫자 input + Currency 드롭다운 composite로 표시되는지 (key가 `price`로 통일됨)
- [ ] Price placeholder: "28"
- [ ] Routes (JSON) 필드: string input, placeholder `[{"shipping":5},{"shipping":8},{"shipping":12}]`
- [ ] Test 버튼이 활성화되는지 (required 필드: price, routes)

**테스트 입력:**
```
Price: 28 (USD)
Routes: [{"shipping":5},{"shipping":8},{"shipping":12}]
```

**기대 결과:**
- success: true
- routes 배열에 각 route별 totalLandedCost 값
- cheapest_route_index가 있어야 함
- 에러가 아닌 실제 계산 결과가 나와야 함

**결과 검증 포인트:**
- [ ] 3개 route 결과가 각각 다른 값인가 (shipping이 다르니까)
- [ ] cheapest_route_index가 shipping 가장 낮은 route를 가리키는가
- [ ] 값이 0이나 null이 아닌 실제 숫자인가

---

#### Endpoint 2: FTA Eligibility (`/api/v1/fta/eligibility`)

**필드 체크리스트:**
- [ ] HS Code: string input, placeholder "610910"
- [ ] Origin: select (국가 드롭다운 240개), required
- [ ] Destination: select, required
- [ ] Price: 숫자 + Currency composite (optional)
- [ ] Local Content %: number, optional, placeholder "60"

**테스트 입력:**
```
HS Code: 610910
Origin: KR
Destination: DE
```

**기대 결과:**
- EU-KR FTA 적용
- eligible: true
- mfn_duty_estimate > 0 (MFN 관세)
- fta_duty_estimate: 0 또는 낮은 값 (FTA 적용 시)
- savings_if_eligible > 0

**결과 검증 포인트:**
- [ ] fta_id가 "EU-KR"인가
- [ ] eligible이 true인가
- [ ] savings가 양수인가 (FTA 혜택이 있으니까)

---

#### Endpoint 3: DDP vs DDU (`/api/v1/calculate/ddp-vs-ddu`)

**필드 체크리스트:**
- [ ] Price: 숫자 + Currency composite, required
- [ ] Origin: select, required
- [ ] Destination: select, required
- [ ] Weight (kg): number, optional
- [ ] Mode: string, defaultValue "compare" — **이 값이 실제로 input에 채워져 있는지 확인** (defaultValue 버그 재발 가능)

**테스트 입력:**
```
Price: 28 (USD)
Origin: KR
Destination: US
Mode: compare (defaultValue)
```

**기대 결과:**
- DDP vs DDU 비교 데이터
- incoterms 객체에 ddp/ddu 각각의 비용 구조

**결과 검증 포인트:**
- [ ] mode가 "compare"로 정상 전달됐는지 (defaultValue가 API body에 들어갔는지)
- [ ] DDP와 DDU 결과가 다른가 (DDP가 seller pays more)
- [ ] 에러 없이 계산 결과가 나오는가

---

### 📦 Importer — 4 endpoints

**URL**: www.potal.app/playground/importer

#### Endpoint 1: Classify (Precise) (`/api/v1/classify`)

**이건 Seller Classify와 같은 API지만 필드가 다르다 — 산업용 제품 중심**

**필드 체크리스트:**
- [ ] Product Name: string, required, placeholder "Industrial centrifugal water pump"
- [ ] Material: select (106개 material), required
- [ ] Category: select (73개 category), optional, defaultValue "machinery-pumps" — **값이 채워져 있는지 확인**
- [ ] Origin Country: select, optional, defaultValue "DE" — **확인**
- [ ] Destination Country: select, optional, defaultValue "KR" — **확인**
- [ ] Description, Processing, Composition, Weight/Spec: string, optional
- [ ] Price: 숫자 + Currency composite, optional
- [ ] Material 선택 시 Category 옵션이 필터링되는지 확인 (MATERIAL_TO_CATEGORIES 연동)

**테스트 입력:**
```
Product Name: Industrial centrifugal water pump
Material: metal-iron-steel
Category: machinery-pumps (default)
```

**기대 결과:**
- HS 841370 근처 (centrifugal pumps)
- confidence 0.7 이상
- method: keyword 또는 decision_tree

**결과 검증 포인트:**
- [ ] HS 코드가 8413xx 범위인가 (pump = 8413)
- [ ] ⚠️ 알려진 이슈: pump가 840680 (steam turbines)으로 잘못 분류될 수 있음 — 이건 CW34 classifier keyword quality sweep에서 처리 예정이므로 버그로 기록만 하고 넘어가도 됨

---

#### Endpoint 2: Check Restrictions (`/api/v1/restrictions`)

**필드 체크리스트:**
- [ ] HS Code: string, required, placeholder "841370"
- [ ] Destination: select, required, defaultValue "KR" — **확인**

**테스트 입력:**
```
HS Code: 841370
Destination: KR
```

**기대 결과:**
- hasRestrictions: false (일반 산업용 펌프에 수입 제한 없음)
- isProhibited: false

---

#### Endpoint 3: Lookup FTA (`/api/v1/fta`)

**⚠️ 이건 GET 메서드** — 다른 endpoint들은 전부 POST

**필드 체크리스트:**
- [ ] Origin: select, required
- [ ] Destination: select, required
- [ ] HS Code: string, optional

**테스트 입력:**
```
Origin: DE
Destination: KR
HS Code: 8413
```

**기대 결과:**
- EU-KR FTA 적용
- fta.applicable: true
- fta.name에 "EU-Korea" 포함

---

#### Endpoint 4: Cost Breakdown (`/api/v1/calculate/breakdown`)

**필드 체크리스트:**
- [ ] Shipment Value: 숫자 + Currency composite (label은 "Shipment Value"), required — **label이 "Shipment Value"인지 확인 (Seller의 "Price"와 다른 라벨)**
- [ ] Shipping Cost, Insurance: number, optional
- [ ] Selling Price: number, optional (margin 계산용)

**테스트 입력:**
```
Shipment Value: 85000 (USD)
Shipping Cost: 3200
Insurance: 850
```

**기대 결과:**
- totalLandedCost > 85000 (관세+VAT+운송비 포함)
- breakdown 객체에 product_price, import_duty, vat_gst, freight_estimate 등 항목

**결과 검증 포인트:**
- [ ] product_price가 85000인가
- [ ] import_duty가 0이 아닌가 (기본은 MFN rate 적용)
- [ ] 총합이 맞는가

---

### 🚀 Exporter — 4 endpoints

**URL**: www.potal.app/playground/exporter

#### Endpoint 1: Calculate Landed Cost (`/api/v1/calculate`)

**필드 체크리스트:**
- [ ] Product Name: string, optional
- [ ] Material: select, optional
- [ ] Category: select, optional
- [ ] Price: 숫자 + Currency composite, required
- [ ] Currency: **currency param이 있음 — 이게 composite에 합쳐져서 별도 row로 안 보여야 함**
- [ ] Origin: select, defaultValue "KR" — **확인**
- [ ] Destination: select, defaultValue "US" — **확인**
- [ ] HS Code: string, optional

**테스트 입력:**
```
Product Name: Lithium-ion battery cells
Material: (선택 안 함)
Price: 250000 (USD)
Origin: KR (default)
Destination: US (default)
HS Code: 850760
```

**기대 결과:**
- KORUS FTA 적용 → isDutyFree: true 또는 낮은 duty
- HS 850760 → Lithium batteries
- totalLandedCost > 250000

**결과 검증 포인트:**
- [ ] ftaApplied.hasFta: true, ftaName에 "Korea-US" 포함
- [ ] HS code가 850760으로 그대로 passthrough 됐는지
- [ ] origin이 "KR"로 정상 전달됐는지 (defaultValue 버그 재발 여부)

---

#### Endpoint 2: Denied Party Screening (`/api/v1/screening`)

**필드 체크리스트:**
- [ ] Party Name: string, required
- [ ] Country: select, optional
- [ ] Min Match Score: number, optional, placeholder "0.8"

**테스트 입력 A (정상 기업):**
```
Party Name: Samsung Electronics
Country: KR
```

**기대 결과:** hasMatches: false, status: "clear"

**테스트 입력 B (제재 대상 — 있다면):**
```
Party Name: Huawei Technologies
Country: CN
```

**기대 결과:** hasMatches: true (BIS Entity List에 있으므로), matches 배열에 결과

---

#### Endpoint 3: Export Controls (`/api/v1/export-controls/classify`)

**필드 체크리스트:**
- [ ] Product Name: string, optional
- [ ] Material: select, optional
- [ ] Category: select, optional
- [ ] HS Code: string, optional, placeholder "850760"
- [ ] Destination: select, optional
- [ ] End Use: string, optional

**테스트 입력:**
```
HS Code: 850760
Destination: US
End Use: consumer electronics
```

**기대 결과:**
- ECCN 분류 (EAR99 또는 3A001 등)
- license_required: false (일반 소비자 전자제품)

---

#### Endpoint 4: Generate Invoice (`/api/v1/invoice/generate`)

**필드 체크리스트:**
- [ ] Format: string, defaultValue "json" — **이 값이 채워져 있는지 확인**
- [ ] Invoice Data (JSON): string, required — 긴 JSON placeholder

**테스트 입력:**
```
Format: json (default)
Invoice Data: {"seller":{"name":"POTAL KR"},"buyer":{"name":"Acme US"},"items":[{"description":"Li-ion cells","quantity":1000,"unit_price":250}]}
```

**기대 결과:**
- invoice_id 생성
- totals.line_total: 250000 (1000 × 250)

---

### 🚛 Forwarder / 3PL — 4 endpoints

**URL**: www.potal.app/playground/forwarder

#### Endpoint 1: Batch Classify (`/api/v1/classify/batch`)

**필드 체크리스트:**
- [ ] Items (JSON): string, required — 긴 JSON array

**테스트 입력:**
```
Items: [{"id":"1","productName":"Cotton T-shirt"},{"id":"2","productName":"Leather wallet"}]
```

**기대 결과:**
- results[0]: HS 610910 (cotton T-shirt)
- results[1]: HS 420231 근처 (leather wallet)
- summary.total: 2, classified: 2, failed: 0

---

#### Endpoint 2: Batch Calculate (`/api/v1/calculate/batch`)

**필드 체크리스트:**
- [ ] Items (JSON): string, required
- [ ] Defaults (JSON): string, optional

**테스트 입력:**
```
Items: [{"id":"1","price":45,"origin":"KR","destinationCountry":"US"},{"id":"2","price":28,"origin":"KR","destinationCountry":"DE"}]
```

**기대 결과:**
- results[0]: KR→US, $45 기반 totalLandedCost
- results[1]: KR→DE, $28 기반 totalLandedCost
- 두 값이 서로 다르고, 원래 price보다 높아야 함

---

#### Endpoint 3: Shipping Estimate (`/api/v1/shipping/estimate`)

**필드 체크리스트:**
- [ ] Origin, Destination: select, required
- [ ] Weight (kg): number, required
- [ ] Length/Width/Height (cm): number, optional
- [ ] Mode: string, optional

**테스트 입력:**
```
Origin: KR
Destination: US
Weight: 5
```

**기대 결과:**
- estimates 배열에 express/standard/economy 3가지 tier
- 각 tier에 costMin, costMax

---

#### Endpoint 4: Pre-shipment Verify (`/api/v1/verify/pre-shipment`)

**필드 체크리스트:**
- [ ] HS Code: string, required
- [ ] Destination: select, required
- [ ] Origin: select, optional
- [ ] Declared Value: number, optional — **⚠️ key가 `declared_value`인데, 이건 `price`로 안 바꿨음. 이건 "price"가 아니라 "신고 가격"이라 별도 용어가 맞음**
- [ ] Shipper Name: string, optional

**테스트 입력:**
```
HS Code: 610910
Destination: US
Origin: KR
Declared Value: 12000
Shipper Name: POTAL Korea Inc
```

**기대 결과:**
- checklist 배열에 HS Validation, Import Restrictions, Denied Party Screening 항목
- 각 항목 status: "PASS"
- risk_score 낮은 값, risk_level: "LOW"
- shipment_allowed: true

---

## 3. 공통 UI 체크리스트 (모든 시나리오에 적용)

매 시나리오 전환 시 반드시 확인:

- [ ] **사이드바 endpoint 목록**: 개수가 맞는지 (D2C=3, Importer=4, Exporter=4, Forwarder=4)
- [ ] **endpoint 클릭 시**: 중앙 패널이 해당 endpoint 필드로 바뀌는지
- [ ] **Price 필드**: 숫자 + Currency 드롭다운 composite가 한 줄로 나오는지
- [ ] **defaultValue 필드**: 실제로 값이 input에 채워져 있는지 (빈칸이면 버그)
- [ ] **required 필드만 채워도 Test 버튼 활성화**: optional 비워도 Test 가능해야 함
- [ ] **Test 실행 후 Result 탭**: JSON 결과가 표시되는지
- [ ] **Code Snippets**: cURL/Python/Node.js/Go 4개 언어 탭, body에 현재 입력값이 반영되는지
- [ ] **Copy 버튼**: 작동하는지

---

## 4. 알려진 이슈 (버그가 아닌 것)

| 이슈 | 상태 | 비고 |
|------|------|------|
| pump→840680 (steam turbines) 오분류 | CW34 backlog | classifier keyword quality sweep 필요 |
| AI classifier cold-start 첫 호출 unavailable | CW34 backlog | engineStatus 헤더로 surface됨 |
| Forwarder `declared_value` key가 `price`로 안 바뀜 | **의도적** | "신고 가격"은 "가격"과 다른 개념 |

---

## 5. 핵심 파일 위치

| 파일 | 역할 | 수정 시 주의사항 |
|------|------|----------------|
| `app/playground/[scenarioId]/page.tsx` | 메인 페이지 — state, API 호출 | defaultValue seed 로직 3곳 있음 |
| `components/playground/ParamsPanel.tsx` | 파라미터 입력 UI | Price composite 조건: `p.key === 'price'` |
| `components/playground/Sidebar.tsx` | 좌측 endpoint 리스트 | onClick → onSelect(ep.id) |
| `lib/playground/scenario-endpoints.ts` | 전체 endpoint 정의 | key/label 변경 시 API route도 같이 |
| `lib/playground/dropdown-options.ts` | Material 106개 + Category 73개 | MATERIAL_TO_CATEGORIES 매핑 |

---

## 6. 테스트 방법

### 방법 A: Chrome MCP (프로덕션 — 가장 확실)
```
1. Chrome MCP로 www.potal.app/playground/{scenarioId} 접속
2. JavaScript tool로 사이드바 endpoint 클릭: document.querySelector('[data-endpoint-id="XXX"]').click()
3. 각 필드 확인 (위 체크리스트)
4. Test 버튼 클릭 → Result 확인
```

### 방법 B: curl (터미널 — 빠름)
```bash
# Demo mode — API key 불필요
curl -X POST https://www.potal.app/api/v1/calculate \
  -H "Content-Type: application/json" \
  -H "X-Demo-Request: true" \
  -d '{"productName":"wallet","price":45,"origin":"CN","destinationCountry":"US"}'
```

### 방법 C: curl로 API만 테스트하고, UI는 Chrome MCP로 별도 확인
- API 결과 정확성 → curl
- UI 필드/라벨/composite/defaultValue → Chrome MCP

**추천: 시나리오당 curl로 API 먼저 전부 확인 → UI는 Chrome MCP로 한 번에 체크**

---

## 7. 버그 발견 시 대응 절차

1. **증상 기록** — 어떤 시나리오, 어떤 endpoint, 어떤 필드, 어떤 값
2. **CLAUDE.md Rule 12 적용** — 하드코딩 금지, 근본 원인 진단:
   - (a) 데이터 부족? (b) 코드화/매핑 오류? (c) 데이터 미사용?
3. **수정 후 빌드 확인** — `npm run build` 475/475
4. **수정 후 재검증** — 같은 테스트 다시 실행
5. **다른 시나리오 회귀 테스트** — Seller 3개 endpoint도 다시 확인 (이미 통과한 것이 깨지면 안 됨)
