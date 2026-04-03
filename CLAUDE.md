# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-04-03 11:30 KST (CW22-O: HS Classification 정확도 미터 UI 추가 — 실시간 정확도 바 + 필드 힌트 + 신뢰도 배지 + Material 5개 추가)

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
6. **Git push는 Mac 터미널에서** — VM/EC2에서 push 불가
7. **터미널 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 금지
8. **문서 업데이트 시 날짜+시간(KST) 기록 필수**
9. **유료 플랜 재도입 금지** — Forever Free 구조 유지 (CW22 CEO 확정). Enterprise Contact Us만 허용
10. **HS Code 벤치마크 오류 시 `archive/benchmarks/POTAL_Ablation_V2.xlsx` 대조 필수**

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

---

## 세션 종료 체크리스트
- [ ] git push 완료
- [ ] **코드 문서 3개**: CLAUDE.md, CHANGELOG.md, session-context.md
- [ ] **Notion**: Session Log에 세션 기록 추가 (Cowork에서)
- [ ] **Notion**: Task Board 상태 업데이트 (Cowork에서)
- [ ] 해당 시: .cursorrules, PROJECT_STATUS.md, CREDENTIALS.md, DIVISION_STATUS.md

---

## 은태님 스타일
- 코딩 초보자 — 기술 설명 간결, 작업은 직접 해줘야 함
- 정확성 최우선, 과장 표현 싫어함
- 한국어 소통, 코드/기술 용어는 영어 그대로
- **영문 콘텐츠 작성 시 한글 번역 필수** — 이메일, 답장, SNS 글, DM 등 영어로 쓴 모든 글에 한글 버전을 항상 함께 제공
