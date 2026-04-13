# CW34-S1 Accuracy Sprint — "100%에 수렴하는 정확성"

**작성일**: 2026-04-12 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**선행 작업**:
- CW33 전체 Sprint 1-6 "No Fake, All Real" 완료 (23 테이블, 154,264 rows, verify-cw32 28/28 + verify-cw33 23/23 green)
- CW33-HF3 프로덕션 검증 완료 (Chrome MCP API 8/8 + UI 5/5 green, 커밋 e569fd9)
- `docs/IDENTITY.md` 신설 (POTAL 정체성 문서 — **반드시 먼저 읽을 것**)
- 외장하드: `/Volumes/soulmaten/POTAL/` (983GB, `archive/benchmarks/POTAL_Ablation_V2.xlsx` 포함)

---

## 🧭 시작 전 필독 (3개 문서 순서대로)

**이 3개를 읽지 않고 작업을 시작하지 마라.**

1. `docs/IDENTITY.md` — POTAL 정체성. "왜 이 작업을 하는지"의 근거
2. `archive/benchmarks/POTAL_Ablation_V2.xlsx` — 벤치마크 정답지. "맞다/틀리다"의 유일한 기준
3. 이 문서의 나머지 — 구체적인 실행 방법

---

## 🎯 이 Sprint의 목표 — 정확히 1개

**`POTAL_Ablation_V2.xlsx` 벤치마크 전수 통과.**

- "100% 정확"의 실행 가능한 정의: 벤치마크 케이스 전부 pass + 신규 edge case 48시간 내 수정 체계 구축
- 경쟁사와의 비교는 하지 않는다. 우리 기능이 정답을 내는지만 본다
- 이 Sprint가 완료되어야 CW34-S2 (투명), CW34-S3 (빠름)이 의미가 있다. 정확이 투명과 빠름의 선행 조건이다

---

## 📐 왜 "정확"이 첫 번째인가

3축 (정확/빠름/투명)은 우선순위가 아니라 **동시 필수 조건**이다.
하나라도 빠지면 POTAL이 아니다. 3개 다 갖춰져야 한다.

하지만 실행은 한 번에 하나씩 해야 정확도가 올라간다 (CLAUDE.md 절대 규칙 5: 멀티태스킹 금지).
그래서 "다음 것에 영향을 주는 것부터" 순서를 정한다:

- 정확이 안 잡히면 → 투명(duty breakdown)을 보여줘도 **틀린 숫자의 breakdown**
- 정확이 안 잡히면 → 빠름(응답 속도)을 올려도 **틀린 답을 빨리 주는 것**
- 정확이 잡히면 → 투명을 올렸을 때 **맞는 답의 근거를 보여주는 것** = 신뢰 구축
- 투명이 잡히면 → 새 edge case에서 틀릴 때 **사용자든 우리든 바로 발견** = 유지보수 속도 상승

따라서 실행 순서: 정확 → 투명 → 빠름. 이번은 "정확".

---

## 🔍 현재 상태 — 어디가 100%에서 빠져 있는가

### 알려진 fail 케이스

| ID | 케이스 | 현재 결과 | 정답 | 원인 분류 |
|---|---|---|---|---|
| F1 | T6 water pump (KR→VN) | HS 840680 (steam turbines) | HS 8413 계열 (rotodynamic pump) | classifier `hs_keywords` DB 키워드 품질 |
| F2 | category hint "machinery-pumps" 줘도 840680 반환 | pump 관련 HS 8413 | `classifyWithOverride` 가 category → HS 매핑에서 pump 계열 누락 |

### 아직 모르는 fail 케이스

`POTAL_Ablation_V2.xlsx`를 전수 돌려봐야 안다. 이 Sprint의 **첫 번째 작업**이 바로 이것.

### 현재 classifier 파이프라인 (이해 필수)

```
입력: productName + (선택) hsCode hint + (선택) productCategory
  │
  ▼
deterministicOverride(productName, hsCode, productCategory)
  → DB `hs_classification_overrides` 6 rows 매칭 시 즉시 반환
  │ (miss)
  ▼
classifyWithVectorSearch(productName)
  → DB `hs_keywords` 47,505 rows 벡터 매칭
  │ (miss 또는 confidence 낮음)
  ▼
classifyProduct(productName)
  → AI classifier (GPT-4o-mini)
  │
  ▼
결과 → cache에 저장 → 다음 동일 입력은 cache hit
```

이 파이프라인의 각 단계에서 오답이 발생할 수 있다:
- `deterministicOverride`: 현재 6 rows만 있어서 커버리지 부족
- `hs_keywords`: 47,505 rows지만 키워드 품질 문제 (pump → steam turbines 매핑)
- AI classifier: cold-start 시 `engineStatus=unavailable`, 또는 아예 다른 HS 반환
- cache: 한 번 오답이 cache되면 계속 오답 반환

---

## 📋 작업 순서 (순차 — 한 번에 하나만)

### Step 1: 벤치마크 전수 실행 — pass/fail 리스트 생성

1. `archive/benchmarks/POTAL_Ablation_V2.xlsx` 읽기
2. 엑셀의 각 row가 테스트 케이스. 컬럼 구조 파악 (상품명, 출발국, 도착국, 기대 HS, 기대 duty rate 등)
3. 각 케이스를 현재 engine으로 실행하는 **자동화 스크립트** `scripts/verify-cw34-accuracy.mjs` 작성
4. 결과: `{케이스ID, 입력, 기대값, 실제값, pass/fail, 실패 원인 분류}` 형태의 리포트 생성
5. 전체 pass율 산출 (예: 847/1000 = 84.7%)

**이 단계에서 코드 수정 없음. 현황 파악만.**

### Step 2: fail 케이스 원인 분류

Step 1의 fail 리스트를 아래 카테고리로 분류:

| 카테고리 | 설명 | 수정 위치 |
|---|---|---|
| A. keyword 품질 | `hs_keywords` 테이블의 키워드가 잘못된 HS에 매핑 | `hs_keywords` DB row 수정 |
| B. override 누락 | `hs_classification_overrides`에 없어서 잘못된 경로로 빠짐 | override row 추가 |
| C. FTA rule 누락 | FTA 적용 안 되거나 잘못된 rate 적용 | `fta_product_rules` 수정 |
| D. duty 계산 오류 | HS는 맞는데 duty rate/additional tariff 계산이 틀림 | engine 로직 수정 |
| E. sanctions 누락/오탐 | 제재 대상인데 miss하거나, 아닌데 hit | `sanctioned_entities` 수정 |
| F. AI classifier 오답 | 위 A-B로 안 잡히고 AI가 틀린 답을 낸 케이스 | override 추가 또는 keyword 보강 |

**카테고리별 건수 집계 → 가장 많은 카테고리부터 수정.**

### Step 3: 카테고리별 수정 (가장 많은 것부터, 하나씩)

수정 원칙:
- **한 번에 1개의 fail 케이스만 수정**
- 수정 후 **전수 재실행** → 기존 pass가 깨지지 않는지 확인 (regression 방지)
- pass가 깨지면 → 수정 롤백 → 다른 접근법
- 수정할 때 **canned/mock 데이터로 통과시키기 절대 금지** — engine이 실제로 정답을 내야 함

수정 방법 (카테고리별):

**A. keyword 품질 수정**:
- `hs_keywords` 테이블에서 해당 상품의 키워드-HS 매핑 확인
- 잘못된 매핑 수정 또는 올바른 키워드 추가
- 수정 시 **해당 HS heading의 다른 상품들도 영향 받는지 확인** (한 keyword 수정이 다른 케이스를 깨뜨릴 수 있음)

**B. override 추가**:
- `hs_classification_overrides` 테이블에 row 추가
- override는 "특정 상품명 패턴 → 확정 HS" 매핑이므로 범위를 좁게 잡을 것 (너무 넓으면 다른 상품을 잡아먹음)

**C. FTA rule 수정**:
- `fta_product_rules` 테이블에서 해당 HS + 협정 조합 확인
- rule 누락이면 추가, rate 오류면 수정
- 수정 시 출처(source_citation) 반드시 기록

**D. duty 계산 로직 수정**:
- `app/lib/cost-engine/` 내 해당 계산 로직 확인
- MFN/FTA/AD-CVD/section301/VAT/GST 중 어느 단계에서 오류인지 특정
- 로직 수정 후 해당 duty type의 다른 케이스도 regression 확인

**E. sanctions 수정**:
- `sanctioned_entities` 테이블 row 확인
- false positive면 normalization 로직 수정, false negative면 entity 추가

**F. AI classifier 오답**:
- 가능하면 A(keyword) 또는 B(override)로 해결 (AI 의존도를 줄이는 방향)
- AI 자체를 수정할 수는 없으므로, 입력 단계에서 잡아내는 것이 최선

### Step 4: 전수 통과 확인

- `scripts/verify-cw34-accuracy.mjs` 전수 실행
- **100% pass** (또는 벤치마크 자체의 기대값이 논쟁적인 케이스는 별도 문서화)
- `verify-cw32.mjs` 28/28 green 유지 확인
- `verify-cw33.mjs` 23/23 green 유지 확인

### Step 5: Edge case 48시간 수정 체계 구축

- `scripts/verify-cw34-accuracy.mjs`를 CI/CD에 편입할 수 있는 형태로 정리
- 새 벤치마크 케이스 추가 방법 문서화 (엑셀에 row 추가 → 스크립트 재실행)
- 향후 사용자 리포트 또는 내부 발견 시 48시간 내 수정하는 프로세스 정의

### Step 6: 검증 + 문서 + 커밋

- `npm run build` green 확인
- `verify-cw32` 28/28 + `verify-cw33` 23/23 + `verify-cw34-accuracy` 전수 pass
- `docs/CW34_S1_ACCURACY_REPORT.md` 작성:
  - 벤치마크 전체 케이스 수
  - 초기 pass율 → 최종 pass율
  - 카테고리별 수정 건수 (A: N건, B: N건, ...)
  - 수정한 DB row 목록
  - 논쟁적 케이스 (있다면) 목록 + 근거
- 세션 문서 4개 업데이트: CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md
- 커밋: `CW34-S1 feat: accuracy sprint — Ablation V2 benchmark N/N pass`

---

## 🚫 절대 금지

1. **canned/mock 데이터로 벤치마크 통과시키기 금지** — 실제 engine이 정답을 내야 함
2. **한 번에 여러 fail 케이스 동시 수정 금지** — 1개 수정 → 전수 재실행 → 다음 1개
3. **keyword 수정 시 영향 범위 미확인 금지** — 1개 고치다 3개 깨뜨리면 안 됨
4. **벤치마크 기대값을 engine 결과에 맞춰 변경 금지** — 기대값이 정답, engine이 맞춰야 함
5. **경쟁사 결과와 비교하는 작업 금지** — 우리 벤치마크만 본다
6. **Hero/UI/마케팅 작업 금지** — 이 Sprint는 engine 정확성만
7. **B2C 코드 수정 금지** — CLAUDE.md 절대 규칙 1번
8. **console.log 남기기 금지** — CLAUDE.md 절대 규칙 4번
9. **빌드 깨진 상태로 push 금지** — CLAUDE.md 절대 규칙 2번
10. **투명(breakdown UI) 작업 금지** — CW34-S2에서 한다. 지금은 정확만
11. **빠름(cold-start/infra) 작업 금지** — CW34-S3에서 한다. 지금은 정확만

---

## 🧠 맥락 — 이 Sprint를 실행하는 Claude가 알아야 하는 것

### POTAL이 제공하는 것
"내 고객의 landed cost / 내 실제 마진" 딱 두 숫자. 가격 결정, 시장 선택, DDP/DDU 선택은 우리 영역이 아니다.

### "압도적"의 의미
우리 기능이 100% 제대로 작동하는 것. 경쟁사 대비가 아니다. 정답을 누가 더 잘 맞추느냐의 싸움이고, 우리는 100%에 수렴하면 된다. 거기에 더해 무료다. 비교 자체가 불필요한 싸움.

### 3축의 관계
정확/빠름/투명은 우선순위가 아니라 동시 필수 조건. 하지만 실행은 한 번에 하나씩. "다음 것에 영향을 주는 것부터" 처리하므로, 정확 → 투명 → 빠름 순서.

### "비개발자"란
코딩 모르는 대표가 데모를 보고 이해한 뒤, 자기 개발자/AI에게 전달하는 수준. 아무 이해 없이 바로 가져다 쓸 수 있는 건 아님.

### 기능적 완성이 먼저
Hero 재디자인, 광고판 영상, 브랜딩 등은 무조건 기능 100% 작동 후의 일. 지금은 건드리지 마라.

### 경쟁사 분석의 올바른 위치
"우리 vs 경쟁사" 비교 프레임은 불필요. 하지만 경쟁사 시스템을 참고해서 우리를 발전시키는 건 필요하면 한다. 이미 충분히 분석했고, 어떤 기능이 필요한지는 안다. 이제는 우리 자체의 완벽함에만 집중.

### Forever Free
유료 플랜 재도입 금지. Enterprise Contact Us만 허용. (CLAUDE.md 절대 규칙 9번)

---

## ✅ 완료 기준 (CW34-S1 닫힘 조건)

- [ ] `archive/benchmarks/POTAL_Ablation_V2.xlsx` 전수 pass (또는 논쟁적 케이스 문서화)
- [ ] `scripts/verify-cw34-accuracy.mjs` 작성 + 전수 자동 실행 가능
- [ ] `verify-cw32.mjs` 28/28 green 유지 (regression 없음)
- [ ] `verify-cw33.mjs` 23/23 green 유지 (regression 없음)
- [ ] fail 케이스 카테고리별 수정 내역 기록 (`docs/CW34_S1_ACCURACY_REPORT.md`)
- [ ] T6 pump 케이스 (840680 → 8413 계열) 해결됨
- [ ] `npm run build` green
- [ ] 세션 문서 4개 날짜 + 내용 업데이트
- [ ] 커밋 + push 완료

---

## 🔗 다음 Sprint 예고 (지금은 실행하지 마라)

- **CW34-S2 Transparency**: API response에 classification_reasoning, fta_reasoning, duty_breakdown, freight_assumptions, sanctions_check 5개 필드 추가 + UI breakdown 노출
- **CW34-S3 Speed**: cold-start 제거, engineStatus=unavailable 0건, p95 < 1.5s

이 Sprint(S1)가 완료되어야 S2/S3가 의미 있다. S1 완료 전에 S2/S3 작업 절대 금지.

---

**시작 명령**: `docs/IDENTITY.md` 읽고 → `archive/benchmarks/POTAL_Ablation_V2.xlsx` 읽고 → Step 1부터 순차 진행. 한 번에 하나의 fail 케이스만 수정. 막히면 원인 분류 재확인. 전수 재실행 빼먹지 마라.
