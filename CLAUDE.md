# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-04-16
# 변경 이력은 docs/CHANGELOG.md 참조

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
13. **Subheading 오분류 수정 시 Decision Tree 패턴 사용 (CW34 신설)** — v3 파이프라인 Step 3-2(Subheading)에서 오분류 발생 시, SUBHEADING_SYNONYMS 하드코딩이 아닌 **checkDecisionTree() 패턴**으로 해결. WCO Explanatory Notes의 실제 분류 기준(article type, material surface, processing 등)을 heading별 decision tree로 코드화. 우선순위: synonym → decision tree → elimination/voting. 새 heading에 대한 decision tree 추가 시 regression 테스트 필수 (verify-cw32 + verify-cw33 전부 green). 근거: CW34-S1에서 wallet→420211 오분류 진단 — 원인 (c) 데이터 미사용: voting engine이 keyword 다중 매칭을 1표로 제한 + WCO 분류 기준(물건 종류+표면 소재)이 코드에 미반영. heading 4202 decision tree로 wallet→420231, handbag→420221, briefcase→420211 등 8/8 해결.
14. **모바일 반응형 불필요 (CW38 신설)** — POTAL 은 **데스크톱 전용** 플랫폼. 모바일 대응은 우선순위 대상 아님. UI 작업 시 모바일 breakpoint (sm:/md: 등) 고려하지 말고 **데스크톱 최적화에 집중**. 모바일 반응형 실측/검증 권고도 하지 말 것. 이유: POTAL 타겟 사용자(개발자/관세사/수출입 실무자)는 데스크톱에서 API 통합·분석 작업 수행. 모바일 대응은 엔지니어링 비용만 증가시키고 실사용 가치 낮음. 은태님 CEO 확정.
15. **전문가적 견해 + 객관적 판단 원칙 (CW38 신설)** — 모든 질문/제안에 대해 **해당 분야 최고 전문가 관점**에서 **객관적 판단**으로 답변. 원칙: (a) Pros/Cons 균형 제시 (장점만 나열 금지), (b) 업계 표준/베스트 프랙티스 근거 인용, (c) "맞아요" 반사적 동조 금지 (실제로 맞을 때만), (d) 과도한 엔지니어링 경고, (e) 측정 가능성 언급 (효과 확인 방법), (f) 사용자 직관 존중 + 비판적 검증, (g) 복잡성 증가 제안은 필요성 근거 제시 필수, (h) 작업량/리스크 낙관적 추정 금지 — 현실적 범위 제시. 근거: CW38 세션에서 옵션 3 과도 설계, Guide 콘텐츠 오버스펙 등 반복 발생 → 은태님 매번 단순화 교정 → CEO 프로덕트 감각이 엔지니어 직관보다 정확한 경우 多. 앞으로 **"필요한 것"에만 집중**.

---

## 📋 문서 업데이트 규칙 (작업 완료 시)

### 코드 작업 시 업데이트 (Claude Code 터미널)
| 파일 | 업데이트 내용 | 비고 |
|------|-------------|------|
| `CLAUDE.md` | 마지막 업데이트 날짜만 수정 | 이력은 CHANGELOG.md에 기록 |
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
