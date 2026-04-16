# DATA FLOW TRACE — POTAL 실제 데이터 흐름 추적
# 실행: Claude Code 터미널 (Opus)
# 예상 소요: 20~30분
# 출력: docs/DATA_FLOW_TRACE_REPORT.md

---

## 목적
사용자가 POTAL API를 호출할 때 **실제로 어떤 테이블/캐시/API에서 데이터를 가져오는지** 코드를 추적하여 정확한 데이터 흐름도를 작성한다.

감사에서 발견된 유령 테이블 문제를 해결하기 위한 선행 작업:
- `duty_rates_live` — 0 rows인데 코드에서 참조하는가?
- `live_duty_rate_cache` — 테이블 미존재인데 코드에서 참조하는가?
- `fta_rates_live` — 0 rows인데 코드에서 참조하는가?
- `fta_country_pairs` — 테이블 미존재인데 코드에서 참조하는가?
- `hs_code_mappings` — 테이블 미존재인데 코드에서 참조하는가?

---

## 추적 대상 (5개 핵심 API 경로)

### Flow 1: Landed Cost 계산
사용자가 `POST /api/v1/calculate` (또는 MCP `calculate_landed_cost`)를 호출할 때:
1. 엔트리 포인트 파일 찾기
2. HS code → tariff rate 조회 경로 추적
3. tariff rate가 어떤 테이블/API에서 오는지
4. FTA preferential rate는 어떤 경로로 적용되는지
5. VAT/GST는 어디서 가져오는지
6. Exchange rate는 어디서 가져오는지
7. Trade remedy (AD/CVD, Section 301) 적용 경로
8. De minimis 판단 경로

```bash
# 1. calculate API 엔트리 포인트
grep -rn "calculate" app/api/v1/ --include="*.ts" -l | head -10
# 2. calculate 함수 내부에서 참조하는 모듈
grep -rn "import.*from.*cost-engine\|import.*from.*tariff\|import.*from.*duty" app/api/v1/ --include="*.ts" | head -20
# 3. cost-engine 핵심 함수 추적
grep -rn "export.*function\|export.*async" app/lib/cost-engine/*.ts app/lib/cost-engine/**/*.ts | head -30
```

**추적해야 할 핵심 질문들:**
- `fetchDutyRate()` 또는 유사 함수가 호출될 때, Supabase 테이블을 먼저 조회하는가? 아니면 바로 정부 API를 호출하는가?
- 캐싱 레이어가 있다면 어디에? (메모리? Supabase? Redis?)
- `precomputed_landed_costs` 117,600 rows는 어떤 상황에서 사용되는가?
- MacMap 245M rows는 어떤 경로에서 조회되는가?

### Flow 2: HS Classification
사용자가 `POST /api/v1/classify` (또는 MCP `classify_product`)를 호출할 때:
1. GRI classifier pipeline 진입
2. 각 step에서 참조하는 데이터 소스
3. `hs_codes`, `hs_keywords`, `customs_rulings`, `regulation_vectors` 각각의 사용 시점

```bash
grep -rn "classify\|gri-classifier\|hs-code" app/api/v1/ --include="*.ts" -l | head -10
```

### Flow 3: Sanctions Screening
사용자가 `POST /api/v1/screen` (또는 MCP `screen_denied_party`)를 호출할 때:
1. 어떤 테이블을 검색하는지
2. `sanctioned_entities` vs `sanctions_entries` 중 어느 것을 사용하는지
3. fuzzy matching 로직의 데이터 소스

```bash
grep -rn "screen\|sanction\|denied.*party\|fuzzy" app/api/v1/ --include="*.ts" -l | head -10
```

### Flow 4: FTA Lookup
사용자가 `POST /api/v1/fta` (또는 MCP `lookup_fta`)를 호출할 때:
1. FTA 적격 여부 판단에 사용되는 테이블
2. `fta_agreements` vs `fta_rates_live` vs `fta_product_rules` 중 어느 것이 실제 사용되는지
3. RoO 판단 로직의 데이터 소스

```bash
grep -rn "fta\|free.*trade\|roo\|rule.*origin" app/api/v1/ --include="*.ts" -l | head -10
```

### Flow 5: update-tariffs Cron
`/api/v1/admin/update-tariffs` cron이 실행될 때:
1. 어떤 정부 API를 호출하는지
2. 결과를 어떤 테이블에 쓰는지
3. `live_duty_rate_cache`에 쓰려고 시도하는지
4. health_check_logs에 기록하는 로직

```bash
cat app/api/v1/admin/update-tariffs/route.ts
```

---

## 유령 테이블 참조 추적

각 유령 테이블이 코드 어디에서 참조되는지 전수 조사:

```bash
# duty_rates_live (0 rows)
grep -rn "duty_rates_live" app/ lib/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" 2>/dev/null

# live_duty_rate_cache (미존재)
grep -rn "live_duty_rate_cache" app/ lib/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" 2>/dev/null

# fta_rates_live (0 rows)
grep -rn "fta_rates_live" app/ lib/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" 2>/dev/null

# fta_country_pairs (미존재)
grep -rn "fta_country_pairs" app/ lib/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" 2>/dev/null

# hs_code_mappings (미존재)
grep -rn "hs_code_mappings" app/ lib/ scripts/ --include="*.ts" --include="*.mjs" --include="*.py" 2>/dev/null
```

각 참조에 대해:
- **실제 사용**: 이 코드가 프로덕션에서 실행되는가? (dead code가 아닌가?)
- **영향**: 테이블이 비어있거나 없으면 어떤 fallback이 동작하는가?
- **조치**: 테이블을 만들어야 하는가? 참조를 제거해야 하는가?

---

## 출력 포맷

`docs/DATA_FLOW_TRACE_REPORT.md`에 아래 구조로 작성:

```markdown
# POTAL Data Flow Trace Report
# 추적 일시: [오늘 날짜 KST]

## 1. Landed Cost 계산 흐름
### 엔트리 포인트
[파일 경로 + 함수명]
### 데이터 흐름도
[단계별로 어떤 함수 → 어떤 테이블/API 순서]
### 실제 사용 테이블
[테이블명 + 용도 + 쿼리 방식]
### 미사용 테이블
[참조는 있지만 실제 도달하지 않는 경로]

## 2. HS Classification 흐름
[동일 구조]

## 3. Sanctions Screening 흐름
[동일 구조]

## 4. FTA Lookup 흐름
[동일 구조]

## 5. update-tariffs Cron 흐름
[동일 구조]

## 6. 유령 테이블 분석 결과
| 테이블 | 참조 파일 수 | 실제 사용 여부 | 권장 조치 |
각 유령 테이블별 최종 판단

## 7. 최종 데이터 흐름 요약도
[전체 시스템의 데이터 흐름을 한눈에 보는 요약]
- 사용자 API 호출 → [캐시 확인] → [DB 조회] → [외부 API fallback] → 응답
- Cron → [외부 API fetch] → [DB write] → [health_check_logs]
```

---

## 주의사항
- 코드를 **실제로 읽고 추적**할 것. grep 결과만 나열하지 말고, 함수 호출 체인을 따라가며 최종 데이터 소스까지 도달할 것
- import 체인: A.ts imports B.ts imports C.ts → C.ts에서 실제 DB 조회 — 이런 체인을 끝까지 추적
- 조건 분기: if (cache hit) return cache; else fetch from API — 이런 분기를 모두 기록
- 추측 금지. 코드에 근거한 사실만 기록
- 파일 경로 + 라인 번호를 근거로 명시
