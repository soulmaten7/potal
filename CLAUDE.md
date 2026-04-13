# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-04-13 KST (CW34-S1 Option A: v3 pipeline 연결 — classifyWithOverrideAsync(material?, originCountry?, destinationCountry?) Stage 2 추가, V3PipelineResult→HsClassificationResult 매핑, confidence≥0.7 필터, demo route productMaterial 전달. 이전: CW34-S1 Playground UX 리뉴얼 — Seller Classify에 Material 필수 필드 추가 + 필드 순서 변경(ProductName→Material→Category→Origin→HSCode) + Material→Category 연동 필터링 + Required * 제거 + 센터패널 min-height. Material 106개 + Category 73개로 엔진 100% 커버 (26→106 material, 16→73 category). "Other" 제거 (DB에 category "other" HS코드 0개). 외장하드 keyword_index 기반 최종 24개 material 추가. MATERIAL_TO_CATEGORIES 106 매핑 전부 ≥1 category. Gap 0 검증 완료. 이전: CW33-HF3 프로덕션 검증 완료 — Chrome MCP API 8/8 + UI 5/5 green. 5 시나리오 전부 `pr-14` 겹침 해소 + Advanced `<details>` category/hsHint + Calculate required-only active 자동 확인. declared value "1234567" 직접 타이핑 → USD 라벨 겹침 없음 시각 확인. T1 leather→4202210000 $50.83 / T2 knit→610910 / T3 woven→620620 / T4-T5 hsHint 4202.21=420221 정규화 동일 $1321.24 / T7 Li-ion 850760 HAZMAT / T8 CR2032 850650 HAZMAT / T9 forwarder 3 dest 610910 전부 프로덕션 live 확인. 잔존: T6 pump 에서 machinery-pumps 힌트에도 classifier 가 840680 steam turbines 반환 — forwarding 자체는 정상, hs_keywords 품질 이슈로 CW34 에서 처리. 이전: CW33-HF3 구현 — (S1) `components/home/NonDevPanel.tsx:292` input className `px-3` → `pl-3 pr-14`, 5 시나리오 숫자 필드의 USD/units 라벨 겹침 완전 해소. (S2) `FieldDef` 에 `optional`+`helper` 프로퍼티 추가, `CATEGORY_OPTIONS` 16 enum 신설 (apparel-knit/woven, leather-goods, machinery-pumps, electronics-battery 등), `HS_HINT_FIELDS` (category select + hsHint text) 를 5 시나리오 전부에 append, `renderField()` 함수 추출해 required vs optional 두 덩어리로 분리 렌더, optional 필드는 collapsed `<details>` "Advanced — HS classification hints" 섹션에 들어감. `allFilled` 체크가 required 필드만 평가하므로 optional 비어도 Calculate 버튼 active. helper 텍스트 label 아래 10px 슬레이트. (S3) `app/api/demo/scenario/route.ts` `buildEngineInput()` + `buildForwarderInputs()` 가 `inputs.category` → `productCategory`, `inputs.hsHint` → `hsCode` 로 forwarding. 신규 `normalizeHsHint()` 헬퍼: "4202.21"/"4202 21"/"42.02.21.00" → "420221" (숫자만, ≥4자리 필터, 10자리 cap). 엔진의 `classifyWithOverride(productName, hsCode, productCategory)` 3 파라미터 풀가동. 로컬 검증: verify-cw32 28/28 green, verify-cw33 23/23 green, category=leather-goods → hs 4202210000 ($50.83), apparel-knit → hs 610910, hsHint "4202.21" 과 "420221" 동일 결과 ($870.42) 정규화 확인, CR2032 primary+category → hs 850650 + HAZMAT "Primary Lithium Cells" 보존, forwarder 3 dest + category → 3 rows hs 610910. Issue 2 (currency) 는 CW34-S1 로 분리 보류. 475 pages ✓. 이전: CW33 + HF1 + HF2 프로덕션 검증 완료 — "No Fake, All Real" 진짜 완료 판정. Chrome MCP로 www.potal.app 9/9 케이스 전수 검증: 원본 5개 (cotton importer IN→US / cotton exporter KR→US / water pump exporter KR→VN / Li-ion exporter KR→US / CR2032 exporter KR→US) + 다양성 4개 (cotton importer 재시도 2회 / leather importer IT→US / Li-ion importer CN→US) 전부 ✅. HF1: `app/lib/cost-engine/screening/index.ts` 가 `db-screen.ts` 의 `screenPartyDb`/`screenPartiesDb` 를 canonical name 으로 re-export, 5 call site async-await 전환 → 47,926 row `sanctioned_entities` 테이블이 실제 API 경로에 연결됨 (이전엔 orphaned 상태였음). HF2: `lib/scenarios/mock-results.ts` 6개 canned 시나리오 200+ lines → 1개 NEUTRAL_EMPTY shell 33 lines (256 deleted, 33 added). importer canned text ("Standard machinery import to Korea") / exporter canned text ("Dual-use: ECCN 3A001") / exporter mock 동일 응답 버그 (hs=8507.60 / total=$266,450 for both pump and LED) 전부 제거. `app/api/demo/scenario/route.ts` restrictionSummary 우선순위 체인 재설계 (checkRestrictions DB → engine note → fallback "No active import restrictions detected for HS X → Y"). `X-Engine-Status: ok|unavailable|not-attempted` 헤더 신설 → cold-start 가짜값 대신 정직한 진단 노출. HAZMAT DB hit ("Lithium Batteries: …IATA DGR…", "Primary Lithium Cells: …") 보존 확인. 잔존 백로그: AI classifier cold-start 첫 콜 가끔 `engineStatus=unavailable` (이전엔 canned fake 반환, 이제 헤더로 정직 surface — 실질 품질 개선). 홈페이지 UI 검증 중 3건 신규 발견: (1) Declared value 숫�자+USD 라벨 input 겹침 (`pr-14` 필요), (2) currency 드롭다운 없음 (엔진은 convertCurrency 이미 지원하지만 demo route 가 USD 고정), (3) HS 분류기 입력 productName 자유텍스트 1개에만 의존 (엔진은 productCategory/hsCode/weight_kg/firmName 지원하지만 UI 가 미사용). → CW33-HF3 로 Issue 1 + 3-A/B 처리 예정. 475 pages ✓. 이전: CW33 전체 Sprint 1-6 완료 — "No Fake, All Real": 23 테이블, 154,264 rows 시드 (CW33-S1 foundation 3,260 + S2 US/EU tax 937 + S3 classifier/HS/brands 77,709 + S4 sanctions 47,926 + S5 currency/AD-CVD 24,484 + S6 P1 scaffolding 71). 27 아이템 전부 진척 (P0 19 완료 + P0.11 v3 classifier 심화 통합만 pending, P1.1/P1.6 seed + P1.2-8 external-API 레지스트리 등록). mergeWithHardcoded/deterministicOverride/SANCTION_ENTRIES 65개 전부 DB-first로 대체. verify-cw32 28/28 green, verify-cw33 23/23 green. 상세: docs/CW33_COMPLETION_REPORT.md. 475 pages ✓. 이전: CW33-S1 Foundation 완료 — migration 062_cw33_foundation.sql 적용 (fta_product_rules + hs_classification_overrides), fta_agreements 12→65 (UK-KR + KCFTA 포함), fta_members 109→559, fta_product_rules 2209 rules seed (USMCA/RCEP/CPTPP/EU-UK-TCA/KORUS), hs_classification_overrides 6 rows seed (CW32 deterministicOverride regex → DB), restricted_items 73→161 (HS 8506/8507 lithium HAZMAT 포함), ai-classifier-wrapper.ts deterministicOverride() 함수 DB-first 재작성, fta-db.ts mergeWithHardcoded() **제거**. verify-cw32 28/28 green 유지. Sprint 2-6 진행 예정. 475 pages ✓. 이전: CW33 Phase A-2 "External Drive Inventory" 완료 — /Volumes/soulmaten/POTAL/ 실측 983GB 스캔, CW33 🔴 19건 매핑: 🟢 12 Ready (OFAC SDN 123MB XML + HTSUS 2026 + tlc_data 전체 + v3 codified rules + POTAL_Ablation_V2.xlsx 포함) / 🟡 4 Partial / 🔴 3 Missing. CW33-S4 Sanctions sync 난이도 XL→L, CW33-S3 HS DB 이전 XL→M. 산출물 2개 (EXTERNAL_DRIVE_CW33_INVENTORY.md + RAW.txt 771 lines). 파일 수정/복사 0건. 475 pages ✓. 이전: CW33 Phase A "Hardcoding Audit" 완료 — 140 features + 12 engine sub-systems 전수조사: 🔴 Critical 19건 (DB 이전 필수, P0), 🟡 Important 8건 (외부 API 연동, P1), 🟢 Acceptable 73건 (UI seed), ⚪ Legal/Static 40건. CW32 mergeWithHardcoded/deterministicOverride 전부 🔴 확정. 산출물: docs/HARDCODING_AUDIT.md + CW33_SCOPE.md + HARDCODING_AUDIT_RAW.txt. 코드 수정 0, 읽기 전용 감사. 475 pages ✓. 이전: CW32 "Correctness Sweep": Korea-UK FTA + KCFTA 엔진 fta-db mergeWithHardcoded 경로 추가, ai-classifier-wrapper 에 deterministicOverride (8506 primary lithium, 8507 lithium-ion, 610910 cotton t-shirt) 를 cache 이전에 주입하여 리튬 HAZMAT 및 cotton HS drift 전부 해소, forwarder 시나리오 `to` 필드 fallback(array/string/destinations) 허용, localhost rate-limit 면제, SCENARIO_DEFAULTS 를 ScenarioPanel 초기 state 에 seed하여 첫 진입 시 Calculate 버튼 active. 28/28 verify-cw32.mjs green, p50 400ms / p95 1514ms. 475 pages ✓)

## 터미널 구조 (고정)
| 터미널 | 모델 | 용도 | 실행 명령어 |
|--------|------|------|-----------|
| 터미널1 | Opus | Cowork 대화 → 명령어 바로 실행. 메인 작업용 | `cd ~/potal && claude --dangerously-skip-permissions` |
| 터미널2 | Sonnet | 보조 작업, 병렬 실행 | `cd ~/potal && claude --dangerously-skip-permissions --model sonnet` |
| 터미널3 | Opus | 오래 걸리는 디테일 작업 전용 | `cd ~/potal && claude --dangerously-skip-permissions` |
| 터미널4 | — | Mac 터미널 (git push, 시스템 명령어) | 일반 터미널 |

---

## 🚨 필수 지침 (모든 작업보다 우선)
1. **Notion에 로그 기록** — Cowork에서 Session Log DB에 세션 기록 추가 (엑셀 로깅 폐지)
2. **코드 작업 완료 시** — CLAUDE.md 헤더 날짜 + CHANGELOG.md + session-context.md 업데이트
3. **작업/마케팅/비용 관리** — Notion "POTAL Command Center"에서 관리 (Task Board, Content Pipeline, Finance Tracker)
4. **로그 없으면 미완료** — 빌드 성공해도, 테스트 통과해도, 기록 없으면 미완료

> ⚠️ 엑셀 로깅(Work_Log.xlsx, Cowork_Session_Log.xlsx, D9~D15 엑셀) 은 2026-03-31부터 폐지.
> 모든 관리는 Notion으로 이전됨. 상세: Notion "POTAL Notion 사용 설명서" 참조.

---

## 절대 규칙
1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 보존만
2. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
3. **session-context.md에 없는 숫자 만들기 금지** — 근거 없는 수치 사용 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **Git push는 Claude Code 터미널에서 직접 가능** — 별도 Mac 터미널 불필요
7. **터미널 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 금지
8. **문서 업데이트 시 날짜+시간(KST) 기록 필수**
9. **유료 플랜 재도입 금지** — Forever Free 구조 유지 (CW22 CEO 확정). Enterprise Contact Us만 허용
10. **HS Code 벤치마크 오류 시 `archive/benchmarks/POTAL_Ablation_V2.xlsx` 대조 필수**
11. **CW 넘버링 규칙 (CW31 신설)** — 작업은 `CW{주차}-{종류}{번호}` 포맷으로 라벨링. 종류: `S`=Sprint (계획된 중대 작업), `HF`=Hotfix (이미 배포된 코드의 긴급 수정). 별도 종류 없이 `CW31`처럼만 쓰면 해당 주차의 주요 작업(Sprint/Hotfix 구분이 애매하거나 근본 재작업일 때). 커밋 메시지/세션 문서/Notion Task Board 모두 같은 라벨 사용. 근거: CW30-HF4 다음 작업이 "CW31-?"인지 "CW31-HF5"인지 애매했음 — "정직한 리셋"은 Hotfix가 아닌 근본 재작업이므로 그냥 `CW31`.
12. **오류 발생 시 하드코딩 금지 — 근본 원인 진단 우선 (CW34 신설)** — 하드코딩(synonym 수동 추가, 키워드 직접 삽입, 특정 값 if문 분기 등)은 근본적인 해결책이 절대 아님. 오류 발생 시 반드시 아래 3가지 원인 중 어디에 해당하는지 먼저 진단: (a) **데이터 부족** — 원본 소스 자체에 해당 데이터가 없음 (b) **코드화/매핑 오류** — 원본에는 있는데 변환/코드화 과정에서 누락 또는 잘못 매핑됨 (c) **데이터 미사용** — 코드화된 데이터는 있는데 파이프라인이 해당 데이터를 읽지 않음. 진단 결과에 따라 원본 데이터 보강 / 변환 로직 수정 / 파이프라인 연결 수정으로 해결. POTAL은 정답이 있는 시스템 — 계산법이 존재하고, 올바른 입력이 들어가면 정확한 결과가 나옴. 입력 경로를 추적해서 어디서 끊겼는지 찾는 것이 핵심.

---

## 📋 문서 업데이트 규칙 (작업 완료 시)

### 코드 작업 시 업데이트 (Claude Code 터미널)
| 파일 | 업데이트 내용 | 비고 |
|------|-------------|------|
| `CLAUDE.md` | 마지막 업데이트 날짜 + 핵심 변경사항 1줄 | 헤더의 날짜/내용만 수정 |
| `CHANGELOG.md` | 날짜 + 변경사항 (기능/수정/삭제) 기록 | 가장 위에 추가 |
| `session-context.md` | 완료항목 체크, 새 항목 추가 | 수치 변경 시 수치도 업데이트 |

### Notion에서 업데이트 (Cowork에서 처리)
| Notion DB | 업데이트 내용 | 비고 |
|-----------|-------------|------|
| **Session Log** | 세션명, 날짜, 요약, 커밋 해시 | 문서 업데이트 시 함께 (세션 종료 안 기다림) |
| **Task Board** | 작업 상태 변경 (To Do → Done) | 작업 완료 시 |
| **Content Pipeline** | 콘텐츠 상태 변경 | 영상/SNS 작업 시 |
| **Marketplace Tracker** | 심사 상태 변경 | 결과 도착 시 |
| **Finance Tracker** | 비용/수익 변동 | 변동 있을 때 |

### 해당 시 업데이트 (변경이 있을 때만)
| 파일 | 트리거 조건 |
|------|-----------|
| `.cursorrules` | 파일 구조 변경, 새 컴포넌트 추가 |
| `docs/PROJECT_STATUS.md` | 수치 변경 (기능 수, API 수, 사용자 수 등) |
| `docs/CREDENTIALS.md` | API 키 추가/변경 |
| `docs/DIVISION_STATUS.md` | Division 상태 변경 |

---

## 폴더 구조
```
potal/
├── app/                    ← 코드
├── docs/                   ← Claude Code용 문서
├── content/                ← 콘텐츠 제작 참고 파일
│   ├── demo-scripts/       ← 데모 영상 대본 엑셀
│   ├── social-media/       ← 플랫폼별 글/해시태그
│   ├── thumbnails/         ← 썸네일/이미지
│   └── recordings/         ← 녹화 완성본
├── archive/                ← 과거 기록 (건드리지 않아도 됨)
│   ├── commands/           ← 과거 Claude Code 명령어
│   ├── benchmarks/         ← 과거 벤치마크 결과
│   ├── audits/             ← 과거 감사 결과
│   └── cold-email/         ← 과거 콜드이메일 캠페인
├── CLAUDE.md               ← Claude Code 설정 (이 파일)
├── session-context.md      ← 프로젝트 맥락
└── README.md
```

## 참조 파일 (필요 시 읽기)
| 파일 | 내용 | 언제 읽나 |
|------|------|----------|
| `session-context.md` | 프로젝트 전체 맥락, 히스토리 | 매 세션 시작 시 |
| `.cursorrules` | 코딩 표준, 파일 매핑 | 코드 작업 시 |
| `docs/CREDENTIALS.md` | 인증정보, Supabase 연결 | API/DB 작업 시 |
| `docs/ORCHESTRATOR_RULES.md` | Chief Orchestrator 역할/규칙 | COO 가동 시 |
| `docs/DIVISION_STATUS.md` | 16개 Division 상세 | Division 작업 시 |
| `app/features/features-guides.ts` | 140개 기능 가이드 데이터 | Features 작업 시 |
| `docs/HOMEPAGE_REDESIGN_SPEC.md` | 홈페이지 리디자인 스펙 v1 (12 결정) | **CW23+ 홈페이지 작업 시 최우선 필독** |
| `docs/EXTERNAL_DRIVE_FILES.md` | 외장하드 전체 파일 리스트 + 용도 설명 | 데이터 import, 벤치마크, v3 파이프라인 작업 시 |

### 외장하드 파일 관리 규칙 (CW34 신설)
- **`docs/EXTERNAL_DRIVE_FILES.md`** 에 외장하드(`/Volumes/soulmaten/POTAL/`) 전체 파일 리스트 유지
- 외장하드에 파일을 새로 저장하거나 import할 때 **반드시 이 리스트 업데이트**
- 파일명만으로도 용도를 유추할 수 있도록 간단한 설명 포함 (예: `keyword_index.json — 171개 material/form 키워드, v3 subheading scoring용`)
- 새 세션에서 "이 데이터 어디있지?" 질문이 나오면 이 파일부터 확인
- **근거**: CW34에서 keyword_index.json, master_classification_engine.json 등 외장하드 데이터가 프로젝트에 미연결된 채 방치된 것을 발견. 파일 목록이 없어서 존재 여부 파악에 시간 소모

---

## 🔒 하네스 규칙 (자동 강제 — 부탁이 아닌 시스템)

### 세션 종료 시 자동 검증 (stop-reminder.sh hook)
- Hook이 4개 문서(CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md) 헤더 날짜를 자동 검증
- 오늘 날짜가 아니면 ❌ 표시 → **반드시 업데이트 후 push**
- git 미커밋/미push 상태도 자동 감지

### 가비지 컬렉션 (세션 시작 시 필수)
- **매 세션 시작 시** session-context.md의 `## 2. 현재 TODO` 섹션을 점검
- 이미 완료된 항목이 TODO에 남아있으면 즉시 제거 또는 취소선 처리
- 날짜가 1주일 이상 지난 "대기 중" 항목은 날짜 갱신 필요 여부 확인
- **근거**: CW22-S에서 "FIX 17개 미완료"가 실제로는 CW20에서 완료된 항목이었음. 오래된 정보가 다음 세션 판단을 오염시킴

### 문서 4개 날짜 일치 규칙
- 코드 작업이 있는 세션에서는 4개 문서 헤더 날짜가 **반드시 오늘 날짜**여야 함
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md
- **근거**: CW22-S에서 CHANGELOG.md에 CW22-S 섹션 누락, NEXT_SESSION_START.md가 2주 전 날짜로 멈춰있었음

---

## 세션 종료 체크리스트
- [ ] git push 완료
- [ ] **코드 문서 4개 날짜 확인**: CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md (hook이 자동 검증)
- [ ] **session-context.md**: 이번 세션 CW##-X 완료 블록 추가됨
- [ ] **Notion**: Session Log에 세션 기록 추가 (Cowork에서)
- [ ] **Notion**: Task Board 상태 업데이트 (Cowork에서)
- [ ] 해당 시: .cursorrules, PROJECT_STATUS.md, CREDENTIALS.md, DIVISION_STATUS.md

---

## 은태님 스타일
- 코딩 초보자 — 기술 설명 간결, 작업은 직접 해줘야 함
- 정확성 최우선, 과장 표현 싫어함
- 한국어 소통, 코드/기술 용어는 영어 그대로
- **영문 콘텐츠 작성 시 한글 번역 필수** — 이메일, 답장, SNS 글, DM 등 영어로 쓴 모든 글에 한글 버전을 항상 함께 제공
