# COMMAND: CW37-S1 — 현재 상태 감사 (Audit)

**작성일**: 2026-04-14 KST
**작업 라벨**: CW37-S1
**담당 터미널**: 터미널2 (Sonnet)
**예상 소요**: 1~2시간
**선행조건**: `docs/CW37_ARCHITECTURE_DECISION.md` 필독

**목적**: CW37 전면 리뉴얼 시작 전에 현재 POTAL 의 실제 상태를 감사. 코드 수정 0 — 읽기 전용 감사.

---

## 감사 영역 5가지

### 1. API Key / Rate Limit 시스템 현재 상태
조사 항목:
- POTAL 에 API key 발급 시스템 존재?
  - 가입 시 자동 발급?
  - 사용자 dashboard 에서 발급/재발급 가능?
  - DB table (`api_keys` 또는 유사) 존재?
- Rate limit middleware 존재?
  - per-IP / per-API-key?
  - 몇 req/day 기준?
  - Redis 또는 DB 기반?
- 현재 실제 동작하는지? (테스트)
- 만약 없으면: 무엇을 만들어야 하는지

감사 방법:
```bash
grep -r "api.key\|api_key\|apiKey" app/ lib/ middleware* --include="*.ts" 2>/dev/null | head -30
grep -r "rate.limit\|rateLimit\|rate_limit" app/ lib/ middleware* --include="*.ts" 2>/dev/null | head -20
find app/api -name "route.ts" | head -20
find lib/auth -type f 2>/dev/null
ls app/api/auth/* 2>/dev/null
```

### 2. 현재 존재하는 Endpoint 목록
조사 항목:
- `app/api/v1/*` 하위 모든 route 디렉토리
- 각 route 의 HTTP method (GET/POST)
- request body schema (타입 정의)
- response shape (최근 응답 샘플)
- CW37 목표 12 endpoint 와 gap 분석

CW37 목표 목록:
- 🛠️ Compute (6): classify / calculate / apply-fta / check-restrictions / compare / generate-document
- 🔍 Screening (2): screen-parties / eccn-lookup
- 📚 Guides (4): customs-filing / incoterms / section-301 / anti-dumping

감사 방법:
```bash
find app/api/v1 -name "route.ts" 2>/dev/null
find app/api -name "route.ts" 2>/dev/null | grep -v _backup | wc -l

# 각 route 의 export 함수 확인
for file in $(find app/api/v1 -name "route.ts" 2>/dev/null); do
  echo "━━ $file ━━"
  grep -E "^export async function|^export function" "$file" | head -3
done
```

### 3. 8 API 응답 schema 현재 상태
조사 항목:
- 각 API 응답에 어떤 필드 있는지
- CW34-S4 enrichment (rulingMatch / dataAvailability) 반영됐는지
- CW36 JP classificationGuidance / chapterValidation 반영됐는지
- Lookup 흡수를 위한 필드 (duty-rate / exchange-rate / de-minimis) 현재 응답에 포함?
- LLM-friendly 원칙 준수 여부

감사 방법: 실제 endpoint 호출해서 응답 구조 보기
```bash
# 로컬 dev 서버 또는 production
curl -s -X POST https://www.potal.app/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","hsCode":"6109100010","price":50,"origin":"KR","destinationCountry":"US","currency":"USD"}' | jq 'keys'

# 각 endpoint 별로 반복
```

### 4. HsCodeCalculator 현재 embed 상태
조사 항목:
- `components/playground/HsCodeCalculator.tsx` 존재 확인 (CW34-S1 HF2)
- 어떤 페이지 / 시나리오에 embed 되어있는지
- Calculator 의 현재 props (onResult? embedded? popup-only?)
- CW37 목표: 8 API 화면 모두에 embed → 현재 몇 개 걸려있나

감사 방법:
```bash
ls components/playground/HsCodeCalculator* 2>/dev/null
grep -r "HsCodeCalculator" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | head -20

# 8 endpoint 페이지에서 각각 embed 했는지
find app -name "page.tsx" | xargs grep -l "HsCodeCalculator" 2>/dev/null
```

### 5. 현재 시나리오 / 페르소나 구조
조사 항목:
- 현재 홈페이지 (`app/page.tsx`) 에 몇 개 시나리오 표시?
- 각 시나리오가 어떤 페이지로 라우팅?
- CW37 목표: 홈 → 수출/수입 2 버튼만 → 현재와 얼마나 차이?
- 시나리오 관련 code 제거 범위 예측

감사 방법:
```bash
cat app/page.tsx | head -50
find app -name "page.tsx" | head -20
grep -r "scenario\|persona\|Online Seller\|D2C" app/ components/ --include="*.tsx" -l 2>/dev/null | head -20
```

### 6. OpenAPI spec 존재 여부
조사 항목:
- `/api/openapi.json` 또는 `/api/swagger.json` endpoint?
- `openapi.yaml` 또는 `openapi.yml` 파일?
- Swagger UI 호스팅?
- 현재 API docs 사이트?

감사 방법:
```bash
find . -name "openapi*" -type f 2>/dev/null | head -10
find . -name "swagger*" -type f 2>/dev/null | head -10
grep -r "swagger\|openapi" app/ lib/ --include="*.ts" 2>/dev/null | head -10
```

### 7. Guides 페이지 현재 상태
조사 항목:
- `app/guides/*` 디렉토리 존재?
- 현재 정적 페이지들 (customs filing / incoterms 등) 있는지?
- Disclaimer 컴포넌트 존재?

감사 방법:
```bash
ls app/guides 2>/dev/null
ls app/info 2>/dev/null
find app -name "*disclaimer*" -type f 2>/dev/null
grep -r "참고용\|informational.*only\|disclaimer" app/ components/ --include="*.tsx" 2>/dev/null | head -10
```

---

## 산출물

**파일**: `docs/CW37_AUDIT_REPORT.md`

### 필수 섹션
1. **API Key / Rate Limit 상태**
   - 존재? 동작 범위? Gap?
2. **현재 Endpoint 목록**
   - 표: endpoint path / HTTP method / request schema / response keys / CW37 목표와 gap
3. **Response Schema 상태**
   - 각 API 별 현재 응답 구조
   - LLM-friendly 평가 (0~5점)
   - 흡수해야 할 필드 체크리스트
4. **HsCodeCalculator 현재 Embed 상태**
   - 어디에 걸려있나
   - CW37 목표 대비 gap
5. **시나리오 / 페르소나 구조**
   - 현재 몇 개
   - CW37 목표 (2개) 와 gap
6. **OpenAPI Spec 상태**
   - 존재 여부
   - 만들어야 할 범위
7. **Guides 페이지 상태**
   - 현재 정적 페이지
   - 신설 필요한 것 (customs-filing-guide / incoterms / section-301 / anti-dumping)
8. **CW37 작업량 예측**
   - 각 Phase 별 실제 소요 시간 재산정 (감사 결과 기반)

---

## 원칙

- **읽기 전용 감사**. 코드 수정 0.
- 실제 파일 경로 명시 (나중에 수정 대상 명확)
- 현재 상태 vs CW37 목표 명확히 비교
- 작업량 과소/과대 평가 피하기

---

## 완료 기준

- [ ] `docs/CW37_AUDIT_REPORT.md` 작성
- [ ] 7개 감사 영역 전부 조사
- [ ] 각 영역별 Gap 명시
- [ ] CW37 Phase 2-5 의 실제 소요 시간 재산정
- [ ] 은태님에게 감사 결과 요약 보고
- [ ] 코드 수정 0

완료 후 CW37-S2 (Endpoint Consolidation) 시작.
