# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-04-14 KST (CW34-S1 HF2 — Compare Countries 프로덕션 검증 완료 + API 응답 14개 필드 확장 + HsCodeCalculator 10필드 팝업. 다음 세션 우선순위: **(1) D2C Brand 나머지 2개 endpoint 검증** — FTA Eligibility, DDP vs DDU, **(2) Importer/Exporter/Forwarder 12개 endpoint 검증**, **(3) Decision tree 확장** — heading 4202 외 다른 heading들에도 적용 (Ch.61/62 의류, Ch.85 전자 등), **(3) Classifier keyword quality sweep** (pump/motor/engine machinery 하위 구분), **(4) CW34-S2 Multi-currency support** (engine convertCurrency는 이미 존재, Playground에서 currency 선택이 calculate API에 전달되는지 확인), **(5) v3 classifier cold-start 이슈** (engineStatus=unavailable). 이전: CW33-HF3 **프로덕션 검증 완료** — Chrome MCP API 8/8 + UI 5/5 green. API: T1 leather→4202210000 $50.83 / T2 knit→610910 / T3 woven→620620 / T4-T5 hsHint 4202.21=420221 정규화 동일 $1321.24 / T7 Li-ion 850760 HAZMAT / T8 CR2032 850650 HAZMAT / T9 forwarder 3 dest 610910. UI: 5 시나리오 전부 `pr-14` ✓ + Advanced `<details>` (category select + hsHint text) ✓ + Calculate required-only active ✓. 잔존 케어 1건: T6 pump 에서 machinery-pumps 힌트에도 classifier 가 840680 steam turbines 반환 — forwarding 자체는 정상, classifier keyword matching 품질 이슈. 다음 세션 우선순위: **(1) CW34 Sprint 1 — Multi-currency support** (Issue 2, 3층 작업: UI 통화 드롭다운 + API schema 에 `displayCurrency` 필드 + engine convertCurrency 로직 연결), **(2) Classifier keyword quality sweep** — pump/motor/engine machinery 하위 구분 (8406 vs 8413 vs 8414) 을 위해 hs_keywords 우선순위 재조정, **(3) weight_kg / shippingTerms advanced 필드 추가** (HF3 에서 category/hsHint 만 했으므로 잔여 — insurance 계산에 필요), **(4) v3 classifier pipeline 코드 refactor** (P0.11 잔여 — hs_codes/hs_keywords 테이블 사용), **(5) US state sales tax 2026 재수집** (S-01). 중장기 TODO: P1.2-P1.8 외부 API 계정 provisioning (DHL/FedEx/UPS, VIES wrapper, AWS Textract, Crisp, UptimeRobot), Vercel cron 등록 (일일 OFAC SDN + EU/UK/UN + ECB Frankfurter). 이전: CW33 + HF1 + HF2 진짜 완료 + Chrome MCP 프로덕션 9/9 검증 완료. 다음 세션 우선순위 (CW33-HF3): (1) **Issue 1 — input `pr-14` 핫픽스** — `components/home/NonDevPanel.tsx:282` 의 `className` 에 `pr-14` 추가, 5개 시나리오 모든 숫자 필드 겹침 해소 (5분 작업), (2) **Issue 3-A — HS 분류 힌트 UI** — NonDevPanel 의 5개 시나리오 `SCENARIO_FIELDS` 에 optional `category` (select) + `hsHint` (text) 필드 추가, advanced 접기 섹션 스타일, (3) **Issue 3-B — demo route forwarding** — `app/api/demo/scenario/route.ts:105~127` 의 `buildEngineInput()` 에서 `inputs.category` / `inputs.hsHint` → `GlobalCostInput.productCategory` / `hsCode` 로 매핑 (엔진은 이미 지원 — `GlobalCostEngine.ts:95-117`), (4) Chrome MCP 로 HF3 재검증 — leather wallet KR→US (4202.21 vs 4202.31 구분), cotton T-shirt knit/woven 구분, pump mechanism 구분 등 8 케이스 HS 정확도 측정. Issue 2 (currency 드롭다운) 는 CW34 Sprint 1 로 분리 — 영향 범위가 UI + API schema + engine convert 로직 3층. 이전: CW33 Sprint 1-6 완료 — 27 아이템, 23 테이블, 154,264 rows seeded. 필독: docs/CW33_COMPLETION_REPORT.md. 중장기 TODO: (1) v3 classifier pipeline 을 hs_codes/hs_keywords 테이블 사용하도록 리팩토 (P0.11 잔여), (2) US state sales tax 2026 실데이터 재수집 (S-01 pending), (3) P1 외부 API 계정 provisioning — DHL/FedEx/UPS developer, VIES wrapper, AWS Textract, Crisp, UptimeRobot, (4) Vercel cron 등록: 일일 OFAC SDN + EU/UK/UN sanctions re-sync + ECB Frankfurter rate fetch. 이전: CW33 Phase A-2 External Drive Inventory 완료 — 외장하드 983GB 스캔, CW33 🔴 19건 중 12건 즉시 seed 가능 (OFAC SDN 123MB + HTSUS 2026 + v3 codified rules + POTAL_Ablation_V2.xlsx 포함). P0 소요 29-31일→20-24일로 25% 단축. 다음 세션 우선순위: (1) 필독 docs/EXTERNAL_DRIVE_CW33_INVENTORY.md + docs/CW33_SCOPE.md 읽고 은태님 5개 결정 질문 확정, (2) CW33-S1 시작 전 US Sales Tax 2026 재수집 (S-01 선행 블로커), (3) CW33-S1 (FTA+Country+Restriction DB 이전) + CW33-S3 HS DB seed 스크립트 병렬 착수, (4) OFAC SDN XML streaming parser 설계 (sax-js 추천). 이전: CW33 Phase A Hardcoding Audit 완료 — 140 features 전수조사, 🔴 19 + 🟡 8 발견. 다음 세션 우선순위: (1) 은태님 결정 질문 4건 확인 (CW33_SCOPE.md §"선결 질문") — sanctions 예산, HS DB 이전 범위, exchange rate 소스, admin UI 범위, (2) CW33-S1 즉시 시작 — FTA+country+override+restriction DB 이전 (P0.1-P0.4, 6-8일 예상), (3) 관리자 UI 에서 FTA/override/restriction CRUD 가능 여부 조사. 필독: docs/HARDCODING_AUDIT.md + docs/CW33_SCOPE.md. 이전: CW32 "Correctness Sweep" 완료 — 홈페이지 데모 정확성 6건 전부 해소, 28/28 verify-cw32.mjs green. 다음 세션 우선순위: (1) 프로덕션 Chrome MCP 전수 재검증 (Cowork — 28 케이스 UI 라운드트립, 특히 forwarder `to:[...]` 호환성, SELLER 진입 초기값 자동 채워지는지, 리튬 HAZMAT 경고 문구), (2) Supabase fta_agreements 테이블에 UK-KR / KCFTA 영구 마이그레이션 (현재는 hardcoded fallback 경로로 동작), (3) Phase 2 traffic acquisition 시작 — SNS/SEO/Product Hunt 런칭. 이전: CW31-HF1 "완전판" 완료 — HAZMAT 경고 + forwarder multi-destination + DevPanel 4개 언어 snippet 치환. 21/21 케이스 live(p95 1195ms), CW31 non-forwarder 15 케이스 \$0.00 회귀 없음. 다음 세션 우선순위: (1) 프로덕션 브라우저 전수 검증 — forwarder 멀티 드롭다운 UX, 배터리 HAZMAT 경고 문구 가독성, DevPanel snippet 4개 언어 live 치환, (2) Phase 2 traffic acquisition (SNS/SEO/Product Hunt), (3) lint/type cleanup 별도 sprint). 이전: CW31 "정직한 리셋" 완료 — demo API가 실제 POTAL 엔진(`calculateGlobalLandedCostAsync`) 직접 호출. applyInputsToResult 가격 비율 스케일링/live-baseline.json/ts 삭제. 국가 드롭다운 10→240개, DevPanel 코드 스니펫 실시간 입력 반영. 18/18 case live(p95 670ms), KR→US wallet = $50.83 KORUS FTA 0% 정답. 다음 세션 우선순위: (1) 프로덕션 배포 후 Cowork 브라우저 검증 — 18 케이스 + 국가 드롭다운 UX + DevPanel 치환 확인, (2) restriction.blocked 엔진 노출 경로 설계 (exporter ECCN 경고 복구), (3) forwarder scenario 에 batch 엔드포인트 가능성 검토, (4) Phase 2 traffic acquisition 재개 — SNS/SEO/Product Hunt. 미해결: vercel --prod 수동 배포(GitHub-Vercel auto deploy 해제 상태), Vercel Support Case #01083440 대기 중)

---

## 🚨 CW23 첫 액션 (반드시 이 순서로)

### Step 0: 필독 문서 (코드 작업 전 반드시 읽기)
1. **`docs/HOMEPAGE_REDESIGN_SPEC.md`** — 홈페이지 리디자인 스펙 v1 (12가지 결정 + 7 디자인 원칙 + Sprint 1~8 로드맵) **최우선 필독**
2. `session-context.md` Section 10 CW22-S7 항목 — 전체 맥락
3. `CLAUDE.md` 절대 규칙 #1 (B2C 코드 수정 금지), #2 (build 확인 후 push), #9 (Forever Free 유지)

### Step 1: CW23 Sprint 1 구현 (홈페이지 뼈대)
목표: HeaderMinimal + LiveTicker(2줄) + ScenarioSelector(6버튼) + DesktopOnlyGuard

생성할 컴포넌트:
- `components/home/HeaderMinimal.tsx` — 로고 + Community + Help (Features/Developers/Pricing/Dashboard/Sign up 전부 제거)
- `components/home/LiveTicker.tsx` — 2줄 구조 + Live indicator 점 애니메이션 + 기관 풀네임
- `components/home/ScenarioSelector.tsx` — "당신의 수출입 방식은?" + 6버튼 (온라인 셀러 / D2C 브랜드 / 수입업자 / 수출업자 / 포워더·3PL / CUSTOM)
- `components/home/DesktopOnlyGuard.tsx` — 모바일 감지 시 "데스크톱에서 접속해주세요" 페이지로 리다이렉트 (태블릿은 데스크톱 뷰 유지)

### Step 2: 기존 app/page.tsx 처리
- **삭제 금지, 주석 처리만** — 기존 Hero/Features/Pricing 섹션들은 comment-out
- 이유: 롤백 가능성 + B2C 코드와의 의존관계 확인 필요
- 절대 규칙 #1 준수: lib/search/, lib/agent/, components/search/ 건드리지 말 것

### Step 3: 빌드 검증 (push 전 필수)
- `npm run build` 통과 확인
- 로컬 `npm run dev`에서 데스크톱/모바일 양쪽 확인
- 모바일 브라우저 시뮬레이션으로 DesktopOnlyGuard 동작 확인

### Step 4: 문서 업데이트 + push
- CLAUDE.md / CHANGELOG.md / session-context.md / NEXT_SESSION_START.md 4개 헤더 날짜 통일
- Notion Session Log + Task Board 업데이트
- git commit + push

---

## 📋 이월된 작업 (은태님 직접)
- **커뮤니티 댓글 활동** (CW22-S6에서 이월): Product Hunt + Reddit + Hacker News 관련 글에 POTAL 자연스럽게 언급 — 문서화 완료 후 은태님이 직접 진행

---

## ⚠️ CW23 작업 시 주의사항 (HOMEPAGE_REDESIGN_SPEC.md에서 발췌)
1. **"내 조합(My Combos)"은 CUSTOM 영역 전용** — 다른 5개 시나리오에는 절대 적용 금지 (Claude Code가 혼동하기 쉬움)
2. **140개 기능 전부 CUSTOM 체크박스에 노출** — "+더 보기" 숨김 처리 금지
3. **모바일 미지원** — 반응형 작업 금지, 모바일 접속 시 안내 페이지만
4. **광고 슬롯은 Phase 2로 미룸** — Sprint 1~4에서는 파트너 링크 슬롯 UI만 placeholder로
5. **Feature-level 코드 복사 버튼 [📋]** — 각 기능 카드에 개별 복사 버튼 (시나리오 전체 코드 X)
6. **Login-based Gating** — Rate Limit 방식 사용 금지, 특정 기능은 로그인 필수로 처리

---

## 현재 상태 요약

### 핵심 수치 (2026-04-08 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **마케팅/고객 확보가 최우선**
- **147/147 기능 구현** (100%, WON'T 2개 제외 = 140 Active + 5 보완 + 2 WON'T)
- **프론트엔드 도구 페이지**: ~79 신규 (Tools 34 + Dashboard 18 + Developer 5 + Learn/Cert/Integration/Features 개선)
- **사이트 총 페이지**: ~503페이지 (Vercel 빌드 기준)
- **전략**: Exit(인수) 확정 — Forever Free + 데이터 수집 → 인수
- **요금제**: Forever Free (140개 전부 무료) + Enterprise Contact Us
- **v3 파이프라인**: ✅ 21/21 Section 100%, codified-rules 595개
- **API 엔드포인트**: ~160개+, **Vercel Cron**: 25개
- **i18n**: 329키 × 7언어 (en/ko/ja/zh/es/de/fr) = 2,303 번역
- **Auto-Import**: 6/12 소스 자동화 (SDN, FR, TARIC, Trade Remedy, USITC, UK)
- **Data Ticker**: Supabase 실시간 + JSON fallback 자동 갱신 + 2줄 구조
- **인프라 비용**: 고정 ~$114/월, AI 호출 $0

---

## 가장 최근 세션: CW22-S6 (2026-04-09)

### 핵심 변경

**F148 US Sales Tax Nexus Tracking Forever Free 런칭 (커밋 e70868f):**
- 데이터: `data/us-nexus-thresholds.json` — 51개 주 + DC, Sales Tax Institute + 각 주 DOR 교차검증
- API: `POST /api/v1/nexus/check` (10 req/min/IP, X-Demo-Request 지원)
- UI: `/features/us-sales-tax-nexus-tracking` + Dashboard calcDest==='US' 조건부 섹션
- MCP: `check_us_nexus` 10번째 함수 추가, v1.4.2 → v1.4.3 (npm publish 완료)
- Cron: `us-nexus-threshold-check` 매년 1/1, 7/1 03:00 UTC — Telegram + Notion 알림
- Active 140 → **141**, Vercel Cron 24 → **25**, MCP tools 9 → **10**

**X(Twitter) 글자수 제한 강화:**
- daily-content-posting 스케줄 태스크 prompt 업데이트 — 각 트윗 280자 이내 검증 절차 + 플랫폼별 제한 테이블 추가
- 커뮤니티 댓글 활동(PH/Reddit/HN) 섹션도 prompt에 추가

**Vercel Cron 알림 환경변수 세팅 완료:**
- NOTION_API_KEY Vercel Production + .env.local + CREDENTIALS.md 기록
- NOTION_TASK_BOARD_DB_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 전부 확인됨

**외부 이슈 처리:**
- GitHub Reinstatement Request 제출 (Ticket #4248922 + 신규 폼)
- Vercel Support Case #01092535 오픈 (기존 #01083440 연속선)
- Vercel Support Neeraj Kumar: "중복이라 닫고 #01083440에서 계속 진행"

**P2 7개 stale cleanup:**
- F054/F082/F083/F105/F138/F140/F147 → 전부 이미 active (stale 정보였음)
- 실제 미구현: F045-F048 e-commerce 플러그인 4개만

### ⚠️ 이미 해결된 사항 (새 세션에서 다시 건드리지 말 것)
- **F148 US Nexus Tracking**: 완료. /features/us-sales-tax-nexus-tracking 배포됨
- **MCP v1.4.3**: npm publish 완료
- **Vercel Cron 알림 env vars**: 전부 세팅됨
- **X 글자수 제한**: daily-content-posting 스케줄 업데이트됨
- **데모 영상 STEP 1~5**: 전부 완료
- **YouTube 채널 생성**: @POTAL-Official, 10개 영상, 5개 플레이리스트
- **홈페이지 Video Guides + 플로팅 버튼**: 코드 배포됨

### 다음 세션에서 할 일
- **커뮤니티 댓글 활동 (Product Hunt + Reddit + Hacker News)** — CW22-S6에서 미완료
- **YouTube 나머지 17개 영상 업로드** — 10/27개 완료 (일일 제한 도달), 채널: youtube.com/@POTAL-Official
- **Vercel Support Case #01083440** — close 요청 예정
- **git rm docs/B2C_PLATFORM_STRATEGY.md** — Cowork에서 파일 삭제 권한 없어 POTAL Claude Code 터미널에서 직접 실행 필요:
  ```bash
  cd ~/potal && git rm docs/B2C_PLATFORM_STRATEGY.md && git commit -m "chore: remove B2C strategy doc (moved to ~/b2c-platform)"
  ```

### ⚠️ 미해결 사항
- ✅ **GitHub 계정 flagged → 자동 배포 장애** (해결 완료, 2026-04-09 17:56 KST)
  - GitHub Support Ticket #4248922 — Geoffrey가 계정 제약 해제
  - Vercel-GitHub 재연결 + 테스트 커밋 `f6b190c` 자동배포 성공 확인
  - CLAUDE.md 절대규칙 #11 삭제 완료, 세션 체크리스트에서 `vercel --prod` 제거 완료

### 이전 세션: CW22-S5 (2026-04-08)
- 데모 STEP 4-5 완성, YouTube @POTAL-Official 채널+10영상+5플레이리스트, 홈페이지 Video Guides+플로팅버튼, 커뮤니티 댓글 가이드(PH/Reddit/HN), Notion 가이드 3개 신규+4개 업데이트
- 커밋: da8bf33 (Video Guides), 20cce2d (YouTube 플로팅버튼)

---

## 다음 할 일 (우선순위)

### P0: GitHub 계정 복구 확인 → Vercel 연동 테스트
- GitHub 계정 flagged 복구 확인 → git push → Vercel 자동 배포 트리거 확인
- 복구 시: CLAUDE.md 규칙11 삭제, 세션 체크리스트 정리, CHANGELOG 기록

### P1: 마케팅 — YouTube + Product Hunt + 일일 콘텐츠 (최우선)
1. **YouTube 채널 세팅 + 업로드** — Notion 가이드 참조 (22개 롱폼 + 5개 쇼츠)
2. **Product Hunt 런칭** — Phase 1 코멘트 → Phase 2 런치 페이지 (Notion 가이드 참조)
3. **일일 콘텐츠 포스팅** — LinkedIn/X/Instagram/Threads (content-posting 스킬)
4. **LinkedIn 포스트** — 은태님 스토리 + 경쟁사 비교 차트
5. **Hacker News "Show HN"** — 카르마 필요
6. **Reddit** — r/ecommerce, r/shopify, r/entrepreneur
7. **커뮤니티 답변 활동** — Gemini 5개 언어권 프롬프트 준비 완료

### P3: 마켓플레이스 심사 확인 (외부 대기 — 2026-04-06 기준 전부 미승인)
1. **Shopify**: 3/10 제출, 27일+ 경과, 아직 미승인
2. **WooCommerce**: WordPress.org 심사 대기 (제출 2026-03-30)
3. **BigCommerce**: partners@bigcommerce.com 답장 대기 (발송 2026-03-30)
4. **Adobe Commerce**: W-8BEN 검토 대기 (제출 2026-03-30)

### P4: 기능 보완
- **Tool 페이지 i18n** — 새로 만든 ~79 페이지 다국어 지원
- **20개 Feature Guide 템플릿** — 121/140 완성
- **Auto-Import 나머지 6/12**
- **Layer 3 설계** (Enterprise Custom)

### P5: LLM 플랫폼 (외부 조건 대기)
- Microsoft Copilot: 365 Business 계정 필요
- Meta AI: 지역 제한
- xAI Grok: 앱 스토어 없음

---

## 자동화 파이프라인 현황

### ✅ 자동화 완료
| 파이프라인 | 구조 | 비고 |
|-----------|------|------|
| 1줄 티커 (데이터 업데이트 날짜) | Supabase 실시간 → JSON fallback 자동 갱신 | 배포마다 prebuild |
| 2줄 티커 (출처 발행일) | 모니터 감지 → Supabase `source_publications` → prebuild JSON | 감지 시 자동 |
| Auto-Import 6/12 | OFAC SDN, Federal Register, TARIC RSS, Trade Remedy, USITC, UK Trade Tariff | 감지→DB |
| Kill switch | `DISABLE_AUTO_IMPORT=true` 글로벌, `DISABLE_AUTO_IMPORT_OFAC_SDN=true` 소스별 | env var |

### ⏳ 수동 (향후 자동화 대상)
| 파이프라인 | 이유 |
|-----------|------|
| Auto-Import 나머지 6/12 | 웹 스크래핑/커스텀 파서 개발 필요 |
| i18n 새 텍스트 | 새 페이지 추가 시 수동 번역 추가 |
| Tool 페이지 i18n | ~79 새 페이지 다국어 미지원 |

---

## 파이프라인 건강도 지표 (CW22-S3 기준)

| 지표 | 값 | 상태 |
|------|-----|------|
| Section coverage | 21/21 | ✅ 100% |
| codified-rules | 595 | ✅ |
| 기능 구현율 | 147/147 (140 Active) | ✅ 100% |
| 프론트엔드 도구 UI | ~79 신규 페이지 | ✅ |
| 사이트 총 페이지 | ~503 | ✅ |
| i18n | 329키 × 7언어 | ✅ |
| Auto-Import | 6/12 소스 | ⏳ 50% |
| Data Ticker | Supabase 실시간 + 2줄 | ✅ |
| npm SDK | potal-sdk@1.1.0 | ✅ |
| PyPI SDK | potal@1.1.0 | ✅ |
| MCP Server | potal-mcp-server@1.4.2 | ✅ |
| Shopify | 심사 중 (27일+) | ⏳ |
| WooCommerce | 심사 중 (7일+) | ⏳ |
| regression test | 22/22 PASS | ✅ |

---

## 참조 파일 경로

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude Code 지침 (절대 규칙, 문서 업데이트 규칙) |
| `session-context.md` | 프로젝트 전체 맥락 + TODO + 히스토리 |
| `docs/CHANGELOG.md` | 코드 변경 기록 |
| `docs/CREDENTIALS.md` | API 키, Supabase 연결 |
| `.cursorrules` | 코딩 표준, 파일 매핑 |
| `docs/ORCHESTRATOR_RULES.md` | Chief Orchestrator 역할/규칙 |
| `docs/DIVISION_STATUS.md` | 16개 Division 상세 |

## 세션 시작 시 읽어야 할 파일 (순서)
1. `CLAUDE.md` — 규칙
2. `session-context.md` — 맥락 + TODO
3. 이 파일 (`docs/NEXT_SESSION_START.md`) — 최신 상태

---
## [Auto-saved] Compaction at 2026-04-06 15:04 KST
컨텍스트 압축 발생. 이전 대화가 요약됨.
압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조.

---
## [Auto-saved] Compaction at 2026-04-10 18:39 KST
컨텍스트 압축 발생. 이전 대화가 요약됨.
압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조.

---
## [Auto-saved] Compaction at 2026-04-13 12:40 KST
컨텍스트 압축 발생. 이전 대화가 요약됨.
압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조.
