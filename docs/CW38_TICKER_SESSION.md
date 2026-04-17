# CW38 다음 세션 — 홈페이지 LiveTicker 개선
> 생성일: 2026-04-17 18:15 KST
> 이 파일 하나만 읽으면 새 세션이 바로 작업 시작할 수 있도록 모든 맥락을 담았음

---

## 1. 나는 누구인가 (프로젝트 맥락)

**POTAL** = 크로스보더 커머스 Total Landed Cost 계산 인프라. Forever Free ($0, 140개 기능).
- CEO: 장은태 (코딩 초보자, 한국어 소통, 코드 용어는 영어)
- 스택: Next.js + Supabase + Vercel (https://potal.app)
- 경로: `~/potal/`
- **반드시 `CLAUDE.md` 먼저 읽을 것** — 절대 규칙 16개 + 문서 업데이트 규칙 + 세션 종료 체크리스트

---

## 2. 직전 세션에서 뭘 했나 (CW38 Phase 1~7)

CW38은 **데이터 인프라 완성** 세션이었음. 7단계를 걸쳐 POTAL의 모든 데이터가 자동으로 갱신될 수 있는 구조를 만들었음.

| Phase | 내용 | 산출물 |
|-------|------|--------|
| 1 | DB 전환 + Ghost Table Fix | tariff-updater.ts 테이블명 수정, country_profiles 53→240 |
| 2 | Auto-Update Pipeline | VAT/de minimis/US tax cron 3개 추가, vercel.json 28 crons |
| 3 | DB 진단 | 핵심 테이블 OK, MacMap DB 실사용 확인, cron 5개 green |
| 4-5 | 27개국 데이터 수집 + Source Registry | source-registry.json (104.9KB), CLAUDE.md Rule 16 |
| 6 | 하드코딩↔DB 동기화 | IN de minimis 불일치 2건 수정 (8e66bd1) |
| 7 | Data Master List + Scheduled Task 완성 | POTAL_DATA_MASTER_LIST.md 170개 + 3개 Task 프롬프트 재작성 |

**핵심 결론**: 수동/미연결 0개 달성. 모든 데이터 소스에 갱신 경로 연결됨.

### 자동 갱신 구조 (완성됨)
```
Scheduled Task (Cowork)
  → ~/potal/docs/auto-commands/ 에 .md 명령어 파일 생성
  → Mac launchd 10분마다 감지
  → Claude Code가 명령어 읽고 실행
  → Supabase DB 업데이트 + 코드 하드코딩 .ts 파일 직접 수정 + npm run build + git push
```

### Scheduled Task 3개 (갱신 주기)
| Task ID | 주기 | 대상 |
|---------|------|------|
| potal-annual-data-refresh | 연간 (1월 15일) | MacMap 2.4억, 관세 스케줄, HS 코드, 판례 + 8개 코드 파일 |
| potal-quarterly-fta-check | 분기 (1,4,7,10월 1일) | FTA 협정 변경 + 3개 코드 파일 |
| potal-semiannual-hardcoded-check | 반기 (1,7월 1일) | VAT, 면세, 세금, 수출통제, 수입제한 + 8개 코드 파일 |

### 하드코딩 15개 = 전부 Supabase와 중복
코드에 직접 박혀있는 데이터 상수 15개가 전부 DB에도 있음. Scheduled Task가 실행되면 Claude Code가 DB 값과 코드 값을 비교해서 불일치 시 코드를 직접 수정하고 build+push.

---

## 3. 이번 세션에서 할 일: 홈페이지 LiveTicker 개선

### 3-1. 현재 티커 상태

**이미 작동 중인 것들:**
- `components/ticker/LiveTicker.tsx` — 2줄 marquee 티커, `/api/v1/data-freshness` API 호출
- `lib/ticker/live-status.ts` — 12개 소스 메타데이터 (USITC, EU TARIC, UK, CA, AU, KR, JP, MacMap, Exchange Rates, Section 301/232, Trade Remedies, FTA)
- `app/api/v1/data-freshness/route.ts` — Supabase에서 각 테이블의 최신 timestamp 조회, 5분 캐시
- `app/lib/data-management/master-data-registry.ts` — 32개 데이터 소스 메타데이터 레지스트리
- `data/ticker-fallback.json` — API 실패 시 폴백 데이터
- 홈페이지 `app/page.tsx` line 938에서 `<LiveTicker />` 렌더링

**현재 문제점 / 개선 필요:**
- 티커에 12개 소스만 표시 중 — master-data-registry에는 32개, 실제 POTAL 데이터 소스는 170개
- `live-status.ts`의 `SOURCE_META`에 12개만 하드코딩 → master-data-registry.ts와 이중 관리
- `ticker-fallback.json`의 lastUpdated가 2026-03-14로 한 달 넘게 stale
- 디자인/UX 개선 여지 (CEO가 판단)

### 3-2. 관련 파일 맵

```
components/ticker/LiveTicker.tsx       ← UI 컴포넌트 (2줄 marquee)
lib/ticker/live-status.ts              ← 12개 소스 메타 + 유틸함수
app/api/v1/data-freshness/route.ts     ← Supabase 최신 timestamp 조회 API
app/lib/data-management/master-data-registry.ts  ← 32개 소스 레지스트리
data/ticker-fallback.json              ← API 폴백 데이터
app/page.tsx (line 938)                ← <LiveTicker /> 렌더링 위치
components/home/DataSourceTicker.tsx   ← 구버전 (사용 안 함, 참고용)
```

### 3-3. 데이터 흐름

```
master-data-registry.ts (32개 소스 정의)
  ↓
data-freshness/route.ts (각 소스의 primary table에서 max(timestamp) 조회)
  ↓ JSON response: { sources: [{ name, lastUpdated, ... }] }
LiveTicker.tsx (5분마다 fetch → apiToLiveSources() → 2줄 marquee)
  ↓ 매칭은 live-status.ts의 SOURCE_META 기준 (12개만)
```

### 3-4. CEO가 원하는 것

은태님이 아직 구체적 디자인/방향을 말하지 않았음. 이번 세션 시작 시 **먼저 물어볼 것**:
1. 티커에 몇 개 소스를 표시할 건지 (현재 12 → 32? 또는 주요 몇 개만?)
2. 디자인 변경이 있는지 (2줄 유지? 색상? 크기?)
3. 표시할 정보 (소스명 + 업데이트 시간만? 추가 정보?)
4. 홈페이지에서의 위치 변경?

**주의**: CLAUDE.md Rule 15 — 전문가적 견해 + 객관적 판단. 과도한 엔지니어링 제안 금지. 필요한 것에만 집중.

---

## 4. 프로젝트 핵심 파일 (필요 시 참조)

| 파일 | 언제 읽나 |
|------|----------|
| `CLAUDE.md` | **매 세션 시작 시 필수** — 절대 규칙 16개 |
| `session-context.md` | 프로젝트 전체 히스토리 |
| `docs/POTAL_DATA_MASTER_LIST.md` | 170개 데이터 소스 전체 목록 |
| `docs/DATA_SOURCE_AUDIT_REPORT.md` | Supabase 테이블 현황 |
| `docs/HOMEPAGE_REDESIGN_SPEC.md` | 홈페이지 리디자인 12결정 (티커=결정2) |
| `docs/EXTERNAL_DRIVE_FILES.md` | 외장하드 데이터 목록 |
| `.cursorrules` | 코딩 표준, 파일 매핑 |
| `docs/CREDENTIALS.md` | API 키, Supabase 연결 |

---

## 5. 절대 지켜야 할 것

1. **CLAUDE.md를 반드시 먼저 읽어라** — 거기에 절대 규칙 16개가 있음
2. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 보존만
3. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **모바일 반응형 불필요** — 데스크톱 전용 (Rule 14)
7. **과도한 엔지니어링 금지** — 필요한 것에만 집중 (Rule 15)
8. **데이터 작업 전 기존 상태 확인** — EXTERNAL_DRIVE_FILES.md + DATA_SOURCE_AUDIT_REPORT.md + Supabase row count (Rule 16)
9. **하드코딩 금지** — 오류 시 근본 원인 진단 우선 (Rule 12)
10. **작업 완료 시 문서 4개 업데이트** — CLAUDE.md 날짜, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md
11. **Notion Session Log에 세션 기록** — Cowork에서 처리

---

## 6. 은태님 스타일 (중요)

- 코딩 초보자 — 기술 설명 간결하게, 작업은 직접 해줘야 함
- 정확성 최우선, 과장 표현 싫어함
- "할까요?" 묻지 말고 확신을 갖고 말해라
- 똑같은 대화 반복하면 매우 화남
- 영문 콘텐츠 작성 시 한글 번역 필수
- 한국어 소통, 코드/기술 용어는 영어 그대로

---

## 7. 터미널 구조

| 터미널 | 모델 | 용도 |
|--------|------|------|
| 터미널1 | Opus | 메인 작업용 (Cowork 명령어 바로 실행) |
| 터미널2 | Sonnet | 보조/병렬 작업 |
| 터미널3 | Opus | 오래 걸리는 디테일 작업 |
| 터미널4 | — | Mac 터미널 (git push, 시스템 명령어) |

---

## 8. 최근 커밋 히스토리

```
8e66bd1 — docs(cw38): Phase 6 sync report — 하드코딩↔DB 동기화 완료
87ebc8a — (Phase 6 동기화 시작)
8fa6c76 — Phase 5: Auto Command Runner 브릿지
48dcdac — Phase 4: us-tax-monitor URL 수정
0ce9ee7 — Phase 3: DB 진단
cf705a1 — Phase 2: Auto-Update Pipeline
b3d905d — Phase 1: DB 전환 + Ghost Table Fix
```
+ 문서 커밋: `docs(cw38): Phase 4-7 — Data Master List 170개 + Scheduled Task 재작성 + 동기화 명령어`

---

## 9. 확인 예정 일정 (자동)

- **4/18 10:00 KST**: duty_rates_live 테이블 검증 (potal-duty-rates-live-verify)
- **4/21 10:00 KST**: Phase 2 cron 첫 실행 확인 (potal-phase2-cron-first-run)
- **5/1 19:00 KST**: VAT monitor + US tax monitor 첫 실행 확인

---

## 10. TODO 잔여 (티커 외)

티커 작업 후에 다룰 수 있는 잔여 항목들:
- CW34-S2: Multi-currency support
- Classifier keyword quality sweep (pump/motor/engine)
- v3 classifier pipeline 리팩토 (P0.11)
- US state sales tax 2026 재수집
- P1.2-P1.8 외부 API provisioning
