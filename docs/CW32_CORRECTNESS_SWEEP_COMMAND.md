# CW32 — Correctness Sweep (홈페이지 데모 정직성 2차)

**생성**: 2026-04-10 (KST) — Cowork → Terminal1 Opus
**전제**: CW31 (정직한 리셋) + CW31-HF1 (완전판) 배포 완료 상태. 21/21 live, p95 1195ms, production `ccc7044` 기준.
**원칙**: 이 5건은 backlog 가 아니라 **"홈페이지에서 보여주는 숫자와 문구가 거짓이 되는 케이스"**. Phase 2 트래픽 유입 전에 반드시 전부 해결. 쉽게 넘어가지 말 것. **퍼펙트하게** 고칠 것.

---

## 🎯 작업 범위 (5건 — 전부 필수)

| # | 코드 | 종류 | 증상 | 영향 |
|---|------|------|------|------|
| 1 | FTA-KR-GB | Engine/Data | KR→GB cotton $12k = $14,520, FTA null | Korea-UK CEPA (2019) 미적용 → 소비자에 과다 견적 |
| 2 | FTA-KR-CA | Engine/Data | KR→CA cotton $12k = $12,730, FTA null | 한-캐나다 FTA (2015 KCFTA) 미적용 |
| 3 | FWD-CONTRACT | API | `inputs.to: string[]` 보내면 mock fallback | 외부 개발자가 mock을 live 로 오인하여 잘못된 수치 사용 |
| 4 | HS-8506-CLASSIFY | Engine/Classifier | "Primary Lithium Battery (non-rechargeable)" → 8507 | HF1에서 추가한 8506 rule 이 분류기 누락으로 죽은 코드가 됨. 1차 리튬 HAZMAT 경고가 엔진 경로로 안 뜸 |
| 5 | COTTON-HS-DRIFT | Engine/Classifier | 단일: 610910 (knitted), forwarder 배치: 620630 (woven). 동일 입력 경로별 다른 HS | 홈페이지 데모에서 같은 제품이 다른 HS → 고객 혼란 |
| 6 | SELLER-UX | UI | 빈 폼 Calculate 버튼 disabled, 첫 방문자 혼란 | "데모가 안 움직인다" 첫 인상 리스크 |

(6번 UX 는 덤으로 추가. 5번까지는 정확성, 6번은 첫인상)

---

## 📋 사전 조사 가이드 (Opus 필독)

### 이미 존재할 가능성이 높은 자료

1. **CLAUDE.md** 자체 — 특히 "archive/benchmarks/POTAL_Ablation_V2.xlsx" 언급. HS 분류 벤치마크가 들어 있을 가능성
2. **`app/lib/cost-engine/`** 하위:
   - `fta/` 또는 `agreements/` 하위에 기존 FTA 테이블
   - `classification/` 또는 `classifier/` 하위에 HS 분류 로직
   - `restrictions/rules.ts` — HF1에서 HS 8506 추가했던 곳
3. **`app/api/classify/`** 또는 `app/api/hs/` — HS 분류 API 라우트
4. **`docs/`**:
   - `FTA_COVERAGE.md` / `ENGINE_DATA.md` / `HS_CLASSIFIER.md` 존재 확인
   - `CHANGELOG.md` 에서 과거 FTA 추가 커밋 검색 (`git log --all --oneline | grep -i fta`)
5. **`session-context.md`** — 과거 FTA 작업 이력
6. **`archive/benchmarks/POTAL_Ablation_V2.xlsx`** — HS 분류 ground truth

### 외장하드/백업 위치 (찾기 어려우면)

- `~/potal-backups/` 또는 `/Volumes/` 아래 마운트된 외장드라이브
- `find /Volumes -type f -name "*fta*" -o -name "*FTA*" 2>/dev/null`
- `find ~ -type f -iname "*korea*uk*" -o -iname "*KCFTA*" 2>/dev/null | head -50`
- 과거 세션 로그: `ls /sessions/*/mnt/.claude/projects/` — 이전 FTA 작업 대화

### Git 히스토리 조사

```bash
cd ~/potal
git log --all --oneline --diff-filter=A -- "app/lib/cost-engine/fta/*" 2>/dev/null
git log --all --oneline -S "KORUS" -- "app/lib/" | head -20
git log --all --oneline -S "KCFTA" | head -20
git log --all --oneline -S "Korea-UK" | head -20
git log --all --oneline -S "CEPA" | head -20
```

**찾은 것을 이 문서 상단에 "발견한 자료" 섹션으로 기록할 것**. 아무것도 못 찾아도 "못 찾음" 명시.

---

## 🔧 작업 1: FTA-KR-GB (Korea-UK CEPA 2019)

### 재현

```bash
curl -s -X POST http://localhost:3000/api/demo/scenario \
  -H 'content-type: application/json' \
  -d '{"scenarioId":"forwarder","inputs":{"product":"Cotton T-shirts","from":"KR","destinations":["GB"],"value":12000,"quantity":1000}}' \
  | jq '.data.result.landedCost.total, .data.result.comparisonRows[0].ftaName'
```

**현재**: `14520`, `null`
**기대**: `13080` 내외 (knitted T-shirts HS 610910 기준 GB duty 12% → 0%, VAT 20% 유지), `"Korea-UK Free Trade Agreement"` 또는 `"UK-Korea CEPA"`

### 근본 원인 조사

1. `app/lib/cost-engine/` 아래에서 `KORUS`, `EU-Korea`, `RCEP` 등이 정의된 파일 찾기
2. 해당 파일의 데이터 구조 (배열 / Map / JSON) 파악
3. GB-KR 엔트리가 없는 것을 확인

### 수정 사항

1. Korea-UK CEPA 엔트리 추가:
   - **정식 명칭**: "United Kingdom-Korea Free Trade Agreement" (통상 "Korea-UK FTA" 또는 "UK-Korea CEPA")
   - **발효일**: 2021-01-01 (브렉시트 후 승계, 2019 서명)
   - **기본 규칙**: EU-Korea FTA rules of origin 승계 (CTH + RVC 45% 또는 단일 rule)
   - **Chapter 61-62 (apparel)**: 단계적 철폐 완료 상태 (2016년부터 0% 기준), GB 수입 관세 0%
2. 양방향 지원 확인 (KR→GB 와 GB→KR 모두)
3. 기존 FTA 엔트리가 JSON 파일이면 JSON 수정, TS 객체면 TS 수정

### 검증

로컬 빌드 후:
- KR→GB cotton T-shirts $12,000 → duty $0, total ≈ $13,080 (VAT 12000×1.09×0.2=$2616 에 가깝게 계산되는지 확인, 실제 값은 엔진 로직에 따름)
- GB→KR 역방향 FTA 적용 확인

### 주의

**정식 관세율 데이터가 없으면 만들어내지 말 것**. 데이터가 없으면 "해당 FTA 기본 규칙 적용, 품목별 관세는 general rate" 로 표시하고 general 관세는 유지하되 `ftaName`, `ruleOfOrigin` 필드만 채우는 것도 방법. 단, 이 경우 홈페이지 비교 테이블에서 "FTA applies — general rate retained" 같은 주석 필수.

---

## 🔧 작업 2: FTA-KR-CA (KCFTA 2015)

### 재현

```bash
curl -s -X POST http://localhost:3000/api/demo/scenario \
  -H 'content-type: application/json' \
  -d '{"scenarioId":"forwarder","inputs":{"product":"Cotton T-shirts","from":"KR","destinations":["CA"],"value":12000,"quantity":1000}}' \
  | jq '.data.result.comparisonRows[0]'
```

**현재**: `ftaName: null`, total $12,730
**기대**: `"Korea-Canada Free Trade Agreement"` (코드 `KCFTA`), GB/JP 대비 유리한 총액

### 사실 확인

- **협정 명**: Canada-Korea Free Trade Agreement (CKFTA / KCFTA)
- **발효**: 2015-01-01
- **텍스타일 (Chapter 50-63)**: 2015년 기준 단계 철폐 시작, 2025년 기준 상당수 품목 0% 달성
- Cotton knitted T-shirt (6109.10): CA 기본 관세 18% → KCFTA 10년차 0% (2025년 이후 0%)

### 수정

작업 1과 동일한 FTA 테이블에 엔트리 추가. 규칙:
- **코드**: `KCFTA`
- **명**: `Canada-Korea Free Trade Agreement`
- **RoO**: CTH + RVC 40% (일반 규칙)
- **품목별 관세표**: 텍스타일 2025-01-01 이후 0% 적용 (현재 2026-04)

### 검증

```bash
curl -s -X POST http://localhost:3000/api/potal/lookup-fta \
  -d '{"origin":"KR","destination":"CA","hsCode":"6109.10"}' | jq
```

→ `{ found: true, code: "KCFTA", preferentialRate: 0 }`

---

## 🔧 작업 3: FWD-CONTRACT (forwarder 필드명 관대화)

### 재현

```bash
# live
curl -X POST /api/demo/scenario -d '{"scenarioId":"forwarder","inputs":{"from":"KR","destinations":["US","DE"],"value":12000}}'
# mock (silent fallback — BAD)
curl -X POST /api/demo/scenario -d '{"scenarioId":"forwarder","inputs":{"from":"KR","to":["US","DE"],"value":12000}}'
```

두 번째가 `source: "mock"` 이 되어 조용히 mock 데이터를 돌려줌. 외부 개발자가 이것을 live 로 오인.

### 조사

- `app/api/demo/scenario/route.ts` 의 `buildForwarderInputs()` 함수 (HF1에서 추가됨)
- 현재 `inputs.destinations` 만 읽고 `inputs.to` 가 배열이면 무시하여 engine path가 안 타고 mock fallback됨

### 수정안 (둘 다 적용)

1. **양쪽 필드명 허용**: `const destinations = Array.isArray(inputs.destinations) ? inputs.destinations : (Array.isArray(inputs.to) ? inputs.to : null);`
2. **불명확한 입력에 경고**: forwarder 시나리오에 `inputs.to` 가 string (단일) 이면 `[inputs.to]` 로 승격. 배열이면 그대로 사용.
3. **테스트**: `to`, `destinations`, 단일 string 3가지 경우 모두 live 경로로 진입하는지 확인
4. **API 문서화**: `docs/API_CONTRACT.md` (없으면 신설) 에 forwarder 시나리오 입력 스키마 명시:
   ```
   forwarder.inputs: {
     product: string;
     from: string (ISO2);
     destinations: string[] | to: string | string[];  // 둘 중 하나 필수
     value: number;
     quantity?: number;
   }
   ```

### 검증

3가지 입력 쉐이프 전부 `source: "live"` + comparisonRows 정상 반환하는 것을 21-case 매트릭스 이후에 추가.

---

## 🔧 작업 4: HS-8506-CLASSIFY (Primary lithium 인식)

### 재현

```bash
curl -X POST /api/demo/scenario -d '{"scenarioId":"exporter","inputs":{"product":"Primary Lithium Battery (non-rechargeable)","from":"KR","to":"US","value":250,"quantity":1000}}'
```

**현재**: `hsCode: 8507.60` (Li-ion rechargeable), `source: mock`
**기대**: `hsCode: 850610` 또는 `850680` (primary cells), `source: live`, HAZMAT UN3090/UN3091 경고 surfacing

### 근본 원인

HF1에서 `restrictions/rules.ts` 에 HS 8506 rule 을 추가했으나, **classifier** 가 "primary" / "non-rechargeable" 키워드를 8506 으로 매핑하지 못함. 결과적으로 분류기는 여전히 "lithium battery" → 8507 로만 보냄 → 8506 rule 은 영원히 안 탐 (dead code).

### 조사 위치

- `app/lib/cost-engine/classification/` 또는 `classifier/` 아래에서 "lithium" 키워드 처리 로직
- 또는 `app/lib/hs/` / `app/lib/tariff/classify.ts`
- v3.3 GRI pipeline 관련 파일 — `productName` + `material` 을 받아 HS 를 반환하는 함수
- `grep -rn "8507" app/lib/` / `grep -rn "lithium" app/lib/`

### 수정 방안

1. **키워드 사전 확장**: classifier 내부에 "primary lithium" / "non-rechargeable" / "disposable lithium" / "lithium cell" → **8506** 매핑 추가
2. **우선순위 규칙**: "primary" 또는 "non-rechargeable" 토큰 감지 시 8506 우선, 그 외 lithium → 8507
3. **rechargeable / li-ion / secondary** 토큰은 명시적으로 8507 유지
4. "battery" 단독은 8507 (기본값, 현재와 동일)

### 검증 케이스 (8개 추가)

```
1. "Primary Lithium Battery (non-rechargeable)" → 8506
2. "Lithium Cell CR2032" → 8506
3. "Disposable Lithium Battery" → 8506
4. "Lithium-ion Battery Pack" → 8507
5. "Rechargeable Li-ion Cell" → 8507
6. "Li-ion Accumulator 18650" → 8507
7. "Lithium Battery" (모호) → 8507 (기본값 유지)
8. "Primary Alkaline Battery" → 8506 (alkaline primary도 8506 범주)
```

각 케이스에 대해 `source: live` + 올바른 HS + HAZMAT 경고 (8506: UN3090/3091, 8507: UN3480/3481) 검증.

---

## 🔧 작업 5: COTTON-HS-DRIFT (경로별 HS 일관성)

### 재현

```bash
# D2C 단일 (seller 도 동일)
curl -X POST /api/demo/scenario -d '{"scenarioId":"d2c","inputs":{"product":"Cotton T-Shirt","from":"KR","to":"DE","value":29}}'
# forwarder 배치
curl -X POST /api/demo/scenario -d '{"scenarioId":"forwarder","inputs":{"product":"Cotton T-shirts","from":"KR","destinations":["DE"],"value":12000,"quantity":1000}}'
```

**현재**: 단일 `610910`, 배치 `620630`
**기대**: 동일 입력이면 동일 HS. 제품명이 "Cotton T-shirts" 이면 두 경로 모두 **610910** (knitted) 이어야 함. 620630 은 여성용 woven 셔츠.

### 근본 원인

`buildEngineInput` vs `buildForwarderInputs` 가 서로 다른 classifier 경로를 타거나, forwarder 가 `productCategory: "apparel"` 만 넣고 `processing: "knitted"` 를 안 넣어서 classifier 가 기본값 woven 으로 떨어짐.

### 조사

- `app/api/demo/scenario/route.ts` 내 `buildEngineInput` vs `buildForwarderInputs` 비교
- 두 함수가 engine 에 넘기는 `GlobalCostInput` 의 필드 차이 diff
- `processing`, `composition`, `material`, `productCategory` 필드 전달 여부 확인

### 수정

1. `buildForwarderInputs` 가 `buildEngineInput` 과 동일한 classifier hint (processing, material, composition) 를 전달하도록 통일
2. 또는 공통 helper `buildClassificationHints(productName)` 추출:
   ```ts
   function buildClassificationHints(productName: string) {
     const p = productName.toLowerCase();
     const hints: Partial<GlobalCostInput> = {};
     if (/t.?shirt|tshirt|tee/.test(p)) {
       hints.processing = 'knitted';
       hints.productCategory = 'apparel';
     }
     if (/cotton/.test(p)) hints.material = 'cotton';
     if (/leather/.test(p)) hints.material = 'leather';
     // ...
     return hints;
   }
   ```
   양쪽 builder 가 이 함수를 호출.
3. 단일 폼에서 나오는 HS 를 ground truth 로 삼고, forwarder 경로가 반드시 같은 HS 를 반환하도록 일치화.

### 검증

21-case 매트릭스의 D2C (610910) vs Forwarder (동일 제품) HS 가 완전 일치하는지 자동 검증 스크립트 추가.

---

## 🔧 작업 6: SELLER-UX (첫 방문 disabled 해소)

### 현상

`https://www.potal.app/?type=seller` 첫 진입 시 Calculate 버튼 `cursor-not-allowed` disabled. 사용자가 "데모가 고장남" 으로 오해할 수 있음.

### 해결 옵션 (택 1)

1. **placeholder 예시 자동 입력** (권장): seller 시나리오 진입 시 `product: "Leather Wallet"`, `from: "KR"`, `to: "US"`, `value: 45` 기본값 자동 주입. 사용자는 그대로 Calculate 누르면 $50.83 결과를 바로 봄.
2. "Try example" 버튼 추가: 클릭 시 위 값 주입
3. 각 시나리오별 기본값을 `SCENARIO_DEFAULTS` (이미 존재) 에서 읽어와 폼 초기값으로 설정

**1번 채택**. 기존 `SCENARIO_DEFAULTS` 에 값이 있으면 그대로 사용.

### 파일

- `components/home/NonDevPanel.tsx` 또는 `ScenarioPanel.tsx`
- 시나리오 전환 시 `useEffect` 에서 `SCENARIO_DEFAULTS[scenarioId]` 를 폼 state 로 복사

### 주의

사용자가 이미 입력한 값이 있으면 덮어쓰지 말 것 (initial mount 에서만 적용).

### 검증

5개 시나리오 (seller, d2c, importer, exporter, forwarder) 모두 진입 즉시 버튼 활성화 상태이고, Calculate 누르면 default 결과가 보여야 함. CUSTOM 은 예외 (feature 선택 UI).

---

## 📊 CW32 검증 매트릭스 (총 31 cases 목표)

### 기존 21 (CW31 + HF1) — 전부 regression-free 유지 필수

| # | Scenario | 요약 | 기대 |
|---|----------|------|------|
| 1-18 | CW31 18 cases | 전부 live, p95 < 1200ms | $0.00 diff |
| 19-21 | Forwarder 3-dest (US/DE/JP) | comparisonRows × 3 | HF1 기준 유지 |

### CW32 신규 10 cases

| # | Scenario | Input | 기대 HS | 기대 FTA |
|---|----------|-------|---------|----------|
| 22 | forwarder | KR→GB cotton $12k | 610910 | Korea-UK |
| 23 | forwarder | KR→CA cotton $12k | 610910 | KCFTA |
| 24 | forwarder | KR→[US,GB,CA,DE,JP] cotton $12k (5개) | 610910 | 각 해당 FTA |
| 25 | forwarder | `to: ["US","DE"]` 필드명 호환 | — | source: live |
| 26 | exporter | KR→US primary lithium CR2032 $250×1000 | 8506 | KORUS, UN3090 경고 |
| 27 | exporter | KR→US Lithium-ion Battery Pack $250×1000 | 8507 | KORUS, UN3480 경고 |
| 28 | d2c vs forwarder | Cotton T-Shirt 양 경로 HS 일치 | 단일=배치 | HS drift 0 |
| 29 | seller UX | ?type=seller 진입 Calculate active | — | btn.disabled=false |
| 30 | d2c UX | ?type=d2c 진입 Calculate active | — | 동일 |
| 31 | exporter UX | ?type=exporter 진입 Calculate active | — | 동일 |

### 자동 검증 스크립트

`scripts/verify-cw32.mjs` (신설): 31 case 전부 fetch → JSON diff → HS/FTA/total 비교 → 실패 즉시 리포트. CI 연결 (선택).

---

## 📁 수정 파일 예상 리스트

(실제 탐색 후 Opus가 확정)

- `app/lib/cost-engine/fta/*.ts` 또는 `.json` (FTA 테이블)
- `app/lib/cost-engine/classification/*.ts` (HS classifier)
- `app/lib/cost-engine/restrictions/rules.ts` (HF1에서 이미 수정, 추가 변경 가능성)
- `app/api/demo/scenario/route.ts` (buildEngineInput / buildForwarderInputs 통일)
- `components/home/NonDevPanel.tsx` 또는 `ScenarioPanel.tsx` (UX 기본값)
- `lib/scenarios/workflow-examples.ts` (`SCENARIO_DEFAULTS`)
- `docs/API_CONTRACT.md` (신설)
- `scripts/verify-cw32.mjs` (신설)
- `CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md` (4개 문서 필수)

---

## 🔐 배포 체크리스트

- [ ] 사전 조사 완료 (FTA 데이터 소스 찾거나 "없음" 확인)
- [ ] 작업 1 (Korea-UK) 완료 + 단독 테스트 통과
- [ ] 작업 2 (KCFTA) 완료 + 단독 테스트 통과
- [ ] 작업 3 (forwarder contract) 완료 + 3가지 입력 쉐이프 테스트
- [ ] 작업 4 (HS 8506 classifier) 완료 + 8개 battery 케이스 테스트
- [ ] 작업 5 (cotton HS drift) 완료 + 단일 vs 배치 일치
- [ ] 작업 6 (seller UX) 완료 + 5개 시나리오 초기 진입 테스트
- [ ] `npm run build` 통과
- [ ] `scripts/verify-cw32.mjs` 31/31 green
- [ ] CW31 기존 21 cases regression $0.00 diff 확인
- [ ] p95 < 1300ms 유지 (cold start 별도)
- [ ] git commit + push (`ccc7044..` 부터)
- [ ] 프로덕션 배포 후 Chrome MCP 재검증 (Cowork 에서)

---

## 📝 4개 문서 업데이트 (세션 종료 전 필수)

### `CLAUDE.md` 헤더

```
# 마지막 업데이트: 2026-04-MM KST (CW32 "Correctness Sweep": Korea-UK CEPA + KCFTA engine 엔트리 추가, HS 8506 primary lithium classifier 키워드 사전 확장, forwarder contract `to`/`destinations` 양쪽 허용, cotton HS drift (단일/배치) 통일, seller 시나리오 SCENARIO_DEFAULTS 자동 pre-fill. 31/31 live p95 <1300ms. 475 pages ✓)
```

### `docs/CHANGELOG.md`

CW32 섹션 추가:
- Fixed: Korea-UK FTA (CEPA 2019) 엔진 누락 → KR↔GB 양방향 FTA 적용
- Fixed: Korea-Canada FTA (KCFTA 2015) 엔진 누락
- Fixed: HS 8506 classifier 키워드 매핑 누락 (HF1 rule dead code 상태)
- Fixed: forwarder scenario `inputs.to: string[]` silent mock fallback
- Fixed: Cotton T-shirt HS drift (단일 610910 vs 배치 620630)
- Added: seller/d2c/importer/exporter SCENARIO_DEFAULTS 자동 pre-fill
- Added: `scripts/verify-cw32.mjs` (31-case 자동 검증)
- Added: `docs/API_CONTRACT.md` (forwarder 시나리오 입력 스키마)

### `session-context.md`

CW32 완료 블록:
- 21 → 31 cases, $0.00 regression
- 5 correctness bugs eliminated
- Phase 2 트래픽 유입 준비 완료

### `docs/NEXT_SESSION_START.md`

다음 세션 첫 읽기 문서 갱신:
- CW32 완료
- Phase 2 시작점: 트래픽 유입 전략 논의

---

## ⚠️ 절대 하지 말 것

1. **5건 중 일부만 건드리고 "충분" 선언 금지** — 6개 전부 완료 후에만 commit
2. **FTA 관세율 데이터 상상으로 만들지 말 것** — 못 찾으면 general rate 유지 + ftaName 만 채우고 "preferential rate pending" 주석
3. **classifier 로직 수정 후 21-case regression 검증 생략 금지** — 기존 HS 결과가 바뀌면 안 됨
4. **mock-results.ts 수치 수정 금지** — CW31에서 확립한 live 경로가 ground truth
5. **B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 절대 건드리지 말 것** — CLAUDE.md 절대 규칙

---

## 📦 참고: 찾을 만한 명령어 모음

```bash
# FTA 테이블 위치 찾기
cd ~/potal
find app/lib -type f \( -name "*.ts" -o -name "*.json" \) | xargs grep -l "KORUS\|FTA\|free trade" 2>/dev/null | head -20

# 분류기 위치
find app/lib -type f -name "*.ts" | xargs grep -l "classify\|hsCode" 2>/dev/null | head -20

# 과거 FTA 작업 커밋
git log --all --oneline -S "KORUS" --diff-filter=A | head -20
git log --all --oneline --grep -i "fta" | head -20

# 외장 드라이브
ls /Volumes 2>/dev/null
find /Volumes -type f -iname "*fta*" 2>/dev/null | head

# archive benchmark
ls archive/benchmarks/
```

---

## 🏁 완료 조건

- 31/31 live cases green
- 6개 작업 전부 commit 에 포함
- 4개 문서 (CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md) 날짜 갱신
- Production 배포 완료
- Cowork Chrome MCP 재검증 (31 cases + UI 라운드트립) 통과
- Notion Session Log 에 CW32 블록 추가

**그 전에는 미완료**. 쉽게 넘어가지 말 것.

— 2026-04-10 KST, Cowork
