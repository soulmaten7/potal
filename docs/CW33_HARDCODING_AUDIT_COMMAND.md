# CW33 — Hardcoding Audit Command

**작성일**: 2026-04-11 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**선행 작업**: CW31 정직 리셋 + CW31-HF1 완전판 + CW32 correctness sweep (완료)
**목적**: 140개 기능 전수조사로 "프로덕션 수준 아님 / 하드코딩으로 작동만 되는" 코드를 전부 식별하고 CW33 작업 범위를 확정한다. API를 고객에게 팔기 전 필수 단계.

---

## 🚨 왜 지금 이걸 해야 하는가

CW32에서 FTA 하드코딩 + `deterministicOverride` + AI classifier cold-start mock 같이 **"데모 UI는 green인데 고객이 API 떼서 쓰면 터지는"** 패턴이 최소 3개 발견됐다. 은태님 지적대로 140개 기능 중 비슷한 패턴이 더 있을 확률이 높다.

Enterprise 고객에게 API를 판매하려면:
1. FTA/HS/관세/제재국 데이터가 **DB에서** 읽혀야 한다 (코드 재배포 없이 업데이트 가능)
2. Cold-start나 AI 실패 시 **mock이 아닌 rule-based fallback**으로 떨어져야 한다
3. `deterministicOverride` 같은 룰은 **관리자 UI / DB 테이블**로 이전돼야 한다

이걸 먼저 파악 안 하고 CW33을 "Supabase 이전"만으로 시작하면, 나중에 또 "어라 여기도 하드코딩이었네" 반복된다. **전수조사 먼저, 작업 범위 나중.**

---

## 📋 Scope

### Phase A — 감사 (이번 작업의 전부)
코드만 읽고 리포트 작성. 수정/리팩토링 금지.

### Phase B (CW33 본작업, 별도 세션)
감사 결과 기반으로 🔴/🟡 항목만 수정. 이 문서의 범위 아님.

---

## 🔍 스캔 대상 디렉토리

우선순위 순:

1. **`app/lib/cost-engine/**`** — FTA, HS classifier, duty rates, VAT, 운송비, DG, restriction
2. **`app/lib/**`** (cost-engine 제외) — denied party, screening, nexus 계산, 문서 생성
3. **`app/api/**`** — mock fallback, deterministic override, 고정 응답, rate limit
4. **`app/features/features-guides.ts`** — 140개 기능 카탈로그, 각 기능별 data source
5. **`components/home/**`** — SCENARIO_DEFAULTS, 예시 품목, 기본 선택
6. **`lib/scenarios/**`** — workflow-examples, seed 데이터
7. **`app/data/**`, `data/**`, `public/data/**`** — JSON/CSV 정적 데이터

**B2C 코드는 제외**: `lib/search/`, `lib/agent/`, `components/search/` (CLAUDE.md 절대 규칙 1번)

---

## 🧪 검색 패턴

각 디렉토리에 다음 grep 조합을 돌려라:

```bash
# 1. 명시적 하드코딩 마커
grep -rn "HARDCODED\|hardcoded\|HARD_CODED\|hard-coded\|TODO.*db\|TODO.*supabase\|TODO.*migrate\|FIXME.*hardcode" app/ lib/ components/ --include="*.ts" --include="*.tsx"

# 2. Mock/Fallback 패턴
grep -rn "mock\|fallback\|fake\|stub\|placeholder\|dummy" app/lib/ app/api/ --include="*.ts" | grep -v "\.test\."

# 3. 상수 객체 (큰 데이터 테이블)
grep -rn "^const [A-Z_]* = {" app/lib/ --include="*.ts" -A1

# 4. Array 리터럴 const export (리스트형 데이터)
grep -rnE "^export const [A-Z_]+\s*[:=].*\[" app/lib/ components/ --include="*.ts" --include="*.tsx"

# 5. deterministicOverride / override 류
grep -rn "deterministicOverride\|override\|forcedHs\|hsMapping\|hsRule" app/lib/ --include="*.ts"

# 6. 숫자 상수 (관세율, 환율, VAT 등 의심)
grep -rnE "(rate|tariff|duty|vat|gst|surcharge|fee)\s*[:=]\s*[0-9]+\.?[0-9]*" app/lib/cost-engine/ --include="*.ts"

# 7. Country / HS 리스트
grep -rn "countries\s*[:=]\|hsCodes\s*[:=]\|restrictions\s*[:=]" app/lib/ --include="*.ts"

# 8. Supabase 호출 여부 (있어야 할 곳에 없는지 확인)
grep -rn "supabase\|from(" app/lib/cost-engine/ --include="*.ts"
```

또한:
```bash
# fta.ts mergeWithHardcoded 같은 CW32 패턴이 다른 파일에도 있는지
grep -rn "mergeWith\|WithHardcoded\|WithFallback\|withDefault" app/lib/ --include="*.ts"
```

---

## 🏷️ 판별 카테고리 (반드시 4단계로 태깅)

각 발견 항목을 다음 중 **정확히 1개**로 태깅:

### 🔴 Critical — DB 이전 필수
고객 API 응답에 직접 영향 + 자주 업데이트되는 데이터
- **예**: FTA 관세율, HS-duty 매핑, 제재국 리스트, denied party 명단, VAT 테이블
- **조치**: Supabase 테이블 설계 + 마이그레이션 + DB 우선 경로
- **CW33 포함**: YES (P0)

### 🟡 Important — 외부 소스 연동 필요
계산 정확도에 영향 + 외부 API/피드 존재
- **예**: 환율 (실시간), 운송비 기준가, 유가 surcharge, 공휴일 캘린더
- **조치**: 외부 API 통합 또는 일일 cron sync
- **CW33 포함**: YES (P1)

### 🟢 Acceptable — UI seed / default
사용자 편의용 기본값, 정확성에 무관
- **예**: SCENARIO_DEFAULTS 예시 품목, 폼 기본 선택 국가, placeholder 텍스트
- **조치**: 없음 (하드코딩 OK)
- **CW33 포함**: NO

### ⚪ Legal/Static — 거의 안 변함
국제 표준 상수, 법령상 고정값
- **예**: UN DG 번호 정의, HS chapter 이름, ISO 국가 코드, SI 단위 변환
- **조치**: 없음 (하드코딩 OK)
- **CW33 포함**: NO

**주의**: "지금은 안 바뀌니까 🟢" 가 아니라 **"고객이 자기 지역/상품으로 API 쓸 때도 맞는 값인가?"** 기준으로 판단하라. FTA는 나라마다 다르니 당연히 🔴.

---

## 📂 조사해야 할 기능 리스트 (140개)

`app/features/features-guides.ts` 를 먼저 읽고, 각 기능별로:

1. 기능 ID + 이름
2. 데이터 소스 (DB? 하드코딩? 외부 API? AI?)
3. 카테고리 태그 (🔴/🟡/🟢/⚪)
4. 근거 파일:라인

140개 전부를 리포트에 한 줄씩 넣어라. 누락 금지.

---

## 📝 산출물 (반드시 아래 파일들 생성)

### 1. `docs/HARDCODING_AUDIT.md` (메인 리포트)

구조:
```markdown
# POTAL Hardcoding Audit — CW33 Phase A
날짜: 2026-04-11
감사 범위: app/lib/**, app/api/**, components/home/**, lib/scenarios/**, app/features/features-guides.ts

## Executive Summary
- 총 발견 건수: NN
- 🔴 Critical: NN (CW33 P0)
- 🟡 Important: NN (CW33 P1)
- 🟢 Acceptable: NN
- ⚪ Legal/Static: NN

## 🔴 Critical 항목 상세
### C-01: [제목]
- 파일: `app/lib/cost-engine/hs-code/fta.ts:123`
- 현재 상태: [코드 스니펫 5줄 이내]
- 영향: [고객 API에 어떻게 영향?]
- 권장 조치: [Supabase 테이블 스키마 제안]
- 난이도: S/M/L
- 우선순위: P0
...

## 🟡 Important 항목 상세
[동일 포맷]

## 🟢 Acceptable (요약만)
- SCENARIO_DEFAULTS (`lib/scenarios/workflow-examples.ts`) — UI seed
- ...

## ⚪ Legal/Static (요약만)
- UN3090/UN3091 정의 — IATA DGR 상수
- ...

## 140 Features 매트릭스
| ID | 이름 | 소스 | 카테고리 | 근거 |
|----|------|------|---------|------|
| F001 | ... | hardcoded | 🔴 | fta.ts:45 |
| ... (140행) |

## 부록: grep 결과 원문
[전체 grep 출력 캡처]
```

### 2. `docs/CW33_SCOPE.md` (작업 범위 제안)

감사 결과 중 🔴/🟡만 뽑아서:
- P0 (Critical, 반드시 CW33): [목록]
- P1 (Important, CW33 권장): [목록]
- 예상 소요 시간 (Sprint 단위)
- 권장 Sprint 분할: CW33-S1 (FTA+HS DB 이전), CW33-S2 (classifier+override DB 이전), ...
- Supabase 스키마 초안 (테이블명 + 주요 컬럼)

### 3. `docs/HARDCODING_AUDIT_RAW.txt` (grep 원본)

위 8개 grep 명령어를 모두 실행한 원본 출력. 나중에 재검증용.

---

## ✅ 검증 체크리스트

리포트 제출 전 스스로 확인:

- [ ] 140개 features 전부 매트릭스에 들어갔는가 (누락 0)
- [ ] 🔴 항목마다 Supabase 스키마 제안이 있는가
- [ ] CW32에서 이미 건드린 3개 (FTA, deterministicOverride, classifier cold-start) 가 🔴로 분류됐는가
- [ ] B2C 코드 (lib/search/, lib/agent/, components/search/) 는 **감사에서 제외**됐는가
- [ ] 8개 grep 명령어 전부 실행됐는가
- [ ] `HARDCODING_AUDIT_RAW.txt` 원본이 저장됐는가
- [ ] Executive Summary 숫자가 상세 섹션과 일치하는가

---

## 🚫 절대 금지

1. **코드 수정 금지** — 이번 작업은 **읽기 전용 감사**. 파일 1줄도 고치지 마라
2. **"일단 🟢으로 넘김" 금지** — 애매하면 🔴 / 🟡 로 태깅하고 근거 적어라
3. **141+ features 만들지 마라** — `features-guides.ts` 에 있는 것만
4. **B2C 코드 건드리지 마라** — 절대 규칙 1번
5. **숫자 추측 금지** — grep 결과 line 번호를 정확히 인용
6. **"곧 DB 이전 예정" 같은 기존 주석 신뢰 금지** — 있으면 있는 대로, 없으면 없는 대로 객관적으로 보고

---

## 📋 문서 업데이트 (감사 완료 시)

1. `CLAUDE.md` 헤더 — 날짜 업데이트 + "CW33 Phase A: Hardcoding audit — NN건 발견 (🔴 NN 🟡 NN)"
2. `docs/CHANGELOG.md` — CW33 Phase A 섹션 추가
3. `session-context.md` — 현재 TODO에 CW33-S1/S2 계획 추가
4. `docs/NEXT_SESSION_START.md` — 다음 세션은 CW33-S1부터
5. Notion Task Board — CW33 에픽 + 🔴 항목별 카드 생성 (Cowork에서 처리, Terminal에서는 패스)
6. 커밋 메시지: `CW33-A docs: hardcoding audit — NN critical, NN important`

---

## 💬 은태님 컨텍스트 (왜 이 작업이 중요한가)

CW32에서 "데모 UI는 완벽"이라고 보고했으나, 은태님 지적:
> "이제 데모에서 api를 복사해서 가져갈텐데 이제 데모가 데모가 아닌건데 이걸 하드코딩으로 작동이 되게만 해버리면 결국 기능이 제대로 작동안되는거 아냐"

정답이다. 데모 기준 green이 프로덕션 기준 green이 아니다. 140개 기능 전수조사로 "진짜 프로덕션 준비" 와 "데모로만 작동" 을 분리하고, CW33에서 🔴 전부 해결해야 Enterprise 고객에게 API 팔 수 있다.

완벽하게 감사하라. 대충 샘플링하거나 "나머지는 비슷할 것" 식으로 넘어가지 마라. 140개 전부, 한 줄씩.
